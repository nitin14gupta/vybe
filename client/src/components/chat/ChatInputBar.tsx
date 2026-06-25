import { useRef, useEffect } from 'react'
import {
  View, Text, TextInput, Pressable, ActivityIndicator, StyleSheet, Keyboard,
  type LayoutChangeEvent,
} from 'react-native'
import { BottomSheetModal } from '@gorhom/bottom-sheet'
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio'
import { Square, Mic, Send, Trash2, Plus, X, Play, Pause } from 'lucide-react-native'
import { RecordingWave, PlaybackWave } from '@/components/ui'
import { hHeavy, hSuccess, hTap, hError } from '@/lib/haptics'
import { Colors, FontFamily } from '@/constants'
import type { Message } from '@/api/apiService'
import type { RecordedVoice } from '@/hooks/useVoiceRecorder'
import { ReplyBar } from './ReplyBar'
import { MediaPickerSheet } from './MediaPickerSheet'
import { MediaPreviewModal } from './MediaPreviewModal'
import { useMediaPicker } from '@/hooks/useMediaPicker'

export type RecordState = 'idle' | 'recording' | 'preview' | 'sending'

interface Props {
  blockStatus: 'none' | 'i_blocked' | 'they_blocked'
  inputText: string
  recordState: RecordState
  recordDurationMs: number
  recordedVoice: RecordedVoice | null
  replyingTo: Message | null
  myId: string
  partnerName: string | null
  onTextChange: (t: string) => void
  onSend: () => void
  onMicPress: () => void
  onRecordStop: () => void
  onRecordCancel: () => void
  onSendVoice: () => void
  onDiscardVoice: () => void
  onUnblock: () => void
  onDeleteChat: () => void
  onCancelReply: () => void
  onMediaSend: (uri: string, type: 'image' | 'video' | 'gif', width?: number, height?: number) => void
  onLayout: (e: LayoutChangeEvent) => void
}

function formatTime(ms: number): string {
  const sec = Math.floor(ms / 1000)
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`
}

// Mini voice player shown in the preview bar after recording stops
function VoicePreviewPlayer({ uri, durationMs }: { uri: string; durationMs: number }) {
  const player = useAudioPlayer(null)
  const status = useAudioPlayerStatus(player)

  useEffect(() => {
    player.replace({ uri })
  }, [uri])

  const toggle = () => {
    hTap()
    if (status.playing) { player.pause() }
    else { player.seekTo(0); player.play() }
  }

  const dur = Math.max(1, Math.round(durationMs / 1000))
  const mins = Math.floor(dur / 60)
  const secs = String(dur % 60).padStart(2, '0')

  return (
    <View style={pv.wrap}>
      <Pressable onPress={toggle} style={pv.btn}>
        {status.playing
          ? <Pause size={14} color="#111" strokeWidth={2.5} />
          : <Play  size={14} color="#111" strokeWidth={2.5} />
        }
      </Pressable>
      <View style={pv.wave}>
        <PlaybackWave isActive={status.playing} color={Colors.brandOrange} compact />
      </View>
      <Text style={pv.dur}>{`${mins}:${secs}`}</Text>
    </View>
  )
}

const pv = StyleSheet.create({
  wrap: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  btn: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: Colors.brandOrange,
    alignItems: 'center', justifyContent: 'center',
  },
  wave: { flex: 1, overflow: 'hidden' },
  dur: { fontFamily: FontFamily.bodyRegular, fontSize: 11, color: Colors.inkSecondary, minWidth: 28, textAlign: 'right' },
})

export function ChatInputBar({
  blockStatus, inputText, recordState, recordDurationMs, recordedVoice,
  replyingTo, myId, partnerName,
  onTextChange, onSend, onMicPress, onRecordStop, onRecordCancel,
  onSendVoice, onDiscardVoice,
  onUnblock, onDeleteChat, onCancelReply, onMediaSend, onLayout,
}: Props) {
  const inputRef = useRef<TextInput>(null)
  const sheetRef = useRef<BottomSheetModal>(null)

  const { handleCamera, handleLibrary, pendingMedia, confirmSend, cancelPreview } = useMediaPicker({ onMediaSend })

  useEffect(() => {
    if (replyingTo) {
      const t = setTimeout(() => inputRef.current?.focus(), 60)
      return () => clearTimeout(t)
    }
  }, [replyingTo?.id])

  const openMediaSheet = () => {
    Keyboard.dismiss()
    setTimeout(() => sheetRef.current?.present(), 160)
  }

  // ── Block states ────────────────────────────────────────────────────────────

  if (blockStatus === 'they_blocked') {
    return (
      <View style={s.blockNotice} onLayout={onLayout}>
        <Text style={s.blockNoticeText}>You can't message this person.</Text>
      </View>
    )
  }

  if (blockStatus === 'i_blocked') {
    return (
      <View style={s.blockBar} onLayout={onLayout}>
        <Text style={s.blockBarText}>You blocked this person.</Text>
        <View style={s.blockBtnRow}>
          <Pressable style={s.unblockBtn} onPress={() => { hSuccess(); onUnblock() }}>
            <Text style={s.unblockBtnText}>Unblock</Text>
          </Pressable>
          <Pressable style={s.deleteBtn} onPress={() => { hError(); onDeleteChat() }}>
            <Text style={s.deleteBtnText}>Delete Chat</Text>
          </Pressable>
        </View>
      </View>
    )
  }

  // ── Recording active ────────────────────────────────────────────────────────

  if (recordState === 'recording') {
    return (
      <View style={s.recordBar} onLayout={onLayout}>
        <Pressable style={s.iconBtn} onPress={() => { hTap(); onRecordCancel() }} hitSlop={8}>
          <X size={18} color={Colors.inkSecondary} strokeWidth={2.5} />
        </Pressable>
        <View style={s.recordCenter}>
          <RecordingWave isActive />
          <Text style={s.recordTimer}>{formatTime(recordDurationMs)}</Text>
        </View>
        <Pressable style={s.recordStopBtn} onPress={() => { hTap(); onRecordStop() }}>
          <Square size={15} color="#111" strokeWidth={0} fill="#111" />
        </Pressable>
      </View>
    )
  }

  // ── Voice preview (after stop, before send) ─────────────────────────────────

  if (recordState === 'preview' && recordedVoice) {
    return (
      <View style={s.recordBar} onLayout={onLayout}>
        <Pressable style={s.iconBtn} onPress={() => { hTap(); onDiscardVoice() }} hitSlop={8}>
          <X size={18} color={Colors.inkSecondary} strokeWidth={2.5} />
        </Pressable>
        <VoicePreviewPlayer uri={recordedVoice.uri} durationMs={recordedVoice.durationMs} />
        <Pressable style={s.sendBtn} onPress={() => { hSuccess(); onSendVoice() }}>
          <Send size={16} color="#111" strokeWidth={2.5} fill="#111" />
        </Pressable>
      </View>
    )
  }

  // ── Uploading / sending ─────────────────────────────────────────────────────

  if (recordState === 'sending') {
    return (
      <View style={s.recordBar} onLayout={onLayout}>
        <ActivityIndicator size="small" color={Colors.brandOrange} />
        <Text style={s.sendingText}>Sending…</Text>
      </View>
    )
  }

  // ── Normal input ────────────────────────────────────────────────────────────

  const hasText = inputText.trim().length > 0

  return (
    <>
      <View onLayout={onLayout}>
        {replyingTo && (
          <ReplyBar msg={replyingTo} myId={myId} partnerName={partnerName} onCancel={onCancelReply} />
        )}
        <View style={s.inputRow}>
          <Pressable style={s.addBtn} onPress={() => { hTap(); openMediaSheet() }} hitSlop={4}>
            <Plus size={18} color={Colors.inkSecondary} strokeWidth={2.5} />
          </Pressable>

          {/* Input pill — mic is absolute inside so it doesn't affect height */}
          <View style={s.inputWrap}>
            <TextInput
              ref={inputRef}
              nativeID="chat-input"
              style={s.textInput}
              value={inputText}
              onChangeText={onTextChange}
              placeholder="Message…"
              placeholderTextColor={Colors.inkDisabled}
              multiline
            />
            {!hasText && (
              <Pressable onPress={() => { hHeavy(); onMicPress() }} style={s.micBtn} hitSlop={4}>
                <Mic size={17} color={Colors.inkSecondary} strokeWidth={2} />
              </Pressable>
            )}
          </View>

          {hasText && (
            <Pressable style={s.sendBtn} onPress={onSend}>
              <Send size={17} color="#111" strokeWidth={2} fill="#111" />
            </Pressable>
          )}
        </View>
      </View>

      <MediaPickerSheet ref={sheetRef} onCamera={handleCamera} onLibrary={handleLibrary} />
      <MediaPreviewModal media={pendingMedia} onSend={confirmSend} onCancel={cancelPreview} />
    </>
  )
}

const s = StyleSheet.create({
  blockNotice: { paddingHorizontal: 20, paddingVertical: 14, alignItems: 'center' },
  blockNoticeText: { fontFamily: FontFamily.bodyRegular, fontSize: 14, color: Colors.inkSecondary },
  blockBar: { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 10, gap: 10 },
  blockBarText: { fontFamily: FontFamily.bodyRegular, fontSize: 13, color: Colors.inkSecondary, textAlign: 'center' },
  blockBtnRow: { flexDirection: 'row', gap: 10 },
  unblockBtn: {
    flex: 1, height: 40, borderRadius: 12,
    borderWidth: 1, borderColor: Colors.brandOrange,
    alignItems: 'center', justifyContent: 'center',
  },
  unblockBtnText: { fontFamily: FontFamily.bodySemiBold, fontSize: 14, color: Colors.brandOrange },
  deleteBtn: {
    flex: 1, height: 40, borderRadius: 12,
    borderWidth: 1, borderColor: Colors.brandCoral,
    alignItems: 'center', justifyContent: 'center',
  },
  deleteBtnText: { fontFamily: FontFamily.bodySemiBold, fontSize: 14, color: Colors.brandCoral },

  recordBar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 10,
    backgroundColor: 'rgba(255,107,53,0.05)', gap: 10,
  },
  iconBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center', justifyContent: 'center',
  },
  recordCenter: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  recordTimer: { fontFamily: FontFamily.bodySemiBold, fontSize: 13, color: Colors.brandOrange, minWidth: 36, textAlign: 'right' },
  recordStopBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: Colors.brandOrange, alignItems: 'center', justifyContent: 'center', elevation: 4,
  },
  sendingText: { fontFamily: FontFamily.bodyRegular, fontSize: 14, color: Colors.inkSecondary, marginLeft: 8 },

  inputRow: {
    flexDirection: 'row', alignItems: 'flex-end',
    paddingHorizontal: 12, paddingVertical: 10, gap: 8,
  },
  addBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.07)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 2,
  },
  inputWrap: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#252525',
    paddingLeft: 14,
    paddingRight: 40,   // reserves space for absolute mic — doesn't affect height
    paddingVertical: 9,
    minHeight: 40,
    maxHeight: 120,
    justifyContent: 'center',
  },
  textInput: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 15,
    color: Colors.inkPrimary,
    lineHeight: 20,
    paddingTop: 0,
    paddingBottom: 0,
  },
  micBtn: {
    position: 'absolute',
    right: 8,
    bottom: 7,
    width: 28, height: 28, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  sendBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: Colors.brandOrange,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 2,
    shadowColor: Colors.brandOrange,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35, shadowRadius: 6, elevation: 4,
  },
})
