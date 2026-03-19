import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, Pressable, ScrollView, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Bell, RefreshCw, Send } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { useStore } from '@/lib/store';
import { supabase } from '@/lib/supabase';
import { getExpoPushToken, syncPushTokenFromStore } from '@/lib/pushTokens';
import { requestNotificationPermissions } from '@/lib/notifications';

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View className="py-3 border-b border-white/10">
      <Text className="text-gray-400 text-xs">{label}</Text>
      <Text className="text-white font-semibold mt-1">{value}</Text>
    </View>
  );
}

export default function PushDebugScreen() {
  const selectedLocation = useStore((s) => s.selectedLocation);
  const notificationsEnabled = useStore((s) => s.notificationsEnabled);
  const [busy, setBusy] = useState(false);
  const [perm, setPerm] = useState<Notifications.PermissionStatus | 'unknown'>('unknown');
  const [token, setToken] = useState<string>('');
  const [authUserId, setAuthUserId] = useState<string>('');
  const [tokenRow, setTokenRow] = useState<any>(null);
  const [lastSendResult, setLastSendResult] = useState<string>('');

  const locationLabel = useMemo(() => {
    const city = selectedLocation?.city ? String(selectedLocation.city).trim() : '';
    const country = selectedLocation?.country ? String(selectedLocation.country).trim() : '';
    return [city, country].filter(Boolean).join(', ') || 'Unknown';
  }, [selectedLocation?.city, selectedLocation?.country]);

  const refresh = async () => {
    setBusy(true);
    setLastSendResult('');
    try {
      const [{ status }, t, u] = await Promise.all([
        Notifications.getPermissionsAsync(),
        getExpoPushToken(),
        supabase.auth.getUser(),
      ]);
      setPerm(status);
      setToken(t || '');
      const uid = u?.data?.user?.id ? String(u.data.user.id) : '';
      setAuthUserId(uid);

      if (t) {
        try {
          const { data, error } = await supabase
            .from('push_tokens')
            .select('*')
            .eq('token', t)
            .maybeSingle();
          if (!error) setTokenRow(data ?? null);
          else setTokenRow({ error: String((error as any)?.message ?? error), code: (error as any)?.code });
        } catch (e: any) {
          setTokenRow({ error: String(e?.message ?? e) });
        }
      } else {
        setTokenRow(null);
      }
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    refresh().catch(() => null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const syncNow = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setBusy(true);
    try {
      await syncPushTokenFromStore();
      await refresh();
    } finally {
      setBusy(false);
    }
  };

  const sendTestPush = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setBusy(true);
    setLastSendResult('');
    try {
      const { data: u } = await supabase.auth.getUser();
      const uid = u?.user?.id ? String(u.user.id) : '';
      if (!uid) {
        setLastSendResult('Not signed in (no auth user).');
        return;
      }

      const res = await supabase.functions.invoke('send-push-alert', {
        body: {
          recipientUserId: uid,
          title: 'Intera test push',
          body: `Test push from ${Platform.OS} (${new Date().toLocaleTimeString()})`,
          type: 'test_push',
          data: { type: 'test_push' },
        },
      });

      if (res.error) {
        const errAny: any = res.error as any;
        let extra = '';
        const status =
          errAny?.context?.response?.status ??
          errAny?.context?.status ??
          errAny?.status ??
          undefined;
        if (typeof status === 'number') extra += `\nHTTP ${status}`;
        try {
          const resp = errAny?.context?.response;
          if (resp && typeof resp.text === 'function') {
            const t = await resp.text();
            const trimmed = String(t || '').trim();
            if (trimmed) extra += `\n${trimmed}`;
          }
        } catch {}
        setLastSendResult(`Invoke error: ${String(errAny?.message ?? errAny)}${extra}`);
      } else {
        setLastSendResult(JSON.stringify(res.data ?? {}, null, 2));
      }
    } catch (e: any) {
      setLastSendResult(`Unexpected error: ${String(e?.message ?? e)}`);
    } finally {
      setBusy(false);
    }
  };

  const requestPerms = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setBusy(true);
    try {
      await requestNotificationPermissions();
      await refresh();
    } finally {
      setBusy(false);
    }
  };

  return (
    <View className="flex-1 bg-[#0A0A0A]">
      <SafeAreaView edges={['top']} className="flex-1">
        <View className="px-5 pt-4 pb-3 flex-row items-center">
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.back();
            }}
            className="w-10 h-10 rounded-full bg-white/10 items-center justify-center mr-3"
          >
            <ArrowLeft size={20} color="#fff" />
          </Pressable>
          <View className="flex-1">
            <Text className="text-white text-xl font-bold">Push diagnostics</Text>
            <Text className="text-gray-400 text-sm">Token, permissions, and test push</Text>
          </View>
        </View>

        <ScrollView className="flex-1 px-5" contentContainerStyle={{ paddingBottom: 24 }}>
          <View className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3">
            <Row label="Platform" value={Platform.OS} />
            <Row label="Location (store)" value={locationLabel} />
            <Row label="In-app notificationsEnabled" value={String(!!notificationsEnabled)} />
            <Row label="System permission" value={String(perm)} />
            <Row label="Auth user id" value={authUserId || '(none)'} />
            <Row label="Expo push token" value={token ? `${token.slice(0, 22)}…${token.slice(-10)}` : '(none)'} />
          </View>

          <View className="mt-4 bg-white/5 border border-white/10 rounded-2xl px-4 py-3">
            <Text className="text-white font-bold mb-2">Server token row</Text>
            <Text className="text-gray-300 text-xs" selectable>
              {tokenRow ? JSON.stringify(tokenRow, null, 2) : '(no token row loaded)'}
            </Text>
          </View>

          <View className="mt-4 flex-row gap-2">
            <Pressable
              onPress={() => refresh()}
              disabled={busy}
              className="flex-1 bg-white/10 rounded-2xl px-4 py-3 flex-row items-center justify-center"
            >
              <RefreshCw size={18} color="#fff" />
              <Text className="text-white font-semibold ml-2">Refresh</Text>
            </Pressable>
            <Pressable
              onPress={requestPerms}
              disabled={busy}
              className="flex-1 bg-white/10 rounded-2xl px-4 py-3 flex-row items-center justify-center"
            >
              <Bell size={18} color="#fff" />
              <Text className="text-white font-semibold ml-2">Request perms</Text>
            </Pressable>
          </View>

          <View className="mt-2 flex-row gap-2">
            <Pressable
              onPress={syncNow}
              disabled={busy}
              className="flex-1 bg-emerald-500 rounded-2xl px-4 py-3 flex-row items-center justify-center"
            >
              <Text className="text-white font-bold">Sync token now</Text>
            </Pressable>
            <Pressable
              onPress={sendTestPush}
              disabled={busy}
              className="flex-1 bg-emerald-600 rounded-2xl px-4 py-3 flex-row items-center justify-center"
            >
              <Send size={18} color="#fff" />
              <Text className="text-white font-bold ml-2">Send test push</Text>
            </Pressable>
          </View>

          <View className="mt-4 bg-white/5 border border-white/10 rounded-2xl px-4 py-3">
            <Text className="text-white font-bold mb-2">Last test result</Text>
            {busy ? (
              <View className="flex-row items-center gap-2">
                <ActivityIndicator color="#10B981" />
                <Text className="text-gray-300">Working…</Text>
              </View>
            ) : (
              <Text className="text-gray-300 text-xs" selectable>
                {lastSendResult || '(none yet)'}
              </Text>
            )}
          </View>

          <Pressable
            onPress={() => router.push('/settings')}
            className="mt-4 bg-white/10 rounded-2xl px-4 py-3 items-center"
          >
            <Text className="text-white font-semibold">Back to settings</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

