import { useCallback, useEffect, useState } from 'react'
import ApiService from '@/api/apiService'
import { hTap, hError } from '@/lib/haptics'
import { usePillStore } from '@/store/pillStore'
import { useSafetyStore } from '@/store/safetyStore'
import type { EmergencyContact } from '@/types/api'

// Mirrors server/routes/safety.py's MAX_EMERGENCY_CONTACTS — keep in sync.
export const MAX_EMERGENCY_CONTACTS = 5

// Compares by the last 10 digits so "+919876543210", "919876543210" and
// "9876543210" (device contacts and manual entry don't always agree on a
// country-code prefix) are all recognized as the same number.
export function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, '').slice(-10)
}

export interface AddContactInput {
  name: string
  phone: string
  emoji?: string | null
  source?: 'manual' | 'device'
}

// Module-scoped, not per-hook-instance — so if the home screen's promo card
// and the Safety Hub both mount around the same time on a cold app start,
// they share one in-flight GET instead of firing a duplicate each.
let inFlightLoad: Promise<void> | null = null

// CRUD + optimistic add/remove for the Safety Center's emergency contacts.
// State lives in useSafetyStore (a plain in-memory cache, not persisted to
// disk) so every screen reading it — Safety Hub, the home promo card —
// shares one fetch-once-per-app-session copy that mutates in place on
// add/remove, instead of each screen re-fetching on its own. Same shape as
// useHotlistToggle/useHotlistStore.
export function useEmergencyContacts() {
  const showPill = usePillStore(s => s.show)
  const contacts = useSafetyStore(s => s.contacts)
  const loaded = useSafetyStore(s => s.loaded)
  const setContacts = useSafetyStore(s => s.setContacts)
  const addContactToStore = useSafetyStore(s => s.addContact)
  const removeContactFromStore = useSafetyStore(s => s.removeContact)
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    if (inFlightLoad) return inFlightLoad
    setLoading(true)
    inFlightLoad = (async () => {
      try {
        const data = await ApiService.getEmergencyContacts()
        setContacts(data)
      } catch {
        showPill("Couldn't load emergency contacts", 'error')
      } finally {
        setLoading(false)
        inFlightLoad = null
      }
    })()
    return inFlightLoad
  }, [setContacts, showPill])

  const addContact = useCallback(async (input: AddContactInput): Promise<EmergencyContact | null> => {
    const target = normalizePhone(input.phone)
    if (contacts.some(c => normalizePhone(c.phone) === target)) {
      hError()
      showPill('This number is already an emergency contact', 'error')
      return null
    }
    try {
      const created = await ApiService.addEmergencyContact(input)
      addContactToStore(created)
      hTap()
      showPill('Emergency contact added')
      return created
    } catch (e: any) {
      hError()
      showPill(e?.message ?? "Couldn't add contact, try again", 'error')
      return null
    }
  }, [contacts, addContactToStore, showPill])

  const removeContact = useCallback(async (contact: EmergencyContact) => {
    removeContactFromStore(contact.id)
    try {
      await ApiService.removeEmergencyContact(contact.id)
      showPill(`Removed ${contact.name}`)
    } catch {
      addContactToStore(contact)
      showPill("Couldn't remove contact, try again", 'error')
    }
  }, [addContactToStore, removeContactFromStore, showPill])

  return {
    contacts,
    loading: loading && !loaded,
    loaded,
    load,
    addContact,
    removeContact,
    maxReached: contacts.length >= MAX_EMERGENCY_CONTACTS,
  }
}

export function useHasEmergencyContacts(): boolean {
  const contacts = useSafetyStore(s => s.contacts)
  const loaded = useSafetyStore(s => s.loaded)
  const { load } = useEmergencyContacts()

  useEffect(() => {
    if (!loaded) load()
  }, [loaded, load])

  return contacts.length > 0
}
