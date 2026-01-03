import { useState } from 'react';
import { View, Text, ScrollView, Pressable, Image, TextInput, Modal } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Heart, Users, MessageCircle, Lock, Plus, X, ChevronRight, Calendar, Shield, Eye, EyeOff } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useStore } from '@/lib/store';
import { useAdvancedFeatures, type SupportCircle, type SupportCircleMember } from '@/lib/advancedFeatures';
import * as Haptics from 'expo-haptics';
import { v4 as uuidv4 } from 'uuid';

const CATEGORIES = [
  { id: 'grief', name: 'Grief & Loss', icon: Heart, color: '#8B5CF6' },
  { id: 'immigration', name: 'Immigration', icon: Users, color: '#3B82F6' },
  { id: 'career', name: 'Career', icon: Users, color: '#10B981' },
  { id: 'parenting', name: 'Parenting', icon: Heart, color: '#F59E0B' },
  { id: 'health', name: 'Health', icon: Shield, color: '#EF4444' },
  { id: 'relationship', name: 'Relationships', icon: Heart, color: '#EC4899' },
  { id: 'faith', name: 'Faith', icon: Heart, color: '#6366F1' },
  { id: 'general', name: 'General', icon: MessageCircle, color: '#6B7280' },
];

const MOCK_CIRCLES: SupportCircle[] = [
  {
    id: '1',
    name: 'New to America Support',
    description: 'A safe space for recent immigrants to share experiences, ask questions, and support each other through the transition.',
    category: 'immigration',
    isPrivate: true,
    facilitatorId: '1',
    facilitatorName: 'Amara Johnson',
    facilitatorAvatar: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=100',
    members: [
      { userId: '1', userName: 'Amara J.', userAvatar: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=100', role: 'facilitator', isAnonymous: false, displayName: 'Amara J.', joinedAt: '2024-06-01', lastActive: '2025-01-09' },
      { userId: '2', userName: 'Member', userAvatar: '', role: 'member', isAnonymous: true, displayName: 'Hope123', joinedAt: '2024-07-01', lastActive: '2025-01-08' },
    ],
    maxMembers: 15,
    meetingSchedule: {
      frequency: 'weekly',
      dayOfWeek: 3,
      time: '19:00',
      isOnline: true,
      meetingLink: 'https://zoom.us/j/example',
    },
    guidelines: 'Be respectful. What\'s shared here stays here. No judgment.',
    posts: [],
    isActive: true,
    createdAt: '2024-06-01',
  },
  {
    id: '2',
    name: 'Career Transitions',
    description: 'Support for professionals navigating career changes, job hunting, or starting businesses in a new country.',
    category: 'career',
    isPrivate: false,
    facilitatorId: '2',
    facilitatorName: 'Kwame Asante',
    facilitatorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
    members: [
      { userId: '2', userName: 'Kwame A.', userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100', role: 'facilitator', isAnonymous: false, displayName: 'Kwame A.', joinedAt: '2024-08-01', lastActive: '2025-01-09' },
    ],
    maxMembers: 20,
    guidelines: 'Share resources. Celebrate wins. Support each other.',
    posts: [],
    isActive: true,
    createdAt: '2024-08-01',
  },
  {
    id: '3',
    name: 'New Parents Circle',
    description: 'For new parents navigating parenthood while balancing cultural traditions with new environments.',
    category: 'parenting',
    isPrivate: true,
    facilitatorId: '3',
    facilitatorName: 'Fatou Diallo',
    facilitatorAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100',
    members: [],
    maxMembers: 12,
    meetingSchedule: {
      frequency: 'biweekly',
      dayOfWeek: 6,
      time: '10:00',
      isOnline: true,
    },
    guidelines: 'A judgment-free zone for all parenting styles.',
    posts: [],
    isActive: true,
    createdAt: '2024-10-01',
  },
];

export default function SupportCirclesScreen() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const { supportCircles, addSupportCircle } = useAdvancedFeatures();
  const allCircles = [...supportCircles, ...MOCK_CIRCLES];

  const filteredCircles = selectedCategory
    ? allCircles.filter((c) => c.category === selectedCategory)
    : allCircles;

  const getCategoryInfo = (catId: string) => {
    return CATEGORIES.find((c) => c.id === catId) ?? CATEGORIES[7];
  };

  const getDayName = (day: number) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[day];
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FAF7F2' }} edges={['top']}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Support Circles',
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

      {/* Hero */}
      <Animated.View entering={FadeInDown.delay(100)} className="mx-4 mt-2 bg-purple-900 rounded-2xl p-4">
        <View className="flex-row items-center">
          <Heart size={24} color="white" />
          <Text className="text-white font-bold text-lg ml-2">You're Not Alone</Text>
        </View>
        <Text className="text-white/80 text-sm mt-2">
          Find support, share experiences, and heal together in a safe, confidential space.
        </Text>
      </Animated.View>

      {/* Categories */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="mt-4 px-4"
        contentContainerStyle={{ paddingRight: 16 }}
      >
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setSelectedCategory(null);
          }}
          className={`px-4 py-2 rounded-full mr-2 ${!selectedCategory ? 'bg-emerald-800' : 'bg-white'}`}
        >
          <Text className={`font-medium ${!selectedCategory ? 'text-white' : 'text-gray-700'}`}>
            All
          </Text>
        </Pressable>
        {CATEGORIES.map((cat) => (
          <Pressable
            key={cat.id}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setSelectedCategory(cat.id);
            }}
            className={`px-4 py-2 rounded-full mr-2 ${selectedCategory === cat.id ? 'bg-emerald-800' : 'bg-white'}`}
          >
            <Text className={`font-medium ${selectedCategory === cat.id ? 'text-white' : 'text-gray-700'}`}>
              {cat.name}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <ScrollView className="flex-1 mt-4" showsVerticalScrollIndicator={false}>
        <View className="px-4">
          {filteredCircles.map((circle, index) => {
            const catInfo = getCategoryInfo(circle.category);
            return (
              <Animated.View key={circle.id} entering={FadeInDown.delay(100 + index * 100)}>
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    router.push(`/support-circle?id=${circle.id}`);
                  }}
                  className="bg-white rounded-2xl p-4 mb-3 shadow-sm"
                >
                  <View className="flex-row items-start justify-between">
                    <View className="flex-row items-center flex-1">
                      <View
                        className="w-12 h-12 rounded-xl items-center justify-center"
                        style={{ backgroundColor: `${catInfo.color}20` }}
                      >
                        <catInfo.icon size={24} color={catInfo.color} />
                      </View>
                      <View className="flex-1 ml-3">
                        <View className="flex-row items-center">
                          <Text className="text-gray-900 font-bold text-lg flex-1" numberOfLines={1}>
                            {circle.name}
                          </Text>
                          {circle.isPrivate && (
                            <Lock size={14} color="#6B7280" style={{ marginLeft: 4 }} />
                          )}
                        </View>
                        <Text className="text-gray-500 text-sm">{catInfo.name}</Text>
                      </View>
                    </View>
                  </View>

                  <Text className="text-gray-600 text-sm mt-3" numberOfLines={2}>
                    {circle.description}
                  </Text>

                  {/* Facilitator */}
                  <View className="flex-row items-center mt-3 bg-gray-50 rounded-xl p-3">
                    <Image source={{ uri: circle.facilitatorAvatar }} className="w-8 h-8 rounded-full" />
                    <View className="ml-2">
                      <Text className="text-gray-500 text-xs">Facilitated by</Text>
                      <Text className="text-gray-900 font-medium text-sm">{circle.facilitatorName}</Text>
                    </View>
                  </View>

                  {/* Meeting Schedule */}
                  {circle.meetingSchedule && (
                    <View className="flex-row items-center mt-3">
                      <Calendar size={14} color="#D4673A" />
                      <Text className="text-amber-700 text-sm ml-2">
                        {circle.meetingSchedule.frequency === 'weekly' ? 'Every' : 'Every other'}{' '}
                        {getDayName(circle.meetingSchedule.dayOfWeek)} at {circle.meetingSchedule.time}
                      </Text>
                    </View>
                  )}

                  <View className="flex-row items-center justify-between mt-3 pt-3 border-t border-gray-100">
                    <View className="flex-row items-center">
                      <Users size={14} color="#6B7280" />
                      <Text className="text-gray-500 text-sm ml-1">
                        {circle.members.length}/{circle.maxMembers} members
                      </Text>
                    </View>
                    <View className="flex-row items-center">
                      <Text className="text-emerald-700 font-medium">Join Circle</Text>
                      <ChevronRight size={16} color="#047857" />
                    </View>
                  </View>
                </Pressable>
              </Animated.View>
            );
          })}
        </View>

        {/* Privacy Note */}
        <View className="mx-4 mt-4 mb-8 bg-gray-100 rounded-xl p-4">
          <View className="flex-row items-center mb-2">
            <Shield size={18} color="#6B7280" />
            <Text className="text-gray-700 font-semibold ml-2">Your Privacy Matters</Text>
          </View>
          <Text className="text-gray-500 text-sm">
            All circles are confidential. You can participate anonymously if you prefer. What's shared in circles stays in circles.
          </Text>
        </View>
      </ScrollView>

      {/* Create Modal */}
      <Modal visible={showCreateModal} animationType="slide" presentationStyle="pageSheet">
        <CreateCircleModal onClose={() => setShowCreateModal(false)} onSubmit={addSupportCircle} />
      </Modal>
    </SafeAreaView>
  );
}

function CreateCircleModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: (circle: SupportCircle) => void }) {
  const currentUser = useStore((s) => s.currentUser);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('general');
  const [isPrivate, setIsPrivate] = useState(true);

  const handleSubmit = () => {
    if (!name.trim()) return;

    const circle: SupportCircle = {
      id: uuidv4(),
      name: name.trim(),
      description: description.trim(),
      category: category as SupportCircle['category'],
      isPrivate,
      facilitatorId: currentUser?.id ?? 'guest',
      facilitatorName: currentUser?.name ?? 'Guest',
      facilitatorAvatar: currentUser?.avatar ?? 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100',
      members: [{
        userId: currentUser?.id ?? 'guest',
        userName: currentUser?.name ?? 'Guest',
        userAvatar: currentUser?.avatar ?? '',
        role: 'facilitator',
        isAnonymous: false,
        displayName: currentUser?.name ?? 'Guest',
        joinedAt: new Date().toISOString(),
        lastActive: new Date().toISOString(),
      }],
      maxMembers: 15,
      guidelines: 'Be respectful. Maintain confidentiality. Support each other.',
      posts: [],
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    onSubmit(circle);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onClose();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FAF7F2' }}>
      <View className="flex-row items-center justify-between p-4 border-b border-gray-200 bg-white">
        <Pressable onPress={onClose}>
          <X size={24} color="#6B7280" />
        </Pressable>
        <Text className="text-lg font-bold text-gray-900">Create Support Circle</Text>
        <Pressable
          onPress={handleSubmit}
          disabled={!name.trim()}
          className={`px-4 py-2 rounded-full ${name.trim() ? 'bg-emerald-800' : 'bg-gray-200'}`}
        >
          <Text className={`font-semibold ${name.trim() ? 'text-white' : 'text-gray-400'}`}>
            Create
          </Text>
        </Pressable>
      </View>

      <ScrollView className="flex-1 p-4">
        <Text className="text-gray-700 font-medium mb-2">Circle Name</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="e.g., New Parents Support"
          className="bg-white p-4 rounded-xl text-gray-900 mb-4"
        />

        <Text className="text-gray-700 font-medium mb-2">Description</Text>
        <TextInput
          value={description}
          onChangeText={setDescription}
          placeholder="What is this circle about?"
          className="bg-white p-4 rounded-xl text-gray-900 mb-4"
          multiline
          numberOfLines={3}
        />

        <Text className="text-gray-700 font-medium mb-2">Category</Text>
        <View className="flex-row flex-wrap gap-2 mb-4">
          {CATEGORIES.map((cat) => (
            <Pressable
              key={cat.id}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setCategory(cat.id);
              }}
              className={`px-4 py-2 rounded-full ${category === cat.id ? 'bg-emerald-800' : 'bg-white'}`}
            >
              <Text className={`font-medium ${category === cat.id ? 'text-white' : 'text-gray-700'}`}>
                {cat.name}
              </Text>
            </Pressable>
          ))}
        </View>

        <Pressable
          onPress={() => setIsPrivate(!isPrivate)}
          className="flex-row items-center justify-between bg-white p-4 rounded-xl"
        >
          <View className="flex-row items-center">
            {isPrivate ? <Lock size={20} color="#6B7280" /> : <Eye size={20} color="#6B7280" />}
            <Text className="text-gray-900 font-medium ml-3">
              {isPrivate ? 'Private Circle' : 'Public Circle'}
            </Text>
          </View>
          <View className={`w-12 h-7 rounded-full p-1 ${isPrivate ? 'bg-emerald-500' : 'bg-gray-300'}`}>
            <View className={`w-5 h-5 rounded-full bg-white ${isPrivate ? 'self-end' : 'self-start'}`} />
          </View>
        </Pressable>
        <Text className="text-gray-500 text-sm mt-2 ml-1">
          {isPrivate ? 'Only approved members can join and see content' : 'Anyone can join and see content'}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
