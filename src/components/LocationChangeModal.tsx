import React from 'react';
import { View, Text, Pressable, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MapPin, Navigation, X } from 'lucide-react-native';
import Animated, { FadeIn, SlideInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

interface LocationChangeModalProps {
  visible: boolean;
  detectedCity: string;
  detectedCountry: string;
  currentCity: string;
  currentCountry: string;
  onConfirm: () => void;
  onKeepCurrent: () => void;
  onDismiss: () => void;
}

export function LocationChangeModal({
  visible,
  detectedCity,
  detectedCountry,
  currentCity,
  currentCountry,
  onConfirm,
  onKeepCurrent,
  onDismiss,
}: LocationChangeModalProps) {
  const handleConfirm = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onConfirm();
  };

  const handleKeepCurrent = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onKeepCurrent();
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View className="flex-1 bg-black/50 justify-center items-center px-6">
        <Animated.View
          entering={SlideInUp.duration(300)}
          className="bg-cream rounded-3xl w-full max-w-sm overflow-hidden"
        >
          {/* Header */}
          <LinearGradient
            colors={['#D4673A', '#B85430']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ padding: 24, alignItems: 'center' }}
          >
            <View className="bg-white/20 rounded-full p-4 mb-3">
              <Navigation size={32} color="#FFFFFF" />
            </View>
            <Text className="text-white text-xl font-bold text-center">
              New Location Detected
            </Text>
            <Text className="text-white/80 text-center mt-1">
              Looks like you're in a different city
            </Text>
          </LinearGradient>

          {/* Content */}
          <View className="p-5">
            {/* Detected Location */}
            <View className="bg-forest-50 rounded-2xl p-4 mb-3">
              <Text className="text-forest-600 text-xs font-medium mb-2">DETECTED LOCATION</Text>
              <View className="flex-row items-center">
                <View className="bg-forest-100 rounded-full p-2 mr-3">
                  <MapPin size={20} color="#1B4D3E" />
                </View>
                <View className="flex-1">
                  <Text className="text-warmBrown font-bold text-lg">{detectedCity}</Text>
                  <Text className="text-gray-500 text-sm">{detectedCountry}</Text>
                </View>
              </View>
            </View>

            {/* Current Location */}
            <View className="bg-gray-100 rounded-2xl p-4 mb-5">
              <Text className="text-gray-500 text-xs font-medium mb-2">CURRENT COMMUNITY</Text>
              <View className="flex-row items-center">
                <View className="bg-gray-200 rounded-full p-2 mr-3">
                  <MapPin size={20} color="#8B7355" />
                </View>
                <View className="flex-1">
                  <Text className="text-warmBrown font-semibold text-lg">{currentCity}</Text>
                  <Text className="text-gray-500 text-sm">{currentCountry}</Text>
                </View>
              </View>
            </View>

            {/* Buttons */}
            <Pressable onPress={handleConfirm} className="mb-3">
              <LinearGradient
                colors={['#1B4D3E', '#153D31']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ borderRadius: 14, paddingVertical: 16, alignItems: 'center' }}
              >
                <Text className="text-white font-bold text-base">
                  Switch to {detectedCity}
                </Text>
              </LinearGradient>
            </Pressable>

            <Pressable
              onPress={handleKeepCurrent}
              className="bg-gray-100 rounded-2xl py-4 items-center mb-2"
            >
              <Text className="text-warmBrown font-semibold">
                Stay in {currentCity}
              </Text>
            </Pressable>

            <Pressable onPress={onDismiss} className="items-center py-2">
              <Text className="text-gray-400 text-sm">Don't ask again</Text>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}
