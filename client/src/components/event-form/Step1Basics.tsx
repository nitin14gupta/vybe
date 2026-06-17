import React from 'react'
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import { Colors } from '@/constants'
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

function Inner({ form, set, errors, setErrors, disabled }: Omit<Props, 'scrollable'>) {
  return (
    <>
      <Text style={ef.fieldLabel}>Event Title *</Text>
      <View style={[ef.inputWrap, errors.title && ef.inputWrapError]}>
        <TextInput
          style={ef.textInput}
          value={form.title}
          onChangeText={v => { set('title', v.slice(0, 60)); setErrors(e => ({ ...e, title: '' })) }}
          placeholder="What's the vibe called?"
          placeholderTextColor={Colors.inkDisabled}
          maxLength={60}
          editable={!disabled}
        />
        <Text style={ef.charCount}>{form.title.length}/60</Text>
      </View>
      {errors.title ? <Text style={ef.errorText}>{errors.title}</Text> : null}

      <Text style={[ef.fieldLabel, { marginTop: 20 }]}>Event Type *</Text>
      {errors.eventType ? <Text style={ef.errorText}>{errors.eventType}</Text> : null}
      <View style={ef.typeGrid}>
        {EVENT_TYPES.map(t => (
          <Pressable
            key={t.key}
            style={[ef.typeChip, form.eventType === t.key && ef.typeChipActive]}
            onPress={() => { if (!disabled) { set('eventType', t.key); setErrors(e => ({ ...e, eventType: '' })) } }}
          >
            <Text style={ef.typeEmoji}>{t.emoji}</Text>
            <Text style={[ef.typeLabel, form.eventType === t.key && ef.typeLabelActive]}>{t.label}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={[ef.fieldLabel, { marginTop: 20 }]}>Description</Text>
      <View style={ef.inputWrap}>
        <TextInput
          style={[ef.textInput, ef.textArea]}
          value={form.description}
          onChangeText={v => set('description', v.slice(0, 500))}
          placeholder="Tell people about the vibe..."
          placeholderTextColor={Colors.inkDisabled}
          multiline
          maxLength={500}
          editable={!disabled}
        />
        <Text style={ef.charCount}>{form.description.length}/500</Text>
      </View>

      <Text style={[ef.fieldLabel, { marginTop: 20 }]}>House Rules (optional)</Text>
      <View style={ef.inputWrap}>
        <TextInput
          style={[ef.textInput, ef.textArea]}
          value={form.rules}
          onChangeText={v => set('rules', v.slice(0, 200))}
          placeholder="No shoes inside, BYO food..."
          placeholderTextColor={Colors.inkDisabled}
          multiline
          maxLength={200}
          editable={!disabled}
        />
        <Text style={ef.charCount}>{form.rules.length}/200</Text>
      </View>
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
