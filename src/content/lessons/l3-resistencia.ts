import { battery, led, resistor, wire } from '../../engine/build'
import { BAND_COLORS, colorBands, parallel, randomE12 } from '../../engine/circuit'
import type { Part, ResistorPart } from '../../engine/types'
import { inParallel } from '../checks'
import { n, options, pick, si } from '../helpers'
import type { BenchCheck, Lesson } from '../types'

const ledScene = () => [
  battery('bat', 9, 'T+2', 'T-2'),
  wire('w1', '#c8664d', 'T+5', 'a5'),
  resistor('R1', 330, 'c5', 0, { label: 'R1' }),
  led('L1', 'green', 'd9', 0),
  wire('w2', '#2f2a28', 'a11', 'T-11'),
]

const looseScene = () => [
  battery('bat', 9, 'T+2', 'T-2'),
  wire('w1', '#c8664d', 'T+5', 'a5'),
  resistor('R1', 470, null, 0, { label: 'R1', free: [1.2, 3.7] }),
  led('L1', 'yellow', 'd9', 0),
  wire('w2', '#2f2a28', 'a11', 'T-11'),
]

const parScene = () => [resistor('R1', 1000, 'b5', 0, { label: 'R1', locked: true }), resistor('R2', 2200, null, 0, { label: 'R2', free: [0, 3.7] })]

const r1 = (parts: Part[]) => parts.find((p): p is ResistorPart => p.id === 'R1' && p.kind === 'resistor')

const dimmer: BenchCheck = (parts, sim) => {
  const r = r1(parts)
  if (!r) return { ok: false }
  if (r.ohms < 1000) return { ok: false, msg: `R1 vale ${si(r.ohms, 'Ω')}. Probá con 1 kΩ o más.` }
  return (sim.glow.L1 ?? 0) > 0.05 ? { ok: true, msg: `Con ${si(r.ohms, 'Ω')} pasa menos corriente: el LED brilla menos.` } : { ok: false, msg: 'El LED se apagó del todo: probá un valor un poco menor.' }
}

const placed: BenchCheck = (parts, sim) => {
  const r = r1(parts)
  if (!r?.hole) return { ok: false, msg: 'Arrastrá el resistor hasta la protoboard.' }
  return (sim.glow.L1 ?? 0) > 0.3 ? { ok: true, msg: 'El resistor unió las dos tiras y cerró el circuito.' } : { ok: false, msg: 'Está encastrado, pero el LED no prende: una pata tiene que compartir columna con el cable rojo (columna 5) y la otra con el LED (columna 9).' }
}

const bandName = (ohms: number) =>
  colorBands(ohms)
    .map((i) => BAND_COLORS[i].name)
    .join(' – ')

export const l3: Lesson = {
  id: 'resistencia',
  n: 3,
  title: 'Resistencia',
  short: 'La oposición al paso de la corriente: de qué depende, cómo leer el código de colores y cómo se combinan en serie y en paralelo.',
  client: {
    name: 'Lucía, de 4.º año',
    request: 'Encontré un montón de resistencias de colores en un cajón del taller del cole. ¿Me ayudás a saber cuánto vale cada una y para qué sirven?',
    thanks: 'Lucía ordenó todo el cajón de resistencias.',
  },
  steps: [
    {
      title: 'Oponerse a la corriente',
      body: [
        'La **resistencia** es la oposición que ofrece un material al paso de los electrones. Se mide en **ohms (Ω)**.',
        'Depende del **material** (su resistividad ρ), del **largo** L y de la **sección** A: **R = ρ · L / A**. Más largo, más resistencia; más grueso, menos. También cambia con la temperatura.',
      ],
      visual: { kind: 'widget', widget: 'rhola' },
      tryIt: 'Alargá el cable, hacelo más finito y cambiá a nicromo.',
    },
    {
      title: 'La temperatura también cuenta',
      body: [
        'Si cambia la temperatura, cambia la resistencia. En la mayoría de los **metales aumenta** al calentarse; en otros materiales, como el **carbono** o el germanio, **disminuye**.',
        'Para temperaturas no muy altas: **Rt = R20 · (1 + α · Δt)**, donde R20 es la resistencia a 20 °C, **α** el coeficiente de temperatura del material y **Δt = t − 20 °C**.',
      ],
      visual: { kind: 'widget', widget: 'tempco' },
      tryIt: 'Calentá el cobre hasta 120 °C y después probá con carbón.',
    },
    {
      title: 'Conductores y aislantes',
      body: [
        'Los materiales con **muchos electrones libres** (metales: cobre, aluminio, plata, oro) dejan pasar la corriente: son **conductores**.',
        'Los que casi no tienen (plástico, madera, cerámica, vidrio) son **aislantes** o dieléctricos.',
      ],
      visual: { kind: 'widget', widget: 'materials' },
    },
    {
      title: 'El resistor y su código de colores',
      body: [
        'Un **resistor** es una pieza hecha para limitar la corriente. Su valor viene pintado en **bandas de colores**.',
        'Se lee así: **1.ª cifra, 2.ª cifra, cantidad de ceros** y la dorada es la tolerancia. Amarillo (4) – violeta (7) – rojo (2 ceros) = 4700 Ω = 4,7 kΩ.',
      ],
      visual: { kind: 'widget', widget: 'colorcode' },
      tryIt: 'Armá un resistor de 1 kΩ: marrón – negro – rojo.',
    },
    {
      title: 'La protoboard',
      body: [
        'En la protoboard, cada **columnita de 5 agujeros** (a–e, y aparte f–j) está unida por dentro. Las filas largas de arriba y abajo son los **buses**: + (rojo) y − (azul).',
        'Para que una pieza "se conecte" con otra, sus patas tienen que caer en **la misma columnita**.',
      ],
      visual: { kind: 'bench', scene: looseScene, fit: 12 },
      tryIt: 'Pasá el mouse sobre los agujeros: se ilumina la tira que está unida por dentro.',
      gate: { task: 'Encastrá **R1** entre el cable rojo y el LED para que se prenda.', check: placed },
    },
    {
      title: 'Más resistencia, menos corriente',
      body: [
        'El LED necesita un resistor en serie que **limite la corriente**. Con más ohms pasa menos corriente y brilla menos.',
        'Fijate también en los electrones: van más lentos cuando la resistencia sube.',
      ],
      visual: { kind: 'bench', scene: ledScene, fit: 12 },
      tryIt: 'Hacé clic en R1 y cambiá su valor.',
      gate: { task: 'Elegí un R1 de **1 kΩ o más** y mirá cómo baja el brillo.', check: dimmer },
    },
    {
      title: 'Serie y paralelo',
      body: [
        'En **serie** (una detrás de otra) las resistencias se suman: **R = R1 + R2 + …**',
        'En **paralelo** (lado a lado) la corriente se reparte y la equivalente baja: **1/R = 1/R1 + 1/R2**. Para dos: **R = R1·R2 / (R1+R2)**.',
      ],
      visual: { kind: 'widget', widget: 'seriespar' },
      tryIt: 'Poné dos iguales en paralelo: ¿qué pasa con el total?',
    },
  ],
  practice: [
    (rng) => {
      const r20 = pick(rng, [100, 220, 1000])
      const t = pick(rng, [60, 80, 120, 0])
      const alpha = 0.0039
      const rt = r20 * (1 + alpha * (t - 20))
      return {
        type: 'numeric',
        topic: 'resistencia',
        prompt: `Un bobinado de **cobre** mide **${si(r20, 'Ω')}** a 20 °C. ¿Cuánto mide a **${t} °C**? (α del cobre = 0,0039 1/°C, en Ω)`,
        answer: rt,
        unit: 'Ω',
        tol: 0.01,
        hint: 'Rt = R20 · (1 + α · Δt), con Δt = t − 20.',
        explain: `Rt = ${r20} × (1 + 0,0039 × ${t - 20}) = **${n(rt, 4)} Ω**. ${t > 20 ? 'Se calentó: subió.' : 'Se enfrió: bajó.'}`,
        visual: { kind: 'widget', widget: 'tempco' },
      }
    },
    (rng) => {
      const ohms = randomE12(rng, 1, 5)
      const right = si(ohms, 'Ω')
      return {
        type: 'choice',
        topic: 'colores',
        prompt: '¿Cuánto vale este resistor?',
        ...options(rng, right, [si(ohms * 10, 'Ω'), si(ohms / 10, 'Ω'), si(Number(String(colorBands(ohms)[1]) + String(colorBands(ohms)[0])) * 10 ** colorBands(ohms)[2], 'Ω')]),
        explain: `Bandas ${bandName(ohms)}: cifras ${colorBands(ohms)[0]}${colorBands(ohms)[1]} y ${colorBands(ohms)[2]} ceros → ${right}.`,
        visual: { kind: 'widget', widget: 'bands', props: { ohms } },
      }
    },
    (rng) => {
      const ohms = randomE12(rng, 2, 4)
      return {
        type: 'choice',
        topic: 'colores',
        prompt: `¿Qué colores tiene un resistor de **${si(ohms, 'Ω')}**?`,
        ...options(rng, bandName(ohms), [bandName(ohms * 10), bandName(ohms / 10), bandName(randomE12(rng, 2, 4))]),
        explain: `${si(ohms, 'Ω')} → ${bandName(ohms)} (más la dorada de tolerancia).`,
        visual: { kind: 'widget', widget: 'colorcode' },
      }
    },
    (rng) => {
      const a = randomE12(rng, 2, 3)
      const b = randomE12(rng, 2, 3)
      const c = pick(rng, [0, randomE12(rng, 2, 3)])
      const rs = c ? [a, b, c] : [a, b]
      return {
        type: 'numeric',
        topic: 'serie-paralelo',
        prompt: `Tenés ${rs.length === 3 ? 'tres' : 'dos'} resistores **en serie**: ${rs.map((r) => si(r, 'Ω')).join(', ')}. ¿Cuánto vale la resistencia total? (en Ω)`,
        answer: rs.reduce((x, y) => x + y, 0),
        unit: 'Ω',
        hint: 'En serie se suman. Pasá todo a Ω antes (1 kΩ = 1000 Ω).',
        explain: `R = ${rs.join(' + ')} = ${rs.reduce((x, y) => x + y, 0)} Ω.`,
        visual: { kind: 'widget', widget: 'schematic', props: { kind: 'series', rs } },
      }
    },
    (rng) => {
      const [a, b] = pick(rng, [
        [100, 100],
        [1000, 1000],
        [120, 1000],
        [330, 470],
        [1000, 2200],
        [220, 330],
      ])
      const r = parallel(a, b)
      return {
        type: 'numeric',
        topic: 'serie-paralelo',
        prompt: `Dos resistores **en paralelo**: R1 = ${si(a, 'Ω')} y R2 = ${si(b, 'Ω')}. ¿Cuánto vale la equivalente? (en Ω)`,
        answer: r,
        unit: 'Ω',
        tol: 0.02,
        hint: 'Para dos en paralelo: R = R1·R2 / (R1 + R2).',
        explain: `R = ${a}·${b} / (${a}+${b}) = ${n(r, 4)} Ω. Siempre da menos que la más chica.`,
        visual: { kind: 'widget', widget: 'schematic', props: { kind: 'parallel', rs: [a, b] } },
      }
    },
    () => ({
      type: 'numeric',
      topic: 'serie-paralelo',
      prompt: 'Ejemplo del apunte: R1 = 120 Ω y R2 = 1 kΩ están **en paralelo**, y ese conjunto en **serie** con R3 = 33 kΩ y R4 = 47 kΩ. ¿Cuánto vale la resistencia total? (en Ω)',
      answer: 80107.14,
      unit: 'Ω',
      tol: 0.005,
      hint: 'Primero el paralelo de R1 y R2 (≈107 Ω), después sumale R3 y R4.',
      explain: 'R1‖R2 = 120·1000/1120 = 107,14 Ω → 107,14 + 33000 + 47000 = **80107,14 Ω**.',
      visual: { kind: 'widget', widget: 'seriespar' },
    }),
    (rng) => {
      const longer = rng() < 0.5
      return {
        type: 'choice',
        topic: 'resistencia',
        prompt: longer ? '¿Qué pasa con la resistencia de un cable si lo hacés **el doble de largo** (mismo material y grosor)?' : '¿Qué pasa con la resistencia de un cable si lo hacés **más grueso** (mismo material y largo)?',
        ...options(rng, longer ? 'Se duplica' : 'Disminuye', longer ? ['Se reduce a la mitad', 'No cambia', 'Se cuadruplica'] : ['Aumenta', 'No cambia', 'Se hace cero']),
        explain: 'R = ρ·L/A: crece con el largo y baja con la sección.',
        visual: { kind: 'widget', widget: 'rhola' },
      }
    },
    (rng) => {
      const mats: [string, boolean][] = [
        ['el cobre', true],
        ['el plástico', false],
        ['el aluminio', true],
        ['la madera', false],
        ['la cerámica', false],
        ['la plata', true],
      ]
      const [m, cond] = pick(rng, mats)
      return {
        type: 'choice',
        topic: 'resistencia',
        prompt: `¿**${m[0].toUpperCase() + m.slice(1)}** es conductor o aislante?`,
        ...options(rng, cond ? 'Conductor: tiene muchos electrones libres' : 'Aislante: casi no tiene electrones libres', [cond ? 'Aislante: casi no tiene electrones libres' : 'Conductor: tiene muchos electrones libres', 'Depende del color']),
        explain: 'Los metales son conductores; plásticos, madera, cerámica y vidrio son aislantes.',
        visual: { kind: 'widget', widget: 'materials' },
      }
    },
    () => ({
      type: 'bench',
      topic: 'serie-paralelo',
      prompt: 'Poné **R2 en paralelo con R1**.',
      scene: parScene,
      check: inParallel('R1', 'R2'),
      hint: 'R1 tiene una pata en la columna 5 y otra en la 9. R2 tiene que tener una pata en cada una de esas columnas (por ejemplo en la fila d).',
      explain: 'En paralelo, las dos patas de cada resistor comparten nodo: quedan "lado a lado".',
      fit: 11,
    }),
  ],
}

