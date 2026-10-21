// Texto pintado en una textura de canvas, apoyado sobre una cara de la pieza.

import type { ThreeEvent } from '@react-three/fiber'
import { useEffect, useMemo, useState } from 'react'
import * as THREE from 'three'

type Props = {
  text: string
  /** Texto chico a la derecha (unidad). */
  sub?: string
  width: number
  height: number
  color?: string
  bg?: string
  font?: 'mono' | 'display' | 'sans'
  weight?: number
  align?: 'center' | 'right'
  radius?: number
  position?: [number, number, number]
  rotation?: [number, number, number]
  onClick?: (e: ThreeEvent<MouseEvent>) => void
}

const FAMILIES = {
  mono: "'JetBrains Mono', ui-monospace, monospace",
  display: "'Fraunces Variable', Georgia, serif",
  sans: "'Nunito Variable', system-ui, sans-serif",
}

const PX = 220

let fontsReady: Promise<unknown> | null = null
function useFontsReady() {
  const [ok, setOk] = useState(false)
  useEffect(() => {
    fontsReady ??= Promise.all([
      document.fonts.load("700 40px 'JetBrains Mono'"),
      document.fonts.load("700 40px 'Fraunces Variable'"),
      document.fonts.load("700 40px 'Nunito Variable'"),
    ]).catch(() => null)
    let alive = true
    fontsReady.then(() => alive && setOk(true))
    return () => {
      alive = false
    }
  }, [])
  return ok
}

export function TextPlane({ text, sub, width, height, color = '#2b3424', bg, font = 'mono', weight = 700, align = 'center', radius = 0.06, position, rotation = [-Math.PI / 2, 0, 0], onClick }: Props) {
  const fonts = useFontsReady()
  const tex = useMemo(() => {
    void fonts
    const c = document.createElement('canvas')
    c.width = Math.round(width * PX)
    c.height = Math.round(height * PX)
    const g = c.getContext('2d')!
    if (bg) {
      g.fillStyle = bg
      const r = radius * PX
      g.beginPath()
      g.roundRect(0, 0, c.width, c.height, r)
      g.fill()
    }
    g.fillStyle = color
    g.textBaseline = 'middle'
    const mainSize = c.height * (sub ? 0.66 : 0.62)
    g.font = `${weight} ${mainSize}px ${FAMILIES[font]}`
    if (sub) {
      const subSize = c.height * 0.3
      const subW = c.height * 0.95
      g.textAlign = 'right'
      g.fillText(text, c.width - subW - c.height * 0.12, c.height * 0.54)
      g.font = `${weight} ${subSize}px ${FAMILIES[font]}`
      g.textAlign = 'left'
      g.fillText(sub, c.width - subW, c.height * 0.62)
    } else {
      g.textAlign = align
      g.fillText(text, align === 'center' ? c.width / 2 : c.width - c.height * 0.15, c.height * 0.55)
    }
    const t = new THREE.CanvasTexture(c)
    t.colorSpace = THREE.SRGBColorSpace
    t.anisotropy = 8
    return t
  }, [text, sub, width, height, color, bg, font, weight, align, radius, fonts])

  useEffect(() => () => tex.dispose(), [tex])

  return (
    <mesh
      position={position}
      rotation={rotation}
      onClick={onClick}
      onPointerDown={onClick ? (e) => e.stopPropagation() : undefined}
      onPointerOver={onClick ? () => (document.body.style.cursor = 'pointer') : undefined}
      onPointerOut={onClick ? () => (document.body.style.cursor = '') : undefined}
    >
      <planeGeometry args={[width, height]} />
      <meshBasicMaterial map={tex} transparent toneMapped={false} />
    </mesh>
  )
}
