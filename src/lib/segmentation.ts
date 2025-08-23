import type { AnalyseParams, Point, Ride, Stop } from "../types";
import { haversineM, bboxOf } from "./geo";


export function analyze(points: Point[], params: AnalyseParams) {
    // compute deltas
    let totalDistanceM = 0;
    for (let i = 0; i < points.length; i++) {
        const p = points[i];
        if (i === 0) { p.distM = 0; p.speedKmh = 0; continue; }
        const q = points[i - 1];
        const dist = haversineM(q.lat, q.lon, p.lat, p.lon);
        const dt = Math.max(1, (p.t - q.t) / 1000); // sec
        p.distM = dist;
        p.speedKmh = (dist / 1000) / (dt / 3600);
        totalDistanceM += dist;
    }


    const rides: Ride[] = [];
    const stops: Stop[] = [];


    const { vMinKmh, dMinM, rideMinMin, stopMinMin, gapSplitMin } = params;
    const rideMinS = rideMinMin * 60;
    const stopMinS = stopMinMin * 60;
    const gapSplitS = gapSplitMin * 60;


    const isMoving = (i: number) => {
        if (i === 0) return false;
        const p = points[i];
        return (p.speedKmh || 0) > vMinKmh || (p.distM || 0) > dMinM;
    };


    // segment indices
    let i = 0;
    while (i < points.length) {
        let j = i + 1;
        // detect long gap split
        while (j < points.length) {
            const dt = (points[j].t - points[j - 1].t) / 1000;
            if (dt > gapSplitS) break;
            const mv = isMoving(j);
            const mvPrev = isMoving(j - 1);
            if (mv !== mvPrev) break; // state change
            j++;
        }


        const mvState = isMoving(i);
        const start = i; const end = j - 1;
        const durationS = (points[end].t - points[start].t) / 1000;
        if (mvState) {
            if (durationS >= rideMinS) {
                const { sumDist } = accumulate(points, start, end);
                rides.push({
                    id: rides.length + 1,
                    startIdx: start,
                    endIdx: end,
                    startTime: points[start].t,
                    endTime: points[end].t,
                    distanceM: sumDist,
                    durationS,
                    avgSpeedKmh: (sumDist / 1000) / (durationS / 3600)
                });
            }
        } else {
            if (durationS >= stopMinS) {
                const pts = points.slice(start, end + 1);
                const centroid = centroidOf(pts);
                const radiusM = maxRadius(pts, centroid.lat, centroid.lon);
                stops.push({
                    id: stops.length + 1,
                    startIdx: start,
                    endIdx: end,
                    startTime: points[start].t,
                    endTime: points[end].t,
                    durationS,
                    centroid,
                    radiusM,
                });
            }
        }


        i = j;
    }


    // compute bbox
    const bbox = bboxOf(points);
    return { rides, stops, totalDistanceM, bbox };
}


function accumulate(points: Point[], i0: number, i1: number) {
    let sumDist = 0;
    for (let k = i0 + 1; k <= i1; k++) sumDist += points[k].distM || 0;
    return { sumDist };
}


function centroidOf(pts: Point[]) {
    let lat = 0, lon = 0;
    for (const p of pts) { lat += p.lat; lon += p.lon; }
    const n = Math.max(1, pts.length);
    return { lat: lat / n, lon: lon / n };
}


function maxRadius(pts: Point[], lat: number, lon: number) {
    let maxR = 0;
    for (const p of pts) {
        const d = haversineM(p.lat, p.lon, lat, lon);
        if (d > maxR) maxR = d;
    }
    return maxR;
}