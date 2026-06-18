import React, { useState } from 'react'
import {
  Modal, View, Text, StyleSheet, Pressable, Share,
} from 'react-native'
import * as Clipboard from 'expo-clipboard'
import { Ban, Flag, Link2, Share2 } from 'lucide-react-native'
import { Colors, FontFamily } from '@/constants'
import { BlockSheet } from './BlockSheet'
import { ReportSheet } from './ReportSheet'

interface Props {
  visible: boolean
  username: string | null
  targetName: string | null
  isBlocked: boolean
  onBlock: () => Promise<void>
  onUnblock: () => Promise<void>
  onReport: (reason: string) => Promise<void>
  onClose: () => void
}

export function ProfileMenuSheet({
  visible, username, targetName, isBlocked,
  onBlock, onUnblock, onReport, onClose,
}: Props) {
  const [blockOpen, setBlockOpen] = useState(false)
  const [reportOpen, setReportOpen] = useState(false)
  const [blockLoading, setBlockLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleBlock = async () => {
    setBlockLoading(true)
    try {
      await onBlock()
    } finally {
      setBlockLoading(false)
      setBlockOpen(false)
      onClose()
    }
  }

  const handleUnblock = async () => {
    setBlockLoading(true)
    try {
      await onUnblock()
    } finally {
      setBlockLoading(false)
      setBlockOpen(false)
      onClose()
    }
  }

  const handleCopyUrl = async () => {
    const url = username ? `vybe://profile/${username}` : `vybe://profile`
    await Clipboard.setStringAsync(url)
    setCopied(true)
    setTimeout(() => { setCopied(false); onClose() }, 900)
  }

  const handleShare = async () => {
    const handle = username ? `@${username}` : targetName ?? 'this person'
    const url = username ? `vybe://profile/${username}` : ''
    await Share.share({
      message: `Check out ${handle} on Vybe${url ? `: ${url}` : ''}`,
    })
    onClose()
  }

  return (
    <>
      <Modal visible={visible && !blockOpen && !reportOpen} transparent animationType="slide" onRequestClose={onClose}>
        <Pressable style={s.backdrop} onPress={onClose} />
        <View style={s.sheet}>
          <View style={s.handle} />

          <Pressable style={s.row} onPress={() => setBlockOpen(true)}>
            <Ban size={20} color={isBlocked ? Colors.brandOrange : Colors.inkPrimary} strokeWidth={1.8} />
            <Text style={[s.rowText, isBlocked && s.rowTextOrange]}>
              {isBlocked ? 'Unblock User' : 'Block User'}
            </Text>
          </Pressable>

          <Pressable style={s.row} onPress={() => setReportOpen(true)}>
            <Flag size={20} color={Colors.inkPrimary} strokeWidth={1.8} />
            <Text style={s.rowText}>Report</Text>
          </Pressable>

          <Pressable style={s.row} onPress={handleCopyUrl}>
            <Link2 size={20} color={Colors.inkPrimary} strokeWidth={1.8} />
            <Text style={s.rowText}>{copied ? 'Copied!' : 'Copy Profile URL'}</Text>
          </Pressable>

          <Pressable style={s.row} onPress={handleShare}>
            <Share2 size={20} color={Colors.inkPrimary} strokeWidth={1.8} />
            <Text style={s.rowText}>Share Profile</Text>
          </Pressable>

          <View style={s.divider} />

          <Pressable style={s.cancelRow} onPress={onClose}>
            <Text style={s.cancelText}>Cancel</Text>
          </Pressable>
        </View>
      </Modal>

      <BlockSheet
        visible={blockOpen}
        targetName={targetName}
        isBlocked={isBlocked}
        loading={blockLoading}
        onBlock={handleBlock}
        onUnblock={handleUnblock}
        onClose={() => setBlockOpen(false)}
      />

      <ReportSheet
        visible={reportOpen}
        targetName={targetName}
        onSubmit={onReport}
        onClose={() => { setReportOpen(false); onClose() }}
      />
    </>
  )
}

const s = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  sheet: {
    backgroundColor: Colors.elevated,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 8,
    paddingBottom: 36,
    paddingTop: 12,
  },
  handle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignSelf: 'center', marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 12,
  },
  rowText: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: 16,
    color: Colors.inkPrimary,
  },
  rowTextOrange: {
    color: Colors.brandOrange,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginHorizontal: 20,
    marginVertical: 4,
  },
  cancelRow: {
    alignItems: 'center',
    paddingVertical: 14,
  },
  cancelText: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: 15,
    color: Colors.inkSecondary,
  },
})
