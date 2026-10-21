// Gráficos de la lección 3: R = ρL/A, materiales, código de colores y serie/paralelo.

import { AnimatePresence, motion, useAnimationFrame } from 'framer-motion'
import { useRef, useState } from 'react'
import { BAND_COLORS, bandsToOhms, formatSI, parallel } from '../engine/circuit'
import { sfx } from '../lib/sound'
import { Bands } from '../sim/BenchOverlay'
import { C, Frame, Slider, Toggle } from './Frame'

// ---------- R = ρ·L/A ----------

const MATERIALS = [
  { name: 'cobre', rho: 1.7e-8, color: C.copper },
  { name: 'aluminio', rho: 2.8e-8, color: '#b9b2a8' },
  { name: 'nicromo', rho: 1.1e-6, color: '#8d8a86' },
]

export function RhoLA() {
  const [m, setM] = useState(0)
  const [L, setL] = useState(5)
  const [A, setA] = useState(1)
  const mat = MATERIALS[m]
  const R = (mat.rho * L) / (A * 1e-6)
  const speed = Math.min(1, 0.02 / R + 0.03)
  const phase = useRef(0)
  const refs = useRef<(SVGCircleElement | null)[]>([])
  const len = 60 + L * 30
  const thick = 8 + A * 10
  useAnimationFrame((_, dt) => {
    phase.current = (phase.current + (dt / 1000) * speed * 2) % 1
    refs.current.forEach((el, i) => {
      if (!el) return
      const t = (i / 10 + phase.current) % 1
      el.setAttribute('cx', String(220 - len / 2 + t * len))
    })
  })
  return (
    <Frame
      caption="Más largo → más resistencia · más grueso → menos resistencia · cada material tiene su ρ (resistividad)"
      controls={
        <>
          {MATERIALS.map((x, i) => (
            <Toggle key={x.name} on={m === i} onClick={() => setM(i)}>
              {x.name}
            </Toggle>
          ))}
          <Slider label="largo L" min={1} max={10} value={L} onChange={setL} show={`${L} m`} />
          <Slider label="sección A" min={0.5} max={4} step={0.5} value={A} onChange={setA} show={`${String(A).replace('.', ',')} mm²`} />
        </>
      }
    >
      <svg viewBox="0 0 440 190" className="mx-auto max-h-[40vh] w-full">
        <rect x={220 - len / 2} y={80 - thick / 2} width={len} height={thick} rx={thick / 2} fill={mat.color} style={{ transition: 'all .5s cubic-bezier(.22,1,.36,1)' }} />
        {Array.from({ length: 10 }, (_, i) => (
          <circle key={i} ref={(el) => void (refs.current[i] = el)} cy="80" r="4" fill={C.electron} />
        ))}
        <text x="220" y="150" textAnchor="middle" fontFamily="JetBrains Mono" fontSize="20" fontWeight="700" fill={C.ink}>
          R = ρ·L/A = {formatSI(R, 'Ω')}
        </text>
      </svg>
    </Frame>
  )
}

// ---------- Conductores y aislantes ----------

const STUFF: [string, boolean][] = [
  ['cobre', true],
  ['plástico', false],
  ['aluminio', true],
  ['madera', false],
  ['oro', true],
  ['cerámica', false],
  ['plata', true],
  ['vidrio', false],
]

export function Materials() {
  const [seen, setSeen] = useState<Record<string, boolean>>({})
  const done = Object.keys(seen).length
  return (
    <Frame caption={done < STUFF.length ? `Tocá cada material para probarlo con el circuito (${done}/${STUFF.length}).` : 'Los metales tienen muchos electrones libres: conducen. El resto casi no tiene: aíslan.'}>
      <div className="grid grid-cols-4 gap-2 sm:gap-3">
        {STUFF.map(([name, cond]) => {
          const open = seen[name]
          return (
            <motion.button
              key={name}
              onClick={() => {
                cond ? sfx.ok() : sfx.nope()
                setSeen({ ...seen, [name]: true })
              }}
              whileTap={{ scale: 0.95 }}
              className={`relative flex aspect-[4/3] flex-col items-center justify-center rounded-xl p-2 text-sm font-bold shadow ${open ? (cond ? 'bg-sage-soft' : 'bg-rose-soft') : 'bg-paper-2 hover:bg-kraft/50'}`}
            >
              <span className="font-display text-base">{name}</span>
              <AnimatePresence>
                {open && (
                  <motion.span initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="mt-1 text-xs">
                    {cond ? 'conductor: prende' : 'aislante: no pasa nada'}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          )
        })}
      </div>
    </Frame>
  )
}

// ---------- Código de colores ----------

export function ColorCode() {
  const [b, setB] = useState<[number, number, number]>([4, 7, 2])
  const [active, setActive] = useState(0)
  const ohms = bandsToOhms(...b)
  return (
    <Frame caption="1ª banda = 1ª cifra · 2ª banda = 2ª cifra · 3ª banda = cuántos ceros · dorada = tolerancia ±5%">
      <div className="flex flex-col items-center gap-3">
        <div className="relative">
          <Bands ohms={ohms < 10 ? 10 : ohms} size="lg" />
          <div className="absolute inset-0 flex items-stretch justify-center gap-4 px-7">
            {[0, 1, 2].map((i) => (
              <button key={i} onClick={() => setActive(i)} className={`w-5 rounded ${active === i ? 'ring-4 ring-amber' : ''}`} aria-label={`Banda ${i + 1}`} />
            ))}
            <div className="ml-6 w-5" />
          </div>
        </div>
        <div className="font-mono text-2xl font-bold">
          {b[0]}
          {b[1]} {'× '}
          {active === 2 ? <u>10^{b[2]}</u> : `10^${b[2]}`} = {formatSI(ohms, 'Ω')}
        </div>
        <div className="flex flex-wrap justify-center gap-1.5">
          {BAND_COLORS.map((c, i) =>
            active === 2 && i > 6 ? null : (
              <button
                key={c.name}
                onClick={() => {
                  sfx.click()
                  const nb = [...b] as [number, number, number]
                  nb[active] = i
                  if (active === 0 && i === 0) nb[0] = 1
                  setB(nb)
                  setActive((active + 1) % 3)
                }}
                className="flex w-14 flex-col items-center rounded-lg bg-paper-2 py-1 text-[11px] font-bold hover:bg-kraft/50"
              >
                <span className="mb-0.5 h-4 w-8 rounded" style={{ background: c.hex, boxShadow: 'inset 0 0 0 1px rgba(0,0,0,.15)' }} />
                {c.name} · {i}
              </button>
            ),
          )}
        </div>
        <p className="text-xs text-ink-soft">Elegí la banda {active + 1} tocando un color.</p>
      </div>
    </Frame>
  )
}

/** Solo el resistor dibujado, para consignas de "¿cuánto vale?". */
export function BandsView({ ohms }: { ohms: number }) {
  return (
    <Frame caption="Leé las bandas de izquierda a derecha (la dorada queda a la derecha).">
      <div className="flex justify-center py-6">
        <Bands ohms={ohms} size="lg" />
      </div>
    </Frame>
  )
}

// ---------- Serie y paralelo ----------

const VALUES = [100, 220, 330, 470, 1000, 2200]

export function SeriesParallel() {
  const [par, setPar] = useState(false)
  const [r1, setR1] = useState(2)
  const [r2, setR2] = useState(4)
  const R1 = VALUES[r1]
  const R2 = VALUES[r2]
  const req = par ? parallel(R1, R2) : R1 + R2
  const phase = useRef(0)
  const refs = useRef<(SVGCircleElement | null)[]>([])
  useAnimationFrame((_, dt) => {
    phase.current = (phase.current + dt / 2500) % 1
    refs.current.forEach((el, i) => {
      if (!el) return
      const t = (i / 8 + phase.current) % 1
      if (!par) {
        el.setAttribute('cx', String(40 + t * 360))
        el.setAttribute('cy', '90')
      } else {
        const branch = i % 2
        const x = 40 + t * 360
        const y = x < 120 || x > 320 ? 90 : branch ? 50 : 130
        el.setAttribute('cx', String(x))
        el.setAttribute('cy', String(y))
      }
    })
  })
  const Res = ({ x, y, r, label }: { x: number; y: number; r: number; label: string }) => (
    <g transform={`translate(${x} ${y})`}>
      <rect x="-36" y="-12" width="72" height="24" rx="12" fill="#e3c99a" stroke={C.ink} strokeOpacity=".25" />
      <text y="5" textAnchor="middle" fontSize="12" fontWeight="800" fill={C.ink}>
        {label}
      </text>
      <text y="-18" textAnchor="middle" fontSize="11" fontWeight="700" fill={C.soft}>
        {formatSI(r, 'Ω')}
      </text>
    </g>
  )
  return (
    <Frame
      caption={par ? 'Paralelo: la corriente se reparte. 1/Req = 1/R1 + 1/R2 → Req = R1·R2/(R1+R2), siempre menor que la más chica.' : 'Serie: una detrás de otra, la misma corriente pasa por las dos. Req = R1 + R2.'}
      controls={
        <>
          <Toggle on={!par} onClick={() => setPar(false)}>
            serie
          </Toggle>
          <Toggle on={par} onClick={() => setPar(true)}>
            paralelo
          </Toggle>
          <Slider label="R1" min={0} max={5} value={r1} onChange={setR1} show={formatSI(R1, 'Ω')} />
          <Slider label="R2" min={0} max={5} value={r2} onChange={setR2} show={formatSI(R2, 'Ω')} />
        </>
      }
    >
      <svg viewBox="0 0 440 200" className="mx-auto max-h-[40vh] w-full">
        {!par ? (
          <>
            <line x1="20" y1="90" x2="420" y2="90" stroke={C.copper} strokeWidth="4" />
            <Res x={160} y={90} r={R1} label="R1" />
            <Res x={290} y={90} r={R2} label="R2" />
          </>
        ) : (
          <>
            <path d="M 20 90 H 120 V 50 H 320 V 90 H 420 M 120 90 V 130 H 320 V 90" fill="none" stroke={C.copper} strokeWidth="4" />
            <Res x={220} y={50} r={R1} label="R1" />
            <Res x={220} y={130} r={R2} label="R2" />
          </>
        )}
        {Array.from({ length: 8 }, (_, i) => (
          <circle key={i} ref={(el) => void (refs.current[i] = el)} r="5" fill={C.electron} />
        ))}
        <text x="20" y="84" fontSize="12" fontWeight="800" fill={C.soft}>
          A
        </text>
        <text x="412" y="84" fontSize="12" fontWeight="800" fill={C.soft}>
          B
        </text>
        <text x="220" y="185" textAnchor="middle" fontFamily="JetBrains Mono" fontSize="18" fontWeight="700" fill={C.ink}>
          R(AB) = {formatSI(req, 'Ω')}
        </text>
      </svg>
    </Frame>
  )
}

