import { useCallback, useEffect, useState } from 'react'
import { Linking } from 'react-native'
import { Contact, ContactField, ContactsSortOrder, requestPermissionsAsync } from 'expo-contacts'
import { usePillStore } from '@/store/pillStore'

export interface DeviceContact {
  id: string
  name: string
  phone: string
}

export type DeviceContactsStatus = 'loading' | 'granted' | 'denied'

// Reads the phone's address book for the "Choose contact" picker, via
// expo-contacts' class-based API (Contact.getAllDetails) — the plain
// getContactsAsync() function is deprecated as of SDK 56 in favor of this.
// Contacts without a name or phone number are dropped — an emergency
// contact with no number to call is useless here. Mirrors useLocation's
// permission-request shape: ask once, and if the user can't be asked again,
// send them to Settings instead of silently failing.
export function useDeviceContacts() {
  const showPill = usePillStore(s => s.show)
  const [contacts, setContacts] = useState<DeviceContact[]>([])
  const [status, setStatus] = useState<DeviceContactsStatus>('loading')
  const [canAskAgain, setCanAskAgain] = useState(true)

  const load = useCallback(async () => {
    setStatus('loading')
    try {
      const perm = await requestPermissionsAsync()
      setCanAskAgain(perm.canAskAgain)
      if (!perm.granted) {
        setStatus('denied')
        return
      }
      const details = await Contact.getAllDetails([ContactField.FULL_NAME, ContactField.PHONES], {
        sortOrder: ContactsSortOrder.GivenName,
      })
      const parsed: DeviceContact[] = details.flatMap(c => {
        const number = c.phones?.[0]?.number
        if (!c.fullName || !number) return []
        return [{ id: c.id, name: c.fullName, phone: number.replace(/[^\d+]/g, '') }]
      })
      setContacts(parsed)
      setStatus('granted')
    } catch {
      showPill("Couldn't load your contacts", 'error')
      setStatus('denied')
    }
  }, [showPill])

  useEffect(() => { load() }, [load])

  return { contacts, status, canAskAgain, reload: load, openSettings: Linking.openSettings }
}
