import React from 'react';
import { Tabs } from 'expo-router';
import { View } from 'react-native';
import { Image } from 'expo-image';
import { Home, Search, PlusSquare, Bell, User } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useStore } from '@/lib/store';

export default function TabLayout() {
  const currentUserAvatar = useStore((s) => s.currentUser?.avatar);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#FAF7F2',
          borderTopWidth: 1,
          borderTopColor: '#EDE8E0',
          height: 85,
          paddingTop: 10,
          paddingBottom: 25,
        },
        tabBarActiveTintColor: '#D4673A',
        tabBarInactiveTintColor: '#8B7355',
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
        name="search"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View className={`items-center justify-center ${focused ? 'scale-110' : ''}`}>
              <Search size={26} color={color} strokeWidth={focused ? 2.5 : 2} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View className={`items-center justify-center ${focused ? 'scale-110' : ''}`}>
              <PlusSquare size={28} color={focused ? '#D4673A' : color} strokeWidth={focused ? 2.5 : 2} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View className={`items-center justify-center ${focused ? 'scale-110' : ''}`}>
              <Bell size={26} color={color} strokeWidth={focused ? 2.5 : 2} />
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
    </Tabs>
  );
}
