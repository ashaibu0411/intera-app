import { useState } from 'react';
import { View, Text, ScrollView, Pressable, Image, TextInput, Modal } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Vote, Megaphone, Heart, Users, AlertTriangle, Plus, CheckCircle, Clock, TrendingUp, X, ChevronRight } from 'lucide-react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useStore } from '@/lib/store';
import { useAdvancedFeatures, type Poll, type CommunityProject, type EmergencyBroadcast } from '@/lib/advancedFeatures';
import * as Haptics from 'expo-haptics';
import { v4 as uuidv4 } from 'uuid';

const TABS = ['Polls', 'Projects', 'Emergency', 'Ask'];

// Mock data for demonstration
const MOCK_POLLS: Poll[] = [
  {
    id: '1',
    communityId: '1',
    creatorId: '1',
    creatorName: 'Amara Johnson',
    creatorAvatar: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=100',
    title: 'Should we organize a monthly community cleanup?',
    description: 'Proposing to start a monthly neighborhood cleanup day every first Saturday.',
    options: [
      { id: '1', text: 'Yes, great idea!', votes: 45, voterIds: [] },
      { id: '2', text: 'Maybe, need more details', votes: 12, voterIds: [] },
      { id: '3', text: 'No, not interested', votes: 3, voterIds: [] },
    ],
    category: 'community',
    status: 'active',
    totalVotes: 60,
    startDate: '2025-01-01',
    endDate: '2025-01-15',
    isAnonymous: false,
    createdAt: '2025-01-01',
  },
  {
    id: '2',
    communityId: '1',
    creatorId: '2',
    creatorName: 'Kwame Asante',
    creatorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
    title: 'Best day for African Food Festival?',
    description: 'We\'re planning a community food festival. Which day works best?',
    options: [
      { id: '1', text: 'Saturday, Feb 15', votes: 78, voterIds: [] },
      { id: '2', text: 'Sunday, Feb 16', votes: 52, voterIds: [] },
      { id: '3', text: 'Saturday, Feb 22', votes: 34, voterIds: [] },
    ],
    category: 'events',
    status: 'active',
    totalVotes: 164,
    startDate: '2025-01-05',
    endDate: '2025-01-20',
    isAnonymous: false,
    createdAt: '2025-01-05',
  },
];

const MOCK_PROJECTS: CommunityProject[] = [
  {
    id: '1',
    communityId: '1',
    creatorId: '1',
    title: 'Community Garden Project',
    description: 'Building a shared garden space where community members can grow African vegetables and herbs together.',
    category: 'infrastructure',
    goalAmount: 5000,
    currentAmount: 3250,
    currency: 'USD',
    contributors: [],
    status: 'fundraising',
    targetDate: '2025-03-01',
    updates: [],
    images: ['https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400'],
    createdAt: '2025-01-01',
  },
  {
    id: '2',
    communityId: '1',
    creatorId: '2',
    title: 'Youth Scholarship Fund',
    description: 'Raising funds to provide scholarships for African youth pursuing higher education.',
    category: 'education',
    goalAmount: 10000,
    currentAmount: 7800,
    currency: 'USD',
    contributors: [],
    status: 'fundraising',
    targetDate: '2025-06-01',
    updates: [],
    images: ['https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=400'],
    createdAt: '2025-01-01',
  },
];

const MOCK_BROADCASTS: EmergencyBroadcast[] = [
  {
    id: '1',
    communityId: '1',
    senderId: '1',
    senderName: 'Community Watch',
    type: 'safety',
    title: 'Package Theft Alert',
    message: 'Multiple reports of package thefts on Oak Street. Please collect packages promptly.',
    severity: 'medium',
    location: 'Oak Street area',
    isResolved: false,
    responses: [],
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

export default function VillageCouncilScreen() {
  const router = useRouter();
  const currentUser = useStore((s) => s.currentUser);
  const [activeTab, setActiveTab] = useState('Polls');
  const [showCreatePoll, setShowCreatePoll] = useState(false);
  const [votedPolls, setVotedPolls] = useState<{ [pollId: string]: string }>({});

  const { polls, communityProjects, emergencyBroadcasts, askNeighborhood, addPoll, votePoll } = useAdvancedFeatures();

  const allPolls = [...polls, ...MOCK_POLLS];
  const allProjects = [...communityProjects, ...MOCK_PROJECTS];
  const allBroadcasts = [...emergencyBroadcasts, ...MOCK_BROADCASTS];

  const handleVote = (pollId: string, optionId: string) => {
    if (votedPolls[pollId]) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setVotedPolls({ ...votedPolls, [pollId]: optionId });
    votePoll(pollId, optionId, currentUser?.id ?? 'guest');
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return '#DC2626';
      case 'high': return '#EA580C';
      case 'medium': return '#CA8A04';
      default: return '#16A34A';
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FAF7F2' }} edges={['top']}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Village Council',
          headerStyle: { backgroundColor: '#FAF7F2' },
          headerTintColor: '#1B4D3E',
          headerRight: () => (
            <Pressable
              onPress={() => setShowCreatePoll(true)}
              className="mr-2 bg-amber-100 p-2 rounded-full"
            >
              <Plus size={20} color="#D4673A" />
            </Pressable>
          ),
        }}
      />

      {/* Tabs */}
      <View className="flex-row px-4 py-3 border-b border-gray-100 bg-white">
        {TABS.map((tab) => (
          <Pressable
            key={tab}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setActiveTab(tab);
            }}
            className={`flex-1 py-2 rounded-lg mr-2 ${activeTab === tab ? 'bg-emerald-800' : 'bg-gray-100'}`}
          >
            <Text className={`text-center font-medium text-sm ${activeTab === tab ? 'text-white' : 'text-gray-600'}`}>
              {tab}
            </Text>
          </Pressable>
        ))}
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Polls Tab */}
        {activeTab === 'Polls' && (
          <View className="p-4">
            <View className="flex-row items-center mb-4">
              <Vote size={20} color="#1B4D3E" />
              <Text className="text-lg font-bold text-gray-900 ml-2">Active Polls</Text>
            </View>

            {allPolls.map((poll, index) => {
              const hasVoted = votedPolls[poll.id];
              return (
                <Animated.View
                  key={poll.id}
                  entering={FadeInDown.delay(index * 100)}
                  className="bg-white rounded-2xl p-4 mb-4 shadow-sm"
                >
                  <View className="flex-row items-center mb-3">
                    <Image source={{ uri: poll.creatorAvatar }} className="w-10 h-10 rounded-full" />
                    <View className="ml-3 flex-1">
                      <Text className="font-semibold text-gray-900">{poll.creatorName}</Text>
                      <Text className="text-gray-500 text-xs">
                        Ends {new Date(poll.endDate).toLocaleDateString()}
                      </Text>
                    </View>
                    <View className="bg-emerald-100 px-2 py-1 rounded-full">
                      <Text className="text-emerald-700 text-xs font-medium">{poll.totalVotes} votes</Text>
                    </View>
                  </View>

                  <Text className="text-gray-900 font-semibold text-base mb-2">{poll.title}</Text>
                  <Text className="text-gray-600 text-sm mb-4">{poll.description}</Text>

                  {poll.options.map((option) => {
                    const percentage = poll.totalVotes > 0 ? (option.votes / poll.totalVotes) * 100 : 0;
                    const isSelected = hasVoted === option.id;
                    return (
                      <Pressable
                        key={option.id}
                        onPress={() => handleVote(poll.id, option.id)}
                        disabled={!!hasVoted}
                        className={`mb-2 rounded-xl overflow-hidden ${isSelected ? 'border-2 border-emerald-500' : 'border border-gray-200'}`}
                      >
                        <View className="relative p-3">
                          {hasVoted && (
                            <View
                              className="absolute top-0 left-0 bottom-0 bg-emerald-50"
                              style={{ width: `${percentage}%` }}
                            />
                          )}
                          <View className="flex-row items-center justify-between relative">
                            <View className="flex-row items-center flex-1">
                              {isSelected && (
                                <CheckCircle size={18} color="#059669" style={{ marginRight: 8 }} />
                              )}
                              <Text className={`${isSelected ? 'text-emerald-700 font-semibold' : 'text-gray-700'}`}>
                                {option.text}
                              </Text>
                            </View>
                            {hasVoted && (
                              <Text className="text-gray-500 text-sm font-medium">
                                {percentage.toFixed(0)}%
                              </Text>
                            )}
                          </View>
                        </View>
                      </Pressable>
                    );
                  })}
                </Animated.View>
              );
            })}
          </View>
        )}

        {/* Projects Tab */}
        {activeTab === 'Projects' && (
          <View className="p-4">
            <View className="flex-row items-center mb-4">
              <Heart size={20} color="#1B4D3E" />
              <Text className="text-lg font-bold text-gray-900 ml-2">Community Projects</Text>
            </View>

            {allProjects.map((project, index) => {
              const progress = (project.currentAmount / project.goalAmount) * 100;
              return (
                <Animated.View
                  key={project.id}
                  entering={FadeInDown.delay(index * 100)}
                  className="bg-white rounded-2xl overflow-hidden mb-4 shadow-sm"
                >
                  {project.images[0] && (
                    <Image source={{ uri: project.images[0] }} className="w-full h-40" />
                  )}
                  <View className="p-4">
                    <View className="flex-row items-center mb-2">
                      <View className="bg-amber-100 px-2 py-1 rounded-full">
                        <Text className="text-amber-700 text-xs font-medium capitalize">{project.category}</Text>
                      </View>
                      <View className="flex-row items-center ml-auto">
                        <Users size={14} color="#6B7280" />
                        <Text className="text-gray-500 text-xs ml-1">{project.contributors.length} backers</Text>
                      </View>
                    </View>

                    <Text className="text-gray-900 font-bold text-lg mb-2">{project.title}</Text>
                    <Text className="text-gray-600 text-sm mb-4" numberOfLines={2}>{project.description}</Text>

                    <View className="mb-3">
                      <View className="flex-row justify-between mb-1">
                        <Text className="text-emerald-700 font-bold">
                          ${project.currentAmount.toLocaleString()}
                        </Text>
                        <Text className="text-gray-500 text-sm">
                          of ${project.goalAmount.toLocaleString()}
                        </Text>
                      </View>
                      <View className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <View
                          className="h-full bg-emerald-500 rounded-full"
                          style={{ width: `${Math.min(progress, 100)}%` }}
                        />
                      </View>
                    </View>

                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center">
                        <Clock size={14} color="#6B7280" />
                        <Text className="text-gray-500 text-sm ml-1">
                          Ends {new Date(project.targetDate).toLocaleDateString()}
                        </Text>
                      </View>
                      <Pressable
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                          router.push(`/contribute-project?id=${project.id}`);
                        }}
                        className="bg-emerald-800 px-4 py-2 rounded-full"
                      >
                        <Text className="text-white font-semibold text-sm">Contribute</Text>
                      </Pressable>
                    </View>
                  </View>
                </Animated.View>
              );
            })}
          </View>
        )}

        {/* Emergency Tab */}
        {activeTab === 'Emergency' && (
          <View className="p-4">
            <View className="flex-row items-center justify-between mb-4">
              <View className="flex-row items-center">
                <AlertTriangle size={20} color="#DC2626" />
                <Text className="text-lg font-bold text-gray-900 ml-2">Emergency Alerts</Text>
              </View>
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                  router.push('/create-emergency');
                }}
                className="bg-red-100 px-3 py-1.5 rounded-full"
              >
                <Text className="text-red-700 font-medium text-sm">Send Alert</Text>
              </Pressable>
            </View>

            {allBroadcasts.length === 0 ? (
              <View className="bg-white rounded-2xl p-8 items-center">
                <CheckCircle size={48} color="#16A34A" />
                <Text className="text-gray-900 font-semibold text-lg mt-4">All Clear</Text>
                <Text className="text-gray-500 text-center mt-2">
                  No active emergency alerts in your community
                </Text>
              </View>
            ) : (
              allBroadcasts.map((broadcast, index) => (
                <Animated.View
                  key={broadcast.id}
                  entering={FadeInDown.delay(index * 100)}
                  className="bg-white rounded-2xl p-4 mb-4 shadow-sm"
                  style={{ borderLeftWidth: 4, borderLeftColor: getSeverityColor(broadcast.severity) }}
                >
                  <View className="flex-row items-center justify-between mb-2">
                    <View
                      className="px-2 py-1 rounded-full"
                      style={{ backgroundColor: `${getSeverityColor(broadcast.severity)}20` }}
                    >
                      <Text style={{ color: getSeverityColor(broadcast.severity) }} className="text-xs font-bold uppercase">
                        {broadcast.severity}
                      </Text>
                    </View>
                    <Text className="text-gray-500 text-xs">
                      {new Date(broadcast.createdAt).toLocaleString()}
                    </Text>
                  </View>

                  <Text className="text-gray-900 font-bold text-lg mb-2">{broadcast.title}</Text>
                  <Text className="text-gray-700 mb-3">{broadcast.message}</Text>

                  {broadcast.location && (
                    <View className="flex-row items-center mb-3">
                      <Megaphone size={14} color="#6B7280" />
                      <Text className="text-gray-500 text-sm ml-1">{broadcast.location}</Text>
                    </View>
                  )}

                  <View className="flex-row">
                    <Pressable
                      onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)}
                      className="flex-1 bg-emerald-100 py-2 rounded-lg mr-2"
                    >
                      <Text className="text-emerald-700 font-semibold text-center">I Can Help</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
                      className="flex-1 bg-gray-100 py-2 rounded-lg"
                    >
                      <Text className="text-gray-700 font-semibold text-center">Share</Text>
                    </Pressable>
                  </View>
                </Animated.View>
              ))
            )}
          </View>
        )}

        {/* Ask Tab */}
        {activeTab === 'Ask' && (
          <View className="p-4">
            <View className="flex-row items-center justify-between mb-4">
              <View className="flex-row items-center">
                <Users size={20} color="#1B4D3E" />
                <Text className="text-lg font-bold text-gray-900 ml-2">Ask the Neighborhood</Text>
              </View>
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push('/create-ask');
                }}
                className="bg-amber-100 px-3 py-1.5 rounded-full"
              >
                <Text className="text-amber-700 font-medium text-sm">Ask</Text>
              </Pressable>
            </View>

            {/* Quick Ask Categories */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-4 px-4 mb-4">
              {['Recommendations', 'Help Needed', 'Lost & Found', 'Questions'].map((cat) => (
                <Pressable
                  key={cat}
                  className="bg-white px-4 py-2 rounded-full mr-2 border border-gray-200"
                >
                  <Text className="text-gray-700 font-medium">{cat}</Text>
                </Pressable>
              ))}
            </ScrollView>

            {/* Sample asks */}
            {[
              { title: 'Looking for African grocery store', author: 'Sarah M.', responses: 8, urgent: false },
              { title: 'Need help moving furniture Saturday', author: 'James K.', responses: 3, urgent: true },
              { title: 'Best African restaurant for a party?', author: 'Lisa O.', responses: 12, urgent: false },
            ].map((ask, index) => (
              <Animated.View
                key={index}
                entering={FadeInDown.delay(index * 100)}
                className="bg-white rounded-xl p-4 mb-3"
              >
                <View className="flex-row items-start justify-between">
                  <View className="flex-1">
                    {ask.urgent && (
                      <View className="bg-red-100 px-2 py-0.5 rounded-full self-start mb-2">
                        <Text className="text-red-700 text-xs font-bold">URGENT</Text>
                      </View>
                    )}
                    <Text className="text-gray-900 font-semibold">{ask.title}</Text>
                    <Text className="text-gray-500 text-sm mt-1">by {ask.author}</Text>
                  </View>
                  <View className="bg-gray-100 px-2 py-1 rounded-full">
                    <Text className="text-gray-600 text-xs">{ask.responses} responses</Text>
                  </View>
                </View>
                <Pressable className="flex-row items-center mt-3">
                  <Text className="text-emerald-700 font-medium">View & Respond</Text>
                  <ChevronRight size={16} color="#047857" />
                </Pressable>
              </Animated.View>
            ))}
          </View>
        )}

        <View className="h-8" />
      </ScrollView>

      {/* Create Poll Modal */}
      <Modal visible={showCreatePoll} animationType="slide" presentationStyle="pageSheet">
        <CreatePollModal onClose={() => setShowCreatePoll(false)} onSubmit={addPoll} />
      </Modal>
    </SafeAreaView>
  );
}

function CreatePollModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: (poll: Poll) => void }) {
  const currentUser = useStore((s) => s.currentUser);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [options, setOptions] = useState(['', '', '']);

  const handleSubmit = () => {
    if (!title.trim() || options.filter((o) => o.trim()).length < 2) return;

    const poll: Poll = {
      id: uuidv4(),
      communityId: '1',
      creatorId: currentUser?.id ?? 'guest',
      creatorName: currentUser?.name ?? 'Guest',
      creatorAvatar: currentUser?.avatar ?? 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100',
      title: title.trim(),
      description: description.trim(),
      options: options
        .filter((o) => o.trim())
        .map((text, index) => ({
          id: String(index + 1),
          text: text.trim(),
          votes: 0,
          voterIds: [],
        })),
      category: 'community',
      status: 'active',
      totalVotes: 0,
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      isAnonymous: false,
      createdAt: new Date().toISOString(),
    };

    onSubmit(poll);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onClose();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FAF7F2' }}>
      <View className="flex-row items-center justify-between p-4 border-b border-gray-200">
        <Pressable onPress={onClose}>
          <X size={24} color="#6B7280" />
        </Pressable>
        <Text className="text-lg font-bold text-gray-900">Create Poll</Text>
        <Pressable
          onPress={handleSubmit}
          disabled={!title.trim() || options.filter((o) => o.trim()).length < 2}
          className={`px-4 py-2 rounded-full ${title.trim() && options.filter((o) => o.trim()).length >= 2 ? 'bg-emerald-800' : 'bg-gray-200'}`}
        >
          <Text className={`font-semibold ${title.trim() && options.filter((o) => o.trim()).length >= 2 ? 'text-white' : 'text-gray-400'}`}>
            Post
          </Text>
        </Pressable>
      </View>

      <ScrollView className="flex-1 p-4">
        <Text className="text-gray-700 font-medium mb-2">Question</Text>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="What do you want to ask the community?"
          className="bg-white p-4 rounded-xl text-gray-900 mb-4"
          multiline
        />

        <Text className="text-gray-700 font-medium mb-2">Description (optional)</Text>
        <TextInput
          value={description}
          onChangeText={setDescription}
          placeholder="Add more context..."
          className="bg-white p-4 rounded-xl text-gray-900 mb-4"
          multiline
        />

        <Text className="text-gray-700 font-medium mb-2">Options</Text>
        {options.map((option, index) => (
          <TextInput
            key={index}
            value={option}
            onChangeText={(text) => {
              const newOptions = [...options];
              newOptions[index] = text;
              setOptions(newOptions);
            }}
            placeholder={`Option ${index + 1}`}
            className="bg-white p-4 rounded-xl text-gray-900 mb-2"
          />
        ))}

        {options.length < 5 && (
          <Pressable
            onPress={() => setOptions([...options, ''])}
            className="flex-row items-center justify-center py-3"
          >
            <Plus size={18} color="#D4673A" />
            <Text className="text-amber-700 font-medium ml-2">Add Option</Text>
          </Pressable>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
