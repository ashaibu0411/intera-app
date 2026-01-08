import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Heart,
  Link2,
  CalendarDays,
  Wrench,
  BookOpen,
  GraduationCap,
  Store,
} from 'lucide-react-native';
import type { CommunityRole, CommunityRoleInfo } from '@/lib/store';

interface RoleBadgeProps {
  role: CommunityRole;
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
  helpedCount?: number;
  onPress?: () => void;
}

const ROLE_CONFIG: Record<
  CommunityRole,
  {
    label: string;
    shortLabel: string;
    icon: typeof Heart;
    colors: [string, string];
    description: string;
  }
> = {
  welcomer: {
    label: 'Welcomer',
    shortLabel: 'Welcome',
    icon: Heart,
    colors: ['#EC4899', '#DB2777'],
    description: 'Helps newcomers settle in',
  },
  connector: {
    label: 'Connector',
    shortLabel: 'Connect',
    icon: Link2,
    colors: ['#8B5CF6', '#7C3AED'],
    description: 'Introduces people to each other',
  },
  organizer: {
    label: 'Organizer',
    shortLabel: 'Events',
    icon: CalendarDays,
    colors: ['#F59E0B', '#D97706'],
    description: 'Hosts events and gatherings',
  },
  fixer: {
    label: 'Fixer',
    shortLabel: 'Helper',
    icon: Wrench,
    colors: ['#10B981', '#059669'],
    description: 'Provides practical help',
  },
  story_keeper: {
    label: 'Story Keeper',
    shortLabel: 'Stories',
    icon: BookOpen,
    colors: ['#6366F1', '#4F46E5'],
    description: 'Preserves community history',
  },
  mentor: {
    label: 'Mentor',
    shortLabel: 'Mentor',
    icon: GraduationCap,
    colors: ['#0EA5E9', '#0284C7'],
    description: 'Guides career and life decisions',
  },
  business_builder: {
    label: 'Business Builder',
    shortLabel: 'Business',
    icon: Store,
    colors: ['#EF4444', '#DC2626'],
    description: 'Supports local businesses',
  },
};

export function RoleBadge({
  role,
  size = 'medium',
  showLabel = true,
  helpedCount,
  onPress,
}: RoleBadgeProps) {
  const config = ROLE_CONFIG[role];
  const Icon = config.icon;

  const sizeStyles = {
    small: { iconSize: 10, padding: 4, fontSize: 10 },
    medium: { iconSize: 14, padding: 6, fontSize: 12 },
    large: { iconSize: 18, padding: 8, fontSize: 14 },
  };

  const styles = sizeStyles[size];

  const content = (
    <LinearGradient
      colors={config.colors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 999,
        paddingHorizontal: styles.padding * 1.5,
        paddingVertical: styles.padding,
      }}
    >
      <Icon size={styles.iconSize} color="#FFFFFF" />
      {showLabel && (
        <Text
          style={{
            color: '#FFFFFF',
            fontSize: styles.fontSize,
            fontWeight: '600',
            marginLeft: 4,
          }}
        >
          {size === 'small' ? config.shortLabel : config.label}
        </Text>
      )}
      {helpedCount !== undefined && helpedCount > 0 && (
        <View
          style={{
            backgroundColor: 'rgba(255,255,255,0.3)',
            borderRadius: 999,
            paddingHorizontal: 6,
            paddingVertical: 2,
            marginLeft: 6,
          }}
        >
          <Text
            style={{
              color: '#FFFFFF',
              fontSize: styles.fontSize - 2,
              fontWeight: '700',
            }}
          >
            {helpedCount}
          </Text>
        </View>
      )}
    </LinearGradient>
  );

  if (onPress) {
    return <Pressable onPress={onPress}>{content}</Pressable>;
  }

  return content;
}

// Component to display multiple role badges
interface RoleBadgesProps {
  roles: CommunityRoleInfo[];
  maxDisplay?: number;
  size?: 'small' | 'medium' | 'large';
}

export function RoleBadges({ roles, maxDisplay = 3, size = 'small' }: RoleBadgesProps) {
  const displayRoles = roles.slice(0, maxDisplay);
  const remaining = roles.length - maxDisplay;

  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
      {displayRoles.map((roleInfo) => (
        <RoleBadge
          key={roleInfo.role}
          role={roleInfo.role}
          size={size}
          helpedCount={roleInfo.helpedCount}
        />
      ))}
      {remaining > 0 && (
        <View
          style={{
            backgroundColor: '#E5E7EB',
            borderRadius: 999,
            paddingHorizontal: 8,
            paddingVertical: 4,
          }}
        >
          <Text style={{ color: '#6B7280', fontSize: 10, fontWeight: '600' }}>
            +{remaining} more
          </Text>
        </View>
      )}
    </View>
  );
}

// Helper badge for people willing to help newcomers
interface HelperBadgeProps {
  skills?: string[];
  size?: 'small' | 'medium';
}

export function HelperBadge({ skills, size = 'medium' }: HelperBadgeProps) {
  const iconSize = size === 'small' ? 12 : 16;
  const fontSize = size === 'small' ? 10 : 12;
  const padding = size === 'small' ? 4 : 6;

  return (
    <LinearGradient
      colors={['#10B981', '#059669']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 999,
        paddingHorizontal: padding * 2,
        paddingVertical: padding,
      }}
    >
      <Heart size={iconSize} color="#FFFFFF" fill="#FFFFFF" />
      <Text
        style={{
          color: '#FFFFFF',
          fontSize,
          fontWeight: '600',
          marginLeft: 4,
        }}
      >
        Here to Help
      </Text>
    </LinearGradient>
  );
}

// New Arrival badge
interface NewArrivalBadgeProps {
  city?: string;
  daysRemaining?: number;
  size?: 'small' | 'medium';
}

export function NewArrivalBadge({ city, daysRemaining, size = 'medium' }: NewArrivalBadgeProps) {
  const iconSize = size === 'small' ? 12 : 16;
  const fontSize = size === 'small' ? 10 : 12;
  const padding = size === 'small' ? 4 : 6;

  return (
    <LinearGradient
      colors={['#F59E0B', '#D97706']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 999,
        paddingHorizontal: padding * 2,
        paddingVertical: padding,
      }}
    >
      <Text style={{ fontSize: iconSize }}>🌟</Text>
      <Text
        style={{
          color: '#FFFFFF',
          fontSize,
          fontWeight: '600',
          marginLeft: 4,
        }}
      >
        New Arrival
      </Text>
      {daysRemaining && daysRemaining > 0 && (
        <View
          style={{
            backgroundColor: 'rgba(255,255,255,0.3)',
            borderRadius: 999,
            paddingHorizontal: 6,
            paddingVertical: 2,
            marginLeft: 6,
          }}
        >
          <Text
            style={{
              color: '#FFFFFF',
              fontSize: fontSize - 2,
              fontWeight: '700',
            }}
          >
            {daysRemaining}d
          </Text>
        </View>
      )}
    </LinearGradient>
  );
}
