import { useState, useEffect, useCallback } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { hMedium, hSuccess } from "@/lib/haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowLeft, Ghost } from "lucide-react-native";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { VybeRequestModal, VybeIcebreakerModal, ProfileMenuSheet, BrandedLoader, BrandedRefreshControl } from "@/components/ui";
import ApiService, { ExtendedProfile } from "@/api/apiService";
import { Colors, FontFamily, HOST_BADGE_IMAGES } from "@/constants";
import { usePillStore } from "@/store/pillStore";
import { useVybeStore } from "@/store/vybeStore";
import { useImageViewer } from "@/hooks/useImageViewer";
import { MediaViewerModal } from "@/components/chat/MediaViewerModal";
import { ProfileHeaderBar } from "@/components/profile/ProfileHeaderBar";
import { ProfilePhotoCarousel } from "@/components/profile/ProfilePhotoCarousel";
import { ProfileNameHeader } from "@/components/profile/ProfileNameHeader";
import { UserProfileStatsRow } from "@/components/profile/UserProfileStatsRow";
import { UserProfileBlockedOverlay } from "@/components/profile/UserProfileBlockedOverlay";
import { UserProfileBadgesInterests } from "@/components/profile/UserProfileBadgesInterests";
import { UserProfileVoiceIntro } from "@/components/profile/UserProfileVoiceIntro";
import { UserProfileCtaBar } from "@/components/profile/UserProfileCtaBar";

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const [profile, setProfile] = useState<ExtendedProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState(false);
  const [vybeModalOpen, setVybeModalOpen] = useState(false);
  const [vybeSent, setVybeSent] = useState(false);
  const [acceptModalOpen, setAcceptModalOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [blockedByMe, setBlockedByMe] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const showPill = usePillStore((s) => s.show);
  const { markSent, markCleared, isSentTo } = useVybeStore();

  const voicePlayer = useAudioPlayer(null);
  const voiceStatus = useAudioPlayerStatus(voicePlayer);
  const { viewingMedia, openMedia, closeMedia } = useImageViewer();

  useEffect(() => {
    if (!id) return;
    ApiService.getUserProfile(id)
      .then((p) => {
        setProfile(p);
        setFollowing(!!p.is_following);
        setVybeSent(
          (p.vybe_status === "pending" && !!p.vybe_sent_by_me) || isSentTo(p.id),
        );
        setBlockedByMe(!!p.is_blocked_by_me);
        if (p.voice_url) voicePlayer.replace({ uri: p.voice_url });
      })
      .catch((e: any) => showPill(e?.message || "Couldn't load this profile", "error"))
      .finally(() => setLoading(false));
  }, [id]);

  const handleRefresh = useCallback(async () => {
    if (!id) return;
    setRefreshing(true);
    try {
      const p = await ApiService.getUserProfile(id);
      setProfile(p);
      setFollowing(!!p.is_following);
      setVybeSent(
        (p.vybe_status === "pending" && !!p.vybe_sent_by_me) || isSentTo(p.id),
      );
      setBlockedByMe(!!p.is_blocked_by_me);
      if (p.voice_url) voicePlayer.replace({ uri: p.voice_url });
    } catch (e: any) {
      showPill(e?.message || "Couldn't refresh this profile", "error");
    } finally {
      setRefreshing(false);
    }
  }, [id]);

  const handleFollowToggle = async () => {
    if (!profile) return;
    const next = !following;
    setFollowing(next);
    try {
      if (next) await ApiService.followUser(profile.id);
      else await ApiService.unfollowUser(profile.id);
      showPill(next ? `Following ${profile.name ?? 'them'}` : `Unfollowed ${profile.name ?? 'them'}`, "default");
    } catch (e: any) {
      setFollowing(!next);
      showPill(e?.message || "Couldn't update follow status, try again", "error");
    }
  };

  const handleSendVybe = async (message: string) => {
    if (!profile) return;
    setVybeModalOpen(false);
    setVybeSent(true);
    markSent(profile.id);
    try {
      await ApiService.sendVibe(profile.id, message);
    } catch (err: any) {
      setVybeSent(false);
      markCleared(profile.id);
      showPill(
        err?.status === 429
          ? "You're on cooldown with this person, try again later"
          : err?.message || "Couldn't send that vybe, try again",
        "error",
      );
    }
  };

  const handleAcceptVybe = async (icebreaker: string) => {
    if (!profile?.vybe_id) return;
    setAcceptModalOpen(false);
    try {
      const result = await ApiService.respondToVibe(profile.vybe_id, "accept", icebreaker);
      if (result.conversation_id) {
        router.replace(`/(chat)/${result.conversation_id}` as any);
      }
    } catch (e: any) {
      showPill(e?.message || "Couldn't send that vybe, try again", "error");
    }
  };

  const handleBlock = async () => {
    if (!profile) return;
    try {
      await ApiService.blockUser(profile.id);
      setBlockedByMe(true);
      showPill(`Blocked ${profile.name ?? 'them'}`, "default");
    } catch (e: any) {
      showPill(e?.message || "Couldn't block this person", "error");
    }
  };

  const handleUnblock = async () => {
    if (!profile) return;
    try {
      await ApiService.unblockUser(profile.id);
      setBlockedByMe(false);
      showPill(`Unblocked ${profile.name ?? 'them'}`, "default");
    } catch (e: any) {
      showPill(e?.message || "Couldn't unblock, try again", "error");
    }
  };

  const handleReport = async (reason: string) => {
    if (!profile) return;
    try {
      await ApiService.reportUser(profile.id, reason);
      showPill("Report submitted", "success");
    } catch (e: any) {
      showPill(e?.message || "Report not sent, try again", "error");
    }
  };

  const handleVoiceTogglePlay = () => {
    if (voiceStatus.playing) {
      voicePlayer.pause();
    } else {
      if (voiceStatus.duration > 0 && voiceStatus.currentTime >= voiceStatus.duration - 0.05) {
        voicePlayer.seekTo(0);
      }
      voicePlayer.play();
    }
  };

  if (loading) {
    return (
      <View style={[s.root, s.center]}>
        <BrandedLoader />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={[s.root, s.center]}>
        <Pressable
          onPress={() => router.back()}
          style={[s.backBtn, { position: "absolute", top: insets.top + 8, left: 0 }]}
        >
          <ArrowLeft size={18} color={Colors.inkPrimary} strokeWidth={2} />
        </Pressable>
        <View style={s.deletedIconWrap}>
          <Ghost size={40} color={Colors.inkDisabled} strokeWidth={1.5} />
        </View>
        <Text style={s.deletedTitle}>Profile Not Found</Text>
        <Text style={s.deletedBody}>This user may not exist or the link is invalid.</Text>
      </View>
    );
  }

  if (profile.is_deleted) {
    return (
      <View style={[s.root, s.center]}>
        <Pressable
          onPress={() => router.back()}
          style={[s.backBtn, { position: "absolute", top: insets.top + 8, left: 0 }]}
        >
          <ArrowLeft size={18} color={Colors.inkPrimary} strokeWidth={2} />
        </Pressable>
        <View style={s.deletedIconWrap}>
          <Ghost size={40} color={Colors.inkDisabled} strokeWidth={1.5} />
        </View>
        <Text style={s.deletedTitle}>Not Found</Text>
        <Text style={s.deletedBody}>This profile is no longer available.</Text>
      </View>
    );
  }

  const photos = profile.photos ?? [];
  const isConnected = profile.vybe_status === "connected";
  const isPending =
    vybeSent || (profile.vybe_status === "pending" && !!profile.vybe_sent_by_me);
  const theySentVybe =
    profile.vybe_status === "pending" && !profile.vybe_sent_by_me && !vybeSent;
  const isCooldown =
    !isPending &&
    !theySentVybe &&
    profile.vybe_status === "cooldown" &&
    !!profile.cooldown_until;
  const age = profile.dob
    ? Math.floor((Date.now() - new Date(profile.dob).getTime()) / 3.156e10)
    : null;

  const hostBadgeName = profile.host_badges?.[0] ?? null;
  const hostBadgeImage = hostBadgeName ? HOST_BADGE_IMAGES[hostBadgeName] : null;

  return (
    <View style={[s.root, { paddingBottom: insets.bottom }]}>
      <ProfileHeaderBar
        topInset={insets.top}
        onBack={() => router.back()}
        onMenu={() => setMenuOpen(true)}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
        refreshControl={
          <BrandedRefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
          />
        }
      >
        <ProfilePhotoCarousel
          photos={photos}
          name={profile.name}
          onOpenPhoto={(index) =>
            openMedia(photos.map((p) => ({ url: p.url, type: "image" })), index)
          }
        />

        <View style={s.body}>
          <ProfileNameHeader
            name={profile.name}
            age={age}
            username={profile.username}
            city={profile.city}
            mutualCount={profile.mutual_count ?? 0}
            hostBadgeImage={hostBadgeImage}
          />

          {!blockedByMe && (
            <UserProfileStatsRow
              userId={profile.id}
              name={profile.name}
              vibersCount={profile.vibers_count ?? 0}
              vibingCount={profile.vibing_count ?? 0}
              hostAvgRating={profile.host_avg_rating}
              hostReviewCount={profile.host_review_count ?? 0}
            />
          )}

          {blockedByMe && <UserProfileBlockedOverlay onUnblock={handleUnblock} />}

          {!blockedByMe && profile.bio ? <Text style={s.bio}>{profile.bio}</Text> : null}

          {!blockedByMe && (
            <UserProfileBadgesInterests badges={profile.badges} interests={profile.interests} />
          )}

          {!blockedByMe && profile.voice_url ? (
            <UserProfileVoiceIntro playing={voiceStatus.playing} onTogglePlay={handleVoiceTogglePlay} />
          ) : null}
        </View>
      </ScrollView>

      {!blockedByMe && (
        <UserProfileCtaBar
          insetsBottom={insets.bottom}
          isConnected={isConnected}
          theySentVybe={theySentVybe}
          isPending={isPending}
          isCooldown={isCooldown}
          cooldownUntil={profile.cooldown_until}
          following={following}
          onMessagePress={() => {
            if (profile.conversation_id) {
              router.push(`/(chat)/${profile.conversation_id}` as any);
            } else {
              showPill("Send them a vybe first to start chatting", "error");
            }
          }}
          onAcceptPress={() => {
            hSuccess();
            setAcceptModalOpen(true);
          }}
          onSendVybePress={() => {
            hMedium();
            setVybeModalOpen(true);
          }}
          onCooldownExpiredPress={() => {
            hMedium();
            setVybeModalOpen(true);
          }}
          onFollowTogglePress={handleFollowToggle}
        />
      )}

      <VybeRequestModal
        visible={vybeModalOpen}
        user={{
          id: profile.id,
          name: profile.name,
          username: profile.username ?? null,
          gender: profile.gender,
          age: (profile as any).age ?? 0,
          bio: profile.bio,
          city: profile.city,
          interests: profile.interests,
          voice_url: profile.voice_url,
          distance_km: null,
          match_pct: 0,
          photos: profile.photos,
        }}
        onSend={handleSendVybe}
        onClose={() => setVybeModalOpen(false)}
      />

      <VybeIcebreakerModal
        visible={acceptModalOpen}
        partnerName={profile.name}
        onSend={handleAcceptVybe}
        onClose={() => setAcceptModalOpen(false)}
      />

      <ProfileMenuSheet
        visible={menuOpen}
        userId={profile.id}
        username={profile.username ?? null}
        targetName={profile.name ?? null}
        avatarUrl={photos[0]?.url ?? null}
        city={profile.city}
        interests={profile.interests}
        isBlocked={blockedByMe}
        onBlock={handleBlock}
        onUnblock={handleUnblock}
        onReport={handleReport}
        onClose={() => setMenuOpen(false)}
      />

      {viewingMedia && (
        <MediaViewerModal
          visible={!!viewingMedia}
          items={viewingMedia.items}
          initialIndex={viewingMedia.initialIndex}
          onClose={closeMedia}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  center: { alignItems: "center", justifyContent: "center" },
  backBtn: { paddingHorizontal: 20, paddingVertical: 10 },
  deletedIconWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: Colors.elevated,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  deletedTitle: {
    fontFamily: FontFamily.headingBold,
    fontSize: 22,
    color: Colors.inkSecondary,
    marginBottom: 10,
  },
  deletedBody: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 14,
    color: Colors.inkDisabled,
    textAlign: "center",
    lineHeight: 21,
  },
  body: { padding: 20, gap: 16 },
  bio: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 15,
    color: Colors.inkSecondary,
    lineHeight: 22,
  },
});
