import type { DecorId } from '../sim/three/Desk'
import { useProgress } from '../store/progress'

/** Cada encargo terminado suma algo al taller. */
export const REWARDS: Record<string, { decor: DecorId; text: string }> = {
  corriente: { decor: 'potus', text: 'Doña Rosa te regaló un potus para el taller.' },
  voltaje: { decor: 'radio', text: 'Ahora tenés una radio vieja en el estante.' },
  resistencia: { decor: 'foto', text: 'Colgaste una foto en el tablero.' },
  ohm: { decor: 'gato', text: 'Un gato naranja adoptó tu escritorio.' },
  tester: { decor: 'guirnalda', text: 'El taller estrena guirnalda de luces.' },
  potencia: { decor: 'mate', text: 'La abuela Tita te dejó un mate y un termo en la mesa.' },
  kirchhoff: { decor: 'reloj', text: 'Nico te regaló un reloj de pared que armó en robótica.' },
  thevenin: { decor: 'libros', text: 'Martina te prestó su pila de libros de circuitos.' },
  diagnostico: { decor: 'diploma', text: 'Colgaste tu diploma de técnico del barrio.' },
  fuentes: { decor: 'fuente', text: 'Sofi te regaló una fuente de laboratorio vintage para el estante.' },
  guia: { decor: 'banderines', text: 'Unidad 1 terminada: el taller se llenó de banderines de festejo.' },
}

export function useDecor(): DecorId[] {
  const lessons = useProgress((s) => s.lessons)
  return Object.entries(REWARDS)
    .filter(([id]) => lessons[id]?.done)
    .map(([, r]) => r.decor)
}
