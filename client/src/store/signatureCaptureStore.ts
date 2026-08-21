import { create } from 'zustand'

// Bridges the signature-sheet route back to whichever screen pushed it —
// expo-router has no built-in way to return a value from a pushed screen,
// so the sheet writes the captured file uri here on confirm and the caller
// reads it back after router.back().
interface SignatureCaptureState {
  uri: string | null
  setUri: (uri: string | null) => void
}

export const useSignatureCaptureStore = create<SignatureCaptureState>((set) => ({
  uri: null,
  setUri: (uri) => set({ uri }),
}))
