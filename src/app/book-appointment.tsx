import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, Alert, TextInput, Modal, ActivityIndicator } from 'react-native';
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
  Gem,
  Store,
} from 'lucide-react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { ServiceCard } from '@/components/ServiceCard';
import { useStore, type BusinessService } from '@/lib/store';
import { purchaseBusinessService, priceToGems, calculateFeeBreakdown } from '@/lib/marketplacePayments';
import { getGemBalance } from '@/lib/giftService';
import { getBusiness } from '@/lib/marketplace-api';
import {
  getBusinessServices,
  getAvailableTimeSlots,
  createAppointment,
  calculateEndTime,
  type DbBusinessService,
} from '@/lib/booking-api';

type PaymentMethod = 'in_app' | 'cash' | 'card_on_site' | 'gems';

// Convert DB service to store BusinessService format
function dbServiceToBusinessService(dbService: DbBusinessService): BusinessService {
  return {
    id: dbService.id,
    businessId: dbService.business_id,
    name: dbService.name,
    description: dbService.description || '',
    duration: dbService.duration,
    price: dbService.price,
    currency: dbService.currency,
    category: dbService.category || 'general',
    image: dbService.image || undefined,
    isActive: dbService.is_active,
  };
}

export default function BookAppointmentScreen() {
  const params = useLocalSearchParams<{ businessId?: string; businessName?: string }>();
  const businessId = params.businessId || '';

  // Loading states
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);

  // Business and services data
  const [business, setBusiness] = useState<{
    id: string;
    name: string;
    image: string;
    logo?: string;
    address: string;
    owner_id: string;
  } | null>(null);
  const [services, setServices] = useState<BusinessService[]>([]);

  // Booking state
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [selectedService, setSelectedService] = useState<BusinessService | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [notes, setNotes] = useState('');
  const [isBooking, setIsBooking] = useState(false);

  // Gem payment state
  const [gemBalance, setGemBalance] = useState(0);
  const [buyerPaysFee, setBuyerPaysFee] = useState(false);

  const currentUser = useStore((s) => s.currentUser);

  // Load business and services on mount
  useEffect(() => {
    loadBusinessData();
  }, [businessId]);

  // Load gem balance
  useEffect(() => {
    if (currentUser?.id) {
      getGemBalance(currentUser.id).then(setGemBalance);
    }
  }, [currentUser?.id]);

  // Load available slots when date or service changes
  useEffect(() => {
    if (selectedService && businessId) {
      loadAvailableSlots();
    }
  }, [selectedDate, selectedService, businessId]);

  const loadBusinessData = async () => {
    if (!businessId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const [businessData, servicesData] = await Promise.all([
        getBusiness(businessId),
        getBusinessServices(businessId),
      ]);

      if (businessData) {
        setBusiness({
          id: businessData.id,
          name: businessData.name,
          image: businessData.image || 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=800&h=400&fit=crop',
          logo: businessData.logo,
          address: businessData.address || businessData.location || 'Contact for address',
          owner_id: businessData.owner_id,
        });
      }

      setServices(servicesData.map(dbServiceToBusinessService));
    } catch (error) {
      console.error('Error loading business data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadAvailableSlots = async () => {
    if (!selectedService || !businessId) return;

    setIsLoadingSlots(true);
    try {
      const dateStr = selectedDate.toISOString().split('T')[0];
      const slots = await getAvailableTimeSlots(businessId, dateStr, selectedService.duration);
      setAvailableSlots(slots);
      // Reset time if previously selected time is no longer available
      if (selectedTime && !slots.includes(selectedTime)) {
        setSelectedTime(null);
      }
    } catch (error) {
      console.error('Error loading available slots:', error);
      setAvailableSlots([]);
    } finally {
      setIsLoadingSlots(false);
    }
  };

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
    if (!selectedService || !selectedTime || !currentUser || !business) return;

    setIsBooking(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    try {
      // Handle gem payment
      if (paymentMethod === 'gems') {
        const gemPrice = priceToGems(selectedService.price);
        const feeBreakdown = calculateFeeBreakdown(gemPrice, buyerPaysFee);

        // Check balance
        if (gemBalance < feeBreakdown.totalBuyerPays) {
          setIsBooking(false);
          Alert.alert(
            'Insufficient Gems',
            `You need ${(feeBreakdown.totalBuyerPays - gemBalance).toLocaleString()} more gems to book this service.`,
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Get Gems', onPress: () => router.push('/gem-store') }
            ]
          );
          return;
        }

        // Process gem payment
        const result = await purchaseBusinessService(
          currentUser.id,
          currentUser.name ?? 'User',
          business.owner_id,
          business.name,
          selectedService.id,
          selectedService.name,
          gemPrice,
          buyerPaysFee
        );

        if (!result.success) {
          setIsBooking(false);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          Alert.alert('Payment Failed', result.error ?? 'Could not process payment. Please try again.');
          return;
        }

        setGemBalance(result.newBuyerBalance ?? gemBalance - feeBreakdown.totalBuyerPays);
      }

      // Calculate end time
      const endTime = calculateEndTime(selectedTime, selectedService.duration);

      // Create appointment in database
      const appointment = await createAppointment({
        business_id: business.id,
        service_id: selectedService.id,
        customer_id: currentUser.id,
        date: selectedDate.toISOString().split('T')[0],
        start_time: selectedTime,
        end_time: endTime,
        payment_method: paymentMethod === 'gems' ? 'gems' : paymentMethod === 'card_on_site' ? 'card_on_site' : 'cash',
        payment_amount: selectedService.price,
        gems_paid: paymentMethod === 'gems' ? priceToGems(selectedService.price) : undefined,
        notes: notes || undefined,
        customer_phone: currentUser.phone || undefined,
      });

      if (!appointment) {
        throw new Error('Failed to create appointment');
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      const paymentMessage = paymentMethod === 'gems'
        ? ' Payment has been processed.'
        : paymentMethod === 'cash'
        ? ' Remember to pay at the location.'
        : '';

      Alert.alert(
        'Appointment Booked!',
        `Your appointment for ${selectedService.name} on ${formatDate(selectedDate)} at ${selectedTime} has been confirmed.${paymentMessage}`,
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error) {
      console.error('Error booking appointment:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Booking Failed', 'Could not complete your booking. Please try again.');
    } finally {
      setIsBooking(false);
    }
  };

  const canProceed = (): boolean => {
    switch (step) {
      case 1:
        return selectedService !== null;
      case 2:
        return selectedTime !== null;
      case 3:
        if (paymentMethod === 'gems' && selectedService) {
          const gemPrice = priceToGems(selectedService.price);
          const feeBreakdown = calculateFeeBreakdown(gemPrice, buyerPaysFee);
          return gemBalance >= feeBreakdown.totalBuyerPays;
        }
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

  if (isLoading) {
    return (
      <View className="flex-1 bg-cream justify-center items-center">
        <ActivityIndicator size="large" color="#E07A5F" />
        <Text className="text-warmBrown mt-4">Loading business...</Text>
      </View>
    );
  }

  if (!business) {
    return (
      <View className="flex-1 bg-cream justify-center items-center px-6">
        <Store size={64} color="#9CA3AF" />
        <Text className="text-warmBrown text-lg text-center mt-4">Business not found</Text>
        <Pressable onPress={() => router.back()} className="mt-4 bg-terracotta-500 px-6 py-3 rounded-full">
          <Text className="text-white font-semibold">Go Back</Text>
        </Pressable>
      </View>
    );
  }

  if (services.length === 0) {
    return (
      <View className="flex-1 bg-cream justify-center items-center px-6">
        <Calendar size={64} color="#9CA3AF" />
        <Text className="text-warmBrown text-lg text-center mt-4">This business hasn't set up booking yet</Text>
        <Text className="text-gray-500 text-center mt-2">They may not have any services available for booking</Text>
        <Pressable onPress={() => router.back()} className="mt-6 bg-terracotta-500 px-6 py-3 rounded-full">
          <Text className="text-white font-semibold">Go Back</Text>
        </Pressable>
      </View>
    );
  }

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
              source={{ uri: business.logo || business.image }}
              style={{ width: 50, height: 50, borderRadius: 25 }}
              contentFit="cover"
            />
            <View className="flex-1 ml-3">
              <Text className="text-warmBrown font-semibold">{business.name}</Text>
              <View className="flex-row items-center mt-0.5">
                <MapPin size={12} color="#9CA3AF" />
                <Text className="text-gray-500 text-xs ml-1" numberOfLines={1}>
                  {business.address}
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
              {services.map((service) => (
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
              {isLoadingSlots ? (
                <View className="bg-gray-100 rounded-xl p-6 items-center">
                  <ActivityIndicator size="small" color="#E07A5F" />
                  <Text className="text-gray-500 text-center mt-2">Loading available times...</Text>
                </View>
              ) : availableSlots.length === 0 ? (
                <View className="bg-gray-100 rounded-xl p-6 items-center">
                  <Text className="text-gray-500 text-center">
                    No available times on this day. Please select another date.
                  </Text>
                </View>
              ) : (
                <View className="flex-row flex-wrap">
                  {availableSlots.map((time) => {
                    const isSelected = time === selectedTime;
                    return (
                      <Pressable
                        key={time}
                        onPress={() => handleSelectTime(time)}
                        className={`rounded-lg px-4 py-2.5 mr-2 mb-2 ${
                          isSelected ? 'bg-terracotta-500' : 'bg-white'
                        }`}
                      >
                        <Text
                          className={`font-medium ${
                            isSelected ? 'text-white' : 'text-warmBrown'
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
                  <Text className="text-warmBrown font-semibold">Pay with Cash</Text>
                  <Text className="text-gray-500 text-sm">Pay at the location</Text>
                </View>
                {paymentMethod === 'cash' && (
                  <CheckCircle size={20} color="#E07A5F" />
                )}
              </Pressable>

              <Pressable
                onPress={() => setPaymentMethod('card_on_site')}
                className={`bg-white rounded-xl p-4 mb-3 flex-row items-center border-2 ${
                  paymentMethod === 'card_on_site' ? 'border-terracotta-500' : 'border-transparent'
                }`}
              >
                <View className="bg-blue-100 rounded-full p-3">
                  <CreditCard size={24} color="#3B82F6" />
                </View>
                <View className="flex-1 ml-3">
                  <Text className="text-warmBrown font-semibold">Pay with Card</Text>
                  <Text className="text-gray-500 text-sm">Card payment at the location</Text>
                </View>
                {paymentMethod === 'card_on_site' && (
                  <CheckCircle size={20} color="#E07A5F" />
                )}
              </Pressable>

              <Pressable
                onPress={() => setPaymentMethod('gems')}
                className={`bg-white rounded-xl p-4 mb-3 flex-row items-center border-2 ${
                  paymentMethod === 'gems' ? 'border-terracotta-500' : 'border-transparent'
                }`}
              >
                <View className="bg-purple-100 rounded-full p-3">
                  <Gem size={24} color="#8B5CF6" />
                </View>
                <View className="flex-1 ml-3">
                  <Text className="text-warmBrown font-semibold">Pay with Gems</Text>
                  <Text className="text-gray-500 text-sm">
                    Balance: {gemBalance.toLocaleString()} gems
                  </Text>
                  {selectedService && (
                    <Text className="text-purple-600 text-sm font-medium">
                      Cost: {priceToGems(selectedService.price).toLocaleString()} gems
                    </Text>
                  )}
                </View>
                {paymentMethod === 'gems' && (
                  <CheckCircle size={20} color="#E07A5F" />
                )}
              </Pressable>

              {paymentMethod === 'gems' && selectedService && (
                <View className="bg-purple-50 rounded-xl p-4 mb-3">
                  <Text className="text-purple-800 text-sm">
                    5% platform fee applies. The business will receive{' '}
                    {Math.floor(priceToGems(selectedService.price) * 0.95).toLocaleString()} gems.
                  </Text>
                </View>
              )}

              <View className="mt-4">
                <Text className="text-warmBrown font-semibold mb-2">Notes (optional)</Text>
                <TextInput
                  placeholder="Any special requests or notes..."
                  placeholderTextColor="#9CA3AF"
                  value={notes}
                  onChangeText={setNotes}
                  multiline
                  numberOfLines={3}
                  className="bg-white rounded-xl p-4 text-warmBrown min-h-[100]"
                  style={{ textAlignVertical: 'top' }}
                />
              </View>
            </Animated.View>
          )}

          {/* Step 4: Confirmation */}
          {step === 4 && selectedService && (
            <Animated.View entering={FadeInUp.duration(400).delay(100)} className="px-5">
              <Text className="text-warmBrown font-bold text-lg mb-3">Confirm Booking</Text>

              <View className="bg-white rounded-xl p-4 mb-4">
                <View className="flex-row items-center pb-3 mb-3 border-b border-gray-100">
                  <Calendar size={20} color="#E07A5F" />
                  <View className="ml-3">
                    <Text className="text-gray-500 text-sm">Date & Time</Text>
                    <Text className="text-warmBrown font-semibold">
                      {formatDate(selectedDate)} at {selectedTime}
                    </Text>
                  </View>
                </View>

                <View className="flex-row items-center pb-3 mb-3 border-b border-gray-100">
                  <Clock size={20} color="#E07A5F" />
                  <View className="ml-3">
                    <Text className="text-gray-500 text-sm">Service</Text>
                    <Text className="text-warmBrown font-semibold">{selectedService.name}</Text>
                    <Text className="text-gray-500 text-sm">{selectedService.duration} minutes</Text>
                  </View>
                </View>

                <View className="flex-row items-center justify-between">
                  <Text className="text-gray-500">Total</Text>
                  <Text className="text-warmBrown font-bold text-xl">
                    {paymentMethod === 'gems'
                      ? `${priceToGems(selectedService.price).toLocaleString()} gems`
                      : `$${selectedService.price.toFixed(2)}`}
                  </Text>
                </View>
              </View>

              {notes && (
                <View className="bg-gray-100 rounded-xl p-4 mb-4">
                  <Text className="text-gray-500 text-sm mb-1">Notes</Text>
                  <Text className="text-warmBrown">{notes}</Text>
                </View>
              )}
            </Animated.View>
          )}

          <View className="h-32" />
        </ScrollView>

        {/* Bottom Action Button */}
        <View className="absolute bottom-0 left-0 right-0 bg-cream border-t border-gray-100 px-5 pt-3 pb-8">
          {step < 4 ? (
            <Pressable
              onPress={handleNextStep}
              disabled={!canProceed()}
              className={`rounded-full py-4 items-center ${
                canProceed() ? 'bg-terracotta-500' : 'bg-gray-200'
              }`}
            >
              <Text className={`font-bold ${canProceed() ? 'text-white' : 'text-gray-400'}`}>
                Continue
              </Text>
            </Pressable>
          ) : (
            <Pressable
              onPress={handleConfirmBooking}
              disabled={isBooking}
              className="rounded-full overflow-hidden"
            >
              <LinearGradient
                colors={isBooking ? ['#9CA3AF', '#6B7280'] : ['#E07A5F', '#C96347']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ paddingVertical: 16, alignItems: 'center' }}
              >
                {isBooking ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text className="text-white font-bold text-lg">Confirm Booking</Text>
                )}
              </LinearGradient>
            </Pressable>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}
