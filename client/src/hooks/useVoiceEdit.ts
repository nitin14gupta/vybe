import { useState, useEffect } from 'react'
import {
  useAudioRecorder, useAudioRecorderState,
  useAudioPlayer, useAudioPlayerStatus,
  AudioModule, RecordingPresets, setAudioModeAsync,
} from 'expo-audio'
import { uploadVoice } from '@/api/user'

const MAX_SECONDS = 30

export function useVoiceEdit(existingUrl?: string | null) {
  const [localUri, setLocalUri] = useState<string | null>(null)
  const [recorded, setRecorded] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY)
  const recorderState = useAudioRecorderState(audioRecorder)
  const player = useAudioPlayer(existingUrl ? { uri: existingUrl } : null)
  const playerStatus = useAudioPlayerStatus(player)

  const isRecording = recorderState.isRecording
  const seconds = Math.round((recorderState.durationMillis ?? 0) / 1000)
  const playing = playerStatus.playing

  useEffect(() => {
    AudioModule.requestRecordingPermissionsAsync()
    setAudioModeAsync({ playsInSilentMode: true, allowsRecording: true })
  }, [])

  useEffect(() => {
    if (isRecording && seconds >= MAX_SECONDS) stopRecording()
  }, [seconds, isRecording])

  const stopRecording = async () => {
    await audioRecorder.stop()
    const uri = audioRecorder.uri
    if (uri) {
      setLocalUri(uri)
      player.replace({ uri })
      setRecorded(true)
    }
  }

  const tapRecord = async () => {
    if (isRecording) {
      await stopRecording()
    } else {
      setRecorded(false)
      setLocalUri(null)
      if (existingUrl) player.replace({ uri: existingUrl })
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
    setLocalUri(null)
    if (existingUrl) player.replace({ uri: existingUrl })
  }

  // Uploads voice and returns the R2 URL. Throws on failure.
  const saveVoice = async (): Promise<string> => {
    if (!localUri) throw new Error('No recording to save')
    setUploading(true)
    setSaveError(null)
    try {
      const url = await uploadVoice(localUri)
      return url
    } catch (e: any) {
      const msg = e?.message ?? 'Voice upload failed'
      setSaveError(msg)
      throw e
    } finally {
      setUploading(false)
    }
  }

  return {
    isRecording,
    seconds,
    recorded,
    uploading,
    saveError,
    playing,
    localUri,
    tapRecord,
    handlePlayPause,
    handleRetake,
    saveVoice,
  }
}
