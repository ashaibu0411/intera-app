import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, Pressable, ActivityIndicator, ScrollView, Modal, Alert, Linking, TextInput } from 'react-native';
import { Stack, useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { Mic, MicOff, Hand, Gift, Crown, UserPlus, X, Users, AudioLines, Trash2, Square, ChevronDown, Volume2, VolumeX, UserMinus, MoreVertical, HelpCircle, Lightbulb, Megaphone, Sparkles, Pin, FileText, MessageSquare, ThumbsUp, Flame, HeartHandshake, HandClap } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Audio } from 'expo-av';
import { useStore } from '@/lib/store';
import { supabase } from '@/lib/supabase';
import type { DbVoiceRoom, DbVoiceRoomHandRaise, DbGiftTransaction } from '@/lib/supabase';
import {
  deleteVoiceRoom,
  endVoiceRoom,
  getLiveKitToken,
  leaveRoom,
  lowerHand,
  raiseHand,
  restartVoiceRoom,
  updateVoiceRoomContext,
  sendReaction,
  getReactionCounts,
  sendNoteToHost,
  listNotes,
  getRecap,
  upsertParticipant,
  updateParticipantRole,
  listParticipantsWithProfiles,
  muteParticipant,
  kickParticipant,
  demoteToListener,
  type ParticipantWithProfile,
  type HandRaiseIntent
} from '@/lib/voiceRooms';
import { sendGift } from '@/lib/giftService';
import { LiveKitRoom, useRoomContext, isLiveKitAvailable } from '@/lib/livekit-wrapper';

const GIFTS = [
  { id: 'heart', name: 'Heart', value: 1, emoji: '❤️' },
  { id: 'star', name: 'Star', value: 5, emoji: '⭐' },
  { id: 'flame', name: 'Fire', value: 10, emoji: '🔥' },
  { id: 'gem', name: 'Diamond', value: 50, emoji: '💎' },
  { id: 'crown', name: 'Crown', value: 100, emoji: '👑' },
  { id: 'sparkle', name: 'Sparkle', value: 500, emoji: '✨' },
] as const;

function MicSync({ enabled }: { enabled: boolean }) {
  const room = useRoomContext() as { localParticipant?: { setMicrophoneEnabled?: (enabled: boolean) => Promise<void> } } | null;
  useEffect(() => {
    room?.localParticipant?.setMicrophoneEnabled?.(enabled)?.catch?.(() => null);
  }, [enabled, room]);
  return null;
}

interface LiveKitRoomContext {
  localParticipant?: {
    isSpeaking?: boolean;
    on?: (event: string, handler: () => void) => void;
    off?: (event: string, handler: () => void) => void;
  };
  on?: (event: string, handler: () => void) => void;
  off?: (event: string, handler: () => void) => void;
}

function LiveKitSpeakingBridge({ onSpeakingChange }: { onSpeakingChange: (speaking: boolean) => void }) {
  const room = useRoomContext() as LiveKitRoomContext | null;
  useEffect(() => {
    if (!room?.localParticipant) return;
    const lp = room.localParticipant;
    const sync = () => onSpeakingChange(!!lp.isSpeaking);
    sync();
    const onSpeaking = () => sync();
    const onActiveSpeakers = () => sync();
    lp.on?.('isSpeakingChanged', onSpeaking);
    room.on?.('activeSpeakersChanged', onActiveSpeakers);
    return () => {
      lp.off?.('isSpeakingChanged', onSpeaking);
      room.off?.('activeSpeakersChanged', onActiveSpeakers);
    };
  }, [onSpeakingChange, room]);
  return null;
}

function MicStatusIndicator({ micEnabled, speaking }: { micEnabled: boolean; speaking?: boolean | null }) {
  const tone = !micEnabled ? 'off' : speaking ? 'on' : 'idle';
  const dot = tone === 'on' ? '#10B981' : tone === 'idle' ? '#C9A227' : '#9CA3AF';
  const label = tone === 'on' ? 'Speaking' : tone === 'idle' ? 'Mic on' : 'Muted';

  return (
    <View className="flex-row items-center bg-warmBrown/90 rounded-full px-3 py-1.5">
      <View
        style={{
          width: 8,
          height: 8,
          borderRadius: 4,
          backgroundColor: dot,
          marginRight: 6,
        }}
      />
      <Text className="text-white text-xs font-semibold">{label}</Text>
    </View>
  );
}

function SpeakerAvatar({
  participant,
  isCurrentUser,
  isHost,
  canModerate,
  onMute,
  onDemote,
  onKick
}: {
  participant: ParticipantWithProfile;
  isCurrentUser: boolean;
  isHost: boolean;
  canModerate: boolean;
  onMute?: () => void;
  onDemote?: () => void;
  onKick?: () => void;
}) {
  const [showActions, setShowActions] = useState(false);
  const name = participant.profile?.name || 'Anonymous';
  const avatar = participant.profile?.avatar_url;
  const role = participant.role;

  const ringColor = role === 'host'
    ? ['#C9A227', '#D4673A']
    : role === 'moderator'
      ? ['#1B4D3E', '#2D6A4F']
      : ['#D4673A', '#E07B4A'];

  const roleLabel = role === 'host' ? 'Host' : role === 'moderator' ? 'Mod' : 'Speaker';
  const roleColor = role === 'host' ? 'bg-gold-500' : role === 'moderator' ? 'bg-forest-600' : 'bg-terracotta-500';

  return (
    <>
      <Pressable
        onPress={() => canModerate && !isCurrentUser && setShowActions(true)}
        className="items-center mx-2 mb-3"
      >
        <LinearGradient
          colors={ringColor as [string, string]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ width: 68, height: 68, borderRadius: 24, padding: 3 }}
        >
          <View className="flex-1 rounded-[21px] bg-cream overflow-hidden items-center justify-center">
            {avatar ? (
              <Image source={{ uri: avatar }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
            ) : (
              <View className="w-full h-full bg-forest-100 items-center justify-center">
                <Text className="text-forest-700 font-bold text-lg">{name.charAt(0).toUpperCase()}</Text>
              </View>
            )}
          </View>
        </LinearGradient>

        <Text className="text-warmBrown font-semibold text-sm mt-2" numberOfLines={1}>
          {isCurrentUser ? 'You' : name.split(' ')[0]}
        </Text>

        <View className={`${roleColor} rounded-full px-2 py-0.5 mt-1`}>
          <Text className="text-white text-[10px] font-bold">{roleLabel}</Text>
        </View>

        {canModerate && !isCurrentUser && (
          <View className="absolute top-0 right-0 bg-warmBrown/80 rounded-full p-1">
            <MoreVertical size={12} color="#fff" />
          </View>
        )}
      </Pressable>

      {/* Moderation Actions Modal */}
      <Modal visible={showActions} transparent animationType="fade" onRequestClose={() => setShowActions(false)}>
        <Pressable className="flex-1 bg-black/40" onPress={() => setShowActions(false)}>
          <View className="flex-1 justify-end">
            <View className="bg-cream rounded-t-3xl p-5">
              <View className="flex-row items-center mb-4">
                {avatar ? (
                  <Image source={{ uri: avatar }} style={{ width: 48, height: 48, borderRadius: 24 }} contentFit="cover" />
                ) : (
                  <View className="w-12 h-12 rounded-full bg-forest-100 items-center justify-center">
                    <Text className="text-forest-700 font-bold text-lg">{name.charAt(0)}</Text>
                  </View>
                )}
                <View className="ml-3">
                  <Text className="text-warmBrown font-bold text-lg">{name}</Text>
                  <Text className="text-gray-500 text-sm capitalize">{role}</Text>
                </View>
              </View>

              {role !== 'listener' && (
                <Pressable
                  onPress={() => { setShowActions(false); onDemote?.(); }}
                  className="flex-row items-center bg-white rounded-xl p-4 mb-2"
                >
                  <ChevronDown size={20} color="#D4673A" />
                  <Text className="text-warmBrown font-medium ml-3">Move to Audience</Text>
                </Pressable>
              )}

              <Pressable
                onPress={() => { setShowActions(false); onMute?.(); }}
                className="flex-row items-center bg-white rounded-xl p-4 mb-2"
              >
                <VolumeX size={20} color="#C9A227" />
                <Text className="text-warmBrown font-medium ml-3">Mute</Text>
              </Pressable>

              <Pressable
                onPress={() => { setShowActions(false); onKick?.(); }}
                className="flex-row items-center bg-red-50 rounded-xl p-4 mb-2"
              >
                <UserMinus size={20} color="#DC2626" />
                <Text className="text-red-600 font-medium ml-3">Remove from Room</Text>
              </Pressable>

              <Pressable
                onPress={() => setShowActions(false)}
                className="bg-gray-100 rounded-xl p-4 items-center mt-2"
              >
                <Text className="text-gray-600 font-medium">Cancel</Text>
              </Pressable>
            </View>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

function VoiceRoomScreenContent({ id }: { id: string }) {
  const currentUser = useStore((s) => s.currentUser);

  const [room, setRoom] = useState<DbVoiceRoom | null>(null);
  const [participants, setParticipants] = useState<ParticipantWithProfile[]>([]);
  const [hands, setHands] = useState<DbVoiceRoomHandRaise[]>([]);
  const [gifts, setGifts] = useState<DbGiftTransaction[]>([]);
  const [giftsOpen, setGiftsOpen] = useState(false);
  const [peopleOpen, setPeopleOpen] = useState(false);
  const [testMicOpen, setTestMicOpen] = useState(false);
  const [lkSpeaking, setLkSpeaking] = useState<boolean | null>(null);
  const [testRecording, setTestRecording] = useState<Audio.Recording | null>(null);
  const [testRecordingUri, setTestRecordingUri] = useState<string | null>(null);
  const [testSound, setTestSound] = useState<Audio.Sound | null>(null);
  const [testBusy, setTestBusy] = useState(false);
  const [testSeconds, setTestSeconds] = useState(0);
  const [pauseLiveKitForTest, setPauseLiveKitForTest] = useState(false);
  const [testPermGranted, setTestPermGranted] = useState<boolean | null>(null);

  const [lkUrl, setLkUrl] = useState<string | null>(null);
  const [lkToken, setLkToken] = useState<string | null>(null);
  const [lkError, setLkError] = useState<string | null>(null);
  const [joinNonce, setJoinNonce] = useState(0);
  const [loading, setLoading] = useState(true);
  const [micEnabled, setMicEnabled] = useState(false);
  const [intentOpen, setIntentOpen] = useState(false);
  const [contextOpen, setContextOpen] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [notesOpen, setNotesOpen] = useState(false);
  const [notes, setNotes] = useState<Array<{ id: string; user_id: string; content: string; created_at: string }>>([]);
  const [reactions, setReactions] = useState<{ agree: number; heart: number; clap: number; fire: number }>({
    agree: 0, heart: 0, clap: 0, fire: 0,
  });
  const [recap, setRecap] = useState<any>(null);

  const [ctxPinnedTitle, setCtxPinnedTitle] = useState('');
  const [ctxPinnedRoute, setCtxPinnedRoute] = useState('');
  const [ctxRules, setCtxRules] = useState('');
  const [ctxResources, setCtxResources] = useState('');

  const liveKitEnabled = isLiveKitAvailable();

  // Safe navigation back
  const goBack = () => {
    try {
      router.replace('/(tabs)' as never);
    } catch {
      // Fallback if navigation context isn't ready
      router.replace('/(tabs)');
    }
  };

  const me = useMemo(() => {
    if (!currentUser?.id || !id) return null;
    return participants.find((p) => p.user_id === currentUser.id) ?? null;
  }, [currentUser?.id, id, participants]);

  const isHost = useMemo(() => {
    if (!currentUser?.id || !room) return false;
    return room.creator_id === currentUser.id || me?.role === 'host' || me?.role === 'moderator';
  }, [currentUser?.id, me?.role, room]);

  const canSpeak = me?.role === 'host' || me?.role === 'moderator' || me?.role === 'speaker';
  const canSpeakEffective = isHost || canSpeak;

  // Load room data
  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        const { data } = await supabase.from('voice_rooms').select('*').eq('id', id).single();
        if (cancelled) return;
        const r = data as DbVoiceRoom;
        if (r?.expires_at && new Date(r.expires_at).getTime() <= Date.now()) {
          setRoom({ ...r, status: 'ended' } as DbVoiceRoom);
        } else {
          setRoom(r);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [id]);

  // Subscribe to participants and hand raises
  useEffect(() => {
    if (!id) return;

    const loadParticipants = async () => {
      const p = await listParticipantsWithProfiles(id);
      setParticipants(p);
    };

    const channel = supabase
      .channel(`voice-room:${id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'voice_room_participants', filter: `room_id=eq.${id}` },
        loadParticipants
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

    // Initial fetch
    loadParticipants();
    (async () => {
      const { data: h } = await supabase.from('voice_room_hand_raises').select('*').eq('room_id', id).order('created_at', { ascending: true });
      setHands((h ?? []) as DbVoiceRoomHandRaise[]);
    })();

    return () => { supabase.removeChannel(channel); };
  }, [id]);

  // Load reactions + subscribe to reaction inserts
  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    const loadCounts = async () => {
      try {
        const counts = await getReactionCounts(id);
        if (!cancelled) setReactions(counts);
      } catch {}
    };

    const channel = supabase
      .channel(`voice-room-reactions:${id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'voice_room_reactions', filter: `room_id=eq.${id}` }, loadCounts)
      .subscribe();

    loadCounts();
    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [id]);

  // Load recap (public or host) + subscribe to changes
  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    const load = async () => {
      try {
        const r = await getRecap(id);
        if (!cancelled) setRecap(r);
      } catch {}
    };
    const channel = supabase
      .channel(`voice-room-recap:${id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'voice_room_recaps', filter: `room_id=eq.${id}` }, load)
      .subscribe();
    load();
    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [id]);

  // Subscribe to gifts
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

    return () => { supabase.removeChannel(channel); };
  }, [id]);

  // Join room and get LiveKit token
  useEffect(() => {
    if (!id || !room) return;
    if (room.status === 'ended') return;
    let cancelled = false;

    const join = async () => {
      setLkError(null);
      setLkUrl(null);
      setLkToken(null);

      if (!currentUser?.id) {
        setLkError('Sign in required to join this room.');
        return;
      }
      if (!liveKitEnabled) {
        setLkError('LiveKit native modules are not available in this build. Build a dev/EAS client (not Expo Go) to use voice rooms.');
        return;
      }

      const role = room.creator_id === currentUser.id ? 'host' : 'listener';
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

    join().catch((e: any) => {
      if (cancelled) return;
      setLkError(String(e?.message ?? e));
    });
    return () => {
      cancelled = true;
    };
  }, [currentUser?.id, currentUser?.name, id, room, liveKitEnabled, joinNonce]);

  // Refresh token when role changes
  useEffect(() => {
    if (!id || !currentUser?.id || !room || !me?.role) return;
    let cancelled = false;
    (async () => {
      if (!liveKitEnabled) return;
      setLkError(null);
      const tokenResp = await getLiveKitToken({
        roomName: room.provider_room_name,
        identity: currentUser.id,
        name: currentUser.name ?? undefined,
        canPublish: me.role === 'host' || me.role === 'moderator' || me.role === 'speaker',
      });
      if (cancelled) return;
      setLkUrl(tokenResp.url);
      setLkToken(tokenResp.token);
      if (!(me.role === 'host' || me.role === 'moderator' || me.role === 'speaker')) {
        setMicEnabled(false);
      }
    })().catch((e: any) => {
      if (cancelled) return;
      setLkError(String(e?.message ?? e));
    });
    return () => { cancelled = true; };
  }, [currentUser?.id, currentUser?.name, id, me?.role, room, liveKitEnabled]);

  // Leave room on unmount
  useEffect(() => {
    if (!id || !currentUser?.id) return;
    return () => { leaveRoom(id, currentUser.id).catch(() => null); };
  }, [currentUser?.id, id]);

  // Test recording timer
  useEffect(() => {
    if (!testRecording) {
      setTestSeconds(0);
      return;
    }
    const t = setInterval(async () => {
      try {
        const s = await testRecording.getStatusAsync();
        if ('durationMillis' in s && typeof s.durationMillis === 'number') {
          setTestSeconds(Math.floor(s.durationMillis / 1000));
        }
      } catch {}
    }, 350);
    return () => clearInterval(t);
  }, [testRecording]);

  const toggleHand = async () => {
    if (!id || !currentUser?.id) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const already = !!hands.find((h) => h.user_id === currentUser.id);
    if (already) await lowerHand(id, currentUser.id);
    else setIntentOpen(true);
  };

  const submitRaiseIntent = async (intent: HandRaiseIntent) => {
    if (!id || !currentUser?.id) return;
    setIntentOpen(false);
    await raiseHand(id, currentUser.id, intent);
  };

  const promote = async (userId: string) => {
    if (!id) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await updateParticipantRole(id, userId, 'speaker');
    await lowerHand(id, userId);
  };

  const handleMute = async (userId: string) => {
    if (!id) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await muteParticipant(id, userId);
  };

  const handleDemote = async (userId: string) => {
    if (!id) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await demoteToListener(id, userId);
  };

  const handleKick = async (userId: string) => {
    if (!id) return;
    Alert.alert('Remove from room?', 'This person will be removed from the room.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          await kickParticipant(id, userId);
        },
      },
    ]);
  };

  const sendRoomGift = async (giftId: string, giftName: string, giftValue: number) => {
    if (!currentUser?.id || !room) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await sendGift({
      senderId: currentUser.id,
      senderName: currentUser.name ?? 'Someone',
      recipientId: room.creator_id,
      recipientName: 'Host',
      giftId,
      giftName,
      giftValue,
      roomId: room.id,
      roomTitle: room.title,
    });
  };

  const cleanupTestAudio = async () => {
    try { await testSound?.unloadAsync(); } catch {}
    setTestSound(null);
  };

  const cleanupTestRecording = async () => {
    try {
      if (testRecording) {
        const status = await testRecording.getStatusAsync().catch(() => null as any);
        if (status?.isRecording) await testRecording.stopAndUnloadAsync().catch(() => null);
      }
    } catch {}
    setTestRecording(null);
  };

  const startTestRecording = async () => {
    if (testBusy || testRecording) return;
    setTestBusy(true);
    try {
      setMicEnabled(false);
      setPauseLiveKitForTest(true);
      await cleanupTestAudio();
      await cleanupTestRecording();
      setTestRecordingUri(null);

      const perm = await Audio.requestPermissionsAsync();
      setTestPermGranted(!!perm.granted);
      if (!perm.granted) {
        Alert.alert('Microphone permission denied', 'Enable microphone in Settings.', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => Linking.openSettings().catch(() => null) },
        ]);
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      setTestRecording(recording);
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : String(e);
      Alert.alert('Mic test failed', errorMessage);
    } finally {
      setTestBusy(false);
    }
  };

  const stopTestRecording = async () => {
    if (testBusy || !testRecording) return;
    setTestBusy(true);
    try {
      await testRecording.stopAndUnloadAsync();
      const uri = testRecording.getURI();
      setTestRecording(null);
      setTestRecordingUri(uri ?? null);
    } catch (e: any) {
      Alert.alert('Could not stop recording', String(e?.message ?? e));
    } finally {
      setTestBusy(false);
    }
  };

  const playTestRecording = async () => {
    if (!testRecordingUri || testBusy) return;
    setTestBusy(true);
    try {
      await cleanupTestAudio();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
      const { sound } = await Audio.Sound.createAsync({ uri: testRecordingUri }, { shouldPlay: true });
      await sound.setVolumeAsync(1.0);
      sound.setOnPlaybackStatusUpdate((status) => {
        if (!status.isLoaded) return;
        if (status.didJustFinish) {
          sound.unloadAsync().catch(() => null);
          setTestSound(null);
        }
      });
      setTestSound(sound);
    } catch (e: any) {
      Alert.alert('Could not play recording', String(e?.message ?? e));
    } finally {
      setTestBusy(false);
    }
  };

  const hostEndRoom = async () => {
    if (!room?.id) return;
    Alert.alert('End room?', 'This will end the room for everyone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'End room',
        style: 'destructive',
        onPress: async () => {
          try {
            await endVoiceRoom(room.id);
            router.replace(`/voice-room-recap/${room.id}` as any);
          } catch {
            goBack();
          }
        },
      },
    ]);
  };

  const hostReopenRoom = async () => {
    if (!room?.id) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await restartVoiceRoom(room.id);
      // Reload room + force token refresh
      const { data } = await supabase.from('voice_rooms').select('*').eq('id', room.id).single();
      setRoom((data as DbVoiceRoom) ?? null);
      setJoinNonce((n) => n + 1);
    } catch (e: any) {
      Alert.alert('Could not reopen room', String(e?.message ?? e));
    }
  };

  const hostDeleteRoom = async () => {
    if (!room?.id) return;
    Alert.alert('Delete room?', 'This permanently deletes the room.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try { await deleteVoiceRoom(room.id); } finally { goBack(); }
        },
      },
    ]);
  };

  if (!id) return null;

  const stage = participants.filter((p) => p.role === 'host' || p.role === 'moderator' || p.role === 'speaker');
  const audience = participants.filter((p) => p.role === 'listener');
  const audienceCount = audience.length;
  const iRaised = !!hands.find((h) => h.user_id === currentUser?.id);

  // Get hand raise user profiles
  const handRaisesWithProfiles = hands.map(h => {
    const participant = participants.find(p => p.user_id === h.user_id);
    return { ...h, profile: participant?.profile };
  });

  const intentLabel = (intent?: string | null) =>
    intent === 'insight' ? 'Insight'
    : intent === 'announcement' ? 'Announcement'
    : intent === 'testimony' ? 'Testimony'
    : 'Question';

  const intentIcon = (intent?: string | null) =>
    intent === 'insight' ? Lightbulb
    : intent === 'announcement' ? Megaphone
    : intent === 'testimony' ? Sparkles
    : HelpCircle;

  return (
    <View className="flex-1 bg-cream">
      <Stack.Screen
        options={{
          headerShown: true,
          title: '',
          headerStyle: { backgroundColor: '#FBF9F7' },
          headerTintColor: '#2D1F1A',
          headerShadowVisible: false,
        }}
      />

      <SafeAreaView edges={['bottom']} className="flex-1">
        {loading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator color="#1B4D3E" />
          </View>
        ) : !room ? (
          <View className="flex-1 px-5 items-center justify-center">
            <Text className="text-warmBrown font-bold text-lg">Room not found</Text>
            <Pressable onPress={goBack} className="mt-4 bg-terracotta-500 rounded-xl px-6 py-3">
              <Text className="text-white font-semibold">Go back</Text>
            </Pressable>
          </View>
        ) : (
          <>
            {/* Room ended banner */}
            {room.status === 'ended' ? (
              <View className="mx-4 mt-3 bg-gray-100 border border-gray-200 rounded-2xl p-4">
                <Text className="text-warmBrown font-bold">This room has ended</Text>
                <Text className="text-gray-600 mt-1">Hosts can reopen it anytime.</Text>
                {isHost ? (
                  <Pressable onPress={hostReopenRoom} className="mt-3 bg-forest-700 rounded-xl px-4 py-3 items-center">
                    <Text className="text-white font-semibold">Reopen room</Text>
                  </Pressable>
                ) : null}
              </View>
            ) : null}

            {/* Header Card */}
            <View className="mx-4 mt-2 bg-white rounded-2xl p-4 shadow-sm">
              <View className="flex-row items-start justify-between">
                <View className="flex-1 pr-3">
                  <Text className="text-warmBrown font-bold text-lg" numberOfLines={2}>{room.title}</Text>
                  {room.topic && (
                    <Text className="text-gray-500 text-sm mt-1">{room.topic}</Text>
                  )}
                  <Text className="text-terracotta-500 text-sm mt-1">
                    {room.scope === 'neighborhood' ? room.neighborhood ?? 'Neighborhood' : room.scope === 'city' ? room.city || 'City' : 'Global'}
                  </Text>
                </View>
                <View className="bg-emerald-500 rounded-full px-3 py-1.5">
                  <Text className="text-white font-bold text-xs">LIVE</Text>
                </View>
              </View>

              <View className="flex-row items-center mt-3 pt-3 border-t border-gray-100">
                <View className="flex-row items-center flex-1">
                  <Users size={16} color="#1B4D3E" />
                  <Text className="text-forest-700 font-medium ml-1.5">{stage.length} speaking</Text>
                </View>
                <View className="flex-row items-center flex-1">
                  <Volume2 size={16} color="#C9A227" />
                  <Text className="text-gold-600 font-medium ml-1.5">{audienceCount} listening</Text>
                </View>
                <Pressable
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); goBack(); }}
                  className="bg-gray-100 rounded-full px-4 py-2"
                >
                  <Text className="text-gray-600 font-medium">Leave</Text>
                </Pressable>
              </View>
            </View>

            {/* Context Panel */}
            <View className="mx-4 mt-3 bg-white rounded-2xl p-4 border border-gray-100">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center">
                  <Pin size={16} color="#1B4D3E" />
                  <Text className="text-warmBrown font-bold ml-2">Context</Text>
                </View>
                {isHost ? (
                  <Pressable
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setCtxPinnedTitle(String((room as any).pinned_title || ''));
                      setCtxPinnedRoute(String((room as any).pinned_route || ''));
                      setCtxRules(String((room as any).rules || ''));
                      setCtxResources(((room as any).resources || []).join('\n'));
                      setContextOpen(true);
                    }}
                  >
                    <Text className="text-terracotta-500 font-semibold">Edit</Text>
                  </Pressable>
                ) : null}
              </View>

              {room.description ? (
                <Text className="text-gray-700 mt-2 leading-6">{room.description}</Text>
              ) : (
                <Text className="text-gray-500 mt-2">No description yet.</Text>
              )}

              {(room as any).pinned_title && (room as any).pinned_route ? (
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    router.push(String((room as any).pinned_route) as any);
                  }}
                  className="mt-3 bg-forest-50 border border-forest-200 rounded-xl p-3"
                >
                  <View className="flex-row items-center">
                    <FileText size={16} color="#1B4D3E" />
                    <Text className="text-forest-800 font-semibold ml-2">Pinned: {String((room as any).pinned_title)}</Text>
                  </View>
                </Pressable>
              ) : null}

              {Array.isArray((room as any).resources) && (room as any).resources.length > 0 ? (
                <View className="mt-3">
                  <Text className="text-gray-500 text-sm font-medium">Resources</Text>
                  {((room as any).resources as string[]).slice(0, 4).map((u) => (
                    <Pressable
                      key={u}
                      onPress={() => Linking.openURL(u).catch(() => null)}
                      className="mt-2 bg-gray-50 border border-gray-100 rounded-xl p-3"
                    >
                      <Text className="text-terracotta-500 font-semibold" numberOfLines={1}>{u}</Text>
                    </Pressable>
                  ))}
                </View>
              ) : null}

              {(room as any).rules ? (
                <View className="mt-3 bg-amber-50 border border-amber-200 rounded-xl p-3">
                  <Text className="text-amber-800 font-semibold">Room rules</Text>
                  <Text className="text-amber-800 mt-1">{String((room as any).rules)}</Text>
                </View>
              ) : null}
            </View>

            {/* LiveKit Connection */}
            {lkUrl && lkToken ? (
              <LiveKitRoom
                key={`${lkToken}:${pauseLiveKitForTest ? 'paused' : 'on'}`}
                serverUrl={lkUrl}
                token={lkToken}
                connect={!pauseLiveKitForTest}
                audio={true}
                video={false}
              >
                <MicSync enabled={!!(canSpeakEffective && micEnabled)} />
                <LiveKitSpeakingBridge onSpeakingChange={setLkSpeaking} />
                <View className="h-0 w-0" />
              </LiveKitRoom>
            ) : lkError ? (
              <View className="mx-4 mt-3 bg-red-50 border border-red-200 rounded-xl p-4">
                <Text className="text-red-700 font-semibold">Could not join room</Text>
                <Text className="text-red-600 text-sm mt-1">{lkError}</Text>
                <View className="flex-row mt-3 gap-2">
                  {!currentUser?.id ? (
                    <Pressable onPress={() => router.push('/signup')} className="bg-red-600 rounded-full px-4 py-2">
                      <Text className="text-white font-semibold">Sign up</Text>
                    </Pressable>
                  ) : (
                    <Pressable
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setJoinNonce((n) => n + 1);
                      }}
                      className="bg-red-600 rounded-full px-4 py-2"
                    >
                      <Text className="text-white font-semibold">Retry</Text>
                    </Pressable>
                  )}
                  <Pressable onPress={goBack} className="bg-white border border-red-200 rounded-full px-4 py-2">
                    <Text className="text-red-700 font-semibold">Back</Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              <View className="mx-4 mt-3 bg-gold-50 border border-gold-200 rounded-xl p-4">
                <Text className="text-gold-800 font-semibold">Connecting audio...</Text>
                <Text className="text-gold-600 text-sm mt-1">Please wait while we connect you to the room.</Text>
              </View>
            )}

            <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 200 }} showsVerticalScrollIndicator={false}>
              {/* Recap card (if published or host) */}
              {recap?.summary ? (
                <View className="px-4 mt-4">
                  <View className="bg-white rounded-2xl p-4 border border-gray-100">
                    <View className="flex-row items-center justify-between">
                      <Text className="text-warmBrown font-bold">Recap</Text>
                      <Pressable
                        onPress={() => router.push(`/voice-room-recap/${id}` as any)}
                      >
                        <Text className="text-terracotta-500 font-semibold">Open</Text>
                      </Pressable>
                    </View>
                    <Text className="text-gray-700 leading-6 mt-2" numberOfLines={4}>
                      {recap.summary}
                    </Text>
                  </View>
                </View>
              ) : null}

              {/* Stage Section */}
              <View className="px-4 mt-4">
                <Text className="text-warmBrown font-bold text-lg mb-3">On Stage</Text>
                <View className="bg-white rounded-2xl p-4">
                  {stage.length === 0 ? (
                    <Text className="text-gray-500 text-center py-4">No speakers yet</Text>
                  ) : (
                    <View className="flex-row flex-wrap justify-center">
                      {stage.map((p) => (
                        <SpeakerAvatar
                          key={p.id}
                          participant={p}
                          isCurrentUser={p.user_id === currentUser?.id}
                          isHost={p.role === 'host'}
                          canModerate={isHost && p.user_id !== currentUser?.id}
                          onMute={() => handleMute(p.user_id)}
                          onDemote={() => handleDemote(p.user_id)}
                          onKick={() => handleKick(p.user_id)}
                        />
                      ))}
                    </View>
                  )}
                </View>
              </View>

              {/* Raised Hands (Host only) */}
              {isHost && handRaisesWithProfiles.length > 0 && (
                <View className="px-4 mt-4">
                  <Text className="text-warmBrown font-bold text-lg mb-3">Raised Hands</Text>
                  <View className="bg-gold-50 border border-gold-200 rounded-2xl p-4">
                    {handRaisesWithProfiles.map((h) => (
                      <View key={h.id} className="flex-row items-center justify-between py-2">
                        <View className="flex-row items-center">
                          <Hand size={18} color="#C9A227" />
                          <Text className="text-warmBrown font-medium ml-2">
                            {h.profile?.name || 'Anonymous'}
                          </Text>
                          <View className="ml-2 bg-white/80 border border-gold-200 rounded-full px-2 py-1 flex-row items-center">
                            {React.createElement(intentIcon((h as any).intent), { size: 12, color: '#92400E' })}
                            <Text className="text-amber-800 text-xs font-semibold ml-1">
                              {intentLabel((h as any).intent)}
                            </Text>
                          </View>
                        </View>
                        <Pressable
                          onPress={() => promote(h.user_id)}
                          className="bg-forest-600 rounded-full px-4 py-2 flex-row items-center"
                        >
                          <UserPlus size={14} color="#fff" />
                          <Text className="text-white font-semibold ml-1.5 text-sm">Promote</Text>
                        </Pressable>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Audience Section */}
              <View className="px-4 mt-4">
                <Text className="text-warmBrown font-bold text-lg mb-3">Audience ({audienceCount})</Text>
                <View className="bg-white rounded-2xl p-4">
                  {audience.length === 0 ? (
                    <Text className="text-gray-500 text-center py-2">No audience yet</Text>
                  ) : (
                    <View className="flex-row flex-wrap">
                      {audience.slice(0, 12).map((p) => (
                        <View key={p.id} className="items-center mx-2 mb-2">
                          <View className="w-12 h-12 rounded-full bg-gray-100 overflow-hidden">
                            {p.profile?.avatar_url ? (
                              <Image source={{ uri: p.profile.avatar_url }} style={{ width: 48, height: 48 }} contentFit="cover" />
                            ) : (
                              <View className="w-full h-full items-center justify-center">
                                <Text className="text-gray-500 font-medium">{(p.profile?.name || 'A').charAt(0)}</Text>
                              </View>
                            )}
                          </View>
                          <Text className="text-gray-600 text-xs mt-1" numberOfLines={1}>
                            {p.profile?.name?.split(' ')[0] || 'Anon'}
                          </Text>
                        </View>
                      ))}
                      {audience.length > 12 && (
                        <View className="items-center mx-2 mb-2">
                          <View className="w-12 h-12 rounded-full bg-gray-200 items-center justify-center">
                            <Text className="text-gray-600 font-bold text-sm">+{audience.length - 12}</Text>
                          </View>
                        </View>
                      )}
                    </View>
                  )}
                </View>
              </View>
            </ScrollView>

            {/* Bottom Controls */}
            <View className="absolute left-0 right-0 bottom-0 bg-cream/95 border-t border-gray-100 px-4 pb-6 pt-3">
              {/* Mic Status */}
              {canSpeakEffective && liveKitEnabled && (
                <View className="items-center mb-3">
                  <MicStatusIndicator micEnabled={micEnabled} speaking={lkSpeaking} />
                </View>
              )}

              {/* Main Controls */}
              <View className="flex-row items-center justify-between">
                <Pressable
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setPeopleOpen(true); }}
                  className="w-14 h-14 rounded-2xl bg-white border border-gray-200 items-center justify-center"
                >
                  <Users size={22} color="#2D1F1A" />
                </Pressable>

                {/* Big Mic Button */}
                <Pressable
                  onPress={() => {
                    if (!canSpeakEffective) {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      Alert.alert('Listener mode', 'Raise your hand to request speaking.');
                      return;
                    }
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    setMicEnabled((v) => !v);
                  }}
                >
                  <LinearGradient
                    colors={
                      canSpeakEffective
                        ? micEnabled
                          ? ['#DC2626', '#EF4444'] as const
                          : ['#1B4D3E', '#2D6A4F'] as const
                        : ['#9CA3AF', '#D1D5DB'] as const
                    }
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{ width: 72, height: 72, borderRadius: 24, alignItems: 'center', justifyContent: 'center' }}
                  >
                    {micEnabled ? <Mic size={28} color="#fff" /> : <MicOff size={28} color="#fff" />}
                  </LinearGradient>
                </Pressable>

                <Pressable
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setGiftsOpen(true); }}
                  className="w-14 h-14 rounded-2xl bg-white border border-gray-200 items-center justify-center"
                >
                  <Gift size={22} color="#C9A227" />
                </Pressable>
              </View>

              {/* Secondary Actions */}
              <View className="flex-row mt-3 gap-2">
                <Pressable
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setTestMicOpen(true); }}
                  className="flex-1 bg-white border border-gray-200 rounded-xl py-3 flex-row items-center justify-center"
                >
                  <AudioLines size={16} color="#2D1F1A" />
                  <Text className="text-warmBrown font-medium ml-2">Test Mic</Text>
                </Pressable>

                <Pressable
                  onPress={toggleHand}
                  className="flex-1 rounded-xl py-3 flex-row items-center justify-center"
                  style={{ backgroundColor: iRaised ? '#FEF3C7' : '#D4673A' }}
                >
                  <Hand size={16} color={iRaised ? '#D97706' : '#fff'} />
                  <Text className={`font-medium ml-2 ${iRaised ? 'text-amber-700' : 'text-white'}`}>
                    {iRaised ? 'Lower Hand' : 'Raise Hand'}
                  </Text>
                </Pressable>
              </View>

              {/* Silent participation */}
              <View className="flex-row mt-3 gap-2">
                <Pressable
                  onPress={async () => {
                    if (!currentUser?.id || !id) return;
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    try { await sendReaction(id, currentUser.id, 'agree'); } catch {}
                  }}
                  className="flex-1 bg-white border border-gray-200 rounded-xl py-3 flex-row items-center justify-center"
                >
                  <ThumbsUp size={16} color="#1B4D3E" />
                  <Text className="text-warmBrown font-semibold ml-2">Agree</Text>
                  <Text className="text-gray-500 font-semibold ml-2">{reactions.agree || 0}</Text>
                </Pressable>
                <Pressable
                  onPress={async () => {
                    if (!currentUser?.id || !id) return;
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    try { await sendReaction(id, currentUser.id, 'heart'); } catch {}
                  }}
                  className="w-16 bg-white border border-gray-200 rounded-xl py-3 items-center justify-center"
                >
                  <HeartHandshake size={18} color="#C45C26" />
                  <Text className="text-gray-500 font-semibold text-xs mt-1">{reactions.heart || 0}</Text>
                </Pressable>
                <Pressable
                  onPress={async () => {
                    if (!currentUser?.id || !id) return;
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    try { await sendReaction(id, currentUser.id, 'clap'); } catch {}
                  }}
                  className="w-16 bg-white border border-gray-200 rounded-xl py-3 items-center justify-center"
                >
                  <HandClap size={18} color="#C9A227" />
                  <Text className="text-gray-500 font-semibold text-xs mt-1">{reactions.clap || 0}</Text>
                </Pressable>
                <Pressable
                  onPress={async () => {
                    if (!currentUser?.id || !id) return;
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    try { await sendReaction(id, currentUser.id, 'fire'); } catch {}
                  }}
                  className="w-16 bg-white border border-gray-200 rounded-xl py-3 items-center justify-center"
                >
                  <Flame size={18} color="#DC2626" />
                  <Text className="text-gray-500 font-semibold text-xs mt-1">{reactions.fire || 0}</Text>
                </Pressable>
              </View>

              {/* Note to host */}
              <View className="flex-row mt-3 gap-2">
                <Pressable
                  onPress={() => {
                    if (!currentUser?.id) {
                      Alert.alert('Sign in required', 'Please sign in to send a note.');
                      return;
                    }
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setNoteOpen(true);
                  }}
                  className="flex-1 bg-white border border-gray-200 rounded-xl py-3 flex-row items-center justify-center"
                >
                  <MessageSquare size={16} color="#2D1F1A" />
                  <Text className="text-warmBrown font-medium ml-2">Note to host</Text>
                </Pressable>
                {isHost ? (
                  <Pressable
                    onPress={async () => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      try {
                        const n = await listNotes(id, 50);
                        setNotes(n);
                        setNotesOpen(true);
                      } catch (e: any) {
                        Alert.alert('Could not load notes', String(e?.message ?? e));
                      }
                    }}
                    className="bg-forest-600 rounded-xl px-4 py-3 flex-row items-center justify-center"
                  >
                    <Text className="text-white font-semibold">View notes</Text>
                  </Pressable>
                ) : null}
              </View>
            </View>

            {/* Context edit modal */}
            <Modal visible={contextOpen} transparent animationType="slide" onRequestClose={() => setContextOpen(false)}>
              <Pressable className="flex-1 bg-black/40" onPress={() => setContextOpen(false)}>
                <View className="flex-1 justify-end">
                  <Pressable onPress={(e) => e.stopPropagation()}>
                    <View className="bg-cream rounded-t-3xl p-5">
                      <View className="flex-row items-center justify-between mb-3">
                        <Text className="text-warmBrown font-bold text-lg">Edit room context</Text>
                        <Pressable onPress={() => setContextOpen(false)}>
                          <X size={22} color="#2D1F1A" />
                        </Pressable>
                      </View>

                      <Text className="text-gray-500 text-sm">Pinned title</Text>
                      <TextInput value={ctxPinnedTitle} onChangeText={setCtxPinnedTitle} className="mt-2 bg-white border border-gray-200 rounded-xl px-4 py-3 text-warmBrown" />

                      <Text className="text-gray-500 text-sm mt-3">Pinned route (example: /event/uuid)</Text>
                      <TextInput value={ctxPinnedRoute} onChangeText={setCtxPinnedRoute} autoCapitalize="none" className="mt-2 bg-white border border-gray-200 rounded-xl px-4 py-3 text-warmBrown" />

                      <Text className="text-gray-500 text-sm mt-3">Room rules</Text>
                      <TextInput value={ctxRules} onChangeText={setCtxRules} multiline className="mt-2 bg-white border border-gray-200 rounded-xl px-4 py-3 text-warmBrown" style={{ minHeight: 80, textAlignVertical: 'top' }} />

                      <Text className="text-gray-500 text-sm mt-3">Resources (one URL per line)</Text>
                      <TextInput value={ctxResources} onChangeText={setCtxResources} multiline autoCapitalize="none" className="mt-2 bg-white border border-gray-200 rounded-xl px-4 py-3 text-warmBrown" style={{ minHeight: 80, textAlignVertical: 'top' }} />

                      <Pressable
                        onPress={async () => {
                          if (!room?.id) return;
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                          try {
                            const resources = ctxResources
                              .split('\n')
                              .map((s) => s.trim())
                              .filter(Boolean);
                            await updateVoiceRoomContext(room.id, {
                              pinned_title: ctxPinnedTitle.trim() || null,
                              pinned_route: ctxPinnedRoute.trim() || null,
                              rules: ctxRules.trim() || null,
                              resources,
                            } as any);
                            const { data } = await supabase.from('voice_rooms').select('*').eq('id', room.id).single();
                            setRoom((data as DbVoiceRoom) ?? null);
                            setContextOpen(false);
                          } catch (e: any) {
                            Alert.alert('Could not save context', String(e?.message ?? e));
                          }
                        }}
                        className="mt-4 bg-forest-700 rounded-xl py-3 items-center"
                      >
                        <Text className="text-white font-semibold">Save</Text>
                      </Pressable>
                    </View>
                  </Pressable>
                </View>
              </Pressable>
            </Modal>

            {/* Note-to-host modal */}
            <Modal visible={noteOpen} transparent animationType="slide" onRequestClose={() => setNoteOpen(false)}>
              <Pressable className="flex-1 bg-black/40" onPress={() => setNoteOpen(false)}>
                <View className="flex-1 justify-end">
                  <Pressable onPress={(e) => e.stopPropagation()}>
                    <View className="bg-cream rounded-t-3xl p-5">
                      <View className="flex-row items-center justify-between mb-3">
                        <Text className="text-warmBrown font-bold text-lg">Note to host</Text>
                        <Pressable onPress={() => setNoteOpen(false)}>
                          <X size={22} color="#2D1F1A" />
                        </Pressable>
                      </View>
                      <TextInput
                        value={noteText}
                        onChangeText={setNoteText}
                        placeholder="Send a short note (question, request, etc.)"
                        placeholderTextColor="#9CA3AF"
                        multiline
                        className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-warmBrown"
                        style={{ minHeight: 110, textAlignVertical: 'top' }}
                      />
                      <Pressable
                        onPress={async () => {
                          if (!currentUser?.id || !id) return;
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                          try {
                            await sendNoteToHost(id, currentUser.id, noteText);
                            setNoteText('');
                            setNoteOpen(false);
                          } catch (e: any) {
                            Alert.alert('Could not send note', String(e?.message ?? e));
                          }
                        }}
                        className="mt-4 bg-terracotta-500 rounded-xl py-3 items-center"
                      >
                        <Text className="text-white font-semibold">Send</Text>
                      </Pressable>
                    </View>
                  </Pressable>
                </View>
              </Pressable>
            </Modal>

            {/* Notes list modal (host/mod) */}
            <Modal visible={notesOpen} transparent animationType="slide" onRequestClose={() => setNotesOpen(false)}>
              <Pressable className="flex-1 bg-black/40" onPress={() => setNotesOpen(false)}>
                <View className="flex-1 justify-end">
                  <Pressable onPress={(e) => e.stopPropagation()}>
                    <View className="bg-cream rounded-t-3xl p-5 max-h-[70%]">
                      <View className="flex-row items-center justify-between mb-3">
                        <Text className="text-warmBrown font-bold text-lg">Notes</Text>
                        <Pressable onPress={() => setNotesOpen(false)}>
                          <X size={22} color="#2D1F1A" />
                        </Pressable>
                      </View>
                      <ScrollView showsVerticalScrollIndicator={false}>
                        {notes.length === 0 ? (
                          <Text className="text-gray-500">No notes yet.</Text>
                        ) : (
                          notes.map((n) => (
                            <View key={n.id} className="bg-white border border-gray-100 rounded-xl p-3 mb-2">
                              <Text className="text-gray-700">{n.content}</Text>
                              <Text className="text-gray-400 text-xs mt-2">{new Date(n.created_at).toLocaleString()}</Text>
                            </View>
                          ))
                        )}
                      </ScrollView>
                    </View>
                  </Pressable>
                </View>
              </Pressable>
            </Modal>

            {/* Intent picker modal */}
            <Modal visible={intentOpen} transparent animationType="fade" onRequestClose={() => setIntentOpen(false)}>
              <Pressable className="flex-1 bg-black/40 items-center justify-center px-5" onPress={() => setIntentOpen(false)}>
                <Pressable onPress={(e) => e.stopPropagation()} className="w-full">
                  <View className="bg-cream rounded-3xl p-5">
                    <Text className="text-warmBrown font-bold text-xl">Raise hand as…</Text>
                    <Text className="text-gray-500 mt-1">Choose why you want to speak so the host knows.</Text>

                    {([
                      { id: 'question' as const, label: 'Question', icon: HelpCircle },
                      { id: 'insight' as const, label: 'Insight', icon: Lightbulb },
                      { id: 'announcement' as const, label: 'Announcement', icon: Megaphone },
                      { id: 'testimony' as const, label: 'Testimony / Story', icon: Sparkles },
                    ]).map((o) => (
                      <Pressable
                        key={o.id}
                        onPress={() => submitRaiseIntent(o.id)}
                        className="mt-3 bg-white border border-gray-200 rounded-2xl p-4 flex-row items-center"
                      >
                        <o.icon size={18} color="#1B4D3E" />
                        <Text className="text-warmBrown font-semibold ml-3">{o.label}</Text>
                      </Pressable>
                    ))}

                    <Pressable onPress={() => setIntentOpen(false)} className="mt-4 bg-gray-100 rounded-xl p-4 items-center">
                      <Text className="text-gray-600 font-medium">Cancel</Text>
                    </Pressable>
                  </View>
                </Pressable>
              </Pressable>
            </Modal>

            {/* Gifts Modal */}
            <Modal visible={giftsOpen} transparent animationType="slide" onRequestClose={() => setGiftsOpen(false)}>
              <Pressable className="flex-1 bg-black/40" onPress={() => setGiftsOpen(false)}>
                <View className="flex-1 justify-end">
                  <View className="bg-cream rounded-t-3xl p-5">
                    <View className="flex-row items-center justify-between mb-4">
                      <Text className="text-warmBrown font-bold text-lg">Send a Gift</Text>
                      <Pressable onPress={() => setGiftsOpen(false)}>
                        <X size={24} color="#2D1F1A" />
                      </Pressable>
                    </View>

                    <Text className="text-gray-500 mb-4">Support the host with a gift!</Text>

                    <View className="flex-row flex-wrap gap-3">
                      {GIFTS.map((g) => (
                        <Pressable
                          key={g.id}
                          onPress={() => { sendRoomGift(g.id, g.name, g.value); setGiftsOpen(false); }}
                          className="bg-white rounded-xl p-4 items-center"
                          style={{ width: '30%' }}
                        >
                          <Text className="text-2xl mb-1">{g.emoji}</Text>
                          <Text className="text-warmBrown font-semibold">{g.name}</Text>
                          <Text className="text-gold-600 font-bold">{g.value}</Text>
                        </Pressable>
                      ))}
                    </View>

                    {gifts.length > 0 && (
                      <View className="mt-6">
                        <Text className="text-warmBrown font-semibold mb-2">Recent Gifts</Text>
                        {gifts.slice(0, 5).map((t) => (
                          <View key={t.id} className="flex-row items-center py-1.5">
                            <Text className="text-gray-600 flex-1">{t.sender_name ?? 'Someone'} sent {t.gift_name}</Text>
                            <Text className="text-gold-600 font-semibold">{t.gift_value}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                </View>
              </Pressable>
            </Modal>

            {/* People Modal */}
            <Modal visible={peopleOpen} transparent animationType="slide" onRequestClose={() => setPeopleOpen(false)}>
              <Pressable className="flex-1 bg-black/40" onPress={() => setPeopleOpen(false)}>
                <View className="flex-1 justify-end">
                  <View className="bg-cream rounded-t-3xl p-5 max-h-[70%]">
                    <View className="flex-row items-center justify-between mb-4">
                      <Text className="text-warmBrown font-bold text-lg">People ({participants.length})</Text>
                      <Pressable onPress={() => setPeopleOpen(false)}>
                        <X size={24} color="#2D1F1A" />
                      </Pressable>
                    </View>

                    {isHost && (
                      <View className="gap-2 mb-4">
                        <Pressable onPress={hostEndRoom} className="bg-red-500 rounded-xl py-3 flex-row items-center justify-center">
                          <Square size={16} color="#fff" />
                          <Text className="text-white font-semibold ml-2">End Room</Text>
                        </Pressable>
                        <Pressable onPress={hostDeleteRoom} className="bg-red-100 rounded-xl py-3 flex-row items-center justify-center">
                          <Trash2 size={16} color="#DC2626" />
                          <Text className="text-red-600 font-semibold ml-2">Delete Room</Text>
                        </Pressable>
                      </View>
                    )}

                    <ScrollView showsVerticalScrollIndicator={false}>
                      {stage.length > 0 && (
                        <View className="mb-4">
                          <Text className="text-gray-500 font-medium mb-2">On Stage</Text>
                          {stage.map((p) => (
                            <View key={p.id} className="flex-row items-center py-2">
                              <View className="w-10 h-10 rounded-full bg-forest-100 overflow-hidden">
                                {p.profile?.avatar_url ? (
                                  <Image source={{ uri: p.profile.avatar_url }} style={{ width: 40, height: 40 }} contentFit="cover" />
                                ) : (
                                  <View className="w-full h-full items-center justify-center">
                                    <Text className="text-forest-700 font-medium">{(p.profile?.name || 'A').charAt(0)}</Text>
                                  </View>
                                )}
                              </View>
                              <View className="flex-1 ml-3">
                                <Text className="text-warmBrown font-medium">{p.profile?.name || 'Anonymous'}</Text>
                                <Text className="text-gray-400 text-sm capitalize">{p.role}</Text>
                              </View>
                              {p.role === 'host' && <Crown size={16} color="#C9A227" />}
                            </View>
                          ))}
                        </View>
                      )}

                      {audience.length > 0 && (
                        <View>
                          <Text className="text-gray-500 font-medium mb-2">Audience</Text>
                          {audience.map((p) => (
                            <View key={p.id} className="flex-row items-center py-2">
                              <View className="w-10 h-10 rounded-full bg-gray-100 overflow-hidden">
                                {p.profile?.avatar_url ? (
                                  <Image source={{ uri: p.profile.avatar_url }} style={{ width: 40, height: 40 }} contentFit="cover" />
                                ) : (
                                  <View className="w-full h-full items-center justify-center">
                                    <Text className="text-gray-500 font-medium">{(p.profile?.name || 'A').charAt(0)}</Text>
                                  </View>
                                )}
                              </View>
                              <Text className="text-warmBrown font-medium ml-3">{p.profile?.name || 'Anonymous'}</Text>
                            </View>
                          ))}
                        </View>
                      )}
                    </ScrollView>
                  </View>
                </View>
              </Pressable>
            </Modal>

            {/* Test Mic Modal */}
            <Modal
              visible={testMicOpen}
              transparent
              animationType="slide"
              onRequestClose={() => {
                cleanupTestAudio();
                cleanupTestRecording();
                setPauseLiveKitForTest(false);
                setTestMicOpen(false);
              }}
            >
              <Pressable className="flex-1 bg-black/40" onPress={() => {
                cleanupTestAudio();
                cleanupTestRecording();
                setPauseLiveKitForTest(false);
                setTestMicOpen(false);
              }}>
                <View className="flex-1 justify-end">
                  <Pressable onPress={(e) => e.stopPropagation()}>
                    <View className="bg-cream rounded-t-3xl p-5">
                      <View className="flex-row items-center justify-between mb-4">
                        <Text className="text-warmBrown font-bold text-lg">Test Your Mic</Text>
                        <Pressable onPress={async () => {
                          await cleanupTestAudio();
                          await cleanupTestRecording();
                          setPauseLiveKitForTest(false);
                          setTestMicOpen(false);
                        }}>
                          <X size={24} color="#2D1F1A" />
                        </Pressable>
                      </View>

                      {pauseLiveKitForTest && (
                        <View className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4">
                          <Text className="text-amber-800 font-medium">Room audio paused while testing</Text>
                        </View>
                      )}

                      <View className="bg-white rounded-xl p-4 mb-4">
                        <Text className="text-warmBrown font-semibold mb-2">Record & Playback</Text>
                        <Text className="text-gray-500 text-sm mb-4">
                          Record yourself and play it back to check your mic quality.
                        </Text>

                        <Text className="text-gray-400 text-sm mb-3">
                          Permission: {testPermGranted === null ? 'Unknown' : testPermGranted ? 'Granted' : 'Denied'} •
                          Recording: {testRecording ? `${testSeconds}s` : testRecordingUri ? 'Ready' : 'Not started'}
                        </Text>

                        <View className="flex-row gap-3">
                          <Pressable
                            onPress={testRecording ? stopTestRecording : startTestRecording}
                            disabled={testBusy}
                            className="flex-1 rounded-xl py-3 items-center"
                            style={{ backgroundColor: testRecording ? '#DC2626' : '#1B4D3E' }}
                          >
                            <Text className="text-white font-semibold">
                              {testRecording ? 'Stop' : 'Record'}
                            </Text>
                          </Pressable>

                          <Pressable
                            onPress={playTestRecording}
                            disabled={!testRecordingUri || testBusy}
                            className="flex-1 rounded-xl py-3 items-center"
                            style={{ backgroundColor: testRecordingUri ? '#C9A227' : '#E5E7EB' }}
                          >
                            <Text className={testRecordingUri ? 'text-white font-semibold' : 'text-gray-400 font-semibold'}>
                              Play
                            </Text>
                          </Pressable>
                        </View>
                      </View>
                    </View>
                  </Pressable>
                </View>
              </Pressable>
            </Modal>
          </>
        )}
      </SafeAreaView>
    </View>
  );
}

export default function VoiceRoomScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Delay to ensure navigation context is fully mounted
    const timer = setTimeout(() => setIsReady(true), 50);
    return () => clearTimeout(timer);
  }, []);

  // Show loading while navigation context initializes
  if (!isReady) {
    return (
      <View style={{ flex: 1, backgroundColor: '#FBF9F7', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#1B4D3E" />
        <Text style={{ color: '#2D1F1A', marginTop: 16 }}>Loading room...</Text>
      </View>
    );
  }

  if (!id) {
    return (
      <View style={{ flex: 1, backgroundColor: '#FBF9F7', alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: '#2D1F1A' }}>Room not found</Text>
      </View>
    );
  }

  return <VoiceRoomScreenContent id={id} />;
}
