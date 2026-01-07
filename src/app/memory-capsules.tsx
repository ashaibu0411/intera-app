import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { ArrowLeft, Lock, Unlock, Calendar, Clock, Plus, X, Gift, Sparkles, Heart, Users, Camera } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown, FadeIn, useAnimatedStyle, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

interface MemoryCapsule {
  id: string;
  title: string;
  type: 'personal' | 'shared' | 'community';
  content: string;
  images: string[];
  createdAt: string;
  unlockDate: string;
  isUnlocked: boolean;
  unlocksIn: string;
  creator: {
    name: string;
    avatar: string;
  };
  recipients?: { name: string; avatar: string }[];
  theme: string[];
  message?: string;
}

const MOCK_CAPSULES: MemoryCapsule[] = [
  {
    id: '1',
    title: 'Letter to My Future Self',
    type: 'personal',
    content: 'A message to open on my 30th birthday with reflections on life goals and dreams.',
    images: ['https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400'],
    createdAt: 'Jan 1, 2024',
    unlockDate: 'Jan 1, 2025',
    isUnlocked: false,
    unlocksIn: '364 days',
    creator: {
      name: 'You',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200',
    },
    theme: ['#6366F1', '#8B5CF6'],
  },
  {
    id: '2',
    title: 'Our Wedding Memories',
    type: 'shared',
    content: 'Photos and messages from our wedding day to open on our 1st anniversary.',
    images: ['https://images.unsplash.com/photo-1519741497674-611481863552?w=400'],
    createdAt: 'Jun 15, 2024',
    unlockDate: 'Jun 15, 2025',
    isUnlocked: false,
    unlocksIn: '180 days',
    creator: {
      name: 'Amara & Michael',
      avatar: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=200',
    },
    recipients: [
      { name: 'Michael', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200' },
    ],
    theme: ['#EC4899', '#F43F5E'],
    message: 'To be opened on our anniversary!',
  },
  {
    id: '3',
    title: 'Graduation Day 2023',
    type: 'personal',
    content: 'Captured the moment I graduated with photos, videos, and well-wishes from friends.',
    images: ['https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=400'],
    createdAt: 'May 20, 2023',
    unlockDate: 'May 20, 2024',
    isUnlocked: true,
    unlocksIn: 'Unlocked!',
    creator: {
      name: 'You',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200',
    },
    theme: ['#10B981', '#059669'],
  },
  {
    id: '4',
    title: 'Community Time Capsule 2024',
    type: 'community',
    content: 'Messages and predictions from the Diaspora community for 2025.',
    images: ['https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=400'],
    createdAt: 'Dec 31, 2023',
    unlockDate: 'Dec 31, 2024',
    isUnlocked: false,
    unlocksIn: '30 days',
    creator: {
      name: 'Diaspora',
      avatar: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=200',
    },
    recipients: [
      { name: '2.4K', avatar: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=200' },
    ],
    theme: ['#F59E0B', '#D97706'],
    message: '2,400 community members contributed!',
  },
  {
    id: '5',
    title: 'Baby\'s First Year',
    type: 'shared',
    content: 'Monthly photos and milestones from Maya\'s first year of life.',
    images: ['https://images.unsplash.com/photo-1519689680058-324335c77eba?w=400'],
    createdAt: 'Mar 1, 2024',
    unlockDate: 'Mar 1, 2025',
    isUnlocked: false,
    unlocksIn: '90 days',
    creator: {
      name: 'The Williams Family',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200',
    },
    recipients: [
      { name: 'Maya', avatar: 'https://images.unsplash.com/photo-1519689680058-324335c77eba?w=200' },
    ],
    theme: ['#06B6D4', '#0891B2'],
    message: 'For Maya to open on her 18th birthday 💕',
  },
];

const CAPSULE_TYPES = [
  { key: 'all', label: 'All Capsules' },
  { key: 'personal', label: 'Personal' },
  { key: 'shared', label: 'Shared' },
  { key: 'community', label: 'Community' },
];

export default function MemoryCapsulesScreen() {
  const router = useRouter();
  const [selectedType, setSelectedType] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCapsule, setNewCapsule] = useState({
    title: '',
    unlockDate: '',
    type: 'personal',
  });

  const filteredCapsules = MOCK_CAPSULES.filter(capsule => {
    return selectedType === 'all' || capsule.type === selectedType;
  });

  const lockedCapsules = filteredCapsules.filter(c => !c.isUnlocked);
  const unlockedCapsules = filteredCapsules.filter(c => c.isUnlocked);

  return (
    <View className="flex-1 bg-[#0F0A19]">
      <SafeAreaView edges={['top']} className="flex-1">
        {/* Header */}
        <View className="px-5 pb-4">
          <View className="flex-row items-center justify-between mb-4">
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.back();
              }}
              className="w-10 h-10 rounded-full bg-white/10 items-center justify-center"
            >
              <ArrowLeft size={20} color="#fff" />
            </Pressable>
            <View className="flex-row items-center">
              <Gift size={20} color="#A78BFA" />
              <Text className="text-white text-lg font-bold ml-2">Memory Capsules</Text>
            </View>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                setShowCreateModal(true);
              }}
              className="w-10 h-10 rounded-full bg-purple-500 items-center justify-center"
            >
              <Plus size={20} color="#fff" />
            </Pressable>
          </View>

          {/* Hero Banner */}
          <LinearGradient
            colors={['#6366F1', '#8B5CF6', '#A78BFA']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ borderRadius: 24, padding: 20, marginBottom: 16 }}
          >
            <View className="flex-row items-center">
              <View className="flex-1">
                <Text className="text-white/80 text-sm mb-1">Create memories that unlock in the future</Text>
                <Text className="text-white text-xl font-bold">Time-Locked Messages</Text>
                <Text className="text-white/70 text-sm mt-2">Surprise yourself or loved ones with messages, photos, and videos that open on special dates.</Text>
              </View>
              <View className="ml-4">
                <Sparkles size={48} color="#fff" />
              </View>
            </View>
          </LinearGradient>

          {/* Type Filter */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }}>
            <View className="flex-row gap-2">
              {CAPSULE_TYPES.map((type) => (
                <Pressable
                  key={type.key}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSelectedType(type.key);
                  }}
                  className={`px-4 py-2.5 rounded-full ${
                    selectedType === type.key
                      ? 'bg-purple-500'
                      : 'bg-white/10'
                  }`}
                >
                  <Text className={`font-medium ${
                    selectedType === type.key ? 'text-white' : 'text-gray-300'
                  }`}>
                    {type.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        </View>

        <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
          {/* Locked Capsules */}
          {lockedCapsules.length > 0 && (
            <View className="mb-6">
              <View className="flex-row items-center mb-3">
                <Lock size={16} color="#A78BFA" />
                <Text className="text-purple-400 font-bold ml-2">Locked Capsules</Text>
                <Text className="text-gray-500 ml-2">({lockedCapsules.length})</Text>
              </View>

              {lockedCapsules.map((capsule, index) => (
                <Animated.View
                  key={capsule.id}
                  entering={FadeInDown.delay(index * 80).springify()}
                >
                  <Pressable
                    onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
                    className="mb-4 rounded-3xl overflow-hidden"
                  >
                    <LinearGradient
                      colors={capsule.theme as [string, string]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={{ padding: 1, borderRadius: 24 }}
                    >
                      <View className="bg-[#1A1625] rounded-3xl overflow-hidden">
                        {/* Image Header */}
                        <View className="relative h-32">
                          <Image
                            source={{ uri: capsule.images[0] }}
                            style={{ width: '100%', height: '100%' }}
                            contentFit="cover"
                          />
                          <View
                            style={{
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              right: 0,
                              bottom: 0,
                              backgroundColor: 'rgba(0,0,0,0.5)',
                            }}
                          />

                          {/* Lock Icon */}
                          <View className="absolute inset-0 items-center justify-center">
                            <View className="w-16 h-16 rounded-full bg-black/50 items-center justify-center">
                              <Lock size={32} color="#A78BFA" />
                            </View>
                          </View>

                          {/* Type Badge */}
                          <View className="absolute top-3 left-3 flex-row items-center bg-black/50 px-3 py-1.5 rounded-full">
                            {capsule.type === 'personal' && <Heart size={12} color="#EC4899" />}
                            {capsule.type === 'shared' && <Users size={12} color="#3B82F6" />}
                            {capsule.type === 'community' && <Sparkles size={12} color="#F59E0B" />}
                            <Text className="text-white text-xs ml-1.5 capitalize">{capsule.type}</Text>
                          </View>

                          {/* Unlock Timer */}
                          <View className="absolute top-3 right-3 bg-purple-500/80 px-3 py-1.5 rounded-full">
                            <Text className="text-white text-xs font-bold">{capsule.unlocksIn}</Text>
                          </View>
                        </View>

                        {/* Content */}
                        <View className="p-4">
                          <Text className="text-white font-bold text-lg mb-1">{capsule.title}</Text>
                          <Text className="text-gray-400 text-sm mb-3">{capsule.content}</Text>

                          {capsule.message && (
                            <View className="bg-white/5 rounded-xl p-3 mb-3">
                              <Text className="text-purple-300 text-sm italic">"{capsule.message}"</Text>
                            </View>
                          )}

                          <View className="flex-row items-center justify-between">
                            <View className="flex-row items-center">
                              <Calendar size={14} color="#9CA3AF" />
                              <Text className="text-gray-500 text-xs ml-1.5">Opens {capsule.unlockDate}</Text>
                            </View>

                            {capsule.recipients && (
                              <View className="flex-row items-center">
                                {capsule.recipients.slice(0, 3).map((recipient, idx) => (
                                  <Image
                                    key={idx}
                                    source={{ uri: recipient.avatar }}
                                    style={{
                                      width: 24,
                                      height: 24,
                                      borderRadius: 12,
                                      marginLeft: idx > 0 ? -8 : 0,
                                      borderWidth: 2,
                                      borderColor: '#1A1625',
                                    }}
                                    contentFit="cover"
                                  />
                                ))}
                              </View>
                            )}
                          </View>
                        </View>
                      </View>
                    </LinearGradient>
                  </Pressable>
                </Animated.View>
              ))}
            </View>
          )}

          {/* Unlocked Capsules */}
          {unlockedCapsules.length > 0 && (
            <View className="mb-6">
              <View className="flex-row items-center mb-3">
                <Unlock size={16} color="#10B981" />
                <Text className="text-green-400 font-bold ml-2">Unlocked Memories</Text>
                <Text className="text-gray-500 ml-2">({unlockedCapsules.length})</Text>
              </View>

              {unlockedCapsules.map((capsule, index) => (
                <Animated.View
                  key={capsule.id}
                  entering={FadeInDown.delay(index * 80).springify()}
                >
                  <Pressable
                    onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
                    className="mb-4 bg-white/5 rounded-3xl overflow-hidden border border-green-500/30"
                  >
                    <View className="relative h-32">
                      <Image
                        source={{ uri: capsule.images[0] }}
                        style={{ width: '100%', height: '100%' }}
                        contentFit="cover"
                      />

                      {/* Unlocked Badge */}
                      <View className="absolute top-3 right-3 bg-green-500 px-3 py-1.5 rounded-full flex-row items-center">
                        <Unlock size={12} color="#fff" />
                        <Text className="text-white text-xs font-bold ml-1">Unlocked!</Text>
                      </View>
                    </View>

                    <View className="p-4">
                      <Text className="text-white font-bold text-lg mb-1">{capsule.title}</Text>
                      <Text className="text-gray-400 text-sm mb-2">{capsule.content}</Text>

                      <View className="flex-row items-center">
                        <Clock size={14} color="#9CA3AF" />
                        <Text className="text-gray-500 text-xs ml-1.5">Created {capsule.createdAt}</Text>
                      </View>
                    </View>

                    <Pressable
                      onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)}
                      className="bg-green-500 py-3 items-center"
                    >
                      <Text className="text-white font-bold">View Memory</Text>
                    </Pressable>
                  </Pressable>
                </Animated.View>
              ))}
            </View>
          )}

          <View className="h-32" />
        </ScrollView>

        {/* Create Capsule Modal */}
        <Modal visible={showCreateModal} animationType="slide" transparent>
          <View className="flex-1 bg-black/80 justify-end">
            <View className="bg-[#1A1625] rounded-t-3xl p-6">
              <View className="flex-row items-center justify-between mb-6">
                <Text className="text-white text-xl font-bold">Create Memory Capsule</Text>
                <Pressable
                  onPress={() => setShowCreateModal(false)}
                  className="w-8 h-8 rounded-full bg-white/10 items-center justify-center"
                >
                  <X size={18} color="#fff" />
                </Pressable>
              </View>

              {/* Capsule Type */}
              <View className="mb-4">
                <Text className="text-gray-400 text-sm mb-2">Capsule Type</Text>
                <View className="flex-row gap-2">
                  {[
                    { key: 'personal', label: 'Just Me', icon: Heart },
                    { key: 'shared', label: 'Share', icon: Users },
                    { key: 'community', label: 'Community', icon: Sparkles },
                  ].map((type) => {
                    const Icon = type.icon;
                    return (
                      <Pressable
                        key={type.key}
                        onPress={() => setNewCapsule(prev => ({ ...prev, type: type.key }))}
                        className={`flex-1 flex-row items-center justify-center py-3 rounded-xl ${
                          newCapsule.type === type.key ? 'bg-purple-500' : 'bg-white/10'
                        }`}
                      >
                        <Icon size={16} color="#fff" />
                        <Text className="text-white ml-2 font-medium">{type.label}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              <View className="mb-4">
                <Text className="text-gray-400 text-sm mb-2">Capsule Title</Text>
                <TextInput
                  placeholder="e.g., Letter to Future Me"
                  placeholderTextColor="#6B7280"
                  value={newCapsule.title}
                  onChangeText={(text) => setNewCapsule(prev => ({ ...prev, title: text }))}
                  className="bg-white/10 rounded-xl px-4 py-3 text-white"
                />
              </View>

              <View className="mb-4">
                <Text className="text-gray-400 text-sm mb-2">Unlock Date</Text>
                <TextInput
                  placeholder="When should this open?"
                  placeholderTextColor="#6B7280"
                  value={newCapsule.unlockDate}
                  onChangeText={(text) => setNewCapsule(prev => ({ ...prev, unlockDate: text }))}
                  className="bg-white/10 rounded-xl px-4 py-3 text-white"
                />
              </View>

              {/* Add Content Buttons */}
              <View className="flex-row gap-3 mb-6">
                <Pressable className="flex-1 bg-white/10 rounded-xl py-4 items-center">
                  <Camera size={24} color="#A78BFA" />
                  <Text className="text-gray-300 text-sm mt-1">Add Photos</Text>
                </Pressable>
                <Pressable className="flex-1 bg-white/10 rounded-xl py-4 items-center">
                  <Gift size={24} color="#A78BFA" />
                  <Text className="text-gray-300 text-sm mt-1">Add Message</Text>
                </Pressable>
              </View>

              <Pressable
                onPress={() => {
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                  setShowCreateModal(false);
                }}
                className="rounded-xl py-4 items-center overflow-hidden"
              >
                <LinearGradient
                  colors={['#6366F1', '#8B5CF6']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
                />
                <Text className="text-white font-bold text-lg">Create Capsule</Text>
              </Pressable>

              <View className="h-8" />
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </View>
  );
}
