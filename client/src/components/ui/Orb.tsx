import React, { useEffect } from 'react'
import { StyleSheet, View } from 'react-native'
import { Canvas, Fill, Shader, Skia } from '@shopify/react-native-skia'
import {
  SharedValue,
  useDerivedValue,
  useSharedValue,
  useFrameCallback
} from 'react-native-reanimated'

const source = Skia.RuntimeEffect.Make(`
uniform float iTime;
uniform float2 iResolution;
uniform float hue;
uniform float hover;
uniform float rot;
uniform float hoverIntensity;

vec3 rgb2yiq(vec3 c) {
  float y = dot(c, vec3(0.299, 0.587, 0.114));
  float i = dot(c, vec3(0.596, -0.274, -0.322));
  float q = dot(c, vec3(0.211, -0.523, 0.312));
  return vec3(y, i, q);
}

vec3 yiq2rgb(vec3 c) {
  float r = c.x + 0.956 * c.y + 0.621 * c.z;
  float g = c.x - 0.272 * c.y - 0.647 * c.z;
  float b = c.x - 1.106 * c.y + 1.703 * c.z;
  return vec3(r, g, b);
}

vec3 adjustHue(vec3 color, float hueDeg) {
  float hueRad = hueDeg * 3.14159265 / 180.0;
  vec3 yiq = rgb2yiq(color);
  float cosA = cos(hueRad);
  float sinA = sin(hueRad);
  float i = yiq.y * cosA - yiq.z * sinA;
  float q = yiq.y * sinA + yiq.z * cosA;
  yiq.y = i;
  yiq.z = q;
  return yiq2rgb(yiq);
}

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

vec4 extractAlpha(vec3 colorIn) {
  float a = max(max(colorIn.r, colorIn.g), colorIn.b);
  return vec4(colorIn.rgb / (a + 1e-5), a);
}

const vec3 baseColor1 = vec3(0.611765, 0.262745, 0.996078);
const vec3 baseColor2 = vec3(0.298039, 0.760784, 0.913725);
const vec3 baseColor3 = vec3(0.062745, 0.078431, 0.600000);
const float innerRadius = 0.6;
const float noiseScale = 0.65;

float light1(float intensity, float attenuation, float dist) {
  return intensity / (1.0 + dist * attenuation);
}
float light2(float intensity, float attenuation, float dist) {
  return intensity / (1.0 + dist * dist * attenuation);
}

vec4 draw(vec2 uv) {
  // Use hue from uniforms
  vec3 color1 = adjustHue(baseColor1, hue);
  vec3 color2 = adjustHue(baseColor2, hue);
  vec3 color3 = adjustHue(baseColor3, hue);
  
  float ang = atan(uv.y, uv.x);
  float len = length(uv);
  float invLen = len > 0.0 ? 1.0 / len : 0.0;
  
  float n0 = snoise3(vec3(uv * noiseScale, iTime * 0.5)) * 0.5 + 0.5;
  float r0 = mix(mix(innerRadius, 1.0, 0.4), mix(innerRadius, 1.0, 0.6), n0);
  float d0 = distance(uv, (r0 * invLen) * uv);
  float v0 = light1(1.0, 10.0, d0);
  v0 *= smoothstep(r0 * 1.05, r0, len);
  float cl = cos(ang + iTime * 2.0) * 0.5 + 0.5;
  
  float a = iTime * -1.0;
  vec2 pos = vec2(cos(a), sin(a)) * r0;
  float d = distance(uv, pos);
  float v1 = light2(1.5, 5.0, d);
  v1 *= light1(1.0, 50.0, d0);
  
  float v2 = smoothstep(1.0, mix(innerRadius, 1.0, n0 * 0.5), len);
  float v3 = smoothstep(innerRadius, mix(innerRadius, 1.0, 0.5), len);
  
  vec3 col = mix(color1, color2, cl);
  col = mix(color3, col, v0);
  col = (col + v1) * v2 * v3;
  col = clamp(col, 0.0, 1.0);
  
  return extractAlpha(col);
}

vec4 main(vec2 fragCoord) {
  vec2 center = iResolution.xy * 0.5;
  float size = min(iResolution.x, iResolution.y);
  vec2 uv = (fragCoord - center) / size * 2.0;
  
  float angle = rot;
  float s = sin(angle);
  float c = cos(angle);
  uv = vec2(c * uv.x - s * uv.y, s * uv.x + c * uv.y);
  
  // Wobbly effect based on hover
  uv.x += hover * hoverIntensity * 0.1 * sin(uv.y * 10.0 + iTime);
  uv.y += hover * hoverIntensity * 0.1 * sin(uv.x * 10.0 + iTime);
  
  vec4 col = draw(uv);
  
  // Premultiply alpha for Skia WebGL compatibility
  return vec4(col.rgb * col.a, col.a);
}
`)!;

interface OrbProps {
  hue?: number;
  width: number;
  height: number;
  intensity: SharedValue<number>;
  hueByIntensity?: boolean;
  autoRotate?: boolean;
  isActive?: boolean;
}

export function Orb({
  hue = 20,
  width,
  height,
  intensity,
  hueByIntensity = false,
  autoRotate = true,
  isActive = false,
}: OrbProps) {
  const iTime = useSharedValue(0);
  const rot = useSharedValue(0);
  const activeAnim = useSharedValue(isActive ? 1 : 0);
  const fakePulse = useSharedValue(0);

  React.useEffect(() => {
    import('react-native-reanimated').then(({ withTiming, withRepeat, withSequence, Easing }) => {
      activeAnim.value = withTiming(isActive ? 1 : 0, { duration: 600 });

      if (isActive) {
        // A smooth, organic breathing loop that doesn't drop too low (avoids looking 'idle')
        fakePulse.value = withRepeat(
          withSequence(
            withTiming(0.0, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
            withTiming(0.3, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
            withTiming(0.1, { duration: 1100, easing: Easing.inOut(Easing.ease) }),
            withTiming(0.2, { duration: 900, easing: Easing.inOut(Easing.ease) })
          ),
          -1,
          true
        );
      } else {
        fakePulse.value = withTiming(0, { duration: 600 });
      }
    });
  }, [isActive]);

  // hoverIntensity base + more reactive when louder
  const hoverIntensity = useDerivedValue(() => {
    const combinedIntensity = Math.max(intensity.value, fakePulse.value * activeAnim.value);
    return 0.5 + combinedIntensity * 2.0;
  });

  // The hover value responds directly to the intensity, but only heavily deforms when active
  const hover = useDerivedValue(() => {
    const combinedIntensity = Math.max(intensity.value, fakePulse.value * activeAnim.value);
    return (activeAnim.value * 0.8) + (combinedIntensity * 2.0);
  });

  useFrameCallback((frameInfo) => {
    const dt = (frameInfo.timeSincePreviousFrame ?? 16) * 0.001; // dt in seconds
    iTime.value += dt;
    if (autoRotate) {
      const combinedIntensity = Math.max(intensity.value, fakePulse.value * activeAnim.value);
      // Base rotation is slow (0.3), speeds up when active, and speeds up more when speaking or fake pulsing
      rot.value += dt * (0.3 + (activeAnim.value * 0.7) + (combinedIntensity * 2.0));
    }
  });

  const uniforms = useDerivedValue(() => {
    return {
      iTime: iTime.value,
      iResolution: [width, height],
      hue: hue + (hueByIntensity ? intensity.value * 150 : 0),
      hover: hover.value,
      rot: rot.value,
      hoverIntensity: hoverIntensity.value,
    };
  });

  return (
    <View style={{ width, height, alignItems: 'center', justifyContent: 'center' }}>
      <Canvas style={{ width, height, position: 'absolute' }}>
        <Fill>
          <Shader source={source} uniforms={uniforms} />
        </Fill>
      </Canvas>
    </View>
  );
}
