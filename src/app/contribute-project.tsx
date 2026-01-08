import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import {
  ArrowLeft,
  Heart,
  DollarSign,
  Clock,
  Users,
  Target,
  Check,
  Share2,
  Calendar,
  MapPin,
} from 'lucide-react-native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useStore } from '@/lib/store';

// Mock project data
const PROJECTS = {
  p1: {
    id: 'p1',
    title: 'Community Garden Project',
    description: 'Building a community garden in Aurora to grow African vegetables and herbs. The space will serve as both a food source and cultural gathering spot.',
    image: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&h=400&fit=crop',
    raised: 2340,
    goal: 5000,
    contributors: 47,
    daysLeft: 12,
    organizer: {
      name: 'Amara Johnson',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=face',
    },
    location: 'Aurora, CO',
    updates: [
      { date: 'Jan 5', text: 'We secured the land! Thank you all for your support.' },
      { date: 'Jan 2', text: 'Reached 50% of our goal! Let\'s keep going!' },
    ],
  },
  p2: {
    id: 'p2',
    title: 'Youth Soccer League',
    description: 'Starting a youth soccer league to keep our kids active and connected to the community.',
    image: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&h=400&fit=crop',
    raised: 1800,
    goal: 3000,
    contributors: 32,
    daysLeft: 8,
    organizer: {
      name: 'Kwame Asante',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face',
    },
    location: 'Denver, CO',
    updates: [
      { date: 'Jan 4', text: 'Found coaches for all age groups!' },
    ],
  },
};

const CONTRIBUTION_AMOUNTS = [10, 25, 50, 100, 250, 500];

export default function ContributeProjectScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const currentUser = useStore((s) => s.currentUser);
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  // Get project data
  const project = PROJECTS[id as keyof typeof PROJECTS] || PROJECTS.p1;

  const progress = Math.round((project.raised / project.goal) * 100);

  const handleContribute = () => {
    const amount = selectedAmount || parseInt(customAmount);
    if (!amount || amount <= 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setShowSuccess(true);

    setTimeout(() => {
      router.back();
    }, 2500);
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
            <Heart size={40} color="#FFFFFF" fill="#FFFFFF" />
          </LinearGradient>
          <Text className="text-warmBrown text-2xl font-bold mt-6">
            Thank You!
          </Text>
          <Text className="text-gray-500 text-center mt-2">
            Your contribution makes our community stronger.
          </Text>
          <Text className="text-green-600 font-bold text-xl mt-4">
            ${selectedAmount || customAmount} contributed
          </Text>
        </Animated.View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-cream">
      <SafeAreaView edges={['top']} className="flex-1">
        {/* Header Image */}
        <View className="relative">
          <Image
            source={{ uri: project.image }}
            style={{ width: '100%', height: 200 }}
            contentFit="cover"
          />
          <LinearGradient
            colors={['rgba(0,0,0,0.5)', 'transparent', 'rgba(0,0,0,0.7)']}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
            }}
          />

          {/* Back Button */}
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.back();
            }}
            className="absolute top-4 left-4 bg-black/50 rounded-full p-2"
          >
            <ArrowLeft size={24} color="#FFFFFF" />
          </Pressable>

          {/* Share Button */}
          <Pressable
            onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
            className="absolute top-4 right-4 bg-black/50 rounded-full p-2"
          >
            <Share2 size={20} color="#FFFFFF" />
          </Pressable>
        </View>

        <ScrollView
          className="flex-1 -mt-6"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          {/* Main Card */}
          <View className="bg-white mx-4 rounded-2xl p-5 shadow-lg">
            <Text className="text-warmBrown font-bold text-xl">{project.title}</Text>

            {/* Progress */}
            <View className="mt-4">
              <View className="flex-row justify-between mb-2">
                <Text className="text-green-600 font-bold text-2xl">
                  ${project.raised.toLocaleString()}
                </Text>
                <Text className="text-gray-500">
                  of ${project.goal.toLocaleString()} goal
                </Text>
              </View>
              <View className="h-3 bg-gray-200 rounded-full overflow-hidden">
                <LinearGradient
                  colors={['#10B981', '#059669']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{
                    height: '100%',
                    width: `${progress}%`,
                    borderRadius: 999,
                  }}
                />
              </View>
              <View className="flex-row items-center justify-between mt-3">
                <View className="flex-row items-center">
                  <Users size={16} color="#6B7280" />
                  <Text className="text-gray-600 text-sm ml-1">
                    {project.contributors} contributors
                  </Text>
                </View>
                <View className="flex-row items-center">
                  <Clock size={16} color="#6B7280" />
                  <Text className="text-gray-600 text-sm ml-1">
                    {project.daysLeft} days left
                  </Text>
                </View>
              </View>
            </View>

            {/* Organizer */}
            <View className="flex-row items-center mt-4 pt-4 border-t border-gray-100">
              <Image
                source={{ uri: project.organizer.avatar }}
                style={{ width: 40, height: 40, borderRadius: 20 }}
                contentFit="cover"
              />
              <View className="ml-3">
                <Text className="text-gray-500 text-sm">Organized by</Text>
                <Text className="text-warmBrown font-semibold">{project.organizer.name}</Text>
              </View>
              <View className="flex-row items-center ml-auto">
                <MapPin size={14} color="#9CA3AF" />
                <Text className="text-gray-500 text-sm ml-1">{project.location}</Text>
              </View>
            </View>
          </View>

          {/* Description */}
          <Animated.View entering={FadeInUp.duration(400).delay(100)} className="px-4 mt-4">
            <Text className="text-lg font-bold text-warmBrown mb-2">About This Project</Text>
            <Text className="text-gray-600 leading-6">{project.description}</Text>
          </Animated.View>

          {/* Updates */}
          {project.updates.length > 0 && (
            <Animated.View entering={FadeInUp.duration(400).delay(200)} className="px-4 mt-6">
              <Text className="text-lg font-bold text-warmBrown mb-3">Recent Updates</Text>
              {project.updates.map((update, index) => (
                <View key={index} className="flex-row items-start mb-3">
                  <View className="w-8 h-8 rounded-full bg-green-100 items-center justify-center">
                    <Calendar size={16} color="#059669" />
                  </View>
                  <View className="flex-1 ml-3">
                    <Text className="text-gray-500 text-sm">{update.date}</Text>
                    <Text className="text-warmBrown">{update.text}</Text>
                  </View>
                </View>
              ))}
            </Animated.View>
          )}

          {/* Contribution Amount */}
          <Animated.View entering={FadeInUp.duration(400).delay(300)} className="px-4 mt-6">
            <Text className="text-lg font-bold text-warmBrown mb-4">Choose Amount</Text>

            <View className="flex-row flex-wrap gap-3">
              {CONTRIBUTION_AMOUNTS.map((amount) => (
                <Pressable
                  key={amount}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSelectedAmount(amount);
                    setCustomAmount('');
                  }}
                  className={`px-6 py-4 rounded-xl border-2 ${
                    selectedAmount === amount
                      ? 'bg-green-50 border-green-500'
                      : 'bg-white border-gray-200'
                  }`}
                  style={{ minWidth: '30%' }}
                >
                  <Text
                    className={`font-bold text-lg text-center ${
                      selectedAmount === amount ? 'text-green-600' : 'text-warmBrown'
                    }`}
                  >
                    ${amount}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Custom Amount */}
            <View className="mt-4">
              <Text className="text-gray-500 text-sm mb-2">Or enter custom amount</Text>
              <View className="flex-row items-center bg-white rounded-xl border border-gray-200 px-4">
                <DollarSign size={20} color="#6B7280" />
                <TextInput
                  placeholder="Enter amount"
                  placeholderTextColor="#9CA3AF"
                  value={customAmount}
                  onChangeText={(text) => {
                    setCustomAmount(text);
                    setSelectedAmount(null);
                  }}
                  keyboardType="number-pad"
                  className="flex-1 py-4 ml-2 text-warmBrown text-lg"
                />
              </View>
            </View>
          </Animated.View>

          {/* Contribute Button */}
          <Animated.View entering={FadeInUp.duration(400).delay(400)} className="px-4 mt-8">
            <Pressable
              onPress={handleContribute}
              disabled={!selectedAmount && !customAmount}
              style={{ opacity: selectedAmount || customAmount ? 1 : 0.5 }}
            >
              <LinearGradient
                colors={['#10B981', '#059669']}
                style={{ borderRadius: 16, paddingVertical: 16, alignItems: 'center' }}
              >
                <View className="flex-row items-center">
                  <Heart size={20} color="#FFFFFF" />
                  <Text className="text-white font-bold text-lg ml-2">
                    Contribute {selectedAmount ? `$${selectedAmount}` : customAmount ? `$${customAmount}` : ''}
                  </Text>
                </View>
              </LinearGradient>
            </Pressable>

            <Text className="text-gray-500 text-center text-sm mt-3">
              100% of your contribution goes to the project
            </Text>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
