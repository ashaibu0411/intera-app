import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Briefcase,
  Search,
  MapPin,
  Star,
  Phone,
  Globe,
  ChevronLeft,
  ChevronRight,
  Filter,
  Clock,
  Heart,
  Utensils,
  Scissors,
  ShoppingBag,
  Wrench,
  GraduationCap,
  Stethoscope,
  Car,
  Home,
} from 'lucide-react-native';
import Animated, { FadeIn, FadeInUp, FadeInRight } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useStore, MOCK_COMMUNITIES } from '@/lib/store';

// Business categories
const CATEGORIES = [
  { id: 'all', label: 'All', icon: Briefcase },
  { id: 'food', label: 'Food & Dining', icon: Utensils },
  { id: 'beauty', label: 'Beauty & Hair', icon: Scissors },
  { id: 'retail', label: 'Retail', icon: ShoppingBag },
  { id: 'services', label: 'Services', icon: Wrench },
  { id: 'health', label: 'Health', icon: Stethoscope },
  { id: 'education', label: 'Education', icon: GraduationCap },
  { id: 'auto', label: 'Auto', icon: Car },
  { id: 'realestate', label: 'Real Estate', icon: Home },
];

// Mock businesses
const MOCK_BUSINESSES = [
  {
    id: '1',
    name: "Amara's African Kitchen",
    category: 'food',
    description: 'Authentic West African cuisine with a modern twist. Specializing in Senegalese and Nigerian dishes.',
    image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&h=600&fit=crop',
    logo: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=200&h=200&fit=crop',
    rating: 4.8,
    reviews: 124,
    location: 'Denver, CO',
    address: '1234 Five Points, Denver, CO 80205',
    phone: '+1 (303) 555-0123',
    website: 'www.amaraskitchen.com',
    hours: 'Mon-Sat: 11AM-10PM',
    isVerified: true,
    isFeatured: true,
  },
  {
    id: '2',
    name: 'African Braids & Beauty',
    category: 'beauty',
    description: 'Professional African hair braiding, styling, and beauty services. Walk-ins welcome!',
    image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&h=600&fit=crop',
    logo: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=200&h=200&fit=crop',
    rating: 4.9,
    reviews: 89,
    location: 'Denver, CO',
    address: '567 Colfax Ave, Denver, CO 80203',
    phone: '+1 (303) 555-0456',
    hours: 'Tue-Sun: 9AM-7PM',
    isVerified: true,
    isFeatured: true,
  },
  {
    id: '3',
    name: 'Kente Clothiers',
    category: 'retail',
    description: 'Traditional African clothing, fabrics, and accessories. Custom tailoring available.',
    image: 'https://images.unsplash.com/photo-1590735213920-68192a487bc2?w=800&h=600&fit=crop',
    logo: 'https://images.unsplash.com/photo-1558171813-4c088753af8f?w=200&h=200&fit=crop',
    rating: 4.7,
    reviews: 56,
    location: 'Denver, CO',
    address: '890 Martin Luther King Blvd, Denver, CO 80205',
    phone: '+1 (303) 555-0789',
    hours: 'Mon-Sat: 10AM-6PM',
    isVerified: true,
    isFeatured: false,
  },
  {
    id: '4',
    name: 'Ubuntu Tax Services',
    category: 'services',
    description: 'Professional tax preparation, bookkeeping, and financial consulting for individuals and businesses.',
    image: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&h=600&fit=crop',
    logo: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=200&h=200&fit=crop',
    rating: 4.9,
    reviews: 78,
    location: 'Denver, CO',
    address: '123 Business Park, Denver, CO 80202',
    phone: '+1 (303) 555-0321',
    website: 'www.ubuntutax.com',
    hours: 'Mon-Fri: 9AM-5PM',
    isVerified: true,
    isFeatured: false,
  },
  {
    id: '5',
    name: 'Nkrumah Auto Repair',
    category: 'auto',
    description: 'Reliable auto repair and maintenance. Honest pricing and quality service guaranteed.',
    image: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=800&h=600&fit=crop',
    logo: 'https://images.unsplash.com/photo-1530046339160-ce3e530c7d2f?w=200&h=200&fit=crop',
    rating: 4.6,
    reviews: 42,
    location: 'Denver, CO',
    address: '456 Industrial Blvd, Aurora, CO 80011',
    phone: '+1 (303) 555-0654',
    hours: 'Mon-Sat: 8AM-6PM',
    isVerified: false,
    isFeatured: false,
  },
  {
    id: '6',
    name: 'Dr. Okonkwo Family Medicine',
    category: 'health',
    description: 'Comprehensive family healthcare with a culturally sensitive approach. Accepting new patients.',
    image: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800&h=600&fit=crop',
    logo: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=200&h=200&fit=crop',
    rating: 4.9,
    reviews: 156,
    location: 'Denver, CO',
    address: '789 Medical Center Dr, Denver, CO 80206',
    phone: '+1 (303) 555-0987',
    website: 'www.drokonkwo.com',
    hours: 'Mon-Fri: 8AM-5PM',
    isVerified: true,
    isFeatured: true,
  },
];

export default function BusinessDirectoryScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [savedBusinesses, setSavedBusinesses] = useState<string[]>([]);
  const currentCommunity = useStore((s) => s.currentCommunity);
  const selectedLocation = useStore((s) => s.selectedLocation);

  const displayLocation = selectedLocation?.city || currentCommunity?.city || MOCK_COMMUNITIES[0].city;

  const filteredBusinesses = MOCK_BUSINESSES.filter((business) => {
    const matchesCategory = selectedCategory === 'all' || business.category === selectedCategory;
    const matchesSearch = business.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      business.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const featuredBusinesses = MOCK_BUSINESSES.filter((b) => b.isFeatured);

  const toggleSave = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSavedBusinesses((prev) =>
      prev.includes(id) ? prev.filter((bid) => bid !== id) : [...prev, id]
    );
  };

  return (
    <View className="flex-1 bg-cream">
      <SafeAreaView edges={['top']} className="flex-1">
        {/* Header */}
        <Animated.View entering={FadeIn.duration(300)} className="px-5 pt-4 pb-2">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.back();
                }}
                className="bg-white rounded-full p-2 mr-3 shadow-sm"
              >
                <ChevronLeft size={24} color="#2D1F1A" />
              </Pressable>
              <View>
                <Text className="text-2xl font-bold text-warmBrown">Business Directory</Text>
                <View className="flex-row items-center mt-0.5">
                  <MapPin size={14} color="#D4673A" />
                  <Text className="text-sm text-gray-500 ml-1">{displayLocation}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Search */}
          <View className="flex-row items-center bg-white rounded-2xl px-4 py-3 mt-4 shadow-sm">
            <Search size={20} color="#8B7355" />
            <TextInput
              placeholder="Search businesses..."
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
              className="flex-1 ml-3 text-warmBrown text-base"
            />
          </View>
        </Animated.View>

        <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
          {/* Categories */}
          <Animated.View entering={FadeInUp.duration(400).delay(100)}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 12 }}
              style={{ flexGrow: 0 }}
            >
              {CATEGORIES.map((category, index) => (
                <Animated.View
                  key={category.id}
                  entering={FadeInRight.duration(300).delay(100 + index * 30)}
                >
                  <Pressable
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setSelectedCategory(category.id);
                    }}
                    className={`flex-row items-center px-4 py-2.5 rounded-full mr-2 ${
                      selectedCategory === category.id ? 'bg-terracotta-500' : 'bg-white'
                    }`}
                  >
                    <category.icon
                      size={16}
                      color={selectedCategory === category.id ? '#FFFFFF' : '#8B7355'}
                    />
                    <Text
                      className={`ml-2 font-medium ${
                        selectedCategory === category.id ? 'text-white' : 'text-warmBrown'
                      }`}
                    >
                      {category.label}
                    </Text>
                  </Pressable>
                </Animated.View>
              ))}
            </ScrollView>
          </Animated.View>

          {/* Featured Businesses */}
          {selectedCategory === 'all' && (
            <Animated.View entering={FadeInUp.duration(400).delay(200)} className="mt-2">
              <View className="flex-row items-center justify-between px-5 mb-3">
                <View className="flex-row items-center">
                  <Star size={20} color="#C9A227" />
                  <Text className="text-lg font-semibold text-warmBrown ml-2">Featured</Text>
                </View>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 20 }}
                style={{ flexGrow: 0 }}
              >
                {featuredBusinesses.map((business, index) => (
                  <Animated.View
                    key={business.id}
                    entering={FadeInRight.duration(300).delay(250 + index * 100)}
                  >
                    <Pressable
                      onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
                      className="mr-4 bg-white rounded-2xl overflow-hidden shadow-sm"
                      style={{ width: 280 }}
                    >
                      <View className="relative">
                        <Image
                          source={{ uri: business.image }}
                          style={{ width: '100%', height: 140 }}
                          contentFit="cover"
                        />
                        <Pressable
                          onPress={() => toggleSave(business.id)}
                          className="absolute top-2 right-2 bg-white/90 rounded-full p-2"
                        >
                          <Heart
                            size={18}
                            color={savedBusinesses.includes(business.id) ? '#D4673A' : '#8B7355'}
                            fill={savedBusinesses.includes(business.id) ? '#D4673A' : 'transparent'}
                          />
                        </Pressable>
                        {business.isVerified && (
                          <View className="absolute bottom-2 left-2 bg-forest-600 rounded-full px-2 py-1 flex-row items-center">
                            <Star size={10} color="#FFFFFF" fill="#FFFFFF" />
                            <Text className="text-white text-xs font-medium ml-1">Verified</Text>
                          </View>
                        )}
                      </View>
                      <View className="p-4">
                        <Text className="text-warmBrown font-bold text-base" numberOfLines={1}>
                          {business.name}
                        </Text>
                        <Text className="text-gray-500 text-sm mt-1" numberOfLines={2}>
                          {business.description}
                        </Text>
                        <View className="flex-row items-center mt-2">
                          <Star size={14} color="#C9A227" fill="#C9A227" />
                          <Text className="text-warmBrown font-semibold ml-1">{business.rating}</Text>
                          <Text className="text-gray-400 ml-1">({business.reviews} reviews)</Text>
                        </View>
                      </View>
                    </Pressable>
                  </Animated.View>
                ))}
              </ScrollView>
            </Animated.View>
          )}

          {/* All Businesses List */}
          <Animated.View entering={FadeInUp.duration(400).delay(300)} className="px-5 mt-6">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-lg font-semibold text-warmBrown">
                {selectedCategory === 'all' ? 'All Businesses' : CATEGORIES.find(c => c.id === selectedCategory)?.label}
              </Text>
              <Text className="text-gray-500 text-sm">{filteredBusinesses.length} found</Text>
            </View>

            {filteredBusinesses.map((business, index) => (
              <Animated.View
                key={business.id}
                entering={FadeInUp.duration(300).delay(350 + index * 50)}
              >
                <Pressable
                  onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
                  className="bg-white rounded-2xl p-4 mb-3 shadow-sm"
                >
                  <View className="flex-row">
                    <Image
                      source={{ uri: business.logo }}
                      style={{ width: 70, height: 70, borderRadius: 12 }}
                      contentFit="cover"
                    />
                    <View className="flex-1 ml-3">
                      <View className="flex-row items-center">
                        <Text className="text-warmBrown font-bold flex-1" numberOfLines={1}>
                          {business.name}
                        </Text>
                        {business.isVerified && (
                          <View className="bg-forest-100 rounded-full p-1 ml-2">
                            <Star size={12} color="#1B4D3E" fill="#1B4D3E" />
                          </View>
                        )}
                      </View>
                      <Text className="text-gray-500 text-sm mt-0.5" numberOfLines={2}>
                        {business.description}
                      </Text>
                      <View className="flex-row items-center mt-2">
                        <Star size={12} color="#C9A227" fill="#C9A227" />
                        <Text className="text-warmBrown font-medium text-sm ml-1">{business.rating}</Text>
                        <Text className="text-gray-400 text-xs ml-1">({business.reviews})</Text>
                        <Text className="text-gray-300 mx-2">•</Text>
                        <Clock size={12} color="#8B7355" />
                        <Text className="text-gray-500 text-xs ml-1">{business.hours.split(':')[0]}</Text>
                      </View>
                    </View>
                    <Pressable
                      onPress={() => toggleSave(business.id)}
                      className="p-2"
                    >
                      <Heart
                        size={20}
                        color={savedBusinesses.includes(business.id) ? '#D4673A' : '#D1D5DB'}
                        fill={savedBusinesses.includes(business.id) ? '#D4673A' : 'transparent'}
                      />
                    </Pressable>
                  </View>

                  {/* Quick Actions */}
                  <View className="flex-row mt-3 pt-3 border-t border-gray-100">
                    <Pressable className="flex-row items-center flex-1">
                      <Phone size={14} color="#1B4D3E" />
                      <Text className="text-forest-700 text-sm font-medium ml-1">Call</Text>
                    </Pressable>
                    <Pressable className="flex-row items-center flex-1">
                      <MapPin size={14} color="#D4673A" />
                      <Text className="text-terracotta-500 text-sm font-medium ml-1">Directions</Text>
                    </Pressable>
                    {business.website && (
                      <Pressable className="flex-row items-center flex-1">
                        <Globe size={14} color="#8B7355" />
                        <Text className="text-warmBrown text-sm font-medium ml-1">Website</Text>
                      </Pressable>
                    )}
                  </View>
                </Pressable>
              </Animated.View>
            ))}

            {filteredBusinesses.length === 0 && (
              <View className="py-12 items-center">
                <View className="bg-gray-100 rounded-full p-4 mb-4">
                  <Briefcase size={32} color="#9CA3AF" />
                </View>
                <Text className="text-warmBrown font-semibold text-lg text-center">
                  No businesses found
                </Text>
                <Text className="text-gray-500 text-center mt-2">
                  Try adjusting your search or category filter
                </Text>
              </View>
            )}
          </Animated.View>

          {/* Add Your Business CTA */}
          <Animated.View entering={FadeInUp.duration(400).delay(500)} className="px-5 mt-4 mb-8">
            <Pressable onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)}>
              <LinearGradient
                colors={['#1B4D3E', '#153D31']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ borderRadius: 16, padding: 20 }}
              >
                <View className="flex-row items-center">
                  <View className="bg-white/20 rounded-full p-3">
                    <Briefcase size={24} color="#FFFFFF" />
                  </View>
                  <View className="flex-1 ml-4">
                    <Text className="text-white font-bold text-lg">Own a Business?</Text>
                    <Text className="text-white/80 text-sm mt-0.5">
                      List your business for free and reach the African community
                    </Text>
                  </View>
                  <ChevronRight size={24} color="#FFFFFF" />
                </View>
              </LinearGradient>
            </Pressable>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
