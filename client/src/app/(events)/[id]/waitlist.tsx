import React, { useCallback, useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { Image } from 'expo-image'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { ArrowLeft, Users } from 'lucide-react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Colors, FontFamily } from '@/constants'
import { BrandedLoader } from '@/components/ui'
import ApiService, { type WaitlistEntry } from '@/api/apiService'
import { usePillStore } from '@/store/pillStore'

function fmtCountdown(expiresAt: string) {
  const s = Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  return h > 0 ? `${h}h ${m}m left` : `${m}m left`
}

function fmtJoinedAt(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

export default function ManageWaitlistScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const showPill = usePillStore(s => s.show)

  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [admitting, setAdmitting] = useState(false)

  const load = useCallback(async () => {
    if (!id) return
    try {
      const res = await ApiService.getEventWaitlist(id)
      setWaitlist(res.waitlist)
    } catch {
      showPill("Couldn't load waitlist", 'error')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { load() }, [load])

  const handleAdmit = async () => {
    if (!id || admitting) return
    setAdmitting(true)
    try {
      const res = await ApiService.admitFromWaitlist(id)
      if (res.admitted) {
        showPill(`${res.admitted.name ?? 'User'} has been offered a spot`, 'default')
        load()
      } else {
        showPill('Waitlist is empty', 'default')
      }
    } catch (e: any) {
      showPill(e?.message ?? "Couldn't admit from waitlist", 'error')
    } finally {
      setAdmitting(false)
    }
  }

  const pending = waitlist.filter(w => !w.offer_expires_at)
  const offered = waitlist.filter(w => w.offer_expires_at)

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <View style={s.header}>
        <Pressable style={s.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={20} color={Colors.inkPrimary} />
        </Pressable>
        <Text style={s.headerTitle}>Manage Waitlist</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={s.center}>
          <BrandedLoader />
        </View>
      ) : waitlist.length === 0 ? (
        <View style={s.center}>
          <Users size={48} color={Colors.inkDisabled} strokeWidth={1.2} />
          <Text style={s.emptyTitle}>Waitlist is empty</Text>
          <Text style={s.emptyBody}>No one is currently waiting for a spot.</Text>
        </View>
      ) : (
        <>
          <Pressable style={s.admitBtn} onPress={handleAdmit} disabled={admitting || pending.length === 0}>
            <LinearGradient
              colors={pending.length > 0 ? ['#FF6B35', '#FF3864'] : ['#333', '#333']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={s.admitGradient}
            >
              {admitting
                ? <ActivityIndicator color="#fff" />
                : <Text style={s.admitText}>Admit Next ({pending.length} waiting)</Text>}
            </LinearGradient>
          </Pressable>

          <ScrollView
            style={s.scroll}
            contentContainerStyle={[s.scrollContent, { paddingBottom: insets.bottom + 24 }]}
            showsVerticalScrollIndicator={false}
          >
            {offered.length > 0 && (
              <>
                <Text style={s.sectionLabel}>Spot Offered</Text>
                {offered.map(entry => (
                  <WaitlistRow key={entry.id} entry={entry} isOffered />
                ))}
              </>
            )}

            {pending.length > 0 && (
              <>
                <Text style={s.sectionLabel}>Waiting ({pending.length})</Text>
                {pending.map(entry => (
                  <WaitlistRow key={entry.id} entry={entry} isOffered={false} />
                ))}
              </>
            )}
          </ScrollView>
        </>
      )}
    </View>
  )
}

function WaitlistRow({ entry, isOffered }: { entry: WaitlistEntry; isOffered: boolean }) {
  return (
    <View style={s.row}>
      <View style={s.positionBadge}>
        <Text style={s.positionText}>#{entry.position}</Text>
      </View>

      {entry.avatar ? (
        <Image source={{ uri: entry.avatar }} style={s.avatar} contentFit="cover" />
      ) : (
        <View style={[s.avatar, s.avatarFallback]}>
          <Text style={s.avatarInitial}>{(entry.name ?? '?')[0].toUpperCase()}</Text>
        </View>
      )}

      <View style={s.rowInfo}>
        <Text style={s.rowName}>{entry.name ?? 'Unknown'}</Text>
        {entry.username && <Text style={s.rowUsername}>@{entry.username}</Text>}
        {isOffered && entry.offer_expires_at ? (
          <Text style={s.offerText}>Awaiting confirmation — {fmtCountdown(entry.offer_expires_at)}</Text>
        ) : (
          <Text style={s.joinedText}>Joined {fmtJoinedAt(entry.joined_at)}</Text>
        )}
      </View>

      {isOffered && (
        <View style={s.offerBadge}>
          <Text style={s.offerBadgeText}>Offered</Text>
        </View>
      )}
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.divider,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, textAlign: 'center', fontFamily: FontFamily.headingBold, fontSize: 17, color: Colors.inkPrimary },

  admitBtn: { marginHorizontal: 20, marginTop: 16, marginBottom: 8, borderRadius: 14, overflow: 'hidden' },
  admitGradient: { paddingVertical: 14, alignItems: 'center', borderRadius: 14 },
  admitText: { color: '#fff', fontFamily: FontFamily.bodySemiBold, fontSize: 15 },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 12 },

  sectionLabel: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: 12,
    color: Colors.inkDisabled,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: 16,
    marginBottom: 8,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.divider,
    padding: 12,
    marginBottom: 10,
    gap: 10,
  },
  positionBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.elevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  positionText: { fontFamily: FontFamily.bodySemiBold, fontSize: 12, color: Colors.inkSecondary },

  avatar: { width: 44, height: 44, borderRadius: 22 },
  avatarFallback: { backgroundColor: Colors.elevated, alignItems: 'center', justifyContent: 'center' },
  avatarInitial: { fontFamily: FontFamily.headingBold, fontSize: 18, color: Colors.inkPrimary },

  rowInfo: { flex: 1 },
  rowName: { fontFamily: FontFamily.bodySemiBold, fontSize: 15, color: Colors.inkPrimary },
  rowUsername: { fontFamily: FontFamily.bodyRegular, fontSize: 12, color: Colors.inkSecondary, marginTop: 1 },
  offerText: { fontFamily: FontFamily.bodyRegular, fontSize: 12, color: '#00C896', marginTop: 3 },
  joinedText: { fontFamily: FontFamily.bodyRegular, fontSize: 12, color: Colors.inkDisabled, marginTop: 3 },

  offerBadge: {
    backgroundColor: 'rgba(0,200,150,0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#00C896',
  },
  offerBadgeText: { color: '#00C896', fontFamily: FontFamily.bodyMedium, fontSize: 11 },

  emptyTitle: { fontFamily: FontFamily.headingBold, fontSize: 20, color: Colors.inkPrimary },
  emptyBody: { fontFamily: FontFamily.bodyRegular, fontSize: 14, color: Colors.inkSecondary, textAlign: 'center' },
})
