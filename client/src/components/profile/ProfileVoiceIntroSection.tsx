import { View, Text, StyleSheet, Pressable } from 'react-native'
import { Mic, Square, RotateCcw } from 'lucide-react-native'
import { RecordingWave, PlaybackWave, VoicePlayButton } from '@/components/ui'
import { Colors, FontFamily, Radius, withOpacity } from '@/constants'
import type { useVoiceEdit } from '@/hooks/useVoiceEdit'

interface Props {
  voice: ReturnType<typeof useVoiceEdit>
  hasExistingVoice: boolean
}

export function ProfileVoiceIntroSection({ voice, hasExistingVoice }: Props) {
  const { isRecording, seconds, playbackSeconds, recorded, saveError, playing, tapRecord, handlePlayPause, handleRetake } = voice
  const fmt = (s: number) => `${s}s`

  if (isRecording) {
    return (
      <View style={styles.box}>
        <Pressable onPress={tapRecord} style={styles.stopBtn}>
          <Square size={18} color={Colors.background} strokeWidth={2.5} fill={Colors.background} />
        </Pressable>
        <View style={styles.waveWrap}>
          <RecordingWave isActive />
        </View>
        <Text style={styles.timer}>{fmt(seconds)} / 30s</Text>
      </View>
    )
  }

  if (recorded) {
    return (
      <View style={{ gap: 6 }}>
        {saveError ? <Text style={styles.error}>{saveError}</Text> : null}
        <View style={styles.box}>
          <VoicePlayButton playing={playing} onPress={handlePlayPause} />
          <View style={styles.waveWrap}>
            <PlaybackWave isActive={playing} compact />
          </View>
          <Text style={styles.timer}>{fmt(playbackSeconds)}</Text>
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
        <View style={styles.box}>
          <VoicePlayButton playing={playing} onPress={handlePlayPause} />
          <View style={styles.waveWrap}>
            <PlaybackWave isActive={playing} compact />
          </View>
          <Text style={styles.existingLabel}>Current</Text>
        </View>
        <Pressable onPress={tapRecord} style={styles.rerecordBtn}>
          <Mic size={13} color={Colors.inkPrimary} strokeWidth={2} />
          <Text style={styles.rerecordText}>Record new intro</Text>
        </Pressable>
      </View>
    )
  }

  return (
    <View style={styles.box}>
      <Pressable onPress={tapRecord} style={styles.micBtn}>
        <Mic size={22} color={Colors.inkPrimary} strokeWidth={2} />
      </Pressable>
      <View style={styles.textCol}>
        <Text style={styles.title}>Record voice intro</Text>
        <Text style={styles.sub}>Up to 30 seconds</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Colors.divider,
    padding: 14,
    gap: 12,
  },
  waveWrap: { flex: 1, overflow: 'hidden' },
  micBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: withOpacity(Colors.inkPrimary, 0.08),
    borderWidth: 1.5,
    borderColor: Colors.divider,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stopBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.inkPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textCol: { flex: 1 },
  title: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: 14,
    color: Colors.inkPrimary,
  },
  sub: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 12,
    color: Colors.inkSecondary,
    marginTop: 2,
  },
  timer: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: 12,
    color: Colors.inkSecondary,
  },
  existingLabel: {
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
    backgroundColor: withOpacity(Colors.inkPrimary, 0.08),
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: withOpacity(Colors.inkPrimary, 0.2),
  },
  rerecordText: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: 13,
    color: Colors.inkPrimary,
  },
  error: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 12,
    color: Colors.destructive,
    textAlign: 'center',
  },
})
