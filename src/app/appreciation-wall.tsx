import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { ArrowLeft, Heart, MessageCircle, Send, Plus, X, Sparkles, Award, ThumbsUp, Users, Star } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown, FadeIn, useAnimatedStyle, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

interface AppreciationPost {
  id: string;
  type: 'shoutout' | 'thank-you' | 'recognition' | 'milestone';
  from: {
    name: string;
    avatar: string;
  };
  to: {
    name: string;
    avatar: string;
  };
  message: string;
  category: string;
  likes: number;
  comments: number;
  createdAt: string;
  isLiked: boolean;
  reactions: { emoji: string; count: number }[];
}

const MOCK_POSTS: AppreciationPost[] = [
  {
    id: '1',
    type: 'shoutout',
    from: {
      name: 'Amara Johnson',
      avatar: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=200',
    },
    to: {
      name: 'Marcus Williams',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200',
    },
    message: 'Huge shoutout to Marcus for helping me move to my new apartment! You spent your whole Saturday helping and even brought lunch. You\'re the real MVP! 🙌',
    category: 'Helping Hand',
    likes: 89,
    comments: 12,
    createdAt: '2 hours ago',
    isLiked: false,
    reactions: [{ emoji: '❤️', count: 45 }, { emoji: '🙌', count: 32 }, { emoji: '🔥', count: 12 }],
  },
  {
    id: '2',
    type: 'thank-you',
    from: {
      name: 'David Okonkwo',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200',
    },
    to: {
      name: 'Keisha Thompson',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200',
    },
    message: 'Thank you Keisha for watching my kids while I was at the hospital with my mom. Your kindness meant the world to us during such a difficult time. God bless you! 🙏',
    category: 'Childcare',
    likes: 234,
    comments: 45,
    createdAt: '5 hours ago',
    isLiked: true,
    reactions: [{ emoji: '🙏', count: 156 }, { emoji: '❤️', count: 67 }, { emoji: '😢', count: 11 }],
  },
  {
    id: '3',
    type: 'recognition',
    from: {
      name: 'James Chen',
      avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200',
    },
    to: {
      name: 'Fatima Hassan',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
    },
    message: 'Fatima organized the most amazing community potluck last weekend! Over 50 people came and shared dishes from 12 different countries. You brought our neighborhood together! 🌍🍲',
    category: 'Community Leader',
    likes: 312,
    comments: 67,
    createdAt: '1 day ago',
    isLiked: false,
    reactions: [{ emoji: '🌟', count: 178 }, { emoji: '🍲', count: 89 }, { emoji: '❤️', count: 45 }],
  },
  {
    id: '4',
    type: 'milestone',
    from: {
      name: 'AfroConnect Community',
      avatar: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=200',
    },
    to: {
      name: 'Kwame Asante',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200',
    },
    message: 'Congratulations to Kwame on completing 100 skill swaps! You\'ve taught 100 people traditional Kente weaving and helped preserve our heritage. True community hero! 🏆',
    category: '100 Skill Swaps',
    likes: 567,
    comments: 89,
    createdAt: '2 days ago',
    isLiked: true,
    reactions: [{ emoji: '🏆', count: 234 }, { emoji: '🎉', count: 189 }, { emoji: '💪', count: 144 }],
  },
  {
    id: '5',
    type: 'shoutout',
    from: {
      name: 'Zara Thompson',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
    },
    to: {
      name: 'Michael Adeyemi',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200',
    },
    message: 'Michael gave me a ride to the airport at 5 AM and refused to take any money! Then he waited until I texted that I boarded safely. Angels really do exist! ✈️💕',
    category: 'Transportation',
    likes: 145,
    comments: 23,
    createdAt: '3 days ago',
    isLiked: false,
    reactions: [{ emoji: '😇', count: 78 }, { emoji: '❤️', count: 45 }, { emoji: '✈️', count: 22 }],
  },
];

const POST_TYPES = [
  { key: 'all', label: 'All', icon: Sparkles },
  { key: 'shoutout', label: 'Shoutouts', icon: Star },
  { key: 'thank-you', label: 'Thank You', icon: Heart },
  { key: 'recognition', label: 'Recognition', icon: Award },
  { key: 'milestone', label: 'Milestones', icon: Award },
];

const TYPE_COLORS = {
  shoutout: ['#F59E0B', '#D97706'],
  'thank-you': ['#EC4899', '#DB2777'],
  recognition: ['#8B5CF6', '#7C3AED'],
  milestone: ['#10B981', '#059669'],
};

const TYPE_EMOJIS = {
  shoutout: '📣',
  'thank-you': '🙏',
  recognition: '🏅',
  milestone: '🏆',
};

export default function AppreciationWallScreen() {
  const router = useRouter();
  const [selectedType, setSelectedType] = useState('all');
  const [posts, setPosts] = useState(MOCK_POSTS);
  const [showPostModal, setShowPostModal] = useState(false);
  const [newPost, setNewPost] = useState({
    type: 'shoutout' as 'shoutout' | 'thank-you' | 'recognition' | 'milestone',
    to: '',
    message: '',
  });

  const filteredPosts = posts.filter(post => {
    return selectedType === 'all' || post.type === selectedType;
  });

  const toggleLike = (postId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setPosts(prev => prev.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          isLiked: !post.isLiked,
          likes: post.isLiked ? post.likes - 1 : post.likes + 1,
        };
      }
      return post;
    }));
  };

  return (
    <View className="flex-1 bg-[#FDF2F8]">
      <SafeAreaView edges={['top']} className="flex-1">
        {/* Header */}
        <View className="px-5 pb-4">
          <View className="flex-row items-center justify-between mb-4">
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.back();
              }}
              className="w-10 h-10 rounded-full bg-white items-center justify-center shadow-sm"
            >
              <ArrowLeft size={20} color="#DB2777" />
            </Pressable>
            <View className="flex-row items-center">
              <Text className="text-2xl mr-2">💝</Text>
              <Text className="text-gray-800 text-lg font-bold">Appreciation Wall</Text>
            </View>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                setShowPostModal(true);
              }}
              className="w-10 h-10 rounded-full bg-pink-500 items-center justify-center"
            >
              <Plus size={20} color="#fff" />
            </Pressable>
          </View>

          {/* Stats Banner */}
          <LinearGradient
            colors={['#EC4899', '#DB2777']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ borderRadius: 20, padding: 16, marginBottom: 16 }}
          >
            <View className="flex-row justify-around">
              <View className="items-center">
                <Text className="text-white/80 text-xs">This Week</Text>
                <Text className="text-white text-2xl font-bold">247</Text>
                <Text className="text-white/70 text-xs">Shoutouts</Text>
              </View>
              <View className="w-px bg-white/20" />
              <View className="items-center">
                <Text className="text-white/80 text-xs">Community</Text>
                <Text className="text-white text-2xl font-bold">89%</Text>
                <Text className="text-white/70 text-xs">Feel Appreciated</Text>
              </View>
              <View className="w-px bg-white/20" />
              <View className="items-center">
                <Text className="text-white/80 text-xs">Total</Text>
                <Text className="text-white text-2xl font-bold">12K</Text>
                <Text className="text-white/70 text-xs">Thank You\'s</Text>
              </View>
            </View>
          </LinearGradient>

          {/* Type Filter */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }}>
            <View className="flex-row gap-2">
              {POST_TYPES.map((type) => {
                const Icon = type.icon;
                return (
                  <Pressable
                    key={type.key}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setSelectedType(type.key);
                    }}
                    className={`flex-row items-center px-4 py-2.5 rounded-full ${
                      selectedType === type.key
                        ? 'bg-pink-500'
                        : 'bg-white'
                    }`}
                    style={selectedType !== type.key ? { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 } : {}}
                  >
                    <Icon size={16} color={selectedType === type.key ? '#fff' : '#DB2777'} />
                    <Text className={`ml-2 font-medium ${
                      selectedType === type.key ? 'text-white' : 'text-gray-700'
                    }`}>
                      {type.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>
        </View>

        {/* Posts */}
        <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
          {filteredPosts.map((post, index) => (
            <Animated.View
              key={post.id}
              entering={FadeInDown.delay(index * 80).springify()}
            >
              <View className="bg-white rounded-3xl overflow-hidden mb-4 shadow-sm">
                {/* Type Header */}
                <LinearGradient
                  colors={TYPE_COLORS[post.type] as [string, string]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{ paddingVertical: 8, paddingHorizontal: 16 }}
                >
                  <View className="flex-row items-center">
                    <Text className="text-lg mr-2">{TYPE_EMOJIS[post.type]}</Text>
                    <Text className="text-white font-bold capitalize">{post.type.replace('-', ' ')}</Text>
                    <View className="ml-auto bg-white/20 px-2 py-0.5 rounded-full">
                      <Text className="text-white text-xs">{post.category}</Text>
                    </View>
                  </View>
                </LinearGradient>

                {/* From/To */}
                <View className="p-4">
                  <View className="flex-row items-center mb-4">
                    <View className="flex-row items-center flex-1">
                      <Image
                        source={{ uri: post.from.avatar }}
                        style={{ width: 40, height: 40, borderRadius: 20 }}
                        contentFit="cover"
                      />
                      <View className="ml-2">
                        <Text className="text-gray-400 text-xs">From</Text>
                        <Text className="text-gray-800 font-semibold">{post.from.name}</Text>
                      </View>
                    </View>

                    <View className="mx-3">
                      <Send size={20} color="#EC4899" />
                    </View>

                    <View className="flex-row items-center flex-1 justify-end">
                      <View className="mr-2 items-end">
                        <Text className="text-gray-400 text-xs">To</Text>
                        <Text className="text-gray-800 font-semibold">{post.to.name}</Text>
                      </View>
                      <Image
                        source={{ uri: post.to.avatar }}
                        style={{ width: 40, height: 40, borderRadius: 20, borderWidth: 2, borderColor: '#EC4899' }}
                        contentFit="cover"
                      />
                    </View>
                  </View>

                  {/* Message */}
                  <Text className="text-gray-700 text-base leading-6 mb-4">{post.message}</Text>

                  {/* Reactions */}
                  <View className="flex-row items-center mb-3">
                    {post.reactions.map((reaction, idx) => (
                      <View key={idx} className="flex-row items-center bg-gray-100 rounded-full px-2 py-1 mr-2">
                        <Text className="text-sm">{reaction.emoji}</Text>
                        <Text className="text-gray-600 text-xs ml-1">{reaction.count}</Text>
                      </View>
                    ))}
                  </View>

                  {/* Actions */}
                  <View className="flex-row items-center justify-between pt-3 border-t border-gray-100">
                    <Text className="text-gray-400 text-xs">{post.createdAt}</Text>

                    <View className="flex-row items-center gap-4">
                      <Pressable
                        onPress={() => toggleLike(post.id)}
                        className="flex-row items-center"
                      >
                        <Heart
                          size={20}
                          color={post.isLiked ? '#EC4899' : '#9CA3AF'}
                          fill={post.isLiked ? '#EC4899' : 'transparent'}
                        />
                        <Text className={`ml-1 ${post.isLiked ? 'text-pink-500' : 'text-gray-500'}`}>{post.likes}</Text>
                      </Pressable>

                      <Pressable className="flex-row items-center">
                        <MessageCircle size={20} color="#9CA3AF" />
                        <Text className="text-gray-500 ml-1">{post.comments}</Text>
                      </Pressable>
                    </View>
                  </View>
                </View>
              </View>
            </Animated.View>
          ))}

          <View className="h-32" />
        </ScrollView>

        {/* Post Modal */}
        <Modal visible={showPostModal} animationType="slide" transparent>
          <View className="flex-1 bg-black/50 justify-end">
            <View className="bg-white rounded-t-3xl p-6">
              <View className="flex-row items-center justify-between mb-6">
                <Text className="text-gray-800 text-xl font-bold">Give Appreciation</Text>
                <Pressable
                  onPress={() => setShowPostModal(false)}
                  className="w-8 h-8 rounded-full bg-gray-100 items-center justify-center"
                >
                  <X size={18} color="#6B7280" />
                </Pressable>
              </View>

              {/* Type Selection */}
              <View className="mb-4">
                <Text className="text-gray-600 text-sm mb-2">Type of Appreciation</Text>
                <View className="flex-row flex-wrap gap-2">
                  {[
                    { key: 'shoutout', label: '📣 Shoutout' },
                    { key: 'thank-you', label: '🙏 Thank You' },
                    { key: 'recognition', label: '🏅 Recognition' },
                  ].map((type) => (
                    <Pressable
                      key={type.key}
                      onPress={() => setNewPost(prev => ({ ...prev, type: type.key as any }))}
                      className={`px-4 py-2.5 rounded-full ${
                        newPost.type === type.key ? 'bg-pink-500' : 'bg-gray-100'
                      }`}
                    >
                      <Text className={newPost.type === type.key ? 'text-white font-medium' : 'text-gray-600'}>
                        {type.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              <View className="mb-4">
                <Text className="text-gray-600 text-sm mb-2">Who are you appreciating?</Text>
                <TextInput
                  placeholder="Search for a community member..."
                  placeholderTextColor="#9CA3AF"
                  value={newPost.to}
                  onChangeText={(text) => setNewPost(prev => ({ ...prev, to: text }))}
                  className="bg-gray-100 rounded-xl px-4 py-3 text-gray-800"
                />
              </View>

              <View className="mb-6">
                <Text className="text-gray-600 text-sm mb-2">Your Message</Text>
                <TextInput
                  placeholder="Share why you appreciate this person..."
                  placeholderTextColor="#9CA3AF"
                  value={newPost.message}
                  onChangeText={(text) => setNewPost(prev => ({ ...prev, message: text }))}
                  multiline
                  numberOfLines={4}
                  className="bg-gray-100 rounded-xl px-4 py-3 text-gray-800 h-24"
                  textAlignVertical="top"
                />
              </View>

              <Pressable
                onPress={() => {
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                  setShowPostModal(false);
                }}
                className="rounded-xl py-4 items-center overflow-hidden"
              >
                <LinearGradient
                  colors={['#EC4899', '#DB2777']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
                />
                <Text className="text-white font-bold text-lg">Post Appreciation 💝</Text>
              </Pressable>

              <View className="h-8" />
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </View>
  );
}
