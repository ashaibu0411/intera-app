import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, RefreshCw, Quote, Share2, Heart, Bookmark, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, FadeInDown, useAnimatedStyle, withRepeat, withSequence, withTiming, withSpring } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

interface Proverb {
  id: string;
  text: string;
  meaning: string;
  origin: string;
  country: string;
  flag: string;
  category: string;
  isSaved: boolean;
}

const PROVERBS: Proverb[] = [
  {
    id: '1',
    text: 'If you want to go fast, go alone. If you want to go far, go together.',
    meaning: 'Collaboration and community are essential for achieving lasting success.',
    origin: 'African',
    country: 'Various African Nations',
    flag: '🌍',
    category: 'Unity',
    isSaved: false,
  },
  {
    id: '2',
    text: 'The child who is not embraced by the village will burn it down to feel its warmth.',
    meaning: 'A community must care for all its members, especially the vulnerable ones.',
    origin: 'African',
    country: 'Various African Nations',
    flag: '🌍',
    category: 'Community',
    isSaved: true,
  },
  {
    id: '3',
    text: 'When spider webs unite, they can tie up a lion.',
    meaning: 'Unity and cooperation can overcome the most powerful obstacles.',
    origin: 'Ethiopian',
    country: 'Ethiopia',
    flag: '🇪🇹',
    category: 'Strength',
    isSaved: false,
  },
  {
    id: '4',
    text: 'Knowledge is like a garden: if it is not cultivated, it cannot be harvested.',
    meaning: 'Learning requires continuous effort and nurturing to bear fruit.',
    origin: 'Ghanaian',
    country: 'Ghana',
    flag: '🇬🇭',
    category: 'Wisdom',
    isSaved: false,
  },
  {
    id: '5',
    text: 'However long the night, the dawn will break.',
    meaning: 'No matter how difficult times are, hope and relief will eventually come.',
    origin: 'West African',
    country: 'Various West African Nations',
    flag: '🌅',
    category: 'Hope',
    isSaved: true,
  },
  {
    id: '6',
    text: 'The axe forgets; the tree remembers.',
    meaning: 'Those who cause harm may forget their actions, but the wounded remember.',
    origin: 'Zimbabwean',
    country: 'Zimbabwe',
    flag: '🇿🇼',
    category: 'Justice',
    isSaved: false,
  },
  {
    id: '7',
    text: 'A tree cannot stand without its roots.',
    meaning: 'We cannot thrive without staying connected to our heritage and origins.',
    origin: 'Yoruba',
    country: 'Nigeria',
    flag: '🇳🇬',
    category: 'Heritage',
    isSaved: false,
  },
  {
    id: '8',
    text: 'Wisdom is like a baobab tree; no one individual can embrace it.',
    meaning: 'True wisdom is vast and requires the collective knowledge of many.',
    origin: 'Akan',
    country: 'Ghana',
    flag: '🇬🇭',
    category: 'Wisdom',
    isSaved: false,
  },
  {
    id: '9',
    text: 'Cross the river in a crowd and the crocodile won\'t eat you.',
    meaning: 'There is safety and strength in community and solidarity.',
    origin: 'Malagasy',
    country: 'Madagascar',
    flag: '🇲🇬',
    category: 'Unity',
    isSaved: false,
  },
  {
    id: '10',
    text: 'Do not call the forest that shelters you a jungle.',
    meaning: 'Respect and appreciate those who support and protect you.',
    origin: 'Ghanaian',
    country: 'Ghana',
    flag: '🇬🇭',
    category: 'Gratitude',
    isSaved: false,
  },
  {
    id: '11',
    text: 'The words of the elders become sweet some day.',
    meaning: 'The wisdom of those with experience reveals its value over time.',
    origin: 'Igbo',
    country: 'Nigeria',
    flag: '🇳🇬',
    category: 'Elders',
    isSaved: false,
  },
  {
    id: '12',
    text: 'He who learns, teaches.',
    meaning: 'Knowledge should be shared; learning creates a responsibility to educate others.',
    origin: 'Ethiopian',
    country: 'Ethiopia',
    flag: '🇪🇹',
    category: 'Education',
    isSaved: true,
  },
];

const CATEGORIES = ['All', 'Unity', 'Wisdom', 'Hope', 'Community', 'Heritage', 'Strength', 'Gratitude'];

const GRADIENT_SETS = [
  ['#6366F1', '#8B5CF6'],
  ['#EC4899', '#F43F5E'],
  ['#10B981', '#059669'],
  ['#F59E0B', '#D97706'],
  ['#3B82F6', '#2563EB'],
  ['#8B5CF6', '#7C3AED'],
];

export default function ProverbsWisdomScreen() {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [proverbs, setProverbs] = useState(PROVERBS);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [viewMode, setViewMode] = useState<'daily' | 'browse'>('daily');

  const filteredProverbs = proverbs.filter(p =>
    selectedCategory === 'All' || p.category === selectedCategory
  );

  const currentProverb = filteredProverbs[currentIndex] || filteredProverbs[0];
  const gradientColors = GRADIENT_SETS[currentIndex % GRADIENT_SETS.length];

  const goToNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCurrentIndex(prev => (prev + 1) % filteredProverbs.length);
  };

  const goToPrev = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCurrentIndex(prev => (prev - 1 + filteredProverbs.length) % filteredProverbs.length);
  };

  const toggleSave = (proverbId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setProverbs(prev => prev.map(p => {
      if (p.id === proverbId) {
        return { ...p, isSaved: !p.isSaved };
      }
      return p;
    }));
  };

  const getRandomProverb = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const randomIndex = Math.floor(Math.random() * filteredProverbs.length);
    setCurrentIndex(randomIndex);
  };

  return (
    <View className="flex-1 bg-[#0F0A19]">
      <SafeAreaView edges={['top']} className="flex-1">
        {/* Header */}
        <View className="px-5 pb-4">
          <View className="flex-row items-center justify-between mb-4">
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.back();
              }}
              className="w-10 h-10 rounded-full bg-white/10 items-center justify-center"
            >
              <ArrowLeft size={20} color="#fff" />
            </Pressable>
            <View className="flex-row items-center">
              <Sparkles size={20} color="#F59E0B" />
              <Text className="text-white text-lg font-bold ml-2">Proverbs & Wisdom</Text>
            </View>
            <Pressable
              onPress={getRandomProverb}
              className="w-10 h-10 rounded-full bg-white/10 items-center justify-center"
            >
              <RefreshCw size={20} color="#fff" />
            </Pressable>
          </View>

          {/* View Mode Toggle */}
          <View className="flex-row bg-white/10 rounded-2xl p-1 mb-4">
            <Pressable
              onPress={() => setViewMode('daily')}
              className={`flex-1 py-2.5 rounded-xl items-center ${
                viewMode === 'daily' ? 'bg-amber-500' : ''
              }`}
            >
              <Text className={viewMode === 'daily' ? 'text-black font-bold' : 'text-gray-400'}>
                Daily Wisdom
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setViewMode('browse')}
              className={`flex-1 py-2.5 rounded-xl items-center ${
                viewMode === 'browse' ? 'bg-amber-500' : ''
              }`}
            >
              <Text className={viewMode === 'browse' ? 'text-black font-bold' : 'text-gray-400'}>
                Browse All
              </Text>
            </Pressable>
          </View>

          {/* Categories */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }}>
            <View className="flex-row gap-2">
              {CATEGORIES.map((category) => (
                <Pressable
                  key={category}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSelectedCategory(category);
                    setCurrentIndex(0);
                  }}
                  className={`px-4 py-2 rounded-full ${
                    selectedCategory === category
                      ? 'bg-amber-500'
                      : 'bg-white/10'
                  }`}
                >
                  <Text className={`font-medium ${
                    selectedCategory === category ? 'text-black' : 'text-gray-300'
                  }`}>
                    {category}
                  </Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        </View>

        {viewMode === 'daily' ? (
          /* Daily Wisdom Card */
          <View className="flex-1 px-5">
            <Animated.View
              entering={FadeIn.duration(500)}
              className="flex-1"
            >
              <LinearGradient
                colors={gradientColors as [string, string]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ flex: 1, borderRadius: 32, padding: 2 }}
              >
                <View className="flex-1 bg-[#1A1625] rounded-[30px] p-6 justify-between">
                  {/* Quote Icon */}
                  <View className="items-center mb-4">
                    <View className="w-16 h-16 rounded-full bg-white/10 items-center justify-center">
                      <Quote size={32} color="#F59E0B" />
                    </View>
                  </View>

                  {/* Proverb Text */}
                  <View className="flex-1 justify-center">
                    <Text className="text-white text-2xl font-bold text-center leading-10 mb-6">
                      "{currentProverb?.text}"
                    </Text>

                    <View className="bg-white/10 rounded-2xl p-4 mb-4">
                      <Text className="text-amber-400 text-sm font-bold mb-1">Meaning</Text>
                      <Text className="text-gray-300 text-base leading-6">{currentProverb?.meaning}</Text>
                    </View>
                  </View>

                  {/* Origin */}
                  <View className="items-center mb-4">
                    <View className="flex-row items-center bg-white/10 px-4 py-2 rounded-full">
                      <Text className="text-2xl mr-2">{currentProverb?.flag}</Text>
                      <Text className="text-white font-medium">{currentProverb?.origin} Proverb</Text>
                    </View>
                    <Text className="text-gray-500 text-sm mt-1">{currentProverb?.country}</Text>
                  </View>

                  {/* Navigation & Actions */}
                  <View className="flex-row items-center justify-between">
                    <Pressable
                      onPress={goToPrev}
                      className="w-12 h-12 rounded-full bg-white/10 items-center justify-center"
                    >
                      <ChevronLeft size={24} color="#fff" />
                    </Pressable>

                    <View className="flex-row items-center gap-4">
                      <Pressable
                        onPress={() => toggleSave(currentProverb?.id || '')}
                        className={`w-12 h-12 rounded-full items-center justify-center ${
                          currentProverb?.isSaved ? 'bg-amber-500' : 'bg-white/10'
                        }`}
                      >
                        <Bookmark
                          size={22}
                          color={currentProverb?.isSaved ? '#000' : '#fff'}
                          fill={currentProverb?.isSaved ? '#000' : 'transparent'}
                        />
                      </Pressable>
                      <Pressable className="w-12 h-12 rounded-full bg-white/10 items-center justify-center">
                        <Share2 size={22} color="#fff" />
                      </Pressable>
                    </View>

                    <Pressable
                      onPress={goToNext}
                      className="w-12 h-12 rounded-full bg-white/10 items-center justify-center"
                    >
                      <ChevronRight size={24} color="#fff" />
                    </Pressable>
                  </View>

                  {/* Progress Dots */}
                  <View className="flex-row justify-center mt-4 gap-1">
                    {filteredProverbs.slice(0, 10).map((_, idx) => (
                      <View
                        key={idx}
                        className={`w-2 h-2 rounded-full ${
                          idx === currentIndex ? 'bg-amber-500' : 'bg-white/20'
                        }`}
                      />
                    ))}
                    {filteredProverbs.length > 10 && (
                      <Text className="text-gray-500 text-xs ml-1">+{filteredProverbs.length - 10}</Text>
                    )}
                  </View>
                </View>
              </LinearGradient>
            </Animated.View>

            <View className="h-8" />
          </View>
        ) : (
          /* Browse All */
          <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
            {filteredProverbs.map((proverb, index) => (
              <Animated.View
                key={proverb.id}
                entering={FadeInDown.delay(index * 60).springify()}
              >
                <Pressable
                  onPress={() => {
                    setCurrentIndex(index);
                    setViewMode('daily');
                  }}
                  className="bg-white/5 rounded-2xl p-4 mb-3 border border-white/10"
                >
                  <View className="flex-row items-start">
                    <Text className="text-2xl mr-3">{proverb.flag}</Text>
                    <View className="flex-1">
                      <Text className="text-white font-medium text-base mb-2" numberOfLines={2}>"{proverb.text}"</Text>
                      <View className="flex-row items-center justify-between">
                        <View className="flex-row items-center">
                          <View className="bg-amber-500/20 px-2 py-0.5 rounded-full">
                            <Text className="text-amber-400 text-xs">{proverb.category}</Text>
                          </View>
                          <Text className="text-gray-500 text-xs ml-2">{proverb.origin}</Text>
                        </View>
                        <Pressable onPress={() => toggleSave(proverb.id)}>
                          <Bookmark
                            size={18}
                            color={proverb.isSaved ? '#F59E0B' : '#6B7280'}
                            fill={proverb.isSaved ? '#F59E0B' : 'transparent'}
                          />
                        </Pressable>
                      </View>
                    </View>
                  </View>
                </Pressable>
              </Animated.View>
            ))}

            <View className="h-32" />
          </ScrollView>
        )}
      </SafeAreaView>
    </View>
  );
}
