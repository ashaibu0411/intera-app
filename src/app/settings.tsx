import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, Switch, Linking, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Bell, BellOff, ChevronRight, Shield, CircleHelp, LogOut, Trash2, AlertTriangle } from 'lucide-react-native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useStore } from '@/lib/store';
import { requestNotificationPermissions, areNotificationsEnabled } from '@/lib/notifications';
import { signOut, deleteAccount } from '@/lib/auth';

export default function SettingsScreen() {
  const notificationsEnabled = useStore((s) => s.notificationsEnabled);
  const setNotificationsEnabled = useStore((s) => s.setNotificationsEnabled);
  const currentUser = useStore((s) => s.currentUser);
  const [systemNotificationsEnabled, setSystemNotificationsEnabled] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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

  const handleDeleteAccount = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setIsDeleting(true);
    try {
      await deleteAccount();
      setShowDeleteModal(false);
      router.replace('/welcome');
    } catch (error) {
      console.error('Delete account error:', error);
      setIsDeleting(false);
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
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push('/privacy-policy');
                }}
                className="flex-row items-center p-4 border-b border-gray-100"
              >
                <View className="bg-forest-50 rounded-full p-2.5 mr-3">
                  <Shield size={20} color="#1B4D3E" />
                </View>
                <Text className="flex-1 text-warmBrown font-medium">Privacy Policy</Text>
                <ChevronRight size={18} color="#9CA3AF" />
              </Pressable>

              <Pressable
                onPress={() => Linking.openURL('mailto:support@diaspora.app?subject=Help%20Request')}
                className="flex-row items-center p-4"
              >
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
                  className="flex-row items-center p-4 border-b border-gray-100"
                >
                  <View className="bg-red-50 rounded-full p-2.5 mr-3">
                    <LogOut size={20} color="#EF4444" />
                  </View>
                  <Text className="flex-1 text-red-500 font-medium">Log Out</Text>
                </Pressable>

                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    setShowDeleteModal(true);
                  }}
                  className="flex-row items-center p-4"
                >
                  <View className="bg-red-50 rounded-full p-2.5 mr-3">
                    <Trash2 size={20} color="#DC2626" />
                  </View>
                  <Text className="flex-1 text-red-600 font-medium">Delete Account</Text>
                </Pressable>
              </View>
            </Animated.View>
          )}

          {/* App Version */}
          <Animated.View
            entering={FadeInUp.duration(300).delay(400)}
            className="items-center mt-8 mb-8"
          >
            <Text className="text-gray-400 text-sm">Diaspora v1.0.0</Text>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>

      {/* Delete Account Confirmation Modal */}
      <Modal
        visible={showDeleteModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <Pressable
          className="flex-1 bg-black/50 justify-center items-center px-6"
          onPress={() => setShowDeleteModal(false)}
        >
          <Pressable
            className="bg-white rounded-3xl w-full max-w-sm overflow-hidden"
            onPress={(e) => e.stopPropagation()}
          >
            <View className="items-center pt-6 pb-4 px-6">
              <View className="bg-red-100 rounded-full p-4 mb-4">
                <AlertTriangle size={32} color="#DC2626" />
              </View>
              <Text className="text-xl font-bold text-warmBrown text-center">
                Delete Account?
              </Text>
              <Text className="text-gray-500 text-center mt-2 leading-5">
                This will permanently delete your account and all your data. This action cannot be undone.
              </Text>
            </View>

            <View className="border-t border-gray-100 flex-row">
              <Pressable
                onPress={() => setShowDeleteModal(false)}
                className="flex-1 py-4 border-r border-gray-100"
                disabled={isDeleting}
              >
                <Text className="text-center font-semibold text-gray-600">Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleDeleteAccount}
                className="flex-1 py-4"
                disabled={isDeleting}
              >
                <Text className="text-center font-semibold text-red-600">
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
