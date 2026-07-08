import { useEffect } from 'react'
import { StyleSheet, View, Dimensions } from 'react-native'
import { Canvas, Fill, Shader, Skia } from '@shopify/react-native-skia'
import { useSharedValue, withRepeat, withTiming, Easing, useDerivedValue } from 'react-native-reanimated'

const { width, height } = Dimensions.get('window')

const source = Skia.RuntimeEffect.Make(`
  uniform float iTime;
  uniform vec2 iResolution;

  half4 main(vec2 fragCoord) {
    vec2 uv = fragCoord / iResolution.xy;

    float speed = iTime * 0.4;
    vec2 p = uv * 3.0;
    for (int i = 1; i < 5; i++) {
        p.x += 0.3 / float(i) * sin(float(i) * 3.0 * p.y + speed);
        p.y += 0.3 / float(i) * cos(float(i) * 3.0 * p.x + speed);
    }

    // Brand palette: near-black base to brand orange/coral
    vec3 col1 = vec3(0.067, 0.067, 0.067); // #111111 — app background
    vec3 col2 = vec3(1.0, 0.22, 0.39);    // #FF3864 — brand coral

    float f = 0.5 + 0.5 * sin(p.x + p.y);
    vec3 finalColor = mix(col1, col2, f);

    return half4(finalColor * 0.5, 1.0);
  }
`)!

// speed = iTime * 0.4 feeds sin/cos, so the loop must cover a range where
// 0.4 * range is an exact multiple of 2π — otherwise the value snaps back
// to a different phase than it started at and the motion visibly "restarts".
const LOOP_RANGE = 10 * Math.PI // 0.4 * 10π = 4π (2 full cycles)
const LOOP_DURATION = 15708 // keeps the same on-screen speed as before

export default function LiquidPlasmaBackground() {
  const time = useSharedValue(0)

  useEffect(() => {
    time.value = withRepeat(
      withTiming(LOOP_RANGE, { duration: LOOP_DURATION, easing: Easing.linear }),
      -1,
      false
    )
  }, [])

  const uniforms = useDerivedValue(() => ({
    iTime: time.value,
    iResolution: [width, height],
  }))

  return (
    <View style={StyleSheet.absoluteFill}>
      <Canvas style={StyleSheet.absoluteFill}>
        <Fill>
          <Shader source={source} uniforms={uniforms} />
        </Fill>
      </Canvas>
    </View>
  )
}
