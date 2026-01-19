import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Switch,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import {
  ChevronLeft,
  Calendar,
  Image as ImageIcon,
  Users,
  FileText,
  Shield,
  CheckCircle,
  Lock,
  Globe,
  UserPlus,
} from 'lucide-react-native';
import { useStore } from '@/lib/store';
import {
  getGroupSettings,
  updateGroupSettings,
  type GroupSettings,
  DEFAULT_GROUP_SETTINGS,
} from '@/lib/groups-api';

type SettingOption = {
  value: string;
  label: string;
  description: string;
};

const EVENT_OPTIONS: SettingOption[] = [
  { value: 'admin_only', label: 'Admin Only', description: 'Only admins can create events' },
  { value: 'members', label: 'All Members', description: 'Any member can create events' },
];

const MEDIA_OPTIONS: SettingOption[] = [
  { value: 'admin_only', label: 'Admin Only', description: 'Only admins can upload photos/videos' },
  { value: 'members', label: 'All Members', description: 'Any member can upload photos/videos' },
];

const JOIN_OPTIONS: SettingOption[] = [
  { value: 'open', label: 'Open', description: 'Anyone can join immediately' },
  { value: 'request', label: 'Request to Join', description: 'Admin approval required to join' },
  { value: 'invite_only', label: 'Invite Only', description: 'Only invited users can join' },
];

const POST_OPTIONS: SettingOption[] = [
  { value: 'admin_only', label: 'Admin Only', description: 'Only admins can create posts' },
  { value: 'members', label: 'All Members', description: 'Any member can create posts' },
];

interface SettingSectionProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  options: SettingOption[];
  value: string;
  onChange: (value: string) => void;
}

function SettingSection({ title, description, icon, options, value, onChange }: SettingSectionProps) {
  return (
    <View className="bg-white rounded-2xl mx-4 mb-4 overflow-hidden">
      <View className="p-4 border-b border-gray-100">
        <View className="flex-row items-center">
          {icon}
          <View className="ml-3 flex-1">
            <Text className="text-lg font-semibold text-gray-900">{title}</Text>
            <Text className="text-gray-500 text-sm mt-0.5">{description}</Text>
          </View>
        </View>
      </View>
      {options.map((option) => (
        <Pressable
          key={option.value}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onChange(option.value);
          }}
          className="flex-row items-center p-4 border-b border-gray-50"
        >
          <View className="flex-1">
            <Text className="text-gray-900 font-medium">{option.label}</Text>
            <Text className="text-gray-500 text-sm mt-0.5">{option.description}</Text>
          </View>
          <View
            className={`w-6 h-6 rounded-full border-2 items-center justify-center ${
              value === option.value ? 'bg-forest-600 border-forest-600' : 'border-gray-300'
            }`}
          >
            {value === option.value && <CheckCircle size={16} color="#FFFFFF" />}
          </View>
        </Pressable>
      ))}
    </View>
  );
}

export default function GroupSettingsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState<GroupSettings>(DEFAULT_GROUP_SETTINGS);
  const [hasChanges, setHasChanges] = useState(false);

  const currentUser = useStore((s) => s.currentUser);

  useEffect(() => {
    loadSettings();
  }, [id]);

  const loadSettings = async () => {
    if (!id) return;
    try {
      const data = await getGroupSettings(id);
      setSettings(data);
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateSetting = <K extends keyof GroupSettings>(key: K, value: GroupSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!id || !hasChanges) return;

    setIsSaving(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const success = await updateGroupSettings(id, settings);
      if (success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setHasChanges(false);
        Alert.alert('Success', 'Group settings have been updated.');
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert('Error', 'Failed to update settings. Please try again.');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', 'An error occurred. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center">
        <ActivityIndicator size="large" color="#1B4D3E" />
        <Text className="text-gray-500 mt-4">Loading settings...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <SafeAreaView edges={['top']} className="flex-1">
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 py-3 bg-white border-b border-gray-100">
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              if (hasChanges) {
                Alert.alert(
                  'Unsaved Changes',
                  'You have unsaved changes. Are you sure you want to leave?',
                  [
                    { text: 'Stay', style: 'cancel' },
                    { text: 'Leave', style: 'destructive', onPress: () => router.back() },
                  ]
                );
              } else {
                router.back();
              }
            }}
            className="w-10 h-10 items-center justify-center"
          >
            <ChevronLeft size={28} color="#1F2937" />
          </Pressable>
          <Text className="text-lg font-semibold text-gray-900">Group Settings</Text>
          <Pressable
            onPress={handleSave}
            disabled={!hasChanges || isSaving}
            className={`px-4 py-2 rounded-full ${
              hasChanges ? 'bg-forest-600' : 'bg-gray-200'
            }`}
          >
            <Text className={`font-semibold ${hasChanges ? 'text-white' : 'text-gray-400'}`}>
              {isSaving ? 'Saving...' : 'Save'}
            </Text>
          </Pressable>
        </View>

        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          <Animated.View entering={FadeIn.duration(300)} className="pt-4 pb-8">
            {/* Info Banner */}
            <View className="bg-blue-50 mx-4 mb-4 p-4 rounded-2xl flex-row items-start">
              <Shield size={20} color="#3B82F6" />
              <Text className="text-blue-700 ml-3 flex-1 text-sm">
                These settings control who can perform actions in your group. Only admins can access this page.
              </Text>
            </View>

            {/* Membership Settings */}
            <Animated.View entering={FadeInUp.duration(300).delay(100)}>
              <SettingSection
                title="Membership"
                description="Control how people can join your group"
                icon={<UserPlus size={24} color="#1B4D3E" />}
                options={JOIN_OPTIONS}
                value={settings.join_mode}
                onChange={(value) => handleUpdateSetting('join_mode', value as GroupSettings['join_mode'])}
              />
            </Animated.View>

            {/* Event Creation Settings */}
            <Animated.View entering={FadeInUp.duration(300).delay(150)}>
              <SettingSection
                title="Event Creation"
                description="Who can create events in this group"
                icon={<Calendar size={24} color="#C9A227" />}
                options={EVENT_OPTIONS}
                value={settings.events_creation}
                onChange={(value) => handleUpdateSetting('events_creation', value as GroupSettings['events_creation'])}
              />
            </Animated.View>

            {/* Media Upload Settings */}
            <Animated.View entering={FadeInUp.duration(300).delay(200)}>
              <SettingSection
                title="Photo & Video Uploads"
                description="Who can upload media to albums"
                icon={<ImageIcon size={24} color="#D4673A" />}
                options={MEDIA_OPTIONS}
                value={settings.media_upload}
                onChange={(value) => handleUpdateSetting('media_upload', value as GroupSettings['media_upload'])}
              />
            </Animated.View>

            {/* Post Creation Settings */}
            <Animated.View entering={FadeInUp.duration(300).delay(250)}>
              <SettingSection
                title="Post Creation"
                description="Who can create posts in this group"
                icon={<FileText size={24} color="#8B5CF6" />}
                options={POST_OPTIONS}
                value={settings.posts_creation}
                onChange={(value) => handleUpdateSetting('posts_creation', value as GroupSettings['posts_creation'])}
              />
            </Animated.View>

            {/* Allow Media in Posts */}
            <Animated.View entering={FadeInUp.duration(300).delay(300)}>
              <View className="bg-white rounded-2xl mx-4 mb-4 p-4">
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center flex-1">
                    <ImageIcon size={24} color="#6B7280" />
                    <View className="ml-3 flex-1">
                      <Text className="text-gray-900 font-medium">Allow Media in Posts</Text>
                      <Text className="text-gray-500 text-sm mt-0.5">
                        Members can attach photos and videos to posts
                      </Text>
                    </View>
                  </View>
                  <Switch
                    value={settings.posts_media_allowed}
                    onValueChange={(value) => handleUpdateSetting('posts_media_allowed', value)}
                    trackColor={{ false: '#D1D5DB', true: '#1B4D3E' }}
                    thumbColor="#FFFFFF"
                  />
                </View>
              </View>
            </Animated.View>

            {/* Admin Note */}
            <Animated.View entering={FadeInUp.duration(300).delay(350)}>
              <View className="bg-amber-50 mx-4 p-4 rounded-2xl flex-row items-start">
                <Lock size={20} color="#D97706" />
                <View className="ml-3 flex-1">
                  <Text className="text-amber-800 font-medium">Admin-Only Actions</Text>
                  <Text className="text-amber-700 text-sm mt-1">
                    The following actions are always restricted to admins only:
                  </Text>
                  <Text className="text-amber-700 text-sm mt-2">• Removing members from the group</Text>
                  <Text className="text-amber-700 text-sm">• Approving/rejecting join requests</Text>
                  <Text className="text-amber-700 text-sm">• Deleting other members' content</Text>
                  <Text className="text-amber-700 text-sm">• Changing group settings</Text>
                </View>
              </View>
            </Animated.View>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
