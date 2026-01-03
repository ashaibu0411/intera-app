import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeInDown,
  FadeInRight,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import {
  Trophy,
  Star,
  Target,
  Flame,
  Users,
  Calendar,
  Gift,
  Crown,
  Medal,
  Award,
  Zap,
  Heart,
  MessageCircle,
  ShoppingBag,
  ChevronRight,
  Lock,
  Check,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

interface Challenge {
  id: string;
  title: string;
  description: string;
  type: 'daily' | 'weekly' | 'monthly' | 'special';
  category: 'social' | 'marketplace' | 'events' | 'heritage' | 'support';
  points: number;
  progress: number;
  target: number;
  icon: string;
  expiresAt: string;
  isCompleted: boolean;
}

interface LeaderboardEntry {
  userId: string;
  userName: string;
  userAvatar: string;
  points: number;
  rank: number;
  level: number;
  badges: number;
}

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  earnedAt?: string;
  isEarned: boolean;
  requirement: string;
}

const mockChallenges: Challenge[] = [
  {
    id: '1',
    title: 'Community Connector',
    description: 'Send messages to 5 different community members',
    type: 'daily',
    category: 'social',
    points: 50,
    progress: 3,
    target: 5,
    icon: 'message',
    expiresAt: '2025-01-10',
    isCompleted: false,
  },
  {
    id: '2',
    title: 'Event Enthusiast',
    description: 'RSVP to 3 community events this week',
    type: 'weekly',
    category: 'events',
    points: 150,
    progress: 2,
    target: 3,
    icon: 'calendar',
    expiresAt: '2025-01-15',
    isCompleted: false,
  },
  {
    id: '3',
    title: 'Marketplace Maven',
    description: 'List an item or service on the marketplace',
    type: 'daily',
    category: 'marketplace',
    points: 75,
    progress: 1,
    target: 1,
    icon: 'shop',
    expiresAt: '2025-01-10',
    isCompleted: true,
  },
  {
    id: '4',
    title: 'Heritage Keeper',
    description: 'Share a family recipe or cultural tradition',
    type: 'monthly',
    category: 'heritage',
    points: 300,
    progress: 0,
    target: 1,
    icon: 'book',
    expiresAt: '2025-01-31',
    isCompleted: false,
  },
  {
    id: '5',
    title: 'Support Star',
    description: 'Join and participate in a support circle',
    type: 'weekly',
    category: 'support',
    points: 200,
    progress: 1,
    target: 1,
    icon: 'heart',
    expiresAt: '2025-01-15',
    isCompleted: true,
  },
];

const mockLeaderboard: LeaderboardEntry[] = [
  { userId: '1', userName: 'Amara O.', userAvatar: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=100', points: 12500, rank: 1, level: 15, badges: 24 },
  { userId: '2', userName: 'Kofi M.', userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100', points: 11200, rank: 2, level: 14, badges: 21 },
  { userId: '3', userName: 'Zainab K.', userAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100', points: 9800, rank: 3, level: 12, badges: 18 },
  { userId: '4', userName: 'Kwame A.', userAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100', points: 8500, rank: 4, level: 11, badges: 15 },
  { userId: '5', userName: 'Nia W.', userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100', points: 7200, rank: 5, level: 10, badges: 12 },
];

const mockBadges: Badge[] = [
  { id: '1', name: 'First Steps', description: 'Complete your profile', icon: 'star', category: 'Getting Started', rarity: 'common', earnedAt: '2024-12-01', isEarned: true, requirement: 'Fill out all profile fields' },
  { id: '2', name: 'Social Butterfly', description: 'Connect with 10 community members', icon: 'users', category: 'Social', rarity: 'common', earnedAt: '2024-12-15', isEarned: true, requirement: 'Send connection requests to 10 people' },
  { id: '3', name: 'Event Organizer', description: 'Host your first community event', icon: 'calendar', category: 'Events', rarity: 'rare', earnedAt: '2024-12-20', isEarned: true, requirement: 'Create and host an event' },
  { id: '4', name: 'Trusted Elder', description: 'Reach trust score of 80+', icon: 'shield', category: 'Trust', rarity: 'epic', isEarned: false, requirement: 'Maintain active participation and positive reviews' },
  { id: '5', name: 'Heritage Guardian', description: 'Preserve 10 cultural traditions', icon: 'book', category: 'Heritage', rarity: 'legendary', isEarned: false, requirement: 'Share recipes, stories, or language lessons' },
  { id: '6', name: 'Susu Champion', description: 'Complete 3 savings circles', icon: 'coins', category: 'Finance', rarity: 'epic', isEarned: false, requirement: 'Successfully complete rotating savings' },
];

export default function GamificationScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'challenges' | 'leaderboard' | 'badges'>('challenges');

  const currentUserStats = {
    level: 8,
    points: 4250,
    pointsToNextLevel: 5000,
    streak: 12,
    totalBadges: 3,
    rank: 15,
  };

  const getChallengeIcon = (iconName: string) => {
    switch (iconName) {
      case 'message': return MessageCircle;
      case 'calendar': return Calendar;
      case 'shop': return ShoppingBag;
      case 'book': return Award;
      case 'heart': return Heart;
      default: return Target;
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return '#6B7280';
      case 'rare': return '#3B82F6';
      case 'epic': return '#8B5CF6';
      case 'legendary': return '#F59E0B';
      default: return '#6B7280';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'daily': return '#10B981';
      case 'weekly': return '#3B82F6';
      case 'monthly': return '#8B5CF6';
      case 'special': return '#F59E0B';
      default: return '#6B7280';
    }
  };

  const handleClaimReward = (challenge: Challenge) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  return (
    <View className="flex-1 bg-stone-100">
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />

      <LinearGradient
        colors={['#C2410C', '#EA580C', '#F97316']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ paddingTop: 60, paddingBottom: 24, paddingHorizontal: 20 }}
      >
        <Pressable onPress={() => router.back()} className="mb-4">
          <Text className="text-white/80 text-base">← Back</Text>
        </Pressable>

        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-white/80 text-base mb-1">Community Achievements</Text>
            <Text className="text-white text-3xl font-bold">Level {currentUserStats.level}</Text>
          </View>
          <View className="bg-white/20 rounded-2xl px-4 py-2">
            <View className="flex-row items-center">
              <Flame size={20} color="#FCD34D" />
              <Text className="text-white font-bold text-lg ml-1">{currentUserStats.streak}</Text>
            </View>
            <Text className="text-white/80 text-xs text-center">Day Streak</Text>
          </View>
        </View>

        {/* Progress to Next Level */}
        <View className="mt-4">
          <View className="flex-row justify-between mb-2">
            <Text className="text-white/80 text-sm">{currentUserStats.points.toLocaleString()} XP</Text>
            <Text className="text-white/80 text-sm">{currentUserStats.pointsToNextLevel.toLocaleString()} XP</Text>
          </View>
          <View className="h-3 bg-white/20 rounded-full overflow-hidden">
            <View
              className="h-full bg-yellow-400 rounded-full"
              style={{ width: `${(currentUserStats.points / currentUserStats.pointsToNextLevel) * 100}%` }}
            />
          </View>
          <Text className="text-white/80 text-xs mt-1 text-center">
            {currentUserStats.pointsToNextLevel - currentUserStats.points} XP to Level {currentUserStats.level + 1}
          </Text>
        </View>

        {/* Quick Stats */}
        <View className="flex-row justify-around mt-4 bg-white/10 rounded-xl py-3">
          <View className="items-center">
            <Trophy size={20} color="#FCD34D" />
            <Text className="text-white font-bold text-lg">#{currentUserStats.rank}</Text>
            <Text className="text-white/70 text-xs">Rank</Text>
          </View>
          <View className="items-center">
            <Medal size={20} color="#FCD34D" />
            <Text className="text-white font-bold text-lg">{currentUserStats.totalBadges}</Text>
            <Text className="text-white/70 text-xs">Badges</Text>
          </View>
          <View className="items-center">
            <Zap size={20} color="#FCD34D" />
            <Text className="text-white font-bold text-lg">{currentUserStats.points.toLocaleString()}</Text>
            <Text className="text-white/70 text-xs">Total XP</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Tabs */}
      <View className="flex-row bg-white border-b border-stone-200">
        {(['challenges', 'leaderboard', 'badges'] as const).map((tab) => (
          <Pressable
            key={tab}
            onPress={() => setActiveTab(tab)}
            className={`flex-1 py-4 ${activeTab === tab ? 'border-b-2 border-orange-600' : ''}`}
          >
            <Text
              className={`text-center font-semibold capitalize ${
                activeTab === tab ? 'text-orange-600' : 'text-stone-500'
              }`}
            >
              {tab}
            </Text>
          </Pressable>
        ))}
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {activeTab === 'challenges' && (
          <View className="p-4">
            <Text className="text-stone-800 font-bold text-lg mb-3">Active Challenges</Text>

            {mockChallenges.map((challenge, index) => {
              const IconComponent = getChallengeIcon(challenge.icon);
              const progress = (challenge.progress / challenge.target) * 100;

              return (
                <Animated.View
                  key={challenge.id}
                  entering={FadeInDown.delay(index * 100)}
                >
                  <Pressable
                    className={`bg-white rounded-2xl p-4 mb-3 border ${
                      challenge.isCompleted ? 'border-emerald-200 bg-emerald-50' : 'border-stone-200'
                    }`}
                    onPress={() => challenge.isCompleted && handleClaimReward(challenge)}
                  >
                    <View className="flex-row items-start">
                      <View
                        className="w-12 h-12 rounded-xl items-center justify-center mr-3"
                        style={{ backgroundColor: `${getTypeColor(challenge.type)}20` }}
                      >
                        <IconComponent size={24} color={getTypeColor(challenge.type)} />
                      </View>

                      <View className="flex-1">
                        <View className="flex-row items-center justify-between">
                          <Text className="text-stone-800 font-bold text-base">{challenge.title}</Text>
                          <View
                            className="px-2 py-1 rounded-full"
                            style={{ backgroundColor: `${getTypeColor(challenge.type)}20` }}
                          >
                            <Text
                              className="text-xs font-semibold capitalize"
                              style={{ color: getTypeColor(challenge.type) }}
                            >
                              {challenge.type}
                            </Text>
                          </View>
                        </View>

                        <Text className="text-stone-600 text-sm mt-1">{challenge.description}</Text>

                        <View className="mt-3">
                          <View className="flex-row justify-between mb-1">
                            <Text className="text-stone-500 text-xs">
                              {challenge.progress}/{challenge.target}
                            </Text>
                            <Text className="text-orange-600 font-bold text-xs">+{challenge.points} XP</Text>
                          </View>
                          <View className="h-2 bg-stone-200 rounded-full overflow-hidden">
                            <View
                              className="h-full rounded-full"
                              style={{
                                width: `${progress}%`,
                                backgroundColor: challenge.isCompleted ? '#10B981' : '#EA580C',
                              }}
                            />
                          </View>
                        </View>

                        {challenge.isCompleted && (
                          <Pressable
                            className="mt-3 bg-emerald-500 py-2 rounded-lg flex-row items-center justify-center"
                            onPress={() => handleClaimReward(challenge)}
                          >
                            <Gift size={16} color="white" />
                            <Text className="text-white font-bold ml-2">Claim Reward</Text>
                          </Pressable>
                        )}
                      </View>
                    </View>
                  </Pressable>
                </Animated.View>
              );
            })}
          </View>
        )}

        {activeTab === 'leaderboard' && (
          <View className="p-4">
            <Text className="text-stone-800 font-bold text-lg mb-3">Community Leaders</Text>

            {/* Top 3 Podium */}
            <View className="flex-row justify-center items-end mb-6 h-48">
              {/* 2nd Place */}
              <View className="items-center mx-2">
                <Image
                  source={{ uri: mockLeaderboard[1].userAvatar }}
                  className="w-16 h-16 rounded-full border-4 border-stone-400"
                />
                <View className="bg-stone-400 w-8 h-8 rounded-full items-center justify-center -mt-3">
                  <Text className="text-white font-bold">2</Text>
                </View>
                <Text className="text-stone-800 font-semibold text-sm mt-1">{mockLeaderboard[1].userName}</Text>
                <Text className="text-stone-500 text-xs">{mockLeaderboard[1].points.toLocaleString()} XP</Text>
                <View className="bg-stone-300 w-20 h-24 rounded-t-lg mt-2" />
              </View>

              {/* 1st Place */}
              <View className="items-center mx-2">
                <Crown size={24} color="#F59E0B" />
                <Image
                  source={{ uri: mockLeaderboard[0].userAvatar }}
                  className="w-20 h-20 rounded-full border-4 border-yellow-500"
                />
                <View className="bg-yellow-500 w-8 h-8 rounded-full items-center justify-center -mt-3">
                  <Text className="text-white font-bold">1</Text>
                </View>
                <Text className="text-stone-800 font-bold mt-1">{mockLeaderboard[0].userName}</Text>
                <Text className="text-stone-500 text-xs">{mockLeaderboard[0].points.toLocaleString()} XP</Text>
                <View className="bg-yellow-400 w-20 h-32 rounded-t-lg mt-2" />
              </View>

              {/* 3rd Place */}
              <View className="items-center mx-2">
                <Image
                  source={{ uri: mockLeaderboard[2].userAvatar }}
                  className="w-16 h-16 rounded-full border-4 border-amber-600"
                />
                <View className="bg-amber-600 w-8 h-8 rounded-full items-center justify-center -mt-3">
                  <Text className="text-white font-bold">3</Text>
                </View>
                <Text className="text-stone-800 font-semibold text-sm mt-1">{mockLeaderboard[2].userName}</Text>
                <Text className="text-stone-500 text-xs">{mockLeaderboard[2].points.toLocaleString()} XP</Text>
                <View className="bg-amber-500 w-20 h-16 rounded-t-lg mt-2" />
              </View>
            </View>

            {/* Rest of Leaderboard */}
            {mockLeaderboard.slice(3).map((entry, index) => (
              <Animated.View
                key={entry.userId}
                entering={FadeInRight.delay(index * 100)}
                className="bg-white rounded-xl p-4 mb-2 flex-row items-center"
              >
                <Text className="text-stone-400 font-bold text-lg w-8">{entry.rank}</Text>
                <Image
                  source={{ uri: entry.userAvatar }}
                  className="w-12 h-12 rounded-full"
                />
                <View className="flex-1 ml-3">
                  <Text className="text-stone-800 font-semibold">{entry.userName}</Text>
                  <Text className="text-stone-500 text-sm">Level {entry.level} • {entry.badges} badges</Text>
                </View>
                <Text className="text-orange-600 font-bold">{entry.points.toLocaleString()}</Text>
              </Animated.View>
            ))}

            {/* Your Position */}
            <View className="bg-orange-100 rounded-xl p-4 mt-4 flex-row items-center border-2 border-orange-300">
              <Text className="text-orange-600 font-bold text-lg w-8">#{currentUserStats.rank}</Text>
              <View className="w-12 h-12 rounded-full bg-orange-200 items-center justify-center">
                <Text className="text-orange-600 font-bold">You</Text>
              </View>
              <View className="flex-1 ml-3">
                <Text className="text-stone-800 font-semibold">Your Position</Text>
                <Text className="text-stone-500 text-sm">Level {currentUserStats.level} • {currentUserStats.totalBadges} badges</Text>
              </View>
              <Text className="text-orange-600 font-bold">{currentUserStats.points.toLocaleString()}</Text>
            </View>
          </View>
        )}

        {activeTab === 'badges' && (
          <View className="p-4">
            <Text className="text-stone-800 font-bold text-lg mb-3">Badge Collection</Text>

            <View className="flex-row flex-wrap justify-between">
              {mockBadges.map((badge, index) => (
                <Animated.View
                  key={badge.id}
                  entering={FadeInDown.delay(index * 80)}
                  className="w-[48%] mb-3"
                >
                  <Pressable
                    className={`bg-white rounded-2xl p-4 items-center ${
                      !badge.isEarned ? 'opacity-60' : ''
                    }`}
                    style={{
                      borderWidth: 2,
                      borderColor: badge.isEarned ? getRarityColor(badge.rarity) : '#E5E5E5',
                    }}
                  >
                    <View
                      className="w-16 h-16 rounded-full items-center justify-center mb-2"
                      style={{
                        backgroundColor: badge.isEarned
                          ? `${getRarityColor(badge.rarity)}20`
                          : '#F5F5F5',
                      }}
                    >
                      {badge.isEarned ? (
                        <Award size={32} color={getRarityColor(badge.rarity)} />
                      ) : (
                        <Lock size={24} color="#9CA3AF" />
                      )}
                    </View>

                    <Text
                      className="font-bold text-center"
                      style={{ color: badge.isEarned ? getRarityColor(badge.rarity) : '#6B7280' }}
                    >
                      {badge.name}
                    </Text>

                    <Text className="text-stone-500 text-xs text-center mt-1">{badge.description}</Text>

                    <View
                      className="px-2 py-1 rounded-full mt-2"
                      style={{ backgroundColor: `${getRarityColor(badge.rarity)}20` }}
                    >
                      <Text
                        className="text-xs font-semibold capitalize"
                        style={{ color: getRarityColor(badge.rarity) }}
                      >
                        {badge.rarity}
                      </Text>
                    </View>

                    {badge.isEarned && badge.earnedAt && (
                      <View className="flex-row items-center mt-2">
                        <Check size={12} color="#10B981" />
                        <Text className="text-emerald-600 text-xs ml-1">
                          Earned {new Date(badge.earnedAt).toLocaleDateString()}
                        </Text>
                      </View>
                    )}
                  </Pressable>
                </Animated.View>
              ))}
            </View>
          </View>
        )}

        <View className="h-8" />
      </ScrollView>
    </View>
  );
}
