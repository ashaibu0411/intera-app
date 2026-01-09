import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, Modal, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowLeft,
  DollarSign,
  Clock,
  Star,
  ExternalLink,
  ChevronDown,
  TrendingUp,
  Shield,
  Zap,
  User,
  Phone,
  Mail,
  X,
  CheckCircle,
  Smartphone,
  Globe,
  Gift,
  ChevronRight,
} from 'lucide-react-native';
import Animated, { FadeInDown, FadeInUp, FadeIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import {
  TRANSFER_PROVIDERS,
  getProvidersForCountry,
  calculateQuote,
  TransferProvider,
} from '@/lib/transferProviders';
import {
  openProviderForTransfer,
  RecipientInfo,
  TransferIntent,
  getAffiliateUrl,
} from '@/lib/transferService';

// Supported countries for receiving money
const RECEIVING_COUNTRIES = [
  // Africa
  { code: 'NG', name: 'Nigeria', currency: 'NGN', flag: '🇳🇬', region: 'Africa' },
  { code: 'GH', name: 'Ghana', currency: 'GHS', flag: '🇬🇭', region: 'Africa' },
  { code: 'KE', name: 'Kenya', currency: 'KES', flag: '🇰🇪', region: 'Africa' },
  { code: 'ZA', name: 'South Africa', currency: 'ZAR', flag: '🇿🇦', region: 'Africa' },
  { code: 'ET', name: 'Ethiopia', currency: 'ETB', flag: '🇪🇹', region: 'Africa' },
  { code: 'TZ', name: 'Tanzania', currency: 'TZS', flag: '🇹🇿', region: 'Africa' },
  { code: 'UG', name: 'Uganda', currency: 'UGX', flag: '🇺🇬', region: 'Africa' },
  { code: 'CM', name: 'Cameroon', currency: 'XAF', flag: '🇨🇲', region: 'Africa' },
  { code: 'SN', name: 'Senegal', currency: 'XOF', flag: '🇸🇳', region: 'Africa' },
  { code: 'RW', name: 'Rwanda', currency: 'RWF', flag: '🇷🇼', region: 'Africa' },
  { code: 'ZM', name: 'Zambia', currency: 'ZMW', flag: '🇿🇲', region: 'Africa' },
  { code: 'ZW', name: 'Zimbabwe', currency: 'ZWL', flag: '🇿🇼', region: 'Africa' },
  // Caribbean
  { code: 'JM', name: 'Jamaica', currency: 'JMD', flag: '🇯🇲', region: 'Caribbean' },
  { code: 'TT', name: 'Trinidad & Tobago', currency: 'TTD', flag: '🇹🇹', region: 'Caribbean' },
  { code: 'BB', name: 'Barbados', currency: 'BBD', flag: '🇧🇧', region: 'Caribbean' },
  { code: 'HT', name: 'Haiti', currency: 'HTG', flag: '🇭🇹', region: 'Caribbean' },
  { code: 'DO', name: 'Dominican Republic', currency: 'DOP', flag: '🇩🇴', region: 'Caribbean' },
  { code: 'GY', name: 'Guyana', currency: 'GYD', flag: '🇬🇾', region: 'Caribbean' },
  // Europe
  { code: 'GB', name: 'United Kingdom', currency: 'GBP', flag: '🇬🇧', region: 'Europe' },
  { code: 'DE', name: 'Germany', currency: 'EUR', flag: '🇩🇪', region: 'Europe' },
  { code: 'FR', name: 'France', currency: 'EUR', flag: '🇫🇷', region: 'Europe' },
  { code: 'PL', name: 'Poland', currency: 'PLN', flag: '🇵🇱', region: 'Europe' },
  { code: 'UA', name: 'Ukraine', currency: 'UAH', flag: '🇺🇦', region: 'Europe' },
  { code: 'RO', name: 'Romania', currency: 'RON', flag: '🇷🇴', region: 'Europe' },
  // Asia
  { code: 'IN', name: 'India', currency: 'INR', flag: '🇮🇳', region: 'Asia' },
  { code: 'PK', name: 'Pakistan', currency: 'PKR', flag: '🇵🇰', region: 'Asia' },
  { code: 'BD', name: 'Bangladesh', currency: 'BDT', flag: '🇧🇩', region: 'Asia' },
  { code: 'PH', name: 'Philippines', currency: 'PHP', flag: '🇵🇭', region: 'Asia' },
  { code: 'VN', name: 'Vietnam', currency: 'VND', flag: '🇻🇳', region: 'Asia' },
  { code: 'NP', name: 'Nepal', currency: 'NPR', flag: '🇳🇵', region: 'Asia' },
  // Latin America
  { code: 'MX', name: 'Mexico', currency: 'MXN', flag: '🇲🇽', region: 'Latin America' },
  { code: 'CO', name: 'Colombia', currency: 'COP', flag: '🇨🇴', region: 'Latin America' },
  { code: 'BR', name: 'Brazil', currency: 'BRL', flag: '🇧🇷', region: 'Latin America' },
  { code: 'PE', name: 'Peru', currency: 'PEN', flag: '🇵🇪', region: 'Latin America' },
];

// Exchange rates (in production, fetch from API)
const BASE_RATES: Record<string, number> = {
  'NG': 1550, 'GH': 12.5, 'KE': 153, 'ZA': 18.5, 'ET': 56, 'TZ': 2500,
  'UG': 3750, 'CM': 605, 'SN': 605, 'RW': 1250, 'ZM': 25, 'ZW': 5000,
  'JM': 155, 'TT': 6.8, 'BB': 2, 'HT': 132, 'DO': 58, 'GY': 209,
  'GB': 0.79, 'DE': 0.92, 'FR': 0.92, 'PL': 4.0, 'UA': 41, 'RO': 4.6,
  'IN': 83, 'PK': 278, 'BD': 110, 'PH': 56, 'VN': 24500, 'NP': 133,
  'MX': 17, 'CO': 4000, 'BR': 5, 'PE': 3.7,
};

export default function RemittanceScreen() {
  const [amount, setAmount] = useState('100');
  const [selectedCountry, setSelectedCountry] = useState(RECEIVING_COUNTRIES[0]);
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [showRecipientModal, setShowRecipientModal] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<TransferProvider | null>(null);
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [isTransferring, setIsTransferring] = useState(false);

  // Get providers and quotes for selected country
  const quotes = useMemo(() => {
    const numAmount = parseFloat(amount) || 0;
    if (numAmount < 1) return [];

    const baseRate = BASE_RATES[selectedCountry.code] || 1;
    const availableProviders = getProvidersForCountry(selectedCountry.code);

    return availableProviders.map((provider) => {
      // Add slight variation to rates per provider
      const rateVariation = 1 + ((provider.id.charCodeAt(0) % 10) - 5) * 0.002;
      const rate = baseRate * rateVariation;
      const quote = calculateQuote(provider, numAmount, rate);

      return {
        ...provider,
        ...quote,
        rateDisplay: rate.toFixed(2),
      };
    }).sort((a, b) => b.receiveAmount - a.receiveAmount);
  }, [amount, selectedCountry]);

  const bestDeal = quotes[0];
  const fastestProvider = [...quotes].sort((a, b) => a.speedRank - b.speedRank)[0];

  const handleProviderSelect = (provider: typeof quotes[0]) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedProvider(provider);
    setShowRecipientModal(true);
  };

  const handleTransfer = useCallback(async () => {
    if (!selectedProvider || !recipientName.trim()) {
      Alert.alert('Missing Information', 'Please enter the recipient name.');
      return;
    }

    setIsTransferring(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    const recipient: RecipientInfo = {
      name: recipientName.trim(),
      phone: recipientPhone.trim() || undefined,
      email: recipientEmail.trim() || undefined,
      country: selectedCountry.code,
      currency: selectedCountry.currency,
    };

    const intent: TransferIntent = {
      amount: parseFloat(amount),
      currency: 'USD',
      recipient,
      provider: selectedProvider,
    };

    try {
      const result = await openProviderForTransfer(selectedProvider, intent, true);

      if (result.opened) {
        // Close modal after successful redirect
        setShowRecipientModal(false);
        setRecipientName('');
        setRecipientPhone('');
        setRecipientEmail('');
      }
    } catch (error) {
      console.error('Transfer error:', error);
      Alert.alert('Error', 'Unable to open the transfer app. Please try again.');
    } finally {
      setIsTransferring(false);
    }
  }, [selectedProvider, recipientName, recipientPhone, recipientEmail, amount, selectedCountry]);

  const formatCurrency = (value: number) => {
    return value.toLocaleString('en-US', { maximumFractionDigits: 0 });
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
              <Text className="text-white/70 text-sm">Compare rates & send instantly</Text>
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
          className="bg-white mx-4 -mt-2 rounded-2xl shadow-lg overflow-hidden max-h-96"
        >
          <ScrollView showsVerticalScrollIndicator={false}>
            {['Africa', 'Caribbean', 'Europe', 'Asia', 'Latin America'].map((region) => (
              <View key={region}>
                <View className="bg-gray-50 px-4 py-2">
                  <Text className="text-gray-500 font-semibold text-xs uppercase">{region}</Text>
                </View>
                {RECEIVING_COUNTRIES.filter((c) => c.region === region).map((country) => (
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
              </View>
            ))}
          </ScrollView>
        </Animated.View>
      )}

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Best Deal Badge */}
        {bestDeal && parseFloat(amount) > 0 && (
          <Animated.View entering={FadeInUp.duration(400).delay(200)} className="mx-4 mt-4">
            <LinearGradient
              colors={['#C9A227', '#D4673A']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center' }}
            >
              <TrendingUp size={24} color="#FFFFFF" />
              <View className="ml-3 flex-1">
                <Text className="text-white font-bold">Best Deal: {bestDeal.name}</Text>
                <Text className="text-white/80 text-sm">
                  Receive {formatCurrency(bestDeal.receiveAmount)} {selectedCountry.currency}
                </Text>
              </View>
              <Zap size={20} color="#FFFFFF" />
            </LinearGradient>
          </Animated.View>
        )}

        {/* Provider Cards */}
        <View className="px-4 mt-4 pb-8">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-warmBrown font-bold text-lg">Available Providers</Text>
            <Text className="text-gray-500 text-sm">{quotes.length} options</Text>
          </View>

          {quotes.length === 0 && parseFloat(amount) > 0 && (
            <View className="bg-gray-100 rounded-2xl p-6 items-center">
              <Text className="text-gray-500 text-center">
                No providers available for {selectedCountry.name} yet.
              </Text>
            </View>
          )}

          {quotes.map((provider, index) => (
            <Animated.View
              key={provider.id}
              entering={FadeInUp.duration(400).delay(300 + index * 80)}
            >
              <Pressable
                onPress={() => handleProviderSelect(provider)}
                className="bg-white rounded-2xl p-4 mb-3 shadow-sm active:scale-[0.98]"
              >
                {/* Badges */}
                {index === 0 && (
                  <View className="absolute -top-2 -right-2 bg-terracotta-500 rounded-full px-3 py-1 flex-row items-center">
                    <Star size={10} color="#FFFFFF" fill="#FFFFFF" />
                    <Text className="text-white text-xs font-bold ml-1">Best Rate</Text>
                  </View>
                )}
                {provider.id === fastestProvider?.id && provider.id !== bestDeal?.id && (
                  <View className="absolute -top-2 -right-2 bg-forest-600 rounded-full px-3 py-1 flex-row items-center">
                    <Zap size={10} color="#FFFFFF" />
                    <Text className="text-white text-xs font-bold ml-1">Fastest</Text>
                  </View>
                )}
                {provider.hasAffiliate && (
                  <View className="absolute -top-2 left-4 bg-gold-500 rounded-full px-2 py-0.5 flex-row items-center">
                    <Gift size={8} color="#FFFFFF" />
                    <Text className="text-white text-[10px] font-bold ml-1">Bonus</Text>
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
                        {provider.rating} ({provider.reviews})
                      </Text>
                    </View>
                  </View>

                  {/* Amount Received */}
                  <View className="items-end">
                    <Text className="text-forest-700 font-bold text-lg">
                      {formatCurrency(provider.receiveAmount)}
                    </Text>
                    <Text className="text-gray-500 text-xs">{selectedCountry.currency}</Text>
                  </View>
                </View>

                {/* Details Row */}
                <View className="flex-row items-center mt-3 pt-3 border-t border-gray-100">
                  <View className="flex-row items-center flex-1">
                    <DollarSign size={14} color="#8B7355" />
                    <Text className="text-gray-600 text-sm ml-1">
                      Fee: ${provider.fee.toFixed(2)}
                    </Text>
                  </View>
                  <View className="flex-row items-center flex-1">
                    <TrendingUp size={14} color="#8B7355" />
                    <Text className="text-gray-600 text-sm ml-1">
                      Rate: {provider.rateDisplay}
                    </Text>
                  </View>
                  <View className="flex-row items-center">
                    <Clock size={14} color="#8B7355" />
                    <Text className="text-gray-600 text-sm ml-1">{provider.speed}</Text>
                  </View>
                </View>

                {/* Send Button */}
                <View className="mt-3 bg-forest-600 rounded-xl py-3 flex-row items-center justify-center">
                  <Text className="text-white font-semibold mr-2">
                    Send with {provider.name}
                  </Text>
                  <ChevronRight size={16} color="#FFFFFF" />
                </View>
              </Pressable>
            </Animated.View>
          ))}

          {/* How It Works */}
          <Animated.View entering={FadeInUp.duration(400).delay(700)} className="mt-4">
            <Text className="text-warmBrown font-bold text-lg mb-3">How It Works</Text>
            <View className="bg-white rounded-2xl p-4">
              <View className="flex-row items-center mb-4">
                <View className="w-8 h-8 bg-forest-100 rounded-full items-center justify-center mr-3">
                  <Text className="text-forest-700 font-bold">1</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-warmBrown font-semibold">Choose a provider</Text>
                  <Text className="text-gray-500 text-sm">Compare rates and pick the best deal</Text>
                </View>
              </View>
              <View className="flex-row items-center mb-4">
                <View className="w-8 h-8 bg-forest-100 rounded-full items-center justify-center mr-3">
                  <Text className="text-forest-700 font-bold">2</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-warmBrown font-semibold">Enter recipient details</Text>
                  <Text className="text-gray-500 text-sm">We'll pre-fill the provider's app</Text>
                </View>
              </View>
              <View className="flex-row items-center">
                <View className="w-8 h-8 bg-forest-100 rounded-full items-center justify-center mr-3">
                  <Text className="text-forest-700 font-bold">3</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-warmBrown font-semibold">Complete in provider app</Text>
                  <Text className="text-gray-500 text-sm">Securely finish your transfer</Text>
                </View>
              </View>
            </View>
          </Animated.View>

          {/* Trust & Security */}
          <Animated.View entering={FadeInUp.duration(400).delay(900)} className="mt-4">
            <View className="bg-forest-50 rounded-2xl p-4 flex-row items-center">
              <Shield size={24} color="#1B4D3E" />
              <View className="ml-3 flex-1">
                <Text className="text-forest-700 font-semibold">Secure & Regulated</Text>
                <Text className="text-forest-600 text-sm">
                  All providers are licensed money transmitters
                </Text>
              </View>
            </View>
          </Animated.View>
        </View>
      </ScrollView>

      {/* Recipient Details Modal */}
      <Modal
        visible={showRecipientModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowRecipientModal(false)}
      >
        <SafeAreaView className="flex-1 bg-cream-50">
          <View className="flex-1">
            {/* Modal Header */}
            <View className="flex-row items-center justify-between px-4 py-4 border-b border-gray-200">
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setShowRecipientModal(false);
                }}
                className="w-10 h-10 items-center justify-center"
              >
                <X size={24} color="#8B7355" />
              </Pressable>
              <Text className="text-warmBrown font-bold text-lg">Recipient Details</Text>
              <View className="w-10" />
            </View>

            <ScrollView className="flex-1 px-4 pt-4">
              {/* Selected Provider Summary */}
              {selectedProvider && (
                <Animated.View entering={FadeIn.duration(300)} className="mb-6">
                  <View className="bg-white rounded-2xl p-4 flex-row items-center">
                    <View
                      className="w-12 h-12 rounded-xl items-center justify-center mr-3"
                      style={{ backgroundColor: selectedProvider.color + '20' }}
                    >
                      <Text className="text-xl font-bold" style={{ color: selectedProvider.color }}>
                        {selectedProvider.name.charAt(0)}
                      </Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-warmBrown font-bold">{selectedProvider.name}</Text>
                      <Text className="text-gray-500 text-sm">
                        Sending ${amount} to {selectedCountry.name}
                      </Text>
                    </View>
                    <View className="items-end">
                      <Text className="text-forest-700 font-bold">
                        {formatCurrency((selectedProvider as any).receiveAmount || 0)}
                      </Text>
                      <Text className="text-gray-500 text-xs">{selectedCountry.currency}</Text>
                    </View>
                  </View>
                </Animated.View>
              )}

              {/* Recipient Form */}
              <Animated.View entering={FadeInUp.duration(400).delay(100)}>
                <Text className="text-warmBrown font-semibold mb-2">Recipient Name *</Text>
                <View className="bg-white rounded-xl px-4 py-3 flex-row items-center mb-4">
                  <User size={20} color="#8B7355" />
                  <TextInput
                    value={recipientName}
                    onChangeText={setRecipientName}
                    placeholder="Full name as on ID"
                    placeholderTextColor="#9CA3AF"
                    className="flex-1 ml-3 text-warmBrown text-base"
                  />
                </View>
              </Animated.View>

              <Animated.View entering={FadeInUp.duration(400).delay(200)}>
                <Text className="text-warmBrown font-semibold mb-2">Phone Number (Optional)</Text>
                <View className="bg-white rounded-xl px-4 py-3 flex-row items-center mb-4">
                  <Phone size={20} color="#8B7355" />
                  <TextInput
                    value={recipientPhone}
                    onChangeText={setRecipientPhone}
                    placeholder="Mobile money or contact number"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="phone-pad"
                    className="flex-1 ml-3 text-warmBrown text-base"
                  />
                </View>
              </Animated.View>

              <Animated.View entering={FadeInUp.duration(400).delay(300)}>
                <Text className="text-warmBrown font-semibold mb-2">Email (Optional)</Text>
                <View className="bg-white rounded-xl px-4 py-3 flex-row items-center mb-4">
                  <Mail size={20} color="#8B7355" />
                  <TextInput
                    value={recipientEmail}
                    onChangeText={setRecipientEmail}
                    placeholder="recipient@email.com"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    className="flex-1 ml-3 text-warmBrown text-base"
                  />
                </View>
              </Animated.View>

              {/* What happens next */}
              <Animated.View entering={FadeInUp.duration(400).delay(400)} className="mt-4">
                <View className="bg-forest-50 rounded-2xl p-4">
                  <Text className="text-forest-700 font-semibold mb-2">What happens next?</Text>
                  <View className="flex-row items-start mb-2">
                    <Smartphone size={16} color="#1B4D3E" />
                    <Text className="text-forest-600 text-sm ml-2 flex-1">
                      We'll open {selectedProvider?.name}'s app or website
                    </Text>
                  </View>
                  <View className="flex-row items-start mb-2">
                    <CheckCircle size={16} color="#1B4D3E" />
                    <Text className="text-forest-600 text-sm ml-2 flex-1">
                      Your transfer details will be pre-filled
                    </Text>
                  </View>
                  <View className="flex-row items-start">
                    <Shield size={16} color="#1B4D3E" />
                    <Text className="text-forest-600 text-sm ml-2 flex-1">
                      Complete payment securely with {selectedProvider?.name}
                    </Text>
                  </View>
                </View>
              </Animated.View>

              {/* Affiliate bonus note */}
              {selectedProvider?.hasAffiliate && (
                <Animated.View entering={FadeInUp.duration(400).delay(500)} className="mt-4">
                  <View className="bg-gold-50 border border-gold-200 rounded-2xl p-4 flex-row items-center">
                    <Gift size={20} color="#C9A227" />
                    <Text className="text-gold-700 text-sm ml-3 flex-1">
                      New to {selectedProvider.name}? You may be eligible for a sign-up bonus!
                    </Text>
                  </View>
                </Animated.View>
              )}
            </ScrollView>

            {/* Send Button */}
            <View className="px-4 pb-8 pt-4">
              <Pressable
                onPress={handleTransfer}
                disabled={isTransferring || !recipientName.trim()}
                className={`rounded-2xl py-4 flex-row items-center justify-center ${
                  recipientName.trim() ? 'bg-forest-600' : 'bg-gray-300'
                }`}
              >
                {isTransferring ? (
                  <Text className="text-white font-bold text-lg">Opening {selectedProvider?.name}...</Text>
                ) : (
                  <>
                    <ExternalLink size={20} color="#FFFFFF" />
                    <Text className="text-white font-bold text-lg ml-2">
                      Continue to {selectedProvider?.name}
                    </Text>
                  </>
                )}
              </Pressable>
              <Text className="text-gray-500 text-xs text-center mt-3">
                You'll complete the transfer securely in {selectedProvider?.name}'s app
              </Text>
            </View>
          </View>
        </SafeAreaView>
      </Modal>
    </View>
  );
}
