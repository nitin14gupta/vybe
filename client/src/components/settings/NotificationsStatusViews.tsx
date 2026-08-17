import { View, Text, StyleSheet, Pressable } from 'react-native'
import { Bell, RefreshCw } from 'lucide-react-native'
import { hTap } from '@/lib/haptics'
import { Colors, FontFamily } from '@/constants'

export function NotificationsEmptyState() {
  return (
    <View style={s.center}>
      <Bell size={48} color={Colors.inkDisabled} strokeWidth={1.2} />
      <Text style={s.title}>No notifications yet</Text>
      <Text style={s.sub}>We'll let you know when something happens</Text>
    </View>
  )
}

export function NotificationsErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <View style={s.center}>
      <Bell size={48} color={Colors.inkDisabled} strokeWidth={1.2} />
      <Text style={s.title}>Couldn't load notifications</Text>
      <Text style={s.sub}>Check your connection and try again</Text>
      <Pressable style={s.retryBtn} onPress={() => { hTap(); onRetry() }} android_ripple={null}>
        <RefreshCw size={16} color={Colors.inkPrimary} strokeWidth={1.8} />
        <Text style={s.retryBtnText}>Retry</Text>
      </Pressable>
    </View>
  )
}

const s = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 32 },
  title: { fontFamily: FontFamily.headingBold, fontSize: 18, color: Colors.inkPrimary },
  sub: { fontFamily: FontFamily.bodyRegular, fontSize: 14, color: Colors.inkSecondary, textAlign: 'center' },
  retryBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginTop: 4, paddingVertical: 10, paddingHorizontal: 16,
  },
  retryBtnText: { fontFamily: FontFamily.bodySemiBold, fontSize: 14, color: Colors.inkPrimary },
})
