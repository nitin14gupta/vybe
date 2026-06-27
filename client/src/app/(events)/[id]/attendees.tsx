import { useEffect, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { Image } from 'expo-image'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ArrowLeft, Clock, Users } from 'lucide-react-native'
import { Colors, FontFamily, Spacing, Radius } from '@/constants'
import ApiService, { type EventAttendee } from '@/api/apiService'

// ── Helpers ───────────────────────────────────────────────────────────────────

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

// ── AvatarBlock ───────────────────────────────────────────────────────────────

function AvatarBlock({ name, avatar }: { name: string | null; avatar: string | null }) {
  if (avatar) return <Image source={{ uri: avatar }} style={row.avatar} contentFit="cover" />
  return (
    <View style={[row.avatar, row.avatarFallback]}>
      <Text style={row.avatarInitial}>{(name ?? '?').charAt(0).toUpperCase()}</Text>
    </View>
  )
}

// ── GoingRow ──────────────────────────────────────────────────────────────────

function GoingRow({ item }: { item: EventAttendee }) {
  const router = useRouter()
  return (
    <Pressable
      style={row.root}
      onPress={() => router.push(`/(profile)/${item.id}` as any)}
      android_ripple={{ color: 'rgba(255,255,255,0.04)' }}
    >
      <AvatarBlock name={item.name} avatar={item.avatar} />
      <View style={row.info}>
        <Text style={row.name} numberOfLines={1}>{item.name ?? 'User'}</Text>
        {item.username ? (
          <Text style={row.sub}>@{item.username}</Text>
        ) : item.city ? (
          <Text style={row.sub}>{item.city}</Text>
        ) : null}
      </View>
      <View style={row.goingDot} />
    </Pressable>
  )
}

// ── WaitlistRow ───────────────────────────────────────────────────────────────

function WaitlistRow({ item, position }: { item: EventAttendee; position: number }) {
  const router = useRouter()
  return (
    <Pressable
      style={row.root}
      onPress={() => router.push(`/(profile)/${item.id}` as any)}
      android_ripple={{ color: 'rgba(255,255,255,0.04)' }}
    >
      {/* Position badge */}
      <View style={row.posBadge}>
        <Text style={row.posNum}>#{position}</Text>
      </View>

      <AvatarBlock name={item.name} avatar={item.avatar} />

      <View style={row.info}>
        <Text style={row.name} numberOfLines={1}>{item.name ?? 'User'}</Text>
        <View style={row.subRow}>
          <Clock size={11} color={Colors.inkDisabled} strokeWidth={1.8} />
          <Text style={row.sub}>Joined {timeAgo(item.joined_at)}</Text>
        </View>
      </View>
    </Pressable>
  )
}

const row = StyleSheet.create({
  root: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.screenPadding,
    paddingVertical: 14,
    gap: 14,
  },
  avatar: { width: 46, height: 46, borderRadius: 23 },
  avatarFallback: {
    backgroundColor: Colors.elevated,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.divider,
  },
  avatarInitial: {
    fontFamily: FontFamily.headingBold,
    fontSize: 18,
    color: Colors.inkPrimary,
  },
  info: { flex: 1, gap: 3 },
  name: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 15,
    color: Colors.inkPrimary,
  },
  sub: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 12,
    color: Colors.inkSecondary,
  },
  subRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  // Going tab — subtle green dot
  goingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.accentGreen,
    opacity: 0.85,
  },
  // Waitlist tab — position badge
  posBadge: {
    width: 32,
    height: 32,
    borderRadius: Radius.sm,
    backgroundColor: 'rgba(255,107,53,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,107,53,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  posNum: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 11,
    color: Colors.brandOrange,
    letterSpacing: 0.3,
  },
})

// ── Tab bar ───────────────────────────────────────────────────────────────────

type Tab = 'going' | 'waitlist'

function TabBar({
  active,
  onChange,
}: {
  active: Tab
  onChange: (t: Tab) => void
}) {
  return (
    <View style={tabs.wrap}>
      {(['going', 'waitlist'] as Tab[]).map(t => {
        const isActive = active === t
        return (
          <Pressable
            key={t}
            style={[tabs.tab, isActive && tabs.tabActive]}
            onPress={() => onChange(t)}
            android_ripple={null}
          >
            <Text style={[tabs.text, isActive && tabs.textActive]}>
              {t === 'going' ? 'Going' : 'Waitlist'}
            </Text>
          </Pressable>
        )
      })}
    </View>
  )
}

const tabs = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: Colors.inkPrimary },
  text: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 14,
    color: Colors.inkSecondary,
    letterSpacing: 0.1,
  },
  textActive: { color: Colors.inkPrimary },
})

// ── Screen ────────────────────────────────────────────────────────────────────

export default function AttendeesScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const insets = useSafeAreaInsets()
  const router = useRouter()

  const [activeTab, setActiveTab] = useState<Tab>('going')
  const [all, setAll] = useState<EventAttendee[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    ApiService.getEventAttendees(id)
      .then(r => setAll(r.attendees))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [id])

  const going = useMemo(
    () => all.filter(a => a.status === 'going'),
    [all],
  )

  // Waitlist sorted by joined_at asc → position 1, 2, 3...
  const waitlist = useMemo(
    () =>
      all
        .filter(a => a.status === 'waitlist')
        .sort((a, b) => new Date(a.joined_at).getTime() - new Date(b.joined_at).getTime()),
    [all],
  )

  const list = activeTab === 'going' ? going : waitlist

  const emptyText =
    activeTab === 'going'
      ? `No one has RSVP'd yet`
      : `No one on the waitlist`
  const emptySub =
    activeTab === 'going'
      ? 'Share the event to get people to join.'
      : 'When the event fills up, waitlisted users appear here.'

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>

      {/* Header */}
      <View style={s.header}>
        <Pressable onPress={() => router.back()} style={s.backBtn} hitSlop={8}>
          <ArrowLeft size={20} color={Colors.inkPrimary} strokeWidth={1.8} />
        </Pressable>
        <View style={s.headerCenter}>
          <Text style={s.headerTitle}>Attendees</Text>
          {!loading && (
            <Text style={s.headerSub}>{going.length} going{waitlist.length > 0 ? ` · ${waitlist.length} on waitlist` : ''}</Text>
          )}
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Tab bar */}
      <TabBar active={activeTab} onChange={setActiveTab} />

      {/* Content */}
      {loading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color={Colors.brandOrange} />
        </View>
      ) : list.length === 0 ? (
        <View style={s.center}>
          <Users size={44} color={Colors.inkDisabled} strokeWidth={1.2} />
          <Text style={s.emptyTitle}>{emptyText}</Text>
          <Text style={s.emptySub}>{emptySub}</Text>
        </View>
      ) : (
        <FlatList
          key={activeTab}
          data={list}
          keyExtractor={a => a.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
          renderItem={({ item, index }) =>
            activeTab === 'going' ? (
              <GoingRow item={item} />
            ) : (
              <WaitlistRow item={item} position={index + 1} />
            )
          }
        />
      )}
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.divider,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: {
    fontFamily: FontFamily.headingBold,
    fontSize: 17,
    color: Colors.inkPrimary,
  },
  headerSub: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 12,
    color: Colors.inkSecondary,
    marginTop: 1,
  },

  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: 40,
  },
  emptyTitle: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 16,
    color: Colors.inkPrimary,
    textAlign: 'center',
  },
  emptySub: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 13,
    color: Colors.inkSecondary,
    textAlign: 'center',
    lineHeight: 19,
  },
})
