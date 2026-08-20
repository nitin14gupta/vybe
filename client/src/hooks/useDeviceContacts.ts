import { useCallback, useEffect, useState } from 'react'
import { Linking } from 'react-native'
import * as Contacts from 'expo-contacts'
import { usePillStore } from '@/store/pillStore'

export interface DeviceContact {
  id: string
  name: string
  phone: string
}

export type DeviceContactsStatus = 'loading' | 'granted' | 'denied'

export function useDeviceContacts() {
  const showPill = usePillStore(s => s.show)
  const [contacts, setContacts] = useState<DeviceContact[]>([])
  const [status, setStatus] = useState<DeviceContactsStatus>('loading')
  const [canAskAgain, setCanAskAgain] = useState(true)

  const load = useCallback(async () => {
    setStatus('loading')
    try {
      const perm = await Contacts.requestPermissionsAsync()
      setCanAskAgain(perm.canAskAgain)
      if (perm.status !== 'granted') {
        setStatus('denied')
        return
      }
      const { data } = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.PhoneNumbers],
        sort: Contacts.SortTypes.FirstName,
      })
      const parsed: DeviceContact[] = data.flatMap(c => {
        const number = c.phoneNumbers?.[0]?.number
        if (!c.id || !c.name || !number) return []
        return [{ id: c.id, name: c.name, phone: number.replace(/[^\d+]/g, '') }]
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
