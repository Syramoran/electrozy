// La guía de ejercicios 2013 completa, con sus circuitos redibujados. Los valores son los de la guía.

import { parallel } from '../../engine/circuit'
import { n, options, pick } from '../helpers'
import type { Exercise, Lesson } from '../types'
import type { FigId } from '../../widgets/guia'

const K = 1000
const fig = (f: FigId, data: string) => ({ kind: 'widget' as const, widget: 'guia' as const, props: { fig: f, data } })

const DATA5 = 'R1=47k R2=27k R3=56k R4=22k R5=10k R6=1k R7=100Ω R8=1k R9=10k'

// Valores de la guía, resueltos acá para que las respuestas salgan de la cuenta.
const R5 = { R1: 47 * K, R2: 27 * K, R3: 56 * K, R4: 22 * K, R5: 10 * K, R6: 1 * K, R7: 100, R8: 1 * K, R9: 10 * K }
const eq5A = parallel(R5.R1, R5.R2 + R5.R4, R5.R3)
const eq5B = parallel(R5.R4, R5.R6 + R5.R3, R5.R1 + parallel(R5.R5, R5.R2))
const eq5C = parallel(R5.R4, R5.R1, parallel(R5.R6, R5.R2) + parallel(R5.R7, R5.R5, R5.R3))
const eq5D = parallel(parallel(R5.R1, R5.R2), R5.R3 + R5.R4, parallel(R5.R5, R5.R7) + parallel(R5.R6, R5.R8, R5.R9))

// Ej. 6
const I6 = 50 / (1 * K + 330 + 100 * K)
// Ej. 7
const p7 = parallel(330, 220 * K, 1 * K)
const I7 = (12 * p7) / (10 + p7) / (1 * K)
// Ej. 8
const p8 = parallel(150 + 33, 470)
const It8 = 24 / (p8 + 1 * K)
const Vp8 = It8 * p8
// Ej. 9
const p9 = parallel(22 + 33, 100)
const p56 = parallel(2.2 * K, 2.2 * K)
const It9 = 48 / (p9 + 1 * K + p56 + 100)
const P6 = (It9 * p56) ** 2 / (2.2 * K)
// Ej. 10 y 11
const x10 = parallel(1, 3.3 + 4.7)
const It10 = 18 / (2.2 + x10)
const IR4 = (It10 * x10) / (3.3 + 4.7)
const Vth11 = (18 * 1) / (2.2 + 1)
const Rth11 = parallel(2.2, 1) + 3.3
// Ejemplo de la versión corta del apunte
const eqA = parallel(120, 1 * K) + 3.3 * K + 4.7 * K
const IA = 12 / eqA

const num = (topic: string, f: FigId, data: string, prompt: string, answer: number, unit: string, explain: string, hint?: string, tol = 0.01): Exercise => ({
  type: 'numeric',
  topic,
  prompt,
  answer,
  unit,
  tol,
  hint,
  explain,
  visual: fig(f, data),
})

export const l11: Lesson = {
  id: 'guia',
  n: 11,
  title: 'Guía de ejercicios',
  short: 'La guía 2013 completa (asociaciones, divisores, potencias, Thevenin y el problema inverso), con sus circuitos y resolución paso a paso.',
  client: {
    name: 'la cátedra',
    request: 'Para cerrar la unidad: resuelvan la guía de ejercicios. Reduzcan de a poco, apliquen Ohm, Kirchhoff y Joule, y verifiquen siempre que los números cierren.',
    thanks: '¡Guía completa! La unidad 1 está terminada.',
  },
  practiceCount: 10,
  steps: [
    {
      title: 'Reducí de a poco',
      body: [
        'Un circuito mixto se resuelve de adentro hacia afuera: buscá grupos que estén **claramente en serie** (una sola corriente) o **en paralelo** (los mismos dos nodos) y reemplazalos por su equivalente.',
        'Repetí hasta que quede una sola resistencia. Ejemplo: el 5-A de la guía.',
      ],
      visual: {
        kind: 'widget',
        widget: 'guia',
        props: {
          fig: '5A',
          data: DATA5,
          steps: ['R2 y R4 están en serie: 27k + 22k = 49 kΩ', 'Quedan R1, (R2+R4) y R3 entre los mismos dos nodos: en paralelo', '1/R = 1/47k + 1/49k + 1/56k', `R(AB) = ${n(eq5A / K, 4)} kΩ`],
        },
      },
      tryIt: 'Tocá «resolver paso a paso».',
    },
    {
      title: 'Reducir, Ohm y volver',
      body: [
        'Para hallar corrientes: reducí todo a una resistencia, sacá la corriente total con **Ohm**, y después **volvé** hacia atrás: con la corriente sacás tensiones, y con las tensiones las corrientes de cada rama (Kirchhoff).',
        'Ejemplo: el ejercicio 8 (V = 24 V, R1 = 150 Ω, R2 = 33 Ω, R3 = 470 Ω, R4 = 1 kΩ).',
      ],
      visual: {
        kind: 'widget',
        widget: 'guia',
        props: {
          fig: '8',
          data: 'V=24V R1=150Ω R2=33Ω R3=470Ω R4=1k',
          steps: [
            `R1 + R2 = 183 Ω, en paralelo con R3: ${n(p8, 4)} Ω`,
            `R total = ${n(p8, 4)} + 1000 = ${n(p8 + 1000, 5)} Ω`,
            `I total = 24 / ${n(p8 + 1000, 5)} = ${n(It8 * 1000)} mA = IR4`,
            `V del paralelo = ${n(It8 * 1000)} mA × ${n(p8, 4)} Ω = ${n(Vp8)} V`,
            `IR1 = IR2 = ${n(Vp8)} / 183 = ${n((Vp8 / 183) * 1000)} mA · IR3 = ${n(Vp8)} / 470 = ${n((Vp8 / 470) * 1000)} mA`,
          ],
        },
      },
    },
    {
      title: 'El problema al revés',
      body: [
        'A veces te dan corrientes y tenés que sacar las resistencias (ejercicio 12: I1 = 5 A, I2 = 3 A, R3 = 12 Ω, V = 34 V).',
        'Usá Kirchhoff en el nodo para la corriente que falta, y Ohm en cada resistencia.',
      ],
      visual: {
        kind: 'widget',
        widget: 'guia',
        props: {
          fig: '12',
          data: 'I1=5A I2=3A R3=12Ω V=34V',
          steps: ['Nodo: I3 = I1 − I2 = 5 − 3 = 2 A', 'VR3 = I3 · R3 = 2 × 12 = 24 V (R2 está en paralelo: también 24 V)', 'R2 = 24 V / 3 A = 8 Ω', 'Malla: VR1 = 34 − 24 = 10 V → R1 = 10 / 5 = 2 Ω', 'PR3 = 24 V × 2 A = 48 W'],
        },
      },
    },
  ],
  practice: [
    (rng) => {
      const ex = pick(rng, [
        { p: 'Ej. 1: ¿Cuál será la corriente en una resistencia de **47 Ω** con **220 V** entre sus extremos?', a: 220 / 47, u: 'A', e: 'I = 220 / 47 = **4,68 A**.' },
        { p: 'Ej. 2: Un voltímetro en paralelo marca **220 V** y un amperímetro en serie **2,6 A**. ¿Cuánto vale la resistencia?', a: 220 / 2.6, u: 'Ω', e: 'R = 220 / 2,6 = **84,6 Ω**.' },
        { p: 'Ej. 3: Por **390 Ω** circulan **4 A**. ¿Qué marca un voltímetro entre sus extremos?', a: 1560, u: 'V', e: 'V = 4 × 390 = **1560 V**.' },
        { p: 'Ej. 4: 16,5 Ω, 45,6 Ω y 67,9 Ω en serie; sobre la de 45,6 Ω hay **35 V**. ¿Tensión del generador?', a: (35 / 45.6) * 130, u: 'V', e: 'I = 35/45,6 = 0,7675 A → V = 0,7675 × 130 = **99,78 V**.' },
      ])
      return { type: 'numeric', topic: 'guia', prompt: ex.p, answer: ex.a, unit: ex.u, tol: 0.01, explain: ex.e, hint: 'Ley de Ohm: tapá en el triángulo lo que buscás.', visual: { kind: 'widget', widget: 'triangle' } }
    },
    () => num('guia', '5A', DATA5, 'Ej. 5-A: ¿Cuánto vale la resistencia equivalente? (en kΩ)', eq5A / K, 'kΩ', 'R2+R4 = 49k; luego 47k ‖ 49k ‖ 56k = **16,8 kΩ**.', 'Primero la serie de R2 y R4; después el paralelo de las tres ramas.'),
    () => num('guia', '5B', DATA5, 'Ej. 5-B: ¿Cuánto vale la resistencia equivalente? (en kΩ)', eq5B / K, 'kΩ', 'R5‖R2 = 7,30k → +R1 = 54,30k; R6+R3 = 57k; todo en paralelo con R4 → **12,28 kΩ**.', 'Empezá por R5 ‖ R2, sumale R1. Después R6 + R3. Las tres ramas quedan en paralelo.'),
    () => num('guia', '5C', DATA5, 'Ej. 5-C: ¿Cuánto vale la resistencia equivalente? (en Ω)', eq5C, 'Ω', 'R6‖R2 = 964 Ω; R7‖R5‖R3 = 98,8 Ω; en serie = 1063 Ω; en paralelo con R4 y R1 → **992,7 Ω**.', 'Hay un nodo intermedio: arriba R6‖R2, abajo R7‖R5‖R3. Esas dos van en serie, y eso en paralelo con R4 y R1.'),
    () => num('guia', '5D', DATA5, 'Ej. 5-D: ¿Cuánto vale la resistencia equivalente? (en Ω)', eq5D, 'Ω', `R1‖R2 = 17,15k; R3+R4 = 78k; (R5‖R7) + (R6‖R8‖R9) = 99 + 476 = 575 Ω; las tres en paralelo → **${n(eq5D, 4)} Ω** (la guía da 553,28 Ω por redondeo).`, 'Tres ramas entre los bornes: R1‖R2, R3+R4, y la de abajo a la derecha (R5‖R7 en serie con R6‖R8‖R9).', 0.005),
    (rng) => {
      const which = pick(rng, ['R1', 'R2', 'R3'] as const)
      const r = { R1: 1 * K, R2: 330, R3: 100 * K }[which]
      return num('guia', '6', 'R1=1k R2=330Ω R3=100k V=50V', `Ej. 6: ¿Qué tensión cae sobre **${which}**?`, I6 * r, 'V', `I = 50 / 101330 = 0,493 mA → V${which} = **${n(I6 * r)} V**. R3 es la que más restringe el paso de la corriente: se queda con casi toda la tensión.`, 'Están en serie: misma corriente. I = V / (R1 + R2 + R3).', 0.015)
    },
    (rng) => ({
      type: 'choice',
      topic: 'guia',
      prompt: 'Ej. 6: R1 = 1 kΩ, R2 = 330 Ω y R3 = 100 kΩ en serie con 50 V. ¿Cuál impone **mayor restricción** al paso de la corriente?',
      ...options(rng, 'R3', ['R1', 'R2', 'Las tres por igual']),
      explain: 'La de mayor resistencia: R3 (100 kΩ). En serie, además, es la que se queda con más tensión (49,3 V).',
      visual: fig('6', 'R1=1k R2=330Ω R3=100k V=50V'),
    }),
    () => num('guia', '7', 'R1=10Ω R2=330Ω R3=220k R4=1k V=12V', 'Ej. 7: ¿Qué corriente circula por **R4**? (en mA)', I7 * 1000, 'mA', `R2‖R3‖R4 = ${n(p7, 4)} Ω; V nodo = 12 × ${n(p7, 4)} / ${n(p7 + 10, 4)} = ${n(I7 * 1000)} V → IR4 = **${n(I7 * 1000)} mA**.`, 'R2, R3 y R4 están en paralelo, y ese grupo en serie con R1. Sacá la tensión del nodo con un divisor.'),
    (rng) => {
      const which = pick(rng, ['IR1', 'IR3', 'IR4'] as const)
      const val = { IR1: Vp8 / 183, IR3: Vp8 / 470, IR4: It8 }[which]
      return num('guia', '8', 'V=24V R1=150Ω R2=33Ω R3=470Ω R4=1k', `Ej. 8: ¿Cuánto vale **${which}**? (en mA)`, val * 1000, 'mA', `IR4 = ${n(It8 * 1000)} mA (total); IR1 = IR2 = ${n((Vp8 / 183) * 1000)} mA; IR3 = ${n((Vp8 / 470) * 1000)} mA.`, '(R1+R2) ‖ R3, en serie con R4. Corriente total, tensión del paralelo y después cada rama.', 0.015)
    },
    () => num('guia', '9', 'R1=22Ω R2=33Ω R3=100Ω R4=1k R5=R6=2,2k R7=100Ω V=48V', 'Ej. 9: ¿Qué potencia disipa **R6**? (en W)', P6, 'W', `R total = ${n(p9 + 1000 + p56 + 100, 5)} Ω → I = ${n(It9 * 1000)} mA; V(R5‖R6) = ${n(It9 * p56)} V → PR6 = V²/R6 = **${n(P6)} W**.`, 'Reducí: (R1+R2)‖R3, R5‖R6, todo en serie con R4 y R7. Con la corriente total sacás la tensión sobre R5‖R6.', 0.015),
    (rng) => {
      const v = rng() < 0.5
      return num('guia', '10', 'R1=2,2Ω R2=1Ω R3=3,3Ω R4=4,7Ω V=18V', v ? 'Ej. 10: ¿Cuánto vale **VR4**?' : 'Ej. 10: ¿Cuánto vale **IR4**? (en mA)', v ? IR4 * 4.7 : IR4 * 1000, v ? 'V' : 'mA', `R2 ‖ (R3+R4) = ${n(x10)} Ω; I total = ${n(It10)} A; IR4 = ${n(IR4 * 1000)} mA; VR4 = **${n(IR4 * 4.7)} V**.`, 'R3 y R4 en serie; eso en paralelo con R2; todo en serie con R1.', 0.015)
    },
    (rng) => {
      const v = rng() < 0.5
      return num('guia', '10', 'R1=2,2Ω R2=1Ω R3=3,3Ω R4=4,7Ω V=18V', v ? 'Ej. 11: Con Thevenin visto desde R4, ¿cuánto vale **Vth**?' : 'Ej. 11: Con Thevenin visto desde R4, ¿cuánto vale **Rth**? (en Ω)', v ? Vth11 : Rth11, v ? 'V' : 'Ω', `Vth = 18 × 1/(2,2+1) = **${n(Vth11, 4)} V**; Rth = 2,2‖1 + 3,3 = **${n(Rth11)} Ω**. Con RL = 4,7 Ω: IR4 = 5,625/(3,98+4,7) = 0,647 A, igual que en el 10.`, 'Sacá R4. Vth: divisor de R1 y R2 (por R3 no circula corriente). Rth: fuente en corto, R1‖R2 + R3.', 0.01)
    },
    (rng) => {
      const which = pick(rng, ['VR3', 'R1', 'R2', 'PR3'] as const)
      const map = { VR3: [24, 'V'], R1: [2, 'Ω'], R2: [8, 'Ω'], PR3: [48, 'W'] } as const
      return num('guia', '12', 'I1=5A I2=3A R3=12Ω V=34V', `Ej. 12: ¿Cuánto vale **${which}**?`, map[which][0], map[which][1], 'I3 = 5 − 3 = 2 A → VR3 = 24 V; R2 = 24/3 = 8 Ω; VR1 = 34 − 24 = 10 V → R1 = 2 Ω; PR3 = 48 W.', 'Empezá por Kirchhoff en el nodo: I3 = I1 − I2.')
    },
    (rng) => {
      const v = rng() < 0.5
      return num('guia', 'apunte', 'R1=120Ω R2=1k R3=3,3k R4=4,7k V=12V', v ? 'Ejemplo del apunte: ¿qué corriente total circula? (en mA)' : 'Ejemplo del apunte: ¿qué tensión cae sobre **R4**?', v ? IA * 1000 : IA * 4.7 * K, v ? 'mA' : 'V', `R = 107,14 + 3300 + 4700 = ${n(eqA, 6)} Ω → I = 12 / ${n(eqA, 6)} = **${n(IA * 1000)} mA**; VR4 = I × 4700 = **${n(IA * 4.7 * K)} V**.`, 'R1‖R2 = 107,14 Ω, en serie con R3 y R4.', 0.015)
    },
  ],
}
