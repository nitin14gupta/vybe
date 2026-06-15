import { useState } from 'react'
import { View, Text, StyleSheet, Pressable, FlatList, Alert, KeyboardAvoidingView, Platform } from 'react-native'
import { router } from 'expo-router'
import * as Location from 'expo-location'
import { Search, MapPin, Check } from 'lucide-react-native'
import { BackButton, ProgressBar, Input, PrimaryButton, Screen } from '@/components/ui'
import { useOnboardingStore } from '@/store/onboarding'
import { setLocation } from '@/api/user'
import { CITIES } from '@/constants/onboarding'
import { Colors, FontFamily, Spacing, Radius } from '@/constants'

export default function LocationScreen() {
  const store = useOnboardingStore()
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [detecting, setDetecting] = useState(false)

  const filtered = CITIES.filter(c =>
    c.name.toLowerCase().includes(query.toLowerCase()),
  )

  const selectCity = (name: string) => {
    store.setField('city', name)
  }

  const detectLocation = async () => {
    setDetecting(true)
    try {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please allow location access.')
        return
      }
      const loc = await Location.getCurrentPositionAsync({})
      store.setField('lat', loc.coords.latitude)
      store.setField('lng', loc.coords.longitude)
      store.setField('city', 'Mumbai')
    } catch {
      Alert.alert('Error', 'Could not detect location.')
    } finally {
      setDetecting(false)
    }
  }

  const handleContinue = async () => {
    if (!store.city) return
    setLoading(true)
    try {
      await setLocation(store.city, store.lat ?? 0, store.lng ?? 0)
      router.replace('/(onboarding)/complete')
    } catch {
      router.replace('/(onboarding)/complete')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Screen>
      <BackButton onPress={() => router.back()} />
      <ProgressBar step={5} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
      <View style={styles.header}>
        <Text style={styles.title}>Where are you based?</Text>
        <Text style={styles.subtitle}>We'll show you events near you</Text>
      </View>

      <View style={styles.searchWrap}>
        <Input
          placeholder="Search cities…"
          value={query}
          onChangeText={setQuery}
          leftIcon={<Search size={18} color={Colors.inkSecondary} strokeWidth={1.5} style={styles.searchIcon} />}
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={c => c.name}
        ListHeaderComponent={
          <Pressable onPress={detectLocation} style={styles.detectRow}>
            <View style={styles.detectIcon}>
              <MapPin size={20} color={Colors.brandOrange} strokeWidth={2} />
            </View>
            <Text style={styles.detectText}>
              {detecting ? 'Detecting…' : 'Use my current location'}
            </Text>
          </Pressable>
        }
        renderItem={({ item: c }) => (
          <Pressable onPress={() => selectCity(c.name)} style={styles.cityRow}>
            <View style={styles.cityInfo}>
              <Text style={[styles.cityName, store.city === c.name && styles.cityNameSelected]}>
                {c.name}
              </Text>
              <Text style={styles.cityState}>{c.state}</Text>
            </View>
            {store.city === c.name && (
              <Check size={20} color={Colors.brandOrange} strokeWidth={2.5} />
            )}
          </Pressable>
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        showsVerticalScrollIndicator={false}
        style={styles.list}
      />

      <View style={styles.footer}>
        <PrimaryButton
          label="Continue"
          onPress={handleContinue}
          disabled={!store.city}
          loading={loading}
        />
      </View>
      </KeyboardAvoidingView>
    </Screen>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: { paddingHorizontal: Spacing.screenPadding, paddingBottom: 12 },
  title: {
    fontFamily: FontFamily.headingBold,
    fontSize: 24,
    letterSpacing: -0.24,
    color: Colors.inkPrimary,
    marginBottom: 6,
  },
  subtitle: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 13,
    color: Colors.inkSecondary,
  },
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
    paddingVertical: 16,
    paddingHorizontal: Spacing.screenPadding,
  },
  cityInfo: {},
  cityName: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 15,
    color: Colors.inkPrimary,
    marginBottom: 2,
  },
  cityNameSelected: {
    color: Colors.brandOrange,
  },
  cityState: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 12,
    color: Colors.inkSecondary,
  },
  separator: {
    height: 1,
    backgroundColor: Colors.divider,
    marginHorizontal: Spacing.screenPadding,
  },
  footer: { paddingHorizontal: Spacing.screenPadding, paddingBottom: 16 },
})
