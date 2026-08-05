import { View, Text, StyleSheet } from "react-native";
import { Ban } from "lucide-react-native";
import { Colors, FontFamily } from "@/constants";
import { OutlineButton } from "@/components/ui";
import { hSuccess } from "@/lib/haptics";

interface Props {
  onUnblock: () => void;
}

export function UserProfileBlockedOverlay({ onUnblock }: Props) {
  return (
    <View style={s.blockedOverlay}>
      <View style={s.blockedIconWrap}>
        <Ban size={36} color={Colors.inkSecondary} strokeWidth={1.5} />
      </View>
      <Text style={s.blockedTitle}>You've blocked this account</Text>
      <Text style={s.blockedSub}>Unblock to see their profile and content</Text>
      <OutlineButton
        label="Unblock"
        size="small"
        style={s.unblockBtn}
        onPress={() => {
          hSuccess();
          onUnblock();
        }}
      />
    </View>
  );
}

const s = StyleSheet.create({
  blockedOverlay: {
    alignItems: "center",
    paddingVertical: 32,
    gap: 10,
  },
  blockedIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#2a2a2a",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  blockedTitle: {
    fontFamily: FontFamily.headingBold,
    fontSize: 18,
    color: Colors.inkPrimary,
    textAlign: "center",
  },
  blockedSub: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 14,
    color: Colors.inkSecondary,
    textAlign: "center",
  },
  unblockBtn: { marginTop: 8 },
});
