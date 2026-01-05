import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Image,
  RefreshControl,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeInDown,
  FadeInUp,
  FadeIn,
  SlideInRight,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import {
  Radio,
  Play,
  Pause,
  Heart,
  Users,
  Clock,
  Calendar,
  ChevronRight,
  X,
  Send,
  Volume2,
  VolumeX,
  MessageCircle,
  Share2,
  Bell,
  Mic,
  Music,
  Headphones,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useStore } from '@/lib/store';
import {
  getAllStations,
  getLiveStations,
  getStation,
  getPopularStations,
  getUpcomingShows,
  toggleFollowStation,
  isFollowingStation,
  formatBroadcastDuration,
  getDayName,
  GENRE_CONFIG,
  RadioStation,
  RadioGenre,
  RadioScheduleItem,
} from '@/lib/radioService';

const GENRE_TABS: { id: RadioGenre | 'all'; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'afrobeats', label: '🎵 Afrobeats' },
  { id: 'gospel', label: '🙏 Gospel' },
  { id: 'talk', label: '🎙️ Talk' },
  { id: 'culture', label: '🌍 Culture' },
  { id: 'sports', label: '⚽ Sports' },
];

// Pulsing animation for live indicator
function PulsingDot() {
  const opacity = useSharedValue(1);

  React.useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.3, { duration: 800, easing: Easing.ease }),
        withTiming(1, { duration: 800, easing: Easing.ease })
      ),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#EF4444' }, animatedStyle]}
    />
  );
}

// Single animated bar component
function AnimatedBar({ barValue }: { barValue: Animated.SharedValue<number> }) {
  const animatedStyle = useAnimatedStyle(() => ({
    height: barValue.value * 24,
  }));

  return (
    <Animated.View
      style={[{ width: 3, backgroundColor: '#F59E0B', borderRadius: 2 }, animatedStyle]}
    />
  );
}

// Audio wave animation
function AudioWave({ isPlaying }: { isPlaying: boolean }) {
  const bar0 = useSharedValue(0.3);
  const bar1 = useSharedValue(0.6);
  const bar2 = useSharedValue(0.4);
  const bar3 = useSharedValue(0.8);
  const bar4 = useSharedValue(0.5);

  const bars = [bar0, bar1, bar2, bar3, bar4];

  React.useEffect(() => {
    if (isPlaying) {
      bars.forEach((bar, i) => {
        bar.value = withRepeat(
          withSequence(
            withTiming(Math.random() * 0.7 + 0.3, { duration: 300 + i * 100 }),
            withTiming(Math.random() * 0.7 + 0.3, { duration: 300 + i * 100 })
          ),
          -1,
          true
        );
      });
    } else {
      bars.forEach((bar) => {
        bar.value = withTiming(0.2, { duration: 300 });
      });
    }
  }, [isPlaying]);

  return (
    <View className="flex-row items-end h-6" style={{ gap: 2 }}>
      <AnimatedBar barValue={bar0} />
      <AnimatedBar barValue={bar1} />
      <AnimatedBar barValue={bar2} />
      <AnimatedBar barValue={bar3} />
      <AnimatedBar barValue={bar4} />
    </View>
  );
}

export default function LiveRadioScreen() {
  const currentUser = useStore(s => s.currentUser);
  const [selectedGenre, setSelectedGenre] = useState<RadioGenre | 'all'>('all');
  const [stations, setStations] = useState<RadioStation[]>([]);
  const [liveStations, setLiveStations] = useState<RadioStation[]>([]);
  const [popularStations, setPopularStations] = useState<RadioStation[]>([]);
  const [upcomingShows, setUpcomingShows] = useState<{station: RadioStation; show: RadioScheduleItem}[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Player state
  const [currentStation, setCurrentStation] = useState<RadioStation | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [messages, setMessages] = useState<{id: string; sender: string; text: string; isDJ?: boolean}[]>([
    { id: '1', sender: 'DJ Afrowave', text: 'Welcome to the show! Drop your song requests! 🎵', isDJ: true },
    { id: '2', sender: 'Kwame', text: 'Play some Burna Boy!' },
    { id: '3', sender: 'Amara', text: 'This beat is fire 🔥' },
    { id: '4', sender: 'DJ Afrowave', text: 'Got you! City Boys coming up next', isDJ: true },
  ]);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [allStations, live, popular, upcoming] = await Promise.all([
        getAllStations(),
        getLiveStations(),
        getPopularStations(5),
        getUpcomingShows(),
      ]);

      let filtered = allStations;
      if (selectedGenre !== 'all') {
        filtered = allStations.filter(s => s.genre === selectedGenre);
      }

      setStations(filtered);
      setLiveStations(live);
      setPopularStations(popular);
      setUpcomingShows(upcoming);
    } catch (error) {
      console.error('Error loading radio data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedGenre]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const handleTuneIn = async (station: RadioStation) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setCurrentStation(station);
    setIsPlaying(true);

    const following = await isFollowingStation(station.id);
    setIsFollowing(following);
  };

  const handleToggleFollow = async () => {
    if (!currentStation) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newFollowState = await toggleFollowStation(currentStation.id);
    setIsFollowing(newFollowState);
  };

  const handleSendMessage = () => {
    if (!chatMessage.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    setMessages(prev => [
      ...prev,
      {
        id: Date.now().toString(),
        sender: currentUser?.name || 'You',
        text: chatMessage.trim(),
      },
    ]);
    setChatMessage('');
  };

  return (
    <View className="flex-1 bg-gray-950">
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <LinearGradient
        colors={['#7C3AED', '#4C1D95']}
        style={{ paddingTop: 60, paddingBottom: 16, paddingHorizontal: 20 }}
      >
        <View className="flex-row items-center justify-between mb-4">
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.back();
            }}
          >
            <Text className="text-purple-200 text-base">← Back</Text>
          </Pressable>
        </View>

        <View className="flex-row items-center">
          <Radio size={28} color="#F59E0B" />
          <View className="ml-3">
            <Text className="text-white text-2xl font-bold">Live Radio</Text>
            <Text className="text-purple-200 text-sm">Tune in to community broadcasts</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Genre Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="bg-gray-900 py-3"
        contentContainerStyle={{ paddingHorizontal: 16 }}
      >
        {GENRE_TABS.map((genre) => (
          <Pressable
            key={genre.id}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setSelectedGenre(genre.id);
            }}
            className={`px-4 py-2 rounded-full mr-2 ${
              selectedGenre === genre.id ? 'bg-purple-600' : 'bg-gray-800'
            }`}
          >
            <Text
              className={`font-semibold ${
                selectedGenre === genre.id ? 'text-white' : 'text-gray-400'
              }`}
            >
              {genre.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#A855F7" />}
      >
        {/* Live Now Section */}
        {liveStations.length > 0 && selectedGenre === 'all' && (
          <View className="p-4">
            <View className="flex-row items-center mb-3">
              <PulsingDot />
              <Text className="text-red-400 font-bold text-lg ml-2">LIVE NOW</Text>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingRight: 16 }}
            >
              {liveStations.map((station, index) => (
                <Animated.View
                  key={station.id}
                  entering={SlideInRight.delay(index * 100)}
                >
                  <Pressable
                    onPress={() => handleTuneIn(station)}
                    className="bg-gray-800 rounded-2xl mr-3 overflow-hidden"
                    style={{ width: 200 }}
                  >
                    {station.coverImage && (
                      <Image
                        source={{ uri: station.coverImage }}
                        className="w-full h-28"
                        resizeMode="cover"
                      />
                    )}
                    <LinearGradient
                      colors={['transparent', 'rgba(0,0,0,0.9)']}
                      style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 112 }}
                    />

                    <View className="absolute top-2 left-2 flex-row items-center bg-red-500 px-2 py-1 rounded-full">
                      <View className="w-2 h-2 bg-white rounded-full mr-1" />
                      <Text className="text-white text-xs font-bold">LIVE</Text>
                    </View>

                    <View className="p-3">
                      <Text className="text-white font-bold" numberOfLines={1}>
                        {station.stationName}
                      </Text>
                      <Text className="text-gray-400 text-sm" numberOfLines={1}>
                        {station.hostName}
                      </Text>

                      <View className="flex-row items-center justify-between mt-2">
                        <View className="flex-row items-center">
                          <Users size={12} color="#9CA3AF" />
                          <Text className="text-gray-400 text-xs ml-1">
                            {station.listenerCount}
                          </Text>
                        </View>

                        <View
                          className="px-2 py-1 rounded-full"
                          style={{ backgroundColor: GENRE_CONFIG[station.genre].bgColor }}
                        >
                          <Text
                            className="text-xs font-semibold capitalize"
                            style={{ color: GENRE_CONFIG[station.genre].color }}
                          >
                            {station.genre}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </Pressable>
                </Animated.View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Popular Stations */}
        {selectedGenre === 'all' && (
          <View className="p-4">
            <Text className="text-gray-400 font-bold text-lg mb-3">Popular Stations</Text>

            {popularStations.map((station, index) => (
              <Animated.View
                key={station.id}
                entering={FadeInDown.delay(index * 80)}
              >
                <Pressable
                  onPress={() => handleTuneIn(station)}
                  className="bg-gray-800 rounded-xl p-3 mb-3 flex-row items-center"
                >
                  <Image
                    source={{ uri: station.hostAvatar }}
                    className="w-14 h-14 rounded-xl"
                  />

                  <View className="flex-1 ml-3">
                    <View className="flex-row items-center">
                      <Text className="text-white font-bold" numberOfLines={1}>
                        {station.stationName}
                      </Text>
                      {station.isLive && (
                        <View className="ml-2 w-2 h-2 bg-red-500 rounded-full" />
                      )}
                    </View>
                    <Text className="text-gray-400 text-sm">{station.hostName}</Text>
                    <View className="flex-row items-center mt-1">
                      <Heart size={12} color="#9CA3AF" fill="#9CA3AF" />
                      <Text className="text-gray-500 text-xs ml-1">
                        {station.followers.toLocaleString()} followers
                      </Text>
                    </View>
                  </View>

                  <View className="items-end">
                    <View
                      className="px-2 py-1 rounded-full mb-1"
                      style={{ backgroundColor: GENRE_CONFIG[station.genre].bgColor }}
                    >
                      <Text style={{ color: GENRE_CONFIG[station.genre].color }}>
                        {GENRE_CONFIG[station.genre].emoji}
                      </Text>
                    </View>
                    {station.isLive ? (
                      <Text className="text-red-400 text-xs font-semibold">LIVE</Text>
                    ) : (
                      <Text className="text-gray-500 text-xs">Offline</Text>
                    )}
                  </View>
                </Pressable>
              </Animated.View>
            ))}
          </View>
        )}

        {/* Upcoming Shows */}
        {selectedGenre === 'all' && upcomingShows.length > 0 && (
          <View className="p-4">
            <Text className="text-gray-400 font-bold text-lg mb-3">Upcoming Shows</Text>

            {upcomingShows.map(({ station, show }, index) => (
              <Animated.View
                key={show.id}
                entering={FadeInDown.delay(index * 80)}
              >
                <Pressable className="bg-gray-800 rounded-xl p-4 mb-3 border border-gray-700">
                  <View className="flex-row items-center justify-between mb-2">
                    <Text className="text-white font-bold">{show.showName}</Text>
                    <View className="flex-row items-center">
                      <Calendar size={12} color="#9CA3AF" />
                      <Text className="text-gray-400 text-xs ml-1">
                        {getDayName(show.dayOfWeek)}
                      </Text>
                    </View>
                  </View>

                  <Text className="text-gray-400 text-sm">{station.stationName}</Text>

                  <View className="flex-row items-center justify-between mt-3">
                    <View className="flex-row items-center">
                      <Clock size={14} color="#A855F7" />
                      <Text className="text-purple-400 font-semibold ml-1">
                        {show.startTime} - {show.endTime}
                      </Text>
                    </View>

                    <Pressable className="bg-purple-600 px-3 py-1 rounded-full flex-row items-center">
                      <Bell size={12} color="#FFFFFF" />
                      <Text className="text-white text-xs font-semibold ml-1">Remind</Text>
                    </Pressable>
                  </View>
                </Pressable>
              </Animated.View>
            ))}
          </View>
        )}

        {/* All Stations by Genre */}
        {selectedGenre !== 'all' && (
          <View className="p-4">
            <Text className="text-gray-400 font-bold text-lg mb-3 capitalize">
              {selectedGenre} Stations
            </Text>

            {stations.length === 0 ? (
              <View className="items-center py-12">
                <Radio size={48} color="#4B5563" />
                <Text className="text-gray-500 text-center mt-4">
                  No stations in this category yet
                </Text>
              </View>
            ) : (
              stations.map((station, index) => (
                <Animated.View
                  key={station.id}
                  entering={FadeInDown.delay(index * 80)}
                >
                  <Pressable
                    onPress={() => handleTuneIn(station)}
                    className="bg-gray-800 rounded-xl p-4 mb-3"
                  >
                    <View className="flex-row items-start">
                      <Image
                        source={{ uri: station.hostAvatar }}
                        className="w-16 h-16 rounded-xl"
                      />

                      <View className="flex-1 ml-3">
                        <View className="flex-row items-center">
                          <Text className="text-white font-bold flex-1" numberOfLines={1}>
                            {station.stationName}
                          </Text>
                          {station.isLive && (
                            <View className="bg-red-500 px-2 py-0.5 rounded-full flex-row items-center">
                              <View className="w-1.5 h-1.5 bg-white rounded-full mr-1" />
                              <Text className="text-white text-xs font-bold">LIVE</Text>
                            </View>
                          )}
                        </View>

                        <Text className="text-gray-400 text-sm">{station.hostName}</Text>
                        <Text className="text-gray-500 text-xs mt-1" numberOfLines={2}>
                          {station.description}
                        </Text>

                        <View className="flex-row items-center mt-2">
                          {station.isLive && (
                            <View className="flex-row items-center mr-4">
                              <Users size={12} color="#9CA3AF" />
                              <Text className="text-gray-400 text-xs ml-1">
                                {station.listenerCount} listening
                              </Text>
                            </View>
                          )}
                          <View className="flex-row items-center">
                            <Heart size={12} color="#9CA3AF" />
                            <Text className="text-gray-400 text-xs ml-1">
                              {station.followers}
                            </Text>
                          </View>
                        </View>
                      </View>
                    </View>
                  </Pressable>
                </Animated.View>
              ))
            )}
          </View>
        )}

        {/* Start Your Own Station CTA */}
        <Animated.View entering={FadeInUp.delay(300)} className="p-4">
          <LinearGradient
            colors={['#7C3AED', '#4C1D95']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ borderRadius: 16, padding: 20 }}
          >
            <View className="flex-row items-center">
              <View className="w-14 h-14 bg-white/20 rounded-full items-center justify-center">
                <Mic size={28} color="#FFFFFF" />
              </View>
              <View className="flex-1 ml-4">
                <Text className="text-white font-bold text-lg">Start Broadcasting</Text>
                <Text className="text-purple-200 text-sm">
                  Go live from anywhere! Share music, talk shows, or community content.
                </Text>
              </View>
            </View>

            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                Alert.alert(
                  'Coming Soon!',
                  'Live radio broadcasting is coming soon! You\'ll be able to create your own station and broadcast to the community.',
                  [{ text: 'OK', style: 'default' }]
                );
              }}
              className="bg-white mt-4 py-3 rounded-xl"
            >
              <Text className="text-purple-600 text-center font-bold">
                Create Your Station
              </Text>
            </Pressable>
          </LinearGradient>
        </Animated.View>

        <View className="h-32" />
      </ScrollView>

      {/* Mini Player */}
      {currentStation && (
        <Animated.View
          entering={FadeInUp.duration(300)}
          className="absolute bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800"
        >
          <Pressable
            onPress={() => setShowChat(true)}
            className="p-4"
          >
            <View className="flex-row items-center">
              <Image
                source={{ uri: currentStation.hostAvatar }}
                className="w-12 h-12 rounded-xl"
              />

              <View className="flex-1 ml-3">
                <View className="flex-row items-center">
                  <Text className="text-white font-bold" numberOfLines={1}>
                    {currentStation.stationName}
                  </Text>
                  <View className="ml-2 w-2 h-2 bg-red-500 rounded-full" />
                </View>
                <Text className="text-gray-400 text-sm" numberOfLines={1}>
                  {currentStation.currentTrack || currentStation.currentShow}
                </Text>
              </View>

              <View className="flex-row items-center">
                <AudioWave isPlaying={isPlaying} />

                <Pressable
                  onPress={() => setIsMuted(!isMuted)}
                  className="w-10 h-10 items-center justify-center ml-2"
                >
                  {isMuted ? (
                    <VolumeX size={20} color="#9CA3AF" />
                  ) : (
                    <Volume2 size={20} color="#F59E0B" />
                  )}
                </Pressable>

                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    setIsPlaying(!isPlaying);
                  }}
                  className="w-12 h-12 bg-purple-600 rounded-full items-center justify-center ml-2"
                >
                  {isPlaying ? (
                    <Pause size={20} color="#FFFFFF" fill="#FFFFFF" />
                  ) : (
                    <Play size={20} color="#FFFFFF" fill="#FFFFFF" />
                  )}
                </Pressable>
              </View>
            </View>
          </Pressable>
        </Animated.View>
      )}

      {/* Full Player / Chat Modal */}
      <Modal
        visible={showChat}
        animationType="slide"
        onRequestClose={() => setShowChat(false)}
      >
        {currentStation && (
          <View className="flex-1 bg-gray-950">
            {/* Station Header */}
            <LinearGradient
              colors={['#7C3AED', '#4C1D95']}
              style={{ paddingTop: 60, paddingBottom: 24, paddingHorizontal: 20 }}
            >
              <View className="flex-row items-center justify-between mb-4">
                <Pressable
                  onPress={() => setShowChat(false)}
                  className="w-10 h-10 bg-white/20 rounded-full items-center justify-center"
                >
                  <X size={20} color="#FFFFFF" />
                </Pressable>

                <Pressable
                  onPress={handleToggleFollow}
                  className={`px-4 py-2 rounded-full flex-row items-center ${
                    isFollowing ? 'bg-white' : 'bg-white/20'
                  }`}
                >
                  <Heart
                    size={16}
                    color={isFollowing ? '#7C3AED' : '#FFFFFF'}
                    fill={isFollowing ? '#7C3AED' : 'transparent'}
                  />
                  <Text
                    className={`ml-1 font-semibold ${
                      isFollowing ? 'text-purple-600' : 'text-white'
                    }`}
                  >
                    {isFollowing ? 'Following' : 'Follow'}
                  </Text>
                </Pressable>
              </View>

              <View className="items-center">
                <Image
                  source={{ uri: currentStation.hostAvatar }}
                  className="w-24 h-24 rounded-2xl mb-3"
                />
                <Text className="text-white text-xl font-bold">
                  {currentStation.stationName}
                </Text>
                <Text className="text-purple-200">{currentStation.hostName}</Text>

                <View className="flex-row items-center mt-3">
                  <View className="flex-row items-center bg-white/20 px-3 py-1 rounded-full mr-2">
                    <Users size={14} color="#FFFFFF" />
                    <Text className="text-white font-semibold ml-1">
                      {currentStation.listenerCount}
                    </Text>
                  </View>
                  <View className="flex-row items-center bg-red-500 px-3 py-1 rounded-full">
                    <View className="w-2 h-2 bg-white rounded-full mr-1" />
                    <Text className="text-white font-semibold text-sm">LIVE</Text>
                  </View>
                </View>

                {currentStation.currentTrack && (
                  <View className="flex-row items-center mt-4 bg-black/30 px-4 py-2 rounded-full">
                    <Music size={14} color="#F59E0B" />
                    <Text className="text-amber-400 ml-2 font-medium">
                      {currentStation.currentTrack}
                    </Text>
                  </View>
                )}
              </View>
            </LinearGradient>

            {/* Live Chat */}
            <View className="flex-1 p-4">
              <View className="flex-row items-center mb-3">
                <MessageCircle size={18} color="#9CA3AF" />
                <Text className="text-gray-400 font-semibold ml-2">Live Chat</Text>
              </View>

              <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                {messages.map((msg) => (
                  <View
                    key={msg.id}
                    className={`mb-3 ${msg.isDJ ? 'bg-purple-900/30 p-3 rounded-xl' : ''}`}
                  >
                    <View className="flex-row items-center">
                      <Text
                        className={`font-semibold ${
                          msg.isDJ ? 'text-purple-400' : 'text-gray-400'
                        }`}
                      >
                        {msg.sender}
                      </Text>
                      {msg.isDJ && (
                        <View className="bg-purple-500 px-2 py-0.5 rounded-full ml-2">
                          <Text className="text-white text-xs font-bold">DJ</Text>
                        </View>
                      )}
                    </View>
                    <Text className="text-white mt-1">{msg.text}</Text>
                  </View>
                ))}
              </ScrollView>

              {/* Chat Input */}
              <View className="flex-row items-center bg-gray-800 rounded-full px-4 py-2 mt-4">
                <TextInput
                  value={chatMessage}
                  onChangeText={setChatMessage}
                  placeholder="Say something..."
                  placeholderTextColor="#6B7280"
                  className="flex-1 text-white"
                />
                <Pressable
                  onPress={handleSendMessage}
                  className="w-10 h-10 bg-purple-600 rounded-full items-center justify-center ml-2"
                >
                  <Send size={18} color="#FFFFFF" />
                </Pressable>
              </View>
            </View>

            {/* Controls */}
            <View className="p-4 bg-gray-900 border-t border-gray-800">
              <View className="flex-row items-center justify-center">
                <Pressable
                  onPress={() => setIsMuted(!isMuted)}
                  className="w-14 h-14 bg-gray-800 rounded-full items-center justify-center mx-4"
                >
                  {isMuted ? (
                    <VolumeX size={24} color="#9CA3AF" />
                  ) : (
                    <Volume2 size={24} color="#FFFFFF" />
                  )}
                </Pressable>

                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                    setIsPlaying(!isPlaying);
                  }}
                  className="w-16 h-16 bg-purple-600 rounded-full items-center justify-center mx-4"
                >
                  {isPlaying ? (
                    <Pause size={28} color="#FFFFFF" fill="#FFFFFF" />
                  ) : (
                    <Play size={28} color="#FFFFFF" fill="#FFFFFF" />
                  )}
                </Pressable>

                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    // Share functionality
                  }}
                  className="w-14 h-14 bg-gray-800 rounded-full items-center justify-center mx-4"
                >
                  <Share2 size={24} color="#FFFFFF" />
                </Pressable>
              </View>
            </View>
          </View>
        )}
      </Modal>
    </View>
  );
}
