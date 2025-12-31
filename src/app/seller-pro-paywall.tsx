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
  Store,
  Check,
  TrendingUp,
  CreditCard,
  ShieldCheck,
  Percent,
  BadgeDollarSign,
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
import { useStore } from '@/lib/store';

const FREE_SALES_LIMIT = 50;

const SELLER_PRO_FEATURES = [
  {
    icon: BadgeDollarSign,
    title: 'Unlimited In-App Sales',
    description: 'Accept payments through the app with no limits',
  },
  {
    icon: TrendingUp,
    title: 'Sales Analytics',
    description: 'Track your sales performance and trends',
  },
  {
    icon: ShieldCheck,
    title: 'Seller Verification',
    description: 'Get a verified seller badge on your listings',
  },
  {
    icon: CreditCard,
    title: 'Secure Payments',
    description: 'Safe and secure payment processing',
  },
  {
    icon: Percent,
    title: 'Lower Fees',
    description: 'Reduced transaction fees for Pro sellers',
  },
];

export default function SellerProPaywallScreen() {
  const [packages, setPackages] = useState<PurchasesPackage[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<PurchasesPackage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  const inAppSalesCount = useStore((s) => s.inAppSalesCount);
  const remainingFreeSales = Math.max(0, FREE_SALES_LIMIT - inAppSalesCount);

  useEffect(() => {
    loadOfferings();
  }, []);

  const loadOfferings = async () => {
    if (!isRevenueCatEnabled()) {
      setIsLoading(false);
      return;
    }

    const result = await getOfferings();
    if (result.ok) {
      // Get the seller_pro offering
      const sellerProOffering = result.data.all?.['seller_pro'];
      if (sellerProOffering) {
        const availablePackages = sellerProOffering.availablePackages;
        setPackages(availablePackages);
        // Select annual by default (better value)
        const annual = availablePackages.find(p => p.identifier === '$rc_annual');
        setSelectedPackage(annual || availablePackages[0] || null);
      }
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
        'Welcome to Seller Pro!',
        'You can now accept unlimited in-app payments. Happy selling!',
        [{ text: 'Start Selling', onPress: () => router.back() }]
      );
    } else if (result.reason === 'sdk_error') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }

    setIsPurchasing(false);
  };

  const handleRestore = async () => {
    setIsRestoring(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const result = await restorePurchases();

    if (result.ok) {
      const hasSellerPro = result.data.entitlements.active?.['seller_pro'];
      if (hasSellerPro) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert(
          'Subscription Restored',
          'Your Seller Pro subscription has been restored!',
          [{ text: 'Great!', onPress: () => router.back() }]
        );
      } else {
        Alert.alert('No Subscription Found', 'We couldn\'t find a Seller Pro subscription to restore.');
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
      <View className="flex-1 bg-forest-800 items-center justify-center">
        <ActivityIndicator size="large" color="#FFFFFF" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-forest-800">
      <LinearGradient
        colors={['#1B4D3E', '#153D31', '#0F2D24']}
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
              className="items-center px-6 pt-4 pb-6"
            >
              <View className="bg-terracotta-500/20 rounded-full p-4 mb-4">
                <Store size={48} color="#D4673A" />
              </View>
              <Text className="text-3xl font-bold text-white text-center">
                Seller Pro
              </Text>
              <Text className="text-white/70 text-center mt-2 text-base">
                Unlock unlimited in-app sales
              </Text>
            </Animated.View>

            {/* Sales Progress */}
            <Animated.View
              entering={FadeInUp.duration(400).delay(150)}
              className="mx-6 mb-6"
            >
              <View className="bg-white/10 rounded-2xl p-4">
                <View className="flex-row justify-between items-center mb-2">
                  <Text className="text-white/70 text-sm">Free Sales Used</Text>
                  <Text className="text-white font-bold">
                    {inAppSalesCount} / {FREE_SALES_LIMIT}
                  </Text>
                </View>
                <View className="h-3 bg-white/10 rounded-full overflow-hidden">
                  <View
                    className="h-full bg-terracotta-500 rounded-full"
                    style={{ width: `${Math.min(100, (inAppSalesCount / FREE_SALES_LIMIT) * 100)}%` }}
                  />
                </View>
                {remainingFreeSales > 0 ? (
                  <Text className="text-white/50 text-xs mt-2 text-center">
                    {remainingFreeSales} free in-app sales remaining
                  </Text>
                ) : (
                  <Text className="text-terracotta-400 text-xs mt-2 text-center font-medium">
                    Upgrade to continue accepting in-app payments
                  </Text>
                )}
              </View>
            </Animated.View>

            {/* Info Box */}
            <Animated.View
              entering={FadeInUp.duration(400).delay(200)}
              className="mx-6 mb-6"
            >
              <View className="bg-gold-500/10 rounded-2xl p-4 border border-gold-500/30">
                <Text className="text-gold-400 text-sm text-center">
                  Cash payments are always free! Seller Pro is only required for in-app payment processing after {FREE_SALES_LIMIT} sales.
                </Text>
              </View>
            </Animated.View>

            {/* Features */}
            <View className="px-6 mb-8">
              {SELLER_PRO_FEATURES.map((feature, index) => (
                <Animated.View
                  key={feature.title}
                  entering={FadeInUp.duration(400).delay(250 + index * 80)}
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
                    Seller Pro subscriptions are coming soon! Check back later.
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
                      Upgrade to Seller Pro
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
