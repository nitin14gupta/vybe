import { Dimensions, StyleSheet, View } from 'react-native'
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg'
import { Colors } from '@/constants'

const { width: W, height: H } = Dimensions.get('window')
const LINE_COUNT = 20
const MAX_RADIUS = Math.hypot(W, H) * 0.62

interface Props {
  /** Origin as a fraction of screen width/height — where the lines fan out from (the logo). */
  originXRatio?: number
  originYRatio?: number
}

function radiatingWavePath(cx: number, cy: number, angle: number, length: number, amplitude: number, waves: number, phase: number) {
  const dx = Math.cos(angle)
  const dy = Math.sin(angle)
  const px = -dy
  const py = dx
  const segments = 62
  let d = `M ${cx.toFixed(1)} ${cy.toFixed(1)}`
  for (let i = 1; i <= segments; i++) {
    const t = i / segments
    const r = t * length
    const wave = Math.sin(t * Math.PI * waves + phase) * amplitude * t
    const x = cx + dx * r + px * wave
    const y = cy + dy * r + py * wave
    d += ` L ${x.toFixed(1)} ${y.toFixed(1)}`
  }
  return d
}

export function GlowLinesBackground({ originXRatio = 0.5, originYRatio = 0.38 }: Props) {
  const cx = W * originXRatio
  const cy = H * originYRatio

  const lines = Array.from({ length: LINE_COUNT }, (_, i) => {
    const angle = (i / LINE_COUNT) * Math.PI * 2 + Math.sin(i * 1.7) * 0.15
    const length = MAX_RADIUS * (0.25 + ((i * 97) % 95) / 100)
    const endX = cx + Math.cos(angle) * length
    const endY = cy + Math.sin(angle) * length
    return {
      angle,
      length,
      endX,
      endY,
      amplitude: 10 + (i % 5) * 8,
      waves: 1 + (i % 3) * 0.8,
      phase: i * 0.9,
      opacity: 0.16 + (i % 4) * 0.09,
    }
  })

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`}>
        <Defs>
          {lines.map((line, i) => (
            <LinearGradient
              key={i}
              id={`glowLine-${i}`}
              gradientUnits="userSpaceOnUse"
              x1={cx}
              y1={cy}
              x2={line.endX}
              y2={line.endY}
            >
              <Stop offset="0" stopColor={Colors.brandCoral} stopOpacity={0.9} />
              <Stop offset="0.6" stopColor={Colors.brandOrange} stopOpacity={0.4} />
              <Stop offset="1" stopColor={Colors.brandOrange} stopOpacity={0} />
            </LinearGradient>
          ))}
        </Defs>
        {lines.map((line, i) => (
          <Path
            key={i}
            d={radiatingWavePath(cx, cy, line.angle, line.length, line.amplitude, line.waves, line.phase)}
            stroke={`url(#glowLine-${i})`}
            strokeWidth={1}
            fill="none"
            opacity={line.opacity}
          />
        ))}
      </Svg>
    </View>
  )
}
