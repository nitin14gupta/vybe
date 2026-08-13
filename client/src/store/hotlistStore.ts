import { create } from 'zustand'

interface HotlistState {
  overrides: Record<string, boolean>
  setHotlisted: (eventId: string, val: boolean) => void
}

export const useHotlistStore = create<HotlistState>((set) => ({
  overrides: {},
  setHotlisted: (eventId, val) =>
    set(state => ({ overrides: { ...state.overrides, [eventId]: val } })),
}))
