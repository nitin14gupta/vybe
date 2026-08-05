import { Ref } from 'react'
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native'
import { Image } from 'expo-image'
import { Colors, FontFamily } from '@/constants'
import { StyledQr } from '@/components/ui'

export function PaymentQrCard({
  cardRef,
  amountInr,
  paymentUrl,
  imageUrl,
  isExpired,
  imgLoading,
  onImageLoadStart,
  onImageLoad,
}: {
  cardRef: Ref<View>
  amountInr: number
  paymentUrl: string
  imageUrl: string
  isExpired: boolean
  imgLoading: boolean
  onImageLoadStart: () => void
  onImageLoad: () => void
}) {
  return (
    <View style={s.card} ref={cardRef} collapsable={false}>
      <Text style={s.toPayLabel}>TO PAY</Text>
      <Text style={s.amount}>₹{amountInr}</Text>

      <View style={[s.qrWrap, isExpired && s.qrWrapExpired]}>
        {paymentUrl ? (
          // Clean QR generated from UPI payment string — no Razorpay branding
          <View style={s.qrSvgWrap}>
            <StyledQr data={paymentUrl} size={220} showLogo={false} />
          </View>
        ) : imageUrl ? (
          // Fallback: crop Razorpay branded image to show just the QR code area
          <View style={s.qrCropContainer}>
            {imgLoading && (
              <ActivityIndicator
                style={StyleSheet.absoluteFill}
                color={Colors.inkDisabled}
              />
            )}
            <Image
              source={{ uri: imageUrl }}
              style={s.qrCropImage}
              contentFit="fill"
              cachePolicy="memory-disk"
              priority="high"
              transition={150}
              onLoadStart={onImageLoadStart}
              onLoad={onImageLoad}
              onError={onImageLoad}
            />
          </View>
        ) : (
          <View style={s.qrPlaceholder}>
            <ActivityIndicator color={Colors.inkDisabled} />
          </View>
        )}
        {isExpired && (
          <View style={s.expiredOverlay}>
            <Text style={s.expiredOverlayText}>QR Expired</Text>
          </View>
        )}
      </View>

      <Text style={s.scanHint}>Scan and pay using any UPI app</Text>
    </View>
  )
}

const s = StyleSheet.create({
  card: { backgroundColor: Colors.surface, borderRadius: 20, padding: 24, alignItems: 'center', gap: 14 },
  toPayLabel: { fontFamily: FontFamily.bodyMedium, fontSize: 12, letterSpacing: 1.5, color: Colors.inkSecondary },
  amount: { fontFamily: FontFamily.headingBold, fontSize: 36, color: Colors.inkPrimary },

  qrWrap: { borderRadius: 16, overflow: 'hidden', backgroundColor: '#fff' },
  qrWrapExpired: { opacity: 0.35 },

  // Clean QR from react-native-qrcode-svg (paymentUrl available)
  qrSvgWrap: { width: 240, height: 240, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', padding: 10 },

  // Crop fallback: show only the QR code portion of Razorpay's branded image.
  // Razorpay template is approx portrait ~3:4 ratio; the QR code lives in the
  // upper-center 40% of the image. We scale up and clip to zoom into that area.
  qrCropContainer: { width: 240, height: 240, overflow: 'hidden', alignItems: 'center', backgroundColor: '#fff' },
  qrCropImage: { width: 350, height: 440, marginTop: -80 },

  qrPlaceholder: { width: 240, height: 240, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.elevated },
  expiredOverlay: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.55)' },
  expiredOverlayText: { fontFamily: FontFamily.headingBold, fontSize: 22, color: '#fff' },

  scanHint: { fontFamily: FontFamily.bodyRegular, fontSize: 14, color: Colors.inkSecondary, textAlign: 'center' },
})
