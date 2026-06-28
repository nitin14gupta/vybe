import { useState, useRef, useCallback } from 'react'
import { View, Text, StyleSheet, TextInput, Pressable, BackHandler } from 'react-native'
import { router } from 'expo-router'
import { useFocusEffect } from 'expo-router'
import { Input, GenderSelector, ProgressBar, PrimaryButton, Screen, KeyboardAvoidingWrapper, DateTimePickerSheet, useDateTimePicker } from '@/components/ui'
import { useOnboardingStore } from '@/store/onboarding'
import { createProfile } from '@/api/user'
import { Colors, FontFamily, Spacing, Radius } from '@/constants'
import { usePillStore } from '@/store/pillStore'
import { CalendarDays } from 'lucide-react-native'

function BioInput({ value, onChangeText }: { value: string; onChangeText: (t: string) => void }) {
  const [focused, setFocused] = useState(false)
  const inputRef = useRef<TextInput>(null)
  return (
    <Pressable
      onPress={() => inputRef.current?.focus()}
      style={[bioStyles.wrap, focused && bioStyles.focused]}
    >
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={v => onChangeText(v.slice(0, 150))}
        placeholder="A short intro — who are you?"
        placeholderTextColor={Colors.inkDisabled}
        multiline
        textAlignVertical="top"
        style={bioStyles.input}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        showSoftInputOnFocus
      />
      <Text style={bioStyles.counter}>{value.length}/150</Text>
    </Pressable>
  )
}

const MIN_DOB_DATE = new Date(new Date().setFullYear(new Date().getFullYear() - 100))
const MAX_DOB_DATE = new Date(new Date().setFullYear(new Date().getFullYear() - 18))

export default function ProfileScreen() {
  const store = useOnboardingStore()
  const showPill = usePillStore(s => s.show)
  const datePicker = useDateTimePicker(MAX_DOB_DATE)
  const [loading, setLoading] = useState(false)
  const [dobError, setDobError] = useState('')

  useFocusEffect(useCallback(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => true)
    return () => sub.remove()
  }, []))

  const canProceed = !!store.name.trim() && store.dob.replace(/\D/g, '').length === 8 && !!store.gender && !dobError && !!store.bio?.trim()

  const validateDOB = (dob: string): string => {
    const digits = dob.replace(/\D/g, '')
    if (digits.length < 8) return 'Enter your full date of birth'
    const day = parseInt(digits.slice(0, 2), 10)
    const month = parseInt(digits.slice(2, 4), 10)
    const year = parseInt(digits.slice(4, 8), 10)
    if (month < 1 || month > 12) return 'Invalid month — must be 01 to 12'
    const daysInMonth = new Date(year, month, 0).getDate()
    if (day < 1 || day > daysInMonth) return `Invalid day for this month`
    const today = new Date()
    const birth = new Date(year, month - 1, day)
    if (year < 1900 || birth > today) return 'Invalid date'
    let age = today.getFullYear() - birth.getFullYear()
    if (today.getMonth() < birth.getMonth() || (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())) age--
    if (age < 18) return 'You must be 18 or older to use Vybe'
    return ''
  }

  const handleDOBChange = (text: string) => {
    const digits = text.replace(/\D/g, '').slice(0, 8)
    let formatted = digits
    if (digits.length > 4) {
      formatted = `${digits.slice(0, 2)} / ${digits.slice(2, 4)} / ${digits.slice(4)}`
    } else if (digits.length > 2) {
      formatted = `${digits.slice(0, 2)} / ${digits.slice(2)}`
    }
    store.setField('dob', formatted)
    if (dobError) setDobError(digits.length === 8 ? validateDOB(formatted) : '')
  }

  const handleDOBBlur = () => {
    if (store.dob) setDobError(validateDOB(store.dob))
  }

  const handlePickedDate = (date: Date) => {
    const dd = String(date.getDate()).padStart(2, '0')
    const mm = String(date.getMonth() + 1).padStart(2, '0')
    const yyyy = String(date.getFullYear())
    const formatted = `${dd} / ${mm} / ${yyyy}`
    store.setField('dob', formatted)
    setDobError(validateDOB(formatted))
  }

  const dobToISO = (dob: string): string => {
    const d = dob.replace(/\D/g, '')
    return `${d.slice(4, 8)}-${d.slice(2, 4)}-${d.slice(0, 2)}`
  }

  const handleNext = async () => {
    if (!store.name.trim()) { showPill('Enter your full name', 'error'); return }
    const dobErr = validateDOB(store.dob)
    if (dobErr) { setDobError(dobErr); showPill(dobErr, 'error'); return }
    if (!store.gender) { showPill('Select your gender', 'error'); return }
    if (!store.bio?.trim()) { showPill('Add a short bio to continue', 'error'); return }
    setLoading(true)
    try {
      await createProfile({
        name: store.name.trim(),
        dob: dobToISO(store.dob),
        gender: store.gender,
        bio: store.bio?.trim() || undefined,
      })
      router.push('/(onboarding)/photos')
    } catch (e: any) {
      const msg = e?.status === 400 ? (e.message || 'You must be 18+ to use Vybe.') : 'Something went wrong. Please try again.'
      showPill(msg, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Screen>
      <View style={styles.topSpacer} />
      <ProgressBar step={1} />
      <View style={styles.header}>
        <Text style={styles.title}>Let's set up your profile</Text>
        <Text style={styles.subtitle}>Tell us a little about yourself</Text>
      </View>

      <KeyboardAvoidingWrapper>
        <View style={styles.scrollContent}>
          <Input
            label="Full Name"
            placeholder="Rohan Sharma"
            value={store.name}
            onChangeText={v => store.setField('name', v)}
          />
          <Input
            label="Date of Birth"
            placeholder="DD / MM / YYYY"
            value={store.dob}
            onChangeText={handleDOBChange}
            onBlur={handleDOBBlur}
            keyboardType="number-pad"
            error={dobError}
            style={styles.field}
            rightIcon={
              <Pressable onPress={() => datePicker.open('date', datePicker.value)} hitSlop={8}>
                <CalendarDays size={18} color={Colors.inkSecondary} strokeWidth={1.8} />
              </Pressable>
            }
          />
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>GENDER</Text>
            <GenderSelector
              value={store.gender}
              onChange={v => store.setField('gender', v)}
            />
          </View>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>BIO</Text>
            <BioInput
              value={store.bio}
              onChangeText={v => store.setField('bio', v)}
            />
          </View>
        </View>
        <View style={styles.footer}>
          <PrimaryButton
            label="Next"
            onPress={handleNext}
            loading={loading}
          />
        </View>
      </KeyboardAvoidingWrapper>

      <DateTimePickerSheet
        visible={datePicker.visible}
        mode="date"
        value={datePicker.value}
        minimumDate={MIN_DOB_DATE}
        maximumDate={MAX_DOB_DATE}
        onConfirm={(date) => { datePicker.confirm(date); handlePickedDate(date) }}
        onDismiss={datePicker.dismiss}
      />
    </Screen>
  )
}

const styles = StyleSheet.create({
  topSpacer: { height: Spacing.sm },
  header: { paddingHorizontal: Spacing.screenPadding, paddingBottom: 12 },
  title: {
    fontFamily: FontFamily.headingBold,
    fontSize: 24,
    letterSpacing: -0.24,
    color: Colors.inkPrimary,
    marginBottom: 6,
  },
  subtitle: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 13,
    color: Colors.inkSecondary,
  },
  scrollContent: { padding: Spacing.screenPadding, paddingTop: 8 },
  field: { marginTop: Spacing.sectionGap },
  fieldLabel: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: 11,
    letterSpacing: 0.88,
    color: Colors.inkSecondary,
    marginBottom: 6,
  },
  footer: { paddingHorizontal: Spacing.screenPadding, paddingBottom: 16 },
})

const bioStyles = StyleSheet.create({
  wrap: {
    backgroundColor: Colors.elevated,
    borderRadius: Radius.input,
    borderWidth: 1.5,
    borderColor: Colors.divider,
    padding: 14,
    minHeight: 90,
  },
  focused: {
    borderColor: Colors.brandOrange,
    shadowColor: Colors.brandOrange,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.16,
    shadowRadius: 3,
  },
  input: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 15,
    color: Colors.inkPrimary,
    lineHeight: 22,
    minHeight: 60,
  },
  counter: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 11,
    color: Colors.inkDisabled,
    textAlign: 'right',
    marginTop: 6,
  },
})
