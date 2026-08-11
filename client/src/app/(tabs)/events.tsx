import React, { useCallback, useRef, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  BackHandler,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { HomeGradientBackdrop } from "@/components/home/HomeGradientBackdrop";
import { EventsMapView } from "@/components/maps";
import { useFocusEffect, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors, ComponentSize, FontFamily } from "@/constants";
import { useEvents } from "@/hooks/useEvents";
import type { EventSummary } from "@/api/apiService";
import { EventCard, EventCardSkeleton } from "@/components/events/EventCard";
import { EventSearchModal } from "@/components/events/EventSearchModal";
import { EventPreviewStrip, PreviewCard } from "@/components/events/EventPreviewStrip";
import { MapFloatingHeader, ListModeHeader, ViewModeTogglePill, FilterChipsRow } from "@/components/events/EventsScreenHeader";
import { MapErrorOverlay, MapEmptyOverlay, ListErrorState, ListEmptyState } from "@/components/events/EventsStateViews";
import { LocationWarning, CreateEventSheet, EventListCard, EventListCardSkeleton, ViewModeToggle, BrandedRefreshControl } from "@/components/ui";
import { usePermissionSheetStore } from "@/store/permissionSheetStore";
import { useEventViewModeStore } from "@/store/eventViewModeStore";
import { useTabBarScroll } from "@/hooks/useTabBarScroll";

const PREVIEW_MAX = 8;
const LIST_PAGE = 8;

export default function EventsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { events, loading, error, filters, setFilter, reload, loadInBounds, userLat, userLng, userHeading, locationStatus } = useEvents();
  const [viewMode, setViewModeState] = useState<"map" | "list">("map");
  const tabBarScroll = useTabBarScroll();

  useEffect(() => {
    AsyncStorage.getItem("events_view_mode")
      .then((mode) => {
        if (mode === "list" || mode === "map") {
          setViewModeState(mode);
        }
      })
      .catch(() => {});
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

  const openEvent = useCallback((id: string) => router.push(`/(events)/${id}` as any), []);
  const renderPreviewCard = useCallback(
    ({ item }: { item: EventSummary }) => (
      <PreviewCard
        event={item}
        active={item.id === activeEventId}
        onPress={() => openEvent(item.id)}
      />
    ),
    [activeEventId, openEvent],
  );
  const renderListItem = useCallback(
    ({ item }: { item: EventSummary }) => (
      cardViewMode === "list" ? (
        <EventListCard event={item} onPress={() => openEvent(item.id)} />
      ) : (
        <EventCard event={item} onPress={() => openEvent(item.id)} />
      )
    ),
    [cardViewMode, openEvent],
  );
  const isEmpty = !loading && !error && events.length === 0;
  const previewEvents = events.slice(0, PREVIEW_MAX);
  const extraCount = events.length - PREVIEW_MAX;

  const togglePill = <ViewModeTogglePill viewMode={viewMode} onChange={setViewMode} />;

  const goToCreate = () => router.push("/(events)/create" as any);

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

        <MapFloatingHeader
          paddingTop={insets.top + 6}
          togglePill={togglePill}
          onSearch={() => setSearchModalOpen(true)}
          onCreate={() => setCreateOpen(true)}
        />

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
          onCreateEvent={goToCreate}
        />

        {hasError && <MapErrorOverlay onRetry={reload} />}

        {isEmpty && <MapEmptyOverlay onCreate={goToCreate} />}

        {/* Preview strip — floats over map with fade gradient */}
        {!isEmpty ? (
          <EventPreviewStrip
            previewListRef={previewListRef}
            previewEvents={previewEvents}
            extraCount={extraCount}
            paddingBottom={Math.max(insets.bottom, 8) + 6 + (ComponentSize.navBar - 26)}
            renderPreviewCard={renderPreviewCard}
            onMorePress={() => setViewMode("list")}
          />
        ) : null}
      </View>
    );
  }

  // ── LIST VIEW ────────────────────────────────────────────────────────────────

  const listEvents = events.slice(0, listCount);
  const hasMore = events.length > listCount;

  return (
    <View style={styles.root}>
      <ListModeHeader
        paddingTop={insets.top + 6}
        togglePill={togglePill}
        onSearch={() => setSearchModalOpen(true)}
        onCreate={() => setCreateOpen(true)}
      />

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
        onCreateEvent={goToCreate}
      />

      <LocationWarning />

      <FilterChipsRow activeChip={activeChip} onSelect={handleChip} />

      {/* List */}
      {loading && events.length === 0 ? (
        <View style={styles.listContent}>
          {Array.from({ length: 4 }).map((_, i) => (
            cardViewMode === "list" ? <EventListCardSkeleton key={i} /> : <EventCardSkeleton key={i} />
          ))}
        </View>
      ) : hasError ? (
        <ListErrorState onRetry={reload} />
      ) : isEmpty ? (
        <ListEmptyState onCreate={goToCreate} />
      ) : (
        <FlatList
          data={listEvents}
          keyExtractor={(e) => e.id}
          style={{ flex: 1 }}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          {...tabBarScroll}
          refreshControl={
            <BrandedRefreshControl refreshing={loading} onRefresh={reload} />
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
          renderItem={renderListItem}
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

  leftGlow: { position: "absolute", top: 0, bottom: 0, left: 0, width: 90, opacity: 0.28 },
  rightGlow: { position: "absolute", top: 0, bottom: 0, right: 0, width: 90, opacity: 0.28 },

  listContent: { padding: 16, paddingBottom: ComponentSize.navBar + 16, gap: 16 },

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
