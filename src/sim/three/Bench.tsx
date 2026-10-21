// El banco 3D: mesa, protoboard, piezas y cámara orbital.

import { OrbitControls } from '@react-three/drei'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Suspense, useEffect, useRef, useState, type ReactNode } from 'react'
import * as THREE from 'three'
import { flexEnds, isRigid, type Part } from '../../engine/types'
import { endPos, rigidCenter, useBench } from '../benchStore'
import { Desk, type DecorId } from './Desk'
import { DragController } from './DragController'
import { InteractiveCtx, PartView } from './Parts'
import { Protoboard } from './Protoboard'

export type BenchProps = {
  interactive?: boolean
  decor?: DecorId[]
  /** Ancho (en unidades de mesa) que tiene que entrar en cuadro. */
  fit?: number | 'auto'
  target?: [number, number, number]
  /** Cámara girando sola (fondo del inicio). */
  autoRotate?: boolean
  children?: ReactNode
}

/** Caja (en XZ) que ocupan las piezas de la escena, para encuadrarlas. */
function partsBox(parts: Part[]) {
  const xs: number[] = []
  const zs: number[] = []
  const add = (x: number, z: number, r = 0.4) => {
    xs.push(x - r, x + r)
    zs.push(z - r, z + r)
  }
  for (const p of parts) {
    if (isRigid(p)) add(...rigidCenter(p))
    else {
      if (p.kind === 'source') add(p.x, p.z, 1.1)
      if (p.kind === 'meter') add(p.x, p.z, 1.4)
      for (const [, e] of flexEnds(p)) add(...endPos(e))
    }
  }
  if (!xs.length) return null
  const [x0, x1, z0, z1] = [Math.min(...xs), Math.max(...xs), Math.min(...zs), Math.max(...zs)]
  return { cx: (x0 + x1) / 2, cz: (z0 + z1) / 2, w: x1 - x0, d: z1 - z0 }
}

/** Avisa cuando ya se dibujó el primer cuadro (para sacar el velo de carga). */
function FirstFrame({ onReady }: { onReady: () => void }) {
  const done = useRef(false)
  useFrame(() => {
    if (done.current) return
    done.current = true
    onReady()
  })
  return null
}

function FitCamera({ fit, target }: { fit: number | 'auto'; target: [number, number, number] }) {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera
  const size = useThree((s) => s.size)
  const controls = useThree((s) => s.controls) as unknown as { target: THREE.Vector3; update: () => void } | null
  const loadId = useBench((s) => s.loadId)
  useEffect(() => {
    let width = typeof fit === 'number' ? fit : 12
    let t = new THREE.Vector3(...target)
    if (fit === 'auto') {
      const box = partsBox(useBench.getState().parts)
      if (box) {
        width = Math.max(9, box.w + 2.2, (box.d + 2.2) / 0.62)
        t = new THREE.Vector3(box.cx, 0, box.cz + 0.3)
      }
    }
    const aspect = size.width / Math.max(1, size.height)
    const half = THREE.MathUtils.degToRad(camera.fov / 2)
    const d = Math.max(width / 2 / (Math.tan(half) * aspect), (width * 0.55) / 2 / Math.tan(half))
    camera.position.copy(new THREE.Vector3(0, 0.78, 0.63).normalize().multiplyScalar(d).add(t))
    camera.lookAt(t)
    if (controls) {
      controls.target.copy(t)
      controls.update()
    }
  }, [size.width, size.height, fit, camera, controls, loadId, target[0], target[1], target[2]])
  return null
}

function Scene({ interactive, decor, autoRotate }: Required<Pick<BenchProps, 'interactive' | 'autoRotate'>> & { decor: DecorId[] }) {
  const parts = useBench((s) => s.parts)
  const dragging = useBench((s) => !!s.drag)
  return (
    <>
      <color attach="background" args={['#3b2c22']} />
      <fog attach="fog" args={['#3b2c22', 30, 60]} />
      <hemisphereLight args={['#ffe9cc', '#5a4030', 0.9]} />
      <directionalLight
        position={[-7, 14, 6]}
        intensity={1.7}
        color="#ffe0b8"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-16}
        shadow-camera-right={16}
        shadow-camera-top={12}
        shadow-camera-bottom={-12}
        shadow-bias={-0.0004}
        shadow-radius={6}
      />
      <Desk decor={decor} />
      <InteractiveCtx.Provider value={interactive}>
        <Protoboard interactive={interactive} />
        {parts.map((p) => (
          <PartView key={p.id} p={p} />
        ))}
      </InteractiveCtx.Provider>
      {interactive && <DragController />}
      <OrbitControls
        makeDefault
        enabled={!dragging}
        enableDamping
        dampingFactor={0.08}
        minPolarAngle={0.15}
        maxPolarAngle={1.25}
        minDistance={5}
        maxDistance={30}
        autoRotate={autoRotate}
        autoRotateSpeed={0.25}
        enableZoom={interactive}
        enablePan={interactive}
        enableRotate={interactive || autoRotate}
        mouseButtons={{ LEFT: THREE.MOUSE.ROTATE, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.PAN }}
      />
    </>
  )
}

export function Bench({ interactive = true, decor = [], fit = 18, target = [0, 0, 0.4], autoRotate = false, children }: BenchProps) {
  const [ready, setReady] = useState(false)
  return (
    <div className="relative h-full w-full overflow-hidden">
      <Canvas
        shadows="soft"
        dpr={[1, 2]}
        camera={{ fov: 35, position: [0, 13, 10], near: 0.1, far: 120 }}
        onPointerMissed={() => useBench.getState().select(null)}
      >
        <Suspense fallback={null}>
          <Scene interactive={interactive} decor={decor} autoRotate={autoRotate} />
          <FitCamera fit={fit} target={target} />
          <FirstFrame onReady={() => setReady(true)} />
        </Suspense>
      </Canvas>
      <div className={'pointer-events-none absolute inset-0 flex items-center justify-center bg-night transition-opacity duration-700 ' + (ready ? 'opacity-0' : 'opacity-100')} aria-hidden={ready}>
        <div className="animate-pulse font-display text-lg text-paper/70 italic">acomodando el taller…</div>
      </div>
      {children}
    </div>
  )
}
