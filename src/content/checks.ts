// Validaciones de "armá / medí en el banco" contra el netlist resuelto.

import { holeNode } from '../engine/board'
import { h } from '../engine/build'
import { approxEqual, formatSI, trimNum } from '../engine/circuit'
import type { SimResult } from '../engine/netlist'
import type { MeterMode, MeterPart, Part } from '../engine/types'
import type { BenchCheck } from './types'

const meterOf = (parts: Part[]) => parts.find((p): p is MeterPart => p.kind === 'meter')

function modeMsg(m: MeterPart, want: MeterMode) {
  if (m.mode === want) return null
  const name = { V: 'V⎓ (voltímetro)', A: 'mA (amperímetro)', ohm: 'Ω (óhmetro)', off: 'OFF' }[want]
  return `Girá la perilla del tester a ${name}.`
}

function leadsMsg(m: MeterPart) {
  if (!m.red.hole && !m.black.hole) return 'Enchufá las dos puntas del tester en la protoboard.'
  if (!m.red.hole) return 'Falta enchufar la punta roja.'
  if (!m.black.hole) return 'Falta enchufar la punta negra.'
  return null
}

const sameNodes = (a: [string | null, string | null], b: [string | null, string | null]) =>
  (a[0] === b[0] && a[1] === b[1]) || (a[0] === b[1] && a[1] === b[0])

/** Voltímetro en paralelo con una pieza (o con la batería si `id` es una fuente). */
export function measuresVoltageOf(id: string, pins: [string, string] = ['p0', 'p1']): BenchCheck {
  return (parts, sim) => {
    const m = meterOf(parts)
    if (!m) return { ok: false }
    const msg = leadsMsg(m) ?? modeMsg(m, 'V')
    if (msg) return { ok: false, msg }
    const target: [string | null, string | null] = [sim.nodeOf(id, pins[0]), sim.nodeOf(id, pins[1])]
    const probes: [string | null, string | null] = [sim.nodeOf(m.id, 'red'), sim.nodeOf(m.id, 'black')]
    if (!sameNodes(target, probes)) return { ok: false, msg: 'Las puntas tienen que tocar las dos patas de la pieza: una de cada lado (en paralelo).' }
    const v = sim.meter?.value ?? 0
    if (v < -0.01) return { ok: false, msg: 'Marca negativo: invertí las puntas (roja al lado más positivo).' }
    return { ok: true, msg: `¡Bien medido! ${formatSI(v, 'V')}.` }
  }
}

/** Amperímetro en serie con una pieza: por el tester pasa la misma corriente que por ella. */
export function measuresCurrentOf(id: string): BenchCheck {
  return (parts, sim) => {
    const m = meterOf(parts)
    if (!m) return { ok: false }
    if (sim.meter?.status === 'fuse') return { ok: false, msg: 'Fusible quemado: el amperímetro quedó en paralelo. Tiene que ir en serie, abriendo el circuito.' }
    const msg = leadsMsg(m) ?? modeMsg(m, 'A')
    if (msg) return { ok: false, msg }
    const im = sim.partI[m.id] ?? 0
    const ip = sim.partI[id] ?? 0
    if (Math.abs(ip) < 1e-5) return { ok: false, msg: 'No circula corriente por la pieza: el circuito está abierto. El tester tiene que cerrar el hueco.' }
    if (!approxEqual(Math.abs(im), Math.abs(ip), 0.02)) return { ok: false, msg: 'El tester no está en serie con esa pieza: toda la corriente tiene que pasar por adentro del tester.' }
    if (im < 0) return { ok: false, msg: 'Marca negativo: la corriente tiene que entrar por la punta roja.' }
    return { ok: true, msg: `¡Eso! Circulan ${formatSI(im, 'A')}.` }
  }
}

/** Óhmetro sobre una pieza, con el circuito sin alimentar. */
export function measuresResistanceOf(id: string): BenchCheck {
  return (parts, sim) => {
    const m = meterOf(parts)
    if (!m) return { ok: false }
    const msg = leadsMsg(m) ?? modeMsg(m, 'ohm')
    if (msg) return { ok: false, msg }
    if (sim.meter?.status === 'powered') return { ok: false, msg: 'Hay tensión en el circuito: apagá la batería antes de medir resistencia.' }
    const target: [string | null, string | null] = [sim.nodeOf(id, 'p0'), sim.nodeOf(id, 'p1')]
    const probes: [string | null, string | null] = [sim.nodeOf(m.id, 'red'), sim.nodeOf(m.id, 'black')]
    if (!sameNodes(target, probes)) return { ok: false, msg: 'Poné una punta en cada pata del resistor.' }
    const p = parts.find((q) => q.id === id)
    const r = sim.meter?.value ?? 0
    if (p && 'ohms' in p && !approxEqual(r, p.ohms, 0.02)) return { ok: false, msg: `Marca ${formatSI(r, 'Ω')}, no ${formatSI(p.ohms, 'Ω')}: hay algo más en paralelo. Aislalo (sacá una pata) para medir solo el resistor.` }
    return { ok: true, msg: `¡Perfecto! ${formatSI(r, 'Ω')}.` }
  }
}

export function lights(id: string, min = 0.3): BenchCheck {
  return (_parts, sim) => ((sim.glow[id] ?? 0) >= min ? { ok: true, msg: '¡Se prendió!' } : { ok: false, msg: 'Todavía no se prende: fijate que el circuito esté cerrado.' })
}

export function meterReads(mode: MeterMode, value: number, tol = 0.1): BenchCheck {
  return (parts, sim: SimResult) => {
    const m = meterOf(parts)
    if (!m) return { ok: false }
    const msg = modeMsg(m, mode) ?? leadsMsg(m)
    if (msg) return { ok: false, msg }
    const v = sim.meter?.value
    if (v == null || sim.meter?.status !== 'ok') return { ok: false, msg: 'El tester no da una lectura válida todavía.' }
    return approxEqual(v, value, tol) ? { ok: true, msg: `¡Justo! ${formatSI(v, mode === 'A' ? 'A' : mode === 'V' ? 'V' : 'Ω')}.` } : { ok: false, msg: `Marca ${formatSI(v, mode === 'A' ? 'A' : mode === 'V' ? 'V' : 'Ω')}: seguí ajustando.` }
  }
}

export const all =
  (...cs: BenchCheck[]): BenchCheck =>
  (parts, sim) => {
    let last = { ok: true, msg: undefined as string | undefined }
    for (const c of cs) {
      const r = c(parts, sim)
      if (!r.ok) return r
      last = { ok: true, msg: r.msg }
    }
    return last
  }

/** Dos piezas en paralelo (mismos nodos). */
export function inParallel(a: string, b: string): BenchCheck {
  return (_p, sim) => {
    const na: [string | null, string | null] = [sim.nodeOf(a, 'p0'), sim.nodeOf(a, 'p1')]
    const nb: [string | null, string | null] = [sim.nodeOf(b, 'p0'), sim.nodeOf(b, 'p1')]
    if (na[0] === na[1]) return { ok: false, msg: 'Las dos patas de un resistor quedaron en la misma tira: está en corto.' }
    return sameNodes(na, nb) ? { ok: true, msg: '¡Quedaron en paralelo!' } : { ok: false, msg: 'Para que estén en paralelo, cada pata de uno tiene que compartir tira con una pata del otro.' }
  }
}

const nodesAt = (a: string, b: string): [string, string] => [holeNode(h(a)), holeNode(h(b))]

/** Voltímetro entre dos puntos de la protoboard (por ejemplo los bornes A y B de Thevenin). */
export function measuresVoltageBetween(a: string, b: string, expected: number, tol = 0.05): BenchCheck {
  return (parts, sim) => {
    const m = meterOf(parts)
    if (!m) return { ok: false }
    const msg = leadsMsg(m) ?? modeMsg(m, 'V')
    if (msg) return { ok: false, msg }
    const probes: [string | null, string | null] = [sim.nodeOf(m.id, 'red'), sim.nodeOf(m.id, 'black')]
    if (!sameNodes(nodesAt(a, b), probes)) return { ok: false, msg: `Las puntas van en la columna de ${a.replace(/\D/g, '')} y en la de ${b.replace(/\D/g, '')}.` }
    const v = Math.abs(sim.meter?.value ?? 0)
    return approxEqual(v, expected, tol) ? { ok: true, msg: `¡Eso! ${formatSI(v, 'V')}.` } : { ok: false, msg: `Marca ${formatSI(v, 'V')}: revisá el circuito.` }
  }
}

/** Óhmetro entre dos puntos, con las fuentes anuladas. */
export function measuresResistanceBetween(a: string, b: string, expected: number, tol = 0.015, wrongHint?: string): BenchCheck {
  return (parts, sim) => {
    const m = meterOf(parts)
    if (!m) return { ok: false }
    const msg = leadsMsg(m) ?? modeMsg(m, 'ohm')
    if (msg) return { ok: false, msg }
    if (sim.meter?.status === 'powered') return { ok: false, msg: 'Hay tensión: el óhmetro no mide con la fuente prendida.' }
    const probes: [string | null, string | null] = [sim.nodeOf(m.id, 'red'), sim.nodeOf(m.id, 'black')]
    if (!sameNodes(nodesAt(a, b), probes)) return { ok: false, msg: `Las puntas van en la columna de ${a.replace(/\D/g, '')} y en la de ${b.replace(/\D/g, '')}.` }
    const r = sim.meter?.value
    if (r == null) return { ok: false, msg: 'Marca O.L: no hay camino entre esos puntos.' }
    return approxEqual(r, expected, tol) ? { ok: true, msg: `¡Exacto! ${formatSI(r, 'Ω')}.` } : { ok: false, msg: `Marca ${formatSI(r, 'Ω')}. ${wrongHint ?? ''}` }
  }
}

/** Óhmetro sobre una pieza que debería estar cortada (marca O.L). */
export function confirmsOpen(id: string, pins: [string, string] = ['p0', 'p1']): BenchCheck {
  return (parts, sim) => {
    const m = meterOf(parts)
    if (!m) return { ok: false }
    const msg = leadsMsg(m) ?? modeMsg(m, 'ohm')
    if (msg) return { ok: false, msg }
    if (sim.meter?.status === 'powered') return { ok: false, msg: 'Primero apagá la batería.' }
    const target: [string | null, string | null] = [sim.nodeOf(id, pins[0]), sim.nodeOf(id, pins[1])]
    const probes: [string | null, string | null] = [sim.nodeOf(m.id, 'red'), sim.nodeOf(m.id, 'black')]
    if (!sameNodes(target, probes)) return { ok: false, msg: 'Poné una punta en cada extremo de la pieza sospechosa.' }
    return sim.meter?.status === 'OL' ? { ok: true, msg: 'O.L: no hay continuidad. Está cortada por dentro.' } : { ok: false, msg: `Marca ${formatSI(sim.meter?.value ?? 0, 'Ω')}: esa pieza está sana. Probá con otra.` }
  }
}

/** Nada roto y la carga prendida: el circuito quedó reparado. */
export function repaired(loadId: string): BenchCheck {
  return (parts, sim) => {
    if (parts.some((p) => 'broken' in p && p.broken)) return { ok: false, msg: 'Todavía hay una pieza cortada en el circuito.' }
    return lights(loadId)(parts, sim)
  }
}

export function heats(id: string, min = 1): BenchCheck {
  return (_p, sim) => ((sim.heat[id] ?? 0) > min ? { ok: true, msg: `Disipa ${trimNum((sim.heat[id] ?? 0) * 0.25)} W: más de lo que aguanta. Eso es la ley de Joule.` } : { ok: false, msg: 'Todavía aguanta: seguí subiendo la tensión.' })
}

export function coolAndOn(id: string, maxOhms = Infinity): BenchCheck {
  return (parts, sim) => {
    const p = parts.find((q) => q.id === id)
    const i = Math.abs(sim.partI[id] ?? 0)
    if (!p || p.kind !== 'resistor' || i < 1e-5) return { ok: false, msg: 'Por el resistor tiene que circular corriente.' }
    if ((sim.heat[id] ?? 0) > 1) return { ok: false, msg: `Disipa ${trimNum((sim.heat[id] ?? 0) * 0.25)} W: sigue recalentándose.` }
    if (p.ohms > maxOhms) return { ok: false, msg: 'No se recalienta, pero hay uno más chico que también aguanta.' }
    return { ok: true, msg: `Disipa ${trimNum((sim.heat[id] ?? 0) * 0.25)} W: aguanta tranquilo.` }
  }
}
