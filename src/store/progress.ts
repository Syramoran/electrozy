// Progreso del alumno en localStorage: encargos hechos, temas flojos, racha y sonido.

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { ACHIEVEMENTS, isUnlocked } from '../content/achievements'
import { LESSON_COUNT } from '../content/lessonCount'
import { setMuted } from '../lib/sound'
import { useToasts } from './toasts'

export type LessonProgress = { done: boolean; best: number; runs: number; lastAt: string }

type Progress = {
  lessons: Record<string, LessonProgress>
  /** Peso por tema: sube con cada error, baja con cada acierto. El repaso elige por acá. */
  weak: Record<string, number>
  muted: boolean
  streak: { last: string; days: number }
  /** Contadores para los logros (LEDs quemados, encastres, etc.). */
  stats: Record<string, number>
  /** Logros desbloqueados: id → fecha. */
  achievements: Record<string, string>
  bump: (stat: string, n?: number) => void
  checkAchievements: () => void
  completeLesson: (id: string, accuracy: number) => void
  mark: (topic: string, ok: boolean) => void
  toggleMute: () => void
  touchDay: () => void
  reset: () => void
}

const today = () => new Date().toISOString().slice(0, 10)

/** Durante el tráiler nada suma al progreso real del alumno. */
let frozen = false
export const freezeProgress = (v: boolean) => {
  frozen = v
}

export const useProgress = create<Progress>()(
  persist(
    (set, get) => ({
      lessons: {},
      weak: {},
      muted: false,
      streak: { last: '', days: 0 },
      stats: {},
      achievements: {},

      bump: (stat, n = 1) => {
        if (frozen) return
        set({ stats: { ...get().stats, [stat]: (get().stats[stat] ?? 0) + n } })
        get().checkAchievements()
      },

      checkAchievements: () => {
        const { stats, lessons, streak, achievements } = get()
        const ctx = { stats, lessonsDone: Object.values(lessons).filter((l) => l.done).length, totalLessons: LESSON_COUNT, streak: streak.days }
        const fresh = ACHIEVEMENTS.filter((a) => !achievements[a.id] && isUnlocked(a, ctx)).map((a) => a.id)
        if (!fresh.length) return
        set({ achievements: { ...achievements, ...Object.fromEntries(fresh.map((id) => [id, today()])) } })
        useToasts.getState().push(fresh)
      },

      completeLesson: (id, accuracy) => {
        const prev = get().lessons[id]
        set({
          lessons: {
            ...get().lessons,
            [id]: { done: true, best: Math.max(prev?.best ?? 0, accuracy), runs: (prev?.runs ?? 0) + 1, lastAt: today() },
          },
        })
        if (accuracy >= 1) get().bump('perfect')
        get().touchDay()
        get().checkAchievements()
      },

      mark: (topic, ok) => {
        const w = get().weak[topic] ?? 0
        set({ weak: { ...get().weak, [topic]: Math.max(0, ok ? w - 0.5 : w + 1) } })
      },

      toggleMute: () => {
        const muted = !get().muted
        setMuted(muted)
        set({ muted })
        if (muted) get().bump('muted')
      },

      touchDay: () => {
        const t = today()
        const { last, days } = get().streak
        if (last === t) return
        const y = new Date(Date.now() - 864e5).toISOString().slice(0, 10)
        set({ streak: { last: t, days: last === y ? days + 1 : 1 } })
        get().checkAchievements()
      },

      reset: () => set({ lessons: {}, weak: {}, streak: { last: '', days: 0 }, stats: {}, achievements: {} }),
    }),
    {
      name: 'electrozy-progreso',
      version: 1,
      onRehydrateStorage: () => (s) => s && setMuted(s.muted),
    },
  ),
)
