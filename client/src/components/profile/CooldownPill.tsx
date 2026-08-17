import { Pressable, Text, View, StyleSheet } from "react-native";
import { Clock, Flame } from "lucide-react-native";
import { Colors, FontFamily } from "@/constants";
import { PrimaryButton } from "@/components/ui";
import { useCountdown } from "@/hooks/useCountdown";
import { parseServerDate } from "@/lib/dates";

function formatCooldown(seconds: number): string {
  if (seconds <= 0) return "a moment";
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${Math.max(minutes, 1)}m`;
}

interface Props {
  cooldownUntil: string;
  onExpiredPress: () => void;
}

export function CooldownPill({ cooldownUntil, onExpiredPress }: Props) {
  const deadline = parseServerDate(cooldownUntil);
  const initialSeconds = deadline
    ? Math.max(0, Math.round((deadline.getTime() - Date.now()) / 1000))
    : 0;
  const { seconds, isExpired } = useCountdown(initialSeconds);

  if (isExpired) {
    return (
      <View style={{ flex: 1.6 }}>
        <PrimaryButton
          label="Send Vibe"
          onPress={onExpiredPress}
          icon={<Flame size={18} color={Colors.background} fill={Colors.background} strokeWidth={2} />}
        />
      </View>
    );
  }

  return (
    <Pressable style={[s.ctaBtn, s.ctaBtnPending, { borderColor: Colors.divider }]} disabled>
      <Clock size={16} color={Colors.inkDisabled} strokeWidth={1.8} />
      <Text style={[s.ctaBtnPendingText, { fontSize: 14, color: Colors.inkDisabled }]} numberOfLines={1}>
        Try again in {formatCooldown(seconds)}
      </Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  ctaBtn: {
    height: 52,
    borderRadius: 26,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  ctaBtnPending: {
    flex: 1.6,
    backgroundColor: Colors.elevated,
  },
  ctaBtnPendingText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 16,
    color: Colors.inkDisabled,
  },
});
