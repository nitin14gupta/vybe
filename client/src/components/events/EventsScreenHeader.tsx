import React from "react";
import { Animated, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { List, Map, Plus, Search } from "lucide-react-native";
import { Colors, FontFamily, FILTER_CHIPS, withOpacity } from '@/constants';
import { hSelection, hTap } from "@/lib/haptics";
import { TabSwitcher } from "@/components/ui";

export function ViewModeTogglePill({
  viewMode,
  onChange,
}: {
  viewMode: "map" | "list";
  onChange: (mode: "map" | "list") => void;
}) {
  return (
    <TabSwitcher
      tabs={[
        { key: "map", label: "Map", icon: (active) => <Map size={13} color={active ? Colors.inkOnAccent : Colors.inkSecondary} strokeWidth={2} /> },
        { key: "list", label: "List", icon: (active) => <List size={13} color={active ? Colors.inkOnAccent : Colors.inkSecondary} strokeWidth={2} /> },
      ]}
      activeTab={viewMode}
      onChange={(key) => { hSelection(); onChange(key as "map" | "list") }}
      fill={false}
    />
  );
}

export function MapFloatingHeader({
  paddingTop,
  togglePill,
  onSearch,
  onCreate,
}: {
  paddingTop: number;
  togglePill: React.ReactNode;
  onSearch: () => void;
  onCreate: () => void;
}) {
  return (
    <View style={[styles.floatHeader, { paddingTop }]} pointerEvents="box-none">
      <Text style={styles.floatTitle}>Events</Text>
      <View style={styles.floatActions}>
        {togglePill}
        <Pressable
          style={styles.searchBtnLight}
          onPress={() => { hTap(); onSearch() }}
          hitSlop={8}
        >
          <Search size={16} color={Colors.white} strokeWidth={2} />
        </Pressable>
        <Pressable
          style={styles.addBtn}
          onPress={() => { hTap(); onCreate() }}
          hitSlop={8}
        >
          <Plus size={18} color={Colors.background} strokeWidth={2.5} />
        </Pressable>
      </View>
    </View>
  );
}

// Height of ListModeHeader's own content (title row + its padding),
// excluding the safe-area top inset — used by the list screen to pad its
// content below the floating header.
export const LIST_HEADER_CONTENT_HEIGHT = 50;

export function ListModeHeader({
  paddingTop,
  togglePill,
  onSearch,
  onCreate,
  hideProgress,
}: {
  paddingTop: number;
  togglePill: React.ReactNode;
  onSearch: () => void;
  onCreate: () => void;
  // Pass useHeaderAndTabBarScroll()'s `hideProgress` to make this header
  // float over the list and fade/slide away on scroll-down, same as
  // AppHeader elsewhere. Omit for the default static, in-flow header.
  hideProgress?: Animated.Value;
}) {
  const floatingStyle = hideProgress && {
    opacity: hideProgress.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }),
    transform: [
      {
        translateY: hideProgress.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -(paddingTop + LIST_HEADER_CONTENT_HEIGHT)],
        }),
      },
    ],
  };

  return (
    <Animated.View
      style={[
        styles.listHeader,
        { paddingTop },
        hideProgress && styles.listHeaderFloating,
        floatingStyle,
      ]}
      pointerEvents={hideProgress ? "box-none" : "auto"}
    >
      <Text style={styles.listHeaderTitle}>Events</Text>
      <View style={styles.floatActions}>
        {togglePill}
        <Pressable
          style={styles.searchBtnDark}
          onPress={() => { hTap(); onSearch() }}
          hitSlop={8}
        >
          <Search size={16} color={Colors.inkPrimary} strokeWidth={2} />
        </Pressable>
        <Pressable
          style={styles.addBtn}
          onPress={() => { hTap(); onCreate() }}
          hitSlop={8}
        >
          <Plus size={18} color={Colors.background} strokeWidth={2.5} />
        </Pressable>
      </View>
    </Animated.View>
  );
}

export function FilterChipsRow({
  activeChip,
  onSelect,
}: {
  activeChip: string;
  onSelect: (key: string) => void;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.chipsScroll}
      contentContainerStyle={styles.chipsRow}
    >
      {FILTER_CHIPS.map((chip) => (
        <Pressable
          key={chip.key}
          onPress={() => { hSelection(); onSelect(chip.key) }}
          style={[styles.filterChip, activeChip === chip.key && styles.filterChipActive]}
        >
          <Text
            style={[styles.filterChipText, activeChip === chip.key && styles.filterChipTextActive]}
          >
            {chip.label}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  floatHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  floatTitle: {
    fontFamily: FontFamily.headingBold,
    fontSize: 22,
    color: Colors.white,
    letterSpacing: -0.3,
  },
  floatActions: { flexDirection: "row", alignItems: "center", gap: 8 },
  addBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.inkPrimary,
    alignItems: "center",
    justifyContent: "center",
  },
  searchBtnLight: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: withOpacity(Colors.white, 0.14),
    alignItems: "center",
    justifyContent: "center",
  },
  searchBtnDark: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.divider,
    alignItems: "center",
    justifyContent: "center",
  },
  listHeader: {
    backgroundColor: Colors.background,
    paddingHorizontal: 16,
    paddingBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    zIndex: 10,
  },
  listHeaderFloating: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
  },
  listHeaderTitle: {
    fontFamily: FontFamily.headingBold,
    fontSize: 22,
    color: Colors.inkPrimary,
    letterSpacing: -0.3,
  },
  chipsScroll: { flexGrow: 0, flexShrink: 0, backgroundColor: 'transparent' },
  chipsRow: { paddingHorizontal: 16, paddingVertical: 10, gap: 8, alignItems: 'center', backgroundColor: 'transparent' },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    backgroundColor: Colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.divider,
  },
  filterChipActive: { backgroundColor: Colors.inkPrimary, borderColor: Colors.inkPrimary },
  filterChipText: { fontFamily: FontFamily.bodyMedium, fontSize: 13, color: Colors.inkSecondary },
  filterChipTextActive: { color: Colors.background, fontFamily: FontFamily.bodySemiBold },
});
