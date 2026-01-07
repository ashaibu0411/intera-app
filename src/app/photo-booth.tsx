import React, { useState, useRef } from 'react';
import { View, Text, ScrollView, Pressable, Modal, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { ArrowLeft, Camera, Sparkles, Share2, Download, X, ChevronLeft, ChevronRight, Heart, Wand2, RotateCcw, FlipHorizontal, Sun, Moon } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, FadeInDown, ZoomIn, useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Filter {
  id: string;
  name: string;
  category: string;
  preview: string;
  overlay?: string;
  style: {
    brightness?: number;
    contrast?: number;
    saturate?: number;
    sepia?: number;
    hueRotate?: number;
    overlay?: string;
  };
  borderFrame?: string;
  culturalElement?: string;
}

interface Frame {
  id: string;
  name: string;
  culture: string;
  preview: string;
  borderImage: string;
  cornerImage?: string;
}

const CULTURAL_FILTERS: Filter[] = [
  {
    id: 'ankara-warm',
    name: 'Ankara Glow',
    category: 'African',
    preview: 'https://images.unsplash.com/photo-1590735213920-68192a487bc2?w=200',
    style: { brightness: 1.1, saturate: 1.3, sepia: 0.1 },
    culturalElement: '🇳🇬',
  },
  {
    id: 'kente-gold',
    name: 'Kente Gold',
    category: 'African',
    preview: 'https://images.unsplash.com/photo-1516575334481-f85287c2c82d?w=200',
    style: { brightness: 1.15, saturate: 1.2, sepia: 0.25 },
    culturalElement: '🇬🇭',
  },
  {
    id: 'safari-sunset',
    name: 'Safari Sunset',
    category: 'African',
    preview: 'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?w=200',
    style: { brightness: 1.05, saturate: 1.4, sepia: 0.15, hueRotate: -10 },
    culturalElement: '🦁',
  },
  {
    id: 'caribbean-vibes',
    name: 'Caribbean Vibes',
    category: 'Caribbean',
    preview: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=200',
    style: { brightness: 1.2, saturate: 1.5, hueRotate: 10 },
    culturalElement: '🏝️',
  },
  {
    id: 'reggae-tones',
    name: 'Reggae Tones',
    category: 'Caribbean',
    preview: 'https://images.unsplash.com/photo-1534258936925-c58bed479fcb?w=200',
    style: { brightness: 1.1, saturate: 1.3, sepia: 0.05, hueRotate: 15 },
    culturalElement: '🇯🇲',
  },
  {
    id: 'ethiopian-coffee',
    name: 'Ethiopian Coffee',
    category: 'African',
    preview: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=200',
    style: { brightness: 0.95, contrast: 1.1, saturate: 0.9, sepia: 0.3 },
    culturalElement: '☕',
  },
  {
    id: 'sahara-dust',
    name: 'Sahara Dust',
    category: 'African',
    preview: 'https://images.unsplash.com/photo-1509023464722-18d996393ca8?w=200',
    style: { brightness: 1.1, saturate: 0.8, sepia: 0.4 },
    culturalElement: '🏜️',
  },
  {
    id: 'island-paradise',
    name: 'Island Paradise',
    category: 'Caribbean',
    preview: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=200',
    style: { brightness: 1.15, saturate: 1.6, hueRotate: -5 },
    culturalElement: '🌺',
  },
  {
    id: 'vintage-africa',
    name: 'Vintage Africa',
    category: 'African',
    preview: 'https://images.unsplash.com/photo-1489392191049-fc10c97e64b6?w=200',
    style: { brightness: 0.9, contrast: 1.15, saturate: 0.7, sepia: 0.5 },
    culturalElement: '📜',
  },
  {
    id: 'moonlight',
    name: 'Moonlight',
    category: 'Universal',
    preview: 'https://images.unsplash.com/photo-1532693322450-2cb5c511067d?w=200',
    style: { brightness: 0.85, contrast: 1.2, saturate: 0.6, hueRotate: 200 },
    culturalElement: '🌙',
  },
  {
    id: 'golden-hour',
    name: 'Golden Hour',
    category: 'Universal',
    preview: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=200',
    style: { brightness: 1.1, saturate: 1.2, sepia: 0.2, hueRotate: -15 },
    culturalElement: '✨',
  },
  {
    id: 'diaspora-dreams',
    name: 'Diaspora Dreams',
    category: 'African',
    preview: 'https://images.unsplash.com/photo-1484291470158-b8f8d608850d?w=200',
    style: { brightness: 1.05, contrast: 1.1, saturate: 1.1, hueRotate: 5 },
    culturalElement: '🌍',
  },
];

const CULTURAL_FRAMES: Frame[] = [
  {
    id: 'kente-border',
    name: 'Kente Border',
    culture: 'Ghana',
    preview: 'https://images.unsplash.com/photo-1590735213920-68192a487bc2?w=100',
    borderImage: 'kente',
  },
  {
    id: 'adinkra-corners',
    name: 'Adinkra Corners',
    culture: 'Akan',
    preview: 'https://images.unsplash.com/photo-1516575334481-f85287c2c82d?w=100',
    borderImage: 'adinkra',
  },
  {
    id: 'ankara-frame',
    name: 'Ankara Frame',
    culture: 'West African',
    preview: 'https://images.unsplash.com/photo-1590735213920-68192a487bc2?w=100',
    borderImage: 'ankara',
  },
  {
    id: 'mudcloth-border',
    name: 'Mudcloth Border',
    culture: 'Mali',
    preview: 'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?w=100',
    borderImage: 'mudcloth',
  },
  {
    id: 'caribbean-tropical',
    name: 'Tropical Paradise',
    culture: 'Caribbean',
    preview: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=100',
    borderImage: 'tropical',
  },
  {
    id: 'reggae-rasta',
    name: 'Rasta Colors',
    culture: 'Jamaica',
    preview: 'https://images.unsplash.com/photo-1534258936925-c58bed479fcb?w=100',
    borderImage: 'rasta',
  },
];

const STICKERS = [
  { id: '1', emoji: '👑', name: 'Crown' },
  { id: '2', emoji: '🌍', name: 'Africa' },
  { id: '3', emoji: '🦁', name: 'Lion' },
  { id: '4', emoji: '✊🏿', name: 'Fist' },
  { id: '5', emoji: '🌺', name: 'Hibiscus' },
  { id: '6', emoji: '🥁', name: 'Drum' },
  { id: '7', emoji: '💫', name: 'Sparkle' },
  { id: '8', emoji: '🌴', name: 'Palm' },
  { id: '9', emoji: '☀️', name: 'Sun' },
  { id: '10', emoji: '🎭', name: 'Masks' },
  { id: '11', emoji: '💎', name: 'Diamond' },
  { id: '12', emoji: '🦋', name: 'Butterfly' },
];

const SAMPLE_PHOTOS = [
  'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=800',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=800',
];

const CATEGORIES = ['All', 'African', 'Caribbean', 'Universal'];

export default function PhotoBoothScreen() {
  const router = useRouter();
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(SAMPLE_PHOTOS[0]);
  const [selectedFilter, setSelectedFilter] = useState<Filter | null>(null);
  const [selectedFrame, setSelectedFrame] = useState<Frame | null>(null);
  const [selectedStickers, setSelectedStickers] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'filters' | 'frames' | 'stickers'>('filters');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [isFlipped, setIsFlipped] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);

  const filteredFilters = CULTURAL_FILTERS.filter(f =>
    categoryFilter === 'All' || f.category === categoryFilter
  );

  const toggleSticker = (stickerId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedStickers(prev =>
      prev.includes(stickerId)
        ? prev.filter(s => s !== stickerId)
        : [...prev, stickerId]
    );
  };

  const resetEdits = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedFilter(null);
    setSelectedFrame(null);
    setSelectedStickers([]);
    setIsFlipped(false);
  };

  const getFilterStyle = () => {
    if (!selectedFilter) return {};
    const { style } = selectedFilter;
    return {
      opacity: style.brightness || 1,
    };
  };

  const handleSave = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setShowSaveModal(true);
  };

  const getFrameBorderColors = (frame: Frame | null): [string, string, string, string] => {
    if (!frame) return ['transparent', 'transparent', 'transparent', 'transparent'];
    switch (frame.borderImage) {
      case 'kente': return ['#FFD700', '#228B22', '#FF4500', '#FFD700'];
      case 'rasta': return ['#FF0000', '#FFD700', '#228B22', '#FF0000'];
      case 'tropical': return ['#00CED1', '#FF69B4', '#FFD700', '#00CED1'];
      case 'ankara': return ['#FF6B35', '#004E89', '#F7C548', '#FF6B35'];
      case 'mudcloth': return ['#8B4513', '#F5DEB3', '#8B4513', '#F5DEB3'];
      case 'adinkra': return ['#2F2F2F', '#FFD700', '#2F2F2F', '#FFD700'];
      default: return ['transparent', 'transparent', 'transparent', 'transparent'];
    }
  };

  return (
    <View className="flex-1 bg-black">
      <SafeAreaView edges={['top']} className="flex-1">
        {/* Header */}
        <View className="px-5 py-3 flex-row items-center justify-between">
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.back();
            }}
            className="w-10 h-10 rounded-full bg-white/10 items-center justify-center"
          >
            <ArrowLeft size={20} color="#fff" />
          </Pressable>
          <View className="flex-row items-center">
            <Camera size={20} color="#fff" />
            <Text className="text-white text-lg font-bold ml-2">Photo Booth</Text>
          </View>
          <Pressable
            onPress={resetEdits}
            className="w-10 h-10 rounded-full bg-white/10 items-center justify-center"
          >
            <RotateCcw size={20} color="#fff" />
          </Pressable>
        </View>

        {/* Photo Preview */}
        <View className="flex-1 px-5 pt-2">
          <Animated.View
            entering={FadeIn.duration(400)}
            className="flex-1 rounded-3xl overflow-hidden"
            style={[
              selectedFrame && {
                borderWidth: 8,
                borderColor: getFrameBorderColors(selectedFrame)[0],
              }
            ]}
          >
            {selectedPhoto && (
              <View className="flex-1 relative">
                <Image
                  source={{ uri: selectedPhoto }}
                  style={[
                    { flex: 1 },
                    isFlipped && { transform: [{ scaleX: -1 }] },
                  ]}
                  contentFit="cover"
                />

                {/* Filter Overlay */}
                {selectedFilter && (
                  <View
                    className="absolute inset-0"
                    style={{
                      backgroundColor: selectedFilter.style.sepia ? `rgba(112, 66, 20, ${selectedFilter.style.sepia * 0.3})` : 'transparent',
                    }}
                  />
                )}

                {/* Stickers */}
                {selectedStickers.length > 0 && (
                  <View className="absolute inset-0 items-center justify-center">
                    <View className="flex-row flex-wrap justify-center gap-4">
                      {selectedStickers.map((stickerId, index) => {
                        const sticker = STICKERS.find(s => s.id === stickerId);
                        return sticker ? (
                          <Animated.Text
                            key={stickerId}
                            entering={ZoomIn.delay(index * 100)}
                            className="text-6xl"
                          >
                            {sticker.emoji}
                          </Animated.Text>
                        ) : null;
                      })}
                    </View>
                  </View>
                )}

                {/* Frame Corners */}
                {selectedFrame && (
                  <>
                    <View className="absolute top-2 left-2 w-12 h-12 border-t-4 border-l-4 rounded-tl-lg"
                      style={{ borderColor: getFrameBorderColors(selectedFrame)[1] }}
                    />
                    <View className="absolute top-2 right-2 w-12 h-12 border-t-4 border-r-4 rounded-tr-lg"
                      style={{ borderColor: getFrameBorderColors(selectedFrame)[2] }}
                    />
                    <View className="absolute bottom-2 left-2 w-12 h-12 border-b-4 border-l-4 rounded-bl-lg"
                      style={{ borderColor: getFrameBorderColors(selectedFrame)[3] }}
                    />
                    <View className="absolute bottom-2 right-2 w-12 h-12 border-b-4 border-r-4 rounded-br-lg"
                      style={{ borderColor: getFrameBorderColors(selectedFrame)[0] }}
                    />
                  </>
                )}

                {/* Cultural Element Badge */}
                {selectedFilter && (
                  <View className="absolute bottom-4 right-4 bg-black/50 px-3 py-2 rounded-full flex-row items-center">
                    <Text className="text-xl mr-2">{selectedFilter.culturalElement}</Text>
                    <Text className="text-white text-xs font-medium">{selectedFilter.name}</Text>
                  </View>
                )}
              </View>
            )}
          </Animated.View>

          {/* Quick Actions */}
          <View className="flex-row justify-center gap-4 py-3">
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setIsFlipped(!isFlipped);
              }}
              className="bg-white/10 px-4 py-2 rounded-full flex-row items-center"
            >
              <FlipHorizontal size={16} color="#fff" />
              <Text className="text-white text-sm ml-2">Flip</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                const currentIndex = SAMPLE_PHOTOS.indexOf(selectedPhoto || '');
                const nextIndex = (currentIndex + 1) % SAMPLE_PHOTOS.length;
                setSelectedPhoto(SAMPLE_PHOTOS[nextIndex]);
              }}
              className="bg-white/10 px-4 py-2 rounded-full flex-row items-center"
            >
              <Camera size={16} color="#fff" />
              <Text className="text-white text-sm ml-2">Change Photo</Text>
            </Pressable>
          </View>
        </View>

        {/* Bottom Editor Panel */}
        <View className="bg-gray-900 rounded-t-3xl pt-4">
          {/* Tab Switcher */}
          <View className="flex-row px-5 mb-3">
            {(['filters', 'frames', 'stickers'] as const).map((tab) => (
              <Pressable
                key={tab}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setActiveTab(tab);
                }}
                className={`flex-1 py-2 rounded-full ${activeTab === tab ? 'bg-white' : ''}`}
              >
                <Text className={`text-center font-semibold capitalize ${activeTab === tab ? 'text-gray-900' : 'text-gray-500'}`}>
                  {tab}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Filters Tab */}
          {activeTab === 'filters' && (
            <View>
              {/* Category Filter */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-5 mb-3" style={{ flexGrow: 0 }}>
                <View className="flex-row gap-2">
                  {CATEGORIES.map((cat) => (
                    <Pressable
                      key={cat}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setCategoryFilter(cat);
                      }}
                      className={`px-4 py-1.5 rounded-full ${categoryFilter === cat ? 'bg-amber-500' : 'bg-gray-800'}`}
                    >
                      <Text className={`text-sm ${categoryFilter === cat ? 'text-white font-semibold' : 'text-gray-400'}`}>
                        {cat}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </ScrollView>

              {/* Filter Options */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-5 pb-6" style={{ flexGrow: 0 }}>
                <View className="flex-row gap-3">
                  {/* None Option */}
                  <Pressable
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setSelectedFilter(null);
                    }}
                    className={`items-center`}
                  >
                    <View className={`w-16 h-16 rounded-xl bg-gray-800 items-center justify-center ${!selectedFilter ? 'border-2 border-white' : ''}`}>
                      <X size={24} color="#9CA3AF" />
                    </View>
                    <Text className="text-gray-400 text-xs mt-1">None</Text>
                  </Pressable>

                  {filteredFilters.map((filter) => (
                    <Pressable
                      key={filter.id}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setSelectedFilter(filter);
                      }}
                      className="items-center"
                    >
                      <View className={`w-16 h-16 rounded-xl overflow-hidden ${selectedFilter?.id === filter.id ? 'border-2 border-amber-500' : ''}`}>
                        <Image
                          source={{ uri: filter.preview }}
                          style={{ width: 64, height: 64 }}
                          contentFit="cover"
                        />
                        <View className="absolute bottom-0 right-0 bg-black/60 px-1 rounded-tl">
                          <Text className="text-xs">{filter.culturalElement}</Text>
                        </View>
                      </View>
                      <Text className="text-gray-400 text-xs mt-1" numberOfLines={1}>{filter.name}</Text>
                    </Pressable>
                  ))}
                </View>
              </ScrollView>
            </View>
          )}

          {/* Frames Tab */}
          {activeTab === 'frames' && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-5 pb-6" style={{ flexGrow: 0 }}>
              <View className="flex-row gap-3">
                {/* None Option */}
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSelectedFrame(null);
                  }}
                  className="items-center"
                >
                  <View className={`w-16 h-16 rounded-xl bg-gray-800 items-center justify-center ${!selectedFrame ? 'border-2 border-white' : ''}`}>
                    <X size={24} color="#9CA3AF" />
                  </View>
                  <Text className="text-gray-400 text-xs mt-1">None</Text>
                </Pressable>

                {CULTURAL_FRAMES.map((frame) => (
                  <Pressable
                    key={frame.id}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setSelectedFrame(frame);
                    }}
                    className="items-center"
                  >
                    <View
                      className={`w-16 h-16 rounded-xl overflow-hidden ${selectedFrame?.id === frame.id ? 'border-2 border-amber-500' : ''}`}
                      style={{
                        borderWidth: 4,
                        borderColor: getFrameBorderColors(frame)[0],
                      }}
                    >
                      <Image
                        source={{ uri: frame.preview }}
                        style={{ width: 56, height: 56 }}
                        contentFit="cover"
                      />
                    </View>
                    <Text className="text-gray-400 text-xs mt-1" numberOfLines={1}>{frame.name}</Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
          )}

          {/* Stickers Tab */}
          {activeTab === 'stickers' && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-5 pb-6" style={{ flexGrow: 0 }}>
              <View className="flex-row gap-3">
                {STICKERS.map((sticker) => (
                  <Pressable
                    key={sticker.id}
                    onPress={() => toggleSticker(sticker.id)}
                    className="items-center"
                  >
                    <View className={`w-14 h-14 rounded-xl bg-gray-800 items-center justify-center ${selectedStickers.includes(sticker.id) ? 'border-2 border-amber-500' : ''}`}>
                      <Text className="text-3xl">{sticker.emoji}</Text>
                    </View>
                    <Text className="text-gray-400 text-xs mt-1">{sticker.name}</Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
          )}

          {/* Action Buttons */}
          <View className="flex-row px-5 pb-6 gap-3">
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
              className="flex-1 bg-gray-800 py-4 rounded-2xl flex-row items-center justify-center"
            >
              <Share2 size={20} color="#fff" />
              <Text className="text-white font-bold ml-2">Share</Text>
            </Pressable>
            <Pressable
              onPress={handleSave}
              className="flex-1 py-4 rounded-2xl flex-row items-center justify-center"
              style={{ backgroundColor: '#F59E0B' }}
            >
              <Download size={20} color="#fff" />
              <Text className="text-white font-bold ml-2">Save</Text>
            </Pressable>
          </View>
        </View>

        {/* Save Success Modal */}
        <Modal visible={showSaveModal} transparent animationType="fade">
          <View className="flex-1 bg-black/80 items-center justify-center px-6">
            <Animated.View
              entering={ZoomIn.springify()}
              className="bg-gray-900 rounded-3xl p-6 w-full max-w-sm items-center"
            >
              <View className="w-20 h-20 rounded-full bg-green-500/20 items-center justify-center mb-4">
                <Text className="text-5xl">✨</Text>
              </View>
              <Text className="text-white text-xl font-bold mb-2">Photo Saved!</Text>
              <Text className="text-gray-400 text-center mb-6">
                Your beautiful creation has been saved to your gallery.
              </Text>
              <Pressable
                onPress={() => setShowSaveModal(false)}
                className="bg-amber-500 px-8 py-3 rounded-full"
              >
                <Text className="text-white font-bold">Done</Text>
              </Pressable>
            </Animated.View>
          </View>
        </Modal>
      </SafeAreaView>
    </View>
  );
}
