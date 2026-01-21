import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useSegments } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Sparkles } from 'lucide-react-native';

export function FloatingAskIntera() {
  const insets = useSafeAreaInsets();
  const segments = useSegments();
  const current = segments[segments.length - 1] || '';

  // Hide on full-screen experiences / self-screen to avoid clutter.
  const hidden =
    current === 'clips' ||
    current === 'community-assistant' ||
    current === 'translator' ||
    current === 'welcome' ||
    current === 'story' ||
    current === 'signup' ||
    current === 'voice-rooms' ||
    current === 'voice-room' ||
    segments.includes('voice-room');

  if (hidden) return null;

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: 'absolute',
        right: 16,
        bottom: insets.bottom + 96,
        zIndex: 1000,
      }}
    >
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.push('/community-assistant');
        }}
        className="active:opacity-90"
        style={{
          backgroundColor: '#1B4D3E',
          borderRadius: 999,
          paddingHorizontal: 14,
          paddingVertical: 12,
          flexDirection: 'row',
          alignItems: 'center',
          shadowColor: '#000',
          shadowOpacity: 0.25,
          shadowRadius: 10,
          shadowOffset: { width: 0, height: 6 },
          elevation: 6,
        }}
      >
        <Sparkles size={18} color="#fff" />
        <Text style={{ color: '#fff', fontWeight: '800', marginLeft: 8 }}>Ask Intera</Text>
      </Pressable>
    </View>
  );
}

