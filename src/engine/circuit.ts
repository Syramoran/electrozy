// Utilidades de circuito "de pizarrón": Ohm, serie/paralelo, unidades y código de colores.

export const ohm = {
  V: (i: number, r: number) => i * r,
  I: (v: number, r: number) => v / r,
  R: (v: number, i: number) => v / i,
}

export const series = (...rs: number[]) => rs.reduce((a, b) => a + b, 0)
export const parallel = (...rs: number[]) => 1 / rs.reduce((a, r) => a + 1 / r, 0)

const PREFIXES: [number, string][] = [
  [1e6, 'M'],
  [1e3, 'k'],
  [1, ''],
  [1e-3, 'm'],
  [1e-6, 'µ'],
]

/** Formatea con prefijo SI y coma decimal rioplatense: 0.0123 A → "12,3 mA". */
export function formatSI(value: number, unit: string, digits = 3): string {
  if (!isFinite(value)) return `∞ ${unit}`
  if (value === 0) return `0 ${unit}`
  const abs = Math.abs(value)
  const [mult, prefix] = PREFIXES.find(([m]) => abs >= m * 0.9995) ?? PREFIXES[PREFIXES.length - 1]
  const scaled = value / mult
  return `${trimNum(scaled, digits)} ${prefix}${unit}`
}

/** Número con `digits` cifras significativas, sin ceros de cola, con coma. */
export function trimNum(n: number, digits = 3): string {
  if (n === 0) return '0'
  const s = Number(n.toPrecision(digits))
  return String(s).replace('.', ',')
}

/** Parsea "12,5" / "12.5" / "1e3". */
export function parseNum(text: string): number {
  return Number(text.trim().replace(/\s/g, '').replace(',', '.'))
}

export function approxEqual(a: number, b: number, relTol = 0.03, absTol = 1e-9) {
  return Math.abs(a - b) <= Math.max(absTol, relTol * Math.abs(b))
}

// ---------- Código de colores ----------

export const BAND_COLORS = [
  { name: 'negro', hex: '#2b2522' },
  { name: 'marrón', hex: '#7a4a2a' },
  { name: 'rojo', hex: '#c8463a' },
  { name: 'naranja', hex: '#e08a3c' },
  { name: 'amarillo', hex: '#e8c547' },
  { name: 'verde', hex: '#5f9a55' },
  { name: 'azul', hex: '#4a74a8' },
  { name: 'violeta', hex: '#86609c' },
  { name: 'gris', hex: '#8d8a86' },
  { name: 'blanco', hex: '#f1ece2' },
] as const

export const GOLD = { name: 'dorado', hex: '#c9a14a' }

/** Serie E12: los valores "de cajón" del taller. */
export const E12 = [10, 12, 15, 18, 22, 27, 33, 39, 47, 56, 68, 82]

/** Devuelve índices de color [d1, d2, multiplicador] para un valor de 2 cifras significativas. */
export function colorBands(ohms: number): [number, number, number] {
  let exp = Math.floor(Math.log10(ohms)) - 1
  let sig = Math.round(ohms / 10 ** exp)
  if (sig >= 100) {
    sig = Math.round(sig / 10)
    exp += 1
  }
  if (exp < 0) {
    // valores < 10 Ω: los aproximamos con multiplicador negro
    return [Math.floor(ohms / 10) % 10, Math.round(ohms) % 10, 0]
  }
  return [Math.floor(sig / 10), sig % 10, exp]
}

export function bandsToOhms(d1: number, d2: number, mult: number) {
  return (d1 * 10 + d2) * 10 ** mult
}

export function randomE12(rng: () => number, minExp = 1, maxExp = 4) {
  const base = E12[Math.floor(rng() * E12.length)]
  const exp = minExp + Math.floor(rng() * (maxExp - minExp + 1))
  return base * 10 ** (exp - 1)
}
