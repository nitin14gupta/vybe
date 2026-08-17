import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Flame, Plus } from "lucide-react-native";
import { Colors, FontFamily } from "@/constants";
import { PrimaryButton } from "@/components/ui";
import { hTap } from "@/lib/haptics";

export function MapErrorOverlay({ onRetry }: { onRetry: () => void }) {
  return (
    <View style={styles.mapEmpty} pointerEvents="box-none">
      <View style={styles.mapEmptyCard}>
        <Text style={styles.mapEmptyTitle}>Couldn't load events</Text>
        <PrimaryButton label="Retry" size="small" style={styles.mapEmptyCta} onPress={() => { hTap(); onRetry() }} />
      </View>
    </View>
  );
}

export function MapEmptyOverlay({ onCreate }: { onCreate: () => void }) {
  return (
    <View style={styles.mapEmpty} pointerEvents="box-none">
      <View style={styles.mapEmptyCard}>
        <Flame size={28} color={Colors.inkDisabled} strokeWidth={1.5} />
        <Text style={styles.mapEmptyTitle}>No events nearby</Text>
        <PrimaryButton
          label="Create one"
          size="small"
          style={styles.mapEmptyCta}
          onPress={onCreate}
        />
      </View>
    </View>
  );
}

export function ListErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <View style={[styles.listEmpty, { flex: 1 }]}>
      <Text style={styles.listEmptyTitle}>Couldn't load events</Text>
      <Text style={styles.listEmptySub}>Check your connection and try again</Text>
      <PrimaryButton label="Retry" size="small" style={styles.listEmptyCta} onPress={() => { hTap(); onRetry() }} />
    </View>
  );
}

export function ListEmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <View style={[styles.listEmpty, { flex: 1 }]}>
      <Flame size={48} color={Colors.inkDisabled} strokeWidth={1.2} />
      <Text style={styles.listEmptyTitle}>No events nearby yet</Text>
      <Text style={styles.listEmptySub}>Be the first to host one</Text>
      <PrimaryButton
        label="Create Event"
        size="small"
        style={styles.listEmptyCta}
        icon={<Plus size={16} color={Colors.background} strokeWidth={2.5} />}
        onPress={onCreate}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  mapEmpty: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  mapEmptyCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    gap: 10,
    marginHorizontal: 40,
  },
  mapEmptyTitle: { fontFamily: FontFamily.headingBold, fontSize: 16, color: Colors.inkPrimary },
  mapEmptyCta: { marginTop: 4 },
  listEmpty: { flex: 1, alignItems: "center", justifyContent: "center", gap: 10 },
  listEmptyTitle: { fontFamily: FontFamily.headingBold, fontSize: 20, color: Colors.inkPrimary },
  listEmptySub: { fontFamily: FontFamily.bodyRegular, fontSize: 14, color: Colors.inkSecondary },
  listEmptyCta: { marginTop: 8 },
});
