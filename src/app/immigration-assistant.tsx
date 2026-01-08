import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ChevronLeft,
  Send,
  Bot,
  User,
  Sparkles,
  Globe,
  Briefcase,
  GraduationCap,
  FileText,
  HelpCircle,
  Stethoscope,
  Code,
  Calculator,
  Wrench,
} from 'lucide-react-native';
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface QuickQuestion {
  icon: React.ReactNode;
  text: string;
  category: string;
}

const QUICK_QUESTIONS: QuickQuestion[] = [
  {
    icon: <Stethoscope size={16} color="#10B981" />,
    text: "How do I become a nurse in the USA from Ghana?",
    category: "Nursing",
  },
  {
    icon: <Code size={16} color="#6366F1" />,
    text: "What visa do software engineers need to work in America?",
    category: "Tech",
  },
  {
    icon: <GraduationCap size={16} color="#F59E0B" />,
    text: "How can I get a scholarship to study abroad?",
    category: "Education",
  },
  {
    icon: <FileText size={16} color="#EC4899" />,
    text: "What documents do I need for a work visa?",
    category: "Visa",
  },
  {
    icon: <Briefcase size={16} color="#8B5CF6" />,
    text: "Which countries sponsor visas for healthcare workers?",
    category: "Jobs",
  },
  {
    icon: <Calculator size={16} color="#14B8A6" />,
    text: "How do I transfer my accounting credentials to the UK?",
    category: "Finance",
  },
];

const SYSTEM_PROMPT = `You are an expert immigration advisor and career counselor specializing in helping professionals from developing countries (especially Africa, the Caribbean, and Asia) relocate to work or study in countries like the USA, UK, Canada, Australia, and Germany.

Your expertise includes:
- Work visa processes (H-1B, EB-3, Skilled Worker visas, etc.)
- Professional licensing and credential evaluation (CGFNS, WES, NACES)
- Healthcare worker immigration (nurses, doctors, physical therapists)
- Tech worker immigration (software engineers, data scientists)
- Student visas and scholarship opportunities
- Family-based immigration
- Document requirements and timelines
- Cost estimates and financial planning
- Job search strategies for sponsored positions

When answering:
1. Be specific and actionable with step-by-step guidance
2. Include estimated costs and timelines when relevant
3. Mention official resources and websites
4. Be encouraging but realistic about challenges
5. If you don't know something specific, say so and suggest where to find accurate info
6. Consider the user's country of origin when giving advice
7. Keep responses concise but comprehensive (aim for 150-300 words)

Always be supportive - these are life-changing decisions and users need clear, accurate guidance.`;

export default function ImmigrationAssistantScreen() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    // Add welcome message
    const welcomeMessage: Message = {
      id: 'welcome',
      role: 'assistant',
      content: "Hello! I'm your Immigration Assistant. I can help answer questions about:\n\n• Work visas and sponsorship\n• Professional licensing abroad\n• Study abroad and scholarships\n• Document requirements\n• Job search for international positions\n\nWhat would you like to know?",
      timestamp: new Date(),
    };
    setMessages([welcomeMessage]);
  }, []);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    // Scroll to bottom
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);

    try {
      const response = await fetch('https://api.openai.com/v1/responses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.EXPO_PUBLIC_VIBECODE_OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-5.2',
          input: [
            { role: 'system', content: SYSTEM_PROMPT },
            ...messages.filter(m => m.id !== 'welcome').map(m => ({
              role: m.role,
              content: m.content,
            })),
            { role: 'user', content: text.trim() },
          ],
        }),
      });

      const data = await response.json();
      console.log('AI Response:', JSON.stringify(data, null, 2));

      let assistantContent = "I apologize, but I'm having trouble connecting right now. Please try again in a moment.";

      // Parse response - check multiple possible formats
      if (data.output_text) {
        assistantContent = data.output_text;
      } else if (data.output?.[0]?.content?.[0]?.text) {
        // New API format: output[0].content[0].text
        assistantContent = data.output[0].content[0].text;
      } else if (data.error) {
        console.error('API Error:', data.error);
        assistantContent = "I'm having trouble connecting to the AI service. Please make sure the OpenAI API is configured in the API tab.";
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: assistantContent,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I'm sorry, I couldn't process your request. Please check your internet connection and try again.",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  const handleQuickQuestion = (question: string) => {
    setInputText(question);
    sendMessage(question);
  };

  return (
    <View className="flex-1 bg-slate-950">
      <LinearGradient
        colors={['#0F172A', '#1E293B', '#0F172A']}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />

      <SafeAreaView className="flex-1" edges={['top']}>
        {/* Header */}
        <Animated.View
          entering={FadeInDown.duration(400)}
          className="px-4 py-3 border-b border-slate-800"
        >
          <View className="flex-row items-center justify-between">
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.back();
              }}
              className="w-10 h-10 items-center justify-center rounded-full bg-slate-800"
            >
              <ChevronLeft size={24} color="#fff" />
            </Pressable>

            <View className="flex-row items-center gap-2">
              <View className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 items-center justify-center">
                <Bot size={22} color="#fff" />
              </View>
              <View>
                <Text className="text-white font-semibold text-base">Immigration Assistant</Text>
                <View className="flex-row items-center gap-1">
                  <View className="w-2 h-2 rounded-full bg-emerald-500" />
                  <Text className="text-slate-400 text-xs">AI-Powered</Text>
                </View>
              </View>
            </View>

            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push('/immigration-career-guide');
              }}
              className="w-10 h-10 items-center justify-center rounded-full bg-slate-800"
            >
              <Globe size={20} color="#10B981" />
            </Pressable>
          </View>
        </Animated.View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
          keyboardVerticalOffset={0}
        >
          {/* Messages */}
          <ScrollView
            ref={scrollViewRef}
            className="flex-1 px-4"
            contentContainerStyle={{ paddingVertical: 16 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Quick Questions - Show only if no user messages yet */}
            {messages.length <= 1 && (
              <Animated.View entering={FadeIn.delay(300)} className="mb-6">
                <Text className="text-slate-400 text-sm mb-3 font-medium">
                  Quick Questions
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {QUICK_QUESTIONS.map((q, index) => (
                    <Pressable
                      key={index}
                      onPress={() => handleQuickQuestion(q.text)}
                      className="bg-slate-800/80 rounded-xl px-3 py-2 flex-row items-center gap-2 border border-slate-700"
                    >
                      {q.icon}
                      <Text className="text-slate-300 text-xs" numberOfLines={1}>
                        {q.text.length > 35 ? q.text.substring(0, 35) + '...' : q.text}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </Animated.View>
            )}

            {/* Chat Messages */}
            {messages.map((message, index) => (
              <Animated.View
                key={message.id}
                entering={FadeInUp.delay(index * 50).duration(300)}
                className={`mb-4 ${message.role === 'user' ? 'items-end' : 'items-start'}`}
              >
                <View className="flex-row items-start gap-2 max-w-[90%]">
                  {message.role === 'assistant' && (
                    <View className="w-8 h-8 rounded-full bg-emerald-500/20 items-center justify-center mt-1">
                      <Bot size={16} color="#10B981" />
                    </View>
                  )}

                  <View
                    className={`rounded-2xl px-4 py-3 ${
                      message.role === 'user'
                        ? 'bg-emerald-600 rounded-tr-sm'
                        : 'bg-slate-800 rounded-tl-sm'
                    }`}
                    style={{ maxWidth: '85%' }}
                  >
                    <Text
                      className={`text-sm leading-5 ${
                        message.role === 'user' ? 'text-white' : 'text-slate-200'
                      }`}
                    >
                      {message.content}
                    </Text>
                    <Text
                      className={`text-xs mt-1 ${
                        message.role === 'user' ? 'text-emerald-200' : 'text-slate-500'
                      }`}
                    >
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </View>

                  {message.role === 'user' && (
                    <View className="w-8 h-8 rounded-full bg-slate-700 items-center justify-center mt-1">
                      <User size={16} color="#94A3B8" />
                    </View>
                  )}
                </View>
              </Animated.View>
            ))}

            {/* Loading indicator */}
            {isLoading && (
              <Animated.View
                entering={FadeIn}
                className="flex-row items-center gap-2 mb-4"
              >
                <View className="w-8 h-8 rounded-full bg-emerald-500/20 items-center justify-center">
                  <Bot size={16} color="#10B981" />
                </View>
                <View className="bg-slate-800 rounded-2xl rounded-tl-sm px-4 py-3">
                  <View className="flex-row items-center gap-2">
                    <ActivityIndicator size="small" color="#10B981" />
                    <Text className="text-slate-400 text-sm">Thinking...</Text>
                  </View>
                </View>
              </Animated.View>
            )}
          </ScrollView>

          {/* Input Area */}
          <View className="px-4 pb-4 pt-2 border-t border-slate-800 bg-slate-900/80">
            {/* Suggestions Bar */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="mb-3"
              contentContainerStyle={{ gap: 8 }}
            >
              <Pressable
                onPress={() => router.push('/immigration-career-guide')}
                className="bg-emerald-500/20 rounded-full px-3 py-1.5 flex-row items-center gap-1.5"
              >
                <Briefcase size={14} color="#10B981" />
                <Text className="text-emerald-400 text-xs font-medium">Career Guides</Text>
              </Pressable>
              <Pressable
                onPress={() => router.push('/international-jobs')}
                className="bg-blue-500/20 rounded-full px-3 py-1.5 flex-row items-center gap-1.5"
              >
                <Globe size={14} color="#3B82F6" />
                <Text className="text-blue-400 text-xs font-medium">Find Jobs</Text>
              </Pressable>
              <Pressable
                onPress={() => router.push('/international-schools')}
                className="bg-amber-500/20 rounded-full px-3 py-1.5 flex-row items-center gap-1.5"
              >
                <GraduationCap size={14} color="#F59E0B" />
                <Text className="text-amber-400 text-xs font-medium">Schools</Text>
              </Pressable>
              <Pressable
                onPress={() => router.push('/immigration-help')}
                className="bg-purple-500/20 rounded-full px-3 py-1.5 flex-row items-center gap-1.5"
              >
                <HelpCircle size={14} color="#A855F7" />
                <Text className="text-purple-400 text-xs font-medium">Help Center</Text>
              </Pressable>
            </ScrollView>

            <View className="flex-row items-end gap-2">
              <View className="flex-1 bg-slate-800 rounded-2xl px-4 py-3 min-h-[48px] max-h-[120px]">
                <TextInput
                  value={inputText}
                  onChangeText={setInputText}
                  placeholder="Ask about visas, jobs, schools..."
                  placeholderTextColor="#64748B"
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
                  inputText.trim() && !isLoading
                    ? 'bg-emerald-500'
                    : 'bg-slate-700'
                }`}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Send size={20} color={inputText.trim() ? '#fff' : '#64748B'} />
                )}
              </Pressable>
            </View>

            {/* Disclaimer */}
            <Text className="text-slate-500 text-[10px] text-center mt-2">
              AI responses are for guidance only. Always verify with official sources.
            </Text>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
