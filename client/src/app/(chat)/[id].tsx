import { useCallback, useRef, useEffect, useState } from 'react'
import { View, Text, FlatList, StyleSheet, ActivityIndicator, type ScrollViewProps } from 'react-native'
import { KeyboardGestureArea, KeyboardStickyView } from 'react-native-keyboard-controller'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams } from 'expo-router'
import { BlockSheet, ReportSheet } from '@/components/ui'
import { Colors, FontFamily } from '@/constants'
import { useChatScreen } from '@/hooks/useChatScreen'
import type { Message } from '@/api/apiService'

import { ChatHeader } from '@/components/chat/ChatHeader'
import { ChatInputBar } from '@/components/chat/ChatInputBar'
import { MessageBubble } from '@/components/chat/MessageBubble'
import { MediaStack } from '@/components/chat/MediaStack'
import { MediaViewerModal } from '@/components/chat/MediaViewerModal'
import { DateSeparator } from '@/components/chat/DateSeparator'
import { TypingIndicator } from '@/components/chat/TypingIndicator'
import { EmojiPickerOverlay } from '@/components/chat/EmojiPickerOverlay'
import { ReportMessageSheet } from '@/components/chat/ReportMessageSheet'
import { ChatScrollView } from '@/components/chat/ChatScrollView'
import { ChatPartnerPreview } from '@/components/chat/ChatPartnerPreview'
import { InAppBrowserModal } from '@/components/ui/InAppBrowserModal'

type ListItem =
  | Message
  | { type: 'date_sep'; label: string; id: string }
  | { type: 'seen_label'; label: string; id: string }
  | { type: 'media_group'; id: string; messages: Message[] }

// VoiceIndicator lives here as a micro-component — too small for its own file
function VoiceIndicator() {
  return (
    <View style={s.voiceIndicatorWrap}>
      <View style={s.voiceIndicatorBubble}>
        <Text style={s.voiceIndicatorText}>🎤 Recording…</Text>
      </View>
    </View>
  )
}

export default function ChatDetailScreen() {
  const { id: convId } = useLocalSearchParams<{ id: string }>()
  const flatListRef = useRef<FlatList>(null)
  const [browserUrl, setBrowserUrl] = useState<string | null>(null)

  const screen = useChatScreen(convId)

  // Auto-scroll to newest message when a new one arrives (skip initial load).
  // Keyed on the newest message's id, not the array length — loadMore appends
  // OLDER messages at the tail, which also grows the length but must NOT yank
  // the user back down while they're scrolling up to read history.
  const prevNewestIdRef = useRef<string | null>(null)
  const initializedRef = useRef(false)
  useEffect(() => {
    if (screen.loading) return
    const newestId = screen.messages[0]?.id ?? null
    if (!initializedRef.current) {
      initializedRef.current = true
      prevNewestIdRef.current = newestId
      return
    }
    if (newestId && newestId !== prevNewestIdRef.current) {
      flatListRef.current?.scrollToOffset({ offset: 0, animated: true })
    }
    prevNewestIdRef.current = newestId
  }, [screen.messages, screen.loading])

  const handleReplyTap = useCallback((originalMsgId: string) => {
    const targetItem = (screen.listData as ListItem[]).find(
      item => !('type' in item) && (item as Message).id === originalMsgId
    )
    if (targetItem) {
      flatListRef.current?.scrollToItem({
        item: targetItem,
        animated: true,
        viewPosition: 0.5,
      })
    }
  }, [screen.listData])

  const renderScrollComponent = useCallback(
    (props: ScrollViewProps) => (
      <ChatScrollView {...props} extraContentPadding={screen.extraContentPadding} />
    ),
    [screen.extraContentPadding],
  )

  const renderItem = useCallback(({ item }: { item: ListItem }) => {
    if ('type' in item && item.type === 'date_sep') {
      return <DateSeparator label={item.label} />
    }
    if ('type' in item && item.type === 'seen_label') {
      return <Text style={s.seenLabel}>{item.label}</Text>
    }
    if ('type' in item && item.type === 'media_group') {
      return (
        <MediaStack
          messages={item.messages}
          isMine={item.messages[0].sender_id === screen.myId}
          onOpen={screen.handleMediaGroupTap}
        />
      )
    }
    const msg = item as Message
    return (
      <MessageBubble
        msg={msg}
        isMine={msg.sender_id === screen.myId}
        myId={screen.myId ?? ''}
        isFailed={screen.failedIds?.has(msg.id)}
        onDoubleTap={screen.handleDoubleTap}
        onLongPress={screen.handleLongPress}
        onSwipeReply={screen.handleSwipeReply}
        onReactionPillPress={screen.handleReactionPillPress}
        onReplyTap={handleReplyTap}
        onMediaTap={screen.handleMediaTap}
        onRetry={screen.handleRetry}
        onLinkTap={setBrowserUrl}
      />
    )
  }, [screen.myId, screen.failedIds, screen.handleDoubleTap, screen.handleLongPress, screen.handleSwipeReply, screen.handleReactionPillPress, screen.handleMediaTap, screen.handleMediaGroupTap, screen.handleRetry, handleReplyTap])

  const listHeader = screen.isPartnerRecording
    ? <VoiceIndicator />
    : screen.isPartnerTyping ? <TypingIndicator /> : null

  return (
    <View style={s.root}>
      <ChatHeader
        partnerName={screen.partnerName}
        partnerUsername={screen.partnerUsername}
        partnerAvatar={screen.partnerAvatar}
        partnerId={screen.partnerId}
        isPartnerOnline={screen.isPartnerOnline}
        isWsConnected={screen.isWsConnected}
        loading={screen.loading}
        onMenuPress={() => screen.setMenuOpen(true)}
      />

      <SafeAreaView edges={['bottom']} style={s.body}>
        {screen.loading ? (
          <View style={s.center}>
            <ActivityIndicator color={Colors.brandOrange} />
          </View>
        ) : (
          <KeyboardGestureArea
            interpolator="ios"
            offset={screen.inputBarHeight}
            style={s.body}
            textInputNativeID="chat-input"
          >
            <FlatList
              ref={flatListRef}
              data={screen.listData as ListItem[]}
              keyExtractor={item =>
                'type' in item && item.type === 'date_sep'
                  ? item.id
                  : (item as Message).id
              }
              renderItem={renderItem}
              inverted
              contentContainerStyle={s.msgList}
              showsVerticalScrollIndicator
              onEndReached={screen.loadMore}
              onEndReachedThreshold={0.2}
              onScrollToIndexFailed={info => {
                flatListRef.current?.scrollToOffset({
                  offset: info.highestMeasuredFrameIndex * 72,
                  animated: true,
                })
              }}
              ListHeaderComponent={listHeader}
              ListFooterComponent={
                <>
                  {screen.loadingMore && (
                    <View style={s.loadMoreWrap}>
                      <ActivityIndicator size="small" color={Colors.brandOrange} />
                    </View>
                  )}
                  <ChatPartnerPreview
                    partnerId={screen.partnerId}
                    partnerName={screen.partnerName}
                    partnerUsername={screen.partnerUsername}
                    partnerAvatar={screen.partnerAvatar}
                  />
                </>
              }
              keyboardShouldPersistTaps="handled"
              renderScrollComponent={renderScrollComponent}
            />

            <KeyboardStickyView offset={screen.stickyOffset} style={s.stickyWrap}>
              <ChatInputBar
                blockStatus={screen.blockStatus}
                inputText={screen.inputText}
                recordState={screen.recordState}
                recordDurationMs={screen.recordDurationMs}
                recordedVoice={screen.recordedVoice}
                replyingTo={screen.replyingTo}
                editingMessage={screen.editingMessage}
                myId={screen.myId ?? ''}
                partnerName={screen.partnerName}
                onTextChange={screen.handleTextChange}
                onSend={screen.handleSend}
                onMicPress={screen.handleMicPress}
                onRecordStop={screen.handleRecordStop}
                onRecordCancel={screen.handleRecordCancel}
                onSendVoice={screen.handleSendVoice}
                onDiscardVoice={screen.handleDiscardVoice}
                onUnblock={screen.handleUnblock}
                onDeleteChat={screen.handleDeleteChat}
                onCancelReply={screen.handleCancelReply}
                onCancelEdit={screen.handleCancelEdit}
                onMediaSend={screen.handleMediaSend}
                onLayout={screen.handleInputLayout}
              />
            </KeyboardStickyView>
          </KeyboardGestureArea>
        )}
      </SafeAreaView>

      {screen.emojiTarget && (
        <EmojiPickerOverlay
          msgId={screen.emojiTarget.msgId}
          pageY={screen.emojiTarget.pageY}
          isMine={screen.emojiTarget.isMine}
          currentEmoji={screen.emojiTarget.currentEmoji}
          canCopy={screen.emojiTarget.contentType === 'text' && !!screen.emojiTarget.content}
          canEdit={screen.emojiTarget.canEdit}
          onSelect={screen.handleEmojiSelect}
          onReply={() => screen.handleReplyFromMenu(screen.emojiTarget!.msgId)}
          onCopy={() => { if (screen.emojiTarget!.content) screen.handleCopyMessage(screen.emojiTarget!.content) }}
          onReport={() => screen.setReportMsgId(screen.emojiTarget!.msgId)}
          onEdit={() => screen.handleEditFromMenu(screen.emojiTarget!.msgId)}
          onDelete={() => {
            if (screen.emojiTarget!.isMine) screen.handleUnsendMessage(screen.emojiTarget!.msgId)
            else screen.handleDeleteMessageForMe(screen.emojiTarget!.msgId)
          }}
          onClose={screen.handleCloseEmojiPicker}
        />
      )}

      <ReportMessageSheet
        visible={!!screen.reportMsgId}
        onSubmit={screen.handleReportMessageSubmit}
        onClose={screen.handleReportSheetClosed}
      />

      <BlockSheet
        visible={screen.menuOpen}
        targetName={screen.partnerName}
        isBlocked={screen.blockStatus === 'i_blocked'}
        onBlock={async () => { await screen.handleBlock(); screen.setMenuOpen(false) }}
        onUnblock={async () => { await screen.handleUnblock(); screen.setMenuOpen(false) }}
        onClose={() => screen.setMenuOpen(false)}
      />
      <ReportSheet
        visible={screen.reportOpen}
        targetName={screen.partnerName}
        onSubmit={screen.handleReport}
        onClose={() => screen.setReportOpen(false)}
      />

      {screen.viewingMedia && (
        <MediaViewerModal
          visible={!!screen.viewingMedia}
          items={screen.viewingMedia.items}
          initialIndex={screen.viewingMedia.initialIndex}
          onClose={screen.closeMedia}
        />
      )}

      <InAppBrowserModal
        visible={!!browserUrl}
        url={browserUrl}
        onClose={() => setBrowserUrl(null)}
      />
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  body: { flex: 1 },
  stickyWrap: { backgroundColor: Colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  msgList: { paddingHorizontal: 16, paddingVertical: 12 },
  loadMoreWrap: { paddingVertical: 14, alignItems: 'center' },
  seenLabel: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 11,
    color: Colors.inkDisabled,
    textAlign: 'right',
    paddingRight: 4,
    marginBottom: 4,
  },
  voiceIndicatorWrap: { marginBottom: 12, maxWidth: '82%', alignSelf: 'flex-start' },
  voiceIndicatorBubble: {
    backgroundColor: '#222',
    borderWidth: 1, borderColor: '#2a2a2a',
    borderRadius: 16, borderBottomLeftRadius: 4,
    paddingHorizontal: 14, paddingVertical: 10,
  },
  voiceIndicatorText: { fontFamily: FontFamily.bodyRegular, fontSize: 13, color: Colors.brandOrange },
})
