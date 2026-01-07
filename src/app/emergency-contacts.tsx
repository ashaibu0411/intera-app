import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Search, Phone, MapPin, Globe2, AlertTriangle, Building, Heart, Stethoscope, Shield, Plane, ChevronRight } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

interface EmergencyContact {
  id: string;
  name: string;
  category: 'emergency' | 'embassy' | 'health' | 'community' | 'legal';
  phone: string;
  address?: string;
  website?: string;
  description: string;
  hours?: string;
  country: string;
  flag: string;
}

const EMERGENCY_CONTACTS: EmergencyContact[] = [
  // US Emergency Services
  { id: '1', name: 'Emergency Services', category: 'emergency', phone: '911', description: 'Police, Fire, Medical Emergency', country: 'USA', flag: '🇺🇸' },
  { id: '2', name: 'Poison Control', category: 'emergency', phone: '1-800-222-1222', description: '24/7 poison emergency assistance', country: 'USA', flag: '🇺🇸' },
  { id: '3', name: 'National Suicide Prevention', category: 'emergency', phone: '988', description: 'Mental health crisis support 24/7', country: 'USA', flag: '🇺🇸' },

  // African Embassies in US
  { id: '4', name: 'Nigerian Embassy', category: 'embassy', phone: '202-800-7201', address: '3519 International Ct NW, Washington DC', description: 'Consular services for Nigerian citizens', website: 'nigeriaembassyusa.org', country: 'Nigeria', flag: '🇳🇬' },
  { id: '5', name: 'Ghanaian Embassy', category: 'embassy', phone: '202-686-4520', address: '3512 International Dr NW, Washington DC', description: 'Consular services for Ghanaian citizens', website: 'ghanaembassy.org', country: 'Ghana', flag: '🇬🇭' },
  { id: '6', name: 'Ethiopian Embassy', category: 'embassy', phone: '202-364-1200', address: '3506 International Dr NW, Washington DC', description: 'Consular services for Ethiopian citizens', website: 'ethiopianembassy.org', country: 'Ethiopia', flag: '🇪🇹' },
  { id: '7', name: 'Kenyan Embassy', category: 'embassy', phone: '202-387-6101', address: '2249 R St NW, Washington DC', description: 'Consular services for Kenyan citizens', website: 'kenyaembassydc.org', country: 'Kenya', flag: '🇰🇪' },
  { id: '8', name: 'South African Embassy', category: 'embassy', phone: '202-232-4400', address: '3051 Massachusetts Ave NW, Washington DC', description: 'Consular services for South African citizens', website: 'saembassy.org', country: 'South Africa', flag: '🇿🇦' },
  { id: '9', name: 'Jamaican Embassy', category: 'embassy', phone: '202-452-0660', address: '1520 New Hampshire Ave NW, Washington DC', description: 'Consular services for Jamaican citizens', website: 'embassyofjamaica.org', country: 'Jamaica', flag: '🇯🇲' },

  // Health Resources
  { id: '10', name: 'CDC Info Line', category: 'health', phone: '800-232-4636', description: 'Health information and disease prevention', website: 'cdc.gov', country: 'USA', flag: '🇺🇸' },
  { id: '11', name: 'SAMHSA Helpline', category: 'health', phone: '1-800-662-4357', description: 'Substance abuse and mental health services', hours: '24/7', country: 'USA', flag: '🇺🇸' },

  // Community Organizations
  { id: '12', name: 'African Community Center', category: 'community', phone: '720-887-1580', address: 'Denver, CO', description: 'Immigration assistance, job training, community support', website: 'acc-denver.org', country: 'Pan-African', flag: '🌍' },
  { id: '13', name: 'African Services Committee', category: 'community', phone: '212-222-3882', address: 'New York, NY', description: 'Legal, health, and social services for African immigrants', website: 'africanservices.org', country: 'Pan-African', flag: '🌍' },

  // Legal Aid
  { id: '14', name: 'Immigration Advocates Network', category: 'legal', phone: '212-739-4975', description: 'Free immigration legal help directory', website: 'immigrationadvocates.org', country: 'USA', flag: '🇺🇸' },
  { id: '15', name: 'CLINIC Legal Help', category: 'legal', phone: '301-565-4800', description: 'Catholic immigration legal services network', website: 'cliniclegal.org', country: 'USA', flag: '🇺🇸' },
];

const CATEGORIES = [
  { key: 'all', label: 'All', icon: Globe2, color: '#6366F1' },
  { key: 'emergency', label: 'Emergency', icon: AlertTriangle, color: '#EF4444' },
  { key: 'embassy', label: 'Embassies', icon: Building, color: '#3B82F6' },
  { key: 'health', label: 'Health', icon: Stethoscope, color: '#10B981' },
  { key: 'community', label: 'Community', icon: Heart, color: '#EC4899' },
  { key: 'legal', label: 'Legal', icon: Shield, color: '#F59E0B' },
];

export default function EmergencyContactsScreen() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredContacts = EMERGENCY_CONTACTS.filter(contact => {
    const matchesCategory = selectedCategory === 'all' || contact.category === selectedCategory;
    const matchesSearch = searchQuery === '' ||
      contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.country.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const callNumber = (phone: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Linking.openURL(`tel:${phone}`);
  };

  const openWebsite = (url: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Linking.openURL(`https://${url}`);
  };

  const getCategoryInfo = (category: string) => {
    return CATEGORIES.find(c => c.key === category) || CATEGORIES[0];
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
              <Phone size={20} color="#EF4444" />
              <Text className="text-gray-800 text-lg font-bold ml-2">Emergency Contacts</Text>
            </View>
            <View className="w-10" />
          </View>

          {/* Emergency Banner */}
          <LinearGradient
            colors={['#EF4444', '#DC2626']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ borderRadius: 16, padding: 16, marginBottom: 16 }}
          >
            <View className="flex-row items-center">
              <AlertTriangle size={32} color="#fff" />
              <View className="flex-1 ml-3">
                <Text className="text-white font-bold text-lg">In an Emergency?</Text>
                <Text className="text-white/80 text-sm">Call 911 immediately for police, fire, or medical emergencies</Text>
              </View>
              <Pressable
                onPress={() => callNumber('911')}
                className="bg-white px-4 py-2 rounded-full"
              >
                <Text className="text-red-500 font-bold">Call 911</Text>
              </Pressable>
            </View>
          </LinearGradient>

          {/* Search */}
          <View className="flex-row items-center bg-gray-100 rounded-2xl px-4 py-3 mb-4">
            <Search size={18} color="#9CA3AF" />
            <TextInput
              placeholder="Search contacts, countries..."
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
              className="flex-1 ml-3 text-gray-800 text-base"
            />
          </View>

          {/* Category Filter */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }}>
            <View className="flex-row gap-2">
              {CATEGORIES.map((category) => {
                const Icon = category.icon;
                return (
                  <Pressable
                    key={category.key}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setSelectedCategory(category.key);
                    }}
                    className={`flex-row items-center px-4 py-2.5 rounded-full ${
                      selectedCategory === category.key
                        ? ''
                        : 'bg-gray-100'
                    }`}
                    style={selectedCategory === category.key ? { backgroundColor: category.color } : {}}
                  >
                    <Icon size={16} color={selectedCategory === category.key ? '#fff' : category.color} />
                    <Text className={`ml-2 font-medium ${
                      selectedCategory === category.key ? 'text-white' : 'text-gray-700'
                    }`}>
                      {category.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>
        </View>

        {/* Contacts List */}
        <ScrollView className="flex-1 px-5 pt-4" showsVerticalScrollIndicator={false}>
          {filteredContacts.map((contact, index) => {
            const categoryInfo = getCategoryInfo(contact.category);
            const CategoryIcon = categoryInfo.icon;
            return (
              <Animated.View
                key={contact.id}
                entering={FadeInDown.delay(index * 50).springify()}
              >
                <View className="bg-white rounded-2xl mb-3 overflow-hidden shadow-sm">
                  {/* Header */}
                  <View className="p-4 border-b border-gray-100">
                    <View className="flex-row items-start">
                      <View
                        className="w-12 h-12 rounded-xl items-center justify-center"
                        style={{ backgroundColor: categoryInfo.color + '20' }}
                      >
                        <CategoryIcon size={24} color={categoryInfo.color} />
                      </View>
                      <View className="flex-1 ml-3">
                        <View className="flex-row items-center">
                          <Text className="text-gray-800 font-bold text-base">{contact.name}</Text>
                          <Text className="ml-2">{contact.flag}</Text>
                        </View>
                        <Text className="text-gray-500 text-sm">{contact.description}</Text>
                        {contact.hours && (
                          <Text className="text-green-600 text-xs mt-1">Available {contact.hours}</Text>
                        )}
                      </View>
                    </View>
                  </View>

                  {/* Contact Info */}
                  <View className="p-4">
                    {/* Phone */}
                    <Pressable
                      onPress={() => callNumber(contact.phone)}
                      className="flex-row items-center justify-between py-2"
                    >
                      <View className="flex-row items-center">
                        <Phone size={18} color="#10B981" />
                        <Text className="text-gray-800 ml-3 font-medium">{contact.phone}</Text>
                      </View>
                      <View className="bg-green-500 px-3 py-1.5 rounded-full">
                        <Text className="text-white font-semibold text-sm">Call</Text>
                      </View>
                    </Pressable>

                    {/* Address */}
                    {contact.address && (
                      <View className="flex-row items-center py-2">
                        <MapPin size={18} color="#6B7280" />
                        <Text className="text-gray-600 ml-3">{contact.address}</Text>
                      </View>
                    )}

                    {/* Website */}
                    {contact.website && (
                      <Pressable
                        onPress={() => openWebsite(contact.website!)}
                        className="flex-row items-center justify-between py-2"
                      >
                        <View className="flex-row items-center">
                          <Globe2 size={18} color="#3B82F6" />
                          <Text className="text-blue-500 ml-3">{contact.website}</Text>
                        </View>
                        <ChevronRight size={18} color="#3B82F6" />
                      </Pressable>
                    )}
                  </View>
                </View>
              </Animated.View>
            );
          })}

          {/* Info Box */}
          <View className="bg-blue-50 rounded-2xl p-4 mb-6">
            <View className="flex-row items-center mb-2">
              <Plane size={18} color="#3B82F6" />
              <Text className="text-blue-700 font-bold ml-2">Traveling Abroad?</Text>
            </View>
            <Text className="text-blue-600 text-sm leading-5">
              Register with your country's embassy before traveling. This helps them assist you in emergencies abroad.
            </Text>
          </View>

          <View className="h-32" />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
