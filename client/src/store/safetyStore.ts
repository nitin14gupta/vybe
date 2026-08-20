import { create } from 'zustand'
import type { EmergencyContact } from '@/types/api'

// Emergency contacts live here (not local screen state) so the Safety Hub
// can show an up-to-date count/preview without re-fetching every time it's
// opened — same reasoning as hotlistStore.
interface SafetyState {
  contacts: EmergencyContact[]
  loaded: boolean
  setContacts: (contacts: EmergencyContact[]) => void
  addContact: (contact: EmergencyContact) => void
  removeContact: (id: string) => void
}

export const useSafetyStore = create<SafetyState>((set) => ({
  contacts: [],
  loaded: false,
  setContacts: (contacts) => set({ contacts, loaded: true }),
  addContact: (contact) => set(state => ({ contacts: [...state.contacts, contact] })),
  removeContact: (id) => set(state => ({ contacts: state.contacts.filter(c => c.id !== id) })),
}))
