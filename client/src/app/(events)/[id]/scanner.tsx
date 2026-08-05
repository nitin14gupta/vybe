import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native'
import { useCameraPermissions } from 'expo-camera'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { ArrowLeft, CheckCircle } from 'lucide-react-native'
import { hTap } from '@/lib/haptics'
import { Colors, FontFamily } from '@/constants'
import ApiService, { type EventAttendee } from '@/api/apiService'
import { usePillStore } from '@/store/pillStore'
import { ScannerCameraView, type ScanResult } from '@/components/events/ScannerCameraView'
import { AttendeeCheckinList } from '@/components/events/AttendeeCheckinList'

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
  const [refreshing, setRefreshing] = useState(false)
  const scanCooldown = useRef(false)
  const showPill = usePillStore(s => s.show)

  useEffect(() => {
    if (!permission?.granted && permission?.canAskAgain !== false) {
      requestPermission()
    }
  }, [])

  const loadAttendees = useCallback(() => {
    if (!id) return
    ApiService.getEventAttendees(id)
      .then(r => setAttendees(r.attendees))
      .catch((e: any) => showPill(e?.message || "Couldn't load the attendee list", 'error'))
      .finally(() => setLoadingAttendees(false))
  }, [id])

  useEffect(() => { loadAttendees() }, [loadAttendees])

  const handleRefresh = useCallback(async () => {
    if (!id) return
    setRefreshing(true)
    try {
      const r = await ApiService.getEventAttendees(id)
      setAttendees(r.attendees)
    } catch (e: any) {
      showPill(e?.message || "Couldn't refresh the attendee list", 'error')
    } finally {
      setRefreshing(false)
    }
  }, [id])

  const showResult = useCallback((result: ScanResult) => {
    setScanResult(result)
    setTimeout(() => setScanResult(null), 2500)
  }, [])

  const handleBarcodeScanned = useCallback(async ({ data }: { data: string }) => {
    if (!data || scanCooldown.current || scanning) return
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
      const msg = e?.message || 'That QR code is not a valid ticket for this event'
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
      if (res.already_checked_in) {
        showPill(`${res.name} is already checked in`, 'default')
      } else {
        setAttendees(prev => prev.map(a =>
          a.id === attendee.id ? { ...a, checked_in_at: new Date().toISOString() } : a
        ))
        showPill(`Manually checked in ${res.name} — this is logged`, 'default')
      }
    } catch (e: any) {
      showPill(e?.message || "Check-in didn't work, try again", 'error')
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

      <View style={s.cameraSection}>
        {permission?.granted === false && permission?.canAskAgain === false ? (
          <View style={[s.camera, s.noPermission]}>
            <Text style={s.noPermText}>
              Camera access is off. Enable it in Settings to scan tickets.
            </Text>
            <Pressable style={s.settingsLink} onPress={() => { hTap(); Linking.openSettings() }}>
              <Text style={s.settingsLinkText}>Open Settings</Text>
            </Pressable>
          </View>
        ) : (
          <ScannerCameraView
            granted={!!permission?.granted}
            onRequestPermission={requestPermission}
            onBarcodeScanned={handleBarcodeScanned}
            scanning={scanning}
            scanResult={scanResult}
          />
        )}
      </View>

      <AttendeeCheckinList
        query={query}
        onQueryChange={setQuery}
        loading={loadingAttendees}
        attendees={filtered}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        checkingIn={checkingIn}
        onCheckin={handleManualCheckin}
      />
    </View>
  )
}

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
  settingsLink: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, backgroundColor: Colors.brandOrange },
  settingsLinkText: { fontFamily: FontFamily.bodySemiBold, fontSize: 14, color: Colors.inkPrimary },
})
