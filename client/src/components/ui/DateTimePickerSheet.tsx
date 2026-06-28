import React, { useCallback, useRef, useState } from 'react'
import {
  Animated,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker'
import { LinearGradient } from 'expo-linear-gradient'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

// ── DateTimePickerSheet (iOS sheet wrapper) ───────────────────────────────

interface SheetProps {
  visible: boolean
  mode: 'date' | 'time'
  value: Date
  onConfirm: (date: Date) => void
  onDismiss: () => void
  minimumDate?: Date
  maximumDate?: Date
}

export function DateTimePickerSheet({
  visible,
  mode,
  value,
  onConfirm,
  onDismiss,
  minimumDate,
  maximumDate,
}: SheetProps) {
  const insets = useSafeAreaInsets()
  const slideAnim = useRef(new Animated.Value(400)).current
  const [localDate, setLocalDate] = useState(value)

  React.useEffect(() => {
    setLocalDate(value)
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start()
    } else {
      slideAnim.setValue(400)
    }
  }, [visible, value])

  const dismiss = () => {
    Animated.timing(slideAnim, {
      toValue: 400,
      duration: 220,
      useNativeDriver: true,
    }).start(onDismiss)
  }

  const confirm = () => {
    onConfirm(localDate)
    dismiss()
  }

  // On Android the picker renders as a native dialog — no sheet needed.
  if (Platform.OS === 'android') {
    if (!visible) return null
    return (
      <DateTimePicker
        value={value}
        mode={mode}
        display="default"
        minimumDate={minimumDate}
        maximumDate={maximumDate}
        onChange={(event: DateTimePickerEvent, date?: Date) => {
          if (event.type === 'set' && date) onConfirm(date)
          else onDismiss()
        }}
      />
    )
  }

  // iOS: slide-up sheet with spinner picker + Done button
  if (!visible) return null
  return (
    <Modal transparent visible animationType="none" onRequestClose={dismiss}>
      <Pressable style={s.backdrop} onPress={dismiss} />
      <Animated.View
        style={[
          s.sheet,
          { paddingBottom: insets.bottom + 8, transform: [{ translateY: slideAnim }] },
        ]}
      >
        <View style={s.handle} />
        <DateTimePicker
          value={localDate}
          mode={mode}
          display="spinner"
          minimumDate={minimumDate}
          maximumDate={maximumDate}
          textColor="#fff"
          themeVariant="dark"
          onChange={(_: DateTimePickerEvent, date?: Date) => {
            if (date) setLocalDate(date)
          }}
          style={{ height: 200 }}
        />
        <Pressable onPress={confirm} style={s.doneBtn}>
          <LinearGradient
            colors={['#FF6B35', '#FF3864']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={s.doneGrad}
          >
            <Text style={s.doneTxt}>Done</Text>
          </LinearGradient>
        </Pressable>
      </Animated.View>
    </Modal>
  )
}

// ── useDateTimePicker hook ────────────────────────────────────────────────

export function useDateTimePicker(initial?: Date) {
  const [visible, setVisible]   = useState(false)
  const [mode,    setMode]      = useState<'date' | 'time'>('date')
  const [value,   setValue]     = useState<Date>(initial ?? new Date())
  const resolveRef = useRef<((d: Date) => void) | null>(null)

  const open = useCallback((m: 'date' | 'time', seed?: Date): Promise<Date> => {
    if (seed) setValue(seed)
    setMode(m)
    setVisible(true)
    return new Promise(res => { resolveRef.current = res })
  }, [])

  const confirm = useCallback((d: Date) => {
    setValue(d)
    setVisible(false)
    resolveRef.current?.(d)
    resolveRef.current = null
  }, [])

  const dismiss = useCallback(() => {
    setVisible(false)
    resolveRef.current?.(value)
    resolveRef.current = null
  }, [value])

  return { visible, mode, value, setValue, open, confirm, dismiss }
}

const s = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#1A1A1A',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    alignItems: 'center',
    paddingTop: 10,
    paddingHorizontal: 20,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#3A3A3A',
    marginBottom: 8,
  },
  doneBtn: { width: '100%', borderRadius: 14, overflow: 'hidden', marginTop: 12 },
  doneGrad: { paddingVertical: 15, alignItems: 'center' },
  doneTxt: { color: '#fff', fontSize: 16, fontWeight: '700' },
})