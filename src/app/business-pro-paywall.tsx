import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ChevronLeft,
  Crown,
  Check,
  Calendar,
  BarChart3,
  Bell,
  Shield,
  Zap,
  Users,
  Clock,
  Sparkles,
  X,
} from 'lucide-react-native';
import Animated, { FadeIn, FadeInUp, FadeInDown, ZoomIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import type { PurchasesPackage } from 'react-native-purchases';
import { isRevenueCatEnabled, getOfferings, purchasePackage, restorePurchases } from '@/lib/revenuecatClient';

const FEATURES = [
  {
    icon: Calendar,
    title: 'Unlimited Bookings',
    description: 'Accept unlimited appointment bookings from customers',
  },
  {
    icon: BarChart3,
    title: 'Business Analytics',
    description: 'Track revenue, popular services, and booking trends',
  },
  {
    icon: Bell,
    title: 'Instant Notifications',
    description: 'Get notified immediately when customers book',
  },
  {
    icon: Shield,
    title: 'Verified Business Badge',
    description: 'Stand out with a verified badge on your listing',
  },
  {
    icon: Users,
    title: 'Customer Management',
    description: 'Keep track of repeat customers and preferences',
  },
  {
    icon: Clock,
    title: 'Flexible Scheduling',
    description: 'Block dates, set breaks, and manage availability',
  },
];

export default function BusinessProPaywallScreen() {
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
    if (result.ok) {
      // Try to get business_pro offering, fall back to current
      const businessProOffering = result.data.all?.['business_pro'];
      const offering = businessProOffering || result.data.current;

      if (offering) {
        const availablePackages = offering.availablePackages;
        setPackages(availablePackages);
        // Select annual by default
        const annual = availablePackages.find(p => p.identifier === '$rc_annual');
        setSelectedPackage(annual || availablePackages[0] || null);
      }
    }
    setIsLoading(false);
  };

  const handleSubscribe = async () => {
    if (!selectedPackage) return;

    setIsPurchasing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const result = await purchasePackage(selectedPackage);

    if (result.ok) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        'Welcome to Business Pro!',
        'Thank you for subscribing. Enjoy unlimited bookings and all premium features!',
        [{ text: 'Awesome!', onPress: () => router.back() }]
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
      const hasBusinessPro = result.data.entitlements.active?.['business_pro'];
      if (hasBusinessPro) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert(
          'Purchases Restored',
          'Your Business Pro subscription has been restored!',
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

  const getPackagePrice = (pkg: PurchasesPackage) => pkg.product.priceString;

  const getPackagePeriod = (pkg: PurchasesPackage) => {
    if (pkg.identifier === '$rc_annual') return '/year';
    if (pkg.identifier === '$rc_monthly') return '/month';
    return '';
  };

  const monthlyPackage = packages.find(p => p.identifier === '$rc_monthly');
  const annualPackage = packages.find(p => p.identifier === '$rc_annual');

  return (
    <View className="flex-1 bg-warmBrown">
      <LinearGradient
        colors={['#2D1F1A', '#1B4D3E', '#153D31']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ flex: 1 }}
      >
        <SafeAreaView edges={['top', 'bottom']} className="flex-1">
          {/* Header */}
          <Animated.View entering={FadeIn.duration(300)} className="px-5 pt-4">
            <View className="flex-row items-center justify-between">
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.back();
                }}
                className="bg-white/10 rounded-full p-2"
              >
                <X size={24} color="#FFFFFF" />
              </Pressable>
              <View className="bg-amber-500/20 rounded-full px-3 py-1 flex-row items-center">
                <Sparkles size={14} color="#F59E0B" />
                <Text className="text-amber-400 text-xs font-medium ml-1">Business Pro</Text>
              </View>
            </View>
          </Animated.View>

          <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
            {/* Hero */}
            <Animated.View entering={FadeInUp.duration(500).delay(100)} className="px-5 pt-6 items-center">
              <View className="bg-gradient-to-br from-amber-400 to-amber-600 rounded-full p-5 mb-4">
                <Crown size={48} color="#FFFFFF" />
              </View>
              <Text className="text-white text-3xl font-bold text-center">
                Grow Your Business
              </Text>
              <Text className="text-white/70 text-center mt-2 text-lg">
                Unlock powerful booking tools and accept unlimited appointments
              </Text>
            </Animated.View>

            {/* Free Tier Info */}
            <Animated.View entering={FadeInUp.duration(500).delay(200)} className="px-5 mt-6">
              <View className="bg-white/10 rounded-2xl p-4 border border-white/20">
                <View className="flex-row items-center">
                  <View className="bg-emerald-500/20 rounded-full p-2">
                    <Check size={20} color="#10B981" />
                  </View>
                  <View className="ml-3">
                    <Text className="text-white font-semibold">First 25 Bookings FREE</Text>
                    <Text className="text-white/60 text-sm">
                      Try our booking system at no cost
                    </Text>
                  </View>
                </View>
              </View>
            </Animated.View>

            {/* Features */}
            <Animated.View entering={FadeInUp.duration(500).delay(300)} className="px-5 mt-6">
              <Text className="text-white/80 text-sm font-medium mb-3">WHAT YOU GET</Text>
              <View className="bg-white/5 rounded-2xl overflow-hidden">
                {FEATURES.map((feature, index) => (
                  <View
                    key={feature.title}
                    className={`flex-row items-center p-4 ${
                      index < FEATURES.length - 1 ? 'border-b border-white/10' : ''
                    }`}
                  >
                    <View className="bg-amber-500/20 rounded-full p-2">
                      <feature.icon size={20} color="#F59E0B" />
                    </View>
                    <View className="ml-3 flex-1">
                      <Text className="text-white font-medium">{feature.title}</Text>
                      <Text className="text-white/50 text-sm">{feature.description}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </Animated.View>

            {/* Pricing Plans */}
            <Animated.View entering={FadeInUp.duration(500).delay(400)} className="px-5 mt-6">
              <Text className="text-white/80 text-sm font-medium mb-3">CHOOSE YOUR PLAN</Text>

              {isLoading ? (
                <View className="items-center py-8">
                  <ActivityIndicator color="#F59E0B" size="large" />
                  <Text className="text-white/60 mt-2">Loading plans...</Text>
                </View>
              ) : packages.length === 0 ? (
                <View className="bg-white/10 rounded-2xl p-4 border border-white/20">
                  <Text className="text-white/80 text-center">
                    Subscription plans are being configured. Please try again later.
                  </Text>
                </View>
              ) : (
                <>
                  {/* Annual Plan */}
                  {annualPackage && (
                    <Pressable
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setSelectedPackage(annualPackage);
                      }}
                      className={`rounded-2xl p-4 mb-3 border-2 ${
                        selectedPackage?.identifier === '$rc_annual'
                          ? 'bg-amber-500/20 border-amber-500'
                          : 'bg-white/5 border-white/10'
                      }`}
                    >
                      <View className="flex-row items-center justify-between">
                        <View>
                          <View className="flex-row items-center">
                            <Text className="text-white font-bold text-lg">Annual</Text>
                            <View className="bg-emerald-500 rounded-full px-2 py-0.5 ml-2">
                              <Text className="text-white text-xs font-bold">BEST VALUE</Text>
                            </View>
                          </View>
                          <Text className="text-white/60 text-sm mt-0.5">
                            Billed annually
                          </Text>
                        </View>
                        <View className="items-end">
                          <Text className="text-white font-bold text-2xl">{getPackagePrice(annualPackage)}</Text>
                          <Text className="text-white/50 text-xs">/year</Text>
                        </View>
                      </View>
                      {selectedPackage?.identifier === '$rc_annual' && (
                        <View className="absolute top-4 right-4">
                          <View className="bg-amber-500 rounded-full p-1">
                            <Check size={14} color="#FFFFFF" />
                          </View>
                        </View>
                      )}
                    </Pressable>
                  )}

                  {/* Monthly Plan */}
                  {monthlyPackage && (
                    <Pressable
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setSelectedPackage(monthlyPackage);
                      }}
                      className={`rounded-2xl p-4 border-2 ${
                        selectedPackage?.identifier === '$rc_monthly'
                          ? 'bg-amber-500/20 border-amber-500'
                          : 'bg-white/5 border-white/10'
                      }`}
                    >
                      <View className="flex-row items-center justify-between">
                        <View>
                          <Text className="text-white font-bold text-lg">Monthly</Text>
                          <Text className="text-white/60 text-sm mt-0.5">
                            Flexible, cancel anytime
                          </Text>
                        </View>
                        <View className="items-end">
                          <Text className="text-white font-bold text-2xl">{getPackagePrice(monthlyPackage)}</Text>
                          <Text className="text-white/50 text-xs">/month</Text>
                        </View>
                      </View>
                      {selectedPackage?.identifier === '$rc_monthly' && (
                        <View className="absolute top-4 right-4">
                          <View className="bg-amber-500 rounded-full p-1">
                            <Check size={14} color="#FFFFFF" />
                          </View>
                        </View>
                      )}
                    </Pressable>
                  )}
                </>
              )}
            </Animated.View>

            {/* Testimonial */}
            <Animated.View entering={FadeInUp.duration(500).delay(500)} className="px-5 mt-6 mb-6">
              <View className="bg-white/5 rounded-2xl p-4 border border-white/10">
                <Text className="text-white/80 italic">
                  "Business Pro helped me manage my salon bookings effortlessly. I've seen a 40% increase in appointments!"
                </Text>
                <View className="flex-row items-center mt-3">
                  <View className="w-10 h-10 rounded-full bg-amber-500/30 items-center justify-center">
                    <Text className="text-amber-400 font-bold">AK</Text>
                  </View>
                  <View className="ml-3">
                    <Text className="text-white font-medium">Amina K.</Text>
                    <Text className="text-white/50 text-sm">African Braids & Beauty</Text>
                  </View>
                </View>
              </View>
            </Animated.View>
          </ScrollView>

          {/* Subscribe Button */}
          <Animated.View entering={FadeInDown.duration(500).delay(600)} className="px-5 pb-4">
            <Pressable
              onPress={handleSubscribe}
              disabled={isPurchasing || !selectedPackage}
              className="overflow-hidden rounded-2xl"
            >
              <LinearGradient
                colors={selectedPackage ? ['#F59E0B', '#D97706'] : ['#6B7280', '#4B5563']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{ paddingVertical: 16, paddingHorizontal: 24, alignItems: 'center' }}
              >
                {isPurchasing ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <View className="flex-row items-center">
                    <Crown size={20} color="#FFFFFF" />
                    <Text className="text-white font-bold text-lg ml-2">
                      {selectedPackage ? `Subscribe - ${getPackagePrice(selectedPackage)}${getPackagePeriod(selectedPackage)}` : 'Loading...'}
                    </Text>
                  </View>
                )}
              </LinearGradient>
            </Pressable>

            {/* Restore Purchases */}
            <Pressable
              onPress={handleRestore}
              disabled={isRestoring}
              className="mt-3 py-2"
            >
              <Text className="text-white/60 text-sm text-center">
                {isRestoring ? 'Restoring...' : 'Restore Purchases'}
              </Text>
            </Pressable>

            <Text className="text-white/40 text-xs text-center mt-2">
              Cancel anytime. Terms apply.
            </Text>
          </Animated.View>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}
