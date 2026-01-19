import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  Modal,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import {
  ChevronLeft,
  Users,
  Mail,
  Bell,
  BellOff,
  Search,
  Settings,
  MessageCircle,
  ChevronRight,
  Plus,
  Heart,
  Send,
  ImageIcon,
  Calendar,
  MapPin,
  Clock,
  Globe,
  Lock,
  Phone,
  X,
  MoreHorizontal,
  Pin,
  Trash2,
  FileText,
} from 'lucide-react-native';
import { useStore } from '@/lib/store';
import type { DbGroup, DbGroupPost, DbGroupEvent, DbGroupAlbum, DbGroupFile, DbGroupMember } from '@/lib/supabase';

type GroupTab = 'home' | 'posts' | 'events' | 'albums';

// Mock data for demonstration (will be replaced with real API calls)
const MOCK_GROUP: DbGroup = {
  id: 'mock-group-1',
  creator_id: 'user-1',
  name: 'Praying for the City of Aurora',
  description: 'A community dedicated to prayer and fellowship. Join us as we lift up our city in prayer and support one another through faith.',
  image_url: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&h=400&fit=crop',
  cover_url: 'https://images.unsplash.com/photo-1438232992991-995b7058bbb3?w=1200&h=600&fit=crop',
  category: 'church',
  faith_type: 'Christian',
  visibility: 'public',
  country: 'USA',
  admin_area: 'Colorado',
  city: 'Aurora',
  neighborhood: null,
  location_label: 'Aurora, Colorado',
  contact_phone: '+1 (555) 123-4567',
  contact_email: 'prayer@aurorachurch.org',
  website: 'https://aurorachurch.org',
  member_count: 127,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const MOCK_POSTS: DbGroupPost[] = [
  {
    id: 'post-1',
    group_id: 'mock-group-1',
    author_id: 'user-1',
    content: 'Welcome to our prayer community! Feel free to share prayer requests and testimonies here. We are here to support each other.',
    images: [],
    is_notice: true,
    is_pinned: true,
    likes_count: 24,
    comments_count: 8,
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    updated_at: new Date().toISOString(),
    author: {
      id: 'user-1',
      email: 'admin@example.com',
      phone: null,
      name: 'Pastor James',
      username: 'pastorjames',
      avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop',
      bio: 'Lead Pastor',
      location: 'Aurora, CO',
      interests: [],
      created_at: new Date().toISOString(),
    },
  },
  {
    id: 'post-2',
    group_id: 'mock-group-1',
    author_id: 'user-2',
    content: 'Please pray for my family as we navigate a difficult season. Thank you all for your continued support and love.',
    images: [],
    is_notice: false,
    is_pinned: false,
    likes_count: 15,
    comments_count: 12,
    created_at: new Date(Date.now() - 86400000).toISOString(),
    updated_at: new Date().toISOString(),
    author: {
      id: 'user-2',
      email: 'member@example.com',
      phone: null,
      name: 'Sarah Mitchell',
      username: 'sarahm',
      avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop',
      bio: null,
      location: 'Aurora, CO',
      interests: [],
      created_at: new Date().toISOString(),
    },
  },
];

const MOCK_EVENTS: DbGroupEvent[] = [
  {
    id: 'event-1',
    group_id: 'mock-group-1',
    creator_id: 'user-1',
    title: 'Sunday Prayer Service',
    description: 'Join us for our weekly prayer service',
    date: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
    time: '10:00 AM',
    end_time: '12:00 PM',
    location: 'Main Chapel',
    address: '123 Faith Street, Aurora, CO',
    image: null,
    attendees_count: 45,
    created_at: new Date().toISOString(),
  },
];

const MOCK_ALBUMS: DbGroupAlbum[] = [
  {
    id: 'album-1',
    group_id: 'mock-group-1',
    creator_id: 'user-1',
    name: 'Community Events 2024',
    description: 'Photos from our community gatherings',
    cover_url: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=600&h=400&fit=crop',
    photo_count: 24,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'album-2',
    group_id: 'mock-group-1',
    creator_id: 'user-1',
    name: 'Prayer Meetings',
    description: 'Moments from our prayer sessions',
    cover_url: 'https://images.unsplash.com/photo-1476234251651-f353703a034d?w=600&h=400&fit=crop',
    photo_count: 18,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const MOCK_FILES: DbGroupFile[] = [];

const MOCK_MEMBERS: DbGroupMember[] = [
  {
    id: 'member-1',
    group_id: 'mock-group-1',
    user_id: 'user-1',
    role: 'admin',
    joined_at: new Date().toISOString(),
    user: MOCK_POSTS[0].author,
  },
];

export default function GroupDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<GroupTab>('home');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [group, setGroup] = useState<DbGroup | null>(null);
  const [posts, setPosts] = useState<DbGroupPost[]>([]);
  const [events, setEvents] = useState<DbGroupEvent[]>([]);
  const [albums, setAlbums] = useState<DbGroupAlbum[]>([]);
  const [files, setFiles] = useState<DbGroupFile[]>([]);
  const [members, setMembers] = useState<DbGroupMember[]>([]);
  const [isMember, setIsMember] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [showPostModal, setShowPostModal] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostImages, setNewPostImages] = useState<string[]>([]);
  const [isPostingPost, setIsPostingPost] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);

  const currentUser = useStore((s) => s.currentUser);
  const isGuest = useStore((s) => s.isGuest);

  const loadGroupData = useCallback(async () => {
    try {
      // In real implementation, fetch from API
      // const groupData = await getGroup(id);
      // const postsData = await getGroupPosts(id);
      // etc.

      // For now, use mock data
      setGroup(MOCK_GROUP);
      setPosts(MOCK_POSTS);
      setEvents(MOCK_EVENTS);
      setAlbums(MOCK_ALBUMS);
      setFiles(MOCK_FILES);
      setMembers(MOCK_MEMBERS);

      // Check if current user is member/admin
      if (currentUser) {
        const membership = MOCK_MEMBERS.find((m) => m.user_id === currentUser.id);
        setIsMember(!!membership);
        setIsAdmin(membership?.role === 'admin');
      }
    } catch (error) {
      console.error('Error loading group:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [id, currentUser]);

  useEffect(() => {
    loadGroupData();
  }, [loadGroupData]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadGroupData();
  };

  const handleJoinGroup = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (isGuest || !currentUser) {
      router.push('/signup');
      return;
    }

    // In real implementation, call joinGroup API
    setIsMember(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleLeaveGroup = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    Alert.alert('Leave Group', 'Are you sure you want to leave this group?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Leave',
        style: 'destructive',
        onPress: () => {
          setIsMember(false);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        },
      },
    ]);
  };

  const handleToggleNotifications = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setNotificationsEnabled(!notificationsEnabled);
  };

  const handlePickImages = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
      selectionLimit: 4,
    });

    if (!result.canceled) {
      setNewPostImages(result.assets.map((a) => a.uri));
    }
  };

  const handleCreatePost = async () => {
    if (!newPostContent.trim() || isPostingPost) return;

    setIsPostingPost(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      // In real implementation, call createGroupPost API
      const newPost: DbGroupPost = {
        id: `post-${Date.now()}`,
        group_id: group?.id || '',
        author_id: currentUser?.id || '',
        content: newPostContent,
        images: newPostImages,
        is_notice: false,
        is_pinned: false,
        likes_count: 0,
        comments_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        author: currentUser ? {
          id: currentUser.id,
          email: currentUser.email || null,
          phone: currentUser.phone || null,
          name: currentUser.name,
          username: currentUser.username,
          avatar_url: currentUser.avatar || null,
          bio: currentUser.bio || null,
          location: currentUser.location || null,
          interests: currentUser.interests || [],
          created_at: currentUser.joinedDate,
        } : undefined,
      };

      setPosts([newPost, ...posts]);
      setNewPostContent('');
      setNewPostImages([]);
      setShowPostModal(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('Error creating post:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsPostingPost(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return formatDate(dateString);
  };

  const notices = posts.filter((p) => p.is_notice);

  if (isLoading) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center">
        <ActivityIndicator size="large" color="#C9A227" />
        <Text className="text-gray-500 mt-4">Loading group...</Text>
      </View>
    );
  }

  if (!group) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center">
        <Text className="text-gray-500">Group not found</Text>
        <Pressable onPress={() => router.back()} className="mt-4 bg-gold-500 rounded-full px-6 py-3">
          <Text className="text-white font-semibold">Go Back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <SafeAreaView edges={['top']} className="flex-1">
        {/* Header */}
        <View className="bg-purple-50">
          {/* Top Bar */}
          <View className="flex-row items-center justify-between px-4 py-3">
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.back();
              }}
              className="w-10 h-10 items-center justify-center"
            >
              <ChevronLeft size={28} color="#1F2937" />
            </Pressable>

            <View className="flex-row items-center">
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  // Open search
                }}
                className="w-10 h-10 items-center justify-center"
              >
                <Search size={22} color="#1F2937" />
              </Pressable>
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  // Open messages
                }}
                className="w-10 h-10 items-center justify-center"
              >
                <MessageCircle size={22} color="#1F2937" />
              </Pressable>
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  if (isAdmin) {
                    router.push(`/group/${id}/settings` as never);
                  }
                }}
                className="w-10 h-10 items-center justify-center"
              >
                <Settings size={22} color="#1F2937" />
              </Pressable>
            </View>
          </View>

          {/* Group Info */}
          <View className="px-4 pb-4">
            <View className="flex-row items-start">
              <Image
                source={{ uri: group.image_url || 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=200' }}
                style={{ width: 80, height: 80, borderRadius: 16, borderWidth: 3, borderColor: '#fff' }}
                contentFit="cover"
              />
              <View className="flex-1 ml-4">
                <View className="flex-row items-center">
                  <Text className="text-2xl font-bold text-gray-900 flex-1" numberOfLines={2}>
                    {group.name}
                  </Text>
                  <ChevronRight size={20} color="#9CA3AF" />
                </View>
                <View className="flex-row items-center mt-1">
                  {group.visibility === 'public' ? (
                    <Globe size={14} color="#6B7280" />
                  ) : (
                    <Lock size={14} color="#6B7280" />
                  )}
                  <Text className="text-gray-500 text-sm ml-1 capitalize">{group.visibility}</Text>
                  <Text className="text-gray-400 mx-2">·</Text>
                  <Text className="text-gray-500 text-sm">Admin {MOCK_MEMBERS.find((m) => m.role === 'admin')?.user?.name || 'Unknown'}</Text>
                </View>
              </View>
            </View>

            {/* Action Buttons */}
            <View className="flex-row mt-4" style={{ gap: 8 }}>
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  // Show members
                }}
                className="flex-1 flex-row items-center justify-center bg-gray-100 rounded-xl py-3"
              >
                <Users size={18} color="#374151" />
                <Text className="text-gray-700 font-semibold ml-2">{group.member_count} Members</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setShowInviteModal(true);
                }}
                className="flex-1 flex-row items-center justify-center bg-gray-100 rounded-xl py-3"
              >
                <Mail size={18} color="#374151" />
                <Text className="text-gray-700 font-semibold ml-2">Invite</Text>
              </Pressable>
              <Pressable
                onPress={handleToggleNotifications}
                className="w-12 items-center justify-center bg-gray-100 rounded-xl"
              >
                {notificationsEnabled ? (
                  <Bell size={20} color="#374151" />
                ) : (
                  <BellOff size={20} color="#9CA3AF" />
                )}
              </Pressable>
            </View>
          </View>

          {/* Tabs */}
          <View className="flex-row border-b border-gray-200 bg-white">
            {(['home', 'posts', 'events', 'albums'] as GroupTab[]).map((tab) => (
              <Pressable
                key={tab}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setActiveTab(tab);
                }}
                className={`flex-1 py-3 ${activeTab === tab ? 'border-b-2 border-gray-900' : ''}`}
              >
                <Text
                  className={`text-center font-medium capitalize ${
                    activeTab === tab ? 'text-gray-900' : 'text-gray-400'
                  }`}
                >
                  {tab}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Content */}
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor="#C9A227" />
          }
        >
          {activeTab === 'home' && (
            <Animated.View entering={FadeIn.duration(300)} className="pb-6">
              {/* Notices Section */}
              <View className="bg-white mx-4 mt-4 rounded-2xl overflow-hidden">
                <Pressable className="flex-row items-center justify-between p-4 border-b border-gray-100">
                  <Text className="text-lg font-semibold text-gray-900">Notices</Text>
                  <ChevronRight size={20} color="#9CA3AF" />
                </Pressable>
                {notices.length === 0 ? (
                  <View className="p-6 items-center">
                    <Text className="text-gray-400">No Notices yet.</Text>
                  </View>
                ) : (
                  notices.slice(0, 3).map((notice) => (
                    <View key={notice.id} className="p-4 border-b border-gray-50">
                      <View className="flex-row items-center mb-2">
                        <Image
                          source={{ uri: notice.author?.avatar_url || 'https://via.placeholder.com/40' }}
                          style={{ width: 32, height: 32, borderRadius: 16 }}
                        />
                        <View className="ml-2 flex-1">
                          <Text className="text-sm font-medium text-gray-900">{notice.author?.name}</Text>
                          <Text className="text-xs text-gray-400">{formatTimeAgo(notice.created_at)}</Text>
                        </View>
                        {notice.is_pinned && <Pin size={14} color="#C9A227" />}
                      </View>
                      <Text className="text-gray-700" numberOfLines={3}>{notice.content}</Text>
                    </View>
                  ))
                )}
              </View>

              {/* Files Section */}
              <View className="bg-white mx-4 mt-4 rounded-2xl overflow-hidden">
                <Pressable className="flex-row items-center justify-between p-4 border-b border-gray-100">
                  <Text className="text-lg font-semibold text-gray-900">Files</Text>
                  <ChevronRight size={20} color="#9CA3AF" />
                </Pressable>
                {files.length === 0 ? (
                  <View className="p-6 items-center">
                    <Text className="text-gray-400">No Attachments yet.</Text>
                  </View>
                ) : (
                  files.slice(0, 3).map((file) => (
                    <Pressable key={file.id} className="flex-row items-center p-4 border-b border-gray-50">
                      <FileText size={20} color="#6B7280" />
                      <Text className="text-gray-700 ml-3 flex-1" numberOfLines={1}>{file.name}</Text>
                      <ChevronRight size={16} color="#9CA3AF" />
                    </Pressable>
                  ))
                )}
              </View>

              {/* About Section */}
              <View className="bg-white mx-4 mt-4 rounded-2xl p-4">
                <Text className="text-lg font-semibold text-gray-900 mb-3">About</Text>
                <Text className="text-gray-600 leading-6">{group.description}</Text>

                {group.contact_phone && (
                  <Pressable
                    onPress={() => Linking.openURL(`tel:${group.contact_phone}`)}
                    className="flex-row items-center mt-4"
                  >
                    <Phone size={16} color="#C9A227" />
                    <Text className="text-gold-600 ml-2">{group.contact_phone}</Text>
                  </Pressable>
                )}

                {group.contact_email && (
                  <Pressable
                    onPress={() => Linking.openURL(`mailto:${group.contact_email}`)}
                    className="flex-row items-center mt-2"
                  >
                    <Mail size={16} color="#C9A227" />
                    <Text className="text-gold-600 ml-2">{group.contact_email}</Text>
                  </Pressable>
                )}

                {group.website && (
                  <Pressable
                    onPress={() => Linking.openURL(group.website!)}
                    className="flex-row items-center mt-2"
                  >
                    <Globe size={16} color="#C9A227" />
                    <Text className="text-gold-600 ml-2">{group.website}</Text>
                  </Pressable>
                )}

                <View className="flex-row items-center mt-4">
                  <MapPin size={16} color="#6B7280" />
                  <Text className="text-gray-500 ml-2">{group.location_label}</Text>
                </View>
              </View>

              {/* Join/Leave Button */}
              <View className="px-4 mt-4">
                {isMember ? (
                  <Pressable
                    onPress={handleLeaveGroup}
                    className="bg-gray-200 rounded-xl py-4"
                  >
                    <Text className="text-gray-700 font-semibold text-center">Leave Group</Text>
                  </Pressable>
                ) : (
                  <Pressable
                    onPress={handleJoinGroup}
                    className="bg-forest-600 rounded-xl py-4"
                  >
                    <Text className="text-white font-semibold text-center">Join Group</Text>
                  </Pressable>
                )}
              </View>
            </Animated.View>
          )}

          {activeTab === 'posts' && (
            <Animated.View entering={FadeIn.duration(300)} className="pb-6">
              {/* Create Post Button */}
              {isMember && (
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    setShowPostModal(true);
                  }}
                  className="bg-white mx-4 mt-4 rounded-2xl p-4 flex-row items-center"
                >
                  <Image
                    source={{ uri: currentUser?.avatar || 'https://via.placeholder.com/40' }}
                    style={{ width: 40, height: 40, borderRadius: 20 }}
                  />
                  <Text className="text-gray-400 ml-3 flex-1">Write something...</Text>
                  <ImageIcon size={20} color="#9CA3AF" />
                </Pressable>
              )}

              {/* Posts List */}
              {posts.length === 0 ? (
                <View className="bg-white mx-4 mt-4 rounded-2xl p-8 items-center">
                  <Text className="text-gray-400">No posts yet. Be the first to post!</Text>
                </View>
              ) : (
                posts.map((post, index) => (
                  <Animated.View
                    key={post.id}
                    entering={FadeInUp.duration(300).delay(index * 50)}
                    className="bg-white mx-4 mt-4 rounded-2xl overflow-hidden"
                  >
                    {/* Post Header */}
                    <View className="p-4">
                      <View className="flex-row items-center">
                        <Image
                          source={{ uri: post.author?.avatar_url || 'https://via.placeholder.com/40' }}
                          style={{ width: 44, height: 44, borderRadius: 22 }}
                        />
                        <View className="flex-1 ml-3">
                          <View className="flex-row items-center">
                            <Text className="font-semibold text-gray-900">{post.author?.name}</Text>
                            {post.is_pinned && (
                              <View className="ml-2 bg-gold-100 rounded-full px-2 py-0.5">
                                <Text className="text-gold-700 text-xs font-medium">Pinned</Text>
                              </View>
                            )}
                            {post.is_notice && (
                              <View className="ml-2 bg-blue-100 rounded-full px-2 py-0.5">
                                <Text className="text-blue-700 text-xs font-medium">Notice</Text>
                              </View>
                            )}
                          </View>
                          <Text className="text-gray-400 text-sm">{formatTimeAgo(post.created_at)}</Text>
                        </View>
                        <Pressable className="w-8 h-8 items-center justify-center">
                          <MoreHorizontal size={20} color="#9CA3AF" />
                        </Pressable>
                      </View>

                      {/* Post Content */}
                      <Text className="text-gray-800 mt-3 leading-6">{post.content}</Text>

                      {/* Post Images */}
                      {post.images.length > 0 && (
                        <ScrollView
                          horizontal
                          showsHorizontalScrollIndicator={false}
                          className="mt-3"
                          style={{ marginHorizontal: -16 }}
                          contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
                        >
                          {post.images.map((img, i) => (
                            <Image
                              key={i}
                              source={{ uri: img }}
                              style={{ width: 200, height: 150, borderRadius: 12 }}
                              contentFit="cover"
                            />
                          ))}
                        </ScrollView>
                      )}

                      {/* Post Actions */}
                      <View className="flex-row items-center mt-4 pt-3 border-t border-gray-100">
                        <Pressable className="flex-row items-center flex-1">
                          <Heart size={20} color="#9CA3AF" />
                          <Text className="text-gray-500 ml-2">{post.likes_count}</Text>
                        </Pressable>
                        <Pressable className="flex-row items-center flex-1">
                          <MessageCircle size={20} color="#9CA3AF" />
                          <Text className="text-gray-500 ml-2">{post.comments_count}</Text>
                        </Pressable>
                        <Pressable className="flex-row items-center flex-1 justify-end">
                          <Send size={20} color="#9CA3AF" />
                        </Pressable>
                      </View>
                    </View>
                  </Animated.View>
                ))
              )}
            </Animated.View>
          )}

          {activeTab === 'events' && (
            <Animated.View entering={FadeIn.duration(300)} className="pb-6">
              {/* Create Event Button */}
              {isAdmin && (
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    router.push(`/group/${id}/create-event` as never);
                  }}
                  className="bg-forest-600 mx-4 mt-4 rounded-2xl p-4 flex-row items-center justify-center"
                >
                  <Plus size={20} color="#FFFFFF" />
                  <Text className="text-white font-semibold ml-2">Create Event</Text>
                </Pressable>
              )}

              {/* Events List */}
              {events.length === 0 ? (
                <View className="bg-white mx-4 mt-4 rounded-2xl p-8 items-center">
                  <Calendar size={32} color="#9CA3AF" />
                  <Text className="text-gray-400 mt-3">No upcoming events</Text>
                </View>
              ) : (
                events.map((event, index) => (
                  <Animated.View
                    key={event.id}
                    entering={FadeInUp.duration(300).delay(index * 50)}
                  >
                    <Pressable className="bg-white mx-4 mt-4 rounded-2xl overflow-hidden">
                      {event.image && (
                        <Image
                          source={{ uri: event.image }}
                          style={{ width: '100%', height: 150 }}
                          contentFit="cover"
                        />
                      )}
                      <View className="p-4">
                        <Text className="text-lg font-semibold text-gray-900">{event.title}</Text>
                        <View className="flex-row items-center mt-2">
                          <Calendar size={14} color="#C9A227" />
                          <Text className="text-gray-600 ml-2">{formatDate(event.date)}</Text>
                        </View>
                        <View className="flex-row items-center mt-1">
                          <Clock size={14} color="#C9A227" />
                          <Text className="text-gray-600 ml-2">
                            {event.time}
                            {event.end_time && ` - ${event.end_time}`}
                          </Text>
                        </View>
                        {event.location && (
                          <View className="flex-row items-center mt-1">
                            <MapPin size={14} color="#C9A227" />
                            <Text className="text-gray-600 ml-2">{event.location}</Text>
                          </View>
                        )}
                        <View className="flex-row items-center justify-between mt-4">
                          <View className="flex-row items-center">
                            <Users size={14} color="#6B7280" />
                            <Text className="text-gray-500 ml-2">{event.attendees_count} attending</Text>
                          </View>
                          <Pressable className="bg-gold-500 rounded-full px-4 py-2">
                            <Text className="text-white font-semibold">RSVP</Text>
                          </Pressable>
                        </View>
                      </View>
                    </Pressable>
                  </Animated.View>
                ))
              )}
            </Animated.View>
          )}

          {activeTab === 'albums' && (
            <Animated.View entering={FadeIn.duration(300)} className="pb-6">
              {/* Create Album Button */}
              {isAdmin && (
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    // Open create album modal
                  }}
                  className="bg-forest-600 mx-4 mt-4 rounded-2xl p-4 flex-row items-center justify-center"
                >
                  <Plus size={20} color="#FFFFFF" />
                  <Text className="text-white font-semibold ml-2">Create Album</Text>
                </Pressable>
              )}

              {/* Albums Grid */}
              {albums.length === 0 ? (
                <View className="bg-white mx-4 mt-4 rounded-2xl p-8 items-center">
                  <ImageIcon size={32} color="#9CA3AF" />
                  <Text className="text-gray-400 mt-3">No albums yet</Text>
                </View>
              ) : (
                <View className="px-4 mt-4">
                  <View className="flex-row flex-wrap" style={{ gap: 12 }}>
                    {albums.map((album, index) => (
                      <Animated.View
                        key={album.id}
                        entering={FadeInUp.duration(300).delay(index * 50)}
                        style={{ width: '47%' }}
                      >
                        <Pressable
                          onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            router.push(`/group/${id}/album/${album.id}` as never);
                          }}
                          className="bg-white rounded-2xl overflow-hidden"
                        >
                          <Image
                            source={{ uri: album.cover_url || 'https://via.placeholder.com/300x200' }}
                            style={{ width: '100%', height: 120 }}
                            contentFit="cover"
                          />
                          <View className="p-3">
                            <Text className="font-semibold text-gray-900" numberOfLines={1}>
                              {album.name}
                            </Text>
                            <Text className="text-gray-500 text-sm mt-0.5">
                              {album.photo_count} photos
                            </Text>
                          </View>
                        </Pressable>
                      </Animated.View>
                    ))}
                  </View>
                </View>
              )}
            </Animated.View>
          )}
        </ScrollView>

        {/* Create Post Modal */}
        <Modal
          visible={showPostModal}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowPostModal(false)}
        >
          <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
            <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-100">
              <Pressable onPress={() => setShowPostModal(false)} className="w-10 h-10 items-center justify-center">
                <X size={24} color="#1F2937" />
              </Pressable>
              <Text className="text-lg font-semibold text-gray-900">Create Post</Text>
              <Pressable
                onPress={handleCreatePost}
                disabled={!newPostContent.trim() || isPostingPost}
                className={`px-4 py-2 rounded-full ${
                  newPostContent.trim() ? 'bg-forest-600' : 'bg-gray-200'
                }`}
              >
                <Text className={`font-semibold ${newPostContent.trim() ? 'text-white' : 'text-gray-400'}`}>
                  {isPostingPost ? 'Posting...' : 'Post'}
                </Text>
              </Pressable>
            </View>

            <ScrollView className="flex-1 p-4" keyboardShouldPersistTaps="handled">
              <View className="flex-row items-start">
                <Image
                  source={{ uri: currentUser?.avatar || 'https://via.placeholder.com/40' }}
                  style={{ width: 44, height: 44, borderRadius: 22 }}
                />
                <TextInput
                  placeholder="Write something to the group..."
                  placeholderTextColor="#9CA3AF"
                  value={newPostContent}
                  onChangeText={setNewPostContent}
                  multiline
                  className="flex-1 ml-3 text-gray-900 text-base min-h-[120px]"
                  style={{ textAlignVertical: 'top' }}
                  autoFocus
                />
              </View>

              {newPostImages.length > 0 && (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  className="mt-4"
                  contentContainerStyle={{ gap: 8 }}
                >
                  {newPostImages.map((img, i) => (
                    <View key={i} className="relative">
                      <Image source={{ uri: img }} style={{ width: 100, height: 100, borderRadius: 12 }} />
                      <Pressable
                        onPress={() => setNewPostImages(newPostImages.filter((_, idx) => idx !== i))}
                        className="absolute -top-2 -right-2 bg-gray-800 rounded-full p-1"
                      >
                        <X size={14} color="#FFFFFF" />
                      </Pressable>
                    </View>
                  ))}
                </ScrollView>
              )}
            </ScrollView>

            <View className="flex-row items-center px-4 py-3 border-t border-gray-100">
              <Pressable onPress={handlePickImages} className="flex-row items-center">
                <ImageIcon size={24} color="#6B7280" />
                <Text className="text-gray-600 ml-2">Add Photos</Text>
              </Pressable>
            </View>
          </SafeAreaView>
        </Modal>

        {/* Invite Modal */}
        <Modal
          visible={showInviteModal}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowInviteModal(false)}
        >
          <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
            <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-100">
              <Pressable onPress={() => setShowInviteModal(false)} className="w-10 h-10 items-center justify-center">
                <X size={24} color="#1F2937" />
              </Pressable>
              <Text className="text-lg font-semibold text-gray-900">Invite Members</Text>
              <View className="w-10" />
            </View>

            <View className="flex-1 p-4">
              <Text className="text-gray-600 text-center">
                Share this group with friends and family to grow your community.
              </Text>

              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  // Share functionality
                }}
                className="bg-forest-600 rounded-xl py-4 mt-6"
              >
                <Text className="text-white font-semibold text-center">Share Invite Link</Text>
              </Pressable>

              <Text className="text-gray-400 text-center text-sm mt-4">
                Anyone with the link can join this {group.visibility} group
              </Text>
            </View>
          </SafeAreaView>
        </Modal>
      </SafeAreaView>
    </View>
  );
}
