// Gráficos de la lección 4: triángulo de Ohm, recta V–I, cálculo paso a paso y esquemas.

import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'
import { formatSI, trimNum } from '../engine/circuit'
import { sfx } from '../lib/sound'
import { C, Frame, Slider, Toggle } from './Frame'

// ---------- Triángulo ----------

type Var = 'V' | 'I' | 'R'
const FORMULA: Record<Var, string> = { V: 'V = I · R', I: 'I = V / R', R: 'R = V / I' }

export function Triangle() {
  const [hide, setHide] = useState<Var | null>(null)
  const [V, setV] = useState(12)
  const [R, setR] = useState(1200)
  const [Ima, setI] = useState(10)
  const result = hide === 'V' ? formatSI((Ima / 1000) * R, 'V') : hide === 'I' ? formatSI(V / R, 'A') : hide === 'R' ? formatSI(V / (Ima / 1000), 'Ω') : ''
  const pos: Record<Var, [number, number]> = { V: [150, 82], I: [100, 165], R: [200, 165] }
  return (
    <Frame
      caption={hide ? 'Lo que tapás es lo que calculás: arriba sobre abajo es dividir, abajo al lado es multiplicar.' : 'Tocá la letra que querés calcular.'}
      controls={
        hide && (
          <>
            {hide !== 'V' && <Slider label="V" min={1} max={24} value={V} onChange={setV} show={`${V} V`} />}
            {hide !== 'I' && <Slider label="I" min={1} max={100} value={Ima} onChange={setI} show={`${Ima} mA`} />}
            {hide !== 'R' && <Slider label="R" min={100} max={4700} step={100} value={R} onChange={setR} show={formatSI(R, 'Ω')} />}
          </>
        )
      }
    >
      <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center sm:gap-8">
        <svg viewBox="0 0 300 220" className="max-h-[40vh] w-[min(300px,60%)]">
          <path d="M 150 20 L 280 205 L 20 205 Z" fill={C.paper2} stroke={C.ink} strokeWidth="4" strokeLinejoin="round" />
          <line x1="60" y1="125" x2="240" y2="125" stroke={C.ink} strokeWidth="3" />
          <line x1="150" y1="125" x2="150" y2="205" stroke={C.ink} strokeWidth="3" />
          {(Object.keys(pos) as Var[]).map((v) => (
            <g key={v} onClick={() => (sfx.click(), setHide(hide === v ? null : v))} className="cursor-pointer">
              <motion.circle cx={pos[v][0]} cy={pos[v][1] - 8} r="30" fill={hide === v ? C.postit : 'transparent'} animate={{ scale: hide === v ? 1.05 : 1 }} />
              <text x={pos[v][0]} y={pos[v][1] + 6} textAnchor="middle" fontFamily="Fraunces Variable, serif" fontSize="44" fontWeight="800" fill={v === 'V' ? C.terracotta : v === 'I' ? C.electron : C.sage} opacity={hide === v ? 0.25 : 1}>
                {v}
              </text>
            </g>
          ))}
        </svg>
        <AnimatePresence mode="wait">
          {hide && (
            <motion.div key={hide} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="postit -rotate-1 rounded-md px-5 py-3 text-center">
              <div className="font-display text-2xl font-bold">{FORMULA[hide]}</div>
              <div className="mt-1 font-mono text-xl">= {result}</div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Frame>
  )
}

// ---------- Recta V–I ----------

const RS = [220, 470, 1000, 2200]

export function OhmPlot() {
  const [ri, setRi] = useState(2)
  const [V, setV] = useState(6)
  const R = RS[ri]
  const I = V / R
  const X = (v: number) => 40 + (v / 12) * 360
  const Y = (i: number) => 190 - (i / 0.055) * 170
  return (
    <Frame
      caption="Para un mismo resistor, si duplicás la tensión se duplica la corriente: es una recta. Con más R, la recta queda más acostada."
      controls={
        <>
          <Slider label="V" min={0} max={12} step={0.5} value={V} onChange={setV} show={`${trimNum(V)} V`} />
          {RS.map((r, i) => (
            <Toggle key={r} on={ri === i} onClick={() => setRi(i)}>
              {formatSI(r, 'Ω')}
            </Toggle>
          ))}
        </>
      }
    >
      <svg viewBox="0 0 440 220" className="mx-auto max-h-[42vh] w-full">
        <line x1="40" y1="190" x2="410" y2="190" stroke={C.ink} strokeWidth="2" />
        <line x1="40" y1="190" x2="40" y2="12" stroke={C.ink} strokeWidth="2" />
        <text x="412" y="205" textAnchor="end" fontSize="12" fontWeight="700" fill={C.soft}>
          V (voltios)
        </text>
        <text x="46" y="18" fontSize="12" fontWeight="700" fill={C.soft}>
          I (mA)
        </text>
        {[0, 3, 6, 9, 12].map((v) => (
          <text key={v} x={X(v)} y="204" textAnchor="middle" fontSize="11" fill={C.soft}>
            {v}
          </text>
        ))}
        {[10, 20, 30, 40, 50].map((ma) => (
          <g key={ma}>
            <line x1="40" x2="410" y1={Y(ma / 1000)} y2={Y(ma / 1000)} stroke={C.kraft} strokeDasharray="3 5" />
            <text x="34" y={Y(ma / 1000) + 4} textAnchor="end" fontSize="11" fill={C.soft}>
              {ma}
            </text>
          </g>
        ))}
        {RS.map((r, i) => {
          const vEnd = Math.min(12, 0.055 * r)
          return <line key={r} x1={X(0)} y1={Y(0)} x2={X(vEnd)} y2={Y(vEnd / r)} stroke={i === ri ? C.terracotta : C.kraft} strokeWidth={i === ri ? 4 : 2} strokeLinecap="round" />
        })}
        <circle r="8" cx={X(V)} cy={Y(I)} fill={C.electron} style={{ transition: 'all .35s cubic-bezier(.22,1,.36,1)' }} />
        <text x="410" y="40" textAnchor="end" fontFamily="JetBrains Mono" fontSize="16" fontWeight="700" fill={C.ink}>
          I = {trimNum(V)} V / {formatSI(R, 'Ω')} = {formatSI(I, 'A')}
        </text>
      </svg>
    </Frame>
  )
}

// ---------- Cálculo paso a paso ----------

export function OhmCalc({ V = 12, R = 1200 }: { V?: number; R?: number }) {
  const [step, setStep] = useState(0)
  const I = V / R
  const steps = [
    `Datos: V = ${trimNum(V)} V, R = ${formatSI(R, 'Ω')}`,
    'Buscamos la corriente: I = V / R',
    `I = ${trimNum(V)} V / ${trimNum(R, 4)} Ω`,
    `I = ${trimNum(I, 3)} A`,
    `I = ${formatSI(I, 'A')}  (× 1000 para pasar a mA)`,
  ]
  return (
    <Frame
      caption="Ejemplo del apunte (Ley de Ohm, ej. 1)."
      controls={
        <>
          <Toggle on={false} onClick={() => setStep(0)}>
            de nuevo
          </Toggle>
          <Toggle on={step < steps.length - 1} onClick={() => (sfx.page(), setStep(Math.min(steps.length - 1, step + 1)))}>
            siguiente paso
          </Toggle>
        </>
      }
    >
      <div className="grid items-center gap-4 sm:grid-cols-[200px_1fr]">
        <Schematic kind="single" V={V} rs={[R]} />
        <ol className="space-y-1.5 font-mono text-base sm:text-lg">
          {steps.slice(0, step + 1).map((s, i) => (
            <motion.li key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} className={i === steps.length - 1 ? 'font-bold text-terracotta' : ''}>
              {s}
            </motion.li>
          ))}
        </ol>
      </div>
    </Frame>
  )
}

// ---------- Esquema genérico ----------

/** Esquema chiquito: una fuente y resistores en serie o en paralelo. */
export function Schematic({ kind, V, rs, labels }: { kind: 'single' | 'series' | 'parallel'; V?: number; rs: number[]; labels?: string[] }) {
  const lab = (i: number) => labels?.[i] ?? (rs.length > 1 ? `R${i + 1}` : 'R')
  const ResV = ({ x, y, i }: { x: number; y: number; i: number }) => (
    <g transform={`translate(${x} ${y})`}>
      <rect x="-10" y="-26" width="20" height="52" rx="5" fill="#e3c99a" stroke={C.ink} strokeWidth="2" />
      <text x="16" y="-4" fontSize="13" fontWeight="800" fill={C.ink}>
        {lab(i)}
      </text>
      <text x="16" y="12" fontSize="11" fill={C.soft}>
        {Number.isFinite(rs[i]) ? formatSI(rs[i], 'Ω') : '?'}
      </text>
    </g>
  )
  return (
    <svg viewBox="0 0 220 200" className="mx-auto max-h-[36vh] w-full">
      <g fill="none" stroke={C.ink} strokeWidth="3" strokeLinejoin="round">
        {kind !== 'parallel' ? <path d="M 40 70 V 20 H 150 V 180 H 40 V 120" /> : <path d="M 40 70 V 20 H 190 V 180 H 40 V 120 M 110 20 V 180" />}
      </g>
      <line x1="22" y1="76" x2="58" y2="76" stroke={C.ink} strokeWidth="4" />
      <line x1="30" y1="92" x2="50" y2="92" stroke={C.ink} strokeWidth="4" />
      <line x1="22" y1="104" x2="58" y2="104" stroke={C.ink} strokeWidth="4" />
      <line x1="30" y1="116" x2="50" y2="116" stroke={C.ink} strokeWidth="4" />
      <text x="8" y="80" fontSize="13" fontWeight="800" fill={C.terracotta}>
        +
      </text>
      {V !== undefined && (
        <text x="62" y="100" fontSize="13" fontWeight="800" fill={C.ink}>
          {Number.isFinite(V) ? formatSI(V, 'V') : 'V = ?'}
        </text>
      )}
      {kind === 'single' && <ResV x={150} y={100} i={0} />}
      {kind === 'series' && rs.map((_, i) => <ResV key={i} x={150} y={rs.length === 2 ? 60 + i * 80 : 45 + i * 55} i={i} />)}
      {kind === 'parallel' && rs.map((_, i) => <ResV key={i} x={110 + i * 80} y={100} i={i} />)}
    </svg>
  )
}

export function SchematicCard(props: Parameters<typeof Schematic>[0] & { caption?: string }) {
  return (
    <Frame caption={props.caption}>
      <Schematic {...props} />
    </Frame>
  )
}
