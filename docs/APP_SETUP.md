# Vybe — App Setup & Architecture

## 1. Project Overview

Vybe is a mono-repo with two sub-projects:

```
vybe/
  client/      — Expo (React Native) app, SDK 54, expo-router v6
  server/      — FastAPI + PostgreSQL (psycopg2 raw SQL)
  design/      — Design reference JSX + README (source of truth for all screens)
  docs/        — This file
```

---

## 2. Running the Project

### Prerequisites
- Node 20+, Python 3.11+, Docker (for Postgres)
- A Cloudflare R2 bucket + Twilio Verify Service

### Server

```bash
cd server
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate

pip install -r requirements.txt

# Copy and fill env vars
cp .env.example .env

# Run migration
alembic upgrade head

# Start API
uvicorn main:app --reload --port 8000
```

**Server `.env` keys:**
```
DATABASE_URL=postgresql://user:pass@localhost:5432/vybe
SECRET_KEY=<random 64-char hex>
ALGORITHM=HS256

TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_VERIFY_SERVICE_SID=VA...

R2_ENDPOINT_URL=https://<account>.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=vybe-media
R2_PUBLIC_URL=https://media.vybe.in
```

### Client

```bash
cd client
npm install

# Start with cache clear
npx expo start --clear
```

**Client env** — set in `app.json` → `expo.extra`, accessed via:
```ts
import Constants from 'expo-constants'
const API_URL = Constants.expoConfig?.extra?.apiUrl
```

`app.json` extra block:
```json
{
  "extra": {
    "apiUrl": "http://localhost:8000"
  }
}
```

> Never use `process.env` inside the Expo bundle — it won't be available at runtime.

---

## 3. Client Architecture

### Folder structure

```
client/
  src/
    app/                       ← expo-router file-based routes
      _layout.tsx              ← root: font guard, SplashScreen, AuthGuard
      (auth)/
        _layout.tsx
        index.tsx              ← Splash (2.2s auto-advance)
        welcome.tsx
        phone.tsx
        otp.tsx
        age-gate.tsx
      (onboarding)/
        _layout.tsx
        profile.tsx            ← Step 1/5
        photos.tsx             ← Step 2/5
        voice.tsx              ← Step 3/5
        interests.tsx          ← Step 4/5
        location.tsx           ← Step 5/5
        complete.tsx           ← Confetti + 4s auto-advance
      (tabs)/
        _layout.tsx            ← Bottom nav (5 tabs)
        index.tsx              ← Home (Phase 2)
        explore.tsx
        create.tsx
        notifications.tsx
        profile.tsx
    components/
      ui/                      ← Shared components (index.ts re-exports all)
    constants/                 ← Design tokens (Colors, FontFamily, Spacing, etc.)
    store/                     ← Zustand stores (auth.ts, onboarding.ts)
    api/                       ← Axios layer (config.ts, auth.ts, user.ts)
    hooks/                     ← useAuth.ts, useCountdown.ts
    lib/
      fonts.ts                 ← useVybeFonts() — loads Cabinet Grotesk + Satoshi
  assets/fonts/                ← .otf font files
  global.css                   ← Tailwind @tailwind directives
  tailwind.config.js           ← Design tokens as Tailwind utilities
  metro.config.js              ← withNativeWind
  babel.config.js              ← NativeWind babel preset
```

### Auth guard logic (`_layout.tsx`)

```
Not authenticated  →  /(auth)/           (splash → welcome → phone → OTP)
Authenticated, profile incomplete  →  /(onboarding)/profile
Authenticated, profile complete  →  /(tabs)/
```

---

## 4. Design System

Source of truth: `design/screens/*.jsx` + `design/README.md`.

### Constants location: `src/constants/`

| File | Contents |
|---|---|
| `colors.ts` | `Colors` object — all brand + UI colors |
| `typography.ts` | `FontFamily`, `TextStyles` |
| `spacing.ts` | `Spacing`, `Radius`, `ComponentSize` |
| `gradients.ts` | `BrandGradient`, `PhotoOverlayGradient` |
| `onboarding.ts` | `INTERESTS`, `CITIES` arrays |
| `index.ts` | Re-exports everything |

### Key color tokens

| Token | Value | Usage |
|---|---|---|
| `Colors.background` | `#111111` | Screen background |
| `Colors.surface` | `#1A1A1A` | Cards, bottom sheets |
| `Colors.elevated` | `#222222` | Inputs, chips |
| `Colors.brandOrange` | `#FF6B35` | Primary CTA, selected state |
| `Colors.brandCoral` | `#FF3864` | Gradient end, errors |
| `Colors.inkPrimary` | `#F5F0EB` | Body text |
| `Colors.inkSecondary` | `#A09890` | Subtitles, labels |
| `Colors.divider` | `#2A2A2A` | Borders, separators |

### Brand gradient rule
**Only** use the orange→coral gradient (`BrandGradient`) on:
- Primary CTA buttons
- "VYBE" logo/wordmark
- The center nav FAB

Never apply it to backgrounds, cards, or decorative elements.

---

## 5. Font System

Fonts are loaded in `src/lib/fonts.ts` via `useVybeFonts()` which calls `useFonts()`.

| FontFamily constant | Actual font file | Usage |
|---|---|---|
| `displayExtraBold` | `CabinetGrotesk-Extrabold.otf` | "VYBE" wordmark, hero text |
| `headingBold` | `CabinetGrotesk-Bold.otf` | Screen titles |
| `headingMedium` | `CabinetGrotesk-Medium.otf` | Sub-headings |
| `bodyRegular` | `Satoshi-Regular.otf` | Body text, labels |
| `bodyMedium` | `Satoshi-Medium.otf` | Medium body |
| `bodySemiBold` | `Satoshi-Bold.otf` | Buttons, active labels |

**In StyleSheet:**
```ts
import { FontFamily } from '@/constants'
fontFamily: FontFamily.headingBold
```

**In Tailwind className:**
```tsx
<Text className="font-cabinet-bold text-2xl text-white">
```

Note: `CabinetGrotesk-SemiBold` and `Satoshi-SemiBold` do not exist in `assets/fonts/`. Use Medium/Bold as substitutes.

---

## 6. NativeWind

- Version: 4.x (Tailwind CSS v3)
- Config: `tailwind.config.js` — all design tokens are mapped as Tailwind utilities
- Setup: `babel.config.js` (preset), `metro.config.js` (`withNativeWind`), `global.css` (directives), `nativewind-env.d.ts` (types)

**When to use `className` vs `style`:**
- `className` — for simple layout, color, font-size, font-family, margin/padding (fast iteration)
- `style` (StyleSheet) — for dynamic values (state-driven colors, animated styles, computed sizes), shadows (iOS), and anything that needs precise control

**Known limitations:**
- Animations must use Reanimated (`useAnimatedStyle`) — NativeWind classnames can't animate
- Shadows use `style` (native shadow props), not Tailwind's `shadow-*`
- `expo-linear-gradient` cannot use `className` for colors — use `colors` prop

---

## 7. State Management (Zustand)

Two stores in `src/store/`:

### `auth.ts`
```ts
{ isAuthenticated, userId, accessToken, refreshToken, phone, profileComplete }
// Actions:
setAuth({ userId, accessToken, refreshToken, phone, profileComplete })
setProfileComplete(true)
clearAuth()
```

### `onboarding.ts`
```ts
{ name, dob, gender, photoUris, voiceUri, interests, city, lat, lng }
// Actions:
setField('name', value)
reset()   // call after onboarding completes
```

**Reading in a component:**
```ts
const token = useAuthStore(s => s.accessToken)
const name = useOnboardingStore(s => s.name)
```

---

## 8. API Layer

### `src/api/config.ts`
- Axios instance with `baseURL` from `Constants.expoConfig.extra.apiUrl`
- **Request interceptor:** attaches `Authorization: Bearer <accessToken>`
- **Response interceptor:** on 401 → calls `/auth/refresh` → retries original request → on failure calls `clearAuth()` + redirects to `/(auth)/`

### `src/api/auth.ts`
```ts
sendOTP(phone: string)
verifyOTP(phone: string, code: string) → TokenResponse
refreshToken(token: string) → TokenResponse
logout(refreshToken: string)
```

### `src/api/user.ts`
```ts
createProfile(data: ProfileCreate)
updateProfile(data: ProfileUpdate)
setInterests(tags: string[])
setLocation(city: string, lat: number, lng: number)
getMe() → UserResponse
uploadPhoto(uri: string, position: number) → string  // returns public URL
uploadVoice(uri: string) → string
```

---

## 9. Adding a New Screen

1. Create `src/app/(group)/screen-name.tsx`
2. The filename becomes the route: `/(group)/screen-name`
3. Navigate with `router.push('/(group)/screen-name')`
4. Add `_layout.tsx` to the group if it doesn't exist

**Screen template:**
```tsx
import { View, Text } from 'react-native'
import { router } from 'expo-router'
import { BackButton } from '@/components/ui'
import { Colors } from '@/constants'

export default function MyScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <BackButton onPress={() => router.back()} />
      {/* content */}
    </View>
  )
}
```

---

## 10. Adding a New API Route (Server)

1. Add schema to `server/schemas/`
2. Add route handler to `server/routes/`
3. Mount router in `server/main.py`: `app.include_router(router, prefix="/your-prefix")`
4. Create a migration if schema changes: `alembic revision --autogenerate -m "description"`

**Security rules (mandatory):**
- All SQL: psycopg2 parameterized queries (`%s`) — never f-strings in SQL
- Auth: use `get_current_user` dependency from `server/middleware/auth.py`
- File uploads: validate MIME type + size before accepting

---

## 11. Design References

All screen designs live in `design/screens/`:

| File | Screens |
|---|---|
| `splash-welcome.jsx` | Splash, Welcome |
| `auth-flow.jsx` | Phone, OTP, Age Gate |
| `onboarding-a.jsx` | Profile (Step 1), Photos (Step 2), Voice (Step 3) |
| `onboarding-b.jsx` | Interests (Step 4), Location (Step 5), Complete |
| `shared.jsx` | Shared components: GradBtn, BackBtn, ProgressBar, CityCanvas |

`design/README.md` contains the complete design spec: spacing, color rules, typography, motion specs, component specs.

---

## 12. Env Vars Reference

### Server `.env`
| Key | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `SECRET_KEY` | JWT signing key (64+ hex chars) |
| `ALGORITHM` | `HS256` |
| `TWILIO_ACCOUNT_SID` | Twilio account SID |
| `TWILIO_AUTH_TOKEN` | Twilio auth token |
| `TWILIO_VERIFY_SERVICE_SID` | Twilio Verify Service SID (VA...) |
| `R2_ENDPOINT_URL` | Cloudflare R2 endpoint |
| `R2_ACCESS_KEY_ID` | R2 access key |
| `R2_SECRET_ACCESS_KEY` | R2 secret key |
| `R2_BUCKET_NAME` | R2 bucket name |
| `R2_PUBLIC_URL` | Public base URL for R2 assets |

### Client (`app.json → extra`)
| Key | Description |
|---|---|
| `apiUrl` | Backend base URL (`http://localhost:8000` for dev) |

---

## 13. Phase 1 Verification Checklist

1. `npx expo start --clear` → animated splash plays 2.2s → transitions to Welcome
2. Phone entry: 10-digit input enables CTA, non-10 digit stays disabled
3. OTP: 6 boxes auto-advance, resend countdown 45s, error shake on wrong code
4. Age Gate: "No" → locked screen with no navigation out; "Yes" → profile step 1
5. Profile: name + dob + gender all required before Next enables
6. Photos: tap slot → picker opens; ≥1 photo → Next enables; × removes
7. Voice: record stops at 30s; "Skip for now" always visible
8. Interests: toggle chips; <3 shows counter; ≥3 enables Next
9. Location: "Use location" detects city; search filters list; city selected → Continue
10. Complete: confetti animates, 4s auto-advance to home
11. Kill + reopen → auth persists, goes directly to home (not splash)
12. Server: `POST /auth/send-otp` → Twilio SMS received on real device
13. Under-18 DOB → server returns 400, screen shows error message
14. `alembic upgrade head` → 3 tables + trigger created cleanly
