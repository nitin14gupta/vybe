import { Dimensions, StyleSheet } from 'react-native'
import { Colors, FontFamily } from '@/constants'

export const W = Dimensions.get('window').width

export const EVENT_TYPES = [
  { key: 'house_party', label: 'House Party', emoji: '🎉' },
  { key: 'rooftop',     label: 'Rooftop',     emoji: '🌆' },
  { key: 'game_night',  label: 'Game Night',  emoji: '🎮' },
  { key: 'dinner',      label: 'Dinner',      emoji: '🍽️' },
  { key: 'music',       label: 'Music',       emoji: '🎵' },
  { key: 'other',       label: 'Other',       emoji: '🔥' },
]

export const AGE_OPTIONS: (18 | 21 | 25)[] = [18, 21, 25]

export function fmt(d: Date) {
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}
export function fmtTime(d: Date) {
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
}

export const ef = StyleSheet.create({
  // Field containers
  field: { marginBottom: 20 },
  fieldLabel: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: 13,
    color: Colors.inkSecondary,
    marginBottom: 8,
  },
  errorText: {
    color: Colors.brandCoral,
    fontFamily: FontFamily.bodyRegular,
    fontSize: 12,
    marginTop: 4,
  },

  // Text inputs
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.elevated,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.divider,
    paddingHorizontal: 14,
    paddingVertical: 4,
    minHeight: 52,
  },
  inputWrapError: { borderColor: Colors.brandCoral },
  textInput: {
    flex: 1,
    color: Colors.inkPrimary,
    fontFamily: FontFamily.bodyRegular,
    fontSize: 15,
    paddingVertical: 10,
  },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  charCount: {
    color: Colors.inkDisabled,
    fontFamily: FontFamily.bodyRegular,
    fontSize: 11,
    alignSelf: 'flex-end',
    paddingBottom: 6,
  },

  // Event type chips
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  typeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    paddingRight: 16,
    backgroundColor: Colors.surface,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Colors.divider,
  },
  typeChipActive: {
    borderColor: 'transparent',
    backgroundColor: 'rgba(255,107,53,0.12)',
    shadowColor: Colors.brandOrange,
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  typeEmojiBadge: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: Colors.elevated,
    alignItems: 'center', justifyContent: 'center',
  },
  typeEmojiBadgeActive: {
    width: 32, height: 32, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
  },
  typeEmoji: { fontSize: 16 },
  typeLabel: { fontFamily: FontFamily.bodyMedium, fontSize: 13, color: Colors.inkSecondary },
  typeLabelActive: { color: Colors.brandOrange, fontFamily: FontFamily.bodySemiBold },

  // Date/time picker row
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.elevated,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.divider,
    padding: 14,
    marginTop: 10,
    gap: 12,
  },
  pickerIcon: { width: 24, alignItems: 'center' },
  pickerContent: { flex: 1 },
  pickerLabel: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 11,
    color: Colors.inkDisabled,
    marginBottom: 2,
  },
  pickerValue: { fontFamily: FontFamily.bodyMedium, fontSize: 15, color: Colors.inkPrimary },
  pickerPlaceholder: { color: Colors.inkDisabled },
  timeRow: { flexDirection: 'row', gap: 8, marginTop: 4 },

  // Stepper
  stepperRow: { flexDirection: 'row', alignItems: 'center', gap: 20, marginTop: 8 },
  stepperBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: Colors.elevated,
    borderWidth: 1, borderColor: Colors.divider,
    alignItems: 'center', justifyContent: 'center',
  },
  stepperValue: {
    fontFamily: FontFamily.headingBold,
    fontSize: 28,
    color: Colors.brandOrange,
    minWidth: 60,
    textAlign: 'center',
  },

  // Age chips
  ageRow: { flexDirection: 'row', gap: 12, marginTop: 8 },
  ageChip: {
    flex: 1, paddingVertical: 12,
    backgroundColor: Colors.surface,
    borderRadius: 12, borderWidth: 1, borderColor: Colors.divider,
    alignItems: 'center',
  },
  ageChipActive: { backgroundColor: 'rgba(255,107,53,0.15)', borderColor: Colors.brandOrange },
  ageText: { fontFamily: FontFamily.headingMedium, fontSize: 16, color: Colors.inkSecondary },
  ageTextActive: { color: Colors.brandOrange },

  // Location step
  step3Container: { flex: 1 },
  mapWrap: {
    height: 300,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 20,
    overflow: 'hidden',
  },
  mapCentrePin: {
    position: 'absolute',
    top: '50%', left: '50%',
    marginTop: -36, marginLeft: -18,
  },
  locationNote: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 12,
    color: Colors.inkSecondary,
    marginTop: 8,
    marginBottom: 12,
  },
  indiaBanner: {
    backgroundColor: 'rgba(255,184,48,0.15)',
    borderRadius: 10, padding: 12,
    borderWidth: 1, borderColor: Colors.accentGold,
    marginBottom: 12,
  },
  indiaBannerText: { color: Colors.accentGold, fontFamily: FontFamily.bodyMedium, fontSize: 13 },

  // Pricing
  pricingCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16, borderWidth: 1, borderColor: Colors.divider,
    padding: 16,
  },
  pricingToggle: { flexDirection: 'row', gap: 8 },
  pricingBtn: {
    flex: 1, paddingVertical: 12,
    borderRadius: 10, backgroundColor: Colors.elevated, alignItems: 'center',
  },
  pricingBtnActive: { backgroundColor: Colors.brandOrange },
  pricingBtnText: { fontFamily: FontFamily.bodySemiBold, fontSize: 14, color: Colors.inkSecondary },
  pricingBtnTextActive: { color: '#fff' },
  currencySymbol: { color: Colors.inkSecondary, fontFamily: FontFamily.headingBold, fontSize: 18, marginRight: 4 },

  // Photos
  photosGrid: { flexDirection: 'row', gap: 8, height: 200 },
  photoCoverSlot: {
    flex: 1,
    backgroundColor: Colors.elevated,
    borderRadius: 12, borderWidth: 1.5, borderColor: Colors.divider,
    borderStyle: 'dashed', overflow: 'hidden',
    alignItems: 'center', justifyContent: 'center',
  },
  photoSlotFilled: { borderStyle: 'solid', borderColor: 'transparent' },
  photoSmallGrid: { width: (W - 48 - 8) / 3, gap: 6 },
  photoSmallSlot: {
    flex: 1,
    backgroundColor: Colors.elevated,
    borderRadius: 8, borderWidth: 1, borderColor: Colors.divider,
    borderStyle: 'dashed', overflow: 'hidden',
    alignItems: 'center', justifyContent: 'center', position: 'relative',
  },
  photoPlaceholder: { alignItems: 'center', gap: 4 },
  photoPlaceholderText: { color: Colors.inkDisabled, fontFamily: FontFamily.bodyRegular, fontSize: 11 },
  photoRemove: {
    position: 'absolute', top: 4, right: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 10, padding: 3, zIndex: 10,
  },

  // Lock note (edit-only)
  fieldLabelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  fieldLockNote: { fontFamily: FontFamily.bodyRegular, fontSize: 11, color: Colors.brandCoral },
  sectionLocked: { opacity: 0.45 },

  // Shared scroll container for steps 1, 2, 4
  stepScroll: { flex: 1 },
  stepContent: { padding: 24, paddingBottom: 40 },
  stepTitle: { fontFamily: FontFamily.headingBold, fontSize: 26, color: Colors.inkPrimary, marginBottom: 6 },
  stepSub: { fontFamily: FontFamily.bodyRegular, fontSize: 14, color: Colors.inkSecondary, marginBottom: 24 },
})
