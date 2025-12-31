import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, Pressable, Switch, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ChevronLeft,
  Calendar,
  Clock,
  Plus,
  X,
  Check,
  AlertCircle,
  Crown,
  Sparkles,
  DollarSign,
} from 'lucide-react-native';
import Animated, { FadeIn, FadeInUp, FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useStore, BusinessBookingSettings, BusinessHours, BusinessService } from '@/lib/store';

const DAYS_OF_WEEK: BusinessHours['day'][] = [
  'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'
];

const DAY_LABELS: Record<BusinessHours['day'], string> = {
  monday: 'Mon',
  tuesday: 'Tue',
  wednesday: 'Wed',
  thursday: 'Thu',
  friday: 'Fri',
  saturday: 'Sat',
  sunday: 'Sun',
};

const TIME_OPTIONS = [
  '06:00', '06:30', '07:00', '07:30', '08:00', '08:30', '09:00', '09:30',
  '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
  '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30', '22:00',
];

const DEFAULT_HOURS: BusinessHours[] = DAYS_OF_WEEK.map((day) => ({
  day,
  isOpen: day !== 'sunday',
  openTime: '09:00',
  closeTime: '18:00',
}));

// First 25 bookings are FREE
const FREE_BOOKING_LIMIT = 25;

export default function ManageBookingCalendarScreen() {
  const { businessId, businessName } = useLocalSearchParams<{ businessId: string; businessName: string }>();

  const businessBookingSettings = useStore((s) => s.businessBookingSettings);
  const setBusinessBookingSettings = useStore((s) => s.setBusinessBookingSettings);
  const updateBusinessBookingSettings = useStore((s) => s.updateBusinessBookingSettings);

  // Get or create settings for this business
  const existingSettings = businessBookingSettings.find((s) => s.businessId === businessId);

  const [settings, setSettings] = useState<BusinessBookingSettings>(
    existingSettings || {
      businessId: businessId || '',
      isBookingEnabled: true,
      hasBusinessPro: false,
      bookingHours: DEFAULT_HOURS,
      blockedDates: [],
      blockedTimeSlots: [],
      appointmentBuffer: 15,
      advanceBookingDays: 30,
      services: [],
      totalBookingsReceived: 0,
    }
  );

  const [showAddService, setShowAddService] = useState(false);
  const [newService, setNewService] = useState({
    name: '',
    description: '',
    duration: '30',
    price: '',
  });

  const remainingFreeBookings = Math.max(0, FREE_BOOKING_LIMIT - settings.totalBookingsReceived);
  const needsSubscription = settings.totalBookingsReceived >= FREE_BOOKING_LIMIT && !settings.hasBusinessPro;

  const handleSave = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (existingSettings) {
      updateBusinessBookingSettings(businessId || '', settings);
    } else {
      setBusinessBookingSettings(settings);
    }
    router.back();
  };

  const toggleDayOpen = (day: BusinessHours['day']) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSettings((prev) => ({
      ...prev,
      bookingHours: prev.bookingHours.map((h) =>
        h.day === day ? { ...h, isOpen: !h.isOpen } : h
      ),
    }));
  };

  const updateDayTime = (day: BusinessHours['day'], field: 'openTime' | 'closeTime', value: string) => {
    setSettings((prev) => ({
      ...prev,
      bookingHours: prev.bookingHours.map((h) =>
        h.day === day ? { ...h, [field]: value } : h
      ),
    }));
  };

  const addService = () => {
    if (!newService.name || !newService.price) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const service: BusinessService = {
      id: Date.now().toString(),
      businessId: businessId || '',
      name: newService.name,
      description: newService.description,
      duration: parseInt(newService.duration, 10),
      price: parseFloat(newService.price),
      currency: 'USD',
      category: 'general',
      isActive: true,
    };

    setSettings((prev) => ({
      ...prev,
      services: [...prev.services, service],
    }));

    setNewService({ name: '', description: '', duration: '30', price: '' });
    setShowAddService(false);
  };

  const removeService = (serviceId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSettings((prev) => ({
      ...prev,
      services: prev.services.filter((s) => s.id !== serviceId),
    }));
  };

  const goToBusinessPro = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/business-pro-paywall');
  };

  return (
    <View className="flex-1 bg-cream">
      <SafeAreaView edges={['top']} className="flex-1">
        {/* Header */}
        <Animated.View entering={FadeIn.duration(300)} className="px-5 pt-4 pb-2">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.back();
                }}
                className="bg-white rounded-full p-2 mr-3 shadow-sm"
              >
                <ChevronLeft size={24} color="#2D1F1A" />
              </Pressable>
              <View>
                <Text className="text-xl font-bold text-warmBrown">Booking Calendar</Text>
                <Text className="text-sm text-gray-500">{businessName || 'Your Business'}</Text>
              </View>
            </View>
            <Pressable
              onPress={handleSave}
              className="bg-forest-600 rounded-full px-4 py-2"
            >
              <Text className="text-white font-semibold">Save</Text>
            </Pressable>
          </View>
        </Animated.View>

        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {/* Free Tier / Subscription Status */}
          <Animated.View entering={FadeInUp.duration(400).delay(100)} className="px-5 mt-4">
            {needsSubscription ? (
              <Pressable onPress={goToBusinessPro}>
                <LinearGradient
                  colors={['#DC2626', '#B91C1C']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{ borderRadius: 16, padding: 16 }}
                >
                  <View className="flex-row items-center">
                    <View className="bg-white/20 rounded-full p-2">
                      <AlertCircle size={24} color="#FFFFFF" />
                    </View>
                    <View className="flex-1 ml-3">
                      <Text className="text-white font-bold">Free Bookings Used</Text>
                      <Text className="text-white/80 text-sm">
                        Upgrade to Business Pro to continue accepting bookings
                      </Text>
                    </View>
                    <Crown size={24} color="#FFD700" />
                  </View>
                </LinearGradient>
              </Pressable>
            ) : settings.hasBusinessPro ? (
              <View className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-2xl p-4 border border-amber-200">
                <View className="flex-row items-center">
                  <View className="bg-amber-100 rounded-full p-2">
                    <Crown size={24} color="#D97706" />
                  </View>
                  <View className="flex-1 ml-3">
                    <Text className="text-amber-800 font-bold">Business Pro Active</Text>
                    <Text className="text-amber-600 text-sm">Unlimited bookings enabled</Text>
                  </View>
                  <Sparkles size={20} color="#D97706" />
                </View>
              </View>
            ) : (
              <View className="bg-forest-50 rounded-2xl p-4 border border-forest-200">
                <View className="flex-row items-center">
                  <View className="bg-forest-100 rounded-full p-2">
                    <Calendar size={24} color="#1B4D3E" />
                  </View>
                  <View className="flex-1 ml-3">
                    <Text className="text-forest-800 font-bold">Free Bookings</Text>
                    <Text className="text-forest-600 text-sm">
                      {remainingFreeBookings} of {FREE_BOOKING_LIMIT} free bookings remaining
                    </Text>
                  </View>
                </View>
                {/* Progress bar */}
                <View className="mt-3 bg-forest-200 rounded-full h-2">
                  <View
                    className="bg-forest-600 rounded-full h-2"
                    style={{ width: `${(settings.totalBookingsReceived / FREE_BOOKING_LIMIT) * 100}%` }}
                  />
                </View>
              </View>
            )}
          </Animated.View>

          {/* Enable Bookings Toggle */}
          <Animated.View entering={FadeInUp.duration(400).delay(150)} className="px-5 mt-4">
            <View className="bg-white rounded-2xl p-4 shadow-sm">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center">
                  <View className="bg-emerald-100 rounded-full p-2">
                    <Calendar size={20} color="#10B981" />
                  </View>
                  <View className="ml-3">
                    <Text className="text-warmBrown font-semibold">Accept Bookings</Text>
                    <Text className="text-gray-500 text-sm">Let customers book appointments</Text>
                  </View>
                </View>
                <Switch
                  value={settings.isBookingEnabled && !needsSubscription}
                  onValueChange={(value) => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSettings((prev) => ({ ...prev, isBookingEnabled: value }));
                  }}
                  trackColor={{ false: '#E5E7EB', true: '#10B981' }}
                  thumbColor="#FFFFFF"
                  disabled={needsSubscription}
                />
              </View>
            </View>
          </Animated.View>

          {/* Business Hours */}
          <Animated.View entering={FadeInUp.duration(400).delay(200)} className="px-5 mt-4">
            <Text className="text-lg font-semibold text-warmBrown mb-3">Business Hours</Text>
            <View className="bg-white rounded-2xl shadow-sm overflow-hidden">
              {settings.bookingHours.map((hours, index) => (
                <View
                  key={hours.day}
                  className={`flex-row items-center p-4 ${
                    index < settings.bookingHours.length - 1 ? 'border-b border-gray-100' : ''
                  }`}
                >
                  <Pressable
                    onPress={() => toggleDayOpen(hours.day)}
                    className={`w-12 h-12 rounded-full items-center justify-center ${
                      hours.isOpen ? 'bg-forest-600' : 'bg-gray-200'
                    }`}
                  >
                    <Text className={`font-bold text-sm ${hours.isOpen ? 'text-white' : 'text-gray-500'}`}>
                      {DAY_LABELS[hours.day]}
                    </Text>
                  </Pressable>

                  {hours.isOpen ? (
                    <View className="flex-1 flex-row items-center justify-end">
                      <View className="bg-gray-100 rounded-lg px-3 py-2">
                        <Text className="text-warmBrown font-medium">{hours.openTime}</Text>
                      </View>
                      <Text className="mx-2 text-gray-400">to</Text>
                      <View className="bg-gray-100 rounded-lg px-3 py-2">
                        <Text className="text-warmBrown font-medium">{hours.closeTime}</Text>
                      </View>
                    </View>
                  ) : (
                    <Text className="flex-1 text-right text-gray-400">Closed</Text>
                  )}
                </View>
              ))}
            </View>
          </Animated.View>

          {/* Services */}
          <Animated.View entering={FadeInUp.duration(400).delay(250)} className="px-5 mt-6">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-lg font-semibold text-warmBrown">Services</Text>
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setShowAddService(true);
                }}
                className="bg-forest-600 rounded-full p-2"
              >
                <Plus size={18} color="#FFFFFF" />
              </Pressable>
            </View>

            {settings.services.length === 0 ? (
              <View className="bg-white rounded-2xl p-6 items-center shadow-sm">
                <View className="bg-gray-100 rounded-full p-4 mb-3">
                  <DollarSign size={32} color="#9CA3AF" />
                </View>
                <Text className="text-warmBrown font-semibold text-center">No services added</Text>
                <Text className="text-gray-500 text-sm text-center mt-1">
                  Add services that customers can book
                </Text>
              </View>
            ) : (
              <View className="bg-white rounded-2xl shadow-sm overflow-hidden">
                {settings.services.map((service, index) => (
                  <View
                    key={service.id}
                    className={`p-4 ${
                      index < settings.services.length - 1 ? 'border-b border-gray-100' : ''
                    }`}
                  >
                    <View className="flex-row items-start justify-between">
                      <View className="flex-1">
                        <Text className="text-warmBrown font-semibold">{service.name}</Text>
                        {service.description && (
                          <Text className="text-gray-500 text-sm mt-0.5">{service.description}</Text>
                        )}
                        <View className="flex-row items-center mt-2">
                          <View className="flex-row items-center bg-gray-100 rounded-full px-2 py-1">
                            <Clock size={12} color="#6B7280" />
                            <Text className="text-gray-600 text-xs ml-1">{service.duration} min</Text>
                          </View>
                          <View className="flex-row items-center bg-emerald-100 rounded-full px-2 py-1 ml-2">
                            <DollarSign size={12} color="#10B981" />
                            <Text className="text-emerald-700 text-xs">{service.price}</Text>
                          </View>
                        </View>
                      </View>
                      <Pressable
                        onPress={() => removeService(service.id)}
                        className="bg-red-100 rounded-full p-1.5"
                      >
                        <X size={16} color="#DC2626" />
                      </Pressable>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Add Service Form */}
            {showAddService && (
              <Animated.View entering={FadeInDown.duration(300)} className="bg-white rounded-2xl p-4 mt-3 shadow-sm">
                <Text className="text-warmBrown font-semibold mb-3">Add New Service</Text>

                <TextInput
                  placeholder="Service name (e.g., Haircut)"
                  value={newService.name}
                  onChangeText={(text) => setNewService((prev) => ({ ...prev, name: text }))}
                  className="bg-gray-100 rounded-xl px-4 py-3 text-warmBrown mb-2"
                  placeholderTextColor="#9CA3AF"
                />

                <TextInput
                  placeholder="Description (optional)"
                  value={newService.description}
                  onChangeText={(text) => setNewService((prev) => ({ ...prev, description: text }))}
                  className="bg-gray-100 rounded-xl px-4 py-3 text-warmBrown mb-2"
                  placeholderTextColor="#9CA3AF"
                  multiline
                />

                <View className="flex-row space-x-2 mb-3">
                  <View className="flex-1">
                    <Text className="text-gray-500 text-xs mb-1">Duration (min)</Text>
                    <TextInput
                      placeholder="30"
                      value={newService.duration}
                      onChangeText={(text) => setNewService((prev) => ({ ...prev, duration: text }))}
                      className="bg-gray-100 rounded-xl px-4 py-3 text-warmBrown"
                      placeholderTextColor="#9CA3AF"
                      keyboardType="number-pad"
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-gray-500 text-xs mb-1">Price ($)</Text>
                    <TextInput
                      placeholder="25.00"
                      value={newService.price}
                      onChangeText={(text) => setNewService((prev) => ({ ...prev, price: text }))}
                      className="bg-gray-100 rounded-xl px-4 py-3 text-warmBrown"
                      placeholderTextColor="#9CA3AF"
                      keyboardType="decimal-pad"
                    />
                  </View>
                </View>

                <View className="flex-row space-x-2">
                  <Pressable
                    onPress={() => setShowAddService(false)}
                    className="flex-1 bg-gray-100 rounded-xl py-3 items-center"
                  >
                    <Text className="text-gray-600 font-medium">Cancel</Text>
                  </Pressable>
                  <Pressable
                    onPress={addService}
                    className="flex-1 bg-forest-600 rounded-xl py-3 items-center"
                  >
                    <Text className="text-white font-medium">Add Service</Text>
                  </Pressable>
                </View>
              </Animated.View>
            )}
          </Animated.View>

          {/* Booking Settings */}
          <Animated.View entering={FadeInUp.duration(400).delay(300)} className="px-5 mt-6 mb-8">
            <Text className="text-lg font-semibold text-warmBrown mb-3">Booking Settings</Text>
            <View className="bg-white rounded-2xl p-4 shadow-sm">
              <View className="flex-row items-center justify-between mb-4">
                <View>
                  <Text className="text-warmBrown font-medium">Advance Booking</Text>
                  <Text className="text-gray-500 text-sm">How far ahead customers can book</Text>
                </View>
                <View className="bg-gray-100 rounded-lg px-3 py-2">
                  <Text className="text-warmBrown font-medium">{settings.advanceBookingDays} days</Text>
                </View>
              </View>

              <View className="flex-row items-center justify-between">
                <View>
                  <Text className="text-warmBrown font-medium">Buffer Time</Text>
                  <Text className="text-gray-500 text-sm">Time between appointments</Text>
                </View>
                <View className="bg-gray-100 rounded-lg px-3 py-2">
                  <Text className="text-warmBrown font-medium">{settings.appointmentBuffer} min</Text>
                </View>
              </View>
            </View>
          </Animated.View>

          {/* Upgrade CTA */}
          {!settings.hasBusinessPro && (
            <Animated.View entering={FadeInUp.duration(400).delay(350)} className="px-5 mb-8">
              <Pressable onPress={goToBusinessPro}>
                <LinearGradient
                  colors={['#D97706', '#B45309']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{ borderRadius: 16, padding: 20 }}
                >
                  <View className="flex-row items-center">
                    <View className="bg-white/20 rounded-full p-3">
                      <Crown size={24} color="#FFFFFF" />
                    </View>
                    <View className="flex-1 ml-4">
                      <Text className="text-white font-bold text-lg">Upgrade to Business Pro</Text>
                      <Text className="text-white/80 text-sm mt-0.5">
                        Unlimited bookings, analytics & more
                      </Text>
                    </View>
                    <Sparkles size={24} color="#FFD700" />
                  </View>
                </LinearGradient>
              </Pressable>
            </Animated.View>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
