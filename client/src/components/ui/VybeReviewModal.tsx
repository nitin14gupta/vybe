import { useState } from 'react'
import {
  Modal, View, Text, Image, Pressable, StyleSheet, ScrollView,
} from 'react-native'
import { X, Heart } from 'lucide-react-native'
import { Colors, FontFamily } from '@/constants'
import { VybeIcebreakerModal } from './VybeIcebreakerModal'
import type { VybeRequest } from '@/api/apiService'

interface Props {
  visible: boolean
  request: VybeRequest | null
  onAccept: (vibeId: string, icebreaker: string) => void
  onPass: (vibeId: string) => void
  onClose: () => void
}

export function VybeReviewModal({ visible, request, onAccept, onPass, onClose }: Props) {
  const [showIcebreaker, setShowIcebreaker] = useState(false)

  if (!request) return null

  const avatar = request.photos[0]?.url
  const chips = (request as any).interests?.slice(0, 4) ?? []

  const handleAcceptPress = () => setShowIcebreaker(true)

  const handleIcebreakerSend = (icebreaker: string) => {
    setShowIcebreaker(false)
    onAccept(request.id, icebreaker)
    onClose()
  }

  const handlePass = () => {
    onPass(request.id)
    onClose()
  }

  return (
    <>
      <Modal visible={visible && !showIcebreaker} animationType="slide" transparent onRequestClose={onClose}>
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <View style={styles.handle} />

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Profile photo */}
              <View style={styles.photoContainer}>
                {avatar ? (
                  <Image source={{ uri: avatar }} style={styles.photo} />
                ) : (
                  <View style={[styles.photo, styles.photoFallback]}>
                    <Text style={styles.photoInitial}>{(request.name ?? '?').charAt(0)}</Text>
                  </View>
                )}
              </View>

              {/* Name + city */}
              <Text style={styles.name}>{request.name ?? 'Someone'}</Text>
              {request.city ? <Text style={styles.city}>{request.city}</Text> : null}

              {/* Interest chips */}
              {chips.length > 0 && (
                <View style={styles.chips}>
                  {chips.map((tag: string) => (
                    <View key={tag} style={styles.chip}>
                      <Text style={styles.chipText}>{tag}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Their vybe message */}
              <View style={styles.messageBox}>
                <Text style={styles.messageLabel}>Their vybe message</Text>
                <Text style={styles.message}>"{request.message}"</Text>
              </View>
            </ScrollView>

            {/* Actions */}
            <View style={styles.actions}>
              <Pressable style={styles.passBtn} onPress={handlePass}>
                <X size={20} color={Colors.inkSecondary} strokeWidth={2} />
                <Text style={styles.passText}>Pass</Text>
              </Pressable>

              <Pressable style={styles.acceptBtn} onPress={handleAcceptPress}>
                <Heart size={18} color="#111" fill="#111" />
                <Text style={styles.acceptText}>Accept</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <VybeIcebreakerModal
        visible={showIcebreaker}
        partnerName={request.name}
        onSend={handleIcebreakerSend}
        onClose={() => setShowIcebreaker(false)}
      />
    </>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  sheet: {
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingBottom: 36,
    paddingTop: 12,
    maxHeight: '90%',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignSelf: 'center',
    marginBottom: 16,
  },
  photoContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  photo: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: Colors.brandOrange,
  },
  photoFallback: {
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoInitial: {
    fontFamily: FontFamily.headingBold,
    fontSize: 48,
    color: Colors.inkPrimary,
  },
  name: {
    fontFamily: FontFamily.headingBold,
    fontSize: 24,
    color: Colors.inkPrimary,
    textAlign: 'center',
    marginBottom: 4,
  },
  city: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 14,
    color: Colors.inkSecondary,
    textAlign: 'center',
    marginBottom: 16,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 20,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  chipText: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 13,
    color: Colors.inkPrimary,
  },
  messageBox: {
    backgroundColor: 'rgba(255,107,53,0.1)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,107,53,0.3)',
    padding: 16,
    marginBottom: 24,
  },
  messageLabel: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 11,
    color: Colors.brandOrange,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  message: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 16,
    color: Colors.inkPrimary,
    lineHeight: 24,
    fontStyle: 'italic',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  passBtn: {
    flex: 1,
    height: 52,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  passText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 15,
    color: Colors.inkSecondary,
  },
  acceptBtn: {
    flex: 2,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.brandOrange,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  acceptText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 16,
    color: '#111',
  },
})
