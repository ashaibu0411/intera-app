import { useState } from 'react';
import { View, Text, ScrollView, Pressable, Image, TextInput, Modal } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Mic, MicOff, Users, Radio, Plus, X, ChevronRight, Calendar, Hand, Volume2, Crown } from 'lucide-react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useStore } from '@/lib/store';
import { useAdvancedFeatures, type VoiceRoom, type VoiceRoomParticipant } from '@/lib/advancedFeatures';
import * as Haptics from 'expo-haptics';
import { v4 as uuidv4 } from 'uuid';

const CATEGORIES = ['All', 'General', 'Business', 'Culture', 'Faith', 'Entertainment', 'Education', 'Support'];

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
  const router = useRouter();
  const currentUser = useStore((s) => s.currentUser);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<VoiceRoom | null>(null);

  const { voiceRooms, addVoiceRoom } = useAdvancedFeatures();
  const allRooms = [...voiceRooms, ...MOCK_ROOMS];
  const liveRooms = allRooms.filter((r) => r.isLive);
  const scheduled = SCHEDULED_ROOMS;

  const filteredRooms = liveRooms.filter((room) =>
    selectedCategory === 'All' || room.category === selectedCategory.toLowerCase()
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FAF7F2' }} edges={['top']}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Voice Rooms',
          headerStyle: { backgroundColor: '#FAF7F2' },
          headerTintColor: '#1B4D3E',
          headerRight: () => (
            <Pressable
              onPress={() => setShowCreateModal(true)}
              className="mr-2 bg-amber-100 p-2 rounded-full"
            >
              <Plus size={20} color="#D4673A" />
            </Pressable>
          ),
        }}
      />

      {/* Categories */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="px-4 py-3"
        contentContainerStyle={{ paddingRight: 16 }}
      >
        {CATEGORIES.map((cat) => (
          <Pressable
            key={cat}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setSelectedCategory(cat);
            }}
            className={`px-4 py-2 rounded-full mr-2 ${selectedCategory === cat ? 'bg-emerald-800' : 'bg-white'}`}
          >
            <Text className={`font-medium ${selectedCategory === cat ? 'text-white' : 'text-gray-700'}`}>
              {cat}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Live Now */}
        <View className="px-4">
          <View className="flex-row items-center mb-3">
            <View className="w-2 h-2 rounded-full bg-red-500 mr-2" />
            <Text className="text-lg font-bold text-gray-900">Live Now</Text>
            <Text className="text-gray-500 ml-2">({filteredRooms.length})</Text>
          </View>

          {filteredRooms.length === 0 ? (
            <View className="bg-white rounded-2xl p-8 items-center mb-6">
              <Radio size={48} color="#D4673A" />
              <Text className="text-gray-900 font-semibold text-lg mt-4">No live rooms</Text>
              <Text className="text-gray-500 text-center mt-2">
                Be the first to start a conversation!
              </Text>
              <Pressable
                onPress={() => setShowCreateModal(true)}
                className="bg-emerald-800 px-6 py-3 rounded-full mt-4"
              >
                <Text className="text-white font-semibold">Start a Room</Text>
              </Pressable>
            </View>
          ) : (
            filteredRooms.map((room, index) => (
              <Animated.View key={room.id} entering={FadeInDown.delay(index * 100)}>
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    setSelectedRoom(room);
                  }}
                  className="bg-white rounded-2xl p-4 mb-3 shadow-sm"
                >
                  {/* Room Header */}
                  <View className="flex-row items-center justify-between mb-3">
                    <View className="bg-red-100 px-2 py-1 rounded-full flex-row items-center">
                      <View className="w-2 h-2 rounded-full bg-red-500 mr-1" />
                      <Text className="text-red-700 text-xs font-bold">LIVE</Text>
                    </View>
                    <View className="flex-row items-center">
                      <Users size={14} color="#6B7280" />
                      <Text className="text-gray-500 text-sm ml-1">
                        {room.speakers.length + room.listeners.length}
                      </Text>
                    </View>
                  </View>

                  <Text className="text-gray-900 font-bold text-lg">{room.title}</Text>
                  <Text className="text-gray-500 text-sm mt-1">{room.topic}</Text>

                  {/* Speakers */}
                  <View className="flex-row items-center mt-4">
                    {room.speakers.slice(0, 4).map((speaker, idx) => (
                      <View key={speaker.id} className="items-center mr-4">
                        <View className="relative">
                          <Image
                            source={{ uri: speaker.userAvatar }}
                            className="w-12 h-12 rounded-full"
                            style={{ borderWidth: 2, borderColor: speaker.role === 'host' ? '#D4673A' : '#E5E7EB' }}
                          />
                          {speaker.role === 'host' && (
                            <View className="absolute -top-1 -right-1 bg-amber-500 w-5 h-5 rounded-full items-center justify-center">
                              <Crown size={10} color="white" />
                            </View>
                          )}
                          {!speaker.isMuted && (
                            <View className="absolute -bottom-1 -right-1 bg-emerald-500 w-5 h-5 rounded-full items-center justify-center">
                              <Volume2 size={10} color="white" />
                            </View>
                          )}
                        </View>
                        <Text className="text-gray-700 text-xs mt-1" numberOfLines={1}>
                          {speaker.userName.split(' ')[0]}
                        </Text>
                      </View>
                    ))}
                    {room.speakers.length > 4 && (
                      <View className="w-12 h-12 rounded-full bg-gray-100 items-center justify-center">
                        <Text className="text-gray-500 text-sm font-medium">+{room.speakers.length - 4}</Text>
                      </View>
                    )}
                  </View>

                  {/* Listeners preview */}
                  {room.listeners.length > 0 && (
                    <View className="flex-row items-center mt-3 pt-3 border-t border-gray-100">
                      <Text className="text-gray-500 text-sm">Listening: </Text>
                      {room.listeners.slice(0, 3).map((listener, idx) => (
                        <Image
                          key={listener.id}
                          source={{ uri: listener.userAvatar }}
                          className="w-6 h-6 rounded-full border border-white"
                          style={{ marginLeft: idx > 0 ? -6 : 4 }}
                        />
                      ))}
                      {room.listeners.length > 3 && (
                        <Text className="text-gray-500 text-sm ml-2">+{room.listeners.length - 3} more</Text>
                      )}
                    </View>
                  )}

                  {/* Join Button */}
                  <Pressable
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                      setSelectedRoom(room);
                    }}
                    className="bg-emerald-800 py-3 rounded-xl mt-4"
                  >
                    <Text className="text-white font-bold text-center">Join Room</Text>
                  </Pressable>
                </Pressable>
              </Animated.View>
            ))
          )}
        </View>

        {/* Scheduled */}
        <View className="px-4 mt-4">
          <View className="flex-row items-center mb-3">
            <Calendar size={18} color="#1B4D3E" />
            <Text className="text-lg font-bold text-gray-900 ml-2">Upcoming</Text>
          </View>

          {scheduled.map((room, index) => (
            <Animated.View key={room.id} entering={FadeInDown.delay(300 + index * 100)}>
              <Pressable className="bg-white rounded-2xl p-4 mb-3 shadow-sm">
                <View className="flex-row items-start">
                  <Image source={{ uri: room.hostAvatar }} className="w-12 h-12 rounded-full" />
                  <View className="flex-1 ml-3">
                    <Text className="text-gray-900 font-bold">{room.title}</Text>
                    <Text className="text-gray-500 text-sm">by {room.hostName}</Text>
                  </View>
                </View>

                <View className="flex-row items-center mt-3 bg-amber-50 p-3 rounded-xl">
                  <Calendar size={16} color="#D4673A" />
                  <Text className="text-amber-700 ml-2 font-medium">
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
                  className="border-2 border-emerald-800 py-2 rounded-xl mt-3"
                >
                  <Text className="text-emerald-800 font-bold text-center">Set Reminder</Text>
                </Pressable>
              </Pressable>
            </Animated.View>
          ))}
        </View>

        <View className="h-8" />
      </ScrollView>

      {/* Room Detail Modal */}
      <Modal visible={!!selectedRoom} animationType="slide" presentationStyle="fullScreen">
        {selectedRoom && (
          <VoiceRoomModal room={selectedRoom} onClose={() => setSelectedRoom(null)} />
        )}
      </Modal>

      {/* Create Room Modal */}
      <Modal visible={showCreateModal} animationType="slide" presentationStyle="pageSheet">
        <CreateRoomModal onClose={() => setShowCreateModal(false)} onSubmit={addVoiceRoom} />
      </Modal>
    </SafeAreaView>
  );
}

function VoiceRoomModal({ room, onClose }: { room: VoiceRoom; onClose: () => void }) {
  const [isMuted, setIsMuted] = useState(true);
  const [hasRaisedHand, setHasRaisedHand] = useState(false);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#1B4D3E' }}>
      {/* Header */}
      <View className="flex-row items-center justify-between p-4">
        <Pressable onPress={onClose} className="bg-white/20 px-4 py-2 rounded-full">
          <Text className="text-white font-medium">Leave</Text>
        </Pressable>
        <View className="bg-red-500/20 px-3 py-1 rounded-full flex-row items-center">
          <View className="w-2 h-2 rounded-full bg-red-500 mr-1" />
          <Text className="text-red-300 text-sm font-bold">LIVE</Text>
        </View>
      </View>

      {/* Room Info */}
      <View className="px-4 mt-4">
        <Text className="text-white/60 text-sm">{room.topic}</Text>
        <Text className="text-white font-bold text-2xl mt-1">{room.title}</Text>
        <Text className="text-white/70 mt-2">{room.description}</Text>
      </View>

      <ScrollView className="flex-1 mt-6">
        {/* Speakers */}
        <View className="px-4">
          <Text className="text-white/60 text-sm mb-3">Speakers</Text>
          <View className="flex-row flex-wrap">
            {room.speakers.map((speaker) => (
              <View key={speaker.id} className="w-1/4 items-center mb-4">
                <View className="relative">
                  <Image
                    source={{ uri: speaker.userAvatar }}
                    className="w-16 h-16 rounded-full"
                    style={{ borderWidth: 3, borderColor: speaker.isMuted ? '#6B7280' : '#10B981' }}
                  />
                  {speaker.role === 'host' && (
                    <View className="absolute -top-1 -right-1 bg-amber-500 w-6 h-6 rounded-full items-center justify-center">
                      <Crown size={12} color="white" />
                    </View>
                  )}
                </View>
                <Text className="text-white text-sm mt-2 text-center" numberOfLines={1}>
                  {speaker.userName}
                </Text>
                {speaker.isMuted ? (
                  <MicOff size={14} color="#9CA3AF" style={{ marginTop: 2 }} />
                ) : (
                  <Mic size={14} color="#10B981" style={{ marginTop: 2 }} />
                )}
              </View>
            ))}
          </View>
        </View>

        {/* Listeners */}
        <View className="px-4 mt-6">
          <Text className="text-white/60 text-sm mb-3">Listeners ({room.listeners.length})</Text>
          <View className="flex-row flex-wrap">
            {room.listeners.map((listener) => (
              <View key={listener.id} className="w-1/5 items-center mb-4">
                <View className="relative">
                  <Image source={{ uri: listener.userAvatar }} className="w-12 h-12 rounded-full" />
                  {room.raisedHands.includes(listener.userId) && (
                    <View className="absolute -top-1 -right-1 bg-amber-500 w-5 h-5 rounded-full items-center justify-center">
                      <Hand size={10} color="white" />
                    </View>
                  )}
                </View>
                <Text className="text-white/70 text-xs mt-1 text-center" numberOfLines={1}>
                  {listener.userName.split(' ')[0]}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Controls */}
      <View className="p-4 flex-row items-center justify-center space-x-4">
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            setHasRaisedHand(!hasRaisedHand);
          }}
          className={`w-14 h-14 rounded-full items-center justify-center ${hasRaisedHand ? 'bg-amber-500' : 'bg-white/20'}`}
        >
          <Hand size={24} color="white" />
        </Pressable>

        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            setIsMuted(!isMuted);
          }}
          className={`w-16 h-16 rounded-full items-center justify-center ${isMuted ? 'bg-white/20' : 'bg-emerald-500'}`}
        >
          {isMuted ? <MicOff size={28} color="white" /> : <Mic size={28} color="white" />}
        </Pressable>

        <Pressable
          onPress={() => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            onClose();
          }}
          className="w-14 h-14 rounded-full bg-red-500 items-center justify-center"
        >
          <X size={24} color="white" />
        </Pressable>
      </View>
    </SafeAreaView>
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
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FAF7F2' }}>
      <View className="flex-row items-center justify-between p-4 border-b border-gray-200 bg-white">
        <Pressable onPress={onClose}>
          <X size={24} color="#6B7280" />
        </Pressable>
        <Text className="text-lg font-bold text-gray-900">Start a Room</Text>
        <Pressable
          onPress={handleSubmit}
          disabled={!title.trim()}
          className={`px-4 py-2 rounded-full ${title.trim() ? 'bg-emerald-800' : 'bg-gray-200'}`}
        >
          <Text className={`font-semibold ${title.trim() ? 'text-white' : 'text-gray-400'}`}>
            Go Live
          </Text>
        </Pressable>
      </View>

      <ScrollView className="flex-1 p-4">
        <Text className="text-gray-700 font-medium mb-2">Room Title</Text>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="What do you want to talk about?"
          className="bg-white p-4 rounded-xl text-gray-900 mb-4"
        />

        <Text className="text-gray-700 font-medium mb-2">Topic</Text>
        <TextInput
          value={topic}
          onChangeText={setTopic}
          placeholder="e.g., Business, Culture, Faith"
          className="bg-white p-4 rounded-xl text-gray-900 mb-4"
        />

        <Text className="text-gray-700 font-medium mb-2">Category</Text>
        <View className="flex-row flex-wrap gap-2">
          {CATEGORIES.slice(1).map((cat) => (
            <Pressable
              key={cat}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setCategory(cat.toLowerCase());
              }}
              className={`px-4 py-2 rounded-full ${category === cat.toLowerCase() ? 'bg-emerald-800' : 'bg-white'}`}
            >
              <Text className={`font-medium ${category === cat.toLowerCase() ? 'text-white' : 'text-gray-700'}`}>
                {cat}
              </Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
