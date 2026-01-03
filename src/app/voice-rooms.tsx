import { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, Pressable, Image, TextInput, Modal, Dimensions } from 'react-native';
import { Stack, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Mic, MicOff, Users, Radio, Plus, X, ChevronRight, Calendar, Hand, Volume2, Crown, Heart, Sparkles, Gift, Star, Gem, Flame, Zap, MessageCircle, Share2, MoreHorizontal } from 'lucide-react-native';
import Animated, { FadeInDown, FadeInUp, FadeIn, useSharedValue, useAnimatedStyle, withSpring, withRepeat, withTiming, withSequence, runOnJS, Easing } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useStore } from '@/lib/store';
import { useAdvancedFeatures, type VoiceRoom, type VoiceRoomParticipant } from '@/lib/advancedFeatures';
import * as Haptics from 'expo-haptics';
import { v4 as uuidv4 } from 'uuid';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const CATEGORIES = ['All', 'General', 'Business', 'Culture', 'Faith', 'Entertainment', 'Education', 'Support'];

// Gift types with values
const GIFTS = [
  { id: 'heart', icon: Heart, name: 'Heart', value: 1, color: '#EF4444' },
  { id: 'star', icon: Star, name: 'Star', value: 5, color: '#F59E0B' },
  { id: 'flame', icon: Flame, name: 'Fire', value: 10, color: '#F97316' },
  { id: 'gem', icon: Gem, name: 'Diamond', value: 50, color: '#8B5CF6' },
  { id: 'crown', icon: Crown, name: 'Crown', value: 100, color: '#EAB308' },
  { id: 'sparkle', icon: Sparkles, name: 'Sparkle', value: 500, color: '#EC4899' },
];

interface RoomGift {
  id: string;
  giftId: string;
  senderId: string;
  senderName: string;
  recipientId: string;
  recipientName: string;
  timestamp: string;
}

const MOCK_ROOMS: VoiceRoom[] = [
  {
    id: '1',
    hostId: '1',
    hostName: 'Amara Johnson',
    hostAvatar: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=100',
    coHosts: [],
    title: 'African Entrepreneurs Roundtable',
    description: 'Weekly discussion about building businesses in the diaspora. Share your wins, challenges, and get advice.',
    topic: 'Business & Entrepreneurship',
    category: 'business',
    isLive: true,
    isRecurring: true,
    recurringSchedule: { dayOfWeek: 4, time: '19:00', timezone: 'America/Chicago' },
    speakers: [
      { id: '1', userId: '1', userName: 'Amara J.', userAvatar: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=100', role: 'host', isMuted: false, joinedAt: '2025-01-09T19:00:00' },
      { id: '2', userId: '2', userName: 'Kwame A.', userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100', role: 'speaker', isMuted: false, joinedAt: '2025-01-09T19:05:00' },
    ],
    listeners: [
      { id: '3', userId: '3', userName: 'Fatou S.', userAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100', role: 'listener', isMuted: true, joinedAt: '2025-01-09T19:10:00' },
      { id: '4', userId: '4', userName: 'David O.', userAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100', role: 'listener', isMuted: true, joinedAt: '2025-01-09T19:12:00' },
    ],
    raisedHands: ['4'],
    maxParticipants: 100,
    isPrivate: false,
    startedAt: '2025-01-09T19:00:00',
    createdAt: '2025-01-01',
  },
  {
    id: '2',
    hostId: '2',
    hostName: 'Pastor James',
    hostAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
    coHosts: [],
    title: 'Faith & Purpose',
    description: 'Evening devotion and discussion about finding purpose through faith.',
    topic: 'Faith & Spirituality',
    category: 'faith',
    isLive: true,
    isRecurring: true,
    speakers: [
      { id: '1', userId: '2', userName: 'Pastor James', userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100', role: 'host', isMuted: false, joinedAt: '2025-01-09T20:00:00' },
    ],
    listeners: [
      { id: '2', userId: '5', userName: 'Grace N.', userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100', role: 'listener', isMuted: true, joinedAt: '2025-01-09T20:05:00' },
    ],
    raisedHands: [],
    maxParticipants: 50,
    isPrivate: false,
    startedAt: '2025-01-09T20:00:00',
    createdAt: '2025-01-01',
  },
];

const SCHEDULED_ROOMS: VoiceRoom[] = [
  {
    id: '3',
    hostId: '3',
    hostName: 'Dr. Nneka',
    hostAvatar: 'https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=100',
    coHosts: [],
    title: 'Mental Health in the African Community',
    description: 'Breaking stigmas and discussing mental wellness in our community.',
    topic: 'Health & Wellness',
    category: 'support',
    isLive: false,
    isRecurring: false,
    speakers: [],
    listeners: [],
    raisedHands: [],
    maxParticipants: 100,
    isPrivate: false,
    scheduledFor: '2025-01-12T15:00:00',
    createdAt: '2025-01-08',
  },
];

export default function VoiceRoomsScreen() {
  const currentUser = useStore((s) => s.currentUser);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<VoiceRoom | null>(null);
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);

  const { voiceRooms, addVoiceRoom, leaveVoiceRoom } = useAdvancedFeatures();

  // Combine user rooms with mocks, but mark user's room
  const allRooms = [...voiceRooms, ...MOCK_ROOMS];
  const liveRooms = allRooms.filter((r) => r.isLive);
  const scheduled = SCHEDULED_ROOMS;

  const filteredRooms = liveRooms.filter((room) =>
    selectedCategory === 'All' || room.category === selectedCategory.toLowerCase()
  );

  const handleLeaveRoom = (roomId: string) => {
    if (currentUser?.id) {
      leaveVoiceRoom(roomId, currentUser.id);
    }
    setActiveRoomId(null);
    setSelectedRoom(null);
  };

  const handleJoinRoom = (room: VoiceRoom) => {
    setActiveRoomId(room.id);
    setSelectedRoom(room);
  };

  return (
    <SafeAreaView className="flex-1 bg-[#0A0A0F]" edges={['top']}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Live Rooms',
          headerStyle: { backgroundColor: '#0A0A0F' },
          headerTintColor: '#FFFFFF',
          headerTitleStyle: { fontWeight: 'bold' },
          headerRight: () => (
            <Pressable
              onPress={() => setShowCreateModal(true)}
              className="mr-2"
            >
              <LinearGradient
                colors={['#8B5CF6', '#EC4899']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ padding: 8, borderRadius: 20 }}
              >
                <Plus size={20} color="white" />
              </LinearGradient>
            </Pressable>
          ),
        }}
      />

      {/* Categories */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="px-4 py-3"
        style={{ flexGrow: 0 }}
        contentContainerStyle={{ paddingRight: 16 }}
      >
        {CATEGORIES.map((cat) => (
          <Pressable
            key={cat}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setSelectedCategory(cat);
            }}
            className="mr-2"
          >
            {selectedCategory === cat ? (
              <LinearGradient
                colors={['#8B5CF6', '#EC4899']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 }}
              >
                <Text className="font-semibold text-white">{cat}</Text>
              </LinearGradient>
            ) : (
              <View className="px-4 py-2 rounded-full bg-white/10">
                <Text className="font-medium text-gray-400">{cat}</Text>
              </View>
            )}
          </Pressable>
        ))}
      </ScrollView>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Live Now Header */}
        <View className="px-4 mt-2 mb-4">
          <View className="flex-row items-center">
            <View className="w-3 h-3 rounded-full bg-red-500 mr-2">
              <Animated.View
                className="w-3 h-3 rounded-full bg-red-500 absolute"
                style={{ opacity: 0.5, transform: [{ scale: 1.5 }] }}
              />
            </View>
            <Text className="text-xl font-bold text-white">Live Now</Text>
            <View className="ml-2 bg-white/10 px-2 py-0.5 rounded-full">
              <Text className="text-gray-400 text-sm">{filteredRooms.length}</Text>
            </View>
          </View>
        </View>

        {/* Live Rooms */}
        <View className="px-4">
          {filteredRooms.length === 0 ? (
            <View className="bg-white/5 rounded-3xl p-8 items-center border border-white/10">
              <View className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 items-center justify-center mb-4">
                <Radio size={40} color="#A855F7" />
              </View>
              <Text className="text-white font-bold text-xl">No live rooms</Text>
              <Text className="text-gray-500 text-center mt-2 mb-6">
                Be the first to start a conversation!
              </Text>
              <Pressable onPress={() => setShowCreateModal(true)}>
                <LinearGradient
                  colors={['#8B5CF6', '#EC4899']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{ paddingHorizontal: 24, paddingVertical: 12, borderRadius: 999 }}
                >
                  <Text className="text-white font-bold">Go Live</Text>
                </LinearGradient>
              </Pressable>
            </View>
          ) : (
            filteredRooms.map((room, index) => (
              <Animated.View key={room.id} entering={FadeInDown.delay(index * 100)}>
                <Pressable
                  onPress={() => handleJoinRoom(room)}
                  className="mb-4"
                >
                  <LinearGradient
                    colors={['rgba(139, 92, 246, 0.1)', 'rgba(236, 72, 153, 0.1)']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{ borderRadius: 24, padding: 1 }}
                  >
                    <View className="bg-[#12121A] rounded-3xl p-4">
                      {/* Room Header */}
                      <View className="flex-row items-center justify-between mb-3">
                        <View className="flex-row items-center">
                          <View className="bg-red-500/20 px-3 py-1 rounded-full flex-row items-center">
                            <View className="w-2 h-2 rounded-full bg-red-500 mr-1.5" />
                            <Text className="text-red-400 text-xs font-bold">LIVE</Text>
                          </View>
                          <View className="bg-white/10 px-3 py-1 rounded-full flex-row items-center ml-2">
                            <Users size={12} color="#9CA3AF" />
                            <Text className="text-gray-400 text-xs ml-1">
                              {room.speakers.length + room.listeners.length}
                            </Text>
                          </View>
                        </View>
                        {activeRoomId === room.id && (
                          <View className="bg-green-500/20 px-3 py-1 rounded-full">
                            <Text className="text-green-400 text-xs font-bold">JOINED</Text>
                          </View>
                        )}
                      </View>

                      <Text className="text-white font-bold text-lg">{room.title}</Text>
                      <Text className="text-gray-500 text-sm mt-1">{room.topic}</Text>

                      {/* Speakers Row */}
                      <View className="flex-row items-center mt-4">
                        {room.speakers.slice(0, 4).map((speaker, idx) => (
                          <View key={speaker.id} className="items-center mr-4">
                            <View className="relative">
                              <Image
                                source={{ uri: speaker.userAvatar }}
                                className="w-14 h-14 rounded-full"
                                style={{
                                  borderWidth: 2,
                                  borderColor: speaker.role === 'host' ? '#A855F7' : '#374151'
                                }}
                              />
                              {speaker.role === 'host' && (
                                <LinearGradient
                                  colors={['#F59E0B', '#EF4444']}
                                  style={{
                                    position: 'absolute',
                                    top: -4,
                                    right: -4,
                                    width: 22,
                                    height: 22,
                                    borderRadius: 11,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                  }}
                                >
                                  <Crown size={12} color="white" />
                                </LinearGradient>
                              )}
                              {!speaker.isMuted && (
                                <View className="absolute -bottom-1 -right-1 bg-green-500 w-5 h-5 rounded-full items-center justify-center border-2 border-[#12121A]">
                                  <Volume2 size={10} color="white" />
                                </View>
                              )}
                            </View>
                            <Text className="text-gray-400 text-xs mt-1.5" numberOfLines={1}>
                              {speaker.userName.split(' ')[0]}
                            </Text>
                          </View>
                        ))}
                      </View>

                      {/* Listeners preview */}
                      {room.listeners.length > 0 && (
                        <View className="flex-row items-center mt-4 pt-4 border-t border-white/10">
                          <Text className="text-gray-500 text-sm">Also here: </Text>
                          <View className="flex-row ml-2">
                            {room.listeners.slice(0, 5).map((listener, idx) => (
                              <Image
                                key={listener.id}
                                source={{ uri: listener.userAvatar }}
                                className="w-6 h-6 rounded-full border-2 border-[#12121A]"
                                style={{ marginLeft: idx > 0 ? -8 : 0 }}
                              />
                            ))}
                          </View>
                          {room.listeners.length > 5 && (
                            <Text className="text-gray-500 text-sm ml-2">+{room.listeners.length - 5}</Text>
                          )}
                        </View>
                      )}

                      {/* Join Button */}
                      <Pressable
                        onPress={() => handleJoinRoom(room)}
                        className="mt-4"
                      >
                        <LinearGradient
                          colors={activeRoomId === room.id ? ['#22C55E', '#16A34A'] : ['#8B5CF6', '#EC4899']}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={{ paddingVertical: 14, borderRadius: 16, alignItems: 'center' }}
                        >
                          <Text className="text-white font-bold text-base">
                            {activeRoomId === room.id ? 'Rejoin Room' : 'Join Room'}
                          </Text>
                        </LinearGradient>
                      </Pressable>
                    </View>
                  </LinearGradient>
                </Pressable>
              </Animated.View>
            ))
          )}
        </View>

        {/* Scheduled */}
        <View className="px-4 mt-6">
          <View className="flex-row items-center mb-4">
            <Calendar size={20} color="#A855F7" />
            <Text className="text-xl font-bold text-white ml-2">Upcoming</Text>
          </View>

          {scheduled.map((room, index) => (
            <Animated.View key={room.id} entering={FadeInDown.delay(300 + index * 100)}>
              <View className="bg-white/5 rounded-2xl p-4 mb-3 border border-white/10">
                <View className="flex-row items-start">
                  <Image source={{ uri: room.hostAvatar }} className="w-12 h-12 rounded-full" />
                  <View className="flex-1 ml-3">
                    <Text className="text-white font-bold">{room.title}</Text>
                    <Text className="text-gray-500 text-sm">by {room.hostName}</Text>
                  </View>
                </View>

                <View className="flex-row items-center mt-3 bg-purple-500/10 p-3 rounded-xl">
                  <Calendar size={16} color="#A855F7" />
                  <Text className="text-purple-400 ml-2 font-medium">
                    {new Date(room.scheduledFor!).toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </Text>
                </View>

                <Pressable
                  onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
                  className="border border-purple-500 py-3 rounded-xl mt-3"
                >
                  <Text className="text-purple-400 font-bold text-center">Set Reminder</Text>
                </Pressable>
              </View>
            </Animated.View>
          ))}
        </View>

        <View className="h-8" />
      </ScrollView>

      {/* Room Detail Modal */}
      <Modal visible={!!selectedRoom} animationType="slide" presentationStyle="fullScreen">
        {selectedRoom && (
          <VoiceRoomModal
            room={selectedRoom}
            onClose={() => handleLeaveRoom(selectedRoom.id)}
            isHost={selectedRoom.hostId === currentUser?.id}
          />
        )}
      </Modal>

      {/* Create Room Modal */}
      <Modal visible={showCreateModal} animationType="slide" presentationStyle="pageSheet">
        <CreateRoomModal onClose={() => setShowCreateModal(false)} onSubmit={addVoiceRoom} />
      </Modal>
    </SafeAreaView>
  );
}

function VoiceRoomModal({ room, onClose, isHost }: { room: VoiceRoom; onClose: () => void; isHost: boolean }) {
  const currentUser = useStore((s) => s.currentUser);
  const [isMuted, setIsMuted] = useState(true);
  const [hasRaisedHand, setHasRaisedHand] = useState(false);
  const [showGiftPanel, setShowGiftPanel] = useState(false);
  const [selectedSpeaker, setSelectedSpeaker] = useState<VoiceRoomParticipant | null>(null);
  const [gifts, setGifts] = useState<RoomGift[]>([]);
  const [hostGiftCount, setHostGiftCount] = useState(127); // Mock initial count
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);

  // Floating gift animation
  const [floatingGifts, setFloatingGifts] = useState<{ id: string; giftId: string; x: number }[]>([]);

  const sendGift = (giftId: string, recipient: VoiceRoomParticipant) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const gift = GIFTS.find(g => g.id === giftId);
    if (!gift) return;

    // Add to gifts list
    const newGift: RoomGift = {
      id: uuidv4(),
      giftId,
      senderId: currentUser?.id ?? 'guest',
      senderName: currentUser?.name ?? 'Guest',
      recipientId: recipient.userId,
      recipientName: recipient.userName,
      timestamp: new Date().toISOString(),
    };
    setGifts(prev => [newGift, ...prev].slice(0, 50));

    // Update host gift count if sent to host
    if (recipient.role === 'host') {
      setHostGiftCount(prev => prev + gift.value);
    }

    // Add floating animation
    const floatId = uuidv4();
    const randomX = Math.random() * (SCREEN_WIDTH - 100) + 50;
    setFloatingGifts(prev => [...prev, { id: floatId, giftId, x: randomX }]);

    // Remove after animation
    setTimeout(() => {
      setFloatingGifts(prev => prev.filter(f => f.id !== floatId));
    }, 2000);

    setShowGiftPanel(false);
    setSelectedSpeaker(null);
  };

  const handleLeave = () => {
    if (isHost) {
      setShowLeaveConfirm(true);
    } else {
      onClose();
    }
  };

  const confirmLeave = () => {
    setShowLeaveConfirm(false);
    onClose();
  };

  return (
    <View className="flex-1 bg-[#0A0A0F]">
      <SafeAreaView className="flex-1">
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 py-3">
          <Pressable
            onPress={handleLeave}
            className="bg-white/10 px-4 py-2 rounded-full flex-row items-center"
          >
            <Text className="text-white font-medium">Leave</Text>
          </Pressable>

          <View className="flex-row items-center">
            <View className="bg-red-500/20 px-3 py-1.5 rounded-full flex-row items-center">
              <View className="w-2 h-2 rounded-full bg-red-500 mr-1.5" />
              <Text className="text-red-400 text-sm font-bold">LIVE</Text>
            </View>
            <View className="bg-white/10 px-3 py-1.5 rounded-full flex-row items-center ml-2">
              <Users size={14} color="#9CA3AF" />
              <Text className="text-gray-400 text-sm ml-1">
                {room.speakers.length + room.listeners.length}
              </Text>
            </View>
          </View>

          <Pressable className="bg-white/10 p-2 rounded-full">
            <MoreHorizontal size={20} color="white" />
          </Pressable>
        </View>

        {/* Room Info */}
        <View className="px-4 mt-2">
          <Text className="text-purple-400 text-sm font-medium">{room.topic}</Text>
          <Text className="text-white font-bold text-2xl mt-1">{room.title}</Text>
        </View>

        <ScrollView className="flex-1 mt-4">
          {/* Speakers Section */}
          <View className="px-4">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-gray-400 text-sm font-medium">Speakers</Text>
              <View className="flex-row items-center bg-amber-500/20 px-3 py-1 rounded-full">
                <Gift size={14} color="#F59E0B" />
                <Text className="text-amber-400 font-bold ml-1">{hostGiftCount.toLocaleString()}</Text>
              </View>
            </View>

            <View className="flex-row flex-wrap justify-center">
              {room.speakers.map((speaker) => (
                <Pressable
                  key={speaker.id}
                  className="w-1/3 items-center mb-6"
                  onPress={() => {
                    setSelectedSpeaker(speaker);
                    setShowGiftPanel(true);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                >
                  <View className="relative">
                    {/* Speaking animation ring */}
                    {!speaker.isMuted && (
                      <Animated.View
                        className="absolute inset-0 rounded-full"
                        style={{
                          borderWidth: 3,
                          borderColor: '#22C55E',
                          transform: [{ scale: 1.1 }],
                          opacity: 0.5,
                        }}
                      />
                    )}
                    <Image
                      source={{ uri: speaker.userAvatar }}
                      className="w-20 h-20 rounded-full"
                      style={{
                        borderWidth: 3,
                        borderColor: speaker.isMuted ? '#374151' : '#22C55E'
                      }}
                    />
                    {speaker.role === 'host' && (
                      <LinearGradient
                        colors={['#F59E0B', '#EF4444']}
                        style={{
                          position: 'absolute',
                          top: -4,
                          right: -4,
                          width: 28,
                          height: 28,
                          borderRadius: 14,
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderWidth: 2,
                          borderColor: '#0A0A0F',
                        }}
                      >
                        <Crown size={14} color="white" />
                      </LinearGradient>
                    )}
                  </View>
                  <Text className="text-white font-medium mt-2" numberOfLines={1}>
                    {speaker.userName}
                  </Text>
                  <View className="flex-row items-center mt-1">
                    {speaker.isMuted ? (
                      <MicOff size={12} color="#6B7280" />
                    ) : (
                      <Mic size={12} color="#22C55E" />
                    )}
                    <Text className="text-gray-500 text-xs ml-1">
                      {speaker.role === 'host' ? 'Host' : 'Speaker'}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Listeners Section */}
          <View className="px-4 mt-4">
            <Text className="text-gray-400 text-sm font-medium mb-4">
              Listeners ({room.listeners.length})
            </Text>
            <View className="flex-row flex-wrap">
              {room.listeners.map((listener) => (
                <View key={listener.id} className="w-1/5 items-center mb-4">
                  <View className="relative">
                    <Image
                      source={{ uri: listener.userAvatar }}
                      className="w-14 h-14 rounded-full border-2 border-white/10"
                    />
                    {room.raisedHands.includes(listener.userId) && (
                      <View className="absolute -top-1 -right-1 bg-amber-500 w-6 h-6 rounded-full items-center justify-center border-2 border-[#0A0A0F]">
                        <Hand size={12} color="white" />
                      </View>
                    )}
                  </View>
                  <Text className="text-gray-400 text-xs mt-1.5 text-center" numberOfLines={1}>
                    {listener.userName.split(' ')[0]}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* Recent Gifts */}
          {gifts.length > 0 && (
            <View className="px-4 mt-4">
              <Text className="text-gray-400 text-sm font-medium mb-3">Recent Gifts</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }}>
                {gifts.slice(0, 10).map((gift) => {
                  const giftData = GIFTS.find(g => g.id === gift.giftId);
                  if (!giftData) return null;
                  const GiftIcon = giftData.icon;
                  return (
                    <View key={gift.id} className="bg-white/5 rounded-xl px-3 py-2 mr-2 flex-row items-center">
                      <GiftIcon size={16} color={giftData.color} />
                      <Text className="text-gray-400 text-xs ml-2">
                        <Text className="text-white">{gift.senderName.split(' ')[0]}</Text>
                        {' → '}
                        <Text className="text-purple-400">{gift.recipientName.split(' ')[0]}</Text>
                      </Text>
                    </View>
                  );
                })}
              </ScrollView>
            </View>
          )}
        </ScrollView>

        {/* Floating Gifts Animation */}
        {floatingGifts.map((fg) => {
          const giftData = GIFTS.find(g => g.id === fg.giftId);
          if (!giftData) return null;
          const GiftIcon = giftData.icon;
          return (
            <Animated.View
              key={fg.id}
              entering={FadeInUp.duration(2000)}
              style={{
                position: 'absolute',
                bottom: 200,
                left: fg.x,
              }}
            >
              <GiftIcon size={40} color={giftData.color} />
            </Animated.View>
          );
        })}

        {/* Bottom Controls */}
        <View className="px-4 pb-4">
          <View className="bg-white/5 rounded-3xl p-4 flex-row items-center justify-between">
            {/* Raise Hand */}
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                setHasRaisedHand(!hasRaisedHand);
              }}
              className={`w-14 h-14 rounded-full items-center justify-center ${hasRaisedHand ? 'bg-amber-500' : 'bg-white/10'}`}
            >
              <Hand size={24} color="white" />
            </Pressable>

            {/* Gift Button */}
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setSelectedSpeaker(room.speakers[0]); // Default to host
                setShowGiftPanel(true);
              }}
            >
              <LinearGradient
                colors={['#F59E0B', '#EF4444']}
                style={{ width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' }}
              >
                <Gift size={24} color="white" />
              </LinearGradient>
            </Pressable>

            {/* Mic Button */}
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                setIsMuted(!isMuted);
              }}
              className="w-16 h-16 rounded-full items-center justify-center"
              style={{ backgroundColor: isMuted ? 'rgba(255,255,255,0.1)' : '#22C55E' }}
            >
              {isMuted ? <MicOff size={28} color="white" /> : <Mic size={28} color="white" />}
            </Pressable>

            {/* Share */}
            <Pressable
              onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
              className="w-14 h-14 rounded-full bg-white/10 items-center justify-center"
            >
              <Share2 size={24} color="white" />
            </Pressable>

            {/* Leave */}
            <Pressable
              onPress={handleLeave}
              className="w-14 h-14 rounded-full bg-red-500 items-center justify-center"
            >
              <X size={24} color="white" />
            </Pressable>
          </View>
        </View>

        {/* Gift Panel Modal */}
        <Modal visible={showGiftPanel} transparent animationType="slide">
          <Pressable
            className="flex-1 bg-black/60"
            onPress={() => {
              setShowGiftPanel(false);
              setSelectedSpeaker(null);
            }}
          />
          <View className="bg-[#12121A] rounded-t-3xl p-4 pb-8">
            <View className="w-12 h-1 bg-white/20 rounded-full self-center mb-4" />

            {selectedSpeaker && (
              <View className="flex-row items-center mb-4">
                <Image source={{ uri: selectedSpeaker.userAvatar }} className="w-10 h-10 rounded-full" />
                <View className="ml-3">
                  <Text className="text-white font-medium">Send gift to</Text>
                  <Text className="text-purple-400">{selectedSpeaker.userName}</Text>
                </View>
              </View>
            )}

            <Text className="text-gray-400 text-sm mb-3">Choose a gift</Text>

            <View className="flex-row flex-wrap justify-between">
              {GIFTS.map((gift) => {
                const GiftIcon = gift.icon;
                return (
                  <Pressable
                    key={gift.id}
                    onPress={() => selectedSpeaker && sendGift(gift.id, selectedSpeaker)}
                    className="w-[30%] bg-white/5 rounded-2xl p-4 items-center mb-3"
                  >
                    <View className="w-12 h-12 rounded-full items-center justify-center mb-2" style={{ backgroundColor: `${gift.color}20` }}>
                      <GiftIcon size={24} color={gift.color} />
                    </View>
                    <Text className="text-white font-medium text-sm">{gift.name}</Text>
                    <View className="flex-row items-center mt-1">
                      <Gem size={10} color="#A855F7" />
                      <Text className="text-purple-400 text-xs ml-1">{gift.value}</Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>

            <View className="flex-row items-center justify-center mt-4 bg-white/5 rounded-xl p-3">
              <Gem size={16} color="#A855F7" />
              <Text className="text-white font-medium ml-2">Your Balance: 500</Text>
              <Pressable className="ml-auto bg-purple-500 px-4 py-2 rounded-full">
                <Text className="text-white font-bold text-sm">Get More</Text>
              </Pressable>
            </View>
          </View>
        </Modal>

        {/* Leave Confirmation for Host */}
        <Modal visible={showLeaveConfirm} transparent animationType="fade">
          <View className="flex-1 bg-black/80 items-center justify-center px-6">
            <View className="bg-[#12121A] rounded-3xl p-6 w-full">
              <Text className="text-white font-bold text-xl text-center">End Room?</Text>
              <Text className="text-gray-400 text-center mt-2">
                As the host, leaving will end the room for everyone.
              </Text>

              <Pressable
                onPress={confirmLeave}
                className="bg-red-500 py-4 rounded-xl mt-6"
              >
                <Text className="text-white font-bold text-center">End Room</Text>
              </Pressable>

              <Pressable
                onPress={() => setShowLeaveConfirm(false)}
                className="py-4 mt-2"
              >
                <Text className="text-gray-400 font-medium text-center">Cancel</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </View>
  );
}

function CreateRoomModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: (room: VoiceRoom) => void }) {
  const currentUser = useStore((s) => s.currentUser);
  const [title, setTitle] = useState('');
  const [topic, setTopic] = useState('');
  const [category, setCategory] = useState('general');

  const handleSubmit = () => {
    if (!title.trim()) return;

    const room: VoiceRoom = {
      id: uuidv4(),
      hostId: currentUser?.id ?? 'guest',
      hostName: currentUser?.name ?? 'Guest',
      hostAvatar: currentUser?.avatar ?? 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100',
      coHosts: [],
      title: title.trim(),
      description: '',
      topic: topic.trim() || 'General Discussion',
      category: category as VoiceRoom['category'],
      isLive: true,
      isRecurring: false,
      speakers: [{
        id: '1',
        userId: currentUser?.id ?? 'guest',
        userName: currentUser?.name ?? 'Guest',
        userAvatar: currentUser?.avatar ?? 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100',
        role: 'host',
        isMuted: false,
        joinedAt: new Date().toISOString(),
      }],
      listeners: [],
      raisedHands: [],
      maxParticipants: 100,
      isPrivate: false,
      startedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    onSubmit(room);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onClose();
  };

  return (
    <View className="flex-1 bg-[#0A0A0F]">
      <SafeAreaView className="flex-1">
        <View className="flex-row items-center justify-between p-4 border-b border-white/10">
          <Pressable onPress={onClose}>
            <X size={24} color="#9CA3AF" />
          </Pressable>
          <Text className="text-lg font-bold text-white">Start a Room</Text>
          <Pressable
            onPress={handleSubmit}
            disabled={!title.trim()}
          >
            {title.trim() ? (
              <LinearGradient
                colors={['#8B5CF6', '#EC4899']}
                style={{ paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999 }}
              >
                <Text className="text-white font-bold">Go Live</Text>
              </LinearGradient>
            ) : (
              <View className="bg-white/10 px-4 py-2 rounded-full">
                <Text className="text-gray-500 font-bold">Go Live</Text>
              </View>
            )}
          </Pressable>
        </View>

        <ScrollView className="flex-1 p-4">
          <Text className="text-gray-400 font-medium mb-2">Room Title</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="What do you want to talk about?"
            placeholderTextColor="#6B7280"
            className="bg-white/5 p-4 rounded-xl text-white mb-6 border border-white/10"
          />

          <Text className="text-gray-400 font-medium mb-2">Topic</Text>
          <TextInput
            value={topic}
            onChangeText={setTopic}
            placeholder="e.g., Business, Culture, Faith"
            placeholderTextColor="#6B7280"
            className="bg-white/5 p-4 rounded-xl text-white mb-6 border border-white/10"
          />

          <Text className="text-gray-400 font-medium mb-3">Category</Text>
          <View className="flex-row flex-wrap gap-2">
            {CATEGORIES.slice(1).map((cat) => (
              <Pressable
                key={cat}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setCategory(cat.toLowerCase());
                }}
              >
                {category === cat.toLowerCase() ? (
                  <LinearGradient
                    colors={['#8B5CF6', '#EC4899']}
                    style={{ paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999 }}
                  >
                    <Text className="text-white font-medium">{cat}</Text>
                  </LinearGradient>
                ) : (
                  <View className="px-4 py-2 rounded-full bg-white/5 border border-white/10">
                    <Text className="text-gray-400 font-medium">{cat}</Text>
                  </View>
                )}
              </Pressable>
            ))}
          </View>

          <View className="bg-purple-500/10 rounded-xl p-4 mt-8 border border-purple-500/20">
            <View className="flex-row items-center">
              <Mic size={20} color="#A855F7" />
              <Text className="text-purple-400 font-medium ml-2">Microphone Access</Text>
            </View>
            <Text className="text-gray-500 text-sm mt-2">
              You'll be asked to allow microphone access when you go live. Make sure you're in a quiet environment.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
