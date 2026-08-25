import React, { useEffect } from 'react'
import { StyleSheet } from 'react-native'
import { Canvas, Fill, Shader, Skia } from '@shopify/react-native-skia'
import Animated, {
  SharedValue,
  useDerivedValue,
  useSharedValue,
  useAnimatedStyle,
  useFrameCallback,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
} from 'react-native-reanimated'

// Opaque pearlescent sphere — full saturated color across the whole body
// (coral/gold highlight top-left sweeping through magenta, violet, blue and
// mint), shaded like a real lit sphere rather than a flat gradient, with a
// glossy specular streak and a soft color-matched glow for the dark canvas.
const compiled = Skia.RuntimeEffect.Make(`
uniform float iTime;
uniform float drift;
uniform float2 iResolution;
uniform float active;
uniform float level;

vec3 hash33(vec3 p3) {
  p3 = fract(p3 * vec3(0.1031, 0.11369, 0.13787));
  p3 += dot(p3, p3.yxz + 19.19);
  return -1.0 + 2.0 * fract(vec3(
    p3.x + p3.y,
    p3.x + p3.z,
    p3.y + p3.z
  ) * p3.zyx);
}

float snoise3(vec3 p) {
  const float K1 = 0.333333333;
  const float K2 = 0.166666667;
  vec3 i = floor(p + (p.x + p.y + p.z) * K1);
  vec3 d0 = p - (i - (i.x + i.y + i.z) * K2);
  vec3 e = step(vec3(0.0), d0 - d0.yzx);
  vec3 i1 = e * (1.0 - e.zxy);
  vec3 i2 = 1.0 - e.zxy * (1.0 - e);
  vec3 d1 = d0 - (i1 - K2);
  vec3 d2 = d0 - (i2 - K1);
  vec3 d3 = d0 - 0.5;
  vec4 h = max(0.6 - vec4(
    dot(d0, d0),
    dot(d1, d1),
    dot(d2, d2),
    dot(d3, d3)
  ), 0.0);
  vec4 n = h * h * h * h * vec4(
    dot(d0, hash33(i)),
    dot(d1, hash33(i + i1)),
    dot(d2, hash33(i + i2)),
    dot(d3, hash33(i + 1.0))
  );
  return dot(vec4(31.316), n);
}

// Pearlescent band palette, sampled along the sphere's lit axis — warm
// coral/gold at the highlight end, through magenta and violet, to blue and
// a whisper of mint at the shadow end. Tuned for a near-black backdrop.
vec3 pearl(float t) {
  t = clamp(t, 0.0, 1.0);
  vec3 gold   = vec3(1.00, 0.82, 0.55);
  vec3 coral  = vec3(1.00, 0.55, 0.62);
  vec3 magenta= vec3(0.92, 0.42, 0.78);
  vec3 violet = vec3(0.58, 0.46, 0.95);
  vec3 blue   = vec3(0.40, 0.62, 0.98);
  vec3 mint   = vec3(0.48, 0.88, 0.86);
  vec3 c = mix(gold, coral, smoothstep(0.0, 0.16, t));
  c = mix(c, magenta, smoothstep(0.12, 0.38, t));
  c = mix(c, violet, smoothstep(0.32, 0.58, t));
  c = mix(c, blue, smoothstep(0.52, 0.80, t));
  c = mix(c, mint, smoothstep(0.76, 1.0, t));
  return c;
}

vec4 main(vec2 fragCoord) {
  vec2 center = iResolution * 0.5;
  float half_ = 0.5 * min(iResolution.x, iResolution.y);
  vec2 uv = (fragCoord - center) / (half_ * 0.86);

  float rr = length(uv);
  float edge = 1.0 - smoothstep(0.975, 1.0, rr);
  if (rr > 1.06) {
    return vec4(0.0);
  }

  // sphere normal (bulging toward the viewer) — gives real shading, not a flat disc
  float z = sqrt(max(0.0, 1.0 - rr * rr));
  vec3 normal = vec3(uv, z);

  // gentle organic wobble to the surface while recording, so it never looks static
  float wob = active * (0.05 + level * 0.10);
  vec3 wn = normalize(normal + wob * vec3(
    snoise3(vec3(uv * 1.6, iTime * 0.6)),
    snoise3(vec3(uv * 1.6 + 4.1, iTime * 0.6)),
    0.0
  ));

  // slow drifting turbulence warps which band of the palette shows where —
  // this is what makes the surface feel alive instead of a static print.
  // drift is accumulated frame-by-frame on the JS side (not derived from
  // iTime times rate here) so the pattern never jumps when the rate changes.
  float swirl = snoise3(vec3(wn.xy * 1.4, drift)) * 0.36;

  // band coordinate: diagonal sweep (top-left highlight -> bottom-right mint),
  // matching a sphere lit from the upper-left
  float band = (0.62 - wn.x * 0.42 - wn.y * 0.58 + swirl);
  vec3 col = pearl(band);

  // lambert-ish shading from the same upper-left light for real volume
  vec3 lightDir = normalize(vec3(-0.55, -0.65, 0.62));
  float diff = max(dot(wn, lightDir), 0.0);
  col *= 0.62 + 0.55 * diff;

  // rim/fresnel darkening at the silhouette edge like real glossy plastic/glass
  float fres = pow(1.0 - max(wn.z, 0.0), 2.2);
  col = mix(col, col * 0.55 + vec3(0.05, 0.04, 0.10), fres * 0.5);

  // big soft specular bloom, upper-left, brightens with voice
  vec2 hp = uv - vec2(-0.38, -0.44);
  float hl = exp(-dot(hp, hp) * 3.2);
  col += vec3(1.0, 0.97, 0.92) * hl * (0.35 + 0.20 * level * active);

  // tight hot glossy hotspot
  vec2 hp2 = uv - vec2(-0.30, -0.52);
  float hl2 = exp(-dot(hp2, hp2) * 30.0);
  col += vec3(1.0) * hl2 * 0.55;

  // thin glossy streak arcing across the upper surface
  float streak = exp(-pow((uv.y + 0.30 + uv.x * 0.25), 2.0) * 26.0) * smoothstep(0.0, 0.8, 1.0 - rr);
  col += vec3(1.0) * streak * 0.22;

  col = clamp(col, 0.0, 1.0);

  float alpha = edge;
  return vec4(col * alpha, alpha);
}
`)

if (!compiled) throw new Error('Orb: sphere shader failed to compile')
const source = compiled

interface OrbProps {
  width: number
  height: number
  intensity: SharedValue<number>
  isActive?: boolean
}

export function Orb({ width, height, intensity, isActive = false }: OrbProps) {
  const iTime = useSharedValue(0)
  const drift = useSharedValue(0)
  const activeAnim = useSharedValue(isActive ? 1 : 0)
  const breathe = useSharedValue(0)

  useEffect(() => {
    activeAnim.value = withTiming(isActive ? 1 : 0, { duration: 600 })
  }, [isActive])

  useEffect(() => {
    // slow idle breathing, always on — the sphere should never look frozen
    breathe.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2600, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 2600, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      true,
    )
  }, [])

  useFrameCallback((frameInfo) => {
    const dt = (frameInfo.timeSincePreviousFrame ?? 16) * 0.001
    iTime.value += dt
    // Integrated over time rather than derived as iTime * rate — that would
    // make the pattern jump the instant the rate changes (e.g. on tapping
    // record), since a fast-changing multiplier times a large elapsed time
    // is discontinuous. Accumulating it frame-by-frame keeps it continuous.
    drift.value += dt * (0.15 + activeAnim.value * 0.85)
  })

  const uniforms = useDerivedValue(() => ({
    iTime: iTime.value,
    drift: drift.value,
    iResolution: [width, height],
    active: activeAnim.value,
    level: intensity.value,
  }))

  const scaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + breathe.value * 0.035 + intensity.value * activeAnim.value * 0.05 }],
  }))

  return (
    <Animated.View style={[{ width, height }, styles.center, scaleStyle]}>
      <Canvas style={{ width, height, position: 'absolute' }}>
        <Fill>
          <Shader source={source} uniforms={uniforms} />
        </Fill>
      </Canvas>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
})
