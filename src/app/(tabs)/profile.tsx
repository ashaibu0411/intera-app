import React from 'react';
import { View, Text, ScrollView, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Settings, MapPin, Calendar, Edit3, Users, FileText, Bookmark, LogOut, Star, ChevronRight, Play, Briefcase, Plus, Store, Crown } from 'lucide-react-native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useStore, MOCK_USERS, MOCK_POSTS } from '@/lib/store';
import { signOut } from '@/lib/auth';
import { usePremium } from '@/hooks/usePremium';

export default function ProfileScreen() {
  const currentUser = useStore((s) => s.currentUser);
  const isGuest = useStore((s) => s.isGuest);
  const logout = useStore((s) => s.logout);
  const userCreatedPosts = useStore((s) => s.userPosts);
  const savedPostIds = useStore((s) => s.savedPostIds);
  const connections = useStore((s) => s.connections);
  const lifeEvents = useStore((s) => s.lifeEvents);
  const userBusinesses = useStore((s) => s.userBusinesses);
  const { isPremium, isEnabled: isPremiumEnabled } = usePremium();

  // Use current user if logged in, otherwise show mock user for guests
  const user = currentUser || MOCK_USERS[0];

  // Filter life events for current user
  const userLifeEvents = lifeEvents.filter((e) => e.userId === currentUser?.id);

  // Count posts from both user-created and mock posts
  const mockUserPosts = MOCK_POSTS.filter((p) => currentUser && p.author.id === currentUser.id);
  const totalPosts = userCreatedPosts.length + mockUserPosts.length;

  // Dynamic menu items with real counts
  const menuItems = [
    { id: 'posts', label: 'My Posts', icon: FileText, count: totalPosts, route: '/my-posts' },
    { id: 'saved', label: 'Saved', icon: Bookmark, count: savedPostIds.length, route: '/saved-posts' },
    { id: 'connections', label: 'Connections', icon: Users, count: connections.length, route: '/connections' },
  ];

  const handleMenuPress = (route: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(route as any);
  };

  const handleEditProfile = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (isGuest || !currentUser) {
      router.push('/signup');
    } else {
      router.push('/profile-setup');
    }
  };

  const handleLogout = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
              logout();
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              router.replace('/welcome');
            } catch (error) {
              console.error('Logout error:', error);
              // Still logout locally even if Supabase fails
              logout();
              router.replace('/welcome');
            }
          },
        },
      ]
    );
  };

  const handleSignUp = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/signup');
  };

  return (
    <View className="flex-1 bg-cream">
      <SafeAreaView edges={['top']} className="flex-1">
        {/* Header */}
        <Animated.View
          entering={FadeIn.duration(300)}
          className="flex-row items-center justify-between px-5 pt-4 pb-2"
        >
          <Text className="text-2xl font-bold text-warmBrown">Profile</Text>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/settings');
            }}
            className="p-2"
            hitSlop={8}
          >
            <Settings size={24} color="#2D1F1A" />
          </Pressable>
        </Animated.View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Guest Banner */}
          {(isGuest || !currentUser) && (
            <Animated.View
              entering={FadeInUp.duration(400).delay(50)}
              className="mx-5 mt-2 mb-4"
            >
              <Pressable onPress={handleSignUp}>
                <LinearGradient
                  colors={['#D4673A', '#B85430']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{ borderRadius: 16, padding: 16 }}
                >
                  <Text className="text-white font-bold text-lg">
                    Create Your Profile
                  </Text>
                  <Text className="text-white/80 text-sm mt-1">
                    Sign up to save your profile, post, and connect with others
                  </Text>
                </LinearGradient>
              </Pressable>
            </Animated.View>
          )}

          {/* Profile Card */}
          <Animated.View
            entering={FadeInUp.duration(400).delay(100)}
            className="mx-5 mt-2"
          >
            <LinearGradient
              colors={['#1B4D3E', '#153D31']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ borderRadius: 24, padding: 24 }}
            >
              <View className="flex-row items-center">
                <View className="relative">
                  <Image
                    source={{ uri: user.avatar }}
                    style={{ width: 80, height: 80, borderRadius: 40, borderWidth: 3, borderColor: '#FFFFFF' }}
                    contentFit="cover"
                  />
                  <Pressable
                    onPress={handleEditProfile}
                    className="absolute -bottom-1 -right-1 bg-terracotta-500 rounded-full p-2"
                  >
                    <Edit3 size={14} color="#FFFFFF" />
                  </Pressable>
                </View>

                <View className="flex-1 ml-4">
                  <View className="flex-row items-center">
                    <Text className="text-white text-xl font-bold">{user.name}</Text>
                    {isPremium && (
                      <View className="bg-gold-500 rounded-full p-1 ml-2">
                        <Crown size={12} color="#FFFFFF" />
                      </View>
                    )}
                  </View>
                  <Text className="text-white/70 text-sm">@{user.username}</Text>
                  <View className="flex-row items-center mt-2">
                    <MapPin size={14} color="#C9A227" />
                    <Text className="text-gold-400 text-sm ml-1">{user.location}</Text>
                  </View>
                </View>
              </View>

              {user.bio ? (
                <Text className="text-white/90 mt-4 leading-5">{user.bio}</Text>
              ) : (
                <Pressable onPress={handleEditProfile}>
                  <Text className="text-white/50 mt-4 leading-5 italic">
                    Tap to add a bio...
                  </Text>
                </Pressable>
              )}

              <View className="flex-row items-center mt-4">
                <Calendar size={14} color="#FFFFFF70" />
                <Text className="text-white/60 text-sm ml-2">
                  Joined {new Date(user.joinedDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </Text>
              </View>

              {/* Interests */}
              {user.interests && user.interests.length > 0 && (
                <View className="flex-row flex-wrap mt-4">
                  {user.interests.map((interest) => (
                    <View
                      key={interest}
                      className="bg-white/20 rounded-full px-3 py-1.5 mr-2 mb-2"
                    >
                      <Text className="text-white text-sm">{interest}</Text>
                    </View>
                  ))}
                </View>
              )}
            </LinearGradient>
          </Animated.View>

          {/* Premium Section */}
          {currentUser && !isGuest && (
            <Animated.View
              entering={FadeInUp.duration(400).delay(150)}
              className="mx-5 mt-4"
            >
              {isPremium ? (
                <View className="bg-gradient-to-r from-gold-100 to-gold-50 rounded-2xl overflow-hidden">
                  <LinearGradient
                    colors={['#FEF3C7', '#FDE68A']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{ borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center' }}
                  >
                    <View className="bg-gold-500 rounded-full p-2.5">
                      <Crown size={20} color="#FFFFFF" />
                    </View>
                    <View className="flex-1 ml-3">
                      <Text className="text-warmBrown font-bold text-base">Premium Member</Text>
                      <Text className="text-warmBrown/70 text-sm">You have access to all premium features</Text>
                    </View>
                    <View className="bg-gold-500 rounded-full px-3 py-1">
                      <Text className="text-white font-semibold text-xs">Active</Text>
                    </View>
                  </LinearGradient>
                </View>
              ) : isPremiumEnabled ? (
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    router.push('/paywall');
                  }}
                >
                  <LinearGradient
                    colors={['#C9A227', '#92740C']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{ borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center' }}
                  >
                    <View className="bg-white/20 rounded-full p-2.5">
                      <Crown size={20} color="#FFFFFF" />
                    </View>
                    <View className="flex-1 ml-3">
                      <Text className="text-white font-bold text-base">Go Premium</Text>
                      <Text className="text-white/80 text-sm">Get verified badge, unlimited posts & more</Text>
                    </View>
                    <ChevronRight size={20} color="#FFFFFF" />
                  </LinearGradient>
                </Pressable>
              ) : null}
            </Animated.View>
          )}

          {/* Stats */}
          <Animated.View
            entering={FadeInUp.duration(400).delay(200)}
            className="flex-row mx-5 mt-4"
          >
            <View className="flex-1 bg-white rounded-2xl p-4 mr-2 items-center shadow-sm">
              <Text className="text-2xl font-bold text-terracotta-500">{totalPosts}</Text>
              <Text className="text-gray-500 text-sm mt-1">Posts</Text>
            </View>
            <View className="flex-1 bg-white rounded-2xl p-4 mx-1 items-center shadow-sm">
              <Text className="text-2xl font-bold text-forest-700">{connections.length}</Text>
              <Text className="text-gray-500 text-sm mt-1">Connections</Text>
            </View>
            <View className="flex-1 bg-white rounded-2xl p-4 ml-2 items-center shadow-sm">
              <Text className="text-2xl font-bold text-gold-500">{savedPostIds.length}</Text>
              <Text className="text-gray-500 text-sm mt-1">Saved</Text>
            </View>
          </Animated.View>

          {/* Menu Items */}
          <Animated.View
            entering={FadeInUp.duration(400).delay(300)}
            className="mx-5 mt-6"
          >
            <Text className="text-lg font-semibold text-warmBrown mb-3">Activity</Text>
            {menuItems.map((item, index) => (
              <Animated.View
                key={item.id}
                entering={FadeInUp.duration(300).delay(350 + index * 50)}
              >
                <Pressable
                  onPress={() => handleMenuPress(item.route)}
                  className="flex-row items-center bg-white rounded-2xl p-4 mb-3 shadow-sm"
                >
                  <View className="bg-terracotta-50 rounded-full p-3">
                    <item.icon size={20} color="#D4673A" />
                  </View>
                  <Text className="flex-1 text-warmBrown font-medium ml-3">{item.label}</Text>
                  <View className="bg-gray-100 rounded-full px-3 py-1">
                    <Text className="text-gray-600 font-medium">{item.count}</Text>
                  </View>
                </Pressable>
              </Animated.View>
            ))}
          </Animated.View>

          {/* Life Events Section */}
          <Animated.View
            entering={FadeInUp.duration(400).delay(400)}
            className="mx-5 mt-6"
          >
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-lg font-semibold text-warmBrown">Life Events</Text>
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push('/life-events');
                }}
                className="flex-row items-center"
              >
                <Text className="text-terracotta-500 font-medium mr-1">View All</Text>
                <ChevronRight size={16} color="#D4673A" />
              </Pressable>
            </View>

            {userLifeEvents.length > 0 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }}>
                {userLifeEvents.slice(0, 5).map((event, index) => (
                  <Pressable
                    key={event.id}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      router.push('/life-events');
                    }}
                    className="mr-3"
                    style={{ width: 140 }}
                  >
                    <View className="bg-white rounded-2xl overflow-hidden shadow-sm">
                      {event.images.length > 0 ? (
                        <Image
                          source={{ uri: event.images[0] }}
                          style={{ width: 140, height: 100 }}
                          contentFit="cover"
                        />
                      ) : event.video ? (
                        <View className="w-full h-[100px] bg-gray-900 items-center justify-center">
                          <Play size={24} color="#FFFFFF" fill="#FFFFFF" />
                        </View>
                      ) : (
                        <View className="w-full h-[100px] bg-terracotta-100 items-center justify-center">
                          <Star size={24} color="#D4673A" />
                        </View>
                      )}
                      <View className="p-3">
                        <Text className="text-warmBrown font-semibold text-sm" numberOfLines={1}>
                          {event.title}
                        </Text>
                        <Text className="text-gray-500 text-xs mt-1 capitalize">
                          {event.category}
                        </Text>
                      </View>
                    </View>
                  </Pressable>
                ))}
                {/* Add More Card */}
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    router.push('/life-events');
                  }}
                  className="mr-3"
                  style={{ width: 140 }}
                >
                  <View className="bg-terracotta-50 rounded-2xl h-[168px] items-center justify-center border-2 border-dashed border-terracotta-200">
                    <View className="bg-terracotta-100 rounded-full p-3 mb-2">
                      <Star size={20} color="#D4673A" />
                    </View>
                    <Text className="text-terracotta-500 font-medium text-sm">Add Event</Text>
                  </View>
                </Pressable>
              </ScrollView>
            ) : (
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push('/life-events');
                }}
              >
                <LinearGradient
                  colors={['#FEF3C7', '#FDE68A']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{ borderRadius: 16, padding: 20 }}
                >
                  <View className="flex-row items-center">
                    <View className="bg-gold-500 rounded-full p-3">
                      <Star size={24} color="#FFFFFF" />
                    </View>
                    <View className="flex-1 ml-4">
                      <Text className="text-warmBrown font-bold">Share Your Milestones</Text>
                      <Text className="text-warmBrown/70 text-sm mt-1">
                        Document weddings, graduations, new babies & more
                      </Text>
                    </View>
                    <ChevronRight size={20} color="#92400E" />
                  </View>
                </LinearGradient>
              </Pressable>
            )}
          </Animated.View>

          {/* My Businesses Section */}
          <Animated.View
            entering={FadeInUp.duration(400).delay(450)}
            className="mx-5 mt-6"
          >
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-lg font-semibold text-warmBrown">My Businesses</Text>
              {userBusinesses.length > 0 && (
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    router.push('/my-businesses');
                  }}
                  className="flex-row items-center"
                >
                  <Text className="text-forest-600 font-medium mr-1">View All</Text>
                  <ChevronRight size={16} color="#1B4D3E" />
                </Pressable>
              )}
            </View>

            {userBusinesses.length > 0 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }}>
                {userBusinesses.slice(0, 5).map((business) => (
                  <Pressable
                    key={business.id}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      router.push('/my-businesses');
                    }}
                    className="mr-3"
                    style={{ width: 160 }}
                  >
                    <View className="bg-white rounded-2xl overflow-hidden shadow-sm">
                      <Image
                        source={{ uri: business.image }}
                        style={{ width: 160, height: 100 }}
                        contentFit="cover"
                      />
                      <View className="p-3">
                        <Text className="text-warmBrown font-semibold text-sm" numberOfLines={1}>
                          {business.name}
                        </Text>
                        <Text className="text-gray-500 text-xs mt-1">
                          {business.category}
                        </Text>
                        {business.isVerified && (
                          <View className="flex-row items-center mt-1">
                            <View className="bg-forest-100 rounded-full px-2 py-0.5">
                              <Text className="text-forest-700 text-xs font-medium">Verified</Text>
                            </View>
                          </View>
                        )}
                      </View>
                    </View>
                  </Pressable>
                ))}
                {/* Add More Business Card */}
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    router.push('/register-business');
                  }}
                  className="mr-3"
                  style={{ width: 160 }}
                >
                  <View className="bg-forest-50 rounded-2xl h-[168px] items-center justify-center border-2 border-dashed border-forest-200">
                    <View className="bg-forest-100 rounded-full p-3 mb-2">
                      <Plus size={20} color="#1B4D3E" />
                    </View>
                    <Text className="text-forest-700 font-medium text-sm">Add Business</Text>
                  </View>
                </Pressable>
              </ScrollView>
            ) : (
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push('/register-business');
                }}
              >
                <LinearGradient
                  colors={['#1B4D3E', '#153D31']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{ borderRadius: 16, padding: 20 }}
                >
                  <View className="flex-row items-center">
                    <View className="bg-white/20 rounded-full p-3">
                      <Store size={24} color="#FFFFFF" />
                    </View>
                    <View className="flex-1 ml-4">
                      <Text className="text-white font-bold">Add Your Business</Text>
                      <Text className="text-white/70 text-sm mt-1">
                        List your African-owned business in our directory
                      </Text>
                    </View>
                    <ChevronRight size={20} color="#FFFFFF" />
                  </View>
                </LinearGradient>
              </Pressable>
            )}
          </Animated.View>

          {/* Logout / Sign Up */}
          <Animated.View
            entering={FadeInUp.duration(400).delay(500)}
            className="mx-5 mt-4 mb-8"
          >
            {isGuest || !currentUser ? (
              <Pressable
                onPress={handleSignUp}
                className="flex-row items-center justify-center bg-terracotta-50 rounded-2xl p-4"
              >
                <Text className="text-terracotta-500 font-medium">Sign Up to Save Profile</Text>
              </Pressable>
            ) : (
              <Pressable
                onPress={handleLogout}
                className="flex-row items-center justify-center bg-red-50 rounded-2xl p-4"
              >
                <LogOut size={20} color="#EF4444" />
                <Text className="text-red-500 font-medium ml-2">Sign Out</Text>
              </Pressable>
            )}
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
