import { Pressable, View, StyleSheet } from "react-native";
import { ArrowLeft, MoreVertical } from "lucide-react-native";
import { hTap } from "@/lib/haptics";

interface Props {
  topInset: number;
  onBack: () => void;
  onMenu: () => void;
}

export function ProfileHeaderBar({ topInset, onBack, onMenu }: Props) {
  return (
    <View style={[s.headerOverlay, { paddingTop: topInset + 8 }]}>
      <Pressable onPress={onBack} style={s.headerCircleBtn} hitSlop={8}>
        <ArrowLeft size={20} color="#fff" strokeWidth={2.2} />
      </Pressable>
      <Pressable
        onPress={() => {
          hTap();
          onMenu();
        }}
        style={s.headerCircleBtn}
        hitSlop={8}
      >
        <MoreVertical size={20} color="#fff" strokeWidth={1.8} />
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  headerOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    zIndex: 10,
  },
  headerCircleBtn: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
  },
});
