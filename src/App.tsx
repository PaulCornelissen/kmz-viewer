import React from 'react'
import './styles.css'
import { Dropzone } from './components/Dropzone'
import { MapView } from './components/MapView'
import { SpeedChart } from './components/SpeedChart'
import type { AnalysisResult, Ride } from './types'


import { ParamControls } from './components/ParamControls'

import type { AnalyseParams } from './types'

export default function App() {
  const [fileBuf, setFileBuf] = React.useState<ArrayBuffer | null>(null)
  const [params, setParams] = React.useState<Partial<AnalyseParams>>({
    vMinKmh: 2,
    dMinM: 50,
    rideMinMin: 3,
    stopMinMin: 5,
    gapSplitMin: 20,
  })

  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [data, setData] = React.useState<AnalysisResult | null>(null)
  const [selectedRideId, setSelectedRideId] = React.useState<number | null>(null)

  const reAnalyze = React.useCallback(() => {
    if (!fileBuf) return
    setLoading(true)
    workerRef.current?.postMessage({ fileBuffer: fileBuf, params })
  }, [fileBuf, params])

  const debRef = React.useRef<number | undefined>(undefined)
  const reAnalyzeDebounced = React.useCallback(() => {
    if (debRef.current) window.clearTimeout(debRef.current)
    debRef.current = window.setTimeout(reAnalyze, 250)
  }, [reAnalyze])

  const workerRef = React.useRef<Worker | null>(null)
  React.useEffect(() => {
    const w = new Worker(new URL('./worker/trackWorker.ts', import.meta.url), { type: 'module' })
    w.onmessage = (ev: MessageEvent) => {
      const { ok, result, error } = ev.data
      setLoading(false)
      if (!ok) { setError(error || 'Onbekende fout'); return }
      setData(result as AnalysisResult)
      setSelectedRideId((result as AnalysisResult).rides[0]?.id ?? null)
    }
    workerRef.current = w
    return () => { w.terminate(); workerRef.current = null }
  }, [])


  const onFile = async (file: File) => {
    setError(null); setLoading(true)
    const buf = await file.arrayBuffer()
    setFileBuf(buf); workerRef.current?.postMessage({ fileBuffer: buf, params })
  }


  const ride = data?.rides.find(r => r.id === selectedRideId) || null


  const fmtKm = (m: number) => (m / 1000).toFixed(2)
  const fmtDur = (s: number) => {
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60)
    return `${h}u ${m}m`
  }


  return (
    <div className="app">
      <div className="sidebar">
        <Dropzone onFile={onFile} />


        <div className="section">
          <h3 className="h">Status</h3>
          {loading ? <p>Bezig met verwerken…</p> : error ? <p style={{ color: '#f87171' }}>{error}</p> : <p className="muted">Klaar om te starten</p>}
        </div>


        <div className="section">

          <div className="section">
            <h3 className="h">Parameters</h3>
            <ParamControls
              params={params}
              onChange={(p) => { setParams(p); reAnalyzeDebounced(); }}
            />
          </div>
          <h3 className="h">Overzicht</h3>
          {data ? (
            <div className="stats">
              <div className="stat"><div className="small">Totaal afstand</div><div><strong>{fmtKm(data.totalDistanceM)} km</strong></div></div>
              <div className="stat"><div className="small"># Ritten</div><div><strong>{data.rides.length}</strong></div></div>
              <div className="stat"><div className="small"># Stops</div><div><strong>{data.stops.length}</strong></div></div>
              <div className="stat"><div className="small">v_min</div><div><strong>{data.params.vMinKmh} km/h</strong></div></div>
            </div>
          ) : <p className="muted">Geen data</p>}
        </div>


        <div className="section">
          <h3 className="h">Ritten</h3>
          <div className="list">
            {data?.rides.map(r => (
              <div key={r.id} className={`item ${selectedRideId === r.id ? 'active' : ''}`} onClick={() => setSelectedRideId(r.id)}>
                <div className="row">
                  <div><strong>Rit {r.id}</strong></div>
                  <div className="muted">{fmtKm(r.distanceM)} km</div>
                </div>
                <div className="small">{new Date(r.startTime).toLocaleString()} → {new Date(r.endTime).toLocaleString()}</div>
                <div className="small">Duur {fmtDur(r.durationS)} · Gem {r.avgSpeedKmh.toFixed(1)} km/h</div>
              </div>
            ))}
            {!data && <div className="muted">Ritten verschijnen hier</div>}
          </div>
        </div>


      </div>


      <div style={{ display: 'grid', gridTemplateRows: '1fr auto', minHeight: 0 }}>
        <div className="section" style={{ margin: '12px 12px 6px' }}>
          <div style={{ height: 'calc(100vh - 360px)' }}>
            <MapView data={data} selectedRide={selectedRideId} onSelectRide={setSelectedRideId} />
          </div>
        </div>
        <div className="section" style={{ margin: '6px 12px 12px' }}>
          <h3 className="h">Snelheid</h3>
          <SpeedChart data={data} ride={ride} />
        </div>
      </div>
    </div>
  )
}