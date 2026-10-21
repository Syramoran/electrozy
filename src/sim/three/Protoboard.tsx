import { RoundedBox } from '@react-three/drei'
import type { ThreeEvent } from '@react-three/fiber'
import { BOARD_D, BOARD_TOP, BOARD_W, COLS, PITCH, holePos, isBus, nearestHole, type Hole } from '../../engine/board'
import { useBench } from '../benchStore'
import { boardTexture } from './textures'

/** Rectángulo (en XZ) que ocupa la tira interna de un agujero. */
function stripRect(h: Hole) {
  if (isBus(h.r)) {
    const [, z] = holePos(h)
    const [x0] = holePos({ r: h.r, c: 0 })
    const [x1] = holePos({ r: h.r, c: COLS - 1 })
    return { x: (x0 + x1) / 2, z, w: x1 - x0 + PITCH * 0.8, d: PITCH * 0.7 }
  }
  const top = h.r <= 6
  const [x, z0] = holePos({ r: top ? 2 : 7, c: h.c })
  const [, z1] = holePos({ r: top ? 6 : 11, c: h.c })
  return { x, z: (z0 + z1) / 2, w: PITCH * 0.7, d: z1 - z0 + PITCH * 0.7 }
}

function Strip({ hole, color, opacity }: { hole: Hole; color: string; opacity: number }) {
  const s = stripRect(hole)
  return (
    <mesh position={[s.x, BOARD_TOP + 0.006, s.z]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[s.w, s.d]} />
      <meshBasicMaterial color={color} transparent opacity={opacity} depthWrite={false} />
    </mesh>
  )
}

export function Protoboard({ interactive }: { interactive: boolean }) {
  const preview = useBench((s) => s.preview)
  const hover = useBench((s) => s.hoverHole)
  const dragging = useBench((s) => !!s.drag)

  const onMove = (e: ThreeEvent<PointerEvent>) => {
    if (!interactive || dragging) return
    useBench.getState().setHover(nearestHole(e.point.x, e.point.z, PITCH * 0.5))
  }

  return (
    <group>
      <RoundedBox args={[BOARD_W, BOARD_TOP, BOARD_D]} radius={0.08} position={[0, BOARD_TOP / 2, 0]} castShadow receiveShadow>
        <meshStandardMaterial color="#e9dfcb" roughness={0.9} />
      </RoundedBox>
      <mesh
        position={[0, BOARD_TOP + 0.002, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
        onPointerMove={onMove}
        onPointerOut={() => useBench.getState().setHover(null)}
      >
        <planeGeometry args={[BOARD_W - 0.08, BOARD_D - 0.08]} />
        <meshStandardMaterial map={boardTexture()} roughness={0.9} />
      </mesh>

      {dragging &&
        preview.map((h) => (
          <group key={`${h.r}:${h.c}`}>
            <Strip hole={h} color="#f0a64a" opacity={0.35} />
            <mesh position={[holePos(h)[0], BOARD_TOP + 0.01, holePos(h)[1]]} rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[0.07, 0.12, 24]} />
              <meshBasicMaterial color="#e07b2c" />
            </mesh>
          </group>
        ))}
      {!dragging && hover && <Strip hole={hover} color="#7fb0d9" opacity={0.3} />}
    </group>
  )
}
