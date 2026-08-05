import React from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Download, Share2 } from 'lucide-react-native'
import {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated'
import { hTap } from '@/lib/haptics'
import { Colors, FontFamily, Radius, ComponentSize } from '@/constants'

const CARD_BORDER = '#2A2A2A'

function SaveButton({ onPress }: { onPress: () => void }) {
  const scale = useSharedValue(1)
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }))

  return (
    <Pressable
      onPressIn={() => {
        hTap()
        scale.value = withSpring(0.94, { damping: 18, stiffness: 380 })
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 10, stiffness: 180 })
      }}
      onPress={onPress}
    >
      <LinearGradient
        colors={[Colors.brandOrange, Colors.brandCoral]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={s.saveGradient}
      >
        <Download size={18} color={Colors.inkPrimary} strokeWidth={2.2} />
        <Text style={s.saveBtnText}>Save to Photos</Text>
      </LinearGradient>
    </Pressable>
  )
}

export function TicketActionButtons({ onSave, onShare }: { onSave: () => void; onShare: () => void }) {
  return (
    <View style={s.actions}>
      <SaveButton onPress={onSave} />
      <Pressable style={s.shareBtn} onPress={() => { hTap(); onShare() }}>
        <Share2 size={18} color={Colors.inkPrimary} strokeWidth={1.8} />
        <Text style={s.shareBtnText}>Share Event</Text>
      </Pressable>
    </View>
  )
}

const s = StyleSheet.create({
  actions: { width: '100%', gap: 10 },

  saveGradient: {
    height: ComponentSize.btnPrimary,
    borderRadius: Radius.pill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  saveBtnText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 16,
    color: Colors.inkPrimary,
    letterSpacing: 0.1,
  },

  shareBtn: {
    height: ComponentSize.btnPrimary,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  shareBtnText: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: 15,
    color: Colors.inkPrimary,
  },
})
