import React, { useState } from 'react';
import { View, Text, Pressable, Modal, TextInput, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Animated, { FadeIn, FadeOut, SlideInUp } from 'react-native-reanimated';
import { X, AlertTriangle, Shield, Check, ChevronRight } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { REPORT_REASONS, type ViolationType, type ContentType } from '@/lib/contentModeration';

interface ReportContentModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (reason: ViolationType, description: string) => void;
  contentType: ContentType;
  contentId: string;
}

export function ReportContentModal({
  visible,
  onClose,
  onSubmit,
  contentType,
  contentId,
}: ReportContentModalProps) {
  const [selectedReason, setSelectedReason] = useState<ViolationType | null>(null);
  const [description, setDescription] = useState('');
  const [step, setStep] = useState<'reason' | 'details' | 'submitted'>('reason');

  const handleSelectReason = (reason: ViolationType) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedReason(reason);
    setStep('details');
  };

  const handleSubmit = () => {
    if (!selectedReason) return;

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onSubmit(selectedReason, description);
    setStep('submitted');

    // Auto close after showing confirmation
    setTimeout(() => {
      handleClose();
    }, 2000);
  };

  const handleClose = () => {
    setSelectedReason(null);
    setDescription('');
    setStep('reason');
    onClose();
  };

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (step === 'details') {
      setStep('reason');
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <View className="flex-1">
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(200)}
          className="absolute inset-0"
        >
          <BlurView intensity={40} tint="dark" style={{ flex: 1 }}>
            <Pressable className="flex-1" onPress={handleClose} />
          </BlurView>
        </Animated.View>

        <View className="flex-1 justify-end">
          <Animated.View
            entering={SlideInUp.springify().damping(15)}
            className="bg-gray-900 rounded-t-3xl max-h-[80%]"
          >
            {/* Header */}
            <View className="flex-row items-center justify-between p-4 border-b border-gray-800">
              {step === 'details' ? (
                <Pressable onPress={handleBack} className="p-2 -ml-2">
                  <Text className="text-purple-400 font-medium">Back</Text>
                </Pressable>
              ) : (
                <View className="w-16" />
              )}

              <View className="flex-row items-center">
                <AlertTriangle size={20} color="#EF4444" />
                <Text className="text-white font-bold text-lg ml-2">
                  {step === 'submitted' ? 'Report Submitted' : 'Report Content'}
                </Text>
              </View>

              <Pressable onPress={handleClose} className="p-2 -mr-2">
                <X size={24} color="#9CA3AF" />
              </Pressable>
            </View>

            {/* Content */}
            {step === 'submitted' ? (
              <View className="p-6 items-center">
                <View className="bg-green-500/20 rounded-full p-4 mb-4">
                  <Check size={40} color="#22C55E" />
                </View>
                <Text className="text-white font-bold text-xl text-center">
                  Thank You
                </Text>
                <Text className="text-gray-400 text-center mt-2">
                  Your report has been submitted. Our team will review this content and take appropriate action.
                </Text>
              </View>
            ) : step === 'reason' ? (
              <ScrollView className="p-4">
                <Text className="text-gray-400 text-sm mb-4">
                  Why are you reporting this {contentType.replace('_', ' ')}?
                </Text>

                {REPORT_REASONS.map((reason) => (
                  <Pressable
                    key={reason.value}
                    onPress={() => handleSelectReason(reason.value)}
                    className="bg-gray-800 rounded-xl p-4 mb-3 flex-row items-center"
                  >
                    <View className="flex-1">
                      <Text className="text-white font-semibold">{reason.label}</Text>
                      <Text className="text-gray-400 text-sm mt-1">{reason.description}</Text>
                    </View>
                    <ChevronRight size={20} color="#6B7280" />
                  </Pressable>
                ))}

                <View className="h-8" />
              </ScrollView>
            ) : (
              <View className="p-4">
                <View className="bg-gray-800 rounded-xl p-3 mb-4">
                  <Text className="text-purple-400 font-medium text-sm">
                    Reporting for: {REPORT_REASONS.find(r => r.value === selectedReason)?.label}
                  </Text>
                </View>

                <Text className="text-gray-400 text-sm mb-2">
                  Additional details (optional)
                </Text>
                <TextInput
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Provide more context about your report..."
                  placeholderTextColor="#6B7280"
                  multiline
                  numberOfLines={4}
                  className="bg-gray-800 rounded-xl p-4 text-white min-h-[120px]"
                  textAlignVertical="top"
                />

                <View className="bg-amber-500/10 rounded-xl p-4 mt-4 flex-row">
                  <Shield size={20} color="#F59E0B" />
                  <Text className="text-amber-200 text-sm flex-1 ml-3">
                    False reports may result in action against your account. Only report genuine violations.
                  </Text>
                </View>

                <Pressable
                  onPress={handleSubmit}
                  className="mt-4 overflow-hidden rounded-xl"
                >
                  <LinearGradient
                    colors={['#EF4444', '#DC2626']}
                    style={{ paddingVertical: 16, alignItems: 'center' }}
                  >
                    <Text className="text-white font-bold text-lg">Submit Report</Text>
                  </LinearGradient>
                </Pressable>

                <View className="h-8" />
              </View>
            )}
          </Animated.View>
        </View>
      </View>
    </Modal>
  );
}
