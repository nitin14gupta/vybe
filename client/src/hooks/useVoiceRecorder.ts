import { useState, useRef, useCallback } from 'react'
import {
  useAudioRecorder, useAudioRecorderState,
  setAudioModeAsync, RecordingPresets, AudioModule,
} from 'expo-audio'
import { usePillStore } from '@/store/pillStore'

export type VoiceRecordState = 'idle' | 'recording' | 'preview' | 'sending'

export interface RecordedVoice {
  uri: string
  durationMs: number
}

interface Options {
  onSend: (uri: string, durationSecs: number) => Promise<void>
  onVoiceTyping: (active: boolean) => void
}

export function useVoiceRecorder({ onSend, onVoiceTyping }: Options) {
  const showPill = usePillStore(st => st.show)
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY)
  const recorderState = useAudioRecorderState(recorder, 250)

  const [recordState, setRecordState] = useState<VoiceRecordState>('idle')
  const [recordedVoice, setRecordedVoice] = useState<RecordedVoice | null>(null)

  const autoStopRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const startTimeRef = useRef(0)

  const handleMicPress = useCallback(async () => {
    try {
      const perm = await AudioModule.requestRecordingPermissionsAsync()
      if (!perm.granted) { showPill('Allow microphone access to record voice', 'error'); return }
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true })
      await recorder.prepareToRecordAsync()
      recorder.record()
      startTimeRef.current = Date.now()
      onVoiceTyping(true)
      setRecordState('recording')
      autoStopRef.current = setTimeout(() => handleRecordStop(), 120_000)
    } catch {
      showPill("Couldn't start recording, try again", 'error')
    }
  }, [recorder, onVoiceTyping, showPill])

  const handleRecordStop = useCallback(async () => {
    if (autoStopRef.current) clearTimeout(autoStopRef.current)
    onVoiceTyping(false)
    try {
      await recorder.stop()
      const uri = recorder.uri
      if (!uri) throw new Error('No URI after stop')
      const durationMs = Date.now() - startTimeRef.current
      await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true })
      setRecordedVoice({ uri, durationMs })
      setRecordState('preview')
    } catch {
      showPill('Recording stopped unexpectedly', 'error')
      setRecordState('idle')
    }
  }, [recorder, onVoiceTyping, showPill])

  const handleRecordCancel = useCallback(async () => {
    if (autoStopRef.current) clearTimeout(autoStopRef.current)
    onVoiceTyping(false)
    try { await recorder.stop() } catch {}
    try { await setAudioModeAsync({ allowsRecording: false }) } catch {}
    setRecordedVoice(null)
    setRecordState('idle')
  }, [recorder, onVoiceTyping])

  const handleSendVoice = useCallback(async () => {
    if (!recordedVoice) return
    setRecordState('sending')
    try {
      const durationSecs = Math.max(1, Math.round(recordedVoice.durationMs / 1000))
      await onSend(recordedVoice.uri, durationSecs)
    } catch {
      showPill("Voice message didn't send", 'error')
    }
    setRecordedVoice(null)
    setRecordState('idle')
  }, [recordedVoice, onSend, showPill])

  const handleDiscardVoice = useCallback(() => {
    setRecordedVoice(null)
    setRecordState('idle')
  }, [])

  return {
    recordState,
    recordedVoice,
    recordDurationMs: recorderState.durationMillis ?? 0,
    handleMicPress,
    handleRecordStop,
    handleRecordCancel,
    handleSendVoice,
    handleDiscardVoice,
  }
}
