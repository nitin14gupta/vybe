import { View, Text, Image, StyleSheet } from "react-native";
import { Colors, FontFamily } from "@/constants";

interface Props {
  name: string | null | undefined;
  age: number | null;
  username?: string | null;
  city?: string | null;
  mutualCount: number;
  hostBadgeImage: any;
}

export function ProfileNameHeader({ name, age, username, city, mutualCount, hostBadgeImage }: Props) {
  return (
    <>
      <View style={s.nameRow}>
        <View style={s.nameWithBadge}>
          <Text style={s.name} numberOfLines={1}>
            {name ?? "User"}
            {age ? `, ${age}` : ""}
          </Text>
          {hostBadgeImage && (
            <Image source={hostBadgeImage} style={[s.hostBadgeIcon, { width: 24, height: 24 }]} resizeMode="contain" />
          )}
        </View>
        {mutualCount > 0 && <Text style={s.mutual}>{mutualCount} mutual</Text>}
      </View>
      {username ? <Text style={s.username}>@{username}</Text> : null}
      {city ? <Text style={s.city}>{city}</Text> : null}
    </>
  );
}

const s = StyleSheet.create({
  nameRow: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    gap: 10,
  },
  nameWithBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexShrink: 1,
  },
  name: {
    fontFamily: FontFamily.headingBold,
    fontSize: 26,
    color: Colors.inkPrimary,
  },
  hostBadgeIcon: { marginLeft: -2 },
  mutual: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 12,
    color: Colors.inkSecondary,
  },
  username: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 13,
    color: Colors.inkSecondary,
    marginTop: -6,
  },
  city: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 14,
    color: Colors.inkSecondary,
    marginTop: -10,
  },
});
