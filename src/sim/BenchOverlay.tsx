// La capa 2D sobre el banco: visor del tester, etiqueta de la pieza elegida y avisos.

import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'
import { holeName } from '../engine/board'
import { BAND_COLORS, E12, GOLD, colorBands, formatSI } from '../engine/circuit'
import { simulate } from '../engine/netlist'
import { flexEnds, isRigid, rigidPins, type LedColor, type MeterMode, type Part } from '../engine/types'
import { useBench } from './benchStore'
import { MODE_LABEL, MODE_NAME, meterDisplay, partName, warningText } from './format'
import { useView } from './viewStore'

/** 'repair': como 'values', más el botón de cambiar resistores y cables por nuevos. */
export type EditLevel = 'full' | 'values' | 'repair' | 'none'

const R_VALUES = [1, 10, 100, 1000, 10000, 100000].flatMap((m) => E12.map((v) => (v * m) / 10)).filter((v) => v >= 10 && v <= 1e6)
const LED_NAMES: Record<LedColor, string> = { red: 'rojo', yellow: 'amarillo', green: 'verde', blue: 'azul' }

export function BenchOverlay({ edit = 'values', meterPanel = true }: { edit?: EditLevel; meterPanel?: boolean }) {
  return (
    <>
      <Warnings />
      {meterPanel && <MeterPanel />}
      <Inspector edit={edit} />
      <Toolbar />
    </>
  )
}

function Warnings() {
  const warnings = useBench((s) => s.sim.warnings)
  const parts = useBench((s) => s.parts)
  const shown = warnings.filter((w, i) => warnings.findIndex((x) => x.kind === w.kind && x.partId === w.partId) === i)
  return (
    <div className="pointer-events-none absolute top-3 left-1/2 z-20 flex w-[min(560px,70%)] -translate-x-1/2 flex-col gap-2">
      <AnimatePresence>
        {shown.map((w) => (
          <motion.div
            key={w.kind + w.partId}
            initial={{ opacity: 0, y: -12, rotate: -1 }}
            animate={{ opacity: 1, y: 0, rotate: -0.5 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ type: 'spring', stiffness: 160, damping: 20 }}
            className="rounded-xl border-2 border-terracotta/40 bg-rose-soft px-4 py-2 text-sm font-bold text-ink shadow-[var(--shadow-paper)]"
            role="alert"
          >
            {warningText(w, parts)}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

function MeterPanel() {
  const meter = useBench((s) => s.parts.find((p) => p.kind === 'meter'))
  const reading = useBench((s) => s.sim.meter)
  if (!meter || meter.kind !== 'meter') return null
  const disp = meterDisplay(reading)
  const where = (e: { hole: { r: number; c: number } | null }) => (e.hole ? holeName(e.hole) : 'suelta')
  return (
    <div className="paper absolute top-3 right-3 z-10 w-56 rounded-2xl p-3 short:top-2 short:right-2 short:w-48 short:p-2" aria-label="Tester">
      <div className="mb-1 flex items-center justify-between">
        <span className="font-display text-sm font-bold">Tester</span>
        <span className="chip bg-paper-2 text-ink-soft">{MODE_NAME[meter.mode]}</span>
      </div>
      <div className="lcd mb-2 flex h-14 short:h-10 items-baseline justify-end gap-2 rounded-lg px-3 pt-2" aria-live="polite">
        <span className="text-3xl">{disp.main || '—'}</span>
        <span className="w-9 text-sm">{disp.unit}</span>
      </div>
      <div className="grid grid-cols-4 gap-1">
        {(['off', 'V', 'A', 'ohm'] as MeterMode[]).map((m) => (
          <button
            key={m}
            onClick={() => useBench.getState().setMode(m)}
            className={`rounded-lg py-1 font-mono text-sm font-bold transition ${meter.mode === m ? 'bg-amber text-ink' : 'bg-paper-2 text-ink-soft hover:bg-kraft/60'}`}
            aria-pressed={meter.mode === m}
          >
            {MODE_LABEL[m]}
          </button>
        ))}
      </div>
      <div className="mt-2 space-y-0.5 text-xs text-ink-soft">
        <div>
          <span className="mr-1 inline-block h-2 w-2 rounded-full bg-terracotta" />
          punta roja: <b className="text-ink">{where(meter.red)}</b>
        </div>
        <div>
          <span className="mr-1 inline-block h-2 w-2 rounded-full bg-ink" />
          punta negra: <b className="text-ink">{where(meter.black)}</b>
        </div>
      </div>
    </div>
  )
}

export function Bands({ ohms, size = 'md' }: { ohms: number; size?: 'md' | 'lg' }) {
  const [a, b, m] = colorBands(ohms)
  const cols = [BAND_COLORS[a], BAND_COLORS[b], BAND_COLORS[m], GOLD]
  const big = size === 'lg'
  return (
    <div className={`relative flex items-center ${big ? 'h-16' : 'h-7'}`} aria-label={`Bandas: ${cols.map((c) => c.name).join(', ')}`}>
      <div className={`absolute inset-x-0 top-1/2 -translate-y-1/2 bg-[#b9b2a8] ${big ? 'h-1.5' : 'h-0.5'}`} />
      <div className={`relative mx-auto flex items-stretch rounded-full bg-[#e3c99a] ${big ? 'h-16 w-56 gap-4 px-7' : 'h-7 w-24 gap-1.5 px-3'}`}>
        {cols.map((c, i) => (
          <div key={i} className={`${big ? 'w-5' : 'w-2'} ${i === 3 ? (big ? 'ml-6' : 'ml-2') : ''}`} style={{ background: c.hex }} title={c.name} />
        ))}
      </div>
    </div>
  )
}

function pinsText(p: Part) {
  if (isRigid(p)) {
    const pins = rigidPins(p)
    return pins ? `patas en ${pins.map(holeName).join(' y ')}` : 'suelto, sin enchufar'
  }
  return flexEnds(p)
    .map(([pin, e]) => `${pin === 'plus' ? '+' : pin === 'minus' ? '−' : pin}: ${e.hole ? holeName(e.hole) : 'suelto'}`)
    .join(' · ')
}

function Inspector({ edit }: { edit: EditLevel }) {
  const p = useBench((s) => s.parts.find((q) => q.id === s.selected))
  const current = useBench((s) => (p ? (s.sim.partI[p.id] ?? 0) : 0))
  const heat = useBench((s) => (p ? (s.sim.heat[p.id] ?? 0) : 0))
  const [replaced, setReplaced] = useState<string | null>(null)
  const st = useBench.getState()
  const show = p && p.kind !== 'meter'
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key={p.id}
          initial={{ opacity: 0, y: 16, rotate: 1.5 }}
          animate={{ opacity: 1, y: 0, rotate: 0.5 }}
          exit={{ opacity: 0, y: 12 }}
          transition={{ type: 'spring', stiffness: 170, damping: 22 }}
          className="kraft absolute bottom-3 left-3 z-10 w-64 rounded-xl p-3 shadow-[var(--shadow-lift)]"
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="font-display text-base font-bold">{partName(p)}</div>
              <div className="text-xs text-ink-soft">{pinsText(p)}</div>
            </div>
            <button className="text-ink-soft hover:text-ink" onClick={() => st.select(null)} aria-label="Cerrar">
              ✕
            </button>
          </div>

          {p.kind === 'resistor' && (
            <div className="mt-2">
              <Bands ohms={p.ohms} />
              <div className="mt-1 flex items-center justify-between gap-2">
                <span className="font-mono text-lg font-bold">{formatSI(p.ohms, 'Ω')}</span>
                {edit !== 'none' && !p.locked && (
                  <select className="rounded-md bg-paper px-2 py-1 font-mono text-sm" value={p.ohms} onChange={(e) => st.update(p.id, { ohms: Number(e.target.value) })} aria-label="Valor del resistor">
                    {R_VALUES.map((v) => (
                      <option key={v} value={v}>
                        {formatSI(v, 'Ω')}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          )}

          {p.kind === 'led' && (
            <div className="mt-2 space-y-2 text-sm">
              <p className="text-xs">La pata larga (ánodo, +) es la de la izquierda. Si lo ponés al revés, no prende.</p>
              {edit !== 'none' && (
                <div className="flex gap-1">
                  {(Object.keys(LED_NAMES) as LedColor[]).map((c) => (
                    <button key={c} onClick={() => st.update(p.id, { color: c })} className={`chip ${p.color === c ? 'bg-ink text-paper' : 'bg-paper'}`}>
                      {LED_NAMES[c]}
                    </button>
                  ))}
                </div>
              )}
              {p.burned && <ReplaceLed id={p.id} />}
            </div>
          )}

          {p.kind === 'source' && (
            <div className="mt-2 space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="font-mono text-lg font-bold">{formatSI(p.volts, 'V')}</span>
                <button className={`chip ${p.on ? 'bg-sage text-paper' : 'bg-paper text-ink-soft'}`} onClick={() => st.update(p.id, { on: !p.on })}>
                  {p.on ? 'encendida' : 'apagada'}
                </button>
              </div>
              {edit !== 'none' && !p.locked && (
                <input
                  type="range"
                  className="w-full"
                  min={p.style === 'battery' ? 1.5 : 0}
                  max={p.style === 'battery' ? 9 : 20}
                  step={p.style === 'battery' ? 1.5 : 0.5}
                  value={p.volts}
                  onChange={(e) => st.update(p.id, { volts: Number(e.target.value) })}
                  aria-label="Tensión"
                />
              )}
            </div>
          )}

          {p.kind === 'resistor' && (
            <div className="mt-1 text-xs text-ink-soft">
              disipa <b className={`font-mono ${heat > 1 ? 'text-terracotta' : 'text-ink'}`}>{formatSI(current * current * p.ohms, 'W')}</b> · aguanta {p.watts ? formatSI(p.watts, 'W') : '¼ W'}
            </div>
          )}

          {edit === 'repair' && (p.kind === 'resistor' || p.kind === 'wire') && (
            <button
              className="btn btn-soft mt-2 w-full py-1 text-sm"
              onClick={() => {
                st.update(p.id, { broken: false })
                setReplaced(p.id)
              }}
            >
              {replaced === p.id ? 'Cambiado por uno nuevo' : 'Cambiar por uno nuevo'}
            </button>
          )}

          <div className="mt-2 flex items-center justify-between gap-2">
            <span className="text-xs text-ink-soft">
              corriente: <b className="font-mono text-ink">{formatSI(Math.abs(current) < 1e-7 ? 0 : Math.abs(current), 'A')}</b>
            </span>
            <div className="flex gap-1">
              {isRigid(p) && edit !== 'none' && !p.locked && (
                <button className="btn btn-soft px-2 py-1 text-xs" onClick={() => st.rotate(p.id)}>
                  Girar
                </button>
              )}
              {edit === 'full' && (
                <button className="btn btn-soft px-2 py-1 text-xs" onClick={() => st.remove(p.id)}>
                  Sacar
                </button>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/** Antes de cambiar un LED quemado, avisamos si el nuevo se quemaría igual. */
function ReplaceLed({ id }: { id: string }) {
  const parts = useBench((s) => s.parts)
  const trial = simulate(parts.map((q) => (q.id === id && q.kind === 'led' ? { ...q, burned: false } : q)))
  const wouldBurn = trial.burned.includes(id)
  return (
    <div className="space-y-1.5">
      {wouldBurn && (
        <p className="rounded-md bg-rose-soft p-2 text-xs font-bold">
          Ojo: así como está, al nuevo le pasarían {formatSI(trial.partI[id] ?? 0, 'A')} y se quemaría igual. Primero subí el resistor (o poné uno en serie).
        </p>
      )}
      <button className="btn btn-soft w-full py-1 text-sm" onClick={() => useBench.getState().update(id, { burned: false })}>
        {wouldBurn ? 'Cambiarlo igual' : 'Cambiar por uno nuevo'}
      </button>
    </div>
  )
}

function Toolbar() {
  const electrons = useView((s) => s.electrons)
  return (
    <div className="pointer-events-none absolute right-3 bottom-3 z-10 flex items-end gap-2">
      <div className="pointer-events-auto rounded-lg bg-night/70 px-2 py-1 text-[11px] text-paper/80 short:hidden">arrastrá piezas y puntas · arrastrá la mesa: girar · clic derecho: desplazar · rueda: zoom</div>
      <button
        className={`pointer-events-auto chip shadow ${electrons ? 'bg-sky text-paper' : 'bg-paper text-ink-soft'}`}
        onClick={() => useView.getState().toggleElectrons()}
        aria-pressed={electrons}
      >
        electrones {electrons ? 'visibles' : 'ocultos'}
      </button>
    </div>
  )
}
