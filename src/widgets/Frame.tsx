import type { ReactNode } from 'react'

/** Tarjeta de papel "pegada" sobre la mesa donde viven los gráficos 2D. */
export function Frame({ caption, children, controls }: { caption?: string; children: ReactNode; controls?: ReactNode }) {
  return (
    <div className="flex h-full w-full items-center justify-center p-3 sm:p-6">
      <div className="paper relative flex max-h-full w-full max-w-[760px] flex-col rounded-2xl p-3 sm:p-5" style={{ rotate: '-0.4deg' }}>
        <div className="tape -top-2 left-1/2 -translate-x-1/2 rotate-2" />
        <div className="min-h-0 flex-1">{children}</div>
        {controls && <div className="mt-2 flex flex-wrap items-center justify-center gap-2 sm:mt-3">{controls}</div>}
        {caption && <div className="mt-2 text-center font-display text-sm text-ink-soft italic">{caption}</div>}
      </div>
    </div>
  )
}

export function Toggle({ on, onClick, children }: { on: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button onClick={onClick} aria-pressed={on} className={`chip px-3 py-1.5 text-sm transition ${on ? 'bg-ink text-paper' : 'bg-paper-2 text-ink hover:bg-kraft/60'}`}>
      {children}
    </button>
  )
}

export function Slider({ label, value, min, max, step = 1, onChange, show }: { label: string; value: number; min: number; max: number; step?: number; onChange: (v: number) => void; show?: string }) {
  return (
    <label className="flex min-w-[180px] flex-1 items-center gap-2 text-sm font-bold">
      <span className="whitespace-nowrap">{label}</span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="flex-1" />
      {show && <span className="w-20 text-right font-mono whitespace-nowrap">{show}</span>}
    </label>
  )
}

export const C = {
  ink: '#3a2a1f',
  soft: '#6b5646',
  paper: '#f7f0e2',
  paper2: '#efe4cf',
  kraft: '#d9bf98',
  amber: '#e0913c',
  terracotta: '#c8664d',
  sage: '#6f9a68',
  sky: '#6f98c0',
  electron: '#4f8fd0',
  copper: '#d28a52',
  mustard: '#e1b54f',
  postit: '#f6dd84',
}
