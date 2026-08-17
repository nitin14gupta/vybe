import { Pressable, StyleSheet } from 'react-native'
import { Play, Pause } from 'lucide-react-native'
import { Colors } from '@/constants'

interface Props {
  playing: boolean
  onPress: () => void
  size?: number
}

export function VoicePlayButton({ playing, onPress, size = 40 }: Props) {
  const iconSize = Math.round(size * 0.4)
  return (
    <Pressable onPress={onPress} hitSlop={8} style={[styles.circle, { width: size, height: size, borderRadius: size / 2 }]}>
      {playing
        ? <Pause size={iconSize} color={Colors.background} strokeWidth={2.5} fill={Colors.background} />
        : <Play size={iconSize} color={Colors.background} strokeWidth={2.5} fill={Colors.background} />
      }
    </Pressable>
  )
}

const styles = StyleSheet.create({
  circle: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.inkPrimary,
  },
})
