import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, ScrollView, Pressable, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ChevronLeft,
  BarChart3,
  Calendar,
  DollarSign,
  TrendingUp,
  Users,
  Clock,
  XCircle,
  CheckCircle,
} from 'lucide-react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { getBusinessAppointments, type DbAppointment } from '@/lib/booking-api';
import { getBusiness } from '@/lib/marketplace-api';

function dbRevenue(apt: DbAppointment): number {
  if (apt.payment_amount != null && apt.payment_amount > 0) return apt.payment_amount;
  const svc = apt.service as { price?: number } | undefined;
  return svc?.price ?? 0;
}

export default function BusinessAnalyticsScreen() {
  const { businessId } = useLocalSearchParams<{ businessId: string }>();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [appointments, setAppointments] = useState<DbAppointment[]>([]);
  const [business, setBusiness] = useState<{ name: string } | null>(null);

  const load = useCallback(async () => {
    if (!businessId) return;
    const [apts, biz] = await Promise.all([
      getBusinessAppointments(businessId, { limit: 500 }),
      getBusiness(businessId),
    ]);
    setAppointments(apts || []);
    setBusiness(biz ? { name: biz.name } : null);
  }, [businessId]);

  const handleRefresh = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsRefreshing(true);
    await load();
    setIsRefreshing(false);
  }, [load]);

  React.useEffect(() => {
    load();
  }, [load]);

  const stats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const monthAgo = new Date();
    monthAgo.setDate(monthAgo.getDate() - 30);

    const completed = appointments.filter((a) => a.status === 'completed');
    const pending = appointments.filter((a) => a.status === 'pending' || a.status === 'confirmed');
    const cancelled = appointments.filter((a) => a.status === 'cancelled');

    const totalRevenue = completed.reduce((s, a) => s + dbRevenue(a), 0);
    const todayRevenue = completed
      .filter((a) => a.date === today)
      .reduce((s, a) => s + dbRevenue(a), 0);
    const weekRevenue = completed
      .filter((a) => new Date(a.date) >= weekAgo)
      .reduce((s, a) => s + dbRevenue(a), 0);
    const monthRevenue = completed
      .filter((a) => new Date(a.date) >= monthAgo)
      .reduce((s, a) => s + dbRevenue(a), 0);

    return {
      totalAppointments: appointments.length,
      completed: completed.length,
      pending: pending.length,
      cancelled: cancelled.length,
      totalRevenue,
      todayRevenue,
      weekRevenue,
      monthRevenue,
    };
  }, [appointments]);

  if (!businessId) {
    return (
      <View className="flex-1 bg-cream items-center justify-center">
        <Text className="text-gray-500">No business selected</Text>
        <Pressable onPress={() => router.back()} className="mt-4 px-6 py-3 bg-terracotta-500 rounded-xl">
          <Text className="text-white font-semibold">Go Back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-cream">
      <SafeAreaView edges={['top']} className="flex-1">
        <Animated.View entering={FadeInUp.duration(300)} className="flex-row items-center px-5 py-4 border-b border-gray-100">
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.back();
            }}
            className="mr-4 p-1"
            hitSlop={8}
          >
            <ChevronLeft size={24} color="#2D1F1A" />
          </Pressable>
          <View className="flex-1">
            <Text className="text-xl font-bold text-warmBrown">Analytics</Text>
            <Text className="text-gray-500 text-sm">{business?.name || 'Business'}</Text>
          </View>
          <View className="bg-forest-100 rounded-full p-2">
            <BarChart3 size={22} color="#1B4D3E" />
          </View>
        </Animated.View>

        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor="#1B4D3E" />
          }
        >
          {/* Revenue Cards */}
          <Animated.View entering={FadeInUp.duration(300).delay(50)} className="px-5 mt-4">
            <Text className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Revenue</Text>
            <View className="flex-row flex-wrap" style={{ gap: 12 }}>
              <View className="bg-white rounded-2xl p-4 shadow-sm" style={{ flex: 1, minWidth: 140 }}>
                <View className="bg-emerald-100 rounded-full w-10 h-10 items-center justify-center">
                  <DollarSign size={20} color="#10B981" />
                </View>
                <Text className="text-2xl font-bold text-warmBrown mt-2">${stats.totalRevenue.toFixed(0)}</Text>
                <Text className="text-gray-500 text-sm">All time</Text>
              </View>
              <View className="bg-white rounded-2xl p-4 shadow-sm" style={{ flex: 1, minWidth: 140 }}>
                <View className="bg-blue-100 rounded-full w-10 h-10 items-center justify-center">
                  <TrendingUp size={20} color="#3B82F6" />
                </View>
                <Text className="text-2xl font-bold text-warmBrown mt-2">${stats.monthRevenue.toFixed(0)}</Text>
                <Text className="text-gray-500 text-sm">This month</Text>
              </View>
              <View className="bg-white rounded-2xl p-4 shadow-sm" style={{ flex: 1, minWidth: 140 }}>
                <View className="bg-amber-100 rounded-full w-10 h-10 items-center justify-center">
                  <Calendar size={20} color="#D97706" />
                </View>
                <Text className="text-2xl font-bold text-warmBrown mt-2">${stats.weekRevenue.toFixed(0)}</Text>
                <Text className="text-gray-500 text-sm">This week</Text>
              </View>
            </View>
          </Animated.View>

          {/* Appointments */}
          <Animated.View entering={FadeInUp.duration(300).delay(100)} className="px-5 mt-6">
            <Text className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Appointments</Text>
            <View className="flex-row flex-wrap" style={{ gap: 12 }}>
              <View className="bg-white rounded-2xl p-4 shadow-sm flex-row items-center" style={{ flex: 1, minWidth: 140 }}>
                <View className="bg-emerald-100 rounded-full w-10 h-10 items-center justify-center">
                  <CheckCircle size={20} color="#10B981" />
                </View>
                <View className="ml-3">
                  <Text className="text-2xl font-bold text-warmBrown">{stats.completed}</Text>
                  <Text className="text-gray-500 text-sm">Completed</Text>
                </View>
              </View>
              <View className="bg-white rounded-2xl p-4 shadow-sm flex-row items-center" style={{ flex: 1, minWidth: 140 }}>
                <View className="bg-amber-100 rounded-full w-10 h-10 items-center justify-center">
                  <Clock size={20} color="#D97706" />
                </View>
                <View className="ml-3">
                  <Text className="text-2xl font-bold text-warmBrown">{stats.pending}</Text>
                  <Text className="text-gray-500 text-sm">Pending</Text>
                </View>
              </View>
              <View className="bg-white rounded-2xl p-4 shadow-sm flex-row items-center" style={{ flex: 1, minWidth: 140 }}>
                <View className="bg-red-100 rounded-full w-10 h-10 items-center justify-center">
                  <XCircle size={20} color="#EF4444" />
                </View>
                <View className="ml-3">
                  <Text className="text-2xl font-bold text-warmBrown">{stats.cancelled}</Text>
                  <Text className="text-gray-500 text-sm">Cancelled</Text>
                </View>
              </View>
            </View>
          </Animated.View>

          <View className="h-8" />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
