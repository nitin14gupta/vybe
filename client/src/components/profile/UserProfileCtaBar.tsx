import { View, Text, Pressable, StyleSheet } from "react-native";
import { Flame, UserPlus, UserCheck, MessageCircle, Check } from "lucide-react-native";
import { Colors, FontFamily, withOpacity } from '@/constants';
import { PrimaryButton } from "@/components/ui";
import { hTap } from "@/lib/haptics";
import { CooldownPill } from "./CooldownPill";

interface Props {
  insetsBottom: number;
  isConnected: boolean;
  theySentVibe: boolean;
  isPending: boolean;
  isCooldown: boolean;
  cooldownUntil?: string | null;
  following: boolean;
  onMessagePress: () => void;
  onAcceptPress: () => void;
  onSendVibePress: () => void;
  onCooldownExpiredPress: () => void;
  onFollowTogglePress: () => void;
}

export function UserProfileCtaBar({
  insetsBottom,
  isConnected,
  theySentVibe,
  isPending,
  isCooldown,
  cooldownUntil,
  following,
  onMessagePress,
  onAcceptPress,
  onSendVibePress,
  onCooldownExpiredPress,
  onFollowTogglePress,
}: Props) {
  return (
    <View style={[s.ctaBar, { paddingBottom: insetsBottom + 8 }]}>
      {isConnected ? (
        <View style={{ flex: 1 }}>
          <PrimaryButton
            label="Message"
            icon={<MessageCircle size={18} color={Colors.background} strokeWidth={2} />}
            onPress={onMessagePress}
          />
        </View>
      ) : theySentVibe ? (
        <View style={{ flex: 1.6 }}>
          <PrimaryButton
            label="Accept Vibe"
            icon={<Check size={18} color={Colors.background} strokeWidth={2.5} />}
            onPress={onAcceptPress}
          />
        </View>
      ) : isPending ? (
        <Pressable style={[s.ctaBtn, s.ctaBtnPending]} disabled>
          <Flame size={18} color={Colors.inkSecondary} fill="transparent" strokeWidth={1.8} />
          <Text style={s.ctaBtnPendingText}>Vibe Sent</Text>
        </Pressable>
      ) : isCooldown && cooldownUntil ? (
        <CooldownPill cooldownUntil={cooldownUntil} onExpiredPress={onCooldownExpiredPress} />
      ) : (
        <View style={{ flex: 1.6 }}>
          <PrimaryButton
            label="Send Vibe"
            icon={<Flame size={18} color={Colors.background} fill={Colors.background} strokeWidth={2} />}
            onPress={onSendVibePress}
          />
        </View>
      )}

      <Pressable
        style={[s.ctaBtn, s.ctaBtnSecondary, following && s.ctaBtnFollowing]}
        onPress={() => {
          hTap();
          onFollowTogglePress();
        }}
      >
        {following ? (
          <UserCheck size={18} color={Colors.brandOrange} strokeWidth={1.8} />
        ) : (
          <UserPlus size={18} color={Colors.inkPrimary} strokeWidth={1.8} />
        )}
        <Text style={[s.ctaBtnSecondaryText, following && s.ctaBtnFollowingText]}>
          {following ? "Following" : "Follow"}
        </Text>
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  ctaBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 16,
    backgroundColor: Colors.background,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: withOpacity(Colors.inkPrimary, 0.08),
  },
  ctaBtn: {
    height: 52,
    borderRadius: 26,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  ctaBtnSecondary: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: Colors.divider,
    backgroundColor: "transparent",
  },
  ctaBtnSecondaryText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 15,
    color: Colors.inkPrimary,
  },
  ctaBtnPending: {
    flex: 1.6,
    backgroundColor: Colors.elevated,
  },
  ctaBtnPendingText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 16,
    color: Colors.inkSecondary,
  },
  ctaBtnFollowing: { borderColor: Colors.brandOrange },
  ctaBtnFollowingText: { color: Colors.brandOrange },
});
