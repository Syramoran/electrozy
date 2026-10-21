import { create } from 'zustand'

/** Logros recién desbloqueados, esperando su cartelito. */
type Toasts = { queue: string[]; push: (ids: string[]) => void; pop: () => void }

export const useToasts = create<Toasts>((set) => ({
  queue: [],
  push: (ids) => set((s) => ({ queue: [...s.queue, ...ids] })),
  pop: () => set((s) => ({ queue: s.queue.slice(1) })),
}))
