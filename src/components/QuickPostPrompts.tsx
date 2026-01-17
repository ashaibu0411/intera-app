import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import Animated, { FadeIn, FadeInRight } from 'react-native-reanimated';
import {
  HelpCircle,
  Users,
  Gift,
  Calendar,
  MapPin,
  Plus,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';

interface PostPrompt {
  id: string;
  type: 'question' | 'request' | 'offer' | 'invitation' | 'checkin';
  label: string;
  placeholder: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}

const POST_PROMPTS: PostPrompt[] = [
  {
    id: 'question',
    type: 'question',
    label: 'Ask',
    placeholder: 'Can someone help me...',
    icon: <HelpCircle size={18} color="#3B82F6" />,
    color: '#3B82F6',
    bgColor: '#DBEAFE',
  },
  {
    id: 'request',
    type: 'request',
    label: 'Looking for',
    placeholder: 'New here, looking for...',
    icon: <Users size={18} color="#EC4899" />,
    color: '#EC4899',
    bgColor: '#FCE7F3',
  },
  {
    id: 'offer',
    type: 'offer',
    label: 'Offer',
    placeholder: 'I can help with...',
    icon: <Gift size={18} color="#10B981" />,
    color: '#10B981',
    bgColor: '#D1FAE5',
  },
  {
    id: 'invitation',
    type: 'invitation',
    label: 'Invite',
    placeholder: 'Who wants to join...',
    icon: <Calendar size={18} color="#F59E0B" />,
    color: '#F59E0B',
    bgColor: '#FEF3C7',
  },
  {
    id: 'checkin',
    type: 'checkin',
    label: 'Check-in',
    placeholder: 'Anyone else experiencing...',
    icon: <MapPin size={18} color="#8B5CF6" />,
    color: '#8B5CF6',
    bgColor: '#EDE9FE',
  },
];

interface QuickPostPromptsProps {
  onPromptSelect?: (type: string, placeholder: string) => void;
}

export function QuickPostPrompts({ onPromptSelect }: QuickPostPromptsProps) {
  const handlePromptPress = (prompt: PostPrompt) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (onPromptSelect) {
      onPromptSelect(prompt.type, prompt.placeholder);
    }
    // Navigate to create screen with pre-filled prompt type
    router.push({
      pathname: '/create',
      params: { promptType: prompt.type, placeholder: prompt.placeholder },
    });
  };

  return (
    <Animated.View
      entering={FadeIn.duration(300)}
      className="mt-3"
    >
      {/* Prompt Pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16 }}
        style={{ flexGrow: 0 }}
      >
        {POST_PROMPTS.map((prompt, index) => (
          <Animated.View
            key={prompt.id}
            entering={FadeInRight.duration(200).delay(index * 30)}
          >
            <Pressable
              onPress={() => handlePromptPress(prompt)}
              className="flex-row items-center mr-2 px-3 py-2 rounded-full border"
              style={{
                backgroundColor: prompt.bgColor,
                borderColor: `${prompt.color}30`,
              }}
            >
              {prompt.icon}
              <Text
                className="text-sm font-medium ml-1.5"
                style={{ color: prompt.color }}
              >
                {prompt.label}
              </Text>
            </Pressable>
          </Animated.View>
        ))}
      </ScrollView>
    </Animated.View>
  );
}
