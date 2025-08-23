
/// <reference lib="webworker" />

import JSZip from 'jszip'
import type { AnalyseParams, AnalysisResult, Point } from '../types'
import { analyze } from '../lib/segmentation'


const DEFAULT_PARAMS: AnalyseParams = {
    vMinKmh: 2,
    dMinM: 50,
    rideMinMin: 3,
    stopMinMin: 5,
    gapSplitMin: 20,
}


self.onmessage = async (ev: MessageEvent) => {
    const { fileBuffer, params } = ev.data as { fileBuffer: ArrayBuffer, params?: Partial<AnalyseParams> }
    try {
        const zip = await JSZip.loadAsync(fileBuffer)
        const kmlEntry = Object.values(zip.files).find(f => f.name.toLowerCase().endsWith('.kml'))
        if (!kmlEntry) throw new Error('Geen .kml gevonden in KMZ')


        const kmlText = await kmlEntry.async('text')
        const points = parsePointsFromKml(kmlText)
        if (points.length < 2) throw new Error('Geen bruikbare trackpunten gevonden')


        const paramsFull: AnalyseParams = { ...DEFAULT_PARAMS, ...(params || {}) }
        const { rides, stops, totalDistanceM, bbox } = analyze(points, paramsFull)
        const result: AnalysisResult = { points, rides, stops, totalDistanceM, bbox, params: paramsFull }


            ; (self as unknown as Worker).postMessage({ ok: true, result })
    } catch (e: any) {
        ; (self as unknown as Worker).postMessage({ ok: false, error: e?.message || String(e) })
    }
}

// --- KML parsing helpers ---
function parsePointsFromKml(kml: string): Point[] {
    // Probeer eerst gx:Track (aanbevolen)
    const hasGxTrack = /<gx:Track>/i.test(kml)
    if (hasGxTrack) return parseGxTrack(kml)


    // Fallback: LineString <coordinates> zonder <when> → veronderstel 60s interval
    const coordsMatch = kml.match(/<coordinates>([\s\S]*?)<\/coordinates>/i)
    if (!coordsMatch) return []
    const coordsText = coordsMatch[1].trim()
    const coords = coordsText
        .split(/\s+/)
        .map(s => s.split(',').map(Number)) // [lon, lat, alt?]
        .filter(a => a.length >= 2 && isFinite(a[0]) && isFinite(a[1]))


    const startT = Date.now()
    return coords.map((a, i) => ({
        t: startT + i * 60000,
        lon: a[0],
        lat: a[1],
        alt: a[2] ?? null,
    }))
}


function parseGxTrack(kml: string): Point[] {
    // Eenvoudige streaming-achtige parse via regex; snel zat voor 100k+ punten
    const when: number[] = []
    const lon: number[] = []
    const lat: number[] = []
    const alt: (number | null)[] = []


    // Collect all <when> timestamps
    const whenRegex = /<when>(.*?)<\/when>/g
    let m: RegExpExecArray | null
    while ((m = whenRegex.exec(kml))) {
        const t = Date.parse(m[1].trim())
        if (!Number.isNaN(t)) when.push(t)
    }


    // Collect all <gx:coord> (lon lat alt)
    const coordRegex = /<gx:coord>(.*?)<\/gx:coord>/g
    while ((m = coordRegex.exec(kml))) {
        const parts = m[1].trim().split(/\s+/).map(Number)
        lon.push(parts[0])
        lat.push(parts[1])
        alt.push(parts.length > 2 && isFinite(parts[2]) ? parts[2] : null)
    }


    const n = Math.min(when.length, lon.length, lat.length)
    const pts: Point[] = new Array(n)
    for (let i = 0; i < n; i++) {
        pts[i] = { t: when[i], lon: lon[i], lat: lat[i], alt: alt[i] }
    }
    return pts
}