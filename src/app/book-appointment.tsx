import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, Pressable, Alert, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  CreditCard,
  Banknote,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { ServiceCard } from '@/components/ServiceCard';
import { useStore, type BusinessService, type Appointment, MOCK_USERS } from '@/lib/store';

// Mock business with services for demo
const MOCK_BARBERSHOP = {
  id: 'barber_1',
  name: "King's Kutz Barbershop",
  image: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=800&h=400&fit=crop',
  logo: 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=200&h=200&fit=crop',
  address: '1234 Martin Luther King Blvd, Denver, CO 80205',
  rating: 4.9,
  reviews: 156,
};

const MOCK_SERVICES: BusinessService[] = [
  {
    id: 'svc_1',
    businessId: 'barber_1',
    name: 'Classic Haircut',
    description: 'Traditional haircut with clippers and scissors, includes hot towel and neck shave',
    duration: 30,
    price: 25,
    currency: 'USD',
    category: 'Haircuts',
    isActive: true,
  },
  {
    id: 'svc_2',
    businessId: 'barber_1',
    name: 'Haircut + Beard Trim',
    description: 'Full haircut with precision beard shaping and line-up',
    duration: 45,
    price: 40,
    currency: 'USD',
    category: 'Haircuts',
    isActive: true,
  },
  {
    id: 'svc_3',
    businessId: 'barber_1',
    name: 'Kids Haircut',
    description: 'Haircut for children 12 and under',
    duration: 20,
    price: 18,
    currency: 'USD',
    category: 'Haircuts',
    isActive: true,
  },
  {
    id: 'svc_4',
    businessId: 'barber_1',
    name: 'Hot Towel Shave',
    description: 'Luxurious straight razor shave with hot towel treatment',
    duration: 30,
    price: 30,
    currency: 'USD',
    category: 'Shaves',
    isActive: true,
  },
  {
    id: 'svc_5',
    businessId: 'barber_1',
    name: 'Beard Trim & Shape',
    description: 'Professional beard grooming and shaping',
    duration: 20,
    price: 15,
    currency: 'USD',
    category: 'Beard',
    isActive: true,
  },
  {
    id: 'svc_6',
    businessId: 'barber_1',
    name: 'The Works',
    description: 'Haircut, beard trim, hot towel shave, and scalp massage',
    duration: 75,
    price: 65,
    currency: 'USD',
    category: 'Packages',
    image: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=400&h=300&fit=crop',
    isActive: true,
  },
];

const TIME_SLOTS = [
  '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
  '12:00 PM', '12:30 PM', '1:00 PM', '1:30 PM', '2:00 PM', '2:30 PM',
  '3:00 PM', '3:30 PM', '4:00 PM', '4:30 PM', '5:00 PM', '5:30 PM',
];

type PaymentMethod = 'in_app' | 'cash' | 'card_on_site';

export default function BookAppointmentScreen() {
  const params = useLocalSearchParams<{ businessId?: string }>();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [selectedService, setSelectedService] = useState<BusinessService | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [notes, setNotes] = useState('');
  const [isBooking, setIsBooking] = useState(false);

  const currentUser = useStore((s) => s.currentUser);
  const addAppointment = useStore((s) => s.addAppointment);

  // Generate dates for the next 14 days
  const availableDates = useMemo(() => {
    const dates: Date[] = [];
    const today = new Date();
    for (let i = 0; i < 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date);
    }
    return dates;
  }, []);

  // Simulate some time slots being unavailable
  const availableTimeSlots = useMemo((): { time: string; available: boolean }[] => {
    const dayOfWeek = selectedDate.getDay();
    // Sunday closed
    if (dayOfWeek === 0) return [];
    // Saturdays have limited hours
    if (dayOfWeek === 6) {
      return TIME_SLOTS.slice(0, 8).map((time) => ({
        time,
        available: Math.random() > 0.3,
      }));
    }
    // Randomly mark some slots as taken for demo
    return TIME_SLOTS.map((time) => ({
      time,
      available: Math.random() > 0.3, // 70% availability
    }));
  }, [selectedDate]);

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const isToday = (date: Date): boolean => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const handleSelectService = (service: BusinessService) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedService(service);
  };

  const handleSelectDate = (date: Date) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedDate(date);
    setSelectedTime(null); // Reset time when date changes
  };

  const handleSelectTime = (time: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedTime(time);
  };

  const handleNextStep = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (step < 4) {
      setStep((step + 1) as 1 | 2 | 3 | 4);
    }
  };

  const handlePrevStep = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (step > 1) {
      setStep((step - 1) as 1 | 2 | 3 | 4);
    }
  };

  const handleConfirmBooking = async () => {
    if (!selectedService || !selectedTime || !currentUser) return;

    setIsBooking(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const appointment: Appointment = {
      id: `apt_${Date.now()}`,
      businessId: MOCK_BARBERSHOP.id,
      businessName: MOCK_BARBERSHOP.name,
      businessImage: MOCK_BARBERSHOP.image,
      customerId: currentUser.id,
      customerName: currentUser.name,
      customerAvatar: currentUser.avatar,
      customerPhone: currentUser.phone,
      service: selectedService,
      date: selectedDate.toISOString().split('T')[0],
      time: selectedTime,
      status: 'confirmed',
      isPaid: paymentMethod === 'in_app',
      paymentMethod,
      notes: notes || undefined,
      createdAt: new Date().toISOString(),
    };

    addAppointment(appointment);
    setIsBooking(false);

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    Alert.alert(
      'Appointment Booked!',
      `Your appointment for ${selectedService.name} on ${formatDate(selectedDate)} at ${selectedTime} has been confirmed.`,
      [{ text: 'View My Appointments', onPress: () => router.replace('/my-appointments' as any) }]
    );
  };

  const canProceed = (): boolean => {
    switch (step) {
      case 1:
        return selectedService !== null;
      case 2:
        return selectedTime !== null;
      case 3:
        return true;
      default:
        return true;
    }
  };

  const renderStepIndicator = () => (
    <View className="flex-row items-center justify-center px-5 py-3">
      {[1, 2, 3, 4].map((s) => (
        <React.Fragment key={s}>
          <View
            className={`w-8 h-8 rounded-full items-center justify-center ${
              s <= step ? 'bg-terracotta-500' : 'bg-gray-200'
            }`}
          >
            {s < step ? (
              <CheckCircle size={16} color="#FFFFFF" />
            ) : (
              <Text className={`font-semibold ${s <= step ? 'text-white' : 'text-gray-400'}`}>
                {s}
              </Text>
            )}
          </View>
          {s < 4 && (
            <View className={`w-8 h-1 ${s < step ? 'bg-terracotta-500' : 'bg-gray-200'}`} />
          )}
        </React.Fragment>
      ))}
    </View>
  );

  return (
    <View className="flex-1 bg-cream">
      <SafeAreaView edges={['top']} className="flex-1">
        {/* Header */}
        <Animated.View
          entering={FadeInDown.duration(400)}
          className="flex-row items-center px-5 py-3"
        >
          <Pressable
            onPress={() => (step > 1 ? handlePrevStep() : router.back())}
            className="bg-white rounded-full p-2 shadow-sm"
          >
            <ArrowLeft size={22} color="#2D1F1A" />
          </Pressable>
          <Text className="flex-1 text-center text-warmBrown font-bold text-lg mr-10">
            Book Appointment
          </Text>
        </Animated.View>

        {/* Step Indicator */}
        {renderStepIndicator()}

        {/* Business Info */}
        <Animated.View entering={FadeInUp.duration(400)} className="px-5 mb-4">
          <View className="bg-white rounded-xl p-3 flex-row items-center shadow-sm">
            <Image
              source={{ uri: MOCK_BARBERSHOP.logo }}
              style={{ width: 50, height: 50, borderRadius: 25 }}
              contentFit="cover"
            />
            <View className="flex-1 ml-3">
              <Text className="text-warmBrown font-semibold">{MOCK_BARBERSHOP.name}</Text>
              <View className="flex-row items-center mt-0.5">
                <MapPin size={12} color="#9CA3AF" />
                <Text className="text-gray-500 text-xs ml-1" numberOfLines={1}>
                  {MOCK_BARBERSHOP.address}
                </Text>
              </View>
            </View>
          </View>
        </Animated.View>

        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {/* Step 1: Select Service */}
          {step === 1 && (
            <Animated.View entering={FadeInUp.duration(400).delay(100)} className="px-5">
              <Text className="text-warmBrown font-bold text-lg mb-3">Select a Service</Text>
              {MOCK_SERVICES.map((service) => (
                <ServiceCard
                  key={service.id}
                  service={service}
                  isSelected={selectedService?.id === service.id}
                  onSelect={() => handleSelectService(service)}
                />
              ))}
            </Animated.View>
          )}

          {/* Step 2: Select Date & Time */}
          {step === 2 && (
            <Animated.View entering={FadeInUp.duration(400).delay(100)} className="px-5">
              <Text className="text-warmBrown font-bold text-lg mb-3">Select Date</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                className="mb-4"
                style={{ flexGrow: 0 }}
              >
                {availableDates.map((date, index) => {
                  const isSelected = date.toDateString() === selectedDate.toDateString();
                  return (
                    <Pressable
                      key={index}
                      onPress={() => handleSelectDate(date)}
                      className={`mr-2 rounded-xl px-4 py-3 items-center ${
                        isSelected ? 'bg-terracotta-500' : 'bg-white'
                      }`}
                      style={{ minWidth: 70 }}
                    >
                      <Text
                        className={`text-xs font-medium ${
                          isSelected ? 'text-white/80' : 'text-gray-400'
                        }`}
                      >
                        {isToday(date) ? 'Today' : date.toLocaleDateString('en-US', { weekday: 'short' })}
                      </Text>
                      <Text
                        className={`text-xl font-bold mt-1 ${
                          isSelected ? 'text-white' : 'text-warmBrown'
                        }`}
                      >
                        {date.getDate()}
                      </Text>
                      <Text
                        className={`text-xs ${isSelected ? 'text-white/80' : 'text-gray-400'}`}
                      >
                        {date.toLocaleDateString('en-US', { month: 'short' })}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>

              <Text className="text-warmBrown font-bold text-lg mb-3">Select Time</Text>
              {availableTimeSlots.length === 0 ? (
                <View className="bg-gray-100 rounded-xl p-6 items-center">
                  <Text className="text-gray-500 text-center">
                    Closed on this day. Please select another date.
                  </Text>
                </View>
              ) : (
                <View className="flex-row flex-wrap">
                  {availableTimeSlots.map(({ time, available }) => {
                    const isSelected = time === selectedTime;
                    return (
                      <Pressable
                        key={time}
                        onPress={() => available && handleSelectTime(time)}
                        disabled={!available}
                        className={`rounded-lg px-4 py-2.5 mr-2 mb-2 ${
                          isSelected
                            ? 'bg-terracotta-500'
                            : available
                            ? 'bg-white'
                            : 'bg-gray-100'
                        }`}
                      >
                        <Text
                          className={`font-medium ${
                            isSelected
                              ? 'text-white'
                              : available
                              ? 'text-warmBrown'
                              : 'text-gray-300'
                          }`}
                        >
                          {time}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              )}
            </Animated.View>
          )}

          {/* Step 3: Payment Method */}
          {step === 3 && (
            <Animated.View entering={FadeInUp.duration(400).delay(100)} className="px-5">
              <Text className="text-warmBrown font-bold text-lg mb-3">Payment Method</Text>

              <Pressable
                onPress={() => setPaymentMethod('cash')}
                className={`bg-white rounded-xl p-4 mb-3 flex-row items-center border-2 ${
                  paymentMethod === 'cash' ? 'border-terracotta-500' : 'border-transparent'
                }`}
              >
                <View className="bg-green-100 rounded-full p-3">
                  <Banknote size={24} color="#10B981" />
                </View>
                <View className="flex-1 ml-3">
                  <Text className="text-warmBrown font-semibold">Pay at Location</Text>
                  <Text className="text-gray-500 text-sm">Cash or card when you arrive</Text>
                </View>
                {paymentMethod === 'cash' && (
                  <View className="bg-terracotta-500 rounded-full p-1">
                    <CheckCircle size={18} color="#FFFFFF" />
                  </View>
                )}
              </Pressable>

              <Pressable
                onPress={() => setPaymentMethod('in_app')}
                className={`bg-white rounded-xl p-4 mb-3 flex-row items-center border-2 ${
                  paymentMethod === 'in_app' ? 'border-terracotta-500' : 'border-transparent'
                }`}
              >
                <View className="bg-terracotta-50 rounded-full p-3">
                  <CreditCard size={24} color="#D4673A" />
                </View>
                <View className="flex-1 ml-3">
                  <Text className="text-warmBrown font-semibold">Pay Now</Text>
                  <Text className="text-gray-500 text-sm">Secure payment through app</Text>
                </View>
                {paymentMethod === 'in_app' && (
                  <View className="bg-terracotta-500 rounded-full p-1">
                    <CheckCircle size={18} color="#FFFFFF" />
                  </View>
                )}
              </Pressable>

              <Text className="text-warmBrown font-bold text-lg mt-4 mb-3">
                Additional Notes (Optional)
              </Text>
              <TextInput
                value={notes}
                onChangeText={setNotes}
                placeholder="Any special requests or preferences..."
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={3}
                className="bg-white rounded-xl p-4 text-warmBrown min-h-[100px]"
                style={{ textAlignVertical: 'top' }}
              />
            </Animated.View>
          )}

          {/* Step 4: Confirmation */}
          {step === 4 && selectedService && (
            <Animated.View entering={FadeInUp.duration(400).delay(100)} className="px-5">
              <Text className="text-warmBrown font-bold text-lg mb-4">Confirm Booking</Text>

              <View className="bg-white rounded-2xl p-5 shadow-sm">
                <View className="flex-row items-center pb-4 border-b border-gray-100">
                  <Image
                    source={{ uri: MOCK_BARBERSHOP.logo }}
                    style={{ width: 50, height: 50, borderRadius: 25 }}
                  />
                  <View className="ml-3">
                    <Text className="text-warmBrown font-bold">{MOCK_BARBERSHOP.name}</Text>
                    <Text className="text-gray-500 text-sm">{MOCK_BARBERSHOP.address}</Text>
                  </View>
                </View>

                <View className="py-4 border-b border-gray-100">
                  <Text className="text-gray-500 text-sm">Service</Text>
                  <Text className="text-warmBrown font-semibold text-lg">{selectedService.name}</Text>
                  <Text className="text-gray-500 text-sm mt-1">
                    {selectedService.duration} min • ${selectedService.price}
                  </Text>
                </View>

                <View className="py-4 border-b border-gray-100 flex-row">
                  <View className="flex-1">
                    <Text className="text-gray-500 text-sm">Date</Text>
                    <View className="flex-row items-center mt-1">
                      <Calendar size={16} color="#D4673A" />
                      <Text className="text-warmBrown font-medium ml-2">
                        {formatDate(selectedDate)}
                      </Text>
                    </View>
                  </View>
                  <View className="flex-1">
                    <Text className="text-gray-500 text-sm">Time</Text>
                    <View className="flex-row items-center mt-1">
                      <Clock size={16} color="#D4673A" />
                      <Text className="text-warmBrown font-medium ml-2">{selectedTime}</Text>
                    </View>
                  </View>
                </View>

                <View className="py-4">
                  <Text className="text-gray-500 text-sm">Payment</Text>
                  <Text className="text-warmBrown font-medium mt-1">
                    {paymentMethod === 'cash' ? 'Pay at Location' : 'Pay Now'}
                  </Text>
                </View>

                {notes && (
                  <View className="pt-4 border-t border-gray-100">
                    <Text className="text-gray-500 text-sm">Notes</Text>
                    <Text className="text-warmBrown mt-1">{notes}</Text>
                  </View>
                )}

                <View className="mt-4 pt-4 border-t border-gray-100 flex-row justify-between">
                  <Text className="text-warmBrown font-bold text-lg">Total</Text>
                  <Text className="text-terracotta-500 font-bold text-xl">
                    ${selectedService.price}
                  </Text>
                </View>
              </View>
            </Animated.View>
          )}

          <View className="h-32" />
        </ScrollView>

        {/* Bottom Button */}
        <View className="absolute bottom-0 left-0 right-0 bg-cream px-5 pt-3 pb-8 border-t border-gray-100">
          {step < 4 ? (
            <Pressable
              onPress={handleNextStep}
              disabled={!canProceed()}
              className={`rounded-full py-4 items-center ${
                canProceed() ? 'bg-terracotta-500' : 'bg-gray-300'
              }`}
            >
              <Text className="text-white font-semibold text-lg">Continue</Text>
            </Pressable>
          ) : (
            <Pressable
              onPress={handleConfirmBooking}
              disabled={isBooking}
              className="bg-forest-700 rounded-full py-4 items-center"
            >
              <Text className="text-white font-semibold text-lg">
                {isBooking ? 'Booking...' : 'Confirm Booking'}
              </Text>
            </Pressable>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}
