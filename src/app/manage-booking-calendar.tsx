import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, Switch, TextInput, Modal, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ChevronLeft,
  Calendar,
  Clock,
  Plus,
  X,
  AlertCircle,
  Crown,
  Sparkles,
  DollarSign,
  Ban,
  Coffee,
  Trash2,
  RefreshCw,
  Palmtree,
  Phone,
} from 'lucide-react-native';
import Animated, { FadeIn, FadeInUp, FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import {
  getBusinessServices,
  getBusinessHours,
  getBusinessBookingSettings,
  getBlockedSlots,
  getServiceTemplates,
  createBusinessService,
  updateBusinessService,
  deleteBusinessService,
  setBusinessHours,
  createBusinessBookingSettings,
  updateBusinessBookingSettings as updateDbBookingSettings,
  addBlockedSlot,
  removeBlockedSlot,
  createServicesFromTemplates,
  type DbBusinessService,
  type DbBusinessHours,
  type DbBusinessBookingSettings,
  type DbBlockedSlot,
  type DbServiceTemplate,
  type BusinessStatusType,
} from '@/lib/booking-api';

const DAYS_OF_WEEK = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

const DAY_LABELS: Record<string, string> = {
  sunday: 'Sun',
  monday: 'Mon',
  tuesday: 'Tue',
  wednesday: 'Wed',
  thursday: 'Thu',
  friday: 'Fri',
  saturday: 'Sat',
};

const TIME_OPTIONS = [
  '06:00', '06:30', '07:00', '07:30', '08:00', '08:30', '09:00', '09:30',
  '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
  '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30', '22:00',
];

// First 25 bookings are FREE
const FREE_BOOKING_LIMIT = 25;

interface LocalHours {
  day: string;
  dayIndex: number;
  isOpen: boolean;
  openTime: string;
  closeTime: string;
}

export default function ManageBookingCalendarScreen() {
  const { businessId, businessName, businessCategory } = useLocalSearchParams<{
    businessId: string;
    businessName: string;
    businessCategory?: string;
  }>();

  // Loading states
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Data states
  const [services, setServices] = useState<DbBusinessService[]>([]);
  const [bookingSettings, setBookingSettings] = useState<DbBusinessBookingSettings | null>(null);
  const [blockedSlots, setBlockedSlots] = useState<DbBlockedSlot[]>([]);
  const [serviceTemplates, setServiceTemplates] = useState<DbServiceTemplate[]>([]);
  const [hours, setHours] = useState<LocalHours[]>(
    DAYS_OF_WEEK.map((day, index) => ({
      day,
      dayIndex: index,
      isOpen: index !== 0, // Closed on Sunday by default
      openTime: '09:00',
      closeTime: '18:00',
    }))
  );

  // UI states
  const [showAddService, setShowAddService] = useState(false);
  const [showBlockTimeModal, setShowBlockTimeModal] = useState(false);
  const [showTemplatesModal, setShowTemplatesModal] = useState(false);
  const [newService, setNewService] = useState({
    name: '',
    description: '',
    duration: '30',
    price: '',
    category: '',
  });
  const [newBlockedTime, setNewBlockedTime] = useState({
    day: 'everyday' as 'everyday' | string,
    startTime: '12:00',
    endTime: '13:00',
    reason: 'Lunch Break',
  });

  const remainingFreeBookings = Math.max(0, FREE_BOOKING_LIMIT - (bookingSettings?.total_bookings_received || 0));
  const needsSubscription = (bookingSettings?.total_bookings_received || 0) >= FREE_BOOKING_LIMIT && !bookingSettings?.has_business_pro;

  // Load data on mount
  useEffect(() => {
    loadData();
  }, [businessId]);

  const loadData = async () => {
    if (!businessId) return;

    setIsLoading(true);
    try {
      const [servicesData, hoursData, settingsData, blockedData, templatesData] = await Promise.all([
        getBusinessServices(businessId),
        getBusinessHours(businessId),
        getBusinessBookingSettings(businessId),
        getBlockedSlots(businessId),
        businessCategory ? getServiceTemplates(businessCategory) : Promise.resolve([]),
      ]);

      setServices(servicesData);
      setBlockedSlots(blockedData);
      setServiceTemplates(templatesData);

      // Map database hours to local format
      if (hoursData.length > 0) {
        const mappedHours = DAYS_OF_WEEK.map((day, index) => {
          const dbHour = hoursData.find(h => h.day_of_week === index);
          return {
            day,
            dayIndex: index,
            isOpen: dbHour?.is_open ?? (index !== 0),
            openTime: dbHour?.open_time || '09:00',
            closeTime: dbHour?.close_time || '18:00',
          };
        });
        setHours(mappedHours);
      }

      // Create settings if they don't exist
      if (settingsData) {
        setBookingSettings(settingsData);
      } else {
        const newSettings = await createBusinessBookingSettings(businessId);
        setBookingSettings(newSettings);
      }
    } catch (error) {
      console.error('Error loading booking data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!businessId) return;

    setIsSaving(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      // Save hours
      const hoursToSave = hours.map(h => ({
        day_of_week: h.dayIndex,
        is_open: h.isOpen,
        open_time: h.openTime,
        close_time: h.closeTime,
      }));
      await setBusinessHours(businessId, hoursToSave);

      // Save booking settings
      if (bookingSettings) {
        await updateDbBookingSettings(businessId, {
          is_booking_enabled: bookingSettings.is_booking_enabled,
          appointment_buffer: bookingSettings.appointment_buffer,
          advance_booking_days: bookingSettings.advance_booking_days,
        });
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (error) {
      console.error('Error saving booking settings:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsSaving(false);
    }
  };

  const toggleDayOpen = (dayIndex: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setHours(prev =>
      prev.map(h =>
        h.dayIndex === dayIndex ? { ...h, isOpen: !h.isOpen } : h
      )
    );
  };

  const updateDayTime = (dayIndex: number, field: 'openTime' | 'closeTime', value: string) => {
    setHours(prev =>
      prev.map(h =>
        h.dayIndex === dayIndex ? { ...h, [field]: value } : h
      )
    );
  };

  const handleAddService = async () => {
    if (!newService.name || !newService.price || !businessId) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const created = await createBusinessService(businessId, {
        name: newService.name,
        description: newService.description || undefined,
        duration: parseInt(newService.duration, 10),
        price: parseFloat(newService.price),
        category: newService.category || undefined,
      });

      if (created) {
        setServices(prev => [...prev, created]);
      }

      setNewService({ name: '', description: '', duration: '30', price: '', category: '' });
      setShowAddService(false);
    } catch (error) {
      console.error('Error adding service:', error);
    }
  };

  const handleRemoveService = async (serviceId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      const success = await deleteBusinessService(serviceId);
      if (success) {
        setServices(prev => prev.filter(s => s.id !== serviceId));
      }
    } catch (error) {
      console.error('Error removing service:', error);
    }
  };

  const handleAddFromTemplates = async (selectedTemplates: DbServiceTemplate[]) => {
    if (!businessId || selectedTemplates.length === 0) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const created = await createServicesFromTemplates(businessId, selectedTemplates);
      setServices(prev => [...prev, ...created]);
      setShowTemplatesModal(false);
    } catch (error) {
      console.error('Error adding services from templates:', error);
    }
  };

  const handleAddBlockedTime = async () => {
    if (!businessId) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const slot = await addBlockedSlot(businessId, {
        day_of_week: newBlockedTime.day === 'everyday' ? undefined : DAYS_OF_WEEK.indexOf(newBlockedTime.day),
        start_time: newBlockedTime.startTime,
        end_time: newBlockedTime.endTime,
        reason: newBlockedTime.reason,
        is_recurring: true,
      });

      if (slot) {
        setBlockedSlots(prev => [...prev, slot]);
      }

      setNewBlockedTime({
        day: 'everyday',
        startTime: '12:00',
        endTime: '13:00',
        reason: 'Lunch Break',
      });
      setShowBlockTimeModal(false);
    } catch (error) {
      console.error('Error adding blocked time:', error);
    }
  };

  const handleRemoveBlockedTime = async (slotId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      const success = await removeBlockedSlot(slotId);
      if (success) {
        setBlockedSlots(prev => prev.filter(s => s.id !== slotId));
      }
    } catch (error) {
      console.error('Error removing blocked time:', error);
    }
  };

  const goToBusinessPro = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/business-pro-paywall');
  };

  if (isLoading) {
    return (
      <View className="flex-1 bg-cream justify-center items-center">
        <ActivityIndicator size="large" color="#1B4D3E" />
        <Text className="text-warmBrown mt-4">Loading booking settings...</Text>
      </View>
    );
  }

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
              disabled={isSaving}
              className={`rounded-full px-4 py-2 ${isSaving ? 'bg-gray-400' : 'bg-forest-600'}`}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text className="text-white font-semibold">Save</Text>
              )}
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
            ) : bookingSettings?.has_business_pro ? (
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
                    style={{ width: `${((bookingSettings?.total_bookings_received || 0) / FREE_BOOKING_LIMIT) * 100}%` }}
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
                  value={bookingSettings?.is_booking_enabled && !needsSubscription}
                  onValueChange={(value) => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setBookingSettings(prev => prev ? { ...prev, is_booking_enabled: value } : null);
                  }}
                  trackColor={{ false: '#E5E7EB', true: '#10B981' }}
                  thumbColor="#FFFFFF"
                  disabled={needsSubscription}
                />
              </View>
            </View>
          </Animated.View>

          {/* Business Status */}
          <Animated.View entering={FadeInUp.duration(400).delay(175)} className="px-5 mt-4">
            <Text className="text-lg font-semibold text-warmBrown mb-3">Business Status</Text>
            <Text className="text-gray-500 text-sm mb-3">
              Let customers know your current availability
            </Text>
            <View className="bg-white rounded-2xl shadow-sm overflow-hidden">
              {[
                { id: 'open' as BusinessStatusType, label: 'Open', desc: 'Following regular hours', icon: Clock, color: '#10B981', bgColor: '#D1FAE5' },
                { id: 'temporarily_closed' as BusinessStatusType, label: 'Temporarily Closed', desc: 'Short-term closure', icon: Ban, color: '#F59E0B', bgColor: '#FEF3C7' },
                { id: 'vacation' as BusinessStatusType, label: 'On Vacation', desc: 'Extended time off', icon: Palmtree, color: '#8B5CF6', bgColor: '#EDE9FE' },
                { id: 'by_appointment' as BusinessStatusType, label: 'By Appointment Only', desc: 'Contact to schedule', icon: Phone, color: '#3B82F6', bgColor: '#DBEAFE' },
              ].map((status, index) => {
                const Icon = status.icon;
                const isSelected = (bookingSettings?.current_status || 'open') === status.id;
                return (
                  <Pressable
                    key={status.id}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setBookingSettings(prev => prev ? { ...prev, current_status: status.id } : null);
                    }}
                    className={`flex-row items-center p-4 ${index < 3 ? 'border-b border-gray-100' : ''}`}
                  >
                    <View
                      className="w-10 h-10 rounded-full items-center justify-center"
                      style={{ backgroundColor: isSelected ? status.bgColor : '#F3F4F6' }}
                    >
                      <Icon size={20} color={isSelected ? status.color : '#9CA3AF'} />
                    </View>
                    <View className="flex-1 ml-3">
                      <Text className={`font-semibold ${isSelected ? 'text-warmBrown' : 'text-gray-600'}`}>
                        {status.label}
                      </Text>
                      <Text className="text-gray-500 text-sm">{status.desc}</Text>
                    </View>
                    <View
                      className={`w-6 h-6 rounded-full border-2 items-center justify-center ${
                        isSelected ? 'border-forest-600 bg-forest-600' : 'border-gray-300'
                      }`}
                    >
                      {isSelected && <View className="w-2 h-2 rounded-full bg-white" />}
                    </View>
                  </Pressable>
                );
              })}
            </View>

            {/* Status Message - shown for temp closed and vacation */}
            {(bookingSettings?.current_status === 'temporarily_closed' || bookingSettings?.current_status === 'vacation') && (
              <Animated.View entering={FadeInDown.duration(300)} className="mt-3">
                <View className="bg-white rounded-2xl p-4 shadow-sm">
                  <Text className="text-warmBrown font-medium mb-2">
                    {bookingSettings?.current_status === 'vacation' ? 'Vacation Details' : 'Status Message'}
                  </Text>
                  <TextInput
                    placeholder={bookingSettings?.current_status === 'vacation' ? "e.g., Back on Jan 15th" : "e.g., Closed for renovations"}
                    value={bookingSettings?.status_message || ''}
                    onChangeText={(text) => setBookingSettings(prev => prev ? { ...prev, status_message: text } : null)}
                    className="bg-gray-100 rounded-xl px-4 py-3 text-warmBrown"
                    placeholderTextColor="#9CA3AF"
                  />
                  {bookingSettings?.current_status === 'vacation' && (
                    <View className="flex-row mt-3 space-x-2">
                      <View className="flex-1">
                        <Text className="text-gray-500 text-xs mb-1">Return Date (optional)</Text>
                        <TextInput
                          placeholder="YYYY-MM-DD"
                          value={bookingSettings?.vacation_end || ''}
                          onChangeText={(text) => setBookingSettings(prev => prev ? { ...prev, vacation_end: text } : null)}
                          className="bg-gray-100 rounded-xl px-4 py-3 text-warmBrown"
                          placeholderTextColor="#9CA3AF"
                        />
                      </View>
                    </View>
                  )}
                </View>
              </Animated.View>
            )}
          </Animated.View>

          {/* Business Hours */}
          <Animated.View entering={FadeInUp.duration(400).delay(200)} className="px-5 mt-4">
            <Text className="text-lg font-semibold text-warmBrown mb-3">Business Hours</Text>
            <View className="bg-white rounded-2xl shadow-sm overflow-hidden">
              {hours.map((h, index) => (
                <View
                  key={h.day}
                  className={`flex-row items-center p-4 ${
                    index < hours.length - 1 ? 'border-b border-gray-100' : ''
                  }`}
                >
                  <Pressable
                    onPress={() => toggleDayOpen(h.dayIndex)}
                    className={`w-12 h-12 rounded-full items-center justify-center ${
                      h.isOpen ? 'bg-forest-600' : 'bg-gray-200'
                    }`}
                  >
                    <Text className={`font-bold text-sm ${h.isOpen ? 'text-white' : 'text-gray-500'}`}>
                      {DAY_LABELS[h.day]}
                    </Text>
                  </Pressable>

                  {h.isOpen ? (
                    <View className="flex-1 flex-row items-center justify-end">
                      <View className="bg-gray-100 rounded-lg px-3 py-2">
                        <Text className="text-warmBrown font-medium">{h.openTime}</Text>
                      </View>
                      <Text className="mx-2 text-gray-400">to</Text>
                      <View className="bg-gray-100 rounded-lg px-3 py-2">
                        <Text className="text-warmBrown font-medium">{h.closeTime}</Text>
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
              <View className="flex-row">
                {serviceTemplates.length > 0 && services.length === 0 && (
                  <Pressable
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setShowTemplatesModal(true);
                    }}
                    className="bg-blue-500 rounded-full p-2 mr-2"
                  >
                    <RefreshCw size={18} color="#FFFFFF" />
                  </Pressable>
                )}
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
            </View>

            {services.length === 0 ? (
              <View className="bg-white rounded-2xl p-6 items-center shadow-sm">
                <View className="bg-gray-100 rounded-full p-4 mb-3">
                  <DollarSign size={32} color="#9CA3AF" />
                </View>
                <Text className="text-warmBrown font-semibold text-center">No services added</Text>
                <Text className="text-gray-500 text-sm text-center mt-1">
                  Add services that customers can book
                </Text>
                {serviceTemplates.length > 0 && (
                  <Pressable
                    onPress={() => setShowTemplatesModal(true)}
                    className="bg-blue-50 rounded-xl px-4 py-3 mt-4"
                  >
                    <Text className="text-blue-600 font-medium text-center">
                      Load {serviceTemplates.length} suggested services for your business type
                    </Text>
                  </Pressable>
                )}
              </View>
            ) : (
              <View className="bg-white rounded-2xl shadow-sm overflow-hidden">
                {services.map((service, index) => (
                  <View
                    key={service.id}
                    className={`p-4 ${
                      index < services.length - 1 ? 'border-b border-gray-100' : ''
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
                          {service.category && (
                            <View className="bg-blue-100 rounded-full px-2 py-1 ml-2">
                              <Text className="text-blue-700 text-xs">{service.category}</Text>
                            </View>
                          )}
                        </View>
                      </View>
                      <Pressable
                        onPress={() => handleRemoveService(service.id)}
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

                <TextInput
                  placeholder="Category (optional, e.g., Haircuts)"
                  value={newService.category}
                  onChangeText={(text) => setNewService((prev) => ({ ...prev, category: text }))}
                  className="bg-gray-100 rounded-xl px-4 py-3 text-warmBrown mb-2"
                  placeholderTextColor="#9CA3AF"
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
                    onPress={handleAddService}
                    className="flex-1 bg-forest-600 rounded-xl py-3 items-center"
                  >
                    <Text className="text-white font-medium">Add Service</Text>
                  </Pressable>
                </View>
              </Animated.View>
            )}
          </Animated.View>

          {/* Booking Settings */}
          <Animated.View entering={FadeInUp.duration(400).delay(300)} className="px-5 mt-6">
            <Text className="text-lg font-semibold text-warmBrown mb-3">Booking Settings</Text>
            <View className="bg-white rounded-2xl p-4 shadow-sm">
              <View className="flex-row items-center justify-between mb-4">
                <View>
                  <Text className="text-warmBrown font-medium">Advance Booking</Text>
                  <Text className="text-gray-500 text-sm">How far ahead customers can book</Text>
                </View>
                <View className="bg-gray-100 rounded-lg px-3 py-2">
                  <Text className="text-warmBrown font-medium">{bookingSettings?.advance_booking_days || 30} days</Text>
                </View>
              </View>

              <View className="flex-row items-center justify-between">
                <View>
                  <Text className="text-warmBrown font-medium">Buffer Time</Text>
                  <Text className="text-gray-500 text-sm">Time between appointments</Text>
                </View>
                <View className="bg-gray-100 rounded-lg px-3 py-2">
                  <Text className="text-warmBrown font-medium">{bookingSettings?.appointment_buffer || 15} min</Text>
                </View>
              </View>
            </View>
          </Animated.View>

          {/* Blocked Time Slots */}
          <Animated.View entering={FadeInUp.duration(400).delay(350)} className="px-5 mt-6 mb-8">
            <View className="flex-row items-center justify-between mb-3">
              <View>
                <Text className="text-lg font-semibold text-warmBrown">Blocked Times</Text>
                <Text className="text-gray-500 text-sm">Block lunch breaks, meetings, etc.</Text>
              </View>
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setShowBlockTimeModal(true);
                }}
                className="bg-red-500 rounded-full p-2"
              >
                <Ban size={18} color="#FFFFFF" />
              </Pressable>
            </View>

            {blockedSlots.length === 0 ? (
              <View className="bg-white rounded-2xl p-6 items-center shadow-sm">
                <View className="bg-gray-100 rounded-full p-4 mb-3">
                  <Coffee size={32} color="#9CA3AF" />
                </View>
                <Text className="text-warmBrown font-semibold text-center">No blocked times</Text>
                <Text className="text-gray-500 text-sm text-center mt-1">
                  Block times for lunch, meetings, or personal breaks
                </Text>
              </View>
            ) : (
              <View className="bg-white rounded-2xl shadow-sm overflow-hidden">
                {blockedSlots.map((slot, index) => (
                  <View
                    key={slot.id}
                    className={`p-4 flex-row items-center ${
                      index < blockedSlots.length - 1 ? 'border-b border-gray-100' : ''
                    }`}
                  >
                    <View className="bg-red-100 rounded-full p-2">
                      <Ban size={18} color="#DC2626" />
                    </View>
                    <View className="flex-1 ml-3">
                      <Text className="text-warmBrown font-semibold">{slot.reason || 'Blocked'}</Text>
                      <View className="flex-row items-center mt-1">
                        <Text className="text-gray-500 text-sm capitalize">
                          {slot.is_recurring
                            ? slot.day_of_week !== null
                              ? DAYS_OF_WEEK[slot.day_of_week]
                              : 'Every day'
                            : slot.date || 'One-time'}
                        </Text>
                        <Text className="text-gray-400 mx-1">•</Text>
                        <Text className="text-gray-500 text-sm">
                          {slot.start_time} - {slot.end_time}
                        </Text>
                      </View>
                    </View>
                    <Pressable
                      onPress={() => handleRemoveBlockedTime(slot.id)}
                      className="bg-gray-100 rounded-full p-2"
                    >
                      <Trash2 size={16} color="#6B7280" />
                    </Pressable>
                  </View>
                ))}
              </View>
            )}
          </Animated.View>

          {/* Upgrade CTA */}
          {!bookingSettings?.has_business_pro && (
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

      {/* Block Time Modal */}
      <Modal
        visible={showBlockTimeModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowBlockTimeModal(false)}
      >
        <SafeAreaView className="flex-1 bg-cream">
          <View className="px-5 py-4 border-b border-gray-200 flex-row items-center justify-between">
            <Pressable onPress={() => setShowBlockTimeModal(false)}>
              <Text className="text-gray-500 text-base">Cancel</Text>
            </Pressable>
            <Text className="text-warmBrown font-bold text-lg">Block Time</Text>
            <Pressable onPress={handleAddBlockedTime}>
              <Text className="text-forest-600 font-semibold text-base">Add</Text>
            </Pressable>
          </View>

          <ScrollView className="flex-1 px-5 pt-6">
            {/* Reason */}
            <View className="mb-6">
              <Text className="text-warmBrown font-semibold mb-2">Reason</Text>
              <View className="flex-row flex-wrap gap-2">
                {['Lunch Break', 'Meeting', 'Personal Time', 'Prayer Time', 'Other'].map((reason) => (
                  <Pressable
                    key={reason}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setNewBlockedTime((prev) => ({ ...prev, reason }));
                    }}
                    className={`px-4 py-2 rounded-full ${
                      newBlockedTime.reason === reason ? 'bg-forest-600' : 'bg-white'
                    }`}
                  >
                    <Text
                      className={`font-medium ${
                        newBlockedTime.reason === reason ? 'text-white' : 'text-gray-600'
                      }`}
                    >
                      {reason}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Day Selection */}
            <View className="mb-6">
              <Text className="text-warmBrown font-semibold mb-2">When</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }}>
                <View className="flex-row gap-2">
                  <Pressable
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setNewBlockedTime((prev) => ({ ...prev, day: 'everyday' }));
                    }}
                    className={`px-4 py-2 rounded-full ${
                      newBlockedTime.day === 'everyday' ? 'bg-forest-600' : 'bg-white'
                    }`}
                  >
                    <Text
                      className={`font-medium ${
                        newBlockedTime.day === 'everyday' ? 'text-white' : 'text-gray-600'
                      }`}
                    >
                      Every Day
                    </Text>
                  </Pressable>
                  {DAYS_OF_WEEK.map((day) => (
                    <Pressable
                      key={day}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setNewBlockedTime((prev) => ({ ...prev, day }));
                      }}
                      className={`px-4 py-2 rounded-full ${
                        newBlockedTime.day === day ? 'bg-forest-600' : 'bg-white'
                      }`}
                    >
                      <Text
                        className={`font-medium capitalize ${
                          newBlockedTime.day === day ? 'text-white' : 'text-gray-600'
                        }`}
                      >
                        {DAY_LABELS[day]}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </ScrollView>
            </View>

            {/* Time Selection */}
            <View className="mb-6">
              <Text className="text-warmBrown font-semibold mb-2">Time Range</Text>
              <View className="flex-row items-center">
                <View className="flex-1 bg-white rounded-xl p-4">
                  <Text className="text-gray-500 text-xs mb-1">Start Time</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }}>
                    <View className="flex-row gap-2">
                      {TIME_OPTIONS.map((time) => (
                        <Pressable
                          key={`start-${time}`}
                          onPress={() => setNewBlockedTime((prev) => ({ ...prev, startTime: time }))}
                          className={`px-3 py-2 rounded-lg ${
                            newBlockedTime.startTime === time ? 'bg-forest-600' : 'bg-gray-100'
                          }`}
                        >
                          <Text
                            className={`text-sm ${
                              newBlockedTime.startTime === time ? 'text-white font-semibold' : 'text-gray-600'
                            }`}
                          >
                            {time}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  </ScrollView>
                </View>
              </View>

              <View className="flex-row items-center mt-3">
                <View className="flex-1 bg-white rounded-xl p-4">
                  <Text className="text-gray-500 text-xs mb-1">End Time</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }}>
                    <View className="flex-row gap-2">
                      {TIME_OPTIONS.map((time) => (
                        <Pressable
                          key={`end-${time}`}
                          onPress={() => setNewBlockedTime((prev) => ({ ...prev, endTime: time }))}
                          className={`px-3 py-2 rounded-lg ${
                            newBlockedTime.endTime === time ? 'bg-forest-600' : 'bg-gray-100'
                          }`}
                        >
                          <Text
                            className={`text-sm ${
                              newBlockedTime.endTime === time ? 'text-white font-semibold' : 'text-gray-600'
                            }`}
                          >
                            {time}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  </ScrollView>
                </View>
              </View>
            </View>

            {/* Preview */}
            <View className="bg-red-50 rounded-2xl p-4 border border-red-200">
              <View className="flex-row items-center">
                <View className="bg-red-100 rounded-full p-2">
                  <Ban size={20} color="#DC2626" />
                </View>
                <View className="ml-3">
                  <Text className="text-red-800 font-semibold">{newBlockedTime.reason}</Text>
                  <Text className="text-red-600 text-sm">
                    {newBlockedTime.day === 'everyday' ? 'Every day' : newBlockedTime.day} • {newBlockedTime.startTime} - {newBlockedTime.endTime}
                  </Text>
                </View>
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Service Templates Modal */}
      <Modal
        visible={showTemplatesModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowTemplatesModal(false)}
      >
        <SafeAreaView className="flex-1 bg-cream">
          <View className="px-5 py-4 border-b border-gray-200 flex-row items-center justify-between">
            <Pressable onPress={() => setShowTemplatesModal(false)}>
              <Text className="text-gray-500 text-base">Cancel</Text>
            </Pressable>
            <Text className="text-warmBrown font-bold text-lg">Service Templates</Text>
            <Pressable onPress={() => handleAddFromTemplates(serviceTemplates)}>
              <Text className="text-forest-600 font-semibold text-base">Add All</Text>
            </Pressable>
          </View>

          <ScrollView className="flex-1 px-5 pt-4">
            <Text className="text-gray-600 mb-4">
              These are suggested services for your business type. You can add all of them or customize after.
            </Text>
            {serviceTemplates.map((template, index) => (
              <View
                key={template.id}
                className={`bg-white rounded-xl p-4 mb-3 ${
                  index === serviceTemplates.length - 1 ? 'mb-8' : ''
                }`}
              >
                <View className="flex-row items-start justify-between">
                  <View className="flex-1">
                    <Text className="text-warmBrown font-semibold">{template.name}</Text>
                    {template.description && (
                      <Text className="text-gray-500 text-sm mt-0.5">{template.description}</Text>
                    )}
                    <View className="flex-row items-center mt-2">
                      <View className="flex-row items-center bg-gray-100 rounded-full px-2 py-1">
                        <Clock size={12} color="#6B7280" />
                        <Text className="text-gray-600 text-xs ml-1">{template.suggested_duration} min</Text>
                      </View>
                      <View className="flex-row items-center bg-emerald-100 rounded-full px-2 py-1 ml-2">
                        <DollarSign size={12} color="#10B981" />
                        <Text className="text-emerald-700 text-xs">{template.suggested_price}</Text>
                      </View>
                      {template.service_category && (
                        <View className="bg-blue-100 rounded-full px-2 py-1 ml-2">
                          <Text className="text-blue-700 text-xs">{template.service_category}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>
              </View>
            ))}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </View>
  );
}
