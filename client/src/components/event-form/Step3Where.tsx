import React from 'react'
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { MapPin } from 'lucide-react-native'
import { Colors } from '@/constants'
import { LocationPickerMap } from '@/components/maps'
import type { CreateEventForm } from '@/hooks/useCreateEvent'
import { ef } from './styles'

interface Props {
  form: CreateEventForm
  set: <K extends keyof CreateEventForm>(key: K, value: CreateEventForm[K]) => void
  errors: Record<string, string>
  setErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>
  disabled?: boolean
  /**
   * When true the map fills a fixed-height block below the address field.
   * When false (default) the component uses a flex column layout intended
   * for use as Step 3 inside the create wizard (top scroll + bottom map).
   */
  inline?: boolean
}

export function Step3Where({ form, set, errors, setErrors, disabled, inline = false }: Props) {
  const isOutsideIndia =
    form.locationLat != null &&
    form.locationLng != null &&
    (form.locationLat < 6 || form.locationLat > 36 || form.locationLng < 68 || form.locationLng > 98)

  const addressField = (
    <>
      <Text style={ef.fieldLabel}>Address *</Text>
      <View style={[ef.inputWrap, errors.locationName && ef.inputWrapError]}>
        <MapPin size={16} color={Colors.brandOrange} style={{ marginRight: 8 }} />
        <TextInput
          style={[ef.textInput, { flex: 1 }]}
          value={form.locationName}
          onChangeText={v => { set('locationName', v); setErrors(e => ({ ...e, locationName: '' })) }}
          placeholder="e.g. 142 Carter Rd, Bandra West"
          placeholderTextColor={Colors.inkDisabled}
          editable={!disabled}
        />
      </View>
      {errors.locationName ? <Text style={ef.errorText}>{errors.locationName}</Text> : null}
      <Text style={ef.locationNote}>📍 Exact address is only shown to confirmed guests</Text>
      {isOutsideIndia && (
        <View style={ef.indiaBanner}>
          <Text style={ef.indiaBannerText}>⚠️ Location appears to be outside India — are you sure?</Text>
        </View>
      )}
    </>
  )

  const mapBlock = (
    <View style={inline ? s.mapInline : ef.mapWrap}>
      <LocationPickerMap
        lat={form.locationLat ?? undefined}
        lng={form.locationLng ?? undefined}
        onChange={(lat, lng) => { set('locationLat', lat); set('locationLng', lng) }}
        onAddressDetected={address => { if (!form.locationName.trim()) set('locationName', address) }}
      />
      {!inline && (
        <View style={ef.mapCentrePin} pointerEvents="none">
          <MapPin size={36} color={Colors.brandOrange} fill="rgba(255,107,53,0.25)" />
        </View>
      )}
    </View>
  )

  if (inline) {
    return (
      <View>
        {addressField}
        {mapBlock}
      </View>
    )
  }

  // Step 3 wizard layout: address fields scroll on top, map pinned at bottom
  return (
    <View style={ef.step3Container}>
      <ScrollView style={ef.stepScroll} contentContainerStyle={[ef.stepContent, { paddingBottom: 0 }]}>
        <Text style={ef.stepTitle}>Where's the VYBE?</Text>
        <Text style={ef.stepSub}>Set your event location</Text>
        {addressField}
      </ScrollView>
      {mapBlock}
    </View>
  )
}

const s = StyleSheet.create({
  mapInline: {
    height: 220,
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 12,
  },
})
