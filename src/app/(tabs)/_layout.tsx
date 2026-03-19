import React from 'react';
import { Tabs } from 'expo-router';
import { View } from 'react-native';
import { Image } from 'expo-image';
import { Home, Calendar, Film, User, Users, Mic } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useStore } from '@/lib/store';
import { useUnreadMessages } from '@/lib/useUnreadMessages';
import { useUnreadNotifications } from '@/lib/useUnreadNotifications';

export default function TabLayout() {
  const currentUserAvatar = useStore((s) => s.currentUser?.avatar);
  const darkMode = useStore((s) => s.darkMode);

  // Run hooks so notification + message counts are always fetched when user is on tabs
  useUnreadMessages();
  useUnreadNotifications();

  const tabBarBg = darkMode ? '#1F2937' : '#FAF7F2';
  const tabBarBorder = darkMode ? '#374151' : '#EDE8E0';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: tabBarBg,
          borderTopWidth: 1,
          borderTopColor: tabBarBorder,
          height: 85,
          paddingTop: 10,
          paddingBottom: 25,
        },
        tabBarActiveTintColor: darkMode ? '#F59E0B' : '#D4673A',
        tabBarInactiveTintColor: darkMode ? '#9CA3AF' : '#8B7355',
        tabBarShowLabel: false,
      }}
      screenListeners={{
        tabPress: () => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View className={`items-center justify-center ${focused ? 'scale-110' : ''}`}>
              <Home size={26} color={color} strokeWidth={focused ? 2.5 : 2} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="events"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View className={`items-center justify-center ${focused ? 'scale-110' : ''}`}>
              <Calendar size={26} color={color} strokeWidth={focused ? 2.5 : 2} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="voice-rooms"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View className={`items-center justify-center ${focused ? 'scale-110' : ''}`}>
              <Mic size={26} color={color} strokeWidth={focused ? 2.5 : 2} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="clips"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View className={`items-center justify-center ${focused ? 'scale-110' : ''}`}>
              <Film size={26} color={color} strokeWidth={focused ? 2.5 : 2} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="marketplace"
        options={{
          href: null, // Hidden from tab bar
        }}
      />
      <Tabs.Screen
        name="community"
        options={{
          href: null, // Hidden from tab bar (opened from Home hub)
        }}
      />
      <Tabs.Screen
        name="connect"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View className={`items-center justify-center ${focused ? 'scale-110' : ''}`}>
              <Users size={26} color={color} strokeWidth={focused ? 2.5 : 2} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View className={`items-center justify-center ${focused ? 'scale-110' : ''}`}>
              {currentUserAvatar ? (
                <View
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 14,
                    borderWidth: focused ? 2 : 1.5,
                    borderColor: focused ? '#D4673A' : color,
                    overflow: 'hidden',
                  }}
                >
                  <Image
                    source={{ uri: currentUserAvatar }}
                    style={{ width: '100%', height: '100%' }}
                    contentFit="cover"
                  />
                </View>
              ) : (
                <User size={26} color={color} strokeWidth={focused ? 2.5 : 2} />
              )}
            </View>
          ),
        }}
      />
      {/* Hidden tabs - still accessible via navigation but not shown in tab bar */}
      <Tabs.Screen
        name="create"
        options={{
          href: null, // Hides from tab bar - accessible via floating button
        }}
      />
    </Tabs>
  );
}
