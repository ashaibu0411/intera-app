import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, RefreshControl, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ChevronLeft,
  Calendar,
  Clock,
  DollarSign,
  Phone,
  Check,
  X,
  AlertCircle,
  User,
  TrendingUp,
  CalendarCheck,
  Settings,
  CalendarPlus,
  BarChart3,
} from 'lucide-react-native';
import Animated, { FadeIn, FadeInUp, FadeInRight } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useStore, Appointment } from '@/lib/store';
import { getBusinessAppointments, updateAppointmentStatus, type DbAppointment } from '@/lib/booking-api';
import { generateMultiAppointmentIcs } from '@/lib/calendarExport';

type FilterTab = 'pending' | 'confirmed' | 'completed' | 'all';

function dbToAppointment(db: DbAppointment): Appointment {
  const service = db.service;
  const business = db.business;
  const customer = db.customer as any;
  const t = db.start_time || '09:00';
  const timeStr = t.includes('AM') || t.includes('PM') ? t : (() => {
    const [h, m] = t.split(':').map(Number);
    const hour = h > 12 ? h - 12 : h === 0 ? 12 : h;
    return `${hour}:${String(m || 0).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
  })();
  return {
    id: db.id,
    businessId: db.business_id,
    businessName: business?.name || 'Business',
    customerId: db.customer_id,
    customerName: customer?.name || 'Customer',
    customerAvatar: customer?.avatar_url,
    customerPhone: db.customer_phone || customer?.phone,
    service: {
      id: service?.id || '',
      businessId: db.business_id,
      name: service?.name || 'Service',
      description: service?.description || '',
      duration: service?.duration || 30,
      price: service?.price || 0,
      currency: service?.currency || 'USD',
      category: service?.category || 'general',
      isActive: true,
    },
    date: db.date,
    time: timeStr,
    status: db.status as Appointment['status'],
    isPaid: db.payment_status === 'paid',
    paymentMethod: db.payment_method as Appointment['paymentMethod'],
    createdAt: db.created_at,
  };
}

export default function BusinessAppointmentsScreen() {
  const { businessId, businessName } = useLocalSearchParams<{ businessId: string; businessName: string }>();

  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [dbAppointments, setDbAppointments] = useState<Appointment[]>([]);

  const businessAppointments = useStore((s) => s.businessAppointments);
  const updateAppointmentStatusStore = useStore((s) => s.updateAppointmentStatus);

  const loadAppointments = useCallback(async () => {
    if (!businessId) return;
    const db = await getBusinessAppointments(businessId, { limit: 200 });
    setDbAppointments(db.map(dbToAppointment));
  }, [businessId]);

  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  // Combine DB with in-memory store (e.g. just received)
  const allAppointments = useMemo(() => {
    const fromDb = new Set(dbAppointments.map((a) => a.id));
    const fromStore = businessAppointments.filter((a) => a.businessId === businessId && !fromDb.has(a.id));
    return [...dbAppointments, ...fromStore];
  }, [dbAppointments, businessAppointments, businessId]);

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

  const handleConfirm = async (appointmentId: string) => {
    try {
      await updateAppointmentStatus(appointmentId, 'confirmed');
      updateAppointmentStatusStore(appointmentId, 'confirmed');
      setDbAppointments((prev) => prev.map((a) => (a.id === appointmentId ? { ...a, status: 'confirmed' as const } : a)));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const handleComplete = async (appointmentId: string) => {
    try {
      await updateAppointmentStatus(appointmentId, 'completed');
      updateAppointmentStatusStore(appointmentId, 'completed');
      setDbAppointments((prev) => prev.map((a) => (a.id === appointmentId ? { ...a, status: 'completed' as const } : a)));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const handleCancel = async (appointmentId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await updateAppointmentStatus(appointmentId, 'cancelled', 'business');
      updateAppointmentStatusStore(appointmentId, 'cancelled');
      setDbAppointments((prev) => prev.map((a) => (a.id === appointmentId ? { ...a, status: 'cancelled' as const } : a)));
    } catch {
      updateAppointmentStatusStore(appointmentId, 'cancelled');
    }
  };

  const handleAddDayToCalendar = (date: string) => {
    const dayAppointments = allAppointments.filter((a) => a.date === date && a.status !== 'cancelled');
    if (dayAppointments.length === 0) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const ics = generateMultiAppointmentIcs(
      dayAppointments.map((apt) => ({
        title: `${apt.service.name} - ${apt.customerName}`,
        description: apt.service.description,
        startDate: apt.date,
        startTime: apt.time,
        durationMinutes: apt.service.duration,
        businessName: businessName || apt.businessName,
        serviceName: apt.service.name,
      }))
    );
    Share.share({ message: ics, title: `Appointments for ${date}` }).catch(() => {});
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadAppointments();
    setIsRefreshing(false);
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
            <View className="flex-row items-center gap-2">
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push({ pathname: '/business-analytics', params: { businessId } });
                }}
                className="bg-forest-600 rounded-full p-2.5"
              >
                <BarChart3 size={20} color="#FFFFFF" />
              </Pressable>
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

          {/* Embedded Calendar - Today's appointments with Add to Calendar */}
          <Animated.View entering={FadeInUp.duration(400).delay(125)} className="px-5 mt-4">
            <View className="bg-white rounded-2xl p-4 shadow-sm">
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-warmBrown font-bold">Today</Text>
                <Pressable
                  onPress={() => handleAddDayToCalendar(new Date().toISOString().split('T')[0])}
                  className="flex-row items-center bg-forest-100 rounded-full px-3 py-2"
                >
                  <CalendarPlus size={16} color="#1B4D3E" />
                  <Text className="text-forest-700 font-medium ml-2">Export Day</Text>
                </Pressable>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }}>
                {[0, 1, 2, 3, 4, 5, 6].map((offset) => {
                  const d = new Date();
                  d.setDate(d.getDate() + offset);
                  const dateStr = d.toISOString().split('T')[0];
                  const count = allAppointments.filter((a) => a.date === dateStr && a.status !== 'cancelled').length;
                  const isToday = offset === 0;
                  return (
                    <Pressable
                      key={dateStr}
                      onPress={() => count > 0 && handleAddDayToCalendar(dateStr)}
                      className={`mr-2 rounded-xl px-4 py-3 items-center min-w-[70] ${isToday ? 'bg-forest-600' : 'bg-gray-100'}`}
                    >
                      <Text className={`text-xs font-medium ${isToday ? 'text-white/80' : 'text-gray-500'}`}>
                        {offset === 0 ? 'Today' : d.toLocaleDateString('en-US', { weekday: 'short' })}
                      </Text>
                      <Text className={`text-xl font-bold mt-1 ${isToday ? 'text-white' : 'text-warmBrown'}`}>
                        {d.getDate()}
                      </Text>
                      <Text className={`text-xs ${isToday ? 'text-white/80' : 'text-gray-400'}`}>
                        {count} {count === 1 ? 'apt' : 'apts'}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
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
