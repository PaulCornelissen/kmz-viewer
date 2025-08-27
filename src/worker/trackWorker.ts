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
        let kmlText = ''
        try {
            const zip = await JSZip.loadAsync(fileBuffer)
            const kmlEntry = Object.values(zip.files).find(f => f.name.toLowerCase().endsWith('.kml'))
            if (!kmlEntry) throw new Error('Geen .kml gevonden in KMZ')
            kmlText = await kmlEntry.async('text')
        } catch {
            // Niet-zip: behandel als plain KML
            kmlText = new TextDecoder('utf-8').decode(new Uint8Array(fileBuffer))
        }


        const points = parsePointsFromKml(kmlText)
        if (points.length < 2) throw new Error('Geen bruikbare trackpunten gevonden')


        const paramsFull: AnalyseParams = { ...DEFAULT_PARAMS, ...(params || {}) }
        const { rides, stops, totalDistanceM, bbox } = analyze(points, paramsFull)
        const result: AnalysisResult = { points, rides, stops, totalDistanceM, bbox, params: paramsFull }


            ; (self as unknown as Worker).postMessage({ ok: true, result })
    } catch (e: unknown) {
        const message = e instanceof Error ? e.message : String(e)
        ; (self as unknown as Worker).postMessage({ ok: false, error: message })
    }
}


// --- KML parsing helpers ---
function parsePointsFromKml(kml: string): Point[] {
    // Probeer eerst gx:Track (aanbevolen)
    const hasGxTrack = /<gx:Track>/i.test(kml)
    if (hasGxTrack) return parseGxTrack(kml)


    // Fallback: LineString <coordinates> zonder <when> → veronderstel 60s interval
    const coordRegex = /<coordinates>([\s\S]*?)<\/coordinates>/gi
    const allCoords: number[][] = []
    let m: RegExpExecArray | null
    while ((m = coordRegex.exec(kml))) {
        const coords = m[1]
            .trim()
            .split(/\s+/)
            .map(s => s.split(',').map(Number)) // [lon, lat, alt?]
            .filter(a => a.length >= 2 && isFinite(a[0]) && isFinite(a[1]))
        allCoords.push(...coords)
    }
    if (allCoords.length === 0) return []

    const startT = Date.now()
    return allCoords.map((a, i) => ({
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