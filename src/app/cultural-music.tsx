import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, Modal, Dimensions, Share, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import {
  ArrowLeft, Search, Play, Pause, SkipBack, SkipForward, Heart, Share2,
  Music, Globe, Clock, Users, Shuffle, Repeat, Volume2, ChevronDown,
  ListMusic, Disc3, Mic2, X, Plus, Filter, Repeat1, VolumeX, Volume1,
  Radio, Wifi, WifiOff
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Animated, {
  FadeInDown, FadeIn, useSharedValue, useAnimatedStyle,
  withRepeat, withTiming, Easing, withSequence, runOnJS
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Audio, AVPlaybackStatus } from 'expo-av';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import {
  searchJioSaavn,
  searchDeezer,
  searchAllSources,
  getPlayableUrl,
  type StreamingSong,
} from '../lib/music-api';

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

// Sample audio URLs for demo (public domain / royalty-free)
const SAMPLE_AUDIO_URLS = [
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3',
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3',
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3',
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3',
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3',
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3',
];

// Helper function to get audio URL for a song
const getAudioUrl = (songId: string): string => {
  const index = (parseInt(songId, 10) - 1) % SAMPLE_AUDIO_URLS.length;
  return SAMPLE_AUDIO_URLS[index];
};

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
  'Taiko', 'Oud', 'Sufi', 'Hula', 'Didgeridoo', 'Pow Wow', 'Ghazal', 'Pakistani Folk',
  'Coke Studio', 'Pakistani Pop'
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
  // South Asia - Pakistan Classics
  {
    id: '31',
    title: 'Mustt Mustt',
    artist: 'Nusrat Fateh Ali Khan',
    album: 'Mustt Mustt',
    duration: '7:45',
    durationSeconds: 465,
    coverImage: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400',
    region: 'south-asia',
    country: 'Pakistan',
    genre: 'Qawwali',
    year: '1990',
    description: 'A groundbreaking fusion of qawwali and electronic music produced with Peter Gabriel.',
    plays: 2800000,
    isLiked: false,
  },
  {
    id: '32',
    title: 'Allah Hoo',
    artist: 'Nusrat Fateh Ali Khan',
    album: 'Supreme Collection',
    duration: '15:30',
    durationSeconds: 930,
    coverImage: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=400',
    region: 'south-asia',
    country: 'Pakistan',
    genre: 'Qawwali',
    year: '1988',
    description: 'A deeply spiritual qawwali invoking the divine name, showcasing the Shahenshah-e-Qawwali\'s mastery.',
    plays: 4500000,
    isLiked: true,
  },
  {
    id: '33',
    title: 'Tumhe Dillagi Bhool Jaani Padegi',
    artist: 'Nusrat Fateh Ali Khan',
    album: 'Traditional Sufi Qawwalis',
    duration: '12:45',
    durationSeconds: 765,
    coverImage: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=400',
    region: 'south-asia',
    country: 'Pakistan',
    genre: 'Qawwali',
    year: '1992',
    description: 'A romantic qawwali about unrequited love, later covered by many artists.',
    plays: 3800000,
    isLiked: true,
  },
  {
    id: '34',
    title: 'Afreen Afreen',
    artist: 'Nusrat Fateh Ali Khan',
    album: 'Sangam',
    duration: '9:20',
    durationSeconds: 560,
    coverImage: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=400',
    region: 'south-asia',
    country: 'Pakistan',
    genre: 'Qawwali',
    year: '1996',
    description: 'A beloved qawwali praising divine beauty, later famously covered on Coke Studio.',
    plays: 6200000,
    isLiked: true,
  },
  {
    id: '35',
    title: 'Tere Ishq Nachaya',
    artist: 'Abida Parveen',
    album: 'Raqs-e-Bismil',
    duration: '8:45',
    durationSeconds: 525,
    coverImage: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400',
    region: 'south-asia',
    country: 'Pakistan',
    genre: 'Sufi',
    year: '2000',
    description: 'The Queen of Sufi Music performing Bulleh Shah\'s timeless poetry about divine love.',
    plays: 3500000,
    isLiked: true,
  },
  {
    id: '36',
    title: 'Ghoom Charakhra',
    artist: 'Abida Parveen',
    album: 'Sufi Legacy',
    duration: '10:15',
    durationSeconds: 615,
    coverImage: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400',
    region: 'south-asia',
    country: 'Pakistan',
    genre: 'Sufi',
    year: '1995',
    description: 'A mesmerizing Sufi kalam about the spinning wheel of fate and divine connection.',
    plays: 2900000,
    isLiked: false,
  },
  {
    id: '37',
    title: 'Yaar Ko Humne',
    artist: 'Abida Parveen',
    album: 'Ishq',
    duration: '7:30',
    durationSeconds: 450,
    coverImage: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=400',
    region: 'south-asia',
    country: 'Pakistan',
    genre: 'Sufi',
    year: '2005',
    description: 'Abida Parveen\'s powerful rendition of classical Sufi poetry.',
    plays: 2100000,
    isLiked: false,
  },
  {
    id: '38',
    title: 'Ranjish Hi Sahi',
    artist: 'Mehdi Hassan',
    album: 'Ghazal Masterpieces',
    duration: '6:20',
    durationSeconds: 380,
    coverImage: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400',
    region: 'south-asia',
    country: 'Pakistan',
    genre: 'Ghazal',
    year: '1977',
    description: 'The King of Ghazal\'s most iconic performance of Ahmed Faraz\'s heartbreaking poetry.',
    plays: 5200000,
    isLiked: true,
  },
  {
    id: '39',
    title: 'Gulon Mein Rang Bhare',
    artist: 'Mehdi Hassan',
    album: 'Golden Collection',
    duration: '5:45',
    durationSeconds: 345,
    coverImage: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=400',
    region: 'south-asia',
    country: 'Pakistan',
    genre: 'Ghazal',
    year: '1972',
    description: 'A beautiful ghazal about spring and longing, Faiz Ahmed Faiz\'s poetry brought to life.',
    plays: 4100000,
    isLiked: true,
  },
  {
    id: '40',
    title: 'Zindagi Mein Tu Sabhi',
    artist: 'Mehdi Hassan',
    album: 'Live in Concert',
    duration: '7:10',
    durationSeconds: 430,
    coverImage: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=400',
    region: 'south-asia',
    country: 'Pakistan',
    genre: 'Ghazal',
    year: '1980',
    description: 'Mehdi Hassan\'s velvety voice in this classic ghazal about life\'s fleeting nature.',
    plays: 3300000,
    isLiked: false,
  },
  {
    id: '41',
    title: 'Dil Ki Lagi',
    artist: 'Ghulam Ali',
    album: 'Awaaz',
    duration: '6:55',
    durationSeconds: 415,
    coverImage: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=400',
    region: 'south-asia',
    country: 'Pakistan',
    genre: 'Ghazal',
    year: '1985',
    description: 'Ghulam Ali\'s signature ghazal showcasing his incredible range and emotion.',
    plays: 2700000,
    isLiked: false,
  },
  {
    id: '42',
    title: 'Chupke Chupke Raat Din',
    artist: 'Ghulam Ali',
    album: 'Suroor',
    duration: '5:30',
    durationSeconds: 330,
    coverImage: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400',
    region: 'south-asia',
    country: 'Pakistan',
    genre: 'Ghazal',
    year: '1988',
    description: 'A hauntingly beautiful ghazal about secret tears and hidden love.',
    plays: 3900000,
    isLiked: true,
  },
  {
    id: '43',
    title: 'Hayo Rabba Naiyo Lagda Dil',
    artist: 'Reshma',
    album: 'Ankhiyan Nu Rehn De',
    duration: '5:15',
    durationSeconds: 315,
    coverImage: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400',
    region: 'south-asia',
    country: 'Pakistan',
    genre: 'Pakistani Folk',
    year: '1982',
    description: 'The legendary folk singer Reshma\'s soulful Punjabi lament.',
    plays: 2400000,
    isLiked: false,
  },
  {
    id: '44',
    title: 'Lambi Judai',
    artist: 'Reshma',
    album: 'Hero (Soundtrack)',
    duration: '6:40',
    durationSeconds: 400,
    coverImage: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=400',
    region: 'south-asia',
    country: 'Pakistan',
    genre: 'Pakistani Folk',
    year: '1983',
    description: 'Reshma\'s most famous song about the pain of separation, immortalized in film.',
    plays: 5800000,
    isLiked: true,
  },
  {
    id: '45',
    title: 'Ankhiyan Nu Rehn De',
    artist: 'Reshma',
    album: 'Folk Treasures',
    duration: '5:50',
    durationSeconds: 350,
    coverImage: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400',
    region: 'south-asia',
    country: 'Pakistan',
    genre: 'Pakistani Folk',
    year: '1978',
    description: 'A Punjabi folk classic asking the eyes to rest from crying.',
    plays: 3100000,
    isLiked: true,
  },
  {
    id: '46',
    title: 'Tajdar-e-Haram',
    artist: 'Atif Aslam (Coke Studio)',
    album: 'Coke Studio Season 8',
    duration: '9:30',
    durationSeconds: 570,
    coverImage: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=400',
    region: 'south-asia',
    country: 'Pakistan',
    genre: 'Coke Studio',
    year: '2015',
    description: 'Atif Aslam\'s powerful rendition of the Sabri Brothers\' qawwali on Coke Studio.',
    plays: 8500000,
    isLiked: true,
  },
  {
    id: '47',
    title: 'Afreen Afreen',
    artist: 'Rahat Fateh Ali Khan & Momina Mustehsan',
    album: 'Coke Studio Season 9',
    duration: '5:45',
    durationSeconds: 345,
    coverImage: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=400',
    region: 'south-asia',
    country: 'Pakistan',
    genre: 'Coke Studio',
    year: '2016',
    description: 'The viral Coke Studio cover that introduced Pakistani music to a new generation.',
    plays: 12000000,
    isLiked: true,
  },
  {
    id: '48',
    title: 'Pasoori',
    artist: 'Ali Sethi & Shae Gill',
    album: 'Coke Studio Season 14',
    duration: '4:15',
    durationSeconds: 255,
    coverImage: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400',
    region: 'south-asia',
    country: 'Pakistan',
    genre: 'Coke Studio',
    year: '2022',
    description: 'The global phenomenon that became one of the most-streamed songs from South Asia.',
    plays: 25000000,
    isLiked: true,
  },
  {
    id: '49',
    title: 'Kun Faya Kun',
    artist: 'A.R. Rahman, Javed Ali & Mohit Chauhan',
    album: 'Rockstar (Soundtrack)',
    duration: '7:52',
    durationSeconds: 472,
    coverImage: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400',
    region: 'south-asia',
    country: 'India',
    genre: 'Sufi',
    year: '2011',
    description: 'A transcendent Sufi composition about divine creation and surrender.',
    plays: 15000000,
    isLiked: true,
  },
  {
    id: '50',
    title: 'Jai Ho',
    artist: 'A.R. Rahman',
    album: 'Slumdog Millionaire',
    duration: '5:19',
    durationSeconds: 319,
    coverImage: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=400',
    region: 'south-asia',
    country: 'India',
    genre: 'Bollywood',
    year: '2008',
    description: 'Oscar-winning song celebrating victory and joy.',
    plays: 9500000,
    isLiked: true,
  },
  {
    id: '51',
    title: 'Kangna',
    artist: 'Dr. Zeus ft. Shortie',
    album: 'Kangna',
    duration: '4:05',
    durationSeconds: 245,
    coverImage: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=400',
    region: 'south-asia',
    country: 'Pakistan',
    genre: 'Bhangra',
    year: '2002',
    description: 'A Bhangra classic that crossed borders and defined the UK Asian music scene.',
    plays: 4200000,
    isLiked: false,
  },
  {
    id: '52',
    title: 'Dil Dil Pakistan',
    artist: 'Vital Signs',
    album: 'Vital Signs 1',
    duration: '4:55',
    durationSeconds: 295,
    coverImage: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400',
    region: 'south-asia',
    country: 'Pakistan',
    genre: 'Pakistani Pop',
    year: '1987',
    description: 'The patriotic anthem that launched Pakistani pop music and still unites the nation.',
    plays: 7500000,
    isLiked: true,
  },
  {
    id: '53',
    title: 'Sayonee',
    artist: 'Junoon',
    album: 'Azadi',
    duration: '8:30',
    durationSeconds: 510,
    coverImage: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=400',
    region: 'south-asia',
    country: 'Pakistan',
    genre: 'Sufi Rock',
    year: '1997',
    description: 'Junoon\'s magnum opus, blending Sufi poetry with rock - a South Asian anthem.',
    plays: 6800000,
    isLiked: true,
  },
  {
    id: '54',
    title: 'Bulleya',
    artist: 'Junoon',
    album: 'Inquilaab',
    duration: '7:15',
    durationSeconds: 435,
    coverImage: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=400',
    region: 'south-asia',
    country: 'Pakistan',
    genre: 'Sufi Rock',
    year: '1996',
    description: 'A rock interpretation of Bulleh Shah\'s poetry questioning identity and existence.',
    plays: 4500000,
    isLiked: false,
  },
  {
    id: '55',
    title: 'Tera Woh Pyar (Nawazishein Karam)',
    artist: 'Momina Mustehsan & Asim Azhar',
    album: 'Coke Studio Season 10',
    duration: '6:10',
    durationSeconds: 370,
    coverImage: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400',
    region: 'south-asia',
    country: 'Pakistan',
    genre: 'Coke Studio',
    year: '2017',
    description: 'A modern romantic ballad that captured hearts across South Asia.',
    plays: 3800000,
    isLiked: false,
  },
  // Middle East
  {
    id: '56',
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
    id: '57',
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
    name: 'Pakistani Legends',
    description: 'Qawwali, Ghazal, and Sufi masters from Pakistan',
    coverImage: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=400',
    songCount: 25,
    region: 'south-asia',
    gradient: ['#115E59', '#14B8A6'],
  },
  {
    id: '3',
    name: 'Coke Studio Hits',
    description: 'Best of Pakistani Coke Studio performances',
    coverImage: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=400',
    songCount: 15,
    region: 'south-asia',
    gradient: ['#DC2626', '#F97316'],
  },
  {
    id: '4',
    name: 'African Classics',
    description: 'Timeless hits from across the African continent',
    coverImage: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400',
    songCount: 45,
    region: 'west-africa',
    gradient: ['#D4673A', '#C9A227'],
  },
  {
    id: '5',
    name: 'Caribbean Vibes',
    description: 'Reggae, soca, and calypso favorites',
    coverImage: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=400',
    songCount: 38,
    region: 'caribbean',
    gradient: ['#1B4D3E', '#22C55E'],
  },
  {
    id: '6',
    name: 'Sounds of India',
    description: 'Classical, Bollywood, and folk treasures',
    coverImage: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=400',
    songCount: 52,
    region: 'south-asia',
    gradient: ['#F59E0B', '#EF4444'],
  },
  {
    id: '7',
    name: 'Latin Rhythms',
    description: 'Salsa, bossa nova, and cumbia essentials',
    coverImage: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400',
    songCount: 41,
    region: 'latin-america',
    gradient: ['#EC4899', '#8B5CF6'],
  },
  {
    id: '8',
    name: 'Middle Eastern Melodies',
    description: 'Oud, qawwali, and Arabic classics',
    coverImage: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=400',
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
  const [currentStreamingSong, setCurrentStreamingSong] = useState<StreamingSong | null>(null);
  const [currentSongIndex, setCurrentSongIndex] = useState<number>(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showPlayer, setShowPlayer] = useState(false);
  const [showFullPlayer, setShowFullPlayer] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [likedSongs, setLikedSongs] = useState<Set<string>>(new Set(['1', '3', '5', '7', '9', '11', '12', '14', '15']));
  const [showFilters, setShowFilters] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Streaming mode state
  const [streamingMode, setStreamingMode] = useState(false);
  const [streamingSongs, setStreamingSongs] = useState<StreamingSong[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Audio player controls state
  const [volume, setVolume] = useState(1.0);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [isShuffleOn, setIsShuffleOn] = useState(false);
  const [repeatMode, setRepeatMode] = useState<'off' | 'all' | 'one'>('off');
  const [shuffledIndices, setShuffledIndices] = useState<number[]>([]);
  const [showQueue, setShowQueue] = useState(false);

  // Audio ref
  const soundRef = useRef<Audio.Sound | null>(null);
  const playbackStatusRef = useRef<AVPlaybackStatus | null>(null);

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

  // Setup audio mode on mount
  useEffect(() => {
    const setupAudio = async () => {
      try {
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
          shouldDuckAndroid: true,
        });
      } catch (error) {
        console.log('Error setting audio mode:', error);
      }
    };
    setupAudio();

    // Cleanup on unmount
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, []);

  // Search streaming services when query changes
  const searchStreamingServices = useCallback(async (query: string) => {
    if (!query.trim()) {
      setStreamingSongs([]);
      setStreamingMode(false);
      return;
    }

    setIsSearching(true);
    setSearchError(null);
    setStreamingMode(true);

    try {
      const results = await searchAllSources(query, selectedRegion);
      setStreamingSongs(results);
      if (results.length === 0) {
        setSearchError('No streaming results found. Showing offline library.');
      }
    } catch (error) {
      console.log('Streaming search error:', error);
      setSearchError('Could not connect to streaming services.');
      setStreamingSongs([]);
    } finally {
      setIsSearching(false);
    }
  }, [selectedRegion]);

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.length >= 2) {
        searchStreamingServices(searchQuery);
      } else {
        setStreamingSongs([]);
        setStreamingMode(false);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, searchStreamingServices]);

  // Generate shuffled indices when shuffle is turned on
  useEffect(() => {
    if (isShuffleOn && filteredSongs.length > 0) {
      const indices = Array.from({ length: filteredSongs.length }, (_, i) => i);
      // Fisher-Yates shuffle
      for (let i = indices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [indices[i], indices[j]] = [indices[j], indices[i]];
      }
      setShuffledIndices(indices);
    }
  }, [isShuffleOn, filteredSongs.length]);

  // Playback status update handler
  const onPlaybackStatusUpdate = useCallback((status: AVPlaybackStatus) => {
    playbackStatusRef.current = status;
    if (status.isLoaded) {
      setCurrentTime(status.positionMillis / 1000);
      setDuration(status.durationMillis ? status.durationMillis / 1000 : 0);
      setProgress(status.durationMillis ? (status.positionMillis / status.durationMillis) * 100 : 0);
      setIsPlaying(status.isPlaying);
      setIsLoading(status.isBuffering);

      // Handle song end
      if (status.didJustFinish && !status.isLooping) {
        handleSongEnd();
      }
    }
  }, []);

  const handleSongEnd = useCallback(() => {
    if (repeatMode === 'one') {
      // Replay current song
      soundRef.current?.setPositionAsync(0);
      soundRef.current?.playAsync();
    } else {
      // Play next song
      playNext();
    }
  }, [repeatMode]);

  const loadAndPlaySong = async (song: Song, index: number) => {
    try {
      setIsLoading(true);

      // Unload previous sound
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }

      const audioUrl = getAudioUrl(song.id);
      console.log('Loading audio:', audioUrl);

      const { sound } = await Audio.Sound.createAsync(
        { uri: audioUrl },
        {
          shouldPlay: true,
          volume: volume,
          isLooping: repeatMode === 'one',
        },
        onPlaybackStatusUpdate
      );

      soundRef.current = sound;
      setCurrentSong(song);
      setCurrentSongIndex(index);
      setShowPlayer(true);
      setProgress(0);
      setCurrentTime(0);
      setIsPlaying(true);

    } catch (error) {
      console.log('Error loading audio:', error);
      setIsLoading(false);
    }
  };

  // Load and play streaming song
  const loadAndPlayStreamingSong = async (song: StreamingSong, index: number) => {
    try {
      setIsLoading(true);

      // Unload previous sound
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }

      const audioUrl = getPlayableUrl(song);
      if (!audioUrl) {
        console.log('No playable URL for song:', song.title);
        setIsLoading(false);
        setSearchError('This song is not available for streaming.');
        return;
      }

      console.log('Loading streaming audio:', audioUrl);

      const { sound } = await Audio.Sound.createAsync(
        { uri: audioUrl },
        {
          shouldPlay: true,
          volume: volume,
          isLooping: repeatMode === 'one',
        },
        onPlaybackStatusUpdate
      );

      soundRef.current = sound;
      setCurrentStreamingSong(song);
      setCurrentSong(null); // Clear local song
      setCurrentSongIndex(index);
      setShowPlayer(true);
      setProgress(0);
      setCurrentTime(0);
      setIsPlaying(true);

    } catch (error) {
      console.log('Error loading streaming audio:', error);
      setIsLoading(false);
      setSearchError('Could not play this song. Try another.');
    }
  };

  const playStreamingSong = (song: StreamingSong) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const index = streamingSongs.findIndex(s => s.id === song.id);
    loadAndPlayStreamingSong(song, index);
  };

  const playSong = (song: Song) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const index = filteredSongs.findIndex(s => s.id === song.id);
    loadAndPlaySong(song, index);
  };

  const togglePlay = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (soundRef.current) {
      if (isPlaying) {
        await soundRef.current.pauseAsync();
      } else {
        await soundRef.current.playAsync();
      }
    }
  };

  const playNext = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (filteredSongs.length === 0) return;

    let nextIndex: number;
    if (isShuffleOn && shuffledIndices.length > 0) {
      const currentShufflePos = shuffledIndices.indexOf(currentSongIndex);
      const nextShufflePos = (currentShufflePos + 1) % shuffledIndices.length;
      nextIndex = shuffledIndices[nextShufflePos];
    } else {
      nextIndex = (currentSongIndex + 1) % filteredSongs.length;
    }

    // If repeat is off and we've reached the end, stop
    if (repeatMode === 'off' && nextIndex === 0 && currentSongIndex === filteredSongs.length - 1) {
      await soundRef.current?.pauseAsync();
      return;
    }

    loadAndPlaySong(filteredSongs[nextIndex], nextIndex);
  }, [currentSongIndex, filteredSongs, isShuffleOn, shuffledIndices, repeatMode]);

  const playPrevious = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (filteredSongs.length === 0) return;

    // If more than 3 seconds into song, restart current song
    if (currentTime > 3) {
      await soundRef.current?.setPositionAsync(0);
      return;
    }

    let prevIndex: number;
    if (isShuffleOn && shuffledIndices.length > 0) {
      const currentShufflePos = shuffledIndices.indexOf(currentSongIndex);
      const prevShufflePos = currentShufflePos === 0 ? shuffledIndices.length - 1 : currentShufflePos - 1;
      prevIndex = shuffledIndices[prevShufflePos];
    } else {
      prevIndex = currentSongIndex === 0 ? filteredSongs.length - 1 : currentSongIndex - 1;
    }

    loadAndPlaySong(filteredSongs[prevIndex], prevIndex);
  }, [currentSongIndex, currentTime, filteredSongs, isShuffleOn, shuffledIndices]);

  const seekTo = async (position: number) => {
    if (soundRef.current && duration > 0) {
      const seekPosition = (position / 100) * duration * 1000;
      await soundRef.current.setPositionAsync(seekPosition);
    }
  };

  const changeVolume = async (newVolume: number) => {
    setVolume(newVolume);
    if (soundRef.current) {
      await soundRef.current.setVolumeAsync(newVolume);
    }
  };

  const toggleShuffle = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsShuffleOn(!isShuffleOn);
  };

  const toggleRepeat = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const modes: ('off' | 'all' | 'one')[] = ['off', 'all', 'one'];
    const currentIndex = modes.indexOf(repeatMode);
    const nextMode = modes[(currentIndex + 1) % modes.length];
    setRepeatMode(nextMode);

    if (soundRef.current) {
      soundRef.current.setIsLoopingAsync(nextMode === 'one');
    }
  };

  const handleShare = async () => {
    if (!currentSong) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await Share.share({
        message: `Check out "${currentSong.title}" by ${currentSong.artist} - ${currentSong.description}`,
      });
    } catch (error) {
      console.log('Error sharing:', error);
    }
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

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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

  const getVolumeIcon = () => {
    if (volume === 0) return VolumeX;
    if (volume < 0.5) return Volume1;
    return Volume2;
  };

  const VolumeIcon = getVolumeIcon();

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
            {/* Streaming Mode Indicator */}
            {streamingMode && (
              <Animated.View entering={FadeInDown.duration(200)} className="mb-4">
                <View className="flex-row items-center bg-green-900/30 rounded-2xl px-4 py-3 border border-green-500/30">
                  <Radio size={18} color="#22C55E" />
                  <Text className="text-green-400 font-medium ml-2 flex-1">
                    Streaming from JioSaavn & Deezer
                  </Text>
                  {isSearching && (
                    <ActivityIndicator size="small" color="#22C55E" />
                  )}
                </View>
              </Animated.View>
            )}

            {/* Search Error */}
            {searchError && !isSearching && (
              <View className="mb-4 bg-amber-900/30 rounded-2xl px-4 py-3 border border-amber-500/30">
                <Text className="text-amber-400 text-sm">{searchError}</Text>
              </View>
            )}

            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-white text-lg font-bold">
                {streamingMode ? 'Streaming Results' : searchQuery ? 'Search Results' : selectedRegion === 'all' ? 'All Songs' : `${REGIONS.find(r => r.key === selectedRegion)?.label} Music`}
              </Text>
              <Text className="text-gray-500 text-sm">
                {streamingMode ? streamingSongs.length : filteredSongs.length} songs
              </Text>
            </View>

            {/* Streaming Songs */}
            {streamingMode && streamingSongs.length > 0 && streamingSongs.map((song, index) => (
              <Animated.View
                key={song.id}
                entering={FadeInDown.delay(index * 50).springify()}
              >
                <Pressable
                  onPress={() => playStreamingSong(song)}
                  className={`flex-row items-center p-3 rounded-2xl mb-2 ${
                    currentStreamingSong?.id === song.id ? 'bg-[#D4673A]/20 border border-[#D4673A]/50' : 'bg-white/5'
                  }`}
                >
                  {/* Album Art */}
                  <View className="relative">
                    <Image
                      source={{ uri: song.coverImage }}
                      style={{ width: 56, height: 56, borderRadius: 12 }}
                      contentFit="cover"
                    />
                    {currentStreamingSong?.id === song.id && isPlaying && (
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
                    {/* Streaming badge */}
                    <View className="absolute -top-1 -right-1 bg-green-500 rounded-full p-1">
                      <Wifi size={10} color="#fff" />
                    </View>
                  </View>

                  {/* Song Info */}
                  <View className="flex-1 ml-3">
                    <Text className={`font-semibold ${currentStreamingSong?.id === song.id ? 'text-[#D4673A]' : 'text-white'}`} numberOfLines={1}>
                      {song.title}
                    </Text>
                    <Text className="text-gray-400 text-sm" numberOfLines={1}>{song.artist}</Text>
                    <View className="flex-row items-center mt-1">
                      <Text className="text-gray-500 text-xs">{song.country}</Text>
                      <Text className="text-gray-600 mx-1">•</Text>
                      <Text className="text-gray-500 text-xs">{song.genre}</Text>
                      {song.year && (
                        <>
                          <Text className="text-gray-600 mx-1">•</Text>
                          <Text className="text-gray-500 text-xs">{song.year}</Text>
                        </>
                      )}
                    </View>
                  </View>

                  {/* Actions */}
                  <View className="flex-row items-center gap-2">
                    <Text className="text-gray-500 text-xs">{song.durationFormatted}</Text>
                    {song.previewUrl && !song.streamUrl && (
                      <View className="bg-amber-500/20 px-2 py-0.5 rounded">
                        <Text className="text-amber-400 text-xs">30s</Text>
                      </View>
                    )}
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

            {/* Local/Offline Songs */}
            {!streamingMode && filteredSongs.map((song, index) => (
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

            {/* No songs message */}
            {!streamingMode && filteredSongs.length === 0 && (
              <View className="items-center py-12">
                <Music size={48} color="#374151" />
                <Text className="text-gray-500 text-lg mt-4">No songs found</Text>
                <Text className="text-gray-600 text-sm mt-1">Try adjusting your search or filters</Text>
              </View>
            )}

            {/* Loading spinner for streaming search */}
            {isSearching && (
              <View className="items-center py-12">
                <ActivityIndicator size="large" color="#D4673A" />
                <Text className="text-gray-400 mt-4">Searching streaming services...</Text>
              </View>
            )}

            {/* No streaming results */}
            {streamingMode && !isSearching && streamingSongs.length === 0 && (
              <View className="items-center py-12">
                <WifiOff size={48} color="#374151" />
                <Text className="text-gray-500 text-lg mt-4">No streaming results</Text>
                <Text className="text-gray-600 text-sm mt-1 text-center px-8">
                  Try searching for artists like "Atif Aslam", "Bob Marley", or "Afrobeat"
                </Text>
              </View>
            )}
          </View>

          <View className={showPlayer ? "h-40" : "h-32"} />
        </ScrollView>

        {/* Mini Player - works with both local and streaming songs */}
        {showPlayer && (currentSong || currentStreamingSong) && !showFullPlayer && (
          <Animated.View
            entering={FadeInDown.springify()}
            className="absolute left-0 right-0"
            style={{ bottom: 34 }}
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
                  <View className="relative">
                    <Image
                      source={{ uri: currentStreamingSong?.coverImage || currentSong?.coverImage }}
                      style={{ width: 48, height: 48, borderRadius: 8 }}
                      contentFit="cover"
                    />
                    {currentStreamingSong && (
                      <View className="absolute -top-1 -right-1 bg-green-500 rounded-full p-0.5">
                        <Wifi size={8} color="#fff" />
                      </View>
                    )}
                  </View>
                  <View className="flex-1 mx-3">
                    <Text className="text-white font-semibold" numberOfLines={1}>
                      {currentStreamingSong?.title || currentSong?.title}
                    </Text>
                    <Text className="text-gray-400 text-sm" numberOfLines={1}>
                      {currentStreamingSong?.artist || currentSong?.artist}
                    </Text>
                  </View>
                  <Pressable
                    onPress={(e) => {
                      e.stopPropagation();
                      playPrevious();
                    }}
                    className="p-2"
                  >
                    <SkipBack size={20} color="#fff" fill="#fff" />
                  </Pressable>
                  <Pressable
                    onPress={(e) => {
                      e.stopPropagation();
                      togglePlay();
                    }}
                    className="w-12 h-12 rounded-full bg-[#D4673A] items-center justify-center mx-1"
                  >
                    {isLoading ? (
                      <View className="w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                    ) : isPlaying ? (
                      <Pause size={24} color="#fff" fill="#fff" />
                    ) : (
                      <Play size={24} color="#fff" fill="#fff" />
                    )}
                  </Pressable>
                  <Pressable
                    onPress={(e) => {
                      e.stopPropagation();
                      playNext();
                    }}
                    className="p-2"
                  >
                    <SkipForward size={20} color="#fff" fill="#fff" />
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
                  <View className="items-center">
                    <View className="flex-row items-center">
                      <Text className="text-white text-sm font-medium">Now Playing</Text>
                      {currentStreamingSong && (
                        <View className="ml-2 bg-green-500/20 px-2 py-0.5 rounded-full flex-row items-center">
                          <Wifi size={10} color="#22C55E" />
                          <Text className="text-green-400 text-xs ml-1">Streaming</Text>
                        </View>
                      )}
                    </View>
                    {isLoading && (
                      <Text className="text-gray-500 text-xs">Loading...</Text>
                    )}
                  </View>
                  <Pressable onPress={handleShare} className="p-2">
                    <Share2 size={22} color="#fff" />
                  </Pressable>
                </View>

                {(currentSong || currentStreamingSong) && (
                  <View className="flex-1 px-8">
                    {/* Album Art */}
                    <Animated.View style={[discStyle]} className="items-center justify-center my-8">
                      <View className="w-72 h-72 rounded-full overflow-hidden border-4 border-[#D4673A]/30">
                        <Image
                          source={{ uri: currentStreamingSong?.coverImage || currentSong?.coverImage }}
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
                        {currentStreamingSong?.title || currentSong?.title}
                      </Text>
                      <Text className="text-gray-400 text-lg mt-1">
                        {currentStreamingSong?.artist || currentSong?.artist}
                      </Text>
                      <View className="flex-row items-center mt-2">
                        <Globe size={14} color="#9CA3AF" />
                        <Text className="text-gray-500 text-sm ml-1">
                          {currentStreamingSong?.country || currentSong?.country}
                        </Text>
                        <Text className="text-gray-600 mx-2">•</Text>
                        <Text className="text-gray-500 text-sm">
                          {currentStreamingSong?.genre || currentSong?.genre}
                        </Text>
                        {(currentStreamingSong?.year || currentSong?.year) && (
                          <>
                            <Text className="text-gray-600 mx-2">•</Text>
                            <Text className="text-gray-500 text-sm">
                              {currentStreamingSong?.year || currentSong?.year}
                            </Text>
                          </>
                        )}
                      </View>
                      {/* Preview warning */}
                      {currentStreamingSong && currentStreamingSong.previewUrl && !currentStreamingSong.streamUrl && (
                        <View className="mt-3 bg-amber-500/20 px-3 py-1 rounded-full">
                          <Text className="text-amber-400 text-xs">30-second preview</Text>
                        </View>
                      )}
                    </View>

                    {/* Progress - Seekable */}
                    <View className="mb-6">
                      <Pressable
                        onPress={(e) => {
                          const { locationX } = e.nativeEvent;
                          const progressBarWidth = SCREEN_WIDTH - 64; // Account for padding
                          const seekPercent = (locationX / progressBarWidth) * 100;
                          seekTo(Math.max(0, Math.min(100, seekPercent)));
                        }}
                        className="py-2"
                      >
                        <View className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <View
                            className="h-full bg-[#D4673A] rounded-full"
                            style={{ width: `${progress}%` }}
                          />
                        </View>
                      </Pressable>
                      <View className="flex-row justify-between mt-1">
                        <Text className="text-gray-500 text-sm">
                          {formatTime(currentTime)}
                        </Text>
                        <Text className="text-gray-500 text-sm">
                          {duration > 0 ? formatTime(duration) : (currentStreamingSong?.durationFormatted || currentSong?.duration)}
                        </Text>
                      </View>
                    </View>

                    {/* Controls */}
                    <View className="flex-row items-center justify-between px-4">
                      <Pressable onPress={toggleShuffle} className="p-3">
                        <Shuffle size={22} color={isShuffleOn ? '#D4673A' : '#6B7280'} />
                      </Pressable>
                      <Pressable onPress={playPrevious} className="p-3">
                        <SkipBack size={28} color="#fff" fill="#fff" />
                      </Pressable>
                      <Pressable
                        onPress={togglePlay}
                        className="w-20 h-20 rounded-full bg-[#D4673A] items-center justify-center"
                      >
                        {isLoading ? (
                          <View className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : isPlaying ? (
                          <Pause size={36} color="#fff" fill="#fff" />
                        ) : (
                          <Play size={36} color="#fff" fill="#fff" style={{ marginLeft: 4 }} />
                        )}
                      </Pressable>
                      <Pressable onPress={playNext} className="p-3">
                        <SkipForward size={28} color="#fff" fill="#fff" />
                      </Pressable>
                      <Pressable onPress={toggleRepeat} className="p-3">
                        {repeatMode === 'one' ? (
                          <Repeat1 size={22} color="#D4673A" />
                        ) : (
                          <Repeat size={22} color={repeatMode === 'all' ? '#D4673A' : '#6B7280'} />
                        )}
                      </Pressable>
                    </View>

                    {/* Volume Control */}
                    {showVolumeSlider && (
                      <Animated.View entering={FadeInDown.duration(200)} className="mt-6 px-4">
                        <View className="flex-row items-center gap-3">
                          <VolumeX size={18} color="#6B7280" />
                          <View className="flex-1 h-10 justify-center">
                            <Pressable
                              onPress={(e) => {
                                const { locationX } = e.nativeEvent;
                                const sliderWidth = SCREEN_WIDTH - 120;
                                const newVolume = Math.max(0, Math.min(1, locationX / sliderWidth));
                                changeVolume(newVolume);
                              }}
                              className="py-3"
                            >
                              <View className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                                <View
                                  className="h-full bg-[#D4673A] rounded-full"
                                  style={{ width: `${volume * 100}%` }}
                                />
                              </View>
                            </Pressable>
                          </View>
                          <Volume2 size={18} color="#6B7280" />
                        </View>
                      </Animated.View>
                    )}

                    {/* Extra Controls */}
                    <View className="flex-row items-center justify-center gap-8 mt-8">
                      <Pressable
                        onPress={() => toggleLike(currentStreamingSong?.id || currentSong?.id || '')}
                        className="items-center"
                      >
                        <Heart
                          size={24}
                          color={likedSongs.has(currentStreamingSong?.id || currentSong?.id || '') ? '#EF4444' : '#6B7280'}
                          fill={likedSongs.has(currentStreamingSong?.id || currentSong?.id || '') ? '#EF4444' : 'transparent'}
                        />
                        <Text className="text-gray-500 text-xs mt-1">Like</Text>
                      </Pressable>
                      <Pressable
                        onPress={() => setShowVolumeSlider(!showVolumeSlider)}
                        className="items-center"
                      >
                        <VolumeIcon size={24} color={showVolumeSlider ? '#D4673A' : '#6B7280'} />
                        <Text className="text-gray-500 text-xs mt-1">Volume</Text>
                      </Pressable>
                      <Pressable
                        onPress={handleShare}
                        className="items-center"
                      >
                        <Share2 size={24} color="#6B7280" />
                        <Text className="text-gray-500 text-xs mt-1">Share</Text>
                      </Pressable>
                    </View>

                    {/* Song Description - only for local songs */}
                    {currentSong && currentSong.description && (
                      <View className="mt-8 p-4 bg-white/5 rounded-2xl">
                        <Text className="text-gray-400 text-sm leading-5">{currentSong.description}</Text>
                        <View className="flex-row items-center mt-3">
                          <Users size={14} color="#6B7280" />
                          <Text className="text-gray-500 text-xs ml-1">{formatPlays(currentSong.plays)} plays</Text>
                        </View>
                      </View>
                    )}

                    {/* Source info for streaming songs */}
                    {currentStreamingSong && (
                      <View className="mt-8 p-4 bg-white/5 rounded-2xl">
                        <View className="flex-row items-center">
                          <Wifi size={14} color="#22C55E" />
                          <Text className="text-gray-400 text-sm ml-2">
                            Streaming from {currentStreamingSong.source === 'jiosaavn' ? 'JioSaavn' :
                              currentStreamingSong.source === 'deezer' ? 'Deezer' : 'Online'}
                          </Text>
                        </View>
                      </View>
                    )}
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
