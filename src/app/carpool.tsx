import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, Modal, Switch, Linking, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import {
  ArrowLeft, Car, MapPin, Calendar, Clock, Users, Star, MessageCircle, Plus, X,
  ChevronRight, Plane, Briefcase, Music, PartyPopper, CreditCard, Banknote, Gem,
  DollarSign, Smartphone, Check, Info, Shield, Globe, Building, Send, Wallet, Heart, Fuel,
  AlertTriangle, Phone, Share2, UserCheck, BadgeCheck, FileText, CircleAlert
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown, ZoomIn, FadeIn } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';

type PaymentMethod = 'cash' | 'cashapp' | 'venmo' | 'zelle' | 'paypal' | 'wise' | 'mpesa' | 'bank';
type PricingType = 'fixed' | 'gas-split' | 'free' | 'donation';

interface PaymentInfo {
  cashApp?: string;
  venmo?: string;
  zelle?: string;
  paypal?: string;
  wise?: string;
  mpesa?: string;
  bankDetails?: string;
  acceptsCash: boolean;
}

interface DriverReview {
  id: string;
  reviewer: {
    name: string;
    avatar: string;
  };
  rating: number;
  comment: string;
  date: string;
  rideType: 'commute' | 'airport' | 'event' | 'road-trip';
}

interface CarpoolRide {
  id: string;
  driver: {
    id: string;
    name: string;
    avatar: string;
    rating: number;
    rides: number;
    isVerified: boolean;
    memberSince: string;
    reviews: DriverReview[];
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
  pricingType: PricingType;
  estimatedDistance?: number; // in miles/km
  estimatedGasCost?: number; // total gas cost for trip
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
      id: 'driver1',
      name: 'Michael Adeyemi',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200',
      rating: 4.9,
      rides: 156,
      isVerified: true,
      memberSince: 'March 2023',
      reviews: [
        { id: 'r1', reviewer: { name: 'Sarah K.', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100' }, rating: 5, comment: 'Super punctual and friendly! Car was spotless and he helped with my luggage. Highly recommend!', date: '2 weeks ago', rideType: 'airport' },
        { id: 'r2', reviewer: { name: 'James O.', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100' }, rating: 5, comment: 'Great conversation and smooth ride to JFK. Will definitely book again.', date: '1 month ago', rideType: 'airport' },
        { id: 'r3', reviewer: { name: 'Amina B.', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100' }, rating: 4, comment: 'Good driver, was a few minutes late but communicated well.', date: '2 months ago', rideType: 'airport' },
      ],
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
    pricingType: 'fixed',
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
    },
  },
  {
    id: '2',
    driver: {
      id: 'driver2',
      name: 'Kwame Asante',
      avatar: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=200',
      rating: 4.8,
      rides: 89,
      isVerified: true,
      memberSince: 'January 2024',
      reviews: [
        { id: 'r4', reviewer: { name: 'Kofi M.', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100' }, rating: 5, comment: 'Best airport driver in Accra! Always on time and very professional.', date: '1 week ago', rideType: 'airport' },
        { id: 'r5', reviewer: { name: 'Esi A.', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100' }, rating: 5, comment: 'Medaase! Very reliable service, book him every time I fly.', date: '3 weeks ago', rideType: 'airport' },
      ],
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
    pricingType: 'fixed',
    type: 'airport',
    description: 'Daily airport runs. Reliable service with comfortable AC vehicle. I speak English, Twi, and French.',
    amenities: ['AC', 'Quiet Ride', 'Charger'],
    isRecurring: true,
    paymentInfo: {
      mpesa: '+233 24 123 4567',
      bankDetails: 'Access Bank - 1234567890',
      acceptsCash: true,
    },
  },
  {
    id: '3',
    driver: {
      id: 'driver3',
      name: 'Fatima Okonkwo',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200',
      rating: 4.7,
      rides: 45,
      isVerified: true,
      memberSince: 'June 2024',
      reviews: [
        { id: 'r6', reviewer: { name: 'Chidi N.', avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100' }, rating: 5, comment: 'Perfect commute buddy! Same route every day and very punctual.', date: '3 days ago', rideType: 'commute' },
        { id: 'r7', reviewer: { name: 'Ngozi E.', avatar: 'https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=100' }, rating: 4, comment: 'Good vibes in the car, fair gas split. Would ride again.', date: '2 weeks ago', rideType: 'commute' },
      ],
    },
    from: 'Victoria Island',
    fromCity: 'Lagos, Nigeria',
    to: 'Lekki Phase 1',
    toCity: 'Lagos, Nigeria',
    date: 'Daily',
    time: '7:30 AM',
    seats: 4,
    seatsAvailable: 2,
    price: 0,
    priceDisplay: 'Split Gas',
    pricingType: 'gas-split',
    estimatedDistance: 12,
    estimatedGasCost: 2500,
    type: 'commute',
    description: 'Daily commute through Victoria Island to Lekki. Avoid Third Mainland traffic. AC vehicle, very punctual. Just split gas costs!',
    amenities: ['AC', 'Music', 'Rest Stops', 'Good Vibes'],
    isRecurring: true,
    paymentInfo: {
      bankDetails: 'GTBank - 0123456789 (Fatima Okonkwo)',
      mpesa: '+234 803 123 4567',
      acceptsCash: true,
    },
  },
  {
    id: '4',
    driver: {
      id: 'driver4',
      name: 'Sophie Mensah',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200',
      rating: 5.0,
      rides: 234,
      isVerified: true,
      memberSince: 'November 2022',
      reviews: [
        { id: 'r8', reviewer: { name: 'David L.', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100' }, rating: 5, comment: 'Perfect 5 stars! Sophie is the best driver I\'ve ever had. Professional, clean car, and so friendly.', date: '5 days ago', rideType: 'airport' },
        { id: 'r9', reviewer: { name: 'Emma T.', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100' }, rating: 5, comment: 'Absolutely brilliant! She even had water bottles for us. Will always book with Sophie.', date: '1 week ago', rideType: 'airport' },
        { id: 'r10', reviewer: { name: 'Marcus J.', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100' }, rating: 5, comment: 'Top tier service. Helped with all my bags and got me to Heathrow with time to spare.', date: '2 weeks ago', rideType: 'airport' },
      ],
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
    pricingType: 'fixed',
    type: 'airport',
    description: 'Quick airport drop-off. Can accommodate 2 large suitcases. Clean car with great reviews!',
    amenities: ['AC', 'Luggage Space', 'Charger', 'Water'],
    isRecurring: false,
    paymentInfo: {
      paypal: 'sophie.mensah@email.com',
      wise: 'sophie.mensah@email.com',
      bankDetails: 'Monzo - Sort: 04-00-04 Acc: 12345678',
      acceptsCash: true,
    },
  },
  {
    id: '5',
    driver: {
      id: 'driver5',
      name: 'Jean-Pierre Diallo',
      avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200',
      rating: 4.6,
      rides: 67,
      isVerified: false,
      memberSince: 'August 2024',
      reviews: [
        { id: 'r11', reviewer: { name: 'Aissatou S.', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100' }, rating: 5, comment: 'Merci beaucoup! So kind to offer free rides. The community appreciates you!', date: '4 days ago', rideType: 'airport' },
        { id: 'r12', reviewer: { name: 'Moussa D.', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100' }, rating: 4, comment: 'Good driver, car was a bit small for luggage but made it work.', date: '1 month ago', rideType: 'airport' },
      ],
    },
    from: 'Dakar Centre',
    fromCity: 'Dakar, Senegal',
    to: 'Blaise Diagne Airport',
    toCity: 'Diass, Senegal',
    date: 'Tomorrow',
    time: '5:00 AM',
    seats: 4,
    seatsAvailable: 3,
    price: 0,
    priceDisplay: 'Free Ride',
    pricingType: 'free',
    type: 'airport',
    description: 'FREE community ride! I\'m already going to the airport, happy to give you a lift. Just be on time! I speak French, Wolof, and English.',
    amenities: ['AC', 'Music', 'Luggage Space', 'Water'],
    isRecurring: false,
    paymentInfo: {
      acceptsCash: false,
    },
  },
  {
    id: '6',
    driver: {
      id: 'driver6',
      name: 'Amara Keita',
      avatar: 'https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=200',
      rating: 4.9,
      rides: 112,
      isVerified: true,
      memberSince: 'February 2023',
      reviews: [
        { id: 'r13', reviewer: { name: 'Peter W.', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100' }, rating: 5, comment: 'Amara is amazing! Had snacks ready and got me to JKIA super early. Asante sana!', date: '1 week ago', rideType: 'airport' },
        { id: 'r14', reviewer: { name: 'Grace M.', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100' }, rating: 5, comment: 'Best tip-based driver in Nairobi. Always give her a good tip because service is top notch.', date: '2 weeks ago', rideType: 'airport' },
        { id: 'r15', reviewer: { name: 'John K.', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100' }, rating: 5, comment: 'Very comfortable SUV and Amara knows all the shortcuts to avoid traffic.', date: '1 month ago', rideType: 'airport' },
      ],
    },
    from: 'Nairobi CBD',
    fromCity: 'Nairobi, Kenya',
    to: 'JKIA Airport',
    toCity: 'Nairobi, Kenya',
    date: 'Daily',
    time: '6:00 AM',
    seats: 3,
    seatsAvailable: 2,
    price: 0,
    priceDisplay: 'Tip Welcome',
    pricingType: 'donation',
    estimatedDistance: 18,
    estimatedGasCost: 800,
    type: 'airport',
    description: 'Early morning airport runs. Comfortable SUV, reliable timing. Pay what you can - tips appreciated but not required! Habari!',
    amenities: ['AC', 'Charger', 'Luggage Space', 'Snacks'],
    isRecurring: true,
    paymentInfo: {
      mpesa: '+254 712 345 678',
      bankDetails: 'Equity Bank - 0987654321',
      acceptsCash: true,
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

const PRICING_COLORS: Record<PricingType, { bg: string; text: string; label: string }> = {
  fixed: { bg: '#3B82F620', text: '#3B82F6', label: 'Fixed Price' },
  'gas-split': { bg: '#10B98120', text: '#10B981', label: 'Split Gas' },
  free: { bg: '#22C55E20', text: '#22C55E', label: 'Free' },
  donation: { bg: '#F59E0B20', text: '#F59E0B', label: 'Tip Welcome' },
};

const DISCLAIMER_STORAGE_KEY = 'carpool_disclaimer_accepted';

export default function CarpoolScreen() {
  const [selectedType, setSelectedType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showPostModal, setShowPostModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedRide, setSelectedRide] = useState<CarpoolRide | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(null);

  // Safety & Legal state
  const [showDisclaimerModal, setShowDisclaimerModal] = useState(false);
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);
  const [showSafetyModal, setShowSafetyModal] = useState(false);
  const [showEmergencyOptions, setShowEmergencyOptions] = useState(false);
  const [emergencyContact, setEmergencyContact] = useState('');
  const [showVerificationInfo, setShowVerificationInfo] = useState(false);

  // Driver profile & reviews state
  const [showDriverProfile, setShowDriverProfile] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<CarpoolRide['driver'] | null>(null);

  const handleViewDriverProfile = (driver: CarpoolRide['driver']) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedDriver(driver);
    setShowDriverProfile(true);
  };

  // Render star rating
  const renderStars = (rating: number, size: number = 14) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Star
          key={i}
          size={size}
          color="#FBBF24"
          fill={i <= rating ? '#FBBF24' : 'transparent'}
        />
      );
    }
    return stars;
  };

  // Check if disclaimer was previously accepted
  useEffect(() => {
    const checkDisclaimer = async () => {
      try {
        const accepted = await AsyncStorage.getItem(DISCLAIMER_STORAGE_KEY);
        if (accepted === 'true') {
          setDisclaimerAccepted(true);
        } else {
          setShowDisclaimerModal(true);
        }
      } catch {
        setShowDisclaimerModal(true);
      }
    };
    checkDisclaimer();
  }, []);

  const handleAcceptDisclaimer = async () => {
    try {
      await AsyncStorage.setItem(DISCLAIMER_STORAGE_KEY, 'true');
      setDisclaimerAccepted(true);
      setShowDisclaimerModal(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      setDisclaimerAccepted(true);
      setShowDisclaimerModal(false);
    }
  };

  const handleDeclineDisclaimer = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    router.back();
  };

  const handleEmergencyCall = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    Linking.openURL('tel:911');
  };

  const handleShareRide = (ride: CarpoolRide) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // In a real app, this would share ride details with emergency contact
    Alert.alert(
      'Share Ride Details',
      `Share this ride with your emergency contact?\n\nDriver: ${ride.driver.name}\nFrom: ${ride.from}\nTo: ${ride.to}\nDate: ${ride.date} at ${ride.time}`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Share', onPress: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }}
      ]
    );
  };

  // Post ride form state
  const [postForm, setPostForm] = useState({
    pickup: '',
    destination: '',
    date: '',
    time: '',
    seats: '',
    price: '',
    currency: '',
    pricingType: 'fixed' as PricingType,
    estimatedDistance: '',
    cashApp: '',
    venmo: '',
    zelle: '',
    paypal: '',
    wise: '',
    mpesa: '',
    bankDetails: '',
    acceptsCash: true,
  });

  // Calculate gas split per person
  const getGasSplitAmount = (ride: CarpoolRide) => {
    if (ride.pricingType !== 'gas-split' || !ride.estimatedGasCost) return 0;
    const totalRiders = ride.seats - ride.seatsAvailable + 1; // +1 for driver
    return Math.ceil(ride.estimatedGasCost / totalRiders);
  };

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

    // Check if disclaimer has been accepted before allowing booking
    if (!disclaimerAccepted) {
      setShowDisclaimerModal(true);
      return;
    }

    setSelectedRide(ride);
    setSelectedPaymentMethod(null);
    setShowPaymentModal(true);
  };

  const confirmPayment = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setShowPaymentModal(false);
    // In real app, would process payment or show payment info
  };

  const getPaymentMethodAvailable = (ride: CarpoolRide) => {
    const methods: { method: PaymentMethod; label: string; icon: any; handle?: string }[] = [];

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
            <View className="flex-row items-center gap-2">
              {/* Safety Button */}
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  setShowSafetyModal(true);
                }}
                className="w-10 h-10 rounded-full bg-green-500/20 items-center justify-center"
              >
                <Shield size={18} color="#22C55E" />
              </Pressable>
              {/* Post Ride Button */}
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
                {/* Type Badge & Pricing Type */}
                <View className="flex-row items-center justify-between px-4 pt-4">
                  <View className="flex-row items-center gap-2">
                    <View
                      className="px-3 py-1.5 rounded-full"
                      style={{ backgroundColor: TYPE_COLORS[ride.type] + '30' }}
                    >
                      <Text style={{ color: TYPE_COLORS[ride.type] }} className="text-xs font-bold uppercase">
                        {ride.type.replace('-', ' ')}
                      </Text>
                    </View>
                    {/* Pricing Type Badge */}
                    <View
                      className="px-3 py-1.5 rounded-full"
                      style={{ backgroundColor: PRICING_COLORS[ride.pricingType].bg }}
                    >
                      <Text style={{ color: PRICING_COLORS[ride.pricingType].text }} className="text-xs font-bold">
                        {PRICING_COLORS[ride.pricingType].label}
                      </Text>
                    </View>
                  </View>
                  {/* Payment Methods Available */}
                  <View className="flex-row items-center gap-1">
                    {(ride.paymentInfo.cashApp || ride.paymentInfo.venmo || ride.paymentInfo.zelle || ride.paymentInfo.mpesa) && (
                      <View className="bg-green-500/30 px-2 py-1 rounded-full">
                        <DollarSign size={12} color="#22C55E" />
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
                    {/* Dynamic Price Display */}
                    <View className="items-end">
                      {ride.pricingType === 'free' ? (
                        <>
                          <Text className="text-green-400 text-2xl font-bold">FREE</Text>
                          <Text className="text-gray-500 text-xs">community ride</Text>
                        </>
                      ) : ride.pricingType === 'gas-split' ? (
                        <>
                          <Text className="text-emerald-400 text-lg font-bold">~{getGasSplitAmount(ride).toLocaleString()}</Text>
                          <Text className="text-gray-500 text-xs">your share of gas</Text>
                          {ride.estimatedDistance && (
                            <Text className="text-gray-600 text-xs">{ride.estimatedDistance} mi trip</Text>
                          )}
                        </>
                      ) : ride.pricingType === 'donation' ? (
                        <>
                          <Text className="text-amber-400 text-xl font-bold">Pay what</Text>
                          <Text className="text-amber-400 text-xl font-bold">you can</Text>
                          <Text className="text-gray-500 text-xs">tips welcome</Text>
                        </>
                      ) : (
                        <>
                          <Text className="text-blue-400 text-2xl font-bold">{ride.priceDisplay}</Text>
                          <Text className="text-gray-500 text-xs">per seat</Text>
                        </>
                      )}
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
                  <Pressable
                    onPress={() => handleViewDriverProfile(ride.driver)}
                    className="flex-row items-center flex-1"
                  >
                    <Image
                      source={{ uri: ride.driver.avatar }}
                      style={{ width: 40, height: 40, borderRadius: 20 }}
                      contentFit="cover"
                    />
                    <View className="ml-3">
                      <View className="flex-row items-center">
                        <Text className="text-white font-semibold">{ride.driver.name}</Text>
                        {ride.driver.isVerified && (
                          <Pressable
                            onPress={(e) => {
                              e.stopPropagation();
                              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                              setShowVerificationInfo(true);
                            }}
                            className="ml-1.5 w-4 h-4 rounded-full bg-blue-500 items-center justify-center"
                          >
                            <Text className="text-white text-xs">✓</Text>
                          </Pressable>
                        )}
                      </View>
                      <View className="flex-row items-center">
                        <Star size={12} color="#FBBF24" fill="#FBBF24" />
                        <Text className="text-yellow-400 text-xs ml-1">{ride.driver.rating}</Text>
                        <Text className="text-gray-500 text-xs ml-2">• {ride.driver.rides} rides</Text>
                        <Text className="text-blue-400 text-xs ml-2">• View reviews</Text>
                      </View>
                    </View>
                  </Pressable>
                  <View className="flex-row items-center gap-2">
                    {/* Share Ride Button */}
                    <Pressable
                      onPress={() => handleShareRide(ride)}
                      className="w-10 h-10 rounded-full bg-white/10 items-center justify-center"
                    >
                      <Share2 size={16} color="#9CA3AF" />
                    </Pressable>
                    <Pressable
                      onPress={() => handleRequestRide(ride)}
                      className="flex-row items-center bg-blue-500 px-4 py-2.5 rounded-full"
                    >
                      <Text className="text-white font-semibold">Book</Text>
                      <ChevronRight size={16} color="#fff" />
                    </Pressable>
                  </View>
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
                          method.method === 'cashapp' ? 'bg-green-500/30' :
                          method.method === 'venmo' ? 'bg-blue-500/30' :
                          method.method === 'zelle' ? 'bg-purple-500/30' :
                          method.method === 'paypal' ? 'bg-blue-500/30' :
                          method.method === 'wise' ? 'bg-emerald-500/30' :
                          method.method === 'mpesa' ? 'bg-green-500/30' :
                          method.method === 'bank' ? 'bg-slate-500/30' : 'bg-amber-500/30'
                        }`}>
                          <method.icon size={20} color={
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

                    {/* Info Banner */}
                    {selectedPaymentMethod && selectedPaymentMethod !== 'cash' && (
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

                    {/* External Payment Disclaimer */}
                    <View className="flex-row items-start bg-amber-500/10 rounded-2xl p-4 mt-2 mb-4">
                      <AlertTriangle size={18} color="#F59E0B" style={{ marginTop: 2 }} />
                      <Text className="text-amber-300 text-sm ml-2 flex-1">
                        This app does not process payments. All payments are made directly between you and the driver using external payment methods.
                      </Text>
                    </View>

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
                          {selectedPaymentMethod
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

                {/* Pricing Type Selection */}
                <View className="mb-4">
                  <Text className="text-gray-400 text-sm mb-2">How do you want to price this ride?</Text>
                  <View className="flex-row flex-wrap gap-2">
                    {([
                      { key: 'fixed', label: 'Fixed Price', icon: DollarSign, desc: 'Set your own price' },
                      { key: 'gas-split', label: 'Split Gas', icon: Fuel, desc: 'Share fuel costs' },
                      { key: 'free', label: 'Free Ride', icon: Heart, desc: 'Community spirit' },
                      { key: 'donation', label: 'Tips Welcome', icon: Gem, desc: 'Pay what you can' },
                    ] as const).map((option) => (
                      <Pressable
                        key={option.key}
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          setPostForm({ ...postForm, pricingType: option.key });
                        }}
                        className={`flex-1 min-w-[45%] p-3 rounded-xl border ${
                          postForm.pricingType === option.key
                            ? 'border-blue-500 bg-blue-500/20'
                            : 'border-white/10 bg-white/5'
                        }`}
                      >
                        <View className="flex-row items-center mb-1">
                          <option.icon
                            size={16}
                            color={postForm.pricingType === option.key ? '#3B82F6' : '#9CA3AF'}
                          />
                          <Text className={`ml-2 font-semibold ${
                            postForm.pricingType === option.key ? 'text-blue-400' : 'text-white'
                          }`}>
                            {option.label}
                          </Text>
                        </View>
                        <Text className="text-gray-500 text-xs">{option.desc}</Text>
                      </Pressable>
                    ))}
                  </View>
                </View>

                {/* Conditional fields based on pricing type */}
                {postForm.pricingType === 'fixed' && (
                  <View className="flex-row gap-3 mb-4">
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
                )}

                {postForm.pricingType === 'gas-split' && (
                  <View className="bg-emerald-500/10 rounded-2xl p-4 mb-4 border border-emerald-500/30">
                    <View className="flex-row items-center mb-3">
                      <Fuel size={18} color="#10B981" />
                      <Text className="text-emerald-400 font-bold ml-2">Gas Split Details</Text>
                    </View>
                    <Text className="text-gray-400 text-sm mb-3">
                      Riders will split the total gas cost evenly. This is typically 40-60% cheaper than regular rideshare rates.
                    </Text>
                    <View className="flex-row gap-3">
                      <View className="flex-1">
                        <Text className="text-gray-400 text-sm mb-2">Seats</Text>
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
                        <Text className="text-gray-400 text-sm mb-2">Trip Distance (mi)</Text>
                        <TextInput
                          placeholder="e.g., 25"
                          placeholderTextColor="#6B7280"
                          keyboardType="number-pad"
                          value={postForm.estimatedDistance}
                          onChangeText={(text) => setPostForm({ ...postForm, estimatedDistance: text })}
                          className="bg-white/10 rounded-xl px-4 py-3 text-white"
                        />
                      </View>
                    </View>
                    <Text className="text-gray-500 text-xs mt-2">
                      Tip: Gas cost is calculated as (distance ÷ fuel efficiency × gas price). Riders split this total.
                    </Text>
                  </View>
                )}

                {postForm.pricingType === 'free' && (
                  <View className="bg-green-500/10 rounded-2xl p-4 mb-4 border border-green-500/30">
                    <View className="flex-row items-center mb-2">
                      <Heart size={18} color="#22C55E" />
                      <Text className="text-green-400 font-bold ml-2">Free Community Ride</Text>
                    </View>
                    <Text className="text-gray-400 text-sm mb-3">
                      You're offering a free ride — this builds community trust and helps those who need it!
                    </Text>
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
                  </View>
                )}

                {postForm.pricingType === 'donation' && (
                  <View className="bg-amber-500/10 rounded-2xl p-4 mb-4 border border-amber-500/30">
                    <View className="flex-row items-center mb-2">
                      <Gem size={18} color="#F59E0B" />
                      <Text className="text-amber-400 font-bold ml-2">Pay What You Can</Text>
                    </View>
                    <Text className="text-gray-400 text-sm mb-3">
                      Riders can tip whatever they can afford. Great for building goodwill while covering some costs.
                    </Text>
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
                  </View>
                )}

                {/* Currency Selection - only show for fixed pricing */}
                {postForm.pricingType === 'fixed' && (
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
                )}

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

        {/* Legal Disclaimer Modal - Shows on first use */}
        <Modal visible={showDisclaimerModal} animationType="fade" transparent>
          <View className="flex-1 bg-black/90 justify-center items-center px-5">
            <Animated.View
              entering={ZoomIn.springify()}
              className="bg-[#1A1A2E] rounded-3xl w-full max-w-md overflow-hidden"
            >
              <LinearGradient
                colors={['#DC2626', '#991B1B']}
                style={{ paddingVertical: 24, paddingHorizontal: 20, alignItems: 'center' }}
              >
                <View className="w-16 h-16 rounded-full bg-white/20 items-center justify-center mb-3">
                  <FileText size={32} color="#fff" />
                </View>
                <Text className="text-white text-xl font-bold text-center">Important Notice</Text>
                <Text className="text-white/80 text-center mt-1">Please read before continuing</Text>
              </LinearGradient>

              <ScrollView className="p-5" style={{ maxHeight: 350 }}>
                <Text className="text-white font-bold text-lg mb-3">Terms & Disclaimer</Text>

                <Text className="text-gray-300 text-sm leading-6 mb-4">
                  By using the Carpool feature, you acknowledge and agree to the following:
                </Text>

                <View className="mb-4">
                  <View className="flex-row items-start mb-3">
                    <View className="w-6 h-6 rounded-full bg-red-500/20 items-center justify-center mr-3 mt-0.5">
                      <Text className="text-red-400 font-bold text-xs">1</Text>
                    </View>
                    <Text className="text-gray-300 text-sm flex-1 leading-5">
                      <Text className="font-bold text-white">Connection Platform Only: </Text>
                      This app is solely a platform for connecting drivers and passengers. We are NOT a transportation company, taxi service, or rideshare operator.
                    </Text>
                  </View>

                  <View className="flex-row items-start mb-3">
                    <View className="w-6 h-6 rounded-full bg-red-500/20 items-center justify-center mr-3 mt-0.5">
                      <Text className="text-red-400 font-bold text-xs">2</Text>
                    </View>
                    <Text className="text-gray-300 text-sm flex-1 leading-5">
                      <Text className="font-bold text-white">No Liability: </Text>
                      We are not liable for any accidents, injuries, damages, theft, harassment, or any other incidents that occur before, during, or after any ride arranged through this platform.
                    </Text>
                  </View>

                  <View className="flex-row items-start mb-3">
                    <View className="w-6 h-6 rounded-full bg-red-500/20 items-center justify-center mr-3 mt-0.5">
                      <Text className="text-red-400 font-bold text-xs">3</Text>
                    </View>
                    <Text className="text-gray-300 text-sm flex-1 leading-5">
                      <Text className="font-bold text-white">User Responsibility: </Text>
                      You are solely responsible for verifying the identity and credibility of any driver or passenger before entering a vehicle or accepting passengers.
                    </Text>
                  </View>

                  <View className="flex-row items-start mb-3">
                    <View className="w-6 h-6 rounded-full bg-red-500/20 items-center justify-center mr-3 mt-0.5">
                      <Text className="text-red-400 font-bold text-xs">4</Text>
                    </View>
                    <Text className="text-gray-300 text-sm flex-1 leading-5">
                      <Text className="font-bold text-white">No Background Checks: </Text>
                      We do not conduct criminal background checks, driving record checks, or vehicle inspections on users. "Verified" badges only indicate identity verification, not safety clearance.
                    </Text>
                  </View>

                  <View className="flex-row items-start mb-3">
                    <View className="w-6 h-6 rounded-full bg-red-500/20 items-center justify-center mr-3 mt-0.5">
                      <Text className="text-red-400 font-bold text-xs">5</Text>
                    </View>
                    <Text className="text-gray-300 text-sm flex-1 leading-5">
                      <Text className="font-bold text-white">At Your Own Risk: </Text>
                      All rides are undertaken at your own risk. We strongly recommend sharing ride details with trusted contacts, meeting in public places, and trusting your instincts.
                    </Text>
                  </View>

                  <View className="flex-row items-start">
                    <View className="w-6 h-6 rounded-full bg-red-500/20 items-center justify-center mr-3 mt-0.5">
                      <Text className="text-red-400 font-bold text-xs">6</Text>
                    </View>
                    <Text className="text-gray-300 text-sm flex-1 leading-5">
                      <Text className="font-bold text-white">Payment Disputes: </Text>
                      We are not responsible for payment disputes between users. External payment methods (Cash App, Venmo, etc.) are handled directly between parties.
                    </Text>
                  </View>
                </View>

                <View className="bg-amber-500/10 rounded-xl p-4 border border-amber-500/30 mb-4">
                  <View className="flex-row items-center mb-2">
                    <AlertTriangle size={18} color="#F59E0B" />
                    <Text className="text-amber-400 font-bold ml-2">Safety Warning</Text>
                  </View>
                  <Text className="text-gray-300 text-sm leading-5">
                    Never share personal financial information. Always meet in public, well-lit areas. Trust your instincts - if something feels wrong, don't proceed with the ride.
                  </Text>
                </View>
              </ScrollView>

              <View className="p-5 border-t border-white/10">
                <Pressable
                  onPress={handleAcceptDisclaimer}
                  className="bg-blue-500 rounded-xl py-4 items-center mb-3"
                >
                  <Text className="text-white font-bold text-lg">I Understand & Accept</Text>
                </Pressable>

                <Pressable
                  onPress={handleDeclineDisclaimer}
                  className="py-3 items-center"
                >
                  <Text className="text-gray-400 font-medium">Decline & Go Back</Text>
                </Pressable>
              </View>
            </Animated.View>
          </View>
        </Modal>

        {/* Safety Tips Modal */}
        <Modal visible={showSafetyModal} animationType="slide" transparent>
          <View className="flex-1 bg-black/80 justify-end">
            <Animated.View
              entering={ZoomIn.springify()}
              className="bg-[#1A1A2E] rounded-t-3xl"
            >
              <View className="p-6">
                <View className="flex-row items-center justify-between mb-4">
                  <View className="flex-row items-center">
                    <Shield size={24} color="#22C55E" />
                    <Text className="text-white text-xl font-bold ml-2">Safety Center</Text>
                  </View>
                  <Pressable
                    onPress={() => setShowSafetyModal(false)}
                    className="w-8 h-8 rounded-full bg-white/10 items-center justify-center"
                  >
                    <X size={18} color="#fff" />
                  </Pressable>
                </View>

                {/* Emergency Button */}
                <Pressable
                  onPress={handleEmergencyCall}
                  className="mb-4"
                >
                  <LinearGradient
                    colors={['#DC2626', '#991B1B']}
                    style={{ borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <Phone size={24} color="#fff" />
                    <Text className="text-white font-bold text-lg ml-3">Emergency Call (911)</Text>
                  </LinearGradient>
                </Pressable>

                {/* Safety Tips */}
                <Text className="text-gray-400 text-sm mb-3">Safety Tips</Text>

                <View className="bg-white/5 rounded-2xl p-4 mb-3">
                  <View className="flex-row items-start mb-3">
                    <View className="w-8 h-8 rounded-full bg-green-500/20 items-center justify-center mr-3">
                      <Share2 size={16} color="#22C55E" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-white font-semibold">Share Your Trip</Text>
                      <Text className="text-gray-400 text-sm">Always share ride details with a trusted friend or family member before getting in.</Text>
                    </View>
                  </View>

                  <View className="flex-row items-start mb-3">
                    <View className="w-8 h-8 rounded-full bg-blue-500/20 items-center justify-center mr-3">
                      <UserCheck size={16} color="#3B82F6" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-white font-semibold">Verify the Driver</Text>
                      <Text className="text-gray-400 text-sm">Check the driver's photo, name, and vehicle before entering. Ask for ID if unsure.</Text>
                    </View>
                  </View>

                  <View className="flex-row items-start mb-3">
                    <View className="w-8 h-8 rounded-full bg-amber-500/20 items-center justify-center mr-3">
                      <MapPin size={16} color="#F59E0B" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-white font-semibold">Meet in Public</Text>
                      <Text className="text-gray-400 text-sm">Always arrange pickup in well-lit, public areas. Avoid secluded locations.</Text>
                    </View>
                  </View>

                  <View className="flex-row items-start">
                    <View className="w-8 h-8 rounded-full bg-purple-500/20 items-center justify-center mr-3">
                      <AlertTriangle size={16} color="#A855F7" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-white font-semibold">Trust Your Instincts</Text>
                      <Text className="text-gray-400 text-sm">If something feels wrong, don't get in. Your safety is more important than the ride.</Text>
                    </View>
                  </View>
                </View>

                {/* Emergency Contact Setup */}
                <View className="bg-white/5 rounded-2xl p-4">
                  <Text className="text-white font-semibold mb-2">Emergency Contact</Text>
                  <Text className="text-gray-400 text-sm mb-3">Set up an emergency contact to quickly share ride details</Text>
                  <TextInput
                    placeholder="Enter phone number"
                    placeholderTextColor="#6B7280"
                    value={emergencyContact}
                    onChangeText={setEmergencyContact}
                    keyboardType="phone-pad"
                    className="bg-white/10 rounded-xl px-4 py-3 text-white mb-3"
                  />
                  <Pressable
                    onPress={() => {
                      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    }}
                    className="bg-green-500 rounded-xl py-3 items-center"
                  >
                    <Text className="text-white font-semibold">Save Contact</Text>
                  </Pressable>
                </View>
              </View>
              <View className="h-8" />
            </Animated.View>
          </View>
        </Modal>

        {/* Verification Info Modal */}
        <Modal visible={showVerificationInfo} animationType="fade" transparent>
          <View className="flex-1 bg-black/80 justify-center items-center px-5">
            <Animated.View
              entering={ZoomIn.springify()}
              className="bg-[#1A1A2E] rounded-3xl w-full max-w-md p-6"
            >
              <View className="items-center mb-4">
                <View className="w-16 h-16 rounded-full bg-blue-500/20 items-center justify-center mb-3">
                  <BadgeCheck size={32} color="#3B82F6" />
                </View>
                <Text className="text-white text-xl font-bold">Verification Badge</Text>
              </View>

              <Text className="text-gray-300 text-center mb-4">
                The blue checkmark indicates the driver has verified their identity through our platform.
              </Text>

              <View className="bg-amber-500/10 rounded-xl p-4 border border-amber-500/30 mb-4">
                <View className="flex-row items-center mb-2">
                  <CircleAlert size={18} color="#F59E0B" />
                  <Text className="text-amber-400 font-bold ml-2">Important</Text>
                </View>
                <Text className="text-gray-300 text-sm leading-5">
                  Identity verification does NOT include:{'\n'}
                  {'\n'}• Criminal background checks
                  {'\n'}• Driving record verification
                  {'\n'}• Vehicle safety inspections
                  {'\n'}• Insurance verification
                  {'\n'}{'\n'}
                  Always use caution and follow safety guidelines.
                </Text>
              </View>

              <Pressable
                onPress={() => setShowVerificationInfo(false)}
                className="bg-white/10 rounded-xl py-3 items-center"
              >
                <Text className="text-white font-semibold">Got It</Text>
              </Pressable>
            </Animated.View>
          </View>
        </Modal>

        {/* Driver Profile & Reviews Modal */}
        <Modal visible={showDriverProfile} animationType="slide" transparent>
          <View className="flex-1 bg-black/80 justify-end">
            <Animated.View
              entering={ZoomIn.springify()}
              className="bg-[#1A1A2E] rounded-t-3xl max-h-[90%]"
            >
              {selectedDriver && (
                <>
                  <View className="p-6 border-b border-white/10">
                    <View className="flex-row items-center justify-between mb-4">
                      <Text className="text-white text-xl font-bold">Driver Profile</Text>
                      <Pressable
                        onPress={() => setShowDriverProfile(false)}
                        className="w-8 h-8 rounded-full bg-white/10 items-center justify-center"
                      >
                        <X size={18} color="#fff" />
                      </Pressable>
                    </View>

                    {/* Driver Info Header */}
                    <View className="flex-row items-center">
                      <Image
                        source={{ uri: selectedDriver.avatar }}
                        style={{ width: 72, height: 72, borderRadius: 36 }}
                        contentFit="cover"
                      />
                      <View className="ml-4 flex-1">
                        <View className="flex-row items-center">
                          <Text className="text-white text-xl font-bold">{selectedDriver.name}</Text>
                          {selectedDriver.isVerified && (
                            <View className="ml-2 w-5 h-5 rounded-full bg-blue-500 items-center justify-center">
                              <Text className="text-white text-xs">✓</Text>
                            </View>
                          )}
                        </View>
                        <Text className="text-gray-400 text-sm">Member since {selectedDriver.memberSince}</Text>
                      </View>
                    </View>

                    {/* Stats Row */}
                    <View className="flex-row mt-4 bg-white/5 rounded-2xl p-4">
                      <View className="flex-1 items-center border-r border-white/10">
                        <View className="flex-row items-center">
                          <Star size={20} color="#FBBF24" fill="#FBBF24" />
                          <Text className="text-white text-2xl font-bold ml-1">{selectedDriver.rating}</Text>
                        </View>
                        <Text className="text-gray-400 text-xs mt-1">Rating</Text>
                      </View>
                      <View className="flex-1 items-center border-r border-white/10">
                        <Text className="text-white text-2xl font-bold">{selectedDriver.rides}</Text>
                        <Text className="text-gray-400 text-xs mt-1">Rides</Text>
                      </View>
                      <View className="flex-1 items-center">
                        <Text className="text-white text-2xl font-bold">{selectedDriver.reviews.length}</Text>
                        <Text className="text-gray-400 text-xs mt-1">Reviews</Text>
                      </View>
                    </View>
                  </View>

                  {/* Reviews Section */}
                  <ScrollView className="p-6" showsVerticalScrollIndicator={false}>
                    <Text className="text-white font-bold text-lg mb-4">
                      Reviews ({selectedDriver.reviews.length})
                    </Text>

                    {selectedDriver.reviews.length === 0 ? (
                      <View className="bg-white/5 rounded-2xl p-6 items-center">
                        <Star size={32} color="#6B7280" />
                        <Text className="text-gray-400 text-center mt-3">No reviews yet</Text>
                        <Text className="text-gray-500 text-sm text-center mt-1">
                          Be the first to review this driver after your ride
                        </Text>
                      </View>
                    ) : (
                      selectedDriver.reviews.map((review, idx) => (
                        <Animated.View
                          key={review.id}
                          entering={FadeInDown.delay(idx * 100).springify()}
                          className="bg-white/5 rounded-2xl p-4 mb-3"
                        >
                          <View className="flex-row items-center mb-3">
                            <Image
                              source={{ uri: review.reviewer.avatar }}
                              style={{ width: 36, height: 36, borderRadius: 18 }}
                              contentFit="cover"
                            />
                            <View className="ml-3 flex-1">
                              <Text className="text-white font-semibold">{review.reviewer.name}</Text>
                              <Text className="text-gray-500 text-xs">{review.date}</Text>
                            </View>
                            <View className="flex-row items-center">
                              {renderStars(review.rating, 12)}
                            </View>
                          </View>
                          <Text className="text-gray-300 text-sm leading-5">{review.comment}</Text>
                          <View className="mt-2 self-start">
                            <View
                              className="px-2 py-1 rounded-full"
                              style={{ backgroundColor: TYPE_COLORS[review.rideType] + '30' }}
                            >
                              <Text style={{ color: TYPE_COLORS[review.rideType] }} className="text-xs">
                                {review.rideType.replace('-', ' ')}
                              </Text>
                            </View>
                          </View>
                        </Animated.View>
                      ))
                    )}

                    {/* Rating Distribution */}
                    {selectedDriver.reviews.length > 0 && (
                      <View className="bg-white/5 rounded-2xl p-4 mt-3">
                        <Text className="text-white font-semibold mb-3">Rating Distribution</Text>
                        {[5, 4, 3, 2, 1].map((star) => {
                          const count = selectedDriver.reviews.filter(r => r.rating === star).length;
                          const percentage = (count / selectedDriver.reviews.length) * 100;
                          return (
                            <View key={star} className="flex-row items-center mb-2">
                              <Text className="text-gray-400 text-sm w-4">{star}</Text>
                              <Star size={12} color="#FBBF24" fill="#FBBF24" className="mx-1" />
                              <View className="flex-1 h-2 bg-white/10 rounded-full mx-2 overflow-hidden">
                                <View
                                  className="h-full bg-yellow-400 rounded-full"
                                  style={{ width: `${percentage}%` }}
                                />
                              </View>
                              <Text className="text-gray-500 text-xs w-8">{count}</Text>
                            </View>
                          );
                        })}
                      </View>
                    )}

                    <View className="h-8" />
                  </ScrollView>
                </>
              )}
            </Animated.View>
          </View>
        </Modal>
      </SafeAreaView>
    </View>
  );
}
