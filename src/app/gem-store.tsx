import { useState } from 'react';
import { View, Text, ScrollView, Pressable, Alert } from 'react-native';
import { Stack, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Gem, Sparkles, Crown, Star, Zap, Gift, ChevronRight, History } from 'lucide-react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useStore, type GiftTransaction } from '@/lib/store';
import * as Haptics from 'expo-haptics';

interface GemPackage {
  id: string;
  gems: number;
  price: number;
  bonus?: number;
  popular?: boolean;
  bestValue?: boolean;
}

const GEM_PACKAGES: GemPackage[] = [
  { id: 'starter', gems: 100, price: 0.99 },
  { id: 'basic', gems: 500, price: 4.99, bonus: 50 },
  { id: 'popular', gems: 1200, price: 9.99, bonus: 200, popular: true },
  { id: 'pro', gems: 2500, price: 19.99, bonus: 500 },
  { id: 'mega', gems: 6500, price: 49.99, bonus: 1500, bestValue: true },
  { id: 'ultimate', gems: 15000, price: 99.99, bonus: 5000 },
];

export default function GemStoreScreen() {
  const currentUser = useStore((s) => s.currentUser);
  const gemBalance = useStore((s) => s.currentUser?.gemBalance ?? 500);
  const addGems = useStore((s) => s.addGems);
  const giftTransactions = useStore((s) => s.giftTransactions);
  const [showHistory, setShowHistory] = useState(false);
  const [purchasing, setPurchasing] = useState<string | null>(null);

  const handlePurchase = async (pkg: GemPackage) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setPurchasing(pkg.id);

    // Simulate purchase delay - in production this would go through RevenueCat
    setTimeout(() => {
      const totalGems = pkg.gems + (pkg.bonus ?? 0);
      addGems(totalGems);
      setPurchasing(null);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        '🎉 Purchase Complete!',
        `You received ${totalGems.toLocaleString()} gems!`,
        [{ text: 'Awesome!' }]
      );
    }, 1500);
  };

  const recentTransactions = giftTransactions.slice(0, 10);

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
                      {gemBalance.toLocaleString()}
                    </Text>
                  </View>
                </View>
                <View className="w-16 h-16 rounded-full bg-purple-500/20 items-center justify-center">
                  <Sparkles size={32} color="#A855F7" />
                </View>
              </View>

              <View className="flex-row mt-4 pt-4 border-t border-white/10">
                <View className="flex-1">
                  <Text className="text-gray-500 text-xs">Total Sent</Text>
                  <Text className="text-white font-bold">
                    {(currentUser?.totalGemsSent ?? 0).toLocaleString()}
                  </Text>
                </View>
                <View className="flex-1">
                  <Text className="text-gray-500 text-xs">Total Earned</Text>
                  <Text className="text-green-400 font-bold">
                    {(currentUser?.totalGemsEarned ?? 0).toLocaleString()}
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
            {recentTransactions.length === 0 ? (
              <View className="bg-white/5 rounded-2xl p-8 items-center">
                <Gift size={40} color="#6B7280" />
                <Text className="text-gray-400 mt-3 text-center">
                  No transactions yet. Send gifts in live rooms to get started!
                </Text>
              </View>
            ) : (
              recentTransactions.map((tx, index) => (
                <Animated.View
                  key={tx.id}
                  entering={FadeInDown.delay(index * 50)}
                  className="bg-white/5 rounded-xl p-4 mb-2 flex-row items-center"
                >
                  <View className={`w-10 h-10 rounded-full items-center justify-center ${
                    tx.type === 'sent' ? 'bg-red-500/20' : tx.type === 'received' ? 'bg-green-500/20' : 'bg-purple-500/20'
                  }`}>
                    {tx.type === 'sent' ? (
                      <Gift size={20} color="#EF4444" />
                    ) : tx.type === 'received' ? (
                      <Gift size={20} color="#22C55E" />
                    ) : (
                      <Gem size={20} color="#A855F7" />
                    )}
                  </View>
                  <View className="flex-1 ml-3">
                    <Text className="text-white font-medium">
                      {tx.type === 'sent' ? `Sent ${tx.giftName} to ${tx.recipientName}` :
                       tx.type === 'received' ? `Received ${tx.giftName} from ${tx.senderName}` :
                       `Purchased ${tx.giftValue} gems`}
                    </Text>
                    <Text className="text-gray-500 text-xs">
                      {tx.roomTitle ? `In: ${tx.roomTitle}` : new Date(tx.timestamp).toLocaleDateString()}
                    </Text>
                  </View>
                  <Text className={`font-bold ${tx.type === 'sent' ? 'text-red-400' : 'text-green-400'}`}>
                    {tx.type === 'sent' ? '-' : '+'}{tx.giftValue}
                  </Text>
                </Animated.View>
              ))
            )}
          </View>
        ) : (
          /* Gem Packages */
          <View className="px-4 mt-6">
            <Text className="text-white font-bold text-xl mb-4">Get More Gems</Text>
            <Text className="text-gray-400 text-sm mb-6">
              Use gems to send gifts to creators in live rooms and show your support!
            </Text>

            {GEM_PACKAGES.map((pkg, index) => (
              <Animated.View
                key={pkg.id}
                entering={FadeInDown.delay(200 + index * 100)}
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
                            {pkg.gems.toLocaleString()} Gems
                          </Text>
                          {pkg.bonus && (
                            <View className="bg-green-500/20 px-2 py-0.5 rounded-full ml-2">
                              <Text className="text-green-400 text-xs font-bold">
                                +{pkg.bonus.toLocaleString()} Bonus
                              </Text>
                            </View>
                          )}
                        </View>
                        {(pkg.popular || pkg.bestValue) && (
                          <Text className={`text-xs font-medium mt-0.5 ${
                            pkg.bestValue ? 'text-amber-400' : 'text-purple-400'
                          }`}>
                            {pkg.bestValue ? '🔥 Best Value' : '⭐ Most Popular'}
                          </Text>
                        )}
                      </View>

                      {purchasing === pkg.id ? (
                        <View className="bg-purple-500 px-5 py-3 rounded-xl">
                          <Text className="text-white font-bold">...</Text>
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
            ))}

            {/* Info Section */}
            <View className="bg-white/5 rounded-2xl p-4 mt-4 border border-white/10">
              <View className="flex-row items-center mb-3">
                <Zap size={20} color="#F59E0B" />
                <Text className="text-white font-medium ml-2">How Gems Work</Text>
              </View>
              <Text className="text-gray-400 text-sm leading-5">
                • Send gifts to support creators in live rooms{'\n'}
                • Hosts earn gems from gifts they receive{'\n'}
                • Popular gifts make you stand out{'\n'}
                • Gems never expire
              </Text>
            </View>
          </View>
        )}

        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
}
