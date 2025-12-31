import React from 'react';
import { View, Text, Pressable, Linking } from 'react-native';
import { Image } from 'expo-image';
import { ExternalLink, Clock } from 'lucide-react-native';
import Animated, { FadeIn, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import type { NewsArticle } from '@/lib/store';
import { formatNewsDate, getNewsCategoryColor } from '@/lib/news';

interface NewsCardProps {
  article: NewsArticle;
  variant?: 'full' | 'compact';
}

export function NewsCard({ article, variant = 'compact' }: NewsCardProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.98);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  const handlePress = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await Linking.openURL(article.url);
    } catch (error) {
      console.log('Failed to open URL:', error);
    }
  };

  const categoryColor = getNewsCategoryColor(article.category);

  if (variant === 'full') {
    return (
      <Animated.View entering={FadeIn.duration(400)} style={animatedStyle}>
        <Pressable
          onPress={handlePress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
        >
          <View className="bg-white rounded-2xl mx-4 mb-4 overflow-hidden shadow-sm">
            {article.imageUrl && (
              <Image
                source={{ uri: article.imageUrl }}
                style={{ width: '100%', height: 180 }}
                contentFit="cover"
              />
            )}
            <View className="p-4">
              {/* Category Badge */}
              {article.category && (
                <View
                  className="self-start px-2.5 py-1 rounded-full mb-2"
                  style={{ backgroundColor: `${categoryColor}15` }}
                >
                  <Text style={{ color: categoryColor }} className="text-xs font-semibold">
                    {article.category}
                  </Text>
                </View>
              )}

              {/* Title */}
              <Text className="text-warmBrown font-bold text-lg leading-snug" numberOfLines={2}>
                {article.title}
              </Text>

              {/* Description */}
              <Text className="text-gray-600 mt-2 leading-relaxed" numberOfLines={2}>
                {article.description}
              </Text>

              {/* Footer */}
              <View className="flex-row items-center justify-between mt-3 pt-3 border-t border-gray-100">
                <View className="flex-row items-center">
                  <Clock size={12} color="#9CA3AF" />
                  <Text className="text-gray-400 text-xs ml-1">
                    {formatNewsDate(article.publishedAt)}
                  </Text>
                  <Text className="text-gray-300 mx-2">•</Text>
                  <Text className="text-gray-500 text-xs font-medium">
                    {article.source}
                  </Text>
                </View>
                <ExternalLink size={14} color="#9CA3AF" />
              </View>
            </View>
          </View>
        </Pressable>
      </Animated.View>
    );
  }

  // Compact variant (for horizontal scroll)
  return (
    <Animated.View entering={FadeIn.duration(400)} style={animatedStyle}>
      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <View className="bg-white rounded-xl overflow-hidden shadow-sm" style={{ width: 280 }}>
          {article.imageUrl && (
            <Image
              source={{ uri: article.imageUrl }}
              style={{ width: '100%', height: 120 }}
              contentFit="cover"
            />
          )}
          <View className="p-3">
            {/* Category & Time */}
            <View className="flex-row items-center justify-between mb-1.5">
              {article.category && (
                <View
                  className="px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: `${categoryColor}15` }}
                >
                  <Text style={{ color: categoryColor }} className="text-[10px] font-semibold">
                    {article.category}
                  </Text>
                </View>
              )}
              <Text className="text-gray-400 text-[10px]">
                {formatNewsDate(article.publishedAt)}
              </Text>
            </View>

            {/* Title */}
            <Text className="text-warmBrown font-semibold text-sm leading-tight" numberOfLines={2}>
              {article.title}
            </Text>

            {/* Source */}
            <Text className="text-gray-400 text-xs mt-1.5">
              {article.source}
            </Text>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}
