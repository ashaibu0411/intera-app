import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import {
  ArrowLeft,
  ArrowRight,
  DollarSign,
  Clock,
  Star,
  ExternalLink,
  ChevronDown,
  TrendingUp,
  Shield,
  Zap,
} from 'lucide-react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';

// Supported countries for receiving money
const RECEIVING_COUNTRIES = [
  { code: 'NG', name: 'Nigeria', currency: 'NGN', flag: '🇳🇬' },
  { code: 'GH', name: 'Ghana', currency: 'GHS', flag: '🇬🇭' },
  { code: 'KE', name: 'Kenya', currency: 'KES', flag: '🇰🇪' },
  { code: 'ZA', name: 'South Africa', currency: 'ZAR', flag: '🇿🇦' },
  { code: 'ET', name: 'Ethiopia', currency: 'ETB', flag: '🇪🇹' },
  { code: 'TZ', name: 'Tanzania', currency: 'TZS', flag: '🇹🇿' },
  { code: 'UG', name: 'Uganda', currency: 'UGX', flag: '🇺🇬' },
  { code: 'CM', name: 'Cameroon', currency: 'XAF', flag: '🇨🇲' },
  { code: 'SN', name: 'Senegal', currency: 'XOF', flag: '🇸🇳' },
  { code: 'RW', name: 'Rwanda', currency: 'RWF', flag: '🇷🇼' },
  { code: 'ZM', name: 'Zambia', currency: 'ZMW', flag: '🇿🇲' },
  { code: 'ZW', name: 'Zimbabwe', currency: 'ZWL', flag: '🇿🇼' },
];

// Money transfer providers with simulated rates
const PROVIDERS = [
  {
    id: 'wise',
    name: 'Wise',
    logo: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=100&h=100&fit=crop',
    color: '#00B9A8',
    rating: 4.8,
    reviews: '125K',
    speed: '1-2 hours',
    speedRank: 1,
  },
  {
    id: 'remitly',
    name: 'Remitly',
    logo: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=100&h=100&fit=crop',
    color: '#1D3557',
    rating: 4.7,
    reviews: '98K',
    speed: '1-3 hours',
    speedRank: 2,
  },
  {
    id: 'worldremit',
    name: 'WorldRemit',
    logo: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=100&h=100&fit=crop',
    color: '#6B46C1',
    rating: 4.5,
    reviews: '67K',
    speed: '1-4 hours',
    speedRank: 3,
  },
  {
    id: 'sendwave',
    name: 'Sendwave',
    logo: 'https://images.unsplash.com/photo-1604594849809-dfedbc827105?w=100&h=100&fit=crop',
    color: '#2563EB',
    rating: 4.6,
    reviews: '45K',
    speed: 'Instant',
    speedRank: 0,
  },
  {
    id: 'westernunion',
    name: 'Western Union',
    logo: 'https://images.unsplash.com/photo-1621761191319-c6fb62004040?w=100&h=100&fit=crop',
    color: '#FFD700',
    rating: 4.2,
    reviews: '200K',
    speed: 'Same day',
    speedRank: 4,
  },
];

// Simulated exchange rates (in production, fetch from API)
const getExchangeRates = (country: string, amount: number) => {
  // Base rates (approximate real rates)
  const baseRates: Record<string, number> = {
    'NG': 1550, // NGN per USD
    'GH': 12.5, // GHS per USD
    'KE': 153, // KES per USD
    'ZA': 18.5, // ZAR per USD
    'ET': 56, // ETB per USD
    'TZ': 2500, // TZS per USD
    'UG': 3750, // UGX per USD
    'CM': 605, // XAF per USD
    'SN': 605, // XOF per USD
    'RW': 1250, // RWF per USD
    'ZM': 25, // ZMW per USD
    'ZW': 5000, // ZWL per USD
  };

  const baseRate = baseRates[country] || 1;

  // Each provider has slightly different rates and fees
  return PROVIDERS.map((provider) => {
    // Simulate different rates (±2%)
    const rateVariation = 1 + (Math.random() * 0.04 - 0.02);
    const rate = baseRate * rateVariation;

    // Simulate fees based on provider
    const feePercentage = {
      'wise': 0.005,
      'remitly': 0.01,
      'worldremit': 0.015,
      'sendwave': 0.008,
      'westernunion': 0.02,
    }[provider.id] || 0.01;

    const fee = Math.max(amount * feePercentage, 0.99);
    const amountAfterFee = amount - fee;
    const receivedAmount = amountAfterFee * rate;

    return {
      ...provider,
      rate: rate.toFixed(2),
      fee: fee.toFixed(2),
      receivedAmount: receivedAmount.toFixed(2),
      totalCost: fee,
    };
  }).sort((a, b) => parseFloat(b.receivedAmount) - parseFloat(a.receivedAmount));
};

export default function RemittanceScreen() {
  const [amount, setAmount] = useState('100');
  const [selectedCountry, setSelectedCountry] = useState(RECEIVING_COUNTRIES[0]);
  const [showCountryPicker, setShowCountryPicker] = useState(false);

  const quotes = useMemo(() => {
    const numAmount = parseFloat(amount) || 0;
    if (numAmount < 1) return [];
    return getExchangeRates(selectedCountry.code, numAmount);
  }, [amount, selectedCountry]);

  const bestDeal = quotes[0];
  const fastestProvider = [...quotes].sort((a, b) => a.speedRank - b.speedRank)[0];

  const handleProviderPress = (provider: any) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // In production, this would deep link to the provider's app or website
    Linking.openURL(`https://www.google.com/search?q=${provider.name}+money+transfer`);
  };

  const formatCurrency = (value: string, currency: string) => {
    const num = parseFloat(value);
    if (isNaN(num)) return '0';
    return num.toLocaleString('en-US', { maximumFractionDigits: 0 });
  };

  return (
    <View className="flex-1 bg-cream-50">
      <LinearGradient
        colors={['#1B4D3E', '#0D3329']}
        style={{ paddingTop: 60, paddingBottom: 24 }}
      >
        <View className="px-4">
          {/* Header */}
          <View className="flex-row items-center mb-6">
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.back();
              }}
              className="w-10 h-10 bg-white/20 rounded-full items-center justify-center mr-4"
            >
              <ArrowLeft size={20} color="#FFFFFF" />
            </Pressable>
            <View className="flex-1">
              <Text className="text-white text-xl font-bold">Send Money Home</Text>
              <Text className="text-white/70 text-sm">Compare rates & find the best deal</Text>
            </View>
          </View>

          {/* Amount Input */}
          <Animated.View entering={FadeInDown.duration(400)} className="bg-white rounded-2xl p-4 mb-4">
            <Text className="text-gray-500 text-sm mb-2">You send</Text>
            <View className="flex-row items-center">
              <Text className="text-3xl font-bold text-warmBrown mr-2">$</Text>
              <TextInput
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
                className="flex-1 text-3xl font-bold text-warmBrown"
                placeholder="0"
                placeholderTextColor="#CBD5E1"
              />
              <View className="bg-gray-100 rounded-full px-3 py-1.5 flex-row items-center">
                <Text className="text-lg mr-1">🇺🇸</Text>
                <Text className="text-warmBrown font-medium">USD</Text>
              </View>
            </View>
          </Animated.View>

          {/* Receiving Country */}
          <Animated.View entering={FadeInDown.duration(400).delay(100)}>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setShowCountryPicker(!showCountryPicker);
              }}
              className="bg-white rounded-2xl p-4"
            >
              <Text className="text-gray-500 text-sm mb-2">They receive in</Text>
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center">
                  <Text className="text-3xl mr-3">{selectedCountry.flag}</Text>
                  <View>
                    <Text className="text-warmBrown font-bold text-lg">{selectedCountry.name}</Text>
                    <Text className="text-gray-500 text-sm">{selectedCountry.currency}</Text>
                  </View>
                </View>
                <ChevronDown size={24} color="#8B7355" />
              </View>
            </Pressable>
          </Animated.View>
        </View>
      </LinearGradient>

      {/* Country Picker */}
      {showCountryPicker && (
        <Animated.View
          entering={FadeInDown.duration(200)}
          className="bg-white mx-4 -mt-2 rounded-2xl shadow-lg overflow-hidden max-h-64"
        >
          <ScrollView showsVerticalScrollIndicator={false}>
            {RECEIVING_COUNTRIES.map((country) => (
              <Pressable
                key={country.code}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setSelectedCountry(country);
                  setShowCountryPicker(false);
                }}
                className={`flex-row items-center p-4 border-b border-gray-100 ${
                  selectedCountry.code === country.code ? 'bg-forest-50' : ''
                }`}
              >
                <Text className="text-2xl mr-3">{country.flag}</Text>
                <Text className="text-warmBrown font-medium flex-1">{country.name}</Text>
                <Text className="text-gray-500">{country.currency}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </Animated.View>
      )}

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Best Deal Badge */}
        {bestDeal && parseFloat(amount) > 0 && (
          <Animated.View entering={FadeInUp.duration(400).delay(200)} className="mx-4 mt-4">
            <View className="bg-gradient-to-r from-gold-400 to-terracotta-500 rounded-2xl p-4 flex-row items-center">
              <LinearGradient
                colors={['#C9A227', '#D4673A']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{ borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', flex: 1 }}
              >
                <TrendingUp size={24} color="#FFFFFF" />
                <View className="ml-3 flex-1">
                  <Text className="text-white font-bold">Best Deal: {bestDeal.name}</Text>
                  <Text className="text-white/80 text-sm">
                    Receive {formatCurrency(bestDeal.receivedAmount, selectedCountry.currency)} {selectedCountry.currency}
                  </Text>
                </View>
                <Zap size={20} color="#FFFFFF" />
              </LinearGradient>
            </View>
          </Animated.View>
        )}

        {/* Provider Cards */}
        <View className="px-4 mt-4 pb-8">
          <Text className="text-warmBrown font-bold text-lg mb-3">Compare Providers</Text>

          {quotes.map((provider, index) => (
            <Animated.View
              key={provider.id}
              entering={FadeInUp.duration(400).delay(300 + index * 100)}
            >
              <Pressable
                onPress={() => handleProviderPress(provider)}
                className="bg-white rounded-2xl p-4 mb-3 shadow-sm"
              >
                {/* Best Deal / Fastest Badge */}
                {index === 0 && (
                  <View className="absolute -top-2 -right-2 bg-terracotta-500 rounded-full px-3 py-1">
                    <Text className="text-white text-xs font-bold">Best Rate</Text>
                  </View>
                )}
                {provider.id === fastestProvider?.id && provider.id !== bestDeal?.id && (
                  <View className="absolute -top-2 -right-2 bg-forest-600 rounded-full px-3 py-1">
                    <Text className="text-white text-xs font-bold">Fastest</Text>
                  </View>
                )}

                <View className="flex-row items-center">
                  {/* Provider Logo */}
                  <View
                    className="w-12 h-12 rounded-xl items-center justify-center mr-3"
                    style={{ backgroundColor: provider.color + '20' }}
                  >
                    <Text className="text-xl font-bold" style={{ color: provider.color }}>
                      {provider.name.charAt(0)}
                    </Text>
                  </View>

                  {/* Provider Info */}
                  <View className="flex-1">
                    <Text className="text-warmBrown font-bold text-base">{provider.name}</Text>
                    <View className="flex-row items-center mt-1">
                      <Star size={12} color="#C9A227" fill="#C9A227" />
                      <Text className="text-gray-600 text-xs ml-1">
                        {provider.rating} ({provider.reviews} reviews)
                      </Text>
                    </View>
                  </View>

                  {/* Amount Received */}
                  <View className="items-end">
                    <Text className="text-forest-700 font-bold text-lg">
                      {formatCurrency(provider.receivedAmount, selectedCountry.currency)}
                    </Text>
                    <Text className="text-gray-500 text-xs">{selectedCountry.currency}</Text>
                  </View>
                </View>

                {/* Details Row */}
                <View className="flex-row items-center mt-3 pt-3 border-t border-gray-100">
                  <View className="flex-row items-center flex-1">
                    <DollarSign size={14} color="#8B7355" />
                    <Text className="text-gray-600 text-sm ml-1">Fee: ${provider.fee}</Text>
                  </View>
                  <View className="flex-row items-center flex-1">
                    <TrendingUp size={14} color="#8B7355" />
                    <Text className="text-gray-600 text-sm ml-1">Rate: {provider.rate}</Text>
                  </View>
                  <View className="flex-row items-center">
                    <Clock size={14} color="#8B7355" />
                    <Text className="text-gray-600 text-sm ml-1">{provider.speed}</Text>
                  </View>
                </View>

                {/* Send Button */}
                <Pressable
                  onPress={() => handleProviderPress(provider)}
                  className="mt-3 bg-forest-600 rounded-xl py-3 flex-row items-center justify-center"
                >
                  <Text className="text-white font-semibold mr-2">Send with {provider.name}</Text>
                  <ExternalLink size={16} color="#FFFFFF" />
                </Pressable>
              </Pressable>
            </Animated.View>
          ))}

          {/* Trust & Security */}
          <Animated.View entering={FadeInUp.duration(400).delay(800)} className="mt-4">
            <View className="bg-forest-50 rounded-2xl p-4 flex-row items-center">
              <Shield size={24} color="#1B4D3E" />
              <View className="ml-3 flex-1">
                <Text className="text-forest-700 font-semibold">Secure & Regulated</Text>
                <Text className="text-forest-600 text-sm">
                  All providers are licensed and regulated for your protection
                </Text>
              </View>
            </View>
          </Animated.View>

          {/* Tips Section */}
          <Animated.View entering={FadeInUp.duration(400).delay(900)} className="mt-4">
            <Text className="text-warmBrown font-bold text-lg mb-3">💡 Money-Saving Tips</Text>
            <View className="bg-white rounded-2xl p-4">
              <View className="flex-row items-start mb-3">
                <Text className="text-lg mr-2">📊</Text>
                <Text className="text-gray-600 flex-1">
                  Send larger amounts less frequently to save on fees
                </Text>
              </View>
              <View className="flex-row items-start mb-3">
                <Text className="text-lg mr-2">⏰</Text>
                <Text className="text-gray-600 flex-1">
                  Rates change daily - check back for better deals
                </Text>
              </View>
              <View className="flex-row items-start">
                <Text className="text-lg mr-2">💳</Text>
                <Text className="text-gray-600 flex-1">
                  Debit cards usually have lower fees than credit cards
                </Text>
              </View>
            </View>
          </Animated.View>
        </View>
      </ScrollView>
    </View>
  );
}
