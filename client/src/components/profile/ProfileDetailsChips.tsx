import { View, Text, StyleSheet } from 'react-native'
import { InterestChip } from '@/components/ui'
import { Colors, FontFamily, Radius, Spacing, withOpacity } from '@/constants'

interface Props {
  badges: string[]
  interests: string[]
}

export function ProfileDetailsChips({ badges, interests }: Props) {
  if (badges.length === 0 && interests.length === 0) return null

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>My Details</Text>
      <View style={styles.chipsWrap}>
        {badges.map(badge => (
          <View key={badge} style={styles.badgeChip}>
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        ))}
        {interests.map(tag => (
          <InterestChip key={tag} label={tag} emoji="" selected onPress={() => { }} />
        ))}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  section: {
    marginHorizontal: Spacing.screenPadding,
    marginBottom: 24,
  },
  sectionTitle: {
    fontFamily: FontFamily.headingBold,
    fontSize: 18,
    color: Colors.inkPrimary,
    marginBottom: 12,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  badgeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: withOpacity(Colors.accentGold, 0.12),
    borderRadius: Radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  badgeText: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: 13,
    color: Colors.accentGold,
  },
})
