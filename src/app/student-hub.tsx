import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import {
  GraduationCap,
  BookOpen,
  Briefcase,
  Users,
  Calendar,
  MessageCircle,
  Search,
  Award,
  Target,
  ChevronRight,
  ChevronLeft,
  MapPin,
  Clock,
  Plus,
  UserPlus,
  Plane,
  Building2,
} from 'lucide-react-native';
import Animated, { FadeIn, FadeInUp, FadeInRight } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';

// Mock data for Student Hub
const SCHOLARSHIPS = [
  {
    id: '1',
    title: 'African Diaspora Scholarship',
    organization: 'AfroConnect Foundation',
    amount: '$5,000',
    deadline: '2025-02-15',
    image: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=400&h=300&fit=crop',
  },
  {
    id: '2',
    title: 'STEM Excellence Award',
    organization: 'Tech Africa Initiative',
    amount: '$10,000',
    deadline: '2025-03-01',
    image: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=400&h=300&fit=crop',
  },
  {
    id: '3',
    title: 'Community Leadership Grant',
    organization: 'Pan-African Youth Network',
    amount: '$3,500',
    deadline: '2025-02-28',
    image: 'https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?w=400&h=300&fit=crop',
  },
];

const STUDY_GROUPS = [
  {
    id: '1',
    name: 'Pre-Med Study Circle',
    members: 24,
    subject: 'Medicine',
    nextMeeting: 'Tomorrow, 6 PM',
    avatar: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=200&h=200&fit=crop',
  },
  {
    id: '2',
    name: 'CS Algorithm Masters',
    members: 18,
    subject: 'Computer Science',
    nextMeeting: 'Friday, 4 PM',
    avatar: 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=200&h=200&fit=crop',
  },
  {
    id: '3',
    name: 'Business Case Prep',
    members: 32,
    subject: 'Business',
    nextMeeting: 'Saturday, 10 AM',
    avatar: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=200&h=200&fit=crop',
  },
];

const INTERNSHIPS = [
  {
    id: '1',
    title: 'Software Engineering Intern',
    company: 'African Tech Corp',
    location: 'Remote',
    type: 'Summer 2025',
    logo: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=100&h=100&fit=crop',
  },
  {
    id: '2',
    title: 'Marketing Intern',
    company: 'Diaspora Media',
    location: 'New York, NY',
    type: 'Fall 2025',
    logo: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=100&h=100&fit=crop',
  },
  {
    id: '3',
    title: 'Finance Analyst Intern',
    company: 'Pan-African Bank',
    location: 'London, UK',
    type: 'Summer 2025',
    logo: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=100&h=100&fit=crop',
  },
];

const MENTORS = [
  {
    id: '1',
    name: 'Dr. Amina Koffi',
    title: 'Medical Director',
    expertise: 'Healthcare, Research',
    avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=200&h=200&fit=crop&crop=face',
  },
  {
    id: '2',
    name: 'Chidi Okafor',
    title: 'Senior Engineer at Google',
    expertise: 'Tech, Career Growth',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face',
  },
  {
    id: '3',
    name: 'Fatima Diop',
    title: 'Founder & CEO',
    expertise: 'Entrepreneurship, Leadership',
    avatar: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=200&h=200&fit=crop&crop=face',
  },
];

const CAMPUS_EVENTS = [
  {
    id: '1',
    title: 'African Students Welcome Mixer',
    date: 'Jan 15, 2025',
    time: '5:00 PM',
    location: 'Student Union',
    attendees: 45,
  },
  {
    id: '2',
    title: 'Career Fair: African Employers',
    date: 'Jan 22, 2025',
    time: '10:00 AM',
    location: 'Convention Center',
    attendees: 120,
  },
];

const QUICK_ACTIONS = [
  { id: 'scholarships', label: 'Scholarships', icon: Award, color: '#C9A227' },
  { id: 'study', label: 'Study Groups', icon: BookOpen, color: '#1B4D3E' },
  { id: 'internships', label: 'Internships', icon: Briefcase, color: '#D4673A' },
  { id: 'mentors', label: 'Mentors', icon: Users, color: '#3A8F76' },
];

const ACTION_CARDS = [
  {
    id: 'create-group',
    title: 'Create Study Group',
    description: 'Start your own study group and find study partners',
    icon: Plus,
    color: '#1B4D3E',
    bgColor: 'bg-forest-50',
    route: '/create-study-group',
  },
  {
    id: 'become-mentor',
    title: 'Become a Mentor',
    description: 'Share your expertise and help African students grow',
    icon: UserPlus,
    color: '#C9A227',
    bgColor: 'bg-gold-50',
    route: '/become-mentor',
  },
  {
    id: 'post-internship',
    title: 'Post Internship',
    description: 'Companies: Post opportunities for African students',
    icon: Building2,
    color: '#D4673A',
    bgColor: 'bg-terracotta-50',
    route: '/post-internship',
  },
  {
    id: 'new-arrival',
    title: 'New to the City?',
    description: 'Essential resources for international students',
    icon: Plane,
    color: '#3498DB',
    bgColor: 'bg-blue-50',
    route: '/new-arrival-help',
  },
];

export default function StudentHubScreen() {
  const [searchQuery, setSearchQuery] = useState('');

  const handleQuickAction = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const handleItemPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleActionCard = (route: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push(route as any);
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
              <View className="bg-forest-100 rounded-full p-2 mr-3">
                <GraduationCap size={24} color="#1B4D3E" />
              </View>
              <View>
                <Text className="text-2xl font-bold text-warmBrown">Student Hub</Text>
                <Text className="text-sm text-gray-500">Learn, Connect, Grow</Text>
              </View>
            </View>
          </View>

          {/* Search */}
          <View className="flex-row items-center bg-white rounded-2xl px-4 py-3 mt-4 shadow-sm">
            <Search size={20} color="#8B7355" />
            <TextInput
              placeholder="Search opportunities, groups, mentors..."
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
              className="flex-1 ml-3 text-warmBrown text-base"
            />
          </View>
        </Animated.View>

        <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
          {/* Quick Actions */}
          <Animated.View entering={FadeInUp.duration(400).delay(100)} className="px-5 mt-4">
            <View className="flex-row justify-between">
              {QUICK_ACTIONS.map((action, index) => (
                <Animated.View
                  key={action.id}
                  entering={FadeInUp.duration(300).delay(150 + index * 50)}
                >
                  <Pressable
                    onPress={() => handleQuickAction(action.id)}
                    className="items-center"
                  >
                    <View
                      className="w-16 h-16 rounded-2xl items-center justify-center mb-2"
                      style={{ backgroundColor: `${action.color}15` }}
                    >
                      <action.icon size={28} color={action.color} />
                    </View>
                    <Text className="text-xs text-warmBrown font-medium">{action.label}</Text>
                  </Pressable>
                </Animated.View>
              ))}
            </View>
          </Animated.View>

          {/* Action Cards - User Generated Content */}
          <Animated.View entering={FadeInUp.duration(400).delay(150)} className="px-5 mt-6">
            <Text className="text-lg font-semibold text-warmBrown mb-3">Get Involved</Text>
            <View className="flex-row flex-wrap justify-between">
              {ACTION_CARDS.map((card, index) => (
                <Animated.View
                  key={card.id}
                  entering={FadeInUp.duration(300).delay(180 + index * 50)}
                  className="w-[48%] mb-3"
                >
                  <Pressable
                    onPress={() => handleActionCard(card.route)}
                    className="bg-white rounded-2xl p-4 shadow-sm"
                  >
                    <View className={`${card.bgColor} rounded-full p-2.5 self-start mb-2`}>
                      <card.icon size={22} color={card.color} />
                    </View>
                    <Text className="text-warmBrown font-bold text-sm">{card.title}</Text>
                    <Text className="text-gray-500 text-xs mt-1" numberOfLines={2}>{card.description}</Text>
                  </Pressable>
                </Animated.View>
              ))}
            </View>
          </Animated.View>

          {/* Featured Scholarships */}
          <Animated.View entering={FadeInUp.duration(400).delay(200)} className="mt-6">
            <View className="flex-row items-center justify-between px-5 mb-3">
              <View className="flex-row items-center">
                <Award size={20} color="#C9A227" />
                <Text className="text-lg font-semibold text-warmBrown ml-2">Scholarships</Text>
              </View>
              <Pressable className="flex-row items-center">
                <Text className="text-terracotta-500 text-sm font-medium">See all</Text>
                <ChevronRight size={16} color="#D4673A" />
              </Pressable>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 20 }}
              style={{ flexGrow: 0 }}
            >
              {SCHOLARSHIPS.map((scholarship, index) => (
                <Animated.View
                  key={scholarship.id}
                  entering={FadeInRight.duration(300).delay(250 + index * 100)}
                >
                  <Pressable
                    onPress={handleItemPress}
                    className="bg-white rounded-2xl mr-4 overflow-hidden shadow-sm"
                    style={{ width: 220 }}
                  >
                    <Image
                      source={{ uri: scholarship.image }}
                      style={{ width: '100%', height: 100 }}
                      contentFit="cover"
                    />
                    <View className="p-3">
                      <Text className="text-warmBrown font-semibold" numberOfLines={1}>
                        {scholarship.title}
                      </Text>
                      <Text className="text-gray-500 text-sm mt-0.5">{scholarship.organization}</Text>
                      <View className="flex-row items-center justify-between mt-2">
                        <Text className="text-gold-600 font-bold">{scholarship.amount}</Text>
                        <View className="flex-row items-center">
                          <Clock size={12} color="#9CA3AF" />
                          <Text className="text-gray-400 text-xs ml-1">
                            {new Date(scholarship.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </Pressable>
                </Animated.View>
              ))}
            </ScrollView>
          </Animated.View>

          {/* Study Groups */}
          <Animated.View entering={FadeInUp.duration(400).delay(300)} className="mt-6 px-5">
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center">
                <BookOpen size={20} color="#1B4D3E" />
                <Text className="text-lg font-semibold text-warmBrown ml-2">Study Groups</Text>
              </View>
              <Pressable className="flex-row items-center">
                <Text className="text-terracotta-500 text-sm font-medium">See all</Text>
                <ChevronRight size={16} color="#D4673A" />
              </Pressable>
            </View>

            {STUDY_GROUPS.map((group, index) => (
              <Animated.View
                key={group.id}
                entering={FadeInUp.duration(300).delay(350 + index * 50)}
              >
                <Pressable
                  onPress={handleItemPress}
                  className="flex-row items-center bg-white rounded-2xl p-4 mb-3 shadow-sm"
                >
                  <Image
                    source={{ uri: group.avatar }}
                    style={{ width: 50, height: 50, borderRadius: 12 }}
                    contentFit="cover"
                  />
                  <View className="flex-1 ml-3">
                    <Text className="text-warmBrown font-semibold">{group.name}</Text>
                    <Text className="text-gray-500 text-sm">{group.subject}</Text>
                    <View className="flex-row items-center mt-1">
                      <Users size={12} color="#8B7355" />
                      <Text className="text-gray-400 text-xs ml-1">{group.members} members</Text>
                      <Text className="text-gray-300 mx-2">•</Text>
                      <Clock size={12} color="#8B7355" />
                      <Text className="text-gray-400 text-xs ml-1">{group.nextMeeting}</Text>
                    </View>
                  </View>
                  <View className="bg-forest-50 rounded-full px-3 py-1.5">
                    <Text className="text-forest-700 text-xs font-medium">Join</Text>
                  </View>
                </Pressable>
              </Animated.View>
            ))}
          </Animated.View>

          {/* Internships */}
          <Animated.View entering={FadeInUp.duration(400).delay(400)} className="mt-6">
            <View className="flex-row items-center justify-between px-5 mb-3">
              <View className="flex-row items-center">
                <Briefcase size={20} color="#D4673A" />
                <Text className="text-lg font-semibold text-warmBrown ml-2">Internships</Text>
              </View>
              <Pressable className="flex-row items-center">
                <Text className="text-terracotta-500 text-sm font-medium">See all</Text>
                <ChevronRight size={16} color="#D4673A" />
              </Pressable>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 20 }}
              style={{ flexGrow: 0 }}
            >
              {INTERNSHIPS.map((internship, index) => (
                <Animated.View
                  key={internship.id}
                  entering={FadeInRight.duration(300).delay(450 + index * 100)}
                >
                  <Pressable
                    onPress={handleItemPress}
                    className="bg-white rounded-2xl p-4 mr-4 shadow-sm"
                    style={{ width: 200 }}
                  >
                    <View className="flex-row items-center mb-3">
                      <Image
                        source={{ uri: internship.logo }}
                        style={{ width: 40, height: 40, borderRadius: 8 }}
                        contentFit="cover"
                      />
                      <View className="ml-2 flex-1">
                        <Text className="text-warmBrown font-semibold text-sm" numberOfLines={1}>
                          {internship.title}
                        </Text>
                        <Text className="text-gray-500 text-xs">{internship.company}</Text>
                      </View>
                    </View>
                    <View className="flex-row items-center">
                      <MapPin size={12} color="#8B7355" />
                      <Text className="text-gray-500 text-xs ml-1">{internship.location}</Text>
                    </View>
                    <View className="bg-terracotta-50 rounded-full px-3 py-1 mt-2 self-start">
                      <Text className="text-terracotta-600 text-xs font-medium">{internship.type}</Text>
                    </View>
                  </Pressable>
                </Animated.View>
              ))}
            </ScrollView>
          </Animated.View>

          {/* Find a Mentor */}
          <Animated.View entering={FadeInUp.duration(400).delay(500)} className="mt-6 px-5">
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center">
                <Target size={20} color="#3A8F76" />
                <Text className="text-lg font-semibold text-warmBrown ml-2">Find a Mentor</Text>
              </View>
              <Pressable className="flex-row items-center">
                <Text className="text-terracotta-500 text-sm font-medium">See all</Text>
                <ChevronRight size={16} color="#D4673A" />
              </Pressable>
            </View>

            {MENTORS.map((mentor, index) => (
              <Animated.View
                key={mentor.id}
                entering={FadeInUp.duration(300).delay(550 + index * 50)}
              >
                <Pressable
                  onPress={handleItemPress}
                  className="flex-row items-center bg-white rounded-2xl p-4 mb-3 shadow-sm"
                >
                  <Image
                    source={{ uri: mentor.avatar }}
                    style={{ width: 56, height: 56, borderRadius: 28 }}
                    contentFit="cover"
                  />
                  <View className="flex-1 ml-3">
                    <Text className="text-warmBrown font-semibold">{mentor.name}</Text>
                    <Text className="text-gray-500 text-sm">{mentor.title}</Text>
                    <View className="flex-row items-center mt-1">
                      <View className="bg-forest-50 rounded-full px-2 py-0.5">
                        <Text className="text-forest-700 text-xs">{mentor.expertise}</Text>
                      </View>
                    </View>
                  </View>
                  <Pressable className="bg-terracotta-500 rounded-full p-2.5">
                    <MessageCircle size={18} color="#FFFFFF" />
                  </Pressable>
                </Pressable>
              </Animated.View>
            ))}
          </Animated.View>

          {/* Campus Events */}
          <Animated.View entering={FadeInUp.duration(400).delay(600)} className="mt-6 px-5 mb-8">
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center">
                <Calendar size={20} color="#D4673A" />
                <Text className="text-lg font-semibold text-warmBrown ml-2">Campus Events</Text>
              </View>
              <Pressable className="flex-row items-center">
                <Text className="text-terracotta-500 text-sm font-medium">See all</Text>
                <ChevronRight size={16} color="#D4673A" />
              </Pressable>
            </View>

            {CAMPUS_EVENTS.map((event, index) => (
              <Animated.View
                key={event.id}
                entering={FadeInUp.duration(300).delay(650 + index * 50)}
              >
                <Pressable onPress={handleItemPress}>
                  <LinearGradient
                    colors={index === 0 ? ['#1B4D3E', '#153D31'] : ['#D4673A', '#B85430']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{ borderRadius: 16, padding: 16, marginBottom: 12 }}
                  >
                    <Text className="text-white font-bold text-lg">{event.title}</Text>
                    <View className="flex-row items-center mt-2">
                      <Calendar size={14} color="#FFFFFF99" />
                      <Text className="text-white/80 text-sm ml-2">{event.date} at {event.time}</Text>
                    </View>
                    <View className="flex-row items-center mt-1">
                      <MapPin size={14} color="#FFFFFF99" />
                      <Text className="text-white/80 text-sm ml-2">{event.location}</Text>
                    </View>
                    <View className="flex-row items-center justify-between mt-3">
                      <View className="flex-row items-center">
                        <Users size={14} color="#FFFFFF" />
                        <Text className="text-white text-sm ml-2">{event.attendees} attending</Text>
                      </View>
                      <View className="bg-white/20 rounded-full px-4 py-1.5">
                        <Text className="text-white font-medium text-sm">RSVP</Text>
                      </View>
                    </View>
                  </LinearGradient>
                </Pressable>
              </Animated.View>
            ))}
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
