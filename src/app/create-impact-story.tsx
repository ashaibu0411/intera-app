import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, ActivityIndicator, Alert, Image } from 'react-native';
import { Stack, router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { ChevronLeft, Save, Heart } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useStore } from '@/lib/store';
import { moderateText } from '@/lib/contentModeration';
import { createImpactStory, type ImpactNeed, type ImpactOrgType, type ImpactStoryStatus } from '@/lib/impactStories';
import { uploadImpactStoryImage, uploadImpactStoryVideo } from '@/lib/impactStoriesMedia';

const NEEDS: Array<{ id: ImpactNeed; label: string }> = [
  { id: 'donations', label: 'Donations' },
  { id: 'grants', label: 'Grants' },
  { id: 'sponsorships', label: 'Sponsorships' },
];

function cleanUrl(input: string) {
  const t = (input || '').trim();
  if (!t) return null;
  return t;
}

export default function CreateImpactStoryScreen() {
  const currentUser = useStore((s) => s.currentUser);
  const isGuest = useStore((s) => s.isGuest);

  const [busy, setBusy] = useState(false);

  const [orgType, setOrgType] = useState<ImpactOrgType>('nonprofit');
  const [orgName, setOrgName] = useState('');
  const [website, setWebsite] = useState('');

  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [adminArea, setAdminArea] = useState('');

  const [mission, setMission] = useState('');
  const [story, setStory] = useState('');
  const [needs, setNeeds] = useState<ImpactNeed[]>(['donations']);

  const [donationUrl, setDonationUrl] = useState('');
  const [grantUrl, setGrantUrl] = useState('');
  const [sponsorEmail, setSponsorEmail] = useState('');
  const [sponsorPhone, setSponsorPhone] = useState('');

  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [coverImageLocalUri, setCoverImageLocalUri] = useState<string | null>(null);
  const [videoLocalUri, setVideoLocalUri] = useState<string | null>(null);

  const canSubmit = useMemo(() => {
    return orgName.trim().length >= 2 && mission.trim().length >= 10 && story.trim().length >= 30 && country.trim().length >= 2;
  }, [orgName, mission, story, country]);

  const toggleNeed = (n: ImpactNeed) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setNeeds((prev) => {
      if (prev.includes(n)) return prev.filter((x) => x !== n);
      return [...prev, n];
    });
  };

  const submit = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (isGuest || !currentUser) {
      router.push('/signup');
      return;
    }
    if (!canSubmit) return;

    const combinedText = [orgName, mission, story].filter(Boolean).join('\n\n');
    const mod = moderateText(combinedText);
    if (mod.action === 'blocked') {
      Alert.alert('Cannot post', mod.message);
      return;
    }

    const status: ImpactStoryStatus = mod.action === 'flagged' ? 'pending_review' : 'published';

    setBusy(true);
    try {
      // Upload media first (if user selected local files)
      let finalCoverUrl = cleanUrl(coverImageUrl);
      if (!finalCoverUrl && coverImageLocalUri) {
        const uploaded = await uploadImpactStoryImage(coverImageLocalUri, currentUser.id);
        if (!uploaded) {
          Alert.alert('Upload failed', 'Could not upload the cover image. Try a smaller image or try again.');
          setBusy(false);
          return;
        }
        finalCoverUrl = uploaded;
      }

      let finalVideoUrl: string | null = null;
      if (videoLocalUri) {
        const uploaded = await uploadImpactStoryVideo(videoLocalUri, currentUser.id);
        if (!uploaded) {
          Alert.alert('Upload failed', 'Could not upload the video (max 100MB). Try a shorter/smaller video.');
          setBusy(false);
          return;
        }
        finalVideoUrl = uploaded;
      }

      const result = await createImpactStory({
        owner_id: currentUser.id,
        org_type: orgType,
        org_name: orgName.trim(),
        website: cleanUrl(website),
        country: country.trim(),
        admin_area: adminArea.trim() || null,
        city: city.trim() || null,
        neighborhood: null,
        location_label: null,
        mission: mission.trim(),
        story: story.trim(),
        needs,
        funding_goal_amount: null,
        funding_goal_currency: null,
        donation_url: cleanUrl(donationUrl),
        grant_url: cleanUrl(grantUrl),
        sponsorship_email: sponsorEmail.trim() || null,
        sponsorship_phone: sponsorPhone.trim() || null,
        cover_image_url: finalCoverUrl,
        gallery_urls: [],
        video_url: finalVideoUrl,
        status,
        review_note: null,
        reviewed_at: null,
        reviewed_by: null,
      } as any);

      if (status === 'pending_review') {
        Alert.alert('Submitted', 'Your story was submitted for review. You can still view it from your account.');
      } else {
        Alert.alert('Posted', 'Your impact story is live.');
      }

      router.replace(`/impact-story/${result.id}`);
    } catch (e) {
      Alert.alert('Error', String((e as any)?.message || e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <View className="flex-1 bg-cream">
      <Stack.Screen
        options={{
          title: 'Share Impact Story',
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
            <Pressable onPress={submit} disabled={!canSubmit || busy} className="mr-1">
              <View className="flex-row items-center">
                {busy ? <ActivityIndicator /> : <Save size={18} color={canSubmit ? '#C45C26' : '#9CA3AF'} />}
                <Text className={`ml-1 font-semibold ${canSubmit && !busy ? 'text-terracotta-500' : 'text-gray-400'}`}>
                  Publish
                </Text>
              </View>
            </Pressable>
          ),
        }}
      />

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        <View className="bg-white rounded-2xl p-4 border border-gray-100">
          <View className="flex-row items-center">
            <View className="bg-terracotta-50 rounded-full p-2.5">
              <Heart size={18} color="#C45C26" />
            </View>
            <View className="ml-3 flex-1">
              <Text className="text-warmBrown font-bold">Tell your story clearly</Text>
              <Text className="text-gray-500 text-sm mt-0.5">
                Add donation/grant/sponsorship links or contact. Donors will be redirected externally.
              </Text>
            </View>
          </View>
        </View>

        {/* Org Type */}
        <View className="mt-4 bg-white rounded-2xl p-4 border border-gray-100">
          <Text className="text-warmBrown font-bold">Organization type</Text>
          <View className="flex-row mt-3">
            {([
              { id: 'school' as const, label: 'School' },
              { id: 'nonprofit' as const, label: 'Nonprofit' },
            ]).map((o) => {
              const active = orgType === o.id;
              return (
                <Pressable
                  key={o.id}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setOrgType(o.id);
                  }}
                  className={`mr-2 px-3 py-2 rounded-full border ${active ? 'bg-forest-900 border-forest-900' : 'bg-white border-gray-200'}`}
                >
                  <Text className={`${active ? 'text-white' : 'text-gray-700'} font-semibold text-sm`}>{o.label}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Org info */}
        <View className="mt-4 bg-white rounded-2xl p-4 border border-gray-100">
          <Text className="text-warmBrown font-bold">Organization</Text>

          <Text className="text-gray-500 text-sm mt-3">Name *</Text>
          <TextInput
            value={orgName}
            onChangeText={setOrgName}
            placeholder="Example: Hope Community School"
            placeholderTextColor="#9CA3AF"
            className="mt-2 bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-gray-900"
          />

          <Text className="text-gray-500 text-sm mt-3">Website (optional)</Text>
          <TextInput
            value={website}
            onChangeText={setWebsite}
            placeholder="https://…"
            placeholderTextColor="#9CA3AF"
            autoCapitalize="none"
            className="mt-2 bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-gray-900"
          />
        </View>

        {/* Location */}
        <View className="mt-4 bg-white rounded-2xl p-4 border border-gray-100">
          <Text className="text-warmBrown font-bold">Location</Text>

          <Text className="text-gray-500 text-sm mt-3">Country *</Text>
          <TextInput
            value={country}
            onChangeText={setCountry}
            placeholder="Example: Ghana"
            placeholderTextColor="#9CA3AF"
            className="mt-2 bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-gray-900"
          />

          <Text className="text-gray-500 text-sm mt-3">City (optional)</Text>
          <TextInput
            value={city}
            onChangeText={setCity}
            placeholder="Example: Accra"
            placeholderTextColor="#9CA3AF"
            className="mt-2 bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-gray-900"
          />

          <Text className="text-gray-500 text-sm mt-3">State/Region (optional)</Text>
          <TextInput
            value={adminArea}
            onChangeText={setAdminArea}
            placeholder="Example: Greater Accra"
            placeholderTextColor="#9CA3AF"
            className="mt-2 bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-gray-900"
          />
        </View>

        {/* Content */}
        <View className="mt-4 bg-white rounded-2xl p-4 border border-gray-100">
          <Text className="text-warmBrown font-bold">Your message</Text>

          <Text className="text-gray-500 text-sm mt-3">Mission (1–2 sentences) *</Text>
          <TextInput
            value={mission}
            onChangeText={setMission}
            placeholder="What do you do and who do you serve?"
            placeholderTextColor="#9CA3AF"
            multiline
            className="mt-2 bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-gray-900"
            style={{ minHeight: 90, textAlignVertical: 'top' }}
          />

          <Text className="text-gray-500 text-sm mt-3">Story (details) *</Text>
          <TextInput
            value={story}
            onChangeText={setStory}
            placeholder="Share your story, what you need, and how support will be used."
            placeholderTextColor="#9CA3AF"
            multiline
            className="mt-2 bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-gray-900"
            style={{ minHeight: 160, textAlignVertical: 'top' }}
          />

          <Text className="text-gray-500 text-sm mt-3">What are you looking for?</Text>
          <View className="flex-row flex-wrap mt-2">
            {NEEDS.map((n) => {
              const active = needs.includes(n.id);
              return (
                <Pressable
                  key={n.id}
                  onPress={() => toggleNeed(n.id)}
                  className={`mr-2 mb-2 px-3 py-2 rounded-full border ${active ? 'bg-terracotta-500 border-terracotta-500' : 'bg-white border-gray-200'}`}
                >
                  <Text className={`${active ? 'text-white' : 'text-gray-700'} font-semibold text-sm`}>
                    {n.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Support links */}
        <View className="mt-4 bg-white rounded-2xl p-4 border border-gray-100">
          <Text className="text-warmBrown font-bold">Support links / contact</Text>

          <Text className="text-gray-500 text-sm mt-3">Donation link (optional)</Text>
          <TextInput
            value={donationUrl}
            onChangeText={setDonationUrl}
            placeholder="https://…"
            placeholderTextColor="#9CA3AF"
            autoCapitalize="none"
            className="mt-2 bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-gray-900"
          />

          <Text className="text-gray-500 text-sm mt-3">Grant page link (optional)</Text>
          <TextInput
            value={grantUrl}
            onChangeText={setGrantUrl}
            placeholder="https://…"
            placeholderTextColor="#9CA3AF"
            autoCapitalize="none"
            className="mt-2 bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-gray-900"
          />

          <Text className="text-gray-500 text-sm mt-3">Sponsorship email (optional)</Text>
          <TextInput
            value={sponsorEmail}
            onChangeText={setSponsorEmail}
            placeholder="name@organization.org"
            placeholderTextColor="#9CA3AF"
            autoCapitalize="none"
            keyboardType="email-address"
            className="mt-2 bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-gray-900"
          />

          <Text className="text-gray-500 text-sm mt-3">Sponsorship phone (optional)</Text>
          <TextInput
            value={sponsorPhone}
            onChangeText={setSponsorPhone}
            placeholder="+1 555…"
            placeholderTextColor="#9CA3AF"
            keyboardType="phone-pad"
            className="mt-2 bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-gray-900"
          />
        </View>

        {/* Media */}
        <View className="mt-4 bg-white rounded-2xl p-4 border border-gray-100">
          <Text className="text-warmBrown font-bold">Media (optional)</Text>
          <Text className="text-gray-500 text-sm mt-1">
            Add a cover image and/or a short video to tell your story (video max 100MB).
          </Text>

          {/* Cover image picker */}
          <View className="mt-3">
            <View className="flex-row items-center justify-between">
              <Text className="text-gray-700 font-semibold">Cover image</Text>
              <Pressable
                onPress={async () => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
                  if (status !== 'granted') {
                    Alert.alert('Permission needed', 'Please allow access to your photos.');
                    return;
                  }
                  const result = await ImagePicker.launchImageLibraryAsync({
                    mediaTypes: ['images'],
                    allowsEditing: true,
                    quality: 0.85,
                  });
                  if (!result.canceled && result.assets?.[0]?.uri) {
                    setCoverImageLocalUri(result.assets[0].uri);
                    setCoverImageUrl('');
                  }
                }}
              >
                <Text className="text-terracotta-500 font-semibold">Choose</Text>
              </Pressable>
            </View>

            {coverImageLocalUri ? (
              <View className="mt-2">
                <Image source={{ uri: coverImageLocalUri }} style={{ width: '100%', height: 180, borderRadius: 16 }} resizeMode="cover" />
                <Pressable
                  onPress={() => setCoverImageLocalUri(null)}
                  className="mt-2 bg-gray-100 rounded-xl px-3 py-2"
                >
                  <Text className="text-gray-700 font-semibold text-center">Remove cover</Text>
                </Pressable>
              </View>
            ) : (
              <>
                <Text className="text-gray-500 text-sm mt-2">Or paste a cover image URL</Text>
                <TextInput
                  value={coverImageUrl}
                  onChangeText={(t) => {
                    setCoverImageUrl(t);
                    if (t.trim()) setCoverImageLocalUri(null);
                  }}
                  placeholder="https://…"
                  placeholderTextColor="#9CA3AF"
                  autoCapitalize="none"
                  className="mt-2 bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-gray-900"
                />
              </>
            )}
          </View>

          {/* Video picker */}
          <View className="mt-5">
            <View className="flex-row items-center justify-between">
              <Text className="text-gray-700 font-semibold">Video</Text>
              <Pressable
                onPress={async () => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
                  if (status !== 'granted') {
                    Alert.alert('Permission needed', 'Please allow access to your media library.');
                    return;
                  }
                  const result = await ImagePicker.launchImageLibraryAsync({
                    mediaTypes: ['videos'],
                    allowsEditing: true,
                    quality: 0.8,
                  });
                  if (!result.canceled && result.assets?.[0]?.uri) {
                    setVideoLocalUri(result.assets[0].uri);
                  }
                }}
              >
                <Text className="text-terracotta-500 font-semibold">Choose</Text>
              </Pressable>
            </View>

            {videoLocalUri ? (
              <View className="mt-2">
                <VideoPreview uri={videoLocalUri} />
                <Pressable onPress={() => setVideoLocalUri(null)} className="mt-2 bg-gray-100 rounded-xl px-3 py-2">
                  <Text className="text-gray-700 font-semibold text-center">Remove video</Text>
                </Pressable>
              </View>
            ) : (
              <Text className="text-gray-500 text-sm mt-2">Optional: add a short video (max 100MB).</Text>
            )}
          </View>
        </View>

        {/* Bottom button (redundant) */}
        <Pressable
          onPress={submit}
          disabled={!canSubmit || busy}
          className={`mt-5 rounded-2xl px-4 py-4 ${canSubmit && !busy ? 'bg-terracotta-500' : 'bg-gray-200'}`}
        >
          <Text className={`text-center font-semibold ${canSubmit && !busy ? 'text-white' : 'text-gray-500'}`}>
            {busy ? 'Publishing…' : 'Publish impact story'}
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

function VideoPreview({ uri }: { uri: string }) {
  const player = useVideoPlayer(uri, (p) => {
    p.loop = true;
    p.play();
  });
  return (
    <View style={{ width: '100%', height: 220, borderRadius: 16, overflow: 'hidden', backgroundColor: '#111827' }}>
      <VideoView player={player} style={{ width: '100%', height: '100%' }} contentFit="cover" nativeControls={false} />
    </View>
  );
}

