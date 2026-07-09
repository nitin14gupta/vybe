import { useState, useEffect } from 'react'
import { router } from 'expo-router'
import { useSharedValue, withTiming } from 'react-native-reanimated'
import { usePillStore } from '@/store/pillStore'
import {
  useAudioRecorder,
  useAudioRecorderState,
  useAudioPlayer,
  useAudioPlayerStatus,
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
} from 'expo-audio'
import { uploadVoice } from '@/api/user'
import { useOnboardingStore } from '@/store/onboarding'
import { usePermissionSheetStore } from '@/store/permissionSheetStore'

const MAX_SECONDS = 30

export function useVoice() {
  const store = useOnboardingStore()
  const showPill = usePillStore.getState().show
  const showPermissionSheet = usePermissionSheetStore.getState().show
  const [recorded, setRecorded] = useState(false)
  const [uploading, setUploading] = useState(false)

  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY)
  const recorderState = useAudioRecorderState(audioRecorder)
  const player = useAudioPlayer(null)
  const playerStatus = useAudioPlayerStatus(player)

  const isRecording = recorderState.isRecording
  const recordingSeconds = Math.round((recorderState.durationMillis ?? 0) / 1000)
  const playbackCurrent = Math.round((playerStatus.currentTime ?? 0))
  const playbackTotal = Math.round((playerStatus.duration ?? 0))
  const playing = playerStatus.playing

  const intensity = useSharedValue(0)
  const metering = recorderState.metering ?? -160

  useEffect(() => {
    if (isRecording) {
      // Normalize metering for a punchy bass response
      const min = -45
      const max = -5
      const val = (metering - min) / (max - min)

      // Use an ease-in curve so quiet noise is suppressed but talking peaks strongly
      const curved = Math.pow(Math.max(0, Math.min(1, val)), 1.5)
      const target = Math.max(0.1, curved)
      intensity.value = withTiming(target, { duration: 80 })
    } else {
      intensity.value = withTiming(0.1, { duration: 300 })
    }
  }, [metering, isRecording])

  useEffect(() => {
    AudioModule.requestRecordingPermissionsAsync()
    setAudioModeAsync({ playsInSilentMode: true, allowsRecording: true })
  }, [])

  useEffect(() => {
    if (isRecording && recordingSeconds >= MAX_SECONDS) stopRecording()
  }, [recordingSeconds, isRecording])

  const stopRecording = async () => {
    await audioRecorder.stop()
    const uri = audioRecorder.uri
    if (uri) {
      store.setField('voiceUri', uri)
      player.replace({ uri })
      setRecorded(true)
    }
  }

  const tapRecord = async () => {
    if (isRecording) {
      await stopRecording()
    } else {
      const perm = await AudioModule.requestRecordingPermissionsAsync()
      if (!perm.granted) {
        showPill('Microphone access is required to record your voice.', 'error')
        showPermissionSheet(
          'Microphone Permission Required',
          'You need to allow microphone access in your device settings to record a voice intro.'
        )
        return
      }

      setRecorded(false)
      store.setField('voiceUri', '')
      await audioRecorder.prepareToRecordAsync()
      audioRecorder.record()
    }
  }

  const handlePlayPause = () => {
    if (playing) {
      player.pause()
    } else {
      player.seekTo(0)
      player.play()
    }
  }

  const handleRetake = () => {
    player.pause()
    setRecorded(false)
    store.setField('voiceUri', '')
  }

  const handleUse = async () => {
    if (!store.voiceUri) return
    setUploading(true)
    try {
      await uploadVoice(store.voiceUri)
      router.push('/(onboarding)/interests')
    } catch (e: any) {
      showPill(e?.message ?? 'Upload failed — check your connection', 'error')
    } finally {
      setUploading(false)
    }
  }

  const handleSkip = () => router.push('/(onboarding)/interests')

  return {
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
  }
}
