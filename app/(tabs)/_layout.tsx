import { Tabs } from 'expo-router';
import { Home, CalendarRange, History, ShoppingBag } from 'lucide-react-native';
import { colors } from '@/lib/constants/colors';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.text.tertiary,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border.light,
          borderTopWidth: 1,
          paddingTop: 12,
          paddingBottom: 12,
          height: 80,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 6,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'ホーム',
          tabBarIcon: ({ size, color }) => (
            <Home size={size} color={color} strokeWidth={2} />
          ),
        }}
      />
      <Tabs.Screen
        name="events"
        options={{
          title: 'カレンダー',
          tabBarIcon: ({ size, color }) => (
            <CalendarRange size={size} color={color} strokeWidth={2} />
          ),
        }}
      />
      <Tabs.Screen
        name="timeline"
        options={{
          title: '年表',
          tabBarIcon: ({ size, color }) => (
            <History size={size} color={color} strokeWidth={2} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: '外部サービス',
          tabBarIcon: ({ size, color }) => (
            <ShoppingBag size={size} color={color} strokeWidth={2} />
          ),
        }}
      />
    </Tabs>
  );
}
