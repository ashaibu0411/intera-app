import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Bell, Heart, MessageCircle, Calendar, AlertTriangle, Check } from 'lucide-react-native';
import Animated, { FadeIn, FadeInUp, FadeInRight } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { formatDistanceToNow } from 'date-fns';
import { MOCK_NOTIFICATIONS, type Notification } from '@/lib/store';

type NotificationFilter = 'all' | 'neighborhood' | 'activity' | 'alerts';

const FILTERS: { id: NotificationFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'neighborhood', label: 'Neighborhood' },
  { id: 'activity', label: 'My Activity' },
  { id: 'alerts', label: 'Alerts' },
];

function NotificationIcon({ type }: { type: Notification['type'] }) {
  switch (type) {
    case 'like':
      return <Heart size={16} color="#D4673A" fill="#D4673A" />;
    case 'comment':
      return <MessageCircle size={16} color="#1B4D3E" />;
    case 'event':
      return <Calendar size={16} color="#C9A227" />;
    case 'alert':
      return <AlertTriangle size={16} color="#EF4444" />;
    default:
      return <Bell size={16} color="#8B7355" />;
  }
}

function NotificationItem({ notification, index }: { notification: Notification; index: number }) {
  const timeAgo = formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true });

  return (
    <Animated.View
      entering={FadeInUp.duration(300).delay(index * 50)}
    >
      <Pressable
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
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);

  const handleFilterChange = (filter: NotificationFilter) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveFilter(filter);
  };

  const markAllRead = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const filteredNotifications = notifications.filter((n) => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'neighborhood') return n.type === 'event' || n.type === 'alert';
    if (activeFilter === 'activity') return n.type === 'like' || n.type === 'comment';
    if (activeFilter === 'alerts') return n.type === 'alert';
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <View className="flex-1 bg-cream">
      <SafeAreaView edges={['top']} className="flex-1">
        {/* Header */}
        <Animated.View entering={FadeIn.duration(300)} className="px-5 pt-4 pb-3">
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-row items-center">
              <Text className="text-2xl font-bold text-warmBrown">Notifications</Text>
              {unreadCount > 0 && (
                <View className="ml-2 bg-terracotta-500 rounded-full px-2.5 py-0.5">
                  <Text className="text-white text-xs font-bold">{unreadCount}</Text>
                </View>
              )}
            </View>

            {unreadCount > 0 && (
              <Pressable
                onPress={markAllRead}
                className="flex-row items-center bg-forest-50 rounded-full px-3 py-1.5"
              >
                <Check size={14} color="#1B4D3E" />
                <Text className="text-forest-700 text-sm font-medium ml-1">Mark all read</Text>
              </Pressable>
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
          {filteredNotifications.length > 0 ? (
            filteredNotifications.map((notification, index) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                index={index}
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
                We&apos;ll let you know when something happens
              </Text>
            </Animated.View>
          )}

          <View className="h-6" />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
