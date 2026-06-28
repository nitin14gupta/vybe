import { useState, useEffect } from 'react'
import { router } from 'expo-router'
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

const MAX_SECONDS = 30

export function useVoice() {
  const store = useOnboardingStore()
  const showPill = usePillStore.getState().show
  const [recorded, setRecorded] = useState(false)
  const [uploading, setUploading] = useState(false)

  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY)
  const recorderState = useAudioRecorderState(audioRecorder)
  const player = useAudioPlayer(null)
  const playerStatus = useAudioPlayerStatus(player)

  const isRecording = recorderState.isRecording
  // During recording: live elapsed seconds
  const recordingSeconds = Math.round((recorderState.durationMillis ?? 0) / 1000)
  // During playback: current position + total duration from player
  const playbackCurrent = Math.round((playerStatus.currentTime ?? 0))
  const playbackTotal = Math.round((playerStatus.duration ?? 0))
  const playing = playerStatus.playing

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
  }
}
