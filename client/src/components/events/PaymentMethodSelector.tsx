import { useState } from 'react'
import { View, Text, StyleSheet, Pressable, ScrollView, ActivityIndicator } from 'react-native'
import { Image } from 'expo-image'
import { LinearGradient } from 'expo-linear-gradient'
import { ChevronRight, Wallet, QrCode } from 'lucide-react-native'
import { Colors, FontFamily } from '@/constants'
import { hTap } from '@/lib/haptics'
import type { UpiApp } from '@/hooks/useInstalledUpiApps'

// Android reports icons as base64 PNG (or occasionally a uri/file path); iOS
// uses a require()'d bundled asset id (a number) instead — see UpiApp.app_icon.
function upiIconSource(app_icon: string | number) {
  if (typeof app_icon === 'number') return app_icon
  return {
    uri: (app_icon.startsWith('http') || app_icon.startsWith('file:') || app_icon.startsWith('/'))
      ? app_icon
      : `data:image/png;base64,${app_icon}`,
  }
}

function UpiAppRow({ app, style, onPress }: { app: UpiApp; style: any; onPress: () => void }) {
  const [iconFailed, setIconFailed] = useState(false)
  const showIcon = !!app.app_icon && !iconFailed

  return (
    <Pressable style={style} onPress={onPress}>
      {showIcon ? (
        <Image
          source={upiIconSource(app.app_icon)}
          style={s.upiAppIcon}
          contentFit="cover"
          cachePolicy="memory-disk"
          priority="low"
          transition={150}
          onError={() => setIconFailed(true)}
        />
      ) : (
        <View style={[s.dot, { backgroundColor: Colors.elevated }]}>
          <Text style={[s.dotText, { fontSize: 13, color: Colors.inkSecondary }]}>
            {app.app_name.charAt(0)}
          </Text>
        </View>
      )}
      <Text style={s.methodLabel}>{app.app_name}</Text>
      <ChevronRight size={18} color={Colors.inkDisabled} strokeWidth={1.8} />
    </Pressable>
  )
}

function UpiAppChip({ app, onPress }: { app: UpiApp; onPress: () => void }) {
  const [iconFailed, setIconFailed] = useState(false)
  const showIcon = !!app.app_icon && !iconFailed

  return (
    <Pressable style={s.upiChip} onPress={onPress}>
      {showIcon ? (
        <Image
          source={upiIconSource(app.app_icon)}
          style={s.upiChipIcon}
          contentFit="cover"
          cachePolicy="memory-disk"
          priority="low"
          transition={150}
          onError={() => setIconFailed(true)}
        />
      ) : (
        <View style={[s.upiChipIcon, s.upiChipIconFallback]}>
          <Text style={[s.dotText, { fontSize: 15, color: Colors.inkSecondary }]}>
            {app.app_name.charAt(0)}
          </Text>
        </View>
      )}
      <Text style={s.upiChipLabel} numberOfLines={1}>{app.app_name}</Text>
    </Pressable>
  )
}

export function PaymentMethodSelector({
  amountToPay,
  upiApps,
  upiAppsLoading,
  recommendedApp,
  paying,
  onWalletPay,
  onUpiApp,
  onQrPress,
  onEnterUpiId,
}: {
  amountToPay: number
  upiApps: UpiApp[]
  upiAppsLoading: boolean
  recommendedApp: UpiApp | undefined
  paying: boolean
  onWalletPay: () => void
  onUpiApp: (packageName: string) => void
  onQrPress: () => void
  onEnterUpiId: () => void
}) {
  if (amountToPay === 0) {
    return (
      <Pressable style={s.walletOnlyBtn} onPress={onWalletPay}>
        <LinearGradient colors={[Colors.brandOrange, Colors.brandCoral]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.walletOnlyGradient}>
          <Wallet size={18} color={Colors.inkPrimary} strokeWidth={2} />
          <Text style={s.walletOnlyText}>PAY WITH WALLET</Text>
        </LinearGradient>
      </Pressable>
    )
  }

  return (
    <>
      {recommendedApp && (
        <>
          <Text style={s.sectionLabel}>Recommended Payments</Text>
          <View style={s.methodCard}>
            <UpiAppRow
              app={recommendedApp}
              style={s.methodRow}
              onPress={() => onUpiApp(recommendedApp.package_name)}
            />
          </View>
        </>
      )}

      <View style={s.upiSectionRow}>
        <Image
          source={require('../../../assets/images/payments/upiLogo.png')}
          style={s.upiLogoImg}
          contentFit="contain"
        />
        <Text style={s.sectionLabel}>Pay by UPI</Text>
      </View>
      <View style={s.methodCard}>
        <View style={[s.methodRow, s.methodBorder]}>
          <View style={[s.dot, { backgroundColor: Colors.elevated }]}>
            <Image
              source={require('../../../assets/images/payments/upiLogo.png')}
              style={s.upiLogoImgTiny}
              contentFit="contain"
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.methodLabel}>Pay by any UPI app</Text>
            <Text style={s.methodSub}>Use any UPI app on the phone to pay</Text>
          </View>
        </View>

        {upiAppsLoading ? (
          <View style={s.upiLoadingRow}>
            <ActivityIndicator size="small" color={Colors.inkDisabled} />
          </View>
        ) : upiApps.length === 0 ? (
          <View style={s.upiEmptyRow}>
            <Text style={s.upiEmptyText}>No UPI apps found on device</Text>
          </View>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.upiChipRow}
            style={s.methodBorder}
          >
            {upiApps.map(app => (
              <UpiAppChip
                key={app.package_name}
                app={app}
                onPress={() => onUpiApp(app.package_name)}
              />
            ))}
          </ScrollView>
        )}

        <Pressable
          style={[s.methodRow, s.methodTopBorder]}
          onPress={() => { if (!paying) onQrPress() }}
          disabled={paying}
        >
          <View style={[s.dot, { backgroundColor: Colors.elevated }]}>
            <QrCode size={18} color={Colors.inkSecondary} strokeWidth={2} />
          </View>
          <Text style={s.methodLabel}>Pay via QR Code</Text>
          <ChevronRight size={18} color={Colors.inkDisabled} strokeWidth={1.8} />
        </Pressable>
        <Pressable
          style={[s.methodRow, s.methodTopBorder]}
          onPress={() => { hTap(); onEnterUpiId() }}
        >
          <View style={[s.dot, { backgroundColor: Colors.elevated }]}>
            <Text style={[s.dotText, { color: Colors.inkSecondary, fontSize: 14 }]}>@</Text>
          </View>
          <Text style={s.methodLabel}>Other / Enter UPI ID</Text>
          <ChevronRight size={18} color={Colors.inkDisabled} strokeWidth={1.8} />
        </Pressable>
      </View>
    </>
  )
}

const s = StyleSheet.create({
  sectionLabel: { fontFamily: FontFamily.bodyMedium, fontSize: 14, letterSpacing: 0.1, color: Colors.inkSecondary, marginLeft: 4 },
  upiSectionRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginLeft: 4, marginTop: 4 },
  upiLogoImg: { height: 28, width: 54 },
  upiLogoImgTiny: { height: 16, width: 16 },

  upiChipRow: { flexDirection: 'row', gap: 20, paddingHorizontal: 16, paddingVertical: 16 },
  upiChip: { alignItems: 'center', gap: 6, width: 64 },
  upiChipIcon: { width: 48, height: 48, borderRadius: 14 },
  upiChipIconFallback: { backgroundColor: Colors.elevated, alignItems: 'center', justifyContent: 'center' },
  upiChipLabel: { fontFamily: FontFamily.bodyRegular, fontSize: 11, color: Colors.inkSecondary, textAlign: 'center' },

  methodCard: { backgroundColor: Colors.surface, borderRadius: 16, overflow: 'hidden' },
  methodRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, paddingVertical: 14 },
  methodBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.divider },
  methodTopBorder: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: Colors.divider },
  methodLabel: { flex: 1, fontFamily: FontFamily.bodyMedium, fontSize: 15, color: Colors.inkPrimary },
  methodSub: { fontFamily: FontFamily.bodyRegular, fontSize: 12, color: Colors.inkSecondary, marginTop: 1 },
  dot: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  dotText: { fontFamily: FontFamily.headingBold, fontSize: 16, color: Colors.inkPrimary },
  upiAppIcon: { width: 36, height: 36, borderRadius: 10 },
  upiLoadingRow: { paddingVertical: 20, alignItems: 'center' },
  upiEmptyRow: { paddingHorizontal: 16, paddingVertical: 14 },
  upiEmptyText: { fontFamily: FontFamily.bodyRegular, fontSize: 14, color: Colors.inkDisabled },

  walletOnlyBtn: { borderRadius: 28, overflow: 'hidden', marginTop: 8 },
  walletOnlyGradient: { height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  walletOnlyText: { fontFamily: FontFamily.bodySemiBold, fontSize: 15, color: Colors.inkPrimary, letterSpacing: 0.8 },
})
