import { forwardRef } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { Image } from 'expo-image'
import { LinearGradient } from 'expo-linear-gradient'
import { Calendar } from 'lucide-react-native'
import { Colors, FontFamily } from '@/constants'

export const SHARE_CARD_WIDTH = 320
export const SHARE_CARD_HEIGHT = 400
const LOGO = require('../../assets/images/icon.png')

interface Props {
  imageUrl: string
  title: string
  dateTimeLabel: string
  onImageLoad?: () => void
}

// Poster-style card captured via useImageShare and shared as a PNG.
export const EventShareCard = forwardRef<View, Props>(
  ({ imageUrl, title, dateTimeLabel, onImageLoad }, ref) => {
    return (
      <View ref={ref} collapsable={false} style={s.card}>
        <Image
          source={{ uri: imageUrl }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          onLoad={onImageLoad}
        />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.9)']}
          locations={[0.4, 1]}
          style={StyleSheet.absoluteFill}
        />
        <View style={s.content}>
          <Text style={s.title} numberOfLines={2}>{title}</Text>
          <View style={s.metaRow}>
            <Calendar size={16} color="#fff" strokeWidth={2} />
            <Text style={s.meta}>{dateTimeLabel}</Text>
          </View>
           <View style={s.brandRow}>
      <Image source={LOGO} style={s.logo} />
      <Text style={s.brand}>VYBE</Text>
    </View>
        </View>
      </View>
    )
  }
)

const s = StyleSheet.create({
  card: { width: SHARE_CARD_WIDTH, height: SHARE_CARD_HEIGHT, overflow: 'hidden', backgroundColor: '#111' },
  content: { position: 'absolute', left: 0, right: 0, bottom: 0, padding: 20, gap: 8 },
  title: { fontFamily: FontFamily.headingBold, fontSize: 24, color: '#fff' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  meta: { fontFamily: FontFamily.bodyMedium, fontSize: 14, color: '#fff' },
  logo: { width: 16, height: 16, borderRadius: 4 },
   brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 16,
  },
  brand: { fontFamily: FontFamily.headingBold, fontSize: 12, letterSpacing: 2, color: Colors.brandOrange, marginTop: 4 },
})
