# Handoff: VYBE — Auth & Onboarding Flow

## Overview

11-screen mobile onboarding flow for **VYBE**, a dark-mode social events app for Gen-Z India. Covers: animated splash → welcome → phone entry → OTP verification → age gate → 5-step profile setup (name/DOB/gender, photos, voice intro, interests, city) → completion.

Frame: **390 × 844px iPhone 14 Pro** (all measurements are at 1×, device-logical pixels).

---

## About the Design Files

The files in this bundle are **design references created in HTML** — high-fidelity prototypes showing intended look, spacing, and behavior. They are **not production code to copy directly**. The task is to **recreate these designs in your target codebase** (React Native, Swift/UIKit, Jetpack Compose, or web React) using its established patterns and libraries — adapting structure where needed while matching the visual output pixel-precisely.

Open `VYBE Auth & Onboarding.html` in any browser to walk through the interactive flow.

---

## Fidelity: High-Fidelity

These are pixel-perfect mockups with final colors, typography, spacing, icons, and micro-interactions. Recreate them precisely — every spacing value, border radius, and animation spec below is intentional and should be implemented as-is.

---

## Design Tokens

Use these exact values everywhere. **Never use pure black (`#000000`) or cool greys.**

### Colors

| Token | Value | Usage |
|---|---|---|
| `bg-primary` | `#111111` | Canvas / screen background |
| `bg-surface` | `#1A1A1A` | Cards, bottom sheets |
| `bg-elevated` | `#222222` | Inputs, photo slots |
| `bg-subtle` | `#2A2A2A` | Borders (idle), dividers, pill backgrounds |
| `brand-orange` | `#FF6B35` | Primary accent, active states |
| `brand-coral` | `#FF3864` | Gradient endpoint, error |
| `brand-gradient` | `linear-gradient(135deg, #FF6B35, #FF3864)` | Primary CTA, logo, center nav |
| `accent-gold` | `#FFB830` | Premium / featured badge |
| `accent-green` | `#00C48C` | Success, active-now dot |
| `text-primary` | `#F5F0EB` | Headings and body (warm off-white) |
| `text-secondary` | `#A09890` | Subtitles, meta, placeholders |
| `text-disabled` | `#4A4540` | Disabled text, hint lines |

### Typography

```
Headings:  'Cabinet Grotesk', system-ui, sans-serif  — Bold (700) / ExtraBold (800)
Body/UI:   'Satoshi', system-ui, sans-serif           — Regular (400) / Medium (500) / SemiBold (600)
```

> In the prototype Hanken Grotesk / DM Sans are used as proxies. Swap for Cabinet Grotesk / Satoshi in production.

### Spacing (8px rhythm)

`4 · 8 · 12 · 16 · 20 · 24 · 28 · 32 · 40 · 48`

- Screen horizontal padding: `24px`
- Section vertical gap: `16–24px`
- Component internal padding: `14–16px`

### Radii

| Context | Value |
|---|---|
| Inputs, OTP boxes, photo slots | `12–14px` |
| Cards, bottom sheets | `16–28px` |
| Buttons, chips, pills | `999px` (full pill) |
| Bottom sheet top corners | `28px` |

### Motion

| Property | Value |
|---|---|
| Primary easing | `cubic-bezier(0.2, 0, 0, 1)` |
| Press feedback | `scale(0.97)` on CTA, `scale(0.9)` on icon buttons |
| Screen entrance | `opacity 0→1 + translateY(10px→0)`, 280ms |
| Bottom card slide up | `translateY(32px→0) + opacity`, 400ms, 80ms delay |
| Transition duration | Fast: 120ms · Base: 200ms · Slow: 320ms |

---

## System Chrome

### Status Bar (44px, all screens)
- Height: `44px`, bottom-aligned content
- Time: left, `14px`, font-body 700
- Icons right: signal + wifi + battery, `15–20px`, `currentColor`
- Color: `#F5F0EB` on dark screens

### Home Indicator (34px, all screens)
- Centered bar: `130 × 5px`, `rgba(245,240,235,0.3)`, `radius: 999px`

### Phone Frame
- `390 × 844px`, `border-radius: 44px`
- Outer ring: `10px solid #060606` + `1px solid #2A2A2A`
- `box-shadow: 0 40px 120px rgba(0,0,0,0.65)`

---

## Progress Bar (Onboarding steps 1–5)

- 5 segments, `height: 3px`, `radius: 999px`, `gap: 5px`
- Padding: `0 24px 18px`
- Active: `#FF6B35` · Inactive: `#2A2A2A`
- Transition: `background 250ms`

---

## Screens

### Screen 1 — Splash

**Purpose:** Brand moment, app loading.

**Layout:**
- Full `#111111` canvas, centered vertically
- Ambient radial glow: `340 × 340px` circle centered at `50%, 42%`; `radial-gradient(circle, rgba(255,107,53,0.24) 0%, rgba(255,56,100,0.10) 45%, transparent 70%)`

**Wordmark:**
- Font: heading, `800`, `72px`, `letter-spacing: -0.03em`
- Gradient text: `linear-gradient(135deg, #FF6B35, #FF3864)` via `background-clip: text`
- Tagline: `"Meet. Vibe. Connect."` · body · `16px` · `#A09890` · `letter-spacing: 0.04em` · `mt: 14px`

**Loading dots:** (bottom, `52px` from edge)
- 3 dots, `8px` circle, `#FF6B35`, `gap: 10px`
- Animation: `scale(0.75, opacity 0.3) → scale(1.2, opacity 1)`, `1.3s ease-in-out infinite`
- Stagger: `0s · 0.22s · 0.44s`

**Auto-advance:** 2200ms → Screen 2

---

### Screen 2 — Welcome

**Purpose:** Value prop + entry point.

**Layout:** Full-bleed canvas illustration (top 460px) + `bg-surface` card sliding up from bottom.

**City Illustration (460 × 460px canvas):**
- Sky: diagonal gradient `#070707 → #180c04 → #2e1608`
- Horizon glow: radial at `50%, 72%`, radius `78%`, `rgba(255,107,53,0.45) → transparent`
- Warm window lights: `rgba(255, ~170–215, ~0–38, 0.55–0.9)` rectangles on building grid
- Buildings: `#111111` silhouettes (front), `#190e06` (back)

**Bottom Card:**
- `bg-surface (#1A1A1A)`, `border-radius: 28px 28px 0 0`
- Padding: `28px 24px 0`
- Entrance: `translateY(32px) → 0`, `400ms`, `80ms delay`
- Headline: `"Find your vibe"` · heading · `700` · `32px` · `line-height: 38px` · `letter-spacing: -0.02em`
- Subtext: body · `14px` · `#A09890` · `line-height: 22px` · `mb: 28px`
- Primary CTA: `GradBtn` (see Buttons)
- Text link: `"I already have an account"` · `#A09890` · `height: 44px`

**Pagination dots:** `22 × 8px` active pill (`#FF6B35`), `8 × 8px` inactive (`#2A2A2A`), `gap: 6px`, centered, `mt: 18px`

---

### Screen 3 — Phone Entry

**Purpose:** Phone number capture.

**Header:**
- Back button (see Buttons)
- `mt: 20px`, title: `"What's your number?"` · heading · `700` · `28px` · `lh: 34px` · `ls: -0.01em`
- Subtitle: body · `14px` · `#A09890` · `mb: 34px`

**Phone Input (height: 62px):**
- Container: `bg-elevated (#222222)`, `border: 1.5px solid #2A2A2A (idle) / #FF6B35 (focus)`, `radius: 14px`
- Focus glow: `box-shadow: 0 0 0 3px rgba(255,107,53,0.16)`
- Prefix slot: `🇮🇳 +91 ▾` · `padding: 0 14px` · `border-right: 1px solid #2A2A2A`
- Input: `18px` · weight `500` · `letter-spacing: 0.06em` · `padding: 0 16px`
- Enabled when: `digits.length === 10` (numeric only)

**Legal copy:** `10px` · `#4A4540` · centered · `mt: 14px`

---

### Screen 4 — OTP Verification

**Purpose:** 6-digit code entry.

**Header:**
- Back button
- Title: `"Enter the code"` · heading · `700` · `28px`
- Subtitle: phone number + pencil edit icon (`14px`, `#FF6B35`)

**OTP Grid (6 boxes, `gap: 8px`):**
- Box size: `flex: 1`, `height: 52px` (tweakable 40–68px)
- Background: `#222222`
- Border: `1.5px solid #2A2A2A (empty) / #FF6B35 (filled) / #FF3864 (error)`
- Radius: `12px` (tweakable 4–28px)
- Font: heading · `700` · `22px` · `text-align: center`
- Focus glow: `0 0 0 3px rgba(255,107,53,0.15)`
- Error glow: `0 0 0 3px rgba(255,56,100,0.15)`
- Auto-advance focus: when digit entered, focus next box; Backspace on empty, focus previous
- Error shake: `translateX ±8px → ±6px`, `450ms`

**Resend timer:** countdown from `45s` · `14px` · orange elapsed · resend button on `0`

---

### Screen 5 — Age Gate

**Purpose:** 18+ confirmation.

**Layout:** Full screen, vertically centered, `padding: 0 28px`, text-center.

**Content:**
- Emoji: `🎂` · `80px` · `mb: 28px`
- Title: `"Are you 18 or older?"` · heading · `700` · `26px`
- Body: `14px` · `#A09890` · `lh: 22px` · `mb: 44px`
- Primary CTA: `"Yes, I'm 18+"` (gradient)
- Outline CTA: `"No, I'm not"` (border `#2A2A2A`, `gap: 12px`)

**Declined state:** Replaces screen with lock emoji `🔒`, message, back button. No navigation out.

---

### Screen 6 — Profile: Name / DOB / Gender

**Progress bar step 1/5.**

**Fields (gap: 18px):**
- Label: `11px` · `600` · `letter-spacing: 0.08em` · `uppercase` · `#A09890`
- Input container: `height: 52px` · `bg-elevated` · `border: 1.5px solid` · `radius: 12px`
- Focus: `#FF6B35` border + `0 0 0 3px rgba(255,107,53,0.14)` glow

**Gender grid (2×2):**
- Options: `Man · Woman · Non-binary · Prefer not to say`
- Button: `height: 48px` · `radius: 12px` · `13px`
- Selected: `bg: rgba(255,107,53,0.12)` · `border: #FF6B35` · `color: #FF6B35` · `weight: 600`
- Unselected: `bg-elevated` · `border: #2A2A2A` · `color: #A09890`

**Enabled when:** name + DOB + gender all filled.

---

### Screen 7 — Profile: Photos

**Progress bar step 2/5.**

**Photo Grid (`2-column, gap: 12px`):**
- Slot 0 (main): spans 2 cols, `aspect-ratio: 16/9`, `radius: 16px`
- Slots 1–5: `aspect-ratio: 1/1`, `radius: 16px`
- Empty: `bg-elevated`, `border: 1.5px dashed #2A2A2A`, camera icon centered
- Filled: gradient placeholder, `×` remove button (`26px`, `rgba(17,17,17,0.7)`) top-right, `radius: 50%`

**Enabled when:** ≥ 1 photo added.

---

### Screen 8 — Profile: Voice Intro

**Progress bar step 3/5.**

**Record button (center stage):**
- `120 × 120px` circle
- Idle: `bg-surface`, `border: 2.5px solid #2A2A2A`, mic icon `40px`
- Recording: `bg: radial(rgba(255,107,53,0.2), rgba(255,107,53,0.05))`, `border: #FF6B35`, square-stop icon, `box-shadow: 0 0 40px rgba(255,107,53,0.3)`
- Ripple ring: `148×148px` expanding circle, `border: 2px solid #FF6B35`, `scale(1→1.55) + opacity(0.4→0)`, `1.4s infinite`

**Waveform (recording state):**
- 14 bars, `width: 4px`, `height: 36px`, `radius: 999px`, `#FF6B35`, `gap: 4px`
- Animation: `scaleY(0.15→1)`, `0.65s ease-in-out infinite`, stagger `55ms`

**Timer:** heading · `700` · `28px`, `"0:00 / 0:30"`

**Playback bar (after recording):**
- Play/pause button: `40×40px` circle, `bg: #FF6B35`, icon `18px` `#111`
- Progress track: `height: 4px`, `bg: #2A2A2A`, filled `#FF6B35`
- Retake link: `13px`, `#A09890`

**CTA:** `"Use this"` (gradient) when recorded · `"Skip for now"` (text link) otherwise.

---

### Screen 9 — Profile: Interests

**Progress bar step 4/5.**

**Interest chips (flex wrap, `gap: 10px`):**
- `height: 40px` · `padding: 0 16px` · `radius: 999px`
- Selected: `bg: rgba(255,107,53,0.15)` · `border: 1.5px solid #FF6B35` · `color: #FF6B35` · `weight: 600`
- Unselected: `bg-elevated` · `border: #2A2A2A` · `color: #A09890`
- Transition: `all 160ms`
- Each chip has emoji + label

**18 options:** Music🎵 · Travel✈️ · Food🍕 · Sports⚽ · Art🎨 · Movies🎬 · Gaming🎮 · Dance💃 · Fitness🏋️ · Comedy😂 · Photography📸 · Fashion👗 · Tech💻 · Books📚 · Cooking🍳 · Nightlife🌃 · Hiking🥾 · Yoga🧘

**Minimum 3** to enable CTA. Counter shown in subtitle when > 0 selected.

---

### Screen 10 — Profile: City

**Progress bar step 5/5.**

**Search field (height: 52px):**
- `bg-elevated`, `border: 1.5px solid #2A2A2A / #FF6B35 (focus)`, `radius: 14px`
- Leading search icon: `18×18px`, `#A09890`

**"Use my location" row:**
- Icon container: `40×40px` · `radius: 12px` · `bg: rgba(255,107,53,0.12)` · map-pin `20px #FF6B35`
- Label: `15px` · `600` · `#FF6B35`
- `border-bottom: 1px solid #2A2A2A`

**City rows:**
- City name: `15px` · `600` · active: `#FF6B35` / inactive: `#F5F0EB`
- State: `12px` · `#A09890`
- Check icon (`20px #FF6B35`) right when selected
- `padding: 16px 24px` · `border-bottom: 1px solid #2A2A2A`

**8 cities:** Mumbai · Delhi · Bangalore · Hyderabad · Pune · Chennai · Kolkata · Ahmedabad

---

### Screen 11 — Complete

**Purpose:** Celebration + entry to main app.

**Confetti:**
- 32 pieces, deterministic seeded positions
- Colors: `#FF6B35 · #FF3864 · #FFB830 · #00C48C · #F5F0EB · #FF2D6E`
- Size: `7–16px`, mix of circles and squares
- Animation: `translateY(0→920px) + rotate(0→720deg)`, `2.2–3.8s`, staggered delays

**Check circle:**
- `88×88px`, `radius: 50%`, `bg: rgba(255,107,53,0.14)`, `border: 2px solid rgba(255,107,53,0.3)`
- Check icon: `44×44px`, `#FF6B35`
- `mb: 28px`

**Copy:**
- Headline: `"You're all set, [Name]! 🎉"` · heading · `800` · `28px` · `ls: -0.02em` · `lh: 34px`
- Body: `15px` · `#A09890` · `lh: 24px` · `mb: 44px`
- CTA: `"Explore VYBE"` (gradient)
- Auto-advance note: `12px` · `#4A4540`

**Auto-advance:** 4000ms → restart (loop) / in production → main app.

---

## Shared Components

### Primary CTA Button

```
height: 56px  ·  width: 100%  ·  radius: 999px
background: linear-gradient(135deg, #FF6B35, #FF3864)
color: #111111  ·  font: body 700 16px  ·  letter-spacing: 0.01em
Disabled: bg #2A2A2A, color #4A4540, opacity 0.7
Press: scale(0.97), 120ms
```

### Outline Button

```
height: 56px  ·  width: 100%  ·  radius: 999px
background: transparent  ·  border: 1.5px solid #2A2A2A  ·  color: #F5F0EB
```

### Text Link Button

```
height: 44px  ·  background: transparent  ·  color: #A09890
font: body 700 16px  ·  no border
```

### Back Button

```
width: 40px  ·  height: 40px  ·  radius: 999px
bg: #1A1A1A  ·  border: 1px solid #2A2A2A
Arrow-left icon: 18×18px  ·  color: #F5F0EB
margin: 8px 0 4px 24px
```

### Section Label (field labels)

```
font: body  ·  11px  ·  600  ·  letter-spacing: 0.08em  ·  uppercase  ·  color: #A09890
```

---

## Interactions & Behavior

| Trigger | Action |
|---|---|
| Splash loads | Auto-advance to Welcome after 2200ms |
| Phone: 10 digits typed | CTA enables |
| OTP box filled | Auto-focus next box |
| OTP Backspace on empty | Focus previous box |
| OTP complete → submit | Shake animation → advance (simulate verify) |
| Resend countdown | 45s countdown; tap to reset |
| Age Gate "No" | Show locked-out state (no back navigation out) |
| Photo slot tap (empty) | Mark as filled (production: open camera/picker) |
| Photo `×` tap | Remove photo |
| Voice record button | Toggle record; max 30s; auto-stop |
| Voice play button | Toggle playback preview |
| Interests chip | Toggle selected; require ≥ 3 to continue |
| City row tap | Select city; CTA enables |
| Complete screen | Auto-advance after 4000ms |

---

## State per Screen

- **Phone:** `phone: string` (10-digit numeric)
- **OTP:** `digits: string[6]`, `error: bool`, `countdown: number`
- **Step 1:** `name: string`, `dob: string`, `gender: string`
- **Step 2:** `photos: (string|null)[6]` (index 0 = main, 2-col span)
- **Step 3:** `recording: bool`, `recorded: bool`, `seconds: number (0–30)`, `playing: bool`
- **Step 4:** `selected: string[]` (minimum 3)
- **Step 5:** `city: string | null`

---

## Icons

All icons are [Lucide](https://lucide.dev) — 2px stroke, rounded caps.

| Icon name | Where used |
|---|---|
| `arrow-left` | Back button |
| `signal · wifi · battery-full` | Status bar |
| `chevron-down` | Country code picker |
| `pencil` | Edit phone on OTP screen |
| `camera` | Empty photo slot |
| `x` | Remove photo |
| `mic · square` | Voice record / stop |
| `play · pause` | Voice playback |
| `search` | City search |
| `map-pin` | Use location row |
| `check` | City selected, completion tick |

---

## Assets

- **Placeholder photos:** `assets/img/placeholder-*.png` — brand-toned gradient tiles. Replace with real photography.
- **City night illustration:** canvas-drawn deterministically in `Shared.jsx → CityCanvas`. For production: use a real illustrated or photographic asset.
- **Fonts:** Link Cabinet Grotesk + Satoshi from your licensed CDN or local `@font-face`.
- **Icons:** Lucide CDN `lucide@0.453.0` or install `lucide-react` / equivalent native icon set.

---

## Files in This Bundle

| File | Contents |
|---|---|
| `VYBE Auth & Onboarding.html` | Self-contained interactive prototype — open in browser |
| `ui_kits/auth_onboarding/Shared.jsx` | Frame, status bar, home indicator, buttons, progress bar, city canvas |
| `ui_kits/auth_onboarding/SplashWelcome.jsx` | Screens 1–2 |
| `ui_kits/auth_onboarding/AuthFlow.jsx` | Screens 3–5 (phone, OTP, age gate) |
| `ui_kits/auth_onboarding/OnboardingA.jsx` | Steps 1–3 (profile, photos, voice) |
| `ui_kits/auth_onboarding/OnboardingB.jsx` | Steps 4–5 + complete (interests, city, celebration) |

---

## Notes for Implementation

1. **Component visual details** (exact spacing, icon choices, animation specs) are fully documented above. Update from the live prototype if in doubt — open the HTML and inspect.
2. **Core component API** (props, behavior, flow) is final and won't change.
3. The prototype uses **CSS custom properties** for OTP box size / radius / brand color — these are the tweakable values and represent the agreed design; implement at the values shown in the Tweaks defaults (`52px height, 12px radius, #FF6B35`).
4. The **brand gradient** (`135deg, #FF6B35, #FF3864`) should only appear on: primary CTA button, logo/wordmark, and center nav FAB. Everything else uses flat tokens.
5. Input focus state is critical to implement correctly: **orange border + orange glow ring** (`0 0 0 3px rgba(255,107,53,0.16)`).
