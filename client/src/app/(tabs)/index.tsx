import { useCallback, useRef, useState } from 'react'
import {
  BackHandler, View, Text, StyleSheet,
} from 'react-native'
import Animated from 'react-native-reanimated'
import { useFocusEffect, router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Heart, PartyPopper, Search } from 'lucide-react-native'
import { AppHeader, APP_HEADER_BAR_HEIGHT, HeaderIconBtn, EmptyState, PrimaryButton, BrandedRefreshControl } from '@/components/ui'
import { HomeGradientBackdrop } from '@/components/home/HomeGradientBackdrop'
import { NotificationPopBadge } from '@/components/home/NotificationPopBadge'
import { TemplateFan } from '@/components/home/TemplateFan'
import { ActiveEventsSection, type ActiveEventsSectionHandle } from '@/components/home/ActiveEventsSection'
import { MyEventsSection, type MyEventsSectionHandle } from '@/components/home/MyEventsSection'
import { RecentlyViewedSection } from '@/components/home/RecentlyViewedSection'
import { PromoCarousel } from '@/components/home/PromoCarousel'
import { TrendingSection, type TrendingSectionHandle } from '@/components/home/TrendingSection'
import { useEvents } from '@/hooks/useEvents'
import { useProfile } from '@/hooks/useProfile'
import { useHeaderAndTabBarScroll } from '@/hooks/useHeaderAndTabBarScroll'
import { useExpandTabBarOnFocus } from '@/hooks/useExpandTabBarOnFocus'
import ApiService from '@/api/apiService'
import { useNotifStore } from '@/store/notifStore'
import { usePillStore } from '@/store/pillStore'
import { hTap } from '@/lib/haptics'
import { Colors, ComponentSize, FontFamily, Radius, withOpacity } from '@/constants'

export default function HomeScreen() {
  const { profile } = useProfile()
  const { syncUnreadCount, hydrate: hydrateNotifStore } = useNotifStore()
  const lastBackRef = useRef(0)
  const showPill = usePillStore(s => s.show)
  const { hideProgress, scrollHandler } = useHeaderAndTabBarScroll()
  useExpandTabBarOnFocus()
  const insets = useSafeAreaInsets()
  const headerHeight = APP_HEADER_BAR_HEIGHT + insets.top

  const [myEventsEmpty, setMyEventsEmpty] = useState<boolean | null>(null)
  const [recentEmpty, setRecentEmpty] = useState<boolean | null>(null)
  const [trendingEmpty, setTrendingEmpty] = useState<boolean | null>(null)
  const allEmpty = myEventsEmpty === true && recentEmpty === true && trendingEmpty === true

  const [refreshing, setRefreshing] = useState(false)
  const activeEventsRef = useRef<ActiveEventsSectionHandle>(null)
  const myEventsRef = useRef<MyEventsSectionHandle>(null)
  const trendingRef = useRef<TrendingSectionHandle>(null)

  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    try {
      await Promise.all([
        activeEventsRef.current?.refresh(),
        myEventsRef.current?.refresh(),
        trendingRef.current?.refresh(),
      ])
    } finally {
      setRefreshing(false)
    }
  }, [])

  useFocusEffect(
    useCallback(() => {
      hydrateNotifStore().then(() => {
        ApiService.getUnreadNotificationCount()
          .then(syncUnreadCount)
          .catch(() => { })
      })
    }, [hydrateNotifStore, syncUnreadCount]),
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
      <HomeGradientBackdrop />
      <AppHeader
        showLogo
        transparent
        hideProgress={hideProgress}
        rightAction={
          <View style={{ flexDirection: 'row', gap: 4 }}>
            <HeaderIconBtn onPress={() => { hTap(); router.push('/(profile)/search' as any) }}>
              <Search size={20} color={Colors.inkPrimary} strokeWidth={1.8} />
            </HeaderIconBtn>
            <HeaderIconBtn onPress={() => router.push('/(settings)/notifications' as any)}>
              <View>
                <Heart size={20} color={Colors.inkPrimary} strokeWidth={1.8} />
                <NotificationPopBadge />
              </View>
            </HeaderIconBtn>
          </View>
        }
      />

      <Animated.ScrollView
        contentContainerStyle={[styles.content, { paddingTop: headerHeight }]}
        showsVerticalScrollIndicator={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        refreshControl={<BrandedRefreshControl refreshing={refreshing} onRefresh={handleRefresh} progressViewOffset={headerHeight} />}
      >
        <TemplateFan onCreatePress={() => { hTap(); router.push('/(events)/create' as any) }} />
        <PrimaryButton
          label="Create event"
          size="small"
          style={styles.createBtn}
          onPress={() => { hTap(); router.push('/(events)/create' as any) }}
        />

        <ActiveEventsSection ref={activeEventsRef} />
        <MyEventsSection ref={myEventsRef} onEmptyChange={setMyEventsEmpty} />
        <RecentlyViewedSection onEmptyChange={setRecentEmpty} />
        <PromoCarousel />
        <TrendingSection ref={trendingRef} onEmptyChange={setTrendingEmpty} />

        {allEmpty && (
          <EmptyState
            icon={<PartyPopper size={44} color={Colors.inkDisabled} strokeWidth={1.2} />}
            title="Nothing here yet"
            subtitle="Events you're going to, hosting, or browsing will show up here"
            ctaLabel="Create Event"
            onCtaPress={() => router.push('/(events)/create' as any)}
          />
        )}
      </Animated.ScrollView>
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
    backgroundColor: withOpacity(Colors.inkPrimary, 0.2),
    alignItems: 'center',
    justifyContent: 'center',
  },
  hostCardTitle: { fontFamily: FontFamily.headingBold, fontSize: 16, color: Colors.inkPrimary },
  hostCardSubtitle: { fontFamily: FontFamily.bodyRegular, fontSize: 12, color: withOpacity(Colors.inkPrimary, 0.85), marginTop: 1 },

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
    color: Colors.inkSecondary,
  },

  eventItem: { marginTop: 14 },

  center: { alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 60, paddingHorizontal: 32 },
  emptyTitle: { fontFamily: FontFamily.headingBold, fontSize: 16, color: Colors.inkPrimary, textAlign: 'center' },
  retryBtn: {
    marginTop: 4, paddingHorizontal: 20, paddingVertical: 10,
    backgroundColor: withOpacity(Colors.inkPrimary, 0.12),
    borderRadius: Radius.pill, borderWidth: 1, borderColor: Colors.inkPrimary,
  },
  retryText: { fontFamily: FontFamily.bodyMedium, fontSize: 13, color: Colors.inkPrimary },
})
