// Texturas pintadas en canvas: protoboard, madera y plancha de corte. Sin descargas.

import * as THREE from 'three'
import { BOARD_D, BOARD_W, COLS, ROWS, holePos, isBus } from '../../engine/board'

const PX = 200 // píxeles por unidad

function canvasTex(w: number, h: number, draw: (g: CanvasRenderingContext2D) => void) {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  draw(c.getContext('2d')!)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 8
  return t
}

let boardTex: THREE.Texture | null = null
export function boardTexture() {
  if (boardTex) return boardTex
  const W = Math.round(BOARD_W * PX)
  const H = Math.round(BOARD_D * PX)
  const toPx = (x: number, z: number): [number, number] => [(x + BOARD_W / 2) * PX, (z + BOARD_D / 2) * PX]
  boardTex = canvasTex(W, H, (g) => {
    g.fillStyle = '#f2ead9'
    g.fillRect(0, 0, W, H)
    // canaleta central
    const [, zt] = toPx(0, (holePos({ r: 6, c: 0 })[1] + holePos({ r: 7, c: 0 })[1]) / 2)
    g.fillStyle = '#ddd1ba'
    g.fillRect(0, zt - 14, W, 28)
    // líneas de bus
    const busLine = (r: number, color: string, dz: number) => {
      const [, z] = toPx(0, holePos({ r, c: 0 })[1] + dz)
      g.strokeStyle = color
      g.lineWidth = 7
      g.lineCap = 'round'
      g.beginPath()
      g.moveTo(40, z)
      g.lineTo(W - 40, z)
      g.stroke()
    }
    busLine(0, '#c8574a', -0.2)
    busLine(1, '#4f7bb0', 0.2)
    busLine(12, '#c8574a', -0.2)
    busLine(13, '#4f7bb0', 0.2)
    // agujeros
    for (let r = 0; r < ROWS.length; r++)
      for (let c = 0; c < COLS; c++) {
        const [x, z] = toPx(...holePos({ r, c }))
        g.fillStyle = '#c9bca3'
        roundRect(g, x - 15, z - 15, 30, 30, 7)
        g.fill()
        g.fillStyle = '#3c332c'
        roundRect(g, x - 9, z - 9, 18, 18, 4)
        g.fill()
      }
    // letras y números
    g.fillStyle = '#9a8b74'
    g.font = '600 26px Nunito Variable, Nunito, sans-serif'
    g.textAlign = 'center'
    g.textBaseline = 'middle'
    for (let r = 0; r < ROWS.length; r++) {
      if (isBus(r)) continue
      const [, z] = toPx(0, holePos({ r, c: 0 })[1])
      g.fillText(ROWS[r], 22, z)
      g.fillText(ROWS[r], W - 22, z)
    }
    for (let c = 0; c < COLS; c += 1) {
      if (c !== 0 && (c + 1) % 5 !== 0) continue
      const [x] = toPx(holePos({ r: 0, c })[0], 0)
      const [, z1] = toPx(0, holePos({ r: 2, c: 0 })[1] - 0.24)
      const [, z2] = toPx(0, holePos({ r: 11, c: 0 })[1] + 0.24)
      g.fillText(String(c + 1), x, z1)
      g.fillText(String(c + 1), x, z2)
    }
    g.font = '800 30px Nunito Variable, Nunito, sans-serif'
    for (const [r, s, col] of [
      [0, '+', '#c8574a'],
      [1, '−', '#4f7bb0'],
      [12, '+', '#c8574a'],
      [13, '−', '#4f7bb0'],
    ] as const) {
      const [, z] = toPx(0, holePos({ r, c: 0 })[1])
      g.fillStyle = col
      g.fillText(s, 20, z)
      g.fillText(s, W - 20, z)
    }
  })
  return boardTex
}

let woodTex: THREE.Texture | null = null
export function woodTexture() {
  if (woodTex) return woodTex
  woodTex = canvasTex(1024, 1024, (g) => {
    g.fillStyle = '#b4804f'
    g.fillRect(0, 0, 1024, 1024)
    const planks = 6
    for (let p = 0; p < planks; p++) {
      const y0 = (p * 1024) / planks
      const tint = ['#b8854f', '#ad7a48', '#b98a57', '#a9764a', '#b2814f', '#ad7c4d'][p]
      g.fillStyle = tint
      g.fillRect(0, y0, 1024, 1024 / planks)
      g.strokeStyle = 'rgba(90,55,30,0.18)'
      g.lineWidth = 2
      for (let k = 0; k < 9; k++) {
        g.beginPath()
        const yy = y0 + 10 + k * 18 + Math.sin(p + k) * 4
        g.moveTo(0, yy)
        for (let x = 0; x <= 1024; x += 64) g.lineTo(x, yy + Math.sin(x / 120 + k + p) * 3)
        g.stroke()
      }
      g.fillStyle = 'rgba(70,40,20,0.45)'
      g.fillRect(0, y0, 1024, 3)
    }
  })
  woodTex.wrapS = woodTex.wrapT = THREE.RepeatWrapping
  woodTex.repeat.set(2, 1.4)
  return woodTex
}

let matTex: THREE.Texture | null = null
export function matTexture() {
  if (matTex) return matTex
  matTex = canvasTex(1600, 950, (g) => {
    g.fillStyle = '#4c7a62'
    g.fillRect(0, 0, 1600, 950)
    g.strokeStyle = 'rgba(232,240,220,0.13)'
    g.lineWidth = 2
    for (let x = 0; x < 1600; x += 50) {
      g.beginPath()
      g.moveTo(x, 0)
      g.lineTo(x, 950)
      g.stroke()
    }
    for (let y = 0; y < 950; y += 50) {
      g.beginPath()
      g.moveTo(0, y)
      g.lineTo(1600, y)
      g.stroke()
    }
    g.strokeStyle = 'rgba(232,240,220,0.28)'
    g.lineWidth = 3
    g.strokeRect(25, 25, 1550, 900)
    g.fillStyle = 'rgba(232,240,220,0.35)'
    g.font = '700 30px Nunito Variable, Nunito, sans-serif'
    g.fillText('electrozy · taller', 50, 905)
  })
  return matTex
}

function roundRect(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  g.beginPath()
  g.moveTo(x + r, y)
  g.arcTo(x + w, y, x + w, y + h, r)
  g.arcTo(x + w, y + h, x, y + h, r)
  g.arcTo(x, y + h, x, y, r)
  g.arcTo(x, y, x + w, y, r)
  g.closePath()
}
