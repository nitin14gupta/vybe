import { forwardRef } from 'react'
import { View, Text, StyleSheet, type ImageSourcePropType } from 'react-native'
import QRCode from 'react-native-qrcode-svg'
import { FontFamily, Logo } from '@/constants'

interface StyledQrProps {
  data: string
  size?: number
  padding?: number
  logoSource?: ImageSourcePropType
  /** Set false to drop the center logo cutout — useful for very short/dense data */
  showLogo?: boolean
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H'
}

export function StyledQr({
  data, size = 176, padding = 0, logoSource = Logo, showLogo = true,
  errorCorrectionLevel = 'H',
}: StyledQrProps) {
  return (
    <View style={[s.qr, { width: size, height: size, alignItems: 'center', justifyContent: 'center' }]}>
      <QRCode
        value={data}
        size={size - padding * 2}
        color="#000"
        backgroundColor="#fff"
        ecl={errorCorrectionLevel}
        logo={showLogo ? logoSource : undefined}
        logoSize={size * 0.22}
        logoBackgroundColor="#fff"
        logoBorderRadius={8}
        logoMargin={2}
        quietZone={padding}
      />
    </View>
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
