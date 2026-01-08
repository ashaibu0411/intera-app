import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import {
  ArrowLeft,
  Plane,
  Users,
  HelpCircle,
  MapPin,
  Home,
  Briefcase,
  GraduationCap,
  Heart,
  Car,
  ShoppingBag,
  Church,
  Check,
  ChevronRight,
} from 'lucide-react-native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useStore } from '@/lib/store';

// What newcomers typically need help with
const HELP_CATEGORIES = [
  { id: 'housing', label: 'Housing', icon: Home, description: 'Finding apartments, roommates, furniture' },
  { id: 'jobs', label: 'Jobs', icon: Briefcase, description: 'Job search, resume help, networking' },
  { id: 'schools', label: 'Schools', icon: GraduationCap, description: 'Schools for kids, language classes' },
  { id: 'healthcare', label: 'Healthcare', icon: Heart, description: 'Doctors, insurance, clinics' },
  { id: 'transport', label: 'Transport', icon: Car, description: 'Transit, drivers license, car buying' },
  { id: 'shopping', label: 'Shopping', icon: ShoppingBag, description: 'Grocery stores, cultural markets' },
  { id: 'faith', label: 'Faith', icon: Church, description: 'Churches, mosques, temples' },
  { id: 'community', label: 'Community', icon: Users, description: 'Meeting people, events, groups' },
];

export default function ArrivalModeScreen() {
  const currentUser = useStore((s) => s.currentUser);
  const setCurrentUser = useStore((s) => s.setCurrentUser);
  const selectedLocation = useStore((s) => s.selectedLocation);

  const [selectedHelp, setSelectedHelp] = useState<string[]>(
    currentUser?.lookingForHelp || []
  );
  const [isActivated, setIsActivated] = useState(currentUser?.isNewArrival || false);

  // Calculate days remaining
  const daysRemaining = React.useMemo(() => {
    if (!currentUser?.arrivalDate) return 30;
    const arrivalDate = new Date(currentUser.arrivalDate);
    const now = new Date();
    const diff = 30 - Math.floor((now.getTime() - arrivalDate.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
  }, [currentUser?.arrivalDate]);

  const toggleHelpCategory = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedHelp((prev) =>
      prev.includes(id) ? prev.filter((h) => h !== id) : [...prev, id]
    );
  };

  const handleActivate = () => {
    if (!currentUser) {
      router.push('/signup');
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const updatedUser = {
      ...currentUser,
      isNewArrival: true,
      arrivalDate: new Date().toISOString(),
      arrivalCity: selectedLocation?.city || currentUser.location?.split(',')[0],
      lookingForHelp: selectedHelp,
    };

    setCurrentUser(updatedUser);
    setIsActivated(true);
  };

  const handleDeactivate = () => {
    if (!currentUser) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const updatedUser = {
      ...currentUser,
      isNewArrival: false,
      arrivalDate: undefined,
      arrivalCity: undefined,
      lookingForHelp: undefined,
    };

    setCurrentUser(updatedUser);
    setIsActivated(false);
  };

  const handleUpdatePreferences = () => {
    if (!currentUser) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const updatedUser = {
      ...currentUser,
      lookingForHelp: selectedHelp,
    };

    setCurrentUser(updatedUser);
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
          <Text className="text-xl font-bold text-warmBrown">Arrival Mode</Text>
        </Animated.View>

        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          {/* Hero Section */}
          <Animated.View entering={FadeInUp.duration(400).delay(100)} className="px-5 pt-5">
            <LinearGradient
              colors={['#F59E0B', '#D97706', '#B45309']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ borderRadius: 24, padding: 24 }}
            >
              <View className="flex-row items-center">
                <View className="w-16 h-16 rounded-full bg-white/20 items-center justify-center">
                  <Plane size={32} color="#FFFFFF" />
                </View>
                <View className="flex-1 ml-4">
                  <Text className="text-white text-2xl font-bold">
                    {isActivated ? 'Welcome!' : 'New Here?'}
                  </Text>
                  <Text className="text-white/80 text-base mt-1">
                    {isActivated
                      ? `${daysRemaining} days of support remaining`
                      : 'Get 30 days of community support'}
                  </Text>
                </View>
              </View>

              {isActivated && (
                <View className="mt-4 bg-white/20 rounded-xl p-4">
                  <View className="flex-row items-center">
                    <MapPin size={18} color="#FFFFFF" />
                    <Text className="text-white font-semibold ml-2">
                      New in {currentUser?.arrivalCity || selectedLocation?.city}
                    </Text>
                  </View>
                  <View className="flex-row items-center mt-2">
                    <View className="flex-1 h-2 bg-white/30 rounded-full overflow-hidden">
                      <View
                        className="h-full bg-white rounded-full"
                        style={{ width: `${((30 - daysRemaining) / 30) * 100}%` }}
                      />
                    </View>
                    <Text className="text-white/80 text-sm ml-3">
                      Day {30 - daysRemaining}/30
                    </Text>
                  </View>
                </View>
              )}
            </LinearGradient>
          </Animated.View>

          {/* What Arrival Mode Gives You */}
          {!isActivated && (
            <Animated.View entering={FadeInUp.duration(400).delay(200)} className="px-5 mt-6">
              <Text className="text-lg font-bold text-warmBrown mb-4">
                What You Get
              </Text>
              <View className="bg-white rounded-2xl p-4 shadow-sm">
                {[
                  { icon: Users, text: 'Helpers automatically surface near you' },
                  { icon: HelpCircle, text: 'Ask anything without judgment' },
                  { icon: Heart, text: 'Priority support from the community' },
                  { icon: MapPin, text: 'Local tips and essential info' },
                ].map((item, index) => (
                  <View
                    key={index}
                    className={`flex-row items-center py-3 ${
                      index < 3 ? 'border-b border-gray-100' : ''
                    }`}
                  >
                    <View className="w-10 h-10 rounded-full bg-amber-100 items-center justify-center">
                      <item.icon size={20} color="#D97706" />
                    </View>
                    <Text className="flex-1 ml-3 text-gray-700">{item.text}</Text>
                    <Check size={20} color="#10B981" />
                  </View>
                ))}
              </View>
            </Animated.View>
          )}

          {/* What do you need help with? */}
          <Animated.View entering={FadeInUp.duration(400).delay(300)} className="px-5 mt-6">
            <Text className="text-lg font-bold text-warmBrown mb-2">
              What do you need help with?
            </Text>
            <Text className="text-gray-500 text-sm mb-4">
              Select all that apply - helpers with these skills will see your profile
            </Text>

            <View className="flex-row flex-wrap gap-2">
              {HELP_CATEGORIES.map((category) => {
                const isSelected = selectedHelp.includes(category.id);
                return (
                  <Pressable
                    key={category.id}
                    onPress={() => toggleHelpCategory(category.id)}
                    className={`flex-row items-center px-4 py-3 rounded-xl border-2 ${
                      isSelected
                        ? 'bg-amber-50 border-amber-500'
                        : 'bg-white border-gray-200'
                    }`}
                  >
                    <category.icon
                      size={18}
                      color={isSelected ? '#D97706' : '#6B7280'}
                    />
                    <Text
                      className={`ml-2 font-medium ${
                        isSelected ? 'text-amber-700' : 'text-gray-600'
                      }`}
                    >
                      {category.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </Animated.View>

          {/* Quick Actions for Activated Users */}
          {isActivated && (
            <Animated.View entering={FadeInUp.duration(400).delay(400)} className="px-5 mt-6">
              <Text className="text-lg font-bold text-warmBrown mb-4">
                Quick Actions
              </Text>
              <View className="space-y-3">
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    router.push('/find-helpers');
                  }}
                  className="bg-white rounded-2xl p-4 shadow-sm flex-row items-center"
                >
                  <View className="w-12 h-12 rounded-full bg-green-100 items-center justify-center">
                    <Users size={24} color="#059669" />
                  </View>
                  <View className="flex-1 ml-3">
                    <Text className="text-warmBrown font-semibold">Find Helpers</Text>
                    <Text className="text-gray-500 text-sm">
                      Connect with people ready to help
                    </Text>
                  </View>
                  <ChevronRight size={20} color="#9CA3AF" />
                </Pressable>

                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    router.push('/ask-community');
                  }}
                  className="bg-white rounded-2xl p-4 shadow-sm flex-row items-center mt-3"
                >
                  <View className="w-12 h-12 rounded-full bg-purple-100 items-center justify-center">
                    <HelpCircle size={24} color="#7C3AED" />
                  </View>
                  <View className="flex-1 ml-3">
                    <Text className="text-warmBrown font-semibold">Ask Anything</Text>
                    <Text className="text-gray-500 text-sm">
                      Post questions without judgment
                    </Text>
                  </View>
                  <ChevronRight size={20} color="#9CA3AF" />
                </Pressable>

                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    router.push('/new-arrival-help');
                  }}
                  className="bg-white rounded-2xl p-4 shadow-sm flex-row items-center mt-3"
                >
                  <View className="w-12 h-12 rounded-full bg-blue-100 items-center justify-center">
                    <MapPin size={24} color="#2563EB" />
                  </View>
                  <View className="flex-1 ml-3">
                    <Text className="text-warmBrown font-semibold">City Guide</Text>
                    <Text className="text-gray-500 text-sm">
                      Essential info for your new city
                    </Text>
                  </View>
                  <ChevronRight size={20} color="#9CA3AF" />
                </Pressable>
              </View>
            </Animated.View>
          )}

          {/* Action Button */}
          <Animated.View entering={FadeInUp.duration(400).delay(500)} className="px-5 mt-8">
            {isActivated ? (
              <View className="space-y-3">
                <Pressable
                  onPress={handleUpdatePreferences}
                  className="bg-amber-500 rounded-xl py-4 items-center"
                >
                  <Text className="text-white font-bold text-lg">
                    Update Preferences
                  </Text>
                </Pressable>
                <Pressable
                  onPress={handleDeactivate}
                  className="bg-gray-200 rounded-xl py-4 items-center mt-3"
                >
                  <Text className="text-gray-600 font-semibold">
                    Exit Arrival Mode
                  </Text>
                </Pressable>
              </View>
            ) : (
              <Pressable onPress={handleActivate}>
                <LinearGradient
                  colors={['#F59E0B', '#D97706']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{ borderRadius: 16, paddingVertical: 16, alignItems: 'center' }}
                >
                  <Text className="text-white font-bold text-lg">
                    Activate Arrival Mode
                  </Text>
                  <Text className="text-white/80 text-sm mt-1">
                    30 days of community support
                  </Text>
                </LinearGradient>
              </Pressable>
            )}
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
