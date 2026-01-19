import React, { useEffect, useMemo, useState, Component, ReactNode } from 'react';
import { View, Text, Pressable, ActivityIndicator, ScrollView, Modal, Alert, Linking } from 'react-native';
import { Stack, useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { Mic, MicOff, Hand, Gift, Crown, UserPlus, X, Users, AudioLines, Trash2, Square, ChevronDown, Volume2, VolumeX, UserMinus, MoreVertical } from 'lucide-react-native';
import { LiveKitRoom, useRoomContext, isLiveKitAvailable } from '@/lib/livekit-wrapper';
import { LinearGradient } from 'expo-linear-gradient';
import { Audio } from 'expo-av';
import * as Sharing from 'expo-sharing';
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
  upsertParticipant,
  updateParticipantRole,
  listParticipantsWithProfiles,
  muteParticipant,
  kickParticipant,
  demoteToListener,
  type ParticipantWithProfile
} from '@/lib/voiceRooms';
import { sendGift } from '@/lib/giftService';

// Error boundary to catch navigation context errors
class NavigationErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    // Log navigation context errors but don't crash
    if (error.message?.includes('navigation context')) {
      console.log('[VoiceRoom] Navigation context not ready, retrying...');
    }
  }

  render() {
    if (this.state.hasError) {
      // Return a loading screen that will auto-retry
      return (
        <View className="flex-1 bg-cream-50 items-center justify-center">
          <ActivityIndicator size="large" color="#1B4D3E" />
          <Text className="text-warmBrown mt-4">Loading room...</Text>
        </View>
      );
    }
    return this.props.children;
  }
}

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

// LiveKit room context type for speaking detection
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

function VoiceRoomScreenContent() {
  const { id } = useLocalSearchParams<{ id: string }>();
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
    if (!id || !currentUser?.id || !room) return;
    if (room.status === 'ended') return;
    let cancelled = false;

    const join = async () => {
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

    join().catch(() => {});
    return () => { cancelled = true; };
  }, [currentUser?.id, currentUser?.name, id, room]);

  // Refresh token when role changes
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
      if (!(me.role === 'host' || me.role === 'moderator' || me.role === 'speaker')) {
        setMicEnabled(false);
      }
    })().catch(() => null);
    return () => { cancelled = true; };
  }, [currentUser?.id, currentUser?.name, id, me?.role, room]);

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
    else await raiseHand(id, currentUser.id);
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
    } catch (e: any) {
      Alert.alert('Mic test failed', String(e?.message ?? e));
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
          try { await endVoiceRoom(room.id); } finally { router.back(); }
        },
      },
    ]);
  };

  const hostDeleteRoom = async () => {
    if (!room?.id) return;
    Alert.alert('Delete room?', 'This permanently deletes the room.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try { await deleteVoiceRoom(room.id); } finally { router.back(); }
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
            <Pressable onPress={() => router.back()} className="mt-4 bg-terracotta-500 rounded-xl px-6 py-3">
              <Text className="text-white font-semibold">Go back</Text>
            </Pressable>
          </View>
        ) : (
          <>
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
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.back(); }}
                  className="bg-gray-100 rounded-full px-4 py-2"
                >
                  <Text className="text-gray-600 font-medium">Leave</Text>
                </Pressable>
              </View>
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
            ) : (
              <View className="mx-4 mt-3 bg-gold-50 border border-gold-200 rounded-xl p-4">
                <Text className="text-gold-800 font-semibold">Connecting audio...</Text>
                <Text className="text-gold-600 text-sm mt-1">Please wait while we connect you to the room.</Text>
              </View>
            )}

            <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 200 }} showsVerticalScrollIndicator={false}>
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
              {canSpeakEffective && (
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
            </View>

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

// Wrap the screen in an error boundary to handle navigation context errors
export default function VoiceRoomScreen() {
  return (
    <NavigationErrorBoundary>
      <VoiceRoomScreenContent />
    </NavigationErrorBoundary>
  );
}
