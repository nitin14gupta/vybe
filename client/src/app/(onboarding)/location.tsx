import { View, Text, StyleSheet, Pressable, FlatList, KeyboardAvoidingView, Platform } from 'react-native'
import { router } from 'expo-router'
import { hTap, hSelection } from '@/lib/haptics'
import { Search, MapPin, Check } from 'lucide-react-native'
import { BackButton, ProgressBar, Input, PrimaryButton, Screen, ToastBanner } from '@/components/ui'
import { useLocation } from '@/hooks/useLocation'
import { Colors, FontFamily, Spacing, Radius } from '@/constants'

export default function LocationScreen() {
  const {
    filtered,
    query,
    setQuery,
    selectedCity,
    loading,
    detecting,
    toast,
    selectCity,
    detectLocation,
    handleContinue,
  } = useLocation()

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
                <MapPin size={20} color={Colors.brandOrange} strokeWidth={2} />
              </View>
              <Text style={styles.detectText}>
                {detecting ? 'Detecting…' : 'Use my current location'}
              </Text>
            </Pressable>
          }
          renderItem={({ item: c }) => (
            <Pressable onPress={() => { hSelection(); selectCity(c.name) }} style={styles.cityRow}>
              <View>
                <Text style={[styles.cityName, selectedCity === c.name && styles.cityNameSelected]}>
                  {c.name}
                </Text>
                <Text style={styles.cityState}>{c.state}</Text>
              </View>
              {selectedCity === c.name && (
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
            disabled={!selectedCity}
            loading={loading}
          />
        </View>
      </KeyboardAvoidingView>

      {toast && (
        <ToastBanner key={toast.key} message={toast.message} type={toast.type} />
      )}
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
  cityName: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 15,
    color: Colors.inkPrimary,
    marginBottom: 2,
  },
  cityNameSelected: { color: Colors.brandOrange },
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
