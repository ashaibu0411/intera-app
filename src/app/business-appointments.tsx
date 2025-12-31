import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, Pressable, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ChevronLeft,
  Calendar,
  Clock,
  DollarSign,
  Phone,
  MessageCircle,
  Check,
  X,
  AlertCircle,
  User,
  TrendingUp,
  CalendarCheck,
  Settings,
} from 'lucide-react-native';
import Animated, { FadeIn, FadeInUp, FadeInRight } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useStore, Appointment } from '@/lib/store';

type FilterTab = 'pending' | 'confirmed' | 'completed' | 'all';

// Mock appointments for businesses (in production, these would come from database)
const MOCK_BUSINESS_APPOINTMENTS: Appointment[] = [
  {
    id: 'ba1',
    businessId: '7',
    businessName: "King's Kutz Barbershop",
    customerId: 'cust1',
    customerName: 'Marcus Johnson',
    customerAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop',
    customerPhone: '+1 (303) 555-1234',
    service: {
      id: 's1',
      businessId: '7',
      name: 'Classic Fade',
      description: 'Clean fade with sharp lineup',
      duration: 30,
      price: 35,
      currency: 'USD',
      category: 'Haircut',
      isActive: true,
    },
    date: '2025-01-02',
    time: '10:00 AM',
    status: 'pending',
    isPaid: false,
    paymentMethod: 'cash',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'ba2',
    businessId: '7',
    businessName: "King's Kutz Barbershop",
    customerId: 'cust2',
    customerName: 'Darnell Williams',
    customerAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop',
    customerPhone: '+1 (303) 555-5678',
    service: {
      id: 's2',
      businessId: '7',
      name: 'Beard Trim',
      description: 'Shape and line up beard',
      duration: 20,
      price: 20,
      currency: 'USD',
      category: 'Beard',
      isActive: true,
    },
    date: '2025-01-02',
    time: '11:00 AM',
    status: 'confirmed',
    isPaid: false,
    paymentMethod: 'cash',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'ba3',
    businessId: '7',
    businessName: "King's Kutz Barbershop",
    customerId: 'cust3',
    customerName: 'Tyrone Davis',
    customerAvatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&h=200&fit=crop',
    service: {
      id: 's3',
      businessId: '7',
      name: 'Premium Cut + Beard',
      description: 'Full haircut with beard trim',
      duration: 45,
      price: 50,
      currency: 'USD',
      category: 'Combo',
      isActive: true,
    },
    date: '2025-01-01',
    time: '2:00 PM',
    status: 'completed',
    isPaid: true,
    paymentMethod: 'cash',
    createdAt: new Date().toISOString(),
  },
];

export default function BusinessAppointmentsScreen() {
  const { businessId, businessName } = useLocalSearchParams<{ businessId: string; businessName: string }>();

  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const businessAppointments = useStore((s) => s.businessAppointments);
  const updateAppointmentStatus = useStore((s) => s.updateAppointmentStatus);

  // Combine real appointments with mock data for demo
  const allAppointments = useMemo(() => {
    const realForBusiness = businessAppointments.filter((a) => a.businessId === businessId);
    return [...realForBusiness, ...MOCK_BUSINESS_APPOINTMENTS];
  }, [businessAppointments, businessId]);

  const filteredAppointments = useMemo(() => {
    if (activeTab === 'all') return allAppointments;
    return allAppointments.filter((a) => a.status === activeTab);
  }, [allAppointments, activeTab]);

  // Stats
  const stats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const todayAppointments = allAppointments.filter((a) => a.date === today);
    const pendingCount = allAppointments.filter((a) => a.status === 'pending').length;
    const todayRevenue = todayAppointments
      .filter((a) => a.status === 'completed' && a.isPaid)
      .reduce((sum, a) => sum + a.service.price, 0);

    return {
      todayCount: todayAppointments.length,
      pendingCount,
      todayRevenue,
      totalCompleted: allAppointments.filter((a) => a.status === 'completed').length,
    };
  }, [allAppointments]);

  const handleConfirm = (appointmentId: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    updateAppointmentStatus(appointmentId, 'confirmed');
  };

  const handleComplete = (appointmentId: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    updateAppointmentStatus(appointmentId, 'completed');
  };

  const handleCancel = (appointmentId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    updateAppointmentStatus(appointmentId, 'cancelled');
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const getStatusColor = (status: Appointment['status']) => {
    switch (status) {
      case 'pending':
        return { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Pending' };
      case 'confirmed':
        return { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Confirmed' };
      case 'completed':
        return { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Completed' };
      case 'cancelled':
        return { bg: 'bg-red-100', text: 'text-red-700', label: 'Cancelled' };
      default:
        return { bg: 'bg-gray-100', text: 'text-gray-700', label: status };
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (dateStr === today.toISOString().split('T')[0]) return 'Today';
    if (dateStr === tomorrow.toISOString().split('T')[0]) return 'Tomorrow';

    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
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
                <Text className="text-xl font-bold text-warmBrown">Appointments</Text>
                <Text className="text-sm text-gray-500">{businessName || 'Your Business'}</Text>
              </View>
            </View>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push({
                  pathname: '/manage-booking-calendar',
                  params: { businessId, businessName },
                });
              }}
              className="bg-forest-600 rounded-full p-2.5"
            >
              <Settings size={20} color="#FFFFFF" />
            </Pressable>
          </View>
        </Animated.View>

        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor="#1B4D3E" />
          }
        >
          {/* Stats */}
          <Animated.View entering={FadeInUp.duration(400).delay(100)} className="px-5 mt-4">
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }}>
              <View className="flex-row">
                <View className="bg-white rounded-2xl p-4 mr-3 shadow-sm" style={{ width: 140 }}>
                  <View className="bg-blue-100 rounded-full w-10 h-10 items-center justify-center">
                    <Calendar size={20} color="#2563EB" />
                  </View>
                  <Text className="text-2xl font-bold text-warmBrown mt-2">{stats.todayCount}</Text>
                  <Text className="text-gray-500 text-sm">Today</Text>
                </View>

                <View className="bg-white rounded-2xl p-4 mr-3 shadow-sm" style={{ width: 140 }}>
                  <View className="bg-amber-100 rounded-full w-10 h-10 items-center justify-center">
                    <AlertCircle size={20} color="#D97706" />
                  </View>
                  <Text className="text-2xl font-bold text-warmBrown mt-2">{stats.pendingCount}</Text>
                  <Text className="text-gray-500 text-sm">Pending</Text>
                </View>

                <View className="bg-white rounded-2xl p-4 mr-3 shadow-sm" style={{ width: 140 }}>
                  <View className="bg-emerald-100 rounded-full w-10 h-10 items-center justify-center">
                    <DollarSign size={20} color="#10B981" />
                  </View>
                  <Text className="text-2xl font-bold text-warmBrown mt-2">${stats.todayRevenue}</Text>
                  <Text className="text-gray-500 text-sm">Today's Revenue</Text>
                </View>

                <View className="bg-white rounded-2xl p-4 shadow-sm" style={{ width: 140 }}>
                  <View className="bg-purple-100 rounded-full w-10 h-10 items-center justify-center">
                    <TrendingUp size={20} color="#7C3AED" />
                  </View>
                  <Text className="text-2xl font-bold text-warmBrown mt-2">{stats.totalCompleted}</Text>
                  <Text className="text-gray-500 text-sm">Completed</Text>
                </View>
              </View>
            </ScrollView>
          </Animated.View>

          {/* Filter Tabs */}
          <Animated.View entering={FadeInUp.duration(400).delay(150)} className="px-5 mt-4">
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }}>
              {(['all', 'pending', 'confirmed', 'completed'] as FilterTab[]).map((tab) => (
                <Pressable
                  key={tab}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setActiveTab(tab);
                  }}
                  className={`px-4 py-2 rounded-full mr-2 ${
                    activeTab === tab ? 'bg-forest-600' : 'bg-white'
                  }`}
                >
                  <Text
                    className={`font-medium capitalize ${
                      activeTab === tab ? 'text-white' : 'text-gray-600'
                    }`}
                  >
                    {tab}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </Animated.View>

          {/* Appointments List */}
          <Animated.View entering={FadeInUp.duration(400).delay(200)} className="px-5 mt-4">
            {filteredAppointments.length === 0 ? (
              <View className="bg-white rounded-2xl p-8 items-center shadow-sm">
                <View className="bg-gray-100 rounded-full p-4 mb-3">
                  <CalendarCheck size={32} color="#9CA3AF" />
                </View>
                <Text className="text-warmBrown font-semibold text-lg">No Appointments</Text>
                <Text className="text-gray-500 text-center mt-1">
                  {activeTab === 'all'
                    ? 'No appointments yet'
                    : `No ${activeTab} appointments`}
                </Text>
              </View>
            ) : (
              filteredAppointments.map((appointment, index) => {
                const statusStyle = getStatusColor(appointment.status);
                return (
                  <Animated.View
                    key={appointment.id}
                    entering={FadeInRight.duration(300).delay(250 + index * 50)}
                  >
                    <View className="bg-white rounded-2xl p-4 mb-3 shadow-sm">
                      {/* Customer Info */}
                      <View className="flex-row items-center">
                        {appointment.customerAvatar ? (
                          <Image
                            source={{ uri: appointment.customerAvatar }}
                            style={{ width: 48, height: 48, borderRadius: 24 }}
                            contentFit="cover"
                          />
                        ) : (
                          <View className="w-12 h-12 rounded-full bg-gray-200 items-center justify-center">
                            <User size={24} color="#9CA3AF" />
                          </View>
                        )}
                        <View className="flex-1 ml-3">
                          <Text className="text-warmBrown font-semibold">{appointment.customerName}</Text>
                          <Text className="text-gray-500 text-sm">{appointment.service.name}</Text>
                        </View>
                        <View className={`${statusStyle.bg} rounded-full px-2.5 py-1`}>
                          <Text className={`${statusStyle.text} text-xs font-medium`}>
                            {statusStyle.label}
                          </Text>
                        </View>
                      </View>

                      {/* Appointment Details */}
                      <View className="flex-row items-center mt-3 pt-3 border-t border-gray-100">
                        <View className="flex-row items-center flex-1">
                          <Calendar size={14} color="#6B7280" />
                          <Text className="text-gray-600 text-sm ml-1">
                            {formatDate(appointment.date)}
                          </Text>
                        </View>
                        <View className="flex-row items-center flex-1">
                          <Clock size={14} color="#6B7280" />
                          <Text className="text-gray-600 text-sm ml-1">{appointment.time}</Text>
                        </View>
                        <View className="flex-row items-center">
                          <DollarSign size={14} color="#10B981" />
                          <Text className="text-emerald-600 font-semibold text-sm">
                            {appointment.service.price}
                          </Text>
                        </View>
                      </View>

                      {/* Actions */}
                      {appointment.status === 'pending' && (
                        <View className="flex-row mt-3 pt-3 border-t border-gray-100">
                          <Pressable
                            onPress={() => handleCancel(appointment.id)}
                            className="flex-1 flex-row items-center justify-center bg-red-50 rounded-xl py-2 mr-2"
                          >
                            <X size={16} color="#DC2626" />
                            <Text className="text-red-600 font-medium ml-1">Decline</Text>
                          </Pressable>
                          <Pressable
                            onPress={() => handleConfirm(appointment.id)}
                            className="flex-1 flex-row items-center justify-center bg-forest-600 rounded-xl py-2"
                          >
                            <Check size={16} color="#FFFFFF" />
                            <Text className="text-white font-medium ml-1">Confirm</Text>
                          </Pressable>
                        </View>
                      )}

                      {appointment.status === 'confirmed' && (
                        <View className="flex-row mt-3 pt-3 border-t border-gray-100">
                          {appointment.customerPhone && (
                            <Pressable className="flex-1 flex-row items-center justify-center bg-gray-100 rounded-xl py-2 mr-2">
                              <Phone size={16} color="#1B4D3E" />
                              <Text className="text-forest-700 font-medium ml-1">Call</Text>
                            </Pressable>
                          )}
                          <Pressable
                            onPress={() => handleComplete(appointment.id)}
                            className="flex-1 flex-row items-center justify-center bg-emerald-600 rounded-xl py-2"
                          >
                            <Check size={16} color="#FFFFFF" />
                            <Text className="text-white font-medium ml-1">Mark Complete</Text>
                          </Pressable>
                        </View>
                      )}
                    </View>
                  </Animated.View>
                );
              })
            )}
          </Animated.View>

          {/* Calendar Settings CTA */}
          <Animated.View entering={FadeInUp.duration(400).delay(400)} className="px-5 mt-4 mb-8">
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push({
                  pathname: '/manage-booking-calendar',
                  params: { businessId, businessName },
                });
              }}
            >
              <LinearGradient
                colors={['#1B4D3E', '#153D31']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ borderRadius: 16, padding: 16 }}
              >
                <View className="flex-row items-center">
                  <View className="bg-white/20 rounded-full p-2">
                    <Settings size={20} color="#FFFFFF" />
                  </View>
                  <View className="flex-1 ml-3">
                    <Text className="text-white font-semibold">Manage Calendar</Text>
                    <Text className="text-white/70 text-sm">Set hours, services & availability</Text>
                  </View>
                </View>
              </LinearGradient>
            </Pressable>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
