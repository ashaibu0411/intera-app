import AsyncStorage from '@react-native-async-storage/async-storage';

// Keys for AsyncStorage
const RADIO_STATIONS_KEY = 'live_radio_stations';
const RADIO_SCHEDULE_KEY = 'radio_schedule';

export type RadioGenre = 'afrobeats' | 'gospel' | 'talk' | 'news' | 'culture' | 'sports' | 'mixed';

export interface RadioStation {
  id: string;
  hostId: string;
  hostName: string;
  hostAvatar: string;
  stationName: string;
  description: string;
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
  dayOfWeek: number; // 0-6, Sunday = 0
  startTime: string; // "14:00"
  endTime: string; // "16:00"
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

// Mock live radio stations
const MOCK_STATIONS: RadioStation[] = [
  {
    id: 'radio_1',
    hostId: 'host_1',
    hostName: 'DJ Afrowave',
    hostAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
    stationName: 'Afrobeats Live',
    description: 'The hottest Afrobeats, Amapiano, and African rhythms 24/7. Broadcasting live from my basement studio!',
    genre: 'afrobeats',
    tags: ['Afrobeats', 'Amapiano', 'Naija'],
    coverImage: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400',
    isLive: true,
    listenerCount: 342,
    currentTrack: 'Burna Boy - City Boys',
    currentShow: 'Afternoon Vibes',
    createdAt: '2024-10-01',
    startedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    totalBroadcasts: 156,
    totalListenMinutes: 45000,
    followers: 2340,
  },
  {
    id: 'radio_2',
    hostId: 'host_2',
    hostName: 'Sister Joy',
    hostAvatar: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=100',
    stationName: 'Gospel Hour',
    description: 'Uplifting gospel music and inspirational messages to bless your day. Join our prayer sessions!',
    genre: 'gospel',
    tags: ['Gospel', 'Worship', 'Prayer'],
    coverImage: 'https://images.unsplash.com/photo-1499209974431-9dddcece7f88?w=400',
    isLive: true,
    listenerCount: 189,
    currentTrack: 'Sinach - Way Maker',
    currentShow: 'Evening Worship',
    createdAt: '2024-09-15',
    startedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    totalBroadcasts: 98,
    totalListenMinutes: 32000,
    followers: 1567,
  },
  {
    id: 'radio_3',
    hostId: 'host_3',
    hostName: 'Uncle Kofi',
    hostAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100',
    stationName: 'Diaspora Talk',
    description: 'Real talk about life in the diaspora. Immigration tips, money advice, and community stories.',
    genre: 'talk',
    tags: ['Talk Show', 'Immigration', 'Finance'],
    coverImage: 'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=400',
    isLive: false,
    listenerCount: 0,
    currentShow: 'Off Air',
    createdAt: '2024-11-01',
    totalBroadcasts: 45,
    totalListenMinutes: 18000,
    followers: 892,
    schedule: [
      {
        id: 'sched_1',
        stationId: 'radio_3',
        showName: 'Morning Money',
        hostName: 'Uncle Kofi',
        dayOfWeek: 1, // Monday
        startTime: '07:00',
        endTime: '09:00',
        description: 'Financial tips for the diaspora',
        isRecurring: true,
      },
      {
        id: 'sched_2',
        stationId: 'radio_3',
        showName: 'Immigration Hour',
        hostName: 'Uncle Kofi & Guest Lawyers',
        dayOfWeek: 3, // Wednesday
        startTime: '19:00',
        endTime: '21:00',
        description: 'Q&A with immigration experts',
        isRecurring: true,
      },
    ],
  },
  {
    id: 'radio_4',
    hostId: 'host_4',
    hostName: 'Mama Africa',
    hostAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100',
    stationName: 'Culture Connect',
    description: 'Preserving our heritage through stories, music, and language lessons. Learn Yoruba, Swahili, and more!',
    genre: 'culture',
    tags: ['Culture', 'Language', 'Heritage'],
    coverImage: 'https://images.unsplash.com/photo-1544531586-fde5298cdd40?w=400',
    isLive: true,
    listenerCount: 127,
    currentShow: 'Yoruba Lessons',
    createdAt: '2024-08-20',
    startedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    totalBroadcasts: 78,
    totalListenMinutes: 28000,
    followers: 1123,
  },
  {
    id: 'radio_5',
    hostId: 'host_5',
    hostName: 'Sports King',
    hostAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
    stationName: 'African Sports Radio',
    description: 'All African football, NBA players of African descent, and Olympic updates. Game analysis and predictions!',
    genre: 'sports',
    tags: ['Sports', 'Football', 'AFCON'],
    coverImage: 'https://images.unsplash.com/photo-1461896836934- voices&app=true&w=400',
    isLive: false,
    listenerCount: 0,
    currentShow: 'Off Air',
    createdAt: '2024-12-01',
    totalBroadcasts: 23,
    totalListenMinutes: 9500,
    followers: 456,
    schedule: [
      {
        id: 'sched_3',
        stationId: 'radio_5',
        showName: 'Match Day Live',
        hostName: 'Sports King',
        dayOfWeek: 6, // Saturday
        startTime: '12:00',
        endTime: '18:00',
        description: 'Live commentary on African football matches',
        isRecurring: true,
      },
    ],
  },
];

// Get all stations
export async function getAllStations(): Promise<RadioStation[]> {
  return [...MOCK_STATIONS];
}

// Get live stations
export async function getLiveStations(): Promise<RadioStation[]> {
  return MOCK_STATIONS.filter(s => s.isLive);
}

// Get stations by genre
export async function getStationsByGenre(genre: RadioGenre): Promise<RadioStation[]> {
  return MOCK_STATIONS.filter(s => s.genre === genre);
}

// Get station by ID
export async function getStation(stationId: string): Promise<RadioStation | null> {
  return MOCK_STATIONS.find(s => s.id === stationId) || null;
}

// Get popular stations
export async function getPopularStations(limit: number = 5): Promise<RadioStation[]> {
  return [...MOCK_STATIONS]
    .sort((a, b) => b.followers - a.followers)
    .slice(0, limit);
}

// Get upcoming shows
export async function getUpcomingShows(): Promise<{station: RadioStation; show: RadioScheduleItem}[]> {
  const now = new Date();
  const currentDay = now.getDay();
  const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

  const upcoming: {station: RadioStation; show: RadioScheduleItem}[] = [];

  for (const station of MOCK_STATIONS) {
    if (station.schedule) {
      for (const show of station.schedule) {
        // Check if show is today and upcoming, or in the next few days
        if (show.dayOfWeek === currentDay && show.startTime > currentTime) {
          upcoming.push({ station, show });
        } else if (show.dayOfWeek > currentDay) {
          upcoming.push({ station, show });
        }
      }
    }
  }

  return upcoming.slice(0, 5);
}

// Follow/unfollow station (local storage)
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
      return false; // Unfollowed
    } else {
      followed.push(stationId);
      await AsyncStorage.setItem(FOLLOWED_STATIONS_KEY, JSON.stringify(followed));
      return true; // Followed
    }
  } catch {
    return false;
  }
}

export async function isFollowingStation(stationId: string): Promise<boolean> {
  const followed = await getFollowedStations();
  return followed.includes(stationId);
}

// Format duration
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

// Get day name
export function getDayName(dayOfWeek: number): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[dayOfWeek];
}

// Genre colors and icons
export const GENRE_CONFIG: Record<RadioGenre, { color: string; bgColor: string; emoji: string }> = {
  afrobeats: { color: '#F59E0B', bgColor: '#F59E0B20', emoji: '🎵' },
  gospel: { color: '#8B5CF6', bgColor: '#8B5CF620', emoji: '🙏' },
  talk: { color: '#3B82F6', bgColor: '#3B82F620', emoji: '🎙️' },
  news: { color: '#EF4444', bgColor: '#EF444420', emoji: '📰' },
  culture: { color: '#10B981', bgColor: '#10B98120', emoji: '🌍' },
  sports: { color: '#EC4899', bgColor: '#EC489920', emoji: '⚽' },
  mixed: { color: '#6B7280', bgColor: '#6B728020', emoji: '📻' },
};
