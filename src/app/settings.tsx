import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, Switch, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Bell, BellOff, ChevronRight, Shield, CircleHelp, LogOut } from 'lucide-react-native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useStore } from '@/lib/store';
import { requestNotificationPermissions, areNotificationsEnabled } from '@/lib/notifications';
import { signOut } from '@/lib/auth';

export default function SettingsScreen() {
  const notificationsEnabled = useStore((s) => s.notificationsEnabled);
  const setNotificationsEnabled = useStore((s) => s.setNotificationsEnabled);
  const currentUser = useStore((s) => s.currentUser);
  const [systemNotificationsEnabled, setSystemNotificationsEnabled] = useState(true);

  // Check system notification permissions on mount
  useEffect(() => {
    const checkPermissions = async () => {
      const enabled = await areNotificationsEnabled();
      setSystemNotificationsEnabled(enabled);
    };
    checkPermissions();
  }, []);

  const handleToggleNotifications = async (value: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (value && !systemNotificationsEnabled) {
      // Need to request permissions first
      const granted = await requestNotificationPermissions();
      if (granted) {
        setSystemNotificationsEnabled(true);
        setNotificationsEnabled(true);
      } else {
        // Open settings if permission denied
        Linking.openSettings();
      }
    } else {
      setNotificationsEnabled(value);
    }
  };

  const handleLogout = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await signOut();
      router.replace('/welcome');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <View className="flex-1 bg-cream">
      <SafeAreaView edges={['top']} className="flex-1">
        {/* Header */}
        <Animated.View
          entering={FadeIn.duration(300)}
          className="flex-row items-center px-5 pt-4 pb-4"
        >
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.back();
            }}
            className="mr-4 p-1"
            hitSlop={8}
          >
            <ArrowLeft size={24} color="#2D1F1A" />
          </Pressable>
          <Text className="text-xl font-bold text-warmBrown">Settings</Text>
        </Animated.View>

        <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
          {/* Notifications Section */}
          <Animated.View entering={FadeInUp.duration(300).delay(100)}>
            <Text className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 mt-4">
              Notifications
            </Text>

            <View className="bg-white rounded-2xl overflow-hidden shadow-sm">
              {/* Local Post Notifications */}
              <View className="flex-row items-center p-4 border-b border-gray-100">
                <View className="bg-terracotta-50 rounded-full p-2.5 mr-3">
                  {notificationsEnabled ? (
                    <Bell size={20} color="#D4673A" />
                  ) : (
                    <BellOff size={20} color="#9CA3AF" />
                  )}
                </View>
                <View className="flex-1">
                  <Text className="text-warmBrown font-medium">Local Post Alerts</Text>
                  <Text className="text-gray-500 text-sm mt-0.5">
                    Get notified when someone posts in your city
                  </Text>
                </View>
                <Switch
                  value={notificationsEnabled}
                  onValueChange={handleToggleNotifications}
                  trackColor={{ false: '#E5E7EB', true: '#D4673A' }}
                  thumbColor="#FFFFFF"
                />
              </View>

              {!systemNotificationsEnabled && (
                <Pressable
                  onPress={() => Linking.openSettings()}
                  className="flex-row items-center p-4 bg-amber-50"
                >
                  <Text className="flex-1 text-amber-700 text-sm">
                    Notifications are disabled in system settings. Tap to enable.
                  </Text>
                  <ChevronRight size={18} color="#B45309" />
                </Pressable>
              )}
            </View>
          </Animated.View>

          {/* About Section */}
          <Animated.View entering={FadeInUp.duration(300).delay(200)}>
            <Text className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 mt-6">
              About
            </Text>

            <View className="bg-white rounded-2xl overflow-hidden shadow-sm">
              <Pressable className="flex-row items-center p-4 border-b border-gray-100">
                <View className="bg-forest-50 rounded-full p-2.5 mr-3">
                  <Shield size={20} color="#1B4D3E" />
                </View>
                <Text className="flex-1 text-warmBrown font-medium">Privacy Policy</Text>
                <ChevronRight size={18} color="#9CA3AF" />
              </Pressable>

              <Pressable className="flex-row items-center p-4">
                <View className="bg-gold-50 rounded-full p-2.5 mr-3">
                  <CircleHelp size={20} color="#C9A227" />
                </View>
                <Text className="flex-1 text-warmBrown font-medium">Help & Support</Text>
                <ChevronRight size={18} color="#9CA3AF" />
              </Pressable>
            </View>
          </Animated.View>

          {/* Account Section */}
          {currentUser && (
            <Animated.View entering={FadeInUp.duration(300).delay(300)}>
              <Text className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 mt-6">
                Account
              </Text>

              <View className="bg-white rounded-2xl overflow-hidden shadow-sm">
                <Pressable
                  onPress={handleLogout}
                  className="flex-row items-center p-4"
                >
                  <View className="bg-red-50 rounded-full p-2.5 mr-3">
                    <LogOut size={20} color="#EF4444" />
                  </View>
                  <Text className="flex-1 text-red-500 font-medium">Log Out</Text>
                </Pressable>
              </View>
            </Animated.View>
          )}

          {/* App Version */}
          <Animated.View
            entering={FadeInUp.duration(300).delay(400)}
            className="items-center mt-8 mb-8"
          >
            <Text className="text-gray-400 text-sm">AfroConnect v1.0.0</Text>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
