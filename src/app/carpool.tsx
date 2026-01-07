import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, Modal, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import {
  ArrowLeft, Car, MapPin, Calendar, Clock, Users, Star, MessageCircle, Plus, X,
  ChevronRight, Plane, Briefcase, Music, PartyPopper, CreditCard, Banknote, Gem,
  DollarSign, Smartphone, Check, Info, Shield, Globe, Building, Send, Wallet
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

type PaymentMethod = 'cash' | 'cashapp' | 'venmo' | 'zelle' | 'paypal' | 'wise' | 'mpesa' | 'bank' | 'inapp';

interface PaymentInfo {
  cashApp?: string;
  venmo?: string;
  zelle?: string;
  paypal?: string;
  wise?: string;
  mpesa?: string;
  bankDetails?: string;
  acceptsCash: boolean;
  acceptsInApp: boolean;
}

interface CarpoolRide {
  id: string;
  driver: {
    name: string;
    avatar: string;
    rating: number;
    rides: number;
    isVerified: boolean;
  };
  from: string;
  fromCity: string;
  to: string;
  toCity: string;
  date: string;
  time: string;
  seats: number;
  seatsAvailable: number;
  price: number;
  priceDisplay: string;
  type: 'commute' | 'airport' | 'event' | 'road-trip';
  description: string;
  amenities: string[];
  isRecurring: boolean;
  paymentInfo: PaymentInfo;
}

const MOCK_RIDES: CarpoolRide[] = [
  {
    id: '1',
    driver: {
      name: 'Michael Adeyemi',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200',
      rating: 4.9,
      rides: 156,
      isVerified: true,
    },
    from: 'Harlem, Manhattan',
    fromCity: 'New York, USA',
    to: 'JFK Airport',
    toCity: 'Queens, USA',
    date: 'Tomorrow',
    time: '6:30 AM',
    seats: 4,
    seatsAvailable: 3,
    price: 25,
    priceDisplay: '$25 USD',
    type: 'airport',
    description: 'Early morning airport run. I have a spacious SUV with room for luggage. Playing smooth jazz during the ride.',
    amenities: ['AC', 'Music', 'Luggage Space', 'Charger'],
    isRecurring: false,
    paymentInfo: {
      cashApp: '$MikeAdeyemi',
      venmo: '@MikeAdeyemi',
      zelle: 'mike@email.com',
      paypal: 'mike.adeyemi@email.com',
      acceptsCash: true,
      acceptsInApp: true,
    },
  },
  {
    id: '2',
    driver: {
      name: 'Kwame Asante',
      avatar: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=200',
      rating: 4.8,
      rides: 89,
      isVerified: true,
    },
    from: 'Accra Central',
    fromCity: 'Accra, Ghana',
    to: 'Kotoka Airport',
    toCity: 'Accra, Ghana',
    date: 'Mon-Fri',
    time: '8:00 AM',
    seats: 3,
    seatsAvailable: 2,
    price: 80,
    priceDisplay: '₵80 GHS',
    type: 'airport',
    description: 'Daily airport runs. Reliable service with comfortable AC vehicle. I speak English, Twi, and French.',
    amenities: ['AC', 'Quiet Ride', 'Charger'],
    isRecurring: true,
    paymentInfo: {
      mpesa: '+233 24 123 4567',
      bankDetails: 'Access Bank - 1234567890',
      acceptsCash: true,
      acceptsInApp: true,
    },
  },
  {
    id: '3',
    driver: {
      name: 'Fatima Okonkwo',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200',
      rating: 4.7,
      rides: 45,
      isVerified: true,
    },
    from: 'Victoria Island',
    fromCity: 'Lagos, Nigeria',
    to: 'Lekki Phase 1',
    toCity: 'Lagos, Nigeria',
    date: 'Daily',
    time: '7:30 AM',
    seats: 4,
    seatsAvailable: 2,
    price: 3000,
    priceDisplay: '₦3,000 NGN',
    type: 'commute',
    description: 'Daily commute through Victoria Island to Lekki. Avoid Third Mainland traffic. AC vehicle, very punctual.',
    amenities: ['AC', 'Music', 'Rest Stops', 'Good Vibes'],
    isRecurring: true,
    paymentInfo: {
      bankDetails: 'GTBank - 0123456789 (Fatima Okonkwo)',
      mpesa: '+234 803 123 4567',
      acceptsCash: true,
      acceptsInApp: true,
    },
  },
  {
    id: '4',
    driver: {
      name: 'Sophie Mensah',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200',
      rating: 5.0,
      rides: 234,
      isVerified: true,
    },
    from: 'Brixton',
    fromCity: 'London, UK',
    to: 'Heathrow Airport',
    toCity: 'London, UK',
    date: 'Today',
    time: '3:00 PM',
    seats: 3,
    seatsAvailable: 2,
    price: 35,
    priceDisplay: '£35 GBP',
    type: 'airport',
    description: 'Quick airport drop-off. Can accommodate 2 large suitcases. Clean car with great reviews!',
    amenities: ['AC', 'Luggage Space', 'Charger', 'Water'],
    isRecurring: false,
    paymentInfo: {
      paypal: 'sophie.mensah@email.com',
      wise: 'sophie.mensah@email.com',
      bankDetails: 'Monzo - Sort: 04-00-04 Acc: 12345678',
      acceptsCash: true,
      acceptsInApp: true,
    },
  },
  {
    id: '5',
    driver: {
      name: 'Jean-Pierre Diallo',
      avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200',
      rating: 4.6,
      rides: 67,
      isVerified: false,
    },
    from: 'Dakar Centre',
    fromCity: 'Dakar, Senegal',
    to: 'Blaise Diagne Airport',
    toCity: 'Diass, Senegal',
    date: 'Tomorrow',
    time: '5:00 AM',
    seats: 4,
    seatsAvailable: 3,
    price: 15000,
    priceDisplay: '15,000 CFA',
    type: 'airport',
    description: 'Airport transfer to AIBD. Spacious vehicle with plenty of luggage space. I speak French, Wolof, and English.',
    amenities: ['AC', 'Music', 'Luggage Space', 'Water'],
    isRecurring: false,
    paymentInfo: {
      mpesa: '+221 77 123 4567',
      wise: 'jpdiallo@email.com',
      acceptsCash: true,
      acceptsInApp: true,
    },
  },
  {
    id: '6',
    driver: {
      name: 'Amara Keita',
      avatar: 'https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=200',
      rating: 4.9,
      rides: 112,
      isVerified: true,
    },
    from: 'Nairobi CBD',
    fromCity: 'Nairobi, Kenya',
    to: 'JKIA Airport',
    toCity: 'Nairobi, Kenya',
    date: 'Daily',
    time: '6:00 AM',
    seats: 3,
    seatsAvailable: 2,
    price: 2500,
    priceDisplay: 'KSh 2,500',
    type: 'airport',
    description: 'Early morning airport runs. Comfortable SUV, reliable timing. M-Pesa accepted. Habari!',
    amenities: ['AC', 'Charger', 'Luggage Space', 'Snacks'],
    isRecurring: true,
    paymentInfo: {
      mpesa: '+254 712 345 678',
      bankDetails: 'Equity Bank - 0987654321',
      acceptsCash: true,
      acceptsInApp: true,
    },
  },
];

const RIDE_TYPES = [
  { key: 'all', label: 'All Rides', icon: Car },
  { key: 'airport', label: 'Airport', icon: Plane },
  { key: 'commute', label: 'Commute', icon: Briefcase },
  { key: 'event', label: 'Events', icon: PartyPopper },
  { key: 'road-trip', label: 'Road Trip', icon: Music },
];

const TYPE_COLORS: Record<string, string> = {
  airport: '#3B82F6',
  commute: '#10B981',
  event: '#F59E0B',
  'road-trip': '#EC4899',
};

const PLATFORM_FEE_PERCENT = 5; // 5% platform fee for in-app payments

export default function CarpoolScreen() {
  const [selectedType, setSelectedType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showPostModal, setShowPostModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedRide, setSelectedRide] = useState<CarpoolRide | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(null);
  const [coverFee, setCoverFee] = useState(false);

  // Post ride form state
  const [postForm, setPostForm] = useState({
    pickup: '',
    destination: '',
    date: '',
    time: '',
    seats: '',
    price: '',
    currency: '',
    cashApp: '',
    venmo: '',
    zelle: '',
    paypal: '',
    wise: '',
    mpesa: '',
    bankDetails: '',
    acceptsCash: true,
    acceptsInApp: true,
  });

  const filteredRides = MOCK_RIDES.filter(ride => {
    const matchesType = selectedType === 'all' || ride.type === selectedType;
    const matchesSearch = searchQuery === '' ||
      ride.from.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ride.to.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ride.driver.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  const handleRequestRide = (ride: CarpoolRide) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedRide(ride);
    setSelectedPaymentMethod(null);
    setCoverFee(false);
    setShowPaymentModal(true);
  };

  const calculateTotal = (price: number, method: PaymentMethod | null) => {
    if (method === 'inapp' && !coverFee) {
      return price; // Driver receives price - 5%
    } else if (method === 'inapp' && coverFee) {
      return Math.ceil(price * (1 + PLATFORM_FEE_PERCENT / 100)); // Passenger pays extra
    }
    return price;
  };

  const getDriverPayout = (price: number, method: PaymentMethod | null) => {
    if (method === 'inapp') {
      if (coverFee) {
        return price; // Driver gets full amount when passenger covers fee
      }
      return Math.floor(price * (1 - PLATFORM_FEE_PERCENT / 100)); // Driver gets 95%
    }
    return price; // Full amount for external payments
  };

  const confirmPayment = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setShowPaymentModal(false);
    // In real app, would process payment or show payment info
  };

  const getPaymentMethodAvailable = (ride: CarpoolRide) => {
    const methods: { method: PaymentMethod; label: string; icon: any; handle?: string }[] = [];

    if (ride.paymentInfo.acceptsInApp) {
      methods.push({ method: 'inapp', label: 'Pay in App', icon: Gem });
    }
    if (ride.paymentInfo.mpesa) {
      methods.push({ method: 'mpesa', label: 'M-Pesa / Mobile Money', icon: Smartphone, handle: ride.paymentInfo.mpesa });
    }
    if (ride.paymentInfo.paypal) {
      methods.push({ method: 'paypal', label: 'PayPal', icon: Globe, handle: ride.paymentInfo.paypal });
    }
    if (ride.paymentInfo.wise) {
      methods.push({ method: 'wise', label: 'Wise (TransferWise)', icon: Send, handle: ride.paymentInfo.wise });
    }
    if (ride.paymentInfo.cashApp) {
      methods.push({ method: 'cashapp', label: 'Cash App', icon: DollarSign, handle: ride.paymentInfo.cashApp });
    }
    if (ride.paymentInfo.venmo) {
      methods.push({ method: 'venmo', label: 'Venmo', icon: Smartphone, handle: ride.paymentInfo.venmo });
    }
    if (ride.paymentInfo.zelle) {
      methods.push({ method: 'zelle', label: 'Zelle', icon: Banknote, handle: ride.paymentInfo.zelle });
    }
    if (ride.paymentInfo.bankDetails) {
      methods.push({ method: 'bank', label: 'Bank Transfer', icon: Building, handle: ride.paymentInfo.bankDetails });
    }
    if (ride.paymentInfo.acceptsCash) {
      methods.push({ method: 'cash', label: 'Cash', icon: Wallet });
    }

    return methods;
  };

  return (
    <View className="flex-1 bg-[#0A0A0A]">
      <SafeAreaView edges={['top']} className="flex-1">
        {/* Header */}
        <View className="px-5 pb-4">
          <View className="flex-row items-center justify-between mb-4">
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.back();
              }}
              className="w-10 h-10 rounded-full bg-white/10 items-center justify-center"
            >
              <ArrowLeft size={20} color="#fff" />
            </Pressable>
            <View className="flex-row items-center">
              <Car size={20} color="#3B82F6" />
              <Text className="text-white text-lg font-bold ml-2">Carpool</Text>
            </View>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                setShowPostModal(true);
              }}
              className="w-10 h-10 rounded-full bg-blue-500 items-center justify-center"
            >
              <Plus size={20} color="#fff" />
            </Pressable>
          </View>

          {/* Search */}
          <View className="flex-row items-center bg-white/10 rounded-2xl px-4 py-3 mb-4">
            <MapPin size={18} color="#9CA3AF" />
            <TextInput
              placeholder="Where are you going?"
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
              className="flex-1 ml-3 text-white text-base"
            />
          </View>

          {/* Ride Type Filter */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }}>
            <View className="flex-row gap-2">
              {RIDE_TYPES.map((type) => {
                const Icon = type.icon;
                return (
                  <Pressable
                    key={type.key}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setSelectedType(type.key);
                    }}
                    className={`flex-row items-center px-4 py-2.5 rounded-full ${
                      selectedType === type.key
                        ? 'bg-blue-500'
                        : 'bg-white/10'
                    }`}
                  >
                    <Icon size={16} color={selectedType === type.key ? '#fff' : '#9CA3AF'} />
                    <Text className={`ml-2 font-medium ${
                      selectedType === type.key ? 'text-white' : 'text-gray-300'
                    }`}>
                      {type.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>
        </View>

        {/* Rides List */}
        <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
          {filteredRides.map((ride, index) => (
            <Animated.View
              key={ride.id}
              entering={FadeInDown.delay(index * 80).springify()}
            >
              <Pressable
                onPress={() => handleRequestRide(ride)}
                className="bg-white/5 rounded-3xl overflow-hidden mb-4 border border-white/10"
              >
                {/* Type Badge & Payment Icons */}
                <View className="flex-row items-center justify-between px-4 pt-4">
                  <View
                    className="px-3 py-1.5 rounded-full"
                    style={{ backgroundColor: TYPE_COLORS[ride.type] + '30' }}
                  >
                    <Text style={{ color: TYPE_COLORS[ride.type] }} className="text-xs font-bold uppercase">
                      {ride.type.replace('-', ' ')}
                    </Text>
                  </View>
                  {/* Payment Methods Available */}
                  <View className="flex-row items-center gap-1">
                    {ride.paymentInfo.acceptsInApp && (
                      <View className="bg-purple-500/30 px-2 py-1 rounded-full flex-row items-center">
                        <Gem size={12} color="#A855F7" />
                        <Text className="text-purple-400 text-xs ml-1">In-App</Text>
                      </View>
                    )}
                    {(ride.paymentInfo.cashApp || ride.paymentInfo.venmo || ride.paymentInfo.zelle) && (
                      <View className="bg-green-500/30 px-2 py-1 rounded-full">
                        <Text className="text-green-400 text-xs">External</Text>
                      </View>
                    )}
                  </View>
                </View>

                {/* Route */}
                <View className="px-4 py-4">
                  <View className="flex-row items-start">
                    <View className="items-center mr-3">
                      <View className="w-3 h-3 rounded-full bg-green-500" />
                      <View className="w-0.5 h-12 bg-white/20 my-1" />
                      <View className="w-3 h-3 rounded-full bg-red-500" />
                    </View>
                    <View className="flex-1">
                      <View className="mb-3">
                        <Text className="text-white font-bold text-base">{ride.from}</Text>
                        <Text className="text-gray-500 text-sm">{ride.fromCity}</Text>
                      </View>
                      <View>
                        <Text className="text-white font-bold text-base">{ride.to}</Text>
                        <Text className="text-gray-500 text-sm">{ride.toCity}</Text>
                      </View>
                    </View>
                    <View className="items-end">
                      <Text className="text-blue-400 text-2xl font-bold">{ride.priceDisplay}</Text>
                      <Text className="text-gray-500 text-xs">per seat</Text>
                    </View>
                  </View>
                </View>

                {/* Date & Time */}
                <View className="flex-row items-center px-4 mb-4">
                  <View className="flex-row items-center mr-4">
                    <Calendar size={14} color="#9CA3AF" />
                    <Text className="text-gray-300 ml-1.5 text-sm">{ride.date}</Text>
                    {ride.isRecurring && (
                      <View className="ml-2 px-2 py-0.5 rounded-full bg-purple-500/30">
                        <Text className="text-purple-400 text-xs">Recurring</Text>
                      </View>
                    )}
                  </View>
                  <View className="flex-row items-center mr-4">
                    <Clock size={14} color="#9CA3AF" />
                    <Text className="text-gray-300 ml-1.5 text-sm">{ride.time}</Text>
                  </View>
                  <View className="flex-row items-center">
                    <Users size={14} color="#9CA3AF" />
                    <Text className="text-gray-300 ml-1.5 text-sm">{ride.seatsAvailable}/{ride.seats} seats</Text>
                  </View>
                </View>

                {/* Description */}
                <Text className="text-gray-400 text-sm px-4 mb-3 leading-5">{ride.description}</Text>

                {/* Amenities */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-4 mb-4" style={{ flexGrow: 0 }}>
                  <View className="flex-row gap-2">
                    {ride.amenities.map((amenity, idx) => (
                      <View key={idx} className="px-3 py-1.5 rounded-full bg-white/10">
                        <Text className="text-gray-300 text-xs">{amenity}</Text>
                      </View>
                    ))}
                  </View>
                </ScrollView>

                {/* Driver Info & Action */}
                <View className="flex-row items-center justify-between px-4 py-3 bg-white/5 border-t border-white/10">
                  <View className="flex-row items-center">
                    <Image
                      source={{ uri: ride.driver.avatar }}
                      style={{ width: 40, height: 40, borderRadius: 20 }}
                      contentFit="cover"
                    />
                    <View className="ml-3">
                      <View className="flex-row items-center">
                        <Text className="text-white font-semibold">{ride.driver.name}</Text>
                        {ride.driver.isVerified && (
                          <View className="ml-1.5 w-4 h-4 rounded-full bg-blue-500 items-center justify-center">
                            <Text className="text-white text-xs">✓</Text>
                          </View>
                        )}
                      </View>
                      <View className="flex-row items-center">
                        <Star size={12} color="#FBBF24" fill="#FBBF24" />
                        <Text className="text-yellow-400 text-xs ml-1">{ride.driver.rating}</Text>
                        <Text className="text-gray-500 text-xs ml-2">• {ride.driver.rides} rides</Text>
                      </View>
                    </View>
                  </View>
                  <Pressable
                    onPress={() => handleRequestRide(ride)}
                    className="flex-row items-center bg-blue-500 px-4 py-2.5 rounded-full"
                  >
                    <Text className="text-white font-semibold">Book</Text>
                    <ChevronRight size={16} color="#fff" />
                  </Pressable>
                </View>
              </Pressable>
            </Animated.View>
          ))}

          <View className="h-32" />
        </ScrollView>

        {/* Payment Method Modal */}
        <Modal visible={showPaymentModal} animationType="slide" transparent>
          <View className="flex-1 bg-black/80 justify-end">
            <Animated.View
              entering={ZoomIn.springify()}
              className="bg-[#1A1A2E] rounded-t-3xl"
            >
              <View className="p-6">
                <View className="flex-row items-center justify-between mb-4">
                  <Text className="text-white text-xl font-bold">How do you want to pay?</Text>
                  <Pressable
                    onPress={() => setShowPaymentModal(false)}
                    className="w-8 h-8 rounded-full bg-white/10 items-center justify-center"
                  >
                    <X size={18} color="#fff" />
                  </Pressable>
                </View>

                {selectedRide && (
                  <>
                    {/* Ride Summary */}
                    <View className="bg-white/5 rounded-2xl p-4 mb-4">
                      <View className="flex-row items-center">
                        <Image
                          source={{ uri: selectedRide.driver.avatar }}
                          style={{ width: 48, height: 48, borderRadius: 24 }}
                          contentFit="cover"
                        />
                        <View className="ml-3 flex-1">
                          <Text className="text-white font-semibold">{selectedRide.driver.name}</Text>
                          <Text className="text-gray-400 text-sm">{selectedRide.from} → {selectedRide.to}</Text>
                        </View>
                        <Text className="text-blue-400 text-xl font-bold">{selectedRide.priceDisplay}</Text>
                      </View>
                    </View>

                    {/* Payment Methods */}
                    <Text className="text-gray-400 text-sm mb-3">Select payment method</Text>

                    {getPaymentMethodAvailable(selectedRide).map((method) => (
                      <Pressable
                        key={method.method}
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          setSelectedPaymentMethod(method.method);
                        }}
                        className={`flex-row items-center p-4 rounded-2xl mb-2 border ${
                          selectedPaymentMethod === method.method
                            ? 'bg-blue-500/20 border-blue-500'
                            : 'bg-white/5 border-white/10'
                        }`}
                      >
                        <View className={`w-10 h-10 rounded-full items-center justify-center ${
                          method.method === 'inapp' ? 'bg-purple-500/30' :
                          method.method === 'cashapp' ? 'bg-green-500/30' :
                          method.method === 'venmo' ? 'bg-blue-500/30' :
                          method.method === 'zelle' ? 'bg-purple-500/30' :
                          method.method === 'paypal' ? 'bg-blue-500/30' :
                          method.method === 'wise' ? 'bg-emerald-500/30' :
                          method.method === 'mpesa' ? 'bg-green-500/30' :
                          method.method === 'bank' ? 'bg-slate-500/30' : 'bg-amber-500/30'
                        }`}>
                          <method.icon size={20} color={
                            method.method === 'inapp' ? '#A855F7' :
                            method.method === 'cashapp' ? '#00D632' :
                            method.method === 'venmo' ? '#008CFF' :
                            method.method === 'zelle' ? '#6D1ED4' :
                            method.method === 'paypal' ? '#003087' :
                            method.method === 'wise' ? '#37517E' :
                            method.method === 'mpesa' ? '#4CAF50' :
                            method.method === 'bank' ? '#64748B' : '#F59E0B'
                          } />
                        </View>
                        <View className="flex-1 ml-3">
                          <Text className="text-white font-semibold">{method.label}</Text>
                          {method.handle && (
                            <Text className="text-gray-400 text-sm">{method.handle}</Text>
                          )}
                          {method.method === 'inapp' && (
                            <Text className="text-purple-400 text-xs">5% platform fee applies</Text>
                          )}
                          {method.method === 'cash' && (
                            <Text className="text-gray-500 text-xs">Pay driver directly</Text>
                          )}
                        </View>
                        {selectedPaymentMethod === method.method && (
                          <View className="w-6 h-6 rounded-full bg-blue-500 items-center justify-center">
                            <Check size={14} color="#fff" />
                          </View>
                        )}
                      </Pressable>
                    ))}

                    {/* Cover Fee Option (only for in-app) */}
                    {selectedPaymentMethod === 'inapp' && (
                      <Animated.View entering={FadeInDown.duration(300)} className="bg-purple-500/10 rounded-2xl p-4 mt-2 mb-4">
                        <View className="flex-row items-center justify-between">
                          <View className="flex-1 mr-3">
                            <Text className="text-white font-semibold">Support the driver</Text>
                            <Text className="text-gray-400 text-sm">Cover the 5% fee so driver gets full amount</Text>
                          </View>
                          <Switch
                            value={coverFee}
                            onValueChange={(value) => {
                              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                              setCoverFee(value);
                            }}
                            trackColor={{ false: '#374151', true: '#7C3AED' }}
                            thumbColor="#fff"
                          />
                        </View>

                        {/* Price Breakdown */}
                        <View className="mt-3 pt-3 border-t border-purple-500/30">
                          <View className="flex-row justify-between mb-1">
                            <Text className="text-gray-400 text-sm">Ride price</Text>
                            <Text className="text-white">${selectedRide.price.toFixed(2)}</Text>
                          </View>
                          {coverFee && (
                            <View className="flex-row justify-between mb-1">
                              <Text className="text-gray-400 text-sm">Platform fee (5%)</Text>
                              <Text className="text-white">+${(selectedRide.price * 0.05).toFixed(2)}</Text>
                            </View>
                          )}
                          <View className="flex-row justify-between mt-2 pt-2 border-t border-purple-500/20">
                            <Text className="text-white font-semibold">You pay</Text>
                            <Text className="text-purple-400 font-bold text-lg">
                              ${calculateTotal(selectedRide.price, 'inapp').toFixed(2)}
                            </Text>
                          </View>
                          <View className="flex-row justify-between mt-1">
                            <Text className="text-gray-500 text-sm">Driver receives</Text>
                            <Text className="text-green-400 text-sm">
                              ${getDriverPayout(selectedRide.price, 'inapp').toFixed(2)}
                            </Text>
                          </View>
                        </View>
                      </Animated.View>
                    )}

                    {/* Info Banner */}
                    {selectedPaymentMethod && selectedPaymentMethod !== 'inapp' && selectedPaymentMethod !== 'cash' && (
                      <View className="flex-row items-start bg-blue-500/10 rounded-2xl p-4 mt-2 mb-4">
                        <Info size={18} color="#3B82F6" style={{ marginTop: 2 }} />
                        <Text className="text-blue-300 text-sm ml-2 flex-1">
                          {selectedPaymentMethod === 'mpesa' ? 'Send payment via M-Pesa or Mobile Money to the driver\'s number before or after the ride.' :
                           selectedPaymentMethod === 'paypal' ? 'Send payment via PayPal to the driver\'s email before or after the ride.' :
                           selectedPaymentMethod === 'wise' ? 'Send payment via Wise (TransferWise) to the driver before or after the ride.' :
                           selectedPaymentMethod === 'bank' ? 'Transfer payment to the driver\'s bank account before or after the ride.' :
                           `Send payment to the driver using their ${selectedPaymentMethod === 'cashapp' ? 'Cash App' : selectedPaymentMethod === 'venmo' ? 'Venmo' : 'Zelle'} before or after the ride.`}
                        </Text>
                      </View>
                    )}

                    {/* Confirm Button */}
                    <Pressable
                      onPress={confirmPayment}
                      disabled={!selectedPaymentMethod}
                      className="mt-2"
                    >
                      <LinearGradient
                        colors={selectedPaymentMethod ? ['#3B82F6', '#2563EB'] : ['#374151', '#374151']}
                        style={{ borderRadius: 16, paddingVertical: 16, alignItems: 'center' }}
                      >
                        <Text className="text-white font-bold text-lg">
                          {selectedPaymentMethod === 'inapp'
                            ? `Pay $${calculateTotal(selectedRide.price, 'inapp').toFixed(2)}`
                            : selectedPaymentMethod
                              ? 'Confirm Booking'
                              : 'Select Payment Method'
                          }
                        </Text>
                      </LinearGradient>
                    </Pressable>

                    <View className="flex-row items-center justify-center mt-4">
                      <Shield size={14} color="#6B7280" />
                      <Text className="text-gray-500 text-xs ml-1">Secure booking</Text>
                    </View>
                  </>
                )}
              </View>
              <View className="h-8" />
            </Animated.View>
          </View>
        </Modal>

        {/* Post Ride Modal */}
        <Modal visible={showPostModal} animationType="slide" transparent>
          <View className="flex-1 bg-black/80 justify-end">
            <ScrollView className="max-h-[90%]">
              <View className="bg-[#1A1A2E] rounded-t-3xl p-6">
                <View className="flex-row items-center justify-between mb-6">
                  <Text className="text-white text-xl font-bold">Offer a Ride</Text>
                  <Pressable
                    onPress={() => setShowPostModal(false)}
                    className="w-8 h-8 rounded-full bg-white/10 items-center justify-center"
                  >
                    <X size={18} color="#fff" />
                  </Pressable>
                </View>

                {/* Route Details */}
                <View className="mb-4">
                  <Text className="text-gray-400 text-sm mb-2">Pickup Location</Text>
                  <TextInput
                    placeholder="Enter pickup address..."
                    placeholderTextColor="#6B7280"
                    value={postForm.pickup}
                    onChangeText={(text) => setPostForm({ ...postForm, pickup: text })}
                    className="bg-white/10 rounded-xl px-4 py-3 text-white"
                  />
                </View>

                <View className="mb-4">
                  <Text className="text-gray-400 text-sm mb-2">Destination</Text>
                  <TextInput
                    placeholder="Enter destination..."
                    placeholderTextColor="#6B7280"
                    value={postForm.destination}
                    onChangeText={(text) => setPostForm({ ...postForm, destination: text })}
                    className="bg-white/10 rounded-xl px-4 py-3 text-white"
                  />
                </View>

                <View className="flex-row gap-3 mb-4">
                  <View className="flex-1">
                    <Text className="text-gray-400 text-sm mb-2">Date</Text>
                    <TextInput
                      placeholder="e.g., Tomorrow"
                      placeholderTextColor="#6B7280"
                      value={postForm.date}
                      onChangeText={(text) => setPostForm({ ...postForm, date: text })}
                      className="bg-white/10 rounded-xl px-4 py-3 text-white"
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-gray-400 text-sm mb-2">Time</Text>
                    <TextInput
                      placeholder="e.g., 6:30 AM"
                      placeholderTextColor="#6B7280"
                      value={postForm.time}
                      onChangeText={(text) => setPostForm({ ...postForm, time: text })}
                      className="bg-white/10 rounded-xl px-4 py-3 text-white"
                    />
                  </View>
                </View>

                <View className="flex-row gap-3 mb-6">
                  <View className="flex-1">
                    <Text className="text-gray-400 text-sm mb-2">Seats Available</Text>
                    <TextInput
                      placeholder="1-4"
                      placeholderTextColor="#6B7280"
                      keyboardType="number-pad"
                      value={postForm.seats}
                      onChangeText={(text) => setPostForm({ ...postForm, seats: text })}
                      className="bg-white/10 rounded-xl px-4 py-3 text-white"
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-gray-400 text-sm mb-2">Price per Seat</Text>
                    <TextInput
                      placeholder="25"
                      placeholderTextColor="#6B7280"
                      keyboardType="number-pad"
                      value={postForm.price}
                      onChangeText={(text) => setPostForm({ ...postForm, price: text })}
                      className="bg-white/10 rounded-xl px-4 py-3 text-white"
                    />
                  </View>
                </View>

                {/* Currency Selection */}
                <View className="mb-6">
                  <Text className="text-gray-400 text-sm mb-2">Currency</Text>
                  <TextInput
                    placeholder="e.g., USD, GBP, NGN, KES, GHS, EUR, CFA"
                    placeholderTextColor="#6B7280"
                    value={postForm.currency}
                    onChangeText={(text) => setPostForm({ ...postForm, currency: text.toUpperCase() })}
                    autoCapitalize="characters"
                    className="bg-white/10 rounded-xl px-4 py-3 text-white"
                  />
                  <Text className="text-gray-500 text-xs mt-1">Enter your local currency code</Text>
                </View>

                {/* Payment Methods Section */}
                <View className="bg-white/5 rounded-2xl p-4 mb-6">
                  <View className="flex-row items-center mb-3">
                    <Globe size={18} color="#3B82F6" />
                    <Text className="text-white font-bold text-base ml-2">Payment Methods</Text>
                  </View>
                  <Text className="text-gray-400 text-sm mb-4">
                    Add your payment details. Only fill in the methods you use in your country.
                  </Text>

                  {/* M-Pesa / Mobile Money */}
                  <View className="mb-3">
                    <View className="flex-row items-center mb-2">
                      <View className="w-6 h-6 rounded bg-green-500/30 items-center justify-center mr-2">
                        <Smartphone size={14} color="#4CAF50" />
                      </View>
                      <Text className="text-gray-300 text-sm">M-Pesa / Mobile Money</Text>
                      <Text className="text-green-400 text-xs ml-auto">Africa</Text>
                    </View>
                    <TextInput
                      placeholder="+254 712 345 678"
                      placeholderTextColor="#6B7280"
                      value={postForm.mpesa}
                      onChangeText={(text) => setPostForm({ ...postForm, mpesa: text })}
                      keyboardType="phone-pad"
                      className="bg-white/10 rounded-xl px-4 py-3 text-white"
                    />
                  </View>

                  {/* PayPal */}
                  <View className="mb-3">
                    <View className="flex-row items-center mb-2">
                      <View className="w-6 h-6 rounded bg-blue-500/30 items-center justify-center mr-2">
                        <Globe size={14} color="#003087" />
                      </View>
                      <Text className="text-gray-300 text-sm">PayPal</Text>
                      <Text className="text-blue-400 text-xs ml-auto">Global</Text>
                    </View>
                    <TextInput
                      placeholder="your.email@example.com"
                      placeholderTextColor="#6B7280"
                      value={postForm.paypal}
                      onChangeText={(text) => setPostForm({ ...postForm, paypal: text })}
                      keyboardType="email-address"
                      className="bg-white/10 rounded-xl px-4 py-3 text-white"
                    />
                  </View>

                  {/* Wise */}
                  <View className="mb-3">
                    <View className="flex-row items-center mb-2">
                      <View className="w-6 h-6 rounded bg-emerald-500/30 items-center justify-center mr-2">
                        <Send size={14} color="#37517E" />
                      </View>
                      <Text className="text-gray-300 text-sm">Wise (TransferWise)</Text>
                      <Text className="text-emerald-400 text-xs ml-auto">Global</Text>
                    </View>
                    <TextInput
                      placeholder="your.email@example.com"
                      placeholderTextColor="#6B7280"
                      value={postForm.wise}
                      onChangeText={(text) => setPostForm({ ...postForm, wise: text })}
                      keyboardType="email-address"
                      className="bg-white/10 rounded-xl px-4 py-3 text-white"
                    />
                  </View>

                  {/* Bank Transfer */}
                  <View className="mb-3">
                    <View className="flex-row items-center mb-2">
                      <View className="w-6 h-6 rounded bg-slate-500/30 items-center justify-center mr-2">
                        <Building size={14} color="#64748B" />
                      </View>
                      <Text className="text-gray-300 text-sm">Bank Transfer</Text>
                      <Text className="text-slate-400 text-xs ml-auto">Global</Text>
                    </View>
                    <TextInput
                      placeholder="Bank Name - Account Number"
                      placeholderTextColor="#6B7280"
                      value={postForm.bankDetails}
                      onChangeText={(text) => setPostForm({ ...postForm, bankDetails: text })}
                      className="bg-white/10 rounded-xl px-4 py-3 text-white"
                    />
                  </View>

                  {/* Divider */}
                  <View className="flex-row items-center my-4">
                    <View className="flex-1 h-px bg-white/10" />
                    <Text className="text-gray-500 text-xs mx-3">US-ONLY METHODS</Text>
                    <View className="flex-1 h-px bg-white/10" />
                  </View>

                  {/* Cash App */}
                  <View className="mb-3">
                    <View className="flex-row items-center mb-2">
                      <View className="w-6 h-6 rounded bg-green-500/30 items-center justify-center mr-2">
                        <DollarSign size={14} color="#00D632" />
                      </View>
                      <Text className="text-gray-300 text-sm">Cash App</Text>
                      <Text className="text-gray-500 text-xs ml-auto">US</Text>
                    </View>
                    <TextInput
                      placeholder="$YourCashTag"
                      placeholderTextColor="#6B7280"
                      value={postForm.cashApp}
                      onChangeText={(text) => setPostForm({ ...postForm, cashApp: text })}
                      className="bg-white/10 rounded-xl px-4 py-3 text-white"
                    />
                  </View>

                  {/* Venmo */}
                  <View className="mb-3">
                    <View className="flex-row items-center mb-2">
                      <View className="w-6 h-6 rounded bg-blue-500/30 items-center justify-center mr-2">
                        <Smartphone size={14} color="#008CFF" />
                      </View>
                      <Text className="text-gray-300 text-sm">Venmo</Text>
                      <Text className="text-gray-500 text-xs ml-auto">US</Text>
                    </View>
                    <TextInput
                      placeholder="@YourVenmo"
                      placeholderTextColor="#6B7280"
                      value={postForm.venmo}
                      onChangeText={(text) => setPostForm({ ...postForm, venmo: text })}
                      className="bg-white/10 rounded-xl px-4 py-3 text-white"
                    />
                  </View>

                  {/* Zelle */}
                  <View className="mb-4">
                    <View className="flex-row items-center mb-2">
                      <View className="w-6 h-6 rounded bg-purple-500/30 items-center justify-center mr-2">
                        <Banknote size={14} color="#6D1ED4" />
                      </View>
                      <Text className="text-gray-300 text-sm">Zelle</Text>
                      <Text className="text-gray-500 text-xs ml-auto">US</Text>
                    </View>
                    <TextInput
                      placeholder="email@example.com or phone"
                      placeholderTextColor="#6B7280"
                      value={postForm.zelle}
                      onChangeText={(text) => setPostForm({ ...postForm, zelle: text })}
                      className="bg-white/10 rounded-xl px-4 py-3 text-white"
                    />
                  </View>

                  {/* Toggle Options */}
                  <View className="border-t border-white/10 pt-4">
                    <View className="flex-row items-center justify-between mb-3">
                      <View className="flex-1 mr-3">
                        <Text className="text-white font-medium">Accept Cash</Text>
                        <Text className="text-gray-500 text-xs">Passengers can pay you in person</Text>
                      </View>
                      <Switch
                        value={postForm.acceptsCash}
                        onValueChange={(value) => setPostForm({ ...postForm, acceptsCash: value })}
                        trackColor={{ false: '#374151', true: '#3B82F6' }}
                        thumbColor="#fff"
                      />
                    </View>

                    <View className="flex-row items-center justify-between">
                      <View className="flex-1 mr-3">
                        <Text className="text-white font-medium">Accept In-App Payment</Text>
                        <Text className="text-gray-500 text-xs">5% fee • Secure payment via AfroConnect</Text>
                      </View>
                      <Switch
                        value={postForm.acceptsInApp}
                        onValueChange={(value) => setPostForm({ ...postForm, acceptsInApp: value })}
                        trackColor={{ false: '#374151', true: '#7C3AED' }}
                        thumbColor="#fff"
                      />
                    </View>
                  </View>
                </View>

                <Pressable
                  onPress={() => {
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    setShowPostModal(false);
                  }}
                  className="bg-blue-500 rounded-xl py-4 items-center"
                >
                  <Text className="text-white font-bold text-lg">Post Ride</Text>
                </Pressable>

                <View className="h-8" />
              </View>
            </ScrollView>
          </View>
        </Modal>
      </SafeAreaView>
    </View>
  );
}
