import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, Pressable, ActivityIndicator, ScrollView, Modal } from 'react-native';
import { Stack, useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Mic, MicOff, Hand, Gift, Crown, UserPlus, X, Sparkles, Users } from 'lucide-react-native';
import { LiveKitRoom, useRoomContext } from '@livekit/react-native';
import { LinearGradient } from 'expo-linear-gradient';
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

function LocalMicSignalInner({ micEnabled }: { micEnabled: boolean }) {
  const room = useRoomContext();
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => {
    if (!room?.localParticipant) return;
    const lp = room.localParticipant;

    const sync = () => setSpeaking(!!lp.isSpeaking);
    sync();

    // LiveKit emits these events via EventEmitter. Using string names keeps this compatible across SDK versions.
    const onSpeaking = () => sync();
    const onActiveSpeakers = () => sync();

    lp.on?.('isSpeakingChanged', onSpeaking);
    room.on?.('activeSpeakersChanged', onActiveSpeakers);

    return () => {
      lp.off?.('isSpeakingChanged', onSpeaking);
      room.off?.('activeSpeakersChanged', onActiveSpeakers);
    };
  }, [room]);

  const tone = !micEnabled ? 'off' : speaking ? 'on' : 'idle';
  const dot = tone === 'on' ? '#22C55E' : tone === 'idle' ? '#F59E0B' : '#9CA3AF';
  const label = tone === 'on' ? 'Speaking' : tone === 'idle' ? 'No voice' : 'Mic off';

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <View
        style={{
          width: 10,
          height: 10,
          borderRadius: 999,
          backgroundColor: dot,
          marginRight: 8,
          borderWidth: 2,
          borderColor: 'rgba(255,255,255,0.6)',
        }}
      />
      <Text style={{ color: '#fff', fontWeight: '900', fontSize: 12 }}>{label}</Text>
    </View>
  );
}

// Fallback component when not inside LiveKitRoom
function LocalMicSignalFallback({ micEnabled }: { micEnabled: boolean }) {
  const dot = micEnabled ? '#F59E0B' : '#9CA3AF';
  const label = micEnabled ? 'No voice' : 'Mic off';

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <View
        style={{
          width: 10,
          height: 10,
          borderRadius: 999,
          backgroundColor: dot,
          marginRight: 8,
          borderWidth: 2,
          borderColor: 'rgba(255,255,255,0.6)',
        }}
      />
      <Text style={{ color: '#fff', fontWeight: '900', fontSize: 12 }}>{label}</Text>
    </View>
  );
}

function Pill({
  label,
  tone,
}: {
  label: string;
  tone: 'live' | 'info' | 'warn';
}) {
  const colors =
    tone === 'live'
      ? ['#22C55E', '#10B981']
      : tone === 'warn'
        ? ['#F97316', '#F59E0B']
        : ['#3B82F6', '#22C55E'];
  return (
    <LinearGradient
      colors={colors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 }}
    >
      <Text style={{ color: '#fff', fontWeight: '900', fontSize: 12 }}>{label}</Text>
    </LinearGradient>
  );
}

function AvatarBubble({ label, badge }: { label: string; badge?: 'host' | 'speaker' | 'mod' }) {
  const ring =
    badge === 'host' ? ['#F59E0B', '#EF4444'] : badge === 'mod' ? ['#7C3AED', '#EC4899'] : ['#3B82F6', '#22C55E'];
  const icon = badge === 'host' ? <Crown size={14} color="#fff" /> : badge === 'speaker' ? <Mic size={14} color="#fff" /> : badge === 'mod' ? <Sparkles size={14} color="#fff" /> : null;
  return (
    <View style={{ width: 92, alignItems: 'center' }}>
      <LinearGradient
        colors={ring}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ width: 62, height: 62, borderRadius: 22, padding: 2 }}
      >
        <View
          style={{
            flex: 1,
            borderRadius: 20,
            backgroundColor: 'rgba(255,255,255,0.18)',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {icon}
        </View>
      </LinearGradient>
      <Text style={{ marginTop: 8, fontSize: 12, fontWeight: '900', color: '#111827' }} numberOfLines={1}>
        {label}
      </Text>
      {badge ? <Text style={{ marginTop: 2, fontSize: 11, fontWeight: '800', color: '#6B7280' }}>{badge.toUpperCase()}</Text> : null}
    </View>
  );
}

export default function VoiceRoomScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const currentUser = useStore((s) => s.currentUser);

  const [room, setRoom] = useState<DbVoiceRoom | null>(null);
  const [participants, setParticipants] = useState<DbVoiceRoomParticipant[]>([]);
  const [hands, setHands] = useState<DbVoiceRoomHandRaise[]>([]);
  const [gifts, setGifts] = useState<DbGiftTransaction[]>([]);
  const [tab, setTab] = useState<Tab>('room'); // kept for backward state; UI now uses sheets
  const [giftsOpen, setGiftsOpen] = useState(false);
  const [peopleOpen, setPeopleOpen] = useState(false);

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

  const stage = participants.filter((p) => p.role === 'host' || p.role === 'moderator' || p.role === 'speaker');
  const audienceCount = participants.filter((p) => p.role === 'listener').length;
  const iRaised = !!hands.find((h) => h.user_id === currentUser?.id);

  return (
    <View style={{ flex: 1, backgroundColor: '#F7F7FF' }}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: room?.title ?? 'Voice Room',
          headerStyle: { backgroundColor: '#F7F7FF' },
          headerTintColor: '#111827',
        }}
      />

      <SafeAreaView edges={['bottom']} style={{ flex: 1 }}>
        {loading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator color="#7C3AED" />
          </View>
        ) : !room ? (
          <View className="flex-1 px-5 items-center justify-center">
            <Text style={{ color: '#111827', fontSize: 16, fontWeight: '900' }}>Room not found</Text>
            <Pressable onPress={() => router.back()} className="active:opacity-80" style={{ marginTop: 12 }}>
              <LinearGradient
                colors={['#7C3AED', '#EC4899']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ borderRadius: 16, paddingVertical: 12, paddingHorizontal: 16 }}
              >
                <Text style={{ color: '#fff', fontWeight: '900' }}>Go back</Text>
              </LinearGradient>
            </Pressable>
          </View>
        ) : (
          <>
            {/* Hero header */}
            <View style={{ paddingHorizontal: 16, paddingTop: 10 }}>
              <LinearGradient
                colors={['#7C3AED', '#EC4899', '#22C55E']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ borderRadius: 24, padding: 14 }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <View style={{ flex: 1, paddingRight: 12 }}>
                    <Text style={{ color: '#fff', fontWeight: '900', fontSize: 16 }} numberOfLines={2}>
                      {room.title}
                    </Text>
                    <Text style={{ color: 'rgba(255,255,255,0.85)', marginTop: 4 }}>
                      {room.topic ? `${room.topic} • ` : ''}
                      {room.scope === 'neighborhood'
                        ? room.neighborhood ?? 'Neighborhood'
                        : room.scope === 'city'
                          ? room.city || 'City'
                          : 'Global'}
                    </Text>
                  </View>
                  <Pill label="LIVE" tone="live" />
                </View>

                <View style={{ flexDirection: 'row', marginTop: 12, alignItems: 'center', justifyContent: 'space-between' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Pill label={`${stage.length} on stage`} tone="info" />
                    <Pill label={`${audienceCount} listening`} tone="info" />
                  </View>

                  <Pressable
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      router.back();
                    }}
                    className="active:opacity-90"
                    style={{ paddingHorizontal: 10, paddingVertical: 8, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.18)' }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <X size={14} color="#fff" />
                      <Text style={{ color: '#fff', fontWeight: '900', marginLeft: 6 }}>Leave</Text>
                    </View>
                  </Pressable>
                </View>
              </LinearGradient>
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
              <View style={{ paddingHorizontal: 16, marginTop: 10 }}>
                <View style={{ backgroundColor: '#FFFFFF', borderRadius: 18, padding: 14, borderWidth: 1, borderColor: 'rgba(17,24,39,0.08)' }}>
                  <Text style={{ color: '#111827', fontWeight: '900' }}>Connecting audio…</Text>
                  <Text style={{ color: '#6B7280', marginTop: 6 }}>
                    If this hangs, set LIVEKIT_URL / LIVEKIT_API_KEY / LIVEKIT_API_SECRET in Supabase secrets and redeploy the Edge Function.
                  </Text>
                </View>
              </View>
            )}

            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 110 }} showsVerticalScrollIndicator={false}>
              {/* Stage */}
              <View style={{ backgroundColor: '#FFFFFF', borderRadius: 22, padding: 14, borderWidth: 1, borderColor: 'rgba(17,24,39,0.08)' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text style={{ color: '#111827', fontWeight: '900' }}>Stage</Text>
                  {isHost ? <Pill label="Host controls" tone="warn" /> : <Pill label={canSpeak ? 'Speaker' : 'Listener'} tone="info" />}
                </View>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 12, gap: 10 }}>
                  {stage.length === 0 ? (
                    <Text style={{ color: '#6B7280', fontWeight: '700' }}>No speakers yet.</Text>
                  ) : (
                    stage.map((p) => (
                      <AvatarBubble
                        key={p.id}
                        label={p.user_id === currentUser?.id ? 'You' : 'Speaker'}
                        badge={p.role === 'host' ? 'host' : p.role === 'moderator' ? 'mod' : 'speaker'}
                      />
                    ))
                  )}
                </View>
              </View>

              {/* Raised hands (host-only) */}
              {isHost ? (
                <View style={{ marginTop: 12, backgroundColor: '#FFFFFF', borderRadius: 22, padding: 14, borderWidth: 1, borderColor: 'rgba(17,24,39,0.08)' }}>
                  <Text style={{ color: '#111827', fontWeight: '900' }}>Raised hands</Text>
                  {hands.length === 0 ? (
                    <Text style={{ color: '#6B7280', marginTop: 8, fontWeight: '700' }}>No one is requesting to speak.</Text>
                  ) : (
                    <View style={{ marginTop: 10, gap: 10 }}>
                      {hands.map((h) => (
                        <View key={h.id} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                          <Text style={{ color: '#111827', fontWeight: '900' }}>Listener</Text>
                          <Pressable onPress={() => promote(h.user_id)} className="active:opacity-90">
                            <LinearGradient
                              colors={['#7C3AED', '#EC4899']}
                              start={{ x: 0, y: 0 }}
                              end={{ x: 1, y: 1 }}
                              style={{ borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 }}
                            >
                              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <UserPlus size={14} color="#fff" />
                                <Text style={{ color: '#fff', fontWeight: '900', marginLeft: 6 }}>Make speaker</Text>
                              </View>
                            </LinearGradient>
                          </Pressable>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              ) : null}

              {/* Audience summary */}
              <View style={{ marginTop: 12, backgroundColor: '#FFFFFF', borderRadius: 22, padding: 14, borderWidth: 1, borderColor: 'rgba(17,24,39,0.08)' }}>
                <Text style={{ color: '#111827', fontWeight: '900' }}>Audience</Text>
                <Text style={{ color: '#6B7280', marginTop: 6, fontWeight: '700' }}>{audienceCount} listening</Text>
              </View>
            </ScrollView>

            {/* Bottom controls */}
            <View
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                bottom: 0,
                paddingHorizontal: 16,
                paddingBottom: 14,
                paddingTop: 10,
                backgroundColor: 'rgba(247,247,255,0.94)',
                borderTopWidth: 1,
                borderTopColor: 'rgba(17,24,39,0.08)',
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setPeopleOpen(true);
                  }}
                  className="active:opacity-80"
                  style={{ width: 56, height: 56, borderRadius: 18, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: 'rgba(17,24,39,0.08)', alignItems: 'center', justifyContent: 'center' }}
                >
                  <Users size={18} color="#111827" />
                </Pressable>

                {/* Big mic button */}
                <Pressable
                  onPress={() => {
                    if (!canSpeak) {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      return;
                    }
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setMicEnabled((v) => !v);
                  }}
                  className="active:opacity-90"
                >
                  <LinearGradient
                    colors={
                      canSpeak
                        ? micEnabled
                          ? ['#EF4444', '#F97316']
                          : ['#7C3AED', '#EC4899']
                        : ['rgba(17,24,39,0.22)', 'rgba(17,24,39,0.16)']
                    }
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{ width: 74, height: 74, borderRadius: 28, alignItems: 'center', justifyContent: 'center' }}
                  >
                    {micEnabled ? <Mic size={22} color="#fff" /> : <MicOff size={22} color="#fff" />}
                    <Text style={{ marginTop: 6, color: '#fff', fontWeight: '900', fontSize: 12 }}>
                      {canSpeak ? (micEnabled ? 'Mute' : 'Unmute') : 'Listener'}
                    </Text>
                  </LinearGradient>
                </Pressable>

                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setGiftsOpen(true);
                  }}
                  className="active:opacity-80"
                  style={{ width: 56, height: 56, borderRadius: 18, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: 'rgba(17,24,39,0.08)', alignItems: 'center', justifyContent: 'center' }}
                >
                  <Gift size={18} color="#111827" />
                </Pressable>
              </View>

              {/* Host mic signal */}
              {isHost ? (
                <View style={{ marginTop: 10, alignItems: 'center' }}>
                  <View style={{ borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: 'rgba(17,24,39,0.92)' }}>
                    <LocalMicSignalFallback micEnabled={!!(canSpeak && micEnabled)} />
                  </View>
                </View>
              ) : null}

              <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 10 }}>
                <Pressable onPress={toggleHand} className="active:opacity-90" style={{ width: '100%' }}>
                  <LinearGradient
                    colors={iRaised ? ['#F97316', '#F59E0B'] : ['#3B82F6', '#22C55E']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{ borderRadius: 18, paddingVertical: 12, alignItems: 'center' }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Hand size={16} color="#fff" />
                      <Text style={{ color: '#fff', fontWeight: '900', marginLeft: 8 }}>
                        {iRaised ? 'Lower hand' : 'Raise hand'}
                      </Text>
                    </View>
                  </LinearGradient>
                </Pressable>
              </View>
            </View>

            {/* Gifts bottom sheet */}
            <Modal visible={giftsOpen} transparent animationType="fade" onRequestClose={() => setGiftsOpen(false)}>
              <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end' }}>
                <View style={{ backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 16, borderWidth: 1, borderColor: 'rgba(17,24,39,0.08)' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text style={{ color: '#111827', fontWeight: '900', fontSize: 16 }}>Gifts</Text>
                    <Pressable onPress={() => setGiftsOpen(false)} className="active:opacity-80">
                      <X size={18} color="#111827" />
                    </Pressable>
                  </View>

                  <Text style={{ color: '#6B7280', marginTop: 6 }}>Support the host — gifts show up live in the room.</Text>

                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 12, gap: 10 }}>
                    {GIFTS.map((g) => (
                      <Pressable key={g.id} onPress={() => sendRoomGift(g.id, g.name, g.value)} className="active:opacity-90" style={{ width: '48%' }}>
                        <LinearGradient
                          colors={['rgba(124,58,237,0.12)', 'rgba(236,72,153,0.10)', 'rgba(34,197,94,0.10)']}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={{ borderRadius: 18, padding: 12, borderWidth: 1, borderColor: 'rgba(17,24,39,0.08)' }}
                        >
                          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Text style={{ color: '#111827', fontWeight: '900' }}>{g.name}</Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                              <Gift size={14} color="#111827" />
                              <Text style={{ marginLeft: 6, color: '#111827', fontWeight: '900' }}>{g.value}</Text>
                            </View>
                          </View>
                        </LinearGradient>
                      </Pressable>
                    ))}
                  </View>

                  <Text style={{ color: '#111827', fontWeight: '900', marginTop: 14 }}>Recent</Text>
                  <View style={{ marginTop: 8, gap: 8 }}>
                    {gifts.length === 0 ? (
                      <Text style={{ color: '#6B7280', fontWeight: '700' }}>No gifts yet.</Text>
                    ) : (
                      gifts.slice(0, 6).map((t) => (
                        <View key={t.id} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                          <Text style={{ color: '#111827', fontWeight: '800' }} numberOfLines={1}>
                            {(t.sender_name ?? 'Someone') + ' sent ' + t.gift_name}
                          </Text>
                          <Text style={{ color: '#6B7280', fontWeight: '800' }}>{t.gift_value}</Text>
                        </View>
                      ))
                    )}
                  </View>

                  <View style={{ height: 14 }} />
                </View>
              </View>
            </Modal>

            {/* People sheet (quick glance) */}
            <Modal visible={peopleOpen} transparent animationType="fade" onRequestClose={() => setPeopleOpen(false)}>
              <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end' }}>
                <View style={{ backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 16, borderWidth: 1, borderColor: 'rgba(17,24,39,0.08)' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text style={{ color: '#111827', fontWeight: '900', fontSize: 16 }}>People</Text>
                    <Pressable onPress={() => setPeopleOpen(false)} className="active:opacity-80">
                      <X size={18} color="#111827" />
                    </Pressable>
                  </View>
                  <Text style={{ color: '#6B7280', marginTop: 6, fontWeight: '700' }}>
                    {stage.length} on stage • {audienceCount} listening
                  </Text>
                  <View style={{ marginTop: 12, gap: 8 }}>
                    {stage.slice(0, 8).map((p) => (
                      <View key={p.id} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Text style={{ color: '#111827', fontWeight: '900' }}>{p.user_id === currentUser?.id ? 'You' : 'Speaker'}</Text>
                        <Text style={{ color: '#6B7280', fontWeight: '800' }}>{p.role.toUpperCase()}</Text>
                      </View>
                    ))}
                  </View>
                  <View style={{ height: 14 }} />
                </View>
              </View>
            </Modal>
          </>
        )}
      </SafeAreaView>
    </View>
  );
}

