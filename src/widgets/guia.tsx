// Los circuitos de la guía de ejercicios 2013 (y del apunte), redibujados con un mini lenguaje.

import { motion } from 'framer-motion'
import { useState } from 'react'
import { sfx } from '../lib/sound'
import { C, Frame, Toggle } from './Frame'

type El =
  | ['w', ...number[]] // cable por una lista de puntos x,y
  | ['r', number, number, number, number, string] // resistor entre dos puntos
  | ['v', number, number, number, string] // fuente vertical en x, de y1 (+) a y2
  | ['t', number, number] // borne
  | ['n', number, number] // nodo
  | ['txt', number, number, string]
  | ['arrow', number, number, number, number, string]

function Resistor({ x1, y1, x2, y2, label }: { x1: number; y1: number; x2: number; y2: number; label: string }) {
  const vert = x1 === x2
  const L = vert ? y2 - y1 : x2 - x1
  const zz = Math.min(42, Math.abs(L) - 12)
  const mid = vert ? (y1 + y2) / 2 : (x1 + x2) / 2
  const a = mid - zz / 2
  const pts: string[] = []
  for (let i = 0; i <= 8; i++) {
    const s = a + (zz * i) / 8
    const off = i === 0 || i === 8 ? 0 : i % 2 ? 6 : -6
    pts.push(vert ? `${x1 + off},${s}` : `${s},${y1 + off}`)
  }
  return (
    <g>
      <path d={vert ? `M ${x1} ${y1} V ${a} M ${x1} ${a + zz} V ${y2}` : `M ${x1} ${y1} H ${a} M ${a + zz} ${y1} H ${x2}`} stroke={C.ink} strokeWidth="2" fill="none" />
      <polyline points={pts.join(' ')} fill="none" stroke={C.terracotta} strokeWidth="2.5" strokeLinejoin="round" />
      <text x={vert ? x1 + 11 : mid} y={vert ? mid + 4 : y1 - 10} textAnchor={vert ? 'start' : 'middle'} fontSize="11" fontWeight="800" fill={C.ink}>
        {label}
      </text>
    </g>
  )
}

export function CircuitFig({ els, w = 360, h = 240 }: { els: El[]; w?: number; h?: number }) {
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="mx-auto max-h-[46vh] w-full">
      {els.map((e, i) => {
        switch (e[0]) {
          case 'w': {
            const p = e.slice(1) as number[]
            return <polyline key={i} points={p.join(' ')} fill="none" stroke={C.ink} strokeWidth="2" />
          }
          case 'r':
            return <Resistor key={i} x1={e[1]} y1={e[2]} x2={e[3]} y2={e[4]} label={e[5]} />
          case 'v': {
            const [, x, y1, y2, label] = e
            const m = (y1 + y2) / 2
            return (
              <g key={i}>
                <path d={`M ${x} ${y1} V ${m - 18} M ${x} ${m + 18} V ${y2}`} stroke={C.ink} strokeWidth="2" />
                <circle cx={x} cy={m} r="18" fill={C.paper} stroke={C.ink} strokeWidth="2" />
                <path d={`M ${x - 9} ${m - 4} H ${x + 9} M ${x - 9} ${m + 4} H ${x + 9}`} stroke={C.ink} strokeWidth="2" />
                <text x={x - 10} y={m - 22} fontSize="12" fontWeight="900" fill={C.terracotta}>
                  +
                </text>
                <text x={x - 26} y={m + 4} textAnchor="end" fontSize="11" fontWeight="800" fill={C.ink}>
                  {label}
                </text>
              </g>
            )
          }
          case 't':
            return <circle key={i} cx={e[1]} cy={e[2]} r="4" fill={C.paper} stroke={C.ink} strokeWidth="2" />
          case 'n':
            return <circle key={i} cx={e[1]} cy={e[2]} r="3" fill={C.ink} />
          case 'txt':
            return (
              <text key={i} x={e[1]} y={e[2]} fontSize="11" fontWeight="800" fill={C.soft}>
                {e[3]}
              </text>
            )
          case 'arrow': {
            const [, x1, y1, x2, y2, label] = e
            const ang = Math.atan2(y2 - y1, x2 - x1)
            const hx = (s: number) => x2 - 8 * Math.cos(ang + s)
            const hy = (s: number) => y2 - 8 * Math.sin(ang + s)
            return (
              <g key={i} stroke={C.electron} strokeWidth="2" fill="none">
                <path d={`M ${x1} ${y1} L ${x2} ${y2} M ${hx(0.5)} ${hy(0.5)} L ${x2} ${y2} L ${hx(-0.5)} ${hy(-0.5)}`} />
                <text x={(x1 + x2) / 2 + 6} y={(y1 + y2) / 2 - 4} fontSize="11" fontWeight="800" fill={C.electron} stroke="none">
                  {label}
                </text>
              </g>
            )
          }
        }
      })}
    </svg>
  )
}

/** Figuras: coordenadas a mano, siguiendo los dibujos de la guía. */
export const FIGS: Record<string, El[]> = {
  // 5 A: R1 ‖ (R2 + R4) ‖ R3
  '5A': [
    ['w', 100, 40, 220, 40],
    ['w', 100, 200, 220, 200],
    ['r', 100, 40, 100, 200, 'R1'],
    ['r', 160, 40, 160, 120, 'R2'],
    ['r', 160, 120, 160, 200, 'R4'],
    ['r', 220, 40, 220, 200, 'R3'],
    ['w', 160, 18, 160, 40],
    ['w', 160, 200, 160, 222],
    ['t', 160, 18],
    ['t', 160, 222],
  ],
  // 5 B: R4 ‖ (R6 + R3) ‖ (R1 + R5‖R2)
  '5B': [
    ['w', 60, 40, 200, 40],
    ['w', 60, 200, 260, 200],
    ['r', 60, 40, 60, 200, 'R4'],
    ['r', 130, 40, 130, 120, 'R6'],
    ['r', 130, 120, 130, 200, 'R3'],
    ['r', 200, 40, 200, 120, 'R1'],
    ['w', 200, 120, 260, 120],
    ['n', 200, 120],
    ['r', 200, 120, 200, 200, 'R5'],
    ['r', 260, 120, 260, 200, 'R2'],
    ['w', 130, 18, 130, 40],
    ['w', 130, 200, 130, 222],
    ['t', 130, 18],
    ['t', 130, 222],
  ],
  // 5 C: R4 ‖ R1 ‖ [(R6‖R2) + (R7‖R5‖R3)]
  '5C': [
    ['w', 60, 40, 300, 40],
    ['w', 60, 200, 300, 200],
    ['r', 60, 40, 60, 200, 'R4'],
    ['r', 130, 40, 130, 120, 'R6'],
    ['r', 210, 40, 210, 120, 'R2'],
    ['w', 130, 120, 250, 120],
    ['n', 130, 120],
    ['n', 210, 120],
    ['r', 130, 120, 130, 200, 'R7'],
    ['r', 190, 120, 190, 200, 'R5'],
    ['r', 250, 120, 250, 200, 'R3'],
    ['r', 300, 40, 300, 200, 'R1'],
    ['w', 130, 18, 130, 40],
    ['w', 130, 200, 130, 222],
    ['t', 130, 18],
    ['t', 130, 222],
  ],
  // 5 D: (R1‖R2) ‖ (R3 + R4) ‖ [(R5‖R7) + (R6‖R8‖R9)]
  '5D': [
    ['w', 40, 40, 260, 40],
    ['w', 90, 200, 310, 200],
    ['r', 40, 40, 40, 120, 'R1'],
    ['r', 90, 40, 90, 120, 'R2'],
    ['w', 40, 120, 90, 120, 90, 200],
    ['r', 150, 40, 150, 120, 'R3'],
    ['r', 150, 120, 150, 200, 'R4'],
    ['r', 205, 40, 205, 120, 'R5'],
    ['r', 260, 40, 260, 120, 'R7'],
    ['w', 205, 120, 310, 120],
    ['n', 205, 120],
    ['n', 260, 120],
    ['r', 205, 120, 205, 200, 'R6'],
    ['r', 260, 120, 260, 200, 'R8'],
    ['r', 310, 120, 310, 200, 'R9'],
    ['w', 150, 18, 150, 40],
    ['w', 150, 200, 150, 222],
    ['t', 150, 18],
    ['t', 150, 222],
  ],
  // Ej. 6: serie R1 + R2 + R3
  '6': [
    ['v', 50, 40, 200, 'V'],
    ['w', 50, 40, 120, 40],
    ['r', 120, 40, 220, 40, 'R1'],
    ['w', 220, 40, 280, 40],
    ['r', 280, 40, 280, 120, 'R2'],
    ['r', 280, 120, 280, 200, 'R3'],
    ['w', 50, 200, 280, 200],
    ['arrow', 160, 60, 230, 90, 'I'],
  ],
  // Ej. 7: R1 en serie con R2 ‖ R3 ‖ R4
  '7': [
    ['v', 40, 40, 200, 'V'],
    ['r', 40, 40, 150, 40, 'R1'],
    ['w', 150, 40, 320, 40],
    ['n', 200, 40],
    ['n', 260, 40],
    ['r', 200, 40, 200, 200, 'R2'],
    ['r', 260, 40, 260, 200, 'R3'],
    ['r', 320, 40, 320, 200, 'R4'],
    ['w', 40, 200, 320, 200],
  ],
  // Ej. 8 y 9 (arriba): (R1 + R2) ‖ R3, en serie con el resto
  '8': [
    ['v', 40, 80, 210, 'V'],
    ['w', 40, 80, 100, 80],
    ['w', 100, 80, 100, 35],
    ['r', 100, 35, 170, 35, 'R1'],
    ['r', 170, 35, 240, 35, 'R2'],
    ['w', 240, 35, 240, 80],
    ['r', 100, 80, 240, 80, 'R3'],
    ['n', 100, 80],
    ['n', 240, 80],
    ['w', 240, 80, 300, 80],
    ['r', 300, 80, 300, 210, 'R4'],
    ['w', 40, 210, 300, 210],
  ],
  '9': [
    ['v', 40, 80, 225, 'V'],
    ['w', 40, 80, 100, 80],
    ['w', 100, 80, 100, 35],
    ['r', 100, 35, 170, 35, 'R1'],
    ['r', 170, 35, 240, 35, 'R2'],
    ['w', 240, 35, 240, 80],
    ['r', 100, 80, 240, 80, 'R3'],
    ['n', 100, 80],
    ['n', 240, 80],
    ['w', 240, 80, 290, 80],
    ['r', 290, 80, 290, 125, 'R4'],
    ['w', 290, 125, 335, 125],
    ['r', 290, 125, 290, 175, 'R5'],
    ['r', 335, 125, 335, 175, 'R6'],
    ['w', 290, 175, 335, 175],
    ['n', 290, 125],
    ['n', 290, 175],
    ['r', 290, 175, 290, 225, 'R7'],
    ['w', 40, 225, 290, 225],
  ],
  // Ej. 10 y 11: R1 → nodo → R2 a masa y R3 + R4 a masa
  '10': [
    ['v', 40, 60, 200, 'V'],
    ['r', 40, 60, 160, 60, 'R1'],
    ['n', 160, 60],
    ['r', 160, 60, 160, 200, 'R2'],
    ['r', 160, 60, 280, 60, 'R3'],
    ['w', 280, 60, 310, 60],
    ['r', 310, 60, 310, 200, 'R4'],
    ['w', 40, 200, 310, 200],
    ['n', 160, 200],
  ],
  // Ej. 12: R1 y después R2 ‖ R3, con las corrientes marcadas
  '12': [
    ['v', 40, 60, 200, 'V'],
    ['r', 40, 60, 160, 60, 'R1'],
    ['w', 160, 60, 280, 60],
    ['n', 160, 60],
    ['r', 160, 60, 160, 200, 'R2'],
    ['r', 280, 60, 280, 200, 'R3'],
    ['w', 40, 200, 280, 200],
    ['arrow', 70, 80, 130, 80, 'I1'],
    ['arrow', 185, 90, 185, 140, 'I2'],
    ['arrow', 255, 90, 255, 140, 'I3'],
  ],
  // Ejemplo del apunte: (R1 ‖ R2) + R3 + R4 con 12 V
  apunte: [
    ['v', 40, 60, 200, 'V'],
    ['w', 40, 60, 80, 60],
    ['w', 80, 30, 80, 90],
    ['r', 80, 30, 160, 30, 'R1'],
    ['r', 80, 90, 160, 90, 'R2'],
    ['w', 160, 30, 160, 90],
    ['n', 80, 60],
    ['n', 160, 60],
    ['r', 160, 60, 270, 60, 'R3'],
    ['w', 270, 60, 310, 60],
    ['r', 310, 60, 310, 200, 'R4'],
    ['w', 40, 200, 310, 200],
  ],
}

export type FigId = keyof typeof FIGS

/** Figura de la guía con datos y, si hay, la resolución paso a paso. */
export function Guia({ fig, data, steps = [], caption }: { fig: FigId; data?: string; steps?: string[]; caption?: string }) {
  const [shown, setShown] = useState(0)
  return (
    <Frame
      caption={caption}
      controls={
        steps.length > 0 && (
          <>
            <Toggle on={false} onClick={() => setShown(0)}>
              de nuevo
            </Toggle>
            <Toggle on={shown < steps.length} onClick={() => (sfx.page(), setShown(Math.min(steps.length, shown + 1)))}>
              {shown === 0 ? 'resolver paso a paso' : 'siguiente paso'}
            </Toggle>
          </>
        )
      }
    >
      <div className={`grid items-center gap-3 ${steps.length ? 'sm:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]' : ''}`}>
        <div className="min-w-0">
          <CircuitFig els={FIGS[fig]} />
          {data && <p className="mt-1 text-center font-mono text-xs text-ink-soft">{data}</p>}
        </div>
        {steps.length > 0 && (
          <ol className="min-w-0 space-y-1.5 font-mono text-[13px] leading-snug break-words">
            {steps.slice(0, shown).map((s, i) => (
              <motion.li key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} className={i === steps.length - 1 ? 'font-bold text-terracotta' : ''}>
                {s}
              </motion.li>
            ))}
          </ol>
        )}
      </div>
    </Frame>
  )
}
