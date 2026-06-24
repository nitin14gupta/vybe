import { forwardRef } from 'react'
import { type ScrollViewProps } from 'react-native'
import {
  KeyboardChatScrollView,
  type KeyboardChatScrollViewProps,
} from 'react-native-keyboard-controller'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

const MARGIN = 8

type ChatScrollRef = React.ElementRef<typeof KeyboardChatScrollView>
type ChatScrollProps = ScrollViewProps & KeyboardChatScrollViewProps

// Must be defined outside any screen component for stable ref identity.
export const ChatScrollView = forwardRef<ChatScrollRef, ChatScrollProps>(
  ({ inverted, ...props }, ref) => {
    const { bottom } = useSafeAreaInsets()
    return (
      <KeyboardChatScrollView
        ref={ref}
        automaticallyAdjustContentInsets={false}
        contentInsetAdjustmentBehavior="never"
        keyboardDismissMode="interactive"
        offset={bottom - MARGIN}
        inverted={inverted}
        {...props}
      />
    )
  }
)
