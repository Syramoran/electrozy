import { battery, meter, resistor, wire } from '../../engine/build'
import { parallel } from '../../engine/circuit'
import type { Part } from '../../engine/types'
import { measuresCurrentOf, measuresVoltageOf } from '../checks'
import { n, options, pick, si } from '../helpers'
import type { Lesson } from '../types'

/** Tres resistores en fila: la tensión de la batería se reparte. */
const chainScene =
  (r1 = 330, r2 = 470, r3 = 220) =>
  (): Part[] => [
    battery('bat', 9, 'T+2', 'T-2', undefined, { label: 'Batería' }),
    wire('w1', '#c8664d', 'T+4', 'a4'),
    resistor('R1', r1, 'c4', 0, { label: 'R1' }),
    resistor('R2', r2, 'd8', 0, { label: 'R2' }),
    resistor('R3', r3, 'c12', 0, { label: 'R3' }),
    wire('w2', '#2f2a28', 'a16', 'T-16'),
    meter('off', null, null),
  ]

/** Dos ramas en paralelo; la de R2 quedó abierta para meter el amperímetro. */
const branchScene =
  (r1 = 1000, r2 = 470) =>
  (): Part[] => [
    battery('bat', 9, 'T+2', 'T-2', undefined, { label: 'Batería' }),
    wire('w1', '#c8664d', 'T+4', 'a4'),
    resistor('R1', r1, 'c4', 0, { label: 'R1' }),
    wire('w2', '#2f2a28', 'a8', 'T-8'),
    wire('w3', '#e1b54f', 'b4', 'f4'),
    resistor('R2', r2, 'h4', 0, { label: 'R2' }),
    wire('w4', '#2f2a28', 'f10', 'T-12'),
    meter('off', null, null),
  ]

const kvlScene = chainScene()
const kclScene = branchScene()

export const l7: Lesson = {
  id: 'kirchhoff',
  n: 7,
  title: 'Leyes de Kirchhoff',
  short: 'Dos reglas de "contabilidad" del circuito: las tensiones de una vuelta suman cero y las corrientes que entran a un nodo salen.',
  client: {
    name: 'Nico, del club de robótica',
    request: 'Mi robot tiene LEDs en fila y motores en paralelo. Las tensiones no me cierran y no sé cuánta corriente le pido a la batería. ¿Me das una mano?',
    thanks: 'El robot de Nico ya camina (y no se le apaga la batería).',
  },
  steps: [
    {
      title: 'La vuelta al circuito',
      body: [
        '**Ley de Kirchhoff de las tensiones:** si recorrés un camino cerrado, la suma algebraica de las tensiones es **cero**.',
        'La fuente "sube" la tensión y cada resistor la "baja" (eso es una **caída de tensión**). Es como una montaña rusa: subís una vez y bajás de a tramos hasta volver al piso.',
      ],
      visual: { kind: 'widget', widget: 'kvl' },
      tryIt: 'Cambiá los resistores: las caídas cambian, pero siempre suman 9 V.',
    },
    {
      title: 'Comprobalo con el tester',
      body: [
        'Tres resistores en serie con 9 V. Por los tres pasa **la misma corriente**, así que cae más tensión en el más grande: V = I · R.',
        'Medí la caída en R2. Si querés, medí también R1 y R3 y sumá las tres: tiene que darte la tensión de la batería.',
      ],
      visual: { kind: 'bench', scene: kvlScene },
      tryIt: 'R1 va de la columna 4 a la 8, R2 de la 8 a la 12 y R3 de la 12 a la 16.',
      gate: { task: 'Medí la **tensión sobre R2** con el voltímetro.', check: measuresVoltageOf('R2') },
    },
    {
      title: 'Lo que entra, sale',
      body: [
        'Un **nodo** es la unión de dos o más elementos (si son tres o más, es un **nodo principal**).',
        '**Ley de Kirchhoff de las corrientes:** la suma de las corrientes que **entran** a un nodo es igual a la suma de las que **salen**. La carga no se acumula ni desaparece. Por eso dos fuentes de corriente en paralelo suman sus corrientes.',
      ],
      visual: { kind: 'widget', widget: 'kcl' },
      tryIt: 'Equilibrá la balanza y después pedí otro nodo.',
    },
    {
      title: 'Corrientes que se reparten',
      body: [
        'Acá la corriente de la batería se reparte en dos ramas: R1 (1 kΩ) y R2 (470 Ω). La rama de R2 quedó **abierta** entre las columnas 8 y 10 de abajo.',
        'Poné el amperímetro en ese hueco. Con Kirchhoff: I total = I R1 + I R2.',
      ],
      visual: { kind: 'bench', scene: kclScene },
      gate: { task: 'Medí la **corriente que pasa por R2**.', check: measuresCurrentOf('R2') },
    },
  ],
  practice: [
    (rng) => {
      const v1 = pick(rng, [2, 3, 4.5])
      const v2 = pick(rng, [1.5, 2.5, 3])
      const V = pick(rng, [9, 12])
      return {
        type: 'numeric',
        topic: 'kvl',
        prompt: `Tres resistores en serie con una batería de **${V} V**. Sobre R1 caen **${n(v1)} V** y sobre R2 **${n(v2)} V**. ¿Cuánto cae sobre R3?`,
        answer: V - v1 - v2,
        unit: 'V',
        hint: 'Las caídas suman la tensión de la batería.',
        explain: `V3 = ${V} − ${n(v1)} − ${n(v2)} = **${n(V - v1 - v2)} V**.`,
        visual: { kind: 'widget', widget: 'kvl' },
      }
    },
    (rng) => {
      const [i1, i2, i3, i4] = [pick(rng, [3, 5, 6]), pick(rng, [1, 2]), pick(rng, [2, 4]), pick(rng, [1, 3])]
      const i5 = i1 + i3 - i2 - i4
      return {
        type: 'numeric',
        topic: 'kcl',
        prompt: `Al nodo del ejemplo del apunte **entran** i1 = ${i1} A e i3 = ${i3} A, y **salen** i2 = ${i2} A, i4 = ${i4} A e i5. ¿Cuánto vale i5?`,
        answer: i5,
        unit: 'A',
        hint: 'i1 + i3 = i2 + i4 + i5',
        explain: `i5 = ${i1} + ${i3} − ${i2} − ${i4} = **${i5} A**.`,
        visual: { kind: 'widget', widget: 'kcl' },
      }
    },
    (rng) => {
      const V = pick(rng, [9, 12])
      const [a, b] = pick(rng, [
        [1000, 1000],
        [1000, 2200],
        [470, 1000],
        [330, 680],
      ])
      return {
        type: 'numeric',
        topic: 'kvl',
        prompt: `Divisor de tensión: **${V} V** sobre R1 = ${si(a, 'Ω')} y R2 = ${si(b, 'Ω')} en serie. ¿Qué tensión cae sobre R2?`,
        answer: (V * b) / (a + b),
        unit: 'V',
        tol: 0.02,
        hint: 'I = V / (R1 + R2), y después V2 = I · R2. O directo: V2 = V · R2 / (R1 + R2).',
        explain: `V2 = ${V} × ${b} / (${a} + ${b}) = **${n((V * b) / (a + b))} V**.`,
        visual: { kind: 'widget', widget: 'schematic', props: { kind: 'series', V, rs: [a, b] } },
      }
    },
    (rng) => {
      const V = pick(rng, [9, 12])
      const [a, b] = pick(rng, [
        [1000, 1000],
        [1000, 470],
        [220, 330],
      ])
      const I = V / a + V / b
      return {
        type: 'numeric',
        topic: 'kcl',
        prompt: `**${V} V** alimentan R1 = ${si(a, 'Ω')} y R2 = ${si(b, 'Ω')} **en paralelo**. ¿Cuánta corriente entrega la batería? (en mA)`,
        answer: I * 1000,
        unit: 'mA',
        tol: 0.02,
        hint: 'Cada rama tiene toda la tensión: I1 = V/R1, I2 = V/R2. La total es la suma (Kirchhoff).',
        explain: `I = ${V}/${a} + ${V}/${b} = **${n(I * 1000)} mA** (lo mismo que V / (R1‖R2) = ${V} / ${n(parallel(a, b))}).`,
        visual: { kind: 'widget', widget: 'schematic', props: { kind: 'parallel', V, rs: [a, b] } },
      }
    },
    () => ({
      type: 'numeric',
      topic: 'kvl',
      prompt: 'Ejercicio 9.2 del apunte: 12 V alimentan R1 = 1 kΩ en paralelo con R2 = 2 kΩ, y ese conjunto en serie con R3 = 120 Ω. ¿Cuánto vale la tensión Vx sobre R3?',
      answer: 1.83,
      unit: 'V',
      tol: 0.015,
      hint: 'R1‖R2 = 666,67 Ω. La corriente total es 12 / (666,67 + 120). Después Vx = I · R3.',
      explain: 'I = 12 / 786,67 = 15,25 mA → Vx = 15,25 mA × 120 Ω ≈ **1,83 V** (y sobre el paralelo caen 12 − 1,83 = 10,17 V).',
      visual: { kind: 'widget', widget: 'kvl' },
    }),
    (rng) => ({
      type: 'choice',
      topic: 'kcl',
      prompt: '¿Qué es un **nodo principal**?',
      ...options(rng, 'La unión de tres o más elementos', ['La unión de dos elementos', 'El borne + de la batería', 'Cualquier resistor']),
      explain: 'Nodo simple: dos elementos. Nodo principal: **tres o más**.',
      visual: { kind: 'widget', widget: 'kcl' },
    }),
    (rng) => ({
      type: 'choice',
      topic: 'kcl',
      prompt: 'Conectás **en paralelo** dos fuentes ideales de corriente de 2 A y 3 A. ¿Qué corriente entregan juntas?',
      ...options(rng, '5 A', ['3 A', '2,5 A', '1 A']),
      explain: 'En paralelo, las corrientes de las fuentes se **suman** (es Kirchhoff de corrientes aplicado al nodo).',
      visual: { kind: 'widget', widget: 'kcl' },
    }),
    (rng) => {
      const r = pick(rng, [
        [330, 470, 220],
        [1000, 470, 220],
        [220, 1000, 470],
      ] as [number, number, number][])
      return {
        type: 'bench',
        topic: 'kvl',
        prompt: `Medí la **caída de tensión sobre R3** (${si(r[2], 'Ω')}).`,
        scene: chainScene(...r),
        check: measuresVoltageOf('R3'),
        hint: 'R3 va de la columna 12 a la 16. Perilla en V⎓: roja en la 12, negra en la 16.',
        explain: 'El voltímetro va en paralelo con R3: una punta en cada extremo.',
      }
    },
  ],
}
