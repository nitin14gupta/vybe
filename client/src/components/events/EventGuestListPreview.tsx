import React from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { Image } from 'expo-image'
import { ChevronRight } from 'lucide-react-native'
import { Colors, FontFamily, withOpacity } from '@/constants'
import { hTap } from '@/lib/haptics'
import type { EventGuest } from '@/api/apiService'

interface Props {
  guests: EventGuest[]
  guestTotal: number
  onPress: () => void
}

export function EventGuestListPreview({ guests, guestTotal, onPress }: Props) {
  if (guestTotal <= 0) return null

  return (
    <Pressable style={styles.guestCard} onPress={() => { hTap(); onPress() }}>
      <View style={styles.guestCardTop}>
        <Text style={styles.guestCardTitle}>Guest List</Text>
        <View style={styles.viewAllPill}>
          <Text style={styles.viewAllText}>View all</Text>
          <ChevronRight size={14} color={Colors.brandOrange} strokeWidth={2} />
        </View>
      </View>
      <View style={styles.guestCardBottom}>
        <View style={styles.guestStack}>
          {guests.slice(0, 7).map((g, i) => (
            <View key={g.id} style={[styles.guestStackAvatar, { marginLeft: i === 0 ? 0 : -12, zIndex: 7 - i }]}>
              {g.avatar ? (
                <Image
                  source={{ uri: g.avatar }}
                  style={styles.guestStackImg}
                  contentFit="cover"
                  cachePolicy="memory-disk"
                  priority="low"
                  transition={150}
                />
              ) : (
                <View style={[styles.guestStackImg, styles.guestStackFallback]}>
                  <Text style={styles.guestStackInitial}>{(g.name ?? '?').charAt(0).toUpperCase()}</Text>
                </View>
              )}
            </View>
          ))}
          {guestTotal > 7 && (
            <View style={[styles.guestStackAvatar, styles.guestStackMore, { marginLeft: -12 }]}>
              <Text style={styles.guestStackMoreText}>+{guestTotal - 7}</Text>
            </View>
          )}
        </View>
        <Text style={styles.guestCardCount}>{guestTotal} going</Text>
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  guestCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.divider,
    padding: 16,
    marginBottom: 16,
    gap: 14,
  },
  guestCardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  guestCardTitle: { fontFamily: FontFamily.headingBold, fontSize: 16, color: Colors.inkPrimary },
  viewAllPill: {
    flexDirection: 'row', alignItems: 'center', gap: 2,
    backgroundColor: withOpacity(Colors.brandOrange, 0.1),
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 999,
  },
  viewAllText: { fontFamily: FontFamily.bodySemiBold, fontSize: 12, color: Colors.brandOrange },
  guestCardBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  guestStack: { flexDirection: 'row', alignItems: 'center' },
  guestStackAvatar: {
    width: 40, height: 40, borderRadius: 20,
    borderWidth: 2, borderColor: Colors.surface,
    overflow: 'hidden',
  },
  guestStackImg: { width: '100%', height: '100%' },
  guestStackFallback: { backgroundColor: Colors.elevated, alignItems: 'center', justifyContent: 'center' },
  guestStackInitial: { fontFamily: FontFamily.headingBold, fontSize: 14, color: Colors.inkPrimary },
  guestStackMore: {
    backgroundColor: Colors.elevated,
    alignItems: 'center', justifyContent: 'center',
  },
  guestStackMoreText: { fontFamily: FontFamily.bodySemiBold, fontSize: 11, color: Colors.inkSecondary },
  guestCardCount: { fontFamily: FontFamily.bodyMedium, fontSize: 13, color: Colors.inkSecondary },
})
