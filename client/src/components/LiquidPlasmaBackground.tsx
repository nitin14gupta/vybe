import { useEffect } from 'react'
import { StyleSheet, View, Dimensions } from 'react-native'
import { Canvas, Fill, Shader, Skia } from '@shopify/react-native-skia'
import { useSharedValue, withRepeat, withTiming, Easing, useDerivedValue } from 'react-native-reanimated'

const { width, height } = Dimensions.get('window')

const source = Skia.RuntimeEffect.Make(`
  uniform float iTime;
  uniform vec2 iResolution;
  uniform vec3 color1;
  uniform vec3 color2;
  uniform float flowVertical;

  half4 main(vec2 fragCoord) {
    vec2 screenUV = fragCoord / iResolution.xy;
    vec2 uv = screenUV;

    float speed = iTime * 0.4;
    // Rotate the coordinate space 90° so the same wave math reads as
    // vertical drift instead of its native right-to-left one, and reverse
    // the phase so it travels bottom-to-top — opt-in via flowVertical so
    // existing screens are untouched.
    if (flowVertical > 0.5) {
      uv = vec2(uv.y, uv.x);
      speed = -speed;
    }

    vec2 p = uv * 3.0;
    for (int i = 1; i < 5; i++) {
        p.x += 0.3 / float(i) * sin(float(i) * 3.0 * p.y + speed);
        p.y += 0.3 / float(i) * cos(float(i) * 3.0 * p.x + speed);
    }

    float f = 0.5 + 0.5 * sin(p.x + p.y);
    vec3 finalColor = mix(color1, color2, f) * 0.5;

    // Anchor the effect to the bottom edge instead of filling the whole
    // screen uniformly — fades to black by ~40% down from the top, full
    // strength by the bottom, so it reads as rising up from the bottom
    // rather than a flat wash of color everywhere.
    if (flowVertical > 0.5) {
      float mask = smoothstep(0.0, 0.6, screenUV.y);
      finalColor *= mask;
    }

    return half4(finalColor, 1.0);
  }
`)!

const LOOP_RANGE = 10 * Math.PI
const LOOP_DURATION = 15708

function hexToRgb(hex: string): [number, number, number] {
  let cleanHex = hex.replace(/^#/, '')
  if (cleanHex.length === 3 || cleanHex.length === 4) {
    cleanHex = cleanHex.split('').map(c => c + c).join('')
  }
  const result = /^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})/i.exec(cleanHex)
  return result ? [
    parseInt(result[1], 16) / 255,
    parseInt(result[2], 16) / 255,
    parseInt(result[3], 16) / 255
  ] : [0, 0, 0]
}

interface Props {
  colors?: [string, string]
  /** Flow bottom-to-top instead of the default right-to-left drift. */
  vertical?: boolean
}

export default function LiquidPlasmaBackground({ colors, vertical = false }: Props = {}) {
  const time = useSharedValue(0)
  
  const targetC1 = colors ? hexToRgb(colors[0]) : hexToRgb('#111111')
  const targetC2 = colors ? hexToRgb(colors[1]) : hexToRgb('#FF3864')

  const c1 = useSharedValue(targetC1)
  const c2 = useSharedValue(targetC2)

  useEffect(() => {
    c1.value = withTiming(targetC1, { duration: 800 })
    c2.value = withTiming(targetC2, { duration: 800 })
  }, [colors])

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
    color1: c1.value,
    color2: c2.value,
    flowVertical: vertical ? 1 : 0,
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

