import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'

interface OnboardingState {
  name: string
  dob: string
  gender: string
  bio: string
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
  bio: '',
  photoUris: [] as string[],
  voiceUri: null as string | null,
  interests: [] as string[],
  city: null as string | null,
  lat: null as number | null,
  lng: null as number | null,
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      ...initialState,
      setField: (key, value) => set({ [key]: value } as Partial<OnboardingState>),
      reset: () => set(initialState),
    }),
    {
      name: 'vybe-onboarding',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        name: state.name,
        dob: state.dob,
        gender: state.gender,
        bio: state.bio,
        photoUris: state.photoUris,
        voiceUri: state.voiceUri,
        interests: state.interests,
        city: state.city,
        lat: state.lat,
        lng: state.lng,
      }),
    },
  ),
)
