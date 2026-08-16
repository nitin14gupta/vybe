import { useState } from 'react'
import {
  Modal, View, Text, StyleSheet, ScrollView,
} from 'react-native'
import { Image } from 'expo-image'
import { X, Heart } from 'lucide-react-native'
import { hSuccess, hTap } from '@/lib/haptics'
import { Colors, FontFamily, withOpacity } from '@/constants'
import { VibeIcebreakerModal } from './VibeIcebreakerModal'
import { PrimaryButton } from './PrimaryButton'
import { OutlineButton } from './OutlineButton'
import type { VibeRequest } from '@/api/apiService'

interface Props {
  visible: boolean
  request: VibeRequest | null
  onAccept: (vibeId: string, icebreaker: string) => void
  onPass: (vibeId: string) => void
  onClose: () => void
}

export function VibeReviewModal({ visible, request, onAccept, onPass, onClose }: Props) {
  const [showIcebreaker, setShowIcebreaker] = useState(false)

  if (!request) return null

  const avatar = request.photos[0]?.url
  const chips = (request as any).interests?.slice(0, 4) ?? []

  const handleAcceptPress = () => { hSuccess(); setShowIcebreaker(true) }

  const handleIcebreakerSend = (icebreaker: string) => {
    setShowIcebreaker(false)
    onAccept(request.id, icebreaker)
    onClose()
  }

  const handlePass = () => {
    hTap()
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
                  <Image source={{ uri: avatar }} style={styles.photo} cachePolicy="memory-disk" priority="high" transition={150} />
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

              {/* Their vibe message */}
              <View style={styles.messageBox}>
                <Text style={styles.messageLabel}>Their vibe message</Text>
                <Text style={styles.message}>"{request.message}"</Text>
              </View>
            </ScrollView>

            {/* Actions */}
            <View style={styles.actions}>
              <View style={{ flex: 1 }}>
                <OutlineButton
                  label="Pass"
                  onPress={handlePass}
                  icon={<X size={20} color={Colors.inkSecondary} strokeWidth={2} />}
                />
              </View>
              <View style={{ flex: 2 }}>
                <PrimaryButton
                  label="Accept"
                  onPress={handleAcceptPress}
                  icon={<Heart size={18} color={Colors.background} fill={Colors.background} />}
                />
              </View>
            </View>
          </View>
        </View>
      </Modal>

      <VibeIcebreakerModal
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
    backgroundColor: withOpacity(Colors.black, 0.7),
  },
  sheet: {
    backgroundColor: Colors.surface,
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
    backgroundColor: withOpacity(Colors.white, 0.18),
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
    backgroundColor: withOpacity(Colors.white, 0.08),
    borderWidth: 1,
    borderColor: withOpacity(Colors.white, 0.12),
  },
  chipText: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 13,
    color: Colors.inkPrimary,
  },
  messageBox: {
    backgroundColor: withOpacity(Colors.brandOrange, 0.1),
    borderRadius: 16,
    borderWidth: 1,
    borderColor: withOpacity(Colors.brandOrange, 0.3),
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
})
