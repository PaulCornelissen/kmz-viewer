import React, { useEffect, useRef } from 'react'
import type { AnalysisResult, Ride } from '../types'
import Plotly from 'plotly.js-dist-min'


export function SpeedChart({ data, ride }: { data: AnalysisResult | null, ride: Ride | null }) {
    const ref = useRef<HTMLDivElement | null>(null)


    useEffect(() => {
        if (!ref.current) return
        if (!data || !ride) { ref.current.innerHTML = '<div class="muted">Geen rit geselecteerd</div>'; return }


        const pts = data.points.slice(ride.startIdx, ride.endIdx + 1)
        const x = pts.map(p => new Date(p.t))
        const y = pts.map(p => p.speedKmh || 0)


        const trace = { x, y, mode: 'lines', type: 'scattergl', name: 'Snelheid (km/h)' }
        const layout = {
            margin: { l: 40, r: 10, t: 10, b: 30 },
            paper_bgcolor: 'rgba(0,0,0,0)', plot_bgcolor: 'rgba(0,0,0,0)',
            xaxis: { title: 'Tijd', gridcolor: '#374151' },
            yaxis: { title: 'km/h', gridcolor: '#374151' },
            font: { color: '#e5e7eb' },
        }


        Plotly.newPlot(ref.current, [trace], layout, { responsive: true, displaylogo: false })
        return () => { Plotly.purge(ref.current!) }
    }, [data, ride])


    return <div className="chart" ref={ref} />
}