import { useEffect, useState } from 'react'
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native'
import { Image } from 'expo-image'
import { Link as LinkIcon } from 'lucide-react-native'
import { Colors, FontFamily } from '@/constants'
import ApiService, { type LinkPreview } from '@/api/apiService'

const CARD_WIDTH = 240

interface Props {
  url: string
  isMine: boolean
}

// Purely presentational — no Pressable/onPress of its own. The whole message
// bubble already has a working tap-to-open handler wired through the outer
// GestureDetector (see MessageBubble's handleSingleTap); adding a second,
// independent tap target here would hit the same nested-gesture conflict
// that broke video playback until it got the same treatment.
export function LinkPreviewCard({ url, isMine }: Props) {
  const [preview, setPreview] = useState<LinkPreview | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    ApiService.getLinkPreview(url)
      .then(p => { if (!cancelled) setPreview(p) })
      .catch(() => { if (!cancelled) setPreview(null) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [url])

  let hostname = preview?.hostname ?? ''
  if (!hostname) {
    try { hostname = new URL(url).hostname } catch { hostname = url }
  }

  if (loading) {
    return (
      <View style={[s.card, s.loadingCard]}>
        <ActivityIndicator size="small" color={isMine ? '#fff' : Colors.inkSecondary} />
      </View>
    )
  }

  const hasRichContent = !!(preview?.title || preview?.description || preview?.image)

  if (!hasRichContent) {
    // Fetch failed or the page had no OG tags — fall back to a plain,
    // still-tappable link row instead of an empty card.
    return (
      <View style={s.card}>
        <View style={s.plainRow}>
          <LinkIcon size={16} color={isMine ? '#fff' : Colors.brandOrange} strokeWidth={2} />
          <Text style={[s.plainUrl, isMine && s.textOnMine]} numberOfLines={1}>{hostname}</Text>
        </View>
      </View>
    )
  }

  return (
    <View style={s.card}>
      {preview?.image ? (
        <Image source={{ uri: preview.image }} style={s.image} contentFit="cover" />
      ) : null}
      <View style={s.body}>
        {preview?.title ? (
          <Text style={[s.title, isMine && s.textOnMine]} numberOfLines={2}>{preview.title}</Text>
        ) : null}
        {preview?.description ? (
          <Text style={[s.description, isMine && s.descOnMine]} numberOfLines={2}>{preview.description}</Text>
        ) : null}
        <Text style={[s.hostname, isMine && s.descOnMine]} numberOfLines={1}>{hostname}</Text>
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  card: { width: CARD_WIDTH, borderRadius: 14, overflow: 'hidden' },
  loadingCard: { height: 64, alignItems: 'center', justifyContent: 'center' },
  image: { width: CARD_WIDTH, height: Math.round(CARD_WIDTH * (9 / 16)), backgroundColor: Colors.elevated },
  body: { padding: 10, gap: 2 },
  title: { fontFamily: FontFamily.bodySemiBold, fontSize: 14, color: Colors.inkPrimary, lineHeight: 18 },
  description: { fontFamily: FontFamily.bodyRegular, fontSize: 12, color: Colors.inkSecondary, lineHeight: 16, marginTop: 1 },
  hostname: {
    fontFamily: FontFamily.bodyMedium, fontSize: 11, color: Colors.inkDisabled,
    marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.3,
  },
  textOnMine: { color: Colors.inkPrimary },
  descOnMine: { color: 'rgba(255,255,255,0.65)' },
  plainRow: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12 },
  plainUrl: { flex: 1, fontFamily: FontFamily.bodyMedium, fontSize: 14, color: Colors.brandOrange },
})
