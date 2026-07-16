import { useRef, useEffect } from 'react'
import { View, Text, StyleSheet, Pressable } from 'react-native'
import { BottomSheetModal, BottomSheetView, BottomSheetBackdrop } from '@gorhom/bottom-sheet'
import type { BottomSheetBackdropProps } from '@gorhom/bottom-sheet'
import { router } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'
import { PartyPopper, Plus, Ticket, Lock } from 'lucide-react-native'
import { hTap } from '@/lib/haptics'
import { Colors, FontFamily } from '@/constants'

interface Props {
  visible: boolean
  onCreateEvent: () => void
  onClose: () => void
}

function renderBackdrop(props: BottomSheetBackdropProps) {
  return <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} pressBehavior="close" opacity={0.55} />
}

function CreateEventSheetCore({ onCreateEvent, onClose }: Omit<Props, 'visible'>) {
  const sheetRef = useRef<BottomSheetModal>(null)

  useEffect(() => { sheetRef.current?.present() }, [])

  const handlePress = () => {
    hTap()
    sheetRef.current?.dismiss()
    onCreateEvent()
  }

  return (
    <BottomSheetModal
      ref={sheetRef}
      enableDynamicSizing
      enablePanDownToClose
      onDismiss={onClose}
      backdropComponent={renderBackdrop}
      backgroundStyle={s.bg}
      handleIndicatorStyle={s.handle}
    >
      <BottomSheetView style={s.content}>
        <Text style={s.title}>Create</Text>

        <View style={{ gap: 12 }}>
          <Pressable style={s.card} android_ripple={{ color: 'rgba(255,255,255,0.06)' }} onPress={handlePress}>
            <View style={s.cardIcon}>
              <Plus size={20} color="#fff" strokeWidth={2.5} />
            </View>
            <View style={s.cardText}>
              <Text style={s.cardTitle}>Host an event</Text>
              <Text style={s.cardSubtitle}>Collect RSVPs</Text>
            </View>
            <LinearGradient
              colors={[Colors.brandOrange, Colors.brandCoral]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={s.cardBadge}
            >
              <PartyPopper size={22} color="#fff" strokeWidth={2} />
            </LinearGradient>
          </Pressable>

          <Pressable style={s.card} android_ripple={{ color: 'rgba(255,255,255,0.06)' }} onPress={handlePress}>
            <View style={s.cardIcon}>
              <Plus size={20} color="#fff" strokeWidth={2.5} />
            </View>
            <View style={s.cardText}>
              <Text style={s.cardTitle}>Sell tickets</Text>
              <Text style={s.cardSubtitle}>Host a paid gathering or workshop</Text>
            </View>
            <View style={[s.cardBadge, s.badgeDark]}>
              <Ticket size={22} color={Colors.brandOrange} strokeWidth={2} />
            </View>
          </Pressable>

          <Pressable style={s.card} android_ripple={{ color: 'rgba(255,255,255,0.06)' }} onPress={handlePress}>
            <View style={s.cardIcon}>
              <Plus size={20} color="#fff" strokeWidth={2.5} />
            </View>
            <View style={s.cardText}>
              <Text style={s.cardTitle}>Private gathering</Text>
              <Text style={s.cardSubtitle}>Invite-only for your inner circle</Text>
            </View>
            <View style={[s.cardBadge, s.badgeDark]}>
              <Lock size={22} color={Colors.brandOrange} strokeWidth={2} />
            </View>
          </Pressable>
        </View>

        <View style={{ height: 16 }} />
      </BottomSheetView>
    </BottomSheetModal>
  )
}

export function CreateEventSheet(props: Props) {
  if (!props.visible) return null
  return <CreateEventSheetCore {...props} />
}

const s = StyleSheet.create({
  bg: { backgroundColor: Colors.elevated },
  handle: { backgroundColor: 'rgba(255,255,255,0.18)' },
  content: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 0 },
  title: {
    fontFamily: FontFamily.headingBold,
    fontSize: 18,
    color: Colors.inkPrimary,
    marginBottom: 14,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.divider,
    padding: 14,
  },
  cardIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardText: { flex: 1, gap: 2 },
  cardTitle: { fontFamily: FontFamily.headingBold, fontSize: 15, color: Colors.inkPrimary },
  cardSubtitle: { fontFamily: FontFamily.bodyRegular, fontSize: 12, color: Colors.inkSecondary },
  cardBadge: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeDark: {
    backgroundColor: 'rgba(255,107,53,0.12)',
  },
})
