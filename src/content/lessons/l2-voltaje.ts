import { bulb, supply, wire } from '../../engine/build'
import type { Part, SourcePart } from '../../engine/types'
import { lights } from '../checks'
import { n, options, pick } from '../helpers'
import type { BenchCheck, Lesson } from '../types'

const supplyScene = () => [supply('fuente', 4, 'T+2', 'T-2', undefined, { label: 'Fuente regulable' }), wire('w1', '#c8664d', 'T+6', 'a6'), bulb('B1', 150, 'c6', 0, { label: 'Lamparita' }), wire('w2', '#2f2a28', 'a9', 'T-9')]

const offSupplyScene = () => supplyScene().map((p) => (p.kind === 'source' ? { ...p, on: false, volts: 2 } : p))

const src = (parts: Part[]) => parts.find((p): p is SourcePart => p.kind === 'source')

const voltsAtLeast =
  (v: number): BenchCheck =>
  (parts, sim) => {
    const s = src(parts)
    if (!s?.on) return { ok: false, msg: 'La fuente está apagada: tocá su interruptor.' }
    if (s.volts < v) return { ok: false, msg: `Está en ${n(s.volts)} V: seguí subiendo.` }
    return lights('B1', 0.8)(parts, sim)
  }

const voltsExactly =
  (v: number): BenchCheck =>
  (parts) => {
    const s = src(parts)
    if (!s?.on) return { ok: false, msg: 'La fuente está apagada: tocá su interruptor (o su etiqueta → "encendida").' }
    return Math.abs(s.volts - v) < 0.01 ? { ok: true, msg: `Fuente en ${n(v)} V.` } : { ok: false, msg: `Marca ${n(s.volts)} V, no ${n(v)} V.` }
  }

export const l2: Lesson = {
  id: 'voltaje',
  n: 2,
  title: 'Voltaje o tensión',
  short: 'La "presión" que empuja a los electrones: voltios, baterías en serie y la diferencia entre continua y alterna.',
  client: {
    name: 'Don Ramón, el de la radio',
    request: 'Mi radio pide 6 voltios y yo tengo pilas de 1,5. ¿Cómo hago? Y de paso explicame qué es eso del voltaje, que nunca lo entendí.',
    thanks: 'Don Ramón ya escucha el partido.',
  },
  steps: [
    {
      title: 'El voltaje es presión',
      body: [
        'El **voltaje** (o tensión, o diferencia de potencial) es la **presión** que hace la fuente sobre los electrones para que circulen.',
        'Pensalo con agua: un tanque más alto empuja más fuerte y sale más caudal. Más voltaje → más corriente, con la misma manguera.',
      ],
      visual: { kind: 'widget', widget: 'water' },
      tryIt: 'Subí y bajá el tanque, y cerrá la canilla.',
    },
    {
      title: 'Se mide en voltios',
      body: [
        'El voltaje se mide en **voltios (V)** y lo impone la fuente: una pila AA da 1,5 V, una batería cuadrada 9 V.',
        'En el banco tenés una **fuente regulable**: podés elegir cuántos voltios entrega. Mirá cómo cambia el brillo y la velocidad de los electrones.',
      ],
      visual: { kind: 'bench', scene: supplyScene, fit: 13, target: [-1.5, 0, 0.4] },
      tryIt: 'Tocá la fuente para ver su etiqueta y mové el control de tensión.',
      gate: { task: 'Subí la fuente a **12 V o más** y hacé brillar la lamparita a pleno.', check: voltsAtLeast(12) },
    },
    {
      title: '¿Para dónde va la corriente?',
      body: [
        'Los electrones salen del **−** de la batería y vuelven por el **+**.',
        'Pero por una convención histórica, en los esquemas dibujamos la corriente al revés: **del + al −**. Es como mirar el "hueco" que deja cada electrón al moverse.',
      ],
      visual: { kind: 'widget', widget: 'direction' },
      tryIt: 'Cambiá entre electrones y sentido convencional.',
    },
    {
      title: 'Pilas en serie y en paralelo',
      body: [
        'Si conectás pilas **en serie** (+ de una con − de la otra), los voltajes **se suman**: 4 pilas de 1,5 V dan 6 V.',
        'En **paralelo** el voltaje queda igual (tienen que ser iguales) y lo que ganás es duración.',
      ],
      visual: { kind: 'widget', widget: 'cells' },
      tryIt: '¿Cuántas pilas en serie necesita la radio de Don Ramón para llegar a 6 V?',
    },
    {
      title: 'Continua y alterna',
      body: [
        'Una fuente de **continua (CC)** mantiene el mismo valor y sentido todo el tiempo: pilas, baterías, cargadores.',
        'En la **alterna (CA)** el sentido se invierte periódicamente. En Argentina, el enchufe da 220 V a **50 Hz**: 50 ciclos por segundo. El **período** es T = 1/f, y el **pico a pico** es el doble del pico: Vpp = 2·Vp.',
      ],
      visual: { kind: 'widget', widget: 'wave' },
      tryIt: 'Pasá a alterna y cambiá la frecuencia.',
    },
  ],
  practice: [
    (rng) => ({
      type: 'choice',
      topic: 'voltaje',
      prompt: 'En la analogía del agua, ¿qué representa el voltaje?',
      ...options(rng, 'La altura del tanque (la presión)', ['El caudal de agua', 'El grosor de la manguera', 'La canilla']),
      explain: 'Altura = **tensión**, caudal = corriente, manguera fina = resistencia, canilla = interruptor.',
      visual: { kind: 'widget', widget: 'water' },
    }),
    (rng) => {
      const k = pick(rng, [2, 3, 4, 6, 8])
      const cell = pick(rng, [1.5, 1.5, 1.2, 3])
      return {
        type: 'numeric',
        topic: 'fuentes',
        prompt: `Conectás **${k} pilas de ${n(cell)} V en serie**. ¿Qué tensión total tenés?`,
        answer: k * cell,
        unit: 'V',
        hint: 'En serie las tensiones se suman.',
        explain: `${k} × ${n(cell)} V = ${n(k * cell)} V.`,
        visual: { kind: 'widget', widget: 'cells' },
      }
    },
    (rng) => ({
      type: 'choice',
      topic: 'fuentes',
      prompt: 'Si conectás **en paralelo** tres pilas iguales de 1,5 V, ¿cuánta tensión obtenés?',
      ...options(rng, '1,5 V', ['4,5 V', '0,5 V', '3 V']),
      explain: 'En paralelo la tensión **no se suma**: queda la de una pila. Lo que aumenta es cuánto duran.',
      visual: { kind: 'widget', widget: 'cells' },
    }),
    (rng) => {
      const vp = pick(rng, [5, 10, 12, 155, 311])
      return {
        type: 'numeric',
        topic: 'alterna',
        prompt: `Una señal alterna tiene un **valor pico de ${vp} V**. ¿Cuánto vale su tensión pico a pico?`,
        answer: 2 * vp,
        unit: 'V',
        hint: 'Vpp = 2 · Vp',
        explain: `Vpp = 2 × ${vp} V = ${2 * vp} V.`,
        visual: { kind: 'widget', widget: 'wave' },
      }
    },
    (rng) => {
      const f = pick(rng, [50, 60, 100, 25])
      return {
        type: 'numeric',
        topic: 'alterna',
        prompt: `Una señal de **${f} Hz**, ¿qué período tiene? (en milisegundos)`,
        answer: 1000 / f,
        unit: 'ms',
        hint: 'T = 1/f. Con f en Hz te da segundos; multiplicá por 1000 para pasar a ms.',
        explain: `T = 1/${f} = ${n(1 / f)} s = ${n(1000 / f)} ms.`,
        visual: { kind: 'widget', widget: 'wave' },
      }
    },
    (rng) => ({
      type: 'choice',
      topic: 'voltaje',
      prompt: 'Por convención, ¿en qué sentido dibujamos la corriente en un esquema?',
      ...options(rng, 'Del + al − de la fuente (por afuera)', ['Del − al + de la fuente (por afuera)', 'Depende del color del cable', 'No tiene sentido definido']),
      explain: 'Los electrones van del − al +, pero el **sentido convencional** es del + al −.',
      visual: { kind: 'widget', widget: 'direction' },
    }),
    (rng) => ({
      type: 'choice',
      topic: 'alterna',
      prompt: '¿Cuál de estas es una fuente de **continua**?',
      ...options(rng, 'Una batería de 9 V', ['El enchufe de la pared', 'Un generador de 50 Hz', 'La red domiciliaria de 220 V']),
      explain: 'Pilas y baterías dan **continua**: mismo valor y sentido siempre. El enchufe da alterna.',
      visual: { kind: 'widget', widget: 'wave' },
    }),
    (rng) => {
      const v = pick(rng, [3, 5, 6, 7.5, 9])
      return {
        type: 'bench',
        topic: 'voltaje',
        prompt: `Encendé la fuente y ajustala a **${n(v)} V** exactos.`,
        scene: offSupplyScene,
        check: voltsExactly(v),
        hint: 'Hacé clic sobre la fuente: aparece su etiqueta con el interruptor y el control de tensión.',
        explain: 'Las fuentes regulables te dejan elegir la tensión: el brillo de la lamparita sube con ella.',
        fit: 13,
      }
    },
  ],
}
