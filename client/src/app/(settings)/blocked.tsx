import { memo, useState, useCallback } from 'react'
import {
  View, Text, StyleSheet, FlatList, Pressable,
  ActivityIndicator,
} from 'react-native'
import { Image } from 'expo-image'
import { router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { hError } from '@/lib/haptics'
import { useFocusEffect } from 'expo-router'
import { ArrowLeft, ShieldOff } from 'lucide-react-native'
import { AppHeader, APP_HEADER_BAR_HEIGHT, HeaderIconBtn } from '@/components/ui'
import { useHeaderScroll } from '@/hooks/useHeaderScroll'
import ApiService, { BlockedUser } from '@/api/apiService'
import { Colors, FontFamily } from '@/constants'
import { ConfirmSheet } from '@/components/ui'
import { usePillStore } from '@/store/pillStore'

const BlockedUserRow = memo(function BlockedUserRow({ user, onUnblock }: {
  user: BlockedUser
  onUnblock: (user: BlockedUser) => void
}) {
  return (
    <View style={s.row}>
      <View style={s.avatarWrap}>
        {user.avatar ? (
          <Image
            source={{ uri: user.avatar }}
            style={s.avatar}
            cachePolicy="memory-disk"
            priority="low"
            transition={150}
          />
        ) : (
          <View style={[s.avatar, s.avatarFallback]}>
            <Text style={s.avatarInitial}>{(user.name ?? '?').charAt(0)}</Text>
          </View>
        )}
      </View>
      <View style={s.info}>
        <Text style={s.name}>{user.name ?? 'Unknown'}</Text>
        {user.city ? <Text style={s.city}>{user.city}</Text> : null}
      </View>
      <Pressable style={s.unblockBtn} onPress={() => { hError(); onUnblock(user) }}>
        <Text style={s.unblockText}>Unblock</Text>
      </Pressable>
    </View>
  )
})

export default function BlockedUsersScreen() {
  const { hideProgress, onScroll } = useHeaderScroll()
  const insets = useSafeAreaInsets()
  const headerHeight = APP_HEADER_BAR_HEIGHT + insets.top
  const showPill = usePillStore(s => s.show)
  const [blocked, setBlocked] = useState<BlockedUser[]>([])
  const [loading, setLoading] = useState(true)
  const [confirmUser, setConfirmUser] = useState<BlockedUser | null>(null)

  const load = useCallback(async () => {
    try {
      const data = await ApiService.getBlockedUsers()
      setBlocked(data)
    } catch {}
    finally { setLoading(false) }
  }, [])

  useFocusEffect(useCallback(() => { load() }, [load]))

  const doUnblock = async () => {
    if (!confirmUser) return
    try {
      await ApiService.unblockUser(confirmUser.id)
      setBlocked(prev => prev.filter(u => u.id !== confirmUser.id))
    } catch {
      showPill("Couldn't unblock, try again", 'error')
    }
  }

  return (
    <View style={s.root}>
      <AppHeader
        title="Blocked Users"
        hideProgress={hideProgress}
        leftAction={<HeaderIconBtn onPress={() => router.back()}><ArrowLeft size={18} color={Colors.inkPrimary} strokeWidth={2} /></HeaderIconBtn>}
      />

      {loading ? (
        <View style={[s.center, { paddingTop: headerHeight }]}>
          <ActivityIndicator color={Colors.brandOrange} />
        </View>
      ) : blocked.length === 0 ? (
        <View style={[s.center, { paddingTop: headerHeight }]}>
          <ShieldOff size={48} color={Colors.inkDisabled} strokeWidth={1.2} />
          <Text style={s.emptyTitle}>No blocked users</Text>
          <Text style={s.emptySub}>Users you block won't appear in your feed or be able to contact you.</Text>
        </View>
      ) : (
        <FlatList
          data={blocked}
          keyExtractor={u => u.id}
          contentContainerStyle={[s.list, { paddingTop: headerHeight + 8 }]}
          onScroll={onScroll}
          scrollEventThrottle={16}
          renderItem={({ item }) => (
            <BlockedUserRow user={item} onUnblock={setConfirmUser} />
          )}
        />
      )}

      <ConfirmSheet
        visible={!!confirmUser}
        title={`Unblock ${confirmUser?.name ?? 'this user'}?`}
        body="They may appear in your discover feed again."
        confirmLabel="Unblock"
        onConfirm={doUnblock}
        onClose={() => setConfirmUser(null)}
      />
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 32 },
  emptyTitle: { fontFamily: FontFamily.headingBold, fontSize: 18, color: Colors.inkPrimary },
  emptySub: {
    fontFamily: FontFamily.bodyRegular, fontSize: 14, color: Colors.inkSecondary,
    textAlign: 'center', lineHeight: 20,
  },
  list: { paddingVertical: 8 },
  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 12,
  },
  avatarWrap: { marginRight: 14 },
  avatar: { width: 48, height: 48, borderRadius: 24 },
  avatarFallback: { backgroundColor: Colors.surfaceMuted, alignItems: 'center', justifyContent: 'center' },
  avatarInitial: { fontFamily: FontFamily.headingBold, fontSize: 20, color: Colors.inkPrimary },
  info: { flex: 1 },
  name: { fontFamily: FontFamily.bodySemiBold, fontSize: 15, color: Colors.inkPrimary },
  city: { fontFamily: FontFamily.bodyRegular, fontSize: 12, color: Colors.inkSecondary, marginTop: 2 },
  unblockBtn: {
    paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1, borderColor: Colors.brandOrange,
  },
  unblockText: { fontFamily: FontFamily.bodySemiBold, fontSize: 13, color: Colors.brandOrange },
})
