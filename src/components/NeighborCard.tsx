import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { MapPin, Heart, MessageCircle, Users, Briefcase, Sparkles } from 'lucide-react-native';
import Animated, { FadeIn, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import type { User } from '@/lib/store';

interface NeighborCardProps {
  user: User;
  lookingFor: 'friends' | 'dating' | 'networking' | 'all';
  aboutMe: string;
  isLiked: boolean;
  isConnected: boolean;
  onLike: () => void;
  onConnect: () => void;
}

const LOOKING_FOR_CONFIG = {
  friends: { label: 'Friends', icon: Users, color: '#1B4D3E' },
  dating: { label: 'Dating', icon: Heart, color: '#D4673A' },
  networking: { label: 'Networking', icon: Briefcase, color: '#C9A227' },
  all: { label: 'Open to all', icon: Sparkles, color: '#8B5CF6' },
};

export function NeighborCard({
  user,
  lookingFor,
  aboutMe,
  isLiked,
  isConnected,
  onLike,
  onConnect,
}: NeighborCardProps) {
  const scale = useSharedValue(1);
  const heartScale = useSharedValue(1);

  const config = LOOKING_FOR_CONFIG[lookingFor];
  const LookingForIcon = config.icon;

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const heartAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: heartScale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.98);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  const handleLike = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    heartScale.value = withSpring(1.3, {}, () => {
      heartScale.value = withSpring(1);
    });
    onLike();
  };

  const handleConnect = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onConnect();
  };

  const handleMessage = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/chat/${user.id}` as any);
  };

  return (
    <Animated.View entering={FadeIn.duration(400)} style={animatedStyle}>
      <Pressable onPressIn={handlePressIn} onPressOut={handlePressOut}>
        <View className="bg-white rounded-3xl mx-4 mb-4 overflow-hidden shadow-sm">
          {/* Image Section */}
          <View className="relative">
            <Image
              source={{ uri: user.avatar }}
              style={{ width: '100%', height: 280 }}
              contentFit="cover"
            />
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.7)']}
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: 120,
              }}
            />

            {/* Name and Location overlay */}
            <View className="absolute bottom-4 left-4 right-4">
              <Text className="text-white text-2xl font-bold">{user.name}</Text>
              <View className="flex-row items-center mt-1">
                <MapPin size={14} color="#FFFFFF" />
                <Text className="text-white/90 ml-1 text-sm">{user.location}</Text>
              </View>
            </View>

            {/* Looking For Badge */}
            <View
              className="absolute top-4 right-4 rounded-full px-3 py-1.5 flex-row items-center"
              style={{ backgroundColor: config.color }}
            >
              <LookingForIcon size={14} color="#FFFFFF" />
              <Text className="text-white text-xs font-medium ml-1.5">{config.label}</Text>
            </View>
          </View>

          {/* Content Section */}
          <View className="p-4">
            {/* Bio */}
            <Text className="text-warmBrown text-base leading-relaxed" numberOfLines={3}>
              {aboutMe || user.bio}
            </Text>

            {/* Interests */}
            {user.interests && user.interests.length > 0 && (
              <View className="flex-row flex-wrap mt-3 gap-2">
                {user.interests.slice(0, 4).map((interest, idx) => (
                  <View key={idx} className="bg-cream rounded-full px-3 py-1">
                    <Text className="text-warmBrown text-xs font-medium">{interest}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Action Buttons */}
            <View className="flex-row items-center mt-4 gap-3">
              {/* Like Button */}
              <Animated.View style={heartAnimatedStyle}>
                <Pressable
                  onPress={handleLike}
                  className={`w-12 h-12 rounded-full items-center justify-center ${
                    isLiked ? 'bg-red-500' : 'bg-gray-100'
                  }`}
                >
                  <Heart
                    size={22}
                    color={isLiked ? '#FFFFFF' : '#9CA3AF'}
                    fill={isLiked ? '#FFFFFF' : 'transparent'}
                  />
                </Pressable>
              </Animated.View>

              {/* Connect/Message Button */}
              {isConnected ? (
                <Pressable
                  onPress={handleMessage}
                  className="flex-1 bg-forest-700 rounded-full py-3.5 flex-row items-center justify-center"
                >
                  <MessageCircle size={18} color="#FFFFFF" />
                  <Text className="text-white font-semibold ml-2">Message</Text>
                </Pressable>
              ) : (
                <Pressable
                  onPress={handleConnect}
                  className="flex-1 bg-terracotta-500 rounded-full py-3.5 flex-row items-center justify-center"
                >
                  <Users size={18} color="#FFFFFF" />
                  <Text className="text-white font-semibold ml-2">Connect</Text>
                </Pressable>
              )}
            </View>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}
