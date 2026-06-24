import { useRef, useEffect, useState, useCallback } from 'react'
import {
  View, Text, TextInput, Pressable, ActivityIndicator, StyleSheet, Alert,
  type LayoutChangeEvent,
} from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import { Square, Mic, Send, Trash2, Plus, Camera, Images, Film } from 'lucide-react-native'
import { RecordingWave, PlaybackWave } from '@/components/ui'
import { Colors, FontFamily } from '@/constants'
import type { Message } from '@/api/apiService'
import { ReplyBar } from './ReplyBar'

export type RecordState = 'idle' | 'recording' | 'sending'

interface Props {
  blockStatus: 'none' | 'i_blocked' | 'they_blocked'
  inputText: string
  recordState: RecordState
  recordDurationMs: number
  replyingTo: Message | null
  myId: string
  partnerName: string | null
  onTextChange: (t: string) => void
  onSend: () => void
  onMicPress: () => void
  onRecordStop: () => void
  onRecordCancel: () => void
  onUnblock: () => void
  onDeleteChat: () => void
  onCancelReply: () => void
  onMediaSend: (uri: string, type: 'image' | 'video' | 'gif', width?: number, height?: number) => void
  onLayout: (e: LayoutChangeEvent) => void
}

function formatRecordTime(ms: number): string {
  const sec = Math.floor(ms / 1000)
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`
}

export function ChatInputBar({
  blockStatus, inputText, recordState, recordDurationMs,
  replyingTo, myId, partnerName,
  onTextChange, onSend, onMicPress, onRecordStop, onRecordCancel,
  onUnblock, onDeleteChat, onCancelReply, onMediaSend, onLayout,
}: Props) {
  const inputRef = useRef<TextInput>(null)
  const [showMediaMenu, setShowMediaMenu] = useState(false)

  useEffect(() => {
    if (replyingTo) {
      const t = setTimeout(() => inputRef.current?.focus(), 60)
      return () => clearTimeout(t)
    }
  }, [replyingTo?.id])

  const handleCamera = useCallback(async () => {
    setShowMediaMenu(false)
    const { status } = await ImagePicker.requestCameraPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Camera access is required to take photos.')
      return
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images', 'videos'],
      quality: 0.85,
    })
    if (!result.canceled && result.assets.length > 0) {
      const asset = result.assets[0]
      const type = asset.type === 'video' ? 'video' : 'image'
      onMediaSend(asset.uri, type, asset.width, asset.height)
    }
  }, [onMediaSend])

  const handleLibrary = useCallback(async () => {
    setShowMediaMenu(false)
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Photo library access is required.')
      return
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      quality: 0.85,
    })
    if (!result.canceled && result.assets.length > 0) {
      const asset = result.assets[0]
      const isGif = asset.mimeType === 'image/gif' || asset.uri.toLowerCase().endsWith('.gif')
      const type = asset.type === 'video' ? 'video' : isGif ? 'gif' : 'image'
      onMediaSend(asset.uri, type, asset.width, asset.height)
    }
  }, [onMediaSend])

  const handleGif = useCallback(async () => {
    setShowMediaMenu(false)
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Photo library access is required.')
      return
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 1,
    })
    if (!result.canceled && result.assets.length > 0) {
      const asset = result.assets[0]
      const isGif = asset.mimeType === 'image/gif' || asset.uri.toLowerCase().endsWith('.gif')
      onMediaSend(asset.uri, isGif ? 'gif' : 'image', asset.width, asset.height)
    }
  }, [onMediaSend])

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
          <Pressable style={s.unblockBtn} onPress={onUnblock}>
            <Text style={s.unblockBtnText}>Unblock</Text>
          </Pressable>
          <Pressable style={s.deleteBtn} onPress={onDeleteChat}>
            <Trash2 size={14} color={Colors.brandCoral} strokeWidth={1.8} />
            <Text style={s.deleteBtnText}>Delete Chat</Text>
          </Pressable>
        </View>
      </View>
    )
  }

  if (recordState === 'recording') {
    return (
      <View style={s.recordBar} onLayout={onLayout}>
        <Pressable style={s.recordCancelBtn} onPress={onRecordCancel} hitSlop={8}>
          <Text style={s.recordCancelText}>Cancel</Text>
        </Pressable>
        <View style={s.recordCenter}>
          <RecordingWave isActive />
          <Text style={s.recordTimer}>{formatRecordTime(recordDurationMs)}</Text>
        </View>
        <Pressable style={s.recordStopBtn} onPress={onRecordStop}>
          <Square size={16} color="#111" strokeWidth={0} fill="#111" />
        </Pressable>
      </View>
    )
  }

  if (recordState === 'sending') {
    return (
      <View style={s.recordBar} onLayout={onLayout}>
        <ActivityIndicator size="small" color={Colors.brandOrange} />
        <Text style={s.sendingText}>Sending…</Text>
      </View>
    )
  }

  return (
    <View onLayout={onLayout}>
      {/* Media options panel — appears above the input bar in normal flow */}
      {showMediaMenu && (
        <View style={s.mediaPanel}>
          <Pressable style={s.mediaBtn} onPress={handleCamera}>
            <Camera size={22} color={Colors.inkPrimary} strokeWidth={1.8} />
            <Text style={s.mediaBtnLabel}>Camera</Text>
          </Pressable>
          <Pressable style={s.mediaBtn} onPress={handleLibrary}>
            <Images size={22} color={Colors.inkPrimary} strokeWidth={1.8} />
            <Text style={s.mediaBtnLabel}>Photos</Text>
          </Pressable>
          <Pressable style={s.mediaBtn} onPress={handleGif}>
            <Film size={22} color={Colors.inkPrimary} strokeWidth={1.8} />
            <Text style={s.mediaBtnLabel}>GIF</Text>
          </Pressable>
        </View>
      )}
      {replyingTo && (
        <ReplyBar msg={replyingTo} myId={myId} partnerName={partnerName} onCancel={onCancelReply} />
      )}
      <View style={s.inputBar}>
        <Pressable
          style={[s.addBtn, showMediaMenu && s.addBtnActive]}
          onPress={() => setShowMediaMenu(v => !v)}
          hitSlop={4}
        >
          <Plus size={18} color={showMediaMenu ? Colors.brandOrange : Colors.inkSecondary} strokeWidth={2.5} />
        </Pressable>
        <View style={s.inputWrap}>
          <TextInput
            ref={inputRef}
            nativeID="chat-input"
            style={s.textInput}
            value={inputText}
            onChangeText={t => { setShowMediaMenu(false); onTextChange(t) }}
            placeholder="Message…"
            placeholderTextColor={Colors.inkDisabled}
            multiline
          />
        </View>
        {inputText.trim() ? (
          <Pressable style={s.actionBtn} onPress={onSend}>
            <Send size={18} color="#111" strokeWidth={2} fill="#111" />
          </Pressable>
        ) : (
          <Pressable style={s.actionBtn} onPress={onMicPress}>
            <Mic size={20} color="#111" strokeWidth={2} />
          </Pressable>
        )}
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  blockNotice: {
    paddingHorizontal: 20, paddingVertical: 14,
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)', alignItems: 'center',
  },
  blockNoticeText: { fontFamily: FontFamily.bodyRegular, fontSize: 14, color: Colors.inkSecondary },
  blockBar: {
    paddingHorizontal: 20, paddingTop: 14, paddingBottom: 10,
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)', gap: 10,
  },
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
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
  },
  deleteBtnText: { fontFamily: FontFamily.bodySemiBold, fontSize: 14, color: Colors.brandCoral },
  recordBar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
    borderTopWidth: 1, borderTopColor: 'rgba(255,107,53,0.25)',
    backgroundColor: 'rgba(255,107,53,0.06)', gap: 12,
  },
  recordCancelBtn: {
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
  },
  recordCancelText: { fontFamily: FontFamily.bodyRegular, fontSize: 13, color: Colors.inkSecondary },
  recordCenter: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  recordTimer: { fontFamily: FontFamily.bodySemiBold, fontSize: 13, color: Colors.brandOrange, minWidth: 36, textAlign: 'right' },
  recordStopBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: Colors.brandOrange, alignItems: 'center', justifyContent: 'center', elevation: 4,
  },
  sendingText: { fontFamily: FontFamily.bodyRegular, fontSize: 14, color: Colors.inkSecondary, marginLeft: 8 },

  // Media options panel
  mediaPanel: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  mediaBtn: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingVertical: 12, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.05)',
    gap: 6,
  },
  mediaBtnLabel: {
    fontFamily: FontFamily.bodyRegular, fontSize: 12, color: Colors.inkSecondary,
  },

  // Input bar
  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end',
    paddingHorizontal: 10, paddingVertical: 8,
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)', gap: 8,
  },
  addBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center', justifyContent: 'center',
  },
  addBtnActive: {
    backgroundColor: 'rgba(255,107,53,0.12)',
  },
  inputWrap: {
    flex: 1, backgroundColor: '#1a1a1a',
    borderRadius: 20, borderWidth: 1, borderColor: '#2a2a2a',
    paddingHorizontal: 14, paddingVertical: 9,
    minHeight: 40, maxHeight: 120, justifyContent: 'center',
  },
  textInput: {
    fontFamily: FontFamily.bodyRegular, fontSize: 15,
    color: Colors.inkPrimary, lineHeight: 20,
    paddingTop: 0, paddingBottom: 0,
  },
  actionBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.brandOrange,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: Colors.brandOrange,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35, shadowRadius: 6, elevation: 4,
  },
})
