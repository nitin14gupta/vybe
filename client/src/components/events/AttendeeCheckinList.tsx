import React, { memo } from 'react'
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { Image } from 'expo-image'
import { CheckCircle, Search, UserCheck, Users } from 'lucide-react-native'
import { hSuccess } from '@/lib/haptics'
import { Colors, FontFamily } from '@/constants'
import type { EventAttendee } from '@/api/apiService'
import { PrimaryButton, BrandedRefreshControl } from '@/components/ui'

const AttendeeListRow = memo(function AttendeeListRow({
  item,
  checkingIn,
  onCheckin,
}: {
  item: EventAttendee
  checkingIn: string | null
  onCheckin: (attendee: EventAttendee) => void
}) {
  const checkedIn = !!item.checked_in_at
  return (
    <View style={[s.row, checkedIn && s.rowChecked]}>
      <View style={s.rowAvatar}>
        {item.avatar ? (
          <Image
            source={{ uri: item.avatar }}
            style={s.avatarImg}
            contentFit="cover"
            cachePolicy="memory-disk"
            priority="low"
            transition={150}
          />
        ) : (
          <Text style={s.avatarFallback}>{item.name?.[0] ?? '?'}</Text>
        )}
      </View>
      <View style={s.rowInfo}>
        <Text style={[s.rowName, checkedIn && s.rowNameChecked]}>
          {item.name ?? 'Unknown'}
        </Text>
        <Text style={s.rowSub}>
          {item.username ? `@${item.username}` : (item.city ?? '')}
        </Text>
      </View>
      {checkedIn ? (
        <View style={s.checkedInTag}>
          <CheckCircle size={14} color={Colors.accentGreen} />
          <Text style={s.checkedInText}>In</Text>
        </View>
      ) : (
        <PrimaryButton
          label="Check In"
          size="small"
          loading={checkingIn === item.id}
          disabled={!!checkingIn}
          icon={<UserCheck size={14} color={Colors.background} />}
          onPress={() => { hSuccess(); onCheckin(item) }}
        />
      )}
    </View>
  )
})

export function AttendeeCheckinList({
  query,
  onQueryChange,
  loading,
  attendees,
  refreshing,
  onRefresh,
  checkingIn,
  onCheckin,
}: {
  query: string
  onQueryChange: (q: string) => void
  loading: boolean
  attendees: EventAttendee[]
  refreshing: boolean
  onRefresh: () => void
  checkingIn: string | null
  onCheckin: (attendee: EventAttendee) => void
}) {
  return (
    <>
      <View style={s.dividerRow}>
        <View style={s.dividerLine} />
        <Text style={s.dividerLabel}>or check in manually</Text>
        <View style={s.dividerLine} />
      </View>

      <View style={s.searchBar}>
        <Search size={16} color={Colors.inkDisabled} />
        <TextInput
          style={s.searchInput}
          placeholder="Search attendees..."
          placeholderTextColor={Colors.inkDisabled}
          value={query}
          onChangeText={onQueryChange}
        />
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 16 }} color={Colors.brandOrange} />
      ) : (
        <FlatList
          data={attendees}
          keyExtractor={a => a.id}
          contentContainerStyle={s.listContent}
          refreshControl={<BrandedRefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <View style={s.emptyState}>
              <Users size={36} color={Colors.inkDisabled} />
              <Text style={s.emptyText}>No attendees yet</Text>
            </View>
          }
          renderItem={({ item }) => (
            <AttendeeListRow item={item} checkingIn={checkingIn} onCheckin={onCheckin} />
          )}
        />
      )}
    </>
  )
}

const s = StyleSheet.create({
  dividerRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 10, gap: 10 },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.divider },
  dividerLabel: { fontFamily: FontFamily.bodyRegular, fontSize: 12, color: Colors.inkDisabled },

  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 16, marginBottom: 8,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1, borderColor: Colors.divider,
    paddingHorizontal: 12, gap: 8,
  },
  searchInput: { flex: 1, height: 40, color: Colors.inkPrimary, fontFamily: FontFamily.bodyRegular, fontSize: 14 },

  listContent: { paddingHorizontal: 16, paddingBottom: 20 },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingTop: 32, gap: 10 },
  emptyText: { color: Colors.inkDisabled, fontFamily: FontFamily.bodyRegular, fontSize: 14 },

  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: Colors.divider,
  },
  rowChecked: { opacity: 0.55 },
  rowAvatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.elevated,
    overflow: 'hidden', alignItems: 'center', justifyContent: 'center',
  },
  avatarImg: { width: '100%', height: '100%' },
  avatarFallback: { color: Colors.inkPrimary, fontFamily: FontFamily.headingBold, fontSize: 16 },
  rowInfo: { flex: 1 },
  rowName: { fontFamily: FontFamily.bodyMedium, fontSize: 14, color: Colors.inkPrimary },
  rowNameChecked: { textDecorationLine: 'line-through' },
  rowSub: { fontFamily: FontFamily.bodyRegular, fontSize: 12, color: Colors.inkSecondary },
  checkedInTag: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(0,196,140,0.12)', borderRadius: 20, paddingHorizontal: 8, paddingVertical: 4 },
  checkedInText: { fontFamily: FontFamily.bodyMedium, fontSize: 12, color: Colors.accentGreen },
})
