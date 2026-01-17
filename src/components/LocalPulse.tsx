import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, Pressable } from 'react-native';
import Animated, {
  FadeIn,
  SlideInRight,
} from 'react-native-reanimated';
import {
  Zap,
  Utensils,
  Briefcase,
  Car,
  HelpCircle,
  Home,
  Heart,
  ChevronRight,
  MapPin,
  Globe,
  Users,
  Calendar,
  Plane,
  Building2,
  AlertTriangle,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useStore } from '@/lib/store';
import { getIncidents, getUtilityReports } from '@/lib/marketplace-api';

interface PulseItem {
  id: string;
  type: 'alert' | 'event' | 'job' | 'offer' | 'request' | 'housing' | 'food';
  title: string;
  subtitle?: string;
  timeAgo: string;
  urgent?: boolean;
  responseCount?: number;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  route: string;
}

// LOCAL pulse items (city-specific)
const generateLocalPulseItems = (city: string): PulseItem[] => [
  {
    id: '1',
    type: 'event',
    title: 'Community dinner tonight',
    subtitle: '7:00 PM · Downtown Community Center',
    timeAgo: '2h',
    icon: <Utensils size={18} color="#F59E0B" />,
    color: '#F59E0B',
    bgColor: '#FEF3C7',
    responseCount: 23,
    route: '/events',
  },
  {
    id: '2',
    type: 'job',
    title: 'Job opportunity posted',
    subtitle: 'Software Developer · Remote friendly',
    timeAgo: '3h',
    icon: <Briefcase size={18} color="#3B82F6" />,
    color: '#3B82F6',
    bgColor: '#DBEAFE',
    responseCount: 8,
    route: '/job-board',
  },
  {
    id: '3',
    type: 'offer',
    title: '3 people offering rides to airport',
    subtitle: 'Tomorrow morning · Free',
    timeAgo: '4h',
    icon: <Car size={18} color="#10B981" />,
    color: '#10B981',
    bgColor: '#D1FAE5',
    route: '/carpool',
  },
  {
    id: '4',
    type: 'request',
    title: 'Someone needs help moving',
    subtitle: '2.3 miles away · This Saturday',
    timeAgo: '5h',
    icon: <HelpCircle size={18} color="#8B5CF6" />,
    color: '#8B5CF6',
    bgColor: '#EDE9FE',
    urgent: true,
    route: '/find-helpers',
  },
  {
    id: '5',
    type: 'housing',
    title: 'Room available for newcomer',
    subtitle: '$650/mo · Near downtown',
    timeAgo: '6h',
    icon: <Home size={18} color="#EC4899" />,
    color: '#EC4899',
    bgColor: '#FCE7F3',
    route: '/housing-board',
  },
  {
    id: '6',
    type: 'food',
    title: 'Free community lunch',
    subtitle: 'Ethiopian cuisine · 12:00 PM',
    timeAgo: '8h',
    icon: <Heart size={18} color="#EF4444" />,
    color: '#EF4444',
    bgColor: '#FEE2E2',
    responseCount: 15,
    route: '/events',
  },
];

// GLOBAL pulse items (worldwide happenings)
const generateGlobalPulseItems = (): PulseItem[] => [
  {
    id: 'g1',
    type: 'event',
    title: 'African Tech Summit in London',
    subtitle: '2,500+ attending · Next week',
    timeAgo: '1h',
    icon: <Building2 size={18} color="#3B82F6" />,
    color: '#3B82F6',
    bgColor: '#DBEAFE',
    responseCount: 342,
    route: '/events',
  },
  {
    id: 'g2',
    type: 'job',
    title: '47 remote jobs posted today',
    subtitle: 'Tech, Finance, Healthcare',
    timeAgo: '2h',
    icon: <Briefcase size={18} color="#10B981" />,
    color: '#10B981',
    bgColor: '#D1FAE5',
    responseCount: 89,
    route: '/job-board',
  },
  {
    id: 'g3',
    type: 'housing',
    title: 'Housing guide: Moving to Toronto',
    subtitle: 'New arrival resources',
    timeAgo: '4h',
    icon: <Plane size={18} color="#8B5CF6" />,
    color: '#8B5CF6',
    bgColor: '#EDE9FE',
    route: '/housing-board',
  },
  {
    id: 'g4',
    type: 'event',
    title: 'Cultural festival in New York',
    subtitle: 'This weekend · Free entry',
    timeAgo: '5h',
    icon: <Calendar size={18} color="#F59E0B" />,
    color: '#F59E0B',
    bgColor: '#FEF3C7',
    responseCount: 156,
    route: '/events',
  },
  {
    id: 'g5',
    type: 'offer',
    title: '12 diaspora circles active now',
    subtitle: 'Join conversations worldwide',
    timeAgo: '6h',
    icon: <Users size={18} color="#EC4899" />,
    color: '#EC4899',
    bgColor: '#FCE7F3',
    responseCount: 78,
    route: '/diaspora-circles',
  },
  {
    id: 'g6',
    type: 'food',
    title: 'Home cooks in 15 cities',
    subtitle: 'Order authentic diaspora cuisine',
    timeAgo: '8h',
    icon: <Utensils size={18} color="#EF4444" />,
    color: '#EF4444',
    bgColor: '#FEE2E2',
    route: '/african-food',
  },
];

interface LocalPulseProps {
  city: string;
  isGlobal?: boolean;
}

export function LocalPulse({ city, isGlobal = false }: LocalPulseProps) {
  const [pulseItems, setPulseItems] = useState<PulseItem[]>([]);
  const [expanded, setExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const selectedLocation = useStore((s) => s.selectedLocation);
  const feedFilter = useStore((s) => s.feedFilter);

  const neighborhood = selectedLocation?.neighborhood?.trim();
  const mode = isGlobal ? 'global' : feedFilter; // 'neighborhood' | 'city' | 'global'

  const headerLocationLabel = useMemo(() => {
    if (mode === 'global') return 'Worldwide';
    if (mode === 'neighborhood') return neighborhood ? `${neighborhood}, ${city}` : city;
    return city;
  }, [mode, neighborhood, city]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (mode === 'global') {
        setPulseItems(generateGlobalPulseItems());
        return;
      }

      setIsLoading(true);
      try {
        const [incidents, utilities] = await Promise.all([
          getIncidents(25),
          getUtilityReports(40),
        ]);

        const cityLower = city.toLowerCase();
        const neighborhoodLower = (neighborhood || '').toLowerCase();

        const matchesArea = (label: string, rowCity?: string | null, rowNeighborhood?: string | null) => {
          const blob = `${label || ''} ${rowCity || ''} ${rowNeighborhood || ''}`.toLowerCase();
          const cityMatch = blob.includes(cityLower);
          if (mode === 'city') return cityMatch;
          // neighborhood mode includes neighborhood + city
          if (!neighborhoodLower) return cityMatch;
          return blob.includes(neighborhoodLower) || cityMatch;
        };

        const activeIncidents = incidents
          .filter((i) => i.status === 'active')
          .filter((i) => matchesArea(i.location_label, i.city, i.neighborhood))
          .slice(0, 3);

        const latestUtilityByType = new Map<string, (typeof utilities)[number]>();
        for (const u of utilities) {
          if (!matchesArea(u.location_label, u.city, u.neighborhood)) continue;
          const existing = latestUtilityByType.get(u.utility);
          if (!existing || new Date(u.created_at).getTime() > new Date(existing.created_at).getTime()) {
            latestUtilityByType.set(u.utility, u);
          }
        }

        const utilityItems: PulseItem[] = Array.from(latestUtilityByType.values()).map((u) => {
          const isOutage = u.state === 'outage';
          const iconNode =
            u.utility === 'power' ? <Zap size={18} color={isOutage ? '#EF4444' : '#10B981'} /> :
            u.utility === 'water' ? <Heart size={18} color={isOutage ? '#EF4444' : '#10B981'} /> :
            u.utility === 'internet' ? <Globe size={18} color={isOutage ? '#EF4444' : '#10B981'} /> :
            <Home size={18} color={isOutage ? '#EF4444' : '#10B981'} />;

          const title =
            u.utility === 'power' ? 'Power' :
            u.utility === 'water' ? 'Water' :
            u.utility === 'internet' ? 'Internet' : 'Road';

          return {
            id: `util_${u.id}`,
            type: 'alert',
            title: `${title}: ${u.state === 'outage' ? 'outage' : u.state === 'restored' ? 'restored' : 'degraded'}`,
            subtitle: u.note || u.location_label,
            timeAgo: 'now',
            urgent: u.state === 'outage',
            icon: iconNode,
            color: u.state === 'outage' ? '#EF4444' : '#10B981',
            bgColor: u.state === 'outage' ? '#FEE2E2' : '#D1FAE5',
            route: '/utility-status',
          };
        });

        const incidentItems: PulseItem[] = activeIncidents.map((i) => ({
          id: `inc_${i.id}`,
          type: 'alert',
          title: i.title,
          subtitle: i.location_label,
          timeAgo: 'now',
          urgent: true,
          icon: <AlertTriangle size={18} color="#EF4444" />,
          color: '#EF4444',
          bgColor: '#FEE2E2',
          route: '/safety-alerts',
        }));

        const combined = [
          ...incidentItems,
          ...utilityItems,
          ...generateLocalPulseItems(city),
        ];

        if (!cancelled) setPulseItems(combined.slice(0, 8));
      } catch {
        // Fallback to mock pulse if Supabase fails
        if (!cancelled) setPulseItems(generateLocalPulseItems(city));
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [city, mode, neighborhood]);

  const displayItems = expanded ? pulseItems : pulseItems.slice(0, 4);

  const handleItemPress = (item: PulseItem) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(item.route as any);
  };

  const getActionLabel = (type: PulseItem['type']) => {
    switch (type) {
      case 'event':
        return 'Join';
      case 'request':
        return 'Offer help';
      case 'job':
        return 'View';
      case 'housing':
        return 'Message host';
      case 'offer':
        return 'Join';
      case 'food':
        return 'Go';
      case 'alert':
      default:
        return 'Open';
    }
  };

  return (
    <Animated.View
      entering={FadeIn.duration(400).delay(100)}
      className="mx-4 mt-4"
    >
      {/* Section Header */}
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center">
          <View className="w-9 h-9 rounded-full bg-amber-100 items-center justify-center mr-2">
            {isGlobal ? <Globe size={20} color="#F59E0B" /> : <Zap size={20} color="#F59E0B" />}
          </View>
          <View>
            <Text className="text-lg font-bold text-gray-900">
              {mode === 'global' ? 'Plans worldwide' : 'Local pulse'}
            </Text>
            <Text className="text-sm text-gray-500">
              {mode === 'global' ? 'Across the diaspora' : (isLoading ? 'Updating now…' : 'Safety, utilities, and plans')}
            </Text>
          </View>
        </View>
        {mode !== 'global' && (
          <View className="flex-row items-center">
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push('/safety-alerts' as any);
              }}
              className="bg-red-50 border border-red-100 rounded-full px-3 py-1.5 flex-row items-center mr-2"
            >
              <AlertTriangle size={14} color="#EF4444" />
              <Text className="text-red-600 font-semibold text-sm ml-2">Alerts</Text>
            </Pressable>
            <View className="flex-row items-center">
              <MapPin size={14} color="#9CA3AF" />
              <Text className="text-sm text-gray-400 ml-1">{headerLocationLabel}</Text>
            </View>
          </View>
        )}
      </View>

      {/* Pulse Items */}
      <View className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {displayItems.map((item, index) => (
          <Animated.View
            key={item.id}
            entering={SlideInRight.duration(300).delay(index * 50)}
          >
            <Pressable
              onPress={() => handleItemPress(item)}
              className={`flex-row items-center p-4 ${
                index < displayItems.length - 1 ? 'border-b border-gray-50' : ''
              }`}
              style={({ pressed }) => ({
                backgroundColor: pressed ? '#F9FAFB' : 'white',
              })}
            >
              {/* Icon */}
              <View
                className="w-11 h-11 rounded-xl items-center justify-center"
                style={{ backgroundColor: item.bgColor }}
              >
                {item.icon}
              </View>

              {/* Content */}
              <View className="flex-1 ml-3">
                <View className="flex-row items-center">
                  <Text className="text-base font-semibold text-gray-900 flex-1" numberOfLines={1}>
                    {item.title}
                  </Text>
                  {item.urgent && (
                    <View className="bg-red-100 px-2 py-0.5 rounded-full ml-2">
                      <Text className="text-xs font-medium text-red-600">Urgent</Text>
                    </View>
                  )}
                </View>
                {item.subtitle && (
                  <Text className="text-sm text-gray-500 mt-0.5" numberOfLines={1}>
                    {item.subtitle}
                  </Text>
                )}
              </View>

              {/* Meta */}
              <View className="items-end ml-2">
                <Text className="text-sm text-gray-400">{item.timeAgo}</Text>
                {item.responseCount && (
                  <Text className="text-sm text-gray-400 mt-0.5">
                    {item.responseCount} interested
                  </Text>
                )}
                <View className="mt-1 px-2 py-0.5 rounded-full bg-gray-100">
                  <Text className="text-xs font-medium text-gray-600">{getActionLabel(item.type)}</Text>
                </View>
              </View>

              <ChevronRight size={18} color="#D1D5DB" style={{ marginLeft: 4 }} />
            </Pressable>
          </Animated.View>
        ))}

        {/* See More / Less */}
        {pulseItems.length > 4 && (
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setExpanded(!expanded);
            }}
            className="flex-row items-center justify-center py-3 border-t border-gray-100"
          >
            <Text className="text-sm font-medium text-gray-600">
              {expanded ? 'Show less' : `See ${pulseItems.length - 4} more`}
            </Text>
            <ChevronRight
              size={16}
              color="#6B7280"
              style={{ transform: [{ rotate: expanded ? '-90deg' : '90deg' }] }}
            />
          </Pressable>
        )}
      </View>
    </Animated.View>
  );
}
