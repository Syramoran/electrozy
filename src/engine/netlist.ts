// Arma el netlist desde las piezas encastradas en la protoboard y lo resuelve.

import { holeNode, type Hole } from './board'
import { solveMna, type Elem, type MnaResult } from './mna'
import { LED_IMAX, LED_INOM, LED_RS, LED_VF, R_WATTS, isRigid, rigidPins, type MeterMode, type Part } from './types'

export const WIRE_R = 0.02
export const METER_RV = 10e6
export const METER_RA = 0.1
export const METER_ITEST = 1e-3
export const FUSE_A = 0.4
export const SHORT_A = 1
/** Resistencia de algo cortado por dentro. */
const OPEN_R = 1e12
const SOURCE_RINT = { battery: 1, supply: 0.5 }

export type MeterStatus = 'off' | 'ok' | 'OL' | 'fuse' | 'powered' | 'nolead'
export type MeterReading = {
  mode: MeterMode
  /** Valor en unidades base (V, A, Ω) o null si no hay lectura. */
  value: number | null
  status: MeterStatus
}

export type Warning =
  | { kind: 'short'; partId: string; amps: number }
  | { kind: 'fuse'; partId: string }
  | { kind: 'ledBurn'; partId: string }
  | { kind: 'ledReverse'; partId: string }
  | { kind: 'ohmPowered'; partId: string }
  | { kind: 'hot'; partId: string; watts: number; rating: number }

export type SimResult = {
  v: Record<string, number>
  /** Corriente por pieza: rígidas pin0→pin1, cable a→b, fuente saliendo por +, tester entrando por la punta roja. */
  partI: Record<string, number>
  /** 0..1 de brillo (LED y lámpara). */
  glow: Record<string, number>
  /** Potencia disipada / potencia nominal de cada resistor (más de 1 = se recalienta). */
  heat: Record<string, number>
  meter: MeterReading | null
  warnings: Warning[]
  /** LEDs que esta simulación quemó. */
  burned: string[]
  nodeOf: (partId: string, pin: string) => string | null
}

function endNode(partId: string, pin: string, hole: Hole | null) {
  return hole ? holeNode(hole) : `${partId}.${pin}`
}

/** Nodos de cada pin, para todas las piezas. */
export function pinNodes(parts: Part[]): Map<string, string> {
  const m = new Map<string, string>()
  for (const p of parts) {
    if (isRigid(p)) {
      const pins = rigidPins(p)
      m.set(`${p.id}/p0`, pins ? holeNode(pins[0]) : `${p.id}.p0`)
      m.set(`${p.id}/p1`, pins ? holeNode(pins[1]) : `${p.id}.p1`)
    } else if (p.kind === 'wire') {
      m.set(`${p.id}/a`, endNode(p.id, 'a', p.a.hole))
      m.set(`${p.id}/b`, endNode(p.id, 'b', p.b.hole))
    } else if (p.kind === 'source') {
      m.set(`${p.id}/plus`, endNode(p.id, 'plus', p.plus.hole))
      m.set(`${p.id}/minus`, endNode(p.id, 'minus', p.minus.hole))
    } else {
      m.set(`${p.id}/red`, endNode(p.id, 'red', p.red.hole))
      m.set(`${p.id}/black`, endNode(p.id, 'black', p.black.hole))
    }
  }
  return m
}

type MeterUse = 'none' | 'normal' | 'open'

function buildElems(parts: Part[], nodes: Map<string, string>, ledOn: Record<string, boolean>, meterUse: MeterUse) {
  const elems: Elem[] = []
  const n = (id: string, pin: string) => nodes.get(`${id}/${pin}`)!
  for (const p of parts) {
    switch (p.kind) {
      case 'resistor':
        elems.push({ type: 'R', id: p.id, a: n(p.id, 'p0'), b: n(p.id, 'p1'), r: p.broken ? OPEN_R : p.ohms })
        break
      case 'bulb':
        elems.push({ type: 'R', id: p.id, a: n(p.id, 'p0'), b: n(p.id, 'p1'), r: p.ohms })
        break
      case 'led':
        if (p.burned) break
        if (ledOn[p.id]) {
          elems.push({ type: 'V', id: `${p.id}#vf`, p: n(p.id, 'p0'), n: `${p.id}.k`, v: LED_VF[p.color] })
          elems.push({ type: 'R', id: p.id, a: `${p.id}.k`, b: n(p.id, 'p1'), r: LED_RS })
        } else {
          elems.push({ type: 'R', id: p.id, a: n(p.id, 'p0'), b: n(p.id, 'p1'), r: 1e9 })
        }
        break
      case 'wire':
        elems.push({ type: 'R', id: p.id, a: n(p.id, 'a'), b: n(p.id, 'b'), r: p.broken ? OPEN_R : WIRE_R })
        break
      case 'source':
        if (!p.on) break
        elems.push({ type: 'V', id: p.id, p: `${p.id}.int`, n: n(p.id, 'minus'), v: p.volts })
        elems.push({ type: 'R', id: `${p.id}#rint`, a: `${p.id}.int`, b: n(p.id, 'plus'), r: SOURCE_RINT[p.style] })
        break
      case 'meter': {
        if (meterUse !== 'normal') break
        const red = n(p.id, 'red')
        const black = n(p.id, 'black')
        if (p.mode === 'V') elems.push({ type: 'R', id: p.id, a: red, b: black, r: METER_RV })
        else if (p.mode === 'A') elems.push({ type: 'R', id: p.id, a: red, b: black, r: METER_RA })
        else if (p.mode === 'ohm') elems.push({ type: 'I', id: p.id, from: black, to: red, i: METER_ITEST })
        break
      }
    }
  }
  return elems
}

function solveWithLeds(parts: Part[], nodes: Map<string, string>, meterUse: MeterUse) {
  const ledOn: Record<string, boolean> = {}
  const leds = parts.filter((p) => p.kind === 'led' && !p.burned)
  let res: MnaResult = { v: {}, i: {} }
  for (let iter = 0; iter < 8; iter++) {
    res = solveMna(buildElems(parts, nodes, ledOn, meterUse))
    let changed = false
    for (const l of leds) {
      if (l.kind !== 'led') continue
      const va = res.v[nodes.get(`${l.id}/p0`)!] ?? 0
      const vk = res.v[nodes.get(`${l.id}/p1`)!] ?? 0
      if (ledOn[l.id] && (res.i[l.id] ?? 0) < 0) {
        ledOn[l.id] = false
        changed = true
      } else if (!ledOn[l.id] && va - vk > LED_VF[l.color] + 1e-3) {
        ledOn[l.id] = true
        changed = true
      }
    }
    if (!changed) break
  }
  return res
}

export function simulate(parts: Part[]): SimResult {
  const nodes = pinNodes(parts)
  const meter = parts.find((p) => p.kind === 'meter')
  const warnings: Warning[] = []

  let res = solveWithLeds(parts, nodes, 'normal')
  let reading: MeterReading | null = null

  if (meter && meter.kind === 'meter') {
    const red = nodes.get(`${meter.id}/red`)!
    const black = nodes.get(`${meter.id}/black`)!
    const leads = !!meter.red.hole && !!meter.black.hole
    const vd = (r: MnaResult) => (r.v[red] ?? 0) - (r.v[black] ?? 0)
    if (meter.mode === 'off') reading = { mode: 'off', value: null, status: 'off' }
    else if (!leads) reading = { mode: meter.mode, value: meter.mode === 'ohm' ? null : 0, status: meter.mode === 'ohm' ? 'OL' : 'nolead' }
    else if (meter.mode === 'V') reading = { mode: 'V', value: vd(res), status: 'ok' }
    else if (meter.mode === 'A') {
      const amps = res.i[meter.id] ?? 0
      if (Math.abs(amps) > FUSE_A) {
        warnings.push({ kind: 'fuse', partId: meter.id })
        res = solveWithLeds(parts, nodes, 'open')
        reading = { mode: 'A', value: null, status: 'fuse' }
      } else reading = { mode: 'A', value: amps, status: 'ok' }
    } else {
      const open = solveWithLeds(parts, nodes, 'open')
      const powered = Math.abs(vd(open)) > 0.05
      const r = vd(res) / METER_ITEST
      if (powered) {
        warnings.push({ kind: 'ohmPowered', partId: meter.id })
        reading = { mode: 'ohm', value: r, status: 'powered' }
      } else if (r > 20e6 || r < 0) reading = { mode: 'ohm', value: null, status: 'OL' }
      else reading = { mode: 'ohm', value: r, status: 'ok' }
      // La corriente de prueba del óhmetro no "anima" el circuito.
      res = open
    }
  }

  const partI: Record<string, number> = {}
  const glow: Record<string, number> = {}
  const heat: Record<string, number> = {}
  const burned: string[] = []
  for (const p of parts) {
    const i = res.i[p.id] ?? 0
    partI[p.id] = i
    if (p.kind === 'led') {
      if (i > LED_IMAX) burned.push(p.id)
      glow[p.id] = p.burned ? 0 : Math.min(1, Math.max(0, i / LED_INOM))
      if (!p.burned) {
        const va = res.v[nodes.get(`${p.id}/p0`)!] ?? 0
        const vk = res.v[nodes.get(`${p.id}/p1`)!] ?? 0
        if (vk - va > 1) warnings.push({ kind: 'ledReverse', partId: p.id })
      }
    } else if (p.kind === 'bulb') {
      const watts = i * i * p.ohms
      glow[p.id] = Math.min(1, watts / 0.8)
    } else if (p.kind === 'resistor') {
      const rating = p.watts ?? R_WATTS
      const watts = i * i * p.ohms
      heat[p.id] = watts / rating
      if (watts > rating) warnings.push({ kind: 'hot', partId: p.id, watts, rating })
    } else if (p.kind === 'source' && Math.abs(i) > SHORT_A) {
      warnings.push({ kind: 'short', partId: p.id, amps: Math.abs(i) })
    }
  }
  for (const id of burned) warnings.push({ kind: 'ledBurn', partId: id })

  return {
    v: res.v,
    partI,
    glow,
    heat,
    meter: reading,
    warnings,
    burned,
    nodeOf: (id, pin) => nodes.get(`${id}/${pin}`) ?? null,
  }
}
