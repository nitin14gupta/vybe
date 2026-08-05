import { useEffect, useState } from 'react'
import { View, Text, StyleSheet, TextInput, ActivityIndicator } from 'react-native'
import ApiService from '@/api/apiService'
import { Colors, FontFamily, Radius } from '@/constants'

type UsernameStatus = 'idle' | 'checking' | 'available' | 'taken' | 'invalid'

interface Props {
  username: string
  setUsername: (v: string) => void
  originalUsername: string | null
}

export function ProfileUsernameField({ username, setUsername, originalUsername }: Props) {
  const [status, setStatus] = useState<UsernameStatus>('idle')

  useEffect(() => {
    if (!username || username === originalUsername) {
      setStatus('idle')
      return
    }
    if (!/^[a-z0-9_]{3,30}$/.test(username)) {
      setStatus('invalid')
      return
    }
    setStatus('checking')
    const t = setTimeout(async () => {
      try {
        const res = await ApiService.checkUsername(username)
        setStatus(res.available ? 'available' : 'taken')
      } catch {
        setStatus('idle')
      }
    }, 400)
    return () => clearTimeout(t)
  }, [username, originalUsername])

  return (
    <View style={styles.section}>
      <Text style={styles.label}>USERNAME</Text>
      <View style={[
        styles.wrap,
        status === 'taken' || status === 'invalid' ? styles.wrapError : null,
        status === 'available' ? styles.wrapOk : null,
      ]}>
        <Text style={styles.atSign}>@</Text>
        <TextInput
          value={username}
          onChangeText={v => setUsername(v.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
          placeholder="your_username"
          placeholderTextColor={Colors.inkDisabled}
          autoCapitalize="none"
          autoCorrect={false}
          style={styles.input}
        />
        {status === 'checking' && <ActivityIndicator size="small" color={Colors.inkDisabled} />}
        {status === 'available' && <Text style={styles.avail}>✓</Text>}
        {status === 'taken' && <Text style={styles.taken}>✗</Text>}
      </View>
      {status === 'taken' ? (
        <Text style={styles.hintError}>Username is taken</Text>
      ) : status === 'invalid' ? (
        <Text style={styles.hintError}>3–30 chars · letters, numbers, underscore only</Text>
      ) : (
        <Text style={styles.hint}>3–30 chars · letters, numbers, underscore</Text>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  section: { gap: 10 },
  label: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: 11,
    letterSpacing: 0.88,
    color: Colors.inkSecondary,
  },
  wrap: {
    height: 52,
    backgroundColor: Colors.elevated,
    borderRadius: Radius.input,
    borderWidth: 1.5,
    borderColor: Colors.divider,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    gap: 8,
  },
  wrapError: { borderColor: Colors.brandCoral },
  wrapOk: { borderColor: Colors.accentGreen },
  atSign: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: 16,
    color: Colors.inkDisabled,
  },
  input: {
    flex: 1,
    fontFamily: FontFamily.bodyRegular,
    fontSize: 16,
    color: Colors.inkPrimary,
  },
  avail: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 15,
    color: Colors.accentGreen,
  },
  taken: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 15,
    color: Colors.brandCoral,
  },
  hint: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 11,
    color: Colors.inkDisabled,
    marginTop: -4,
  },
  hintError: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 11,
    color: Colors.brandCoral,
    marginTop: -4,
  },
})
