import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Modal,
  Linking,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
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
  Home,
  ChefHat,
  Wrench,
  Sparkles,
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
import {
  getServiceProviders,
  getServiceProviderTrustCounts,
  getServeTalents,
} from '@/lib/marketplace-api';

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

const PROVIDER_CATEGORIES: Array<{ id: string; label: string; icon: React.ReactNode }> = [
  { id: 'house_help', label: 'House help', icon: <Home size={18} color="#1B4D3E" /> },
  { id: 'cook', label: 'Cook', icon: <ChefHat size={18} color="#1B4D3E" /> },
  { id: 'nanny', label: 'Nanny', icon: <Users size={18} color="#1B4D3E" /> },
  { id: 'plumber', label: 'Plumber', icon: <Wrench size={18} color="#1B4D3E" /> },
  { id: 'other', label: 'Other', icon: <Sparkles size={18} color="#1B4D3E" /> },
];

export default function ServeConnectScreen() {
  const [mode, setMode] = useState<'volunteers' | 'helpers'>('volunteers');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTalent, setSelectedTalent] = useState<ServeTalent | null>(null);
  const [showAvailableOnly, setShowAvailableOnly] = useState(false);
  const [providers, setProviders] = useState<any[]>([]);
  const [trustByProviderId, setTrustByProviderId] = useState<
    Record<string, { reviews: number; avgRating: number; workedForMe: number }>
  >({});
  const [providersLoading, setProvidersLoading] = useState(false);
  const [providersRefreshing, setProvidersRefreshing] = useState(false);
  const [dbTalents, setDbTalents] = useState<ServeTalent[]>([]);
  const [talentsLoading, setTalentsLoading] = useState(false);
  const [talentsRefreshing, setTalentsRefreshing] = useState(false);

  const isGuest = useStore((s) => s.isGuest);
  const currentUser = useStore((s) => s.currentUser);
  const savedTalentIds = useStore((s) => s.savedTalentIds);
  const toggleSaveTalent = useStore((s) => s.toggleSaveTalent);
  const userTalentProfile = useStore((s) => s.userTalentProfile);
  const selectedLocation = useStore((s) => s.selectedLocation);
  const feedFilter = useStore((s) => s.feedFilter);

  const city = selectedLocation?.city || 'Denver';
  const neighborhood = selectedLocation?.neighborhood?.trim();
  const locationLabel =
    feedFilter === 'global'
      ? 'Worldwide'
      : feedFilter === 'neighborhood'
        ? neighborhood
          ? `${neighborhood}, ${city}`
          : city
        : city;

  const loadProviders = async () => {
    setProvidersLoading(true);
    try {
      const data = await getServiceProviders(150);
      setProviders(data as any);

      const trustEntries = await Promise.all(
        (data || []).slice(0, 30).map(async (p: any) => [p.id, await getServiceProviderTrustCounts(p.id)] as const)
      );
      const next: Record<string, { reviews: number; avgRating: number; workedForMe: number }> = {};
      for (const [id, t] of trustEntries) next[id] = t;
      setTrustByProviderId(next);
    } catch {
      setProviders([]);
      setTrustByProviderId({});
    } finally {
      setProvidersLoading(false);
    }
  };

  const loadTalents = async () => {
    setTalentsLoading(true);
    try {
      const rows = await getServeTalents(200);
      const mapped: ServeTalent[] = (rows || []).map((r: any) => ({
        id: r.id,
        user: r.user || { id: r.user_id, name: 'Community Member', avatar: '', email: '' },
        category: r.category,
        skills: r.skills || [],
        experience: r.experience || '',
        bio: r.bio || '',
        isAvailable: !!r.is_available,
        availabilityNote: r.availability_note || undefined,
        location: r.location_label || `${r.city}`,
        willingToTravel: !!r.willing_to_travel,
        travelRadius: r.travel_radius || undefined,
        faithBackground: r.faith_background || undefined,
        contactPhone: r.contact_phone || undefined,
        contactEmail: r.contact_email || undefined,
        portfolioImages: r.portfolio_images || undefined,
        videoLink: r.video_link || undefined,
        rating: 0,
        reviewCount: 0,
        createdAt: r.created_at,
        lastActive: r.last_active,
      }));
      setDbTalents(mapped);
    } catch {
      setDbTalents([]);
    } finally {
      setTalentsLoading(false);
    }
  };

  useEffect(() => {
    if (mode === 'helpers') loadProviders();
    if (mode === 'volunteers') loadTalents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  const onRefreshProviders = async () => {
    setProvidersRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await loadProviders();
    } finally {
      setProvidersRefreshing(false);
    }
  };

  const onRefreshTalents = async () => {
    setTalentsRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await loadTalents();
    } finally {
      setTalentsRefreshing(false);
    }
  };

  const combinedTalents = useMemo(() => {
    // Prefer DB results; keep mocks as fallback/seed content.
    return dbTalents.length > 0 ? [...dbTalents, ...MOCK_TALENTS] : MOCK_TALENTS;
  }, [dbTalents]);

  const filteredTalents = combinedTalents.filter((talent) => {
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

  const handleRegisterProvider = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (isGuest || !currentUser) {
      router.push('/signup');
    } else {
      router.push('/register-provider');
    }
  };

  const getCategoryLabel = (categoryId: string) => {
    const category = TALENT_CATEGORIES.find((c) => c.id === categoryId);
    return category?.label ?? categoryId;
  };

  const isSaved = (talentId: string) => savedTalentIds.includes(talentId);

  const filteredProviders = useMemo(() => {
    const matchesArea = (p: any) => {
      if (feedFilter === 'global') return true;
      const blob = `${p.location_label || ''} ${p.city || ''} ${p.neighborhood || ''}`.toLowerCase();
      const cityMatch = blob.includes(city.toLowerCase());
      if (feedFilter === 'city') return cityMatch;
      if (!neighborhood) return cityMatch;
      return blob.includes(neighborhood.toLowerCase()) || cityMatch;
    };

    return (providers || [])
      .filter(matchesArea)
      .filter((p: any) => (!selectedCategory ? true : p.category === selectedCategory))
      .filter((p: any) => {
        if (!searchQuery.trim()) return true;
        const blob = `${p.title} ${p.bio} ${(p.skills || []).join(' ')} ${(p.user?.name || '')}`.toLowerCase();
        return blob.includes(searchQuery.trim().toLowerCase());
      })
      .filter((p: any) => (!showAvailableOnly ? true : !!p.is_available));
  }, [providers, selectedCategory, searchQuery, showAvailableOnly, feedFilter, city, neighborhood]);

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
                <Text className="text-sm text-gray-500">
                  {mode === 'volunteers' ? 'Find Volunteers & Musicians' : 'Find trusted helpers near you'}
                </Text>
              </View>
            </View>

            <Pressable
              onPress={mode === 'volunteers' ? handleRegisterTalent : handleRegisterProvider}
              className="bg-forest-600 rounded-full p-2.5"
            >
              <Plus size={22} color="#FFFFFF" />
            </Pressable>
          </View>

          {/* Mode Toggle */}
          <View className="flex-row bg-white rounded-2xl p-1 shadow-sm">
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setMode('volunteers');
                setSelectedCategory(null);
                setSearchQuery('');
              }}
              className={`flex-1 py-2.5 rounded-2xl items-center ${mode === 'volunteers' ? 'bg-forest-600' : ''}`}
            >
              <Text className={`font-semibold ${mode === 'volunteers' ? 'text-white' : 'text-gray-700'}`}>Volunteers</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setMode('helpers');
                setSelectedCategory(null);
                setSearchQuery('');
              }}
              className={`flex-1 py-2.5 rounded-2xl items-center ${mode === 'helpers' ? 'bg-forest-600' : ''}`}
            >
              <Text className={`font-semibold ${mode === 'helpers' ? 'text-white' : 'text-gray-700'}`}>Trusted Helpers</Text>
            </Pressable>
          </View>

          {/* Search */}
          <View className="flex-row items-center bg-white rounded-2xl px-4 py-3 shadow-sm mt-4">
            <Search size={20} color="#8B7355" />
            <TextInput
              placeholder={
                mode === 'volunteers' ? 'Search talents, skills, names...' : 'Search cooks, house helps, plumbers...'
              }
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
            {(mode === 'volunteers' ? TALENT_CATEGORIES.slice(0, 8) : PROVIDER_CATEGORIES).map((category: any) => (
              <Pressable
                key={category.id}
                onPress={() => handleCategorySelect(category.id)}
                className={`px-4 py-2 rounded-full mr-2 ${
                  selectedCategory === category.id ? 'bg-forest-600' : 'bg-white'
                }`}
              >
                <View className="flex-row items-center">
                  {mode === 'helpers' ? (
                    <Text className="mr-2 text-gray-400">
                      {String(category.icon || '')}
                    </Text>
                  ) : null}
                  <Text
                    className={`font-medium ${
                      selectedCategory === category.id ? 'text-white' : 'text-gray-600'
                    }`}
                  >
                    {category.label}
                  </Text>
                </View>
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
            <View className="flex-1" />
            <View className="flex-row items-center">
              <MapPin size={14} color="#D4673A" />
              <Text className="text-gray-500 ml-1">{locationLabel}</Text>
            </View>
          </Pressable>
        </Animated.View>

        {/* List */}
        <ScrollView
          className="flex-1 px-5 pt-4"
          showsVerticalScrollIndicator={false}
          refreshControl={
            mode === 'helpers'
              ? <RefreshControl refreshing={providersRefreshing} onRefresh={onRefreshProviders} />
              : mode === 'volunteers'
                ? <RefreshControl refreshing={talentsRefreshing} onRefresh={onRefreshTalents} />
                : undefined
          }
        >
          {/* Register Banner */}
          {mode === 'volunteers' && !userTalentProfile && (
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

          {mode === 'helpers' && (
            <Animated.View entering={FadeInUp.duration(400).delay(100)} className="mb-4">
              <LinearGradient
                colors={['#D4673A', '#B4532D']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ borderRadius: 16, padding: 16 }}
              >
                <View className="flex-row items-center">
                  <View className="flex-1">
                    <Text className="text-white font-bold text-base">Trusted Helpers</Text>
                    <Text className="text-white/80 text-sm mt-1">
                      House helps, cooks, nannies, plumbers — with “worked for me” + reviews.
                    </Text>
                  </View>
                  <Pressable onPress={handleRegisterProvider} className="bg-white/20 rounded-full px-4 py-2">
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
              {mode === 'volunteers'
                ? `${filteredTalents.length} ${filteredTalents.length === 1 ? 'Person' : 'People'} Available`
                : `${filteredProviders.length} ${filteredProviders.length === 1 ? 'Provider' : 'Providers'} Found`}
            </Text>
          </Animated.View>

          {mode === 'volunteers' ? (
            <>
              {talentsLoading ? (
                <View className="py-10 items-center">
                  <ActivityIndicator color="#1B4D3E" />
                  <Text className="text-gray-500 mt-3">Loading volunteers…</Text>
                </View>
              ) : null}
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
            </>
          ) : (
            <>
              {providersLoading ? (
                <View className="py-10 items-center">
                  <ActivityIndicator color="#1B4D3E" />
                  <Text className="text-gray-500 mt-3">Loading helpers…</Text>
                </View>
              ) : null}
              {filteredProviders.map((p: any, index) => {
                const t = trustByProviderId[p.id] || { reviews: 0, avgRating: 0, workedForMe: 0 };
                return (
                  <Animated.View key={p.id} entering={FadeInUp.duration(300).delay(200 + index * 50)}>
                    <Pressable
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        router.push(`/provider/${p.id}` as any);
                      }}
                      className="bg-white rounded-2xl mb-4 overflow-hidden shadow-sm"
                    >
                      <View className="p-4">
                        <View className="flex-row items-center">
                          <View className="w-14 h-14 rounded-2xl bg-forest-50 items-center justify-center">
                            <Users size={22} color="#1B4D3E" />
                          </View>
                          <View className="flex-1 ml-3">
                            <Text className="text-warmBrown font-semibold text-lg" numberOfLines={1}>
                              {p.user?.name || 'Provider'}
                            </Text>
                            <Text className="text-gray-500 text-sm" numberOfLines={1}>
                              {p.title} • {p.location_label}
                            </Text>
                            {p.is_available ? (
                              <View className="bg-green-100 rounded-full px-2 py-0.5 mt-1 self-start">
                                <Text className="text-green-700 text-xs font-medium">Available</Text>
                              </View>
                            ) : null}
                          </View>
                          <View className="items-end">
                            <View className="flex-row items-center">
                              <Star size={14} color="#C9A227" fill="#C9A227" />
                              <Text className="text-warmBrown font-semibold ml-1">
                                {t.avgRating ? t.avgRating.toFixed(1) : '—'}
                              </Text>
                            </View>
                            <Text className="text-gray-400 text-xs mt-0.5">{t.workedForMe} worked</Text>
                          </View>
                        </View>
                        <Text className="text-gray-600 text-sm mt-3" numberOfLines={2}>
                          {p.bio}
                        </Text>
                      </View>
                    </Pressable>
                  </Animated.View>
                );
              })}
            </>
          )}

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
