import { useState, useEffect, useRef } from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import { router } from 'expo-router'
import { Audio } from 'expo-av'
import { Mic, Square, Play, Pause } from 'lucide-react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  cancelAnimation,
} from 'react-native-reanimated'
import { BackButton, ProgressBar, PrimaryButton, TextLinkButton } from '@/components/ui'
import { useOnboardingStore } from '@/store/onboarding'
import { uploadVoice } from '@/api/user'
import { Colors, FontFamily, Spacing, Radius } from '@/constants'

const MAX_SECONDS = 30
const WAVE_BARS = 14

export default function VoiceScreen() {
  const store = useOnboardingStore()
  const [recording, setRecording] = useState<Audio.Recording | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [recorded, setRecorded] = useState(false)
  const [seconds, setSeconds] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [sound, setSound] = useState<Audio.Sound | null>(null)
  const [uploading, setUploading] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const ripple = useSharedValue(1)

  const barScales = Array.from({ length: WAVE_BARS }, () => useSharedValue(0.15))

  useEffect(() => {
    return () => {
      sound?.unloadAsync()
      timerRef.current && clearInterval(timerRef.current)
    }
  }, [sound])

  useEffect(() => {
    if (isRecording) {
      ripple.value = withRepeat(
        withSequence(
          withTiming(1.3, { duration: 700 }),
          withTiming(1, { duration: 700 }),
        ),
        -1,
      )
      barScales.forEach((sv, i) => {
        sv.value = withDelay(
          i * 55,
          withRepeat(
            withSequence(
              withTiming(1, { duration: 325 }),
              withTiming(0.15, { duration: 325 }),
            ),
            -1,
          ),
        )
      })
    } else {
      cancelAnimation(ripple)
      ripple.value = withTiming(1)
      barScales.forEach(sv => {
        cancelAnimation(sv)
        sv.value = withTiming(0.15)
      })
    }
  }, [isRecording])

  const rippleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ripple.value }],
    opacity: isRecording ? 0.4 : 0,
  }))

  const fmt = (s: number) => `0:${String(s).padStart(2, '0')}`

  const startRecording = async () => {
    await Audio.requestPermissionsAsync()
    await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true })
    const { recording: rec } = await Audio.Recording.createAsync(
      Audio.RecordingOptionsPresets.HIGH_QUALITY,
    )
    setRecording(rec)
    setIsRecording(true)
    setSeconds(0)

    timerRef.current = setInterval(() => {
      setSeconds(s => {
        if (s + 1 >= MAX_SECONDS) {
          stopRecording()
          return MAX_SECONDS
        }
        return s + 1
      })
    }, 1000)
  }

  const stopRecording = async () => {
    if (timerRef.current) clearInterval(timerRef.current)
    setIsRecording(false)
    if (!recording) return
    await recording.stopAndUnloadAsync()
    const uri = recording.getURI()
    if (uri && seconds > 0) {
      setRecorded(true)
      store.setField('voiceUri', uri)
    }
    setRecording(null)
  }

  const tapRecord = () => {
    if (isRecording) stopRecording()
    else startRecording()
  }

  const handlePlayPause = async () => {
    if (!store.voiceUri) return
    if (playing) {
      await sound?.pauseAsync()
      setPlaying(false)
    } else {
      if (sound) {
        await sound.playAsync()
      } else {
        const { sound: s } = await Audio.Sound.createAsync({ uri: store.voiceUri })
        s.setOnPlaybackStatusUpdate(st => {
          if (st.isLoaded && st.didJustFinish) setPlaying(false)
        })
        await s.playAsync()
        setSound(s)
      }
      setPlaying(true)
    }
  }

  const handleRetake = () => {
    sound?.unloadAsync()
    setSound(null)
    setPlaying(false)
    setRecorded(false)
    setSeconds(0)
    store.setField('voiceUri', '')
  }

  const handleUse = async () => {
    if (!store.voiceUri) return
    setUploading(true)
    try {
      await uploadVoice(store.voiceUri)
      router.push('/(onboarding)/interests')
    } catch {
      router.push('/(onboarding)/interests')
    } finally {
      setUploading(false)
    }
  }

  return (
    <View style={styles.container}>
      <BackButton onPress={() => router.back()} />
      <ProgressBar step={3} />
      <View style={styles.header}>
        <Text style={styles.title}>Record your voice intro</Text>
        <Text style={styles.subtitle}>30 seconds. Let people hear the real you.</Text>
      </View>

      <View style={styles.center}>
        {/* Record button */}
        <View style={styles.recordWrap}>
          <Animated.View style={[styles.ripple, rippleStyle]} />
          <Pressable
            onPress={tapRecord}
            style={[styles.recordBtn, isRecording && styles.recordBtnActive]}
          >
            {isRecording
              ? <Square size={40} color={Colors.brandCoral} strokeWidth={1.5} />
              : <Mic size={40} color={Colors.inkPrimary} strokeWidth={1.5} />
            }
          </Pressable>
        </View>

        {/* Timer */}
        <Text style={[styles.timer, !isRecording && styles.timerMuted]}>
          {fmt(seconds)}{' '}
          <Text style={styles.timerMax}>/ 0:30</Text>
        </Text>

        {/* Waveform when recording */}
        {isRecording && (
          <View style={styles.waveform}>
            {barScales.map((sv, i) => {
              const barStyle = useAnimatedStyle(() => ({
                transform: [{ scaleY: sv.value }],
              }))
              return (
                <Animated.View key={i} style={[styles.waveBar, barStyle]} />
              )
            })}
          </View>
        )}

        {/* Playback when recorded */}
        {recorded && !isRecording && (
          <View style={styles.playback}>
            <Pressable onPress={handlePlayPause} style={styles.playBtn}>
              {playing
                ? <Pause size={18} color={Colors.background} strokeWidth={2} />
                : <Play size={18} color={Colors.background} strokeWidth={2} />
              }
            </Pressable>
            <View style={styles.progressBg}>
              <View style={[styles.progressFill, playing && { width: '45%' }]} />
            </View>
            <Text style={styles.playbackTime}>{fmt(seconds)}</Text>
          </View>
        )}

        {recorded && !isRecording && (
          <Pressable onPress={handleRetake}>
            <Text style={styles.retakeBtn}>Retake</Text>
          </Pressable>
        )}

        {!isRecording && !recorded && (
          <Text style={styles.hint}>Tap the mic to start recording</Text>
        )}
      </View>

      <View style={styles.footer}>
        {recorded ? (
          <PrimaryButton label="Use this" onPress={handleUse} loading={uploading} />
        ) : (
          <TextLinkButton
            label="Skip for now"
            onPress={() => router.push('/(onboarding)/interests')}
          />
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
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
  timerMuted: {
    color: Colors.inkSecondary,
  },
  timerMax: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 14,
    color: Colors.inkSecondary,
  },
  waveform: {
    flexDirection: 'row',
    gap: 4,
    alignItems: 'center',
    height: 48,
  },
  waveBar: {
    width: 4,
    height: 36,
    borderRadius: Radius.pill,
    backgroundColor: Colors.brandOrange,
    transformOrigin: 'center',
  } as any,
  playback: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    width: '80%',
  },
  playBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.brandOrange,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressBg: {
    flex: 1,
    height: 4,
    backgroundColor: Colors.divider,
    borderRadius: Radius.pill,
    overflow: 'hidden',
  },
  progressFill: {
    width: '0%',
    height: '100%',
    backgroundColor: Colors.brandOrange,
    borderRadius: Radius.pill,
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
    paddingHorizontal: Spacing.screenPadding,
    paddingBottom: 16,
    alignItems: 'center',
  },
})
