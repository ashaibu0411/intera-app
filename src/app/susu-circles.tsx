import { useState, useMemo } from 'react';
import { View, Text, ScrollView, Pressable, Image, TextInput, Modal, Alert, Share } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  PiggyBank, Users, Calendar, TrendingUp, CheckCircle, Clock, Plus, X,
  ChevronRight, AlertCircle, Award, CreditCard, Banknote, Building2,
  Smartphone, Eye, EyeOff, History, Shield, AlertTriangle, Check,
  DollarSign, UserCheck, FileText, Send, CircleDollarSign, UserPlus,
  Link, Copy, Lock, Globe, Mail, Phone
} from 'lucide-react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useStore } from '@/lib/store';
import {
  useAdvancedFeatures,
  type SusuCircle,
  type SusuMember,
  type SusuContribution,
  type SusuPayout,
  type SusuInvite
} from '@/lib/advancedFeatures';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import { v4 as uuidv4 } from 'uuid';

// Mock data with contributions
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
    isPrivate: false,
    pendingInvites: [],
    maxMembers: 12,
    inviteCode: 'WEC2024',
  },
];

const MOCK_CONTRIBUTIONS: SusuContribution[] = [
  { id: 'c1', circleId: '1', memberId: '1', memberName: 'Amara J.', memberAvatar: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=100', round: 3, amount: 100, status: 'confirmed', paymentMethod: 'card', dueDate: '2025-01-01', paidAt: '2024-12-28', confirmedAt: '2024-12-28', confirmedBy: '1' },
  { id: 'c2', circleId: '1', memberId: '2', memberName: 'Fatou S.', memberAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100', round: 3, amount: 100, status: 'paid', paymentMethod: 'mobile_money', dueDate: '2025-01-01', paidAt: '2024-12-30' },
  { id: 'c3', circleId: '1', memberId: '3', memberName: 'Chioma N.', memberAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100', round: 3, amount: 100, status: 'paid', paymentMethod: 'cash', dueDate: '2025-01-01', paidAt: '2025-01-01' },
  { id: 'c4', circleId: '1', memberId: '4', memberName: 'Aisha M.', memberAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100', round: 3, amount: 100, status: 'pending', paymentMethod: 'cash', dueDate: '2025-01-01' },
];

export default function SusuCirclesScreen() {
  const router = useRouter();
  const currentUser = useStore((s) => s.currentUser);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedCircle, setSelectedCircle] = useState<SusuCircle | null>(null);

  const { susuCircles, addSusuCircle, susuContributions } = useAdvancedFeatures();
  const allCircles = [...susuCircles, ...MOCK_CIRCLES];
  const allContributions = [...susuContributions, ...MOCK_CONTRIBUTIONS];

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
        {/* App Store Compliance Disclaimer */}
        <Animated.View entering={FadeInDown.delay(50)} className="mx-4 mt-4 bg-amber-50 border border-amber-200 rounded-2xl p-4">
          <View className="flex-row items-center mb-2">
            <AlertTriangle size={20} color="#D97706" />
            <Text className="text-amber-800 font-semibold ml-2">Tracking Tool Only</Text>
          </View>
          <Text className="text-amber-700 text-sm">
            This feature helps you organize and track your savings circle. All actual money transfers and payments happen outside this app through your preferred payment methods (cash, bank transfer, mobile money, etc.). This app does not process any payments.
          </Text>
        </Animated.View>

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
            allCircles.map((circle, index) => {
              const circleContributions = allContributions.filter(c => c.circleId === circle.id && c.round === circle.currentRound);
              const paidCount = circleContributions.filter(c => c.status === 'paid' || c.status === 'confirmed').length;
              const isOrganizer = circle.creatorId === (currentUser?.id ?? 'guest');

              return (
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
                        <View className="flex-row items-center">
                          <Text className="text-gray-900 font-bold text-lg">{circle.name}</Text>
                          {isOrganizer && (
                            <View className="ml-2 bg-amber-100 px-2 py-0.5 rounded-full">
                              <Text className="text-amber-700 text-xs font-medium">Organizer</Text>
                            </View>
                          )}
                        </View>
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

                    {/* Payment Progress */}
                    <View className="bg-gray-50 rounded-xl p-3 mb-4">
                      <View className="flex-row items-center justify-between mb-2">
                        <Text className="text-gray-700 font-medium text-sm">Round {circle.currentRound} Contributions</Text>
                        <Text className="text-emerald-700 font-semibold">{paidCount}/{circle.members.length} paid</Text>
                      </View>
                      <View className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <View
                          className="h-full bg-emerald-500 rounded-full"
                          style={{ width: `${(paidCount / circle.members.length) * 100}%` }}
                        />
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
              );
            })
          )}
        </View>

        {/* How It Works */}
        <View className="px-4 pb-8">
          <Text className="text-lg font-bold text-gray-900 mb-3">How It Works</Text>
          <View className="bg-white rounded-2xl p-4">
            {[
              { step: 1, title: 'Join or Create', desc: 'Find a circle or start your own with trusted members', icon: Users },
              { step: 2, title: 'Contribute Regularly', desc: 'Pay via card, cash, or mobile money each cycle', icon: CreditCard },
              { step: 3, title: 'Track Payments', desc: 'Organizers confirm payments for accountability', icon: CheckCircle },
              { step: 4, title: 'Receive Payout', desc: 'When it\'s your turn, receive the full pooled amount', icon: CircleDollarSign },
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
          <CircleDetailModal
            circle={selectedCircle}
            contributions={allContributions.filter(c => c.circleId === selectedCircle.id)}
            onClose={() => setSelectedCircle(null)}
          />
        )}
      </Modal>

      {/* Create Modal */}
      <Modal visible={showCreateModal} animationType="slide" presentationStyle="pageSheet">
        <CreateSusuModal onClose={() => setShowCreateModal(false)} onSubmit={addSusuCircle} />
      </Modal>
    </SafeAreaView>
  );
}

type TabType = 'overview' | 'contributions' | 'members' | 'history' | 'invite';

function CircleDetailModal({ circle, contributions, onClose }: {
  circle: SusuCircle;
  contributions: SusuContribution[];
  onClose: () => void;
}) {
  const currentUser = useStore((s) => s.currentUser);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState<SusuContribution | null>(null);

  const { confirmSusuContribution, addSusuContribution, updateSusuContribution } = useAdvancedFeatures();

  const isOrganizer = circle.creatorId === (currentUser?.id ?? 'guest');
  const currentRoundContributions = contributions.filter(c => c.round === circle.currentRound);
  const paidCount = currentRoundContributions.filter(c => c.status === 'paid' || c.status === 'confirmed').length;
  const pendingCount = currentRoundContributions.filter(c => c.status === 'pending').length;
  const lateCount = currentRoundContributions.filter(c => c.status === 'late').length;
  const canInvite = circle.members.length < (circle.maxMembers ?? 12);

  const tabs: { id: TabType; label: string; showAlways?: boolean }[] = [
    { id: 'overview', label: 'Overview', showAlways: true },
    { id: 'contributions', label: 'Payments', showAlways: true },
    { id: 'members', label: 'Members', showAlways: true },
    { id: 'invite', label: 'Invite', showAlways: false },
    { id: 'history', label: 'History', showAlways: true },
  ];

  const visibleTabs = tabs.filter(t => t.showAlways || isOrganizer);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FAF7F2' }}>
      <View className="flex-row items-center justify-between p-4 border-b border-gray-200 bg-white">
        <Pressable onPress={onClose}>
          <X size={24} color="#6B7280" />
        </Pressable>
        <View className="flex-1 items-center">
          <Text className="text-lg font-bold text-gray-900" numberOfLines={1}>{circle.name}</Text>
          <View className="flex-row items-center mt-0.5">
            {circle.isPrivate ? (
              <Lock size={12} color="#6B7280" />
            ) : (
              <Globe size={12} color="#6B7280" />
            )}
            <Text className="text-gray-500 text-xs ml-1">{circle.isPrivate ? 'Private' : 'Public'}</Text>
          </View>
        </View>
        {isOrganizer && (
          <View className="bg-amber-100 px-2 py-1 rounded-full">
            <Text className="text-amber-700 text-xs font-medium">Organizer</Text>
          </View>
        )}
        {!isOrganizer && <View style={{ width: 60 }} />}
      </View>

      {/* Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="bg-white border-b border-gray-100" style={{ flexGrow: 0 }}>
        <View className="flex-row">
          {visibleTabs.map((tab) => (
            <Pressable
              key={tab.id}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setActiveTab(tab.id);
              }}
              className={`px-5 py-3 ${activeTab === tab.id ? 'border-b-2 border-emerald-700' : ''}`}
            >
              <Text className={`text-sm font-medium ${activeTab === tab.id ? 'text-emerald-700' : 'text-gray-500'}`}>
                {tab.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      <ScrollView className="flex-1">
        {activeTab === 'overview' && (
          <OverviewTab circle={circle} paidCount={paidCount} pendingCount={pendingCount} lateCount={lateCount} />
        )}
        {activeTab === 'contributions' && (
          <ContributionsTab
            circle={circle}
            contributions={currentRoundContributions}
            isOrganizer={isOrganizer}
            onConfirm={(contribution) => setShowConfirmModal(contribution)}
          />
        )}
        {activeTab === 'members' && (
          <MembersTab circle={circle} contributions={contributions} />
        )}
        {activeTab === 'invite' && (
          <InviteTab circle={circle} canInvite={canInvite} />
        )}
        {activeTab === 'history' && (
          <HistoryTab circle={circle} contributions={contributions} />
        )}
      </ScrollView>

      {/* Action Button */}
      <View className="p-4 bg-white border-t border-gray-100">
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            setShowPaymentModal(true);
          }}
          className="bg-emerald-800 py-4 rounded-2xl"
        >
          <Text className="text-white font-bold text-center text-lg">Make Contribution</Text>
        </Pressable>
      </View>

      {/* Payment Modal */}
      <Modal visible={showPaymentModal} animationType="slide" presentationStyle="pageSheet">
        <PaymentModal
          circle={circle}
          onClose={() => setShowPaymentModal(false)}
          onSubmit={(method, notes) => {
            const contribution: SusuContribution = {
              id: uuidv4(),
              circleId: circle.id,
              memberId: currentUser?.id ?? 'guest',
              memberName: currentUser?.name ?? 'Guest',
              memberAvatar: currentUser?.avatar,
              round: circle.currentRound,
              amount: circle.contributionAmount,
              status: method === 'card' ? 'paid' : 'pending',
              paymentMethod: method,
              dueDate: circle.nextPayoutDate,
              paidAt: new Date().toISOString(),
              notes,
            };
            addSusuContribution(contribution);
            setShowPaymentModal(false);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }}
        />
      </Modal>

      {/* Confirm Payment Modal (for organizers) */}
      <Modal visible={!!showConfirmModal} animationType="fade" transparent>
        {showConfirmModal && (
          <View className="flex-1 bg-black/50 justify-center items-center p-4">
            <View className="bg-white rounded-2xl p-6 w-full max-w-sm">
              <Text className="text-lg font-bold text-gray-900 mb-2">Confirm Payment</Text>
              <Text className="text-gray-600 mb-4">
                Confirm that {showConfirmModal.memberName} has paid ${showConfirmModal.amount} via {showConfirmModal.paymentMethod.replace('_', ' ')}?
              </Text>
              <View className="flex-row gap-3">
                <Pressable
                  onPress={() => setShowConfirmModal(null)}
                  className="flex-1 py-3 rounded-xl bg-gray-100"
                >
                  <Text className="text-gray-700 font-semibold text-center">Cancel</Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    confirmSusuContribution(showConfirmModal.id, currentUser?.id ?? 'guest');
                    setShowConfirmModal(null);
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                  }}
                  className="flex-1 py-3 rounded-xl bg-emerald-700"
                >
                  <Text className="text-white font-semibold text-center">Confirm</Text>
                </Pressable>
              </View>
            </View>
          </View>
        )}
      </Modal>
    </SafeAreaView>
  );
}

function OverviewTab({ circle, paidCount, pendingCount, lateCount }: {
  circle: SusuCircle;
  paidCount: number;
  pendingCount: number;
  lateCount: number;
}) {
  const nextRecipient = circle.members.find(m => m.userId === circle.nextPayoutRecipientId);

  return (
    <View className="p-4">
      {/* Header Stats */}
      <View className="bg-emerald-800 rounded-2xl p-6 mb-4">
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

      {/* Payment Status Cards */}
      <View className="flex-row gap-3 mb-4">
        <View className="flex-1 bg-green-50 rounded-xl p-4">
          <View className="flex-row items-center mb-1">
            <CheckCircle size={16} color="#16A34A" />
            <Text className="text-green-700 font-bold text-xl ml-2">{paidCount}</Text>
          </View>
          <Text className="text-green-600 text-xs">Confirmed</Text>
        </View>
        <View className="flex-1 bg-amber-50 rounded-xl p-4">
          <View className="flex-row items-center mb-1">
            <Clock size={16} color="#D97706" />
            <Text className="text-amber-700 font-bold text-xl ml-2">{pendingCount}</Text>
          </View>
          <Text className="text-amber-600 text-xs">Pending</Text>
        </View>
        <View className="flex-1 bg-red-50 rounded-xl p-4">
          <View className="flex-row items-center mb-1">
            <AlertTriangle size={16} color="#DC2626" />
            <Text className="text-red-700 font-bold text-xl ml-2">{lateCount}</Text>
          </View>
          <Text className="text-red-600 text-xs">Late</Text>
        </View>
      </View>

      {/* Next Payout */}
      <View className="bg-amber-50 rounded-2xl p-4 mb-4">
        <View className="flex-row items-center mb-3">
          <Calendar size={20} color="#D4673A" />
          <Text className="text-amber-800 font-bold ml-2">Next Payout</Text>
        </View>
        <Text className="text-amber-700 text-lg font-semibold">
          {new Date(circle.nextPayoutDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </Text>
        {nextRecipient && (
          <View className="flex-row items-center mt-3 bg-white rounded-xl p-3">
            <Image source={{ uri: nextRecipient.userAvatar }} className="w-10 h-10 rounded-full" />
            <View className="ml-3">
              <Text className="text-gray-500 text-xs">Recipient</Text>
              <Text className="text-gray-900 font-semibold">{nextRecipient.userName}</Text>
            </View>
            <View className="ml-auto">
              <Text className="text-emerald-700 font-bold text-lg">${circle.contributionAmount * circle.members.length}</Text>
            </View>
          </View>
        )}
      </View>

      {/* Rules */}
      <View className="bg-white rounded-2xl p-4">
        <View className="flex-row items-center mb-3">
          <FileText size={20} color="#1B4D3E" />
          <Text className="text-gray-900 font-bold ml-2">Circle Rules</Text>
        </View>
        <Text className="text-gray-700">{circle.rules}</Text>
      </View>
    </View>
  );
}

function ContributionsTab({ circle, contributions, isOrganizer, onConfirm }: {
  circle: SusuCircle;
  contributions: SusuContribution[];
  isOrganizer: boolean;
  onConfirm: (contribution: SusuContribution) => void;
}) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return { bg: 'bg-green-100', text: 'text-green-700' };
      case 'paid': return { bg: 'bg-blue-100', text: 'text-blue-700' };
      case 'pending': return { bg: 'bg-amber-100', text: 'text-amber-700' };
      case 'late': return { bg: 'bg-red-100', text: 'text-red-700' };
      default: return { bg: 'bg-gray-100', text: 'text-gray-700' };
    }
  };

  const getPaymentIcon = (method: string) => {
    switch (method) {
      case 'card': return CreditCard;
      case 'cash': return Banknote;
      case 'bank_transfer': return Building2;
      case 'mobile_money': return Smartphone;
      default: return DollarSign;
    }
  };

  return (
    <View className="p-4">
      <Text className="text-lg font-bold text-gray-900 mb-1">Round {circle.currentRound} Payments</Text>
      <Text className="text-gray-500 text-sm mb-4">Due: {new Date(circle.nextPayoutDate).toLocaleDateString()}</Text>

      {circle.members.map((member, index) => {
        const contribution = contributions.find(c => c.memberId === member.userId);
        const status = contribution?.status ?? 'pending';
        const colors = getStatusColor(status);
        const PaymentIcon = getPaymentIcon(contribution?.paymentMethod ?? 'cash');

        return (
          <Animated.View key={member.userId} entering={FadeInDown.delay(index * 50)}>
            <View className="bg-white rounded-xl p-4 mb-3">
              <View className="flex-row items-center">
                <Image source={{ uri: member.userAvatar }} className="w-12 h-12 rounded-full" />
                <View className="ml-3 flex-1">
                  <Text className="text-gray-900 font-semibold">{member.userName}</Text>
                  <View className="flex-row items-center mt-1">
                    <PaymentIcon size={12} color="#6B7280" />
                    <Text className="text-gray-500 text-xs ml-1 capitalize">
                      {contribution?.paymentMethod?.replace('_', ' ') ?? 'Not paid'}
                    </Text>
                  </View>
                </View>
                <View className="items-end">
                  <Text className="text-gray-900 font-bold">${circle.contributionAmount}</Text>
                  <View className={`${colors.bg} px-2 py-0.5 rounded-full mt-1`}>
                    <Text className={`${colors.text} text-xs font-medium capitalize`}>{status}</Text>
                  </View>
                </View>
              </View>

              {/* Organizer Actions */}
              {isOrganizer && contribution && status === 'paid' && (
                <Pressable
                  onPress={() => onConfirm(contribution)}
                  className="mt-3 bg-emerald-50 py-2 rounded-lg flex-row items-center justify-center"
                >
                  <UserCheck size={16} color="#059669" />
                  <Text className="text-emerald-700 font-semibold ml-2">Confirm Payment</Text>
                </Pressable>
              )}

              {/* Payment Details */}
              {contribution?.paidAt && (
                <View className="mt-3 pt-3 border-t border-gray-100">
                  <View className="flex-row justify-between">
                    <Text className="text-gray-500 text-xs">Paid</Text>
                    <Text className="text-gray-700 text-xs">{new Date(contribution.paidAt).toLocaleDateString()}</Text>
                  </View>
                  {contribution.confirmedAt && (
                    <View className="flex-row justify-between mt-1">
                      <Text className="text-gray-500 text-xs">Confirmed</Text>
                      <Text className="text-green-600 text-xs flex-row items-center">
                        <Check size={10} color="#16A34A" /> {new Date(contribution.confirmedAt).toLocaleDateString()}
                      </Text>
                    </View>
                  )}
                </View>
              )}
            </View>
          </Animated.View>
        );
      })}
    </View>
  );
}

function MembersTab({ circle, contributions }: {
  circle: SusuCircle;
  contributions: SusuContribution[];
}) {
  return (
    <View className="p-4">
      <Text className="text-lg font-bold text-gray-900 mb-4">Members ({circle.members.length})</Text>

      {circle.members.map((member, index) => {
        const memberContributions = contributions.filter(c => c.memberId === member.userId);
        const confirmedPayments = memberContributions.filter(c => c.status === 'confirmed').length;
        const totalPaid = memberContributions.reduce((sum, c) => sum + (c.status === 'confirmed' || c.status === 'paid' ? c.amount : 0), 0);

        return (
          <Animated.View key={member.userId} entering={FadeInDown.delay(index * 50)}>
            <View className="bg-white rounded-xl p-4 mb-3">
              <View className="flex-row items-center">
                <Text className="text-gray-400 font-bold w-8 text-center">{member.position}</Text>
                <Image source={{ uri: member.userAvatar }} className="w-12 h-12 rounded-full" />
                <View className="ml-3 flex-1">
                  <View className="flex-row items-center">
                    <Text className="text-gray-900 font-semibold">{member.userName}</Text>
                    {member.hasReceivedPayout && (
                      <View className="ml-2 bg-green-100 p-1 rounded-full">
                        <CheckCircle size={12} color="#16A34A" />
                      </View>
                    )}
                  </View>
                  <View className="flex-row items-center mt-1">
                    <View className="flex-row items-center bg-emerald-50 px-2 py-0.5 rounded-full">
                      <Shield size={10} color="#059669" />
                      <Text className="text-emerald-700 text-xs ml-1">{member.trustScore}</Text>
                    </View>
                    <Text className="text-gray-400 text-xs ml-2">Trust Score</Text>
                  </View>
                </View>
              </View>

              {/* Member Stats */}
              <View className="flex-row mt-4 pt-3 border-t border-gray-100">
                <View className="flex-1">
                  <Text className="text-gray-500 text-xs">Total Contributed</Text>
                  <Text className="text-gray-900 font-semibold">${member.totalContributed}</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-gray-500 text-xs">Confirmed Payments</Text>
                  <Text className="text-gray-900 font-semibold">{confirmedPayments}</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-gray-500 text-xs">Missed</Text>
                  <Text className={`font-semibold ${member.missedContributions > 0 ? 'text-red-600' : 'text-gray-900'}`}>
                    {member.missedContributions}
                  </Text>
                </View>
              </View>

              {member.hasReceivedPayout && (
                <View className="mt-3 bg-green-50 rounded-lg p-2 flex-row items-center justify-center">
                  <CheckCircle size={14} color="#16A34A" />
                  <Text className="text-green-700 text-sm font-medium ml-2">Received Payout</Text>
                </View>
              )}
            </View>
          </Animated.View>
        );
      })}
    </View>
  );
}

function HistoryTab({ circle, contributions }: {
  circle: SusuCircle;
  contributions: SusuContribution[];
}) {
  const groupedByRound = useMemo(() => {
    const grouped: { [round: number]: SusuContribution[] } = {};
    contributions.forEach(c => {
      if (!grouped[c.round]) grouped[c.round] = [];
      grouped[c.round].push(c);
    });
    return Object.entries(grouped)
      .sort(([a], [b]) => Number(b) - Number(a))
      .map(([round, contribs]) => ({ round: Number(round), contributions: contribs }));
  }, [contributions]);

  return (
    <View className="p-4">
      <Text className="text-lg font-bold text-gray-900 mb-4">Payment History</Text>

      {groupedByRound.length === 0 ? (
        <View className="bg-white rounded-2xl p-8 items-center">
          <History size={48} color="#D4673A" />
          <Text className="text-gray-900 font-semibold text-lg mt-4">No history yet</Text>
          <Text className="text-gray-500 text-center mt-2">
            Payment history will appear here as contributions are made
          </Text>
        </View>
      ) : (
        groupedByRound.map(({ round, contributions: roundContribs }) => {
          const totalCollected = roundContribs
            .filter(c => c.status === 'confirmed' || c.status === 'paid')
            .reduce((sum, c) => sum + c.amount, 0);
          const recipient = circle.members.find(m => m.position === round);

          return (
            <View key={round} className="bg-white rounded-xl p-4 mb-4">
              <View className="flex-row items-center justify-between mb-3">
                <View>
                  <Text className="text-gray-900 font-bold">Round {round}</Text>
                  {recipient && (
                    <Text className="text-gray-500 text-sm">Payout to {recipient.userName}</Text>
                  )}
                </View>
                <View className="items-end">
                  <Text className="text-emerald-700 font-bold">${totalCollected}</Text>
                  <Text className="text-gray-400 text-xs">collected</Text>
                </View>
              </View>

              <View className="border-t border-gray-100 pt-3">
                {roundContribs.map((contrib, idx) => (
                  <View key={contrib.id} className={`flex-row items-center py-2 ${idx < roundContribs.length - 1 ? 'border-b border-gray-50' : ''}`}>
                    <Image source={{ uri: contrib.memberAvatar }} className="w-8 h-8 rounded-full" />
                    <Text className="text-gray-700 ml-2 flex-1">{contrib.memberName}</Text>
                    <Text className="text-gray-500 text-sm mr-2">${contrib.amount}</Text>
                    {contrib.status === 'confirmed' ? (
                      <CheckCircle size={16} color="#16A34A" />
                    ) : contrib.status === 'paid' ? (
                      <Clock size={16} color="#3B82F6" />
                    ) : (
                      <AlertCircle size={16} color="#EF4444" />
                    )}
                  </View>
                ))}
              </View>
            </View>
          );
        })
      )}
    </View>
  );
}

function InviteTab({ circle, canInvite }: { circle: SusuCircle; canInvite: boolean }) {
  const currentUser = useStore((s) => s.currentUser);
  const [inviteMethod, setInviteMethod] = useState<'link' | 'contact'>('link');
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [copied, setCopied] = useState(false);

  const inviteCode = circle.inviteCode ?? 'INVITE';
  const maxMembers = circle.maxMembers ?? 12;
  const inviteLink = `diaspora://susu/join/${circle.id}?code=${inviteCode}`;

  const handleCopyLink = async () => {
    await Clipboard.setStringAsync(inviteLink);
    setCopied(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareLink = async () => {
    try {
      await Share.share({
        message: `Join my Susu savings circle "${circle.name}" on Diaspora!\n\nContribution: $${circle.contributionAmount} ${circle.frequency}\nMembers: ${circle.members.length}/${maxMembers}\n\nUse invite code: ${inviteCode}\n\nOr tap this link: ${inviteLink}`,
        title: `Join ${circle.name} Susu Circle`,
      });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (error) {
      console.log('Share error:', error);
    }
  };

  const handleSendInvite = () => {
    if (!contactName.trim()) return;

    // In a real app, this would send an SMS/email invitation
    Alert.alert(
      'Invitation Sent',
      `An invitation has been sent to ${contactName}${contactPhone ? ` at ${contactPhone}` : ''}${contactEmail ? ` (${contactEmail})` : ''}.`,
      [{ text: 'OK' }]
    );
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setContactName('');
    setContactPhone('');
    setContactEmail('');
  };

  return (
    <View className="p-4">
      {/* Invite Status */}
      <View className="bg-white rounded-2xl p-4 mb-4">
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-gray-900 font-bold text-lg">Member Slots</Text>
          <View className={`px-3 py-1 rounded-full ${canInvite ? 'bg-green-100' : 'bg-red-100'}`}>
            <Text className={`text-sm font-medium ${canInvite ? 'text-green-700' : 'text-red-700'}`}>
              {circle.members.length}/{maxMembers}
            </Text>
          </View>
        </View>
        <View className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <View
            className="h-full bg-emerald-500 rounded-full"
            style={{ width: `${(circle.members.length / maxMembers) * 100}%` }}
          />
        </View>
        {!canInvite && (
          <Text className="text-red-600 text-sm mt-2">Circle is full. No more members can join.</Text>
        )}
      </View>

      {canInvite && (
        <>
          {/* Invite Code */}
          <View className="bg-emerald-800 rounded-2xl p-4 mb-4">
            <Text className="text-white/70 text-sm mb-1">Invite Code</Text>
            <View className="flex-row items-center justify-between">
              <Text className="text-white font-bold text-3xl tracking-widest">{inviteCode}</Text>
              <Pressable
                onPress={handleCopyLink}
                className="bg-white/20 px-4 py-2 rounded-full flex-row items-center"
              >
                {copied ? (
                  <>
                    <Check size={16} color="white" />
                    <Text className="text-white font-medium ml-2">Copied!</Text>
                  </>
                ) : (
                  <>
                    <Copy size={16} color="white" />
                    <Text className="text-white font-medium ml-2">Copy Link</Text>
                  </>
                )}
              </Pressable>
            </View>
          </View>

          {/* Share Button */}
          <Pressable
            onPress={handleShareLink}
            className="bg-white rounded-xl p-4 mb-4 flex-row items-center"
          >
            <View className="w-12 h-12 rounded-full bg-blue-100 items-center justify-center">
              <Send size={24} color="#3B82F6" />
            </View>
            <View className="ml-4 flex-1">
              <Text className="text-gray-900 font-semibold">Share Invite Link</Text>
              <Text className="text-gray-500 text-sm">Send via WhatsApp, SMS, or any app</Text>
            </View>
            <ChevronRight size={20} color="#9CA3AF" />
          </Pressable>

          {/* Invite Method Tabs */}
          <View className="flex-row mb-4">
            <Pressable
              onPress={() => setInviteMethod('link')}
              className={`flex-1 py-3 rounded-l-xl ${inviteMethod === 'link' ? 'bg-emerald-800' : 'bg-white'}`}
            >
              <Text className={`text-center font-medium ${inviteMethod === 'link' ? 'text-white' : 'text-gray-700'}`}>
                Share Link
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setInviteMethod('contact')}
              className={`flex-1 py-3 rounded-r-xl ${inviteMethod === 'contact' ? 'bg-emerald-800' : 'bg-white'}`}
            >
              <Text className={`text-center font-medium ${inviteMethod === 'contact' ? 'text-white' : 'text-gray-700'}`}>
                Invite by Contact
              </Text>
            </Pressable>
          </View>

          {inviteMethod === 'contact' && (
            <View className="bg-white rounded-2xl p-4">
              <Text className="text-gray-900 font-semibold mb-4">Send Direct Invitation</Text>

              <Text className="text-gray-700 font-medium mb-2">Name *</Text>
              <TextInput
                value={contactName}
                onChangeText={setContactName}
                placeholder="Enter their name"
                className="bg-gray-50 p-4 rounded-xl text-gray-900 mb-4"
              />

              <Text className="text-gray-700 font-medium mb-2">Phone Number</Text>
              <View className="flex-row items-center bg-gray-50 rounded-xl mb-4">
                <View className="p-4">
                  <Phone size={20} color="#6B7280" />
                </View>
                <TextInput
                  value={contactPhone}
                  onChangeText={setContactPhone}
                  placeholder="Enter phone number"
                  keyboardType="phone-pad"
                  className="flex-1 p-4 text-gray-900"
                />
              </View>

              <Text className="text-gray-700 font-medium mb-2">Email</Text>
              <View className="flex-row items-center bg-gray-50 rounded-xl mb-4">
                <View className="p-4">
                  <Mail size={20} color="#6B7280" />
                </View>
                <TextInput
                  value={contactEmail}
                  onChangeText={setContactEmail}
                  placeholder="Enter email address"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  className="flex-1 p-4 text-gray-900"
                />
              </View>

              <Pressable
                onPress={handleSendInvite}
                disabled={!contactName.trim()}
                className={`py-4 rounded-xl flex-row items-center justify-center ${contactName.trim() ? 'bg-emerald-800' : 'bg-gray-200'}`}
              >
                <UserPlus size={20} color={contactName.trim() ? 'white' : '#9CA3AF'} />
                <Text className={`font-bold ml-2 ${contactName.trim() ? 'text-white' : 'text-gray-400'}`}>
                  Send Invitation
                </Text>
              </Pressable>
            </View>
          )}

          {inviteMethod === 'link' && (
            <View className="bg-amber-50 rounded-xl p-4">
              <View className="flex-row items-center mb-2">
                <AlertCircle size={18} color="#D4673A" />
                <Text className="text-amber-800 font-medium ml-2">How it works</Text>
              </View>
              <Text className="text-amber-700 text-sm">
                Share the invite link or code with people you trust. They can join the circle using the Diaspora app. Once they join, they'll appear in the Members tab and be assigned a payout position.
              </Text>
            </View>
          )}
        </>
      )}

      {/* Pending Invites */}
      {(circle.pendingInvites?.length ?? 0) > 0 && (
        <View className="mt-4">
          <Text className="text-gray-900 font-bold mb-3">Pending Invitations ({circle.pendingInvites?.length ?? 0})</Text>
          {circle.pendingInvites?.map((invite) => (
            <View key={invite.id} className="bg-white rounded-xl p-4 mb-2 flex-row items-center">
              <View className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center">
                <UserPlus size={20} color="#6B7280" />
              </View>
              <View className="ml-3 flex-1">
                <Text className="text-gray-900 font-medium">{invite.invitedUserName || 'Pending'}</Text>
                <Text className="text-gray-500 text-xs">
                  Invited {new Date(invite.createdAt).toLocaleDateString()}
                </Text>
              </View>
              <View className="bg-amber-100 px-2 py-1 rounded-full">
                <Text className="text-amber-700 text-xs font-medium">Pending</Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

function PaymentModal({ circle, onClose, onSubmit }: {
  circle: SusuCircle;
  onClose: () => void;
  onSubmit: (method: SusuContribution['paymentMethod'], notes?: string) => void;
}) {
  const [selectedMethod, setSelectedMethod] = useState<SusuContribution['paymentMethod']>('card');
  const [notes, setNotes] = useState('');

  const paymentMethods: { id: SusuContribution['paymentMethod']; label: string; icon: typeof CreditCard; desc: string }[] = [
    { id: 'card', label: 'Debit/Credit Card', icon: CreditCard, desc: 'Instant payment' },
    { id: 'bank_transfer', label: 'Bank Transfer', icon: Building2, desc: 'Manual verification' },
    { id: 'mobile_money', label: 'Mobile Money', icon: Smartphone, desc: 'M-Pesa, Venmo, etc.' },
    { id: 'cash', label: 'Cash', icon: Banknote, desc: 'Organizer confirms' },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FAF7F2' }}>
      <View className="flex-row items-center justify-between p-4 border-b border-gray-200 bg-white">
        <Pressable onPress={onClose}>
          <X size={24} color="#6B7280" />
        </Pressable>
        <Text className="text-lg font-bold text-gray-900">Make Contribution</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView className="flex-1 p-4">
        {/* Amount */}
        <View className="bg-emerald-800 rounded-2xl p-6 items-center mb-6">
          <Text className="text-white/70 text-sm">Contribution Amount</Text>
          <Text className="text-white font-bold text-4xl mt-1">${circle.contributionAmount}</Text>
          <Text className="text-white/70 text-sm mt-2">Round {circle.currentRound} of {circle.totalRounds}</Text>
        </View>

        {/* Payment Method */}
        <Text className="text-gray-700 font-semibold mb-3">Select Payment Method</Text>
        {paymentMethods.map((method) => {
          const Icon = method.icon;
          const isSelected = selectedMethod === method.id;

          return (
            <Pressable
              key={method.id}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setSelectedMethod(method.id);
              }}
              className={`flex-row items-center p-4 rounded-xl mb-3 border-2 ${
                isSelected ? 'bg-emerald-50 border-emerald-500' : 'bg-white border-transparent'
              }`}
            >
              <View className={`w-12 h-12 rounded-full items-center justify-center ${isSelected ? 'bg-emerald-100' : 'bg-gray-100'}`}>
                <Icon size={24} color={isSelected ? '#059669' : '#6B7280'} />
              </View>
              <View className="ml-3 flex-1">
                <Text className={`font-semibold ${isSelected ? 'text-emerald-700' : 'text-gray-900'}`}>{method.label}</Text>
                <Text className="text-gray-500 text-sm">{method.desc}</Text>
              </View>
              {isSelected && (
                <CheckCircle size={24} color="#059669" />
              )}
            </Pressable>
          );
        })}

        {/* Notes */}
        <Text className="text-gray-700 font-semibold mb-2 mt-4">Notes (Optional)</Text>
        <TextInput
          value={notes}
          onChangeText={setNotes}
          placeholder="Add a note for the organizer..."
          className="bg-white p-4 rounded-xl text-gray-900"
          multiline
          numberOfLines={3}
        />

        {/* External Payment Disclaimer */}
        <View className="bg-amber-50 rounded-xl p-4 mt-4 flex-row items-start">
          <AlertTriangle size={20} color="#D97706" />
          <Text className="text-amber-700 text-sm ml-3 flex-1">
            {selectedMethod === 'cash'
              ? 'For cash payments, please hand the money directly to the circle organizer. They will confirm your payment once received.'
              : 'This app does not process payments. Please complete your payment outside the app using your selected method, then mark it here for tracking purposes.'}
          </Text>
        </View>
      </ScrollView>

      <View className="p-4 bg-white border-t border-gray-100">
        <Pressable
          onPress={() => onSubmit(selectedMethod, notes || undefined)}
          className="bg-emerald-800 py-4 rounded-2xl flex-row items-center justify-center"
        >
          <Send size={20} color="white" />
          <Text className="text-white font-bold text-lg ml-2">
            {selectedMethod === 'card' ? 'Pay Now' : 'Submit Payment'}
          </Text>
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
  const [isPrivate, setIsPrivate] = useState(false);
  const [maxMembers, setMaxMembers] = useState('12');

  const generateInviteCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

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
      totalRounds: parseInt(maxMembers) || 12,
      payoutOrder: [currentUser?.id ?? 'guest'],
      nextPayoutDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      nextPayoutRecipientId: currentUser?.id ?? 'guest',
      status: 'forming',
      rules: 'Contributions due by the scheduled date. Late fees may apply.',
      contributions: [],
      createdAt: new Date().toISOString(),
      isPrivate,
      inviteCode: generateInviteCode(),
      pendingInvites: [],
      maxMembers: parseInt(maxMembers) || 12,
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

        <Text className="text-gray-700 font-medium mb-2">Maximum Members</Text>
        <TextInput
          value={maxMembers}
          onChangeText={setMaxMembers}
          placeholder="12"
          keyboardType="numeric"
          className="bg-white p-4 rounded-xl text-gray-900 mb-4"
        />

        {/* Privacy Toggle */}
        <View className="bg-white rounded-xl p-4 mb-4">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center flex-1">
              <View className="w-10 h-10 rounded-full bg-emerald-100 items-center justify-center">
                {isPrivate ? <EyeOff size={20} color="#1B4D3E" /> : <Eye size={20} color="#1B4D3E" />}
              </View>
              <View className="ml-3 flex-1">
                <Text className="text-gray-900 font-semibold">Private Circle</Text>
                <Text className="text-gray-500 text-sm">
                  {isPrivate ? 'Only invited members can see and join' : 'Anyone can find and request to join'}
                </Text>
              </View>
            </View>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setIsPrivate(!isPrivate);
              }}
              className={`w-12 h-7 rounded-full p-0.5 ${isPrivate ? 'bg-emerald-600' : 'bg-gray-300'}`}
            >
              <Animated.View
                className={`w-6 h-6 rounded-full bg-white shadow-sm ${isPrivate ? 'self-end' : 'self-start'}`}
              />
            </Pressable>
          </View>
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
