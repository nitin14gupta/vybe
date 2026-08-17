import { memo } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { Image } from 'expo-image'
import { useRouter } from 'expo-router'
import { Colors, FontFamily, Spacing, withOpacity } from '@/constants'
import type { EventAttendee } from '@/api/apiService'

export function parseAttendeeDate(iso: string): Date {
  // PostgreSQL returns "2024-01-15 14:30:00+05:30" — normalize to ISO 8601
  return new Date(iso.replace(' ', 'T').replace(/([+-]\d{2})$/, '$1:00'))
}

export function fmtAttendeeTime(iso: string): string {
  const d = parseAttendeeDate(iso)
  if (isNaN(d.getTime())) return '--:--'
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export function attendeeTimeAgo(iso: string): string {
  const diff = Date.now() - parseAttendeeDate(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

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
    <Image
      source={{ uri: avatar }}
      style={a.img}
      contentFit="cover"
      cachePolicy="memory-disk"
      priority="low"
      transition={150}
    />
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

export const AttendeeRow = memo(function AttendeeRow({ item, position }: { item: EventAttendee; position?: number }) {
  const router = useRouter()
  const checkedIn = !!item.checked_in_at
  const isWaitlist = item.status === 'waitlist'

  return (
    <Pressable
      style={r.root}
      onPress={() => router.push(`/(profile)/${item.id}` as any)}
      android_ripple={{ color: withOpacity(Colors.inkPrimary, 0.04) }}
    >
      <Avatar name={item.name} avatar={item.avatar} checkedIn={checkedIn} />

      <View style={r.info}>
        <Text style={r.name} numberOfLines={1}>{item.name ?? 'User'}</Text>
        {checkedIn ? (
          <Text style={r.checkedInTime}>Checked in at {fmtAttendeeTime(item.checked_in_at!)}</Text>
        ) : isWaitlist ? (
          <Text style={r.sub}>Waitlist {position != null ? `#${position}` : ''}</Text>
        ) : item.username ? (
          <Text style={r.sub}>@{item.username}</Text>
        ) : item.city ? (
          <Text style={r.sub}>{item.city}</Text>
        ) : (
          <Text style={r.sub}>Joined {attendeeTimeAgo(item.joined_at)}</Text>
        )}
      </View>

      {checkedIn && (
        <View style={r.checkBadge}>
          <Text style={r.checkMark}>✓</Text>
        </View>
      )}
    </Pressable>
  )
})

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
    backgroundColor: withOpacity(Colors.brandOrange, 0.15),
    borderWidth: 1,
    borderColor: withOpacity(Colors.brandOrange, 0.35),
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkMark: { fontFamily: FontFamily.bodySemiBold, fontSize: 12, color: Colors.brandOrange },
})
