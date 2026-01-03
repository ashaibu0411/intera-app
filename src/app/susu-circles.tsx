import { useState } from 'react';
import { View, Text, ScrollView, Pressable, Image, TextInput, Modal } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PiggyBank, Users, Calendar, TrendingUp, CheckCircle, Clock, Plus, X, ChevronRight, AlertCircle, Award } from 'lucide-react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useStore } from '@/lib/store';
import { useAdvancedFeatures, type SusuCircle, type SusuMember } from '@/lib/advancedFeatures';
import * as Haptics from 'expo-haptics';
import { v4 as uuidv4 } from 'uuid';

// Mock data
const MOCK_CIRCLES: SusuCircle[] = [
  {
    id: '1',
    name: 'Women Empowerment Circle',
    description: 'Monthly savings circle for women entrepreneurs to support each other\'s business goals.',
    creatorId: '1',
    creatorName: 'Amara Johnson',
    members: [
      { userId: '1', userName: 'Amara J.', userAvatar: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=100', position: 1, trustScore: 92, hasReceivedPayout: true, totalContributed: 600, missedContributions: 0, joinedAt: '2024-06-01' },
      { userId: '2', userName: 'Fatou S.', userAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100', position: 2, trustScore: 88, hasReceivedPayout: true, totalContributed: 600, missedContributions: 0, joinedAt: '2024-06-01' },
      { userId: '3', userName: 'Chioma N.', userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100', position: 3, trustScore: 85, hasReceivedPayout: false, totalContributed: 600, missedContributions: 0, joinedAt: '2024-06-01' },
      { userId: '4', userName: 'Aisha M.', userAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100', position: 4, trustScore: 90, hasReceivedPayout: false, totalContributed: 500, missedContributions: 1, joinedAt: '2024-06-15' },
    ],
    contributionAmount: 100,
    currency: 'USD',
    frequency: 'monthly',
    startDate: '2024-06-01',
    currentRound: 3,
    totalRounds: 12,
    payoutOrder: ['1', '2', '3', '4'],
    nextPayoutDate: '2025-02-01',
    nextPayoutRecipientId: '3',
    status: 'active',
    rules: 'Contributions due by the 1st of each month. Late fees apply after 3 days.',
    contributions: [],
    createdAt: '2024-06-01',
  },
  {
    id: '2',
    name: 'Brothers in Business',
    description: 'Bi-weekly savings for business investments and emergency funds.',
    creatorId: '2',
    creatorName: 'Kwame Asante',
    members: [
      { userId: '1', userName: 'Kwame A.', userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100', position: 1, trustScore: 95, hasReceivedPayout: true, totalContributed: 1200, missedContributions: 0, joinedAt: '2024-01-01' },
      { userId: '2', userName: 'David O.', userAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100', position: 2, trustScore: 91, hasReceivedPayout: false, totalContributed: 1200, missedContributions: 0, joinedAt: '2024-01-01' },
    ],
    contributionAmount: 200,
    currency: 'USD',
    frequency: 'biweekly',
    startDate: '2024-01-01',
    currentRound: 6,
    totalRounds: 10,
    payoutOrder: ['1', '2'],
    nextPayoutDate: '2025-01-15',
    nextPayoutRecipientId: '2',
    status: 'active',
    rules: 'Contributions due every other Friday.',
    contributions: [],
    createdAt: '2024-01-01',
  },
];

export default function SusuCirclesScreen() {
  const router = useRouter();
  const currentUser = useStore((s) => s.currentUser);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedCircle, setSelectedCircle] = useState<SusuCircle | null>(null);

  const { susuCircles, addSusuCircle } = useAdvancedFeatures();
  const allCircles = [...susuCircles, ...MOCK_CIRCLES];

  const getFrequencyLabel = (freq: string) => {
    switch (freq) {
      case 'weekly': return 'Weekly';
      case 'biweekly': return 'Bi-weekly';
      case 'monthly': return 'Monthly';
      default: return freq;
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FAF7F2' }} edges={['top']}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Susu Circles',
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

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Info Banner */}
        <Animated.View entering={FadeInDown.delay(100)} className="mx-4 mt-4 bg-emerald-800 rounded-2xl p-4">
          <View className="flex-row items-center mb-2">
            <PiggyBank size={24} color="white" />
            <Text className="text-white font-bold text-lg ml-2">What is Susu?</Text>
          </View>
          <Text className="text-white/80 text-sm">
            Susu is a traditional African rotating savings system where group members contribute regularly and take turns receiving the pooled funds. It builds community trust while helping members save.
          </Text>
        </Animated.View>

        {/* My Circles */}
        <View className="p-4">
          <Text className="text-lg font-bold text-gray-900 mb-3">My Circles</Text>

          {allCircles.length === 0 ? (
            <View className="bg-white rounded-2xl p-8 items-center">
              <PiggyBank size={48} color="#D4673A" />
              <Text className="text-gray-900 font-semibold text-lg mt-4">No circles yet</Text>
              <Text className="text-gray-500 text-center mt-2">
                Join or create a savings circle to start building wealth with your community
              </Text>
              <Pressable
                onPress={() => setShowCreateModal(true)}
                className="bg-emerald-800 px-6 py-3 rounded-full mt-4"
              >
                <Text className="text-white font-semibold">Create Circle</Text>
              </Pressable>
            </View>
          ) : (
            allCircles.map((circle, index) => (
              <Animated.View
                key={circle.id}
                entering={FadeInDown.delay(100 + index * 100)}
              >
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSelectedCircle(circle);
                  }}
                  className="bg-white rounded-2xl p-4 mb-4 shadow-sm"
                >
                  <View className="flex-row items-center justify-between mb-3">
                    <View className="flex-1">
                      <Text className="text-gray-900 font-bold text-lg">{circle.name}</Text>
                      <Text className="text-gray-500 text-sm">by {circle.creatorName}</Text>
                    </View>
                    <View className={`px-3 py-1 rounded-full ${circle.status === 'active' ? 'bg-green-100' : 'bg-amber-100'}`}>
                      <Text className={`text-sm font-medium ${circle.status === 'active' ? 'text-green-700' : 'text-amber-700'}`}>
                        {circle.status === 'active' ? 'Active' : circle.status}
                      </Text>
                    </View>
                  </View>

                  <Text className="text-gray-600 text-sm mb-4" numberOfLines={2}>{circle.description}</Text>

                  {/* Stats Row */}
                  <View className="flex-row mb-4">
                    <View className="flex-1 items-center">
                      <Text className="text-emerald-700 font-bold text-xl">${circle.contributionAmount}</Text>
                      <Text className="text-gray-500 text-xs">{getFrequencyLabel(circle.frequency)}</Text>
                    </View>
                    <View className="w-px bg-gray-200" />
                    <View className="flex-1 items-center">
                      <Text className="text-gray-900 font-bold text-xl">{circle.members.length}</Text>
                      <Text className="text-gray-500 text-xs">Members</Text>
                    </View>
                    <View className="w-px bg-gray-200" />
                    <View className="flex-1 items-center">
                      <Text className="text-amber-600 font-bold text-xl">{circle.currentRound}/{circle.totalRounds}</Text>
                      <Text className="text-gray-500 text-xs">Round</Text>
                    </View>
                  </View>

                  {/* Members Avatars */}
                  <View className="flex-row items-center mb-4">
                    {circle.members.slice(0, 5).map((member, idx) => (
                      <Image
                        key={idx}
                        source={{ uri: member.userAvatar }}
                        className="w-8 h-8 rounded-full border-2 border-white"
                        style={{ marginLeft: idx > 0 ? -8 : 0 }}
                      />
                    ))}
                    {circle.members.length > 5 && (
                      <View className="w-8 h-8 rounded-full bg-gray-200 items-center justify-center" style={{ marginLeft: -8 }}>
                        <Text className="text-gray-600 text-xs font-medium">+{circle.members.length - 5}</Text>
                      </View>
                    )}
                  </View>

                  {/* Next Payout */}
                  <View className="bg-amber-50 rounded-xl p-3 flex-row items-center">
                    <Calendar size={18} color="#D4673A" />
                    <View className="ml-3 flex-1">
                      <Text className="text-amber-800 font-medium text-sm">Next Payout</Text>
                      <Text className="text-amber-600 text-xs">
                        {new Date(circle.nextPayoutDate).toLocaleDateString()} • ${circle.contributionAmount * circle.members.length}
                      </Text>
                    </View>
                    <ChevronRight size={18} color="#D4673A" />
                  </View>
                </Pressable>
              </Animated.View>
            ))
          )}
        </View>

        {/* How It Works */}
        <View className="px-4 pb-8">
          <Text className="text-lg font-bold text-gray-900 mb-3">How It Works</Text>
          <View className="bg-white rounded-2xl p-4">
            {[
              { step: 1, title: 'Join or Create', desc: 'Find a circle or start your own with trusted members', icon: Users },
              { step: 2, title: 'Contribute Regularly', desc: 'Make your contributions on time each cycle', icon: PiggyBank },
              { step: 3, title: 'Receive Payout', desc: 'When it\'s your turn, receive the full pooled amount', icon: TrendingUp },
              { step: 4, title: 'Build Trust', desc: 'Your reliability builds your Ubuntu Score', icon: Award },
            ].map((item, index) => {
              const Icon = item.icon;
              return (
                <View key={index} className={`flex-row items-start ${index < 3 ? 'mb-4 pb-4 border-b border-gray-100' : ''}`}>
                  <View className="w-10 h-10 rounded-full bg-emerald-100 items-center justify-center">
                    <Icon size={20} color="#1B4D3E" />
                  </View>
                  <View className="ml-3 flex-1">
                    <Text className="text-gray-900 font-semibold">{item.title}</Text>
                    <Text className="text-gray-500 text-sm">{item.desc}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>

      {/* Circle Detail Modal */}
      <Modal visible={!!selectedCircle} animationType="slide" presentationStyle="pageSheet">
        {selectedCircle && (
          <CircleDetailModal circle={selectedCircle} onClose={() => setSelectedCircle(null)} />
        )}
      </Modal>

      {/* Create Modal */}
      <Modal visible={showCreateModal} animationType="slide" presentationStyle="pageSheet">
        <CreateSusuModal onClose={() => setShowCreateModal(false)} onSubmit={addSusuCircle} />
      </Modal>
    </SafeAreaView>
  );
}

function CircleDetailModal({ circle, onClose }: { circle: SusuCircle; onClose: () => void }) {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FAF7F2' }}>
      <View className="flex-row items-center justify-between p-4 border-b border-gray-200 bg-white">
        <Pressable onPress={onClose}>
          <X size={24} color="#6B7280" />
        </Pressable>
        <Text className="text-lg font-bold text-gray-900">{circle.name}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView className="flex-1">
        {/* Header Stats */}
        <View className="bg-emerald-800 p-6">
          <View className="flex-row justify-around">
            <View className="items-center">
              <Text className="text-white/70 text-sm">Contribution</Text>
              <Text className="text-white font-bold text-2xl">${circle.contributionAmount}</Text>
            </View>
            <View className="items-center">
              <Text className="text-white/70 text-sm">Pool Size</Text>
              <Text className="text-white font-bold text-2xl">${circle.contributionAmount * circle.members.length}</Text>
            </View>
            <View className="items-center">
              <Text className="text-white/70 text-sm">Round</Text>
              <Text className="text-white font-bold text-2xl">{circle.currentRound}/{circle.totalRounds}</Text>
            </View>
          </View>
        </View>

        {/* Next Payout */}
        <View className="mx-4 mt-4 bg-amber-50 rounded-2xl p-4">
          <View className="flex-row items-center mb-2">
            <Calendar size={20} color="#D4673A" />
            <Text className="text-amber-800 font-bold ml-2">Next Payout</Text>
          </View>
          <Text className="text-amber-700">
            {new Date(circle.nextPayoutDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </Text>
          <Text className="text-amber-600 text-sm mt-1">
            Recipient will receive ${circle.contributionAmount * circle.members.length}
          </Text>
        </View>

        {/* Members */}
        <View className="p-4">
          <Text className="text-lg font-bold text-gray-900 mb-3">Members ({circle.members.length})</Text>
          {circle.members.map((member, index) => (
            <View key={index} className="bg-white rounded-xl p-4 mb-2 flex-row items-center">
              <Text className="text-gray-400 font-bold w-6">{member.position}</Text>
              <Image source={{ uri: member.userAvatar }} className="w-10 h-10 rounded-full ml-2" />
              <View className="ml-3 flex-1">
                <View className="flex-row items-center">
                  <Text className="text-gray-900 font-semibold">{member.userName}</Text>
                  {member.hasReceivedPayout && (
                    <CheckCircle size={14} color="#16A34A" style={{ marginLeft: 6 }} />
                  )}
                </View>
                <View className="flex-row items-center mt-1">
                  <View className="flex-row items-center bg-emerald-50 px-2 py-0.5 rounded-full mr-2">
                    <TrendingUp size={10} color="#059669" />
                    <Text className="text-emerald-700 text-xs ml-1">{member.trustScore}</Text>
                  </View>
                  <Text className="text-gray-500 text-xs">${member.totalContributed} contributed</Text>
                </View>
              </View>
              {member.missedContributions > 0 && (
                <View className="bg-red-100 px-2 py-1 rounded-full">
                  <Text className="text-red-700 text-xs">{member.missedContributions} late</Text>
                </View>
              )}
            </View>
          ))}
        </View>

        {/* Rules */}
        <View className="px-4 pb-8">
          <Text className="text-lg font-bold text-gray-900 mb-3">Circle Rules</Text>
          <View className="bg-white rounded-xl p-4">
            <Text className="text-gray-700">{circle.rules}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Action Button */}
      <View className="p-4 bg-white border-t border-gray-100">
        <Pressable
          onPress={() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)}
          className="bg-emerald-800 py-4 rounded-2xl"
        >
          <Text className="text-white font-bold text-center text-lg">Make Contribution</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function CreateSusuModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: (circle: SusuCircle) => void }) {
  const currentUser = useStore((s) => s.currentUser);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [frequency, setFrequency] = useState<'weekly' | 'biweekly' | 'monthly'>('monthly');

  const handleSubmit = () => {
    if (!name.trim() || !amount) return;

    const circle: SusuCircle = {
      id: uuidv4(),
      name: name.trim(),
      description: description.trim(),
      creatorId: currentUser?.id ?? 'guest',
      creatorName: currentUser?.name ?? 'Guest',
      members: [{
        userId: currentUser?.id ?? 'guest',
        userName: currentUser?.name ?? 'Guest',
        userAvatar: currentUser?.avatar ?? 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100',
        position: 1,
        trustScore: 50,
        hasReceivedPayout: false,
        totalContributed: 0,
        missedContributions: 0,
        joinedAt: new Date().toISOString(),
      }],
      contributionAmount: parseInt(amount),
      currency: 'USD',
      frequency,
      startDate: new Date().toISOString(),
      currentRound: 1,
      totalRounds: 12,
      payoutOrder: [currentUser?.id ?? 'guest'],
      nextPayoutDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      nextPayoutRecipientId: currentUser?.id ?? 'guest',
      status: 'forming',
      rules: 'Contributions due by the scheduled date. Late fees may apply.',
      contributions: [],
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
        <Text className="text-lg font-bold text-gray-900">Create Susu Circle</Text>
        <Pressable
          onPress={handleSubmit}
          disabled={!name.trim() || !amount}
          className={`px-4 py-2 rounded-full ${name.trim() && amount ? 'bg-emerald-800' : 'bg-gray-200'}`}
        >
          <Text className={`font-semibold ${name.trim() && amount ? 'text-white' : 'text-gray-400'}`}>
            Create
          </Text>
        </Pressable>
      </View>

      <ScrollView className="flex-1 p-4">
        <Text className="text-gray-700 font-medium mb-2">Circle Name</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="e.g., Women Empowerment Circle"
          className="bg-white p-4 rounded-xl text-gray-900 mb-4"
        />

        <Text className="text-gray-700 font-medium mb-2">Description</Text>
        <TextInput
          value={description}
          onChangeText={setDescription}
          placeholder="What's the purpose of this circle?"
          className="bg-white p-4 rounded-xl text-gray-900 mb-4"
          multiline
          numberOfLines={3}
        />

        <Text className="text-gray-700 font-medium mb-2">Contribution Amount ($)</Text>
        <TextInput
          value={amount}
          onChangeText={setAmount}
          placeholder="100"
          keyboardType="numeric"
          className="bg-white p-4 rounded-xl text-gray-900 mb-4"
        />

        <Text className="text-gray-700 font-medium mb-2">Frequency</Text>
        <View className="flex-row mb-4">
          {(['weekly', 'biweekly', 'monthly'] as const).map((freq) => (
            <Pressable
              key={freq}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setFrequency(freq);
              }}
              className={`flex-1 py-3 rounded-xl mr-2 ${frequency === freq ? 'bg-emerald-800' : 'bg-white'}`}
            >
              <Text className={`text-center font-medium capitalize ${frequency === freq ? 'text-white' : 'text-gray-700'}`}>
                {freq}
              </Text>
            </Pressable>
          ))}
        </View>

        <View className="bg-amber-50 rounded-xl p-4 mt-4">
          <View className="flex-row items-center mb-2">
            <AlertCircle size={18} color="#D4673A" />
            <Text className="text-amber-800 font-medium ml-2">Important</Text>
          </View>
          <Text className="text-amber-700 text-sm">
            Only invite people you trust. All members should have a good Ubuntu Trust Score. The payout order will be determined once all members join.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
