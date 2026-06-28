import { useEffect } from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import { router } from 'expo-router'
import { hHeavy, hTap } from '@/lib/haptics'
import { Mic, Square, Play, Pause } from 'lucide-react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  cancelAnimation,
} from 'react-native-reanimated'
import { OutlineButton, ProgressBar, PrimaryButton, TextLinkButton, Screen, RecordingWave, PlaybackWave } from '@/components/ui'
import { useVoice } from '@/hooks/useVoice'
import { Colors, FontFamily, Spacing, Radius } from '@/constants'


export default function VoiceScreen() {
  const {
    isRecording,
    recordingSeconds,
    playbackCurrent,
    playbackTotal,
    recorded,
    uploading,
    playing,
    tapRecord,
    handlePlayPause,
    handleRetake,
    handleUse,
    handleSkip,
  } = useVoice()

  const ripple = useSharedValue(1)

  useEffect(() => {
    if (isRecording) {
      ripple.value = withRepeat(
        withSequence(
          withTiming(1.3, { duration: 700 }),
          withTiming(1, { duration: 700 }),
        ),
        -1,
      )
    } else {
      cancelAnimation(ripple)
      ripple.value = withTiming(1)
    }
  }, [isRecording])

  const rippleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ripple.value }],
    opacity: isRecording ? 0.4 : 0,
  }))

  const fmt = (s: number) => `0:${String(Math.max(0, s)).padStart(2, '0')}`

  return (
    <Screen>
      <ProgressBar step={3} />

      <View style={styles.header}>
        <Text style={styles.title}>Record your voice intro</Text>
        <Text style={styles.subtitle}>30 seconds. Let people hear the real you.</Text>
      </View>

      <View style={styles.center}>
        <View style={styles.recordWrap}>
          <Animated.View style={[styles.ripple, rippleStyle]} />
          <Pressable
            onPress={() => { hHeavy(); tapRecord() }}
            style={[styles.recordBtn, isRecording && styles.recordBtnActive]}
          >
            {isRecording
              ? <Square size={40} color={Colors.brandCoral} strokeWidth={1.5} />
              : <Mic size={40} color={Colors.inkPrimary} strokeWidth={1.5} />
            }
          </Pressable>
        </View>

        <Text style={[styles.timer, !isRecording && styles.timerMuted]}>
          {fmt(recordingSeconds)}{' '}
          <Text style={styles.timerMax}>/ 0:30</Text>
        </Text>

        <View style={{ opacity: isRecording ? 1 : 0 }}>
          <RecordingWave isActive={isRecording} />
        </View>

        {recorded && !isRecording && (
          <View style={styles.playback}>
            <Pressable onPress={() => { hTap(); handlePlayPause() }} style={styles.playBtn}>
              {playing
                ? <Pause size={18} color={Colors.background} strokeWidth={2} />
                : <Play size={18} color={Colors.background} strokeWidth={2} />
              }
            </Pressable>
            <PlaybackWave isActive={playing} compact />
            {/* current position / total duration */}
            <Text style={styles.playbackTime}>
              {fmt(playbackCurrent)}
              <Text style={styles.playbackDuration}> / {fmt(playbackTotal)}</Text>
            </Text>
          </View>
        )}

        {recorded && !isRecording && (
          <Pressable onPress={() => { hTap(); handleRetake() }}>
            <Text style={styles.retakeBtn}>Retake</Text>
          </Pressable>
        )}

        {!isRecording && !recorded && (
          <Text style={styles.hint}>Tap the mic to start recording</Text>
        )}
      </View>

      <View style={styles.footer}>
        <OutlineButton label="Back" onPress={() => router.back()} style={styles.backBtn} />
        <View style={styles.footerMain}>
          {recorded ? (
            <PrimaryButton label="Use this" onPress={handleUse} loading={uploading} />
          ) : (
            <TextLinkButton label="Skip for now" onPress={handleSkip} />
          )}
        </View>
      </View>
    </Screen>
  )
}

const styles = StyleSheet.create({
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
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 32,
  },
  recordWrap: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    width: 148,
    height: 148,
  },
  ripple: {
    position: 'absolute',
    width: 148,
    height: 148,
    borderRadius: 74,
    borderWidth: 2,
    borderColor: Colors.brandOrange,
  },
  recordBtn: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.surface,
    borderWidth: 2.5,
    borderColor: Colors.divider,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordBtnActive: {
    backgroundColor: 'rgba(255,107,53,0.1)',
    borderColor: Colors.brandOrange,
  },
  timer: {
    fontFamily: FontFamily.headingBold,
    fontSize: 28,
    color: Colors.inkPrimary,
  },
  timerMuted: { color: Colors.inkSecondary },
  timerMax: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 14,
    color: Colors.inkSecondary,
  },
  playback: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  playbackDuration: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 11,
    color: Colors.inkDisabled,
  },
  playBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.brandOrange,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playbackTime: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 12,
    color: Colors.inkSecondary,
  },
  retakeBtn: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 13,
    color: Colors.inkSecondary,
  },
  hint: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 13,
    color: Colors.inkDisabled,
    textAlign: 'center',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: Spacing.screenPadding,
    paddingBottom: 16,
  },
  backBtn: { width: 96 },
  footerMain: { flex: 1 },
})
