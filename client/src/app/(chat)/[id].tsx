import { useState, useRef, useCallback, useEffect, forwardRef, useMemo } from 'react'
import {
  View, Text, StyleSheet, FlatList, Pressable, TextInput,
  Image, ActivityIndicator,
  type ScrollViewProps, type LayoutChangeEvent,
} from 'react-native'
import { useSharedValue, withTiming } from 'react-native-reanimated'
import {
  KeyboardChatScrollView,
  KeyboardGestureArea,
  KeyboardStickyView,
  type KeyboardChatScrollViewProps,
} from 'react-native-keyboard-controller'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { router, useLocalSearchParams } from 'expo-router'
import { ChevronLeft, MoreVertical, Send, Trash2, Mic, Square, Play, Pause } from 'lucide-react-native'
import {
  useAudioRecorder, useAudioRecorderState,
  useAudioPlayer, useAudioPlayerStatus,
  setAudioModeAsync, RecordingPresets, AudioModule,
} from 'expo-audio'
import { useChat } from '@/hooks/useChat'
import { useAuthStore } from '@/store/auth'
import { BlockSheet, ReportSheet, RecordingWave, PlaybackWave } from '@/components/ui'
import { usePillStore } from '@/store/pillStore'
import ApiService, { Message } from '@/api/apiService'
import { Colors, FontFamily } from '@/constants'

const MARGIN = 8
const MIN_INPUT_HEIGHT = 44

// ── Date separator helpers ────────────────────────────────────────────────────

type ListItem = Message | { type: 'date_sep'; label: string; id: string }

function getDateLabel(dateStr: string): string {
  const d = new Date(dateStr)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1)
  const msgDay = new Date(d.getFullYear(), d.getMonth(), d.getDate())

  if (msgDay.getTime() === today.getTime()) return 'Today'
  if (msgDay.getTime() === yesterday.getTime()) return 'Yesterday'
  return d.toLocaleDateString('en-US', {
    month: 'long', day: 'numeric',
    ...(d.getFullYear() !== now.getFullYear() ? { year: 'numeric' } : {}),
  })
}

// messages is newest-first; insert a date label above each day group
function buildListData(messages: Message[]): ListItem[] {
  const result: ListItem[] = []
  for (let i = 0; i < messages.length; i++) {
    result.push(messages[i])
    const curr = new Date(messages[i].sent_at).toDateString()
    const next = i + 1 < messages.length ? new Date(messages[i + 1].sent_at).toDateString() : null
    if (curr !== next) {
      result.push({ type: 'date_sep', label: getDateLabel(messages[i].sent_at), id: `sep_${messages[i].id}` })
    }
  }
  return result
}

function DateSeparator({ label }: { label: string }) {
  return (
    <View style={ds.wrap}>
      <View style={ds.line} />
      <Text style={ds.label}>{label}</Text>
      <View style={ds.line} />
    </View>
  )
}

const ds = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', marginVertical: 16, marginHorizontal: 16 },
  line: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: 'rgba(255,255,255,0.1)' },
  label: {
    fontFamily: FontFamily.bodyRegular, fontSize: 11,
    color: 'rgba(255,255,255,0.35)',
    marginHorizontal: 10, letterSpacing: 0.5,
  },
})

// ── FlatList scroll component — wraps KeyboardChatScrollView ──────────────────
// Defined outside the screen so the reference is stable across renders.

type ChatScrollRef = React.ElementRef<typeof KeyboardChatScrollView>
type ChatScrollProps = ScrollViewProps & KeyboardChatScrollViewProps

const ChatScrollView = forwardRef<ChatScrollRef, ChatScrollProps>(
  ({ inverted, ...props }, ref) => {
    const { bottom } = useSafeAreaInsets()
    return (
      <KeyboardChatScrollView
        ref={ref}
        automaticallyAdjustContentInsets={false}
        contentInsetAdjustmentBehavior="never"
        keyboardDismissMode="interactive"
        offset={bottom - MARGIN}
        inverted={inverted}
        {...props}
      />
    )
  }
)

// ── Voice message bubble ──────────────────────────────────────────────────────

function VoiceBubble({ url, duration, isMine, sentAt }: {
  url: string; duration?: number; isMine: boolean; sentAt: string
}) {
  const player = useAudioPlayer(null)
  const status = useAudioPlayerStatus(player)

  useEffect(() => { player.replace({ uri: url }) }, [url])

  const handleToggle = () => {
    if (status.playing) { player.pause() } else { player.seekTo(0); player.play() }
  }

  const dur = duration ?? 0
  const durationStr = `${Math.floor(dur / 60)}:${String(dur % 60).padStart(2, '0')}`

  return (
    <View style={[s.bubbleWrap, isMine ? s.bubbleWrapMine : s.bubbleWrapTheirs]}>
      <View style={[s.voiceBubble, isMine ? s.voiceBubbleMine : s.voiceBubbleTheirs]}>
        <Pressable onPress={handleToggle} style={s.voicePlayBtn}>
          {status.playing
            ? <Pause size={15} color="#111" strokeWidth={2.5} />
            : <Play  size={15} color="#111" strokeWidth={2.5} />
          }
        </Pressable>
        <View style={s.voiceWaveWrap}>
          <PlaybackWave isActive={status.playing} compact color={isMine ? Colors.brandOrange : '#888'} />
        </View>
        <Text style={[s.voiceDuration, { color: isMine ? Colors.inkPrimary : Colors.inkSecondary }]}>
          {durationStr}
        </Text>
      </View>
      <Text style={[s.bubbleTime, isMine ? s.bubbleTimeMine : s.bubbleTimeTheirs]}>
        {new Date(sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </Text>
    </View>
  )
}

// ── Message bubbles ───────────────────────────────────────────────────────────

function MsgBubble({ msg, isMine }: { msg: Message; isMine: boolean }) {
  if (msg.content_type === 'voice' && msg.metadata?.url) {
    return <VoiceBubble url={msg.metadata.url} duration={msg.metadata.duration} isMine={isMine} sentAt={msg.sent_at} />
  }
  if (msg.content_type === 'event' && msg.metadata) {
    return <EventCard metadata={msg.metadata} isMine={isMine} sentAt={msg.sent_at} />
  }
  if (msg.content_type === 'profile' && msg.metadata) {
    return <ProfileCard metadata={msg.metadata} isMine={isMine} sentAt={msg.sent_at} />
  }

  const isPending = msg.id.startsWith('_temp_')
  return (
    <View style={[s.bubbleWrap, isMine ? s.bubbleWrapMine : s.bubbleWrapTheirs]}>
      <View style={[s.bubble, isMine ? s.bubbleMine : s.bubbleTheirs, isPending && s.bubblePending]}>
        <Text style={[s.bubbleText, isMine && s.bubbleTextMine]}>{msg.content}</Text>
      </View>
      <Text style={[s.bubbleTime, isMine ? s.bubbleTimeMine : s.bubbleTimeTheirs]}>
        {isPending ? '…' : new Date(msg.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </Text>
    </View>
  )
}

function EventCard({ metadata, isMine, sentAt }: { metadata: Record<string, any>; isMine: boolean; sentAt: string }) {
  return (
    <View style={[s.bubbleWrap, isMine ? s.bubbleWrapMine : s.bubbleWrapTheirs]}>
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
      <Text style={[s.bubbleTime, isMine ? s.bubbleTimeMine : s.bubbleTimeTheirs]}>
        {new Date(sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </Text>
    </View>
  )
}

function ProfileCard({ metadata, isMine, sentAt }: { metadata: Record<string, any>; isMine: boolean; sentAt: string }) {
  return (
    <View style={[s.bubbleWrap, isMine ? s.bubbleWrapMine : s.bubbleWrapTheirs]}>
      <View style={s.richCard}>
        <View style={s.profileCardRow}>
          {metadata.avatar_url
            ? <Image source={{ uri: metadata.avatar_url }} style={s.profileAvatar} />
            : <View style={[s.profileAvatar, s.profileAvatarFallback]}>
                <Text style={s.profileAvatarInitial}>{(metadata.name ?? '?').charAt(0)}</Text>
              </View>
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
      <Text style={[s.bubbleTime, isMine ? s.bubbleTimeMine : s.bubbleTimeTheirs]}>
        {new Date(sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </Text>
    </View>
  )
}

function TypingIndicator() {
  return (
    <View style={[s.bubbleWrap, s.bubbleWrapTheirs]}>
      <View style={[s.bubble, s.bubbleTheirs, s.typingBubble]}>
        <View style={s.typingDots}>
          <View style={s.dot} /><View style={s.dot} /><View style={s.dot} />
        </View>
      </View>
    </View>
  )
}

function VoiceIndicator() {
  return (
    <View style={[s.bubbleWrap, s.bubbleWrapTheirs]}>
      <View style={[s.bubble, s.bubbleTheirs, s.typingBubble]}>
        <Mic size={13} color={Colors.brandOrange} strokeWidth={2} />
        <Text style={s.voiceIndicatorText}>Recording…</Text>
      </View>
    </View>
  )
}

// ── Screen ────────────────────────────────────────────────────────────────────

type RecordState = 'idle' | 'recording' | 'sending'

function formatRecordTime(ms: number): string {
  const sec = Math.floor(ms / 1000)
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`
}

export default function ChatDetailScreen() {
  const { id: convId } = useLocalSearchParams<{ id: string }>()
  const insets = useSafeAreaInsets()
  const myId = useAuthStore(st => st.userId)
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const recordAutoStopRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const recordStartRef = useRef(0)

  const [inputText, setInputText] = useState('')
  const [inputBarHeight, setInputBarHeight] = useState(MIN_INPUT_HEIGHT)
  const [partnerName, setPartnerName] = useState<string | null>(null)
  const [partnerUsername, setPartnerUsername] = useState<string | null>(null)
  const [partnerAvatar, setPartnerAvatar] = useState<string | null>(null)
  const [partnerId, setPartnerId] = useState<string | null>(null)
  const [blockStatus, setBlockStatus] = useState<'none' | 'i_blocked' | 'they_blocked'>('none')
  const [menuOpen, setMenuOpen] = useState(false)
  const [reportOpen, setReportOpen] = useState(false)
  const [recordState, setRecordState] = useState<RecordState>('idle')

  // Tracks how much the multiline input has grown above its baseline height
  const extraContentPadding = useSharedValue(0)

  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY)
  const recorderState = useAudioRecorderState(recorder, 250)

  const {
    messages, isPartnerTyping, isPartnerRecording, isPartnerOnline,
    isWsConnected, wsError, loading,
    sendMessage, sendTyping, sendVoiceTyping, loadMore,
  } = useChat(convId)
  const showPill = usePillStore(st => st.show)

  // renderScrollComponent must be stable — useCallback with SharedValue dep (ref-stable)
  const renderScrollComponent = useCallback(
    (props: ScrollViewProps) => (
      <ChatScrollView {...props} extraContentPadding={extraContentPadding} />
    ),
    [extraContentPadding]
  )

  // opened offset: when keyboard is open the sticky view sits MARGIN above safe area
  const stickyOffset = useMemo(() => ({ opened: insets.bottom - MARGIN }), [insets.bottom])

  useEffect(() => {
    if (wsError === 'blocked') setBlockStatus(prev => prev === 'none' ? 'they_blocked' : prev)
  }, [wsError])

  useEffect(() => {
    ApiService.getConversations().then(data => {
      const conv = [...data.active, ...data.locked, ...data.pending].find(c => c.id === convId)
      if (conv) {
        setPartnerName(conv.partner_name)
        setPartnerUsername(conv.partner_username ?? null)
        setPartnerAvatar(conv.partner_avatar)
        setPartnerId(conv.partner_id)
        setBlockStatus((conv as any).block_status ?? 'none')
      }
    }).catch(() => {})
  }, [convId])

  useEffect(() => {
    return () => { if (recordAutoStopRef.current) clearTimeout(recordAutoStopRef.current) }
  }, [])

  const handleSend = useCallback(async () => {
    const text = inputText.trim()
    if (!text) return
    setInputText('')
    sendTyping(false)
    try { await sendMessage(text) }
    catch { setInputText(text); showPill('Message failed to send', 'error') }
  }, [inputText, sendMessage, sendTyping, showPill])

  const handleTextChange = useCallback((t: string) => {
    setInputText(t)
    sendTyping(t.length > 0)
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current)
    if (t.length > 0) {
      typingTimerRef.current = setTimeout(() => sendTyping(false), 2000)
    }
  }, [sendTyping])

  // Tracks input growth for KeyboardGestureArea + extraContentPadding
  const handleInputLayout = useCallback((e: LayoutChangeEvent) => {
    const h = e.nativeEvent.layout.height
    setInputBarHeight(h)
    extraContentPadding.value = withTiming(Math.max(h - MIN_INPUT_HEIGHT, 0), { duration: 200 })
  }, [extraContentPadding])

  const handleRecordStop = useCallback(async () => {
    if (recordAutoStopRef.current) clearTimeout(recordAutoStopRef.current)
    sendVoiceTyping(false)
    setRecordState('sending')
    try {
      await recorder.stop()
      const uri = recorder.uri
      if (!uri) throw new Error('No URI')
      const url = await ApiService.uploadVoice(uri)
      const duration = Math.round((Date.now() - recordStartRef.current) / 1000)
      await sendMessage('', 'voice', { url, duration })
    } catch { showPill('Failed to send voice message', 'error') }
    try { await setAudioModeAsync({ allowsRecording: false }) } catch {}
    setRecordState('idle')
  }, [recorder, sendMessage, sendVoiceTyping, showPill])

  const handleMicPress = useCallback(async () => {
    try {
      const perm = await AudioModule.requestRecordingPermissionsAsync()
      if (!perm.granted) { showPill('Microphone permission denied', 'error'); return }
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true })
      await recorder.prepareToRecordAsync()
      recorder.record()
      recordStartRef.current = Date.now()
      sendVoiceTyping(true)
      setRecordState('recording')
      recordAutoStopRef.current = setTimeout(() => handleRecordStop(), 120_000)
    } catch { showPill('Could not start recording', 'error') }
  }, [recorder, sendVoiceTyping, handleRecordStop, showPill])

  const handleRecordCancel = useCallback(async () => {
    if (recordAutoStopRef.current) clearTimeout(recordAutoStopRef.current)
    sendVoiceTyping(false)
    try { await recorder.stop(); await setAudioModeAsync({ allowsRecording: false }) } catch {}
    setRecordState('idle')
  }, [recorder, sendVoiceTyping])

  const handleBlock = useCallback(async () => {
    if (!partnerId) return
    try { await ApiService.blockUser(partnerId); setBlockStatus('i_blocked') }
    catch { showPill('Could not block user', 'error') }
  }, [partnerId, showPill])

  const handleUnblock = useCallback(async () => {
    if (!partnerId) return
    try { await ApiService.unblockUser(partnerId); setBlockStatus('none') }
    catch { showPill('Could not unblock user', 'error') }
  }, [partnerId, showPill])

  const handleDeleteChat = useCallback(async () => {
    try { await ApiService.deleteConversation(convId); router.back() }
    catch { showPill('Could not delete chat', 'error') }
  }, [convId, showPill])

  const handleReport = useCallback(async (reason: string) => {
    try { if (partnerId) await ApiService.reportUser(partnerId, reason) }
    catch { showPill('Could not submit report', 'error') }
  }, [partnerId, showPill])

  const listData = useMemo(() => buildListData(messages), [messages])

  const renderItem = useCallback(({ item }: { item: ListItem }) => {
    if ('type' in item && item.type === 'date_sep') return <DateSeparator label={item.label} />
    const msg = item as Message
    return <MsgBubble msg={msg} isMine={msg.sender_id === myId} />
  }, [myId])

  const listHeader = isPartnerRecording
    ? <VoiceIndicator />
    : isPartnerTyping ? <TypingIndicator /> : null

  // ── Input bar content ────────────────────────────────────────────────────

  const renderInputContent = () => {
    if (blockStatus === 'they_blocked') {
      return (
        <View style={s.blockNotice}>
          <Text style={s.blockNoticeText}>You can't message this person.</Text>
        </View>
      )
    }
    if (blockStatus === 'i_blocked') {
      return (
        <View style={s.blockBar}>
          <Text style={s.blockBarText}>You blocked this person.</Text>
          <View style={s.blockBtnRow}>
            <Pressable style={s.unblockBtn} onPress={handleUnblock}>
              <Text style={s.unblockBtnText}>Unblock</Text>
            </Pressable>
            <Pressable style={s.deleteBtn} onPress={handleDeleteChat}>
              <Trash2 size={14} color={Colors.brandCoral} strokeWidth={1.8} />
              <Text style={s.deleteBtnText}>Delete Chat</Text>
            </Pressable>
          </View>
        </View>
      )
    }
    if (recordState === 'recording') {
      return (
        <View style={s.recordBar}>
          <Pressable style={s.recordCancelBtn} onPress={handleRecordCancel} hitSlop={8}>
            <Text style={s.recordCancelText}>Cancel</Text>
          </Pressable>
          <View style={s.recordCenter}>
            <RecordingWave isActive />
            <Text style={s.recordTimer}>{formatRecordTime(recorderState.durationMillis ?? 0)}</Text>
          </View>
          <Pressable style={s.recordStopBtn} onPress={handleRecordStop}>
            <Square size={16} color="#111" strokeWidth={0} fill="#111" />
          </Pressable>
        </View>
      )
    }
    if (recordState === 'sending') {
      return (
        <View style={s.recordBar}>
          <ActivityIndicator size="small" color={Colors.brandOrange} />
          <Text style={s.sendingText}>Sending voice…</Text>
        </View>
      )
    }
    return (
      <View style={s.inputBar}>
        <View style={s.inputWrap}>
          <TextInput
            nativeID="chat-input"
            style={s.textInput}
            value={inputText}
            onChangeText={handleTextChange}
            onLayout={handleInputLayout}
            placeholder="Type a message..."
            placeholderTextColor={Colors.inkDisabled}
            multiline
          />
        </View>
        {inputText.trim() ? (
          <Pressable style={s.actionBtn} onPress={handleSend}>
            <Send size={18} color="#111" strokeWidth={2} fill="#111" />
          </Pressable>
        ) : (
          <Pressable style={s.actionBtn} onPress={handleMicPress}>
            <Mic size={20} color="#111" strokeWidth={2} />
          </Pressable>
        )}
      </View>
    )
  }

  return (
    <View style={s.root}>

      {/* ── Header — never moves ─────────────────────────────────── */}
      <View style={[s.header, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => router.back()} style={s.backBtn} hitSlop={8}>
          <ChevronLeft size={24} color={Colors.brandOrange} strokeWidth={2} />
        </Pressable>
        <Pressable
          style={s.headerCenter}
          onPress={() => partnerId && router.push(`/(profile)/${partnerId}` as any)}
        >
          {partnerAvatar
            ? <Image source={{ uri: partnerAvatar }} style={s.headerAvatar} />
            : <View style={[s.headerAvatar, s.headerAvatarFallback]}>
                <Text style={s.headerAvatarInitial}>{(partnerName ?? '?').charAt(0)}</Text>
              </View>
          }
          <View>
            <View style={s.headerNameRow}>
              <Text style={s.headerName}>{partnerName ?? 'Chat'}</Text>
              {isPartnerOnline && <View style={s.onlineDot} />}
            </View>
            <Text style={s.headerSub}>
              {partnerUsername ? `@${partnerUsername}` : (isPartnerOnline ? 'Active now' : 'Tap for profile')}
            </Text>
          </View>
        </Pressable>
        <Pressable onPress={() => setMenuOpen(true)} hitSlop={8}>
          <MoreVertical size={22} color={Colors.inkSecondary} strokeWidth={1.8} />
        </Pressable>
      </View>

      {!isWsConnected && !loading && (
        <View style={s.disconnectBanner}>
          <Text style={s.disconnectBannerText}>Reconnecting…</Text>
        </View>
      )}

      {/* ── Chat body ────────────────────────────────────────────────
          SafeAreaView edges={["bottom"]} handles home indicator padding.
          KeyboardGestureArea enables interactive swipe-to-dismiss.
          KeyboardChatScrollView (via renderScrollComponent) drives
          smooth content repositioning as the keyboard moves.
          KeyboardStickyView pins the input bar to the keyboard edge. */}
      <SafeAreaView edges={['bottom']} style={s.chatBody}>
        {loading ? (
          <View style={s.center}>
            <ActivityIndicator color={Colors.brandOrange} />
          </View>
        ) : (
          <KeyboardGestureArea
            interpolator="ios"
            offset={inputBarHeight}
            style={s.chatBody}
            textInputNativeID="chat-input"
          >
            <FlatList
              data={listData}
              keyExtractor={item => 'type' in item && item.type === 'date_sep' ? item.id : (item as Message).id}
              renderItem={renderItem}
              inverted
              contentContainerStyle={s.msgList}
              showsVerticalScrollIndicator={false}
              onEndReached={loadMore}
              onEndReachedThreshold={0.2}
              ListHeaderComponent={listHeader}
              keyboardShouldPersistTaps="handled"
              renderScrollComponent={renderScrollComponent}
            />

            <KeyboardStickyView offset={stickyOffset} style={s.stickyWrap}>
              {renderInputContent()}
            </KeyboardStickyView>
          </KeyboardGestureArea>
        )}
      </SafeAreaView>

      <BlockSheet
        visible={menuOpen}
        targetName={partnerName}
        isBlocked={blockStatus === 'i_blocked'}
        onBlock={async () => { await handleBlock(); setMenuOpen(false) }}
        onUnblock={async () => { await handleUnblock(); setMenuOpen(false) }}
        onClose={() => setMenuOpen(false)}
      />
      <ReportSheet
        visible={reportOpen}
        targetName={partnerName}
        onSubmit={handleReport}
        onClose={() => setReportOpen(false)}
      />
    </View>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  chatBody: { flex: 1 },
  stickyWrap: { backgroundColor: Colors.background },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.08)',
    backgroundColor: Colors.background,
  },
  backBtn: { padding: 4, marginRight: 8 },
  headerCenter: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerAvatar: { width: 38, height: 38, borderRadius: 19, borderWidth: 1.5, borderColor: Colors.brandOrange },
  headerAvatarFallback: { backgroundColor: '#2a2a2a', alignItems: 'center', justifyContent: 'center' },
  headerAvatarInitial: { fontFamily: FontFamily.headingBold, fontSize: 16, color: Colors.inkPrimary },
  headerNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  headerName: { fontFamily: FontFamily.headingBold, fontSize: 17, color: Colors.brandOrange },
  headerSub: { fontFamily: FontFamily.bodyRegular, fontSize: 11, color: Colors.inkSecondary },
  onlineDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#4CAF50' },

  disconnectBanner: {
    backgroundColor: 'rgba(255,107,53,0.12)',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,107,53,0.3)',
    paddingVertical: 5,
    alignItems: 'center',
  },
  disconnectBannerText: { fontFamily: FontFamily.bodyRegular, fontSize: 12, color: Colors.brandOrange },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  msgList: { paddingHorizontal: 16, paddingVertical: 12 },

  // Bubbles
  bubbleWrap: { marginBottom: 12, maxWidth: '82%' },
  bubbleWrapMine: { alignSelf: 'flex-end', alignItems: 'flex-end' },
  bubbleWrapTheirs: { alignSelf: 'flex-start', alignItems: 'flex-start' },
  bubble: { borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10 },
  bubbleTheirs: { backgroundColor: '#222', borderWidth: 1, borderColor: '#2a2a2a', borderBottomLeftRadius: 4 },
  bubbleMine: {
    backgroundColor: 'rgba(255,107,53,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255,107,53,0.35)',
    borderBottomRightRadius: 4,
  },
  bubblePending: { opacity: 0.6 },
  bubbleText: { fontFamily: FontFamily.bodyRegular, fontSize: 15, color: Colors.inkPrimary, lineHeight: 22 },
  bubbleTextMine: { color: Colors.inkPrimary },
  bubbleTime: { fontFamily: FontFamily.bodyRegular, fontSize: 10, color: Colors.inkDisabled, marginTop: 4 },
  bubbleTimeMine: { marginRight: 2 },
  bubbleTimeTheirs: { marginLeft: 2 },

  // Voice bubble
  voiceBubble: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderRadius: 16, paddingHorizontal: 12, paddingVertical: 10,
  },
  voiceBubbleMine: {
    backgroundColor: 'rgba(255,107,53,0.18)', borderWidth: 1,
    borderColor: 'rgba(255,107,53,0.35)', borderBottomRightRadius: 4,
  },
  voiceBubbleTheirs: { backgroundColor: '#222', borderWidth: 1, borderColor: '#2a2a2a', borderBottomLeftRadius: 4 },
  voicePlayBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: Colors.brandOrange,
    alignItems: 'center', justifyContent: 'center',
  },
  voiceWaveWrap: { flex: 1, overflow: 'hidden' },
  voiceDuration: { fontFamily: FontFamily.bodyRegular, fontSize: 11, minWidth: 30, textAlign: 'right' },

  // Typing / voice indicators
  typingBubble: { paddingVertical: 12, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 6 },
  typingDots: { flexDirection: 'row', gap: 4 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.brandOrange, opacity: 0.7 },
  voiceIndicatorText: { fontFamily: FontFamily.bodyRegular, fontSize: 13, color: Colors.brandOrange },

  // Rich cards
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

  profileCardRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12 },
  profileAvatar: { width: 44, height: 44, borderRadius: 22, borderWidth: 1.5, borderColor: Colors.brandOrange },
  profileAvatarFallback: { backgroundColor: '#2a2a2a', alignItems: 'center', justifyContent: 'center' },
  profileAvatarInitial: { fontFamily: FontFamily.headingBold, fontSize: 18, color: Colors.inkPrimary },
  profileChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingHorizontal: 12, paddingBottom: 4 },
  profileChip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.08)' },
  profileChipText: { fontFamily: FontFamily.bodyRegular, fontSize: 11, color: Colors.inkPrimary },

  // Block bars
  blockNotice: {
    paddingHorizontal: 20, paddingVertical: 14,
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
  },
  blockNoticeText: { fontFamily: FontFamily.bodyRegular, fontSize: 14, color: Colors.inkSecondary },
  blockBar: {
    paddingHorizontal: 20, paddingTop: 14, paddingBottom: 10,
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)',
    gap: 10,
  },
  blockBarText: { fontFamily: FontFamily.bodyRegular, fontSize: 13, color: Colors.inkSecondary, textAlign: 'center' },
  blockBtnRow: { flexDirection: 'row', gap: 10 },
  unblockBtn: {
    flex: 1, height: 40, borderRadius: 12,
    borderWidth: 1, borderColor: Colors.brandOrange,
    alignItems: 'center', justifyContent: 'center',
  },
  unblockBtnText: { fontFamily: FontFamily.bodySemiBold, fontSize: 14, color: Colors.brandOrange },
  deleteBtn: {
    flex: 1, height: 40, borderRadius: 12,
    borderWidth: 1, borderColor: Colors.brandCoral,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
  },
  deleteBtnText: { fontFamily: FontFamily.bodySemiBold, fontSize: 14, color: Colors.brandCoral },

  // Input bar
  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end',
    paddingHorizontal: 12, paddingVertical: 8,
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)',
    gap: 8,
  },
  inputWrap: {
    flex: 1, backgroundColor: '#1a1a1a',
    borderRadius: 22, borderWidth: 1, borderColor: '#2a2a2a',
    paddingHorizontal: 16, paddingVertical: 10,
    minHeight: 44, maxHeight: 120, justifyContent: 'center',
  },
  textInput: {
    fontFamily: FontFamily.bodyRegular, fontSize: 15,
    color: Colors.inkPrimary, lineHeight: 22,
  },
  actionBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: Colors.brandOrange,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: Colors.brandOrange,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4, shadowRadius: 8, elevation: 4,
  },

  // Recording bar
  recordBar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
    borderTopWidth: 1, borderTopColor: 'rgba(255,107,53,0.25)',
    backgroundColor: 'rgba(255,107,53,0.06)', gap: 12,
  },
  recordCancelBtn: {
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
  },
  recordCancelText: { fontFamily: FontFamily.bodyRegular, fontSize: 13, color: Colors.inkSecondary },
  recordCenter: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  recordTimer: {
    fontFamily: FontFamily.bodySemiBold, fontSize: 13,
    color: Colors.brandOrange, minWidth: 36, textAlign: 'right',
  },
  recordStopBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: Colors.brandOrange, alignItems: 'center', justifyContent: 'center', elevation: 4,
  },
  sendingText: { fontFamily: FontFamily.bodyRegular, fontSize: 14, color: Colors.inkSecondary, marginLeft: 8 },
})
