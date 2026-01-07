import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Share,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import {
  ArrowLeft,
  TrendingUp,
  Bitcoin,
  Landmark,
  Percent,
  Gift,
  Users,
  ChevronRight,
  Share2,
  Clock,
  CheckCircle,
  Sparkles,
  Wallet,
  Star,
  Info,
  Layers,
  DollarSign,
  ExternalLink,
} from 'lucide-react-native';
import Animated, { FadeInDown, FadeInUp, FadeIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import { router } from 'expo-router';
import {
  PARTNERS,
  CATEGORY_INFO,
  getPartnersByCategory,
  getPopularPartners,
  getPartnerReferralStats,
  getPartnerReferralHistory,
  formatPartnerReward,
  getPartnerShareMessage,
  addMockPartnerReferralData,
  type Partner,
  type PartnerCategory,
  type PartnerReferralStats,
  type PartnerReferralHistoryItem,
} from '@/lib/partnerReferrals';
import { getUserReferralCode } from '@/lib/referralSystem';

const categoryIcons = {
  invest: TrendingUp,
  crypto: Bitcoin,
  banking: Landmark,
  cashback: Percent,
};

export default function ReferralHubScreen() {
  const [activeTab, setActiveTab] = useState<'partners' | 'earnings' | 'how'>('partners');
  const [activeCategory, setActiveCategory] = useState<PartnerCategory | 'popular'>('popular');
  const [stats, setStats] = useState<PartnerReferralStats | null>(null);
  const [history, setHistory] = useState<PartnerReferralHistoryItem[]>([]);
  const [referralCode, setReferralCode] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);

  const loadData = useCallback(async () => {
    try {
      // Load referral code
      const code = await getUserReferralCode('user_123', 'John');
      setReferralCode(code);

      // Load stats - add mock data if empty
      let statsData = await getPartnerReferralStats();
      if (statsData.totalReferrals === 0) {
        await addMockPartnerReferralData();
        statsData = await getPartnerReferralStats();
      }
      setStats(statsData);

      // Load history
      const historyData = await getPartnerReferralHistory();
      setHistory(historyData);
    } catch (error) {
      console.error('Error loading referral hub data:', error);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleShare = async (partner: Partner) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await Share.share({
        message: getPartnerShareMessage(partner, referralCode),
        title: `Join ${partner.name}`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleCopyCode = async () => {
    await Clipboard.setStringAsync(referralCode);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const getDisplayPartners = (): Partner[] => {
    if (activeCategory === 'popular') {
      return getPopularPartners();
    }
    return getPartnersByCategory(activeCategory);
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'text-green-600';
      case 'paid': return 'text-blue-600';
      default: return 'text-yellow-600';
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100';
      case 'paid': return 'bg-blue-100';
      default: return 'bg-yellow-100';
    }
  };

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <LinearGradient
        colors={['#7C3AED', '#6D28D9', '#5B21B6']}
        style={{ paddingTop: 60, paddingBottom: 24 }}
      >
        <View className="px-4">
          <View className="flex-row items-center mb-4">
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
              <Text className="text-white text-xl font-bold">Referral Hub</Text>
              <Text className="text-white/70 text-sm">Earn from top apps & services</Text>
            </View>
            <Gift size={28} color="#FDE68A" />
          </View>

          {/* Stats Summary */}
          <Animated.View entering={FadeInDown.duration(400)} className="flex-row">
            <View className="flex-1 bg-white/20 rounded-xl p-3 mr-2">
              <View className="flex-row items-center mb-1">
                <Users size={14} color="#FFFFFF" />
                <Text className="text-white/70 text-xs ml-1">Referrals</Text>
              </View>
              <Text className="text-white text-xl font-bold">{stats?.totalReferrals ?? 0}</Text>
            </View>
            <View className="flex-1 bg-white/20 rounded-xl p-3 ml-2">
              <View className="flex-row items-center mb-1">
                <Wallet size={14} color="#FFFFFF" />
                <Text className="text-white/70 text-xs ml-1">Total Earned</Text>
              </View>
              <Text className="text-white text-xl font-bold">
                {formatPartnerReward((stats?.totalEarnings ?? 0) + (stats?.pendingEarnings ?? 0))}
              </Text>
            </View>
          </Animated.View>

          {/* Your Code */}
          <Animated.View
            entering={FadeInDown.duration(400).delay(100)}
            className="mt-3 bg-white/10 rounded-xl p-3 flex-row items-center justify-between"
          >
            <View>
              <Text className="text-white/70 text-xs">Your Code</Text>
              <Text className="text-white text-lg font-bold tracking-widest">{referralCode}</Text>
            </View>
            <Pressable
              onPress={handleCopyCode}
              className="bg-white/20 px-4 py-2 rounded-lg"
            >
              <Text className="text-white font-semibold text-sm">Copy</Text>
            </Pressable>
          </Animated.View>
        </View>
      </LinearGradient>

      {/* Tab Bar */}
      <View className="flex-row px-4 py-3 bg-white border-b border-gray-100">
        {(['partners', 'earnings', 'how'] as const).map((tab) => (
          <Pressable
            key={tab}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setActiveTab(tab);
            }}
            className={`flex-1 py-2.5 rounded-xl mr-2 last:mr-0 ${
              activeTab === tab ? 'bg-violet-600' : 'bg-gray-100'
            }`}
          >
            <Text
              className={`text-center font-semibold text-sm ${
                activeTab === tab ? 'text-white' : 'text-gray-600'
              }`}
            >
              {tab === 'partners' ? 'Partners' : tab === 'earnings' ? 'Earnings' : 'How It Works'}
            </Text>
          </Pressable>
        ))}
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#7C3AED" />
        }
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {activeTab === 'partners' && (
          <Animated.View entering={FadeIn.duration(300)}>
            {/* Category Filter */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12, gap: 8 }}
              style={{ flexGrow: 0 }}
            >
              {/* Popular */}
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setActiveCategory('popular');
                }}
              >
                <LinearGradient
                  colors={activeCategory === 'popular' ? ['#F59E0B', '#D97706'] : ['#F3F4F6', '#F3F4F6']}
                  style={{ borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, flexDirection: 'row', alignItems: 'center' }}
                >
                  <Star size={16} color={activeCategory === 'popular' ? '#FFFFFF' : '#9CA3AF'} />
                  <Text className={`ml-2 font-semibold ${activeCategory === 'popular' ? 'text-white' : 'text-gray-500'}`}>
                    Popular
                  </Text>
                </LinearGradient>
              </Pressable>

              {/* Categories */}
              {(Object.keys(CATEGORY_INFO) as PartnerCategory[]).map((category) => {
                const info = CATEGORY_INFO[category];
                const Icon = categoryIcons[category];
                const isActive = activeCategory === category;

                return (
                  <Pressable
                    key={category}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setActiveCategory(category);
                    }}
                  >
                    <LinearGradient
                      colors={isActive ? info.gradient : ['#F3F4F6', '#F3F4F6']}
                      style={{ borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, flexDirection: 'row', alignItems: 'center' }}
                    >
                      <Icon size={16} color={isActive ? '#FFFFFF' : '#9CA3AF'} />
                      <Text className={`ml-2 font-semibold ${isActive ? 'text-white' : 'text-gray-500'}`}>
                        {info.name}
                      </Text>
                    </LinearGradient>
                  </Pressable>
                );
              })}
            </ScrollView>

            {/* Two-Tier Banner */}
            <View className="mx-4 mb-4">
              <LinearGradient
                colors={['#10B981', '#059669']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{ borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center' }}
              >
                <View className="w-10 h-10 bg-white/20 rounded-full items-center justify-center">
                  <Layers size={20} color="#FFFFFF" />
                </View>
                <View className="ml-3 flex-1">
                  <Text className="text-white font-bold">Two-Tier Earnings</Text>
                  <Text className="text-white/80 text-xs mt-0.5">
                    Earn when your friends refer others too!
                  </Text>
                </View>
                {stats && stats.tier2Earnings > 0 && (
                  <View className="bg-white/20 px-3 py-1.5 rounded-full">
                    <Text className="text-white font-bold text-sm">
                      +{formatPartnerReward(stats.tier2Earnings)}
                    </Text>
                  </View>
                )}
              </LinearGradient>
            </View>

            {/* Partner Cards */}
            <View className="px-4">
              {getDisplayPartners().map((partner, index) => (
                <Animated.View
                  key={partner.id}
                  entering={FadeInUp.duration(300).delay(index * 50)}
                >
                  <Pressable
                    onPress={() => setSelectedPartner(selectedPartner?.id === partner.id ? null : partner)}
                    className="mb-3"
                  >
                    <View className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
                      {/* Partner Header */}
                      <View className="p-4 flex-row items-center">
                        <LinearGradient
                          colors={partner.gradient}
                          style={{ width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center' }}
                        >
                          <Text className="text-white text-xl font-bold">
                            {partner.name.charAt(0)}
                          </Text>
                        </LinearGradient>
                        <View className="ml-3 flex-1">
                          <View className="flex-row items-center">
                            <Text className="text-gray-900 font-bold text-lg">{partner.name}</Text>
                            {partner.popular && (
                              <View className="ml-2 bg-amber-100 px-2 py-0.5 rounded-full">
                                <Text className="text-amber-700 text-xs font-medium">Popular</Text>
                              </View>
                            )}
                          </View>
                          <Text className="text-gray-500 text-sm">{partner.description}</Text>
                        </View>
                        <ChevronRight
                          size={20}
                          color="#9CA3AF"
                          style={{ transform: [{ rotate: selectedPartner?.id === partner.id ? '90deg' : '0deg' }] }}
                        />
                      </View>

                      {/* Reward Summary */}
                      <View className="px-4 pb-4 flex-row">
                        <View className="flex-1 bg-green-50 rounded-xl p-3 mr-2">
                          <Text className="text-green-600 text-xs font-medium">You Earn</Text>
                          <Text className="text-green-700 text-lg font-bold">
                            {formatPartnerReward(partner.referrerReward)}
                          </Text>
                        </View>
                        <View className="flex-1 bg-blue-50 rounded-xl p-3 ml-2">
                          <Text className="text-blue-600 text-xs font-medium">Friend Gets</Text>
                          <Text className="text-blue-700 text-sm font-bold" numberOfLines={1}>
                            {partner.referreeReward}
                          </Text>
                        </View>
                      </View>

                      {/* Expanded Details */}
                      {selectedPartner?.id === partner.id && (
                        <Animated.View entering={FadeIn.duration(200)} className="border-t border-gray-100">
                          <View className="p-4">
                            {/* Tier 2 Info */}
                            <View className="bg-violet-50 rounded-xl p-3 mb-3">
                              <View className="flex-row items-center">
                                <Layers size={16} color="#7C3AED" />
                                <Text className="text-violet-700 font-semibold ml-2">Tier 2 Bonus</Text>
                              </View>
                              <Text className="text-violet-600 text-sm mt-1">
                                Earn {partner.tier2Percentage}% ({formatPartnerReward(Math.floor(partner.referrerReward * partner.tier2Percentage / 100))}) when your friends refer others!
                              </Text>
                            </View>

                            {/* Requirements */}
                            {partner.requirements && (
                              <View className="flex-row items-start mb-3">
                                <Info size={16} color="#9CA3AF" />
                                <Text className="text-gray-500 text-sm ml-2 flex-1">
                                  Requirement: {partner.requirements}
                                </Text>
                              </View>
                            )}

                            {/* Share Button */}
                            <Pressable
                              onPress={() => handleShare(partner)}
                              className="bg-violet-600 rounded-xl py-3 flex-row items-center justify-center"
                            >
                              <Share2 size={18} color="#FFFFFF" />
                              <Text className="text-white font-bold ml-2">Share & Earn</Text>
                            </Pressable>
                          </View>
                        </Animated.View>
                      )}
                    </View>
                  </Pressable>
                </Animated.View>
              ))}
            </View>
          </Animated.View>
        )}

        {activeTab === 'earnings' && (
          <Animated.View entering={FadeIn.duration(300)} className="px-4 pt-4">
            {/* Earnings Summary Cards */}
            <View className="flex-row mb-4">
              <View className="flex-1 bg-white rounded-2xl p-4 mr-2 shadow-sm">
                <View className="w-10 h-10 bg-green-100 rounded-full items-center justify-center mb-2">
                  <CheckCircle size={20} color="#16A34A" />
                </View>
                <Text className="text-gray-500 text-sm">Confirmed</Text>
                <Text className="text-gray-900 text-xl font-bold">
                  {formatPartnerReward(stats?.totalEarnings ?? 0)}
                </Text>
              </View>
              <View className="flex-1 bg-white rounded-2xl p-4 ml-2 shadow-sm">
                <View className="w-10 h-10 bg-amber-100 rounded-full items-center justify-center mb-2">
                  <Clock size={20} color="#D97706" />
                </View>
                <Text className="text-gray-500 text-sm">Pending</Text>
                <Text className="text-gray-900 text-xl font-bold">
                  {formatPartnerReward(stats?.pendingEarnings ?? 0)}
                </Text>
              </View>
            </View>

            {/* Category Breakdown */}
            <Text className="text-gray-900 font-bold text-lg mb-3">By Category</Text>
            <View className="bg-white rounded-2xl p-4 mb-4 shadow-sm">
              {(Object.keys(CATEGORY_INFO) as PartnerCategory[]).map((category, index) => {
                const info = CATEGORY_INFO[category];
                const categoryStats = stats?.byCategory[category];
                const Icon = categoryIcons[category];

                return (
                  <View
                    key={category}
                    className={`flex-row items-center py-3 ${
                      index < 3 ? 'border-b border-gray-100' : ''
                    }`}
                  >
                    <LinearGradient
                      colors={info.gradient}
                      style={{ width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}
                    >
                      <Icon size={18} color="#FFFFFF" />
                    </LinearGradient>
                    <View className="ml-3 flex-1">
                      <Text className="text-gray-900 font-semibold">{info.name}</Text>
                      <Text className="text-gray-500 text-sm">
                        {categoryStats?.referrals ?? 0} referrals
                      </Text>
                    </View>
                    <Text className="text-gray-900 font-bold">
                      {formatPartnerReward(categoryStats?.earnings ?? 0)}
                    </Text>
                  </View>
                );
              })}
            </View>

            {/* Tier 2 Earnings */}
            {stats && stats.tier2Earnings > 0 && (
              <View className="mb-4">
                <LinearGradient
                  colors={['#7C3AED', '#6D28D9']}
                  style={{ borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center' }}
                >
                  <Layers size={24} color="#FFFFFF" />
                  <View className="ml-3 flex-1">
                    <Text className="text-white font-bold">Tier 2 Earnings</Text>
                    <Text className="text-white/70 text-sm">From your friends' referrals</Text>
                  </View>
                  <Text className="text-white text-xl font-bold">
                    {formatPartnerReward(stats.tier2Earnings)}
                  </Text>
                </LinearGradient>
              </View>
            )}

            {/* History */}
            <Text className="text-gray-900 font-bold text-lg mb-3">Recent Activity</Text>
            {history.length === 0 ? (
              <View className="bg-white rounded-2xl p-8 items-center shadow-sm">
                <Gift size={48} color="#CBD5E1" />
                <Text className="text-gray-500 text-center mt-4">
                  No referrals yet. Share partner links to start earning!
                </Text>
              </View>
            ) : (
              <View className="bg-white rounded-2xl overflow-hidden shadow-sm">
                {history.slice(0, 10).map((item, index) => {
                  const categoryInfo = CATEGORY_INFO[item.category];
                  const Icon = categoryIcons[item.category];

                  return (
                    <View
                      key={item.id}
                      className={`p-4 flex-row items-center ${
                        index < Math.min(history.length, 10) - 1 ? 'border-b border-gray-100' : ''
                      }`}
                    >
                      <LinearGradient
                        colors={categoryInfo.gradient}
                        style={{ width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}
                      >
                        <Icon size={18} color="#FFFFFF" />
                      </LinearGradient>
                      <View className="ml-3 flex-1">
                        <View className="flex-row items-center">
                          <Text className="text-gray-900 font-medium">{item.partnerName}</Text>
                          {item.tier === 2 && (
                            <View className="ml-2 bg-violet-100 px-1.5 py-0.5 rounded">
                              <Text className="text-violet-700 text-xs font-medium">Tier 2</Text>
                            </View>
                          )}
                        </View>
                        <Text className="text-gray-500 text-sm">{formatDate(item.createdAt)}</Text>
                      </View>
                      <View className="items-end">
                        <Text className="text-green-600 font-bold">+{formatPartnerReward(item.amount)}</Text>
                        <View className={`px-2 py-0.5 rounded-full ${getStatusBg(item.status)}`}>
                          <Text className={`text-xs font-medium ${getStatusColor(item.status)}`}>
                            {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                          </Text>
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </Animated.View>
        )}

        {activeTab === 'how' && (
          <Animated.View entering={FadeIn.duration(300)} className="px-4 pt-4">
            {/* Two-Tier Explanation */}
            <View className="bg-white rounded-2xl p-5 mb-4 shadow-sm">
              <View className="flex-row items-center mb-4">
                <LinearGradient
                  colors={['#7C3AED', '#6D28D9']}
                  style={{ width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' }}
                >
                  <Layers size={24} color="#FFFFFF" />
                </LinearGradient>
                <View className="ml-3">
                  <Text className="text-gray-900 font-bold text-lg">Two-Tier System</Text>
                  <Text className="text-gray-500 text-sm">Double your earning potential</Text>
                </View>
              </View>

              {/* Tier 1 */}
              <View className="bg-green-50 rounded-xl p-4 mb-3">
                <View className="flex-row items-center mb-2">
                  <View className="w-8 h-8 bg-green-500 rounded-full items-center justify-center">
                    <Text className="text-white font-bold">1</Text>
                  </View>
                  <Text className="text-green-700 font-bold ml-3">Tier 1: Direct Referrals</Text>
                </View>
                <Text className="text-green-600 text-sm">
                  Share your code with friends. When they sign up for any partner app, you earn the full referral bonus!
                </Text>
              </View>

              {/* Tier 2 */}
              <View className="bg-violet-50 rounded-xl p-4">
                <View className="flex-row items-center mb-2">
                  <View className="w-8 h-8 bg-violet-500 rounded-full items-center justify-center">
                    <Text className="text-white font-bold">2</Text>
                  </View>
                  <Text className="text-violet-700 font-bold ml-3">Tier 2: Indirect Referrals</Text>
                </View>
                <Text className="text-violet-600 text-sm">
                  When your friends share THEIR code and get referrals, you earn 15-25% of their bonus too! Passive income!
                </Text>
              </View>
            </View>

            {/* Steps */}
            <Text className="text-gray-900 font-bold text-lg mb-3">How to Earn</Text>
            <View className="bg-white rounded-2xl p-5 mb-4 shadow-sm">
              {[
                {
                  step: 1,
                  title: 'Choose a Partner',
                  desc: 'Browse investment, crypto, banking, or cashback apps',
                  color: '#10B981',
                },
                {
                  step: 2,
                  title: 'Share Your Code',
                  desc: 'Send your referral link via text, WhatsApp, or social media',
                  color: '#3B82F6',
                },
                {
                  step: 3,
                  title: 'Friend Signs Up',
                  desc: 'They join using your link and complete any requirements',
                  color: '#F59E0B',
                },
                {
                  step: 4,
                  title: 'Both Get Rewarded',
                  desc: 'You earn cash and your friend gets their welcome bonus',
                  color: '#7C3AED',
                },
              ].map((item, index) => (
                <View
                  key={item.step}
                  className={`flex-row items-start ${index < 3 ? 'mb-5' : ''}`}
                >
                  <View
                    className="w-10 h-10 rounded-full items-center justify-center"
                    style={{ backgroundColor: item.color }}
                  >
                    <Text className="text-white font-bold text-lg">{item.step}</Text>
                  </View>
                  <View className="ml-4 flex-1">
                    <Text className="text-gray-900 font-semibold text-base">{item.title}</Text>
                    <Text className="text-gray-500 text-sm mt-0.5">{item.desc}</Text>
                  </View>
                </View>
              ))}
            </View>

            {/* Potential Earnings */}
            <Text className="text-gray-900 font-bold text-lg mb-3">Earning Potential</Text>
            <View className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-5 mb-4 border border-amber-100">
              <View className="flex-row items-center mb-4">
                <DollarSign size={24} color="#D97706" />
                <Text className="text-amber-800 font-bold text-lg ml-2">Example Earnings</Text>
              </View>

              <View className="space-y-3">
                <View className="flex-row justify-between">
                  <Text className="text-amber-700">5 friends join Robinhood</Text>
                  <Text className="text-amber-800 font-bold">$50</Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-amber-700">3 friends join Chime</Text>
                  <Text className="text-amber-800 font-bold">$300</Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-amber-700">5 friends join Coinbase</Text>
                  <Text className="text-amber-800 font-bold">$50</Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-amber-700">10 friends join Rakuten</Text>
                  <Text className="text-amber-800 font-bold">$300</Text>
                </View>
                <View className="h-px bg-amber-200 my-2" />
                <View className="flex-row justify-between">
                  <Text className="text-amber-800 font-bold">Tier 1 Total</Text>
                  <Text className="text-amber-800 font-bold text-lg">$700</Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-amber-700">+ Tier 2 earnings (est.)</Text>
                  <Text className="text-amber-800 font-bold">$100+</Text>
                </View>
              </View>
            </View>

            {/* FAQ */}
            <Text className="text-gray-900 font-bold text-lg mb-3">FAQ</Text>
            <View className="bg-white rounded-2xl p-5 mb-4 shadow-sm">
              <View className="mb-4">
                <Text className="text-gray-900 font-semibold">When do I get paid?</Text>
                <Text className="text-gray-500 text-sm mt-1">
                  Rewards are confirmed after your friend completes the partner's requirements (usually within 1-2 weeks). Payouts are processed monthly.
                </Text>
              </View>
              <View className="mb-4">
                <Text className="text-gray-900 font-semibold">Is there a limit?</Text>
                <Text className="text-gray-500 text-sm mt-1">
                  No limit on Diaspora's side! Some partners may have their own limits, but you can refer to as many apps as you want.
                </Text>
              </View>
              <View>
                <Text className="text-gray-900 font-semibold">How do I withdraw?</Text>
                <Text className="text-gray-500 text-sm mt-1">
                  Once you have $20+ in confirmed earnings, you can withdraw to your bank, mobile money, or use it for transfers.
                </Text>
              </View>
            </View>
          </Animated.View>
        )}
      </ScrollView>
    </View>
  );
}
