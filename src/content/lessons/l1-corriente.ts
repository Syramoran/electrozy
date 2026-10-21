import { battery, bulb, wire } from '../../engine/build'
import { lights } from '../checks'
import { n, options, pick } from '../helpers'
import type { Lesson } from '../types'

const lampScene = () => [battery('bat', 9, 'T+2', 'T-2', undefined, { label: 'Batería' }), wire('w1', '#c8664d', 'T+5', 'a5'), bulb('B1', 100, 'c5', 0, { label: 'Lamparita' }), wire('w2', '#2f2a28', 'a8', 'T-8')]

const openScene = () => [
  battery('bat', 9, 'T+2', 'T-2', undefined, { label: 'Batería' }),
  wire('w1', '#c8664d', 'T+5', 'a5'),
  bulb('B1', 100, 'c5', 0, { label: 'Lamparita' }),
  wire('w2', '#e1b54f', 'a8', null, [1.5, 3.4]),
]

export const l1: Lesson = {
  id: 'corriente',
  n: 1,
  title: 'Corriente eléctrica',
  short: 'Qué es la corriente, por qué hace falta un circuito cerrado y cómo se mide en amperes.',
  client: {
    name: 'Doña Rosa, la del almacén',
    request: 'Nene, se me apagó la lamparita del mostrador y no sé por qué. ¿Me explicás qué es eso de la "corriente" así no me asusto cuando venga el electricista?',
    thanks: '¡Doña Rosa ya entiende su lamparita!',
  },
  steps: [
    {
      title: 'Todo está hecho de átomos',
      body: [
        'La materia está formada por **átomos**, y los átomos por **protones** (+), **neutrones** y **electrones** (−).',
        'Los electrones son los que se mueven y llevan la corriente. En los metales, los de la órbita de afuera se escapan fácil: son **electrones libres**.',
      ],
      visual: { kind: 'widget', widget: 'atom' },
      tryIt: 'Tocá el electrón de afuera y mirá qué pasa.',
    },
    {
      title: 'Corriente = electrones en fila',
      body: [
        'En un cable, los electrones libres se mueven al azar: en promedio no van a ningún lado, así que **no hay corriente**.',
        'Si conectamos una **batería**, los empuja a todos en el mismo sentido. Ese **flujo ordenado de electrones** entre dos puntos de distinto potencial es la **corriente eléctrica**.',
      ],
      visual: { kind: 'widget', widget: 'conductor' },
      tryIt: 'Conectá la batería y subí la tensión: fijate cómo se ordenan.',
    },
    {
      title: 'Circuito cerrado y abierto',
      body: [
        'Para que haya corriente necesitás tres cosas: una **fuente** (batería), una **carga** (la lamparita) y **conductores** que cierren el camino.',
        'Si el camino está completo es un **circuito cerrado**. Si se corta en algún lado (un interruptor, un cable suelto) es un **circuito abierto** y la corriente se frena en todo el circuito.',
      ],
      visual: { kind: 'bench', scene: lampScene, fit: 12 },
      tryIt: 'Tocá el interruptor verde de la batería, o arrastrá un cable afuera de la protoboard. Después volvé a cerrarlo.',
    },
    {
      title: 'El ampere: carga por segundo',
      body: [
        'La carga de un electrón es chiquitísima. Por eso se usa el **coulomb (C)**: la carga de 6,28 × 10¹⁸ electrones.',
        'La corriente es cuánta carga pasa por segundo: **I = Q / t**. Si pasa 1 C en 1 s, la corriente es de **1 ampere (A)**.',
      ],
      visual: { kind: 'widget', widget: 'charge' },
      tryIt: 'Mové la corriente y mirá cómo el contador se acerca a ese valor.',
    },
    {
      title: 'mA, µA y compañía',
      body: [
        'En electrónica casi siempre las corrientes son chicas, así que usamos prefijos: **1 mA = 0,001 A** y **1 µA = 0,000001 A**.',
        'Para pasar de A a mA multiplicás por 1000. Los mismos prefijos sirven para los voltios: mV, kV.',
      ],
      visual: { kind: 'widget', widget: 'units' },
      tryIt: 'Mové el control y fijate qué unidad queda más cómoda en cada caso.',
    },
  ],
  practice: [
    (rng) => ({
      type: 'choice',
      topic: 'corriente',
      prompt: '¿Qué es la corriente eléctrica?',
      ...options(rng, 'Un flujo ordenado de electrones entre dos puntos de distinto potencial', [
        'Electrones quietos dentro de un cable',
        'La fuerza que hace la batería sobre los protones',
        'El calor que genera un conductor',
      ]),
      explain: 'Sin batería los electrones se mueven al azar; con ella avanzan **ordenados**: eso es la corriente.',
      visual: { kind: 'widget', widget: 'conductor', props: { startOn: true } },
    }),
    (rng) => ({
      type: 'choice',
      topic: 'circuito',
      prompt: pick(rng, ['La lamparita está apagada y uno de los cables quedó suelto. ¿Qué tipo de circuito es?', 'Si abrís el interruptor de una linterna, el circuito queda…']),
      ...options(rng, 'Abierto: la corriente no puede circular', ['Cerrado: la corriente sigue igual', 'En cortocircuito', 'Abierto, pero sigue circulando corriente por la lamparita']),
      explain: 'Un corte en **cualquier** parte del camino abre el circuito y la corriente se frena en todo el lazo.',
      visual: { kind: 'widget', widget: 'direction' },
    }),
    (rng) => {
      const q = pick(rng, [2, 3, 6, 10, 12, 30])
      const t = pick(rng, [2, 3, 4, 5, 10])
      return {
        type: 'numeric',
        topic: 'corriente',
        prompt: `Por un cable pasan **${q} C** de carga en **${t} s**. ¿Cuánta corriente circula?`,
        answer: q / t,
        unit: 'A',
        hint: 'I = Q / t: dividí la carga por el tiempo.',
        explain: `I = Q/t = ${q} C / ${t} s = ${n(q / t)} A.`,
        visual: { kind: 'widget', widget: 'charge' },
      }
    },
    (rng) => {
      const amps = pick(rng, [0.02, 0.25, 0.5, 0.015, 1.2, 0.004])
      return {
        type: 'numeric',
        topic: 'unidades',
        prompt: `Pasá **${n(amps)} A** a miliamperes.`,
        answer: amps * 1000,
        unit: 'mA',
        hint: '1 A = 1000 mA: multiplicá por 1000 (corré la coma 3 lugares a la derecha).',
        explain: `${n(amps)} A × 1000 = ${n(amps * 1000)} mA.`,
        visual: { kind: 'widget', widget: 'units' },
      }
    },
    (rng) => {
      const ma = pick(rng, [20, 350, 1500, 5, 75])
      return {
        type: 'numeric',
        topic: 'unidades',
        prompt: `Un LED consume **${ma} mA**. ¿Cuántos amperes son?`,
        answer: ma / 1000,
        unit: 'A',
        hint: 'De mA a A dividís por 1000.',
        explain: `${ma} mA ÷ 1000 = ${n(ma / 1000)} A.`,
        visual: { kind: 'widget', widget: 'units' },
      }
    },
    (rng) => ({
      type: 'choice',
      topic: 'circuito',
      prompt: '¿Cuáles son los tres elementos básicos para que haya corriente?',
      ...options(rng, 'Fuente, carga y conductores que cierren el circuito', ['Batería, interruptor y fusible', 'Protones, neutrones y electrones', 'Voltímetro, amperímetro y óhmetro']),
      explain: 'La **fuente** empuja, la **carga** consume la energía y los **conductores** cierran el camino.',
      visual: { kind: 'bench', scene: lampScene, fit: 12 },
    }),
    () => ({
      type: 'bench',
      topic: 'circuito',
      prompt: 'Doña Rosa tiene un cable suelto. **Cerrá el circuito** para que la lamparita prenda.',
      scene: openScene,
      check: lights('B1'),
      hint: 'El cable amarillo tiene una punta suelta: llevala a un agujero del bus − (la fila azul de arriba).',
      explain: 'Al enchufar la punta en el bus − el camino quedó completo: circuito cerrado.',
      fit: 12,
    }),
    (rng) => ({
      type: 'order',
      topic: 'unidades',
      prompt: 'Ordená de **mayor a menor** corriente.',
      items: pick(rng, [
        ['2 A', '150 mA', '20 mA', '500 µA'],
        ['1,5 A', '900 mA', '45 mA', '30 µA'],
      ]),
      explain: 'Pasá todo a la misma unidad (por ejemplo mA) y compará.',
      visual: { kind: 'widget', widget: 'units' },
    }),
  ],
}
