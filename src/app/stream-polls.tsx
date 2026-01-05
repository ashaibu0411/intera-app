import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, Modal } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  BarChart3,
  HelpCircle,
  Plus,
  X,
  Check,
  Users,
  Clock,
  Send,
  MessageCircle,
  ChevronUp,
  Trash2,
  Play,
  Square,
  AlertTriangle
} from 'lucide-react-native';
import Animated, {
  FadeIn,
  FadeInUp,
  FadeOut,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useStore } from '@/lib/store';
import { moderateText } from '@/lib/contentModeration';
import * as Haptics from 'expo-haptics';

// Poll & Q&A Types
interface PollOption {
  id: string;
  text: string;
  votes: number;
  voters: string[];
}

interface Poll {
  id: string;
  question: string;
  options: PollOption[];
  creatorId: string;
  creatorName: string;
  status: 'active' | 'ended';
  totalVotes: number;
  duration: number; // seconds
  createdAt: string;
  endedAt?: string;
}

interface Question {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  question: string;
  upvotes: number;
  upvoters: string[];
  isAnswered: boolean;
  isPinned: boolean;
  timestamp: string;
}

// Mock data
const MOCK_POLLS: Poll[] = [
  {
    id: 'p1',
    question: 'What should I perform next?',
    options: [
      { id: 'o1', text: 'R&B Classic', votes: 45, voters: [] },
      { id: 'o2', text: 'Afrobeats Hit', votes: 78, voters: [] },
      { id: 'o3', text: 'Gospel Song', votes: 32, voters: [] },
      { id: 'o4', text: 'Freestyle', votes: 21, voters: [] },
    ],
    creatorId: 'host1',
    creatorName: 'DJ Amara',
    status: 'active',
    totalVotes: 176,
    duration: 120,
    createdAt: new Date(Date.now() - 60000).toISOString(),
  }
];

const MOCK_QUESTIONS: Question[] = [
  {
    id: 'q1',
    userId: 'u1',
    userName: 'Marcus J.',
    userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
    question: 'How long have you been making music?',
    upvotes: 24,
    upvoters: [],
    isAnswered: false,
    isPinned: true,
    timestamp: new Date(Date.now() - 120000).toISOString(),
  },
  {
    id: 'q2',
    userId: 'u2',
    userName: 'Aisha K.',
    userAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100',
    question: 'What inspired your latest song?',
    upvotes: 18,
    upvoters: [],
    isAnswered: false,
    isPinned: false,
    timestamp: new Date(Date.now() - 180000).toISOString(),
  },
  {
    id: 'q3',
    userId: 'u3',
    userName: 'David O.',
    userAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100',
    question: 'Any upcoming collaborations?',
    upvotes: 12,
    upvoters: [],
    isAnswered: true,
    isPinned: false,
    timestamp: new Date(Date.now() - 240000).toISOString(),
  },
];

export default function StreamPollsScreen() {
  const { streamId } = useLocalSearchParams<{ streamId: string }>();
  const [activeTab, setActiveTab] = useState<'polls' | 'qa'>('polls');
  const [polls, setPolls] = useState<Poll[]>(MOCK_POLLS);
  const [questions, setQuestions] = useState<Question[]>(MOCK_QUESTIONS);
  const [showCreatePoll, setShowCreatePoll] = useState(false);
  const [showAskQuestion, setShowAskQuestion] = useState(false);
  const [selectedPoll, setSelectedPoll] = useState<Poll | null>(null);

  const currentUser = useStore((s) => s.currentUser);
  const isHost = true; // In real app, check if user is stream host

  const handleVote = (pollId: string, optionId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setPolls(polls.map(poll => {
      if (poll.id !== pollId) return poll;
      return {
        ...poll,
        options: poll.options.map(opt =>
          opt.id === optionId
            ? { ...opt, votes: opt.votes + 1 }
            : opt
        ),
        totalVotes: poll.totalVotes + 1
      };
    }));
  };

  const handleUpvoteQuestion = (questionId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setQuestions(questions.map(q =>
      q.id === questionId ? { ...q, upvotes: q.upvotes + 1 } : q
    ).sort((a, b) => {
      if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
      return b.upvotes - a.upvotes;
    }));
  };

  const handlePinQuestion = (questionId: string) => {
    if (!isHost) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setQuestions(questions.map(q =>
      q.id === questionId ? { ...q, isPinned: !q.isPinned } : q
    ).sort((a, b) => {
      if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
      return b.upvotes - a.upvotes;
    }));
  };

  const handleAnswerQuestion = (questionId: string) => {
    if (!isHost) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setQuestions(questions.map(q =>
      q.id === questionId ? { ...q, isAnswered: true } : q
    ));
  };

  const handleEndPoll = (pollId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setPolls(polls.map(poll =>
      poll.id === pollId
        ? { ...poll, status: 'ended', endedAt: new Date().toISOString() }
        : poll
    ));
  };

  return (
    <View className="flex-1 bg-black">
      <Stack.Screen
        options={{
          title: 'Polls & Q&A',
          headerStyle: { backgroundColor: '#000' },
          headerTintColor: '#fff',
        }}
      />

      {/* Tab Switcher */}
      <View className="flex-row mx-4 mt-2 bg-gray-900 rounded-xl p-1">
        <Pressable
          onPress={() => setActiveTab('polls')}
          className={`flex-1 py-3 rounded-lg flex-row items-center justify-center ${
            activeTab === 'polls' ? 'bg-purple-600' : ''
          }`}
        >
          <BarChart3 size={18} color={activeTab === 'polls' ? 'white' : '#9CA3AF'} />
          <Text className={`ml-2 font-medium ${activeTab === 'polls' ? 'text-white' : 'text-gray-400'}`}>
            Polls
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setActiveTab('qa')}
          className={`flex-1 py-3 rounded-lg flex-row items-center justify-center ${
            activeTab === 'qa' ? 'bg-purple-600' : ''
          }`}
        >
          <HelpCircle size={18} color={activeTab === 'qa' ? 'white' : '#9CA3AF'} />
          <Text className={`ml-2 font-medium ${activeTab === 'qa' ? 'text-white' : 'text-gray-400'}`}>
            Q&A
          </Text>
        </Pressable>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16 }}>
        {activeTab === 'polls' ? (
          <>
            {/* Create Poll Button (Host Only) */}
            {isHost && (
              <Pressable
                onPress={() => setShowCreatePoll(true)}
                className="bg-gray-900 rounded-2xl p-4 mb-4 flex-row items-center"
              >
                <View className="bg-purple-600 rounded-full p-3">
                  <Plus size={24} color="white" />
                </View>
                <View className="ml-4">
                  <Text className="text-white font-bold text-lg">Create Poll</Text>
                  <Text className="text-gray-400 text-sm">Ask your audience a question</Text>
                </View>
              </Pressable>
            )}

            {/* Active Polls */}
            {polls.filter(p => p.status === 'active').map((poll) => (
              <Animated.View
                key={poll.id}
                entering={FadeInUp}
                className="bg-gray-900 rounded-2xl p-4 mb-4"
              >
                <View className="flex-row items-center justify-between mb-4">
                  <View className="flex-row items-center">
                    <View className="bg-green-500/20 px-3 py-1 rounded-full flex-row items-center">
                      <View className="w-2 h-2 bg-green-500 rounded-full mr-2" />
                      <Text className="text-green-400 text-sm font-medium">Live Poll</Text>
                    </View>
                  </View>
                  <View className="flex-row items-center">
                    <Users size={14} color="#9CA3AF" />
                    <Text className="text-gray-400 text-sm ml-1">{poll.totalVotes} votes</Text>
                  </View>
                </View>

                <Text className="text-white font-bold text-lg mb-4">{poll.question}</Text>

                {/* Poll Options */}
                {poll.options.map((option) => {
                  const percentage = poll.totalVotes > 0
                    ? Math.round((option.votes / poll.totalVotes) * 100)
                    : 0;

                  return (
                    <Pressable
                      key={option.id}
                      onPress={() => handleVote(poll.id, option.id)}
                      className="mb-3"
                    >
                      <View className="bg-gray-800 rounded-xl overflow-hidden">
                        <Animated.View
                          style={{
                            position: 'absolute',
                            left: 0,
                            top: 0,
                            bottom: 0,
                            width: `${percentage}%`,
                            backgroundColor: '#7C3AED',
                            opacity: 0.3,
                          }}
                        />
                        <View className="flex-row items-center justify-between p-4">
                          <Text className="text-white font-medium">{option.text}</Text>
                          <Text className="text-purple-400 font-bold">{percentage}%</Text>
                        </View>
                      </View>
                    </Pressable>
                  );
                })}

                {/* Host Controls */}
                {isHost && (
                  <Pressable
                    onPress={() => handleEndPoll(poll.id)}
                    className="mt-4 bg-red-500/20 rounded-xl py-3 flex-row items-center justify-center"
                  >
                    <Square size={18} color="#EF4444" />
                    <Text className="text-red-400 font-medium ml-2">End Poll</Text>
                  </Pressable>
                )}
              </Animated.View>
            ))}

            {/* Ended Polls */}
            {polls.filter(p => p.status === 'ended').length > 0 && (
              <Text className="text-gray-500 font-medium mb-3 mt-4">Previous Polls</Text>
            )}
            {polls.filter(p => p.status === 'ended').map((poll) => {
              const winner = poll.options.reduce((a, b) => a.votes > b.votes ? a : b);

              return (
                <View key={poll.id} className="bg-gray-900/50 rounded-2xl p-4 mb-4 opacity-70">
                  <Text className="text-gray-400 font-medium mb-2">{poll.question}</Text>
                  <View className="flex-row items-center">
                    <Check size={16} color="#22C55E" />
                    <Text className="text-green-400 ml-2">
                      Winner: {winner.text} ({Math.round((winner.votes / poll.totalVotes) * 100)}%)
                    </Text>
                  </View>
                </View>
              );
            })}

            {polls.length === 0 && (
              <View className="items-center py-12">
                <BarChart3 size={48} color="#4B5563" />
                <Text className="text-gray-500 mt-4">No polls yet</Text>
                {isHost && (
                  <Text className="text-gray-600 text-sm mt-2">Create a poll to engage your audience</Text>
                )}
              </View>
            )}
          </>
        ) : (
          <>
            {/* Ask Question Button */}
            <Pressable
              onPress={() => setShowAskQuestion(true)}
              className="bg-gray-900 rounded-2xl p-4 mb-4 flex-row items-center"
            >
              <View className="bg-blue-600 rounded-full p-3">
                <MessageCircle size={24} color="white" />
              </View>
              <View className="ml-4">
                <Text className="text-white font-bold text-lg">Ask a Question</Text>
                <Text className="text-gray-400 text-sm">Get your question answered live</Text>
              </View>
            </Pressable>

            {/* Questions List */}
            {questions.map((question, index) => (
              <Animated.View
                key={question.id}
                entering={FadeInUp.delay(index * 50)}
                className={`bg-gray-900 rounded-2xl p-4 mb-3 ${question.isPinned ? 'border-2 border-yellow-500/50' : ''}`}
              >
                {question.isPinned && (
                  <View className="flex-row items-center mb-2">
                    <View className="bg-yellow-500/20 px-2 py-1 rounded-full">
                      <Text className="text-yellow-400 text-xs font-medium">Pinned</Text>
                    </View>
                  </View>
                )}

                <Text className={`text-white font-medium ${question.isAnswered ? 'opacity-60' : ''}`}>
                  {question.question}
                </Text>

                <View className="flex-row items-center mt-3">
                  <Text className="text-gray-500 text-sm">{question.userName}</Text>
                  {question.isAnswered && (
                    <View className="flex-row items-center ml-3">
                      <Check size={14} color="#22C55E" />
                      <Text className="text-green-400 text-sm ml-1">Answered</Text>
                    </View>
                  )}
                </View>

                <View className="flex-row items-center justify-between mt-4">
                  {/* Upvote Button */}
                  <Pressable
                    onPress={() => handleUpvoteQuestion(question.id)}
                    className="flex-row items-center bg-gray-800 rounded-xl px-4 py-2"
                  >
                    <ChevronUp size={18} color="#A855F7" />
                    <Text className="text-purple-400 font-bold ml-1">{question.upvotes}</Text>
                  </Pressable>

                  {/* Host Controls */}
                  {isHost && !question.isAnswered && (
                    <View className="flex-row">
                      <Pressable
                        onPress={() => handlePinQuestion(question.id)}
                        className={`p-2 rounded-lg mr-2 ${question.isPinned ? 'bg-yellow-500/20' : 'bg-gray-800'}`}
                      >
                        <Text className={question.isPinned ? 'text-yellow-400' : 'text-gray-400'}>
                          {question.isPinned ? 'Unpin' : 'Pin'}
                        </Text>
                      </Pressable>
                      <Pressable
                        onPress={() => handleAnswerQuestion(question.id)}
                        className="bg-green-500/20 px-4 py-2 rounded-lg"
                      >
                        <Text className="text-green-400 font-medium">Mark Answered</Text>
                      </Pressable>
                    </View>
                  )}
                </View>
              </Animated.View>
            ))}

            {questions.length === 0 && (
              <View className="items-center py-12">
                <HelpCircle size={48} color="#4B5563" />
                <Text className="text-gray-500 mt-4">No questions yet</Text>
                <Text className="text-gray-600 text-sm mt-2">Be the first to ask!</Text>
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* Create Poll Modal */}
      <CreatePollModal
        visible={showCreatePoll}
        onClose={() => setShowCreatePoll(false)}
        onSubmit={(poll) => {
          setPolls([poll, ...polls]);
          setShowCreatePoll(false);
        }}
      />

      {/* Ask Question Modal */}
      <AskQuestionModal
        visible={showAskQuestion}
        onClose={() => setShowAskQuestion(false)}
        onSubmit={(question) => {
          setQuestions([question, ...questions]);
          setShowAskQuestion(false);
        }}
      />
    </View>
  );
}

// Create Poll Modal Component
interface CreatePollModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (poll: Poll) => void;
}

function CreatePollModal({ visible, onClose, onSubmit }: CreatePollModalProps) {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [duration, setDuration] = useState(120);
  const [error, setError] = useState<string | null>(null);

  const handleAddOption = () => {
    if (options.length >= 6) return;
    setOptions([...options, '']);
  };

  const handleRemoveOption = (index: number) => {
    if (options.length <= 2) return;
    setOptions(options.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    // Validate
    if (!question.trim()) {
      setError('Please enter a question');
      return;
    }

    const validOptions = options.filter(o => o.trim());
    if (validOptions.length < 2) {
      setError('Please add at least 2 options');
      return;
    }

    // Check moderation
    const questionMod = moderateText(question);
    if (questionMod.action === 'blocked') {
      setError(questionMod.message);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    for (const opt of validOptions) {
      const optMod = moderateText(opt);
      if (optMod.action === 'blocked') {
        setError(`Option "${opt}" violates guidelines`);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        return;
      }
    }

    const newPoll: Poll = {
      id: `poll_${Date.now()}`,
      question: question.trim(),
      options: validOptions.map((text, i) => ({
        id: `opt_${i}`,
        text,
        votes: 0,
        voters: [],
      })),
      creatorId: 'current_user',
      creatorName: 'You',
      status: 'active',
      totalVotes: 0,
      duration,
      createdAt: new Date().toISOString(),
    };

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onSubmit(newPoll);

    // Reset form
    setQuestion('');
    setOptions(['', '']);
    setError(null);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent statusBarTranslucent>
      <View className="flex-1 bg-black/80 justify-end">
        <View className="bg-gray-900 rounded-t-3xl max-h-[90%]">
          <SafeAreaView edges={['bottom']}>
            {/* Header */}
            <View className="flex-row items-center justify-between px-4 py-4 border-b border-gray-800">
              <Pressable onPress={onClose}>
                <X size={24} color="white" />
              </Pressable>
              <Text className="text-white font-bold text-lg">Create Poll</Text>
              <Pressable onPress={handleSubmit}>
                <Text className="text-purple-400 font-bold">Create</Text>
              </Pressable>
            </View>

            <ScrollView className="p-4">
              {/* Error */}
              {error && (
                <View className="bg-red-500/20 rounded-xl p-4 mb-4 flex-row items-center">
                  <AlertTriangle size={20} color="#EF4444" />
                  <Text className="text-red-400 ml-3 flex-1">{error}</Text>
                </View>
              )}

              {/* Question Input */}
              <Text className="text-gray-400 text-sm mb-2">Question</Text>
              <TextInput
                value={question}
                onChangeText={(text) => {
                  setQuestion(text);
                  setError(null);
                }}
                placeholder="Ask your audience something..."
                placeholderTextColor="#6B7280"
                className="bg-gray-800 rounded-xl p-4 text-white text-lg"
                multiline
              />

              {/* Options */}
              <Text className="text-gray-400 text-sm mb-2 mt-6">Options</Text>
              {options.map((option, index) => (
                <View key={index} className="flex-row items-center mb-3">
                  <View className="flex-1 bg-gray-800 rounded-xl flex-row items-center">
                    <TextInput
                      value={option}
                      onChangeText={(text) => {
                        const newOptions = [...options];
                        newOptions[index] = text;
                        setOptions(newOptions);
                        setError(null);
                      }}
                      placeholder={`Option ${index + 1}`}
                      placeholderTextColor="#6B7280"
                      className="flex-1 p-4 text-white"
                    />
                  </View>
                  {options.length > 2 && (
                    <Pressable
                      onPress={() => handleRemoveOption(index)}
                      className="ml-2 p-2"
                    >
                      <Trash2 size={20} color="#EF4444" />
                    </Pressable>
                  )}
                </View>
              ))}

              {options.length < 6 && (
                <Pressable
                  onPress={handleAddOption}
                  className="flex-row items-center justify-center py-3 border border-dashed border-gray-700 rounded-xl"
                >
                  <Plus size={20} color="#9CA3AF" />
                  <Text className="text-gray-400 ml-2">Add Option</Text>
                </Pressable>
              )}

              {/* Duration */}
              <Text className="text-gray-400 text-sm mb-2 mt-6">Duration</Text>
              <View className="flex-row">
                {[60, 120, 300, 600].map((d) => (
                  <Pressable
                    key={d}
                    onPress={() => setDuration(d)}
                    className={`flex-1 py-3 mx-1 rounded-xl items-center ${
                      duration === d ? 'bg-purple-600' : 'bg-gray-800'
                    }`}
                  >
                    <Text className={duration === d ? 'text-white font-medium' : 'text-gray-400'}>
                      {d < 60 ? `${d}s` : `${d / 60}m`}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <View className="h-8" />
            </ScrollView>
          </SafeAreaView>
        </View>
      </View>
    </Modal>
  );
}

// Ask Question Modal Component
interface AskQuestionModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (question: Question) => void;
}

function AskQuestionModal({ visible, onClose, onSubmit }: AskQuestionModalProps) {
  const [questionText, setQuestionText] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = () => {
    if (!questionText.trim()) {
      setError('Please enter a question');
      return;
    }

    // Check moderation
    const modResult = moderateText(questionText);
    if (modResult.action === 'blocked') {
      setError(modResult.message);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    const newQuestion: Question = {
      id: `q_${Date.now()}`,
      userId: 'current_user',
      userName: 'You',
      userAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100',
      question: questionText.trim(),
      upvotes: 0,
      upvoters: [],
      isAnswered: false,
      isPinned: false,
      timestamp: new Date().toISOString(),
    };

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onSubmit(newQuestion);
    setQuestionText('');
    setError(null);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent statusBarTranslucent>
      <View className="flex-1 bg-black/80 justify-end">
        <View className="bg-gray-900 rounded-t-3xl">
          <SafeAreaView edges={['bottom']}>
            {/* Header */}
            <View className="flex-row items-center justify-between px-4 py-4 border-b border-gray-800">
              <Pressable onPress={onClose}>
                <X size={24} color="white" />
              </Pressable>
              <Text className="text-white font-bold text-lg">Ask a Question</Text>
              <Pressable onPress={handleSubmit}>
                <Text className="text-purple-400 font-bold">Submit</Text>
              </Pressable>
            </View>

            <View className="p-4">
              {/* Error */}
              {error && (
                <View className="bg-red-500/20 rounded-xl p-4 mb-4 flex-row items-center">
                  <AlertTriangle size={20} color="#EF4444" />
                  <Text className="text-red-400 ml-3 flex-1">{error}</Text>
                </View>
              )}

              {/* Question Input */}
              <TextInput
                value={questionText}
                onChangeText={(text) => {
                  setQuestionText(text);
                  setError(null);
                }}
                placeholder="What would you like to ask?"
                placeholderTextColor="#6B7280"
                className="bg-gray-800 rounded-xl p-4 text-white text-lg"
                multiline
                numberOfLines={4}
                style={{ minHeight: 120, textAlignVertical: 'top' }}
              />

              <Text className="text-gray-500 text-sm mt-3 text-center">
                Questions with more upvotes are shown first
              </Text>
            </View>
          </SafeAreaView>
        </View>
      </View>
    </Modal>
  );
}
