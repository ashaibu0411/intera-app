import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowLeft,
  Heart,
  HandHeart,
  Sparkles,
  Send,
  MessageCircle,
  Clock,
  Bookmark,
  Share2,
  MoreVertical,
  Plus,
  Flame,
  X,
  BookOpen,
  Church,
  Sunrise,
} from 'lucide-react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  SlideInRight,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useStore } from '@/lib/store';

type WallTab = 'prayer' | 'testimony' | 'encouragement';

interface PrayerRequest {
  id: string;
  author: {
    name: string;
    avatar: string;
    isAnonymous?: boolean;
  };
  content: string;
  category: 'healing' | 'family' | 'guidance' | 'provision' | 'thanksgiving' | 'other';
  prayerCount: number;
  createdAt: string;
  isPrayedFor?: boolean;
  isUrgent?: boolean;
}

interface Testimony {
  id: string;
  author: {
    name: string;
    avatar: string;
  };
  title: string;
  content: string;
  category: 'healing' | 'breakthrough' | 'salvation' | 'provision' | 'restoration' | 'miracle';
  praiseCount: number;
  commentCount: number;
  createdAt: string;
  hasPraised?: boolean;
}

interface Encouragement {
  id: string;
  author: {
    name: string;
    avatar: string;
  };
  content: string;
  verse?: string;
  verseReference?: string;
  heartCount: number;
  createdAt: string;
  hasHearted?: boolean;
}

// Mock prayer requests
const MOCK_PRAYERS: PrayerRequest[] = [
  {
    id: 'p1',
    author: {
      name: 'Anonymous',
      avatar: '',
      isAnonymous: true,
    },
    content: 'Please pray for my mother who is battling cancer. We believe in God\'s healing power and trust in His perfect timing.',
    category: 'healing',
    prayerCount: 47,
    createdAt: '2h ago',
    isUrgent: true,
  },
  {
    id: 'p2',
    author: {
      name: 'David M.',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
    },
    content: 'Seeking prayers for wisdom and guidance as I make a major career decision. Lord, let Your will be done in my life.',
    category: 'guidance',
    prayerCount: 23,
    createdAt: '4h ago',
  },
  {
    id: 'p3',
    author: {
      name: 'Grace O.',
      avatar: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=100&h=100&fit=crop&crop=face',
    },
    content: 'Praying for restoration in my marriage. We\'ve been through so much, but I believe God can make all things new.',
    category: 'family',
    prayerCount: 65,
    createdAt: '6h ago',
    isUrgent: true,
  },
  {
    id: 'p4',
    author: {
      name: 'Samuel K.',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face',
    },
    content: 'Thanking God for a successful surgery! Prayers for quick recovery would be appreciated. He is faithful!',
    category: 'thanksgiving',
    prayerCount: 89,
    createdAt: '1d ago',
  },
  {
    id: 'p5',
    author: {
      name: 'Anonymous',
      avatar: '',
      isAnonymous: true,
    },
    content: 'Please pray for my finances. Trusting God to provide for my family during this difficult season.',
    category: 'provision',
    prayerCount: 34,
    createdAt: '1d ago',
  },
];

// Mock testimonies
const MOCK_TESTIMONIES: Testimony[] = [
  {
    id: 't1',
    author: {
      name: 'Blessing A.',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop&crop=face',
    },
    title: 'God Healed My Son!',
    content: 'After 3 weeks in the ICU, the doctors said there was nothing more they could do. But God! Through the prayers of this community and our church, my son made a miraculous recovery. He walked out of that hospital on his own two feet. To God be the glory!',
    category: 'healing',
    praiseCount: 234,
    commentCount: 45,
    createdAt: '3h ago',
  },
  {
    id: 't2',
    author: {
      name: 'Emmanuel T.',
      avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop&crop=face',
    },
    title: 'From Homeless to Homeowner',
    content: 'Two years ago, I lost everything - my job, my apartment, my hope. I was living in my car. I cried out to God and He heard me. Through His grace and this beautiful community, I now have a stable job and just closed on my first home! Never give up on God.',
    category: 'breakthrough',
    praiseCount: 567,
    commentCount: 89,
    createdAt: '1d ago',
  },
  {
    id: 't3',
    author: {
      name: 'Rebecca N.',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face',
    },
    title: 'My Husband Gave His Life to Christ',
    content: 'After 15 years of praying for my husband\'s salvation, he finally surrendered his life to Jesus last Sunday! I almost lost hope so many times, but God reminded me that His timing is perfect. Keep praying, keep believing!',
    category: 'salvation',
    praiseCount: 892,
    commentCount: 156,
    createdAt: '2d ago',
  },
];

// Mock encouragements
const MOCK_ENCOURAGEMENTS: Encouragement[] = [
  {
    id: 'e1',
    author: {
      name: 'Pastor James',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
    },
    content: 'Whatever you\'re facing today, remember that the same God who parted the Red Sea is the same God who is with you right now. He hasn\'t changed. Trust Him.',
    verse: 'Jesus Christ is the same yesterday and today and forever.',
    verseReference: 'Hebrews 13:8',
    heartCount: 156,
    createdAt: '1h ago',
  },
  {
    id: 'e2',
    author: {
      name: 'Sister Mary',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face',
    },
    content: 'To everyone carrying a heavy burden this morning: Cast it on Him. He cares for you more than you could ever imagine. You are not alone.',
    verse: 'Cast all your anxiety on him because he cares for you.',
    verseReference: '1 Peter 5:7',
    heartCount: 234,
    createdAt: '3h ago',
  },
  {
    id: 'e3',
    author: {
      name: 'Brother Daniel',
      avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100&h=100&fit=crop&crop=face',
    },
    content: 'Your mess is becoming your message. Your test is becoming your testimony. Don\'t give up - God is working all things together for your good!',
    verse: 'And we know that in all things God works for the good of those who love him.',
    verseReference: 'Romans 8:28',
    heartCount: 445,
    createdAt: '6h ago',
  },
];

const PRAYER_CATEGORIES = [
  { key: 'all', label: 'All' },
  { key: 'healing', label: '🙏 Healing', color: '#EF4444' },
  { key: 'family', label: '👨‍👩‍👧 Family', color: '#EC4899' },
  { key: 'guidance', label: '🧭 Guidance', color: '#8B5CF6' },
  { key: 'provision', label: '💰 Provision', color: '#10B981' },
  { key: 'thanksgiving', label: '🙌 Thanks', color: '#F59E0B' },
];

export default function FaithWallsScreen() {
  const [activeTab, setActiveTab] = useState<WallTab>('prayer');
  const [showPostModal, setShowPostModal] = useState(false);
  const [postContent, setPostContent] = useState('');
  const [postTitle, setPostTitle] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [prayers, setPrayers] = useState(MOCK_PRAYERS);
  const [testimonies, setTestimonies] = useState(MOCK_TESTIMONIES);
  const [encouragements, setEncouragements] = useState(MOCK_ENCOURAGEMENTS);

  const currentUser = useStore((s) => s.currentUser);
  const isGuest = useStore((s) => s.isGuest);

  const handlePray = (prayerId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setPrayers(prev =>
      prev.map(p =>
        p.id === prayerId
          ? { ...p, isPrayedFor: !p.isPrayedFor, prayerCount: p.isPrayedFor ? p.prayerCount - 1 : p.prayerCount + 1 }
          : p
      )
    );
  };

  const handlePraise = (testimonyId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setTestimonies(prev =>
      prev.map(t =>
        t.id === testimonyId
          ? { ...t, hasPraised: !t.hasPraised, praiseCount: t.hasPraised ? t.praiseCount - 1 : t.praiseCount + 1 }
          : t
      )
    );
  };

  const handleHeart = (encouragementId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEncouragements(prev =>
      prev.map(e =>
        e.id === encouragementId
          ? { ...e, hasHearted: !e.hasHearted, heartCount: e.hasHearted ? e.heartCount - 1 : e.heartCount + 1 }
          : e
      )
    );
  };

  const handlePost = () => {
    if (isGuest || !currentUser) {
      router.push('/signup');
      return;
    }
    setShowPostModal(true);
  };

  const submitPost = () => {
    if (!postContent.trim()) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    // Add new post logic here
    setShowPostModal(false);
    setPostContent('');
    setPostTitle('');
    setIsAnonymous(false);
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      healing: '#EF4444',
      family: '#EC4899',
      guidance: '#8B5CF6',
      provision: '#10B981',
      thanksgiving: '#F59E0B',
      breakthrough: '#3B82F6',
      salvation: '#C9A227',
      restoration: '#06B6D4',
      miracle: '#F97316',
      other: '#6B7280',
    };
    return colors[category] || '#6B7280';
  };

  const filteredPrayers = selectedCategory === 'all'
    ? prayers
    : prayers.filter(p => p.category === selectedCategory);

  const renderTabs = () => (
    <View className="flex-row bg-white/10 rounded-2xl p-1 mx-5 mb-4">
      {[
        { key: 'prayer', label: 'Prayer Wall', icon: HandHeart },
        { key: 'testimony', label: 'Testimonies', icon: Sparkles },
        { key: 'encouragement', label: 'Encourage', icon: Heart },
      ].map((tab) => (
        <Pressable
          key={tab.key}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setActiveTab(tab.key as WallTab);
          }}
          className={`flex-1 flex-row items-center justify-center py-3 rounded-xl ${
            activeTab === tab.key ? 'bg-white' : ''
          }`}
        >
          <tab.icon
            size={16}
            color={activeTab === tab.key ? '#8B4513' : '#FFFFFF'}
          />
          <Text
            className={`ml-1.5 font-semibold text-xs ${
              activeTab === tab.key ? 'text-amber-900' : 'text-white/80'
            }`}
          >
            {tab.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );

  const renderPrayerWall = () => (
    <View className="flex-1">
      {/* Categories */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="mb-4"
        contentContainerStyle={{ paddingHorizontal: 20 }}
        style={{ flexGrow: 0 }}
      >
        {PRAYER_CATEGORIES.map((cat) => (
          <Pressable
            key={cat.key}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setSelectedCategory(cat.key);
            }}
            className={`px-4 py-2 rounded-full mr-2 ${
              selectedCategory === cat.key ? 'bg-amber-100' : 'bg-white/80'
            }`}
          >
            <Text
              className={`font-medium text-sm ${
                selectedCategory === cat.key ? 'text-amber-900' : 'text-gray-600'
              }`}
            >
              {cat.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Prayer Requests */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
      >
        {filteredPrayers.map((prayer, index) => (
          <Animated.View
            key={prayer.id}
            entering={FadeInDown.delay(index * 80).springify()}
          >
            <View className="bg-white rounded-3xl p-5 mb-4 shadow-sm">
              {/* Urgent Badge */}
              {prayer.isUrgent && (
                <View className="flex-row items-center mb-3">
                  <View className="bg-red-100 px-3 py-1 rounded-full flex-row items-center">
                    <Flame size={14} color="#DC2626" />
                    <Text className="text-red-600 font-semibold text-xs ml-1">
                      Urgent Prayer
                    </Text>
                  </View>
                </View>
              )}

              {/* Author */}
              <View className="flex-row items-center mb-3">
                {prayer.author.isAnonymous ? (
                  <View className="w-10 h-10 rounded-full bg-gray-200 items-center justify-center">
                    <HandHeart size={20} color="#9CA3AF" />
                  </View>
                ) : (
                  <Image
                    source={{ uri: prayer.author.avatar }}
                    style={{ width: 40, height: 40, borderRadius: 20 }}
                  />
                )}
                <View className="ml-3 flex-1">
                  <Text className="font-semibold text-gray-900">
                    {prayer.author.isAnonymous ? 'Anonymous' : prayer.author.name}
                  </Text>
                  <Text className="text-gray-400 text-xs">{prayer.createdAt}</Text>
                </View>
                <View
                  className="px-3 py-1 rounded-full"
                  style={{ backgroundColor: `${getCategoryColor(prayer.category)}20` }}
                >
                  <Text
                    className="text-xs font-medium capitalize"
                    style={{ color: getCategoryColor(prayer.category) }}
                  >
                    {prayer.category}
                  </Text>
                </View>
              </View>

              {/* Content */}
              <Text className="text-gray-700 leading-6 mb-4">
                {prayer.content}
              </Text>

              {/* Actions */}
              <View className="flex-row items-center justify-between pt-3 border-t border-gray-100">
                <Pressable
                  onPress={() => handlePray(prayer.id)}
                  className={`flex-row items-center px-4 py-2 rounded-full ${
                    prayer.isPrayedFor ? 'bg-amber-100' : 'bg-gray-100'
                  }`}
                >
                  <HandHeart
                    size={18}
                    color={prayer.isPrayedFor ? '#B45309' : '#6B7280'}
                    fill={prayer.isPrayedFor ? '#B45309' : 'transparent'}
                  />
                  <Text
                    className={`ml-2 font-semibold ${
                      prayer.isPrayedFor ? 'text-amber-700' : 'text-gray-600'
                    }`}
                  >
                    {prayer.isPrayedFor ? 'Prayed' : 'Pray'}
                  </Text>
                </Pressable>
                <View className="flex-row items-center">
                  <HandHeart size={16} color="#9CA3AF" />
                  <Text className="text-gray-500 ml-1.5">
                    {prayer.prayerCount} prayers
                  </Text>
                </View>
              </View>
            </View>
          </Animated.View>
        ))}
      </ScrollView>
    </View>
  );

  const renderTestimonyWall = () => (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
    >
      {testimonies.map((testimony, index) => (
        <Animated.View
          key={testimony.id}
          entering={FadeInDown.delay(index * 80).springify()}
        >
          <View className="bg-white rounded-3xl overflow-hidden mb-4 shadow-sm">
            {/* Header Gradient */}
            <LinearGradient
              colors={['#FEF3C7', '#FDE68A']}
              style={{ padding: 16 }}
            >
              <View className="flex-row items-center">
                <Image
                  source={{ uri: testimony.author.avatar }}
                  style={{ width: 48, height: 48, borderRadius: 24, borderWidth: 3, borderColor: '#FFF' }}
                />
                <View className="ml-3 flex-1">
                  <Text className="font-bold text-amber-900">{testimony.author.name}</Text>
                  <Text className="text-amber-700 text-xs">{testimony.createdAt}</Text>
                </View>
                <View
                  className="px-3 py-1 rounded-full bg-white/80"
                >
                  <Text
                    className="text-xs font-bold capitalize"
                    style={{ color: getCategoryColor(testimony.category) }}
                  >
                    {testimony.category}
                  </Text>
                </View>
              </View>
            </LinearGradient>

            <View className="p-5">
              {/* Title */}
              <Text className="text-xl font-bold text-gray-900 mb-3">
                ✨ {testimony.title}
              </Text>

              {/* Content */}
              <Text className="text-gray-700 leading-6 mb-4">
                {testimony.content}
              </Text>

              {/* Actions */}
              <View className="flex-row items-center justify-between pt-3 border-t border-gray-100">
                <Pressable
                  onPress={() => handlePraise(testimony.id)}
                  className={`flex-row items-center px-4 py-2 rounded-full ${
                    testimony.hasPraised ? 'bg-amber-100' : 'bg-gray-100'
                  }`}
                >
                  <Sparkles
                    size={18}
                    color={testimony.hasPraised ? '#B45309' : '#6B7280'}
                    fill={testimony.hasPraised ? '#B45309' : 'transparent'}
                  />
                  <Text
                    className={`ml-2 font-semibold ${
                      testimony.hasPraised ? 'text-amber-700' : 'text-gray-600'
                    }`}
                  >
                    Praise God!
                  </Text>
                </Pressable>
                <View className="flex-row items-center gap-4">
                  <View className="flex-row items-center">
                    <Sparkles size={14} color="#9CA3AF" />
                    <Text className="text-gray-500 ml-1">{testimony.praiseCount}</Text>
                  </View>
                  <View className="flex-row items-center">
                    <MessageCircle size={14} color="#9CA3AF" />
                    <Text className="text-gray-500 ml-1">{testimony.commentCount}</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </Animated.View>
      ))}
    </ScrollView>
  );

  const renderEncouragementWall = () => (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
    >
      {/* Daily Verse Banner */}
      <Animated.View entering={FadeInDown.delay(0).springify()}>
        <LinearGradient
          colors={['#1E3A5F', '#2D5A87']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ borderRadius: 24, padding: 20, marginBottom: 16 }}
        >
          <View className="flex-row items-center mb-3">
            <Sunrise size={20} color="#FCD34D" />
            <Text className="text-amber-300 font-semibold ml-2">Verse of the Day</Text>
          </View>
          <Text className="text-white text-lg font-medium leading-7 mb-3">
            "For I know the plans I have for you," declares the LORD, "plans to prosper you and not to harm you, plans to give you hope and a future."
          </Text>
          <Text className="text-amber-200 font-semibold">— Jeremiah 29:11</Text>
        </LinearGradient>
      </Animated.View>

      {encouragements.map((encouragement, index) => (
        <Animated.View
          key={encouragement.id}
          entering={FadeInDown.delay((index + 1) * 80).springify()}
        >
          <View className="bg-white rounded-3xl p-5 mb-4 shadow-sm">
            {/* Author */}
            <View className="flex-row items-center mb-4">
              <Image
                source={{ uri: encouragement.author.avatar }}
                style={{ width: 44, height: 44, borderRadius: 22 }}
              />
              <View className="ml-3 flex-1">
                <Text className="font-semibold text-gray-900">{encouragement.author.name}</Text>
                <Text className="text-gray-400 text-xs">{encouragement.createdAt}</Text>
              </View>
            </View>

            {/* Content */}
            <Text className="text-gray-800 text-base leading-7 mb-4">
              {encouragement.content}
            </Text>

            {/* Scripture Verse */}
            {encouragement.verse && (
              <View className="bg-amber-50 rounded-2xl p-4 mb-4">
                <View className="flex-row items-start">
                  <BookOpen size={18} color="#B45309" />
                  <View className="ml-3 flex-1">
                    <Text className="text-amber-900 italic leading-6">
                      "{encouragement.verse}"
                    </Text>
                    <Text className="text-amber-700 font-semibold mt-2">
                      — {encouragement.verseReference}
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {/* Actions */}
            <View className="flex-row items-center justify-between pt-3 border-t border-gray-100">
              <Pressable
                onPress={() => handleHeart(encouragement.id)}
                className={`flex-row items-center px-4 py-2 rounded-full ${
                  encouragement.hasHearted ? 'bg-red-100' : 'bg-gray-100'
                }`}
              >
                <Heart
                  size={18}
                  color={encouragement.hasHearted ? '#DC2626' : '#6B7280'}
                  fill={encouragement.hasHearted ? '#DC2626' : 'transparent'}
                />
                <Text
                  className={`ml-2 font-semibold ${
                    encouragement.hasHearted ? 'text-red-600' : 'text-gray-600'
                  }`}
                >
                  Amen
                </Text>
              </Pressable>
              <View className="flex-row items-center">
                <Heart size={16} color="#9CA3AF" />
                <Text className="text-gray-500 ml-1.5">{encouragement.heartCount}</Text>
              </View>
            </View>
          </View>
        </Animated.View>
      ))}
    </ScrollView>
  );

  return (
    <View className="flex-1">
      {/* Background Gradient */}
      <LinearGradient
        colors={['#8B4513', '#A0522D', '#CD853F']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 280 }}
      />

      <SafeAreaView edges={['top']} className="flex-1">
        {/* Header */}
        <Animated.View entering={FadeIn.duration(300)} className="px-5 pt-4 pb-2">
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-row items-center">
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.back();
                }}
                className="bg-white/20 rounded-full p-2 mr-3"
              >
                <ArrowLeft size={24} color="#FFFFFF" />
              </Pressable>
              <View>
                <Text className="text-2xl font-bold text-white">Faith Walls</Text>
                <Text className="text-white/80 text-sm">Share, Pray, Encourage</Text>
              </View>
            </View>
            <Pressable
              onPress={handlePost}
              className="bg-white rounded-full p-2.5"
            >
              <Plus size={22} color="#8B4513" />
            </Pressable>
          </View>

          {/* Scripture Banner */}
          <View className="bg-white/10 rounded-2xl p-4 mb-4">
            <Text className="text-white/90 text-center italic">
              "Therefore encourage one another and build each other up"
            </Text>
            <Text className="text-white/70 text-center text-sm mt-1">
              — 1 Thessalonians 5:11
            </Text>
          </View>

          {/* Tabs */}
          {renderTabs()}
        </Animated.View>

        {/* Content */}
        <View className="flex-1 bg-gray-50 rounded-t-3xl">
          {activeTab === 'prayer' && renderPrayerWall()}
          {activeTab === 'testimony' && renderTestimonyWall()}
          {activeTab === 'encouragement' && renderEncouragementWall()}
        </View>

        {/* Floating Post Button */}
        <Pressable
          onPress={handlePost}
          className="absolute bottom-6 right-6"
        >
          <LinearGradient
            colors={['#8B4513', '#A0522D']}
            style={{
              width: 60,
              height: 60,
              borderRadius: 30,
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 8,
            }}
          >
            <Plus size={28} color="#FFFFFF" />
          </LinearGradient>
        </Pressable>

        {/* Post Modal */}
        <Modal
          visible={showPostModal}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowPostModal(false)}
        >
          <View className="flex-1 bg-white">
            <SafeAreaView edges={['top']} className="flex-1">
              <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                className="flex-1"
              >
                {/* Modal Header */}
                <View className="flex-row items-center justify-between px-5 py-4 border-b border-gray-100">
                  <Pressable onPress={() => setShowPostModal(false)}>
                    <X size={24} color="#374151" />
                  </Pressable>
                  <Text className="text-lg font-bold text-gray-900">
                    {activeTab === 'prayer' ? 'Prayer Request' : activeTab === 'testimony' ? 'Share Testimony' : 'Encourage'}
                  </Text>
                  <Pressable
                    onPress={submitPost}
                    className="bg-amber-600 px-4 py-2 rounded-full"
                  >
                    <Text className="text-white font-semibold">Post</Text>
                  </Pressable>
                </View>

                <ScrollView className="flex-1 px-5 pt-4">
                  {activeTab === 'testimony' && (
                    <TextInput
                      placeholder="Title (e.g., God Answered My Prayer!)"
                      placeholderTextColor="#9CA3AF"
                      value={postTitle}
                      onChangeText={setPostTitle}
                      className="text-xl font-bold text-gray-900 mb-4"
                    />
                  )}

                  <TextInput
                    placeholder={
                      activeTab === 'prayer'
                        ? "Share your prayer request with the community..."
                        : activeTab === 'testimony'
                        ? "Share what God has done in your life..."
                        : "Share an encouraging word with someone today..."
                    }
                    placeholderTextColor="#9CA3AF"
                    value={postContent}
                    onChangeText={setPostContent}
                    multiline
                    className="text-base text-gray-700 leading-6"
                    style={{ minHeight: 150 }}
                  />

                  {activeTab === 'prayer' && (
                    <View className="mt-6">
                      <Pressable
                        onPress={() => setIsAnonymous(!isAnonymous)}
                        className="flex-row items-center"
                      >
                        <View
                          className={`w-6 h-6 rounded-md border-2 items-center justify-center mr-3 ${
                            isAnonymous ? 'bg-amber-600 border-amber-600' : 'border-gray-300'
                          }`}
                        >
                          {isAnonymous && <Text className="text-white text-xs">✓</Text>}
                        </View>
                        <Text className="text-gray-700">Post anonymously</Text>
                      </Pressable>
                    </View>
                  )}
                </ScrollView>
              </KeyboardAvoidingView>
            </SafeAreaView>
          </View>
        </Modal>
      </SafeAreaView>
    </View>
  );
}
