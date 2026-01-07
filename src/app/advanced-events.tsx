import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Image,
  Modal,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeInDown,
  FadeInUp,
} from 'react-native-reanimated';
import {
  Calendar,
  MapPin,
  Clock,
  Users,
  Ticket,
  Video,
  Play,
  Star,
  Heart,
  Share2,
  ChevronRight,
  Plus,
  Filter,
  Search,
  X,
  DollarSign,
  Tv,
  Music,
  Utensils,
  GraduationCap,
  Palette,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

interface AdvancedEvent {
  id: string;
  title: string;
  description: string;
  type: 'in-person' | 'virtual' | 'hybrid' | 'watch-party';
  category: 'cultural' | 'music' | 'food' | 'education' | 'art' | 'sports' | 'networking';
  date: string;
  time: string;
  endTime?: string;
  location?: string;
  virtualLink?: string;
  hostId: string;
  hostName: string;
  hostAvatar: string;
  coverImage: string;
  ticketPrice: number;
  ticketsSold: number;
  maxCapacity: number;
  isTicketed: boolean;
  isFeatured: boolean;
  attendees: { userId: string; userName: string; userAvatar: string }[];
  watchPartyContent?: {
    title: string;
    platform: string;
    thumbnail: string;
  };
}

const mockEvents: AdvancedEvent[] = [
  {
    id: '1',
    title: 'Afrobeats Dance Workshop',
    description: 'Learn the hottest Afrobeats dance moves with professional choreographer Ama Johnson. All skill levels welcome!',
    type: 'in-person',
    category: 'music',
    date: '2025-01-18',
    time: '14:00',
    endTime: '16:00',
    location: 'Community Center, 123 Unity St',
    hostId: '1',
    hostName: 'Ama Johnson',
    hostAvatar: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=100',
    coverImage: 'https://images.unsplash.com/photo-1545959570-a94084071b5d?w=800',
    ticketPrice: 25,
    ticketsSold: 42,
    maxCapacity: 50,
    isTicketed: true,
    isFeatured: true,
    attendees: [
      { userId: '2', userName: 'Kofi M.', userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100' },
      { userId: '3', userName: 'Zainab K.', userAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100' },
    ],
  },
  {
    id: '2',
    title: 'Virtual Cooking Class: Jollof Rice',
    description: 'Master the art of making perfect Jollof rice with Chef Kwame. Includes recipe kit delivery option.',
    type: 'virtual',
    category: 'food',
    date: '2025-01-20',
    time: '18:00',
    endTime: '20:00',
    virtualLink: 'https://zoom.us/j/123456',
    hostId: '2',
    hostName: 'Chef Kwame',
    hostAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100',
    coverImage: 'https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=800',
    ticketPrice: 15,
    ticketsSold: 78,
    maxCapacity: 100,
    isTicketed: true,
    isFeatured: true,
    attendees: [
      { userId: '4', userName: 'Nia W.', userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100' },
    ],
  },
  {
    id: '3',
    title: 'Black Panther: Wakanda Forever Watch Party',
    description: 'Join the community for a virtual watch party! We will sync up and watch together while chatting.',
    type: 'watch-party',
    category: 'cultural',
    date: '2025-01-22',
    time: '20:00',
    virtualLink: 'https://meet.diaspora.app/watchparty',
    hostId: '3',
    hostName: 'Movie Night Crew',
    hostAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100',
    coverImage: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800',
    ticketPrice: 0,
    ticketsSold: 156,
    maxCapacity: 500,
    isTicketed: false,
    isFeatured: false,
    attendees: [],
    watchPartyContent: {
      title: 'Black Panther: Wakanda Forever',
      platform: 'Disney+',
      thumbnail: 'https://images.unsplash.com/photo-1635805737707-575885ab0820?w=400',
    },
  },
  {
    id: '4',
    title: 'Pan-African Art Exhibition',
    description: 'Explore stunning works from 20+ African and diaspora artists. Opening night includes live music and refreshments.',
    type: 'hybrid',
    category: 'art',
    date: '2025-01-25',
    time: '17:00',
    endTime: '21:00',
    location: 'Gallery Ubuntu, 456 Heritage Ave',
    virtualLink: 'https://gallery.diaspora.app/tour',
    hostId: '4',
    hostName: 'Gallery Ubuntu',
    hostAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
    coverImage: 'https://images.unsplash.com/photo-1582555172866-f73bb12a2ab3?w=800',
    ticketPrice: 10,
    ticketsSold: 89,
    maxCapacity: 150,
    isTicketed: true,
    isFeatured: true,
    attendees: [],
  },
  {
    id: '5',
    title: 'Youth Mentorship Networking',
    description: 'Connect young professionals with experienced mentors in various industries. Free for students!',
    type: 'in-person',
    category: 'networking',
    date: '2025-01-28',
    time: '10:00',
    endTime: '14:00',
    location: 'Innovation Hub, 789 Progress Blvd',
    hostId: '5',
    hostName: 'Diaspora Careers',
    hostAvatar: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=100',
    coverImage: 'https://images.unsplash.com/photo-1515169067868-5387ec356754?w=800',
    ticketPrice: 0,
    ticketsSold: 45,
    maxCapacity: 100,
    isTicketed: false,
    isFeatured: false,
    attendees: [],
  },
];

const categories = [
  { id: 'all', name: 'All', icon: Calendar },
  { id: 'cultural', name: 'Cultural', icon: Star },
  { id: 'music', name: 'Music', icon: Music },
  { id: 'food', name: 'Food', icon: Utensils },
  { id: 'education', name: 'Education', icon: GraduationCap },
  { id: 'art', name: 'Art', icon: Palette },
];

export default function AdvancedEventsScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'upcoming' | 'watch-parties' | 'my-tickets'>('upcoming');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedEvent, setSelectedEvent] = useState<AdvancedEvent | null>(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [ticketQuantity, setTicketQuantity] = useState(1);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'virtual': return Video;
      case 'watch-party': return Tv;
      case 'hybrid': return Play;
      default: return MapPin;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'virtual': return '#8B5CF6';
      case 'watch-party': return '#EC4899';
      case 'hybrid': return '#3B82F6';
      default: return '#10B981';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'music': return Music;
      case 'food': return Utensils;
      case 'education': return GraduationCap;
      case 'art': return Palette;
      default: return Star;
    }
  };

  const filteredEvents = mockEvents.filter(event => {
    if (activeTab === 'watch-parties') return event.type === 'watch-party';
    if (activeTab === 'my-tickets') return event.ticketsSold > 0; // Placeholder
    if (selectedCategory !== 'all') return event.category === selectedCategory;
    return true;
  });

  const handleGetTickets = (event: AdvancedEvent) => {
    setSelectedEvent(event);
    setShowEventModal(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const handlePurchase = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setShowEventModal(false);
    // Would integrate with payment
  };

  return (
    <View className="flex-1 bg-stone-100">
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />

      <LinearGradient
        colors={['#7C3AED', '#8B5CF6', '#A78BFA']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ paddingTop: 60, paddingBottom: 20, paddingHorizontal: 20 }}
      >
        <Pressable onPress={() => router.back()} className="mb-4">
          <Text className="text-white/80 text-base">← Back</Text>
        </Pressable>

        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-white/80 text-base mb-1">Discover & Connect</Text>
            <Text className="text-white text-3xl font-bold">Events</Text>
          </View>
          <Pressable className="bg-white/20 rounded-full p-3">
            <Plus size={24} color="white" />
          </Pressable>
        </View>

        {/* Search Bar */}
        <View className="mt-4 flex-row items-center bg-white/20 rounded-xl px-4 py-3">
          <Search size={20} color="white" />
          <TextInput
            placeholder="Search events..."
            placeholderTextColor="rgba(255,255,255,0.6)"
            className="flex-1 ml-3 text-white"
          />
          <Pressable>
            <Filter size={20} color="white" />
          </Pressable>
        </View>
      </LinearGradient>

      {/* Tabs */}
      <View className="flex-row bg-white border-b border-stone-200">
        {(['upcoming', 'watch-parties', 'my-tickets'] as const).map((tab) => (
          <Pressable
            key={tab}
            onPress={() => setActiveTab(tab)}
            className={`flex-1 py-4 ${activeTab === tab ? 'border-b-2 border-violet-600' : ''}`}
          >
            <Text
              className={`text-center font-semibold ${
                activeTab === tab ? 'text-violet-600' : 'text-stone-500'
              }`}
            >
              {tab === 'watch-parties' ? 'Watch Parties' : tab === 'my-tickets' ? 'My Tickets' : 'Upcoming'}
            </Text>
          </Pressable>
        ))}
      </View>

      {activeTab === 'upcoming' && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="bg-white py-3 border-b border-stone-200"
          contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
          style={{ flexGrow: 0 }}
        >
          {categories.map((cat) => {
            const IconComponent = cat.icon;
            return (
              <Pressable
                key={cat.id}
                onPress={() => setSelectedCategory(cat.id)}
                className={`flex-row items-center px-4 py-2 rounded-full ${
                  selectedCategory === cat.id ? 'bg-violet-600' : 'bg-stone-100'
                }`}
              >
                <IconComponent
                  size={16}
                  color={selectedCategory === cat.id ? 'white' : '#78716C'}
                />
                <Text
                  className={`ml-2 font-medium ${
                    selectedCategory === cat.id ? 'text-white' : 'text-stone-600'
                  }`}
                >
                  {cat.name}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      )}

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Featured Events */}
        {activeTab === 'upcoming' && (
          <View className="p-4">
            <Text className="text-stone-800 font-bold text-lg mb-3">Featured Events</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ marginHorizontal: -16, flexGrow: 0 }}
              contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
            >
              {filteredEvents.filter(e => e.isFeatured).map((event, index) => {
                const TypeIcon = getTypeIcon(event.type);
                return (
                  <Animated.View
                    key={event.id}
                    entering={FadeInDown.delay(index * 100)}
                  >
                    <Pressable
                      className="w-72 bg-white rounded-2xl overflow-hidden shadow-sm"
                      onPress={() => handleGetTickets(event)}
                    >
                      <Image
                        source={{ uri: event.coverImage }}
                        className="w-full h-40"
                      />
                      <View
                        className="absolute top-3 left-3 flex-row items-center px-2 py-1 rounded-full"
                        style={{ backgroundColor: getTypeColor(event.type) }}
                      >
                        <TypeIcon size={12} color="white" />
                        <Text className="text-white text-xs font-medium ml-1 capitalize">{event.type}</Text>
                      </View>

                      {event.isTicketed && (
                        <View className="absolute top-3 right-3 bg-white px-2 py-1 rounded-full flex-row items-center">
                          <Ticket size={12} color="#7C3AED" />
                          <Text className="text-violet-600 text-xs font-bold ml-1">
                            ${event.ticketPrice}
                          </Text>
                        </View>
                      )}

                      <View className="p-4">
                        <Text className="text-stone-800 font-bold text-base" numberOfLines={1}>
                          {event.title}
                        </Text>

                        <View className="flex-row items-center mt-2">
                          <Calendar size={14} color="#78716C" />
                          <Text className="text-stone-600 text-sm ml-1">
                            {new Date(event.date).toLocaleDateString('en-US', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </Text>
                          <Clock size={14} color="#78716C" className="ml-3" />
                          <Text className="text-stone-600 text-sm ml-1">{event.time}</Text>
                        </View>

                        <View className="flex-row items-center justify-between mt-3">
                          <View className="flex-row items-center">
                            <Image
                              source={{ uri: event.hostAvatar }}
                              className="w-6 h-6 rounded-full"
                            />
                            <Text className="text-stone-600 text-sm ml-2">{event.hostName}</Text>
                          </View>
                          <View className="flex-row items-center">
                            <Users size={14} color="#78716C" />
                            <Text className="text-stone-500 text-xs ml-1">
                              {event.ticketsSold}/{event.maxCapacity}
                            </Text>
                          </View>
                        </View>
                      </View>
                    </Pressable>
                  </Animated.View>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* All Events List */}
        <View className="px-4 pb-4">
          {activeTab !== 'upcoming' && (
            <Text className="text-stone-800 font-bold text-lg mb-3 mt-4">
              {activeTab === 'watch-parties' ? 'Watch Parties' : 'Your Tickets'}
            </Text>
          )}
          {activeTab === 'upcoming' && (
            <Text className="text-stone-800 font-bold text-lg mb-3">All Events</Text>
          )}

          {filteredEvents.map((event, index) => {
            const TypeIcon = getTypeIcon(event.type);
            const CategoryIcon = getCategoryIcon(event.category);

            return (
              <Animated.View
                key={event.id}
                entering={FadeInUp.delay(index * 80)}
              >
                <Pressable
                  className="bg-white rounded-2xl mb-3 overflow-hidden flex-row"
                  onPress={() => handleGetTickets(event)}
                >
                  <Image
                    source={{ uri: event.coverImage }}
                    className="w-28 h-full"
                  />
                  <View className="flex-1 p-4">
                    <View className="flex-row items-center justify-between">
                      <View
                        className="flex-row items-center px-2 py-1 rounded-full"
                        style={{ backgroundColor: `${getTypeColor(event.type)}20` }}
                      >
                        <TypeIcon size={12} color={getTypeColor(event.type)} />
                        <Text
                          className="text-xs font-medium ml-1 capitalize"
                          style={{ color: getTypeColor(event.type) }}
                        >
                          {event.type}
                        </Text>
                      </View>
                      {event.isTicketed && (
                        <Text className="text-violet-600 font-bold">
                          ${event.ticketPrice}
                        </Text>
                      )}
                    </View>

                    <Text className="text-stone-800 font-bold mt-2" numberOfLines={1}>
                      {event.title}
                    </Text>

                    <View className="flex-row items-center mt-2">
                      <Calendar size={12} color="#78716C" />
                      <Text className="text-stone-500 text-xs ml-1">
                        {new Date(event.date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </Text>
                      <Text className="text-stone-400 mx-1">•</Text>
                      <Clock size={12} color="#78716C" />
                      <Text className="text-stone-500 text-xs ml-1">{event.time}</Text>
                    </View>

                    <View className="flex-row items-center mt-2">
                      <Users size={12} color="#78716C" />
                      <Text className="text-stone-500 text-xs ml-1">
                        {event.ticketsSold} attending
                      </Text>
                      {event.maxCapacity - event.ticketsSold < 20 && (
                        <Text className="text-orange-600 text-xs ml-2 font-medium">
                          Almost full!
                        </Text>
                      )}
                    </View>
                  </View>
                </Pressable>
              </Animated.View>
            );
          })}
        </View>

        <View className="h-8" />
      </ScrollView>

      {/* Event Detail Modal */}
      <Modal
        visible={showEventModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowEventModal(false)}
      >
        {selectedEvent && (
          <View className="flex-1 bg-white">
            <ScrollView showsVerticalScrollIndicator={false}>
              <Image
                source={{ uri: selectedEvent.coverImage }}
                className="w-full h-64"
              />

              <Pressable
                className="absolute top-12 left-4 bg-black/50 rounded-full p-2"
                onPress={() => setShowEventModal(false)}
              >
                <X size={24} color="white" />
              </Pressable>

              <View className="absolute top-12 right-4 flex-row gap-2">
                <Pressable className="bg-black/50 rounded-full p-2">
                  <Heart size={24} color="white" />
                </Pressable>
                <Pressable className="bg-black/50 rounded-full p-2">
                  <Share2 size={24} color="white" />
                </Pressable>
              </View>

              <View className="p-6">
                <View
                  className="flex-row items-center px-3 py-1 rounded-full self-start mb-3"
                  style={{ backgroundColor: `${getTypeColor(selectedEvent.type)}20` }}
                >
                  {React.createElement(getTypeIcon(selectedEvent.type), {
                    size: 14,
                    color: getTypeColor(selectedEvent.type),
                  })}
                  <Text
                    className="text-sm font-medium ml-1 capitalize"
                    style={{ color: getTypeColor(selectedEvent.type) }}
                  >
                    {selectedEvent.type === 'watch-party' ? 'Watch Party' : selectedEvent.type}
                  </Text>
                </View>

                <Text className="text-stone-800 text-2xl font-bold">
                  {selectedEvent.title}
                </Text>

                <View className="flex-row items-center mt-4">
                  <Image
                    source={{ uri: selectedEvent.hostAvatar }}
                    className="w-12 h-12 rounded-full"
                  />
                  <View className="ml-3">
                    <Text className="text-stone-600 text-sm">Hosted by</Text>
                    <Text className="text-stone-800 font-semibold">{selectedEvent.hostName}</Text>
                  </View>
                </View>

                <View className="bg-stone-100 rounded-xl p-4 mt-4">
                  <View className="flex-row items-center mb-3">
                    <Calendar size={20} color="#7C3AED" />
                    <View className="ml-3">
                      <Text className="text-stone-800 font-medium">
                        {new Date(selectedEvent.date).toLocaleDateString('en-US', {
                          weekday: 'long',
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </Text>
                      <Text className="text-stone-500 text-sm">
                        {selectedEvent.time} {selectedEvent.endTime ? `- ${selectedEvent.endTime}` : ''}
                      </Text>
                    </View>
                  </View>

                  {selectedEvent.location && (
                    <View className="flex-row items-center">
                      <MapPin size={20} color="#7C3AED" />
                      <Text className="text-stone-800 ml-3">{selectedEvent.location}</Text>
                    </View>
                  )}

                  {selectedEvent.virtualLink && (
                    <View className="flex-row items-center mt-3">
                      <Video size={20} color="#7C3AED" />
                      <Text className="text-violet-600 ml-3">Virtual event link provided after registration</Text>
                    </View>
                  )}
                </View>

                <Text className="text-stone-800 font-bold text-lg mt-6 mb-2">About this event</Text>
                <Text className="text-stone-600 leading-6">{selectedEvent.description}</Text>

                {selectedEvent.watchPartyContent && (
                  <View className="bg-pink-50 rounded-xl p-4 mt-4 border border-pink-200">
                    <Text className="text-pink-600 font-bold mb-2">We're watching:</Text>
                    <View className="flex-row items-center">
                      <Image
                        source={{ uri: selectedEvent.watchPartyContent.thumbnail }}
                        className="w-20 h-12 rounded-lg"
                      />
                      <View className="ml-3">
                        <Text className="text-stone-800 font-semibold">
                          {selectedEvent.watchPartyContent.title}
                        </Text>
                        <Text className="text-stone-500 text-sm">
                          On {selectedEvent.watchPartyContent.platform}
                        </Text>
                      </View>
                    </View>
                  </View>
                )}

                <View className="flex-row items-center justify-between mt-6 bg-stone-100 rounded-xl p-4">
                  <View>
                    <Text className="text-stone-500 text-sm">Attendees</Text>
                    <View className="flex-row items-center mt-1">
                      <Users size={16} color="#78716C" />
                      <Text className="text-stone-800 font-semibold ml-2">
                        {selectedEvent.ticketsSold} / {selectedEvent.maxCapacity}
                      </Text>
                    </View>
                  </View>
                  <View className="h-10 w-px bg-stone-300" />
                  <View>
                    <Text className="text-stone-500 text-sm">Spots left</Text>
                    <Text className="text-stone-800 font-semibold">
                      {selectedEvent.maxCapacity - selectedEvent.ticketsSold}
                    </Text>
                  </View>
                </View>

                {selectedEvent.isTicketed && (
                  <View className="mt-6">
                    <Text className="text-stone-800 font-bold text-lg mb-3">Select Tickets</Text>
                    <View className="flex-row items-center justify-between bg-stone-100 rounded-xl p-4">
                      <View>
                        <Text className="text-stone-800 font-semibold">General Admission</Text>
                        <Text className="text-violet-600 font-bold text-lg">
                          ${selectedEvent.ticketPrice}
                        </Text>
                      </View>
                      <View className="flex-row items-center">
                        <Pressable
                          className="w-10 h-10 bg-white rounded-full items-center justify-center"
                          onPress={() => setTicketQuantity(Math.max(1, ticketQuantity - 1))}
                        >
                          <Text className="text-xl font-bold text-stone-600">-</Text>
                        </Pressable>
                        <Text className="text-stone-800 font-bold text-xl mx-4">{ticketQuantity}</Text>
                        <Pressable
                          className="w-10 h-10 bg-violet-600 rounded-full items-center justify-center"
                          onPress={() => setTicketQuantity(ticketQuantity + 1)}
                        >
                          <Text className="text-xl font-bold text-white">+</Text>
                        </Pressable>
                      </View>
                    </View>
                  </View>
                )}
              </View>
            </ScrollView>

            <View className="p-4 border-t border-stone-200 bg-white">
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-stone-500">Total</Text>
                <Text className="text-stone-800 font-bold text-xl">
                  {selectedEvent.isTicketed ? `$${selectedEvent.ticketPrice * ticketQuantity}` : 'Free'}
                </Text>
              </View>
              <Pressable
                className="bg-violet-600 py-4 rounded-xl flex-row items-center justify-center"
                onPress={handlePurchase}
              >
                <Ticket size={20} color="white" />
                <Text className="text-white font-bold text-lg ml-2">
                  {selectedEvent.isTicketed ? 'Get Tickets' : 'RSVP Free'}
                </Text>
              </Pressable>
            </View>
          </View>
        )}
      </Modal>
    </View>
  );
}
