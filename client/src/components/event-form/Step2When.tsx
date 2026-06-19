import React from 'react'
import { Pressable, ScrollView, Text, View } from 'react-native'
import { Calendar, ChevronRight, Clock, Minus, Plus } from 'lucide-react-native'
import { Colors } from '@/constants'
import type { CreateEventForm } from '@/hooks/useCreateEvent'
import { ef, AGE_OPTIONS, fmt, fmtTime } from './styles'

interface Props {
  form: CreateEventForm
  set: <K extends keyof CreateEventForm>(key: K, value: CreateEventForm[K]) => void
  errors: Record<string, string>
  setErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>
  openDate: () => void
  openStartTime: () => void
  openEndDate: () => void
  openEndTime: () => void
  /** Lock age restriction (e.g. attendees already joined) */
  ageLocked?: boolean
  ageLockNote?: string
  disabled?: boolean
  scrollable?: boolean
}

function PickerRow({
  icon, label, value, onPress, placeholder,
}: {
  icon: React.ReactNode
  label: string
  value: string
  onPress: () => void
  placeholder?: string
}) {
  return (
    <Pressable style={ef.pickerRow} onPress={onPress}>
      <View style={ef.pickerIcon}>{icon}</View>
      <View style={ef.pickerContent}>
        <Text style={ef.pickerLabel}>{label}</Text>
        <Text style={[ef.pickerValue, !value && ef.pickerPlaceholder]}>
          {value || placeholder || 'Tap to select'}
        </Text>
      </View>
      <ChevronRight size={16} color={Colors.inkDisabled} />
    </Pressable>
  )
}

function Inner({ form, set, errors, setErrors, openDate, openStartTime, openEndDate, openEndTime, ageLocked, ageLockNote, disabled }: Omit<Props, 'scrollable'>) {
  return (
    <>
      <Text style={ef.fieldLabel}>Starts</Text>
      <PickerRow
        icon={<Calendar size={18} color={Colors.brandOrange} />}
        label="Date"
        value={form.dateTime ? fmt(form.dateTime) : ''}
        placeholder="Select a date"
        onPress={disabled ? () => {} : openDate}
      />
      {errors.dateTime ? <Text style={ef.errorText}>{errors.dateTime}</Text> : null}
      <PickerRow
        icon={<Clock size={18} color={Colors.brandOrange} />}
        label="Start Time"
        value={form.dateTime ? fmtTime(form.dateTime) : ''}
        placeholder="Select a time"
        onPress={disabled ? () => {} : openStartTime}
      />

      <Text style={[ef.fieldLabel, { marginTop: 20 }]}>Ends (optional)</Text>
      <PickerRow
        icon={<Calendar size={18} color={Colors.inkSecondary} />}
        label="End Date"
        value={form.endTime ? fmt(form.endTime) : ''}
        placeholder="Optional"
        onPress={disabled ? () => {} : openEndDate}
      />
      <PickerRow
        icon={<Clock size={18} color={Colors.inkSecondary} />}
        label="End Time"
        value={form.endTime ? fmtTime(form.endTime) : ''}
        placeholder="Optional"
        onPress={disabled ? () => {} : openEndTime}
      />
      {errors.endTime ? <Text style={ef.errorText}>{errors.endTime}</Text> : null}

      <Text style={[ef.fieldLabel, { marginTop: 20 }]}>Max Guests</Text>
      <View style={ef.stepperRow}>
        <Pressable style={ef.stepperBtn} onPress={() => !disabled && set('capacity', Math.max(5, form.capacity - 5))}>
          <Minus size={18} color={Colors.inkPrimary} />
        </Pressable>
        <Text style={ef.stepperValue}>{form.capacity}</Text>
        <Pressable style={ef.stepperBtn} onPress={() => !disabled && set('capacity', Math.min(200, form.capacity + 5))}>
          <Plus size={18} color={Colors.inkPrimary} />
        </Pressable>
      </View>
      {errors.capacity ? <Text style={ef.errorText}>{errors.capacity}</Text> : null}

      <View style={[ef.fieldLabelRow, { marginTop: 20 }]}>
        <Text style={ef.fieldLabel}>Age Restriction</Text>
        {ageLocked && ageLockNote && <Text style={ef.fieldLockNote}>{ageLockNote}</Text>}
      </View>
      <View style={[ef.ageRow, ageLocked && ef.sectionLocked]}>
        {AGE_OPTIONS.map(age => (
          <Pressable
            key={age}
            style={[ef.ageChip, form.ageRestriction === age && ef.ageChipActive]}
            onPress={() => !disabled && !ageLocked && set('ageRestriction', age)}
          >
            <Text style={[ef.ageText, form.ageRestriction === age && ef.ageTextActive]}>{age}+</Text>
          </Pressable>
        ))}
      </View>
    </>
  )
}

export function Step2When({ scrollable = true, ...props }: Props) {
  if (!scrollable) {
    return <View><Inner {...props} /></View>
  }
  return (
    <ScrollView style={ef.stepScroll} contentContainerStyle={ef.stepContent} keyboardShouldPersistTaps="handled">
      <Text style={ef.stepTitle}>When is it happening?</Text>
      <Text style={ef.stepSub}>Set the start date, end date, and capacity</Text>
      <Inner {...props} />
    </ScrollView>
  )
}
