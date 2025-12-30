import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Mail,
  Phone,
  ChevronLeft,
  Eye,
  EyeOff,
  ArrowRight,
  User,
  Lock,
} from 'lucide-react-native';
import { Image } from 'expo-image';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useStore, MOCK_USERS } from '@/lib/store';

type AuthMethod = 'email' | 'phone' | 'google';

export default function SignUpScreen() {
  const [authMethod, setAuthMethod] = useState<AuthMethod | null>(null);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const setCurrentUser = useStore((s) => s.setCurrentUser);
  const setIsGuest = useStore((s) => s.setIsGuest);
  const setIsOnboarded = useStore((s) => s.setIsOnboarded);
  const selectedLocation = useStore((s) => s.selectedLocation);

  const handleGoogleSignIn = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Simulate Google sign-in
    const mockUser = {
      ...MOCK_USERS[0],
      id: 'google-user',
      name: 'Google User',
      username: 'googleuser',
      location: selectedLocation ? `${selectedLocation.city}, ${selectedLocation.country}` : 'Denver, CO',
    };
    setCurrentUser(mockUser);
    setIsGuest(false);
    setIsOnboarded(true);
    router.replace('/(tabs)');
  };

  const handleEmailSignUp = () => {
    if (!email || !password || !name) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const mockUser = {
      ...MOCK_USERS[0],
      id: 'email-user',
      name: name,
      username: email.split('@')[0],
      email: email,
      location: selectedLocation ? `${selectedLocation.city}, ${selectedLocation.country}` : 'Denver, CO',
    };
    setCurrentUser(mockUser);
    setIsGuest(false);
    setIsOnboarded(true);
    router.replace('/(tabs)');
  };

  const handlePhoneSignUp = () => {
    if (!phone || !name) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const mockUser = {
      ...MOCK_USERS[0],
      id: 'phone-user',
      name: name,
      username: `user${phone.slice(-4)}`,
      phone: phone,
      location: selectedLocation ? `${selectedLocation.city}, ${selectedLocation.country}` : 'Denver, CO',
    };
    setCurrentUser(mockUser);
    setIsGuest(false);
    setIsOnboarded(true);
    router.replace('/(tabs)');
  };

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (authMethod) {
      setAuthMethod(null);
    } else {
      router.back();
    }
  };

  const renderMethodSelection = () => (
    <Animated.View entering={FadeIn.duration(400)} className="flex-1">
      <View className="items-center mb-8">
        <View className="bg-terracotta-100 rounded-full p-4 mb-4">
          <User size={32} color="#D4673A" />
        </View>
        <Text className="text-2xl font-bold text-warmBrown text-center">
          Create Your Account
        </Text>
        <Text className="text-gray-500 text-center mt-2">
          Join the AfroConnect community
        </Text>
      </View>

      {/* Google Sign In */}
      <Animated.View entering={FadeInUp.duration(400).delay(100)}>
        <Pressable
          onPress={handleGoogleSignIn}
          className="flex-row items-center bg-white rounded-2xl p-4 mb-3 shadow-sm border border-gray-100"
        >
          <Image
            source={{ uri: 'https://www.google.com/favicon.ico' }}
            style={{ width: 24, height: 24 }}
            contentFit="contain"
          />
          <Text className="flex-1 text-warmBrown font-medium ml-4">
            Continue with Google
          </Text>
          <ArrowRight size={20} color="#9CA3AF" />
        </Pressable>
      </Animated.View>

      {/* Email Sign Up */}
      <Animated.View entering={FadeInUp.duration(400).delay(150)}>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setAuthMethod('email');
          }}
          className="flex-row items-center bg-white rounded-2xl p-4 mb-3 shadow-sm border border-gray-100"
        >
          <View className="bg-terracotta-50 rounded-full p-2">
            <Mail size={20} color="#D4673A" />
          </View>
          <Text className="flex-1 text-warmBrown font-medium ml-4">
            Sign up with Email
          </Text>
          <ArrowRight size={20} color="#9CA3AF" />
        </Pressable>
      </Animated.View>

      {/* Phone Sign Up */}
      <Animated.View entering={FadeInUp.duration(400).delay(200)}>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setAuthMethod('phone');
          }}
          className="flex-row items-center bg-white rounded-2xl p-4 mb-3 shadow-sm border border-gray-100"
        >
          <View className="bg-forest-50 rounded-full p-2">
            <Phone size={20} color="#1B4D3E" />
          </View>
          <Text className="flex-1 text-warmBrown font-medium ml-4">
            Sign up with Phone
          </Text>
          <ArrowRight size={20} color="#9CA3AF" />
        </Pressable>
      </Animated.View>

      {/* Divider */}
      <View className="flex-row items-center my-6">
        <View className="flex-1 h-px bg-gray-200" />
        <Text className="text-gray-400 mx-4">or</Text>
        <View className="flex-1 h-px bg-gray-200" />
      </View>

      {/* Continue as Guest */}
      <Animated.View entering={FadeInUp.duration(400).delay(300)}>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.back();
          }}
          className="items-center py-4"
        >
          <Text className="text-gray-500">
            Continue browsing as{' '}
            <Text className="text-terracotta-500 font-medium">Guest</Text>
          </Text>
        </Pressable>
      </Animated.View>

      {/* Terms */}
      <Animated.View
        entering={FadeInUp.duration(400).delay(400)}
        className="mt-auto"
      >
        <Text className="text-gray-400 text-xs text-center leading-5">
          By signing up, you agree to our{' '}
          <Text className="text-terracotta-500">Terms of Service</Text> and{' '}
          <Text className="text-terracotta-500">Privacy Policy</Text>
        </Text>
      </Animated.View>
    </Animated.View>
  );

  const renderEmailForm = () => (
    <Animated.View entering={FadeIn.duration(400)} className="flex-1">
      <View className="mb-6">
        <Text className="text-2xl font-bold text-warmBrown">Sign up with Email</Text>
        <Text className="text-gray-500 mt-1">Enter your details below</Text>
      </View>

      {/* Name Input */}
      <View className="mb-4">
        <Text className="text-warmBrown font-medium mb-2">Full Name</Text>
        <View className="flex-row items-center bg-white rounded-2xl px-4 py-3 border border-gray-200">
          <User size={20} color="#8B7355" />
          <TextInput
            placeholder="Enter your name"
            placeholderTextColor="#9CA3AF"
            value={name}
            onChangeText={setName}
            className="flex-1 ml-3 text-warmBrown text-base"
            autoCapitalize="words"
          />
        </View>
      </View>

      {/* Email Input */}
      <View className="mb-4">
        <Text className="text-warmBrown font-medium mb-2">Email Address</Text>
        <View className="flex-row items-center bg-white rounded-2xl px-4 py-3 border border-gray-200">
          <Mail size={20} color="#8B7355" />
          <TextInput
            placeholder="Enter your email"
            placeholderTextColor="#9CA3AF"
            value={email}
            onChangeText={setEmail}
            className="flex-1 ml-3 text-warmBrown text-base"
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>
      </View>

      {/* Password Input */}
      <View className="mb-6">
        <Text className="text-warmBrown font-medium mb-2">Password</Text>
        <View className="flex-row items-center bg-white rounded-2xl px-4 py-3 border border-gray-200">
          <Lock size={20} color="#8B7355" />
          <TextInput
            placeholder="Create a password"
            placeholderTextColor="#9CA3AF"
            value={password}
            onChangeText={setPassword}
            className="flex-1 ml-3 text-warmBrown text-base"
            secureTextEntry={!showPassword}
          />
          <Pressable onPress={() => setShowPassword(!showPassword)}>
            {showPassword ? (
              <EyeOff size={20} color="#8B7355" />
            ) : (
              <Eye size={20} color="#8B7355" />
            )}
          </Pressable>
        </View>
      </View>

      {/* Sign Up Button */}
      <Pressable onPress={handleEmailSignUp} disabled={!email || !password || !name}>
        <LinearGradient
          colors={email && password && name ? ['#D4673A', '#B85430'] : ['#D1D5DB', '#9CA3AF']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            borderRadius: 16,
            paddingVertical: 18,
            alignItems: 'center',
          }}
        >
          <Text className="text-white font-bold text-lg">Create Account</Text>
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );

  const renderPhoneForm = () => (
    <Animated.View entering={FadeIn.duration(400)} className="flex-1">
      <View className="mb-6">
        <Text className="text-2xl font-bold text-warmBrown">Sign up with Phone</Text>
        <Text className="text-gray-500 mt-1">We&apos;ll send you a verification code</Text>
      </View>

      {/* Name Input */}
      <View className="mb-4">
        <Text className="text-warmBrown font-medium mb-2">Full Name</Text>
        <View className="flex-row items-center bg-white rounded-2xl px-4 py-3 border border-gray-200">
          <User size={20} color="#8B7355" />
          <TextInput
            placeholder="Enter your name"
            placeholderTextColor="#9CA3AF"
            value={name}
            onChangeText={setName}
            className="flex-1 ml-3 text-warmBrown text-base"
            autoCapitalize="words"
          />
        </View>
      </View>

      {/* Phone Input */}
      <View className="mb-6">
        <Text className="text-warmBrown font-medium mb-2">Phone Number</Text>
        <View className="flex-row items-center bg-white rounded-2xl px-4 py-3 border border-gray-200">
          <Phone size={20} color="#8B7355" />
          <TextInput
            placeholder="+1 (555) 000-0000"
            placeholderTextColor="#9CA3AF"
            value={phone}
            onChangeText={setPhone}
            className="flex-1 ml-3 text-warmBrown text-base"
            keyboardType="phone-pad"
          />
        </View>
        <Text className="text-gray-400 text-xs mt-2">
          Include country code for international numbers
        </Text>
      </View>

      {/* Sign Up Button */}
      <Pressable onPress={handlePhoneSignUp} disabled={!phone || !name}>
        <LinearGradient
          colors={phone && name ? ['#D4673A', '#B85430'] : ['#D1D5DB', '#9CA3AF']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            borderRadius: 16,
            paddingVertical: 18,
            alignItems: 'center',
          }}
        >
          <Text className="text-white font-bold text-lg">Send Verification Code</Text>
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );

  return (
    <View className="flex-1 bg-cream">
      <SafeAreaView edges={['top']} className="flex-1">
        {/* Header */}
        <View className="flex-row items-center px-5 pt-4 pb-2">
          <Pressable
            onPress={handleBack}
            className="bg-white rounded-full p-2 shadow-sm"
          >
            <ChevronLeft size={24} color="#2D1F1A" />
          </Pressable>
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
        >
          <ScrollView
            className="flex-1 px-6"
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }}
          >
            {authMethod === null && renderMethodSelection()}
            {authMethod === 'email' && renderEmailForm()}
            {authMethod === 'phone' && renderPhoneForm()}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
