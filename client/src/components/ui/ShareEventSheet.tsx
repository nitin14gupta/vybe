import { useState, useCallback, useEffect } from 'react'
import {
  Modal, View, Text, StyleSheet, FlatList, Pressable, Image,
  TextInput, Share, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native'
import { Search, X, Link2 } from 'lucide-react-native'
import { Colors, FontFamily } from '@/constants'
import ApiService, { Conversation, EventDetail } from '@/api/apiService'

// Simple inline icons for WhatsApp / Instagram — avoids external icon deps
function WhatsAppIcon() {
  return <Text style={{ fontSize: 22 }}>💬</Text>
}
function InstagramIcon() {
  return <Text style={{ fontSize: 22 }}>📸</Text>
}

interface Props {
  visible: boolean
  event: EventDetail | null
  onClose: () => void
}

export function ShareEventSheet({ visible, event, onClose }: Props) {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [sentIds, setSentIds] = useState<Set<string>>(new Set())

  // Load active conversations sorted by most recent (they talk most = highest last_message_at)
  useEffect(() => {
    if (!visible) return
    setLoading(true)
    setSentIds(new Set())
    setSearch('')
    ApiService.getConversations()
      .then(data => {
        // Sort: most recently active first (most talked to = on top)
        const sorted = [...data.active].sort((a, b) => {
          const aTime = a.last_sent_at ?? a.last_message_at ?? ''
          const bTime = b.last_sent_at ?? b.last_message_at ?? ''
          return bTime.localeCompare(aTime)
        })
        setConversations(sorted)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [visible])

  const filtered = search.trim()
    ? conversations.filter(c =>
        (c.partner_name ?? '').toLowerCase().includes(search.toLowerCase()),
      )
    : conversations

  const handleSendToChat = useCallback(async (conv: Conversation) => {
    if (!event || sentIds.has(conv.id)) return
    setSentIds(prev => new Set([...prev, conv.id]))
    try {
      await ApiService.sendMessage(conv.id, event.title, 'event', {
        event_id: event.id,
        title: event.title,
        date: event.start_time,
        price: event.is_free ? 'Free' : `₹${event.price ?? ''}`,
        cover_url: event.cover_photos?.[0]?.url ?? null,
      })
    } catch {
      // Silently revert on failure
      setSentIds(prev => { const n = new Set(prev); n.delete(conv.id); return n })
    }
  }, [event, sentIds])

  const handleNativeShare = useCallback(async (platform?: 'whatsapp' | 'instagram') => {
    if (!event) return
    const text = `Check out "${event.title}" on VYBE! 🔥`
    if (platform === 'whatsapp') {
      const url = `whatsapp://send?text=${encodeURIComponent(text)}`
      Share.share({ message: text, url })
    } else if (platform === 'instagram') {
      // Instagram doesn't support deep-link text share; use native sheet which shows IG
      Share.share({ message: text })
    } else {
      Share.share({ message: text })
    }
  }, [event])

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={s.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

        <View style={s.sheet}>
          {/* Handle */}
          <View style={s.handle} />

          {/* Header row */}
          <View style={s.headerRow}>
            <Text style={s.title}>Share Event</Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <X size={20} color={Colors.inkSecondary} strokeWidth={1.8} />
            </Pressable>
          </View>

          {/* Native share buttons */}
          <View style={s.nativeRow}>
            <Pressable style={s.nativeBtn} onPress={() => handleNativeShare('whatsapp')}>
              <View style={[s.nativeIcon, { backgroundColor: '#25D366' }]}>
                <WhatsAppIcon />
              </View>
              <Text style={s.nativeLabel}>WhatsApp</Text>
            </Pressable>

            <Pressable style={s.nativeBtn} onPress={() => handleNativeShare('instagram')}>
              <View style={[s.nativeIcon, { backgroundColor: '#E1306C' }]}>
                <InstagramIcon />
              </View>
              <Text style={s.nativeLabel}>Instagram</Text>
            </Pressable>

            <Pressable style={s.nativeBtn} onPress={() => handleNativeShare()}>
              <View style={[s.nativeIcon, { backgroundColor: '#333' }]}>
                <Link2 size={20} color="#fff" strokeWidth={1.8} />
              </View>
              <Text style={s.nativeLabel}>Copy Link</Text>
            </Pressable>
          </View>

          <View style={s.divider} />

          {/* In-app connections */}
          <Text style={s.sectionLabel}>Send to connections</Text>

          <View style={s.searchBar}>
            <Search size={14} color={Colors.inkDisabled} strokeWidth={1.8} />
            <TextInput
              style={s.searchInput}
              value={search}
              onChangeText={setSearch}
              placeholder="Search people..."
              placeholderTextColor={Colors.inkDisabled}
            />
          </View>

          {loading ? (
            <View style={s.loadingBox}>
              <ActivityIndicator color={Colors.brandOrange} />
            </View>
          ) : filtered.length === 0 ? (
            <View style={s.loadingBox}>
              <Text style={s.emptyText}>
                {conversations.length === 0
                  ? 'Send vibes to people first to share with them'
                  : 'No connections match your search'}
              </Text>
            </View>
          ) : (
            <FlatList
              data={filtered}
              keyExtractor={c => c.id}
              style={s.list}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => {
                const sent = sentIds.has(item.id)
                return (
                  <View style={s.convRow}>
                    {item.partner_avatar ? (
                      <Image source={{ uri: item.partner_avatar }} style={s.convAvatar} />
                    ) : (
                      <View style={[s.convAvatar, s.convAvatarFallback]}>
                        <Text style={s.convAvatarInitial}>{(item.partner_name ?? '?').charAt(0)}</Text>
                      </View>
                    )}
                    <Text style={s.convName} numberOfLines={1}>{item.partner_name ?? 'User'}</Text>
                    <Pressable
                      style={[s.sendBtn, sent && s.sendBtnSent]}
                      onPress={() => handleSendToChat(item)}
                      disabled={sent}
                    >
                      <Text style={[s.sendBtnText, sent && s.sendBtnTextSent]}>
                        {sent ? 'Sent ✓' : 'Send'}
                      </Text>
                    </Pressable>
                  </View>
                )
              }}
            />
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}

const s = StyleSheet.create({
  overlay: {
    flex: 1, justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.65)',
  },
  sheet: {
    backgroundColor: '#141414',
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingHorizontal: 20, paddingBottom: 36, paddingTop: 12,
    maxHeight: '80%',
  },
  handle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignSelf: 'center', marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 20,
  },
  title: { fontFamily: FontFamily.headingBold, fontSize: 20, color: Colors.inkPrimary },

  // Native share row
  nativeRow: { flexDirection: 'row', gap: 24, marginBottom: 20 },
  nativeBtn: { alignItems: 'center', gap: 8 },
  nativeIcon: {
    width: 56, height: 56, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
  },
  nativeLabel: { fontFamily: FontFamily.bodyRegular, fontSize: 12, color: Colors.inkSecondary },

  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginBottom: 16,
  },
  sectionLabel: {
    fontFamily: FontFamily.bodySemiBold, fontSize: 12,
    color: Colors.inkSecondary,
    letterSpacing: 0.8, textTransform: 'uppercase',
    marginBottom: 12,
  },

  // Search
  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#1e1e1e',
    borderRadius: 12, borderWidth: 1, borderColor: '#2a2a2a',
    paddingHorizontal: 12, height: 40, gap: 8,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1, fontFamily: FontFamily.bodyRegular,
    fontSize: 14, color: Colors.inkPrimary,
  },

  loadingBox: {
    height: 120, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 20,
  },
  emptyText: {
    fontFamily: FontFamily.bodyRegular, fontSize: 13,
    color: Colors.inkSecondary, textAlign: 'center', lineHeight: 19,
  },
  list: { maxHeight: 280 },

  // Conversation rows
  convRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 10, gap: 12,
  },
  convAvatar: { width: 44, height: 44, borderRadius: 22 },
  convAvatarFallback: { backgroundColor: '#2a2a2a', alignItems: 'center', justifyContent: 'center' },
  convAvatarInitial: { fontFamily: FontFamily.headingBold, fontSize: 18, color: Colors.inkPrimary },
  convName: {
    flex: 1, fontFamily: FontFamily.bodySemiBold,
    fontSize: 14, color: Colors.inkPrimary,
  },
  sendBtn: {
    paddingHorizontal: 18, paddingVertical: 8, borderRadius: 20,
    backgroundColor: Colors.brandOrange,
  },
  sendBtnSent: { backgroundColor: 'transparent', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  sendBtnText: { fontFamily: FontFamily.bodySemiBold, fontSize: 13, color: '#111' },
  sendBtnTextSent: { color: Colors.inkSecondary },
})
