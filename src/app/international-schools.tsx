import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Modal,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ChevronLeft,
  Search,
  MapPin,
  DollarSign,
  GraduationCap,
  Globe,
  ChevronRight,
  ExternalLink,
  X,
  Star,
  CheckCircle,
  Award,
  BookOpen,
  Users,
  Clock,
  Calendar,
  Building,
  Plane,
  Briefcase,
  MessageCircle,
} from 'lucide-react-native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';

interface School {
  id: string;
  name: string;
  logo: string;
  location: string;
  country: string;
  countryFlag: string;
  type: 'University' | 'College' | 'Community College' | 'Graduate School';
  ranking?: number;
  acceptanceRate: string;
  tuition: {
    international: string;
    perYear: boolean;
  };
  programs: string[];
  description: string;
  internationalStudents: string;
  scholarshipsAvailable: boolean;
  scholarshipInfo?: string;
  applicationDeadline: string;
  languageRequirements: string[];
  applicationUrl: string;
  highlights: string[];
  workOpportunity: boolean;
  housingAvailable: boolean;
}

const SCHOOLS: School[] = [
  {
    id: '1',
    name: 'University of Toronto',
    logo: 'https://images.unsplash.com/photo-1562774053-701939374585?w=200',
    location: 'Toronto, ON',
    country: 'Canada',
    countryFlag: '🇨🇦',
    type: 'University',
    ranking: 21,
    acceptanceRate: '43%',
    tuition: {
      international: 'CAD $58,000 - $65,000',
      perYear: true,
    },
    programs: ['Computer Science', 'Engineering', 'Business', 'Medicine', 'Arts'],
    description: 'Canada\'s top university with excellent support for international students. Strong pathways to permanent residency after graduation.',
    internationalStudents: '24%',
    scholarshipsAvailable: true,
    scholarshipInfo: 'Lester B. Pearson Scholarship covers full tuition + living expenses',
    applicationDeadline: 'January 15, 2025',
    languageRequirements: ['IELTS 6.5+', 'TOEFL 100+'],
    applicationUrl: 'https://www.utoronto.ca/admissions',
    highlights: [
      'Post-graduation work permit (3 years)',
      'Strong co-op programs',
      'Path to Canadian PR',
      'Diverse student community'
    ],
    workOpportunity: true,
    housingAvailable: true,
  },
  {
    id: '2',
    name: 'MIT',
    logo: 'https://images.unsplash.com/photo-1564981797816-1043664bf78d?w=200',
    location: 'Cambridge, MA',
    country: 'United States',
    countryFlag: '🇺🇸',
    type: 'University',
    ranking: 1,
    acceptanceRate: '4%',
    tuition: {
      international: '$57,986',
      perYear: true,
    },
    programs: ['Engineering', 'Computer Science', 'Physics', 'Mathematics', 'Economics'],
    description: 'World\'s leading technical university. Need-blind admissions for international students with full financial aid.',
    internationalStudents: '29%',
    scholarshipsAvailable: true,
    scholarshipInfo: 'Need-blind admission - 100% demonstrated need met',
    applicationDeadline: 'January 1, 2025',
    languageRequirements: ['TOEFL 100+', 'IELTS 7.0+', 'Duolingo 125+'],
    applicationUrl: 'https://admissions.mit.edu',
    highlights: [
      'Full financial aid for admitted students',
      'OPT and STEM OPT (3 years work)',
      'Strong industry connections',
      'Research opportunities'
    ],
    workOpportunity: true,
    housingAvailable: true,
  },
  {
    id: '3',
    name: 'University of Melbourne',
    logo: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=200',
    location: 'Melbourne, VIC',
    country: 'Australia',
    countryFlag: '🇦🇺',
    type: 'University',
    ranking: 33,
    acceptanceRate: '70%',
    tuition: {
      international: 'AUD $45,000 - $55,000',
      perYear: true,
    },
    programs: ['Business', 'Engineering', 'Medicine', 'Law', 'Arts'],
    description: 'Australia\'s top-ranked university with excellent post-study work rights and pathway to permanent residency.',
    internationalStudents: '42%',
    scholarshipsAvailable: true,
    scholarshipInfo: 'Melbourne International Undergraduate Scholarship - up to $28,000',
    applicationDeadline: 'October 31, 2024 (Feb intake), April 30, 2025 (Jul intake)',
    languageRequirements: ['IELTS 6.5+', 'TOEFL 79+', 'PTE 58+'],
    applicationUrl: 'https://study.unimelb.edu.au',
    highlights: [
      'Post-study work visa (2-4 years)',
      'Regional study benefits',
      'Path to Australian PR',
      'Work 48 hours/fortnight while studying'
    ],
    workOpportunity: true,
    housingAvailable: true,
  },
  {
    id: '4',
    name: 'Technical University of Munich',
    logo: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=200',
    location: 'Munich',
    country: 'Germany',
    countryFlag: '🇩🇪',
    type: 'University',
    ranking: 49,
    acceptanceRate: '8%',
    tuition: {
      international: '€150/semester (almost free!)',
      perYear: false,
    },
    programs: ['Engineering', 'Computer Science', 'Natural Sciences', 'Medicine', 'Management'],
    description: 'Top German technical university with virtually free education. Many English-taught programs available.',
    internationalStudents: '37%',
    scholarshipsAvailable: true,
    scholarshipInfo: 'DAAD scholarships available + Deutschlandstipendium',
    applicationDeadline: 'May 31, 2025 (Winter semester)',
    languageRequirements: ['IELTS 6.5+', 'TOEFL 88+', 'German B2 for German programs'],
    applicationUrl: 'https://www.tum.de/en/studies/application',
    highlights: [
      'Almost free tuition',
      '18-month job seeker visa after graduation',
      'Strong industry connections',
      'English-taught Masters programs'
    ],
    workOpportunity: true,
    housingAvailable: true,
  },
  {
    id: '5',
    name: 'University College London (UCL)',
    logo: 'https://images.unsplash.com/photo-1607237138185-eedd9c632b0b?w=200',
    location: 'London',
    country: 'United Kingdom',
    countryFlag: '🇬🇧',
    type: 'University',
    ranking: 9,
    acceptanceRate: '63%',
    tuition: {
      international: '£26,000 - £40,000',
      perYear: true,
    },
    programs: ['Engineering', 'Medicine', 'Law', 'Arts', 'Social Sciences'],
    description: 'Top UK university in the heart of London. Excellent research opportunities and global recognition.',
    internationalStudents: '52%',
    scholarshipsAvailable: true,
    scholarshipInfo: 'UCL Global Masters Scholarship - up to £15,000',
    applicationDeadline: 'January 26, 2025 (most programs)',
    languageRequirements: ['IELTS 6.5-7.5', 'TOEFL 92-109'],
    applicationUrl: 'https://www.ucl.ac.uk/prospective-students',
    highlights: [
      'Graduate Route visa (2 years work)',
      'Central London location',
      'World-class research',
      'Strong alumni network'
    ],
    workOpportunity: true,
    housingAvailable: true,
  },
  {
    id: '6',
    name: 'Community College of Denver',
    logo: 'https://images.unsplash.com/photo-1498243691581-b145c3f54a5a?w=200',
    location: 'Denver, CO',
    country: 'United States',
    countryFlag: '🇺🇸',
    type: 'Community College',
    acceptanceRate: '100%',
    tuition: {
      international: '$10,500',
      perYear: true,
    },
    programs: ['Business', 'Computer Science', 'Healthcare', 'Arts', 'Trades'],
    description: 'Affordable pathway to 4-year universities. F-1 visa eligible with transfer agreements to top Colorado universities.',
    internationalStudents: '5%',
    scholarshipsAvailable: true,
    scholarshipInfo: 'International student scholarships up to $2,500/year',
    applicationDeadline: 'Rolling admissions',
    languageRequirements: ['TOEFL 61+', 'IELTS 5.5+', 'Duolingo 90+'],
    applicationUrl: 'https://www.ccd.edu/admissions',
    highlights: [
      'Affordable tuition',
      '2+2 transfer pathway',
      'CPT/OPT eligible',
      'Smaller class sizes'
    ],
    workOpportunity: true,
    housingAvailable: false,
  },
  {
    id: '7',
    name: 'University of Auckland',
    logo: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=200',
    location: 'Auckland',
    country: 'New Zealand',
    countryFlag: '🇳🇿',
    type: 'University',
    ranking: 68,
    acceptanceRate: '75%',
    tuition: {
      international: 'NZD $35,000 - $50,000',
      perYear: true,
    },
    programs: ['Engineering', 'Business', 'Medicine', 'Arts', 'Science'],
    description: 'New Zealand\'s top university with excellent quality of life and post-study work opportunities.',
    internationalStudents: '28%',
    scholarshipsAvailable: true,
    scholarshipInfo: 'International Student Excellence Scholarship - $10,000',
    applicationDeadline: 'December 1, 2024',
    languageRequirements: ['IELTS 6.0+', 'TOEFL 80+', 'PTE 50+'],
    applicationUrl: 'https://www.auckland.ac.nz/en/study.html',
    highlights: [
      '3-year post-study work visa',
      'Path to NZ residence',
      'High quality of life',
      'Safe country'
    ],
    workOpportunity: true,
    housingAvailable: true,
  },
  {
    id: '8',
    name: 'ESADE Business School',
    logo: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=200',
    location: 'Barcelona',
    country: 'Spain',
    countryFlag: '🇪🇸',
    type: 'Graduate School',
    ranking: 7,
    acceptanceRate: '25%',
    tuition: {
      international: '€72,000 (full MBA)',
      perYear: false,
    },
    programs: ['MBA', 'Executive Education', 'Masters in Management'],
    description: 'Top European business school with strong international focus. Beautiful Barcelona location.',
    internationalStudents: '95%',
    scholarshipsAvailable: true,
    scholarshipInfo: 'Merit and need-based scholarships up to 40% of tuition',
    applicationDeadline: 'Multiple rounds - final June 2025',
    languageRequirements: ['GMAT 650+', 'IELTS 7.0+', 'TOEFL 100+'],
    applicationUrl: 'https://www.esade.edu/mba',
    highlights: [
      'Global network',
      'Barcelona lifestyle',
      'EU work opportunities',
      'Top MBA rankings'
    ],
    workOpportunity: true,
    housingAvailable: false,
  },
];

const COUNTRIES = [
  { id: 'all', name: 'All Countries', flag: '🌍' },
  { id: 'United States', name: 'USA', flag: '🇺🇸' },
  { id: 'Canada', name: 'Canada', flag: '🇨🇦' },
  { id: 'United Kingdom', name: 'UK', flag: '🇬🇧' },
  { id: 'Australia', name: 'Australia', flag: '🇦🇺' },
  { id: 'Germany', name: 'Germany', flag: '🇩🇪' },
  { id: 'New Zealand', name: 'New Zealand', flag: '🇳🇿' },
  { id: 'Spain', name: 'Spain', flag: '🇪🇸' },
];

const SCHOOL_TYPES = [
  { id: 'all', label: 'All Types' },
  { id: 'University', label: 'Universities' },
  { id: 'College', label: 'Colleges' },
  { id: 'Community College', label: 'Community Colleges' },
  { id: 'Graduate School', label: 'Graduate Schools' },
];

export default function InternationalSchoolsScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
  const [scholarshipFilter, setScholarshipFilter] = useState(false);

  const filteredSchools = SCHOOLS.filter((school) => {
    const matchesSearch =
      school.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      school.programs.some((p) => p.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCountry = selectedCountry === 'all' || school.country === selectedCountry;
    const matchesType = selectedType === 'all' || school.type === selectedType;
    const matchesScholarship = !scholarshipFilter || school.scholarshipsAvailable;
    return matchesSearch && matchesCountry && matchesType && matchesScholarship;
  });

  const handleSchoolSelect = (school: School) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedSchool(school);
  };

  const openApplicationUrl = (url: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Linking.openURL(url);
  };

  return (
    <View className="flex-1 bg-cream">
      <SafeAreaView edges={['top']} className="flex-1">
        {/* Header */}
        <Animated.View entering={FadeIn.duration(300)} className="px-5 pt-4 pb-2">
          <View className="flex-row items-center mb-4">
            <Pressable
              onPress={() => router.back()}
              className="bg-white rounded-full p-2 mr-3 shadow-sm"
            >
              <ChevronLeft size={24} color="#2D1F1A" />
            </Pressable>
            <View className="flex-1">
              <Text className="text-2xl font-bold text-warmBrown">Study Abroad</Text>
              <Text className="text-sm text-gray-500">Schools Accepting International Students</Text>
            </View>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push('/immigration-assistant');
              }}
              className="bg-emerald-500 rounded-full p-2.5 shadow-sm"
            >
              <MessageCircle size={22} color="#fff" />
            </Pressable>
          </View>

          {/* Search */}
          <View className="flex-row items-center bg-white rounded-2xl px-4 py-3 shadow-sm mb-4">
            <Search size={20} color="#8B7355" />
            <TextInput
              placeholder="Search schools, programs..."
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
              className="flex-1 ml-3 text-warmBrown text-base"
            />
          </View>

          {/* Country Filter */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mb-3"
            style={{ flexGrow: 0 }}
          >
            {COUNTRIES.map((country) => (
              <Pressable
                key={country.id}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setSelectedCountry(country.id);
                }}
                className={`flex-row items-center px-4 py-2 rounded-full mr-2 ${
                  selectedCountry === country.id ? 'bg-forest-600' : 'bg-white'
                }`}
              >
                <Text className="text-lg mr-1">{country.flag}</Text>
                <Text
                  className={`font-medium ${
                    selectedCountry === country.id ? 'text-white' : 'text-gray-600'
                  }`}
                >
                  {country.name}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          {/* Type & Scholarship Filter */}
          <View className="flex-row items-center">
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="flex-1"
              style={{ flexGrow: 0 }}
            >
              {SCHOOL_TYPES.map((type) => (
                <Pressable
                  key={type.id}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSelectedType(type.id);
                  }}
                  className={`px-4 py-2 rounded-full mr-2 ${
                    selectedType === type.id ? 'bg-terracotta' : 'bg-white'
                  }`}
                >
                  <Text
                    className={`font-medium ${
                      selectedType === type.id ? 'text-white' : 'text-gray-600'
                    }`}
                  >
                    {type.label}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setScholarshipFilter(!scholarshipFilter);
              }}
              className={`ml-2 px-3 py-2 rounded-full flex-row items-center ${
                scholarshipFilter ? 'bg-yellow-500' : 'bg-white'
              }`}
            >
              <Award size={16} color={scholarshipFilter ? '#fff' : '#F59E0B'} />
              <Text
                className={`ml-1 font-medium text-sm ${
                  scholarshipFilter ? 'text-white' : 'text-yellow-600'
                }`}
              >
                Scholarships
              </Text>
            </Pressable>
          </View>
        </Animated.View>

        {/* Schools List */}
        <ScrollView className="flex-1 px-5 pt-4" showsVerticalScrollIndicator={false}>
          {/* Stats Banner */}
          <Animated.View entering={FadeInUp.duration(400).delay(100)} className="mb-4">
            <LinearGradient
              colors={['#7C3AED', '#6D28D9']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ borderRadius: 16, padding: 16 }}
            >
              <View className="flex-row items-center mb-2">
                <GraduationCap size={24} color="#fff" />
                <Text className="text-white font-bold text-lg ml-2">Your Study Abroad Journey</Text>
              </View>
              <Text className="text-white/80 text-sm">
                Find schools with scholarships, work permits, and pathways to stay after graduation.
              </Text>
              <View className="flex-row mt-3">
                <View className="bg-white/20 rounded-lg px-3 py-1.5 mr-2">
                  <Text className="text-white text-sm">{filteredSchools.length} Schools</Text>
                </View>
                <View className="bg-white/20 rounded-lg px-3 py-1.5">
                  <Text className="text-white text-sm">
                    {filteredSchools.filter((s) => s.scholarshipsAvailable).length} with Scholarships
                  </Text>
                </View>
              </View>
            </LinearGradient>
          </Animated.View>

          {/* Schools */}
          {filteredSchools.map((school, index) => (
            <Animated.View
              key={school.id}
              entering={FadeInUp.duration(400).delay(150 + index * 50)}
            >
              <Pressable
                onPress={() => handleSchoolSelect(school)}
                className="bg-white rounded-2xl p-4 mb-3 shadow-sm"
              >
                <View className="flex-row items-start">
                  <Image
                    source={{ uri: school.logo }}
                    style={{ width: 60, height: 60, borderRadius: 12 }}
                    contentFit="cover"
                  />
                  <View className="flex-1 ml-3">
                    <View className="flex-row items-start justify-between">
                      <View className="flex-1">
                        <Text className="text-warmBrown font-bold text-base" numberOfLines={1}>
                          {school.name}
                        </Text>
                        <View className="flex-row items-center mt-1">
                          <Text className="text-lg mr-1">{school.countryFlag}</Text>
                          <Text className="text-gray-600 text-sm">{school.location}</Text>
                        </View>
                      </View>
                      {school.ranking && (
                        <View className="bg-amber-100 rounded-lg px-2 py-1">
                          <Text className="text-amber-700 text-xs font-bold">#{school.ranking}</Text>
                        </View>
                      )}
                    </View>

                    <View className="flex-row items-center flex-wrap mt-2">
                      <View className="bg-blue-100 rounded-full px-2 py-0.5 mr-2 mb-1">
                        <Text className="text-blue-700 text-xs font-medium">{school.type}</Text>
                      </View>
                      <View className="bg-green-100 rounded-full px-2 py-0.5 mr-2 mb-1">
                        <Text className="text-green-700 text-xs font-medium">
                          {school.tuition.international}/yr
                        </Text>
                      </View>
                      {school.scholarshipsAvailable && (
                        <View className="bg-yellow-100 rounded-full px-2 py-0.5 mb-1">
                          <Text className="text-yellow-700 text-xs font-medium">💰 Scholarships</Text>
                        </View>
                      )}
                    </View>

                    <View className="flex-row flex-wrap mt-2">
                      {school.programs.slice(0, 3).map((program, idx) => (
                        <Text key={idx} className="text-gray-500 text-xs mr-2">
                          • {program}
                        </Text>
                      ))}
                    </View>
                  </View>
                  <ChevronRight size={20} color="#9CA3AF" />
                </View>
              </Pressable>
            </Animated.View>
          ))}

          <View className="h-24" />
        </ScrollView>

        {/* School Detail Modal */}
        <Modal
          visible={!!selectedSchool}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setSelectedSchool(null)}
        >
          {selectedSchool && (
            <View className="flex-1 bg-cream">
              <SafeAreaView edges={['top']} className="flex-1">
                <View className="flex-row items-center justify-between px-5 py-4 border-b border-gray-100 bg-white">
                  <Pressable
                    onPress={() => setSelectedSchool(null)}
                    className="bg-gray-100 rounded-full p-2"
                  >
                    <X size={24} color="#2D1F1A" />
                  </Pressable>
                  <Text className="text-lg font-bold text-warmBrown flex-1 text-center mr-10">
                    School Details
                  </Text>
                </View>

                <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                  <View className="p-5">
                    {/* School Header */}
                    <View className="flex-row items-start mb-4">
                      <Image
                        source={{ uri: selectedSchool.logo }}
                        style={{ width: 70, height: 70, borderRadius: 14 }}
                        contentFit="cover"
                      />
                      <View className="flex-1 ml-4">
                        <Text className="text-warmBrown font-bold text-xl">{selectedSchool.name}</Text>
                        <View className="flex-row items-center mt-1">
                          <Text className="text-lg mr-1">{selectedSchool.countryFlag}</Text>
                          <Text className="text-gray-600">{selectedSchool.location}</Text>
                        </View>
                        {selectedSchool.ranking && (
                          <View className="flex-row items-center mt-1">
                            <Star size={14} color="#F59E0B" fill="#F59E0B" />
                            <Text className="text-amber-600 font-medium ml-1">
                              World Rank #{selectedSchool.ranking}
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>

                    {/* Quick Stats */}
                    <View className="flex-row mb-4">
                      <View className="flex-1 bg-green-100 rounded-xl p-3 mr-2">
                        <Text className="text-green-700 text-xs">Tuition/Year</Text>
                        <Text className="text-green-800 font-bold text-sm mt-1">
                          {selectedSchool.tuition.international}
                        </Text>
                      </View>
                      <View className="flex-1 bg-blue-100 rounded-xl p-3 mr-2">
                        <Text className="text-blue-700 text-xs">Acceptance</Text>
                        <Text className="text-blue-800 font-bold text-sm mt-1">
                          {selectedSchool.acceptanceRate}
                        </Text>
                      </View>
                      <View className="flex-1 bg-purple-100 rounded-xl p-3">
                        <Text className="text-purple-700 text-xs">Int'l Students</Text>
                        <Text className="text-purple-800 font-bold text-sm mt-1">
                          {selectedSchool.internationalStudents}
                        </Text>
                      </View>
                    </View>

                    {/* Scholarship Info */}
                    {selectedSchool.scholarshipsAvailable && (
                      <View className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 mb-4">
                        <View className="flex-row items-center mb-2">
                          <Award size={20} color="#F59E0B" />
                          <Text className="text-yellow-700 font-bold text-base ml-2">
                            Scholarships Available
                          </Text>
                        </View>
                        <Text className="text-yellow-800">{selectedSchool.scholarshipInfo}</Text>
                      </View>
                    )}

                    {/* Description */}
                    <View className="mb-4">
                      <Text className="text-warmBrown font-bold text-lg mb-2">About</Text>
                      <Text className="text-gray-600 leading-6">{selectedSchool.description}</Text>
                    </View>

                    {/* Highlights */}
                    <View className="mb-4">
                      <Text className="text-warmBrown font-bold text-lg mb-2">Why Study Here</Text>
                      {selectedSchool.highlights.map((highlight, index) => (
                        <View key={index} className="flex-row items-start mb-2">
                          <CheckCircle size={16} color="#10B981" style={{ marginTop: 2, marginRight: 8 }} />
                          <Text className="text-gray-600 flex-1">{highlight}</Text>
                        </View>
                      ))}
                    </View>

                    {/* Programs */}
                    <View className="mb-4">
                      <Text className="text-warmBrown font-bold text-lg mb-2">Popular Programs</Text>
                      <View className="flex-row flex-wrap">
                        {selectedSchool.programs.map((program, index) => (
                          <View key={index} className="bg-gray-100 rounded-full px-3 py-1.5 mr-2 mb-2">
                            <Text className="text-gray-700 text-sm">{program}</Text>
                          </View>
                        ))}
                      </View>
                    </View>

                    {/* Requirements */}
                    <View className="mb-4">
                      <Text className="text-warmBrown font-bold text-lg mb-2">Language Requirements</Text>
                      <View className="flex-row flex-wrap">
                        {selectedSchool.languageRequirements.map((req, index) => (
                          <View key={index} className="bg-blue-50 rounded-full px-3 py-1.5 mr-2 mb-2">
                            <Text className="text-blue-600 text-sm">{req}</Text>
                          </View>
                        ))}
                      </View>
                    </View>

                    {/* Deadline */}
                    <View className="bg-red-50 rounded-2xl p-4 mb-4">
                      <View className="flex-row items-center">
                        <Calendar size={20} color="#EF4444" />
                        <Text className="text-red-700 font-bold ml-2">Application Deadline</Text>
                      </View>
                      <Text className="text-red-600 mt-1">{selectedSchool.applicationDeadline}</Text>
                    </View>

                    {/* Amenities */}
                    <View className="flex-row mb-4">
                      {selectedSchool.workOpportunity && (
                        <View className="flex-1 bg-green-50 rounded-xl p-3 mr-2 items-center">
                          <Briefcase size={24} color="#10B981" />
                          <Text className="text-green-700 text-xs mt-1 text-center">Work While Study</Text>
                        </View>
                      )}
                      {selectedSchool.housingAvailable && (
                        <View className="flex-1 bg-blue-50 rounded-xl p-3 items-center">
                          <Building size={24} color="#3B82F6" />
                          <Text className="text-blue-700 text-xs mt-1 text-center">Campus Housing</Text>
                        </View>
                      )}
                    </View>
                  </View>
                </ScrollView>

                {/* Apply Button */}
                <View className="px-5 py-4 border-t border-gray-100 bg-white">
                  <Pressable onPress={() => openApplicationUrl(selectedSchool.applicationUrl)}>
                    <LinearGradient
                      colors={['#7C3AED', '#6D28D9']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={{
                        borderRadius: 16,
                        paddingVertical: 16,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Text className="text-white font-bold text-lg mr-2">Apply Now</Text>
                      <ExternalLink size={20} color="#fff" />
                    </LinearGradient>
                  </Pressable>
                </View>
              </SafeAreaView>
            </View>
          )}
        </Modal>
      </SafeAreaView>
    </View>
  );
}
