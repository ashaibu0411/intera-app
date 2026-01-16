import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import {
  ArrowLeft,
  Users,
  Globe,
  GraduationCap,
  Church,
  Briefcase,
  Baby,
  Heart,
  MapPin,
  Plus,
  Check,
  ChevronRight,
  MessageCircle,
  Calendar,
  Search,
  X,
  Languages,
  Flag,
  Home,
} from 'lucide-react-native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useStore } from '@/lib/store';

// Circle types
type CircleCategory = 'generation' | 'faith' | 'profession' | 'language' | 'interest' | 'family';

interface DiasporaCircle {
  id: string;
  name: string;
  description: string;
  category: CircleCategory;
  icon: typeof Users;
  memberCount: number;
  cities: string[];
  isJoined: boolean;
  coverImage: string;
  recentActivity: string;
  color: [string, string];
}

// Available circles
const DIASPORA_CIRCLES: DiasporaCircle[] = [
  {
    id: 'c1',
    name: 'First-Gen Africans',
    description: 'Born in Africa, now living abroad. Share experiences of adapting while preserving roots.',
    category: 'generation',
    icon: Globe,
    memberCount: 2453,
    cities: ['Aurora', 'Denver', 'Chicago', 'Atlanta', 'Houston'],
    isJoined: true,
    coverImage: 'https://images.unsplash.com/photo-1523805009345-7448845a9e53?w=800&h=400&fit=crop',
    recentActivity: '23 new posts today',
    color: ['#8B5CF6', '#7C3AED'],
  },
  {
    id: 'c2',
    name: 'Second-Gen Diaspora',
    description: 'Born abroad to immigrant parents. Navigating dual identities and cultural bridges.',
    category: 'generation',
    icon: Users,
    memberCount: 1876,
    cities: ['Aurora', 'Denver', 'New York', 'London', 'Toronto'],
    isJoined: false,
    coverImage: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&h=400&fit=crop',
    recentActivity: '15 new posts today',
    color: ['#EC4899', '#DB2777'],
  },
  {
    id: 'c3',
    name: 'Diaspora Students',
    description: 'International students and those pursuing education abroad. Study tips, visa help, and community.',
    category: 'profession',
    icon: GraduationCap,
    memberCount: 3241,
    cities: ['Aurora', 'Boulder', 'Fort Collins', 'Boston', 'LA'],
    isJoined: true,
    coverImage: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800&h=400&fit=crop',
    recentActivity: '42 new posts today',
    color: ['#3B82F6', '#2563EB'],
  },
  {
    id: 'c4',
    name: 'Faith & Spirituality',
    description: 'Connect across faiths - Christians, Muslims, and others finding community through belief.',
    category: 'faith',
    icon: Church,
    memberCount: 1543,
    cities: ['Aurora', 'Denver', 'Dallas', 'Phoenix', 'Seattle'],
    isJoined: false,
    coverImage: 'https://images.unsplash.com/photo-1507692049790-de58290a4334?w=800&h=400&fit=crop',
    recentActivity: '8 new posts today',
    color: ['#F59E0B', '#D97706'],
  },
  {
    id: 'c5',
    name: 'Diaspora Professionals',
    description: 'Career networking, job opportunities, and professional development for diaspora members.',
    category: 'profession',
    icon: Briefcase,
    memberCount: 4521,
    cities: ['Aurora', 'Denver', 'San Francisco', 'New York', 'London'],
    isJoined: true,
    coverImage: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=400&fit=crop',
    recentActivity: '67 new posts today',
    color: ['#10B981', '#059669'],
  },
  {
    id: 'c6',
    name: 'Diaspora Parents',
    description: 'Raising children between cultures. Share parenting tips, school advice, and cultural traditions.',
    category: 'family',
    icon: Baby,
    memberCount: 987,
    cities: ['Aurora', 'Denver', 'Minneapolis', 'Columbus', 'Phoenix'],
    isJoined: false,
    coverImage: 'https://images.unsplash.com/photo-1476703993599-0035a21b17a9?w=800&h=400&fit=crop',
    recentActivity: '12 new posts today',
    color: ['#F472B6', '#EC4899'],
  },
  {
    id: 'c7',
    name: 'French Speakers',
    description: 'Francophones from Africa, Caribbean, and beyond. Parlez-vous français?',
    category: 'language',
    icon: Languages,
    memberCount: 1234,
    cities: ['Aurora', 'Denver', 'Montreal', 'Paris', 'Brussels'],
    isJoined: false,
    coverImage: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&h=400&fit=crop',
    recentActivity: '19 new posts today',
    color: ['#6366F1', '#4F46E5'],
  },
  {
    id: 'c8',
    name: 'Diaspora Entrepreneurs',
    description: 'Building businesses that bridge continents. Share opportunities and support each other.',
    category: 'profession',
    icon: Briefcase,
    memberCount: 2156,
    cities: ['Aurora', 'Denver', 'Lagos', 'Accra', 'Nairobi'],
    isJoined: true,
    coverImage: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=800&h=400&fit=crop',
    recentActivity: '31 new posts today',
    color: ['#EF4444', '#DC2626'],
  },
];

const getCategoryLabel = (category: CircleCategory): string => {
  switch (category) {
    case 'generation': return 'Generation';
    case 'faith': return 'Faith';
    case 'profession': return 'Professional';
    case 'language': return 'Language';
    case 'interest': return 'Interest';
    case 'family': return 'Family';
    default: return 'Other';
  }
};

export default function DiasporaCirclesScreen() {
  const currentUser = useStore((s) => s.currentUser);
  const selectedLocation = useStore((s) => s.selectedLocation);
  const { filter } = useLocalSearchParams<{ filter?: string }>();
  const [circles, setCircles] = useState(DIASPORA_CIRCLES);
  const [searchQuery, setSearchQuery] = useState('');
  const initialFilter =
    filter && ['generation', 'faith', 'profession', 'language', 'interest', 'family'].includes(filter)
      ? (filter as CircleCategory)
      : 'all';
  const [activeFilter, setActiveFilter] = useState<CircleCategory | 'all'>(initialFilter);
  const [showCircleDetail, setShowCircleDetail] = useState<DiasporaCircle | null>(null);

  const filteredCircles = circles.filter((circle) => {
    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (
        !circle.name.toLowerCase().includes(query) &&
        !circle.description.toLowerCase().includes(query)
      ) {
        return false;
      }
    }

    // Filter by category
    if (activeFilter !== 'all' && circle.category !== activeFilter) {
      return false;
    }

    return true;
  });

  const myCircles = circles.filter((c) => c.isJoined);

  const handleJoinCircle = (circleId: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setCircles((prev) =>
      prev.map((c) =>
        c.id === circleId
          ? { ...c, isJoined: true, memberCount: c.memberCount + 1 }
          : c
      )
    );
  };

  const handleLeaveCircle = (circleId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setCircles((prev) =>
      prev.map((c) =>
        c.id === circleId
          ? { ...c, isJoined: false, memberCount: c.memberCount - 1 }
          : c
      )
    );
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
            <Text className="text-xl font-bold text-warmBrown">Diaspora Circles</Text>
            <Text className="text-gray-500 text-sm">
              Identity beyond geography
            </Text>
          </View>
        </Animated.View>

        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          {/* Hero */}
          <Animated.View entering={FadeInUp.duration(400).delay(100)} className="px-5 pt-5">
            <LinearGradient
              colors={['#7C3AED', '#5B21B6', '#4C1D95']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ borderRadius: 24, padding: 24 }}
            >
              <View className="flex-row items-center">
                <View className="w-14 h-14 rounded-full bg-white/20 items-center justify-center">
                  <Globe size={28} color="#FFFFFF" />
                </View>
                <View className="flex-1 ml-4">
                  <Text className="text-white text-xl font-bold">
                    Find Your People
                  </Text>
                  <Text className="text-white/70 text-base">
                    Circles connect you across cities
                  </Text>
                </View>
              </View>

              <Text className="text-white/80 mt-4 leading-6">
                Join circles based on your identity - generation, faith, profession, or language. Connect with diaspora members worldwide who share your experience.
              </Text>

              {/* My Circles Preview */}
              {myCircles.length > 0 && (
                <View className="mt-4 pt-4 border-t border-white/20">
                  <Text className="text-white/70 text-sm mb-2">Your Circles</Text>
                  <View className="flex-row flex-wrap gap-2">
                    {myCircles.slice(0, 3).map((circle) => (
                      <View
                        key={circle.id}
                        className="bg-white/20 rounded-full px-3 py-1.5 flex-row items-center"
                      >
                        <circle.icon size={14} color="#FFFFFF" />
                        <Text className="text-white text-sm ml-1.5">
                          {circle.name.split(' ')[0]}
                        </Text>
                      </View>
                    ))}
                    {myCircles.length > 3 && (
                      <View className="bg-white/20 rounded-full px-3 py-1.5">
                        <Text className="text-white text-sm">
                          +{myCircles.length - 3} more
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              )}
            </LinearGradient>
          </Animated.View>

          {/* Search */}
          <Animated.View entering={FadeInUp.duration(400).delay(200)} className="px-5 mt-4">
            <View className="flex-row items-center bg-white rounded-xl px-4 py-3 shadow-sm">
              <Search size={20} color="#9CA3AF" />
              <TextInput
                placeholder="Search circles..."
                placeholderTextColor="#9CA3AF"
                value={searchQuery}
                onChangeText={setSearchQuery}
                className="flex-1 ml-3 text-warmBrown text-base"
              />
            </View>
          </Animated.View>

          {/* Category Filters */}
          <Animated.View entering={FadeInUp.duration(400).delay(300)} className="mt-4">
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 20 }}
            >
              {[
                { id: 'all', label: 'All', icon: Users },
                { id: 'generation', label: 'Generation', icon: Globe },
                { id: 'profession', label: 'Professional', icon: Briefcase },
                { id: 'faith', label: 'Faith', icon: Church },
                { id: 'language', label: 'Language', icon: Languages },
                { id: 'family', label: 'Family', icon: Home },
              ].map((filter) => {
                const isActive = activeFilter === filter.id;
                return (
                  <Pressable
                    key={filter.id}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setActiveFilter(filter.id as CircleCategory | 'all');
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

          {/* Circles List */}
          <Animated.View entering={FadeInUp.duration(400).delay(400)} className="px-5 mt-4">
            {filteredCircles.map((circle, index) => {
              const Icon = circle.icon;

              return (
                <Animated.View
                  key={circle.id}
                  entering={FadeInUp.duration(300).delay(index * 50)}
                  className="mb-4"
                >
                  <Pressable
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setShowCircleDetail(circle);
                    }}
                    className="bg-white rounded-2xl overflow-hidden shadow-sm"
                  >
                    {/* Cover */}
                    <View className="relative">
                      <Image
                        source={{ uri: circle.coverImage }}
                        style={{ width: '100%', height: 100 }}
                        contentFit="cover"
                      />
                      <LinearGradient
                        colors={['transparent', 'rgba(0,0,0,0.7)']}
                        style={{
                          position: 'absolute',
                          bottom: 0,
                          left: 0,
                          right: 0,
                          height: 60,
                        }}
                      />

                      {/* Category Badge */}
                      <View className="absolute top-3 left-3">
                        <LinearGradient
                          colors={circle.color}
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
                            {getCategoryLabel(circle.category)}
                          </Text>
                        </LinearGradient>
                      </View>

                      {/* Joined Badge */}
                      {circle.isJoined && (
                        <View className="absolute top-3 right-3 bg-green-500 rounded-full px-3 py-1 flex-row items-center">
                          <Check size={14} color="#FFFFFF" />
                          <Text className="text-white text-xs font-semibold ml-1">Joined</Text>
                        </View>
                      )}

                      {/* Member Count */}
                      <View className="absolute bottom-3 left-3 flex-row items-center">
                        <Users size={14} color="#FFFFFF" />
                        <Text className="text-white text-sm font-semibold ml-1">
                          {circle.memberCount.toLocaleString()} members
                        </Text>
                      </View>
                    </View>

                    {/* Content */}
                    <View className="p-4">
                      <Text className="text-warmBrown font-bold text-lg">
                        {circle.name}
                      </Text>
                      <Text className="text-gray-500 text-sm mt-1" numberOfLines={2}>
                        {circle.description}
                      </Text>

                      {/* Cities */}
                      <View className="flex-row items-center mt-3">
                        <MapPin size={14} color="#9CA3AF" />
                        <Text className="text-gray-500 text-sm ml-1" numberOfLines={1}>
                          {circle.cities.slice(0, 3).join(', ')}
                          {circle.cities.length > 3 && ` +${circle.cities.length - 3} more`}
                        </Text>
                      </View>

                      {/* Activity & Action */}
                      <View className="flex-row items-center justify-between mt-3 pt-3 border-t border-gray-100">
                        <Text className="text-purple-600 text-sm">
                          {circle.recentActivity}
                        </Text>
                        {circle.isJoined ? (
                          <Pressable
                            onPress={(e) => {
                              e.stopPropagation();
                              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                              router.push({
                                pathname: '/circle-feed',
                                params: { circleId: circle.id },
                              });
                            }}
                            className="bg-purple-500 rounded-full px-4 py-2 flex-row items-center"
                          >
                            <MessageCircle size={14} color="#FFFFFF" />
                            <Text className="text-white font-semibold text-sm ml-1">
                              Open
                            </Text>
                          </Pressable>
                        ) : (
                          <Pressable
                            onPress={(e) => {
                              e.stopPropagation();
                              handleJoinCircle(circle.id);
                            }}
                            className="bg-gray-100 rounded-full px-4 py-2"
                          >
                            <Text className="text-warmBrown font-semibold text-sm">
                              Join
                            </Text>
                          </Pressable>
                        )}
                      </View>
                    </View>
                  </Pressable>
                </Animated.View>
              );
            })}

            {filteredCircles.length === 0 && (
              <View className="items-center py-12">
                <View className="w-16 h-16 rounded-full bg-gray-100 items-center justify-center mb-4">
                  <Users size={28} color="#9CA3AF" />
                </View>
                <Text className="text-gray-900 font-semibold text-lg">
                  No circles found
                </Text>
                <Text className="text-gray-500 text-center mt-1 px-8">
                  Try adjusting your search or filters
                </Text>
              </View>
            )}
          </Animated.View>
        </ScrollView>

        {/* Circle Detail Modal */}
        <Modal
          visible={showCircleDetail !== null}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowCircleDetail(null)}
        >
          {showCircleDetail && (
            <SafeAreaView className="flex-1 bg-cream">
              {/* Header Image */}
              <View className="relative">
                <Image
                  source={{ uri: showCircleDetail.coverImage }}
                  style={{ width: '100%', height: 200 }}
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
                <Pressable
                  onPress={() => setShowCircleDetail(null)}
                  className="absolute top-4 left-4 bg-black/50 rounded-full p-2"
                >
                  <X size={24} color="#FFFFFF" />
                </Pressable>
              </View>

              <ScrollView className="flex-1 px-5 -mt-8">
                <View className="bg-white rounded-2xl p-5 shadow-lg">
                  {/* Title */}
                  <View className="flex-row items-center">
                    <LinearGradient
                      colors={showCircleDetail.color}
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 12,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <showCircleDetail.icon size={24} color="#FFFFFF" />
                    </LinearGradient>
                    <View className="flex-1 ml-3">
                      <Text className="text-warmBrown font-bold text-xl">
                        {showCircleDetail.name}
                      </Text>
                      <Text className="text-gray-500 text-sm">
                        {showCircleDetail.memberCount.toLocaleString()} members
                      </Text>
                    </View>
                  </View>

                  {/* Description */}
                  <Text className="text-gray-600 mt-4 leading-6">
                    {showCircleDetail.description}
                  </Text>

                  {/* Cities */}
                  <View className="mt-4">
                    <Text className="text-warmBrown font-semibold mb-2">Active Cities</Text>
                    <View className="flex-row flex-wrap gap-2">
                      {showCircleDetail.cities.map((city) => (
                        <View
                          key={city}
                          className="bg-gray-100 rounded-full px-3 py-1.5 flex-row items-center"
                        >
                          <MapPin size={12} color="#6B7280" />
                          <Text className="text-gray-600 text-sm ml-1">{city}</Text>
                        </View>
                      ))}
                    </View>
                  </View>

                  {/* What You Get */}
                  <View className="mt-4 pt-4 border-t border-gray-100">
                    <Text className="text-warmBrown font-semibold mb-3">What You Get</Text>
                    {[
                      { icon: MessageCircle, text: 'Private discussion feed' },
                      { icon: Calendar, text: 'Circle-exclusive events' },
                      { icon: Users, text: 'Cross-city connections' },
                      { icon: Heart, text: 'Mentorship matching' },
                    ].map((item, index) => (
                      <View key={index} className="flex-row items-center py-2">
                        <View className="w-8 h-8 rounded-full bg-purple-100 items-center justify-center">
                          <item.icon size={16} color="#7C3AED" />
                        </View>
                        <Text className="text-gray-600 ml-3">{item.text}</Text>
                      </View>
                    ))}
                  </View>

                  {/* Action */}
                  {showCircleDetail.isJoined ? (
                    <View className="mt-6 space-y-3">
                      <Pressable
                        onPress={() => {
                          setShowCircleDetail(null);
                          router.push({
                            pathname: '/circle-feed',
                            params: { circleId: showCircleDetail.id },
                          });
                        }}
                      >
                        <LinearGradient
                          colors={showCircleDetail.color}
                          style={{ borderRadius: 16, paddingVertical: 16, alignItems: 'center' }}
                        >
                          <Text className="text-white font-bold text-lg">Open Circle</Text>
                        </LinearGradient>
                      </Pressable>
                      <Pressable
                        onPress={() => {
                          handleLeaveCircle(showCircleDetail.id);
                          setShowCircleDetail(null);
                        }}
                        className="bg-gray-100 rounded-xl py-4 items-center mt-3"
                      >
                        <Text className="text-gray-600 font-semibold">Leave Circle</Text>
                      </Pressable>
                    </View>
                  ) : (
                    <Pressable
                      onPress={() => {
                        handleJoinCircle(showCircleDetail.id);
                        setShowCircleDetail(null);
                      }}
                      className="mt-6"
                    >
                      <LinearGradient
                        colors={showCircleDetail.color}
                        style={{ borderRadius: 16, paddingVertical: 16, alignItems: 'center' }}
                      >
                        <Text className="text-white font-bold text-lg">Join This Circle</Text>
                      </LinearGradient>
                    </Pressable>
                  )}
                </View>

                <View className="h-10" />
              </ScrollView>
            </SafeAreaView>
          )}
        </Modal>
      </SafeAreaView>
    </View>
  );
}
