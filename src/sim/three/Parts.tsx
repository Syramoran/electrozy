// Piezas 3D con look de juguete: mate, redondeadas, chunky.

import { RoundedBox } from '@react-three/drei'
import { useFrame, type ThreeEvent } from '@react-three/fiber'
import { createContext, useContext, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { BAND_COLORS, GOLD, colorBands } from '../../engine/circuit'
import type { End, LedColor, LedPart, MeterMode, MeterPart, Part, RigidPart, SourcePart, WirePart } from '../../engine/types'
import { useBench } from '../benchStore'
import { MODE_LABEL, meterDisplay } from '../format'
import { useView } from '../viewStore'
import { beginDrag } from './DragController'
import { endWorld, meterJacks, rigidPinsWorld, sourceTerminals, type V3 } from './layout'
import { TextPlane } from './TextPlane'

export const InteractiveCtx = createContext(true)

const LEG = '#b9b2a8'
const LED_HEX: Record<LedColor, string> = { red: '#ff5a4a', yellow: '#ffc94a', green: '#6fdc6a', blue: '#5aa8ff' }

const hoverOn = () => (document.body.style.cursor = 'grab')
const hoverOff = () => (document.body.style.cursor = '')

function useHandlers(id: string, pin: string | undefined, pos: [number, number]) {
  const interactive = useContext(InteractiveCtx)
  if (!interactive) return {}
  return {
    onPointerDown: (e: ThreeEvent<PointerEvent>) => beginDrag(e, { id, pin }, pos),
    onPointerOver: (e: ThreeEvent<PointerEvent>) => (e.stopPropagation(), hoverOn()),
    onPointerOut: hoverOff,
  }
}

// ---------- electrones ----------

const ELECTRON_GEO = new THREE.SphereGeometry(0.05, 10, 8)
const ELECTRON_MAT = new THREE.MeshStandardMaterial({ color: '#a9d6ff', emissive: '#4f9be0', emissiveIntensity: 1.4 })

/** Electrones viajando por una curva. `current` es la corriente convencional en el sentido de la curva. */
function Flow({ curve, current }: { curve: THREE.Curve<THREE.Vector3>; current: number }) {
  const show = useView((s) => s.electrons)
  const ref = useRef<THREE.InstancedMesh>(null)
  const len = useMemo(() => curve.getLength(), [curve])
  const n = Math.max(2, Math.min(36, Math.round(len / 0.3)))
  const phase = useRef(Math.random())
  const tmp = useMemo(() => new THREE.Object3D(), [])
  useFrame((_, dt) => {
    const mesh = ref.current
    if (!mesh) return
    const mag = Math.abs(current)
    mesh.visible = show && mag > 2e-5
    if (!mesh.visible) return
    const speed = Math.min(2.6, 0.22 + 0.6 * Math.log10(1 + mag * 1000))
    // Los electrones van al revés que la corriente convencional.
    phase.current = (((phase.current - (Math.sign(current) * speed * Math.min(dt, 0.05)) / len) % 1) + 1) % 1
    for (let i = 0; i < n; i++) {
      curve.getPointAt((i / n + phase.current) % 1, tmp.position)
      tmp.updateMatrix()
      mesh.setMatrixAt(i, tmp.matrix)
    }
    mesh.instanceMatrix.needsUpdate = true
  })
  return <instancedMesh key={n} ref={ref} args={[ELECTRON_GEO, ELECTRON_MAT, n]} />
}

function polyline(points: V3[]) {
  const path = new THREE.CurvePath<THREE.Vector3>()
  for (let i = 0; i < points.length - 1; i++) path.add(new THREE.LineCurve3(new THREE.Vector3(...points[i]), new THREE.Vector3(...points[i + 1])))
  return path
}

// ---------- cables ----------

function Cable({ from, to, color, current, radius = 0.038 }: { from: V3; to: V3; color: string; current: number; radius?: number }) {
  const curve = useMemo(() => {
    const a = new THREE.Vector3(...from)
    const b = new THREE.Vector3(...to)
    const d = a.distanceTo(b)
    const up = Math.min(1.5, 0.35 + d * 0.22)
    const mid = a.clone().lerp(b, 0.5)
    mid.y = Math.max(a.y, b.y) + up
    return new THREE.CatmullRomCurve3([a, a.clone().add(new THREE.Vector3(0, up * 0.45, 0)), mid, b.clone().add(new THREE.Vector3(0, up * 0.45, 0)), b], false, 'centripetal')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...from, ...to])
  const geo = useMemo(() => new THREE.TubeGeometry(curve, 48, radius, 8, false), [curve, radius])
  return (
    <>
      <mesh geometry={geo} castShadow>
        <meshStandardMaterial color={color} roughness={0.55} />
      </mesh>
      <Flow curve={curve} current={current} />
    </>
  )
}

const TIP_TOP = 0.34

/** Punta de cable (jumper / cocodrilo) que se enchufa en un agujero. */
function PinTip({ partId, pin, end, color }: { partId: string; pin: string; end: End; color: string }) {
  const dragging = useBench((s) => s.drag?.id === partId && s.drag.pin === pin)
  const [x, y, z] = endWorld(end, dragging)
  const h = useHandlers(partId, pin, [x, z])
  return (
    <group position={[x, y, z]} {...h}>
      <mesh position={[0, -0.02, 0]}>
        <cylinderGeometry args={[0.025, 0.025, 0.14, 8]} />
        <meshStandardMaterial color={LEG} metalness={0.5} roughness={0.35} />
      </mesh>
      <mesh position={[0, 0.2, 0]} castShadow>
        <cylinderGeometry args={[0.065, 0.075, 0.28, 14]} />
        <meshStandardMaterial color={color} roughness={0.6} />
      </mesh>
      {/* zona de agarre más grande e invisible */}
      <mesh position={[0, 0.2, 0]} visible={false}>
        <cylinderGeometry args={[0.2, 0.2, 0.5, 8]} />
      </mesh>
    </group>
  )
}

/** Punta del tester: mango gordo con aguja. */
function ProbeTip({ partId, pin, end, color }: { partId: string; pin: string; end: End; color: string }) {
  const dragging = useBench((s) => s.drag?.id === partId && s.drag.pin === pin)
  const [x, y, z] = endWorld(end, dragging)
  const h = useHandlers(partId, pin, [x, z])
  return (
    <group position={[x, y, z]} {...h}>
      <mesh position={[0, 0.1, 0]}>
        <cylinderGeometry args={[0.012, 0.03, 0.28, 8]} />
        <meshStandardMaterial color="#d8d2c8" metalness={0.6} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.3, 0]} castShadow>
        <cylinderGeometry args={[0.1, 0.1, 0.12, 16]} />
        <meshStandardMaterial color={color} roughness={0.55} />
      </mesh>
      <mesh position={[0, 0.62, 0]} castShadow>
        <capsuleGeometry args={[0.075, 0.5, 6, 14]} />
        <meshStandardMaterial color={color} roughness={0.55} />
      </mesh>
      <mesh position={[0, 0.5, 0]} visible={false}>
        <cylinderGeometry args={[0.25, 0.25, 1, 8]} />
      </mesh>
    </group>
  )
}

const PROBE_TOP = 0.95

export function WireView({ p }: { p: WirePart }) {
  const drag = useBench((s) => (s.drag?.id === p.id ? s.drag.pin : null))
  const current = useBench((s) => s.sim.partI[p.id] ?? 0)
  const a = endWorld(p.a, drag === 'a')
  const b = endWorld(p.b, drag === 'b')
  return (
    <group>
      <Cable from={[a[0], a[1] + TIP_TOP, a[2]]} to={[b[0], b[1] + TIP_TOP, b[2]]} color={p.color} current={current} />
      <PinTip partId={p.id} pin="a" end={p.a} color={p.color} />
      <PinTip partId={p.id} pin="b" end={p.b} color={p.color} />
    </group>
  )
}

// ---------- piezas rígidas ----------

export function RigidView({ p }: { p: RigidPart }) {
  const dragging = useBench((s) => s.drag?.id === p.id && !s.drag.pin)
  const selected = useBench((s) => s.selected === p.id)
  const current = useBench((s) => s.sim.partI[p.id] ?? 0)
  const glow = useBench((s) => s.sim.glow[p.id] ?? 0)
  const heat = useBench((s) => s.sim.heat[p.id] ?? 0)
  const [a, b] = rigidPinsWorld(p, dragging)
  const cx = (a[0] + b[0]) / 2
  const cz = (a[2] + b[2]) / 2
  const L = Math.hypot(b[0] - a[0], b[2] - a[2])
  const ang = Math.atan2(b[2] - a[2], b[0] - a[0])
  const H = p.kind === 'resistor' ? 0.34 : 0.4
  const h = useHandlers(p.id, undefined, [cx, cz])

  const flowCurve = useMemo(
    () =>
      polyline([
        [a[0], a[1], a[2]],
        [a[0], a[1] + H, a[2]],
        [b[0], b[1] + H, b[2]],
        [b[0], b[1], b[2]],
      ]),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [...a, ...b, H],
  )

  return (
    <group>
      <group position={[cx, a[1], cz]} rotation={[0, -ang, 0]} {...h}>
        {/* patas */}
        {[-L / 2, L / 2].map((x, i) => (
          <mesh key={i} position={[x, (H + (p.kind === 'led' && i === 0 ? 0.04 : 0)) / 2 - 0.02, 0]}>
            <cylinderGeometry args={[0.022, 0.022, H + 0.04 + (p.kind === 'led' && i === 0 ? 0.04 : 0), 8]} />
            <meshStandardMaterial color={LEG} metalness={0.5} roughness={0.35} />
          </mesh>
        ))}
        <mesh position={[0, H, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.022, 0.022, L, 8]} />
          <meshStandardMaterial color={LEG} metalness={0.5} roughness={0.35} />
        </mesh>
        <group position={[0, H, 0]}>
          {p.kind === 'resistor' && <ResistorBody ohms={p.ohms} selected={selected} heat={heat} />}
          {p.kind === 'led' && <LedBody p={p} glow={glow} selected={selected} />}
          {p.kind === 'bulb' && <BulbBody glow={glow} selected={selected} />}
        </group>
        <mesh position={[0, H, 0]} visible={false}>
          <boxGeometry args={[Math.max(L, 0.6) + 0.2, 0.7, 0.5]} />
        </mesh>
      </group>
      <Flow curve={flowCurve} current={current} />
    </group>
  )
}

const selEmissive = (selected: boolean) => (selected ? { emissive: '#ffb066', emissiveIntensity: 0.28 } : {})

function ResistorBody({ ohms, selected, heat }: { ohms: number; selected: boolean; heat: number }) {
  // Se pone al rojo a medida que se acerca a su potencia nominal; pasado el doble, humea.
  const hot = Math.min(1, Math.max(0, (heat - 0.5) / 1.5))
  const [d1, d2, m] = colorBands(ohms)
  const bands = [BAND_COLORS[d1].hex, BAND_COLORS[d2].hex, BAND_COLORS[m].hex, GOLD.hex]
  const xs = [-0.2, -0.1, 0, 0.19]
  return (
    <group>
      <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
        <capsuleGeometry args={[0.12, 0.42, 8, 18]} />
        <meshStandardMaterial color={hot > 0.3 ? '#c9875a' : '#e3c99a'} roughness={0.75} {...(hot > 0 ? { emissive: '#ff4a1a', emissiveIntensity: hot * 1.6 } : selEmissive(selected))} />
      </mesh>
      {bands.map((c, i) => (
        <mesh key={i} position={[xs[i], 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.124, 0.124, 0.05, 18]} />
          <meshStandardMaterial color={c} roughness={0.6} metalness={i === 3 ? 0.4 : 0} />
        </mesh>
      ))}
      {heat > 2 && <Smoke />}
    </group>
  )
}

function LedBody({ p, glow, selected }: { p: LedPart; glow: number; selected: boolean }) {
  const color = p.burned ? '#4a403b' : LED_HEX[p.color]
  return (
    <group position={[0, 0.02, 0]}>
      <mesh position={[0, 0.02, 0]}>
        <cylinderGeometry args={[0.19, 0.19, 0.05, 20]} />
        <meshStandardMaterial color={color} transparent opacity={0.9} {...selEmissive(selected)} />
      </mesh>
      <mesh position={[0, 0.17, 0]} castShadow>
        <cylinderGeometry args={[0.16, 0.16, 0.26, 20]} />
        <meshStandardMaterial color={color} transparent opacity={0.82} roughness={0.25} emissive={color} emissiveIntensity={0.05 + glow * 3} />
      </mesh>
      <mesh position={[0, 0.3, 0]}>
        <sphereGeometry args={[0.16, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color={color} transparent opacity={0.82} roughness={0.25} emissive={color} emissiveIntensity={0.05 + glow * 3} />
      </mesh>
      {/* La luz siempre existe (intensidad 0 si está apagado): agregar/quitar luces recompila todos los shaders. */}
      <pointLight position={[0, 0.5, 0]} color={color} intensity={glow * 4} distance={3} decay={1.5} />
      {p.burned && <Smoke />}
    </group>
  )
}

function Smoke() {
  const g = useRef<THREE.Group>(null)
  useFrame(({ clock }) => {
    g.current?.children.forEach((c, i) => {
      const t = (clock.elapsedTime * 0.4 + i / 4) % 1
      c.position.set(Math.sin(t * 5 + i) * 0.1, 0.4 + t * 1.2, 0)
      c.scale.setScalar(0.5 + t)
      ;((c as THREE.Mesh).material as THREE.MeshStandardMaterial).opacity = 0.35 * (1 - t)
    })
  })
  return (
    <group ref={g}>
      {[0, 1, 2, 3].map((i) => (
        <mesh key={i}>
          <sphereGeometry args={[0.1, 10, 8]} />
          <meshStandardMaterial color="#8a8580" transparent opacity={0.3} depthWrite={false} />
        </mesh>
      ))}
    </group>
  )
}

function BulbBody({ glow, selected }: { glow: number; selected: boolean }) {
  return (
    <group>
      <mesh position={[0, 0.1, 0]} castShadow>
        <cylinderGeometry args={[0.17, 0.2, 0.22, 18]} />
        <meshStandardMaterial color="#9c948a" metalness={0.5} roughness={0.4} {...selEmissive(selected)} />
      </mesh>
      <mesh position={[0, 0.48, 0]}>
        <sphereGeometry args={[0.32, 24, 18]} />
        <meshStandardMaterial color={glow > 0.05 ? '#ffe6a8' : '#fff6df'} transparent opacity={0.45 + glow * 0.45} roughness={0.1} emissive="#ffc46b" emissiveIntensity={glow * 4} />
      </mesh>
      {glow > 0.05 && (
        <mesh position={[0, 0.48, 0]}>
          <sphereGeometry args={[0.55, 20, 14]} />
          <meshBasicMaterial color="#ffcf7a" transparent opacity={0.18 * glow} depthWrite={false} blending={THREE.AdditiveBlending} />
        </mesh>
      )}
      <mesh position={[0, 0.46, 0]}>
        <torusGeometry args={[0.08, 0.015, 6, 16]} />
        <meshStandardMaterial color="#6b5a4a" emissive="#ffb04a" emissiveIntensity={glow * 6} />
      </mesh>
      <pointLight position={[0, 0.5, 0]} color="#ffc46b" intensity={glow * 9} distance={5} decay={1.4} />
    </group>
  )
}

// ---------- fuente / batería ----------

export function SourceView({ p }: { p: SourcePart }) {
  const drag = useBench((s) => (s.drag?.id === p.id ? (s.drag.pin ?? 'body') : null))
  const selected = useBench((s) => s.selected === p.id)
  const current = useBench((s) => s.sim.partI[p.id] ?? 0)
  const short = useBench((s) => s.sim.warnings.some((w) => w.kind === 'short' && w.partId === p.id))
  const interactive = useContext(InteractiveCtx)
  const h = useHandlers(p.id, undefined, [p.x, p.z])
  const t = sourceTerminals(p)
  const lift = drag === 'body' ? 0.4 : 0
  const plusEnd = endWorld(p.plus, drag === 'plus')
  const minusEnd = endWorld(p.minus, drag === 'minus')
  const shake = useRef<THREE.Group>(null)
  useFrame(({ clock }) => {
    if (shake.current) shake.current.position.x = short ? Math.sin(clock.elapsedTime * 60) * 0.02 : 0
  })
  const toggle = () => useBench.getState().update(p.id, { on: !p.on })

  return (
    <group>
      <group ref={shake}>
        <group position={[p.x, lift, p.z]} {...h}>
          {p.style === 'battery' ? (
            <>
              <RoundedBox args={[1.05, 0.78, 1.7]} radius={0.12} position={[0, 0.39, 0]} castShadow>
                <meshStandardMaterial color={short ? '#7a3b30' : '#34302d'} roughness={0.7} {...selEmissive(selected)} />
              </RoundedBox>
              <RoundedBox args={[1.08, 0.8, 0.8]} radius={0.1} position={[0, 0.39, 0.25]}>
                <meshStandardMaterial color="#e3923f" roughness={0.7} />
              </RoundedBox>
              <mesh position={[0.24, 0.84, -0.62]}>
                <cylinderGeometry args={[0.1, 0.1, 0.12, 6]} />
                <meshStandardMaterial color="#cfc6b8" metalness={0.6} roughness={0.3} />
              </mesh>
              <mesh position={[-0.24, 0.84, -0.62]}>
                <cylinderGeometry args={[0.13, 0.13, 0.12, 6]} />
                <meshStandardMaterial color="#cfc6b8" metalness={0.6} roughness={0.3} />
              </mesh>
              <TextPlane text={fmtV(p.volts)} width={0.95} height={0.42} color="#3a2a1f" font="display" weight={800} position={[0, 0.8, 0.25]} />
            </>
          ) : (
            <>
              <RoundedBox args={[2.0, 1.3, 1.6]} radius={0.16} position={[0, 0.65, 0]} castShadow>
                <meshStandardMaterial color={short ? '#b0705e' : '#d8c6a3'} roughness={0.8} {...selEmissive(selected)} />
              </RoundedBox>
              <mesh position={[0, 0.85, 0.81]}>
                <planeGeometry args={[1.7, 0.75]} />
                <meshStandardMaterial color="#6b5a4a" roughness={0.9} />
              </mesh>
              <TextPlane text={p.on ? fmtV(p.volts) : '----'} width={0.95} height={0.4} bg="#b5c39e" align="right" position={[-0.35, 0.95, 0.815]} rotation={[0, 0, 0]} />
              <mesh position={[0.55, 0.92, 0.86]} rotation={[Math.PI / 2, (p.volts / 20) * Math.PI * 1.5, 0]}>
                <cylinderGeometry args={[0.2, 0.2, 0.14, 20]} />
                <meshStandardMaterial color="#3a2f28" roughness={0.6} />
              </mesh>
              <mesh position={[0.75, 0.42, 0.88]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.1, 0.1, 0.14, 12]} />
                <meshStandardMaterial color="#c8574a" />
              </mesh>
              <mesh position={[0.25, 0.42, 0.88]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.1, 0.1, 0.14, 12]} />
                <meshStandardMaterial color="#2f2a28" />
              </mesh>
            </>
          )}
          {/* interruptor */}
          <group
            position={p.style === 'battery' ? [0, 0.8, -0.15] : [-0.6, 0.42, 0.85]}
            onPointerDown={(e) => {
              e.stopPropagation()
              if (interactive) toggle()
            }}
          >
            <RoundedBox args={[0.42, 0.1, 0.22]} radius={0.04}>
              <meshStandardMaterial color="#2a2522" />
            </RoundedBox>
            <mesh position={[p.on ? 0.1 : -0.1, 0.08, 0]}>
              <boxGeometry args={[0.16, 0.1, 0.16]} />
              <meshStandardMaterial color={p.on ? '#79c46a' : '#9a8f86'} emissive={p.on ? '#5fb04f' : '#000'} emissiveIntensity={p.on ? 0.6 : 0} />
            </mesh>
          </group>
        </group>
      </group>
      <Cable from={addY(t.plus, lift)} to={[plusEnd[0], plusEnd[1] + TIP_TOP, plusEnd[2]]} color="#c8574a" current={current} />
      <Cable from={addY(t.minus, lift)} to={[minusEnd[0], minusEnd[1] + TIP_TOP, minusEnd[2]]} color="#2f2a28" current={-current} />
      <PinTip partId={p.id} pin="plus" end={p.plus} color="#c8574a" />
      <PinTip partId={p.id} pin="minus" end={p.minus} color="#2f2a28" />
    </group>
  )
}

const addY = (v: V3, dy: number): V3 => [v[0], v[1] + dy, v[2]]
const fmtV = (v: number) => `${Number(v.toFixed(1)).toString().replace('.', ',')} V`

// ---------- tester ----------

const MODE_ANGLE: Record<MeterMode, number> = { off: -90, V: -150, ohm: -30, A: 30 }

export function MeterView({ p }: { p: MeterPart }) {
  const drag = useBench((s) => (s.drag?.id === p.id ? (s.drag.pin ?? 'body') : null))
  const selected = useBench((s) => s.selected === p.id)
  const reading = useBench((s) => s.sim.meter)
  const current = useBench((s) => s.sim.partI[p.id] ?? 0)
  const interactive = useContext(InteractiveCtx)
  const h = useHandlers(p.id, undefined, [p.x, p.z])
  const lift = drag === 'body' ? 0.4 : 0
  const jacks = meterJacks(p)
  const red = endWorld(p.red, drag === 'red')
  const black = endWorld(p.black, drag === 'black')
  const disp = meterDisplay(reading)
  const knob = useRef<THREE.Group>(null)
  useFrame(() => {
    if (!knob.current) return
    const target = (-MODE_ANGLE[p.mode] * Math.PI) / 180
    knob.current.rotation.y += (target - knob.current.rotation.y) * 0.18
  })

  return (
    <group>
      <group position={[p.x, lift, p.z]} {...h}>
        <RoundedBox args={[2.3, 0.5, 3.2]} radius={0.18} position={[0, 0.25, 0]} castShadow>
          <meshStandardMaterial color="#e8b04a" roughness={0.75} {...selEmissive(selected)} />
        </RoundedBox>
        <RoundedBox args={[1.95, 0.06, 2.85]} radius={0.025} position={[0, 0.5, 0]}>
          <meshStandardMaterial color="#3d3530" roughness={0.9} />
        </RoundedBox>
        <TextPlane text={disp.main} sub={disp.unit} width={1.65} height={0.66} bg="#b5c39e" position={[0, 0.56, -0.85]} />
        <group position={[0, 0.55, 0.3]}>
          <group ref={knob}>
            <mesh castShadow>
              <cylinderGeometry args={[0.5, 0.52, 0.16, 32]} />
              <meshStandardMaterial color="#2a2522" roughness={0.6} />
            </mesh>
            <mesh position={[0.3, 0.1, 0]}>
              <boxGeometry args={[0.45, 0.06, 0.1]} />
              <meshStandardMaterial color="#f2e8d5" />
            </mesh>
          </group>
          {(Object.keys(MODE_ANGLE) as MeterMode[]).map((m) => {
            const a = (MODE_ANGLE[m] * Math.PI) / 180
            return (
              <TextPlane
                key={m}
                text={MODE_LABEL[m]}
                width={0.46}
                height={0.24}
                color={p.mode === m ? '#3a2a1f' : '#f2e8d5'}
                bg={p.mode === m ? '#e0913c' : undefined}
                position={[Math.cos(a) * 0.8, 0.012, Math.sin(a) * 0.8]}
                onClick={(e) => {
                  e.stopPropagation()
                  if (interactive) useBench.getState().setMode(m)
                }}
              />
            )
          })}
        </group>
        <mesh position={[0.55, 0.53, 1.25]}>
          <cylinderGeometry args={[0.11, 0.11, 0.06, 16]} />
          <meshStandardMaterial color="#c8574a" />
        </mesh>
        <mesh position={[-0.05, 0.53, 1.25]}>
          <cylinderGeometry args={[0.11, 0.11, 0.06, 16]} />
          <meshStandardMaterial color="#1f1b19" />
        </mesh>
        <TextPlane text="COM" width={0.42} height={0.16} color="#f2e8d5" position={[-0.05, 0.56, 1.47]} />
        <TextPlane text="VΩmA" width={0.5} height={0.16} color="#f2e8d5" position={[0.55, 0.56, 1.47]} />
      </group>
      <Cable from={addY(jacks.red, lift)} to={[red[0], red[1] + PROBE_TOP, red[2]]} color="#c8574a" current={-current} radius={0.045} />
      <Cable from={addY(jacks.black, lift)} to={[black[0], black[1] + PROBE_TOP, black[2]]} color="#2f2a28" current={current} radius={0.045} />
      <ProbeTip partId={p.id} pin="red" end={p.red} color="#c8574a" />
      <ProbeTip partId={p.id} pin="black" end={p.black} color="#2f2a28" />
    </group>
  )
}

export function PartView({ p }: { p: Part }) {
  switch (p.kind) {
    case 'wire':
      return <WireView p={p} />
    case 'source':
      return <SourceView p={p} />
    case 'meter':
      return <MeterView p={p} />
    default:
      return <RigidView p={p} />
  }
}
