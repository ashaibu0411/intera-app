import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { ArrowLeft, Search, Home, DollarSign, Users, MapPin, Calendar, Bed, Bath, Car, Wifi, Check, X, Plus, MessageCircle, Heart, Filter } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';

interface HousingListing {
  id: string;
  type: 'room' | 'apartment' | 'house' | 'sublet';
  title: string;
  price: string;
  priceType: 'month' | 'week';
  location: string;
  neighborhood: string;
  images: string[];
  bedrooms: number;
  bathrooms: number;
  sqft: string;
  availableDate: string;
  amenities: string[];
  poster: {
    name: string;
    avatar: string;
    isVerified: boolean;
  };
  description: string;
  preferences: string[];
  isFurnished: boolean;
  utilitiesIncluded: boolean;
  petFriendly: boolean;
  isSaved: boolean;
}

const MOCK_LISTINGS: HousingListing[] = [
  {
    id: '1',
    type: 'room',
    title: 'Sunny Room in Harlem Brownstone',
    price: '$1,200',
    priceType: 'month',
    location: 'Harlem, NY',
    neighborhood: 'Central Harlem',
    images: ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400'],
    bedrooms: 1,
    bathrooms: 1,
    sqft: '200',
    availableDate: 'Feb 1',
    amenities: ['WiFi', 'Laundry', 'Kitchen Access', 'Heating'],
    poster: {
      name: 'Amara Johnson',
      avatar: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=200',
      isVerified: true,
    },
    description: 'Beautiful sunny room in a historic brownstone. Shared kitchen and bathroom with 2 other professionals. Great community vibe!',
    preferences: ['Female preferred', 'Non-smoker', 'Working professional'],
    isFurnished: true,
    utilitiesIncluded: true,
    petFriendly: false,
    isSaved: false,
  },
  {
    id: '2',
    type: 'apartment',
    title: '2BR Apartment in Brooklyn',
    price: '$2,800',
    priceType: 'month',
    location: 'Brooklyn, NY',
    neighborhood: 'Bed-Stuy',
    images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400'],
    bedrooms: 2,
    bathrooms: 1,
    sqft: '850',
    availableDate: 'Jan 15',
    amenities: ['WiFi', 'Dishwasher', 'Laundry in Unit', 'Central AC'],
    poster: {
      name: 'Marcus Williams',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200',
      isVerified: true,
    },
    description: 'Spacious 2-bedroom apartment looking for 1 roommate. Room has great natural light. Close to A/C trains.',
    preferences: ['Clean', 'Quiet hours after 10pm', '420 friendly'],
    isFurnished: false,
    utilitiesIncluded: false,
    petFriendly: true,
    isSaved: true,
  },
  {
    id: '3',
    type: 'sublet',
    title: '3-Month Summer Sublet in Manhattan',
    price: '$1,800',
    priceType: 'month',
    location: 'Manhattan, NY',
    neighborhood: 'Upper West Side',
    images: ['https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400'],
    bedrooms: 1,
    bathrooms: 1,
    sqft: '550',
    availableDate: 'Jun 1 - Aug 31',
    amenities: ['Doorman', 'Gym', 'Rooftop', 'WiFi'],
    poster: {
      name: 'Keisha Thompson',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200',
      isVerified: true,
    },
    description: 'Subletting my apartment while I\'m abroad for the summer. Fully furnished, doorman building, amazing views!',
    preferences: ['Responsible tenant', 'References required'],
    isFurnished: true,
    utilitiesIncluded: true,
    petFriendly: false,
    isSaved: false,
  },
  {
    id: '4',
    type: 'room',
    title: 'Cozy Room Near Columbia',
    price: '$950',
    priceType: 'month',
    location: 'Morningside Heights, NY',
    neighborhood: 'Near Columbia University',
    images: ['https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=400'],
    bedrooms: 1,
    bathrooms: 1,
    sqft: '150',
    availableDate: 'ASAP',
    amenities: ['WiFi', 'Study Space', 'Kitchen Access'],
    poster: {
      name: 'David Chen',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200',
      isVerified: false,
    },
    description: 'Perfect for students! 10 min walk to Columbia campus. Quiet household, great for studying.',
    preferences: ['Student preferred', 'Non-smoker', 'Clean'],
    isFurnished: true,
    utilitiesIncluded: true,
    petFriendly: false,
    isSaved: false,
  },
  {
    id: '5',
    type: 'house',
    title: 'Room in Queens House',
    price: '$1,100',
    priceType: 'month',
    location: 'Jamaica, Queens',
    neighborhood: 'South Jamaica',
    images: ['https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=400'],
    bedrooms: 1,
    bathrooms: 2,
    sqft: '300',
    availableDate: 'Feb 15',
    amenities: ['Parking', 'Backyard', 'Laundry', 'Kitchen'],
    poster: {
      name: 'Fatima Hassan',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
      isVerified: true,
    },
    description: 'Large room in a family home. Caribbean household, home-cooked meals sometimes included! Backyard access.',
    preferences: ['Respectful', 'Family-friendly', 'No parties'],
    isFurnished: true,
    utilitiesIncluded: true,
    petFriendly: true,
    isSaved: false,
  },
];

const LISTING_TYPES = [
  { key: 'all', label: 'All' },
  { key: 'room', label: 'Rooms' },
  { key: 'apartment', label: 'Apartments' },
  { key: 'sublet', label: 'Sublets' },
  { key: 'house', label: 'Houses' },
];

const TYPE_COLORS = {
  room: '#10B981',
  apartment: '#3B82F6',
  sublet: '#F59E0B',
  house: '#8B5CF6',
};

export default function HousingBoardScreen() {
  const router = useRouter();
  const [selectedType, setSelectedType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [listings, setListings] = useState(MOCK_LISTINGS);
  const [showPostModal, setShowPostModal] = useState(false);

  const filteredListings = listings.filter(listing => {
    const matchesType = selectedType === 'all' || listing.type === selectedType;
    const matchesSearch = searchQuery === '' ||
      listing.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      listing.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      listing.neighborhood.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  const toggleSave = (listingId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setListings(prev => prev.map(listing => {
      if (listing.id === listingId) {
        return { ...listing, isSaved: !listing.isSaved };
      }
      return listing;
    }));
  };

  return (
    <View className="flex-1 bg-[#F8FAFC]">
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
              <Home size={20} color="#3B82F6" />
              <Text className="text-gray-800 text-lg font-bold ml-2">Housing Board</Text>
            </View>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                setShowPostModal(true);
              }}
              className="w-10 h-10 rounded-full bg-blue-500 items-center justify-center"
            >
              <Plus size={20} color="#fff" />
            </Pressable>
          </View>

          {/* Search */}
          <View className="flex-row items-center bg-gray-100 rounded-2xl px-4 py-3 mb-4">
            <Search size={18} color="#9CA3AF" />
            <TextInput
              placeholder="Search by location, neighborhood..."
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
              className="flex-1 ml-3 text-gray-800 text-base"
            />
            <Pressable className="w-8 h-8 rounded-lg bg-blue-500 items-center justify-center ml-2">
              <Filter size={16} color="#fff" />
            </Pressable>
          </View>

          {/* Type Filter */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }}>
            <View className="flex-row gap-2">
              {LISTING_TYPES.map((type) => (
                <Pressable
                  key={type.key}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSelectedType(type.key);
                  }}
                  className={`px-4 py-2.5 rounded-full ${
                    selectedType === type.key
                      ? 'bg-blue-500'
                      : 'bg-gray-100'
                  }`}
                >
                  <Text className={`font-medium ${
                    selectedType === type.key ? 'text-white' : 'text-gray-600'
                  }`}>
                    {type.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Listings */}
        <ScrollView className="flex-1 px-5 pt-4" showsVerticalScrollIndicator={false}>
          {filteredListings.map((listing, index) => (
            <Animated.View
              key={listing.id}
              entering={FadeInDown.delay(index * 80).springify()}
            >
              <Pressable
                onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
                className="bg-white rounded-3xl overflow-hidden mb-4 shadow-sm"
              >
                {/* Image */}
                <View className="relative">
                  <Image
                    source={{ uri: listing.images[0] }}
                    style={{ width: '100%', height: 180 }}
                    contentFit="cover"
                  />

                  {/* Type Badge */}
                  <View
                    className="absolute top-3 left-3 px-3 py-1.5 rounded-full"
                    style={{ backgroundColor: TYPE_COLORS[listing.type] }}
                  >
                    <Text className="text-white text-xs font-bold capitalize">{listing.type}</Text>
                  </View>

                  {/* Save Button */}
                  <Pressable
                    onPress={() => toggleSave(listing.id)}
                    className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 items-center justify-center"
                  >
                    <Heart
                      size={18}
                      color={listing.isSaved ? '#EF4444' : '#9CA3AF'}
                      fill={listing.isSaved ? '#EF4444' : 'transparent'}
                    />
                  </Pressable>

                  {/* Price */}
                  <View className="absolute bottom-3 left-3 bg-white/95 px-3 py-1.5 rounded-xl">
                    <Text className="text-gray-800 font-bold text-lg">{listing.price}<Text className="text-gray-500 text-sm font-normal">/{listing.priceType}</Text></Text>
                  </View>
                </View>

                {/* Content */}
                <View className="p-4">
                  <Text className="text-gray-800 font-bold text-lg mb-1">{listing.title}</Text>

                  <View className="flex-row items-center mb-3">
                    <MapPin size={14} color="#6B7280" />
                    <Text className="text-gray-500 text-sm ml-1">{listing.location}</Text>
                    <Text className="text-gray-300 mx-2">•</Text>
                    <Text className="text-gray-500 text-sm">{listing.neighborhood}</Text>
                  </View>

                  {/* Quick Info */}
                  <View className="flex-row items-center mb-3">
                    <View className="flex-row items-center mr-4">
                      <Bed size={14} color="#6B7280" />
                      <Text className="text-gray-600 text-sm ml-1">{listing.bedrooms} bed</Text>
                    </View>
                    <View className="flex-row items-center mr-4">
                      <Bath size={14} color="#6B7280" />
                      <Text className="text-gray-600 text-sm ml-1">{listing.bathrooms} bath</Text>
                    </View>
                    <View className="flex-row items-center">
                      <Calendar size={14} color="#6B7280" />
                      <Text className="text-gray-600 text-sm ml-1">{listing.availableDate}</Text>
                    </View>
                  </View>

                  {/* Features */}
                  <View className="flex-row flex-wrap gap-2 mb-3">
                    {listing.isFurnished && (
                      <View className="flex-row items-center bg-green-100 px-2 py-1 rounded-full">
                        <Check size={12} color="#10B981" />
                        <Text className="text-green-700 text-xs ml-1">Furnished</Text>
                      </View>
                    )}
                    {listing.utilitiesIncluded && (
                      <View className="flex-row items-center bg-blue-100 px-2 py-1 rounded-full">
                        <Wifi size={12} color="#3B82F6" />
                        <Text className="text-blue-700 text-xs ml-1">Utilities Inc.</Text>
                      </View>
                    )}
                    {listing.petFriendly && (
                      <View className="flex-row items-center bg-amber-100 px-2 py-1 rounded-full">
                        <Text className="text-amber-700 text-xs">🐾 Pet Friendly</Text>
                      </View>
                    )}
                  </View>

                  {/* Description */}
                  <Text className="text-gray-500 text-sm mb-3" numberOfLines={2}>{listing.description}</Text>

                  {/* Poster & Action */}
                  <View className="flex-row items-center justify-between pt-3 border-t border-gray-100">
                    <View className="flex-row items-center">
                      <Image
                        source={{ uri: listing.poster.avatar }}
                        style={{ width: 36, height: 36, borderRadius: 18 }}
                        contentFit="cover"
                      />
                      <View className="ml-2">
                        <View className="flex-row items-center">
                          <Text className="text-gray-800 font-medium">{listing.poster.name}</Text>
                          {listing.poster.isVerified && (
                            <View className="ml-1 w-4 h-4 rounded-full bg-blue-500 items-center justify-center">
                              <Check size={10} color="#fff" />
                            </View>
                          )}
                        </View>
                        <Text className="text-gray-400 text-xs">Posted by</Text>
                      </View>
                    </View>
                    <Pressable
                      onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)}
                      className="flex-row items-center bg-blue-500 px-4 py-2.5 rounded-full"
                    >
                      <MessageCircle size={16} color="#fff" />
                      <Text className="text-white font-semibold ml-2">Message</Text>
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
                <Text className="text-gray-800 text-xl font-bold">Post a Listing</Text>
                <Pressable
                  onPress={() => setShowPostModal(false)}
                  className="w-8 h-8 rounded-full bg-gray-100 items-center justify-center"
                >
                  <X size={18} color="#6B7280" />
                </Pressable>
              </View>

              <View className="mb-4">
                <Text className="text-gray-600 text-sm mb-2">Listing Type</Text>
                <View className="flex-row gap-2">
                  {LISTING_TYPES.slice(1).map((type) => (
                    <Pressable
                      key={type.key}
                      className="flex-1 py-2.5 rounded-xl bg-gray-100 items-center"
                    >
                      <Text className="text-gray-600 font-medium">{type.label}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              <View className="mb-4">
                <Text className="text-gray-600 text-sm mb-2">Title</Text>
                <TextInput
                  placeholder="e.g., Sunny Room in Brooklyn"
                  placeholderTextColor="#9CA3AF"
                  className="bg-gray-100 rounded-xl px-4 py-3 text-gray-800"
                />
              </View>

              <View className="flex-row gap-3 mb-4">
                <View className="flex-1">
                  <Text className="text-gray-600 text-sm mb-2">Price</Text>
                  <TextInput
                    placeholder="$0"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="number-pad"
                    className="bg-gray-100 rounded-xl px-4 py-3 text-gray-800"
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-gray-600 text-sm mb-2">Available Date</Text>
                  <TextInput
                    placeholder="Date"
                    placeholderTextColor="#9CA3AF"
                    className="bg-gray-100 rounded-xl px-4 py-3 text-gray-800"
                  />
                </View>
              </View>

              <View className="mb-6">
                <Text className="text-gray-600 text-sm mb-2">Description</Text>
                <TextInput
                  placeholder="Describe your space..."
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
                  setShowPostModal(false);
                }}
                className="bg-blue-500 rounded-xl py-4 items-center"
              >
                <Text className="text-white font-bold text-lg">Post Listing</Text>
              </Pressable>

              <View className="h-8" />
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </View>
  );
}
