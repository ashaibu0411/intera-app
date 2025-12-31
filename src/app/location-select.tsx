import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, Pressable, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  MapPin,
  ChevronRight,
  ChevronLeft,
  Search,
  Check,
  Globe,
  ArrowRight,
  X,
  Zap,
  Clock,
} from 'lucide-react-native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import {
  useStore,
  COUNTRIES,
  STATES_BY_COUNTRY,
  CITIES_BY_STATE,
  MOCK_COMMUNITIES,
} from '@/lib/store';
import { getOrCreateCommunity, joinCommunity } from '@/lib/communities';
import { getCurrentUser } from '@/lib/auth';

type Step = 'quick' | 'country' | 'state' | 'city';

// Build a flat list of all cities with their full location info
interface CityOption {
  city: string;
  state: string;
  country: string;
  countryCode: string;
}

const ALL_CITIES: CityOption[] = [];
Object.entries(CITIES_BY_STATE).forEach(([state, cities]) => {
  // Find which country this state belongs to
  let countryCode = '';
  let countryName = '';
  for (const [code, states] of Object.entries(STATES_BY_COUNTRY)) {
    if (states.includes(state)) {
      countryCode = code;
      const country = COUNTRIES.find(c => c.code === code);
      countryName = country?.name || '';
      break;
    }
  }
  cities.forEach(city => {
    ALL_CITIES.push({
      city,
      state,
      country: countryName,
      countryCode,
    });
  });
});

export default function LocationSelectScreen() {
  const selectedLocation = useStore((s) => s.selectedLocation);

  // Check if user already has a location (coming from home to change location)
  const isChangingLocation = !!selectedLocation;

  // Start with quick search if user is changing location, otherwise normal flow
  const [step, setStep] = useState<Step>(isChangingLocation ? 'quick' : 'country');
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const setSelectedLocation = useStore((s) => s.setSelectedLocation);
  const setCurrentCommunity = useStore((s) => s.setCurrentCommunity);
  const setIsGuest = useStore((s) => s.setIsGuest);

  const selectedCountryData = useMemo(
    () => COUNTRIES.find((c) => c.code === selectedCountry),
    [selectedCountry]
  );

  const states = useMemo(() => {
    if (!selectedCountry) return [];
    return STATES_BY_COUNTRY[selectedCountry] || [];
  }, [selectedCountry]);

  const cities = useMemo(() => {
    if (!selectedState) return [];
    return CITIES_BY_STATE[selectedState] || ['Other'];
  }, [selectedState]);

  const filteredCountries = useMemo(() => {
    if (!searchQuery) return COUNTRIES;
    return COUNTRIES.filter((c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  const filteredStates = useMemo(() => {
    if (!searchQuery) return states;
    return states.filter((s) =>
      s.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, states]);

  const filteredCities = useMemo(() => {
    if (!searchQuery) return cities;
    return cities.filter((c) =>
      c.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, cities]);

  // Quick search across ALL cities
  const quickSearchCities = useMemo(() => {
    if (!searchQuery) return ALL_CITIES;
    const query = searchQuery.toLowerCase();
    return ALL_CITIES.filter(
      (c) =>
        c.city.toLowerCase().includes(query) ||
        c.state.toLowerCase().includes(query) ||
        c.country.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  const handleCountrySelect = (code: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedCountry(code);
    setSelectedState(null);
    setSelectedCity(null);
    setSearchQuery('');

    const country = COUNTRIES.find((c) => c.code === code);
    if (country?.hasStates && STATES_BY_COUNTRY[code]?.length > 0) {
      setStep('state');
    } else {
      // Skip to city or complete
      setStep('city');
    }
  };

  const handleStateSelect = (state: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedState(state);
    setSelectedCity(null);
    setSearchQuery('');
    setStep('city');
  };

  const handleCitySelect = (city: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedCity(city);
  };

  // Quick city selection (direct jump)
  const handleQuickCitySelect = async (cityOption: CityOption) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    setSelectedLocation({
      country: cityOption.country,
      state: cityOption.state || undefined,
      city: cityOption.city,
    });

    // Try to get or create the community in Supabase
    const dbCommunity = await getOrCreateCommunity(
      cityOption.city,
      cityOption.state || null,
      cityOption.country
    );

    if (dbCommunity) {
      const user = await getCurrentUser();
      if (user) {
        await joinCommunity(user.id, dbCommunity.id);
      }

      setCurrentCommunity({
        id: dbCommunity.id,
        name: dbCommunity.name,
        city: dbCommunity.city,
        state: dbCommunity.state ?? undefined,
        country: dbCommunity.country,
        memberCount: dbCommunity.member_count,
        image: dbCommunity.image_url || 'https://images.unsplash.com/photo-1489392191049-fc10c97e64b6?w=400&h=300&fit=crop',
      });
    } else {
      const matchingCommunity = MOCK_COMMUNITIES.find(
        (c) => c.city.toLowerCase() === cityOption.city.toLowerCase()
      );

      if (matchingCommunity) {
        setCurrentCommunity(matchingCommunity);
      } else {
        setCurrentCommunity({
          id: 'custom',
          name: `${cityOption.city} Africans`,
          city: cityOption.city,
          state: cityOption.state ?? undefined,
          country: cityOption.country,
          memberCount: 1,
          image: 'https://images.unsplash.com/photo-1489392191049-fc10c97e64b6?w=400&h=300&fit=crop',
        });
      }
    }

    setIsGuest(true);
    router.replace('/(tabs)');
  };

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSearchQuery('');
    if (step === 'city') {
      if (states.length > 0) {
        setStep('state');
      } else {
        setStep('country');
      }
    } else if (step === 'state') {
      setStep('country');
    } else if (step === 'quick') {
      // From quick search, go back to normal flow
      setStep('country');
    }
  };

  const handleContinue = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const countryName = selectedCountryData?.name || '';

    setSelectedLocation({
      country: countryName,
      state: selectedState || undefined,
      city: selectedCity || '',
    });

    // Try to get or create the community in Supabase
    const dbCommunity = await getOrCreateCommunity(
      selectedCity || '',
      selectedState || null,
      countryName
    );

    if (dbCommunity) {
      // If user is logged in, join the community
      const user = await getCurrentUser();
      if (user) {
        await joinCommunity(user.id, dbCommunity.id);
      }

      // Set the community with real data
      setCurrentCommunity({
        id: dbCommunity.id,
        name: dbCommunity.name,
        city: dbCommunity.city,
        state: dbCommunity.state ?? undefined,
        country: dbCommunity.country,
        memberCount: dbCommunity.member_count,
        image: dbCommunity.image_url || 'https://images.unsplash.com/photo-1489392191049-fc10c97e64b6?w=400&h=300&fit=crop',
      });
    } else {
      // Fallback to mock community if Supabase fails
      const matchingCommunity = MOCK_COMMUNITIES.find(
        (c) => c.city.toLowerCase() === selectedCity?.toLowerCase()
      );

      if (matchingCommunity) {
        setCurrentCommunity(matchingCommunity);
      } else {
        setCurrentCommunity({
          id: 'custom',
          name: `${selectedCity} Africans`,
          city: selectedCity || '',
          state: selectedState ?? undefined,
          country: countryName,
          memberCount: 1,
          image: 'https://images.unsplash.com/photo-1489392191049-fc10c97e64b6?w=400&h=300&fit=crop',
        });
      }
    }

    setIsGuest(true);
    router.replace('/(tabs)');
  };

  const canContinue = selectedCountry && selectedCity;

  const getStepTitle = () => {
    switch (step) {
      case 'quick':
        return 'Switch City';
      case 'country':
        return 'Select Your Country';
      case 'state':
        return `Select Your ${selectedCountryData?.code === 'US' ? 'State' : 'Region'}`;
      case 'city':
        return 'Select Your City';
    }
  };

  const getStepSubtitle = () => {
    switch (step) {
      case 'quick':
        return 'Search any city to switch instantly';
      case 'country':
        return 'Where are you located?';
      case 'state':
        return selectedCountryData?.name || '';
      case 'city':
        return `${selectedState ? selectedState + ', ' : ''}${selectedCountryData?.name || ''}`;
    }
  };

  const renderList = () => {
    switch (step) {
      case 'quick':
        return (
          <>
            {/* Option to use full flow */}
            <Animated.View entering={FadeInUp.duration(300)}>
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setStep('country');
                  setSearchQuery('');
                }}
                className="flex-row items-center p-4 rounded-2xl mb-4 bg-forest-50 border border-forest-200"
              >
                <View className="w-10 h-10 rounded-full items-center justify-center mr-3 bg-forest-100">
                  <Globe size={20} color="#1B4D3E" />
                </View>
                <View className="flex-1">
                  <Text className="font-semibold text-forest-700">Browse by Country</Text>
                  <Text className="text-forest-600 text-xs">Select country → state → city</Text>
                </View>
                <ChevronRight size={20} color="#1B4D3E" />
              </Pressable>
            </Animated.View>

            {/* All cities list */}
            <Text className="text-gray-500 text-xs font-medium mb-2 ml-1">
              {searchQuery ? 'SEARCH RESULTS' : 'ALL AVAILABLE CITIES'}
            </Text>
            {quickSearchCities.slice(0, 20).map((cityOption, index) => (
              <Animated.View
                key={`${cityOption.city}-${cityOption.state}`}
                entering={FadeInUp.duration(300).delay(index * 20)}
              >
                <Pressable
                  onPress={() => handleQuickCitySelect(cityOption)}
                  className="flex-row items-center p-4 rounded-2xl mb-2 bg-white"
                >
                  <View className="w-10 h-10 rounded-full items-center justify-center mr-3 bg-terracotta-50">
                    <Zap size={20} color="#D4673A" />
                  </View>
                  <View className="flex-1">
                    <Text className="font-medium text-base text-warmBrown">
                      {cityOption.city}
                    </Text>
                    <Text className="text-gray-500 text-sm">
                      {cityOption.state}, {cityOption.country}
                    </Text>
                  </View>
                  <ArrowRight size={18} color="#9CA3AF" />
                </Pressable>
              </Animated.View>
            ))}
          </>
        );

      case 'country':
        return filteredCountries.map((country, index) => (
          <Animated.View
            key={country.code}
            entering={FadeInUp.duration(300).delay(index * 30)}
          >
            <Pressable
              onPress={() => handleCountrySelect(country.code)}
              className={`flex-row items-center p-4 rounded-2xl mb-2 ${
                selectedCountry === country.code ? 'bg-terracotta-500' : 'bg-white'
              }`}
            >
              <View
                className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${
                  selectedCountry === country.code ? 'bg-white/20' : 'bg-terracotta-50'
                }`}
              >
                <Globe
                  size={20}
                  color={selectedCountry === country.code ? '#FFFFFF' : '#D4673A'}
                />
              </View>
              <Text
                className={`flex-1 font-medium text-base ${
                  selectedCountry === country.code ? 'text-white' : 'text-warmBrown'
                }`}
              >
                {country.name}
              </Text>
              {selectedCountry === country.code ? (
                <Check size={20} color="#FFFFFF" />
              ) : (
                <ChevronRight size={20} color="#9CA3AF" />
              )}
            </Pressable>
          </Animated.View>
        ));

      case 'state':
        return filteredStates.map((state, index) => (
          <Animated.View
            key={state}
            entering={FadeInUp.duration(300).delay(index * 30)}
          >
            <Pressable
              onPress={() => handleStateSelect(state)}
              className={`flex-row items-center p-4 rounded-2xl mb-2 ${
                selectedState === state ? 'bg-terracotta-500' : 'bg-white'
              }`}
            >
              <View
                className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${
                  selectedState === state ? 'bg-white/20' : 'bg-forest-50'
                }`}
              >
                <MapPin
                  size={20}
                  color={selectedState === state ? '#FFFFFF' : '#1B4D3E'}
                />
              </View>
              <Text
                className={`flex-1 font-medium text-base ${
                  selectedState === state ? 'text-white' : 'text-warmBrown'
                }`}
              >
                {state}
              </Text>
              {selectedState === state ? (
                <Check size={20} color="#FFFFFF" />
              ) : (
                <ChevronRight size={20} color="#9CA3AF" />
              )}
            </Pressable>
          </Animated.View>
        ));

      case 'city':
        return filteredCities.map((city, index) => (
          <Animated.View
            key={city}
            entering={FadeInUp.duration(300).delay(index * 30)}
          >
            <Pressable
              onPress={() => handleCitySelect(city)}
              className={`flex-row items-center p-4 rounded-2xl mb-2 ${
                selectedCity === city ? 'bg-terracotta-500' : 'bg-white'
              }`}
            >
              <View
                className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${
                  selectedCity === city ? 'bg-white/20' : 'bg-gold-50'
                }`}
              >
                <MapPin
                  size={20}
                  color={selectedCity === city ? '#FFFFFF' : '#C9A227'}
                />
              </View>
              <Text
                className={`flex-1 font-medium text-base ${
                  selectedCity === city ? 'text-white' : 'text-warmBrown'
                }`}
              >
                {city}
              </Text>
              {selectedCity === city && <Check size={20} color="#FFFFFF" />}
            </Pressable>
          </Animated.View>
        ));
    }
  };

  return (
    <View className="flex-1 bg-cream">
      <SafeAreaView edges={['top']} className="flex-1">
        {/* Header */}
        <Animated.View entering={FadeIn.duration(300)} className="px-5 pt-4 pb-2">
          <View className="flex-row items-center mb-4">
            {step === 'quick' ? (
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.back();
                }}
                className="bg-white rounded-full p-2 mr-3 shadow-sm"
              >
                <X size={24} color="#2D1F1A" />
              </Pressable>
            ) : step !== 'country' ? (
              <Pressable
                onPress={handleBack}
                className="bg-white rounded-full p-2 mr-3 shadow-sm"
              >
                <ChevronLeft size={24} color="#2D1F1A" />
              </Pressable>
            ) : isChangingLocation ? (
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.back();
                }}
                className="bg-white rounded-full p-2 mr-3 shadow-sm"
              >
                <X size={24} color="#2D1F1A" />
              </Pressable>
            ) : null}
            <View className="flex-1">
              <Text className="text-2xl font-bold text-warmBrown">{getStepTitle()}</Text>
              <Text className="text-gray-500 text-sm mt-0.5">{getStepSubtitle()}</Text>
            </View>
          </View>

          {/* Progress - hide for quick mode */}
          {step !== 'quick' && (
            <View className="flex-row mb-4">
              <View className={`flex-1 h-1 rounded-full mx-0.5 ${selectedCountry ? 'bg-terracotta-500' : 'bg-gray-200'}`} />
              <View className={`flex-1 h-1 rounded-full mx-0.5 ${selectedState || (selectedCountry && states.length === 0) ? 'bg-terracotta-500' : 'bg-gray-200'}`} />
              <View className={`flex-1 h-1 rounded-full mx-0.5 ${selectedCity ? 'bg-terracotta-500' : 'bg-gray-200'}`} />
            </View>
          )}

          {/* Search */}
          <View className="flex-row items-center bg-white rounded-2xl px-4 py-3 shadow-sm">
            <Search size={20} color="#8B7355" />
            <TextInput
              placeholder={step === 'quick' ? 'Search any city (e.g. Denver, Atlanta)...' : `Search ${step === 'country' ? 'countries' : step === 'state' ? 'states/regions' : 'cities'}...`}
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
              className="flex-1 ml-3 text-warmBrown text-base"
              autoFocus={step === 'quick'}
            />
            {searchQuery.length > 0 && (
              <Pressable
                onPress={() => setSearchQuery('')}
                className="p-1"
              >
                <X size={18} color="#9CA3AF" />
              </Pressable>
            )}
          </View>
        </Animated.View>

        {/* List */}
        <ScrollView
          className="flex-1 px-5 pt-4"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {renderList()}
          <View className="h-32" />
        </ScrollView>

        {/* Bottom Button */}
        {step === 'city' && (
          <View className="absolute bottom-0 left-0 right-0 bg-cream border-t border-gray-100">
            <SafeAreaView edges={['bottom']}>
              <View className="px-6 pt-4 pb-2">
                <Pressable onPress={handleContinue} disabled={!canContinue}>
                  <LinearGradient
                    colors={canContinue ? ['#D4673A', '#B85430'] : ['#D1D5DB', '#9CA3AF']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{
                      borderRadius: 16,
                      paddingVertical: 18,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Text className="text-white font-bold text-lg">
                      Browse Community
                    </Text>
                    <ArrowRight size={20} color="#FFFFFF" style={{ marginLeft: 8 }} />
                  </LinearGradient>
                </Pressable>
                <Text className="text-gray-400 text-xs text-center mt-2">
                  You can sign up later to post and interact
                </Text>
              </View>
            </SafeAreaView>
          </View>
        )}
      </SafeAreaView>
    </View>
  );
}
