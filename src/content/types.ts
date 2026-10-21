import type { SimResult } from '../engine/netlist'
import type { Part } from '../engine/types'
import type { Rng } from '../lib/rng'
import type { EditLevel } from '../sim/BenchOverlay'
import type { WidgetId } from '../widgets/registry'

export type BenchCheck = (parts: Part[], sim: SimResult) => { ok: boolean; msg?: string }

export type Visual =
  | { kind: 'bench'; scene: () => Part[]; fit?: number; target?: [number, number, number]; edit?: EditLevel }
  | { kind: 'widget'; widget: WidgetId; props?: Record<string, unknown> }

export type ExplainStep = {
  title: string
  /** Párrafos cortos; **negrita** permitida. */
  body: string[]
  visual: Visual
  /** Consigna en post-it para tocar algo. */
  tryIt?: string
  /** Si está, hay que lograrlo para seguir. */
  gate?: { task: string; check: BenchCheck }
}

type Base = { topic: string; explain: string; visual?: Visual }

export type Exercise =
  | (Base & { type: 'choice'; prompt: string; options: string[]; answer: number })
  | (Base & { type: 'numeric'; prompt: string; answer: number; unit: string; tol?: number; hint?: string })
  | (Base & { type: 'order'; prompt: string; items: string[] })
  | (Base & { type: 'bench'; prompt: string; scene: () => Part[]; check: BenchCheck; hint?: string; fit?: number; edit?: EditLevel })

export type ExerciseGen = (rng: Rng) => Exercise

export type Lesson = {
  id: string
  n: number
  title: string
  short: string
  client: { name: string; request: string; thanks: string }
  steps: ExplainStep[]
  practice: ExerciseGen[]
  /** Cuántos ejercicios tiene la práctica (por defecto 7). */
  practiceCount?: number
}
