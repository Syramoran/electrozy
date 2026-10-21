import { motion } from 'framer-motion'
import type { ReactNode } from 'react'
import { go } from '../lib/router'
import { MuteButton } from '../ui/chrome'

/** Barra superior con el "hilo" de progreso cosido. */
export function LessonHeader({ title, progress, onClose }: { title: string; progress: number; onClose?: () => void }) {
  return (
    <header className="relative z-30 flex h-12 shrink-0 items-center gap-3 bg-wood-dark px-3 text-paper shadow-md">
      <button className="chip bg-paper/15 px-3 py-1 text-paper hover:bg-paper/25" onClick={onClose ?? (() => go('/'))} aria-label="Volver al taller">
        ← taller
      </button>
      <div className="hidden max-w-[30%] truncate font-display text-base font-bold sm:block">{title}</div>
      <div className="relative h-3 flex-1 rounded-full bg-paper/15" role="progressbar" aria-valuenow={Math.round(progress * 100)} aria-valuemin={0} aria-valuemax={100}>
        <motion.div className="absolute inset-y-0 left-0 rounded-full bg-amber" animate={{ width: `${Math.max(3, progress * 100)}%` }} transition={{ type: 'spring', stiffness: 60, damping: 18 }} />
        <div className="absolute inset-x-2 top-1/2 h-0 -translate-y-1/2 border-t-2 border-dashed border-paper/40" />
      </div>
      <MuteButton />
    </header>
  )
}

export function LessonShell({ header, left, right }: { header: ReactNode; left: ReactNode; right: ReactNode }) {
  return (
    <div className="flex h-full flex-col">
      {header}
      <div className="flex min-h-0 flex-1">
        <aside className="notebook relative z-10 flex w-[38%] max-w-[540px] min-w-[280px] flex-col overflow-y-auto py-5 pr-5 pl-16 short:py-3 sm:py-7">
          {left}
        </aside>
        <main className="relative min-w-0 flex-1">{right}</main>
      </div>
    </div>
  )
}
