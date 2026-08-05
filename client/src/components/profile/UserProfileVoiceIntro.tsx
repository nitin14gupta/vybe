import { View, Text, StyleSheet } from "react-native";
import { PlaybackWave, VoicePlayButton } from "@/components/ui";
import { Colors, FontFamily, Radius } from "@/constants";

interface Props {
  playing: boolean;
  onTogglePlay: () => void;
}

export function UserProfileVoiceIntro({ playing, onTogglePlay }: Props) {
  return (
    <View style={s.voiceCard}>
      <VoicePlayButton playing={playing} onPress={onTogglePlay} />
      <View style={s.voiceWave}>
        <PlaybackWave isActive={playing} compact />
      </View>
      <Text style={s.voiceLabel}>Voice intro</Text>
    </View>
  );
}

const s = StyleSheet.create({
  voiceCard: {
    marginTop: 4,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: Colors.surface,
    borderRadius: Radius.card,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  voiceWave: { flex: 1, overflow: "hidden" },
  voiceLabel: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 12,
    color: Colors.inkDisabled,
  },
});
