import { useRef, useState } from 'react'
import { View, Text, StyleSheet, Modal, Pressable, ActivityIndicator } from 'react-native'
import { WebView } from 'react-native-webview'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { X, ArrowLeft, ArrowRight, RotateCw } from 'lucide-react-native'
import { hTap } from '@/lib/haptics'
import { Colors, FontFamily } from '@/constants'

interface Props {
  visible: boolean
  url: string | null
  onClose: () => void
}

export function InAppBrowserModal({ visible, url, onClose }: Props) {
  const insets = useSafeAreaInsets()
  const webRef = useRef<WebView>(null)
  const [loading, setLoading] = useState(true)
  const [canGoBack, setCanGoBack] = useState(false)
  const [title, setTitle] = useState('')

  if (!visible || !url) return null

  let hostname = url
  try { hostname = new URL(url).hostname } catch {}

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[s.root, { paddingTop: insets.top }]}>
        <View style={s.header}>
          <Pressable onPress={() => { hTap(); onClose() }} style={s.iconBtn} hitSlop={8}>
            <X size={20} color={Colors.inkPrimary} strokeWidth={2} />
          </Pressable>
          <View style={s.titleWrap}>
            <Text style={s.title} numberOfLines={1}>{title || hostname}</Text>
            <Text style={s.hostname} numberOfLines={1}>{hostname}</Text>
          </View>
          <Pressable
            onPress={() => { hTap(); webRef.current?.reload() }}
            style={s.iconBtn}
            hitSlop={8}
          >
            <RotateCw size={17} color={Colors.inkSecondary} strokeWidth={2} />
          </Pressable>
        </View>

        <View style={{ flex: 1 }}>
          <WebView
            ref={webRef}
            source={{ uri: url }}
            style={s.web}
            onLoadStart={() => setLoading(true)}
            onLoadEnd={() => setLoading(false)}
            onNavigationStateChange={nav => {
              setCanGoBack(nav.canGoBack)
              if (nav.title) setTitle(nav.title)
            }}
            startInLoadingState
          />
          {loading && (
            <View style={[StyleSheet.absoluteFill, s.loadingOverlay]} pointerEvents="none">
              <ActivityIndicator color={Colors.brandOrange} />
            </View>
          )}
        </View>

        {canGoBack && (
          <View style={[s.navBar, { paddingBottom: insets.bottom + 8 }]}>
            <Pressable onPress={() => { hTap(); webRef.current?.goBack() }} style={s.navBtn} hitSlop={8}>
              <ArrowLeft size={18} color={Colors.inkPrimary} strokeWidth={2} />
            </Pressable>
            <Pressable onPress={() => { hTap(); webRef.current?.goForward() }} style={s.navBtn} hitSlop={8}>
              <ArrowRight size={18} color={Colors.inkPrimary} strokeWidth={2} />
            </Pressable>
          </View>
        )}
      </View>
    </Modal>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 12, paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.divider,
  },
  iconBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: Colors.surface,
    alignItems: 'center', justifyContent: 'center',
  },
  titleWrap: { flex: 1, alignItems: 'center' },
  title: { fontFamily: FontFamily.bodySemiBold, fontSize: 14, color: Colors.inkPrimary },
  hostname: { fontFamily: FontFamily.bodyRegular, fontSize: 11, color: Colors.inkDisabled, marginTop: 1 },
  web: { flex: 1, backgroundColor: Colors.background },
  loadingOverlay: {
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.background,
  },
  navBar: {
    flexDirection: 'row', gap: 12,
    paddingHorizontal: 16, paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: Colors.divider,
  },
  navBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: Colors.surface,
    alignItems: 'center', justifyContent: 'center',
  },
})
