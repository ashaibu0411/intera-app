import React, { useMemo, useState } from 'react';
import { View, Text, Pressable, TextInput, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Sparkles } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useStore } from '@/lib/store';
import { supabase } from '@/lib/supabase';
import { generateCommunityDigest } from '@/lib/aiCommunityDigest';

export default function DigestsScreen() {
  const currentUser = useStore((s) => s.currentUser);
  const isGuest = useStore((s) => s.isGuest);

  const defaultCity = useMemo(() => {
    const loc = String(currentUser?.location || '').trim();
    // naive: first chunk is usually city
    return loc.split(',')[0]?.trim() || '';
  }, [currentUser?.location]);

  const [city, setCity] = useState(defaultCity);
  const [neighborhood, setNeighborhood] = useState('');
  const [frequency, setFrequency] = useState<'daily' | 'weekly'>('weekly');
  const [enabled, setEnabled] = useState(true);

  const [busy, setBusy] = useState(false);
  const [digestText, setDigestText] = useState('');

  const saveSubscription = async () => {
    if (isGuest || !currentUser?.id) {
      router.push('/signup');
      return;
    }
    const c = city.trim();
    if (!c) {
      Alert.alert('Missing city', 'Please enter a city.');
      return;
    }

    setBusy(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const { error } = await supabase.from('digest_subscriptions').upsert(
        {
          user_id: currentUser.id,
          city: c,
          neighborhood: neighborhood.trim() || null,
          frequency,
          enabled,
        },
        { onConflict: 'user_id,city,neighborhood,frequency' }
      );
      if (error) throw error;
      Alert.alert('Saved', 'Your digest settings were saved.');
    } catch (e) {
      console.log('[Digests] save failed:', e);
      Alert.alert('Error', 'Could not save settings. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const generatePreview = async () => {
    if (isGuest || !currentUser?.id) {
      router.push('/signup');
      return;
    }
    const c = city.trim();
    if (!c) {
      Alert.alert('Missing city', 'Please enter a city.');
      return;
    }

    setBusy(true);
    setDigestText('');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const res = await generateCommunityDigest({
        userId: currentUser.id,
        city: c,
        neighborhood: neighborhood.trim() || null,
        frequency,
      });
      setDigestText(res.digest_text || '');
    } catch (e) {
      console.log('[Digests] preview failed:', e);
      Alert.alert('Error', 'Could not generate a digest preview.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <View className="flex-1 bg-cream">
      <SafeAreaView edges={['top']} className="flex-1">
        <View className="px-5 pt-4 pb-3 flex-row items-center">
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.back();
            }}
            className="mr-3 p-1"
            hitSlop={8}
          >
            <ArrowLeft size={24} color="#2D1F1A" />
          </Pressable>
          <Text className="text-2xl font-bold text-warmBrown">Community Digest</Text>
        </View>

        <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
          <View className="bg-white rounded-2xl p-4 shadow-sm">
            <Text className="text-warmBrown font-semibold">City</Text>
            <TextInput
              value={city}
              onChangeText={setCity}
              placeholder="e.g. Toronto"
              placeholderTextColor="#9CA3AF"
              className="mt-2 bg-gray-50 rounded-xl px-4 py-3 text-warmBrown"
            />

            <Text className="text-warmBrown font-semibold mt-4">Neighborhood (optional)</Text>
            <TextInput
              value={neighborhood}
              onChangeText={setNeighborhood}
              placeholder="e.g. Downtown"
              placeholderTextColor="#9CA3AF"
              className="mt-2 bg-gray-50 rounded-xl px-4 py-3 text-warmBrown"
            />

            <View className="flex-row mt-4">
              <Pressable
                onPress={() => setFrequency('daily')}
                className={`flex-1 py-3 rounded-xl mr-2 ${frequency === 'daily' ? 'bg-terracotta-500' : 'bg-gray-100'}`}
              >
                <Text className={`text-center font-bold ${frequency === 'daily' ? 'text-white' : 'text-warmBrown'}`}>Daily</Text>
              </Pressable>
              <Pressable
                onPress={() => setFrequency('weekly')}
                className={`flex-1 py-3 rounded-xl ml-2 ${frequency === 'weekly' ? 'bg-terracotta-500' : 'bg-gray-100'}`}
              >
                <Text className={`text-center font-bold ${frequency === 'weekly' ? 'text-white' : 'text-warmBrown'}`}>Weekly</Text>
              </Pressable>
            </View>

            <Pressable
              onPress={() => setEnabled((v) => !v)}
              className="mt-4 flex-row items-center justify-between bg-gray-50 rounded-xl px-4 py-3"
            >
              <Text className="text-warmBrown font-semibold">Enabled</Text>
              <Text className="text-gray-500">{enabled ? 'Yes' : 'No'}</Text>
            </Pressable>

            <View className="flex-row mt-4">
              <Pressable onPress={saveSubscription} disabled={busy} className="flex-1 mr-2 bg-forest-600 rounded-xl py-3">
                {busy ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-bold text-center">Save</Text>}
              </Pressable>
              <Pressable onPress={generatePreview} disabled={busy} className="flex-1 ml-2 bg-black rounded-xl py-3 flex-row items-center justify-center">
                <Sparkles size={16} color="#fff" />
                <Text className="text-white font-bold text-center ml-2">Preview</Text>
              </Pressable>
            </View>
          </View>

          {digestText ? (
            <View className="bg-white rounded-2xl p-4 shadow-sm mt-4 mb-10">
              <Text className="text-warmBrown font-bold mb-2">Preview</Text>
              <Text className="text-gray-700 leading-6">{digestText}</Text>
            </View>
          ) : (
            <View className="h-10" />
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

