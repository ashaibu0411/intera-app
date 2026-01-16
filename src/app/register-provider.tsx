import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, ActivityIndicator, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Check, MapPin, Users, Home, ChefHat, Wrench, GraduationCap, Sparkles, Phone, Mail } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useStore } from '@/lib/store';
import { upsertMyServiceProviderProfile } from '@/lib/marketplace-api';
import { createPost } from '@/lib/posts';

const CATEGORIES: Array<{ key: string; label: string; icon: any }> = [
  { key: 'house_help', label: 'House help', icon: Home },
  { key: 'cook', label: 'Cook', icon: ChefHat },
  { key: 'nanny', label: 'Nanny', icon: Users },
  { key: 'plumber', label: 'Plumber', icon: Wrench },
  { key: 'tutor', label: 'Tutor', icon: GraduationCap },
  { key: 'other', label: 'Other', icon: Sparkles },
];

export default function RegisterProviderScreen() {
  const currentUser = useStore((s) => s.currentUser);
  const selectedLocation = useStore((s) => s.selectedLocation);
  const currentCommunity = useStore((s) => s.currentCommunity);

  const [category, setCategory] = useState<string>('house_help');
  const [title, setTitle] = useState('House help');
  const [bio, setBio] = useState('');
  const [skills, setSkills] = useState('');
  const [isAvailable, setIsAvailable] = useState(true);
  const [availabilityNote, setAvailabilityNote] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [scope, setScope] = useState<'neighborhood' | 'city' | 'global'>(selectedLocation?.neighborhood ? 'neighborhood' : 'city');
  const [saving, setSaving] = useState(false);
  const [announceToFeed, setAnnounceToFeed] = useState(true);

  const loc = useMemo(() => {
    const city = selectedLocation?.city || 'Denver';
    const country = selectedLocation?.country || 'Unknown';
    const adminArea = selectedLocation?.state || null;
    const neighborhood = selectedLocation?.neighborhood?.trim() || null;
    const base = `${city}, ${adminArea || country}`;
    const locationLabel = neighborhood ? `${base} · ${neighborhood}` : base;
    return { city, country, adminArea, neighborhood, locationLabel };
  }, [selectedLocation]);

  const canSave = !!currentUser?.id && title.trim().length > 0 && bio.trim().length >= 20;

  const handleSave = async () => {
    if (!canSave || !currentUser?.id || saving) return;
    setSaving(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await upsertMyServiceProviderProfile(currentUser.id, {
        category,
        title: title.trim(),
        bio: bio.trim(),
        skills: skills.split(',').map((s) => s.trim()).filter(Boolean),
        is_available: isAvailable,
        availability_note: availabilityNote.trim() || null,
        contact_phone: phone.trim() || null,
        contact_email: (email.trim() || currentUser.email || '').trim() || null,
        country: loc.country,
        admin_area: loc.adminArea,
        city: loc.city,
        neighborhood: loc.neighborhood,
        location_label: loc.locationLabel,
        scope,
      });

      if (announceToFeed) {
        const parts = [
          loc.city,
          loc.neighborhood || null,
          loc.adminArea || null,
          loc.country,
        ].filter(Boolean) as string[];
        const postLocation = parts.join(', ');
        const content = `New helper available: ${currentUser.name} (${title.trim()})\n\nOpen Serve & Connect → Trusted Helpers to view profile and reviews.`;
        await createPost(currentUser.id, content, [], postLocation, currentCommunity?.id || undefined);
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace('/trusted-providers');
    } catch {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setSaving(false);
    }
  };

  if (!currentUser) {
    return (
      <View className="flex-1 bg-cream items-center justify-center px-6">
        <Text className="text-warmBrown text-lg text-center">Please sign in to create a provider profile.</Text>
        <Pressable onPress={() => router.push('/signup')} className="mt-4">
          <Text className="text-terracotta-500 font-semibold">Sign In</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-cream">
      <SafeAreaView edges={['top']} className="flex-1">
        <View className="px-5 pt-4 pb-3">
          <View className="flex-row items-center justify-between">
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.back();
              }}
              className="bg-white rounded-full p-2 shadow-sm"
            >
              <ChevronLeft size={22} color="#2D1F1A" />
            </Pressable>
            <Text className="text-lg font-bold text-warmBrown">Provider Profile</Text>
            <Pressable onPress={handleSave} className="bg-forest-600 rounded-full px-4 py-2">
              {saving ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-semibold">Save</Text>}
            </Pressable>
          </View>
          <View className="flex-row items-center mt-2">
            <MapPin size={14} color="#D4673A" />
            <Text className="text-gray-500 ml-1">{loc.locationLabel}</Text>
          </View>
        </View>

        <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
          <View className="bg-white rounded-2xl p-4 shadow-sm">
            <Text className="text-warmBrown font-semibold mb-3">Category</Text>
            <View className="flex-row flex-wrap gap-2">
              {CATEGORIES.map((c) => {
                const active = category === c.key;
                const Icon = c.icon;
                return (
                  <Pressable
                    key={c.key}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setCategory(c.key);
                      setTitle(c.label);
                    }}
                    className={`px-3 py-2 rounded-full flex-row items-center ${active ? 'bg-terracotta-500' : 'bg-gray-100'}`}
                  >
                    <Icon size={14} color={active ? '#fff' : '#8B7355'} />
                    <Text className={`ml-2 font-semibold ${active ? 'text-white' : 'text-warmBrown'}`}>{c.label}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View className="mt-3 bg-white rounded-2xl p-4 shadow-sm">
            <Text className="text-warmBrown font-semibold mb-2">Title</Text>
            <TextInput value={title} onChangeText={setTitle} placeholder="e.g. Private Cook" placeholderTextColor="#9CA3AF" className="text-warmBrown" />
          </View>

          <View className="mt-3 bg-white rounded-2xl p-4 shadow-sm">
            <Text className="text-warmBrown font-semibold mb-2">About you (min 20 chars)</Text>
            <TextInput
              value={bio}
              onChangeText={setBio}
              placeholder="Tell homeowners about your experience…"
              placeholderTextColor="#9CA3AF"
              multiline
              className="text-warmBrown"
              style={{ minHeight: 110, textAlignVertical: 'top' }}
            />
            <Text className="text-gray-400 text-xs mt-1">{bio.length}/20 minimum</Text>
          </View>

          <View className="mt-3 bg-white rounded-2xl p-4 shadow-sm">
            <Text className="text-warmBrown font-semibold mb-2">Skills (comma separated)</Text>
            <TextInput value={skills} onChangeText={setSkills} placeholder="e.g. cleaning, ironing, childcare" placeholderTextColor="#9CA3AF" className="text-warmBrown" />
          </View>

          <View className="mt-3 bg-white rounded-2xl p-4 shadow-sm">
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-warmBrown font-semibold">Available</Text>
                <Text className="text-gray-500 text-sm">Show up in search</Text>
              </View>
              <Switch value={isAvailable} onValueChange={setIsAvailable} trackColor={{ false: '#D1D5DB', true: '#1B4D3E' }} thumbColor="#fff" />
            </View>
            <TextInput
              value={availabilityNote}
              onChangeText={setAvailabilityNote}
              placeholder="Availability note (optional)"
              placeholderTextColor="#9CA3AF"
              className="text-warmBrown mt-3 bg-gray-50 rounded-xl px-3 py-2"
            />
          </View>

          <View className="mt-3 bg-white rounded-2xl p-4 shadow-sm">
            <Text className="text-warmBrown font-semibold mb-2">Reach</Text>
            <View className="flex-row gap-2">
              {(['neighborhood', 'city', 'global'] as const).map((s) => {
                const active = scope === s;
                return (
                  <Pressable key={s} onPress={() => setScope(s)} className={`flex-1 py-3 rounded-xl items-center ${active ? 'bg-forest-600' : 'bg-gray-100'}`}>
                    <Text className={`font-semibold ${active ? 'text-white' : 'text-gray-700'}`}>{s}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View className="mt-3 bg-white rounded-2xl p-4 shadow-sm">
            <Text className="text-warmBrown font-semibold mb-2">Contact (optional)</Text>
            <View className="flex-row items-center bg-gray-50 rounded-xl px-3 py-2 mb-2">
              <Phone size={16} color="#8B7355" />
              <TextInput value={phone} onChangeText={setPhone} placeholder="Phone" placeholderTextColor="#9CA3AF" className="flex-1 ml-2 text-warmBrown" />
            </View>
            <View className="flex-row items-center bg-gray-50 rounded-xl px-3 py-2">
              <Mail size={16} color="#8B7355" />
              <TextInput value={email} onChangeText={setEmail} placeholder={currentUser.email ?? 'Email'} placeholderTextColor="#9CA3AF" className="flex-1 ml-2 text-warmBrown" />
            </View>
          </View>

          <View className="mt-3 bg-white rounded-2xl p-4 shadow-sm">
            <View className="flex-row items-center justify-between">
              <View className="flex-1 pr-3">
                <Text className="text-warmBrown font-semibold">Announce to community feed</Text>
                <Text className="text-gray-500 text-sm mt-1">
                  Posts a short update in your neighborhood/city so people can find you faster.
                </Text>
              </View>
              <Switch
                value={announceToFeed}
                onValueChange={setAnnounceToFeed}
                trackColor={{ false: '#D1D5DB', true: '#1B4D3E' }}
                thumbColor="#fff"
              />
            </View>
          </View>

          <Pressable
            onPress={handleSave}
            disabled={!canSave || saving}
            className={`mt-4 rounded-2xl py-4 items-center ${canSave && !saving ? 'bg-forest-700' : 'bg-gray-300'}`}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <View className="flex-row items-center">
                <Check size={18} color="#fff" />
                <Text className="text-white font-bold ml-2">Save Profile</Text>
              </View>
            )}
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

