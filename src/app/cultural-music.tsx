import React, { useState, useRef, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, Modal, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import {
  ArrowLeft, Search, Play, Pause, SkipBack, SkipForward, Heart, Share2,
  Music, Globe, Clock, Users, Shuffle, Repeat, Volume2, ChevronDown,
  ListMusic, Disc3, Mic2, X, Plus, Filter
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Animated, {
  FadeInDown, FadeIn, useSharedValue, useAnimatedStyle,
  withRepeat, withTiming, Easing, withSequence
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Song {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: string;
  durationSeconds: number;
  coverImage: string;
  region: string;
  country: string;
  genre: string;
  year: string;
  description: string;
  plays: number;
  isLiked: boolean;
}

interface Playlist {
  id: string;
  name: string;
  description: string;
  coverImage: string;
  songCount: number;
  region: string;
  gradient: [string, string];
}

const REGIONS = [
  { key: 'all', label: 'All Regions', emoji: '🌍' },
  { key: 'west-africa', label: 'West Africa', emoji: '🇳🇬' },
  { key: 'east-africa', label: 'East Africa', emoji: '🇰🇪' },
  { key: 'south-africa', label: 'Southern Africa', emoji: '🇿🇦' },
  { key: 'north-africa', label: 'North Africa', emoji: '🇪🇬' },
  { key: 'caribbean', label: 'Caribbean', emoji: '🇯🇲' },
  { key: 'latin-america', label: 'Latin America', emoji: '🇧🇷' },
  { key: 'south-asia', label: 'South Asia', emoji: '🇮🇳' },
  { key: 'east-asia', label: 'East Asia', emoji: '🇯🇵' },
  { key: 'middle-east', label: 'Middle East', emoji: '🇸🇦' },
  { key: 'pacific', label: 'Pacific Islands', emoji: '🇫🇯' },
  { key: 'indigenous', label: 'Indigenous', emoji: '🪶' },
];

const GENRES = [
  'All', 'Highlife', 'Jùjú', 'Afrobeat', 'Mbalax', 'Soukous', 'Benga', 'Taarab',
  'Kwaito', 'Mbaqanga', 'Gnawa', 'Raï', 'Reggae', 'Calypso', 'Soca', 'Cumbia',
  'Bossa Nova', 'Samba', 'Classical', 'Folk', 'Qawwali', 'Bhangra', 'Gamelan',
  'Taiko', 'Oud', 'Sufi', 'Hula', 'Didgeridoo', 'Pow Wow'
];

const MOCK_SONGS: Song[] = [
  // Ghana Highlife Classics
  {
    id: '1',
    title: 'Yaa Amponsah',
    artist: 'Kwame Asare (Jacob Sam)',
    album: 'Ghana Highlife Classics',
    duration: '4:15',
    durationSeconds: 255,
    coverImage: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400',
    region: 'west-africa',
    country: 'Ghana',
    genre: 'Highlife',
    year: '1928',
    description: 'The song that started it all - considered the first Highlife recording and a timeless Ghanaian classic.',
    plays: 1800000,
    isLiked: true,
  },
  {
    id: '2',
    title: 'Ɛnyimnyam Ndwom (Obra)',
    artist: 'E.T. Mensah',
    album: 'The King of Highlife',
    duration: '5:20',
    durationSeconds: 320,
    coverImage: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=400',
    region: 'west-africa',
    country: 'Ghana',
    genre: 'Highlife',
    year: '1952',
    description: 'E.T. Mensah, the "King of Highlife," helped spread the genre across Africa and beyond.',
    plays: 2100000,
    isLiked: true,
  },
  {
    id: '3',
    title: 'Hwehwe Mu Na Yi Wo Mpena',
    artist: 'Dr. K. Gyasi',
    album: 'Sikyi Highlife',
    duration: '6:45',
    durationSeconds: 405,
    coverImage: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=400',
    region: 'west-africa',
    country: 'Ghana',
    genre: 'Highlife',
    year: '1960s',
    description: 'A classic from the Sikyi Highlife era, known for its intricate guitar work and wise lyrics.',
    plays: 1500000,
    isLiked: false,
  },
  {
    id: '4',
    title: 'Odo Ye Wu',
    artist: 'Nana Ampadu',
    album: 'African Brothers Band',
    duration: '7:30',
    durationSeconds: 450,
    coverImage: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=400',
    region: 'west-africa',
    country: 'Ghana',
    genre: 'Highlife',
    year: '1970s',
    description: '"Love is painful" - Nana Ampadu\'s storytelling and proverbs made him a legend.',
    plays: 2800000,
    isLiked: true,
  },
  {
    id: '5',
    title: 'Ebi Te Yie',
    artist: 'Nana Ampadu',
    album: 'African Brothers International',
    duration: '8:15',
    durationSeconds: 495,
    coverImage: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400',
    region: 'west-africa',
    country: 'Ghana',
    genre: 'Highlife',
    year: '1967',
    description: '"Some are living well" - A song about life\'s inequalities that resonates to this day.',
    plays: 3200000,
    isLiked: true,
  },
  {
    id: '6',
    title: 'Awoo',
    artist: 'Amakye Dede',
    album: 'Iron Boy',
    duration: '5:48',
    durationSeconds: 348,
    coverImage: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400',
    region: 'west-africa',
    country: 'Ghana',
    genre: 'Highlife',
    year: '1980s',
    description: 'The "Iron Boy" Amakye Dede modernized Highlife for a new generation.',
    plays: 2400000,
    isLiked: false,
  },
  {
    id: '7',
    title: 'Sɛ Ɔbɛka',
    artist: 'Amakye Dede',
    album: 'Classics Collection',
    duration: '6:22',
    durationSeconds: 382,
    coverImage: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400',
    region: 'west-africa',
    country: 'Ghana',
    genre: 'Highlife',
    year: '1985',
    description: 'One of the most beloved Highlife songs about fate and destiny.',
    plays: 2600000,
    isLiked: true,
  },
  {
    id: '8',
    title: 'Onipa Nua',
    artist: 'A.B. Crentsil',
    album: 'Sweet Talks',
    duration: '5:55',
    durationSeconds: 355,
    coverImage: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=400',
    region: 'west-africa',
    country: 'Ghana',
    genre: 'Highlife',
    year: '1979',
    description: '"Your fellow human" - A.B. Crentsil\'s soulful voice defined an era.',
    plays: 1900000,
    isLiked: false,
  },
  {
    id: '9',
    title: 'Moses',
    artist: 'A.B. Crentsil',
    album: 'Tantie Alaba',
    duration: '6:10',
    durationSeconds: 370,
    coverImage: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400',
    region: 'west-africa',
    country: 'Ghana',
    genre: 'Highlife',
    year: '1980',
    description: 'A classic that showcases the storytelling tradition of Ghanaian Highlife.',
    plays: 1700000,
    isLiked: false,
  },
  {
    id: '10',
    title: 'Kyenkyen Bi Adi M\'awu',
    artist: 'Daddy Lumba',
    album: 'Aben Wo Ha',
    duration: '5:35',
    durationSeconds: 335,
    coverImage: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=400',
    region: 'west-africa',
    country: 'Ghana',
    genre: 'Highlife',
    year: '1989',
    description: 'Daddy Lumba brought Highlife into the modern era with his unique style.',
    plays: 3500000,
    isLiked: true,
  },
  {
    id: '11',
    title: 'Aben Wo Ha',
    artist: 'Daddy Lumba',
    album: 'Aben Wo Ha',
    duration: '6:08',
    durationSeconds: 368,
    coverImage: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=400',
    region: 'west-africa',
    country: 'Ghana',
    genre: 'Highlife',
    year: '1989',
    description: '"There is a reason" - A timeless classic about patience and trust.',
    plays: 4100000,
    isLiked: true,
  },
  {
    id: '12',
    title: 'Ankwanobi',
    artist: 'Kojo Antwi',
    album: 'Mr. Music Man',
    duration: '5:42',
    durationSeconds: 342,
    coverImage: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400',
    region: 'west-africa',
    country: 'Ghana',
    genre: 'Highlife',
    year: '1990s',
    description: 'Kojo Antwi, the "Mr. Music Man," blends Highlife with soul and R&B.',
    plays: 2200000,
    isLiked: false,
  },
  {
    id: '13',
    title: 'Tom and Jerry',
    artist: 'Kojo Antwi',
    album: 'Groovy',
    duration: '5:18',
    durationSeconds: 318,
    coverImage: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400',
    region: 'west-africa',
    country: 'Ghana',
    genre: 'Highlife',
    year: '1995',
    description: 'A playful love song that became a wedding favorite across Ghana.',
    plays: 2900000,
    isLiked: true,
  },
  {
    id: '14',
    title: 'Ye Wo Krom',
    artist: 'Ofori Amponsah',
    album: 'Odwo',
    duration: '5:25',
    durationSeconds: 325,
    coverImage: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=400',
    region: 'west-africa',
    country: 'Ghana',
    genre: 'Highlife',
    year: '2000s',
    description: 'Modern Highlife that keeps the tradition alive for younger generations.',
    plays: 1800000,
    isLiked: false,
  },
  {
    id: '15',
    title: 'Mensei Da',
    artist: 'Daasebre Gyamenah',
    album: 'Kokoko',
    duration: '5:50',
    durationSeconds: 350,
    coverImage: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400',
    region: 'west-africa',
    country: 'Ghana',
    genre: 'Highlife',
    year: '1997',
    description: 'A beautiful song about perseverance that touched hearts across Ghana.',
    plays: 2000000,
    isLiked: true,
  },
  {
    id: '16',
    title: 'Fa Me Ko',
    artist: 'Pat Thomas',
    album: 'Golden Highlife Classics',
    duration: '6:30',
    durationSeconds: 390,
    coverImage: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=400',
    region: 'west-africa',
    country: 'Ghana',
    genre: 'Highlife',
    year: '1970s',
    description: '"Take me along" - Pat Thomas\'s golden voice defined 70s Highlife.',
    plays: 1600000,
    isLiked: false,
  },
  {
    id: '17',
    title: 'Sika Ye Mogya',
    artist: 'Pat Thomas',
    album: 'Sika Ye Mogya',
    duration: '7:15',
    durationSeconds: 435,
    coverImage: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=400',
    region: 'west-africa',
    country: 'Ghana',
    genre: 'Highlife',
    year: '1977',
    description: '"Money is blood" - A powerful commentary on wealth and family.',
    plays: 2300000,
    isLiked: true,
  },
  {
    id: '18',
    title: 'Kofi Nkrabea',
    artist: 'C.K. Mann',
    album: 'Osode Band',
    duration: '6:45',
    durationSeconds: 405,
    coverImage: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400',
    region: 'west-africa',
    country: 'Ghana',
    genre: 'Highlife',
    year: '1969',
    description: 'C.K. Mann pioneered the Osode style of Highlife from the Western Region.',
    plays: 1400000,
    isLiked: false,
  },
  // Other West African Classics
  {
    id: '19',
    title: 'Sweet Mother',
    artist: 'Prince Nico Mbarga',
    album: 'Sweet Mother',
    duration: '5:42',
    durationSeconds: 342,
    coverImage: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400',
    region: 'west-africa',
    country: 'Nigeria',
    genre: 'Highlife',
    year: '1976',
    description: 'One of the best-selling African singles of all time, celebrating mothers everywhere.',
    plays: 2500000,
    isLiked: true,
  },
  {
    id: '20',
    title: 'Zombie',
    artist: 'Fela Kuti',
    album: 'Zombie',
    duration: '12:26',
    durationSeconds: 746,
    coverImage: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=400',
    region: 'west-africa',
    country: 'Nigeria',
    genre: 'Afrobeat',
    year: '1977',
    description: 'A politically charged Afrobeat masterpiece criticizing military rule.',
    plays: 1800000,
    isLiked: false,
  },
  {
    id: '21',
    title: 'Yéké Yéké',
    artist: 'Mory Kanté',
    album: 'Akwaba Beach',
    duration: '4:35',
    durationSeconds: 275,
    coverImage: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=400',
    region: 'west-africa',
    country: 'Guinea',
    genre: 'Mandinka',
    year: '1987',
    description: 'A global hit blending traditional kora with modern dance music.',
    plays: 3200000,
    isLiked: true,
  },
  {
    id: '22',
    title: '7 Seconds',
    artist: 'Youssou N\'Dour & Neneh Cherry',
    album: 'The Guide',
    duration: '4:13',
    durationSeconds: 253,
    coverImage: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=400',
    region: 'west-africa',
    country: 'Senegal',
    genre: 'Mbalax',
    year: '1994',
    description: 'A powerful duet about equality and human connection.',
    plays: 4500000,
    isLiked: false,
  },
  // East Africa
  {
    id: '23',
    title: 'Malaika',
    artist: 'Miriam Makeba',
    album: 'The World of Miriam Makeba',
    duration: '3:48',
    durationSeconds: 228,
    coverImage: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400',
    region: 'east-africa',
    country: 'Kenya/Tanzania',
    genre: 'Taarab',
    year: '1960s',
    description: 'A beloved Swahili love song known throughout Africa.',
    plays: 2100000,
    isLiked: true,
  },
  {
    id: '24',
    title: 'Jambo Bwana',
    artist: 'Them Mushrooms',
    album: 'Jambo Bwana',
    duration: '4:02',
    durationSeconds: 242,
    coverImage: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400',
    region: 'east-africa',
    country: 'Kenya',
    genre: 'Benga',
    year: '1980',
    description: 'The unofficial anthem of Kenya, welcoming visitors.',
    plays: 1500000,
    isLiked: false,
  },
  // Southern Africa
  {
    id: '25',
    title: 'Pata Pata',
    artist: 'Miriam Makeba',
    album: 'Pata Pata',
    duration: '2:58',
    durationSeconds: 178,
    coverImage: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400',
    region: 'south-africa',
    country: 'South Africa',
    genre: 'Mbaqanga',
    year: '1967',
    description: 'A joyful dance song that became an international sensation.',
    plays: 3800000,
    isLiked: true,
  },
  {
    id: '26',
    title: 'Grazing in the Grass',
    artist: 'Hugh Masekela',
    album: 'The Promise of a Future',
    duration: '2:55',
    durationSeconds: 175,
    coverImage: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=400',
    region: 'south-africa',
    country: 'South Africa',
    genre: 'Jazz',
    year: '1968',
    description: 'An instrumental jazz hit that topped the US charts.',
    plays: 2900000,
    isLiked: false,
  },
  // Caribbean
  {
    id: '27',
    title: 'One Love',
    artist: 'Bob Marley',
    album: 'Exodus',
    duration: '2:52',
    durationSeconds: 172,
    coverImage: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400',
    region: 'caribbean',
    country: 'Jamaica',
    genre: 'Reggae',
    year: '1977',
    description: 'A timeless anthem of peace and unity.',
    plays: 8500000,
    isLiked: true,
  },
  {
    id: '28',
    title: 'Hot Hot Hot',
    artist: 'Arrow',
    album: 'Hot Hot Hot',
    duration: '3:28',
    durationSeconds: 208,
    coverImage: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=400',
    region: 'caribbean',
    country: 'Montserrat',
    genre: 'Soca',
    year: '1982',
    description: 'The definitive soca party anthem.',
    plays: 4200000,
    isLiked: false,
  },
  // Latin America
  {
    id: '29',
    title: 'Cielito Lindo',
    artist: 'Traditional',
    album: 'Mexican Folk Classics',
    duration: '3:15',
    durationSeconds: 195,
    coverImage: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=400',
    region: 'latin-america',
    country: 'Mexico',
    genre: 'Folk',
    year: '1882',
    description: 'A beloved Mexican folk song known worldwide.',
    plays: 3100000,
    isLiked: true,
  },
  {
    id: '30',
    title: 'Garota de Ipanema',
    artist: 'Tom Jobim & Astrud Gilberto',
    album: 'Getz/Gilberto',
    duration: '5:21',
    durationSeconds: 321,
    coverImage: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=400',
    region: 'latin-america',
    country: 'Brazil',
    genre: 'Bossa Nova',
    year: '1964',
    description: 'The most famous bossa nova song ever recorded.',
    plays: 6200000,
    isLiked: true,
  },
  // South Asia
  {
    id: '31',
    title: 'Nusrat Fateh Ali Khan - Mustt Mustt',
    artist: 'Nusrat Fateh Ali Khan',
    album: 'Mustt Mustt',
    duration: '7:45',
    durationSeconds: 465,
    coverImage: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400',
    region: 'south-asia',
    country: 'Pakistan',
    genre: 'Qawwali',
    year: '1990',
    description: 'A groundbreaking fusion of qawwali and electronic music.',
    plays: 2800000,
    isLiked: false,
  },
  {
    id: '32',
    title: 'Jai Ho',
    artist: 'A.R. Rahman',
    album: 'Slumdog Millionaire',
    duration: '5:19',
    durationSeconds: 319,
    coverImage: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=400',
    region: 'south-asia',
    country: 'India',
    genre: 'Bollywood',
    year: '2008',
    description: 'Oscar-winning song celebrating victory and joy.',
    plays: 9500000,
    isLiked: true,
  },
  // Middle East
  {
    id: '33',
    title: 'Enta Omri',
    artist: 'Umm Kulthum',
    album: 'Enta Omri',
    duration: '86:00',
    durationSeconds: 5160,
    coverImage: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=400',
    region: 'middle-east',
    country: 'Egypt',
    genre: 'Classical Arabic',
    year: '1964',
    description: 'The legendary Voice of Egypt\'s most famous composition.',
    plays: 4100000,
    isLiked: true,
  },
  {
    id: '34',
    title: 'Ya Rayah',
    artist: 'Rachid Taha',
    album: 'Diwan',
    duration: '4:58',
    durationSeconds: 298,
    coverImage: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400',
    region: 'north-africa',
    country: 'Algeria',
    genre: 'Raï',
    year: '1997',
    description: 'A chaâbi classic about exile and longing.',
    plays: 2300000,
    isLiked: false,
  },
];

const MOCK_PLAYLISTS: Playlist[] = [
  {
    id: '1',
    name: 'Ghana Highlife Classics',
    description: 'The golden era of Ghanaian Highlife music',
    coverImage: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400',
    songCount: 18,
    region: 'west-africa',
    gradient: ['#C9A227', '#D4673A'],
  },
  {
    id: '2',
    name: 'African Classics',
    description: 'Timeless hits from across the African continent',
    coverImage: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400',
    songCount: 45,
    region: 'west-africa',
    gradient: ['#D4673A', '#C9A227'],
  },
  {
    id: '3',
    name: 'Caribbean Vibes',
    description: 'Reggae, soca, and calypso favorites',
    coverImage: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=400',
    songCount: 38,
    region: 'caribbean',
    gradient: ['#1B4D3E', '#22C55E'],
  },
  {
    id: '4',
    name: 'Sounds of India',
    description: 'Classical, Bollywood, and folk treasures',
    coverImage: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=400',
    songCount: 52,
    region: 'south-asia',
    gradient: ['#F59E0B', '#EF4444'],
  },
  {
    id: '5',
    name: 'Latin Rhythms',
    description: 'Salsa, bossa nova, and cumbia essentials',
    coverImage: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=400',
    songCount: 41,
    region: 'latin-america',
    gradient: ['#EC4899', '#8B5CF6'],
  },
  {
    id: '6',
    name: 'Middle Eastern Melodies',
    description: 'Oud, qawwali, and Arabic classics',
    coverImage: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=400',
    songCount: 33,
    region: 'middle-east',
    gradient: ['#3B82F6', '#06B6D4'],
  },
];

export default function CulturalMusicScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('all');
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showPlayer, setShowPlayer] = useState(false);
  const [showFullPlayer, setShowFullPlayer] = useState(false);
  const [progress, setProgress] = useState(0);
  const [likedSongs, setLikedSongs] = useState<Set<string>>(new Set(['1', '3', '5', '7', '9', '11', '12', '14', '15']));
  const [showFilters, setShowFilters] = useState(false);

  // Animation for spinning disc
  const rotation = useSharedValue(0);

  useEffect(() => {
    if (isPlaying) {
      rotation.value = withRepeat(
        withTiming(360, { duration: 3000, easing: Easing.linear }),
        -1,
        false
      );
    } else {
      rotation.value = withTiming(rotation.value);
    }
  }, [isPlaying]);

  const discStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  // Simulate progress
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    if (isPlaying && currentSong) {
      interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            return 0;
          }
          return prev + (100 / currentSong.durationSeconds);
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, currentSong]);

  const filteredSongs = MOCK_SONGS.filter(song => {
    const matchesRegion = selectedRegion === 'all' || song.region === selectedRegion;
    const matchesGenre = selectedGenre === 'All' || song.genre === selectedGenre;
    const matchesSearch = searchQuery === '' ||
      song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      song.artist.toLowerCase().includes(searchQuery.toLowerCase()) ||
      song.country.toLowerCase().includes(searchQuery.toLowerCase()) ||
      song.genre.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesRegion && matchesGenre && matchesSearch;
  });

  const playSong = (song: Song) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setCurrentSong(song);
    setIsPlaying(true);
    setShowPlayer(true);
    setProgress(0);
  };

  const togglePlay = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsPlaying(!isPlaying);
  };

  const toggleLike = (songId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLikedSongs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(songId)) {
        newSet.delete(songId);
      } else {
        newSet.add(songId);
      }
      return newSet;
    });
  };

  const formatPlays = (plays: number) => {
    if (plays >= 1000000) {
      return `${(plays / 1000000).toFixed(1)}M`;
    }
    if (plays >= 1000) {
      return `${(plays / 1000).toFixed(0)}K`;
    }
    return plays.toString();
  };

  return (
    <View className="flex-1 bg-[#0A0A0A]">
      <SafeAreaView edges={['top']} className="flex-1">
        {/* Header */}
        <View className="px-5 pb-4">
          <View className="flex-row items-center justify-between mb-4">
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.back();
              }}
              className="w-10 h-10 rounded-full bg-white/10 items-center justify-center"
            >
              <ArrowLeft size={20} color="#fff" />
            </Pressable>
            <View className="flex-row items-center">
              <Music size={20} color="#D4673A" />
              <Text className="text-white text-lg font-bold ml-2">Cultural Music</Text>
            </View>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setShowFilters(!showFilters);
              }}
              className="w-10 h-10 rounded-full bg-white/10 items-center justify-center"
            >
              <Filter size={20} color="#fff" />
            </Pressable>
          </View>

          {/* Search Bar */}
          <View className="flex-row items-center bg-white/10 rounded-2xl px-4 py-3 mb-4">
            <Search size={18} color="#9CA3AF" />
            <TextInput
              placeholder="Search songs, artists, countries, genres..."
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
              className="flex-1 ml-3 text-white text-base"
            />
          </View>

          {/* Region Filter */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }}>
            <View className="flex-row gap-2">
              {REGIONS.map((region) => (
                <Pressable
                  key={region.key}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSelectedRegion(region.key);
                  }}
                  className={`flex-row items-center px-4 py-2.5 rounded-full ${
                    selectedRegion === region.key
                      ? 'bg-[#D4673A]'
                      : 'bg-white/10'
                  }`}
                >
                  <Text className="mr-1.5">{region.emoji}</Text>
                  <Text className={`font-medium ${
                    selectedRegion === region.key ? 'text-white' : 'text-gray-300'
                  }`}>
                    {region.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Genre Filter (collapsible) */}
        {showFilters && (
          <Animated.View entering={FadeInDown.duration(200)} className="px-5 pb-4">
            <Text className="text-gray-400 text-sm mb-2">Filter by Genre</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }}>
              <View className="flex-row gap-2">
                {GENRES.slice(0, 15).map((genre) => (
                  <Pressable
                    key={genre}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setSelectedGenre(genre);
                    }}
                    className={`px-3 py-2 rounded-full ${
                      selectedGenre === genre
                        ? 'bg-[#C9A227]'
                        : 'bg-white/5 border border-white/10'
                    }`}
                  >
                    <Text className={`text-sm ${
                      selectedGenre === genre ? 'text-black font-semibold' : 'text-gray-300'
                    }`}>
                      {genre}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
          </Animated.View>
        )}

        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {/* Featured Playlists */}
          {searchQuery === '' && selectedRegion === 'all' && (
            <View className="px-5 mb-6">
              <Text className="text-white text-lg font-bold mb-3">Featured Playlists</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }}>
                <View className="flex-row gap-4">
                  {MOCK_PLAYLISTS.map((playlist, index) => (
                    <Animated.View
                      key={playlist.id}
                      entering={FadeInDown.delay(index * 100).springify()}
                    >
                      <Pressable
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                          setSelectedRegion(playlist.region);
                        }}
                        className="w-40"
                      >
                        <View className="w-40 h-40 rounded-2xl overflow-hidden mb-2">
                          <LinearGradient
                            colors={playlist.gradient}
                            style={{ position: 'absolute', width: '100%', height: '100%' }}
                          />
                          <Image
                            source={{ uri: playlist.coverImage }}
                            style={{ width: '100%', height: '100%', opacity: 0.6 }}
                            contentFit="cover"
                          />
                          <View className="absolute bottom-0 left-0 right-0 p-3">
                            <View className="flex-row items-center">
                              <ListMusic size={14} color="#fff" />
                              <Text className="text-white text-xs ml-1">{playlist.songCount} songs</Text>
                            </View>
                          </View>
                        </View>
                        <Text className="text-white font-semibold" numberOfLines={1}>{playlist.name}</Text>
                        <Text className="text-gray-500 text-xs" numberOfLines={1}>{playlist.description}</Text>
                      </Pressable>
                    </Animated.View>
                  ))}
                </View>
              </ScrollView>
            </View>
          )}

          {/* Songs List */}
          <View className="px-5">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-white text-lg font-bold">
                {searchQuery ? 'Search Results' : selectedRegion === 'all' ? 'All Songs' : `${REGIONS.find(r => r.key === selectedRegion)?.label} Music`}
              </Text>
              <Text className="text-gray-500 text-sm">{filteredSongs.length} songs</Text>
            </View>

            {filteredSongs.map((song, index) => (
              <Animated.View
                key={song.id}
                entering={FadeInDown.delay(index * 50).springify()}
              >
                <Pressable
                  onPress={() => playSong(song)}
                  className={`flex-row items-center p-3 rounded-2xl mb-2 ${
                    currentSong?.id === song.id ? 'bg-[#D4673A]/20 border border-[#D4673A]/50' : 'bg-white/5'
                  }`}
                >
                  {/* Album Art */}
                  <View className="relative">
                    <Image
                      source={{ uri: song.coverImage }}
                      style={{ width: 56, height: 56, borderRadius: 12 }}
                      contentFit="cover"
                    />
                    {currentSong?.id === song.id && isPlaying && (
                      <View className="absolute inset-0 bg-black/40 rounded-xl items-center justify-center">
                        <View className="flex-row items-end gap-0.5">
                          {[1, 2, 3].map((bar) => (
                            <Animated.View
                              key={bar}
                              className="w-1 bg-[#D4673A] rounded-full"
                              style={{ height: 8 + bar * 4 }}
                            />
                          ))}
                        </View>
                      </View>
                    )}
                  </View>

                  {/* Song Info */}
                  <View className="flex-1 ml-3">
                    <Text className={`font-semibold ${currentSong?.id === song.id ? 'text-[#D4673A]' : 'text-white'}`} numberOfLines={1}>
                      {song.title}
                    </Text>
                    <Text className="text-gray-400 text-sm" numberOfLines={1}>{song.artist}</Text>
                    <View className="flex-row items-center mt-1">
                      <Text className="text-gray-500 text-xs">{song.country}</Text>
                      <Text className="text-gray-600 mx-1">•</Text>
                      <Text className="text-gray-500 text-xs">{song.genre}</Text>
                      <Text className="text-gray-600 mx-1">•</Text>
                      <Text className="text-gray-500 text-xs">{song.year}</Text>
                    </View>
                  </View>

                  {/* Actions */}
                  <View className="flex-row items-center gap-2">
                    <Text className="text-gray-500 text-xs">{song.duration}</Text>
                    <Pressable
                      onPress={(e) => {
                        e.stopPropagation();
                        toggleLike(song.id);
                      }}
                      className="p-2"
                    >
                      <Heart
                        size={18}
                        color={likedSongs.has(song.id) ? '#EF4444' : '#6B7280'}
                        fill={likedSongs.has(song.id) ? '#EF4444' : 'transparent'}
                      />
                    </Pressable>
                  </View>
                </Pressable>
              </Animated.View>
            ))}

            {filteredSongs.length === 0 && (
              <View className="items-center py-12">
                <Music size={48} color="#374151" />
                <Text className="text-gray-500 text-lg mt-4">No songs found</Text>
                <Text className="text-gray-600 text-sm mt-1">Try adjusting your search or filters</Text>
              </View>
            )}
          </View>

          <View className="h-32" />
        </ScrollView>

        {/* Mini Player */}
        {showPlayer && currentSong && !showFullPlayer && (
          <Animated.View
            entering={FadeInDown.springify()}
            className="absolute bottom-0 left-0 right-0"
          >
            <Pressable
              onPress={() => setShowFullPlayer(true)}
              className="mx-4 mb-4"
            >
              <LinearGradient
                colors={['#1A1A2E', '#2D1F1A']}
                style={{ borderRadius: 16, padding: 12 }}
              >
                {/* Progress Bar */}
                <View className="h-1 bg-white/10 rounded-full mb-3 overflow-hidden">
                  <View
                    className="h-full bg-[#D4673A] rounded-full"
                    style={{ width: `${progress}%` }}
                  />
                </View>

                <View className="flex-row items-center">
                  <Image
                    source={{ uri: currentSong.coverImage }}
                    style={{ width: 48, height: 48, borderRadius: 8 }}
                    contentFit="cover"
                  />
                  <View className="flex-1 mx-3">
                    <Text className="text-white font-semibold" numberOfLines={1}>{currentSong.title}</Text>
                    <Text className="text-gray-400 text-sm" numberOfLines={1}>{currentSong.artist}</Text>
                  </View>
                  <Pressable
                    onPress={(e) => {
                      e.stopPropagation();
                      toggleLike(currentSong.id);
                    }}
                    className="p-2"
                  >
                    <Heart
                      size={20}
                      color={likedSongs.has(currentSong.id) ? '#EF4444' : '#fff'}
                      fill={likedSongs.has(currentSong.id) ? '#EF4444' : 'transparent'}
                    />
                  </Pressable>
                  <Pressable onPress={togglePlay} className="w-12 h-12 rounded-full bg-[#D4673A] items-center justify-center ml-2">
                    {isPlaying ? (
                      <Pause size={24} color="#fff" fill="#fff" />
                    ) : (
                      <Play size={24} color="#fff" fill="#fff" />
                    )}
                  </Pressable>
                </View>
              </LinearGradient>
            </Pressable>
          </Animated.View>
        )}

        {/* Full Player Modal */}
        <Modal visible={showFullPlayer} animationType="slide" transparent>
          <View className="flex-1 bg-[#0A0A0A]">
            <SafeAreaView className="flex-1">
              <LinearGradient
                colors={['#2D1F1A', '#0A0A0A']}
                style={{ flex: 1 }}
              >
                {/* Header */}
                <View className="flex-row items-center justify-between px-5 py-4">
                  <Pressable
                    onPress={() => setShowFullPlayer(false)}
                    className="p-2"
                  >
                    <ChevronDown size={28} color="#fff" />
                  </Pressable>
                  <Text className="text-white text-sm font-medium">Now Playing</Text>
                  <Pressable className="p-2">
                    <Share2 size={22} color="#fff" />
                  </Pressable>
                </View>

                {currentSong && (
                  <View className="flex-1 px-8">
                    {/* Album Art */}
                    <Animated.View style={[discStyle]} className="items-center justify-center my-8">
                      <View className="w-72 h-72 rounded-full overflow-hidden border-4 border-[#D4673A]/30">
                        <Image
                          source={{ uri: currentSong.coverImage }}
                          style={{ width: '100%', height: '100%' }}
                          contentFit="cover"
                        />
                        <View className="absolute inset-0 items-center justify-center">
                          <View className="w-16 h-16 rounded-full bg-[#0A0A0A] border-2 border-white/20" />
                        </View>
                      </View>
                    </Animated.View>

                    {/* Song Info */}
                    <View className="items-center mb-8">
                      <Text className="text-white text-2xl font-bold text-center" numberOfLines={1}>
                        {currentSong.title}
                      </Text>
                      <Text className="text-gray-400 text-lg mt-1">{currentSong.artist}</Text>
                      <View className="flex-row items-center mt-2">
                        <Globe size={14} color="#9CA3AF" />
                        <Text className="text-gray-500 text-sm ml-1">{currentSong.country}</Text>
                        <Text className="text-gray-600 mx-2">•</Text>
                        <Text className="text-gray-500 text-sm">{currentSong.genre}</Text>
                        <Text className="text-gray-600 mx-2">•</Text>
                        <Text className="text-gray-500 text-sm">{currentSong.year}</Text>
                      </View>
                    </View>

                    {/* Progress */}
                    <View className="mb-6">
                      <View className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <View
                          className="h-full bg-[#D4673A] rounded-full"
                          style={{ width: `${progress}%` }}
                        />
                      </View>
                      <View className="flex-row justify-between mt-2">
                        <Text className="text-gray-500 text-sm">
                          {Math.floor((progress / 100) * currentSong.durationSeconds / 60)}:
                          {String(Math.floor((progress / 100) * currentSong.durationSeconds % 60)).padStart(2, '0')}
                        </Text>
                        <Text className="text-gray-500 text-sm">{currentSong.duration}</Text>
                      </View>
                    </View>

                    {/* Controls */}
                    <View className="flex-row items-center justify-between px-4">
                      <Pressable className="p-3">
                        <Shuffle size={22} color="#6B7280" />
                      </Pressable>
                      <Pressable className="p-3">
                        <SkipBack size={28} color="#fff" fill="#fff" />
                      </Pressable>
                      <Pressable
                        onPress={togglePlay}
                        className="w-20 h-20 rounded-full bg-[#D4673A] items-center justify-center"
                      >
                        {isPlaying ? (
                          <Pause size={36} color="#fff" fill="#fff" />
                        ) : (
                          <Play size={36} color="#fff" fill="#fff" style={{ marginLeft: 4 }} />
                        )}
                      </Pressable>
                      <Pressable className="p-3">
                        <SkipForward size={28} color="#fff" fill="#fff" />
                      </Pressable>
                      <Pressable className="p-3">
                        <Repeat size={22} color="#6B7280" />
                      </Pressable>
                    </View>

                    {/* Extra Controls */}
                    <View className="flex-row items-center justify-center gap-8 mt-8">
                      <Pressable
                        onPress={() => toggleLike(currentSong.id)}
                        className="items-center"
                      >
                        <Heart
                          size={24}
                          color={likedSongs.has(currentSong.id) ? '#EF4444' : '#6B7280'}
                          fill={likedSongs.has(currentSong.id) ? '#EF4444' : 'transparent'}
                        />
                        <Text className="text-gray-500 text-xs mt-1">Like</Text>
                      </Pressable>
                      <Pressable className="items-center">
                        <Volume2 size={24} color="#6B7280" />
                        <Text className="text-gray-500 text-xs mt-1">Volume</Text>
                      </Pressable>
                      <Pressable className="items-center">
                        <ListMusic size={24} color="#6B7280" />
                        <Text className="text-gray-500 text-xs mt-1">Queue</Text>
                      </Pressable>
                    </View>

                    {/* Song Description */}
                    <View className="mt-8 p-4 bg-white/5 rounded-2xl">
                      <Text className="text-gray-400 text-sm leading-5">{currentSong.description}</Text>
                      <View className="flex-row items-center mt-3">
                        <Users size={14} color="#6B7280" />
                        <Text className="text-gray-500 text-xs ml-1">{formatPlays(currentSong.plays)} plays</Text>
                      </View>
                    </View>
                  </View>
                )}
              </LinearGradient>
            </SafeAreaView>
          </View>
        </Modal>
      </SafeAreaView>
    </View>
  );
}
