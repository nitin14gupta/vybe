import { View, Text, StyleSheet } from 'react-native'
import { PlaybackWave, VoicePlayButton } from '@/components/ui'
import { Colors, FontFamily, Radius, Spacing } from '@/constants'

interface Props {
  bio: string | null
  voiceUrl: string | null
  playing: boolean
  onTogglePlay: () => void
}

export function ProfileBioVoiceCard({ bio, voiceUrl, playing, onTogglePlay }: Props) {
  if (!bio && !voiceUrl) return null

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>About me</Text>
      {bio ? <Text style={styles.bio}>{bio}</Text> : null}

      {voiceUrl ? (
        <View style={styles.voiceCard}>
          <VoicePlayButton playing={playing} onPress={onTogglePlay} />
          <View style={styles.voiceWave}>
            <PlaybackWave isActive={playing} compact />
          </View>
          <Text style={styles.voiceLabel}>Voice intro</Text>
        </View>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  section: {
    marginHorizontal: Spacing.screenPadding,
    marginBottom: 24,
  },
  sectionTitle: {
    fontFamily: FontFamily.headingBold,
    fontSize: 18,
    color: Colors.inkPrimary,
    marginBottom: 12,
  },
  bio: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 15,
    color: Colors.inkSecondary,
    lineHeight: 22,
    marginBottom: 12,
  },
  voiceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.surface,
    borderRadius: Radius.card,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  voiceWave: { flex: 1, overflow: 'hidden' },
  voiceLabel: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 12,
    color: Colors.inkDisabled,
  },
})
