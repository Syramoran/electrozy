// Una lección = un encargo: carta del cliente → explicación con gráficos → práctica → recompensa.

import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useMemo, useRef, useState } from 'react'
import { LESSONS } from '../content/lessons'
import { REWARDS } from '../content/rewards'
import type { ExplainStep, Lesson } from '../content/types'
import { go } from '../lib/router'
import { sfx } from '../lib/sound'
import { useBench } from '../sim/benchStore'
import { useProgress } from '../store/progress'
import { Rich } from '../ui/rich'
import { Practice, type PoolItem } from './Practice'
import { LessonHeader, LessonShell } from './Shell'
import { VisualPane } from './VisualPane'

type Phase = { kind: 'intro' } | { kind: 'step'; i: number } | { kind: 'practice'; run: number } | { kind: 'done'; accuracy: number }

export const PRACTICE_COUNT = 7

export function LessonPage({ id, from }: { id: string; from: number }) {
  const lesson = LESSONS.find((l) => l.id === id)
  const [phase, setPhase] = useState<Phase>(() => (from >= 0 && lesson ? (from >= lesson.steps.length ? { kind: 'practice', run: 0 } : { kind: 'step', i: from }) : { kind: 'intro' }))
  const complete = useProgress((s) => s.completeLesson)
  const pool = useMemo<PoolItem[]>(() => (lesson ? lesson.practice.map((gen) => ({ gen, lessonId: lesson.id })) : []), [lesson])

  if (!lesson) return <div className="p-8 text-paper">No encontré esa lección.</div>
  // Mitad de la barra para la explicación, mitad para la práctica.
  const stepsProgress = (i: number) => (i / lesson.steps.length) * 0.5

  if (phase.kind === 'intro')
    return (
      <LessonShell
        header={<LessonHeader title={lesson.title} progress={0} />}
        left={<Intro lesson={lesson} onStart={(i) => (sfx.page(), setPhase(i >= lesson.steps.length ? { kind: 'practice', run: 0 } : { kind: 'step', i }))} />}
        right={<Letter lesson={lesson} />}
      />
    )

  if (phase.kind === 'step') {
    const step = lesson.steps[phase.i]
    return (
      <LessonShell
        header={<LessonHeader title={lesson.title} progress={stepsProgress(phase.i)} />}
        left={
          <StepView
            key={phase.i}
            step={step}
            index={phase.i}
            count={lesson.steps.length}
            onJump={(i) => (sfx.page(), setPhase({ kind: 'step', i }))}
            onBack={() => (sfx.page(), setPhase(phase.i === 0 ? { kind: 'intro' } : { kind: 'step', i: phase.i - 1 }))}
            onNext={() => (sfx.page(), setPhase(phase.i + 1 >= lesson.steps.length ? { kind: 'practice', run: 0 } : { kind: 'step', i: phase.i + 1 }))}
          />
        }
        right={<VisualPane key={phase.i} visual={step.visual} />}
      />
    )
  }

  if (phase.kind === 'practice')
    return (
      <Practice
        key={phase.run}
        pool={pool}
        count={lesson.practiceCount ?? PRACTICE_COUNT}
        onFinish={(accuracy) => {
          complete(lesson.id, accuracy)
          sfx.reward()
          setPhase({ kind: 'done', accuracy })
        }}
        render={({ left, right, progress }) => <LessonShell header={<LessonHeader title={`${lesson.title} · práctica`} progress={0.5 + progress * 0.5} />} left={left} right={right} />}
      />
    )

  return (
    <LessonShell
      header={<LessonHeader title={lesson.title} progress={1} />}
      left={<Done lesson={lesson} accuracy={phase.accuracy} onAgain={() => setPhase({ kind: 'practice', run: Date.now() })} />}
      right={<RewardScene lessonId={lesson.id} />}
    />
  )
}

function Intro({ lesson, onStart }: { lesson: Lesson; onStart: (i: number) => void }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="text-xs font-bold tracking-wider text-ink-soft uppercase">Encargo {lesson.n}</div>
      <h1 className="font-display text-3xl leading-tight font-black">{lesson.title}</h1>
      <p className="text-ink-soft">{lesson.short}</p>
      <button className="btn btn-primary self-start" onClick={() => onStart(0)} autoFocus>
        Empezar
      </button>
      <div>
        <div className="mb-1 text-sm font-bold">o arrancá desde donde quieras:</div>
        <ol className="space-y-1">
          {lesson.steps.map((s, i) => (
            <li key={i}>
              <button className="w-full rounded-lg px-2 py-1 text-left text-sm hover:bg-postit/60" onClick={() => onStart(i)}>
                <span className="mr-2 font-mono text-ink-soft">{i + 1}.</span>
                {s.title}
              </button>
            </li>
          ))}
          <li>
            <button className="w-full rounded-lg px-2 py-1 text-left text-sm font-bold hover:bg-postit/60" onClick={() => onStart(lesson.steps.length)}>
              <span className="mr-2 font-mono text-ink-soft">{lesson.steps.length + 1}.</span>
              Práctica ({lesson.practiceCount ?? PRACTICE_COUNT} ejercicios)
            </button>
          </li>
        </ol>
      </div>
    </div>
  )
}

function Letter({ lesson }: { lesson: Lesson }) {
  return (
    <div className="desk flex h-full items-center justify-center p-6">
      <motion.div initial={{ y: 30, rotate: -4, opacity: 0 }} animate={{ y: 0, rotate: -1.5, opacity: 1 }} transition={{ type: 'spring', stiffness: 70, damping: 14 }} className="paper relative max-w-md rounded-sm p-8">
        <div className="tape -top-3 left-8 -rotate-6" />
        <div className="tape -top-3 right-8 rotate-6" />
        <p className="font-display text-lg leading-relaxed italic">“{lesson.client.request}”</p>
        <p className="mt-4 text-right font-display font-bold">— {lesson.client.name}</p>
      </motion.div>
    </div>
  )
}

function StepView({ step, index, count, onBack, onNext, onJump }: { step: ExplainStep; index: number; count: number; onBack: () => void; onNext: () => void; onJump: (i: number) => void }) {
  const [gateOk, setGateOk] = useState(!step.gate)
  return (
    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4 }} className="flex h-full flex-col">
      <div className="mb-2 flex gap-1.5" aria-label="Pasos">
        {Array.from({ length: count }, (_, i) => (
          <button key={i} onClick={() => onJump(i)} aria-label={`Paso ${i + 1}`} className={`h-2.5 rounded-full transition-all ${i === index ? 'w-7 bg-amber' : i < index ? 'w-2.5 bg-ink/50' : 'w-2.5 bg-ink/15'}`} />
        ))}
      </div>
      <h2 className="font-display text-2xl leading-tight font-black sm:text-[28px]">{step.title}</h2>
      <div className="mt-3 space-y-3 text-[0.95rem] leading-[2rem]">
        {step.body.map((p, i) => (
          <p key={i}>
            <Rich text={p} />
          </p>
        ))}
      </div>
      {step.tryIt && (
        <div className="postit mt-4 -rotate-1 rounded-md p-3 text-sm font-bold">
          <span className="mr-1 text-xs tracking-wider text-ink-soft uppercase">probá:</span> <Rich text={step.tryIt} />
        </div>
      )}
      {step.gate && <Gate gate={step.gate} onOk={() => setGateOk(true)} />}
      <div className="mt-auto flex items-center justify-between gap-2 pt-5">
        <button className="btn btn-soft" onClick={onBack}>
          Atrás
        </button>
        <button className="btn btn-primary" onClick={onNext} disabled={!gateOk}>
          {index + 1 >= count ? 'A practicar' : 'Siguiente'}
        </button>
      </div>
    </motion.div>
  )
}

function Gate({ gate, onOk }: { gate: NonNullable<ExplainStep['gate']>; onOk: () => void }) {
  const parts = useBench((s) => s.parts)
  const sim = useBench((s) => s.sim)
  const dragging = useBench((s) => !!s.drag)
  // Recién evaluamos cuando la escena de este paso ya se cargó (no la del paso anterior).
  const v0 = useRef(useBench.getState().version)
  const loaded = useBench((s) => s.version > v0.current)
  const r = dragging || !loaded ? { ok: false, msg: undefined } : gate.check(parts, sim)
  const [latched, setLatched] = useState(false)
  useEffect(() => {
    if (r.ok && !latched) {
      setLatched(true)
      sfx.ok()
      useProgress.getState().bump('benchOk')
      onOk()
    }
  }, [r.ok, latched, onOk])
  const ok = latched
  return (
    <div className={`mt-4 rounded-xl border-2 p-3 text-sm transition ${ok ? 'border-sage bg-sage-soft' : 'border-dashed border-ink/25'}`} role="status">
      <div className="font-bold">
        {ok ? '✓ ' : ''}
        <Rich text={gate.task} />
      </div>
      {!ok && r.msg && <div className="mt-1 text-ink-soft">{r.msg}</div>}
      {ok && <div className="mt-1">{gate.check(parts, sim).msg ?? '¡Listo!'}</div>}
    </div>
  )
}

function Done({ lesson, accuracy, onAgain }: { lesson: Lesson; accuracy: number; onAgain: () => void }) {
  const reward = REWARDS[lesson.id]
  const next = LESSONS.find((l) => l.n === lesson.n + 1)
  return (
    <div className="flex flex-col gap-4">
      <div className="text-xs font-bold tracking-wider text-ink-soft uppercase">Encargo terminado</div>
      <h1 className="font-display text-3xl leading-tight font-black">{lesson.client.thanks}</h1>
      <p>
        Acertaste <b>{Math.round(accuracy * 100)}%</b> al primer intento. {accuracy < 0.7 ? 'Repetilo cuando quieras: los ejercicios cambian cada vez.' : '¡Muy bien!'}
      </p>
      {reward && <p className="postit -rotate-1 rounded-md p-3 font-bold">{reward.text}</p>}
      <div className="flex flex-wrap gap-2">
        {next && (
          <button className="btn btn-primary" onClick={() => go(`/leccion/${next.id}`)}>
            Siguiente encargo
          </button>
        )}
        <button className="btn btn-soft" onClick={onAgain}>
          Practicar otra vez
        </button>
        <button className="btn btn-soft" onClick={() => go('/')}>
          Volver al taller
        </button>
      </div>
    </div>
  )
}

function RewardScene({ lessonId }: { lessonId: string }) {
  const reward = REWARDS[lessonId]
  return (
    <div className="desk flex h-full items-center justify-center overflow-hidden">
      <AnimatePresence>
        {Array.from({ length: 18 }, (_, i) => (
          <motion.div
            key={i}
            className="absolute h-3 w-2 rounded-sm"
            style={{ background: ['#e0913c', '#6f9a68', '#6f98c0', '#c8664d', '#e1b54f'][i % 5], left: `${5 + ((i * 53) % 90)}%` }}
            initial={{ top: '-5%', rotate: 0 }}
            animate={{ top: '105%', rotate: 360 * (i % 2 ? 1 : -1) }}
            transition={{ duration: 3 + (i % 4), delay: (i % 6) * 0.3, ease: 'linear', repeat: Infinity }}
          />
        ))}
      </AnimatePresence>
      <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 90, damping: 12 }} className="paper rounded-2xl px-10 py-8 text-center">
        <div className="font-display text-2xl font-black">Nuevo en el taller</div>
        <div className="mt-2 text-lg">{reward?.text}</div>
        <button className="btn btn-primary mt-5" onClick={() => go('/')}>
          Ir a verlo
        </button>
      </motion.div>
    </div>
  )
}
