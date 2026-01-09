import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Share,
  ActivityIndicator,
  Modal,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Video, ResizeMode } from 'expo-av';
import {
  ChevronLeft,
  Heart,
  MessageCircle,
  Share2,
  Send,
  MoreHorizontal,
  MapPin,
  Play,
  Volume2,
  VolumeX,
  Ban,
  Flag,
  X,
} from 'lucide-react-native';
import Animated, { FadeIn, FadeInUp, useSharedValue, useAnimatedStyle, withSpring, withSequence } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { formatDistanceToNow } from 'date-fns';
import {
  useStore,
  MOCK_POSTS,
  MOCK_COMMENTS,
  type Comment,
  type Post,
} from '@/lib/store';
import { getPost, getComments, createComment } from '@/lib/posts';

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const scrollViewRef = useRef<ScrollView>(null);
  const commentInputRef = useRef<TextInput>(null);
  const [commentText, setCommentText] = useState('');
  const [dbPost, setDbPost] = useState<Post | null>(null);
  const [dbComments, setDbComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [likedCommentIds, setLikedCommentIds] = useState<Set<string>>(new Set());
  const [replyingTo, setReplyingTo] = useState<{ id: string; name: string } | null>(null);
  const [showOptionsModal, setShowOptionsModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');

  const isGuest = useStore((s) => s.isGuest);
  const currentUser = useStore((s) => s.currentUser);
  const userPosts = useStore((s) => s.userPosts);
  const likedPostIds = useStore((s) => s.likedPostIds);
  const toggleLikePost = useStore((s) => s.toggleLikePost);
  const userComments = useStore((s) => s.userComments);
  const addComment = useStore((s) => s.addComment);
  const blockUser = useStore((s) => s.blockUser);
  const reportUser = useStore((s) => s.reportUser);
  const blockedUserIds = useStore((s) => s.blockedUserIds);

  // Fetch post and comments from database
  useEffect(() => {
    const fetchPostAndComments = async () => {
      if (!id) {
        setIsLoading(false);
        return;
      }

      // Always fetch comments from database
      try {
        console.log('[PostDetail] Fetching comments from database for post:', id);
        const commentsData = await getComments(id);
        if (commentsData && commentsData.length > 0) {
          const formattedComments: Comment[] = commentsData.map((c: any) => ({
            id: c.id,
            postId: c.post_id,
            author: {
              id: c.author?.id || c.author_id,
              name: c.author?.name || 'Unknown',
              username: c.author?.username || 'unknown',
              avatar: c.author?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop&crop=face',
              bio: c.author?.bio || '',
              location: c.author?.location || '',
              interests: c.author?.interests || [],
              joinedDate: c.author?.created_at || new Date().toISOString(),
            },
            content: c.content,
            createdAt: c.created_at,
            likes: 0,
          }));
          console.log('[PostDetail] Found comments:', formattedComments.length);
          setDbComments(formattedComments);
        }
      } catch (error) {
        console.log('[PostDetail] Error fetching comments:', error);
      }

      // Check local posts first
      const foundInUserPosts = userPosts.find((p) => p.id === id);
      if (foundInUserPosts) {
        setIsLoading(false);
        return;
      }

      const foundInMockPosts = MOCK_POSTS.find((p) => p.id === id);
      if (foundInMockPosts) {
        setIsLoading(false);
        return;
      }

      // Not found locally, try database
      try {
        console.log('[PostDetail] Fetching post from database:', id);
        const postData = await getPost(id);
        if (postData) {
          const formattedPost: Post = {
            id: postData.id,
            author: {
              id: postData.author?.id || postData.author_id,
              name: postData.author?.name || 'Unknown',
              username: postData.author?.username || 'unknown',
              avatar: postData.author?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop&crop=face',
              bio: postData.author?.bio || '',
              location: postData.author?.location || '',
              interests: postData.author?.interests || [],
              joinedDate: postData.author?.created_at || new Date().toISOString(),
            },
            content: postData.content,
            images: postData.images || [],
            likes: 0,
            comments: 0,
            createdAt: postData.created_at,
            isLiked: false,
            location: postData.location || '',
          };
          console.log('[PostDetail] Found post in database');
          setDbPost(formattedPost);
        }
      } catch (error) {
        console.log('[PostDetail] Error fetching post:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPostAndComments();
  }, [id, userPosts]);

  // Search in both user-created posts, mock posts, and database posts
  const post = useMemo(() => {
    const foundInUserPosts = userPosts.find((p) => p.id === id);
    if (foundInUserPosts) return foundInUserPosts;

    const foundInMockPosts = MOCK_POSTS.find((p) => p.id === id);
    if (foundInMockPosts) return foundInMockPosts;

    // Return database post if found
    return dbPost;
  }, [id, userPosts, dbPost]);

  const comments = useMemo(() => {
    // Combine all comment sources, avoiding duplicates
    const commentMap = new Map<string, Comment>();

    // Add database comments first (these are the source of truth)
    dbComments.forEach(c => commentMap.set(c.id, c));

    // Add mock comments
    MOCK_COMMENTS.filter((c) => c.postId === id).forEach(c => {
      if (!commentMap.has(c.id)) {
        commentMap.set(c.id, c);
      }
    });

    // Add user's local comments, but skip temp comments if we already have db version
    // Temp comments start with "temp-comment-" and contain the same content as db comments
    userComments.filter((c) => c.postId === id).forEach(c => {
      // Skip temp comments - they're just for immediate feedback
      if (c.id.startsWith('temp-comment-')) {
        // Check if we already have a db comment with same content from same author
        const hasDuplicateDbComment = dbComments.some(
          dbC => dbC.content === c.content && dbC.author.id === c.author.id
        );
        if (hasDuplicateDbComment) {
          return; // Skip this temp comment
        }
      }
      if (!commentMap.has(c.id)) {
        commentMap.set(c.id, c);
      }
    });

    // Sort by date
    return Array.from(commentMap.values()).sort((a, b) =>
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  }, [id, userComments, dbComments]);

  // Get like count for a comment (base + 1 if user liked it)
  const getCommentLikeCount = (comment: Comment) => {
    const baseLikes = comment.likes || 0;
    const isLikedByUser = likedCommentIds.has(comment.id);
    return isLikedByUser ? baseLikes + 1 : baseLikes;
  };

  // Handle liking a comment
  const handleLikeComment = (commentId: string) => {
    if (isGuest || !currentUser) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      router.push('/signup');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLikedCommentIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(commentId)) {
        newSet.delete(commentId);
      } else {
        newSet.add(commentId);
      }
      return newSet;
    });
  };

  // Handle replying to a comment
  const handleReplyToComment = (comment: Comment) => {
    if (isGuest || !currentUser) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      router.push('/signup');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setReplyingTo({ id: comment.id, name: comment.author.name });
    setCommentText(`@${comment.author.username} `);
    commentInputRef.current?.focus();
  };

  // Cancel reply
  const handleCancelReply = () => {
    setReplyingTo(null);
    setCommentText('');
  };

  const isLiked = id ? likedPostIds.includes(id) : false;
  const baseLikes = post?.likes ?? 0;
  const likeCount = post?.isLiked
    ? (isLiked ? baseLikes : baseLikes - 1)
    : (isLiked ? baseLikes + 1 : baseLikes);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef<Video>(null);
  const likeScale = useSharedValue(1);

  const likeAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: likeScale.value }],
  }));

  // Show loading while fetching
  if (isLoading) {
    return (
      <View className="flex-1 bg-cream items-center justify-center">
        <ActivityIndicator size="large" color="#D4673A" />
        <Text className="text-gray-500 mt-4">Loading post...</Text>
      </View>
    );
  }

  if (!post) {
    return (
      <View className="flex-1 bg-cream items-center justify-center">
        <Text className="text-gray-500">Post not found</Text>
        <Pressable
          onPress={() => router.back()}
          className="mt-4 bg-terracotta-500 px-6 py-3 rounded-full"
        >
          <Text className="text-white font-semibold">Go Back</Text>
        </Pressable>
      </View>
    );
  }

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const handleLike = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    likeScale.value = withSequence(
      withSpring(1.3, { damping: 2, stiffness: 200 }),
      withSpring(1, { damping: 6, stiffness: 200 })
    );

    if (id) {
      toggleLikePost(id);
    }
  };

  const handleShare = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await Share.share({
        message: `Check out this post from ${post.author.name} on Diaspora:\n\n"${post.content}"\n\nJoin our community: diaspora.app`,
        title: 'Share Post',
      });
    } catch (error) {
      console.log('Share error:', error);
    }
  };

  const handleSendComment = async () => {
    if (!commentText.trim()) return;

    if (isGuest || !currentUser) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      router.push('/signup');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const commentContent = commentText.trim();
    const tempId = `temp-comment-${Date.now()}`;

    const newComment: Comment = {
      id: tempId,
      postId: id || '',
      author: currentUser,
      content: commentContent,
      createdAt: new Date().toISOString(),
      likes: 0,
    };

    // Save locally for immediate feedback
    addComment(newComment);
    setCommentText('');
    setReplyingTo(null); // Clear reply state

    // Also save to database so others can see it
    try {
      console.log('[PostDetail] Saving comment to database...');
      const dbComment = await createComment(id || '', currentUser.id, commentContent);
      if (dbComment) {
        console.log('[PostDetail] Comment saved to database');
        // Update dbComments with the real database comment
        // This will replace the temp comment in the combined list
        const formattedComment: Comment = {
          id: dbComment.id,
          postId: dbComment.post_id,
          author: {
            id: dbComment.author?.id || dbComment.author_id,
            name: dbComment.author?.name || currentUser.name,
            username: dbComment.author?.username || currentUser.username,
            avatar: dbComment.author?.avatar_url || currentUser.avatar,
            bio: dbComment.author?.bio || '',
            location: dbComment.author?.location || '',
            interests: dbComment.author?.interests || [],
            joinedDate: dbComment.author?.created_at || new Date().toISOString(),
          },
          content: dbComment.content,
          createdAt: dbComment.created_at,
          likes: 0,
        };
        setDbComments(prev => [...prev, formattedComment]);
      }
    } catch (error) {
      console.log('[PostDetail] Error saving comment to database:', error);
      // Comment is still saved locally, so user sees it
    }

    // Scroll to bottom after adding comment
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const timeAgo = formatDistanceToNow(new Date(post.createdAt), { addSuffix: true });

  return (
    <View className="flex-1 bg-cream">
      <SafeAreaView edges={['top']} className="flex-1">
        {/* Header */}
        <Animated.View
          entering={FadeIn.duration(300)}
          className="flex-row items-center px-4 py-3 bg-cream border-b border-gray-100"
        >
          <Pressable
            onPress={handleBack}
            className="bg-white rounded-full p-2 shadow-sm"
          >
            <ChevronLeft size={24} color="#2D1F1A" />
          </Pressable>
          <Text className="flex-1 text-center text-lg font-semibold text-warmBrown">
            Post
          </Text>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShowOptionsModal(true);
            }}
            className="p-2"
          >
            <MoreHorizontal size={24} color="#2D1F1A" />
          </Pressable>
        </Animated.View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
          keyboardVerticalOffset={0}
        >
          <ScrollView
            ref={scrollViewRef}
            className="flex-1"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 20 }}
          >
            {/* Post Content */}
            <Animated.View
              entering={FadeInUp.duration(400).delay(100)}
              className="bg-white mx-4 mt-4 rounded-2xl shadow-sm overflow-hidden"
            >
              {/* Author Header */}
              <View className="flex-row items-center p-4 pb-3">
                <Image
                  source={{ uri: post.author.avatar }}
                  style={{ width: 48, height: 48, borderRadius: 24 }}
                  contentFit="cover"
                />
                <View className="flex-1 ml-3">
                  <Text className="text-warmBrown font-semibold text-base">
                    {post.author.name}
                  </Text>
                  <View className="flex-row items-center mt-0.5">
                    <MapPin size={12} color="#8B7355" />
                    <Text className="text-sm text-gray-500 ml-1">{post.location}</Text>
                    <Text className="text-sm text-gray-400 mx-1">·</Text>
                    <Text className="text-sm text-gray-400">{timeAgo}</Text>
                  </View>
                </View>
              </View>

              {/* Post Text */}
              <View className="px-4 pb-3">
                <Text className="text-warmBrown text-base leading-6">
                  {post.content}
                </Text>
              </View>

              {/* Post Image */}
              {post.images.length > 0 && (
                <View className="px-4 pb-3">
                  <Image
                    source={{ uri: post.images[0] }}
                    style={{ width: '100%', height: 250, borderRadius: 12 }}
                    contentFit="cover"
                  />
                </View>
              )}

              {/* Post Video */}
              {post.video && (
                <View className="px-4 pb-3">
                  <Pressable
                    onPress={async () => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      if (videoRef.current) {
                        if (isPlaying) {
                          await videoRef.current.pauseAsync();
                        } else {
                          await videoRef.current.playAsync();
                        }
                        setIsPlaying(!isPlaying);
                      }
                    }}
                    className="relative"
                  >
                    <Video
                      ref={videoRef}
                      source={{ uri: post.video }}
                      style={{ width: '100%', height: 300, borderRadius: 12, backgroundColor: '#000' }}
                      resizeMode={ResizeMode.CONTAIN}
                      isLooping
                      isMuted={isMuted}
                      onPlaybackStatusUpdate={(status) => {
                        if (status.isLoaded) {
                          setIsPlaying(status.isPlaying);
                        }
                      }}
                    />
                    {!isPlaying && (
                      <View className="absolute inset-0 items-center justify-center" style={{ borderRadius: 12 }}>
                        <View className="bg-black/50 rounded-full p-4">
                          <Play size={32} color="#FFFFFF" fill="#FFFFFF" />
                        </View>
                      </View>
                    )}
                    <Pressable
                      onPress={async () => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        if (videoRef.current) {
                          await videoRef.current.setIsMutedAsync(!isMuted);
                          setIsMuted(!isMuted);
                        }
                      }}
                      className="absolute bottom-3 right-3 bg-black/50 rounded-full p-2"
                    >
                      {isMuted ? (
                        <VolumeX size={18} color="#FFFFFF" />
                      ) : (
                        <Volume2 size={18} color="#FFFFFF" />
                      )}
                    </Pressable>
                  </Pressable>
                </View>
              )}

              {/* Actions */}
              <View className="flex-row items-center px-4 py-3 border-t border-gray-100">
                <Pressable onPress={handleLike} className="flex-row items-center mr-6">
                  <Animated.View style={likeAnimatedStyle}>
                    <Heart
                      size={24}
                      color={isLiked ? '#D4673A' : '#8B7355'}
                      fill={isLiked ? '#D4673A' : 'transparent'}
                    />
                  </Animated.View>
                  <Text
                    className={`ml-2 text-sm font-medium ${
                      isLiked ? 'text-terracotta-500' : 'text-gray-500'
                    }`}
                  >
                    {likeCount}
                  </Text>
                </Pressable>

                <View className="flex-row items-center mr-6">
                  <MessageCircle size={24} color="#8B7355" />
                  <Text className="ml-2 text-sm font-medium text-gray-500">
                    {comments.length}
                  </Text>
                </View>

                <Pressable onPress={handleShare} className="flex-row items-center">
                  <Share2 size={22} color="#8B7355" />
                </Pressable>
              </View>
            </Animated.View>

            {/* Comments Section */}
            <View className="mt-4 px-4">
              <Text className="text-lg font-bold text-warmBrown mb-3">
                Comments ({comments.length})
              </Text>

              {comments.length === 0 ? (
                <Animated.View
                  entering={FadeInUp.duration(400).delay(200)}
                  className="bg-white rounded-2xl p-6 items-center"
                >
                  <MessageCircle size={40} color="#D1D5DB" />
                  <Text className="text-gray-400 mt-2 text-center">
                    No comments yet. Be the first to comment!
                  </Text>
                </Animated.View>
              ) : (
                comments.map((comment, index) => (
                  <Animated.View
                    key={comment.id}
                    entering={FadeInUp.duration(300).delay(200 + index * 50)}
                    className="bg-white rounded-2xl p-4 mb-3 shadow-sm"
                  >
                    <View className="flex-row items-start">
                      <Image
                        source={{ uri: comment.author.avatar }}
                        style={{ width: 36, height: 36, borderRadius: 18 }}
                        contentFit="cover"
                      />
                      <View className="flex-1 ml-3">
                        <View className="flex-row items-center">
                          <Text className="font-semibold text-warmBrown">
                            {comment.author.name}
                          </Text>
                          <Text className="text-xs text-gray-400 ml-2">
                            {formatDistanceToNow(new Date(comment.createdAt), {
                              addSuffix: true,
                            })}
                          </Text>
                        </View>
                        <Text className="text-warmBrown mt-1 leading-5">
                          {comment.content}
                        </Text>
                        <View className="flex-row items-center mt-2">
                          <Pressable
                            onPress={() => handleLikeComment(comment.id)}
                            className="flex-row items-center active:opacity-60"
                          >
                            <Heart
                              size={16}
                              color={likedCommentIds.has(comment.id) ? '#D4673A' : '#8B7355'}
                              fill={likedCommentIds.has(comment.id) ? '#D4673A' : 'transparent'}
                            />
                            <Text className={`text-xs ml-1 ${likedCommentIds.has(comment.id) ? 'text-terracotta-500' : 'text-gray-500'}`}>
                              {getCommentLikeCount(comment)}
                            </Text>
                          </Pressable>
                          <Pressable
                            onPress={() => handleReplyToComment(comment)}
                            className="flex-row items-center ml-4 active:opacity-60"
                          >
                            <MessageCircle size={14} color="#8B7355" />
                            <Text className="text-xs text-gray-500 ml-1">Reply</Text>
                          </Pressable>
                        </View>
                      </View>
                    </View>
                  </Animated.View>
                ))
              )}
            </View>
          </ScrollView>

          {/* Comment Input */}
          <View className="bg-white border-t border-gray-100 px-4 py-3">
            <SafeAreaView edges={['bottom']}>
              {/* Reply indicator */}
              {replyingTo && (
                <View className="flex-row items-center justify-between mb-2 bg-gray-50 rounded-lg px-3 py-2">
                  <Text className="text-sm text-gray-600">
                    Replying to <Text className="font-semibold text-terracotta-500">{replyingTo.name}</Text>
                  </Text>
                  <Pressable onPress={handleCancelReply} className="p-1">
                    <Text className="text-xs text-gray-400">Cancel</Text>
                  </Pressable>
                </View>
              )}
              <View className="flex-row items-center">
                <Image
                  source={{
                    uri: currentUser?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop',
                  }}
                  style={{ width: 36, height: 36, borderRadius: 18 }}
                  contentFit="cover"
                />
                <View className="flex-1 flex-row items-center bg-gray-100 rounded-full ml-3 px-4 py-2">
                  <TextInput
                    ref={commentInputRef}
                    placeholder={
                      isGuest || !currentUser
                        ? 'Sign up to comment...'
                        : replyingTo
                        ? `Reply to ${replyingTo.name}...`
                        : 'Write a comment...'
                    }
                    placeholderTextColor="#9CA3AF"
                    value={commentText}
                    onChangeText={setCommentText}
                    className="flex-1 text-warmBrown text-sm"
                    multiline
                    maxLength={500}
                    editable={!isGuest && !!currentUser}
                    onFocus={() => {
                      if (isGuest || !currentUser) {
                        router.push('/signup');
                      }
                    }}
                  />
                </View>
                <Pressable
                  onPress={handleSendComment}
                  disabled={!commentText.trim()}
                  className={`ml-2 p-2 rounded-full ${
                    commentText.trim() ? 'bg-terracotta-500' : 'bg-gray-200'
                  }`}
                >
                  <Send
                    size={20}
                    color={commentText.trim() ? '#FFFFFF' : '#9CA3AF'}
                  />
                </Pressable>
              </View>
            </SafeAreaView>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>

      {/* Options Modal (Block/Report) */}
      <Modal
        visible={showOptionsModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowOptionsModal(false)}
      >
        <Pressable
          className="flex-1 bg-black/50 justify-end"
          onPress={() => setShowOptionsModal(false)}
        >
          <Pressable
            className="bg-white rounded-t-3xl"
            onPress={(e) => e.stopPropagation()}
          >
            <View className="w-12 h-1 bg-gray-300 rounded-full self-center my-3" />

            {/* Only show block/report if not own post */}
            {post && currentUser?.id !== post.author.id && (
              <>
                {/* Block User */}
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    setShowOptionsModal(false);
                    Alert.alert(
                      'Block User',
                      `Are you sure you want to block ${post.author.name}? You won't see their posts or comments anymore.`,
                      [
                        { text: 'Cancel', style: 'cancel' },
                        {
                          text: 'Block',
                          style: 'destructive',
                          onPress: () => {
                            blockUser(post.author.id, post.author.name, post.author.avatar);
                            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                            Alert.alert(
                              'User Blocked',
                              `${post.author.name} has been blocked. You can unblock them in Settings.`,
                              [{ text: 'OK', onPress: () => router.back() }]
                            );
                          },
                        },
                      ]
                    );
                  }}
                  className="flex-row items-center px-6 py-4 border-b border-gray-100"
                >
                  <View className="bg-red-50 rounded-full p-2.5 mr-4">
                    <Ban size={22} color="#EF4444" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-red-500 font-semibold text-base">Block {post.author.name}</Text>
                    <Text className="text-gray-500 text-sm mt-0.5">You won't see their content anymore</Text>
                  </View>
                </Pressable>

                {/* Report User */}
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setShowOptionsModal(false);
                    setShowReportModal(true);
                  }}
                  className="flex-row items-center px-6 py-4 border-b border-gray-100"
                >
                  <View className="bg-orange-50 rounded-full p-2.5 mr-4">
                    <Flag size={22} color="#F97316" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-warmBrown font-semibold text-base">Report Content</Text>
                    <Text className="text-gray-500 text-sm mt-0.5">Report inappropriate content</Text>
                  </View>
                </Pressable>
              </>
            )}

            {/* Share */}
            <Pressable
              onPress={() => {
                setShowOptionsModal(false);
                handleShare();
              }}
              className="flex-row items-center px-6 py-4 border-b border-gray-100"
            >
              <View className="bg-terracotta-50 rounded-full p-2.5 mr-4">
                <Share2 size={22} color="#D4673A" />
              </View>
              <View className="flex-1">
                <Text className="text-warmBrown font-semibold text-base">Share Post</Text>
                <Text className="text-gray-500 text-sm mt-0.5">Share this post with others</Text>
              </View>
            </Pressable>

            {/* Cancel */}
            <Pressable
              onPress={() => setShowOptionsModal(false)}
              className="py-4 mb-6"
            >
              <Text className="text-gray-500 text-center font-medium">Cancel</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Report Modal */}
      <Modal
        visible={showReportModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowReportModal(false)}
      >
        <Pressable
          className="flex-1 bg-black/50 justify-center px-6"
          onPress={() => setShowReportModal(false)}
        >
          <Pressable
            className="bg-white rounded-3xl overflow-hidden"
            onPress={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <View className="flex-row items-center justify-between px-5 py-4 border-b border-gray-100">
              <Text className="text-lg font-bold text-warmBrown">Report Content</Text>
              <Pressable onPress={() => setShowReportModal(false)}>
                <X size={24} color="#6B7280" />
              </Pressable>
            </View>

            {/* Report Reasons */}
            <View className="px-5 py-4">
              <Text className="text-gray-600 mb-4">Why are you reporting this content?</Text>
              {[
                'Spam or misleading',
                'Harassment or bullying',
                'Hate speech',
                'Violence or dangerous content',
                'Inappropriate content',
                'Other',
              ].map((reason) => (
                <Pressable
                  key={reason}
                  onPress={() => setReportReason(reason)}
                  className={`flex-row items-center py-3 px-4 rounded-xl mb-2 ${
                    reportReason === reason ? 'bg-terracotta-50 border border-terracotta-200' : 'bg-gray-50'
                  }`}
                >
                  <View
                    className={`w-5 h-5 rounded-full border-2 mr-3 items-center justify-center ${
                      reportReason === reason ? 'border-terracotta-500 bg-terracotta-500' : 'border-gray-300'
                    }`}
                  >
                    {reportReason === reason && <View className="w-2 h-2 rounded-full bg-white" />}
                  </View>
                  <Text className={reportReason === reason ? 'text-terracotta-700 font-medium' : 'text-gray-700'}>
                    {reason}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Submit Button */}
            <View className="px-5 pb-6">
              <Pressable
                onPress={() => {
                  if (reportReason && post) {
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    reportUser(post.author.id, reportReason);
                    setShowReportModal(false);
                    setReportReason('');
                    Alert.alert(
                      'Report Submitted',
                      'Thank you for reporting. Our team will review this content.',
                      [{ text: 'OK' }]
                    );
                  }
                }}
                disabled={!reportReason}
                className={`py-4 rounded-2xl ${reportReason ? 'bg-terracotta-500' : 'bg-gray-200'}`}
              >
                <Text className={`text-center font-bold text-base ${reportReason ? 'text-white' : 'text-gray-400'}`}>
                  Submit Report
                </Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
