import { describe, expect, it } from 'vitest'
import { holeKey } from '../engine/board'
import { h, meter, wire } from '../engine/build'
import { simulate } from '../engine/netlist'
import { flexEnds, isRigid, rigidPins, type MeterPart, type Part } from '../engine/types'
import { makeRng } from '../lib/rng'
import { measuresCurrentOf, measuresResistanceOf, measuresVoltageOf } from './checks'
import { LESSONS } from './lessons'
import type { Visual } from './types'

function holesOf(parts: Part[]) {
  const keys: string[] = []
  for (const p of parts) {
    if (isRigid(p)) rigidPins(p)?.forEach((x) => keys.push(holeKey(x)))
    else for (const [, e] of flexEnds(p)) if (e.hole) keys.push(holeKey(e.hole))
  }
  return keys
}

function checkScene(scene: () => Part[]) {
  const parts = scene()
  const keys = holesOf(parts)
  expect(new Set(keys).size, `agujero repetido en ${parts.map((p) => p.id).join(',')}`).toBe(keys.length)
  expect(new Set(parts.map((p) => p.id)).size).toBe(parts.length)
}

describe('lecciones', () => {
  it('hay 11 encargos con ids únicos', () => {
    expect(LESSONS).toHaveLength(11)
    expect(new Set(LESSONS.map((l) => l.id)).size).toBe(11)
  })

  for (const l of LESSONS) {
    describe(l.title, () => {
      it('escenas válidas y consignas que no arrancan resueltas', () => {
        for (const s of l.steps) {
          const v = s.visual as Visual
          if (v.kind === 'bench') {
            checkScene(v.scene)
            if (s.gate) expect(s.gate.check(v.scene(), simulate(v.scene())).ok, s.title).toBe(false)
          }
        }
      })

      it('los generadores dan ejercicios bien formados', () => {
        l.practice.forEach((gen, gi) => {
          for (let seed = 1; seed <= 40; seed++) {
            const ex = gen(makeRng(seed * 97 + gi))
            expect(ex.topic).toBeTruthy()
            if (ex.type === 'choice') {
              expect(ex.options.length).toBeGreaterThanOrEqual(2)
              expect(ex.answer).toBeGreaterThanOrEqual(0)
              expect(new Set(ex.options).size).toBe(ex.options.length)
            }
            if (ex.type === 'numeric') expect(Number.isFinite(ex.answer)).toBe(true)
            if (ex.type === 'order') expect(new Set(ex.items).size).toBe(ex.items.length)
            if (ex.type === 'bench') {
              checkScene(ex.scene)
              expect(ex.check(ex.scene(), simulate(ex.scene())).ok, ex.prompt).toBe(false)
            }
          }
        })
      })
    })
  }
})

describe('consignas del tester resueltas a mano', () => {
  const l5 = LESSONS.find((l) => l.id === 'tester')!
  const withMeter = (scene: () => Part[], m: MeterPart, tweak: (p: Part) => Part = (p) => p) => [...scene().filter((p) => p.kind !== 'meter').map(tweak), m]

  it('voltímetro sobre la batería', () => {
    const v = l5.steps[2].visual as Extract<Visual, { kind: 'bench' }>
    const parts = withMeter(v.scene, meter('V', 'T+20', 'T-20') as MeterPart)
    expect(measuresVoltageOf('bat', ['plus', 'minus'])(parts, simulate(parts)).ok).toBe(true)
  })

  it('amperímetro cerrando el hueco', () => {
    const v = l5.steps[4].visual as Extract<Visual, { kind: 'bench' }>
    const parts = withMeter(v.scene, meter('A', 'e8', 'e10') as MeterPart)
    const r = measuresCurrentOf('R1')(parts, simulate(parts))
    expect(r.ok, r.msg).toBe(true)
  })

  it('óhmetro: alimentado falla, apagado anda', () => {
    const v = l5.steps[6].visual as Extract<Visual, { kind: 'bench' }>
    const on = withMeter(v.scene, meter('ohm', 'e4', 'e8') as MeterPart)
    expect(measuresResistanceOf('R1')(on, simulate(on)).ok).toBe(false)
    const off = withMeter(v.scene, meter('ohm', 'e4', 'e8') as MeterPart, (p) => (p.kind === 'source' ? { ...p, on: false } : p))
    expect(measuresResistanceOf('R1')(off, simulate(off)).ok).toBe(true)
  })

  it('h() entiende buses y filas', () => {
    expect(h('T-3')).toEqual({ r: 1, c: 2 })
    expect(h('j30')).toEqual({ r: 11, c: 29 })
  })
})

describe('consignas nuevas resueltas a mano', () => {
  const get = (id: string, i: number) => {
    const s = LESSONS.find((l) => l.id === id)!.steps[i]
    return { scene: (s.visual as Extract<Visual, { kind: 'bench' }>).scene, check: s.gate!.check }
  }
  const run = (parts: Part[], check: (p: Part[], s: ReturnType<typeof simulate>) => { ok: boolean; msg?: string }) => check(parts, simulate(parts))
  const swapMeter = (parts: Part[], m: Part) => [...parts.filter((p) => p.kind !== 'meter'), m]

  it('Thevenin: Vth entre A y B da 2 V', () => {
    const { scene, check } = get('thevenin', 1)
    const r = run(swapMeter(scene(), meter('V', 'e5', 'e15')), check)
    expect(r.ok, r.msg).toBe(true)
  })

  it('Thevenin: Rth pide fuente apagada y puente entre buses', () => {
    const { scene, check } = get('thevenin', 2)
    const off = (p: Part): Part => (p.kind === 'source' ? { ...p, on: false } : p)
    const base = swapMeter(scene(), meter('ohm', 'e5', 'e15'))
    expect(run(base.map(off), check).ok).toBe(false) // sin puente: 4,63 kΩ
    const bridged = base.map(off).map((p) => (p.id === 'puente' ? wire('puente', '#e1b54f', 'T+25', 'T-25') : p))
    const r = run(bridged, check)
    expect(r.ok, r.msg).toBe(true)
  })

  it('Kirchhoff: amperímetro en la rama de R2', () => {
    const { scene, check } = get('kirchhoff', 3)
    const r = run(swapMeter(scene(), meter('A', 'g8', 'g10')), check)
    expect(r.ok, r.msg).toBe(true)
  })

  it('Diagnóstico: el voltímetro encuentra el cable cortado', () => {
    const { scene, check } = get('diagnostico', 0)
    const r = run(swapMeter(scene(), meter('V', 'b14', 'T-20')), check)
    expect(r.ok, r.msg).toBe(true)
    expect(run(swapMeter(scene(), meter('V', 'e4', 'e8')), check).ok).toBe(false)
  })

  it('Diagnóstico: óhmetro confirma R2 cortado y reparar prende el LED', () => {
    const a = get('diagnostico', 1)
    const parts = swapMeter(a.scene(), meter('ohm', 'e8', 'e12')).map((p) => (p.kind === 'source' ? { ...p, on: false } : p))
    expect(run(parts, a.check).ok).toBe(true)
    const b = get('diagnostico', 2)
    const fixed = b.scene().map((p) => (p.kind === 'resistor' ? { ...p, broken: false } : p))
    expect(run(fixed, b.check).ok).toBe(true)
  })

  it('Potencia: R1 de 100 Ω se recalienta arriba de 5 V', () => {
    const { scene, check } = get('potencia', 1)
    const parts = scene().map((p) => (p.kind === 'source' ? { ...p, volts: 6 } : p))
    expect(run(parts, check).ok).toBe(true)
  })
})

describe('guía 2013: las respuestas coinciden con las soluciones del PDF', () => {
  const guia = LESSONS.find((l) => l.id === 'guia')!
  // [patrón en la consigna, solución oficial]
  const OFICIAL: [RegExp, number][] = [
    [/Ej\. 1:/, 4.68],
    [/Ej\. 2:/, 84.6],
    [/Ej\. 3:/, 1560],
    [/Ej\. 4:/, 99.78],
    [/5-A/, 16.8],
    [/5-B/, 12.28],
    [/5-C/, 992.69],
    [/5-D/, 553.28],
    [/Ej\. 6.*\*\*R1\*\*/, 0.493],
    [/Ej\. 6.*\*\*R2\*\*/, 0.162],
    [/Ej\. 6.*\*\*R3\*\*/, 49.3],
    [/Ej\. 7/, 11.53],
    [/Ej\. 8.*IR1/, 15.26],
    [/Ej\. 8.*IR3/, 5.93],
    [/Ej\. 8.*IR4/, 21.1],
    [/Ej\. 9/, 0.255],
    [/Ej\. 10.*VR4/, 3.04],
    [/Ej\. 10.*IR4/, 647],
    [/Ej\. 11.*Vth/, 5.625],
    [/Ej\. 11.*Rth/, 3.98],
    [/Ej\. 12.*VR3/, 24],
    [/Ej\. 12.*\*\*R1\*\*/, 2],
    [/Ej\. 12.*\*\*R2\*\*/, 8],
    [/Ej\. 12.*PR3/, 48],
  ]
  it('cada ejercicio numérico da la solución oficial (±1,5 %)', () => {
    const seen = new Set<string>()
    guia.practice.forEach((gen, gi) => {
      for (let seed = 1; seed <= 60; seed++) {
        const ex = gen(makeRng(seed * 31 + gi))
        if (ex.type !== 'numeric') continue
        const hit = OFICIAL.find(([re]) => re.test(ex.prompt))
        if (!hit) continue
        seen.add(hit[0].source)
        expect(Math.abs(ex.answer - hit[1]) / hit[1], ex.prompt).toBeLessThan(0.015)
      }
    })
    expect(seen.size).toBe(OFICIAL.length)
  })
})

describe('fuentes reales y Norton en la mesa', () => {
  const get = (i: number) => {
    const s = LESSONS.find((l) => l.id === 'fuentes')!.steps[i]
    return { scene: (s.visual as Extract<Visual, { kind: 'bench' }>).scene, check: s.gate!.check }
  }
  const withMeter = (parts: Part[], m: Part) => [...parts.filter((p) => p.kind !== 'meter'), m]
  it('la batería cargada marca menos de 9 V', () => {
    const { scene, check } = get(1)
    const parts = withMeter(scene(), meter('V', 'T+20', 'T-20'))
    const r = check(parts, simulate(parts))
    expect(r.ok, r.msg).toBe(true)
  })
  it('el amperímetro entre A y B mide IN = Vth/Rth', () => {
    const { scene, check } = get(5)
    const parts = withMeter(scene(), meter('A', 'e5', 'e15'))
    const r = check(parts, simulate(parts))
    expect(r.ok, r.msg).toBe(true)
  })
})

describe('logros', () => {
  it('ids únicos y la cantidad de encargos coincide', async () => {
    const { ACHIEVEMENTS, isUnlocked } = await import('./achievements')
    const { LESSON_COUNT } = await import('./lessonCount')
    expect(LESSON_COUNT).toBe(LESSONS.length)
    expect(new Set(ACHIEVEMENTS.map((a) => a.id)).size).toBe(ACHIEVEMENTS.length)
    const base = { stats: {}, lessonsDone: 0, totalLessons: LESSONS.length, streak: 0 }
    expect(ACHIEVEMENTS.some((a) => isUnlocked(a, base))).toBe(false)
    const led3 = ACHIEVEMENTS.find((a) => a.id === 'led3')!
    expect(isUnlocked(led3, { ...base, stats: { ledBurned: 2 } })).toBe(false)
    expect(isUnlocked(led3, { ...base, stats: { ledBurned: 3 } })).toBe(true)
  })
})
