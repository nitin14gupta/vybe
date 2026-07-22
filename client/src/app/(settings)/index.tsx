import { View, Text, StyleSheet, ScrollView } from 'react-native'
import { router } from 'expo-router'
import {
  User, Bell, HelpCircle, MessageSquare,
  Info, LogOut, Calendar, Ticket, Wallet, HeadphonesIcon,
  Trash2, CalendarHeart, Landmark,
} from 'lucide-react-native'
import { Screen, BackButton, SettingRow, ConfirmSheet } from '@/components/ui'
import { useSettings } from '@/hooks/useSettings'
import { useGoBack } from '@/hooks/useGoBack'
import { useLogoutConfirm } from '@/hooks/useLogoutConfirm'
import { Colors, FontFamily, Spacing } from '@/constants'

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
        {/* Account */}
        <Text style={styles.sectionLabel}>ACCOUNT</Text>
        <View style={styles.card}>
          <SettingRow
            icon={<User size={18} color={Colors.inkSecondary} strokeWidth={1.5} />}
            label="Edit Profile"
            onPress={() => router.push('/(profile)/edit')}
          />
          <SettingRow
            icon={<Bell size={18} color={Colors.inkSecondary} strokeWidth={1.5} />}
            label="Notifications"
            onPress={() => router.push('/(settings)/notifications')}
          />
          <SettingRow
            icon={<Bell size={18} color={Colors.inkSecondary} strokeWidth={1.5} />}
            label="Blocked"
            onPress={() => router.push('/(settings)/blocked')}
            showSeparator={false}
          />
        </View>

        {/* Events */}
        <Text style={styles.sectionLabel}>EVENTS</Text>
        <View style={styles.card}>
          <SettingRow
            icon={<Calendar size={18} color={Colors.inkSecondary} strokeWidth={1.5} />}
            label="My Events"
            onPress={() => router.push('/(settings)/my-events' as any)}
          />
          <SettingRow
            icon={<Ticket size={18} color={Colors.inkSecondary} strokeWidth={1.5} />}
            label="Joined Events"
            onPress={() => router.push('/(settings)/joined-events' as any)}
          />
          <SettingRow
            icon={<CalendarHeart size={18} color={Colors.inkSecondary} strokeWidth={1.5} />}
            label="Calendar"
            onPress={() => router.push('/(settings)/calendar' as any)}
          />
          <SettingRow
            icon={<Wallet size={18} color={Colors.inkSecondary} strokeWidth={1.5} />}
            label="Gorave Wallet"
            onPress={() => router.push('/(settings)/wallet' as any)}
          />
          <SettingRow
            icon={<Landmark size={18} color={Colors.inkSecondary} strokeWidth={1.5} />}
            label="Payout Details"
            onPress={() => router.push('/(settings)/payout-details' as any)}
            showSeparator={false}
          />
        </View>

        {/* Support */}
        <Text style={styles.sectionLabel}>SUPPORT</Text>
        <View style={styles.card}>
          <SettingRow
            icon={<HelpCircle size={18} color={Colors.inkSecondary} strokeWidth={1.5} />}
            label="Help &amp; FAQ"
            onPress={() => router.push('/(settings)/help')}
          />
          <SettingRow
            icon={<MessageSquare size={18} color={Colors.inkSecondary} strokeWidth={1.5} />}
            label="Send Feedback"
            onPress={() => router.push('/(settings)/feedback')}
          />
          <SettingRow
            icon={<HeadphonesIcon size={18} color={Colors.inkSecondary} strokeWidth={1.5} />}
            label="Contact Support"
            onPress={() => router.push('/(settings)/support' as any)}
            showSeparator={false}
          />
        </View>
        
        {/* App */}
        <Text style={styles.sectionLabel}>APP</Text>
        <View style={styles.card}>
          <SettingRow
            icon={<Info size={18} color={Colors.inkSecondary} strokeWidth={1.5} />}
            label="About Vybe"
            value={`v${appVersion}`}
            onPress={() => router.push('/(settings)/about')}
            showSeparator={false}
          />
        </View>

        {/* Privacy */}
        <Text style={styles.sectionLabel}>PRIVACY</Text>
        <View style={styles.card}>
          <SettingRow
            icon={<Trash2 size={18} color={Colors.inkSecondary} strokeWidth={1.5} />}
            label="Delete Account"
            onPress={() => router.push('/(settings)/delete-account' as any)}
            showSeparator={false}
          />
        </View>

        {/* Logout */}
        <View style={styles.logoutWrap}>
          <SettingRow
            icon={<LogOut size={18} color={Colors.inkSecondary} strokeWidth={1.5} />}
            label="Log Out"
            onPress={showLogout}
            showSeparator={false}
          />
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
  sectionLabel: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: 11,
    letterSpacing: 0.88,
    color: Colors.inkSecondary,
    marginTop: 8,
    marginBottom: 2,
    marginLeft: 4,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    overflow: 'hidden',
  },
  logoutWrap: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 12,
  },
})
