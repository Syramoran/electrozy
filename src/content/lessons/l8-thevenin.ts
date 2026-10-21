import { meter, resistor, supply, wire } from '../../engine/build'
import { parallel } from '../../engine/circuit'
import type { Part } from '../../engine/types'
import { all, measuresResistanceBetween, measuresVoltageBetween, measuresVoltageOf } from '../checks'
import { n, options, pick, si } from '../helpers'
import type { BenchCheck, Lesson } from '../types'

/**
 * Ejemplo 5 del apunte armado en la protoboard: 12 V con dos divisores.
 * Borne A = columna 5 (R1 5k arriba, R3 5k abajo) → 6 V. Borne B = columna 15 (R2 6k, R4 3k) → 4 V.
 */
export const apunteScene = (): Part[] => [
  supply('fuente', 12, 'T+2', 'T-2', [-7.6, -0.4], { label: 'Fuente' }),
  wire('w1', '#c8664d', 'T+1', 'a1'),
  resistor('R1', 5000, 'c1', 0, { label: 'R1 · 5 kΩ', locked: true }),
  resistor('R3', 5000, 'd5', 0, { label: 'R3 · 5 kΩ', locked: true }),
  wire('w2', '#2f2a28', 'a9', 'T-9'),
  wire('w3', '#c8664d', 'T+11', 'a11'),
  resistor('R2', 6000, 'c11', 0, { label: 'R2 · 6 kΩ', locked: true }),
  resistor('R4', 3000, 'd15', 0, { label: 'R4 · 3 kΩ', locked: true }),
  wire('w4', '#2f2a28', 'a19', 'T-19'),
  meter('off', null, null),
]

/** Igual, con un cable suelto para hacer el puente entre buses. */
const rthScene = (): Part[] => [...apunteScene(), wire('puente', '#e1b54f', null, null, [-1.5, 3.4])]

const sourceOff: BenchCheck = (parts) => {
  const s = parts.find((p) => p.kind === 'source')
  return s && s.kind === 'source' && s.on ? { ok: false, msg: 'Primero apagá la fuente: anularla es sacarle la tensión.' } : { ok: true }
}

/** Un divisor simple para practicar Vth. */
const dividerScene =
  (r1: number, r2: number) =>
  (): Part[] => [
    supply('fuente', 9, 'T+2', 'T-2', undefined, { label: 'Fuente' }),
    wire('w1', '#c8664d', 'T+4', 'a4'),
    resistor('R1', r1, 'c4', 0, { label: 'R1' }),
    resistor('R2', r2, 'd8', 0, { label: 'R2' }),
    wire('w2', '#2f2a28', 'a12', 'T-12'),
    meter('off', null, null),
  ]

export const l8: Lesson = {
  id: 'thevenin',
  n: 8,
  title: 'Teorema de Thevenin',
  short: 'Cualquier circuito de fuentes y resistencias, visto desde dos bornes, se porta como una sola fuente con una resistencia en serie.',
  client: {
    name: 'Martina, la del laboratorio',
    request: 'Me pasaron una plaqueta llena de resistencias y a mí solo me importa lo que le llega a la carga. ¿No hay una forma de achicar todo eso a algo simple?',
    thanks: 'Martina resolvió la plaqueta con dos números: Vth y Rth.',
  },
  steps: [
    {
      title: 'La caja misteriosa',
      body: [
        '**Teorema de Thevenin:** cualquier circuito lineal con resistencias y fuentes, mirado desde dos bornes, se puede reemplazar por **una fuente Vth en serie con una resistencia Rth**.',
        'Desde afuera no hay forma de notar la diferencia: la carga recibe lo mismo. Jugá a descubrir qué hay en la caja.',
      ],
      visual: { kind: 'widget', widget: 'blackbox' },
      tryIt: 'Primero sacá la carga (RL = ∞) para leer Vth; después buscá Rth con una carga cualquiera.',
    },
    {
      title: 'Vth: lo que se mide sin carga',
      body: [
        'Este es el ejemplo 5 del apunte armado en la protoboard. Los bornes son **A (columna 5)** y **B (columna 15)**; la carga RL está desconectada.',
        'Un divisor deja A en 6 V y el otro deja B en 4 V. **Vth** es la tensión entre los bornes con la carga afuera: se la llama **tensión de circuito abierto**.',
      ],
      visual: { kind: 'bench', scene: apunteScene },
      gate: { task: 'Medí **Vth** con el voltímetro entre A (columna 5) y B (columna 15).', check: measuresVoltageBetween('e5', 'e15', 2) },
    },
    {
      title: 'Rth: anulá la fuente y medí',
      body: [
        '**Rth** es la resistencia que se ve desde los bornes con las fuentes **anuladas**. Anular una fuente de tensión es reemplazarla por un **cortocircuito**; una de corriente, por un circuito abierto.',
        'En el banco: apagá la fuente, uní el bus + con el bus − con un cable y medí con el óhmetro entre A y B. Tiene que dar 5k‖5k + 6k‖3k = **4,5 kΩ**.',
      ],
      visual: { kind: 'bench', scene: rthScene },
      tryIt: 'Usá el cable amarillo suelto como puente entre el bus + y el bus −.',
      gate: {
        task: 'Medí **Rth** entre A y B con la fuente anulada.',
        check: all(sourceOff, measuresResistanceBetween('e5', 'e15', 4500, 0.015, 'Apagar la fuente la deja abierta: para anularla de verdad, poné un cable entre el bus + y el bus −.')),
      },
    },
    {
      title: 'El circuito queda chiquito',
      body: [
        'Todo el circuito se reduce a **2 V en serie con 4,5 kΩ**. Ahora, para cualquier carga: **I = Vth / (Rth + RL)**.',
        'Con RL = 1 kΩ: I = 2 / 5500 ≈ 0,36 mA, sin volver a resolver los dos divisores. Esa es la gracia de Thevenin.',
      ],
      visual: { kind: 'widget', widget: 'schematic', props: { kind: 'series', V: 2, rs: [4500, 1000], labels: ['Rth', 'RL'], caption: 'El equivalente de Thevenin con una carga RL.' } },
    },
  ],
  practice: [
    (rng) => {
      const V = pick(rng, [9, 12])
      const [a, b] = pick(rng, [
        [1000, 1000],
        [2200, 1000],
        [1000, 2200],
        [4700, 4700],
      ])
      return {
        type: 'numeric',
        topic: 'thevenin',
        prompt: `Un divisor de **${V} V** con R1 = ${si(a, 'Ω')} (arriba) y R2 = ${si(b, 'Ω')} (abajo). Tomando los bornes sobre R2, ¿cuánto vale **Vth**?`,
        answer: (V * b) / (a + b),
        unit: 'V',
        tol: 0.02,
        hint: 'Vth es la tensión en vacío sobre R2: el divisor V · R2 / (R1 + R2).',
        explain: `Vth = ${V} × ${b} / ${a + b} = **${n((V * b) / (a + b))} V**.`,
        visual: { kind: 'widget', widget: 'schematic', props: { kind: 'series', V, rs: [a, b] } },
      }
    },
    (rng) => {
      const [a, b] = pick(rng, [
        [1000, 1000],
        [2200, 1000],
        [4700, 4700],
        [3000, 6000],
      ])
      return {
        type: 'numeric',
        topic: 'thevenin',
        prompt: `En ese mismo divisor (R1 = ${si(a, 'Ω')}, R2 = ${si(b, 'Ω')}), ¿cuánto vale **Rth** vista desde R2? (en Ω)`,
        answer: parallel(a, b),
        unit: 'Ω',
        tol: 0.02,
        hint: 'Anulá la fuente (cortocircuito): R1 y R2 quedan en paralelo vistas desde los bornes.',
        explain: `Rth = R1‖R2 = ${a}·${b}/(${a}+${b}) = **${n(parallel(a, b), 4)} Ω**.`,
        visual: { kind: 'widget', widget: 'blackbox' },
      }
    },
    (rng) => {
      const vth = pick(rng, [2, 5, 6, 9])
      const rth = pick(rng, [1000, 2200, 4500])
      const rl = pick(rng, [1000, 2200, 4700])
      const i = vth / (rth + rl)
      return {
        type: 'numeric',
        topic: 'thevenin',
        prompt: `Un circuito tiene Vth = **${vth} V** y Rth = **${si(rth, 'Ω')}**. Le conectás una carga de **${si(rl, 'Ω')}**. ¿Qué corriente circula? (en mA)`,
        answer: i * 1000,
        unit: 'mA',
        tol: 0.02,
        hint: 'I = Vth / (Rth + RL)',
        explain: `I = ${vth} / (${rth} + ${rl}) = **${n(i * 1000)} mA**.`,
        visual: { kind: 'widget', widget: 'schematic', props: { kind: 'series', V: vth, rs: [rth, rl], labels: ['Rth', 'RL'] } },
      }
    },
    (rng) => {
      const which = pick(rng, ['V', 'R'] as const)
      return {
        type: 'numeric',
        topic: 'thevenin',
        prompt: which === 'V' ? 'Ejemplo 5 del apunte: VA = 6 V y VB = 4 V. ¿Cuánto vale **Vth** entre A y B?' : 'Ejemplo 5 del apunte: con la fuente en corto quedan 5k‖5k en serie con 6k‖3k. ¿Cuánto vale **Rth**? (en Ω)',
        answer: which === 'V' ? 2 : 4500,
        unit: which === 'V' ? 'V' : 'Ω',
        tol: 0.01,
        hint: which === 'V' ? 'Vth = VA − VB' : '5k‖5k = 2,5 kΩ y 6k‖3k = 2 kΩ',
        explain: which === 'V' ? 'Vth = 6 − 4 = **2 V**.' : 'Rth = 2,5 kΩ + 2 kΩ = **4,5 kΩ**.',
        visual: { kind: 'widget', widget: 'blackbox' },
      }
    },
    (rng) => ({
      type: 'choice',
      topic: 'thevenin',
      prompt: 'Para calcular Rth hay que **anular** las fuentes. ¿Cómo se anula una fuente de **tensión**?',
      ...options(rng, 'Reemplazándola por un cortocircuito (un cable)', ['Reemplazándola por un circuito abierto', 'Duplicando su tensión', 'Dejándola como está']),
      explain: 'Fuente de tensión → **cortocircuito**. Fuente de corriente → **circuito abierto**.',
      visual: { kind: 'widget', widget: 'blackbox' },
    }),
    (rng) => ({
      type: 'choice',
      topic: 'thevenin',
      prompt: '¿Por qué a Vth también se la llama **tensión de circuito abierto**?',
      ...options(rng, 'Porque se mide entre los bornes con la carga desconectada', ['Porque el circuito tiene que estar apagado', 'Porque se mide con el amperímetro', 'Porque es la tensión de la fuente']),
      explain: 'Sin carga no circula corriente por Rth, así que entre los bornes aparece toda Vth.',
      visual: { kind: 'widget', widget: 'blackbox' },
    }),
    (rng) => {
      const [a, b] = pick(rng, [
        [1000, 1000],
        [1000, 2200],
        [2200, 1000],
      ])
      return {
        type: 'bench',
        topic: 'thevenin',
        prompt: `Medí **Vth** del divisor: es la tensión sobre R2 (${si(b, 'Ω')}) sin ninguna carga conectada.`,
        scene: dividerScene(a, b),
        check: measuresVoltageOf('R2'),
        hint: 'R2 va de la columna 8 a la 12. Perilla en V⎓: roja en la 8, negra en la 12.',
        explain: `Vth = 9 × ${b} / ${a + b} ≈ ${n((9 * b) / (a + b))} V.`,
      }
    },
  ],
}
