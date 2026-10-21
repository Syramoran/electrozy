import { battery, led, meter, resistor, supply, wire } from '../../engine/build'
import { randomE12 } from '../../engine/circuit'
import type { LedPart, Part } from '../../engine/types'
import { all, meterReads } from '../checks'
import { n, options, pick, si } from '../helpers'
import type { BenchCheck, Lesson } from '../types'

/** Fuente → amperímetro → R1 → vuelta: todo listo para jugar con V y R. */
const ammeterScene = (volts = 9, ohms = 1000) => (): Part[] => [
  supply('fuente', volts, 'T+2', 'T-2', undefined, { label: 'Fuente regulable' }),
  wire('w1', '#c8664d', 'T+4', 'a4'),
  meter('A', 'c4', 'c10'),
  resistor('R1', ohms, 'b10', 0, { label: 'R1' }),
  wire('w2', '#2f2a28', 'a14', 'T-14'),
]
const playScene = ammeterScene(9, 1000)

const burnScene = () => [battery('bat', 9, 'T+2', 'T-2', undefined, { on: false }), wire('w1', '#c8664d', 'T+4', 'a4'), led('L1', 'red', 'c4', 0, { label: 'LED rojo' }), wire('w2', '#2f2a28', 'a6', 'T-6')]

const burned: BenchCheck = (parts) => {
  const l = parts.find((p): p is LedPart => p.kind === 'led')
  if (l?.burned) return { ok: true, msg: 'Sin nada que limite la corriente, pasaron cientos de mA y el LED se quemó.' }
  const b = parts.find((p) => p.kind === 'source')
  return { ok: false, msg: b && 'on' in b && !b.on ? 'Encendé la batería (el interruptor verde).' : undefined }
}

const playedWithSupply: BenchCheck = (parts, sim) => {
  const s = parts.find((p) => p.kind === 'source')
  if (!s || s.kind !== 'source' || s.volts < 15) return { ok: false, msg: 'Subí la fuente a 15 V o más.' }
  return meterReads('A', s.volts / 1000.6, 0.05)(parts, sim)
}

export const l4: Lesson = {
  id: 'ohm',
  n: 4,
  title: 'Ley de Ohm',
  short: 'La relación entre tensión, corriente y resistencia: V = I · R. Con ella calculás casi todo lo que viene.',
  client: {
    name: 'Mateo, que arma un cartel',
    request: 'Quiero poner LEDs en el cartel de mi kiosco con una batería de 9 V, pero el primero se me quemó al toque. ¿Qué hice mal?',
    thanks: 'El cartel de Mateo brilla sin quemar nada.',
  },
  steps: [
    {
      title: 'V = I · R',
      body: [
        'Ohm descubrió que, para un mismo conductor, la razón entre la tensión y la corriente es **constante**: esa constante es la **resistencia**.',
        '**R = V / I**, y despejando: **V = I · R** y **I = V / R**. 1 V sobre 1 Ω hace circular 1 A.',
      ],
      visual: { kind: 'widget', widget: 'triangle' },
      tryIt: 'Tapá una letra del triángulo para ver cómo se calcula.',
    },
    {
      title: 'Es una recta',
      body: [
        'Si mantenés la misma R y vas subiendo V, la corriente sube **en la misma proporción**: el doble de tensión, el doble de corriente.',
        'Con una R más grande, la recta queda más "acostada": hace falta más tensión para la misma corriente.',
      ],
      visual: { kind: 'widget', widget: 'ohmplot' },
      tryIt: 'Mové la tensión y cambiá de resistor.',
    },
    {
      title: 'Probalo en el banco',
      body: [
        'Acá el tester ya está como **amperímetro**, en serie con R1 = 1 kΩ. La fuente arranca en 9 V: I = 9 / 1000 = 9 mA.',
        'Cambiá la tensión de la fuente o el valor de R1 y comprobá con la cuenta lo que marca el tester.',
      ],
      visual: { kind: 'bench', scene: playScene, fit: 15, target: [0, 0, 0.2] },
      tryIt: 'Hacé clic en la fuente o en R1 para cambiar sus valores.',
      gate: { task: 'Subí la fuente a **15 V o más** y fijate que el tester marque V/R.', check: playedWithSupply },
    },
    {
      title: 'Un ejemplo con números',
      body: ['Ejemplo del apunte: un circuito con **12 V** y una resistencia de **1200 Ω**. ¿Cuánta corriente circula?', 'Seguí la cuenta paso a paso.'],
      visual: { kind: 'widget', widget: 'ohmcalc', props: { V: 12, R: 1200 } },
    },
    {
      title: 'Por qué se quemó el LED de Mateo',
      body: [
        'Un LED casi no tiene resistencia una vez que conduce. Conectado directo a 9 V, la corriente la limita solo la resistencia interna de la batería: **cientos de mA**. El LED aguanta unos 20 mA.',
        'Por eso siempre va un **resistor en serie**: R = (V fuente − V LED) / I. Para 9 V, un LED rojo (≈2 V) y 20 mA: (9 − 2) / 0,02 = **350 Ω** (usamos 330 Ω o 390 Ω).',
      ],
      visual: { kind: 'bench', scene: burnScene, fit: 11 },
      gate: { task: 'Encendé la batería para ver qué le pasó al LED de Mateo.', check: burned },
    },
  ],
  practice: [
    (rng) => {
      const V = pick(rng, [5, 9, 12, 24])
      const R = pick(rng, [100, 220, 470, 1000, 1200, 2200])
      return {
        type: 'numeric',
        topic: 'ohm',
        prompt: `Una fuente de **${V} V** alimenta un resistor de **${si(R, 'Ω')}**. ¿Cuánta corriente circula? (en mA)`,
        answer: (V / R) * 1000,
        unit: 'mA',
        hint: 'I = V / R. Te da en amperes: multiplicá por 1000 para pasar a mA.',
        explain: `I = ${V} / ${R} = ${n(V / R)} A = **${n((V / R) * 1000)} mA**.`,
        visual: { kind: 'widget', widget: 'schematic', props: { kind: 'single', V, rs: [R] } },
      }
    },
    (rng) => {
      const Ima = pick(rng, [5, 10, 20, 25, 50])
      const R = pick(rng, [100, 220, 330, 470, 1000])
      return {
        type: 'numeric',
        topic: 'ohm',
        prompt: `Por un resistor de **${si(R, 'Ω')}** circulan **${Ima} mA**. ¿Qué tensión hay entre sus extremos?`,
        answer: (Ima / 1000) * R,
        unit: 'V',
        hint: 'V = I · R, con I en amperes.',
        explain: `V = ${n(Ima / 1000)} A × ${R} Ω = **${n((Ima / 1000) * R)} V**.`,
        visual: { kind: 'widget', widget: 'triangle' },
      }
    },
    (rng) => {
      const ex = pick(rng, [
        { p: '¿Cuál será la corriente en una resistencia de **47 Ω** si la tensión aplicada entre sus extremos es de **220 V**?', a: 220 / 47, u: 'A', e: 'I = 220 / 47 = **4,68 A**.' },
        { p: 'Un voltímetro en paralelo con una resistencia marca **220 V** y un amperímetro en serie marca **2,6 A**. ¿Cuánto vale la resistencia?', a: 220 / 2.6, u: 'Ω', e: 'R = V / I = 220 / 2,6 = **84,6 Ω**.' },
        { p: 'Por una resistencia de **390 Ω** circulan **4 A**. ¿Qué marcará un voltímetro entre sus extremos?', a: 1560, u: 'V', e: 'V = I · R = 4 × 390 = **1560 V**.' },
      ])
      return {
        type: 'numeric',
        topic: 'ohm',
        prompt: `Ejercicio del apunte: ${ex.p}`,
        answer: ex.a,
        unit: ex.u,
        tol: 0.01,
        hint: 'Usá el triángulo: tapá lo que buscás.',
        explain: ex.e,
        visual: { kind: 'widget', widget: 'triangle' },
      }
    },
    (rng) => {
      const V = pick(rng, [5, 9, 12])
      const vf = pick(rng, [2, 2, 3])
      const ima = pick(rng, [10, 15, 20])
      const r = (V - vf) / (ima / 1000)
      return {
        type: 'numeric',
        topic: 'led',
        prompt: `Querés prender un LED (cae **${vf} V**) con **${V} V** y que circulen **${ima} mA**. ¿Qué resistor en serie necesitás? (en Ω)`,
        answer: r,
        unit: 'Ω',
        tol: 0.02,
        hint: 'R = (V fuente − V LED) / I, con I en amperes.',
        explain: `R = (${V} − ${vf}) / ${n(ima / 1000)} = **${n(r, 4)} Ω**. En la práctica elegís el valor comercial más cercano.`,
        visual: { kind: 'widget', widget: 'schematic', props: { kind: 'single', V, rs: [r], labels: ['R?'] } },
      }
    },
    (rng) => {
      const what = pick(rng, ['dup-r', 'dup-v', 'half-r'] as const)
      const map = {
        'dup-r': { q: 'Si **duplicás la resistencia** y la tensión queda igual, la corriente…', a: 'Se reduce a la mitad', w: ['Se duplica', 'No cambia', 'Se cuadruplica'] },
        'dup-v': { q: 'Si **duplicás la tensión** sobre el mismo resistor, la corriente…', a: 'Se duplica', w: ['Se reduce a la mitad', 'No cambia', 'Se hace cero'] },
        'half-r': { q: 'Si la resistencia **baja a la mitad** con la misma tensión, la corriente…', a: 'Se duplica', w: ['Se reduce a la mitad', 'No cambia', 'Baja un poquito'] },
      }[what]
      return {
        type: 'choice',
        topic: 'ohm',
        prompt: map.q,
        ...options(rng, map.a, map.w),
        explain: 'I = V / R: la corriente es proporcional a V e inversamente proporcional a R.',
        visual: { kind: 'widget', widget: 'ohmplot' },
      }
    },
    () => ({
      type: 'numeric',
      topic: 'ohm',
      prompt: 'Ejercicio del apunte: tres resistencias de **16,5 Ω, 45,6 Ω y 67,9 Ω** están en serie con un generador. Un voltímetro sobre la de 45,6 Ω marca **35 V**. ¿Cuál es la tensión del generador?',
      answer: 99.78,
      unit: 'V',
      tol: 0.01,
      hint: 'Con los 35 V y los 45,6 Ω sacás la corriente (es la misma en las tres). Después V = I · R total.',
      explain: 'I = 35 / 45,6 = 0,7675 A; R total = 130 Ω; V = 0,7675 × 130 = **99,78 V**.',
      visual: { kind: 'widget', widget: 'schematic', props: { kind: 'series', V: NaN, rs: [16.5, 45.6, 67.9] } },
    }),
    (rng) => {
      const target = pick(rng, [
        [4.1, 2200],
        [9, 1000],
        [19, 470],
        [27, 330],
      ])
      return {
        type: 'bench',
        topic: 'ohm',
        prompt: `Con la fuente en 9 V, elegí **R1** para que el amperímetro marque cerca de **${target[0]} mA**.`,
        scene: ammeterScene(9, target[1] === 1000 ? 220 : 1000),
        check: all(meterReads('A', 9 / (target[1] + 0.6), 0.08)),
        hint: `R = V / I = 9 V / ${n(target[0] / 1000)} A ≈ ${si(9 / (target[0] / 1000), 'Ω')}. Buscá el valor comercial más cercano.`,
        explain: `R = 9 / ${n(target[0] / 1000)} ≈ ${si(target[1], 'Ω')}.`,
        fit: 15,
      }
    },
    (rng) => {
      const R = randomE12(rng, 2, 3)
      const V = pick(rng, [3, 5, 9, 12])
      return {
        type: 'choice',
        topic: 'ohm',
        prompt: `¿Qué corriente circula con **${V} V** sobre **${si(R, 'Ω')}**?`,
        ...options(rng, si(V / R, 'A'), [si((V * R) / 1000, 'A'), si(V / R / 10, 'A'), si((V / R) * 10, 'A')]),
        explain: `I = V / R = ${V} / ${R} = ${si(V / R, 'A')}.`,
        visual: { kind: 'widget', widget: 'schematic', props: { kind: 'single', V, rs: [R] } },
      }
    },
  ],
}
