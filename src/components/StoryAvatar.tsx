import React from 'react';
import { View, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Plus } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useStore, type UserStory } from '@/lib/store';

interface StoryAvatarProps {
  userId: string;
  avatarUrl: string;
  size?: number;
  showRing?: boolean;
  onPress?: () => void;
  isCurrentUser?: boolean;
}

/**
 * StoryAvatar - A profile picture component with story ring indicator
 *
 * When the user has an unseen story, a gradient ring is shown around their avatar.
 * Tapping on it opens their story. If no story and it's the current user, navigates to create story.
 */
export function StoryAvatar({
  userId,
  avatarUrl,
  size = 44,
  showRing = true,
  onPress,
  isCurrentUser = false,
}: StoryAvatarProps) {
  const userStories = useStore((s) => s.userStories);

  // Find if this user has stories
  const userStory: UserStory | undefined = userStories.find((s: UserStory) => s.userId === userId);
  const hasStory = userStory && userStory.stories.length > 0;
  const hasUnseenStory = userStory?.hasUnseenStories ?? false;

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (onPress) {
      onPress();
      return;
    }

    if (hasStory) {
      // Navigate to stories screen with the user's story
      router.push({
        pathname: '/stories',
        params: { userId },
      });
    } else if (isCurrentUser) {
      // Current user with no story - navigate to stories to create one
      router.push('/stories');
    }
    // For other users with no story, do nothing (or could show profile if that route exists)
  };

  const ringSize = size + 6;
  const innerSize = size - 2;

  // Current user with no story - show avatar with "add" indicator
  if (isCurrentUser && !hasStory) {
    return (
      <Pressable onPress={handlePress}>
        <View
          style={{
            width: ringSize,
            height: ringSize,
            borderRadius: ringSize / 2,
            borderWidth: 2,
            borderColor: '#7C3AED',
            borderStyle: 'dashed',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Image
            source={{ uri: avatarUrl }}
            style={{
              width: innerSize,
              height: innerSize,
              borderRadius: innerSize / 2,
            }}
            contentFit="cover"
          />
        </View>
        <View
          style={{
            position: 'absolute',
            bottom: -2,
            right: -2,
            backgroundColor: '#7C3AED',
            borderRadius: 10,
            width: 20,
            height: 20,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 2,
            borderColor: 'white',
          }}
        >
          <Plus size={12} color="white" />
        </View>
      </Pressable>
    );
  }

  // If no story or ring disabled, just show avatar
  if (!showRing || !hasStory) {
    return (
      <Pressable onPress={handlePress}>
        <Image
          source={{ uri: avatarUrl }}
          style={{ width: size, height: size, borderRadius: size / 2 }}
          contentFit="cover"
        />
      </Pressable>
    );
  }

  // Show avatar with story ring
  return (
    <Pressable onPress={handlePress}>
      <LinearGradient
        colors={hasUnseenStory ? ['#7C3AED', '#EC4899', '#F97316'] : ['#9CA3AF', '#9CA3AF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          width: ringSize,
          height: ringSize,
          borderRadius: ringSize / 2,
          padding: 2,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <View
          style={{
            width: innerSize + 2,
            height: innerSize + 2,
            borderRadius: (innerSize + 2) / 2,
            backgroundColor: 'white',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Image
            source={{ uri: avatarUrl }}
            style={{
              width: innerSize,
              height: innerSize,
              borderRadius: innerSize / 2,
            }}
            contentFit="cover"
          />
        </View>
      </LinearGradient>
    </Pressable>
  );
}
