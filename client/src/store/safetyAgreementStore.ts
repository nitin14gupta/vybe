import { create } from 'zustand'

interface SafetyAgreementState {
  accepted: boolean
  loaded: boolean
  setAccepted: (accepted: boolean) => void
}

export const useSafetyAgreementStore = create<SafetyAgreementState>((set) => ({
  accepted: false,
  loaded: false,
  setAccepted: (accepted) => set({ accepted, loaded: true }),
}))
