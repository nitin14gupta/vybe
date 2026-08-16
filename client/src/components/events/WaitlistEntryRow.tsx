import { memo } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { Image } from 'expo-image'
import { Colors, FontFamily, withOpacity } from '@/constants'
import type { WaitlistEntry } from '@/api/apiService'

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

export const WaitlistEntryRow = memo(function WaitlistEntryRow({ entry, isOffered }: { entry: WaitlistEntry; isOffered: boolean }) {
  return (
    <View style={s.row}>
      <View style={s.positionBadge}>
        <Text style={s.positionText}>#{entry.position}</Text>
      </View>

      {entry.avatar ? (
        <Image
          source={{ uri: entry.avatar }}
          style={s.avatar}
          contentFit="cover"
          cachePolicy="memory-disk"
          priority="low"
          transition={150}
        />
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
})

const s = StyleSheet.create({
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
  offerText: { fontFamily: FontFamily.bodyRegular, fontSize: 12, color: Colors.offerGreen, marginTop: 3 },
  joinedText: { fontFamily: FontFamily.bodyRegular, fontSize: 12, color: Colors.inkDisabled, marginTop: 3 },

  offerBadge: {
    backgroundColor: withOpacity(Colors.offerGreen, 0.15),
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.offerGreen,
  },
  offerBadgeText: { color: Colors.offerGreen, fontFamily: FontFamily.bodyMedium, fontSize: 11 },
})
