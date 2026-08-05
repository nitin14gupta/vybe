import { View, Text, StyleSheet } from "react-native";
import { InterestChip } from "@/components/ui";
import { Colors, FontFamily, Radius } from "@/constants";

interface Props {
  badges?: string[];
  interests?: string[];
}

export function UserProfileBadgesInterests({ badges, interests }: Props) {
  if ((badges?.length ?? 0) === 0 && (interests?.length ?? 0) === 0) return null;

  return (
    <View style={s.chipsRow}>
      {badges?.map((badge) => (
        <View key={badge} style={s.badgeChip}>
          <Text style={s.badgeText}>{badge}</Text>
        </View>
      ))}
      {interests?.map((tag) => (
        <InterestChip key={tag} label={tag} emoji="" selected onPress={() => {}} />
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  chipsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  badgeChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,184,48,0.12)",
    borderRadius: Radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  badgeText: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: 13,
    color: Colors.accentGold,
  },
});
