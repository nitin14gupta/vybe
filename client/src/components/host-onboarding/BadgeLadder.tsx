import { View, Text, Image, StyleSheet } from 'react-native'
import { Colors, FontFamily, Radius, HOST_BADGE_IMAGES } from '@/constants'

const TIERS = [
  { key: 'Rising', label: 'Rising', req: '2+ events hosted', tint: 'rgba(0,196,140,0.12)', border: 'rgba(0,196,140,0.35)', text: Colors.accentGreen },
  { key: 'Established', label: 'Established', req: '10+ events hosted', tint: 'rgba(255,107,53,0.12)', border: 'rgba(255,107,53,0.35)', text: Colors.brandOrange },
  { key: 'Elite', label: 'Elite', req: '25+ events hosted', tint: 'rgba(255,56,100,0.12)', border: 'rgba(255,56,100,0.35)', text: Colors.brandCoral },
  { key: 'Legend', label: 'Legend', req: '75+ events hosted', tint: 'rgba(255,184,48,0.14)', border: 'rgba(255,184,48,0.4)', text: Colors.accentGold },
] as const

export function BadgeLadder() {
  return (
    <View>
      <View style={s.banner}>
        <View style={s.bannerIconWrap}>
          <Image source={HOST_BADGE_IMAGES.Rising} style={s.bannerIcon} resizeMode="contain" />
        </View>
        <View style={s.bannerText}>
          <Text style={s.bannerLabel}>First milestone</Text>
          <Text style={s.bannerName}>Rising Host — after 2 events</Text>
        </View>
      </View>

      <View style={s.grid}>
        {TIERS.map(tier => (
          <View key={tier.key} style={[s.card, { backgroundColor: tier.tint, borderColor: tier.border }]}>
            <View style={s.cardIconWrap}>
              <Image source={HOST_BADGE_IMAGES[tier.key]} style={s.cardIcon} resizeMode="contain" />
            </View>
            <Text style={[s.cardName, { color: tier.text }]}>{tier.label}</Text>
            <Text style={s.cardReq}>{tier.req}</Text>
          </View>
        ))}
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(0,196,140,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0,196,140,0.3)',
    borderRadius: Radius.card,
    padding: 12,
    marginBottom: 16,
  },
  bannerIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 9,
    backgroundColor: 'rgba(0,196,140,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerIcon: { width: 22, height: 22 },
  bannerText: { flex: 1 },
  bannerLabel: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 10.5,
    color: Colors.accentGreen,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  bannerName: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 14,
    color: Colors.accentGreen,
    marginTop: 2,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  card: {
    width: '47.5%',
    borderWidth: 1,
    borderRadius: Radius.card,
    paddingVertical: 14,
    paddingHorizontal: 10,
    alignItems: 'center',
    gap: 6,
  },
  cardIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardIcon: { width: 30, height: 30 },
  cardName: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 13,
  },
  cardReq: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 11,
    color: Colors.inkSecondary,
    textAlign: 'center',
  },
})
