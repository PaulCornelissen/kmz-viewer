export function haversineM(lat1: number, lon1: number, lat2: number, lon2: number): number {
const R = 6371000; // meters
const toRad = (d: number) => (d * Math.PI) / 180;
const dLat = toRad(lat2 - lat1);
const dLon = toRad(lon2 - lon1);
const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
return R * c;
}


export function bboxOf(points: { lat: number; lon: number }[]): [number, number, number, number] {
let minLat = 90, maxLat = -90, minLon = 180, maxLon = -180;
for (const p of points) {
if (p.lat < minLat) minLat = p.lat;
if (p.lat > maxLat) maxLat = p.lat;
if (p.lon < minLon) minLon = p.lon;
if (p.lon > maxLon) maxLon = p.lon;
}
return [minLon, minLat, maxLon, maxLat];
}