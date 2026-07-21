import { forwardRef } from 'react'
import { View, Text, Image, StyleSheet } from 'react-native'
import { Colors, FontFamily, Logo } from '@/constants'
import { StyledQr } from '@/components/ui/QrCard'
import { SHARE_CARD_WIDTH, SHARE_CARD_HEIGHT } from './EventShareCard'

interface Props {
  data: string
  title: string
  dateTimeLabel: string
}

// Second share-sheet slide — a scannable link to the event, same visual
// language as the profile QrCard but sized to match the other share slides.
export const EventQrShareCard = forwardRef<View, Props>(({ data, title, dateTimeLabel }, ref) => (
  <View ref={ref} collapsable={false} style={s.card}>
    <View style={s.qrWrap}>
      <StyledQr data={data} size={196} />
    </View>
    <Text style={s.title} numberOfLines={2}>{title}</Text>
    <Text style={s.meta}>{dateTimeLabel}</Text>
    <View style={s.brandRow}>
      <Image source={Logo} style={s.logo} />
      <Text style={s.brand}>VYBE</Text>
    </View>
  </View>
))

const s = StyleSheet.create({
  card: {
    width: SHARE_CARD_WIDTH,
    height: SHARE_CARD_HEIGHT,
    backgroundColor: '#fff',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 6,
  },
  qrWrap: {
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#eee',
    marginBottom: 14,
  },
  title: {
    fontFamily: FontFamily.headingBold,
    fontSize: 17,
    color: '#111',
    textAlign: 'center',
  },
  meta: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 16,
  },
  logo: { width: 16, height: 16, borderRadius: 4 },
  brand: {
    fontFamily: FontFamily.headingBold,
    fontSize: 12,
    letterSpacing: 2,
    color: Colors.brandOrange,
  },
})
