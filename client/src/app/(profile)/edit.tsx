import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator } from 'react-native'
import { useCallback } from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router, useFocusEffect } from 'expo-router'
import { hSuccess } from '@/lib/haptics'
import { AppHeader, APP_HEADER_BAR_HEIGHT, BackButton, PrimaryButton, Screen, BioInput, BrandedLoader } from '@/components/ui'
import { useHeaderScroll } from '@/hooks/useHeaderScroll'
import { ProfileEditPhotoStrip } from '@/components/profile/ProfileEditPhotoStrip'
import { ProfileNameField } from '@/components/profile/ProfileNameField'
import { ProfileUsernameField } from '@/components/profile/ProfileUsernameField'
import { ProfileBadgeSelector } from '@/components/profile/ProfileBadgeSelector'
import { ProfileInterestsSection } from '@/components/profile/ProfileInterestsSection'
import { ProfileVoiceIntroSection } from '@/components/profile/ProfileVoiceIntroSection'
import { useEditProfile } from '@/hooks/useEditProfile'
import { useInterests } from '@/hooks/useInterests'
import { useVoiceEdit } from '@/hooks/useVoiceEdit'
import { useOnboardingStore } from '@/store/onboarding'
import { usePillStore } from '@/store/pillStore'
import { Colors, FontFamily, Spacing, Radius } from '@/constants'

export default function EditProfileScreen() {
  const {
    profile, name, setName, username, setUsername, bio, setBio,
    selectedBadges, availableBadges, toggleBadge,
    isDirty, loading, saving, handleSave,
    originalUsername,
    refreshPhotos,
  } = useEditProfile()

  const { availableInterests, selected: selectedInterests, atMax: interestsAtMax, toggle: toggleInterest } = useInterests()
  const voice = useVoiceEdit(profile?.voice_url)
  const city = useOnboardingStore(s => s.city)
  const showPill = usePillStore(s => s.show)
  const { hideProgress, onScroll } = useHeaderScroll()
  const insets = useSafeAreaInsets()
  const headerHeight = APP_HEADER_BAR_HEIGHT + insets.top

  useFocusEffect(
    useCallback(() => {
      refreshPhotos()
    }, [refreshPhotos])
  )

  if (loading) {
    return (
      <Screen>
        <View style={styles.loader}><BrandedLoader /></View>
      </Screen>
    )
  }

  const voiceDirty = !!voice.localUri && voice.recorded
  const canSave = (isDirty || voiceDirty) && !saving

  const onPressSave = async () => {
    if (voiceDirty) {
      try {
        await voice.saveVoice()
      } catch {
        // saveError shown in ProfileVoiceIntroSection; still save other fields
      }
    }
    await handleSave()
  }

  return (
    <Screen top={false}>
      <AppHeader
        title="Edit Profile"
        hideProgress={hideProgress}
        leftAction={<BackButton onPress={() => router.back()} />}
        rightAction={
          <Pressable onPress={() => { hSuccess(); onPressSave() }} disabled={!canSave} hitSlop={8} style={styles.saveArea}>
            {saving
              ? <ActivityIndicator size="small" color={Colors.brandOrange} />
              : <Text style={[styles.saveBtn, !canSave && styles.saveBtnDisabled]}>Save</Text>
            }
          </Pressable>
        }
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingTop: headerHeight }]}
        keyboardShouldPersistTaps="handled"
        onScroll={onScroll}
        scrollEventThrottle={16}
      >

        {/* Photos */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.label, { marginBottom: 0 }]}>PHOTOS</Text>
            <Pressable onPress={() => router.push('/(profile)/edit-photos')} hitSlop={8}>
              <Text style={styles.changeBtnText}>Manage</Text>
            </Pressable>
          </View>
          <ProfileEditPhotoStrip photos={profile?.photos} />
        </View>

        <ProfileNameField
          name={name}
          setName={setName}
          nameChangedAt={profile?.name_changed_at}
          onLockedPress={unlockDateLabel => showPill(`Cannot change name until ${unlockDateLabel}`, 'error')}
        />

        <ProfileUsernameField
          username={username}
          setUsername={setUsername}
          originalUsername={originalUsername}
        />

        {/* Bio */}
        <View style={styles.section}>
          <Text style={styles.label}>BIO</Text>
          <BioInput value={bio} onChangeText={setBio} />
        </View>

        {/* City */}
        <View style={styles.section}>
          <Text style={styles.label}>CITY</Text>
          <View style={styles.cityRow}>
            <Text style={styles.cityValue}>{city ?? 'Not set'}</Text>
            <Pressable onPress={() => router.push('/(profile)/location')} style={styles.changeBtn}>
              <Text style={styles.changeBtnText}>Change</Text>
            </Pressable>
          </View>
        </View>

        <ProfileBadgeSelector
          availableBadges={availableBadges}
          selectedBadges={selectedBadges}
          onToggle={toggleBadge}
        />

        <ProfileInterestsSection
          availableInterests={availableInterests}
          selectedInterests={selectedInterests}
          atMax={interestsAtMax}
          onToggle={toggleInterest}
        />

        {/* Voice Intro */}
        <View style={styles.section}>
          <Text style={styles.label}>VOICE INTRO</Text>
          <ProfileVoiceIntroSection voice={voice} hasExistingVoice={!!profile?.voice_url} />
        </View>

        <View style={styles.savePad}>
          <PrimaryButton label="Save Changes" onPress={onPressSave} loading={saving} disabled={!canSave} />
        </View>
      </ScrollView>
    </Screen>
  )
}

const styles = StyleSheet.create({
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  saveArea: { width: 48, alignItems: 'flex-end' },
  saveBtn: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 15,
    color: Colors.brandOrange,
  },
  saveBtnDisabled: { color: Colors.inkDisabled },
  content: {
    paddingHorizontal: Spacing.screenPadding,
    paddingBottom: 40,
    gap: 24,
  },
  section: { gap: 10 },
  label: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: 11,
    letterSpacing: 0.88,
    color: Colors.inkSecondary,
  },

  // Photos
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },

  // City
  cityRow: {
    height: 52,
    backgroundColor: Colors.elevated,
    borderRadius: Radius.input,
    borderWidth: 1.5,
    borderColor: Colors.divider,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    gap: 8,
  },
  cityValue: {
    flex: 1,
    fontFamily: FontFamily.bodyRegular,
    fontSize: 16,
    color: Colors.inkPrimary,
  },
  changeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(255,107,53,0.1)',
    borderRadius: Radius.pill,
  },
  changeBtnText: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: 13,
    color: Colors.brandOrange,
  },

  savePad: { marginTop: 8 },
})
