import { battery, broken, led, meter, resistor, wire } from '../../engine/build'
import type { Part } from '../../engine/types'
import { confirmsOpen, repaired } from '../checks'
import { n, options, pick, si } from '../helpers'
import type { BenchCheck, Lesson } from '../types'

type Fault = 'R1' | 'R2' | 'w2'

/** Cartel de Doña Rosa: batería → R1 → R2 → LED → vuelta. Una pieza puede venir cortada por dentro. */
const signScene =
  (fault: Fault | null, r1 = 330, r2 = 220) =>
  (): Part[] => {
    const parts: Part[] = [
      battery('bat', 9, 'T+2', 'T-2', undefined, { label: 'Batería' }),
      wire('w1', '#c8664d', 'T+4', 'a4'),
      resistor('R1', r1, 'c4', 0, { label: 'R1' }),
      resistor('R2', r2, 'd8', 0, { label: 'R2' }),
      led('L1', 'yellow', 'c12', 0, { label: 'LED del cartel' }),
      wire('w2', '#e1b54f', 'a14', 'T-14'),
      meter('off', null, null),
    ]
    return parts.map((p) => (p.id === fault ? broken(p) : p))
  }

/** El voltímetro puesto sobre la pieza cortada marca casi toda la tensión de la batería. */
function findsOpenByVoltage(id: string, pins: [string, string]): BenchCheck {
  return (parts, sim) => {
    const m = parts.find((p) => p.kind === 'meter')
    if (!m || m.kind !== 'meter') return { ok: false }
    if (m.mode !== 'V') return { ok: false, msg: 'Usá el voltímetro (V⎓).' }
    if (!m.red.hole || !m.black.hole) return { ok: false, msg: 'Enchufá las dos puntas.' }
    const probes = [sim.nodeOf(m.id, 'red'), sim.nodeOf(m.id, 'black')].sort().join()
    const target = [sim.nodeOf(id, pins[0]), sim.nodeOf(id, pins[1])].sort().join()
    const v = Math.abs(sim.meter?.value ?? 0)
    if (probes !== target) return { ok: false, msg: v > 1 ? `Marca ${n(v)} V: la falla está entre esas puntas. Acercalas hasta encerrar una sola pieza.` : 'Marca 0 V: entre esas puntas no está la falla. Probá otra pieza.' }
    return v > 5 ? { ok: true, msg: `¡Ahí está! Sobre el cable cortado aparecen ${n(v)} V: casi toda la tensión de la batería.` } : { ok: false }
  }
}

const wireScene = signScene('w2')
const r2Scene = signScene('R2')
const r1Scene = signScene('R1')

export const l9: Lesson = {
  id: 'diagnostico',
  n: 9,
  title: 'Taller de reparaciones',
  short: 'El encargo final: usar todo lo aprendido para encontrar, con el tester, qué pieza se rompió.',
  client: {
    name: 'Doña Rosa, otra vez',
    request: 'Nene, el cartelito con el LED que me armaste dejó de andar. Por fuera está todo igual… ¿me lo podés revisar con ese aparatito tuyo?',
    thanks: 'El cartel de Doña Rosa volvió a brillar. ¡Ya sos técnico del barrio!',
  },
  steps: [
    {
      title: 'Pensá como técnico',
      body: [
        'Una pieza cortada por dentro se ve igual que una sana: hay que **medir**. En un circuito serie abierto no circula corriente, así que en las piezas sanas **no cae tensión** (V = I · R = 0).',
        'Casi toda la tensión de la batería aparece justo **sobre el corte** (el LED se queda con un poquito). Recorré el circuito con el voltímetro, pieza por pieza, hasta encontrar dónde está.',
      ],
      visual: { kind: 'bench', scene: wireScene },
      tryIt: 'Medí sobre R1, después sobre R2, el LED y el cable amarillo (de a14 al bus −).',
      gate: { task: 'Encontrá con el voltímetro **dónde está el corte**.', check: findsOpenByVoltage('w2', ['a', 'b']) },
    },
    {
      title: 'Confirmalo con el óhmetro',
      body: [
        'Ahora el sospechoso es R2. Para estar seguro, **apagá la batería** y medí su resistencia.',
        'Una pieza cortada marca **O.L** (fuera de rango): no hay continuidad, es como si no estuviera.',
      ],
      visual: { kind: 'bench', scene: r2Scene },
      gate: { task: 'Confirmá con el óhmetro que **R2 está cortado**.', check: confirmsOpen('R2') },
    },
    {
      title: 'Manos a la obra',
      body: [
        'Ya sabés buscar. Este cartel tiene una falla: encontrala midiendo y **cambiá la pieza rota** (hacé clic en ella → «Cambiar por uno nuevo»).',
        'Cambiar todo a ciegas también funciona… pero un técnico mide primero.',
      ],
      visual: { kind: 'bench', scene: r1Scene, edit: 'repair' },
      gate: { task: 'Hacé que el **LED del cartel vuelva a prender**.', check: repaired('L1') },
    },
  ],
  practice: [
    (rng) => {
      const fault = pick(rng, ['R1', 'R2', 'w2'] as Fault[])
      const r1 = pick(rng, [220, 330, 470])
      const r2 = pick(rng, [100, 220])
      return {
        type: 'bench',
        topic: 'diagnostico',
        prompt: 'Otro cartel que no prende. **Encontrá la pieza cortada y cambiala.**',
        scene: signScene(fault, r1, r2),
        check: repaired('L1'),
        edit: 'repair',
        hint: 'Con la batería prendida, medí tensión sobre cada pieza: donde aparece casi toda la tensión, está el corte. Después hacé clic en esa pieza y cambiala.',
        explain: `La pieza cortada era ${fault === 'w2' ? 'el cable amarillo' : fault}. Sobre ella aparecía toda la tensión.`,
      }
    },
    (rng) => ({
      type: 'choice',
      topic: 'diagnostico',
      prompt: 'Circuito serie, LED apagado. El voltímetro marca **0 V sobre R1** y **casi 9 V sobre R2**. ¿Qué pasa?',
      ...options(rng, 'R2 está cortado', ['R1 está cortado', 'La batería está descargada', 'Está todo bien']),
      explain: 'Con el circuito abierto no hay corriente: en lo sano cae 0 V y en el corte aparece toda la tensión.',
      visual: { kind: 'bench', scene: r2Scene },
    }),
    (rng) => ({
      type: 'choice',
      topic: 'diagnostico',
      prompt: 'El óhmetro (con todo apagado) marca **O.L** sobre un cable. ¿Qué significa?',
      ...options(rng, 'El cable está cortado: no hay continuidad', ['El cable está perfecto', 'El cable tiene 0 Ω', 'Hay un cortocircuito']),
      explain: 'O.L = fuera de rango: resistencia "infinita". Un cable sano marca casi 0 Ω.',
      visual: { kind: 'widget', widget: 'ohmrules' },
    }),
    (rng) => ({
      type: 'choice',
      topic: 'diagnostico',
      prompt: 'El LED no prende, el circuito está cerrado y el voltímetro marca **la tensión al revés** sobre el LED (−7 V). ¿Cuál es la falla?',
      ...options(rng, 'El LED está puesto al revés', ['El LED está quemado por exceso de corriente', 'Falta la batería', 'El resistor es muy chico']),
      explain: 'Un LED solo conduce del ánodo (pata larga, +) al cátodo. Al revés, no prende.',
      visual: { kind: 'widget', widget: 'connect', props: { start: 'V' } },
    }),
    () => ({
      type: 'order',
      topic: 'diagnostico',
      prompt: 'Ordená los pasos para **reparar** un circuito que no anda.',
      items: ['Mirar si hay algo suelto o al revés', 'Medir la tensión de la fuente', 'Medir tensión sobre cada pieza', 'Apagar y confirmar con el óhmetro', 'Cambiar la pieza rota y probar'],
      explain: 'Primero lo fácil (mirar), después medir con tensión, confirmar sin tensión y recién ahí cambiar.',
      visual: { kind: 'widget', widget: 'meterface' },
    }),
    (rng) => {
      const V = pick(rng, [9, 12])
      const R = pick(rng, [330, 470, 1000])
      const I = V / R
      return {
        type: 'numeric',
        topic: 'diagnostico',
        prompt: `Repaso integrador: **${V} V** sobre **${si(R, 'Ω')}**. ¿Cuánta potencia disipa? (en mW) ¿Aguanta un resistor de ¼ W?`,
        answer: V * I * 1000,
        unit: 'mW',
        tol: 0.02,
        hint: 'P = V² / R',
        explain: `P = ${V}² / ${R} = **${n(V * I * 1000)} mW** → ${V * I > 0.25 ? 'más de 250 mW: se recalienta.' : 'menos de 250 mW: aguanta.'}`,
        visual: { kind: 'widget', widget: 'power' },
      }
    },
  ],
}
