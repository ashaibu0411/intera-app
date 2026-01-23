import React from 'react';
import { View, Text } from 'react-native';
import { Clock, Palmtree, Calendar, Ban } from 'lucide-react-native';
import { BusinessStatusInfo } from '@/lib/business-status';

interface BusinessStatusBadgeProps {
  status: BusinessStatusInfo;
  size?: 'sm' | 'md' | 'lg';
  showMessage?: boolean;
}

export function BusinessStatusBadge({ status, size = 'sm', showMessage = false }: BusinessStatusBadgeProps) {
  const getIcon = () => {
    const iconSize = size === 'lg' ? 14 : size === 'md' ? 12 : 10;
    const iconColor = status.color;

    switch (status.status) {
      case 'vacation':
        return <Palmtree size={iconSize} color={iconColor} />;
      case 'temporarily_closed':
        return <Ban size={iconSize} color={iconColor} />;
      case 'by_appointment':
        return <Calendar size={iconSize} color={iconColor} />;
      default:
        return <Clock size={iconSize} color={iconColor} />;
    }
  };

  const getPadding = () => {
    switch (size) {
      case 'lg':
        return 'px-3 py-1.5';
      case 'md':
        return 'px-2.5 py-1';
      default:
        return 'px-2 py-0.5';
    }
  };

  const getTextSize = () => {
    switch (size) {
      case 'lg':
        return 'text-sm';
      case 'md':
        return 'text-xs';
      default:
        return 'text-[10px]';
    }
  };

  return (
    <View className="flex-row items-center">
      <View
        className={`flex-row items-center rounded-full ${getPadding()}`}
        style={{ backgroundColor: status.bgColor }}
      >
        {getIcon()}
        <Text
          className={`font-semibold ml-1 ${getTextSize()}`}
          style={{ color: status.color }}
        >
          {status.label}
        </Text>
      </View>
      {showMessage && status.message && (
        <Text className="text-gray-500 text-xs ml-2">{status.message}</Text>
      )}
    </View>
  );
}

interface SimpleStatusDotProps {
  isOpen: boolean;
}

export function SimpleStatusDot({ isOpen }: SimpleStatusDotProps) {
  return (
    <View
      className="w-2 h-2 rounded-full"
      style={{ backgroundColor: isOpen ? '#10B981' : '#EF4444' }}
    />
  );
}
