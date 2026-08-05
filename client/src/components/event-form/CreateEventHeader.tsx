import React from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { ChevronLeft, X } from 'lucide-react-native'
import { hTap } from '@/lib/haptics'
import { Colors, FontFamily } from '@/constants'

export function CreateEventHeader({
  step,
  totalSteps,
  onBack,
}: {
  step: number
  totalSteps: number
  onBack: () => void
}) {
  return (
    <>
      <View style={s.header}>
        <Pressable
          style={s.iconBtn}
          onPress={() => { hTap(); onBack() }}
          hitSlop={10}
        >
          {step > 1
            ? <ChevronLeft size={20} color="#fff" strokeWidth={2.2} />
            : <X size={20} color="#fff" strokeWidth={2.2} />}
        </Pressable>

        <Text style={s.headerTitle}>Create Event</Text>

        <View style={s.stepPill}>
          <Text style={s.stepPillNum}>{step}</Text>
          <Text style={s.stepPillOf}>/{totalSteps}</Text>
        </View>
      </View>

      <View style={s.progress}>
        {Array.from({ length: totalSteps }, (_, i) => i + 1).map(n => (
          <View key={n} style={[s.seg, n <= step && s.segActive]} />
        ))}
      </View>
    </>
  )
}

const s = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 14,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.glassSurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: FontFamily.headingBold,
    fontSize: 17,
    color: '#fff',
    letterSpacing: -0.2,
  },
  stepPill: {
    width: 38,
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'flex-end',
    gap: 1,
  },
  stepPillNum: {
    fontFamily: FontFamily.headingBold,
    fontSize: 16,
    color: '#fff',
  },
  stepPillOf: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: 13,
    color: Colors.glassTextDisabled,
  },
  progress: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 5,
    marginBottom: 4,
  },
  seg: {
    flex: 1,
    height: 3,
    borderRadius: 2,
    backgroundColor: Colors.glassSurface,
  },
  segActive: { backgroundColor: '#fff' },
})
