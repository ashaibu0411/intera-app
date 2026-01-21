import React, { useMemo } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  Sparkles,
  MessageCircle,
  Home,
  Briefcase,
  GraduationCap,
  Heart,
  Car,
  ShoppingBag,
  Users,
  MapPin,
} from 'lucide-react-native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useStore } from '@/lib/store';

type JourneyCard = {
  day: number;
  title: string;
  description: string;
  icon: React.ComponentType<{ size?: number; color?: string }>;
  askPrompt: string;
};

function daysSince(iso?: string) {
  if (!iso) return 0;
  const start = new Date(iso);
  const now = new Date();
  const diff = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(0, diff);
}

const DEFAULT_CARDS: JourneyCard[] = [
  {
    day: 1,
    title: 'Say hello (no pressure)',
    description: 'Introduce yourself and what you’re looking for.',
    icon: Users,
    askPrompt: 'I just arrived. What should I know first in this city?',
  },
  {
    day: 2,
    title: 'Housing basics',
    description: 'Get tips on neighborhoods, leases, roommates, and red flags.',
    icon: Home,
    askPrompt: 'What are safe, affordable neighborhoods to live in here?',
  },
  {
    day: 3,
    title: 'Jobs & networking',
    description: 'Find where people hire and who can refer you.',
    icon: Briefcase,
    askPrompt: 'Where do people in the community find jobs fastest here?',
  },
  {
    day: 4,
    title: 'Transportation',
    description: 'Learn transit options, license steps, and cheap commuting.',
    icon: Car,
    askPrompt: 'What’s the best way to get around here without a car?',
  },
  {
    day: 5,
    title: 'Schools & learning',
    description: 'Schools, ESL, credential transfer, and scholarships.',
    icon: GraduationCap,
    askPrompt: 'What are the best schools or programs for newcomers here?',
  },
  {
    day: 6,
    title: 'Healthcare setup',
    description: 'Clinics, insurance basics, and trusted doctors.',
    icon: Heart,
    askPrompt: 'How do I find a good doctor and set up healthcare here?',
  },
  {
    day: 7,
    title: 'Shopping & essentials',
    description: 'Groceries, markets, phone plans, and affordable stores.',
    icon: ShoppingBag,
    askPrompt: 'Where can I find African groceries and affordable essentials nearby?',
  },
  {
    day: 8,
    title: 'Community places',
    description: 'Find gatherings, groups, and safe places to meet people.',
    icon: MapPin,
    askPrompt: 'What community events or groups should I join this month?',
  },
];

function build30Days(cityLabel: string) {
  const base = DEFAULT_CARDS.map((c) => ({
    ...c,
    askPrompt: c.askPrompt.replace('here', cityLabel ? `in ${cityLabel}` : 'here'),
  }));

  const extra: JourneyCard[] = [];
  for (let d = 9; d <= 30; d++) {
    extra.push({
      day: d,
      title: d % 3 === 0 ? 'Build your circle' : d % 3 === 1 ? 'Handle paperwork' : 'Find your rhythm',
      description:
        d % 3 === 0
          ? 'Meet 1 new person and join one group chat or meetup.'
          : d % 3 === 1
            ? 'Ask for a checklist for documents, banking, and services.'
            : 'Get one local recommendation that saves you time or money.',
      icon: d % 3 === 0 ? Users : d % 3 === 1 ? FileFallbackIcon : Sparkles,
      askPrompt:
        d % 3 === 0
          ? `Introduce me to newcomer-friendly groups in ${cityLabel}.`
          : d % 3 === 1
            ? `What’s a practical newcomer checklist for ${cityLabel}?`
            : `What’s one local tip that saves money in ${cityLabel}?`,
    });
  }
  return [...base, ...extra];
}

function FileFallbackIcon({ size = 20, color = '#fff' }: { size?: number; color?: string }) {
  return <MessageCircle size={size} color={color} />;
}

export default function NewcomerJourneyScreen() {
  const currentUser = useStore((s) => s.currentUser);
  const selectedLocation = useStore((s) => s.selectedLocation);
  const completedDays = useStore((s) => s.newcomerJourney.completedDays);
  const completeDay = useStore((s) => s.completeNewcomerJourneyDay);
  const setLastOpened = useStore((s) => s.setNewcomerJourneyLastOpenedAt);

  const cityLabel = (currentUser?.arrivalCity || selectedLocation?.city || '').trim();
  const startIso = currentUser?.arrivalDate;

  const currentDay = useMemo(() => {
    const day = daysSince(startIso) + 1;
    return Math.max(1, Math.min(30, day));
  }, [startIso]);

  const cards = useMemo(() => build30Days(cityLabel || 'your city'), [cityLabel]);

  const completedSet = useMemo(() => new Set(completedDays || []), [completedDays]);
  const completedCount = completedSet.size;

  React.useEffect(() => {
    setLastOpened(new Date().toISOString());
  }, [setLastOpened]);

  return (
    <View className="flex-1 bg-cream">
      <SafeAreaView edges={['top']} className="flex-1">
        {/* Header */}
        <Animated.View entering={FadeIn.duration(250)} className="px-5 pt-4 pb-4 border-b border-gray-100">
          <View className="flex-row items-center">
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.back();
              }}
              className="mr-3 bg-white rounded-full p-2 shadow-sm"
            >
              <ArrowLeft size={22} color="#2D1F1A" />
            </Pressable>
            <View className="flex-1">
              <Text className="text-xl font-bold text-warmBrown">30‑Day Newcomer Journey</Text>
              <Text className="text-gray-500 text-sm mt-0.5">
                Day {currentDay}/30 • {completedCount} completed
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Progress */}
        <View className="px-5 pt-4">
          <LinearGradient
            colors={['#10B981', '#059669']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ borderRadius: 18, padding: 16 }}
          >
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-white font-bold text-base">Your plan for {cityLabel || 'your city'}</Text>
                <Text className="text-white/85 text-xs mt-0.5">
                  One small step daily. Ask the community when you’re stuck.
                </Text>
              </View>
              <Sparkles size={20} color="#fff" />
            </View>
            <View className="mt-3 h-2 bg-white/25 rounded-full overflow-hidden">
              <View
                style={{ width: `${Math.min(100, Math.round((completedCount / 30) * 100))}%` }}
                className="h-full bg-white rounded-full"
              />
            </View>
          </LinearGradient>
        </View>

        <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 28 }}>
          <View className="px-5 pt-4">
            {cards.map((c, idx) => {
              const done = completedSet.has(c.day);
              const isToday = c.day === currentDay;
              const Icon = c.icon;
              return (
                <Animated.View key={c.day} entering={FadeInUp.duration(220).delay(Math.min(240, idx * 12))} className="mb-3">
                  <View className={`bg-white rounded-2xl border ${isToday ? 'border-emerald-300' : 'border-gray-100'} shadow-sm`}>
                    <View className="p-4">
                      <View className="flex-row items-start">
                        <View className={`w-10 h-10 rounded-full items-center justify-center ${done ? 'bg-emerald-100' : 'bg-gray-100'}`}>
                          <Icon size={18} color={done ? '#059669' : '#6B7280'} />
                        </View>
                        <View className="flex-1 ml-3">
                          <View className="flex-row items-center justify-between">
                            <Text className="text-warmBrown font-bold">
                              Day {c.day}: {c.title}
                            </Text>
                            {done ? <CheckCircle2 size={18} color="#10B981" /> : <Circle size={18} color="#9CA3AF" />}
                          </View>
                          <Text className="text-gray-500 text-sm mt-1">{c.description}</Text>
                          <View className="flex-row mt-3 gap-2">
                            <Pressable
                              onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                completeDay(c.day);
                              }}
                              className={`px-4 py-2 rounded-full ${done ? 'bg-emerald-50' : 'bg-gray-900'}`}
                            >
                              <Text className={`${done ? 'text-emerald-700' : 'text-white'} font-semibold`}>
                                {done ? 'Completed' : 'Mark done'}
                              </Text>
                            </Pressable>
                            <Pressable
                              onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                router.push({
                                  pathname: '/community-assistant',
                                  params: { q: c.askPrompt },
                                } as any);
                              }}
                              className="flex-row items-center px-4 py-2 rounded-full bg-white border border-gray-200"
                            >
                              <MessageCircle size={16} color="#111827" />
                              <Text className="ml-2 text-gray-900 font-semibold">Ask Intera</Text>
                            </Pressable>
                          </View>
                        </View>
                      </View>
                    </View>
                  </View>
                </Animated.View>
              );
            })}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

