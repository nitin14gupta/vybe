import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, TextInput } from 'react-native'
import { useState, useEffect } from 'react'
import { router } from 'expo-router'
import { hSuccess, hSelection } from '@/lib/haptics'
import { Mic, Square, Play, Pause, RotateCcw } from 'lucide-react-native'
import { BackButton, Input, GenderSelector, InterestChip, PrimaryButton, Screen, RecordingWave, PlaybackWave } from '@/components/ui'
import { useEditProfile } from '@/hooks/useEditProfile'
import { useInterests } from '@/hooks/useInterests'
import { useVoiceEdit } from '@/hooks/useVoiceEdit'
import { useOnboardingStore } from '@/store/onboarding'
import { usePillStore } from '@/store/pillStore'
import { Colors, FontFamily, Spacing, Radius } from '@/constants'
import { useHardwareBack } from '@/hooks/useHardwareBack'
import ApiService from '@/api/apiService'

type UsernameStatus = 'idle' | 'checking' | 'available' | 'taken' | 'invalid'

export default function EditProfileScreen() {
  useHardwareBack()
  const {
    profile, name, setName, username, setUsername, bio, setBio, gender, setGender,
    selectedBadges, availableBadges, toggleBadge,
    isDirty, loading, saving, handleSave,
    originalUsername,
  } = useEditProfile()

  const { availableInterests, selected: selectedInterests, atMax: interestsAtMax, toggle: toggleInterest } = useInterests()
  const voice = useVoiceEdit(profile?.voice_url)
  const city = useOnboardingStore(s => s.city)
  const showPill = usePillStore(s => s.show)

  const [usernameStatus, setUsernameStatus] = useState<UsernameStatus>('idle')

  // Debounced username availability check
  useEffect(() => {
    if (!username || username === originalUsername) {
      setUsernameStatus('idle')
      return
    }
    if (!/^[a-z0-9_]{3,30}$/.test(username)) {
      setUsernameStatus('invalid')
      return
    }
    setUsernameStatus('checking')
    const t = setTimeout(async () => {
      try {
        const res = await ApiService.checkUsername(username)
        setUsernameStatus(res.available ? 'available' : 'taken')
      } catch {
        setUsernameStatus('idle')
      }
    }, 400)
    return () => clearTimeout(t)
  }, [username, originalUsername])

  if (loading) {
    return (
      <Screen>
        <View style={styles.loader}><ActivityIndicator color={Colors.brandOrange} /></View>
      </Screen>
    )
  }

  // Compute name lock from name_changed_at
  const nameChangedAt = profile?.name_changed_at
    ? new Date(profile.name_changed_at.replace(' ', 'T').replace(/([+-]\d{2})$/, '$1:00'))
    : null
  const nameLockedUntil = nameChangedAt
    ? new Date(nameChangedAt.getTime() + 60 * 24 * 3600 * 1000)
    : null
  const nameLocked = !!nameLockedUntil && nameLockedUntil > new Date()
  const nameLockedUntilStr = nameLockedUntil
    ? nameLockedUntil.toLocaleDateString([], { month: 'short', day: 'numeric' })
    : ''

  const voiceDirty = !!voice.localUri && voice.recorded
  const canSave = (isDirty || voiceDirty) && !saving

  const onPressSave = async () => {
    if (voiceDirty) {
      try {
        await voice.saveVoice()
      } catch {
        // saveError shown in VoiceSection; still save other fields
      }
    }
    await handleSave()
  }

  return (
    <Screen>
      {/* Header */}
      <View style={styles.header}>
        <BackButton onPress={() => router.back()} />
        <Text style={styles.title}>Edit Profile</Text>
        <Pressable onPress={() => { hSuccess(); onPressSave() }} disabled={!canSave} hitSlop={8} style={styles.saveArea}>
          {saving
            ? <ActivityIndicator size="small" color={Colors.brandOrange} />
            : <Text style={[styles.saveBtn, !canSave && styles.saveBtnDisabled]}>Save</Text>
          }
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

        {/* Name */}
        <View style={styles.section}>
          <Text style={styles.label}>NAME</Text>
          {nameLocked ? (
            <Pressable
              onPress={() => showPill(`Cannot change name until ${nameLockedUntilStr}`, 'error')}
              style={styles.lockedField}
            >
              <Text style={styles.lockedValue}>{name}</Text>
            </Pressable>
          ) : (
            <Input value={name} onChangeText={setName} placeholder="Your name" />
          )}
        </View>

        {/* Username */}
        <View style={styles.section}>
          <Text style={styles.label}>USERNAME</Text>
          <View style={[
            styles.usernameWrap,
            usernameStatus === 'taken' || usernameStatus === 'invalid' ? styles.usernameWrapError : null,
            usernameStatus === 'available' ? styles.usernameWrapOk : null,
          ]}>
            <Text style={styles.atSign}>@</Text>
            <TextInput
              value={username}
              onChangeText={v => setUsername(v.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
              placeholder="your_username"
              placeholderTextColor={Colors.inkDisabled}
              autoCapitalize="none"
              autoCorrect={false}
              style={styles.usernameInput}
            />
            {usernameStatus === 'checking' && <ActivityIndicator size="small" color={Colors.inkDisabled} />}
            {usernameStatus === 'available' && <Text style={styles.usernameAvail}>✓</Text>}
            {usernameStatus === 'taken' && <Text style={styles.usernameTaken}>✗</Text>}
          </View>
          {usernameStatus === 'taken' ? (
            <Text style={styles.usernameHintError}>Username is taken</Text>
          ) : usernameStatus === 'invalid' ? (
            <Text style={styles.usernameHintError}>3–30 chars · letters, numbers, underscore only</Text>
          ) : (
            <Text style={styles.usernameHint}>3–30 chars · letters, numbers, underscore</Text>
          )}
        </View>

        {/* Bio */}
        <View style={styles.section}>
          <Text style={styles.label}>BIO</Text>
          <View style={styles.bioWrap}>
            <TextInput
              value={bio}
              onChangeText={v => setBio(v.slice(0, 150))}
              placeholder="A short intro — who are you? ✨"
              placeholderTextColor={Colors.inkDisabled}
              multiline
              textAlignVertical="top"
              style={styles.bioInput}
            />
            <Text style={styles.bioCounter}>{bio.length}/150</Text>
          </View>
        </View>

        {/* Gender */}
        <View style={styles.section}>
          <Text style={styles.label}>GENDER</Text>
          <GenderSelector value={gender} onChange={setGender} />
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

        {/* Badges */}
        <View style={styles.section}>
          <Text style={styles.label}>
            BADGES{selectedBadges.length >= 4 ? '  ·  max 4 reached' : `  ·  ${selectedBadges.length}/4`}
          </Text>
          <View style={styles.chips}>
            {availableBadges.map(badge => {
              const sel = selectedBadges.includes(badge)
              return (
                <Pressable
                  key={badge}
                  onPress={() => { hSelection(); toggleBadge(badge) }}
                  style={[styles.badgeChip, sel && styles.badgeChipSelected]}
                >
                  <Text style={[styles.badgeChipText, sel && styles.badgeChipTextSelected]}>
                    {badge}
                  </Text>
                </Pressable>
              )
            })}
          </View>
        </View>

        {/* Interests */}
        <View style={styles.section}>
          <Text style={styles.label}>
            INTERESTS{interestsAtMax ? '  ·  max 4 reached' : `  ·  ${selectedInterests.length}/4`}
          </Text>
          <View style={styles.chips}>
            {availableInterests.map(({ name: n, emoji }) => (
              <InterestChip
                key={n}
                label={n}
                emoji={emoji}
                selected={selectedInterests.includes(n)}
                onPress={() => toggleInterest(n)}
              />
            ))}
          </View>
        </View>

        {/* Voice Intro */}
        <View style={styles.section}>
          <Text style={styles.label}>VOICE INTRO</Text>
          <VoiceSection voice={voice} hasExistingVoice={!!profile?.voice_url} />
        </View>

        <View style={styles.savePad}>
          <PrimaryButton label="Save Changes" onPress={onPressSave} loading={saving} disabled={!canSave} />
        </View>
      </ScrollView>
    </Screen>
  )
}

// ── Voice section sub-component ───────────────────────────────────────────────

function VoiceSection({
  voice,
  hasExistingVoice,
}: {
  voice: ReturnType<typeof useVoiceEdit>
  hasExistingVoice: boolean
}) {
  const { isRecording, seconds, recorded, saveError, playing, tapRecord, handlePlayPause, handleRetake } = voice
  const fmt = (s: number) => `${s}s`

  if (isRecording) {
    return (
      <View style={styles.voiceBox}>
        <Pressable onPress={tapRecord} style={styles.voiceStopBtn}>
          <Square size={18} color={Colors.background} strokeWidth={2.5} fill={Colors.background} />
        </Pressable>
        <View style={styles.voiceWaveWrap}>
          <RecordingWave isActive />
        </View>
        <Text style={styles.voiceTimer}>{fmt(seconds)} / 30s</Text>
      </View>
    )
  }

  if (recorded) {
    return (
      <View style={{ gap: 6 }}>
        {saveError ? <Text style={styles.voiceError}>{saveError}</Text> : null}
        <View style={styles.voiceBox}>
          <Pressable onPress={handlePlayPause} style={styles.voicePlayBtn}>
            {playing
              ? <Pause size={16} color={Colors.background} strokeWidth={2.5} />
              : <Play  size={16} color={Colors.background} strokeWidth={2.5} />
            }
          </Pressable>
          <View style={styles.voiceWaveWrap}>
            <PlaybackWave isActive={playing} compact />
          </View>
          <Text style={styles.voiceTimer}>{fmt(seconds)}</Text>
          <Pressable onPress={handleRetake} style={styles.retakeBtn} hitSlop={8}>
            <RotateCcw size={14} color={Colors.inkSecondary} strokeWidth={2} />
          </Pressable>
        </View>
      </View>
    )
  }

  if (hasExistingVoice) {
    return (
      <View style={{ gap: 8 }}>
        <View style={styles.voiceBox}>
          <Pressable onPress={handlePlayPause} style={styles.voicePlayBtn}>
            {playing
              ? <Pause size={16} color={Colors.background} strokeWidth={2.5} />
              : <Play  size={16} color={Colors.background} strokeWidth={2.5} />
            }
          </Pressable>
          <View style={styles.voiceWaveWrap}>
            <PlaybackWave isActive={playing} compact />
          </View>
          <Text style={styles.voiceExistingLabel}>Current</Text>
        </View>
        <Pressable onPress={tapRecord} style={styles.rerecordBtn}>
          <Mic size={13} color={Colors.brandOrange} strokeWidth={2} />
          <Text style={styles.rerecordText}>Record new intro</Text>
        </Pressable>
      </View>
    )
  }

  return (
    <View style={styles.voiceBox}>
      <Pressable onPress={tapRecord} style={styles.voiceMicBtn}>
        <Mic size={22} color={Colors.brandOrange} strokeWidth={2} />
      </Pressable>
      <View style={styles.voiceTextCol}>
        <Text style={styles.voiceTitle}>Record voice intro</Text>
        <Text style={styles.voiceSub}>Up to 30 seconds</Text>
      </View>
    </View>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: Spacing.screenPadding,
    paddingBottom: 8,
  },
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

  // Name locked state
  lockedField: {
    height: 52,
    backgroundColor: Colors.elevated,
    borderRadius: Radius.input,
    borderWidth: 1.5,
    borderColor: Colors.divider,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    opacity: 0.6,
  },
  lockedValue: {
    flex: 1,
    fontFamily: FontFamily.bodyRegular,
    fontSize: 16,
    color: Colors.inkSecondary,
  },

  // Username
  usernameWrap: {
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
  usernameWrapError: { borderColor: Colors.brandCoral },
  usernameWrapOk: { borderColor: Colors.accentGreen },
  atSign: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: 16,
    color: Colors.inkDisabled,
  },
  usernameInput: {
    flex: 1,
    fontFamily: FontFamily.bodyRegular,
    fontSize: 16,
    color: Colors.inkPrimary,
  },
  usernameAvail: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 15,
    color: Colors.accentGreen,
  },
  usernameTaken: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 15,
    color: Colors.brandCoral,
  },
  usernameHint: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 11,
    color: Colors.inkDisabled,
    marginTop: -4,
  },
  usernameHintError: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 11,
    color: Colors.brandCoral,
    marginTop: -4,
  },

  // Bio
  bioWrap: {
    backgroundColor: Colors.elevated,
    borderRadius: Radius.input,
    borderWidth: 1.5,
    borderColor: Colors.divider,
    padding: 14,
    minHeight: 90,
  },
  bioInput: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 15,
    color: Colors.inkPrimary,
    lineHeight: 22,
    minHeight: 60,
  },
  bioCounter: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 11,
    color: Colors.inkDisabled,
    textAlign: 'right',
    marginTop: 6,
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

  // Chips grid
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },

  // Badge chips
  badgeChip: {
    backgroundColor: Colors.elevated,
    borderWidth: 1.5,
    borderColor: Colors.divider,
    borderRadius: Radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  badgeChipSelected: {
    backgroundColor: 'rgba(255,184,48,0.12)',
    borderColor: Colors.accentGold,
  },
  badgeChipText: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: 13,
    color: Colors.inkSecondary,
  },
  badgeChipTextSelected: { color: Colors.accentGold },

  // Voice
  voiceBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Colors.divider,
    padding: 14,
    gap: 12,
  },
  voiceWaveWrap: { flex: 1, overflow: 'hidden' },
  voiceMicBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,107,53,0.1)',
    borderWidth: 1.5,
    borderColor: Colors.brandOrange,
    alignItems: 'center',
    justifyContent: 'center',
  },
  voiceStopBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.brandCoral,
    alignItems: 'center',
    justifyContent: 'center',
  },
  voicePlayBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.brandOrange,
    alignItems: 'center',
    justifyContent: 'center',
  },
  voiceTextCol: { flex: 1 },
  voiceTitle: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: 14,
    color: Colors.inkPrimary,
  },
  voiceSub: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 12,
    color: Colors.inkSecondary,
    marginTop: 2,
  },
  voiceTimer: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: 12,
    color: Colors.inkSecondary,
  },
  voiceExistingLabel: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 11,
    color: Colors.inkDisabled,
  },
  retakeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.elevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rerecordBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: 'rgba(255,107,53,0.08)',
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(255,107,53,0.2)',
  },
  rerecordText: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: 13,
    color: Colors.brandOrange,
  },

  savePad: { marginTop: 8 },
  voiceError: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 12,
    color: Colors.brandCoral,
    textAlign: 'center',
  },
})
