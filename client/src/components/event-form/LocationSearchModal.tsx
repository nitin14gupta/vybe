import React from 'react'
import { StyleSheet, Text, View, Modal, FlatList, Pressable } from 'react-native'
import { MapPin, X, Search } from 'lucide-react-native'
import { AutoSkeletonView } from 'react-native-auto-skeleton'
import { Colors, FontFamily } from '@/constants'
import { Screen, GlassInput } from '@/components/ui'

interface LocationSearchModalProps {
  visible: boolean
  onClose: () => void
  query: string
  setQuery: (q: string) => void
  results: any[]
  loading: boolean
  onSelect: (item: any) => void
}

export function LocationSearchModal({
  visible,
  onClose,
  query,
  setQuery,
  results,
  loading,
  onSelect
}: LocationSearchModalProps) {
  return (
    <Modal visible={visible} animationType="slide" transparent>
      <Screen bottom={false}>
        <View style={s.modalHeader}>
          <Pressable onPress={onClose} style={s.iconBtn}>
            <X size={20} color={Colors.inkPrimary} />
          </Pressable>
          <Text style={s.modalTitle}>Location</Text>
          <View style={{ width: 38 }} />
        </View>

        <GlassInput
          style={s.searchWrap}
          leftIcon={<Search size={18} color={Colors.glassTextDisabled} />}
          placeholder="Place name, address, or link"
          value={query}
          onChangeText={setQuery}
          autoFocus
        />

        {loading ? (
          <AutoSkeletonView isLoading animationType="gradient" defaultRadius={7} gradientColors={[Colors.skeletonAlt, Colors.skeletonAltHighlight]}>
            {Array.from({ length: 6 }).map((_, i) => (
              <View key={i} style={s.skRow}>
                <View style={s.skIcon} />
                <View style={s.skInfo}>
                  <View style={s.skLineName} />
                  <View style={s.skLineAddress} />
                </View>
              </View>
            ))}
          </AutoSkeletonView>
        ) : (
          <FlatList
            data={results}
            keyExtractor={item => item.place_id.toString()}
            contentContainerStyle={s.listContent}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <Pressable
                style={s.resultItem}
                onPress={() => onSelect(item)}
              >
                <MapPin size={20} color={Colors.inkPrimary} style={{ marginTop: 2, marginRight: 12 }} />
                <View style={{ flex: 1 }}>
                  <Text style={s.resultName} numberOfLines={1}>{item.name || item.display_name.split(',')[0]}</Text>
                  <Text style={s.resultAddress} numberOfLines={2}>{item.display_name}</Text>
                </View>
              </Pressable>
            )}
            ListFooterComponent={query.trim() ? (
              <Pressable
                style={s.customRow}
                onPress={() => onSelect({ place_id: 'custom', display_name: query.trim(), lat: null, lon: null })}
              >
                <Search size={20} color={Colors.brandOrange} style={{ marginTop: 2, marginRight: 12 }} />
                <View style={{ flex: 1 }}>
                  <Text style={s.customRowTitle} numberOfLines={2}>Use "{query.trim()}" as my address</Text>
                  <Text style={s.customRowSub}>Not in the list? Type it out, then drop the pin on the map yourself</Text>
                </View>
              </Pressable>
            ) : null}
          />
        )}
      </Screen>
    </Modal>
  )
}

const s = StyleSheet.create({
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  iconBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: Colors.glassSurface,
    alignItems: 'center', justifyContent: 'center',
  },
  modalTitle: {
    fontFamily: FontFamily.headingBold,
    fontSize: 17, color: Colors.inkPrimary,
  },
  searchWrap: {
    marginHorizontal: 16, marginTop: 12, marginBottom: 20,
  },
  listContent: {
    paddingHorizontal: 16, paddingBottom: 40,
  },
  resultItem: {
    flexDirection: 'row', alignItems: 'flex-start',
    paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: Colors.glassSurface,
  },
  resultName: {
    fontFamily: FontFamily.bodySemiBold, fontSize: 15, color: Colors.inkPrimary,
    marginBottom: 4,
  },
  resultAddress: {
    fontFamily: FontFamily.bodyRegular, fontSize: 13, color: Colors.glassTextDisabled,
  },
  customRow: {
    flexDirection: 'row', alignItems: 'flex-start',
    paddingVertical: 16, paddingTop: 18,
    borderTopWidth: 1, borderTopColor: Colors.glassSurface,
  },
  customRowTitle: {
    fontFamily: FontFamily.bodySemiBold, fontSize: 15, color: Colors.brandOrange,
    marginBottom: 4,
  },
  customRowSub: {
    fontFamily: FontFamily.bodyRegular, fontSize: 12, color: Colors.glassTextDisabled,
  },
  skRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12, gap: 14 },
  skIcon: { width: 52, height: 52, borderRadius: 26, backgroundColor: Colors.skeletonAlt },
  skInfo: { flex: 1, gap: 8 },
  skLineName: { height: 14, width: '55%', borderRadius: 7, backgroundColor: Colors.skeletonAlt },
  skLineAddress: { height: 12, width: '35%', borderRadius: 6, backgroundColor: Colors.skeletonAlt },
})
