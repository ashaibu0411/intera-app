import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import { ArrowLeft, Search, FileText, Upload, Camera, Languages, Check, X, Clock, MessageCircle, Star, ChevronRight } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

interface TranslationRequest {
  id: string;
  type: 'active' | 'completed';
  documentType: string;
  fromLanguage: string;
  toLanguage: string;
  status: 'pending' | 'in_progress' | 'completed';
  helper?: {
    name: string;
    avatar: string;
    rating: number;
  };
  requestedAt: string;
  completedAt?: string;
  urgency: 'normal' | 'urgent';
}

interface TranslationHelper {
  id: string;
  name: string;
  avatar: string;
  languages: string[];
  specializations: string[];
  rating: number;
  completedTranslations: number;
  responseTime: string;
  isVerified: boolean;
  isAvailable: boolean;
}

const MOCK_REQUESTS: TranslationRequest[] = [
  {
    id: '1',
    type: 'active',
    documentType: 'Immigration Form',
    fromLanguage: 'English',
    toLanguage: 'Spanish',
    status: 'in_progress',
    helper: {
      name: 'Maria Garcia',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200',
      rating: 4.9,
    },
    requestedAt: '2 hours ago',
    urgency: 'urgent',
  },
  {
    id: '2',
    type: 'completed',
    documentType: 'Medical Records',
    fromLanguage: 'French',
    toLanguage: 'English',
    status: 'completed',
    helper: {
      name: 'Jean Pierre',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200',
      rating: 5.0,
    },
    requestedAt: '3 days ago',
    completedAt: '2 days ago',
    urgency: 'normal',
  },
];

const MOCK_HELPERS: TranslationHelper[] = [
  {
    id: '1',
    name: 'Amara Diallo',
    avatar: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=200',
    languages: ['French', 'Wolof', 'English', 'Arabic'],
    specializations: ['Legal', 'Medical', 'Immigration'],
    rating: 4.9,
    completedTranslations: 156,
    responseTime: '< 1 hour',
    isVerified: true,
    isAvailable: true,
  },
  {
    id: '2',
    name: 'Carlos Rodriguez',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200',
    languages: ['Spanish', 'English', 'Portuguese'],
    specializations: ['Immigration', 'Education', 'Financial'],
    rating: 4.8,
    completedTranslations: 234,
    responseTime: '< 2 hours',
    isVerified: true,
    isAvailable: true,
  },
  {
    id: '3',
    name: 'Fatou Mbaye',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
    languages: ['French', 'Wolof', 'English'],
    specializations: ['Medical', 'Personal'],
    rating: 5.0,
    completedTranslations: 89,
    responseTime: '< 30 min',
    isVerified: true,
    isAvailable: false,
  },
  {
    id: '4',
    name: 'Ahmed Hassan',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200',
    languages: ['Arabic', 'English', 'French'],
    specializations: ['Legal', 'Immigration', 'Religious'],
    rating: 4.7,
    completedTranslations: 112,
    responseTime: '< 3 hours',
    isVerified: true,
    isAvailable: true,
  },
  {
    id: '5',
    name: 'Kwame Asante',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200',
    languages: ['Twi', 'English', 'French'],
    specializations: ['Immigration', 'Education'],
    rating: 4.6,
    completedTranslations: 67,
    responseTime: '< 4 hours',
    isVerified: false,
    isAvailable: true,
  },
];

const DOCUMENT_TYPES = ['Immigration', 'Medical', 'Legal', 'Education', 'Financial', 'Personal'];
const LANGUAGES = ['English', 'Spanish', 'French', 'Arabic', 'Portuguese', 'Swahili', 'Yoruba', 'Twi', 'Wolof', 'Amharic'];

export default function DocumentTranslationScreen() {
  const [activeTab, setActiveTab] = useState<'request' | 'helpers' | 'history'>('helpers');
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredHelpers = MOCK_HELPERS.filter(helper => {
    return searchQuery === '' ||
      helper.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      helper.languages.some(l => l.toLowerCase().includes(searchQuery.toLowerCase())) ||
      helper.specializations.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));
  });

  return (
    <View className="flex-1 bg-[#F0F9FF]">
      <SafeAreaView edges={['top']} className="flex-1">
        {/* Header */}
        <View className="px-5 pb-4 bg-white">
          <View className="flex-row items-center justify-between mb-4">
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.back();
              }}
              className="w-10 h-10 rounded-full bg-blue-100 items-center justify-center"
            >
              <ArrowLeft size={20} color="#2563EB" />
            </Pressable>
            <View className="flex-row items-center">
              <Languages size={20} color="#2563EB" />
              <Text className="text-gray-800 text-lg font-bold ml-2">Document Translation</Text>
            </View>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                setShowRequestModal(true);
              }}
              className="w-10 h-10 rounded-full bg-blue-500 items-center justify-center"
            >
              <FileText size={20} color="#fff" />
            </Pressable>
          </View>

          {/* Hero Banner */}
          <LinearGradient
            colors={['#2563EB', '#1D4ED8']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ borderRadius: 20, padding: 16, marginBottom: 16 }}
          >
            <View className="flex-row items-center">
              <View className="flex-1">
                <Text className="text-white/80 text-sm">Community-Powered</Text>
                <Text className="text-white text-xl font-bold">Document Translation</Text>
                <Text className="text-white/70 text-sm mt-1">Get help translating official documents from bilingual community members</Text>
              </View>
              <View className="w-16 h-16 rounded-full bg-white/20 items-center justify-center">
                <FileText size={32} color="#fff" />
              </View>
            </View>
          </LinearGradient>

          {/* Tab Selector */}
          <View className="flex-row bg-gray-100 rounded-2xl p-1">
            {[
              { key: 'helpers', label: 'Find Helpers' },
              { key: 'request', label: 'My Requests' },
              { key: 'history', label: 'History' },
            ].map((tab) => (
              <Pressable
                key={tab.key}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setActiveTab(tab.key as any);
                }}
                className={`flex-1 py-2.5 rounded-xl items-center ${
                  activeTab === tab.key ? 'bg-white shadow-sm' : ''
                }`}
              >
                <Text className={`font-medium ${
                  activeTab === tab.key ? 'text-blue-600' : 'text-gray-500'
                }`}>
                  {tab.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {activeTab === 'helpers' && (
          <>
            {/* Search */}
            <View className="px-5 py-4">
              <View className="flex-row items-center bg-white rounded-2xl px-4 py-3 shadow-sm">
                <Search size={18} color="#9CA3AF" />
                <TextInput
                  placeholder="Search by language or specialization..."
                  placeholderTextColor="#9CA3AF"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  className="flex-1 ml-3 text-gray-800 text-base"
                />
              </View>
            </View>

            {/* Helpers List */}
            <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
              {filteredHelpers.map((helper, index) => (
                <Animated.View
                  key={helper.id}
                  entering={FadeInDown.delay(index * 60).springify()}
                >
                  <Pressable className="bg-white rounded-2xl p-4 mb-3 shadow-sm">
                    <View className="flex-row items-start">
                      <View className="relative">
                        <Image
                          source={{ uri: helper.avatar }}
                          style={{ width: 56, height: 56, borderRadius: 28 }}
                          contentFit="cover"
                        />
                        {helper.isAvailable ? (
                          <View className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-green-500 border-2 border-white" />
                        ) : (
                          <View className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-gray-400 border-2 border-white" />
                        )}
                      </View>

                      <View className="flex-1 ml-3">
                        <View className="flex-row items-center">
                          <Text className="text-gray-800 font-bold text-base">{helper.name}</Text>
                          {helper.isVerified && (
                            <View className="ml-1.5 w-4 h-4 rounded-full bg-blue-500 items-center justify-center">
                              <Check size={10} color="#fff" />
                            </View>
                          )}
                        </View>

                        <View className="flex-row items-center mt-1">
                          <Star size={14} color="#FBBF24" fill="#FBBF24" />
                          <Text className="text-gray-600 text-sm ml-1">{helper.rating}</Text>
                          <Text className="text-gray-400 mx-1">•</Text>
                          <Text className="text-gray-500 text-sm">{helper.completedTranslations} translations</Text>
                        </View>

                        {/* Languages */}
                        <View className="flex-row flex-wrap gap-1 mt-2">
                          {helper.languages.slice(0, 4).map((lang, idx) => (
                            <View key={idx} className="bg-blue-100 px-2 py-0.5 rounded-full">
                              <Text className="text-blue-700 text-xs">{lang}</Text>
                            </View>
                          ))}
                        </View>

                        {/* Specializations */}
                        <View className="flex-row flex-wrap gap-1 mt-1">
                          {helper.specializations.map((spec, idx) => (
                            <View key={idx} className="bg-gray-100 px-2 py-0.5 rounded-full">
                              <Text className="text-gray-600 text-xs">{spec}</Text>
                            </View>
                          ))}
                        </View>
                      </View>
                    </View>

                    <View className="flex-row items-center justify-between mt-3 pt-3 border-t border-gray-100">
                      <View className="flex-row items-center">
                        <Clock size={14} color="#9CA3AF" />
                        <Text className="text-gray-500 text-sm ml-1">Responds {helper.responseTime}</Text>
                      </View>
                      <Pressable
                        onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)}
                        className={`flex-row items-center px-4 py-2 rounded-full ${
                          helper.isAvailable ? 'bg-blue-500' : 'bg-gray-200'
                        }`}
                        disabled={!helper.isAvailable}
                      >
                        <MessageCircle size={14} color={helper.isAvailable ? '#fff' : '#9CA3AF'} />
                        <Text className={`ml-1.5 font-medium ${helper.isAvailable ? 'text-white' : 'text-gray-400'}`}>
                          {helper.isAvailable ? 'Request Help' : 'Unavailable'}
                        </Text>
                      </Pressable>
                    </View>
                  </Pressable>
                </Animated.View>
              ))}

              <View className="h-32" />
            </ScrollView>
          </>
        )}

        {activeTab === 'request' && (
          <ScrollView className="flex-1 px-5 pt-4" showsVerticalScrollIndicator={false}>
            {MOCK_REQUESTS.filter(r => r.type === 'active').map((request, index) => (
              <Animated.View
                key={request.id}
                entering={FadeInDown.delay(index * 60).springify()}
              >
                <View className="bg-white rounded-2xl p-4 mb-3 shadow-sm">
                  <View className="flex-row items-center justify-between mb-3">
                    <View className="flex-row items-center">
                      <FileText size={20} color="#2563EB" />
                      <Text className="text-gray-800 font-bold ml-2">{request.documentType}</Text>
                    </View>
                    <View className={`px-2 py-1 rounded-full ${
                      request.status === 'in_progress' ? 'bg-blue-100' : 'bg-yellow-100'
                    }`}>
                      <Text className={`text-xs font-medium ${
                        request.status === 'in_progress' ? 'text-blue-700' : 'text-yellow-700'
                      }`}>
                        {request.status === 'in_progress' ? 'In Progress' : 'Pending'}
                      </Text>
                    </View>
                  </View>

                  <View className="flex-row items-center mb-3">
                    <Text className="text-gray-600">{request.fromLanguage}</Text>
                    <ChevronRight size={16} color="#9CA3AF" />
                    <Text className="text-gray-600">{request.toLanguage}</Text>
                    {request.urgency === 'urgent' && (
                      <View className="ml-2 bg-red-100 px-2 py-0.5 rounded-full">
                        <Text className="text-red-600 text-xs font-medium">Urgent</Text>
                      </View>
                    )}
                  </View>

                  {request.helper && (
                    <View className="flex-row items-center p-3 bg-blue-50 rounded-xl">
                      <Image
                        source={{ uri: request.helper.avatar }}
                        style={{ width: 36, height: 36, borderRadius: 18 }}
                        contentFit="cover"
                      />
                      <View className="ml-3">
                        <Text className="text-gray-800 font-medium">{request.helper.name}</Text>
                        <View className="flex-row items-center">
                          <Star size={12} color="#FBBF24" fill="#FBBF24" />
                          <Text className="text-gray-500 text-xs ml-1">{request.helper.rating}</Text>
                        </View>
                      </View>
                      <Pressable className="ml-auto bg-blue-500 px-3 py-1.5 rounded-full">
                        <Text className="text-white font-medium text-sm">Message</Text>
                      </Pressable>
                    </View>
                  )}

                  <Text className="text-gray-400 text-xs mt-3">Requested {request.requestedAt}</Text>
                </View>
              </Animated.View>
            ))}

            {MOCK_REQUESTS.filter(r => r.type === 'active').length === 0 && (
              <View className="items-center py-12">
                <FileText size={48} color="#CBD5E1" />
                <Text className="text-gray-500 mt-3">No active requests</Text>
                <Pressable
                  onPress={() => setShowRequestModal(true)}
                  className="bg-blue-500 px-6 py-3 rounded-full mt-4"
                >
                  <Text className="text-white font-medium">Request Translation</Text>
                </Pressable>
              </View>
            )}

            <View className="h-32" />
          </ScrollView>
        )}

        {activeTab === 'history' && (
          <ScrollView className="flex-1 px-5 pt-4" showsVerticalScrollIndicator={false}>
            {MOCK_REQUESTS.filter(r => r.type === 'completed').map((request, index) => (
              <Animated.View
                key={request.id}
                entering={FadeInDown.delay(index * 60).springify()}
              >
                <View className="bg-white rounded-2xl p-4 mb-3 shadow-sm">
                  <View className="flex-row items-center justify-between mb-2">
                    <View className="flex-row items-center">
                      <FileText size={20} color="#10B981" />
                      <Text className="text-gray-800 font-bold ml-2">{request.documentType}</Text>
                    </View>
                    <View className="bg-green-100 px-2 py-1 rounded-full">
                      <Text className="text-green-700 text-xs font-medium">Completed</Text>
                    </View>
                  </View>

                  <Text className="text-gray-500 text-sm">{request.fromLanguage} → {request.toLanguage}</Text>

                  {request.helper && (
                    <View className="flex-row items-center mt-3 pt-3 border-t border-gray-100">
                      <Image
                        source={{ uri: request.helper.avatar }}
                        style={{ width: 28, height: 28, borderRadius: 14 }}
                        contentFit="cover"
                      />
                      <Text className="text-gray-600 text-sm ml-2">Translated by {request.helper.name}</Text>
                    </View>
                  )}

                  <Text className="text-gray-400 text-xs mt-2">Completed {request.completedAt}</Text>
                </View>
              </Animated.View>
            ))}

            <View className="h-32" />
          </ScrollView>
        )}

        {/* Request Modal */}
        <Modal visible={showRequestModal} animationType="slide" transparent>
          <View className="flex-1 bg-black/50 justify-end">
            <View className="bg-white rounded-t-3xl p-6">
              <View className="flex-row items-center justify-between mb-6">
                <Text className="text-gray-800 text-xl font-bold">Request Translation</Text>
                <Pressable
                  onPress={() => setShowRequestModal(false)}
                  className="w-8 h-8 rounded-full bg-gray-100 items-center justify-center"
                >
                  <X size={18} color="#6B7280" />
                </Pressable>
              </View>

              <View className="mb-4">
                <Text className="text-gray-600 text-sm mb-2">Document Type</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }}>
                  <View className="flex-row gap-2">
                    {DOCUMENT_TYPES.map((type) => (
                      <Pressable key={type} className="px-4 py-2 rounded-full bg-gray-100">
                        <Text className="text-gray-700">{type}</Text>
                      </Pressable>
                    ))}
                  </View>
                </ScrollView>
              </View>

              <View className="flex-row gap-3 mb-4">
                <View className="flex-1">
                  <Text className="text-gray-600 text-sm mb-2">From Language</Text>
                  <View className="bg-gray-100 rounded-xl px-4 py-3">
                    <Text className="text-gray-700">Select...</Text>
                  </View>
                </View>
                <View className="flex-1">
                  <Text className="text-gray-600 text-sm mb-2">To Language</Text>
                  <View className="bg-gray-100 rounded-xl px-4 py-3">
                    <Text className="text-gray-700">Select...</Text>
                  </View>
                </View>
              </View>

              {/* Upload Options */}
              <View className="mb-6">
                <Text className="text-gray-600 text-sm mb-2">Upload Document</Text>
                <View className="flex-row gap-3">
                  <Pressable className="flex-1 bg-gray-100 rounded-xl py-6 items-center">
                    <Upload size={24} color="#6B7280" />
                    <Text className="text-gray-600 text-sm mt-2">Upload File</Text>
                  </Pressable>
                  <Pressable className="flex-1 bg-gray-100 rounded-xl py-6 items-center">
                    <Camera size={24} color="#6B7280" />
                    <Text className="text-gray-600 text-sm mt-2">Take Photo</Text>
                  </Pressable>
                </View>
              </View>

              <Pressable
                onPress={() => {
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                  setShowRequestModal(false);
                }}
                className="bg-blue-500 rounded-xl py-4 items-center"
              >
                <Text className="text-white font-bold text-lg">Submit Request</Text>
              </Pressable>

              <View className="h-8" />
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </View>
  );
}
