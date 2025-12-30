import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { X, ImagePlus, MapPin, Send } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInUp, useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { useStore, MOCK_USERS, MOCK_COMMUNITIES } from '@/lib/store';
import { router } from 'expo-router';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function CreatePostScreen() {
  const [content, setContent] = useState('');
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const currentCommunity = useStore((s) => s.currentCommunity);

  const displayCommunity = currentCommunity ?? MOCK_COMMUNITIES[0];
  const user = MOCK_USERS[0];

  const buttonScale = useSharedValue(1);

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

  const removeImage = (index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handlePost = () => {
    if (!content.trim()) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    // In a real app, this would submit to an API
    router.back();
  };

  const handlePressIn = () => {
    buttonScale.value = withSpring(0.95, { damping: 15, stiffness: 200 });
  };

  const handlePressOut = () => {
    buttonScale.value = withSpring(1, { damping: 15, stiffness: 200 });
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
          <View className="flex-row items-center">
            <Image
              source={{ uri: user.avatar }}
              style={{ width: 40, height: 40, borderRadius: 20 }}
              contentFit="cover"
            />
            <View className="ml-3">
              <Text className="text-warmBrown font-semibold">{user.name}</Text>
              <View className="flex-row items-center mt-0.5">
                <MapPin size={12} color="#8B7355" />
                <Text className="text-sm text-gray-500 ml-1">{displayCommunity.city}</Text>
              </View>
            </View>
          </View>

          <AnimatedPressable
            style={buttonAnimatedStyle}
            onPress={handlePost}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            disabled={!canPost}
          >
            <LinearGradient
              colors={canPost ? ['#D4673A', '#B85430'] : ['#D1D5DB', '#9CA3AF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ borderRadius: 20, paddingVertical: 10, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center' }}
            >
              <Send size={16} color="#FFFFFF" />
              <Text className="text-white font-semibold ml-2">Post</Text>
            </LinearGradient>
          </AnimatedPressable>
        </Animated.View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
        >
          <ScrollView className="flex-1" keyboardShouldPersistTaps="handled">
            {/* Text Input */}
            <Animated.View entering={FadeInUp.duration(400).delay(100)} className="p-5">
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
            </Animated.View>

            {/* Selected Images */}
            {selectedImages.length > 0 && (
              <Animated.View
                entering={FadeInUp.duration(400)}
                className="px-5 pb-4"
              >
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={{ flexGrow: 0 }}
                >
                  {selectedImages.map((uri, index) => (
                    <View key={index} className="mr-3 relative">
                      <Image
                        source={{ uri }}
                        style={{ width: 120, height: 120, borderRadius: 12 }}
                        contentFit="cover"
                      />
                      <Pressable
                        onPress={() => removeImage(index)}
                        className="absolute -top-2 -right-2 bg-warmBrown rounded-full p-1.5"
                      >
                        <X size={14} color="#FFFFFF" />
                      </Pressable>
                    </View>
                  ))}
                </ScrollView>
              </Animated.View>
            )}
          </ScrollView>

          {/* Bottom Actions */}
          <Animated.View
            entering={FadeInUp.duration(400).delay(200)}
            className="px-5 py-4 border-t border-gray-100 bg-white"
          >
            <View className="flex-row items-center">
              <Pressable
                onPress={handlePickImage}
                className="flex-row items-center bg-terracotta-50 rounded-full px-4 py-2.5"
              >
                <ImagePlus size={20} color="#D4673A" />
                <Text className="text-terracotta-500 font-medium ml-2">Add Photo</Text>
              </Pressable>

              <View className="flex-1" />

              <Text className="text-gray-400 text-sm">
                {content.length}/500
              </Text>
            </View>
          </Animated.View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
