import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, Pressable, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import {
  ArrowLeft,
  Search,
  Heart,
  MessageCircle,
  MapPin,
  Star,
  Filter,
  Home,
  Briefcase,
  GraduationCap,
  Car,
  ShoppingBag,
  Church,
  Users,
  Check,
} from 'lucide-react-native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useStore } from '@/lib/store';
import { HelperBadge, RoleBadges } from '@/components/RoleBadge';

// Helper categories matching what newcomers need
const HELPER_SKILLS = [
  { id: 'all', label: 'All', icon: Users },
  { id: 'housing', label: 'Housing', icon: Home },
  { id: 'jobs', label: 'Jobs', icon: Briefcase },
  { id: 'schools', label: 'Schools', icon: GraduationCap },
  { id: 'healthcare', label: 'Healthcare', icon: Heart },
  { id: 'transport', label: 'Transport', icon: Car },
  { id: 'shopping', label: 'Shopping', icon: ShoppingBag },
  { id: 'faith', label: 'Faith', icon: Church },
];

// Mock helpers data - in real app this would come from the database
const MOCK_HELPERS = [
  {
    id: 'h1',
    name: 'Amara Johnson',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=face',
    location: 'Aurora, CO',
    bio: 'Lived here for 5 years. Happy to help with housing and job search!',
    helperSkills: ['housing', 'jobs', 'community'],
    helpedCount: 23,
    rating: 4.9,
    communityRoles: [
      { role: 'welcomer' as const, earnedAt: '2024-01-01', helpedCount: 23 },
      { role: 'connector' as const, earnedAt: '2024-03-01', helpedCount: 15 },
    ],
    isOnline: true,
    languages: ['English', 'French'],
  },
  {
    id: 'h2',
    name: 'Kwame Asante',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face',
    location: 'Aurora, CO',
    bio: 'Originally from Ghana. I know all the African grocery stores and restaurants!',
    helperSkills: ['shopping', 'faith', 'community'],
    helpedCount: 45,
    rating: 5.0,
    communityRoles: [
      { role: 'fixer' as const, earnedAt: '2023-06-01', helpedCount: 45 },
      { role: 'story_keeper' as const, earnedAt: '2024-01-01', helpedCount: 12 },
    ],
    isOnline: false,
    languages: ['English', 'Twi', 'Ga'],
  },
  {
    id: 'h3',
    name: 'Fatima Hassan',
    avatar: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=200&h=200&fit=crop&crop=face',
    location: 'Aurora, CO',
    bio: 'Nurse and mother of 3. Can help with healthcare and schools.',
    helperSkills: ['healthcare', 'schools', 'community'],
    helpedCount: 31,
    rating: 4.8,
    communityRoles: [
      { role: 'mentor' as const, earnedAt: '2024-02-01', helpedCount: 31 },
    ],
    isOnline: true,
    languages: ['English', 'Arabic', 'Somali'],
  },
  {
    id: 'h4',
    name: 'Carlos Martinez',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face',
    location: 'Aurora, CO',
    bio: 'Real estate agent. I can help you find the perfect apartment or house.',
    helperSkills: ['housing', 'transport'],
    helpedCount: 67,
    rating: 4.7,
    communityRoles: [
      { role: 'business_builder' as const, earnedAt: '2023-09-01', helpedCount: 67 },
    ],
    isOnline: false,
    languages: ['English', 'Spanish'],
  },
  {
    id: 'h5',
    name: 'Priya Sharma',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=face',
    location: 'Aurora, CO',
    bio: 'Software engineer. Happy to help with job applications and tech career advice.',
    helperSkills: ['jobs', 'community'],
    helpedCount: 19,
    rating: 4.9,
    communityRoles: [
      { role: 'mentor' as const, earnedAt: '2024-04-01', helpedCount: 19 },
      { role: 'connector' as const, earnedAt: '2024-05-01', helpedCount: 8 },
    ],
    isOnline: true,
    languages: ['English', 'Hindi', 'Telugu'],
  },
];

export default function FindHelpersScreen() {
  const currentUser = useStore((s) => s.currentUser);
  const selectedLocation = useStore((s) => s.selectedLocation);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSkill, setSelectedSkill] = useState('all');

  const filteredHelpers = useMemo(() => {
    return MOCK_HELPERS.filter((helper) => {
      // Filter by search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (
          !helper.name.toLowerCase().includes(query) &&
          !helper.bio.toLowerCase().includes(query) &&
          !helper.languages.some((l) => l.toLowerCase().includes(query))
        ) {
          return false;
        }
      }

      // Filter by skill
      if (selectedSkill !== 'all' && !helper.helperSkills.includes(selectedSkill)) {
        return false;
      }

      return true;
    });
  }, [searchQuery, selectedSkill]);

  const handleContactHelper = (helperId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Navigate to messaging with this helper
    router.push({
      pathname: '/messages',
      params: { startConversation: helperId },
    });
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
          <View className="flex-1">
            <Text className="text-xl font-bold text-warmBrown">Find Helpers</Text>
            <Text className="text-gray-500 text-sm">
              {selectedLocation?.city || 'Your City'}
            </Text>
          </View>
        </Animated.View>

        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          {/* Search */}
          <Animated.View entering={FadeInUp.duration(400).delay(100)} className="px-5 pt-4">
            <View className="flex-row items-center bg-white rounded-xl px-4 py-3 shadow-sm">
              <Search size={20} color="#9CA3AF" />
              <TextInput
                placeholder="Search by name, skill, or language..."
                placeholderTextColor="#9CA3AF"
                value={searchQuery}
                onChangeText={setSearchQuery}
                className="flex-1 ml-3 text-warmBrown text-base"
              />
            </View>
          </Animated.View>

          {/* Skill Filters */}
          <Animated.View entering={FadeInUp.duration(400).delay(200)} className="mt-4">
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 20 }}
            >
              {HELPER_SKILLS.map((skill) => {
                const isSelected = selectedSkill === skill.id;
                return (
                  <Pressable
                    key={skill.id}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setSelectedSkill(skill.id);
                    }}
                    className={`flex-row items-center px-4 py-2.5 rounded-full mr-2 ${
                      isSelected ? 'bg-green-500' : 'bg-white'
                    }`}
                  >
                    <skill.icon
                      size={16}
                      color={isSelected ? '#FFFFFF' : '#6B7280'}
                    />
                    <Text
                      className={`ml-2 font-medium ${
                        isSelected ? 'text-white' : 'text-gray-600'
                      }`}
                    >
                      {skill.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </Animated.View>

          {/* Stats */}
          <Animated.View
            entering={FadeInUp.duration(400).delay(300)}
            className="px-5 mt-4"
          >
            <View className="bg-green-50 rounded-xl p-4 flex-row items-center">
              <Heart size={20} color="#059669" fill="#059669" />
              <Text className="text-green-700 font-medium ml-2">
                {filteredHelpers.length} helpers ready to welcome you
              </Text>
            </View>
          </Animated.View>

          {/* Helpers List */}
          <Animated.View entering={FadeInUp.duration(400).delay(400)} className="px-5 mt-4">
            {filteredHelpers.map((helper, index) => (
              <Animated.View
                key={helper.id}
                entering={FadeInUp.duration(300).delay(index * 50)}
              >
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    // Could navigate to helper profile
                  }}
                  className="bg-white rounded-2xl p-4 mb-3 shadow-sm"
                >
                  {/* Header */}
                  <View className="flex-row">
                    <View className="relative">
                      <Image
                        source={{ uri: helper.avatar }}
                        style={{
                          width: 60,
                          height: 60,
                          borderRadius: 30,
                        }}
                        contentFit="cover"
                      />
                      {helper.isOnline && (
                        <View className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-white" />
                      )}
                    </View>

                    <View className="flex-1 ml-3">
                      <View className="flex-row items-center">
                        <Text className="text-warmBrown font-bold text-lg">
                          {helper.name}
                        </Text>
                        {helper.rating >= 4.8 && (
                          <View className="flex-row items-center ml-2 bg-amber-100 rounded-full px-2 py-0.5">
                            <Star size={12} color="#F59E0B" fill="#F59E0B" />
                            <Text className="text-amber-700 text-xs font-semibold ml-0.5">
                              {helper.rating}
                            </Text>
                          </View>
                        )}
                      </View>

                      <View className="flex-row items-center mt-1">
                        <MapPin size={14} color="#9CA3AF" />
                        <Text className="text-gray-500 text-sm ml-1">
                          {helper.location}
                        </Text>
                        <Text className="text-gray-400 mx-2">•</Text>
                        <Heart size={14} color="#10B981" fill="#10B981" />
                        <Text className="text-green-600 text-sm ml-1">
                          Helped {helper.helpedCount}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Bio */}
                  <Text className="text-gray-600 mt-3 leading-5">{helper.bio}</Text>

                  {/* Languages */}
                  <View className="flex-row items-center mt-3">
                    <Text className="text-gray-500 text-sm">Speaks: </Text>
                    <Text className="text-gray-700 text-sm font-medium">
                      {helper.languages.join(', ')}
                    </Text>
                  </View>

                  {/* Community Roles */}
                  <View className="mt-3">
                    <RoleBadges roles={helper.communityRoles} size="small" maxDisplay={3} />
                  </View>

                  {/* Helper Skills */}
                  <View className="flex-row flex-wrap gap-2 mt-3">
                    {helper.helperSkills.map((skillId) => {
                      const skill = HELPER_SKILLS.find((s) => s.id === skillId);
                      if (!skill) return null;
                      return (
                        <View
                          key={skillId}
                          className="flex-row items-center bg-gray-100 rounded-full px-3 py-1"
                        >
                          <skill.icon size={12} color="#6B7280" />
                          <Text className="text-gray-600 text-xs ml-1">
                            {skill.label}
                          </Text>
                        </View>
                      );
                    })}
                  </View>

                  {/* Contact Button */}
                  <Pressable
                    onPress={() => handleContactHelper(helper.id)}
                    className="bg-green-500 rounded-xl py-3 mt-4 flex-row items-center justify-center"
                  >
                    <MessageCircle size={18} color="#FFFFFF" />
                    <Text className="text-white font-semibold ml-2">
                      Send Message
                    </Text>
                  </Pressable>
                </Pressable>
              </Animated.View>
            ))}

            {filteredHelpers.length === 0 && (
              <View className="items-center py-12">
                <View className="w-16 h-16 rounded-full bg-gray-100 items-center justify-center mb-4">
                  <Users size={28} color="#9CA3AF" />
                </View>
                <Text className="text-gray-900 font-semibold text-lg">
                  No helpers found
                </Text>
                <Text className="text-gray-500 text-center mt-1 px-8">
                  Try adjusting your filters or search query
                </Text>
              </View>
            )}
          </Animated.View>

          {/* Become a Helper CTA */}
          {!currentUser?.isHelper && (
            <Animated.View
              entering={FadeInUp.duration(400).delay(500)}
              className="px-5 mt-6"
            >
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  router.push('/become-helper');
                }}
              >
                <LinearGradient
                  colors={['#10B981', '#059669']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{
                    borderRadius: 16,
                    padding: 20,
                    flexDirection: 'row',
                    alignItems: 'center',
                  }}
                >
                  <View className="w-12 h-12 rounded-full bg-white/20 items-center justify-center">
                    <Heart size={24} color="#FFFFFF" />
                  </View>
                  <View className="flex-1 ml-3">
                    <Text className="text-white font-bold text-lg">
                      Become a Helper
                    </Text>
                    <Text className="text-white/80 text-sm mt-0.5">
                      Earn the Welcomer role by helping newcomers
                    </Text>
                  </View>
                </LinearGradient>
              </Pressable>
            </Animated.View>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
