import { useState, useEffect } from 'react'
import { View, Text, StyleSheet, Pressable, FlatList, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native'
import { router } from 'expo-router'
import { hTap, hSuccess, hSelection } from '@/lib/haptics'
import { Search, MapPin, Check, ChevronLeft } from 'lucide-react-native'
import { Input, Screen } from '@/components/ui'
import { useLocation } from '@/hooks/useLocation'
import { setLocation } from '@/api/user'
import { useOnboardingStore } from '@/store/onboarding'
import { Colors, FontFamily, Spacing, Radius } from '@/constants'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

export default function ProfileLocationScreen() {
  const insets = useSafeAreaInsets()
  const { filtered, query, setQuery, selectedCity, detecting, selectCity, detectLocation } = useLocation()
  const store = useOnboardingStore()
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!selectedCity) return
    setSaving(true)
    try {
      await setLocation(selectedCity, store.lat ?? 0, store.lng ?? 0)
      router.back()
    } catch {
      setSaving(false)
    }
  }

  return (
    <Screen>
      {/* Header */}
      <View style={s.header}>
        <Pressable onPress={() => router.back()} style={s.backBtn} hitSlop={8} android_ripple={null}>
          <ChevronLeft size={24} color={Colors.inkPrimary} strokeWidth={2} />
        </Pressable>
        <Text style={s.title}>Change City</Text>
        <Pressable onPress={() => { hSuccess(); handleSave() }} disabled={!selectedCity || saving} hitSlop={8} style={s.saveArea} android_ripple={null}>
          {saving
            ? <ActivityIndicator size="small" color={Colors.brandOrange} />
            : <Text style={[s.saveBtn, !selectedCity && s.saveBtnDisabled]}>Save</Text>
          }
        </Pressable>
      </View>

      <KeyboardAvoidingView
        style={s.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={s.searchWrap}>
          <Input
            placeholder="Search cities…"
            value={query}
            onChangeText={setQuery}
            leftIcon={<Search size={18} color={Colors.inkSecondary} strokeWidth={1.5} style={s.searchIcon} />}
          />
        </View>

        <FlatList
          data={filtered}
          keyExtractor={c => c.name}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={
            <Pressable onPress={() => { hTap(); detectLocation() }} style={s.detectRow} android_ripple={null}>
              <View style={s.detectIcon}>
                <MapPin size={20} color={Colors.brandOrange} strokeWidth={2} />
              </View>
              <Text style={s.detectText}>
                {detecting ? 'Detecting…' : 'Use my current location'}
              </Text>
            </Pressable>
          }
          renderItem={({ item: c }) => (
            <Pressable
              onPress={() => { hSelection(); selectCity(c.name) }}
              style={s.cityRow}
              android_ripple={{ color: 'rgba(255,255,255,0.04)' }}
            >
              <View>
                <Text style={[s.cityName, selectedCity === c.name && s.cityNameSelected]}>
                  {c.name}
                </Text>
                <Text style={s.cityState}>{c.state}</Text>
              </View>
              {selectedCity === c.name && (
                <Check size={20} color={Colors.brandOrange} strokeWidth={2.5} />
              )}
            </Pressable>
          )}
          ItemSeparatorComponent={() => <View style={s.sep} />}
          showsVerticalScrollIndicator={false}
          style={s.list}
          contentContainerStyle={{ paddingBottom: insets.bottom + 16 }}
        />
      </KeyboardAvoidingView>
    </Screen>
  )
}

const s = StyleSheet.create({
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingBottom: 16,
    paddingTop: 12,
  },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  title: {
    flex: 1,
    fontFamily: FontFamily.headingBold,
    fontSize: 18,
    color: Colors.inkPrimary,
    textAlign: 'center',
  },
  saveArea: { width: 48, alignItems: 'flex-end' },
  saveBtn: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 15,
    color: Colors.brandOrange,
  },
  saveBtnDisabled: { color: Colors.inkDisabled },

  searchWrap: { paddingHorizontal: Spacing.screenPadding, paddingBottom: 14 },
  searchIcon: { marginRight: 8 },
  list: { flex: 1 },

  detectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
    paddingHorizontal: Spacing.screenPadding,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  detectIcon: {
    width: 40,
    height: 40,
    borderRadius: Radius.card,
    backgroundColor: 'rgba(255,107,53,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detectText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 15,
    color: Colors.brandOrange,
  },

  cityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 18,
    paddingHorizontal: Spacing.screenPadding,
  },
  cityName: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 16,
    color: Colors.inkPrimary,
    marginBottom: 4,
  },
  cityNameSelected: { color: Colors.brandOrange },
  cityState: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 14,
    color: Colors.inkSecondary,
  },
  sep: {
    height: 1,
    backgroundColor: Colors.divider,
    marginHorizontal: Spacing.screenPadding,
  },
})
