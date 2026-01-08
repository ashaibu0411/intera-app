import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import {
  ArrowLeft,
  Search,
  FileText,
  MessageCircle,
  Users,
  BookOpen,
  Scale,
  CheckCircle,
  Clock,
  AlertCircle,
  ChevronRight,
  Send,
  ThumbsUp,
  Eye,
  Plus,
  Filter,
  Globe,
  Briefcase,
  GraduationCap,
  Heart,
  Home,
  Bot,
  Plane,
} from 'lucide-react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useStore } from '@/lib/store';

// Visa categories
const VISA_CATEGORIES = [
  { id: 'work', name: 'Work Visas', icon: Briefcase, color: '#1B4D3E', description: 'H-1B, L-1, O-1, etc.' },
  { id: 'student', name: 'Student Visas', icon: GraduationCap, color: '#2563EB', description: 'F-1, J-1, M-1' },
  { id: 'family', name: 'Family-Based', icon: Heart, color: '#DC2626', description: 'Spouse, children, parents' },
  { id: 'green', name: 'Green Card', icon: Home, color: '#059669', description: 'Permanent residence' },
  { id: 'asylum', name: 'Asylum/Refugee', icon: Globe, color: '#7C3AED', description: 'Protection-based' },
  { id: 'visitor', name: 'Visitor Visas', icon: Globe, color: '#F59E0B', description: 'B-1/B-2, tourist' },
];

// Mock Q&A data
const MOCK_QUESTIONS = [
  {
    id: '1',
    title: 'How long does H-1B processing take in 2024?',
    category: 'work',
    author: {
      name: 'Kwame Asante',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
      country: 'Ghana',
    },
    answers: 12,
    views: 1234,
    upvotes: 45,
    createdAt: '2024-12-28T10:00:00Z',
    isAnswered: true,
    topAnswer: 'Regular processing takes 6-9 months. Premium processing is 15 business days for an additional $2,805 fee.',
  },
  {
    id: '2',
    title: 'Can I work while my green card application is pending?',
    category: 'green',
    author: {
      name: 'Amara Okonkwo',
      avatar: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=100&h=100&fit=crop&crop=face',
      country: 'Nigeria',
    },
    answers: 8,
    views: 876,
    upvotes: 32,
    createdAt: '2024-12-27T14:00:00Z',
    isAnswered: true,
    topAnswer: 'Yes, you can apply for an EAD (Employment Authorization Document) while your I-485 is pending.',
  },
  {
    id: '3',
    title: 'F-1 visa interview tips for Nigerian students?',
    category: 'student',
    author: {
      name: 'Chidi Okafor',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face',
      country: 'Nigeria',
    },
    answers: 23,
    views: 2341,
    upvotes: 89,
    createdAt: '2024-12-26T09:00:00Z',
    isAnswered: true,
    topAnswer: 'Be prepared to explain your study plans, ties to home country, and how you\'ll fund your education. Bring all financial documents.',
  },
  {
    id: '4',
    title: 'Asylum process timeline from Ethiopia?',
    category: 'asylum',
    author: {
      name: 'Yohannes Bekele',
      avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop&crop=face',
      country: 'Ethiopia',
    },
    answers: 5,
    views: 543,
    upvotes: 18,
    createdAt: '2024-12-25T16:00:00Z',
    isAnswered: false,
    topAnswer: null,
  },
  {
    id: '5',
    title: 'Bringing parents to US - what visa do they need?',
    category: 'family',
    author: {
      name: 'Fatou Diallo',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face',
      country: 'Senegal',
    },
    answers: 15,
    views: 1567,
    upvotes: 56,
    createdAt: '2024-12-24T11:00:00Z',
    isAnswered: true,
    topAnswer: 'If you\'re a US citizen, you can petition for your parents using Form I-130. Current wait time is about 1-2 years.',
  },
];

// Mock lawyers
const MOCK_LAWYERS = [
  {
    id: '1',
    name: 'Adaora Nwosu, Esq.',
    photo: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=200&h=200&fit=crop&crop=face',
    specialty: 'Employment-Based Immigration',
    languages: ['English', 'Igbo', 'Yoruba'],
    rating: 4.9,
    reviews: 127,
    location: 'Houston, TX',
    verified: true,
  },
  {
    id: '2',
    name: 'Kofi Mensah, Esq.',
    photo: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200&h=200&fit=crop&crop=face',
    specialty: 'Family Immigration & Green Cards',
    languages: ['English', 'Twi', 'French'],
    rating: 4.8,
    reviews: 98,
    location: 'Atlanta, GA',
    verified: true,
  },
  {
    id: '3',
    name: 'Amina Hassan, Esq.',
    photo: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&h=200&fit=crop&crop=face',
    specialty: 'Asylum & Refugee Cases',
    languages: ['English', 'Swahili', 'Arabic'],
    rating: 4.9,
    reviews: 76,
    location: 'Minneapolis, MN',
    verified: true,
  },
];

// Document checklists
const DOCUMENT_CHECKLISTS: Record<string, { title: string; items: string[] }> = {
  'work': {
    title: 'H-1B Visa Documents',
    items: [
      'Valid passport (6+ months validity)',
      'DS-160 confirmation page',
      'Visa appointment confirmation',
      'I-797 approval notice',
      'Job offer letter with salary',
      'Resume/CV',
      'Educational credentials (degrees, transcripts)',
      'Credential evaluation (if foreign degree)',
      'Passport-sized photos (2x2 inches)',
      'Previous US visas (if any)',
      'Employment verification letters',
    ],
  },
  'student': {
    title: 'F-1 Visa Documents',
    items: [
      'Valid passport (6+ months validity)',
      'I-20 form from school',
      'DS-160 confirmation page',
      'SEVIS fee payment receipt',
      'Visa appointment confirmation',
      'Acceptance letter from university',
      'Financial documents (bank statements)',
      'Sponsor letter (if applicable)',
      'Academic transcripts',
      'Standardized test scores (TOEFL, GRE, etc.)',
      'Passport-sized photos (2x2 inches)',
    ],
  },
  'family': {
    title: 'Family-Based Immigration Documents',
    items: [
      'Form I-130 petition',
      'Proof of US citizenship/green card',
      'Birth certificates',
      'Marriage certificate (if spouse)',
      'Divorce decrees (if applicable)',
      'Passport copies',
      'Photos together over time',
      'Joint financial documents',
      'Affidavit of support (I-864)',
      'Tax returns (3 years)',
    ],
  },
  'green': {
    title: 'Green Card Documents',
    items: [
      'Form I-485 application',
      'Birth certificate with translation',
      'Passport and visa copies',
      'I-94 arrival record',
      'Employment authorization (if applicable)',
      'Medical exam results (I-693)',
      'Affidavit of support',
      'Tax returns and W-2s',
      'Police clearance certificates',
      'Passport-sized photos',
    ],
  },
};

export default function ImmigrationHelpScreen() {
  const [activeTab, setActiveTab] = useState<'qa' | 'lawyers' | 'documents'>('qa');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAskModal, setShowAskModal] = useState(false);
  const [newQuestion, setNewQuestion] = useState('');
  const currentUser = useStore((s) => s.currentUser);

  const filteredQuestions = MOCK_QUESTIONS.filter((q) => {
    const matchesCategory = !selectedCategory || q.category === selectedCategory;
    const matchesSearch = !searchQuery ||
      q.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleAskQuestion = () => {
    if (!newQuestion.trim()) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setShowAskModal(false);
    setNewQuestion('');
    // In production, this would submit to database
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return `${Math.floor(diffDays / 7)} weeks ago`;
  };

  return (
    <View className="flex-1 bg-cream-50">
      <LinearGradient
        colors={['#1B4D3E', '#0D3329']}
        style={{ paddingTop: 60, paddingBottom: 20 }}
      >
        <View className="px-4">
          {/* Header */}
          <View className="flex-row items-center mb-4">
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.back();
              }}
              className="w-10 h-10 bg-white/20 rounded-full items-center justify-center mr-4"
            >
              <ArrowLeft size={20} color="#FFFFFF" />
            </Pressable>
            <View className="flex-1">
              <Text className="text-white text-xl font-bold">Immigration Help</Text>
              <Text className="text-white/70 text-sm">Visa guidance & community support</Text>
            </View>
          </View>

          {/* Search */}
          <View className="bg-white/20 rounded-xl flex-row items-center px-4 py-3 mb-4">
            <Search size={20} color="#FFFFFF" />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search questions, visas, processes..."
              placeholderTextColor="rgba(255,255,255,0.6)"
              className="flex-1 ml-3 text-white"
            />
          </View>

          {/* Tabs */}
          <View className="flex-row bg-white/10 rounded-xl p-1">
            {[
              { id: 'qa', label: 'Q&A', icon: MessageCircle },
              { id: 'lawyers', label: 'Lawyers', icon: Scale },
              { id: 'documents', label: 'Documents', icon: FileText },
            ].map((tab) => (
              <Pressable
                key={tab.id}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setActiveTab(tab.id as any);
                }}
                className={`flex-1 flex-row items-center justify-center py-2.5 rounded-lg ${
                  activeTab === tab.id ? 'bg-white' : ''
                }`}
              >
                <tab.icon size={16} color={activeTab === tab.id ? '#1B4D3E' : '#FFFFFF'} />
                <Text
                  className={`ml-2 font-medium ${
                    activeTab === tab.id ? 'text-forest-700' : 'text-white'
                  }`}
                >
                  {tab.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </LinearGradient>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Quick Access Cards */}
        <View className="px-4 pt-4 pb-2">
          <Text className="text-lg font-bold text-gray-900 mb-3">Quick Tools</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 12 }}
          >
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push('/immigration-career-guide');
              }}
              className="rounded-2xl p-4 w-36"
              style={{ backgroundColor: '#10B981' }}
            >
              <View className="w-10 h-10 rounded-full bg-white/20 items-center justify-center mb-3">
                <Briefcase size={22} color="#fff" />
              </View>
              <Text className="text-white font-bold text-base">Career Guide</Text>
              <Text className="text-white/80 text-xs mt-1">Nursing, Tech, etc.</Text>
            </Pressable>

            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push('/international-jobs');
              }}
              className="rounded-2xl p-4 w-36"
              style={{ backgroundColor: '#3B82F6' }}
            >
              <View className="w-10 h-10 rounded-full bg-white/20 items-center justify-center mb-3">
                <Plane size={22} color="#fff" />
              </View>
              <Text className="text-white font-bold text-base">Visa Jobs</Text>
              <Text className="text-white/80 text-xs mt-1">Sponsored positions</Text>
            </Pressable>

            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push('/international-schools');
              }}
              className="rounded-2xl p-4 w-36"
              style={{ backgroundColor: '#F59E0B' }}
            >
              <View className="w-10 h-10 rounded-full bg-white/20 items-center justify-center mb-3">
                <GraduationCap size={22} color="#fff" />
              </View>
              <Text className="text-white font-bold text-base">Study Abroad</Text>
              <Text className="text-white/80 text-xs mt-1">Schools & scholarships</Text>
            </Pressable>

            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push('/immigration-assistant');
              }}
              className="rounded-2xl p-4 w-36"
              style={{ backgroundColor: '#8B5CF6' }}
            >
              <View className="w-10 h-10 rounded-full bg-white/20 items-center justify-center mb-3">
                <Bot size={22} color="#fff" />
              </View>
              <Text className="text-white font-bold text-base">AI Assistant</Text>
              <Text className="text-white/80 text-xs mt-1">Ask any question</Text>
            </Pressable>
          </ScrollView>
        </View>

        {/* Categories */}
        {activeTab === 'qa' && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="py-4"
            contentContainerStyle={{ paddingHorizontal: 16 }}
          >
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setSelectedCategory(null);
              }}
              className={`mr-2 px-4 py-2 rounded-full ${
                !selectedCategory ? 'bg-forest-600' : 'bg-white'
              }`}
            >
              <Text className={!selectedCategory ? 'text-white font-medium' : 'text-gray-600'}>
                All Topics
              </Text>
            </Pressable>
            {VISA_CATEGORIES.map((cat) => (
              <Pressable
                key={cat.id}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setSelectedCategory(selectedCategory === cat.id ? null : cat.id);
                }}
                className={`mr-2 px-4 py-2 rounded-full flex-row items-center ${
                  selectedCategory === cat.id ? 'bg-forest-600' : 'bg-white'
                }`}
              >
                <cat.icon
                  size={14}
                  color={selectedCategory === cat.id ? '#FFFFFF' : cat.color}
                />
                <Text
                  className={`ml-2 ${
                    selectedCategory === cat.id ? 'text-white font-medium' : 'text-gray-600'
                  }`}
                >
                  {cat.name}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        )}

        {/* Q&A Tab */}
        {activeTab === 'qa' && (
          <View className="px-4 pb-8">
            {/* Ask Question Button */}
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                setShowAskModal(true);
              }}
              className="bg-terracotta-500 rounded-xl py-4 flex-row items-center justify-center mb-4"
            >
              <Plus size={20} color="#FFFFFF" />
              <Text className="text-white font-semibold ml-2">Ask a Question</Text>
            </Pressable>

            {/* Questions List */}
            {filteredQuestions.map((question, index) => (
              <Animated.View
                key={question.id}
                entering={FadeInUp.duration(400).delay(index * 100)}
              >
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    // Navigate to question detail
                  }}
                  className="bg-white rounded-2xl p-4 mb-3 shadow-sm"
                >
                  {/* Question Header */}
                  <View className="flex-row items-start mb-2">
                    <View className="flex-1">
                      <View className="flex-row items-center mb-1">
                        {question.isAnswered && (
                          <View className="bg-green-100 rounded-full px-2 py-0.5 mr-2">
                            <Text className="text-green-700 text-xs font-medium">Answered</Text>
                          </View>
                        )}
                        <Text className="text-gray-500 text-xs">
                          {VISA_CATEGORIES.find((c) => c.id === question.category)?.name}
                        </Text>
                      </View>
                      <Text className="text-warmBrown font-semibold text-base">
                        {question.title}
                      </Text>
                    </View>
                  </View>

                  {/* Top Answer Preview */}
                  {question.topAnswer && (
                    <View className="bg-forest-50 rounded-xl p-3 mb-3">
                      <Text className="text-forest-700 text-sm" numberOfLines={2}>
                        {question.topAnswer}
                      </Text>
                    </View>
                  )}

                  {/* Author & Stats */}
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center">
                      <Image
                        source={{ uri: question.author.avatar }}
                        style={{ width: 24, height: 24, borderRadius: 12 }}
                      />
                      <Text className="text-gray-600 text-sm ml-2">
                        {question.author.name} • {formatTimeAgo(question.createdAt)}
                      </Text>
                    </View>
                    <View className="flex-row items-center">
                      <ThumbsUp size={14} color="#8B7355" />
                      <Text className="text-gray-500 text-sm ml-1 mr-3">{question.upvotes}</Text>
                      <MessageCircle size={14} color="#8B7355" />
                      <Text className="text-gray-500 text-sm ml-1">{question.answers}</Text>
                    </View>
                  </View>
                </Pressable>
              </Animated.View>
            ))}
          </View>
        )}

        {/* Lawyers Tab */}
        {activeTab === 'lawyers' && (
          <View className="px-4 py-4 pb-8">
            <Text className="text-warmBrown font-bold text-lg mb-1">Verified Immigration Lawyers</Text>
            <Text className="text-gray-500 text-sm mb-4">
              Lawyers who understand the African immigrant experience
            </Text>

            {MOCK_LAWYERS.map((lawyer, index) => (
              <Animated.View
                key={lawyer.id}
                entering={FadeInUp.duration(400).delay(index * 100)}
              >
                <Pressable className="bg-white rounded-2xl p-4 mb-3 shadow-sm">
                  <View className="flex-row">
                    <Image
                      source={{ uri: lawyer.photo }}
                      style={{ width: 70, height: 70, borderRadius: 16 }}
                    />
                    <View className="flex-1 ml-4">
                      <View className="flex-row items-center">
                        <Text className="text-warmBrown font-bold text-base">{lawyer.name}</Text>
                        {lawyer.verified && (
                          <CheckCircle size={16} color="#059669" fill="#059669" className="ml-1" />
                        )}
                      </View>
                      <Text className="text-terracotta-500 text-sm font-medium">
                        {lawyer.specialty}
                      </Text>
                      <Text className="text-gray-500 text-sm">{lawyer.location}</Text>
                      <View className="flex-row items-center mt-1">
                        <Text className="text-gold-500">★</Text>
                        <Text className="text-gray-600 text-sm ml-1">
                          {lawyer.rating} ({lawyer.reviews} reviews)
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Languages */}
                  <View className="flex-row flex-wrap mt-3">
                    {lawyer.languages.map((lang) => (
                      <View key={lang} className="bg-forest-50 rounded-full px-3 py-1 mr-2 mb-1">
                        <Text className="text-forest-700 text-xs">{lang}</Text>
                      </View>
                    ))}
                  </View>

                  {/* Contact Button */}
                  <Pressable
                    onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)}
                    className="bg-forest-600 rounded-xl py-3 mt-3 flex-row items-center justify-center"
                  >
                    <MessageCircle size={18} color="#FFFFFF" />
                    <Text className="text-white font-semibold ml-2">Free Consultation</Text>
                  </Pressable>
                </Pressable>
              </Animated.View>
            ))}
          </View>
        )}

        {/* Documents Tab */}
        {activeTab === 'documents' && (
          <View className="px-4 py-4 pb-8">
            <Text className="text-warmBrown font-bold text-lg mb-1">Document Checklists</Text>
            <Text className="text-gray-500 text-sm mb-4">
              Never miss a required document for your application
            </Text>

            {VISA_CATEGORIES.slice(0, 4).map((cat, index) => (
              <Animated.View
                key={cat.id}
                entering={FadeInUp.duration(400).delay(index * 100)}
              >
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    // Navigate to checklist detail
                  }}
                  className="bg-white rounded-2xl p-4 mb-3 shadow-sm"
                >
                  <View className="flex-row items-center mb-3">
                    <View
                      className="w-12 h-12 rounded-xl items-center justify-center"
                      style={{ backgroundColor: cat.color + '20' }}
                    >
                      <cat.icon size={24} color={cat.color} />
                    </View>
                    <View className="flex-1 ml-3">
                      <Text className="text-warmBrown font-bold">{DOCUMENT_CHECKLISTS[cat.id]?.title || cat.name}</Text>
                      <Text className="text-gray-500 text-sm">
                        {DOCUMENT_CHECKLISTS[cat.id]?.items.length || 0} documents
                      </Text>
                    </View>
                    <ChevronRight size={20} color="#8B7355" />
                  </View>

                  {/* Preview of items */}
                  {DOCUMENT_CHECKLISTS[cat.id]?.items.slice(0, 3).map((item, i) => (
                    <View key={i} className="flex-row items-center mb-1">
                      <View className="w-5 h-5 rounded border-2 border-gray-300 items-center justify-center mr-2">
                        <CheckCircle size={12} color="#9CA3AF" />
                      </View>
                      <Text className="text-gray-600 text-sm">{item}</Text>
                    </View>
                  ))}
                  <Text className="text-terracotta-500 text-sm font-medium mt-2">
                    + {(DOCUMENT_CHECKLISTS[cat.id]?.items.length || 0) - 3} more items
                  </Text>
                </Pressable>
              </Animated.View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Ask Question Modal */}
      <Modal
        visible={showAskModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAskModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl p-6">
            <Text className="text-warmBrown font-bold text-xl mb-4">Ask the Community</Text>
            <TextInput
              value={newQuestion}
              onChangeText={setNewQuestion}
              placeholder="What's your immigration question?"
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={4}
              className="bg-gray-50 rounded-xl p-4 text-warmBrown mb-4 min-h-[120px]"
              textAlignVertical="top"
            />
            <Text className="text-gray-500 text-sm mb-4">
              💡 Tip: Be specific about your visa type and situation for better answers
            </Text>
            <View className="flex-row">
              <Pressable
                onPress={() => setShowAskModal(false)}
                className="flex-1 bg-gray-100 rounded-xl py-4 mr-2"
              >
                <Text className="text-gray-600 font-semibold text-center">Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleAskQuestion}
                className="flex-1 bg-forest-600 rounded-xl py-4 ml-2"
              >
                <Text className="text-white font-semibold text-center">Post Question</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
