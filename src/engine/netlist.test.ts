import { describe, expect, it } from 'vitest'
import { battery, h, led, meter, resistor, wire } from './build'
import { holeNode } from './board'
import { bandsToOhms, colorBands, formatSI, parallel, series } from './circuit'
import { solveMna } from './mna'
import { simulate } from './netlist'
import type { Part } from './types'

// Batería 9 V → bus; R1 de b3 a b7; vuelta al bus −.
const base = (extra: Part[] = [], closeLoop = true): Part[] => [
  battery('bat', 9, 'T+1', 'T-1'),
  wire('w1', 'red', 'T+3', 'a3'),
  resistor('R1', 1000, 'b3'),
  ...(closeLoop ? [wire('w2', 'black', 'a7', 'T-7')] : []),
  ...extra,
]

describe('board', () => {
  it('agrupa agujeros en tiras', () => {
    expect(holeNode(h('a5'))).toBe(holeNode(h('e5')))
    expect(holeNode(h('e5'))).not.toBe(holeNode(h('f5')))
    expect(holeNode(h('T+1'))).toBe(holeNode(h('T+30')))
  })
})

describe('mna', () => {
  it('divisor de tensión', () => {
    const r = solveMna([
      { type: 'V', id: 'v', p: 'a', n: 'g', v: 12 },
      { type: 'R', id: 'r1', a: 'a', b: 'm', r: 5000 },
      { type: 'R', id: 'r2', a: 'm', b: 'g', r: 5000 },
    ])
    expect(r.v.m - r.v.g).toBeCloseTo(6, 4)
    expect(r.i.v).toBeCloseTo(12 / 10000, 6)
  })
})

describe('simulate', () => {
  it('ley de Ohm en un circuito serie', () => {
    const s = simulate(base())
    expect(s.partI.R1).toBeCloseTo(9 / 1001.04, 5)
    expect(s.partI.bat).toBeCloseTo(s.partI.R1, 6)
    expect(s.warnings).toHaveLength(0)
  })

  it('voltímetro en paralelo lee la caída en R1', () => {
    const s = simulate(base([meter('V', 'c3', 'c7')]))
    expect(s.meter?.status).toBe('ok')
    expect(s.meter!.value!).toBeCloseTo(9 * 1000 / 1001.04, 2)
  })

  it('amperímetro en serie lee la corriente', () => {
    const s = simulate(base([meter('A', 'c7', 'T-8')], false))
    expect(s.meter?.status).toBe('ok')
    expect(s.meter!.value!).toBeCloseTo(9 / 1001.1, 4)
  })

  it('amperímetro en paralelo a la batería quema el fusible', () => {
    const s = simulate(base([meter('A', 'T+10', 'T-10')]))
    expect(s.meter?.status).toBe('fuse')
    expect(s.warnings.some((w) => w.kind === 'fuse')).toBe(true)
  })

  it('óhmetro con el circuito apagado mide R', () => {
    const parts = base([meter('ohm', 'c3', 'c7')], false).map((p) => (p.kind === 'source' ? { ...p, on: false } : p))
    const s = simulate(parts)
    expect(s.meter?.status).toBe('ok')
    expect(s.meter!.value!).toBeCloseTo(1000, 0)
  })

  it('óhmetro con el circuito alimentado avisa', () => {
    const s = simulate(base([meter('ohm', 'c3', 'c7')]))
    expect(s.meter?.status).toBe('powered')
  })

  it('óhmetro mide el paralelo si el componente no está aislado', () => {
    const s = simulate([resistor('R1', 1000, 'b3'), resistor('R2', 1000, 'd3'), meter('ohm', 'c3', 'c7')])
    expect(s.meter!.value!).toBeCloseTo(500, 0)
  })

  it('óhmetro en el aire marca OL', () => {
    expect(simulate([meter('ohm', 'c3', 'c7')]).meter?.status).toBe('OL')
  })

  it('LED con resistencia enciende sin quemarse', () => {
    const s = simulate([
      battery('bat', 9, 'T+1', 'T-1'),
      wire('w1', 'red', 'T+3', 'a3'),
      resistor('R1', 330, 'b3'),
      led('L1', 'red', 'b7'),
      wire('w2', 'black', 'a9', 'T-9'),
    ])
    expect(s.partI.L1).toBeCloseTo((9 - 1.8) / (330 + 15 + 1 + 0.04), 3)
    expect(s.glow.L1).toBe(1)
    expect(s.burned).toHaveLength(0)
  })

  it('LED sin resistencia se quema; al revés no conduce', () => {
    const burn = simulate([battery('bat', 9, 'T+1', 'T-1'), wire('w1', 'red', 'T+3', 'a3'), led('L1', 'red', 'b3'), wire('w2', 'black', 'a5', 'T-5')])
    expect(burn.burned).toEqual(['L1'])
    const rev = simulate([battery('bat', 9, 'T+1', 'T-1'), wire('w1', 'red', 'T+3', 'a5'), led('L1', 'red', 'b3'), resistor('R1', 330, 'c3'), wire('w2', 'black', 'a7', 'T-7')])
    expect(Math.abs(rev.partI.L1)).toBeLessThan(1e-6)
    expect(rev.warnings.some((w) => w.kind === 'ledReverse')).toBe(true)
  })

  it('cortocircuito en la batería', () => {
    const s = simulate([battery('bat', 9, 'T+1', 'T-1'), wire('w', 'red', 'T+4', 'T-4')])
    expect(s.warnings.some((w) => w.kind === 'short')).toBe(true)
  })
})

describe('circuit utils', () => {
  it('serie y paralelo (ejemplo del apunte)', () => {
    expect(series(parallel(120, 1000), 33000, 47000)).toBeCloseTo(80107.14, 1)
  })
  it('código de colores ida y vuelta', () => {
    for (const r of [10, 47, 220, 330, 1000, 4700, 56000, 1e6]) {
      const [a, b, m] = colorBands(r)
      expect(bandsToOhms(a, b, m)).toBe(r)
    }
  })
  it('formatea con prefijos', () => {
    expect(formatSI(0.01, 'A')).toBe('10 mA')
    expect(formatSI(4700, 'Ω')).toBe('4,7 kΩ')
  })
})
