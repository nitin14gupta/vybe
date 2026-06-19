import { useState, useCallback, useEffect, useRef } from 'react'
import { View, Text, StyleSheet, FlatList, Pressable, Image, TextInput, Share, ActivityIndicator } from 'react-native'
import { BottomSheetModal, BottomSheetView, BottomSheetBackdrop } from '@gorhom/bottom-sheet'
import type { BottomSheetBackdropProps } from '@gorhom/bottom-sheet'
import Svg, { Path, Defs, LinearGradient as SvgGradient, Stop, Rect } from 'react-native-svg'
import { Search, X, Link2 } from 'lucide-react-native'
import { Colors, FontFamily } from '@/constants'
import ApiService, { Conversation, EventDetail } from '@/api/apiService'

function WhatsAppIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24">
      <Path fill="#fff" d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
      <Path fill="#fff" d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.657 1.438 5.168L2 22l4.978-1.405A9.953 9.953 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18a7.946 7.946 0 01-4.33-1.284l-.31-.184-3.22.909.915-3.164-.202-.325A7.944 7.944 0 014 12c0-4.418 3.582-8 8-8s8 3.582 8 8-3.582 8-8 8z" />
    </Svg>
  )
}

function InstagramIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24">
      <Defs>
        <SvgGradient id="ig" x1="0%" y1="100%" x2="100%" y2="0%">
          <Stop offset="0%" stopColor="#f09433" />
          <Stop offset="25%" stopColor="#e6683c" />
          <Stop offset="50%" stopColor="#dc2743" />
          <Stop offset="75%" stopColor="#cc2366" />
          <Stop offset="100%" stopColor="#bc1888" />
        </SvgGradient>
      </Defs>
      <Rect x="0" y="0" width="24" height="24" fill="none" />
      <Path fill="#fff" d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    </Svg>
  )
}

interface Props {
  visible: boolean
  event: EventDetail | null
  onClose: () => void
}

function renderBackdrop(props: BottomSheetBackdropProps) {
  return <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} pressBehavior="close" opacity={0.65} />
}

function ShareEventSheetCore({ event, onClose }: Omit<Props, 'visible'>) {
  const sheetRef = useRef<BottomSheetModal>(null)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [sentIds, setSentIds] = useState<Set<string>>(new Set())

  useEffect(() => { sheetRef.current?.present() }, [])

  useEffect(() => {
    setLoading(true)
    ApiService.getConversations()
      .then(data => {
        const sorted = [...data.active].sort((a, b) => {
          const aTime = a.last_sent_at ?? a.last_message_at ?? ''
          const bTime = b.last_sent_at ?? b.last_message_at ?? ''
          return bTime.localeCompare(aTime)
        })
        setConversations(sorted)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const filtered = search.trim()
    ? conversations.filter(c => (c.partner_name ?? '').toLowerCase().includes(search.toLowerCase()))
    : conversations

  const handleSendToChat = useCallback(async (conv: Conversation) => {
    if (!event || sentIds.has(conv.id)) return
    setSentIds(prev => new Set([...prev, conv.id]))
    try {
      await ApiService.sendMessage(conv.id, event.title, 'event', {
        event_id: event.id, title: event.title, date: event.start_time,
        price: event.is_free ? 'Free' : `₹${event.price ?? ''}`,
        cover_url: event.cover_photos?.[0]?.url ?? null,
      })
    } catch {
      setSentIds(prev => { const n = new Set(prev); n.delete(conv.id); return n })
    }
  }, [event, sentIds])

  const handleNativeShare = async (platform?: 'whatsapp' | 'instagram') => {
    if (!event) return
    const text = `Check out "${event.title}" on VYBE! 🔥`
    if (platform === 'whatsapp') Share.share({ message: text, url: `whatsapp://send?text=${encodeURIComponent(text)}` })
    else Share.share({ message: text })
  }

  return (
    <BottomSheetModal
      ref={sheetRef}
      snapPoints={['80%']}
      enablePanDownToClose
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
      onDismiss={onClose}
      backdropComponent={renderBackdrop}
      backgroundStyle={s.bg}
      handleIndicatorStyle={s.handleIndicator}
    >
      <BottomSheetView style={s.content}>
        <View style={s.headerRow}>
          <Text style={s.title}>Share Event</Text>
          <Pressable onPress={onClose} hitSlop={8}><X size={20} color={Colors.inkSecondary} strokeWidth={1.8} /></Pressable>
        </View>

        <View style={s.nativeRow}>
          <Pressable style={s.nativeBtn} onPress={() => handleNativeShare('whatsapp')}>
            <View style={[s.nativeIcon, { backgroundColor: '#25D366' }]}><WhatsAppIcon /></View>
            <Text style={s.nativeLabel}>WhatsApp</Text>
          </Pressable>
          <Pressable style={s.nativeBtn} onPress={() => handleNativeShare('instagram')}>
            <View style={[s.nativeIcon, { backgroundColor: '#E1306C' }]}><InstagramIcon /></View>
            <Text style={s.nativeLabel}>Instagram</Text>
          </Pressable>
          <Pressable style={s.nativeBtn} onPress={() => handleNativeShare()}>
            <View style={[s.nativeIcon, { backgroundColor: '#333' }]}><Link2 size={20} color="#fff" strokeWidth={1.8} /></View>
            <Text style={s.nativeLabel}>Copy Link</Text>
          </Pressable>
        </View>

        <View style={s.divider} />
        <Text style={s.sectionLabel}>Send to connections</Text>

        <View style={s.searchBar}>
          <Search size={14} color={Colors.inkDisabled} strokeWidth={1.8} />
          <TextInput style={s.searchInput} value={search} onChangeText={setSearch} placeholder="Search people..." placeholderTextColor={Colors.inkDisabled} />
        </View>

        {loading ? (
          <View style={s.loadingBox}><ActivityIndicator color={Colors.brandOrange} /></View>
        ) : filtered.length === 0 ? (
          <View style={s.loadingBox}>
            <Text style={s.emptyText}>{conversations.length === 0 ? 'Send vibes to people first to share with them' : 'No connections match your search'}</Text>
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
                  <Pressable style={[s.sendBtn, sent && s.sendBtnSent]} onPress={() => handleSendToChat(item)} disabled={sent}>
                    <Text style={[s.sendBtnText, sent && s.sendBtnTextSent]}>{sent ? 'Sent ✓' : 'Send'}</Text>
                  </Pressable>
                </View>
              )
            }}
          />
        )}
      </BottomSheetView>
    </BottomSheetModal>
  )
}

export function ShareEventSheet({ visible, ...rest }: Props) {
  if (!visible) return null
  return <ShareEventSheetCore {...rest} />
}

const s = StyleSheet.create({
  bg: { backgroundColor: '#141414' },
  handleIndicator: { backgroundColor: 'rgba(255,255,255,0.18)' },
  content: { paddingHorizontal: 20, paddingBottom: 36, paddingTop: 8, flex: 1 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { fontFamily: FontFamily.headingBold, fontSize: 20, color: Colors.inkPrimary },
  nativeRow: { flexDirection: 'row', gap: 24, marginBottom: 20 },
  nativeBtn: { alignItems: 'center', gap: 8 },
  nativeIcon: { width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  nativeLabel: { fontFamily: FontFamily.bodyRegular, fontSize: 12, color: Colors.inkSecondary },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: 'rgba(255,255,255,0.08)', marginBottom: 16 },
  sectionLabel: { fontFamily: FontFamily.bodySemiBold, fontSize: 12, color: Colors.inkSecondary, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 12 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e1e1e', borderRadius: 12, borderWidth: 1, borderColor: '#2a2a2a', paddingHorizontal: 12, height: 40, gap: 8, marginBottom: 12 },
  searchInput: { flex: 1, fontFamily: FontFamily.bodyRegular, fontSize: 14, color: Colors.inkPrimary },
  loadingBox: { height: 120, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  emptyText: { fontFamily: FontFamily.bodyRegular, fontSize: 13, color: Colors.inkSecondary, textAlign: 'center', lineHeight: 19 },
  list: { maxHeight: 280 },
  convRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 12 },
  convAvatar: { width: 44, height: 44, borderRadius: 22 },
  convAvatarFallback: { backgroundColor: '#2a2a2a', alignItems: 'center', justifyContent: 'center' },
  convAvatarInitial: { fontFamily: FontFamily.headingBold, fontSize: 18, color: Colors.inkPrimary },
  convName: { flex: 1, fontFamily: FontFamily.bodySemiBold, fontSize: 14, color: Colors.inkPrimary },
  sendBtn: { paddingHorizontal: 18, paddingVertical: 8, borderRadius: 20, backgroundColor: Colors.brandOrange },
  sendBtnSent: { backgroundColor: 'transparent', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  sendBtnText: { fontFamily: FontFamily.bodySemiBold, fontSize: 13, color: '#111' },
  sendBtnTextSent: { color: Colors.inkSecondary },
})
