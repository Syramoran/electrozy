// El taller: la mesa 3D de fondo y el cuaderno de encargos. Todo desbloqueado.

import { motion } from 'framer-motion'
import { useEffect } from 'react'
import { ACHIEVEMENTS } from '../content/achievements'
import { LESSONS } from '../content/lessons'
import { useDecor } from '../content/rewards'
import { go } from '../lib/router'
import { sfx } from '../lib/sound'
import { useBench } from '../sim/benchStore'
import { Bench } from '../sim/three/Bench'
import { useProgress } from '../store/progress'
import { Logo, MuteButton } from '../ui/chrome'
import { sampleScene } from './Playground'

const TINTS = ['#f6dd84', '#dbe7d2', '#dbe6f0', '#f3d9cf', '#efe4cf', '#f6dd84', '#dbe7d2', '#dbe6f0', '#f3d9cf']

export function Home() {
  const decor = useDecor()
  const lessons = useProgress((s) => s.lessons)
  const streak = useProgress((s) => s.streak)
  const weak = useProgress((s) => s.weak)
  const doneCount = LESSONS.filter((l) => lessons[l.id]?.done).length
  const achCount = Object.keys(useProgress((s) => s.achievements)).length
  const weakTopics = Object.entries(weak).filter(([, w]) => w >= 1).length

  useEffect(() => {
    useBench.getState().load(sampleScene())
  }, [])

  return (
    <div className="relative h-full">
      <div className="absolute inset-0">
        <Bench interactive={false} autoRotate decor={decor} fit={22} target={[-3.5, 0, -1]} />
      </div>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-night/70 via-night/15 to-transparent" />

      <div className="relative z-10 flex h-full gap-4 p-4 sm:p-6">
        <motion.section
          initial={{ x: -30, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 70, damping: 16 }}
          className="notebook flex w-[min(470px,58%)] flex-col overflow-hidden rounded-r-2xl rounded-l-md"
        >
          <div className="pt-5 pr-5 pb-2 pl-16">
            <Logo className="text-4xl text-ink" />
            <p className="text-sm text-ink-soft">Electrónica desde cero, en tu propio taller. Unidad 1: circuitos eléctricos.</p>
          </div>
          <div className="flex-1 space-y-3 overflow-y-auto pt-2 pr-5 pb-5 pl-16">
            {LESSONS.map((l, i) => {
              const p = lessons[l.id]
              return (
                <motion.div
                  key={l.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + i * 0.06 }}
                  className="relative rounded-lg p-3 shadow-[var(--shadow-paper)]"
                  style={{ background: TINTS[i % TINTS.length], rotate: `${i % 2 ? 0.6 : -0.5}deg` }}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-paper font-display text-lg font-black">{l.n}</div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h2 className="font-display text-lg leading-tight font-bold">{l.title}</h2>
                        {p?.done && <span className="chip bg-sage text-paper">hecho</span>}
                      </div>
                      <p className="text-xs text-ink-soft">para {l.client.name}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        <button className="btn btn-primary px-3 py-1 text-sm" onClick={() => (sfx.page(), go(`/leccion/${l.id}`))}>
                          {p?.done ? 'Repasar' : 'Empezar'}
                        </button>
                        <span className="text-[11px] text-ink-soft">o desde:</span>
                        {l.steps.map((s, k) => (
                          <button key={k} title={s.title} className="h-6 w-6 rounded-full bg-paper/80 font-mono text-[11px] font-bold hover:bg-paper" onClick={() => (sfx.page(), go(`/leccion/${l.id}/${k}`))}>
                            {k + 1}
                          </button>
                        ))}
                        <button title="Práctica" className="h-6 rounded-full bg-paper/80 px-2 text-[11px] font-bold hover:bg-paper" onClick={() => (sfx.page(), go(`/leccion/${l.id}/${l.steps.length}`))}>
                          práctica
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </motion.section>

        <div className="ml-auto flex flex-col items-end gap-3">
          <MuteButton />
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="postit w-56 rotate-2 rounded-md p-3 text-sm">
            <div className="font-display text-base font-bold">Tu taller</div>
            <div>
              Encargos hechos: <b>{doneCount}/{LESSONS.length}</b>
            </div>
            {streak.days > 0 && (
              <div>
                Días seguidos: <b>{streak.days}</b>
              </div>
            )}
            <div className="mt-1 text-xs text-ink-soft">Cada encargo suma algo nuevo al escritorio.</div>
            <button className="mt-2 w-full rounded-md bg-paper/80 py-1 text-xs font-bold hover:bg-paper" onClick={() => (sfx.page(), go('/logros'))}>
              Logros: {achCount}/{ACHIEVEMENTS.length}
            </button>
          </motion.div>
          <div className="mt-auto flex flex-col items-end gap-2">
            <button className="btn btn-soft shadow-lg" onClick={() => (sfx.page(), go('/repaso'))}>
              Repaso mezclado{weakTopics ? ` · ${weakTopics} tema${weakTopics > 1 ? 's' : ''} para reforzar` : ''}
            </button>
            <button className="chip bg-paper/85 text-ink shadow" onClick={() => go('/trailer')}>
              ver tráiler
            </button>
            <button className="btn btn-primary shadow-lg" onClick={() => (sfx.page(), go('/taller'))}>
              Mesa libre
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
