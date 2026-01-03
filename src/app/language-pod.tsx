import { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, Image, TextInput, Modal } from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Globe,
  Users,
  Clock,
  Calendar,
  MessageCircle,
  Video,
  Languages,
  Send,
  Mic,
  Volume2,
  Copy,
  Check,
  ChevronRight,
  BookOpen,
  Star,
} from 'lucide-react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

interface LanguagePod {
  id: string;
  hostId: string;
  hostName: string;
  hostAvatar: string;
  language: string;
  dialect?: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  title: string;
  description: string;
  maxParticipants: number;
  participants: { userId: string; userName: string; userAvatar: string }[];
  schedule: { dayOfWeek: number; time: string; duration: number }[];
  isOnline: boolean;
  meetingLink?: string;
  status: 'open' | 'full' | 'closed';
}

const MOCK_PODS: Record<string, LanguagePod> = {
  '1': {
    id: '1',
    hostId: '1',
    hostName: 'Adaeze Okonkwo',
    hostAvatar: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=100',
    language: 'Igbo',
    dialect: 'Central Igbo',
    level: 'beginner',
    title: 'Learn Igbo from Scratch',
    description: 'Perfect for those wanting to connect with their Nigerian Igbo heritage. We focus on practical phrases and cultural context.',
    maxParticipants: 12,
    participants: [
      { userId: '2', userName: 'James K.', userAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100' },
      { userId: '3', userName: 'Sarah M.', userAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100' },
    ],
    schedule: [{ dayOfWeek: 6, time: '10:00', duration: 60 }],
    isOnline: true,
    meetingLink: 'https://zoom.us/j/example',
    status: 'open',
  },
  '2': {
    id: '2',
    hostId: '2',
    hostName: 'Amadou Diallo',
    hostAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
    language: 'Wolof',
    level: 'intermediate',
    title: 'Wolof Conversation Practice',
    description: 'For those with basic Wolof who want to improve their speaking skills. We discuss everyday topics in Wolof.',
    maxParticipants: 8,
    participants: [
      { userId: '4', userName: 'Fatou S.', userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100' },
    ],
    schedule: [{ dayOfWeek: 0, time: '14:00', duration: 90 }],
    isOnline: true,
    status: 'open',
  },
  '3': {
    id: '3',
    hostId: '3',
    hostName: 'Amira Hassan',
    hostAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100',
    language: 'Swahili',
    level: 'beginner',
    title: 'Swahili for Beginners',
    description: 'Learn the beautiful language spoken across East Africa. Great for connecting with Kenyan, Tanzanian, and Ugandan communities.',
    maxParticipants: 15,
    participants: [],
    schedule: [{ dayOfWeek: 3, time: '19:00', duration: 60 }],
    isOnline: true,
    status: 'open',
  },
};

// Common phrases for each language
const LANGUAGE_PHRASES: Record<string, { phrase: string; translation: string; pronunciation: string }[]> = {
  'Igbo': [
    { phrase: 'Nnọọ', translation: 'Welcome', pronunciation: 'naw-aw' },
    { phrase: 'Kedu?', translation: 'How are you?', pronunciation: 'keh-doo' },
    { phrase: 'Ọ dị mma', translation: 'I am fine', pronunciation: 'oh dee mah' },
    { phrase: 'Daalu', translation: 'Thank you', pronunciation: 'dah-loo' },
    { phrase: 'Ndewo', translation: 'Hello', pronunciation: 'ndeh-wo' },
    { phrase: 'Ka ọ dị', translation: 'Goodbye', pronunciation: 'kah oh dee' },
  ],
  'Wolof': [
    { phrase: 'Salaam aleekum', translation: 'Hello (Peace be with you)', pronunciation: 'sah-lahm ah-lay-koom' },
    { phrase: 'Nanga def?', translation: 'How are you?', pronunciation: 'nahn-gah def' },
    { phrase: 'Mangi fi rekk', translation: 'I am fine', pronunciation: 'mahn-gee fee reck' },
    { phrase: 'Jërejëf', translation: 'Thank you', pronunciation: 'jeh-reh-jef' },
    { phrase: 'Ba beneen', translation: 'Goodbye', pronunciation: 'bah beh-nehn' },
  ],
  'Swahili': [
    { phrase: 'Jambo', translation: 'Hello', pronunciation: 'jahm-boh' },
    { phrase: 'Habari?', translation: 'How are you?', pronunciation: 'hah-bah-ree' },
    { phrase: 'Nzuri', translation: 'I am fine', pronunciation: 'n-zoo-ree' },
    { phrase: 'Asante', translation: 'Thank you', pronunciation: 'ah-sahn-teh' },
    { phrase: 'Kwaheri', translation: 'Goodbye', pronunciation: 'kwah-heh-ree' },
    { phrase: 'Karibu', translation: 'Welcome', pronunciation: 'kah-ree-boo' },
  ],
};

export default function LanguagePodScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const [pod, setPod] = useState<LanguagePod | null>(null);
  const [activeTab, setActiveTab] = useState<'about' | 'phrases' | 'translate'>('about');
  const [isJoined, setIsJoined] = useState(false);
  const [translateText, setTranslateText] = useState('');
  const [translatedResult, setTranslatedResult] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [copiedPhrase, setCopiedPhrase] = useState<string | null>(null);

  useEffect(() => {
    if (id && MOCK_PODS[id]) {
      setPod(MOCK_PODS[id]);
    }
  }, [id]);

  const getDayName = (day: number) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[day];
  };

  const handleJoinPod = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setIsJoined(true);
  };

  const handleTranslate = () => {
    if (!translateText.trim() || !pod) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsTranslating(true);

    // Simulate translation (in real app, this would call a translation API)
    setTimeout(() => {
      const mockTranslations: Record<string, Record<string, string>> = {
        'Igbo': {
          'hello': 'Ndewo',
          'how are you': 'Kedu ka ị mere?',
          'thank you': 'Daalu',
          'goodbye': 'Ka ọ dị',
          'good morning': 'Ụtụtụ ọma',
          'i love you': 'Ahụrụ m gị n\'anya',
          'what is your name': 'Kedụ aha gị?',
          'my name is': 'Aha m bụ',
        },
        'Wolof': {
          'hello': 'Salaam aleekum',
          'how are you': 'Nanga def?',
          'thank you': 'Jërejëf',
          'goodbye': 'Ba beneen',
          'good morning': 'Nanga def',
          'i love you': 'Begg naa la',
        },
        'Swahili': {
          'hello': 'Jambo / Habari',
          'how are you': 'Habari yako?',
          'thank you': 'Asante sana',
          'goodbye': 'Kwaheri',
          'good morning': 'Habari za asubuhi',
          'i love you': 'Nakupenda',
          'what is your name': 'Jina lako nani?',
          'my name is': 'Jina langu ni',
        },
      };

      const languageTranslations = mockTranslations[pod.language] || {};
      const lowerText = translateText.toLowerCase().trim();
      const found = languageTranslations[lowerText];

      if (found) {
        setTranslatedResult(found);
      } else {
        setTranslatedResult(`[Translation for "${translateText}" in ${pod.language} would appear here. Join the pod to learn more phrases!]`);
      }
      setIsTranslating(false);
    }, 1000);
  };

  const copyPhrase = (phrase: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCopiedPhrase(phrase);
    setTimeout(() => setCopiedPhrase(null), 2000);
  };

  if (!pod) {
    return (
      <View style={{ flex: 1, backgroundColor: '#FAF7F2' }}>
        <Stack.Screen options={{ headerShown: true, title: 'Language Pod', headerStyle: { backgroundColor: '#FAF7F2' }, headerTintColor: '#1B4D3E' }} />
        <View className="flex-1 items-center justify-center">
          <Text className="text-gray-500">Loading...</Text>
        </View>
      </View>
    );
  }

  const phrases = LANGUAGE_PHRASES[pod.language] || [];

  return (
    <View style={{ flex: 1, backgroundColor: '#FAF7F2' }}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: pod.language,
          headerStyle: { backgroundColor: '#FAF7F2' },
          headerTintColor: '#1B4D3E',
        }}
      />

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header Card */}
        <Animated.View entering={FadeInDown.delay(100)} className="mx-4 mt-2 bg-emerald-800 rounded-2xl p-5">
          <View className="flex-row items-center">
            <Image source={{ uri: pod.hostAvatar }} className="w-16 h-16 rounded-full border-2 border-white" />
            <View className="flex-1 ml-4">
              <Text className="text-white/80 text-sm">Learning</Text>
              <Text className="text-white font-bold text-2xl">{pod.language}</Text>
              {pod.dialect && (
                <Text className="text-white/60 text-sm">{pod.dialect}</Text>
              )}
            </View>
            <View className={`px-3 py-1 rounded-full ${pod.level === 'beginner' ? 'bg-green-500' : pod.level === 'intermediate' ? 'bg-amber-500' : 'bg-red-500'}`}>
              <Text className="text-white text-xs font-medium capitalize">{pod.level}</Text>
            </View>
          </View>

          <Text className="text-white font-semibold text-lg mt-4">{pod.title}</Text>
          <Text className="text-white/80 text-sm mt-1">Hosted by {pod.hostName}</Text>
        </Animated.View>

        {/* Tabs */}
        <View className="flex-row mx-4 mt-4 bg-gray-100 rounded-xl p-1">
          {(['about', 'phrases', 'translate'] as const).map((tab) => (
            <Pressable
              key={tab}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setActiveTab(tab);
              }}
              className={`flex-1 py-2.5 rounded-lg ${activeTab === tab ? 'bg-white shadow-sm' : ''}`}
            >
              <Text className={`text-center font-semibold text-sm capitalize ${activeTab === tab ? 'text-gray-900' : 'text-gray-500'}`}>
                {tab === 'translate' ? 'Translate' : tab}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* About Tab */}
        {activeTab === 'about' && (
          <Animated.View entering={FadeInUp.delay(100)} className="px-4 mt-4">
            <Text className="text-gray-700">{pod.description}</Text>

            {/* Schedule */}
            <View className="bg-white rounded-xl p-4 mt-4 shadow-sm">
              <View className="flex-row items-center mb-3">
                <Calendar size={20} color="#D4673A" />
                <Text className="text-gray-900 font-semibold ml-2">Schedule</Text>
              </View>
              {pod.schedule.map((s, idx) => (
                <View key={idx} className="flex-row items-center bg-amber-50 rounded-lg p-3">
                  <Clock size={16} color="#D97706" />
                  <Text className="text-amber-800 ml-2">
                    {getDayName(s.dayOfWeek)}s at {s.time} ({s.duration} min)
                  </Text>
                </View>
              ))}
            </View>

            {/* Members */}
            <View className="bg-white rounded-xl p-4 mt-4 shadow-sm">
              <View className="flex-row items-center justify-between mb-3">
                <View className="flex-row items-center">
                  <Users size={20} color="#1B4D3E" />
                  <Text className="text-gray-900 font-semibold ml-2">Members</Text>
                </View>
                <Text className="text-gray-500 text-sm">{pod.participants.length}/{pod.maxParticipants}</Text>
              </View>

              {pod.participants.length === 0 ? (
                <Text className="text-gray-500 text-center py-4">Be the first to join!</Text>
              ) : (
                <View className="flex-row flex-wrap">
                  {pod.participants.map((p) => (
                    <View key={p.userId} className="flex-row items-center bg-gray-50 rounded-full px-3 py-2 mr-2 mb-2">
                      <Image source={{ uri: p.userAvatar }} className="w-6 h-6 rounded-full" />
                      <Text className="text-gray-700 text-sm ml-2">{p.userName}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* Join Button */}
            {!isJoined ? (
              <Pressable
                onPress={handleJoinPod}
                className="bg-emerald-800 py-4 rounded-xl mt-4 flex-row items-center justify-center"
              >
                <Users size={20} color="white" />
                <Text className="text-white font-bold text-lg ml-2">Join This Pod</Text>
              </Pressable>
            ) : (
              <View className="bg-emerald-100 py-4 rounded-xl mt-4 flex-row items-center justify-center">
                <Check size={20} color="#1B4D3E" />
                <Text className="text-emerald-800 font-bold text-lg ml-2">You're a Member!</Text>
              </View>
            )}

            {isJoined && pod.meetingLink && (
              <Pressable className="bg-blue-600 py-4 rounded-xl mt-3 flex-row items-center justify-center">
                <Video size={20} color="white" />
                <Text className="text-white font-bold text-lg ml-2">Join Next Session</Text>
              </Pressable>
            )}
          </Animated.View>
        )}

        {/* Phrases Tab */}
        {activeTab === 'phrases' && (
          <Animated.View entering={FadeInUp.delay(100)} className="px-4 mt-4">
            <View className="bg-emerald-50 rounded-xl p-4 mb-4">
              <View className="flex-row items-center">
                <BookOpen size={20} color="#1B4D3E" />
                <Text className="text-emerald-800 font-semibold ml-2">Common {pod.language} Phrases</Text>
              </View>
              <Text className="text-emerald-700 text-sm mt-1">
                Tap any phrase to copy. Practice these before joining the pod!
              </Text>
            </View>

            {phrases.length === 0 ? (
              <View className="bg-white rounded-xl p-8 items-center">
                <Globe size={48} color="#D4673A" />
                <Text className="text-gray-900 font-semibold mt-4">Phrases Coming Soon</Text>
                <Text className="text-gray-500 text-center mt-2">
                  Join the pod to learn phrases directly from native speakers!
                </Text>
              </View>
            ) : (
              phrases.map((p, idx) => (
                <Animated.View key={idx} entering={FadeInDown.delay(idx * 50)}>
                  <Pressable
                    onPress={() => copyPhrase(p.phrase)}
                    className="bg-white rounded-xl p-4 mb-3 shadow-sm"
                  >
                    <View className="flex-row items-start justify-between">
                      <View className="flex-1">
                        <Text className="text-emerald-800 font-bold text-xl">{p.phrase}</Text>
                        <Text className="text-gray-600 mt-1">{p.translation}</Text>
                        <View className="flex-row items-center mt-2">
                          <Volume2 size={14} color="#6B7280" />
                          <Text className="text-gray-400 text-sm ml-1 italic">{p.pronunciation}</Text>
                        </View>
                      </View>
                      {copiedPhrase === p.phrase ? (
                        <View className="bg-emerald-100 p-2 rounded-full">
                          <Check size={16} color="#1B4D3E" />
                        </View>
                      ) : (
                        <View className="bg-gray-100 p-2 rounded-full">
                          <Copy size={16} color="#6B7280" />
                        </View>
                      )}
                    </View>
                  </Pressable>
                </Animated.View>
              ))
            )}
          </Animated.View>
        )}

        {/* Translate Tab */}
        {activeTab === 'translate' && (
          <Animated.View entering={FadeInUp.delay(100)} className="px-4 mt-4">
            <View className="bg-blue-50 rounded-xl p-4 mb-4">
              <View className="flex-row items-center">
                <Languages size={20} color="#2563EB" />
                <Text className="text-blue-800 font-semibold ml-2">Quick Translator</Text>
              </View>
              <Text className="text-blue-700 text-sm mt-1">
                Translate common phrases to {pod.language}. For full conversations, join the pod!
              </Text>
            </View>

            {/* Input */}
            <View className="bg-white rounded-xl p-4 shadow-sm">
              <Text className="text-gray-500 text-sm mb-2">English</Text>
              <TextInput
                value={translateText}
                onChangeText={setTranslateText}
                placeholder="Type a phrase to translate..."
                placeholderTextColor="#9CA3AF"
                multiline
                className="text-gray-900 text-lg min-h-[80px]"
              />
              <View className="flex-row items-center justify-between mt-3 pt-3 border-t border-gray-100">
                <Text className="text-gray-400 text-sm">Try: "hello", "how are you", "thank you"</Text>
                <Pressable
                  onPress={handleTranslate}
                  disabled={!translateText.trim() || isTranslating}
                  className={`px-4 py-2 rounded-full flex-row items-center ${translateText.trim() ? 'bg-emerald-800' : 'bg-gray-200'}`}
                >
                  <Send size={16} color={translateText.trim() ? 'white' : '#9CA3AF'} />
                  <Text className={`ml-2 font-medium ${translateText.trim() ? 'text-white' : 'text-gray-400'}`}>
                    {isTranslating ? 'Translating...' : 'Translate'}
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* Result */}
            {translatedResult && (
              <Animated.View entering={FadeInDown} className="bg-emerald-50 rounded-xl p-4 mt-4 border border-emerald-200">
                <Text className="text-emerald-600 text-sm mb-2">{pod.language}</Text>
                <Text className="text-emerald-900 text-xl font-bold">{translatedResult}</Text>
                <Pressable
                  onPress={() => copyPhrase(translatedResult)}
                  className="flex-row items-center mt-3"
                >
                  {copiedPhrase === translatedResult ? (
                    <>
                      <Check size={16} color="#1B4D3E" />
                      <Text className="text-emerald-700 ml-2">Copied!</Text>
                    </>
                  ) : (
                    <>
                      <Copy size={16} color="#1B4D3E" />
                      <Text className="text-emerald-700 ml-2">Copy translation</Text>
                    </>
                  )}
                </Pressable>
              </Animated.View>
            )}

            {/* Join CTA */}
            <View className="bg-amber-50 rounded-xl p-4 mt-6 border border-amber-200">
              <Text className="text-amber-800 font-semibold">Want to learn more?</Text>
              <Text className="text-amber-700 text-sm mt-1">
                Join this language pod to practice speaking with native speakers and learn proper pronunciation.
              </Text>
              {!isJoined && (
                <Pressable
                  onPress={handleJoinPod}
                  className="bg-amber-600 py-3 rounded-lg mt-3 flex-row items-center justify-center"
                >
                  <Users size={18} color="white" />
                  <Text className="text-white font-semibold ml-2">Join Pod</Text>
                </Pressable>
              )}
            </View>
          </Animated.View>
        )}

        <View className="h-8" />
      </ScrollView>
    </View>
  );
}
