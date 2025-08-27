import { analyze } from './segmentation'
import type { Point, AnalyseParams } from '../types'

import { describe, expect, it } from 'vitest'

describe('segmentation analyze', () => {
  it('splits rides when encountering a large time gap', () => {
    const params: AnalyseParams = {
      vMinKmh: 1,
      dMinM: 0,
      rideMinMin: 0,
      stopMinMin: 0,
      gapSplitMin: 5,
    }

    const points: Point[] = [
      { t: 0, lat: 0, lon: 0 },
      { t: 60_000, lat: 0, lon: 0.001 },
      { t: 120_000, lat: 0, lon: 0.002 },
      // gap of 10 minutes
      { t: 720_000, lat: 0, lon: 0.003 },
      { t: 780_000, lat: 0, lon: 0.004 },
    ]

    const { rides } = analyze(points, params)

    expect(rides.length).toBe(2)
    expect(rides[0].endIdx).toBe(2)
    expect(rides[1].startIdx).toBe(3)
  })
})

