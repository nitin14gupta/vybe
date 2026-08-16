import { useEffect, useMemo } from "react";
import { useRouter } from "expo-router";
import { Tabs, TabList, TabSlot, TabTrigger } from "expo-router/ui";
import { StyleSheet, View, Text } from "react-native";
import { Image } from "expo-image";
import { Home, Ticket, MessageCircle, User } from "lucide-react-native";
import {
  GlassTabBar,
  GlassTabButton,
  TabBarMinimizeProvider,
  renderFadingTabScreen,
  type GlassTabItem,
} from "expo-glass-tabs";
import { Colors, FontFamily } from "@/constants";
import { useProfile } from "@/hooks/useProfile";
import { useInboxSocket } from "@/hooks/useInboxSocket";
import { useChatUnreadStore, syncChatUnreadCount } from "@/store/chatUnreadStore";

type Item = GlassTabItem & { href: string };

export default function TabsLayout() {
  const router = useRouter();
  const { profile } = useProfile();
  const avatarUrl = profile?.photos?.[0]?.url;
  const unreadCount = useChatUnreadStore((s) => s.unreadCount);

  useEffect(() => {
    syncChatUnreadCount();
  }, []);

  useInboxSocket(syncChatUnreadCount);

  const items = useMemo<Item[]>(
    () => [
      {
        name: "index",
        href: "/(tabs)/",
        label: "Home",
        renderIcon: ({ tint, size }) => <Home size={size} color={tint} strokeWidth={2.2} />,
      },
      {
        name: "events",
        href: "/(tabs)/events",
        label: "Events",
        renderIcon: ({ tint, size }) => <Ticket size={size} color={tint} strokeWidth={2.2} />,
      },
      {
        name: "chat",
        href: "/(tabs)/chat",
        label: "Chat",
        renderIcon: ({ tint, size }) => (
          <View>
            <MessageCircle size={size} color={tint} strokeWidth={2.2} />
            {unreadCount > 0 && (
              <View style={styles.chatBadge}>
                <Text style={styles.chatBadgeText}>{unreadCount > 9 ? "9+" : unreadCount}</Text>
              </View>
            )}
          </View>
        ),
      },
      {
        name: "profile",
        href: "/(tabs)/profile",
        label: "Profile",
        renderIcon: ({ tint, size }) =>
          avatarUrl ? (
            <View style={[styles.avatarWrap, { width: size, height: size, borderRadius: size / 2, borderColor: tint }]}>
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
            <User size={size} color={tint} strokeWidth={2.2} />
          ),
      },
    ],
    [avatarUrl, unreadCount]
  );

  return (
    <TabBarMinimizeProvider>
      <Tabs style={styles.root}>
        <TabSlot style={{ height: "100%" }} renderFn={renderFadingTabScreen} />
        <TabList asChild>
          <GlassTabBar onIndexSelected={(i) => router.navigate(items[i].href as never)}>
            {items.map(({ href, ...item }, index) => (
              <TabTrigger key={item.name} name={item.name} href={href as never} asChild>
                <GlassTabButton item={item} index={index} />
              </TabTrigger>
            ))}
          </GlassTabBar>
        </TabList>
      </Tabs>
    </TabBarMinimizeProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  avatarWrap: {
    overflow: "hidden",
    borderWidth: 1.5,
  },
  avatarImg: {
    width: "100%",
    height: "100%",
  },
  chatBadge: {
    position: "absolute",
    top: -4,
    right: -8,
    minWidth: 15,
    height: 15,
    borderRadius: 8,
    paddingHorizontal: 3,
    backgroundColor: Colors.notificationRed,
    alignItems: "center",
    justifyContent: "center",
  },
  chatBadgeText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 9,
    color: Colors.white,
  },
});
