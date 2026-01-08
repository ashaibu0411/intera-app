import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowLeft,
  Heart,
  Users,
  Briefcase,
  GraduationCap,
  Home,
  Church,
  Utensils,
  Music,
  Check,
  ChevronRight,
  Sparkles,
} from 'lucide-react-native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useStore } from '@/lib/store';

// Connection interests
const INTERESTS = [
  { id: 'networking', label: 'Professional Networking', icon: Briefcase },
  { id: 'dating', label: 'Dating & Romance', icon: Heart },
  { id: 'friendship', label: 'Making Friends', icon: Users },
  { id: 'mentorship', label: 'Finding a Mentor', icon: GraduationCap },
  { id: 'housing', label: 'Roommate Search', icon: Home },
  { id: 'faith', label: 'Faith Community', icon: Church },
  { id: 'food', label: 'Foodie Friends', icon: Utensils },
  { id: 'culture', label: 'Cultural Activities', icon: Music },
];

// Age range options
const AGE_RANGES = ['18-25', '26-35', '36-45', '46-55', '55+', 'Any'];

export default function ConnectSetupScreen() {
  const currentUser = useStore((s) => s.currentUser);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [bio, setBio] = useState('');
  const [ageRange, setAgeRange] = useState<string>('Any');
  const [showSuccess, setShowSuccess] = useState(false);

  const toggleInterest = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedInterests((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleComplete = () => {
    if (selectedInterests.length === 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setShowSuccess(true);

    setTimeout(() => {
      router.back();
    }, 2000);
  };

  if (showSuccess) {
    return (
      <View className="flex-1 bg-cream items-center justify-center px-5">
        <Animated.View entering={FadeIn.duration(400)} className="items-center">
          <LinearGradient
            colors={['#EC4899', '#DB2777']}
            style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Sparkles size={40} color="#FFFFFF" />
          </LinearGradient>
          <Text className="text-warmBrown text-2xl font-bold mt-6">
            You're All Set!
          </Text>
          <Text className="text-gray-500 text-center mt-2">
            Start discovering people who share your interests.
          </Text>
        </Animated.View>
      </View>
    );
  }

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
          <Text className="text-xl font-bold text-warmBrown">Connect Setup</Text>
        </Animated.View>

        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          {/* Hero */}
          <Animated.View entering={FadeInUp.duration(400).delay(100)} className="px-5 pt-5">
            <LinearGradient
              colors={['#EC4899', '#DB2777', '#BE185D']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ borderRadius: 24, padding: 24 }}
            >
              <View className="flex-row items-center">
                <View className="w-14 h-14 rounded-full bg-white/20 items-center justify-center">
                  <Heart size={28} color="#FFFFFF" fill="#FFFFFF" />
                </View>
                <View className="flex-1 ml-4">
                  <Text className="text-white text-xl font-bold">
                    Find Your People
                  </Text>
                  <Text className="text-white/70 text-base">
                    Set up your connection preferences
                  </Text>
                </View>
              </View>

              <Text className="text-white/80 mt-4 leading-6">
                Tell us what you're looking for and we'll help you discover meaningful connections in the diaspora community.
              </Text>
            </LinearGradient>
          </Animated.View>

          {/* Interests Selection */}
          <Animated.View entering={FadeInUp.duration(400).delay(200)} className="px-5 mt-6">
            <Text className="text-lg font-bold text-warmBrown mb-2">
              What are you looking for?
            </Text>
            <Text className="text-gray-500 text-sm mb-4">
              Select all that apply
            </Text>

            <View className="flex-row flex-wrap gap-3">
              {INTERESTS.map((interest) => {
                const isSelected = selectedInterests.includes(interest.id);
                const Icon = interest.icon;

                return (
                  <Pressable
                    key={interest.id}
                    onPress={() => toggleInterest(interest.id)}
                    className={`flex-row items-center px-4 py-3 rounded-xl border-2 ${
                      isSelected
                        ? 'bg-pink-50 border-pink-500'
                        : 'bg-white border-gray-200'
                    }`}
                    style={{ minWidth: '45%' }}
                  >
                    <View
                      className={`w-8 h-8 rounded-full items-center justify-center ${
                        isSelected ? 'bg-pink-500' : 'bg-gray-100'
                      }`}
                    >
                      <Icon size={16} color={isSelected ? '#FFFFFF' : '#6B7280'} />
                    </View>
                    <Text
                      className={`ml-2 font-medium text-sm ${
                        isSelected ? 'text-pink-700' : 'text-warmBrown'
                      }`}
                      numberOfLines={1}
                    >
                      {interest.label}
                    </Text>
                    {isSelected && (
                      <View className="ml-auto">
                        <Check size={16} color="#EC4899" />
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </View>
          </Animated.View>

          {/* Bio */}
          <Animated.View entering={FadeInUp.duration(400).delay(300)} className="px-5 mt-6">
            <Text className="text-lg font-bold text-warmBrown mb-2">
              About You
            </Text>
            <Text className="text-gray-500 text-sm mb-4">
              Write a short bio for your connect profile
            </Text>
            <View className="bg-white rounded-xl p-4 border border-gray-200">
              <TextInput
                placeholder="E.g., Nigerian-American software engineer who loves cooking and hiking..."
                placeholderTextColor="#9CA3AF"
                value={bio}
                onChangeText={setBio}
                multiline
                numberOfLines={4}
                className="text-warmBrown text-base"
                style={{ minHeight: 100, textAlignVertical: 'top' }}
              />
            </View>
            <Text className="text-gray-400 text-sm mt-2 text-right">
              {bio.length}/300
            </Text>
          </Animated.View>

          {/* Age Range Preference */}
          <Animated.View entering={FadeInUp.duration(400).delay(400)} className="px-5 mt-6">
            <Text className="text-lg font-bold text-warmBrown mb-2">
              Preferred Age Range
            </Text>
            <Text className="text-gray-500 text-sm mb-4">
              Who would you like to connect with?
            </Text>

            <View className="flex-row flex-wrap gap-2">
              {AGE_RANGES.map((range) => (
                <Pressable
                  key={range}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setAgeRange(range);
                  }}
                  className={`px-4 py-2.5 rounded-full ${
                    ageRange === range ? 'bg-pink-500' : 'bg-white'
                  }`}
                >
                  <Text
                    className={`font-medium ${
                      ageRange === range ? 'text-white' : 'text-gray-600'
                    }`}
                  >
                    {range}
                  </Text>
                </Pressable>
              ))}
            </View>
          </Animated.View>

          {/* Privacy Note */}
          <Animated.View entering={FadeInUp.duration(400).delay(500)} className="px-5 mt-6">
            <View className="bg-purple-50 rounded-xl p-4">
              <Text className="text-purple-700 font-semibold mb-1">
                Your Privacy Matters
              </Text>
              <Text className="text-purple-600/80 text-sm leading-5">
                Your preferences are only used to show relevant connections. You control who can see your profile and message you.
              </Text>
            </View>
          </Animated.View>

          {/* Complete Button */}
          <Animated.View entering={FadeInUp.duration(400).delay(600)} className="px-5 mt-8">
            <Pressable
              onPress={handleComplete}
              disabled={selectedInterests.length === 0}
              style={{ opacity: selectedInterests.length === 0 ? 0.5 : 1 }}
            >
              <LinearGradient
                colors={['#EC4899', '#DB2777']}
                style={{ borderRadius: 16, paddingVertical: 16, alignItems: 'center' }}
              >
                <View className="flex-row items-center">
                  <Text className="text-white font-bold text-lg">
                    Start Connecting
                  </Text>
                  <ChevronRight size={20} color="#FFFFFF" />
                </View>
                {selectedInterests.length === 0 && (
                  <Text className="text-white/70 text-sm mt-1">
                    Select at least one interest
                  </Text>
                )}
              </LinearGradient>
            </Pressable>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
