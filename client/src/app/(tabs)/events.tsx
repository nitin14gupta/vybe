import React, { useCallback, useRef, useState } from "react";
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
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { EventsMapView } from "@/components/maps";
import { useFocusEffect, useRouter } from "expo-router";
import { Flame, List, Map, Plus } from "lucide-react-native";
import { hTap, hSelection } from "@/lib/haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { Colors, FontFamily } from "@/constants";
import { useEvents } from "@/hooks/useEvents";
import type { EventSummary } from "@/api/apiService";

const { width: W } = Dimensions.get("window");
const CARD_W = 268;
const CARD_MARGIN = 10;
const PREVIEW_MAX = 8;
const LIST_PAGE = 8;

const EVENT_EMOJIS: Record<string, string> = {
  house_party: "🎉",
  rooftop: "🌆",
  game_night: "🎮",
  dinner: "🍽️",
  music: "🎵",
  other: "🔥",
};

const FILTER_CHIPS = [
  { key: "all", label: "All" },
  { key: "free", label: "Free" },
  { key: "tonight", label: "Tonight" },
  { key: "weekend", label: "Weekend" },
  { key: "music", label: "Music" },
  { key: "dinner", label: "Food" },
  { key: "house_party", label: "Party" },
  { key: "game_night", label: "Games" },
];

function formatDate(iso: string | null | undefined) {
  if (!iso) return "Date TBC";
  const d = new Date(iso.replace(" ", "T").replace(/([+-]\d{2})$/, "$1:00"));
  if (isNaN(d.getTime())) return "Date TBC";
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

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
  return (
    <Pressable
      style={[styles.previewCard, active && styles.previewCardActive]}
      onPress={() => { hTap(); onPress() }}
    >
      <View style={styles.previewImageWrap}>
        {cover ? (
          <Image source={{ uri: cover }} style={styles.previewImage} contentFit="cover" />
        ) : (
          <View style={[styles.previewImage, styles.previewPlaceholder]}>
            <Text style={styles.eventEmoji}>{EVENT_EMOJIS[event.event_type] ?? "🔥"}</Text>
          </View>
        )}
        <View style={styles.previewPriceBadge}>
          <Text style={[styles.previewPriceText, event.is_free && { color: Colors.accentGreen }]}>
            {formatPrice(event.price_inr, event.is_free)}
          </Text>
        </View>
      </View>
      <View style={styles.previewBody}>
        <Text style={styles.previewTitle} numberOfLines={2}>{event.title}</Text>
        <Text style={styles.previewMeta} numberOfLines={1}>{formatDate(event.date_time)}</Text>
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
    <Pressable style={styles.moreCard} onPress={() => { hTap(); onPress() }}>
      <Text style={styles.moreCount}>+{count}</Text>
      <Text style={styles.moreLabel}>more{"\n"}events</Text>
    </Pressable>
  );
}

// ── List event card ──────────────────────────────────────────────────────────

function EventCard({ event, onPress }: { event: EventSummary; onPress: () => void }) {
  const cover = event.cover_photos?.[0]?.url;
  const spotsLow = event.spots_left > 0 && event.spots_left <= 10;
  return (
    <Pressable style={styles.card} onPress={() => { hTap(); onPress() }}>
      {/* 16:9 cover image */}
      <View style={styles.cardImageWrap}>
        {cover ? (
          <Image source={{ uri: cover }} style={StyleSheet.absoluteFill} contentFit="cover" />
        ) : (
          <LinearGradient colors={["#1a1a1a", "#0d0d0d"]} style={[StyleSheet.absoluteFill, styles.cardPlaceholder]}>
            <Text style={styles.cardEmoji}>{EVENT_EMOJIS[event.event_type] ?? "🔥"}</Text>
          </LinearGradient>
        )}
        {/* Bottom gradient for text legibility */}
        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.78)"]}
          style={styles.cardGradient}
          pointerEvents="none"
        />
        {/* Price badge */}
        <View style={[styles.cardPriceBadge, event.is_free && styles.cardPriceBadgeFree]}>
          <Text style={styles.cardPriceText}>{formatPrice(event.price_inr, event.is_free)}</Text>
        </View>
        {/* Title + date over gradient */}
        <View style={styles.cardFooter}>
          <Text style={styles.cardTitle} numberOfLines={2}>{event.title}</Text>
          <Text style={styles.cardDate}>{formatDate(event.date_time)}</Text>
        </View>
      </View>

      {/* Meta row */}
      <View style={styles.cardMeta}>
        <View style={styles.cardMetaLeft}>
          <Text style={styles.cardType}>{EVENT_EMOJIS[event.event_type] ?? "🔥"} {event.event_type.replace("_", " ")}</Text>
          {event.location_name ? (
            <Text style={styles.cardLocation} numberOfLines={1}>📍 {event.location_name}</Text>
          ) : null}
        </View>
        <View style={styles.cardMetaRight}>
          {event.distance_km != null && (
            <Text style={styles.cardDist}>{event.distance_km} km</Text>
          )}
          <Text style={styles.cardAttendees}>{event.attendee_count} going</Text>
        </View>
      </View>

      {spotsLow && (
        <View style={styles.cardSpotsBar}>
          <Text style={styles.cardSpotsText}>🔥 Only {event.spots_left} spots left</Text>
        </View>
      )}
    </Pressable>
  );
}

// ── Main screen ──────────────────────────────────────────────────────────────

export default function EventsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { events, loading, error, filters, setFilter, reload, loadInBounds, userLat, userLng } = useEvents();
  const [viewMode, setViewMode] = useState<"map" | "list">("map");
  const [activeEventId, setActiveEventId] = useState<string | null>(null);
  const [listCount, setListCount] = useState(LIST_PAGE);
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
      setFilter("category", undefined);
      setFilter("is_free", undefined);
      setFilter("date_range", undefined);
    } else if (key === "free") {
      setFilter("is_free", true);
      setFilter("category", undefined);
      setFilter("date_range", undefined);
    } else if (key === "tonight") {
      setFilter("date_range", "tonight");
      setFilter("category", undefined);
      setFilter("is_free", undefined);
    } else if (key === "weekend") {
      setFilter("date_range", "weekend");
      setFilter("category", undefined);
      setFilter("is_free", undefined);
    } else {
      setFilter("category", key);
      setFilter("is_free", undefined);
      setFilter("date_range", undefined);
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
    <View style={styles.togglePill}>
      <Pressable
        onPress={() => { hSelection(); setViewMode("map") }}
        style={[styles.toggleBtn, viewMode === "map" && styles.toggleBtnActive]}
      >
        <Map size={13} color={viewMode === "map" ? "#fff" : Colors.inkSecondary} strokeWidth={2} />
        <Text style={[styles.toggleLabel, viewMode === "map" && styles.toggleLabelActive]}>Map</Text>
      </Pressable>
      <Pressable
        onPress={() => { hSelection(); setViewMode("list") }}
        style={[styles.toggleBtn, viewMode === "list" && styles.toggleBtnActive]}
      >
        <List size={13} color={viewMode === "list" ? "#fff" : Colors.inkSecondary} strokeWidth={2} />
        <Text style={[styles.toggleLabel, viewMode === "list" && styles.toggleLabelActive]}>List</Text>
      </Pressable>
    </View>
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
          activeEventId={activeEventId}
          onEventSelect={handleMarkerPress}
          onBoundsChange={loadInBounds}
          style={{ flex: 1 }}
        />

        {/* Gradient at top so header text is readable over map tiles */}
        <LinearGradient
          colors={["rgba(10,10,10,0.9)", "rgba(10,10,10,0.45)", "transparent"]}
          style={[styles.topGradient, { height: insets.top + 92 }]}
          pointerEvents="none"
        />

        {/* Floating header */}
        <View style={[styles.floatHeader, { paddingTop: insets.top + 6 }]} pointerEvents="box-none">
          <Text style={styles.floatTitle}>Events</Text>
          <View style={styles.floatActions}>
            {togglePill}
            <Pressable
              style={styles.addBtn}
              onPress={() => { hTap(); router.push("/(tabs)/create" as any) }}
              hitSlop={8}
            >
              <Plus size={18} color="#fff" strokeWidth={2.5} />
            </Pressable>
          </View>
        </View>

        {/* Error overlay */}
        {error && !loading && (
          <View style={styles.mapEmpty} pointerEvents="box-none">
            <View style={styles.mapEmptyCard}>
              <Text style={styles.mapEmptyTitle}>Couldn't load events</Text>
              <Pressable onPress={() => { hTap(); reload() }} style={styles.mapEmptyCta}>
                <Text style={styles.mapEmptyCtaText}>Retry</Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* No events overlay */}
        {isEmpty && (
          <View style={styles.mapEmpty} pointerEvents="box-none">
            <View style={styles.mapEmptyCard}>
              <Flame size={28} color={Colors.brandOrange} strokeWidth={1.5} />
              <Text style={styles.mapEmptyTitle}>No events nearby</Text>
              <Pressable
                onPress={() => { hTap(); router.push("/(tabs)/create" as any) }}
                style={styles.mapEmptyCta}
              >
                <Text style={styles.mapEmptyCtaText}>Create one</Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* Preview strip — bottom frosted bar */}
        {!isEmpty && (
          <View style={[styles.previewStrip, { paddingBottom: Math.max(insets.bottom, 8) + 6 }]}>
            <FlatList
              ref={previewListRef}
              data={previewEvents}
              horizontal
              keyExtractor={(e) => e.id}
              showsHorizontalScrollIndicator={false}
              snapToInterval={CARD_W + CARD_MARGIN}
              decelerationRate="fast"
              contentContainerStyle={{ paddingHorizontal: 14, gap: CARD_MARGIN }}
              onScrollToIndexFailed={() => {}}
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
        )}
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
            style={styles.addBtn}
            onPress={() => router.push("/(tabs)/create" as any)}
            hitSlop={8}
          >
            <Plus size={18} color="#fff" strokeWidth={2.5} />
          </Pressable>
        </View>
      </View>

      {/* Filter chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
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
        <View style={styles.listEmpty}>
          <Text style={styles.listEmptyTitle}>Couldn't load events</Text>
          <Text style={styles.listEmptySub}>Check your connection and try again</Text>
          <Pressable onPress={() => { hTap(); reload() }} style={styles.listEmptyCta}>
            <Text style={styles.listEmptyCtaText}>Retry</Text>
          </Pressable>
        </View>
      ) : isEmpty ? (
        <View style={styles.listEmpty}>
          <Flame size={48} color={Colors.inkDisabled} strokeWidth={1.2} />
          <Text style={styles.listEmptyTitle}>No events nearby yet</Text>
          <Text style={styles.listEmptySub}>Be the first to host one</Text>
          <Pressable
            onPress={() => router.push("/(tabs)/create" as any)}
            style={styles.listEmptyCta}
          >
            <Plus size={16} color={Colors.brandOrange} />
            <Text style={styles.listEmptyCtaText}>Create Event</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={listEvents}
          keyExtractor={(e) => e.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={reload} tintColor={Colors.brandOrange} />
          }
          ListFooterComponent={
            hasMore ? (
              <Pressable
                style={styles.loadMoreBtn}
                onPress={() => { hTap(); setListCount((c) => c + LIST_PAGE) }}
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
            <EventCard event={item} onPress={() => openEvent(item.id)} />
          )}
        />
      )}
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },

  // Map mode — floating header
  topGradient: { position: "absolute", top: 0, left: 0, right: 0 },
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

  // Toggle pill (shared map + list)
  togglePill: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 10,
    padding: 3,
    gap: 2,
  },
  toggleBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  toggleBtnActive: { backgroundColor: Colors.brandOrange },
  toggleLabel: { fontFamily: FontFamily.bodyMedium, fontSize: 12, color: Colors.inkSecondary },
  toggleLabelActive: { color: "#fff", fontFamily: FontFamily.bodySemiBold },

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
  mapEmptyCta: {
    backgroundColor: Colors.brandOrange,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 4,
  },
  mapEmptyCtaText: { color: "#fff", fontFamily: FontFamily.bodySemiBold, fontSize: 14 },

  // Preview strip
  previewStrip: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: 10,
    backgroundColor: "rgba(12,12,12,0.82)",
  },
  previewCard: {
    width: CARD_W,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.divider,
  },
  previewCardActive: { borderColor: Colors.brandOrange, borderWidth: 2 },
  previewImageWrap: { height: 118 },
  previewImage: { width: "100%", height: "100%" },
  previewPlaceholder: {
    backgroundColor: Colors.elevated,
    alignItems: "center",
    justifyContent: "center",
  },
  eventEmoji: { fontSize: 34 },
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
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  listHeaderTitle: {
    fontFamily: FontFamily.headingBold,
    fontSize: 22,
    color: Colors.inkPrimary,
    letterSpacing: -0.3,
  },

  // Filter chips
  chipsRow: { paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
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
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  cardImageWrap: { width: "100%", aspectRatio: 16 / 9, position: "relative", overflow: "hidden" },
  cardPlaceholder: { alignItems: "center", justifyContent: "center" },
  cardEmoji: { fontSize: 52, textAlign: "center" },
  cardGradient: { position: "absolute", bottom: 0, left: 0, right: 0, height: 120 },
  cardPriceBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: Colors.brandOrange,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  cardPriceBadgeFree: { backgroundColor: Colors.accentGreen },
  cardPriceText: { fontFamily: FontFamily.bodySemiBold, fontSize: 13, color: "#fff" },
  cardFooter: { position: "absolute", bottom: 0, left: 0, right: 0, padding: 14 },
  cardTitle: { fontFamily: FontFamily.headingBold, fontSize: 16, color: "#fff", lineHeight: 21 },
  cardDate: { fontFamily: FontFamily.bodyRegular, fontSize: 12, color: "rgba(255,255,255,0.75)", marginTop: 3 },
  cardMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 8,
  },
  cardMetaLeft: { flex: 1, gap: 3 },
  cardMetaRight: { alignItems: "flex-end", gap: 3 },
  cardType: { fontFamily: FontFamily.bodyMedium, fontSize: 12, color: Colors.inkSecondary, textTransform: "capitalize" },
  cardLocation: { fontFamily: FontFamily.bodyRegular, fontSize: 12, color: Colors.inkSecondary },
  cardDist: { fontFamily: FontFamily.bodyMedium, fontSize: 12, color: Colors.inkDisabled },
  cardAttendees: { fontFamily: FontFamily.bodyRegular, fontSize: 11, color: Colors.inkDisabled },
  cardSpotsBar: {
    backgroundColor: "rgba(255,107,53,0.1)",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,107,53,0.2)",
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  cardSpotsText: { fontFamily: FontFamily.bodyMedium, fontSize: 12, color: Colors.brandOrange },

  // List empty
  listEmpty: { flex: 1, alignItems: "center", justifyContent: "center", gap: 10 },
  listEmptyTitle: { fontFamily: FontFamily.headingBold, fontSize: 20, color: Colors.inkPrimary },
  listEmptySub: { fontFamily: FontFamily.bodyRegular, fontSize: 14, color: Colors.inkSecondary },
  listEmptyCta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
  },
  listEmptyCtaText: { color: Colors.brandOrange, fontFamily: FontFamily.bodySemiBold, fontSize: 15 },

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
});
