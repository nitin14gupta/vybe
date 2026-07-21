# Expo SDK 56 — Required Context

Versioned docs: https://docs.expo.dev/versions/v56.0.0/

Read the versioned docs before writing any code that touches Expo APIs.

---

## Stack

- **Expo SDK**: ~56.0.11
- **React Native**: 0.85.3 | **React**: 19.2.3
- **expo-router**: ~56.2.10 (file-based routing, New Architecture enabled)
- **NativeWind**: ^4.2.5 + **Tailwind CSS**: ^3.4.19
- **react-native-reanimated**: ^4.3.1 (v4 — breaking API changes from v3)
- **react-native-worklets**: 0.8.3
- **Zustand**: ^5.0.14

---

## Key Breaking Changes vs SDK 54

### expo-av → REMOVED (SDK 55+)
- **Audio** → use `expo-audio`
- **Video** → use `expo-video`

### expo-audio API (hook-based, NOT class-based)
```ts
import {
  useAudioRecorder, useAudioRecorderState,
  useAudioPlayer, useAudioPlayerStatus,
  AudioModule, RecordingPresets, setAudioModeAsync,
} from 'expo-audio'

// Permissions
await AudioModule.requestRecordingPermissionsAsync()

// Audio mode
await setAudioModeAsync({ playsInSilentMode: true, allowsRecording: true })

// Recording
const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY)
const state = useAudioRecorderState(recorder)
// state.isRecording, state.durationMillis
await recorder.prepareToRecordAsync()
recorder.record()
await recorder.stop()
const uri = recorder.uri  // available after stop()

// Playback
const player = useAudioPlayer(null)        // or { uri: '...' }
const status = useAudioPlayerStatus(player)
// status.playing, status.currentTime, status.duration
player.replace({ uri })
player.play()
player.pause()
player.seekTo(seconds)
```

### react-native-reanimated v4
- `cancelAnimation` is now a function (not a method)
- `withSpring`, `withTiming` etc. same but new config options
- `useAnimatedStyle`, `useSharedValue` same API

### New Architecture (newArchEnabled: true)
- All modules must be New Arch compatible
- Hermes is the only JS engine
- No Expo Go support — dev builds only (`npx expo run:android`)

---

## Project-Specific Rules

1. **Dev builds only** — never reference Expo Go; always `npx expo run:android`
2. **No axios** — use raw `fetch`; API calls go through `src/api/apiService.ts` (static class pattern)
3. **Path aliases**: `@/*` → `src/*` AND `@/src/*` → `src/*` (both work)
4. **Colors**: orange/coral system — `#FF6B35` (brand-orange), `#FF3864` (brand-coral). NOT purple/violet.
5. **Tailwind**: `withNativeWind` in metro.config.js is required; content paths point to `src/`
6. **Private class fields** (`#field`): add `@babel/plugin-transform-class-properties` + `@babel/plugin-transform-private-methods` with `{ loose: true }` to babel.config.js

---

## SDK 56 Docs — All Links

Base: `https://docs.expo.dev/versions/v56.0.0/`

### Config Files
| File | Docs |
|---|---|
| app.json / app.config.js | https://docs.expo.dev/versions/v56.0.0/config/app/ |
| babel.config.js | https://docs.expo.dev/versions/v56.0.0/config/babel/ |
| metro.config.js | https://docs.expo.dev/versions/v56.0.0/config/metro/ |
| package.json | https://docs.expo.dev/versions/v56.0.0/config/package-json/ |

### Expo Router
| Topic | Docs |
|---|---|
| Overview | https://docs.expo.dev/router/introduction/ |
| Link | https://docs.expo.dev/router/navigating-pages/ |
| Stack | https://docs.expo.dev/router/advanced/stack/ |
| Native Tabs | https://docs.expo.dev/router/advanced/tabs/ |
| Expo UI | https://docs.expo.dev/versions/v56.0.0/sdk/ui/ |

### Expo SDK Packages — Used in Gorave
| Package | Docs |
|---|---|
| expo-audio | https://docs.expo.dev/versions/v56.0.0/sdk/audio/ |
| expo-video | https://docs.expo.dev/versions/v56.0.0/sdk/video/ |
| expo-camera | https://docs.expo.dev/versions/v56.0.0/sdk/camera/ |
| expo-constants | https://docs.expo.dev/versions/v56.0.0/sdk/constants/ |
| expo-document-picker | https://docs.expo.dev/versions/v56.0.0/sdk/document-picker/ |
| expo-file-system | https://docs.expo.dev/versions/v56.0.0/sdk/filesystem/ |
| expo-font | https://docs.expo.dev/versions/v56.0.0/sdk/font/ |
| expo-haptics | https://docs.expo.dev/versions/v56.0.0/sdk/haptics/ |
| expo-image | https://docs.expo.dev/versions/v56.0.0/sdk/image/ |
| expo-image-picker | https://docs.expo.dev/versions/v56.0.0/sdk/imagepicker/ |
| expo-linear-gradient | https://docs.expo.dev/versions/v56.0.0/sdk/linear-gradient/ |
| expo-linking | https://docs.expo.dev/versions/v56.0.0/sdk/linking/ |
| expo-location | https://docs.expo.dev/versions/v56.0.0/sdk/location/ |
| expo-media-library | https://docs.expo.dev/versions/v56.0.0/sdk/media-library/ |
| expo-navigation-bar | https://docs.expo.dev/versions/v56.0.0/sdk/navigation-bar/ |
| expo-notifications | https://docs.expo.dev/versions/v56.0.0/sdk/notifications/ |
| expo-secure-store | https://docs.expo.dev/versions/v56.0.0/sdk/securestore/ |
| expo-sharing | https://docs.expo.dev/versions/v56.0.0/sdk/sharing/ |
| expo-splash-screen | https://docs.expo.dev/versions/v56.0.0/sdk/splash-screen/ |
| expo-status-bar | https://docs.expo.dev/versions/v56.0.0/sdk/status-bar/ |
| expo-system-ui | https://docs.expo.dev/versions/v56.0.0/sdk/system-ui/ |
| expo-task-manager | https://docs.expo.dev/versions/v56.0.0/sdk/task-manager/ |
| expo-updates | https://docs.expo.dev/versions/v56.0.0/sdk/updates/ |
| expo-web-browser | https://docs.expo.dev/versions/v56.0.0/sdk/webbrowser/ |

### Third-Party Libraries
| Package | Docs |
|---|---|
| react-native-reanimated | https://docs.swmansion.com/react-native-reanimated/docs/ |
| react-native-gesture-handler | https://docs.swmansion.com/react-native-gesture-handler/docs/ |
| react-native-safe-area-context | https://docs.expo.dev/versions/v56.0.0/sdk/safe-area-context/ |
| react-native-screens | https://docs.expo.dev/versions/v56.0.0/sdk/screens/ |
| react-native-svg | https://docs.expo.dev/versions/v56.0.0/sdk/svg/ |
| @shopify/flash-list | https://docs.expo.dev/versions/v56.0.0/sdk/flash-list/ |
| react-native-maps | https://docs.expo.dev/versions/v56.0.0/sdk/map-view/ |
| nativewind v4 | https://www.nativewind.dev/v4/overview |
