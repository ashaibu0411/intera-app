import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, Pressable, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Users,
  Heart,
  Briefcase,
  Sparkles,
  MapPin,
  Settings,
  Filter,
} from 'lucide-react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { NeighborCard } from '@/components/NeighborCard';
import { useStore, MOCK_USERS, type User } from '@/lib/store';

type LookingForFilter = 'all' | 'friends' | 'dating' | 'networking';

// Mock neighbor profiles for development
const MOCK_NEIGHBORS: Array<{
  user: User;
  lookingFor: 'friends' | 'dating' | 'networking' | 'all';
  aboutMe: string;
  lastActive: string;
}> = [
  {
    user: {
      id: 'n1',
      name: 'Adaeze Okoro',
      username: 'adaeze_o',
      avatar: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&h=400&fit=crop&crop=face',
      bio: 'Nigerian software engineer. Love exploring new cuisines and hiking trails.',
      location: 'Denver, CO',
      interests: ['Tech', 'Hiking', 'Food', 'Music'],
      joinedDate: '2024-06-15',
    },
    lookingFor: 'friends',
    aboutMe: 'New to Denver! Looking to meet fellow Africans who love outdoor adventures and good conversations over jollof rice 🍚',
    lastActive: '2024-12-30T14:00:00Z',
  },
  {
    user: {
      id: 'n2',
      name: 'Kofi Mensah',
      username: 'kofi_m',
      avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop&crop=face',
      bio: 'Ghanaian entrepreneur building the future of African fintech.',
      location: 'Aurora, CO',
      interests: ['Business', 'Tech', 'Networking', 'Basketball'],
      joinedDate: '2024-03-10',
    },
    lookingFor: 'networking',
    aboutMe: 'Building my second startup in the fintech space. Always looking to connect with ambitious professionals and potential collaborators.',
    lastActive: '2024-12-30T10:00:00Z',
  },
  {
    user: {
      id: 'n3',
      name: 'Amina Hassan',
      username: 'amina_h',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop&crop=face',
      bio: 'Somali-American doctor. Poetry lover and weekend painter.',
      location: 'Denver, CO',
      interests: ['Art', 'Poetry', 'Medicine', 'Travel'],
      joinedDate: '2024-01-20',
    },
    lookingFor: 'dating',
    aboutMe: 'Looking for someone who appreciates deep conversations, art galleries, and spontaneous adventures. Must love good food! 💫',
    lastActive: '2024-12-30T16:30:00Z',
  },
  {
    user: {
      id: 'n4',
      name: 'Emeka Nwosu',
      username: 'emeka_n',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face',
      bio: 'Igbo filmmaker. Creating stories that connect our diaspora.',
      location: 'Denver, CO',
      interests: ['Film', 'Culture', 'Storytelling', 'Photography'],
      joinedDate: '2024-05-08',
    },
    lookingFor: 'all',
    aboutMe: "Open to meeting new people - whether you're looking for friendship, professional connections, or something more. Let's create together!",
    lastActive: '2024-12-29T20:00:00Z',
  },
  {
    user: {
      id: 'n5',
      name: 'Fatou Diallo',
      username: 'fatou_d',
      avatar: 'https://images.unsplash.com/photo-1589156280159-27698a70f29e?w=400&h=400&fit=crop&crop=face',
      bio: 'Senegalese fashion designer bringing African prints to Colorado.',
      location: 'Boulder, CO',
      interests: ['Fashion', 'Design', 'Culture', 'Dance'],
      joinedDate: '2024-04-12',
    },
    lookingFor: 'friends',
    aboutMe: 'Looking for my tribe in Colorado! I host monthly African dance nights and love bringing people together through fashion and culture.',
    lastActive: '2024-12-30T08:00:00Z',
  },
];

const FILTER_OPTIONS: Array<{ key: LookingForFilter; label: string; icon: React.ElementType; color: string }> = [
  { key: 'all', label: 'All', icon: Sparkles, color: '#8B5CF6' },
  { key: 'friends', label: 'Friends', icon: Users, color: '#1B4D3E' },
  { key: 'dating', label: 'Dating', icon: Heart, color: '#D4673A' },
  { key: 'networking', label: 'Network', icon: Briefcase, color: '#C9A227' },
];

export default function ConnectScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<LookingForFilter>('all');

  const currentUser = useStore((s) => s.currentUser);
  const selectedLocation = useStore((s) => s.selectedLocation);
  const likedNeighbors = useStore((s) => s.likedNeighbors);
  const connectedNeighbors = useStore((s) => s.connectedNeighbors);
  const toggleLikeNeighbor = useStore((s) => s.toggleLikeNeighbor);
  const addConnectedNeighbor = useStore((s) => s.addConnectedNeighbor);
  const addConnection = useStore((s) => s.addConnection);

  const cityName = selectedLocation?.city || 'Denver';

  // Filter neighbors based on selected filter
  const filteredNeighbors = useMemo(() => {
    if (activeFilter === 'all') return MOCK_NEIGHBORS;
    return MOCK_NEIGHBORS.filter(
      (n) => n.lookingFor === activeFilter || n.lookingFor === 'all'
    );
  }, [activeFilter]);

  const onRefresh = async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Simulate refresh
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const handleFilterPress = (filter: LookingForFilter) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveFilter(filter);
  };

  const handleLike = (userId: string) => {
    toggleLikeNeighbor(userId);
  };

  const handleConnect = (neighbor: typeof MOCK_NEIGHBORS[0]) => {
    addConnectedNeighbor(neighbor.user.id);
    addConnection(neighbor.user);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleSetupProfile = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/connect-setup' as any);
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
              <Text className="text-3xl font-bold text-warmBrown">Connect</Text>
              <View className="flex-row items-center mt-1">
                <MapPin size={14} color="#D4673A" />
                <Text className="text-gray-500 ml-1">People near {cityName}</Text>
              </View>
            </View>

            <Pressable
              onPress={handleSetupProfile}
              className="bg-white rounded-full p-3 shadow-sm"
            >
              <Settings size={22} color="#1B4D3E" />
            </Pressable>
          </View>
        </Animated.View>

        {/* Filter Tabs */}
        <Animated.View
          entering={FadeInDown.duration(400).delay(200)}
          className="px-5 mb-4"
        >
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8 }}
            style={{ flexGrow: 0 }}
          >
            {FILTER_OPTIONS.map((option) => {
              const Icon = option.icon;
              const isActive = activeFilter === option.key;
              return (
                <Pressable
                  key={option.key}
                  onPress={() => handleFilterPress(option.key)}
                  className={`flex-row items-center px-4 py-2.5 rounded-full ${
                    isActive ? '' : 'bg-white'
                  }`}
                  style={isActive ? { backgroundColor: option.color } : undefined}
                >
                  <Icon size={16} color={isActive ? '#FFFFFF' : option.color} />
                  <Text
                    className={`ml-2 font-medium ${
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
          {/* Setup Profile CTA if not logged in or no neighbor profile */}
          {!currentUser && (
            <Animated.View
              entering={FadeInUp.duration(500).delay(250)}
              className="mx-4 mb-4"
            >
              <Pressable onPress={() => router.push('/signup' as any)}>
                <LinearGradient
                  colors={['#D4673A', '#B85430']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{ borderRadius: 16, padding: 20 }}
                >
                  <View className="flex-row items-center">
                    <View className="bg-white/20 rounded-full p-3">
                      <Users size={24} color="#FFFFFF" />
                    </View>
                    <View className="flex-1 ml-4">
                      <Text className="text-white font-bold text-lg">
                        Join to Connect
                      </Text>
                      <Text className="text-white/80 mt-1">
                        Create your profile to meet people in your neighborhood
                      </Text>
                    </View>
                  </View>
                </LinearGradient>
              </Pressable>
            </Animated.View>
          )}

          {/* Stats Card */}
          <Animated.View
            entering={FadeInUp.duration(500).delay(300)}
            className="mx-4 mb-4"
          >
            <View className="bg-white rounded-2xl p-4 shadow-sm">
              <View className="flex-row items-center justify-between">
                <View className="items-center flex-1">
                  <Text className="text-2xl font-bold text-terracotta-500">
                    {MOCK_NEIGHBORS.length}
                  </Text>
                  <Text className="text-gray-500 text-xs mt-1">Nearby</Text>
                </View>
                <View className="w-px h-8 bg-gray-200" />
                <View className="items-center flex-1">
                  <Text className="text-2xl font-bold text-forest-700">
                    {connectedNeighbors.length}
                  </Text>
                  <Text className="text-gray-500 text-xs mt-1">Connected</Text>
                </View>
                <View className="w-px h-8 bg-gray-200" />
                <View className="items-center flex-1">
                  <Text className="text-2xl font-bold text-gold-500">
                    {likedNeighbors.length}
                  </Text>
                  <Text className="text-gray-500 text-xs mt-1">Liked</Text>
                </View>
              </View>
            </View>
          </Animated.View>

          {/* Neighbor Cards */}
          {filteredNeighbors.length > 0 ? (
            filteredNeighbors.map((neighbor, index) => (
              <Animated.View
                key={neighbor.user.id}
                entering={FadeInUp.duration(400).delay(350 + index * 100)}
              >
                <NeighborCard
                  user={neighbor.user}
                  lookingFor={neighbor.lookingFor}
                  aboutMe={neighbor.aboutMe}
                  isLiked={likedNeighbors.includes(neighbor.user.id)}
                  isConnected={connectedNeighbors.includes(neighbor.user.id)}
                  onLike={() => handleLike(neighbor.user.id)}
                  onConnect={() => handleConnect(neighbor)}
                />
              </Animated.View>
            ))
          ) : (
            <View className="mx-4 py-12 items-center">
              <View className="bg-gray-100 rounded-full p-4 mb-4">
                <Filter size={32} color="#9CA3AF" />
              </View>
              <Text className="text-warmBrown font-semibold text-lg text-center">
                No matches found
              </Text>
              <Text className="text-gray-500 text-center mt-2">
                Try a different filter to see more people
              </Text>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
