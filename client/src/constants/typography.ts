import { Colors } from './colors'

export const FontFamily = {
  displayExtraBold: 'CabinetGrotesk-Extrabold', // 800 — wordmark, hero titles
  headingBold: 'CabinetGrotesk-Bold',            // 700 — screen titles, headings
  headingMedium: 'CabinetGrotesk-Medium',        // 500 — sub-headers (no SemiBold in font set)
  bodyRegular: 'Satoshi-Regular',                // 400 — descriptions, long-form
  bodyMedium: 'Satoshi-Medium',                  // 500 — body emphasis, labels
  bodySemiBold: 'Satoshi-Bold',                  // 700 — buttons, chips (sub for SemiBold)
} as const

export const TextStyles = {
  displayXl: {
    fontFamily: FontFamily.displayExtraBold,
    fontSize: 72,
    lineHeight: 72,
    letterSpacing: -0.03 * 72,
    color: Colors.inkPrimary,
  },
  headingLg: {
    fontFamily: FontFamily.headingBold,
    fontSize: 32,
    lineHeight: 38,
    letterSpacing: -0.02 * 32,
    color: Colors.inkPrimary,
  },
  headingMd: {
    fontFamily: FontFamily.headingBold,
    fontSize: 28,
    lineHeight: 34,
    letterSpacing: -0.01 * 28,
    color: Colors.inkPrimary,
  },
  headingSm: {
    fontFamily: FontFamily.headingBold,
    fontSize: 24,
    lineHeight: 30,
    letterSpacing: -0.01 * 24,
    color: Colors.inkPrimary,
  },
  bodyLg: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: 16,
    lineHeight: 24,
    color: Colors.inkPrimary,
  },
  bodyMd: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 14,
    lineHeight: 22,
    color: Colors.inkSecondary,
  },
  bodySm: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 13,
    lineHeight: 20,
    color: Colors.inkSecondary,
  },
  label: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: 11,
    lineHeight: 16,
    letterSpacing: 0.08 * 11,
    color: Colors.inkSecondary,
  },
  btnLabel: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 16,
    lineHeight: 20,
    letterSpacing: 0.01 * 16,
    color: Colors.inkPrimary,
  },
} as const
