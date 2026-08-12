import React from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { Colors, FontFamily, EVENT_ICONS, EVENT_ICON_FALLBACK } from "@/constants";
import { hSelection } from "@/lib/haptics";
import { useAuthStore } from "@/store/auth";
import type { EventSummary } from "@/api/apiService";
import { formatEventDate, HostPill } from "@/components/events/EventCard";
import { HotlistButton } from "@/components/events/HotlistButton";

const CARD_W = 268;
const CARD_MARGIN = 10;

function formatPrice(price: number, isFree: boolean) {
  if (isFree) return "Free";
  return `₹${price}`;
}

// ── Preview card (map mode bottom strip) ────────────────────────────────────

function PreviewCardBase({
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
  const router = useRouter();
  const myId = useAuthStore(state => state.userId);
  const canOpenHost = !!event.host_id && event.host_name && !event.host_is_deleted;

  return (
    <View style={styles.previewCardWrap}>
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
            cachePolicy="memory-disk"
            priority={active ? 'high' : 'low'}
            transition={150}
          />
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
        {!canOpenHost && event.host_name && !event.host_is_deleted ? (
          <HostPill
            name={event.host_name}
            avatar={event.host_avatar}
            compact
            style={styles.previewHostPillPos}
          />
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

    {/* Siblings of the card's own Pressable above, not nested inside it. */}
    <HotlistButton eventId={event.id} initial={event.is_hotlisted} style={styles.previewHotlistBtn} size={13} />
    {canOpenHost && (
      <Pressable
        style={styles.previewHostPillPos}
        onPress={() => {
          hSelection();
          router.push((event.host_id === myId ? '/(tabs)/profile' : `/(profile)/${event.host_id}`) as any);
        }}
      >
        <View pointerEvents="none">
          <HostPill name={event.host_name!} avatar={event.host_avatar} compact />
        </View>
      </Pressable>
    )}
    </View>
  );
}

export const PreviewCard = React.memo(PreviewCardBase);

// "N more events" tail card in preview strip
export function MoreCard({ count, onPress }: { count: number; onPress: () => void }) {
  return (
    <Pressable style={styles.moreCard} onPress={onPress}>
      <Text style={styles.moreCount}>+{count}</Text>
      <Text style={styles.moreLabel}>more{"\n"}events</Text>
    </Pressable>
  );
}

export function EventPreviewStrip({
  previewListRef,
  previewEvents,
  extraCount,
  paddingBottom,
  renderPreviewCard,
  onMorePress,
}: {
  previewListRef: React.RefObject<FlatList<EventSummary> | null>;
  previewEvents: EventSummary[];
  extraCount: number;
  paddingBottom: number;
  renderPreviewCard: ({ item }: { item: EventSummary }) => React.ReactElement;
  onMorePress: () => void;
}) {
  return (
    <View style={[styles.previewStrip, { paddingBottom }]}>
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
            <MoreCard count={extraCount} onPress={onMorePress} />
          ) : null
        }
        renderItem={renderPreviewCard}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  previewStrip: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: 32,
  },
  previewCardWrap: { width: CARD_W, position: "relative" },
  previewCard: {
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
  previewHotlistBtn: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  previewPriceBadge: {
    position: "absolute",
    top: 8,
    right: 38,
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
  // HostPill (from EventCard.tsx) handles its own pill chrome/compact sizing —
  // this only positions it, so there's exactly one place that owns the
  // pill's actual look instead of two hand-rolled copies drifting apart.
  previewHostPillPos: {
    position: "absolute",
    top: 8,
    left: 8,
    maxWidth: "70%",
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
});
