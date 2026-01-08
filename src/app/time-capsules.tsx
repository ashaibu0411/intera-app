import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import {
  ArrowLeft,
  Clock,
  Lock,
  Unlock,
  BookOpen,
  Utensils,
  Music,
  Heart,
  MapPin,
  Calendar,
  Plus,
  Users,
  Play,
  Mic,
  Image as ImageIcon,
  FileText,
  ChevronRight,
  Sparkles,
  X,
} from 'lucide-react-native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useStore } from '@/lib/store';

// Capsule types
type CapsuleType = 'story' | 'recipe' | 'tradition' | 'prayer' | 'music' | 'history';

interface TimeCapsule {
  id: string;
  title: string;
  description: string;
  type: CapsuleType;
  icon: typeof BookOpen;
  createdBy: {
    name: string;
    avatar: string;
  };
  contributors: number;
  unlockCondition: {
    type: 'date' | 'milestone' | 'community_age';
    value: string;
    description: string;
  };
  isUnlocked: boolean;
  unlockedAt?: string;
  location?: string;
  coverImage?: string;
  itemCount: number;
}

// Mock time capsules
const TIME_CAPSULES: TimeCapsule[] = [
  {
    id: 'tc1',
    title: 'Ghanaian Migration Stories',
    description: 'Stories of Ghanaians who moved to Colorado between 1990-2010. Their journeys, struggles, and triumphs.',
    type: 'story',
    icon: BookOpen,
    createdBy: {
      name: 'Kwame Asante',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face',
    },
    contributors: 23,
    unlockCondition: {
      type: 'date',
      value: '2025-03-06', // Ghana Independence Day
      description: 'Unlocks on Ghana Independence Day 2025',
    },
    isUnlocked: false,
    location: 'Aurora, CO',
    coverImage: 'https://images.unsplash.com/photo-1523805009345-7448845a9e53?w=800&h=400&fit=crop',
    itemCount: 47,
  },
  {
    id: 'tc2',
    title: 'Grandma\'s Recipes',
    description: 'Traditional recipes passed down through generations. From jollof rice to fufu, preserved for future generations.',
    type: 'recipe',
    icon: Utensils,
    createdBy: {
      name: 'Amara Johnson',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=face',
    },
    contributors: 56,
    unlockCondition: {
      type: 'milestone',
      value: 'community_100',
      description: 'Unlocked when community reaches 100 members',
    },
    isUnlocked: true,
    unlockedAt: '2024-12-15',
    coverImage: 'https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=800&h=400&fit=crop',
    itemCount: 89,
  },
  {
    id: 'tc3',
    title: 'Wedding Traditions',
    description: 'How we celebrate love - traditional wedding ceremonies, customs, and blessings from different cultures.',
    type: 'tradition',
    icon: Heart,
    createdBy: {
      name: 'Fatima Hassan',
      avatar: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=200&h=200&fit=crop&crop=face',
    },
    contributors: 34,
    unlockCondition: {
      type: 'community_age',
      value: '1_year',
      description: 'Unlocks after 1 year in community',
    },
    isUnlocked: true,
    unlockedAt: '2024-11-20',
    coverImage: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&h=400&fit=crop',
    itemCount: 62,
  },
  {
    id: 'tc4',
    title: 'Prayers & Blessings',
    description: 'Audio recordings of prayers, blessings, and spiritual words from community elders.',
    type: 'prayer',
    icon: Mic,
    createdBy: {
      name: 'Elder Mensah',
      avatar: 'https://images.unsplash.com/photo-1566753323558-f4e0952af115?w=200&h=200&fit=crop&crop=face',
    },
    contributors: 12,
    unlockCondition: {
      type: 'date',
      value: '2025-12-25',
      description: 'Unlocks on Christmas 2025',
    },
    isUnlocked: false,
    coverImage: 'https://images.unsplash.com/photo-1507692049790-de58290a4334?w=800&h=400&fit=crop',
    itemCount: 28,
  },
  {
    id: 'tc5',
    title: 'Music of Our Homeland',
    description: 'Traditional songs, lullabies, and anthems that connect us to our roots.',
    type: 'music',
    icon: Music,
    createdBy: {
      name: 'DJ Kofi',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face',
    },
    contributors: 41,
    unlockCondition: {
      type: 'milestone',
      value: 'diaspora_day',
      description: 'Unlocks on African Diaspora Day',
    },
    isUnlocked: true,
    unlockedAt: '2024-08-25',
    coverImage: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&h=400&fit=crop',
    itemCount: 156,
  },
];

const getTypeColor = (type: CapsuleType): [string, string] => {
  switch (type) {
    case 'story': return ['#6366F1', '#4F46E5'];
    case 'recipe': return ['#F59E0B', '#D97706'];
    case 'tradition': return ['#EC4899', '#DB2777'];
    case 'prayer': return ['#8B5CF6', '#7C3AED'];
    case 'music': return ['#10B981', '#059669'];
    case 'history': return ['#3B82F6', '#2563EB'];
    default: return ['#6B7280', '#4B5563'];
  }
};

const getTypeLabel = (type: CapsuleType): string => {
  switch (type) {
    case 'story': return 'Stories';
    case 'recipe': return 'Recipes';
    case 'tradition': return 'Traditions';
    case 'prayer': return 'Prayers';
    case 'music': return 'Music';
    case 'history': return 'History';
    default: return 'Other';
  }
};

export default function TimeCapsuleScreen() {
  const currentUser = useStore((s) => s.currentUser);
  const selectedLocation = useStore((s) => s.selectedLocation);
  const [activeFilter, setActiveFilter] = useState<'all' | 'unlocked' | 'locked'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const filteredCapsules = TIME_CAPSULES.filter((capsule) => {
    if (activeFilter === 'unlocked') return capsule.isUnlocked;
    if (activeFilter === 'locked') return !capsule.isUnlocked;
    return true;
  });

  const handleOpenCapsule = (capsule: TimeCapsule) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (capsule.isUnlocked) {
      router.push({
        pathname: '/capsule-detail',
        params: { capsuleId: capsule.id },
      });
    }
  };

  return (
    <View className="flex-1 bg-cream">
      <SafeAreaView edges={['top']} className="flex-1">
        {/* Header */}
        <Animated.View
          entering={FadeIn.duration(300)}
          className="flex-row items-center px-5 pt-4 pb-4 border-b border-gray-100"
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
          <View className="flex-1">
            <Text className="text-xl font-bold text-warmBrown">Time Capsules</Text>
            <Text className="text-gray-500 text-sm">
              Preserving our legacy • {selectedLocation?.city || 'Your City'}
            </Text>
          </View>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              setShowCreateModal(true);
            }}
            className="bg-purple-500 rounded-full p-2"
          >
            <Plus size={20} color="#FFFFFF" />
          </Pressable>
        </Animated.View>

        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          {/* Hero */}
          <Animated.View entering={FadeInUp.duration(400).delay(100)} className="px-5 pt-5">
            <LinearGradient
              colors={['#1E1B4B', '#312E81', '#4338CA']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ borderRadius: 24, padding: 24, overflow: 'hidden' }}
            >
              {/* Stars decoration */}
              <View className="absolute top-4 right-4">
                <Sparkles size={32} color="#FCD34D" />
              </View>
              <View className="absolute bottom-8 left-8 opacity-30">
                <Sparkles size={24} color="#FFFFFF" />
              </View>

              <View className="flex-row items-center">
                <View className="w-16 h-16 rounded-full bg-white/20 items-center justify-center">
                  <Clock size={32} color="#FFFFFF" />
                </View>
                <View className="flex-1 ml-4">
                  <Text className="text-white text-2xl font-bold">
                    Cultural Memory
                  </Text>
                  <Text className="text-white/70 text-base mt-1">
                    Stories that transcend time
                  </Text>
                </View>
              </View>

              <Text className="text-white/80 mt-4 leading-6">
                Create time capsules to preserve traditions, recipes, stories, and memories for future generations. Some unlock on special dates, others when milestones are reached.
              </Text>

              {/* Stats */}
              <View className="flex-row mt-5 pt-4 border-t border-white/20">
                <View className="flex-1 items-center">
                  <Text className="text-white text-2xl font-bold">{TIME_CAPSULES.length}</Text>
                  <Text className="text-white/60 text-sm">Capsules</Text>
                </View>
                <View className="flex-1 items-center">
                  <Text className="text-white text-2xl font-bold">
                    {TIME_CAPSULES.filter((c) => c.isUnlocked).length}
                  </Text>
                  <Text className="text-white/60 text-sm">Unlocked</Text>
                </View>
                <View className="flex-1 items-center">
                  <Text className="text-white text-2xl font-bold">
                    {TIME_CAPSULES.reduce((sum, c) => sum + c.itemCount, 0)}
                  </Text>
                  <Text className="text-white/60 text-sm">Items</Text>
                </View>
              </View>
            </LinearGradient>
          </Animated.View>

          {/* Filter Tabs */}
          <Animated.View entering={FadeInUp.duration(400).delay(200)} className="px-5 mt-6">
            <View className="flex-row gap-2">
              {(['all', 'unlocked', 'locked'] as const).map((filter) => (
                <Pressable
                  key={filter}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setActiveFilter(filter);
                  }}
                  className={`flex-row items-center px-4 py-2.5 rounded-full ${
                    activeFilter === filter ? 'bg-purple-500' : 'bg-white'
                  }`}
                >
                  {filter === 'unlocked' && (
                    <Unlock size={16} color={activeFilter === filter ? '#FFFFFF' : '#6B7280'} />
                  )}
                  {filter === 'locked' && (
                    <Lock size={16} color={activeFilter === filter ? '#FFFFFF' : '#6B7280'} />
                  )}
                  <Text
                    className={`ml-1 font-medium capitalize ${
                      activeFilter === filter ? 'text-white' : 'text-gray-600'
                    }`}
                  >
                    {filter}
                  </Text>
                </Pressable>
              ))}
            </View>
          </Animated.View>

          {/* Capsules List */}
          <Animated.View entering={FadeInUp.duration(400).delay(300)} className="px-5 mt-4">
            {filteredCapsules.map((capsule, index) => {
              const colors = getTypeColor(capsule.type);
              const Icon = capsule.icon;

              return (
                <Animated.View
                  key={capsule.id}
                  entering={FadeInUp.duration(300).delay(index * 50)}
                  className="mb-4"
                >
                  <Pressable
                    onPress={() => handleOpenCapsule(capsule)}
                    className="bg-white rounded-2xl overflow-hidden shadow-sm"
                    style={{ opacity: capsule.isUnlocked ? 1 : 0.8 }}
                  >
                    {/* Cover Image */}
                    {capsule.coverImage && (
                      <View className="relative">
                        <Image
                          source={{ uri: capsule.coverImage }}
                          style={{ width: '100%', height: 120 }}
                          contentFit="cover"
                        />
                        <LinearGradient
                          colors={['transparent', 'rgba(0,0,0,0.6)']}
                          style={{
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            right: 0,
                            height: 60,
                          }}
                        />
                        {/* Lock/Unlock Badge */}
                        <View
                          className={`absolute top-3 right-3 flex-row items-center px-3 py-1.5 rounded-full ${
                            capsule.isUnlocked ? 'bg-green-500' : 'bg-gray-800/80'
                          }`}
                        >
                          {capsule.isUnlocked ? (
                            <Unlock size={14} color="#FFFFFF" />
                          ) : (
                            <Lock size={14} color="#FFFFFF" />
                          )}
                          <Text className="text-white text-xs font-semibold ml-1">
                            {capsule.isUnlocked ? 'Unlocked' : 'Locked'}
                          </Text>
                        </View>

                        {/* Type Badge */}
                        <View className="absolute bottom-3 left-3">
                          <LinearGradient
                            colors={colors}
                            style={{
                              flexDirection: 'row',
                              alignItems: 'center',
                              paddingHorizontal: 10,
                              paddingVertical: 4,
                              borderRadius: 999,
                            }}
                          >
                            <Icon size={14} color="#FFFFFF" />
                            <Text className="text-white text-xs font-semibold ml-1">
                              {getTypeLabel(capsule.type)}
                            </Text>
                          </LinearGradient>
                        </View>
                      </View>
                    )}

                    {/* Content */}
                    <View className="p-4">
                      <Text className="text-warmBrown font-bold text-lg">
                        {capsule.title}
                      </Text>
                      <Text className="text-gray-500 text-sm mt-1" numberOfLines={2}>
                        {capsule.description}
                      </Text>

                      {/* Creator */}
                      <View className="flex-row items-center mt-3">
                        <Image
                          source={{ uri: capsule.createdBy.avatar }}
                          style={{ width: 24, height: 24, borderRadius: 12 }}
                          contentFit="cover"
                        />
                        <Text className="text-gray-600 text-sm ml-2">
                          Created by {capsule.createdBy.name}
                        </Text>
                      </View>

                      {/* Unlock Condition */}
                      <View className="flex-row items-center mt-3 bg-gray-50 rounded-xl p-3">
                        {capsule.isUnlocked ? (
                          <>
                            <Calendar size={16} color="#10B981" />
                            <Text className="text-green-600 text-sm ml-2">
                              Unlocked on {new Date(capsule.unlockedAt!).toLocaleDateString()}
                            </Text>
                          </>
                        ) : (
                          <>
                            <Clock size={16} color="#7C3AED" />
                            <Text className="text-purple-600 text-sm ml-2">
                              {capsule.unlockCondition.description}
                            </Text>
                          </>
                        )}
                      </View>

                      {/* Stats */}
                      <View className="flex-row items-center justify-between mt-3 pt-3 border-t border-gray-100">
                        <View className="flex-row items-center">
                          <Users size={14} color="#9CA3AF" />
                          <Text className="text-gray-500 text-sm ml-1">
                            {capsule.contributors} contributors
                          </Text>
                        </View>
                        <View className="flex-row items-center">
                          <FileText size={14} color="#9CA3AF" />
                          <Text className="text-gray-500 text-sm ml-1">
                            {capsule.itemCount} items
                          </Text>
                        </View>
                        {capsule.isUnlocked && (
                          <ChevronRight size={20} color="#7C3AED" />
                        )}
                      </View>
                    </View>
                  </Pressable>
                </Animated.View>
              );
            })}
          </Animated.View>
        </ScrollView>

        {/* Create Modal */}
        <Modal
          visible={showCreateModal}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowCreateModal(false)}
        >
          <SafeAreaView className="flex-1 bg-cream">
            <View className="flex-row items-center justify-between px-5 py-4 border-b border-gray-100">
              <Text className="text-xl font-bold text-warmBrown">Create Time Capsule</Text>
              <Pressable
                onPress={() => setShowCreateModal(false)}
                className="p-2"
              >
                <X size={24} color="#2D1F1A" />
              </Pressable>
            </View>

            <ScrollView className="flex-1 px-5 pt-4">
              <Text className="text-gray-600 mb-6">
                Create a time capsule to preserve stories, recipes, traditions, or memories for your community.
              </Text>

              {/* Capsule Types */}
              <Text className="text-lg font-bold text-warmBrown mb-4">What type of capsule?</Text>
              <View className="flex-row flex-wrap gap-3 mb-6">
                {[
                  { type: 'story', label: 'Stories', icon: BookOpen },
                  { type: 'recipe', label: 'Recipes', icon: Utensils },
                  { type: 'tradition', label: 'Traditions', icon: Heart },
                  { type: 'prayer', label: 'Prayers', icon: Mic },
                  { type: 'music', label: 'Music', icon: Music },
                  { type: 'history', label: 'History', icon: MapPin },
                ].map((item) => {
                  const colors = getTypeColor(item.type as CapsuleType);
                  return (
                    <Pressable
                      key={item.type}
                      onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
                      className="bg-white rounded-xl p-4 items-center"
                      style={{ width: '30%' }}
                    >
                      <LinearGradient
                        colors={colors}
                        style={{
                          width: 48,
                          height: 48,
                          borderRadius: 24,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <item.icon size={24} color="#FFFFFF" />
                      </LinearGradient>
                      <Text className="text-warmBrown font-medium mt-2 text-sm">
                        {item.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {/* Unlock Options */}
              <Text className="text-lg font-bold text-warmBrown mb-4">When should it unlock?</Text>
              <View className="space-y-3 mb-6">
                {[
                  { id: 'date', label: 'On a specific date', desc: 'Choose a meaningful date' },
                  { id: 'milestone', label: 'Community milestone', desc: 'When community reaches a goal' },
                  { id: 'members', label: 'Member count', desc: 'When enough members join' },
                ].map((option) => (
                  <Pressable
                    key={option.id}
                    onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
                    className="bg-white rounded-xl p-4 flex-row items-center mb-3"
                  >
                    <View className="w-10 h-10 rounded-full bg-purple-100 items-center justify-center">
                      <Clock size={20} color="#7C3AED" />
                    </View>
                    <View className="flex-1 ml-3">
                      <Text className="text-warmBrown font-semibold">{option.label}</Text>
                      <Text className="text-gray-500 text-sm">{option.desc}</Text>
                    </View>
                  </Pressable>
                ))}
              </View>

              {/* Create Button */}
              <Pressable
                onPress={() => {
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                  setShowCreateModal(false);
                }}
              >
                <LinearGradient
                  colors={['#7C3AED', '#6D28D9']}
                  style={{ borderRadius: 16, paddingVertical: 16, alignItems: 'center' }}
                >
                  <Text className="text-white font-bold text-lg">Continue</Text>
                </LinearGradient>
              </Pressable>

              <View className="h-10" />
            </ScrollView>
          </SafeAreaView>
        </Modal>
      </SafeAreaView>
    </View>
  );
}
