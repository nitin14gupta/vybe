import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { List, Map, Plus, Search } from "lucide-react-native";
import { Colors, FontFamily, FILTER_CHIPS } from "@/constants";
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
          <Search size={16} color="#fff" strokeWidth={2} />
        </Pressable>
        <Pressable
          style={styles.addBtn}
          onPress={() => { hTap(); onCreate() }}
          hitSlop={8}
        >
          <Plus size={18} color="#fff" strokeWidth={2.5} />
        </Pressable>
      </View>
    </View>
  );
}

export function ListModeHeader({
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
    <View style={[styles.listHeader, { paddingTop }]}>
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
          <Plus size={18} color="#fff" strokeWidth={2.5} />
        </Pressable>
      </View>
    </View>
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
    color: "#fff",
    letterSpacing: -0.3,
  },
  floatActions: { flexDirection: "row", alignItems: "center", gap: 8 },
  addBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.brandOrange,
    alignItems: "center",
    justifyContent: "center",
  },
  searchBtnLight: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.14)",
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
  },
  listHeaderTitle: {
    fontFamily: FontFamily.headingBold,
    fontSize: 22,
    color: Colors.inkPrimary,
    letterSpacing: -0.3,
  },
  chipsScroll: { flexGrow: 0, flexShrink: 0 },
  chipsRow: { paddingHorizontal: 16, paddingVertical: 10, gap: 8, alignItems: 'center' },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    backgroundColor: Colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.divider,
  },
  filterChipActive: { backgroundColor: Colors.brandOrange, borderColor: Colors.brandOrange },
  filterChipText: { fontFamily: FontFamily.bodyMedium, fontSize: 13, color: Colors.inkSecondary },
  filterChipTextActive: { color: "#fff", fontFamily: FontFamily.bodySemiBold },
});
