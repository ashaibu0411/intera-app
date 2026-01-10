import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeIn,
  FadeInRight,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import {
  Users,
  MapPin,
  Home,
  Briefcase,
  GraduationCap,
  Church,
  Sparkles,
  ChevronRight,
  Radio,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useStore } from '@/lib/store';

interface ActiveMember {
  id: string;
  name: string;
  avatar: string;
  role: string;
  country: string;
  isOnline: boolean;
  lastActivity?: string;
}

interface PresenceEvent {
  id: string;
  type: 'joined' | 'arrived' | 'helping' | 'posting' | 'event';
  user?: ActiveMember;
  text: string;
  timestamp: Date;
}

// Mock active members - in production this would come from real-time presence
const MOCK_ACTIVE_MEMBERS: ActiveMember[] = [
  { id: '1', name: 'Ama Asante', avatar: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=100&h=100&fit=crop&crop=face', role: 'Welcomer', country: 'Ghana', isOnline: true },
  { id: '2', name: 'Kofi Mensah', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face', role: 'Mentor', country: 'Ghana', isOnline: true },
  { id: '3', name: 'Fatou Diallo', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face', role: 'Business Builder', country: 'Senegal', isOnline: true },
  { id: '4', name: 'Chidi Okonkwo', avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop&crop=face', role: 'Connector', country: 'Nigeria', isOnline: true },
  { id: '5', name: 'Amara Johnson', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face', role: 'Organizer', country: 'USA', isOnline: true, lastActivity: '2m ago' },
];

// Generate presence events
const generatePresenceEvents = (city: string): PresenceEvent[] => [
  { id: '1', type: 'arrived', text: `A new family arrived in ${city}`, timestamp: new Date(Date.now() - 1000 * 60 * 5) },
  { id: '2', type: 'helping', user: MOCK_ACTIVE_MEMBERS[0], text: 'Ama is helping a newcomer find housing', timestamp: new Date(Date.now() - 1000 * 60 * 12) },
  { id: '3', type: 'event', text: 'Community dinner starting in 2 hours', timestamp: new Date(Date.now() - 1000 * 60 * 30) },
  { id: '4', type: 'joined', user: MOCK_ACTIVE_MEMBERS[3], text: 'Chidi just joined the community', timestamp: new Date(Date.now() - 1000 * 60 * 45) },
  { id: '5', type: 'posting', user: MOCK_ACTIVE_MEMBERS[2], text: 'Fatou shared a job opportunity', timestamp: new Date(Date.now() - 1000 * 60 * 60) },
];

interface CommunityPresenceProps {
  city: string;
  memberCount: number;
}

export function CommunityPresence({ city, memberCount }: CommunityPresenceProps) {
  const [activeCount, setActiveCount] = useState(47);
  const [presenceEvents, setPresenceEvents] = useState<PresenceEvent[]>([]);
  const pulseScale = useSharedValue(1);

  useEffect(() => {
    // Simulate real-time presence updates
    setPresenceEvents(generatePresenceEvents(city));
    setActiveCount(Math.floor(Math.random() * 30) + 30);

    // Pulse animation for "live" indicator
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.2, { duration: 1000 }),
        withTiming(1, { duration: 1000 })
      ),
      -1,
      true
    );
  }, [city]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const handleViewMembers = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/find-helpers');
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'Welcomer': return '#EC4899';
      case 'Connector': return '#8B5CF6';
      case 'Organizer': return '#F59E0B';
      case 'Fixer': return '#10B981';
      case 'Mentor': return '#3B82F6';
      case 'Business Builder': return '#EF4444';
      default: return '#6B7280';
    }
  };

  return (
    <Animated.View
      entering={FadeIn.duration(400)}
      className="mx-4 mt-4"
    >
      {/* Main Presence Card */}
      <View className="bg-gray-50 rounded-2xl overflow-hidden">
        {/* Header - Who's Here */}
        <View className="p-4 pb-3">
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-row items-center">
              <Animated.View style={pulseStyle}>
                <View className="w-2.5 h-2.5 rounded-full bg-green-500 mr-2" />
              </Animated.View>
              <Text className="text-lg font-bold text-gray-900">
                {activeCount} people here now
              </Text>
            </View>
            <View className="bg-gray-200 px-2.5 py-1 rounded-full">
              <Text className="text-xs font-medium text-gray-600">
                {memberCount.toLocaleString()} total
              </Text>
            </View>
          </View>

          {/* Active Avatars Row */}
          <Pressable onPress={handleViewMembers}>
            <View className="flex-row items-center">
              <View className="flex-row">
                {MOCK_ACTIVE_MEMBERS.slice(0, 5).map((member, index) => (
                  <Animated.View
                    key={member.id}
                    entering={FadeInRight.duration(300).delay(index * 50)}
                    style={{ marginLeft: index > 0 ? -12 : 0, zIndex: 5 - index }}
                  >
                    <View
                      className="relative"
                      style={{
                        borderWidth: 2,
                        borderColor: '#F9FAFB',
                        borderRadius: 20,
                      }}
                    >
                      <Image
                        source={{ uri: member.avatar }}
                        style={{ width: 36, height: 36, borderRadius: 18 }}
                      />
                      {member.isOnline && (
                        <View
                          className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-gray-50"
                          style={{ backgroundColor: getRoleColor(member.role) }}
                        />
                      )}
                    </View>
                  </Animated.View>
                ))}
              </View>
              <View className="ml-3 flex-1">
                <Text className="text-sm text-gray-600">
                  <Text className="font-semibold text-gray-900">Ama</Text>, <Text className="font-semibold text-gray-900">Kofi</Text> and {activeCount - 2} others
                </Text>
                <Text className="text-xs text-gray-400 mt-0.5">Tap to see who's here</Text>
              </View>
              <ChevronRight size={18} color="#9CA3AF" />
            </View>
          </Pressable>
        </View>

        {/* Live Activity Feed */}
        <View className="border-t border-gray-200 bg-white">
          <View className="px-4 py-2 flex-row items-center border-b border-gray-100">
            <Radio size={14} color="#EF4444" />
            <Text className="text-xs font-semibold text-gray-500 ml-1.5 uppercase tracking-wide">Live Activity</Text>
          </View>

          <View className="py-2">
            {presenceEvents.slice(0, 3).map((event, index) => (
              <Animated.View
                key={event.id}
                entering={FadeInRight.duration(300).delay(index * 100)}
              >
                <Pressable
                  className="flex-row items-center px-4 py-2"
                  onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
                >
                  <View className="w-8 h-8 rounded-full bg-gray-100 items-center justify-center">
                    {event.type === 'arrived' && <Home size={16} color="#10B981" />}
                    {event.type === 'helping' && <Users size={16} color="#EC4899" />}
                    {event.type === 'event' && <Sparkles size={16} color="#F59E0B" />}
                    {event.type === 'joined' && <MapPin size={16} color="#8B5CF6" />}
                    {event.type === 'posting' && <Briefcase size={16} color="#3B82F6" />}
                  </View>
                  <Text className="flex-1 text-sm text-gray-700 ml-3" numberOfLines={1}>
                    {event.text}
                  </Text>
                  <Text className="text-xs text-gray-400 ml-2">
                    {getTimeAgo(event.timestamp)}
                  </Text>
                </Pressable>
              </Animated.View>
            ))}
          </View>
        </View>
      </View>
    </Animated.View>
  );
}

function getTimeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  if (seconds < 60) return 'now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}
