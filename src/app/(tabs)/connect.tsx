import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, RefreshControl, TextInput, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import {
  Users,
  Heart,
  Briefcase,
  Sparkles,
  MapPin,
  Settings,
  Filter,
  Search,
  UserPlus,
  Check,
  Clock,
  MessageCircle,
  X,
} from 'lucide-react-native';
import Animated, { FadeInDown, FadeInUp, FadeIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { OpenConnectPanel } from '@/components/OpenConnectPanel';
import { useFocusEffect } from '@react-navigation/native';
import { useStore } from '@/lib/store';
import {
  getDiscoverableUsers,
  sendConnectionRequest,
  acceptConnectionRequest,
  rejectConnectionRequest,
  getPendingRequests,
  type UserWithConnectionStatus,
  type ConnectionStatus,
} from '@/lib/connections-api';
import { listAvailableTalkers, type TalkAvailability } from '@/lib/talkNow';
import { sendDirectPushAlert } from '@/lib/pushAlerts';

type LookingForFilter = 'all' | 'friends' | 'dating' | 'networking';

const FILTER_OPTIONS: Array<{ key: LookingForFilter; label: string; icon: React.ElementType; color: string }> = [
  { key: 'all', label: 'All', icon: Sparkles, color: '#8B5CF6' },
  { key: 'friends', label: 'Friends', icon: Users, color: '#1B4D3E' },
  { key: 'dating', label: 'Dating', icon: Heart, color: '#D4673A' },
  { key: 'networking', label: 'Network', icon: Briefcase, color: '#C9A227' },
];

interface ConnectionCardProps {
  user: UserWithConnectionStatus;
  onConnect: () => void;
  onAccept?: () => void;
  onReject?: () => void;
  isLoading?: boolean;
}

function ConnectionCard({ user, onConnect, onAccept, onReject, isLoading }: ConnectionCardProps) {
  const getStatusButton = () => {
    if (isLoading) {
      return (
        <View className="bg-gray-100 rounded-xl px-4 py-2">
          <ActivityIndicator size="small" color="#D4673A" />
        </View>
      );
    }

    switch (user.connectionStatus) {
      case 'connected':
        return (
          <Pressable
            onPress={() =>
              router.push({
                pathname: `/chat/${user.id}` as any,
                params: {
                  recipientId: user.id,
                  name: encodeURIComponent(user.name),
                  avatar: encodeURIComponent(user.avatar_url || ''),
                },
              })
            }
            className="bg-forest-600 rounded-xl px-4 py-2 flex-row items-center"
          >
            <MessageCircle size={16} color="#FFFFFF" />
            <Text className="text-white font-medium ml-1.5">Message</Text>
          </Pressable>
        );
      case 'pending_sent':
        return (
          <View className="bg-gray-100 rounded-xl px-4 py-2 flex-row items-center">
            <Clock size={16} color="#9CA3AF" />
            <Text className="text-gray-500 font-medium ml-1.5">Pending</Text>
          </View>
        );
      case 'pending_received':
        return (
          <View className="flex-row space-x-2">
            <Pressable
              onPress={onAccept}
              className="bg-forest-600 rounded-xl px-3 py-2 flex-row items-center"
            >
              <Check size={16} color="#FFFFFF" />
              <Text className="text-white font-medium ml-1">Accept</Text>
            </Pressable>
            <Pressable
              onPress={onReject}
              className="bg-gray-200 rounded-xl px-3 py-2"
            >
              <X size={16} color="#6B7280" />
            </Pressable>
          </View>
        );
      default:
        return (
          <Pressable
            onPress={onConnect}
            className="bg-terracotta-500 rounded-xl px-4 py-2 flex-row items-center"
          >
            <UserPlus size={16} color="#FFFFFF" />
            <Text className="text-white font-medium ml-1.5">Connect</Text>
          </Pressable>
        );
    }
  };

  return (
    <View className="bg-white rounded-2xl p-4 mx-4 mb-3 shadow-sm">
      <View className="flex-row items-start">
        <Pressable onPress={() => router.push(`/profile/${user.id}`)}>
          <Image
            source={{ uri: user.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop' }}
            style={{ width: 60, height: 60, borderRadius: 30 }}
            contentFit="cover"
          />
        </Pressable>

        <View className="flex-1 ml-3">
          <View className="flex-row items-center justify-between">
            <View className="flex-1">
              <Text className="text-warmBrown font-semibold text-base">{user.name}</Text>
              <Text className="text-gray-400 text-sm">@{user.username}</Text>
            </View>
            {getStatusButton()}
          </View>

          {user.location && (
            <View className="flex-row items-center mt-1.5">
              <MapPin size={12} color="#9CA3AF" />
              <Text className="text-gray-400 text-xs ml-1">{user.location}</Text>
            </View>
          )}
        </View>
      </View>

      {user.bio && (
        <Text className="text-gray-600 text-sm mt-3 leading-5" numberOfLines={2}>
          {user.bio}
        </Text>
      )}

      {user.interests && user.interests.length > 0 && (
        <View className="flex-row flex-wrap mt-3">
          {user.interests.slice(0, 4).map((interest) => (
            <View
              key={interest}
              className="bg-forest-50 rounded-full px-2.5 py-1 mr-2 mb-1"
            >
              <Text className="text-forest-700 text-xs">{interest}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

export default function ConnectScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<LookingForFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<UserWithConnectionStatus[]>([]);
  const [pendingRequests, setPendingRequests] = useState<{ connection: any; user: any }[]>([]);
  const [talkers, setTalkers] = useState<TalkAvailability[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingUserId, setLoadingUserId] = useState<string | null>(null);

  const currentUser = useStore((s) => s.currentUser);
  const selectedLocation = useStore((s) => s.selectedLocation);

  const cityName = selectedLocation?.city || 'Denver';

  const loadUsers = useCallback(async () => {
    if (!currentUser?.id) {
      setIsLoading(false);
      return;
    }

    try {
      console.log('[connect] Loading discoverable users...');
      const [fetchedUsers, pending, availableTalkers] = await Promise.all([
        getDiscoverableUsers(currentUser.id),
        getPendingRequests(currentUser.id),
        listAvailableTalkers(12).catch(() => [] as TalkAvailability[]),
      ]);
      console.log('[connect] Loaded', fetchedUsers.length, 'users,', pending.length, 'pending requests');
      setUsers(fetchedUsers);
      setPendingRequests(pending);
      setTalkers(availableTalkers);
    } catch (error) {
      console.error('[connect] Error loading users:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser?.id]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  useFocusEffect(
    useCallback(() => {
      if (currentUser?.id) {
        loadUsers();
      }
    }, [loadUsers, currentUser?.id])
  );

  // Filter users based on search and filter
  const filteredUsers = useMemo(() => {
    let result = users;

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (u) =>
          u.name.toLowerCase().includes(query) ||
          u.username.toLowerCase().includes(query) ||
          u.bio?.toLowerCase().includes(query)
      );
    }

    // Category filter (for now, just show all since we don't have lookingFor data)
    // In a real app, you'd filter by lookingFor field

    return result;
  }, [users, searchQuery, activeFilter]);

  const onRefresh = async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await loadUsers();
    setRefreshing(false);
  };

  const handleFilterPress = (filter: LookingForFilter) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveFilter(filter);
  };

  const handleConnect = async (userId: string) => {
    if (!currentUser?.id) return;

    setLoadingUserId(userId);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const result = await sendConnectionRequest(currentUser.id, userId);

    if (result.success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      // Notify the recipient (best-effort)
      sendDirectPushAlert({
        recipientUserId: userId,
        excludeUserId: currentUser.id,
        title: 'New connection request',
        body: `${currentUser.name || 'Someone'} wants to connect with you on Intera.`,
        data: {
          type: 'connection_request',
          requesterId: currentUser.id,
        },
      });
      // Update local state
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId ? { ...u, connectionStatus: 'pending_sent' as ConnectionStatus } : u
        )
      );
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }

    setLoadingUserId(null);
  };

  const handleAccept = async (connectionId: string, userId: string) => {
    setLoadingUserId(userId);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const result = await acceptConnectionRequest(connectionId);

    if (result.success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      // Update local state
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId ? { ...u, connectionStatus: 'connected' as ConnectionStatus } : u
        )
      );
      setPendingRequests((prev) => prev.filter((r) => r.connection.id !== connectionId));
    }

    setLoadingUserId(null);
  };

  const handleReject = async (connectionId: string, userId: string) => {
    setLoadingUserId(userId);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const result = await rejectConnectionRequest(connectionId);

    if (result.success) {
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId ? { ...u, connectionStatus: 'none' as ConnectionStatus } : u
        )
      );
      setPendingRequests((prev) => prev.filter((r) => r.connection.id !== connectionId));
    }

    setLoadingUserId(null);
  };

  const handleSetupProfile = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/connect-setup' as any);
  };

  const connectedCount = users.filter((u) => u.connectionStatus === 'connected').length;
  const pendingCount = pendingRequests.length;
  const talkNowCount = talkers.length;

  const params = useLocalSearchParams<{ openConnect?: string }>();
  const [connectSegment, setConnectSegment] = useState<'people' | 'open'>(
    () => (params.openConnect === '1' ? 'open' : 'people')
  );

  useEffect(() => {
    if (params.openConnect === '1') {
      setConnectSegment('open');
    }
  }, [params.openConnect]);

  return (
    <View className="flex-1 bg-cream">
      <SafeAreaView edges={['top']} className="flex-1">
        {/* Header */}
        <Animated.View
          entering={FadeInDown.duration(400).delay(100)}
          className="px-5 pt-2 pb-3"
        >
          <View className="flex-row items-center justify-between">
            <View className="flex-1">
              <Text className="text-3xl font-bold text-warmBrown">Connect</Text>
              {connectSegment === 'people' ? (
                <View className="flex-row items-center mt-1">
                  <MapPin size={14} color="#D4673A" />
                  <Text className="text-gray-500 ml-1">People near {cityName}</Text>
                </View>
              ) : (
                <Text className="text-gray-500 mt-1 text-sm">Lobby in your city & nearby posts</Text>
              )}
            </View>

            {connectSegment === 'people' ? (
              <Pressable
                onPress={handleSetupProfile}
                className="bg-white rounded-full p-3 shadow-sm"
              >
                <Settings size={22} color="#1B4D3E" />
              </Pressable>
            ) : null}
          </View>

          <View className="flex-row mt-4 p-1 rounded-xl bg-gray-100">
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setConnectSegment('people');
              }}
              className={`flex-1 py-2.5 rounded-lg items-center ${connectSegment === 'people' ? 'bg-white shadow-sm' : ''}`}
            >
              <Text
                className={`font-semibold ${connectSegment === 'people' ? 'text-warmBrown' : 'text-gray-500'}`}
              >
                People
              </Text>
            </Pressable>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setConnectSegment('open');
              }}
              className={`flex-1 py-2.5 rounded-lg items-center ${connectSegment === 'open' ? 'bg-white shadow-sm' : ''}`}
            >
              <Text
                className={`font-semibold ${connectSegment === 'open' ? 'text-warmBrown' : 'text-gray-500'}`}
              >
                Open to connect
              </Text>
            </Pressable>
          </View>
        </Animated.View>

        {connectSegment === 'people' ? (
          <>
        {/* Search Bar */}
        <Animated.View
          entering={FadeInDown.duration(400).delay(150)}
          className="px-5 mb-3"
        >
          <View className="bg-white rounded-xl flex-row items-center px-4 py-3 shadow-sm">
            <Search size={20} color="#9CA3AF" />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search people..."
              placeholderTextColor="#9CA3AF"
              className="flex-1 ml-3 text-warmBrown"
            />
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
          {/* Setup Profile CTA if not logged in */}
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
                    {users.length}
                  </Text>
                  <Text className="text-gray-500 text-xs mt-1">Nearby</Text>
                </View>
                <View className="w-px h-8 bg-gray-200" />
                <View className="items-center flex-1">
                  <Text className="text-2xl font-bold text-forest-700">
                    {connectedCount}
                  </Text>
                  <Text className="text-gray-500 text-xs mt-1">Connected</Text>
                </View>
                <View className="w-px h-8 bg-gray-200" />
                <View className="items-center flex-1">
                  <Text className="text-2xl font-bold text-gold-500">
                    {pendingCount}
                  </Text>
                  <Text className="text-gray-500 text-xs mt-1">Pending</Text>
                </View>
              </View>
            </View>
          </Animated.View>

          {/* Talk Now (instant, paid) */}
          <Animated.View entering={FadeInUp.duration(500).delay(320)} className="mx-4 mb-4">
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                router.push('/talk-to-someone' as any);
              }}
            >
              <LinearGradient
                colors={['#7C3AED', '#6D28D9', '#5B21B6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ borderRadius: 18, padding: 16 }}
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-1 pr-3">
                    <Text className="text-white font-bold text-lg">Talk Now</Text>
                    <Text className="text-white/80 mt-1">
                      Instant conversation with someone available now (gems/min).
                    </Text>
                    <Text className="text-white/70 mt-2 text-sm">
                      {talkNowCount > 0 ? `${talkNowCount} available right now` : 'No one is available right now — you can go available too.'}
                    </Text>
                  </View>
                  <View className="bg-white/15 rounded-2xl px-4 py-3">
                    <Text className="text-white font-semibold">Open</Text>
                  </View>
                </View>

                {talkers.length > 0 ? (
                  <View className="flex-row mt-4">
                    {talkers.slice(0, 5).map((t) => (
                      <View key={t.user_id} className="mr-2">
                        <Image
                          source={{ uri: t.profile?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&h=80&fit=crop' }}
                          style={{ width: 34, height: 34, borderRadius: 17, borderWidth: 2, borderColor: 'rgba(255,255,255,0.35)' }}
                          contentFit="cover"
                        />
                      </View>
                    ))}
                  </View>
                ) : null}
              </LinearGradient>
            </Pressable>
          </Animated.View>

          {/* Pending Requests Section */}
          {pendingRequests.length > 0 && (
            <Animated.View entering={FadeInUp.duration(400).delay(350)}>
              <Text className="text-lg font-semibold text-warmBrown px-5 mb-3">
                Connection Requests
              </Text>
              {pendingRequests.map((request, index) => (
                <Animated.View
                  key={request.connection.id}
                  entering={FadeInUp.duration(300).delay(400 + index * 50)}
                >
                  <ConnectionCard
                    user={{
                      ...request.user,
                      connectionStatus: 'pending_received' as ConnectionStatus,
                      connectionId: request.connection.id,
                    }}
                    onConnect={() => {}}
                    onAccept={() => handleAccept(request.connection.id, request.user.id)}
                    onReject={() => handleReject(request.connection.id, request.user.id)}
                    isLoading={loadingUserId === request.user.id}
                  />
                </Animated.View>
              ))}
            </Animated.View>
          )}

          {/* Loading State */}
          {isLoading ? (
            <View className="py-12 items-center">
              <ActivityIndicator size="large" color="#D4673A" />
              <Text className="text-gray-500 mt-4">Finding people nearby...</Text>
            </View>
          ) : filteredUsers.length > 0 ? (
            <>
              <Text className="text-lg font-semibold text-warmBrown px-5 mb-3 mt-2">
                People to Connect With
              </Text>
              {filteredUsers.map((user, index) => (
                <Animated.View
                  key={user.id}
                  entering={FadeInUp.duration(400).delay(350 + index * 100)}
                >
                  <ConnectionCard
                    user={user}
                    onConnect={() => handleConnect(user.id)}
                    onAccept={
                      user.connectionId
                        ? () => handleAccept(user.connectionId!, user.id)
                        : undefined
                    }
                    onReject={
                      user.connectionId
                        ? () => handleReject(user.connectionId!, user.id)
                        : undefined
                    }
                    isLoading={loadingUserId === user.id}
                  />
                </Animated.View>
              ))}
            </>
          ) : currentUser ? (
            <View className="mx-4 py-12 items-center">
              <View className="bg-gray-100 rounded-full p-4 mb-4">
                <Users size={32} color="#9CA3AF" />
              </View>
              <Text className="text-warmBrown font-semibold text-lg text-center">
                {searchQuery ? 'No matches found' : 'No people nearby yet'}
              </Text>
              <Text className="text-gray-500 text-center mt-2">
                {searchQuery
                  ? 'Try a different search term'
                  : 'Be the first to invite your friends!'}
              </Text>
            </View>
          ) : null}
        </ScrollView>
          </>
        ) : (
          <OpenConnectPanel />
        )}
      </SafeAreaView>
    </View>
  );
}
