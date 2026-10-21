// El escritorio del taller: madera, plancha de corte, lámpara y objetitos que dan vida.

import { RoundedBox } from '@react-three/drei'
import { useFrame, type ThreeEvent } from '@react-three/fiber'
import { useRef } from 'react'
import type * as THREE from 'three'
import { sfx } from '../../lib/sound'
import { useProgress } from '../../store/progress'
import { TextPlane } from './TextPlane'
import { matTexture, woodTexture } from './textures'

const mat = (color: string, rough = 0.85) => <meshStandardMaterial color={color} roughness={rough} />

export type DecorId = 'potus' | 'radio' | 'foto' | 'gato' | 'guirnalda' | 'mate' | 'reloj' | 'libros' | 'diploma' | 'fuente' | 'banderines'

export function Desk({ decor = [] }: { decor?: DecorId[] }) {
  return (
    <group>
      {/* mesa */}
      <mesh position={[0, -0.46, 0]} receiveShadow>
        <boxGeometry args={[40, 0.8, 24]} />
        <meshStandardMaterial map={woodTexture()} roughness={0.75} />
      </mesh>
      {/* plancha de corte */}
      <RoundedBox args={[16.5, 0.06, 9.6]} radius={0.025} position={[0, -0.03, 0.3]} receiveShadow>
        <meshStandardMaterial map={matTexture()} roughness={0.95} />
      </RoundedBox>

      {/* pared con tablero perforado */}
      <mesh position={[0, 6, -10.2]} receiveShadow>
        <planeGeometry args={[60, 14]} />
        {mat('#6b5040')}
      </mesh>
      <RoundedBox args={[18, 6, 0.15]} radius={0.08} position={[2, 4.2, -10.05]} receiveShadow>
        {mat('#c9a77c')}
      </RoundedBox>
      {[...Array(5)].map((_, i) => (
        <mesh key={i} position={[-4 + i * 3, 5.2 - (i % 2) * 0.8, -9.8]} rotation={[0, 0, (i - 2) * 0.2]} castShadow>
          <boxGeometry args={[0.25, 1.8, 0.15]} />
          {mat(['#c8664d', '#4f7bb0', '#e1b54f', '#5f9a55', '#86609c'][i])}
        </mesh>
      ))}

      <Lamp position={[-10.8, 0, -5.6]} />
      <Mug position={[10.6, 0, -4.8]} />
      <Drawers position={[6.2, 0, -7.3]} />
      <Notebook position={[-11.4, 0, 3.4]} />
      <SolderStand position={[11.3, 0, 3]} />

      {decor.includes('potus') && <Plant position={[-13, 0, -1.5]} />}
      {decor.includes('radio') && <Radio position={[-1.5, 0, -7.6]} />}
      {decor.includes('foto') && <Frame position={[-5.6, 0, -7.6]} />}
      {decor.includes('gato') && <Cat position={[13.2, 0, -0.8]} />}
      {decor.includes('mate') && <Mate position={[10, 0, -1.6]} />}
      {decor.includes('reloj') && <Clock position={[-9.5, 6.6, -10.1]} />}
      {decor.includes('libros') && <Books position={[-8.4, 0, -7.9]} />}
      {decor.includes('diploma') && <Diploma position={[13.5, 5.2, -10.1]} />}
      {decor.includes('fuente') && <LabSupply position={[6.2, 2.2, -7.4]} />}
      {decor.includes('banderines') && <Bunting />}
      {decor.includes('guirnalda') && <Garland />}
    </group>
  )
}

type P = { position: [number, number, number] }

function Lamp({ position }: P) {
  return (
    <group position={position}>
      <mesh position={[0, 0.12, 0]} castShadow>
        <cylinderGeometry args={[0.9, 1, 0.24, 32]} />
        {mat('#d9a441', 0.6)}
      </mesh>
      <mesh position={[0, 1.9, 0]} rotation={[0, 0, 0.18]} castShadow>
        <cylinderGeometry args={[0.09, 0.09, 3.6, 12]} />
        {mat('#d9a441', 0.6)}
      </mesh>
      <mesh position={[0.9, 3.9, 0.9]} rotation={[0.7, 0, -0.9]} castShadow>
        <cylinderGeometry args={[0.08, 0.08, 2.4, 12]} />
        {mat('#d9a441', 0.6)}
      </mesh>
      <group position={[1.9, 4.6, 1.9]} rotation={[0.6, 0.8, 0.3]}>
        <mesh castShadow>
          <coneGeometry args={[0.95, 1.2, 32, 1, true]} />
          <meshStandardMaterial color="#d9a441" roughness={0.6} side={2} />
        </mesh>
        <mesh position={[0, -0.25, 0]}>
          <sphereGeometry args={[0.32, 16, 16]} />
          <meshStandardMaterial color="#fff2cf" emissive="#ffcf7a" emissiveIntensity={2.5} />
        </mesh>
      </group>
      <pointLight position={[2.4, 3.9, 2.6]} color="#ffbb6e" intensity={60} distance={22} decay={1.6} />
    </group>
  )
}

function Mug({ position }: P) {
  return (
    <group position={position}>
      <mesh position={[0, 0.65, 0]} castShadow>
        <cylinderGeometry args={[0.65, 0.58, 1.3, 32]} />
        {mat('#c8664d')}
      </mesh>
      <mesh position={[0, 1.22, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.56, 32]} />
        {mat('#5a3622', 0.3)}
      </mesh>
      <mesh position={[0.7, 0.68, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <torusGeometry args={[0.3, 0.09, 12, 24, Math.PI]} />
        {mat('#c8664d')}
      </mesh>
      <Steam />
    </group>
  )
}

function Steam() {
  const g = useRef<THREE.Group>(null)
  useFrame(({ clock }) => {
    g.current?.children.forEach((c, i) => {
      const t = (clock.elapsedTime * 0.35 + i / 3) % 1
      c.position.y = 1.4 + t * 1.6
      c.position.x = Math.sin(t * 6 + i) * 0.15
      const m = (c as THREE.Mesh).material as THREE.MeshStandardMaterial
      m.opacity = 0.22 * Math.sin(t * Math.PI)
    })
  })
  return (
    <group ref={g}>
      {[0, 1, 2].map((i) => (
        <mesh key={i}>
          <sphereGeometry args={[0.16 + i * 0.03, 12, 12]} />
          <meshStandardMaterial color="#fff" transparent opacity={0.2} depthWrite={false} />
        </mesh>
      ))}
    </group>
  )
}

function Drawers({ position }: P) {
  const fronts = ['#e1b54f', '#8fb39a', '#d9826b', '#a7c0d6', '#e1b54f', '#d9826b']
  return (
    <group position={position}>
      <RoundedBox args={[4.2, 2.2, 1.8]} radius={0.15} position={[0, 1.1, 0]} castShadow receiveShadow>
        {mat('#9a6b45')}
      </RoundedBox>
      {fronts.map((c, i) => (
        <group key={i} position={[-1.35 + (i % 3) * 1.35, 0.6 + Math.floor(i / 3) * 1, 0.92]}>
          <RoundedBox args={[1.15, 0.8, 0.12]} radius={0.05}>
            {mat(c)}
          </RoundedBox>
          <mesh position={[0, 0, 0.1]}>
            <sphereGeometry args={[0.08, 12, 12]} />
            {mat('#5b4232', 0.4)}
          </mesh>
        </group>
      ))}
    </group>
  )
}

function Notebook({ position }: P) {
  return (
    <group position={position} rotation={[0, 0.35, 0]}>
      <RoundedBox args={[3.2, 0.22, 4]} radius={0.06} position={[0, 0.11, 0]} castShadow receiveShadow>
        {mat('#7d5a8c')}
      </RoundedBox>
      <mesh position={[0.08, 0.23, 0]} receiveShadow>
        <boxGeometry args={[2.9, 0.02, 3.8]} />
        {mat('#f4ecdc')}
      </mesh>
      <mesh position={[1.2, 0.32, 0.4]} rotation={[Math.PI / 2, 0, 0.5]} castShadow>
        <cylinderGeometry args={[0.07, 0.07, 2.6, 6]} />
        {mat('#e6b84a')}
      </mesh>
    </group>
  )
}

function SolderStand({ position }: P) {
  return (
    <group position={position} rotation={[0, -0.5, 0]}>
      <RoundedBox args={[1.8, 0.3, 1.4]} radius={0.1} position={[0, 0.15, 0]} castShadow>
        {mat('#4d4540')}
      </RoundedBox>
      {[0, 1, 2, 3, 4].map((i) => (
        <mesh key={i} position={[0.2, 0.55 + i * 0.16, 0]} rotation={[0, 0, 0.6]}>
          <torusGeometry args={[0.3, 0.035, 8, 20]} />
          {mat('#b9b2a8', 0.35)}
        </mesh>
      ))}
      <mesh position={[-0.3, 1.05, 0]} rotation={[0, 0, 0.6]} castShadow>
        <cylinderGeometry args={[0.13, 0.13, 1.6, 16]} />
        {mat('#3a7a8c')}
      </mesh>
      <mesh position={[0.45, 0.6, -0.4]} castShadow>
        <cylinderGeometry args={[0.3, 0.3, 0.25, 16]} />
        {mat('#cfc6b8', 0.4)}
      </mesh>
    </group>
  )
}

function Plant({ position }: P) {
  return (
    <group position={position}>
      <mesh position={[0, 0.6, 0]} castShadow>
        <cylinderGeometry args={[0.9, 0.7, 1.2, 24]} />
        {mat('#c7704f')}
      </mesh>
      {[...Array(9)].map((_, i) => {
        const a = (i / 9) * Math.PI * 2
        return (
          <mesh key={i} position={[Math.cos(a) * 0.65, 1.5 + (i % 3) * 0.3, Math.sin(a) * 0.65]} rotation={[Math.sin(a) * 0.6, a, Math.cos(a) * 0.6]} castShadow>
            <sphereGeometry args={[0.42, 12, 10]} />
            {mat(i % 2 ? '#5f9a55' : '#79b36a')}
          </mesh>
        )
      })}
    </group>
  )
}

function Radio({ position }: P) {
  return (
    <group position={position}>
      <RoundedBox args={[3.2, 1.8, 1.2]} radius={0.25} position={[0, 0.9, 0]} castShadow>
        {mat('#d8c6a3')}
      </RoundedBox>
      <mesh position={[-0.6, 0.95, 0.61]}>
        <circleGeometry args={[0.6, 32]} />
        {mat('#8a6a4f')}
      </mesh>
      <mesh position={[0.9, 1.2, 0.62]}>
        <cylinderGeometry args={[0.2, 0.2, 0.12, 16]} />
        {mat('#5b4232')}
      </mesh>
      <mesh position={[1.3, 2.4, 0]} rotation={[0, 0, -0.5]}>
        <cylinderGeometry args={[0.03, 0.03, 1.6, 6]} />
        {mat('#b9b2a8', 0.3)}
      </mesh>
    </group>
  )
}

function Frame({ position }: P) {
  return (
    <group position={position} rotation={[-0.15, 0.2, 0]}>
      <RoundedBox args={[1.8, 2.2, 0.18]} radius={0.06} position={[0, 1.1, 0]} castShadow>
        {mat('#6b4a33')}
      </RoundedBox>
      <mesh position={[0, 1.1, 0.1]}>
        <planeGeometry args={[1.4, 1.8]} />
        {mat('#a7c0d6')}
      </mesh>
      <mesh position={[0, 0.85, 0.11]}>
        <circleGeometry args={[0.45, 24]} />
        {mat('#79b36a')}
      </mesh>
      <mesh position={[0.3, 1.5, 0.11]}>
        <circleGeometry args={[0.2, 24]} />
        {mat('#f2d27a')}
      </mesh>
    </group>
  )
}

/** Tocar objetos del escritorio suma a logros secretos. */
function pet(stat: string) {
  return (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation()
    sfx.pop()
    useProgress.getState().bump(stat)
  }
}
const pointer = { onPointerOver: () => (document.body.style.cursor = 'pointer'), onPointerOut: () => (document.body.style.cursor = '') }

function Cat({ position }: P) {
  const body = useRef<THREE.Mesh>(null)
  useFrame(({ clock }) => {
    if (body.current) body.current.scale.y = 1 + Math.sin(clock.elapsedTime * 1.4) * 0.04
  })
  return (
    <group position={position} rotation={[0, -0.6, 0]} onClick={pet('catPets')} {...pointer}>
      <mesh ref={body} position={[0, 0.55, 0]} scale={[1.3, 1, 1]} castShadow>
        <sphereGeometry args={[0.75, 24, 16]} />
        {mat('#e09a58')}
      </mesh>
      <mesh position={[0.9, 0.45, 0.2]} castShadow>
        <sphereGeometry args={[0.45, 20, 16]} />
        {mat('#e09a58')}
      </mesh>
      {[-0.18, 0.18].map((dz) => (
        <mesh key={dz} position={[1.0, 0.85, 0.2 + dz]} rotation={[0, 0, -0.2]}>
          <coneGeometry args={[0.13, 0.28, 4]} />
          {mat('#d08848')}
        </mesh>
      ))}
      <mesh position={[-0.6, 0.25, 0.65]} rotation={[0.2, 0.9, Math.PI / 2]}>
        <torusGeometry args={[0.55, 0.13, 10, 20, Math.PI]} />
        {mat('#d08848')}
      </mesh>
    </group>
  )
}

function Garland() {
  const colors = ['#ffcf7a', '#ff9f80', '#c6e59f', '#ffe3a3']
  return (
    <group position={[0, 3.4, -9.6]}>
      {[...Array(16)].map((_, i) => {
        const x = -13 + i * 1.75
        const y = -Math.sin((i / 15) * Math.PI) * 1.1
        return (
          <mesh key={i} position={[x, y, 0]}>
            <sphereGeometry args={[0.17, 12, 12]} />
            <meshStandardMaterial color={colors[i % 4]} emissive={colors[i % 4]} emissiveIntensity={1.6} />
          </mesh>
        )
      })}
    </group>
  )
}

function Mate({ position }: P) {
  return (
    <group position={position} onClick={pet('mates')} {...pointer}>
      <mesh position={[0, 0.55, 0]} scale={[1, 1.15, 1]} castShadow>
        <sphereGeometry args={[0.55, 24, 18]} />
        {mat('#8a5a36')}
      </mesh>
      <mesh position={[0, 1.12, 0]}>
        <cylinderGeometry args={[0.36, 0.42, 0.14, 24]} />
        {mat('#c9a14a', 0.4)}
      </mesh>
      <mesh position={[0, 1.2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.34, 24]} />
        {mat('#5f9a55')}
      </mesh>
      <mesh position={[0.12, 1.55, 0]} rotation={[0, 0, -0.25]}>
        <cylinderGeometry args={[0.04, 0.04, 1.1, 8]} />
        {mat('#cfc6b8', 0.3)}
      </mesh>
      <mesh position={[1.1, 1.15, 0.2]} castShadow>
        <cylinderGeometry args={[0.38, 0.38, 2.3, 24]} />
        {mat('#5f8a6a')}
      </mesh>
      <mesh position={[1.1, 2.45, 0.2]} castShadow>
        <cylinderGeometry args={[0.3, 0.36, 0.3, 20]} />
        {mat('#3a3330')}
      </mesh>
    </group>
  )
}

function Clock({ position }: P) {
  const min = useRef<THREE.Group>(null)
  const hour = useRef<THREE.Group>(null)
  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    if (min.current) min.current.rotation.z = -t * 0.5
    if (hour.current) hour.current.rotation.z = -t * 0.04
  })
  return (
    <group position={position}>
      <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[1.1, 1.1, 0.18, 40]} />
        {mat('#c8664d')}
      </mesh>
      <mesh position={[0, 0, 0.1]}>
        <circleGeometry args={[0.95, 40]} />
        {mat('#f7f0e2')}
      </mesh>
      {[...Array(12)].map((_, i) => (
        <mesh key={i} position={[Math.sin((i / 12) * Math.PI * 2) * 0.8, Math.cos((i / 12) * Math.PI * 2) * 0.8, 0.11]}>
          <circleGeometry args={[i % 3 ? 0.03 : 0.06, 8]} />
          {mat('#3a2a1f')}
        </mesh>
      ))}
      {/* agujas: la geometría arranca en el centro y apunta hacia arriba */}
      <group position={[0, 0, 0.12]}>
        <group ref={min}>
          <mesh position={[0, 0.34, 0]}>
            <planeGeometry args={[0.06, 0.75]} />
            <meshStandardMaterial color="#3a2a1f" />
          </mesh>
        </group>
        <group ref={hour}>
          <mesh position={[0, 0.22, 0.005]}>
            <planeGeometry args={[0.09, 0.5]} />
            <meshStandardMaterial color="#3a2a1f" />
          </mesh>
        </group>
      </group>
    </group>
  )
}

function Books({ position }: P) {
  const books: [string, number, number][] = [
    ['#4f7bb0', 2.2, 0.35],
    ['#c8664d', 2.0, 0.3],
    ['#e1b54f', 2.4, 0.4],
    ['#6f9a68', 1.9, 0.28],
  ]
  const ys = books.reduce<number[]>((acc, [, , h], i) => [...acc, (i ? acc[i - 1] + books[i - 1][2] / 2 : 0) + h / 2], [])
  return (
    <group position={position} rotation={[0, 0.3, 0]}>
      {books.map(([c, w, h], i) => (
        <RoundedBox key={i} args={[w, h, 1.5]} radius={0.04} position={[(i % 2) * 0.15, ys[i], 0]} rotation={[0, (i - 1.5) * 0.08, 0]} castShadow receiveShadow>
          {mat(c)}
        </RoundedBox>
      ))}
    </group>
  )
}

function Diploma({ position }: P) {
  return (
    <group position={position} rotation={[0, -0.05, 0]}>
      <RoundedBox args={[2.8, 2.1, 0.12]} radius={0.05} castShadow>
        {mat('#6b4a33')}
      </RoundedBox>
      <mesh position={[0, 0, 0.07]}>
        <planeGeometry args={[2.45, 1.75]} />
        {mat('#f7f0e2')}
      </mesh>
      <TextPlane text="Técnico del barrio" width={2.2} height={0.42} color="#3a2a1f" font="display" weight={800} position={[0, 0.35, 0.08]} rotation={[0, 0, 0]} />
      <TextPlane text="electrozy · Unidad 1" width={1.8} height={0.24} color="#6b5646" font="sans" weight={700} position={[0, -0.15, 0.08]} rotation={[0, 0, 0]} />
      <mesh position={[0.75, -0.55, 0.09]}>
        <circleGeometry args={[0.2, 24]} />
        {mat('#c8664d')}
      </mesh>
    </group>
  )
}

function LabSupply({ position }: P) {
  return (
    <group position={position}>
      <RoundedBox args={[2.6, 1.3, 1.4]} radius={0.12} position={[0, 0.65, 0]} castShadow>
        {mat('#7fa6c9')}
      </RoundedBox>
      <mesh position={[0, 0.65, 0.71]}>
        <planeGeometry args={[2.3, 1.05]} />
        {mat('#e9dfcb')}
      </mesh>
      {[-0.7, 0].map((x) => (
        <mesh key={x} position={[x, 0.75, 0.75]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.22, 0.22, 0.1, 20]} />
          {mat('#3a2f28')}
        </mesh>
      ))}
      <mesh position={[0.75, 0.85, 0.72]}>
        <planeGeometry args={[0.6, 0.3]} />
        <meshStandardMaterial color="#b5c39e" emissive="#9fb884" emissiveIntensity={0.4} />
      </mesh>
      {[0.55, 0.95].map((x, i) => (
        <mesh key={x} position={[x, 0.35, 0.75]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.08, 0.08, 0.12, 12]} />
          {mat(i ? '#2f2a28' : '#c8574a')}
        </mesh>
      ))}
    </group>
  )
}

function Bunting() {
  const colors = ['#e0913c', '#6f9a68', '#6f98c0', '#c8664d', '#e1b54f', '#86609c']
  return (
    <group position={[2, 8.6, -9.9]}>
      {[...Array(14)].map((_, i) => {
        const x = -11 + i * 1.7
        const y = -Math.sin((i / 13) * Math.PI) * 0.8
        return (
          <mesh key={i} position={[x, y - 0.35, 0]} rotation={[0, 0, Math.PI]}>
            <coneGeometry args={[0.45, 0.8, 3]} />
            {mat(colors[i % colors.length])}
          </mesh>
        )
      })}
    </group>
  )
}
