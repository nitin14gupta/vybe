import { useState, useRef, useEffect } from 'react'
import { View, Text, StyleSheet, Pressable, Image, ActivityIndicator } from 'react-native'
import {
  BottomSheetModal, BottomSheetView, BottomSheetBackdrop, BottomSheetFlatList,
} from '@gorhom/bottom-sheet'
import type { BottomSheetBackdropProps } from '@gorhom/bottom-sheet'
import { router } from 'expo-router'
import { X, Flame, Check } from 'lucide-react-native'
import { Colors, FontFamily } from '@/constants'
import { VybeIcebreakerModal } from './VybeIcebreakerModal'
import type { VybeRequest } from '@/api/apiService'

interface Props {
  visible: boolean
  requests: VybeRequest[]
  loading?: boolean
  onAccept: (vibeId: string, icebreaker: string) => void
  onPass: (vibeId: string) => void
  onClose: () => void
}

function renderBackdrop(props: BottomSheetBackdropProps) {
  return (
    <BottomSheetBackdrop
      {...props}
      disappearsOnIndex={-1}
      appearsOnIndex={0}
      pressBehavior="close"
      opacity={0.65}
    />
  )
}

function RequestCard({
  req,
  onAccept,
  onPass,
}: {
  req: VybeRequest
  onAccept: (id: string, icebreaker: string) => void
  onPass: (id: string) => void
}) {
  const [icebreakerOpen, setIcebreakerOpen] = useState(false)
  const [actioned, setActioned] = useState<'accepted' | 'passed' | null>(null)
  const avatar = req.photos[0]?.url

  const handleAccept = (icebreaker: string) => {
    setIcebreakerOpen(false)
    setActioned('accepted')
    onAccept(req.id, icebreaker)
  }

  const handlePass = () => {
    setActioned('passed')
    onPass(req.id)
  }

  return (
    <>
      <View style={[s.card, actioned && s.cardActioned]}>
        <Pressable
          style={s.cardLeft}
          onPress={() => router.push(`/(profile)/${req.sender_id}` as any)}
        >
          {avatar ? (
            <Image source={{ uri: avatar }} style={s.cardAvatar} />
          ) : (
            <View style={[s.cardAvatar, s.cardAvatarFallback]}>
              <Text style={s.cardAvatarInitial}>{(req.name ?? '?').charAt(0)}</Text>
            </View>
          )}
          <View style={s.cardInfo}>
            <Text style={s.cardName} numberOfLines={1}>{req.name ?? 'Someone'}</Text>
            {req.city ? <Text style={s.cardCity} numberOfLines={1}>{req.city}</Text> : null}
            <Text style={s.cardMsg} numberOfLines={2}>"{req.message}"</Text>
          </View>
        </Pressable>

        {actioned === 'accepted' ? (
          <View style={s.actionedBadge}>
            <Check size={14} color="#4CAF50" strokeWidth={2.5} />
            <Text style={s.actionedText}>Accepted</Text>
          </View>
        ) : actioned === 'passed' ? (
          <View style={[s.actionedBadge, s.actionedBadgePassed]}>
            <Text style={s.actionedText}>Passed</Text>
          </View>
        ) : (
          <View style={s.cardActions}>
            <Pressable style={s.passBtn} onPress={handlePass}>
              <X size={18} color={Colors.inkSecondary} strokeWidth={2} />
            </Pressable>
            <Pressable style={s.acceptBtn} onPress={() => setIcebreakerOpen(true)}>
              <Flame size={16} color="#111" fill="#111" />
            </Pressable>
          </View>
        )}
      </View>

      <VybeIcebreakerModal
        visible={icebreakerOpen}
        partnerName={req.name}
        onSend={handleAccept}
        onClose={() => setIcebreakerOpen(false)}
      />
    </>
  )
}

export function VybeInboxSheet({ visible, requests, loading, onAccept, onPass, onClose }: Props) {
  const sheetRef = useRef<BottomSheetModal>(null)

  useEffect(() => {
    if (visible) sheetRef.current?.present()
    else sheetRef.current?.dismiss()
  }, [visible])

  const ListHeader = (
    <View style={s.headerRow}>
      <View style={s.headerLeft}>
        <Flame size={20} color={Colors.brandOrange} fill={Colors.brandOrange} />
        <Text style={s.title}>Vybe Requests</Text>
        {requests.length > 0 && (
          <View style={s.countBadge}>
            <Text style={s.countBadgeText}>{requests.length}</Text>
          </View>
        )}
      </View>
      <Pressable onPress={onClose} hitSlop={10}>
        <X size={20} color={Colors.inkSecondary} strokeWidth={1.8} />
      </Pressable>
    </View>
  )

  return (
    <BottomSheetModal
      ref={sheetRef}
      snapPoints={['80%']}
      enablePanDownToClose
      onDismiss={onClose}
      backdropComponent={renderBackdrop}
      backgroundStyle={s.bg}
      handleIndicatorStyle={s.handleIndicator}
    >
      {loading ? (
        <BottomSheetView style={s.fullContent}>
          {ListHeader}
          <View style={s.emptyBox}>
            <ActivityIndicator color={Colors.brandOrange} />
          </View>
        </BottomSheetView>
      ) : requests.length === 0 ? (
        <BottomSheetView style={s.fullContent}>
          {ListHeader}
          <View style={s.emptyBox}>
            <Flame size={40} color={Colors.inkDisabled} strokeWidth={1.2} />
            <Text style={s.emptyTitle}>No vybe requests</Text>
            <Text style={s.emptySub}>When someone sends you a vybe, it'll show up here.</Text>
          </View>
        </BottomSheetView>
      ) : (
        <BottomSheetFlatList
          data={requests}
          keyExtractor={r => r.id}
          contentContainerStyle={s.listContent}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={ListHeader}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          renderItem={({ item }) => (
            <RequestCard
              req={item}
              onAccept={onAccept}
              onPass={onPass}
            />
          )}
        />
      )}
    </BottomSheetModal>
  )
}

const s = StyleSheet.create({
  bg: { backgroundColor: '#141414' },
  handleIndicator: { backgroundColor: 'rgba(255,255,255,0.18)' },
  fullContent: {
    paddingHorizontal: 20,
    paddingBottom: 36,
    paddingTop: 8,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 36,
    paddingTop: 8,
  },
  headerRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 16,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { fontFamily: FontFamily.headingBold, fontSize: 20, color: Colors.inkPrimary },
  countBadge: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: Colors.brandOrange,
    alignItems: 'center', justifyContent: 'center',
  },
  countBadgeText: { fontFamily: FontFamily.bodySemiBold, fontSize: 11, color: '#111' },

  card: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#1e1e1e',
    borderRadius: 16, borderWidth: 1, borderColor: '#2a2a2a',
    padding: 14, gap: 12,
  },
  cardActioned: { opacity: 0.55 },
  cardLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  cardAvatar: {
    width: 52, height: 52, borderRadius: 26,
    borderWidth: 2, borderColor: Colors.brandOrange,
  },
  cardAvatarFallback: {
    backgroundColor: '#2a2a2a', alignItems: 'center', justifyContent: 'center',
  },
  cardAvatarInitial: { fontFamily: FontFamily.headingBold, fontSize: 20, color: Colors.inkPrimary },
  cardInfo: { flex: 1 },
  cardName: { fontFamily: FontFamily.bodySemiBold, fontSize: 14, color: Colors.inkPrimary },
  cardCity: { fontFamily: FontFamily.bodyRegular, fontSize: 11, color: Colors.inkSecondary },
  cardMsg: {
    fontFamily: FontFamily.bodyRegular, fontSize: 12,
    color: Colors.inkSecondary, fontStyle: 'italic',
    marginTop: 3, lineHeight: 16,
  },

  cardActions: { flexDirection: 'row', gap: 8 },
  passBtn: {
    width: 36, height: 36, borderRadius: 18,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  acceptBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.brandOrange,
    alignItems: 'center', justifyContent: 'center',
  },
  actionedBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 12, backgroundColor: 'rgba(76,175,80,0.12)',
    borderWidth: 1, borderColor: 'rgba(76,175,80,0.3)',
  },
  actionedBadgePassed: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderColor: 'rgba(255,255,255,0.1)',
  },
  actionedText: { fontFamily: FontFamily.bodyRegular, fontSize: 11, color: Colors.inkSecondary },

  emptyBox: {
    paddingVertical: 40, alignItems: 'center', gap: 10,
  },
  emptyTitle: { fontFamily: FontFamily.headingBold, fontSize: 18, color: Colors.inkPrimary },
  emptySub: {
    fontFamily: FontFamily.bodyRegular, fontSize: 13,
    color: Colors.inkSecondary, textAlign: 'center',
  },
})
