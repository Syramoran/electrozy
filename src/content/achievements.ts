// Logros: algunos premian aprender, otros premian romper cosas con estilo.

export type Glyph = 'flame' | 'bolt' | 'star' | 'check' | 'cat' | 'cup' | 'moon' | 'hand' | 'book' | 'mute' | 'flag' | 'wrench'

export type AchievementCtx = {
  stats: Record<string, number>
  lessonsDone: number
  totalLessons: number
  streak: number
}

export type Achievement = {
  id: string
  title: string
  desc: string
  glyph: Glyph
  color: string
  /** Oculto: se ve como "???" hasta desbloquearlo. */
  secret?: boolean
  /** Progreso actual y meta (para la barrita). */
  progress: (c: AchievementCtx) => [number, number]
}

const stat =
  (name: string, goal: number) =>
  (c: AchievementCtx): [number, number] => [c.stats[name] ?? 0, goal]

const FIRE = '#c8664d'
const AMBER = '#e0913c'
const SAGE = '#6f9a68'
const SKY = '#6f98c0'
const PLUM = '#86609c'
const MUSTARD = '#e1b54f'

export const ACHIEVEMENTS: Achievement[] = [
  // --- desastres con estilo ---
  { id: 'led1', title: 'Primer chispazo', desc: 'Quemá tu primer LED. Todos pasamos por ahí.', glyph: 'flame', color: FIRE, progress: stat('ledBurned', 1) },
  { id: 'led3', title: 'Pirómano aficionado', desc: 'Quemá 3 LEDs. El resistor en serie está para algo, eh.', glyph: 'flame', color: FIRE, progress: stat('ledBurned', 3) },
  { id: 'led10', title: 'Coleccionista de humo', desc: 'Quemá 10 LEDs. El proveedor de LEDs te manda saludos.', glyph: 'flame', color: FIRE, progress: stat('ledBurned', 10) },
  { id: 'short', title: '¡Cortocircuito!', desc: 'Uní + con − sin nada en el medio. La batería tembló.', glyph: 'bolt', color: AMBER, progress: stat('shorts', 1) },
  { id: 'fuse', title: 'Fusible mártir', desc: 'Poné el amperímetro en paralelo y quemá su fusible.', glyph: 'bolt', color: AMBER, progress: stat('fuses', 1) },
  { id: 'fuse3', title: 'El que no aprende con el fusible…', desc: 'Quemá 3 fusibles del tester. Va en serie, ¡en serie!', glyph: 'bolt', color: AMBER, progress: stat('fuses', 3) },
  { id: 'reverse', title: 'De contramano', desc: 'Poné un LED al revés. La pata larga va al +.', glyph: 'bolt', color: MUSTARD, progress: stat('reverse', 1) },
  { id: 'hot1', title: 'Parrillero', desc: 'Hacé que un resistor disipe más de lo que aguanta.', glyph: 'flame', color: AMBER, progress: stat('hot', 1) },
  { id: 'hot5', title: 'Asado de resistores', desc: 'Recalentá resistores 5 veces. ¿Traés el chimichurri?', glyph: 'flame', color: AMBER, progress: stat('hot', 5) },
  { id: 'ohmlive', title: 'Óhmetro kamikaze', desc: 'Intentá medir resistencia con el circuito alimentado.', glyph: 'bolt', color: MUSTARD, progress: stat('ohmPowered', 1) },

  // --- manos a la obra ---
  { id: 'snap50', title: 'Clic, clic, clic', desc: 'Encastrá 50 piezas en la protoboard.', glyph: 'hand', color: SKY, progress: stat('snaps', 50) },
  { id: 'snap300', title: 'Manos de cirujano', desc: 'Encastrá 300 piezas en la protoboard.', glyph: 'hand', color: SKY, progress: stat('snaps', 300) },
  { id: 'builder', title: 'Arquitecto de protoboard', desc: 'Sacá 20 piezas del cajón en la mesa libre.', glyph: 'wrench', color: SKY, progress: stat('partsAdded', 20) },
  { id: 'bench10', title: 'Técnico de verdad', desc: 'Resolvé 10 consignas en la mesa (medir, armar, reparar).', glyph: 'wrench', color: SAGE, progress: stat('benchOk', 10) },
  { id: 'bench40', title: 'Técnico del barrio', desc: 'Resolvé 40 consignas en la mesa.', glyph: 'wrench', color: SAGE, progress: stat('benchOk', 40) },

  // --- estudio ---
  { id: 'lesson1', title: 'Primer encargo', desc: 'Terminá tu primer encargo.', glyph: 'check', color: SAGE, progress: (c) => [c.lessonsDone, 1] },
  { id: 'lesson6', title: 'Mitad de la unidad', desc: 'Terminá 6 encargos.', glyph: 'check', color: SAGE, progress: (c) => [c.lessonsDone, 6] },
  { id: 'lessonAll', title: 'Unidad 1 completa', desc: 'Terminá todos los encargos.', glyph: 'star', color: MUSTARD, progress: (c) => [c.lessonsDone, c.totalLessons] },
  { id: 'perfect', title: 'Impecable', desc: 'Terminá una práctica sin errar ninguna al primer intento.', glyph: 'star', color: MUSTARD, progress: stat('perfect', 1) },
  { id: 'right100', title: 'Cien de cien', desc: 'Respondé bien 100 ejercicios.', glyph: 'book', color: SAGE, progress: stat('right', 100) },
  { id: 'wrong25', title: 'Errar es humano', desc: 'Equivocate 25 veces y seguí intentando. Así se aprende.', glyph: 'book', color: PLUM, progress: stat('wrong', 25) },
  { id: 'giveup', title: 'Me rindo… por hoy', desc: 'Usá el botón «Me rindo» en la mesa.', glyph: 'flag', color: PLUM, progress: stat('giveups', 1) },
  { id: 'review3', title: 'Repasador serial', desc: 'Completá 3 repasos mezclados.', glyph: 'book', color: SKY, progress: stat('reviews', 3) },
  { id: 'streak3', title: 'Constancia', desc: 'Volvé al taller 3 días seguidos.', glyph: 'moon', color: PLUM, progress: (c) => [c.streak, 3] },
  { id: 'streak7', title: 'Semana de taller', desc: 'Volvé al taller 7 días seguidos.', glyph: 'moon', color: PLUM, progress: (c) => [c.streak, 7] },

  // --- secretos ---
  { id: 'cat', title: 'Amigo de los gatos', desc: 'Acariciá al gato del taller 10 veces.', glyph: 'cat', color: AMBER, secret: true, progress: stat('catPets', 10) },
  { id: 'mate', title: 'Cebador oficial', desc: 'Tomate un mate en el taller.', glyph: 'cup', color: SAGE, secret: true, progress: stat('mates', 1) },
  { id: 'night', title: 'Búho del taller', desc: 'Estudiá electrónica después de las 23 h.', glyph: 'moon', color: SKY, secret: true, progress: stat('night', 1) },
  { id: 'mute', title: 'Silencio, por favor', desc: 'Apagá el sonido del taller.', glyph: 'mute', color: PLUM, secret: true, progress: stat('muted', 1) },
]

export function isUnlocked(a: Achievement, c: AchievementCtx) {
  const [cur, goal] = a.progress(c)
  return goal > 0 && cur >= goal
}
