// Un ejercicio: consigna a la izquierda (cuaderno), visual a la derecha (mesa).

import { AnimatePresence, Reorder, motion } from 'framer-motion'
import { useMemo, useState, type ReactNode } from 'react'
import type { Exercise } from '../content/types'
import { approxEqual, parseNum, trimNum } from '../engine/circuit'
import { sfx } from '../lib/sound'
import { useBench } from '../sim/benchStore'
import { useProgress } from '../store/progress'
import { Rich } from '../ui/rich'
import { BenchVisual, VisualPane } from './VisualPane'

type Verdict = { ok: boolean; msg?: string } | null

export function ExerciseView({ ex, onDone, layout }: { ex: Exercise; onDone: (ok: boolean) => void; layout: (left: ReactNode, right: ReactNode) => ReactNode }) {
  const [verdict, setVerdict] = useState<Verdict>(null)
  const [choice, setChoice] = useState<number | null>(null)
  const [text, setText] = useState('')
  const [order, setOrder] = useState<string[]>(() => (ex.type === 'order' ? scramble(ex.items) : []))
  const [tries, setTries] = useState(0)
  const [gaveUp, setGaveUp] = useState(false)

  const judge = (v: Verdict) => {
    if (!v) return
    setVerdict(v)
    if (v.ok) sfx.ok()
    else sfx.nope()
  }

  const check = () => {
    switch (ex.type) {
      case 'choice':
        if (choice === null) return
        return judge({ ok: choice === ex.answer })
      case 'numeric': {
        const n = parseNum(text)
        if (!Number.isFinite(n)) return
        return judge({ ok: approxEqual(n, ex.answer, ex.tol ?? 0.02) })
      }
      case 'order':
        return judge({ ok: order.every((x, i) => x === ex.items[i]) })
      case 'bench': {
        const { parts, sim } = useBench.getState()
        const r = ex.check(parts, sim)
        setTries((t) => t + 1)
        // En el banco se puede reintentar: solo cuenta como error si se rinde.
        if (r.ok) {
          useProgress.getState().bump('benchOk')
          return judge(r)
        }
        sfx.nope()
        setVerdict({ ok: false, msg: r.msg ?? 'Todavía no. Revisá las conexiones.' })
        return
      }
    }
  }

  const canCheck = ex.type === 'choice' ? choice !== null : ex.type === 'numeric' ? text.trim() !== '' : true
  const finished = verdict?.ok || (verdict && ex.type !== 'bench') || gaveUp
  const correctText =
    ex.type === 'choice' ? ex.options[ex.answer] : ex.type === 'numeric' ? `${trimNum(ex.answer, 4)} ${ex.unit}` : ex.type === 'order' ? ex.items.join(' → ') : ''

  const body = (
    <div className="flex h-full flex-col">
      <div className="mb-1 text-xs font-bold tracking-wider text-ink-soft uppercase">{label(ex)}</div>
      <h2 className="font-display text-xl leading-snug font-bold sm:text-2xl">
        <Rich text={ex.prompt} />
      </h2>

      <div className="mt-4 flex-1">
        {ex.type === 'choice' && (
          <div className="grid gap-2">
            {ex.options.map((o, i) => (
              <motion.button
                key={i}
                whileTap={{ scale: 0.98 }}
                disabled={!!finished}
                onClick={() => (sfx.click(), setChoice(i))}
                className={`rounded-xl border-2 px-4 py-2.5 text-left font-bold transition ${
                  finished && i === ex.answer ? 'border-sage bg-sage-soft' : choice === i ? (finished ? 'border-terracotta bg-rose-soft' : 'border-ink bg-postit') : 'border-transparent bg-paper-2 hover:bg-kraft/50'
                }`}
              >
                <Rich text={o} />
              </motion.button>
            ))}
          </div>
        )}

        {ex.type === 'numeric' && (
          <form
            onSubmit={(e) => {
              e.preventDefault()
              if (!finished) check()
            }}
            className="flex items-center gap-2"
          >
            <input
              autoFocus
              inputMode="decimal"
              value={text}
              disabled={!!finished}
              onChange={(e) => setText(e.target.value)}
              className="w-40 rounded-xl border-2 border-ink/20 bg-paper px-3 py-2 font-mono text-2xl font-bold outline-none focus:border-amber"
              placeholder="0,0"
              aria-label="Tu respuesta"
            />
            <span className="font-mono text-xl font-bold">{ex.unit}</span>
          </form>
        )}

        {ex.type === 'numeric' && ex.hint && !finished && <Hint text={ex.hint} />}

        {ex.type === 'order' && (
          <Reorder.Group axis="y" values={order} onReorder={finished ? () => {} : setOrder} className="grid gap-2">
            {order.map((it, i) => (
              <Reorder.Item key={it} value={it} className={`flex cursor-grab items-center gap-3 rounded-xl px-3 py-2 font-bold shadow-sm active:cursor-grabbing ${finished ? (ex.items[i] === it ? 'bg-sage-soft' : 'bg-rose-soft') : 'bg-paper-2'}`}>
                <span className="font-mono text-ink-soft">{i + 1}</span>
                <span className="flex-1">{it}</span>
                <span className="text-ink-soft" aria-hidden>
                  ⋮⋮
                </span>
              </Reorder.Item>
            ))}
          </Reorder.Group>
        )}

        {ex.type === 'bench' && (
          <div className="space-y-2">
            {ex.hint && tries > 0 && <Hint text={ex.hint} />}
            <p className="text-sm text-ink-soft">Hacelo en la mesa de la derecha y tocá «Comprobar».</p>
          </div>
        )}
      </div>

      <AnimatePresence mode="wait">
        {verdict && (
          <motion.div
            key={`${verdict.ok}${verdict.msg}`}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`mt-4 rounded-xl p-3 text-sm ${verdict.ok ? 'bg-sage-soft' : 'bg-rose-soft'}`}
            role="status"
          >
            <div className="font-display text-lg font-bold">{verdict.ok ? pickPraise() : ex.type === 'bench' ? 'Todavía no…' : 'Casi.'}</div>
            {verdict.msg && <p className="font-bold">{verdict.msg}</p>}
            {!verdict.ok && ex.type !== 'bench' && (
              <p className="mt-1">
                La respuesta era: <b className="font-mono">{correctText}</b>
              </p>
            )}
            {(verdict.ok || ex.type !== 'bench') && (
              <p className="mt-1">
                <Rich text={ex.explain} />
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-4 flex items-center justify-end gap-2">
        {ex.type === 'bench' && !finished && tries >= 2 && (
          <button className="btn btn-soft" onClick={() => (setGaveUp(true), useProgress.getState().bump('giveups'), setVerdict({ ok: false, msg: 'Así se hacía: ' + ex.explain.replace(/\*\*/g, '') }))}>
            Me rindo
          </button>
        )}
        {finished ? (
          <button className="btn btn-primary" autoFocus onClick={() => onDone(!!verdict?.ok)}>
            Seguir
          </button>
        ) : (
          <button className="btn btn-primary" disabled={!canCheck} onClick={check}>
            Comprobar
          </button>
        )}
      </div>
    </div>
  )

  const visual = ex.type === 'bench' ? <BenchVisual scene={ex.scene} edit={ex.edit ?? 'values'} /> : ex.visual ? <VisualPane visual={ex.visual} /> : <DefaultVisual />

  return layout(body, visual)
}

function Hint({ text }: { text: string }) {
  const [open, setOpen] = useState(false)
  return open ? (
    <p className="postit mt-3 -rotate-1 rounded-md p-3 text-sm">
      <Rich text={text} />
    </p>
  ) : (
    <button className="mt-3 text-sm font-bold text-ink-soft underline decoration-dotted" onClick={() => setOpen(true)}>
      ver una pista
    </button>
  )
}

function DefaultVisual() {
  return useMemo(
    () => (
      <div className="desk flex h-full items-center justify-center">
        <div className="postit rotate-2 rounded-md px-8 py-6 font-display text-2xl font-bold">pensalo en el cuaderno</div>
      </div>
    ),
    [],
  )
}

function label(ex: Exercise) {
  return { choice: 'elegí una', numeric: 'calculá', order: 'ordená (arrastrá)', bench: 'en la mesa' }[ex.type]
}

const PRAISES = ['¡Bien ahí!', '¡Exacto!', '¡Eso!', '¡Joya!', '¡Impecable!', '¡De diez!']
const pickPraise = () => PRAISES[Math.floor(Math.random() * PRAISES.length)]

function scramble(items: string[]) {
  const a = [...items]
  for (let k = 0; k < 10; k++) {
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[a[i], a[j]] = [a[j], a[i]]
    }
    if (a.some((x, i) => x !== items[i])) break
  }
  return a
}
