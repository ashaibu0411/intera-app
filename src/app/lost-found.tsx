import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { ArrowLeft, Search, MapPin, Calendar, Plus, X, Check, AlertCircle, Eye, MessageCircle, Share2 } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';

interface LostFoundItem {
  id: string;
  type: 'lost' | 'found';
  title: string;
  category: string;
  description: string;
  images: string[];
  location: string;
  date: string;
  poster: {
    name: string;
    avatar: string;
  };
  reward?: string;
  status: 'active' | 'resolved';
  views: number;
  responses: number;
}

const MOCK_ITEMS: LostFoundItem[] = [
  {
    id: '1',
    type: 'lost',
    title: 'Lost Gold Necklace',
    category: 'Jewelry',
    description: 'Lost my grandmother\'s gold necklace with a heart pendant near Central Park. Very sentimental value. Please help!',
    images: ['https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400'],
    location: 'Central Park, Manhattan',
    date: '2 hours ago',
    poster: {
      name: 'Amara Johnson',
      avatar: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=200',
    },
    reward: '$200',
    status: 'active',
    views: 234,
    responses: 5,
  },
  {
    id: '2',
    type: 'found',
    title: 'Found iPhone 15 Pro',
    category: 'Electronics',
    description: 'Found an iPhone 15 Pro in a blue case on the A train. Screen is locked. Contact me to verify and claim.',
    images: ['https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400'],
    location: 'A Train, 125th St Station',
    date: '5 hours ago',
    poster: {
      name: 'Marcus Williams',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200',
    },
    status: 'active',
    views: 456,
    responses: 12,
  },
  {
    id: '3',
    type: 'lost',
    title: 'Missing Tabby Cat "Simba"',
    category: 'Pets',
    description: 'Orange tabby cat, male, 3 years old. Very friendly. Went missing from our backyard. Has a blue collar with tags.',
    images: ['https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400'],
    location: 'Bed-Stuy, Brooklyn',
    date: '1 day ago',
    poster: {
      name: 'Keisha Thompson',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200',
    },
    reward: '$150',
    status: 'active',
    views: 892,
    responses: 23,
  },
  {
    id: '4',
    type: 'found',
    title: 'Found Set of Keys',
    category: 'Keys',
    description: 'Found a set of 5 keys with a red keychain that says "Home Sweet Home" near the coffee shop on 5th Ave.',
    images: ['https://images.unsplash.com/photo-1582139329536-e7284fece509?w=400'],
    location: '5th Avenue, Manhattan',
    date: '3 hours ago',
    poster: {
      name: 'David Okonkwo',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200',
    },
    status: 'active',
    views: 123,
    responses: 2,
  },
  {
    id: '5',
    type: 'lost',
    title: 'Lost Wallet - Brown Leather',
    category: 'Wallet/Purse',
    description: 'Lost my brown leather wallet with ID, credit cards, and some cash. Last seen at the gym on 42nd street.',
    images: ['https://images.unsplash.com/photo-1627123424574-724758594e93?w=400'],
    location: 'Times Square Area',
    date: '6 hours ago',
    poster: {
      name: 'James Chen',
      avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200',
    },
    reward: '$100',
    status: 'active',
    views: 345,
    responses: 8,
  },
  {
    id: '6',
    type: 'found',
    title: 'Found Prescription Glasses',
    category: 'Accessories',
    description: 'Found black prescription glasses with a designer frame near the library. They were in a red case.',
    images: ['https://images.unsplash.com/photo-1574258495973-f010dfbb5371?w=400'],
    location: 'Public Library, Brooklyn',
    date: '1 day ago',
    poster: {
      name: 'Fatima Hassan',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
    },
    status: 'resolved',
    views: 234,
    responses: 4,
  },
];

const CATEGORIES = ['All', 'Electronics', 'Jewelry', 'Pets', 'Wallet/Purse', 'Keys', 'Accessories', 'Documents', 'Other'];

export default function LostFoundScreen() {
  const router = useRouter();
  const [selectedType, setSelectedType] = useState<'all' | 'lost' | 'found'>('all');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [showPostModal, setShowPostModal] = useState(false);
  const [newItem, setNewItem] = useState({
    type: 'lost' as 'lost' | 'found',
    title: '',
    category: '',
    description: '',
    location: '',
    reward: '',
  });

  const filteredItems = MOCK_ITEMS.filter(item => {
    const matchesType = selectedType === 'all' || item.type === selectedType;
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    const matchesSearch = searchQuery === '' ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.location.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesCategory && matchesSearch;
  });

  return (
    <View className="flex-1 bg-[#FAFAFA]">
      <SafeAreaView edges={['top']} className="flex-1">
        {/* Header */}
        <View className="px-5 pb-4 bg-white">
          <View className="flex-row items-center justify-between mb-4">
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.back();
              }}
              className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center"
            >
              <ArrowLeft size={20} color="#374151" />
            </Pressable>
            <View className="flex-row items-center">
              <AlertCircle size={20} color="#EF4444" />
              <Text className="text-gray-800 text-lg font-bold ml-2">Lost & Found</Text>
            </View>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                setShowPostModal(true);
              }}
              className="w-10 h-10 rounded-full bg-red-500 items-center justify-center"
            >
              <Plus size={20} color="#fff" />
            </Pressable>
          </View>

          {/* Type Toggle */}
          <View className="flex-row bg-gray-100 rounded-2xl p-1 mb-4">
            {[
              { key: 'all', label: 'All Items' },
              { key: 'lost', label: 'Lost' },
              { key: 'found', label: 'Found' },
            ].map((type) => (
              <Pressable
                key={type.key}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setSelectedType(type.key as 'all' | 'lost' | 'found');
                }}
                className={`flex-1 py-2.5 rounded-xl items-center ${
                  selectedType === type.key ? 'bg-white shadow-sm' : ''
                }`}
              >
                <Text className={`font-medium ${
                  selectedType === type.key ? 'text-gray-800' : 'text-gray-500'
                }`}>
                  {type.label}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Search */}
          <View className="flex-row items-center bg-gray-100 rounded-2xl px-4 py-3 mb-4">
            <Search size={18} color="#9CA3AF" />
            <TextInput
              placeholder="Search lost or found items..."
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
              className="flex-1 ml-3 text-gray-800 text-base"
            />
          </View>

          {/* Categories */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }}>
            <View className="flex-row gap-2">
              {CATEGORIES.map((category) => (
                <Pressable
                  key={category}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSelectedCategory(category);
                  }}
                  className={`px-4 py-2 rounded-full ${
                    selectedCategory === category
                      ? 'bg-gray-800'
                      : 'bg-gray-100'
                  }`}
                >
                  <Text className={`font-medium ${
                    selectedCategory === category ? 'text-white' : 'text-gray-600'
                  }`}>
                    {category}
                  </Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Items List */}
        <ScrollView className="flex-1 px-5 pt-4" showsVerticalScrollIndicator={false}>
          {filteredItems.map((item, index) => (
            <Animated.View
              key={item.id}
              entering={FadeInDown.delay(index * 80).springify()}
            >
              <Pressable
                onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
                className={`bg-white rounded-3xl overflow-hidden mb-4 shadow-sm ${
                  item.status === 'resolved' ? 'opacity-60' : ''
                }`}
              >
                <View className="flex-row">
                  {/* Image */}
                  <View className="relative">
                    <Image
                      source={{ uri: item.images[0] }}
                      style={{ width: 120, height: 140 }}
                      contentFit="cover"
                    />

                    {/* Type Badge */}
                    <View
                      className={`absolute top-2 left-2 px-2 py-1 rounded-full ${
                        item.type === 'lost' ? 'bg-red-500' : 'bg-green-500'
                      }`}
                    >
                      <Text className="text-white text-xs font-bold uppercase">{item.type}</Text>
                    </View>

                    {/* Resolved Badge */}
                    {item.status === 'resolved' && (
                      <View className="absolute inset-0 bg-black/50 items-center justify-center">
                        <View className="bg-green-500 px-3 py-1.5 rounded-full flex-row items-center">
                          <Check size={14} color="#fff" />
                          <Text className="text-white text-xs font-bold ml-1">RESOLVED</Text>
                        </View>
                      </View>
                    )}
                  </View>

                  {/* Content */}
                  <View className="flex-1 p-3">
                    <Text className="text-gray-800 font-bold text-base mb-1" numberOfLines={1}>{item.title}</Text>
                    <Text className="text-gray-400 text-xs mb-2">{item.category}</Text>

                    <View className="flex-row items-center mb-1">
                      <MapPin size={12} color="#9CA3AF" />
                      <Text className="text-gray-500 text-xs ml-1" numberOfLines={1}>{item.location}</Text>
                    </View>

                    <View className="flex-row items-center mb-2">
                      <Calendar size={12} color="#9CA3AF" />
                      <Text className="text-gray-500 text-xs ml-1">{item.date}</Text>
                    </View>

                    {item.reward && (
                      <View className="bg-amber-100 px-2 py-1 rounded-full self-start mb-2">
                        <Text className="text-amber-700 text-xs font-bold">💰 Reward: {item.reward}</Text>
                      </View>
                    )}

                    {/* Stats */}
                    <View className="flex-row items-center">
                      <View className="flex-row items-center mr-3">
                        <Eye size={12} color="#9CA3AF" />
                        <Text className="text-gray-400 text-xs ml-1">{item.views}</Text>
                      </View>
                      <View className="flex-row items-center">
                        <MessageCircle size={12} color="#9CA3AF" />
                        <Text className="text-gray-400 text-xs ml-1">{item.responses}</Text>
                      </View>
                    </View>
                  </View>
                </View>

                {/* Footer */}
                <View className="flex-row items-center justify-between px-4 py-3 bg-gray-50 border-t border-gray-100">
                  <View className="flex-row items-center">
                    <Image
                      source={{ uri: item.poster.avatar }}
                      style={{ width: 28, height: 28, borderRadius: 14 }}
                      contentFit="cover"
                    />
                    <Text className="text-gray-600 text-sm ml-2">{item.poster.name}</Text>
                  </View>

                  <View className="flex-row items-center gap-2">
                    <Pressable
                      onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
                      className="w-9 h-9 rounded-full bg-gray-200 items-center justify-center"
                    >
                      <Share2 size={16} color="#6B7280" />
                    </Pressable>
                    <Pressable
                      onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)}
                      className="flex-row items-center bg-gray-800 px-4 py-2 rounded-full"
                    >
                      <MessageCircle size={14} color="#fff" />
                      <Text className="text-white font-medium text-sm ml-1.5">Contact</Text>
                    </Pressable>
                  </View>
                </View>
              </Pressable>
            </Animated.View>
          ))}

          <View className="h-32" />
        </ScrollView>

        {/* Post Modal */}
        <Modal visible={showPostModal} animationType="slide" transparent>
          <View className="flex-1 bg-black/50 justify-end">
            <View className="bg-white rounded-t-3xl p-6">
              <View className="flex-row items-center justify-between mb-6">
                <Text className="text-gray-800 text-xl font-bold">Report Item</Text>
                <Pressable
                  onPress={() => setShowPostModal(false)}
                  className="w-8 h-8 rounded-full bg-gray-100 items-center justify-center"
                >
                  <X size={18} color="#6B7280" />
                </Pressable>
              </View>

              {/* Type Selection */}
              <View className="flex-row gap-3 mb-4">
                <Pressable
                  onPress={() => setNewItem(prev => ({ ...prev, type: 'lost' }))}
                  className={`flex-1 py-4 rounded-2xl items-center ${
                    newItem.type === 'lost' ? 'bg-red-500' : 'bg-gray-100'
                  }`}
                >
                  <AlertCircle size={24} color={newItem.type === 'lost' ? '#fff' : '#EF4444'} />
                  <Text className={`font-bold mt-1 ${newItem.type === 'lost' ? 'text-white' : 'text-gray-600'}`}>I Lost Something</Text>
                </Pressable>
                <Pressable
                  onPress={() => setNewItem(prev => ({ ...prev, type: 'found' }))}
                  className={`flex-1 py-4 rounded-2xl items-center ${
                    newItem.type === 'found' ? 'bg-green-500' : 'bg-gray-100'
                  }`}
                >
                  <Check size={24} color={newItem.type === 'found' ? '#fff' : '#10B981'} />
                  <Text className={`font-bold mt-1 ${newItem.type === 'found' ? 'text-white' : 'text-gray-600'}`}>I Found Something</Text>
                </Pressable>
              </View>

              <View className="mb-4">
                <Text className="text-gray-600 text-sm mb-2">What is it?</Text>
                <TextInput
                  placeholder="e.g., Gold Necklace, iPhone, Keys..."
                  placeholderTextColor="#9CA3AF"
                  value={newItem.title}
                  onChangeText={(text) => setNewItem(prev => ({ ...prev, title: text }))}
                  className="bg-gray-100 rounded-xl px-4 py-3 text-gray-800"
                />
              </View>

              <View className="mb-4">
                <Text className="text-gray-600 text-sm mb-2">Where?</Text>
                <TextInput
                  placeholder="Location where it was lost/found"
                  placeholderTextColor="#9CA3AF"
                  value={newItem.location}
                  onChangeText={(text) => setNewItem(prev => ({ ...prev, location: text }))}
                  className="bg-gray-100 rounded-xl px-4 py-3 text-gray-800"
                />
              </View>

              <View className="mb-4">
                <Text className="text-gray-600 text-sm mb-2">Description</Text>
                <TextInput
                  placeholder="Describe the item in detail..."
                  placeholderTextColor="#9CA3AF"
                  value={newItem.description}
                  onChangeText={(text) => setNewItem(prev => ({ ...prev, description: text }))}
                  multiline
                  numberOfLines={3}
                  className="bg-gray-100 rounded-xl px-4 py-3 text-gray-800 h-20"
                  textAlignVertical="top"
                />
              </View>

              {newItem.type === 'lost' && (
                <View className="mb-6">
                  <Text className="text-gray-600 text-sm mb-2">Reward (Optional)</Text>
                  <TextInput
                    placeholder="$0"
                    placeholderTextColor="#9CA3AF"
                    value={newItem.reward}
                    onChangeText={(text) => setNewItem(prev => ({ ...prev, reward: text }))}
                    keyboardType="number-pad"
                    className="bg-gray-100 rounded-xl px-4 py-3 text-gray-800"
                  />
                </View>
              )}

              <Pressable
                onPress={() => {
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                  setShowPostModal(false);
                }}
                className={`rounded-xl py-4 items-center ${
                  newItem.type === 'lost' ? 'bg-red-500' : 'bg-green-500'
                }`}
              >
                <Text className="text-white font-bold text-lg">Post {newItem.type === 'lost' ? 'Lost' : 'Found'} Item</Text>
              </Pressable>

              <View className="h-8" />
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </View>
  );
}
