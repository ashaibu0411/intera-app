import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, Pressable, Dimensions, Animated as RNAnimated, ImageBackground } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';

// Logo image
const LOGO_IMAGE = { uri: '/image-1768608072.png' };
import {
  Users,
  ShoppingBag,
  Heart,
  MessageCircle,
  MapPin,
  GraduationCap,
  Briefcase,
  ArrowRight,
  Shield,
  Vote,
  PiggyBank,
  Mic,
  BookOpen,
  AlertTriangle,
  HeartHandshake,
  Trophy,
  Calendar,
  DollarSign,
  FileText,
  Utensils,
  Film,
  Clapperboard,
  Radio,
  Gem,
  Sparkles,
  Globe,
  Play,
  ChevronRight,
  Star,
} from 'lucide-react-native';
import Animated, { FadeIn, FadeInUp, FadeInRight, FadeInDown, useSharedValue, useAnimatedStyle, withRepeat, withTiming, withSequence, withDelay } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useStore } from '@/lib/store';
import { LucideIcon } from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

// Feature type
type Feature = {
  icon: LucideIcon;
  label: string;
  desc: string;
  colors: readonly [string, string];
};

type FeatureCategory = {
  title: string;
  features: Feature[];
};

// All the amazing features in the app
const FEATURE_CATEGORIES: FeatureCategory[] = [
  {
    title: 'Connect & Communicate',
    features: [
      { icon: Users, label: 'Community Feed', desc: 'Connect with expats worldwide', colors: ['#1B4D3E', '#153D31'] as const },
      { icon: MessageCircle, label: 'Messages', desc: 'Private conversations', colors: ['#6366F1', '#4F46E5'] as const },
      { icon: Mic, label: 'Voice Rooms', desc: 'Live audio discussions', colors: ['#EC4899', '#DB2777'] as const },
      { icon: Radio, label: 'Live Radio', desc: 'Community broadcasts', colors: ['#7C3AED', '#6D28D9'] as const },
    ],
  },
  {
    title: 'Business & Finance',
    features: [
      { icon: ShoppingBag, label: 'Marketplace', desc: 'Buy & sell locally', colors: ['#D4673A', '#C05A2E'] as const },
      { icon: Briefcase, label: 'Jobs Board', desc: 'Find opportunities', colors: ['#059669', '#047857'] as const },
      { icon: DollarSign, label: 'Send Money', desc: 'Easy remittance', colors: ['#10B981', '#059669'] as const },
      { icon: PiggyBank, label: 'Susu Circles', desc: 'Savings groups', colors: ['#F59E0B', '#D97706'] as const },
    ],
  },
  {
    title: 'Culture & Heritage',
    features: [
      { icon: BookOpen, label: 'Heritage Hub', desc: 'Preserve your roots', colors: ['#D4673A', '#B85430'] as const },
      { icon: Utensils, label: 'African Food', desc: 'Recipes & restaurants', colors: ['#DC2626', '#B91C1C'] as const },
      { icon: Heart, label: 'Faith Community', desc: 'Spiritual connections', colors: ['#8B5CF6', '#7C3AED'] as const },
      { icon: Calendar, label: 'Events', desc: 'Cultural gatherings', colors: ['#6366F1', '#4F46E5'] as const },
    ],
  },
  {
    title: 'Content & Entertainment',
    features: [
      { icon: Film, label: 'Stories', desc: '24-hour moments', colors: ['#EC4899', '#F97316'] as const },
      { icon: Clapperboard, label: 'Clips', desc: 'Short videos', colors: ['#3B82F6', '#8B5CF6'] as const },
      { icon: Trophy, label: 'Creator Battles', desc: 'Compete & win', colors: ['#7C3AED', '#DB2777'] as const },
      { icon: Gem, label: 'Gem Store', desc: 'Virtual gifts', colors: ['#F59E0B', '#EA580C'] as const },
    ],
  },
  {
    title: 'Support & Safety',
    features: [
      { icon: Shield, label: 'Trust Score', desc: 'Verified members', colors: ['#10B981', '#059669'] as const },
      { icon: AlertTriangle, label: 'Safety Network', desc: 'Emergency help', colors: ['#EF4444', '#DC2626'] as const },
      { icon: HeartHandshake, label: 'Support Circles', desc: 'Community care', colors: ['#14B8A6', '#0D9488'] as const },
      { icon: FileText, label: 'Visa Help', desc: 'Immigration support', colors: ['#0284C7', '#0369A1'] as const },
    ],
  },
  {
    title: 'Learning & Growth',
    features: [
      { icon: GraduationCap, label: 'Student Hub', desc: 'Study groups & mentors', colors: ['#C9A227', '#A6841F'] as const },
      { icon: Vote, label: 'Village Council', desc: 'Community decisions', colors: ['#8B5CF6', '#7C3AED'] as const },
      { icon: Globe, label: 'Translator', desc: 'Break language barriers', colors: ['#3B82F6', '#2563EB'] as const },
      { icon: Star, label: 'Rewards', desc: 'Earn as you engage', colors: ['#F97316', '#EA580C'] as const },
    ],
  },
];

// Flatten features for the showcase carousel
const ALL_FEATURES: Feature[] = FEATURE_CATEGORIES.flatMap(cat => cat.features);

export default function WelcomeScreen() {
  const setHasSeenWelcome = useStore((s) => s.setHasSeenWelcome);
  const [currentCategoryIndex, setCurrentCategoryIndex] = useState(0);
  const scrollX = useRef(new RNAnimated.Value(0)).current;

  // Animated values for logo
  const logoScale = useSharedValue(1);
  const glowOpacity = useSharedValue(0.3);

  useEffect(() => {
    // Subtle pulse animation for logo
    logoScale.value = withRepeat(
      withSequence(
        withTiming(1.02, { duration: 2000 }),
        withTiming(1, { duration: 2000 })
      ),
      -1,
      true
    );

    // Glow animation
    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(0.6, { duration: 1500 }),
        withTiming(0.3, { duration: 1500 })
      ),
      -1,
      true
    );
  }, []);

  const logoAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoScale.value }],
  }));

  const glowAnimatedStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  // Auto-scroll categories
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentCategoryIndex((prev) => (prev + 1) % FEATURE_CATEGORIES.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleGetStarted = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setHasSeenWelcome(true);
    router.push('/location-select');
  };

  const currentCategory = FEATURE_CATEGORIES[currentCategoryIndex];

  return (
    <View className="flex-1 bg-[#062A1E]">
      <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
        {/* Hero Section with Logo */}
        <LinearGradient
          colors={['#0D3D2D', '#062A1E', '#041A13']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={{ paddingBottom: 40 }}
        >
          <SafeAreaView edges={['top']}>
            <Animated.View
              entering={FadeIn.duration(800)}
              className="items-center pt-8 pb-6"
            >
              {/* Logo Container with Glow Effect */}
              <Animated.View style={logoAnimatedStyle} className="relative">
                {/* Outer Glow */}
                <Animated.View
                  style={[
                    {
                      position: 'absolute',
                      width: 160,
                      height: 160,
                      borderRadius: 40,
                      backgroundColor: '#C9A227',
                      top: -10,
                      left: -10,
                    },
                    glowAnimatedStyle,
                  ]}
                />

                {/* Main Logo Image */}
                <View className="relative">
                  <Image
                    source={LOGO_IMAGE}
                    style={{
                      width: 140,
                      height: 140,
                      borderRadius: 32,
                      shadowColor: '#C9A227',
                      shadowOffset: { width: 0, height: 8 },
                      shadowOpacity: 0.5,
                      shadowRadius: 20,
                    }}
                    contentFit="cover"
                  />

                  {/* Sparkle decorations */}
                  <View className="absolute -top-2 -right-2">
                    <Sparkles size={24} color="#FFD700" />
                  </View>
                  <View className="absolute -bottom-1 -left-1">
                    <Sparkles size={16} color="#C9A227" />
                  </View>
                </View>
              </Animated.View>

              {/* App Name */}
              <Animated.View
                entering={FadeInUp.duration(600).delay(200)}
                className="mt-6"
              >
                <Text className="text-5xl font-bold text-white text-center tracking-tight">
                  Intera
                </Text>
                <View className="flex-row items-center justify-center mt-2">
                  <View className="h-[1px] w-8 bg-[#C9A227]/50" />
                  <Text className="text-[#C9A227] text-center mx-3 text-sm font-medium">
                    Where the world connects
                  </Text>
                  <View className="h-[1px] w-8 bg-[#C9A227]/50" />
                </View>
              </Animated.View>

              {/* Tagline */}
              <Animated.View
                entering={FadeInUp.duration(600).delay(400)}
                className="mt-6 px-8"
              >
                <Text className="text-white/90 text-center text-lg leading-7">
                  The <Text className="text-[#C9A227] font-semibold">all-in-one platform</Text> for
                  foreigners, expats, and global citizens to{' '}
                  <Text className="text-emerald-400 font-semibold">connect</Text>,{' '}
                  <Text className="text-[#C9A227] font-semibold">grow</Text>, and{' '}
                  <Text className="text-emerald-400 font-semibold">thrive</Text> together.
                </Text>
              </Animated.View>

              {/* Stats Row */}
              <Animated.View
                entering={FadeInUp.duration(600).delay(500)}
                className="flex-row items-center justify-center mt-6 space-x-6"
              >
                <View className="items-center">
                  <Text className="text-2xl font-bold text-[#C9A227]">20+</Text>
                  <Text className="text-white/60 text-xs">Features</Text>
                </View>
                <View className="w-[1px] h-8 bg-white/20" />
                <View className="items-center">
                  <Text className="text-2xl font-bold text-white">150+</Text>
                  <Text className="text-white/60 text-xs">Countries</Text>
                </View>
                <View className="w-[1px] h-8 bg-white/20" />
                <View className="items-center">
                  <Text className="text-2xl font-bold text-white">24/7</Text>
                  <Text className="text-white/60 text-xs">Community</Text>
                </View>
              </Animated.View>
            </Animated.View>
          </SafeAreaView>
        </LinearGradient>

        {/* Everything You Need Section */}
        <View className="px-5 pt-8 pb-6">
          <Animated.View entering={FadeInUp.duration(500).delay(600)}>
            <View className="flex-row items-center mb-2">
              <Sparkles size={18} color="#C9A227" />
              <Text className="text-[#C9A227] text-sm font-semibold ml-2 uppercase tracking-wider">
                Everything You Need
              </Text>
            </View>
            <Text className="text-white text-2xl font-bold mb-1">
              One App, Endless Possibilities
            </Text>
            <Text className="text-white/60 text-base">
              Discover all the amazing features waiting for you
            </Text>
          </Animated.View>
        </View>

        {/* Auto-rotating Category Showcase */}
        <Animated.View
          entering={FadeInUp.duration(500).delay(700)}
          className="mb-6"
        >
          {/* Category Tabs */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16 }}
            style={{ flexGrow: 0 }}
          >
            {FEATURE_CATEGORIES.map((cat, index) => (
              <Pressable
                key={cat.title}
                onPress={() => {
                  Haptics.selectionAsync();
                  setCurrentCategoryIndex(index);
                }}
                className={`mr-2 px-4 py-2 rounded-full ${
                  currentCategoryIndex === index
                    ? 'bg-[#C9A227]'
                    : 'bg-white/10'
                }`}
              >
                <Text
                  className={`text-sm font-medium ${
                    currentCategoryIndex === index ? 'text-[#062A1E]' : 'text-white/60'
                  }`}
                >
                  {cat.title}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          {/* Feature Cards for Current Category */}
          <View className="mt-4 px-5">
            <Animated.View
              key={currentCategoryIndex}
              entering={FadeIn.duration(400)}
              className="flex-row flex-wrap justify-between"
            >
              {currentCategory.features.map((feature, index) => (
                <Animated.View
                  key={feature.label}
                  entering={FadeInUp.duration(400).delay(index * 100)}
                  style={{ width: (width - 52) / 2 }}
                  className="mb-3"
                >
                  <View className="bg-white/5 border border-[#C9A227]/20 rounded-2xl p-4 h-full">
                    <LinearGradient
                      colors={feature.colors}
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 14,
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: 12,
                      }}
                    >
                      <feature.icon size={24} color="white" />
                    </LinearGradient>
                    <Text className="text-white font-semibold text-base mb-1">
                      {feature.label}
                    </Text>
                    <Text className="text-white/50 text-sm">
                      {feature.desc}
                    </Text>
                  </View>
                </Animated.View>
              ))}
            </Animated.View>
          </View>

          {/* Category Dots */}
          <View className="flex-row justify-center mt-4">
            {FEATURE_CATEGORIES.map((_, index) => (
              <View
                key={index}
                className={`w-2 h-2 rounded-full mx-1 ${
                  index === currentCategoryIndex ? 'bg-[#C9A227]' : 'bg-white/20'
                }`}
              />
            ))}
          </View>
        </Animated.View>

        {/* Quick Feature Grid - All Features at a Glance */}
        <Animated.View
          entering={FadeInUp.duration(500).delay(800)}
          className="px-5 mb-6"
        >
          <Text className="text-white text-lg font-bold mb-4">
            At a Glance
          </Text>
          <View className="flex-row flex-wrap justify-between">
            {ALL_FEATURES.slice(0, 12).map((feature, index) => (
              <Animated.View
                key={feature.label}
                entering={FadeInUp.duration(300).delay(850 + index * 30)}
                className="items-center mb-5"
                style={{ width: '25%' }}
              >
                <LinearGradient
                  colors={feature.colors}
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 16,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 6,
                  }}
                >
                  <feature.icon size={24} color="white" />
                </LinearGradient>
                <Text className="text-white/80 text-xs text-center font-medium">
                  {feature.label}
                </Text>
              </Animated.View>
            ))}
          </View>

          {/* More features indicator */}
          <View className="flex-row items-center justify-center mt-2">
            <Text className="text-white/40 text-sm">
              + {ALL_FEATURES.length - 12} more features inside
            </Text>
            <Sparkles size={14} color="#C9A227" style={{ marginLeft: 6 }} />
          </View>
        </Animated.View>

        {/* How It Works */}
        <Animated.View
          entering={FadeInUp.duration(500).delay(900)}
          className="px-5 mb-6"
        >
          <Text className="text-white text-lg font-bold mb-4">
            Get Started in 3 Steps
          </Text>
          <View className="bg-white/5 border border-[#C9A227]/20 rounded-2xl p-5">
            {[
              { step: '1', title: 'Choose Your Location', desc: 'Find your local community', icon: MapPin },
              { step: '2', title: 'Explore Features', desc: 'Browse as a guest, free', icon: Globe },
              { step: '3', title: 'Join & Connect', desc: 'Create account to engage', icon: Users },
            ].map((item, index) => (
              <View
                key={item.step}
                className={`flex-row items-center ${index < 2 ? 'mb-4 pb-4 border-b border-white/10' : ''}`}
              >
                <LinearGradient
                  colors={['#0D5C43', '#0A4A36']}
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 14,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 14,
                    borderWidth: 1,
                    borderColor: '#C9A22730',
                  }}
                >
                  <item.icon size={22} color="#C9A227" />
                </LinearGradient>
                <View className="flex-1">
                  <Text className="text-white font-semibold">{item.title}</Text>
                  <Text className="text-white/50 text-sm">{item.desc}</Text>
                </View>
                <View className="w-8 h-8 rounded-full bg-[#C9A227]/20 items-center justify-center">
                  <Text className="text-[#C9A227] font-bold text-sm">{item.step}</Text>
                </View>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* Guest Access Banner */}
        <Animated.View
          entering={FadeInUp.duration(500).delay(1000)}
          className="px-5 mb-6"
        >
          <LinearGradient
            colors={['#0D5C43', '#0A4A36']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ borderRadius: 20, padding: 20, overflow: 'hidden', borderWidth: 1, borderColor: '#C9A22730' }}
          >
            <View className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-[#C9A227]/10" />
            <View className="flex-row items-center">
              <View className="bg-[#C9A227]/20 rounded-2xl p-3 mr-4">
                <Play size={28} color="#C9A227" />
              </View>
              <View className="flex-1">
                <Text className="text-white font-bold text-lg">
                  Try Before You Sign Up
                </Text>
                <Text className="text-white/70 text-sm mt-1">
                  Browse communities and explore features for free
                </Text>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Bottom spacing for button */}
        <View className="h-32" />
      </ScrollView>

      {/* Fixed Bottom Button */}
      <LinearGradient
        colors={['transparent', '#062A1E', '#062A1E']}
        style={{ position: 'absolute', bottom: 0, left: 0, right: 0, paddingTop: 40 }}
      >
        <SafeAreaView edges={['bottom']}>
          <View className="px-5 pb-2">
            <Pressable onPress={handleGetStarted}>
              <LinearGradient
                colors={['#C9A227', '#A6841F']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  borderRadius: 20,
                  paddingVertical: 18,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  shadowColor: '#C9A227',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 12,
                  elevation: 8,
                }}
              >
                <Text className="text-[#062A1E] font-bold text-lg">Get Started</Text>
                <ArrowRight size={22} color="#062A1E" style={{ marginLeft: 10 }} />
              </LinearGradient>
            </Pressable>
            <Text className="text-white/40 text-center text-xs mt-3">
              No account required to browse
            </Text>
          </View>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}
