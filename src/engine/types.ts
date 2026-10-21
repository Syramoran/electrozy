import type { Hole } from './board'

export type End = { hole: Hole | null; x: number; z: number }
export type MeterMode = 'off' | 'V' | 'A' | 'ohm'
export type LedColor = 'red' | 'yellow' | 'green' | 'blue'

type Rigid = { id: string; hole: Hole | null; rot: 0 | 1; x: number; z: number; label?: string; locked?: boolean }

/** `broken`: cortado por dentro (se ve igual, hay que encontrarlo midiendo). `watts`: potencia que aguanta. */
export type ResistorPart = Rigid & { kind: 'resistor'; ohms: number; watts?: number; broken?: boolean }
export type LedPart = Rigid & { kind: 'led'; color: LedColor; burned?: boolean }
export type BulbPart = Rigid & { kind: 'bulb'; ohms: number }
export type WirePart = { id: string; kind: 'wire'; color: string; a: End; b: End; locked?: boolean; broken?: boolean }
export type SourcePart = {
  id: string
  kind: 'source'
  style: 'battery' | 'supply'
  volts: number
  on: boolean
  x: number
  z: number
  plus: End
  minus: End
  label?: string
  locked?: boolean
}
export type MeterPart = { id: string; kind: 'meter'; mode: MeterMode; x: number; z: number; red: End; black: End }

export type RigidPart = ResistorPart | LedPart | BulbPart
export type Part = RigidPart | WirePart | SourcePart | MeterPart
export type PartKind = Part['kind']

export const SPAN: Record<RigidPart['kind'], number> = { resistor: 4, led: 2, bulb: 3 }

export const LED_VF: Record<LedColor, number> = { red: 1.8, yellow: 2.0, green: 2.1, blue: 3.0 }
export const LED_RS = 15
/** Potencia nominal de los resistores del cajón (W). */
export const R_WATTS = 0.25
/** Más de esto y el LED se quema (A). */
export const LED_IMAX = 0.06
/** Corriente que se ve "a pleno brillo" (A). */
export const LED_INOM = 0.02

export function isRigid(p: Part): p is RigidPart {
  return p.kind === 'resistor' || p.kind === 'led' || p.kind === 'bulb'
}

/** Agujeros donde cae cada pata de una pieza rígida (o null si no está en la protoboard). */
export function rigidPins(p: RigidPart): Hole[] | null {
  if (!p.hole) return null
  const s = SPAN[p.kind]
  return p.rot === 0
    ? [p.hole, { r: p.hole.r, c: p.hole.c + s }]
    : [p.hole, { r: p.hole.r + s, c: p.hole.c }]
}

/** Extremos (nombre de pin + End) de las piezas flexibles. */
export function flexEnds(p: Part): [string, End][] {
  switch (p.kind) {
    case 'wire':
      return [
        ['a', p.a],
        ['b', p.b],
      ]
    case 'source':
      return [
        ['plus', p.plus],
        ['minus', p.minus],
      ]
    case 'meter':
      return [
        ['red', p.red],
        ['black', p.black],
      ]
    default:
      return []
  }
}
