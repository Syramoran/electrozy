import { create } from 'zustand'

type View = { electrons: boolean; toggleElectrons: () => void }

export const useView = create<View>((set) => ({
  electrons: true,
  toggleElectrons: () => set((s) => ({ electrons: !s.electrons })),
}))
