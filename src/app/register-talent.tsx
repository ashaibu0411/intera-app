import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ChevronLeft,
  ChevronRight,
  Check,
  Music,
  Mic,
  Mic2,
  Speaker,
  Camera,
  Users,
  Baby,
  Heart,
  MessageCircle,
  Calendar,
  ClipboardList,
  Languages,
  Star,
  MapPin,
  Car,
  Phone,
  Mail,
} from 'lucide-react-native';
import Animated, { FadeIn, FadeInUp, SlideInRight, SlideOutLeft } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import {
  useStore,
  TALENT_CATEGORIES,
  TALENT_SKILLS,
  FAITH_TYPES,
  type ServeTalent,
} from '@/lib/store';

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  musician: <Music size={24} color="#1B4D3E" />,
  worship_leader: <Mic size={24} color="#1B4D3E" />,
  singer: <Mic2 size={24} color="#1B4D3E" />,
  sound_tech: <Speaker size={24} color="#1B4D3E" />,
  media: <Camera size={24} color="#1B4D3E" />,
  youth_leader: <Users size={24} color="#1B4D3E" />,
  usher: <Users size={24} color="#1B4D3E" />,
  children_ministry: <Baby size={24} color="#1B4D3E" />,
  prayer_team: <Heart size={24} color="#1B4D3E" />,
  counselor: <MessageCircle size={24} color="#1B4D3E" />,
  event_coordinator: <Calendar size={24} color="#1B4D3E" />,
  admin: <ClipboardList size={24} color="#1B4D3E" />,
  translator: <Languages size={24} color="#1B4D3E" />,
  other: <Star size={24} color="#1B4D3E" />,
};

const EXPERIENCE_OPTIONS = [
  'Less than 1 year',
  '1-2 years',
  '3-5 years',
  '5-10 years',
  '10+ years',
  '15+ years',
];

export default function RegisterTalentScreen() {
  const [step, setStep] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [experience, setExperience] = useState('');
  const [bio, setBio] = useState('');
  const [isAvailable, setIsAvailable] = useState(true);
  const [availabilityNote, setAvailabilityNote] = useState('');
  const [willingToTravel, setWillingToTravel] = useState(false);
  const [travelRadius, setTravelRadius] = useState('');
  const [faithBackground, setFaithBackground] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');

  const currentUser = useStore((s) => s.currentUser);
  const selectedLocation = useStore((s) => s.selectedLocation);
  const setUserTalentProfile = useStore((s) => s.setUserTalentProfile);

  const locationString = selectedLocation
    ? `${selectedLocation.city}, ${selectedLocation.state ?? selectedLocation.country}`
    : 'Denver, CO';

  const handleCategorySelect = (categoryId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedCategory(categoryId);
    setSelectedSkills([]);
  };

  const handleSkillToggle = (skill: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (selectedSkills.includes(skill)) {
      setSelectedSkills(selectedSkills.filter((s) => s !== skill));
    } else {
      setSelectedSkills([...selectedSkills, skill]);
    }
  };

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (step < 3) {
      setStep(step + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (step > 1) {
      setStep(step - 1);
    } else {
      router.back();
    }
  };

  const handleSubmit = () => {
    if (!currentUser || !selectedCategory) return;

    const newTalentProfile: ServeTalent = {
      id: `talent-${Date.now()}`,
      user: currentUser,
      category: selectedCategory,
      skills: selectedSkills,
      experience,
      bio,
      isAvailable,
      availabilityNote: availabilityNote || undefined,
      location: locationString,
      willingToTravel,
      travelRadius: willingToTravel ? travelRadius : undefined,
      faithBackground: faithBackground || undefined,
      contactPhone: contactPhone || undefined,
      contactEmail: contactEmail || currentUser.email,
      rating: 0,
      reviewCount: 0,
      createdAt: new Date().toISOString(),
      lastActive: new Date().toISOString(),
    };

    setUserTalentProfile(newTalentProfile);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.replace('/serve-connect');
  };

  const canProceedStep1 = selectedCategory !== null;
  const canProceedStep2 = selectedSkills.length > 0 && experience !== '' && bio.length >= 20;
  const canProceedStep3 = true; // Contact info is optional

  const getCategoryLabel = (categoryId: string) => {
    const category = TALENT_CATEGORIES.find((c) => c.id === categoryId);
    return category?.label ?? categoryId;
  };

  const getAvailableSkills = () => {
    if (!selectedCategory) return [];
    return TALENT_SKILLS[selectedCategory] || TALENT_SKILLS.other;
  };

  const renderStep1 = () => (
    <Animated.View entering={FadeInUp.duration(300)} className="flex-1">
      <Text className="text-lg font-semibold text-warmBrown mb-2">
        What type of service do you offer?
      </Text>
      <Text className="text-gray-500 mb-6">
        Select the category that best describes your ministry or volunteer work.
      </Text>

      <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
        <View className="flex-row flex-wrap">
          {TALENT_CATEGORIES.map((category) => (
            <Pressable
              key={category.id}
              onPress={() => handleCategorySelect(category.id)}
              className={`w-[48%] mr-[2%] mb-3 p-4 rounded-2xl border-2 ${
                selectedCategory === category.id
                  ? 'border-forest-600 bg-forest-50'
                  : 'border-gray-200 bg-white'
              }`}
            >
              <View className="items-center">
                {CATEGORY_ICONS[category.id]}
                <Text
                  className={`mt-2 font-medium text-center ${
                    selectedCategory === category.id ? 'text-forest-700' : 'text-gray-700'
                  }`}
                >
                  {category.label}
                </Text>
              </View>
            </Pressable>
          ))}
        </View>
        <View className="h-20" />
      </ScrollView>
    </Animated.View>
  );

  const renderStep2 = () => (
    <Animated.View entering={SlideInRight.duration(300)} exiting={SlideOutLeft.duration(300)} className="flex-1">
      <Text className="text-lg font-semibold text-warmBrown mb-2">
        Tell us about your experience
      </Text>
      <Text className="text-gray-500 mb-6">
        Share your skills and background as a {getCategoryLabel(selectedCategory ?? '')}.
      </Text>

      <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
        {/* Skills */}
        <Text className="font-medium text-warmBrown mb-3">Select your skills</Text>
        <View className="flex-row flex-wrap mb-6">
          {getAvailableSkills().map((skill) => (
            <Pressable
              key={skill}
              onPress={() => handleSkillToggle(skill)}
              className={`px-4 py-2 rounded-full mr-2 mb-2 border ${
                selectedSkills.includes(skill)
                  ? 'bg-forest-600 border-forest-600'
                  : 'bg-white border-gray-200'
              }`}
            >
              <Text
                className={`font-medium ${
                  selectedSkills.includes(skill) ? 'text-white' : 'text-gray-700'
                }`}
              >
                {skill}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Experience */}
        <Text className="font-medium text-warmBrown mb-3">Years of experience</Text>
        <View className="flex-row flex-wrap mb-6">
          {EXPERIENCE_OPTIONS.map((option) => (
            <Pressable
              key={option}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setExperience(option);
              }}
              className={`px-4 py-2 rounded-full mr-2 mb-2 border ${
                experience === option
                  ? 'bg-gold-500 border-gold-500'
                  : 'bg-white border-gray-200'
              }`}
            >
              <Text
                className={`font-medium ${
                  experience === option ? 'text-white' : 'text-gray-700'
                }`}
              >
                {option}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Bio */}
        <Text className="font-medium text-warmBrown mb-3">
          About you <Text className="text-gray-400 font-normal">(min 20 characters)</Text>
        </Text>
        <TextInput
          value={bio}
          onChangeText={setBio}
          placeholder="Describe your experience, what you can offer, and your passion for serving..."
          placeholderTextColor="#9CA3AF"
          multiline
          numberOfLines={4}
          className="bg-white rounded-2xl p-4 text-warmBrown text-base border border-gray-200 mb-6"
          style={{ minHeight: 120, textAlignVertical: 'top' }}
        />

        {/* Faith Background */}
        <Text className="font-medium text-warmBrown mb-3">Faith background (optional)</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-6" style={{ flexGrow: 0 }}>
          {FAITH_TYPES.map((faith) => (
            <Pressable
              key={faith}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setFaithBackground(faithBackground === faith ? '' : faith);
              }}
              className={`px-4 py-2 rounded-full mr-2 border ${
                faithBackground === faith
                  ? 'bg-gold-500 border-gold-500'
                  : 'bg-white border-gray-200'
              }`}
            >
              <Text
                className={`font-medium ${
                  faithBackground === faith ? 'text-white' : 'text-gray-700'
                }`}
              >
                {faith}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        <View className="h-20" />
      </ScrollView>
    </Animated.View>
  );

  const renderStep3 = () => (
    <Animated.View entering={SlideInRight.duration(300)} className="flex-1">
      <Text className="text-lg font-semibold text-warmBrown mb-2">
        Availability & Contact
      </Text>
      <Text className="text-gray-500 mb-6">
        Let churches know how to reach you and when you're available.
      </Text>

      <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
        {/* Location */}
        <View className="bg-white rounded-2xl p-4 mb-4 flex-row items-center">
          <View className="bg-forest-50 rounded-full p-2 mr-3">
            <MapPin size={20} color="#1B4D3E" />
          </View>
          <View className="flex-1">
            <Text className="text-gray-500 text-sm">Your location</Text>
            <Text className="text-warmBrown font-medium">{locationString}</Text>
          </View>
        </View>

        {/* Availability Toggle */}
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setIsAvailable(!isAvailable);
          }}
          className="bg-white rounded-2xl p-4 mb-4 flex-row items-center justify-between"
        >
          <View>
            <Text className="text-warmBrown font-medium">Currently available</Text>
            <Text className="text-gray-500 text-sm">Show as available to serve</Text>
          </View>
          <View
            className={`w-12 h-7 rounded-full p-1 ${
              isAvailable ? 'bg-forest-600' : 'bg-gray-300'
            }`}
          >
            <Animated.View
              className={`w-5 h-5 rounded-full bg-white ${
                isAvailable ? 'ml-auto' : ''
              }`}
            />
          </View>
        </Pressable>

        {/* Availability Note */}
        <TextInput
          value={availabilityNote}
          onChangeText={setAvailabilityNote}
          placeholder="e.g., Available weekends and Wednesday evenings"
          placeholderTextColor="#9CA3AF"
          className="bg-white rounded-2xl p-4 text-warmBrown text-base border border-gray-200 mb-4"
        />

        {/* Willing to Travel */}
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setWillingToTravel(!willingToTravel);
          }}
          className="bg-white rounded-2xl p-4 mb-4 flex-row items-center justify-between"
        >
          <View className="flex-row items-center">
            <Car size={20} color="#1B4D3E" />
            <View className="ml-3">
              <Text className="text-warmBrown font-medium">Willing to travel</Text>
              <Text className="text-gray-500 text-sm">Serve at different locations</Text>
            </View>
          </View>
          <View
            className={`w-12 h-7 rounded-full p-1 ${
              willingToTravel ? 'bg-forest-600' : 'bg-gray-300'
            }`}
          >
            <Animated.View
              className={`w-5 h-5 rounded-full bg-white ${
                willingToTravel ? 'ml-auto' : ''
              }`}
            />
          </View>
        </Pressable>

        {willingToTravel && (
          <TextInput
            value={travelRadius}
            onChangeText={setTravelRadius}
            placeholder="How far? e.g., 50 miles, statewide"
            placeholderTextColor="#9CA3AF"
            className="bg-white rounded-2xl p-4 text-warmBrown text-base border border-gray-200 mb-4"
          />
        )}

        {/* Contact Info */}
        <Text className="font-medium text-warmBrown mb-3 mt-2">Contact Information</Text>

        <View className="bg-white rounded-2xl p-4 mb-4 flex-row items-center border border-gray-200">
          <Phone size={20} color="#8B7355" />
          <TextInput
            value={contactPhone}
            onChangeText={setContactPhone}
            placeholder="Phone number (optional)"
            placeholderTextColor="#9CA3AF"
            keyboardType="phone-pad"
            className="flex-1 ml-3 text-warmBrown text-base"
          />
        </View>

        <View className="bg-white rounded-2xl p-4 mb-4 flex-row items-center border border-gray-200">
          <Mail size={20} color="#8B7355" />
          <TextInput
            value={contactEmail}
            onChangeText={setContactEmail}
            placeholder={currentUser?.email ?? "Email address (optional)"}
            placeholderTextColor="#9CA3AF"
            keyboardType="email-address"
            autoCapitalize="none"
            className="flex-1 ml-3 text-warmBrown text-base"
          />
        </View>

        <View className="h-20" />
      </ScrollView>
    </Animated.View>
  );

  const canProceed = step === 1 ? canProceedStep1 : step === 2 ? canProceedStep2 : canProceedStep3;

  return (
    <View className="flex-1 bg-cream">
      <SafeAreaView edges={['top']} className="flex-1">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
        >
          {/* Header */}
          <Animated.View entering={FadeIn.duration(300)} className="px-5 pt-4 pb-4">
            <View className="flex-row items-center justify-between mb-4">
              <Pressable
                onPress={handleBack}
                className="bg-white rounded-full p-2 shadow-sm"
              >
                <ChevronLeft size={24} color="#2D1F1A" />
              </Pressable>
              <Text className="text-lg font-semibold text-warmBrown">
                Step {step} of 3
              </Text>
              <View className="w-10" />
            </View>

            {/* Progress Bar */}
            <View className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <Animated.View
                className="h-full bg-forest-600 rounded-full"
                style={{ width: `${(step / 3) * 100}%` }}
              />
            </View>
          </Animated.View>

          {/* Content */}
          <View className="flex-1 px-5">
            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
            {step === 3 && renderStep3()}
          </View>

          {/* Bottom CTA */}
          <View className="px-5 py-4 border-t border-gray-100 bg-white">
            <Pressable
              onPress={handleNext}
              disabled={!canProceed}
              className={`rounded-2xl py-4 flex-row items-center justify-center ${
                canProceed ? 'bg-forest-600' : 'bg-gray-300'
              }`}
            >
              <Text className="text-white font-bold text-lg mr-2">
                {step === 3 ? 'Complete Registration' : 'Continue'}
              </Text>
              {step < 3 && <ChevronRight size={20} color="#FFFFFF" />}
              {step === 3 && <Check size={20} color="#FFFFFF" />}
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
