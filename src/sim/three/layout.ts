// Posiciones 3D derivadas de las piezas (patas, bornes, puntas).

import { BOARD_TOP, holePos, onBoard, PITCH } from '../../engine/board'
import { SPAN, rigidPins, type End, type MeterPart, type RigidPart, type SourcePart } from '../../engine/types'

export type V3 = [number, number, number]

/** Altura a la que viaja lo que se arrastra. */
export const LIFT = 0.7
/** Plano de arrastre (≈ cara de la protoboard). */
export const DRAG_Y = 0.3

const groundAt = (x: number, z: number) => (onBoard(x, z) ? BOARD_TOP : 0)

export function endWorld(e: End, dragging: boolean): V3 {
  if (e.hole) {
    const [x, z] = holePos(e.hole)
    return [x, BOARD_TOP, z]
  }
  return [e.x, groundAt(e.x, e.z) + (dragging ? LIFT : 0), e.z]
}

export function rigidPinsWorld(p: RigidPart, dragging: boolean): [V3, V3] {
  const pins = rigidPins(p)
  if (pins) {
    const [ax, az] = holePos(pins[0])
    const [bx, bz] = holePos(pins[1])
    return [
      [ax, BOARD_TOP, az],
      [bx, BOARD_TOP, bz],
    ]
  }
  const half = (SPAN[p.kind] * PITCH) / 2
  const y = groundAt(p.x, p.z) + (dragging ? LIFT : 0)
  return p.rot === 0
    ? [
        [p.x - half, y, p.z],
        [p.x + half, y, p.z],
      ]
    : [
        [p.x, y, p.z - half],
        [p.x, y, p.z + half],
      ]
}

export function sourceTerminals(p: SourcePart): { plus: V3; minus: V3 } {
  if (p.style === 'battery')
    return {
      plus: [p.x + 0.24, 0.98, p.z - 0.62],
      minus: [p.x - 0.24, 0.98, p.z - 0.62],
    }
  return {
    plus: [p.x + 0.75, 0.42, p.z + 0.92],
    minus: [p.x + 0.25, 0.42, p.z + 0.92],
  }
}

export function meterJacks(p: MeterPart): { red: V3; black: V3 } {
  return {
    red: [p.x + 0.55, 0.55, p.z + 1.25],
    black: [p.x - 0.05, 0.55, p.z + 1.25],
  }
}
