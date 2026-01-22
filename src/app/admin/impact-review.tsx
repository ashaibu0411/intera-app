import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator, Alert, TextInput } from 'react-native';
import { Stack, router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { ChevronLeft, CheckCircle2, XCircle, RefreshCw, Shield } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';

type Row = {
  id: string;
  org_type: 'school' | 'nonprofit';
  org_name: string;
  country: string;
  city: string | null;
  mission: string;
  status: string;
  created_at: string;
  owner_id: string;
};

export default function AdminImpactReviewScreen() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [items, setItems] = useState<Row[]>([]);
  const [noteById, setNoteById] = useState<Record<string, string>>({});

  const checkAdmin = useCallback(async () => {
    try {
      const { data, error } = await supabase.rpc('is_admin');
      if (error) throw error;
      setIsAdmin(Boolean(data));
    } catch (e) {
      setIsAdmin(false);
    }
  }, []);

  const load = useCallback(async () => {
    setBusy(true);
    try {
      const { data, error } = await supabase
        .from('impact_stories')
        .select('id, org_type, org_name, country, city, mission, status, created_at, owner_id')
        .eq('status', 'pending_review')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setItems((data || []) as Row[]);
    } catch (e) {
      Alert.alert('Error', String((e as any)?.message || e));
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    checkAdmin();
  }, [checkAdmin]);

  useEffect(() => {
    if (isAdmin) load();
  }, [isAdmin, load]);

  const subtitle = useMemo(() => {
    if (isAdmin === null) return 'Checking access…';
    if (isAdmin === false) return 'You do not have access to this page.';
    return 'Approve or pause stories submitted for review.';
  }, [isAdmin]);

  const approve = async (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const note = (noteById[id] || '').trim() || null;
    try {
      const { data: u } = await supabase.auth.getUser();
      const reviewerId = u.user?.id || null;

      const { error } = await supabase
        .from('impact_stories')
        .update({ status: 'published', review_note: note, reviewed_at: new Date().toISOString(), reviewed_by: reviewerId })
        .eq('id', id);
      if (error) throw error;
      await load();
    } catch (e) {
      Alert.alert('Error', String((e as any)?.message || e));
    }
  };

  const pause = async (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const note = (noteById[id] || '').trim() || 'Paused by admin.';
    try {
      const { data: u } = await supabase.auth.getUser();
      const reviewerId = u.user?.id || null;

      const { error } = await supabase
        .from('impact_stories')
        .update({ status: 'paused', review_note: note, reviewed_at: new Date().toISOString(), reviewed_by: reviewerId })
        .eq('id', id);
      if (error) throw error;
      await load();
    } catch (e) {
      Alert.alert('Error', String((e as any)?.message || e));
    }
  };

  return (
    <View className="flex-1 bg-cream">
      <Stack.Screen
        options={{
          title: 'Admin Review',
          headerStyle: { backgroundColor: '#FDF7F2' },
          headerShadowVisible: false,
          headerLeft: () => (
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.back();
              }}
              className="p-2 -ml-2"
            >
              <ChevronLeft size={26} color="#1F2937" />
            </Pressable>
          ),
          headerRight: () =>
            isAdmin ? (
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  load();
                }}
                className="mr-1"
              >
                <View className="flex-row items-center">
                  <RefreshCw size={18} color="#C45C26" />
                  <Text className="ml-1 text-terracotta-500 font-semibold">Refresh</Text>
                </View>
              </Pressable>
            ) : null,
        }}
      />

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        <View className="bg-white rounded-2xl p-4 border border-gray-100">
          <View className="flex-row items-center">
            <View className="bg-forest-50 rounded-full p-2.5">
              <Shield size={18} color="#1B4D3E" />
            </View>
            <View className="ml-3 flex-1">
              <Text className="text-warmBrown font-bold">Impact Story Review</Text>
              <Text className="text-gray-500 text-sm mt-0.5">{subtitle}</Text>
            </View>
          </View>
        </View>

        {isAdmin === null ? (
          <View className="mt-6 items-center">
            <ActivityIndicator />
          </View>
        ) : isAdmin === false ? (
          <View className="mt-6 bg-red-50 border border-red-100 rounded-2xl p-4">
            <Text className="text-red-700 font-semibold">Access denied</Text>
            <Text className="text-red-700 mt-1">Ask an admin to grant you access.</Text>
          </View>
        ) : busy ? (
          <View className="mt-6 items-center">
            <ActivityIndicator />
            <Text className="text-gray-500 mt-2">Loading…</Text>
          </View>
        ) : items.length === 0 ? (
          <View className="mt-6 bg-white border border-gray-100 rounded-2xl p-4">
            <Text className="text-warmBrown font-bold">No pending stories</Text>
            <Text className="text-gray-500 mt-1">You’re all caught up.</Text>
          </View>
        ) : (
          <View className="mt-4">
            {items.map((it) => (
              <View key={it.id} className="bg-white rounded-2xl p-4 border border-gray-100 mb-3">
                <View className="flex-row items-center justify-between">
                  <Text className="text-warmBrown font-bold flex-1 pr-3" numberOfLines={1}>
                    {it.org_name}
                  </Text>
                  <View className={`px-2.5 py-1 rounded-full ${it.org_type === 'school' ? 'bg-emerald-50' : 'bg-indigo-50'}`}>
                    <Text className={`${it.org_type === 'school' ? 'text-emerald-700' : 'text-indigo-700'} text-xs font-semibold`}>
                      {it.org_type === 'school' ? 'School' : 'Nonprofit'}
                    </Text>
                  </View>
                </View>
                <Text className="text-gray-500 text-sm mt-1" numberOfLines={1}>
                  {[it.city, it.country].filter(Boolean).join(', ')}
                </Text>
                <Text className="text-gray-700 leading-6 mt-3" numberOfLines={4}>
                  {it.mission}
                </Text>

                <Text className="text-gray-500 text-sm mt-3">Admin note (optional)</Text>
                <TextInput
                  value={noteById[it.id] || ''}
                  onChangeText={(t) => setNoteById((p) => ({ ...p, [it.id]: t }))}
                  placeholder="Why approved/paused…"
                  placeholderTextColor="#9CA3AF"
                  multiline
                  className="mt-2 bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-gray-900"
                  style={{ minHeight: 80, textAlignVertical: 'top' }}
                />

                <View className="flex-row mt-3">
                  <Pressable onPress={() => approve(it.id)} className="flex-1 bg-emerald-600 rounded-xl px-4 py-3 flex-row items-center justify-center mr-2">
                    <CheckCircle2 size={18} color="#fff" />
                    <Text className="text-white font-semibold ml-2">Approve</Text>
                  </Pressable>
                  <Pressable onPress={() => pause(it.id)} className="flex-1 bg-white border border-gray-200 rounded-xl px-4 py-3 flex-row items-center justify-center">
                    <XCircle size={18} color="#111827" />
                    <Text className="text-gray-900 font-semibold ml-2">Pause</Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

