// Práctica estilo "una tras otra": lo que sale mal vuelve al final de la fila con otros números.

import { useMemo, useRef, useState, type ReactNode } from 'react'
import type { Exercise, ExerciseGen } from '../content/types'
import { makeRng, shuffle } from '../lib/rng'
import { useProgress } from '../store/progress'
import { ExerciseView } from './ExerciseView'

export type PoolItem = { gen: ExerciseGen; lessonId: string }
type Item = { key: number; pool: PoolItem; ex: Exercise; retries: number }

const seed = () => Math.floor(Math.random() * 2 ** 31)

export function usePracticeQueue(pool: PoolItem[], count: number) {
  const nextKey = useRef(0)
  const make = (p: PoolItem, retries = 0): Item => ({ key: nextKey.current++, pool: p, ex: p.gen(makeRng(seed())), retries })
  const initial = useMemo(() => {
    const rng = makeRng(seed())
    const picked: PoolItem[] = []
    while (picked.length < count) picked.push(...shuffle(rng, pool))
    return picked.slice(0, count).map((p) => make(p))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pool, count])
  return { initial, make }
}

export function Practice({
  pool,
  count,
  onFinish,
  render,
}: {
  pool: PoolItem[]
  count: number
  onFinish: (accuracy: number) => void
  render: (args: { left: ReactNode; right: ReactNode; progress: number }) => ReactNode
}) {
  const { initial, make } = usePracticeQueue(pool, count)
  const [queue, setQueue] = useState(initial)
  const [idx, setIdx] = useState(0)
  const [firstTry, setFirstTry] = useState(0)
  const mark = useProgress((s) => s.mark)
  const item = queue[idx]

  const done = (ok: boolean) => {
    mark(item.ex.topic, ok)
    useProgress.getState().bump(ok ? 'right' : 'wrong')
    const nextFirst = firstTry + (ok && item.retries === 0 ? 1 : 0)
    setFirstTry(nextFirst)
    let q = queue
    if (!ok && item.retries < 2) {
      q = [...queue, make(item.pool, item.retries + 1)]
      setQueue(q)
    }
    if (idx + 1 >= q.length) onFinish(nextFirst / initial.length)
    else setIdx(idx + 1)
  }

  if (!item) return null
  return <ExerciseView key={item.key} ex={item.ex} onDone={done} layout={(left, right) => render({ left, right, progress: idx / queue.length })} />
}
