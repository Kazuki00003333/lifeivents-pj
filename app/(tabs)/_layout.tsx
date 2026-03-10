import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Home, CalendarRange, History, ShoppingBag } from 'lucide-react-native';
import { colors } from '@/lib/constants/colors';

const TAB_ICON_SIZE = 24;
const TAB_BAR_PADDING_TOP = 10;
const TAB_BAR_PADDING_BOTTOM_CONTENT = 10;

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const tabBarPaddingBottom = TAB_BAR_PADDING_BOTTOM_CONTENT + insets.bottom;

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
          paddingTop: TAB_BAR_PADDING_TOP,
          paddingBottom: tabBarPaddingBottom,
          minHeight: 56 + tabBarPaddingBottom,
          height: undefined,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          marginTop: 4,
        },
        tabBarIconStyle: {
          marginBottom: 0,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'ホーム',
          tabBarIcon: ({ color }) => (
            <Home size={TAB_ICON_SIZE} color={color} strokeWidth={2} />
          ),
        }}
      />
      <Tabs.Screen
        name="events"
        options={{
          title: 'カレンダー',
          tabBarIcon: ({ color }) => (
            <CalendarRange size={TAB_ICON_SIZE} color={color} strokeWidth={2} />
          ),
        }}
      />
      <Tabs.Screen
        name="timeline"
        options={{
          title: '年表',
          tabBarIcon: ({ color }) => (
            <History size={TAB_ICON_SIZE} color={color} strokeWidth={2} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'サービス',
          tabBarIcon: ({ color }) => (
            <ShoppingBag size={TAB_ICON_SIZE} color={color} strokeWidth={2} />
          ),
        }}
      />
    </Tabs>
  );
}
