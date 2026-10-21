// Estado del banco de trabajo: piezas, arrastre, snap y simulación.

import { create } from 'zustand'
import { BOARD_D, holeKey, holePos, nearestHole, onBoard, PITCH, validHole, type Hole } from '../engine/board'
import { simulate, type SimResult, type Warning } from '../engine/netlist'
import { flexEnds, isRigid, rigidPins, SPAN, type End, type MeterMode, type Part, type RigidPart } from '../engine/types'
import { sfx } from '../lib/sound'
import { useProgress } from '../store/progress'

export type DragTarget = { id: string; pin?: string }

type BenchState = {
  parts: Part[]
  sim: SimResult
  selected: string | null
  drag: DragTarget | null
  /** Agujeros donde caería lo que se está arrastrando (para pintar la tira). */
  preview: Hole[]
  hoverHole: Hole | null
  /** Se incrementa con cada cambio "real" del circuito (para que los ejercicios re-validen). */
  version: number
  /** Cambia solo al cargar una escena nueva (para reencuadrar la cámara). */
  loadId: number
  load: (parts: Part[]) => void
  select: (id: string | null) => void
  startDrag: (t: DragTarget) => void
  dragTo: (x: number, z: number) => void
  endDrag: () => void
  rotate: (id: string) => void
  update: (id: string, patch: Partial<Part>) => void
  setMode: (mode: MeterMode) => void
  add: (p: Part) => void
  remove: (id: string) => void
  setHover: (h: Hole | null) => void
}

const clone = (parts: Part[]) => structuredClone(parts)

/** Centro de una pieza rígida (en el aire o encastrada). */
export function rigidCenter(p: RigidPart): [number, number] {
  const pins = rigidPins(p)
  if (!pins) return [p.x, p.z]
  const [ax, az] = holePos(pins[0])
  const [bx, bz] = holePos(pins[1])
  return [(ax + bx) / 2, (az + bz) / 2]
}

export function endPos(e: End): [number, number] {
  return e.hole ? holePos(e.hole) : [e.x, e.z]
}

function occupied(parts: Part[], skip: DragTarget): Set<string> {
  const s = new Set<string>()
  for (const p of parts) {
    if (isRigid(p)) {
      if (p.id === skip.id && !skip.pin) continue
      rigidPins(p)?.forEach((h) => s.add(holeKey(h)))
    } else {
      for (const [pin, e] of flexEnds(p)) {
        if (p.id === skip.id && pin === skip.pin) continue
        if (e.hole) s.add(holeKey(e.hole))
      }
    }
  }
  return s
}

/** Dónde encastraría una pieza rígida si se soltara con su centro en (x,z). */
function rigidSnap(p: RigidPart, x: number, z: number, occ: Set<string>): Hole | null {
  if (!onBoard(x, z)) return null
  const half = (SPAN[p.kind] * PITCH) / 2
  const anchor = p.rot === 0 ? nearestHole(x - half, z, PITCH) : nearestHole(x, z - half, PITCH * 1.6)
  if (!anchor) return null
  const pins = rigidPins({ ...p, hole: anchor })!
  if (!pins.every(validHole) || pins.some((h) => occ.has(holeKey(h)))) return null
  return anchor
}

function endSnap(x: number, z: number, occ: Set<string>): Hole | null {
  const h = nearestHole(x, z)
  return h && !occ.has(holeKey(h)) ? h : null
}

function withSim(parts: Part[]) {
  let sim = simulate(parts)
  // Un LED con demasiada corriente se quema: queda abierto y se re-simula.
  if (sim.burned.length) {
    sfx.pop()
    parts = parts.map((p) => (p.kind === 'led' && sim.burned.includes(p.id) ? { ...p, burned: true } : p))
    const again = simulate(parts)
    sim = { ...again, burned: sim.burned, warnings: [...sim.warnings.filter((w) => w.kind === 'ledBurn'), ...again.warnings] }
  }
  return { parts, sim }
}

// Los desastres nuevos suman a los logros (solo por acciones del alumno, no al cargar escenas).
const MISHAP_STAT: Partial<Record<Warning['kind'], string>> = { short: 'shorts', fuse: 'fuses', hot: 'hot', ledReverse: 'reverse', ohmPowered: 'ohmPowered' }
function countMishaps(before: Warning[], sim: SimResult) {
  const had = new Set(before.map((w) => w.kind + w.partId))
  const bump = useProgress.getState().bump
  if (sim.burned.length) bump('ledBurned', sim.burned.length)
  for (const w of sim.warnings) {
    const stat = MISHAP_STAT[w.kind]
    if (stat && !had.has(w.kind + w.partId)) bump(stat)
  }
}

let lastFlow = false
function maybeHum(sim: SimResult) {
  const flow = Object.values(sim.partI).some((i) => Math.abs(i) > 1e-4)
  if (flow && !lastFlow) sfx.hum()
  lastFlow = flow
}

export const useBench = create<BenchState>((set, get) => {
  const commit = (parts: Part[], extra: Partial<BenchState> = {}) => {
    const before = get().sim.warnings
    const r = withSim(parts)
    maybeHum(r.sim)
    set((s) => ({ ...r, version: s.version + 1, ...extra }))
    countMishaps(before, r.sim)
  }

  return {
    parts: [],
    sim: simulate([]),
    selected: null,
    drag: null,
    preview: [],
    hoverHole: null,
    version: 0,
    loadId: 0,

    load: (parts) => {
      lastFlow = true // no zumbar al abrir una escena
      const r = withSim(clone(parts))
      lastFlow = Object.values(r.sim.partI).some((i) => Math.abs(i) > 1e-4)
      set((s) => ({ ...r, selected: null, drag: null, preview: [], version: s.version + 1, loadId: s.loadId + 1 }))
    },

    select: (id) => set({ selected: id }),

    startDrag: (t) => {
      const p = get().parts.find((q) => q.id === t.id)
      if (!p) return
      if ('locked' in p && p.locked && !t.pin) return set({ selected: t.id })
      sfx.pick()
      // Al levantar algo, se desconecta: la simulación lo refleja en vivo.
      const parts = get().parts.map((q) => {
        if (q.id !== t.id) return q
        if (isRigid(q) && !t.pin) {
          const [cx, cz] = rigidCenter(q)
          return { ...q, hole: null, x: cx, z: cz }
        }
        if (t.pin) {
          const e = (q as unknown as Record<string, End>)[t.pin]
          const [x, z] = endPos(e)
          return { ...q, [t.pin]: { hole: null, x, z } } as Part
        }
        return q
      })
      commit(parts, { drag: t, selected: t.id })
    },

    dragTo: (x, z) => {
      const { drag, parts } = get()
      if (!drag) return
      const occ = occupied(parts, drag)
      let preview: Hole[] = []
      const next = parts.map((q) => {
        if (q.id !== drag.id) return q
        if (drag.pin) {
          const h = endSnap(x, z, occ)
          preview = h ? [h] : []
          return { ...q, [drag.pin]: { hole: null, x, z } } as Part
        }
        if (isRigid(q)) {
          const a = rigidSnap(q, x, z, occ)
          preview = a ? rigidPins({ ...q, hole: a })! : []
          return { ...q, x, z }
        }
        if (q.kind === 'source' || q.kind === 'meter') {
          // El cuerpo se mueve y arrastra las puntas que no están enchufadas.
          const dx = x - q.x
          const dz = z - q.z
          const move = (e: End): End => (e.hole ? e : { ...e, x: e.x + dx, z: e.z + dz })
          return q.kind === 'source'
            ? { ...q, x, z, plus: move(q.plus), minus: move(q.minus) }
            : { ...q, x, z, red: move(q.red), black: move(q.black) }
        }
        return q
      })
      set({ parts: next, preview })
    },

    endDrag: () => {
      const { drag, parts } = get()
      if (!drag) return
      const occ = occupied(parts, drag)
      let snapped = false
      const next = parts.map((q) => {
        if (q.id !== drag.id) return q
        if (drag.pin) {
          const e = (q as unknown as Record<string, End>)[drag.pin]
          const h = endSnap(e.x, e.z, occ)
          snapped = !!h
          if (!h) return q
          const [x, z] = holePos(h)
          return { ...q, [drag.pin]: { hole: h, x, z } } as Part
        }
        if (isRigid(q)) {
          const a = rigidSnap(q, q.x, q.z, occ)
          snapped = !!a
          if (a) return { ...q, hole: a }
          // Si queda flotando sobre la protoboard sin encastrar, lo dejamos al costado.
          if (onBoard(q.x, q.z)) return { ...q, z: BOARD_D / 2 + 0.7 }
        }
        return q
      })
      if (snapped) {
        sfx.snap()
        useProgress.getState().bump('snaps')
      } else sfx.drop()
      commit(next, { drag: null, preview: [] })
    },

    rotate: (id) => {
      const parts = get().parts.map((q) => {
        if (q.id !== id || !isRigid(q)) return q
        const [cx, cz] = rigidCenter(q)
        const r = { ...q, rot: (q.rot === 0 ? 1 : 0) as 0 | 1, hole: null, x: cx, z: cz }
        const occ = occupied(get().parts, { id })
        const a = rigidSnap(r, cx, cz, occ)
        return a ? { ...r, hole: a } : onBoard(cx, cz) ? { ...r, z: BOARD_D / 2 + 0.7 } : r
      })
      sfx.click()
      commit(parts)
    },

    update: (id, patch) => commit(get().parts.map((q) => (q.id === id ? ({ ...q, ...patch } as Part) : q))),

    setMode: (mode) => {
      sfx.click()
      commit(get().parts.map((q) => (q.kind === 'meter' ? { ...q, mode } : q)))
    },

    add: (p) => {
      sfx.drop()
      useProgress.getState().bump('partsAdded')
      commit([...get().parts, p], { selected: p.id })
    },

    remove: (id) => commit(get().parts.filter((q) => q.id !== id), { selected: null }),

    setHover: (h) => {
      const cur = get().hoverHole
      if (cur?.r === h?.r && cur?.c === h?.c) return
      set({ hoverHole: h })
    },
  }
})

// Para depurar desde la consola del navegador.
if (import.meta.env.DEV) (window as unknown as { __bench: typeof useBench }).__bench = useBench
