import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, Pressable, ScrollView, TextInput, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Bot, Send, Sparkles, ArrowLeft, ExternalLink } from 'lucide-react-native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useStore } from '@/lib/store';
import { askAiCommunityAssistant, type AiAssistantSource } from '@/lib/aiCommunityAssistant';

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  sources?: AiAssistantSource[];
};

const SUGGESTED = [
  'Where can I find a trusted plumber near me?',
  'Any safe apartments in my area under $800?',
  'Who can help with visa paperwork in my city?',
  'Is there a good African grocery store nearby?',
];

export default function CommunityAssistantScreen() {
  const selectedLocation = useStore((s) => s.selectedLocation);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const locationLabel = useMemo(() => {
    const city = selectedLocation?.city?.trim();
    const country = selectedLocation?.country?.trim();
    if (city && country) return `${city}, ${country}`;
    return city || country || 'your area';
  }, [selectedLocation?.city, selectedLocation?.country]);

  useEffect(() => {
    const welcome: Message = {
      id: 'welcome',
      role: 'assistant',
      content:
        `Hi — I’m your Community Assistant.\n\n` +
        `Ask anything about ${locationLabel}: services, housing, events, trusted providers, and local tips.\n\n` +
        `I’ll answer using community posts + listings + businesses (no guessing).`,
      timestamp: new Date(),
    };
    setMessages([welcome]);
  }, [locationLabel]);

  const sendMessage = async (text: string) => {
    const q = text.trim();
    if (!q || isLoading) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const userMessage: Message = {
      id: `${Date.now()}_u`,
      role: 'user',
      content: q,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 50);

    try {
      const res = await askAiCommunityAssistant({
        query: q,
        location: {
          country: selectedLocation?.country ?? null,
          city: selectedLocation?.city ?? null,
          neighborhood: selectedLocation?.neighborhood ?? null,
        },
      });

      const assistantMessage: Message = {
        id: `${Date.now()}_a`,
        role: 'assistant',
        content: res.answer,
        sources: res.sources,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (e: any) {
      let extra = '';
      const status =
        e?.context?.response?.status ??
        e?.context?.status ??
        e?.status ??
        undefined;

      if (typeof status === 'number') {
        extra += `\n\nHTTP ${status}`;
      }

      try {
        const resp = e?.context?.response;
        if (resp && typeof resp.text === 'function') {
          const t = await resp.text();
          const trimmed = String(t || '').trim();
          if (trimmed) extra += `\n${trimmed}`;
        }
      } catch {
        // ignore
      }

      const assistantMessage: Message = {
        id: `${Date.now()}_e`,
        role: 'assistant',
        content:
          `I couldn’t reach the assistant service.\n\n` +
          `Most common fix: in Supabase → Edge Functions → \`ai-community-assistant\`, turn OFF “JWT verification / Require authentication”, then redeploy.\n\n` +
          `Error: ${String(e?.message ?? e)}${extra}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } finally {
      setIsLoading(false);
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 50);
    }
  };

  const latestSources = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      const m = messages[i];
      if (m.role === 'assistant' && m.sources?.length) return m.sources;
    }
    return [];
  }, [messages]);

  return (
    <View className="flex-1 bg-[#0A0A0A]">
      <SafeAreaView edges={['top']} className="flex-1">
        {/* Header */}
        <View className="px-5 pt-4 pb-3 flex-row items-center">
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.back();
            }}
            className="w-10 h-10 rounded-full bg-white/10 items-center justify-center mr-3"
          >
            <ArrowLeft size={20} color="#fff" />
          </Pressable>
          <View className="flex-1">
            <Text className="text-white text-xl font-bold">Community Assistant</Text>
            <Text className="text-gray-400 text-sm">Powered by your community • {locationLabel}</Text>
          </View>
          <View className="w-10 h-10 rounded-full bg-emerald-500/20 items-center justify-center">
            <Bot size={18} color="#10B981" />
          </View>
        </View>

        {/* Suggestions */}
        {messages.length <= 1 ? (
          <Animated.View entering={FadeInUp.duration(350)} className="px-5 pb-3">
            <Text className="text-gray-400 text-xs mb-2">TRY ASKING</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {SUGGESTED.map((q) => (
                <Pressable
                  key={q}
                  onPress={() => sendMessage(q)}
                  className="bg-white/5 border border-white/10 rounded-full px-4 py-2"
                >
                  <Text className="text-white">{q}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </Animated.View>
        ) : null}

        {/* Chat */}
        <ScrollView
          ref={scrollViewRef}
          className="flex-1 px-5"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 140 }}
        >
          {messages.map((m) => (
            <Animated.View key={m.id} entering={FadeIn.duration(160)} className="mb-4">
              {m.role === 'user' ? (
                <View className="self-end max-w-[90%]">
                  <LinearGradient
                    colors={['#10B981', '#059669']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{ borderRadius: 18, paddingHorizontal: 14, paddingVertical: 12 }}
                  >
                    <Text className="text-white text-base leading-6">{m.content}</Text>
                  </LinearGradient>
                </View>
              ) : (
                <View className="self-start max-w-[92%]">
                  <View className="flex-row items-center mb-2">
                    <View className="w-8 h-8 rounded-full bg-emerald-500/20 items-center justify-center mr-2">
                      <Sparkles size={16} color="#10B981" />
                    </View>
                    <Text className="text-gray-300 font-semibold">Assistant</Text>
                  </View>
                  <View className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3">
                    <Text className="text-gray-100 text-[15px] leading-6">{m.content}</Text>
                  </View>
                </View>
              )}
            </Animated.View>
          ))}

          {isLoading ? (
            <Animated.View entering={FadeIn} className="flex-row items-center gap-2 mb-4">
              <View className="w-8 h-8 rounded-full bg-emerald-500/20 items-center justify-center">
                <Bot size={16} color="#10B981" />
              </View>
              <View className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3">
                <View className="flex-row items-center gap-2">
                  <ActivityIndicator size="small" color="#10B981" />
                  <Text className="text-gray-400 text-sm">Thinking…</Text>
                </View>
              </View>
            </Animated.View>
          ) : null}
        </ScrollView>

        {/* Sources strip */}
        {latestSources.length ? (
          <View className="absolute left-0 right-0 bottom-[78px] px-5">
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
              {latestSources.slice(0, 8).map((s) => (
                <Pressable
                  key={`${s.type}:${s.id}`}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    router.push(s.route as any);
                  }}
                  className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3"
                  style={{ width: 220 }}
                >
                  <View className="flex-row items-center justify-between">
                    <Text className="text-white font-semibold" numberOfLines={1}>
                      {s.title}
                    </Text>
                    <ExternalLink size={14} color="#9CA3AF" />
                  </View>
                  <Text className="text-gray-400 text-xs mt-1" numberOfLines={2}>
                    {s.snippet}
                  </Text>
                  <Text className="text-emerald-400 text-[10px] mt-2 uppercase">
                    {s.type}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        ) : null}

        {/* Input */}
        <View className="absolute left-0 right-0 bottom-0 px-5 pb-6 pt-3 bg-[#0A0A0A] border-t border-white/10">
          <View className="flex-row items-end gap-2">
            <View className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 min-h-[48px] max-h-[120px]">
              <TextInput
                value={inputText}
                onChangeText={setInputText}
                placeholder={`Ask about ${locationLabel}…`}
                placeholderTextColor="#9CA3AF"
                className="text-white text-base"
                multiline
                style={{ maxHeight: 100 }}
                onSubmitEditing={() => sendMessage(inputText)}
                blurOnSubmit={false}
              />
            </View>
            <Pressable
              onPress={() => sendMessage(inputText)}
              disabled={!inputText.trim() || isLoading}
              className={`w-12 h-12 rounded-full items-center justify-center ${
                inputText.trim() && !isLoading ? 'bg-emerald-500' : 'bg-white/10'
              }`}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Send size={20} color={inputText.trim() ? '#fff' : '#6B7280'} />
              )}
            </Pressable>
          </View>
          <Text className="text-gray-500 text-[10px] text-center mt-2">
            Uses community posts/listings for answers. Verify important info.
          </Text>
        </View>
      </SafeAreaView>
    </View>
  );
}

