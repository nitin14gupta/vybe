import { View, StyleSheet, ScrollView, Linking } from 'react-native'
import { router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import {
  ArrowLeft, User, Bell, BellRing, HelpCircle, MessageSquare,
  Info, LogOut, Calendar, Ticket, Wallet, HeadphonesIcon,
  Trash2, CalendarHeart, Landmark, Sparkles, Star, Bookmark,
  ShieldCheck, PartyPopper,
} from 'lucide-react-native'
import { AppHeader, APP_HEADER_BAR_HEIGHT, HeaderIconBtn, ConfirmSheet, BrandingFooter } from '@/components/ui'
import { SettingsMenuSection } from '@/components/settings/SettingsMenuSection'
import { useSettings } from '@/hooks/useSettings'
import { useGoBack } from '@/hooks/useGoBack'
import { useHeaderScroll } from '@/hooks/useHeaderScroll'
import { useLogoutConfirm } from '@/hooks/useLogoutConfirm'
import { Colors, Spacing, RATE_APP_URL } from '@/constants'

const iconColor = Colors.inkSecondary

export default function SettingsScreen() {
  const { appVersion } = useSettings()
  const goBack = useGoBack()
  const { hideProgress, onScroll } = useHeaderScroll()
  const insets = useSafeAreaInsets()
  const headerHeight = APP_HEADER_BAR_HEIGHT + insets.top
  const { visible: logoutConfirm, show: showLogout, confirm: confirmLogout, dismiss: dismissLogout } = useLogoutConfirm()

  return (
    <View style={styles.root}>
      <AppHeader
        title="Settings"
        hideProgress={hideProgress}
        leftAction={<HeaderIconBtn onPress={goBack}><ArrowLeft size={18} color={Colors.inkPrimary} strokeWidth={2} /></HeaderIconBtn>}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        contentContainerStyle={[styles.content, { paddingTop: headerHeight + 8 }]}
      >
        <SettingsMenuSection
          title="ACCOUNT"
          items={[
            { icon: <User size={18} color={iconColor} strokeWidth={1.5} />, label: 'Edit Profile', onPress: () => router.push('/(profile)/edit') },
            { icon: <Bell size={18} color={iconColor} strokeWidth={1.5} />, label: 'Notifications', onPress: () => router.push('/(settings)/notifications') },
            { icon: <BellRing size={18} color={iconColor} strokeWidth={1.5} />, label: 'Notification Settings', onPress: () => router.push('/(settings)/notification-settings' as any) },
            { icon: <Bell size={18} color={iconColor} strokeWidth={1.5} />, label: 'Blocked', onPress: () => router.push('/(settings)/blocked') },
          ]}
        />

        <SettingsMenuSection
          title="EVENTS"
          items={[
            { icon: <Calendar size={18} color={iconColor} strokeWidth={1.5} />, label: 'My Events', onPress: () => router.push('/(settings)/my-events' as any) },
            { icon: <Ticket size={18} color={iconColor} strokeWidth={1.5} />, label: 'Joined Events', onPress: () => router.push('/(settings)/joined-events' as any) },
            { icon: <Bookmark size={18} color={iconColor} strokeWidth={1.5} />, label: 'Hotlist', onPress: () => router.push('/(settings)/hotlist' as any) },
            { icon: <CalendarHeart size={18} color={iconColor} strokeWidth={1.5} />, label: 'Calendar', onPress: () => router.push('/(settings)/calendar' as any) },
            { icon: <Wallet size={18} color={iconColor} strokeWidth={1.5} />, label: 'Gorave Wallet', onPress: () => router.push('/(settings)/wallet' as any) },
            { icon: <Landmark size={18} color={iconColor} strokeWidth={1.5} />, label: 'Payout Details', onPress: () => router.push('/(settings)/payout-details' as any) },
          ]}
        />

        <SettingsMenuSection
          title="SAFETY"
          items={[
            { icon: <ShieldCheck size={18} color={iconColor} strokeWidth={1.5} />, label: 'Gorave Safety', onPress: () => router.push('/(safety)' as any) },
          ]}
        />

        <SettingsMenuSection
          title="SUPPORT"
          items={[
            { icon: <HelpCircle size={18} color={iconColor} strokeWidth={1.5} />, label: 'Help & FAQ', onPress: () => router.push('/(settings)/help') },
            { icon: <MessageSquare size={18} color={iconColor} strokeWidth={1.5} />, label: 'Send Feedback', onPress: () => router.push('/(settings)/feedback') },
            { icon: <HeadphonesIcon size={18} color={iconColor} strokeWidth={1.5} />, label: 'Contact Support', onPress: () => router.push('/(settings)/support' as any) },
          ]}
        />

        <SettingsMenuSection
          title="APP"
          items={[
            { icon: <Info size={18} color={iconColor} strokeWidth={1.5} />, label: 'About Gorave', value: `v${appVersion}`, onPress: () => router.push('/(settings)/about') },
            { icon: <Sparkles size={18} color={iconColor} strokeWidth={1.5} />, label: 'Background', onPress: () => router.push('/(settings)/background' as any) },
            { icon: <PartyPopper size={18} color={iconColor} strokeWidth={1.5} />, label: 'Onboarding Complete Preview', onPress: () => router.push('/(settings)/complete-preview' as any) },
            { icon: <Star size={18} color={iconColor} strokeWidth={1.5} />, label: 'Rate Gorave', onPress: () => Linking.openURL(RATE_APP_URL) },
          ]}
        />

        <SettingsMenuSection
          title="PRIVACY"
          items={[
            { icon: <Trash2 size={18} color={iconColor} strokeWidth={1.5} />, label: 'Delete Account', onPress: () => router.push('/(settings)/delete-account' as any) },
          ]}
        />

        <SettingsMenuSection
          style={styles.logoutWrap}
          items={[
            { icon: <LogOut size={18} color={iconColor} strokeWidth={1.5} />, label: 'Log Out', onPress: showLogout },
          ]}
        />

        <BrandingFooter style={styles.footer} />
      </ScrollView>

      <ConfirmSheet
        visible={logoutConfirm}
        title="Log out?"
        body="You'll need to verify your phone number to log back in."
        confirmLabel="Log Out"
        destructive
        onConfirm={confirmLogout}
        onClose={dismissLogout}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  content: {
    paddingHorizontal: Spacing.screenPadding,
    paddingBottom: 40,
    gap: 8,
  },
  logoutWrap: {
    marginTop: 12,
  },
  footer: {
    marginTop: 20,
  },
})
