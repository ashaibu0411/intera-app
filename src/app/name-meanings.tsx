import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Search, User, Heart, Share2, Info, Globe2, Sparkles } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

interface NameMeaning {
  id: string;
  name: string;
  meaning: string;
  origin: string;
  country: string;
  flag: string;
  gender: 'male' | 'female' | 'unisex';
  pronunciation: string;
  variations: string[];
  famousPeople: string[];
  popularity: 'common' | 'rare' | 'unique';
  isSaved: boolean;
}

const MOCK_NAMES: NameMeaning[] = [
  {
    id: '1',
    name: 'Amara',
    meaning: 'Grace, eternal, immortal',
    origin: 'Igbo',
    country: 'Nigeria',
    flag: '🇳🇬',
    gender: 'female',
    pronunciation: 'ah-MAH-rah',
    variations: ['Amira', 'Mara', 'Amarachi'],
    famousPeople: ['Amara La Negra', 'Amara Karan'],
    popularity: 'common',
    isSaved: true,
  },
  {
    id: '2',
    name: 'Kwame',
    meaning: 'Born on Saturday',
    origin: 'Akan',
    country: 'Ghana',
    flag: '🇬🇭',
    gender: 'male',
    pronunciation: 'KWAH-mee',
    variations: ['Kwami', 'Koame'],
    famousPeople: ['Kwame Nkrumah', 'Kwame Brown'],
    popularity: 'common',
    isSaved: false,
  },
  {
    id: '3',
    name: 'Zara',
    meaning: 'Princess, flower, radiance',
    origin: 'Arabic/Hebrew',
    country: 'Various',
    flag: '🌍',
    gender: 'female',
    pronunciation: 'ZAH-rah',
    variations: ['Zahra', 'Sarah', 'Zahara'],
    famousPeople: ['Zara Phillips', 'Zara Larsson'],
    popularity: 'common',
    isSaved: false,
  },
  {
    id: '4',
    name: 'Oluwaseun',
    meaning: 'God has done something worthy of thanks',
    origin: 'Yoruba',
    country: 'Nigeria',
    flag: '🇳🇬',
    gender: 'unisex',
    pronunciation: 'oh-loo-wah-SHEH-oon',
    variations: ['Seun', 'Oluseun', 'Shayo'],
    famousPeople: ['Seun Kuti'],
    popularity: 'common',
    isSaved: false,
  },
  {
    id: '5',
    name: 'Kofi',
    meaning: 'Born on Friday',
    origin: 'Akan',
    country: 'Ghana',
    flag: '🇬🇭',
    gender: 'male',
    pronunciation: 'KOH-fee',
    variations: ['Kofe', 'Cofi'],
    famousPeople: ['Kofi Annan', 'Kofi Kingston'],
    popularity: 'common',
    isSaved: true,
  },
  {
    id: '6',
    name: 'Nia',
    meaning: 'Purpose, intention, brilliance',
    origin: 'Swahili',
    country: 'East Africa',
    flag: '🇰🇪',
    gender: 'female',
    pronunciation: 'NEE-ah',
    variations: ['Niya', 'Nya'],
    famousPeople: ['Nia Long', 'Nia DaCosta'],
    popularity: 'common',
    isSaved: false,
  },
  {
    id: '7',
    name: 'Jabari',
    meaning: 'Brave one, fearless',
    origin: 'Swahili',
    country: 'East Africa',
    flag: '🇹🇿',
    gender: 'male',
    pronunciation: 'jah-BAH-ree',
    variations: ['Jabar', 'Jabbar'],
    famousPeople: ['Jabari Parker'],
    popularity: 'rare',
    isSaved: false,
  },
  {
    id: '8',
    name: 'Ayanna',
    meaning: 'Beautiful flower',
    origin: 'Ethiopian',
    country: 'Ethiopia',
    flag: '🇪🇹',
    gender: 'female',
    pronunciation: 'ah-YAH-nah',
    variations: ['Ayana', 'Ayani', 'Yana'],
    famousPeople: ['Ayanna Pressley'],
    popularity: 'rare',
    isSaved: false,
  },
  {
    id: '9',
    name: 'Chinwe',
    meaning: 'God owns',
    origin: 'Igbo',
    country: 'Nigeria',
    flag: '🇳🇬',
    gender: 'female',
    pronunciation: 'CHIN-way',
    variations: ['Chinwendu', 'Chinenye'],
    famousPeople: ['Chinwe Chukwuogo-Roy'],
    popularity: 'rare',
    isSaved: false,
  },
  {
    id: '10',
    name: 'Tariq',
    meaning: 'Morning star, he who knocks at the door',
    origin: 'Arabic',
    country: 'Various',
    flag: '🌙',
    gender: 'male',
    pronunciation: 'tah-REEK',
    variations: ['Tarik', 'Tareq'],
    famousPeople: ['Tariq Ramadan', 'Tariq Nasheed'],
    popularity: 'common',
    isSaved: false,
  },
  {
    id: '11',
    name: 'Adaeze',
    meaning: 'King\'s daughter, princess',
    origin: 'Igbo',
    country: 'Nigeria',
    flag: '🇳🇬',
    gender: 'female',
    pronunciation: 'ah-dah-EH-zeh',
    variations: ['Ada', 'Adanna'],
    famousPeople: ['Adaeze Igwe'],
    popularity: 'rare',
    isSaved: false,
  },
  {
    id: '12',
    name: 'Malik',
    meaning: 'King, master, owner',
    origin: 'Arabic',
    country: 'Various',
    flag: '🌍',
    gender: 'male',
    pronunciation: 'mah-LEEK',
    variations: ['Malek', 'Malick'],
    famousPeople: ['Malik Obama', 'Zayn Malik'],
    popularity: 'common',
    isSaved: false,
  },
];

const ORIGINS = ['All', 'Yoruba', 'Igbo', 'Akan', 'Swahili', 'Arabic', 'Ethiopian'];
const GENDERS = ['All', 'Male', 'Female', 'Unisex'];

const GENDER_COLORS = {
  male: '#3B82F6',
  female: '#EC4899',
  unisex: '#8B5CF6',
};

const POPULARITY_BADGES = {
  common: { label: 'Popular', color: '#10B981' },
  rare: { label: 'Rare', color: '#F59E0B' },
  unique: { label: 'Unique', color: '#8B5CF6' },
};

export default function NameMeaningsScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrigin, setSelectedOrigin] = useState('All');
  const [selectedGender, setSelectedGender] = useState('All');
  const [names, setNames] = useState(MOCK_NAMES);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filteredNames = names.filter(name => {
    const matchesSearch = searchQuery === '' ||
      name.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      name.meaning.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesOrigin = selectedOrigin === 'All' || name.origin === selectedOrigin;
    const matchesGender = selectedGender === 'All' || name.gender === selectedGender.toLowerCase();
    return matchesSearch && matchesOrigin && matchesGender;
  });

  const toggleSave = (nameId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setNames(prev => prev.map(n => {
      if (n.id === nameId) {
        return { ...n, isSaved: !n.isSaved };
      }
      return n;
    }));
  };

  return (
    <View className="flex-1 bg-[#1A1625]">
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
              <Sparkles size={20} color="#EC4899" />
              <Text className="text-white text-lg font-bold ml-2">Name Meanings</Text>
            </View>
            <View className="w-10" />
          </View>

          {/* Hero */}
          <LinearGradient
            colors={['#6366F1', '#EC4899']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ borderRadius: 20, padding: 16, marginBottom: 16 }}
          >
            <Text className="text-white/80 text-sm">Discover the meaning behind</Text>
            <Text className="text-white text-xl font-bold">African & Cultural Names</Text>
            <Text className="text-white/70 text-sm mt-1">Explore origins, pronunciations, and famous people</Text>
          </LinearGradient>

          {/* Search */}
          <View className="flex-row items-center bg-white/10 rounded-2xl px-4 py-3 mb-4">
            <Search size={18} color="#9CA3AF" />
            <TextInput
              placeholder="Search names or meanings..."
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
              className="flex-1 ml-3 text-white text-base"
            />
          </View>

          {/* Gender Filter */}
          <View className="flex-row gap-2 mb-3">
            {GENDERS.map((gender) => (
              <Pressable
                key={gender}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setSelectedGender(gender);
                }}
                className={`px-4 py-2 rounded-full ${
                  selectedGender === gender
                    ? 'bg-pink-500'
                    : 'bg-white/10'
                }`}
              >
                <Text className={`font-medium ${
                  selectedGender === gender ? 'text-white' : 'text-gray-300'
                }`}>
                  {gender}
                </Text>
              </Pressable>
            ))}
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
                  className={`px-4 py-2 rounded-full ${
                    selectedOrigin === origin
                      ? 'bg-indigo-500'
                      : 'bg-white/10'
                  }`}
                >
                  <Text className={`font-medium ${
                    selectedOrigin === origin ? 'text-white' : 'text-gray-300'
                  }`}>
                    {origin}
                  </Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Names List */}
        <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
          {filteredNames.map((name, index) => (
            <Animated.View
              key={name.id}
              entering={FadeInDown.delay(index * 60).springify()}
            >
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setExpandedId(expandedId === name.id ? null : name.id);
                }}
                className="bg-white/5 rounded-3xl mb-4 overflow-hidden border border-white/10"
              >
                {/* Header */}
                <View className="p-4">
                  <View className="flex-row items-start justify-between mb-2">
                    <View className="flex-row items-center">
                      <Text className="text-3xl mr-3">{name.flag}</Text>
                      <View>
                        <View className="flex-row items-center">
                          <Text className="text-white text-2xl font-bold">{name.name}</Text>
                          <View
                            className="ml-2 w-6 h-6 rounded-full items-center justify-center"
                            style={{ backgroundColor: GENDER_COLORS[name.gender] }}
                          >
                            <User size={12} color="#fff" />
                          </View>
                        </View>
                        <Text className="text-gray-400 text-sm">{name.pronunciation}</Text>
                      </View>
                    </View>
                    <View className="flex-row items-center gap-2">
                      <View
                        className="px-2 py-1 rounded-full"
                        style={{ backgroundColor: POPULARITY_BADGES[name.popularity].color + '30' }}
                      >
                        <Text style={{ color: POPULARITY_BADGES[name.popularity].color }} className="text-xs font-medium">
                          {POPULARITY_BADGES[name.popularity].label}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <Text className="text-pink-400 text-lg font-medium mb-2">"{name.meaning}"</Text>

                  <View className="flex-row items-center">
                    <Globe2 size={14} color="#9CA3AF" />
                    <Text className="text-gray-400 text-sm ml-1">{name.origin} • {name.country}</Text>
                  </View>
                </View>

                {/* Expanded Content */}
                {expandedId === name.id && (
                  <Animated.View
                    entering={FadeIn.duration(200)}
                    className="border-t border-white/10 p-4"
                  >
                    {/* Variations */}
                    <View className="mb-4">
                      <Text className="text-gray-400 text-xs mb-2">VARIATIONS</Text>
                      <View className="flex-row flex-wrap gap-2">
                        {name.variations.map((variation, idx) => (
                          <View key={idx} className="bg-white/10 px-3 py-1.5 rounded-full">
                            <Text className="text-white text-sm">{variation}</Text>
                          </View>
                        ))}
                      </View>
                    </View>

                    {/* Famous People */}
                    <View className="mb-4">
                      <Text className="text-gray-400 text-xs mb-2">FAMOUS PEOPLE</Text>
                      <View className="flex-row flex-wrap gap-2">
                        {name.famousPeople.map((person, idx) => (
                          <View key={idx} className="bg-indigo-500/20 px-3 py-1.5 rounded-full">
                            <Text className="text-indigo-300 text-sm">{person}</Text>
                          </View>
                        ))}
                      </View>
                    </View>

                    {/* Actions */}
                    <View className="flex-row items-center gap-3">
                      <Pressable
                        onPress={() => toggleSave(name.id)}
                        className={`flex-1 flex-row items-center justify-center py-3 rounded-xl ${
                          name.isSaved ? 'bg-pink-500' : 'bg-white/10'
                        }`}
                      >
                        <Heart
                          size={18}
                          color={name.isSaved ? '#fff' : '#EC4899'}
                          fill={name.isSaved ? '#fff' : 'transparent'}
                        />
                        <Text className={`ml-2 font-medium ${name.isSaved ? 'text-white' : 'text-pink-400'}`}>
                          {name.isSaved ? 'Saved' : 'Save'}
                        </Text>
                      </Pressable>
                      <Pressable className="flex-1 flex-row items-center justify-center py-3 rounded-xl bg-white/10">
                        <Share2 size={18} color="#fff" />
                        <Text className="text-white ml-2 font-medium">Share</Text>
                      </Pressable>
                    </View>
                  </Animated.View>
                )}
              </Pressable>
            </Animated.View>
          ))}

          <View className="h-32" />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
