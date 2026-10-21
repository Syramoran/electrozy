import { battery, h, meter, resistor, wire } from '../../engine/build'
import { approxEqual, formatSI, parallel } from '../../engine/circuit'
import { holeNode } from '../../engine/board'
import type { Part } from '../../engine/types'
import { measuresVoltageOf } from '../checks'
import { n, options, pick, si } from '../helpers'
import type { BenchCheck, Lesson } from '../types'
import { apunteScene } from './l8-thevenin'

/** Batería con una carga "pesada" (10 Ω de 10 W): se nota la caída en su resistencia interna. */
const loadedScene = (): Part[] => [
  battery('bat', 9, 'T+2', 'T-2', undefined, { label: 'Batería' }),
  wire('w1', '#c8664d', 'T+5', 'a5'),
  resistor('R1', 10, 'c5', 0, { label: 'R1 · 10 Ω de 10 W', watts: 10, locked: true }),
  wire('w2', '#2f2a28', 'a9', 'T-9'),
  meter('off', null, null),
]

const loadedDrop: BenchCheck = (parts, sim) => {
  const r = measuresVoltageOf('bat', ['plus', 'minus'])(parts, sim)
  if (!r.ok) return r
  const v = sim.meter?.value ?? 0
  if (v > 8.7) return { ok: false, msg: `Marca ${formatSI(v, 'V')}: sin carga la batería da casi todo. Volvé a poner R1 y medí de nuevo.` }
  return { ok: true, msg: `Con la carga marca ${formatSI(v, 'V')}, no 9 V: el resto se queda en la resistencia interna (≈1 Ω).` }
}

/** Amperímetro haciendo de cortocircuito entre A y B: mide IN. */
const measuresIN: BenchCheck = (parts, sim) => {
  const m = parts.find((p) => p.kind === 'meter')
  if (!m || m.kind !== 'meter') return { ok: false }
  if (m.mode !== 'A') return { ok: false, msg: 'IN es una corriente: perilla en mA.' }
  if (!m.red.hole || !m.black.hole) return { ok: false, msg: 'Enchufá las dos puntas: una en A (columna 5) y otra en B (columna 15).' }
  const want = [holeNode(h('e5')), holeNode(h('e15'))].sort().join()
  const got = [sim.nodeOf(m.id, 'red'), sim.nodeOf(m.id, 'black')].sort().join()
  if (want !== got) return { ok: false, msg: 'El amperímetro tiene que unir A (columna 5) con B (columna 15): así los cortocircuita.' }
  const i = Math.abs(sim.meter?.value ?? 0)
  return approxEqual(i, 2 / 4500, 0.03) ? { ok: true, msg: `IN = ${formatSI(i, 'A')}. Y fijate: Vth / Rth = 2 V / 4,5 kΩ = 0,444 mA. ¡Es lo mismo!` } : { ok: false, msg: `Marca ${formatSI(i, 'A')}: revisá que la fuente esté prendida.` }
}

const nortonScene = (): Part[] => apunteScene()

export const l10: Lesson = {
  id: 'fuentes',
  n: 10,
  title: 'Fuentes reales y Norton',
  short: 'Las fuentes de verdad tienen resistencia interna. Fuentes de corriente, cómo se asocian y el teorema de Norton.',
  client: {
    name: 'Sofi, que arma su propia fuente',
    request: 'Mi fuente dice 12 V, pero cuando le conecto el motorcito el tester marca menos. ¿Está fallada? ¿Y qué es eso de las fuentes de corriente que nombra el profe?',
    thanks: 'Sofi entendió su fuente y ahora elige bien qué le conecta.',
  },
  steps: [
    {
      title: 'Ninguna fuente es perfecta',
      body: [
        'Una **fuente de tensión ideal** da siempre la misma tensión, le conectes lo que le conectes. Una **real** es una ideal con una **resistencia interna Ri en serie**.',
        'Cuanta más corriente pide la carga, más tensión se "pierde" en Ri. Para que Ri no importe, la carga tiene que cumplir **RL ≥ 100 · Ri**.',
      ],
      visual: { kind: 'widget', widget: 'realsource', props: { start: 'tension' } },
      tryIt: 'Bajá la carga RL hasta que la fuente pierda bastante tensión.',
    },
    {
      title: 'Medilo con una carga pesada',
      body: [
        'Esta batería de 9 V tiene unos **1 Ω** de resistencia interna, y le colgamos una carga de 10 Ω.',
        'Medí la tensión en sus bornes (en los buses). Si después sacás R1, vas a ver que vuelve a casi 9 V.',
      ],
      visual: { kind: 'bench', scene: loadedScene },
      gate: { task: 'Medí la **tensión de la batería con la carga conectada**.', check: loadedDrop },
    },
    {
      title: 'Fuentes de corriente',
      body: [
        'Una **fuente de corriente ideal** entrega siempre la misma corriente, sin importar la carga. Una **real** es una ideal con una **Ri en paralelo**, por donde se escapa parte de la corriente.',
        'Acá la regla se invierte: para que Ri no importe, **Ri ≥ 100 · RL**. Por eso una fuente de corriente se puede pensar como una de tensión con una resistencia interna enorme.',
      ],
      visual: { kind: 'widget', widget: 'realsource', props: { start: 'corriente' } },
      tryIt: 'Subí la carga RL y mirá cómo se escapa corriente por Ri.',
    },
    {
      title: 'Asociar fuentes',
      body: [
        'Fuentes de **tensión**: en serie se suman; en paralelo tienen que ser iguales.',
        'Fuentes de **corriente**: al revés. En **paralelo** se suman; en **serie** tienen que ser iguales, si no es un caso absurdo.',
      ],
      visual: { kind: 'widget', widget: 'currentassoc' },
      tryIt: 'Pasá a serie con dos corrientes distintas.',
    },
    {
      title: 'Teorema de Norton',
      body: [
        'Es el primo de Thevenin: cualquier circuito lineal, visto desde dos bornes, es una **fuente de corriente IN en paralelo con RN**.',
        '**IN** es la corriente que circula cuando **cortocircuitás** los bornes de carga. **RN** se calcula igual que Rth: fuentes anuladas, carga afuera. Y se cumple **IN = Vth / Rth**.',
      ],
      visual: { kind: 'widget', widget: 'norton' },
      tryIt: 'Seguí los tres pasos con el ejemplo del apunte.',
    },
    {
      title: 'IN en el banco',
      body: [
        'Volvemos al circuito del ejemplo 5 (Vth = 2 V, Rth = 4,5 kΩ). El amperímetro por dentro es casi un cable: si lo ponés entre A y B, **los cortocircuita y mide IN**.',
        'Ojo: esto se puede hacer acá porque el circuito limita la corriente con sus resistencias. Nunca lo hagas sobre una fuente sola.',
      ],
      visual: { kind: 'bench', scene: nortonScene },
      gate: { task: 'Medí **IN** con el amperímetro entre A (columna 5) y B (columna 15).', check: measuresIN },
    },
  ],
  practice: [
    (rng) => {
      const V = pick(rng, [9, 12])
      const ri = pick(rng, [0.5, 1, 2])
      const rl = pick(rng, [4, 10, 22])
      return {
        type: 'numeric',
        topic: 'fuentes-reales',
        prompt: `Una fuente de **${V} V** con resistencia interna **${n(ri)} Ω** alimenta una carga de **${rl} Ω**. ¿Qué tensión le llega a la carga?`,
        answer: (V * rl) / (rl + ri),
        unit: 'V',
        tol: 0.01,
        hint: 'Es un divisor: VL = V · RL / (RL + Ri).',
        explain: `VL = ${V} × ${rl} / (${rl} + ${n(ri)}) = **${n((V * rl) / (rl + ri))} V**.`,
        visual: { kind: 'widget', widget: 'realsource', props: { start: 'tension' } },
      }
    },
    (rng) => {
      const ri = pick(rng, [0.5, 1, 2, 5])
      return {
        type: 'numeric',
        topic: 'fuentes-reales',
        prompt: `Una fuente de tensión tiene **Ri = ${n(ri)} Ω**. ¿Cuál es la carga **mínima** para poder considerarla ideal? (en Ω)`,
        answer: 100 * ri,
        unit: 'Ω',
        hint: 'Para fuentes de tensión: RL ≥ 100 · Ri.',
        explain: `RL ≥ 100 × ${n(ri)} = **${n(100 * ri)} Ω**.`,
        visual: { kind: 'widget', widget: 'realsource', props: { start: 'tension' } },
      }
    },
    (rng) => {
      const rl = pick(rng, [10, 47, 100, 220])
      return {
        type: 'numeric',
        topic: 'fuentes-reales',
        prompt: `Una fuente de **corriente** alimenta una carga de **${si(rl, 'Ω')}**. ¿Cuánto tiene que valer como mínimo su Ri para considerarla ideal? (en Ω)`,
        answer: 100 * rl,
        unit: 'Ω',
        hint: 'Para fuentes de corriente: Ri ≥ 100 · RL.',
        explain: `Ri ≥ 100 × ${rl} = **${n(100 * rl)} Ω**.`,
        visual: { kind: 'widget', widget: 'realsource', props: { start: 'corriente' } },
      }
    },
    (rng) => ({
      type: 'choice',
      topic: 'fuentes-reales',
      prompt: '¿Cómo se representa una **fuente de corriente real**?',
      ...options(rng, 'Una fuente de corriente ideal con una resistencia en paralelo', ['Una fuente de corriente ideal con una resistencia en serie', 'Una fuente de tensión ideal sin resistencia', 'Dos fuentes de corriente en serie']),
      explain: 'Tensión real: ideal + Ri en **serie**. Corriente real: ideal + Ri en **paralelo**.',
      visual: { kind: 'widget', widget: 'realsource', props: { start: 'corriente' } },
    }),
    (rng) => {
      const [a, b] = pick(rng, [
        [2, 3],
        [1, 4],
        [0.5, 1.5],
      ])
      const par = rng() < 0.5
      return {
        type: 'choice',
        topic: 'fuentes-reales',
        prompt: `Conectás **en ${par ? 'paralelo' : 'serie'}** dos fuentes ideales de corriente de ${n(a)} A y ${n(b)} A. ¿Qué pasa?`,
        ...options(rng, par ? `Entregan ${n(a + b)} A entre las dos` : 'Es un caso absurdo: en serie tendrían que ser iguales', par ? ['Es un caso absurdo', `Entregan ${n(Math.max(a, b))} A`, `Entregan ${n(Math.abs(b - a))} A`] : [`Entregan ${n(a + b)} A`, `Entregan ${n(Math.min(a, b))} A`, 'Funcionan como una de tensión']),
        explain: 'Fuentes de corriente: en paralelo **se suman**; en serie **tienen que ser iguales**.',
        visual: { kind: 'widget', widget: 'currentassoc' },
      }
    },
    (rng) => {
      const vth = pick(rng, [2, 5, 9, 12])
      const rth = pick(rng, [100, 470, 1000, 4500])
      return {
        type: 'numeric',
        topic: 'norton',
        prompt: `Un circuito tiene **Vth = ${vth} V** y **Rth = ${si(rth, 'Ω')}**. ¿Cuánto vale su corriente de Norton **IN**? (en mA)`,
        answer: (vth / rth) * 1000,
        unit: 'mA',
        tol: 0.01,
        hint: 'IN = Vth / Rth, y RN = Rth.',
        explain: `IN = ${vth} / ${rth} = **${n((vth / rth) * 1000)} mA** (en paralelo con RN = ${si(rth, 'Ω')}).`,
        visual: { kind: 'widget', widget: 'norton' },
      }
    },
    (rng) => {
      const which = pick(rng, ['IN', 'RN'] as const)
      return {
        type: 'numeric',
        topic: 'norton',
        prompt:
          which === 'IN'
            ? 'Ejemplo del apunte: V = 10 V, R1 = 2 Ω, R2 = 3 Ω (a masa) y R3 = 4 Ω hasta la salida. ¿Cuánto vale **IN**?'
            : 'Ejemplo del apunte: V = 10 V, R1 = 2 Ω, R2 = 3 Ω (a masa) y R3 = 4 Ω hasta la salida. ¿Cuánto vale **RN**? (en Ω)',
        answer: which === 'IN' ? (10 / (2 + parallel(3, 4))) * (parallel(3, 4) / 4) : 4 + parallel(2, 3),
        unit: which === 'IN' ? 'A' : 'Ω',
        tol: 0.01,
        hint: which === 'IN' ? 'Con la salida en corto, R2 y R3 quedan en paralelo. Sacá la corriente total y quedate con la parte que va por R3.' : 'Anulá la fuente (corto): R1 ‖ R2 en serie con R3.',
        explain: which === 'IN' ? 'IN = 10/(2 + 3‖4) · (3‖4)/4 = **1,153 A**.' : 'RN = 4 + 2‖3 = 4 + 1,2 = **5,2 Ω**.',
        visual: { kind: 'widget', widget: 'norton' },
      }
    },
    (rng) => {
      const I = pick(rng, [0.1, 0.5, 1])
      const rn = pick(rng, [10, 100])
      const rl = pick(rng, [10, 47, 100])
      return {
        type: 'numeric',
        topic: 'norton',
        prompt: `Un equivalente de Norton tiene **IN = ${n(I)} A** y **RN = ${rn} Ω**. ¿Qué corriente pasa por una carga de **${rl} Ω**? (en mA)`,
        answer: I * (rn / (rn + rl)) * 1000,
        unit: 'mA',
        tol: 0.02,
        hint: 'Divisor de corriente: IL = IN · RN / (RN + RL).',
        explain: `IL = ${n(I)} × ${rn} / (${rn} + ${rl}) = **${n(I * (rn / (rn + rl)) * 1000)} mA**.`,
        visual: { kind: 'widget', widget: 'norton' },
      }
    },
  ],
}
