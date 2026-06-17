import React, { useCallback, useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { EventsMapView } from "@/components/maps";
import { useRouter } from "expo-router";
import { Flame, List, Map, Plus } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { AppHeader, HeaderIconBtn, Screen } from "@/components/ui";
import { Colors, FontFamily } from "@/constants";
import { useEvents } from "@/hooks/useEvents";
import type { EventSummary } from "@/api/apiService";

const { width: W } = Dimensions.get("window");
const CARD_W = 280;
const CARD_MARGIN = 12;

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


function formatDate(iso: string) {
  const d = new Date(iso);
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

// ── Preview card (map bottom scroll) ────────────────────────────────────────

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
      onPress={onPress}
    >
      <View style={styles.previewImageWrap}>
        {cover ? (
          <Image
            source={{ uri: cover }}
            style={styles.previewImage}
            contentFit="cover"
          />
        ) : (
          <View style={[styles.previewImage, styles.previewImagePlaceholder]}>
            <Text style={styles.eventEmoji}>
              {EVENT_EMOJIS[event.event_type] ?? "🔥"}
            </Text>
          </View>
        )}
        <View style={styles.previewPriceBadge}>
          <Text
            style={[
              styles.previewPriceText,
              event.is_free && { color: Colors.accentGreen },
            ]}
          >
            {formatPrice(event.price_inr, event.is_free)}
          </Text>
        </View>
      </View>
      <View style={styles.previewBody}>
        <Text style={styles.previewTitle} numberOfLines={2}>
          {event.title}
        </Text>
        <Text style={styles.previewMeta} numberOfLines={1}>
          {formatDate(event.date_time)}
        </Text>
        {event.distance_km != null && (
          <Text style={styles.previewDist}>{event.distance_km} km away</Text>
        )}
      </View>
    </Pressable>
  );
}

// ── List event card ──────────────────────────────────────────────────────────

function EventCard({
  event,
  onPress,
}: {
  event: EventSummary;
  onPress: () => void;
}) {
  const cover = event.cover_photos?.[0]?.url;
  const spotsLow = event.spots_left <= 10;
  return (
    <Pressable style={styles.listCard} onPress={onPress}>
      <View style={styles.listImageWrap}>
        {cover ? (
          <Image
            source={{ uri: cover }}
            style={styles.listImage}
            contentFit="cover"
          />
        ) : (
          <View style={[styles.listImage, styles.listImagePlaceholder]}>
            <Text style={{ fontSize: 32 }}>
              {EVENT_EMOJIS[event.event_type] ?? "🔥"}
            </Text>
          </View>
        )}
        <View
          style={[
            styles.listPriceBadge,
            event.is_free && styles.listPriceBadgeFree,
          ]}
        >
          <Text style={styles.listPriceText}>
            {formatPrice(event.price_inr, event.is_free)}
          </Text>
        </View>
      </View>
      <View style={styles.listBody}>
        <Text style={styles.listTitle} numberOfLines={2}>
          {event.title}
        </Text>
        <Text style={styles.listMeta}>{formatDate(event.date_time)}</Text>
        {event.location_name ? (
          <Text style={styles.listLocation} numberOfLines={1}>
            📍 {event.location_name}
          </Text>
        ) : null}
        {event.distance_km != null && (
          <Text style={styles.listDist}>{event.distance_km} km away</Text>
        )}
        {spotsLow && (
          <Text style={styles.listSpotsLow}>
            Only {event.spots_left} spots left!
          </Text>
        )}
      </View>
    </Pressable>
  );
}

// ── Main screen ──────────────────────────────────────────────────────────────

export default function EventsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { events, loading, filters, setFilter, reload, loadInBounds, userLat, userLng } =
    useEvents();
  const [viewMode, setViewMode] = useState<"map" | "list">("map");
  const [activeEventId, setActiveEventId] = useState<string | null>(null);
  const previewListRef = useRef<FlatList>(null);

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

  const handleMarkerPress = useCallback((ev: EventSummary, idx: number) => {
    setActiveEventId(ev.id);
    previewListRef.current?.scrollToIndex({
      index: idx,
      animated: true,
      viewPosition: 0.5,
    });
  }, []);

  const openEvent = (id: string) => router.push(`/(events)/${id}` as any);

  const isEmpty = !loading && events.length === 0;

  // ── Header ──

  const toggleEl = (
    <View style={styles.togglePill}>
      <Pressable
        onPress={() => setViewMode("map")}
        style={[styles.toggleBtn, viewMode === "map" && styles.toggleBtnActive]}
      >
        <Map
          size={14}
          color={viewMode === "map" ? "#fff" : Colors.inkSecondary}
          strokeWidth={2}
        />
        <Text
          style={[
            styles.toggleLabel,
            viewMode === "map" && styles.toggleLabelActive,
          ]}
        >
          Map
        </Text>
      </Pressable>
      <Pressable
        onPress={() => setViewMode("list")}
        style={[
          styles.toggleBtn,
          viewMode === "list" && styles.toggleBtnActive,
        ]}
      >
        <List
          size={14}
          color={viewMode === "list" ? "#fff" : Colors.inkSecondary}
          strokeWidth={2}
        />
        <Text
          style={[
            styles.toggleLabel,
            viewMode === "list" && styles.toggleLabelActive,
          ]}
        >
          List
        </Text>
      </Pressable>
    </View>
  );

  return (
    <Screen>
      <View style={styles.root}>
        <AppHeader
          title="Events"
          rightAction={
            <HeaderIconBtn onPress={() => router.push("/(tabs)/create" as any)}>
              <Plus size={22} color={Colors.inkPrimary} strokeWidth={2} />
            </HeaderIconBtn>
          }
        />

        {/* View mode toggle */}
        <View style={styles.toggleRow}>{toggleEl}</View>

        {/* MAP VIEW */}
        {viewMode === "map" && (
          <View style={styles.mapContainer}>
            <EventsMapView
              events={events}
              userLat={userLat}
              userLng={userLng}
              activeEventId={activeEventId}
              onEventSelect={handleMarkerPress}
              onBoundsChange={loadInBounds}
            />

            {isEmpty && (
              <View style={styles.mapEmpty}>
                <View style={styles.mapEmptyCard}>
                  <Flame
                    size={28}
                    color={Colors.brandOrange}
                    strokeWidth={1.5}
                  />
                  <Text style={styles.mapEmptyTitle}>No events nearby</Text>
                  <Pressable
                    onPress={() => router.push("/(tabs)/create" as any)}
                    style={styles.mapEmptyCta}
                  >
                    <Text style={styles.mapEmptyCtaText}>Create one</Text>
                  </Pressable>
                </View>
              </View>
            )}

            {/* Preview cards strip */}
            {!isEmpty && (
              <View
                style={[
                  styles.previewStrip,
                  { paddingBottom: insets.bottom + 8 },
                ]}
              >
                <FlatList
                  ref={previewListRef}
                  data={events}
                  horizontal
                  keyExtractor={(e) => e.id}
                  showsHorizontalScrollIndicator={false}
                  snapToInterval={CARD_W + CARD_MARGIN}
                  decelerationRate="fast"
                  contentContainerStyle={{ paddingHorizontal: 16 }}
                  ItemSeparatorComponent={() => (
                    <View style={{ width: CARD_MARGIN }} />
                  )}
                  onScrollToIndexFailed={() => {}}
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
        )}

        {/* LIST VIEW */}
        {viewMode === "list" && (
          <View style={{ flex: 1 }}>
            {/* Filter chips */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipsRow}
            >
              {FILTER_CHIPS.map((chip) => (
                <Pressable
                  key={chip.key}
                  onPress={() => handleChip(chip.key)}
                  style={[
                    styles.filterChip,
                    activeChip === chip.key && styles.filterChipActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      activeChip === chip.key && styles.filterChipTextActive,
                    ]}
                  >
                    {chip.label}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            {isEmpty ? (
              <View style={styles.listEmpty}>
                <Flame size={48} color={Colors.inkDisabled} strokeWidth={1.2} />
                <Text style={styles.listEmptyTitle}>No events nearby yet</Text>
                <Text style={styles.listEmptySub}>
                  Be the first to host one
                </Text>
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
                data={events}
                keyExtractor={(e) => e.id}
                contentContainerStyle={{ padding: 16, gap: 12 }}
                showsVerticalScrollIndicator={false}
                refreshControl={
                  <RefreshControl
                    refreshing={loading}
                    onRefresh={reload}
                    tintColor={Colors.brandOrange}
                  />
                }
                renderItem={({ item }) => (
                  <EventCard event={item} onPress={() => openEvent(item.id)} />
                )}
              />
            )}
          </View>
        )}
      </View>
    </Screen>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },

  toggleRow: {
    flexDirection: "row",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: Colors.background,
  },
  togglePill: {
    flexDirection: "row",
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 3,
    gap: 2,
  },
  toggleBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 10,
    gap: 5,
  },
  toggleBtnActive: { backgroundColor: Colors.brandOrange },
  toggleLabel: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: 13,
    color: Colors.inkSecondary,
  },
  toggleLabelActive: { color: "#fff", fontFamily: FontFamily.bodySemiBold },

  // Map
  mapContainer: { flex: 1 },
  mapPin: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surface,
    borderWidth: 2,
    borderColor: Colors.brandOrange,
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
  },
  mapPinActive: {
    backgroundColor: Colors.brandOrange,
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  mapPinEmoji: { fontSize: 20 },

  mapEmpty: { flex: 1, alignItems: "center", justifyContent: "center" },
  mapEmptyCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    gap: 10,
    marginHorizontal: 40,
  },
  mapEmptyTitle: {
    fontFamily: FontFamily.headingBold,
    fontSize: 16,
    color: Colors.inkPrimary,
  },
  mapEmptyCta: {
    backgroundColor: Colors.brandOrange,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 4,
  },
  mapEmptyCtaText: {
    color: "#fff",
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 14,
  },

  previewStrip: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: 8,
    backgroundColor: "rgba(17,17,17,0.85)",
  },
  previewCard: {
    width: CARD_W,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.divider,
  },
  previewCardActive: { borderColor: Colors.brandOrange, borderWidth: 2 },
  previewImageWrap: { height: 130 },
  previewImage: { width: "100%", height: "100%" },
  previewImagePlaceholder: {
    backgroundColor: Colors.elevated,
    alignItems: "center",
    justifyContent: "center",
  },
  eventEmoji: { fontSize: 36 },
  previewPriceBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(17,17,17,0.85)",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  previewPriceText: {
    color: Colors.brandOrange,
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 13,
  },
  previewBody: { padding: 12 },
  previewTitle: {
    fontFamily: FontFamily.headingBold,
    fontSize: 14,
    color: Colors.inkPrimary,
    marginBottom: 4,
  },
  previewMeta: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 12,
    color: Colors.inkSecondary,
  },
  previewDist: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 11,
    color: Colors.inkDisabled,
    marginTop: 2,
  },

  // Filter chips
  chipsRow: { paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    backgroundColor: Colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.divider,
  },
  filterChipActive: {
    backgroundColor: Colors.brandOrange,
    borderColor: Colors.brandOrange,
  },
  filterChipText: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: 13,
    color: Colors.inkSecondary,
  },
  filterChipTextActive: { color: "#fff", fontFamily: FontFamily.bodySemiBold },

  // List card
  listCard: {
    flexDirection: "row",
    backgroundColor: Colors.surface,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.divider,
  },
  listImageWrap: { width: W * 0.38 },
  listImage: { width: "100%", aspectRatio: 3 / 4 },
  listImagePlaceholder: {
    backgroundColor: Colors.elevated,
    alignItems: "center",
    justifyContent: "center",
  },
  listPriceBadge: {
    position: "absolute",
    bottom: 8,
    left: 8,
    backgroundColor: Colors.brandOrange,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  listPriceBadgeFree: { backgroundColor: Colors.accentGreen },
  listPriceText: {
    color: "#fff",
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 12,
  },
  listBody: { flex: 1, padding: 14, justifyContent: "center", gap: 4 },
  listTitle: {
    fontFamily: FontFamily.headingBold,
    fontSize: 15,
    color: Colors.inkPrimary,
    lineHeight: 20,
  },
  listMeta: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 12,
    color: Colors.inkSecondary,
  },
  listLocation: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 12,
    color: Colors.inkSecondary,
  },
  listDist: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 11,
    color: Colors.inkDisabled,
  },
  listSpotsLow: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: 12,
    color: Colors.brandCoral,
    marginTop: 4,
  },

  // List empty
  listEmpty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  listEmptyTitle: {
    fontFamily: FontFamily.headingBold,
    fontSize: 20,
    color: Colors.inkPrimary,
  },
  listEmptySub: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 14,
    color: Colors.inkSecondary,
  },
  listEmptyCta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
  },
  listEmptyCtaText: {
    color: Colors.brandOrange,
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 15,
  },
});
