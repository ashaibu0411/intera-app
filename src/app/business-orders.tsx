import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { ChevronLeft, Clock, CheckCircle2, XCircle, Package, Store, Check } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useStore } from '@/lib/store';
import { getBusinessesByOwner, getMyBusinessOrders, updateBusinessOrderStatus, type BusinessOrderStatus } from '@/lib/marketplace-api';
import { subscribeToBusinessOrders } from '@/lib/ordersRealtime';
import { sendDirectPushAlert } from '@/lib/pushAlerts';

type OrderRow = any;

const statusLabel = (s: BusinessOrderStatus) => {
  switch (s) {
    case 'pending':
      return { label: 'Pending', bg: 'bg-amber-100', text: 'text-amber-700', Icon: Clock };
    case 'accepted':
      return { label: 'Accepted', bg: 'bg-blue-100', text: 'text-blue-700', Icon: CheckCircle2 };
    case 'ready':
      return { label: 'Ready', bg: 'bg-emerald-100', text: 'text-emerald-700', Icon: CheckCircle2 };
    case 'picked_up':
      return { label: 'Picked up', bg: 'bg-gray-100', text: 'text-gray-700', Icon: CheckCircle2 };
    case 'cancelled':
      return { label: 'Cancelled', bg: 'bg-red-100', text: 'text-red-700', Icon: XCircle };
    default:
      return { label: String(s), bg: 'bg-gray-100', text: 'text-gray-700', Icon: Package };
  }
};

const nextStatus = (s: BusinessOrderStatus): BusinessOrderStatus | null => {
  if (s === 'pending') return 'accepted';
  if (s === 'accepted') return 'ready';
  if (s === 'ready') return 'picked_up';
  return null;
};

export default function BusinessOrdersScreen() {
  const currentUser = useStore((s) => s.currentUser);
  const isGuest = useStore((s) => s.isGuest);

  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!currentUser?.id) return;
    const data = await getMyBusinessOrders(currentUser.id, 200);
    setOrders(data as any);
  }, [currentUser?.id]);

  useEffect(() => {
    if (!currentUser?.id) return;
    load()
      .catch((e) => {
        console.log('[BusinessOrders] load failed:', e);
        Alert.alert('Could not load orders', 'Please try again.');
      })
      .finally(() => setLoading(false));
  }, [currentUser?.id, load]);

  useEffect(() => {
    if (!currentUser?.id) return;
    let unsubs: Array<() => void> = [];
    let mounted = true;
    (async () => {
      try {
        const businesses = await getBusinessesByOwner(currentUser.id, 200);
        if (!mounted) return;
        const ids = businesses.map((b: any) => String(b.id)).filter(Boolean);
        unsubs = ids.map((businessId) =>
          subscribeToBusinessOrders({
            businessId,
            onChange: () => {
              load().catch(() => null);
            },
          })
        );
      } catch (e) {
        console.log('[BusinessOrders] subscribe failed:', e);
      }
    })();
    return () => {
      mounted = false;
      for (const u of unsubs) u();
    };
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

  const advance = async (o: any) => {
    const ns = nextStatus(o.status as BusinessOrderStatus);
    if (!ns) return;
    if (updatingId) return;
    setUpdatingId(o.id);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const updated = await updateBusinessOrderStatus(o.id, ns);
      setOrders((prev) => prev.map((x: any) => (x.id === o.id ? updated : x)));

      // Notify customer (best-effort)
      if (updated.customer_id) {
        const title = updated.business?.name ? `${updated.business.name} order update` : 'Order update';
        const body =
          ns === 'accepted'
            ? 'Your order was accepted.'
            : ns === 'ready'
              ? 'Your order is ready for pickup.'
              : ns === 'picked_up'
                ? 'Order marked as picked up.'
                : 'Order updated.';
        sendDirectPushAlert({
          recipientUserId: String(updated.customer_id),
          title,
          body,
          data: { type: 'business_order', role: 'customer', businessId: updated.business_id, orderId: updated.id },
        });
      }
    } catch (e) {
      Alert.alert('Could not update order', 'Please try again.');
    } finally {
      setUpdatingId(null);
    }
  };

  const cancel = async (o: any) => {
    if (updatingId) return;
    setUpdatingId(o.id);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const updated = await updateBusinessOrderStatus(o.id, 'cancelled');
      setOrders((prev) => prev.map((x: any) => (x.id === o.id ? updated : x)));
    } catch {
      Alert.alert('Could not cancel order', 'Please try again.');
    } finally {
      setUpdatingId(null);
    }
  };

  if (isGuest || !currentUser?.id) {
    return (
      <View className="flex-1 bg-cream items-center justify-center px-6">
        <Store size={44} color="#9CA3AF" />
        <Text className="text-warmBrown font-semibold text-lg mt-4">Sign in to manage orders</Text>
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
          <Text className="text-lg font-bold text-warmBrown">Business Orders</Text>
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
                <Package size={36} color="#9CA3AF" />
              </View>
              <Text className="text-warmBrown font-semibold text-lg">No orders yet</Text>
              <Text className="text-gray-500 text-center mt-2 px-10">
                When customers place pickup orders, they will show up here.
              </Text>
            </View>
          ) : (
            <View className="pb-10">
              {sorted.map((o: any) => {
                const st = statusLabel(o.status as BusinessOrderStatus);
                const ns = nextStatus(o.status as BusinessOrderStatus);
                const busy = updatingId === o.id;
                return (
                  <View key={o.id} className="bg-white rounded-2xl p-4 mb-3 shadow-sm">
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

                    {o.notes ? (
                      <View className="mt-3 bg-gray-50 rounded-xl p-3">
                        <Text className="text-gray-600">{String(o.notes)}</Text>
                      </View>
                    ) : null}

                    <View className="flex-row mt-3">
                      {ns ? (
                        <Pressable
                          onPress={() => advance(o)}
                          disabled={busy}
                          className={`flex-1 rounded-xl py-3 items-center flex-row justify-center ${busy ? 'bg-gray-200' : 'bg-forest-600'}`}
                        >
                          {busy ? <ActivityIndicator color="#1B4D3E" /> : <Check size={18} color="#fff" />}
                          <Text className={`font-bold ml-2 ${busy ? 'text-gray-500' : 'text-white'}`}>
                            {ns === 'accepted' ? 'Accept' : ns === 'ready' ? 'Mark ready' : 'Picked up'}
                          </Text>
                        </Pressable>
                      ) : null}
                      {o.status !== 'cancelled' && o.status !== 'picked_up' ? (
                        <Pressable
                          onPress={() => cancel(o)}
                          disabled={busy}
                          className={`ml-3 rounded-xl py-3 px-4 ${busy ? 'bg-gray-200' : 'bg-red-50'}`}
                        >
                          <Text className={`font-bold ${busy ? 'text-gray-500' : 'text-red-600'}`}>Cancel</Text>
                        </Pressable>
                      ) : null}
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

