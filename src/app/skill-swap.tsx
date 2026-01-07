import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { ArrowLeft, Search, Filter, Star, MessageCircle, ArrowLeftRight, Plus, X, Check, Sparkles } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';

interface SkillSwapper {
  id: string;
  name: string;
  avatar: string;
  location: string;
  offering: string;
  offeringCategory: string;
  offeringLevel: 'beginner' | 'intermediate' | 'expert';
  seeking: string;
  seekingCategory: string;
  description: string;
  rating: number;
  swapsCompleted: number;
  isVerified: boolean;
  responseTime: string;
}

const MOCK_SWAPPERS: SkillSwapper[] = [
  {
    id: '1',
    name: 'Amara Johnson',
    avatar: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=200',
    location: 'Atlanta, GA',
    offering: 'West African Cooking',
    offeringCategory: 'Culinary',
    offeringLevel: 'expert',
    seeking: 'Spanish Language',
    seekingCategory: 'Languages',
    description: 'I can teach you authentic Jollof rice, Egusi soup, and more West African dishes. Looking to improve my conversational Spanish.',
    rating: 4.9,
    swapsCompleted: 23,
    isVerified: true,
    responseTime: '< 1 hour',
  },
  {
    id: '2',
    name: 'Marcus Williams',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200',
    location: 'Houston, TX',
    offering: 'Guitar Lessons',
    offeringCategory: 'Music',
    offeringLevel: 'intermediate',
    seeking: 'Photography',
    seekingCategory: 'Creative',
    description: 'Acoustic and electric guitar for beginners. R&B, Soul, and Blues styles. Want to learn portrait and street photography.',
    rating: 4.7,
    swapsCompleted: 15,
    isVerified: true,
    responseTime: '< 2 hours',
  },
  {
    id: '3',
    name: 'Fatima Hassan',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200',
    location: 'Brooklyn, NY',
    offering: 'Arabic Calligraphy',
    offeringCategory: 'Art',
    offeringLevel: 'expert',
    seeking: 'Web Development',
    seekingCategory: 'Tech',
    description: 'Traditional Arabic calligraphy and modern designs. Looking to learn HTML/CSS and basic JavaScript.',
    rating: 5.0,
    swapsCompleted: 31,
    isVerified: true,
    responseTime: '< 30 min',
  },
  {
    id: '4',
    name: 'David Okonkwo',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200',
    location: 'Chicago, IL',
    offering: 'Financial Planning',
    offeringCategory: 'Business',
    offeringLevel: 'expert',
    seeking: 'Drumming',
    seekingCategory: 'Music',
    description: 'CPA with 10 years experience. Can help with budgeting, investing, and tax planning. Want to learn djembe drumming.',
    rating: 4.8,
    swapsCompleted: 19,
    isVerified: true,
    responseTime: '< 3 hours',
  },
  {
    id: '5',
    name: 'Zara Thompson',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
    location: 'Los Angeles, CA',
    offering: 'Yoga & Meditation',
    offeringCategory: 'Wellness',
    offeringLevel: 'intermediate',
    seeking: 'Hair Braiding',
    seekingCategory: 'Beauty',
    description: 'Certified yoga instructor specializing in vinyasa and restorative yoga. Would love to learn African hair braiding styles.',
    rating: 4.6,
    swapsCompleted: 12,
    isVerified: false,
    responseTime: '< 4 hours',
  },
  {
    id: '6',
    name: 'Kwame Asante',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200',
    location: 'Philadelphia, PA',
    offering: 'Kente Weaving',
    offeringCategory: 'Craft',
    offeringLevel: 'expert',
    seeking: 'Video Editing',
    seekingCategory: 'Tech',
    description: 'Master weaver from Ghana. Can teach traditional Kente patterns and meanings. Looking to learn Premiere Pro or Final Cut.',
    rating: 4.9,
    swapsCompleted: 8,
    isVerified: true,
    responseTime: '< 2 hours',
  },
];

const CATEGORIES = ['All', 'Music', 'Languages', 'Tech', 'Culinary', 'Art', 'Business', 'Wellness', 'Beauty', 'Craft', 'Creative'];

const LEVEL_COLORS = {
  beginner: '#4CAF50',
  intermediate: '#FF9800',
  expert: '#9C27B0',
};

export default function SkillSwapScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showPostModal, setShowPostModal] = useState(false);
  const [newSwap, setNewSwap] = useState({
    offering: '',
    seeking: '',
    description: '',
  });

  const filteredSwappers = MOCK_SWAPPERS.filter(swapper => {
    const matchesSearch = searchQuery === '' ||
      swapper.offering.toLowerCase().includes(searchQuery.toLowerCase()) ||
      swapper.seeking.toLowerCase().includes(searchQuery.toLowerCase()) ||
      swapper.name.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = selectedCategory === 'All' ||
      swapper.offeringCategory === selectedCategory ||
      swapper.seekingCategory === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const handlePostSwap = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setShowPostModal(false);
    setNewSwap({ offering: '', seeking: '', description: '' });
  };

  return (
    <View className="flex-1 bg-[#0F172A]">
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
              <ArrowLeftRight size={20} color="#10B981" />
              <Text className="text-white text-lg font-bold ml-2">Skill Swap</Text>
            </View>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                setShowPostModal(true);
              }}
              className="w-10 h-10 rounded-full bg-emerald-500 items-center justify-center"
            >
              <Plus size={20} color="#fff" />
            </Pressable>
          </View>

          {/* Stats Banner */}
          <View className="bg-gradient-to-r rounded-2xl p-4 mb-4" style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)' }}>
            <View className="flex-row justify-around">
              <View className="items-center">
                <Text className="text-emerald-400 text-2xl font-bold">247</Text>
                <Text className="text-gray-400 text-xs">Skills Available</Text>
              </View>
              <View className="w-px bg-white/10" />
              <View className="items-center">
                <Text className="text-emerald-400 text-2xl font-bold">1.2K</Text>
                <Text className="text-gray-400 text-xs">Swaps Completed</Text>
              </View>
              <View className="w-px bg-white/10" />
              <View className="items-center">
                <Text className="text-emerald-400 text-2xl font-bold">89%</Text>
                <Text className="text-gray-400 text-xs">Success Rate</Text>
              </View>
            </View>
          </View>

          {/* Search */}
          <View className="flex-row items-center bg-white/10 rounded-2xl px-4 py-3 mb-4">
            <Search size={18} color="#9CA3AF" />
            <TextInput
              placeholder="Search skills to learn or teach..."
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
              className="flex-1 ml-3 text-white text-base"
            />
          </View>

          {/* Categories */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }}>
            <View className="flex-row gap-2">
              {CATEGORIES.map((category) => (
                <Pressable
                  key={category}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSelectedCategory(category);
                  }}
                  className={`px-4 py-2 rounded-full ${
                    selectedCategory === category
                      ? 'bg-emerald-500'
                      : 'bg-white/10'
                  }`}
                >
                  <Text className={`font-medium ${
                    selectedCategory === category ? 'text-white' : 'text-gray-300'
                  }`}>
                    {category}
                  </Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Swappers List */}
        <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
          {filteredSwappers.map((swapper, index) => (
            <Animated.View
              key={swapper.id}
              entering={FadeInDown.delay(index * 80).springify()}
            >
              <Pressable
                onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
                className="bg-white/5 rounded-3xl p-4 mb-4 border border-white/10"
              >
                {/* User Info */}
                <View className="flex-row items-center mb-4">
                  <Image
                    source={{ uri: swapper.avatar }}
                    style={{ width: 50, height: 50, borderRadius: 25 }}
                    contentFit="cover"
                  />
                  <View className="flex-1 ml-3">
                    <View className="flex-row items-center">
                      <Text className="text-white font-bold text-base">{swapper.name}</Text>
                      {swapper.isVerified && (
                        <View className="ml-1.5 w-4 h-4 rounded-full bg-blue-500 items-center justify-center">
                          <Check size={10} color="#fff" />
                        </View>
                      )}
                    </View>
                    <Text className="text-gray-400 text-sm">{swapper.location}</Text>
                  </View>
                  <View className="items-end">
                    <View className="flex-row items-center">
                      <Star size={14} color="#FBBF24" fill="#FBBF24" />
                      <Text className="text-yellow-400 font-bold ml-1">{swapper.rating}</Text>
                    </View>
                    <Text className="text-gray-500 text-xs">{swapper.swapsCompleted} swaps</Text>
                  </View>
                </View>

                {/* Swap Details */}
                <View className="bg-white/5 rounded-2xl p-3 mb-3">
                  <View className="flex-row items-center justify-between">
                    {/* Offering */}
                    <View className="flex-1 items-center">
                      <Text className="text-gray-400 text-xs mb-1">OFFERING</Text>
                      <Text className="text-emerald-400 font-bold text-center">{swapper.offering}</Text>
                      <View
                        className="mt-1 px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: LEVEL_COLORS[swapper.offeringLevel] + '30' }}
                      >
                        <Text
                          className="text-xs capitalize"
                          style={{ color: LEVEL_COLORS[swapper.offeringLevel] }}
                        >
                          {swapper.offeringLevel}
                        </Text>
                      </View>
                    </View>

                    {/* Arrow */}
                    <View className="mx-3">
                      <ArrowLeftRight size={24} color="#10B981" />
                    </View>

                    {/* Seeking */}
                    <View className="flex-1 items-center">
                      <Text className="text-gray-400 text-xs mb-1">SEEKING</Text>
                      <Text className="text-orange-400 font-bold text-center">{swapper.seeking}</Text>
                      <View className="mt-1 px-2 py-0.5 rounded-full bg-gray-700">
                        <Text className="text-gray-400 text-xs">{swapper.seekingCategory}</Text>
                      </View>
                    </View>
                  </View>
                </View>

                {/* Description */}
                <Text className="text-gray-300 text-sm mb-3 leading-5">{swapper.description}</Text>

                {/* Actions */}
                <View className="flex-row items-center justify-between">
                  <Text className="text-gray-500 text-xs">Responds {swapper.responseTime}</Text>
                  <Pressable
                    onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)}
                    className="flex-row items-center bg-emerald-500 px-4 py-2 rounded-full"
                  >
                    <MessageCircle size={16} color="#fff" />
                    <Text className="text-white font-semibold ml-2">Propose Swap</Text>
                  </Pressable>
                </View>
              </Pressable>
            </Animated.View>
          ))}

          <View className="h-32" />
        </ScrollView>

        {/* Post Swap Modal */}
        <Modal visible={showPostModal} animationType="slide" transparent>
          <View className="flex-1 bg-black/80 justify-end">
            <View className="bg-[#1E293B] rounded-t-3xl p-6">
              <View className="flex-row items-center justify-between mb-6">
                <Text className="text-white text-xl font-bold">Post a Skill Swap</Text>
                <Pressable
                  onPress={() => setShowPostModal(false)}
                  className="w-8 h-8 rounded-full bg-white/10 items-center justify-center"
                >
                  <X size={18} color="#fff" />
                </Pressable>
              </View>

              <View className="mb-4">
                <Text className="text-gray-400 text-sm mb-2">What skill can you teach?</Text>
                <TextInput
                  placeholder="e.g., Guitar, Cooking, Photography..."
                  placeholderTextColor="#6B7280"
                  value={newSwap.offering}
                  onChangeText={(text) => setNewSwap(prev => ({ ...prev, offering: text }))}
                  className="bg-white/10 rounded-xl px-4 py-3 text-white"
                />
              </View>

              <View className="mb-4">
                <Text className="text-gray-400 text-sm mb-2">What skill do you want to learn?</Text>
                <TextInput
                  placeholder="e.g., Spanish, Web Design, Dancing..."
                  placeholderTextColor="#6B7280"
                  value={newSwap.seeking}
                  onChangeText={(text) => setNewSwap(prev => ({ ...prev, seeking: text }))}
                  className="bg-white/10 rounded-xl px-4 py-3 text-white"
                />
              </View>

              <View className="mb-6">
                <Text className="text-gray-400 text-sm mb-2">Tell us more about your skill</Text>
                <TextInput
                  placeholder="Describe your experience and what you're looking for..."
                  placeholderTextColor="#6B7280"
                  value={newSwap.description}
                  onChangeText={(text) => setNewSwap(prev => ({ ...prev, description: text }))}
                  multiline
                  numberOfLines={4}
                  className="bg-white/10 rounded-xl px-4 py-3 text-white h-24"
                  textAlignVertical="top"
                />
              </View>

              <Pressable
                onPress={handlePostSwap}
                className="bg-emerald-500 rounded-xl py-4 items-center"
              >
                <Text className="text-white font-bold text-lg">Post Swap</Text>
              </Pressable>

              <View className="h-8" />
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </View>
  );
}
