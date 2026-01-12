import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Pressable, Dimensions, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import Animated, {
  FadeIn,
  FadeInUp,
  FadeOut,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  withDelay,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useStore } from '@/lib/store';
import { Globe, Heart, Users, ArrowRight, ChevronDown, Sparkles } from 'lucide-react-native';

const { width, height } = Dimensions.get('window');
const LOGO_IMAGE = require('../../assets/icon.png');

// Story content broken into digestible parts
const STORY_SECTIONS = [
  {
    id: 'intro',
    content: 'In a world that had become noisier but lonelier, people were surrounded by millions—yet truly connected to none.',
  },
  {
    id: 'problem',
    content: 'Neighbors passed each other without knowing names. Cultures lived side-by-side without ever truly meeting. The globe felt vast, but the distance between hearts felt even greater.',
  },
  {
    id: 'solution',
    content: 'Then came Intera.',
    highlight: true,
  },
  {
    id: 'meaning',
    content: 'The word Intera comes from interact, interconnect, and interweave — and that is exactly what the platform was built to do. Not just to show you content, but to weave people into each other\'s lives.',
  },
  {
    id: 'threads',
    content: 'In Intera, every person is a thread. Every story, every post, every business, every prayer group, every cultural event is a strand. And when these threads meet, they don\'t just scroll past one another — they bind.',
  },
  {
    id: 'examples',
    content: 'A new immigrant can find housing, faith, and friendship in a city they\'ve never stepped into before. A small business can rise because its own community finally sees it.',
  },
  {
    id: 'question',
    content: 'Intera doesn\'t ask, "Who do you follow?"\nIt asks, "Who are you connected to?"',
    highlight: true,
  },
  {
    id: 'vision',
    content: 'Intera builds neighborhoods across the globe.',
  },
  {
    id: 'values1',
    content: 'It is not just social. It is relational.',
  },
  {
    id: 'values2',
    content: 'It is not about going viral. It is about belonging.',
  },
  {
    id: 'conclusion',
    content: 'And so the name fits.',
  },
  {
    id: 'tagline',
    content: 'Intera — where the world doesn\'t just meet, it connects.',
    highlight: true,
    final: true,
  },
];

export default function StoryScreen() {
  const setHasSeenStory = useStore((s) => s.setHasSeenStory);
  const scrollViewRef = useRef<ScrollView>(null);
  const [currentSection, setCurrentSection] = useState(0);
  const [showAllContent, setShowAllContent] = useState(false);

  // Animated values
  const backgroundPulse = useSharedValue(0);
  const logoGlow = useSharedValue(0.3);
  const threadAnimation = useSharedValue(0);

  useEffect(() => {
    // Background pulse
    backgroundPulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 4000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 4000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );

    // Logo glow
    logoGlow.value = withRepeat(
      withSequence(
        withTiming(0.7, { duration: 2000 }),
        withTiming(0.3, { duration: 2000 })
      ),
      -1,
      true
    );

    // Thread weaving animation
    threadAnimation.value = withRepeat(
      withTiming(1, { duration: 8000, easing: Easing.linear }),
      -1,
      false
    );
  }, []);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: logoGlow.value,
  }));

  const handleContinue = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setHasSeenStory(true);
    router.replace('/welcome');
  };

  const handleSkip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setHasSeenStory(true);
    router.replace('/welcome');
  };

  return (
    <View className="flex-1 bg-[#062A1E]">
      {/* Animated background elements */}
      <View className="absolute inset-0 overflow-hidden">
        {/* Subtle gradient orbs */}
        <Animated.View
          style={[
            {
              position: 'absolute',
              top: -100,
              right: -100,
              width: 300,
              height: 300,
              borderRadius: 150,
              backgroundColor: '#C9A227',
              opacity: 0.05,
            },
          ]}
        />
        <Animated.View
          style={[
            {
              position: 'absolute',
              bottom: 100,
              left: -150,
              width: 400,
              height: 400,
              borderRadius: 200,
              backgroundColor: '#0D5C43',
              opacity: 0.3,
            },
          ]}
        />
      </View>

      <SafeAreaView className="flex-1">
        {/* Skip button */}
        <Animated.View
          entering={FadeIn.duration(800).delay(500)}
          className="absolute top-4 right-5 z-10"
        >
          <Pressable
            onPress={handleSkip}
            className="px-4 py-2 rounded-full bg-white/10"
          >
            <Text className="text-white/60 text-sm font-medium">Skip</Text>
          </Pressable>
        </Animated.View>

        <ScrollView
          ref={scrollViewRef}
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120 }}
        >
          {/* Logo Section */}
          <Animated.View
            entering={FadeIn.duration(1000)}
            className="items-center pt-16 pb-8"
          >
            {/* Logo with glow */}
            <View className="relative">
              <Animated.View
                style={[
                  {
                    position: 'absolute',
                    width: 140,
                    height: 140,
                    borderRadius: 35,
                    backgroundColor: '#C9A227',
                    top: -10,
                    left: -10,
                  },
                  glowStyle,
                ]}
              />
              <Image
                source={LOGO_IMAGE}
                style={{
                  width: 120,
                  height: 120,
                  borderRadius: 30,
                }}
                contentFit="cover"
              />
            </View>
          </Animated.View>

          {/* Story Content */}
          <View className="px-6">
            {STORY_SECTIONS.map((section, index) => (
              <Animated.View
                key={section.id}
                entering={FadeInUp.duration(800).delay(800 + index * 300)}
                className={`mb-6 ${section.highlight ? 'my-8' : ''}`}
              >
                {section.highlight ? (
                  <View className="items-center">
                    {section.id === 'solution' && (
                      <View className="flex-row items-center mb-3">
                        <View className="h-[1px] w-12 bg-[#C9A227]/50" />
                        <Sparkles size={20} color="#C9A227" style={{ marginHorizontal: 12 }} />
                        <View className="h-[1px] w-12 bg-[#C9A227]/50" />
                      </View>
                    )}
                    <Text
                      className={`text-center leading-8 ${
                        section.final
                          ? 'text-2xl font-bold text-[#C9A227]'
                          : section.id === 'solution'
                          ? 'text-4xl font-bold text-white'
                          : 'text-xl font-semibold text-white/90 italic'
                      }`}
                    >
                      {section.content}
                    </Text>
                    {section.final && (
                      <View className="flex-row items-center mt-4">
                        <Globe size={18} color="#C9A227" />
                        <Heart size={18} color="#C9A227" style={{ marginHorizontal: 8 }} />
                        <Users size={18} color="#C9A227" />
                      </View>
                    )}
                  </View>
                ) : (
                  <Text className="text-white/80 text-lg text-center leading-8">
                    {section.content}
                  </Text>
                )}
              </Animated.View>
            ))}
          </View>
        </ScrollView>

        {/* Fixed Bottom Button */}
        <LinearGradient
          colors={['transparent', '#062A1E', '#062A1E']}
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            paddingTop: 60,
          }}
        >
          <SafeAreaView edges={['bottom']}>
            <Animated.View
              entering={FadeInUp.duration(600).delay(4500)}
              className="px-6 pb-2"
            >
              <Pressable onPress={handleContinue}>
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
                  <Text className="text-[#062A1E] font-bold text-lg">
                    Enter Intera
                  </Text>
                  <ArrowRight size={22} color="#062A1E" style={{ marginLeft: 10 }} />
                </LinearGradient>
              </Pressable>
            </Animated.View>
          </SafeAreaView>
        </LinearGradient>
      </SafeAreaView>
    </View>
  );
}
