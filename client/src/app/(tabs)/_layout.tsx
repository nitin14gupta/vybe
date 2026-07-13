import { useState } from "react";
import { Tabs, router } from "expo-router";
import { StyleSheet, Pressable, View } from "react-native";
import type { GestureResponderEvent } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { Ticket, MessageCircle, User, Home, Plus } from "lucide-react-native";
import { Colors, ComponentSize } from "@/constants";
import { hTap } from "@/lib/haptics";
import { usePillStore } from "@/store/pillStore";
import { useProfile } from "@/hooks/useProfile";
import { CreateEventSheet } from "@/components/ui";

const APP_NAME = "Vybe";

// Wraps the default tab button so a long-press surfaces the app name pill,
// without touching normal tap-to-navigate behavior.
function makeTabButton(showPill: (msg: string) => void) {
  return function TabButton({ ref: _ref, ...props }: any) {
    return (
      <Pressable
        {...props}
        onLongPress={(e: GestureResponderEvent) => {
          hTap();
          showPill(APP_NAME);
          props.onLongPress?.(e);
        }}
      />
    );
  };
}

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const showPill = usePillStore((s) => s.show);
  const { profile } = useProfile();
  const [createOpen, setCreateOpen] = useState(false);

  const avatarUrl = profile?.photos?.[0]?.url;
  const TabButton = makeTabButton(showPill);

  return (
    <>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: [
            styles.tabBar,
            {
              height: ComponentSize.navBar,
              paddingBottom: insets.bottom,
            },
          ],
          tabBarActiveTintColor: Colors.brandOrange,
          tabBarInactiveTintColor: Colors.inkSecondary,
          tabBarShowLabel: false,
          tabBarButton: TabButton,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Home",
            tabBarIcon: ({ color }) => (
              <Home size={27} color={color} strokeWidth={1.8} />
            ),
          }}
        />
        <Tabs.Screen
          name="events"
          options={{
            title: "Events",
            tabBarIcon: ({ color }) => (
              <Ticket size={27} color={color} strokeWidth={1.8} />
            ),
          }}
        />
        <Tabs.Screen
          name="create"
          options={{
            title: "Create",
            tabBarIcon: ({ color }) => (
              <View style={styles.createIcon}>
                <Plus size={24} color="#fff" strokeWidth={2.5} />
              </View>
            ),
            tabBarButton: ({ ref: _ref, ...props }: any) => (
              <Pressable
                {...props}
                onPress={() => {
                  hTap();
                  setCreateOpen(true);
                }}
                onLongPress={() => {
                  hTap();
                  showPill(APP_NAME);
                }}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="chat"
          options={{
            title: "Chat",
            tabBarIcon: ({ color }) => (
              <MessageCircle size={27} color={color} strokeWidth={1.8} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: "Profile",
            tabBarIcon: ({ color, focused }) =>
              avatarUrl ? (
                <View style={[styles.avatarWrap, focused && styles.avatarWrapActive]}>
                  <Image source={{ uri: avatarUrl }} style={styles.avatarImg} contentFit="cover" />
                </View>
              ) : (
                <User size={27} color={color} strokeWidth={1.8} />
              ),
          }}
        />
        <Tabs.Screen name="search" options={{ href: null }} />
        <Tabs.Screen name="discover" options={{ href: null }} />
      </Tabs>

      <CreateEventSheet
        visible={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreateEvent={() => router.push("/(events)/create" as any)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.background,
    borderTopWidth: 0,
    paddingTop: 8,
    elevation: 0,
    shadowOpacity: 0,
  },
  createIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.brandOrange,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarWrap: {
    width: 27,
    height: 27,
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1.5,
    borderColor: "transparent",
  },
  avatarWrapActive: {
    borderColor: Colors.brandOrange,
  },
  avatarImg: {
    width: "100%",
    height: "100%",
  },
});
