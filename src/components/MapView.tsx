import React, { useEffect, useRef } from 'react'
import maplibregl, { LngLatBoundsLike, LngLatLike, Map } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import type { AnalysisResult, Ride } from '../types'


function rideColor(i: number) {
    const palette = [
        '#60a5fa', '#f472b6', '#34d399', '#fbbf24', '#a78bfa', '#fb7185', '#22d3ee', '#4ade80'
    ]
    return palette[(i - 1) % palette.length]
}


export function MapView({ data, selectedRide, onSelectRide }: {
    data: AnalysisResult | null,
    selectedRide: number | null,
    onSelectRide: (id: number | null) => void
}) {
    const mapRef = useRef<Map | null>(null)
    const divRef = useRef<HTMLDivElement | null>(null)


    // init map once
    useEffect(() => {
        if (!divRef.current || mapRef.current) return
        const map = new maplibregl.Map({
            container: divRef.current,
            style: {
                version: 8,
                sources: {
                    osm: {
                        type: 'raster',
                        tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
                        tileSize: 256,
                        attribution: '© OpenStreetMap contributors'
                    }
                },
                layers: [
                    { id: 'osm', type: 'raster', source: 'osm' },
                ]
            },
            center: [5.1214, 52.0907] as LngLatLike, // NL
            zoom: 5
        })
        mapRef.current = map


        return () => { map.remove(); mapRef.current = null }
    }, [])


    // render data
    useEffect(() => {
        const map = mapRef.current
        if (!map) return


        // cleanup old layers/sources
        for (const id of ['track', 'stops']) {
            if (map.getLayer(id)) map.removeLayer(id)
            if (map.getSource(id)) map.removeSource(id)
        }
        data?.rides.forEach(r => {
            const lid = `ride-${r.id}`
            if (map.getLayer(lid)) map.removeLayer(lid)
            if (map.getSource(lid)) map.removeSource(lid)
        })


        if (!data) return


        // Add rides as separate sources/layers for easy coloring and click handling
        data.rides.forEach(r => {
            const coords = data.points.slice(r.startIdx, r.endIdx + 1).map(p => [p.lon, p.lat])
            const sourceId = `ride-${r.id}`
            map.addSource(sourceId, {
                type: 'geojson',
                data: { type: 'Feature', properties: { id: r.id }, geometry: { type: 'LineString', coordinates: coords } }
            })
            map.addLayer({
                id: sourceId,
                type: 'line',
                source: sourceId,
                paint: {
                    'line-color': rideColor(r.id),
                    'line-width': selectedRide === r.id ? 8 : 5,
                    'line-opacity': selectedRide && selectedRide !== r.id ? 0.5 : 1.0
                }
            })


            map.on('click', sourceId, () => onSelectRide(r.id))
            map.on('mouseenter', sourceId, () => (map.getCanvas().style.cursor = 'pointer'))
            map.on('mouseleave', sourceId, () => (map.getCanvas().style.cursor = ''))
        })


        // Stops as points
        const stopFeatures = data.stops.map(s => ({
            type: 'Feature',
            properties: { id: s.id, duration: s.durationS },
            geometry: { type: 'Point', coordinates: [s.centroid.lon, s.centroid.lat] }
        })) as any


        map.addSource('stops', { type: 'geojson', data: { type: 'FeatureCollection', features: stopFeatures } })
        map.addLayer({
            id: 'stops', type: 'circle', source: 'stops', paint: {
                'circle-radius': 5,
                'circle-color': '#fbbf24',
                'circle-opacity': 0.9,
                'circle-stroke-color': '#111827', 'circle-stroke-width': 1
            }
        })


        // fit bounds
        const b = data.bbox
        const pad = 0.05
        const bounds: LngLatBoundsLike = [
            [b[0] - pad, b[1] - pad],
            [b[2] + pad, b[3] + pad]
        ]
        map.fitBounds(bounds, { padding: 40, duration: 600 })
    }, [data, selectedRide])


    return <div ref={divRef} className="map" />
}