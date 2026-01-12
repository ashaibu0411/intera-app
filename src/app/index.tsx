import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { router, useRootNavigationState } from 'expo-router';
import { useStore } from '@/lib/store';

export default function Index() {
  const hasSeenStory = useStore((s) => s.hasSeenStory);
  const rootNavigationState = useRootNavigationState();

  useEffect(() => {
    // Wait for the navigation state to be ready
    if (!rootNavigationState?.key) return;

    // Navigate based on whether user has seen the story
    if (!hasSeenStory) {
      router.replace('/story');
    } else {
      router.replace('/(tabs)');
    }
  }, [rootNavigationState?.key, hasSeenStory]);

  // Show loading while determining route
  return (
    <View style={{ flex: 1, backgroundColor: '#062A1E', alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator size="large" color="#C9A227" />
    </View>
  );
}
