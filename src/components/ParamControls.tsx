import React from 'react'
import type { AnalyseParams } from '../types'

type Props = {
  params: Partial<AnalyseParams>
  onChange: (p: Partial<AnalyseParams>) => void
}

function Row({ label, children }: { label: string, children: React.ReactNode }) {
  return (
    <div style={{display:'grid', gridTemplateColumns:'120px 1fr 70px', alignItems:'center', gap:8, marginBottom:8}}>
      <div className="small">{label}</div>
      {children}
    </div>
  )
}

export function ParamControls({ params, onChange }: Props) {
  const set = (k: keyof AnalyseParams) => (v: number) => onChange({ ...params, [k]: v })

  return (
    <div>
      <Row label="v_min (km/h)">
        <input type="range" min={0} max={10} step={0.5}
          value={params.vMinKmh ?? 2}
          onChange={e => set('vMinKmh')(parseFloat(e.target.value))}
        />
        <div style={{textAlign:'right'}}><strong>{params.vMinKmh ?? 2}</strong></div>
      </Row>

      <Row label="d_min (m)">
        <input type="range" min={0} max={200} step={5}
          value={params.dMinM ?? 50}
          onChange={e => set('dMinM')(parseFloat(e.target.value))}
        />
        <div style={{textAlign:'right'}}><strong>{params.dMinM ?? 50}</strong></div>
      </Row>

      <Row label="ride_min (min)">
        <input type="range" min={1} max={30} step={1}
          value={params.rideMinMin ?? 3}
          onChange={e => set('rideMinMin')(parseFloat(e.target.value))}
        />
        <div style={{textAlign:'right'}}><strong>{params.rideMinMin ?? 3}</strong></div>
      </Row>

      <Row label="stop_min (min)">
        <input type="range" min={1} max={60} step={1}
          value={params.stopMinMin ?? 5}
          onChange={e => set('stopMinMin')(parseFloat(e.target.value))}
        />
        <div style={{textAlign:'right'}}><strong>{params.stopMinMin ?? 5}</strong></div>
      </Row>

      <Row label="gap_split (min)">
        <input type="range" min={5} max={180} step={5}
          value={params.gapSplitMin ?? 20}
          onChange={e => set('gapSplitMin')(parseFloat(e.target.value))}
        />
        <div style={{textAlign:'right'}}><strong>{params.gapSplitMin ?? 20}</strong></div>
      </Row>
    </div>
  )
}
