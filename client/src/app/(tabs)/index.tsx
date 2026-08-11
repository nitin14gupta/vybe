import { useCallback, useRef, useState } from 'react'
import {
  BackHandler, View, Text, StyleSheet, ScrollView,
} from 'react-native'
import { useFocusEffect, router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Heart, PartyPopper, Search } from 'lucide-react-native'
import { AppHeader, APP_HEADER_BAR_HEIGHT, HeaderIconBtn, CreateEventSheet, EmptyState, PrimaryButton } from '@/components/ui'
import { HomeGradientBackdrop } from '@/components/home/HomeGradientBackdrop'
import { TemplateFan } from '@/components/home/TemplateFan'
import { MyEventsSection } from '@/components/home/MyEventsSection'
import { RecentlyViewedSection } from '@/components/home/RecentlyViewedSection'
import { PromoCarousel } from '@/components/home/PromoCarousel'
import { TrendingSection } from '@/components/home/TrendingSection'
import { useEvents } from '@/hooks/useEvents'
import { useProfile } from '@/hooks/useProfile'
import { useTabBarScroll } from '@/hooks/useTabBarScroll'
import { useHeaderScroll } from '@/hooks/useHeaderScroll'
import ApiService from '@/api/apiService'
import { useNotifStore } from '@/store/notifStore'
import { usePillStore } from '@/store/pillStore'
import { hTap } from '@/lib/haptics'
import { Colors, ComponentSize, FontFamily, Radius } from '@/constants'

export default function HomeScreen() {
  const { profile } = useProfile()
  const { unreadCount, setUnreadCount } = useNotifStore()
  const [createOpen, setCreateOpen] = useState(false)
  const lastBackRef = useRef(0)
  const showPill = usePillStore(s => s.show)
  const tabBarScroll = useTabBarScroll()
  const { hideProgress, onScroll: onHeaderScroll } = useHeaderScroll()
  const insets = useSafeAreaInsets()
  const headerHeight = APP_HEADER_BAR_HEIGHT + insets.top

  const [myEventsEmpty, setMyEventsEmpty] = useState<boolean | null>(null)
  const [recentEmpty, setRecentEmpty] = useState<boolean | null>(null)
  const [trendingEmpty, setTrendingEmpty] = useState<boolean | null>(null)
  const allEmpty = myEventsEmpty === true && recentEmpty === true && trendingEmpty === true

  useFocusEffect(
    useCallback(() => {
      ApiService.getUnreadNotificationCount()
        .then(setUnreadCount)
        .catch(() => { })
    }, [setUnreadCount]),
  )

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

  return (
    <View style={styles.root}>

      <AppHeader
        showLogo
        transparent
        hideProgress={hideProgress}
        rightAction={
          <View style={{ flexDirection: 'row', gap: 4 }}>
            <HeaderIconBtn onPress={() => { hTap(); router.push('/(profile)/search' as any) }}>
              <Search size={20} color={Colors.inkSecondary} strokeWidth={1.8} />
            </HeaderIconBtn>
            <HeaderIconBtn onPress={() => router.push('/(settings)/notifications' as any)}>
              <View>
                <Heart size={20} color={Colors.inkSecondary} strokeWidth={1.8} />
                {unreadCount > 0 && <View style={styles.bellDot} />}
              </View>
            </HeaderIconBtn>
          </View>
        }
      />

      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: headerHeight }]}
        showsVerticalScrollIndicator={false}
        {...tabBarScroll}
        onScroll={(e) => { tabBarScroll.onScroll(e); onHeaderScroll(e) }}
      >
        <TemplateFan />
        <PrimaryButton
          label="Create event"
          size="small"
          style={styles.createBtn}
          onPress={() => { hTap(); setCreateOpen(true) }}
        />

        <MyEventsSection onEmptyChange={setMyEventsEmpty} />
        <RecentlyViewedSection onEmptyChange={setRecentEmpty} />
        <PromoCarousel />
        <TrendingSection onEmptyChange={setTrendingEmpty} />

        {allEmpty && (
          <EmptyState
            icon={<PartyPopper size={44} color={Colors.inkDisabled} strokeWidth={1.2} />}
            title="Nothing here yet"
            subtitle="Events you're going to, hosting, or browsing will show up here"
            ctaLabel="Create Event"
            onCtaPress={() => router.push('/(events)/create' as any)}
          />
        )}
      </ScrollView>

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
  content: { paddingHorizontal: 16, paddingBottom: ComponentSize.navBar + 24, gap: 14 },

  createBtn: {
    alignSelf: 'center',
    marginTop: 2,
  },

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
    top: -2,
    right: -2,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FF3040',
    borderWidth: 1.5,
    borderColor: Colors.background,
  },
})
