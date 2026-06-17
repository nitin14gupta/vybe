import { useState, useRef, useCallback, useEffect } from 'react'
import {
  View, Text, StyleSheet, FlatList, Pressable, TextInput,
  Image, KeyboardAvoidingView, Platform, Alert, ActionSheetIOS,
  ActivityIndicator,
} from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { ChevronLeft, MoreVertical, Plus, Send } from 'lucide-react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { useChat } from '@/hooks/useChat'
import { useConversations } from '@/hooks/useConversations'
import { useAuthStore } from '@/store/auth'
import { ReportSheet } from '@/components/ui'
import ApiService, { Message } from '@/api/apiService'
import { Colors, FontFamily } from '@/constants'

// ── Message bubble ────────────────────────────────────────────────────────────

function MsgBubble({ msg, isMine }: { msg: Message; isMine: boolean }) {
  if (msg.content_type === 'event' && msg.metadata) {
    return <EventCard metadata={msg.metadata} isMine={isMine} sentAt={msg.sent_at} />
  }
  if (msg.content_type === 'profile' && msg.metadata) {
    return <ProfileCard metadata={msg.metadata} isMine={isMine} sentAt={msg.sent_at} />
  }

  return (
    <View style={[s.bubbleWrap, isMine ? s.bubbleWrapMine : s.bubbleWrapTheirs]}>
      <View style={[s.bubble, isMine ? s.bubbleMine : s.bubbleTheirs]}>
        <Text style={[s.bubbleText, isMine && s.bubbleTextMine]}>
          {msg.content}
        </Text>
      </View>
      <Text style={[s.bubbleTime, isMine ? s.bubbleTimeMine : s.bubbleTimeTheirs]}>
        {new Date(msg.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </Text>
    </View>
  )
}

function EventCard({ metadata, isMine, sentAt }: { metadata: Record<string, any>; isMine: boolean; sentAt: string }) {
  return (
    <View style={[s.bubbleWrap, isMine ? s.bubbleWrapMine : s.bubbleWrapTheirs]}>
      <View style={s.richCard}>
        {metadata.cover_url ? (
          <Image source={{ uri: metadata.cover_url }} style={s.richCardImg} />
        ) : (
          <View style={[s.richCardImg, s.richCardImgFallback]} />
        )}
        <View style={s.richCardBody}>
          <Text style={s.richCardTitle} numberOfLines={2}>{metadata.title}</Text>
          {metadata.date ? <Text style={s.richCardSub}>{metadata.date}</Text> : null}
          {metadata.price ? <Text style={s.richCardSub}>{metadata.price}</Text> : null}
          <Pressable
            style={s.richCardBtn}
            onPress={() => metadata.event_id && router.push(`/(events)/${metadata.event_id}` as any)}
          >
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
          {metadata.avatar_url ? (
            <Image source={{ uri: metadata.avatar_url }} style={s.profileAvatar} />
          ) : (
            <View style={[s.profileAvatar, s.profileAvatarFallback]}>
              <Text style={s.profileAvatarInitial}>{(metadata.name ?? '?').charAt(0)}</Text>
            </View>
          )}
          <View style={{ flex: 1 }}>
            <Text style={s.richCardTitle}>{metadata.name}</Text>
            {metadata.city ? (
              <Text style={s.richCardSub}>{metadata.city}</Text>
            ) : null}
          </View>
        </View>
        {metadata.interests?.length > 0 && (
          <View style={s.profileChips}>
            {(metadata.interests as string[]).slice(0, 3).map((t: string) => (
              <View key={t} style={s.profileChip}>
                <Text style={s.profileChipText}>{t}</Text>
              </View>
            ))}
          </View>
        )}
        <Pressable
          style={s.richCardBtn}
          onPress={() => metadata.user_id && router.push(`/(profile)/${metadata.user_id}` as any)}
        >
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
          <View style={s.dot} />
          <View style={s.dot} />
          <View style={s.dot} />
        </View>
      </View>
    </View>
  )
}

// ── Chat screen ───────────────────────────────────────────────────────────────

export default function ChatDetailScreen() {
  const { id: convId } = useLocalSearchParams<{ id: string }>()
  const insets = useSafeAreaInsets()
  const myId = useAuthStore(s => s.userId)
  const flatRef = useRef<FlatList>(null)
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [inputText, setInputText] = useState('')
  const [partnerName, setPartnerName] = useState<string | null>(null)
  const [partnerUsername, setPartnerUsername] = useState<string | null>(null)
  const [partnerAvatar, setPartnerAvatar] = useState<string | null>(null)
  const [partnerId, setPartnerId] = useState<string | null>(null)
  const [reportOpen, setReportOpen] = useState(false)

  const { messages, isPartnerTyping, isPartnerOnline, loading, sendMessage, sendTyping, loadMore } = useChat(convId)

  // Load conversation metadata (partner name/avatar)
  useEffect(() => {
    ApiService.getConversations().then(data => {
      const conv = [...data.active, ...data.locked].find(c => c.id === convId)
      if (conv) {
        setPartnerName(conv.partner_name)
        setPartnerUsername(conv.partner_username ?? null)
        setPartnerAvatar(conv.partner_avatar)
        setPartnerId(conv.partner_id)
      }
    }).catch(() => {})
  }, [convId])

  const handleSend = useCallback(() => {
    const text = inputText.trim()
    if (!text) return
    setInputText('')
    sendTyping(false)
    sendMessage(text)
  }, [inputText, sendMessage, sendTyping])

  const handleTextChange = useCallback((t: string) => {
    setInputText(t)
    sendTyping(t.length > 0)
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current)
    if (t.length > 0) {
      typingTimerRef.current = setTimeout(() => sendTyping(false), 2000)
    }
  }, [sendTyping])

  const handleMenu = useCallback(() => {
    const options = ['Block User', 'Report User', 'Cancel']
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options, cancelButtonIndex: 2, destructiveButtonIndex: 0 },
        idx => {
          if (idx === 0) confirmBlock()
          if (idx === 1) confirmReport()
        },
      )
    } else {
      Alert.alert('Options', undefined, [
        { text: 'Block User', style: 'destructive', onPress: confirmBlock },
        { text: 'Report User', onPress: confirmReport },
        { text: 'Cancel', style: 'cancel' },
      ])
    }
  }, [])

  const confirmBlock = useCallback(() => {
    // Find partner id from conversations
    ApiService.getConversations().then(data => {
      const conv = [...data.active].find(c => c.id === convId)
      if (!conv) return
      Alert.alert('Block User', `Block ${conv.partner_name ?? 'this user'}? They won't be able to contact you.`, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Block', style: 'destructive',
          onPress: () => ApiService.blockUser(conv.partner_id).then(() => router.back()),
        },
      ])
    })
  }, [convId])

  const confirmReport = useCallback(() => {
    setReportOpen(true)
  }, [convId])

  const renderItem = useCallback(({ item }: { item: Message }) => (
    <MsgBubble msg={item} isMine={item.sender_id === myId} />
  ), [myId])

  return (
    <KeyboardAvoidingView
      style={[s.root, { paddingBottom: insets.bottom }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      {/* Header */}
      <View style={[s.header, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => router.back()} style={s.backBtn} hitSlop={8}>
          <ChevronLeft size={24} color={Colors.brandOrange} strokeWidth={2} />
        </Pressable>

        <Pressable
          style={s.headerCenter}
          onPress={() => partnerId && router.push(`/(profile)/${partnerId}` as any)}
        >
          {partnerAvatar ? (
            <Image source={{ uri: partnerAvatar }} style={s.headerAvatar} />
          ) : (
            <View style={[s.headerAvatar, s.headerAvatarFallback]}>
              <Text style={s.headerAvatarInitial}>{(partnerName ?? '?').charAt(0)}</Text>
            </View>
          )}
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

        <Pressable onPress={handleMenu} hitSlop={8}>
          <MoreVertical size={22} color={Colors.inkSecondary} strokeWidth={1.8} />
        </Pressable>
      </View>

      {/* Messages */}
      {loading ? (
        <View style={s.center}>
          <ActivityIndicator color={Colors.brandOrange} />
        </View>
      ) : (
        <FlatList
          ref={flatRef}
          data={messages}
          keyExtractor={m => m.id}
          renderItem={renderItem}
          inverted
          contentContainerStyle={s.msgList}
          showsVerticalScrollIndicator={false}
          onEndReached={loadMore}
          onEndReachedThreshold={0.2}
          ListHeaderComponent={isPartnerTyping ? <TypingIndicator /> : null}
        />
      )}

      {/* Input bar */}
      <View style={[s.inputBar, { borderTopColor: 'rgba(255,255,255,0.08)' }]}>
        <Pressable style={s.attachBtn} onPress={() => {}}>
          <Plus size={22} color={Colors.inkSecondary} strokeWidth={1.8} />
        </Pressable>

        <View style={s.inputWrap}>
          <TextInput
            style={s.textInput}
            value={inputText}
            onChangeText={handleTextChange}
            placeholder="Type a message..."
            placeholderTextColor={Colors.inkDisabled}
            multiline
          />
        </View>

        <Pressable
          style={[s.sendBtn, !inputText.trim() && s.sendBtnDisabled]}
          onPress={handleSend}
          disabled={!inputText.trim()}
        >
          <Send size={18} color="#111" strokeWidth={2} fill={inputText.trim() ? '#111' : 'transparent'} />
        </Pressable>
      </View>

      <ReportSheet
        visible={reportOpen}
        targetName={partnerName}
        onSubmit={async (reason) => {
          if (partnerId) await ApiService.reportUser(partnerId, reason)
        }}
        onClose={() => setReportOpen(false)}
      />
    </KeyboardAvoidingView>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },

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

  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  msgList: { paddingHorizontal: 16, paddingVertical: 12 },

  // Bubbles
  bubbleWrap: { marginBottom: 12, maxWidth: '82%' },
  bubbleWrapMine: { alignSelf: 'flex-end', alignItems: 'flex-end' },
  bubbleWrapTheirs: { alignSelf: 'flex-start', alignItems: 'flex-start' },
  bubble: { borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10 },
  bubbleTheirs: {
    backgroundColor: '#222',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    borderBottomLeftRadius: 4,
  },
  bubbleMine: {
    backgroundColor: 'rgba(255,107,53,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255,107,53,0.35)',
    borderBottomRightRadius: 4,
  },
  bubbleText: { fontFamily: FontFamily.bodyRegular, fontSize: 15, color: Colors.inkPrimary, lineHeight: 22 },
  bubbleTextMine: { color: Colors.inkPrimary },
  bubbleTime: { fontFamily: FontFamily.bodyRegular, fontSize: 10, color: Colors.inkDisabled, marginTop: 4 },
  bubbleTimeMine: { marginRight: 2 },
  bubbleTimeTheirs: { marginLeft: 2 },

  // Typing
  typingBubble: { paddingVertical: 12, paddingHorizontal: 16 },
  typingDots: { flexDirection: 'row', gap: 4 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.brandOrange, opacity: 0.7 },

  // Rich cards
  richCard: {
    backgroundColor: '#1e1e1e',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    borderRadius: 16,
    overflow: 'hidden',
    width: 260,
  },
  richCardImg: { width: '100%', height: 140 },
  richCardImgFallback: { backgroundColor: '#2a2a2a' },
  richCardBody: { padding: 12, gap: 4 },
  richCardTitle: { fontFamily: FontFamily.bodySemiBold, fontSize: 15, color: Colors.inkPrimary },
  richCardSub: { fontFamily: FontFamily.bodyRegular, fontSize: 12, color: Colors.inkSecondary },
  richCardBtn: {
    marginTop: 8,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: Colors.brandOrange,
    alignItems: 'center',
    justifyContent: 'center',
  },
  richCardBtnText: { fontFamily: FontFamily.bodySemiBold, fontSize: 13, color: Colors.brandOrange },

  // Profile card
  profileCardRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12 },
  profileAvatar: { width: 44, height: 44, borderRadius: 22, borderWidth: 1.5, borderColor: Colors.brandOrange },
  profileAvatarFallback: { backgroundColor: '#2a2a2a', alignItems: 'center', justifyContent: 'center' },
  profileAvatarInitial: { fontFamily: FontFamily.headingBold, fontSize: 18, color: Colors.inkPrimary },
  profileChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingHorizontal: 12, paddingBottom: 4 },
  profileChip: {
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  profileChipText: { fontFamily: FontFamily.bodyRegular, fontSize: 11, color: Colors.inkPrimary },

  // Input
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    gap: 8,
    backgroundColor: Colors.background,
  },
  attachBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1e1e1e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputWrap: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    paddingHorizontal: 14,
    paddingVertical: 8,
    minHeight: 40,
    maxHeight: 120,
    justifyContent: 'center',
  },
  textInput: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 15,
    color: Colors.inkPrimary,
    lineHeight: 22,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.brandOrange,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.brandOrange,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  sendBtnDisabled: { opacity: 0.5 },
})
