import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, Alert, Modal, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Users,
  MoreHorizontal,
  Ban,
  Flag,
  MessageCircle,
  UserPlus,
  UserMinus,
  X,
  AlertTriangle,
  Shield,
  Circle,
} from 'lucide-react-native';
import Animated, { FadeIn, FadeInUp, SlideInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import * as DropdownMenu from 'zeego/dropdown-menu';
import { useStore, MOCK_USERS, MOCK_POSTS, type User } from '@/lib/store';
import { reportBlockedUser } from '@/lib/reports';
import { StoryAvatar } from '@/components/StoryAvatar';
import { RoleBadges, HelperBadge } from '@/components/RoleBadge';
import { PostCard } from '@/components/PostCard';
import type { ViolationType } from '@/lib/contentModeration';
import { supabase, DbUser } from '@/lib/supabase';
import { getPostsByUser } from '@/lib/posts';
import type { Post } from '@/lib/store';

// Report reasons for App Store Guideline 1.2 compliance
const REPORT_REASONS: { id: ViolationType | 'other'; label: string; description: string }[] = [
  { id: 'harassment', label: 'Harassment or Bullying', description: 'Targeting, intimidating, or threatening behavior' },
  { id: 'hate_speech', label: 'Hate Speech', description: 'Content promoting discrimination or hatred' },
  { id: 'sexual', label: 'Sexual Content', description: 'Inappropriate sexual content or solicitation' },
  { id: 'violence', label: 'Violence or Threats', description: 'Threatening violence or glorifying harm' },
  { id: 'scam', label: 'Scam or Fraud', description: 'Deceptive behavior or fraudulent activity' },
  { id: 'spam', label: 'Spam', description: 'Repetitive, unwanted, or misleading content' },
  { id: 'other', label: 'Other', description: 'Other violation of community guidelines' },
];

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const currentUser = useStore((s) => s.currentUser);
  const connections = useStore((s) => s.connections);
  const addConnection = useStore((s) => s.addConnection);
  const removeConnection = useStore((s) => s.removeConnection);
  const blockUser = useStore((s) => s.blockUser);
  const isUserBlocked = useStore((s) => s.isUserBlocked);
  const blockedUserIds = useStore((s) => s.blockedUserIds);
  const userPosts = useStore((s) => s.userPosts);

  const [showReportModal, setShowReportModal] = useState(false);
  const [reportStep, setReportStep] = useState<'reason' | 'confirm' | 'done'>('reason');
  const [selectedReason, setSelectedReason] = useState<ViolationType | 'other' | null>(null);
  const [showBlockConfirmModal, setShowBlockConfirmModal] = useState(false);
  const [dbUser, setDbUser] = useState<DbUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dbPosts, setDbPosts] = useState<Post[]>([]);

  // Fetch user from database
  useEffect(() => {
    const fetchUser = async () => {
      if (!id) return;

      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', id)
          .single();

        if (!error && data) {
          setDbUser(data);
        }

        // Also fetch user's posts from database
        const posts = await getPostsByUser(id);
        setDbPosts(posts as Post[]);
      } catch (err) {
        console.log('[Profile] Error fetching user:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, [id]);

  // Find the user by ID from MOCK_USERS, connections, or database
  const user = useMemo(() => {
    // Check mock users first
    const mockUser = MOCK_USERS.find((u) => u.id === id);
    if (mockUser) return mockUser;

    // Check connections
    const connectionUser = connections.find((u) => u.id === id);
    if (connectionUser) return connectionUser;

    // Use database user if found
    if (dbUser) {
      // Convert DbUser to User format
      return {
        id: dbUser.id,
        name: dbUser.name,
        username: dbUser.username,
        avatar: dbUser.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop&crop=face',
        bio: dbUser.bio || '',
        location: dbUser.location || 'Unknown',
        interests: dbUser.interests || [],
        joinedDate: dbUser.created_at,
        isOnline: dbUser.is_online,
        showOnlineStatus: dbUser.show_online_status,
      } as User;
    }

    // Fallback to a default user for display purposes
    return null;
  }, [id, connections, dbUser]);

  // Check if this user is blocked
  const isBlocked = useMemo(() => {
    return blockedUserIds.includes(id || '');
  }, [blockedUserIds, id]);

  // Check if connected
  const isConnected = useMemo(() => {
    return connections.some((c) => c.id === id);
  }, [connections, id]);

  // Get user's posts (filtering out blocked user content)
  const userPostsList = useMemo(() => {
    if (!user || isBlocked) return [];

    const mockUserPosts = MOCK_POSTS.filter((p) => p.author.id === id);
    const createdUserPosts = userPosts.filter((p) => p.author.id === id);

    // Combine all posts and remove duplicates by id
    const allPosts = [...dbPosts, ...createdUserPosts, ...mockUserPosts];
    const uniquePosts = allPosts.filter(
      (post, index, self) => index === self.findIndex((p) => p.id === post.id)
    );

    return uniquePosts
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 20);
  }, [user, id, userPosts, isBlocked, dbPosts]);

  if (isLoading) {
    return (
      <View className="flex-1 bg-cream items-center justify-center">
        <ActivityIndicator size="large" color="#C45C26" />
        <Text className="text-gray-500 mt-3">Loading profile...</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <View className="flex-1 bg-cream items-center justify-center">
        <Text className="text-gray-500">User not found</Text>
        <Pressable
          onPress={() => router.back()}
          className="mt-4 bg-terracotta-500 rounded-full px-6 py-3"
        >
          <Text className="text-white font-medium">Go Back</Text>
        </Pressable>
      </View>
    );
  }

  // If the user is blocked, show blocked state
  if (isBlocked) {
    return (
      <View className="flex-1 bg-cream">
        <SafeAreaView edges={['top']} className="flex-1">
          {/* Header */}
          <Animated.View
            entering={FadeIn.duration(300)}
            className="flex-row items-center px-5 pt-4 pb-4"
          >
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.back();
              }}
              className="mr-4 p-1"
              hitSlop={8}
            >
              <ArrowLeft size={24} color="#2D1F1A" />
            </Pressable>
            <Text className="text-xl font-bold text-warmBrown flex-1">Profile</Text>
          </Animated.View>

          <View className="flex-1 items-center justify-center px-8">
            <View className="bg-red-100 rounded-full p-6 mb-4">
              <Ban size={48} color="#EF4444" />
            </View>
            <Text className="text-xl font-bold text-warmBrown text-center">User Blocked</Text>
            <Text className="text-gray-500 text-center mt-2">
              You have blocked this user. Their content is hidden from your feed.
            </Text>
            <Text className="text-gray-400 text-sm text-center mt-4">
              You can unblock them in Settings &gt; Privacy &amp; Safety &gt; Blocked Users
            </Text>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push('/settings');
              }}
              className="mt-6 bg-gray-100 rounded-full px-6 py-3"
            >
              <Text className="text-warmBrown font-medium">Go to Settings</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  const handleConnect = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (isConnected) {
      removeConnection(user.id);
    } else {
      addConnection(user);
    }
  };

  const handleMessage = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/chat/${user.id}` as any);
  };

  const handleBlockUser = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowBlockConfirmModal(true);
  };

  const confirmBlockUser = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Block the user - this automatically reports to moderation (App Store Guideline 1.2)
    blockUser(user.id, user.name, user.avatar);

    setShowBlockConfirmModal(false);

    // Show confirmation and navigate back
    Alert.alert(
      'User Blocked',
      `${user.name} has been blocked and reported to our moderation team. You won't see their content anymore.`,
      [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]
    );
  };

  const handleReportUser = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setReportStep('reason');
    setSelectedReason(null);
    setShowReportModal(true);
  };

  const submitReport = async () => {
    if (!selectedReason || !currentUser?.id) return;

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Report the user to moderation
    await reportBlockedUser(currentUser.id, user.id, user.name);

    setReportStep('done');

    // Auto-close after 2 seconds
    setTimeout(() => {
      setShowReportModal(false);
      setReportStep('reason');
      setSelectedReason(null);
    }, 2000);
  };

  return (
    <View className="flex-1 bg-cream">
      <SafeAreaView edges={['top']} className="flex-1">
        {/* Header */}
        <Animated.View
          entering={FadeIn.duration(300)}
          className="flex-row items-center px-5 pt-4 pb-4"
        >
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.back();
            }}
            className="mr-4 p-1"
            hitSlop={8}
          >
            <ArrowLeft size={24} color="#2D1F1A" />
          </Pressable>
          <Text className="text-xl font-bold text-warmBrown flex-1">{user.name}</Text>

          {/* More Options Menu */}
          {currentUser?.id !== user.id && (
            <DropdownMenu.Root>
              <DropdownMenu.Trigger>
                <Pressable className="p-2" hitSlop={8}>
                  <MoreHorizontal size={24} color="#2D1F1A" />
                </Pressable>
              </DropdownMenu.Trigger>
              <DropdownMenu.Content>
                <DropdownMenu.Item key="report" onSelect={handleReportUser}>
                  <DropdownMenu.ItemIcon ios={{ name: 'flag' }} />
                  <DropdownMenu.ItemTitle>Report User</DropdownMenu.ItemTitle>
                </DropdownMenu.Item>
                <DropdownMenu.Item key="block" onSelect={handleBlockUser} destructive>
                  <DropdownMenu.ItemIcon ios={{ name: 'nosign' }} />
                  <DropdownMenu.ItemTitle>Block User</DropdownMenu.ItemTitle>
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Root>
          )}
        </Animated.View>

        <ScrollView showsVerticalScrollIndicator={false}>
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
              <View className="items-center">
                <StoryAvatar
                  userId={user.id}
                  avatarUrl={user.avatar}
                  size={100}
                  showRing={true}
                />

                <Text className="text-white text-2xl font-bold mt-4">{user.name}</Text>
                <Text className="text-white/70 text-sm">@{user.username}</Text>

                {/* Online Status Badge */}
                {(user as any).isOnline && (user as any).showOnlineStatus !== false && (
                  <View className="flex-row items-center mt-2 bg-green-500/20 px-3 py-1 rounded-full">
                    <Circle size={8} color="#22C55E" fill="#22C55E" />
                    <Text className="text-green-400 text-sm font-medium ml-1.5">Online now</Text>
                  </View>
                )}

                {/* Helper Badge */}
                {user.isHelper && (
                  <View className="mt-2">
                    <HelperBadge size="small" />
                  </View>
                )}

                <View className="flex-row items-center mt-3">
                  <MapPin size={14} color="#C9A227" />
                  <Text className="text-gold-400 text-sm ml-1">{user.location}</Text>
                </View>
              </View>

              {user.bio && (
                <Text className="text-white/90 mt-4 leading-5 text-center">{user.bio}</Text>
              )}

              <View className="flex-row items-center justify-center mt-4">
                <Calendar size={14} color="#FFFFFF70" />
                <Text className="text-white/60 text-sm ml-2">
                  Joined {new Date(user.joinedDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </Text>
              </View>

              {/* Interests */}
              {user.interests && user.interests.length > 0 && (
                <View className="flex-row flex-wrap justify-center mt-4">
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

              {/* Community Roles */}
              {user.communityRoles && user.communityRoles.length > 0 && (
                <View className="mt-4 pt-4 border-t border-white/20">
                  <Text className="text-white/70 text-sm mb-2 text-center">Community Roles</Text>
                  <View className="items-center">
                    <RoleBadges roles={user.communityRoles} maxDisplay={4} size="small" />
                  </View>
                </View>
              )}
            </LinearGradient>
          </Animated.View>

          {/* Action Buttons */}
          {currentUser?.id !== user.id && (
            <Animated.View
              entering={FadeInUp.duration(400).delay(200)}
              className="flex-row mx-5 mt-4"
            >
              <Pressable
                onPress={handleConnect}
                className={`flex-1 flex-row items-center justify-center rounded-2xl py-3.5 mr-2 ${
                  isConnected ? 'bg-gray-200' : 'bg-terracotta-500'
                }`}
              >
                {isConnected ? (
                  <>
                    <UserMinus size={18} color="#6B7280" />
                    <Text className="text-gray-600 font-semibold ml-2">Connected</Text>
                  </>
                ) : (
                  <>
                    <UserPlus size={18} color="#FFFFFF" />
                    <Text className="text-white font-semibold ml-2">Connect</Text>
                  </>
                )}
              </Pressable>

              <Pressable
                onPress={handleMessage}
                className="flex-1 flex-row items-center justify-center bg-forest-600 rounded-2xl py-3.5 ml-2"
              >
                <MessageCircle size={18} color="#FFFFFF" />
                <Text className="text-white font-semibold ml-2">Message</Text>
              </Pressable>
            </Animated.View>
          )}

          {/* Block & Report Quick Actions */}
          {currentUser?.id !== user.id && (
            <Animated.View
              entering={FadeInUp.duration(400).delay(250)}
              className="flex-row mx-5 mt-3"
            >
              <Pressable
                onPress={handleReportUser}
                className="flex-1 flex-row items-center justify-center bg-amber-50 rounded-xl py-3 mr-2"
              >
                <Flag size={16} color="#D97706" />
                <Text className="text-amber-700 font-medium ml-2 text-sm">Report</Text>
              </Pressable>

              <Pressable
                onPress={handleBlockUser}
                className="flex-1 flex-row items-center justify-center bg-red-50 rounded-xl py-3 ml-2"
              >
                <Ban size={16} color="#DC2626" />
                <Text className="text-red-600 font-medium ml-2 text-sm">Block</Text>
              </Pressable>
            </Animated.View>
          )}

          {/* Safety Notice */}
          {currentUser?.id !== user.id && (
            <Animated.View
              entering={FadeInUp.duration(400).delay(275)}
              className="mx-5 mt-3"
            >
              <View className="flex-row items-start bg-blue-50 rounded-xl p-3">
                <Shield size={16} color="#3B82F6" className="mt-0.5" />
                <Text className="flex-1 text-blue-700 text-xs ml-2">
                  If this user is harassing you or posting inappropriate content, please use the Block or Report buttons. Blocking will immediately hide their content from your feed and notify our moderation team.
                </Text>
              </View>
            </Animated.View>
          )}

          {/* User's Posts */}
          {userPostsList.length > 0 && (
            <Animated.View
              entering={FadeInUp.duration(400).delay(300)}
              className="mt-6"
            >
              <Text className="text-lg font-semibold text-warmBrown mx-5 mb-3">Posts</Text>
              {userPostsList.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </Animated.View>
          )}

          {userPostsList.length === 0 && (
            <Animated.View
              entering={FadeInUp.duration(400).delay(300)}
              className="mx-5 mt-6 items-center py-8"
            >
              <View className="bg-gray-100 rounded-full p-4 mb-3">
                <Users size={32} color="#9CA3AF" />
              </View>
              <Text className="text-gray-500">No posts yet</Text>
            </Animated.View>
          )}

          <View className="h-8" />
        </ScrollView>
      </SafeAreaView>

      {/* Block Confirmation Modal */}
      <Modal
        visible={showBlockConfirmModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowBlockConfirmModal(false)}
      >
        <Pressable
          className="flex-1 bg-black/50 justify-center items-center px-6"
          onPress={() => setShowBlockConfirmModal(false)}
        >
          <Animated.View
            entering={SlideInUp.duration(300)}
            className="bg-white rounded-3xl w-full max-w-sm overflow-hidden"
          >
            <Pressable onPress={(e) => e.stopPropagation()}>
              <View className="items-center pt-6 pb-4 px-6">
                <View className="bg-red-100 rounded-full p-4 mb-4">
                  <Ban size={32} color="#DC2626" />
                </View>
                <Text className="text-xl font-bold text-warmBrown text-center">
                  Block {user.name}?
                </Text>
                <Text className="text-gray-500 text-center mt-2 leading-5">
                  When you block someone:
                </Text>
                <View className="mt-3 w-full">
                  <Text className="text-gray-600 text-sm mb-1">• You won't see their posts or comments</Text>
                  <Text className="text-gray-600 text-sm mb-1">• They won't be able to message you</Text>
                  <Text className="text-gray-600 text-sm mb-1">• Their content is removed from your feed instantly</Text>
                  <Text className="text-gray-600 text-sm">• Our team will be notified to review their account</Text>
                </View>
              </View>

              <View className="border-t border-gray-100 flex-row">
                <Pressable
                  onPress={() => setShowBlockConfirmModal(false)}
                  className="flex-1 py-4 border-r border-gray-100"
                >
                  <Text className="text-center font-semibold text-gray-600">Cancel</Text>
                </Pressable>
                <Pressable
                  onPress={confirmBlockUser}
                  className="flex-1 py-4"
                >
                  <Text className="text-center font-semibold text-red-600">Block</Text>
                </Pressable>
              </View>
            </Pressable>
          </Animated.View>
        </Pressable>
      </Modal>

      {/* Report Modal */}
      <Modal
        visible={showReportModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowReportModal(false)}
      >
        <View className="flex-1 bg-black/50">
          <Pressable
            className="flex-1"
            onPress={() => setShowReportModal(false)}
          />
          <Animated.View
            entering={SlideInUp.duration(300)}
            className="bg-white rounded-t-3xl max-h-[80%]"
          >
            {/* Modal Header */}
            <View className="flex-row items-center justify-between px-5 pt-5 pb-3 border-b border-gray-100">
              <Text className="text-lg font-bold text-warmBrown">
                {reportStep === 'done' ? 'Report Submitted' : 'Report User'}
              </Text>
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setShowReportModal(false);
                }}
                className="p-1"
                hitSlop={8}
              >
                <X size={24} color="#6B7280" />
              </Pressable>
            </View>

            {/* Content */}
            <ScrollView className="px-5 py-4" showsVerticalScrollIndicator={false}>
              {reportStep === 'reason' && (
                <>
                  <Text className="text-gray-600 mb-4">
                    Why are you reporting {user.name}? This will help our moderation team review the report.
                  </Text>

                  {REPORT_REASONS.map((reason) => (
                    <Pressable
                      key={reason.id}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setSelectedReason(reason.id);
                        setReportStep('confirm');
                      }}
                      className="flex-row items-center py-4 border-b border-gray-100"
                    >
                      <View className="flex-1">
                        <Text className="text-warmBrown font-medium">{reason.label}</Text>
                        <Text className="text-gray-500 text-sm mt-0.5">{reason.description}</Text>
                      </View>
                    </Pressable>
                  ))}

                  <View className="flex-row items-start bg-amber-50 rounded-xl p-3 mt-4">
                    <AlertTriangle size={16} color="#D97706" className="mt-0.5" />
                    <Text className="flex-1 text-amber-700 text-xs ml-2">
                      False reports may result in your account being restricted. Please only report genuine violations.
                    </Text>
                  </View>
                </>
              )}

              {reportStep === 'confirm' && (
                <View className="items-center py-4">
                  <View className="bg-amber-100 rounded-full p-4 mb-4">
                    <Flag size={32} color="#D97706" />
                  </View>
                  <Text className="text-lg font-bold text-warmBrown text-center">
                    Confirm Report
                  </Text>
                  <Text className="text-gray-500 text-center mt-2">
                    You're reporting {user.name} for:
                  </Text>
                  <View className="bg-gray-100 rounded-xl px-4 py-2 mt-3">
                    <Text className="text-warmBrown font-medium">
                      {REPORT_REASONS.find((r) => r.id === selectedReason)?.label}
                    </Text>
                  </View>
                  <Text className="text-gray-400 text-sm text-center mt-4">
                    Our moderation team will review this report and take appropriate action.
                  </Text>

                  <View className="flex-row mt-6 w-full">
                    <Pressable
                      onPress={() => setReportStep('reason')}
                      className="flex-1 bg-gray-100 rounded-xl py-3 mr-2"
                    >
                      <Text className="text-gray-600 font-medium text-center">Back</Text>
                    </Pressable>
                    <Pressable
                      onPress={submitReport}
                      className="flex-1 bg-amber-500 rounded-xl py-3 ml-2"
                    >
                      <Text className="text-white font-medium text-center">Submit Report</Text>
                    </Pressable>
                  </View>
                </View>
              )}

              {reportStep === 'done' && (
                <View className="items-center py-8">
                  <View className="bg-green-100 rounded-full p-4 mb-4">
                    <Shield size={32} color="#22C55E" />
                  </View>
                  <Text className="text-lg font-bold text-warmBrown text-center">
                    Thank You
                  </Text>
                  <Text className="text-gray-500 text-center mt-2">
                    Your report has been submitted. Our team will review it and take action if needed.
                  </Text>
                </View>
              )}
            </ScrollView>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}
