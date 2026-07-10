import React from 'react'
import { ScrollView, StyleSheet, Text, View, Pressable } from 'react-native'
import { MapPin } from 'lucide-react-native'
import { Colors } from '@/constants'
import { LocationPickerMap } from '@/components/maps'
import { useLocationSearch } from '@/hooks/useLocationSearch'
import { LocationSearchModal } from './LocationSearchModal'
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
  const search = useLocationSearch(form.locationLat, form.locationLng)
  
  const isOutsideIndia =
    form.locationLat != null &&
    form.locationLng != null &&
    (form.locationLat < 6 || form.locationLat > 36 || form.locationLng < 68 || form.locationLng > 98)

  const addressField = (
    <>
      <Text style={ef.fieldLabel}>Address *</Text>
      <Pressable 
        style={[ef.inputWrap, errors.locationName && ef.inputWrapError]}
        onPress={() => { if (!disabled) search.setSearchOpen(true) }}
      >
        <MapPin size={16} color={Colors.brandOrange} style={{ marginRight: 8 }} />
        <Text style={[ef.textInput, { flex: 1, color: form.locationName ? '#fff' : Colors.glassTextDisabled }]}>
          {form.locationName || "e.g. 142 Carter Rd, Bandra West"}
        </Text>
      </Pressable>
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
        <LocationSearchModal
          visible={search.searchOpen}
          onClose={() => search.setSearchOpen(false)}
          query={search.query}
          setQuery={search.setQuery}
          results={search.results}
          loading={search.loading}
          onSelect={(item) => {
            set('locationName', item.display_name)
            if (item.lat && item.lon) {
              set('locationLat', parseFloat(item.lat))
              set('locationLng', parseFloat(item.lon))
            }
            setErrors(e => ({ ...e, locationName: '' }))
            search.setSearchOpen(false)
          }}
        />
      </View>
    )
  }

  // Step 3 wizard layout: address fields and map scroll together
  return (
    <View style={ef.step3Container}>
      <ScrollView style={ef.stepScroll} contentContainerStyle={ef.stepContent}>
        <Text style={ef.stepTitle}>Where's the VYBE?</Text>
        <Text style={ef.stepSub}>Set your event location</Text>
        {addressField}
        {mapBlock}
      </ScrollView>

      <LocationSearchModal
        visible={search.searchOpen}
        onClose={() => search.setSearchOpen(false)}
        query={search.query}
        setQuery={search.setQuery}
        results={search.results}
        loading={search.loading}
        onSelect={(item) => {
          set('locationName', item.display_name)
          if (item.lat && item.lon) {
            set('locationLat', parseFloat(item.lat))
            set('locationLng', parseFloat(item.lon))
          }
          setErrors(e => ({ ...e, locationName: '' }))
          search.setSearchOpen(false)
        }}
      />
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
