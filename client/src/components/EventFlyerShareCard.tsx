import { forwardRef } from 'react'
import { View, Text, Image, StyleSheet } from 'react-native'
import { FontFamily, Logo } from '@/constants'
import { SHARE_CARD_WIDTH, SHARE_CARD_HEIGHT } from './EventShareCard'

const RSVP_STRIP = Array(8).fill('RSVP ON VYBE').join('   •   ')

interface Props {
  imageUrl: string
  title: string
  dateTimeLabel: string
  onImageLoad?: () => void
}

function SideStrip() {
  return (
    <View style={s.sideStrip}>
      <Text style={s.sideStripText} numberOfLines={1}>{RSVP_STRIP}</Text>
    </View>
  )
}

// Third share-sheet slide — a printed-poster "mat frame" treatment (à la
// Partiful): cream border with repeating RSVP copy running up the sides,
// bold date/title in the mat, and the event photo inset in the middle.
export const EventFlyerShareCard = forwardRef<View, Props>(
  ({ imageUrl, title, dateTimeLabel, onImageLoad }, ref) => {
    return (
      <View ref={ref} collapsable={false} style={s.card}>
        <SideStrip />
        <View style={s.middle}>
          <Text style={s.date} numberOfLines={1}>{dateTimeLabel}</Text>
          <View style={s.imageWrap}>
            <Image
              source={{ uri: imageUrl }}
              style={s.image}
              onLoad={onImageLoad}
              resizeMode="cover"
            />
          </View>
          <Text style={s.title} numberOfLines={2}>{title}</Text>
          <View style={s.brandRow}>
            <Image source={Logo} style={s.logo} />
            <Text style={s.brand}>Vybe</Text>
          </View>
        </View>
        <SideStrip />
      </View>
    )
  }
)

const s = StyleSheet.create({
  card: {
    width: SHARE_CARD_WIDTH,
    height: SHARE_CARD_HEIGHT,
    backgroundColor: '#F1E9D8',
    borderRadius: 20,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  sideStrip: {
    width: 22,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  sideStripText: {
    width: SHARE_CARD_HEIGHT,
    textAlign: 'center',
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 9,
    letterSpacing: 2,
    color: 'rgba(20,16,8,0.4)',
    transform: [{ rotate: '90deg' }],
  },
  middle: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 18,
    paddingBottom: 14,
    gap: 10,
  },
  date: {
    fontFamily: FontFamily.headingBold,
    fontSize: 17,
    color: '#171310',
    textAlign: 'center',
  },
  imageWrap: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#00000010',
  },
  image: { width: '100%', height: '100%' },
  title: {
    fontFamily: FontFamily.headingBold,
    fontSize: 18,
    color: '#171310',
    textAlign: 'center',
    lineHeight: 23,
    paddingHorizontal: 6,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 'auto',
  },
  logo: { width: 14, height: 14, borderRadius: 3 },
  brand: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 11,
    letterSpacing: 0.5,
    color: 'rgba(20,16,8,0.55)',
  },
})
