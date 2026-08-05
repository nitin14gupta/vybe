import { View, Text, StyleSheet, Pressable } from 'react-native'
import { Colors, FontFamily, Radius, Spacing } from '@/constants'

interface StatColProps {
  value: string | number
  label: string
  sub: string
  onPress?: () => void
}

function StatCol({ value, label, sub, onPress }: StatColProps) {
  const inner = (
    <>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statSub}>{sub}</Text>
    </>
  )
  if (onPress) {
    return <Pressable style={styles.statCol} onPress={onPress} android_ripple={null}>{inner}</Pressable>
  }
  return <View style={styles.statCol}>{inner}</View>
}

interface Props {
  vibers: number
  vibing: number
  avgRating: number | null
  reviewCount: number
  onVibersPress: () => void
  onVibingPress: () => void
  onReviewsPress: () => void
}

export function ProfileStatsRow({ vibers, vibing, avgRating, reviewCount, onVibersPress, onVibingPress, onReviewsPress }: Props) {
  return (
    <View style={styles.statsCard}>
      <StatCol value={vibers} label="Vibers" sub="fans vibin'" onPress={onVibersPress} />
      <View style={styles.statDivider} />
      <StatCol value={vibing} label="Vibing" sub="folks feelin'" onPress={onVibingPress} />
      <View style={styles.statDivider} />
      <Pressable style={styles.statCol} android_ripple={null} onPress={onReviewsPress}>
        <View style={styles.ratingRow}>
          <Text style={styles.statValue}>{avgRating != null ? avgRating.toFixed(1) : '—'}</Text>
        </View>
        <Text style={styles.statLabel}>Reviews</Text>
        <Text style={styles.statSub}>{reviewCount} rating{reviewCount === 1 ? '' : 's'}</Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  statsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    marginHorizontal: Spacing.screenPadding,
    borderRadius: Radius.card,
    paddingVertical: 16,
    marginBottom: 24,
  },
  statCol: { flex: 1, alignItems: 'center', gap: 2 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  statValue: {
    fontFamily: FontFamily.headingBold,
    fontSize: 22,
    color: Colors.inkPrimary,
    letterSpacing: -0.3,
  },
  statLabel: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 13,
    color: Colors.inkSecondary,
  },
  statSub: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 11,
    color: Colors.inkDisabled,
  },
  statDivider: {
    width: 1, height: 40,
    backgroundColor: Colors.divider,
  },
})
