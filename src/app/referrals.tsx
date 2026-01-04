import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Share,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowLeft,
  Gift,
  Users,
  DollarSign,
  Copy,
  Share2,
  ChevronRight,
  Clock,
  CheckCircle,
  Sparkles,
  TrendingUp,
  Wallet,
  UserPlus,
  Send,
} from 'lucide-react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import { router } from 'expo-router';
import {
  getUserReferralCode,
  getReferralStats,
  getReferralHistory,
  getReferralShareMessage,
  getReferralLink,
  formatRewardAmount,
  addMockReferralData,
  REFERRAL_REWARDS,
  ReferralStats,
  ReferralHistoryItem,
} from '@/lib/referralSystem';

export default function ReferralsScreen() {
  const [referralCode, setReferralCode] = useState('');
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [history, setHistory] = useState<ReferralHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'how'>('overview');

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      // For demo, add mock data if none exists
      const existingStats = await getReferralStats();
      if (existingStats.totalReferrals === 0) {
        await addMockReferralData();
      }

      const [code, statsData, historyData] = await Promise.all([
        getUserReferralCode('user_123', 'John'),
        getReferralStats(),
        getReferralHistory(),
      ]);

      setReferralCode(code);
      setStats(statsData);
      setHistory(historyData);
    } catch (error) {
      console.error('Error loading referral data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCopyCode = async () => {
    await Clipboard.setStringAsync(referralCode);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert('Copied!', 'Your referral code has been copied to clipboard.');
  };

  const handleShare = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await Share.share({
        message: getReferralShareMessage(referralCode, 'I'),
        title: 'Join AfroConnect',
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'text-green-600';
      case 'paid':
        return 'text-blue-600';
      default:
        return 'text-yellow-600';
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100';
      case 'paid':
        return 'bg-blue-100';
      default:
        return 'bg-yellow-100';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'signup':
        return <UserPlus size={16} color="#1B4D3E" />;
      case 'first_transfer':
        return <Send size={16} color="#1B4D3E" />;
      case 'transfer_commission':
        return <TrendingUp size={16} color="#1B4D3E" />;
      default:
        return <Gift size={16} color="#1B4D3E" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <View className="flex-1 bg-cream-50">
      <LinearGradient
        colors={['#1B4D3E', '#0D3329']}
        style={{ paddingTop: 60, paddingBottom: 24 }}
      >
        <View className="px-4">
          {/* Header */}
          <View className="flex-row items-center mb-6">
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.back();
              }}
              className="w-10 h-10 bg-white/20 rounded-full items-center justify-center mr-4"
            >
              <ArrowLeft size={20} color="#FFFFFF" />
            </Pressable>
            <View className="flex-1">
              <Text className="text-white text-xl font-bold">Refer & Earn</Text>
              <Text className="text-white/70 text-sm">Invite friends, earn rewards</Text>
            </View>
            <Gift size={28} color="#C9A227" />
          </View>

          {/* Referral Code Card */}
          <Animated.View entering={FadeInDown.duration(400)} className="bg-white rounded-2xl p-4">
            <Text className="text-gray-500 text-sm mb-2">Your Referral Code</Text>
            <View className="flex-row items-center justify-between">
              <Text className="text-2xl font-bold text-warmBrown tracking-wider">
                {referralCode || '...'}
              </Text>
              <View className="flex-row">
                <Pressable
                  onPress={handleCopyCode}
                  className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center mr-2"
                >
                  <Copy size={18} color="#8B7355" />
                </Pressable>
                <Pressable
                  onPress={handleShare}
                  className="w-10 h-10 bg-forest-600 rounded-full items-center justify-center"
                >
                  <Share2 size={18} color="#FFFFFF" />
                </Pressable>
              </View>
            </View>
          </Animated.View>
        </View>
      </LinearGradient>

      {/* Stats Cards */}
      <View className="px-4 -mt-4">
        <Animated.View entering={FadeInUp.duration(400).delay(100)} className="flex-row">
          <View className="flex-1 bg-white rounded-2xl p-4 mr-2 shadow-sm">
            <View className="flex-row items-center mb-2">
              <View className="w-8 h-8 bg-forest-100 rounded-full items-center justify-center">
                <Users size={16} color="#1B4D3E" />
              </View>
            </View>
            <Text className="text-2xl font-bold text-warmBrown">
              {stats?.totalReferrals ?? 0}
            </Text>
            <Text className="text-gray-500 text-sm">Friends Referred</Text>
          </View>

          <View className="flex-1 bg-white rounded-2xl p-4 ml-2 shadow-sm">
            <View className="flex-row items-center mb-2">
              <View className="w-8 h-8 bg-gold-100 rounded-full items-center justify-center">
                <Wallet size={16} color="#C9A227" />
              </View>
            </View>
            <Text className="text-2xl font-bold text-forest-700">
              {formatRewardAmount((stats?.earnedRewards ?? 0) + (stats?.pendingRewards ?? 0))}
            </Text>
            <Text className="text-gray-500 text-sm">Total Earned</Text>
          </View>
        </Animated.View>

        {/* Pending Rewards Banner */}
        {stats && stats.pendingRewards > 0 && (
          <Animated.View entering={FadeInUp.duration(400).delay(200)} className="mt-3">
            <LinearGradient
              colors={['#C9A227', '#D4673A']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center' }}
            >
              <Clock size={20} color="#FFFFFF" />
              <View className="ml-3 flex-1">
                <Text className="text-white font-semibold">Pending Rewards</Text>
                <Text className="text-white/80 text-sm">
                  {formatRewardAmount(stats.pendingRewards)} waiting to be confirmed
                </Text>
              </View>
              <Sparkles size={20} color="#FFFFFF" />
            </LinearGradient>
          </Animated.View>
        )}
      </View>

      {/* Tabs */}
      <View className="flex-row px-4 mt-4 mb-2">
        {(['overview', 'history', 'how'] as const).map((tab) => (
          <Pressable
            key={tab}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setActiveTab(tab);
            }}
            className={`flex-1 py-3 rounded-xl mr-2 last:mr-0 ${
              activeTab === tab ? 'bg-forest-600' : 'bg-white'
            }`}
          >
            <Text
              className={`text-center font-semibold ${
                activeTab === tab ? 'text-white' : 'text-warmBrown'
              }`}
            >
              {tab === 'overview' ? 'Overview' : tab === 'history' ? 'History' : 'How It Works'}
            </Text>
          </Pressable>
        ))}
      </View>

      <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
        {activeTab === 'overview' && (
          <Animated.View entering={FadeInUp.duration(300)}>
            {/* Rewards Structure */}
            <Text className="text-warmBrown font-bold text-lg mt-4 mb-3">Earn Rewards</Text>

            <View className="bg-white rounded-2xl p-4 mb-3">
              <View className="flex-row items-center mb-4">
                <View className="w-10 h-10 bg-green-100 rounded-full items-center justify-center mr-3">
                  <UserPlus size={20} color="#16A34A" />
                </View>
                <View className="flex-1">
                  <Text className="text-warmBrown font-semibold">Friend Signs Up</Text>
                  <Text className="text-gray-500 text-sm">When they join with your code</Text>
                </View>
                <Text className="text-green-600 font-bold text-lg">
                  +{formatRewardAmount(REFERRAL_REWARDS.referrerSignupBonus)}
                </Text>
              </View>

              <View className="flex-row items-center mb-4">
                <View className="w-10 h-10 bg-blue-100 rounded-full items-center justify-center mr-3">
                  <Send size={20} color="#2563EB" />
                </View>
                <View className="flex-1">
                  <Text className="text-warmBrown font-semibold">First Transfer</Text>
                  <Text className="text-gray-500 text-sm">When they send money</Text>
                </View>
                <Text className="text-blue-600 font-bold text-lg">
                  +{formatRewardAmount(REFERRAL_REWARDS.referrerFirstTransferBonus)}
                </Text>
              </View>

              <View className="flex-row items-center">
                <View className="w-10 h-10 bg-purple-100 rounded-full items-center justify-center mr-3">
                  <TrendingUp size={20} color="#7C3AED" />
                </View>
                <View className="flex-1">
                  <Text className="text-warmBrown font-semibold">Ongoing Transfers</Text>
                  <Text className="text-gray-500 text-sm">
                    {REFERRAL_REWARDS.referrerTransferCommission}% of each transfer
                  </Text>
                </View>
                <Text className="text-purple-600 font-bold">Forever</Text>
              </View>
            </View>

            {/* What Your Friend Gets */}
            <Text className="text-warmBrown font-bold text-lg mt-4 mb-3">Your Friend Gets</Text>

            <View className="bg-forest-50 rounded-2xl p-4 mb-3">
              <View className="flex-row items-center mb-3">
                <Gift size={20} color="#1B4D3E" />
                <Text className="text-forest-700 font-semibold ml-2">Welcome Bonus</Text>
                <Text className="text-forest-600 ml-auto font-bold">
                  {formatRewardAmount(REFERRAL_REWARDS.newUserSignupBonus)}
                </Text>
              </View>
              <View className="flex-row items-center">
                <DollarSign size={20} color="#1B4D3E" />
                <Text className="text-forest-700 font-semibold ml-2">First Transfer Bonus</Text>
                <Text className="text-forest-600 ml-auto font-bold">
                  {formatRewardAmount(REFERRAL_REWARDS.newUserFirstTransferBonus)}
                </Text>
              </View>
            </View>

            {/* Share Button */}
            <Pressable
              onPress={handleShare}
              className="bg-forest-600 rounded-2xl py-4 flex-row items-center justify-center mt-4 mb-8"
            >
              <Share2 size={20} color="#FFFFFF" />
              <Text className="text-white font-bold text-lg ml-2">Share Your Code</Text>
            </Pressable>
          </Animated.View>
        )}

        {activeTab === 'history' && (
          <Animated.View entering={FadeInUp.duration(300)}>
            <Text className="text-warmBrown font-bold text-lg mt-4 mb-3">Reward History</Text>

            {history.length === 0 ? (
              <View className="bg-white rounded-2xl p-8 items-center">
                <Gift size={48} color="#CBD5E1" />
                <Text className="text-gray-500 text-center mt-4">
                  No rewards yet. Share your code to start earning!
                </Text>
              </View>
            ) : (
              <View className="bg-white rounded-2xl overflow-hidden mb-8">
                {history.map((item, index) => (
                  <View
                    key={item.id}
                    className={`p-4 flex-row items-center ${
                      index < history.length - 1 ? 'border-b border-gray-100' : ''
                    }`}
                  >
                    <View className="w-10 h-10 bg-forest-100 rounded-full items-center justify-center mr-3">
                      {getTypeIcon(item.type)}
                    </View>
                    <View className="flex-1">
                      <Text className="text-warmBrown font-medium">{item.description}</Text>
                      <Text className="text-gray-500 text-sm">{formatDate(item.createdAt)}</Text>
                    </View>
                    <View className="items-end">
                      <Text className="text-forest-700 font-bold">
                        +{formatRewardAmount(item.amount)}
                      </Text>
                      <View className={`px-2 py-0.5 rounded-full ${getStatusBg(item.status)}`}>
                        <Text className={`text-xs font-medium ${getStatusColor(item.status)}`}>
                          {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                        </Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </Animated.View>
        )}

        {activeTab === 'how' && (
          <Animated.View entering={FadeInUp.duration(300)}>
            <Text className="text-warmBrown font-bold text-lg mt-4 mb-3">How It Works</Text>

            <View className="bg-white rounded-2xl p-4 mb-4">
              <View className="flex-row items-start mb-6">
                <View className="w-8 h-8 bg-forest-600 rounded-full items-center justify-center mr-3">
                  <Text className="text-white font-bold">1</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-warmBrown font-semibold">Share Your Code</Text>
                  <Text className="text-gray-500 text-sm mt-1">
                    Send your unique referral code to friends via WhatsApp, SMS, or any app
                  </Text>
                </View>
              </View>

              <View className="flex-row items-start mb-6">
                <View className="w-8 h-8 bg-forest-600 rounded-full items-center justify-center mr-3">
                  <Text className="text-white font-bold">2</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-warmBrown font-semibold">Friend Joins</Text>
                  <Text className="text-gray-500 text-sm mt-1">
                    They download AfroConnect and sign up using your code. You both get a bonus!
                  </Text>
                </View>
              </View>

              <View className="flex-row items-start mb-6">
                <View className="w-8 h-8 bg-forest-600 rounded-full items-center justify-center mr-3">
                  <Text className="text-white font-bold">3</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-warmBrown font-semibold">They Send Money</Text>
                  <Text className="text-gray-500 text-sm mt-1">
                    When your friend makes their first transfer, you earn an extra bonus
                  </Text>
                </View>
              </View>

              <View className="flex-row items-start">
                <View className="w-8 h-8 bg-gold-500 rounded-full items-center justify-center mr-3">
                  <Sparkles size={16} color="#FFFFFF" />
                </View>
                <View className="flex-1">
                  <Text className="text-warmBrown font-semibold">Keep Earning Forever</Text>
                  <Text className="text-gray-500 text-sm mt-1">
                    You earn a commission on every transfer they make through AfroConnect
                  </Text>
                </View>
              </View>
            </View>

            {/* FAQ */}
            <Text className="text-warmBrown font-bold text-lg mt-4 mb-3">FAQ</Text>

            <View className="bg-white rounded-2xl p-4 mb-8">
              <View className="mb-4">
                <Text className="text-warmBrown font-semibold">When do I get paid?</Text>
                <Text className="text-gray-500 text-sm mt-1">
                  Rewards are confirmed after your friend completes their transfer. Payouts are processed monthly to your preferred method.
                </Text>
              </View>

              <View className="mb-4">
                <Text className="text-warmBrown font-semibold">Is there a limit?</Text>
                <Text className="text-gray-500 text-sm mt-1">
                  No limit! Invite as many friends as you want and earn on every single one.
                </Text>
              </View>

              <View>
                <Text className="text-warmBrown font-semibold">How do I withdraw?</Text>
                <Text className="text-gray-500 text-sm mt-1">
                  Once you have $10 or more in confirmed rewards, you can withdraw to your bank, mobile money, or use it for transfers.
                </Text>
              </View>
            </View>
          </Animated.View>
        )}
      </ScrollView>
    </View>
  );
}
