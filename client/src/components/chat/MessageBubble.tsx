import { useCallback, useState } from 'react'
import { View, Text, Image, Pressable, StyleSheet } from 'react-native'
import { VideoView, useVideoPlayer } from 'expo-video'
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, runOnJS,
} from 'react-native-reanimated'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio'
import { router } from 'expo-router'
import { Play, Pause } from 'lucide-react-native'
import { Colors, FontFamily } from '@/constants'
import type { Message } from '@/api/apiService'
import { ReactionPills } from './ReactionPills'
import { PlaybackWave } from '@/components/ui'

// ── Reply preview ─────────────────────────────────────────────────────────────

function ReplyPreview({ metadata, isMine, onPress }: {
  metadata: Record<string, any> | null
  isMine: boolean
  onPress?: (msgId: string) => void
}) {
  if (!metadata?.reply_to) return null
  const rt = metadata.reply_to as {
    message_id?: string; content?: string; content_type?: string; sender_label?: string
  }
  const preview =
    rt.content_type === 'voice' ? '🎤 Voice message' :
    rt.content_type === 'event' ? '📅 Event' :
    rt.content_type === 'profile' ? '👤 Profile' :
    (rt.content ?? '')

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
        <Text style={rp.text} numberOfLines={1}>{preview}</Text>
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
  text: { fontFamily: FontFamily.bodyRegular, fontSize: 12, color: 'rgba(255,255,255,0.5)' },
})

// ── Voice bubble ──────────────────────────────────────────────────────────────

function VoiceBubble({ url, duration, isMine }: {
  url: string; duration?: number; isMine: boolean
}) {
  const player = useAudioPlayer(null)
  const status = useAudioPlayerStatus(player)

  const handleToggle = () => {
    if (status.playing) { player.pause() }
    else { player.replace({ uri: url }); player.seekTo(0); player.play() }
  }

  const dur = duration ?? 0
  const durationStr = `${Math.floor(dur / 60)}:${String(dur % 60).padStart(2, '0')}`

  return (
    <View style={[vb.bubble, isMine ? vb.bubbleMine : vb.bubbleTheirs]}>
      <Pressable onPress={handleToggle} style={vb.playBtn}>
        {status.playing
          ? <Pause size={15} color="#111" strokeWidth={2.5} />
          : <Play size={15} color="#111" strokeWidth={2.5} />
        }
      </Pressable>
      <View style={vb.waveWrap}>
        <PlaybackWave isActive={status.playing} compact color={isMine ? Colors.brandOrange : '#888'} />
      </View>
      <Text style={[vb.duration, { color: isMine ? Colors.inkPrimary : Colors.inkSecondary }]}>
        {durationStr}
      </Text>
    </View>
  )
}

const vb = StyleSheet.create({
  bubble: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 10 },
  bubbleMine: { backgroundColor: 'rgba(255,107,53,0.18)', borderWidth: 1, borderColor: 'rgba(255,107,53,0.35)', borderBottomRightRadius: 4 },
  bubbleTheirs: { backgroundColor: '#222', borderWidth: 1, borderColor: '#2a2a2a', borderBottomLeftRadius: 4 },
  playBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.brandOrange, alignItems: 'center', justifyContent: 'center' },
  waveWrap: { flex: 1, overflow: 'hidden' },
  duration: { fontFamily: FontFamily.bodyRegular, fontSize: 11, minWidth: 30, textAlign: 'right' },
})

// ── Media bubble (image / gif / video) ────────────────────────────────────────

const MEDIA_WIDTH = 220

function ImageChatBubble({ url, isMine, width: srcW, height: srcH }: {
  url: string; isMine: boolean; width?: number; height?: number
}) {
  const aspectRatio = srcW && srcH ? srcW / srcH : 4 / 3
  const displayH = Math.round(MEDIA_WIDTH / aspectRatio)
  return (
    <Image
      source={{ uri: url }}
      style={[mc.img, { width: MEDIA_WIDTH, height: Math.min(Math.max(displayH, 120), 320) }]}
      resizeMode="cover"
    />
  )
}

function VideoChatBubble({ url, isMine }: { url: string; isMine: boolean }) {
  const [playing, setPlaying] = useState(false)
  const player = useVideoPlayer(url, p => { p.loop = false })

  const toggle = () => {
    if (playing) { player.pause(); setPlaying(false) }
    else { player.play(); setPlaying(true) }
  }

  return (
    <Pressable onPress={toggle} style={mc.videoWrap}>
      <VideoView player={player} style={mc.video} contentFit="cover" nativeControls={false} />
      {!playing && (
        <View style={mc.playOverlay}>
          <Play size={28} color="#fff" fill="#fff" strokeWidth={0} />
        </View>
      )}
    </Pressable>
  )
}

const mc = StyleSheet.create({
  img: { borderRadius: 14 },
  videoWrap: { width: MEDIA_WIDTH, height: 160, borderRadius: 14, overflow: 'hidden', backgroundColor: '#111' },
  video: { width: MEDIA_WIDTH, height: 160 },
  playOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
})

// ── Event / Profile cards ─────────────────────────────────────────────────────

function EventCard({ metadata, isMine, sentAt }: { metadata: Record<string, any>; isMine: boolean; sentAt: string }) {
  return (
    <View style={[s.bubbleWrap, isMine ? s.wrapMine : s.wrapTheirs]}>
      <View style={s.richCard}>
        {metadata.cover_url
          ? <Image source={{ uri: metadata.cover_url }} style={s.richCardImg} />
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
            ? <Image source={{ uri: metadata.avatar_url }} style={s.profileAvatar} />
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
  onDoubleTap: (msgId: string) => void
  onLongPress: (msgId: string, pageY: number, isMine: boolean) => void
  onSwipeReply: (msg: Message) => void
  onReactionPillPress: (msgId: string, emoji: string) => void
  onReplyTap: (originalMsgId: string) => void
}

export function MessageBubble({ msg, isMine, myId, onDoubleTap, onLongPress, onSwipeReply, onReactionPillPress, onReplyTap }: Props) {
  const translateX = useSharedValue(0)
  const hasTriggeredReply = useSharedValue(false)

  const handleDoubleTap = useCallback(() => onDoubleTap(msg.id), [msg.id, onDoubleTap])
  const handleSwipeReply = useCallback(() => onSwipeReply(msg), [msg, onSwipeReply])

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .maxDelay(250)
    .onEnd(() => runOnJS(handleDoubleTap)())

  const longPress = Gesture.LongPress()
    .minDuration(400)
    .onStart(e => runOnJS(onLongPress)(msg.id, e.absoluteY, isMine))

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

  const gesture = Gesture.Simultaneous(pan, Gesture.Exclusive(doubleTap, longPress))

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: isMine ? -translateX.value : translateX.value }],
  }))

  // Timestamp fades in as you swipe, hidden at rest
  const timeRevealStyle = useAnimatedStyle(() => ({
    opacity: Math.min(translateX.value / 40, 1),
  }))

  const isPending = msg.id.startsWith('_temp_')
  const hasReply = !!msg.metadata?.reply_to
  const timeStr = isPending ? '…' : new Date(msg.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  const renderBubbleContent = () => {
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
              />
            </Animated.View>
          </GestureDetector>
          <Animated.Text style={[s.timeBelow, isMine ? s.timeBelowMine : s.timeBelowTheirs, timeRevealStyle]}>
            {timeStr}
          </Animated.Text>
          {msg.reactions && (
            <ReactionPills reactions={msg.reactions} myId={myId} onPillPress={emoji => onReactionPillPress(msg.id, emoji)} />
          )}
        </View>
      )
    }
    if (msg.content_type === 'video' && msg.metadata?.url) {
      return (
        <View style={[s.bubbleWrap, isMine ? s.wrapMine : s.wrapTheirs]}>
          <GestureDetector gesture={gesture}>
            <Animated.View style={animStyle}>
              <VideoChatBubble url={msg.metadata.url} isMine={isMine} />
            </Animated.View>
          </GestureDetector>
          <Animated.Text style={[s.timeBelow, isMine ? s.timeBelowMine : s.timeBelowTheirs, timeRevealStyle]}>
            {timeStr}
          </Animated.Text>
          {msg.reactions && (
            <ReactionPills reactions={msg.reactions} myId={myId} onPillPress={emoji => onReactionPillPress(msg.id, emoji)} />
          )}
        </View>
      )
    }
    if (msg.content_type === 'voice' && msg.metadata?.url) {
      return (
        // Voice: gesture wraps only the voice bubble row
        <View style={[s.bubbleWrap, isMine ? s.wrapMine : s.wrapTheirs]}>
          <GestureDetector gesture={gesture}>
            <Animated.View style={animStyle}>
              <VoiceBubble url={msg.metadata.url} duration={msg.metadata.duration} isMine={isMine} />
            </Animated.View>
          </GestureDetector>
          <Animated.Text style={[s.timeBelow, isMine ? s.timeBelowMine : s.timeBelowTheirs, timeRevealStyle]}>
            {timeStr}
          </Animated.Text>
          {msg.reactions && (
            <ReactionPills reactions={msg.reactions} myId={myId} onPillPress={emoji => onReactionPillPress(msg.id, emoji)} />
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
    // Text bubble: gesture detector wraps ONLY the bubble (not full row width)
    return (
      <View style={[s.bubbleWrap, isMine ? s.wrapMine : s.wrapTheirs]}>
        <GestureDetector gesture={gesture}>
          {/* Animated.View IS the bubble — sized to content, gesture area = bubble area */}
          <Animated.View style={[
            s.bubble,
            isMine ? s.bubbleMine : s.bubbleTheirs,
            isPending && s.bubblePending,
            hasReply && s.bubbleWithReply,
            animStyle,
          ]}>
            <ReplyPreview metadata={msg.metadata} isMine={isMine} onPress={onReplyTap} />
            <Text style={[s.text, isMine && s.textMine]}>{msg.content}</Text>
            {/* Timestamp inside bubble — takes no layout space, revealed on swipe */}
            <Animated.Text style={[s.timeInner, timeRevealStyle]}>
              {timeStr}
            </Animated.Text>
          </Animated.View>
        </GestureDetector>
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

  return renderBubbleContent()
}

const s = StyleSheet.create({
  // bubbleWrap: outer container for a single message row
  // wrapMine/wrapTheirs: aligns children (gesture detector, reactions) left or right
  // alignItems: 'flex-end/start' is critical — it makes GestureDetector shrink to content width
  bubbleWrap: { marginBottom: 4, maxWidth: '82%' },
  wrapMine: { alignSelf: 'flex-end', alignItems: 'flex-end' },
  wrapTheirs: { alignSelf: 'flex-start', alignItems: 'flex-start' },

  // Text bubble — Animated.View uses these styles directly
  bubble: {
    borderRadius: 18,
    paddingHorizontal: 10,
    paddingTop: 7,
    paddingBottom: 16,  // room for absolute timestamp at bottom
  },
  bubbleWithReply: { minWidth: 160 },
  bubbleTheirs: { backgroundColor: '#222', borderBottomLeftRadius: 4 },
  bubbleMine: {
    backgroundColor: 'rgba(255,107,53,0.22)',
    borderBottomRightRadius: 4,
  },
  bubblePending: { opacity: 0.6 },
  text: { fontFamily: FontFamily.bodyRegular, fontSize: 15, color: Colors.inkPrimary, lineHeight: 21 },
  textMine: { color: Colors.inkPrimary },

  // Timestamp inside text bubble — absolutely positioned, no layout impact
  timeInner: {
    position: 'absolute',
    bottom: 3,
    right: 8,
    fontFamily: FontFamily.bodyRegular,
    fontSize: 10,
    color: 'rgba(255,255,255,0.4)',
  },

  // Timestamp below voice/event/profile bubbles — revealed on swipe
  timeBelow: { fontFamily: FontFamily.bodyRegular, fontSize: 10, color: Colors.inkDisabled, marginTop: 3 },
  timeBelowMine: { marginRight: 2 },
  timeBelowTheirs: { marginLeft: 2 },

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
