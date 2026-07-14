import { forwardRef, useEffect, useState } from 'react'
import { View, Text, StyleSheet, InteractionManager, type ImageSourcePropType } from 'react-native'
import QRCodeStyled from 'react-native-qrcode-styled'
import { FontFamily, Logo } from '@/constants'

interface StyledQrProps {
  data: string
  size?: number
  padding?: number
  logoSource?: ImageSourcePropType
  /** Set false to drop the center logo cutout — useful for very short/dense data */
  showLogo?: boolean
}

// Bare branded QR graphic — modern dot pieces, black rounded finder eyes, logo
// cut into the center. Used on its own (e.g. inside a custom ticket layout)
// or wrapped by QrCard below for the "big scannable code in a white card" look.
//
// Rendering every module as its own rounded/circular SVG piece is expensive
// (hundreds of individual paths) — expensive enough that mounting it inline
// was stalling screen transitions and sheet-open animations by several
// seconds. We defer the actual mount by a frame so the surrounding
// screen/sheet finishes animating in first, and this pops in a beat later
// instead of blocking everything else.
export function StyledQr({ data, size = 176, padding = 0, logoSource = Logo, showLogo = true }: StyledQrProps) {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => setReady(true))
    return () => task.cancel()
  }, [])

  if (!ready) return <View style={[s.qr, { width: size, height: size }]} />

  return (
    <QRCodeStyled
      data={data}
      style={s.qr}
      size={size}
      padding={padding}
      color={'#000'}
      errorCorrectionLevel={'H'}
      pieceBorderRadius={'50%'}
      pieceScale={0.86}
      innerEyesOptions={{ borderRadius: '30%', color: '#000' }}
      outerEyesOptions={{ borderRadius: '35%', color: '#000' }}
      // logo={showLogo ? {
      //   href: logoSource,
      //   hidePieces: true,
      //   scale: 0.28,
      //   padding: 8,
      // } : undefined}
    />
  )
}

interface QrCardProps {
  data: string
  title: string
  subtitle?: string | null
  size?: number
  logoSource?: ImageSourcePropType
}

// Reusable "big scannable QR in a white card" — used for profile share codes
// today; drop into event/ticket share screens the same way (pass a different
// `data` deep link + title/subtitle).
export const QrCard = forwardRef<View, QrCardProps>(({ data, title, subtitle, size = 252, logoSource = Logo }, ref) => (
  <View ref={ref} collapsable={false} style={s.card}>
    <StyledQr data={data} size={size} logoSource={logoSource} />
    <Text style={s.title} numberOfLines={1}>{title}</Text>
    {subtitle ? <Text style={s.subtitle} numberOfLines={1}>{subtitle}</Text> : null}
  </View>
))

const s = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 28,
    paddingHorizontal: 28,
    paddingTop: 32,
    paddingBottom: 24,
    alignItems: 'center',
    gap: 4,
  },
  qr: { backgroundColor: '#fff' },
  title: {
    fontFamily: FontFamily.headingBold,
    fontSize: 18,
    color: '#111',
    marginTop: 16,
  },
  subtitle: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 13,
    color: '#666',
  },
})
