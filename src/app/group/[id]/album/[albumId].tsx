import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, Pressable, ActivityIndicator, Alert, ScrollView, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { ChevronLeft, Plus, Image as ImageIcon, Video as VideoIcon, X } from 'lucide-react-native';
import { useStore } from '@/lib/store';
import {
  getGroupAlbum,
  getAlbumMedia,
  addMediaToAlbum,
  uploadGroupImageUri,
  uploadGroupVideoUri,
  getGroupSettings,
  DEFAULT_GROUP_SETTINGS,
} from '@/lib/groups-api';

type AlbumMedia = {
  id: string;
  album_id: string;
  uploader_id: string;
  url: string;
  type: 'photo' | 'video';
  thumbnail_url?: string | null;
  caption: string | null;
  created_at: string;
};

export default function GroupAlbumScreen() {
  const { id: groupId, albumId } = useLocalSearchParams<{ id: string; albumId: string }>();
  const currentUser = useStore((s) => s.currentUser);
  const isGuest = useStore((s) => s.isGuest);

  const [loading, setLoading] = useState(true);
  const [album, setAlbum] = useState<any>(null);
  const [media, setMedia] = useState<AlbumMedia[]>([]);
  const [uploading, setUploading] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [groupSettings, setGroupSettings] = useState(DEFAULT_GROUP_SETTINGS);
  const [isMember, setIsMember] = useState(false);

  const canUpload = useMemo(() => {
    if (!currentUser?.id) return false;
    // mirror group/[id] gating: members can upload if media_upload allows OR admin (admin check happens elsewhere)
    return isMember && groupSettings.media_upload === 'members';
  }, [currentUser?.id, isMember, groupSettings.media_upload]);

  const load = useCallback(async () => {
    if (!albumId) return;
    setLoading(true);
    try {
      const [a, m] = await Promise.all([getGroupAlbum(albumId), getAlbumMedia(albumId)]);
      setAlbum(a);
      setMedia((m || []) as any);
      if (groupId) {
        const s = await getGroupSettings(groupId);
        setGroupSettings(s || DEFAULT_GROUP_SETTINGS);
      }
      // best-effort membership: if the album exists and user is logged in, assume membership gate handled at group entry
      setIsMember(!!currentUser?.id);
    } finally {
      setLoading(false);
    }
  }, [albumId, groupId, currentUser?.id]);

  useEffect(() => {
    load();
  }, [load]);

  const openViewer = (index: number) => {
    setViewerIndex(index);
    setViewerOpen(true);
  };

  const handleAddMedia = async () => {
    if (uploading) return;
    if (isGuest || !currentUser?.id) {
      router.push('/signup');
      return;
    }
    if (!groupId || !albumId) return;

    // Permissions: if media_upload is admin_only, block here (admins UI can be added later)
    if (groupSettings.media_upload === 'admin_only') {
      Alert.alert('Admin only', 'Only group admins can upload to albums in this group.');
      return;
    }

    setUploading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsMultipleSelection: true,
        quality: 0.9,
        selectionLimit: 15,
        videoMaxDuration: 180,
      });

      if (result.canceled || !result.assets?.length) return;

      let uploaded = 0;
      for (const asset of result.assets) {
        const assetType = (asset as any)?.type || '';
        const isVideo = assetType === 'video' || String(asset?.uri || '').toLowerCase().includes('.mp4');
        const uri = asset.uri;
        const caption = (asset as any)?.fileName || null;

        let url: string | null = null;
        if (isVideo) {
          url = await uploadGroupVideoUri({
            userId: currentUser.id,
            groupId,
            albumId,
            uri,
            kind: 'album_video',
          });
        } else {
          url = await uploadGroupImageUri({
            userId: currentUser.id,
            groupId,
            uri,
            kind: 'album_photo',
          });
        }
        if (!url) continue;

        const saved = await addMediaToAlbum({
          album_id: albumId,
          uploader_id: currentUser.id,
          url,
          type: isVideo ? 'video' : 'photo',
          thumbnail_url: null,
          caption,
        });
        if (saved) uploaded += 1;
      }

      if (uploaded > 0) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        await load();
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert('Upload failed', 'No media was uploaded. Please try again.');
      }
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 bg-cream items-center justify-center">
        <ActivityIndicator size="large" color="#1B4D3E" />
        <Text className="text-gray-500 mt-3">Loading album...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-cream">
      <SafeAreaView edges={['top']} className="flex-1">
        <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-100 bg-white">
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.back();
            }}
            className="w-10 h-10 items-center justify-center"
          >
            <ChevronLeft size={28} color="#1F2937" />
          </Pressable>
          <View className="flex-1 px-2">
            <Text className="text-lg font-semibold text-gray-900" numberOfLines={1}>
              {album?.name || 'Album'}
            </Text>
            <Text className="text-xs text-gray-500" numberOfLines={1}>
              {media.length} item{media.length === 1 ? '' : 's'}
            </Text>
          </View>

          <Pressable
            onPress={handleAddMedia}
            disabled={uploading || !canUpload}
            className={`px-4 py-2 rounded-full ${uploading || !canUpload ? 'bg-gray-200' : 'bg-forest-600'}`}
          >
            {uploading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <View className="flex-row items-center">
                <Plus size={18} color={canUpload ? '#FFFFFF' : '#9CA3AF'} />
                <Text className={`ml-1 font-semibold ${canUpload ? 'text-white' : 'text-gray-400'}`}>Add</Text>
              </View>
            )}
          </Pressable>
        </View>

        {media.length === 0 ? (
          <View className="flex-1 items-center justify-center px-6">
            <View className="bg-white rounded-2xl p-8 items-center w-full">
              <ImageIcon size={34} color="#9CA3AF" />
              <Text className="text-gray-900 font-semibold mt-3">No media yet</Text>
              <Text className="text-gray-500 text-center mt-1">
                Upload photos and videos to share moments with the group.
              </Text>
              {canUpload && (
                <Pressable onPress={handleAddMedia} className="bg-forest-600 rounded-full px-5 py-3 mt-5">
                  <Text className="text-white font-semibold">Add media</Text>
                </Pressable>
              )}
            </View>
          </View>
        ) : (
          <ScrollView className="flex-1 px-4 pt-4" showsVerticalScrollIndicator={false}>
            <View className="flex-row flex-wrap" style={{ gap: 10 }}>
              {media.map((m, idx) => (
                <Animated.View key={m.id} entering={FadeInUp.duration(250).delay(idx * 15)} style={{ width: '31%' }}>
                  <Pressable
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      openViewer(idx);
                    }}
                    className="bg-white rounded-xl overflow-hidden"
                  >
                    <Image
                      source={{ uri: m.thumbnail_url || m.url }}
                      style={{ width: '100%', height: 110 }}
                      contentFit="cover"
                    />
                    {m.type === 'video' && (
                      <View className="absolute top-2 right-2 bg-black/50 rounded-full p-1.5">
                        <VideoIcon size={14} color="#FFFFFF" />
                      </View>
                    )}
                  </Pressable>
                </Animated.View>
              ))}
            </View>
            <View className="h-24" />
          </ScrollView>
        )}

        <Modal visible={viewerOpen} animationType="fade" onRequestClose={() => setViewerOpen(false)}>
          <SafeAreaView className="flex-1 bg-black" edges={['top', 'bottom']}>
            <View className="flex-row items-center justify-between px-4 py-3">
              <Pressable onPress={() => setViewerOpen(false)} className="w-10 h-10 items-center justify-center">
                <X size={26} color="#FFFFFF" />
              </Pressable>
              <Text className="text-white">
                {viewerIndex + 1}/{media.length}
              </Text>
              <View className="w-10" />
            </View>

            <View className="flex-1 items-center justify-center px-4">
              {media[viewerIndex]?.type === 'video' ? (
                <View className="items-center">
                  <VideoIcon size={34} color="#FFFFFF" />
                  <Text className="text-white/80 mt-3 text-center">
                    Video playback in albums is coming next.\nYour video is uploaded and saved.
                  </Text>
                </View>
              ) : (
                <Image
                  source={{ uri: media[viewerIndex]?.url }}
                  style={{ width: '100%', height: '80%' }}
                  contentFit="contain"
                />
              )}
              {!!media[viewerIndex]?.caption && (
                <Text className="text-white/80 mt-3 text-center">{media[viewerIndex]?.caption}</Text>
              )}
            </View>
          </SafeAreaView>
        </Modal>
      </SafeAreaView>
    </View>
  );
}

