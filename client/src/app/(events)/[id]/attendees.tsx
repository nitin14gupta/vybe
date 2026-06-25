import { useEffect, useState } from 'react'
import {
  View, Text, StyleSheet, FlatList, Pressable,
  ActivityIndicator, Image,
} from 'react-native'
import { hTap } from '@/lib/haptics'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ArrowLeft, Users } from 'lucide-react-native'
import { Colors, FontFamily } from '@/constants'
import ApiService, { type EventAttendee } from '@/api/apiService'

function AttendeeRow({ item }: { item: EventAttendee }) {
  const router = useRouter()
  return (
    <Pressable
      style={s.row}
      onPress={() => { hTap(); router.push(`/(profile)/${item.id}` as any) }}
    >
      {item.avatar ? (
        <Image source={{ uri: item.avatar }} style={s.avatar} />
      ) : (
        <View style={[s.avatar, s.avatarFallback]}>
          <Text style={s.avatarInitial}>{(item.name ?? '?').charAt(0)}</Text>
        </View>
      )}
      <View style={s.info}>
        <Text style={s.name}>{item.name ?? 'User'}</Text>
        {item.username ? (
          <Text style={s.username}>@{item.username}</Text>
        ) : item.city ? (
          <Text style={s.username}>{item.city}</Text>
        ) : null}
      </View>
      <View style={[s.statusBadge, item.status === 'going' && s.statusGoing]}>
        <Text style={s.statusText}>{item.status}</Text>
      </View>
    </Pressable>
  )
}

export default function AttendeesScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const [attendees, setAttendees] = useState<EventAttendee[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    ApiService.getEventAttendees(id)
      .then(r => setAttendees(r.attendees))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [id])

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <View style={s.header}>
        <Pressable onPress={() => { hTap(); router.back() }} hitSlop={10} style={s.backBtn}>
          <ArrowLeft size={22} color={Colors.inkPrimary} strokeWidth={1.8} />
        </Pressable>
        <View>
          <Text style={s.title}>Attendees</Text>
          {!loading && (
            <Text style={s.subtitle}>{attendees.length} going</Text>
          )}
        </View>
      </View>

      {loading ? (
        <View style={s.center}>
          <ActivityIndicator color={Colors.brandOrange} />
        </View>
      ) : attendees.length === 0 ? (
        <View style={s.center}>
          <Users size={48} color={Colors.inkDisabled} strokeWidth={1.2} />
          <Text style={s.emptyTitle}>No attendees yet</Text>
          <Text style={s.emptySub}>Share your event to get people to join.</Text>
        </View>
      ) : (
        <FlatList
          data={attendees}
          keyExtractor={a => a.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={s.list}
          renderItem={({ item }) => <AttendeeRow item={item} />}
        />
      )}
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingHorizontal: 20, paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  backBtn: { padding: 4 },
  title: { fontFamily: FontFamily.headingBold, fontSize: 22, color: Colors.inkPrimary },
  subtitle: { fontFamily: FontFamily.bodyRegular, fontSize: 13, color: Colors.inkSecondary },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 32 },
  emptyTitle: { fontFamily: FontFamily.headingBold, fontSize: 18, color: Colors.inkPrimary },
  emptySub: { fontFamily: FontFamily.bodyRegular, fontSize: 13, color: Colors.inkSecondary, textAlign: 'center' },
  list: { paddingVertical: 8 },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingHorizontal: 20, paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  avatar: { width: 48, height: 48, borderRadius: 24 },
  avatarFallback: {
    backgroundColor: '#2a2a2a', alignItems: 'center', justifyContent: 'center',
  },
  avatarInitial: { fontFamily: FontFamily.headingBold, fontSize: 18, color: Colors.inkPrimary },
  info: { flex: 1 },
  name: { fontFamily: FontFamily.bodySemiBold, fontSize: 15, color: Colors.inkPrimary },
  username: { fontFamily: FontFamily.bodyRegular, fontSize: 12, color: Colors.inkSecondary },
  statusBadge: {
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  statusGoing: { backgroundColor: 'rgba(76,175,80,0.15)' },
  statusText: { fontFamily: FontFamily.bodyRegular, fontSize: 12, color: Colors.inkSecondary },
})
