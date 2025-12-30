import React, { useState } from 'react';
import { View, Text, Pressable, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MapPin, Users, Globe, ArrowRight, Check } from 'lucide-react-native';
import Animated, { FadeIn, FadeInUp, FadeInRight, useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useStore, MOCK_COMMUNITIES, MOCK_USERS } from '@/lib/store';

const { width } = Dimensions.get('window');

const INTERESTS = [
  'Business', 'Food', 'Culture', 'Events', 'Tech',
  'Music', 'Sports', 'Education', 'Fashion', 'Art',
  'Religion', 'Travel', 'Health', 'Family', 'Networking'
];

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function OnboardingScreen() {
  const [step, setStep] = useState(0);
  const [selectedCommunity, setSelectedCommunity] = useState<string | null>(null);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);

  const setCurrentCommunity = useStore((s) => s.setCurrentCommunity);
  const setCurrentUser = useStore((s) => s.setCurrentUser);
  const setIsOnboarded = useStore((s) => s.setIsOnboarded);

  const buttonScale = useSharedValue(1);

  const handleCommunitySelect = (communityId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedCommunity(communityId);
  };

  const handleInterestToggle = (interest: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedInterests((prev) =>
      prev.includes(interest)
        ? prev.filter((i) => i !== interest)
        : [...prev, interest]
    );
  };

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (step < 2) {
      setStep(step + 1);
    } else {
      // Complete onboarding
      const community = MOCK_COMMUNITIES.find((c) => c.id === selectedCommunity);
      if (community) {
        setCurrentCommunity(community);
      }
      const mockUser = { ...MOCK_USERS[0], interests: selectedInterests };
      setCurrentUser(mockUser);
      setIsOnboarded(true);
      router.replace('/(tabs)');
    }
  };

  const handlePressIn = () => {
    buttonScale.value = withSpring(0.95, { damping: 15, stiffness: 200 });
  };

  const handlePressOut = () => {
    buttonScale.value = withSpring(1, { damping: 15, stiffness: 200 });
  };

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const canProceed =
    (step === 0) ||
    (step === 1 && selectedCommunity) ||
    (step === 2 && selectedInterests.length >= 3);

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <Animated.View
            entering={FadeIn.duration(500)}
            className="flex-1 justify-center items-center px-8"
          >
            <Animated.View
              entering={FadeInUp.duration(600).delay(200)}
              className="items-center"
            >
              <View className="bg-terracotta-100 rounded-full p-6 mb-6">
                <Globe size={48} color="#D4673A" />
              </View>
              <Text className="text-4xl font-bold text-warmBrown text-center">
                Welcome to{'\n'}AfroConnect
              </Text>
              <Text className="text-terracotta-500 text-center mt-3 text-base font-medium italic">
                Connecting Africans Globally, Building Communities
              </Text>
              <Text className="text-gray-500 text-center mt-4 text-lg leading-7">
                Find your people, locally and globally.
              </Text>
            </Animated.View>

            <Animated.View
              entering={FadeInUp.duration(600).delay(400)}
              className="flex-row justify-center mt-10"
            >
              {[
                { icon: Users, label: 'Community' },
                { icon: MapPin, label: 'Local' },
                { icon: Globe, label: 'Global' },
              ].map((item, index) => (
                <Animated.View
                  key={item.label}
                  entering={FadeInRight.duration(400).delay(500 + index * 100)}
                  className="items-center mx-4"
                >
                  <View className="bg-forest-50 rounded-full p-3 mb-2">
                    <item.icon size={24} color="#1B4D3E" />
                  </View>
                  <Text className="text-forest-700 text-sm font-medium">{item.label}</Text>
                </Animated.View>
              ))}
            </Animated.View>
          </Animated.View>
        );

      case 1:
        return (
          <Animated.View
            entering={FadeIn.duration(400)}
            className="flex-1 px-6 pt-6"
          >
            <Animated.View entering={FadeInUp.duration(500)}>
              <Text className="text-3xl font-bold text-warmBrown">
                Choose your{'\n'}community
              </Text>
              <Text className="text-gray-500 mt-2 text-base">
                Select where you want to connect
              </Text>
            </Animated.View>

            <View className="mt-6">
              {MOCK_COMMUNITIES.map((community, index) => (
                <Animated.View
                  key={community.id}
                  entering={FadeInUp.duration(400).delay(200 + index * 100)}
                >
                  <Pressable
                    onPress={() => handleCommunitySelect(community.id)}
                    className={`flex-row items-center p-4 rounded-2xl mb-3 ${
                      selectedCommunity === community.id
                        ? 'bg-terracotta-500'
                        : 'bg-white'
                    }`}
                  >
                    <View
                      className={`w-14 h-14 rounded-full items-center justify-center ${
                        selectedCommunity === community.id
                          ? 'bg-white/20'
                          : 'bg-terracotta-50'
                      }`}
                    >
                      <MapPin
                        size={24}
                        color={selectedCommunity === community.id ? '#FFFFFF' : '#D4673A'}
                      />
                    </View>
                    <View className="flex-1 ml-3">
                      <Text
                        className={`font-semibold text-lg ${
                          selectedCommunity === community.id
                            ? 'text-white'
                            : 'text-warmBrown'
                        }`}
                      >
                        {community.name}
                      </Text>
                      <Text
                        className={`text-sm ${
                          selectedCommunity === community.id
                            ? 'text-white/70'
                            : 'text-gray-500'
                        }`}
                      >
                        {community.memberCount.toLocaleString()} members
                      </Text>
                    </View>
                    {selectedCommunity === community.id && (
                      <View className="bg-white rounded-full p-1.5">
                        <Check size={18} color="#D4673A" />
                      </View>
                    )}
                  </Pressable>
                </Animated.View>
              ))}
            </View>
          </Animated.View>
        );

      case 2:
        return (
          <Animated.View
            entering={FadeIn.duration(400)}
            className="flex-1 px-6 pt-6"
          >
            <Animated.View entering={FadeInUp.duration(500)}>
              <Text className="text-3xl font-bold text-warmBrown">
                What are you{'\n'}interested in?
              </Text>
              <Text className="text-gray-500 mt-2 text-base">
                Select at least 3 interests
              </Text>
            </Animated.View>

            <View className="flex-row flex-wrap mt-6">
              {INTERESTS.map((interest, index) => (
                <Animated.View
                  key={interest}
                  entering={FadeInUp.duration(300).delay(100 + index * 30)}
                >
                  <Pressable
                    onPress={() => handleInterestToggle(interest)}
                    className={`px-4 py-2.5 rounded-full mr-2 mb-3 ${
                      selectedInterests.includes(interest)
                        ? 'bg-terracotta-500'
                        : 'bg-white'
                    }`}
                  >
                    <Text
                      className={`font-medium ${
                        selectedInterests.includes(interest)
                          ? 'text-white'
                          : 'text-gray-600'
                      }`}
                    >
                      {interest}
                    </Text>
                  </Pressable>
                </Animated.View>
              ))}
            </View>

            <View className="mt-4">
              <Text className="text-gray-400 text-sm">
                {selectedInterests.length} of 3 minimum selected
              </Text>
            </View>
          </Animated.View>
        );
    }
  };

  return (
    <View className="flex-1 bg-cream">
      <SafeAreaView className="flex-1">
        {/* Progress Indicator */}
        <Animated.View
          entering={FadeIn.duration(300)}
          className="flex-row px-6 pt-4"
        >
          {[0, 1, 2].map((i) => (
            <View
              key={i}
              className={`flex-1 h-1 rounded-full mx-1 ${
                i <= step ? 'bg-terracotta-500' : 'bg-gray-200'
              }`}
            />
          ))}
        </Animated.View>

        {renderStep()}

        {/* Bottom Button */}
        <View className="px-6 pb-4">
          <AnimatedPressable
            style={buttonAnimatedStyle}
            onPress={handleNext}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            disabled={!canProceed}
          >
            <LinearGradient
              colors={canProceed ? ['#D4673A', '#B85430'] : ['#D1D5DB', '#9CA3AF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                borderRadius: 16,
                paddingVertical: 18,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text className="text-white font-bold text-lg">
                {step === 2 ? 'Get Started' : 'Continue'}
              </Text>
              <ArrowRight size={20} color="#FFFFFF" style={{ marginLeft: 8 }} />
            </LinearGradient>
          </AnimatedPressable>
        </View>
      </SafeAreaView>
    </View>
  );
}
