import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { ArrowLeft, Search, Heart, Share2, ChevronRight, MapPin, DollarSign, Info, ShoppingBag, X } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

interface Attire {
  id: string;
  name: string;
  origin: string;
  country: string;
  flag: string;
  description: string;
  occasion: string[];
  gender: 'male' | 'female' | 'unisex';
  image: string;
  priceRange: string;
  whereToBuy: string[];
  history: string;
  howToWear: string;
  isSaved: boolean;
}

const MOCK_ATTIRE: Attire[] = [
  {
    id: '1',
    name: 'Kente Cloth',
    origin: 'Ashanti',
    country: 'Ghana',
    flag: '🇬🇭',
    description: 'A type of silk and cotton fabric made of interwoven cloth strips, native to the Akan ethnic group.',
    occasion: ['Weddings', 'Festivals', 'Graduations', 'Naming Ceremonies'],
    gender: 'unisex',
    image: 'https://images.unsplash.com/photo-1590735213920-68192a487bc2?w=400',
    priceRange: '$50 - $500+',
    whereToBuy: ['African Markets', 'Online Shops', 'Ghana imports'],
    history: 'Kente cloth originated with the Ashanti Kingdom dating back to the 17th century. Each pattern has its own name and meaning.',
    howToWear: 'Men drape it over one shoulder toga-style. Women wrap it around the waist and chest or wear as a skirt with matching top.',
    isSaved: true,
  },
  {
    id: '2',
    name: 'Agbada',
    origin: 'Yoruba',
    country: 'Nigeria',
    flag: '🇳🇬',
    description: 'A flowing wide-sleeved robe worn by men, often heavily embroidered with elaborate designs.',
    occasion: ['Weddings', 'Religious Events', 'Chieftaincy Titles', 'Special Occasions'],
    gender: 'male',
    image: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=400',
    priceRange: '$100 - $1000+',
    whereToBuy: ['Balogun Market', 'Nigerian Tailors', 'Online'],
    history: 'The Agbada has been worn for centuries by royalty and nobility. It symbolizes wealth, status, and cultural pride.',
    howToWear: 'Worn over a matching shirt (dashiki) and trousers (sokoto). The flowing sleeves are often draped over the shoulders.',
    isSaved: false,
  },
  {
    id: '3',
    name: 'Ankara/African Print',
    origin: 'Pan-African',
    country: 'Various',
    flag: '🌍',
    description: 'Colorful, wax-printed fabric used to create various clothing styles from dresses to suits.',
    occasion: ['Daily Wear', 'Parties', 'Church', 'Any Celebration'],
    gender: 'unisex',
    image: 'https://images.unsplash.com/photo-1590735213920-68192a487bc2?w=400',
    priceRange: '$20 - $200',
    whereToBuy: ['African Markets', 'Fabric Stores', 'Online Retailers'],
    history: 'Originally inspired by Indonesian batik, it became popular in West Africa in the 19th century and is now a symbol of African identity.',
    howToWear: 'Versatile fabric that can be tailored into any style - dresses, suits, skirts, headwraps, and accessories.',
    isSaved: false,
  },
  {
    id: '4',
    name: 'Dashiki',
    origin: 'West African',
    country: 'Various',
    flag: '🌍',
    description: 'A colorful, loose-fitting garment that covers the top half of the body, often with elaborate embroidery.',
    occasion: ['Casual Wear', 'Cultural Events', 'Festivals', 'Daily Wear'],
    gender: 'unisex',
    image: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=400',
    priceRange: '$15 - $100',
    whereToBuy: ['African Markets', 'Street Vendors', 'Online'],
    history: 'The dashiki became a symbol of Black pride during the 1960s civil rights movement and remains popular today.',
    howToWear: 'Simply pull over the head. Can be worn loose or tucked in. Often paired with jeans for a modern look.',
    isSaved: true,
  },
  {
    id: '5',
    name: 'Gele (Head Wrap)',
    origin: 'Yoruba',
    country: 'Nigeria',
    flag: '🇳🇬',
    description: 'An elaborate headwrap worn by women, tied in various intricate styles.',
    occasion: ['Weddings', 'Church', 'Celebrations', 'Special Events'],
    gender: 'female',
    image: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=400',
    priceRange: '$20 - $150',
    whereToBuy: ['Nigerian Markets', 'Fabric Stores', 'Specialized Shops'],
    history: 'The gele has been worn for centuries and the style and size often indicate social status and the importance of the occasion.',
    howToWear: 'The fabric is folded and wrapped around the head in elaborate styles. Different occasions call for different tying methods.',
    isSaved: false,
  },
  {
    id: '6',
    name: 'Kaftan',
    origin: 'North African',
    country: 'Morocco',
    flag: '🇲🇦',
    description: 'A long, flowing garment with wide sleeves, often made of luxurious fabrics with detailed embroidery.',
    occasion: ['Weddings', 'Religious Events', 'Formal Occasions', 'Eid'],
    gender: 'female',
    image: 'https://images.unsplash.com/photo-1590735213920-68192a487bc2?w=400',
    priceRange: '$80 - $800+',
    whereToBuy: ['Moroccan Souks', 'Middle Eastern Shops', 'Online Boutiques'],
    history: 'Kaftans have been worn in North Africa for centuries and were historically reserved for royalty and the wealthy.',
    howToWear: 'Worn as a full-length dress, often with a belt to cinch the waist. Can be layered over pants for a modern look.',
    isSaved: false,
  },
  {
    id: '7',
    name: 'Boubou/Grand Boubou',
    origin: 'Wolof',
    country: 'Senegal',
    flag: '🇸🇳',
    description: 'A wide, flowing robe worn by both men and women, known for its elegant simplicity.',
    occasion: ['Daily Wear', 'Religious Events', 'Ceremonies', 'Casual'],
    gender: 'unisex',
    image: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=400',
    priceRange: '$40 - $300',
    whereToBuy: ['Senegalese Markets', 'West African Shops', 'Tailors'],
    history: 'The boubou is the national dress of Senegal and is deeply embedded in Senegalese culture and identity.',
    howToWear: 'Pulled over the head and worn loose. Women often wear matching headwraps and men pair with a kufi cap.',
    isSaved: false,
  },
  {
    id: '8',
    name: 'Habesha Kemis',
    origin: 'Ethiopian/Eritrean',
    country: 'Ethiopia',
    flag: '🇪🇹',
    description: 'A traditional white cotton dress with colorful embroidered borders, worn by Ethiopian and Eritrean women.',
    occasion: ['Holidays', 'Church', 'Coffee Ceremonies', 'Weddings'],
    gender: 'female',
    image: 'https://images.unsplash.com/photo-1590735213920-68192a487bc2?w=400',
    priceRange: '$60 - $400',
    whereToBuy: ['Ethiopian Shops', 'Online', 'Ethiopian Markets'],
    history: 'The habesha kemis has been worn for centuries and is an integral part of Ethiopian cultural identity.',
    howToWear: 'Worn as a long dress, often with a matching shawl (netela) draped over the shoulders.',
    isSaved: true,
  },
];

const ORIGINS = ['All', 'Nigerian', 'Ghanaian', 'Ethiopian', 'Moroccan', 'Senegalese'];
const OCCASIONS = ['All', 'Weddings', 'Daily Wear', 'Religious', 'Festivals'];

export default function TraditionalAttireScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrigin, setSelectedOrigin] = useState('All');
  const [attire, setAttire] = useState(MOCK_ATTIRE);
  const [selectedAttire, setSelectedAttire] = useState<Attire | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const filteredAttire = attire.filter(item => {
    const matchesSearch = searchQuery === '' ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesOrigin = selectedOrigin === 'All' ||
      item.origin.toLowerCase().includes(selectedOrigin.toLowerCase()) ||
      item.country.toLowerCase().includes(selectedOrigin.toLowerCase());
    return matchesSearch && matchesOrigin;
  });

  const toggleSave = (attireId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setAttire(prev => prev.map(a => {
      if (a.id === attireId) {
        return { ...a, isSaved: !a.isSaved };
      }
      return a;
    }));
  };

  const openDetail = (item: Attire) => {
    setSelectedAttire(item);
    setShowDetailModal(true);
  };

  return (
    <View className="flex-1 bg-[#FDF6E3]">
      <SafeAreaView edges={['top']} className="flex-1">
        {/* Header */}
        <View className="px-5 pb-4">
          <View className="flex-row items-center justify-between mb-4">
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.back();
              }}
              className="w-10 h-10 rounded-full bg-amber-100 items-center justify-center"
            >
              <ArrowLeft size={20} color="#D97706" />
            </Pressable>
            <View className="flex-row items-center">
              <Text className="text-2xl mr-2">👗</Text>
              <Text className="text-gray-800 text-lg font-bold">Traditional Attire</Text>
            </View>
            <View className="w-10" />
          </View>

          {/* Hero */}
          <LinearGradient
            colors={['#D97706', '#B45309']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ borderRadius: 20, padding: 16, marginBottom: 16 }}
          >
            <Text className="text-white/80 text-sm">Explore & Learn</Text>
            <Text className="text-white text-xl font-bold">Cultural Fashion Guide</Text>
            <Text className="text-white/70 text-sm mt-1">History, styling tips, and where to buy locally</Text>
          </LinearGradient>

          {/* Search */}
          <View className="flex-row items-center bg-white rounded-2xl px-4 py-3 mb-4 shadow-sm">
            <Search size={18} color="#9CA3AF" />
            <TextInput
              placeholder="Search attire..."
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
              className="flex-1 ml-3 text-gray-800 text-base"
            />
          </View>

          {/* Origin Filter */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }}>
            <View className="flex-row gap-2">
              {ORIGINS.map((origin) => (
                <Pressable
                  key={origin}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSelectedOrigin(origin);
                  }}
                  className={`px-4 py-2.5 rounded-full ${
                    selectedOrigin === origin
                      ? 'bg-amber-500'
                      : 'bg-white'
                  }`}
                  style={selectedOrigin !== origin ? { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 } : {}}
                >
                  <Text className={`font-medium ${
                    selectedOrigin === origin ? 'text-white' : 'text-gray-700'
                  }`}>
                    {origin}
                  </Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Attire Grid */}
        <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
          <View className="flex-row flex-wrap justify-between">
            {filteredAttire.map((item, index) => (
              <Animated.View
                key={item.id}
                entering={FadeInDown.delay(index * 60).springify()}
                className="w-[48%] mb-4"
              >
                <Pressable
                  onPress={() => openDetail(item)}
                  className="bg-white rounded-3xl overflow-hidden shadow-sm"
                >
                  <View className="relative">
                    <Image
                      source={{ uri: item.image }}
                      style={{ width: '100%', height: 160 }}
                      contentFit="cover"
                    />

                    {/* Country Flag */}
                    <View className="absolute top-2 left-2 bg-white/90 px-2 py-1 rounded-full">
                      <Text className="text-sm">{item.flag} {item.country}</Text>
                    </View>

                    {/* Save Button */}
                    <Pressable
                      onPress={() => toggleSave(item.id)}
                      className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/90 items-center justify-center"
                    >
                      <Heart
                        size={16}
                        color={item.isSaved ? '#EF4444' : '#9CA3AF'}
                        fill={item.isSaved ? '#EF4444' : 'transparent'}
                      />
                    </Pressable>
                  </View>

                  <View className="p-3">
                    <Text className="text-gray-800 font-bold text-base">{item.name}</Text>
                    <Text className="text-gray-500 text-sm mb-2">{item.origin}</Text>

                    <View className="flex-row flex-wrap gap-1 mb-2">
                      {item.occasion.slice(0, 2).map((occ, idx) => (
                        <View key={idx} className="bg-amber-100 px-2 py-0.5 rounded-full">
                          <Text className="text-amber-700 text-xs">{occ}</Text>
                        </View>
                      ))}
                    </View>

                    <View className="flex-row items-center">
                      <DollarSign size={12} color="#10B981" />
                      <Text className="text-green-600 text-xs font-medium">{item.priceRange}</Text>
                    </View>
                  </View>
                </Pressable>
              </Animated.View>
            ))}
          </View>

          <View className="h-32" />
        </ScrollView>

        {/* Detail Modal */}
        <Modal visible={showDetailModal} animationType="slide" transparent>
          <View className="flex-1 bg-black/50 justify-end">
            <View className="bg-white rounded-t-3xl max-h-[85%]">
              {selectedAttire && (
                <>
                  {/* Header Image */}
                  <View className="relative h-48">
                    <Image
                      source={{ uri: selectedAttire.image }}
                      style={{ width: '100%', height: '100%' }}
                      contentFit="cover"
                    />
                    <View
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0,0,0,0.3)',
                      }}
                    />
                    <Pressable
                      onPress={() => setShowDetailModal(false)}
                      className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/90 items-center justify-center"
                    >
                      <X size={20} color="#374151" />
                    </Pressable>
                    <View className="absolute bottom-4 left-4">
                      <Text className="text-white text-2xl font-bold">{selectedAttire.name}</Text>
                      <Text className="text-white/80">{selectedAttire.flag} {selectedAttire.origin}, {selectedAttire.country}</Text>
                    </View>
                  </View>

                  <ScrollView className="p-6">
                    {/* Description */}
                    <Text className="text-gray-700 text-base leading-6 mb-4">{selectedAttire.description}</Text>

                    {/* History */}
                    <View className="bg-amber-50 rounded-xl p-4 mb-4">
                      <View className="flex-row items-center mb-2">
                        <Info size={16} color="#D97706" />
                        <Text className="text-amber-700 font-bold ml-2">History</Text>
                      </View>
                      <Text className="text-gray-600 text-sm leading-5">{selectedAttire.history}</Text>
                    </View>

                    {/* How to Wear */}
                    <View className="bg-blue-50 rounded-xl p-4 mb-4">
                      <View className="flex-row items-center mb-2">
                        <Info size={16} color="#3B82F6" />
                        <Text className="text-blue-700 font-bold ml-2">How to Wear</Text>
                      </View>
                      <Text className="text-gray-600 text-sm leading-5">{selectedAttire.howToWear}</Text>
                    </View>

                    {/* Occasions */}
                    <View className="mb-4">
                      <Text className="text-gray-700 font-bold mb-2">Best For</Text>
                      <View className="flex-row flex-wrap gap-2">
                        {selectedAttire.occasion.map((occ, idx) => (
                          <View key={idx} className="bg-gray-100 px-3 py-1.5 rounded-full">
                            <Text className="text-gray-700">{occ}</Text>
                          </View>
                        ))}
                      </View>
                    </View>

                    {/* Where to Buy */}
                    <View className="mb-4">
                      <Text className="text-gray-700 font-bold mb-2">Where to Buy</Text>
                      {selectedAttire.whereToBuy.map((place, idx) => (
                        <View key={idx} className="flex-row items-center py-2 border-b border-gray-100">
                          <MapPin size={16} color="#9CA3AF" />
                          <Text className="text-gray-600 ml-2">{place}</Text>
                          <ChevronRight size={16} color="#9CA3AF" className="ml-auto" />
                        </View>
                      ))}
                    </View>

                    {/* Price Range */}
                    <View className="bg-green-50 rounded-xl p-4 mb-6">
                      <View className="flex-row items-center justify-between">
                        <Text className="text-gray-700 font-bold">Price Range</Text>
                        <Text className="text-green-600 font-bold text-lg">{selectedAttire.priceRange}</Text>
                      </View>
                    </View>

                    {/* Actions */}
                    <View className="flex-row gap-3 mb-8">
                      <Pressable
                        onPress={() => toggleSave(selectedAttire.id)}
                        className={`flex-1 flex-row items-center justify-center py-3 rounded-xl ${
                          selectedAttire.isSaved ? 'bg-red-500' : 'bg-gray-100'
                        }`}
                      >
                        <Heart
                          size={18}
                          color={selectedAttire.isSaved ? '#fff' : '#EF4444'}
                          fill={selectedAttire.isSaved ? '#fff' : 'transparent'}
                        />
                        <Text className={`ml-2 font-medium ${selectedAttire.isSaved ? 'text-white' : 'text-gray-700'}`}>
                          {selectedAttire.isSaved ? 'Saved' : 'Save'}
                        </Text>
                      </Pressable>
                      <Pressable className="flex-1 flex-row items-center justify-center py-3 rounded-xl bg-amber-500">
                        <ShoppingBag size={18} color="#fff" />
                        <Text className="text-white ml-2 font-medium">Find Shops</Text>
                      </Pressable>
                    </View>
                  </ScrollView>
                </>
              )}
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </View>
  );
}
