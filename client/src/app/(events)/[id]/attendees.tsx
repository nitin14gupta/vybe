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
import { ArrowLeft, QrCode, Users } from 'lucide-react-native'
import { Colors, FontFamily, Spacing, Radius } from '@/constants'
import ApiService, { type EventAttendee, type EventDetail } from '@/api/apiService'
import { usePillStore } from '@/store/pillStore'

// ── Helpers ───────────────────────────────────────────────────────────────────

function parseDate(iso: string): Date {
  // PostgreSQL returns "2024-01-15 14:30:00+05:30" — normalize to ISO 8601
  return new Date(iso.replace(' ', 'T').replace(/([+-]\d{2})$/, '$1:00'))
}

function fmtTime(iso: string): string {
  const d = parseDate(iso)
  if (isNaN(d.getTime())) return '--:--'
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function timeAgo(iso: string): string {
  const diff = Date.now() - parseDate(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

// ── Avatar ────────────────────────────────────────────────────────────────────

function Avatar({
  name,
  avatar,
  checkedIn,
}: {
  name: string | null
  avatar: string | null
  checkedIn: boolean
}) {
  const inner = avatar ? (
    <Image source={{ uri: avatar }} style={a.img} contentFit="cover" />
  ) : (
    <View style={[a.img, a.fallback]}>
      <Text style={a.initial}>{(name ?? '?').charAt(0).toUpperCase()}</Text>
    </View>
  )

  if (!checkedIn) return <View style={a.wrap}>{inner}</View>

  return (
    <View style={[a.wrap, a.ring]}>
      {inner}
    </View>
  )
}

const a = StyleSheet.create({
  wrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    padding: 2,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  ring: { borderColor: Colors.brandOrange },
  img: { width: 40, height: 40, borderRadius: 20 },
  fallback: {
    backgroundColor: Colors.elevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initial: { fontFamily: FontFamily.headingBold, fontSize: 17, color: Colors.inkPrimary },
})

// ── AttendeeRow ───────────────────────────────────────────────────────────────

function AttendeeRow({ item, position }: { item: EventAttendee; position?: number }) {
  const router = useRouter()
  const checkedIn = !!item.checked_in_at
  const isWaitlist = item.status === 'waitlist'

  return (
    <Pressable
      style={r.root}
      onPress={() => router.push(`/(profile)/${item.id}` as any)}
      android_ripple={{ color: 'rgba(255,255,255,0.04)' }}
    >
      <Avatar name={item.name} avatar={item.avatar} checkedIn={checkedIn} />

      <View style={r.info}>
        <Text style={r.name} numberOfLines={1}>{item.name ?? 'User'}</Text>
        {checkedIn ? (
          <Text style={r.checkedInTime}>Checked in at {fmtTime(item.checked_in_at!)}</Text>
        ) : isWaitlist ? (
          <Text style={r.sub}>Waitlist {position != null ? `#${position}` : ''}</Text>
        ) : item.username ? (
          <Text style={r.sub}>@{item.username}</Text>
        ) : item.city ? (
          <Text style={r.sub}>{item.city}</Text>
        ) : (
          <Text style={r.sub}>Joined {timeAgo(item.joined_at)}</Text>
        )}
      </View>

      {checkedIn && (
        <View style={r.checkBadge}>
          <Text style={r.checkMark}>✓</Text>
        </View>
      )}
    </Pressable>
  )
}

const r = StyleSheet.create({
  root: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.screenPadding,
    paddingVertical: 12,
    gap: 14,
  },
  info: { flex: 1, gap: 3 },
  name: { fontFamily: FontFamily.bodySemiBold, fontSize: 15, color: Colors.inkPrimary },
  sub: { fontFamily: FontFamily.bodyRegular, fontSize: 12, color: Colors.inkSecondary },
  checkedInTime: { fontFamily: FontFamily.bodyMedium, fontSize: 12, color: Colors.brandOrange },
  checkBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,107,53,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,107,53,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkMark: { fontFamily: FontFamily.bodySemiBold, fontSize: 12, color: Colors.brandOrange },
})

// ── Pills ─────────────────────────────────────────────────────────────────────

type Filter = 'all' | 'checked_in' | 'not_arrived'

const PILL_LABELS: Record<Filter, string> = {
  all: 'All',
  checked_in: 'Checked In',
  not_arrived: 'Not Arrived',
}

function Pills({
  active,
  counts,
  onChange,
}: {
  active: Filter
  counts: Record<Filter, number>
  onChange: (f: Filter) => void
}) {
  return (
    <View style={p.wrap}>
      {(Object.keys(PILL_LABELS) as Filter[]).map(f => {
        const isActive = f === active
        return (
          <Pressable
            key={f}
            onPress={() => onChange(f)}
            android_ripple={null}
            style={[p.pill, isActive && p.pillActive]}
          >
            <Text style={[p.label, isActive && p.labelActive]}>
              {PILL_LABELS[f]}
            </Text>
            <View style={[p.badge, isActive && p.badgeActive]}>
              <Text style={[p.badgeNum, isActive && p.badgeNumActive]}>
                {counts[f]}
              </Text>
            </View>
          </Pressable>
        )
      })}
    </View>
  )
}

const p = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.screenPadding,
    paddingVertical: 12,
    gap: 8,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Colors.divider,
    backgroundColor: 'transparent',
  },
  pillActive: {
    backgroundColor: Colors.brandOrange,
    borderColor: Colors.brandOrange,
  },
  label: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: 13,
    color: Colors.inkSecondary,
  },
  labelActive: { color: '#fff' },
  badge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.elevated,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeActive: { backgroundColor: 'rgba(255,255,255,0.25)' },
  badgeNum: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 11,
    color: Colors.inkSecondary,
  },
  badgeNumActive: { color: '#fff' },
})

// ── Screen ────────────────────────────────────────────────────────────────────

export default function AttendeesScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const insets = useSafeAreaInsets()
  const router = useRouter()

  const showPill = usePillStore(s => s.show)

  const [filter, setFilter] = useState<Filter>('all')
  const [all, setAll] = useState<EventAttendee[]>([])
  const [event, setEvent] = useState<EventDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    Promise.all([
      ApiService.getEventAttendees(id),
      ApiService.getEvent(id),
    ])
      .then(([attendeesRes, eventRes]) => {
        setAll(attendeesRes.attendees)
        setEvent(eventRes)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [id])

  const scannerStatus = useMemo((): 'open' | 'not_yet' | 'ended' => {
    if (!event) return 'not_yet'
    const now = Date.now()
    const start = parseDate(event.date_time).getTime()
    const end = event.end_time
      ? parseDate(event.end_time).getTime()
      : start + 6 * 60 * 60 * 1000
    const openAt = start - 3 * 60 * 60 * 1000
    if (now > end) return 'ended'
    if (now < openAt) return 'not_yet'
    return 'open'
  }, [event])

  const handleScannerPress = () => {
    if (scannerStatus === 'ended') {
      showPill('Event has ended — scanner is closed', 'error')
    } else if (scannerStatus === 'not_yet') {
      showPill('Scanner opens 3 hours before the event', 'default')
    } else {
      router.push(`/(events)/${id}/scanner` as any)
    }
  }

  const going = useMemo(() => all.filter(a => a.status === 'going'), [all])
  const checkedIn = useMemo(() => going.filter(a => !!a.checked_in_at), [going])
  const notArrived = useMemo(() => going.filter(a => !a.checked_in_at), [going])
  const waitlist = useMemo(
    () => all.filter(a => a.status === 'waitlist')
      .sort((x, y) => new Date(x.joined_at).getTime() - new Date(y.joined_at).getTime()),
    [all],
  )

  const counts: Record<Filter, number> = {
    all: going.length + waitlist.length,
    checked_in: checkedIn.length,
    not_arrived: notArrived.length,
  }

  const list = useMemo(() => {
    if (filter === 'checked_in') return checkedIn
    if (filter === 'not_arrived') return notArrived
    return [...going, ...waitlist]
  }, [filter, going, checkedIn, notArrived, waitlist])

  const emptyLabel =
    filter === 'checked_in' ? 'No one has checked in yet' :
    filter === 'not_arrived' ? 'Everyone has checked in!' :
    "No attendees yet"

  const emptySub =
    filter === 'checked_in' ? 'Check-ins show here once the scanner is used.' :
    filter === 'not_arrived' ? 'Share the event to get people to join.' :
    'Share the event to get people to join.'

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>

      {/* Header */}
      <View style={s.header}>
        <Pressable onPress={() => router.back()} style={s.iconBtn} hitSlop={8}>
          <ArrowLeft size={20} color={Colors.inkPrimary} strokeWidth={1.8} />
        </Pressable>

        <View style={s.headerCenter}>
          <Text style={s.headerTitle}>Attendees</Text>
          {!loading && (
            <Text style={s.headerSub}>
              {going.length} going
              {checkedIn.length > 0 ? ` · ${checkedIn.length} checked in` : ''}
              {waitlist.length > 0 ? ` · ${waitlist.length} waitlist` : ''}
            </Text>
          )}
        </View>

        <Pressable
          style={[s.iconBtn, scannerStatus !== 'open' && s.iconBtnDim]}
          onPress={handleScannerPress}
          hitSlop={8}
        >
          <QrCode
            size={20}
            color={scannerStatus === 'open' ? Colors.brandOrange : Colors.inkDisabled}
            strokeWidth={1.8}
          />
        </Pressable>
      </View>

      {/* Pills */}
      <Pills active={filter} counts={counts} onChange={setFilter} />

      {/* Divider */}
      <View style={s.divider} />

      {/* Content */}
      {loading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color={Colors.brandOrange} />
        </View>
      ) : list.length === 0 ? (
        <View style={s.center}>
          <Users size={44} color={Colors.inkDisabled} strokeWidth={1.2} />
          <Text style={s.emptyTitle}>{emptyLabel}</Text>
          <Text style={s.emptySub}>{emptySub}</Text>
        </View>
      ) : (
        <FlatList
          key={filter}
          data={list}
          keyExtractor={item => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
          renderItem={({ item, index }) => {
            const pos = item.status === 'waitlist' ? index - going.length + 1 : undefined
            return <AttendeeRow item={item} position={pos} />
          }}
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
    paddingVertical: 10,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  iconBtnDim: { opacity: 0.45 },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontFamily: FontFamily.headingBold, fontSize: 17, color: Colors.inkPrimary },
  headerSub: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 12,
    color: Colors.inkSecondary,
    marginTop: 1,
  },

  divider: { height: StyleSheet.hairlineWidth, backgroundColor: Colors.divider },

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
