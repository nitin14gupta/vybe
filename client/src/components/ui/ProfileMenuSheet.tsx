import { useState, useRef, useEffect } from 'react'
import { View, Text, StyleSheet, Pressable, Share } from 'react-native'
import { BottomSheetModal, BottomSheetView, BottomSheetBackdrop } from '@gorhom/bottom-sheet'
import type { BottomSheetBackdropProps } from '@gorhom/bottom-sheet'
import * as Clipboard from 'expo-clipboard'
import { Ban, Flag, Link2, Share2 } from 'lucide-react-native'
import { hError, hSuccess, hTap } from '@/lib/haptics'
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

function renderBackdrop(props: BottomSheetBackdropProps) {
  return <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} pressBehavior="close" opacity={0.55} />
}

function ProfileMenuSheetCore({ username, targetName, isBlocked, onBlock, onUnblock, onReport, onClose }: Omit<Props, 'visible'>) {
  const sheetRef = useRef<BottomSheetModal>(null)
  const [blockOpen, setBlockOpen] = useState(false)
  const [reportOpen, setReportOpen] = useState(false)
  const [blockLoading, setBlockLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const transitioning = useRef(false)

  useEffect(() => { sheetRef.current?.present() }, [])

  const openBlock = () => {
    isBlocked ? hTap() : hError()
    transitioning.current = true
    setBlockOpen(true)
    sheetRef.current?.dismiss()
  }

  const openReport = () => {
    hTap()
    transitioning.current = true
    setReportOpen(true)
    sheetRef.current?.dismiss()
  }

  const handleDismiss = () => {
    if (transitioning.current) { transitioning.current = false; return }
    onClose()
  }

  const handleBlock = async () => {
    setBlockLoading(true)
    try { await onBlock() }
    finally { setBlockLoading(false); setBlockOpen(false); onClose() }
  }

  const handleUnblock = async () => {
    setBlockLoading(true)
    try { await onUnblock() }
    finally { setBlockLoading(false); setBlockOpen(false); onClose() }
  }

  const handleCopyUrl = async () => {
    hSuccess()
    const url = username ? `vybe://profile/${username}` : `vybe://profile`
    await Clipboard.setStringAsync(url)
    setCopied(true)
    setTimeout(() => { setCopied(false); onClose() }, 900)
  }

  const handleShare = async () => {
    hTap()
    const handle = username ? `@${username}` : targetName ?? 'this person'
    const url = username ? `vybe://profile/${username}` : ''
    await Share.share({ message: `Check out ${handle} on Vybe${url ? `: ${url}` : ''}` })
    onClose()
  }

  return (
    <>
      <BottomSheetModal
        ref={sheetRef}
        enableDynamicSizing
        enablePanDownToClose
        onDismiss={handleDismiss}
        backdropComponent={renderBackdrop}
        backgroundStyle={s.bg}
        handleIndicatorStyle={s.handleIndicator}
      >
        <BottomSheetView style={s.content}>
          <Pressable style={s.row} onPress={openBlock}>
            <Ban size={20} color={isBlocked ? Colors.brandOrange : Colors.inkPrimary} strokeWidth={1.8} />
            <Text style={[s.rowText, isBlocked && s.rowTextOrange]}>{isBlocked ? 'Unblock User' : 'Block User'}</Text>
          </Pressable>
          <Pressable style={s.row} onPress={openReport}>
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
          <Pressable style={s.cancelRow} onPress={() => { hTap(); onClose() }}>
            <Text style={s.cancelText}>Cancel</Text>
          </Pressable>
        </BottomSheetView>
      </BottomSheetModal>

      <BlockSheet
        visible={blockOpen}
        targetName={targetName}
        isBlocked={isBlocked}
        loading={blockLoading}
        onBlock={handleBlock}
        onUnblock={handleUnblock}
        onClose={() => { setBlockOpen(false); onClose() }}
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

export function ProfileMenuSheet({ visible, ...rest }: Props) {
  if (!visible) return null
  return <ProfileMenuSheetCore {...rest} />
}

const s = StyleSheet.create({
  bg: { backgroundColor: Colors.elevated },
  handleIndicator: { backgroundColor: 'rgba(255,255,255,0.18)' },
  content: { paddingHorizontal: 8, paddingBottom: 36, paddingTop: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20, paddingVertical: 16, borderRadius: 12 },
  rowText: { fontFamily: FontFamily.bodyMedium, fontSize: 16, color: Colors.inkPrimary },
  rowTextOrange: { color: Colors.brandOrange },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: 'rgba(255,255,255,0.1)', marginHorizontal: 20, marginVertical: 4 },
  cancelRow: { alignItems: 'center', paddingVertical: 14 },
  cancelText: { fontFamily: FontFamily.bodyMedium, fontSize: 15, color: Colors.inkSecondary },
})
