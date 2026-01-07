import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { ArrowLeft, Car, MapPin, Calendar, Clock, Users, Star, MessageCircle, Plus, X, ChevronRight, Plane, Briefcase, Music, PartyPopper } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';

interface CarpoolRide {
  id: string;
  driver: {
    name: string;
    avatar: string;
    rating: number;
    rides: number;
    isVerified: boolean;
  };
  from: string;
  fromCity: string;
  to: string;
  toCity: string;
  date: string;
  time: string;
  seats: number;
  seatsAvailable: number;
  price: string;
  type: 'commute' | 'airport' | 'event' | 'road-trip';
  description: string;
  amenities: string[];
  isRecurring: boolean;
}

const MOCK_RIDES: CarpoolRide[] = [
  {
    id: '1',
    driver: {
      name: 'Michael Adeyemi',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200',
      rating: 4.9,
      rides: 156,
      isVerified: true,
    },
    from: 'Harlem, Manhattan',
    fromCity: 'New York',
    to: 'JFK Airport',
    toCity: 'Queens',
    date: 'Tomorrow',
    time: '6:30 AM',
    seats: 4,
    seatsAvailable: 3,
    price: '$25',
    type: 'airport',
    description: 'Early morning airport run. I have a spacious SUV with room for luggage. Playing smooth jazz during the ride.',
    amenities: ['AC', 'Music', 'Luggage Space', 'Charger'],
    isRecurring: false,
  },
  {
    id: '2',
    driver: {
      name: 'Aisha Mohammed',
      avatar: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=200',
      rating: 4.8,
      rides: 89,
      isVerified: true,
    },
    from: 'Brooklyn Heights',
    fromCity: 'Brooklyn',
    to: 'Midtown Manhattan',
    toCity: 'Manhattan',
    date: 'Mon-Fri',
    time: '8:00 AM',
    seats: 3,
    seatsAvailable: 2,
    price: '$10/day',
    type: 'commute',
    description: 'Daily commute to work. Looking for regular carpool partners to share costs. Quiet ride, good for catching up on podcasts.',
    amenities: ['AC', 'Quiet Ride', 'Charger'],
    isRecurring: true,
  },
  {
    id: '3',
    driver: {
      name: 'James Okafor',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200',
      rating: 4.7,
      rides: 45,
      isVerified: true,
    },
    from: 'Atlanta, GA',
    fromCity: 'Atlanta',
    to: 'Essence Festival',
    toCity: 'New Orleans',
    date: 'July 4',
    time: '6:00 AM',
    seats: 4,
    seatsAvailable: 2,
    price: '$75',
    type: 'event',
    description: 'Road trip to Essence Festival! 7-hour drive with good vibes and music. Splitting gas and tolls. Let\'s make it a party!',
    amenities: ['Music', 'Snacks', 'Rest Stops', 'Good Vibes'],
    isRecurring: false,
  },
  {
    id: '4',
    driver: {
      name: 'Keisha Williams',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200',
      rating: 5.0,
      rides: 234,
      isVerified: true,
    },
    from: 'Newark, NJ',
    fromCity: 'Newark',
    to: 'EWR Airport',
    toCity: 'Newark',
    date: 'Today',
    time: '3:00 PM',
    seats: 3,
    seatsAvailable: 2,
    price: '$15',
    type: 'airport',
    description: 'Quick airport drop-off. Can accommodate 2 large suitcases. Clean car with great reviews!',
    amenities: ['AC', 'Luggage Space', 'Charger', 'Water'],
    isRecurring: false,
  },
  {
    id: '5',
    driver: {
      name: 'David Chen',
      avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200',
      rating: 4.6,
      rides: 67,
      isVerified: false,
    },
    from: 'Jersey City',
    fromCity: 'New Jersey',
    to: 'AfroNation Concert',
    toCity: 'Miami',
    date: 'May 25',
    time: '5:00 AM',
    seats: 4,
    seatsAvailable: 3,
    price: '$120',
    type: 'road-trip',
    description: '18-hour road trip to AfroNation Miami! Splitting driving, gas, and snacks. Bringing the Afrobeats playlist. Let\'s go!',
    amenities: ['Music', 'Snacks', 'Rest Stops', 'Luggage Space'],
    isRecurring: false,
  },
];

const RIDE_TYPES = [
  { key: 'all', label: 'All Rides', icon: Car },
  { key: 'airport', label: 'Airport', icon: Plane },
  { key: 'commute', label: 'Commute', icon: Briefcase },
  { key: 'event', label: 'Events', icon: PartyPopper },
  { key: 'road-trip', label: 'Road Trip', icon: Music },
];

const TYPE_COLORS = {
  airport: '#3B82F6',
  commute: '#10B981',
  event: '#F59E0B',
  'road-trip': '#EC4899',
};

export default function CarpoolScreen() {
  const router = useRouter();
  const [selectedType, setSelectedType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showPostModal, setShowPostModal] = useState(false);

  const filteredRides = MOCK_RIDES.filter(ride => {
    const matchesType = selectedType === 'all' || ride.type === selectedType;
    const matchesSearch = searchQuery === '' ||
      ride.from.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ride.to.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ride.driver.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  return (
    <View className="flex-1 bg-[#0A0A0A]">
      <SafeAreaView edges={['top']} className="flex-1">
        {/* Header */}
        <View className="px-5 pb-4">
          <View className="flex-row items-center justify-between mb-4">
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.back();
              }}
              className="w-10 h-10 rounded-full bg-white/10 items-center justify-center"
            >
              <ArrowLeft size={20} color="#fff" />
            </Pressable>
            <View className="flex-row items-center">
              <Car size={20} color="#3B82F6" />
              <Text className="text-white text-lg font-bold ml-2">Carpool</Text>
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
          <View className="flex-row items-center bg-white/10 rounded-2xl px-4 py-3 mb-4">
            <MapPin size={18} color="#9CA3AF" />
            <TextInput
              placeholder="Where are you going?"
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
              className="flex-1 ml-3 text-white text-base"
            />
          </View>

          {/* Ride Type Filter */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }}>
            <View className="flex-row gap-2">
              {RIDE_TYPES.map((type) => {
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
                        ? 'bg-blue-500'
                        : 'bg-white/10'
                    }`}
                  >
                    <Icon size={16} color={selectedType === type.key ? '#fff' : '#9CA3AF'} />
                    <Text className={`ml-2 font-medium ${
                      selectedType === type.key ? 'text-white' : 'text-gray-300'
                    }`}>
                      {type.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>
        </View>

        {/* Rides List */}
        <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
          {filteredRides.map((ride, index) => (
            <Animated.View
              key={ride.id}
              entering={FadeInDown.delay(index * 80).springify()}
            >
              <Pressable
                onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
                className="bg-white/5 rounded-3xl overflow-hidden mb-4 border border-white/10"
              >
                {/* Type Badge */}
                <View
                  className="px-3 py-1.5 self-start m-4 rounded-full"
                  style={{ backgroundColor: TYPE_COLORS[ride.type] + '30' }}
                >
                  <Text style={{ color: TYPE_COLORS[ride.type] }} className="text-xs font-bold uppercase">
                    {ride.type.replace('-', ' ')}
                  </Text>
                </View>

                {/* Route */}
                <View className="px-4 mb-4">
                  <View className="flex-row items-start">
                    <View className="items-center mr-3">
                      <View className="w-3 h-3 rounded-full bg-green-500" />
                      <View className="w-0.5 h-12 bg-white/20 my-1" />
                      <View className="w-3 h-3 rounded-full bg-red-500" />
                    </View>
                    <View className="flex-1">
                      <View className="mb-3">
                        <Text className="text-white font-bold text-base">{ride.from}</Text>
                        <Text className="text-gray-500 text-sm">{ride.fromCity}</Text>
                      </View>
                      <View>
                        <Text className="text-white font-bold text-base">{ride.to}</Text>
                        <Text className="text-gray-500 text-sm">{ride.toCity}</Text>
                      </View>
                    </View>
                    <View className="items-end">
                      <Text className="text-blue-400 text-2xl font-bold">{ride.price}</Text>
                      <Text className="text-gray-500 text-xs">per seat</Text>
                    </View>
                  </View>
                </View>

                {/* Date & Time */}
                <View className="flex-row items-center px-4 mb-4">
                  <View className="flex-row items-center mr-4">
                    <Calendar size={14} color="#9CA3AF" />
                    <Text className="text-gray-300 ml-1.5 text-sm">{ride.date}</Text>
                    {ride.isRecurring && (
                      <View className="ml-2 px-2 py-0.5 rounded-full bg-purple-500/30">
                        <Text className="text-purple-400 text-xs">Recurring</Text>
                      </View>
                    )}
                  </View>
                  <View className="flex-row items-center mr-4">
                    <Clock size={14} color="#9CA3AF" />
                    <Text className="text-gray-300 ml-1.5 text-sm">{ride.time}</Text>
                  </View>
                  <View className="flex-row items-center">
                    <Users size={14} color="#9CA3AF" />
                    <Text className="text-gray-300 ml-1.5 text-sm">{ride.seatsAvailable}/{ride.seats} seats</Text>
                  </View>
                </View>

                {/* Description */}
                <Text className="text-gray-400 text-sm px-4 mb-3 leading-5">{ride.description}</Text>

                {/* Amenities */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-4 mb-4" style={{ flexGrow: 0 }}>
                  <View className="flex-row gap-2">
                    {ride.amenities.map((amenity, idx) => (
                      <View key={idx} className="px-3 py-1.5 rounded-full bg-white/10">
                        <Text className="text-gray-300 text-xs">{amenity}</Text>
                      </View>
                    ))}
                  </View>
                </ScrollView>

                {/* Driver Info & Action */}
                <View className="flex-row items-center justify-between px-4 py-3 bg-white/5 border-t border-white/10">
                  <View className="flex-row items-center">
                    <Image
                      source={{ uri: ride.driver.avatar }}
                      style={{ width: 40, height: 40, borderRadius: 20 }}
                      contentFit="cover"
                    />
                    <View className="ml-3">
                      <View className="flex-row items-center">
                        <Text className="text-white font-semibold">{ride.driver.name}</Text>
                        {ride.driver.isVerified && (
                          <View className="ml-1.5 w-4 h-4 rounded-full bg-blue-500 items-center justify-center">
                            <Text className="text-white text-xs">✓</Text>
                          </View>
                        )}
                      </View>
                      <View className="flex-row items-center">
                        <Star size={12} color="#FBBF24" fill="#FBBF24" />
                        <Text className="text-yellow-400 text-xs ml-1">{ride.driver.rating}</Text>
                        <Text className="text-gray-500 text-xs ml-2">• {ride.driver.rides} rides</Text>
                      </View>
                    </View>
                  </View>
                  <Pressable
                    onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)}
                    className="flex-row items-center bg-blue-500 px-4 py-2.5 rounded-full"
                  >
                    <Text className="text-white font-semibold">Request</Text>
                    <ChevronRight size={16} color="#fff" />
                  </Pressable>
                </View>
              </Pressable>
            </Animated.View>
          ))}

          <View className="h-32" />
        </ScrollView>

        {/* Post Ride Modal */}
        <Modal visible={showPostModal} animationType="slide" transparent>
          <View className="flex-1 bg-black/80 justify-end">
            <View className="bg-[#1A1A2E] rounded-t-3xl p-6">
              <View className="flex-row items-center justify-between mb-6">
                <Text className="text-white text-xl font-bold">Offer a Ride</Text>
                <Pressable
                  onPress={() => setShowPostModal(false)}
                  className="w-8 h-8 rounded-full bg-white/10 items-center justify-center"
                >
                  <X size={18} color="#fff" />
                </Pressable>
              </View>

              <View className="mb-4">
                <Text className="text-gray-400 text-sm mb-2">Pickup Location</Text>
                <TextInput
                  placeholder="Enter pickup address..."
                  placeholderTextColor="#6B7280"
                  className="bg-white/10 rounded-xl px-4 py-3 text-white"
                />
              </View>

              <View className="mb-4">
                <Text className="text-gray-400 text-sm mb-2">Destination</Text>
                <TextInput
                  placeholder="Enter destination..."
                  placeholderTextColor="#6B7280"
                  className="bg-white/10 rounded-xl px-4 py-3 text-white"
                />
              </View>

              <View className="flex-row gap-3 mb-4">
                <View className="flex-1">
                  <Text className="text-gray-400 text-sm mb-2">Date</Text>
                  <TextInput
                    placeholder="Select date..."
                    placeholderTextColor="#6B7280"
                    className="bg-white/10 rounded-xl px-4 py-3 text-white"
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-gray-400 text-sm mb-2">Time</Text>
                  <TextInput
                    placeholder="Select time..."
                    placeholderTextColor="#6B7280"
                    className="bg-white/10 rounded-xl px-4 py-3 text-white"
                  />
                </View>
              </View>

              <View className="flex-row gap-3 mb-6">
                <View className="flex-1">
                  <Text className="text-gray-400 text-sm mb-2">Seats Available</Text>
                  <TextInput
                    placeholder="1-4"
                    placeholderTextColor="#6B7280"
                    keyboardType="number-pad"
                    className="bg-white/10 rounded-xl px-4 py-3 text-white"
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-gray-400 text-sm mb-2">Price per Seat</Text>
                  <TextInput
                    placeholder="$0"
                    placeholderTextColor="#6B7280"
                    keyboardType="number-pad"
                    className="bg-white/10 rounded-xl px-4 py-3 text-white"
                  />
                </View>
              </View>

              <Pressable
                onPress={() => {
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                  setShowPostModal(false);
                }}
                className="bg-blue-500 rounded-xl py-4 items-center"
              >
                <Text className="text-white font-bold text-lg">Post Ride</Text>
              </Pressable>

              <View className="h-8" />
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </View>
  );
}
