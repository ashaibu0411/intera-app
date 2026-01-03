import { useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, Switch } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Globe, Clock, Users, Video, MapPin, ChevronRight } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

const LANGUAGES = [
  'Swahili', 'Yoruba', 'Igbo', 'Hausa', 'Amharic', 'Zulu', 'Wolof', 'Twi', 'Shona',
  'Lingala', 'Fula', 'Oromo', 'Somali', 'Tigrinya', 'Kinyarwanda', 'Other'
];

const LEVELS = [
  { id: 'beginner', label: 'Beginner', desc: 'No prior knowledge needed' },
  { id: 'intermediate', label: 'Intermediate', desc: 'Some basic knowledge required' },
  { id: 'advanced', label: 'Advanced', desc: 'For fluent speakers wanting practice' },
];

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function CreateLanguagePodScreen() {
  const router = useRouter();
  const [language, setLanguage] = useState('');
  const [dialect, setDialect] = useState('');
  const [level, setLevel] = useState('beginner');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [maxParticipants, setMaxParticipants] = useState('10');
  const [isOnline, setIsOnline] = useState(true);
  const [meetingDay, setMeetingDay] = useState(0);
  const [meetingTime, setMeetingTime] = useState('19:00');
  const [duration, setDuration] = useState('60');
  const [step, setStep] = useState(1);

  const handleCreate = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.back();
  };

  const isStepValid = () => {
    if (step === 1) return language !== '';
    if (step === 2) return title.trim() !== '' && description.trim() !== '';
    return true;
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FAF7F2' }} edges={['top']}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Host a Language Pod',
          headerStyle: { backgroundColor: '#FAF7F2' },
          headerTintColor: '#1B4D3E',
        }}
      />

      <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
        {/* Progress */}
        <View className="flex-row items-center justify-center mt-4 mb-6">
          {[1, 2, 3].map((s) => (
            <View key={s} className="flex-row items-center">
              <View className={`w-8 h-8 rounded-full items-center justify-center ${step >= s ? 'bg-emerald-800' : 'bg-gray-200'}`}>
                <Text className={`font-bold ${step >= s ? 'text-white' : 'text-gray-500'}`}>{s}</Text>
              </View>
              {s < 3 && <View className={`w-12 h-1 ${step > s ? 'bg-emerald-800' : 'bg-gray-200'}`} />}
            </View>
          ))}
        </View>

        {/* Step 1: Language Selection */}
        {step === 1 && (
          <Animated.View entering={FadeInDown}>
            <Text className="text-gray-900 font-bold text-xl mb-2">Which language will you teach?</Text>
            <Text className="text-gray-500 mb-4">Select the African language you'll be teaching in this pod.</Text>

            <View className="flex-row flex-wrap gap-2 mb-6">
              {LANGUAGES.map((lang) => (
                <Pressable
                  key={lang}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setLanguage(lang);
                  }}
                  className={`px-4 py-2 rounded-full ${language === lang ? 'bg-emerald-800' : 'bg-white'}`}
                >
                  <Text className={`font-medium ${language === lang ? 'text-white' : 'text-gray-700'}`}>{lang}</Text>
                </Pressable>
              ))}
            </View>

            {language && (
              <View className="mb-6">
                <Text className="text-gray-700 font-medium mb-2">Dialect (optional)</Text>
                <TextInput
                  value={dialect}
                  onChangeText={setDialect}
                  placeholder="e.g., Central Igbo, Krio"
                  placeholderTextColor="#9CA3AF"
                  className="bg-white rounded-xl px-4 py-3 text-gray-900"
                />
              </View>
            )}

            <Text className="text-gray-900 font-bold text-lg mb-3">Skill Level</Text>
            {LEVELS.map((l) => (
              <Pressable
                key={l.id}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setLevel(l.id);
                }}
                className={`p-4 rounded-xl mb-2 ${level === l.id ? 'bg-emerald-100 border-2 border-emerald-800' : 'bg-white'}`}
              >
                <Text className={`font-semibold ${level === l.id ? 'text-emerald-800' : 'text-gray-900'}`}>{l.label}</Text>
                <Text className="text-gray-500 text-sm">{l.desc}</Text>
              </Pressable>
            ))}
          </Animated.View>
        )}

        {/* Step 2: Pod Details */}
        {step === 2 && (
          <Animated.View entering={FadeInDown}>
            <Text className="text-gray-900 font-bold text-xl mb-2">Tell us about your pod</Text>
            <Text className="text-gray-500 mb-4">Help learners understand what they'll gain from joining.</Text>

            <View className="mb-4">
              <Text className="text-gray-700 font-medium mb-2">Pod Title</Text>
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder={`e.g., Learn ${language} from Scratch`}
                placeholderTextColor="#9CA3AF"
                className="bg-white rounded-xl px-4 py-3 text-gray-900"
              />
            </View>

            <View className="mb-4">
              <Text className="text-gray-700 font-medium mb-2">Description</Text>
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="What will learners gain? What's your teaching style?"
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={4}
                className="bg-white rounded-xl px-4 py-3 text-gray-900 min-h-[120px]"
                textAlignVertical="top"
              />
            </View>

            <View className="mb-4">
              <Text className="text-gray-700 font-medium mb-2">Max Participants</Text>
              <View className="flex-row gap-2">
                {['5', '8', '10', '15', '20'].map((n) => (
                  <Pressable
                    key={n}
                    onPress={() => setMaxParticipants(n)}
                    className={`flex-1 py-3 rounded-xl items-center ${maxParticipants === n ? 'bg-emerald-800' : 'bg-white'}`}
                  >
                    <Text className={`font-semibold ${maxParticipants === n ? 'text-white' : 'text-gray-700'}`}>{n}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </Animated.View>
        )}

        {/* Step 3: Schedule */}
        {step === 3 && (
          <Animated.View entering={FadeInDown}>
            <Text className="text-gray-900 font-bold text-xl mb-2">Set your schedule</Text>
            <Text className="text-gray-500 mb-4">When will your pod meet?</Text>

            {/* Online/In-person toggle */}
            <View className="bg-white rounded-xl p-4 mb-4 flex-row items-center justify-between">
              <View className="flex-row items-center">
                <Video size={20} color="#1B4D3E" />
                <Text className="text-gray-900 font-medium ml-3">Online Sessions</Text>
              </View>
              <Switch
                value={isOnline}
                onValueChange={setIsOnline}
                trackColor={{ false: '#E5E7EB', true: '#1B4D3E' }}
                thumbColor="white"
              />
            </View>

            {/* Day Selection */}
            <Text className="text-gray-700 font-medium mb-2">Meeting Day</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4" style={{ flexGrow: 0 }}>
              <View className="flex-row gap-2">
                {DAYS.map((day, idx) => (
                  <Pressable
                    key={day}
                    onPress={() => setMeetingDay(idx)}
                    className={`px-4 py-3 rounded-xl ${meetingDay === idx ? 'bg-emerald-800' : 'bg-white'}`}
                  >
                    <Text className={`font-medium ${meetingDay === idx ? 'text-white' : 'text-gray-700'}`}>{day}</Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>

            {/* Time Selection */}
            <View className="flex-row gap-4 mb-4">
              <View className="flex-1">
                <Text className="text-gray-700 font-medium mb-2">Time</Text>
                <View className="bg-white rounded-xl px-4 py-3 flex-row items-center">
                  <Clock size={18} color="#6B7280" />
                  <TextInput
                    value={meetingTime}
                    onChangeText={setMeetingTime}
                    placeholder="19:00"
                    placeholderTextColor="#9CA3AF"
                    className="flex-1 ml-2 text-gray-900"
                  />
                </View>
              </View>
              <View className="flex-1">
                <Text className="text-gray-700 font-medium mb-2">Duration (min)</Text>
                <View className="flex-row gap-2">
                  {['30', '60', '90'].map((d) => (
                    <Pressable
                      key={d}
                      onPress={() => setDuration(d)}
                      className={`flex-1 py-3 rounded-xl items-center ${duration === d ? 'bg-emerald-800' : 'bg-white'}`}
                    >
                      <Text className={`font-medium ${duration === d ? 'text-white' : 'text-gray-700'}`}>{d}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            </View>

            {/* Summary */}
            <View className="bg-emerald-50 rounded-xl p-4 mt-4">
              <Text className="text-emerald-800 font-semibold mb-2">Pod Summary</Text>
              <View className="flex-row items-center mb-2">
                <Globe size={16} color="#1B4D3E" />
                <Text className="text-emerald-700 ml-2">{language} ({level})</Text>
              </View>
              <View className="flex-row items-center mb-2">
                <Clock size={16} color="#1B4D3E" />
                <Text className="text-emerald-700 ml-2">{DAYS[meetingDay]}s at {meetingTime} ({duration} min)</Text>
              </View>
              <View className="flex-row items-center">
                <Users size={16} color="#1B4D3E" />
                <Text className="text-emerald-700 ml-2">Up to {maxParticipants} participants</Text>
              </View>
            </View>
          </Animated.View>
        )}

        <View className="h-8" />
      </ScrollView>

      {/* Navigation Buttons */}
      <View className="px-4 py-4 bg-white border-t border-gray-100">
        <View className="flex-row gap-3">
          {step > 1 && (
            <Pressable
              onPress={() => setStep(step - 1)}
              className="flex-1 bg-gray-100 py-4 rounded-xl items-center"
            >
              <Text className="text-gray-700 font-semibold">Back</Text>
            </Pressable>
          )}
          <Pressable
            onPress={() => {
              if (step < 3) {
                setStep(step + 1);
              } else {
                handleCreate();
              }
            }}
            disabled={!isStepValid()}
            className={`flex-1 py-4 rounded-xl items-center ${isStepValid() ? 'bg-emerald-800' : 'bg-gray-200'}`}
          >
            <Text className={`font-semibold ${isStepValid() ? 'text-white' : 'text-gray-400'}`}>
              {step === 3 ? 'Create Pod' : 'Continue'}
            </Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}
