// Modo tráiler: una secuencia automática con lo más lindo del juego. Con ?rec=1 se graba sola.

import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { ACHIEVEMENTS } from '../content/achievements'
import { holePos } from '../engine/board'
import { battery, h, led, meter, resistor, wire } from '../engine/build'
import { go } from '../lib/router'
import { sfx } from '../lib/sound'
import { useBench, type DragTarget } from '../sim/benchStore'
import { Bench } from '../sim/three/Bench'
import { useView } from '../sim/viewStore'
import { freezeProgress } from '../store/progress'
import { useToasts } from '../store/toasts'
import { AchievementToasts, Medal } from '../ui/achievements'
import { Logo } from '../ui/chrome'
import { Conductor } from '../widgets/current'
import { Kvl } from '../widgets/advanced'
import { Direction, WaterTanks } from '../widgets/voltage'
import { sampleScene } from './Playground'

type SceneId = 'logo' | 'taller' | 'armar' | 'medir' | 'quemar' | 'teoria' | 'numeros' | 'fin'
const TIMELINE: [SceneId, number][] = [
  ['logo', 4500],
  ['taller', 7000],
  ['armar', 8500],
  ['medir', 8500],
  ['quemar', 7000],
  ['teoria', 12000],
  ['numeros', 6500],
  ['fin', 7500],
]
export const TRAILER_MS = TIMELINE.reduce((a, [, d]) => a + d, 0)

const ALL_DECOR = ['potus', 'radio', 'foto', 'gato', 'guirnalda', 'mate', 'reloj', 'libros', 'diploma', 'fuente', 'banderines'] as const

/** El circuito del tráiler: falta R1 para que el LED prenda. */
const buildScene = () => [
  battery('bat', 9, 'T+2', 'T-2', undefined, { label: 'Batería' }),
  wire('w1', '#c8664d', 'T+4', 'a4'),
  resistor('R1', 330, null, 0, { label: 'R1', free: [-1.2, 3.7] }),
  led('L1', 'green', 'd8', 0),
  wire('w2', '#2f2a28', 'a10', 'T-10'),
  meter('off', null, null, [0.4, 4.1]),
]

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2)

/** Arrastra una pieza "a mano" de un punto a otro, como si fuera el mouse. */
function glide(target: DragTarget, from: [number, number], to: [number, number], ms: number) {
  return new Promise<void>((resolve) => {
    const st = useBench.getState()
    st.startDrag(target)
    const t0 = performance.now()
    const step = (now: number) => {
      const t = Math.min(1, (now - t0) / ms)
      const k = ease(t)
      useBench.getState().dragTo(from[0] + (to[0] - from[0]) * k, from[1] + (to[1] - from[1]) * k)
      if (t < 1) requestAnimationFrame(step)
      else {
        useBench.getState().endDrag()
        resolve()
      }
    }
    requestAnimationFrame(step)
  })
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))

async function runScene(id: SceneId, alive: () => boolean) {
  const st = () => useBench.getState()
  if (id === 'taller') st().load(sampleScene())
  if (id === 'armar') {
    st().load(buildScene())
    await wait(1600)
    if (!alive()) return
    const [ax, az] = holePos(h('c4'))
    await glide({ id: 'R1' }, [-1.2, 3.7], [ax + 0.6, az], 1900)
    st().select(null)
  }
  if (id === 'medir') {
    await wait(700)
    if (!alive()) return
    st().setMode('V')
    await wait(700)
    const m = st().parts.find((p) => p.kind === 'meter')
    if (!m || m.kind !== 'meter' || !alive()) return
    await glide({ id: 'tester', pin: 'red' }, [m.red.x, m.red.z], holePos(h('e4')), 1600)
    if (!alive()) return
    await glide({ id: 'tester', pin: 'black' }, [m.black.x, m.black.z], holePos(h('e8')), 1600)
    st().select(null)
  }
  if (id === 'quemar') {
    await wait(1500)
    if (!alive()) return
    st().update('R1', { ohms: 10 })
    await wait(900)
    if (alive()) useToasts.getState().push(['led1'])
  }
}

const CAPTIONS: Partial<Record<SceneId, [string, string]>> = {
  taller: ['Tu propio taller de electrónica', '11 encargos para aprender desde cero'],
  armar: ['Armá circuitos en una protoboard 3D', 'las piezas encastran y la corriente fluye de verdad'],
  medir: ['Medí con el tester', 'voltímetro, amperímetro y óhmetro, como en el taller'],
  quemar: ['Equivocate sin miedo', 'acá el humo es de mentira'],
}

function Caption({ title, sub }: { title: string; sub: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30, rotate: -2 }}
      animate={{ opacity: 1, y: 0, rotate: -1 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ type: 'spring', stiffness: 90, damping: 16, delay: 0.3 }}
      className="paper absolute bottom-[8%] left-[5%] z-20 max-w-[46%] rounded-xl px-7 py-5"
    >
      <div className="tape -top-3 left-10 -rotate-3" />
      <div className="font-display text-[clamp(1.6rem,3.2vw,3.2rem)] leading-tight font-black">{title}</div>
      <div className="mt-1 text-[clamp(0.9rem,1.5vw,1.4rem)] text-ink-soft">{sub}</div>
    </motion.div>
  )
}

const THEORY: [ReactNode, string][] = [
  [<Conductor startOn />, 'La corriente, en movimiento'],
  [<WaterTanks />, 'El voltaje, como un tanque de agua'],
  [<Kvl />, 'Kirchhoff, como una montaña rusa'],
  [<Direction />, 'Electrones y sentido convencional'],
]

function Theory() {
  const [i, setI] = useState(0)
  useEffect(() => {
    const t = setInterval(() => (sfx.page(), setI((x) => Math.min(THEORY.length - 1, x + 1))), 3000)
    return () => clearInterval(t)
  }, [])
  return (
    <div className="desk absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 p-[4%]">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="font-display text-[clamp(1.6rem,3vw,3rem)] font-black text-paper drop-shadow">
        Teoría que se toca
      </motion.div>
      <AnimatePresence mode="wait">
        <motion.div key={i} initial={{ opacity: 0, x: 60, rotate: 2 }} animate={{ opacity: 1, x: 0, rotate: 0 }} exit={{ opacity: 0, x: -60, rotate: -2 }} transition={{ type: 'spring', stiffness: 90, damping: 16 }} className="pointer-events-none w-[min(900px,80%)]">
          {THEORY[i][0]}
          <div className="mt-1 text-center font-display text-[clamp(1rem,1.8vw,1.7rem)] font-bold text-paper drop-shadow">{THEORY[i][1]}</div>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

function Numbers() {
  const cards = [
    ['11', 'encargos'],
    ['29', 'logros'],
    ['100%', 'Unidad 1'],
  ]
  const medals = ['led1', 'short', 'hot1', 'snap50', 'perfect', 'cat', 'lessonAll'].map((id) => ACHIEVEMENTS.find((a) => a.id === id)!)
  return (
    <div className="desk absolute inset-0 z-10 flex flex-col items-center justify-center gap-[5vh]">
      <div className="flex gap-[3vw]">
        {cards.map(([big, small], i) => (
          <motion.div
            key={small}
            initial={{ scale: 0.4, opacity: 0, rotate: -8 }}
            animate={{ scale: 1, opacity: 1, rotate: i % 2 ? 2 : -2 }}
            transition={{ type: 'spring', stiffness: 140, damping: 12, delay: 0.3 + i * 0.45 }}
            onAnimationStart={() => setTimeout(() => sfx.click(), 300 + i * 450)}
            className="postit flex w-[17vw] flex-col items-center rounded-md py-[3vh]"
          >
            <div className="font-display text-[clamp(2.5rem,6vw,6rem)] leading-none font-black">{big}</div>
            <div className="mt-1 text-[clamp(1rem,1.8vw,1.8rem)] font-bold">{small}</div>
          </motion.div>
        ))}
      </div>
      <div className="flex gap-[1.5vw]">
        {medals.map((a, i) => (
          <motion.div key={a.id} initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 1.8 + i * 0.15, type: 'spring', stiffness: 120 }}>
            <Medal a={a} size={72} />
          </motion.div>
        ))}
      </div>
    </div>
  )
}

function LogoCard({ end = false }: { end?: boolean }) {
  return (
    <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-night" style={{ backgroundImage: 'radial-gradient(ellipse at 50% 40%, rgba(224,145,60,0.28), transparent 60%)' }}>
      <motion.div initial={{ opacity: 0, y: 30, scale: 0.92 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}>
        <Logo className="text-[clamp(4rem,11vw,10rem)] text-paper" />
      </motion.div>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2, duration: 1 }} className="mt-2 font-display text-[clamp(1.2rem,2.4vw,2.4rem)] text-paper/80 italic">
        {end ? 'Electrónica desde cero, en tu propio taller.' : 'el taller de electrónica'}
      </motion.div>
      {end && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.4, duration: 1 }} className="mt-[8vh] text-center text-[clamp(0.9rem,1.4vw,1.3rem)] text-paper/70">
          Hecho por <b className="text-paper">Syra Moran</b> con <b className="text-paper">Opus 5.5</b>
          <div className="mt-1">Facultad Regional Paraná · Universidad Tecnológica Nacional</div>
        </motion.div>
      )}
    </div>
  )
}

/** Graba la propia pestaña (con su audio) y le pasa los pedazos al script que la abrió. */
async function startRecording(): Promise<() => Promise<void>> {
  const w = window as unknown as { __saveChunk?: (b64: string) => Promise<void>; __done?: (mime: string) => Promise<void> }
  const capture = await navigator.mediaDevices.getDisplayMedia({
    video: { frameRate: 30 },
    audio: true,
    preferCurrentTab: true,
  } as DisplayMediaStreamOptions)
  const track = capture.getVideoTracks()[0]
  // Que Chrome priorice nitidez antes que bajar la resolución cuando la máquina se carga.
  track.contentHint = 'detail'

  // Cada cuadro se compone en un lienzo fijo de 1920×1080: el video nunca cambia de tamaño.
  const video = document.createElement('video')
  video.muted = true
  video.srcObject = new MediaStream([track])
  await video.play()
  const canvas = document.createElement('canvas')
  canvas.width = 1920
  canvas.height = 1080
  const g = canvas.getContext('2d')!
  let drawing = true
  const draw = () => {
    if (!drawing) return
    const vw = video.videoWidth || 1920
    const vh = video.videoHeight || 1080
    const scale = Math.max(1920 / vw, 1080 / vh)
    const dw = vw * scale
    const dh = vh * scale
    g.fillStyle = '#2e231c'
    g.fillRect(0, 0, 1920, 1080)
    g.drawImage(video, (1920 - dw) / 2, (1080 - dh) / 2, dw, dh)
    requestAnimationFrame(draw)
  }
  draw()
  const stream = new MediaStream([...canvas.captureStream(30).getVideoTracks(), ...capture.getAudioTracks()])

  const mime = ['video/mp4;codecs=avc3.640028,mp4a.40.2', 'video/mp4;codecs=avc1.640028,mp4a.40.2', 'video/mp4', 'video/webm;codecs=vp9,opus', 'video/webm'].find((m) => MediaRecorder.isTypeSupported(m))!
  const rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 14_000_000 })
  const pending: Promise<void>[] = []
  rec.ondataavailable = (e) => {
    if (!e.data.size) return
    pending.push(
      e.data.arrayBuffer().then((buf) => {
        let s = ''
        const bytes = new Uint8Array(buf)
        for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
        return w.__saveChunk?.(btoa(s))
      }),
    )
  }
  rec.start(1000)
  return () =>
    new Promise<void>((resolve) => {
      rec.onstop = async () => {
        await Promise.all(pending)
        drawing = false
        capture.getTracks().forEach((t) => t.stop())
        stream.getTracks().forEach((t) => t.stop())
        await w.__done?.(mime)
        resolve()
      }
      rec.stop()
    })
}

export function Trailer() {
  const recordMode = new URLSearchParams(location.search).has('rec')
  const [started, setStarted] = useState(false)
  const [arming, setArming] = useState(false)
  const [scene, setScene] = useState(0)
  const [over, setOver] = useState(false)
  const stopRec = useRef<(() => Promise<void>) | null>(null)
  const id = TIMELINE[scene][0]

  useEffect(() => {
    freezeProgress(true)
    useView.setState({ electrons: true })
    useBench.getState().load(sampleScene())
    return () => freezeProgress(false)
  }, [])

  useEffect(() => {
    if (!started) return
    let alive = true
    void runScene(id, () => alive)
    const t = setTimeout(() => {
      if (scene + 1 < TIMELINE.length) setScene(scene + 1)
      else setOver(true)
    }, TIMELINE[scene][1])
    return () => {
      alive = false
      clearTimeout(t)
    }
  }, [started, scene, id])

  useEffect(() => {
    if (over && stopRec.current) void stopRec.current()
  }, [over])

  const start = async () => {
    setArming(true)
    if (recordMode) {
      stopRec.current = await startRecording()
      await wait(800)
    }
    sfx.reward()
    setStarted(true)
  }

  const benchScene = id === 'taller' || id === 'armar' || id === 'medir' || id === 'quemar'
  const caption = CAPTIONS[id]

  return (
    <div className="relative h-full w-full overflow-hidden bg-night">
      <div className="absolute inset-0">
        <Bench interactive={false} decor={[...ALL_DECOR]} autoRotate={id !== 'logo'} fit={id === 'taller' || id === 'logo' ? 20 : 10} target={id === 'taller' || id === 'logo' ? [-1.5, 0, -0.5] : [-2.6, 0, 1.1]} />
      </div>
      {benchScene && <div className="pointer-events-none absolute inset-0 z-10" style={{ background: 'radial-gradient(ellipse at 50% 50%, transparent 55%, rgba(30,20,14,0.55))' }} />}
      <AnimatePresence>{caption && <Caption key={id} title={caption[0]} sub={caption[1]} />}</AnimatePresence>
      <AnimatePresence>
        {id === 'teoria' && (
          <motion.div key="teoria" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.6 }}>
            <Theory />
          </motion.div>
        )}
        {id === 'numeros' && (
          <motion.div key="numeros" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.6 }}>
            <Numbers />
          </motion.div>
        )}
        {(id === 'logo' || id === 'fin') && started && (
          <motion.div key={id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.9 }}>
            <LogoCard end={id === 'fin'} />
          </motion.div>
        )}
      </AnimatePresence>
      <AchievementToasts />
      {!started && !arming && (
        <div className="absolute inset-0 z-40 flex flex-col items-center justify-center gap-6 bg-night">
          <Logo className="text-7xl text-paper" />
          <button id="play-trailer" className="btn btn-soft px-8 py-3 text-lg" onClick={start}>
            Ver tráiler
          </button>
          {!recordMode && (
            <button className="text-sm text-paper/60 underline" onClick={() => go('/')}>
              volver al taller
            </button>
          )}
        </div>
      )}
      {over && !recordMode && (
        <div className="absolute right-6 bottom-6 z-40 flex gap-2">
          <button className="btn btn-soft" onClick={() => (setOver(false), setScene(0))}>
            Ver de nuevo
          </button>
          <button className="btn btn-primary" onClick={() => go('/')}>
            Ir al taller
          </button>
        </div>
      )}
    </div>
  )
}
