import type { MeterReading, Warning } from '../engine/netlist'
import type { MeterMode, Part } from '../engine/types'

export const MODE_LABEL: Record<MeterMode, string> = { off: 'OFF', V: 'V⎓', A: 'mA', ohm: 'Ω' }
export const MODE_NAME: Record<MeterMode, string> = { off: 'apagado', V: 'voltímetro', A: 'amperímetro', ohm: 'óhmetro' }

function lcd(n: number, decimals: number) {
  return n.toFixed(decimals).replace('.', ',')
}

/** Texto del display del tester, como lo mostraría uno de verdad. */
export function meterDisplay(r: MeterReading | null): { main: string; unit: string } {
  if (!r || r.mode === 'off') return { main: '', unit: '' }
  if (r.status === 'fuse') return { main: 'FUSE', unit: '' }
  if (r.status === 'powered') return { main: 'Err', unit: 'Ω' }
  if (r.mode === 'ohm') {
    if (r.value === null || r.status === 'OL') return { main: 'O.L', unit: 'Ω' }
    const v = r.value
    if (v >= 1e6) return { main: lcd(v / 1e6, 2), unit: 'MΩ' }
    if (v >= 1e3) return { main: lcd(v / 1e3, v >= 1e5 ? 0 : 2), unit: 'kΩ' }
    return { main: lcd(v, 1), unit: 'Ω' }
  }
  const v = r.value ?? 0
  if (r.mode === 'V') return Math.abs(v) < 1 ? { main: lcd(v * 1000, 0), unit: 'mV' } : { main: lcd(v, 2), unit: 'V' }
  // amperímetro
  const ma = v * 1000
  return Math.abs(ma) < 10 ? { main: lcd(ma, 2), unit: 'mA' } : { main: lcd(ma, 1), unit: 'mA' }
}

export function partName(p: Part | undefined) {
  if (!p) return ''
  if ('label' in p && p.label) return p.label
  switch (p.kind) {
    case 'resistor':
      return 'Resistor'
    case 'led':
      return 'LED'
    case 'bulb':
      return 'Lamparita'
    case 'wire':
      return 'Cable'
    case 'source':
      return p.style === 'battery' ? 'Batería' : 'Fuente regulable'
    case 'meter':
      return 'Tester'
  }
}

export function warningText(w: Warning, parts: Part[]) {
  const name = partName(parts.find((p) => p.id === w.partId))
  switch (w.kind) {
    case 'short':
      return `¡Cortocircuito! La ${name.toLowerCase()} entrega ${w.amps.toFixed(1).replace('.', ',')} A: nada limita la corriente.`
    case 'fuse':
      return 'Se quemó el fusible del tester: pusiste el amperímetro en paralelo y hizo de corto. Va en serie.'
    case 'ledBurn':
      return `Se quemó el ${name}: le pasó demasiada corriente. Subí el resistor en serie antes de cambiarlo, si no el nuevo se quema igual.`
    case 'ledReverse':
      return `El ${name} está al revés: la pata larga (+) va hacia el positivo.`
    case 'hot':
      return `${name} disipa ${w.watts.toFixed(2).replace('.', ',')} W y aguanta ${w.rating === 0.25 ? '¼' : String(w.rating).replace('.', ',')} W: se está recalentando. Subí su valor o bajá la tensión.`
    case 'ohmPowered':
      return 'El óhmetro no mide con el circuito alimentado: apagá la fuente o desconectala.'
  }
}
