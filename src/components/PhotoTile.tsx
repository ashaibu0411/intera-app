import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';

export type PhotoTileSize = 'sm' | 'md' | 'lg';

export function PhotoTile(props: {
  title: string;
  subtitle?: string;
  imageUri: string;
  onPress: () => void;
  size?: PhotoTileSize;
  badgeText?: string;
  badgeTone?: 'danger' | 'warning' | 'info';
}) {
  const size = props.size ?? 'md';
  const height = size === 'lg' ? 140 : size === 'sm' ? 92 : 112;

  const badge =
    props.badgeText && props.badgeText !== '0'
      ? {
          text: props.badgeText,
          bg:
            props.badgeTone === 'danger'
              ? '#DC2626'
              : props.badgeTone === 'warning'
                ? '#D97706'
                : '#2563EB',
        }
      : null;

  return (
    <Pressable
      onPress={props.onPress}
      style={{
        width: '48%',
        height,
        borderRadius: 22,
        overflow: 'hidden',
        backgroundColor: '#111827',
      }}
    >
      <Image source={{ uri: props.imageUri }} style={{ width: '100%', height: '100%' }} contentFit="cover" />

      {/* Dark overlay for readability */}
      <LinearGradient
        colors={['rgba(0,0,0,0.05)', 'rgba(0,0,0,0.70)']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
      />

      {/* Badge */}
      {badge ? (
        <View
          style={{
            position: 'absolute',
            right: 10,
            top: 10,
            paddingHorizontal: 10,
            paddingVertical: 6,
            borderRadius: 999,
            backgroundColor: badge.bg,
          }}
        >
          <Text className="text-white text-xs font-extrabold">{badge.text}</Text>
        </View>
      ) : null}

      {/* Text */}
      <View style={{ position: 'absolute', left: 12, right: 12, bottom: 12 }}>
        <Text className="text-white font-extrabold" style={{ fontSize: size === 'sm' ? 14 : 16 }}>
          {props.title}
        </Text>
        {props.subtitle ? (
          <Text className="text-white/80 mt-0.5" style={{ fontSize: 12 }}>
            {props.subtitle}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

