import { resistor, supply, wire } from '../../engine/build'
import { coolAndOn, heats } from '../checks'
import { n, options, pick, si } from '../helpers'
import type { Lesson } from '../types'

const heatScene = () => [supply('fuente', 2, 'T+2', 'T-2', undefined, { label: 'Fuente regulable' }), wire('w1', '#c8664d', 'T+5', 'a5'), resistor('R1', 100, 'c5', 0, { label: 'R1' }), wire('w2', '#2f2a28', 'a9', 'T-9')]

/** Dos resistores a la misma tensión: el más chico calienta más. */
const pairScene = () => [
  supply('fuente', 9, 'T+2', 'T-2', undefined, { label: 'Fuente regulable' }),
  wire('w1', '#c8664d', 'T+5', 'a5'),
  resistor('R1', 100, 'c5', 0, { label: 'R1' }),
  wire('w2', '#2f2a28', 'a9', 'T-9'),
  wire('w3', '#c8664d', 'T+13', 'a13'),
  resistor('R2', 1000, 'c13', 0, { label: 'R2' }),
  wire('w4', '#2f2a28', 'a17', 'T-17'),
]

const tightScene = () => [supply('fuente', 9, 'T+2', 'T-2', undefined, { label: 'Fuente regulable', on: true }), wire('w1', '#c8664d', 'T+5', 'a5'), resistor('R1', 47, 'c5', 0, { label: 'R1' }), wire('w2', '#2f2a28', 'a9', 'T-9')]

export const l6: Lesson = {
  id: 'potencia',
  n: 6,
  title: 'Potencia y calor',
  short: 'Cuánta energía por segundo usa algo, por qué los resistores se calientan (ley de Joule) y qué es el valor eficaz.',
  client: {
    name: 'la abuela Tita',
    request: 'Querido, cuando prendo la estufa y la pava juntas salta la térmica. ¿Por qué será? ¿Y por qué el cable de la estufa está siempre tibio?',
    thanks: 'La abuela Tita ya no prende todo junto (y te convidó unos mates).',
  },
  steps: [
    {
      title: 'Potencia: energía por segundo',
      body: [
        'La **potencia** es la velocidad con la que algo produce o consume energía. Se mide en **watts (W)**.',
        'Hay 1 W cuando 1 V hace circular 1 A: **P = V · I**. Para tener más potencia, subís la tensión o la corriente.',
      ],
      visual: { kind: 'widget', widget: 'power' },
      tryIt: 'Subí la tensión y mirá cómo crece la potencia (y el color del resistor).',
    },
    {
      title: 'Ley de Joule: todo termina en calor',
      body: [
        'Cuando la corriente atraviesa un resistor, la energía eléctrica se transforma en **calor**. Por eso los resistores tienen una potencia máxima: los comunes aguantan **¼ W**.',
        'Si disipan más, se recalientan, cambian de color y terminan quemándose.',
      ],
      visual: { kind: 'bench', scene: heatScene },
      tryIt: 'Hacé clic en la fuente y subí la tensión de a poco. Mirá también la etiqueta de R1.',
      gate: { task: 'Hacé que **R1 se recaliente** (que disipe más de ¼ W).', check: heats('R1') },
    },
    {
      title: 'Tres fórmulas, la misma potencia',
      body: [
        'Juntando P = V · I con la ley de Ohm salen dos más: **P = I² · R** y **P = V² / R**. Usá la que tenga los datos que conocés.',
        'Ejemplo del apunte: 12 V sobre 1200 Ω → P = 12² / 1200 = **0,12 W = 120 mW**.',
      ],
      visual: { kind: 'widget', widget: 'power' },
      tryIt: 'Cambiá entre las tres fórmulas: el resultado es siempre el mismo.',
    },
    {
      title: 'A la misma tensión, ¿quién calienta más?',
      body: [
        'Con la misma tensión, el resistor **más chico** deja pasar más corriente y **disipa más**: P = V² / R.',
        'Por eso, cuando prendés la estufa y la pava a la vez, entre las dos piden tanta corriente que salta la térmica.',
      ],
      visual: { kind: 'bench', scene: pairScene },
      tryIt: 'Tocá R1 y R2 y compará cuánto disipa cada uno.',
      gate: { task: 'Cambiá **R1** por uno que no se recaliente, pero que siga pasando corriente.', check: coolAndOn('R1') },
    },
    {
      title: 'El valor eficaz (RMS)',
      body: [
        'En alterna la tensión sube y baja todo el tiempo. ¿Cuánto "vale" entonces? El **valor eficaz** es la continua que produciría **el mismo calor**.',
        'Para una senoidal: **Vrms = Vp / √2**. Los 220 V del enchufe son eficaces: el pico es 220 × √2 ≈ **311 V**.',
      ],
      visual: { kind: 'widget', widget: 'rms' },
      tryIt: 'Ajustá la continua hasta que las dos estufitas calienten igual.',
    },
  ],
  practice: [
    (rng) => {
      const V = pick(rng, [5, 9, 12, 220])
      const I = pick(rng, [0.1, 0.5, 2, 1.5])
      return {
        type: 'numeric',
        topic: 'potencia',
        prompt: `Un aparato funciona con **${V} V** y consume **${n(I)} A**. ¿Qué potencia tiene?`,
        answer: V * I,
        unit: 'W',
        hint: 'P = V · I',
        explain: `P = ${V} V × ${n(I)} A = **${n(V * I)} W**.`,
        visual: { kind: 'widget', widget: 'power' },
      }
    },
    (rng) => {
      const V = pick(rng, [5, 9, 12, 24])
      const R = pick(rng, [100, 220, 470, 1000, 1200])
      return {
        type: 'numeric',
        topic: 'joule',
        prompt: `¿Cuánta potencia disipa un resistor de **${si(R, 'Ω')}** conectado a **${V} V**? (en mW)`,
        answer: ((V * V) / R) * 1000,
        unit: 'mW',
        hint: 'P = V² / R. Te da en W: multiplicá por 1000 para pasar a mW.',
        explain: `P = ${V}² / ${R} = ${n((V * V) / R)} W = **${n(((V * V) / R) * 1000)} mW**.`,
        visual: { kind: 'widget', widget: 'schematic', props: { kind: 'single', V, rs: [R] } },
      }
    },
    (rng) => {
      const I = pick(rng, [0.01, 0.02, 0.05, 0.1])
      const R = pick(rng, [47, 100, 220, 330])
      return {
        type: 'numeric',
        topic: 'joule',
        prompt: `Por un resistor de **${si(R, 'Ω')}** circulan **${n(I * 1000)} mA**. ¿Cuánto disipa? (en mW)`,
        answer: I * I * R * 1000,
        unit: 'mW',
        tol: 0.02,
        hint: 'P = I² · R, con I en amperes.',
        explain: `P = (${n(I)} A)² × ${R} Ω = ${n(I * I * R)} W = **${n(I * I * R * 1000)} mW**.`,
        visual: { kind: 'widget', widget: 'power' },
      }
    },
    (rng) => {
      const ex = pick(rng, [
        { p: 'R1 = 120 Ω conectada a 50 V', a: (50 * 50) / 120, e: 'P = 50² / 120 = **20,8 W**' },
        { p: 'R2 = 330 Ω conectada a 50 V', a: (50 * 50) / 330, e: 'P = 50² / 330 = **7,58 W**' },
      ])
      return {
        type: 'numeric',
        topic: 'joule',
        prompt: `Ejercicio del apunte (9.1): ¿qué potencia disipa ${ex.p}?`,
        answer: ex.a,
        unit: 'W',
        tol: 0.015,
        hint: 'Las dos resistencias están en paralelo con la fuente: cada una tiene los 50 V. Usá P = V² / R.',
        explain: `${ex.e}. ¡Ni se te ocurra usar uno de ¼ W ahí!`,
        visual: { kind: 'widget', widget: 'schematic', props: { kind: 'parallel', V: 50, rs: [120, 330] } },
      }
    },
    (rng) => ({
      type: 'choice',
      topic: 'joule',
      prompt: 'Dos resistores, uno de **100 Ω** y otro de **1 kΩ**, están conectados a la **misma tensión**. ¿Cuál calienta más?',
      ...options(rng, 'El de 100 Ω', ['El de 1 kΩ', 'Los dos igual', 'Ninguno: los resistores no calientan']),
      explain: 'P = V² / R: con la misma V, la R más chica disipa más (le pasa más corriente).',
      visual: { kind: 'bench', scene: pairScene },
    }),
    (rng) => {
      const vp = pick(rng, [311, 155, 14.1, 28.3, 170])
      return {
        type: 'numeric',
        topic: 'rms',
        prompt: `Una senoidal tiene **${n(vp)} V de pico**. ¿Cuál es su valor eficaz?`,
        answer: vp / Math.SQRT2,
        unit: 'V',
        tol: 0.02,
        hint: 'Vrms = Vp / √2 (√2 ≈ 1,414).',
        explain: `Vrms = ${n(vp)} / 1,414 = **${n(vp / Math.SQRT2)} V**.`,
        visual: { kind: 'widget', widget: 'rms' },
      }
    },
    () => ({
      type: 'order',
      topic: 'potencia',
      prompt: 'Ordená de **mayor a menor potencia** (calculá P = V · I).',
      items: ['Pava: 220 V · 10 A', 'Lamparita de auto: 12 V · 2 A', 'Velador: 220 V · 0,1 A', 'Cargador: 5 V · 1 A'],
      explain: 'Pava 2200 W > lamparita 24 W > velador 22 W > cargador 5 W.',
      visual: { kind: 'widget', widget: 'power' },
    }),
    () => ({
      type: 'bench',
      topic: 'joule',
      prompt: 'R1 = 47 Ω se está recalentando con 9 V. Elegí el **resistor más chico** que aguante ¼ W.',
      scene: tightScene,
      check: coolAndOn('R1', 390),
      hint: 'P = V² / R ≤ 0,25 W → R ≥ 9² / 0,25 = 324 Ω. El valor comercial siguiente es 330 Ω.',
      explain: 'R ≥ V² / P = 81 / 0,25 = 324 Ω → **330 Ω**.',
    }),
  ],
}
