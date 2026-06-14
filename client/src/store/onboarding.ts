import { create } from 'zustand'

interface OnboardingState {
  name: string
  dob: string
  gender: string
  photoUris: string[]
  voiceUri: string | null
  interests: string[]
  city: string | null
  lat: number | null
  lng: number | null
  setField: <K extends keyof Omit<OnboardingState, 'setField' | 'reset'>>(
    key: K,
    value: OnboardingState[K]
  ) => void
  reset: () => void
}

const initialState = {
  name: '',
  dob: '',
  gender: '',
  photoUris: [] as string[],
  voiceUri: null as string | null,
  interests: [] as string[],
  city: null as string | null,
  lat: null as number | null,
  lng: null as number | null,
}

export const useOnboardingStore = create<OnboardingState>((set) => ({
  ...initialState,
  setField: (key, value) => set({ [key]: value } as Partial<OnboardingState>),
  reset: () => set(initialState),
}))
