import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { CameraView, useCameraPermissions } from 'expo-camera'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { ArrowLeft, CheckCircle, QrCode, Search, UserCheck, Users } from 'lucide-react-native'
import { Image } from 'expo-image'
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated'
import { hTap, hSuccess } from '@/lib/haptics'
import { Colors, FontFamily } from '@/constants'
import ApiService, { type EventAttendee } from '@/api/apiService'
import { usePillStore } from '@/store/pillStore'

type ScanResult = { ok: boolean; already_checked_in?: boolean; name: string; username?: string | null; error?: string }

export default function ScannerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const insets = useSafeAreaInsets()
  const router = useRouter()

  const [permission, requestPermission] = useCameraPermissions()
  const [attendees, setAttendees] = useState<EventAttendee[]>([])
  const [loadingAttendees, setLoadingAttendees] = useState(true)
  const [query, setQuery] = useState('')
  const [scanResult, setScanResult] = useState<ScanResult | null>(null)
  const [scanning, setScanning] = useState(false)
  const [checkingIn, setCheckingIn] = useState<string | null>(null)
  const scanCooldown = useRef(false)
  const showPill = usePillStore(s => s.show)

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission()
    }
  }, [])

  useEffect(() => {
    if (!id) return
    ApiService.getEventAttendees(id)
      .then(r => setAttendees(r.attendees))
      .catch(() => {})
      .finally(() => setLoadingAttendees(false))
  }, [id])

  const [refreshing, setRefreshing] = useState(false)

  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    try {
      const r = await ApiService.getEventAttendees(id!)
      setAttendees(r.attendees)
    } catch {}
    finally { setRefreshing(false) }
  }, [id])

  const showResult = useCallback((result: ScanResult) => {
    setScanResult(result)
    setTimeout(() => setScanResult(null), 2500)
  }, [])

  const handleBarcodeScanned = useCallback(async ({ data }: { data: string }) => {
    if (scanCooldown.current || scanning) return
    scanCooldown.current = true
    setScanning(true)
    try {
      const res = await ApiService.checkinAttendee(id!, data, 'qr_scan')
      showResult(res)
      if (res.already_checked_in) {
        showPill(`${res.name} is already checked in`, 'default')
      } else {
        setAttendees(prev =>
          prev.map(a =>
            a.ticket_token === data
              ? { ...a, checked_in_at: new Date().toISOString() }
              : a,
          ),
        )
      }
    } catch (e: any) {
      const msg = e?.detail || e?.message || 'Invalid ticket'
      showResult({ ok: false, name: '', already_checked_in: false, error: msg })
      showPill(msg, 'error')
    } finally {
      setScanning(false)
      setTimeout(() => { scanCooldown.current = false }, 3000)
    }
  }, [id, scanning])

  const handleManualCheckin = async (attendee: EventAttendee) => {
    if (checkingIn || !attendee.ticket_token) return
    setCheckingIn(attendee.id)
    try {
      const res = await ApiService.checkinAttendee(id!, attendee.ticket_token, 'manual_host')
      showResult(res)
      if (res.already_checked_in) {
        showPill(`${res.name} is already checked in`, 'default')
      } else {
        setAttendees(prev => prev.map(a =>
          a.id === attendee.id ? { ...a, checked_in_at: new Date().toISOString() } : a
        ))
        showPill(`Manually checked in ${res.name} — this is logged`, 'default')
      }
    } catch (e: any) {
      const msg = e?.detail || e?.message || "Check-in didn't work"
      showPill(msg, 'error')
    } finally {
      setCheckingIn(null)
    }
  }

  const filtered = attendees.filter(a => {
    const q = query.toLowerCase()
    return (
      a.name?.toLowerCase().includes(q) ||
      a.username?.toLowerCase().includes(q) ||
      a.city?.toLowerCase().includes(q)
    )
  })

  const checkedInCount = attendees.filter(a => !!a.checked_in_at).length

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={s.header}>
        <Pressable style={s.headerBtn} onPress={() => router.back()}>
          <ArrowLeft size={20} color={Colors.inkPrimary} />
        </Pressable>
        <Text style={s.headerTitle}>Check-in Scanner</Text>
        <View style={s.checkedBadge}>
          <CheckCircle size={14} color={Colors.accentGreen} />
          <Text style={s.checkedBadgeText}>{checkedInCount}</Text>
        </View>
      </View>

      {/* Camera section */}
      <View style={s.cameraSection}>
        {permission?.granted ? (
          <CameraView
            style={s.camera}
            facing="back"
            barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
            onBarcodeScanned={handleBarcodeScanned}
          >
            {/* Scan frame overlay */}
            <View style={s.scanFrame}>
              <View style={[s.corner, s.tl]} />
              <View style={[s.corner, s.tr]} />
              <View style={[s.corner, s.bl]} />
              <View style={[s.corner, s.br]} />
            </View>
            <Text style={s.scanHint}>Align QR code to scan</Text>

            {/* Scan result overlay */}
            {scanResult && (
              <Animated.View
                entering={FadeIn.duration(200)}
                exiting={FadeOut.duration(200)}
                style={[
                  s.resultBanner,
                  scanResult.already_checked_in
                    ? s.resultWarning
                    : s.resultSuccess,
                ]}
              >
                {scanResult.already_checked_in ? (
                  <Text style={s.resultText}>⚠️ {scanResult.name} already checked in</Text>
                ) : scanResult.ok ? (
                  <Text style={s.resultText}>✓ {scanResult.name} checked in!</Text>
                ) : (
                  <Text style={s.resultText}>❌ {scanResult.error ?? 'Invalid ticket'}</Text>
                )}
              </Animated.View>
            )}

            {scanning && (
              <View style={s.scanningOverlay}>
                <ActivityIndicator color="#fff" />
              </View>
            )}
          </CameraView>
        ) : (
          <View style={[s.camera, s.noPermission]}>
            <QrCode size={40} color={Colors.inkDisabled} />
            <Text style={s.noPermText}>Camera access needed to scan QR codes</Text>
            <Pressable style={s.permBtn} onPress={() => { hTap(); requestPermission() }}>
              <Text style={s.permBtnText}>Grant Permission</Text>
            </Pressable>
          </View>
        )}
      </View>

      {/* Manual list divider */}
      <View style={s.dividerRow}>
        <View style={s.dividerLine} />
        <Text style={s.dividerLabel}>or check in manually</Text>
        <View style={s.dividerLine} />
      </View>

      {/* Search bar */}
      <View style={s.searchBar}>
        <Search size={16} color={Colors.inkDisabled} />
        <TextInput
          style={s.searchInput}
          placeholder="Search attendees..."
          placeholderTextColor={Colors.inkDisabled}
          value={query}
          onChangeText={setQuery}
        />
      </View>

      {/* Attendee list */}
      {loadingAttendees ? (
        <ActivityIndicator style={{ marginTop: 16 }} color={Colors.brandOrange} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={a => a.id}
          contentContainerStyle={s.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Colors.brandOrange} colors={[Colors.brandOrange]} />}
          ListEmptyComponent={
            <View style={s.emptyState}>
              <Users size={36} color={Colors.inkDisabled} />
              <Text style={s.emptyText}>No attendees yet</Text>
            </View>
          }
          renderItem={({ item }) => {
            const checkedIn = !!item.checked_in_at
            return (
              <View style={[s.row, checkedIn && s.rowChecked]}>
                <View style={s.rowAvatar}>
                  {item.avatar ? (
                    <Image source={{ uri: item.avatar }} style={s.avatarImg} contentFit="cover" />
                  ) : (
                    <Text style={s.avatarFallback}>{item.name?.[0] ?? '?'}</Text>
                  )}
                </View>
                <View style={s.rowInfo}>
                  <Text style={[s.rowName, checkedIn && s.rowNameChecked]}>
                    {item.name ?? 'Unknown'}
                  </Text>
                  <Text style={s.rowSub}>
                    {item.username ? `@${item.username}` : (item.city ?? '')}
                  </Text>
                </View>
                {checkedIn ? (
                  <View style={s.checkedInTag}>
                    <CheckCircle size={14} color={Colors.accentGreen} />
                    <Text style={s.checkedInText}>In</Text>
                  </View>
                ) : (
                  <Pressable
                    style={s.checkinBtn}
                    onPress={() => { hSuccess(); handleManualCheckin(item) }}
                    disabled={!!checkingIn}
                  >
                    {checkingIn === item.id ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <>
                        <UserCheck size={14} color="#fff" />
                        <Text style={s.checkinBtnText}>Check In</Text>
                      </>
                    )}
                  </Pressable>
                )}
              </View>
            )
          }}
        />
      )}
    </View>
  )
}

const CORNER_SIZE = 22
const CORNER_BORDER = 3

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: Colors.divider,
  },
  headerBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontFamily: FontFamily.headingBold, fontSize: 17, color: Colors.inkPrimary },
  checkedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(0,196,140,0.12)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  checkedBadgeText: { fontFamily: FontFamily.bodyMedium, fontSize: 13, color: Colors.accentGreen },

  cameraSection: { height: 260 },
  camera: { flex: 1 },
  noPermission: { alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.elevated, gap: 12 },
  noPermText: { fontFamily: FontFamily.bodyRegular, fontSize: 14, color: Colors.inkSecondary, textAlign: 'center', paddingHorizontal: 32 },
  permBtn: { backgroundColor: Colors.brandOrange, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
  permBtnText: { color: '#fff', fontFamily: FontFamily.bodySemiBold, fontSize: 14 },

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
    alignItems: 'center',
  },
  resultSuccess: { backgroundColor: 'rgba(0,196,140,0.9)' },
  resultWarning: { backgroundColor: 'rgba(255,107,53,0.9)' },
  resultText: { color: '#fff', fontFamily: FontFamily.bodyMedium, fontSize: 14 },
  scanningOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  dividerRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 10, gap: 10 },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.divider },
  dividerLabel: { fontFamily: FontFamily.bodyRegular, fontSize: 12, color: Colors.inkDisabled },

  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 16, marginBottom: 8,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1, borderColor: Colors.divider,
    paddingHorizontal: 12, gap: 8,
  },
  searchInput: { flex: 1, height: 40, color: Colors.inkPrimary, fontFamily: FontFamily.bodyRegular, fontSize: 14 },

  listContent: { paddingHorizontal: 16, paddingBottom: 20 },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingTop: 32, gap: 10 },
  emptyText: { color: Colors.inkDisabled, fontFamily: FontFamily.bodyRegular, fontSize: 14 },

  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: Colors.divider,
  },
  rowChecked: { opacity: 0.55 },
  rowAvatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.elevated,
    overflow: 'hidden', alignItems: 'center', justifyContent: 'center',
  },
  avatarImg: { width: '100%', height: '100%' },
  avatarFallback: { color: Colors.inkPrimary, fontFamily: FontFamily.headingBold, fontSize: 16 },
  rowInfo: { flex: 1 },
  rowName: { fontFamily: FontFamily.bodyMedium, fontSize: 14, color: Colors.inkPrimary },
  rowNameChecked: { textDecorationLine: 'line-through' },
  rowSub: { fontFamily: FontFamily.bodyRegular, fontSize: 12, color: Colors.inkSecondary },
  checkedInTag: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(0,196,140,0.12)', borderRadius: 20, paddingHorizontal: 8, paddingVertical: 4 },
  checkedInText: { fontFamily: FontFamily.bodyMedium, fontSize: 12, color: Colors.accentGreen },
  checkinBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.brandOrange,
    paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 10,
  },
  checkinBtnText: { color: '#fff', fontFamily: FontFamily.bodyMedium, fontSize: 12 },
})
