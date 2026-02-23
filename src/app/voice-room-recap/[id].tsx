import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, ActivityIndicator, Alert, Switch, Share } from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { ChevronLeft, Save } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import type { DbVoiceRoom } from '@/lib/supabase';
import { getRecap, upsertRecap } from '@/lib/voiceRooms';
import { useStore } from '@/lib/store';
import { createPost } from '@/lib/posts';
import { buildVoiceRoomRecapPostContent } from '@/lib/voiceRoomMarkers';

export default function VoiceRoomRecapScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const currentUser = useStore((s) => s.currentUser);
  const currentCommunity = useStore((s) => s.currentCommunity);

  const [room, setRoom] = useState<DbVoiceRoom | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [summary, setSummary] = useState('');
  const [h1, setH1] = useState('');
  const [h2, setH2] = useState('');
  const [h3, setH3] = useState('');
  const [published, setPublished] = useState(false);

  const isHost = useMemo(() => {
    if (!currentUser?.id || !room) return false;
    return room.creator_id === currentUser.id;
  }, [currentUser?.id, room]);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const { data } = await supabase.from('voice_rooms').select('*').eq('id', id).single();
        if (cancelled) return;
        setRoom((data as DbVoiceRoom) ?? null);

        const recap = await getRecap(String(id));
        if (cancelled) return;
        if (recap) {
          setSummary(recap.summary || '');
          setPublished(!!recap.published);
          const hs = recap.highlights || [];
          setH1(hs[0] || '');
          setH2(hs[1] || '');
          setH3(hs[2] || '');
        }
      } catch (e: any) {
        if (!cancelled) Alert.alert('Error', String(e?.message ?? e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const canSave = !!currentUser?.id && !!id && summary.trim().length > 0;
  const highlightList = useMemo(() => [h1, h2, h3].map((x) => x.trim()).filter(Boolean), [h1, h2, h3]);

  const save = async () => {
    if (!currentUser?.id || !id) return;
    if (!canSave) {
      Alert.alert('Add a recap', 'Please write a short recap before saving.');
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSaving(true);
    try {
      await upsertRecap({
        roomId: String(id),
        userId: currentUser.id,
        summary: summary.trim(),
        highlights: highlightList,
        published,
      });
      Alert.alert('Saved', published ? 'Recap is now visible.' : 'Recap saved (not public).');
      router.replace(`/voice-room/${id}` as any);
    } catch (e: any) {
      Alert.alert('Could not save', String(e?.message ?? e));
    } finally {
      setSaving(false);
    }
  };

  const shareRecap = async () => {
    if (!id || !room) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const msg = buildVoiceRoomRecapPostContent({
      roomId: String(id),
      roomTitle: room.title,
      summary,
      highlights: highlightList,
    });
    try {
      await Share.share({ message: msg, title: 'Share Room Recap' });
    } catch {}
  };

  const postToFeed = async () => {
    if (!currentUser?.id || !id || !room) return;
    if (!isHost) {
      Alert.alert('Host only', 'Only the room host can post the recap to the feed right now.');
      return;
    }
    if (!summary.trim()) {
      Alert.alert('Add a recap', 'Please write a recap before posting.');
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSaving(true);
    try {
      // Save recap first (published state remains your toggle)
      await upsertRecap({
        roomId: String(id),
        userId: currentUser.id,
        summary: summary.trim(),
        highlights: highlightList,
        published,
      });

      const content = buildVoiceRoomRecapPostContent({
        roomId: String(id),
        roomTitle: room.title,
        summary: summary.trim(),
        highlights: highlightList,
      });

      const location = room.city ? `${room.city} · Voice Room` : 'Voice Room';
      const data = await createPost(currentUser.id, content, [], location, currentCommunity?.id || undefined);

      Alert.alert('Posted', 'Recap posted to the feed.');
      router.replace(`/post/${data.id}` as any);
    } catch (e: any) {
      Alert.alert('Could not post', String(e?.message ?? e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <View className="flex-1 bg-cream">
      <Stack.Screen
        options={{
          title: 'Room Recap',
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
          headerRight: () => (
            <Pressable onPress={save} disabled={!canSave || saving}>
              <View className="flex-row items-center">
                {saving ? <ActivityIndicator /> : <Save size={18} color={canSave ? '#C45C26' : '#9CA3AF'} />}
                <Text className={`ml-1 font-semibold ${canSave && !saving ? 'text-terracotta-500' : 'text-gray-400'}`}>
                  Save
                </Text>
              </View>
            </Pressable>
          ),
        }}
      />

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator />
          <Text className="text-gray-500 mt-2">Loading…</Text>
        </View>
      ) : !room ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-gray-500">Room not found</Text>
        </View>
      ) : (
        <ScrollView className="flex-1" contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
          <View className="bg-white rounded-2xl p-4 border border-gray-100">
            <Text className="text-warmBrown font-bold text-lg">{room.title}</Text>
            <Text className="text-gray-500 mt-1">Add a recap and up to 3 highlights.</Text>
          </View>

          {!isHost && (
            <View className="mt-4 bg-amber-50 border border-amber-200 rounded-2xl p-4">
              <Text className="text-amber-800 font-semibold">Host only</Text>
              <Text className="text-amber-800 mt-1">Only the room creator can save the recap right now.</Text>
            </View>
          )}

          <View className="mt-4 bg-white rounded-2xl p-4 border border-gray-100">
            <Text className="text-warmBrown font-bold">Recap *</Text>
            <TextInput
              value={summary}
              onChangeText={setSummary}
              editable={isHost}
              placeholder="What happened? Key takeaways? Next steps?"
              placeholderTextColor="#9CA3AF"
              multiline
              className="mt-3 bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-warmBrown"
              style={{ minHeight: 140, textAlignVertical: 'top' }}
            />

            <View className="flex-row items-center justify-between mt-4">
              <View>
                <Text className="text-warmBrown font-bold">Publish recap</Text>
                <Text className="text-gray-500 text-sm mt-1">If on, others can view it.</Text>
              </View>
              <Switch value={published} onValueChange={setPublished} disabled={!isHost} />
            </View>
          </View>

          <View className="mt-4 bg-white rounded-2xl p-4 border border-gray-100">
            <Text className="text-warmBrown font-bold">Highlights (optional)</Text>
            <Text className="text-gray-500 text-sm mt-1">Short bullet lines (15–60s moments later).</Text>

            <TextInput value={h1} onChangeText={setH1} editable={isHost} placeholder="Highlight 1" placeholderTextColor="#9CA3AF" className="mt-3 bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-warmBrown" />
            <TextInput value={h2} onChangeText={setH2} editable={isHost} placeholder="Highlight 2" placeholderTextColor="#9CA3AF" className="mt-3 bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-warmBrown" />
            <TextInput value={h3} onChangeText={setH3} editable={isHost} placeholder="Highlight 3" placeholderTextColor="#9CA3AF" className="mt-3 bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-warmBrown" />
          </View>

          <View className="mt-4 bg-white rounded-2xl p-4 border border-gray-100">
            <Text className="text-warmBrown font-bold">Share / Publish</Text>
            <Text className="text-gray-500 text-sm mt-1">
              Share the recap now, or post it to the feed so others can open the room and recap.
            </Text>
            <View className="flex-row mt-3">
              <Pressable onPress={shareRecap} className="flex-1 bg-gray-100 rounded-xl px-4 py-3 items-center mr-2">
                <Text className="text-warmBrown font-semibold">Share</Text>
              </Pressable>
              <Pressable onPress={postToFeed} disabled={!isHost || saving} className={`flex-1 rounded-xl px-4 py-3 items-center ${isHost ? 'bg-terracotta-500' : 'bg-gray-200'}`}>
                <Text className={`font-semibold ${isHost ? 'text-white' : 'text-gray-500'}`}>Post to feed</Text>
              </Pressable>
            </View>
          </View>

          {isHost && (
            <Pressable
              onPress={save}
              disabled={!canSave || saving}
              className={`mt-5 rounded-2xl px-4 py-4 ${canSave && !saving ? 'bg-terracotta-500' : 'bg-gray-200'}`}
            >
              <Text className={`text-center font-semibold ${canSave && !saving ? 'text-white' : 'text-gray-500'}`}>
                {saving ? 'Saving…' : 'Save recap'}
              </Text>
            </Pressable>
          )}
        </ScrollView>
      )}
    </View>
  );
}

