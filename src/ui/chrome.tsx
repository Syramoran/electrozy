// Piezas de interfaz compartidas: barra superior, sonido, aviso de rotación.

import type { ReactNode } from 'react'
import { go } from '../lib/router'
import { sfx } from '../lib/sound'
import { useProgress } from '../store/progress'

export function MuteButton({ className = '' }: { className?: string }) {
  const muted = useProgress((s) => s.muted)
  return (
    <button
      className={`chip bg-paper/90 text-ink shadow ${className}`}
      onClick={() => {
        useProgress.getState().toggleMute()
        if (muted) sfx.click()
      }}
      aria-pressed={!muted}
      aria-label={muted ? 'Activar sonido' : 'Silenciar'}
    >
      <SpeakerIcon off={muted} /> {muted ? 'sin sonido' : 'sonido'}
    </button>
  )
}

function SpeakerIcon({ off }: { off: boolean }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" className="-mt-0.5 mr-1 inline" aria-hidden>
      <path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor" />
      {off ? (
        <path d="M17 9l5 6M22 9l-5 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      ) : (
        <path d="M16.5 8.5a5 5 0 010 7M19 6a8.5 8.5 0 010 12" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
      )}
    </svg>
  )
}

export function TopBar({ title, children }: { title: ReactNode; children?: ReactNode }) {
  return (
    <header className="relative z-30 flex h-12 shrink-0 items-center gap-3 bg-wood-dark px-3 text-paper shadow-md">
      <button className="chip bg-paper/15 px-3 py-1 text-paper hover:bg-paper/25" onClick={() => go('/')} aria-label="Volver al taller">
        ← taller
      </button>
      <div className="min-w-0 flex-1 truncate font-display text-lg font-bold">{title}</div>
      {children}
      <MuteButton />
    </header>
  )
}

export function Logo({ className = '' }: { className?: string }) {
  return (
    <span className={`font-display font-black tracking-tight ${className}`}>
      electr<span className="text-amber">o</span>zy
    </span>
  )
}

export function RotateHint() {
  return (
    <div className="rotate-hint fixed inset-0 z-[100] flex-col items-center justify-center gap-4 bg-night p-8 text-center text-paper">
      <svg width="72" height="72" viewBox="0 0 24 24" aria-hidden>
        <rect x="7" y="3" width="10" height="18" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <path d="M3 14a9 9 0 0 0 7 7" fill="none" stroke="#e0913c" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M10 21l0-3m0 3l-3 0" stroke="#e0913c" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
      <Logo className="text-3xl" />
      <p className="max-w-xs text-lg">Girá el teléfono: el taller se ve mejor apaisado.</p>
    </div>
  )
}

/** Créditos al pie de todas las pantallas. */
export function Credits() {
  return (
    <footer className="relative z-40 flex h-7 shrink-0 items-center justify-center gap-x-2 overflow-hidden bg-night px-3 text-center text-[11px] whitespace-nowrap text-paper/75 short:h-6 short:text-[10px]">
      <span>
        Hecho por <b className="text-paper">Syra Moran</b> con <b className="text-paper">Opus 5.5</b>
      </span>
      <span aria-hidden>·</span>
      <span>Facultad Regional Paraná · Universidad Tecnológica Nacional</span>
    </footer>
  )
}
