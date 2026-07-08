import { ReactNode } from 'react'
import { KeyboardAvoidingView, ScrollView, Platform, StyleSheet } from 'react-native'
import { Colors } from '@/constants'

interface Props {
  children: ReactNode
  scrollEnabled?: boolean
  transparent?: boolean
}

export function KeyboardAvoidingWrapper({ children, scrollEnabled = true, transparent = false }: Props) {
  return (
    <KeyboardAvoidingView
      style={[styles.flex, transparent && { backgroundColor: 'transparent' }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={[styles.flex, transparent && { backgroundColor: 'transparent' }]}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        scrollEnabled={scrollEnabled}
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.background },
  content: { flexGrow: 1 },
})
