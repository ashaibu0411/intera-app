import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, KeyboardAvoidingView, Platform, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ChevronLeft,
  Building2,
  MapPin,
  Calendar,
  DollarSign,
  Clock,
  Users,
  Check,
  X,
  Briefcase,
  GraduationCap,
  Globe,
  Mail,
  Link as LinkIcon,
} from 'lucide-react-native';
import { Image } from 'expo-image';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useStore } from '@/lib/store';

const INDUSTRIES = [
  'Technology',
  'Finance & Banking',
  'Healthcare',
  'Engineering',
  'Marketing & Media',
  'Legal',
  'Consulting',
  'Education',
  'Non-Profit',
  'Government',
  'Manufacturing',
  'Other',
];

const DURATION_OPTIONS = [
  '1-3 months',
  '3-6 months',
  '6-12 months',
  '12+ months',
];

const WORK_TYPE_OPTIONS = [
  { id: 'onsite', label: 'On-site', icon: Building2 },
  { id: 'remote', label: 'Remote', icon: Globe },
  { id: 'hybrid', label: 'Hybrid', icon: Users },
];

export default function PostInternshipScreen() {
  const [currentStep, setCurrentStep] = useState(1);
  const [companyLogo, setCompanyLogo] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState('');
  const [companyWebsite, setCompanyWebsite] = useState('');
  const [industry, setIndustry] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [location, setLocation] = useState('');
  const [workType, setWorkType] = useState('');
  const [duration, setDuration] = useState('');
  const [isPaid, setIsPaid] = useState(true);
  const [compensation, setCompensation] = useState('');
  const [description, setDescription] = useState('');
  const [requirements, setRequirements] = useState('');
  const [applicationDeadline, setApplicationDeadline] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [applicationLink, setApplicationLink] = useState('');
  const [showIndustryModal, setShowIndustryModal] = useState(false);

  const currentUser = useStore((s) => s.currentUser);

  const handlePickLogo = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsEditing: true,
      aspect: [1, 1],
    });

    if (!result.canceled && result.assets.length > 0) {
      setCompanyLogo(result.assets[0].uri);
    }
  };

  const handleSubmit = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    // TODO: Save to Supabase
    router.back();
  };

  const canProceed = () => {
    if (currentStep === 1) return companyName.trim().length > 0 && industry.length > 0;
    if (currentStep === 2) return jobTitle.trim().length > 0 && location.trim().length > 0 && workType.length > 0 && duration.length > 0;
    if (currentStep === 3) return description.trim().length >= 100 && contactEmail.trim().length > 0;
    return true;
  };

  if (!currentUser) {
    return (
      <View className="flex-1 bg-cream justify-center items-center px-6">
        <Text className="text-warmBrown text-lg text-center">Please sign in to post an internship</Text>
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
            <Text className="text-lg font-bold text-warmBrown">Post Internship</Text>
            <View className="w-10" />
          </View>

          {/* Progress */}
          <View className="flex-row mt-4">
            {[1, 2, 3].map((step) => (
              <View
                key={step}
                className={`flex-1 h-1.5 rounded-full mx-1 ${step <= currentStep ? 'bg-gold-500' : 'bg-gray-200'}`}
              />
            ))}
          </View>
          <Text className="text-gray-500 text-sm mt-2">Step {currentStep} of 3</Text>
        </Animated.View>

        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
          <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
            {currentStep === 1 && (
              <Animated.View entering={FadeInUp.duration(400)}>
                <Text className="text-2xl font-bold text-warmBrown mt-4 mb-2">Company Information</Text>
                <Text className="text-gray-500 mb-6">Tell us about your organization</Text>

                {/* Company Logo */}
                <Pressable onPress={handlePickLogo} className="items-center mb-6">
                  {companyLogo ? (
                    <Image
                      source={{ uri: companyLogo }}
                      style={{ width: 100, height: 100, borderRadius: 16 }}
                      contentFit="cover"
                    />
                  ) : (
                    <View className="w-24 h-24 rounded-2xl bg-gray-200 items-center justify-center">
                      <Building2 size={40} color="#9CA3AF" />
                    </View>
                  )}
                  <Text className="text-terracotta-500 font-medium mt-2">Upload Logo</Text>
                </Pressable>

                {/* Company Name */}
                <View className="mb-4">
                  <Text className="text-warmBrown font-semibold mb-2">Company Name *</Text>
                  <View className="flex-row items-center bg-white rounded-xl px-4">
                    <Building2 size={20} color="#8B7355" />
                    <TextInput
                      placeholder="e.g., Tech Startup Inc."
                      placeholderTextColor="#9CA3AF"
                      value={companyName}
                      onChangeText={setCompanyName}
                      className="flex-1 py-3.5 ml-3 text-warmBrown"
                    />
                  </View>
                </View>

                {/* Industry */}
                <View className="mb-4">
                  <Text className="text-warmBrown font-semibold mb-2">Industry *</Text>
                  <Pressable onPress={() => setShowIndustryModal(true)} className="flex-row items-center bg-white rounded-xl px-4 py-3.5">
                    <Briefcase size={20} color="#8B7355" />
                    <Text className={`flex-1 ml-3 ${industry ? 'text-warmBrown' : 'text-gray-400'}`}>
                      {industry || 'Select industry'}
                    </Text>
                  </Pressable>
                </View>

                {/* Company Website */}
                <View className="mb-4">
                  <Text className="text-warmBrown font-semibold mb-2">Company Website</Text>
                  <View className="flex-row items-center bg-white rounded-xl px-4">
                    <Globe size={20} color="#8B7355" />
                    <TextInput
                      placeholder="https://example.com"
                      placeholderTextColor="#9CA3AF"
                      value={companyWebsite}
                      onChangeText={setCompanyWebsite}
                      keyboardType="url"
                      autoCapitalize="none"
                      className="flex-1 py-3.5 ml-3 text-warmBrown"
                    />
                  </View>
                </View>
              </Animated.View>
            )}

            {currentStep === 2 && (
              <Animated.View entering={FadeInUp.duration(400)}>
                <Text className="text-2xl font-bold text-warmBrown mt-4 mb-2">Position Details</Text>
                <Text className="text-gray-500 mb-6">Describe the internship opportunity</Text>

                {/* Job Title */}
                <View className="mb-4">
                  <Text className="text-warmBrown font-semibold mb-2">Position Title *</Text>
                  <View className="flex-row items-center bg-white rounded-xl px-4">
                    <GraduationCap size={20} color="#8B7355" />
                    <TextInput
                      placeholder="e.g., Software Engineering Intern"
                      placeholderTextColor="#9CA3AF"
                      value={jobTitle}
                      onChangeText={setJobTitle}
                      className="flex-1 py-3.5 ml-3 text-warmBrown"
                    />
                  </View>
                </View>

                {/* Location */}
                <View className="mb-4">
                  <Text className="text-warmBrown font-semibold mb-2">Location *</Text>
                  <View className="flex-row items-center bg-white rounded-xl px-4">
                    <MapPin size={20} color="#8B7355" />
                    <TextInput
                      placeholder="e.g., New York, NY"
                      placeholderTextColor="#9CA3AF"
                      value={location}
                      onChangeText={setLocation}
                      className="flex-1 py-3.5 ml-3 text-warmBrown"
                    />
                  </View>
                </View>

                {/* Work Type */}
                <View className="mb-4">
                  <Text className="text-warmBrown font-semibold mb-2">Work Type *</Text>
                  <View className="flex-row">
                    {WORK_TYPE_OPTIONS.map((option) => (
                      <Pressable
                        key={option.id}
                        onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setWorkType(option.id); }}
                        className={`flex-1 flex-row items-center justify-center py-3 rounded-xl mr-2 last:mr-0 ${workType === option.id ? 'bg-gold-500' : 'bg-white'}`}
                      >
                        <option.icon size={16} color={workType === option.id ? '#FFFFFF' : '#8B7355'} />
                        <Text className={`ml-1.5 font-medium text-sm ${workType === option.id ? 'text-white' : 'text-warmBrown'}`}>{option.label}</Text>
                      </Pressable>
                    ))}
                  </View>
                </View>

                {/* Duration */}
                <View className="mb-4">
                  <Text className="text-warmBrown font-semibold mb-2">Duration *</Text>
                  <View className="flex-row flex-wrap">
                    {DURATION_OPTIONS.map((option) => (
                      <Pressable
                        key={option}
                        onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setDuration(option); }}
                        className={`py-2.5 px-4 rounded-full mr-2 mb-2 ${duration === option ? 'bg-gold-500' : 'bg-white'}`}
                      >
                        <Text className={`font-medium ${duration === option ? 'text-white' : 'text-warmBrown'}`}>{option}</Text>
                      </Pressable>
                    ))}
                  </View>
                </View>

                {/* Compensation */}
                <View className="mb-4">
                  <Text className="text-warmBrown font-semibold mb-2">Compensation</Text>
                  <View className="flex-row mb-3">
                    <Pressable
                      onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setIsPaid(true); }}
                      className={`flex-1 py-3 rounded-xl mr-2 ${isPaid ? 'bg-forest-600' : 'bg-white'}`}
                    >
                      <Text className={`text-center font-medium ${isPaid ? 'text-white' : 'text-warmBrown'}`}>Paid</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setIsPaid(false); setCompensation(''); }}
                      className={`flex-1 py-3 rounded-xl ml-2 ${!isPaid ? 'bg-forest-600' : 'bg-white'}`}
                    >
                      <Text className={`text-center font-medium ${!isPaid ? 'text-white' : 'text-warmBrown'}`}>Unpaid</Text>
                    </Pressable>
                  </View>
                  {isPaid && (
                    <View className="flex-row items-center bg-white rounded-xl px-4">
                      <DollarSign size={20} color="#8B7355" />
                      <TextInput
                        placeholder="e.g., $20-25/hr or $3000/month"
                        placeholderTextColor="#9CA3AF"
                        value={compensation}
                        onChangeText={setCompensation}
                        className="flex-1 py-3.5 ml-3 text-warmBrown"
                      />
                    </View>
                  )}
                </View>

                {/* Application Deadline */}
                <View className="mb-4">
                  <Text className="text-warmBrown font-semibold mb-2">Application Deadline</Text>
                  <View className="flex-row items-center bg-white rounded-xl px-4">
                    <Calendar size={20} color="#8B7355" />
                    <TextInput
                      placeholder="e.g., January 31, 2025"
                      placeholderTextColor="#9CA3AF"
                      value={applicationDeadline}
                      onChangeText={setApplicationDeadline}
                      className="flex-1 py-3.5 ml-3 text-warmBrown"
                    />
                  </View>
                </View>
              </Animated.View>
            )}

            {currentStep === 3 && (
              <Animated.View entering={FadeInUp.duration(400)}>
                <Text className="text-2xl font-bold text-warmBrown mt-4 mb-2">Description & Application</Text>
                <Text className="text-gray-500 mb-6">Help candidates understand the role</Text>

                {/* Description */}
                <View className="mb-4">
                  <Text className="text-warmBrown font-semibold mb-2">Job Description * (min 100 characters)</Text>
                  <TextInput
                    placeholder="Describe the internship role, responsibilities, learning opportunities, and what a typical day looks like..."
                    placeholderTextColor="#9CA3AF"
                    multiline
                    value={description}
                    onChangeText={setDescription}
                    className="bg-white rounded-xl px-4 py-3.5 text-warmBrown min-h-[140px]"
                    style={{ textAlignVertical: 'top' }}
                  />
                  <Text className="text-gray-400 text-sm mt-1">{description.length}/100 minimum</Text>
                </View>

                {/* Requirements */}
                <View className="mb-4">
                  <Text className="text-warmBrown font-semibold mb-2">Requirements & Qualifications</Text>
                  <TextInput
                    placeholder="List required skills, education level, year of study, etc..."
                    placeholderTextColor="#9CA3AF"
                    multiline
                    value={requirements}
                    onChangeText={setRequirements}
                    className="bg-white rounded-xl px-4 py-3.5 text-warmBrown min-h-[100px]"
                    style={{ textAlignVertical: 'top' }}
                  />
                </View>

                {/* Contact */}
                <View className="mb-4">
                  <Text className="text-warmBrown font-semibold mb-2">How to Apply</Text>

                  <View className="flex-row items-center bg-white rounded-xl px-4 mb-3">
                    <Mail size={20} color="#8B7355" />
                    <TextInput
                      placeholder="Contact email *"
                      placeholderTextColor="#9CA3AF"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      value={contactEmail}
                      onChangeText={setContactEmail}
                      className="flex-1 py-3.5 ml-3 text-warmBrown"
                    />
                  </View>

                  <View className="flex-row items-center bg-white rounded-xl px-4">
                    <LinkIcon size={20} color="#8B7355" />
                    <TextInput
                      placeholder="Application link (optional)"
                      placeholderTextColor="#9CA3AF"
                      keyboardType="url"
                      autoCapitalize="none"
                      value={applicationLink}
                      onChangeText={setApplicationLink}
                      className="flex-1 py-3.5 ml-3 text-warmBrown"
                    />
                  </View>
                </View>

                {/* Tip Box */}
                <View className="bg-gold-50 rounded-xl p-4 mb-4">
                  <Text className="text-gold-800 text-sm">
                    <Text className="font-bold">Tip:</Text> Internships that provide mentorship and clear learning outcomes attract more qualified African students in the diaspora.
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
              colors={canProceed() ? ['#C9A227', '#A6841F'] : ['#D1D5DB', '#9CA3AF']}
              style={{ borderRadius: 16, paddingVertical: 18, alignItems: 'center' }}
            >
              <Text className="text-white font-bold text-lg">
                {currentStep < 3 ? 'Continue' : 'Post Internship'}
              </Text>
            </LinearGradient>
          </Pressable>
        </View>

        {/* Industry Modal */}
        <Modal visible={showIndustryModal} animationType="slide" transparent>
          <View className="flex-1 bg-black/50 justify-end">
            <View className="bg-cream rounded-t-3xl max-h-[70%]">
              <View className="flex-row items-center justify-between px-5 py-4 border-b border-gray-100">
                <Text className="text-lg font-bold text-warmBrown">Select Industry</Text>
                <Pressable onPress={() => setShowIndustryModal(false)}>
                  <X size={24} color="#2D1F1A" />
                </Pressable>
              </View>
              <ScrollView className="px-5 py-2">
                {INDUSTRIES.map((ind) => (
                  <Pressable
                    key={ind}
                    onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setIndustry(ind); setShowIndustryModal(false); }}
                    className="flex-row items-center py-4 border-b border-gray-100"
                  >
                    <Text className="flex-1 text-warmBrown">{ind}</Text>
                    {industry === ind && <Check size={20} color="#C9A227" />}
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
