import { useState, useCallback } from 'react'
import {
  View, Text, StyleSheet, FlatList, Pressable, Image,
  ActivityIndicator,
} from 'react-native'
import { router } from 'expo-router'
import { hError } from '@/lib/haptics'
import { useFocusEffect } from 'expo-router'
import { ChevronLeft, ShieldOff } from 'lucide-react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import ApiService, { BlockedUser } from '@/api/apiService'
import { Colors, FontFamily } from '@/constants'
import { ConfirmSheet } from '@/components/ui'
import { usePillStore } from '@/store/pillStore'

export default function BlockedUsersScreen() {
  const insets = useSafeAreaInsets()
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
    <View style={[s.root, { paddingTop: insets.top }]}>
      <View style={s.header}>
        <Pressable onPress={() => router.back()} style={s.backBtn} hitSlop={8}>
          <ChevronLeft size={24} color={Colors.brandOrange} strokeWidth={2} />
        </Pressable>
        <Text style={s.title}>Blocked Users</Text>
        <View style={{ width: 32 }} />
      </View>

      {loading ? (
        <View style={s.center}>
          <ActivityIndicator color={Colors.brandOrange} />
        </View>
      ) : blocked.length === 0 ? (
        <View style={s.center}>
          <ShieldOff size={48} color={Colors.inkDisabled} strokeWidth={1.2} />
          <Text style={s.emptyTitle}>No blocked users</Text>
          <Text style={s.emptySub}>Users you block won't appear in your feed or be able to contact you.</Text>
        </View>
      ) : (
        <FlatList
          data={blocked}
          keyExtractor={u => u.id}
          contentContainerStyle={s.list}
          renderItem={({ item }) => (
            <View style={s.row}>
              <View style={s.avatarWrap}>
                {item.avatar ? (
                  <Image source={{ uri: item.avatar }} style={s.avatar} />
                ) : (
                  <View style={[s.avatar, s.avatarFallback]}>
                    <Text style={s.avatarInitial}>{(item.name ?? '?').charAt(0)}</Text>
                  </View>
                )}
              </View>
              <View style={s.info}>
                <Text style={s.name}>{item.name ?? 'Unknown'}</Text>
                {item.city ? <Text style={s.city}>{item.city}</Text> : null}
              </View>
              <Pressable style={s.unblockBtn} onPress={() => { hError(); setConfirmUser(item) }}>
                <Text style={s.unblockText}>Unblock</Text>
              </Pressable>
            </View>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  backBtn: { padding: 4 },
  title: { fontFamily: FontFamily.headingBold, fontSize: 18, color: Colors.inkPrimary },
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
  avatarFallback: { backgroundColor: '#2a2a2a', alignItems: 'center', justifyContent: 'center' },
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
