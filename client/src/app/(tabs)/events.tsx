import React, { useCallback, useRef, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  BackHandler,
  Dimensions,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Alert,
  Linking,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { HomeGradientBackdrop } from "@/components/home/HomeGradientBackdrop";
import { EventsMapView } from "@/components/maps";
import { useFocusEffect, useRouter } from "expo-router";
import { Flame, List, Map, Plus, Search } from "lucide-react-native";
import { hTap, hSelection } from "@/lib/haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { Colors, FontFamily, FILTER_CHIPS, EVENT_ICONS, EVENT_ICON_FALLBACK } from "@/constants";
import { useEvents } from "@/hooks/useEvents";
import type { EventSummary } from "@/api/apiService";
import { EventCard, formatEventDate } from "@/components/events/EventCard";
import { EventSearchModal } from "@/components/events/EventSearchModal";
import { LocationWarning, CreateEventSheet, PrimaryButton, TabSwitcher, EventListCard, ViewModeToggle } from "@/components/ui";
import { usePermissionSheetStore } from "@/store/permissionSheetStore";
import { useEventViewModeStore } from "@/store/eventViewModeStore";

const { width: W } = Dimensions.get("window");
const CARD_W = 268;
const CARD_MARGIN = 10;
const PREVIEW_MAX = 8;
const LIST_PAGE = 8;


function formatPrice(price: number, isFree: boolean) {
  if (isFree) return "Free";
  return `₹${price}`;
}

// ── Preview card (map mode bottom strip) ────────────────────────────────────

function PreviewCard({
  event,
  active,
  onPress,
}: {
  event: EventSummary;
  active: boolean;
  onPress: () => void;
}) {
  const cover = event.cover_photos?.[0]?.url;
  const TypeIcon = EVENT_ICONS[event.event_type] ?? EVENT_ICON_FALLBACK;
  return (
    <Pressable
      style={[styles.previewCard, active && styles.previewCardActive]}
      onPress={onPress}
    >
      <View style={styles.previewImageWrap}>
        {cover ? (
          <Image source={{ uri: cover }} style={styles.previewImage} contentFit="cover" />
        ) : (
          <View style={[styles.previewImage, styles.previewPlaceholder]}>
            <TypeIcon size={28} color={Colors.inkDisabled} strokeWidth={1.5} />
          </View>
        )}
        <View style={styles.previewPriceBadge}>
          <Text style={[styles.previewPriceText, event.is_free && { color: Colors.accentGreen }]}>
            {formatPrice(event.price_inr, event.is_free)}
          </Text>
        </View>
        {event.host_name && !event.host_is_deleted ? (
          <View style={styles.previewHostPill}>
            {event.host_avatar ? (
              <Image source={{ uri: event.host_avatar }} style={styles.previewHostAvatar} />
            ) : (
              <View style={[styles.previewHostAvatar, styles.previewHostAvatarFallback]}>
                <Text style={styles.previewHostInitial}>{event.host_name.charAt(0).toUpperCase()}</Text>
              </View>
            )}
            <Text style={styles.previewHostText} numberOfLines={1}>{event.host_name}</Text>
          </View>
        ) : null}
      </View>
      <View style={styles.previewBody}>
        <Text style={styles.previewTitle} numberOfLines={2}>{event.title}</Text>
        <Text style={styles.previewMeta} numberOfLines={1}>{formatEventDate(event.date_time)}</Text>
        {event.distance_km != null && (
          <Text style={styles.previewDist}>{event.distance_km} km away</Text>
        )}
      </View>
    </Pressable>
  );
}

// "N more events" tail card in preview strip
function MoreCard({ count, onPress }: { count: number; onPress: () => void }) {
  return (
    <Pressable style={styles.moreCard} onPress={onPress}>
      <Text style={styles.moreCount}>+{count}</Text>
      <Text style={styles.moreLabel}>more{"\n"}events</Text>
    </Pressable>
  );
}

// ── List event card — uses shared EventCard component ────────────────────────

// ── Main screen ──────────────────────────────────────────────────────────────

export default function EventsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { events, loading, error, filters, setFilter, reload, loadInBounds, userLat, userLng, userHeading, locationStatus } = useEvents();
  const [viewMode, setViewModeState] = useState<"map" | "list">("map");

  useEffect(() => {
    AsyncStorage.getItem("events_view_mode").then((mode) => {
      if (mode === "list" || mode === "map") {
        setViewModeState(mode);
      }
    });
  }, []);

  const setViewMode = (mode: "map" | "list") => {
    setViewModeState(mode);
    AsyncStorage.setItem("events_view_mode", mode).catch(() => {});
  };
  const [activeEventId, setActiveEventId] = useState<string | null>(null);
  const [listCount, setListCount] = useState(LIST_PAGE);
  const cardViewMode = useEventViewModeStore((s) => s.mode);
  const setCardViewMode = useEventViewModeStore((s) => s.setMode);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const previewListRef = useRef<FlatList>(null);

  // Events tab back → navigate to discover tab
  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener("hardwareBackPress", () => {
        router.navigate("/(tabs)/");
        return true;
      });
      return () => sub.remove();
    }, []),
  );

  const permissionSheet = usePermissionSheetStore();

  useFocusEffect(
    useCallback(() => {
      if (locationStatus === 'denied') {
        permissionSheet.show(
          "Location Required",
          "We need your location to show events happening nearby. Please enable it in Settings."
        );
      }
    }, [locationStatus])
  );

  const hasError = !loading && !!error;
  const activeChip = filters.category
    ? filters.category
    : filters.is_free
      ? "free"
      : filters.date_range === "tonight"
        ? "tonight"
        : filters.date_range === "weekend"
          ? "weekend"
          : "all";

  const handleChip = (key: string) => {
    if (key === "all") {
      setFilter({ category: undefined, is_free: undefined, date_range: undefined });
    } else if (key === "free") {
      setFilter({ is_free: true, category: undefined, date_range: undefined });
    } else if (key === "tonight") {
      setFilter({ date_range: "tonight", category: undefined, is_free: undefined });
    } else if (key === "weekend") {
      setFilter({ date_range: "weekend", category: undefined, is_free: undefined });
    } else {
      setFilter({ category: key, is_free: undefined, date_range: undefined });
    }
  };

  const handleMarkerPress = useCallback(
    (ev: EventSummary, idx: number) => {
      setActiveEventId(ev.id);
      const clampedIdx = Math.min(idx, PREVIEW_MAX - 1);
      previewListRef.current?.scrollToIndex({
        index: clampedIdx,
        animated: true,
        viewPosition: 0.5,
      });
    },
    [],
  );

  const openEvent = (id: string) => router.push(`/(events)/${id}` as any);
  const isEmpty = !loading && !error && events.length === 0;
  const previewEvents = events.slice(0, PREVIEW_MAX);
  const extraCount = events.length - PREVIEW_MAX;

  // Shared toggle pill used in both map and list header
  const togglePill = (
    <TabSwitcher
      tabs={[
        { key: "map", label: "Map", icon: (active) => <Map size={13} color={active ? Colors.inkOnAccent : Colors.inkSecondary} strokeWidth={2} /> },
        { key: "list", label: "List", icon: (active) => <List size={13} color={active ? Colors.inkOnAccent : Colors.inkSecondary} strokeWidth={2} /> },
      ]}
      activeTab={viewMode}
      onChange={(key) => { hSelection(); setViewMode(key as "map" | "list") }}
      fill={false}
    />
  );

  // ── MAP VIEW — fullscreen ────────────────────────────────────────────────────

  if (viewMode === "map") {
    return (
      <View style={styles.root}>
        {/* Full-bleed map */}
        <EventsMapView
          events={events}
          userLat={userLat}
          userLng={userLng}
          userHeading={userHeading}
          activeEventId={activeEventId}
          onEventSelect={handleMarkerPress}
          onBoundsChange={loadInBounds}
          style={{ flex: 1 }}
        />

        {/* Aurora glow — same backdrop colors as home, dialed way down so it reads as a soft overlay, not a cover over the map */}
        <HomeGradientBackdrop opacity={0.28} height={insets.top + 110} />
        <LinearGradient
          colors={[Colors.brandCoral, "transparent"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.leftGlow}
          pointerEvents="none"
        />
        <LinearGradient
          colors={[Colors.brandOrange, "transparent"]}
          start={{ x: 1, y: 0 }}
          end={{ x: 0, y: 0 }}
          style={styles.rightGlow}
          pointerEvents="none"
        />

        <LocationWarning />

        {/* Floating header */}
        <View style={[styles.floatHeader, { paddingTop: insets.top + 6 }]} pointerEvents="box-none">
          <Text style={styles.floatTitle}>Events</Text>
          <View style={styles.floatActions}>
            {togglePill}
            <Pressable
              style={styles.searchBtnLight}
              onPress={() => { hTap(); setSearchModalOpen(true) }}
              hitSlop={8}
            >
              <Search size={16} color="#fff" strokeWidth={2} />
            </Pressable>
            <Pressable
              style={styles.addBtn}
              onPress={() => { hTap(); setCreateOpen(true) }}
              hitSlop={8}
            >
              <Plus size={18} color="#fff" strokeWidth={2.5} />
            </Pressable>
          </View>
        </View>

        <EventSearchModal
          visible={searchModalOpen}
          onClose={() => setSearchModalOpen(false)}
          nearbyEvents={events}
          lat={userLat}
          lng={userLng}
          nearbyLoading={loading}
        />

        <CreateEventSheet
          visible={createOpen}
          onClose={() => setCreateOpen(false)}
          onCreateEvent={() => router.push("/(events)/create" as any)}
        />

        {/* Error overlay */}
        {error && !loading && (
          <View style={styles.mapEmpty} pointerEvents="box-none">
            <View style={styles.mapEmptyCard}>
              <Text style={styles.mapEmptyTitle}>Couldn't load events</Text>
              <PrimaryButton label="Retry" size="small" style={styles.mapEmptyCta} onPress={() => { hTap(); reload() }} />
            </View>
          </View>
        )}

        {/* No events overlay */}
        {isEmpty && (
          <View style={styles.mapEmpty} pointerEvents="box-none">
            <View style={styles.mapEmptyCard}>
              <Flame size={28} color={Colors.brandOrange} strokeWidth={1.5} />
              <Text style={styles.mapEmptyTitle}>No events nearby</Text>
              <PrimaryButton
                label="Create one"
                size="small"
                style={styles.mapEmptyCta}
                onPress={() => router.push("/(events)/create" as any)}
              />
            </View>
          </View>
        )}

        {/* Preview strip — floats over map with fade gradient */}
        {!isEmpty ? (
          <View style={[styles.previewStrip, { paddingBottom: Math.max(insets.bottom, 8) + 6 }]}>
            <LinearGradient
              colors={['transparent', 'rgba(6,6,6,0.72)', 'rgba(6,6,6,0.94)']}
              style={StyleSheet.absoluteFill}
              pointerEvents="none"
            />
            <FlatList
              ref={previewListRef}
              data={previewEvents}
              horizontal
              keyExtractor={(e) => e.id}
              showsHorizontalScrollIndicator={false}
              snapToInterval={CARD_W + CARD_MARGIN}
              decelerationRate="fast"
              contentContainerStyle={{ paddingHorizontal: 14, gap: CARD_MARGIN }}
              onScrollToIndexFailed={() => { }}
              ListFooterComponent={
                extraCount > 0 ? (
                  <MoreCard count={extraCount} onPress={() => setViewMode("list")} />
                ) : null
              }
              renderItem={({ item }) => (
                <PreviewCard
                  event={item}
                  active={item.id === activeEventId}
                  onPress={() => openEvent(item.id)}
                />
              )}
            />
          </View>
        ) : null}
      </View>
    );
  }

  // ── LIST VIEW ────────────────────────────────────────────────────────────────

  const listEvents = events.slice(0, listCount);
  const hasMore = events.length > listCount;

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={[styles.listHeader, { paddingTop: insets.top + 6 }]}>
        <Text style={styles.listHeaderTitle}>Events</Text>
        <View style={styles.floatActions}>
          {togglePill}
          <Pressable
            style={styles.searchBtnDark}
            onPress={() => { hTap(); setSearchModalOpen(true) }}
            hitSlop={8}
          >
            <Search size={16} color={Colors.inkPrimary} strokeWidth={2} />
          </Pressable>
          <Pressable
            style={styles.addBtn}
            onPress={() => { hTap(); setCreateOpen(true) }}
            hitSlop={8}
          >
            <Plus size={18} color="#fff" strokeWidth={2.5} />
          </Pressable>
        </View>
      </View>

      <EventSearchModal
        visible={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
        nearbyEvents={events}
        lat={userLat}
        lng={userLng}
        nearbyLoading={loading}
      />

      <CreateEventSheet
        visible={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreateEvent={() => router.push("/(events)/create" as any)}
      />

      <LocationWarning />

      {/* Filter chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chipsScroll}
        contentContainerStyle={styles.chipsRow}
      >
        {FILTER_CHIPS.map((chip) => (
          <Pressable
            key={chip.key}
            onPress={() => { hSelection(); handleChip(chip.key) }}
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

      {/* List */}
      {error && !loading ? (
        <View style={[styles.listEmpty, { flex: 1 }]}>
          <Text style={styles.listEmptyTitle}>Couldn't load events</Text>
          <Text style={styles.listEmptySub}>Check your connection and try again</Text>
          <PrimaryButton label="Retry" size="small" style={styles.listEmptyCta} onPress={() => { hTap(); reload() }} />
        </View>
      ) : isEmpty ? (
        <View style={[styles.listEmpty, { flex: 1 }]}>
          <Flame size={48} color={Colors.inkDisabled} strokeWidth={1.2} />
          <Text style={styles.listEmptyTitle}>No events nearby yet</Text>
          <Text style={styles.listEmptySub}>Be the first to host one</Text>
          <PrimaryButton
            label="Create Event"
            size="small"
            style={styles.listEmptyCta}
            icon={<Plus size={16} color={Colors.background} strokeWidth={2.5} />}
            onPress={() => router.push("/(events)/create" as any)}
          />
        </View>
      ) : (
        <FlatList
          data={listEvents}
          keyExtractor={(e) => e.id}
          style={{ flex: 1 }}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={reload} tintColor={Colors.brandOrange} />
          }
          ListFooterComponent={
            hasMore ? (
              <Pressable
                style={styles.loadMoreBtn}
                onPress={() => setListCount((c) => c + LIST_PAGE)}
              >
                <Text style={styles.loadMoreText}>
                  Load {Math.min(events.length - listCount, LIST_PAGE)} more events
                </Text>
              </Pressable>
            ) : events.length > LIST_PAGE ? (
              <Text style={styles.listEndText}>All {events.length} events shown</Text>
            ) : null
          }
          renderItem={({ item }) => (
            cardViewMode === "list" ? (
              <EventListCard event={item} onPress={() => openEvent(item.id)} />
            ) : (
              <EventCard event={item} onPress={() => openEvent(item.id)} />
            )
          )}
        />
      )}

      {!isEmpty && (
        <View style={styles.cardViewToggle}>
          <ViewModeToggle mode={cardViewMode} onChange={setCardViewMode} />
        </View>
      )}
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },

  // Map mode — floating header
  leftGlow: { position: "absolute", top: 0, bottom: 0, left: 0, width: 90, opacity: 0.28 },
  rightGlow: { position: "absolute", top: 0, bottom: 0, right: 0, width: 90, opacity: 0.28 },
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

  // Map empty state
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

  // Preview strip
  previewStrip: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: 32,
  },
  previewCard: {
    width: CARD_W,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  previewCardActive: {
    shadowColor: Colors.brandOrange,
    shadowOpacity: 0.4,
    shadowRadius: 14,
  },
  previewImageWrap: { height: 118 },
  previewImage: { width: "100%", height: "100%" },
  previewPlaceholder: {
    backgroundColor: Colors.elevated,
    alignItems: "center",
    justifyContent: "center",
  },
  previewPriceBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(17,17,17,0.85)",
    borderRadius: 7,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  previewPriceText: {
    color: Colors.brandOrange,
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 12,
  },
  previewHostPill: {
    position: "absolute",
    top: 8,
    left: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(17,17,17,0.72)",
    borderRadius: 16,
    paddingLeft: 3,
    paddingRight: 8,
    paddingVertical: 3,
    maxWidth: "70%",
  },
  previewHostAvatar: { width: 16, height: 16, borderRadius: 8 },
  previewHostAvatarFallback: { backgroundColor: "#2a2a2a", alignItems: "center", justifyContent: "center" },
  previewHostInitial: { fontFamily: FontFamily.headingBold, fontSize: 9, color: "#fff" },
  previewHostText: { fontFamily: FontFamily.bodySemiBold, fontSize: 10, color: "#fff" },
  previewBody: { padding: 10 },
  previewTitle: {
    fontFamily: FontFamily.headingBold,
    fontSize: 13,
    color: Colors.inkPrimary,
    marginBottom: 3,
  },
  previewMeta: { fontFamily: FontFamily.bodyRegular, fontSize: 11, color: Colors.inkSecondary },
  previewDist: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 10,
    color: Colors.inkDisabled,
    marginTop: 2,
  },

  // "+N more" tail card
  moreCard: {
    width: 80,
    height: "100%",
    minHeight: 158,
    backgroundColor: "rgba(255,107,53,0.12)",
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.brandOrange,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  moreCount: {
    fontFamily: FontFamily.headingBold,
    fontSize: 22,
    color: Colors.brandOrange,
  },
  moreLabel: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: 12,
    color: Colors.brandOrange,
    textAlign: "center",
  },

  // List mode header
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

  // Filter chips
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

  // List cards
  listContent: { padding: 16, gap: 16 },

  // List empty
  listEmpty: { flex: 1, alignItems: "center", justifyContent: "center", gap: 10 },
  listEmptyTitle: { fontFamily: FontFamily.headingBold, fontSize: 20, color: Colors.inkPrimary },
  listEmptySub: { fontFamily: FontFamily.bodyRegular, fontSize: 14, color: Colors.inkSecondary },
  listEmptyCta: { marginTop: 8 },

  // Load more / end
  loadMoreBtn: {
    marginTop: 8,
    marginHorizontal: 32,
    paddingVertical: 13,
    backgroundColor: "rgba(255,107,53,0.1)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,107,53,0.25)",
    alignItems: "center",
  },
  loadMoreText: { fontFamily: FontFamily.bodySemiBold, fontSize: 14, color: Colors.brandOrange },
  listEndText: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 13,
    color: Colors.inkDisabled,
    textAlign: "center",
    marginTop: 12,
    marginBottom: 24,
  },

  cardViewToggle: { position: "absolute", right: 16, bottom: 16 },
});