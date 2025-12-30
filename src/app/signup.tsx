import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, KeyboardAvoidingView, Platform, Alert } from 'react-native';
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
  Loader2,
  KeyRound,
  Users,
} from 'lucide-react-native';
import { Image } from 'expo-image';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useStore } from '@/lib/store';
import { signUpWithEmail, signInWithEmail, signUpWithPhone, verifyOtp, getProfile, getOrCreateProfile } from '@/lib/auth';

type AuthMethod = 'email' | 'phone' | 'google';
type AuthMode = 'signup' | 'signin';
type PhoneStep = 'phone' | 'otp';

export default function SignUpScreen() {
  const [authMethod, setAuthMethod] = useState<AuthMethod | null>(null);
  const [authMode, setAuthMode] = useState<AuthMode>('signup');
  const [phoneStep, setPhoneStep] = useState<PhoneStep>('phone');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setCurrentUser = useStore((s) => s.setCurrentUser);
  const setIsGuest = useStore((s) => s.setIsGuest);
  const setIsOnboarded = useStore((s) => s.setIsOnboarded);
  const selectedLocation = useStore((s) => s.selectedLocation);

  // Get the name to use - display name if set, otherwise full name
  const fullName = `${firstName} ${lastName}`.trim();
  const communityName = displayName.trim() || fullName;
  const hasRequiredName = firstName.trim().length > 0 && lastName.trim().length > 0;

  const handleGoogleSignIn = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      'Google Sign-In',
      'Google sign-in requires additional configuration. Please use email or phone for now.',
      [{ text: 'OK' }]
    );
  };

  const handleEmailSignUp = async () => {
    if (!email || !password || (authMode === 'signup' && !hasRequiredName)) return;

    setIsLoading(true);
    setError(null);

    try {
      if (authMode === 'signup') {
        const data = await signUpWithEmail(email, password, communityName);

        if (data.user) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

          await new Promise(resolve => setTimeout(resolve, 500));

          const profile = await getProfile(data.user.id);

          setCurrentUser({
            id: data.user.id,
            name: profile?.name || communityName,
            username: profile?.username || email.split('@')[0],
            avatar: profile?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop',
            bio: profile?.bio || '',
            location: selectedLocation ? `${selectedLocation.city}, ${selectedLocation.country}` : 'Not set',
            interests: profile?.interests || [],
            joinedDate: new Date().toISOString(),
            email: email,
          });
          setIsGuest(false);
          setIsOnboarded(true);
          router.replace('/profile-setup');
        }
      } else {
        const data = await signInWithEmail(email, password);

        if (data.user) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

          const profile = await getProfile(data.user.id);

          setCurrentUser({
            id: data.user.id,
            name: profile?.name || 'User',
            username: profile?.username || email.split('@')[0],
            avatar: profile?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop',
            bio: profile?.bio || '',
            location: profile?.location || 'Not set',
            interests: profile?.interests || [],
            joinedDate: profile?.created_at || new Date().toISOString(),
            email: email,
          });
          setIsGuest(false);
          setIsOnboarded(true);
          router.replace('/(tabs)');
        }
      }
    } catch (err: unknown) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhoneSendOtp = async () => {
    if (!phone || (authMode === 'signup' && !hasRequiredName)) return;

    setIsLoading(true);
    setError(null);

    try {
      await signUpWithPhone(phone, authMode === 'signup' ? communityName : '');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setPhoneStep('otp');
    } catch (err: unknown) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const errorMessage = err instanceof Error ? err.message : 'Failed to send verification code';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhoneVerifyOtp = async () => {
    if (!otp) return;

    setIsLoading(true);
    setError(null);

    try {
      const data = await verifyOtp(phone, otp);

      if (data.user) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        // Use getOrCreateProfile to handle case where trigger didn't create profile
        const profile = await getOrCreateProfile(data.user.id, {
          name: authMode === 'signup' ? communityName : undefined,
          phone: phone,
        });

        setCurrentUser({
          id: data.user.id,
          name: profile?.name || communityName || 'User',
          username: profile?.username || `user_${phone.slice(-4)}`,
          avatar: profile?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop',
          bio: profile?.bio || '',
          location: selectedLocation ? `${selectedLocation.city}, ${selectedLocation.country}` : (profile?.location || 'Not set'),
          interests: profile?.interests || [],
          joinedDate: profile?.created_at || new Date().toISOString(),
          phone: phone,
        });
        setIsGuest(false);
        setIsOnboarded(true);

        // For login, go to home. For signup, go to profile setup.
        if (authMode === 'signin') {
          router.replace('/(tabs)');
        } else {
          router.replace('/profile-setup');
        }
      }
    } catch (err: unknown) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const errorMessage = err instanceof Error ? err.message : 'Invalid verification code';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (phoneStep === 'otp') {
      setPhoneStep('phone');
      setOtp('');
      setError(null);
    } else if (authMethod) {
      setAuthMethod(null);
      setError(null);
      setPhoneStep('phone');
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
          {authMode === 'signup' ? 'Create Your Account' : 'Welcome Back'}
        </Text>
        <Text className="text-gray-500 text-center mt-2">
          {authMode === 'signup' ? 'Join the AfroConnect community' : 'Sign in to your account'}
        </Text>
      </View>

      {/* Auth Mode Toggle */}
      <Animated.View entering={FadeInUp.duration(400).delay(50)} className="mb-6">
        <View className="flex-row bg-white rounded-2xl p-1 shadow-sm">
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setAuthMode('signup');
            }}
            className={`flex-1 py-3 rounded-xl ${authMode === 'signup' ? 'bg-terracotta-500' : ''}`}
          >
            <Text className={`text-center font-semibold ${authMode === 'signup' ? 'text-white' : 'text-gray-500'}`}>
              Sign Up
            </Text>
          </Pressable>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setAuthMode('signin');
            }}
            className={`flex-1 py-3 rounded-xl ${authMode === 'signin' ? 'bg-terracotta-500' : ''}`}
          >
            <Text className={`text-center font-semibold ${authMode === 'signin' ? 'text-white' : 'text-gray-500'}`}>
              Log In
            </Text>
          </Pressable>
        </View>
      </Animated.View>

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

      {/* Email */}
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
            {authMode === 'signup' ? 'Sign up with Email' : 'Log in with Email'}
          </Text>
          <ArrowRight size={20} color="#9CA3AF" />
        </Pressable>
      </Animated.View>

      {/* Phone */}
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
            {authMode === 'signup' ? 'Sign up with Phone' : 'Log in with Phone'}
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
          By continuing, you agree to our{' '}
          <Text className="text-terracotta-500">Terms of Service</Text> and{' '}
          <Text className="text-terracotta-500">Privacy Policy</Text>
        </Text>
      </Animated.View>
    </Animated.View>
  );

  const renderNameFields = () => (
    <>
      {/* First Name and Last Name - side by side */}
      <View className="flex-row mb-4">
        <View className="flex-1 mr-2">
          <Text className="text-warmBrown font-medium mb-2">First Name</Text>
          <View className="flex-row items-center bg-white rounded-2xl px-4 py-3 border border-gray-200">
            <TextInput
              placeholder="First"
              placeholderTextColor="#9CA3AF"
              value={firstName}
              onChangeText={setFirstName}
              className="flex-1 text-warmBrown text-base"
              autoCapitalize="words"
              editable={!isLoading}
            />
          </View>
        </View>
        <View className="flex-1 ml-2">
          <Text className="text-warmBrown font-medium mb-2">Last Name</Text>
          <View className="flex-row items-center bg-white rounded-2xl px-4 py-3 border border-gray-200">
            <TextInput
              placeholder="Last"
              placeholderTextColor="#9CA3AF"
              value={lastName}
              onChangeText={setLastName}
              className="flex-1 text-warmBrown text-base"
              autoCapitalize="words"
              editable={!isLoading}
            />
          </View>
        </View>
      </View>

      {/* Display Name (optional) */}
      <View className="mb-4">
        <Text className="text-warmBrown font-medium mb-2">
          Display Name <Text className="text-gray-400 font-normal">(optional)</Text>
        </Text>
        <View className="flex-row items-center bg-white rounded-2xl px-4 py-3 border border-gray-200">
          <Users size={20} color="#8B7355" />
          <TextInput
            placeholder="Name the community sees"
            placeholderTextColor="#9CA3AF"
            value={displayName}
            onChangeText={setDisplayName}
            className="flex-1 ml-3 text-warmBrown text-base"
            autoCapitalize="words"
            editable={!isLoading}
          />
        </View>
        <Text className="text-gray-400 text-xs mt-1.5">
          Leave blank to use your full name
        </Text>
      </View>
    </>
  );

  const renderEmailForm = () => (
    <Animated.View entering={FadeIn.duration(400)} className="flex-1">
      <View className="mb-6">
        <Text className="text-2xl font-bold text-warmBrown">
          {authMode === 'signup' ? 'Sign up with Email' : 'Sign in with Email'}
        </Text>
        <Text className="text-gray-500 mt-1">
          {authMode === 'signup' ? 'Enter your details below' : 'Welcome back!'}
        </Text>
      </View>

      {/* Error Message */}
      {error && (
        <View className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
          <Text className="text-red-600 text-sm">{error}</Text>
        </View>
      )}

      {/* Name Fields - only for signup */}
      {authMode === 'signup' && renderNameFields()}

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
            editable={!isLoading}
          />
        </View>
      </View>

      {/* Password Input */}
      <View className="mb-6">
        <Text className="text-warmBrown font-medium mb-2">Password</Text>
        <View className="flex-row items-center bg-white rounded-2xl px-4 py-3 border border-gray-200">
          <Lock size={20} color="#8B7355" />
          <TextInput
            placeholder={authMode === 'signup' ? 'Create a password' : 'Enter your password'}
            placeholderTextColor="#9CA3AF"
            value={password}
            onChangeText={setPassword}
            className="flex-1 ml-3 text-warmBrown text-base"
            secureTextEntry={!showPassword}
            editable={!isLoading}
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

      {/* Sign Up/In Button */}
      <Pressable
        onPress={handleEmailSignUp}
        disabled={!email || !password || (authMode === 'signup' && !hasRequiredName) || isLoading}
      >
        <LinearGradient
          colors={email && password && (authMode === 'signin' || hasRequiredName) && !isLoading ? ['#D4673A', '#B85430'] : ['#D1D5DB', '#9CA3AF']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            borderRadius: 16,
            paddingVertical: 18,
            alignItems: 'center',
            flexDirection: 'row',
            justifyContent: 'center',
          }}
        >
          {isLoading ? (
            <Loader2 size={24} color="#FFFFFF" />
          ) : (
            <Text className="text-white font-bold text-lg">
              {authMode === 'signup' ? 'Create Account' : 'Sign In'}
            </Text>
          )}
        </LinearGradient>
      </Pressable>

      {/* Toggle Sign In/Sign Up */}
      <Pressable
        onPress={() => {
          setAuthMode(authMode === 'signup' ? 'signin' : 'signup');
          setError(null);
        }}
        className="mt-6 items-center"
      >
        <Text className="text-gray-500">
          {authMode === 'signup' ? 'Already have an account? ' : "Don't have an account? "}
          <Text className="text-terracotta-500 font-medium">
            {authMode === 'signup' ? 'Sign In' : 'Sign Up'}
          </Text>
        </Text>
      </Pressable>
    </Animated.View>
  );

  const renderPhoneForm = () => (
    <Animated.View entering={FadeIn.duration(400)} className="flex-1">
      <View className="mb-6">
        <Text className="text-2xl font-bold text-warmBrown">
          {phoneStep === 'phone'
            ? (authMode === 'signup' ? 'Sign up with Phone' : 'Log in with Phone')
            : 'Enter Verification Code'}
        </Text>
        <Text className="text-gray-500 mt-1">
          {phoneStep === 'phone'
            ? "We'll send you a verification code"
            : `Code sent to ${phone}`}
        </Text>
      </View>

      {/* Error Message */}
      {error && (
        <View className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
          <Text className="text-red-600 text-sm">{error}</Text>
        </View>
      )}

      {phoneStep === 'phone' ? (
        <>
          {/* Name Fields - only for signup */}
          {authMode === 'signup' && renderNameFields()}

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
                editable={!isLoading}
              />
            </View>
            <Text className="text-gray-400 text-xs mt-2">
              Include country code (e.g., +1 for US, +234 for Nigeria)
            </Text>
          </View>

          {/* Send Code Button */}
          <Pressable
            onPress={handlePhoneSendOtp}
            disabled={!phone || (authMode === 'signup' && !hasRequiredName) || isLoading}
          >
            <LinearGradient
              colors={phone && (authMode === 'signin' || hasRequiredName) && !isLoading ? ['#D4673A', '#B85430'] : ['#D1D5DB', '#9CA3AF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                borderRadius: 16,
                paddingVertical: 18,
                alignItems: 'center',
                flexDirection: 'row',
                justifyContent: 'center',
              }}
            >
              {isLoading ? (
                <Loader2 size={24} color="#FFFFFF" />
              ) : (
                <Text className="text-white font-bold text-lg">Send Verification Code</Text>
              )}
            </LinearGradient>
          </Pressable>

          {/* Toggle Sign In/Sign Up */}
          <Pressable
            onPress={() => {
              setAuthMode(authMode === 'signup' ? 'signin' : 'signup');
              setError(null);
            }}
            className="mt-6 items-center"
          >
            <Text className="text-gray-500">
              {authMode === 'signup' ? 'Already have an account? ' : "Don't have an account? "}
              <Text className="text-terracotta-500 font-medium">
                {authMode === 'signup' ? 'Log In' : 'Sign Up'}
              </Text>
            </Text>
          </Pressable>
        </>
      ) : (
        <>
          {/* OTP Input */}
          <View className="mb-6">
            <Text className="text-warmBrown font-medium mb-2">Verification Code</Text>
            <View className="flex-row items-center bg-white rounded-2xl px-4 py-3 border border-gray-200">
              <KeyRound size={20} color="#8B7355" />
              <TextInput
                placeholder="Enter 6-digit code"
                placeholderTextColor="#9CA3AF"
                value={otp}
                onChangeText={setOtp}
                className="flex-1 ml-3 text-warmBrown text-base tracking-widest"
                keyboardType="number-pad"
                maxLength={6}
                editable={!isLoading}
              />
            </View>
          </View>

          {/* Verify Button */}
          <Pressable onPress={handlePhoneVerifyOtp} disabled={!otp || otp.length < 6 || isLoading}>
            <LinearGradient
              colors={otp && otp.length >= 6 && !isLoading ? ['#D4673A', '#B85430'] : ['#D1D5DB', '#9CA3AF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                borderRadius: 16,
                paddingVertical: 18,
                alignItems: 'center',
                flexDirection: 'row',
                justifyContent: 'center',
              }}
            >
              {isLoading ? (
                <Loader2 size={24} color="#FFFFFF" />
              ) : (
                <Text className="text-white font-bold text-lg">Verify & Continue</Text>
              )}
            </LinearGradient>
          </Pressable>

          {/* Resend Code */}
          <Pressable
            onPress={handlePhoneSendOtp}
            disabled={isLoading}
            className="mt-6 items-center"
          >
            <Text className="text-gray-500">
              Didn't receive code?{' '}
              <Text className="text-terracotta-500 font-medium">Resend</Text>
            </Text>
          </Pressable>
        </>
      )}
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
