import { useCallback } from 'react'
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio'

export function useCardAudio(voiceUrl: string | null) {
  const player = useAudioPlayer(voiceUrl ? { uri: voiceUrl } : null)
  const status = useAudioPlayerStatus(player)

  const toggle = useCallback(() => {
    if (status.playing) {
      player.pause()
    } else {
      player.seekTo(0)
      player.play()
    }
  }, [status.playing, player])

  const stop = useCallback(() => {
    if (status.playing) {
      player.pause()
      player.seekTo(0)
    }
  }, [status.playing, player])

  return {
    isPlaying: status.playing,
    hasAudio: !!voiceUrl,
    toggle,
    stop,
  }
}
