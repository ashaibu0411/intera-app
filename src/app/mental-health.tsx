import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Heart, Brain, Smile, Frown, Meh, TrendingUp, Calendar, Lock, X, Check, ChevronRight, Sparkles, MessageCircle, Phone, ExternalLink } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

interface MoodEntry {
  id: string;
  date: string;
  mood: 'great' | 'good' | 'okay' | 'bad' | 'terrible';
  notes: string;
  activities: string[];
}

interface Resource {
  id: string;
  title: string;
  description: string;
  type: 'hotline' | 'app' | 'article' | 'community';
  link?: string;
  phone?: string;
}

const MOOD_OPTIONS = [
  { key: 'great', emoji: '😊', label: 'Great', color: '#10B981' },
  { key: 'good', emoji: '🙂', label: 'Good', color: '#3B82F6' },
  { key: 'okay', emoji: '😐', label: 'Okay', color: '#F59E0B' },
  { key: 'bad', emoji: '😔', label: 'Bad', color: '#F97316' },
  { key: 'terrible', emoji: '😢', label: 'Terrible', color: '#EF4444' },
];

const ACTIVITIES = [
  { emoji: '🏃', label: 'Exercise' },
  { emoji: '🧘', label: 'Meditation' },
  { emoji: '👥', label: 'Social' },
  { emoji: '💼', label: 'Work' },
  { emoji: '📚', label: 'Learning' },
  { emoji: '🎨', label: 'Creative' },
  { emoji: '😴', label: 'Rest' },
  { emoji: '🍽️', label: 'Eating Well' },
  { emoji: '🎵', label: 'Music' },
  { emoji: '🌳', label: 'Nature' },
  { emoji: '✝️', label: 'Faith' },
  { emoji: '❤️', label: 'Family' },
];

const MOCK_ENTRIES: MoodEntry[] = [
  { id: '1', date: 'Today', mood: 'good', notes: 'Had a productive day at work', activities: ['Work', 'Exercise'] },
  { id: '2', date: 'Yesterday', mood: 'great', notes: 'Spent time with family', activities: ['Family', 'Social', 'Faith'] },
  { id: '3', date: 'Jan 8', mood: 'okay', notes: 'Feeling a bit tired', activities: ['Work', 'Rest'] },
  { id: '4', date: 'Jan 7', mood: 'bad', notes: 'Stressful day, missing home', activities: ['Work'] },
  { id: '5', date: 'Jan 6', mood: 'good', notes: 'Great workout session', activities: ['Exercise', 'Music'] },
];

const RESOURCES: Resource[] = [
  {
    id: '1',
    title: '988 Suicide & Crisis Lifeline',
    description: 'Free, confidential support 24/7. Call or text 988.',
    type: 'hotline',
    phone: '988',
  },
  {
    id: '2',
    title: 'Crisis Text Line',
    description: 'Text HOME to 741741 to connect with a counselor.',
    type: 'hotline',
    phone: '741741',
  },
  {
    id: '3',
    title: 'Black Mental Health Alliance',
    description: 'Resources and support for the Black community.',
    type: 'community',
    link: 'https://blackmentalhealth.com',
  },
  {
    id: '4',
    title: 'Therapy for Black Girls',
    description: 'Find culturally competent therapists.',
    type: 'community',
    link: 'https://therapyforblackgirls.com',
  },
];

export default function MentalHealthScreen() {
  const router = useRouter();
  const [entries, setEntries] = useState(MOCK_ENTRIES);
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [showResourcesModal, setShowResourcesModal] = useState(false);
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [selectedActivities, setSelectedActivities] = useState<string[]>([]);
  const [notes, setNotes] = useState('');

  const moodCounts = MOOD_OPTIONS.map(mood => ({
    ...mood,
    count: entries.filter(e => e.mood === mood.key).length,
  }));

  const toggleActivity = (activity: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedActivities(prev =>
      prev.includes(activity)
        ? prev.filter(a => a !== activity)
        : [...prev, activity]
    );
  };

  const submitCheckIn = () => {
    if (!selectedMood) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const newEntry: MoodEntry = {
      id: Date.now().toString(),
      date: 'Today',
      mood: selectedMood as MoodEntry['mood'],
      notes,
      activities: selectedActivities,
    };
    setEntries([newEntry, ...entries.slice(1)]);
    setShowCheckInModal(false);
    setSelectedMood(null);
    setSelectedActivities([]);
    setNotes('');
  };

  return (
    <View className="flex-1 bg-[#F0F4F8]">
      <SafeAreaView edges={['top']} className="flex-1">
        {/* Header */}
        <View className="px-5 pb-4">
          <View className="flex-row items-center justify-between mb-4">
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.back();
              }}
              className="w-10 h-10 rounded-full bg-white items-center justify-center shadow-sm"
            >
              <ArrowLeft size={20} color="#6366F1" />
            </Pressable>
            <View className="flex-row items-center">
              <Heart size={20} color="#EC4899" />
              <Text className="text-gray-800 text-lg font-bold ml-2">Mental Wellness</Text>
            </View>
            <Pressable
              onPress={() => setShowResourcesModal(true)}
              className="w-10 h-10 rounded-full bg-white items-center justify-center shadow-sm"
            >
              <Phone size={20} color="#EF4444" />
            </Pressable>
          </View>

          {/* Hero Card */}
          <LinearGradient
            colors={['#6366F1', '#8B5CF6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ borderRadius: 24, padding: 20, marginBottom: 16 }}
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <Text className="text-white/80 text-sm">Your mental health matters</Text>
                <Text className="text-white text-xl font-bold mt-1">How are you feeling today?</Text>
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    setShowCheckInModal(true);
                  }}
                  className="bg-white/20 self-start px-4 py-2 rounded-full mt-3"
                >
                  <Text className="text-white font-semibold">Check In Now</Text>
                </Pressable>
              </View>
              <View className="w-16 h-16 rounded-full bg-white/20 items-center justify-center">
                <Brain size={32} color="#fff" />
              </View>
            </View>
          </LinearGradient>

          {/* Mood Stats */}
          <View className="bg-white rounded-2xl p-4 shadow-sm">
            <Text className="text-gray-800 font-bold mb-3">Your Mood This Week</Text>
            <View className="flex-row justify-between">
              {moodCounts.map((mood) => (
                <View key={mood.key} className="items-center">
                  <Text className="text-2xl mb-1">{mood.emoji}</Text>
                  <View
                    className="w-8 h-8 rounded-full items-center justify-center"
                    style={{ backgroundColor: mood.color + '20' }}
                  >
                    <Text style={{ color: mood.color }} className="font-bold">{mood.count}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        </View>

        <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
          {/* Mood History */}
          <View className="mb-6">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-gray-800 font-bold text-lg">Recent Check-ins</Text>
              <Pressable className="flex-row items-center">
                <Calendar size={16} color="#6366F1" />
                <Text className="text-indigo-500 ml-1 font-medium">View All</Text>
              </Pressable>
            </View>

            {entries.map((entry, index) => {
              const moodData = MOOD_OPTIONS.find(m => m.key === entry.mood);
              return (
                <Animated.View
                  key={entry.id}
                  entering={FadeInDown.delay(index * 60).springify()}
                >
                  <Pressable className="bg-white rounded-2xl p-4 mb-3 shadow-sm">
                    <View className="flex-row items-center justify-between mb-2">
                      <View className="flex-row items-center">
                        <View
                          className="w-10 h-10 rounded-full items-center justify-center"
                          style={{ backgroundColor: moodData?.color + '20' }}
                        >
                          <Text className="text-xl">{moodData?.emoji}</Text>
                        </View>
                        <View className="ml-3">
                          <Text className="text-gray-800 font-bold">{moodData?.label}</Text>
                          <Text className="text-gray-400 text-sm">{entry.date}</Text>
                        </View>
                      </View>
                      <ChevronRight size={20} color="#9CA3AF" />
                    </View>

                    {entry.notes && (
                      <Text className="text-gray-600 text-sm mb-2">{entry.notes}</Text>
                    )}

                    {entry.activities.length > 0 && (
                      <View className="flex-row flex-wrap gap-1">
                        {entry.activities.map((activity, idx) => {
                          const actData = ACTIVITIES.find(a => a.label === activity);
                          return (
                            <View key={idx} className="bg-gray-100 px-2 py-1 rounded-full flex-row items-center">
                              <Text className="text-xs">{actData?.emoji}</Text>
                              <Text className="text-gray-600 text-xs ml-1">{activity}</Text>
                            </View>
                          );
                        })}
                      </View>
                    )}
                  </Pressable>
                </Animated.View>
              );
            })}
          </View>

          {/* Quick Resources */}
          <View className="mb-6">
            <Text className="text-gray-800 font-bold text-lg mb-3">Support Resources</Text>
            <Pressable
              onPress={() => setShowResourcesModal(true)}
              className="bg-red-50 border border-red-200 rounded-2xl p-4"
            >
              <View className="flex-row items-center">
                <View className="w-12 h-12 rounded-full bg-red-100 items-center justify-center">
                  <Phone size={24} color="#EF4444" />
                </View>
                <View className="flex-1 ml-3">
                  <Text className="text-red-700 font-bold">Need to talk to someone?</Text>
                  <Text className="text-red-600 text-sm">Access crisis helplines and support resources</Text>
                </View>
                <ChevronRight size={20} color="#EF4444" />
              </View>
            </Pressable>
          </View>

          {/* Tips */}
          <View className="mb-6">
            <Text className="text-gray-800 font-bold text-lg mb-3">Daily Wellness Tips</Text>
            <View className="bg-white rounded-2xl p-4 shadow-sm">
              <View className="flex-row items-center mb-3">
                <Sparkles size={20} color="#F59E0B" />
                <Text className="text-gray-800 font-bold ml-2">Tip of the Day</Text>
              </View>
              <Text className="text-gray-600 leading-6">
                Take 5 minutes to practice deep breathing. Inhale for 4 counts, hold for 4, exhale for 4. This activates your parasympathetic nervous system and reduces stress.
              </Text>
            </View>
          </View>

          <View className="h-32" />
        </ScrollView>

        {/* Check-In Modal */}
        <Modal visible={showCheckInModal} animationType="slide" transparent>
          <View className="flex-1 bg-black/50 justify-end">
            <View className="bg-white rounded-t-3xl p-6 max-h-[85%]">
              <View className="flex-row items-center justify-between mb-6">
                <Text className="text-gray-800 text-xl font-bold">Daily Check-In</Text>
                <Pressable
                  onPress={() => setShowCheckInModal(false)}
                  className="w-8 h-8 rounded-full bg-gray-100 items-center justify-center"
                >
                  <X size={18} color="#6B7280" />
                </Pressable>
              </View>

              <ScrollView>
                {/* Mood Selection */}
                <View className="mb-6">
                  <Text className="text-gray-700 font-bold mb-3">How are you feeling?</Text>
                  <View className="flex-row justify-between">
                    {MOOD_OPTIONS.map((mood) => (
                      <Pressable
                        key={mood.key}
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                          setSelectedMood(mood.key);
                        }}
                        className={`items-center p-3 rounded-2xl ${
                          selectedMood === mood.key ? 'bg-indigo-100' : ''
                        }`}
                        style={selectedMood === mood.key ? { borderWidth: 2, borderColor: mood.color } : {}}
                      >
                        <Text className="text-3xl mb-1">{mood.emoji}</Text>
                        <Text className={`text-sm ${selectedMood === mood.key ? 'font-bold' : ''}`} style={{ color: mood.color }}>
                          {mood.label}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>

                {/* Activities */}
                <View className="mb-6">
                  <Text className="text-gray-700 font-bold mb-3">What have you been up to?</Text>
                  <View className="flex-row flex-wrap gap-2">
                    {ACTIVITIES.map((activity) => (
                      <Pressable
                        key={activity.label}
                        onPress={() => toggleActivity(activity.label)}
                        className={`flex-row items-center px-3 py-2 rounded-full ${
                          selectedActivities.includes(activity.label)
                            ? 'bg-indigo-500'
                            : 'bg-gray-100'
                        }`}
                      >
                        <Text>{activity.emoji}</Text>
                        <Text className={`ml-1 ${
                          selectedActivities.includes(activity.label) ? 'text-white' : 'text-gray-700'
                        }`}>
                          {activity.label}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>

                {/* Privacy Note */}
                <View className="bg-gray-50 rounded-xl p-4 mb-6">
                  <View className="flex-row items-center">
                    <Lock size={16} color="#6B7280" />
                    <Text className="text-gray-500 text-sm ml-2">Your entries are private and stored only on your device.</Text>
                  </View>
                </View>

                {/* Submit */}
                <Pressable
                  onPress={submitCheckIn}
                  disabled={!selectedMood}
                  className={`rounded-xl py-4 items-center ${
                    selectedMood ? 'bg-indigo-500' : 'bg-gray-200'
                  }`}
                >
                  <Text className={`font-bold text-lg ${selectedMood ? 'text-white' : 'text-gray-400'}`}>
                    Save Check-In
                  </Text>
                </Pressable>

                <View className="h-8" />
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Resources Modal */}
        <Modal visible={showResourcesModal} animationType="slide" transparent>
          <View className="flex-1 bg-black/50 justify-end">
            <View className="bg-white rounded-t-3xl p-6">
              <View className="flex-row items-center justify-between mb-6">
                <Text className="text-gray-800 text-xl font-bold">Support Resources</Text>
                <Pressable
                  onPress={() => setShowResourcesModal(false)}
                  className="w-8 h-8 rounded-full bg-gray-100 items-center justify-center"
                >
                  <X size={18} color="#6B7280" />
                </Pressable>
              </View>

              {/* Emergency Banner */}
              <View className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
                <Text className="text-red-700 font-bold mb-1">If you're in immediate danger</Text>
                <Text className="text-red-600 text-sm">Call 911 or go to your nearest emergency room</Text>
              </View>

              {RESOURCES.map((resource, index) => (
                <Pressable
                  key={resource.id}
                  className="flex-row items-center py-4 border-b border-gray-100"
                >
                  <View className={`w-10 h-10 rounded-full items-center justify-center ${
                    resource.type === 'hotline' ? 'bg-red-100' : 'bg-indigo-100'
                  }`}>
                    {resource.type === 'hotline' ? (
                      <Phone size={20} color="#EF4444" />
                    ) : resource.type === 'community' ? (
                      <MessageCircle size={20} color="#6366F1" />
                    ) : (
                      <ExternalLink size={20} color="#6366F1" />
                    )}
                  </View>
                  <View className="flex-1 ml-3">
                    <Text className="text-gray-800 font-bold">{resource.title}</Text>
                    <Text className="text-gray-500 text-sm">{resource.description}</Text>
                  </View>
                  <ChevronRight size={20} color="#9CA3AF" />
                </Pressable>
              ))}

              <View className="h-8" />
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </View>
  );
}
