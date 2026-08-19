import { useState } from 'react'
import { Host } from '@expo/ui'
import { HStack, Text as SwiftText } from '@expo/ui/swift-ui'
import { animation, Animation, contentTransition, font, foregroundColor, monospacedDigit } from '@expo/ui/swift-ui/modifiers'

interface Props {
  totalSeconds: number
  digitColor?: string
  fontSize?: number
  alwaysShowHours?: boolean
  fontFamily?: string
}

function DigitGroup({ value, size, color, fontFamily }: { value: number; size: number; color: string; fontFamily?: string }) {
  const [prev, setPrev] = useState(value)
  const [countsDown, setCountsDown] = useState(false)
  if (prev !== value) {
    setCountsDown(value < prev)
    setPrev(value)
  }
  return (
    <SwiftText
      modifiers={[
        font({ size, weight: 'bold', design: fontFamily ? undefined : 'rounded', family: fontFamily }),
        foregroundColor(color),
        monospacedDigit(),
        contentTransition('numericText', { countsDown }),
        animation(Animation.spring(), value),
      ]}
    >
      {String(value).padStart(2, '0')}
    </SwiftText>
  )
}

function Separator({ size, color, fontFamily }: { size: number; color: string; fontFamily?: string }) {
  return (
    <SwiftText modifiers={[font({ size, weight: 'bold', family: fontFamily }), foregroundColor(color)]}>
      :
    </SwiftText>
  )
}

export function TickingCountdown({ totalSeconds, digitColor = '#fff', fontSize = 16, alwaysShowHours = false, fontFamily }: Props) {
  const clamped = Math.max(0, Math.floor(totalSeconds))
  const h = Math.floor(clamped / 3600)
  const m = Math.floor((clamped % 3600) / 60)
  const s = Math.floor(clamped % 60)
  const showHours = alwaysShowHours || h > 0

  return (
    <Host matchContents style={{ height: fontSize * 1.4 }}>
      <HStack spacing={2}>
        {showHours && <DigitGroup value={h} size={fontSize} color={digitColor} fontFamily={fontFamily} />}
        {showHours && <Separator size={fontSize} color={digitColor} fontFamily={fontFamily} />}
        <DigitGroup value={m} size={fontSize} color={digitColor} fontFamily={fontFamily} />
        <Separator size={fontSize} color={digitColor} fontFamily={fontFamily} />
        <DigitGroup value={s} size={fontSize} color={digitColor} fontFamily={fontFamily} />
      </HStack>
    </Host>
  )
}
