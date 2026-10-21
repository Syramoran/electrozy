// Arrastre: rayo desde la cámara al plano de la mesa, con la pieza "levantada".

import { useThree, type ThreeEvent } from '@react-three/fiber'
import { useEffect } from 'react'
import * as THREE from 'three'
import { useBench, type DragTarget } from '../benchStore'
import { DRAG_Y } from './layout'

const off = { x: 0, z: 0 }
const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -DRAG_Y)
const controlsRef: { current: { enabled: boolean } | null } = { current: null }

export function beginDrag(e: ThreeEvent<PointerEvent>, t: DragTarget, pos: [number, number]) {
  e.stopPropagation()
  if (e.button !== 0) return
  // Frenamos la cámara ya mismo, antes de que OrbitControls arranque a girar.
  if (controlsRef.current) controlsRef.current.enabled = false
  const hit = new THREE.Vector3()
  if (e.ray.intersectPlane(plane, hit)) {
    off.x = hit.x - pos[0]
    off.z = hit.z - pos[1]
  } else off.x = off.z = 0
  useBench.getState().startDrag(t)
  if (!useBench.getState().drag && controlsRef.current) controlsRef.current.enabled = true
}

export function DragController() {
  const { camera, gl } = useThree()
  const controls = useThree((s) => s.controls) as unknown as { enabled: boolean } | null
  const dragging = useBench((s) => !!s.drag)
  controlsRef.current = controls

  useEffect(() => {
    if (!dragging) return
    const ray = new THREE.Raycaster()
    const ndc = new THREE.Vector2()
    const hit = new THREE.Vector3()
    const move = (e: PointerEvent) => {
      const r = gl.domElement.getBoundingClientRect()
      ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1)
      ray.setFromCamera(ndc, camera)
      if (ray.ray.intersectPlane(plane, hit)) {
        const x = THREE.MathUtils.clamp(hit.x - off.x, -14, 14)
        const z = THREE.MathUtils.clamp(hit.z - off.z, -7, 7)
        useBench.getState().dragTo(x, z)
      }
    }
    const up = () => useBench.getState().endDrag()
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    window.addEventListener('pointercancel', up)
    document.body.style.cursor = 'grabbing'
    return () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      window.removeEventListener('pointercancel', up)
      document.body.style.cursor = ''
    }
  }, [dragging, camera, gl])

  return null
}
