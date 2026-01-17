import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, Pressable, ActivityIndicator, ScrollView } from 'react-native';
import { Stack, useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Mic, MicOff, Hand, Gift, Crown, UserPlus, X } from 'lucide-react-native';
import { LiveKitRoom, useRoomContext } from '@livekit/react-native';
import { useStore } from '@/lib/store';
import { supabase } from '@/lib/supabase';
import type { DbVoiceRoom, DbVoiceRoomParticipant, DbVoiceRoomHandRaise, DbGiftTransaction } from '@/lib/supabase';
import { getLiveKitToken, leaveRoom, lowerHand, raiseHand, upsertParticipant, updateParticipantRole } from '@/lib/voiceRooms';
import { sendGift } from '@/lib/giftService';

const GIFTS = [
  { id: 'heart', name: 'Heart', value: 1 },
  { id: 'star', name: 'Star', value: 5 },
  { id: 'flame', name: 'Fire', value: 10 },
  { id: 'gem', name: 'Diamond', value: 50 },
  { id: 'crown', name: 'Crown', value: 100 },
  { id: 'sparkle', name: 'Sparkle', value: 500 },
] as const;

type Tab = 'room' | 'gifts';

function MicSync({ enabled }: { enabled: boolean }) {
  const room = useRoomContext();
  useEffect(() => {
    room?.localParticipant?.setMicrophoneEnabled(enabled).catch(() => null);
  }, [enabled, room]);
  return null;
}

export default function VoiceRoomScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const currentUser = useStore((s) => s.currentUser);

  const [room, setRoom] = useState<DbVoiceRoom | null>(null);
  const [participants, setParticipants] = useState<DbVoiceRoomParticipant[]>([]);
  const [hands, setHands] = useState<DbVoiceRoomHandRaise[]>([]);
  const [gifts, setGifts] = useState<DbGiftTransaction[]>([]);
  const [tab, setTab] = useState<Tab>('room');

  const [lkUrl, setLkUrl] = useState<string | null>(null);
  const [lkToken, setLkToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [micEnabled, setMicEnabled] = useState(false);

  const me = useMemo(() => {
    if (!currentUser?.id || !id) return null;
    return participants.find((p) => p.user_id === currentUser.id) ?? null;
  }, [currentUser?.id, id, participants]);

  const isHost = useMemo(() => {
    if (!currentUser?.id || !room) return false;
    return room.creator_id === currentUser.id || me?.role === 'host' || me?.role === 'moderator';
  }, [currentUser?.id, me?.role, room]);

  const canSpeak = me?.role === 'host' || me?.role === 'moderator' || me?.role === 'speaker';

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        const { data } = await supabase.from('voice_rooms').select('*').eq('id', id).single();
        if (cancelled) return;
        setRoom(data as DbVoiceRoom);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    if (!id) return;

    const channel = supabase
      .channel(`voice-room:${id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'voice_room_participants', filter: `room_id=eq.${id}` },
        async () => {
          const { data } = await supabase.from('voice_room_participants').select('*').eq('room_id', id).order('joined_at', { ascending: true });
          setParticipants((data ?? []) as DbVoiceRoomParticipant[]);
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'voice_room_hand_raises', filter: `room_id=eq.${id}` },
        async () => {
          const { data } = await supabase.from('voice_room_hand_raises').select('*').eq('room_id', id).order('created_at', { ascending: true });
          setHands((data ?? []) as DbVoiceRoomHandRaise[]);
        }
      )
      .subscribe();

    // initial fetch
    (async () => {
      const [{ data: p }, { data: h }] = await Promise.all([
        supabase.from('voice_room_participants').select('*').eq('room_id', id).order('joined_at', { ascending: true }),
        supabase.from('voice_room_hand_raises').select('*').eq('room_id', id).order('created_at', { ascending: true }),
      ]);
      setParticipants((p ?? []) as DbVoiceRoomParticipant[]);
      setHands((h ?? []) as DbVoiceRoomHandRaise[]);
    })();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  useEffect(() => {
    if (!id) return;
    const channel = supabase
      .channel(`voice-room-gifts:${id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'gift_transactions', filter: `room_id=eq.${id}` }, async () => {
        const { data } = await supabase.from('gift_transactions').select('*').eq('room_id', id).order('created_at', { ascending: false }).limit(50);
        setGifts((data ?? []) as DbGiftTransaction[]);
      })
      .subscribe();

    (async () => {
      const { data } = await supabase.from('gift_transactions').select('*').eq('room_id', id).order('created_at', { ascending: false }).limit(50);
      setGifts((data ?? []) as DbGiftTransaction[]);
    })();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  useEffect(() => {
    if (!id || !currentUser?.id || !room) return;
    let cancelled = false;

    const join = async () => {
      // ensure participant row exists
      const role: DbVoiceRoomParticipant['role'] = room.creator_id === currentUser.id ? 'host' : 'listener';
      await upsertParticipant({ roomId: id, userId: currentUser.id, role });

      const tokenResp = await getLiveKitToken({
        roomName: room.provider_room_name,
        identity: currentUser.id,
        name: currentUser.name ?? undefined,
        canPublish: role !== 'listener',
      });

      if (cancelled) return;
      setLkUrl(tokenResp.url);
      setLkToken(tokenResp.token);
    };

    join().catch(() => {
      // keep UI stable; errors shown below
    });

    return () => {
      cancelled = true;
    };
  }, [currentUser?.id, currentUser?.name, id, room]);

  // If your role changes (host promotes you), refresh token so you can publish audio.
  useEffect(() => {
    if (!id || !currentUser?.id || !room || !me?.role) return;
    let cancelled = false;
    (async () => {
      const tokenResp = await getLiveKitToken({
        roomName: room.provider_room_name,
        identity: currentUser.id,
        name: currentUser.name ?? undefined,
        canPublish: me.role === 'host' || me.role === 'moderator' || me.role === 'speaker',
      });
      if (cancelled) return;
      setLkUrl(tokenResp.url);
      setLkToken(tokenResp.token);

      // If you got demoted, make sure mic is off.
      if (!(me.role === 'host' || me.role === 'moderator' || me.role === 'speaker')) {
        setMicEnabled(false);
      }
    })().catch(() => null);
    return () => {
      cancelled = true;
    };
  }, [currentUser?.id, currentUser?.name, id, me?.role, room]);

  // Ensure we clean up participant row on unmount.
  useEffect(() => {
    if (!id || !currentUser?.id) return;
    return () => {
      leaveRoom(id, currentUser.id).catch(() => null);
    };
  }, [currentUser?.id, id]);

  const toggleHand = async () => {
    if (!id || !currentUser?.id) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const already = !!hands.find((h) => h.user_id === currentUser.id);
    if (already) await lowerHand(id, currentUser.id);
    else await raiseHand(id, currentUser.id);
  };

  const promote = async (userId: string) => {
    if (!id) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await updateParticipantRole(id, userId, 'speaker');
    await lowerHand(id, userId);
  };

  const sendRoomGift = async (giftId: string, giftName: string, giftValue: number) => {
    if (!currentUser?.id || !room) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const recipientId = room.creator_id;
    const recipientName = 'Host';

    await sendGift({
      senderId: currentUser.id,
      senderName: currentUser.name ?? 'Someone',
      recipientId,
      recipientName: String(recipientName),
      giftId,
      giftName,
      giftValue,
      roomId: room.id,
      roomTitle: room.title,
    });
  };

  if (!id) return null;

  return (
    <View className="flex-1 bg-[#0A0A0F]">
      <Stack.Screen
        options={{
          headerShown: true,
          title: room?.title ?? 'Voice Room',
          headerStyle: { backgroundColor: '#0A0A0F' },
          headerTintColor: '#FFFFFF',
        }}
      />

      <SafeAreaView edges={['bottom']} className="flex-1">
        {loading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator color="#FFFFFF" />
          </View>
        ) : !room ? (
          <View className="flex-1 px-5 items-center justify-center">
            <Text className="text-white text-lg font-semibold">Room not found</Text>
            <Pressable onPress={() => router.back()} className="mt-4 bg-white rounded-2xl px-4 py-3">
              <Text className="text-gray-900 font-semibold">Go back</Text>
            </Pressable>
          </View>
        ) : (
          <>
            {/* Tabs */}
            <View className="px-5 pt-3">
              <View className="flex-row bg-white/10 rounded-xl p-1">
                <Pressable onPress={() => setTab('room')} className={`flex-1 py-2.5 rounded-lg ${tab === 'room' ? 'bg-white' : ''}`}>
                  <Text className={`text-center font-semibold ${tab === 'room' ? 'text-gray-900' : 'text-gray-300'}`}>Room</Text>
                </Pressable>
                <Pressable onPress={() => setTab('gifts')} className={`flex-1 py-2.5 rounded-lg ${tab === 'gifts' ? 'bg-white' : ''}`}>
                  <Text className={`text-center font-semibold ${tab === 'gifts' ? 'text-gray-900' : 'text-gray-300'}`}>Gifts</Text>
                </Pressable>
              </View>
            </View>

            {/* LiveKit audio connection */}
            {lkUrl && lkToken ? (
              <LiveKitRoom
                key={lkToken}
                serverUrl={lkUrl}
                token={lkToken}
                connect={true}
                audio={false}
                video={false}
                options={{
                  // keep defaults; can tune later
                }}
              >
                {/* We keep UI custom; LiveKitRoom handles actual media */}
                <MicSync enabled={!!(canSpeak && micEnabled)} />
                <View className="h-0 w-0" />
              </LiveKitRoom>
            ) : (
              <View className="px-5 mt-3">
                <View className="bg-white/5 border border-white/10 rounded-2xl p-4">
                  <Text className="text-white font-semibold">Connecting audio…</Text>
                  <Text className="text-gray-400 mt-1">
                    If this hangs, you likely need to set LIVEKIT_URL / LIVEKIT_API_KEY / LIVEKIT_API_SECRET in Supabase secrets and deploy the
                    Edge Function.
                  </Text>
                </View>
              </View>
            )}

            {tab === 'room' ? (
              <ScrollView className="flex-1 px-5 mt-4" showsVerticalScrollIndicator={false}>
                {/* Stage */}
                <Text className="text-gray-400 text-sm mb-2">STAGE</Text>
                <View className="bg-white/5 border border-white/10 rounded-2xl p-4">
                  {participants
                    .filter((p) => p.role === 'host' || p.role === 'moderator' || p.role === 'speaker')
                    .map((p) => (
                      <View key={p.id} className="flex-row items-center justify-between py-2">
                        <View className="flex-row items-center">
                          <View className="w-9 h-9 rounded-full bg-white/10 items-center justify-center">
                            {p.role === 'host' ? <Crown size={16} color="#F59E0B" /> : <Mic size={16} color="#FFFFFF" />}
                          </View>
                          <View className="ml-3">
                            <Text className="text-white font-semibold">{p.user_id === currentUser?.id ? 'You' : 'Speaker'}</Text>
                            <Text className="text-gray-400 text-xs">{p.role.toUpperCase()}</Text>
                          </View>
                        </View>
                        <View className="flex-row items-center">
                          <Text className="text-gray-500 text-xs mr-2">{p.is_muted ? 'Muted' : 'Live'}</Text>
                        </View>
                      </View>
                    ))}
                </View>

                {/* Audience */}
                <Text className="text-gray-400 text-sm mb-2 mt-5">AUDIENCE</Text>
                <View className="bg-white/5 border border-white/10 rounded-2xl p-4">
                  <Text className="text-gray-400">
                    {participants.filter((p) => p.role === 'listener').length} listener(s)
                  </Text>
                </View>

                {/* Host controls */}
                {isHost ? (
                  <>
                    <Text className="text-gray-400 text-sm mb-2 mt-5">RAISED HANDS</Text>
                    <View className="bg-white/5 border border-white/10 rounded-2xl p-4">
                      {hands.length === 0 ? (
                        <Text className="text-gray-500">No one has raised a hand.</Text>
                      ) : (
                        hands.map((h) => (
                          <View key={h.id} className="flex-row items-center justify-between py-2">
                            <Text className="text-white font-semibold">Listener</Text>
                            <Pressable
                              onPress={() => promote(h.user_id)}
                              className="bg-white rounded-full px-3 py-2"
                            >
                              <View className="flex-row items-center">
                                <UserPlus size={14} color="#111827" />
                                <Text className="text-gray-900 font-semibold ml-1">Make speaker</Text>
                              </View>
                            </Pressable>
                          </View>
                        ))
                      )}
                    </View>
                  </>
                ) : null}

                <View className="h-8" />
              </ScrollView>
            ) : (
              <ScrollView className="flex-1 px-5 mt-4" showsVerticalScrollIndicator={false}>
                <Text className="text-gray-400 text-sm mb-2">SEND A GIFT</Text>
                <View className="bg-white/5 border border-white/10 rounded-2xl p-4">
                  <View className="flex-row flex-wrap" style={{ gap: 10 }}>
                    {GIFTS.map((g) => (
                      <Pressable
                        key={g.id}
                        onPress={() => sendRoomGift(g.id, g.name, g.value)}
                        className="bg-white/10 rounded-2xl px-4 py-3"
                        style={{ width: '48%' }}
                      >
                        <View className="flex-row items-center justify-between">
                          <Text className="text-white font-semibold">{g.name}</Text>
                          <View className="flex-row items-center">
                            <Gift size={14} color="#fff" />
                            <Text className="text-white/80 ml-1 text-xs">{g.value}</Text>
                          </View>
                        </View>
                      </Pressable>
                    ))}
                  </View>
                </View>

                <Text className="text-gray-400 text-sm mb-2 mt-5">RECENT GIFTS</Text>
                <View className="bg-white/5 border border-white/10 rounded-2xl p-4">
                  {gifts.length === 0 ? (
                    <Text className="text-gray-500">No gifts yet.</Text>
                  ) : (
                    gifts.map((t) => (
                      <View key={t.id} className="flex-row items-center justify-between py-2">
                        <Text className="text-white">{t.sender_name ?? 'Someone'} sent {t.gift_name}</Text>
                        <Text className="text-gray-400 text-xs">{t.gift_value}</Text>
                      </View>
                    ))
                  )}
                </View>

                <View className="h-8" />
              </ScrollView>
            )}

            {/* Bottom controls */}
            <View className="px-5 pb-4 pt-3 border-t border-white/10">
              <View className="flex-row items-center justify-between">
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    router.back();
                  }}
                  className="bg-white/10 rounded-full px-4 py-3"
                >
                  <View className="flex-row items-center">
                    <X size={16} color="#fff" />
                    <Text className="text-white font-semibold ml-2">Leave</Text>
                  </View>
                </Pressable>

                <Pressable onPress={toggleHand} className="bg-white/10 rounded-full px-4 py-3">
                  <View className="flex-row items-center">
                    <Hand size={16} color="#fff" />
                    <Text className="text-white font-semibold ml-2">
                      {hands.find((h) => h.user_id === currentUser?.id) ? 'Lower hand' : 'Raise hand'}
                    </Text>
                  </View>
                </Pressable>

                <Pressable
                  onPress={() => {
                    if (!canSpeak) return;
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setMicEnabled((v) => !v);
                  }}
                  className={`rounded-full px-4 py-3 ${canSpeak ? 'bg-white' : 'bg-white/10'}`}
                >
                  <View className="flex-row items-center">
                    {micEnabled ? <Mic size={16} color={canSpeak ? '#111827' : '#fff'} /> : <MicOff size={16} color={canSpeak ? '#111827' : '#fff'} />}
                    <Text className={`font-semibold ml-2 ${canSpeak ? 'text-gray-900' : 'text-white'}`}>
                      {canSpeak ? (micEnabled ? 'Mute' : 'Unmute') : 'Listener'}
                    </Text>
                  </View>
                </Pressable>
              </View>
            </View>
          </>
        )}
      </SafeAreaView>
    </View>
  );
}

