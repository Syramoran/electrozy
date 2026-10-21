// Sonidos ASMR sintetizados con WebAudio: nada de archivos, nada de música.

let ctx: AudioContext | null = null
let muted = false

export function setMuted(m: boolean) {
  muted = m
}

function ac() {
  if (muted) return null
  try {
    ctx ??= new AudioContext()
    if (ctx.state === 'suspended') void ctx.resume()
    return ctx
  } catch {
    return null
  }
}

function noiseBurst(dur: number, freq: number, q: number, gain: number, delay = 0) {
  const a = ac()
  if (!a) return
  const t = a.currentTime + delay
  const buf = a.createBuffer(1, Math.ceil(a.sampleRate * dur), a.sampleRate)
  const data = buf.getChannelData(0)
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length) ** 3
  const src = a.createBufferSource()
  src.buffer = buf
  const f = a.createBiquadFilter()
  f.type = 'bandpass'
  f.frequency.value = freq
  f.Q.value = q
  const g = a.createGain()
  g.gain.value = gain
  src.connect(f).connect(g).connect(a.destination)
  src.start(t)
}

function tone(freq: number, dur: number, gain: number, delay = 0, type: OscillatorType = 'sine') {
  const a = ac()
  if (!a) return
  const t = a.currentTime + delay
  const o = a.createOscillator()
  o.type = type
  o.frequency.value = freq
  const g = a.createGain()
  g.gain.setValueAtTime(0, t)
  g.gain.linearRampToValueAtTime(gain, t + 0.02)
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  o.connect(g).connect(a.destination)
  o.start(t)
  o.stop(t + dur + 0.05)
}

export const sfx = {
  /** Clic de encastre en la protoboard. */
  snap: () => {
    noiseBurst(0.05, 2400, 3, 0.5)
    noiseBurst(0.04, 900, 4, 0.3, 0.025)
  },
  pick: () => noiseBurst(0.04, 1500, 2, 0.18),
  drop: () => noiseBurst(0.08, 400, 1.5, 0.25),
  click: () => noiseBurst(0.03, 3200, 5, 0.25),
  /** Zumbido leve cuando el circuito se cierra. */
  hum: () => {
    tone(100, 0.5, 0.025, 0, 'triangle')
    tone(150, 0.4, 0.012, 0.03, 'sine')
  },
  ok: () => {
    tone(523, 0.35, 0.07)
    tone(784, 0.5, 0.06, 0.12)
  },
  nope: () => tone(196, 0.3, 0.06, 0, 'triangle'),
  pop: () => {
    noiseBurst(0.15, 600, 1, 0.5)
    tone(80, 0.2, 0.08, 0, 'triangle')
  },
  page: () => noiseBurst(0.18, 5000, 0.6, 0.12),
  reward: () => [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.5, 0.05, i * 0.1)),
}
