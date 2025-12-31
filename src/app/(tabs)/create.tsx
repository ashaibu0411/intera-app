import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, Pressable, KeyboardAvoidingView, Platform, Modal, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import {
  X,
  ImagePlus,
  Video,
  MapPin,
  Send,
  FileText,
  ShoppingBag,
  Calendar,
  ChevronRight,
  Clock,
  Users,
  Lock,
  Globe,
  DollarSign,
  Tag,
  Check,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInUp, FadeInDown, useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { useStore, MOCK_COMMUNITIES, MARKETPLACE_CATEGORIES, EVENT_CATEGORIES } from '@/lib/store';
import { router } from 'expo-router';
import { sendNewPostNotification } from '@/lib/notifications';
import { createPost as createDbPost } from '@/lib/posts';

type CreateMode = 'select' | 'post' | 'sell' | 'event';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function CreateScreen() {
  const [mode, setMode] = useState<CreateMode>('select');
  const currentUser = useStore((s) => s.currentUser);
  const isGuest = useStore((s) => s.isGuest);
  const currentCommunity = useStore((s) => s.currentCommunity);

  const displayCommunity = currentCommunity ?? MOCK_COMMUNITIES[0];

  // Check if user is logged in
  if (!currentUser || isGuest) {
    return (
      <View className="flex-1 bg-cream">
        <SafeAreaView edges={['top']} className="flex-1 justify-center items-center px-6">
          <Animated.View entering={FadeIn.duration(400)} className="items-center">
            <View className="bg-terracotta-100 rounded-full p-6 mb-6">
              <FileText size={48} color="#D4673A" />
            </View>
            <Text className="text-2xl font-bold text-warmBrown text-center mb-2">
              Sign In to Create
            </Text>
            <Text className="text-gray-500 text-center mb-8">
              Join AfroConnect to post updates, sell items, and create events for your community.
            </Text>
            <Pressable onPress={() => router.push('/signup')}>
              <LinearGradient
                colors={['#D4673A', '#B85430']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ borderRadius: 16, paddingVertical: 16, paddingHorizontal: 32 }}
              >
                <Text className="text-white font-bold text-lg">Sign Up or Log In</Text>
              </LinearGradient>
            </Pressable>
          </Animated.View>
        </SafeAreaView>
      </View>
    );
  }

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setMode('select');
  };

  if (mode === 'select') {
    return <CreateSelectScreen onSelect={setMode} user={currentUser} />;
  }

  if (mode === 'post') {
    return <CreatePostForm user={currentUser} community={displayCommunity} onBack={handleBack} />;
  }

  if (mode === 'sell') {
    return <CreateListingForm user={currentUser} community={displayCommunity} onBack={handleBack} />;
  }

  if (mode === 'event') {
    return <CreateEventForm user={currentUser} community={displayCommunity} onBack={handleBack} />;
  }

  return null;
}

// Selection Screen
function CreateSelectScreen({ onSelect, user }: { onSelect: (mode: CreateMode) => void; user: any }) {
  const options = [
    {
      id: 'post',
      icon: FileText,
      title: 'Create Post',
      description: 'Share updates, ask questions, or connect with your community',
      colors: ['#D4673A', '#B85430'],
    },
    {
      id: 'sell',
      icon: ShoppingBag,
      title: 'Sell an Item',
      description: 'List products, crafts, or services in the marketplace',
      colors: ['#1B4D3E', '#153D31'],
    },
    {
      id: 'event',
      icon: Calendar,
      title: 'Create Event',
      description: 'Host gatherings, meetups, or celebrations',
      colors: ['#C9A227', '#A6841F'],
    },
  ];

  return (
    <View className="flex-1 bg-cream">
      <SafeAreaView edges={['top']} className="flex-1">
        <Animated.View entering={FadeIn.duration(300)} className="px-5 pt-6 pb-4">
          <Text className="text-2xl font-bold text-warmBrown">Create</Text>
          <Text className="text-gray-500 mt-1">What would you like to share today?</Text>
        </Animated.View>

        <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
          {/* User Info */}
          <Animated.View entering={FadeInUp.duration(400).delay(100)} className="flex-row items-center mb-6">
            <Image
              source={{ uri: user.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop&crop=face' }}
              style={{ width: 50, height: 50, borderRadius: 25 }}
              contentFit="cover"
            />
            <View className="ml-3">
              <Text className="text-warmBrown font-semibold text-lg">{user.name}</Text>
              <Text className="text-gray-500 text-sm">Posting as yourself</Text>
            </View>
          </Animated.View>

          {/* Options */}
          {options.map((option, index) => (
            <Animated.View
              key={option.id}
              entering={FadeInUp.duration(400).delay(200 + index * 100)}
            >
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  onSelect(option.id as CreateMode);
                }}
                className="mb-4"
              >
                <LinearGradient
                  colors={option.colors as [string, string]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{ borderRadius: 20, padding: 20 }}
                >
                  <View className="flex-row items-center">
                    <View className="bg-white/20 rounded-full p-4">
                      <option.icon size={28} color="#FFFFFF" />
                    </View>
                    <View className="flex-1 ml-4">
                      <Text className="text-white font-bold text-lg">{option.title}</Text>
                      <Text className="text-white/80 text-sm mt-1">{option.description}</Text>
                    </View>
                    <ChevronRight size={24} color="#FFFFFF" />
                  </View>
                </LinearGradient>
              </Pressable>
            </Animated.View>
          ))}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

// Post Form
function CreatePostForm({ user, community, onBack }: { user: any; community: any; onBack: () => void }) {
  const [content, setContent] = useState('');
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const buttonScale = useSharedValue(1);
  const addPost = useStore((s) => s.addPost);

  const handlePickImage = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 0.8,
      selectionLimit: 4,
    });

    if (!result.canceled && result.assets.length > 0) {
      const newImages = result.assets.map((asset) => asset.uri);
      setSelectedImages((prev) => [...prev, ...newImages].slice(0, 4));
    }
  };

  const handlePickVideo = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['videos'],
      quality: 0.8,
    });

    if (!result.canceled && result.assets.length > 0) {
      setSelectedVideo(result.assets[0].uri);
      // Clear images if video is selected (can't have both)
      setSelectedImages([]);
    }
  };

  const removeImage = (index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedImages((prev) => prev.filter((_, i) => i !== index));
  };

  const removeVideo = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedVideo(null);
  };

  const handlePost = async () => {
    if (!content.trim()) return;

    let postId = `post_${Date.now()}`;
    let savedToDb = false;

    // Try to save to database first (so other users can see it)
    try {
      const dbPost = await createDbPost(user.id, content.trim(), selectedImages, community.city);
      if (dbPost?.id) {
        postId = dbPost.id;
        savedToDb = true;
      }
    } catch (dbError) {
      console.log('Database save failed, will save locally:', dbError);
    }

    // Only save to local store if database save failed
    // This prevents duplicates when database save succeeds
    if (!savedToDb) {
      const newPost = {
        id: postId,
        author: {
          id: user.id,
          name: user.name,
          username: user.username,
          avatar: user.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop&crop=face',
          bio: user.bio || '',
          location: user.location || community.city,
          interests: user.interests || [],
          joinedDate: user.joinedDate || new Date().toISOString(),
        },
        content: content.trim(),
        images: selectedImages,
        video: selectedVideo ?? undefined,
        likes: 0,
        comments: 0,
        createdAt: new Date().toISOString(),
        isLiked: false,
        location: community.city,
      };

      addPost(newPost);
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Send notification to other users in the community
    await sendNewPostNotification(user.name, content.trim(), postId);

    router.navigate('/(tabs)');
  };

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const canPost = content.trim().length > 0;

  return (
    <View className="flex-1 bg-cream">
      <SafeAreaView edges={['top']} className="flex-1">
        {/* Header */}
        <Animated.View
          entering={FadeIn.duration(300)}
          className="flex-row items-center justify-between px-5 py-4 border-b border-gray-100"
        >
          <Pressable onPress={onBack} className="p-2 -ml-2">
            <X size={24} color="#2D1F1A" />
          </Pressable>

          <Text className="text-lg font-bold text-warmBrown">New Post</Text>

          <AnimatedPressable
            style={buttonAnimatedStyle}
            onPress={handlePost}
            onPressIn={() => { buttonScale.value = withSpring(0.95); }}
            onPressOut={() => { buttonScale.value = withSpring(1); }}
            disabled={!canPost}
          >
            <LinearGradient
              colors={canPost ? ['#D4673A', '#B85430'] : ['#D1D5DB', '#9CA3AF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ borderRadius: 20, paddingVertical: 10, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center' }}
            >
              <Send size={16} color="#FFFFFF" />
              <Text className="text-white font-semibold ml-2">Post</Text>
            </LinearGradient>
          </AnimatedPressable>
        </Animated.View>

        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
          <ScrollView className="flex-1" keyboardShouldPersistTaps="handled">
            {/* User Info */}
            <View className="flex-row items-center px-5 py-4">
              <Image
                source={{ uri: user.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop&crop=face' }}
                style={{ width: 44, height: 44, borderRadius: 22 }}
                contentFit="cover"
              />
              <View className="ml-3">
                <Text className="text-warmBrown font-semibold">{user.name}</Text>
                <View className="flex-row items-center mt-0.5">
                  <MapPin size={12} color="#8B7355" />
                  <Text className="text-sm text-gray-500 ml-1">{community.city}</Text>
                </View>
              </View>
            </View>

            {/* Text Input */}
            <View className="px-5">
              <TextInput
                placeholder="What's happening in your community?"
                placeholderTextColor="#9CA3AF"
                multiline
                value={content}
                onChangeText={setContent}
                className="text-warmBrown text-lg leading-7 min-h-[150px]"
                style={{ textAlignVertical: 'top' }}
                autoFocus
              />
            </View>

            {/* Selected Images */}
            {selectedImages.length > 0 && (
              <View className="px-5 pb-4">
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }}>
                  {selectedImages.map((uri, index) => (
                    <View key={index} className="mr-3 relative">
                      <Image source={{ uri }} style={{ width: 120, height: 120, borderRadius: 12 }} contentFit="cover" />
                      <Pressable onPress={() => removeImage(index)} className="absolute -top-2 -right-2 bg-warmBrown rounded-full p-1.5">
                        <X size={14} color="#FFFFFF" />
                      </Pressable>
                    </View>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Selected Video */}
            {selectedVideo && (
              <View className="px-5 pb-4">
                <View className="relative bg-gray-900 rounded-xl overflow-hidden" style={{ height: 200 }}>
                  <View className="flex-1 items-center justify-center">
                    <View className="bg-white/20 rounded-full p-4">
                      <Video size={32} color="#FFFFFF" />
                    </View>
                    <Text className="text-white/80 mt-2 text-sm">Video selected</Text>
                  </View>
                  <Pressable onPress={removeVideo} className="absolute top-2 right-2 bg-warmBrown rounded-full p-1.5">
                    <X size={14} color="#FFFFFF" />
                  </Pressable>
                </View>
              </View>
            )}
          </ScrollView>

          {/* Bottom Actions */}
          <View className="px-5 py-4 border-t border-gray-100 bg-white">
            <View className="flex-row items-center">
              <Pressable
                onPress={handlePickImage}
                disabled={!!selectedVideo}
                className={`flex-row items-center rounded-full px-4 py-2.5 ${selectedVideo ? 'bg-gray-100' : 'bg-terracotta-50'}`}
              >
                <ImagePlus size={20} color={selectedVideo ? '#9CA3AF' : '#D4673A'} />
                <Text className={`font-medium ml-2 ${selectedVideo ? 'text-gray-400' : 'text-terracotta-500'}`}>Photo</Text>
              </Pressable>
              <Pressable
                onPress={handlePickVideo}
                disabled={selectedImages.length > 0}
                className={`flex-row items-center rounded-full px-4 py-2.5 ml-2 ${selectedImages.length > 0 ? 'bg-gray-100' : 'bg-forest-50'}`}
              >
                <Video size={20} color={selectedImages.length > 0 ? '#9CA3AF' : '#1B4D3E'} />
                <Text className={`font-medium ml-2 ${selectedImages.length > 0 ? 'text-gray-400' : 'text-forest-700'}`}>Video</Text>
              </Pressable>
              <View className="flex-1" />
              <Text className="text-gray-400 text-sm">{content.length}/500</Text>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

// Sell Item Form
function CreateListingForm({ user, community, onBack }: { user: any; community: any; onBack: () => void }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [condition, setCondition] = useState<'new' | 'used' | 'refurbished'>('new');
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const addMarketplaceListing = useStore((s) => s.addMarketplaceListing);

  const handlePickImage = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 0.8,
      selectionLimit: 6,
    });

    if (!result.canceled && result.assets.length > 0) {
      const newImages = result.assets.map((asset) => asset.uri);
      setSelectedImages((prev) => [...prev, ...newImages].slice(0, 6));
    }
  };

  const handleSubmit = () => {
    if (!title.trim() || !price || !category || selectedImages.length === 0) return;

    // Create the listing object
    const newListing = {
      id: `local-${Date.now()}`,
      seller: {
        id: user.id,
        name: user.name,
        username: user.username,
        avatar: user.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop&crop=face',
        bio: user.bio || '',
        location: user.location || community.city,
        interests: user.interests || [],
        joinedDate: user.joinedDate || new Date().toISOString(),
      },
      title: title.trim(),
      description: description.trim(),
      price: price,
      currency: 'USD',
      images: selectedImages,
      category,
      condition,
      location: community.city,
      isStoreBased: false,
      storeName: undefined,
      createdAt: new Date().toISOString(),
      views: 0,
    };

    // Save to store
    addMarketplaceListing(newListing);

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.navigate('/(tabs)');
  };

  const canSubmit = title.trim().length > 0 && price.length > 0 && category.length > 0 && selectedImages.length > 0;

  return (
    <View className="flex-1 bg-cream">
      <SafeAreaView edges={['top']} className="flex-1">
        {/* Header */}
        <View className="flex-row items-center justify-between px-5 py-4 border-b border-gray-100">
          <Pressable onPress={onBack} className="p-2 -ml-2">
            <X size={24} color="#2D1F1A" />
          </Pressable>
          <Text className="text-lg font-bold text-warmBrown">Sell an Item</Text>
          <Pressable onPress={handleSubmit} disabled={!canSubmit}>
            <LinearGradient
              colors={canSubmit ? ['#1B4D3E', '#153D31'] : ['#D1D5DB', '#9CA3AF']}
              style={{ borderRadius: 20, paddingVertical: 10, paddingHorizontal: 16 }}
            >
              <Text className="text-white font-semibold">List Item</Text>
            </LinearGradient>
          </Pressable>
        </View>

        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
          <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
            {/* Images */}
            <View className="py-4">
              <Text className="text-warmBrown font-semibold mb-3">Photos</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }}>
                <Pressable onPress={handlePickImage} className="w-24 h-24 bg-gray-100 rounded-xl items-center justify-center mr-3 border-2 border-dashed border-gray-300">
                  <ImagePlus size={28} color="#9CA3AF" />
                  <Text className="text-gray-400 text-xs mt-1">Add</Text>
                </Pressable>
                {selectedImages.map((uri, index) => (
                  <View key={index} className="mr-3 relative">
                    <Image source={{ uri }} style={{ width: 96, height: 96, borderRadius: 12 }} contentFit="cover" />
                    <Pressable onPress={() => setSelectedImages((prev) => prev.filter((_, i) => i !== index))} className="absolute -top-2 -right-2 bg-warmBrown rounded-full p-1">
                      <X size={12} color="#FFFFFF" />
                    </Pressable>
                  </View>
                ))}
              </ScrollView>
            </View>

            {/* Title */}
            <View className="mb-4">
              <Text className="text-warmBrown font-semibold mb-2">Title</Text>
              <TextInput
                placeholder="What are you selling?"
                placeholderTextColor="#9CA3AF"
                value={title}
                onChangeText={setTitle}
                className="bg-white rounded-xl px-4 py-3.5 text-warmBrown"
              />
            </View>

            {/* Price */}
            <View className="mb-4">
              <Text className="text-warmBrown font-semibold mb-2">Price</Text>
              <View className="flex-row items-center bg-white rounded-xl px-4">
                <DollarSign size={20} color="#8B7355" />
                <TextInput
                  placeholder="0.00"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="decimal-pad"
                  value={price}
                  onChangeText={setPrice}
                  className="flex-1 py-3.5 ml-2 text-warmBrown"
                />
              </View>
            </View>

            {/* Category */}
            <View className="mb-4">
              <Text className="text-warmBrown font-semibold mb-2">Category</Text>
              <Pressable onPress={() => setShowCategoryModal(true)} className="bg-white rounded-xl px-4 py-3.5 flex-row items-center justify-between">
                <View className="flex-row items-center">
                  <Tag size={20} color="#8B7355" />
                  <Text className={`ml-2 ${category ? 'text-warmBrown' : 'text-gray-400'}`}>
                    {category || 'Select category'}
                  </Text>
                </View>
                <ChevronRight size={20} color="#8B7355" />
              </Pressable>
            </View>

            {/* Condition */}
            <View className="mb-4">
              <Text className="text-warmBrown font-semibold mb-2">Condition</Text>
              <View className="flex-row">
                {(['new', 'used', 'refurbished'] as const).map((c) => (
                  <Pressable
                    key={c}
                    onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setCondition(c); }}
                    className={`flex-1 py-3 rounded-xl mr-2 last:mr-0 ${condition === c ? 'bg-forest-600' : 'bg-white'}`}
                  >
                    <Text className={`text-center font-medium capitalize ${condition === c ? 'text-white' : 'text-warmBrown'}`}>{c}</Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Description */}
            <View className="mb-4">
              <Text className="text-warmBrown font-semibold mb-2">Description</Text>
              <TextInput
                placeholder="Describe your item..."
                placeholderTextColor="#9CA3AF"
                multiline
                value={description}
                onChangeText={setDescription}
                className="bg-white rounded-xl px-4 py-3.5 text-warmBrown min-h-[100px]"
                style={{ textAlignVertical: 'top' }}
              />
            </View>

            <View className="h-8" />
          </ScrollView>
        </KeyboardAvoidingView>

        {/* Category Modal */}
        <Modal visible={showCategoryModal} animationType="slide" transparent>
          <View className="flex-1 bg-black/50 justify-end">
            <View className="bg-cream rounded-t-3xl max-h-[70%]">
              <View className="flex-row items-center justify-between px-5 py-4 border-b border-gray-100">
                <Text className="text-lg font-bold text-warmBrown">Select Category</Text>
                <Pressable onPress={() => setShowCategoryModal(false)}>
                  <X size={24} color="#2D1F1A" />
                </Pressable>
              </View>
              <ScrollView className="px-5 py-2">
                {MARKETPLACE_CATEGORIES.map((cat) => (
                  <Pressable
                    key={cat}
                    onPress={() => { setCategory(cat); setShowCategoryModal(false); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                    className="flex-row items-center py-4 border-b border-gray-100"
                  >
                    <Text className="flex-1 text-warmBrown">{cat}</Text>
                    {category === cat && <Check size={20} color="#1B4D3E" />}
                  </Pressable>
                ))}
                <View className="h-8" />
              </ScrollView>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </View>
  );
}

// Event Form
function CreateEventForm({ user, community, onBack }: { user: any; community: any; onBack: () => void }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [address, setAddress] = useState('');
  const [category, setCategory] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [eventImage, setEventImage] = useState<string | null>(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  const handlePickImage = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });

    if (!result.canceled && result.assets.length > 0) {
      setEventImage(result.assets[0].uri);
    }
  };

  const handleSubmit = () => {
    if (!title.trim() || !date || !time || !address.trim()) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.navigate('/(tabs)');
  };

  const canSubmit = title.trim().length > 0 && date.length > 0 && time.length > 0 && address.trim().length > 0;

  return (
    <View className="flex-1 bg-cream">
      <SafeAreaView edges={['top']} className="flex-1">
        {/* Header */}
        <View className="flex-row items-center justify-between px-5 py-4 border-b border-gray-100">
          <Pressable onPress={onBack} className="p-2 -ml-2">
            <X size={24} color="#2D1F1A" />
          </Pressable>
          <Text className="text-lg font-bold text-warmBrown">Create Event</Text>
          <Pressable onPress={handleSubmit} disabled={!canSubmit}>
            <LinearGradient
              colors={canSubmit ? ['#C9A227', '#A6841F'] : ['#D1D5DB', '#9CA3AF']}
              style={{ borderRadius: 20, paddingVertical: 10, paddingHorizontal: 16 }}
            >
              <Text className="text-white font-semibold">Create</Text>
            </LinearGradient>
          </Pressable>
        </View>

        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
          <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
            {/* Event Image */}
            <View className="py-4">
              <Text className="text-warmBrown font-semibold mb-3">Event Image</Text>
              <Pressable onPress={handlePickImage}>
                {eventImage ? (
                  <View className="relative">
                    <Image source={{ uri: eventImage }} style={{ width: '100%', height: 180, borderRadius: 16 }} contentFit="cover" />
                    <Pressable onPress={() => setEventImage(null)} className="absolute top-2 right-2 bg-warmBrown rounded-full p-2">
                      <X size={16} color="#FFFFFF" />
                    </Pressable>
                  </View>
                ) : (
                  <View className="w-full h-[180px] bg-gray-100 rounded-2xl items-center justify-center border-2 border-dashed border-gray-300">
                    <ImagePlus size={40} color="#9CA3AF" />
                    <Text className="text-gray-400 mt-2">Add event cover image</Text>
                  </View>
                )}
              </Pressable>
            </View>

            {/* Title */}
            <View className="mb-4">
              <Text className="text-warmBrown font-semibold mb-2">Event Title</Text>
              <TextInput
                placeholder="Give your event a name"
                placeholderTextColor="#9CA3AF"
                value={title}
                onChangeText={setTitle}
                className="bg-white rounded-xl px-4 py-3.5 text-warmBrown"
              />
            </View>

            {/* Date & Time */}
            <View className="flex-row mb-4">
              <View className="flex-1 mr-2">
                <Text className="text-warmBrown font-semibold mb-2">Date</Text>
                <View className="flex-row items-center bg-white rounded-xl px-4">
                  <Calendar size={20} color="#8B7355" />
                  <TextInput
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor="#9CA3AF"
                    value={date}
                    onChangeText={setDate}
                    className="flex-1 py-3.5 ml-2 text-warmBrown"
                  />
                </View>
              </View>
              <View className="flex-1 ml-2">
                <Text className="text-warmBrown font-semibold mb-2">Time</Text>
                <View className="flex-row items-center bg-white rounded-xl px-4">
                  <Clock size={20} color="#8B7355" />
                  <TextInput
                    placeholder="HH:MM"
                    placeholderTextColor="#9CA3AF"
                    value={time}
                    onChangeText={setTime}
                    className="flex-1 py-3.5 ml-2 text-warmBrown"
                  />
                </View>
              </View>
            </View>

            {/* Address */}
            <View className="mb-4">
              <Text className="text-warmBrown font-semibold mb-2">Location</Text>
              <View className="flex-row items-center bg-white rounded-xl px-4">
                <MapPin size={20} color="#8B7355" />
                <TextInput
                  placeholder="Event address"
                  placeholderTextColor="#9CA3AF"
                  value={address}
                  onChangeText={setAddress}
                  className="flex-1 py-3.5 ml-2 text-warmBrown"
                />
              </View>
            </View>

            {/* Category */}
            <View className="mb-4">
              <Text className="text-warmBrown font-semibold mb-2">Category</Text>
              <Pressable onPress={() => setShowCategoryModal(true)} className="bg-white rounded-xl px-4 py-3.5 flex-row items-center justify-between">
                <View className="flex-row items-center">
                  <Tag size={20} color="#8B7355" />
                  <Text className={`ml-2 ${category ? 'text-warmBrown' : 'text-gray-400'}`}>
                    {category || 'Select category'}
                  </Text>
                </View>
                <ChevronRight size={20} color="#8B7355" />
              </Pressable>
            </View>

            {/* Public/Private Toggle */}
            <View className="mb-4">
              <Text className="text-warmBrown font-semibold mb-3">Event Visibility</Text>
              <View className="bg-white rounded-xl p-4">
                <View className="flex-row items-center justify-between mb-4">
                  <View className="flex-row items-center flex-1">
                    <View className="bg-forest-100 rounded-full p-2 mr-3">
                      <Globe size={20} color="#1B4D3E" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-warmBrown font-medium">Public Event</Text>
                      <Text className="text-gray-500 text-sm">Anyone can see and RSVP</Text>
                    </View>
                  </View>
                  <Switch
                    value={isPublic}
                    onValueChange={setIsPublic}
                    trackColor={{ false: '#D1D5DB', true: '#1B4D3E' }}
                    thumbColor="#FFFFFF"
                  />
                </View>
                {!isPublic && (
                  <View className="flex-row items-center bg-gold-50 rounded-xl p-3">
                    <Lock size={16} color="#C9A227" />
                    <Text className="text-gold-700 text-sm ml-2 flex-1">
                      Only people you invite can see this event
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* Description */}
            <View className="mb-4">
              <Text className="text-warmBrown font-semibold mb-2">Description</Text>
              <TextInput
                placeholder="Tell people about your event..."
                placeholderTextColor="#9CA3AF"
                multiline
                value={description}
                onChangeText={setDescription}
                className="bg-white rounded-xl px-4 py-3.5 text-warmBrown min-h-[100px]"
                style={{ textAlignVertical: 'top' }}
              />
            </View>

            {/* RSVP Info */}
            <View className="bg-terracotta-50 rounded-xl p-4 mb-6">
              <View className="flex-row items-center">
                <Users size={20} color="#D4673A" />
                <Text className="text-terracotta-600 font-medium ml-2">RSVP Enabled</Text>
              </View>
              <Text className="text-terracotta-500 text-sm mt-1">
                Community members can RSVP to your event once it's published
              </Text>
            </View>

            <View className="h-8" />
          </ScrollView>
        </KeyboardAvoidingView>

        {/* Category Modal */}
        <Modal visible={showCategoryModal} animationType="slide" transparent>
          <View className="flex-1 bg-black/50 justify-end">
            <View className="bg-cream rounded-t-3xl max-h-[70%]">
              <View className="flex-row items-center justify-between px-5 py-4 border-b border-gray-100">
                <Text className="text-lg font-bold text-warmBrown">Event Category</Text>
                <Pressable onPress={() => setShowCategoryModal(false)}>
                  <X size={24} color="#2D1F1A" />
                </Pressable>
              </View>
              <ScrollView className="px-5 py-2">
                {EVENT_CATEGORIES.map((cat) => (
                  <Pressable
                    key={cat}
                    onPress={() => { setCategory(cat); setShowCategoryModal(false); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                    className="flex-row items-center py-4 border-b border-gray-100"
                  >
                    <Text className="flex-1 text-warmBrown">{cat}</Text>
                    {category === cat && <Check size={20} color="#C9A227" />}
                  </Pressable>
                ))}
                <View className="h-8" />
              </ScrollView>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </View>
  );
}
