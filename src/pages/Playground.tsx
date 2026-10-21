// Mesa libre: inventario de piezas + tester, sin consignas.

import { useEffect, useRef } from 'react'
import { battery, bulb, led, meter, resistor, supply, wire } from '../engine/build'
import type { Part } from '../engine/types'
import { useBench } from '../sim/benchStore'
import { BenchOverlay } from '../sim/BenchOverlay'
import { Bench } from '../sim/three/Bench'
import { TopBar } from '../ui/chrome'
import { useDecor } from '../content/rewards'

const WIRE_COLORS = ['#e1b54f', '#6f9a68', '#6f98c0', '#c8664d', '#86609c', '#f2e8d5']

export const sampleScene = (): Part[] => [
  battery('bat', 9, 'T+2', 'T-2'),
  wire('w1', '#c8664d', 'T+4', 'a4'),
  resistor('R1', 330, 'c4', 0),
  led('L1', 'red', 'c8', 0),
  wire('w2', '#2f2a28', 'a10', 'T-10'),
  meter('off', null, null),
]

export function Playground() {
  const count = useRef(0)
  const decor = useDecor()
  useEffect(() => {
    useBench.getState().load(sampleScene())
  }, [])

  const add = (make: (id: string, x: number) => Part) => {
    count.current += 1
    const x = -4 + ((count.current * 1.7) % 9)
    useBench.getState().add(make(`n${count.current}`, x))
  }

  const items: [string, () => void][] = [
    ['Resistor', () => add((id, x) => resistor(id, 1000, null, 0, { free: [x, 3.6] }))],
    ['LED', () => add((id, x) => led(id, 'green', null, 0, { free: [x, 3.6] }))],
    ['Lamparita', () => add((id, x) => bulb(id, 100, null, 0, { free: [x, 3.6] }))],
    ['Cable', () => add((id, x) => wire(id, WIRE_COLORS[count.current % WIRE_COLORS.length], null, null, [x, 3.2]))],
    ['Batería', () => add((id) => battery(id, 9, null, null, [-6.6, 3]))],
    ['Fuente', () => add((id) => supply(id, 5, null, null, [-7, -3]))],
  ]

  return (
    <div className="flex h-full flex-col">
      <TopBar title="Mesa libre">
        <button className="chip bg-paper/15 text-paper hover:bg-paper/25" onClick={() => useBench.getState().load(sampleScene())}>
          ejemplo
        </button>
        <button className="chip bg-paper/15 text-paper hover:bg-paper/25" onClick={() => useBench.getState().load([meter('off', null, null)])}>
          vaciar mesa
        </button>
      </TopBar>
      <div className="relative min-h-0 flex-1">
        <Bench decor={decor} fit={19}>
          <BenchOverlay edit="full" />
          <div className="postit absolute top-3 left-3 z-10 w-44 -rotate-1 rounded-md p-3">
            <div className="mb-2 font-display text-sm font-bold">Cajón de piezas</div>
            <div className="grid grid-cols-2 gap-1.5">
              {items.map(([name, fn]) => (
                <button key={name} className="rounded-md bg-paper/80 px-2 py-1 text-xs font-bold hover:bg-paper" onClick={fn}>
                  + {name}
                </button>
              ))}
            </div>
            <p className="mt-2 text-[11px] leading-snug text-ink-soft">Las piezas nuevas aparecen adelante de la protoboard. Arrastralas a los agujeros.</p>
          </div>
        </Bench>
      </div>
    </div>
  )
}
