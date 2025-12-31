import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  X,
  Crown,
  Check,
  Sparkles,
  Shield,
  Zap,
  Star,
  BadgeCheck,
} from 'lucide-react-native';
import Animated, { FadeIn, FadeInUp, FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import type { PurchasesPackage } from 'react-native-purchases';
import {
  getOfferings,
  purchasePackage,
  restorePurchases,
  isRevenueCatEnabled,
} from '@/lib/revenuecatClient';

const PREMIUM_FEATURES = [
  {
    icon: BadgeCheck,
    title: 'Verified Badge',
    description: 'Stand out with a verified profile badge',
  },
  {
    icon: Zap,
    title: 'Unlimited Posts',
    description: 'Post as much as you want without limits',
  },
  {
    icon: Shield,
    title: 'Priority Support',
    description: 'Get help faster with dedicated support',
  },
  {
    icon: Sparkles,
    title: 'Ad-Free Experience',
    description: 'Enjoy the app without any interruptions',
  },
  {
    icon: Star,
    title: 'Exclusive Communities',
    description: 'Access premium-only community features',
  },
];

export default function PaywallScreen() {
  const [packages, setPackages] = useState<PurchasesPackage[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<PurchasesPackage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  useEffect(() => {
    loadOfferings();
  }, []);

  const loadOfferings = async () => {
    if (!isRevenueCatEnabled()) {
      setIsLoading(false);
      return;
    }

    const result = await getOfferings();
    if (result.ok && result.data.current) {
      const availablePackages = result.data.current.availablePackages;
      setPackages(availablePackages);
      // Select annual by default (better value)
      const annual = availablePackages.find(p => p.identifier === '$rc_annual');
      setSelectedPackage(annual || availablePackages[0] || null);
    }
    setIsLoading(false);
  };

  const handlePurchase = async () => {
    if (!selectedPackage) return;

    setIsPurchasing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const result = await purchasePackage(selectedPackage);

    if (result.ok) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        'Welcome to Premium!',
        'Thank you for subscribing. Enjoy all the premium features!',
        [{ text: 'Awesome!', onPress: () => router.back() }]
      );
    } else if (result.reason === 'sdk_error') {
      // User cancelled or error occurred
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }

    setIsPurchasing(false);
  };

  const handleRestore = async () => {
    setIsRestoring(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const result = await restorePurchases();

    if (result.ok) {
      const hasActive = Object.keys(result.data.entitlements.active || {}).length > 0;
      if (hasActive) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert(
          'Purchases Restored',
          'Your premium subscription has been restored!',
          [{ text: 'Great!', onPress: () => router.back() }]
        );
      } else {
        Alert.alert('No Purchases Found', 'We couldn\'t find any previous purchases to restore.');
      }
    } else {
      Alert.alert('Restore Failed', 'Unable to restore purchases. Please try again.');
    }

    setIsRestoring(false);
  };

  const getPackagePrice = (pkg: PurchasesPackage) => {
    return pkg.product.priceString;
  };

  const getPackagePeriod = (pkg: PurchasesPackage) => {
    if (pkg.identifier === '$rc_annual') return '/year';
    if (pkg.identifier === '$rc_monthly') return '/month';
    return '';
  };

  const getMonthlySavings = () => {
    const monthly = packages.find(p => p.identifier === '$rc_monthly');
    const annual = packages.find(p => p.identifier === '$rc_annual');
    if (monthly && annual) {
      const monthlyPrice = monthly.product.price;
      const annualMonthly = annual.product.price / 12;
      const savings = Math.round((1 - annualMonthly / monthlyPrice) * 100);
      return savings;
    }
    return 33;
  };

  if (isLoading) {
    return (
      <View className="flex-1 bg-warmBrown items-center justify-center">
        <ActivityIndicator size="large" color="#FFFFFF" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-warmBrown">
      <LinearGradient
        colors={['#2D1F1A', '#1B4D3E', '#2D1F1A']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ flex: 1 }}
      >
        <SafeAreaView edges={['top', 'bottom']} className="flex-1">
          {/* Close Button */}
          <Animated.View entering={FadeIn.duration(300)} className="px-5 pt-2">
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.back();
              }}
              className="self-end bg-white/10 rounded-full p-2"
            >
              <X size={24} color="#FFFFFF" />
            </Pressable>
          </Animated.View>

          <ScrollView
            className="flex-1"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 20 }}
          >
            {/* Header */}
            <Animated.View
              entering={FadeInDown.duration(500).delay(100)}
              className="items-center px-6 pt-4 pb-8"
            >
              <View className="bg-gold-500/20 rounded-full p-4 mb-4">
                <Crown size={48} color="#C9A227" />
              </View>
              <Text className="text-3xl font-bold text-white text-center">
                Upgrade to Premium
              </Text>
              <Text className="text-white/70 text-center mt-2 text-base">
                Unlock all features and support the community
              </Text>
            </Animated.View>

            {/* Features */}
            <View className="px-6 mb-8">
              {PREMIUM_FEATURES.map((feature, index) => (
                <Animated.View
                  key={feature.title}
                  entering={FadeInUp.duration(400).delay(200 + index * 80)}
                  className="flex-row items-center bg-white/10 rounded-2xl p-4 mb-3"
                >
                  <View className="bg-terracotta-500/30 rounded-full p-2 mr-4">
                    <feature.icon size={24} color="#D4673A" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-white font-semibold text-base">
                      {feature.title}
                    </Text>
                    <Text className="text-white/60 text-sm">
                      {feature.description}
                    </Text>
                  </View>
                  <Check size={20} color="#4ADE80" />
                </Animated.View>
              ))}
            </View>

            {/* Package Selection */}
            {packages.length > 0 && (
              <Animated.View
                entering={FadeInUp.duration(400).delay(600)}
                className="px-6 mb-6"
              >
                <Text className="text-white font-semibold text-lg mb-3">
                  Choose Your Plan
                </Text>
                <View className="flex-row">
                  {packages.map((pkg) => {
                    const isSelected = selectedPackage?.identifier === pkg.identifier;
                    const isAnnual = pkg.identifier === '$rc_annual';

                    return (
                      <Pressable
                        key={pkg.identifier}
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          setSelectedPackage(pkg);
                        }}
                        className={`flex-1 rounded-2xl p-4 mx-1 border-2 ${
                          isSelected
                            ? 'bg-terracotta-500/20 border-terracotta-500'
                            : 'bg-white/5 border-white/20'
                        }`}
                      >
                        {isAnnual && (
                          <View className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gold-500 px-3 py-1 rounded-full">
                            <Text className="text-warmBrown text-xs font-bold">
                              SAVE {getMonthlySavings()}%
                            </Text>
                          </View>
                        )}
                        <Text className={`text-center font-semibold mb-1 ${
                          isSelected ? 'text-terracotta-400' : 'text-white/70'
                        }`}>
                          {isAnnual ? 'Annual' : 'Monthly'}
                        </Text>
                        <Text className={`text-center text-2xl font-bold ${
                          isSelected ? 'text-white' : 'text-white/90'
                        }`}>
                          {getPackagePrice(pkg)}
                        </Text>
                        <Text className={`text-center text-sm ${
                          isSelected ? 'text-white/70' : 'text-white/50'
                        }`}>
                          {getPackagePeriod(pkg)}
                        </Text>
                        {isAnnual && (
                          <Text className="text-center text-xs text-gold-400 mt-1">
                            ${(pkg.product.price / 12).toFixed(2)}/mo
                          </Text>
                        )}
                      </Pressable>
                    );
                  })}
                </View>
              </Animated.View>
            )}

            {/* Not configured message */}
            {!isRevenueCatEnabled() && (
              <Animated.View
                entering={FadeInUp.duration(400).delay(600)}
                className="px-6 mb-6"
              >
                <View className="bg-white/10 rounded-2xl p-4">
                  <Text className="text-white/70 text-center">
                    Subscriptions are coming soon! Check back later.
                  </Text>
                </View>
              </Animated.View>
            )}
          </ScrollView>

          {/* Bottom CTA */}
          {packages.length > 0 && (
            <Animated.View
              entering={FadeInUp.duration(400).delay(700)}
              className="px-6 pb-4"
            >
              <Pressable
                onPress={handlePurchase}
                disabled={isPurchasing || !selectedPackage}
              >
                <LinearGradient
                  colors={['#D4673A', '#B85430']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                    borderRadius: 16,
                    paddingVertical: 18,
                    opacity: isPurchasing ? 0.7 : 1,
                  }}
                >
                  {isPurchasing ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text className="text-white font-bold text-lg text-center">
                      Subscribe Now
                    </Text>
                  )}
                </LinearGradient>
              </Pressable>

              <Pressable
                onPress={handleRestore}
                disabled={isRestoring}
                className="mt-3 py-3"
              >
                {isRestoring ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text className="text-white/60 text-center text-sm">
                    Restore Purchases
                  </Text>
                )}
              </Pressable>

              <Text className="text-white/40 text-center text-xs mt-2 px-4">
                Subscriptions auto-renew. Cancel anytime in your device settings.
              </Text>
            </Animated.View>
          )}
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}
