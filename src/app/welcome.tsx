import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import {
  Users,
  ShoppingBag,
  Heart,
  MessageCircle,
  MapPin,
  GraduationCap,
  Briefcase,
  ArrowRight,
  Check,
  Sparkles,
} from 'lucide-react-native';
import Animated, { FadeIn, FadeInUp, FadeInRight, FadeOut } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useStore } from '@/lib/store';

const { width } = Dimensions.get('window');

// African culture images that will rotate
const CULTURE_IMAGES = [
  {
    uri: 'https://images.unsplash.com/photo-1523805009345-7448845a9e53?w=800&h=500&fit=crop',
    caption: 'Traditional African Art',
  },
  {
    uri: 'https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?w=800&h=500&fit=crop',
    caption: 'African Dance & Culture',
  },
  {
    uri: 'https://images.unsplash.com/photo-1489749798305-4fea3ae63d43?w=800&h=500&fit=crop',
    caption: 'African Fashion',
  },
  {
    uri: 'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?w=800&h=500&fit=crop',
    caption: 'African Wildlife & Nature',
  },
  {
    uri: 'https://images.unsplash.com/photo-1504197832061-98356e3dcdcf?w=800&h=500&fit=crop',
    caption: 'African Markets',
  },
  {
    uri: 'https://images.unsplash.com/photo-1590845947698-8924d7409b56?w=800&h=500&fit=crop',
    caption: 'African Community',
  },
];

const FEATURES = [
  {
    icon: GraduationCap,
    title: 'Student Groups',
    description: 'Join study groups, find scholarships, and connect with mentors',
    color: '#3A8F76',
  },
  {
    icon: Briefcase,
    title: 'Businesses',
    description: 'Discover and support African-owned businesses near you',
    color: '#B85430',
  },
  {
    icon: Sparkles,
    title: 'Interest Groups',
    description: 'Find people who share your hobbies and passions',
    color: '#C9A227',
  },
  {
    icon: Heart,
    title: 'Faith Centers',
    description: 'Connect with churches, mosques, and spiritual communities',
    color: '#D4673A',
  },
  {
    icon: MessageCircle,
    title: 'Direct Messaging',
    description: 'Chat privately with community members',
    color: '#1B4D3E',
  },
  {
    icon: Users,
    title: 'Community Feed',
    description: 'Stay updated with local African communities worldwide',
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
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Rotate through culture images every 4 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % CULTURE_IMAGES.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleGetStarted = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setHasSeenWelcome(true);
    router.push('/location-select');
  };

  const currentImage = CULTURE_IMAGES[currentImageIndex];

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
              {/* AfroConnect Logo */}
              <View className="items-center mb-6">
                <View className="bg-white/20 rounded-full p-3 mb-4">
                  <View className="bg-white rounded-full p-3">
                    {/* Africa continent shape represented with layered circles */}
                    <View className="w-12 h-12 items-center justify-center">
                      <View className="absolute">
                        <View className="w-10 h-12 rounded-t-full rounded-b-[40%] bg-forest-600" />
                      </View>
                      <View className="absolute top-1 left-1">
                        <View className="w-3 h-3 rounded-full bg-terracotta-500" />
                      </View>
                      <View className="absolute top-4 right-1">
                        <View className="w-2 h-2 rounded-full bg-gold-500" />
                      </View>
                      <View className="absolute bottom-2">
                        <View className="w-2.5 h-2.5 rounded-full bg-terracotta-400" />
                      </View>
                    </View>
                  </View>
                </View>
                <Text className="text-4xl font-bold text-white text-center">
                  AfroConnect
                </Text>
                <Text className="text-white/90 text-center mt-2 text-base italic">
                  Connecting Africans Globally, Building Communities
                </Text>
              </View>

              {/* Rotating Culture Image */}
              <View className="items-center">
                <View style={{ width: width - 48, height: 180, borderRadius: 16, overflow: 'hidden' }}>
                  <Animated.View
                    key={currentImageIndex}
                    entering={FadeIn.duration(800)}
                    exiting={FadeOut.duration(400)}
                    style={{ position: 'absolute', width: '100%', height: '100%' }}
                  >
                    <Image
                      source={{ uri: currentImage.uri }}
                      style={{ width: '100%', height: '100%' }}
                      contentFit="cover"
                    />
                    {/* Caption overlay */}
                    <LinearGradient
                      colors={['transparent', 'rgba(0,0,0,0.6)']}
                      style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        paddingVertical: 8,
                        paddingHorizontal: 12,
                      }}
                    >
                      <Text className="text-white text-sm font-medium">
                        {currentImage.caption}
                      </Text>
                    </LinearGradient>
                  </Animated.View>
                </View>
                {/* Image indicator dots */}
                <View className="flex-row mt-3">
                  {CULTURE_IMAGES.map((_, index) => (
                    <View
                      key={index}
                      className={`w-2 h-2 rounded-full mx-1 ${
                        index === currentImageIndex ? 'bg-white' : 'bg-white/40'
                      }`}
                    />
                  ))}
                </View>
              </View>

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
