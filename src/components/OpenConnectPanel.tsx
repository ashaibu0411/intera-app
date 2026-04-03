/**
 * Open to connect — lobby (same city), sync to Supabase, local timer cache.
 * Renders inside Connect tab (or legacy stack route); use composerReturnTo for post flow.
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  Switch,
  Alert,
  Platform,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { Users, Shield, Sparkles, MessageCircle, EyeOff, ChevronRight } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useStore } from '@/lib/store';
import {
  OPEN_CONNECT_CONTEXTS,
  OPEN_CONNECT_VIBES,
  OPEN_CONNECT_DURATIONS,
  openConnectContextLabel,
  openConnectVibeLabel,
  sanitizeConnectDisplayAlias,
  sanitizeConnectSessionIntro,
  fallbackConnectHandle,
  CONNECT_DISPLAY_ALIAS_MAX,
  CONNECT_SESSION_INTRO_MAX,
  CONNECT_ICEBREAKERS,
} from '@/lib/socialConnectHelpers';
import {
  upsertOpenConnectSession,
  deleteOpenConnectSession,
  fetchOpenConnectLobby,
  fetchMyOpenConnectSession,
  type OpenConnectLobbyRow,
} from '@/lib/openConnectSessions';
import { getOrCreateConversation } from '@/lib/messages';
import { getConnectWallAgeAttested, setConnectWallAgeAttested } from '@/lib/connectWallAgeGate';
import { OpenConnectMembershipPrompt } from '@/components/OpenConnectMembershipPrompt';

const STORAGE_KEY = 'intera_open_connect_v1';

/** After creating a connect post, land on Connect tab with this segment active */
export const CONNECT_TAB_OPEN_RETURN = '/(tabs)/connect?openConnect=1';

type StoredSession = {
  until: number;
  contextId: string;
  vibeId: string;
  durationMins: number;
  displayAlias?: string;
  sessionIntro?: string;
  revealAvatar?: boolean;
  useProfileName?: boolean;
};

function minsLeftFromIso(untilIso: string): number {
  const t = new Date(untilIso).getTime();
  if (t <= Date.now()) return 0;
  return Math.max(1, Math.ceil((t - Date.now()) / 60000));
}

export type OpenConnectPanelProps = {
  composerReturnTo?: string;
  /** When user leaves the 18+ gate (e.g. switch Connect tab to People) */
  onDeclineAgeGate?: () => void;
};

export function OpenConnectPanel({
  composerReturnTo = CONNECT_TAB_OPEN_RETURN,
  onDeclineAgeGate,
}: OpenConnectPanelProps) {
  const currentUser = useStore((s) => s.currentUser);
  const isGuest = useStore((s) => s.isGuest);
  const selectedLocation = useStore((s) => s.selectedLocation);

  const [open, setOpen] = useState(false);
  const [contextId, setContextId] = useState<string>('general');
  const [vibeId, setVibeId] = useState<string>('chat');
  const [durationMins, setDurationMins] = useState<number>(60);
  const [sessionUntil, setSessionUntil] = useState<number | null>(null);
  const [lobby, setLobby] = useState<OpenConnectLobbyRow[]>([]);
  const [lobbyLoading, setLobbyLoading] = useState(false);
  const [displayAlias, setDisplayAlias] = useState('');
  const [sessionIntro, setSessionIntro] = useState('');
  const [revealAvatar, setRevealAvatar] = useState(false);
  const [useProfileName, setUseProfileName] = useState(false);
  const [panelRefreshing, setPanelRefreshing] = useState(false);
  const [ageLoading, setAgeLoading] = useState(true);
  const [ageVerified, setAgeVerified] = useState(false);
  /** Server opt-in: lobby fetch/sync only when true (see OpenConnectMembershipPrompt). */
  const [connectFeedAllowed, setConnectFeedAllowed] = useState(false);

  const city = selectedLocation?.city?.trim() || '';
  const country = selectedLocation?.country?.trim() || '';
  const neighborhood = selectedLocation?.neighborhood?.trim() || '';
  const areaLabel = city && country ? `${city}, ${country}` : city || country || 'your area';

  const lobbyPreviewName = useMemo(() => {
    if (useProfileName && currentUser?.name?.trim()) return currentUser.name.trim();
    const a = sanitizeConnectDisplayAlias(displayAlias);
    if (a) return a;
    return currentUser?.id ? fallbackConnectHandle(currentUser.id) : 'Friend·••••';
  }, [useProfileName, currentUser?.name, currentUser?.id, displayAlias]);

  const loadFromStorage = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (!raw) {
        setOpen(false);
        setSessionUntil(null);
        return;
      }
      const s = JSON.parse(raw) as StoredSession;
      if (s.until > Date.now()) {
        setOpen(true);
        setSessionUntil(s.until);
        setContextId(s.contextId || 'general');
        setVibeId(s.vibeId || 'chat');
        setDurationMins(s.durationMins || 60);
        setDisplayAlias(s.displayAlias || '');
        setSessionIntro(s.sessionIntro || '');
        setRevealAvatar(!!s.revealAvatar);
        setUseProfileName(!!s.useProfileName);
      } else {
        await AsyncStorage.removeItem(STORAGE_KEY);
        setOpen(false);
        setSessionUntil(null);
      }
    } catch {
      setOpen(false);
      setSessionUntil(null);
    }
  }, []);

  const refreshLobby = useCallback(async () => {
    if (!city || !country) {
      setLobby([]);
      return;
    }
    setLobbyLoading(true);
    try {
      const rows = await fetchOpenConnectLobby(city, country);
      setLobby(rows);
    } finally {
      setLobbyLoading(false);
    }
  }, [city, country]);

  const syncFromServer = useCallback(async () => {
    if (!currentUser || isGuest) return;
    try {
      const row = await fetchMyOpenConnectSession();
      if (!row) {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          await AsyncStorage.removeItem(STORAGE_KEY);
          setOpen(false);
          setSessionUntil(null);
        }
        return;
      }
      const untilMs = new Date(row.until).getTime();
      setOpen(true);
      setSessionUntil(untilMs);
      setContextId(row.context_id || 'general');
      setVibeId(row.vibe_id || 'chat');
      setDurationMins(row.duration_mins || 60);
      setDisplayAlias(row.display_alias || '');
      setSessionIntro(row.session_intro || '');
      setRevealAvatar(!!row.reveal_avatar);
      setUseProfileName(!!row.use_profile_name);
      await AsyncStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          until: untilMs,
          contextId: row.context_id,
          vibeId: row.vibe_id,
          durationMins: row.duration_mins,
          displayAlias: row.display_alias || '',
          sessionIntro: row.session_intro || '',
          revealAvatar: !!row.reveal_avatar,
          useProfileName: !!row.use_profile_name,
        } as StoredSession)
      );
    } catch {
      // ignore
    }
  }, [currentUser, isGuest]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const ok = await getConnectWallAgeAttested();
      if (!cancelled) {
        setAgeVerified(ok);
        setAgeLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const onConfirmAge = useCallback(async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await setConnectWallAgeAttested();
    setAgeVerified(true);
  }, []);

  const onPanelRefresh = useCallback(async () => {
    setPanelRefreshing(true);
    try {
      await Promise.all([refreshLobby(), syncFromServer()]);
    } finally {
      setPanelRefreshing(false);
    }
  }, [refreshLobby, syncFromServer]);

  useEffect(() => {
    if (!ageVerified || !connectFeedAllowed) return;
    loadFromStorage();
  }, [ageVerified, connectFeedAllowed, loadFromStorage]);

  useFocusEffect(
    useCallback(() => {
      if (!ageVerified || !connectFeedAllowed) return;
      refreshLobby();
      syncFromServer();
    }, [refreshLobby, syncFromServer, ageVerified, connectFeedAllowed])
  );

  useEffect(() => {
    if (!sessionUntil || sessionUntil <= Date.now()) return;
    const t = setInterval(() => {
      if (Date.now() >= sessionUntil) {
        setOpen(false);
        setSessionUntil(null);
        AsyncStorage.removeItem(STORAGE_KEY).catch(() => null);
        deleteOpenConnectSession().catch(() => null);
        clearInterval(t);
      }
    }, 15000);
    return () => clearInterval(t);
  }, [sessionUntil]);

  const persistOpen = async (value: boolean) => {
    if (!currentUser || isGuest) {
      Alert.alert('Sign in', 'Create an account to use Open to connect.');
      return;
    }
    if (value && (!city || !country)) {
      Alert.alert(
        'Set your area',
        'Pick the city and country you’re in so the lobby only shows people in the same area — anywhere in the world.',
        [{ text: 'OK', onPress: () => router.push('/location-select') }]
      );
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (!value) {
      setOpen(false);
      setSessionUntil(null);
      await AsyncStorage.removeItem(STORAGE_KEY);
      await deleteOpenConnectSession().catch(() => null);
      refreshLobby();
      return;
    }
    const until = Date.now() + durationMins * 60 * 1000;
    const aliasClean = sanitizeConnectDisplayAlias(displayAlias);
    const introClean = sanitizeConnectSessionIntro(sessionIntro);
    const payload: StoredSession = {
      until,
      contextId,
      vibeId,
      durationMins,
      displayAlias: aliasClean,
      sessionIntro: introClean,
      revealAvatar,
      useProfileName,
    };
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    setOpen(true);
    setSessionUntil(until);
    try {
      await upsertOpenConnectSession({
        untilMs: until,
        contextId,
        vibeId,
        durationMins,
        city,
        country,
        neighborhood: neighborhood || null,
        displayAlias: aliasClean || null,
        sessionIntro: introClean || null,
        revealAvatar,
        useProfileName,
      });
      refreshLobby();
      Alert.alert(
        "You're open",
        useProfileName
          ? `You’re visible in ${areaLabel} with your Intera name (and photo if you turned it on). Meet in public only.\n\nOptional: post with Nearby for the connect feed.`
          : `Others in ${areaLabel} see your connect nickname (or Friend·code), not your account name unless you chose that. Meet in public only.\n\nOptional: post with Nearby for the connect feed.`,
        [
          {
            text: 'Draft post',
            onPress: () =>
              router.push({
                pathname: '/(tabs)/create',
                params: {
                  openPost: '1',
                  preIntent: 'nearby',
                  returnTo: composerReturnTo,
                },
              } as any),
          },
          { text: 'OK' },
        ]
      );
    } catch (e: any) {
      console.warn('[openConnect] sync:', e?.message);
      Alert.alert(
        'Could not sync lobby',
        'You’re still marked open on this device. Check your connection and apply the latest Supabase migration (open_connect_sessions). You can still draft a post.',
        [
          {
            text: 'Draft post',
            onPress: () =>
              router.push({
                pathname: '/(tabs)/create',
                params: {
                  openPost: '1',
                  preIntent: 'nearby',
                  returnTo: composerReturnTo,
                },
              } as any),
          },
          { text: 'OK' },
        ]
      );
    }
  };

  const openComposer = (icebreakerId?: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({
      pathname: '/(tabs)/create',
      params: {
        openPost: '1',
        preIntent: 'nearby',
        returnTo: composerReturnTo,
        ...(icebreakerId ? { icebreakerId } : {}),
      },
    } as any);
  };

  const handleMessagePeer = async (peer: OpenConnectLobbyRow) => {
    if (!currentUser?.id) {
      Alert.alert('Sign in', 'Log in to send a message.');
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const opener = `Hi — I saw you’re open to connect (${openConnectVibeLabel(peer.vibe_id)}). Happy to chat; we could meet in a public place only if we’re both comfortable.`;
    try {
      const conversationId = await getOrCreateConversation(currentUser.id, peer.user_id);
      router.push({
        pathname: '/chat/[id]',
        params: {
          id: conversationId,
          name: peer.screen_name,
          avatar: peer.avatar_url || '',
          recipientId: peer.user_id,
          prefill: encodeURIComponent(opener),
        },
      } as any);
    } catch {
      Alert.alert('Error', 'Could not open chat. Try again.');
    }
  };

  const minsLeft =
    sessionUntil && sessionUntil > Date.now()
      ? Math.max(1, Math.ceil((sessionUntil - Date.now()) / 60000))
      : 0;

  if (ageLoading) {
    return (
      <View className="flex-1 items-center justify-center py-20 px-5">
        <ActivityIndicator size="large" color="#1B4D3E" />
      </View>
    );
  }

  if (!ageVerified) {
    return (
      <ScrollView
        className="flex-1 px-5 pt-2"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        <View className="bg-violet-900 rounded-3xl p-6">
          <View className="flex-row items-center mb-3">
            <Shield size={28} color="#E9D5FF" />
            <Text className="text-white text-xl font-bold ml-3 flex-1">Before you enter</Text>
          </View>
          <Text className="text-violet-100 leading-6 text-base">
            The <Text className="font-semibold text-white">Open to connect lobby</Text> (and the connect post wall) are
            for adults <Text className="font-semibold text-white">18+</Text> who want to meet others nearby.
          </Text>
          <Text className="text-violet-200/90 leading-6 mt-4">
            Sexual content, harassment, and hate are not allowed. We use moderation and reporting — violations can
            lead to removal or account action.
          </Text>
          <Text className="text-violet-200/80 text-sm mt-4 leading-5">
            This is a self-confirmation on your device only; we do not upload your age here. Meet in public first and
            use block/report if anything feels off.
          </Text>
        </View>

        <Pressable
          onPress={onConfirmAge}
          className="mt-6 bg-violet-700 py-4 rounded-2xl items-center active:opacity-90"
        >
          <Text className="text-white font-bold text-lg">I am 18 or older — continue</Text>
        </Pressable>

        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            if (onDeclineAgeGate) onDeclineAgeGate();
            else router.back();
          }}
          className="mt-4 py-3 items-center"
        >
          <Text className="text-gray-600 font-semibold">Go back</Text>
        </Pressable>
      </ScrollView>
    );
  }

  return (
    <OpenConnectMembershipPrompt
      userId={currentUser?.id}
      isGuest={!!isGuest}
      areaLabel={areaLabel}
      onOptInChanged={setConnectFeedAllowed}
    >
      <ScrollView
        className="flex-1 px-5 pt-1"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 32 }}
        refreshControl={
          <RefreshControl
            refreshing={panelRefreshing}
            onRefresh={onPanelRefresh}
            tintColor="#1B4D3E"
            colors={['#1B4D3E']}
          />
        }
      >
      <LinearGradient
        colors={['#1B4D3E', '#153D31']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ borderRadius: 20, padding: 20, marginBottom: 20 }}
      >
        <View className="flex-row items-center">
          <Users size={28} color="#FFFFFF" />
          <Text className="text-white text-xl font-bold ml-3 flex-1">Same moment, anywhere</Text>
        </View>
        <Text className="text-white/85 text-sm mt-3 leading-5">
          A gentle way to find company wherever you are — transit, campus, a festival, your neighbourhood, or a new
          city. Use a nickname or go by your Intera name if you prefer to be open; your timer ends and the signal
          fades. Opt in only; meet in public; trust your gut.
        </Text>
      </LinearGradient>

      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          router.push('/open-connect-posts' as any);
        }}
        className="bg-white rounded-2xl border border-violet-200 p-4 mb-4 flex-row items-center shadow-sm active:opacity-90"
      >
        <View className="bg-violet-100 rounded-full p-2.5">
          <Sparkles size={22} color="#5B21B6" />
        </View>
        <View className="flex-1 ml-3">
          <Text className="text-warmBrown font-bold text-base">Connect post wall</Text>
          <Text className="text-gray-500 text-sm mt-0.5 leading-5">
            Hangouts, dates &amp; networking posts — not mixed with community updates
          </Text>
        </View>
        <ChevronRight size={22} color="#6D28D9" />
      </Pressable>

      <View className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4 mb-4 flex-row">
        <EyeOff size={22} color="#4338CA" style={{ marginTop: 2 }} />
        <View className="flex-1 ml-3">
          <Text className="text-indigo-950 font-semibold">Privacy &amp; comfort</Text>
          <Text className="text-indigo-900 text-sm mt-1 leading-5">
            By default the lobby uses a nickname or a neutral Friend·code — not your Intera name — and your photo
            stays off unless you choose. If you&apos;d rather be open and easy to recognize, you can show your
            profile name (and photo) below. After Hi, chat works like any other DM.
          </Text>
        </View>
      </View>

      <View className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 flex-row">
        <Shield size={22} color="#B45309" style={{ marginTop: 2 }} />
        <View className="flex-1 ml-3">
          <Text className="text-amber-900 font-semibold">Safety</Text>
          <Text className="text-amber-800 text-sm mt-1 leading-5">
            Public places first, easy exits, zero pressure. Block and report if anything feels off. The list is
            limited to people who picked the same city &amp; country as you — worldwide, not one country only.
          </Text>
        </View>
      </View>

      <Text className="text-warmBrown font-bold text-lg mb-1">How you appear in the lobby</Text>
      <Text className="text-gray-500 text-sm mb-3">
        Use a nickname, initials, or emoji — or turn on your Intera name below if you want to be open. Leave
        nickname blank for a neutral Friend·code.
      </Text>
      <View className="bg-white rounded-2xl border border-gray-100 p-4 mb-2">
        <Text className="text-xs text-gray-500 uppercase tracking-wide">Connect nickname</Text>
        <TextInput
          value={displayAlias}
          onChangeText={(t) => setDisplayAlias(sanitizeConnectDisplayAlias(t))}
          placeholder="e.g. LayoverSam, NightOwl, M·K, 小明…"
          placeholderTextColor="#9CA3AF"
          maxLength={CONNECT_DISPLAY_ALIAS_MAX}
          editable={!useProfileName}
          className={`text-warmBrown text-base mt-2 pb-2 border-b border-gray-100 ${useProfileName ? 'opacity-50' : ''}`}
        />
        <Text className="text-xs text-gray-500 mt-1">
          {useProfileName
            ? 'Using your Intera name in the lobby — nickname is saved for when you switch back.'
            : 'Optional if you use your Intera name instead.'}
        </Text>
        <Text className="text-xs text-forest-700 mt-2">
          Lobby preview: <Text className="font-bold">{lobbyPreviewName}</Text>
        </Text>
      </View>
      <View className="bg-white rounded-2xl border border-gray-100 p-4 mb-2 flex-row items-center justify-between">
        <View className="flex-1 pr-3">
          <Text className="text-warmBrown font-semibold">Use my Intera profile name</Text>
          <Text className="text-gray-500 text-sm mt-1">
            On = people see the name on your profile. Off = nickname or Friend·code only.
          </Text>
        </View>
        <Switch
          value={useProfileName}
          onValueChange={(v) => {
            Haptics.selectionAsync();
            setUseProfileName(v);
          }}
          trackColor={{ false: '#D1D5DB', true: '#10B981' }}
          thumbColor="#fff"
        />
      </View>
      <View className="bg-white rounded-2xl border border-gray-100 p-4 mb-2">
        <Text className="text-xs text-gray-500 uppercase tracking-wide">A line about right now (optional)</Text>
        <TextInput
          value={sessionIntro}
          onChangeText={(t) => setSessionIntro(sanitizeConnectSessionIntro(t))}
          placeholder="e.g. First time in town · happy to split a taxi to the venue · here till 6pm…"
          placeholderTextColor="#9CA3AF"
          multiline
          maxLength={CONNECT_SESSION_INTRO_MAX}
          className="text-warmBrown text-base mt-2 min-h-[72px]"
          style={{ textAlignVertical: 'top' }}
        />
        <Text className="text-xs text-gray-400 mt-1">{sessionIntro.length}/{CONNECT_SESSION_INTRO_MAX}</Text>
      </View>
      <View className="bg-white rounded-2xl border border-gray-100 p-4 mb-6 flex-row items-center justify-between">
        <View className="flex-1 pr-3">
          <Text className="text-warmBrown font-semibold">Show my profile photo</Text>
          <Text className="text-gray-500 text-sm mt-1">Off by default — turn on only if you want to.</Text>
        </View>
        <Switch
          value={revealAvatar}
          onValueChange={(v) => {
            Haptics.selectionAsync();
            setRevealAvatar(v);
          }}
          trackColor={{ false: '#D1D5DB', true: '#10B981' }}
          thumbColor="#fff"
        />
      </View>

      <Text className="text-warmBrown font-bold text-lg mb-1">Quick lines</Text>
      <Text className="text-gray-500 text-sm mb-3">
        Tap to open the composer with a starter — edit before you post.
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="mb-6"
        contentContainerStyle={{ gap: 10, paddingRight: 8 }}
      >
        {CONNECT_ICEBREAKERS.map((ib) => (
          <Pressable
            key={ib.id}
            onPress={() => openComposer(ib.id)}
            className="bg-white rounded-2xl border border-gray-200 p-3 max-w-[260px]"
          >
            <Text className="text-warmBrown text-sm leading-5" numberOfLines={5}>
              {ib.text}
            </Text>
            <Text className="text-forest-600 text-xs font-semibold mt-2">Tap to edit &amp; post →</Text>
          </Pressable>
        ))}
      </ScrollView>

      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-warmBrown font-bold text-lg">Open in your area</Text>
        <Pressable onPress={() => void onPanelRefresh()} className="py-1 px-2">
          <Text className="text-forest-700 font-semibold text-sm">Refresh</Text>
        </Pressable>
      </View>
      {!city || !country ? (
        <View className="bg-white rounded-2xl border border-gray-100 p-4 mb-4">
          <Text className="text-gray-600 text-sm">
            Set city and country (anywhere in the world) so the lobby only lists people who chose the same area.
          </Text>
          <Pressable
            onPress={() => router.push('/location-select')}
            className="mt-3 bg-forest-600 rounded-full py-2.5 items-center self-start px-5"
          >
            <Text className="text-white font-semibold">Set location</Text>
          </Pressable>
        </View>
      ) : lobbyLoading ? (
        <View className="py-8 items-center mb-4">
          <ActivityIndicator color="#1B4D3E" />
        </View>
      ) : lobby.length === 0 ? (
        <View className="bg-white rounded-2xl border border-gray-100 p-4 mb-4">
          <Text className="text-gray-600 text-sm">
            No one else is open in {areaLabel} right now. Turn on your signal or check back in a little while —
            moods change fast at airports, campuses, and events.
          </Text>
        </View>
      ) : (
        <View className="mb-4">
          {lobby.map((row) => (
            <View
              key={row.user_id}
              className="bg-white rounded-2xl border border-gray-100 p-3 mb-3 flex-row items-center"
            >
              {row.avatar_url ? (
                <Image
                  source={{ uri: row.avatar_url }}
                  style={{ width: 48, height: 48, borderRadius: 24 }}
                  contentFit="cover"
                />
              ) : (
                <View className="w-12 h-12 rounded-full bg-forest-100 items-center justify-center">
                  <Text className="text-forest-800 font-bold text-lg">
                    {(row.screen_name && row.screen_name.charAt(0)) || '?'}
                  </Text>
                </View>
              )}
              <View className="flex-1 ml-3">
                <Text className="text-warmBrown font-semibold">{row.screen_name}</Text>
                {row.session_intro ? (
                  <Text className="text-gray-600 text-xs mt-1 leading-4" numberOfLines={2}>
                    {row.session_intro}
                  </Text>
                ) : null}
                <Text className="text-gray-500 text-xs mt-0.5">
                  {openConnectContextLabel(row.context_id)} · {openConnectVibeLabel(row.vibe_id)}
                </Text>
                {row.neighborhood ? (
                  <Text className="text-gray-400 text-xs mt-0.5" numberOfLines={1}>
                    {row.neighborhood}
                  </Text>
                ) : null}
                <Text className="text-gray-400 text-xs mt-1">~{minsLeftFromIso(row.until)} min left</Text>
              </View>
              <Pressable
                onPress={() => handleMessagePeer(row)}
                className="bg-forest-600 rounded-full px-4 py-2 flex-row items-center"
              >
                <MessageCircle size={16} color="#fff" />
                <Text className="text-white font-semibold ml-1">Hi</Text>
              </Pressable>
            </View>
          ))}
        </View>
      )}

      <View className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-4">
        <View className="flex-row items-center justify-between">
          <View className="flex-1 pr-3">
            <Text className="text-warmBrown font-bold text-lg">I&apos;m open right now</Text>
            <Text className="text-gray-500 text-sm mt-1">
              {open && minsLeft > 0
                ? `About ${minsLeft} min left — then it turns off.`
                : 'Turn on when you want others to see you’re around.'}
            </Text>
          </View>
          <Switch
            value={open}
            onValueChange={persistOpen}
            trackColor={{ false: '#D1D5DB', true: '#10B981' }}
            thumbColor="#fff"
          />
        </View>
      </View>

      <Text className="text-warmBrown font-semibold mb-2">Where are you?</Text>
      <View className="flex-row flex-wrap" style={{ gap: 8 }}>
        {OPEN_CONNECT_CONTEXTS.map((c) => (
          <Pressable
            key={c.id}
            onPress={() => {
              Haptics.selectionAsync();
              setContextId(c.id);
            }}
            className={`px-4 py-2 rounded-full border ${
              contextId === c.id ? 'bg-forest-600 border-forest-600' : 'bg-white border-gray-200'
            }`}
          >
            <Text className={contextId === c.id ? 'text-white font-medium' : 'text-gray-700'}>{c.label}</Text>
          </Pressable>
        ))}
      </View>

      <Text className="text-warmBrown font-semibold mt-6 mb-2">Vibe</Text>
      <View className="flex-row flex-wrap" style={{ gap: 8 }}>
        {OPEN_CONNECT_VIBES.map((v) => (
          <Pressable
            key={v.id}
            onPress={() => {
              Haptics.selectionAsync();
              setVibeId(v.id);
            }}
            className={`px-4 py-2 rounded-full border ${
              vibeId === v.id ? 'bg-terracotta-500 border-terracotta-500' : 'bg-white border-gray-200'
            }`}
          >
            <Text className={vibeId === v.id ? 'text-white font-medium' : 'text-gray-700'}>
              {v.emoji} {v.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text className="text-warmBrown font-semibold mt-6 mb-2">How long?</Text>
      <View className="flex-row" style={{ gap: 8 }}>
        {OPEN_CONNECT_DURATIONS.map((d) => (
          <Pressable
            key={d.id}
            onPress={() => {
              Haptics.selectionAsync();
              setDurationMins(d.id);
            }}
            className={`flex-1 py-3 rounded-xl border items-center ${
              durationMins === d.id ? 'bg-forest-50 border-forest-600' : 'bg-white border-gray-200'
            }`}
          >
            <Text className={durationMins === d.id ? 'text-forest-800 font-bold' : 'text-gray-600'}>{d.label}</Text>
          </Pressable>
        ))}
      </View>

      <Pressable onPress={() => openComposer()} className="mt-8 mb-6">
        <LinearGradient
          colors={['#D4673A', '#B85430']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ borderRadius: 16, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}
        >
          <Sparkles size={20} color="#FFFFFF" />
          <Text className="text-white font-bold text-lg ml-2">Post to find people nearby</Text>
        </LinearGradient>
      </Pressable>

      {Platform.OS === 'web' ? (
        <Text className="text-gray-400 text-center text-sm mb-4">Open the mobile app for the full experience.</Text>
      ) : null}
    </ScrollView>
    </OpenConnectMembershipPrompt>
  );
}
