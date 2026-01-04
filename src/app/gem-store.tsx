import { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, Alert, ActivityIndicator } from 'react-native';
import { Stack, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Gem, Sparkles, Crown, Star, Zap, Gift, History, ShoppingBag } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useStore } from '@/lib/store';
import { getWalletStats, getTransactionHistory } from '@/lib/giftService';
import {
  GEM_PACKAGES,
  getGemPackagesFromRC,
  purchaseGems,
  gemsToPrice
} from '@/lib/marketplacePayments';
import { isRevenueCatEnabled } from '@/lib/revenuecatClient';
import { DbGiftTransaction } from '@/lib/supabase';
import * as Haptics from 'expo-haptics';
import type { PurchasesPackage } from 'react-native-purchases';

export default function GemStoreScreen() {
  const currentUser = useStore((s) => s.currentUser);
  const [gemBalance, setGemBalance] = useState(500);
  const [totalSent, setTotalSent] = useState(0);
  const [totalEarned, setTotalEarned] = useState(0);
  const [transactions, setTransactions] = useState<DbGiftTransaction[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [rcPackages, setRcPackages] = useState<PurchasesPackage[]>([]);
  const [rcEnabled, setRcEnabled] = useState(false);

  // Load wallet data and RevenueCat packages
  useEffect(() => {
    loadData();
  }, [currentUser?.id]);

  const loadData = async () => {
    if (!currentUser?.id) return;

    setIsLoading(true);

    // Load wallet stats and transactions
    const [stats, history] = await Promise.all([
      getWalletStats(currentUser.id),
      getTransactionHistory(currentUser.id),
    ]);

    if (stats) {
      setGemBalance(stats.balance);
      setTotalSent(stats.totalSent);
      setTotalEarned(stats.totalEarned);
    }

    setTransactions(history);

    // Check RevenueCat and load packages
    const enabled = isRevenueCatEnabled();
    setRcEnabled(enabled);

    if (enabled) {
      const packages = await getGemPackagesFromRC();
      setRcPackages(packages);
    }

    setIsLoading(false);
  };

  const handlePurchase = async (gemPackage: typeof GEM_PACKAGES[0]) => {
    if (!currentUser?.id) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setPurchasing(gemPackage.id);

    // Find matching RevenueCat package
    const rcPackage = rcPackages.find(p => p.identifier === gemPackage.identifier);

    if (rcPackage && rcEnabled) {
      // Real purchase through RevenueCat
      const result = await purchaseGems(currentUser.id, rcPackage);

      setPurchasing(null);

      if (result.success) {
        setGemBalance(prev => prev + (result.gemsAdded ?? 0));
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert(
          'Purchase Complete!',
          `You received ${result.gemsAdded?.toLocaleString()} gems!`,
          [{ text: 'Awesome!' }]
        );
      } else {
        if (result.error !== 'Purchase cancelled') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          Alert.alert('Purchase Failed', result.error ?? 'Something went wrong');
        }
      }
    } else {
      // Fallback: simulate purchase for testing
      const totalGems = gemPackage.gems + gemPackage.bonusGems;

      // Import and use addGems from giftService
      const { addGems } = await import('@/lib/giftService');
      const result = await addGems(currentUser.id, totalGems);

      setPurchasing(null);

      if (result.success) {
        setGemBalance(result.newBalance ?? gemBalance + totalGems);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert(
          'Purchase Complete!',
          `You received ${totalGems.toLocaleString()} gems!`,
          [{ text: 'Awesome!' }]
        );
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert('Error', result.error ?? 'Failed to add gems');
      }
    }
  };

  const formatTransaction = (tx: DbGiftTransaction) => {
    const isSent = tx.sender_id === currentUser?.id;
    return {
      id: tx.id,
      type: isSent ? 'sent' : 'received',
      giftName: tx.gift_name,
      giftValue: tx.gift_value,
      otherParty: isSent ? tx.recipient_name : tx.sender_name,
      roomTitle: tx.room_title,
      timestamp: tx.created_at,
    };
  };

  return (
    <SafeAreaView className="flex-1 bg-[#0A0A0F]" edges={['top']}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Gem Store',
          headerStyle: { backgroundColor: '#0A0A0F' },
          headerTintColor: '#FFFFFF',
          headerTitleStyle: { fontWeight: 'bold' },
          headerRight: () => (
            <Pressable
              onPress={() => setShowHistory(!showHistory)}
              className="mr-2 p-2"
            >
              <History size={22} color={showHistory ? '#A855F7' : '#9CA3AF'} />
            </Pressable>
          ),
        }}
      />

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Balance Card */}
        <Animated.View entering={FadeInDown.delay(100)} className="px-4 mt-4">
          <LinearGradient
            colors={['#8B5CF6', '#EC4899']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ borderRadius: 24, padding: 1 }}
          >
            <View className="bg-[#12121A] rounded-3xl p-6">
              <View className="flex-row items-center justify-between">
                <View>
                  <Text className="text-gray-400 text-sm">Your Balance</Text>
                  <View className="flex-row items-center mt-1">
                    <Gem size={28} color="#A855F7" />
                    <Text className="text-white text-4xl font-bold ml-2">
                      {isLoading ? '...' : gemBalance.toLocaleString()}
                    </Text>
                  </View>
                  <Text className="text-gray-500 text-xs mt-1">
                    ≈ {gemsToPrice(gemBalance)}
                  </Text>
                </View>
                <View className="w-16 h-16 rounded-full bg-purple-500/20 items-center justify-center">
                  <Sparkles size={32} color="#A855F7" />
                </View>
              </View>

              <View className="flex-row mt-4 pt-4 border-t border-white/10">
                <View className="flex-1">
                  <Text className="text-gray-500 text-xs">Total Sent</Text>
                  <Text className="text-white font-bold">
                    {isLoading ? '...' : totalSent.toLocaleString()}
                  </Text>
                </View>
                <View className="flex-1">
                  <Text className="text-gray-500 text-xs">Total Earned</Text>
                  <Text className="text-green-400 font-bold">
                    {isLoading ? '...' : totalEarned.toLocaleString()}
                  </Text>
                </View>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        {showHistory ? (
          /* Transaction History */
          <View className="px-4 mt-6">
            <Text className="text-white font-bold text-xl mb-4">Transaction History</Text>
            {transactions.length === 0 ? (
              <View className="bg-white/5 rounded-2xl p-8 items-center">
                <Gift size={40} color="#6B7280" />
                <Text className="text-gray-400 mt-3 text-center">
                  No transactions yet. Send gifts in live rooms or buy items in the marketplace!
                </Text>
              </View>
            ) : (
              transactions.slice(0, 20).map((tx, index) => {
                const formatted = formatTransaction(tx);
                return (
                  <Animated.View
                    key={tx.id}
                    entering={FadeInDown.delay(index * 50)}
                    className="bg-white/5 rounded-xl p-4 mb-2 flex-row items-center"
                  >
                    <View className={`w-10 h-10 rounded-full items-center justify-center ${
                      formatted.type === 'sent' ? 'bg-red-500/20' : 'bg-green-500/20'
                    }`}>
                      <Gift size={20} color={formatted.type === 'sent' ? '#EF4444' : '#22C55E'} />
                    </View>
                    <View className="flex-1 ml-3">
                      <Text className="text-white font-medium">
                        {formatted.type === 'sent'
                          ? `Sent ${formatted.giftName} to ${formatted.otherParty}`
                          : `Received ${formatted.giftName} from ${formatted.otherParty}`}
                      </Text>
                      <Text className="text-gray-500 text-xs">
                        {formatted.roomTitle
                          ? `In: ${formatted.roomTitle}`
                          : new Date(formatted.timestamp).toLocaleDateString()}
                      </Text>
                    </View>
                    <Text className={`font-bold ${formatted.type === 'sent' ? 'text-red-400' : 'text-green-400'}`}>
                      {formatted.type === 'sent' ? '-' : '+'}{formatted.giftValue}
                    </Text>
                  </Animated.View>
                );
              })
            )}
          </View>
        ) : (
          /* Gem Packages */
          <View className="px-4 mt-6">
            <Text className="text-white font-bold text-xl mb-2">Get More Gems</Text>
            <Text className="text-gray-400 text-sm mb-6">
              Use gems to send gifts, buy marketplace items, and pay for services!
            </Text>

            {GEM_PACKAGES.map((pkg, index) => {
              const totalGems = pkg.gems + pkg.bonusGems;
              return (
                <Animated.View
                  key={pkg.id}
                  entering={FadeInDown.delay(200 + index * 80)}
                >
                  <Pressable
                    onPress={() => handlePurchase(pkg)}
                    disabled={purchasing !== null}
                    className="mb-3"
                  >
                    <View className={`rounded-2xl ${pkg.popular || pkg.bestValue ? 'p-[2px]' : ''}`}
                      style={pkg.popular || pkg.bestValue ? {
                        backgroundColor: pkg.bestValue ? '#F59E0B' : '#8B5CF6',
                      } : undefined}
                    >
                      <View className={`bg-[#12121A] rounded-2xl p-4 flex-row items-center ${
                        pkg.popular || pkg.bestValue ? 'border-0' : 'border border-white/10'
                      }`}>
                        <View className={`w-14 h-14 rounded-2xl items-center justify-center ${
                          pkg.bestValue ? 'bg-amber-500/20' : pkg.popular ? 'bg-purple-500/20' : 'bg-white/10'
                        }`}>
                          {pkg.bestValue ? (
                            <Crown size={28} color="#F59E0B" />
                          ) : pkg.popular ? (
                            <Star size={28} color="#A855F7" />
                          ) : (
                            <Gem size={28} color="#9CA3AF" />
                          )}
                        </View>

                        <View className="flex-1 ml-4">
                          <View className="flex-row items-center">
                            <Text className="text-white font-bold text-lg">
                              {totalGems.toLocaleString()} Gems
                            </Text>
                            {pkg.bonusGems > 0 && (
                              <View className="bg-green-500/20 px-2 py-0.5 rounded-full ml-2">
                                <Text className="text-green-400 text-xs font-bold">
                                  +{pkg.bonusGems.toLocaleString()} Bonus
                                </Text>
                              </View>
                            )}
                          </View>
                          {(pkg.popular || pkg.bestValue) && (
                            <Text className={`text-xs font-medium mt-0.5 ${
                              pkg.bestValue ? 'text-amber-400' : 'text-purple-400'
                            }`}>
                              {pkg.bestValue ? 'Best Value' : 'Most Popular'}
                            </Text>
                          )}
                        </View>

                        {purchasing === pkg.id ? (
                          <View className="bg-purple-500 px-5 py-3 rounded-xl">
                            <ActivityIndicator size="small" color="white" />
                          </View>
                        ) : (
                          <LinearGradient
                            colors={pkg.bestValue ? ['#F59E0B', '#EF4444'] : ['#8B5CF6', '#EC4899']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={{ paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12 }}
                          >
                            <Text className="text-white font-bold">${pkg.price}</Text>
                          </LinearGradient>
                        )}
                      </View>
                    </View>
                  </Pressable>
                </Animated.View>
              );
            })}

            {/* What can you do with gems */}
            <View className="bg-white/5 rounded-2xl p-4 mt-4 border border-white/10">
              <View className="flex-row items-center mb-3">
                <Zap size={20} color="#F59E0B" />
                <Text className="text-white font-medium ml-2">What You Can Do With Gems</Text>
              </View>
              <View className="space-y-2">
                <View className="flex-row items-center">
                  <Gift size={16} color="#A855F7" />
                  <Text className="text-gray-400 text-sm ml-2">Send gifts to creators in live rooms</Text>
                </View>
                <View className="flex-row items-center mt-2">
                  <ShoppingBag size={16} color="#22C55E" />
                  <Text className="text-gray-400 text-sm ml-2">Buy items from the marketplace</Text>
                </View>
                <View className="flex-row items-center mt-2">
                  <Star size={16} color="#F59E0B" />
                  <Text className="text-gray-400 text-sm ml-2">Pay for business services</Text>
                </View>
              </View>
            </View>

            {/* Seller info */}
            <View className="bg-green-500/10 rounded-2xl p-4 mt-4 border border-green-500/20">
              <Text className="text-green-400 font-medium">Are you a seller?</Text>
              <Text className="text-gray-400 text-sm mt-1">
                Gems you earn from sales can be cashed out or used in the app. You keep 90% of each sale!
              </Text>
            </View>
          </View>
        )}

        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
}
