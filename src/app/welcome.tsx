import React from 'react';
import { View, Text, ScrollView, Pressable, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import {
  Globe,
  Users,
  ShoppingBag,
  Heart,
  MessageCircle,
  MapPin,
  GraduationCap,
  Briefcase,
  ArrowRight,
  Check,
} from 'lucide-react-native';
import Animated, { FadeIn, FadeInUp, FadeInRight } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useStore } from '@/lib/store';

const { width } = Dimensions.get('window');

const FEATURES = [
  {
    icon: Users,
    title: 'Community Feed',
    description: 'Connect with Africans in your local area and globally',
    color: '#D4673A',
  },
  {
    icon: ShoppingBag,
    title: 'Marketplace',
    description: 'Buy and sell African products, crafts, and services',
    color: '#1B4D3E',
  },
  {
    icon: Heart,
    title: 'Faith & Community',
    description: 'Find churches, mosques, and faith events near you',
    color: '#C9A227',
  },
  {
    icon: GraduationCap,
    title: 'Student Hub',
    description: 'Scholarships, study groups, and mentorship',
    color: '#3A8F76',
  },
  {
    icon: Briefcase,
    title: 'Business Directory',
    description: 'Discover and support African-owned businesses',
    color: '#B85430',
  },
  {
    icon: MessageCircle,
    title: 'Direct Messaging',
    description: 'Connect privately with community members',
    color: '#6B7280',
  },
];

const HIGHLIGHTS = [
  'Location-based communities worldwide',
  'Support African entrepreneurs',
  'Find cultural events and gatherings',
  'Connect with your diaspora',
  'Free to browse as a guest',
];

export default function WelcomeScreen() {
  const setHasSeenWelcome = useStore((s) => s.setHasSeenWelcome);

  const handleGetStarted = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setHasSeenWelcome(true);
    router.push('/location-select');
  };

  return (
    <View className="flex-1 bg-cream">
      <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
        {/* Hero Section */}
        <LinearGradient
          colors={['#D4673A', '#B85430', '#974327']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ paddingBottom: 40 }}
        >
          <SafeAreaView edges={['top']}>
            <Animated.View
              entering={FadeIn.duration(600)}
              className="px-6 pt-8 pb-6"
            >
              {/* Logo */}
              <View className="items-center mb-6">
                <View className="bg-white/20 rounded-full p-4 mb-4">
                  <Globe size={48} color="#FFFFFF" />
                </View>
                <Text className="text-4xl font-bold text-white text-center">
                  AfroConnect
                </Text>
                <Text className="text-white/90 text-center mt-2 text-base italic">
                  Connecting Africans Globally, Building Communities
                </Text>
              </View>

              {/* Hero Image */}
              <Animated.View
                entering={FadeInUp.duration(600).delay(200)}
                className="items-center"
              >
                <Image
                  source={{ uri: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&h=500&fit=crop' }}
                  style={{ width: width - 48, height: 180, borderRadius: 16 }}
                  contentFit="cover"
                />
              </Animated.View>

              {/* Tagline */}
              <Animated.View
                entering={FadeInUp.duration(600).delay(300)}
                className="mt-6"
              >
                <Text className="text-white text-center text-lg leading-7">
                  The first social platform designed specifically for{' '}
                  <Text className="font-bold">Africans and the African diaspora</Text> to connect,
                  support, and grow together.
                </Text>
              </Animated.View>
            </Animated.View>
          </SafeAreaView>
        </LinearGradient>

        {/* What is AfroConnect */}
        <View className="px-6 py-8">
          <Animated.View entering={FadeInUp.duration(500).delay(400)}>
            <Text className="text-2xl font-bold text-warmBrown mb-4">
              What is AfroConnect?
            </Text>
            <Text className="text-gray-600 text-base leading-7">
              AfroConnect is a community-driven platform that helps you find your people wherever you are in the world. Whether you're looking for local African communities, businesses, events, or just want to connect with others who share your culture and values - AfroConnect makes it easy.
            </Text>
          </Animated.View>

          {/* Highlights */}
          <Animated.View
            entering={FadeInUp.duration(500).delay(500)}
            className="mt-6"
          >
            {HIGHLIGHTS.map((highlight, index) => (
              <Animated.View
                key={highlight}
                entering={FadeInRight.duration(400).delay(550 + index * 50)}
                className="flex-row items-center mb-3"
              >
                <View className="bg-forest-100 rounded-full p-1 mr-3">
                  <Check size={16} color="#1B4D3E" />
                </View>
                <Text className="text-warmBrown text-base">{highlight}</Text>
              </Animated.View>
            ))}
          </Animated.View>
        </View>

        {/* Features */}
        <View className="px-6 pb-8">
          <Animated.View entering={FadeInUp.duration(500).delay(600)}>
            <Text className="text-2xl font-bold text-warmBrown mb-4">
              Everything You Need
            </Text>
          </Animated.View>

          <View className="flex-row flex-wrap justify-between">
            {FEATURES.map((feature, index) => (
              <Animated.View
                key={feature.title}
                entering={FadeInUp.duration(400).delay(650 + index * 50)}
                style={{ width: (width - 60) / 2 }}
                className="mb-4"
              >
                <View className="bg-white rounded-2xl p-4 shadow-sm h-full">
                  <View
                    className="w-12 h-12 rounded-full items-center justify-center mb-3"
                    style={{ backgroundColor: `${feature.color}15` }}
                  >
                    <feature.icon size={24} color={feature.color} />
                  </View>
                  <Text className="text-warmBrown font-semibold mb-1">
                    {feature.title}
                  </Text>
                  <Text className="text-gray-500 text-sm">
                    {feature.description}
                  </Text>
                </View>
              </Animated.View>
            ))}
          </View>
        </View>

        {/* How It Works */}
        <View className="px-6 pb-8">
          <Animated.View entering={FadeInUp.duration(500).delay(800)}>
            <Text className="text-2xl font-bold text-warmBrown mb-4">
              How It Works
            </Text>

            <View className="bg-white rounded-2xl p-5 shadow-sm">
              {[
                { step: '1', title: 'Select Your Location', desc: 'Choose your country, state, and city' },
                { step: '2', title: 'Browse Your Community', desc: 'See what\'s happening locally' },
                { step: '3', title: 'Create an Account', desc: 'Sign up to post, comment, and connect' },
              ].map((item, index) => (
                <View
                  key={item.step}
                  className={`flex-row items-center ${index < 2 ? 'mb-4 pb-4 border-b border-gray-100' : ''}`}
                >
                  <View className="w-10 h-10 rounded-full bg-terracotta-500 items-center justify-center mr-4">
                    <Text className="text-white font-bold">{item.step}</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-warmBrown font-semibold">{item.title}</Text>
                    <Text className="text-gray-500 text-sm">{item.desc}</Text>
                  </View>
                </View>
              ))}
            </View>
          </Animated.View>
        </View>

        {/* Guest Access Note */}
        <Animated.View
          entering={FadeInUp.duration(500).delay(900)}
          className="px-6 pb-8"
        >
          <LinearGradient
            colors={['#1B4D3E', '#153D31']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ borderRadius: 16, padding: 20 }}
          >
            <View className="flex-row items-center">
              <View className="bg-white/20 rounded-full p-3 mr-4">
                <MapPin size={24} color="#FFFFFF" />
              </View>
              <View className="flex-1">
                <Text className="text-white font-bold text-base">
                  Browse as a Guest
                </Text>
                <Text className="text-white/80 text-sm mt-1">
                  Explore communities before signing up. Create an account when you're ready to post and connect!
                </Text>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Bottom spacing for button */}
        <View className="h-32" />
      </ScrollView>

      {/* Fixed Bottom Button */}
      <View className="absolute bottom-0 left-0 right-0 bg-cream border-t border-gray-100">
        <SafeAreaView edges={['bottom']}>
          <View className="px-6 pt-4 pb-2">
            <Pressable onPress={handleGetStarted}>
              <LinearGradient
                colors={['#D4673A', '#B85430']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  borderRadius: 16,
                  paddingVertical: 18,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text className="text-white font-bold text-lg">Get Started</Text>
                <ArrowRight size={20} color="#FFFFFF" style={{ marginLeft: 8 }} />
              </LinearGradient>
            </Pressable>
          </View>
        </SafeAreaView>
      </View>
    </View>
  );
}
