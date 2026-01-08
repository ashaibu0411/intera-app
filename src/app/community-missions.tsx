import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import {
  ArrowLeft,
  Target,
  Users,
  Heart,
  Briefcase,
  GraduationCap,
  Home,
  Sparkles,
  Trophy,
  CheckCircle2,
  Clock,
  ChevronRight,
  Flame,
  Star,
} from 'lucide-react-native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useStore } from '@/lib/store';

// Mission types
type MissionCategory = 'newcomers' | 'business' | 'education' | 'housing' | 'community';

interface Mission {
  id: string;
  title: string;
  description: string;
  category: MissionCategory;
  icon: typeof Heart;
  target: number;
  current: number;
  reward: string;
  endDate: string;
  participants: number;
  isJoined: boolean;
}

interface Contribution {
  id: string;
  missionId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  action: string;
  timestamp: string;
  points: number;
}

// Current quarter's missions
const CURRENT_MISSIONS: Mission[] = [
  {
    id: 'm1',
    title: 'Welcome 25 Newcomers',
    description: 'Help 25 new arrivals settle into our community this quarter. Provide guidance, answer questions, and make them feel at home.',
    category: 'newcomers',
    icon: Heart,
    target: 25,
    current: 18,
    reward: 'Community Hero Badge',
    endDate: '2025-03-31',
    participants: 47,
    isJoined: true,
  },
  {
    id: 'm2',
    title: 'Support 10 Local Businesses',
    description: 'Visit, review, and promote 10 diaspora-owned businesses. Help our entrepreneurs thrive!',
    category: 'business',
    icon: Briefcase,
    target: 10,
    current: 6,
    reward: 'Business Builder Badge',
    endDate: '2025-03-31',
    participants: 32,
    isJoined: false,
  },
  {
    id: 'm3',
    title: 'Mentor 5 Students',
    description: 'Guide 5 students with career advice, college applications, or skill development.',
    category: 'education',
    icon: GraduationCap,
    target: 5,
    current: 3,
    reward: 'Mentor Badge + 500 Gems',
    endDate: '2025-03-31',
    participants: 19,
    isJoined: true,
  },
  {
    id: 'm4',
    title: 'Help 3 Families Find Housing',
    description: 'Connect families with affordable housing, roommates, or temporary accommodation.',
    category: 'housing',
    icon: Home,
    target: 3,
    current: 1,
    reward: 'Housing Helper Badge',
    endDate: '2025-03-31',
    participants: 12,
    isJoined: false,
  },
  {
    id: 'm5',
    title: 'Host 5 Community Events',
    description: 'Organize gatherings, potlucks, cultural celebrations, or networking events.',
    category: 'community',
    icon: Users,
    target: 5,
    current: 4,
    reward: 'Event Organizer Badge',
    endDate: '2025-03-31',
    participants: 28,
    isJoined: true,
  },
];

// Recent contributions
const RECENT_CONTRIBUTIONS: Contribution[] = [
  {
    id: 'c1',
    missionId: 'm1',
    userId: 'u1',
    userName: 'Amara J.',
    userAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=face',
    action: 'Helped a newcomer find a doctor',
    timestamp: '2 hours ago',
    points: 10,
  },
  {
    id: 'c2',
    missionId: 'm2',
    userId: 'u2',
    userName: 'Kwame A.',
    userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face',
    action: 'Reviewed African Kitchen restaurant',
    timestamp: '5 hours ago',
    points: 5,
  },
  {
    id: 'c3',
    missionId: 'm5',
    userId: 'u3',
    userName: 'Fatima H.',
    userAvatar: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=200&h=200&fit=crop&crop=face',
    action: 'Hosted a Somali cooking class',
    timestamp: '1 day ago',
    points: 25,
  },
  {
    id: 'c4',
    missionId: 'm3',
    userId: 'u4',
    userName: 'Priya S.',
    userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=face',
    action: 'Mentored a student on tech career',
    timestamp: '2 days ago',
    points: 20,
  },
];

// Top contributors
const TOP_CONTRIBUTORS = [
  { id: '1', name: 'Amara J.', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=face', points: 245, rank: 1 },
  { id: '2', name: 'Kwame A.', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face', points: 198, rank: 2 },
  { id: '3', name: 'Fatima H.', avatar: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=200&h=200&fit=crop&crop=face', points: 176, rank: 3 },
];

const getCategoryColor = (category: MissionCategory): [string, string] => {
  switch (category) {
    case 'newcomers': return ['#EC4899', '#DB2777'];
    case 'business': return ['#F59E0B', '#D97706'];
    case 'education': return ['#3B82F6', '#2563EB'];
    case 'housing': return ['#10B981', '#059669'];
    case 'community': return ['#8B5CF6', '#7C3AED'];
    default: return ['#6B7280', '#4B5563'];
  }
};

export default function CommunityMissionsScreen() {
  const currentUser = useStore((s) => s.currentUser);
  const selectedLocation = useStore((s) => s.selectedLocation);
  const [missions, setMissions] = useState(CURRENT_MISSIONS);
  const [activeTab, setActiveTab] = useState<'missions' | 'activity' | 'leaderboard'>('missions');

  // Calculate days remaining in quarter
  const daysRemaining = useMemo(() => {
    const endDate = new Date('2025-03-31');
    const now = new Date();
    const diff = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
  }, []);

  // Calculate overall progress
  const overallProgress = useMemo(() => {
    const totalTarget = missions.reduce((sum, m) => sum + m.target, 0);
    const totalCurrent = missions.reduce((sum, m) => sum + m.current, 0);
    return Math.round((totalCurrent / totalTarget) * 100);
  }, [missions]);

  const handleJoinMission = (missionId: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setMissions((prev) =>
      prev.map((m) =>
        m.id === missionId
          ? { ...m, isJoined: true, participants: m.participants + 1 }
          : m
      )
    );
  };

  const handleContribute = (missionId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Navigate to contribution form
    router.push({
      pathname: '/log-contribution',
      params: { missionId },
    });
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
            <Text className="text-xl font-bold text-warmBrown">Community Missions</Text>
            <Text className="text-gray-500 text-sm">
              Q1 2025 • {selectedLocation?.city || 'Your City'}
            </Text>
          </View>
        </Animated.View>

        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          {/* Hero Card */}
          <Animated.View entering={FadeInUp.duration(400).delay(100)} className="px-5 pt-5">
            <LinearGradient
              colors={['#7C3AED', '#6D28D9', '#5B21B6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ borderRadius: 24, padding: 24 }}
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-1">
                  <View className="flex-row items-center">
                    <Target size={24} color="#FFFFFF" />
                    <Text className="text-white text-xl font-bold ml-2">
                      This Quarter's Goals
                    </Text>
                  </View>
                  <Text className="text-white/80 mt-2">
                    Together we're making our community stronger
                  </Text>
                </View>
                <View className="items-center">
                  <Text className="text-white text-4xl font-bold">{overallProgress}%</Text>
                  <Text className="text-white/70 text-sm">Complete</Text>
                </View>
              </View>

              {/* Progress Bar */}
              <View className="mt-4 h-3 bg-white/20 rounded-full overflow-hidden">
                <View
                  className="h-full bg-white rounded-full"
                  style={{ width: `${overallProgress}%` }}
                />
              </View>

              {/* Stats */}
              <View className="flex-row mt-4 justify-between">
                <View className="items-center">
                  <View className="flex-row items-center">
                    <Clock size={16} color="#FFFFFF" />
                    <Text className="text-white font-bold ml-1">{daysRemaining}</Text>
                  </View>
                  <Text className="text-white/70 text-xs">Days Left</Text>
                </View>
                <View className="items-center">
                  <View className="flex-row items-center">
                    <Users size={16} color="#FFFFFF" />
                    <Text className="text-white font-bold ml-1">138</Text>
                  </View>
                  <Text className="text-white/70 text-xs">Participants</Text>
                </View>
                <View className="items-center">
                  <View className="flex-row items-center">
                    <Flame size={16} color="#FCD34D" />
                    <Text className="text-white font-bold ml-1">32</Text>
                  </View>
                  <Text className="text-white/70 text-xs">Contributions</Text>
                </View>
              </View>
            </LinearGradient>
          </Animated.View>

          {/* Tabs */}
          <Animated.View entering={FadeInUp.duration(400).delay(200)} className="px-5 mt-6">
            <View className="flex-row bg-gray-100 rounded-xl p-1">
              {(['missions', 'activity', 'leaderboard'] as const).map((tab) => (
                <Pressable
                  key={tab}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setActiveTab(tab);
                  }}
                  className={`flex-1 py-2.5 rounded-lg ${
                    activeTab === tab ? 'bg-white' : ''
                  }`}
                >
                  <Text
                    className={`text-center font-semibold capitalize ${
                      activeTab === tab ? 'text-warmBrown' : 'text-gray-500'
                    }`}
                  >
                    {tab}
                  </Text>
                </Pressable>
              ))}
            </View>
          </Animated.View>

          {/* Missions Tab */}
          {activeTab === 'missions' && (
            <Animated.View entering={FadeInUp.duration(400).delay(300)} className="px-5 mt-4">
              {missions.map((mission, index) => {
                const progress = Math.round((mission.current / mission.target) * 100);
                const colors = getCategoryColor(mission.category);
                const Icon = mission.icon;

                return (
                  <Animated.View
                    key={mission.id}
                    entering={FadeInUp.duration(300).delay(index * 50)}
                    className="mb-4"
                  >
                    <Pressable
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }}
                      className="bg-white rounded-2xl p-4 shadow-sm"
                    >
                      {/* Header */}
                      <View className="flex-row items-start">
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
                          <Icon size={24} color="#FFFFFF" />
                        </LinearGradient>

                        <View className="flex-1 ml-3">
                          <Text className="text-warmBrown font-bold text-lg">
                            {mission.title}
                          </Text>
                          <Text className="text-gray-500 text-sm mt-1" numberOfLines={2}>
                            {mission.description}
                          </Text>
                        </View>

                        {mission.isJoined && (
                          <View className="bg-green-100 rounded-full px-2 py-1">
                            <Text className="text-green-700 text-xs font-semibold">Joined</Text>
                          </View>
                        )}
                      </View>

                      {/* Progress */}
                      <View className="mt-4">
                        <View className="flex-row justify-between mb-2">
                          <Text className="text-gray-600 text-sm">
                            {mission.current} / {mission.target} completed
                          </Text>
                          <Text className="text-gray-600 text-sm font-semibold">
                            {progress}%
                          </Text>
                        </View>
                        <View className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <LinearGradient
                            colors={colors}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={{
                              height: '100%',
                              width: `${progress}%`,
                              borderRadius: 999,
                            }}
                          />
                        </View>
                      </View>

                      {/* Footer */}
                      <View className="flex-row items-center justify-between mt-4 pt-3 border-t border-gray-100">
                        <View className="flex-row items-center">
                          <Users size={14} color="#9CA3AF" />
                          <Text className="text-gray-500 text-sm ml-1">
                            {mission.participants} participants
                          </Text>
                        </View>
                        <View className="flex-row items-center">
                          <Trophy size={14} color="#F59E0B" />
                          <Text className="text-amber-600 text-sm ml-1 font-medium">
                            {mission.reward}
                          </Text>
                        </View>
                      </View>

                      {/* Action Button */}
                      {mission.isJoined ? (
                        <Pressable
                          onPress={() => handleContribute(mission.id)}
                          className="mt-3 bg-purple-500 rounded-xl py-3 items-center"
                        >
                          <Text className="text-white font-semibold">
                            Log Contribution
                          </Text>
                        </Pressable>
                      ) : (
                        <Pressable
                          onPress={() => handleJoinMission(mission.id)}
                          className="mt-3 bg-gray-100 rounded-xl py-3 items-center"
                        >
                          <Text className="text-warmBrown font-semibold">
                            Join Mission
                          </Text>
                        </Pressable>
                      )}
                    </Pressable>
                  </Animated.View>
                );
              })}
            </Animated.View>
          )}

          {/* Activity Tab */}
          {activeTab === 'activity' && (
            <Animated.View entering={FadeInUp.duration(400).delay(300)} className="px-5 mt-4">
              <Text className="text-lg font-bold text-warmBrown mb-4">
                Recent Contributions
              </Text>

              {RECENT_CONTRIBUTIONS.map((contribution, index) => (
                <Animated.View
                  key={contribution.id}
                  entering={FadeInUp.duration(300).delay(index * 50)}
                  className="bg-white rounded-xl p-4 mb-3 shadow-sm flex-row items-center"
                >
                  <Image
                    source={{ uri: contribution.userAvatar }}
                    style={{ width: 44, height: 44, borderRadius: 22 }}
                    contentFit="cover"
                  />
                  <View className="flex-1 ml-3">
                    <Text className="text-warmBrown font-semibold">
                      {contribution.userName}
                    </Text>
                    <Text className="text-gray-600 text-sm">{contribution.action}</Text>
                    <Text className="text-gray-400 text-xs mt-1">
                      {contribution.timestamp}
                    </Text>
                  </View>
                  <View className="bg-purple-100 rounded-full px-3 py-1">
                    <Text className="text-purple-700 font-bold text-sm">
                      +{contribution.points}
                    </Text>
                  </View>
                </Animated.View>
              ))}
            </Animated.View>
          )}

          {/* Leaderboard Tab */}
          {activeTab === 'leaderboard' && (
            <Animated.View entering={FadeInUp.duration(400).delay(300)} className="px-5 mt-4">
              <Text className="text-lg font-bold text-warmBrown mb-4">
                Top Contributors
              </Text>

              {/* Top 3 Podium */}
              <View className="flex-row justify-center items-end mb-6">
                {/* 2nd Place */}
                <View className="items-center mx-2">
                  <Image
                    source={{ uri: TOP_CONTRIBUTORS[1].avatar }}
                    style={{ width: 56, height: 56, borderRadius: 28, borderWidth: 3, borderColor: '#C0C0C0' }}
                    contentFit="cover"
                  />
                  <View className="bg-gray-200 w-16 h-20 rounded-t-lg mt-2 items-center justify-center">
                    <Text className="text-2xl font-bold text-gray-600">2</Text>
                    <Text className="text-gray-500 text-xs">{TOP_CONTRIBUTORS[1].points} pts</Text>
                  </View>
                  <Text className="text-gray-700 font-medium text-sm mt-1">
                    {TOP_CONTRIBUTORS[1].name}
                  </Text>
                </View>

                {/* 1st Place */}
                <View className="items-center mx-2">
                  <View className="relative">
                    <Image
                      source={{ uri: TOP_CONTRIBUTORS[0].avatar }}
                      style={{ width: 72, height: 72, borderRadius: 36, borderWidth: 3, borderColor: '#FFD700' }}
                      contentFit="cover"
                    />
                    <View className="absolute -top-3 -right-1">
                      <Star size={24} color="#FFD700" fill="#FFD700" />
                    </View>
                  </View>
                  <LinearGradient
                    colors={['#FFD700', '#FFA500']}
                    style={{ width: 72, height: 28, borderTopLeftRadius: 8, borderTopRightRadius: 8, marginTop: 8, alignItems: 'center', justifyContent: 'center' }}
                  >
                    <Text className="text-2xl font-bold text-white">1</Text>
                  </LinearGradient>
                  <View className="bg-amber-100 w-[72px] items-center py-1">
                    <Text className="text-amber-700 text-xs font-bold">{TOP_CONTRIBUTORS[0].points} pts</Text>
                  </View>
                  <Text className="text-warmBrown font-bold text-sm mt-1">
                    {TOP_CONTRIBUTORS[0].name}
                  </Text>
                </View>

                {/* 3rd Place */}
                <View className="items-center mx-2">
                  <Image
                    source={{ uri: TOP_CONTRIBUTORS[2].avatar }}
                    style={{ width: 56, height: 56, borderRadius: 28, borderWidth: 3, borderColor: '#CD7F32' }}
                    contentFit="cover"
                  />
                  <View className="bg-orange-100 w-16 h-16 rounded-t-lg mt-2 items-center justify-center">
                    <Text className="text-2xl font-bold text-orange-600">3</Text>
                    <Text className="text-orange-500 text-xs">{TOP_CONTRIBUTORS[2].points} pts</Text>
                  </View>
                  <Text className="text-gray-700 font-medium text-sm mt-1">
                    {TOP_CONTRIBUTORS[2].name}
                  </Text>
                </View>
              </View>

              {/* Your Rank */}
              <View className="bg-purple-50 rounded-2xl p-4 border-2 border-purple-200">
                <View className="flex-row items-center">
                  <Text className="text-purple-600 font-bold text-2xl w-12">#12</Text>
                  <Image
                    source={{ uri: currentUser?.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face' }}
                    style={{ width: 48, height: 48, borderRadius: 24 }}
                    contentFit="cover"
                  />
                  <View className="flex-1 ml-3">
                    <Text className="text-warmBrown font-bold">You</Text>
                    <Text className="text-gray-500 text-sm">Keep contributing to climb!</Text>
                  </View>
                  <View className="items-end">
                    <Text className="text-purple-600 font-bold text-lg">85</Text>
                    <Text className="text-gray-500 text-xs">points</Text>
                  </View>
                </View>
              </View>
            </Animated.View>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
