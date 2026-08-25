import type { CreateEventForm } from '@/hooks/useCreateEvent'

// Rough India bounding box — Gorave only operates in India, so a pin dropped
// outside it (map panned/dragged too far) shouldn't be publishable.
const INDIA_BOUNDS = { minLat: 6.0, maxLat: 37.6, minLng: 68.0, maxLng: 97.5 }

export function isWithinIndia(lat: number, lng: number): boolean {
  return lat >= INDIA_BOUNDS.minLat && lat <= INDIA_BOUNDS.maxLat &&
    lng >= INDIA_BOUNDS.minLng && lng <= INDIA_BOUNDS.maxLng
}

export interface StepValidationResult {
  errors: Record<string, string>
  pillMessage: string | null
}

export function validateCreateEventStep(
  step: 1 | 2 | 3 | 4 | 5,
  form: CreateEventForm,
  freeSlotsUsed: number,
): StepValidationResult {
  const errs: Record<string, string> = {}
  let firstPill: string | null = null
  const flag = (field: string, inline: string, pill: string) => {
    errs[field] = inline
    if (!firstPill) firstPill = pill
  }

  if (step === 1) {
    if (!form.title.trim()) flag('title', 'Event title is required', 'Please add an event title')
    if (!form.eventType) flag('eventType', 'Please select an event type', 'Please select an event type')
  }
  if (step === 2) {
    if (!form.dateTime) {
      flag('dateTime', 'Event date is required', 'Please set an event date and time')
    } else if (form.dateTime < new Date(Date.now() + 24 * 60 * 60 * 1000)) {
      flag('dateTime', 'Events must be posted at least 24 hours in advance', 'Events must be posted at least 24 hours in advance')
    }
    if (!form.endTime) {
      flag('endTime', 'End date & time is required', 'Please set an end date and time for your event')
    } else if (form.dateTime) {
      const durMs = form.endTime.getTime() - form.dateTime.getTime()
      if (durMs <= 0) {
        flag('endTime', 'End time must be after start time', 'End time must be after the start time')
      } else if (durMs < 60 * 60 * 1000) {
        flag('endTime', 'Event must be at least 1 hour long', 'Event must be at least 1 hour long')
      } else if (durMs > 72 * 60 * 60 * 1000) {
        flag('endTime', "Events can't run longer than 3 days", "Events can't run longer than 3 days. Contact support for exceptions.")
      }
    }
    if (form.capacity < 5) flag('capacity', 'Minimum 5 guests required', 'Capacity must be between 5 and 200')
    if (form.capacity > 200) flag('capacity', 'Maximum 200 guests allowed', 'Capacity must be between 5 and 200')
  }
  if (step === 3) {
    if (!form.locationName.trim()) flag('locationName', 'Location is required', 'Please add a venue or address')
    else if (
      form.locationLat != null && form.locationLng != null &&
      !isWithinIndia(form.locationLat, form.locationLng)
    ) {
      flag('locationName', 'Pin must be inside India', 'Move the map pin to a location inside India')
    }
  }
  if (step === 4) {
    const slotsExhausted = freeSlotsUsed >= 2
    const minPrice = 99
    if (form.isFree && slotsExhausted) {
      flag('priceInr', "You've used 2 free events this month", "You've used your 2 free events this month. Set a ticket price.")
    } else if (!form.isFree && form.priceInr < minPrice) {
      flag('priceInr', `Minimum ticket price is ₹${minPrice}`, `Minimum ticket price is ₹${minPrice}`)
    }
  } else if (step === 5) {
    if (!form.coverPhotos[0]) {
      flag('coverPhotos', 'Cover photo is required', 'Please add a 16:9 cover photo for your event')
    }
  }

  return { errors: errs, pillMessage: firstPill }
}
