// Geometría de la protoboard: agujeros, tiras internas y snap.

export type Hole = { r: number; c: number }

export const COLS = 30
export const ROWS = ['T+', 'T-', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'B+', 'B-'] as const
export const PITCH = 0.3
/** Altura de la cara superior de la protoboard sobre la mesa. */
export const BOARD_TOP = 0.28

// Posición en "ranuras" de cada fila (dejamos huecos para la canaleta central y los buses).
const ROW_SLOT = [0, 1, 2.6, 3.6, 4.6, 5.6, 6.6, 8.2, 9.2, 10.2, 11.2, 12.2, 13.8, 14.8]
const SLOT_CENTER = 7.4

export const BOARD_W = COLS * PITCH + 0.5
export const BOARD_D = (ROW_SLOT[ROW_SLOT.length - 1] + 1) * PITCH + 0.5

export function holePos(h: Hole): [number, number] {
  return [(h.c - (COLS - 1) / 2) * PITCH, (ROW_SLOT[h.r] - SLOT_CENTER) * PITCH]
}

export function validHole(h: Hole) {
  return h.r >= 0 && h.r < ROWS.length && h.c >= 0 && h.c < COLS
}

export const holeKey = (h: Hole) => `${h.r}:${h.c}`
export const sameHole = (a: Hole | null, b: Hole | null) => !!a && !!b && a.r === b.r && a.c === b.c

export function isBus(r: number) {
  return r <= 1 || r >= 12
}

/** Nodo eléctrico (tira interna) al que pertenece un agujero. */
export function holeNode(h: Hole): string {
  if (h.r <= 1 || h.r >= 12) return `bus${ROWS[h.r]}`
  return h.r <= 6 ? `U${h.c}` : `L${h.c}`
}

/** Nombre "humano" de un agujero: "c12", "bus +". */
export function holeName(h: Hole) {
  const row = ROWS[h.r]
  if (isBus(h.r)) return `bus ${row.endsWith('+') ? '+' : '−'} (${h.r <= 1 ? 'arriba' : 'abajo'})`
  return `${row}${h.c + 1}`
}

export function nearestHole(x: number, z: number, maxDist = PITCH * 0.75): Hole | null {
  const c = Math.round(x / PITCH + (COLS - 1) / 2)
  if (c < 0 || c >= COLS) return null
  let best: Hole | null = null
  let bestD = maxDist
  for (let r = 0; r < ROWS.length; r++) {
    const [hx, hz] = holePos({ r, c })
    const d = Math.hypot(hx - x, hz - z)
    if (d < bestD) {
      bestD = d
      best = { r, c }
    }
  }
  return best
}

/** ¿El punto (x,z) cae sobre la protoboard? */
export function onBoard(x: number, z: number) {
  return Math.abs(x) <= BOARD_W / 2 && Math.abs(z) <= BOARD_D / 2
}
