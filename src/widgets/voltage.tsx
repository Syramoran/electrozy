// Gráficos de la lección 2: analogía hidráulica, sentido de la corriente, pilas y ondas.

import { motion, useAnimationFrame } from 'framer-motion'
import { useMemo, useRef, useState } from 'react'
import { sfx } from '../lib/sound'
import { C, Frame, Slider, Toggle } from './Frame'

// ---------- Analogía hidráulica ----------

export function WaterTanks({ focus = 'voltage' }: { focus?: 'voltage' | 'resistance' }) {
  const [height, setHeight] = useState(60)
  const [hose, setHose] = useState(focus === 'resistance' ? 6 : 10)
  const [open, setOpen] = useState(true)
  const flow = open ? (height / 100) * (hose / 14) ** 2 : 0
  const drops = useMemo(() => Array.from({ length: 14 }, (_, i) => i / 14), [])
  const phase = useRef(0)
  const refs = useRef<(SVGCircleElement | null)[]>([])
  const tankTop = 190 - height * 1.4
  useAnimationFrame((_, dt) => {
    phase.current = (phase.current + (dt / 1000) * flow * 0.9) % 1
    drops.forEach((d, i) => {
      const t = (d + phase.current) % 1
      const el = refs.current[i]
      if (!el) return
      el.setAttribute('cx', String(130 + t * 270))
      el.setAttribute('cy', String(176 + Math.sin(t * 9) * 1.5))
      el.setAttribute('opacity', flow > 0.01 ? '1' : '0')
    })
  })
  return (
    <Frame
      caption="Altura del agua = tensión · caudal = corriente · manguera finita = más resistencia · canilla = interruptor"
      controls={
        <>
          <Slider label="altura" min={10} max={100} value={height} onChange={setHeight} show={`${Math.round(height / 10)} V`} />
          <Slider label="manguera" min={3} max={14} value={hose} onChange={setHose} show={hose < 7 ? 'finita' : hose < 11 ? 'media' : 'gruesa'} />
          <Toggle on={open} onClick={() => (sfx.click(), setOpen(!open))}>
            canilla {open ? 'abierta' : 'cerrada'}
          </Toggle>
        </>
      }
    >
      <svg viewBox="0 0 440 230" className="mx-auto max-h-[46vh] w-full">
        <rect x="30" y="40" width="90" height="155" rx="10" fill="none" stroke={C.soft} strokeWidth="4" />
        <rect x="34" y={tankTop} width="82" height={191 - tankTop} rx="6" fill="#9cc1df" style={{ transition: 'all .5s cubic-bezier(.22,1,.36,1)' }} />
        <rect x="118" y={176 - hose / 2} width="290" height={hose} rx={hose / 2} fill="#d9e6f0" stroke={C.sky} strokeWidth="2" />
        {drops.map((_, i) => (
          <circle key={i} ref={(el) => void (refs.current[i] = el)} r={Math.max(2, hose / 3)} fill="#5f97c6" />
        ))}
        <g transform="translate(150 150)">
          <rect x="-8" y="0" width="16" height="16" fill={C.soft} />
          <motion.rect x="-18" y="-10" width="36" height="8" rx="4" fill={open ? C.sage : C.terracotta} animate={{ rotate: open ? 0 : 90 }} style={{ originX: '0px', originY: '-6px' }} />
        </g>
        <text x="75" y="30" textAnchor="middle" fontSize="12" fontWeight="700" fill={C.soft}>
          tanque (batería)
        </text>
        <text x="410" y="160" textAnchor="end" fontSize="12" fontWeight="700" fill={C.soft}>
          caudal: {(flow * 10).toFixed(1).replace('.', ',')} l/s
        </text>
      </svg>
    </Frame>
  )
}

// ---------- Sentido de la corriente ----------

const LOOP = 'M 80 50 L 360 50 L 360 190 L 80 190 Z'

export function Direction() {
  const [mode, setMode] = useState<'e' | 'conv'>('e')
  const path = useRef<SVGPathElement>(null)
  const refs = useRef<(SVGGElement | null)[]>([])
  const phase = useRef(0)
  const n = 14
  useAnimationFrame((_, dt) => {
    const p = path.current
    if (!p) return
    const L = p.getTotalLength()
    // El + de la pila está arriba a la izquierda: convencional sale por + (horario), electrones al revés.
    phase.current = (phase.current + (dt / 1000) * 0.08 * (mode === 'conv' ? 1 : -1) + 1) % 1
    for (let i = 0; i < n; i++) {
      const t = (i / n + phase.current) % 1
      const a = p.getPointAtLength(t * L)
      const b = p.getPointAtLength(((t + (mode === 'conv' ? 0.01 : -0.01) + 1) % 1) * L)
      const ang = (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI
      refs.current[i]?.setAttribute('transform', `translate(${a.x} ${a.y}) rotate(${ang})`)
    }
  })
  return (
    <Frame
      caption={mode === 'e' ? 'Los electrones salen del − de la batería y vuelven por el +.' : 'Por convención dibujamos la corriente del + al − (como si fueran "huecos" positivos).'}
      controls={
        <>
          <Toggle on={mode === 'e'} onClick={() => setMode('e')}>
            electrones
          </Toggle>
          <Toggle on={mode === 'conv'} onClick={() => setMode('conv')}>
            sentido convencional
          </Toggle>
        </>
      }
    >
      <svg viewBox="0 0 440 240" className="mx-auto max-h-[48vh] w-full">
        <path ref={path} d={LOOP} fill="none" stroke={C.copper} strokeWidth="6" strokeLinejoin="round" />
        {/* batería */}
        <rect x="60" y="95" width="40" height="50" fill={C.paper} />
        <line x1="62" y1="105" x2="98" y2="105" stroke={C.ink} strokeWidth="4" />
        <line x1="70" y1="120" x2="90" y2="120" stroke={C.ink} strokeWidth="4" />
        <text x="44" y="110" fontSize="16" fontWeight="800" fill={C.terracotta}>
          +
        </text>
        <text x="44" y="130" fontSize="16" fontWeight="800" fill={C.ink}>
          −
        </text>
        {/* lamparita */}
        <circle cx="360" cy="120" r="22" fill="#fff3d0" stroke={C.ink} strokeWidth="3" />
        <path d="M 345 105 L 375 135 M 375 105 L 345 135" stroke={C.ink} strokeWidth="2.5" />
        {Array.from({ length: n }, (_, i) => (
          <g key={i} ref={(el) => void (refs.current[i] = el)}>
            {mode === 'e' ? <circle r="6" fill={C.electron} /> : <path d="M -7 -6 L 7 0 L -7 6 Z" fill={C.terracotta} />}
          </g>
        ))}
      </svg>
    </Frame>
  )
}

// ---------- Pilas en serie y paralelo ----------

export function Cells() {
  const [n, setN] = useState(2)
  const [series, setSeries] = useState(true)
  const total = series ? n * 1.5 : 1.5
  return (
    <Frame
      caption={series ? 'En serie (+ con −) las tensiones se suman.' : 'En paralelo la tensión es la misma: solo duran más. (Tienen que ser iguales.)'}
      controls={
        <>
          <Toggle on={false} onClick={() => (sfx.click(), setN(Math.max(1, n - 1)))}>
            − pila
          </Toggle>
          <Toggle on={false} onClick={() => (sfx.click(), setN(Math.min(6, n + 1)))}>
            + pila
          </Toggle>
          <Toggle on={series} onClick={() => setSeries(true)}>
            serie
          </Toggle>
          <Toggle on={!series} onClick={() => setSeries(false)}>
            paralelo
          </Toggle>
        </>
      }
    >
      <svg viewBox="0 0 440 210" className="mx-auto max-h-[44vh] w-full">
        {Array.from({ length: n }, (_, i) => {
          const x = series ? 220 - (n * 62) / 2 + i * 62 : 170
          const y = series ? 70 : 20 + i * (170 / n)
          return (
            <motion.g key={i} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, x, y }} transition={{ type: 'spring', stiffness: 120, damping: 16 }}>
              <rect width="56" height="26" rx="6" fill={C.mustard} stroke={C.ink} strokeOpacity=".25" />
              <rect x="0" width="14" height="26" rx="5" fill={C.ink} />
              <rect x="56" y="8" width="5" height="10" rx="1" fill={C.soft} />
              <text x="34" y="18" textAnchor="middle" fontSize="11" fontWeight="800" fill={C.ink}>
                1,5V
              </text>
            </motion.g>
          )
        })}
        {!series && (
          <>
            <line x1="160" y1="20" x2="160" y2={20 + (n - 1) * (170 / n) + 13} stroke={C.copper} strokeWidth="4" />
            <line x1="236" y1="20" x2="236" y2={20 + (n - 1) * (170 / n) + 13} stroke={C.copper} strokeWidth="4" />
          </>
        )}
        <text x="220" y={series ? 150 : 205} textAnchor="middle" fontFamily="JetBrains Mono" fontSize="26" fontWeight="700" fill={C.ink}>
          {total.toFixed(1).replace('.', ',')} V
        </text>
      </svg>
    </Frame>
  )
}

// ---------- Continua y alterna ----------

export function Wave() {
  const [ac, setAc] = useState(false)
  const [vp, setVp] = useState(5)
  const [f, setF] = useState(50)
  const [now, setNow] = useState(0)
  useAnimationFrame((t) => setNow(t / 1000))
  const W = 400
  const pts = Array.from({ length: 121 }, (_, i) => {
    const x = (i / 120) * W
    const tt = (i / 120) * 0.04 + (ac ? now * 0.01 : 0)
    const v = ac ? vp * Math.sin(2 * Math.PI * f * tt) : vp
    return `${x + 20},${110 - v * 8}`
  })
  return (
    <Frame
      caption={ac ? `Alterna: cambia de sentido ${f} veces por segundo (en Argentina, 50 Hz). Vpp = 2·Vp = ${2 * vp} V · T = 1/f = ${(1000 / f).toFixed(0)} ms` : 'Continua: la tensión no cambia con el tiempo (pilas, baterías, fuentes de CC).'}
      controls={
        <>
          <Toggle on={!ac} onClick={() => setAc(false)}>
            continua (CC)
          </Toggle>
          <Toggle on={ac} onClick={() => setAc(true)}>
            alterna (CA)
          </Toggle>
          <Slider label={ac ? 'Vp' : 'V'} min={1} max={12} value={vp} onChange={setVp} show={`${vp} V`} />
          {ac && <Slider label="f" min={25} max={100} step={25} value={f} onChange={setF} show={`${f} Hz`} />}
        </>
      }
    >
      <svg viewBox="0 0 440 220" className="mx-auto max-h-[44vh] w-full rounded-xl" style={{ background: '#2f3a2c' }}>
        {Array.from({ length: 11 }, (_, i) => (
          <line key={`v${i}`} x1={20 + i * 40} y1="10" x2={20 + i * 40} y2="210" stroke="#4d5d47" strokeWidth="1" />
        ))}
        {Array.from({ length: 6 }, (_, i) => (
          <line key={`h${i}`} x1="20" y1={10 + i * 40} x2="420" y2={10 + i * 40} stroke="#4d5d47" strokeWidth="1" />
        ))}
        <line x1="20" y1="110" x2="420" y2="110" stroke="#6f8566" strokeWidth="1.5" />
        <polyline points={pts.join(' ')} fill="none" stroke="#c6e59f" strokeWidth="3" />
        <text x="26" y="26" fill="#c6e59f" fontFamily="JetBrains Mono" fontSize="12">
          osciloscopio · 4 ms/div
        </text>
      </svg>
    </Frame>
  )
}
