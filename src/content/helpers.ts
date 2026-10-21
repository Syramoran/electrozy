import { formatSI, trimNum } from '../engine/circuit'
import { pick, shuffle, type Rng } from '../lib/rng'

/** Mezcla la correcta con las incorrectas (sin repetidas) y devuelve el índice de la correcta. */
export function options(rng: Rng, correct: string, wrong: string[]) {
  const uniq = [...new Set(wrong)].filter((w) => w !== correct).slice(0, 3)
  const all = shuffle(rng, [correct, ...uniq])
  return { options: all, answer: all.indexOf(correct) }
}

export const n = (x: number, d = 3) => trimNum(x, d)
export const si = formatSI
export { pick }
