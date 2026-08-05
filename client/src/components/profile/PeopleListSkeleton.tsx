import React from 'react'
import { View, StyleSheet } from 'react-native'
import { AutoSkeletonView } from 'react-native-auto-skeleton'

export function PeopleListSkeleton({ rows = 7 }: { rows?: number }) {
  return (
    <AutoSkeletonView isLoading animationType="gradient" defaultRadius={7} gradientColors={['#1e1e1e', '#2e2e2e']}>
      {Array.from({ length: rows }).map((_, i) => (
        <View key={i} style={s.skRow}>
          <View style={s.skAvatar} />
          <View style={s.skInfo}>
            <View style={s.skLineName} />
            <View style={s.skLineUser} />
          </View>
        </View>
      ))}
    </AutoSkeletonView>
  )
}

const s = StyleSheet.create({
  skRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12, gap: 14 },
  skAvatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#2a2a2a' },
  skInfo: { flex: 1, gap: 8 },
  skLineName: { height: 14, width: '55%', borderRadius: 7, backgroundColor: '#2a2a2a' },
  skLineUser: { height: 12, width: '35%', borderRadius: 6, backgroundColor: '#2a2a2a' },
})
