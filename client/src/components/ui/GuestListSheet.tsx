import { useEffect, useRef, useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { Image } from 'expo-image'
import { router } from 'expo-router'
import { BottomSheetModal, BottomSheetView, BottomSheetFlatList, BottomSheetBackdrop } from '@gorhom/bottom-sheet'
import type { BottomSheetBackdropProps } from '@gorhom/bottom-sheet'
import { AutoSkeletonView } from 'react-native-auto-skeleton'
import { Heart, Users, X as XIcon } from 'lucide-react-native'
import { hTap, hSelection } from '@/lib/haptics'
import { Colors, FontFamily, Spacing } from '@/constants'
import ApiService, { type EventGuest } from '@/api/apiService'
import { useAuthStore } from '@/store/auth'
import { usePillStore } from '@/store/pillStore'

const SNAP_POINTS = ['74%']

interface Props {
  visible: boolean
  eventId: string
  guests: EventGuest[]
  total: number
  waitlist?: EventGuest[]
  /** Shows a shimmering placeholder grid instead of the real/empty state
   * while the parent's guest fetch is still in flight — the sheet itself
   * still opens immediately (see `useEffect(() => sheetRef.current?.present())`
   * below), this only swaps what's inside it. */
  loading?: boolean
  onClose: () => void
}

// Flat shapes only, no background/shadow on any wrapping view — AutoSkeletonView
// shimmers every child with its own background color, so a solid-colored
// wrapper competes with the tiles underneath and just reads as a static block
// (see EventCard.tsx's EventCardSkeleton for the same fix, in more detail).
function GuestTileSkeleton() {
  return (
    <View style={t.root}>
      <View style={[t.avatar, sk.circle]} />
      <View style={sk.line} />
    </View>
  )
}

function GuestListSkeleton() {
  return (
    <BottomSheetView style={s.container}>
      <View style={s.header}>
        <View>
          <View style={[sk.title, { marginBottom: 6 }]} />
          <View style={sk.subtitle} />
        </View>
      </View>
      <AutoSkeletonView isLoading animationType="gradient" defaultRadius={8} gradientColors={['#2a2a2a', '#3a3a3a']}>
        <View style={s.grid}>
          {Array.from({ length: 12 }).map((_, i) => (
            <GuestTileSkeleton key={i} />
          ))}
        </View>
      </AutoSkeletonView>
    </BottomSheetView>
  )
}

const sk = StyleSheet.create({
  circle: { backgroundColor: '#2a2a2a' },
  line: { width: 48, height: 10, borderRadius: 5, backgroundColor: '#2a2a2a' },
  title: { width: 130, height: 20, borderRadius: 6, backgroundColor: '#2a2a2a' },
  subtitle: { width: 70, height: 13, borderRadius: 6, backgroundColor: '#2a2a2a' },
})

function renderBackdrop(props: BottomSheetBackdropProps) {
  return (
    <BottomSheetBackdrop
      {...props}
      disappearsOnIndex={-1}
      appearsOnIndex={0}
      pressBehavior="close"
      opacity={0.6}
    />
  )
}

function GuestTile({ guest, isMe, isFollowing, onOpenProfile, onToggleFollow }: {
  guest: EventGuest
  isMe: boolean
  isFollowing: boolean
  onOpenProfile: (id: string) => void
  onToggleFollow: (guest: EventGuest) => void
}) {
  return (
    <Pressable style={t.root} onPress={() => onOpenProfile(guest.id)}>
      <View style={t.avatarWrap}>
        {guest.avatar ? (
          <Image source={{ uri: guest.avatar }} style={t.avatar} contentFit="cover" />
        ) : (
          <View style={[t.avatar, t.avatarFallback]}>
            <Text style={t.avatarInitial}>{(guest.name ?? '?').charAt(0).toUpperCase()}</Text>
          </View>
        )}
        {!isMe && (
          <Pressable
            style={t.heartBtn}
            hitSlop={8}
            onPress={() => onToggleFollow(guest)}
          >
            <Heart
              size={16}
              color={isFollowing ? Colors.brandCoral : '#fff'}
              fill={isFollowing ? Colors.brandCoral : 'transparent'}
              strokeWidth={2}
            />
          </Pressable>
        )}
      </View>
      <Text style={t.name} numberOfLines={1}>{isMe ? 'You' : (guest.name ?? 'Guest')}</Text>
    </Pressable>
  )
}

const t = StyleSheet.create({
  root: { width: '33.333%', alignItems: 'center', paddingVertical: 12, gap: 8 },
  avatarWrap: { width: 76, height: 76 },
  avatar: { width: 76, height: 76, borderRadius: 38 },
  avatarFallback: { backgroundColor: Colors.elevated, alignItems: 'center', justifyContent: 'center' },
  avatarInitial: { fontFamily: FontFamily.headingBold, fontSize: 26, color: Colors.inkPrimary },
  heartBtn: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: { fontFamily: FontFamily.bodyMedium, fontSize: 12, color: Colors.inkSecondary, maxWidth: 84, textAlign: 'center' },
})

function GuestListSheetCore({ eventId, guests, total, waitlist = [], loading, onClose }: Omit<Props, 'visible'>) {
  const sheetRef = useRef<BottomSheetModal>(null)
  const myId = useAuthStore(s => s.userId)
  const showPill = usePillStore(s => s.show)

  useEffect(() => { sheetRef.current?.present() }, [])

  const [followingIds, setFollowingIds] = useState<Set<string>>(
    () => new Set([...guests, ...waitlist].filter(g => g.is_following).map(g => g.id)),
  )

  const handleOpenProfile = (id: string) => {
    hTap()
    onClose()
    router.push(`/(profile)/${id}` as any)
  }

  const handleToggleFollow = (guest: EventGuest) => {
    hSelection()
    const nowFollowing = !followingIds.has(guest.id)
    setFollowingIds(prev => {
      const next = new Set(prev)
      if (nowFollowing) next.add(guest.id)
      else next.delete(guest.id)
      return next
    })
    const call = nowFollowing ? ApiService.followUser(guest.id) : ApiService.unfollowUser(guest.id)
    call.catch(() => {
      showPill(nowFollowing ? "Couldn't follow, try again" : "Couldn't unfollow, try again", 'error')
      setFollowingIds(prev => {
        const next = new Set(prev)
        if (nowFollowing) next.delete(guest.id)
        else next.add(guest.id)
        return next
      })
    })
  }

  const Header = (
    <View style={s.header}>
      <View>
        <Text style={s.title}>Guest List</Text>
        <Text style={s.subtitle}>{total} going</Text>
      </View>
      <Pressable style={s.closeBtn} onPress={() => { hTap(); onClose() }} hitSlop={8}>
        <XIcon size={18} color={Colors.inkSecondary} strokeWidth={2} />
      </Pressable>
    </View>
  )

  const Footer = waitlist.length > 0 ? (
    <View style={s.waitlistSection}>
      <View style={s.waitlistDivider} />
      <Text style={s.waitlistTitle}>Waitlist · {waitlist.length}</Text>
      <View style={s.waitlistGrid}>
        {waitlist.map(g => (
          <GuestTile
            key={g.id}
            guest={g}
            isMe={g.id === myId}
            isFollowing={followingIds.has(g.id)}
            onOpenProfile={handleOpenProfile}
            onToggleFollow={handleToggleFollow}
          />
        ))}
      </View>
    </View>
  ) : null

  return (
    <BottomSheetModal
      ref={sheetRef}
      snapPoints={SNAP_POINTS}
      enableDynamicSizing={false}
      enablePanDownToClose
      topInset={0}
      onDismiss={onClose}
      backdropComponent={renderBackdrop}
      backgroundStyle={s.bg}
      handleIndicatorStyle={s.handleIndicator}
    >
      {loading ? (
        <GuestListSkeleton />
      ) : guests.length === 0 ? (
        <BottomSheetView style={s.container}>
          {Header}
          <View style={s.empty}>
            <Users size={40} color={Colors.inkDisabled} strokeWidth={1.2} />
            <Text style={s.emptyText}>No one's RSVP'd yet</Text>
          </View>
          {Footer}
        </BottomSheetView>
      ) : (
        <BottomSheetFlatList
          data={guests}
          keyExtractor={g => g.id}
          numColumns={3}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={s.grid}
          ListHeaderComponent={Header}
          ListFooterComponent={Footer}
          renderItem={({ item }) => (
            <GuestTile
              guest={item}
              isMe={item.id === myId}
              isFollowing={followingIds.has(item.id)}
              onOpenProfile={handleOpenProfile}
              onToggleFollow={handleToggleFollow}
            />
          )}
        />
      )}
    </BottomSheetModal>
  )
}

export function GuestListSheet({ visible, eventId, guests, total, waitlist, loading, onClose }: Props) {
  if (!visible) return null
  return <GuestListSheetCore eventId={eventId} guests={guests} total={total} waitlist={waitlist} loading={loading} onClose={onClose} />
}

const s = StyleSheet.create({
  bg: { backgroundColor: Colors.surface },
  handleIndicator: { backgroundColor: 'rgba(255,255,255,0.2)' },
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.screenPadding,
    paddingTop: 20,
    paddingBottom: 16,
  },
  title: { fontFamily: FontFamily.headingBold, fontSize: 22, color: Colors.inkPrimary },
  subtitle: { fontFamily: FontFamily.bodyRegular, fontSize: 13, color: Colors.inkSecondary, marginTop: 2 },
  closeBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: Colors.elevated,
    alignItems: 'center', justifyContent: 'center',
  },
  grid: { paddingHorizontal: Spacing.screenPadding - 12, paddingBottom: 32 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingTop: 60 },
  emptyText: { fontFamily: FontFamily.bodyRegular, fontSize: 14, color: Colors.inkSecondary },
  waitlistSection: { paddingHorizontal: 12, marginTop: 8 },
  waitlistDivider: { height: StyleSheet.hairlineWidth, backgroundColor: Colors.divider, marginBottom: 16 },
  waitlistTitle: {
    fontFamily: FontFamily.bodySemiBold, fontSize: 13, color: Colors.inkSecondary,
    textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 4,
  },
  waitlistGrid: { flexDirection: 'row', flexWrap: 'wrap' },
})
