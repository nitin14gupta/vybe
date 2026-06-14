import { Tabs } from 'expo-router'
import { View, StyleSheet } from 'react-native'
import { Home, Compass, PlusCircle, Bell, User } from 'lucide-react-native'
import { Colors, ComponentSize } from '@/constants'

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: Colors.brandOrange,
        tabBarInactiveTintColor: Colors.inkSecondary,
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ tabBarIcon: ({ color }) => <Home size={24} color={color} strokeWidth={2} /> }}
      />
      <Tabs.Screen
        name="explore"
        options={{ tabBarIcon: ({ color }) => <Compass size={24} color={color} strokeWidth={2} /> }}
      />
      <Tabs.Screen
        name="create"
        options={{
          tabBarIcon: () => (
            <View style={styles.createBtn}>
              <PlusCircle size={28} color={Colors.background} strokeWidth={2} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{ tabBarIcon: ({ color }) => <Bell size={24} color={color} strokeWidth={2} /> }}
      />
      <Tabs.Screen
        name="profile"
        options={{ tabBarIcon: ({ color }) => <User size={24} color={color} strokeWidth={2} /> }}
      />
    </Tabs>
  )
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.surface,
    borderTopColor: Colors.divider,
    borderTopWidth: 1,
    height: ComponentSize.navBar,
    paddingBottom: 0,
  },
  createBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.brandOrange,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
})
