import { useCallback, useState } from 'react'
import ApiService, { type EventDetail } from '@/api/apiService'

export interface CreateEventForm {
  title: string
  eventType: string
  description: string
  rules: string
  dateTime: Date | null
  endTime: Date | null
  capacity: number
  ageRestriction: 18 | 21 | 25
  locationName: string
  locationLat: number | null
  locationLng: number | null
  priceInr: number
  isFree: boolean
  coverPhotos: string[]
}

const INITIAL: CreateEventForm = {
  title: '',
  eventType: '',
  description: '',
  rules: '',
  dateTime: null,
  endTime: null,
  capacity: 20,
  ageRestriction: 18,
  locationName: '',
  locationLat: null,
  locationLng: null,
  priceInr: 0,
  isFree: false,
  coverPhotos: [],
}

export function useCreateEvent() {
  const [form, setFormState] = useState<CreateEventForm>(INITIAL)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const set = useCallback(<K extends keyof CreateEventForm>(key: K, value: CreateEventForm[K]) => {
    setFormState(prev => ({ ...prev, [key]: value }))
  }, [])

  const reset = useCallback(() => {
    setFormState(INITIAL)
    setSubmitError(null)
  }, [])

  const submit = useCallback(async (): Promise<EventDetail | null> => {
    setSubmitting(true)
    setSubmitError(null)
    try {
      // 1. Process and upload all local photos
      const uploadedUrls = (await Promise.all(
        form.coverPhotos.map(async (uri, index) => {
          if (!uri) return null
          if (uri.startsWith('http')) return uri // Already uploaded
          return await ApiService.uploadEventPhoto(uri, index)
        })
      )).filter(Boolean) as string[]

      // 2. Create the event with the remote URLs
      const result = await ApiService.createEvent({
        title: form.title,
        event_type: form.eventType,
        description: form.description || undefined,
        rules: form.rules || undefined,
        date_time: form.dateTime!.toISOString(),
        end_time: form.endTime ? form.endTime.toISOString() : undefined,
        capacity: form.capacity,
        age_restriction: form.ageRestriction,
        location_name: form.locationName || undefined,
        location_lat: form.locationLat ?? undefined,
        location_lng: form.locationLng ?? undefined,
        price_inr: form.isFree ? 0 : form.priceInr,
        cover_photos: uploadedUrls,
      })
      return result
    } catch (e: any) {
      setSubmitError(e.message ?? 'Failed to create event')
      return null
    } finally {
      setSubmitting(false)
    }
  }, [form])

  return { form, set, reset, submit, submitting, submitError }
}
