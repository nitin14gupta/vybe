import React from 'react'
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native'
import { CameraView } from 'expo-camera'
import { AlertTriangle, CheckCircle, QrCode, XCircle } from 'lucide-react-native'
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated'
import { hTap } from '@/lib/haptics'
import { Colors, FontFamily } from '@/constants'
import { PrimaryButton } from '@/components/ui'

export type ScanResult = {
  ok: boolean
  already_checked_in?: boolean
  name: string
  username?: string | null
  error?: string
}

export function ScannerCameraView({
  granted,
  onRequestPermission,
  onBarcodeScanned,
  scanning,
  scanResult,
}: {
  granted: boolean
  onRequestPermission: () => void
  onBarcodeScanned: (event: { data: string }) => void
  scanning: boolean
  scanResult: ScanResult | null
}) {
  if (!granted) {
    return (
      <View style={[s.camera, s.noPermission]}>
        <QrCode size={40} color={Colors.inkDisabled} />
        <Text style={s.noPermText}>Camera access needed to scan QR codes</Text>
        <PrimaryButton label="Grant Permission" size="small" onPress={() => { hTap(); onRequestPermission() }} />
      </View>
    )
  }

  return (
    <CameraView
      style={s.camera}
      facing="back"
      barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
      onBarcodeScanned={onBarcodeScanned}
    >
      <View style={s.scanFrame}>
        <View style={[s.corner, s.tl]} />
        <View style={[s.corner, s.tr]} />
        <View style={[s.corner, s.bl]} />
        <View style={[s.corner, s.br]} />
      </View>
      <Text style={s.scanHint}>Align QR code to scan</Text>

      {scanResult && (
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(200)}
          style={[
            s.resultBanner,
            scanResult.already_checked_in ? s.resultWarning : scanResult.ok ? s.resultSuccess : s.resultError,
          ]}
        >
          {scanResult.already_checked_in ? (
            <>
              <AlertTriangle size={16} color="#fff" strokeWidth={2} />
              <Text style={s.resultText}>{scanResult.name} already checked in</Text>
            </>
          ) : scanResult.ok ? (
            <>
              <CheckCircle size={16} color="#fff" strokeWidth={2} />
              <Text style={s.resultText}>{scanResult.name} checked in!</Text>
            </>
          ) : (
            <>
              <XCircle size={16} color="#fff" strokeWidth={2} />
              <Text style={s.resultText}>{scanResult.error || 'Invalid ticket'}</Text>
            </>
          )}
        </Animated.View>
      )}

      {scanning && (
        <View style={s.scanningOverlay}>
          <ActivityIndicator color="#fff" />
        </View>
      )}
    </CameraView>
  )
}

const CORNER_SIZE = 22
const CORNER_BORDER = 3

const s = StyleSheet.create({
  camera: { flex: 1 },
  noPermission: { alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.elevated, gap: 12 },
  noPermText: { fontFamily: FontFamily.bodyRegular, fontSize: 14, color: Colors.inkSecondary, textAlign: 'center', paddingHorizontal: 32 },

  scanFrame: {
    position: 'absolute',
    alignSelf: 'center',
    top: '50%',
    marginTop: -80,
    width: 160,
    height: 160,
  },
  corner: {
    position: 'absolute',
    width: CORNER_SIZE,
    height: CORNER_SIZE,
    borderColor: '#fff',
  },
  tl: { top: 0, left: 0, borderTopWidth: CORNER_BORDER, borderLeftWidth: CORNER_BORDER, borderTopLeftRadius: 6 },
  tr: { top: 0, right: 0, borderTopWidth: CORNER_BORDER, borderRightWidth: CORNER_BORDER, borderTopRightRadius: 6 },
  bl: { bottom: 0, left: 0, borderBottomWidth: CORNER_BORDER, borderLeftWidth: CORNER_BORDER, borderBottomLeftRadius: 6 },
  br: { bottom: 0, right: 0, borderBottomWidth: CORNER_BORDER, borderRightWidth: CORNER_BORDER, borderBottomRightRadius: 6 },
  scanHint: {
    position: 'absolute',
    bottom: 12,
    alignSelf: 'center',
    color: 'rgba(255,255,255,0.75)',
    fontFamily: FontFamily.bodyRegular,
    fontSize: 12,
  },
  resultBanner: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  resultSuccess: { backgroundColor: 'rgba(0,196,140,0.9)' },
  resultWarning: { backgroundColor: 'rgba(255,107,53,0.9)' },
  resultError: { backgroundColor: 'rgba(220,53,69,0.92)' },
  resultText: { color: '#fff', fontFamily: FontFamily.bodyMedium, fontSize: 14 },
  scanningOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
})
