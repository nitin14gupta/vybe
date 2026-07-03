import { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import { type LayoutChangeEvent } from 'react-native'
import { hTap, hSelection } from '@/lib/haptics'
import { useSharedValue, withTiming } from 'react-native-reanimated'
import { router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import ApiService, { type Message } from '@/api/apiService'
import { useAuthStore } from '@/store/auth'
import { usePillStore } from '@/store/pillStore'
import { useChat } from './useChat'
import { useImageViewer } from './useImageViewer'
import { useVoiceRecorder } from './useVoiceRecorder'
import type { MediaViewType, MediaViewerItem } from '@/components/chat/MediaViewerModal'

const MARGIN = 8
const MIN_INPUT_HEIGHT = 44

export type RecordState = 'idle' | 'recording' | 'preview' | 'sending'

export type ListItem =
  | Message
  | { type: 'date_sep'; label: string; id: string }
  | { type: 'seen_label'; label: string; id: string }
  | { type: 'media_group'; id: string; messages: Message[] }

const MEDIA_TYPES = new Set(['image', 'gif', 'video'])
function isMediaMessage(msg: Message): boolean {
  return MEDIA_TYPES.has(msg.content_type) && !!msg.metadata?.url
}

export interface EmojiTarget {
  msgId: string
  pageY: number
  isMine: boolean
  currentEmoji: string | null
}

// ── Date helpers ──────────────────────────────────────────────────────────────

function getDateLabel(dateStr: string): string {
  const d = new Date(dateStr)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)
  const msgDay = new Date(d.getFullYear(), d.getMonth(), d.getDate())

  if (msgDay.getTime() === today.getTime()) return 'Today'
  if (msgDay.getTime() === yesterday.getTime()) return 'Yesterday'
  return d.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    ...(d.getFullYear() !== now.getFullYear() ? { year: 'numeric' } : {}),
  })
}

function buildListData(
  messages: Message[],
  seenInfo?: { msgId: string; label: string } | null,
): ListItem[] {
  const result: ListItem[] = []
  let i = 0
  while (i < messages.length) {
    // Inject seen label BEFORE the seen message so it appears visually below it
    // (in an inverted FlatList, lower array index = lower screen position)
    if (seenInfo && messages[i].id === seenInfo.msgId) {
      result.push({ type: 'seen_label', id: 'seen', label: seenInfo.label })
    }

    const start = messages[i]
    let end = i

    // Group consecutive media messages from the same sender, same day, into one stack
    if (isMediaMessage(start)) {
      const startDay = new Date(start.sent_at).toDateString()
      while (
        end + 1 < messages.length &&
        isMediaMessage(messages[end + 1]) &&
        messages[end + 1].sender_id === start.sender_id &&
        new Date(messages[end + 1].sent_at).toDateString() === startDay &&
        !(seenInfo && messages[end + 1].id === seenInfo.msgId)
      ) {
        end++
      }
    }

    if (end > i) {
      const group = messages.slice(i, end + 1)
      result.push({ type: 'media_group', id: `grp_${start.id}`, messages: group })
    } else {
      result.push(start)
    }

    const last = messages[end]
    const curr = new Date(last.sent_at).toDateString()
    const next = end + 1 < messages.length ? new Date(messages[end + 1].sent_at).toDateString() : null
    if (curr !== next) {
      result.push({ type: 'date_sep', label: getDateLabel(last.sent_at), id: `sep_${last.id}` })
    }

    i = end + 1
  }
  return result
}

export function formatSeen(isoStr: string): string {
  const diff = Date.now() - new Date(isoStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Seen just now'
  if (mins < 60) return `Seen ${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `Seen ${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `Seen ${new Date(isoStr).toLocaleDateString('en-US', { weekday: 'long' })}`
  const weeks = Math.floor(days / 7)
  if (weeks < 52) return `Seen ${weeks}w ago`
  return `Seen ${Math.floor(weeks / 52)}y ago`
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useChatScreen(convId: string) {
  const insets = useSafeAreaInsets()
  const myId = useAuthStore(st => st.userId)
  const showPill = usePillStore(st => st.show)

  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Partner info
  const [partnerName, setPartnerName] = useState<string | null>(null)
  const [partnerUsername, setPartnerUsername] = useState<string | null>(null)
  const [partnerAvatar, setPartnerAvatar] = useState<string | null>(null)
  const [partnerId, setPartnerId] = useState<string | null>(null)
  const [blockStatus, setBlockStatus] = useState<'none' | 'i_blocked' | 'they_blocked'>('none')

  // UI state
  const [inputText, setInputText] = useState('')
  const [inputBarHeight, setInputBarHeight] = useState(MIN_INPUT_HEIGHT)
  const [menuOpen, setMenuOpen] = useState(false)
  const [reportOpen, setReportOpen] = useState(false)
  const [replyingTo, setReplyingTo] = useState<Message | null>(null)
  const [emojiTarget, setEmojiTarget] = useState<EmojiTarget | null>(null)

  const extraContentPadding = useSharedValue(0)

  const {
    messages, isPartnerTyping, isPartnerRecording, isPartnerOnline,
    isWsConnected, wsError, loading, partnerSeenAt,
    failedIds, sendMessage, retryMessage, sendTyping, sendVoiceTyping, loadMore, reactToMessage,
    addOptimisticMedia, sendMediaMessage, markMediaFailed, clearMediaFailed,
  } = useChat(convId)

  const { viewingMedia, openMedia, closeMedia } = useImageViewer()

  // ── Voice recorder ──────────────────────────────────────────────────────────

  const sendVoice = useCallback(async (uri: string, durationSecs: number) => {
    const url = await ApiService.uploadChatVoice(uri)
    await sendMessage('', 'voice', { url, duration: durationSecs })
  }, [sendMessage])

  const {
    recordState, recordedVoice, recordDurationMs,
    handleMicPress, handleRecordStop, handleRecordCancel,
    handleSendVoice, handleDiscardVoice,
  } = useVoiceRecorder({ onSend: sendVoice, onVoiceTyping: sendVoiceTyping })

  // ── Partner info ────────────────────────────────────────────────────────────

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
    if (wsError === 'blocked') setBlockStatus(prev => prev === 'none' ? 'they_blocked' : prev)
  }, [wsError])

  useEffect(() => {
    return () => {
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current)
    }
  }, [])

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleSend = useCallback(async () => {
    const text = inputText.trim()
    if (!text) return
    hTap()
    setInputText('')
    sendTyping(false)
    const replyMeta = replyingTo
      ? {
          reply_to: {
            message_id: replyingTo.id,
            content: replyingTo.content,
            content_type: replyingTo.content_type,
            sender_label: replyingTo.sender_id === myId ? 'You' : partnerName,
          },
        }
      : undefined
    setReplyingTo(null)
    try {
      await sendMessage(text, 'text', replyMeta)
    } catch {
      setInputText(text)
      showPill("Message didn't send, tap to retry", 'error')
    }
  }, [inputText, sendMessage, sendTyping, replyingTo, myId, partnerName, showPill])

  const handleTextChange = useCallback((t: string) => {
    setInputText(t)
    sendTyping(t.length > 0)
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current)
    if (t.length > 0) {
      typingTimerRef.current = setTimeout(() => sendTyping(false), 2000)
    }
  }, [sendTyping])

  const handleInputLayout = useCallback((e: LayoutChangeEvent) => {
    const h = e.nativeEvent.layout.height
    setInputBarHeight(h)
    extraContentPadding.value = withTiming(Math.max(h - MIN_INPUT_HEIGHT, 0), { duration: 200 })
  }, [extraContentPadding])

  const handleBlock = useCallback(async () => {
    if (!partnerId) return
    try { await ApiService.blockUser(partnerId); setBlockStatus('i_blocked') }
    catch { showPill("Couldn't block this person", 'error') }
  }, [partnerId, showPill])

  const handleUnblock = useCallback(async () => {
    if (!partnerId) return
    try { await ApiService.unblockUser(partnerId); setBlockStatus('none') }
    catch { showPill("Couldn't unblock, try again", 'error') }
  }, [partnerId, showPill])

  const handleDeleteChat = useCallback(async () => {
    try { await ApiService.deleteConversation(convId); router.back() }
    catch { showPill("Couldn't delete this chat", 'error') }
  }, [convId, showPill])

  const handleReport = useCallback(async (reason: string) => {
    try { if (partnerId) await ApiService.reportUser(partnerId, reason) }
    catch { showPill('Report not sent, try again', 'error') }
  }, [partnerId, showPill])

  const handleDoubleTap = useCallback((msgId: string) => {
    const msg = messages.find(m => m.id === msgId)
    if (!msg) return
    const myReaction = msg.reactions?.[myId ?? ''] ?? null
    const next = myReaction === '❤️' ? null : '❤️'
    reactToMessage(msgId, next)
  }, [messages, myId, reactToMessage])

  const handleLongPress = useCallback((msgId: string, pageY: number, isMine: boolean) => {
    const msg = messages.find(m => m.id === msgId)
    const currentEmoji = msg?.reactions?.[myId ?? ''] ?? null
    setEmojiTarget({ msgId, pageY, isMine, currentEmoji })
  }, [messages, myId])

  const handleSwipeReply = useCallback((msg: Message) => {
    setReplyingTo(msg)
  }, [])

  const handleEmojiSelect = useCallback((msgId: string, emoji: string | null) => {
    hSelection()
    reactToMessage(msgId, emoji)
    setEmojiTarget(null)
  }, [reactToMessage])

  const handleReactionPillPress = useCallback((msgId: string, emoji: string) => {
    const msg = messages.find(m => m.id === msgId)
    const myReaction = msg?.reactions?.[myId ?? ''] ?? null
    // If I already reacted with this emoji, remove it; otherwise set it
    const next = myReaction === emoji ? null : emoji
    reactToMessage(msgId, next)
  }, [messages, myId, reactToMessage])

  // Show the bubble instantly from the local file, upload + transmit in the background —
  // the user shouldn't wait on the R2 round trip to see that a send even happened.
  const uploadAndSendMedia = useCallback(async (
    tempId: string, uri: string, type: 'image' | 'video' | 'gif', width?: number, height?: number,
  ) => {
    try {
      const { url, media_type } = await ApiService.uploadChatMedia(uri)
      const finalType = type === 'gif' ? 'gif' : media_type
      const meta: Record<string, any> = { url }
      if (width) meta.width = width
      if (height) meta.height = height
      await sendMediaMessage(tempId, finalType, meta)
    } catch {
      markMediaFailed(tempId)
      showPill("Media didn't send, try again", 'error')
    }
  }, [sendMediaMessage, markMediaFailed, showPill])

  const handleMediaSend = useCallback((uri: string, type: 'image' | 'video' | 'gif', width?: number, height?: number) => {
    const tempId = addOptimisticMedia(uri, type, width, height)
    uploadAndSendMedia(tempId, uri, type, width, height)
  }, [addOptimisticMedia, uploadAndSendMedia])

  const handleRetry = useCallback((tempId: string) => {
    const msg = messages.find(m => m.id === tempId)
    const isLocalMedia = msg
      && ['image', 'video', 'gif'].includes(msg.content_type)
      && !!msg.metadata?.url
      && !/^https?:\/\//.test(msg.metadata.url)
    if (isLocalMedia && msg) {
      clearMediaFailed(tempId)
      uploadAndSendMedia(tempId, msg.metadata!.url, msg.content_type as 'image' | 'video' | 'gif', msg.metadata?.width, msg.metadata?.height)
      return
    }
    retryMessage(tempId)
  }, [messages, retryMessage, clearMediaFailed, uploadAndSendMedia])

  const handleMediaTap = useCallback((url: string, type: MediaViewType) => {
    openMedia([{ url, type }], 0)
  }, [openMedia])

  const handleMediaGroupTap = useCallback((items: MediaViewerItem[], index: number) => {
    openMedia(items, index)
  }, [openMedia])

  // ── Derived data ────────────────────────────────────────────────────────────

  // Seen indicator: find the last message I sent that the partner has actually read
  const seenInfo = useMemo(() => {
    if (!partnerSeenAt) return null
    const seenTime = new Date(partnerSeenAt).getTime()
    const lastSeenMsg = messages.find(
      m => !m.id.startsWith('_temp_') && m.sender_id === myId && new Date(m.sent_at).getTime() <= seenTime,
    )
    if (!lastSeenMsg) return null
    return { msgId: lastSeenMsg.id, label: formatSeen(partnerSeenAt) }
  }, [partnerSeenAt, messages, myId])

  const listData = useMemo(() => buildListData(messages, seenInfo), [messages, seenInfo])

  const stickyOffset = useMemo(() => ({ opened: insets.bottom - MARGIN }), [insets.bottom])

  return {
    // partner
    partnerName, partnerUsername, partnerAvatar, partnerId, blockStatus,
    // chat
    messages, listData, isPartnerTyping, isPartnerRecording, isPartnerOnline,
    isWsConnected, loading,
    // input
    inputText, inputBarHeight, recordState, recordDurationMs,
    recordedVoice, replyingTo, emojiTarget,
    // menu
    menuOpen, setMenuOpen, reportOpen, setReportOpen,
    // scroll
    extraContentPadding, stickyOffset,
    // failed + retry
    failedIds,
    // media viewer
    viewingMedia, closeMedia,
    // handlers
    handleSend, handleTextChange, handleInputLayout,
    handleMicPress, handleRecordStop, handleRecordCancel, handleSendVoice, handleDiscardVoice,
    handleBlock, handleUnblock, handleDeleteChat, handleReport,
    handleDoubleTap, handleLongPress, handleSwipeReply,
    handleEmojiSelect, handleReactionPillPress, handleMediaSend,
    handleRetry, handleMediaTap, handleMediaGroupTap,
    handleCancelReply: () => setReplyingTo(null),
    handleCloseEmojiPicker: () => setEmojiTarget(null),
    loadMore,
    myId,
  }
}
