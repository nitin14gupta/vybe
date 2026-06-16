import { Tabs } from "expo-router";
import { View, StyleSheet } from "react-native";
import {
  Compass,
  Ticket,
  Plus,
  MessageCircle,
  User,
} from "lucide-react-native";
import { Colors, ComponentSize } from "@/constants";
import { Screen } from "@/components/ui";

export default function TabsLayout() {
  return (
    // <Screen>
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: Colors.brandOrange,
        tabBarInactiveTintColor: Colors.inkSecondary,
        tabBarLabelStyle: styles.label,
        tabBarShowLabel: true,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Discover",
          tabBarIcon: ({ color }) => (
            <Compass size={22} color={color} strokeWidth={1.8} />
          ),
        }}
      />
      <Tabs.Screen
        name="events"
        options={{
          title: "Events",
          tabBarIcon: ({ color }) => (
            <Ticket size={22} color={color} strokeWidth={1.8} />
          ),
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          tabBarLabel: "",
          tabBarIcon: () => (
            <View style={styles.vybeBtn}>
              <Plus size={26} color={Colors.background} strokeWidth={2.5} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: "Chat",
          tabBarIcon: ({ color }) => (
            <MessageCircle size={22} color={color} strokeWidth={1.8} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) => (
            <User size={22} color={color} strokeWidth={1.8} />
          ),
        }}
      />

      {/* Hide unused screens */}
      <Tabs.Screen name="explore" options={{ href: null }} />
      <Tabs.Screen name="notifications" options={{ href: null }} />
    </Tabs>
    // </Screen>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.background,
    borderTopWidth: 0,
    height: ComponentSize.navBar,
    paddingBottom: 8,
    paddingTop: 4,
    elevation: 0,
    shadowOpacity: 0,
  },
  label: {
    fontSize: 10,
    fontWeight: "500",
    marginTop: 1,
  },
  vybeBtn: {
    width: ComponentSize.navCenter,
    height: ComponentSize.navCenter,
    borderRadius: ComponentSize.navCenter / 2,
    backgroundColor: Colors.brandOrange,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: ComponentSize.navCenterRaise,
    shadowColor: Colors.brandOrange,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
  },
});
