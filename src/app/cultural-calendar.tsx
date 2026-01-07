import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, Pressable, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { ArrowLeft, Bell, BellOff, Search, Calendar, Globe2, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';

interface CulturalHoliday {
  id: string;
  name: string;
  date: string;
  month: number;
  day: number;
  culture: string;
  country: string;
  flag: string;
  description: string;
  traditions: string[];
  image: string;
  color: string;
  isPublicHoliday: boolean;
}

const CULTURAL_HOLIDAYS: CulturalHoliday[] = [
  // January
  { id: '1', name: 'New Year\'s Day', date: 'January 1', month: 1, day: 1, culture: 'Global', country: 'Worldwide', flag: '🌍', description: 'Celebration of the first day of the new year in the Gregorian calendar.', traditions: ['Fireworks', 'Countdown', 'Resolutions', 'Family gatherings'], image: 'https://images.unsplash.com/photo-1467810563316-b5476525c0f9?w=400', color: '#FFD700', isPublicHoliday: true },
  { id: '2', name: 'Orthodox Christmas', date: 'January 7', month: 1, day: 7, culture: 'Ethiopian', country: 'Ethiopia', flag: '🇪🇹', description: 'Ethiopian Orthodox Christmas (Ganna) celebrates the birth of Jesus Christ.', traditions: ['Church services', 'Traditional games', 'Fasting', 'White clothing'], image: 'https://images.unsplash.com/photo-1576919228236-a097c32a5cd4?w=400', color: '#228B22', isPublicHoliday: true },
  { id: '3', name: 'Makar Sankranti', date: 'January 14', month: 1, day: 14, culture: 'Indian', country: 'India', flag: '🇮🇳', description: 'Hindu harvest festival marking the transition of the sun into Capricorn.', traditions: ['Kite flying', 'Bonfires', 'Til-gul sweets', 'Holy dips'], image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400', color: '#FF6B35', isPublicHoliday: true },
  { id: '4', name: 'Martin Luther King Jr. Day', date: 'January 15', month: 1, day: 15, culture: 'African American', country: 'USA', flag: '🇺🇸', description: 'Federal holiday honoring Dr. Martin Luther King Jr. and his legacy of civil rights.', traditions: ['Community service', 'Marches', 'Educational programs'], image: 'https://images.unsplash.com/photo-1591197172062-c718f82aba20?w=400', color: '#1E3A5F', isPublicHoliday: true },

  // February
  { id: '5', name: 'Lunar New Year', date: 'February 10', month: 2, day: 10, culture: 'Chinese', country: 'China', flag: '🇨🇳', description: 'Traditional Chinese New Year celebration marking the beginning of the lunar calendar.', traditions: ['Red envelopes', 'Dragon dances', 'Reunion dinner', 'Fireworks'], image: 'https://images.unsplash.com/photo-1548181457-6f618afe39f2?w=400', color: '#E53935', isPublicHoliday: true },
  { id: '6', name: 'Black History Month', date: 'February 1-28', month: 2, day: 1, culture: 'African American', country: 'USA', flag: '🇺🇸', description: 'Annual celebration of African American history and achievements.', traditions: ['Cultural events', 'Educational programs', 'Community gatherings'], image: 'https://images.unsplash.com/photo-1590845947698-8924d7409b56?w=400', color: '#000000', isPublicHoliday: false },
  { id: '7', name: 'Carnival', date: 'February 13', month: 2, day: 13, culture: 'Brazilian', country: 'Brazil', flag: '🇧🇷', description: 'World-famous festival featuring samba, parades, and elaborate costumes.', traditions: ['Samba parades', 'Costumes', 'Street parties', 'Music'], image: 'https://images.unsplash.com/photo-1518310383802-640c2de311b2?w=400', color: '#FFEB3B', isPublicHoliday: true },

  // March
  { id: '8', name: 'Holi', date: 'March 25', month: 3, day: 25, culture: 'Indian', country: 'India', flag: '🇮🇳', description: 'Hindu festival of colors celebrating the victory of good over evil.', traditions: ['Color throwing', 'Bonfires', 'Sweets', 'Music and dance'], image: 'https://images.unsplash.com/photo-1520124442528-d37df8e94c1d?w=400', color: '#E91E63', isPublicHoliday: true },
  { id: '9', name: 'Nowruz', date: 'March 21', month: 3, day: 21, culture: 'Persian', country: 'Iran', flag: '🇮🇷', description: 'Persian New Year marking the first day of spring and renewal.', traditions: ['Haft-sin table', 'Spring cleaning', 'Fire jumping', 'Family visits'], image: 'https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?w=400', color: '#4CAF50', isPublicHoliday: true },
  { id: '10', name: 'St. Patrick\'s Day', date: 'March 17', month: 3, day: 17, culture: 'Irish', country: 'Ireland', flag: '🇮🇪', description: 'Cultural and religious celebration honoring St. Patrick, patron saint of Ireland.', traditions: ['Wearing green', 'Parades', 'Irish music', 'Shamrocks'], image: 'https://images.unsplash.com/photo-1521124277351-1c85fa5ba06a?w=400', color: '#2E7D32', isPublicHoliday: true },

  // April
  { id: '11', name: 'Easter', date: 'April 20', month: 4, day: 20, culture: 'Christian', country: 'Worldwide', flag: '✝️', description: 'Christian holiday celebrating the resurrection of Jesus Christ.', traditions: ['Church services', 'Easter eggs', 'Family meals', 'Spring celebrations'], image: 'https://images.unsplash.com/photo-1521967906867-14ec9d64bee8?w=400', color: '#9C27B0', isPublicHoliday: true },
  { id: '12', name: 'Songkran', date: 'April 13', month: 4, day: 13, culture: 'Thai', country: 'Thailand', flag: '🇹🇭', description: 'Thai New Year water festival symbolizing purification and washing away bad luck.', traditions: ['Water fights', 'Temple visits', 'Building sand stupas', 'Family gatherings'], image: 'https://images.unsplash.com/photo-1504214208698-ea1916a2195a?w=400', color: '#03A9F4', isPublicHoliday: true },

  // May
  { id: '13', name: 'Cinco de Mayo', date: 'May 5', month: 5, day: 5, culture: 'Mexican', country: 'Mexico', flag: '🇲🇽', description: 'Celebration of Mexican heritage and pride, commemorating the Battle of Puebla.', traditions: ['Parades', 'Mariachi music', 'Traditional food', 'Folkloric dancing'], image: 'https://images.unsplash.com/photo-1534531173927-aeb928d54385?w=400', color: '#FF5722', isPublicHoliday: false },
  { id: '14', name: 'Vesak', date: 'May 23', month: 5, day: 23, culture: 'Buddhist', country: 'Sri Lanka', flag: '🇱🇰', description: 'Buddha Day celebrating the birth, enlightenment, and death of Buddha.', traditions: ['Temple visits', 'Meditation', 'Lanterns', 'Acts of kindness'], image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400', color: '#FFD54F', isPublicHoliday: true },
  { id: '15', name: 'Africa Day', date: 'May 25', month: 5, day: 25, culture: 'Pan-African', country: 'Africa', flag: '🌍', description: 'Annual commemoration of the founding of the Organization of African Unity.', traditions: ['Cultural events', 'Music festivals', 'African cuisine', 'Unity celebrations'], image: 'https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?w=400', color: '#4CAF50', isPublicHoliday: true },

  // June
  { id: '16', name: 'Juneteenth', date: 'June 19', month: 6, day: 19, culture: 'African American', country: 'USA', flag: '🇺🇸', description: 'Federal holiday commemorating the emancipation of enslaved African Americans.', traditions: ['Community gatherings', 'Cookouts', 'Educational events', 'Music'], image: 'https://images.unsplash.com/photo-1591197172062-c718f82aba20?w=400', color: '#D32F2F', isPublicHoliday: true },
  { id: '17', name: 'Dragon Boat Festival', date: 'June 10', month: 6, day: 10, culture: 'Chinese', country: 'China', flag: '🇨🇳', description: 'Traditional festival honoring the poet Qu Yuan with dragon boat races.', traditions: ['Dragon boat races', 'Zongzi dumplings', 'Hanging mugwort', 'Drinking realgar wine'], image: 'https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?w=400', color: '#1976D2', isPublicHoliday: true },

  // July
  { id: '18', name: 'Independence Day', date: 'July 4', month: 7, day: 4, culture: 'American', country: 'USA', flag: '🇺🇸', description: 'Federal holiday celebrating the Declaration of Independence.', traditions: ['Fireworks', 'BBQs', 'Parades', 'Patriotic displays'], image: 'https://images.unsplash.com/photo-1498931299839-881f85573106?w=400', color: '#1565C0', isPublicHoliday: true },
  { id: '19', name: 'Eid al-Adha', date: 'July 7', month: 7, day: 7, culture: 'Islamic', country: 'Worldwide', flag: '☪️', description: 'Islamic festival of sacrifice honoring Ibrahim\'s willingness to sacrifice his son.', traditions: ['Animal sacrifice', 'Prayers', 'Charity', 'Family feasts'], image: 'https://images.unsplash.com/photo-1564769625905-50e93615e769?w=400', color: '#2E7D32', isPublicHoliday: true },

  // August
  { id: '20', name: 'Raksha Bandhan', date: 'August 19', month: 8, day: 19, culture: 'Indian', country: 'India', flag: '🇮🇳', description: 'Hindu festival celebrating the bond between brothers and sisters.', traditions: ['Tying rakhi', 'Gift giving', 'Sweets', 'Family gatherings'], image: 'https://images.unsplash.com/photo-1566753323558-f4e0952af115?w=400', color: '#E91E63', isPublicHoliday: false },
  { id: '21', name: 'Emancipation Day', date: 'August 1', month: 8, day: 1, culture: 'Caribbean', country: 'Jamaica', flag: '🇯🇲', description: 'Celebration of the abolition of slavery in the British Empire.', traditions: ['Cultural events', 'Parades', 'Historical reflections', 'Community gatherings'], image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400', color: '#FFC107', isPublicHoliday: true },

  // September
  { id: '22', name: 'Rosh Hashanah', date: 'September 23', month: 9, day: 23, culture: 'Jewish', country: 'Israel', flag: '🇮🇱', description: 'Jewish New Year marking the beginning of the High Holy Days.', traditions: ['Shofar blowing', 'Apples and honey', 'Synagogue services', 'Tashlich'], image: 'https://images.unsplash.com/photo-1567016507665-e96b0d2e4b5d?w=400', color: '#3F51B5', isPublicHoliday: true },
  { id: '23', name: 'Ethiopian New Year', date: 'September 11', month: 9, day: 11, culture: 'Ethiopian', country: 'Ethiopia', flag: '🇪🇹', description: 'Enkutatash marks the end of the rainy season and the Ethiopian New Year.', traditions: ['Flower gathering', 'Bonfire', 'New clothes', 'Family visits'], image: 'https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=400', color: '#4CAF50', isPublicHoliday: true },
  { id: '24', name: 'Mid-Autumn Festival', date: 'September 17', month: 9, day: 17, culture: 'Chinese', country: 'China', flag: '🇨🇳', description: 'Harvest festival celebrating the full moon with family reunions.', traditions: ['Mooncakes', 'Lanterns', 'Moon gazing', 'Family gatherings'], image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400', color: '#FF9800', isPublicHoliday: true },

  // October
  { id: '25', name: 'Diwali', date: 'October 31', month: 10, day: 31, culture: 'Indian', country: 'India', flag: '🇮🇳', description: 'Hindu festival of lights symbolizing the victory of light over darkness.', traditions: ['Diyas and candles', 'Fireworks', 'Rangoli', 'Sweets exchange'], image: 'https://images.unsplash.com/photo-1574265935526-08b093dc5f09?w=400', color: '#FF9800', isPublicHoliday: true },
  { id: '26', name: 'Day of the Dead', date: 'October 31', month: 10, day: 31, culture: 'Mexican', country: 'Mexico', flag: '🇲🇽', description: 'Traditional celebration honoring deceased loved ones.', traditions: ['Altars', 'Marigolds', 'Sugar skulls', 'Cemetery visits'], image: 'https://images.unsplash.com/photo-1572647117782-5df5f6b8d0b3?w=400', color: '#9C27B0', isPublicHoliday: true },

  // November
  { id: '27', name: 'Thanksgiving', date: 'November 27', month: 11, day: 27, culture: 'American', country: 'USA', flag: '🇺🇸', description: 'National holiday of giving thanks for the blessing of harvest and the year.', traditions: ['Turkey dinner', 'Family gatherings', 'Gratitude', 'Football'], image: 'https://images.unsplash.com/photo-1574672280600-4accfa5b6f98?w=400', color: '#8D6E63', isPublicHoliday: true },
  { id: '28', name: 'Gurpurab', date: 'November 15', month: 11, day: 15, culture: 'Sikh', country: 'India', flag: '🇮🇳', description: 'Birth anniversary of Guru Nanak, founder of Sikhism.', traditions: ['Processions', 'Langar', 'Kirtan', 'Gurdwara visits'], image: 'https://images.unsplash.com/photo-1590845947698-8924d7409b56?w=400', color: '#FF9800', isPublicHoliday: true },

  // December
  { id: '29', name: 'Hanukkah', date: 'December 14', month: 12, day: 14, culture: 'Jewish', country: 'Israel', flag: '🇮🇱', description: 'Jewish Festival of Lights commemorating the rededication of the Temple.', traditions: ['Menorah lighting', 'Dreidel', 'Latkes', 'Gift giving'], image: 'https://images.unsplash.com/photo-1576618148400-f54bed99fcfd?w=400', color: '#2196F3', isPublicHoliday: false },
  { id: '30', name: 'Christmas', date: 'December 25', month: 12, day: 25, culture: 'Christian', country: 'Worldwide', flag: '🎄', description: 'Christian holiday celebrating the birth of Jesus Christ.', traditions: ['Gift giving', 'Christmas tree', 'Carols', 'Family feasts'], image: 'https://images.unsplash.com/photo-1543589077-47d81606c1bf?w=400', color: '#D32F2F', isPublicHoliday: true },
  { id: '31', name: 'Kwanzaa', date: 'December 26', month: 12, day: 26, culture: 'African American', country: 'USA', flag: '🇺🇸', description: 'Week-long celebration honoring African heritage and culture.', traditions: ['Candle lighting', 'Principles', 'Gift giving', 'Community feasts'], image: 'https://images.unsplash.com/photo-1590845947698-8924d7409b56?w=400', color: '#4CAF50', isPublicHoliday: false },
  { id: '32', name: 'Boxing Day', date: 'December 26', month: 12, day: 26, culture: 'British', country: 'UK', flag: '🇬🇧', description: 'Public holiday following Christmas Day, traditionally for giving to the poor.', traditions: ['Shopping', 'Sports', 'Charity', 'Relaxation'], image: 'https://images.unsplash.com/photo-1512389142860-9c449e58a543?w=400', color: '#673AB7', isPublicHoliday: true },
];

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const CULTURES = ['All', 'African', 'Asian', 'Caribbean', 'European', 'American', 'Middle Eastern', 'South American'];

export default function CulturalCalendarScreen() {
  const router = useRouter();
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [searchQuery, setSearchQuery] = useState('');
  const [reminders, setReminders] = useState<Set<string>>(new Set());
  const [selectedCulture, setSelectedCulture] = useState('All');

  const filteredHolidays = useMemo(() => {
    return CULTURAL_HOLIDAYS.filter(holiday => {
      const matchesMonth = holiday.month === selectedMonth;
      const matchesSearch = searchQuery === '' ||
        holiday.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        holiday.culture.toLowerCase().includes(searchQuery.toLowerCase()) ||
        holiday.country.toLowerCase().includes(searchQuery.toLowerCase());

      let matchesCulture = selectedCulture === 'All';
      if (selectedCulture === 'African') {
        matchesCulture = ['Ethiopian', 'Pan-African', 'African American', 'Nigerian', 'Ghanaian', 'Kenyan'].some(c => holiday.culture.includes(c));
      } else if (selectedCulture === 'Asian') {
        matchesCulture = ['Chinese', 'Indian', 'Thai', 'Buddhist', 'Sikh', 'Japanese', 'Korean', 'Vietnamese'].some(c => holiday.culture.includes(c));
      } else if (selectedCulture === 'Caribbean') {
        matchesCulture = ['Caribbean', 'Jamaican', 'Trinidadian', 'Haitian'].some(c => holiday.culture.includes(c));
      } else if (selectedCulture === 'European') {
        matchesCulture = ['Irish', 'British', 'French', 'German', 'Italian', 'Spanish'].some(c => holiday.culture.includes(c));
      } else if (selectedCulture === 'American') {
        matchesCulture = ['American', 'African American', 'Mexican'].some(c => holiday.culture.includes(c));
      } else if (selectedCulture === 'Middle Eastern') {
        matchesCulture = ['Islamic', 'Jewish', 'Persian'].some(c => holiday.culture.includes(c));
      } else if (selectedCulture === 'South American') {
        matchesCulture = ['Brazilian', 'Colombian', 'Peruvian', 'Argentine'].some(c => holiday.culture.includes(c));
      }

      return matchesMonth && matchesSearch && matchesCulture;
    });
  }, [selectedMonth, searchQuery, selectedCulture]);

  const toggleReminder = (holidayId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setReminders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(holidayId)) {
        newSet.delete(holidayId);
      } else {
        newSet.add(holidayId);
      }
      return newSet;
    });
  };

  const goToPreviousMonth = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedMonth(prev => prev === 1 ? 12 : prev - 1);
  };

  const goToNextMonth = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedMonth(prev => prev === 12 ? 1 : prev + 1);
  };

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
              <Globe2 size={20} color="#FFD700" />
              <Text className="text-white text-lg font-bold ml-2">Cultural Calendar</Text>
            </View>
            <View className="w-10" />
          </View>

          {/* Search */}
          <View className="flex-row items-center bg-white/10 rounded-2xl px-4 py-3 mb-4">
            <Search size={18} color="#9CA3AF" />
            <TextInput
              placeholder="Search holidays, cultures..."
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
              className="flex-1 ml-3 text-white text-base"
            />
          </View>

          {/* Month Selector */}
          <View className="flex-row items-center justify-between bg-gradient-to-r from-amber-500/20 to-orange-500/20 rounded-2xl px-4 py-3 mb-4" style={{ backgroundColor: 'rgba(255, 215, 0, 0.15)' }}>
            <Pressable onPress={goToPreviousMonth} className="w-10 h-10 rounded-full bg-white/10 items-center justify-center">
              <ChevronLeft size={20} color="#FFD700" />
            </Pressable>
            <View className="flex-row items-center">
              <Calendar size={20} color="#FFD700" />
              <Text className="text-white text-xl font-bold ml-2">{MONTHS[selectedMonth - 1]}</Text>
            </View>
            <Pressable onPress={goToNextMonth} className="w-10 h-10 rounded-full bg-white/10 items-center justify-center">
              <ChevronRight size={20} color="#FFD700" />
            </Pressable>
          </View>

          {/* Culture Filter */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }}>
            <View className="flex-row gap-2">
              {CULTURES.map((culture) => (
                <Pressable
                  key={culture}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSelectedCulture(culture);
                  }}
                  className={`px-4 py-2 rounded-full ${
                    selectedCulture === culture
                      ? 'bg-amber-500'
                      : 'bg-white/10'
                  }`}
                >
                  <Text className={`font-medium ${
                    selectedCulture === culture ? 'text-black' : 'text-white'
                  }`}>
                    {culture}
                  </Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Holidays List */}
        <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
          {filteredHolidays.length === 0 ? (
            <View className="items-center justify-center py-20">
              <Calendar size={48} color="#6B7280" />
              <Text className="text-gray-400 text-lg mt-4">No holidays found</Text>
              <Text className="text-gray-500 text-sm mt-1">Try a different month or filter</Text>
            </View>
          ) : (
            filteredHolidays.map((holiday, index) => (
              <Animated.View
                key={holiday.id}
                entering={FadeInDown.delay(index * 100).springify()}
              >
                <Pressable
                  onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
                  className="mb-4 rounded-3xl overflow-hidden"
                  style={{ backgroundColor: holiday.color + '20' }}
                >
                  <Image
                    source={{ uri: holiday.image }}
                    style={{ width: '100%', height: 140 }}
                    contentFit="cover"
                  />
                  <View
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: 140,
                      backgroundColor: 'rgba(0,0,0,0.4)'
                    }}
                  />

                  {/* Date Badge */}
                  <View
                    className="absolute top-3 left-3 px-3 py-1.5 rounded-full"
                    style={{ backgroundColor: holiday.color }}
                  >
                    <Text className="text-black font-bold text-sm">{holiday.date}</Text>
                  </View>

                  {/* Reminder Button */}
                  <Pressable
                    onPress={() => toggleReminder(holiday.id)}
                    className="absolute top-3 right-3 w-10 h-10 rounded-full items-center justify-center"
                    style={{ backgroundColor: reminders.has(holiday.id) ? holiday.color : 'rgba(255,255,255,0.2)' }}
                  >
                    {reminders.has(holiday.id) ? (
                      <Bell size={18} color="#000" fill="#000" />
                    ) : (
                      <BellOff size={18} color="#fff" />
                    )}
                  </Pressable>

                  {/* Country Flag */}
                  <View className="absolute top-3 right-16 bg-black/40 px-2 py-1 rounded-full">
                    <Text className="text-lg">{holiday.flag}</Text>
                  </View>

                  {/* Content */}
                  <View className="p-4">
                    <View className="flex-row items-center mb-2">
                      <Text className="text-2xl mr-2">{holiday.flag}</Text>
                      <View className="flex-1">
                        <Text className="text-white text-xl font-bold">{holiday.name}</Text>
                        <Text className="text-gray-400 text-sm">{holiday.culture} • {holiday.country}</Text>
                      </View>
                    </View>

                    <Text className="text-gray-300 text-sm mb-3 leading-5">{holiday.description}</Text>

                    {/* Traditions */}
                    <View className="flex-row flex-wrap gap-2">
                      {holiday.traditions.slice(0, 3).map((tradition, idx) => (
                        <View
                          key={idx}
                          className="px-3 py-1.5 rounded-full"
                          style={{ backgroundColor: holiday.color + '30' }}
                        >
                          <Text style={{ color: holiday.color }} className="text-xs font-medium">{tradition}</Text>
                        </View>
                      ))}
                      {holiday.traditions.length > 3 && (
                        <View className="px-3 py-1.5 rounded-full bg-white/10">
                          <Text className="text-gray-400 text-xs">+{holiday.traditions.length - 3} more</Text>
                        </View>
                      )}
                    </View>

                    {/* Public Holiday Badge */}
                    {holiday.isPublicHoliday && (
                      <View className="mt-3 flex-row items-center">
                        <Sparkles size={14} color="#FFD700" />
                        <Text className="text-amber-400 text-xs ml-1 font-medium">Public Holiday</Text>
                      </View>
                    )}
                  </View>
                </Pressable>
              </Animated.View>
            ))
          )}

          <View className="h-32" />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
