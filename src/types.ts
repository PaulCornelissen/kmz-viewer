export type Point = {
t: number; // epoch ms
lat: number;
lon: number;
alt?: number | null;
distM?: number; // distance from previous point (m)
speedKmh?: number; // km/h between prev and this
};


export type Ride = {
id: number;
startIdx: number;
endIdx: number; // inclusive index in points
startTime: number;
endTime: number;
distanceM: number;
durationS: number;
avgSpeedKmh: number;
};


export type Stop = {
id: number;
startIdx: number;
endIdx: number;
startTime: number;
endTime: number;
durationS: number;
centroid: { lat: number; lon: number };
radiusM: number; // max afstand tot centroid
};


export type AnalysisResult = {
points: Point[];
rides: Ride[];
stops: Stop[];
totalDistanceM: number;
bbox: [number, number, number, number]; // [minLon, minLat, maxLon, maxLat]
params: AnalyseParams;
};


export type AnalyseParams = {
vMinKmh: number; // snelheid drempel voor "moving"
dMinM: number; // verplaatsing drempel per interval
rideMinMin: number; // minimale ritduur (min)
stopMinMin: number; // minimale stopduur (min)
gapSplitMin: number; // harde splitsing bij lange datagaten
};