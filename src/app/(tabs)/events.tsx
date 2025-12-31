import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, Pressable, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Calendar,
  MapPin,
  Globe,
  Users,
  Plus,
  Filter,
  Sparkles,
  Music,
  Utensils,
  Briefcase,
  GraduationCap,
  Heart,
  Trophy,
} from 'lucide-react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { EventCard } from '@/components/EventCard';
import { useStore, MOCK_USERS, type Event, type User } from '@/lib/store';

type EventFilter = 'all' | 'Social Gathering' | 'Cultural Celebration' | 'Food & Dining' | 'Music & Entertainment' | 'Networking' | 'Education & Workshop';
type FeedMode = 'local' | 'global';

// Mock events data
const MOCK_EVENTS: Event[] = [
  {
    id: 'evt_1',
    creator: MOCK_USERS[0],
    title: 'African Heritage Night: Music & Dance',
    description: 'Join us for an evening celebrating African music and traditional dances from across the continent. Live performances, DJ sets, and dance lessons for all levels.',
    date: '2025-01-05',
    time: '7:00 PM',
    endTime: '11:00 PM',
    location: 'Denver, CO',
    address: 'African Cultural Center, 1234 Unity Street, Denver, CO 80202',
    image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=400&fit=crop',
    isPublic: true,
    attendees: [],
    rsvpCount: 89,
    category: 'Cultural Celebration',
    createdAt: '2024-12-20T10:00:00Z',
  },
  {
    id: 'evt_2',
    creator: MOCK_USERS[1],
    title: 'West African Cooking Class',
    description: 'Learn to make authentic Senegalese Thieboudienne and other West African dishes. All ingredients provided. Perfect for beginners!',
    date: '2025-01-08',
    time: '6:00 PM',
    endTime: '9:00 PM',
    location: 'Denver, CO',
    address: "Amara's Kitchen, 567 Flavor Ave, Denver, CO 80203",
    image: 'https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=800&h=400&fit=crop',
    isPublic: true,
    attendees: [],
    rsvpCount: 24,
    category: 'Food & Dining',
    createdAt: '2024-12-22T14:00:00Z',
  },
  {
    id: 'evt_3',
    creator: MOCK_USERS[2],
    title: 'African Tech Professionals Meetup',
    description: 'Monthly networking event for African tech professionals in Colorado. Share experiences, find mentors, and build connections.',
    date: '2025-01-10',
    time: '6:30 PM',
    endTime: '8:30 PM',
    location: 'Denver, CO',
    address: 'WeWork Downtown, 1550 17th St, Denver, CO 80202',
    image: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800&h=400&fit=crop',
    isPublic: true,
    attendees: [],
    rsvpCount: 56,
    category: 'Networking',
    createdAt: '2024-12-25T09:00:00Z',
  },
  {
    id: 'evt_4',
    creator: {
      id: 'u4',
      name: 'Pastor James Osei',
      username: 'pastorosei',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face',
      bio: 'Community leader',
      location: 'Aurora, CO',
      interests: ['Faith', 'Community'],
      joinedDate: '2024-01-01',
    },
    title: 'New Year Community Prayer Breakfast',
    description: 'Start the new year with prayer, fellowship, and a delicious breakfast. All faiths welcome to join in celebration and community.',
    date: '2025-01-01',
    time: '8:00 AM',
    endTime: '11:00 AM',
    location: 'Aurora, CO',
    address: 'African Christian Fellowship, 890 Faith Road, Aurora, CO 80011',
    image: 'https://images.unsplash.com/photo-1529070538774-1843cb3265df?w=800&h=400&fit=crop',
    isPublic: true,
    attendees: [],
    rsvpCount: 120,
    category: 'Social Gathering',
    createdAt: '2024-12-18T08:00:00Z',
  },
  {
    id: 'evt_5',
    creator: {
      id: 'u5',
      name: 'Dr. Amina Diallo',
      username: 'drdiallo',
      avatar: 'https://images.unsplash.com/photo-1589156280159-27698a70f29e?w=200&h=200&fit=crop&crop=face',
      bio: 'Educator and researcher',
      location: 'Boulder, CO',
      interests: ['Education', 'Research'],
      joinedDate: '2024-02-15',
    },
    title: 'African History Workshop: Pre-Colonial Kingdoms',
    description: 'A deep dive into the rich history of pre-colonial African kingdoms. Interactive session with artifacts and primary sources.',
    date: '2025-01-15',
    time: '2:00 PM',
    endTime: '5:00 PM',
    location: 'Boulder, CO',
    address: 'CU Boulder, Norlin Library Room 301, Boulder, CO 80309',
    isPublic: true,
    attendees: [],
    rsvpCount: 45,
    category: 'Education & Workshop',
    createdAt: '2024-12-28T11:00:00Z',
  },
];

// Global events from other cities
const GLOBAL_EVENTS: Event[] = [
  {
    id: 'evt_g1',
    creator: {
      id: 'g1',
      name: 'Fatou Diop',
      username: 'fatoudiop',
      avatar: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=200&h=200&fit=crop&crop=face',
      bio: 'Fashion designer',
      location: 'London, UK',
      interests: ['Fashion', 'Art'],
      joinedDate: '2024-01-10',
    },
    title: 'African Fashion Week London 2025',
    description: 'The biggest celebration of African fashion in Europe. Runway shows, designer meetups, and exclusive shopping experiences.',
    date: '2025-02-14',
    time: '10:00 AM',
    endTime: '9:00 PM',
    location: 'London, UK',
    address: 'ExCel London, Royal Victoria Dock, London E16 1XL',
    image: 'https://images.unsplash.com/photo-1558171813-4c088753af8f?w=800&h=400&fit=crop',
    isPublic: true,
    attendees: [],
    rsvpCount: 2500,
    category: 'Cultural Celebration',
    createdAt: '2024-12-01T10:00:00Z',
  },
  {
    id: 'evt_g2',
    creator: {
      id: 'g2',
      name: 'Kofi Mensah',
      username: 'kofimensah',
      avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&h=200&fit=crop&crop=face',
      bio: 'Tech entrepreneur',
      location: 'Accra, Ghana',
      interests: ['Tech', 'Startups'],
      joinedDate: '2024-02-15',
    },
    title: 'AfricaTech Summit 2025',
    description: 'The premier technology conference connecting African innovators, investors, and tech leaders from around the world.',
    date: '2025-03-20',
    time: '9:00 AM',
    endTime: '6:00 PM',
    location: 'Accra, Ghana',
    address: 'Accra International Conference Centre, Castle Road, Accra',
    image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=400&fit=crop',
    isPublic: true,
    attendees: [],
    rsvpCount: 5000,
    category: 'Networking',
    createdAt: '2024-11-15T08:00:00Z',
  },
  {
    id: 'evt_g3',
    creator: {
      id: 'g3',
      name: 'Amina Hassan',
      username: 'aminahassan',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=face',
      bio: 'Chef and food blogger',
      location: 'Toronto, Canada',
      interests: ['Food', 'Culture'],
      joinedDate: '2024-03-20',
    },
    title: 'Pan-African Food Festival Toronto',
    description: 'Taste the flavors of Africa! 50+ vendors serving authentic cuisine from across the continent. Live music and cooking demos.',
    date: '2025-06-15',
    time: '11:00 AM',
    endTime: '8:00 PM',
    location: 'Toronto, Canada',
    address: 'Harbourfront Centre, 235 Queens Quay W, Toronto, ON',
    image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&h=400&fit=crop',
    isPublic: true,
    attendees: [],
    rsvpCount: 3200,
    category: 'Food & Dining',
    createdAt: '2024-12-10T14:00:00Z',
  },
];

const FILTER_OPTIONS: Array<{ key: EventFilter; label: string; icon: React.ElementType }> = [
  { key: 'all', label: 'All', icon: Sparkles },
  { key: 'Social Gathering', label: 'Social', icon: Users },
  { key: 'Cultural Celebration', label: 'Culture', icon: Heart },
  { key: 'Food & Dining', label: 'Food', icon: Utensils },
  { key: 'Music & Entertainment', label: 'Music', icon: Music },
  { key: 'Networking', label: 'Network', icon: Briefcase },
  { key: 'Education & Workshop', label: 'Learn', icon: GraduationCap },
];

export default function EventsScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [feedMode, setFeedMode] = useState<FeedMode>('local');
  const [activeFilter, setActiveFilter] = useState<EventFilter>('all');

  const selectedLocation = useStore((s) => s.selectedLocation);
  const eventRsvps = useStore((s) => s.eventRsvps);
  const setEventRsvp = useStore((s) => s.setEventRsvp);

  const cityName = selectedLocation?.city || 'Denver';

  // Filter and combine events based on mode and filter
  const filteredEvents = useMemo(() => {
    let events = feedMode === 'local' ? MOCK_EVENTS : [...MOCK_EVENTS, ...GLOBAL_EVENTS];

    // Filter by location for local mode
    if (feedMode === 'local') {
      events = events.filter((e) =>
        e.location.toLowerCase().includes(cityName.toLowerCase()) ||
        e.location.toLowerCase().includes(selectedLocation?.state?.toLowerCase() || '')
      );
    }

    // Filter by category
    if (activeFilter !== 'all') {
      events = events.filter((e) => e.category === activeFilter);
    }

    // Sort by date
    return events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [feedMode, activeFilter, cityName, selectedLocation?.state]);

  // Get upcoming events (next 7 days) for featured section
  const upcomingEvents = useMemo(() => {
    const now = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);

    return MOCK_EVENTS.filter((e) => {
      const eventDate = new Date(e.date);
      return eventDate >= now && eventDate <= nextWeek;
    }).slice(0, 3);
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const handleFeedModeToggle = (mode: FeedMode) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFeedMode(mode);
  };

  const handleFilterPress = (filter: EventFilter) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveFilter(filter);
  };

  const handleRsvp = (eventId: string, status: 'interested' | 'going') => {
    const currentRsvp = eventRsvps.find((r) => r.eventId === eventId);
    if (currentRsvp?.status === status) {
      setEventRsvp(eventId, null);
    } else {
      setEventRsvp(eventId, status);
    }
  };

  const handleCreateEvent = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/create-event' as any);
  };

  return (
    <View className="flex-1 bg-cream">
      <SafeAreaView edges={['top']} className="flex-1">
        {/* Header */}
        <Animated.View
          entering={FadeInDown.duration(400).delay(100)}
          className="px-5 pt-2 pb-4"
        >
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-3xl font-bold text-warmBrown">Events</Text>
              <View className="flex-row items-center mt-1">
                <MapPin size={14} color="#D4673A" />
                <Text className="text-gray-500 ml-1">
                  {feedMode === 'local' ? `In ${cityName}` : 'Worldwide'}
                </Text>
              </View>
            </View>

            <Pressable
              onPress={handleCreateEvent}
              className="bg-terracotta-500 rounded-full p-3 shadow-sm"
            >
              <Plus size={22} color="#FFFFFF" />
            </Pressable>
          </View>

          {/* Local/Global Toggle */}
          <View className="flex-row mt-4 bg-white rounded-full p-1 shadow-sm">
            <Pressable
              onPress={() => handleFeedModeToggle('local')}
              className={`flex-1 flex-row items-center justify-center py-2.5 rounded-full ${
                feedMode === 'local' ? 'bg-terracotta-500' : ''
              }`}
            >
              <Users size={16} color={feedMode === 'local' ? '#FFFFFF' : '#8B7355'} />
              <Text
                className={`ml-2 font-medium ${
                  feedMode === 'local' ? 'text-white' : 'text-gray-500'
                }`}
              >
                Local
              </Text>
            </Pressable>

            <Pressable
              onPress={() => handleFeedModeToggle('global')}
              className={`flex-1 flex-row items-center justify-center py-2.5 rounded-full ${
                feedMode === 'global' ? 'bg-forest-700' : ''
              }`}
            >
              <Globe size={16} color={feedMode === 'global' ? '#FFFFFF' : '#8B7355'} />
              <Text
                className={`ml-2 font-medium ${
                  feedMode === 'global' ? 'text-white' : 'text-gray-500'
                }`}
              >
                Global
              </Text>
            </Pressable>
          </View>
        </Animated.View>

        {/* Category Filters */}
        <Animated.View
          entering={FadeInDown.duration(400).delay(200)}
          className="mb-4"
        >
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}
            style={{ flexGrow: 0 }}
          >
            {FILTER_OPTIONS.map((option) => {
              const Icon = option.icon;
              const isActive = activeFilter === option.key;
              return (
                <Pressable
                  key={option.key}
                  onPress={() => handleFilterPress(option.key)}
                  className={`flex-row items-center px-3 py-2 rounded-full ${
                    isActive ? 'bg-warmBrown' : 'bg-white'
                  }`}
                >
                  <Icon size={14} color={isActive ? '#FFFFFF' : '#8B7355'} />
                  <Text
                    className={`ml-1.5 text-sm font-medium ${
                      isActive ? 'text-white' : 'text-warmBrown'
                    }`}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </Animated.View>

        {/* Content */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#D4673A"
              colors={['#D4673A']}
            />
          }
          contentContainerStyle={{ paddingBottom: 20 }}
        >
          {/* Upcoming This Week - Only show in local mode with "all" filter */}
          {feedMode === 'local' && activeFilter === 'all' && upcomingEvents.length > 0 && (
            <Animated.View
              entering={FadeInUp.duration(500).delay(250)}
              className="mb-4"
            >
              <View className="flex-row items-center justify-between px-5 mb-3">
                <View className="flex-row items-center">
                  <View className="bg-terracotta-50 rounded-full p-2 mr-2">
                    <Calendar size={18} color="#D4673A" />
                  </View>
                  <Text className="text-warmBrown font-bold text-lg">This Week</Text>
                </View>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}
                style={{ flexGrow: 0 }}
              >
                {upcomingEvents.map((event) => (
                  <EventCard key={event.id} event={event} variant="compact" />
                ))}
              </ScrollView>
            </Animated.View>
          )}

          {/* Stats Banner */}
          <Animated.View
            entering={FadeInUp.duration(500).delay(300)}
            className="mx-4 mb-4"
          >
            <LinearGradient
              colors={['#1B4D3E', '#2D6A4F']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ borderRadius: 16, padding: 16 }}
            >
              <View className="flex-row items-center justify-between">
                <View className="items-center flex-1">
                  <Text className="text-white text-2xl font-bold">
                    {filteredEvents.length}
                  </Text>
                  <Text className="text-white/70 text-xs mt-1">Events</Text>
                </View>
                <View className="w-px h-8 bg-white/20" />
                <View className="items-center flex-1">
                  <Text className="text-white text-2xl font-bold">
                    {eventRsvps.filter((r) => r.status === 'going').length}
                  </Text>
                  <Text className="text-white/70 text-xs mt-1">Going</Text>
                </View>
                <View className="w-px h-8 bg-white/20" />
                <View className="items-center flex-1">
                  <Text className="text-white text-2xl font-bold">
                    {eventRsvps.filter((r) => r.status === 'interested').length}
                  </Text>
                  <Text className="text-white/70 text-xs mt-1">Interested</Text>
                </View>
              </View>
            </LinearGradient>
          </Animated.View>

          {/* All Events Header */}
          <Animated.View
            entering={FadeInUp.duration(500).delay(350)}
            className="px-5 mb-3"
          >
            <Text className="text-warmBrown font-bold text-lg">
              {feedMode === 'local' ? 'Events Near You' : 'Events Worldwide'}
            </Text>
          </Animated.View>

          {/* Event Cards */}
          {filteredEvents.length > 0 ? (
            filteredEvents.map((event, index) => {
              const rsvp = eventRsvps.find((r) => r.eventId === event.id);
              return (
                <Animated.View
                  key={event.id}
                  entering={FadeInUp.duration(400).delay(400 + index * 100)}
                >
                  <EventCard
                    event={event}
                    rsvpStatus={rsvp?.status}
                    onRsvp={(status) => handleRsvp(event.id, status)}
                  />
                </Animated.View>
              );
            })
          ) : (
            <View className="mx-4 py-12 items-center">
              <View className="bg-gray-100 rounded-full p-4 mb-4">
                <Calendar size={32} color="#9CA3AF" />
              </View>
              <Text className="text-warmBrown font-semibold text-lg text-center">
                No events found
              </Text>
              <Text className="text-gray-500 text-center mt-2">
                {activeFilter !== 'all'
                  ? 'Try a different category filter'
                  : feedMode === 'local'
                  ? 'Be the first to create an event!'
                  : 'Check back soon for more events'}
              </Text>
              {feedMode === 'local' && (
                <Pressable
                  onPress={handleCreateEvent}
                  className="mt-4 bg-terracotta-500 px-6 py-3 rounded-full flex-row items-center"
                >
                  <Plus size={18} color="#FFFFFF" />
                  <Text className="text-white font-semibold ml-2">Create Event</Text>
                </Pressable>
              )}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
