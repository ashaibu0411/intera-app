import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, Modal, Linking, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Heart,
  Search,
  Plus,
  MapPin,
  Calendar,
  Clock,
  Users,
  Phone,
  Mail,
  ChevronRight,
  ChevronLeft,
  X,
  RefreshCw,
  Star,
  CheckCircle,
} from 'lucide-react-native';
import Animated, { FadeIn, FadeInUp, FadeInRight } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import {
  useStore,
  MOCK_FAITH_EVENTS,
  FAITH_TYPES,
  type FaithEvent,
  type EventRsvp,
} from '@/lib/store';
import { getFaithEvents, rsvpToFaithEvent } from '@/lib/marketplace-api';
import { createPost as createDbPost } from '@/lib/posts';
import { parseEventMetadata } from '@/lib/eventMetadata';

interface DbFaithEvent {
  id: string;
  organizer_id: string;
  organization_name: string;
  organization_logo: string | null;
  faith_type: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  address: string;
  is_recurring: boolean;
  recurring_schedule: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  attendees_count: number;
  created_at: string;
}

export default function FaithCommunityScreen() {
  type FaithTab = 'groups' | 'discover' | 'announcements' | 'calendar';
  const [activeTab, setActiveTab] = useState<FaithTab>('groups');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFaithType, setSelectedFaithType] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<FaithEvent | null>(null);
  const [dbEvents, setDbEvents] = useState<DbFaithEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [announcementOrgName, setAnnouncementOrgName] = useState('');
  const [announcementMessage, setAnnouncementMessage] = useState('');
  const [isPostingAnnouncement, setIsPostingAnnouncement] = useState(false);

  const isGuest = useStore((s) => s.isGuest);
  const currentUser = useStore((s) => s.currentUser);
  const eventRsvps = useStore((s) => s.eventRsvps);
  const setEventRsvp = useStore((s) => s.setEventRsvp);
  const selectedLocation = useStore((s) => s.selectedLocation);
  const currentCommunity = useStore((s) => s.currentCommunity);

  const fetchEvents = async () => {
    try {
      const data = await getFaithEvents();
      setDbEvents(data || []);
    } catch (error) {
      console.error('Error fetching faith events:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchEvents();
  };

  // Convert DB events to app format
  const supabaseEvents: FaithEvent[] = dbEvents.map((e) => {
    const meta = parseEventMetadata(e.description || '');
    return {
      id: e.id,
      organizationName: e.organization_name,
      organizationLogo: meta.flyerUrl || e.organization_logo || 'https://images.unsplash.com/photo-1438032005730-c779502df39b?w=200&h=200&fit=crop',
      faithType: e.faith_type,
      title: e.title,
      description: meta.cleanDescription || e.description,
      date: e.date,
      time: e.time,
      location: e.location,
      address: e.address,
      isRecurring: e.is_recurring,
      recurringSchedule: e.recurring_schedule || undefined,
      contactPhone: e.contact_phone || undefined,
      contactEmail: e.contact_email || undefined,
      attendees: e.attendees_count,
    };
  });

  const allEvents = [...supabaseEvents, ...MOCK_FAITH_EVENTS];

  const filteredEvents = allEvents.filter((event) => {
    const matchesSearch =
      event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.organizationName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFaith = !selectedFaithType || event.faithType === selectedFaithType;
    return matchesSearch && matchesFaith;
  });

  const orgs = Array.from(
    new Map(
      allEvents.map((e) => [
        e.organizationName,
        { name: e.organizationName, logo: e.organizationLogo, faithType: e.faithType },
      ]),
    ).values(),
  );

  const handleFaithTypeSelect = (faithType: string | null) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedFaithType(faithType === selectedFaithType ? null : faithType);
  };

  const handleEventPress = (event: FaithEvent) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedEvent(event);
  };

  const getEventRsvpStatus = (eventId: string): 'interested' | 'going' | null => {
    const rsvp = eventRsvps.find((r) => r.eventId === eventId);
    return rsvp?.status ?? null;
  };

  const handleRsvpSelect = async (status: 'interested' | 'going') => {
    if (!selectedEvent) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (isGuest || !currentUser) {
      router.push('/signup');
      return;
    }

    const currentStatus = getEventRsvpStatus(selectedEvent.id);

    // Toggle off if clicking same status
    if (currentStatus === status) {
      setEventRsvp(selectedEvent.id, null);
    } else {
      setEventRsvp(selectedEvent.id, status);

      // Also call API if it's a DB event and user is going
      if (status === 'going' && !selectedEvent.id.startsWith('mock-')) {
        try {
          await rsvpToFaithEvent(selectedEvent.id, currentUser.id);
        } catch (error) {
          console.error('Error RSVPing to event:', error);
        }
      }
    }
  };

  const handleCall = (phone: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Linking.openURL(`tel:${phone}`);
  };

  const handleEmail = (email: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Linking.openURL(`mailto:${email}`);
  };

  const handleCreateEvent = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (isGuest || !currentUser) {
      router.push('/signup');
    } else {
      router.push('/create-faith-event');
    }
  };

  const openAnnouncementsComposer = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (isGuest || !currentUser) {
      router.push('/signup');
      return;
    }
    setShowAnnouncementModal(true);
  };

  const handlePostAnnouncement = async () => {
    if (!currentUser || isPostingAnnouncement) return;
    if (!announcementOrgName.trim() || announcementMessage.trim().length < 10) return;

    setIsPostingAnnouncement(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const location =
      selectedLocation?.city
        ? `${selectedLocation.city}, ${selectedLocation.state || selectedLocation.country}`
        : currentCommunity?.city
          ? `${currentCommunity.city}, ${currentCommunity.state || currentCommunity.country}`
          : '';

    const faithEmoji =
      selectedFaithType?.toLowerCase().includes('muslim') ? '🕌'
      : selectedFaithType?.toLowerCase().includes('jew') ? '🕍'
      : selectedFaithType?.toLowerCase().includes('hindu') ? '🛕'
      : selectedFaithType?.toLowerCase().includes('christ') ? '⛪'
      : '🕊️';

    try {
      const content =
        `${faithEmoji} ${announcementOrgName.trim()}\n\n` +
        `📣 ${announcementMessage.trim()}\n\n#Announcement`;
      await createDbPost(currentUser.id, content, [], location);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowAnnouncementModal(false);
      setAnnouncementOrgName('');
      setAnnouncementMessage('');
      setActiveTab('announcements');
    } catch (e) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsPostingAnnouncement(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getRsvpBadge = (eventId: string) => {
    const status = getEventRsvpStatus(eventId);
    if (!status) return null;

    return (
      <View className={`flex-row items-center px-2 py-1 rounded-full ${status === 'going' ? 'bg-green-100' : 'bg-gold-100'}`}>
        {status === 'going' ? (
          <CheckCircle size={12} color="#16a34a" />
        ) : (
          <Star size={12} color="#C9A227" />
        )}
        <Text className={`ml-1 text-xs font-medium ${status === 'going' ? 'text-green-600' : 'text-gold-700'}`}>
          {status === 'going' ? 'Going' : 'Interested'}
        </Text>
      </View>
    );
  };

  return (
    <View className="flex-1 bg-cream">
      <SafeAreaView edges={['top']} className="flex-1">
        {/* Header */}
        <Animated.View entering={FadeIn.duration(300)} className="px-5 pt-4 pb-2">
          <View className="flex-row items-center justify-between mb-4">
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
              <View className="bg-gold-100 rounded-full p-2 mr-3">
                <Heart size={24} color="#C9A227" />
              </View>
              <View>
                <Text className="text-2xl font-bold text-warmBrown">Faith Groups & Communities</Text>
                <Text className="text-sm text-gray-500">Churches, mosques & groups — together</Text>
              </View>
            </View>

            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                if (activeTab === 'announcements') {
                  openAnnouncementsComposer();
                } else {
                  handleCreateEvent();
                }
              }}
              className="bg-gold-500 rounded-full p-2.5"
            >
              <Plus size={22} color="#FFFFFF" />
            </Pressable>
          </View>

          {/* Search */}
          <View className="flex-row items-center bg-white rounded-2xl px-4 py-3 shadow-sm">
            <Search size={20} color="#8B7355" />
            <TextInput
              placeholder={activeTab === 'groups' ? 'Search groups, churches, mosques...' : 'Search events, organizations...'}
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
              className="flex-1 ml-3 text-warmBrown text-base"
            />
          </View>

          {/* Tabs */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mt-4"
            style={{ flexGrow: 0 }}
          >
            {[
              { id: 'groups', label: 'Groups' },
              { id: 'discover', label: 'Discover' },
              { id: 'announcements', label: 'Announcements' },
              { id: 'calendar', label: 'Calendar' },
            ].map((t) => (
              <Pressable
                key={t.id}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setActiveTab(t.id as FaithTab);
                }}
                className={`px-4 py-2 rounded-full mr-2 ${
                  activeTab === (t.id as FaithTab) ? 'bg-forest-600' : 'bg-white'
                }`}
              >
                <Text className={`font-medium ${activeTab === (t.id as FaithTab) ? 'text-white' : 'text-gray-600'}`}>
                  {t.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          {/* Faith Type Filter */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mt-4"
            style={{ flexGrow: 0 }}
          >
            <Pressable
              onPress={() => handleFaithTypeSelect(null)}
              className={`px-4 py-2 rounded-full mr-2 ${
                !selectedFaithType ? 'bg-gold-500' : 'bg-white'
              }`}
            >
              <Text
                className={`font-medium ${
                  !selectedFaithType ? 'text-white' : 'text-gray-600'
                }`}
              >
                All
              </Text>
            </Pressable>
            {FAITH_TYPES.map((faithType) => (
              <Pressable
                key={faithType}
                onPress={() => handleFaithTypeSelect(faithType)}
                className={`px-4 py-2 rounded-full mr-2 ${
                  selectedFaithType === faithType ? 'bg-gold-500' : 'bg-white'
                }`}
              >
                <Text
                  className={`font-medium ${
                    selectedFaithType === faithType ? 'text-white' : 'text-gray-600'
                  }`}
                >
                  {faithType}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </Animated.View>

        {/* Body */}
        <ScrollView
          className="flex-1 px-5 pt-4"
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor="#C9A227" />
          }
        >
          {isLoading ? (
            <View className="py-20 items-center">
              <ActivityIndicator size="large" color="#C9A227" />
              <Text className="text-gray-500 mt-4">Loading events...</Text>
            </View>
          ) : (
            <>
              {activeTab === 'discover' && (
                <>
                  {/* Organizations row */}
                  <Animated.View entering={FadeInUp.duration(400).delay(40)} className="mb-4">
                    <Text className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                      Organizations
                    </Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }}>
                      {orgs.slice(0, 10).map((o) => (
                        <Pressable
                          key={o.name}
                          onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            setSearchQuery(o.name);
                          }}
                          className="bg-white rounded-2xl p-3 mr-3 shadow-sm"
                          style={{ width: 180 }}
                        >
                          <View className="flex-row items-center">
                            <Image source={{ uri: o.logo }} style={{ width: 40, height: 40, borderRadius: 20 }} contentFit="cover" />
                            <View className="ml-3 flex-1">
                              <Text className="text-warmBrown font-semibold" numberOfLines={1}>{o.name}</Text>
                              <Text className="text-gray-500 text-xs mt-0.5" numberOfLines={1}>{o.faithType}</Text>
                            </View>
                          </View>
                        </Pressable>
                      ))}
                    </ScrollView>
                  </Animated.View>

                  {/* Serve & Connect Banner */}
          <Animated.View
            entering={FadeInUp.duration(400).delay(50)}
            className="mb-4"
          >
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                router.push('/serve-connect');
              }}
            >
              <LinearGradient
                colors={['#1B4D3E', '#0D3329']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ borderRadius: 16, padding: 16 }}
              >
                <View className="flex-row items-center">
                  <View className="bg-white/20 rounded-full p-3 mr-4">
                    <Users size={24} color="#FFFFFF" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-white font-bold text-base">
                      Serve & Connect
                    </Text>
                    <Text className="text-white/80 text-sm mt-1">
                      Find musicians, volunteers, or offer your skills to serve churches.
                    </Text>
                  </View>
                  <ChevronRight size={24} color="#FFFFFF" />
                </View>
              </LinearGradient>
            </Pressable>
          </Animated.View>

          {/* Prayer & Testimony Wall Banner */}
          <Animated.View
            entering={FadeInUp.duration(400).delay(75)}
            className="mb-4"
          >
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                router.push('/faith-walls');
              }}
            >
              <LinearGradient
                colors={['#8B4513', '#A0522D']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ borderRadius: 16, padding: 16 }}
              >
                <View className="flex-row items-center">
                  <View className="bg-white/20 rounded-full p-3 mr-4">
                    <Heart size={24} color="#FFFFFF" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-white font-bold text-base">
                      Prayer & Testimony Wall
                    </Text>
                    <Text className="text-white/80 text-sm mt-1">
                      Share prayer requests, testimonies, and encourage one another.
                    </Text>
                  </View>
                  <ChevronRight size={24} color="#FFFFFF" />
                </View>
              </LinearGradient>
            </Pressable>
          </Animated.View>

                  {/* Info Banner */}
          <Animated.View
            entering={FadeInUp.duration(400).delay(100)}
            className="mb-4"
          >
            <LinearGradient
              colors={['#C9A227', '#A6841F']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ borderRadius: 16, padding: 16 }}
            >
              <View className="flex-row items-center">
                <View className="flex-1">
                  <Text className="text-white font-bold text-base">
                    Share Your Faith Events
                  </Text>
                  <Text className="text-white/80 text-sm mt-1">
                    Post services, gatherings, and community events — and optionally share to the main home feed.
                  </Text>
                </View>
                <Pressable
                  onPress={handleCreateEvent}
                  className="bg-white/20 rounded-full px-4 py-2"
                >
                  <Text className="text-white font-medium">Post Event</Text>
                </Pressable>
              </View>
            </LinearGradient>
          </Animated.View>

                  {/* Upcoming Events Header */}
          <Animated.View
            entering={FadeInUp.duration(400).delay(150)}
            className="flex-row items-center justify-between mb-3"
          >
            <Text className="text-lg font-semibold text-warmBrown">
              Upcoming Events & Services
            </Text>
          </Animated.View>

                  {/* Events */}
          {filteredEvents.map((event, index) => (
            <Animated.View
              key={event.id}
              entering={FadeInUp.duration(300).delay(200 + index * 50)}
            >
              <Pressable
                onPress={() => handleEventPress(event)}
                className="bg-white rounded-2xl mb-4 overflow-hidden shadow-sm"
              >
                <View className="p-4">
                  {/* Organization Header */}
                  <View className="flex-row items-center mb-3">
                    <Image
                      source={{ uri: event.organizationLogo }}
                      style={{ width: 50, height: 50, borderRadius: 25 }}
                      contentFit="cover"
                    />
                    <View className="flex-1 ml-3">
                      <Text className="text-warmBrown font-semibold">
                        {event.organizationName}
                      </Text>
                      <View className="flex-row items-center mt-0.5">
                        <View className="bg-gold-50 rounded-full px-2 py-0.5">
                          <Text className="text-gold-700 text-xs font-medium">
                            {event.faithType}
                          </Text>
                        </View>
                        {event.isRecurring && (
                          <View className="flex-row items-center ml-2">
                            <RefreshCw size={10} color="#9CA3AF" />
                            <Text className="text-gray-400 text-xs ml-1">
                              {event.recurringSchedule}
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                    <View className="items-end">
                      {getRsvpBadge(event.id)}
                      <ChevronRight size={20} color="#9CA3AF" className="mt-1" />
                    </View>
                  </View>

                  {/* Event Title */}
                  <Text className="text-lg font-bold text-warmBrown mb-2">
                    {event.title}
                  </Text>

                  {/* Event Details */}
                  <View className="flex-row items-center mb-2">
                    <Calendar size={14} color="#C9A227" />
                    <Text className="text-gray-600 text-sm ml-2">
                      {formatDate(event.date)}
                    </Text>
                  </View>

                  <View className="flex-row items-center mb-2">
                    <Clock size={14} color="#C9A227" />
                    <Text className="text-gray-600 text-sm ml-2">{event.time}</Text>
                  </View>

                  <View className="flex-row items-center mb-3">
                    <MapPin size={14} color="#C9A227" />
                    <Text className="text-gray-600 text-sm ml-2" numberOfLines={1}>
                      {event.address}
                    </Text>
                  </View>

                  {/* Footer */}
                  <View className="flex-row items-center justify-between pt-3 border-t border-gray-100">
                    <View className="flex-row items-center">
                      <Users size={14} color="#8B7355" />
                      <Text className="text-gray-500 text-sm ml-2">
                        {event.attendees} attending
                      </Text>
                    </View>
                    <View className="bg-gold-50 rounded-full px-4 py-1.5">
                      <Text className="text-gold-700 font-medium text-sm">RSVP</Text>
                    </View>
                  </View>
                </View>
              </Pressable>
            </Animated.View>
          ))}
                </>
              )}

              {activeTab === 'groups' && (
                <>
                  <Animated.View entering={FadeInUp.duration(400).delay(60)} className="mb-4">
                    <LinearGradient
                      colors={['#1B4D3E', '#153D31']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={{ borderRadius: 16, padding: 16 }}
                    >
                      <Text className="text-white font-bold text-lg">Groups & Communities</Text>
                      <Text className="text-white/80 text-sm mt-1">
                        Create or join faith groups for your church, mosque, temple, or community association.
                      </Text>
                      <Pressable
                        onPress={() => router.push('/create-group')}
                        className="mt-3 bg-white/20 rounded-full px-4 py-2 self-start"
                      >
                        <Text className="text-white font-semibold">Create a Group</Text>
                      </Pressable>
                    </LinearGradient>
                  </Animated.View>

                  {/* Sample Groups - will be replaced with real data */}
                  <Animated.View entering={FadeInUp.duration(400).delay(100)} className="mb-3">
                    <Text className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                      Featured Groups
                    </Text>
                  </Animated.View>

                  {/* Mock Group Cards */}
                  <Pressable
                    onPress={() => router.push('/group/mock-group-1')}
                    className="bg-white rounded-2xl p-4 shadow-sm mb-3 flex-row items-center"
                  >
                    <Image
                      source={{ uri: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=200&h=200&fit=crop' }}
                      style={{ width: 56, height: 56, borderRadius: 12 }}
                      contentFit="cover"
                    />
                    <View className="flex-1 ml-3">
                      <Text className="text-warmBrown font-semibold">Praying for the City of Aurora</Text>
                      <Text className="text-gray-500 text-sm">127 members • Public</Text>
                    </View>
                    <ChevronRight size={20} color="#9CA3AF" />
                  </Pressable>

                  <Pressable
                    onPress={() => router.push('/group/mock-group-2')}
                    className="bg-white rounded-2xl p-4 shadow-sm mb-3 flex-row items-center"
                  >
                    <Image
                      source={{ uri: 'https://images.unsplash.com/photo-1438232992991-995b7058bbb3?w=200&h=200&fit=crop' }}
                      style={{ width: 56, height: 56, borderRadius: 12 }}
                      contentFit="cover"
                    />
                    <View className="flex-1 ml-3">
                      <Text className="text-warmBrown font-semibold">New Life Community Church</Text>
                      <Text className="text-gray-500 text-sm">89 members • Public</Text>
                    </View>
                    <ChevronRight size={20} color="#9CA3AF" />
                  </Pressable>

                  <Pressable
                    onPress={() => router.push('/group/mock-group-3')}
                    className="bg-white rounded-2xl p-4 shadow-sm mb-3 flex-row items-center"
                  >
                    <Image
                      source={{ uri: 'https://images.unsplash.com/photo-1564769625905-50e93615e769?w=200&h=200&fit=crop' }}
                      style={{ width: 56, height: 56, borderRadius: 12 }}
                      contentFit="cover"
                    />
                    <View className="flex-1 ml-3">
                      <Text className="text-warmBrown font-semibold">Aurora Islamic Center</Text>
                      <Text className="text-gray-500 text-sm">156 members • Public</Text>
                    </View>
                    <ChevronRight size={20} color="#9CA3AF" />
                  </Pressable>

                  <View className="h-4" />

                  <Text className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                    Quick Links
                  </Text>

                  <Pressable
                    onPress={() => router.push('/faith-walls')}
                    className="bg-white rounded-2xl p-4 shadow-sm mb-3 flex-row items-center"
                  >
                    <View className="bg-amber-50 rounded-full p-3">
                      <Heart size={20} color="#C9A227" />
                    </View>
                    <View className="flex-1 ml-3">
                      <Text className="text-warmBrown font-semibold">Prayer & Testimony Wall</Text>
                      <Text className="text-gray-500 text-sm">Encouragement, prayer, support</Text>
                    </View>
                    <ChevronRight size={20} color="#9CA3AF" />
                  </Pressable>

                  <Pressable
                    onPress={() => router.push('/serve-connect')}
                    className="bg-white rounded-2xl p-4 shadow-sm mb-3 flex-row items-center"
                  >
                    <View className="bg-forest-50 rounded-full p-3">
                      <Users size={20} color="#1B4D3E" />
                    </View>
                    <View className="flex-1 ml-3">
                      <Text className="text-warmBrown font-semibold">Serve & Connect</Text>
                      <Text className="text-gray-500 text-sm">Volunteers, musicians, helpers</Text>
                    </View>
                    <ChevronRight size={20} color="#9CA3AF" />
                  </Pressable>
                </>
              )}

              {activeTab === 'announcements' && (
                <>
                  <Animated.View entering={FadeInUp.duration(400).delay(60)} className="mb-4">
                    <LinearGradient
                      colors={['#0EA5E9', '#2563EB']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={{ borderRadius: 16, padding: 16 }}
                    >
                      <Text className="text-white font-bold text-lg">Announcements</Text>
                      <Text className="text-white/80 text-sm mt-1">
                        Post updates that appear on the main home feed (great for churches, mosques, and ministries).
                      </Text>
                      <Pressable
                        onPress={openAnnouncementsComposer}
                        className="mt-3 bg-white/20 rounded-full px-4 py-2 self-start"
                      >
                        <Text className="text-white font-semibold">Post announcement</Text>
                      </Pressable>
                    </LinearGradient>
                  </Animated.View>

                  <View className="bg-white rounded-2xl p-4 shadow-sm mb-3">
                    <Text className="text-warmBrown font-semibold">Tip</Text>
                    <Text className="text-gray-500 text-sm mt-1">
                      When posting events, enable “Share to Community Feed” so members see it on Home.
                    </Text>
                  </View>
                </>
              )}

              {activeTab === 'calendar' && (
                <>
                  <Animated.View entering={FadeInUp.duration(400).delay(60)} className="mb-3">
                    <Text className="text-lg font-semibold text-warmBrown">Calendar</Text>
                    <Text className="text-gray-500 text-sm mt-1">
                      Upcoming events across your selected faith filters.
                    </Text>
                  </Animated.View>

                  {filteredEvents.length === 0 ? (
                    <View className="bg-white rounded-2xl p-6 items-center shadow-sm">
                      <Calendar size={32} color="#9CA3AF" />
                      <Text className="text-gray-500 mt-3 text-center">
                        No events match your filters right now.
                      </Text>
                    </View>
                  ) : (
                    filteredEvents.map((event, index) => (
                      <Animated.View
                        key={event.id}
                        entering={FadeInUp.duration(250).delay(100 + index * 30)}
                        className="bg-white rounded-2xl p-4 mb-3 shadow-sm"
                      >
                        <Text className="text-warmBrown font-semibold">{event.title}</Text>
                        <Text className="text-gray-500 text-sm mt-0.5">{event.organizationName} • {event.faithType}</Text>
                        <Text className="text-gray-600 text-sm mt-2">{formatDate(event.date)} · {event.time}</Text>
                        <Text className="text-gray-500 text-sm mt-1" numberOfLines={1}>{event.address}</Text>
                      </Animated.View>
                    ))
                  )}
                </>
              )}

          <View className="h-8" />
            </>
          )}
        </ScrollView>

        {/* Announcement composer modal */}
        <Modal
          visible={showAnnouncementModal}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowAnnouncementModal(false)}
        >
          <SafeAreaView className="flex-1 bg-cream" edges={['top', 'bottom']}>
            <View className="px-5 py-4 border-b border-gray-100 flex-row items-center justify-between">
              <Pressable onPress={() => setShowAnnouncementModal(false)} className="bg-white rounded-full p-2">
                <X size={20} color="#2D1F1A" />
              </Pressable>
              <Text className="text-lg font-bold text-warmBrown">New announcement</Text>
              <Pressable
                onPress={handlePostAnnouncement}
                disabled={isPostingAnnouncement || !announcementOrgName.trim() || announcementMessage.trim().length < 10}
                className="bg-forest-600 rounded-full px-4 py-2"
              >
                <Text className="text-white font-semibold">
                  {isPostingAnnouncement ? 'Posting…' : 'Post'}
                </Text>
              </Pressable>
            </View>
            <ScrollView className="flex-1 px-5 pt-5" showsVerticalScrollIndicator={false}>
              <Text className="text-warmBrown font-semibold mb-2">Organization name</Text>
              <TextInput
                placeholder="e.g., New Life Church / Masjid Al-Huda"
                placeholderTextColor="#9CA3AF"
                value={announcementOrgName}
                onChangeText={setAnnouncementOrgName}
                className="bg-white rounded-xl px-4 py-3.5 text-warmBrown mb-4"
              />
              <Text className="text-warmBrown font-semibold mb-2">Announcement</Text>
              <TextInput
                placeholder="What should members know? (time, location, info)"
                placeholderTextColor="#9CA3AF"
                value={announcementMessage}
                onChangeText={setAnnouncementMessage}
                multiline
                className="bg-white rounded-xl px-4 py-3.5 text-warmBrown min-h-[140px]"
                style={{ textAlignVertical: 'top' }}
              />
              <Text className="text-gray-400 text-xs mt-2">
                This will appear on the main home feed as an announcement.
              </Text>
              <View className="h-24" />
            </ScrollView>
          </SafeAreaView>
        </Modal>

        {/* Event Detail Modal */}
        <Modal
          visible={!!selectedEvent}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setSelectedEvent(null)}
        >
          {selectedEvent && (
            <View className="flex-1 bg-cream">
              <SafeAreaView edges={['top']} className="flex-1">
                {/* Modal Header */}
                <View className="flex-row items-center justify-between px-5 py-4 border-b border-gray-100">
                  <Pressable
                    onPress={() => setSelectedEvent(null)}
                    className="bg-gray-100 rounded-full p-2"
                  >
                    <X size={24} color="#2D1F1A" />
                  </Pressable>
                  <View className="bg-gold-50 rounded-full px-3 py-1">
                    <Text className="text-gold-700 font-medium">
                      {selectedEvent.faithType}
                    </Text>
                  </View>
                </View>

                <ScrollView showsVerticalScrollIndicator={false}>
                  {/* Organization Info */}
                  <View className="p-5">
                    <View className="flex-row items-center mb-4">
                      <Image
                        source={{ uri: selectedEvent.organizationLogo }}
                        style={{ width: 60, height: 60, borderRadius: 30 }}
                        contentFit="cover"
                      />
                      <View className="flex-1 ml-4">
                        <Text className="text-xl font-bold text-warmBrown">
                          {selectedEvent.organizationName}
                        </Text>
                        <View className="flex-row items-center mt-1">
                          <MapPin size={14} color="#8B7355" />
                          <Text className="text-gray-500 ml-1">
                            {selectedEvent.location}
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* Event Title */}
                    <Text className="text-2xl font-bold text-warmBrown mb-4">
                      {selectedEvent.title}
                    </Text>

                    {/* Date & Time Card */}
                    <LinearGradient
                      colors={['#C9A227', '#A6841F']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={{ borderRadius: 16, padding: 16, marginBottom: 16 }}
                    >
                      <View className="flex-row items-center">
                        <Calendar size={24} color="#FFFFFF" />
                        <View className="ml-4">
                          <Text className="text-white font-bold text-lg">
                            {formatDate(selectedEvent.date)}
                          </Text>
                          <Text className="text-white/80">{selectedEvent.time}</Text>
                        </View>
                      </View>
                      {selectedEvent.isRecurring && (
                        <View className="flex-row items-center mt-3 pt-3 border-t border-white/20">
                          <RefreshCw size={16} color="#FFFFFF" />
                          <Text className="text-white ml-2">
                            {selectedEvent.recurringSchedule}
                          </Text>
                        </View>
                      )}
                    </LinearGradient>

                    {/* RSVP Tabs */}
                    <View className="bg-white rounded-2xl p-4 mb-6">
                      <Text className="text-lg font-semibold text-warmBrown mb-3">
                        Are you attending?
                      </Text>
                      <View className="flex-row">
                        <Pressable
                          onPress={() => handleRsvpSelect('interested')}
                          className={`flex-1 flex-row items-center justify-center py-3 rounded-xl mr-2 ${
                            getEventRsvpStatus(selectedEvent.id) === 'interested'
                              ? 'bg-gold-500'
                              : 'bg-gold-50'
                          }`}
                        >
                          <Star
                            size={18}
                            color={getEventRsvpStatus(selectedEvent.id) === 'interested' ? '#FFFFFF' : '#C9A227'}
                            fill={getEventRsvpStatus(selectedEvent.id) === 'interested' ? '#FFFFFF' : 'transparent'}
                          />
                          <Text
                            className={`ml-2 font-semibold ${
                              getEventRsvpStatus(selectedEvent.id) === 'interested'
                                ? 'text-white'
                                : 'text-gold-700'
                            }`}
                          >
                            Interested
                          </Text>
                        </Pressable>
                        <Pressable
                          onPress={() => handleRsvpSelect('going')}
                          className={`flex-1 flex-row items-center justify-center py-3 rounded-xl ml-2 ${
                            getEventRsvpStatus(selectedEvent.id) === 'going'
                              ? 'bg-green-500'
                              : 'bg-green-50'
                          }`}
                        >
                          <CheckCircle
                            size={18}
                            color={getEventRsvpStatus(selectedEvent.id) === 'going' ? '#FFFFFF' : '#16a34a'}
                          />
                          <Text
                            className={`ml-2 font-semibold ${
                              getEventRsvpStatus(selectedEvent.id) === 'going'
                                ? 'text-white'
                                : 'text-green-600'
                            }`}
                          >
                            Going
                          </Text>
                        </Pressable>
                      </View>
                      {getEventRsvpStatus(selectedEvent.id) && (
                        <Text className="text-gray-500 text-sm text-center mt-3">
                          Tap again to remove your RSVP
                        </Text>
                      )}
                    </View>

                    {/* Description */}
                    <View className="mb-6">
                      <Text className="text-lg font-semibold text-warmBrown mb-2">
                        About This Event
                      </Text>
                      <Text className="text-gray-600 leading-6">
                        {selectedEvent.description}
                      </Text>
                    </View>

                    {/* Location */}
                    <View className="bg-white rounded-2xl p-4 mb-6">
                      <Text className="text-lg font-semibold text-warmBrown mb-2">
                        Location
                      </Text>
                      <View className="flex-row items-start">
                        <MapPin size={20} color="#C9A227" />
                        <Text className="text-gray-600 ml-2 flex-1">
                          {selectedEvent.address}
                        </Text>
                      </View>
                    </View>

                    {/* Contact */}
                    <View className="bg-white rounded-2xl p-4 mb-6">
                      <Text className="text-lg font-semibold text-warmBrown mb-3">
                        Contact Information
                      </Text>
                      {selectedEvent.contactPhone && (
                        <Pressable
                          onPress={() => handleCall(selectedEvent.contactPhone!)}
                          className="flex-row items-center mb-3"
                        >
                          <View className="bg-forest-50 rounded-full p-2">
                            <Phone size={18} color="#1B4D3E" />
                          </View>
                          <Text className="text-forest-700 ml-3 font-medium">
                            {selectedEvent.contactPhone}
                          </Text>
                        </Pressable>
                      )}
                      {selectedEvent.contactEmail && (
                        <Pressable
                          onPress={() => handleEmail(selectedEvent.contactEmail!)}
                          className="flex-row items-center"
                        >
                          <View className="bg-terracotta-50 rounded-full p-2">
                            <Mail size={18} color="#D4673A" />
                          </View>
                          <Text className="text-terracotta-500 ml-3 font-medium">
                            {selectedEvent.contactEmail}
                          </Text>
                        </Pressable>
                      )}
                    </View>

                    {/* Attendees */}
                    <View className="flex-row items-center mb-6">
                      <Users size={20} color="#8B7355" />
                      <Text className="text-gray-600 ml-2">
                        {selectedEvent.attendees} people attending
                      </Text>
                    </View>
                  </View>
                </ScrollView>

                {/* Bottom RSVP Summary */}
                <View className="px-5 py-4 border-t border-gray-100 bg-white">
                  {getEventRsvpStatus(selectedEvent.id) ? (
                    <View className="flex-row items-center justify-center py-4">
                      {getEventRsvpStatus(selectedEvent.id) === 'going' ? (
                        <>
                          <CheckCircle size={24} color="#16a34a" />
                          <Text className="text-green-600 font-bold text-lg ml-2">
                            You're going to this event!
                          </Text>
                        </>
                      ) : (
                        <>
                          <Star size={24} color="#C9A227" fill="#C9A227" />
                          <Text className="text-gold-700 font-bold text-lg ml-2">
                            You're interested in this event
                          </Text>
                        </>
                      )}
                    </View>
                  ) : (
                    <Text className="text-gray-500 text-center py-4">
                      Select "Interested" or "Going" above to RSVP
                    </Text>
                  )}
                </View>
              </SafeAreaView>
            </View>
          )}
        </Modal>
      </SafeAreaView>
    </View>
  );
}
