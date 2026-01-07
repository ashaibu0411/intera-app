import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { ArrowLeft, Search, Heart, MessageCircle, MapPin, Plus, X, Dog, Cat, Bird, Fish, Rabbit } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown, FadeIn, useAnimatedStyle, withSpring, useSharedValue } from 'react-native-reanimated';

interface Pet {
  id: string;
  name: string;
  type: 'dog' | 'cat' | 'bird' | 'fish' | 'rabbit' | 'other';
  breed: string;
  age: string;
  image: string;
  owner: {
    name: string;
    avatar: string;
    location: string;
  };
  personality: string[];
  lookingFor: ('playdate' | 'walking-buddy' | 'pet-sitting' | 'breeding')[];
  description: string;
  isVaccinated: boolean;
  isNeutered: boolean;
  likes: number;
  isLiked: boolean;
}

const MOCK_PETS: Pet[] = [
  {
    id: '1',
    name: 'Zeus',
    type: 'dog',
    breed: 'German Shepherd',
    age: '2 years',
    image: 'https://images.unsplash.com/photo-1589941013453-ec89f33b5e95?w=400',
    owner: {
      name: 'Marcus Johnson',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200',
      location: 'Brooklyn, NY',
    },
    personality: ['Playful', 'Friendly', 'Energetic'],
    lookingFor: ['playdate', 'walking-buddy'],
    description: 'Zeus loves meeting new furry friends! He\'s great with other dogs and loves long walks in the park.',
    isVaccinated: true,
    isNeutered: true,
    likes: 45,
    isLiked: false,
  },
  {
    id: '2',
    name: 'Luna',
    type: 'cat',
    breed: 'Persian',
    age: '3 years',
    image: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400',
    owner: {
      name: 'Aisha Mohammed',
      avatar: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=200',
      location: 'Manhattan, NY',
    },
    personality: ['Calm', 'Affectionate', 'Indoor'],
    lookingFor: ['pet-sitting'],
    description: 'Looking for a trusted pet sitter when I travel for work. Luna is very low maintenance and loves cuddles.',
    isVaccinated: true,
    isNeutered: true,
    likes: 78,
    isLiked: true,
  },
  {
    id: '3',
    name: 'Simba',
    type: 'dog',
    breed: 'Golden Retriever',
    age: '1 year',
    image: 'https://images.unsplash.com/photo-1633722715463-d30f4f325e24?w=400',
    owner: {
      name: 'David Okonkwo',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200',
      location: 'Queens, NY',
    },
    personality: ['Super Friendly', 'Loves Water', 'Playful'],
    lookingFor: ['playdate', 'walking-buddy'],
    description: 'Simba is a bundle of joy! He\'s looking for other dogs to play with at the park on weekends.',
    isVaccinated: true,
    isNeutered: false,
    likes: 124,
    isLiked: false,
  },
  {
    id: '4',
    name: 'Nala',
    type: 'cat',
    breed: 'Maine Coon',
    age: '4 years',
    image: 'https://images.unsplash.com/photo-1615789591457-74a63395c990?w=400',
    owner: {
      name: 'Keisha Williams',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200',
      location: 'Bronx, NY',
    },
    personality: ['Gentle Giant', 'Curious', 'Loves Heights'],
    lookingFor: ['pet-sitting', 'playdate'],
    description: 'Nala is a majestic Maine Coon who gets along with other cats. Looking for play dates and occasional sitting.',
    isVaccinated: true,
    isNeutered: true,
    likes: 89,
    isLiked: false,
  },
  {
    id: '5',
    name: 'Rio',
    type: 'bird',
    breed: 'African Grey Parrot',
    age: '5 years',
    image: 'https://images.unsplash.com/photo-1552728089-57bdde30beb3?w=400',
    owner: {
      name: 'James Chen',
      avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200',
      location: 'Staten Island, NY',
    },
    personality: ['Talkative', 'Intelligent', 'Social'],
    lookingFor: ['pet-sitting'],
    description: 'Rio can speak over 100 words! Looking for an experienced bird sitter when I\'m away.',
    isVaccinated: true,
    isNeutered: false,
    likes: 56,
    isLiked: true,
  },
  {
    id: '6',
    name: 'Max',
    type: 'dog',
    breed: 'French Bulldog',
    age: '2 years',
    image: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=400',
    owner: {
      name: 'Fatima Hassan',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
      location: 'Harlem, NY',
    },
    personality: ['Lazy', 'Cuddly', 'Snores'],
    lookingFor: ['playdate', 'pet-sitting'],
    description: 'Max is a couch potato who loves short walks and long naps. Great with kids and other small dogs!',
    isVaccinated: true,
    isNeutered: true,
    likes: 167,
    isLiked: false,
  },
];

const PET_TYPES = [
  { key: 'all', label: 'All Pets', icon: Heart },
  { key: 'dog', label: 'Dogs', icon: Dog },
  { key: 'cat', label: 'Cats', icon: Cat },
  { key: 'bird', label: 'Birds', icon: Bird },
  { key: 'rabbit', label: 'Rabbits', icon: Rabbit },
  { key: 'fish', label: 'Fish', icon: Fish },
];

const LOOKING_FOR_COLORS = {
  playdate: '#10B981',
  'walking-buddy': '#3B82F6',
  'pet-sitting': '#F59E0B',
  breeding: '#EC4899',
};

const LOOKING_FOR_LABELS = {
  playdate: 'Playdate',
  'walking-buddy': 'Walking Buddy',
  'pet-sitting': 'Pet Sitting',
  breeding: 'Breeding',
};

export default function PetConnectScreen() {
  const router = useRouter();
  const [selectedType, setSelectedType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [pets, setPets] = useState(MOCK_PETS);
  const [showAddModal, setShowAddModal] = useState(false);

  const filteredPets = pets.filter(pet => {
    const matchesType = selectedType === 'all' || pet.type === selectedType;
    const matchesSearch = searchQuery === '' ||
      pet.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pet.breed.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pet.owner.location.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  const toggleLike = (petId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setPets(prev => prev.map(pet => {
      if (pet.id === petId) {
        return {
          ...pet,
          isLiked: !pet.isLiked,
          likes: pet.isLiked ? pet.likes - 1 : pet.likes + 1,
        };
      }
      return pet;
    }));
  };

  return (
    <View className="flex-1 bg-[#FFF8F0]">
      <SafeAreaView edges={['top']} className="flex-1">
        {/* Header */}
        <View className="px-5 pb-4">
          <View className="flex-row items-center justify-between mb-4">
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.back();
              }}
              className="w-10 h-10 rounded-full bg-orange-100 items-center justify-center"
            >
              <ArrowLeft size={20} color="#EA580C" />
            </Pressable>
            <View className="flex-row items-center">
              <Text className="text-2xl mr-2">🐾</Text>
              <Text className="text-gray-800 text-lg font-bold">Pet Connect</Text>
            </View>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                setShowAddModal(true);
              }}
              className="w-10 h-10 rounded-full bg-orange-500 items-center justify-center"
            >
              <Plus size={20} color="#fff" />
            </Pressable>
          </View>

          {/* Search */}
          <View className="flex-row items-center bg-white rounded-2xl px-4 py-3 mb-4 shadow-sm">
            <Search size={18} color="#9CA3AF" />
            <TextInput
              placeholder="Search pets, breeds, locations..."
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
              className="flex-1 ml-3 text-gray-800 text-base"
            />
          </View>

          {/* Pet Type Filter */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }}>
            <View className="flex-row gap-2">
              {PET_TYPES.map((type) => {
                const Icon = type.icon;
                return (
                  <Pressable
                    key={type.key}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setSelectedType(type.key);
                    }}
                    className={`flex-row items-center px-4 py-2.5 rounded-full ${
                      selectedType === type.key
                        ? 'bg-orange-500'
                        : 'bg-white'
                    }`}
                    style={selectedType !== type.key ? { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 } : {}}
                  >
                    <Icon size={16} color={selectedType === type.key ? '#fff' : '#EA580C'} />
                    <Text className={`ml-2 font-medium ${
                      selectedType === type.key ? 'text-white' : 'text-gray-700'
                    }`}>
                      {type.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>
        </View>

        {/* Pets Grid */}
        <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
          <View className="flex-row flex-wrap justify-between">
            {filteredPets.map((pet, index) => (
              <Animated.View
                key={pet.id}
                entering={FadeInDown.delay(index * 80).springify()}
                className="w-[48%] mb-4"
              >
                <Pressable
                  onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
                  className="bg-white rounded-3xl overflow-hidden shadow-sm"
                >
                  {/* Pet Image */}
                  <View className="relative">
                    <Image
                      source={{ uri: pet.image }}
                      style={{ width: '100%', height: 160 }}
                      contentFit="cover"
                    />

                    {/* Like Button */}
                    <Pressable
                      onPress={() => toggleLike(pet.id)}
                      className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/90 items-center justify-center"
                    >
                      <Heart
                        size={18}
                        color={pet.isLiked ? '#EF4444' : '#9CA3AF'}
                        fill={pet.isLiked ? '#EF4444' : 'transparent'}
                      />
                    </Pressable>

                    {/* Vaccinated Badge */}
                    {pet.isVaccinated && (
                      <View className="absolute top-2 left-2 bg-green-500 px-2 py-1 rounded-full">
                        <Text className="text-white text-xs font-bold">✓ Vaccinated</Text>
                      </View>
                    )}
                  </View>

                  {/* Pet Info */}
                  <View className="p-3">
                    <View className="flex-row items-center justify-between mb-1">
                      <Text className="text-gray-800 font-bold text-base">{pet.name}</Text>
                      <Text className="text-gray-500 text-xs">{pet.age}</Text>
                    </View>
                    <Text className="text-gray-500 text-sm mb-2">{pet.breed}</Text>

                    {/* Personality Tags */}
                    <View className="flex-row flex-wrap gap-1 mb-2">
                      {pet.personality.slice(0, 2).map((trait, idx) => (
                        <View key={idx} className="bg-orange-100 px-2 py-0.5 rounded-full">
                          <Text className="text-orange-600 text-xs">{trait}</Text>
                        </View>
                      ))}
                    </View>

                    {/* Looking For */}
                    <View className="flex-row flex-wrap gap-1 mb-2">
                      {pet.lookingFor.slice(0, 1).map((item, idx) => (
                        <View
                          key={idx}
                          className="px-2 py-0.5 rounded-full"
                          style={{ backgroundColor: LOOKING_FOR_COLORS[item] + '20' }}
                        >
                          <Text style={{ color: LOOKING_FOR_COLORS[item] }} className="text-xs font-medium">
                            {LOOKING_FOR_LABELS[item]}
                          </Text>
                        </View>
                      ))}
                    </View>

                    {/* Owner & Location */}
                    <View className="flex-row items-center">
                      <Image
                        source={{ uri: pet.owner.avatar }}
                        style={{ width: 20, height: 20, borderRadius: 10 }}
                        contentFit="cover"
                      />
                      <View className="flex-row items-center ml-2">
                        <MapPin size={10} color="#9CA3AF" />
                        <Text className="text-gray-500 text-xs ml-0.5">{pet.owner.location}</Text>
                      </View>
                    </View>
                  </View>

                  {/* Action Button */}
                  <Pressable
                    onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)}
                    className="bg-orange-500 py-2.5 items-center"
                  >
                    <View className="flex-row items-center">
                      <MessageCircle size={14} color="#fff" />
                      <Text className="text-white font-semibold ml-1.5">Connect</Text>
                    </View>
                  </Pressable>
                </Pressable>
              </Animated.View>
            ))}
          </View>

          <View className="h-32" />
        </ScrollView>

        {/* Add Pet Modal */}
        <Modal visible={showAddModal} animationType="slide" transparent>
          <View className="flex-1 bg-black/50 justify-end">
            <View className="bg-white rounded-t-3xl p-6">
              <View className="flex-row items-center justify-between mb-6">
                <Text className="text-gray-800 text-xl font-bold">Add Your Pet</Text>
                <Pressable
                  onPress={() => setShowAddModal(false)}
                  className="w-8 h-8 rounded-full bg-gray-100 items-center justify-center"
                >
                  <X size={18} color="#6B7280" />
                </Pressable>
              </View>

              <View className="mb-4">
                <Text className="text-gray-600 text-sm mb-2">Pet Name</Text>
                <TextInput
                  placeholder="Enter your pet's name"
                  placeholderTextColor="#9CA3AF"
                  className="bg-gray-100 rounded-xl px-4 py-3 text-gray-800"
                />
              </View>

              <View className="flex-row gap-3 mb-4">
                <View className="flex-1">
                  <Text className="text-gray-600 text-sm mb-2">Pet Type</Text>
                  <TextInput
                    placeholder="Dog, Cat..."
                    placeholderTextColor="#9CA3AF"
                    className="bg-gray-100 rounded-xl px-4 py-3 text-gray-800"
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-gray-600 text-sm mb-2">Breed</Text>
                  <TextInput
                    placeholder="Breed"
                    placeholderTextColor="#9CA3AF"
                    className="bg-gray-100 rounded-xl px-4 py-3 text-gray-800"
                  />
                </View>
              </View>

              <View className="mb-4">
                <Text className="text-gray-600 text-sm mb-2">What are you looking for?</Text>
                <View className="flex-row flex-wrap gap-2">
                  {Object.entries(LOOKING_FOR_LABELS).map(([key, label]) => (
                    <Pressable
                      key={key}
                      className="px-4 py-2 rounded-full bg-gray-100"
                    >
                      <Text className="text-gray-600">{label}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              <View className="mb-6">
                <Text className="text-gray-600 text-sm mb-2">Description</Text>
                <TextInput
                  placeholder="Tell us about your pet..."
                  placeholderTextColor="#9CA3AF"
                  multiline
                  numberOfLines={3}
                  className="bg-gray-100 rounded-xl px-4 py-3 text-gray-800 h-20"
                  textAlignVertical="top"
                />
              </View>

              <Pressable
                onPress={() => {
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                  setShowAddModal(false);
                }}
                className="bg-orange-500 rounded-xl py-4 items-center"
              >
                <Text className="text-white font-bold text-lg">Add Pet Profile</Text>
              </Pressable>

              <View className="h-8" />
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </View>
  );
}
