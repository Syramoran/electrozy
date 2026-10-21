// Repaso mezclado: ejercicios de todas las lecciones, con más peso en lo que más falla.

import { useMemo, useState } from 'react'
import { LESSONS } from '../content/lessons'
import { Practice, type PoolItem } from '../lesson/Practice'
import { LessonHeader, LessonShell } from '../lesson/Shell'
import { go } from '../lib/router'
import { makeRng } from '../lib/rng'
import { sfx } from '../lib/sound'
import { useProgress } from '../store/progress'

export function Review() {
  const weak = useProgress((s) => s.weak)
  const [run, setRun] = useState(0)
  const [result, setResult] = useState<number | null>(null)
  const pool = useMemo<PoolItem[]>(() => {
    const items: PoolItem[] = []
    for (const l of LESSONS)
      for (const gen of l.practice) {
        const topic = gen(makeRng(1)).topic
        const copies = 1 + Math.min(3, Math.round((weak[topic] ?? 0) * 1.5))
        for (let k = 0; k < copies; k++) items.push({ gen, lessonId: l.id })
      }
    return items
    // El pool se arma una vez por vuelta para que no cambie a mitad de camino.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [run])

  if (result !== null)
    return (
      <LessonShell
        header={<LessonHeader title="Repaso mezclado" progress={1} />}
        left={
          <div className="flex flex-col gap-4">
            <h1 className="font-display text-3xl font-black">Repaso terminado</h1>
            <p>
              Acertaste <b>{Math.round(result * 100)}%</b> al primer intento.
            </p>
            <div className="flex flex-wrap gap-2">
              <button className="btn btn-primary" onClick={() => (setResult(null), setRun(run + 1))}>
                Otra vuelta
              </button>
              <button className="btn btn-soft" onClick={() => go('/')}>
                Volver al taller
              </button>
            </div>
          </div>
        }
        right={<div className="desk h-full" />}
      />
    )

  return (
    <Practice
      key={run}
      pool={pool}
      count={10}
      onFinish={(acc) => (sfx.reward(), useProgress.getState().touchDay(), useProgress.getState().bump('reviews'), setResult(acc))}
      render={({ left, right, progress }) => <LessonShell header={<LessonHeader title="Repaso mezclado" progress={progress} />} left={left} right={right} />}
    />
  )
}
