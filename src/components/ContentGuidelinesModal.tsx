import React from 'react';
import { View, Text, Pressable, Modal, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Animated, { FadeIn, FadeOut, SlideInUp } from 'react-native-reanimated';
import { X, Shield, AlertTriangle, Check, Ban, Video, Mic } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { COMMUNITY_GUIDELINES, CONTENT_WARNINGS, type ContentType } from '@/lib/contentModeration';

interface ContentGuidelinesModalProps {
  visible: boolean;
  onClose: () => void;
  onAccept: () => void;
  contentType: ContentType;
}

export function ContentGuidelinesModal({
  visible,
  onClose,
  onAccept,
  contentType,
}: ContentGuidelinesModalProps) {
  const handleAccept = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onAccept();
  };

  const warnings = contentType === 'live_stream' || contentType === 'video'
    ? CONTENT_WARNINGS.beforeStream
    : CONTENT_WARNINGS.beforeUpload;

  const getIcon = () => {
    switch (contentType) {
      case 'video':
      case 'live_stream':
        return Video;
      case 'audio':
        return Mic;
      default:
        return Shield;
    }
  };

  const Icon = getIcon();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View className="flex-1">
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(200)}
          className="absolute inset-0"
        >
          <BlurView intensity={40} tint="dark" style={{ flex: 1 }}>
            <Pressable className="flex-1" onPress={onClose} />
          </BlurView>
        </Animated.View>

        <View className="flex-1 justify-center items-center px-4">
          <Animated.View
            entering={SlideInUp.springify().damping(15)}
            className="bg-gray-900 rounded-3xl w-full max-w-md max-h-[85%]"
          >
            {/* Header */}
            <LinearGradient
              colors={['#7C3AED', '#4C1D95']}
              style={{ borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20 }}
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center">
                  <View className="bg-white/20 rounded-full p-2">
                    <Icon size={24} color="white" />
                  </View>
                  <Text className="text-white font-bold text-xl ml-3">
                    Community Guidelines
                  </Text>
                </View>
                <Pressable onPress={onClose} className="bg-white/20 rounded-full p-2">
                  <X size={20} color="white" />
                </Pressable>
              </View>
            </LinearGradient>

            <ScrollView className="p-4" showsVerticalScrollIndicator={false}>
              {/* Warning Banner */}
              <View className="bg-red-500/10 rounded-xl p-4 mb-4 flex-row">
                <AlertTriangle size={24} color="#EF4444" />
                <View className="flex-1 ml-3">
                  <Text className="text-red-400 font-bold">Zero Tolerance Policy</Text>
                  <Text className="text-red-300 text-sm mt-1">
                    Sexual, violent, or harmful content results in immediate permanent ban.
                  </Text>
                </View>
              </View>

              {/* Key Rules */}
              <Text className="text-white font-bold text-lg mb-3">Before You Post</Text>

              {warnings.map((warning, index) => (
                <View key={index} className="flex-row mb-3">
                  <View className="bg-purple-500/20 rounded-full p-1.5 mt-0.5">
                    <Check size={14} color="#A855F7" />
                  </View>
                  <Text className="text-gray-300 flex-1 ml-3">{warning}</Text>
                </View>
              ))}

              {/* Prohibited Content */}
              <Text className="text-white font-bold text-lg mt-4 mb-3">Prohibited Content</Text>

              {[
                { icon: Ban, text: 'Sexual content or nudity', color: '#EF4444' },
                { icon: Ban, text: 'Violence, gore, or threats', color: '#EF4444' },
                { icon: Ban, text: 'Hate speech or discrimination', color: '#EF4444' },
                { icon: Ban, text: 'Illegal drugs or activities', color: '#F59E0B' },
                { icon: Ban, text: 'Scams or misleading content', color: '#F59E0B' },
                { icon: Ban, text: 'Harassment or bullying', color: '#F59E0B' },
              ].map((item, index) => (
                <View key={index} className="flex-row mb-2">
                  <item.icon size={18} color={item.color} />
                  <Text className="text-gray-400 ml-3">{item.text}</Text>
                </View>
              ))}

              {/* Consequences */}
              <View className="bg-gray-800 rounded-xl p-4 mt-4">
                <Text className="text-white font-semibold mb-2">Consequences</Text>
                <Text className="text-gray-400 text-sm">
                  1st offense: Warning{'\n'}
                  2nd offense: 24hr restriction{'\n'}
                  3rd offense: 7-day suspension{'\n'}
                  Severe violations: Permanent ban
                </Text>
              </View>

              <View className="h-4" />
            </ScrollView>

            {/* Accept Button */}
            <View className="p-4 border-t border-gray-800">
              <Pressable onPress={handleAccept} className="overflow-hidden rounded-xl">
                <LinearGradient
                  colors={['#22C55E', '#16A34A']}
                  style={{ paddingVertical: 16, alignItems: 'center' }}
                >
                  <Text className="text-white font-bold text-lg">
                    I Understand & Agree
                  </Text>
                </LinearGradient>
              </Pressable>

              <Text className="text-gray-500 text-xs text-center mt-3">
                By continuing, you agree to follow our Community Guidelines
              </Text>
            </View>
          </Animated.View>
        </View>
      </View>
    </Modal>
  );
}
