import React from 'react'
import type { AnalyseParams } from '../types'

type Props = {
  params: Partial<AnalyseParams>
  onChange: (p: Partial<AnalyseParams>) => void
}

const DESCR: Record<keyof AnalyseParams, string> = {
  vMinKmh: 'Minimale snelheid om een punt als “rijden” te zien.',
  dMinM: 'Minimale verplaatsing per interval (minuut) om jitter bij stilstand te negeren.',
  rideMinMin: 'Minimale duur voor een segment om als rit te tellen.',
  stopMinMin: 'Minimale duur om een stilstand te clusteren.',
  gapSplitMin: 'Splits track bij datagaten langer dan dit aantal minuten.'
}

function Row({
  label, title, value, unit, children,
}: {
  label: string; title: string; value: number | string; unit?: string; children: React.ReactNode;
}) {
  return (
    <div className="pc-row">
      <div className="pc-label" title={title}>{label}</div>
      <div className="pc-control">{children}</div>
      <div className="valbubble"><strong>{value}</strong>{unit ? ` ${unit}` : ''}</div>
    </div>
  );
}


export function ParamControls({ params, onChange }: Props) {
  const set = (k: keyof AnalyseParams) => (v: number) => onChange({ ...params, [k]: v })

  return (
    <div>
      <Row label="v_min" title={DESCR.vMinKmh} value={params.vMinKmh ?? 2} unit="km/h">
        <input
          className="pc-range"
          type="range" min={0} max={10} step={0.5}
          value={params.vMinKmh ?? 2}
          onChange={e => set('vMinKmh')(parseFloat(e.target.value))}
        />
      </Row>

      <Row label="d_min" title={DESCR.dMinM} value={params.dMinM ?? 50} unit="m">
        <input
          className="pc-range"
          type="range" min={0} max={200} step={5}
          value={params.dMinM ?? 50}
          onChange={e => set('dMinM')(parseFloat(e.target.value))}
        />
      </Row>

      <Row label="ride_min" title={DESCR.rideMinMin} value={params.rideMinMin ?? 3} unit="min">
        <input
          className="pc-range"
          type="range" min={1} max={30} step={1}
          value={params.rideMinMin ?? 3}
          onChange={e => set('rideMinMin')(parseFloat(e.target.value))}
        />
      </Row>

      <Row label="stop_min" title={DESCR.stopMinMin} value={params.stopMinMin ?? 5} unit="min">
        <input
          className="pc-range"
          type="range" min={1} max={60} step={1}
          value={params.stopMinMin ?? 5}
          onChange={e => set('stopMinMin')(parseFloat(e.target.value))}
        />
      </Row>

      <Row label="gap_split" title={DESCR.gapSplitMin} value={params.gapSplitMin ?? 20} unit="min">
        <input
          className="pc-range"
          type="range" min={5} max={180} step={5}
          value={params.gapSplitMin ?? 20}
          onChange={e => set('gapSplitMin')(parseFloat(e.target.value))}
        />
      </Row>
    </div>
  )
}
