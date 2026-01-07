import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { ArrowLeft, Trophy, Flame, Users, Target, Medal, ChevronRight, X, Check, Star, Zap } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown, useAnimatedStyle, withRepeat, withSequence, withTiming, withSpring } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

interface Challenge {
  id: string;
  title: string;
  description: string;
  type: 'steps' | 'workout' | 'water' | 'meditation' | 'sleep';
  target: number;
  current: number;
  unit: string;
  duration: 'daily' | 'weekly' | 'monthly';
  participants: number;
  reward: number;
  startDate: string;
  endDate: string;
  isJoined: boolean;
  leaderboard: { name: string; avatar: string; score: number }[];
}

interface UserStats {
  totalSteps: number;
  workoutsCompleted: number;
  currentStreak: number;
  challengesWon: number;
  totalXP: number;
  rank: number;
}

const MOCK_CHALLENGES: Challenge[] = [
  {
    id: '1',
    title: '10K Steps Challenge',
    description: 'Walk 10,000 steps every day for a week',
    type: 'steps',
    target: 70000,
    current: 45000,
    unit: 'steps',
    duration: 'weekly',
    participants: 234,
    reward: 500,
    startDate: 'Jan 8',
    endDate: 'Jan 14',
    isJoined: true,
    leaderboard: [
      { name: 'Marcus W.', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200', score: 68500 },
      { name: 'Amara J.', avatar: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=200', score: 62000 },
      { name: 'You', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200', score: 45000 },
    ],
  },
  {
    id: '2',
    title: 'Morning Workout Warriors',
    description: 'Complete a 30-min workout before 8 AM',
    type: 'workout',
    target: 7,
    current: 3,
    unit: 'workouts',
    duration: 'weekly',
    participants: 156,
    reward: 300,
    startDate: 'Jan 8',
    endDate: 'Jan 14',
    isJoined: true,
    leaderboard: [
      { name: 'Keisha T.', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200', score: 7 },
      { name: 'David O.', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200', score: 5 },
      { name: 'You', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200', score: 3 },
    ],
  },
  {
    id: '3',
    title: 'Hydration Nation',
    description: 'Drink 8 glasses of water daily',
    type: 'water',
    target: 56,
    current: 0,
    unit: 'glasses',
    duration: 'weekly',
    participants: 89,
    reward: 200,
    startDate: 'Jan 15',
    endDate: 'Jan 21',
    isJoined: false,
    leaderboard: [],
  },
  {
    id: '4',
    title: 'January Fitness Push',
    description: 'Complete 20 workouts this month',
    type: 'workout',
    target: 20,
    current: 8,
    unit: 'workouts',
    duration: 'monthly',
    participants: 567,
    reward: 1000,
    startDate: 'Jan 1',
    endDate: 'Jan 31',
    isJoined: true,
    leaderboard: [
      { name: 'James C.', avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200', score: 15 },
      { name: 'Fatima H.', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200', score: 12 },
      { name: 'You', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200', score: 8 },
    ],
  },
  {
    id: '5',
    title: 'Mindfulness Minutes',
    description: 'Meditate for 10 minutes daily',
    type: 'meditation',
    target: 70,
    current: 0,
    unit: 'minutes',
    duration: 'weekly',
    participants: 123,
    reward: 250,
    startDate: 'Jan 15',
    endDate: 'Jan 21',
    isJoined: false,
    leaderboard: [],
  },
];

const USER_STATS: UserStats = {
  totalSteps: 125000,
  workoutsCompleted: 23,
  currentStreak: 7,
  challengesWon: 5,
  totalXP: 2450,
  rank: 12,
};

const CHALLENGE_TYPES = [
  { key: 'all', label: 'All' },
  { key: 'steps', label: 'Steps' },
  { key: 'workout', label: 'Workout' },
  { key: 'water', label: 'Hydration' },
  { key: 'meditation', label: 'Mindfulness' },
];

const TYPE_COLORS = {
  steps: '#10B981',
  workout: '#F59E0B',
  water: '#3B82F6',
  meditation: '#8B5CF6',
  sleep: '#6366F1',
};

const TYPE_ICONS = {
  steps: '👟',
  workout: '💪',
  water: '💧',
  meditation: '🧘',
  sleep: '😴',
};

export default function FitnessChallengesScreen() {
  const router = useRouter();
  const [selectedType, setSelectedType] = useState('all');
  const [challenges, setChallenges] = useState(MOCK_CHALLENGES);
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const filteredChallenges = challenges.filter(c =>
    selectedType === 'all' || c.type === selectedType
  );

  const joinedChallenges = challenges.filter(c => c.isJoined);
  const availableChallenges = filteredChallenges.filter(c => !c.isJoined);

  const toggleJoin = (challengeId: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setChallenges(prev => prev.map(c => {
      if (c.id === challengeId) {
        return { ...c, isJoined: !c.isJoined, participants: c.isJoined ? c.participants - 1 : c.participants + 1 };
      }
      return c;
    }));
  };

  const openDetail = (challenge: Challenge) => {
    setSelectedChallenge(challenge);
    setShowDetailModal(true);
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
              <Trophy size={20} color="#F59E0B" />
              <Text className="text-white text-lg font-bold ml-2">Fitness Challenges</Text>
            </View>
            <View className="w-10" />
          </View>

          {/* User Stats Card */}
          <LinearGradient
            colors={['#F59E0B', '#D97706']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ borderRadius: 20, padding: 16, marginBottom: 16 }}
          >
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center">
                <View className="w-12 h-12 rounded-full bg-white/20 items-center justify-center">
                  <Text className="text-2xl">🏆</Text>
                </View>
                <View className="ml-3">
                  <Text className="text-white/80 text-sm">Your Rank</Text>
                  <Text className="text-white text-2xl font-bold">#{USER_STATS.rank}</Text>
                </View>
              </View>
              <View className="items-end">
                <Text className="text-white/80 text-sm">Total XP</Text>
                <Text className="text-white text-2xl font-bold">{USER_STATS.totalXP.toLocaleString()}</Text>
              </View>
            </View>

            <View className="flex-row justify-around pt-3 border-t border-white/20">
              <View className="items-center">
                <View className="flex-row items-center">
                  <Flame size={16} color="#fff" />
                  <Text className="text-white font-bold ml-1">{USER_STATS.currentStreak}</Text>
                </View>
                <Text className="text-white/70 text-xs">Day Streak</Text>
              </View>
              <View className="items-center">
                <View className="flex-row items-center">
                  <Target size={16} color="#fff" />
                  <Text className="text-white font-bold ml-1">{USER_STATS.workoutsCompleted}</Text>
                </View>
                <Text className="text-white/70 text-xs">Workouts</Text>
              </View>
              <View className="items-center">
                <View className="flex-row items-center">
                  <Medal size={16} color="#fff" />
                  <Text className="text-white font-bold ml-1">{USER_STATS.challengesWon}</Text>
                </View>
                <Text className="text-white/70 text-xs">Won</Text>
              </View>
            </View>
          </LinearGradient>

          {/* Type Filter */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }}>
            <View className="flex-row gap-2">
              {CHALLENGE_TYPES.map((type) => (
                <Pressable
                  key={type.key}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSelectedType(type.key);
                  }}
                  className={`px-4 py-2.5 rounded-full ${
                    selectedType === type.key
                      ? 'bg-amber-500'
                      : 'bg-white/10'
                  }`}
                >
                  <Text className={`font-medium ${
                    selectedType === type.key ? 'text-black' : 'text-gray-300'
                  }`}>
                    {type.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        </View>

        <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
          {/* Active Challenges */}
          {joinedChallenges.length > 0 && (
            <View className="mb-6">
              <Text className="text-white font-bold text-lg mb-3">Your Active Challenges</Text>
              {joinedChallenges.map((challenge, index) => (
                <Animated.View
                  key={challenge.id}
                  entering={FadeInDown.delay(index * 60).springify()}
                >
                  <Pressable
                    onPress={() => openDetail(challenge)}
                    className="bg-white/5 rounded-2xl p-4 mb-3 border border-white/10"
                  >
                    <View className="flex-row items-center justify-between mb-3">
                      <View className="flex-row items-center">
                        <View
                          className="w-10 h-10 rounded-xl items-center justify-center"
                          style={{ backgroundColor: TYPE_COLORS[challenge.type] + '30' }}
                        >
                          <Text className="text-xl">{TYPE_ICONS[challenge.type]}</Text>
                        </View>
                        <View className="ml-3">
                          <Text className="text-white font-bold">{challenge.title}</Text>
                          <Text className="text-gray-400 text-sm">{challenge.duration} • {challenge.endDate}</Text>
                        </View>
                      </View>
                      <View className="items-end">
                        <View className="flex-row items-center bg-amber-500/20 px-2 py-1 rounded-full">
                          <Zap size={12} color="#F59E0B" />
                          <Text className="text-amber-400 text-xs font-bold ml-1">{challenge.reward} XP</Text>
                        </View>
                      </View>
                    </View>

                    {/* Progress Bar */}
                    <View className="mb-2">
                      <View className="flex-row items-center justify-between mb-1">
                        <Text className="text-gray-400 text-sm">{challenge.current.toLocaleString()} / {challenge.target.toLocaleString()} {challenge.unit}</Text>
                        <Text className="text-white font-bold">{Math.round((challenge.current / challenge.target) * 100)}%</Text>
                      </View>
                      <View className="h-3 bg-white/10 rounded-full overflow-hidden">
                        <View
                          className="h-full rounded-full"
                          style={{
                            width: `${Math.min(100, (challenge.current / challenge.target) * 100)}%`,
                            backgroundColor: TYPE_COLORS[challenge.type],
                          }}
                        />
                      </View>
                    </View>

                    {/* Mini Leaderboard */}
                    <View className="flex-row items-center justify-between pt-3 border-t border-white/10">
                      <View className="flex-row items-center">
                        <Users size={14} color="#9CA3AF" />
                        <Text className="text-gray-400 text-sm ml-1">{challenge.participants} participants</Text>
                      </View>
                      <View className="flex-row items-center">
                        {challenge.leaderboard.slice(0, 3).map((user, idx) => (
                          <Image
                            key={idx}
                            source={{ uri: user.avatar }}
                            style={{
                              width: 24,
                              height: 24,
                              borderRadius: 12,
                              marginLeft: idx > 0 ? -8 : 0,
                              borderWidth: 2,
                              borderColor: '#0F172A',
                            }}
                            contentFit="cover"
                          />
                        ))}
                        <ChevronRight size={16} color="#9CA3AF" />
                      </View>
                    </View>
                  </Pressable>
                </Animated.View>
              ))}
            </View>
          )}

          {/* Available Challenges */}
          {availableChallenges.length > 0 && (
            <View className="mb-6">
              <Text className="text-white font-bold text-lg mb-3">Join New Challenges</Text>
              {availableChallenges.map((challenge, index) => (
                <Animated.View
                  key={challenge.id}
                  entering={FadeInDown.delay(index * 60).springify()}
                >
                  <Pressable
                    onPress={() => openDetail(challenge)}
                    className="bg-white/5 rounded-2xl p-4 mb-3 border border-white/10"
                  >
                    <View className="flex-row items-center justify-between mb-2">
                      <View className="flex-row items-center">
                        <View
                          className="w-10 h-10 rounded-xl items-center justify-center"
                          style={{ backgroundColor: TYPE_COLORS[challenge.type] + '30' }}
                        >
                          <Text className="text-xl">{TYPE_ICONS[challenge.type]}</Text>
                        </View>
                        <View className="ml-3">
                          <Text className="text-white font-bold">{challenge.title}</Text>
                          <Text className="text-gray-400 text-sm">{challenge.description}</Text>
                        </View>
                      </View>
                    </View>

                    <View className="flex-row items-center justify-between pt-3 border-t border-white/10">
                      <View className="flex-row items-center gap-3">
                        <View className="flex-row items-center">
                          <Users size={14} color="#9CA3AF" />
                          <Text className="text-gray-400 text-sm ml-1">{challenge.participants}</Text>
                        </View>
                        <View className="flex-row items-center bg-amber-500/20 px-2 py-1 rounded-full">
                          <Zap size={12} color="#F59E0B" />
                          <Text className="text-amber-400 text-xs font-bold ml-1">{challenge.reward} XP</Text>
                        </View>
                      </View>
                      <Pressable
                        onPress={() => toggleJoin(challenge.id)}
                        className="bg-amber-500 px-4 py-2 rounded-full"
                      >
                        <Text className="text-black font-bold">Join</Text>
                      </Pressable>
                    </View>
                  </Pressable>
                </Animated.View>
              ))}
            </View>
          )}

          <View className="h-32" />
        </ScrollView>

        {/* Challenge Detail Modal */}
        <Modal visible={showDetailModal} animationType="slide" transparent>
          <View className="flex-1 bg-black/80 justify-end">
            <View className="bg-[#1E293B] rounded-t-3xl p-6 max-h-[80%]">
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-white text-xl font-bold">Challenge Details</Text>
                <Pressable
                  onPress={() => setShowDetailModal(false)}
                  className="w-8 h-8 rounded-full bg-white/10 items-center justify-center"
                >
                  <X size={18} color="#fff" />
                </Pressable>
              </View>

              {selectedChallenge && (
                <ScrollView>
                  {/* Challenge Info */}
                  <View className="flex-row items-center mb-4">
                    <View
                      className="w-14 h-14 rounded-2xl items-center justify-center"
                      style={{ backgroundColor: TYPE_COLORS[selectedChallenge.type] + '30' }}
                    >
                      <Text className="text-3xl">{TYPE_ICONS[selectedChallenge.type]}</Text>
                    </View>
                    <View className="ml-3 flex-1">
                      <Text className="text-white font-bold text-lg">{selectedChallenge.title}</Text>
                      <Text className="text-gray-400">{selectedChallenge.description}</Text>
                    </View>
                  </View>

                  {/* Stats */}
                  <View className="flex-row gap-3 mb-4">
                    <View className="flex-1 bg-white/5 rounded-xl p-3 items-center">
                      <Target size={20} color={TYPE_COLORS[selectedChallenge.type]} />
                      <Text className="text-white font-bold mt-1">{selectedChallenge.target.toLocaleString()}</Text>
                      <Text className="text-gray-400 text-xs">{selectedChallenge.unit}</Text>
                    </View>
                    <View className="flex-1 bg-white/5 rounded-xl p-3 items-center">
                      <Users size={20} color="#3B82F6" />
                      <Text className="text-white font-bold mt-1">{selectedChallenge.participants}</Text>
                      <Text className="text-gray-400 text-xs">Participants</Text>
                    </View>
                    <View className="flex-1 bg-white/5 rounded-xl p-3 items-center">
                      <Zap size={20} color="#F59E0B" />
                      <Text className="text-white font-bold mt-1">{selectedChallenge.reward}</Text>
                      <Text className="text-gray-400 text-xs">XP Reward</Text>
                    </View>
                  </View>

                  {/* Leaderboard */}
                  {selectedChallenge.leaderboard.length > 0 && (
                    <View className="mb-4">
                      <Text className="text-white font-bold mb-3">Leaderboard</Text>
                      {selectedChallenge.leaderboard.map((user, idx) => (
                        <View key={idx} className="flex-row items-center justify-between py-3 border-b border-white/10">
                          <View className="flex-row items-center">
                            <View className={`w-6 h-6 rounded-full items-center justify-center ${
                              idx === 0 ? 'bg-amber-500' : idx === 1 ? 'bg-gray-400' : idx === 2 ? 'bg-amber-700' : 'bg-gray-600'
                            }`}>
                              <Text className="text-white text-xs font-bold">{idx + 1}</Text>
                            </View>
                            <Image
                              source={{ uri: user.avatar }}
                              style={{ width: 36, height: 36, borderRadius: 18, marginLeft: 12 }}
                              contentFit="cover"
                            />
                            <Text className={`ml-3 font-medium ${user.name === 'You' ? 'text-amber-400' : 'text-white'}`}>
                              {user.name}
                            </Text>
                          </View>
                          <Text className="text-white font-bold">{user.score.toLocaleString()}</Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* Action Button */}
                  <Pressable
                    onPress={() => {
                      toggleJoin(selectedChallenge.id);
                      setShowDetailModal(false);
                    }}
                    className={`rounded-xl py-4 items-center ${
                      selectedChallenge.isJoined ? 'bg-red-500' : 'bg-amber-500'
                    }`}
                  >
                    <Text className={`font-bold text-lg ${selectedChallenge.isJoined ? 'text-white' : 'text-black'}`}>
                      {selectedChallenge.isJoined ? 'Leave Challenge' : 'Join Challenge'}
                    </Text>
                  </Pressable>

                  <View className="h-8" />
                </ScrollView>
              )}
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </View>
  );
}
