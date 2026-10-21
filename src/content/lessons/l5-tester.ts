import { battery, led, meter, resistor, wire } from '../../engine/build'
import { randomE12 } from '../../engine/circuit'
import type { Part } from '../../engine/types'
import { measuresCurrentOf, measuresResistanceOf, measuresVoltageOf } from '../checks'
import { options, pick, si } from '../helpers'
import type { Lesson } from '../types'

/** Batería → R1 → LED → vuelta, con el tester suelto al costado. */
const closedScene =
  (ohms = 330, mode: 'off' | 'V' = 'off') =>
  (): Part[] => [
    battery('bat', 9, 'T+2', 'T-2', undefined, { label: 'Batería' }),
    wire('w1', '#c8664d', 'T+4', 'a4'),
    resistor('R1', ohms, 'c4', 0, { label: 'R1' }),
    led('L1', 'green', 'd8', 0),
    wire('w2', '#2f2a28', 'a10', 'T-10'),
    meter(mode, null, null),
  ]

/** El mismo circuito pero abierto entre R1 y el LED: el hueco es para el amperímetro. */
const gapScene =
  (ohms = 330) =>
  (): Part[] => [
    battery('bat', 9, 'T+2', 'T-2', undefined, { label: 'Batería' }),
    wire('w1', '#c8664d', 'T+4', 'a4'),
    resistor('R1', ohms, 'c4', 0, { label: 'R1' }),
    led('L1', 'green', 'c10', 0),
    wire('w2', '#2f2a28', 'a12', 'T-12'),
    meter('off', null, null),
  ]

/** R1 con R2 en paralelo y la batería prendida: hay que apagar y aislar. */
const ohmScene =
  (r1 = 1000, r2 = 1000, withR2 = true) =>
  (): Part[] => [
    battery('bat', 9, 'T+2', 'T-2', undefined, { label: 'Batería' }),
    wire('w1', '#c8664d', 'T+4', 'a4'),
    resistor('R1', r1, 'c4', 0, { label: 'R1' }),
    ...(withR2 ? [resistor('R2', r2, 'd4', 0, { label: 'R2' })] : []),
    led('L1', 'green', 'e8', 0),
    wire('w2', '#2f2a28', 'a10', 'T-10'),
    meter('off', null, null),
  ]

const voltScene = closedScene()
const ampScene = gapScene()
const resScene = ohmScene(1000, 0, false)

export const l5: Lesson = {
  id: 'tester',
  n: 5,
  title: 'Medir con el tester',
  short: 'Voltímetro en paralelo, amperímetro en serie y óhmetro sin alimentación: cómo medir sin romper nada.',
  client: {
    name: 'Profe Vicario',
    request: 'Para aprobar el taller tienen que saber usar el multímetro sin quemarle el fusible. Les dejo un circuito armado en la mesa: midan tensión, corriente y resistencia.',
    thanks: '¡El profe te firmó la planilla del taller!',
  },
  steps: [
    {
      title: 'Conocé el tester',
      body: [
        'El **multímetro** (o tester) junta tres instrumentos en uno: **voltímetro**, **amperímetro** y **óhmetro**. Con la perilla elegís cuál.',
        'La punta **negra** va siempre en **COM**. La **roja** en **VΩmA**.',
      ],
      visual: { kind: 'widget', widget: 'meterface' },
      tryIt: 'Tocá cada posición de la perilla.',
    },
    {
      title: 'Voltímetro: en paralelo',
      body: [
        'Para medir la tensión de algo, apoyás **una punta de cada lado**: el tester queda **en paralelo**. No hay que desarmar nada.',
        'La roja va al lado más positivo. Si las invertís, marca negativo.',
      ],
      visual: { kind: 'widget', widget: 'connect', props: { start: 'V' } },
      tryIt: 'Tocá «¿y si lo pongo mal?» para ver qué pasa con el voltímetro en serie.',
    },
    {
      title: 'Medí la batería',
      body: [
        'Ahora en serio. La batería está conectada a los **buses**: el + (rojo) y el − (azul) de arriba.',
        'Girá la perilla a **V⎓** y arrastrá las puntas: roja a un agujero del bus +, negra al bus −.',
      ],
      visual: { kind: 'bench', scene: voltScene, fit: 15, target: [0.5, 0, 0.2] },
      gate: { task: 'Medí la **tensión de la batería** con el voltímetro.', check: measuresVoltageOf('bat', ['plus', 'minus']) },
    },
    {
      title: 'Amperímetro: en serie',
      body: [
        'Para medir corriente, la corriente tiene que **pasar por adentro** del tester. Abrís el circuito y el tester **cierra el hueco**: queda **en serie**.',
        'Nunca lo pongas en paralelo: por dentro es casi un cable (resistencia ≈ 0) y hacés un **cortocircuito**. Por eso tiene un fusible.',
      ],
      visual: { kind: 'widget', widget: 'connect', props: { start: 'A' } },
      tryIt: 'Probá el amperímetro mal puesto.',
    },
    {
      title: 'Medí la corriente',
      body: [
        'Este circuito quedó **abierto** entre R1 (columna 8) y el LED (columna 10): por eso el LED está apagado.',
        'Poné la perilla en **mA** y usá el tester para cerrar el hueco: roja del lado de R1, negra del lado del LED.',
      ],
      visual: { kind: 'bench', scene: ampScene, fit: 15, target: [0.5, 0, 0.2] },
      gate: { task: 'Medí la **corriente que pasa por R1** con el amperímetro.', check: measuresCurrentOf('R1') },
    },
    {
      title: 'Óhmetro: sin tensión y aislado',
      body: [
        'El óhmetro manda su propia corrientita para medir. Por eso el circuito tiene que estar **sin alimentación**.',
        'Y el componente tiene que estar **aislado**: si hay otra cosa en paralelo, medís las dos juntas. Lo más fácil es sacarlo o levantar una pata.',
      ],
      visual: { kind: 'widget', widget: 'ohmrules' },
      tryIt: 'Apagá la batería y levantá la pata de R1: mirá cómo cambia la lectura.',
    },
    {
      title: 'Medí R1',
      body: ['Primero **apagá la batería** (interruptor verde). Después perilla en **Ω** y una punta en cada pata de R1.', 'Si querés, también podés sacar R1 de la protoboard y medirlo suelto.'],
      visual: { kind: 'bench', scene: resScene, fit: 15, target: [0.5, 0, 0.2] },
      gate: { task: 'Medí la **resistencia de R1** con el óhmetro.', check: measuresResistanceOf('R1') },
    },
    {
      title: 'Bonus: la pinza amperimétrica',
      body: [
        'Para corrientes grandes (un aire acondicionado, una bomba) existe la **pinza amperimétrica**: mide la corriente **abrazando** el cable, sin cortarlo.',
        'Es menos precisa que el amperímetro en serie, pero mucho más práctica y segura. Ojo: hay que abrazar **un solo** conductor.',
      ],
      visual: { kind: 'widget', widget: 'clamp' },
      tryIt: 'Abrazá un cable, después los dos, y fijate qué marca.',
    },
  ],
  practice: [
    (rng) => ({
      type: 'choice',
      topic: 'voltimetro',
      prompt: '¿Cómo se conecta un **voltímetro**?',
      ...options(rng, 'En paralelo con lo que querés medir', ['En serie, abriendo el circuito', 'Con el circuito apagado', 'Entre una punta y la mesa']),
      explain: 'El voltímetro mide la diferencia de potencial **entre dos puntos**: va en paralelo.',
      visual: { kind: 'widget', widget: 'connect', props: { start: 'V' } },
    }),
    (rng) => ({
      type: 'choice',
      topic: 'amperimetro',
      prompt: pick(rng, ['¿Qué pasa si ponés el **amperímetro en paralelo** con la batería?', 'Pusiste el tester en mA y tocaste los dos bornes de la batería. ¿Qué pasó?']),
      ...options(rng, 'Hace un cortocircuito y se quema el fusible', ['Mide la tensión de la batería', 'No pasa nada, marca cero', 'Mide la resistencia interna']),
      explain: 'El amperímetro tiene resistencia casi **cero**: en paralelo es un corto. Va **en serie**.',
      visual: { kind: 'widget', widget: 'connect', props: { start: 'A' } },
    }),
    (rng) => ({
      type: 'choice',
      topic: 'ohmetro',
      prompt: '¿Qué hay que hacer **antes** de medir una resistencia con el óhmetro?',
      ...options(rng, 'Quitar la alimentación y aislar el componente', ['Subir la tensión de la fuente', 'Ponerlo en serie con el circuito', 'Nada: se mide igual que la tensión']),
      explain: 'Sin tensión (si no, la lectura no sirve) y aislado (si no, medís lo que está en paralelo).',
      visual: { kind: 'widget', widget: 'ohmrules' },
    }),
    () => ({
      type: 'order',
      topic: 'amperimetro',
      prompt: 'Ordená los pasos para **medir la corriente** de un circuito.',
      items: ['Apagar la fuente', 'Girar la perilla a mA', 'Abrir el circuito en el punto a medir', 'Conectar el tester en serie (roja hacia el +)', 'Encender y leer'],
      explain: 'Siempre se conecta con el circuito sin tensión, y el tester cierra el hueco **en serie**.',
      visual: { kind: 'widget', widget: 'connect', props: { start: 'A' } },
    }),
    (rng) => {
      const r = pick(rng, [220, 330, 470, 1000])
      return {
        type: 'bench',
        topic: 'voltimetro',
        prompt: `Medí la **tensión sobre R1** (${si(r, 'Ω')}).`,
        scene: closedScene(r, 'off'),
        check: measuresVoltageOf('R1'),
        hint: 'R1 tiene patas en la columna 4 y en la 8. Perilla en V⎓; roja en la columna 4 (lado +) y negra en la 8.',
        explain: 'El voltímetro va en paralelo con R1: una punta en cada una de sus columnas.',
        fit: 15,
      }
    },
    (rng) => {
      const r = pick(rng, [220, 330, 470, 1000])
      return {
        type: 'bench',
        topic: 'amperimetro',
        prompt: `Medí la **corriente que pasa por el LED**. El circuito está abierto entre R1 y el LED.`,
        scene: gapScene(r),
        check: measuresCurrentOf('L1'),
        hint: 'Perilla en mA. Roja en la columna 8 (R1), negra en la columna 10 (LED).',
        explain: 'En serie, la misma corriente pasa por R1, por el tester y por el LED.',
        fit: 15,
      }
    },
    (rng) => {
      const r1 = randomE12(rng, 3, 3)
      const r2 = pick(rng, [1000, 2200, 4700])
      return {
        type: 'bench',
        topic: 'ohmetro',
        prompt: `Medí **R1** con el óhmetro. Ojo: tiene **R2 en paralelo** y la batería está prendida.`,
        scene: ohmScene(r1, r2, true),
        check: measuresResistanceOf('R1'),
        hint: 'Apagá la batería y sacá R2 de la protoboard (arrastrala a la mesa). Después perilla en Ω y una punta en cada pata de R1.',
        explain: 'Sin alimentación y con R1 aislada, el óhmetro marca su valor real.',
        fit: 15,
      }
    },
    (rng) => {
      const ma = pick(rng, [10, 20, 25, 40])
      const r = pick(rng, [100, 220, 330, 470])
      return {
        type: 'numeric',
        topic: 'amperimetro',
        prompt: `El amperímetro en serie con un resistor de **${si(r, 'Ω')}** marca **${ma} mA**. ¿Qué marcaría un voltímetro sobre ese resistor?`,
        answer: (ma / 1000) * r,
        unit: 'V',
        hint: 'V = I · R (I en amperes).',
        explain: `V = ${ma / 1000} A × ${r} Ω = **${((ma / 1000) * r).toFixed(2).replace('.', ',')} V**.`,
        visual: { kind: 'widget', widget: 'connect', props: { start: 'V' } },
      }
    },
  ],
}
