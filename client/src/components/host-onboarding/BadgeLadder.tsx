import { memo } from 'react'
import { View, Text, Image, StyleSheet } from 'react-native'
import { Colors, FontFamily, Radius, HOST_BADGE_IMAGES, withOpacity } from '@/constants'

const TIERS = [
  { key: 'Rising', label: 'Rising', req: '2+ events hosted', text: Colors.accentGreen },
  { key: 'Established', label: 'Established', req: '10+ events hosted', text: Colors.brandOrange },
  { key: 'Elite', label: 'Elite', req: '25+ events hosted', text: Colors.inkPrimary },
  { key: 'Legend', label: 'Legend', req: '75+ events hosted', text: Colors.accentGold },
] as const

function BadgeLadderBase() {
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
          <View key={tier.key} style={s.card}>
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

export const BadgeLadder = memo(BadgeLadderBase)

const s = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.divider,
    borderRadius: Radius.card,
    padding: 12,
    marginBottom: 16,
  },
  bannerIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 9,
    backgroundColor: withOpacity(Colors.inkPrimary, 0.06),
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerIcon: { width: 22, height: 22 },
  bannerText: { flex: 1 },
  bannerLabel: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 10.5,
    color: Colors.inkSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  bannerName: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 14,
    color: Colors.inkPrimary,
    marginTop: 2,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  card: {
    width: '47.5%',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.divider,
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
    backgroundColor: withOpacity(Colors.inkPrimary, 0.06),
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
