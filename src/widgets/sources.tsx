// Gráficos de fuentes reales, fuentes de corriente, Norton y temperatura.

import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'
import { formatSI, parallel, trimNum } from '../engine/circuit'
import { sfx } from '../lib/sound'
import { C, Frame, Slider, Toggle } from './Frame'

const RL_STEPS = [1, 2.2, 4.7, 10, 22, 47, 100, 220, 470, 1000, 10000]

/** Una fuente real "por dentro": la ideal más su resistencia interna, y una carga afuera. */
export function RealSource({ start = 'tension' }: { start?: 'tension' | 'corriente' }) {
  const [kind, setKind] = useState<'tension' | 'corriente'>(start)
  const [ri, setRi] = useState(kind === 'tension' ? 1 : 1000)
  const [rli, setRli] = useState(5)
  const RL = RL_STEPS[rli]
  const tension = kind === 'tension'
  const V = 12
  const I = 0.1
  const vLoad = (V * RL) / (RL + ri)
  const iLoad = (I * ri) / (ri + RL)
  const ratio = tension ? RL / ri : ri / RL
  const ideal = tension ? V : I
  const real = tension ? vLoad : iLoad
  const err = 1 - real / ideal
  const ok = ratio >= 100
  const switchKind = (k: 'tension' | 'corriente') => {
    setKind(k)
    setRi(k === 'tension' ? 1 : 1000)
  }
  return (
    <Frame
      caption={
        tension
          ? `Fuente de tensión real = ideal con Ri en SERIE. Parte de la tensión se queda en Ri. Para que no importe: RL ≥ 100·Ri (ahora RL = ${trimNum(ratio)}·Ri).`
          : `Fuente de corriente real = ideal con Ri en PARALELO. Parte de la corriente se escapa por Ri. Para que no importe: Ri ≥ 100·RL (ahora Ri = ${trimNum(ratio)}·RL).`
      }
      controls={
        <>
          <Toggle on={tension} onClick={() => switchKind('tension')}>
            fuente de tensión
          </Toggle>
          <Toggle on={!tension} onClick={() => switchKind('corriente')}>
            fuente de corriente
          </Toggle>
          <Slider label="Ri" min={tension ? 0.1 : 10} max={tension ? 20 : 100000} step={tension ? 0.1 : 10} value={ri} onChange={setRi} show={formatSI(ri, 'Ω')} />
          <Slider label="carga RL" min={0} max={RL_STEPS.length - 1} value={rli} onChange={setRli} show={formatSI(RL, 'Ω')} />
        </>
      }
    >
      <svg viewBox="0 0 440 210" className="mx-auto max-h-[44vh] w-full">
        <rect x="20" y="20" width="200" height="170" rx="16" fill={C.paper2} stroke={C.soft} strokeDasharray="6 5" strokeWidth="2" />
        <text x="120" y="40" textAnchor="middle" fontSize="12" fontWeight="800" fill={C.soft}>
          la fuente por dentro
        </text>
        <g fill="none" stroke={C.ink} strokeWidth="3">
          {tension ? <path d="M 70 70 V 160 M 70 70 H 120 M 180 70 H 300 V 160 H 70" /> : <path d="M 70 70 V 160 M 70 70 H 300 V 160 H 70 M 150 70 V 95 M 150 135 V 160" />}
        </g>
        <circle cx="70" cy="115" r="22" fill={C.paper} stroke={C.ink} strokeWidth="3" />
        {tension ? (
          <text x="70" y="121" textAnchor="middle" fontSize="16" fontWeight="900" fill={C.terracotta}>
            {V}V
          </text>
        ) : (
          <path d="M 70 128 V 102 M 62 110 L 70 100 L 78 110" stroke={C.terracotta} strokeWidth="3" fill="none" />
        )}
        {/* Ri */}
        {tension ? <rect x="120" y="60" width="60" height="20" rx="6" fill="#e3c99a" stroke={C.ink} strokeWidth="2" /> : <rect x="140" y="95" width="20" height="40" rx="6" fill="#e3c99a" stroke={C.ink} strokeWidth="2" />}
        <text x={tension ? 150 : 172} y={tension ? 55 : 120} textAnchor={tension ? 'middle' : 'start'} fontSize="11" fontWeight="800" fill={C.ink}>
          Ri
        </text>
        {/* carga */}
        <rect x="290" y="95" width="20" height="40" rx="6" fill="#e3c99a" stroke={C.ink} strokeWidth="2" />
        <text x="318" y="120" fontSize="12" fontWeight="800" fill={C.ink}>
          RL
        </text>
        <g transform="translate(330 30)">
          <rect width="100" height="60" rx="10" fill={C.mustard} />
          <rect x="8" y="8" width="84" height="28" rx="4" fill="#b5c39e" />
          <text x="50" y="28" textAnchor="middle" fontFamily="JetBrains Mono" fontSize="13" fontWeight="700" fill="#2b3424">
            {tension ? formatSI(vLoad, 'V') : formatSI(iLoad, 'A')}
          </text>
          <text x="50" y="52" textAnchor="middle" fontSize="10" fontWeight="800" fill={C.ink}>
            {tension ? 'tensión en RL' : 'corriente en RL'}
          </text>
        </g>
        <text x="380" y="175" textAnchor="middle" fontSize="13" fontWeight="900" fill={ok ? C.sage : C.terracotta}>
          {ok ? 'casi ideal' : `pierde ${trimNum(err * 100, 2)}%`}
        </text>
      </svg>
    </Frame>
  )
}

/** Asociación de fuentes de corriente: en paralelo se suman; en serie tienen que ser iguales. */
export function CurrentAssoc() {
  const [i1, setI1] = useState(2)
  const [i2, setI2] = useState(3)
  const [par, setPar] = useState(true)
  const absurd = !par && i1 !== i2
  const Source = ({ x, y, i }: { x: number; y: number; i: number }) => (
    <g transform={`translate(${x} ${y})`}>
      <circle r="22" fill={C.paper} stroke={C.ink} strokeWidth="3" />
      <path d="M 0 12 V -12 M -8 -4 L 0 -14 L 8 -4" stroke={C.terracotta} strokeWidth="3" fill="none" />
      <text x="30" y="5" fontSize="13" fontWeight="800" fill={C.ink}>
        {i} A
      </text>
    </g>
  )
  return (
    <Frame
      caption={par ? 'En paralelo, las corrientes de las fuentes se suman (Kirchhoff en el nodo).' : absurd ? '¡Caso absurdo! En serie pasa la misma corriente por las dos: tienen que ser iguales.' : 'En serie y con la misma corriente: el conjunto entrega esa misma corriente.'}
      controls={
        <>
          <Toggle on={par} onClick={() => setPar(true)}>
            paralelo
          </Toggle>
          <Toggle on={!par} onClick={() => (sfx.click(), setPar(false))}>
            serie
          </Toggle>
          <Slider label="I1" min={1} max={5} value={i1} onChange={setI1} show={`${i1} A`} />
          <Slider label="I2" min={1} max={5} value={i2} onChange={setI2} show={`${i2} A`} />
        </>
      }
    >
      <svg viewBox="0 0 440 210" className="mx-auto max-h-[42vh] w-full">
        {par ? (
          <>
            <path d="M 100 40 H 340 M 100 180 H 340 M 100 40 V 180 M 200 40 V 180 M 340 40 V 90 M 340 130 V 180" fill="none" stroke={C.copper} strokeWidth="4" />
            <Source x={100} y={110} i={i1} />
            <Source x={200} y={110} i={i2} />
          </>
        ) : (
          <>
            <path d="M 150 40 H 340 M 150 180 H 340 M 150 40 V 180 M 340 40 V 90 M 340 130 V 180" fill="none" stroke={C.copper} strokeWidth="4" />
            <Source x={150} y={75} i={i1} />
            <Source x={150} y={145} i={i2} />
          </>
        )}
        <rect x="330" y="90" width="20" height="40" rx="6" fill="#e3c99a" stroke={C.ink} strokeWidth="2" />
        <AnimatePresence mode="wait">
          <motion.text
            key={`${par}${absurd}${i1 + i2}`}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0, x: absurd ? [0, -4, 4, -2, 0] : 0 }}
            x="395"
            y="115"
            textAnchor="middle"
            fontFamily="JetBrains Mono"
            fontSize="18"
            fontWeight="700"
            fill={absurd ? C.terracotta : C.ink}
          >
            {absurd ? '¡?!' : `${par ? i1 + i2 : i1} A`}
          </motion.text>
        </AnimatePresence>
      </svg>
    </Frame>
  )
}

/** Norton con el ejemplo del apunte: V = 10 V, R1 = 2 Ω, R2 = 3 Ω, R3 = 4 Ω. */
export function Norton() {
  const [stage, setStage] = useState<'circuito' | 'in' | 'rn' | 'equiv'>('circuito')
  const [rl, setRl] = useState(5)
  const V = 10
  const [R1, R2, R3] = [2, 3, 4]
  const IN = (V / (R1 + parallel(R2, R3))) * (parallel(R2, R3) / R3)
  const RN = R3 + parallel(R1, R2)
  const iReal = IN * (RN / (RN + rl))
  const texts = {
    circuito: 'Norton dice que cualquier circuito lineal, visto desde dos bornes, es una fuente de corriente IN en paralelo con una resistencia RN.',
    in: `IN: cortocircuitá la carga y medí la corriente que pasa por el corto. IN = V/(R1 + R2‖R3) · (R2‖R3)/R3 = ${trimNum(IN, 4)} A.`,
    rn: `RN: anulá la fuente (corto) y mirá desde los bornes con la carga afuera. RN = R3 + R1‖R2 = 4 + 1,2 = ${trimNum(RN)} Ω (es la misma Rth).`,
    equiv: `Con IN ∥ RN, la corriente en cualquier carga sale directo: I = IN · RN/(RN + RL) = ${trimNum(iReal, 3)} A.`,
  }
  return (
    <Frame
      caption={texts[stage]}
      controls={
        <>
          {(['circuito', 'in', 'rn', 'equiv'] as const).map((s) => (
            <Toggle key={s} on={stage === s} onClick={() => (sfx.page(), setStage(s))}>
              {s === 'circuito' ? 'el circuito' : s === 'in' ? '1. buscar IN' : s === 'rn' ? '2. buscar RN' : '3. equivalente'}
            </Toggle>
          ))}
          {stage === 'equiv' && <Slider label="RL" min={1} max={20} value={rl} onChange={setRl} show={`${rl} Ω`} />}
        </>
      }
    >
      <svg viewBox="0 0 440 210" className="mx-auto max-h-[44vh] w-full">
        {stage !== 'equiv' ? (
          <g>
            <path d="M 40 50 H 100 M 160 50 H 230 M 290 50 H 360 M 40 170 H 360 M 200 50 V 85 M 200 135 V 170" fill="none" stroke={C.ink} strokeWidth="3" />
            {stage === 'rn' ? <path d="M 40 50 V 170" stroke={C.amber} strokeWidth="5" /> : <path d="M 40 50 V 88 M 40 132 V 170" stroke={C.ink} strokeWidth="3" />}
            {stage !== 'rn' && (
              <g>
                <circle cx="40" cy="110" r="22" fill={C.paper} stroke={C.ink} strokeWidth="3" />
                <text x="40" y="116" textAnchor="middle" fontSize="13" fontWeight="900" fill={C.terracotta}>
                  10V
                </text>
              </g>
            )}
            <rect x="100" y="40" width="60" height="20" rx="6" fill="#e3c99a" stroke={C.ink} strokeWidth="2" />
            <text x="130" y="32" textAnchor="middle" fontSize="12" fontWeight="800">
              R1 2Ω
            </text>
            <rect x="190" y="85" width="20" height="50" rx="6" fill="#e3c99a" stroke={C.ink} strokeWidth="2" />
            <text x="216" y="115" fontSize="12" fontWeight="800">
              R2 3Ω
            </text>
            <rect x="230" y="40" width="60" height="20" rx="6" fill="#e3c99a" stroke={C.ink} strokeWidth="2" />
            <text x="260" y="32" textAnchor="middle" fontSize="12" fontWeight="800">
              R3 4Ω
            </text>
            <circle cx="360" cy="50" r="5" fill={C.terracotta} />
            <circle cx="360" cy="170" r="5" fill={C.soft} />
            {stage === 'in' && (
              <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <path d="M 360 50 V 170" stroke={C.amber} strokeWidth="5" />
                <path d="M 375 80 V 140 M 368 130 L 375 142 L 382 130" stroke={C.electron} strokeWidth="3" fill="none" />
                <text x="390" y="115" fontFamily="JetBrains Mono" fontSize="13" fontWeight="700" fill={C.electron}>
                  {trimNum(IN, 4)} A
                </text>
              </motion.g>
            )}
            {stage === 'rn' && (
              <text x="395" y="115" textAnchor="middle" fontFamily="JetBrains Mono" fontSize="14" fontWeight="700" fill={C.sage}>
                {trimNum(RN)} Ω
              </text>
            )}
          </g>
        ) : (
          <motion.g initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
            <path d="M 80 50 H 320 M 80 170 H 320 M 80 50 V 88 M 80 132 V 170 M 200 50 V 85 M 200 135 V 170 M 320 50 V 85 M 320 135 V 170" fill="none" stroke={C.ink} strokeWidth="3" />
            <circle cx="80" cy="110" r="22" fill={C.paper} stroke={C.ink} strokeWidth="3" />
            <path d="M 80 122 V 98 M 72 106 L 80 96 L 88 106" stroke={C.terracotta} strokeWidth="3" fill="none" />
            <text x="40" y="115" textAnchor="middle" fontSize="12" fontWeight="800">
              {trimNum(IN, 4)} A
            </text>
            <rect x="190" y="85" width="20" height="50" rx="6" fill="#e3c99a" stroke={C.ink} strokeWidth="2" />
            <text x="216" y="115" fontSize="12" fontWeight="800">
              RN {trimNum(RN)} Ω
            </text>
            <rect x="310" y="85" width="20" height="50" rx="6" fill="#e3c99a" stroke={C.ink} strokeWidth="2" />
            <text x="336" y="105" fontSize="12" fontWeight="800">
              RL {rl} Ω
            </text>
            <text x="336" y="125" fontFamily="JetBrains Mono" fontSize="12" fontWeight="700" fill={C.electron}>
              {trimNum(iReal, 3)} A
            </text>
          </motion.g>
        )}
      </svg>
    </Frame>
  )
}

const MATS = [
  { name: 'cobre', alpha: 0.0039, color: C.copper },
  { name: 'aluminio', alpha: 0.0039, color: '#b9b2a8' },
  { name: 'carbón', alpha: -0.0005, color: '#4d4540' },
]

/** R a distintas temperaturas: Rt = R20 · (1 + α·Δt). */
export function TempCo() {
  const [m, setM] = useState(0)
  const [t, setT] = useState(20)
  const R20 = 100
  const mat = MATS[m]
  const Rt = R20 * (1 + mat.alpha * (t - 20))
  const X = (temp: number) => 40 + ((temp + 20) / 220) * 360
  const Y = (r: number) => 180 - ((r - 80) / 100) * 150
  return (
    <Frame
      caption={`Rt = R20 · (1 + α·Δt), con Δt = t − 20 °C. En los metales α es positivo (calentás y la R sube); en el carbono es negativo (baja). ${mat.name}: α = ${String(mat.alpha).replace('.', ',')} 1/°C.`}
      controls={
        <>
          {MATS.map((x, i) => (
            <Toggle key={x.name} on={m === i} onClick={() => setM(i)}>
              {x.name}
            </Toggle>
          ))}
          <Slider label="temperatura" min={-20} max={200} step={5} value={t} onChange={setT} show={`${t} °C`} />
        </>
      }
    >
      <svg viewBox="0 0 440 210" className="mx-auto max-h-[44vh] w-full">
        <line x1="40" y1="180" x2="410" y2="180" stroke={C.ink} strokeWidth="2" />
        <line x1="40" y1="180" x2="40" y2="20" stroke={C.ink} strokeWidth="2" />
        <text x="408" y="196" textAnchor="end" fontSize="11" fill={C.soft}>
          t (°C)
        </text>
        <text x="46" y="22" fontSize="11" fill={C.soft}>
          R (Ω)
        </text>
        {MATS.map((x, i) => (
          <line key={x.name} x1={X(-20)} y1={Y(R20 * (1 + x.alpha * -40))} x2={X(200)} y2={Y(R20 * (1 + x.alpha * 180))} stroke={i === m ? x.color : C.kraft} strokeWidth={i === m ? 4 : 2} strokeLinecap="round" />
        ))}
        <line x1={X(20)} y1="20" x2={X(20)} y2="180" stroke={C.kraft} strokeDasharray="4 4" />
        <text x={X(20) + 4} y="34" fontSize="10" fill={C.soft}>
          20 °C
        </text>
        <circle cx={X(t)} cy={Y(Rt)} r="8" fill={C.electron} style={{ transition: 'all .3s' }} />
        <text x="410" y="50" textAnchor="end" fontFamily="JetBrains Mono" fontSize="16" fontWeight="700" fill={C.ink}>
          R = {trimNum(Rt, 4)} Ω
        </text>
        <g transform="translate(395 70)">
          <rect x="-6" y="0" width="12" height="80" rx="6" fill={C.paper2} stroke={C.kraft} />
          <rect x="-6" y={80 - ((t + 20) / 220) * 80} width="12" height={((t + 20) / 220) * 80} rx="6" fill={C.terracotta} style={{ transition: 'all .3s' }} />
          <circle cy="86" r="9" fill={C.terracotta} />
        </g>
      </svg>
    </Frame>
  )
}
