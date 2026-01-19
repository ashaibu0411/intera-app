import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Shield, Star, Award, CheckCircle, BadgeCheck } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { getVerificationLevelColor, getScoreColor } from '@/lib/trust-api';

interface TrustScoreBadgeProps {
  score: number;
  verificationLevel: 'unverified' | 'basic' | 'verified' | 'trusted' | 'community_leader';
  reviewCount: number;
  avgRating: number;
  confirmationCount?: number;
  userId?: string;
  compact?: boolean;
  showDetails?: boolean;
}

const LEVEL_INFO = {
  unverified: { name: 'Unverified', icon: Shield },
  basic: { name: 'Member', icon: Shield },
  verified: { name: 'Verified', icon: CheckCircle },
  trusted: { name: 'Trusted', icon: Award },
  community_leader: { name: 'Leader', icon: BadgeCheck },
};

export function TrustScoreBadge({
  score,
  verificationLevel,
  reviewCount,
  avgRating,
  confirmationCount = 0,
  userId,
  compact = false,
  showDetails = true,
}: TrustScoreBadgeProps) {
  const levelInfo = LEVEL_INFO[verificationLevel] || LEVEL_INFO.basic;
  const LevelIcon = levelInfo.icon;
  const levelColor = getVerificationLevelColor(verificationLevel);
  const scoreColor = getScoreColor(score);

  const handlePress = () => {
    if (userId) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      router.push({
        pathname: '/profile/[id]',
        params: { id: userId },
      });
    }
  };

  if (compact) {
    return (
      <Pressable
        onPress={userId ? handlePress : undefined}
        className="flex-row items-center bg-white/90 rounded-full px-2.5 py-1 shadow-sm"
      >
        <View
          className="w-5 h-5 rounded-full items-center justify-center mr-1.5"
          style={{ backgroundColor: `${levelColor}15` }}
        >
          <LevelIcon size={12} color={levelColor} />
        </View>
        <Text className="text-xs font-semibold" style={{ color: scoreColor }}>
          {score}
        </Text>
      </Pressable>
    );
  }

  return (
    <View className="bg-white rounded-2xl p-4 shadow-sm">
      <View className="flex-row items-center justify-between mb-3">
        <Text className="text-warmBrown font-bold text-base">Trust Score</Text>
        <View
          className="flex-row items-center px-3 py-1.5 rounded-full"
          style={{ backgroundColor: `${levelColor}15` }}
        >
          <LevelIcon size={14} color={levelColor} />
          <Text className="ml-1.5 text-xs font-semibold" style={{ color: levelColor }}>
            {levelInfo.name}
          </Text>
        </View>
      </View>

      <View className="flex-row items-center">
        {/* Score Circle */}
        <View
          className="w-16 h-16 rounded-full items-center justify-center mr-4"
          style={{ backgroundColor: `${scoreColor}15` }}
        >
          <Text className="text-2xl font-bold" style={{ color: scoreColor }}>
            {score}
          </Text>
        </View>

        {/* Stats */}
        {showDetails && (
          <View className="flex-1">
            <View className="flex-row items-center mb-2">
              <Star size={14} color="#C9A227" fill="#C9A227" />
              <Text className="text-warmBrown font-semibold ml-1.5">
                {avgRating > 0 ? avgRating.toFixed(1) : '—'}
              </Text>
              <Text className="text-gray-500 ml-1.5">
                ({reviewCount} {reviewCount === 1 ? 'review' : 'reviews'})
              </Text>
            </View>
            {confirmationCount > 0 && (
              <View className="flex-row items-center">
                <CheckCircle size={14} color="#10B981" />
                <Text className="text-emerald-600 ml-1.5">
                  {confirmationCount} {confirmationCount === 1 ? 'person' : 'people'} confirmed
                </Text>
              </View>
            )}
          </View>
        )}
      </View>

      {/* Progress bar */}
      <View className="mt-4">
        <View className="flex-row justify-between mb-1">
          <Text className="text-gray-500 text-xs">Progress to next level</Text>
          <Text className="text-gray-700 text-xs font-medium">{score}/100</Text>
        </View>
        <View className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <View
            className="h-full rounded-full"
            style={{
              width: `${score}%`,
              backgroundColor: scoreColor,
            }}
          />
        </View>
      </View>
    </View>
  );
}

interface TrustScoreInlineProps {
  score: number;
  verificationLevel: 'unverified' | 'basic' | 'verified' | 'trusted' | 'community_leader';
}

export function TrustScoreInline({ score, verificationLevel }: TrustScoreInlineProps) {
  const levelInfo = LEVEL_INFO[verificationLevel] || LEVEL_INFO.basic;
  const LevelIcon = levelInfo.icon;
  const levelColor = getVerificationLevelColor(verificationLevel);
  const scoreColor = getScoreColor(score);

  return (
    <View className="flex-row items-center">
      <View
        className="w-6 h-6 rounded-full items-center justify-center"
        style={{ backgroundColor: `${levelColor}15` }}
      >
        <LevelIcon size={14} color={levelColor} />
      </View>
      <Text className="ml-2 font-semibold" style={{ color: scoreColor }}>
        {score}
      </Text>
      <Text className="ml-1 text-gray-500 text-sm">trust score</Text>
    </View>
  );
}
