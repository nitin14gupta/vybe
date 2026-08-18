import { useEffect, useRef, useState } from 'react'
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native'
import { Image } from 'expo-image'
import {
  BottomSheetModal, BottomSheetView, BottomSheetFlatList, BottomSheetBackdrop,
} from '@gorhom/bottom-sheet'
import type { BottomSheetBackdropProps } from '@gorhom/bottom-sheet'
import { AutoSkeletonView } from 'react-native-auto-skeleton'
import { Check, Send, Users } from 'lucide-react-native'
import { hSuccess, hSelection } from '@/lib/haptics'
import { Colors, FontFamily, withOpacity } from '@/constants'
import { usePillStore } from '@/store/pillStore'
import { useChatShareTargets } from '@/hooks/useChatShareTargets'
import ApiService, { type Conversation } from '@/api/apiService'
import { SearchBar } from './SearchBar'
import { PrimaryButton } from './PrimaryButton'

const SNAP_POINTS = ['74%']

interface Props {
  visible: boolean
  onClose: () => void
  contentType: 'event' | 'profile'
  metadata: Record<string, any>
  previewTitle: string
  previewSubtitle?: string | null
  previewImage?: string | null
}

function renderBackdrop(props: BottomSheetBackdropProps) {
  return <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} pressBehavior="close" opacity={0.6} />
}

// Same 3-column avatar-grid tile as GuestListSheet — reused here so the
// "pick people" UI reads the same everywhere in the app instead of
// introducing a second visual language for the same kind of action.
function TargetTile({ conv, selected, onPress }: { conv: Conversation; selected: boolean; onPress: () => void }) {
  return (
    <Pressable style={t.root} onPress={onPress}>
      <View style={t.avatarWrap}>
        {conv.partner_avatar ? (
          <Image source={{ uri: conv.partner_avatar }} style={t.avatar} cachePolicy="memory-disk" priority="low" transition={150} />
        ) : (
          <View style={[t.avatar, t.avatarFallback]}>
            <Text style={t.avatarInitial}>{(conv.partner_name ?? '?').charAt(0).toUpperCase()}</Text>
          </View>
        )}
        {selected && (
          <View style={t.checkBadge}>
            <Check size={14} color={Colors.background} strokeWidth={3} />
          </View>
        )}
      </View>
      <Text style={t.name} numberOfLines={1}>{conv.partner_name ?? 'User'}</Text>
    </Pressable>
  )
}

const t = StyleSheet.create({
  root: { width: '33.333%', alignItems: 'center', paddingVertical: 12, gap: 8 },
  avatarWrap: { width: 76, height: 76 },
  avatar: { width: 76, height: 76, borderRadius: 38 },
  avatarFallback: { backgroundColor: Colors.surfaceMuted, alignItems: 'center', justifyContent: 'center' },
  avatarInitial: { fontFamily: FontFamily.headingBold, fontSize: 26, color: Colors.inkPrimary },
  checkBadge: {
    position: 'absolute', bottom: -2, right: -2,
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: Colors.brandOrange,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: Colors.elevated,
  },
  name: { fontFamily: FontFamily.bodyMedium, fontSize: 12, color: Colors.inkSecondary, maxWidth: 84, textAlign: 'center' },
})

// ── Skeleton ──────────────────────────────────────────────────────────────────

function TargetsSkeleton() {
  return (
    <AutoSkeletonView isLoading animationType="gradient" defaultRadius={38} gradientColors={[Colors.skeletonBase, Colors.skeletonHighlight]}>
      <View style={st.skGrid}>
        {Array.from({ length: 9 }).map((_, i) => (
          <View key={i} style={t.root}>
            <View style={t.avatar} />
            <View style={st.skLine} />
          </View>
        ))}
      </View>
    </AutoSkeletonView>
  )
}

// ── Sheet ─────────────────────────────────────────────────────────────────────

function ShareToChatSheetCore({
  onClose, contentType, metadata, previewTitle, previewSubtitle, previewImage,
}: Omit<Props, 'visible'>) {
  const sheetRef = useRef<BottomSheetModal>(null)
  const showPill = usePillStore(s => s.show)
  // 18 up front, then lazy-loaded as the grid is scrolled — same pattern as
  // Instagram's share sheet instead of pulling the entire mutual pool at once.
  const { people, loadingMore, loadMore } = useChatShareTargets(true, 18)
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [sending, setSending] = useState(false)

  const pool = people ?? []
  const loading = people === null
  const isSearching = query.trim().length > 0

  useEffect(() => { sheetRef.current?.present() }, [])

  const toggle = (id: string) => {
    hSelection()
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  const filtered = query.trim()
    ? pool.filter(c => (c.partner_name ?? '').toLowerCase().includes(query.trim().toLowerCase()))
    : pool

  const handleSend = async () => {
    if (selected.size === 0 || sending) return
    setSending(true)
    const ids = Array.from(selected)
    const results = await Promise.allSettled(
      ids.map(id => ApiService.sendMessage(id, '', contentType, metadata)),
    )
    setSending(false)
    const failed = results.filter(r => r.status === 'rejected').length
    if (failed === 0) {
      hSuccess()
      showPill(ids.length === 1 ? 'Sent!' : `Sent to ${ids.length} people`, 'default')
      onClose()
    } else if (failed < ids.length) {
      showPill(`Sent to ${ids.length - failed}, ${failed} failed — try again for the rest`, 'error')
      onClose()
    } else {
      // Total failure — keep the sheet open with the selection intact so the
      // user can just retry, instead of losing their picks and starting over.
      showPill("Couldn't send, try again", 'error')
    }
  }

  const Header = (
    <View style={st.header}>
      <Text style={st.title}>Send in Chat</Text>

      <View style={st.preview}>
        {previewImage ? (
          <Image source={{ uri: previewImage }} style={st.previewImg} cachePolicy="memory-disk" priority="normal" transition={150} />
        ) : (
          <View style={[st.previewImg, st.previewImgFallback]}>
            <Users size={18} color={Colors.inkDisabled} strokeWidth={1.5} />
          </View>
        )}
        <View style={{ flex: 1 }}>
          <Text style={st.previewTitle} numberOfLines={1}>{previewTitle}</Text>
          {previewSubtitle ? <Text style={st.previewSub} numberOfLines={1}>{previewSubtitle}</Text> : null}
        </View>
      </View>

      <SearchBar variant="glass" value={query} onChangeText={setQuery} placeholder="Search people..." style={st.searchBar} />
    </View>
  )

  const Footer = (
    <View>
      {loadingMore && (
        <View style={st.loadingMoreRow}>
          <ActivityIndicator size="small" color={Colors.inkSecondary} />
        </View>
      )}
      <View style={st.footer}>
        <PrimaryButton
          label={selected.size > 0 ? `Send to ${selected.size}` : 'Select people to send'}
          disabled={selected.size === 0}
          loading={sending}
          onPress={handleSend}
          icon={<Send size={18} color={Colors.background} strokeWidth={2.2} />}
        />
      </View>
    </View>
  )

  return (
    <BottomSheetModal
      ref={sheetRef}
      snapPoints={SNAP_POINTS}
      enableDynamicSizing={false}
      enablePanDownToClose
      onDismiss={onClose}
      backdropComponent={renderBackdrop}
      backgroundStyle={st.bg}
      handleIndicatorStyle={st.handle}
    >
      {loading ? (
        <BottomSheetView style={st.container}>
          {Header}
          <TargetsSkeleton />
        </BottomSheetView>
      ) : pool.length === 0 ? (
        <BottomSheetView style={st.container}>
          {Header}
          <View style={st.emptyWrap}>
            <Users size={32} color={Colors.inkDisabled} strokeWidth={1.2} />
            <Text style={st.emptyTitle}>No one to share with yet</Text>
            <Text style={st.emptyText}>Vibe with people to share here.</Text>
          </View>
        </BottomSheetView>
      ) : (
        <BottomSheetFlatList
          data={filtered}
          keyExtractor={c => c.id}
          numColumns={3}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={st.listContent}
          ListHeaderComponent={Header}
          ListFooterComponent={Footer}
          onEndReachedThreshold={0.5}
          onEndReached={() => { if (!isSearching) loadMore() }}
          renderItem={({ item }) => (
            <TargetTile conv={item} selected={selected.has(item.id)} onPress={() => toggle(item.id)} />
          )}
          ListEmptyComponent={
            <View style={st.emptyWrap}>
              <Users size={32} color={Colors.inkDisabled} strokeWidth={1.2} />
              <Text style={st.emptyTitle}>No matches</Text>
              <Text style={st.emptyText}>Try a different name.</Text>
            </View>
          }
        />
      )}
    </BottomSheetModal>
  )
}

export function ShareToChatSheet(props: Props) {
  if (!props.visible) return null
  return <ShareToChatSheetCore {...props} />
}

const st = StyleSheet.create({
  bg: { backgroundColor: Colors.elevated },
  handle: { backgroundColor: withOpacity(Colors.inkPrimary, 0.18) },

  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 12, gap: 14 },
  title: { fontFamily: FontFamily.headingBold, fontSize: 18, color: Colors.inkPrimary },

  preview: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: withOpacity(Colors.inkPrimary, 0.05),
    borderRadius: 14, padding: 10,
  },
  previewImg: { width: 44, height: 44, borderRadius: 10 },
  previewImgFallback: { backgroundColor: Colors.surfaceMuted, alignItems: 'center', justifyContent: 'center' },
  previewTitle: { fontFamily: FontFamily.bodySemiBold, fontSize: 14, color: Colors.inkPrimary },
  previewSub: { fontFamily: FontFamily.bodyRegular, fontSize: 12, color: Colors.inkSecondary, marginTop: 1 },

  searchBar: { height: 42 },

  listContent: { paddingHorizontal: 12, paddingBottom: 12 },
  skGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12 },
  skLine: { width: 48, height: 10, borderRadius: 5, backgroundColor: Colors.surfaceMuted },

  emptyWrap: { alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 48 },
  emptyTitle: { fontFamily: FontFamily.bodySemiBold, fontSize: 15, color: Colors.inkPrimary, marginTop: 4 },
  emptyText: { fontFamily: FontFamily.bodyRegular, fontSize: 13, color: Colors.inkSecondary, textAlign: 'center' },

  loadingMoreRow: { paddingVertical: 12, alignItems: 'center' },
  footer: { paddingHorizontal: 8, paddingTop: 10, paddingBottom: 12 },
})
