import { forwardRef } from 'react'
import { View, Text, StyleSheet, type ImageSourcePropType } from 'react-native'
import QRCodeStyled from 'react-native-qrcode-styled'
import { Colors, FontFamily } from '@/constants'

const DEFAULT_LOGO = require('../../../assets/images/expo-logo.png')

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
export const QrCard = forwardRef<View, QrCardProps>(({ data, title, subtitle, size = 252, logoSource = DEFAULT_LOGO }, ref) => (
  <View ref={ref} collapsable={false} style={s.card}>
    <QRCodeStyled
      data={data}
      style={s.qr}
      size={size}
      padding={20}
      color={'#000'}
      errorCorrectionLevel={'H'}
      innerEyesOptions={{ borderRadius: '20%', color: '#000' }}
      outerEyesOptions={{ borderRadius: '30%', color: Colors.brandOrange }}
      logo={{
        href: logoSource,
        padding: 4,
      }}
    />
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
