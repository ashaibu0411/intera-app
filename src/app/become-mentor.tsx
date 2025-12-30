import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, KeyboardAvoidingView, Platform, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ChevronLeft,
  User,
  Briefcase,
  Award,
  MessageCircle,
  Check,
  X,
  Globe,
  Linkedin,
  Mail,
  Phone,
} from 'lucide-react-native';
import { Image } from 'expo-image';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useStore } from '@/lib/store';

const EXPERTISE_AREAS = [
  'Technology & Engineering',
  'Medicine & Healthcare',
  'Business & Finance',
  'Law & Legal',
  'Education & Academia',
  'Arts & Creative',
  'Science & Research',
  'Entrepreneurship',
  'Career Development',
  'Immigration & Visa',
  'Mental Health & Wellness',
  'Other',
];

const AVAILABILITY_OPTIONS = [
  '1-2 hours/week',
  '3-5 hours/week',
  '5+ hours/week',
  'Flexible',
];

export default function BecomeMentorScreen() {
  const [currentStep, setCurrentStep] = useState(1);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [company, setCompany] = useState('');
  const [yearsExperience, setYearsExperience] = useState('');
  const [bio, setBio] = useState('');
  const [selectedExpertise, setSelectedExpertise] = useState<string[]>([]);
  const [availability, setAvailability] = useState('');
  const [linkedIn, setLinkedIn] = useState('');
  const [website, setWebsite] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [mentorshipStyle, setMentorshipStyle] = useState('');
  const [showExpertiseModal, setShowExpertiseModal] = useState(false);

  const currentUser = useStore((s) => s.currentUser);

  const handlePickImage = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsEditing: true,
      aspect: [1, 1],
    });

    if (!result.canceled && result.assets.length > 0) {
      setProfileImage(result.assets[0].uri);
    }
  };

  const toggleExpertise = (exp: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedExpertise((prev) =>
      prev.includes(exp) ? prev.filter((e) => e !== exp) : prev.length < 3 ? [...prev, exp] : prev
    );
  };

  const handleSubmit = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    // TODO: Save to Supabase
    router.back();
  };

  const canProceed = () => {
    if (currentStep === 1) return title.trim().length > 0 && yearsExperience.length > 0;
    if (currentStep === 2) return selectedExpertise.length > 0 && availability.length > 0;
    if (currentStep === 3) return bio.trim().length >= 50;
    return true;
  };

  if (!currentUser) {
    return (
      <View className="flex-1 bg-cream justify-center items-center px-6">
        <Text className="text-warmBrown text-lg text-center">Please sign in to become a mentor</Text>
        <Pressable onPress={() => router.push('/signup')} className="mt-4">
          <Text className="text-terracotta-500 font-semibold">Sign In</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-cream">
      <SafeAreaView edges={['top']} className="flex-1">
        {/* Header */}
        <Animated.View entering={FadeIn.duration(300)} className="px-5 pt-4 pb-2">
          <View className="flex-row items-center justify-between">
            <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); currentStep > 1 ? setCurrentStep(currentStep - 1) : router.back(); }} className="bg-white rounded-full p-2 shadow-sm">
              <ChevronLeft size={24} color="#2D1F1A" />
            </Pressable>
            <Text className="text-lg font-bold text-warmBrown">Become a Mentor</Text>
            <View className="w-10" />
          </View>

          {/* Progress */}
          <View className="flex-row mt-4">
            {[1, 2, 3].map((step) => (
              <View
                key={step}
                className={`flex-1 h-1.5 rounded-full mx-1 ${step <= currentStep ? 'bg-forest-600' : 'bg-gray-200'}`}
              />
            ))}
          </View>
          <Text className="text-gray-500 text-sm mt-2">Step {currentStep} of 3</Text>
        </Animated.View>

        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
          <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
            {currentStep === 1 && (
              <Animated.View entering={FadeInUp.duration(400)}>
                <Text className="text-2xl font-bold text-warmBrown mt-4 mb-2">Professional Background</Text>
                <Text className="text-gray-500 mb-6">Tell us about your experience and career</Text>

                {/* Profile Image */}
                <Pressable onPress={handlePickImage} className="items-center mb-6">
                  {profileImage || currentUser.avatar ? (
                    <Image
                      source={{ uri: profileImage || currentUser.avatar }}
                      style={{ width: 100, height: 100, borderRadius: 50 }}
                      contentFit="cover"
                    />
                  ) : (
                    <View className="w-24 h-24 rounded-full bg-gray-200 items-center justify-center">
                      <User size={40} color="#9CA3AF" />
                    </View>
                  )}
                  <Text className="text-terracotta-500 font-medium mt-2">Change Photo</Text>
                </Pressable>

                {/* Title */}
                <View className="mb-4">
                  <Text className="text-warmBrown font-semibold mb-2">Job Title *</Text>
                  <View className="flex-row items-center bg-white rounded-xl px-4">
                    <Briefcase size={20} color="#8B7355" />
                    <TextInput
                      placeholder="e.g., Senior Software Engineer"
                      placeholderTextColor="#9CA3AF"
                      value={title}
                      onChangeText={setTitle}
                      className="flex-1 py-3.5 ml-3 text-warmBrown"
                    />
                  </View>
                </View>

                {/* Company */}
                <View className="mb-4">
                  <Text className="text-warmBrown font-semibold mb-2">Company/Organization</Text>
                  <View className="flex-row items-center bg-white rounded-xl px-4">
                    <Award size={20} color="#8B7355" />
                    <TextInput
                      placeholder="e.g., Google, Self-employed"
                      placeholderTextColor="#9CA3AF"
                      value={company}
                      onChangeText={setCompany}
                      className="flex-1 py-3.5 ml-3 text-warmBrown"
                    />
                  </View>
                </View>

                {/* Years of Experience */}
                <View className="mb-4">
                  <Text className="text-warmBrown font-semibold mb-2">Years of Experience *</Text>
                  <View className="flex-row">
                    {['1-3', '4-7', '8-15', '15+'].map((years) => (
                      <Pressable
                        key={years}
                        onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setYearsExperience(years); }}
                        className={`flex-1 py-3 rounded-xl mr-2 last:mr-0 ${yearsExperience === years ? 'bg-forest-600' : 'bg-white'}`}
                      >
                        <Text className={`text-center font-medium ${yearsExperience === years ? 'text-white' : 'text-warmBrown'}`}>{years}</Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              </Animated.View>
            )}

            {currentStep === 2 && (
              <Animated.View entering={FadeInUp.duration(400)}>
                <Text className="text-2xl font-bold text-warmBrown mt-4 mb-2">Mentorship Details</Text>
                <Text className="text-gray-500 mb-6">What can you help mentees with?</Text>

                {/* Expertise Areas */}
                <View className="mb-4">
                  <Text className="text-warmBrown font-semibold mb-2">Areas of Expertise * (Select up to 3)</Text>
                  <View className="flex-row flex-wrap">
                    {selectedExpertise.map((exp) => (
                      <Pressable
                        key={exp}
                        onPress={() => toggleExpertise(exp)}
                        className="flex-row items-center bg-forest-600 rounded-full px-3 py-2 mr-2 mb-2"
                      >
                        <Text className="text-white text-sm">{exp}</Text>
                        <X size={14} color="#FFFFFF" className="ml-1" />
                      </Pressable>
                    ))}
                  </View>
                  <Pressable onPress={() => setShowExpertiseModal(true)} className="bg-white rounded-xl px-4 py-3.5">
                    <Text className="text-gray-400">+ Add expertise area</Text>
                  </Pressable>
                </View>

                {/* Availability */}
                <View className="mb-4">
                  <Text className="text-warmBrown font-semibold mb-2">Availability *</Text>
                  {AVAILABILITY_OPTIONS.map((option) => (
                    <Pressable
                      key={option}
                      onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setAvailability(option); }}
                      className={`flex-row items-center justify-between bg-white rounded-xl px-4 py-3.5 mb-2 ${availability === option ? 'border-2 border-forest-600' : ''}`}
                    >
                      <Text className="text-warmBrown">{option}</Text>
                      {availability === option && <Check size={20} color="#1B4D3E" />}
                    </Pressable>
                  ))}
                </View>

                {/* Mentorship Style */}
                <View className="mb-4">
                  <Text className="text-warmBrown font-semibold mb-2">Preferred Mentorship Style</Text>
                  <TextInput
                    placeholder="e.g., One-on-one calls, Email advice, Group sessions..."
                    placeholderTextColor="#9CA3AF"
                    value={mentorshipStyle}
                    onChangeText={setMentorshipStyle}
                    className="bg-white rounded-xl px-4 py-3.5 text-warmBrown"
                  />
                </View>
              </Animated.View>
            )}

            {currentStep === 3 && (
              <Animated.View entering={FadeInUp.duration(400)}>
                <Text className="text-2xl font-bold text-warmBrown mt-4 mb-2">About You & Contact</Text>
                <Text className="text-gray-500 mb-6">Help mentees get to know you</Text>

                {/* Bio */}
                <View className="mb-4">
                  <Text className="text-warmBrown font-semibold mb-2">Your Mentor Bio * (min 50 characters)</Text>
                  <TextInput
                    placeholder="Share your journey, what motivates you to mentor, and how you can help..."
                    placeholderTextColor="#9CA3AF"
                    multiline
                    value={bio}
                    onChangeText={setBio}
                    className="bg-white rounded-xl px-4 py-3.5 text-warmBrown min-h-[120px]"
                    style={{ textAlignVertical: 'top' }}
                  />
                  <Text className="text-gray-400 text-sm mt-1">{bio.length}/50 minimum</Text>
                </View>

                {/* Contact */}
                <View className="mb-4">
                  <Text className="text-warmBrown font-semibold mb-2">Contact Information</Text>

                  <View className="flex-row items-center bg-white rounded-xl px-4 mb-3">
                    <Mail size={20} color="#8B7355" />
                    <TextInput
                      placeholder="Contact email (optional)"
                      placeholderTextColor="#9CA3AF"
                      keyboardType="email-address"
                      value={contactEmail}
                      onChangeText={setContactEmail}
                      className="flex-1 py-3.5 ml-3 text-warmBrown"
                    />
                  </View>

                  <View className="flex-row items-center bg-white rounded-xl px-4 mb-3">
                    <Linkedin size={20} color="#8B7355" />
                    <TextInput
                      placeholder="LinkedIn URL (optional)"
                      placeholderTextColor="#9CA3AF"
                      value={linkedIn}
                      onChangeText={setLinkedIn}
                      className="flex-1 py-3.5 ml-3 text-warmBrown"
                    />
                  </View>

                  <View className="flex-row items-center bg-white rounded-xl px-4">
                    <Globe size={20} color="#8B7355" />
                    <TextInput
                      placeholder="Website/Portfolio (optional)"
                      placeholderTextColor="#9CA3AF"
                      value={website}
                      onChangeText={setWebsite}
                      className="flex-1 py-3.5 ml-3 text-warmBrown"
                    />
                  </View>
                </View>

                {/* Agreement */}
                <View className="bg-forest-50 rounded-xl p-4 mb-4">
                  <Text className="text-forest-800 text-sm">
                    By submitting, you agree to volunteer your time to help African students and professionals grow in their careers. Your profile will be visible to the AfroConnect community.
                  </Text>
                </View>
              </Animated.View>
            )}

            <View className="h-8" />
          </ScrollView>
        </KeyboardAvoidingView>

        {/* Bottom Button */}
        <View className="px-5 py-4 border-t border-gray-100 bg-cream">
          <Pressable onPress={() => currentStep < 3 ? setCurrentStep(currentStep + 1) : handleSubmit()} disabled={!canProceed()}>
            <LinearGradient
              colors={canProceed() ? ['#1B4D3E', '#153D31'] : ['#D1D5DB', '#9CA3AF']}
              style={{ borderRadius: 16, paddingVertical: 18, alignItems: 'center' }}
            >
              <Text className="text-white font-bold text-lg">
                {currentStep < 3 ? 'Continue' : 'Submit Application'}
              </Text>
            </LinearGradient>
          </Pressable>
        </View>

        {/* Expertise Modal */}
        <Modal visible={showExpertiseModal} animationType="slide" transparent>
          <View className="flex-1 bg-black/50 justify-end">
            <View className="bg-cream rounded-t-3xl max-h-[70%]">
              <View className="flex-row items-center justify-between px-5 py-4 border-b border-gray-100">
                <Text className="text-lg font-bold text-warmBrown">Select Expertise</Text>
                <Pressable onPress={() => setShowExpertiseModal(false)}>
                  <X size={24} color="#2D1F1A" />
                </Pressable>
              </View>
              <ScrollView className="px-5 py-2">
                {EXPERTISE_AREAS.map((exp) => (
                  <Pressable
                    key={exp}
                    onPress={() => toggleExpertise(exp)}
                    className="flex-row items-center py-4 border-b border-gray-100"
                  >
                    <Text className="flex-1 text-warmBrown">{exp}</Text>
                    {selectedExpertise.includes(exp) && <Check size={20} color="#1B4D3E" />}
                  </Pressable>
                ))}
                <View className="h-8" />
              </ScrollView>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </View>
  );
}
