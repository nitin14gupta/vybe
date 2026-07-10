import React from 'react'
import { StyleSheet, Text, TextInput, View, Modal, FlatList, Pressable, ActivityIndicator } from 'react-native'
import { MapPin, X, Search } from 'lucide-react-native'
import { Colors, FontFamily } from '@/constants'
import LiquidPlasmaBackground from '@/components/LiquidPlasmaBackground'
import { Screen } from '@/components/ui'

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
      <Screen bottom={false} transparent>
        <LiquidPlasmaBackground colors={['#1a0525', '#b73c10ff']} />
        
        <View style={s.modalHeader}>
          <Pressable onPress={onClose} style={s.iconBtn}>
            <X size={20} color="#fff" />
          </Pressable>
          <Text style={s.modalTitle}>Location</Text>
          <View style={{ width: 38 }} />
        </View>

        <View style={s.searchWrap}>
          <Search size={18} color={Colors.glassTextDisabled} />
          <TextInput
            style={s.searchInput}
            placeholder="Place name, address, or link"
            placeholderTextColor={Colors.glassTextDisabled}
            value={query}
            onChangeText={setQuery}
            autoFocus
          />
          {loading && <ActivityIndicator color="#fff" size="small" />}
        </View>

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
              <MapPin size={20} color="#fff" style={{ marginTop: 2, marginRight: 12 }} />
              <View style={{ flex: 1 }}>
                <Text style={s.resultName} numberOfLines={1}>{item.name || item.display_name.split(',')[0]}</Text>
                <Text style={s.resultAddress} numberOfLines={2}>{item.display_name}</Text>
              </View>
            </Pressable>
          )}
        />
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
    fontSize: 17, color: '#fff',
  },
  searchWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.glassSurface,
    marginHorizontal: 16, marginTop: 12, marginBottom: 20,
    borderRadius: 24, paddingHorizontal: 16, height: 48,
    borderWidth: 1, borderColor: Colors.glassBorder,
  },
  searchInput: {
    flex: 1, color: '#fff',
    fontFamily: FontFamily.bodyRegular, fontSize: 15,
    marginLeft: 10, paddingVertical: 10,
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
    fontFamily: FontFamily.bodySemiBold, fontSize: 15, color: '#fff',
    marginBottom: 4,
  },
  resultAddress: {
    fontFamily: FontFamily.bodyRegular, fontSize: 13, color: Colors.glassTextDisabled,
  },
})
