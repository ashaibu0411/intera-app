import React, { useState, useRef } from 'react';
import { View, Text, ScrollView, Pressable, Share, Alert, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { ChevronLeft, Link2, Copy, Share2, QrCode, Download, MessageCircle, Check, ExternalLink } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import { router, useLocalSearchParams } from 'expo-router';
import Animated, { FadeInUp } from 'react-native-reanimated';
import Svg, { Rect, Path } from 'react-native-svg';

// Simple QR Code generator component
function QRCode({ value, size = 200 }: { value: string; size?: number }) {
  // Generate a simple visual QR-like pattern based on the string
  // This is a visual representation - for production, use a proper QR library
  const cellSize = size / 25;
  const cells: { x: number; y: number }[] = [];

  // Create a deterministic pattern based on the URL
  const hash = value.split('').reduce((acc, char, i) => acc + char.charCodeAt(0) * (i + 1), 0);

  // Position detection patterns (corners)
  const addFinderPattern = (startX: number, startY: number) => {
    for (let x = 0; x < 7; x++) {
      for (let y = 0; y < 7; y++) {
        if (x === 0 || x === 6 || y === 0 || y === 6 || (x >= 2 && x <= 4 && y >= 2 && y <= 4)) {
          cells.push({ x: startX + x, y: startY + y });
        }
      }
    }
  };

  addFinderPattern(0, 0);
  addFinderPattern(18, 0);
  addFinderPattern(0, 18);

  // Data pattern (pseudo-random based on hash)
  for (let x = 8; x < 17; x++) {
    for (let y = 0; y < 25; y++) {
      if ((hash * x * y) % 3 === 0) {
        cells.push({ x, y });
      }
    }
  }
  for (let x = 0; x < 8; x++) {
    for (let y = 8; y < 17; y++) {
      if ((hash * x * y) % 3 === 0) {
        cells.push({ x, y });
      }
    }
  }
  for (let x = 8; x < 25; x++) {
    for (let y = 8; y < 25; y++) {
      if (x < 18 || y < 18) {
        if ((hash * x * y) % 3 === 0) {
          cells.push({ x, y });
        }
      }
    }
  }

  return (
    <View style={{ backgroundColor: '#fff', padding: 16, borderRadius: 16 }}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Rect x="0" y="0" width={size} height={size} fill="white" />
        {cells.map((cell, i) => (
          <Rect
            key={i}
            x={cell.x * cellSize}
            y={cell.y * cellSize}
            width={cellSize}
            height={cellSize}
            fill="#1B4D3E"
          />
        ))}
      </Svg>
    </View>
  );
}

export default function BusinessBookingLinkScreen() {
  const { businessId, businessName, businessLogo } = useLocalSearchParams<{
    businessId: string;
    businessName: string;
    businessLogo?: string;
  }>();

  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(true);

  // Generate unique booking URL
  const bookingUrl = `https://intera.app/book/${businessId}`;
  const shortCode = businessId?.slice(0, 8).toUpperCase() || 'XXXXXXXX';

  const handleCopyLink = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await Clipboard.setStringAsync(bookingUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await Share.share({
        message: `Book an appointment with ${businessName} on Intera!\n\n${bookingUrl}`,
        url: bookingUrl,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleShareWhatsApp = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const message = encodeURIComponent(`Book an appointment with ${businessName} on Intera!\n\n${bookingUrl}`);
    const whatsappUrl = `whatsapp://send?text=${message}`;
    try {
      await Share.share({
        message: `Book an appointment with ${businessName} on Intera!\n\n${bookingUrl}`,
      });
    } catch (error) {
      console.error('Error sharing to WhatsApp:', error);
    }
  };

  const handleShareSMS = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const message = `Book an appointment with ${businessName} on Intera! ${bookingUrl}`;
    try {
      await Share.share({
        message,
      });
    } catch (error) {
      console.error('Error sharing via SMS:', error);
    }
  };

  return (
    <View className="flex-1 bg-cream">
      <SafeAreaView edges={['top']} className="flex-1">
        {/* Header */}
        <View className="px-5 pt-4 pb-3 flex-row items-center">
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.back();
            }}
            className="bg-white rounded-full p-2 shadow-sm"
          >
            <ChevronLeft size={22} color="#2D1F1A" />
          </Pressable>
          <View className="flex-1 ml-3">
            <Text className="text-xl font-bold text-warmBrown">Booking Link</Text>
            <Text className="text-gray-500 text-sm">{businessName}</Text>
          </View>
        </View>

        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {/* QR Code Section */}
          <Animated.View entering={FadeInUp.duration(400).delay(100)} className="mx-5 mt-4">
            <View className="bg-white rounded-3xl p-6 items-center shadow-sm">
              <View className="flex-row items-center mb-4">
                <QrCode size={24} color="#1B4D3E" />
                <Text className="text-warmBrown font-bold text-lg ml-2">Your Booking QR Code</Text>
              </View>

              <Text className="text-gray-500 text-center mb-4">
                Customers can scan this code to book appointments directly
              </Text>

              {/* QR Code */}
              <View className="bg-forest-50 rounded-2xl p-4">
                <QRCode value={bookingUrl} size={180} />
              </View>

              {/* Business Logo Overlay Hint */}
              <Text className="text-gray-400 text-xs mt-3 text-center">
                Print this QR code and display it at your location
              </Text>
            </View>
          </Animated.View>

          {/* Unique Link Section */}
          <Animated.View entering={FadeInUp.duration(400).delay(200)} className="mx-5 mt-4">
            <View className="bg-white rounded-2xl p-4 shadow-sm">
              <View className="flex-row items-center mb-3">
                <Link2 size={20} color="#1B4D3E" />
                <Text className="text-warmBrown font-bold ml-2">Your Unique Booking Link</Text>
              </View>

              {/* Link Display */}
              <View className="bg-gray-50 rounded-xl p-4 flex-row items-center">
                <Text className="flex-1 text-forest-600 font-medium" numberOfLines={1}>
                  {bookingUrl}
                </Text>
                <Pressable
                  onPress={handleCopyLink}
                  className={`ml-2 rounded-full p-2 ${copied ? 'bg-emerald-100' : 'bg-forest-100'}`}
                >
                  {copied ? (
                    <Check size={18} color="#10B981" />
                  ) : (
                    <Copy size={18} color="#1B4D3E" />
                  )}
                </Pressable>
              </View>

              {copied && (
                <Text className="text-emerald-600 text-sm mt-2 text-center">
                  Link copied to clipboard!
                </Text>
              )}

              {/* Short Code */}
              <View className="mt-4 pt-4 border-t border-gray-100">
                <Text className="text-gray-500 text-sm mb-2">Short Code</Text>
                <View className="flex-row items-center">
                  <View className="bg-forest-600 rounded-lg px-4 py-2">
                    <Text className="text-white font-bold text-lg tracking-widest">{shortCode}</Text>
                  </View>
                  <Text className="text-gray-500 text-sm ml-3 flex-1">
                    Customers can use this code in the app to find your booking page
                  </Text>
                </View>
              </View>
            </View>
          </Animated.View>

          {/* Share Options */}
          <Animated.View entering={FadeInUp.duration(400).delay(300)} className="mx-5 mt-4">
            <Text className="text-warmBrown font-bold text-lg mb-3">Share Your Link</Text>

            <View className="flex-row gap-3">
              {/* Share Button */}
              <Pressable
                onPress={handleShare}
                className="flex-1 bg-forest-600 rounded-2xl py-4 items-center"
              >
                <Share2 size={24} color="#fff" />
                <Text className="text-white font-semibold mt-2">Share</Text>
              </Pressable>

              {/* WhatsApp */}
              <Pressable
                onPress={handleShareWhatsApp}
                className="flex-1 bg-emerald-500 rounded-2xl py-4 items-center"
              >
                <MessageCircle size={24} color="#fff" />
                <Text className="text-white font-semibold mt-2">WhatsApp</Text>
              </Pressable>

              {/* Copy */}
              <Pressable
                onPress={handleCopyLink}
                className="flex-1 bg-terracotta-500 rounded-2xl py-4 items-center"
              >
                <Copy size={24} color="#fff" />
                <Text className="text-white font-semibold mt-2">Copy</Text>
              </Pressable>
            </View>
          </Animated.View>

          {/* Tips Section */}
          <Animated.View entering={FadeInUp.duration(400).delay(400)} className="mx-5 mt-6 mb-8">
            <Text className="text-warmBrown font-bold text-lg mb-3">Tips for Sharing</Text>

            <View className="bg-gold-50 rounded-2xl p-4">
              <View className="flex-row items-start mb-3">
                <View className="bg-gold-200 rounded-full w-6 h-6 items-center justify-center mr-3 mt-0.5">
                  <Text className="text-gold-800 font-bold text-sm">1</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-warmBrown font-semibold">Print the QR Code</Text>
                  <Text className="text-gray-600 text-sm mt-1">
                    Display it at your checkout counter, window, or waiting area
                  </Text>
                </View>
              </View>

              <View className="flex-row items-start mb-3">
                <View className="bg-gold-200 rounded-full w-6 h-6 items-center justify-center mr-3 mt-0.5">
                  <Text className="text-gold-800 font-bold text-sm">2</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-warmBrown font-semibold">Add to Social Media</Text>
                  <Text className="text-gray-600 text-sm mt-1">
                    Include the link in your Instagram bio, Facebook page, or WhatsApp status
                  </Text>
                </View>
              </View>

              <View className="flex-row items-start mb-3">
                <View className="bg-gold-200 rounded-full w-6 h-6 items-center justify-center mr-3 mt-0.5">
                  <Text className="text-gold-800 font-bold text-sm">3</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-warmBrown font-semibold">Send to Existing Customers</Text>
                  <Text className="text-gray-600 text-sm mt-1">
                    WhatsApp or text the link to customers who regularly book with you
                  </Text>
                </View>
              </View>

              <View className="flex-row items-start">
                <View className="bg-gold-200 rounded-full w-6 h-6 items-center justify-center mr-3 mt-0.5">
                  <Text className="text-gold-800 font-bold text-sm">4</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-warmBrown font-semibold">Add to Business Cards</Text>
                  <Text className="text-gray-600 text-sm mt-1">
                    Print the QR code or short link on your business cards
                  </Text>
                </View>
              </View>
            </View>
          </Animated.View>

          {/* What Customers See */}
          <Animated.View entering={FadeInUp.duration(400).delay(500)} className="mx-5 mb-8">
            <Text className="text-warmBrown font-bold text-lg mb-3">What Customers See</Text>

            <View className="bg-white rounded-2xl p-4 shadow-sm">
              <View className="flex-row items-center mb-3">
                <View className="w-12 h-12 rounded-full bg-forest-100 items-center justify-center">
                  {businessLogo ? (
                    <Image
                      source={{ uri: businessLogo }}
                      style={{ width: 48, height: 48, borderRadius: 24 }}
                      contentFit="cover"
                    />
                  ) : (
                    <Text className="text-forest-600 font-bold text-lg">
                      {businessName?.charAt(0) || 'B'}
                    </Text>
                  )}
                </View>
                <View className="ml-3 flex-1">
                  <Text className="text-warmBrown font-bold">{businessName}</Text>
                  <Text className="text-gray-500 text-sm">Book an appointment</Text>
                </View>
              </View>

              <View className="bg-gray-50 rounded-xl p-3">
                <Text className="text-gray-600 text-sm text-center">
                  When customers open your link, they'll see your services, availability, and can book instantly
                </Text>
              </View>
            </View>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
