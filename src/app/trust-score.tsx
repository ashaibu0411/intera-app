import { View, Text, ScrollView, Pressable, Image } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Shield, Star, Award, CheckCircle, Users, Heart, TrendingUp, ChevronRight, BadgeCheck } from 'lucide-react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useStore } from '@/lib/store';
import { useAdvancedFeatures, calculateTrustScore, getVerificationLevel, type TrustBadge } from '@/lib/advancedFeatures';
import * as Haptics from 'expo-haptics';

const BADGE_ICONS: { [key: string]: React.ComponentType<{ size: number; color: string }> } = {
  trusted_neighbor: Shield,
  community_leader: Star,
  verified_business: BadgeCheck,
  top_seller: Award,
  event_organizer: Users,
  mentor: Heart,
  helper: CheckCircle,
  founding_member: Star,
  susu_reliable: TrendingUp,
  voice_host: Users,
};

const BADGE_COLORS: { [key: string]: string } = {
  bronze: '#CD7F32',
  silver: '#C0C0C0',
  gold: '#FFD700',
  platinum: '#E5E4E2',
};

export default function TrustScoreScreen() {
  const router = useRouter();
  const currentUser = useStore((s) => s.currentUser);
  const trustScores = useAdvancedFeatures((s) => s.trustScores);
  const vouches = useAdvancedFeatures((s) => s.vouches);

  const userId = currentUser?.id ?? 'guest';
  const trustScore = trustScores[userId] ?? {
    userId,
    overallScore: 45,
    verificationLevel: 'basic',
    badges: [
      { id: '1', type: 'founding_member', name: 'Founding Member', description: 'Joined during beta', earnedAt: '2024-01-15', icon: 'Star' },
    ],
    stats: {
      transactionsCompleted: 3,
      eventsHosted: 1,
      reviewsReceived: 5,
      communityContributions: 8,
      vouchesReceived: 2,
      vouchesGiven: 4,
      reportsFiled: 0,
      reportsAgainst: 0,
    },
    joinedDate: '2024-01-15',
    lastActive: new Date().toISOString(),
  };

  const userVouches = vouches.filter((v) => v.toUserId === userId);

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#1B4D3E';
    if (score >= 60) return '#C9A227';
    if (score >= 40) return '#D4673A';
    return '#DC2626';
  };

  const getLevelInfo = (level: string) => {
    const levels = {
      unverified: { name: 'Unverified', color: '#9CA3AF', icon: Shield },
      basic: { name: 'Basic Member', color: '#6B7280', icon: Shield },
      verified: { name: 'Verified', color: '#3B82F6', icon: CheckCircle },
      trusted: { name: 'Trusted', color: '#C9A227', icon: Award },
      community_leader: { name: 'Community Leader', color: '#1B4D3E', icon: Star },
    };
    return levels[level as keyof typeof levels] ?? levels.unverified;
  };

  const levelInfo = getLevelInfo(trustScore.verificationLevel);
  const LevelIcon = levelInfo.icon;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FAF7F2' }} edges={['top']}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Ubuntu Trust Score',
          headerStyle: { backgroundColor: '#FAF7F2' },
          headerTintColor: '#1B4D3E',
        }}
      />

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Score Hero */}
        <Animated.View entering={FadeInDown.delay(100)} className="mx-4 mt-4 rounded-3xl overflow-hidden">
          <View style={{ backgroundColor: '#1B4D3E' }} className="p-6">
            <View className="items-center">
              <View className="w-32 h-32 rounded-full bg-white/10 items-center justify-center mb-4">
                <Text className="text-5xl font-bold text-white">{trustScore.overallScore}</Text>
              </View>
              <View className="flex-row items-center bg-white/20 px-4 py-2 rounded-full">
                <LevelIcon size={18} color="white" />
                <Text className="text-white font-semibold ml-2">{levelInfo.name}</Text>
              </View>
              <Text className="text-white/70 text-sm mt-3 text-center">
                Your Ubuntu Score reflects your trustworthiness in the community
              </Text>
            </View>
          </View>

          {/* Progress to next level */}
          <View className="bg-white p-4">
            <View className="flex-row justify-between mb-2">
              <Text className="text-gray-600 text-sm">Progress to next level</Text>
              <Text className="text-gray-900 font-medium text-sm">
                {trustScore.overallScore}/100
              </Text>
            </View>
            <View className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <View
                className="h-full rounded-full"
                style={{
                  width: `${trustScore.overallScore}%`,
                  backgroundColor: getScoreColor(trustScore.overallScore),
                }}
              />
            </View>
          </View>
        </Animated.View>

        {/* How to improve */}
        <Animated.View entering={FadeInDown.delay(200)} className="mx-4 mt-6">
          <Text className="text-lg font-bold text-gray-900 mb-3">Improve Your Score</Text>
          <View className="bg-white rounded-2xl overflow-hidden">
            {[
              { action: 'Complete a transaction', points: '+5', done: trustScore.stats.transactionsCompleted > 0 },
              { action: 'Host an event', points: '+10', done: trustScore.stats.eventsHosted > 0 },
              { action: 'Get vouched by a member', points: '+15', done: trustScore.stats.vouchesReceived > 0 },
              { action: 'Contribute to community', points: '+8', done: trustScore.stats.communityContributions > 0 },
              { action: 'Verify your identity', points: '+20', done: trustScore.verificationLevel !== 'unverified' },
            ].map((item, index) => (
              <View
                key={index}
                className={`flex-row items-center justify-between p-4 ${index < 4 ? 'border-b border-gray-100' : ''}`}
              >
                <View className="flex-row items-center flex-1">
                  <View
                    className={`w-6 h-6 rounded-full items-center justify-center mr-3 ${item.done ? 'bg-green-100' : 'bg-gray-100'}`}
                  >
                    <CheckCircle size={14} color={item.done ? '#16A34A' : '#9CA3AF'} />
                  </View>
                  <Text className={`flex-1 ${item.done ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                    {item.action}
                  </Text>
                </View>
                <Text className={`font-semibold ${item.done ? 'text-gray-400' : 'text-green-600'}`}>
                  {item.points}
                </Text>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* Stats Grid */}
        <Animated.View entering={FadeInDown.delay(300)} className="mx-4 mt-6">
          <Text className="text-lg font-bold text-gray-900 mb-3">Your Activity</Text>
          <View className="flex-row flex-wrap -mx-1">
            {[
              { label: 'Transactions', value: trustScore.stats.transactionsCompleted, icon: TrendingUp },
              { label: 'Events Hosted', value: trustScore.stats.eventsHosted, icon: Users },
              { label: 'Reviews', value: trustScore.stats.reviewsReceived, icon: Star },
              { label: 'Vouches Received', value: trustScore.stats.vouchesReceived, icon: Heart },
            ].map((stat, index) => {
              const StatIcon = stat.icon;
              return (
                <View key={index} className="w-1/2 p-1">
                  <View className="bg-white rounded-xl p-4">
                    <StatIcon size={20} color="#D4673A" />
                    <Text className="text-2xl font-bold text-gray-900 mt-2">{stat.value}</Text>
                    <Text className="text-gray-500 text-sm">{stat.label}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        </Animated.View>

        {/* Badges */}
        <Animated.View entering={FadeInDown.delay(400)} className="mx-4 mt-6">
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-lg font-bold text-gray-900">Badges Earned</Text>
            <Text className="text-sm text-gray-500">{trustScore.badges.length} badges</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-4 px-4">
            {trustScore.badges.map((badge, index) => {
              const BadgeIcon = BADGE_ICONS[badge.type] ?? Award;
              return (
                <View
                  key={badge.id}
                  className="bg-white rounded-xl p-4 mr-3 items-center"
                  style={{ width: 120 }}
                >
                  <View
                    className="w-14 h-14 rounded-full items-center justify-center mb-2"
                    style={{ backgroundColor: `${BADGE_COLORS.gold}20` }}
                  >
                    <BadgeIcon size={28} color={BADGE_COLORS.gold} />
                  </View>
                  <Text className="text-gray-900 font-semibold text-center text-sm" numberOfLines={2}>
                    {badge.name}
                  </Text>
                </View>
              );
            })}
            {/* Locked badges */}
            {[
              { name: 'Top Seller', icon: Award },
              { name: 'Event Pro', icon: Users },
            ].map((badge, index) => {
              const BadgeIcon = badge.icon;
              return (
                <View
                  key={`locked-${index}`}
                  className="bg-gray-100 rounded-xl p-4 mr-3 items-center opacity-50"
                  style={{ width: 120 }}
                >
                  <View className="w-14 h-14 rounded-full bg-gray-200 items-center justify-center mb-2">
                    <BadgeIcon size={28} color="#9CA3AF" />
                  </View>
                  <Text className="text-gray-500 font-medium text-center text-sm">{badge.name}</Text>
                </View>
              );
            })}
          </ScrollView>
        </Animated.View>

        {/* Vouches */}
        <Animated.View entering={FadeInDown.delay(500)} className="mx-4 mt-6 mb-8">
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-lg font-bold text-gray-900">Community Vouches</Text>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                // Navigate to vouch screen
              }}
              className="bg-amber-100 px-3 py-1.5 rounded-full"
            >
              <Text className="text-amber-700 font-medium text-sm">Request Vouch</Text>
            </Pressable>
          </View>

          {userVouches.length > 0 ? (
            userVouches.map((vouch) => (
              <View key={vouch.id} className="bg-white rounded-xl p-4 mb-2">
                <View className="flex-row items-center">
                  <Image source={{ uri: vouch.fromUserAvatar }} className="w-10 h-10 rounded-full" />
                  <View className="ml-3 flex-1">
                    <Text className="font-semibold text-gray-900">{vouch.fromUserName}</Text>
                    <Text className="text-gray-500 text-sm">{vouch.relationship}</Text>
                  </View>
                </View>
                <Text className="text-gray-700 mt-3 italic">"{vouch.message}"</Text>
              </View>
            ))
          ) : (
            <View className="bg-white rounded-xl p-6 items-center">
              <Heart size={32} color="#D4673A" />
              <Text className="text-gray-900 font-semibold mt-3">No vouches yet</Text>
              <Text className="text-gray-500 text-sm text-center mt-1">
                Ask trusted community members to vouch for you
              </Text>
            </View>
          )}
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}
