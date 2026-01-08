import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, RefreshCw, Quote, Share2, Heart, Bookmark, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, FadeInDown, useAnimatedStyle, withRepeat, withSequence, withTiming, withSpring } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

interface Proverb {
  id: string;
  text: string;
  meaning: string;
  origin: string;
  country: string;
  flag: string;
  category: string;
  isSaved: boolean;
}

const PROVERBS: Proverb[] = [
  // African Proverbs
  {
    id: '1',
    text: 'If you want to go fast, go alone. If you want to go far, go together.',
    meaning: 'Collaboration and community are essential for achieving lasting success.',
    origin: 'African',
    country: 'Various African Nations',
    flag: '🌍',
    category: 'Unity',
    isSaved: false,
  },
  {
    id: '2',
    text: 'The child who is not embraced by the village will burn it down to feel its warmth.',
    meaning: 'A community must care for all its members, especially the vulnerable ones.',
    origin: 'African',
    country: 'Various African Nations',
    flag: '🌍',
    category: 'Community',
    isSaved: true,
  },
  {
    id: '3',
    text: 'When spider webs unite, they can tie up a lion.',
    meaning: 'Unity and cooperation can overcome the most powerful obstacles.',
    origin: 'Ethiopian',
    country: 'Ethiopia',
    flag: '🇪🇹',
    category: 'Strength',
    isSaved: false,
  },
  {
    id: '4',
    text: 'Knowledge is like a garden: if it is not cultivated, it cannot be harvested.',
    meaning: 'Learning requires continuous effort and nurturing to bear fruit.',
    origin: 'Ghanaian',
    country: 'Ghana',
    flag: '🇬🇭',
    category: 'Wisdom',
    isSaved: false,
  },
  {
    id: '5',
    text: 'However long the night, the dawn will break.',
    meaning: 'No matter how difficult times are, hope and relief will eventually come.',
    origin: 'West African',
    country: 'Various West African Nations',
    flag: '🌅',
    category: 'Hope',
    isSaved: true,
  },
  {
    id: '6',
    text: 'The axe forgets; the tree remembers.',
    meaning: 'Those who cause harm may forget their actions, but the wounded remember.',
    origin: 'Zimbabwean',
    country: 'Zimbabwe',
    flag: '🇿🇼',
    category: 'Justice',
    isSaved: false,
  },
  {
    id: '7',
    text: 'A tree cannot stand without its roots.',
    meaning: 'We cannot thrive without staying connected to our heritage and origins.',
    origin: 'Yoruba',
    country: 'Nigeria',
    flag: '🇳🇬',
    category: 'Heritage',
    isSaved: false,
  },
  {
    id: '8',
    text: 'Wisdom is like a baobab tree; no one individual can embrace it.',
    meaning: 'True wisdom is vast and requires the collective knowledge of many.',
    origin: 'Akan',
    country: 'Ghana',
    flag: '🇬🇭',
    category: 'Wisdom',
    isSaved: false,
  },
  {
    id: '9',
    text: 'Cross the river in a crowd and the crocodile won\'t eat you.',
    meaning: 'There is safety and strength in community and solidarity.',
    origin: 'Malagasy',
    country: 'Madagascar',
    flag: '🇲🇬',
    category: 'Unity',
    isSaved: false,
  },
  {
    id: '10',
    text: 'Do not call the forest that shelters you a jungle.',
    meaning: 'Respect and appreciate those who support and protect you.',
    origin: 'Ghanaian',
    country: 'Ghana',
    flag: '🇬🇭',
    category: 'Gratitude',
    isSaved: false,
  },
  {
    id: '11',
    text: 'The words of the elders become sweet some day.',
    meaning: 'The wisdom of those with experience reveals its value over time.',
    origin: 'Igbo',
    country: 'Nigeria',
    flag: '🇳🇬',
    category: 'Elders',
    isSaved: false,
  },
  {
    id: '12',
    text: 'He who learns, teaches.',
    meaning: 'Knowledge should be shared; learning creates a responsibility to educate others.',
    origin: 'Ethiopian',
    country: 'Ethiopia',
    flag: '🇪🇹',
    category: 'Education',
    isSaved: true,
  },
  {
    id: '13',
    text: 'Rain does not fall on one roof alone.',
    meaning: 'Problems and challenges affect everyone; no one is exempt from hardship.',
    origin: 'Cameroonian',
    country: 'Cameroon',
    flag: '🇨🇲',
    category: 'Community',
    isSaved: false,
  },
  {
    id: '14',
    text: 'Where there is love, there is no darkness.',
    meaning: 'Love illuminates and guides us through difficult times.',
    origin: 'Burundian',
    country: 'Burundi',
    flag: '🇧🇮',
    category: 'Love',
    isSaved: false,
  },
  // Asian Proverbs
  {
    id: '15',
    text: 'Fall seven times, stand up eight.',
    meaning: 'Perseverance and resilience are key to overcoming failure.',
    origin: 'Japanese',
    country: 'Japan',
    flag: '🇯🇵',
    category: 'Strength',
    isSaved: false,
  },
  {
    id: '16',
    text: 'A journey of a thousand miles begins with a single step.',
    meaning: 'Every great achievement starts with taking the first small action.',
    origin: 'Chinese',
    country: 'China',
    flag: '🇨🇳',
    category: 'Wisdom',
    isSaved: false,
  },
  {
    id: '17',
    text: 'The bamboo that bends is stronger than the oak that resists.',
    meaning: 'Flexibility and adaptability are greater strengths than rigid stubbornness.',
    origin: 'Chinese',
    country: 'China',
    flag: '🇨🇳',
    category: 'Strength',
    isSaved: false,
  },
  {
    id: '18',
    text: 'Vision without action is a daydream. Action without vision is a nightmare.',
    meaning: 'Dreams and plans must be balanced with purposeful action.',
    origin: 'Japanese',
    country: 'Japan',
    flag: '🇯🇵',
    category: 'Wisdom',
    isSaved: false,
  },
  {
    id: '19',
    text: 'An inch of time is an inch of gold, but gold cannot buy an inch of time.',
    meaning: 'Time is the most precious resource; once lost, it cannot be recovered.',
    origin: 'Chinese',
    country: 'China',
    flag: '🇨🇳',
    category: 'Wisdom',
    isSaved: false,
  },
  {
    id: '20',
    text: 'The nail that sticks out gets hammered down.',
    meaning: 'Society often pressures individuals to conform rather than stand out.',
    origin: 'Japanese',
    country: 'Japan',
    flag: '🇯🇵',
    category: 'Community',
    isSaved: false,
  },
  {
    id: '21',
    text: 'When eating fruit, remember who planted the tree.',
    meaning: 'Always honor and remember those who came before you and made your success possible.',
    origin: 'Vietnamese',
    country: 'Vietnam',
    flag: '🇻🇳',
    category: 'Gratitude',
    isSaved: false,
  },
  {
    id: '22',
    text: 'A single conversation with a wise person is worth a month\'s study of books.',
    meaning: 'Direct learning from experienced people can be more valuable than theoretical knowledge.',
    origin: 'Chinese',
    country: 'China',
    flag: '🇨🇳',
    category: 'Elders',
    isSaved: false,
  },
  {
    id: '23',
    text: 'Even monkeys fall from trees.',
    meaning: 'Even experts make mistakes; no one is perfect.',
    origin: 'Korean',
    country: 'South Korea',
    flag: '🇰🇷',
    category: 'Wisdom',
    isSaved: false,
  },
  {
    id: '24',
    text: 'The frog in the well knows nothing of the great ocean.',
    meaning: 'Limited experience leads to a narrow worldview.',
    origin: 'Japanese',
    country: 'Japan',
    flag: '🇯🇵',
    category: 'Education',
    isSaved: false,
  },
  {
    id: '25',
    text: 'A gem cannot be polished without friction, nor a person perfected without trials.',
    meaning: 'Challenges and difficulties are necessary for personal growth.',
    origin: 'Chinese',
    country: 'China',
    flag: '🇨🇳',
    category: 'Strength',
    isSaved: false,
  },
  // Indian Proverbs
  {
    id: '26',
    text: 'The true measure of a person is how they treat someone who can do them no good.',
    meaning: 'Character is revealed by how we treat those from whom we expect nothing.',
    origin: 'Indian',
    country: 'India',
    flag: '🇮🇳',
    category: 'Justice',
    isSaved: false,
  },
  {
    id: '27',
    text: 'A thirsty person should not complain about the shape of the cup.',
    meaning: 'Be grateful for what you receive rather than focusing on imperfections.',
    origin: 'Indian',
    country: 'India',
    flag: '🇮🇳',
    category: 'Gratitude',
    isSaved: false,
  },
  {
    id: '28',
    text: 'The lamp that lights others must first burn within itself.',
    meaning: 'To help others, you must first develop your own inner strength.',
    origin: 'Indian',
    country: 'India',
    flag: '🇮🇳',
    category: 'Wisdom',
    isSaved: false,
  },
  // Middle Eastern Proverbs
  {
    id: '29',
    text: 'Trust in God, but tie your camel.',
    meaning: 'Have faith but also take practical precautions.',
    origin: 'Arabic',
    country: 'Various Arab Nations',
    flag: '🌙',
    category: 'Wisdom',
    isSaved: false,
  },
  {
    id: '30',
    text: 'The wound that bleeds inward is the most dangerous.',
    meaning: 'Hidden emotional pain can be more harmful than visible injuries.',
    origin: 'Persian',
    country: 'Iran',
    flag: '🇮🇷',
    category: 'Wisdom',
    isSaved: false,
  },
  {
    id: '31',
    text: 'If you have two loaves of bread, sell one and buy flowers.',
    meaning: 'Life requires not just sustenance but also beauty and joy.',
    origin: 'Arabic',
    country: 'Various Arab Nations',
    flag: '🌙',
    category: 'Love',
    isSaved: false,
  },
  {
    id: '32',
    text: 'He who plants thorns must not expect to gather roses.',
    meaning: 'Your actions determine your outcomes; you reap what you sow.',
    origin: 'Arabic',
    country: 'Various Arab Nations',
    flag: '🌙',
    category: 'Justice',
    isSaved: false,
  },
  // European Proverbs
  {
    id: '33',
    text: 'A society grows great when old men plant trees in whose shade they shall never sit.',
    meaning: 'True greatness comes from investing in future generations.',
    origin: 'Greek',
    country: 'Greece',
    flag: '🇬🇷',
    category: 'Heritage',
    isSaved: false,
  },
  {
    id: '34',
    text: 'The darkest hour is just before dawn.',
    meaning: 'Things often get worse right before they improve.',
    origin: 'English',
    country: 'United Kingdom',
    flag: '🇬🇧',
    category: 'Hope',
    isSaved: false,
  },
  {
    id: '35',
    text: 'Smooth seas do not make skillful sailors.',
    meaning: 'Difficult times build experience and capability.',
    origin: 'English',
    country: 'United Kingdom',
    flag: '🇬🇧',
    category: 'Strength',
    isSaved: false,
  },
  {
    id: '36',
    text: 'In the middle of difficulty lies opportunity.',
    meaning: 'Challenges often contain hidden possibilities for growth.',
    origin: 'German',
    country: 'Germany',
    flag: '🇩🇪',
    category: 'Hope',
    isSaved: false,
  },
  {
    id: '37',
    text: 'A candle loses nothing by lighting another candle.',
    meaning: 'Helping others does not diminish your own light.',
    origin: 'Italian',
    country: 'Italy',
    flag: '🇮🇹',
    category: 'Community',
    isSaved: false,
  },
  {
    id: '38',
    text: 'The one who asks a question is a fool for a minute; the one who does not is a fool for life.',
    meaning: 'It is better to seek knowledge than remain ignorant.',
    origin: 'French',
    country: 'France',
    flag: '🇫🇷',
    category: 'Education',
    isSaved: false,
  },
  {
    id: '39',
    text: 'Shared joy is double joy; shared sorrow is half sorrow.',
    meaning: 'Connection with others amplifies happiness and lightens burdens.',
    origin: 'Swedish',
    country: 'Sweden',
    flag: '🇸🇪',
    category: 'Unity',
    isSaved: false,
  },
  // Latin American Proverbs
  {
    id: '40',
    text: 'Little by little, one walks far.',
    meaning: 'Consistent small efforts lead to great achievements.',
    origin: 'Peruvian',
    country: 'Peru',
    flag: '🇵🇪',
    category: 'Strength',
    isSaved: false,
  },
  {
    id: '41',
    text: 'Tell me who you walk with, and I will tell you who you are.',
    meaning: 'The company you keep reflects and shapes your character.',
    origin: 'Spanish',
    country: 'Spain',
    flag: '🇪🇸',
    category: 'Community',
    isSaved: false,
  },
  {
    id: '42',
    text: 'He who divides and shares is left with the best share.',
    meaning: 'Generosity brings the greatest rewards.',
    origin: 'Mexican',
    country: 'Mexico',
    flag: '🇲🇽',
    category: 'Gratitude',
    isSaved: false,
  },
  {
    id: '43',
    text: 'Hope is the last thing to die.',
    meaning: 'Even in the darkest times, hope persists.',
    origin: 'Brazilian',
    country: 'Brazil',
    flag: '🇧🇷',
    category: 'Hope',
    isSaved: false,
  },
  // Native American Proverbs
  {
    id: '44',
    text: 'We do not inherit the earth from our ancestors; we borrow it from our children.',
    meaning: 'We have a responsibility to preserve the world for future generations.',
    origin: 'Native American',
    country: 'North America',
    flag: '🦅',
    category: 'Heritage',
    isSaved: false,
  },
  {
    id: '45',
    text: 'Listen to the wind, it talks. Listen to the silence, it speaks. Listen to your heart, it knows.',
    meaning: 'True wisdom comes from being attuned to nature and your inner self.',
    origin: 'Native American',
    country: 'North America',
    flag: '🦅',
    category: 'Wisdom',
    isSaved: false,
  },
  {
    id: '46',
    text: 'Don\'t be afraid to cry. It will free your mind of sorrowful thoughts.',
    meaning: 'Expressing emotions is a path to healing and clarity.',
    origin: 'Hopi',
    country: 'North America',
    flag: '🦅',
    category: 'Wisdom',
    isSaved: false,
  },
  // Caribbean Proverbs
  {
    id: '47',
    text: 'The river that forgets its source will dry up.',
    meaning: 'Never forget your origins and the people who helped you.',
    origin: 'Jamaican',
    country: 'Jamaica',
    flag: '🇯🇲',
    category: 'Heritage',
    isSaved: false,
  },
  {
    id: '48',
    text: 'One hand can\'t clap.',
    meaning: 'Success requires cooperation and working together.',
    origin: 'Jamaican',
    country: 'Jamaica',
    flag: '🇯🇲',
    category: 'Unity',
    isSaved: false,
  },
  // Australian Proverbs
  {
    id: '49',
    text: 'We are all visitors to this time, this place. We are just passing through.',
    meaning: 'Life is temporary; focus on what truly matters.',
    origin: 'Aboriginal',
    country: 'Australia',
    flag: '🇦🇺',
    category: 'Wisdom',
    isSaved: false,
  },
  {
    id: '50',
    text: 'Those who lose dreaming are lost.',
    meaning: 'Dreams and aspirations give life meaning and direction.',
    origin: 'Aboriginal',
    country: 'Australia',
    flag: '🇦🇺',
    category: 'Hope',
    isSaved: false,
  },
  // More African Proverbs
  {
    id: '51',
    text: 'A roaring lion kills no game.',
    meaning: 'Actions speak louder than words; boasting accomplishes nothing.',
    origin: 'Kenyan',
    country: 'Kenya',
    flag: '🇰🇪',
    category: 'Wisdom',
    isSaved: false,
  },
  {
    id: '52',
    text: 'Until the lion tells his story, the hunter will always be the hero.',
    meaning: 'History is told by those in power; every perspective matters.',
    origin: 'African',
    country: 'Various African Nations',
    flag: '🌍',
    category: 'Justice',
    isSaved: false,
  },
  {
    id: '53',
    text: 'Teeth are not seen but even the blind know they are there.',
    meaning: 'Some truths are felt even when they cannot be seen.',
    origin: 'Zulu',
    country: 'South Africa',
    flag: '🇿🇦',
    category: 'Wisdom',
    isSaved: false,
  },
  {
    id: '54',
    text: 'A bird that flies off the earth and lands on an anthill is still on the ground.',
    meaning: 'Small achievements should not be mistaken for great success.',
    origin: 'Igbo',
    country: 'Nigeria',
    flag: '🇳🇬',
    category: 'Wisdom',
    isSaved: false,
  },
  // Russian Proverbs
  {
    id: '55',
    text: 'The morning is wiser than the evening.',
    meaning: 'Rest and a fresh perspective often bring clarity.',
    origin: 'Russian',
    country: 'Russia',
    flag: '🇷🇺',
    category: 'Wisdom',
    isSaved: false,
  },
  {
    id: '56',
    text: 'A kind word is like a spring day.',
    meaning: 'Kindness brings warmth and renewal to others.',
    origin: 'Russian',
    country: 'Russia',
    flag: '🇷🇺',
    category: 'Love',
    isSaved: false,
  },
  // Scandinavian Proverbs
  {
    id: '57',
    text: 'There is no bad weather, only bad clothing.',
    meaning: 'With proper preparation, any challenge can be faced.',
    origin: 'Norwegian',
    country: 'Norway',
    flag: '🇳🇴',
    category: 'Strength',
    isSaved: false,
  },
  {
    id: '58',
    text: 'Worry often gives a small thing a big shadow.',
    meaning: 'Anxiety magnifies problems beyond their actual size.',
    origin: 'Swedish',
    country: 'Sweden',
    flag: '🇸🇪',
    category: 'Wisdom',
    isSaved: false,
  },
  // Filipino Proverbs
  {
    id: '59',
    text: 'He who does not look back at where he came from will not reach his destination.',
    meaning: 'Remembering your roots is essential for moving forward.',
    origin: 'Filipino',
    country: 'Philippines',
    flag: '🇵🇭',
    category: 'Heritage',
    isSaved: false,
  },
  {
    id: '60',
    text: 'A broom is sturdy because its strands are tightly bound.',
    meaning: 'United people are stronger than individuals acting alone.',
    origin: 'Filipino',
    country: 'Philippines',
    flag: '🇵🇭',
    category: 'Unity',
    isSaved: false,
  },
];

const CATEGORIES = ['All', 'Unity', 'Wisdom', 'Hope', 'Community', 'Heritage', 'Strength', 'Gratitude', 'Justice', 'Love', 'Elders', 'Education'];

const GRADIENT_SETS = [
  ['#6366F1', '#8B5CF6'],
  ['#EC4899', '#F43F5E'],
  ['#10B981', '#059669'],
  ['#F59E0B', '#D97706'],
  ['#3B82F6', '#2563EB'],
  ['#8B5CF6', '#7C3AED'],
];

export default function ProverbsWisdomScreen() {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [proverbs, setProverbs] = useState(PROVERBS);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [viewMode, setViewMode] = useState<'daily' | 'browse'>('daily');

  const filteredProverbs = proverbs.filter(p =>
    selectedCategory === 'All' || p.category === selectedCategory
  );

  const currentProverb = filteredProverbs[currentIndex] || filteredProverbs[0];
  const gradientColors = GRADIENT_SETS[currentIndex % GRADIENT_SETS.length];

  const goToNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCurrentIndex(prev => (prev + 1) % filteredProverbs.length);
  };

  const goToPrev = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCurrentIndex(prev => (prev - 1 + filteredProverbs.length) % filteredProverbs.length);
  };

  const toggleSave = (proverbId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setProverbs(prev => prev.map(p => {
      if (p.id === proverbId) {
        return { ...p, isSaved: !p.isSaved };
      }
      return p;
    }));
  };

  const getRandomProverb = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const randomIndex = Math.floor(Math.random() * filteredProverbs.length);
    setCurrentIndex(randomIndex);
  };

  return (
    <View className="flex-1 bg-[#0F0A19]">
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
              <Sparkles size={20} color="#F59E0B" />
              <Text className="text-white text-lg font-bold ml-2">Proverbs & Wisdom</Text>
            </View>
            <Pressable
              onPress={getRandomProverb}
              className="w-10 h-10 rounded-full bg-white/10 items-center justify-center"
            >
              <RefreshCw size={20} color="#fff" />
            </Pressable>
          </View>

          {/* View Mode Toggle */}
          <View className="flex-row bg-white/10 rounded-2xl p-1 mb-4">
            <Pressable
              onPress={() => setViewMode('daily')}
              className={`flex-1 py-2.5 rounded-xl items-center ${
                viewMode === 'daily' ? 'bg-amber-500' : ''
              }`}
            >
              <Text className={viewMode === 'daily' ? 'text-black font-bold' : 'text-gray-400'}>
                Daily Wisdom
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setViewMode('browse')}
              className={`flex-1 py-2.5 rounded-xl items-center ${
                viewMode === 'browse' ? 'bg-amber-500' : ''
              }`}
            >
              <Text className={viewMode === 'browse' ? 'text-black font-bold' : 'text-gray-400'}>
                Browse All
              </Text>
            </Pressable>
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
                    setCurrentIndex(0);
                  }}
                  className={`px-4 py-2 rounded-full ${
                    selectedCategory === category
                      ? 'bg-amber-500'
                      : 'bg-white/10'
                  }`}
                >
                  <Text className={`font-medium ${
                    selectedCategory === category ? 'text-black' : 'text-gray-300'
                  }`}>
                    {category}
                  </Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        </View>

        {viewMode === 'daily' ? (
          /* Daily Wisdom Card */
          <View className="flex-1 px-5">
            <Animated.View
              entering={FadeIn.duration(500)}
              className="flex-1"
            >
              <LinearGradient
                colors={gradientColors as [string, string]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ flex: 1, borderRadius: 32, padding: 2 }}
              >
                <View className="flex-1 bg-[#1A1625] rounded-[30px] p-6 justify-between">
                  {/* Quote Icon */}
                  <View className="items-center mb-4">
                    <View className="w-16 h-16 rounded-full bg-white/10 items-center justify-center">
                      <Quote size={32} color="#F59E0B" />
                    </View>
                  </View>

                  {/* Proverb Text */}
                  <View className="flex-1 justify-center">
                    <Text className="text-white text-2xl font-bold text-center leading-10 mb-6">
                      "{currentProverb?.text}"
                    </Text>

                    <View className="bg-white/10 rounded-2xl p-4 mb-4">
                      <Text className="text-amber-400 text-sm font-bold mb-1">Meaning</Text>
                      <Text className="text-gray-300 text-base leading-6">{currentProverb?.meaning}</Text>
                    </View>
                  </View>

                  {/* Origin */}
                  <View className="items-center mb-4">
                    <View className="flex-row items-center bg-white/10 px-4 py-2 rounded-full">
                      <Text className="text-2xl mr-2">{currentProverb?.flag}</Text>
                      <Text className="text-white font-medium">{currentProverb?.origin} Proverb</Text>
                    </View>
                    <Text className="text-gray-500 text-sm mt-1">{currentProverb?.country}</Text>
                  </View>

                  {/* Navigation & Actions */}
                  <View className="flex-row items-center justify-between">
                    <Pressable
                      onPress={goToPrev}
                      className="w-12 h-12 rounded-full bg-white/10 items-center justify-center"
                    >
                      <ChevronLeft size={24} color="#fff" />
                    </Pressable>

                    <View className="flex-row items-center gap-4">
                      <Pressable
                        onPress={() => toggleSave(currentProverb?.id || '')}
                        className={`w-12 h-12 rounded-full items-center justify-center ${
                          currentProverb?.isSaved ? 'bg-amber-500' : 'bg-white/10'
                        }`}
                      >
                        <Bookmark
                          size={22}
                          color={currentProverb?.isSaved ? '#000' : '#fff'}
                          fill={currentProverb?.isSaved ? '#000' : 'transparent'}
                        />
                      </Pressable>
                      <Pressable className="w-12 h-12 rounded-full bg-white/10 items-center justify-center">
                        <Share2 size={22} color="#fff" />
                      </Pressable>
                    </View>

                    <Pressable
                      onPress={goToNext}
                      className="w-12 h-12 rounded-full bg-white/10 items-center justify-center"
                    >
                      <ChevronRight size={24} color="#fff" />
                    </Pressable>
                  </View>

                  {/* Progress Dots */}
                  <View className="flex-row justify-center mt-4 gap-1">
                    {filteredProverbs.slice(0, 10).map((_, idx) => (
                      <View
                        key={idx}
                        className={`w-2 h-2 rounded-full ${
                          idx === currentIndex ? 'bg-amber-500' : 'bg-white/20'
                        }`}
                      />
                    ))}
                    {filteredProverbs.length > 10 && (
                      <Text className="text-gray-500 text-xs ml-1">+{filteredProverbs.length - 10}</Text>
                    )}
                  </View>
                </View>
              </LinearGradient>
            </Animated.View>

            <View className="h-8" />
          </View>
        ) : (
          /* Browse All */
          <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
            {filteredProverbs.map((proverb, index) => (
              <Animated.View
                key={proverb.id}
                entering={FadeInDown.delay(index * 60).springify()}
              >
                <Pressable
                  onPress={() => {
                    setCurrentIndex(index);
                    setViewMode('daily');
                  }}
                  className="bg-white/5 rounded-2xl p-4 mb-3 border border-white/10"
                >
                  <View className="flex-row items-start">
                    <Text className="text-2xl mr-3">{proverb.flag}</Text>
                    <View className="flex-1">
                      <Text className="text-white font-medium text-base mb-2" numberOfLines={2}>"{proverb.text}"</Text>
                      <View className="flex-row items-center justify-between">
                        <View className="flex-row items-center">
                          <View className="bg-amber-500/20 px-2 py-0.5 rounded-full">
                            <Text className="text-amber-400 text-xs">{proverb.category}</Text>
                          </View>
                          <Text className="text-gray-500 text-xs ml-2">{proverb.origin}</Text>
                        </View>
                        <Pressable onPress={() => toggleSave(proverb.id)}>
                          <Bookmark
                            size={18}
                            color={proverb.isSaved ? '#F59E0B' : '#6B7280'}
                            fill={proverb.isSaved ? '#F59E0B' : 'transparent'}
                          />
                        </Pressable>
                      </View>
                    </View>
                  </View>
                </Pressable>
              </Animated.View>
            ))}

            <View className="h-32" />
          </ScrollView>
        )}
      </SafeAreaView>
    </View>
  );
}
