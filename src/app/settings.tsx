import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, Switch, Linking, Modal, Share, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Bell, BellOff, ChevronRight, Shield, CircleHelp, LogOut, Trash2, AlertTriangle, Ban, X, Eye, EyeOff, Moon, Sun, UserPlus, Share2 } from 'lucide-react-native';
import { Image } from 'expo-image';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useStore } from '@/lib/store';
import { requestNotificationPermissions, areNotificationsEnabled } from '@/lib/notifications';
import { signOut, deleteAccount, getCurrentUser } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

export default function SettingsScreen() {
  const notificationsEnabled = useStore((s) => s.notificationsEnabled);
  const setNotificationsEnabled = useStore((s) => s.setNotificationsEnabled);
  const darkMode = useStore((s) => s.darkMode);
  const setDarkMode = useStore((s) => s.setDarkMode);
  const currentUser = useStore((s) => s.currentUser);
  const blockedUserDetails = useStore((s) => s.blockedUserDetails);
  const unblockUser = useStore((s) => s.unblockUser);
  const [systemNotificationsEnabled, setSystemNotificationsEnabled] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showBlockedUsersModal, setShowBlockedUsersModal] = useState(false);
  const [showOnlineStatus, setShowOnlineStatus] = useState(true);
  const [isUpdatingOnlineStatus, setIsUpdatingOnlineStatus] = useState(false);

  // Load user's online visibility preference
  useEffect(() => {
    const loadOnlinePreference = async () => {
      try {
        const user = await getCurrentUser();
        if (user?.id) {
          const { data, error } = await supabase
            .from('profiles')
            .select('show_online_status')
            .eq('id', user.id)
            .single();

          if (!error && data) {
            // Default to true if not set
            setShowOnlineStatus(data.show_online_status !== false);
          }
        }
      } catch (err) {
        console.log('[Settings] Error loading online preference:', err);
      }
    };
    loadOnlinePreference();
  }, []);

  const handleToggleOnlineStatus = async (value: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsUpdatingOnlineStatus(true);

    try {
      const user = await getCurrentUser();
      if (user?.id) {
        const { error } = await supabase
          .from('profiles')
          .update({ show_online_status: value })
          .eq('id', user.id);

        if (error) {
          const msg = String((error as any)?.message ?? error);
          const code = String((error as any)?.code ?? '');
          // If the column doesn't exist yet (migration not deployed), don't block the UI.
          if (code === 'PGRST204' || code === '42703' || msg.toLowerCase().includes('show_online_status')) {
            console.log('[Settings] Online status column not deployed yet.');
            setShowOnlineStatus(value);
          } else {
            console.log('[Settings] Error updating online status:', error);
          }
        } else {
          setShowOnlineStatus(value);
        }
      }
    } catch (err) {
      console.log('[Settings] Error updating online status:', err);
    } finally {
      setIsUpdatingOnlineStatus(false);
    }
  };

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

              {/* Dark Mode Toggle */}
              <View className="flex-row items-center p-4 border-t border-gray-100">
                <View className="bg-gray-100 rounded-full p-2.5 mr-3">
                  {darkMode ? (
                    <Moon size={20} color="#7C3AED" />
                  ) : (
                    <Sun size={20} color="#F59E0B" />
                  )}
                </View>
                <View className="flex-1">
                  <Text className="text-warmBrown font-medium">Dark Mode</Text>
                  <Text className="text-gray-500 text-sm mt-0.5">
                    Use dark theme across the app
                  </Text>
                </View>
                <Switch
                  value={darkMode}
                  onValueChange={(v) => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setDarkMode(v);
                  }}
                  trackColor={{ false: '#E5E7EB', true: '#7C3AED' }}
                  thumbColor="#FFFFFF"
                />
              </View>

              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push('/push-debug');
                }}
                className="flex-row items-center p-4 border-t border-gray-100"
              >
                <View className="bg-gray-100 rounded-full p-2.5 mr-3">
                  <Bell size={20} color="#111827" />
                </View>
                <View className="flex-1">
                  <Text className="text-warmBrown font-medium">Push diagnostics</Text>
                  <Text className="text-gray-500 text-sm mt-0.5">Test token sync + send a test push</Text>
                </View>
                <ChevronRight size={18} color="#9CA3AF" />
              </Pressable>
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
                  Linking.openURL('https://www.notion.so/Diaspora-Privacy-Policy-2db279c60d55807ab3f0e0d6879ba4b3');
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
                onPress={() => Linking.openURL('mailto:diasporaapp.app@gmail.com?subject=Help%20Request')}
                className="flex-row items-center p-4 border-b border-gray-100"
              >
                <View className="bg-gold-50 rounded-full p-2.5 mr-3">
                  <CircleHelp size={20} color="#C9A227" />
                </View>
                <Text className="flex-1 text-warmBrown font-medium">Help & Support</Text>
                <ChevronRight size={18} color="#9CA3AF" />
              </Pressable>

              <Pressable
                onPress={async () => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  const code = currentUser?.id ? currentUser.id.slice(0, 8).toUpperCase() : 'INTERA';
                  const message = `Join me on Intera! Use my referral code ${code} when you sign up. Download the app and connect with your community.`;
                  try {
                    await Share.share({
                      message,
                      title: 'Invite to Intera',
                    });
                  } catch {
                    Alert.alert('Share', 'Could not open share dialog.');
                  }
                }}
                className="flex-row items-center p-4"
              >
                <View className="bg-emerald-50 rounded-full p-2.5 mr-3">
                  <UserPlus size={20} color="#10B981" />
                </View>
                <View className="flex-1">
                  <Text className="text-warmBrown font-medium">Invite Friends</Text>
                  <Text className="text-gray-500 text-sm mt-0.5">Share your referral code</Text>
                </View>
                <Share2 size={18} color="#9CA3AF" />
              </Pressable>
            </View>
          </Animated.View>

          {/* Privacy & Safety Section */}
          <Animated.View entering={FadeInUp.duration(300).delay(250)}>
            <Text className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 mt-6">
              Privacy & Safety
            </Text>

            <View className="bg-white rounded-2xl overflow-hidden shadow-sm">
              {/* Show Online Status Toggle */}
              <View className="flex-row items-center p-4 border-b border-gray-100">
                <View className="bg-green-50 rounded-full p-2.5 mr-3">
                  {showOnlineStatus ? (
                    <Eye size={20} color="#10B981" />
                  ) : (
                    <EyeOff size={20} color="#9CA3AF" />
                  )}
                </View>
                <View className="flex-1">
                  <Text className="text-warmBrown font-medium">Show Online Status</Text>
                  <Text className="text-gray-500 text-sm mt-0.5">
                    Let others see when you're online
                  </Text>
                </View>
                <Switch
                  value={showOnlineStatus}
                  onValueChange={handleToggleOnlineStatus}
                  trackColor={{ false: '#E5E7EB', true: '#10B981' }}
                  thumbColor="#FFFFFF"
                  disabled={isUpdatingOnlineStatus}
                />
              </View>

              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setShowBlockedUsersModal(true);
                }}
                className="flex-row items-center p-4"
              >
                <View className="bg-red-50 rounded-full p-2.5 mr-3">
                  <Ban size={20} color="#EF4444" />
                </View>
                <View className="flex-1">
                  <Text className="text-warmBrown font-medium">Blocked Users</Text>
                  <Text className="text-gray-500 text-sm mt-0.5">
                    {blockedUserDetails.length === 0
                      ? 'No blocked users'
                      : `${blockedUserDetails.length} blocked user${blockedUserDetails.length > 1 ? 's' : ''}`}
                  </Text>
                </View>
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
            <Text className="text-gray-400 text-sm">Intera v1.0.0</Text>
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

      {/* Blocked Users Modal */}
      <Modal
        visible={showBlockedUsersModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowBlockedUsersModal(false)}
      >
        <View className="flex-1 bg-black/50">
          <Pressable
            className="flex-1"
            onPress={() => setShowBlockedUsersModal(false)}
          />
          <View className="bg-white rounded-t-3xl max-h-[70%]">
            {/* Modal Header */}
            <View className="flex-row items-center justify-between px-5 pt-5 pb-3 border-b border-gray-100">
              <Text className="text-lg font-bold text-warmBrown">Blocked Users</Text>
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setShowBlockedUsersModal(false);
                }}
                className="p-1"
                hitSlop={8}
              >
                <X size={24} color="#6B7280" />
              </Pressable>
            </View>

            {/* Blocked Users List */}
            <ScrollView className="px-5 py-4" showsVerticalScrollIndicator={false}>
              {blockedUserDetails.length === 0 ? (
                <View className="items-center py-8">
                  <View className="bg-gray-100 rounded-full p-4 mb-3">
                    <Ban size={32} color="#9CA3AF" />
                  </View>
                  <Text className="text-gray-500 text-center">No blocked users</Text>
                  <Text className="text-gray-400 text-sm text-center mt-1">
                    Users you block will appear here
                  </Text>
                </View>
              ) : (
                blockedUserDetails.map((user) => (
                  <View
                    key={user.id}
                    className="flex-row items-center py-3 border-b border-gray-100"
                  >
                    <Image
                      source={{ uri: user.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop' }}
                      style={{ width: 48, height: 48, borderRadius: 24 }}
                      contentFit="cover"
                    />
                    <View className="flex-1 ml-3">
                      <Text className="text-warmBrown font-medium">{user.name}</Text>
                      <Text className="text-gray-400 text-xs mt-0.5">
                        Blocked on {new Date(user.blockedAt).toLocaleDateString()}
                      </Text>
                    </View>
                    <Pressable
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                        unblockUser(user.id);
                      }}
                      className="bg-gray-100 rounded-full px-4 py-2"
                    >
                      <Text className="text-warmBrown font-medium text-sm">Unblock</Text>
                    </Pressable>
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}
