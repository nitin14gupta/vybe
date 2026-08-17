import React, { useRef } from 'react'
import { View, Text, StyleSheet, Pressable, Animated } from 'react-native'
import { Swipeable } from 'react-native-gesture-handler'
import { Image } from 'expo-image'
import { AutoSkeletonView } from 'react-native-auto-skeleton'
import { hTap, hMedium } from '@/lib/haptics'
import { Bell, UserPlus, Flame, MessageCircle, PartyPopper, ShieldCheck, Trophy, Trash2 } from 'lucide-react-native'
import type { AppNotification } from '@/api/apiService'
import { Colors, FontFamily, withOpacity } from '@/constants'
import { OutlineButton, PrimaryButton } from '@/components/ui'

// Re-export so callers don't need to import AppNotification separately
export type { AppNotification }

export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

// Same icon language as the profile screen's CTA bar (client/src/app/(profile)/[id].tsx)
// — UserPlus for Follow/Follow Back, Flame for Send Vibe, MessageCircle for Message.
const ACTION_ICON: Record<string, any> = {
  follow: UserPlus,
  send_vibe: Flame,
  message: MessageCircle,
}

const TYPE_FALLBACK: Record<string, { Icon: any; bg: string; color: string }> = {
  host_onboarding_complete: { Icon: PartyPopper, bg: withOpacity(Colors.accentGold, 0.16), color: Colors.accentGold },
  report_submitted: { Icon: ShieldCheck, bg: withOpacity(Colors.inkPrimary, 0.16), color: Colors.inkPrimary },
  host_badge_earned: { Icon: Trophy, bg: withOpacity(Colors.accentGold, 0.16), color: Colors.accentGold },
  review_milestone: { Icon: Trophy, bg: withOpacity(Colors.accentGold, 0.16), color: Colors.accentGold },
}

export const NotificationRow = React.memo(function NotificationRow({ item, onPress, onAction, onDismiss }: {
  item: AppNotification
  onPress: () => void
  onAction: (item: AppNotification) => void
  onDismiss: () => void
}) {
  const unread = !item.read_at
  const ActionIcon = item.action ? ACTION_ICON[item.action] : null
  const isPrimary = item.action === 'send_vibe' || item.action === 'message'
  const fallback = TYPE_FALLBACK[item.type]
  const swipeableRef = useRef<Swipeable>(null)

  // Direct swipe, no reveal-then-tap step — swiping past the threshold
  // dismisses immediately (onSwipeableOpen), same gesture as the action.
  const renderRightActions = (
    _progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>,
  ) => {
    const scale = dragX.interpolate({ inputRange: [-80, 0], outputRange: [1, 0.5], extrapolate: 'clamp' })
    return (
      <View style={s.dismissAction}>
        <Animated.View style={{ transform: [{ scale }] }}>
          <Trash2 size={20} color={Colors.inkSecondary} strokeWidth={2} />
        </Animated.View>
      </View>
    )
  }

  return (
    <Swipeable
      ref={swipeableRef}
      renderRightActions={renderRightActions}
      overshootRight={false}
      rightThreshold={40}
      onSwipeableOpen={() => { hMedium(); onDismiss() }}
    >
    <View style={s.row}>
      <Pressable style={s.rowMain} onPress={() => { hTap(); onPress() }}>
        <View style={s.avatarWrap}>
          {item.cover_photo ? (
            <Image
              source={{ uri: item.cover_photo }}
              style={s.coverThumb}
              contentFit="cover"
              cachePolicy="memory-disk"
              priority="low"
              transition={150}
            />
          ) : item.actor_avatar ? (
            <Image
              source={{ uri: item.actor_avatar }}
              style={s.avatar}
              cachePolicy="memory-disk"
              priority="low"
              transition={150}
            />
          ) : fallback ? (
            <View style={[s.avatar, s.avatarFallback, { backgroundColor: fallback.bg }]}>
              <fallback.Icon size={18} color={fallback.color} strokeWidth={1.75} />
            </View>
          ) : (
            <View style={[s.avatar, s.avatarFallback]}>
              <Bell size={18} color={Colors.inkDisabled} strokeWidth={1.5} />
            </View>
          )}
          {unread && <View style={s.unreadDot} />}
        </View>
        <View style={s.textBlock}>
          <Text style={[s.title, unread && s.titleUnread]}>{item.title}</Text>
          {item.body ? <Text style={s.body}>{item.body}</Text> : null}
          <Text style={s.time}>{timeAgo(item.created_at)}</Text>
        </View>
      </Pressable>

      {item.action && item.action_label && ActionIcon ? (
        <View style={s.actionBtnWrap}>
          {isPrimary ? (
            <PrimaryButton
              label={item.action_label}
              onPress={() => onAction(item)}
              icon={<ActionIcon size={14} color={Colors.background} strokeWidth={2} />}
              size="small"
            />
          ) : (
            <OutlineButton
              label={item.action_label}
              onPress={() => onAction(item)}
              icon={<ActionIcon size={14} color={Colors.inkPrimary} strokeWidth={2} />}
              size="small"
            />
          )}
        </View>
      ) : null}
    </View>
    </Swipeable>
  )
})

export function NotificationRowSkeleton() {
  return (
    <AutoSkeletonView isLoading animationType="gradient" defaultRadius={7} gradientColors={[Colors.skeletonBase, Colors.skeletonHighlight]}>
      {Array.from({ length: 6 }).map((_, i) => (
        <View key={i} style={s.skRow}>
          <View style={s.skAvatar} />
          <View style={s.skTextBlock}>
            <View style={s.skLineTitle} />
            <View style={s.skLineBody} />
            <View style={s.skLineTime} />
          </View>
          {i % 2 === 0 && <View style={s.skActionBtn} />}
        </View>
      ))}
    </AutoSkeletonView>
  )
}

const s = StyleSheet.create({
  dismissAction: {
    width: 80,
    backgroundColor: Colors.elevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.background,
    paddingHorizontal: 20, paddingVertical: 14, gap: 10,
  },
  rowMain: {
    flex: 1,
    flexDirection: 'row', alignItems: 'flex-start',
    gap: 14,
  },
  avatarWrap: { position: 'relative' },
  avatar: { width: 44, height: 44, borderRadius: 22 },
  // True 16:9 event cover thumbnail — a circular crop mangles a landscape
  // photo, so these get a rounded-rect thumbnail instead of the avatar shape.
  coverThumb: { width: 64, height: 36, borderRadius: 8 },
  avatarFallback: {
    backgroundColor: Colors.surface,
    alignItems: 'center', justifyContent: 'center',
  },
  unreadDot: {
    position: 'absolute', top: 0, right: 0,
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: Colors.brandOrange,
    borderWidth: 2, borderColor: Colors.background,
  },
  // minWidth: 0 keeps this from growing past its share when the action button
  // sits alongside it (RN flex-row-with-Text overflow quirk).
  textBlock: { flex: 1, minWidth: 0, gap: 2 },
  title: { fontFamily: FontFamily.bodySemiBold, fontSize: 14, color: Colors.inkSecondary, lineHeight: 20 },
  titleUnread: { color: Colors.inkPrimary },
  body: { fontFamily: FontFamily.bodyRegular, fontSize: 13, color: Colors.inkSecondary, lineHeight: 18 },
  time: { fontFamily: FontFamily.bodyRegular, fontSize: 11, color: Colors.inkDisabled, marginTop: 2 },
  actionBtnWrap: {
    marginLeft: 'auto',
  },
  skRow: {
    flexDirection: 'row', alignItems: 'flex-start',
    paddingHorizontal: 20, paddingVertical: 14, gap: 14,
  },
  skTextBlock: { flex: 1, minWidth: 0, paddingTop: 2 },
  skAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.surfaceMuted },
  skLineTitle: { height: 14, width: '70%', borderRadius: 7, backgroundColor: Colors.surfaceMuted },
  skLineBody: { height: 12, width: '85%', borderRadius: 6, backgroundColor: Colors.surfaceMuted, marginTop: 6 },
  skLineTime: { height: 10, width: '25%', borderRadius: 5, backgroundColor: Colors.surfaceMuted, marginTop: 6 },
  skActionBtn: { width: 76, height: 30, borderRadius: 15, backgroundColor: Colors.surfaceMuted, marginLeft: 'auto' },
})
