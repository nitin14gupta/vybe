// 8px linear scale — all spacing derives from this base
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
  screenPadding: 24,  // horizontal padding on all screens (from design)
  sectionGap: 18,     // vertical gap between form fields
  gutter: 12,         // grid column gutter
} as const

export const Radius = {
  sm: 8,
  input: 12,    // inputs, OTP boxes, gender buttons
  inputLg: 14,  // phone input, city search
  card: 16,     // cards, photo slots
  modal: 28,    // bottom sheet top corners
  pill: 999,    // buttons, chips — strictly pill-shaped
} as const

export const ComponentSize = {
  btnPrimary: 56,     // primary & secondary button height
  btnGhost: 44,       // text link button height
  inputHeight: 52,    // standard input height
  inputPhoneHeight: 62, // phone input (taller for country prefix)
  otpBoxHeight: 52,   // OTP box height
  backBtn: 40,        // back button circle size
  navBar: 72,         // bottom navigation bar height
  navCenter: 64,      // floating centre tab circle
  navCenterRaise: 8,  // px the centre tab floats above nav line
  statusBar: 44,      // iOS status bar height
  homeIndicator: 34,  // iOS home indicator area
} as const
