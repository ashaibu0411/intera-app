import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, KeyboardAvoidingView, Platform, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ChevronLeft,
  BookOpen,
  Users,
  MapPin,
  Clock,
  X,
  Check,
  ImagePlus,
  Calendar,
  Globe,
  Lock,
} from 'lucide-react-native';
import { Image } from 'expo-image';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useStore, MOCK_COMMUNITIES } from '@/lib/store';

const SUBJECTS = [
  'Computer Science',
  'Medicine & Pre-Med',
  'Business & Finance',
  'Engineering',
  'Law & Pre-Law',
  'Mathematics',
  'Natural Sciences',
  'Social Sciences',
  'Arts & Humanities',
  'Languages',
  'Other',
];

const MEETING_FREQUENCIES = [
  'Daily',
  'Weekly',
  'Bi-weekly',
  'Monthly',
  'As needed',
];

export default function CreateStudyGroupScreen() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [subject, setSubject] = useState('');
  const [meetingDay, setMeetingDay] = useState('');
  const [meetingTime, setMeetingTime] = useState('');
  const [meetingFrequency, setMeetingFrequency] = useState('Weekly');
  const [location, setLocation] = useState('');
  const [isOnline, setIsOnline] = useState(false);
  const [isPublic, setIsPublic] = useState(true);
  const [maxMembers, setMaxMembers] = useState('');
  const [groupImage, setGroupImage] = useState<string | null>(null);
  const [showSubjectModal, setShowSubjectModal] = useState(false);

  const currentUser = useStore((s) => s.currentUser);
  const selectedLocation = useStore((s) => s.selectedLocation);
  const displayLocation = selectedLocation?.city || MOCK_COMMUNITIES[0].city;

  const handlePickImage = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });

    if (!result.canceled && result.assets.length > 0) {
      setGroupImage(result.assets[0].uri);
    }
  };

  const handleCreate = () => {
    if (!name.trim() || !subject || !description.trim()) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    // TODO: Save to Supabase
    router.back();
  };

  const canCreate = name.trim().length > 0 && subject.length > 0 && description.trim().length > 0;

  if (!currentUser) {
    return (
      <View className="flex-1 bg-cream justify-center items-center px-6">
        <Text className="text-warmBrown text-lg text-center">Please sign in to create a study group</Text>
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
        <Animated.View entering={FadeIn.duration(300)} className="flex-row items-center justify-between px-5 py-4 border-b border-gray-100">
          <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.back(); }} className="p-2 -ml-2">
            <ChevronLeft size={24} color="#2D1F1A" />
          </Pressable>
          <Text className="text-lg font-bold text-warmBrown">Create Study Group</Text>
          <Pressable onPress={handleCreate} disabled={!canCreate}>
            <LinearGradient
              colors={canCreate ? ['#1B4D3E', '#153D31'] : ['#D1D5DB', '#9CA3AF']}
              style={{ borderRadius: 20, paddingVertical: 10, paddingHorizontal: 16 }}
            >
              <Text className="text-white font-semibold">Create</Text>
            </LinearGradient>
          </Pressable>
        </Animated.View>

        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
          <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
            {/* Group Image */}
            <Animated.View entering={FadeInUp.duration(400).delay(100)} className="py-4">
              <Text className="text-warmBrown font-semibold mb-3">Group Image</Text>
              <Pressable onPress={handlePickImage}>
                {groupImage ? (
                  <View className="relative">
                    <Image source={{ uri: groupImage }} style={{ width: '100%', height: 150, borderRadius: 16 }} contentFit="cover" />
                    <Pressable onPress={() => setGroupImage(null)} className="absolute top-2 right-2 bg-warmBrown rounded-full p-2">
                      <X size={16} color="#FFFFFF" />
                    </Pressable>
                  </View>
                ) : (
                  <View className="w-full h-[150px] bg-gray-100 rounded-2xl items-center justify-center border-2 border-dashed border-gray-300">
                    <ImagePlus size={32} color="#9CA3AF" />
                    <Text className="text-gray-400 mt-2">Add group image (optional)</Text>
                  </View>
                )}
              </Pressable>
            </Animated.View>

            {/* Group Name */}
            <Animated.View entering={FadeInUp.duration(400).delay(150)} className="mb-4">
              <Text className="text-warmBrown font-semibold mb-2">Group Name *</Text>
              <View className="flex-row items-center bg-white rounded-xl px-4">
                <BookOpen size={20} color="#8B7355" />
                <TextInput
                  placeholder="e.g., Pre-Med Study Circle"
                  placeholderTextColor="#9CA3AF"
                  value={name}
                  onChangeText={setName}
                  className="flex-1 py-3.5 ml-3 text-warmBrown"
                />
              </View>
            </Animated.View>

            {/* Subject */}
            <Animated.View entering={FadeInUp.duration(400).delay(200)} className="mb-4">
              <Text className="text-warmBrown font-semibold mb-2">Subject/Field *</Text>
              <Pressable onPress={() => setShowSubjectModal(true)} className="bg-white rounded-xl px-4 py-3.5 flex-row items-center justify-between">
                <Text className={subject ? 'text-warmBrown' : 'text-gray-400'}>
                  {subject || 'Select subject'}
                </Text>
                <ChevronLeft size={20} color="#8B7355" style={{ transform: [{ rotate: '-90deg' }] }} />
              </Pressable>
            </Animated.View>

            {/* Description */}
            <Animated.View entering={FadeInUp.duration(400).delay(250)} className="mb-4">
              <Text className="text-warmBrown font-semibold mb-2">Description *</Text>
              <TextInput
                placeholder="What will your group focus on? Who should join?"
                placeholderTextColor="#9CA3AF"
                multiline
                value={description}
                onChangeText={setDescription}
                className="bg-white rounded-xl px-4 py-3.5 text-warmBrown min-h-[100px]"
                style={{ textAlignVertical: 'top' }}
              />
            </Animated.View>

            {/* Meeting Schedule */}
            <Animated.View entering={FadeInUp.duration(400).delay(300)} className="mb-4">
              <Text className="text-warmBrown font-semibold mb-2">Meeting Schedule</Text>
              <View className="flex-row mb-3">
                <View className="flex-1 mr-2">
                  <View className="flex-row items-center bg-white rounded-xl px-4">
                    <Calendar size={20} color="#8B7355" />
                    <TextInput
                      placeholder="Day (e.g., Saturday)"
                      placeholderTextColor="#9CA3AF"
                      value={meetingDay}
                      onChangeText={setMeetingDay}
                      className="flex-1 py-3.5 ml-2 text-warmBrown"
                    />
                  </View>
                </View>
                <View className="flex-1 ml-2">
                  <View className="flex-row items-center bg-white rounded-xl px-4">
                    <Clock size={20} color="#8B7355" />
                    <TextInput
                      placeholder="Time (e.g., 2 PM)"
                      placeholderTextColor="#9CA3AF"
                      value={meetingTime}
                      onChangeText={setMeetingTime}
                      className="flex-1 py-3.5 ml-2 text-warmBrown"
                    />
                  </View>
                </View>
              </View>

              {/* Frequency */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }}>
                {MEETING_FREQUENCIES.map((freq) => (
                  <Pressable
                    key={freq}
                    onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setMeetingFrequency(freq); }}
                    className={`px-4 py-2 rounded-full mr-2 ${meetingFrequency === freq ? 'bg-forest-600' : 'bg-white'}`}
                  >
                    <Text className={meetingFrequency === freq ? 'text-white font-medium' : 'text-warmBrown'}>{freq}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </Animated.View>

            {/* Location */}
            <Animated.View entering={FadeInUp.duration(400).delay(350)} className="mb-4">
              <Text className="text-warmBrown font-semibold mb-2">Meeting Location</Text>

              {/* Online/In-person toggle */}
              <View className="flex-row mb-3">
                <Pressable
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setIsOnline(false); }}
                  className={`flex-1 flex-row items-center justify-center py-3 rounded-xl mr-2 ${!isOnline ? 'bg-forest-600' : 'bg-white'}`}
                >
                  <MapPin size={18} color={!isOnline ? '#FFFFFF' : '#8B7355'} />
                  <Text className={`ml-2 font-medium ${!isOnline ? 'text-white' : 'text-warmBrown'}`}>In-Person</Text>
                </Pressable>
                <Pressable
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setIsOnline(true); }}
                  className={`flex-1 flex-row items-center justify-center py-3 rounded-xl ml-2 ${isOnline ? 'bg-forest-600' : 'bg-white'}`}
                >
                  <Globe size={18} color={isOnline ? '#FFFFFF' : '#8B7355'} />
                  <Text className={`ml-2 font-medium ${isOnline ? 'text-white' : 'text-warmBrown'}`}>Online</Text>
                </Pressable>
              </View>

              {!isOnline && (
                <View className="flex-row items-center bg-white rounded-xl px-4">
                  <MapPin size={20} color="#8B7355" />
                  <TextInput
                    placeholder={`Location in ${displayLocation}`}
                    placeholderTextColor="#9CA3AF"
                    value={location}
                    onChangeText={setLocation}
                    className="flex-1 py-3.5 ml-3 text-warmBrown"
                  />
                </View>
              )}
            </Animated.View>

            {/* Group Settings */}
            <Animated.View entering={FadeInUp.duration(400).delay(400)} className="mb-4">
              <Text className="text-warmBrown font-semibold mb-3">Group Settings</Text>

              {/* Public/Private */}
              <View className="bg-white rounded-xl p-4 mb-3">
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center flex-1">
                    {isPublic ? <Globe size={20} color="#1B4D3E" /> : <Lock size={20} color="#C9A227" />}
                    <View className="ml-3 flex-1">
                      <Text className="text-warmBrown font-medium">{isPublic ? 'Public Group' : 'Private Group'}</Text>
                      <Text className="text-gray-500 text-sm">{isPublic ? 'Anyone can find and join' : 'Invite only'}</Text>
                    </View>
                  </View>
                  <Pressable
                    onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setIsPublic(!isPublic); }}
                    className={`w-12 h-7 rounded-full justify-center ${isPublic ? 'bg-forest-600' : 'bg-gray-300'}`}
                  >
                    <View className={`w-5 h-5 rounded-full bg-white mx-1 ${isPublic ? 'self-end' : 'self-start'}`} />
                  </Pressable>
                </View>
              </View>

              {/* Max Members */}
              <View className="flex-row items-center bg-white rounded-xl px-4">
                <Users size={20} color="#8B7355" />
                <TextInput
                  placeholder="Max members (optional)"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="number-pad"
                  value={maxMembers}
                  onChangeText={setMaxMembers}
                  className="flex-1 py-3.5 ml-3 text-warmBrown"
                />
              </View>
            </Animated.View>

            <View className="h-8" />
          </ScrollView>
        </KeyboardAvoidingView>

        {/* Subject Modal */}
        <Modal visible={showSubjectModal} animationType="slide" transparent>
          <View className="flex-1 bg-black/50 justify-end">
            <View className="bg-cream rounded-t-3xl max-h-[70%]">
              <View className="flex-row items-center justify-between px-5 py-4 border-b border-gray-100">
                <Text className="text-lg font-bold text-warmBrown">Select Subject</Text>
                <Pressable onPress={() => setShowSubjectModal(false)}>
                  <X size={24} color="#2D1F1A" />
                </Pressable>
              </View>
              <ScrollView className="px-5 py-2">
                {SUBJECTS.map((subj) => (
                  <Pressable
                    key={subj}
                    onPress={() => { setSubject(subj); setShowSubjectModal(false); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                    className="flex-row items-center py-4 border-b border-gray-100"
                  >
                    <Text className="flex-1 text-warmBrown">{subj}</Text>
                    {subject === subj && <Check size={20} color="#1B4D3E" />}
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
