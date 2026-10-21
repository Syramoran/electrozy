// Gráficos de la lección 1: átomo, electrones en el conductor, carga por segundo y unidades.

import { AnimatePresence, motion, useAnimationFrame } from 'framer-motion'
import { useMemo, useRef, useState } from 'react'
import { formatSI } from '../engine/circuit'
import { sfx } from '../lib/sound'
import { C, Frame, Slider, Toggle } from './Frame'

// ---------- Átomo ----------

export function Atom() {
  const [freed, setFreed] = useState(false)
  const t = useRef(0)
  const orbit = useRef<SVGGElement>(null)
  const outer = useRef<SVGGElement>(null)
  useAnimationFrame((_, dt) => {
    t.current += dt / 1000
    orbit.current?.setAttribute('transform', `rotate(${t.current * 40} 160 120)`)
    if (!freed) outer.current?.setAttribute('transform', `rotate(${-t.current * 25} 160 120)`)
  })
  const nucleus = [
    [0, 0, 'p'],
    [12, 4, 'n'],
    [-10, 8, 'n'],
    [4, -12, 'p'],
    [-6, -8, 'n'],
    [10, -6, 'p'],
  ] as const
  return (
    <Frame
      caption={freed ? 'Ese electrón quedó libre: en los metales hay muchísimos así.' : 'Tocá el electrón de la órbita de afuera.'}
      controls={freed && <Toggle on={false} onClick={() => setFreed(false)}>volver a armar el átomo</Toggle>}
    >
      <svg viewBox="0 0 320 240" className="mx-auto max-h-[52vh] w-full">
        <ellipse cx="160" cy="120" rx="60" ry="60" fill="none" stroke={C.kraft} strokeWidth="2" strokeDasharray="4 5" />
        <ellipse cx="160" cy="120" rx="105" ry="105" fill="none" stroke={C.kraft} strokeWidth="2" strokeDasharray="4 5" />
        {nucleus.map(([x, y, k], i) => (
          <circle key={i} cx={160 + x} cy={120 + y} r="11" fill={k === 'p' ? C.terracotta : C.kraft} stroke={C.ink} strokeOpacity=".2" />
        ))}
        <text x="160" y="124" textAnchor="middle" fontSize="11" fontWeight="800" fill={C.paper}>
          +
        </text>
        <g ref={orbit}>
          {[0, 180].map((a) => (
            <circle key={a} cx={160 + 60 * Math.cos((a * Math.PI) / 180)} cy={120 + 60 * Math.sin((a * Math.PI) / 180)} r="8" fill={C.electron} />
          ))}
        </g>
        <AnimatePresence>
          {!freed ? (
            <g key="orbit" ref={outer}>
              <motion.circle
                cx={265}
                cy={120}
                r="10"
                fill={C.electron}
                className="cursor-pointer"
                whileHover={{ scale: 1.3 }}
                onClick={() => {
                  sfx.pop()
                  setFreed(true)
                }}
              />
            </g>
          ) : (
            <motion.circle key="free" r="10" fill={C.electron} initial={{ cx: 265, cy: 120 }} animate={{ cx: [265, 290, 300, 310], cy: [120, 80, 50, 30] }} transition={{ duration: 2.5, ease: 'easeOut' }} />
          )}
        </AnimatePresence>
        <g fontSize="12" fontWeight="700" fill={C.soft}>
          <text x="8" y="20">
            <tspan fill={C.terracotta}>●</tspan> protón (+)
          </text>
          <text x="8" y="38">
            <tspan fill={C.kraft}>●</tspan> neutrón
          </text>
          <text x="8" y="56">
            <tspan fill={C.electron}>●</tspan> electrón (−)
          </text>
        </g>
      </svg>
    </Frame>
  )
}

// ---------- Electrones en un conductor ----------

type Dot = { x: number; y: number; vx: number; vy: number }

export function Conductor({ startOn = false }: { startOn?: boolean }) {
  const [on, setOn] = useState(startOn)
  const [volts, setVolts] = useState(5)
  const dots = useMemo<Dot[]>(() => Array.from({ length: 34 }, () => ({ x: 40 + Math.random() * 360, y: 75 + Math.random() * 70, vx: (Math.random() - 0.5) * 80, vy: (Math.random() - 0.5) * 80 })), [])
  const refs = useRef<(SVGCircleElement | null)[]>([])
  useAnimationFrame((_, dtMs) => {
    const dt = Math.min(dtMs, 40) / 1000
    const drift = on ? volts * 9 : 0
    dots.forEach((d, i) => {
      d.vx += (Math.random() - 0.5) * 300 * dt
      d.vy += (Math.random() - 0.5) * 300 * dt
      d.vx *= 0.97
      d.vy *= 0.97
      d.x += (d.vx + drift) * dt
      d.y += d.vy * dt
      if (d.y < 72 || d.y > 148) d.vy *= -1
      d.y = Math.min(148, Math.max(72, d.y))
      if (d.x > 400) d.x = 40
      if (d.x < 40) d.x = on ? 400 : 40 + (40 - d.x)
      refs.current[i]?.setAttribute('cx', String(d.x))
      refs.current[i]?.setAttribute('cy', String(d.y))
    })
  })
  return (
    <Frame
      caption={on ? 'Con la batería: los electrones avanzan ordenados del − al +. Eso es la corriente.' : 'Sin batería: se mueven para cualquier lado y en promedio no hay corriente.'}
      controls={
        <>
          <Toggle on={on} onClick={() => (sfx.click(), setOn(!on))}>
            {on ? 'desconectar batería' : 'conectar batería'}
          </Toggle>
          {on && <Slider label="tensión" min={1} max={12} value={volts} onChange={setVolts} show={`${volts} V`} />}
        </>
      }
    >
      <svg viewBox="0 0 440 220" className="mx-auto max-h-[50vh] w-full">
        <rect x="30" y="62" width="380" height="96" rx="48" fill="#f1d3b3" stroke={C.copper} strokeWidth="5" />
        {dots.map((_, i) => (
          <circle key={i} ref={(el) => void (refs.current[i] = el)} r="6" fill={C.electron} />
        ))}
        <g opacity={on ? 1 : 0.25} style={{ transition: 'opacity .6s' }}>
          <rect x="4" y="94" width="22" height="32" rx="4" fill={C.ink} />
          <text x="15" y="116" textAnchor="middle" fill={C.paper} fontSize="18" fontWeight="800">
            −
          </text>
          <rect x="414" y="94" width="22" height="32" rx="4" fill={C.terracotta} />
          <text x="425" y="116" textAnchor="middle" fill={C.paper} fontSize="18" fontWeight="800">
            +
          </text>
        </g>
        {on && (
          <g fontSize="13" fontWeight="700">
            <text x="220" y="40" textAnchor="middle" fill={C.electron}>
              electrones →
            </text>
            <text x="220" y="190" textAnchor="middle" fill={C.terracotta}>
              ← sentido convencional de la corriente
            </text>
          </g>
        )}
      </svg>
    </Frame>
  )
}

// ---------- Carga por segundo ----------

export function ChargeCounter() {
  const [amps, setAmps] = useState(1)
  const [q, setQ] = useState(0)
  const [t, setT] = useState(0)
  const state = useRef({ q: 0, t: 0, acc: 0, dots: [] as number[] })
  const g = useRef<SVGGElement>(null)
  useAnimationFrame((_, dtMs) => {
    const dt = Math.min(dtMs, 50) / 1000
    const s = state.current
    s.t += dt
    // cada bolita representa 0,25 C
    s.acc += (amps / 0.25) * dt
    while (s.acc >= 1) {
      s.acc -= 1
      s.dots.push(0)
    }
    s.dots = s.dots.map((x) => x + dt * 160).filter((x) => {
      if (x > 200 && x - dt * 160 <= 200) s.q += 0.25
      return x < 400
    })
    const el = g.current
    if (el) {
      while (el.childNodes.length < s.dots.length) {
        const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
        c.setAttribute('r', '7')
        c.setAttribute('fill', C.electron)
        c.setAttribute('cy', '90')
        el.appendChild(c)
      }
      el.childNodes.forEach((c, i) => {
        const x = s.dots[i]
        ;(c as SVGCircleElement).setAttribute('cx', String(20 + (x ?? -100)))
      })
    }
    if (Math.floor(s.t * 10) !== Math.floor((s.t - dt) * 10)) {
      setQ(s.q)
      setT(s.t)
    }
  })
  const reset = () => {
    state.current = { q: 0, t: 0, acc: 0, dots: [] }
    setQ(0)
    setT(0)
  }
  return (
    <Frame
      caption="Cada bolita son 0,25 C (≈1,6 × 10¹⁸ electrones). 1 A = 1 coulomb por segundo."
      controls={
        <>
          <Slider label="corriente" min={0.25} max={3} step={0.25} value={amps} onChange={(v) => (setAmps(v), reset())} show={`${String(amps).replace('.', ',')} A`} />
          <Toggle on={false} onClick={reset}>
            reiniciar
          </Toggle>
        </>
      }
    >
      <svg viewBox="0 0 440 180" className="mx-auto max-h-[44vh] w-full">
        <rect x="10" y="70" width="420" height="40" rx="20" fill="#f1d3b3" stroke={C.copper} strokeWidth="4" />
        <g ref={g} />
        <line x1="220" y1="50" x2="220" y2="130" stroke={C.terracotta} strokeWidth="3" strokeDasharray="6 5" />
        <text x="220" y="42" textAnchor="middle" fontSize="12" fontWeight="700" fill={C.terracotta}>
          contamos acá
        </text>
        <g fontFamily="JetBrains Mono" fontSize="15" fontWeight="700" fill={C.ink}>
          <text x="20" y="160">Q = {q.toFixed(2).replace('.', ',')} C</text>
          <text x="160" y="160">t = {t.toFixed(1).replace('.', ',')} s</text>
          <text x="290" y="160">I = Q/t = {t > 0.5 ? (q / t).toFixed(2).replace('.', ',') : '…'} A</text>
        </g>
      </svg>
    </Frame>
  )
}

// ---------- Unidades ----------

const EXAMPLES: [number, string][] = [
  [1e-6, 'reloj de pulsera'],
  [0.02, 'un LED'],
  [0.4, 'una lamparita'],
  [1, 'celular cargando'],
  [8, 'una pava eléctrica'],
]

export function Units() {
  const [exp, setExp] = useState(-1.7)
  const value = 10 ** exp
  const fmt = (v: number) => (v >= 100 ? v.toFixed(0) : v >= 10 ? v.toFixed(1) : v.toPrecision(3)).replace('.', ',')
  const near = EXAMPLES.reduce((a, b) => (Math.abs(Math.log10(b[0]) - exp) < Math.abs(Math.log10(a[0]) - exp) ? b : a))
  const rows: [string, number, boolean][] = [
    ['A', value, value >= 1],
    ['mA', value * 1e3, value < 1 && value >= 1e-3],
    ['µA', value * 1e6, value < 1e-3],
  ]
  return (
    <Frame caption="Mismo valor, distinto prefijo: mili = ÷ 1000, micro = ÷ 1.000.000. Para voltios es igual (mV, kV)." controls={<Slider label="corriente" min={-6} max={1} step={0.05} value={exp} onChange={setExp} />}>
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        {rows.map(([u, v, best]) => (
          <motion.div key={u} layout className={`rounded-xl p-3 text-center ${best ? 'bg-postit shadow-md' : 'bg-paper-2'}`}>
            <div className="font-mono text-xl font-bold sm:text-3xl">{fmt(v)}</div>
            <div className="font-display text-lg">{u}</div>
          </motion.div>
        ))}
      </div>
      <div className="mt-4 rounded-xl bg-sky-soft p-3 text-center text-sm">
        Cerca de <b>{formatSI(near[0], 'A')}</b>: {near[1]}
      </div>
    </Frame>
  )
}
