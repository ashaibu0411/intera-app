import React, { useMemo, useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Bell, Heart, MessageCircle, Calendar, AlertTriangle, Check, ArrowLeft, ShoppingBag } from 'lucide-react-native';
import Animated, { FadeIn, FadeInUp, FadeInRight } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { formatDistanceToNow } from 'date-fns';
import { router } from 'expo-router';
import { supabase, type DbNotification } from '@/lib/supabase';
import { useStore } from '@/lib/store';

type NotificationFilter = 'all' | 'neighborhood' | 'activity' | 'alerts';

type UiNotification = {
  id: string;
  type: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  avatar?: string | null;
  data?: Record<string, unknown>;
};

const FILTERS: { id: NotificationFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'neighborhood', label: 'Neighborhood' },
  { id: 'activity', label: 'My Activity' },
  { id: 'alerts', label: 'Alerts' },
];

function NotificationIcon({ type }: { type: string }) {
  const t = String(type || '');
  if (t.includes('message')) return <MessageCircle size={16} color="#1B4D3E" />;
  if (t.includes('comment')) return <MessageCircle size={16} color="#1B4D3E" />;
  if (t.includes('like')) return <Heart size={16} color="#D4673A" fill="#D4673A" />;
  if (t.includes('event')) return <Calendar size={16} color="#C9A227" />;
  if (t.includes('inventory')) return <ShoppingBag size={16} color="#C9A227" />;
  if (t.includes('order')) return <ShoppingBag size={16} color="#1B4D3E" />;
  if (t.includes('alert')) return <AlertTriangle size={16} color="#EF4444" />;
  return <Bell size={16} color="#8B7355" />;
}

function NotificationItem({ notification, index, onRead }: { notification: UiNotification; index: number; onRead: (id: string) => void }) {
  const timeAgo = formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true });

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onRead(notification.id);

    // Determine the route to navigate to
    const data: any = notification.data || {};
    const type = String(data?.type || notification.type || '');

    if (type === 'event' && data?.eventId) return router.push(`/event/${String(data.eventId)}` as any);
    if ((type === 'post' || type === 'new_post') && data?.postId) return router.push(`/post/${String(data.postId)}` as any);
    if (type === 'inventory_update' && data?.businessId) return router.push(`/business/${String(data.businessId)}` as any);
    if (type === 'business_order') {
      const role = String(data?.role || '');
      return router.push((role === 'owner' ? '/business-orders' : '/my-orders') as any);
    }
    if (type === 'connection_request') return router.push('/connect' as any);
    if (type === 'talk_request' && data?.requesterId) {
      return router.push({
        pathname: `/chat/${String(data.requesterId)}` as any,
        params: { recipientId: String(data.requesterId) },
      });
    }
    if (type === 'new_message') {
      const conversationId = data?.conversationId ? String(data.conversationId) : '';
      const senderId = data?.senderId ? String(data.senderId) : '';
      if (conversationId) {
        return router.push({
          pathname: `/chat/${conversationId}` as any,
          params: { recipientId: senderId || undefined },
        });
      }
      return router.push('/messages' as any);
    }

    return router.push('/(tabs)/community' as any);
  };

  return (
    <Animated.View
      entering={FadeInUp.duration(300).delay(index * 50)}
    >
      <Pressable
        onPress={handlePress}
        className={`flex-row items-start p-4 mx-4 mb-3 rounded-2xl ${
          notification.read ? 'bg-white' : 'bg-terracotta-50'
        } shadow-sm`}
      >
        <View className="relative">
          {notification.avatar ? (
            <Image
              source={{ uri: notification.avatar }}
              style={{ width: 48, height: 48, borderRadius: 24 }}
              contentFit="cover"
            />
          ) : (
            <View className="w-12 h-12 rounded-full bg-terracotta-100 items-center justify-center">
              <NotificationIcon type={notification.type} />
            </View>
          )}
          <View className="absolute -bottom-1 -right-1 bg-white rounded-full p-1">
            <NotificationIcon type={notification.type} />
          </View>
        </View>

        <View className="flex-1 ml-3">
          <Text className="text-warmBrown font-semibold">{notification.title}</Text>
          <Text className="text-gray-600 text-sm mt-0.5" numberOfLines={2}>
            {notification.message}
          </Text>
          <Text className="text-gray-400 text-xs mt-1">{timeAgo}</Text>
        </View>

        {!notification.read && (
          <View className="w-2.5 h-2.5 rounded-full bg-terracotta-500 mt-1" />
        )}
      </Pressable>
    </Animated.View>
  );
}

export default function NotificationsScreen() {
  const [activeFilter, setActiveFilter] = useState<NotificationFilter>('all');
  const currentUser = useStore((s) => s.currentUser);
  const isGuest = useStore((s) => s.isGuest);
  const [notifications, setNotifications] = useState<UiNotification[]>([]);
  const [loading, setLoading] = useState(true);

  const handleFilterChange = (filter: NotificationFilter) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveFilter(filter);
  };

  const loadNotifications = useCallback(async () => {
    if (isGuest || !currentUser?.id) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const { data, error } = await supabase
      .from('notifications')
      .select('id, type, title, body, data, created_at, read_at')
      .eq('recipient_id', currentUser.id)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      console.log('[Notifications] load error:', error);
      setNotifications([]);
      setLoading(false);
      return;
    }

    const mapped: UiNotification[] = (data || []).map((n: any) => ({
      id: n.id,
      type: n.type,
      title: n.title,
      message: n.body,
      timestamp: n.created_at,
      read: !!n.read_at,
      data: n.data || {},
      avatar: null,
    }));
    setNotifications(mapped);
    setLoading(false);
  }, [currentUser?.id, isGuest]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  useEffect(() => {
    if (isGuest || !currentUser?.id) return;
    const channel = supabase.channel(`notifications:${currentUser.id}`);
    channel.on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'notifications', filter: `recipient_id=eq.${currentUser.id}` },
      () => loadNotifications()
    );
    channel.subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser?.id, isGuest, loadNotifications]);

  const markAllRead = async () => {
    if (!currentUser?.id) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('recipient_id', currentUser.id)
      .is('read_at', null);
    loadNotifications();
  };

  const clearNotifications = async () => {
    if (!currentUser?.id) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await supabase.from('notifications').delete().eq('recipient_id', currentUser.id);
    loadNotifications();
  };

  const markOneRead = async (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    await supabase.from('notifications').update({ read_at: new Date().toISOString() }).eq('id', id);
  };

  const filteredNotifications = useMemo(() => notifications.filter((n) => {
    if (activeFilter === 'all') return true;
    const t = String(n.type || '');
    if (activeFilter === 'neighborhood') return t.includes('event') || t.includes('new_post') || t.includes('inventory');
    if (activeFilter === 'activity') return t.includes('like') || t.includes('comment') || t.includes('message');
    if (activeFilter === 'alerts') return t.includes('alert') || t.includes('order');
    return true;
  }), [notifications, activeFilter]);

  const unreadCount = useMemo(() => notifications.filter((n) => !n.read).length, [notifications]);

  // Clear the badge count as soon as user opens Notifications
  useEffect(() => {
    // no-op: we keep server read state
  }, [unreadCount]);

  return (
    <View className="flex-1 bg-cream">
      <SafeAreaView edges={['top']} className="flex-1">
        {/* Header */}
        <Animated.View entering={FadeIn.duration(300)} className="px-5 pt-4 pb-3">
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-row items-center">
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.back();
                }}
                className="mr-3 p-1"
                hitSlop={8}
              >
                <ArrowLeft size={24} color="#2D1F1A" />
              </Pressable>
              <Text className="text-2xl font-bold text-warmBrown">Notifications</Text>
              {unreadCount > 0 && (
                <View className="ml-2 bg-terracotta-500 rounded-full px-2.5 py-0.5">
                  <Text className="text-white text-xs font-bold">{unreadCount}</Text>
                </View>
              )}
            </View>

            {unreadCount > 0 && (
              <View className="flex-row items-center">
                <Pressable
                  onPress={markAllRead}
                  className="flex-row items-center bg-forest-50 rounded-full px-3 py-1.5 mr-2"
                >
                  <Check size={14} color="#1B4D3E" />
                  <Text className="text-forest-700 text-sm font-medium ml-1">Mark all read</Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    clearNotifications();
                  }}
                  className="flex-row items-center bg-white rounded-full px-3 py-1.5 border border-gray-200"
                >
                  <Text className="text-gray-700 text-sm font-medium">Clear</Text>
                </Pressable>
              </View>
            )}
          </View>

          {/* Filter Tabs */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ flexGrow: 0 }}
          >
            {FILTERS.map((filter, index) => (
              <Animated.View
                key={filter.id}
                entering={FadeInRight.duration(300).delay(index * 50)}
              >
                <Pressable
                  onPress={() => handleFilterChange(filter.id)}
                  className={`px-4 py-2 rounded-full mr-2 ${
                    activeFilter === filter.id
                      ? 'bg-terracotta-500'
                      : 'bg-white'
                  }`}
                >
                  <Text
                    className={`font-medium ${
                      activeFilter === filter.id ? 'text-white' : 'text-gray-600'
                    }`}
                  >
                    {filter.label}
                  </Text>
                </Pressable>
              </Animated.View>
            ))}
          </ScrollView>
        </Animated.View>

        {/* Notifications List */}
        <ScrollView className="flex-1 pt-2" showsVerticalScrollIndicator={false}>
          {loading ? (
            <View className="items-center py-16">
              <ActivityIndicator size="large" color="#D4673A" />
              <Text className="text-gray-500 mt-3">Loading notifications…</Text>
            </View>
          ) : filteredNotifications.length > 0 ? (
            filteredNotifications.map((notification, index) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                index={index}
                onRead={markOneRead}
              />
            ))
          ) : (
            <Animated.View
              entering={FadeInUp.duration(400)}
              className="items-center justify-center py-20"
            >
              <View className="bg-gray-100 rounded-full p-6 mb-4">
                <Bell size={32} color="#9CA3AF" />
              </View>
              <Text className="text-gray-500 text-lg">No notifications yet</Text>
              <Text className="text-gray-400 text-sm mt-1">
                {isGuest ? 'Sign in to see alerts and message notifications.' : 'We’ll let you know when something happens.'}
              </Text>
              {isGuest && (
                <Pressable
                  onPress={() => router.push('/signup')}
                  className="bg-forest-600 rounded-full px-5 py-3 mt-5"
                >
                  <Text className="text-white font-semibold">Sign in</Text>
                </Pressable>
              )}
            </Animated.View>
          )}

          <View className="h-6" />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
