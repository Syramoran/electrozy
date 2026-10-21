// Atajos para describir escenas: "c5" es la fila c, columna 5; "T+3" el bus + de arriba, columna 3.

import { ROWS, holePos, type Hole } from './board'
import type { End, LedColor, MeterMode, Part } from './types'

export function h(name: string): Hole {
  const m = /^(T\+|T-|B\+|B-|[a-j])(\d+)$/.exec(name)
  if (!m) throw new Error(`Agujero inválido: ${name}`)
  return { r: ROWS.indexOf(m[1] as (typeof ROWS)[number]), c: Number(m[2]) - 1 }
}

function end(at: string | null, fx: number, fz: number): End {
  if (!at) return { hole: null, x: fx, z: fz }
  const hole = h(at)
  const [x, z] = holePos(hole)
  return { hole, x, z }
}

type RigidOpts = { label?: string; free?: [number, number]; locked?: boolean; watts?: number }

export function resistor(id: string, ohms: number, at: string | null, rot: 0 | 1 = 0, o: RigidOpts = {}): Part {
  return { id, kind: 'resistor', ohms, hole: at ? h(at) : null, rot, x: o.free?.[0] ?? 0, z: o.free?.[1] ?? 3.6, label: o.label, locked: o.locked, watts: o.watts }
}

export function led(id: string, color: LedColor, at: string | null, rot: 0 | 1 = 0, o: RigidOpts = {}): Part {
  return { id, kind: 'led', color, hole: at ? h(at) : null, rot, x: o.free?.[0] ?? 1, z: o.free?.[1] ?? 3.6, label: o.label, locked: o.locked }
}

export function bulb(id: string, ohms: number, at: string | null, rot: 0 | 1 = 0, o: RigidOpts = {}): Part {
  return { id, kind: 'bulb', ohms, hole: at ? h(at) : null, rot, x: o.free?.[0] ?? 2, z: o.free?.[1] ?? 3.6, label: o.label, locked: o.locked }
}

export function wire(id: string, color: string, a: string | null, b: string | null, free: [number, number] = [0, 3.2]): Part {
  return { id, kind: 'wire', color, a: end(a, free[0] - 0.4, free[1]), b: end(b, free[0] + 0.4, free[1]) }
}

export function battery(id: string, volts: number, plus: string | null, minus: string | null, pos: [number, number] = [-6.6, -0.6], o: { on?: boolean; label?: string } = {}): Part {
  return {
    id,
    kind: 'source',
    style: 'battery',
    volts,
    on: o.on ?? true,
    x: pos[0],
    z: pos[1],
    plus: end(plus, pos[0] + 1.3, pos[1] - 0.5),
    minus: end(minus, pos[0] + 1.3, pos[1] + 0.5),
    label: o.label,
  }
}

export function supply(id: string, volts: number, plus: string | null, minus: string | null, pos: [number, number] = [-6.8, -0.4], o: { on?: boolean; label?: string } = {}): Part {
  return { ...(battery(id, volts, plus, minus, pos, o) as Extract<Part, { kind: 'source' }>), style: 'supply' }
}

export function meter(mode: MeterMode, red: string | null, black: string | null, pos: [number, number] = [6.9, 0.2]): Part {
  return { id: 'tester', kind: 'meter', mode, x: pos[0], z: pos[1], red: end(red, pos[0] - 1.6, pos[1] - 0.3), black: end(black, pos[0] - 1.6, pos[1] + 0.4) }
}

/** Marca una pieza como cortada por dentro (para los encargos de diagnóstico). */
export function broken(p: Part): Part {
  return p.kind === 'resistor' || p.kind === 'wire' ? { ...p, broken: true } : p
}
