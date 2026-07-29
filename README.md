Apple Team ID in app.json under ios.appleTeamId — you skipped this for now; add it whenever you have it (Xcode → Signing & Capabilities, or developer.apple.com → Membership). Builds will warn/fail without it.

# Scenes / Voice check-in

Say it out loud. Part of the FeralUI Scenes set: calm wellness screens where the data is drawn as nature. Live demo: https://feralui.dev/#/scenes

## For AI assistants

You are implementing this screen in the user's codebase. Rules:

1. The code below is complete, working, typechecked source, not pseudocode or an excerpt. If the user's stack is React, use it verbatim: save the TSX and CSS as files exactly as given. Do not rewrite, reformat, simplify or "improve" them.
2. The reference is React 19 + motion v12 (`motion/react`, the framer-motion API). If the user's stack differs, port it faithfully: keep every animation duration, easing, spring config, layer order and z-index exactly as written. For SwiftUI or Jetpack Compose, use the value mappings in "Porting to native" below.
3. Keep the `--sc-*` CSS custom property contract. Retheme by overriding tokens on a wrapper element, never by editing color values inline.
4. The component fills its parent. Mount it inside a fixed-size, overflow-hidden container (see Host container) or a full-screen mobile viewport.
5. The `playKey` prop replays the entrance animation whenever its value changes. Pass a constant if replays are not needed. Callback props (`onNext` and friends) are optional flow hooks.
6. Ask the user which framework, styling setup and directory conventions they use before writing files, unless the codebase already makes that clear.

## Design intent

Say it out loud. A WebGL cloud orb listens: layered, domain-warped noise drifts inside the sphere like cloud cover catching the light, and the microphone level is the wind, so speaking quickens the drift, deepens the warp and blooms the light. Nothing is recorded; the level only drives shader uniforms. Without mic access the orb day-dreams through a speech-like demo envelope, and without WebGL a CSS gradient orb stands in.

## Porting to native (SwiftUI, Jetpack Compose)

The reference is web code, but the design values transfer directly:

- Units: the screen is designed on a 390 x 844 grid, which is the iPhone point grid. Every px value below is a SwiftUI point (or Compose dp) verbatim.
- Typography: the font stack starts at `-apple-system`, so on iOS the type is SF Pro with no substitution. Use Inter on Android.
- Springs: `{ type: 'spring', duration: D, bounce: B }` has the same semantics as SwiftUI `.spring(duration: D, bounce: B)`. In Compose use `spring(dampingRatio = 1 - B)`.
- Eases: `cubic-bezier(a, b, c, d)` maps to SwiftUI `Animation.timingCurve(a, b, c, d, duration:)` and Compose `CubicBezierEasing(a, b, c, d)`. Stagger by adding per-item `.delay`.
- Glass: elements with the `glass` class are liquid-glass surfaces. Do not port the SVG displacement technique; use the platform material instead: SwiftUI `.background(.ultraThinMaterial)` or `.glassEffect()` on iOS 26+, a blur/haze layer in Compose. Same design intent, native implementation.
- CSS keyframes map to SwiftUI `keyframeAnimator`/`PhaseAnimator` and Compose `rememberInfiniteTransition`. Gradient-filled text maps to `foregroundStyle(LinearGradient(...))`.
- Assets are plain webp/svg: drop them into the asset catalog as-is.

## Dependencies

- react ^19
- motion ^12 (imported as `motion/react`)
- Fonts (Inter):

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,400..900&display=swap" rel="stylesheet" />
```

## Theming

This is one of the nature scenes: its palette is part of its identity and it intentionally does not retheme with the brand palette. Any `--sc-*` tokens below fall back to their built-in values.

## Code

### VoiceScreen.tsx

```tsx
// Voice check-in scene, sliced from FeralUI Scenes (https://feralui.dev/#/scenes).
// Generated file: regenerate with scripts/gen-scene-packs.cjs, do not hand-edit.

import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { AnimatePresence, animate, motion, useReducedMotion } from 'motion/react'

const SOFT_EASE = [0.22, 1, 0.3, 1] as const

// SF-style filled chevron shared by every next/skip button in the scenes
const NEXT_CHEVRON_D = 'M9.7 4.6a1.35 1.35 0 0 1 1.9 0l6.5 6.44a1.35 1.35 0 0 1 0 1.92L11.6 19.4a1.35 1.35 0 1 1-1.9-1.92L15.2 12 9.7 6.52a1.35 1.35 0 0 1 0-1.92Z'

// ---- Liquid glass, per aave.com/design/building-glass-for-the-web: every
// .glass surface gets a displacement map GENERATED FROM ITS OWN SHAPE — the
// red/green channels encode how far to push each backdrop pixel horizontally/
// vertically, neutral grey (#808000: R=G=128) means "don't touch", and the
// ramps only live in a thin bezel inside the rim. feDisplacementMap then
// refracts the live backdrop through that map, so the background bends at the
// edge exactly like light through the thick rim of a lens. ----

// Chromium supports SVG filter references inside backdrop-filter; Safari does
// not, so it falls back to plain blur via the --lg custom-property default.
const LG_SUPPORTED = typeof CSS !== 'undefined' && CSS.supports('backdrop-filter', 'url(#lg)')

// The map, computed per-pixel from the shape's signed distance field (the
// "small PNG built on the fly from the glass's shape and size"):
//   direction = the SDF's outward normal, so corners refract radially around
//   the corner arc instead of smearing diagonally;
//   magnitude = a circular lens profile 1-sqrt(1-t²) — zero across the flat
//   interior, rising steeply only in the last few px before the rim, exactly
//   like the sagitta of a convex lens edge;
//   sign = samples pull TOWARD the centre (Chromium clamps the backdrop at the
//   border box, so outward sampling just smears the clamped edge row).
function lgMap(w: number, h: number, r: number, bezel: number) {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  const ctx = c.getContext('2d')!
  const img = ctx.createImageData(w, h)
  const data = img.data
  const cx = w / 2
  const cy = h / 2
  const ax = cx - r // half-extents of the straight core between the corner arcs
  const ay = cy - r
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const mx = x + 0.5 - cx
      const my = y + 0.5 - cy
      const qx = Math.abs(mx) - ax
      const qy = Math.abs(my) - ay
      const ox = Math.max(qx, 0)
      const oy = Math.max(qy, 0)
      // signed distance to the rounded-rect edge (negative inside)
      const d = Math.min(Math.max(qx, qy), 0) + Math.hypot(ox, oy) - r
      const t = Math.min(1, Math.max(0, 1 + d / bezel))
      const p = 1 - Math.sqrt(1 - t * t)
      // outward normal of the SDF, un-mirrored from the abs() fold
      let nx = 0
      let ny = 0
      if (p > 0) {
        if (ox > 0 || oy > 0) {
          const l = Math.hypot(ox, oy) || 1
          nx = ox / l
          ny = oy / l
        } else if (qx > qy) nx = 1
        else ny = 1
        if (mx < 0) nx = -nx
        if (my < 0) ny = -ny
      }
      const i = (y * w + x) * 4
      data[i] = Math.round(128 - nx * 127 * p)
      data[i + 1] = Math.round(128 - ny * 127 * p)
      data[i + 2] = 0
      data[i + 3] = 255
    }
  }
  ctx.putImageData(img, 0, 0)
  return c.toDataURL()
}

// Watches every .glass element under `hostRef`, builds one filter per surface
// (sized to its real box + border-radius, rebuilt on resize), and points the
// element's backdrop-filter at it via the --lg custom property.
export function useLiquidGlass(hostRef: { current: HTMLElement | null }) {
  useEffect(() => {
    const host = hostRef.current
    if (!LG_SUPPORTED || !host) return
    const NS = 'http://www.w3.org/2000/svg'
    const defs = document.createElementNS(NS, 'svg')
    defs.setAttribute('class', 'lg-defs')
    defs.setAttribute('aria-hidden', 'true')
    host.appendChild(defs)

    let seq = 0
    type Rec = { img: SVGElement; disp: SVGElement; f: SVGElement; w: number; h: number }
    const filters = new Map<HTMLElement, Rec>()

    const update = (el: HTMLElement) => {
      const w = el.offsetWidth
      const h = el.offsetHeight
      if (!w || !h) return
      let rec = filters.get(el)
      if (!rec) {
        const id = `lg-${++seq}`
        const f = document.createElementNS(NS, 'filter')
        f.setAttribute('id', id)
        // sRGB: channel maths must see 128 as the exact midpoint, or the whole
        // backdrop shears sideways
        f.setAttribute('color-interpolation-filters', 'sRGB')
        const img = document.createElementNS(NS, 'feImage')
        img.setAttribute('result', 'map')
        const disp = document.createElementNS(NS, 'feDisplacementMap')
        disp.setAttribute('in', 'SourceGraphic')
        disp.setAttribute('in2', 'map')
        disp.setAttribute('xChannelSelector', 'R')
        disp.setAttribute('yChannelSelector', 'G')
        f.appendChild(img)
        f.appendChild(disp)
        defs.appendChild(f)
        rec = { img, disp, f, w: 0, h: 0 }
        filters.set(el, rec)
        // displacement first, then the iOS material: soft blur, a whisper of
        // saturation, a slight lift — real materials lighten the backdrop,
        // they never amplify its colour
        el.style.setProperty('--lg', `url(#${id}) blur(3px) saturate(1.08) brightness(1.05)`)
      }
      if (rec.w === w && rec.h === h) return
      rec.w = w
      rec.h = h
      // resolve the CSS radius against the real box (handles the 50% circles)
      const raw = getComputedStyle(el).borderTopLeftRadius
      const r = Math.min(raw.endsWith('%') ? (parseFloat(raw) / 100) * Math.min(w, h) : parseFloat(raw) || 0, w / 2, h / 2)
      const bezel = Math.max(5, Math.min(14, Math.min(w, h) * 0.18))
      rec.img.setAttribute('href', lgMap(w, h, r, bezel))
      rec.img.setAttribute('x', '0')
      rec.img.setAttribute('y', '0')
      rec.img.setAttribute('width', String(w))
      rec.img.setAttribute('height', String(h))
      rec.disp.setAttribute('scale', String(Math.round(bezel * 2.5)))
    }

    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) update(entry.target as HTMLElement)
    })
    const scan = () => {
      const live = new Set(Array.from(host.querySelectorAll<HTMLElement>('.glass')))
      live.forEach((el) => {
        if (!filters.has(el)) {
          update(el)
          ro.observe(el)
        }
      })
      filters.forEach((rec, el) => {
        if (!live.has(el)) {
          ro.unobserve(el)
          rec.f.remove()
          filters.delete(el)
        }
      })
    }
    scan()
    // screens mount/unmount as tabs swap — pick up fresh .glass surfaces
    const mo = new MutationObserver(scan)
    mo.observe(host, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] })
    return () => {
      mo.disconnect()
      ro.disconnect()
      defs.remove()
    }
  }, [hostRef])
}

// ---- Voice check-in: the dusk screen. A WebGL cloud orb listens — layered,
// domain-warped noise drifts inside the sphere like cloud cover catching the
// light, and the MICROPHONE LEVEL is the wind: speaking quickens the drift,
// deepens the warp and blooms the light, so your voice literally stirs the
// weather. Nothing is recorded; the level only drives uniforms. Mic denied →
// a speech-like demo envelope; no WebGL → a CSS gradient orb underneath. ----
const VO_VERT = `attribute vec2 p;
varying vec2 v_uv;
void main() {
  v_uv = p * 0.5 + 0.5;
  v_uv.y = 1.0 - v_uv.y;
  gl_Position = vec4(p, 0.0, 1.0);
}`

// The orb is built as layered WAVES, not puffs: three horizon-like bands rise
// through the sphere, each displaced by curl noise + warped fbm + a watercolor
// texture, and the bands blend the four palette colors with linear burn. The
// classic 3D Perlin (cnoise) is the standard Ashima implementation.
const VO_PREAMBLE = `precision highp float;
varying vec2 v_uv;
uniform vec2 u_res;
uniform float u_time;
uniform float u_state;
uniform float u_level;
uniform float u_wind;
uniform float u_punch;
uniform sampler2D u_noise;
uniform vec3 u_main;
uniform vec3 u_low;
uniform vec3 u_mid;
uniform vec3 u_high;

const float E = 2.71828182846;

float scaled(float e0, float e1, float x) { return clamp((x - e0) / (e1 - e0), 0.0, 1.0); }
float fixedSpring(float t, float d) {
  float s = mix(1.0 - exp(-E * 2.0 * t) * cos((1.0 - d) * 115.0 * t), 1.0, clamp(t, 0.0, 1.0));
  return s * (1.0 - t) + t;
}
vec3 linearBurn(vec3 base, vec3 blend, float opacity) {
  return (max(base + blend - vec3(1.0), vec3(0.0))) * opacity + base * (1.0 - opacity);
}

vec4 permute(vec4 x) { return mod((x * 34.0 + 1.0) * x, 289.0); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
vec3 fade(vec3 t) { return t * t * t * (t * (t * 6.0 - 15.0) + 10.0); }
float rand(vec2 n) { return fract(sin(dot(n, vec2(12.9898, 4.1414))) * 43758.5453); }

float noise(vec2 p) {
  vec2 ip = floor(p);
  vec2 u = fract(p);
  u = u * u * (3.0 - 2.0 * u);
  float res = mix(
    mix(rand(ip), rand(ip + vec2(1.0, 0.0)), u.x),
    mix(rand(ip + vec2(0.0, 1.0)), rand(ip + vec2(1.0, 1.0)), u.x),
    u.y
  );
  return res * res;
}

float fbm(vec2 x) {
  float v = 0.0;
  float a = 0.5;
  vec2 shift = vec2(100.0);
  mat2 rot = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.5));
  for (int i = 0; i < 4; i++) {
    v += a * noise(x);
    x = rot * x * 2.0 + shift;
    a *= 0.5;
  }
  return v;
}

float cnoise(vec3 P) {
  vec3 Pi0 = floor(P); vec3 Pi1 = Pi0 + vec3(1.0);
  Pi0 = mod(Pi0, 289.0); Pi1 = mod(Pi1, 289.0);
  vec3 Pf0 = fract(P); vec3 Pf1 = Pf0 - vec3(1.0);
  vec4 ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x);
  vec4 iy = vec4(Pi0.yy, Pi1.yy);
  vec4 iz0 = vec4(Pi0.z); vec4 iz1 = vec4(Pi1.z);
  vec4 ixy = permute(permute(ix) + iy);
  vec4 ixy0 = permute(ixy + iz0); vec4 ixy1 = permute(ixy + iz1);
  vec4 gx0 = ixy0 / 7.0; vec4 gy0 = fract(floor(gx0) / 7.0) - 0.5;
  gx0 = fract(gx0);
  vec4 gz0 = vec4(0.5) - abs(gx0) - abs(gy0);
  vec4 sz0 = step(gz0, vec4(0.0));
  gx0 -= sz0 * (step(vec4(0.0), gx0) - 0.5);
  gy0 -= sz0 * (step(vec4(0.0), gy0) - 0.5);
  vec4 gx1 = ixy1 / 7.0; vec4 gy1 = fract(floor(gx1) / 7.0) - 0.5;
  gx1 = fract(gx1);
  vec4 gz1 = vec4(0.5) - abs(gx1) - abs(gy1);
  vec4 sz1 = step(gz1, vec4(0.0));
  gx1 -= sz1 * (step(vec4(0.0), gx1) - 0.5);
  gy1 -= sz1 * (step(vec4(0.0), gy1) - 0.5);
  vec3 g000 = vec3(gx0.x, gy0.x, gz0.x); vec3 g100 = vec3(gx0.y, gy0.y, gz0.y);
  vec3 g010 = vec3(gx0.z, gy0.z, gz0.z); vec3 g110 = vec3(gx0.w, gy0.w, gz0.w);
  vec3 g001 = vec3(gx1.x, gy1.x, gz1.x); vec3 g101 = vec3(gx1.y, gy1.y, gz1.y);
  vec3 g011 = vec3(gx1.z, gy1.z, gz1.z); vec3 g111 = vec3(gx1.w, gy1.w, gz1.w);
  vec4 norm0 = taylorInvSqrt(vec4(dot(g000, g000), dot(g010, g010), dot(g100, g100), dot(g110, g110)));
  g000 *= norm0.x; g010 *= norm0.y; g100 *= norm0.z; g110 *= norm0.w;
  vec4 norm1 = taylorInvSqrt(vec4(dot(g001, g001), dot(g011, g011), dot(g101, g101), dot(g111, g111)));
  g001 *= norm1.x; g011 *= norm1.y; g101 *= norm1.z; g111 *= norm1.w;
  float n000 = dot(g000, Pf0); float n100 = dot(g100, vec3(Pf1.x, Pf0.yz));
  float n010 = dot(g010, vec3(Pf0.x, Pf1.y, Pf0.z)); float n110 = dot(g110, vec3(Pf1.xy, Pf0.z));
  float n001 = dot(g001, vec3(Pf0.xy, Pf1.z)); float n101 = dot(g101, vec3(Pf1.x, Pf0.y, Pf1.z));
  float n011 = dot(g011, vec3(Pf0.x, Pf1.yz)); float n111 = dot(g111, Pf1);
  vec3 fade_xyz = fade(Pf0);
  vec4 n_z = mix(vec4(n000, n100, n010, n110), vec4(n001, n101, n011, n111), fade_xyz.z);
  vec2 n_yz = mix(n_z.xy, n_z.zw, fade_xyz.y);
  float n_xyz = mix(n_yz.x, n_yz.y, fade_xyz.x);
  return 2.2 * n_xyz;
}
`

// Style 2 (Waves): a side-view sea, sum-of-sines height field. Style 1
// (Clouds): the earlier flowing-noise look. Both share the helper preamble.
const VO_FRAG_WAVE = VO_PREAMBLE + `

// Gerstner-style crest: sharpen a sine so crests are pointy and troughs flat.
// s in [-1,1] mapped to [0,1] then pow(sharp) => pointy crests, flat troughs.
// The pow base is (sin*0.5+0.5), guaranteed in [0,1], so it can never go
// negative and produce a NaN.
float crestWave(float x, float k, float w, float t, float ph, float sharp) {
  float s = sin(x * k - t * w + ph);
  float u = s * 0.5 + 0.5;
  return pow(u, sharp);
}

// Full FRONT surface height field h(x,t): three sharpened traveling swells at
// distinct wavelength / speed / phase, each recentred around 0 (crest*2-1) so
// troughs dip below the waterline. Depends ONLY on x and time (never y), so the
// surface stays a coherent height field and can never churn into fog. Factored
// so the main sample and the slope-neighbour sample reuse identical math.
float surfaceHeight(float x, float t) {
  float w0 = (crestWave(x, 2.3, 0.55, t, 0.0, 2.4) * 2.0 - 1.0) * 0.075;
  float w1 = (crestWave(x, 4.7, 0.90, t, 1.7, 2.0) * 2.0 - 1.0) * 0.045;
  float w2 = (crestWave(x, 9.1, 1.35, t, 4.0, 1.7) * 2.0 - 1.0) * 0.022;
  return w0 + w1 + w2;
}

// BACK parallax swell: a separate, longer-wavelength, slower height field for a
// silhouette layer behind the front sea. Also x,t only. Distinct wavenumbers /
// speeds / phases from the front so the two layers never lock together, giving
// parallax depth.
float backHeight(float x, float t) {
  float b0 = (crestWave(x, 1.7, 0.38, t, 2.1, 2.6) * 2.0 - 1.0) * 0.070;
  float b1 = (crestWave(x, 3.3, 0.66, t, 5.2, 2.1) * 2.0 - 1.0) * 0.038;
  return b0 + b1;
}

// Ridge-folded value noise for BROKEN, streaky foam tops. Folding (1-|n|) turns
// blobs into crest LINES. Used ONLY as texture INSIDE the thin foam band, never
// on the surface silhouette or the interior water fill.
float ridgeTex(vec2 p) {
  float n = noise(p) * 2.0 - 1.0;
  return 1.0 - abs(n);
}

void main() {
  vec2 st = v_uv - 0.5;
  st.y *= u_res.y / u_res.x;

  // springy entry: the orb swells into place when the screen mounts
  float entry = fixedSpring(scaled(0.0, 2.0, u_state), 0.92);
  float radius = 0.46 * mix(0.9, 1.0, entry);

  // st is screen-space, y DOWN: +st.y is toward the BOTTOM of the orb (deep
  // water), -st.y is toward the TOP (air / light). x runs left..right so crests
  // travel horizontally.
  float x = st.x / radius;      // ~[-1,1] across the orb
  float yPix = st.y / radius;   // ~[-1,1], + is down / deep

  float t = u_time;

  // WATERLINE: the sea fills a bit over half the orb at rest, leaving open orb
  // above so the waves read as a band, not a filled tank. Sustained speech
  // (u_wind) floods it further UP (baseline y decreases) — but only modestly:
  // the sky above the sea must ALWAYS survive, or the orb reads as a blue disc.
  float yBase = -0.12 - u_wind * 0.16;

  // voice: the crests LEAP with each syllable. u_punch is the fast envelope
  // (45ms attack / 220ms release), so wave amplitude tracks the words being
  // said — calm near-swell in silence, sharp excited crests while talking —
  // instead of rolling at one fixed height forever. u_level (the slow glide)
  // only pads the base so a long sentence keeps the sea a little lifted.
  float amp = 0.62 + u_level * 0.3 + u_punch * 0.95;
  float surge = (u_level * 0.025 + u_punch * 0.06) * sin(x * 5.0 - t * 3.2);

  // organic break-up sampled on (x,t) ONLY (never on y) so the surface stays a
  // height field and never churns into fog.
  float jitter = (fbm(vec2(x * 2.6 + t * 0.25, t * 0.35)) - 0.5) * 0.05;

  // ---- FRONT surface height field + neighbour-column slope for foam gating --
  float height = surfaceHeight(x, t);
  float hL = surfaceHeight(x - 0.03, t);
  float slope = abs(height - hL) * 40.0;

  float surface = yBase - (height + surge + jitter) * amp;

  // SOFT CEILING: crests compress hard past the upper third (y = -0.58) so the
  // sea can climb excitedly but can NEVER flood the orb — however loud, the
  // overshoot is squashed to a quarter, which also flattens shout-crests in a
  // pleasing squashed-against-glass way.
  float ceilY = -0.58;
  float overF = surface - ceilY;
  surface = ceilY + mix(overF * 0.25, overF, step(0.0, overF));

  // ---- BACK parallax swell: a darker silhouette behind the front sea. Its
  // waterline sits slightly LOWER in the orb (larger y) and it travels slower,
  // so the two crest lines slide past each other for depth. x,t only.
  float backSurge = u_level * 0.04 * sin(x * 3.5 - t * 2.1);
  float backSurf = (yBase + 0.10) - (backHeight(x, t) + backSurge) * amp;
  float overB = backSurf - (ceilY + 0.08);
  backSurf = (ceilY + 0.08) + mix(overB * 0.25, overB, step(0.0, overB));

  // ---- DEPTHS below each surface (y-down => deeper when yPix > surface) ----
  float depth = yPix - surface;
  float aa = 1.5 / radius * 0.012 + 0.006;
  float water = smoothstep(-aa, aa, depth);

  float backDepth = yPix - backSurf;
  float backWater = smoothstep(-aa, aa, backDepth);

  // ---- SUBSURFACE volume for the FRONT sea: surface = u_mid near the top,
  // fading down toward deep u_low via linearBurn so deep water stays a COLOR.
  float deepK = smoothstep(0.0, 0.62, depth);
  vec3 body = mix(u_mid, u_main, smoothstep(0.0, 0.16, depth));
  body = linearBurn(body, u_low, deepK * 0.85);

  // gentle vertical light: the top of the water body catches more light
  float lightGrad = smoothstep(0.55, -0.35, yPix);
  body = mix(body, mix(body, u_mid, 0.4), lightGrad * 0.5);

  // BACK body: a deeper, dimmer tone so it reads as a swell further away.
  vec3 backBody = linearBurn(u_main, u_low, 0.55);

  // air above the (front) waterline: a soft light wash of the surface tone
  vec3 air = mix(u_mid, u_high, 0.35);
  air = mix(air, u_mid, smoothstep(0.0, 0.6, -depth) * 0.5);

  // ---- PAINT back -> front: air, then the distant swell, then the front sea.
  vec3 col = air;
  col = mix(col, backBody, backWater);

  // thin foam lip hugging the BACK crest line (kept quiet, it is far away)
  float backLip = smoothstep(0.05, 0.0, abs(backDepth)) * backWater;
  float backCrestHigh = smoothstep(0.02, 0.075, backHeight(x, t));
  col = mix(col, u_high, backLip * backCrestHigh * 0.28);

  // front sea on top
  col = mix(col, body, water);

  // ---- FOAM: thin soft whitecaps gated TWICE — only just below the surface
  // AND only where the crest is high or the slope is steep. Never a full wash.
  float nearSurf = smoothstep(0.075, 0.0, abs(depth)) * water;
  float crestHigh = smoothstep(0.02, 0.09, height);
  float steep = smoothstep(0.25, 0.85, slope);
  float foamAmt = nearSurf * max(crestHigh, steep);

  // BROKEN foam tops: ridge-folded noise streaks the whitecaps so they are not
  // a smooth smear. Confined ENTIRELY to the foam band (foamAmt), never the
  // surface silhouette or the interior fill.
  float ridge = ridgeTex(vec2(x * 6.0 - t * 0.8, t * 0.6));
  float foamTex = 0.55 + 0.45 * ridge;
  float foam = foamAmt * foamTex * (0.45 + u_level * 0.35 + u_punch * 0.6);
  col = mix(col, u_high, clamp(foam, 0.0, 0.85));

  // a whisper of specular sparkle on the very crest line while speaking
  col = mix(col, u_high, nearSurf * crestHigh * u_level * 0.15);

  // ---- Apple-glass finish: a soft top light plus a voice-lit inner glow and
  // a hairline rim, so the sea sits INSIDE one polished sphere ----
  float rr = length(st) / radius;
  float topLight = smoothstep(0.95, 0.1, rr) * smoothstep(0.05, 0.8, -st.y / radius);
  col = mix(col, u_high, topLight * (0.04 + u_level * 0.06));
  col = mix(col, u_high, smoothstep(1.0, 0.2, rr) * u_level * 0.05);
  float rim = smoothstep(0.78, 0.975, rr);
  col = mix(col, u_high, rim * (0.05 + u_level * 0.08));

  float dist = length(st) - radius;
  float shape = smoothstep(0.0075, 0.0, dist);
  gl_FragColor = vec4(col * shape, shape);
}
`

const VO_FRAG_CLOUD = VO_PREAMBLE + `

void main() {
  vec2 st = v_uv - 0.5;
  st.y *= u_res.y / u_res.x;

  // springy entry: the orb swells into place when the screen mounts
  float entry = fixedSpring(scaled(0.0, 2.0, u_state), 0.92);
  float entryScale = mix(0.9, 1.0, entry);
  float radius = 0.46 * entryScale;                    // mask: fills the orb

  // reference cloud feature scale (their baseRadius 0.37), decoupled from the
  // mask so the cloud looks exactly like the reference while filling our orb
  float scaleFactor = 1.0 / (2.0 * 0.37 * entryScale);
  vec2 uv = st * scaleFactor + 0.5;
  uv.y = 1.0 - uv.y;

  // ---- VOICE: all GLOBAL parameters, so the ONE coherent cloud reacts as a
  // whole (blue + white move in unison, never as two fighting layers) --------
  float condense = clamp(u_level * 1.0 + u_wind * 0.6, 0.0, 1.0);
  // GATHER: the whole field draws together with sound, spreads apart in silence
  uv = (uv - 0.5) * mix(1.05, 0.95, condense) + 0.5;

  // drift = MOSTLY the voice-driven phase clock: at idle the cloud barely
  // creeps (a whisper of wall-clock keeps it from ever freezing dead), and
  // speech stirs the SAME billowing faster — never a different motion, never
  // lateral slosh (a voice-keyed sway read as "the cloud goes anywhere").
  // u_time only ever accelerates, so the cloud can never scrub backwards.
  float time = u_state * 0.15 + u_time * 0.7;

  float noiseScale = 1.25;
  float windSpeed = 0.12 + u_level * 0.05;              // flow stirs a touch with the voice
  float warpPower = 0.35;
  float waterColorNoiseScale = 18.0;
  float waterColorNoiseStrength = 0.02;
  float textureNoiseStrength = 0.15;
  // waveSpread grows the cloud's BODY (more, richer white) with the voice — so
  // speaking makes the cloud fuller, never thinner. Gains kept modest: the
  // sky above the cloud must survive even sustained speech, or the orb
  // saturates into a flat white-blue disc.
  float waveSpread = 1.0 + u_level * 0.2 + u_wind * 0.14;
  // amplitudes stay at the reference values so the cloud keeps its full body
  float layer1Amplitude = 1.5;
  float layer2Amplitude = 1.4;
  float layer3Amplitude = 1.3;
  // REFERENCE-EXACT texture: the clean layer separation of the original comes
  // from these values — do not "sharpen" them (tighter blur + punched fbm
  // churned the structure into smears when speaking). Voice may only BREATHE
  // through fbmStrength via the slow glided level, never the fast punch.
  float fbmStrength = 1.2 + u_level * 0.1;
  float fbmPowerDamping = 0.55;
  float blurRadius = 1.0;

  // verticalOffset LIFTS the cloud UP with the voice (excitement rises). Kept
  // DECOUPLED from waveSpread so it can grow AND rise together — but SATURATING:
  // the lift eases toward a hard cap (~0.19) instead of stacking level + wind
  // linearly (the old 0.09+0.34 max shoved the cloud's featureless underbelly
  // over the whole orb, which read as a flat blue ball).
  float lift = u_level * 0.6 + u_wind * 0.55;
  float verticalOffset = 0.075 + 0.115 * (lift / (lift + 0.65));

  float noiseX = cnoise(vec3(uv + vec2(0.0, 74.8572), time * 0.3));
  float noiseY = cnoise(vec3(uv + vec2(203.91282, 10.0), time * 0.3));
  uv += vec2(noiseX * 2.0, noiseY) * warpPower;

  float noiseA = cnoise(vec3(uv * waterColorNoiseScale + vec2(344.91282, 0.0), time * 0.3)) +
                 cnoise(vec3(uv * waterColorNoiseScale * 2.2 + vec2(723.937, 0.0), time * 0.4)) * 0.5;
  uv += noiseA * waterColorNoiseStrength;
  uv.y -= verticalOffset;

  float dispMix = (sin(time) + 1.0) * 0.5;
  vec2 textureUv = uv;
  float tR0 = texture2D(u_noise, textureUv).r;
  float tG0 = texture2D(u_noise, vec2(textureUv.x, 1.0 - textureUv.y)).g;
  float disp0 = mix(tR0 - 0.5, tG0 - 0.5, dispMix) * textureNoiseStrength;

  textureUv += vec2(63.861, 368.937);
  float tR1 = texture2D(u_noise, textureUv).r;
  float tG1 = texture2D(u_noise, vec2(textureUv.x, 1.0 - textureUv.y)).g;
  float disp1 = mix(tR1 - 0.5, tG1 - 0.5, dispMix) * textureNoiseStrength;

  textureUv += vec2(453.163, 1649.808);
  float tR3 = texture2D(u_noise, textureUv).r;
  float tG3 = texture2D(u_noise, vec2(textureUv.x, 1.0 - textureUv.y)).g;
  float disp3 = mix(tR3 - 0.5, tG3 - 0.5, dispMix) * textureNoiseStrength;
  uv += disp0;

  vec2 st_fbm = uv * noiseScale;
  vec2 q = vec2(fbm(st_fbm * 0.5 + windSpeed * time));
  vec2 r = vec2(
    fbm(st_fbm + q + vec2(0.3, 9.2) + 0.15 * time),
    fbm(st_fbm + q + vec2(8.3, 0.8) + 0.126 * time)
  );
  float f = fbm(st_fbm + r - q);
  float fullFbm = (f + 0.6 * f * f + 0.7 * f + 0.5) * 0.5;
  fullFbm = pow(fullFbm, fbmPowerDamping);
  fullFbm *= fbmStrength;

  blurRadius = blurRadius * 1.5;

  vec2 snUv = uv + vec2((fullFbm - 0.5) * 1.2) + vec2(0.0, 0.025) + disp0;
  float sn = noise(snUv * 2.0 + vec2(0.0, time * 0.5)) * 2.0 * layer1Amplitude;
  float sn2 = smoothstep(sn - 1.2 * blurRadius, sn + 1.2 * blurRadius, (snUv.y - 0.5 * waveSpread) * 5.0 + 0.5);

  vec2 snUvBis = uv + vec2((fullFbm - 0.5) * 0.85) + vec2(0.0, 0.025) + disp1;
  float snBis = noise(snUvBis * 4.0 + vec2(293.0, time * 1.0)) * 2.0 * layer2Amplitude;
  float sn2Bis = smoothstep(snBis - 0.9 * blurRadius, snBis + 0.9 * blurRadius, (snUvBis.y - 0.6 * waveSpread) * 5.0 + 0.5);

  vec2 snUvThird = uv + vec2((fullFbm - 0.5) * 1.1) + disp3;
  float snThird = noise(snUvThird * 6.0 + vec2(153.0, time * 1.2)) * 2.0 * layer3Amplitude;
  float sn2Third = smoothstep(snThird - 0.7 * blurRadius, snThird + 0.7 * blurRadius, (snUvThird.y - 0.9 * waveSpread) * 6.0 + 0.5);

  sn2 = pow(sn2, 0.8);
  sn2Bis = pow(sn2Bis, 0.9);

  // reference coloring: linear-burn blend of the four palette tones on ONE field
  vec3 col = linearBurn(u_main, u_low, 1.0 - sn2);
  col = linearBurn(col, mix(u_main, u_mid, 1.0 - sn2Bis), sn2);
  col = mix(col, mix(u_main, u_high, 1.0 - sn2Third), sn2 * sn2Bis);
  // syllable shimmer: the whites breathe brighter WITH the words (gentle — the
  // cloud must stay one coherent field, never strobe)
  col = mix(col, u_high, u_level * 0.04 + u_punch * 0.05);

  // ---- Apple-glass finish (matches the wave style): soft top light, a
  // voice-lit inner glow, and a hairline rim — one polished sphere ----
  float rr = length(st) / radius;
  float topLight = smoothstep(0.95, 0.1, rr) * smoothstep(0.05, 0.8, -st.y / radius);
  col = mix(col, u_high, topLight * (0.04 + u_level * 0.06));
  col = mix(col, u_high, smoothstep(1.0, 0.2, rr) * u_level * 0.05);
  float rim = smoothstep(0.78, 0.975, rr);
  col = mix(col, u_high, rim * (0.05 + u_level * 0.08));

  float dist = length(st) - radius;
  float shape = smoothstep(0.0075, 0.0, dist);
  gl_FragColor = vec4(col * shape, shape);
}
`

// watercolor noise texture, generated instead of shipped: layered value noise
// (random grids upscaled with bilinear smoothing) — R and G are independent
// channels because the shader crossfades between them
function voNoiseTexture(gl: WebGLRenderingContext) {
  const size = 256
  const out = document.createElement('canvas')
  out.width = out.height = size
  const ctx = out.getContext('2d')
  if (!ctx) return null
  ctx.fillStyle = '#808080'
  ctx.fillRect(0, 0, size, size)
  ctx.imageSmoothingEnabled = true
  // watercolor = big soft blotches only: low-frequency grids, no fine grain
  for (const cell of [4, 8, 16]) {
    const layer = document.createElement('canvas')
    layer.width = layer.height = cell
    const lctx = layer.getContext('2d')
    if (!lctx) return null
    const img = lctx.createImageData(cell, cell)
    for (let i = 0; i < img.data.length; i += 4) {
      img.data[i] = Math.random() * 255
      img.data[i + 1] = Math.random() * 255
      img.data[i + 2] = Math.random() * 255
      img.data[i + 3] = 255
    }
    lctx.putImageData(img, 0, 0)
    ctx.globalAlpha = cell === 4 ? 0.6 : cell === 8 ? 0.32 : 0.16
    ctx.drawImage(layer, 0, 0, size, size)
  }
  ctx.globalAlpha = 1
  // two soften passes (downscale and back) melt any remaining hard texels
  const half = document.createElement('canvas')
  half.width = half.height = size / 4
  const hctx = half.getContext('2d')
  if (hctx) {
    hctx.imageSmoothingEnabled = true
    for (let i = 0; i < 2; i++) {
      hctx.clearRect(0, 0, half.width, half.height)
      hctx.drawImage(out, 0, 0, half.width, half.height)
      ctx.clearRect(0, 0, size, size)
      ctx.drawImage(half, 0, 0, size, size)
    }
  }
  const tex = gl.createTexture()
  gl.bindTexture(gl.TEXTURE_2D, tex)
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, out)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
  return tex
}

type VoUniforms = {
  uRes: WebGLUniformLocation | null
  uTime: WebGLUniformLocation | null
  uState: WebGLUniformLocation | null
  uLevel: WebGLUniformLocation | null
  uWind: WebGLUniformLocation | null
  uPunch: WebGLUniformLocation | null
  uMain: WebGLUniformLocation | null
  uLow: WebGLUniformLocation | null
  uMid: WebGLUniformLocation | null
  uHigh: WebGLUniformLocation | null
}

type VoProgram = { prog: WebGLProgram; u: VoUniforms }

// compile one fragment shader into a program sharing VO_VERT; attribute 'p' is
// forced to location 0 so a single vertexAttribPointer serves every program.
// Deliberately NO status queries here: getShaderParameter/getProgramParameter
// force a synchronous wait for the driver, and the cloud program is heavy
// enough to visibly hitch whatever animation is running when the orb mounts.
// voFinish checks status once the link has actually completed.
function voCompile(gl: WebGLRenderingContext, frag: string): WebGLProgram | null {
  const prog = gl.createProgram()
  if (!prog) return null
  for (const [type, src] of [
    [gl.VERTEX_SHADER, VO_VERT],
    [gl.FRAGMENT_SHADER, frag],
  ] as const) {
    const sh = gl.createShader(type)
    if (!sh) return null
    gl.shaderSource(sh, src)
    gl.compileShader(sh)
    gl.attachShader(prog, sh)
  }
  gl.bindAttribLocation(prog, 0, 'p')
  gl.linkProgram(prog)
  return prog
}

function voFinish(gl: WebGLRenderingContext, prog: WebGLProgram): VoProgram | null {
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    console.warn('[voice-orb] program link failed:', gl.getProgramInfoLog(prog))
    return null
  }
  const loc = (n: string) => gl.getUniformLocation(prog, n)
  return {
    prog,
    u: {
      uRes: loc('u_res'), uTime: loc('u_time'), uState: loc('u_state'),
      uLevel: loc('u_level'), uWind: loc('u_wind'), uPunch: loc('u_punch'),
      uMain: loc('u_main'), uLow: loc('u_low'), uMid: loc('u_mid'), uHigh: loc('u_high'),
    },
  }
}

type VoPending = { gl: WebGLRenderingContext; wave: WebGLProgram; cloud: WebGLProgram }

type VoPainter = { gl: WebGLRenderingContext; wave: VoProgram; cloud: VoProgram }

// stage 1: context + kick off BOTH orb styles compiling (wave + cloud, so the
// toggle switches instantly). Returns before the driver finishes — voLink
// completes setup once the programs are actually ready.
function voSetup(canvas: HTMLCanvasElement): VoPending | null {
  const attrs = { alpha: true, antialias: true, premultipliedAlpha: true }
  // probe every context flavour: some browsers/extensions block or lack one
  // name but expose another (our GLSL ES 1.0 shaders run on WebGL2 unchanged)
  const gl = (canvas.getContext('webgl', attrs) ||
    canvas.getContext('webgl2', attrs) ||
    canvas.getContext('experimental-webgl', attrs)) as WebGLRenderingContext | null
  if (!gl) {
    console.warn('[voice-orb] WebGL context unavailable (blocked or unsupported) — CSS fallback')
    return null
  }
  const wave = voCompile(gl, VO_FRAG_WAVE)
  const cloud = voCompile(gl, VO_FRAG_CLOUD)
  if (!wave || !cloud) return null
  return { gl, wave, cloud }
}

// stage 2: verify the links, then build the shared geometry + noise texture
function voLink({ gl, wave, cloud }: VoPending): VoPainter | null {
  const waveP = voFinish(gl, wave)
  const cloudP = voFinish(gl, cloud)
  if (!waveP || !cloudP) return null
  // one oversized triangle covers the viewport (fewer verts than a quad)
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer())
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
  gl.enableVertexAttribArray(0)
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0)
  const tex = voNoiseTexture(gl)
  if (!tex) return null
  gl.activeTexture(gl.TEXTURE0)
  gl.bindTexture(gl.TEXTURE_2D, tex)
  for (const painter of [waveP, cloudP]) {
    gl.useProgram(painter.prog)
    gl.uniform1i(gl.getUniformLocation(painter.prog, 'u_noise'), 0)
  }
  return { gl, wave: waveP, cloud: cloudP }
}

// Orb color themes in the four-layer language. Every set is authored for the
// linear-burn math: the deep tone you see is main+low-1, so all inputs stay
// bright and the deeps land rich instead of clipping to black.
type VoTone = { id: string; label: string; swatch: [string, string]; main: [number, number, number]; low: [number, number, number]; mid: [number, number, number]; high: [number, number, number] }

const VO_TONES: VoTone[] = [
  { id: 'sky', label: 'Sky', swatch: ['#b3d9ff', '#1a73e5'], main: [0.7, 0.85, 1.0], low: [0.4, 0.6, 0.9], mid: [0.5, 0.7, 1.0], high: [0.9, 0.95, 1.0] },
  { id: 'mint', label: 'Mint', swatch: ['#a9ecd9', '#12a680'], main: [0.62, 0.9, 0.82], low: [0.45, 0.75, 0.72], mid: [0.55, 0.85, 0.8], high: [0.88, 0.98, 0.95] },
  { id: 'sunset', label: 'Sunset', swatch: ['#ffd2b0', '#e05a2b'], main: [1.0, 0.78, 0.62], low: [0.85, 0.52, 0.48], mid: [1.0, 0.7, 0.55], high: [1.0, 0.93, 0.85] },
  { id: 'gold', label: 'Gold', swatch: ['#ffe6a3', '#d99114'], main: [1.0, 0.87, 0.55], low: [0.75, 0.62, 0.42], mid: [1.0, 0.8, 0.5], high: [1.0, 0.96, 0.85] },
  { id: 'orchid', label: 'Orchid', swatch: ['#dcc4ff', '#8a4fe0'], main: [0.82, 0.7, 1.0], low: [0.58, 0.48, 0.78], mid: [0.88, 0.76, 1.0], high: [0.96, 0.92, 1.0] },
]

export function VoiceScreen({
  playKey,
  onNext,
  tone: toneProp,
  style: styleProp,
  onTone,
  onStyle,
}: {
  playKey: string | number
  onNext?: () => void
  // controlled color + style: when a host drives these (e.g. controls placed
  // outside the phone), the screen hides its own pickers and stays clean.
  tone?: string
  style?: 'wave' | 'cloud'
  onTone?: (t: string) => void
  onStyle?: (s: 'wave' | 'cloud') => void
}) {
  const soft = SOFT_EASE
  const reduce = useReducedMotion()
  const [mode, setMode] = useState<'idle' | 'live' | 'demo'>('idle')
  const [toneState, setToneState] = useState('sky')
  const [styleState, setStyleState] = useState<'wave' | 'cloud'>('cloud')
  const external = onTone != null || onStyle != null
  const tone = toneProp ?? toneState
  const style = styleProp ?? styleState
  const setTone = onTone ?? setToneState
  const setStyle = onStyle ?? setStyleState
  const [glOk, setGlOk] = useState(true)
  const modeRef = useRef(mode)
  modeRef.current = mode
  const activeTone = VO_TONES.find((t) => t.id === tone) ?? VO_TONES[0]
  const toneRef = useRef(activeTone)
  toneRef.current = activeTone
  const styleRef = useRef(style)
  styleRef.current = style
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const audioRef = useRef<{ ctx: AudioContext; stream: MediaStream; an: AnalyserNode; data: Uint8Array<ArrayBuffer> } | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    // ---- resilient WebGL lifecycle: the CSS ball is a LAST resort, never a
    // sticky state. Setup failures RETRY (hot-reload churn, driver hiccups,
    // too-many-contexts pressure), and a lost WebGL context rebuilds itself
    // the moment the browser restores it. ----
    let painter: VoPainter | null = null
    let raf = 0
    let retryTimer = 0
    let disposed = false
    const fit = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1)
      const s = Math.max(1, Math.round(canvas.clientWidth * dpr))
      canvas.width = s
      canvas.height = s
    }
    const ro = new ResizeObserver(fit)
    ro.observe(canvas)
    // interpretable speech signals, not one noisy envelope:
    //   fast      — syllables (loudness, compressed): a shout spikes it hard
    //   sustain   — speech energy over seconds: continuous talk = steady swell
    //   pitchF    — brightness via zero-crossing rate: low voice = slow waves
    //   attention — eases in when asked to listen: the orb PERKS UP before
    //               any words arrive and stays visibly awake through pauses
    //   kick      — a one-shot acknowledging swell at speech ONSET
    let fast = 0
    let sustain = 0
    let pitchF = 0.45
    let attention = 0
    let speaking = false
    let kick = 0
    let wind = 0 // heavy: drives warp + drift inertia
    let punch = 0 // FAST syllable envelope: 45ms attack / 220ms release — this
    // is what makes the waves visibly leap WITH the words; the glided level
    // below is deliberately too slow for that (it guards size + waterline)
    let levelS = 0 // displayed level: a critically damped glide over the envelope
    let levelV = 0 // ...and its velocity, so motion never reverses abruptly
    let phase = 0 // integrated drift: voice ACCELERATES the waves, never scrubs them
    let state = 0 // wall-clock since mount, drives the springy entry
    let last = performance.now()
    const frame = (now: number) => {
      if (!painter) return // context lost: the restore handler reboots us
      const { gl, wave, cloud } = painter
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      const t = now / 1000
      state += dt
      attention += ((modeRef.current === 'idle' ? 0 : 1) - attention) * 0.05
      // organic breath: two incommensurate sines never quite repeat, so the
      // idle never reads as a loop; an attentive orb sits higher and
      // breathes a little quicker, like a listener leaning in
      const breath =
        0.04 +
        attention * 0.06 +
        0.028 * Math.sin(t * (1.2 + attention * 0.5)) +
        0.016 * Math.sin(t * 0.53 + 1.7)
      let voice = 0
      let bright = 0.4
      const a = audioRef.current
      if (modeRef.current === 'live' && a) {
        a.an.getByteTimeDomainData(a.data)
        let sum = 0
        let crossings = 0
        for (let i = 0; i < a.data.length; i++) {
          const v = (a.data[i] - 128) / 128
          sum += v * v
          if (i > 0 && (a.data[i] - 128) * (a.data[i - 1] - 128) < 0) crossings++
        }
        const rms = Math.sqrt(sum / a.data.length)
        // perceptual compression: quiet speech clearly registers, shouts max out
        voice = Math.min(1, Math.pow(rms * 4.5, 0.7))
        bright = Math.min(1, (crossings / a.data.length) * 6)
        // speech onset, with hysteresis so it can't chatter: the first sound
        // after a silence gets one quick acknowledging swell
        if (!speaking && voice > 0.18) {
          speaking = true
          kick = 0.35
        } else if (speaking && voice < 0.07) {
          speaking = false
        }
      } else if (modeRef.current === 'demo') {
        // demo speech at REAL conversation energy (peaks ~0.8): this is the
        // showcase for anyone without a mic, so it must stir the orb like a
        // genuine voice, not a whisper
        const syl = Math.abs(Math.sin(Math.floor(t * 6.7) * 78.233))
        voice = 0.08 + syl * 0.72 * (0.55 + 0.45 * Math.sin(t * 2.2))
        bright = 0.45
      }
      kick *= Math.exp(-dt / 0.16)
      // syllable punch: raw voice (43ms RMS window keeps it stable), snappy
      // attack, musical release — spikes and falls WITH each word
      const punchTarget = Math.min(1, voice * 1.15 + kick)
      punch += (punchTarget - punch) * (1 - Math.exp(-dt / (punchTarget > punch ? 0.045 : 0.22)))
      const loud = Math.min(1, Math.max(breath, voice) + kick)
      // envelope follower, framerate-independent: moderate attack so the orb
      // still answers the voice, SLOW release so continuous speech reads as one
      // sustained swell instead of pulsing with every syllable
      fast += (loud - fast) * (1 - Math.exp(-dt / (loud > fast ? 0.12 : 0.5)))
      sustain += (loud - sustain) * (1 - Math.exp(-dt / (loud > sustain ? 0.7 : 2.0)))
      const target = Math.min(1, fast * 0.45 + sustain * 0.7)
      // critically damped glide on top: the displayed level can never snap or
      // reverse direction frame-to-frame, which is what read as flicker
      const omega = 7
      levelV += (omega * omega * (target - levelS) - 2 * omega * levelV) * dt
      levelS += levelV * dt
      const level = Math.min(1, Math.max(0, levelS))
      pitchF += (bright - pitchF) * (1 - Math.exp(-dt / 0.25))
      wind += (level - wind) * (1 - Math.exp(-dt / 0.35))
      // drift clock: NEAR-STILL at idle (base 0.18 — a barely-breathing scene),
      // clearly alive while speaking (sustained talk ~5-6x faster, syllables
      // nudge it further). Both shaders key their motion to this, so the
      // idle/speaking contrast is the core of the effect. Pitch still tilts
      // it: deep voice = heavy slow roll, bright voice = quick.
      phase += dt * (0.18 + wind * 1.15 + punch * 0.45) * (0.65 + pitchF * 0.55)
      // draw with the selected style's program (both compiled up front)
      const painterNow = styleRef.current === 'cloud' ? cloud : wave
      const u = painterNow.u
      gl.useProgram(painterNow.prog)
      gl.viewport(0, 0, canvas.width, canvas.height)
      gl.uniform2f(u.uRes, canvas.width, canvas.height)
      gl.uniform1f(u.uTime, reduce ? 20 : phase)
      gl.uniform1f(u.uState, reduce ? 10 : state)
      gl.uniform1f(u.uLevel, reduce ? 0.05 : level)
      gl.uniform1f(u.uWind, reduce ? 0.05 : wind)
      gl.uniform1f(u.uPunch, reduce ? 0.05 : punch)
      const tn = toneRef.current
      gl.uniform3f(u.uMain, tn.main[0], tn.main[1], tn.main[2])
      gl.uniform3f(u.uLow, tn.low[0], tn.low[1], tn.low[2])
      gl.uniform3f(u.uMid, tn.mid[0], tn.mid[1], tn.mid[2])
      gl.uniform3f(u.uHigh, tn.high[0], tn.high[1], tn.high[2])
      gl.drawArrays(gl.TRIANGLES, 0, 3)
      // live-interaction silhouette (the GPT-orb tell): a real sustained swell
      // with the voice (up to ~3.5% via the glided level — can never flicker)
      // plus a small per-syllable pulse riding the punch envelope (45ms/220ms,
      // so it breathes WITH the words rather than strobing). Idle keeps only
      // the faint sine breath.
      canvas.style.transform = `scale(${(1 + 0.008 * Math.sin(t * 1.4) + level * 0.035 + punch * 0.018).toFixed(4)})`
      if (!reduce) raf = requestAnimationFrame(frame)
    }
    // boot with retries: a transient failure (mid-hot-reload module state, a
    // driver hiccup, context churn) gets three more chances over ~1.5s before
    // the CSS ball is allowed to take over. A device with no WebGL at all
    // simply exhausts the retries and lands on the fallback as designed.
    const boot = (attempt: number) => {
      if (disposed) return
      const fail = () => {
        if (attempt < 3) {
          retryTimer = window.setTimeout(() => boot(attempt + 1), 250 * (attempt + 1))
          return
        }
        canvas.style.display = 'none'
        setGlOk(false) // the CSS gradient orb takes over ONLY now, never as a rim
      }
      const pending = voSetup(canvas)
      if (!pending) return fail()
      const start = () => {
        if (disposed) return
        painter = voLink(pending)
        if (!painter) return fail()
        // undo any earlier fallback: setup succeeded, so the real orb renders
        canvas.style.display = ''
        setGlOk(true)
        fit()
        cancelAnimationFrame(raf)
        last = performance.now()
        raf = requestAnimationFrame(frame)
      }
      // where the driver can compile in the background, poll readiness instead
      // of blocking the main thread — mounting the orb must never hitch an
      // animation already in flight (the scenes picker spring, page swaps)
      const par = pending.gl.getExtension('KHR_parallel_shader_compile')
      if (!par) return start()
      const poll = () => {
        if (disposed) return
        const done =
          pending.gl.getProgramParameter(pending.wave, par.COMPLETION_STATUS_KHR) &&
          pending.gl.getProgramParameter(pending.cloud, par.COMPLETION_STATUS_KHR)
        if (done) start()
        else raf = requestAnimationFrame(poll)
      }
      raf = requestAnimationFrame(poll)
    }
    // a lost WebGL context (GPU reset, tab pressure, driver update) is NOT the
    // end: preventDefault tells the browser we want it back, and the restored
    // event rebuilds programs/buffers/texture on the revived context. The
    // motion signals live outside boot, so the orb resumes mid-breath.
    const onLost = (e: Event) => {
      e.preventDefault()
      painter = null
      cancelAnimationFrame(raf)
      clearTimeout(retryTimer)
    }
    const onRestored = () => boot(0)
    canvas.addEventListener('webglcontextlost', onLost)
    canvas.addEventListener('webglcontextrestored', onRestored)
    boot(0)
    return () => {
      disposed = true
      clearTimeout(retryTimer)
      cancelAnimationFrame(raf)
      ro.disconnect()
      canvas.removeEventListener('webglcontextlost', onLost)
      canvas.removeEventListener('webglcontextrestored', onRestored)
    }
  }, [reduce])

  const stopMic = () => {
    const a = audioRef.current
    if (a) {
      a.stream.getTracks().forEach((tr) => tr.stop())
      a.ctx.close().catch(() => {})
      audioRef.current = null
    }
  }
  useEffect(() => stopMic, [])

  const toggle = async () => {
    if (mode !== 'idle') {
      stopMic()
      setMode('idle')
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const ctx = new AudioContext()
      const an = ctx.createAnalyser()
      an.fftSize = 2048
      ctx.createMediaStreamSource(stream).connect(an)
      audioRef.current = { ctx, stream, an, data: new Uint8Array(an.fftSize) }
      setMode('live')
    } catch {
      setMode('demo') // no mic: the orb day-dreams so the scene still shows itself
    }
  }

  return (
    <div key={String(playKey)} className="vo">
      <motion.div className="vo-bg" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.7, ease: soft }} aria-hidden="true" />
      <motion.button
        type="button"
        className="mo-next vo-skip glass"
        aria-label="Next"
        onClick={onNext}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5, duration: 0.45, ease: soft }}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d={NEXT_CHEVRON_D} fill="#e6dff8" />
        </svg>
      </motion.button>
      <motion.h3 className="vo-title" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16, duration: 0.55, ease: soft }}>
        Say it out loud.
      </motion.h3>
      <motion.p className="vo-sub" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.26, duration: 0.5, ease: soft }}>
        A minute of talking beats an hour of circling.
      </motion.p>
      <motion.div
        className="vo-stage"
        initial={{ opacity: 0, scale: 0.7 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3, duration: 0.9, ease: [0.34, 1.2, 0.5, 1] }}
      >
        <button type="button" className="vo-orb" onClick={toggle} aria-pressed={mode !== 'idle'} aria-label={mode === 'idle' ? 'Start talking' : 'Stop listening'}>
          {!glOk && <span className="vo-fallback" aria-hidden="true" />}
          <canvas className="vo-canvas" ref={canvasRef} aria-hidden="true" />
        </button>
      </motion.div>
      {/* style + color controls, only when the screen owns them; a host can
          place them outside the phone instead (see `external`) */}
      {!external && (
        <motion.div className="vo-seg" role="group" aria-label="Orb style" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.5, ease: soft }}>
          {(['cloud', 'wave'] as const).map((s) => (
            <button
              key={s}
              type="button"
              className={style === s ? 'vo-seg-btn is-active' : 'vo-seg-btn'}
              aria-pressed={style === s}
              onClick={() => setStyle(s)}
            >
              {style === s && (
                <motion.span
                  className="vo-seg-thumb"
                  layoutId="vo-seg-thumb"
                  transition={reduce ? { duration: 0 } : { type: 'spring', duration: 0.4, bounce: 0.18 }}
                  style={{ borderRadius: 999 }}
                  aria-hidden="true"
                />
              )}
              <span className="vo-seg-label">{s === 'wave' ? 'Waves' : 'Clouds'}</span>
            </button>
          ))}
        </motion.div>
      )}
      {!external && (
        <motion.div className="vo-tones" role="group" aria-label="Orb color" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.44, duration: 0.5, ease: soft }}>
          {VO_TONES.map((tn) => (
            <button
              key={tn.id}
              type="button"
              className={tone === tn.id ? 'vo-tone is-active' : 'vo-tone'}
              aria-pressed={tone === tn.id}
              aria-label={tn.label}
              title={tn.label}
              style={{ background: `linear-gradient(135deg, ${tn.swatch[0]}, ${tn.swatch[1]})`, '--sw': tn.swatch[1] } as CSSProperties}
              onClick={() => setTone(tn.id)}
            />
          ))}
        </motion.div>
      )}
      {/* the pill MORPHS between states: layout spring resizes the capsule as
          the text changes, and the mic dot springs in and out of the row */}
      <motion.div
        className="vo-status"
        layout
        style={{ borderRadius: 999 }}
        aria-live="polite"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ opacity: { delay: 0.5, duration: 0.5 }, layout: { type: 'spring', duration: 0.45, bounce: 0.18 } }}
      >
        <AnimatePresence mode="popLayout" initial={false}>
          {mode === 'live' && (
            <motion.span
              key="dot"
              className="vo-live"
              layout
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0, transition: { duration: 0.14, ease: 'easeIn' } }}
              transition={{ type: 'spring', duration: 0.4, bounce: 0.4 }}
              aria-hidden="true"
            />
          )}
        </AnimatePresence>
        {/* content is SUBORDINATE to the container: old text exits fast, the
            pill spring starts resizing, then the new text fades in slightly
            late so it lands inside a capsule that already fits it */}
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={mode}
            layout="position"
            initial={{ opacity: 0, y: 6, filter: 'blur(3px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -6, filter: 'blur(3px)', transition: { duration: 0.14, ease: 'easeIn' } }}
            transition={{ delay: 0.08, duration: 0.22, ease: 'easeOut' }}
          >
            {mode === 'live' ? 'Listening…' : mode === 'demo' ? 'Mic unavailable' : 'Tap the orb to talk'}
          </motion.span>
        </AnimatePresence>
      </motion.div>
      <motion.p className="vo-note" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.62, duration: 0.5 }}>
        Nothing is recorded. Your voice only moves the light.
      </motion.p>
    </div>
  )
}
```

### voice.css

```css
/* ---- Liquid glass material (aave.com/design/building-glass-for-the-web):
   each .glass surface gets its OWN displacement map, generated at runtime from
   its real box + border-radius (see useLiquidGlass). The map's R/G channels
   push backdrop pixels near the rim, so the background refracts through the
   edge like a lens; the interior stays neutral and clear. The element's own
   translucent background acts as the tint; --lg carries the per-element filter
   and falls back to plain blur where url() backdrop-filters are unsupported. */
.lg-defs {
  position: absolute;
  width: 0;
  height: 0;
  overflow: hidden;
}

.glass {
  position: relative;
  isolation: isolate;
}
.glass::before {
  content: '';
  position: absolute;
  inset: 0;
  z-index: -1;
  border-radius: inherit;
  /* keep saturate LOW: backdrop sampling is suspended during ancestor opacity
     animations, so a strong saturate makes the glass visibly "fill in" when the
     entrance finishes. A subtle boost keeps that switch imperceptible. */
  -webkit-backdrop-filter: var(--lg, blur(3px) saturate(1.08));
  backdrop-filter: var(--lg, blur(3px) saturate(1.08));
}
/* specular rim: the bright catch-light along the top-left edge of the glass */
.glass::after {
  content: '';
  position: absolute;
  inset: 0;
  z-index: 1;
  border-radius: inherit;
  pointer-events: none;
  box-shadow:
    inset 1.5px 1.5px 1px -1px rgba(255, 255, 255, 0.85),
    inset -1.5px -1.5px 1px -1px rgba(255, 255, 255, 0.45),
    inset 0 0 0 1px rgba(255, 255, 255, 0.28);
}

/* ---- Voice check-in (dusk screen: the cloud orb that listens) ---- */
.vo {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
  background: #17112e;
  color: #efeafb;
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Inter', 'Segoe UI', sans-serif;
  user-select: none;
  -webkit-user-select: none;
}

/* a clean dark field, nothing else: the orb is the only light on screen */
.vo-bg {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, #141319 0%, #101014 60%, #0d0c10 100%);
}

/* the GPT-proportion orb (below) frees vertical room: the type steps up to
   own it — larger title, roomier subtitle — so the screen stays full */
.vo-title {
  position: relative;
  z-index: 1;
  margin: 84px 0 0;
  font-size: 1.72rem;
  font-weight: 750;
  line-height: 1.12;
  letter-spacing: -0.022em;
  text-align: center;
}

.vo-sub {
  position: relative;
  z-index: 1;
  margin: 9px 0 0;
  padding: 0 30px;
  font-size: 0.9rem;
  font-weight: 500;
  line-height: 1.4;
  color: rgba(226, 222, 240, 0.64);
  text-align: center;
}

.vo-stage {
  position: relative;
  z-index: 1;
  flex: 1;
  min-height: 0;
  display: grid;
  place-items: center;
}

.vo-orb {
  appearance: none;
  border: 0;
  margin: 0;
  padding: 0;
  position: relative;
  /* ChatGPT voice-mode proportion: ~53% of the frame width, not a wall of orb */
  width: 182px;
  height: 182px;
  border-radius: 50%;
  background: transparent;
  /* nothing around the sphere: no glow, no ring, no halo — just the orb */
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition: scale 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.vo-orb:active {
  scale: 0.96;
}

/* no-WebGL stand-in: a still cloud orb painted in CSS under the canvas */
.vo-fallback {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background:
    radial-gradient(circle at 34% 26%, rgba(244, 238, 255, 0.9) 0%, transparent 34%),
    radial-gradient(circle at 68% 72%, rgba(64, 36, 128, 0.85) 0%, transparent 58%),
    radial-gradient(circle at 40% 32%, #b18ae6 0%, #7a52c4 55%, #3f2482 100%);
  box-shadow: inset -10px -18px 42px rgba(24, 12, 58, 0.55);
}

.vo-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  border-radius: 50%;
}

/* Voice controls placed OUTSIDE the phone (demo chrome): stacked toggle + tones
   centered above the iPhone, so the screen itself stays clean */
.vo-chrome {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  margin: 2px 0 14px;
}
.vo-chrome .vo-seg,
.vo-chrome .vo-tones {
  margin-bottom: 0;
}

/* orb style toggle: a minimal 2-segment control with a sliding thumb */
.vo-seg {
  position: relative;
  z-index: 1;
  display: inline-flex;
  padding: 3px;
  margin-bottom: 14px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.06);
}
.vo-seg-btn {
  appearance: none;
  position: relative;
  border: 0;
  margin: 0;
  padding: 6px 16px;
  border-radius: 999px;
  background: transparent;
  color: rgba(236, 235, 242, 0.55);
  font: inherit;
  font-size: 0.78rem;
  font-weight: 650;
  cursor: pointer;
  transition: color 0.2s ease;
  -webkit-tap-highlight-color: transparent;
}
.vo-seg-btn.is-active {
  color: #17112e;
}
.vo-seg-thumb {
  position: absolute;
  inset: 0;
  z-index: 0;
  border-radius: 999px;
  background: #ecebf2;
}
.vo-seg-label {
  position: relative;
  z-index: 1;
}

/* orb color swatches: a bare row of iOS color wells, no chrome around them;
   selection = a detached white ring */
.vo-tones {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 18px;
}
.vo-tone {
  appearance: none;
  border: 0;
  margin: 0;
  padding: 0;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  cursor: pointer;
  box-shadow:
    inset 0 1px 1px rgba(255, 255, 255, 0.45),
    0 2px 6px -2px rgba(0, 0, 0, 0.6);
  outline: 2px solid transparent;
  outline-offset: 2.5px;
  transition:
    scale 0.24s cubic-bezier(0.34, 1.56, 0.64, 1),
    outline-color 0.22s ease;
  -webkit-tap-highlight-color: transparent;
}
.vo-tone:hover {
  scale: 1.12;
  outline-color: rgba(255, 255, 255, 0.25);
}
.vo-tone:active {
  scale: 0.92;
}
.vo-tone.is-active {
  scale: 1.06;
  /* iOS color-well selection: a detached ring in the tone's own deep stop,
     so it reads as "this color is on" in either theme */
  outline-color: var(--sw, rgba(255, 255, 255, 0.7));
}

/* status: one quiet capsule that MORPHS with its content (framer layout owns
   the resize; radius is set inline so the spring corrects it per frame) */
.vo-status {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 6px;
  min-height: 24px;
  padding: 10px 18px;
  background: rgba(255, 255, 255, 0.055);
  font-size: 0.9rem;
  font-weight: 600;
  color: #ecebf2;
  /* the capsule clips its content: text can never poke out mid-morph */
  overflow: hidden;
  white-space: nowrap;
}
.vo-status span {
  display: inline-block;
}
/* the mic dot, iOS-flat: one solid orange circle, no gradient, no glow —
   a single quiet ripple is the only sign of life */
.vo-live {
  position: relative;
  flex: none;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #ff9f0a;
}
/* ring pinned center-to-center with the dot: top/left 50% + negative margin
   places a dot-sized box exactly over the dot, so scale() (origin center) can
   ONLY radiate outward from the dot's centre — never off to one side */
.vo-live::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  /* border-box so the 1px border counts INSIDE 7px — otherwise the border
     grows the box to 9px and the -3.5px margin leaves the ring 1px off-centre */
  box-sizing: border-box;
  width: 7px;
  height: 7px;
  margin: -3.5px 0 0 -3.5px;
  border-radius: 50%;
  border: 1px solid rgba(255, 159, 10, 0.4);
  transform-origin: center;
  animation: vo-live-ping 2s cubic-bezier(0.2, 0.7, 0.3, 1) infinite;
}
@keyframes vo-live-ping {
  0% {
    transform: scale(1);
    opacity: 0.6;
  }
  70%,
  100% {
    transform: scale(3);
    opacity: 0;
  }
}
@media (prefers-reduced-motion: reduce) {
  .vo-live::after {
    animation: none;
    opacity: 0;
  }
}

/* the note reads as the pill's OWN subtext: tight under the capsule, one
   grouped unit at the bottom of the screen */
.vo-note {
  position: relative;
  z-index: 1;
  margin: 9px 0 36px;
  font-size: 0.7rem;
  font-weight: 550;
  color: rgba(218, 212, 236, 0.46);
}

/* the shared chevron chip reads too dark on the dusk field: lift its frost */
.vo-skip {
  background: rgba(255, 255, 255, 0.1);
}

/* ---- shared rules reused from other screens ---- */
.mo-next {
  position: absolute;
  z-index: 2;
  top: 58px;
  right: 16px;
  width: 36px;
  height: 36px;
  border: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.42);
  display: grid;
  place-items: center;
  cursor: pointer;
  box-shadow: 0 4px 14px -6px rgba(30, 30, 40, 0.3);
  -webkit-tap-highlight-color: transparent;
  transition: scale 0.24s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.mo-next:active {
  scale: 0.88;
}

.mo-next svg {
  width: 17px;
  height: 17px;
  /* the chevron path is right-heavy in its viewBox (bbox centre ~13.7 of 24),
     so pull it back left to optically centre it in the circle */
  translate: -0.8px 0;
}
```

### Host container

```css
/* A fixed-size mobile viewport to mount the scene in. Any container with
   position: relative, a fixed size and overflow: hidden works the same. */
.scene-host {
  position: relative;
  width: 390px;
  height: 844px;
  border-radius: 44px;
  overflow: hidden;
  background: #101014;
  box-shadow: 0 30px 80px -24px rgba(0, 0, 0, 0.35);
}
```

## Usage

```tsx
import { useRef } from 'react'
import { VoiceScreen, useLiquidGlass } from './VoiceScreen'
import './voice.css'

export function Demo() {
  const hostRef = useRef<HTMLDivElement | null>(null)
  useLiquidGlass(hostRef) // builds the glass displacement filters for .glass surfaces
  return (
    <div ref={hostRef} className="scene-host">
      <VoiceScreen playKey={0} />
    </div>
  )
}
```
