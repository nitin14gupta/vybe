import { useEffect, useRef, useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { Image } from 'expo-image'
import { router } from 'expo-router'
import { BottomSheetModal, BottomSheetView, BottomSheetFlatList, BottomSheetBackdrop } from '@gorhom/bottom-sheet'
import type { BottomSheetBackdropProps } from '@gorhom/bottom-sheet'
import { Heart, Users, X as XIcon } from 'lucide-react-native'
import { hTap, hSelection } from '@/lib/haptics'
import { Colors, FontFamily, Spacing } from '@/constants'
import ApiService, { type EventGuest } from '@/api/apiService'
import { useAuthStore } from '@/store/auth'
import { usePillStore } from '@/store/pillStore'

const SNAP_POINTS = ['74%']

// TEMP: mock guests for UI preview only — delete MOCK_GUESTS and the
// `guests.length > 0 ? guests : MOCK_GUESTS` fallback below once approved.
const MOCK_URLS = [
  'https://images.unsplash.com/photo-1773332611476-6ec2ba68049f?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDF8MHxmZWF0dXJlZC1waG90b3MtZmVlZHwxfHx8ZW58MHx8fHx8',
  'https://plus.unsplash.com/premium_photo-1683129807314-95150b5c3fb1?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxmZWF0dXJlZC1waG90b3MtZmVlZHwyfHx8ZW58MHx8fHx8',
  'https://images.unsplash.com/photo-1774637777045-e7390fc657e8?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  'https://images.unsplash.com/photo-1765003291278-495489d2d7fe?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  'https://images.unsplash.com/photo-1774270905958-86e7eaeae23d?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxmZWF0dXJlZC1waG90b3MtZmVlZHwxNHx8fGVufDB8fHx8fA%3D%3D',
  'https://images.unsplash.com/photo-1774538537377-9646fa0ec25a?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxmZWF0dXJlZC1waG90b3MtZmVlZHwxOXx8fGVufDB8fHx8fA%3D%3D',
  'https://images.unsplash.com/photo-1775563623211-4ecef6718f1f?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxmZWF0dXJlZC1waG90b3MtZmVlZHwyNXx8fGVufDB8fHx8fA%3D%3D',
  'https://images.unsplash.com/photo-1774966961772-c73ad3a60b10?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxmZWF0dXJlZC1waG90b3MtZmVlZHwzMnx8fGVufDB8fHx8fA%3D%3D',
  'https://images.unsplash.com/photo-1775385015053-3e4aad001e22?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxmZWF0dXJlZC1waG90b3MtZmVlZHwzOXx8fGVufDB8fHx8fA%3D%3D',
  'https://images.unsplash.com/photo-1775533222841-095c4e19ceaf?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxmZWF0dXJlZC1waG90b3MtZmVlZHw0MXx8fGVufDB8fHx8fA%3D%3D',
  'https://images.unsplash.com/photo-1775419044790-98d1f54699db?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxmZWF0dXJlZC1waG90b3MtZmVlZHw0MHx8fGVufDB8fHx8fA%3D%3D',
  'https://images.unsplash.com/photo-1775348437069-0f2d58a180ee?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxmZWF0dXJlZC1waG90b3MtZmVlZHw0NXx8fGVufDB8fHx8fA%3D%3D',
  'https://images.unsplash.com/photo-1775214593108-5d577e88d219?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxmZWF0dXJlZC1waG90b3MtZmVlZHw0Nnx8fGVufDB8fHx8fA%3D%3D',
  'https://images.unsplash.com/photo-1774444487684-a796af0c2841?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxmZWF0dXJlZC1waG90b3MtZmVlZHw0OHx8fGVufDB8fHx8fA%3D%3D',
  'https://images.unsplash.com/photo-1774725801222-51a94a1f4719?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxmZWF0dXJlZC1waG90b3MtZmVlZHw1MXx8fGVufDB8fHx8fA%3D%3D',
  'https://images.unsplash.com/photo-1774637184972-6a12518f12f0?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxmZWF0dXJlZC1waG90b3MtZmVlZHw1M3x8fGVufDB8fHx8fA%3D%3D',
  'https://images.unsplash.com/photo-1775544265981-9db0ea58687f?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxmZWF0dXJlZC1waG90b3MtZmVlZHw1OXx8fGVufDB8fHx8fA%3D%3D',
  'https://images.unsplash.com/photo-1775315721849-69c9e9926c85?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxmZWF0dXJlZC1waG90b3MtZmVlZHw1OHx8fGVufDB8fHx8fA%3D%3D',
  'https://images.unsplash.com/photo-1775315815915-43af175d4c95?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxmZWF0dXJlZC1waG90b3MtZmVlZHw2Mnx8fGVufDB8fHx8fA%3D%3D',
  'https://images.unsplash.com/photo-1775019039895-f04070266f06?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxmZWF0dXJlZC1waG90b3MtZmVlZHw2OHx8fGVufDB8fHx8fA%3D%3D',
  'https://images.unsplash.com/photo-1775405325864-2981439bfe6a?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxmZWF0dXJlZC1waG90b3MtZmVlZHw4MXx8fGVufDB8fHx8fA%3D%3D',
  'https://images.unsplash.com/photo-1775138386053-5766c8c10e85?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxmZWF0dXJlZC1waG90b3MtZmVlZHw5MHx8fGVufDB8fHx8fA%3D%3D',
  'https://images.unsplash.com/photo-1775152307243-40212d5068a6?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxmZWF0dXJlZC1waG90b3MtZmVlZHw5NXx8fGVufDB8fHx8fA%3D%3D',
  'https://images.unsplash.com/photo-1774847895606-eee7989fb36c?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxmZWF0dXJlZC1waG90b3MtZmVlZHwxMDJ8fHxlbnwwfHx8fHw%3D',
  'https://images.unsplash.com/photo-1775247022803-fd16733e175c?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxmZWF0dXJlZC1waG90b3MtZmVlZHwxMDV8fHxlbnwwfHx8fHw%3D',
  'https://images.unsplash.com/photo-1774979517558-a9dfa07cf8d0?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxmZWF0dXJlZC1waG90b3MtZmVlZHwxMjJ8fHxlbnwwfHx8fHw%3D',
  'https://images.unsplash.com/photo-1775126964224-99c03c0e439c?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxmZWF0dXJlZC1waG90b3MtZmVlZHwxMzF8fHxlbnwwfHx8fHw%3D',
  'https://images.unsplash.com/photo-1775126964424-913480443772?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxmZWF0dXJlZC1waG90b3MtZmVlZHwxMzJ8fHxlbnwwfHx8fHw%3D',
  'https://images.unsplash.com/photo-1775251801951-ccb61c5bb914?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxmZWF0dXJlZC1waG90b3MtZmVlZHwxMzR8fHxlbnwwfHx8fHw%3D',
  'https://images.unsplash.com/photo-1774790528338-6db76fd93067?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  'https://images.unsplash.com/photo-1774991061995-9bef4c333de4?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxmZWF0dXJlZC1waG90b3MtZmVlZHwxNDN8fHxlbnwwfHx8fHw%3D',
  'https://plus.unsplash.com/premium_photo-1683817397956-b46614758fb8?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxmZWF0dXJlZC1waG90b3MtZmVlZHwxNTB8fHxlbnwwfHx8fHw%3D',
  'https://images.unsplash.com/photo-1774575902298-564503f168a7?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  'https://images.unsplash.com/photo-1775119223367-03c12e0cbf27?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxmZWF0dXJlZC1waG90b3MtZmVlZHwxNTJ8fHxlbnwwfHx8fHw%3D',
  'https://images.unsplash.com/photo-1775151462239-03839a32c4c5?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxmZWF0dXJlZC1waG90b3MtZmVlZHwxNTh8fHxlbnwwfHx8fHw%3D',
  'https://images.unsplash.com/photo-1774989251155-0aa32bee5c6c?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  'https://images.unsplash.com/photo-1773332598451-8a0a59941912?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDF8MHxmZWF0dXJlZC1waG90b3MtZmVlZHwxNjF8fHxlbnwwfHx8fHw%3D',
  'https://images.unsplash.com/photo-1775133117908-99043faa40b0?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxmZWF0dXJlZC1waG90b3MtZmVlZHwxNjB8fHxlbnwwfHx8fHw%3D',
  'https://images.unsplash.com/photo-1774847897731-ad86ff58390b?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxmZWF0dXJlZC1waG90b3MtZmVlZHwxNjZ8fHxlbnwwfHx8fHw%3D',
  'https://images.unsplash.com/photo-1774542414991-eaa61c677c24?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxmZWF0dXJlZC1waG90b3MtZmVlZHwxNzR8fHxlbnwwfHx8fHw%3D',
  'https://images.unsplash.com/photo-1773332598289-ed0444ad1d6f?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDF8MHxmZWF0dXJlZC1waG90b3MtZmVlZHwxNzV8fHxlbnwwfHx8fHw%3D',
  'https://images.unsplash.com/photo-1774696788918-fabf0c18e126?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxmZWF0dXJlZC1waG90b3MtZmVlZHwxNzd8fHxlbnwwfHx8fHw%3D',
  'https://images.unsplash.com/photo-1774876189300-5ec712826e33?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxmZWF0dXJlZC1waG90b3MtZmVlZHwxNzl8fHxlbnwwfHx8fHw%3D',
  'https://images.unsplash.com/photo-1774660980724-dc0fb4f5dbb6?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxmZWF0dXJlZC1waG90b3MtZmVlZHwxODB8fHxlbnwwfHx8fHw%3D',
  'https://images.unsplash.com/photo-1775013394343-fdf658742ed0?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxmZWF0dXJlZC1waG90b3MtZmVlZHwxODV8fHxlbnwwfHx8fHw%3D',
  'https://images.unsplash.com/photo-1773318427480-1058e1059f99?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxmZWF0dXJlZC1waG90b3MtZmVlZHwyMTh8fHxlbnwwfHx8fHw%3D',
  'https://images.unsplash.com/photo-1774333406492-2806c117fe59?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxmZWF0dXJlZC1waG90b3MtZmVlZHwyMzF8fHxlbnwwfHx8fHw%3D',
  'https://plus.unsplash.com/premium_photo-1665772800736-e655b2fec2e7?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxmZWF0dXJlZC1waG90b3MtZmVlZHwyMzB8fHxlbnwwfHx8fHw%3D',
  'https://images.unsplash.com/photo-1774331510646-a1781c4a9713?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxmZWF0dXJlZC1waG90b3MtZmVlZHwyMjl8fHxlbnwwfHx8fHw%3D',
  'https://images.unsplash.com/photo-1757549248794-2b2b9db92439?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
]

const MOCK_NAMES = [
  'Ava', 'Liam', 'Zoe', 'Noah', 'Mia', 'Ethan', 'Isla', 'Leo', 'Ruby', 'Kai',
  'Nora', 'Finn', 'Luna', 'Milo', 'Elle', 'Theo', 'Sadie', 'Jax', 'Ivy', 'Rex',
  'Cleo', 'Wyatt', 'Lola', 'Beau', 'Nia', 'Axel', 'Vera', 'Remy', 'Jade', 'Cruz',
  'Sky', 'Rio', 'Pia', 'Zane', 'Mira', 'Dane', 'Lux', 'Onyx', 'Wren', 'Blaze',
  'Coco', 'Neo', 'Fable', 'Sage', 'Orion', 'Star', 'Ash', 'Fox', 'Indigo', 'River',
]

const MOCK_GUESTS: EventGuest[] = MOCK_URLS.slice(0, 50).map((url, i) => ({
  id: `mock-${i}`,
  name: MOCK_NAMES[i] ?? `Guest ${i + 1}`,
  username: null,
  avatar: url,
  is_following: false,
}))

interface Props {
  visible: boolean
  eventId: string
  guests: EventGuest[]
  total: number
  waitlist?: EventGuest[]
  onClose: () => void
}

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

function GuestListSheetCore({ eventId, guests, total, waitlist = [], onClose }: Omit<Props, 'visible'>) {
  const sheetRef = useRef<BottomSheetModal>(null)
  const myId = useAuthStore(s => s.userId)
  const showPill = usePillStore(s => s.show)

  useEffect(() => { sheetRef.current?.present() }, [])

  // TEMP: always top up with mock guests until there are 10+ real ones — see MOCK_GUESTS above.
  const displayGuests = guests.length >= 10 ? guests : [...guests, ...MOCK_GUESTS]
  const displayTotal = guests.length >= 10 ? total : displayGuests.length

  const [followingIds, setFollowingIds] = useState<Set<string>>(
    () => new Set([...displayGuests, ...waitlist].filter(g => g.is_following).map(g => g.id)),
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
        <Text style={s.subtitle}>{displayTotal} going</Text>
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
      {displayGuests.length === 0 ? (
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
          data={displayGuests}
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

export function GuestListSheet({ visible, eventId, guests, total, waitlist, onClose }: Props) {
  if (!visible) return null
  return <GuestListSheetCore eventId={eventId} guests={guests} total={total} waitlist={waitlist} onClose={onClose} />
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
