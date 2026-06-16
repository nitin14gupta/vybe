import { View, Text, StyleSheet, ScrollView } from 'react-native'
import { router } from 'expo-router'
import {
  User, Bell, HelpCircle, MessageSquare, Shield, FileText,
  Info, LogOut,
} from 'lucide-react-native'
import { Screen, BackButton, SettingRow, PrimaryButton } from '@/components/ui'
import { useSettings } from '@/hooks/useSettings'
import { Colors, FontFamily, Spacing } from '@/constants'

export default function SettingsScreen() {
  const { appVersion, handleLogout } = useSettings()

  return (
    <Screen>
      <View style={styles.header}>
        <BackButton onPress={() => router.back()} />
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
            onPress={() => {}}
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
            showSeparator={false}
          />
        </View>

        {/* Legal */}
        <Text style={styles.sectionLabel}>LEGAL</Text>
        <View style={styles.card}>
          <SettingRow
            icon={<Shield size={18} color={Colors.inkSecondary} strokeWidth={1.5} />}
            label="Privacy Policy"
            onPress={() => router.push('/(settings)/privacy')}
          />
          <SettingRow
            icon={<FileText size={18} color={Colors.inkSecondary} strokeWidth={1.5} />}
            label="Terms of Use"
            onPress={() => router.push('/(settings)/terms')}
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

        {/* Logout */}
        <View style={styles.logoutWrap}>
          <SettingRow
            icon={<LogOut size={18} color={Colors.brandCoral} strokeWidth={1.5} />}
            label="Log Out"
            onPress={handleLogout}
            destructive
            showSeparator={false}
          />
        </View>
      </ScrollView>
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
