import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowLeft,
  Camera,
  Image as ImageIcon,
  Send,
  Check,
  Users,
  Heart,
  Briefcase,
  GraduationCap,
  Home,
} from 'lucide-react-native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useStore } from '@/lib/store';

const CONTRIBUTION_TYPES = [
  { id: 'helped_newcomer', label: 'Helped a newcomer settle in', icon: Heart, points: 10, missionId: 'm1' },
  { id: 'gave_directions', label: 'Gave directions or local tips', icon: Users, points: 5, missionId: 'm1' },
  { id: 'hosted_event', label: 'Hosted a community event', icon: Users, points: 25, missionId: 'm5' },
  { id: 'business_review', label: 'Reviewed a local business', icon: Briefcase, points: 5, missionId: 'm2' },
  { id: 'business_visit', label: 'Visited & supported a business', icon: Briefcase, points: 10, missionId: 'm2' },
  { id: 'mentored_student', label: 'Mentored a student', icon: GraduationCap, points: 20, missionId: 'm3' },
  { id: 'career_advice', label: 'Gave career advice', icon: GraduationCap, points: 10, missionId: 'm3' },
  { id: 'housing_help', label: 'Helped find housing', icon: Home, points: 15, missionId: 'm4' },
  { id: 'connected_roommate', label: 'Connected roommates', icon: Home, points: 10, missionId: 'm4' },
];

export default function LogContributionScreen() {
  const { missionId } = useLocalSearchParams<{ missionId: string }>();
  const currentUser = useStore((s) => s.currentUser);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  // Filter contribution types by mission if provided
  const availableTypes = missionId
    ? CONTRIBUTION_TYPES.filter((t) => t.missionId === missionId)
    : CONTRIBUTION_TYPES;

  const handleSubmit = () => {
    if (!selectedType) return;

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
            colors={['#10B981', '#059669']}
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
            Contribution Logged!
          </Text>
          <Text className="text-gray-500 text-center mt-2">
            Thank you for making our community stronger.
          </Text>
          <Text className="text-purple-600 font-bold text-lg mt-4">
            +{CONTRIBUTION_TYPES.find((t) => t.id === selectedType)?.points || 0} points
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
          <Text className="text-xl font-bold text-warmBrown">Log Contribution</Text>
        </Animated.View>

        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          {/* Info */}
          <Animated.View entering={FadeInUp.duration(400).delay(100)} className="px-5 pt-5">
            <Text className="text-gray-600 leading-6">
              Log your contribution to earn points and help track our community's progress.
            </Text>
          </Animated.View>

          {/* Contribution Types */}
          <Animated.View entering={FadeInUp.duration(400).delay(200)} className="px-5 mt-6">
            <Text className="text-lg font-bold text-warmBrown mb-4">
              What did you do?
            </Text>

            {availableTypes.map((type, index) => {
              const isSelected = selectedType === type.id;
              const Icon = type.icon;

              return (
                <Pressable
                  key={type.id}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSelectedType(type.id);
                  }}
                  className={`flex-row items-center p-4 rounded-xl border-2 mb-3 ${
                    isSelected
                      ? 'bg-purple-50 border-purple-500'
                      : 'bg-white border-gray-200'
                  }`}
                >
                  <View
                    className={`w-10 h-10 rounded-full items-center justify-center ${
                      isSelected ? 'bg-purple-500' : 'bg-gray-100'
                    }`}
                  >
                    <Icon size={20} color={isSelected ? '#FFFFFF' : '#6B7280'} />
                  </View>
                  <Text
                    className={`flex-1 ml-3 font-medium ${
                      isSelected ? 'text-purple-700' : 'text-warmBrown'
                    }`}
                  >
                    {type.label}
                  </Text>
                  <View
                    className={`px-3 py-1 rounded-full ${
                      isSelected ? 'bg-purple-500' : 'bg-gray-100'
                    }`}
                  >
                    <Text
                      className={`text-sm font-bold ${
                        isSelected ? 'text-white' : 'text-gray-600'
                      }`}
                    >
                      +{type.points}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </Animated.View>

          {/* Description */}
          <Animated.View entering={FadeInUp.duration(400).delay(300)} className="px-5 mt-6">
            <Text className="text-lg font-bold text-warmBrown mb-2">
              Add details (optional)
            </Text>
            <Text className="text-gray-500 text-sm mb-3">
              Share more about how you helped
            </Text>
            <View className="bg-white rounded-xl p-4 border border-gray-200">
              <TextInput
                placeholder="E.g., Helped Amina find an apartment near downtown..."
                placeholderTextColor="#9CA3AF"
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
                className="text-warmBrown text-base"
                style={{ minHeight: 100, textAlignVertical: 'top' }}
              />
            </View>
          </Animated.View>

          {/* Add Photo */}
          <Animated.View entering={FadeInUp.duration(400).delay(400)} className="px-5 mt-6">
            <Pressable className="flex-row items-center bg-white rounded-xl p-4 border border-gray-200">
              <View className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center">
                <Camera size={20} color="#6B7280" />
              </View>
              <Text className="text-gray-600 ml-3">Add a photo (optional)</Text>
            </Pressable>
          </Animated.View>

          {/* Submit Button */}
          <Animated.View entering={FadeInUp.duration(400).delay(500)} className="px-5 mt-8">
            <Pressable
              onPress={handleSubmit}
              disabled={!selectedType}
              style={{ opacity: selectedType ? 1 : 0.5 }}
            >
              <LinearGradient
                colors={['#7C3AED', '#6D28D9']}
                style={{ borderRadius: 16, paddingVertical: 16, alignItems: 'center' }}
              >
                <View className="flex-row items-center">
                  <Send size={20} color="#FFFFFF" />
                  <Text className="text-white font-bold text-lg ml-2">
                    Submit Contribution
                  </Text>
                </View>
              </LinearGradient>
            </Pressable>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
