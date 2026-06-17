import { Keyboard } from 'react-native'
import { useDateTimePicker } from '@/components/ui'
import type { CreateEventForm } from './useCreateEvent'

/**
 * Wraps the single shared DateTimePickerSheet instance and exposes
 * openDate / openStartTime / openEndTime handlers.
 *
 * Both create.tsx and edit.tsx pass this hook's return value to Step2When.
 */
export function useEventDateTimePickers(
  form: Pick<CreateEventForm, 'dateTime' | 'endTime'>,
  set: <K extends keyof CreateEventForm>(key: K, value: CreateEventForm[K]) => void,
) {
  const picker = useDateTimePicker()

  const openDate = async () => {
    Keyboard.dismiss()
    const seed = form.dateTime ?? new Date()
    const picked = await picker.open('date', seed)
    const merged = new Date(picked)
    if (form.dateTime) merged.setHours(form.dateTime.getHours(), form.dateTime.getMinutes(), 0, 0)
    set('dateTime', merged)
  }

  const openStartTime = async () => {
    Keyboard.dismiss()
    const seed = form.dateTime ?? new Date()
    const picked = await picker.open('time', seed)
    const merged = new Date(form.dateTime ?? new Date())
    merged.setHours(picked.getHours(), picked.getMinutes(), 0, 0)
    set('dateTime', merged)
  }

  const openEndTime = async () => {
    Keyboard.dismiss()
    const base = form.dateTime ? new Date(form.dateTime.getTime() + 60 * 60 * 1000) : new Date()
    const seed = form.endTime
      ? (() => {
          const s = new Date(form.dateTime ?? new Date())
          s.setHours(form.endTime!.getHours(), form.endTime!.getMinutes(), 0, 0)
          return s
        })()
      : base
    const picked = await picker.open('time', seed)
    const merged = new Date(form.dateTime ?? new Date())
    merged.setHours(picked.getHours(), picked.getMinutes(), 0, 0)
    set('endTime', merged)
  }

  return { openDate, openStartTime, openEndTime, picker }
}
