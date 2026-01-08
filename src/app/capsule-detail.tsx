import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import {
  ArrowLeft,
  BookOpen,
  Utensils,
  Music,
  Heart,
  Play,
  Mic,
  Image as ImageIcon,
  FileText,
  Plus,
  Clock,
  Users,
  MapPin,
  Share2,
  ThumbsUp,
  MessageCircle,
  X,
  Send,
} from 'lucide-react-native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useStore } from '@/lib/store';

// Capsule content items
interface CapsuleItem {
  id: string;
  type: 'story' | 'recipe' | 'audio' | 'photo' | 'video';
  title: string;
  preview: string;
  contributor: {
    name: string;
    avatar: string;
  };
  createdAt: string;
  likes: number;
  comments: number;
  image?: string;
}

// Mock capsule data
const CAPSULE_DATA = {
  tc2: {
    id: 'tc2',
    title: "Grandma's Recipes",
    description: 'Traditional recipes passed down through generations. From jollof rice to fufu, preserved for future generations.',
    type: 'recipe' as const,
    coverImage: 'https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=800&h=400&fit=crop',
    contributors: 56,
    itemCount: 89,
    items: [
      {
        id: 'item1',
        type: 'recipe' as const,
        title: 'Authentic Jollof Rice',
        preview: 'The perfect party jollof with that smoky base that everyone fights over...',
        contributor: {
          name: 'Amara Johnson',
          avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=face',
        },
        createdAt: '2024-12-10',
        likes: 234,
        comments: 45,
        image: 'https://images.unsplash.com/photo-1574894709920-11b28e7367e3?w=400&h=300&fit=crop',
      },
      {
        id: 'item2',
        type: 'recipe' as const,
        title: 'Traditional Fufu',
        preview: 'Hand-pounded fufu just like grandma made it. The secret is in the wrist motion...',
        contributor: {
          name: 'Kwame Asante',
          avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face',
        },
        createdAt: '2024-11-28',
        likes: 189,
        comments: 32,
        image: 'https://images.unsplash.com/photo-1567982047351-76b6f93e38ee?w=400&h=300&fit=crop',
      },
      {
        id: 'item3',
        type: 'story' as const,
        title: 'The Story Behind Our Pepper Soup',
        preview: 'Every family has their own pepper soup recipe. Ours came from my great-grandmother in Lagos...',
        contributor: {
          name: 'Fatima Hassan',
          avatar: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=200&h=200&fit=crop&crop=face',
        },
        createdAt: '2024-12-05',
        likes: 156,
        comments: 28,
      },
      {
        id: 'item4',
        type: 'photo' as const,
        title: 'Cooking with Grandma - 1987',
        preview: 'A rare photo of grandma teaching the family how to make chin chin...',
        contributor: {
          name: 'David Mensah',
          avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face',
        },
        createdAt: '2024-11-20',
        likes: 312,
        comments: 67,
        image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop',
      },
      {
        id: 'item5',
        type: 'recipe' as const,
        title: 'Nigerian Egusi Soup',
        preview: 'The richest egusi soup recipe with all the proper greens and stockfish...',
        contributor: {
          name: 'Grace Okonkwo',
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=face',
        },
        createdAt: '2024-12-12',
        likes: 201,
        comments: 41,
        image: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=400&h=300&fit=crop',
      },
    ] as CapsuleItem[],
  },
  tc3: {
    id: 'tc3',
    title: 'Wedding Traditions',
    description: 'How we celebrate love - traditional wedding ceremonies, customs, and blessings from different cultures.',
    type: 'tradition' as const,
    coverImage: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&h=400&fit=crop',
    contributors: 34,
    itemCount: 62,
    items: [
      {
        id: 'w1',
        type: 'story' as const,
        title: 'The Traditional Engagement Ceremony',
        preview: 'Before the white wedding, there\'s the traditional engagement. Here\'s how our family does it...',
        contributor: {
          name: 'Fatima Hassan',
          avatar: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=200&h=200&fit=crop&crop=face',
        },
        createdAt: '2024-11-15',
        likes: 278,
        comments: 52,
        image: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=400&h=300&fit=crop',
      },
      {
        id: 'w2',
        type: 'photo' as const,
        title: 'Traditional Wedding Attire Through Decades',
        preview: 'A collection of wedding photos from our family spanning 50 years...',
        contributor: {
          name: 'Elder Mensah',
          avatar: 'https://images.unsplash.com/photo-1566753323558-f4e0952af115?w=200&h=200&fit=crop&crop=face',
        },
        createdAt: '2024-10-28',
        likes: 445,
        comments: 89,
        image: 'https://images.unsplash.com/photo-1594122230689-45899d9e6f69?w=400&h=300&fit=crop',
      },
    ] as CapsuleItem[],
  },
  tc5: {
    id: 'tc5',
    title: 'Music of Our Homeland',
    description: 'Traditional songs, lullabies, and anthems that connect us to our roots.',
    type: 'music' as const,
    coverImage: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&h=400&fit=crop',
    contributors: 41,
    itemCount: 156,
    items: [
      {
        id: 'm1',
        type: 'audio' as const,
        title: 'Lullaby My Mother Sang',
        preview: 'A traditional lullaby passed down through generations. Recorded with my mother in 2019...',
        contributor: {
          name: 'DJ Kofi',
          avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face',
        },
        createdAt: '2024-08-20',
        likes: 567,
        comments: 123,
      },
      {
        id: 'm2',
        type: 'audio' as const,
        title: 'Wedding Song Collection',
        preview: 'The songs played at every wedding celebration. These bring joy to everyone...',
        contributor: {
          name: 'Grace Okonkwo',
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=face',
        },
        createdAt: '2024-07-15',
        likes: 389,
        comments: 78,
      },
    ] as CapsuleItem[],
  },
};

const getTypeIcon = (type: string) => {
  switch (type) {
    case 'recipe': return Utensils;
    case 'story': return BookOpen;
    case 'audio': return Mic;
    case 'photo': return ImageIcon;
    case 'video': return Play;
    default: return FileText;
  }
};

const getTypeColor = (type: string): [string, string] => {
  switch (type) {
    case 'recipe': return ['#F59E0B', '#D97706'];
    case 'story': return ['#6366F1', '#4F46E5'];
    case 'audio': return ['#8B5CF6', '#7C3AED'];
    case 'photo': return ['#10B981', '#059669'];
    case 'video': return ['#EC4899', '#DB2777'];
    default: return ['#6B7280', '#4B5563'];
  }
};

export default function CapsuleDetailScreen() {
  const { capsuleId } = useLocalSearchParams<{ capsuleId: string }>();
  const currentUser = useStore((s) => s.currentUser);
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'recipe' | 'story' | 'audio' | 'photo'>('all');

  // Get capsule data
  const capsule = CAPSULE_DATA[capsuleId as keyof typeof CAPSULE_DATA] || CAPSULE_DATA.tc2;

  const filteredItems = capsule.items.filter((item) => {
    if (activeFilter === 'all') return true;
    return item.type === activeFilter;
  });

  return (
    <View className="flex-1 bg-cream">
      <SafeAreaView edges={['top']} className="flex-1">
        {/* Header with Cover Image */}
        <View className="relative">
          <Image
            source={{ uri: capsule.coverImage }}
            style={{ width: '100%', height: 180 }}
            contentFit="cover"
          />
          <LinearGradient
            colors={['rgba(0,0,0,0.5)', 'transparent', 'rgba(0,0,0,0.7)']}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
            }}
          />

          {/* Back Button */}
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.back();
            }}
            className="absolute top-4 left-4 bg-black/50 rounded-full p-2"
          >
            <ArrowLeft size={24} color="#FFFFFF" />
          </Pressable>

          {/* Share Button */}
          <Pressable
            onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
            className="absolute top-4 right-4 bg-black/50 rounded-full p-2"
          >
            <Share2 size={20} color="#FFFFFF" />
          </Pressable>

          {/* Title Overlay */}
          <View className="absolute bottom-0 left-0 right-0 p-5">
            <Text className="text-white text-2xl font-bold">{capsule.title}</Text>
            <View className="flex-row items-center mt-2">
              <Users size={14} color="#FFFFFF" />
              <Text className="text-white/80 text-sm ml-1">
                {capsule.contributors} contributors • {capsule.itemCount} items
              </Text>
            </View>
          </View>
        </View>

        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          {/* Description */}
          <Animated.View entering={FadeInUp.duration(400).delay(100)} className="px-5 pt-4">
            <Text className="text-gray-600 leading-6">{capsule.description}</Text>
          </Animated.View>

          {/* Add Content Button */}
          <Animated.View entering={FadeInUp.duration(400).delay(150)} className="px-5 mt-4">
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                setShowAddModal(true);
              }}
              className="bg-purple-100 rounded-xl p-4 flex-row items-center"
            >
              <View className="w-10 h-10 rounded-full bg-purple-500 items-center justify-center">
                <Plus size={20} color="#FFFFFF" />
              </View>
              <View className="flex-1 ml-3">
                <Text className="text-purple-700 font-semibold">Add to this capsule</Text>
                <Text className="text-purple-500 text-sm">Share your story, recipe, or memory</Text>
              </View>
            </Pressable>
          </Animated.View>

          {/* Filter Tabs */}
          <Animated.View entering={FadeInUp.duration(400).delay(200)} className="mt-5">
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 20 }}
              style={{ flexGrow: 0 }}
            >
              {[
                { id: 'all', label: 'All', icon: FileText },
                { id: 'recipe', label: 'Recipes', icon: Utensils },
                { id: 'story', label: 'Stories', icon: BookOpen },
                { id: 'audio', label: 'Audio', icon: Mic },
                { id: 'photo', label: 'Photos', icon: ImageIcon },
              ].map((filter) => {
                const isActive = activeFilter === filter.id;
                return (
                  <Pressable
                    key={filter.id}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setActiveFilter(filter.id as typeof activeFilter);
                    }}
                    className={`flex-row items-center px-4 py-2.5 rounded-full mr-2 ${
                      isActive ? 'bg-purple-500' : 'bg-white'
                    }`}
                  >
                    <filter.icon size={16} color={isActive ? '#FFFFFF' : '#6B7280'} />
                    <Text
                      className={`ml-2 font-medium ${
                        isActive ? 'text-white' : 'text-gray-600'
                      }`}
                    >
                      {filter.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </Animated.View>

          {/* Items List */}
          <Animated.View entering={FadeInUp.duration(400).delay(300)} className="px-5 mt-4">
            {filteredItems.map((item, index) => {
              const TypeIcon = getTypeIcon(item.type);
              const colors = getTypeColor(item.type);

              return (
                <Animated.View
                  key={item.id}
                  entering={FadeInUp.duration(300).delay(index * 50)}
                  className="mb-4"
                >
                  <Pressable
                    onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
                    className="bg-white rounded-2xl overflow-hidden shadow-sm"
                  >
                    {/* Image if available */}
                    {item.image && (
                      <Image
                        source={{ uri: item.image }}
                        style={{ width: '100%', height: 160 }}
                        contentFit="cover"
                      />
                    )}

                    <View className="p-4">
                      {/* Type Badge */}
                      <View className="flex-row items-center mb-2">
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
                          <TypeIcon size={12} color="#FFFFFF" />
                          <Text className="text-white text-xs font-semibold ml-1 capitalize">
                            {item.type}
                          </Text>
                        </LinearGradient>
                      </View>

                      {/* Title */}
                      <Text className="text-warmBrown font-bold text-lg">{item.title}</Text>
                      <Text className="text-gray-500 text-sm mt-1" numberOfLines={2}>
                        {item.preview}
                      </Text>

                      {/* Contributor */}
                      <View className="flex-row items-center mt-3">
                        <Image
                          source={{ uri: item.contributor.avatar }}
                          style={{ width: 24, height: 24, borderRadius: 12 }}
                          contentFit="cover"
                        />
                        <Text className="text-gray-600 text-sm ml-2">
                          {item.contributor.name}
                        </Text>
                        <Text className="text-gray-400 text-sm ml-2">
                          • {new Date(item.createdAt).toLocaleDateString()}
                        </Text>
                      </View>

                      {/* Stats */}
                      <View className="flex-row items-center mt-3 pt-3 border-t border-gray-100">
                        <Pressable
                          onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
                          className="flex-row items-center mr-6"
                        >
                          <ThumbsUp size={16} color="#9CA3AF" />
                          <Text className="text-gray-500 text-sm ml-1">{item.likes}</Text>
                        </Pressable>
                        <Pressable
                          onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
                          className="flex-row items-center"
                        >
                          <MessageCircle size={16} color="#9CA3AF" />
                          <Text className="text-gray-500 text-sm ml-1">{item.comments}</Text>
                        </Pressable>
                      </View>
                    </View>
                  </Pressable>
                </Animated.View>
              );
            })}

            {filteredItems.length === 0 && (
              <View className="items-center py-12">
                <View className="w-16 h-16 rounded-full bg-gray-100 items-center justify-center mb-4">
                  <FileText size={28} color="#9CA3AF" />
                </View>
                <Text className="text-gray-900 font-semibold text-lg">No items yet</Text>
                <Text className="text-gray-500 text-center mt-1">
                  Be the first to contribute to this capsule
                </Text>
              </View>
            )}
          </Animated.View>
        </ScrollView>

        {/* Add Content Modal */}
        <Modal
          visible={showAddModal}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowAddModal(false)}
        >
          <SafeAreaView className="flex-1 bg-cream">
            <View className="flex-row items-center justify-between px-5 py-4 border-b border-gray-100">
              <Text className="text-xl font-bold text-warmBrown">Add to Capsule</Text>
              <Pressable onPress={() => setShowAddModal(false)} className="p-2">
                <X size={24} color="#2D1F1A" />
              </Pressable>
            </View>

            <ScrollView className="flex-1 px-5 pt-4">
              <Text className="text-gray-600 mb-6">
                What would you like to contribute to "{capsule.title}"?
              </Text>

              {/* Content Type Options */}
              <View className="space-y-3">
                {[
                  { type: 'recipe', label: 'Recipe', desc: 'Share a traditional recipe', icon: Utensils },
                  { type: 'story', label: 'Story', desc: 'Tell a family story or memory', icon: BookOpen },
                  { type: 'audio', label: 'Audio Recording', desc: 'Record a song, prayer, or voice memo', icon: Mic },
                  { type: 'photo', label: 'Photo', desc: 'Upload a historical or family photo', icon: ImageIcon },
                  { type: 'video', label: 'Video', desc: 'Share a video memory', icon: Play },
                ].map((option) => {
                  const colors = getTypeColor(option.type);
                  return (
                    <Pressable
                      key={option.type}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setShowAddModal(false);
                        // Navigate to specific add page
                        if (option.type === 'recipe') {
                          router.push('/add-recipe');
                        }
                      }}
                      className="bg-white rounded-xl p-4 flex-row items-center mb-3"
                    >
                      <LinearGradient
                        colors={colors}
                        style={{
                          width: 48,
                          height: 48,
                          borderRadius: 12,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <option.icon size={24} color="#FFFFFF" />
                      </LinearGradient>
                      <View className="flex-1 ml-3">
                        <Text className="text-warmBrown font-semibold text-lg">
                          {option.label}
                        </Text>
                        <Text className="text-gray-500 text-sm">{option.desc}</Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>

              <View className="h-10" />
            </ScrollView>
          </SafeAreaView>
        </Modal>
      </SafeAreaView>
    </View>
  );
}
