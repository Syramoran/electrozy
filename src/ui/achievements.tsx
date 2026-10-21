// Medallas, el cartelito de "logro desbloqueado" y la página con todos los logros.

import { AnimatePresence, motion } from 'framer-motion'
import { useEffect } from 'react'
import { ACHIEVEMENTS, type Achievement, type Glyph } from '../content/achievements'
import { LESSONS } from '../content/lessons'
import { sfx } from '../lib/sound'
import { useProgress } from '../store/progress'
import { useToasts } from '../store/toasts'
import { TopBar } from './chrome'

const GLYPHS: Record<Glyph, string> = {
  flame: 'M12 3c1 4 5 5 5 10a5 5 0 0 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-3-1-5 1-9z',
  bolt: 'M13 2 5 13h6l-1 9 8-12h-6l1-8z',
  star: 'M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.6 6.6 19.5l1.2-6L3.3 9.3l6.1-.7z',
  check: 'M5 12.5l4.5 4.5L19 7.5',
  cat: 'M6 20c-1-3 0-7 2-9V5l3 3h2l3-3v6c2 2 3 6 2 9z',
  cup: 'M6 9h11v4a5 5 0 0 1-5 5h-1a5 5 0 0 1-5-5zM17 10h1.5a2 2 0 0 1 0 4H17M12 3v5',
  moon: 'M15 3a8 8 0 1 0 6 12A7 7 0 0 1 15 3z',
  hand: 'M8 13V6a1.5 1.5 0 0 1 3 0v5V4a1.5 1.5 0 0 1 3 0v7V6a1.5 1.5 0 0 1 3 0v8a6 6 0 0 1-6 6h-1a5 5 0 0 1-4-2l-3-4a1.5 1.5 0 0 1 2.3-2z',
  book: 'M4 5c3-1 6-1 8 1 2-2 5-2 8-1v13c-3-1-6-1-8 1-2-2-5-2-8-1z M12 6v13',
  mute: 'M4 9h4l5-4v14l-5-4H4z M16 9l5 6 M21 9l-5 6',
  flag: 'M5 21V4 M5 4h11l-2 4 2 4H5',
  wrench: 'M14 6a4 4 0 0 0 5 5l-9 9a2 2 0 0 1-3-3l9-9a4 4 0 0 1 4-5l-3 3 1 2 2 1z',
}

const STROKED: Glyph[] = ['check', 'cup', 'book', 'mute', 'flag']

export function Medal({ a, locked = false, size = 56 }: { a: Achievement; locked?: boolean; size?: number }) {
  const stroked = STROKED.includes(a.glyph)
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden>
      <path d="M22 4 L32 18 L42 4" fill="none" stroke={locked ? '#c9bca3' : a.color} strokeWidth="6" strokeLinecap="round" opacity=".7" />
      <circle cx="32" cy="38" r="22" fill={locked ? '#ddd1ba' : a.color} />
      <circle cx="32" cy="38" r="17" fill="none" stroke="#f7f0e2" strokeOpacity=".55" strokeWidth="2" strokeDasharray="3 3" />
      <g transform="translate(20 26)">
        <path d={GLYPHS[a.glyph]} fill={stroked || locked ? 'none' : '#f7f0e2'} stroke="#f7f0e2" strokeWidth={stroked || locked ? 2 : 0.8} strokeLinecap="round" strokeLinejoin="round" opacity={locked ? 0.7 : 1} />
      </g>
    </svg>
  )
}

/** Cartelito que aparece cuando se desbloquea un logro. */
export function AchievementToasts() {
  const queue = useToasts((s) => s.queue)
  const current = ACHIEVEMENTS.find((a) => a.id === queue[0])
  useEffect(() => {
    if (!current) return
    sfx.reward()
    const t = setTimeout(() => useToasts.getState().pop(), 4200)
    return () => clearTimeout(t)
  }, [current])
  return (
    <div className="pointer-events-none fixed top-14 left-1/2 z-[90] -translate-x-1/2">
      <AnimatePresence>
        {current && (
          <motion.button
            key={current.id}
            initial={{ y: -40, opacity: 0, rotate: -3 }}
            animate={{ y: 0, opacity: 1, rotate: -1 }}
            exit={{ y: -30, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 160, damping: 16 }}
            onClick={() => useToasts.getState().pop()}
            className="postit pointer-events-auto flex items-center gap-3 rounded-lg py-2 pr-5 pl-2 text-left"
            role="status"
          >
            <Medal a={current} size={52} />
            <div>
              <div className="text-[11px] font-bold tracking-wider text-ink-soft uppercase">¡Logro desbloqueado!</div>
              <div className="font-display text-lg leading-tight font-black">{current.title}</div>
              <div className="max-w-64 text-xs text-ink-soft">{current.desc}</div>
            </div>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  )
}

export function AchievementsPage() {
  const stats = useProgress((s) => s.stats)
  const unlocked = useProgress((s) => s.achievements)
  const lessons = useProgress((s) => s.lessons)
  const streak = useProgress((s) => s.streak)
  const ctx = { stats, lessonsDone: Object.values(lessons).filter((l) => l.done).length, totalLessons: LESSONS.length, streak: streak.days }
  const count = Object.keys(unlocked).length
  return (
    <div className="flex h-full flex-col">
      <TopBar title={`Logros · ${count}/${ACHIEVEMENTS.length}`} />
      <div className="desk min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="mx-auto grid max-w-5xl grid-cols-[repeat(auto-fill,minmax(230px,1fr))] gap-3">
          {ACHIEVEMENTS.map((a, i) => {
            const got = !!unlocked[a.id]
            const hidden = a.secret && !got
            const [cur, goal] = a.progress(ctx)
            return (
              <motion.div
                key={a.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.02 }}
                className={`paper flex gap-3 rounded-xl p-3 ${got ? '' : 'opacity-80'}`}
                style={{ rotate: `${(((i * 37) % 5) - 2) * 0.3}deg` }}
              >
                <div className="shrink-0">
                  <Medal a={a} locked={!got} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-display text-base leading-tight font-bold">{hidden ? '???' : a.title}</div>
                  <div className="mt-0.5 text-xs text-ink-soft">{hidden ? 'Logro secreto: seguí explorando el taller.' : a.desc}</div>
                  {got ? (
                    <div className="mt-1 text-[11px] font-bold text-sage">conseguido el {unlocked[a.id].split('-').reverse().join('/')}</div>
                  ) : (
                    !hidden &&
                    goal > 1 && (
                      <div className="mt-1.5 flex items-center gap-2">
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-paper-2">
                          <div className="h-full rounded-full bg-amber" style={{ width: `${Math.min(100, (cur / goal) * 100)}%` }} />
                        </div>
                        <span className="font-mono text-[10px] text-ink-soft">
                          {Math.min(cur, goal)}/{goal}
                        </span>
                      </div>
                    )
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
