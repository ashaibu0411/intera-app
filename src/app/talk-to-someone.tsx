import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, Modal, TextInput, ActivityIndicator, Alert } from 'react-native';
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
import { useStore } from '@/lib/store';
import {
  listAvailableTalkers,
  getMyAvailability,
  upsertMyAvailability,
  startTalkSession,
  listMyTalkSessions,
  endTalkSession,
  hasConfirmedTalkAge18Plus,
  confirmTalkAge18Plus,
  listMyBlockedUserIds,
  blockUser,
  reportUser,
  type TalkAvailability,
  type TalkMode,
  type TalkSession,
} from '@/lib/talkNow';
import { getOrCreateConversation } from '@/lib/messages';

type ConnectionStatus = 'available' | 'busy' | 'offline';

type TalkPerson = {
  userId: string;
  name: string;
  username: string;
  avatar: string;
  mode: TalkMode;
  status: ConnectionStatus;
  bio: string;
  languages: string[];
  topics: string[];
  rate: number;
  location?: string | null;
};

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
  const [myMode, setMyMode] = useState<TalkMode | null>(null);
  const [isAvailable, setIsAvailable] = useState(false);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<TalkPerson | null>(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [talkers, setTalkers] = useState<TalkAvailability[]>([]);
  const [sessions, setSessions] = useState<TalkSession[]>([]);
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [showAgeModal, setShowAgeModal] = useState(false);
  const [blockedIds, setBlockedIds] = useState<string[]>([]);

  const currentUser = useStore((s) => s.currentUser);

  const people: TalkPerson[] = useMemo(() => {
    return (talkers || [])
      .filter((t) => t.user_id !== currentUser?.id)
      .filter((t) => !blockedIds.includes(t.user_id))
      .map((t) => {
        const p = t.profile;
        return {
          userId: t.user_id,
          name: p?.name || 'User',
          username: p?.username || 'user',
          avatar: p?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop',
          mode: t.mode,
          status: t.status as ConnectionStatus,
          bio: p?.bio || 'Available to talk.',
          languages: t.languages || [],
          topics: t.topics || [],
          rate: t.rate_gems_per_minute || 10,
          location: p?.location || null,
        };
      });
  }, [talkers, currentUser?.id, blockedIds]);

  const filteredListeners = useMemo(() => {
    if (selectedTopic === 'all') return people;
    const q = selectedTopic.toLowerCase();
    return people.filter((p) => p.topics.some((t) => String(t).toLowerCase().includes(q)));
  }, [people, selectedTopic]);

  const availableCount = useMemo(() => people.filter((p) => p.status === 'available').length, [people]);

  const load = async () => {
    if (!currentUser?.id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [avail, mine, mySessions, is18, myBlocked] = await Promise.all([
        listAvailableTalkers(50).catch(() => [] as TalkAvailability[]),
        getMyAvailability(currentUser.id).catch(() => null),
        listMyTalkSessions(currentUser.id, 20).catch(() => [] as TalkSession[]),
        hasConfirmedTalkAge18Plus(currentUser.id).catch(() => false),
        listMyBlockedUserIds(currentUser.id).catch(() => [] as string[]),
      ]);
      setTalkers(avail);
      setSessions(mySessions);
      setAgeConfirmed(!!is18);
      setBlockedIds(myBlocked);
      if (mine?.status === 'available') {
        setIsAvailable(true);
        setMyMode(mine.mode);
      } else {
        setIsAvailable(false);
      }
    } catch (e: any) {
      Alert.alert('Talk Now unavailable', String(e?.message ?? e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id]);

  const handleConnect = (person: TalkPerson) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (!ageConfirmed) {
      setShowAgeModal(true);
      return;
    }
    setSelectedPerson(person);
    setShowConnectModal(true);
  };

  const startPaidChat = async () => {
    if (!currentUser?.id || !selectedPerson) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      if (!ageConfirmed) {
        setShowAgeModal(true);
        return;
      }
      // Create paid talk session (gems/min) and open chat
      const session = await startTalkSession({
        requesterId: currentUser.id,
        providerId: selectedPerson.userId,
        rateGemsPerMinute: selectedPerson.rate,
      });
      const convId = await getOrCreateConversation(currentUser.id, selectedPerson.userId);

      setShowConnectModal(false);
      setMessage('');

      router.push({
        pathname: `/chat/${selectedPerson.userId}` as any,
        params: {
          recipientId: selectedPerson.userId,
          name: encodeURIComponent(selectedPerson.name),
          avatar: encodeURIComponent(selectedPerson.avatar),
          prefill: encodeURIComponent(message || 'Hi! Are you available to talk?'),
          talkSessionId: session.id,
        },
      });
    } catch (e: any) {
      const msg = String(e?.message ?? e);
      if (msg.includes('age_not_confirmed')) {
        setShowAgeModal(true);
        return;
      }
      if (msg.includes('rate_limited')) {
        Alert.alert('Slow down', 'Too many session starts. Please wait a few minutes and try again.');
        return;
      }
      if (msg.includes('blocked')) {
        Alert.alert('Not available', 'You can’t start a session with this user.');
        return;
      }
      if (msg.includes('provider_not_available')) {
        Alert.alert('Not available', 'This person is no longer available. Try someone else.');
        return;
      }
      Alert.alert('Could not start talk', msg);
    }
  };

  const doBlockUser = async (userId: string) => {
    if (!currentUser?.id) return;
    try {
      await blockUser({ blockerId: currentUser.id, blockedId: userId });
      setShowConnectModal(false);
      setSelectedPerson(null);
      await load();
      Alert.alert('Blocked', 'You will no longer see this user in Talk Now.');
    } catch (e: any) {
      Alert.alert('Could not block', String(e?.message ?? e));
    }
  };

  const doReportUser = async (userId: string, reason: string) => {
    if (!currentUser?.id) return;
    try {
      await reportUser({ reporterId: currentUser.id, reportedId: userId, reason });
      Alert.alert('Reported', 'Thanks — our team will review this report.');
    } catch (e: any) {
      Alert.alert('Could not report', String(e?.message ?? e));
    }
  };

  const getModeIcon = (mode: TalkMode) => {
    switch (mode) {
      case 'talk': return MessageCircle;
      case 'listen': return Ear;
      case 'both': return Users;
    }
  };

  const getModeLabel = (mode: TalkMode) => {
    switch (mode) {
      case 'talk': return 'Wants to Talk';
      case 'listen': return 'Here to Listen';
      case 'both': return 'Talk & Listen';
    }
  };

  const getModeColor = (mode: TalkMode): [string, string] => {
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
                    if (!ageConfirmed) {
                      setShowAgeModal(true);
                      return;
                    }
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
                {loading ? (
                  <View className="py-10 items-center">
                    <ActivityIndicator size="large" color="#7C3AED" />
                    <Text className="text-gray-500 mt-3">Finding people available now…</Text>
                  </View>
                ) : filteredListeners.length === 0 ? (
                  <View className="py-10 items-center">
                    <View className="w-16 h-16 rounded-full bg-white items-center justify-center">
                      <Users size={30} color="#7C3AED" />
                    </View>
                    <Text className="text-gray-900 font-bold mt-3">No one available right now</Text>
                    <Text className="text-gray-500 text-center mt-1">
                      Try again later — or go available and earn gems for listening.
                    </Text>
                  </View>
                ) : (
                  filteredListeners.map((person, index) => (
                  <Animated.View
                    key={person.userId}
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
                          {person.location ? (
                            <Text className="ml-2 text-gray-400 text-xs" numberOfLines={1}>
                              {person.location}
                            </Text>
                          ) : null}
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
                              <Text className="text-gray-400 text-xs ml-1">Available now</Text>
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
                              <Text className="text-gray-700 text-sm font-medium ml-1">
                                {person.rate} gems/min
                              </Text>
                            </View>
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
                ))
                )}
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
                      if (!ageConfirmed) {
                        setShowAgeModal(true);
                        return;
                      }
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
              {loading ? (
                <View className="py-10 items-center">
                  <ActivityIndicator size="large" color="#7C3AED" />
                  <Text className="text-gray-500 mt-3">Loading your sessions…</Text>
                </View>
              ) : sessions.length === 0 ? (
                <View className="bg-white rounded-3xl p-8 items-center">
                  <View className="w-20 h-20 rounded-full bg-violet-100 items-center justify-center mb-4">
                    <MessageCircle size={36} color="#7C3AED" />
                  </View>
                  <Text className="text-gray-900 font-bold text-lg text-center">No sessions yet</Text>
                  <Text className="text-gray-500 text-center mt-2">
                    Start a Talk Now session to chat and support someone.
                  </Text>
                  <Pressable onPress={() => setActiveTab('find')} className="mt-4">
                    <LinearGradient
                      colors={['#7C3AED', '#6D28D9']}
                      style={{ borderRadius: 20, paddingHorizontal: 24, paddingVertical: 12 }}
                    >
                      <Text className="text-white font-bold">Find Someone</Text>
                    </LinearGradient>
                  </Pressable>
                </View>
              ) : (
                <View>
                  {sessions.map((s) => {
                    const otherId = s.requester_id === currentUser?.id ? s.provider_id : s.requester_id;
                    const isActive = s.status === 'active' && !s.ended_at;
                    return (
                      <View key={s.id} className="bg-white rounded-3xl p-4 shadow-sm mb-3">
                        <Text className="text-gray-900 font-bold">
                          {isActive ? 'Active session' : 'Ended session'}
                        </Text>
                        <Text className="text-gray-500 text-sm mt-1">
                          Rate: {s.rate_gems_per_minute} gems/min
                        </Text>
                        {s.ended_at ? (
                          <Text className="text-gray-500 text-sm mt-1">
                            Billed: {s.billed_gems} gems ({s.billed_minutes} min)
                          </Text>
                        ) : null}

                        <View className="flex-row gap-2 mt-3">
                          <Pressable
                            onPress={() => {
                              if (!otherId) return;
                              router.push({
                                pathname: `/chat/${otherId}` as any,
                                params: {
                                  recipientId: otherId,
                                  talkSessionId: s.id,
                                },
                              });
                            }}
                            className="flex-1"
                          >
                            <LinearGradient
                              colors={['#7C3AED', '#6D28D9']}
                              style={{ borderRadius: 16, paddingVertical: 12, alignItems: 'center' }}
                            >
                              <Text className="text-white font-bold">Open chat</Text>
                            </LinearGradient>
                          </Pressable>

                          {isActive ? (
                            <Pressable
                              onPress={async () => {
                                try {
                                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                                  await endTalkSession(s.id);
                                  await load();
                                  Alert.alert('Session ended', 'Billing was applied in gems.');
                                } catch (e: any) {
                                  Alert.alert('Could not end session', String(e?.message ?? e));
                                }
                              }}
                              className="bg-gray-100 rounded-2xl px-4 items-center justify-center"
                            >
                              <Text className="text-gray-700 font-bold">End</Text>
                            </Pressable>
                          ) : null}
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}
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
                  { mode: 'listen' as TalkMode, title: 'Be a Listener', desc: "I'm here to listen to others", icon: Ear, colors: ['#10B981', '#059669'] as [string, string] },
                  { mode: 'talk' as TalkMode, title: 'Need to Talk', desc: 'I need someone to talk to', icon: MessageCircle, colors: ['#8B5CF6', '#7C3AED'] as [string, string] },
                  { mode: 'both' as TalkMode, title: 'Both', desc: 'Happy to talk or listen', icon: Users, colors: ['#F59E0B', '#D97706'] as [string, string] },
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
                  if (!currentUser?.id || !myMode) return;
                  if (!ageConfirmed) {
                    setShowAgeModal(true);
                    return;
                  }
                  upsertMyAvailability({
                    userId: currentUser.id,
                    mode: myMode,
                    status: 'available',
                    rate_gems_per_minute: 1,
                    min_billable_minutes: 1,
                  })
                    .then(() => load())
                    .catch(() => null);
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

                  <View className="bg-violet-50 rounded-2xl p-3 mb-4">
                    <Text className="text-violet-800 font-semibold">Paid talk</Text>
                    <Text className="text-violet-700 text-sm mt-1">
                      {selectedPerson.rate} gems per minute. You can end anytime.
                    </Text>
                  </View>

                  <View className="flex-row gap-2 mb-4">
                    <Pressable
                      onPress={() => {
                        Alert.alert('Report user', 'Why are you reporting this user?', [
                          { text: 'Spam', onPress: () => doReportUser(selectedPerson.userId, 'spam') },
                          { text: 'Harassment', onPress: () => doReportUser(selectedPerson.userId, 'harassment') },
                          { text: 'Inappropriate', onPress: () => doReportUser(selectedPerson.userId, 'inappropriate') },
                          { text: 'Other', onPress: () => doReportUser(selectedPerson.userId, 'other') },
                          { text: 'Cancel', style: 'cancel' },
                        ]);
                      }}
                      className="flex-1 bg-gray-100 rounded-2xl py-3 items-center"
                    >
                      <Text className="text-gray-700 font-bold">Report</Text>
                    </Pressable>

                    <Pressable
                      onPress={() => {
                        Alert.alert('Block user?', 'You will no longer see or match with this user in Talk Now.', [
                          { text: 'Cancel', style: 'cancel' },
                          { text: 'Block', style: 'destructive', onPress: () => doBlockUser(selectedPerson.userId) },
                        ]);
                      }}
                      className="flex-1 bg-red-50 rounded-2xl py-3 items-center"
                    >
                      <Text className="text-red-600 font-bold">Block</Text>
                    </Pressable>
                  </View>

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
                      onPress={startPaidChat}
                      className="flex-1"
                    >
                      <LinearGradient
                        colors={['#7C3AED', '#6D28D9']}
                        style={{ borderRadius: 16, paddingVertical: 16, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' }}
                      >
                        <Send size={18} color="#fff" />
                        <Text className="text-white font-bold ml-2">Start Talk</Text>
                      </LinearGradient>
                    </Pressable>
                  </View>
                </>
              )}
            </Animated.View>
          </View>
        </Modal>

        {/* 18+ Confirmation Modal */}
        <Modal visible={showAgeModal} transparent animationType="fade">
          <View className="flex-1 bg-black/60 items-center justify-center px-5">
            <Animated.View entering={ZoomIn.springify()} className="bg-white rounded-3xl p-6 w-full max-w-sm">
              <View className="flex-row items-center justify-between mb-3">
                <View className="flex-row items-center">
                  <Shield size={20} color="#7C3AED" />
                  <Text className="text-gray-900 font-bold text-lg ml-2">Adults only (18+)</Text>
                </View>
                <Pressable onPress={() => setShowAgeModal(false)}>
                  <X size={22} color="#9CA3AF" />
                </Pressable>
              </View>

              <Text className="text-gray-600 text-sm mb-4">
                To use Talk Now (paid talk sessions), you must confirm you are 18 or older.
              </Text>

              <View className="bg-gray-50 rounded-2xl p-4 mb-4">
                <Text className="text-gray-700 font-semibold mb-2">Please confirm:</Text>
                <Text className="text-gray-600 text-sm">
                  I am 18 years old or older and agree to keep conversations in-app.
                </Text>
              </View>

              <View className="flex-row gap-3">
                <Pressable
                  onPress={() => {
                    setShowAgeModal(false);
                    Alert.alert('Not eligible', 'You must be 18+ to use Talk Now.');
                  }}
                  className="flex-1 bg-gray-100 rounded-2xl py-4 items-center"
                >
                  <Text className="text-gray-700 font-bold">I’m under 18</Text>
                </Pressable>

                <Pressable
                  onPress={async () => {
                    if (!currentUser?.id) return;
                    try {
                      await confirmTalkAge18Plus(currentUser.id);
                      setAgeConfirmed(true);
                      setShowAgeModal(false);
                    } catch (e: any) {
                      Alert.alert('Could not confirm age', String(e?.message ?? e));
                    }
                  }}
                  className="flex-1"
                >
                  <LinearGradient
                    colors={['#7C3AED', '#6D28D9']}
                    style={{ borderRadius: 16, paddingVertical: 16, alignItems: 'center' }}
                  >
                    <Text className="text-white font-bold">I’m 18+</Text>
                  </LinearGradient>
                </Pressable>
              </View>
            </Animated.View>
          </View>
        </Modal>
      </SafeAreaView>
    </View>
  );
}
