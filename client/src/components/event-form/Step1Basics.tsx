import React from 'react'
import { Pressable, ScrollView, Text, View } from 'react-native'
import { Colors, DESCRIPTION_TEMPLATES, RULES_TEMPLATES } from '@/constants'
import { GlassInput } from '@/components/ui'
import type { CreateEventForm } from '@/hooks/useCreateEvent'
import { ef, EVENT_TYPES } from './styles'

interface Props {
  form: CreateEventForm
  set: <K extends keyof CreateEventForm>(key: K, value: CreateEventForm[K]) => void
  errors: Record<string, string>
  setErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>
  disabled?: boolean
  /** Wrap in ScrollView (default true — set false when parent already scrolls) */
  scrollable?: boolean
}

// Picks a random template, re-rolling once if it lands on the text already
// in the field — so tapping "Prefill" twice in a row visibly swaps instead
// of occasionally looking like a no-op.
function randomTemplate(list: string[], current: string): string {
  if (list.length <= 1) return list[0] ?? ''
  let pick = list[Math.floor(Math.random() * list.length)]
  if (pick === current) {
    pick = list[Math.floor(Math.random() * list.length)]
  }
  return pick
}

function Inner({ form, set, errors, setErrors, disabled }: Omit<Props, 'scrollable'>) {
  return (
    <>
      <Text style={ef.fieldLabel}>Event Title *</Text>
      <GlassInput
        value={form.title}
        onChangeText={v => { set('title', v.slice(0, 60)); setErrors(e => ({ ...e, title: '' })) }}
        placeholder="What's the vibe called?"
        maxLength={60}
        disabled={disabled}
        error={errors.title}
      />

      <Text style={[ef.fieldLabel, { marginTop: 20 }]}>Event Type *</Text>
      {errors.eventType ? <Text style={ef.errorText}>{errors.eventType}</Text> : null}
      <View style={ef.typeGrid}>
        {EVENT_TYPES.map(t => (
          <Pressable
            key={t.key}
            style={[ef.typeChip, form.eventType === t.key && ef.typeChipActive]}
            onPress={() => { if (!disabled) { set('eventType', t.key); setErrors(e => ({ ...e, eventType: '' })) } }}
          >
            <t.icon size={16} color={form.eventType === t.key ? '#fff' : Colors.glassTextSecondary} strokeWidth={2} />
            <Text style={[ef.typeLabel, form.eventType === t.key && ef.typeLabelActive]}>{t.label}</Text>
          </Pressable>
        ))}
      </View>

      <View style={[ef.fieldLabelRow, { marginTop: 20 }]}>
        <Text style={ef.fieldLabel}>Description</Text>
        {!disabled && (
          <Pressable
            style={ef.autofillBtn}
            onPress={() => set('description', randomTemplate(DESCRIPTION_TEMPLATES, form.description).slice(0, 500))}
          >
            <Text style={ef.autofillBtnText}>Prefill</Text>
          </Pressable>
        )}
      </View>
      <GlassInput
        value={form.description}
        onChangeText={v => set('description', v.slice(0, 500))}
        placeholder="Tell people about the vibe..."
        multiline
        maxLength={500}
        disabled={disabled}
      />

      <View style={[ef.fieldLabelRow, { marginTop: 20 }]}>
        <Text style={ef.fieldLabel}>House Rules (optional)</Text>
        {!disabled && (
          <Pressable
            style={ef.autofillBtn}
            onPress={() => set('rules', randomTemplate(RULES_TEMPLATES, form.rules).slice(0, 200))}
          >
            <Text style={ef.autofillBtnText}>Prefill</Text>
          </Pressable>
        )}
      </View>
      <GlassInput
        value={form.rules}
        onChangeText={v => set('rules', v.slice(0, 200))}
        placeholder="No shoes inside, BYO food..."
        multiline
        maxLength={200}
        disabled={disabled}
      />
    </>
  )
}

export function Step1Basics({ scrollable = true, ...props }: Props) {
  if (!scrollable) {
    return <View style={ef.field}><Inner {...props} /></View>
  }
  return (
    <ScrollView style={ef.stepScroll} contentContainerStyle={ef.stepContent} keyboardShouldPersistTaps="handled">
      <Text style={ef.stepTitle}>The Basics</Text>
      <Text style={ef.stepSub}>Tell people what your event is about</Text>
      <Inner {...props} />
    </ScrollView>
  )
}
