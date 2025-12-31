import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, Pressable, RefreshControl, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  CheckCircle,
  XCircle,
  AlertCircle,
  MoreVertical,
  Phone,
  MessageCircle,
} from 'lucide-react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useStore, type Appointment } from '@/lib/store';

type FilterType = 'upcoming' | 'past' | 'cancelled';

const STATUS_CONFIG = {
  pending: { label: 'Pending', color: '#F59E0B', bgColor: '#FEF3C7', icon: AlertCircle },
  confirmed: { label: 'Confirmed', color: '#10B981', bgColor: '#D1FAE5', icon: CheckCircle },
  completed: { label: 'Completed', color: '#6B7280', bgColor: '#F3F4F6', icon: CheckCircle },
  cancelled: { label: 'Cancelled', color: '#EF4444', bgColor: '#FEE2E2', icon: XCircle },
};

// Mock appointments for demo
const MOCK_APPOINTMENTS: Appointment[] = [
  {
    id: 'apt_1',
    businessId: 'barber_1',
    businessName: "King's Kutz Barbershop",
    businessImage: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=800&h=400&fit=crop',
    customerId: 'user_1',
    customerName: 'John Doe',
    service: {
      id: 'svc_1',
      businessId: 'barber_1',
      name: 'Haircut + Beard Trim',
      description: 'Full haircut with precision beard shaping',
      duration: 45,
      price: 40,
      currency: 'USD',
      category: 'Haircuts',
      isActive: true,
    },
    date: '2025-01-05',
    time: '10:00 AM',
    status: 'confirmed',
    isPaid: false,
    paymentMethod: 'cash',
    createdAt: '2024-12-30T10:00:00Z',
  },
  {
    id: 'apt_2',
    businessId: 'salon_1',
    businessName: "Queen's Beauty Salon",
    businessImage: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&h=400&fit=crop',
    customerId: 'user_1',
    customerName: 'John Doe',
    service: {
      id: 'svc_2',
      businessId: 'salon_1',
      name: 'Braiding - Box Braids',
      description: 'Classic box braids, medium length',
      duration: 180,
      price: 150,
      currency: 'USD',
      category: 'Braiding',
      isActive: true,
    },
    date: '2025-01-08',
    time: '2:00 PM',
    status: 'pending',
    isPaid: true,
    paymentMethod: 'in_app',
    createdAt: '2024-12-29T14:00:00Z',
  },
  {
    id: 'apt_3',
    businessId: 'barber_1',
    businessName: "King's Kutz Barbershop",
    businessImage: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=800&h=400&fit=crop',
    customerId: 'user_1',
    customerName: 'John Doe',
    service: {
      id: 'svc_1',
      businessId: 'barber_1',
      name: 'Classic Haircut',
      description: 'Traditional haircut',
      duration: 30,
      price: 25,
      currency: 'USD',
      category: 'Haircuts',
      isActive: true,
    },
    date: '2024-12-20',
    time: '11:00 AM',
    status: 'completed',
    isPaid: true,
    paymentMethod: 'cash',
    createdAt: '2024-12-15T09:00:00Z',
  },
];

function AppointmentCard({
  appointment,
  onCancel,
}: {
  appointment: Appointment;
  onCancel: () => void;
}) {
  const status = STATUS_CONFIG[appointment.status];
  const StatusIcon = status.icon;

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const isUpcoming = new Date(appointment.date) >= new Date();
  const canCancel = appointment.status === 'pending' || appointment.status === 'confirmed';

  const handleCall = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Would integrate with phone dialer
  };

  const handleMessage = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/chat/business_${appointment.businessId}` as any);
  };

  return (
    <Animated.View entering={FadeInUp.duration(400)} className="mx-4 mb-4">
      <View className="bg-white rounded-2xl overflow-hidden shadow-sm">
        {/* Header with Business Image */}
        <View className="relative">
          <Image
            source={{ uri: appointment.businessImage }}
            style={{ width: '100%', height: 100 }}
            contentFit="cover"
          />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.6)']}
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: 60,
              justifyContent: 'flex-end',
              paddingHorizontal: 16,
              paddingBottom: 10,
            }}
          >
            <Text className="text-white font-bold">{appointment.businessName}</Text>
          </LinearGradient>

          {/* Status Badge */}
          <View
            className="absolute top-3 right-3 px-2.5 py-1 rounded-full flex-row items-center"
            style={{ backgroundColor: status.bgColor }}
          >
            <StatusIcon size={12} color={status.color} />
            <Text className="text-xs font-semibold ml-1" style={{ color: status.color }}>
              {status.label}
            </Text>
          </View>
        </View>

        {/* Content */}
        <View className="p-4">
          {/* Service Info */}
          <Text className="text-warmBrown font-semibold text-lg">
            {appointment.service.name}
          </Text>
          <Text className="text-gray-500 text-sm mt-0.5">
            {appointment.service.duration} min • ${appointment.service.price}
          </Text>

          {/* Date & Time */}
          <View className="flex-row mt-3">
            <View className="flex-row items-center flex-1">
              <Calendar size={14} color="#D4673A" />
              <Text className="text-warmBrown ml-2">{formatDate(appointment.date)}</Text>
            </View>
            <View className="flex-row items-center flex-1">
              <Clock size={14} color="#D4673A" />
              <Text className="text-warmBrown ml-2">{appointment.time}</Text>
            </View>
          </View>

          {/* Payment Status */}
          <View className="flex-row items-center mt-3 pt-3 border-t border-gray-100">
            <Text className="text-gray-500 text-sm flex-1">
              {appointment.isPaid ? '✓ Paid' : 'Pay at location'}
            </Text>
            <Text className="text-terracotta-500 font-bold">
              ${appointment.service.price}
            </Text>
          </View>

          {/* Actions */}
          {isUpcoming && (
            <View className="flex-row mt-4 gap-2">
              <Pressable
                onPress={handleCall}
                className="flex-1 bg-gray-100 rounded-full py-2.5 flex-row items-center justify-center"
              >
                <Phone size={16} color="#6B7280" />
                <Text className="text-gray-600 font-medium ml-2">Call</Text>
              </Pressable>
              <Pressable
                onPress={handleMessage}
                className="flex-1 bg-gray-100 rounded-full py-2.5 flex-row items-center justify-center"
              >
                <MessageCircle size={16} color="#6B7280" />
                <Text className="text-gray-600 font-medium ml-2">Message</Text>
              </Pressable>
              {canCancel && (
                <Pressable
                  onPress={onCancel}
                  className="flex-1 bg-red-50 rounded-full py-2.5 flex-row items-center justify-center"
                >
                  <XCircle size={16} color="#EF4444" />
                  <Text className="text-red-500 font-medium ml-2">Cancel</Text>
                </Pressable>
              )}
            </View>
          )}
        </View>
      </View>
    </Animated.View>
  );
}

export default function MyAppointmentsScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterType>('upcoming');

  const userAppointments = useStore((s) => s.userAppointments);
  const cancelAppointment = useStore((s) => s.cancelAppointment);

  // Combine store appointments with mock data for demo
  const allAppointments = useMemo(() => {
    return [...userAppointments, ...MOCK_APPOINTMENTS];
  }, [userAppointments]);

  // Filter appointments
  const filteredAppointments = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    return allAppointments.filter((apt) => {
      const aptDate = new Date(apt.date);

      switch (filter) {
        case 'upcoming':
          return aptDate >= now && apt.status !== 'cancelled' && apt.status !== 'completed';
        case 'past':
          return aptDate < now || apt.status === 'completed';
        case 'cancelled':
          return apt.status === 'cancelled';
        default:
          return true;
      }
    }).sort((a, b) => {
      // Sort by date
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return filter === 'upcoming' ? dateA - dateB : dateB - dateA;
    });
  }, [allAppointments, filter]);

  const onRefresh = async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const handleCancelAppointment = (appointment: Appointment) => {
    Alert.alert(
      'Cancel Appointment',
      `Are you sure you want to cancel your ${appointment.service.name} appointment?`,
      [
        { text: 'Keep Appointment', style: 'cancel' },
        {
          text: 'Cancel',
          style: 'destructive',
          onPress: () => {
            cancelAppointment(appointment.id);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          },
        },
      ]
    );
  };

  const handleFilterChange = (newFilter: FilterType) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFilter(newFilter);
  };

  return (
    <View className="flex-1 bg-cream">
      <SafeAreaView edges={['top']} className="flex-1">
        {/* Header */}
        <Animated.View
          entering={FadeInDown.duration(400)}
          className="flex-row items-center px-5 py-3"
        >
          <Pressable
            onPress={() => router.back()}
            className="bg-white rounded-full p-2 shadow-sm"
          >
            <ArrowLeft size={22} color="#2D1F1A" />
          </Pressable>
          <Text className="flex-1 text-center text-warmBrown font-bold text-lg mr-10">
            My Appointments
          </Text>
        </Animated.View>

        {/* Filter Tabs */}
        <Animated.View
          entering={FadeInDown.duration(400).delay(100)}
          className="flex-row mx-5 bg-white rounded-full p-1 shadow-sm mb-4"
        >
          {(['upcoming', 'past', 'cancelled'] as FilterType[]).map((f) => (
            <Pressable
              key={f}
              onPress={() => handleFilterChange(f)}
              className={`flex-1 py-2.5 rounded-full items-center ${
                filter === f ? 'bg-terracotta-500' : ''
              }`}
            >
              <Text
                className={`font-medium capitalize ${
                  filter === f ? 'text-white' : 'text-gray-500'
                }`}
              >
                {f}
              </Text>
            </Pressable>
          ))}
        </Animated.View>

        {/* Stats */}
        <Animated.View
          entering={FadeInUp.duration(400).delay(150)}
          className="mx-4 mb-4"
        >
          <View className="bg-white rounded-xl p-4 shadow-sm flex-row">
            <View className="flex-1 items-center">
              <Text className="text-2xl font-bold text-terracotta-500">
                {allAppointments.filter((a) => a.status === 'confirmed' || a.status === 'pending').length}
              </Text>
              <Text className="text-gray-500 text-xs mt-1">Upcoming</Text>
            </View>
            <View className="w-px bg-gray-200" />
            <View className="flex-1 items-center">
              <Text className="text-2xl font-bold text-forest-700">
                {allAppointments.filter((a) => a.status === 'completed').length}
              </Text>
              <Text className="text-gray-500 text-xs mt-1">Completed</Text>
            </View>
            <View className="w-px bg-gray-200" />
            <View className="flex-1 items-center">
              <Text className="text-2xl font-bold text-gray-400">
                {allAppointments.filter((a) => a.status === 'cancelled').length}
              </Text>
              <Text className="text-gray-500 text-xs mt-1">Cancelled</Text>
            </View>
          </View>
        </Animated.View>

        {/* Appointments List */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#D4673A"
            />
          }
          contentContainerStyle={{ paddingBottom: 20 }}
        >
          {filteredAppointments.length > 0 ? (
            filteredAppointments.map((appointment, index) => (
              <AppointmentCard
                key={appointment.id}
                appointment={appointment}
                onCancel={() => handleCancelAppointment(appointment)}
              />
            ))
          ) : (
            <View className="mx-4 py-12 items-center">
              <View className="bg-gray-100 rounded-full p-4 mb-4">
                <Calendar size={32} color="#9CA3AF" />
              </View>
              <Text className="text-warmBrown font-semibold text-lg text-center">
                No {filter} appointments
              </Text>
              <Text className="text-gray-500 text-center mt-2">
                {filter === 'upcoming'
                  ? 'Book an appointment with a local business'
                  : filter === 'past'
                  ? 'Your completed appointments will appear here'
                  : 'No cancelled appointments'}
              </Text>
              {filter === 'upcoming' && (
                <Pressable
                  onPress={() => router.push('/business-directory' as any)}
                  className="mt-4 bg-terracotta-500 px-6 py-3 rounded-full"
                >
                  <Text className="text-white font-semibold">Browse Businesses</Text>
                </Pressable>
              )}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
