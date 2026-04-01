import AsyncStorage from '@react-native-async-storage/async-storage';

export type RadioGenre = 'afrobeats' | 'gospel' | 'talk' | 'news' | 'culture' | 'sports' | 'mixed';

export interface RadioStation {
  id: string;
  hostId: string;
  hostName: string;
  hostAvatar: string;
  stationName: string;
  description: string;
  /** Icecast/Shoutcast-style MP3/AAC HTTPS URL — set `EXPO_PUBLIC_RADIO_STREAM_URL` in `.env` */
  streamUrl?: string;
  genre: RadioGenre;
  tags: string[];
  coverImage?: string;
  isLive: boolean;
  listenerCount: number;
  currentTrack?: string;
  currentShow?: string;
  schedule?: RadioScheduleItem[];
  createdAt: string;
  startedAt?: string;
  totalBroadcasts: number;
  totalListenMinutes: number;
  followers: number;
}

export interface RadioScheduleItem {
  id: string;
  stationId: string;
  showName: string;
  hostName: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  description: string;
  isRecurring: boolean;
}

export interface RadioListener {
  id: string;
  oderId: string;
  userName: string;
  userAvatar: string;
  joinedAt: string;
}

export interface RadioMessage {
  id: string;
  stationId: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  content: string;
  timestamp: string;
  isDJ?: boolean;
  isSystem?: boolean;
}

/**
 * Single partner station. Replace copy/images when your host sends final assets.
 * Stream URL: set `EXPO_PUBLIC_RADIO_STREAM_URL` (restart Expo after changing .env).
 */
function resolveStreamUrl(): string | undefined {
  const url = process.env.EXPO_PUBLIC_RADIO_STREAM_URL?.trim();
  return url && url.length > 0 ? url : undefined;
}

export const PRIMARY_RADIO_STATION: RadioStation = {
  id: 'community_radio',
  hostId: 'partner',
  hostName: 'Live host',
  hostAvatar: 'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=200&h=200&fit=crop',
  stationName: 'Community Radio',
  description: 'Our community partner station. Tap play to listen live.',
  streamUrl: resolveStreamUrl(),
  genre: 'mixed',
  tags: ['Community', 'Live'],
  coverImage: 'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=800&fit=crop',
  isLive: true,
  listenerCount: 0,
  currentShow: 'Live broadcast',
  createdAt: new Date().toISOString(),
  startedAt: new Date().toISOString(),
  totalBroadcasts: 1,
  totalListenMinutes: 0,
  followers: 0,
};

const STATIONS: RadioStation[] = [PRIMARY_RADIO_STATION];

export async function getAllStations(): Promise<RadioStation[]> {
  return [...STATIONS];
}

export async function getLiveStations(): Promise<RadioStation[]> {
  return STATIONS.filter((s) => s.isLive);
}

export async function getStationsByGenre(genre: RadioGenre): Promise<RadioStation[]> {
  return STATIONS.filter((s) => s.genre === genre);
}

export async function getStation(stationId: string): Promise<RadioStation | null> {
  return STATIONS.find((s) => s.id === stationId) ?? null;
}

export async function getPopularStations(limit: number = 5): Promise<RadioStation[]> {
  return STATIONS.slice(0, limit);
}

/** No schedule until you add it from the host — returns empty */
export async function getUpcomingShows(): Promise<{ station: RadioStation; show: RadioScheduleItem }[]> {
  return [];
}

const FOLLOWED_STATIONS_KEY = 'followed_radio_stations';

export async function getFollowedStations(): Promise<string[]> {
  try {
    const stored = await AsyncStorage.getItem(FOLLOWED_STATIONS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export async function toggleFollowStation(stationId: string): Promise<boolean> {
  try {
    const followed = await getFollowedStations();
    const index = followed.indexOf(stationId);

    if (index > -1) {
      followed.splice(index, 1);
      await AsyncStorage.setItem(FOLLOWED_STATIONS_KEY, JSON.stringify(followed));
      return false;
    }
    followed.push(stationId);
    await AsyncStorage.setItem(FOLLOWED_STATIONS_KEY, JSON.stringify(followed));
    return true;
  } catch {
    return false;
  }
}

export async function isFollowingStation(stationId: string): Promise<boolean> {
  const followed = await getFollowedStations();
  return followed.includes(stationId);
}

export function formatBroadcastDuration(startedAt: string): string {
  const start = new Date(startedAt);
  const now = new Date();
  const diffMs = now.getTime() - start.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHrs = Math.floor(diffMins / 60);
  const mins = diffMins % 60;

  if (diffHrs > 0) {
    return `${diffHrs}h ${mins}m`;
  }
  return `${mins}m`;
}

export function getDayName(dayOfWeek: number): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[dayOfWeek];
}

export const GENRE_CONFIG: Record<RadioGenre, { color: string; bgColor: string; emoji: string }> = {
  afrobeats: { color: '#F59E0B', bgColor: '#F59E0B20', emoji: '🎵' },
  gospel: { color: '#8B5CF6', bgColor: '#8B5CF620', emoji: '🙏' },
  talk: { color: '#3B82F6', bgColor: '#3B82F620', emoji: '🎙️' },
  news: { color: '#EF4444', bgColor: '#EF444420', emoji: '📰' },
  culture: { color: '#10B981', bgColor: '#10B98120', emoji: '🌍' },
  sports: { color: '#EC4899', bgColor: '#EC489920', emoji: '⚽' },
  mixed: { color: '#6B7280', bgColor: '#6B728020', emoji: '📻' },
};
