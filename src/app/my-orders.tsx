import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { ChevronLeft, Package, Clock, CheckCircle2, XCircle, Store } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useStore } from '@/lib/store';
import { getMyOrders, type BusinessOrderStatus } from '@/lib/marketplace-api';
import { subscribeToMyOrders } from '@/lib/ordersRealtime';

type OrderRow = any;

const statusLabel = (s: BusinessOrderStatus) => {
  switch (s) {
    case 'pending':
      return { label: 'Pending', bg: 'bg-amber-100', text: 'text-amber-700', Icon: Clock };
    case 'accepted':
      return { label: 'Accepted', bg: 'bg-blue-100', text: 'text-blue-700', Icon: CheckCircle2 };
    case 'ready':
      return { label: 'Ready for pickup', bg: 'bg-emerald-100', text: 'text-emerald-700', Icon: CheckCircle2 };
    case 'picked_up':
      return { label: 'Picked up', bg: 'bg-gray-100', text: 'text-gray-700', Icon: CheckCircle2 };
    case 'cancelled':
      return { label: 'Cancelled', bg: 'bg-red-100', text: 'text-red-700', Icon: XCircle };
    default:
      return { label: String(s), bg: 'bg-gray-100', text: 'text-gray-700', Icon: Package };
  }
};

export default function MyOrdersScreen() {
  const currentUser = useStore((s) => s.currentUser);
  const isGuest = useStore((s) => s.isGuest);

  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!currentUser?.id) return;
    const data = await getMyOrders(currentUser.id, 100);
    setOrders(data as any);
  }, [currentUser?.id]);

  useEffect(() => {
    if (!currentUser?.id) return;
    load()
      .catch((e) => {
        console.log('[MyOrders] load failed:', e);
        Alert.alert('Could not load orders', 'Please try again.');
      })
      .finally(() => setLoading(false));
  }, [currentUser?.id, load]);

  useEffect(() => {
    if (!currentUser?.id) return;
    const unsub = subscribeToMyOrders({
      customerId: currentUser.id,
      onChange: () => {
        load().catch(() => null);
      },
    });
    return unsub;
  }, [currentUser?.id, load]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await load();
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } finally {
      setRefreshing(false);
    }
  };

  const sorted = useMemo(() => {
    return [...orders].sort((a: any, b: any) => String(b.created_at).localeCompare(String(a.created_at)));
  }, [orders]);

  if (isGuest || !currentUser?.id) {
    return (
      <View className="flex-1 bg-cream items-center justify-center px-6">
        <Package size={44} color="#9CA3AF" />
        <Text className="text-warmBrown font-semibold text-lg mt-4">Sign in to see your orders</Text>
        <Pressable onPress={() => router.push('/signup')} className="mt-4 bg-forest-600 px-6 py-3 rounded-full">
          <Text className="text-white font-semibold">Sign in</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-cream">
      <SafeAreaView edges={['top']} className="flex-1">
        <View className="px-5 pt-4 pb-3 flex-row items-center justify-between">
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.back();
            }}
            className="bg-white rounded-full p-2 shadow-sm"
          >
            <ChevronLeft size={22} color="#2D1F1A" />
          </Pressable>
          <Text className="text-lg font-bold text-warmBrown">My Orders</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          className="flex-1 px-5"
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1B4D3E" />}
          showsVerticalScrollIndicator={false}
        >
          {loading ? (
            <View className="py-20 items-center">
              <ActivityIndicator color="#1B4D3E" />
              <Text className="text-gray-500 mt-3">Loading orders…</Text>
            </View>
          ) : sorted.length === 0 ? (
            <View className="py-16 items-center">
              <View className="bg-gray-100 rounded-full p-6 mb-4">
                <Store size={36} color="#9CA3AF" />
              </View>
              <Text className="text-warmBrown font-semibold text-lg">No orders yet</Text>
              <Text className="text-gray-500 text-center mt-2 px-10">
                Place a pickup order from a local business and it will show up here.
              </Text>
              <Pressable onPress={() => router.push('/business-directory' as any)} className="mt-6 bg-forest-600 px-6 py-3 rounded-full">
                <Text className="text-white font-semibold">Browse businesses</Text>
              </Pressable>
            </View>
          ) : (
            <View className="pb-10">
              {sorted.map((o: any) => {
                const st = statusLabel(o.status as BusinessOrderStatus);
                return (
                  <Pressable
                    key={o.id}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      if (o.business_id) router.push(`/business/${String(o.business_id)}` as any);
                    }}
                    className="bg-white rounded-2xl p-4 mb-3 shadow-sm"
                  >
                    <View className="flex-row items-center">
                      <Image
                        source={{ uri: o.business?.logo || o.business?.image || 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=200' }}
                        style={{ width: 48, height: 48, borderRadius: 12 }}
                        contentFit="cover"
                      />
                      <View className="flex-1 ml-3">
                        <Text className="text-warmBrown font-bold" numberOfLines={1}>
                          {o.business?.name || 'Business'}
                        </Text>
                        <Text className="text-gray-500 text-sm" numberOfLines={1}>
                          ${Number(o.subtotal || 0).toFixed(2)} • {o.items?.length || 0} item(s)
                        </Text>
                      </View>
                      <View className={`px-3 py-1 rounded-full ${st.bg} flex-row items-center`}>
                        <st.Icon size={12} color="#374151" />
                        <Text className={`ml-2 text-xs font-semibold ${st.text}`}>{st.label}</Text>
                      </View>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

