import { useCallback, useRef, useState } from 'react'
import {
  BackHandler, View, Text, StyleSheet, Pressable, FlatList, ActivityIndicator,
} from 'react-native'
import { useFocusEffect, router } from 'expo-router'
import { Bell, Flame, PartyPopper } from 'lucide-react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { AppHeader, HeaderIconBtn, CreateEventSheet } from '@/components/ui'
import { EventCard } from '@/components/EventCard'
import { useEvents } from '@/hooks/useEvents'
import { useProfile } from '@/hooks/useProfile'
import ApiService from '@/api/apiService'
import { useNotifStore } from '@/store/notifStore'
import { usePillStore } from '@/store/pillStore'
import { hTap } from '@/lib/haptics'
import { Colors, FontFamily, Radius } from '@/constants'

export default function HomeScreen() {
  const { profile } = useProfile()
  const { events, loading, error, reload } = useEvents()
  const { unreadCount, setUnreadCount } = useNotifStore()
  const [createOpen, setCreateOpen] = useState(false)
  const lastBackRef = useRef(0)
  const showPill = usePillStore(s => s.show)

  useFocusEffect(
    useCallback(() => {
      ApiService.getUnreadNotificationCount()
        .then(setUnreadCount)
        .catch(() => { })
    }, [setUnreadCount]),
  )

  // Home is the app's landing tab / back-stop — double-back to exit
  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener('hardwareBackPress', () => {
        const now = Date.now()
        if (now - lastBackRef.current < 2000) {
          BackHandler.exitApp()
          return true
        }
        lastBackRef.current = now
        showPill('Press back again to exit')
        return true
      })
      return () => sub.remove()
    }, [showPill]),
  )

  const firstName = profile?.name?.split(' ')[0] ?? 'there'
  const nearby = events.slice(0, 10)

  const openEvent = (id: string) => router.push(`/(events)/${id}` as any)

  return (
    <View style={styles.root}>
      <AppHeader
        showLogo
        rightAction={
          <HeaderIconBtn onPress={() => router.push('/(settings)/notifications' as any)}>
            <View>
              <Bell size={20} color={Colors.inkSecondary} strokeWidth={1.8} />
              {unreadCount > 0 && <View style={styles.bellDot} />}
            </View>
          </HeaderIconBtn>
        }
      />

      <FlatList
        data={nearby}
        keyExtractor={(e) => e.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        refreshing={loading}
        onRefresh={reload}
        ListHeaderComponent={
          <View style={{ gap: 20 }}>
            <View>
              <Text style={styles.greeting}>Hey {firstName} 👋</Text>
              <Text style={styles.subGreeting}>What are we vybing with today?</Text>
            </View>

            <Pressable
              style={styles.hostCard}
              onPress={() => { hTap(); setCreateOpen(true) }}
            >
              <LinearGradient
                colors={[Colors.brandOrange, Colors.brandCoral]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              <View style={styles.hostCardIcon}>
                <PartyPopper size={22} color="#fff" strokeWidth={2} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.hostCardTitle}>Host an event</Text>
                <Text style={styles.hostCardSubtitle}>Get your friends together</Text>
              </View>
            </Pressable>

            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Nearby events</Text>
              <Pressable onPress={() => { hTap(); router.push('/(tabs)/events' as any) }}>
                <Text style={styles.seeAll}>See all</Text>
              </Pressable>
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.eventItem}>
            <EventCard event={item} onPress={() => openEvent(item.id)} />
          </View>
        )}
        ListEmptyComponent={
          loading ? (
            <View style={styles.center}>
              <ActivityIndicator color={Colors.brandOrange} />
            </View>
          ) : error ? (
            <View style={styles.center}>
              <Text style={styles.emptyTitle}>Couldn't load events</Text>
              <Pressable onPress={reload} style={styles.retryBtn}>
                <Text style={styles.retryText}>Try again</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.center}>
              <Flame size={40} color={Colors.inkDisabled} strokeWidth={1.2} />
              <Text style={styles.emptyTitle}>No events nearby yet</Text>
              <Pressable
                onPress={() => { hTap(); setCreateOpen(true) }}
                style={styles.retryBtn}
              >
                <Text style={styles.retryText}>Be the first to host one</Text>
              </Pressable>
            </View>
          )
        }
      />

      <CreateEventSheet
        visible={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreateEvent={() => router.push('/(events)/create' as any)}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  content: { paddingHorizontal: 16, paddingBottom: 24, gap: 14 },

  greeting: {
    fontFamily: FontFamily.headingBold,
    fontSize: 24,
    color: Colors.inkPrimary,
    letterSpacing: -0.3,
  },
  subGreeting: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 14,
    color: Colors.inkSecondary,
    marginTop: 2,
  },

  hostCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderRadius: 20,
    padding: 16,
    overflow: 'hidden',
  },
  hostCardIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hostCardTitle: { fontFamily: FontFamily.headingBold, fontSize: 16, color: '#fff' },
  hostCardSubtitle: { fontFamily: FontFamily.bodyRegular, fontSize: 12, color: 'rgba(255,255,255,0.85)', marginTop: 1 },

  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontFamily: FontFamily.headingBold,
    fontSize: 18,
    color: Colors.inkPrimary,
  },
  seeAll: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: 13,
    color: Colors.brandOrange,
  },

  eventItem: { marginTop: 14 },

  center: { alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 60, paddingHorizontal: 32 },
  emptyTitle: { fontFamily: FontFamily.headingBold, fontSize: 16, color: Colors.inkPrimary, textAlign: 'center' },
  retryBtn: {
    marginTop: 4, paddingHorizontal: 20, paddingVertical: 10,
    backgroundColor: 'rgba(255,107,53,0.12)',
    borderRadius: Radius.pill, borderWidth: 1, borderColor: Colors.brandOrange,
  },
  retryText: { fontFamily: FontFamily.bodyMedium, fontSize: 13, color: Colors.brandOrange },

  bellDot: {
    position: 'absolute',
    top: -1,
    right: -1,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.brandOrange,
    borderWidth: 1.5,
    borderColor: Colors.background,
  },
})
