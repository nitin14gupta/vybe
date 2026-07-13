import { useEffect, useRef, useState } from "react";
import { Tabs, router } from "expo-router";
import { StyleSheet, Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { Ticket, MessageCircle, User, Home, Plus } from "lucide-react-native";
import { Colors, ComponentSize } from "@/constants";
import { hTap } from "@/lib/haptics";
import { useProfile } from "@/hooks/useProfile";
import { CreateEventSheet, TabTooltip } from "@/components/ui";

const TOOLTIP_MS = 1200;

function TabButton({ label, ref: _ref, onLongPress, onPress, children, style, ...props }: any) {
  const [tooltip, setTooltip] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); }, []);

  return (
    <Pressable
      {...props}
      onPress={onPress}
      onLongPress={(e: any) => {
        hTap();
        setTooltip(true);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => setTooltip(false), TOOLTIP_MS);
        onLongPress?.(e);
      }}
      android_ripple={null}
      style={[style, styles.tabButton]}
    >
      <TabTooltip label={label} visible={tooltip} />
      {children}
    </Pressable>
  );
}

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const { profile } = useProfile();
  const [createOpen, setCreateOpen] = useState(false);

  const avatarUrl = profile?.photos?.[0]?.url;

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
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Home",
            tabBarIcon: ({ color }) => (
              <Home size={24} color={color} strokeWidth={1.8} />
            ),
            tabBarButton: (props) => <TabButton {...props} label="Home" />,
          }}
        />
        <Tabs.Screen
          name="events"
          options={{
            title: "Events",
            tabBarIcon: ({ color }) => (
              <Ticket size={24} color={color} strokeWidth={1.8} />
            ),
            tabBarButton: (props) => <TabButton {...props} label="Events" />,
          }}
        />
        <Tabs.Screen
          name="create"
          options={{
            title: "Create",
            tabBarIcon: ({ color }) => (
              <View style={[styles.createIcon]}>
                <Plus size={18} color={color} strokeWidth={2} />
              </View>
            ),
            tabBarButton: (props) => (
              <TabButton
                {...props}
                label="Create"
                onPress={() => { hTap(); setCreateOpen(true); }}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="chat"
          options={{
            title: "Chat",
            tabBarIcon: ({ color }) => (
              <MessageCircle size={24} color={color} strokeWidth={1.8} />
            ),
            tabBarButton: (props) => <TabButton {...props} label="Chat" />,
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
                <User size={24} color={color} strokeWidth={1.8} />
              ),
            tabBarButton: (props) => <TabButton {...props} label="Profile" />,
          }}
        />
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
    paddingTop: 16,
    elevation: 0,
    shadowOpacity: 0,
  },
  tabButton: {
    position: "relative",
  },
  createIcon: {
    width: 32,
    height: 28,
    borderRadius: 7,
    borderWidth: 1.8,
    alignItems: "center",
    justifyContent: "center",
    borderColor: Colors.inkSecondary,
  },
  avatarWrap: {
    width: 24,
    height: 24,
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
