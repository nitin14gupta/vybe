import { forwardRef, useEffect } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { Image } from 'expo-image'
import { LinearGradient } from 'expo-linear-gradient'
import Animated, {
  useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing,
} from 'react-native-reanimated'
import { FontFamily, Logo, Colors } from '@/constants'
import { FLYER_THEMES, type FlyerTheme } from '@/constants/flyerThemes'
import { useFlyerThemeStore } from '@/store/flyerThemeStore'
import { StyledQr } from '@/components/ui/QrCard'
import { SHARE_CARD_WIDTH, SHARE_CARD_HEIGHT } from './EventShareCard'

const RSVP_STRIP = Array(12).fill('RSVP ON GORAVE').join('   ')
const MARQUEE_DURATION = 9000

function StripLabel({ theme }: { theme: FlyerTheme }) {
  return (
    <View style={s.stripLabel}>
      <Text style={[s.sideStripText, { color: theme.inkMuted }]} numberOfLines={1} ellipsizeMode="clip">
        {RSVP_STRIP}
      </Text>
    </View>
  )
}

function SideStrip({ theme, reverse }: { theme: FlyerTheme; reverse?: boolean }) {
  const translateY = useSharedValue(reverse ? -SHARE_CARD_HEIGHT : 0)

  useEffect(() => {
    translateY.value = reverse ? -SHARE_CARD_HEIGHT : 0
    translateY.value = withRepeat(
      withTiming(reverse ? 0 : -SHARE_CARD_HEIGHT, { duration: MARQUEE_DURATION, easing: Easing.linear }),
      -1,
      false,
    )
  }, [reverse])

  const colStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }))

  return (
    <View style={s.sideStrip}>
      <Animated.View style={colStyle}>
        <StripLabel theme={theme} />
        <StripLabel theme={theme} />
      </Animated.View>
    </View>
  )
}

// Scattered glyphs around the mat — some flank the photo (top corners, either
// side of the date) so the frame doesn't read as "photo floating in a void,"
// others fill the gap between the title and the host/QR footer. All purely
// decorative and absolutely positioned, so they never affect layout/height.
const SCATTER = [
  { glyph: '✧', top: 18, left: 18, fontSize: 12, rotate: '-10deg', shade: 'muted' },
  { glyph: '⋆', top: 22, right: 20, fontSize: 9, rotate: '12deg', shade: 'faint' },
  { glyph: '✦', top: '52%', left: 22, fontSize: 15, rotate: '-14deg', shade: 'faint' },
  { glyph: '✧', top: '50%', right: 26, fontSize: 11, rotate: '18deg', shade: 'muted' },
  { glyph: '⋆', top: '61%', left: '45%', fontSize: 9, rotate: '0deg', shade: 'faint' },
] as const

function Scatter({ theme }: { theme: FlyerTheme }) {
  return (
    <>
      {SCATTER.map((d, i) => (
        <Text
          key={i}
          style={[
            s.scatterGlyph,
            {
              top: d.top,
              left: 'left' in d ? d.left : undefined,
              right: 'right' in d ? d.right : undefined,
              fontSize: d.fontSize,
              color: d.shade === 'faint' ? theme.inkFaint : theme.inkMuted,
              transform: [{ rotate: d.rotate }],
            },
          ]}
        >
          {d.glyph}
        </Text>
      ))}
    </>
  )
}

// Small "wax seal" sticker overlapping the photo's top-right corner — the
// one deliberately un-subtle decoration, giving the collage/homemade-poster
// feel real printed party flyers have instead of a photo just floating in a
// frame. Uses the theme's own gradient so it always reads as "the same
// material as the mat," not a random sticker slapped on top.
function PhotoSticker({ theme }: { theme: FlyerTheme }) {
  return (
    <View style={s.stickerWrap}>
      <LinearGradient
        colors={[theme.swatchGlow, theme.bgDeep]}
        start={{ x: 0.2, y: 0.1 }}
        end={{ x: 0.9, y: 1 }}
        style={s.stickerGradient}
      >
        <Text style={[s.stickerGlyph, { color: theme.ink }]}>✦</Text>
      </LinearGradient>
    </View>
  )
}

interface Props {
  imageUrl: string
  title: string
  dateTimeLabel: string
  shareUrl: string
  hostName?: string | null
  hostAvatarUrl?: string | null
  onImageLoad?: () => void
}

export const EventFlyerShareCard = forwardRef<View, Props>(
  ({ imageUrl, title, dateTimeLabel, shareUrl, hostName, hostAvatarUrl, onImageLoad }, ref) => {
    const themeKey = useFlyerThemeStore(st => st.themeKey)
    const theme = FLYER_THEMES.find(t => t.key === themeKey) ?? FLYER_THEMES[0]

    return (
      <View ref={ref} collapsable={false} style={s.card}>
        <LinearGradient
          colors={[theme.bg, theme.bgDeep]}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 0.9, y: 1 }}
          style={StyleSheet.absoluteFill}
        />

        <SideStrip theme={theme} />
        <View style={s.middle}>
          <Text style={[s.date, { color: theme.ink }]} numberOfLines={1}>{dateTimeLabel}</Text>
          <View style={s.imageWrap}>
            <Image
              source={{ uri: imageUrl }}
              style={s.image}
              onLoad={onImageLoad}
              contentFit="cover"
              cachePolicy="memory-disk"
              priority="high"
              transition={150}
            />
            <PhotoSticker theme={theme} />
          </View>
          <Text style={[s.title, { color: theme.ink }]} numberOfLines={2}>{title}</Text>

          <Scatter theme={theme} />

          <View style={s.footerRow}>
            <View style={s.hostBlock}>
              <View style={[s.hostAvatarWrap, { backgroundColor: theme.chip }]}>
                {hostAvatarUrl ? (
                  <Image
                    source={{ uri: hostAvatarUrl }}
                    style={s.hostAvatarImg}
                    contentFit="cover"
                    cachePolicy="memory-disk"
                    priority="low"
                    transition={150}
                  />
                ) : (
                  <Text style={[s.hostAvatarFallback, { color: theme.ink }]}>
                    {(hostName ?? 'G').charAt(0).toUpperCase()}
                  </Text>
                )}
              </View>
              <View style={{ flexShrink: 1 }}>
                <Text style={[s.hostLabel, { color: theme.inkMuted }]}>HOSTED BY</Text>
                <Text style={[s.hostName, { color: theme.ink }]} numberOfLines={1}>
                  {hostName ?? 'Gorave Host'}
                </Text>
              </View>
            </View>

            <View style={s.qrBlock}>
              <View style={[s.qrWrap, { borderColor: theme.inkFaint }]}>
                <StyledQr data={shareUrl} size={64} />
              </View>
              <Text style={[s.qrCaption, { color: theme.inkMuted }]}>SCAN TO RSVP</Text>
            </View>
          </View>

          <View style={s.brandRow}>
            <Image source={Logo} style={s.logo} />
            <Text style={[s.brand, { color: theme.inkMuted }]}>Gorave</Text>
          </View>
        </View>
        <SideStrip theme={theme} reverse />
      </View>
    )
  }
)

const s = StyleSheet.create({
  card: {
    width: SHARE_CARD_WIDTH,
    height: SHARE_CARD_HEIGHT,
    borderRadius: 20,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  sideStrip: {
    width: 22,
    height: SHARE_CARD_HEIGHT,
    overflow: 'hidden',
  },
  stripLabel: {
    width: 22,
    height: SHARE_CARD_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sideStripText: {
    width: SHARE_CARD_HEIGHT,
    textAlign: 'center',
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 9,
    letterSpacing: 2,
    transform: [{ rotate: '90deg' }],
  },
  middle: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 16,
    paddingBottom: 12,
    gap: 8,
  },
  date: {
    fontFamily: FontFamily.headingBold,
    fontSize: 17,
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
  stickerWrap: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    shadowColor: Colors.black,
    shadowOpacity: 0.25,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  stickerGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stickerGlyph: { fontSize: 13 },
  title: {
    fontFamily: FontFamily.headingBold,
    fontSize: 18,
    textAlign: 'center',
    lineHeight: 23,
    paddingHorizontal: 6,
  },
  scatterGlyph: {
    position: 'absolute',
  },
  footerRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    marginTop: 'auto',
  },
  hostBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexShrink: 1,
    marginRight: 10,
  },
  hostAvatarWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  hostAvatarImg: { width: '100%', height: '100%' },
  hostAvatarFallback: {
    fontFamily: FontFamily.headingBold,
    fontSize: 17,
  },
  hostLabel: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 9,
    letterSpacing: 1,
  },
  hostName: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 15,
  },
  qrBlock: {
    alignItems: 'center',
    gap: 5,
  },
  qrWrap: {
    padding: 6,
    borderRadius: 12,
    backgroundColor: Colors.white,
    borderWidth: 1,
  },
  qrCaption: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 8,
    letterSpacing: 1,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  logo: { width: 14, height: 14, borderRadius: 3 },
  brand: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 11,
    letterSpacing: 0.5,
  },
})
