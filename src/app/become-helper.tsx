import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowLeft,
  Heart,
  Home,
  Briefcase,
  GraduationCap,
  Car,
  ShoppingBag,
  Church,
  Users,
  Check,
  Star,
  Award,
} from 'lucide-react-native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useStore } from '@/lib/store';

// Skills a helper can offer
const HELPER_SKILLS = [
  { id: 'housing', label: 'Housing', icon: Home, description: 'Help find apartments, roommates' },
  { id: 'jobs', label: 'Jobs', icon: Briefcase, description: 'Career advice, resume review' },
  { id: 'schools', label: 'Schools', icon: GraduationCap, description: 'School enrollment, education' },
  { id: 'healthcare', label: 'Healthcare', icon: Heart, description: 'Finding doctors, clinics' },
  { id: 'transport', label: 'Transport', icon: Car, description: 'Getting around, driving' },
  { id: 'shopping', label: 'Shopping', icon: ShoppingBag, description: 'Stores, cultural markets' },
  { id: 'faith', label: 'Faith', icon: Church, description: 'Churches, mosques, temples' },
  { id: 'community', label: 'Community', icon: Users, description: 'Events, meeting people' },
];

// Benefits of being a helper
const BENEFITS = [
  { icon: Award, title: 'Earn the Welcomer Role', description: 'Get recognized for helping newcomers' },
  { icon: Star, title: 'Build Your Reputation', description: 'Increase your trust score in the community' },
  { icon: Heart, title: 'Make a Real Difference', description: 'Help people navigate their new home' },
  { icon: Users, title: 'Grow Your Network', description: 'Connect with grateful newcomers' },
];

export default function BecomeHelperScreen() {
  const currentUser = useStore((s) => s.currentUser);
  const setCurrentUser = useStore((s) => s.setCurrentUser);
  const [selectedSkills, setSelectedSkills] = useState<string[]>(
    currentUser?.helperSkills || []
  );
  const [isHelper, setIsHelper] = useState(currentUser?.isHelper || false);

  const toggleSkill = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedSkills((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const handleBecomeHelper = () => {
    if (!currentUser) {
      router.push('/signup');
      return;
    }

    if (selectedSkills.length === 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const updatedUser = {
      ...currentUser,
      isHelper: true,
      helperSkills: selectedSkills,
      // Award the Welcomer role when someone becomes a helper
      communityRoles: [
        ...(currentUser.communityRoles || []),
        {
          role: 'welcomer' as const,
          earnedAt: new Date().toISOString(),
          helpedCount: 0,
        },
      ],
    };

    setCurrentUser(updatedUser);
    setIsHelper(true);
  };

  const handleStopHelping = () => {
    if (!currentUser) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const updatedUser = {
      ...currentUser,
      isHelper: false,
      helperSkills: undefined,
    };

    setCurrentUser(updatedUser);
    setIsHelper(false);
  };

  return (
    <View className="flex-1 bg-cream">
      <SafeAreaView edges={['top']} className="flex-1">
        {/* Header */}
        <Animated.View
          entering={FadeIn.duration(300)}
          className="flex-row items-center px-5 pt-4 pb-4 border-b border-gray-100"
        >
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.back();
            }}
            className="mr-4 p-1"
            hitSlop={8}
          >
            <ArrowLeft size={24} color="#2D1F1A" />
          </Pressable>
          <Text className="text-xl font-bold text-warmBrown">Become a Helper</Text>
        </Animated.View>

        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          {/* Hero Section */}
          <Animated.View entering={FadeInUp.duration(400).delay(100)} className="px-5 pt-5">
            <LinearGradient
              colors={['#10B981', '#059669', '#047857']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ borderRadius: 24, padding: 24 }}
            >
              <View className="flex-row items-center">
                <View className="w-16 h-16 rounded-full bg-white/20 items-center justify-center">
                  <Heart size={32} color="#FFFFFF" fill="#FFFFFF" />
                </View>
                <View className="flex-1 ml-4">
                  <Text className="text-white text-2xl font-bold">
                    {isHelper ? "You're a Helper!" : 'Welcome Newcomers'}
                  </Text>
                  <Text className="text-white/80 text-base mt-1">
                    {isHelper
                      ? 'Thank you for helping our community'
                      : 'Help new arrivals settle into their new home'}
                  </Text>
                </View>
              </View>

              {isHelper && (
                <View className="mt-4 bg-white/20 rounded-xl p-4">
                  <View className="flex-row items-center justify-between">
                    <View className="items-center">
                      <Text className="text-white text-2xl font-bold">0</Text>
                      <Text className="text-white/70 text-sm">People Helped</Text>
                    </View>
                    <View className="items-center">
                      <Text className="text-white text-2xl font-bold">
                        {selectedSkills.length}
                      </Text>
                      <Text className="text-white/70 text-sm">Skills Offered</Text>
                    </View>
                    <View className="items-center">
                      <View className="flex-row items-center">
                        <Star size={20} color="#FCD34D" fill="#FCD34D" />
                        <Text className="text-white text-2xl font-bold ml-1">5.0</Text>
                      </View>
                      <Text className="text-white/70 text-sm">Rating</Text>
                    </View>
                  </View>
                </View>
              )}
            </LinearGradient>
          </Animated.View>

          {/* Benefits */}
          {!isHelper && (
            <Animated.View entering={FadeInUp.duration(400).delay(200)} className="px-5 mt-6">
              <Text className="text-lg font-bold text-warmBrown mb-4">
                Why Become a Helper?
              </Text>
              <View className="bg-white rounded-2xl p-4 shadow-sm">
                {BENEFITS.map((benefit, index) => (
                  <View
                    key={index}
                    className={`flex-row items-center py-3 ${
                      index < BENEFITS.length - 1 ? 'border-b border-gray-100' : ''
                    }`}
                  >
                    <View className="w-10 h-10 rounded-full bg-green-100 items-center justify-center">
                      <benefit.icon size={20} color="#059669" />
                    </View>
                    <View className="flex-1 ml-3">
                      <Text className="text-warmBrown font-semibold">
                        {benefit.title}
                      </Text>
                      <Text className="text-gray-500 text-sm">
                        {benefit.description}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </Animated.View>
          )}

          {/* Skills Selection */}
          <Animated.View entering={FadeInUp.duration(400).delay(300)} className="px-5 mt-6">
            <Text className="text-lg font-bold text-warmBrown mb-2">
              What can you help with?
            </Text>
            <Text className="text-gray-500 text-sm mb-4">
              Select all areas where you can offer guidance
            </Text>

            <View className="space-y-2">
              {HELPER_SKILLS.map((skill, index) => {
                const isSelected = selectedSkills.includes(skill.id);
                return (
                  <Pressable
                    key={skill.id}
                    onPress={() => toggleSkill(skill.id)}
                    className={`flex-row items-center p-4 rounded-xl border-2 mb-2 ${
                      isSelected
                        ? 'bg-green-50 border-green-500'
                        : 'bg-white border-gray-200'
                    }`}
                  >
                    <View
                      className={`w-10 h-10 rounded-full items-center justify-center ${
                        isSelected ? 'bg-green-500' : 'bg-gray-100'
                      }`}
                    >
                      <skill.icon
                        size={20}
                        color={isSelected ? '#FFFFFF' : '#6B7280'}
                      />
                    </View>
                    <View className="flex-1 ml-3">
                      <Text
                        className={`font-semibold ${
                          isSelected ? 'text-green-700' : 'text-warmBrown'
                        }`}
                      >
                        {skill.label}
                      </Text>
                      <Text className="text-gray-500 text-sm">
                        {skill.description}
                      </Text>
                    </View>
                    {isSelected && (
                      <View className="w-6 h-6 rounded-full bg-green-500 items-center justify-center">
                        <Check size={16} color="#FFFFFF" />
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </View>
          </Animated.View>

          {/* Action Button */}
          <Animated.View entering={FadeInUp.duration(400).delay(400)} className="px-5 mt-8">
            {isHelper ? (
              <View className="space-y-3">
                <Pressable
                  onPress={() => {
                    if (!currentUser) return;
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    const updatedUser = {
                      ...currentUser,
                      helperSkills: selectedSkills,
                    };
                    setCurrentUser(updatedUser);
                    router.back();
                  }}
                  className="bg-green-500 rounded-xl py-4 items-center"
                >
                  <Text className="text-white font-bold text-lg">
                    Update Skills
                  </Text>
                </Pressable>
                <Pressable
                  onPress={handleStopHelping}
                  className="bg-gray-200 rounded-xl py-4 items-center mt-3"
                >
                  <Text className="text-gray-600 font-semibold">
                    Stop Being a Helper
                  </Text>
                </Pressable>
              </View>
            ) : (
              <Pressable
                onPress={handleBecomeHelper}
                disabled={selectedSkills.length === 0}
                style={{ opacity: selectedSkills.length === 0 ? 0.5 : 1 }}
              >
                <LinearGradient
                  colors={['#10B981', '#059669']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{ borderRadius: 16, paddingVertical: 16, alignItems: 'center' }}
                >
                  <Text className="text-white font-bold text-lg">
                    Start Helping Newcomers
                  </Text>
                  {selectedSkills.length === 0 && (
                    <Text className="text-white/70 text-sm mt-1">
                      Select at least one skill
                    </Text>
                  )}
                </LinearGradient>
              </Pressable>
            )}
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
