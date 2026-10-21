// Análisis nodal modificado (MNA) mínimo: resistencias, fuentes de tensión y de corriente.

export type Elem =
  | { type: 'R'; id: string; a: string; b: string; r: number }
  | { type: 'V'; id: string; p: string; n: string; v: number }
  /** Fuente de corriente: empuja `i` amperes saliendo por `to` (entra por `from`). */
  | { type: 'I'; id: string; from: string; to: string; i: number }

export type MnaResult = {
  /** Tensión de cada nodo respecto de la referencia. */
  v: Record<string, number>
  /** Corriente de cada elemento: R de a→b, V saliendo por p hacia el circuito externo. */
  i: Record<string, number>
}

const GMIN = 1e-9

export function solveMna(elems: Elem[]): MnaResult {
  const nodes = new Map<string, number>()
  const idx = (n: string) => {
    if (!nodes.has(n)) nodes.set(n, nodes.size)
    return nodes.get(n)!
  }
  for (const e of elems) {
    if (e.type === 'R') (idx(e.a), idx(e.b))
    else if (e.type === 'V') (idx(e.p), idx(e.n))
    else (idx(e.from), idx(e.to))
  }
  const vsrc = elems.filter((e) => e.type === 'V')
  const n = nodes.size
  const size = n + vsrc.length
  if (size === 0) return { v: {}, i: {} }

  const A: number[][] = Array.from({ length: size }, () => new Array(size).fill(0))
  const b = new Array(size).fill(0)

  // gmin a la referencia: evita matrices singulares con nodos flotantes.
  for (let k = 0; k < n; k++) A[k][k] += GMIN

  for (const e of elems) {
    if (e.type === 'R') {
      const g = 1 / Math.max(e.r, 1e-6)
      const a = idx(e.a)
      const c = idx(e.b)
      A[a][a] += g
      A[c][c] += g
      A[a][c] -= g
      A[c][a] -= g
    } else if (e.type === 'I') {
      b[idx(e.to)] += e.i
      b[idx(e.from)] -= e.i
    }
  }
  vsrc.forEach((e, k) => {
    if (e.type !== 'V') return
    const row = n + k
    const p = idx(e.p)
    const q = idx(e.n)
    A[p][row] += 1
    A[q][row] -= 1
    A[row][p] += 1
    A[row][q] -= 1
    b[row] = e.v
  })

  const x = gauss(A, b)
  const v: Record<string, number> = {}
  for (const [name, k] of nodes) v[name] = x[k]
  const i: Record<string, number> = {}
  for (const e of elems) {
    if (e.type === 'R') i[e.id] = (v[e.a] - v[e.b]) / Math.max(e.r, 1e-6)
    else if (e.type === 'I') i[e.id] = e.i
  }
  // La incógnita de MNA es la corriente que entra por p a la fuente; la queremos saliendo.
  vsrc.forEach((e, k) => (i[e.id] = -x[n + k]))
  return { v, i }
}

function gauss(A: number[][], b: number[]): number[] {
  const n = b.length
  for (let col = 0; col < n; col++) {
    let piv = col
    for (let r = col + 1; r < n; r++) if (Math.abs(A[r][col]) > Math.abs(A[piv][col])) piv = r
    if (Math.abs(A[piv][col]) < 1e-18) continue
    ;[A[col], A[piv]] = [A[piv], A[col]]
    ;[b[col], b[piv]] = [b[piv], b[col]]
    for (let r = col + 1; r < n; r++) {
      const f = A[r][col] / A[col][col]
      if (f === 0) continue
      for (let c = col; c < n; c++) A[r][c] -= f * A[col][c]
      b[r] -= f * b[col]
    }
  }
  const x = new Array(n).fill(0)
  for (let r = n - 1; r >= 0; r--) {
    let s = b[r]
    for (let c = r + 1; c < n; c++) s -= A[r][c] * x[c]
    x[r] = Math.abs(A[r][r]) < 1e-18 ? 0 : s / A[r][r]
  }
  return x
}
