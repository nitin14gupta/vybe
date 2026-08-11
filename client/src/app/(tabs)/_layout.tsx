import { useEffect, useRef, useState } from "react";
import { Tabs, router } from "expo-router";
import { StyleSheet, Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Ticket, MessageCircle, User, Home, Plus } from "lucide-react-native";
import { Colors, ComponentSize } from "@/constants";
import { hTap } from "@/lib/haptics";
import { useProfile } from "@/hooks/useProfile";
import { CreateEventSheet, TabTooltip } from "@/components/ui";
import { tabBarTranslateY } from "@/lib/tabBarVisibility";

const TOOLTIP_MS = 1200;

// The tab bar floats over content on a soft black gradient and slides away
// on scroll (see src/lib/tabBarVisibility.ts).
function TabBarShadow() {
  return (
    <LinearGradient
      colors={[
        "transparent",
        "rgba(1,1,0,0.15)",
        "rgba(1,1,0,0.45)",
        "rgba(1,1,0,0.75)",
        Colors.background,
      ]}
      locations={[0, 0.25, 0.5, 0.75, 1]}
      style={StyleSheet.absoluteFill}
      pointerEvents="none"
    />
  );
}

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
    <View style={styles.root}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: [
            styles.tabBar,
            {
              height: ComponentSize.navBar,
              paddingBottom: insets.bottom,
            },
            styles.tabBarFloating,
            { transform: [{ translateY: tabBarTranslateY }] },
          ],
          tabBarBackground: () => <TabBarShadow />,
          tabBarActiveTintColor: Colors.inkPrimary,
          tabBarInactiveTintColor: Colors.inkPrimary,
          tabBarShowLabel: false,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Home",
            tabBarIcon: ({ color, focused }) => (
              <Home size={24} color={color} strokeWidth={focused ? 2.5 : 1.8} />
            ),
            tabBarButton: (props) => <TabButton {...props} label="Home" />,
          }}
        />
        <Tabs.Screen
          name="events"
          options={{
            title: "Events",
            tabBarIcon: ({ color, focused }) => (
              <Ticket size={24} color={color} strokeWidth={focused ? 2.5 : 1.8} />
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
            tabBarIcon: ({ color, focused }) => (
              <MessageCircle size={24} color={color} strokeWidth={focused ? 2.5 : 1.8} />
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
                  <Image
                    source={{ uri: avatarUrl }}
                    style={styles.avatarImg}
                    contentFit="cover"
                    cachePolicy="memory-disk"
                    priority="low"
                    transition={150}
                  />
                </View>
              ) : (
                <User size={24} color={color} strokeWidth={focused ? 2.5 : 1.8} />
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
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  tabBar: {
    backgroundColor: Colors.background,
    borderTopWidth: 0,
    paddingTop: 16,
    elevation: 0,
    shadowOpacity: 0,
  },
  tabBarFloating: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "transparent",
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
    borderColor: Colors.inkPrimary,
  },
  avatarWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1.5,
    borderColor: "transparent",
  },
  avatarWrapActive: {
    borderColor: Colors.inkPrimary,
  },
  avatarImg: {
    width: "100%",
    height: "100%",
  },
});
