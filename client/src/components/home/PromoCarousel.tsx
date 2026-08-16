import { ReactNode } from 'react'
import { View, Text, StyleSheet, Pressable, FlatList, Dimensions, Linking } from 'react-native'
import { Image } from 'expo-image'
import { router } from 'expo-router'
import { hTap } from '@/lib/haptics'
import { FontFamily, SOCIAL_LINKS, Colors } from '@/constants'

const { width: SCREEN_W } = Dimensions.get('window')
const CARD_W = SCREEN_W - 16 * 2 - 36 // sits inside the home feed's 16px padding, peeks the next card
const CARD_GAP = 12

const INSTAGRAM_GORAVE_IMG = require('../../../assets/promo/instagramXgorave.png')
const CALENDAR_GORAVE_IMG = require('../../../assets/promo/calenderXgorave.png')
const HOST_GORAVE_IMG = require('../../../assets/promo/hostXgorave.png')

interface PromoCardData {
  key: string
  bg: string
  title: string
  subtitle: string
  cta: string
  onPress: () => void
  graphic: ReactNode
}

const s = StyleSheet.create({
  list: { gap: CARD_GAP, paddingRight: 4 },
  card: {
    width: CARD_W,
    borderRadius: 20,
    minHeight: 116,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  textCol: {
    flex: 1,
    gap: 4,
    justifyContent: 'center',
    paddingVertical: 18,
    paddingLeft: 18,
    paddingRight: 10,
  },
  title: {
    fontFamily: FontFamily.headingBold,
    fontSize: 17,
    color: '#181818',
  },
  subtitle: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 13,
    color: '#5B5650',
    lineHeight: 18,
  },
  ctaBtn: {
    marginTop: 10,
    alignSelf: 'flex-start',
    backgroundColor: Colors.background,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  ctaText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 13,
    color: Colors.white,
  },
  bleedImageWrap: {
    width: 128,
    alignSelf: 'stretch',
  },
  bleedImage: {
    width: '100%',
    height: '100%',
  },
})

const CARDS: PromoCardData[] = [
  {
    key: 'instagram',
    bg: '#EEF2F5',
    title: "Don't miss the latest",
    subtitle: 'Follow Gorave on Instagram',
    cta: 'Follow us',
    onPress: () => { hTap(); Linking.openURL(SOCIAL_LINKS.instagram) },
    graphic: (
      <View style={s.bleedImageWrap}>
        <Image
          source={INSTAGRAM_GORAVE_IMG}
          style={s.bleedImage}
          contentFit="cover"
          cachePolicy="memory-disk"
          transition={150}
        />
      </View>
    ),
  },
  {
    key: 'calendar',
    bg: '#E7ECEA',
    title: 'Introducing Calendar',
    subtitle: 'Every event you care about, in one place',
    cta: 'Open calendar',
    onPress: () => { hTap(); router.push('/(settings)/calendar' as any) },
    graphic: (
      <View style={s.bleedImageWrap}>
        <Image
          source={CALENDAR_GORAVE_IMG}
          style={s.bleedImage}
          contentFit="cover"
          cachePolicy="memory-disk"
          transition={150}
        />
      </View>
    ),
  },
  {
    key: 'host',
    bg: '#FCE9DC',
    title: 'Host your own event',
    subtitle: 'Create, get discovered, and earn — free',
    cta: 'Become a host',
    onPress: () => { hTap(); router.push('/(host-onboarding)' as any) },
    graphic: (
      <View style={s.bleedImageWrap}>
        <Image
          source={HOST_GORAVE_IMG}
          style={s.bleedImage}
          contentFit="cover"
          cachePolicy="memory-disk"
          transition={150}
        />
      </View>
    ),
  },
]

export function PromoCarousel() {
  return (
    <FlatList
      data={CARDS}
      horizontal
      keyExtractor={c => c.key}
      showsHorizontalScrollIndicator={false}
      snapToInterval={CARD_W + CARD_GAP}
      decelerationRate="fast"
      contentContainerStyle={s.list}
      renderItem={({ item }) => (
        <Pressable style={[s.card, { backgroundColor: item.bg }]} onPress={item.onPress}>
          <View style={s.textCol}>
            <Text style={s.title}>{item.title}</Text>
            <Text style={s.subtitle}>{item.subtitle}</Text>
            <View style={s.ctaBtn}>
              <Text style={s.ctaText}>{item.cta}</Text>
            </View>
          </View>
          {item.graphic}
        </Pressable>
      )}
    />
  )
}
