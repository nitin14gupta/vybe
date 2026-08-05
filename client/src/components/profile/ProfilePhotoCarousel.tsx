import { useState } from "react";
import { View, Text, Pressable, FlatList, Dimensions, StyleSheet } from "react-native";
import { Image as ExpoImage } from "expo-image";
import { Colors, FontFamily } from "@/constants";

const { width: W } = Dimensions.get("window");

interface Photo {
  id: string;
  url: string;
}

interface Props {
  photos: Photo[];
  name?: string | null;
  onOpenPhoto: (index: number) => void;
}

export function ProfilePhotoCarousel({ photos, name, onOpenPhoto }: Props) {
  const [photoIdx, setPhotoIdx] = useState(0);

  if (photos.length === 0) {
    return (
      <View style={s.photoFallback}>
        <Text style={s.photoFallbackInitial}>{(name ?? "?").charAt(0)}</Text>
      </View>
    );
  }

  return (
    <View>
      <FlatList
        data={photos}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(p) => p.id}
        onMomentumScrollEnd={(e) =>
          setPhotoIdx(Math.round(e.nativeEvent.contentOffset.x / W))
        }
        renderItem={({ item, index }) => (
          <Pressable onPress={() => onOpenPhoto(index)}>
            <ExpoImage
              source={{ uri: item.url }}
              style={{ width: W, height: W }}
              contentFit="cover"
              cachePolicy="memory-disk"
              priority="high"
              transition={150}
            />
          </Pressable>
        )}
      />
      {photos.length > 1 && (
        <View style={s.photoDots}>
          {photos.map((_, i) => (
            <View key={i} style={[s.photoDot, i === photoIdx && s.photoDotActive]} />
          ))}
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  photoFallback: {
    width: W,
    height: W * 1.2,
    backgroundColor: "#1a1a1a",
    alignItems: "center",
    justifyContent: "center",
  },
  photoFallbackInitial: {
    fontFamily: FontFamily.headingBold,
    fontSize: 96,
    color: Colors.inkSecondary,
  },
  photoDots: {
    position: "absolute",
    bottom: 12,
    flexDirection: "row",
    alignSelf: "center",
    gap: 6,
  },
  photoDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.4)",
  },
  photoDotActive: { backgroundColor: "#fff", width: 16 },
});
