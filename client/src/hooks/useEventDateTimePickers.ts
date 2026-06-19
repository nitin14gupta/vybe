import { Keyboard } from 'react-native'
import { useDateTimePicker } from '@/components/ui'
import type { CreateEventForm } from './useCreateEvent'

/**
 * Wraps the single shared DateTimePickerSheet instance and exposes
 * openDate / openStartTime / openEndDate / openEndTime handlers.
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

  const openEndDate = async () => {
    Keyboard.dismiss()
    const seed = form.endTime ?? form.dateTime ?? new Date()
    const picked = await picker.open('date', seed)
    const merged = new Date(picked)
    if (form.endTime) {
      // preserve existing end time on the new date
      merged.setHours(form.endTime.getHours(), form.endTime.getMinutes(), 0, 0)
    } else if (form.dateTime) {
      // default end to 1 hour after start on the picked date
      merged.setHours(form.dateTime.getHours() + 1, form.dateTime.getMinutes(), 0, 0)
    }
    set('endTime', merged)
  }

  const openEndTime = async () => {
    Keyboard.dismiss()
    const base = form.endTime ?? (form.dateTime ? new Date(form.dateTime.getTime() + 60 * 60 * 1000) : new Date())
    const picked = await picker.open('time', base)
    // Preserve the end date if already set; otherwise fall back to start date
    const merged = new Date(form.endTime ?? form.dateTime ?? new Date())
    merged.setHours(picked.getHours(), picked.getMinutes(), 0, 0)
    // Auto-advance only when no explicit end date was chosen and end <= start
    if (!form.endTime && form.dateTime && merged <= form.dateTime) {
      merged.setDate(merged.getDate() + 1)
    }
    set('endTime', merged)
  }

  return { openDate, openStartTime, openEndDate, openEndTime, picker }
}
