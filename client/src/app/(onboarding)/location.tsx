import { View, Text, StyleSheet, Pressable, FlatList, Platform } from 'react-native'
import { KeyboardAvoidingView } from 'react-native-keyboard-controller'
import { router } from 'expo-router'
import { hTap, hSelection } from '@/lib/haptics'
import { Search, MapPin, Check } from 'lucide-react-native'
import { OutlineButton, StepDots, Input, PrimaryButton, Screen, LogoMark } from '@/components/ui'
import { useLocation } from '@/hooks/useLocation'
import { Colors, FontFamily, Spacing, Radius, withOpacity } from '@/constants'

export default function LocationScreen() {
  const {
    filtered,
    query,
    setQuery,
    selectedCity,
    loading,
    detecting,
    citiesLoading,
    citiesError,
    retryCities,
    selectCity,
    detectLocation,
    handleContinue,
  } = useLocation()

  return (
    <Screen>
      <LogoMark size={40} style={styles.logo} />

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
            leftIcon={
              <Search
                size={18}
                color={Colors.inkSecondary}
                strokeWidth={1.5}
                style={styles.searchIcon}
              />
            }
          />
        </View>

        <FlatList
          data={filtered}
          keyExtractor={c => c.name}
          ListHeaderComponent={
            <Pressable onPress={() => { hTap(); detectLocation() }} style={styles.detectRow}>
              <View style={styles.detectIcon}>
                <MapPin size={20} color={Colors.inkPrimary} strokeWidth={2} />
              </View>
              <Text style={styles.detectText}>
                {detecting ? 'Detecting…' : 'Use my current location'}
              </Text>
            </Pressable>
          }
          renderItem={({ item: c }) => (
            <Pressable onPress={() => { hSelection(); selectCity(c.name) }} style={styles.cityRow}>
              <View>
                <Text style={styles.cityName}>{c.name}</Text>
                <Text style={styles.cityState}>{c.state}</Text>
              </View>
              {selectedCity === c.name && (
                <Check size={20} color={Colors.inkPrimary} strokeWidth={2.5} />
              )}
            </Pressable>
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          showsVerticalScrollIndicator={false}
          style={styles.list}
          ListEmptyComponent={
            citiesLoading ? null : (
              <View style={styles.emptyState}>
                {citiesError ? (
                  <>
                    <Text style={styles.emptyTitle}>Couldn't load cities</Text>
                    <Text style={styles.emptyBody}>Check your connection and try again</Text>
                    <PrimaryButton label="Retry" onPress={retryCities} style={styles.emptyBtn} />
                  </>
                ) : query ? (
                  <>
                    <Text style={styles.emptyTitle}>No cities match "{query}"</Text>
                    <PrimaryButton label="Clear search" onPress={() => setQuery('')} style={styles.emptyBtn} />
                  </>
                ) : null}
              </View>
            )
          }
        />

        <StepDots step={5} />

        <View style={styles.footer}>
          <OutlineButton label="Back" onPress={() => router.back()} style={styles.backBtn} />
          <View style={styles.nextBtn}>
            <PrimaryButton
              label="Continue"
              onPress={handleContinue}
              disabled={!selectedCity}
              loading={loading}
            />
          </View>
        </View>
      </KeyboardAvoidingView>

    </Screen>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  logo: { alignSelf: 'center', marginBottom: 8 },
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
    backgroundColor: withOpacity(Colors.inkPrimary, 0.08),
    alignItems: 'center',
    justifyContent: 'center',
  },
  detectText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 15,
    color: Colors.inkPrimary,
  },
  cityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: Spacing.screenPadding,
  },
  cityName: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 15,
    color: Colors.inkPrimary,
    marginBottom: 2,
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
  footer: { flexDirection: 'row', gap: 12, paddingHorizontal: Spacing.screenPadding, paddingBottom: 16 },
  backBtn: { width: 96 },
  nextBtn: { flex: 1 },
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: Spacing.screenPadding,
    paddingTop: 40,
  },
  emptyTitle: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 15,
    color: Colors.inkPrimary,
    marginBottom: 6,
    textAlign: 'center',
  },
  emptyBody: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 13,
    color: Colors.inkSecondary,
    marginBottom: 20,
    textAlign: 'center',
  },
  emptyBtn: { width: '100%', marginTop: 16 },
})
