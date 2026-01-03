import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, Modal, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Search,
  Plus,
  MapPin,
  ChevronRight,
  ChevronLeft,
  X,
  Star,
  Phone,
  Mail,
  Check,
  Clock,
  Heart,
  Music,
  Mic,
  Mic2,
  Speaker,
  Camera,
  Users,
  Baby,
  MessageCircle,
  Calendar,
  ClipboardList,
  Languages,
  Car,
  Bookmark,
  BookmarkCheck,
} from 'lucide-react-native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import {
  useStore,
  MOCK_TALENTS,
  TALENT_CATEGORIES,
  type ServeTalent,
} from '@/lib/store';

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  musician: <Music size={18} color="#C9A227" />,
  worship_leader: <Mic size={18} color="#C9A227" />,
  singer: <Mic2 size={18} color="#C9A227" />,
  sound_tech: <Speaker size={18} color="#C9A227" />,
  media: <Camera size={18} color="#C9A227" />,
  youth_leader: <Users size={18} color="#C9A227" />,
  usher: <Users size={18} color="#C9A227" />,
  children_ministry: <Baby size={18} color="#C9A227" />,
  prayer_team: <Heart size={18} color="#C9A227" />,
  counselor: <MessageCircle size={18} color="#C9A227" />,
  event_coordinator: <Calendar size={18} color="#C9A227" />,
  admin: <ClipboardList size={18} color="#C9A227" />,
  translator: <Languages size={18} color="#C9A227" />,
  other: <Star size={18} color="#C9A227" />,
};

export default function ServeConnectScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTalent, setSelectedTalent] = useState<ServeTalent | null>(null);
  const [showAvailableOnly, setShowAvailableOnly] = useState(false);

  const isGuest = useStore((s) => s.isGuest);
  const currentUser = useStore((s) => s.currentUser);
  const savedTalentIds = useStore((s) => s.savedTalentIds);
  const toggleSaveTalent = useStore((s) => s.toggleSaveTalent);
  const userTalentProfile = useStore((s) => s.userTalentProfile);

  const filteredTalents = MOCK_TALENTS.filter((talent) => {
    const matchesSearch =
      talent.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      talent.bio.toLowerCase().includes(searchQuery.toLowerCase()) ||
      talent.skills.some((skill) => skill.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = !selectedCategory || talent.category === selectedCategory;
    const matchesAvailability = !showAvailableOnly || talent.isAvailable;
    return matchesSearch && matchesCategory && matchesAvailability;
  });

  const handleCategorySelect = (categoryId: string | null) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedCategory(categoryId === selectedCategory ? null : categoryId);
  };

  const handleTalentPress = (talent: ServeTalent) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedTalent(talent);
  };

  const handleSaveTalent = (talentId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (isGuest || !currentUser) {
      router.push('/signup');
      return;
    }
    toggleSaveTalent(talentId);
  };

  const handleCall = (phone: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Linking.openURL(`tel:${phone}`);
  };

  const handleEmail = (email: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Linking.openURL(`mailto:${email}`);
  };

  const handleRegisterTalent = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (isGuest || !currentUser) {
      router.push('/signup');
    } else {
      router.push('/register-talent');
    }
  };

  const getCategoryLabel = (categoryId: string) => {
    const category = TALENT_CATEGORIES.find((c) => c.id === categoryId);
    return category?.label ?? categoryId;
  };

  const isSaved = (talentId: string) => savedTalentIds.includes(talentId);

  return (
    <View className="flex-1 bg-cream">
      <SafeAreaView edges={['top']} className="flex-1">
        {/* Header */}
        <Animated.View entering={FadeIn.duration(300)} className="px-5 pt-4 pb-2">
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-row items-center">
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.back();
                }}
                className="bg-white rounded-full p-2 mr-3 shadow-sm"
              >
                <ChevronLeft size={24} color="#2D1F1A" />
              </Pressable>
              <View className="bg-forest-100 rounded-full p-2 mr-3">
                <Users size={24} color="#1B4D3E" />
              </View>
              <View>
                <Text className="text-2xl font-bold text-warmBrown">Serve & Connect</Text>
                <Text className="text-sm text-gray-500">Find Volunteers & Musicians</Text>
              </View>
            </View>

            <Pressable
              onPress={handleRegisterTalent}
              className="bg-forest-600 rounded-full p-2.5"
            >
              <Plus size={22} color="#FFFFFF" />
            </Pressable>
          </View>

          {/* Search */}
          <View className="flex-row items-center bg-white rounded-2xl px-4 py-3 shadow-sm">
            <Search size={20} color="#8B7355" />
            <TextInput
              placeholder="Search talents, skills, names..."
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
              className="flex-1 ml-3 text-warmBrown text-base"
            />
          </View>

          {/* Category Filter */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mt-4"
            style={{ flexGrow: 0 }}
          >
            <Pressable
              onPress={() => handleCategorySelect(null)}
              className={`px-4 py-2 rounded-full mr-2 ${
                !selectedCategory ? 'bg-forest-600' : 'bg-white'
              }`}
            >
              <Text
                className={`font-medium ${
                  !selectedCategory ? 'text-white' : 'text-gray-600'
                }`}
              >
                All
              </Text>
            </Pressable>
            {TALENT_CATEGORIES.slice(0, 8).map((category) => (
              <Pressable
                key={category.id}
                onPress={() => handleCategorySelect(category.id)}
                className={`px-4 py-2 rounded-full mr-2 ${
                  selectedCategory === category.id ? 'bg-forest-600' : 'bg-white'
                }`}
              >
                <Text
                  className={`font-medium ${
                    selectedCategory === category.id ? 'text-white' : 'text-gray-600'
                  }`}
                >
                  {category.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          {/* Available Toggle */}
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShowAvailableOnly(!showAvailableOnly);
            }}
            className="flex-row items-center mt-3"
          >
            <View
              className={`w-5 h-5 rounded border-2 mr-2 items-center justify-center ${
                showAvailableOnly ? 'bg-forest-600 border-forest-600' : 'border-gray-300'
              }`}
            >
              {showAvailableOnly && <Check size={14} color="#FFFFFF" />}
            </View>
            <Text className="text-gray-600">Show available only</Text>
          </Pressable>
        </Animated.View>

        {/* Talents List */}
        <ScrollView className="flex-1 px-5 pt-4" showsVerticalScrollIndicator={false}>
          {/* Register Banner */}
          {!userTalentProfile && (
            <Animated.View entering={FadeInUp.duration(400).delay(100)} className="mb-4">
              <LinearGradient
                colors={['#1B4D3E', '#0D3329']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ borderRadius: 16, padding: 16 }}
              >
                <View className="flex-row items-center">
                  <View className="flex-1">
                    <Text className="text-white font-bold text-base">
                      Ready to Serve?
                    </Text>
                    <Text className="text-white/80 text-sm mt-1">
                      Register your skills and let churches find you when they need help.
                    </Text>
                  </View>
                  <Pressable
                    onPress={handleRegisterTalent}
                    className="bg-white/20 rounded-full px-4 py-2"
                  >
                    <Text className="text-white font-medium">Register</Text>
                  </Pressable>
                </View>
              </LinearGradient>
            </Animated.View>
          )}

          {/* Results Count */}
          <Animated.View
            entering={FadeInUp.duration(400).delay(150)}
            className="flex-row items-center justify-between mb-3"
          >
            <Text className="text-lg font-semibold text-warmBrown">
              {filteredTalents.length} {filteredTalents.length === 1 ? 'Person' : 'People'} Available
            </Text>
          </Animated.View>

          {/* Talent Cards */}
          {filteredTalents.map((talent, index) => (
            <Animated.View
              key={talent.id}
              entering={FadeInUp.duration(300).delay(200 + index * 50)}
            >
              <Pressable
                onPress={() => handleTalentPress(talent)}
                className="bg-white rounded-2xl mb-4 overflow-hidden shadow-sm"
              >
                <View className="p-4">
                  {/* Profile Header */}
                  <View className="flex-row items-center mb-3">
                    <Image
                      source={{ uri: talent.user.avatar }}
                      style={{ width: 56, height: 56, borderRadius: 28 }}
                      contentFit="cover"
                    />
                    <View className="flex-1 ml-3">
                      <View className="flex-row items-center">
                        <Text className="text-warmBrown font-semibold text-lg">
                          {talent.user.name}
                        </Text>
                        {talent.isAvailable && (
                          <View className="bg-green-100 rounded-full px-2 py-0.5 ml-2">
                            <Text className="text-green-700 text-xs font-medium">Available</Text>
                          </View>
                        )}
                      </View>
                      <View className="flex-row items-center mt-1">
                        <View className="bg-forest-50 rounded-full px-2 py-0.5 flex-row items-center">
                          {CATEGORY_ICONS[talent.category]}
                          <Text className="text-forest-700 text-xs font-medium ml-1">
                            {getCategoryLabel(talent.category)}
                          </Text>
                        </View>
                        <Text className="text-gray-400 text-xs ml-2">
                          {talent.experience}
                        </Text>
                      </View>
                    </View>
                    <Pressable
                      onPress={() => handleSaveTalent(talent.id)}
                      className="p-2"
                    >
                      {isSaved(talent.id) ? (
                        <BookmarkCheck size={22} color="#1B4D3E" fill="#1B4D3E" />
                      ) : (
                        <Bookmark size={22} color="#9CA3AF" />
                      )}
                    </Pressable>
                  </View>

                  {/* Bio */}
                  <Text className="text-gray-600 text-sm mb-3" numberOfLines={2}>
                    {talent.bio}
                  </Text>

                  {/* Skills */}
                  <View className="flex-row flex-wrap mb-3">
                    {talent.skills.slice(0, 3).map((skill, idx) => (
                      <View key={idx} className="bg-gold-50 rounded-full px-2.5 py-1 mr-2 mb-1">
                        <Text className="text-gold-700 text-xs">{skill}</Text>
                      </View>
                    ))}
                    {talent.skills.length > 3 && (
                      <View className="bg-gray-100 rounded-full px-2.5 py-1 mr-2 mb-1">
                        <Text className="text-gray-500 text-xs">+{talent.skills.length - 3} more</Text>
                      </View>
                    )}
                  </View>

                  {/* Footer */}
                  <View className="flex-row items-center justify-between pt-3 border-t border-gray-100">
                    <View className="flex-row items-center">
                      <MapPin size={14} color="#8B7355" />
                      <Text className="text-gray-500 text-sm ml-1">{talent.location}</Text>
                      {talent.willingToTravel && (
                        <View className="flex-row items-center ml-2">
                          <Car size={14} color="#9CA3AF" />
                          <Text className="text-gray-400 text-xs ml-1">
                            {talent.travelRadius}
                          </Text>
                        </View>
                      )}
                    </View>
                    <View className="flex-row items-center">
                      <Star size={14} color="#C9A227" fill="#C9A227" />
                      <Text className="text-warmBrown font-medium text-sm ml-1">
                        {talent.rating}
                      </Text>
                      <Text className="text-gray-400 text-xs ml-1">
                        ({talent.reviewCount})
                      </Text>
                    </View>
                  </View>
                </View>
              </Pressable>
            </Animated.View>
          ))}

          <View className="h-8" />
        </ScrollView>

        {/* Talent Detail Modal */}
        <Modal
          visible={!!selectedTalent}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setSelectedTalent(null)}
        >
          {selectedTalent && (
            <View className="flex-1 bg-cream">
              <SafeAreaView edges={['top']} className="flex-1">
                {/* Modal Header */}
                <View className="flex-row items-center justify-between px-5 py-4 border-b border-gray-100">
                  <Pressable
                    onPress={() => setSelectedTalent(null)}
                    className="bg-gray-100 rounded-full p-2"
                  >
                    <X size={24} color="#2D1F1A" />
                  </Pressable>
                  <View className="flex-row items-center">
                    {selectedTalent.isAvailable && (
                      <View className="bg-green-100 rounded-full px-3 py-1 mr-2">
                        <Text className="text-green-700 font-medium text-sm">Available</Text>
                      </View>
                    )}
                    <Pressable
                      onPress={() => handleSaveTalent(selectedTalent.id)}
                      className="p-2"
                    >
                      {isSaved(selectedTalent.id) ? (
                        <BookmarkCheck size={24} color="#1B4D3E" fill="#1B4D3E" />
                      ) : (
                        <Bookmark size={24} color="#9CA3AF" />
                      )}
                    </Pressable>
                  </View>
                </View>

                <ScrollView showsVerticalScrollIndicator={false}>
                  {/* Profile Section */}
                  <View className="p-5">
                    <View className="items-center mb-6">
                      <Image
                        source={{ uri: selectedTalent.user.avatar }}
                        style={{ width: 100, height: 100, borderRadius: 50 }}
                        contentFit="cover"
                      />
                      <Text className="text-2xl font-bold text-warmBrown mt-4">
                        {selectedTalent.user.name}
                      </Text>
                      <View className="flex-row items-center mt-2">
                        {CATEGORY_ICONS[selectedTalent.category]}
                        <Text className="text-forest-700 font-medium ml-2">
                          {getCategoryLabel(selectedTalent.category)}
                        </Text>
                        <Text className="text-gray-400 mx-2">•</Text>
                        <Text className="text-gray-500">{selectedTalent.experience}</Text>
                      </View>
                      <View className="flex-row items-center mt-2">
                        <Star size={16} color="#C9A227" fill="#C9A227" />
                        <Text className="text-warmBrown font-semibold ml-1">
                          {selectedTalent.rating}
                        </Text>
                        <Text className="text-gray-400 ml-1">
                          ({selectedTalent.reviewCount} reviews)
                        </Text>
                      </View>
                    </View>

                    {/* Location & Travel */}
                    <LinearGradient
                      colors={['#1B4D3E', '#0D3329']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={{ borderRadius: 16, padding: 16, marginBottom: 16 }}
                    >
                      <View className="flex-row items-center">
                        <MapPin size={20} color="#FFFFFF" />
                        <View className="ml-3 flex-1">
                          <Text className="text-white font-semibold">
                            {selectedTalent.location}
                          </Text>
                          {selectedTalent.willingToTravel && (
                            <View className="flex-row items-center mt-1">
                              <Car size={14} color="#FFFFFF" />
                              <Text className="text-white/80 ml-2">
                                Willing to travel {selectedTalent.travelRadius}
                              </Text>
                            </View>
                          )}
                        </View>
                      </View>
                      {selectedTalent.availabilityNote && (
                        <View className="flex-row items-center mt-3 pt-3 border-t border-white/20">
                          <Clock size={14} color="#FFFFFF" />
                          <Text className="text-white/80 ml-2">
                            {selectedTalent.availabilityNote}
                          </Text>
                        </View>
                      )}
                    </LinearGradient>

                    {/* About */}
                    <View className="mb-6">
                      <Text className="text-lg font-semibold text-warmBrown mb-2">About</Text>
                      <Text className="text-gray-600 leading-6">{selectedTalent.bio}</Text>
                    </View>

                    {/* Skills */}
                    <View className="mb-6">
                      <Text className="text-lg font-semibold text-warmBrown mb-3">Skills</Text>
                      <View className="flex-row flex-wrap">
                        {selectedTalent.skills.map((skill, idx) => (
                          <View key={idx} className="bg-gold-50 rounded-full px-3 py-1.5 mr-2 mb-2">
                            <Text className="text-gold-700 font-medium">{skill}</Text>
                          </View>
                        ))}
                      </View>
                    </View>

                    {/* Faith Background */}
                    {selectedTalent.faithBackground && (
                      <View className="bg-white rounded-2xl p-4 mb-6">
                        <Text className="text-lg font-semibold text-warmBrown mb-2">
                          Faith Background
                        </Text>
                        <View className="flex-row items-center">
                          <Heart size={18} color="#C9A227" />
                          <Text className="text-gray-600 ml-2">
                            {selectedTalent.faithBackground}
                          </Text>
                        </View>
                      </View>
                    )}

                    {/* Portfolio Images */}
                    {selectedTalent.portfolioImages && selectedTalent.portfolioImages.length > 0 && (
                      <View className="mb-6">
                        <Text className="text-lg font-semibold text-warmBrown mb-3">Portfolio</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }}>
                          {selectedTalent.portfolioImages.map((img, idx) => (
                            <Image
                              key={idx}
                              source={{ uri: img }}
                              style={{
                                width: 200,
                                height: 150,
                                borderRadius: 12,
                                marginRight: 12,
                              }}
                              contentFit="cover"
                            />
                          ))}
                        </ScrollView>
                      </View>
                    )}

                    {/* Contact */}
                    <View className="bg-white rounded-2xl p-4 mb-6">
                      <Text className="text-lg font-semibold text-warmBrown mb-3">
                        Contact
                      </Text>
                      {selectedTalent.contactPhone && (
                        <Pressable
                          onPress={() => handleCall(selectedTalent.contactPhone!)}
                          className="flex-row items-center mb-3"
                        >
                          <View className="bg-forest-50 rounded-full p-2">
                            <Phone size={18} color="#1B4D3E" />
                          </View>
                          <Text className="text-forest-700 ml-3 font-medium">
                            {selectedTalent.contactPhone}
                          </Text>
                        </Pressable>
                      )}
                      {selectedTalent.contactEmail && (
                        <Pressable
                          onPress={() => handleEmail(selectedTalent.contactEmail!)}
                          className="flex-row items-center"
                        >
                          <View className="bg-terracotta-50 rounded-full p-2">
                            <Mail size={18} color="#D4673A" />
                          </View>
                          <Text className="text-terracotta-500 ml-3 font-medium">
                            {selectedTalent.contactEmail}
                          </Text>
                        </Pressable>
                      )}
                    </View>
                  </View>
                </ScrollView>

                {/* Bottom CTA */}
                <View className="px-5 py-4 border-t border-gray-100 bg-white">
                  <View className="flex-row">
                    {selectedTalent.contactPhone && (
                      <Pressable
                        onPress={() => handleCall(selectedTalent.contactPhone!)}
                        className="flex-1 bg-forest-600 rounded-xl py-4 mr-2 items-center flex-row justify-center"
                      >
                        <Phone size={20} color="#FFFFFF" />
                        <Text className="text-white font-bold ml-2">Call</Text>
                      </Pressable>
                    )}
                    {selectedTalent.contactEmail && (
                      <Pressable
                        onPress={() => handleEmail(selectedTalent.contactEmail!)}
                        className="flex-1 bg-gold-500 rounded-xl py-4 ml-2 items-center flex-row justify-center"
                      >
                        <Mail size={20} color="#FFFFFF" />
                        <Text className="text-white font-bold ml-2">Email</Text>
                      </Pressable>
                    )}
                  </View>
                </View>
              </SafeAreaView>
            </View>
          )}
        </Modal>
      </SafeAreaView>
    </View>
  );
}
