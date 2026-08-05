import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { AlertCircle, ArrowLeft, Users } from 'lucide-react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Colors, FontFamily } from '@/constants'
import { BrandedLoader, EmptyState } from '@/components/ui'
import { WaitlistEntryRow } from '@/components/events/WaitlistEntryRow'
import { useManageWaitlist } from '@/hooks/useManageWaitlist'

export default function ManageWaitlistScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const insets = useSafeAreaInsets()
  const router = useRouter()

  const { waitlist, loading, loadError, admitting, pending, offered, handleAdmit, reload } = useManageWaitlist(id)

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <View style={s.header}>
        <Pressable style={s.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={20} color={Colors.inkPrimary} />
        </Pressable>
        <Text style={s.headerTitle}>Manage Waitlist</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={s.center}>
          <BrandedLoader />
        </View>
      ) : loadError ? (
        <View style={s.center}>
          <EmptyState
            icon={<AlertCircle size={48} color={Colors.inkDisabled} strokeWidth={1.2} />}
            title="Couldn't load waitlist"
            subtitle="Check your connection and try again."
            ctaLabel="Retry"
            onCtaPress={reload}
          />
        </View>
      ) : waitlist.length === 0 ? (
        <View style={s.center}>
          <EmptyState
            icon={<Users size={48} color={Colors.inkDisabled} strokeWidth={1.2} />}
            title="Waitlist is empty"
            subtitle="No one is currently waiting for a spot."
          />
        </View>
      ) : (
        <>
          <Pressable style={s.admitBtn} onPress={handleAdmit} disabled={admitting || pending.length === 0}>
            <LinearGradient
              colors={pending.length > 0 ? ['#FF6B35', '#FF3864'] : ['#333', '#333']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={s.admitGradient}
            >
              {admitting
                ? <ActivityIndicator color="#fff" />
                : <Text style={s.admitText}>Admit Next ({pending.length} waiting)</Text>}
            </LinearGradient>
          </Pressable>

          <ScrollView
            style={s.scroll}
            contentContainerStyle={[s.scrollContent, { paddingBottom: insets.bottom + 24 }]}
            showsVerticalScrollIndicator={false}
          >
            {offered.length > 0 && (
              <>
                <Text style={s.sectionLabel}>Spot Offered</Text>
                {offered.map(entry => (
                  <WaitlistEntryRow key={entry.id} entry={entry} isOffered />
                ))}
              </>
            )}

            {pending.length > 0 && (
              <>
                <Text style={s.sectionLabel}>Waiting ({pending.length})</Text>
                {pending.map(entry => (
                  <WaitlistEntryRow key={entry.id} entry={entry} isOffered={false} />
                ))}
              </>
            )}
          </ScrollView>
        </>
      )}
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.divider,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, textAlign: 'center', fontFamily: FontFamily.headingBold, fontSize: 17, color: Colors.inkPrimary },

  admitBtn: { marginHorizontal: 20, marginTop: 16, marginBottom: 8, borderRadius: 14, overflow: 'hidden' },
  admitGradient: { paddingVertical: 14, alignItems: 'center', borderRadius: 14 },
  admitText: { color: '#fff', fontFamily: FontFamily.bodySemiBold, fontSize: 15 },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 12 },

  sectionLabel: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: 12,
    color: Colors.inkDisabled,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: 16,
    marginBottom: 8,
  },
})
