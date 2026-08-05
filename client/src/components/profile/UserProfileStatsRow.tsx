import { View, Text, Pressable, StyleSheet } from "react-native";
import { router } from "expo-router";
import { Colors, FontFamily } from "@/constants";

interface Props {
  userId: string;
  name?: string | null;
  vibersCount: number;
  vibingCount: number;
  hostAvgRating: number | null | undefined;
  hostReviewCount: number;
}

export function UserProfileStatsRow({ userId, name, vibersCount, vibingCount, hostAvgRating, hostReviewCount }: Props) {
  return (
    <View style={s.statsRow}>
      <Pressable
        style={s.statItem}
        android_ripple={null}
        onPress={() =>
          router.push({
            pathname: "/(profile)/follows",
            params: {
              userId,
              type: "followers",
              name: encodeURIComponent(name ?? ""),
              vibersCount,
              vibingCount,
            },
          } as any)
        }
      >
        <Text style={s.statValue}>{vibersCount}</Text>
        <Text style={s.statLabel}>Vibers</Text>
      </Pressable>
      <View style={s.statDivider} />
      <Pressable
        style={s.statItem}
        android_ripple={null}
        onPress={() =>
          router.push({
            pathname: "/(profile)/follows",
            params: {
              userId,
              type: "following",
              name: encodeURIComponent(name ?? ""),
              vibersCount,
              vibingCount,
            },
          } as any)
        }
      >
        <Text style={s.statValue}>{vibingCount}</Text>
        <Text style={s.statLabel}>Vibing</Text>
      </Pressable>
      <View style={s.statDivider} />
      <Pressable
        style={s.statItem}
        android_ripple={null}
        onPress={() =>
          router.push({
            pathname: "/(profile)/host-reviews",
            params: { id: userId, name: encodeURIComponent(name ?? "") },
          } as any)
        }
      >
        <View style={s.ratingRow}>
          <Text style={s.statValue}>{hostAvgRating != null ? hostAvgRating.toFixed(1) : "—"}</Text>
        </View>
        <Text style={s.statLabel}>
          {hostReviewCount} review{hostReviewCount === 1 ? "" : "s"}
        </Text>
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 14,
    gap: 0,
  },
  statItem: { alignItems: "center", paddingHorizontal: 20, paddingVertical: 6 },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: 3 },
  statValue: {
    fontFamily: FontFamily.headingBold,
    fontSize: 18,
    color: Colors.inkPrimary,
  },
  statLabel: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 12,
    color: Colors.inkSecondary,
    marginTop: 1,
  },
  statDivider: { width: 1, height: 28, backgroundColor: Colors.divider },
});
