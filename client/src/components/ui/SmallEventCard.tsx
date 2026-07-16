import React from 'react'
import { View, Text, Pressable, StyleSheet, Image } from 'react-native'
import { Colors, FontFamily } from '@/constants'
import { router } from 'expo-router'
import { EventSummary } from '@/api/apiService'

function formatPrice(price: number) {
  if (price === 0) return 'Free'
  if (price >= 1000) {
    return '₹' + (price / 1000).toFixed(price % 1000 === 0 ? 0 : 1) + 'k'
  }
  return '₹' + price
}

export function SmallEventCard({ event }: { event: EventSummary }) {
  const dateObj = new Date(event.date_time)
  const dayStr = dateObj.toLocaleDateString('en-US', { day: 'numeric' })
  const monthStr = dateObj.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()
  const timeStr = dateObj.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })

  return (
    <Pressable
      style={({ pressed }) => [s.card, pressed && { opacity: 0.8 }]}
      onPress={() => router.push(`/(events)/${event.id}` as any)}
    >
      <View style={s.imageContainer}>
        {event.cover_photos?.[0]?.url ? (
          <Image source={{ uri: event.cover_photos[0].url }} style={s.image} />
        ) : (
          <View style={[s.image, s.imageFallback]}>
            <Text style={s.fallbackMonth}>{monthStr}</Text>
            <Text style={s.fallbackDay}>{dayStr}</Text>
          </View>
        )}
      </View>

      <View style={s.content}>
        <Text style={s.title} numberOfLines={1}>{event.title}</Text>
        <Text style={s.subtitle} numberOfLines={1}>
          {timeStr}
        </Text>
      </View>
    </Pressable>
  )
}

const s = StyleSheet.create({
  card: {
    width: 300,
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  imageContainer: {
    width: 112,
    height: 63,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#2A2A2A',
    marginRight: 14,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,107,53,0.1)',
  },
  fallbackMonth: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 11,
    color: Colors.brandOrange,
    marginBottom: 0,
  },
  fallbackDay: {
    fontFamily: FontFamily.headingBold,
    fontSize: 16,
    color: Colors.brandOrange,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 15,
    color: Colors.inkPrimary,
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: 12,
    color: Colors.inkSecondary,
    marginBottom: 6,
  },
  priceWrap: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  priceText: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: 11,
    color: Colors.inkSecondary,
  },
})
