import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, Modal, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import {
  ArrowLeft,
  MessageCircle,
  Heart,
  Ear,
  Users,
  Clock,
  Shield,
  Sparkles,
  Phone,
  Video,
  Send,
  X,
  Check,
  RefreshCw,
  Coffee,
  Smile,
  HandHeart,
  Globe,
  Lock
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown, FadeIn, ZoomIn } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

type UserMode = 'talk' | 'listen' | 'both';
type ConnectionStatus = 'available' | 'busy' | 'offline';

interface ListenerProfile {
  id: string;
  name: string;
  avatar: string;
  mode: UserMode;
  status: ConnectionStatus;
  bio: string;
  languages: string[];
  topics: string[];
  rating: number;
  conversations: number;
  responseTime: string;
  isVerified: boolean;
  country: string;
}

const MOCK_LISTENERS: ListenerProfile[] = [
  {
    id: '1',
    name: 'Amara Johnson',
    avatar: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=200',
    mode: 'listen',
    status: 'available',
    bio: "Here to listen without judgment. Sometimes we all just need someone to hear us. 💜",
    languages: ['English', 'French'],
    topics: ['Life', 'Relationships', 'Career', 'Family'],
    rating: 4.9,
    conversations: 127,
    responseTime: '< 5 min',
    isVerified: true,
    country: '🇺🇸',
  },
  {
    id: '2',
    name: 'Kofi Mensah',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200',
    mode: 'both',
    status: 'available',
    bio: "Fellow expat who gets it. Let's chat about anything - homesickness, adjusting, or just life!",
    languages: ['English', 'Twi'],
    topics: ['Expat Life', 'Homesickness', 'Culture', 'General'],
    rating: 4.8,
    conversations: 89,
    responseTime: '< 10 min',
    isVerified: true,
    country: '🇬🇭',
  },
  {
    id: '3',
    name: 'Fatou Diallo',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
    mode: 'listen',
    status: 'available',
    bio: "Mental health advocate. Your feelings are valid, and I'm here to support you. 🌸",
    languages: ['English', 'French', 'Wolof'],
    topics: ['Mental Health', 'Anxiety', 'Stress', 'Self-care'],
    rating: 5.0,
    conversations: 203,
    responseTime: '< 5 min',
    isVerified: true,
    country: '🇸🇳',
  },
  {
    id: '4',
    name: 'David Okonkwo',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200',
    mode: 'talk',
    status: 'available',
    bio: "Looking for someone to chat with. New to the city and could use some friendly conversation!",
    languages: ['English', 'Igbo'],
    topics: ['Making Friends', 'New City', 'Sports', 'Music'],
    rating: 4.7,
    conversations: 34,
    responseTime: '< 15 min',
    isVerified: false,
    country: '🇳🇬',
  },
  {
    id: '5',
    name: 'Aaliyah Williams',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200',
    mode: 'both',
    status: 'busy',
    bio: "Night owl here! Usually available late nights if you can't sleep and need to talk.",
    languages: ['English'],
    topics: ['Insomnia', 'Late Night Chats', 'Life', 'Dreams'],
    rating: 4.6,
    conversations: 156,
    responseTime: '< 30 min',
    isVerified: true,
    country: '🇯🇲',
  },
  {
    id: '6',
    name: 'Yemi Adeyemi',
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200',
    mode: 'listen',
    status: 'available',
    bio: "Big brother energy. Here to listen and offer perspective when needed. No judgment zone.",
    languages: ['English', 'Yoruba'],
    topics: ['Life Advice', 'Career', 'Relationships', 'Faith'],
    rating: 4.9,
    conversations: 178,
    responseTime: '< 10 min',
    isVerified: true,
    country: '🇳🇬',
  },
];

const TOPICS = [
  { id: 'all', label: 'All Topics', icon: Globe },
  { id: 'life', label: 'Life', icon: Sparkles },
  { id: 'relationships', label: 'Relationships', icon: Heart },
  { id: 'expat', label: 'Expat Life', icon: Globe },
  { id: 'mental', label: 'Mental Health', icon: HandHeart },
  { id: 'career', label: 'Career', icon: Coffee },
  { id: 'general', label: 'Just Chat', icon: Smile },
];

export default function TalkToSomeoneScreen() {
  const [activeTab, setActiveTab] = useState<'find' | 'available' | 'chats'>('find');
  const [selectedTopic, setSelectedTopic] = useState('all');
  const [showModeModal, setShowModeModal] = useState(false);
  const [myMode, setMyMode] = useState<UserMode | null>(null);
  const [isAvailable, setIsAvailable] = useState(false);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<ListenerProfile | null>(null);
  const [message, setMessage] = useState('');

  const filteredListeners = MOCK_LISTENERS.filter(listener => {
    if (selectedTopic === 'all') return true;
    return listener.topics.some(t => t.toLowerCase().includes(selectedTopic.toLowerCase()));
  });

  const availableCount = MOCK_LISTENERS.filter(l => l.status === 'available').length;

  const handleConnect = (person: ListenerProfile) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedPerson(person);
    setShowConnectModal(true);
  };

  const sendConnectionRequest = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setShowConnectModal(false);
    setMessage('');
    // In real app, would send request
  };

  const getModeIcon = (mode: UserMode) => {
    switch (mode) {
      case 'talk': return MessageCircle;
      case 'listen': return Ear;
      case 'both': return Users;
    }
  };

  const getModeLabel = (mode: UserMode) => {
    switch (mode) {
      case 'talk': return 'Wants to Talk';
      case 'listen': return 'Here to Listen';
      case 'both': return 'Talk & Listen';
    }
  };

  const getModeColor = (mode: UserMode): [string, string] => {
    switch (mode) {
      case 'talk': return ['#8B5CF6', '#7C3AED'];
      case 'listen': return ['#10B981', '#059669'];
      case 'both': return ['#F59E0B', '#D97706'];
    }
  };

  return (
    <View className="flex-1 bg-[#F5F3FF]">
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
              <ArrowLeft size={20} color="#374151" />
            </Pressable>
            <View className="flex-row items-center">
              <HandHeart size={24} color="#7C3AED" />
              <Text className="text-xl font-bold text-gray-900 ml-2">Talk to Someone</Text>
            </View>
            <View className="w-10" />
          </View>

          {/* Hero Card */}
          <Animated.View entering={FadeInDown.duration(400)}>
            <LinearGradient
              colors={['#7C3AED', '#6D28D9', '#5B21B6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ borderRadius: 24, padding: 20, marginBottom: 16 }}
            >
              <View className="absolute top-0 right-0 w-32 h-32 rounded-full bg-white/10" style={{ transform: [{ translateX: 40 }, { translateY: -40 }] }} />

              <Text className="text-white/80 text-sm mb-1">You're not alone</Text>
              <Text className="text-white text-xl font-bold mb-2">
                {availableCount} people available to connect
              </Text>
              <Text className="text-white/70 text-sm mb-4">
                Find someone to talk to or become a listening ear for others
              </Text>

              <View className="flex-row gap-3">
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    setShowModeModal(true);
                  }}
                  className="flex-1 bg-white rounded-2xl py-3 flex-row items-center justify-center"
                >
                  {isAvailable ? (
                    <>
                      <Check size={18} color="#10B981" />
                      <Text className="text-green-600 font-bold ml-2">You're Available</Text>
                    </>
                  ) : (
                    <>
                      <Sparkles size={18} color="#7C3AED" />
                      <Text className="text-violet-600 font-bold ml-2">Go Available</Text>
                    </>
                  )}
                </Pressable>
              </View>
            </LinearGradient>
          </Animated.View>

          {/* Tabs */}
          <View className="flex-row bg-white rounded-2xl p-1.5 shadow-sm">
            {[
              { id: 'find', label: 'Find Someone', icon: Users },
              { id: 'available', label: 'Available', icon: Ear },
              { id: 'chats', label: 'My Chats', icon: MessageCircle },
            ].map((tab) => (
              <Pressable
                key={tab.id}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setActiveTab(tab.id as typeof activeTab);
                }}
                className="flex-1"
              >
                <LinearGradient
                  colors={activeTab === tab.id ? ['#7C3AED', '#6D28D9'] : ['transparent', 'transparent']}
                  style={{ borderRadius: 14, paddingVertical: 10, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' }}
                >
                  <tab.icon size={16} color={activeTab === tab.id ? '#fff' : '#6B7280'} />
                  <Text className={`ml-1.5 font-semibold text-xs ${activeTab === tab.id ? 'text-white' : 'text-gray-500'}`}>
                    {tab.label}
                  </Text>
                </LinearGradient>
              </Pressable>
            ))}
          </View>
        </View>

        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {activeTab === 'find' && (
            <>
              {/* Topic Filters */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                className="px-5 mb-4"
                style={{ flexGrow: 0 }}
              >
                <View className="flex-row gap-2">
                  {TOPICS.map((topic) => (
                    <Pressable
                      key={topic.id}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setSelectedTopic(topic.id);
                      }}
                      className={`flex-row items-center px-4 py-2 rounded-full ${
                        selectedTopic === topic.id ? 'bg-violet-600' : 'bg-white'
                      }`}
                    >
                      <topic.icon size={14} color={selectedTopic === topic.id ? '#fff' : '#6B7280'} />
                      <Text className={`ml-1.5 text-sm font-medium ${
                        selectedTopic === topic.id ? 'text-white' : 'text-gray-600'
                      }`}>
                        {topic.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </ScrollView>

              {/* People List */}
              <View className="px-5 pb-6">
                {filteredListeners.map((person, index) => (
                  <Animated.View
                    key={person.id}
                    entering={FadeInDown.duration(400).delay(index * 100)}
                    className="mb-4"
                  >
                    <Pressable
                      onPress={() => handleConnect(person)}
                      className="bg-white rounded-3xl p-4 shadow-sm"
                    >
                      <View className="flex-row">
                        {/* Avatar */}
                        <View className="relative">
                          <Image
                            source={{ uri: person.avatar }}
                            style={{ width: 64, height: 64, borderRadius: 32 }}
                            contentFit="cover"
                          />
                          {/* Status indicator */}
                          <View className={`absolute bottom-0 right-0 w-5 h-5 rounded-full border-2 border-white ${
                            person.status === 'available' ? 'bg-green-500' :
                            person.status === 'busy' ? 'bg-yellow-500' : 'bg-gray-400'
                          }`} />
                        </View>

                        {/* Info */}
                        <View className="flex-1 ml-3">
                          <View className="flex-row items-center">
                            <Text className="text-gray-900 font-bold text-base">{person.name}</Text>
                            <Text className="ml-1">{person.country}</Text>
                            {person.isVerified && (
                              <View className="ml-1.5 bg-blue-100 rounded-full p-0.5">
                                <Shield size={12} color="#3B82F6" />
                              </View>
                            )}
                          </View>

                          {/* Mode Badge */}
                          <View className="flex-row items-center mt-1">
                            <LinearGradient
                              colors={getModeColor(person.mode)}
                              style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 }}
                            >
                              {React.createElement(getModeIcon(person.mode), { size: 12, color: '#fff' })}
                              <Text className="text-white text-xs font-medium ml-1">{getModeLabel(person.mode)}</Text>
                            </LinearGradient>
                            <View className="flex-row items-center ml-2">
                              <Clock size={12} color="#9CA3AF" />
                              <Text className="text-gray-400 text-xs ml-1">{person.responseTime}</Text>
                            </View>
                          </View>

                          <Text className="text-gray-600 text-sm mt-2" numberOfLines={2}>
                            {person.bio}
                          </Text>

                          {/* Languages & Topics */}
                          <View className="flex-row flex-wrap gap-1 mt-2">
                            {person.languages.slice(0, 2).map((lang) => (
                              <View key={lang} className="bg-gray-100 px-2 py-0.5 rounded-full">
                                <Text className="text-gray-600 text-xs">{lang}</Text>
                              </View>
                            ))}
                            {person.topics.slice(0, 2).map((topic) => (
                              <View key={topic} className="bg-violet-100 px-2 py-0.5 rounded-full">
                                <Text className="text-violet-600 text-xs">{topic}</Text>
                              </View>
                            ))}
                          </View>

                          {/* Stats */}
                          <View className="flex-row items-center mt-3">
                            <View className="flex-row items-center">
                              <Sparkles size={14} color="#F59E0B" />
                              <Text className="text-gray-700 text-sm font-medium ml-1">{person.rating}</Text>
                            </View>
                            <View className="w-1 h-1 rounded-full bg-gray-300 mx-2" />
                            <Text className="text-gray-500 text-sm">{person.conversations} conversations</Text>
                          </View>
                        </View>
                      </View>

                      {/* Connect Button */}
                      <Pressable
                        onPress={() => handleConnect(person)}
                        disabled={person.status !== 'available'}
                        className="mt-4"
                      >
                        <LinearGradient
                          colors={person.status === 'available' ? ['#7C3AED', '#6D28D9'] : ['#D1D5DB', '#9CA3AF']}
                          style={{ borderRadius: 16, paddingVertical: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' }}
                        >
                          <MessageCircle size={18} color="#fff" />
                          <Text className="text-white font-bold ml-2">
                            {person.status === 'available' ? 'Connect Now' : 'Currently Busy'}
                          </Text>
                        </LinearGradient>
                      </Pressable>
                    </Pressable>
                  </Animated.View>
                ))}
              </View>
            </>
          )}

          {activeTab === 'available' && (
            <View className="px-5 pb-6">
              {/* Become Available Card */}
              <Animated.View entering={FadeInDown.duration(400)} className="mb-4">
                <View className="bg-white rounded-3xl p-5 shadow-sm">
                  <View className="items-center mb-4">
                    <View className="w-20 h-20 rounded-full bg-green-100 items-center justify-center mb-3">
                      <Ear size={36} color="#10B981" />
                    </View>
                    <Text className="text-gray-900 font-bold text-lg text-center">Be a Listening Ear</Text>
                    <Text className="text-gray-500 text-center mt-1">
                      Make yourself available to help others who need someone to talk to
                    </Text>
                  </View>

                  <View className="bg-gray-50 rounded-2xl p-4 mb-4">
                    <Text className="text-gray-700 font-semibold mb-2">Community Guidelines:</Text>
                    <View className="space-y-2">
                      {[
                        'Be respectful and non-judgmental',
                        'Keep conversations confidential',
                        'Listen more than you speak',
                        'Know when to suggest professional help',
                      ].map((rule, i) => (
                        <View key={i} className="flex-row items-start">
                          <Check size={14} color="#10B981" style={{ marginTop: 2 }} />
                          <Text className="text-gray-600 text-sm ml-2 flex-1">{rule}</Text>
                        </View>
                      ))}
                    </View>
                  </View>

                  <Pressable
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                      setShowModeModal(true);
                    }}
                  >
                    <LinearGradient
                      colors={['#10B981', '#059669']}
                      style={{ borderRadius: 16, paddingVertical: 14, alignItems: 'center' }}
                    >
                      <Text className="text-white font-bold text-base">
                        {isAvailable ? 'Update Availability' : 'Make Yourself Available'}
                      </Text>
                    </LinearGradient>
                  </Pressable>
                </View>
              </Animated.View>

              {/* Stats */}
              <View className="flex-row gap-3 mb-4">
                <View className="flex-1 bg-white rounded-2xl p-4 items-center">
                  <Text className="text-3xl font-bold text-violet-600">0</Text>
                  <Text className="text-gray-500 text-sm">Conversations</Text>
                </View>
                <View className="flex-1 bg-white rounded-2xl p-4 items-center">
                  <Text className="text-3xl font-bold text-green-600">0</Text>
                  <Text className="text-gray-500 text-sm">People Helped</Text>
                </View>
                <View className="flex-1 bg-white rounded-2xl p-4 items-center">
                  <Text className="text-3xl font-bold text-amber-500">-</Text>
                  <Text className="text-gray-500 text-sm">Rating</Text>
                </View>
              </View>
            </View>
          )}

          {activeTab === 'chats' && (
            <View className="px-5 pb-6">
              <View className="bg-white rounded-3xl p-8 items-center">
                <View className="w-20 h-20 rounded-full bg-violet-100 items-center justify-center mb-4">
                  <MessageCircle size={36} color="#7C3AED" />
                </View>
                <Text className="text-gray-900 font-bold text-lg text-center">No Active Chats</Text>
                <Text className="text-gray-500 text-center mt-2">
                  Connect with someone to start a supportive conversation
                </Text>
                <Pressable
                  onPress={() => setActiveTab('find')}
                  className="mt-4"
                >
                  <LinearGradient
                    colors={['#7C3AED', '#6D28D9']}
                    style={{ borderRadius: 20, paddingHorizontal: 24, paddingVertical: 12 }}
                  >
                    <Text className="text-white font-bold">Find Someone</Text>
                  </LinearGradient>
                </Pressable>
              </View>
            </View>
          )}

          {/* Privacy Note */}
          <View className="px-5 pb-8">
            <View className="flex-row items-start bg-violet-50 rounded-2xl p-4">
              <Lock size={18} color="#7C3AED" style={{ marginTop: 2 }} />
              <View className="flex-1 ml-3">
                <Text className="text-violet-800 font-semibold">Your Privacy Matters</Text>
                <Text className="text-violet-600 text-sm mt-1">
                  All conversations are private and encrypted. You can remain anonymous if you prefer.
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Mode Selection Modal */}
        <Modal visible={showModeModal} transparent animationType="fade">
          <View className="flex-1 bg-black/60 items-center justify-center px-5">
            <Animated.View
              entering={ZoomIn.springify()}
              className="bg-white rounded-3xl p-6 w-full max-w-sm"
            >
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-gray-900 font-bold text-xl">How do you want to help?</Text>
                <Pressable onPress={() => setShowModeModal(false)}>
                  <X size={24} color="#9CA3AF" />
                </Pressable>
              </View>

              <View className="space-y-3 mb-4">
                {[
                  { mode: 'listen' as UserMode, title: 'Be a Listener', desc: "I'm here to listen to others", icon: Ear, colors: ['#10B981', '#059669'] as [string, string] },
                  { mode: 'talk' as UserMode, title: 'Need to Talk', desc: 'I need someone to talk to', icon: MessageCircle, colors: ['#8B5CF6', '#7C3AED'] as [string, string] },
                  { mode: 'both' as UserMode, title: 'Both', desc: 'Happy to talk or listen', icon: Users, colors: ['#F59E0B', '#D97706'] as [string, string] },
                ].map((option) => (
                  <Pressable
                    key={option.mode}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setMyMode(option.mode);
                    }}
                    className={`flex-row items-center p-4 rounded-2xl border-2 ${
                      myMode === option.mode ? 'border-violet-500 bg-violet-50' : 'border-gray-200'
                    }`}
                  >
                    <LinearGradient
                      colors={option.colors}
                      style={{ width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' }}
                    >
                      <option.icon size={24} color="#fff" />
                    </LinearGradient>
                    <View className="flex-1 ml-3">
                      <Text className="text-gray-900 font-bold">{option.title}</Text>
                      <Text className="text-gray-500 text-sm">{option.desc}</Text>
                    </View>
                    {myMode === option.mode && (
                      <View className="w-6 h-6 rounded-full bg-violet-500 items-center justify-center">
                        <Check size={14} color="#fff" />
                      </View>
                    )}
                  </Pressable>
                ))}
              </View>

              <Pressable
                onPress={() => {
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                  setIsAvailable(true);
                  setShowModeModal(false);
                }}
                disabled={!myMode}
              >
                <LinearGradient
                  colors={myMode ? ['#7C3AED', '#6D28D9'] : ['#D1D5DB', '#9CA3AF']}
                  style={{ borderRadius: 16, paddingVertical: 14, alignItems: 'center' }}
                >
                  <Text className="text-white font-bold text-base">Go Available</Text>
                </LinearGradient>
              </Pressable>
            </Animated.View>
          </View>
        </Modal>

        {/* Connect Modal */}
        <Modal visible={showConnectModal} transparent animationType="fade">
          <View className="flex-1 bg-black/60 items-center justify-center px-5">
            <Animated.View
              entering={ZoomIn.springify()}
              className="bg-white rounded-3xl p-6 w-full max-w-sm"
            >
              <Pressable
                onPress={() => setShowConnectModal(false)}
                className="absolute top-4 right-4 z-10"
              >
                <X size={24} color="#9CA3AF" />
              </Pressable>

              {selectedPerson && (
                <>
                  <View className="items-center mb-4">
                    <Image
                      source={{ uri: selectedPerson.avatar }}
                      style={{ width: 80, height: 80, borderRadius: 40 }}
                      contentFit="cover"
                    />
                    <Text className="text-gray-900 font-bold text-lg mt-3">{selectedPerson.name}</Text>
                    <LinearGradient
                      colors={getModeColor(selectedPerson.mode)}
                      style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 16, marginTop: 8 }}
                    >
                      {React.createElement(getModeIcon(selectedPerson.mode), { size: 14, color: '#fff' })}
                      <Text className="text-white text-sm font-medium ml-1">{getModeLabel(selectedPerson.mode)}</Text>
                    </LinearGradient>
                  </View>

                  <Text className="text-gray-600 text-center mb-4">{selectedPerson.bio}</Text>

                  <View className="mb-4">
                    <Text className="text-gray-700 font-medium mb-2">Send a message to connect:</Text>
                    <TextInput
                      value={message}
                      onChangeText={setMessage}
                      placeholder="Hi! I'd love to chat..."
                      multiline
                      numberOfLines={3}
                      className="bg-gray-100 rounded-2xl p-4 text-gray-900"
                      placeholderTextColor="#9CA3AF"
                      style={{ textAlignVertical: 'top', minHeight: 80 }}
                    />
                  </View>

                  <View className="flex-row gap-3">
                    <Pressable
                      onPress={() => setShowConnectModal(false)}
                      className="flex-1 bg-gray-100 rounded-2xl py-4 items-center"
                    >
                      <Text className="text-gray-600 font-bold">Cancel</Text>
                    </Pressable>
                    <Pressable
                      onPress={sendConnectionRequest}
                      className="flex-1"
                    >
                      <LinearGradient
                        colors={['#7C3AED', '#6D28D9']}
                        style={{ borderRadius: 16, paddingVertical: 16, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' }}
                      >
                        <Send size={18} color="#fff" />
                        <Text className="text-white font-bold ml-2">Connect</Text>
                      </LinearGradient>
                    </Pressable>
                  </View>
                </>
              )}
            </Animated.View>
          </View>
        </Modal>
      </SafeAreaView>
    </View>
  );
}
