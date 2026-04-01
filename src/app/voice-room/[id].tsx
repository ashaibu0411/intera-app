import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, Pressable, ActivityIndicator, ScrollView, Modal, Alert, Linking, TextInput, Platform } from 'react-native';
import { Stack, useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { Mic, MicOff, Gift, Crown, UserPlus, X, Users, Trash2, Square, ChevronDown, Volume2, VolumeX, UserMinus, MoreVertical, Pin, FileText, MessageSquare, Unlock } from 'lucide-react-native';
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
  sendNoteToHost,
  listNotes,
  getRecap,
  upsertParticipant,
  updateParticipantRole,
  listParticipantsWithProfiles,
  muteParticipant,
  unmuteParticipant,
  kickParticipant,
  demoteToListener,
  type ParticipantWithProfile,
} from '@/lib/voiceRooms';
import { startVoiceRoomHighlight, stopVoiceRoomHighlight } from '@/lib/voiceRoomEgress';
import { createClip } from '@/lib/clips-api';
import { buildVoiceRoomHighlightClipDescription } from '@/lib/voiceRoomMarkers';
import { aiVoiceRoomContext } from '@/lib/aiVoiceRoomContext';
import { sendGift } from '@/lib/giftService';
import { LiveKitRoom, RoomAudioRenderer, useRoomContext, useRemoteParticipants, isLiveKitAvailable, getLiveKitModule } from '@/lib/livekit-wrapper';

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
  activeSpeakers?: Array<{ identity?: string }>;
  on?: (event: string, handler: () => void) => void;
  off?: (event: string, handler: () => void) => void;
}

function RemoteMuteSync({ mutedUserIds }: { mutedUserIds: Set<string> }) {
  const remoteParticipants = useRemoteParticipants();
  useEffect(() => {
    for (const p of remoteParticipants) {
      const vol = mutedUserIds.has(String(p?.identity ?? '')) ? 0 : 1;
      try {
        (p as any)?.setVolume?.(vol);
      } catch {
        // ignore
      }
    }
  }, [mutedUserIds, remoteParticipants]);
  return null;
}

function LiveKitSpeakingBridge({
  onSpeakingChange,
  onActiveSpeakersChange,
}: {
  onSpeakingChange: (speaking: boolean) => void;
  onActiveSpeakersChange?: (speakerIdentities: string[]) => void;
}) {
  const room = useRoomContext() as LiveKitRoomContext | null;
  useEffect(() => {
    if (!room?.localParticipant) return;
    const lp = room.localParticipant;
    const sync = () => onSpeakingChange(!!lp.isSpeaking);
    sync();
    const onSpeaking = () => sync();
    const onActiveSpeakers = () => {
      sync();
      const speakers = ((room as any)?.activeSpeakers ?? []) as Array<{ identity?: string }>;
      const ids = speakers.map((s) => String(s?.identity ?? '')).filter(Boolean);
      onActiveSpeakersChange?.(ids);
    };
    lp.on?.('isSpeakingChanged', onSpeaking);
    room.on?.('activeSpeakersChanged', onActiveSpeakers);
    return () => {
      lp.off?.('isSpeakingChanged', onSpeaking);
      room.off?.('activeSpeakersChanged', onActiveSpeakers);
    };
  }, [onActiveSpeakersChange, onSpeakingChange, room]);
  return null;
}

function LiveKitAudioSessionSync({ enabled }: { enabled: boolean }) {
  const startedRef = useRef(false);
  useEffect(() => {
    const lk = getLiveKitModule();
    const start = async () => {
      if (!enabled || startedRef.current) return;
      try {
        startedRef.current = true;
        // Ensure audio plays even in silent mode and routes to speaker on mobile.
        if (Platform.OS !== 'web') {
          await Audio.setAudioModeAsync({
            allowsRecordingIOS: true,
            playsInSilentModeIOS: true,
            staysActiveInBackground: true,
            shouldDuckAndroid: false,
            playThroughEarpieceAndroid: false,
          });
        }
        await lk?.AudioSession?.startAudioSession?.();
      } catch (e) {
        startedRef.current = false;
        console.log('[LiveKit] AudioSession start failed:', String((e as any)?.message ?? e));
      }
    };
    const stop = async () => {
      if (!startedRef.current) return;
      startedRef.current = false;
      try {
        await lk?.AudioSession?.stopAudioSession?.();
      } catch {}
    };

    start();
    return () => {
      stop();
    };
  }, [enabled]);
  return null;
}

function LiveKitDiagnosticsModal({
  visible,
  onClose,
  lkUrl,
  effectiveUserId,
  role,
  canSpeakEffective,
  micEnabled,
}: {
  visible: boolean;
  onClose: () => void;
  lkUrl: string | null;
  effectiveUserId: string | null;
  role: string | null | undefined;
  canSpeakEffective: boolean;
  micEnabled: boolean;
}) {
  const room = useRoomContext() as any;
  const [snap, setSnap] = useState<Record<string, any>>({});

  useEffect(() => {
    if (!visible) return;
    let cancelled = false;

    const readState = () => {
      try {
        const r = room;
        const remoteParticipants =
          typeof r?.remoteParticipants?.size === 'number'
            ? r.remoteParticipants.size
            : Array.isArray(r?.remoteParticipants)
              ? r.remoteParticipants.length
              : typeof r?.participants?.size === 'number'
                ? Math.max(0, r.participants.size - 1)
                : null;

        let subscribedAudioTracks = 0;
        try {
          const iter =
            r?.remoteParticipants?.values?.() ??
            (Array.isArray(r?.remoteParticipants) ? r.remoteParticipants : []);
          const arr = Array.isArray(iter) ? iter : Array.from(iter);
          for (const p of arr) {
            const pubs = (p?.trackPublications?.values?.() ? Array.from(p.trackPublications.values()) : p?.trackPublications) ?? [];
            const pubsArr = Array.isArray(pubs) ? pubs : Array.from(pubs);
            for (const pub of pubsArr) {
              const kind = pub?.kind ?? pub?.track?.kind;
              const isSubscribed = pub?.isSubscribed ?? pub?.subscribed;
              if (String(kind) === 'audio' && !!isSubscribed) subscribedAudioTracks += 1;
            }
          }
        } catch {}

        const connectionState =
          r?.state?.connectionState ??
          r?.connectionState ??
          r?.engine?.connectionState ??
          null;

        const localMicEnabled =
          r?.localParticipant?.isMicrophoneEnabled ??
          r?.localParticipant?.microphoneEnabled ??
          null;

        const localIdentity = r?.localParticipant?.identity ?? null;

        return {
          connectionState,
          localIdentity,
          localMicEnabled,
          remoteParticipants,
          subscribedAudioTracks,
        };
      } catch (e) {
        return { error: String((e as any)?.message ?? e) };
      }
    };

    const tick = () => {
      if (cancelled) return;
      setSnap(readState());
    };

    tick();
    const t = setInterval(tick, 1000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, [room, visible]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable onPress={onClose} className="flex-1 bg-black/60 justify-center px-5">
        <Pressable onPress={() => null} className="bg-white rounded-2xl p-4">
          <View className="flex-row items-center justify-between">
            <Text className="text-warmBrown font-extrabold text-base">Voice diagnostics</Text>
            <Pressable onPress={onClose} hitSlop={10} className="p-2">
              <X size={18} color="#2D1F1A" />
            </Pressable>
          </View>

          <View className="mt-3">
            <Text className="text-gray-600 text-xs">User</Text>
            <Text className="text-warmBrown font-semibold" numberOfLines={1}>
              {effectiveUserId ?? '—'} {role ? `• ${role}` : ''}
            </Text>
          </View>

          <View className="mt-3">
            <Text className="text-gray-600 text-xs">Local state</Text>
            <Text className="text-warmBrown font-semibold">
              canSpeak={String(canSpeakEffective)} • micEnabled={String(micEnabled)}
            </Text>
          </View>

          <View className="mt-3">
            <Text className="text-gray-600 text-xs">LiveKit</Text>
            <Text className="text-warmBrown font-semibold" numberOfLines={1}>
              {lkUrl ? lkUrl : '—'}
            </Text>
            <Text className="text-gray-700 mt-2 text-sm">
              connectionState: <Text className="font-semibold">{String(snap.connectionState ?? '—')}</Text>
              {'\n'}localIdentity: <Text className="font-semibold">{String(snap.localIdentity ?? '—')}</Text>
              {'\n'}localMicEnabled: <Text className="font-semibold">{String(snap.localMicEnabled ?? '—')}</Text>
              {'\n'}remoteParticipants: <Text className="font-semibold">{String(snap.remoteParticipants ?? '—')}</Text>
              {'\n'}subscribedAudioTracks: <Text className="font-semibold">{String(snap.subscribedAudioTracks ?? '—')}</Text>
              {snap.error ? `\nerror: ${String(snap.error)}` : ''}
            </Text>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function MicStatusIndicator({ micEnabled, speaking }: { micEnabled: boolean; speaking?: boolean | null }) {
  const tone = !micEnabled ? 'off' : speaking ? 'on' : 'idle';
  const dot = tone === 'on' ? '#10B981' : tone === 'idle' ? '#C9A227' : '#9CA3AF';
  const label = tone === 'on' ? 'Speaking' : tone === 'idle' ? 'Mic on' : 'Muted';

  const [meter, setMeter] = useState<[number, number, number, number]>([6, 10, 14, 9]);
  useEffect(() => {
    if (tone !== 'on') return;
    let i = 0;
    const frames: Array<[number, number, number, number]> = [
      [6, 10, 14, 9],
      [8, 14, 18, 12],
      [5, 9, 13, 8],
      [10, 16, 20, 14],
      [7, 12, 16, 10],
    ];
    const t = setInterval(() => {
      i = (i + 1) % frames.length;
      setMeter(frames[i]);
    }, 140);
    return () => clearInterval(t);
  }, [tone]);

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
      {/* Simple "meter" bars like Zoom */}
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', marginRight: 8 }}>
        {meter.map((h, i) => (
          <View
            key={i}
            style={{
              width: 3,
              height: h,
              borderRadius: 2,
              marginRight: i === 3 ? 0 : 2,
              backgroundColor: tone === 'on' ? '#10B981' : tone === 'idle' ? '#C9A227' : '#9CA3AF',
              opacity: tone === 'on' ? 1 : 0.6,
            }}
          />
        ))}
      </View>
      <Text className="text-white text-xs font-semibold">{label}</Text>
    </View>
  );
}

function SpeakerAvatar({
  participant,
  isCurrentUser,
  isHost,
  isSpeakingNow,
  canModerate,
  onMute,
  onUnlock,
  onDemote,
  onKick
}: {
  participant: ParticipantWithProfile;
  isCurrentUser: boolean;
  isHost: boolean;
  isSpeakingNow?: boolean;
  canModerate: boolean;
  onMute?: () => void;
  onUnlock?: () => void;
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
        className="items-center mb-4"
        style={{ width: '33.3333%' }}
      >
        {isSpeakingNow && !participant.is_muted ? (
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              top: 2,
              left: '50%',
              marginLeft: -44,
              width: 88,
              height: 88,
              borderRadius: 32,
              borderWidth: 3,
              borderColor: '#10B981',
              shadowColor: '#10B981',
              shadowOpacity: 0.35,
              shadowRadius: 10,
              shadowOffset: { width: 0, height: 0 },
            }}
          />
        ) : null}
        <LinearGradient
          colors={ringColor as [string, string]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ width: 84, height: 84, borderRadius: 30, padding: 3 }}
        >
          <View className="flex-1 rounded-[27px] bg-cream overflow-hidden items-center justify-center">
            {avatar ? (
              <Image source={{ uri: avatar }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
            ) : (
              <View className="w-full h-full bg-forest-100 items-center justify-center">
                <Text className="text-forest-700 font-bold text-lg">{name.charAt(0).toUpperCase()}</Text>
              </View>
            )}
          </View>
        </LinearGradient>

        {/* Mic badge like Clubhouse */}
        <View
          style={{
            position: 'absolute',
            top: 58,
            left: '50%',
            marginLeft: 22,
            width: 26,
            height: 26,
            borderRadius: 13,
            backgroundColor: '#FFFFFF',
            borderWidth: 1,
            borderColor: 'rgba(17, 24, 39, 0.08)',
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: '#000',
            shadowOpacity: 0.08,
            shadowRadius: 8,
            shadowOffset: { width: 0, height: 2 },
          }}
        >
          {participant.is_muted ? <MicOff size={14} color="#6B7280" /> : <Mic size={14} color="#10B981" />}
        </View>

        <Text className="text-warmBrown font-semibold text-sm mt-2 px-2" numberOfLines={1}>
          {isCurrentUser ? 'You' : name.split(' ')[0]}
        </Text>

        <View className={`${roleColor} rounded-full px-2 py-0.5 mt-1`}>
          <Text className="text-white text-[10px] font-bold">{roleLabel}</Text>
        </View>

        {canModerate && !isCurrentUser && (
          <View className="absolute top-0 right-3 bg-warmBrown/80 rounded-full p-1">
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
                {participant.is_muted ? <Volume2 size={20} color="#1B4D3E" /> : <VolumeX size={20} color="#C9A227" />}
                <Text className="text-warmBrown font-medium ml-3">{participant.is_muted ? 'Unmute' : 'Mute'}</Text>
              </Pressable>

              {participant.is_muted && (participant as any)?.mute_locked && (
                <Pressable
                  onPress={() => { setShowActions(false); onUnlock?.(); }}
                  className="flex-row items-center bg-white rounded-xl p-4 mb-2"
                >
                  <Unlock size={20} color="#1B4D3E" />
                  <Text className="text-warmBrown font-medium ml-3">Unlock to allow self-unmute</Text>
                </Pressable>
              )}

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
  const [lkSpeaking, setLkSpeaking] = useState<boolean | null>(null);
  const [lkUrl, setLkUrl] = useState<string | null>(null);
  const [lkToken, setLkToken] = useState<string | null>(null);
  const [lkError, setLkError] = useState<string | null>(null);
  const [diagOpen, setDiagOpen] = useState(false);
  const [joinNonce, setJoinNonce] = useState(0);
  const [loading, setLoading] = useState(true);
  const [micEnabled, setMicEnabled] = useState(false);
  const autoMicTriedRef = useRef(false);
  const [contextOpen, setContextOpen] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [notesOpen, setNotesOpen] = useState(false);
  const [notes, setNotes] = useState<Array<{ id: string; user_id: string; content: string; created_at: string }>>([]);
  const [unreadNotesCount, setUnreadNotesCount] = useState(0);
  const [chatExpanded, setChatExpanded] = useState(false);
  const [activeSpeakerIds, setActiveSpeakerIds] = useState<string[]>([]);
  const [recap, setRecap] = useState<any>(null);

  const [ctxPinnedTitle, setCtxPinnedTitle] = useState('');
  const [ctxPinnedRoute, setCtxPinnedRoute] = useState('');
  const [ctxDescription, setCtxDescription] = useState('');
  const [ctxRules, setCtxRules] = useState('');
  const [ctxResources, setCtxResources] = useState('');
  const [ctxBusy, setCtxBusy] = useState(false);

  const [hlOpen, setHlOpen] = useState(false);
  const [hlLabel, setHlLabel] = useState('');
  const [hlBusy, setHlBusy] = useState(false);
  const [hlEgressId, setHlEgressId] = useState<string | null>(null);
  const [hlHighlightId, setHlHighlightId] = useState<string | null>(null);
  const [hlStoragePath, setHlStoragePath] = useState<string | null>(null);
  const [hlError, setHlError] = useState<string | null>(null);
  const [hlStartedAtMs, setHlStartedAtMs] = useState<number | null>(null);
  const [hlJustSaved, setHlJustSaved] = useState(false);
  const [hlTick, setHlTick] = useState(0);

  useEffect(() => {
    if (!hlEgressId) return;
    const t = setInterval(() => setHlTick((x) => (x + 1) % 1000000), 1000);
    return () => clearInterval(t);
  }, [hlEgressId]);

  const liveKitEnabled = isLiveKitAvailable();
  const hasRoomAudioRenderer = !!getLiveKitModule()?.RoomAudioRenderer;

  // Prefer JWT user id for RLS / LiveKit identity. Session can hydrate after Zustand on Android — wait before join.
  const [authUserId, setAuthUserId] = useState<string | null>(null);
  const [authResolved, setAuthResolved] = useState(false);
  useEffect(() => {
    let mounted = true;
    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        if (!mounted) return;
        setAuthUserId(session?.user?.id ?? null);
        setAuthResolved(true);
      })
      .catch(() => {
        if (mounted) {
          setAuthUserId(null);
          setAuthResolved(true);
        }
      });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setAuthUserId(session?.user?.id ?? null);
      setAuthResolved(true);
    });
    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const effectiveUserId = authUserId ?? currentUser?.id ?? null;

  // Safe navigation back
  const goBack = () => {
    try {
      router.replace('/(tabs)/voice-rooms' as never);
    } catch {
      // Fallback if navigation context isn't ready
      router.replace('/(tabs)/voice-rooms');
    }
  };

  const me = useMemo(() => {
    if (!effectiveUserId || !id) return null;
    return participants.find((p) => p.user_id === effectiveUserId) ?? null;
  }, [effectiveUserId, id, participants]);

  const isHost = useMemo(() => {
    if (!effectiveUserId || !room) return false;
    return room.creator_id === effectiveUserId || me?.role === 'host' || me?.role === 'moderator';
  }, [effectiveUserId, me?.role, room]);

  // Only speakers/mods/hosts can publish audio. Listeners must "ask to speak" to get promoted.
  const muteLocked = !!(me as any)?.mute_locked;
  const canSpeakByRole = me?.role === 'host' || me?.role === 'moderator' || me?.role === 'speaker' || isHost;
  const canSpeakEffective = !!(canSpeakByRole && !muteLocked);

  const roleLabel = me?.role ?? (isHost ? 'host' : null);

  // If server-side state says we're muted/locked or not allowed to speak, force local mic off.
  useEffect(() => {
    if (!me) return;
    if ((!canSpeakEffective || muteLocked) && micEnabled) {
      setMicEnabled(false);
    }
  }, [me?.id, muteLocked, micEnabled, canSpeakEffective]);

  const ensureMicPermission = useCallback(async (): Promise<boolean> => {
    try {
      const current = await Audio.getPermissionsAsync();
      if (current.granted) return true;
      const req = await Audio.requestPermissionsAsync();
      if (req.granted) return true;
      Alert.alert('Microphone permission needed', 'Enable microphone access to speak in voice rooms.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Open Settings', onPress: () => Linking.openSettings().catch(() => null) },
      ]);
      return false;
    } catch {
      return false;
    }
  }, []);

  const toggleMic = useCallback(async () => {
    if (!canSpeakEffective) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      if (muteLocked) {
        Alert.alert('Muted', 'You can only unmute when the host unmutes you or unlocks you to unmute yourself.’');
      } else {
        // Clubhouse-style: audience can request to speak (host promotes to speaker).
        const handUid = authUserId ?? effectiveUserId;
        if (!handUid) return;
        const already = !!hands.find((h) => h.user_id === handUid);
        try {
          if (already) {
            await lowerHand(id, handUid);
          } else {
            await raiseHand(id, handUid);
          }
        } catch (e: any) {
          Alert.alert('Could not update request', String(e?.message ?? e));
        }
      }
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const next = !micEnabled;
    if (next) {
      const ok = await ensureMicPermission();
      if (!ok) return;
    }
    setMicEnabled(next);
    // Sync mute state to DB (best-effort) — use JWT id so RLS matches Android/iOS reliably.
    if (id && authUserId) {
      supabase
        .from('voice_room_participants')
        .update({ is_muted: !next, last_seen: new Date().toISOString() })
        .eq('room_id', id)
        .eq('user_id', authUserId)
        .then(() => null)
        .catch(() => null);
    }
  }, [authUserId, canSpeakEffective, effectiveUserId, ensureMicPermission, hands, id, micEnabled, muteLocked]);

  // Auto-enable mic for hosts/speakers (best-effort, one time)
  useEffect(() => {
    if (!id || !authUserId) return;
    if (!liveKitEnabled) return;
    if (!isHost) return;
    if (micEnabled) return;
    if (autoMicTriedRef.current) return;
    autoMicTriedRef.current = true;
    (async () => {
      const ok = await ensureMicPermission();
      if (!ok) return;
      setMicEnabled(true);
      await supabase
        .from('voice_room_participants')
        .update({ is_muted: false, last_seen: new Date().toISOString() })
        .eq('room_id', id)
        .eq('user_id', authUserId);
    })().catch(() => null);
  }, [authUserId, ensureMicPermission, id, isHost, liveKitEnabled, micEnabled]);

  // Keep presence fresh (best-effort heartbeat)
  useEffect(() => {
    if (!id || !authUserId) return;
    let cancelled = false;
    const tick = async () => {
      if (cancelled) return;
      try {
        const shouldMuted = !micEnabled;
        await supabase
          .from('voice_room_participants')
          .update({ last_seen: new Date().toISOString(), is_muted: shouldMuted })
          .eq('room_id', id)
          .eq('user_id', authUserId);
      } catch {}
    };
    const t = setInterval(tick, 25000);
    tick().catch(() => null);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, [authUserId, id, micEnabled]);

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
      try {
        const p = await listParticipantsWithProfiles(id);
        setParticipants(p);
      } catch (e) {
        console.log('[VoiceRoom] loadParticipants failed:', String((e as any)?.message ?? e));
      }
    };
    const loadHands = async () => {
      try {
        const { data, error } = await supabase
          .from('voice_room_hand_raises')
          .select('*')
          .eq('room_id', id)
          .order('created_at', { ascending: true });
        if (error) throw error;
        setHands((data ?? []) as DbVoiceRoomHandRaise[]);
      } catch (e) {
        console.log('[VoiceRoom] load hands failed:', String((e as any)?.message ?? e));
      }
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
        loadHands
      )
      .subscribe();

    // Initial fetch
    loadParticipants();
    loadHands();

    // Reliability: poll in case realtime drops (common on mobile backgrounding / flaky networks).
    const poll = setInterval(() => {
      loadParticipants();
      loadHands();
    }, 4000);

    return () => {
      clearInterval(poll);
      supabase.removeChannel(channel);
    };
  }, [id]);

  // Subscribe to notes + alert host on new notes
  useEffect(() => {
    if (!id) return;
    const loadNotes = async () => {
      try {
        const n = await listNotes(id, 50);
        setNotes(n);
      } catch (e) {
        console.log('[VoiceRoom] loadNotes failed:', String((e as any)?.message ?? e));
      }
    };
    const channel = supabase
      .channel(`voice-room-notes:${id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'voice_room_notes', filter: `room_id=eq.${id}` },
        (payload) => {
          loadNotes();
          if (effectiveUserId && room?.creator_id === effectiveUserId) {
            setUnreadNotesCount((c) => c + 1);
            const content = (payload.new as { content?: string })?.content ?? '';
            Alert.alert('New note', `${content.slice(0, 100)}${content.length > 100 ? '…' : ''}`, [
              { text: 'View', onPress: () => { setNotesOpen(true); setUnreadNotesCount(0); setChatExpanded(true); } },
              { text: 'Dismiss', style: 'cancel', onPress: () => setUnreadNotesCount(0) },
            ]);
          }
        }
      )
      .subscribe();
    loadNotes();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [id, room?.creator_id, effectiveUserId]);

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
    if (!authResolved) return;
    let cancelled = false;

    const join = async () => {
      setLkError(null);
      setLkUrl(null);
      setLkToken(null);

      if (!authUserId) {
        setLkError('Sign in required to join this room.');
        return;
      }
      // Always upsert presence so counts work even if LiveKit isn't available.
      // Audience (listeners) join muted and locked - cannot unmute themselves until host unmutes or unlocks them.
      const roleResolved = room.creator_id === authUserId ? 'host' : 'listener';
      await upsertParticipant({
        roomId: id,
        userId: authUserId,
        role: roleResolved,
        isMuted: roleResolved === 'listener',
        muteLocked: roleResolved === 'listener',
      });

      if (!liveKitEnabled) {
        setLkError('LiveKit native modules are not available in this build. Build a dev/EAS client (not Expo Go) to use voice rooms.');
        return;
      }

      const tokenResp = await getLiveKitToken({
        roomName: room.provider_room_name,
        identity: authUserId,
        name: currentUser?.name ?? undefined,
        canPublish: roleResolved !== 'listener',
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
  }, [authResolved, authUserId, currentUser?.id, currentUser?.name, id, room, liveKitEnabled, joinNonce]);

  // Refresh token when role/mute-lock changes
  useEffect(() => {
    if (!id || !authUserId || !room || !me?.role) return;
    let cancelled = false;
    (async () => {
      if (!liveKitEnabled) return;
      setLkError(null);
      const tokenResp = await getLiveKitToken({
        roomName: room.provider_room_name,
        identity: authUserId,
        name: currentUser?.name ?? undefined,
        canPublish: (me.role === 'host' || me.role === 'moderator' || me.role === 'speaker') && !(me as any)?.mute_locked,
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
  }, [authUserId, currentUser?.id, currentUser?.name, id, me?.role, (me as any)?.mute_locked, room, liveKitEnabled]);

  // Leave room on unmount
  useEffect(() => {
    if (!id || !authUserId) return;
    return () => { leaveRoom(id, authUserId).catch(() => null); };
  }, [authUserId, id]);

  const promote = async (userId: string) => {
    if (!id) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await updateParticipantRole(id, userId, 'speaker');
    await unmuteParticipant(id, userId); // Unmute and unlock so they can speak
    await lowerHand(id, userId);
  };

  const handleMute = async (userId: string) => {
    if (!id) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const p = participants.find((x) => x.user_id === userId);
    if (p?.is_muted) await unmuteParticipant(id, userId);
    else await muteParticipant(id, userId);
  };

  const handleUnlock = async (userId: string) => {
    if (!id) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await unlockParticipant(id, userId);
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
    if (!effectiveUserId || !room) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const res = await sendGift({
      senderId: effectiveUserId,
      senderName: currentUser.name ?? 'Someone',
      recipientId: room.creator_id,
      recipientName: String(room.title || 'Host'),
      giftId,
      giftName,
      giftValue,
      roomId: room.id,
      roomTitle: room.title,
    });
    if (!res?.success) {
      if (res?.error === 'Insufficient gems') {
        Alert.alert('Not enough gems', 'Top up gems to send this gift.', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Get gems', onPress: () => router.push('/gem-store') },
        ]);
        return;
      }
      if (res?.error) Alert.alert('Gift failed', String(res.error));
      return;
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

  // Be forgiving: if a client temporarily fails to heartbeat, don't immediately hide them.
  const activeCutoffMs = Date.now() - 5 * 60 * 1000;
  const isActive = (p: ParticipantWithProfile) => {
    const raw = (p as any).last_seen ?? (p as any).joined_at ?? (p as any).created_at ?? null;
    const ts = raw ? new Date(raw).getTime() : 0;
    return ts > activeCutoffMs;
  };
  const activeParticipants = participants.filter(isActive);
  const stage = activeParticipants.filter((p) => p.role === 'host' || p.role === 'moderator' || p.role === 'speaker');
  const audience = activeParticipants.filter((p) => p.role === 'listener');
  const audienceCount = audience.length;
  // Speaking = anyone currently unmuted (including audience).
  const speakingCount = activeParticipants.filter((p) => {
    if (p.user_id === effectiveUserId) return !!micEnabled;
    return !p.is_muted;
  }).length;
  const listeningCount = activeParticipants.length;

  // Get hand raise user profiles
  const requestsWithProfiles = hands.map(h => {
    const participant = participants.find(p => p.user_id === h.user_id);
    return { ...h, profile: participant?.profile };
  });

  const mutedUserIds = useMemo(
    () => new Set(participants.filter((p) => p.is_muted).map((p) => p.user_id)),
    [participants]
  );

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
                  <View className="flex-row mt-3 gap-2">
                    <Pressable onPress={hostReopenRoom} className="flex-1 bg-forest-700 rounded-xl px-4 py-3 items-center">
                      <Text className="text-white font-semibold">Reopen room</Text>
                    </Pressable>
                    <Pressable onPress={hostDeleteRoom} className="flex-1 bg-red-100 border border-red-200 rounded-xl px-4 py-3 items-center">
                      <Text className="text-red-600 font-semibold">Delete</Text>
                    </Pressable>
                  </View>
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
                  <Text className="text-forest-700 font-medium ml-1.5">{speakingCount} speaking</Text>
                </View>
                <View className="flex-row items-center flex-1">
                  <Volume2 size={16} color="#C9A227" />
                  <Text className="text-gold-600 font-medium ml-1.5">{listeningCount} listening</Text>
                </View>
                {isHost ? (
                  <>
                    <Pressable
                      onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); hostEndRoom().catch(() => null); }}
                      className="bg-red-50 border border-red-200 rounded-full px-4 py-2 mr-2"
                    >
                      <Text className="text-red-600 font-semibold">End</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); hostDeleteRoom(); }}
                      className="bg-red-100 border border-red-200 rounded-full px-3 py-2 mr-2"
                      hitSlop={8}
                    >
                      <Trash2 size={16} color="#DC2626" />
                    </Pressable>
                  </>
                ) : null}
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
                      setCtxDescription(String(room.description || ''));
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
                key={lkToken}
                serverUrl={lkUrl}
                token={lkToken}
                connect
                // Must stay true for audience: iOS needs the audio session active to *hear* remote tracks.
                // Local mic publish is still gated by token canPublish + MicSync.
                audio
                video={false}
              >
                <RoomAudioRenderer />
                <LiveKitAudioSessionSync enabled />
                <MicSync enabled={!!(canSpeakEffective && micEnabled)} />
                <RemoteMuteSync mutedUserIds={mutedUserIds} />
                <LiveKitSpeakingBridge onSpeakingChange={setLkSpeaking} onActiveSpeakersChange={setActiveSpeakerIds} />
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
                  <Pressable onPress={() => setDiagOpen(true)} className="bg-white border border-red-200 rounded-full px-4 py-2">
                    <Text className="text-red-700 font-semibold">Diagnostics</Text>
                  </Pressable>
                  <Pressable onPress={goBack} className="bg-white border border-red-200 rounded-full px-4 py-2">
                    <Text className="text-red-700 font-semibold">Back</Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              <View className="mx-4 mt-3 bg-gold-50 border border-gold-200 rounded-xl p-4">
                <View className="flex-row items-center justify-between">
                  <Text className="text-gold-800 font-semibold">Connecting audio...</Text>
                  <Pressable onPress={() => setDiagOpen(true)} className="px-3 py-1.5 rounded-full bg-white/70 border border-gold-200">
                    <Text className="text-gold-800 font-semibold text-xs">Diagnostics</Text>
                  </Pressable>
                </View>
                <Text className="text-gold-600 text-sm mt-1">Please wait while we connect you to the room.</Text>
                {liveKitEnabled && !hasRoomAudioRenderer ? (
                  <Text className="text-gold-700 text-sm mt-2 font-semibold">
                    Audio module is missing in this build. Update to the latest build to hear participants.
                  </Text>
                ) : null}
              </View>
            )}

            {/* Only render diagnostics inside LiveKit context to avoid hook crashes */}
            {lkUrl && lkToken ? (
              <LiveKitRoom
                key={`diag:${lkToken}`}
                serverUrl={lkUrl}
                token={lkToken}
                connect={false}
                audio={false}
                video={false}
              >
                <LiveKitDiagnosticsModal
                  visible={diagOpen}
                  onClose={() => setDiagOpen(false)}
                  lkUrl={lkUrl}
                  effectiveUserId={effectiveUserId}
                  role={roleLabel}
                  canSpeakEffective={!!canSpeakEffective}
                  micEnabled={!!micEnabled}
                />
              </LiveKitRoom>
            ) : null}

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

              {/* Speakers / Stage */}
              <View className="px-4 mt-4">
                <View className="flex-row items-center justify-between mb-3">
                  <Text className="text-warmBrown font-bold text-lg">Speakers</Text>
                  <View className="flex-row items-center">
                    <Text className="text-gray-500 font-semibold mr-3">{stage.length}</Text>
                    <Pressable
                      onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setPeopleOpen(true); }}
                      className="bg-gray-100 rounded-full px-3 py-1.5"
                    >
                      <Text className="text-gray-700 font-semibold text-xs">See all</Text>
                    </Pressable>
                  </View>
                </View>
                <View className="bg-white rounded-3xl p-4 border border-gray-100">
                  {stage.length === 0 ? (
                    <Text className="text-gray-500 text-center py-4">No speakers yet</Text>
                  ) : (
                    <View className="flex-row flex-wrap">
                      {stage.map((p) => (
                        <SpeakerAvatar
                          key={p.id}
                          participant={p}
                          isCurrentUser={p.user_id === effectiveUserId}
                          isHost={p.role === 'host'}
                          isSpeakingNow={activeSpeakerIds.includes(p.user_id)}
                          canModerate={isHost && p.user_id !== effectiveUserId}
                          onMute={() => handleMute(p.user_id)}
                          onDemote={() => handleDemote(p.user_id)}
                          onKick={() => handleKick(p.user_id)}
                        />
                      ))}
                    </View>
                  )}
                </View>
              </View>

              {/* Requests to speak (Host only) */}
              {isHost && requestsWithProfiles.length > 0 && (
                <View className="px-4 mt-4">
                  <Text className="text-warmBrown font-bold text-lg mb-3">Requests</Text>
                  <View className="bg-gold-50 border border-gold-200 rounded-2xl p-4">
                    {requestsWithProfiles.map((h) => (
                      <View key={h.id} className="flex-row items-center justify-between py-2">
                        <View className="flex-row items-center">
                          <Text className="text-warmBrown font-medium">
                            {h.profile?.name || 'Anonymous'}
                          </Text>
                        </View>
                        <Pressable
                          onPress={() => promote(h.user_id)}
                          className="bg-forest-600 rounded-full px-4 py-2 flex-row items-center"
                        >
                          <UserPlus size={14} color="#fff" />
                          <Text className="text-white font-semibold ml-1.5 text-sm">Make speaker</Text>
                        </Pressable>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Audience Section */}
              <View className="px-4 mt-4">
                <View className="flex-row items-center justify-between mb-3">
                  <Text className="text-warmBrown font-bold text-lg">Audience</Text>
                  <View className="flex-row items-center">
                    <Text className="text-gray-500 font-semibold mr-3">{audienceCount}</Text>
                    <Pressable
                      onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setPeopleOpen(true); }}
                      className="bg-gray-100 rounded-full px-3 py-1.5"
                    >
                      <Text className="text-gray-700 font-semibold text-xs">See all</Text>
                    </Pressable>
                  </View>
                </View>
                <View className="bg-white rounded-3xl p-4 border border-gray-100">
                  {audience.length === 0 ? (
                    <Text className="text-gray-500 text-center py-2">No audience yet</Text>
                  ) : (
                    <View className="flex-row flex-wrap">
                      {audience.slice(0, 36).map((p) => (
                        <View key={p.id} className="items-center mb-3" style={{ width: '25%' }}>
                          <View
                            style={{
                              width: 56,
                              height: 56,
                              borderRadius: 28,
                              backgroundColor: '#F3F4F6',
                              overflow: 'hidden',
                              borderWidth: 1,
                              borderColor: 'rgba(17, 24, 39, 0.06)',
                            }}
                          >
                            {p.profile?.avatar_url ? (
                              <Image source={{ uri: p.profile.avatar_url }} style={{ width: 56, height: 56 }} contentFit="cover" />
                            ) : (
                              <View className="w-full h-full items-center justify-center">
                                <Text className="text-gray-700 font-bold">{(p.profile?.name || 'A').charAt(0).toUpperCase()}</Text>
                              </View>
                            )}
                          </View>
                          <Text className="text-gray-700 text-xs mt-1 px-1" numberOfLines={1}>
                            {p.profile?.name?.split(' ')[0] || 'Anon'}
                          </Text>
                        </View>
                      ))}
                      {audience.length > 36 ? (
                        <View className="items-center mb-3" style={{ width: '25%' }}>
                          <View
                            style={{
                              width: 56,
                              height: 56,
                              borderRadius: 28,
                              backgroundColor: '#E5E7EB',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <Text className="text-gray-700 font-bold text-sm">+{audience.length - 36}</Text>
                          </View>
                          <Text className="text-gray-500 text-xs mt-1">more</Text>
                        </View>
                      ) : null}
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
                    toggleMic().catch(() => null);
                  }}
                >
                  {micEnabled && lkSpeaking ? (
                    <View
                      pointerEvents="none"
                      style={{
                        position: 'absolute',
                        top: -6,
                        left: -6,
                        right: -6,
                        bottom: -6,
                        borderRadius: 28,
                        borderWidth: 3,
                        borderColor: '#10B981',
                        shadowColor: '#10B981',
                        shadowOpacity: 0.35,
                        shadowRadius: 10,
                        shadowOffset: { width: 0, height: 0 },
                      }}
                    />
                  ) : null}
                  <LinearGradient
                    colors={
                      canSpeakEffective
                        ? micEnabled
                          ? ['#1B4D3E', '#2D6A4F'] as const
                          : ['#DC2626', '#EF4444'] as const
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
                      setUnreadNotesCount(0);
                      try {
                        const n = await listNotes(id, 50);
                        setNotes(n);
                        setNotesOpen(true);
                        setChatExpanded(true);
                      } catch (e: any) {
                        Alert.alert('Could not load notes', String(e?.message ?? e));
                      }
                    }}
                    className="bg-forest-600 rounded-xl px-4 py-3 flex-row items-center justify-center"
                  >
                    <Text className="text-white font-semibold">View notes</Text>
                    {unreadNotesCount > 0 ? (
                      <View className="ml-2 bg-amber-400 rounded-full min-w-[20px] h-5 items-center justify-center px-1.5">
                        <Text className="text-forest-800 font-bold text-xs">{unreadNotesCount > 99 ? '99+' : unreadNotesCount}</Text>
                      </View>
                    ) : null}
                  </Pressable>
                ) : null}
              </View>

              {/* Chat / Notes panel - visible in voice room space */}
              <Pressable
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setChatExpanded((e) => !e); }}
                className="mt-3 bg-white border border-gray-200 rounded-xl p-3 flex-row items-center justify-between"
              >
                <View className="flex-row items-center">
                  <MessageSquare size={18} color="#2D1F1A" />
                  <Text className="text-warmBrown font-semibold ml-2">Chat & notes</Text>
                  {notes.length > 0 && (
                    <Text className="text-gray-500 text-sm ml-2">({notes.length})</Text>
                  )}
                  {isHost && unreadNotesCount > 0 && (
                    <View className="ml-2 bg-amber-400 rounded-full min-w-[18px] h-4.5 items-center justify-center px-1">
                      <Text className="text-forest-800 font-bold text-xs">{unreadNotesCount > 99 ? '99+' : unreadNotesCount}</Text>
                    </View>
                  )}
                </View>
                <ChevronDown size={20} color="#6B7280" style={{ transform: [{ rotate: chatExpanded ? '180deg' : '0deg' }] }} />
              </Pressable>
              {chatExpanded && (
                <View className="mt-2 bg-gray-50 border border-gray-100 rounded-xl p-3 max-h-48">
                  <ScrollView showsVerticalScrollIndicator={false} className="max-h-32">
                    {notes.length === 0 ? (
                      <Text className="text-gray-500 text-sm">No notes yet. Send a note to the host above.</Text>
                    ) : (
                      notes.slice(0, 10).map((n) => (
                        <View key={n.id} className="bg-white rounded-lg p-2 mb-2 border border-gray-100">
                          <Text className="text-gray-700 text-sm">{n.content}</Text>
                          <Text className="text-gray-400 text-xs mt-1">{new Date(n.created_at).toLocaleTimeString()}</Text>
                        </View>
                      ))
                    )}
                  </ScrollView>
                  <Pressable
                    onPress={() => {
                      if (!currentUser?.id) {
                        Alert.alert('Sign in required', 'Please sign in to send a note.');
                        return;
                      }
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setNoteOpen(true);
                    }}
                    className="mt-2 bg-terracotta-500 rounded-lg py-2 items-center"
                  >
                    <Text className="text-white font-semibold text-sm">Send note</Text>
                  </Pressable>
                </View>
              )}

              {/* Host highlight recording */}
              {isHost ? (
                <View className="mt-3">
                  <View className="flex-row gap-2">
                    <Pressable
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setHlError(null);
                        setHlJustSaved(false);
                        if (hlEgressId) return; // already recording
                        setHlLabel('');
                        setHlOpen(true);
                      }}
                      className={`flex-1 rounded-xl py-3 items-center justify-center ${hlEgressId ? 'bg-red-600' : 'bg-forest-700'}`}
                    >
                      <Text className="text-white font-semibold">
                        {hlEgressId ? 'Recording highlight…' : 'Record highlight'}
                      </Text>
                    </Pressable>

                    {hlEgressId ? (
                      <Pressable
                        onPress={async () => {
                          if (!id || !hlEgressId || !hlHighlightId) return;
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                          setHlBusy(true);
                          setHlError(null);
                          try {
                            await stopVoiceRoomHighlight({ roomId: id, highlightId: hlHighlightId, egressId: hlEgressId });

                            // Create clip entry pointing at the storage object path.
                            if (currentUser?.id && room && hlStoragePath) {
                              const desc = buildVoiceRoomHighlightClipDescription({
                                roomId: id,
                                roomTitle: room.title,
                                label: hlLabel || 'Voice room highlight',
                              });
                              const clip = await createClip({
                                user_id: currentUser.id,
                                video_url: hlStoragePath,
                                description: desc,
                              });
                              // Link highlight -> clip
                              if (clip?.id) {
                                await supabase
                                  .from('voice_room_highlights')
                                  .update({ status: 'ready', clip_id: clip.id, stopped_at: new Date().toISOString() })
                                  .eq('id', hlHighlightId);
                              }
                            }

                            setHlJustSaved(true);
                            setTimeout(() => setHlJustSaved(false), 4500);
                          } catch (e: any) {
                            setHlError(String(e?.message ?? e));
                          } finally {
                            setHlBusy(false);
                            setHlEgressId(null);
                            setHlHighlightId(null);
                            setHlStoragePath(null);
                            setHlStartedAtMs(null);
                          }
                        }}
                        disabled={hlBusy}
                        className="bg-red-600 rounded-xl px-4 py-3 items-center justify-center"
                      >
                        <Text className="text-white font-semibold">{hlBusy ? 'Stopping…' : 'Stop'}</Text>
                      </Pressable>
                    ) : null}
                  </View>

                  {/* Inline recording status + errors */}
                  <View className="mt-2">
                    {hlEgressId ? (
                      <Text className="text-gray-600 font-semibold">
                        Recording • {(() => {
                          const ms = hlStartedAtMs ? Math.max(0, Date.now() - hlStartedAtMs) : 0;
                          const s = Math.floor(ms / 1000);
                          const mm = String(Math.floor(s / 60)).padStart(2, '0');
                          const ss = String(s % 60).padStart(2, '0');
                          // use hlTick to re-render each second
                          void hlTick;
                          return `${mm}:${ss}`;
                        })()}
                      </Text>
                    ) : hlJustSaved ? (
                      <Text className="text-forest-700 font-semibold">Saved ✓ Processing highlight…</Text>
                    ) : hlError ? (
                      <Text className="text-red-600 font-semibold" numberOfLines={2}>
                        Highlight failed: {hlError}
                      </Text>
                    ) : (
                      <Text className="text-gray-500">Highlights save short moments to Clips.</Text>
                    )}
                  </View>
                </View>
              ) : null}
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

                      <View className="flex-row gap-2">
                        <Pressable
                          onPress={async () => {
                            if (!room?.id) return;
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            setCtxBusy(true);
                            try {
                              const existing = {
                                description: ctxDescription || room.description || null,
                                pinned_title: ctxPinnedTitle || (room as any).pinned_title || null,
                                pinned_route: ctxPinnedRoute || (room as any).pinned_route || null,
                                rules: ctxRules || (room as any).rules || null,
                                resources: (ctxResources ? ctxResources.split('\n').map((s) => s.trim()).filter(Boolean) : (room as any).resources) || [],
                              };
                              const res = await aiVoiceRoomContext({ roomId: room.id, existing });
                              setCtxDescription(res.description || '');
                              setCtxPinnedTitle(res.pinned_title || '');
                              setCtxPinnedRoute(res.pinned_route || '');
                              setCtxRules(res.rules || '');
                              setCtxResources((res.resources || []).join('\n'));
                            } catch (e: any) {
                              Alert.alert('AI failed', String(e?.message ?? e));
                            } finally {
                              setCtxBusy(false);
                            }
                          }}
                          disabled={ctxBusy}
                          className={`flex-1 rounded-xl py-3 items-center justify-center ${ctxBusy ? 'bg-gray-200' : 'bg-terracotta-500'}`}
                        >
                          <Text className={`${ctxBusy ? 'text-gray-500' : 'text-white'} font-semibold`}>
                            {ctxBusy ? 'Generating…' : 'AI Generate'}
                          </Text>
                        </Pressable>

                        <Pressable
                          onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            setCtxDescription(String(room?.description || ''));
                            setCtxPinnedTitle(String((room as any).pinned_title || ''));
                            setCtxPinnedRoute(String((room as any).pinned_route || ''));
                            setCtxRules(String((room as any).rules || ''));
                            setCtxResources(((room as any).resources || []).join('\n'));
                          }}
                          className="bg-gray-100 rounded-xl px-4 py-3 items-center justify-center"
                        >
                          <Text className="text-gray-700 font-semibold">Reset</Text>
                        </Pressable>
                      </View>

                      <Text className="text-gray-500 text-sm mt-4">Description</Text>
                      <TextInput
                        value={ctxDescription}
                        onChangeText={setCtxDescription}
                        placeholder="1–2 sentences about what this room is for"
                        placeholderTextColor="#9CA3AF"
                        multiline
                        className="mt-2 bg-white border border-gray-200 rounded-xl px-4 py-3 text-warmBrown"
                        style={{ minHeight: 70, textAlignVertical: 'top' }}
                      />

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
                              description: ctxDescription.trim() || null,
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
                            await sendNoteToHost(id, currentUser.id, noteText, currentUser.name ?? undefined);
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

            {/* Start highlight modal */}
            <Modal visible={hlOpen} transparent animationType="slide" onRequestClose={() => setHlOpen(false)}>
              <Pressable className="flex-1 bg-black/40" onPress={() => setHlOpen(false)}>
                <View className="flex-1 justify-end">
                  <Pressable onPress={(e) => e.stopPropagation()}>
                    <View className="bg-cream rounded-t-3xl p-5">
                      <View className="flex-row items-center justify-between mb-3">
                        <Text className="text-warmBrown font-bold text-lg">Record a highlight</Text>
                        <Pressable onPress={() => setHlOpen(false)}>
                          <X size={22} color="#2D1F1A" />
                        </Pressable>
                      </View>
                      <Text className="text-gray-500 text-sm">
                        This will record a short segment and upload it to your Clips bucket.
                      </Text>
                      <TextInput
                        value={hlLabel}
                        onChangeText={setHlLabel}
                        placeholder="Label (optional): e.g. Best advice, Key takeaway"
                        placeholderTextColor="#9CA3AF"
                        className="mt-3 bg-white border border-gray-200 rounded-xl px-4 py-3 text-warmBrown"
                      />
                      <Pressable
                        onPress={async () => {
                          if (!id || !room) return;
                          setHlBusy(true);
                          setHlError(null);
                          setHlJustSaved(false);
                          try {
                            const res = await startVoiceRoomHighlight({ roomId: id, label: hlLabel });
                            setHlEgressId(res.egressId);
                            setHlHighlightId(res.highlightId);
                            setHlStoragePath(res.storagePath);
                            setHlOpen(false);
                            setHlStartedAtMs(Date.now());
                          } catch (e: any) {
                            setHlError(String(e?.message ?? e));
                          } finally {
                            setHlBusy(false);
                          }
                        }}
                        disabled={hlBusy}
                        className="mt-4 bg-forest-700 rounded-xl py-3 items-center"
                      >
                        <Text className="text-white font-semibold">{hlBusy ? 'Starting…' : 'Start recording'}</Text>
                      </Pressable>
                    </View>
                  </Pressable>
                </View>
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
                              {activeSpeakerIds.includes(p.user_id) && !p.is_muted ? (
                                <View className="mr-2 flex-row items-end">
                                  <View style={{ width: 3, height: 10, borderRadius: 2, backgroundColor: '#10B981', marginRight: 2 }} />
                                  <View style={{ width: 3, height: 14, borderRadius: 2, backgroundColor: '#10B981', marginRight: 2 }} />
                                  <View style={{ width: 3, height: 8, borderRadius: 2, backgroundColor: '#10B981' }} />
                                </View>
                              ) : null}
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

export function ErrorBoundary({ error, retry }: { error: Error; retry: () => void }) {
  return (
    <View style={{ flex: 1, backgroundColor: '#FBF9F7', padding: 20, justifyContent: 'center' }}>
      <Text style={{ color: '#2D1F1A', fontWeight: '800', fontSize: 18 }}>Voice room failed to open</Text>
      <Text style={{ color: '#6B7280', marginTop: 10 }}>
        {String(error?.message || error)}
      </Text>
      <View style={{ flexDirection: 'row', marginTop: 16 }}>
        <Pressable
          onPress={retry}
          style={{ backgroundColor: '#1B4D3E', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, marginRight: 10 }}
        >
          <Text style={{ color: 'white', fontWeight: '700' }}>Retry</Text>
        </Pressable>
        <Pressable
          onPress={() => router.replace('/(tabs)/voice-rooms' as never)}
          style={{ backgroundColor: '#EFE7E2', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12 }}
        >
          <Text style={{ color: '#2D1F1A', fontWeight: '700' }}>Back</Text>
        </Pressable>
      </View>
    </View>
  );
}
