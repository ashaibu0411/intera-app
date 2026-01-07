import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { ArrowLeft, Search, Leaf, MapPin, Phone, Star, Clock, ChevronRight, Heart, Filter, Globe2 } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

interface Practitioner {
  id: string;
  name: string;
  avatar: string;
  specialty: string[];
  traditions: string[];
  location: string;
  phone: string;
  rating: number;
  reviews: number;
  experience: string;
  about: string;
  services: { name: string; price: string }[];
  isVerified: boolean;
  isSaved: boolean;
}

const MOCK_PRACTITIONERS: Practitioner[] = [
  {
    id: '1',
    name: 'Dr. Amina Kwame',
    avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400',
    specialty: ['Herbalist', 'Naturopath'],
    traditions: ['West African', 'Ayurveda'],
    location: 'Harlem, NY',
    phone: '212-555-0123',
    rating: 4.9,
    reviews: 156,
    experience: '20+ years',
    about: 'Trained in traditional West African herbal medicine and Ayurveda. Specializing in digestive health, immune support, and stress management.',
    services: [
      { name: 'Initial Consultation', price: '$85' },
      { name: 'Herbal Formulation', price: '$45' },
      { name: 'Follow-up Visit', price: '$50' },
    ],
    isVerified: true,
    isSaved: false,
  },
  {
    id: '2',
    name: 'Baba Oluwole',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200',
    specialty: ['Traditional Healer', 'Spiritual Guide'],
    traditions: ['Yoruba', 'Ifa'],
    location: 'Brooklyn, NY',
    phone: '718-555-0456',
    rating: 4.8,
    reviews: 89,
    experience: '35+ years',
    about: 'Initiated priest and traditional healer trained in Nigeria. Offering spiritual consultations, herbal remedies, and traditional ceremonies.',
    services: [
      { name: 'Spiritual Consultation', price: '$100' },
      { name: 'Herbal Treatment', price: '$60' },
      { name: 'Ceremony', price: '$150+' },
    ],
    isVerified: true,
    isSaved: true,
  },
  {
    id: '3',
    name: 'Dr. Fatima Hassan',
    avatar: 'https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=400',
    specialty: ['Acupuncturist', 'TCM Practitioner'],
    traditions: ['Chinese Medicine', 'Islamic Medicine'],
    location: 'Queens, NY',
    phone: '718-555-0789',
    rating: 4.7,
    reviews: 234,
    experience: '15+ years',
    about: 'Licensed acupuncturist combining Traditional Chinese Medicine with principles from Islamic healing traditions. Specializing in pain management and women\'s health.',
    services: [
      { name: 'Acupuncture Session', price: '$90' },
      { name: 'Cupping Therapy', price: '$60' },
      { name: 'Herbal Consultation', price: '$70' },
    ],
    isVerified: true,
    isSaved: false,
  },
  {
    id: '4',
    name: 'Mama Desta',
    avatar: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=200',
    specialty: ['Herbalist', 'Midwife'],
    traditions: ['Ethiopian', 'East African'],
    location: 'Bronx, NY',
    phone: '347-555-0321',
    rating: 5.0,
    reviews: 67,
    experience: '40+ years',
    about: 'Traditional Ethiopian herbalist and midwife. Specializing in maternal health, fertility support, and traditional remedies for common ailments.',
    services: [
      { name: 'Consultation', price: '$65' },
      { name: 'Prenatal Support', price: '$80' },
      { name: 'Herbal Remedies', price: '$30+' },
    ],
    isVerified: false,
    isSaved: false,
  },
  {
    id: '5',
    name: 'Dr. Jean-Pierre Toussaint',
    avatar: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400',
    specialty: ['Holistic Doctor', 'Energy Healer'],
    traditions: ['Haitian', 'Caribbean'],
    location: 'Flatbush, Brooklyn',
    phone: '718-555-0654',
    rating: 4.6,
    reviews: 112,
    experience: '25+ years',
    about: 'Haitian-trained holistic practitioner combining traditional Caribbean healing with modern naturopathic medicine. Specializing in chronic conditions and energy work.',
    services: [
      { name: 'Holistic Assessment', price: '$95' },
      { name: 'Energy Healing', price: '$75' },
      { name: 'Detox Program', price: '$120' },
    ],
    isVerified: true,
    isSaved: false,
  },
];

const TRADITIONS = ['All', 'African', 'Caribbean', 'Chinese', 'Ayurveda', 'Islamic'];
const SPECIALTIES = ['All', 'Herbalist', 'Acupuncture', 'Spiritual', 'Naturopath', 'Midwife'];

export default function TraditionalMedicineScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTradition, setSelectedTradition] = useState('All');
  const [practitioners, setPractitioners] = useState(MOCK_PRACTITIONERS);

  const filteredPractitioners = practitioners.filter(p => {
    const matchesSearch = searchQuery === '' ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.specialty.some(s => s.toLowerCase().includes(searchQuery.toLowerCase())) ||
      p.traditions.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesTradition = selectedTradition === 'All' ||
      p.traditions.some(t => t.toLowerCase().includes(selectedTradition.toLowerCase()));

    return matchesSearch && matchesTradition;
  });

  const toggleSave = (practitionerId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setPractitioners(prev => prev.map(p => {
      if (p.id === practitionerId) {
        return { ...p, isSaved: !p.isSaved };
      }
      return p;
    }));
  };

  const callPractitioner = (phone: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Linking.openURL(`tel:${phone}`);
  };

  return (
    <View className="flex-1 bg-[#F0FDF4]">
      <SafeAreaView edges={['top']} className="flex-1">
        {/* Header */}
        <View className="px-5 pb-4 bg-white">
          <View className="flex-row items-center justify-between mb-4">
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.back();
              }}
              className="w-10 h-10 rounded-full bg-green-100 items-center justify-center"
            >
              <ArrowLeft size={20} color="#16A34A" />
            </Pressable>
            <View className="flex-row items-center">
              <Leaf size={20} color="#16A34A" />
              <Text className="text-gray-800 text-lg font-bold ml-2">Traditional Medicine</Text>
            </View>
            <View className="w-10" />
          </View>

          {/* Hero */}
          <LinearGradient
            colors={['#16A34A', '#15803D']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ borderRadius: 20, padding: 16, marginBottom: 16 }}
          >
            <View className="flex-row items-center">
              <View className="flex-1">
                <Text className="text-white/80 text-sm">Discover</Text>
                <Text className="text-white text-xl font-bold">Holistic Practitioners</Text>
                <Text className="text-white/70 text-sm mt-1">Find herbalists, healers & traditional medicine experts</Text>
              </View>
              <View className="w-16 h-16 rounded-full bg-white/20 items-center justify-center">
                <Text className="text-4xl">🌿</Text>
              </View>
            </View>
          </LinearGradient>

          {/* Search */}
          <View className="flex-row items-center bg-gray-100 rounded-2xl px-4 py-3 mb-4">
            <Search size={18} color="#9CA3AF" />
            <TextInput
              placeholder="Search practitioners, traditions..."
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
              className="flex-1 ml-3 text-gray-800 text-base"
            />
          </View>

          {/* Tradition Filter */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }}>
            <View className="flex-row gap-2">
              {TRADITIONS.map((tradition) => (
                <Pressable
                  key={tradition}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSelectedTradition(tradition);
                  }}
                  className={`px-4 py-2.5 rounded-full ${
                    selectedTradition === tradition
                      ? 'bg-green-500'
                      : 'bg-gray-100'
                  }`}
                >
                  <Text className={`font-medium ${
                    selectedTradition === tradition ? 'text-white' : 'text-gray-700'
                  }`}>
                    {tradition}
                  </Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Disclaimer */}
        <View className="mx-5 mt-4 bg-amber-50 border border-amber-200 rounded-xl p-3">
          <Text className="text-amber-700 text-xs text-center">
            Traditional medicine should complement, not replace, conventional medical care. Always consult healthcare professionals for serious conditions.
          </Text>
        </View>

        {/* Practitioners List */}
        <ScrollView className="flex-1 px-5 pt-4" showsVerticalScrollIndicator={false}>
          {filteredPractitioners.map((practitioner, index) => (
            <Animated.View
              key={practitioner.id}
              entering={FadeInDown.delay(index * 60).springify()}
            >
              <View className="bg-white rounded-3xl overflow-hidden mb-4 shadow-sm">
                {/* Header */}
                <View className="p-4">
                  <View className="flex-row">
                    <Image
                      source={{ uri: practitioner.avatar }}
                      style={{ width: 80, height: 80, borderRadius: 16 }}
                      contentFit="cover"
                    />
                    <View className="flex-1 ml-4">
                      <View className="flex-row items-center">
                        <Text className="text-gray-800 font-bold text-lg">{practitioner.name}</Text>
                        {practitioner.isVerified && (
                          <View className="ml-2 bg-green-100 px-2 py-0.5 rounded-full">
                            <Text className="text-green-700 text-xs font-medium">Verified</Text>
                          </View>
                        )}
                      </View>

                      <View className="flex-row flex-wrap gap-1 mt-1">
                        {practitioner.specialty.map((spec, idx) => (
                          <Text key={idx} className="text-green-600 text-sm">{spec}{idx < practitioner.specialty.length - 1 ? ' • ' : ''}</Text>
                        ))}
                      </View>

                      <View className="flex-row items-center mt-2">
                        <Star size={14} color="#FBBF24" fill="#FBBF24" />
                        <Text className="text-gray-800 font-medium ml-1">{practitioner.rating}</Text>
                        <Text className="text-gray-500 text-sm ml-1">({practitioner.reviews} reviews)</Text>
                      </View>

                      <View className="flex-row items-center mt-1">
                        <Clock size={12} color="#9CA3AF" />
                        <Text className="text-gray-500 text-sm ml-1">{practitioner.experience} experience</Text>
                      </View>
                    </View>

                    {/* Save Button */}
                    <Pressable
                      onPress={() => toggleSave(practitioner.id)}
                      className="absolute top-0 right-0"
                    >
                      <Heart
                        size={22}
                        color={practitioner.isSaved ? '#EF4444' : '#D1D5DB'}
                        fill={practitioner.isSaved ? '#EF4444' : 'transparent'}
                      />
                    </Pressable>
                  </View>

                  {/* Traditions */}
                  <View className="flex-row flex-wrap gap-2 mt-3">
                    {practitioner.traditions.map((tradition, idx) => (
                      <View key={idx} className="flex-row items-center bg-green-100 px-2 py-1 rounded-full">
                        <Globe2 size={12} color="#16A34A" />
                        <Text className="text-green-700 text-xs ml-1">{tradition}</Text>
                      </View>
                    ))}
                  </View>

                  {/* About */}
                  <Text className="text-gray-600 text-sm mt-3 leading-5" numberOfLines={2}>{practitioner.about}</Text>

                  {/* Location */}
                  <View className="flex-row items-center mt-3">
                    <MapPin size={14} color="#9CA3AF" />
                    <Text className="text-gray-500 text-sm ml-1">{practitioner.location}</Text>
                  </View>
                </View>

                {/* Services Preview */}
                <View className="px-4 py-3 bg-gray-50 border-t border-gray-100">
                  <Text className="text-gray-700 font-medium mb-2">Services</Text>
                  <View className="flex-row flex-wrap gap-2">
                    {practitioner.services.slice(0, 2).map((service, idx) => (
                      <View key={idx} className="bg-white px-3 py-1.5 rounded-full border border-gray-200">
                        <Text className="text-gray-700 text-sm">{service.name} - <Text className="font-bold text-green-600">{service.price}</Text></Text>
                      </View>
                    ))}
                  </View>
                </View>

                {/* Actions */}
                <View className="flex-row p-4 border-t border-gray-100">
                  <Pressable
                    onPress={() => callPractitioner(practitioner.phone)}
                    className="flex-1 flex-row items-center justify-center bg-green-500 py-3 rounded-xl mr-2"
                  >
                    <Phone size={18} color="#fff" />
                    <Text className="text-white font-bold ml-2">Call</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
                    className="flex-1 flex-row items-center justify-center bg-gray-100 py-3 rounded-xl"
                  >
                    <Text className="text-gray-700 font-bold">View Profile</Text>
                    <ChevronRight size={18} color="#374151" />
                  </Pressable>
                </View>
              </View>
            </Animated.View>
          ))}

          <View className="h-32" />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
