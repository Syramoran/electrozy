// Gráficos de la lección 5: el tester, cómo conectarlo y las reglas del óhmetro.

import { AnimatePresence, motion, useAnimationFrame } from 'framer-motion'
import { useRef, useState } from 'react'
import { formatSI } from '../engine/circuit'
import { sfx } from '../lib/sound'
import { C, Frame, Toggle } from './Frame'

type Mode = 'off' | 'V' | 'A' | 'ohm'
const INFO: Record<Mode, { title: string; text: string; how: string }> = {
  off: { title: 'Apagado', text: 'Siempre dejalo en OFF al terminar: ahorra pila.', how: '' },
  V: { title: 'Voltímetro (V⎓)', text: 'Mide la diferencia de potencial entre las dos puntas.', how: 'Se conecta en PARALELO: una punta a cada lado de lo que querés medir. No hace falta desarmar nada.' },
  A: { title: 'Amperímetro (mA)', text: 'Mide cuánta corriente pasa por adentro del tester.', how: 'Se conecta en SERIE: abrís el circuito y el tester cierra el hueco, así toda la corriente pasa por él.' },
  ohm: { title: 'Óhmetro (Ω)', text: 'Mide resistencia mandando una corrientita propia.', how: 'Con el circuito SIN alimentación y el componente aislado (al menos una pata afuera).' },
}
const ANG: Record<Mode, number> = { off: -90, V: -150, ohm: -30, A: 30 }

export function MeterFace() {
  const [mode, setMode] = useState<Mode>('V')
  const info = INFO[mode]
  return (
    <Frame caption="Tocá las posiciones de la perilla.">
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-stretch sm:justify-center">
        <svg viewBox="0 0 200 290" className="max-h-[48vh] w-[180px] shrink-0">
          <rect x="8" y="8" width="184" height="274" rx="26" fill={C.mustard} />
          <rect x="22" y="22" width="156" height="246" rx="14" fill="#3d3530" />
          <rect x="36" y="36" width="128" height="56" rx="8" fill="#b5c39e" />
          <text x="152" y="74" textAnchor="end" fontFamily="JetBrains Mono" fontSize="24" fontWeight="700" fill="#2b3424">
            {mode === 'off' ? '' : mode === 'V' ? '9,00 V' : mode === 'A' ? '8,9 mA' : '1,00kΩ'}
          </text>
          <g transform="translate(100 160)">
            <circle r="36" fill="#2a2522" />
            <motion.rect x="0" y="-5" width="34" height="10" rx="4" fill="#f2e8d5" animate={{ rotate: ANG[mode] }} style={{ originX: '0px', originY: '0px' }} transition={{ type: 'spring', stiffness: 140, damping: 14 }} />
            {(Object.keys(ANG) as Mode[]).map((m) => {
              const a = (ANG[m] * Math.PI) / 180
              return (
                <g key={m} onClick={() => (sfx.click(), setMode(m))} className="cursor-pointer">
                  <rect x={Math.cos(a) * 56 - 18} y={Math.sin(a) * 56 - 11} width="36" height="22" rx="6" fill={mode === m ? C.amber : 'transparent'} />
                  <text x={Math.cos(a) * 56} y={Math.sin(a) * 56 + 5} textAnchor="middle" fontFamily="JetBrains Mono" fontSize="13" fontWeight="700" fill={mode === m ? C.ink : '#f2e8d5'}>
                    {m === 'off' ? 'OFF' : m === 'V' ? 'V⎓' : m === 'A' ? 'mA' : 'Ω'}
                  </text>
                </g>
              )
            })}
          </g>
          <circle cx="70" cy="245" r="10" fill="#1f1b19" stroke="#f2e8d5" strokeOpacity=".4" />
          <circle cx="130" cy="245" r="10" fill={C.terracotta} />
          <text x="70" y="226" textAnchor="middle" fontSize="10" fontWeight="700" fill="#f2e8d5">
            COM
          </text>
          <text x="130" y="226" textAnchor="middle" fontSize="10" fontWeight="700" fill="#f2e8d5">
            VΩmA
          </text>
        </svg>
        <AnimatePresence mode="wait">
          <motion.div key={mode} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="max-w-xs self-center">
            <div className="font-display text-xl font-bold">{info.title}</div>
            <p className="mt-1 text-sm">{info.text}</p>
            {info.how && <p className="postit mt-3 -rotate-1 rounded-md p-3 text-sm font-bold">{info.how}</p>}
            <p className="mt-3 text-xs text-ink-soft">Punta negra siempre en COM; la roja en VΩmA.</p>
          </motion.div>
        </AnimatePresence>
      </div>
    </Frame>
  )
}

// ---------- Cómo conectarlo ----------

/** Circuito batería + R con el tester bien o mal puesto. */
export function HowToConnect({ start = 'V' }: { start?: 'V' | 'A' }) {
  const [mode, setMode] = useState<'V' | 'A'>(start)
  const [wrong, setWrong] = useState(false)
  const phase = useRef(0)
  const refs = useRef<(SVGCircleElement | null)[]>([])
  const path = useRef<SVGPathElement>(null)
  const short = mode === 'A' && wrong
  const flows = !(mode === 'V' && wrong)
  const gap = (mode === 'A' && !wrong) || (mode === 'V' && wrong)
  useAnimationFrame((_, dt) => {
    const p = path.current
    if (!p) return
    const L = p.getTotalLength()
    phase.current = (phase.current - (dt / 1000) * (short ? 0.5 : 0.1) + 1) % 1
    refs.current.forEach((el, i) => {
      if (!el) return
      const pt = p.getPointAtLength(((i / 12 + phase.current) % 1) * L)
      el.setAttribute('cx', String(pt.x))
      el.setAttribute('cy', String(pt.y))
      el.setAttribute('opacity', flows ? '1' : '0')
    })
  })
  // Recorrido de la corriente según el caso.
  const d =
    mode === 'A' && wrong
        ? 'M 60 60 H 160 V 130 H 60 Z'
      : 'M 60 60 H 380 V 200 H 60 Z'
  const reading = mode === 'V' ? (wrong ? '9,00 V' : '8,98 V') : wrong ? 'FUSE' : '9,0 mA'
  const text =
    mode === 'V'
      ? wrong
        ? 'Voltímetro en serie: tiene una resistencia altísima, así que casi no circula corriente. Marca la tensión de la batería, no la de R.'
        : 'Voltímetro en paralelo con R: las puntas tocan los dos extremos. Mide la tensión sin cambiar el circuito.'
      : wrong
        ? '¡Amperímetro en paralelo! Su resistencia es casi cero: hace un cortocircuito y se quema el fusible.'
        : 'Amperímetro en serie: abrimos el circuito y el tester cierra el hueco. Toda la corriente pasa por él.'
  return (
    <Frame
      caption={text}
      controls={
        <>
          <Toggle on={mode === 'V'} onClick={() => (setMode('V'), setWrong(false))}>
            voltímetro
          </Toggle>
          <Toggle on={mode === 'A'} onClick={() => (setMode('A'), setWrong(false))}>
            amperímetro
          </Toggle>
          <Toggle on={wrong} onClick={() => (wrong ? sfx.click() : sfx.nope(), setWrong(!wrong))}>
            {wrong ? 'ponerlo bien' : '¿y si lo pongo mal?'}
          </Toggle>
        </>
      }
    >
      <svg viewBox="0 0 440 250" className="mx-auto max-h-[46vh] w-full">
        {/* circuito base */}
        <g fill="none" stroke={C.copper} strokeWidth="5" strokeLinejoin="round">
          {gap ? <path d="M 60 60 H 230 M 300 60 H 380 V 200 H 60 Z" /> : <path d="M 60 60 H 380 V 200 H 60 Z" />}
        </g>
        <path ref={path} d={d} fill="none" stroke="none" />
        {/* batería */}
        <rect x="44" y="110" width="32" height="40" fill={C.paper} />
        <line x1="40" y1="118" x2="80" y2="118" stroke={C.ink} strokeWidth="4" />
        <line x1="50" y1="134" x2="70" y2="134" stroke={C.ink} strokeWidth="4" />
        <text x="86" y="138" fontSize="12" fontWeight="800" fill={C.ink}>
          9 V
        </text>
        {/* resistor */}
        <rect x="366" y="100" width="28" height="60" rx="6" fill="#e3c99a" stroke={C.ink} strokeWidth="2" />
        <text x="404" y="135" fontSize="12" fontWeight="800" fill={C.ink}>
          R
        </text>
        {Array.from({ length: 12 }, (_, i) => (
          <circle key={i} ref={(el) => void (refs.current[i] = el)} r="5" fill={C.electron} />
        ))}
        {/* tester */}
        <MiniMeter
          x={gap ? 265 : mode === 'V' ? 300 : 160}
          y={gap ? 60 : 130}
          reading={reading}
          bad={short}
        />
        {mode === 'V' && !wrong && <path d="M 366 85 H 330 M 366 175 H 330" stroke={C.ink} strokeWidth="2.5" strokeDasharray="4 3" fill="none" />}
        {short && (
          <motion.g initial={{ scale: 0 }} animate={{ scale: [0, 1.3, 1] }} transition={{ duration: 0.5 }}>
            <path d="M 150 40 l 8 12 l -6 2 l 10 14" stroke={C.amber} strokeWidth="4" fill="none" strokeLinecap="round" />
          </motion.g>
        )}
      </svg>
    </Frame>
  )
}

function MiniMeter({ x, y, reading, bad }: { x: number; y: number; reading: string; bad: boolean }) {
  return (
    <motion.g animate={{ x, y }} transition={{ type: 'spring', stiffness: 110, damping: 16 }}>
      <rect x="-34" y="-24" width="68" height="48" rx="10" fill={bad ? C.terracotta : C.mustard} stroke={C.ink} strokeOpacity=".3" />
      <rect x="-27" y="-17" width="54" height="22" rx="4" fill="#b5c39e" />
      <text y="0" textAnchor="middle" fontFamily="JetBrains Mono" fontSize="11" fontWeight="700" fill="#2b3424">
        {reading}
      </text>
      <circle cx="-12" cy="14" r="4" fill="#1f1b19" />
      <circle cx="12" cy="14" r="4" fill={C.terracotta} />
    </motion.g>
  )
}

// ---------- Reglas del óhmetro ----------

export function OhmRules() {
  const [powered, setPowered] = useState(true)
  const [isolated, setIsolated] = useState(false)
  const R1 = 1000
  const R2 = 1000
  const reading = powered ? 'Err' : isolated ? formatSI(R1, 'Ω') : formatSI((R1 * R2) / (R1 + R2), 'Ω')
  const ok = !powered && isolated
  const why = powered
    ? 'Con la batería conectada, la tensión del circuito se mezcla con la del óhmetro: la lectura no sirve (y podés dañarlo).'
    : !isolated
      ? 'Sin alimentación, pero R1 sigue unida a R2: el óhmetro mide las dos en paralelo (500 Ω), no solo R1.'
      : '¡Ahora sí! Sin alimentación y con R1 aislada, la lectura es su valor real.'
  return (
    <Frame
      caption={why}
      controls={
        <>
          <Toggle on={!powered} onClick={() => (sfx.click(), setPowered(!powered))}>
            {powered ? 'apagar la batería' : 'batería apagada'}
          </Toggle>
          <Toggle on={isolated} onClick={() => (sfx.click(), setIsolated(!isolated))}>
            {isolated ? 'R1 aislada' : 'levantar una pata de R1'}
          </Toggle>
        </>
      }
    >
      <svg viewBox="0 0 440 220" className="mx-auto max-h-[42vh] w-full">
        <g fill="none" stroke={C.copper} strokeWidth="5" strokeLinejoin="round">
          <path d="M 60 50 H 340 M 60 190 H 340 V 50 M 60 50 V 95 M 60 145 V 190" opacity={powered ? 1 : 0.35} />
          <path d="M 220 50 V 85 M 220 155 V 190" />
        </g>
        <g opacity={powered ? 1 : 0.35}>
          <line x1="40" y1="100" x2="80" y2="100" stroke={C.ink} strokeWidth="4" />
          <line x1="48" y1="116" x2="72" y2="116" stroke={C.ink} strokeWidth="4" />
          <line x1="40" y1="130" x2="80" y2="130" stroke={C.ink} strokeWidth="4" />
          <line x1="48" y1="144" x2="72" y2="144" stroke={C.ink} strokeWidth="4" />
        </g>
        <motion.g animate={{ y: isolated ? -18 : 0, rotate: isolated ? -12 : 0 }} style={{ originX: '220px', originY: '155px' }}>
          <rect x="206" y="85" width="28" height="70" rx="6" fill="#e3c99a" stroke={C.ink} strokeWidth="2" />
          <text x="242" y="125" fontSize="13" fontWeight="800" fill={C.ink}>
            R1
          </text>
        </motion.g>
        <rect x="326" y="85" width="28" height="70" rx="6" fill="#e3c99a" stroke={C.ink} strokeWidth="2" />
        <text x="362" y="125" fontSize="13" fontWeight="800" fill={C.ink}>
          R2
        </text>
        <MiniMeter x={130} y={120} reading={reading} bad={powered} />
        <path d="M 142 134 C 170 160, 190 170, 220 160 M 118 134 C 140 80, 180 70, 220 80" stroke={C.ink} strokeWidth="2" strokeDasharray="4 3" fill="none" />
        {ok && (
          <motion.text initial={{ opacity: 0 }} animate={{ opacity: 1 }} x="130" y="185" textAnchor="middle" fontSize="13" fontWeight="800" fill={C.sage}>
            lectura correcta
          </motion.text>
        )}
      </svg>
    </Frame>
  )
}
