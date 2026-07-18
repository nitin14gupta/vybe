import { useCallback, useState, useEffect } from 'react'
import {
  View, Text, StyleSheet, ActivityIndicator,
} from 'react-native'
import { Pressable } from 'react-native-gesture-handler'
import { hTap, hSelection, hMedium } from '@/lib/haptics'
import { Image } from 'expo-image'
import { VideoView, useVideoPlayer } from 'expo-video'
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, runOnJS,
} from 'react-native-reanimated'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio'
import * as FileSystem from 'expo-file-system/legacy'
import { router } from 'expo-router'
import { Play, Pause, Download, Film, Mic, Image as ImageIcon, Calendar, User, Check } from 'lucide-react-native'
import { Colors, FontFamily } from '@/constants'
import type { Message } from '@/api/apiService'
import type { MediaViewType } from '@/components/chat/MediaViewerModal'
import { ReactionPills } from './ReactionPills'
import { PlaybackWave } from '@/components/ui'
import { LinkPreviewCard } from './LinkPreviewCard'
import { isUrlOnly, normalizeUrl } from '@/lib/linkify'

// ── Reply preview ─────────────────────────────────────────────────────────────

type ReplyIcon = { Icon: any; label: string }

function getReplyIcon(contentType?: string): ReplyIcon | null {
  switch (contentType) {
    case 'voice':   return { Icon: Mic,      label: 'Voice message' }
    case 'image':   return { Icon: ImageIcon, label: 'Photo' }
    case 'gif':     return { Icon: Film,     label: 'GIF' }
    case 'video':   return { Icon: Film,     label: 'Video' }
    case 'event':   return { Icon: Calendar, label: 'Event' }
    case 'profile': return { Icon: User,     label: 'Profile' }
    default:        return null
  }
}

function ReplyPreview({ metadata, isMine, onPress }: {
  metadata: Record<string, any> | null
  isMine: boolean
  onPress?: (msgId: string) => void
}) {
  if (!metadata?.reply_to) return null
  const rt = metadata.reply_to as {
    message_id?: string; content?: string; content_type?: string; sender_label?: string
  }
  const mediaIcon = getReplyIcon(rt.content_type)

  return (
    <Pressable
      style={[rp.wrap, isMine ? rp.wrapMine : rp.wrapTheirs]}
      onPress={() => rt.message_id && onPress?.(rt.message_id)}
      hitSlop={4}
    >
      <View style={rp.accent} />
      <View style={rp.body}>
        {rt.sender_label ? (
          <Text style={rp.sender} numberOfLines={1}>{rt.sender_label}</Text>
        ) : null}
        {mediaIcon ? (
          <View style={rp.iconRow}>
            <mediaIcon.Icon size={11} color="rgba(255,255,255,0.4)" strokeWidth={2} />
            <Text style={rp.text} numberOfLines={1}>{mediaIcon.label}</Text>
          </View>
        ) : (
          <Text style={rp.text} numberOfLines={1}>{rt.content ?? ''}</Text>
        )}
      </View>
    </Pressable>
  )
}

const rp = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    borderRadius: 6,
    marginBottom: 4,
    overflow: 'hidden',
    alignSelf: 'stretch',
  },
  wrapMine: { backgroundColor: 'rgba(255,107,53,0.15)' },
  wrapTheirs: { backgroundColor: 'rgba(255,255,255,0.07)' },
  accent: { width: 3, backgroundColor: Colors.brandOrange },
  body: { flex: 1, paddingHorizontal: 7, paddingVertical: 4, gap: 1 },
  sender: { fontFamily: FontFamily.bodySemiBold, fontSize: 11, color: Colors.brandOrange },
  iconRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  text: { fontFamily: FontFamily.bodyRegular, fontSize: 12, color: 'rgba(255,255,255,0.5)' },
})

// ── Voice bubble ──────────────────────────────────────────────────────────────

function VoiceBubble({ url, duration, isMine, isPending }: {
  url: string; duration?: number; isMine: boolean; isPending: boolean
}) {
  const player = useAudioPlayer(null)
  const status = useAudioPlayerStatus(player)

  // Pre-load audio on mount — matches the working useVoiceEdit pattern.
  // Calling replace() + play() in the same tap handler is unreliable because
  // the audio system hasn't finished loading when play() fires.
  useEffect(() => {
    player.replace({ uri: url })
  }, [url])

  // Use RNGH Tap instead of Pressable — Pressable is blocked by parent GestureDetector
  // on New Architecture (RNGH v2 intercepts all touches before RN's touch system)
  const handleToggle = () => {
    if (isPending) return
    if (status.playing) {
      player.pause()
    } else {
      player.seekTo(0)
      player.play()
    }
  }

  const dur = duration ?? 0
  const mins = Math.floor(dur / 60)
  const secs = String(dur % 60).padStart(2, '0')
  const durationStr = `${mins}:${secs}`

  return (
    <View style={[vb.bubble, isMine ? vb.bubbleMine : vb.bubbleTheirs]}>
      {/* RNGH Pressable works inside GestureDetector on New Architecture (RN Pressable doesn't) */}
      <Pressable onPress={handleToggle} style={[vb.playBtn, isPending && { opacity: 0.4 }]} hitSlop={6}>
        {status.playing
          ? <Pause size={16} color="#111" strokeWidth={2.5} />
          : <Play  size={16} color="#111" strokeWidth={2.5} />
        }
      </Pressable>
      <View style={vb.waveWrap}>
        <PlaybackWave isActive={status.playing} color={isMine ? Colors.brandOrange : '#888'} />
      </View>
      {isPending
        ? <ActivityIndicator size="small" color={Colors.brandOrange} />
        : <Text style={[vb.duration, { color: isMine ? Colors.inkPrimary : Colors.inkSecondary }]}>
            {durationStr}
          </Text>
      }
    </View>
  )
}

const vb = StyleSheet.create({
  bubble: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 18, paddingHorizontal: 12, paddingVertical: 12, minWidth: 200 },
  bubbleMine: { backgroundColor: 'rgba(255,107,53,0.18)', borderWidth: 1, borderColor: 'rgba(255,107,53,0.35)', borderBottomRightRadius: 4 },
  bubbleTheirs: { backgroundColor: '#222', borderWidth: 1, borderColor: '#2a2a2a', borderBottomLeftRadius: 4 },
  playBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.brandOrange, alignItems: 'center', justifyContent: 'center' },
  waveWrap: { flex: 1, overflow: 'hidden' },
  duration: { fontFamily: FontFamily.bodyRegular, fontSize: 11, minWidth: 30, textAlign: 'right' },
})

// ── Media bubble (image / gif) ────────────────────────────────────────────────

const MEDIA_WIDTH = 220

function ImageChatBubble({ url, isMine, width: srcW, height: srcH, isPending }: {
  url: string; isMine: boolean; width?: number; height?: number; isPending: boolean
}) {
  const aspectRatio = srcW && srcH ? srcW / srcH : 4 / 3
  const displayH = Math.round(MEDIA_WIDTH / aspectRatio)
  const h = Math.min(Math.max(displayH, 120), 320)

  // Tap is handled by the parent GestureDetector's singleTap gesture —
  // Pressable inside a GestureDetector doesn't fire on New Architecture (RNGH v2)
  return (
    <View style={{ width: MEDIA_WIDTH, height: h }}>
      <Image
        source={{ uri: url }}
        style={[mc.img, { width: MEDIA_WIDTH, height: h }]}
        contentFit="cover"
      />
      {isPending && (
        <View style={mc.pendingOverlay}>
          <ActivityIndicator size="small" color="#fff" />
        </View>
      )}
    </View>
  )
}

// ── Video bubble ──────────────────────────────────────────────────────────────

function VideoChatBubble({ url, isMine, width: srcW, height: srcH, isPending, onPress }: {
  url: string; isMine: boolean; width?: number; height?: number; isPending: boolean
  onPress: (playUrl: string) => void
}) {
  const [localUri, setLocalUri] = useState<string | null>(null)
  const [downloading, setDownloading] = useState(false)
  // Always call hook unconditionally (Rules of Hooks) — only rendered for isMine path
  const videoPlayer = useVideoPlayer(url, p => { p.loop = false })

  const aspectRatio = srcW && srcH ? srcW / srcH : 16 / 9
  const displayH = Math.round(MEDIA_WIDTH / aspectRatio)
  const h = Math.min(Math.max(displayH, 120), 390)
  const boxStyle = { width: MEDIA_WIDTH, height: h }

  const handleDownload = async () => {
    if (downloading) return
    setDownloading(true)
    try {
      const filename = url.split('/').pop() ?? 'video.mp4'
      const dest = `${FileSystem.cacheDirectory}${filename}`
      const result = await FileSystem.downloadAsync(url, dest)
      setLocalUri(result.uri)
      onPress(result.uri)
    } catch {
      setDownloading(false)
    }
  }

  const handleTap = () => {
    if (localUri) { onPress(localUri); return }
    if (isMine) { onPress(url); return }
    handleDownload()
  }

  // Plain View + RNGH Pressable (not Gesture.Tap+GestureDetector) — this bubble
  // is nested inside the message's own outer GestureDetector, and a second,
  // independent Gesture.Tap here silently loses the touch to the outer one on
  // New Architecture. RNGH's Pressable composes correctly in that position
  // (same fix already applied to VoiceBubble's play button above).
  const content = isMine ? (
    <>
      <VideoView
        player={videoPlayer}
        style={mc.video}
        contentFit="cover"
        nativeControls={false}
      />
      {isPending
        ? <View style={mc.playOverlay}><ActivityIndicator size="small" color="#fff" /></View>
        : <View style={mc.playOverlay}><Play size={28} color="#fff" fill="#fff" strokeWidth={0} /></View>
      }
    </>
  ) : localUri ? (
    <View style={mc.playOverlay}><Play size={28} color="#fff" fill="#fff" strokeWidth={0} /></View>
  ) : (
    <View style={[mc.downloadPlaceholder, boxStyle]}>
      <Film size={32} color="rgba(255,255,255,0.5)" strokeWidth={1.5} />
      {downloading
        ? <ActivityIndicator size="small" color={Colors.brandOrange} style={{ marginTop: 8 }} />
        : <>
            <Download size={18} color={Colors.brandOrange} strokeWidth={2} style={{ marginTop: 10 }} />
            <Text style={mc.downloadText}>Tap to download</Text>
          </>
      }
    </View>
  )

  // Rounded corners live on this outer plain View — RNGH's Pressable doesn't
  // reliably clip children to a border radius via overflow:hidden on its own
  // native view, so the radius silently disappeared when Pressable owned it.
  return (
    <View style={[mc.videoWrap, boxStyle]}>
      <Pressable onPress={handleTap} style={StyleSheet.absoluteFill}>
        {content}
      </Pressable>
    </View>
  )
}

const mc = StyleSheet.create({
  img: { borderRadius: 14 },
  pendingOverlay: {
    position: 'absolute', bottom: 8, right: 8,
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center', justifyContent: 'center',
  },
  videoWrap: { borderRadius: 14, overflow: 'hidden', backgroundColor: '#111' },
  video: { width: '100%', height: '100%' },
  playOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  downloadPlaceholder: {
    borderRadius: 14,
    backgroundColor: '#1a1a1a',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: '#2a2a2a',
  },
  downloadText: {
    fontFamily: FontFamily.bodyRegular, fontSize: 12,
    color: Colors.inkSecondary, marginTop: 4,
  },
})

// ── Event / Profile cards ─────────────────────────────────────────────────────

function EventCard({ metadata, isMine, sentAt }: { metadata: Record<string, any>; isMine: boolean; sentAt: string }) {
  return (
    <View style={[s.bubbleWrap, isMine ? s.wrapMine : s.wrapTheirs]}>
      <View style={s.richCard}>
        {metadata.cover_url
          ? <Image source={{ uri: metadata.cover_url }} style={s.richCardImg} contentFit="cover" />
          : <View style={[s.richCardImg, s.richCardImgFallback]} />
        }
        <View style={s.richCardBody}>
          <Text style={s.richCardTitle} numberOfLines={2}>{metadata.title}</Text>
          {metadata.date ? <Text style={s.richCardSub}>{metadata.date}</Text> : null}
          <Pressable style={s.richCardBtn} onPress={() => metadata.event_id && router.push(`/(events)/${metadata.event_id}` as any)}>
            <Text style={s.richCardBtnText}>View Event</Text>
          </Pressable>
        </View>
      </View>
      <Text style={[s.timeBelow, isMine ? s.timeBelowMine : s.timeBelowTheirs]}>
        {new Date(sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </Text>
    </View>
  )
}

function ProfileCard({ metadata, isMine, sentAt }: { metadata: Record<string, any>; isMine: boolean; sentAt: string }) {
  return (
    <View style={[s.bubbleWrap, isMine ? s.wrapMine : s.wrapTheirs]}>
      <View style={s.richCard}>
        <View style={s.profileRow}>
          {metadata.avatar_url
            ? <Image source={{ uri: metadata.avatar_url }} style={s.profileAvatar} contentFit="cover" />
            : (
              <View style={[s.profileAvatar, s.profileAvatarFallback]}>
                <Text style={s.profileAvatarInitial}>{(metadata.name ?? '?').charAt(0)}</Text>
              </View>
            )
          }
          <View style={{ flex: 1 }}>
            <Text style={s.richCardTitle}>{metadata.name}</Text>
            {metadata.city ? <Text style={s.richCardSub}>{metadata.city}</Text> : null}
          </View>
        </View>
        {metadata.interests?.length > 0 && (
          <View style={s.profileChips}>
            {(metadata.interests as string[]).slice(0, 3).map((t: string) => (
              <View key={t} style={s.profileChip}><Text style={s.profileChipText}>{t}</Text></View>
            ))}
          </View>
        )}
        <Pressable style={s.richCardBtn} onPress={() => metadata.user_id && router.push(`/(profile)/${metadata.user_id}` as any)}>
          <Text style={s.richCardBtnText}>View Profile</Text>
        </Pressable>
      </View>
      <Text style={[s.timeBelow, isMine ? s.timeBelowMine : s.timeBelowTheirs]}>
        {new Date(sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </Text>
    </View>
  )
}

// ── Main MessageBubble ────────────────────────────────────────────────────────

interface Props {
  msg: Message
  isMine: boolean
  myId: string
  isFailed?: boolean
  /** Bulk "select messages to delete" mode — see EmojiPickerOverlay's Select action */
  selectMode?: boolean
  isSelected?: boolean
  onToggleSelect?: (msgId: string) => void
  onDoubleTap: (msgId: string) => void
  onLongPress: (msgId: string, pageY: number, isMine: boolean) => void
  onSwipeReply: (msg: Message) => void
  onReactionPillPress: (msgId: string, emoji: string) => void
  onReplyTap: (originalMsgId: string) => void
  onMediaTap?: (url: string, type: MediaViewType) => void
  onRetry?: (tempId: string) => void
  onLinkTap?: (url: string) => void
}

export function MessageBubble({
  msg, isMine, myId, isFailed,
  selectMode, isSelected, onToggleSelect,
  onDoubleTap, onLongPress, onSwipeReply,
  onReactionPillPress, onReplyTap, onMediaTap, onRetry, onLinkTap,
}: Props) {
  const translateX = useSharedValue(0)
  const hasTriggeredReply = useSharedValue(false)

  const isLinkMessage = msg.content_type === 'text' && !!msg.content && isUrlOnly(msg.content)

  const handleDoubleTap = useCallback(() => { hSelection(); onDoubleTap(msg.id) }, [msg.id, onDoubleTap])
  const handleSwipeReply = useCallback(() => { hTap(); onSwipeReply(msg) }, [msg, onSwipeReply])
  const handleSingleTap = useCallback(() => {
    if (isLinkMessage && msg.content) {
      hTap()
      onLinkTap?.(normalizeUrl(msg.content))
      return
    }
    if ((msg.content_type === 'image' || msg.content_type === 'gif') && msg.metadata?.url) {
      onMediaTap?.(msg.metadata.url, msg.content_type as MediaViewType)
    }
  }, [isLinkMessage, msg.content, msg.content_type, msg.metadata, onMediaTap, onLinkTap])

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .maxDelay(250)
    .onEnd(() => runOnJS(handleDoubleTap)())

  // Single tap for image/gif → open modal. requireExternalGestureToFail ensures
  // double-tap-to-react still works (single tap waits ~250ms to confirm it's not a double tap)
  const singleTap = Gesture.Tap()
    .numberOfTaps(1)
    .requireExternalGestureToFail(doubleTap)
    .onEnd(() => runOnJS(handleSingleTap)())

  const longPress = Gesture.LongPress()
    .minDuration(400)
    .onStart(e => { runOnJS(hMedium)(); runOnJS(onLongPress)(msg.id, e.absoluteY, isMine) })

  const pan = Gesture.Pan()
    .activeOffsetX(isMine ? [-Infinity, -40] : [40, Infinity])
    .failOffsetY([-20, 20])
    .onUpdate(e => {
      const dx = isMine ? -e.translationX : e.translationX
      if (dx > 0) translateX.value = Math.min(dx * 0.55, 64)
      if (dx > 55 && !hasTriggeredReply.value) {
        hasTriggeredReply.value = true
        runOnJS(handleSwipeReply)()
      }
    })
    .onEnd(() => {
      translateX.value = withTiming(0, { duration: 220 })
      hasTriggeredReply.value = false
    })

  const gesture = Gesture.Simultaneous(pan, singleTap, Gesture.Exclusive(doubleTap, longPress))

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: isMine ? -translateX.value : translateX.value }],
  }))

  const timeRevealStyle = useAnimatedStyle(() => ({
    opacity: Math.min(translateX.value / 40, 1),
  }))

  const isPending = msg.id.startsWith('_temp_')
  const hasReply = !!msg.metadata?.reply_to
  const timeStr = isPending
    ? '…'
    : new Date(msg.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + (msg.edited_at ? ' · Edited' : '')

  const renderBubbleContent = () => {
    if (msg.unsent_at) {
      return (
        <View style={[s.bubbleWrap, isMine ? s.wrapMine : s.wrapTheirs]}>
          <View style={[s.bubble, s.bubbleUnsent]}>
            <Text style={s.unsentText}>
              {isMine ? 'You unsent this message' : 'This message was unsent'}
            </Text>
          </View>
          <Text style={[s.timeBelow, isMine ? s.timeBelowMine : s.timeBelowTheirs]}>{timeStr}</Text>
        </View>
      )
    }

    if ((msg.content_type === 'image' || msg.content_type === 'gif') && msg.metadata?.url) {
      return (
        <View style={[s.bubbleWrap, isMine ? s.wrapMine : s.wrapTheirs]}>
          <GestureDetector gesture={gesture}>
            <Animated.View style={animStyle}>
              <ImageChatBubble
                url={msg.metadata.url}
                isMine={isMine}
                width={msg.metadata.width}
                height={msg.metadata.height}
                isPending={isPending}
              />
            </Animated.View>
          </GestureDetector>
          {msg.reactions && (
            <ReactionPills reactions={msg.reactions} myId={myId} onPillPress={emoji => onReactionPillPress(msg.id, emoji)} />
          )}
          <Animated.Text style={[s.timeBelow, isMine ? s.timeBelowMine : s.timeBelowTheirs, timeRevealStyle]}>
            {timeStr}
          </Animated.Text>
          {isFailed && (
            <Pressable onPress={() => onRetry?.(msg.id)} hitSlop={4}>
              <Text style={s.failedText}>⚠ Failed · Tap to retry</Text>
            </Pressable>
          )}
        </View>
      )
    }

    if (msg.content_type === 'video' && msg.metadata?.url) {
      return (
        <View style={[s.bubbleWrap, isMine ? s.wrapMine : s.wrapTheirs]}>
          <GestureDetector gesture={gesture}>
            <Animated.View style={animStyle}>
              <VideoChatBubble
                url={msg.metadata.url}
                isMine={isMine}
                width={msg.metadata.width}
                height={msg.metadata.height}
                isPending={isPending}
                onPress={playUrl => onMediaTap?.(playUrl, 'video')}
              />
            </Animated.View>
          </GestureDetector>
          {msg.reactions && (
            <ReactionPills reactions={msg.reactions} myId={myId} onPillPress={emoji => onReactionPillPress(msg.id, emoji)} />
          )}
          <Animated.Text style={[s.timeBelow, isMine ? s.timeBelowMine : s.timeBelowTheirs, timeRevealStyle]}>
            {timeStr}
          </Animated.Text>
          {isFailed && (
            <Pressable onPress={() => onRetry?.(msg.id)} hitSlop={4}>
              <Text style={s.failedText}>⚠ Failed · Tap to retry</Text>
            </Pressable>
          )}
        </View>
      )
    }

    if (msg.content_type === 'voice' && msg.metadata?.url) {
      return (
        <View style={[s.bubbleWrap, isMine ? s.wrapMine : s.wrapTheirs]}>
          <GestureDetector gesture={gesture}>
            <Animated.View style={animStyle}>
              <VoiceBubble url={msg.metadata.url} duration={msg.metadata.duration} isMine={isMine} isPending={isPending} />
            </Animated.View>
          </GestureDetector>
          {msg.reactions && (
            <ReactionPills reactions={msg.reactions} myId={myId} onPillPress={emoji => onReactionPillPress(msg.id, emoji)} />
          )}
          <Animated.Text style={[s.timeBelow, isMine ? s.timeBelowMine : s.timeBelowTheirs, timeRevealStyle]}>
            {timeStr}
          </Animated.Text>
          {isFailed && (
            <Pressable onPress={() => onRetry?.(msg.id)} hitSlop={4}>
              <Text style={s.failedText}>⚠ Failed · Tap to retry</Text>
            </Pressable>
          )}
        </View>
      )
    }

    if (msg.content_type === 'event' && msg.metadata) {
      return <EventCard metadata={msg.metadata} isMine={isMine} sentAt={msg.sent_at} />
    }
    if (msg.content_type === 'profile' && msg.metadata) {
      return <ProfileCard metadata={msg.metadata} isMine={isMine} sentAt={msg.sent_at} />
    }

    // Text bubble (or, if the whole message is a link, a rich preview card)
    return (
      <View style={[s.bubbleWrap, isMine ? s.wrapMine : s.wrapTheirs]}>
        <GestureDetector gesture={gesture}>
          <Animated.View style={[
            s.bubble,
            isMine ? s.bubbleMine : s.bubbleTheirs,
            isPending && s.bubblePending,
            isFailed && s.bubbleFailed,
            hasReply && s.bubbleWithReply,
            isLinkMessage && s.bubbleLink,
            animStyle,
          ]}>
            <ReplyPreview metadata={msg.metadata} isMine={isMine} onPress={onReplyTap} />
            {isLinkMessage && msg.content ? (
              <LinkPreviewCard url={normalizeUrl(msg.content)} isMine={isMine} />
            ) : (
              <Text style={[s.text, isMine && s.textMine]}>{msg.content}</Text>
            )}
            {!isLinkMessage && (
              <Animated.Text style={[s.timeInner, timeRevealStyle]}>
                {timeStr}
              </Animated.Text>
            )}
          </Animated.View>
        </GestureDetector>
        {isLinkMessage && (
          <Animated.Text style={[s.timeBelow, isMine ? s.timeBelowMine : s.timeBelowTheirs, timeRevealStyle]}>
            {timeStr}
          </Animated.Text>
        )}
        {isFailed && (
          <Pressable onPress={() => onRetry?.(msg.id)} hitSlop={4}>
            <Text style={s.failedText}>⚠ Failed · Tap to retry</Text>
          </Pressable>
        )}
        {msg.reactions && (
          <ReactionPills
            reactions={msg.reactions}
            myId={myId}
            onPillPress={emoji => onReactionPillPress(msg.id, emoji)}
          />
        )}
      </View>
    )
  }

  if (!selectMode) return renderBubbleContent()

  return (
    <View style={sel.row}>
      <Pressable
        style={sel.checkboxWrap}
        onPress={() => { hSelection(); onToggleSelect?.(msg.id) }}
        hitSlop={8}
      >
        <View style={[sel.checkbox, isSelected && sel.checkboxChecked]}>
          {isSelected && <Check size={13} color="#111" strokeWidth={3} />}
        </View>
      </Pressable>
      <View style={sel.content}>
        {renderBubbleContent()}
        {/* Swallows taps/gestures on the bubble itself while selecting —
            tapping the message body toggles selection too, not just the box. */}
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={() => { hSelection(); onToggleSelect?.(msg.id) }}
        />
      </View>
    </View>
  )
}

const sel = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  checkboxWrap: { width: 36, alignItems: 'center', justifyContent: 'center' },
  checkbox: {
    width: 20, height: 20, borderRadius: 5,
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center', justifyContent: 'center',
  },
  checkboxChecked: { backgroundColor: Colors.brandOrange, borderColor: Colors.brandOrange },
  content: { flex: 1 },
})

const s = StyleSheet.create({
  bubbleWrap: { marginBottom: 4, maxWidth: '82%', overflow: 'visible' },
  wrapMine: { alignSelf: 'flex-end', alignItems: 'flex-end' },
  wrapTheirs: { alignSelf: 'flex-start', alignItems: 'flex-start' },

  bubble: {
    borderRadius: 18,
    paddingHorizontal: 10,
    paddingTop: 7,
    paddingBottom: 16,
  },
  bubbleWithReply: { minWidth: 160 },
  bubbleLink: { padding: 0, overflow: 'hidden' },
  bubbleTheirs: { backgroundColor: '#222', borderBottomLeftRadius: 4 },
  bubbleMine: {
    backgroundColor: 'rgba(255,107,53,0.22)',
    borderBottomRightRadius: 4,
  },
  bubblePending: { opacity: 0.6 },
  bubbleFailed: {
    borderWidth: 1,
    borderColor: Colors.brandCoral,
    opacity: 0.85,
  },
  bubbleUnsent: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    paddingVertical: 9,
  },
  unsentText: {
    fontFamily: FontFamily.bodyRegular,
    fontStyle: 'italic',
    fontSize: 13,
    color: Colors.inkDisabled,
  },
  text: { fontFamily: FontFamily.bodyRegular, fontSize: 15, color: Colors.inkPrimary, lineHeight: 21 },
  textMine: { color: Colors.inkPrimary },

  timeInner: {
    position: 'absolute',
    bottom: 3,
    right: 8,
    fontFamily: FontFamily.bodyRegular,
    fontSize: 10,
    color: 'rgba(255,255,255,0.4)',
  },

  timeBelow: { fontFamily: FontFamily.bodyRegular, fontSize: 10, color: Colors.inkDisabled, marginTop: 3 },
  timeBelowMine: { marginRight: 2 },
  timeBelowTheirs: { marginLeft: 2 },

  failedText: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 11,
    color: Colors.brandCoral,
    marginTop: 3,
  },

  richCard: {
    backgroundColor: '#1e1e1e', borderWidth: 1, borderColor: '#2a2a2a',
    borderRadius: 16, overflow: 'hidden', width: 260,
  },
  richCardImg: { width: '100%', height: 140 },
  richCardImgFallback: { backgroundColor: '#2a2a2a' },
  richCardBody: { padding: 12, gap: 4 },
  richCardTitle: { fontFamily: FontFamily.bodySemiBold, fontSize: 15, color: Colors.inkPrimary },
  richCardSub: { fontFamily: FontFamily.bodyRegular, fontSize: 12, color: Colors.inkSecondary },
  richCardBtn: {
    marginTop: 8, height: 38, borderRadius: 19,
    borderWidth: 1, borderColor: Colors.brandOrange,
    alignItems: 'center', justifyContent: 'center',
  },
  richCardBtnText: { fontFamily: FontFamily.bodySemiBold, fontSize: 13, color: Colors.brandOrange },
  profileRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12 },
  profileAvatar: { width: 44, height: 44, borderRadius: 22, borderWidth: 1.5, borderColor: Colors.brandOrange },
  profileAvatarFallback: { backgroundColor: '#2a2a2a', alignItems: 'center', justifyContent: 'center' },
  profileAvatarInitial: { fontFamily: FontFamily.headingBold, fontSize: 18, color: Colors.inkPrimary },
  profileChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingHorizontal: 12, paddingBottom: 4 },
  profileChip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.08)' },
  profileChipText: { fontFamily: FontFamily.bodyRegular, fontSize: 11, color: Colors.inkPrimary },
})
