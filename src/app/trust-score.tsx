import { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator, Modal, TextInput } from 'react-native';
import { Image } from 'expo-image';
import { Stack, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Shield, Star, Award, CheckCircle, Users, Heart, TrendingUp, BadgeCheck, ChevronLeft, X } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useStore } from '@/lib/store';
import {
  getOrCreateTrustScore,
  getUserVouches,
  getUserBadges,
  getCombinedReviewStats,
  createVouch,
  getVerificationLevelColor,
  getScoreColor,
  DbUserTrustScore,
  DbUserVouch,
  DbUserBadge,
} from '@/lib/trust-api';
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

const RELATIONSHIP_OPTIONS: Array<{ value: DbUserVouch['relationship']; label: string }> = [
  { value: 'friend', label: 'Friend' },
  { value: 'family', label: 'Family' },
  { value: 'business', label: 'Business Partner' },
  { value: 'neighbor', label: 'Neighbor' },
  { value: 'colleague', label: 'Colleague' },
];

export default function TrustScoreScreen() {
  const router = useRouter();
  const currentUser = useStore((s) => s.currentUser);
  const isGuest = useStore((s) => s.isGuest);

  const [loading, setLoading] = useState(true);
  const [trustScore, setTrustScore] = useState<DbUserTrustScore | null>(null);
  const [vouches, setVouches] = useState<DbUserVouch[]>([]);
  const [badges, setBadges] = useState<DbUserBadge[]>([]);
  const [reviewStats, setReviewStats] = useState({ totalReviews: 0, avgRating: 0, totalConfirmations: 0 });

  // Vouch modal state
  const [showVouchModal, setShowVouchModal] = useState(false);
  const [vouchUserId, setVouchUserId] = useState('');
  const [vouchRelationship, setVouchRelationship] = useState<DbUserVouch['relationship']>('friend');
  const [vouchMessage, setVouchMessage] = useState('');
  const [sendingVouch, setSendingVouch] = useState(false);

  const userId = currentUser?.id;

  useEffect(() => {
    if (!userId || isGuest) {
      setLoading(false);
      return;
    }

    const loadData = async () => {
      try {
        const [score, userVouches, userBadges, stats] = await Promise.all([
          getOrCreateTrustScore(userId),
          getUserVouches(userId),
          getUserBadges(userId),
          getCombinedReviewStats(userId),
        ]);

        setTrustScore(score);
        setVouches(userVouches);
        setBadges(userBadges);
        setReviewStats(stats);
      } catch (error) {
        console.error('Error loading trust score data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [userId, isGuest]);

  const handleSendVouch = async () => {
    if (!currentUser?.id || !vouchUserId.trim()) return;

    setSendingVouch(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      await createVouch(currentUser.id, vouchUserId.trim(), vouchRelationship, vouchMessage.trim() || undefined);
      setShowVouchModal(false);
      setVouchUserId('');
      setVouchMessage('');
      // Reload vouches
      const userVouches = await getUserVouches(userId!);
      setVouches(userVouches);
    } catch (error) {
      console.error('Error sending vouch:', error);
    } finally {
      setSendingVouch(false);
    }
  };

  const getLevelInfo = (level: string) => {
    const levels = {
      unverified: { name: 'Unverified', color: '#9CA3AF', icon: Shield },
      basic: { name: 'Basic Member', color: '#6B7280', icon: Shield },
      verified: { name: 'Verified', color: '#3B82F6', icon: CheckCircle },
      trusted: { name: 'Trusted', color: '#C9A227', icon: Award },
      community_leader: { name: 'Community Leader', color: '#1B4D3E', icon: Star },
    };
    return levels[level as keyof typeof levels] ?? levels.basic;
  };

  if (loading) {
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
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#1B4D3E" />
          <Text className="text-gray-500 mt-3">Loading your trust score...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!userId || isGuest) {
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
        <View className="flex-1 items-center justify-center px-6">
          <Shield size={64} color="#1B4D3E" />
          <Text className="text-warmBrown font-bold text-xl mt-4">Build Your Trust Score</Text>
          <Text className="text-gray-500 text-center mt-2">
            Sign in to track your community trust score and see how others view your reputation.
          </Text>
          <Pressable
            onPress={() => router.push('/signup')}
            className="mt-6 bg-forest-600 px-8 py-3 rounded-full"
          >
            <Text className="text-white font-semibold">Sign In</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const score = trustScore?.overall_score ?? 20;
  const level = trustScore?.verification_level ?? 'basic';
  const levelInfo = getLevelInfo(level);
  const LevelIcon = levelInfo.icon;

  // Calculate stats
  const stats = {
    transactionsCompleted: trustScore?.transactions_completed ?? 0,
    eventsHosted: trustScore?.events_hosted ?? 0,
    reviewsReceived: trustScore?.reviews_received ?? reviewStats.totalReviews,
    communityContributions: trustScore?.community_contributions ?? 0,
    vouchesReceived: trustScore?.vouches_received ?? vouches.length,
    vouchesGiven: trustScore?.vouches_given ?? 0,
  };

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
                <Text className="text-5xl font-bold text-white">{score}</Text>
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
              <Text className="text-gray-900 font-medium text-sm">{score}/100</Text>
            </View>
            <View className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <View
                className="h-full rounded-full"
                style={{
                  width: `${score}%`,
                  backgroundColor: getScoreColor(score),
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
              { action: 'Get reviews from customers', points: '+3 each', done: stats.reviewsReceived > 0 },
              { action: 'Get vouched by a member', points: '+15 each', done: stats.vouchesReceived > 0 },
              { action: 'Host an event', points: '+10', done: stats.eventsHosted > 0 },
              { action: 'Complete a transaction', points: '+5', done: stats.transactionsCompleted > 0 },
              { action: 'Contribute to community', points: '+8', done: stats.communityContributions > 0 },
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
              { label: 'Reviews', value: stats.reviewsReceived, icon: Star },
              { label: 'Avg Rating', value: reviewStats.avgRating > 0 ? reviewStats.avgRating.toFixed(1) : '—', icon: Star },
              { label: 'Vouches', value: stats.vouchesReceived, icon: Heart },
              { label: 'Confirmations', value: reviewStats.totalConfirmations, icon: CheckCircle },
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
            <Text className="text-sm text-gray-500">{badges.length} badges</Text>
          </View>
          {badges.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-4 px-4" style={{ flexGrow: 0 }}>
              {badges.map((badge) => {
                const BadgeIcon = BADGE_ICONS[badge.badge_type] ?? Award;
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
                      {badge.badge_name}
                    </Text>
                  </View>
                );
              })}
            </ScrollView>
          ) : (
            <View className="bg-white rounded-2xl p-6 items-center">
              <Award size={32} color="#9CA3AF" />
              <Text className="text-gray-900 font-semibold mt-3">No badges yet</Text>
              <Text className="text-gray-500 text-sm text-center mt-1">
                Earn badges by being active in the community
              </Text>
            </View>
          )}
        </Animated.View>

        {/* Vouches */}
        <Animated.View entering={FadeInDown.delay(500)} className="mx-4 mt-6 mb-8">
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-lg font-bold text-gray-900">Community Vouches</Text>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setShowVouchModal(true);
              }}
              className="bg-amber-100 px-3 py-1.5 rounded-full"
            >
              <Text className="text-amber-700 font-medium text-sm">Vouch for Someone</Text>
            </Pressable>
          </View>

          {vouches.length > 0 ? (
            vouches.map((vouch) => (
              <View key={vouch.id} className="bg-white rounded-xl p-4 mb-2">
                <View className="flex-row items-center">
                  <Image
                    source={{ uri: vouch.from_user?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100' }}
                    style={{ width: 40, height: 40, borderRadius: 20 }}
                  />
                  <View className="ml-3 flex-1">
                    <Text className="font-semibold text-gray-900">{vouch.from_user?.name || 'Community Member'}</Text>
                    <Text className="text-gray-500 text-sm capitalize">{vouch.relationship}</Text>
                  </View>
                </View>
                {vouch.message && (
                  <Text className="text-gray-700 mt-3 italic">"{vouch.message}"</Text>
                )}
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

      {/* Vouch Modal */}
      <Modal visible={showVouchModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView className="flex-1 bg-cream">
          <View className="px-5 pt-4 pb-3 flex-row items-center justify-between border-b border-gray-100">
            <Pressable
              onPress={() => setShowVouchModal(false)}
              className="bg-white rounded-full p-2 shadow-sm"
            >
              <X size={22} color="#2D1F1A" />
            </Pressable>
            <Text className="text-lg font-bold text-warmBrown">Vouch for Someone</Text>
            <Pressable
              onPress={handleSendVouch}
              disabled={!vouchUserId.trim() || sendingVouch}
              className={`rounded-full px-4 py-2 ${vouchUserId.trim() ? 'bg-forest-600' : 'bg-gray-300'}`}
            >
              {sendingVouch ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text className="text-white font-semibold">Send</Text>
              )}
            </Pressable>
          </View>

          <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
            <View className="bg-white rounded-2xl p-4 mt-4">
              <Text className="text-warmBrown font-semibold mb-2">User ID</Text>
              <TextInput
                value={vouchUserId}
                onChangeText={setVouchUserId}
                placeholder="Enter the user's ID to vouch for them"
                placeholderTextColor="#9CA3AF"
                className="text-warmBrown border border-gray-200 rounded-xl px-4 py-3"
              />
              <Text className="text-gray-500 text-xs mt-2">
                You can find someone's ID on their profile page
              </Text>
            </View>

            <View className="bg-white rounded-2xl p-4 mt-4">
              <Text className="text-warmBrown font-semibold mb-3">Relationship</Text>
              <View className="flex-row flex-wrap gap-2">
                {RELATIONSHIP_OPTIONS.map((option) => (
                  <Pressable
                    key={option.value}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setVouchRelationship(option.value);
                    }}
                    className={`px-4 py-2 rounded-full ${
                      vouchRelationship === option.value ? 'bg-forest-600' : 'bg-gray-100'
                    }`}
                  >
                    <Text
                      className={`font-medium ${
                        vouchRelationship === option.value ? 'text-white' : 'text-gray-700'
                      }`}
                    >
                      {option.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View className="bg-white rounded-2xl p-4 mt-4">
              <Text className="text-warmBrown font-semibold mb-2">Message (optional)</Text>
              <TextInput
                value={vouchMessage}
                onChangeText={setVouchMessage}
                placeholder="Why do you vouch for this person?"
                placeholderTextColor="#9CA3AF"
                multiline
                className="text-warmBrown border border-gray-200 rounded-xl px-4 py-3"
                style={{ minHeight: 100, textAlignVertical: 'top' }}
              />
            </View>

            <View className="h-20" />
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
