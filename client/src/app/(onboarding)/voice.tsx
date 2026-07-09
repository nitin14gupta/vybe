import { useEffect } from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import { router } from 'expo-router'
import { hHeavy, hTap } from '@/lib/haptics'
import { Play, Pause } from 'lucide-react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  cancelAnimation,
} from 'react-native-reanimated'
import { OutlineButton, ProgressBar, PrimaryButton, TextLinkButton, Screen, RecordingWave, PlaybackWave, Orb } from '@/components/ui'
import { useVoice } from '@/hooks/useVoice'
import { Colors, FontFamily, Spacing, Radius } from '@/constants'
import LiquidPlasmaBackground from '@/components/LiquidPlasmaBackground'


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
    intensity,
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
    <Screen transparent>
      <LiquidPlasmaBackground />
      <ProgressBar step={3} />

      <View style={styles.header}>
        <Text style={styles.title}>Record your voice intro</Text>
        <Text style={styles.subtitle}>30 seconds. Let people hear the real you.</Text>
      </View>

      <View style={styles.center}>
        <View style={styles.recordWrap}>
          <Pressable
            onPress={() => { hHeavy(); tapRecord() }}
            style={{ width: 280, height: 280, alignItems: 'center', justifyContent: 'center' }}
          >
            <Orb 
              width={280} 
              height={280} 
              intensity={intensity} 
              hue={280} 
              hueByIntensity 
              autoRotate 
              isActive={isRecording}
            />
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
          <Text style={styles.hint}>Tap the orb to start recording</Text>
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
    width: 280,
    height: 280,
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
