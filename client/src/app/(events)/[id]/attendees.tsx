import { useMemo, useState } from 'react'
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { AlertCircle, ArrowLeft, QrCode, Users } from 'lucide-react-native'
import { Colors, FontFamily, Spacing, Radius } from '@/constants'
import { BrandedLoader, EmptyState } from '@/components/ui'
import { AttendeeRow } from '@/components/events/AttendeeRow'
import { AttendeeFilterPills, type AttendeeFilter } from '@/components/events/AttendeeFilterPills'
import { useAttendees } from '@/hooks/useAttendees'
import type { EventAttendee } from '@/api/apiService'
import { usePillStore } from '@/store/pillStore'

export default function AttendeesScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const insets = useSafeAreaInsets()
  const router = useRouter()

  const showPill = usePillStore(s => s.show)
  const [filter, setFilter] = useState<AttendeeFilter>('all')

  const { loading, loadError, going, checkedIn, notArrived, waitlist, scannerStatus, reload } = useAttendees(id)

  const handleScannerPress = () => {
    if (scannerStatus === 'ended') {
      showPill('Event has ended — scanner is closed', 'error')
    } else if (scannerStatus === 'not_yet') {
      showPill('Scanner opens 3 hours before the event', 'default')
    } else {
      router.push(`/(events)/${id}/scanner` as any)
    }
  }

  const counts: Record<AttendeeFilter, number> = {
    all: going.length + waitlist.length,
    checked_in: checkedIn.length,
    not_arrived: notArrived.length,
  }

  const list: EventAttendee[] = useMemo(() => {
    if (filter === 'checked_in') return checkedIn
    if (filter === 'not_arrived') return notArrived
    return [...going, ...waitlist]
  }, [filter, going, checkedIn, notArrived, waitlist])

  const emptyLabel =
    filter === 'checked_in' ? 'No one has checked in yet' :
    filter === 'not_arrived' ? 'Everyone has checked in!' :
    'No attendees yet'

  const emptySub =
    filter === 'checked_in' ? 'Check-ins show here once the scanner is used.' :
    filter === 'not_arrived' ? 'Share the event to get people to join.' :
    'Share the event to get people to join.'

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <View style={s.header}>
        <Pressable onPress={() => router.back()} style={s.iconBtn} hitSlop={8}>
          <ArrowLeft size={20} color={Colors.inkPrimary} strokeWidth={1.8} />
        </Pressable>

        <View style={s.headerCenter}>
          <Text style={s.headerTitle}>Attendees</Text>
          {!loading && !loadError && (
            <Text style={s.headerSub}>
              {going.length} going
              {checkedIn.length > 0 ? ` · ${checkedIn.length} checked in` : ''}
              {waitlist.length > 0 ? ` · ${waitlist.length} waitlist` : ''}
            </Text>
          )}
        </View>

        <Pressable
          style={[s.iconBtn, scannerStatus !== 'open' && s.iconBtnDim]}
          onPress={handleScannerPress}
          hitSlop={8}
        >
          <QrCode
            size={20}
            color={scannerStatus === 'open' ? Colors.brandOrange : Colors.inkDisabled}
            strokeWidth={1.8}
          />
        </Pressable>
      </View>

      {!loading && !loadError && (
        <AttendeeFilterPills active={filter} counts={counts} onChange={setFilter} />
      )}

      <View style={s.divider} />

      {loading ? (
        <View style={s.center}>
          <BrandedLoader />
        </View>
      ) : loadError ? (
        <View style={s.center}>
          <EmptyState
            icon={<AlertCircle size={44} color={Colors.inkDisabled} strokeWidth={1.2} />}
            title="Couldn't load attendees"
            subtitle="Check your connection and try again."
            ctaLabel="Retry"
            onCtaPress={reload}
          />
        </View>
      ) : list.length === 0 ? (
        <View style={s.center}>
          <EmptyState
            icon={<Users size={44} color={Colors.inkDisabled} strokeWidth={1.2} />}
            title={emptyLabel}
            subtitle={emptySub}
          />
        </View>
      ) : (
        <FlatList
          key={filter}
          data={list}
          keyExtractor={item => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
          renderItem={({ item, index }) => {
            const pos = item.status === 'waitlist' ? index - going.length + 1 : undefined
            return <AttendeeRow item={item} position={pos} />
          }}
        />
      )}
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  iconBtnDim: { opacity: 0.45 },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontFamily: FontFamily.headingBold, fontSize: 17, color: Colors.inkPrimary },
  headerSub: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 12,
    color: Colors.inkSecondary,
    marginTop: 1,
  },

  divider: { height: StyleSheet.hairlineWidth, backgroundColor: Colors.divider },

  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: 40,
  },
})
