import { View, Text, StyleSheet, ScrollView, Linking, Image } from 'react-native'
import { router } from 'expo-router'
import {
  User, Bell, BellRing, HelpCircle, MessageSquare,
  Info, LogOut, Calendar, Ticket, Wallet, HeadphonesIcon,
  Trash2, CalendarHeart, Landmark, Sparkles, Star,
} from 'lucide-react-native'
import { Screen, BackButton, ConfirmSheet } from '@/components/ui'
import { SettingsMenuSection } from '@/components/settings/SettingsMenuSection'
import { useSettings } from '@/hooks/useSettings'
import { useGoBack } from '@/hooks/useGoBack'
import { useLogoutConfirm } from '@/hooks/useLogoutConfirm'
import { Colors, FontFamily, Spacing, RATE_APP_URL, CraftedByBanner } from '@/constants'

const iconColor = Colors.inkSecondary

export default function SettingsScreen() {
  const { appVersion } = useSettings()
  const goBack = useGoBack()
  const { visible: logoutConfirm, show: showLogout, confirm: confirmLogout, dismiss: dismissLogout } = useLogoutConfirm()

  return (
    <Screen>
      <View style={styles.header}>
        <BackButton onPress={goBack} />
        <Text style={styles.title}>Settings</Text>
        <View style={styles.headerEnd} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
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
            { icon: <CalendarHeart size={18} color={iconColor} strokeWidth={1.5} />, label: 'Calendar', onPress: () => router.push('/(settings)/calendar' as any) },
            { icon: <Wallet size={18} color={iconColor} strokeWidth={1.5} />, label: 'Gorave Wallet', onPress: () => router.push('/(settings)/wallet' as any) },
            { icon: <Landmark size={18} color={iconColor} strokeWidth={1.5} />, label: 'Payout Details', onPress: () => router.push('/(settings)/payout-details' as any) },
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

        <View style={styles.footer}>
          <Image source={CraftedByBanner} style={styles.footerBanner} resizeMode="contain" />
          <Text style={styles.footerVersion}>v{appVersion}</Text>
        </View>
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
    </Screen>
  )
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: Spacing.screenPadding,
    paddingBottom: 8,
  },
  title: {
    flex: 1,
    fontFamily: FontFamily.headingBold,
    fontSize: 18,
    color: Colors.inkPrimary,
    textAlign: 'center',
  },
  headerEnd: { width: 40 },
  content: {
    paddingHorizontal: Spacing.screenPadding,
    paddingBottom: 40,
    gap: 8,
  },
  logoutWrap: {
    marginTop: 12,
  },
  footer: {
    alignItems: 'center',
    marginTop: 20,
    gap: 8,
  },
  footerBanner: {
    width: 220,
    aspectRatio: 1568 / 672,
  },
  footerVersion: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 12,
    color: Colors.inkDisabled,
  },
})
