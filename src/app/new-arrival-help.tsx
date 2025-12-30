import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ChevronLeft,
  MapPin,
  Home,
  Briefcase,
  GraduationCap,
  Heart,
  Car,
  CreditCard,
  Phone,
  FileText,
  Users,
  ChevronRight,
  Globe,
  Building2,
  Utensils,
  ShoppingBag,
  Bus,
  Stethoscope,
  Scale,
  MessageCircle,
} from 'lucide-react-native';
import { Image } from 'expo-image';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useStore } from '@/lib/store';

const RESOURCE_CATEGORIES = [
  {
    id: 'housing',
    title: 'Housing',
    icon: Home,
    color: '#D4673A',
    bgColor: 'bg-terracotta-50',
    description: 'Find apartments, roommates, and temporary housing',
  },
  {
    id: 'jobs',
    title: 'Jobs & Internships',
    icon: Briefcase,
    color: '#1B4D3E',
    bgColor: 'bg-forest-50',
    description: 'Part-time jobs, internships, and career resources',
  },
  {
    id: 'education',
    title: 'Education',
    icon: GraduationCap,
    color: '#C9A227',
    bgColor: 'bg-gold-50',
    description: 'School registration, ESL classes, tutoring',
  },
  {
    id: 'healthcare',
    title: 'Healthcare',
    icon: Stethoscope,
    color: '#E74C3C',
    bgColor: 'bg-red-50',
    description: 'Clinics, insurance, mental health support',
  },
  {
    id: 'transportation',
    title: 'Transportation',
    icon: Bus,
    color: '#3498DB',
    bgColor: 'bg-blue-50',
    description: 'Public transit, driving licenses, car buying',
  },
  {
    id: 'banking',
    title: 'Banking & Finance',
    icon: CreditCard,
    color: '#27AE60',
    bgColor: 'bg-green-50',
    description: 'Opening accounts, building credit, money transfers',
  },
  {
    id: 'legal',
    title: 'Legal & Immigration',
    icon: Scale,
    color: '#8E44AD',
    bgColor: 'bg-purple-50',
    description: 'Visa help, legal aid, document assistance',
  },
  {
    id: 'community',
    title: 'Community',
    icon: Users,
    color: '#F39C12',
    bgColor: 'bg-orange-50',
    description: 'African communities, cultural centers, faith groups',
  },
];

const QUICK_TIPS = [
  {
    title: 'Get a Local Phone Number',
    description: 'A local SIM card makes everything easier - from job applications to apartment hunting.',
    icon: Phone,
  },
  {
    title: 'Open a Bank Account',
    description: 'Most banks require ID and proof of address. Some accept student IDs.',
    icon: CreditCard,
  },
  {
    title: 'Learn the Transit System',
    description: 'Download local transit apps and get a monthly pass if you\'ll use it often.',
    icon: Bus,
  },
  {
    title: 'Connect with the Community',
    description: 'Find African student associations and community groups - they\'ve been through this!',
    icon: Users,
  },
];

const FEATURED_RESOURCES = [
  {
    id: '1',
    title: 'International Student Office',
    type: 'University Resource',
    description: 'Your first stop for visa questions, work permits, and campus support',
    icon: GraduationCap,
  },
  {
    id: '2',
    title: 'African Student Association',
    type: 'Community',
    description: 'Connect with other African students, cultural events, and mentorship',
    icon: Users,
  },
  {
    id: '3',
    title: 'Local Food Pantry',
    type: 'Essential Support',
    description: 'Free groceries while you get settled - no questions asked',
    icon: Utensils,
  },
];

export default function NewArrivalHelpScreen() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const currentUser = useStore((s) => s.currentUser);
  const selectedLocation = useStore((s) => s.selectedLocation);
  const currentCommunity = useStore((s) => s.currentCommunity);

  const cityName = selectedLocation?.city || currentCommunity?.city || 'your city';

  const handleCategoryPress = (categoryId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedCategory(categoryId);
    // In a full implementation, this would navigate to a detailed category page
  };

  const handleAskCommunity = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/(tabs)/create');
  };

  return (
    <View className="flex-1 bg-cream">
      <SafeAreaView edges={['top']} className="flex-1">
        {/* Header */}
        <Animated.View entering={FadeIn.duration(300)} className="px-5 pt-4 pb-2">
          <View className="flex-row items-center justify-between">
            <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.back(); }} className="bg-white rounded-full p-2 shadow-sm">
              <ChevronLeft size={24} color="#2D1F1A" />
            </Pressable>
            <Text className="text-lg font-bold text-warmBrown">New Arrival Guide</Text>
            <View className="w-10" />
          </View>
        </Animated.View>

        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {/* Welcome Banner */}
          <Animated.View entering={FadeInUp.duration(400).delay(100)} className="mx-5 mt-4">
            <LinearGradient
              colors={['#D4673A', '#B85430']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ borderRadius: 20, padding: 20 }}
            >
              <View className="flex-row items-center mb-3">
                <MapPin size={20} color="#FFFFFF" />
                <Text className="text-white/90 ml-2 font-medium">{cityName}</Text>
              </View>
              <Text className="text-white text-2xl font-bold mb-2">
                Welcome to Your New Home!
              </Text>
              <Text className="text-white/90 leading-5">
                We know moving to a new country can be overwhelming. This guide will help you navigate {cityName} and connect with resources tailored for African students and professionals.
              </Text>
            </LinearGradient>
          </Animated.View>

          {/* Quick Tips */}
          <Animated.View entering={FadeInUp.duration(400).delay(200)} className="mt-6">
            <Text className="text-lg font-bold text-warmBrown px-5 mb-3">First Steps</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20 }} style={{ flexGrow: 0 }}>
              {QUICK_TIPS.map((tip, index) => (
                <View key={index} className="bg-white rounded-2xl p-4 mr-3 w-64">
                  <View className="flex-row items-center mb-2">
                    <View className="bg-terracotta-50 rounded-full p-2">
                      <tip.icon size={18} color="#D4673A" />
                    </View>
                    <Text className="text-warmBrown font-bold ml-2 flex-1" numberOfLines={1}>{tip.title}</Text>
                  </View>
                  <Text className="text-gray-600 text-sm leading-5">{tip.description}</Text>
                </View>
              ))}
            </ScrollView>
          </Animated.View>

          {/* Resource Categories */}
          <Animated.View entering={FadeInUp.duration(400).delay(300)} className="mt-6 px-5">
            <Text className="text-lg font-bold text-warmBrown mb-3">Find Resources</Text>
            <View className="flex-row flex-wrap justify-between">
              {RESOURCE_CATEGORIES.map((category) => (
                <Pressable
                  key={category.id}
                  onPress={() => handleCategoryPress(category.id)}
                  className="w-[48%] bg-white rounded-2xl p-4 mb-3"
                >
                  <View className={`${category.bgColor} rounded-full p-2.5 self-start mb-2`}>
                    <category.icon size={22} color={category.color} />
                  </View>
                  <Text className="text-warmBrown font-bold">{category.title}</Text>
                  <Text className="text-gray-500 text-xs mt-1" numberOfLines={2}>{category.description}</Text>
                </Pressable>
              ))}
            </View>
          </Animated.View>

          {/* Featured Resources */}
          <Animated.View entering={FadeInUp.duration(400).delay(400)} className="mt-4 px-5">
            <Text className="text-lg font-bold text-warmBrown mb-3">Featured Resources</Text>
            {FEATURED_RESOURCES.map((resource) => (
              <Pressable
                key={resource.id}
                onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
                className="bg-white rounded-2xl p-4 mb-3 flex-row items-center"
              >
                <View className="bg-forest-50 rounded-full p-3">
                  <resource.icon size={24} color="#1B4D3E" />
                </View>
                <View className="flex-1 ml-3">
                  <Text className="text-warmBrown font-bold">{resource.title}</Text>
                  <Text className="text-terracotta-500 text-xs font-medium">{resource.type}</Text>
                  <Text className="text-gray-500 text-sm mt-1" numberOfLines={2}>{resource.description}</Text>
                </View>
                <ChevronRight size={20} color="#8B7355" />
              </Pressable>
            ))}
          </Animated.View>

          {/* Ask Community */}
          <Animated.View entering={FadeInUp.duration(400).delay(500)} className="mx-5 mt-4 mb-6">
            <View className="bg-gold-50 rounded-2xl p-5">
              <View className="flex-row items-center mb-3">
                <MessageCircle size={24} color="#C9A227" />
                <Text className="text-warmBrown font-bold text-lg ml-2">Can't Find What You Need?</Text>
              </View>
              <Text className="text-gray-600 mb-4">
                Ask the AfroConnect community! Someone in {cityName} has probably been through the same situation and can help.
              </Text>
              <Pressable onPress={handleAskCommunity}>
                <LinearGradient
                  colors={['#C9A227', '#A6841F']}
                  style={{ borderRadius: 12, paddingVertical: 14, alignItems: 'center' }}
                >
                  <Text className="text-white font-bold">Ask the Community</Text>
                </LinearGradient>
              </Pressable>
            </View>
          </Animated.View>

          {/* Emergency Contacts */}
          <Animated.View entering={FadeInUp.duration(400).delay(600)} className="mx-5 mb-8">
            <Text className="text-lg font-bold text-warmBrown mb-3">Emergency Contacts</Text>
            <View className="bg-red-50 rounded-2xl p-4">
              <View className="flex-row items-center justify-between mb-3">
                <View className="flex-row items-center">
                  <Phone size={18} color="#E74C3C" />
                  <Text className="text-warmBrown font-semibold ml-2">Emergency</Text>
                </View>
                <Text className="text-red-600 font-bold">911</Text>
              </View>
              <View className="flex-row items-center justify-between mb-3">
                <View className="flex-row items-center">
                  <Phone size={18} color="#E74C3C" />
                  <Text className="text-warmBrown font-semibold ml-2">Non-Emergency Police</Text>
                </View>
                <Text className="text-gray-600 font-medium">311</Text>
              </View>
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center">
                  <Heart size={18} color="#E74C3C" />
                  <Text className="text-warmBrown font-semibold ml-2">Crisis Hotline</Text>
                </View>
                <Text className="text-gray-600 font-medium">988</Text>
              </View>
            </View>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
