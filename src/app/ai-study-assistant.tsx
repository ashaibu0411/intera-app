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
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, FadeInUp, FadeInDown } from 'react-native-reanimated';
import {
  ChevronLeft,
  Bot,
  Send,
  Sparkles,
  GraduationCap,
  Plane,
  FileText,
  Globe,
  HelpCircle,
  User,
} from 'lucide-react-native';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const SUGGESTED_QUESTIONS = [
  {
    id: '1',
    icon: FileText,
    text: 'How do I apply for an F-1 student visa?',
    color: '#6366F1',
  },
  {
    id: '2',
    icon: GraduationCap,
    text: 'How can I transfer to a US university?',
    color: '#8B5CF6',
  },
  {
    id: '3',
    icon: Plane,
    text: 'What documents do I need to study in Europe?',
    color: '#A855F7',
  },
  {
    id: '4',
    icon: Globe,
    text: 'Best scholarships for African students?',
    color: '#EC4899',
  },
];

const SYSTEM_PROMPT = `You are a helpful AI assistant specializing in helping international students, particularly from African countries, with immigration and study abroad questions. You provide accurate, helpful information about:

- Student visa applications (F-1, J-1 for US; Tier 4 for UK; student visas for EU countries, Canada, Australia)
- University transfer processes and requirements
- Scholarship opportunities for international students
- Document requirements for studying abroad
- OPT, CPT, and work authorization for students
- Immigration pathways after graduation
- Cost of living and financial planning for students abroad

Always be encouraging and supportive. If you're unsure about specific legal requirements, recommend consulting with an immigration attorney or the relevant embassy. Provide practical, actionable advice when possible.

Keep responses concise but informative. Use bullet points for lists when helpful.`;

export default function AIStudyAssistantScreen() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    // Scroll to bottom
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);

    try {
      const apiKey = process.env.EXPO_PUBLIC_VIBECODE_OPENAI_API_KEY;

      if (!apiKey) {
        // Fallback response if no API key
        const fallbackMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: "I'm sorry, but the AI assistant is not configured yet. Please ask the app administrator to set up the OpenAI API key in the ENV tab.",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, fallbackMessage]);
        setIsLoading(false);
        return;
      }

      // Build conversation history for context
      const conversationHistory = messages.map((msg) => ({
        role: msg.role,
        content: msg.role === 'user'
          ? [{ type: 'input_text', text: msg.content }]
          : msg.content,
      }));

      const response = await fetch('https://api.openai.com/v1/responses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-5.2',
          instructions: SYSTEM_PROMPT,
          input: [
            ...conversationHistory,
            {
              role: 'user',
              content: [{ type: 'input_text', text: text.trim() }],
            },
          ],
        }),
      });

      const data = await response.json();

      let assistantContent = "I'm sorry, I couldn't process your request. Please try again.";

      if (data.output && data.output.length > 0) {
        // Find the message output
        const messageOutput = data.output.find((o: any) => o.type === 'message');
        if (messageOutput && messageOutput.content && messageOutput.content.length > 0) {
          const textContent = messageOutput.content.find((c: any) => c.type === 'output_text');
          if (textContent) {
            assistantContent = textContent.text;
          }
        }
      } else if (data.error) {
        assistantContent = `Error: ${data.error.message || 'Unknown error occurred'}`;
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: assistantContent,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I'm having trouble connecting right now. Please check your internet connection and try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsLoading(false);
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  const handleSuggestedQuestion = (question: string) => {
    sendMessage(question);
  };

  return (
    <View className="flex-1 bg-gray-50">
      <SafeAreaView edges={['top']} className="flex-1">
        {/* Header */}
        <LinearGradient
          colors={['#6366F1', '#8B5CF6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ paddingBottom: 16 }}
        >
          <View className="flex-row items-center px-4 pt-2 pb-4">
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.back();
              }}
              className="w-10 h-10 items-center justify-center bg-white/20 rounded-full mr-3"
            >
              <ChevronLeft size={24} color="#FFFFFF" />
            </Pressable>
            <View className="flex-1">
              <View className="flex-row items-center">
                <Bot size={24} color="#FFFFFF" />
                <Text className="text-white text-xl font-bold ml-2">Study Assistant</Text>
                <View className="bg-white/20 rounded-full px-2 py-0.5 ml-2 flex-row items-center">
                  <Sparkles size={10} color="#FFFFFF" />
                  <Text className="text-white text-xs font-medium ml-1">AI</Text>
                </View>
              </View>
              <Text className="text-white/80 text-sm mt-0.5">
                Immigration & Study Abroad Help
              </Text>
            </View>
          </View>
        </LinearGradient>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
          keyboardVerticalOffset={0}
        >
          {/* Messages */}
          <ScrollView
            ref={scrollViewRef}
            className="flex-1 px-4"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingVertical: 16 }}
          >
            {messages.length === 0 ? (
              <Animated.View entering={FadeIn.duration(400)}>
                {/* Welcome Message */}
                <View className="items-center mb-6">
                  <View className="bg-indigo-100 rounded-full p-4 mb-3">
                    <Bot size={40} color="#6366F1" />
                  </View>
                  <Text className="text-gray-900 text-lg font-bold text-center">
                    Welcome to Your Study Assistant
                  </Text>
                  <Text className="text-gray-500 text-center mt-2 px-4">
                    I can help you with visa applications, university transfers, scholarships, and more. Ask me anything!
                  </Text>
                </View>

                {/* Suggested Questions */}
                <Text className="text-gray-700 font-semibold mb-3">Try asking:</Text>
                {SUGGESTED_QUESTIONS.map((question, index) => (
                  <Animated.View
                    key={question.id}
                    entering={FadeInUp.duration(300).delay(100 + index * 50)}
                  >
                    <Pressable
                      onPress={() => handleSuggestedQuestion(question.text)}
                      className="flex-row items-center bg-white rounded-2xl p-4 mb-3 shadow-sm"
                    >
                      <View
                        className="w-10 h-10 rounded-full items-center justify-center mr-3"
                        style={{ backgroundColor: `${question.color}15` }}
                      >
                        <question.icon size={20} color={question.color} />
                      </View>
                      <Text className="text-gray-700 flex-1">{question.text}</Text>
                      <HelpCircle size={16} color="#9CA3AF" />
                    </Pressable>
                  </Animated.View>
                ))}
              </Animated.View>
            ) : (
              <>
                {messages.map((message, index) => (
                  <Animated.View
                    key={message.id}
                    entering={FadeInDown.duration(300)}
                    className={`flex-row mb-4 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {message.role === 'assistant' && (
                      <View className="w-8 h-8 rounded-full bg-indigo-100 items-center justify-center mr-2 mt-1">
                        <Bot size={18} color="#6366F1" />
                      </View>
                    )}
                    <View
                      className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                        message.role === 'user'
                          ? 'bg-indigo-500 rounded-tr-sm'
                          : 'bg-white shadow-sm rounded-tl-sm'
                      }`}
                    >
                      <Text
                        className={`${
                          message.role === 'user' ? 'text-white' : 'text-gray-800'
                        } leading-6`}
                      >
                        {message.content}
                      </Text>
                    </View>
                    {message.role === 'user' && (
                      <View className="w-8 h-8 rounded-full bg-indigo-500 items-center justify-center ml-2 mt-1">
                        <User size={18} color="#FFFFFF" />
                      </View>
                    )}
                  </Animated.View>
                ))}
                {isLoading && (
                  <Animated.View
                    entering={FadeIn.duration(200)}
                    className="flex-row items-center mb-4"
                  >
                    <View className="w-8 h-8 rounded-full bg-indigo-100 items-center justify-center mr-2">
                      <Bot size={18} color="#6366F1" />
                    </View>
                    <View className="bg-white rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                      <View className="flex-row items-center">
                        <ActivityIndicator size="small" color="#6366F1" />
                        <Text className="text-gray-500 ml-2">Thinking...</Text>
                      </View>
                    </View>
                  </Animated.View>
                )}
              </>
            )}
          </ScrollView>

          {/* Input Area */}
          <View className="border-t border-gray-200 bg-white px-4 py-3">
            <View className="flex-row items-end">
              <View className="flex-1 bg-gray-100 rounded-2xl px-4 py-3 mr-3">
                <TextInput
                  placeholder="Ask about visas, schools, scholarships..."
                  placeholderTextColor="#9CA3AF"
                  value={inputText}
                  onChangeText={setInputText}
                  multiline
                  maxLength={1000}
                  className="text-gray-900 text-base max-h-24"
                  style={{ minHeight: 24 }}
                  editable={!isLoading}
                />
              </View>
              <Pressable
                onPress={() => sendMessage(inputText)}
                disabled={!inputText.trim() || isLoading}
                className={`w-12 h-12 rounded-full items-center justify-center ${
                  inputText.trim() && !isLoading ? 'bg-indigo-500' : 'bg-gray-300'
                }`}
              >
                <Send size={20} color="#FFFFFF" />
              </Pressable>
            </View>
            <Text className="text-gray-400 text-xs text-center mt-2">
              AI responses are for informational purposes. Consult professionals for legal advice.
            </Text>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
