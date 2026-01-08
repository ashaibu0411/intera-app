import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowLeft,
  HelpCircle,
  Home,
  Briefcase,
  GraduationCap,
  Car,
  Heart,
  ShoppingBag,
  Users,
  Check,
  MapPin,
  Calendar,
} from 'lucide-react-native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useStore } from '@/lib/store';

// Ask categories
const ASK_CATEGORIES = [
  { id: 'housing', label: 'Housing Help', icon: Home, color: '#F59E0B' },
  { id: 'jobs', label: 'Job Search', icon: Briefcase, color: '#3B82F6' },
  { id: 'schools', label: 'Schools & Education', icon: GraduationCap, color: '#8B5CF6' },
  { id: 'transport', label: 'Transportation', icon: Car, color: '#10B981' },
  { id: 'healthcare', label: 'Healthcare', icon: Heart, color: '#EF4444' },
  { id: 'shopping', label: 'Shopping & Stores', icon: ShoppingBag, color: '#EC4899' },
  { id: 'community', label: 'Community', icon: Users, color: '#6366F1' },
  { id: 'other', label: 'Other', icon: HelpCircle, color: '#6B7280' },
];

// Urgency levels
const URGENCY_LEVELS = [
  { id: 'low', label: 'Whenever', description: 'No rush' },
  { id: 'medium', label: 'This Week', description: 'Fairly soon' },
  { id: 'high', label: 'Urgent', description: 'ASAP' },
];

export default function CreateAskScreen() {
  const currentUser = useStore((s) => s.currentUser);
  const selectedLocation = useStore((s) => s.selectedLocation);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [question, setQuestion] = useState('');
  const [details, setDetails] = useState('');
  const [urgency, setUrgency] = useState('medium');
  const [location, setLocation] = useState(selectedLocation?.city || '');
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSubmit = () => {
    if (!selectedCategory || !question.trim()) {
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
            colors={['#6366F1', '#4F46E5']}
            style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Check size={40} color="#FFFFFF" />
          </LinearGradient>
          <Text className="text-warmBrown text-2xl font-bold mt-6">
            Question Posted!
          </Text>
          <Text className="text-gray-500 text-center mt-2">
            Community members are ready to help you.
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
          <Text className="text-xl font-bold text-warmBrown">Ask the Community</Text>
        </Animated.View>

        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Hero */}
          <Animated.View entering={FadeInUp.duration(400).delay(100)} className="px-5 pt-5">
            <LinearGradient
              colors={['#6366F1', '#4F46E5', '#4338CA']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ borderRadius: 16, padding: 16 }}
            >
              <View className="flex-row items-center">
                <View className="w-12 h-12 rounded-full bg-white/20 items-center justify-center">
                  <HelpCircle size={24} color="#FFFFFF" />
                </View>
                <View className="flex-1 ml-3">
                  <Text className="text-white font-bold text-lg">Need Help?</Text>
                  <Text className="text-white/80 text-sm">
                    Our community has answers
                  </Text>
                </View>
              </View>
            </LinearGradient>
          </Animated.View>

          {/* Category Selection */}
          <Animated.View entering={FadeInUp.duration(400).delay(200)} className="px-5 mt-6">
            <Text className="text-lg font-bold text-warmBrown mb-4">
              What do you need help with?
            </Text>

            <View className="flex-row flex-wrap gap-3">
              {ASK_CATEGORIES.map((category) => {
                const isSelected = selectedCategory === category.id;
                const Icon = category.icon;

                return (
                  <Pressable
                    key={category.id}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setSelectedCategory(category.id);
                    }}
                    className={`flex-row items-center px-4 py-3 rounded-xl border-2 ${
                      isSelected
                        ? 'bg-indigo-50 border-indigo-500'
                        : 'bg-white border-gray-200'
                    }`}
                    style={{ minWidth: '45%' }}
                  >
                    <View
                      className="w-8 h-8 rounded-full items-center justify-center"
                      style={{ backgroundColor: isSelected ? category.color : '#F3F4F6' }}
                    >
                      <Icon size={16} color={isSelected ? '#FFFFFF' : category.color} />
                    </View>
                    <Text
                      className={`ml-2 font-medium text-sm ${
                        isSelected ? 'text-indigo-700' : 'text-warmBrown'
                      }`}
                    >
                      {category.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </Animated.View>

          {/* Question */}
          <Animated.View entering={FadeInUp.duration(400).delay(300)} className="px-5 mt-6">
            <Text className="text-lg font-bold text-warmBrown mb-4">Your Question</Text>

            <View className="bg-white rounded-xl p-4 mb-4">
              <Text className="text-gray-500 text-sm mb-2">Question *</Text>
              <TextInput
                placeholder="What would you like to know?"
                placeholderTextColor="#9CA3AF"
                value={question}
                onChangeText={setQuestion}
                className="text-warmBrown text-base"
              />
            </View>

            <View className="bg-white rounded-xl p-4 mb-4">
              <Text className="text-gray-500 text-sm mb-2">Additional Details (optional)</Text>
              <TextInput
                placeholder="Add any context that might help people answer..."
                placeholderTextColor="#9CA3AF"
                value={details}
                onChangeText={setDetails}
                multiline
                numberOfLines={4}
                className="text-warmBrown text-base"
                style={{ minHeight: 100, textAlignVertical: 'top' }}
              />
            </View>

            {/* Location */}
            <View className="bg-white rounded-xl p-4">
              <Text className="text-gray-500 text-sm mb-2">Location (for local questions)</Text>
              <View className="flex-row items-center">
                <MapPin size={20} color="#6B7280" />
                <TextInput
                  placeholder="Your city"
                  placeholderTextColor="#9CA3AF"
                  value={location}
                  onChangeText={setLocation}
                  className="flex-1 ml-2 text-warmBrown text-base"
                />
              </View>
            </View>
          </Animated.View>

          {/* Urgency */}
          <Animated.View entering={FadeInUp.duration(400).delay(400)} className="px-5 mt-6">
            <Text className="text-lg font-bold text-warmBrown mb-4">How urgent?</Text>

            <View className="flex-row gap-3">
              {URGENCY_LEVELS.map((level) => (
                <Pressable
                  key={level.id}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setUrgency(level.id);
                  }}
                  className={`flex-1 py-4 px-3 rounded-xl items-center ${
                    urgency === level.id ? 'bg-indigo-500' : 'bg-white'
                  }`}
                >
                  <Text
                    className={`font-semibold ${
                      urgency === level.id ? 'text-white' : 'text-warmBrown'
                    }`}
                  >
                    {level.label}
                  </Text>
                  <Text
                    className={`text-xs mt-1 ${
                      urgency === level.id ? 'text-white/70' : 'text-gray-500'
                    }`}
                  >
                    {level.description}
                  </Text>
                </Pressable>
              ))}
            </View>
          </Animated.View>

          {/* Submit Button */}
          <Animated.View entering={FadeInUp.duration(400).delay(500)} className="px-5 mt-8">
            <Pressable
              onPress={handleSubmit}
              disabled={!selectedCategory || !question.trim()}
              style={{ opacity: selectedCategory && question.trim() ? 1 : 0.5 }}
            >
              <LinearGradient
                colors={['#6366F1', '#4F46E5']}
                style={{ borderRadius: 16, paddingVertical: 16, alignItems: 'center' }}
              >
                <View className="flex-row items-center">
                  <HelpCircle size={20} color="#FFFFFF" />
                  <Text className="text-white font-bold text-lg ml-2">
                    Post Question
                  </Text>
                </View>
              </LinearGradient>
            </Pressable>

            <Text className="text-gray-500 text-center text-sm mt-3">
              Community members will be notified and can respond
            </Text>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
