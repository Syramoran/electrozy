// Gráficos de las lecciones 6 a 9: potencia, valor eficaz, Kirchhoff, Thevenin y pinza.

import { AnimatePresence, motion, useAnimationFrame } from 'framer-motion'
import { useMemo, useRef, useState } from 'react'
import { formatSI, trimNum } from '../engine/circuit'
import { sfx } from '../lib/sound'
import { C, Frame, Slider, Toggle } from './Frame'

const RS = [10, 22, 47, 100, 220, 470, 1000, 2200]

/** Mezcla de beige a rojo brasa según cuánto calienta (0..1). */
function heatColor(h: number) {
  const a = [227, 201, 154]
  const b = [214, 72, 40]
  const t = Math.min(1, Math.max(0, h))
  return `rgb(${a.map((x, i) => Math.round(x + (b[i] - x) * t)).join(',')})`
}

function SmokePuffs({ x, y, on }: { x: number; y: number; on: boolean }) {
  return (
    <AnimatePresence>
      {on &&
        [0, 1, 2].map((i) => (
          <motion.circle
            key={i}
            cx={x + (i - 1) * 10}
            r={7}
            fill="#8a8580"
            initial={{ cy: y, opacity: 0 }}
            animate={{ cy: [y, y - 50], opacity: [0.5, 0], r: [6, 14] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.8, repeat: Infinity, delay: i * 0.5 }}
          />
        ))}
    </AnimatePresence>
  )
}

// ---------- Potencia ----------

type PForm = 'VI' | 'I2R' | 'V2R'

export function Power() {
  const [V, setV] = useState(5)
  const [ri, setRi] = useState(4)
  const [form, setForm] = useState<PForm>('VI')
  const R = RS[ri]
  const I = V / R
  const P = V * I
  const h = P / 0.25
  const math: Record<PForm, string> = {
    VI: `P = V · I = ${trimNum(V)} V × ${formatSI(I, 'A')}`,
    I2R: `P = I² · R = (${formatSI(I, 'A')})² × ${formatSI(R, 'Ω')}`,
    V2R: `P = V² / R = (${trimNum(V)} V)² / ${formatSI(R, 'Ω')}`,
  }
  return (
    <Frame
      caption="Las tres fórmulas dan lo mismo: elegí la que use los datos que tenés. Un resistor común aguanta ¼ W; más que eso y se recalienta (ley de Joule: la energía se vuelve calor)."
      controls={
        <>
          <Slider label="V" min={0} max={24} step={0.5} value={V} onChange={setV} show={`${trimNum(V)} V`} />
          <Slider label="R" min={0} max={RS.length - 1} value={ri} onChange={setRi} show={formatSI(R, 'Ω')} />
          {(['VI', 'I2R', 'V2R'] as PForm[]).map((f) => (
            <Toggle key={f} on={form === f} onClick={() => setForm(f)}>
              {f === 'VI' ? 'V·I' : f === 'I2R' ? 'I²·R' : 'V²/R'}
            </Toggle>
          ))}
        </>
      }
    >
      <svg viewBox="0 0 440 200" className="mx-auto max-h-[42vh] w-full">
        <line x1="40" y1="90" x2="400" y2="90" stroke="#b9b2a8" strokeWidth="5" />
        <rect x="140" y="60" width="160" height="60" rx="30" fill={heatColor(h * 0.7)} style={{ transition: 'fill .6s' }} />
        {h > 0.6 && <rect x="134" y="54" width="172" height="72" rx="36" fill="none" stroke="#ff7a3a" strokeOpacity={Math.min(0.7, (h - 0.6) * 0.5)} strokeWidth="8" />}
        <SmokePuffs x={220} y={55} on={h > 1} />
        <text x="220" y="96" textAnchor="middle" fontSize="13" fontWeight="800" fill={C.ink}>
          {formatSI(R, 'Ω')} · aguanta ¼ W
        </text>
        <text x="220" y="155" textAnchor="middle" fontFamily="JetBrains Mono" fontSize="15" fontWeight="700" fill={C.soft}>
          {math[form]}
        </text>
        <text x="220" y="185" textAnchor="middle" fontFamily="JetBrains Mono" fontSize="22" fontWeight="700" fill={h > 1 ? C.terracotta : C.ink}>
          P = {formatSI(P, 'W')}
          {h > 1 ? '  ¡se recalienta!' : ''}
        </text>
        <g transform="translate(30 20)">
          <rect width="14" height="130" rx="7" fill={C.paper2} stroke={C.kraft} />
          <rect y={130 - Math.min(1, P / 1) * 130} width="14" height={Math.min(1, P / 1) * 130} rx="7" fill={h > 1 ? C.terracotta : C.amber} style={{ transition: 'all .5s' }} />
          <line x1="-4" x2="18" y1={130 - 0.25 * 130} y2={130 - 0.25 * 130} stroke={C.ink} strokeWidth="2" />
          <text x="22" y={130 - 0.25 * 130 + 4} fontSize="10" fontWeight="700" fill={C.soft}>
            ¼ W
          </text>
        </g>
      </svg>
    </Frame>
  )
}

// ---------- Valor eficaz ----------

export function Rms() {
  const [vp, setVp] = useState(10)
  const [vdc, setVdc] = useState(4)
  const pAc = (vp * vp) / 2
  const pDc = vdc * vdc
  const target = vp / Math.SQRT2
  const match = Math.abs(vdc - target) < 0.12
  const [t, setT] = useState(0)
  useAnimationFrame((ms) => setT(ms / 1000))
  const wave = Array.from({ length: 61 }, (_, i) => `${i * 2.5},${30 - vp * 2 * Math.sin((i / 60) * Math.PI * 4 + t * 4)}`).join(' ')
  const Heater = ({ x, p, label }: { x: number; p: number; label: string }) => {
    const f = Math.min(1, p / 110)
    return (
      <g transform={`translate(${x} 0)`}>
        <rect x="0" y="80" width="140" height="70" rx="14" fill="#5b4a3f" />
        {[0, 1, 2, 3].map((k) => (
          <rect key={k} x="14" y={92 + k * 14} width="112" height="7" rx="3.5" fill={heatColor(f)} style={{ transition: 'fill .8s' }} />
        ))}
        <rect x="150" y="70" width="12" height="80" rx="6" fill={C.paper2} stroke={C.kraft} />
        <rect x="150" y={150 - f * 80} width="12" height={f * 80} rx="6" fill={C.terracotta} style={{ transition: 'all .8s' }} />
        <text x="70" y="172" textAnchor="middle" fontSize="12" fontWeight="800" fill={C.ink}>
          {label}
        </text>
        <text x="70" y="188" textAnchor="middle" fontFamily="JetBrains Mono" fontSize="11" fill={C.soft}>
          {trimNum(p, 3)} W (en 1 Ω)
        </text>
      </g>
    )
  }
  return (
    <Frame
      caption={
        match
          ? `¡Calientan igual! Esa continua es el valor eficaz: Vrms = Vp/√2 = ${trimNum(target)} V. Por eso los 220 V del enchufe son eficaces: el pico llega a 311 V.`
          : 'Dos estufitas iguales: una con alterna, otra con continua. Ajustá la continua hasta que calienten lo mismo.'
      }
      controls={
        <>
          <Slider label="Vp alterna" min={2} max={14} value={vp} onChange={setVp} show={`${vp} V`} />
          <Slider label="continua" min={0} max={14} step={0.05} value={vdc} onChange={(v) => (Math.abs(v - target) < 0.12 && !match && sfx.ok(), setVdc(v))} show={`${trimNum(vdc)} V`} />
        </>
      }
    >
      <svg viewBox="0 0 440 200" className="mx-auto max-h-[44vh] w-full">
        <g transform="translate(20 10)">
          <polyline points={wave} fill="none" stroke={C.sky} strokeWidth="2.5" />
        </g>
        <g transform="translate(250 10)">
          <line x1="0" x2="150" y1={30 - vdc * 2} y2={30 - vdc * 2} stroke={C.amber} strokeWidth="2.5" />
        </g>
        <Heater x={20} p={pAc} label="alterna" />
        <Heater x={250} p={pDc} label="continua" />
        {match && (
          <motion.text initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} x="220" y="66" textAnchor="middle" fontSize="15" fontWeight="800" fill={C.sage}>
            = mismo calor =
          </motion.text>
        )}
      </svg>
    </Frame>
  )
}

// ---------- Kirchhoff de tensiones ----------

const KR = [100, 220, 330, 470, 680, 1000]

export function Kvl() {
  const [rs, setRs] = useState([2, 3, 1])
  const V = 9
  const R = rs.map((i) => KR[i])
  const I = V / (R[0] + R[1] + R[2])
  const drops = R.map((r) => I * r)
  // Potencial a lo largo del lazo: la batería sube, cada R baja.
  const pts = useMemo(() => {
    const out: [number, number][] = [[0, 0]]
    out.push([60, V])
    let v = V
    drops.forEach((d, i) => {
      out.push([60 + i * 100 + 20, v])
      v -= d
      out.push([60 + i * 100 + 90, v])
    })
    out.push([380, 0])
    return out
  }, [drops.join(',')])
  const X = (x: number) => 30 + x
  const Y = (v: number) => 170 - v * 15
  const path = useRef<SVGPolylineElement>(null)
  const ball = useRef<SVGCircleElement>(null)
  const ph = useRef(0)
  useAnimationFrame((_, dt) => {
    const p = path.current
    if (!p || !ball.current) return
    ph.current = (ph.current + dt / 6000) % 1
    const L = p.getTotalLength()
    const pt = p.getPointAtLength(ph.current * L)
    ball.current.setAttribute('cx', String(pt.x))
    ball.current.setAttribute('cy', String(pt.y - 8))
  })
  return (
    <Frame
      caption={`Dando la vuelta al circuito, lo que sube la batería lo bajan las resistencias: +${V} − ${drops.map((d) => trimNum(d)).join(' − ')} = 0`}
      controls={R.map((r, i) => (
        <Slider
          key={i}
          label={`R${i + 1}`}
          min={0}
          max={KR.length - 1}
          value={rs[i]}
          onChange={(v) => setRs(rs.map((x, k) => (k === i ? v : x)))}
          show={formatSI(r, 'Ω')}
        />
      ))}
    >
      <svg viewBox="0 0 440 210" className="mx-auto max-h-[44vh] w-full">
        <line x1="30" y1={Y(0)} x2="420" y2={Y(0)} stroke={C.kraft} strokeWidth="2" />
        <text x="26" y={Y(V) + 4} textAnchor="end" fontSize="11" fill={C.soft}>
          {V} V
        </text>
        <text x="26" y={Y(0) + 4} textAnchor="end" fontSize="11" fill={C.soft}>
          0 V
        </text>
        <polyline ref={path} points={pts.map(([x, v]) => `${X(x)},${Y(v)}`).join(' ')} fill="none" stroke={C.ink} strokeWidth="4" strokeLinejoin="round" style={{ transition: 'all .4s' }} />
        <rect x={X(0) - 4} y={Y(V)} width="8" height={V * 15} fill={C.terracotta} opacity=".25" />
        <text x={X(30)} y={Y(V / 2)} textAnchor="middle" fontSize="12" fontWeight="800" fill={C.terracotta}>
          +{V} V
        </text>
        {drops.map((d, i) => {
          const x0 = X(60 + i * 100 + 55)
          const v0 = V - drops.slice(0, i).reduce((a, b) => a + b, 0)
          return (
            <g key={i}>
              <text x={x0} y={Y(v0) - 10} textAnchor="middle" fontSize="12" fontWeight="800" fill={C.electron}>
                R{i + 1}: −{trimNum(d)} V
              </text>
            </g>
          )
        })}
        <circle ref={ball} r="8" fill={C.amber} stroke={C.ink} strokeWidth="2" />
        <text x="420" y="200" textAnchor="end" fontFamily="JetBrains Mono" fontSize="12" fontWeight="700" fill={C.ink}>
          I = {formatSI(I, 'A')} (la misma en todo el lazo)
        </text>
      </svg>
    </Frame>
  )
}

// ---------- Kirchhoff de corrientes ----------

type Branch = { amps: number; into: boolean }

function randomNode(): { known: Branch[]; unknownInto: boolean; answer: number } {
  for (;;) {
    const known = Array.from({ length: 4 }, () => ({ amps: 1 + Math.floor(Math.random() * 12) / 2, into: Math.random() < 0.5 }))
    const net = known.reduce((s, b) => s + (b.into ? b.amps : -b.amps), 0)
    if (net === 0 || Math.abs(net) > 9) continue
    // La incógnita equilibra: si entra más de lo que sale, la que falta sale.
    return { known, unknownInto: net < 0, answer: Math.abs(net) }
  }
}

export function Kcl() {
  const [node, setNode] = useState(randomNode)
  const [x, setX] = useState(0)
  const all: Branch[] = [...node.known, { amps: x, into: node.unknownInto }]
  const inSum = all.filter((b) => b.into).reduce((s, b) => s + b.amps, 0)
  const outSum = all.filter((b) => !b.into).reduce((s, b) => s + b.amps, 0)
  const balanced = Math.abs(inSum - outSum) < 1e-9
  const tilt = Math.max(-14, Math.min(14, (outSum - inSum) * 3))
  const angles = [200, 250, 300, 340, 20, 110]
  return (
    <Frame
      caption={balanced ? '¡Equilibrio! En un nodo, todo lo que entra sale: Σ entra = Σ sale (la carga no se acumula ni desaparece).' : 'Un nodo es como una rotonda: ajustá la corriente que falta hasta que la balanza quede derecha.'}
      controls={
        <>
          <Slider label={`i₅ (${node.unknownInto ? 'entra' : 'sale'})`} min={0} max={12} step={0.5} value={x} onChange={(v) => (setX(v), v === node.answer && sfx.ok())} show={`${trimNum(x)} A`} />
          <Toggle on={false} onClick={() => (sfx.page(), setNode(randomNode()), setX(0))}>
            otro nodo
          </Toggle>
        </>
      }
    >
      <svg viewBox="0 0 440 210" className="mx-auto max-h-[44vh] w-full">
        <g transform="translate(120 105)">
          {all.map((b, i) => {
            const a = (angles[i] * Math.PI) / 180
            const [ex, ey] = [Math.cos(a) * 85, Math.sin(a) * 85]
            const mx = ex * 0.55
            const my = ey * 0.55
            const rot = (Math.atan2(ey, ex) * 180) / Math.PI + (b.into ? 180 : 0)
            const unknown = i === all.length - 1
            return (
              <g key={i}>
                <line x1="0" y1="0" x2={ex} y2={ey} stroke={C.copper} strokeWidth="5" />
                <path d="M -8 -7 L 8 0 L -8 7 Z" transform={`translate(${mx} ${my}) rotate(${rot})`} fill={b.into ? C.sage : C.terracotta} />
                <text x={ex * 1.18} y={ey * 1.18 + 4} textAnchor="middle" fontSize="12" fontWeight="800" fill={unknown ? C.amber : C.ink}>
                  {unknown ? (x ? `${trimNum(x)} A` : '?') : `${trimNum(b.amps)} A`}
                </text>
              </g>
            )
          })}
          <circle r="12" fill={C.ink} />
        </g>
        {/* balanza */}
        <g transform="translate(330 120)">
          <path d="M -6 60 L 6 60 L 2 0 L -2 0 Z" fill={C.soft} />
          <motion.g animate={{ rotate: tilt }} transition={{ type: 'spring', stiffness: 80, damping: 10 }}>
            <line x1="-80" y1="0" x2="80" y2="0" stroke={C.ink} strokeWidth="4" strokeLinecap="round" />
            <g transform="translate(-70 0)">
              <path d="M -26 30 Q 0 44 26 30 Z" fill={C.sage} />
              <line x1="0" y1="0" x2="-22" y2="30" stroke={C.soft} />
              <line x1="0" y1="0" x2="22" y2="30" stroke={C.soft} />
              <text y="58" textAnchor="middle" fontSize="11" fontWeight="800" fill={C.ink}>
                entra {trimNum(inSum)} A
              </text>
            </g>
            <g transform="translate(70 0)">
              <path d="M -26 30 Q 0 44 26 30 Z" fill={C.terracotta} />
              <line x1="0" y1="0" x2="-22" y2="30" stroke={C.soft} />
              <line x1="0" y1="0" x2="22" y2="30" stroke={C.soft} />
              <text y="58" textAnchor="middle" fontSize="11" fontWeight="800" fill={C.ink}>
                sale {trimNum(outSum)} A
              </text>
            </g>
          </motion.g>
        </g>
      </svg>
    </Frame>
  )
}

// ---------- Caja negra (Thevenin) ----------

const BOXES = [
  { name: 'divisor', vth: 6, rth: 2500, inside: '12 V con dos resistores de 5 kΩ (divisor)' },
  { name: 'apunte', vth: 2, rth: 4500, inside: 'el circuito del ejemplo 5 del apunte (dos divisores: 6 V y 4 V)' },
  { name: 'pila', vth: 9, rth: 1000, inside: 'una batería de 9 V con 1 kΩ en serie' },
]
const RLS = [100, 470, 1000, 2200, 4700, 10000, Infinity]

export function BlackBox() {
  const [bi, setBi] = useState(0)
  const box = BOXES[bi]
  const [rl, setRl] = useState(2)
  const [vth, setVth] = useState(1)
  const [rth, setRth] = useState(1000)
  const RL = RLS[rl]
  const vOut = (v: number, r: number) => (RL === Infinity ? v : (v * RL) / (RL + r))
  const real = vOut(box.vth, box.rth)
  const mine = vOut(vth, rth)
  const solved = Math.abs(vth - box.vth) < 0.05 && Math.abs(rth - box.rth) < 1
  const Bulb = ({ x, v }: { x: number; v: number }) => (
    <g transform={`translate(${x} 150)`}>
      <circle r="18" fill="#fff6df" stroke={C.ink} strokeWidth="2" />
      <circle r="26" fill="#ffcf7a" opacity={Math.min(0.8, v / 10)} />
      <text y="44" textAnchor="middle" fontFamily="JetBrains Mono" fontSize="13" fontWeight="700" fill={C.ink}>
        {trimNum(v, 3)} V
      </text>
    </g>
  )
  return (
    <Frame
      caption={
        solved
          ? `¡Lo descubriste! Adentro había ${box.inside}. Desde afuera se comporta igual que Vth = ${trimNum(box.vth)} V en serie con Rth = ${formatSI(box.rth, 'Ω')}.`
          : 'Elegí Vth y Rth para que tu caja haga lo mismo que la misteriosa con cualquier carga. Pista: sin carga (RL = ∞) medís Vth directo.'
      }
      controls={
        <>
          <Slider label="carga RL" min={0} max={RLS.length - 1} value={rl} onChange={setRl} show={RL === Infinity ? 'sin carga' : formatSI(RL, 'Ω')} />
          <Slider label="tu Vth" min={0} max={12} step={0.5} value={vth} onChange={setVth} show={`${trimNum(vth)} V`} />
          <Slider label="tu Rth" min={500} max={5000} step={500} value={rth} onChange={setRth} show={formatSI(rth, 'Ω')} />
          <Toggle on={false} onClick={() => (sfx.page(), setBi((bi + 1) % BOXES.length), setVth(1), setRth(1000))}>
            otra caja
          </Toggle>
        </>
      }
    >
      <svg viewBox="0 0 440 210" className="mx-auto max-h-[44vh] w-full">
        <g transform="translate(30 20)">
          <rect width="140" height="90" rx="12" fill={solved ? C.paper2 : C.ink} style={{ transition: 'fill .8s' }} />
          <text x="70" y="52" textAnchor="middle" fontSize={solved ? 13 : 30} fontWeight="900" fill={solved ? C.ink : C.paper}>
            {solved ? `${trimNum(box.vth)} V + ${formatSI(box.rth, 'Ω')}` : '?'}
          </text>
          <circle cx="40" cy="90" r="5" fill={C.terracotta} />
          <circle cx="100" cy="90" r="5" fill={C.soft} />
        </g>
        <g transform="translate(270 20)">
          <rect width="140" height="90" rx="12" fill={C.postit} />
          <text x="70" y="40" textAnchor="middle" fontSize="13" fontWeight="800" fill={C.ink}>
            tu equivalente
          </text>
          <text x="70" y="62" textAnchor="middle" fontFamily="JetBrains Mono" fontSize="13" fill={C.ink}>
            {trimNum(vth)} V + {formatSI(rth, 'Ω')}
          </text>
          <circle cx="40" cy="90" r="5" fill={C.terracotta} />
          <circle cx="100" cy="90" r="5" fill={C.soft} />
        </g>
        <path d="M 70 110 V 130 H 85 M 130 110 V 130 H 115 M 310 110 V 130 H 325 M 370 110 V 130 H 355" stroke={C.copper} strokeWidth="3" fill="none" />
        <Bulb x={100} v={real} />
        <Bulb x={340} v={mine} />
        <text x="220" y="160" textAnchor="middle" fontSize="20" fontWeight="900" fill={Math.abs(real - mine) < 0.02 ? C.sage : C.terracotta}>
          {Math.abs(real - mine) < 0.02 ? '=' : '≠'}
        </text>
      </svg>
    </Frame>
  )
}

// ---------- Pinza amperimétrica ----------

export function Clamp() {
  const [amps, setAmps] = useState(8)
  const [mode, setMode] = useState<'none' | 'one' | 'both'>('none')
  const reading = mode === 'one' ? amps : 0
  return (
    <Frame
      caption={
        mode === 'one'
          ? 'Abrazando un solo cable mide la corriente por el campo magnético que genera, sin cortar nada. Es menos precisa, pero ideal para corrientes grandes.'
          : mode === 'both'
            ? 'Con los dos cables (ida y vuelta) los campos se cancelan: marca 0. Por eso se abraza un solo conductor.'
            : 'La pinza amperimétrica mide corriente "abrazando" el cable.'
      }
      controls={
        <>
          <Toggle on={mode === 'none'} onClick={() => setMode('none')}>
            soltar
          </Toggle>
          <Toggle on={mode === 'one'} onClick={() => (sfx.click(), setMode('one'))}>
            abrazar un cable
          </Toggle>
          <Toggle on={mode === 'both'} onClick={() => (sfx.click(), setMode('both'))}>
            abrazar los dos
          </Toggle>
          <Slider label="corriente" min={1} max={20} value={amps} onChange={setAmps} show={`${amps} A`} />
        </>
      }
    >
      <svg viewBox="0 -110 440 310" className="mx-auto max-h-[44vh] w-full">
        <line x1="20" y1="80" x2="420" y2="80" stroke={C.terracotta} strokeWidth="9" strokeLinecap="round" />
        <line x1="20" y1="120" x2="420" y2="120" stroke={C.ink} strokeWidth="9" strokeLinecap="round" />
        {mode === 'one' &&
          [0, 1, 2].map((i) => (
            <motion.ellipse key={i} cx="220" cy="80" rx={20 + i * 14} ry={10 + i * 7} fill="none" stroke={C.sky} strokeWidth="2" initial={{ opacity: 0 }} animate={{ opacity: [0, 0.8, 0] }} transition={{ duration: 1.6, repeat: Infinity, delay: i * 0.4 }} />
          ))}
        <motion.g animate={{ y: mode === 'none' ? -70 : mode === 'one' ? 0 : 20 }} transition={{ type: 'spring', stiffness: 90, damping: 14 }}>
          <ellipse cx="220" cy={mode === 'both' ? 80 : 80} rx="38" ry={mode === 'both' ? 46 : 26} fill="none" stroke={C.mustard} strokeWidth="12" />
          <rect x="200" y="-30" width="40" height="70" rx="10" fill={C.mustard} />
          <rect x="206" y="-22" width="28" height="18" rx="3" fill="#b5c39e" />
          <text x="220" y="-9" textAnchor="middle" fontFamily="JetBrains Mono" fontSize="9" fontWeight="700" fill="#2b3424">
            {trimNum(reading)} A
          </text>
        </motion.g>
        <text x="20" y="190" fontFamily="JetBrains Mono" fontSize="14" fontWeight="700" fill={C.ink}>
          lectura: {trimNum(reading)} A
        </text>
      </svg>
    </Frame>
  )
}

