import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Stack, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

export default function VoiceRoomsScreen() {
  return (
    <View className="flex-1 bg-[#0A0A0F]">
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Voice Rooms',
          headerStyle: { backgroundColor: '#0A0A0F' },
          headerTintColor: '#FFFFFF',
          headerTitleStyle: { fontWeight: '700' },
        }}
      />

      <SafeAreaView edges={['bottom']} className="flex-1">
        <View className="px-5 pt-6">
          <Text className="text-white text-2xl font-extrabold">Coming soon</Text>
          <Text className="text-gray-400 mt-2">
            Voice Rooms needs real live audio infrastructure (WebRTC) to be reliable. The previous version was a mock/demo
            screen and could feel glitchy.
          </Text>

          <View className="mt-6 bg-white/5 border border-white/10 rounded-2xl p-4">
            <Text className="text-white font-semibold">Planned</Text>
            <Text className="text-gray-400 mt-2">
              - Live audio rooms (WebRTC)\n- Moderation + invite-only rooms\n- Scheduled rooms + push notifications\n- Better performance + crash-free navigation
            </Text>
          </View>

          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.back();
            }}
            className="mt-6 bg-white rounded-2xl py-3 items-center"
          >
            <Text className="text-gray-900 font-semibold">Go back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}
