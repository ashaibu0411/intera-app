import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, ActivityIndicator, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import {
  Search, X, ArrowLeft, Hash, ShoppingBag, Store, GraduationCap, Church, Users,
  Heart, Briefcase, Mic, Gift, Landmark, Globe, Shield, Users2, Trophy,
  Calendar, DollarSign, Scale, UtensilsCrossed, Camera, MessageCircle,
  Swords, BarChart3, Music2, Radio, Gamepad2, HandCoins, CalendarDays,
  Repeat, Car, Dog, Clock, Home, SearchX, Award, BookOpen, Dumbbell,
  Brain, Phone, Languages, Leaf, Sparkles, ShoppingCart, Shirt, TrendingUp, Bot,
  MapPin, Wallet, CreditCard, HelpCircle, Settings, Bell, User, Star, ChevronRight,
  UserPlus, CheckCircle, BadgeCheck,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useStore } from '@/lib/store';
import { supabase, DbUser } from '@/lib/supabase';
import { PhotoTile } from '@/components/PhotoTile';

type SearchTab = 'features' | 'people' | 'content';
type PeopleFilter = 'all' | 'local' | 'global';

interface ContentSearchResult {
  type: 'post' | 'event' | 'faith_event' | 'listing' | 'business';
  id: string;
  title: string;
  subtitle?: string;
  image?: string;
  route: string;
}

interface AppFeature {
  id: string;
  name: string;
  description: string;
  route: string;
  icon: React.ReactNode;
  category: string;
  keywords: string[];
  gradient: [string, string];
}

interface SearchablePerson {
  id: string;
  name: string;
  username: string;
  avatar: string;
  bio: string;
  location: string;
  country: string;
  interests: string[];
  isVerified?: boolean;
  isLocal?: boolean;
  mutualConnections?: number;
}

const ICON_SIZE = 22;
const ICON_COLOR = '#fff';

const APP_FEATURES: AppFeature[] = [
  // Main Features
  {
    id: 'community-assistant',
    name: 'Community Assistant',
    description: 'Ask local questions, get community-backed answers',
    route: '/community-assistant',
    icon: <Bot size={ICON_SIZE} color={ICON_COLOR} />,
    category: 'Community',
    keywords: ['ai', 'assistant', 'ask', 'help', 'community', 'local', 'recommendations', 'neighbors'],
    gradient: ['#10B981', '#059669'],
  },
  {
    id: 'marketplace',
    name: 'Marketplace',
    description: 'Buy and sell products in your community',
    route: '/marketplace',
    icon: <ShoppingBag size={ICON_SIZE} color={ICON_COLOR} />,
    category: 'Shopping',
    keywords: ['buy', 'sell', 'shop', 'products', 'items', 'market', 'store'],
    gradient: ['#D4673A', '#C9A227'],
  },
  {
    id: 'businesses',
    name: 'Business Directory',
    description: 'Find local businesses and services',
    route: '/business-directory',
    icon: <Store size={ICON_SIZE} color={ICON_COLOR} />,
    category: 'Services',
    keywords: ['business', 'services', 'directory', 'local', 'shops', 'stores', 'barber', 'salon', 'restaurant'],
    gradient: ['#1B4D3E', '#22C55E'],
  },
  {
    id: 'student-hub',
    name: 'Student Hub',
    description: 'Scholarships, study groups, and internships',
    route: '/student-hub',
    icon: <GraduationCap size={ICON_SIZE} color={ICON_COLOR} />,
    category: 'Education',
    keywords: ['student', 'school', 'university', 'college', 'scholarship', 'study', 'internship', 'education', 'learn'],
    gradient: ['#3B82F6', '#8B5CF6'],
  },
  {
    id: 'faith',
    name: 'Faith & Community',
    description: 'Religious services and faith events',
    route: '/faith-community',
    icon: <Church size={ICON_SIZE} color={ICON_COLOR} />,
    category: 'Community',
    keywords: ['faith', 'church', 'mosque', 'temple', 'religion', 'spiritual', 'worship', 'prayer', 'service'],
    gradient: ['#F59E0B', '#EF4444'],
  },
  {
    id: 'connect',
    name: 'Connect',
    description: 'Meet people in your neighborhood',
    route: '/connect',
    icon: <Users size={ICON_SIZE} color={ICON_COLOR} />,
    category: 'Social',
    keywords: ['connect', 'meet', 'people', 'friends', 'dating', 'networking', 'neighbors'],
    gradient: ['#EC4899', '#F43F5E'],
  },
  {
    id: 'events',
    name: 'Events',
    description: 'Discover local and global events',
    route: '/events',
    icon: <Calendar size={ICON_SIZE} color={ICON_COLOR} />,
    category: 'Events',
    keywords: ['events', 'party', 'gathering', 'meetup', 'concert', 'festival', 'celebration'],
    gradient: ['#06B6D4', '#3B82F6'],
  },

  // Community Features
  {
    id: 'trust-score',
    name: 'Ubuntu Trust Score',
    description: 'Community reputation and verification',
    route: '/trust-score',
    icon: <Award size={ICON_SIZE} color={ICON_COLOR} />,
    category: 'Community',
    keywords: ['trust', 'reputation', 'verify', 'badge', 'ubuntu', 'score'],
    gradient: ['#C9A227', '#D4673A'],
  },
  {
    id: 'village-council',
    name: 'Village Council',
    description: 'Community polls and governance',
    route: '/village-council',
    icon: <Landmark size={ICON_SIZE} color={ICON_COLOR} />,
    category: 'Community',
    keywords: ['village', 'council', 'vote', 'poll', 'community', 'governance', 'decision'],
    gradient: ['#8B5CF6', '#6366F1'],
  },
  {
    id: 'susu-circles',
    name: 'Susu Savings Circles',
    description: 'Traditional rotating savings groups',
    route: '/susu-circles',
    icon: <HandCoins size={ICON_SIZE} color={ICON_COLOR} />,
    category: 'Finance',
    keywords: ['susu', 'savings', 'money', 'circle', 'tanda', 'rotating', 'contribution'],
    gradient: ['#10B981', '#059669'],
  },
  {
    id: 'job-board',
    name: 'Job Board',
    description: 'Find jobs and hire skilled workers',
    route: '/job-board',
    icon: <Briefcase size={ICON_SIZE} color={ICON_COLOR} />,
    category: 'Employment',
    keywords: ['job', 'work', 'career', 'hire', 'employment', 'skills', 'gig'],
    gradient: ['#0EA5E9', '#0284C7'],
  },
  {
    id: 'creator-battles',
    name: 'Creator Battles',
    description: 'Head-to-head gift competitions',
    route: '/creator-battles',
    icon: <Swords size={ICON_SIZE} color={ICON_COLOR} />,
    category: 'Entertainment',
    keywords: ['battle', 'creator', 'compete', 'gifts', 'live', 'versus', '1v1'],
    gradient: ['#DC2626', '#F97316'],
  },

  // Heritage & Culture
  {
    id: 'heritage-hub',
    name: 'Heritage Hub',
    description: 'Cultural preservation center',
    route: '/heritage-hub',
    icon: <Globe size={ICON_SIZE} color={ICON_COLOR} />,
    category: 'Culture',
    keywords: ['heritage', 'culture', 'tradition', 'history', 'ancestry', 'roots'],
    gradient: ['#D4673A', '#C9A227'],
  },
  {
    id: 'cultural-music',
    name: 'Cultural Music',
    description: 'Traditional music from around the world',
    route: '/cultural-music',
    icon: <Music2 size={ICON_SIZE} color={ICON_COLOR} />,
    category: 'Culture',
    keywords: ['music', 'songs', 'highlife', 'qawwali', 'ghazal', 'sufi', 'traditional', 'pakistan', 'ghana', 'africa', 'reggae', 'coke studio'],
    gradient: ['#C9A227', '#D4673A'],
  },
  {
    id: 'translator',
    name: 'Global Translator',
    description: 'Translate between 50+ languages',
    route: '/translator',
    icon: <Languages size={ICON_SIZE} color={ICON_COLOR} />,
    category: 'Tools',
    keywords: ['translate', 'language', 'translation', 'speak', 'convert'],
    gradient: ['#3B82F6', '#06B6D4'],
  },
  {
    id: 'family-tree',
    name: 'Family Trees',
    description: 'Document your lineage',
    route: '/family-tree',
    icon: <Users2 size={ICON_SIZE} color={ICON_COLOR} />,
    category: 'Culture',
    keywords: ['family', 'tree', 'ancestry', 'lineage', 'heritage', 'relatives', 'genealogy'],
    gradient: ['#059669', '#10B981'],
  },
  {
    id: 'proverbs-wisdom',
    name: 'Proverbs & Wisdom',
    description: 'Daily cultural proverbs',
    route: '/proverbs-wisdom',
    icon: <BookOpen size={ICON_SIZE} color={ICON_COLOR} />,
    category: 'Culture',
    keywords: ['proverbs', 'wisdom', 'quotes', 'sayings', 'african', 'cultural'],
    gradient: ['#F59E0B', '#D97706'],
  },
  {
    id: 'name-meanings',
    name: 'Name Meanings',
    description: 'Discover African name meanings',
    route: '/name-meanings',
    icon: <Sparkles size={ICON_SIZE} color={ICON_COLOR} />,
    category: 'Culture',
    keywords: ['name', 'meaning', 'origin', 'african', 'baby', 'names'],
    gradient: ['#EC4899', '#DB2777'],
  },
  {
    id: 'traditional-attire',
    name: 'Traditional Attire',
    description: 'Learn about cultural clothing',
    route: '/traditional-attire',
    icon: <Shirt size={ICON_SIZE} color={ICON_COLOR} />,
    category: 'Culture',
    keywords: ['attire', 'clothing', 'fashion', 'kente', 'dashiki', 'traditional', 'dress'],
    gradient: ['#8B5CF6', '#7C3AED'],
  },
  {
    id: 'cultural-calendar',
    name: 'Cultural Calendar',
    description: 'Global holidays and celebrations',
    route: '/cultural-calendar',
    icon: <CalendarDays size={ICON_SIZE} color={ICON_COLOR} />,
    category: 'Culture',
    keywords: ['calendar', 'holiday', 'celebration', 'festival', 'cultural', 'events'],
    gradient: ['#EF4444', '#DC2626'],
  },

  // Safety & Support
  {
    id: 'safety-network',
    name: 'Safety Network',
    description: 'Emergency contacts and SOS',
    route: '/safety-network',
    icon: <Shield size={ICON_SIZE} color={ICON_COLOR} />,
    category: 'Safety',
    keywords: ['safety', 'emergency', 'sos', 'help', 'alert', 'contacts'],
    gradient: ['#EF4444', '#DC2626'],
  },
  {
    id: 'support-circles',
    name: 'Support Circles',
    description: 'Community support groups',
    route: '/support-circles',
    icon: <Heart size={ICON_SIZE} color={ICON_COLOR} />,
    category: 'Support',
    keywords: ['support', 'group', 'help', 'grief', 'immigration', 'mental', 'health'],
    gradient: ['#F472B6', '#EC4899'],
  },
  {
    id: 'mental-health',
    name: 'Mental Health',
    description: 'Mood tracking and resources',
    route: '/mental-health',
    icon: <Brain size={ICON_SIZE} color={ICON_COLOR} />,
    category: 'Health',
    keywords: ['mental', 'health', 'mood', 'wellness', 'therapy', 'counseling'],
    gradient: ['#06B6D4', '#0891B2'],
  },
  {
    id: 'emergency-contacts',
    name: 'Emergency Contacts',
    description: 'Essential emergency numbers',
    route: '/emergency-contacts',
    icon: <Phone size={ICON_SIZE} color={ICON_COLOR} />,
    category: 'Safety',
    keywords: ['emergency', 'contacts', 'phone', '911', 'embassy', 'help'],
    gradient: ['#DC2626', '#B91C1C'],
  },

  // Money & Finance
  {
    id: 'remittance',
    name: 'Money Transfer',
    description: 'Send money internationally',
    route: '/remittance',
    icon: <DollarSign size={ICON_SIZE} color={ICON_COLOR} />,
    category: 'Finance',
    keywords: ['money', 'transfer', 'send', 'remittance', 'international', 'wise', 'worldremit'],
    gradient: ['#10B981', '#059669'],
  },
  {
    id: 'gem-store',
    name: 'Gem Store',
    description: 'Purchase gems for gifts',
    route: '/gem-store',
    icon: <Gift size={ICON_SIZE} color={ICON_COLOR} />,
    category: 'Finance',
    keywords: ['gems', 'buy', 'purchase', 'coins', 'credits', 'store'],
    gradient: ['#8B5CF6', '#7C3AED'],
  },

  // Immigration & Legal
  {
    id: 'immigration-help',
    name: 'Immigration Help',
    description: 'Visa guides and lawyers',
    route: '/immigration-help',
    icon: <Scale size={ICON_SIZE} color={ICON_COLOR} />,
    category: 'Legal',
    keywords: ['immigration', 'visa', 'lawyer', 'legal', 'green card', 'asylum', 'citizenship'],
    gradient: ['#6366F1', '#4F46E5'],
  },
  {
    id: 'document-translation',
    name: 'Document Translation',
    description: 'Find translation helpers',
    route: '/document-translation',
    icon: <Languages size={ICON_SIZE} color={ICON_COLOR} />,
    category: 'Services',
    keywords: ['document', 'translation', 'translate', 'legal', 'medical', 'papers'],
    gradient: ['#0EA5E9', '#0284C7'],
  },

  // Food & Lifestyle
  {
    id: 'african-food',
    name: 'Global Food Network',
    description: 'Order authentic home-cooked food',
    route: '/african-food',
    icon: <UtensilsCrossed size={ICON_SIZE} color={ICON_COLOR} />,
    category: 'Food',
    keywords: ['food', 'eat', 'restaurant', 'african', 'cook', 'meal', 'order', 'delivery'],
    gradient: ['#EF4444', '#F97316'],
  },
  {
    id: 'group-grocery',
    name: 'Group Grocery Orders',
    description: 'Bulk buying with community',
    route: '/group-grocery',
    icon: <ShoppingCart size={ICON_SIZE} color={ICON_COLOR} />,
    category: 'Food',
    keywords: ['grocery', 'food', 'bulk', 'group', 'order', 'shopping'],
    gradient: ['#22C55E', '#16A34A'],
  },
  {
    id: 'traditional-medicine',
    name: 'Traditional Medicine',
    description: 'Find herbalists and practitioners',
    route: '/traditional-medicine',
    icon: <Leaf size={ICON_SIZE} color={ICON_COLOR} />,
    category: 'Health',
    keywords: ['medicine', 'traditional', 'herbal', 'natural', 'holistic', 'healer'],
    gradient: ['#059669', '#047857'],
  },

  // Entertainment & Media
  {
    id: 'stories',
    name: 'Stories',
    description: '24-hour disappearing stories',
    route: '/stories',
    icon: <Camera size={ICON_SIZE} color={ICON_COLOR} />,
    category: 'Social',
    keywords: ['stories', 'photo', 'video', 'share', 'moment', 'disappearing'],
    gradient: ['#F43F5E', '#E11D48'],
  },
  {
    id: 'clips',
    name: 'Clips & Highlights',
    description: 'Short-form video clips',
    route: '/clips',
    icon: <Camera size={ICON_SIZE} color={ICON_COLOR} />,
    category: 'Entertainment',
    keywords: ['clips', 'video', 'short', 'highlights', 'tiktok', 'reels'],
    gradient: ['#EC4899', '#DB2777'],
  },
  {
    id: 'live-radio',
    name: 'Live Radio',
    description: 'Community radio stations',
    route: '/live-radio',
    icon: <Radio size={ICON_SIZE} color={ICON_COLOR} />,
    category: 'Entertainment',
    keywords: ['radio', 'live', 'music', 'station', 'broadcast', 'dj'],
    gradient: ['#7C3AED', '#6D28D9'],
  },
  {
    id: 'photo-booth',
    name: 'Photo Booth',
    description: 'Cultural filters for photos',
    route: '/photo-booth',
    icon: <Camera size={ICON_SIZE} color={ICON_COLOR} />,
    category: 'Entertainment',
    keywords: ['photo', 'filter', 'camera', 'selfie', 'cultural', 'ankara', 'kente'],
    gradient: ['#F97316', '#EA580C'],
  },

  // Community Living
  {
    id: 'pet-connect',
    name: 'Pet Connect',
    description: 'Connect with pet owners',
    route: '/pet-connect',
    icon: <Dog size={ICON_SIZE} color={ICON_COLOR} />,
    category: 'Community',
    keywords: ['pet', 'dog', 'cat', 'animal', 'owner', 'playdate', 'sitting'],
    gradient: ['#F59E0B', '#D97706'],
  },
  {
    id: 'carpool',
    name: 'Carpool & Ride Share',
    description: 'Community ride sharing',
    route: '/carpool',
    icon: <Car size={ICON_SIZE} color={ICON_COLOR} />,
    category: 'Transport',
    keywords: ['carpool', 'ride', 'share', 'transport', 'commute', 'travel', 'car'],
    gradient: ['#0EA5E9', '#0284C7'],
  },
  {
    id: 'housing-board',
    name: 'Housing Board',
    description: 'Find roommates and housing',
    route: '/housing-board',
    icon: <Home size={ICON_SIZE} color={ICON_COLOR} />,
    category: 'Housing',
    keywords: ['housing', 'room', 'apartment', 'rent', 'roommate', 'sublet', 'house'],
    gradient: ['#8B5CF6', '#7C3AED'],
  },
  {
    id: 'lost-found',
    name: 'Lost & Found',
    description: 'Report and find lost items',
    route: '/lost-found',
    icon: <SearchX size={ICON_SIZE} color={ICON_COLOR} />,
    category: 'Community',
    keywords: ['lost', 'found', 'missing', 'item', 'keys', 'wallet', 'phone'],
    gradient: ['#EF4444', '#DC2626'],
  },
  {
    id: 'skill-swap',
    name: 'Skill Swap',
    description: 'Trade skills with community',
    route: '/skill-swap',
    icon: <Repeat size={ICON_SIZE} color={ICON_COLOR} />,
    category: 'Community',
    keywords: ['skill', 'swap', 'trade', 'exchange', 'learn', 'teach'],
    gradient: ['#06B6D4', '#0891B2'],
  },
  {
    id: 'memory-capsules',
    name: 'Memory Capsules',
    description: 'Time-locked posts',
    route: '/memory-capsules',
    icon: <Clock size={ICON_SIZE} color={ICON_COLOR} />,
    category: 'Social',
    keywords: ['memory', 'capsule', 'time', 'future', 'lock', 'message'],
    gradient: ['#A855F7', '#9333EA'],
  },
  {
    id: 'appreciation-wall',
    name: 'Appreciation Wall',
    description: 'Public shoutouts and thanks',
    route: '/appreciation-wall',
    icon: <Star size={ICON_SIZE} color={ICON_COLOR} />,
    category: 'Community',
    keywords: ['appreciation', 'thank', 'shoutout', 'recognition', 'praise'],
    gradient: ['#F59E0B', '#D97706'],
  },
  {
    id: 'fitness-challenges',
    name: 'Fitness Challenges',
    description: 'Community fitness competitions',
    route: '/fitness-challenges',
    icon: <Dumbbell size={ICON_SIZE} color={ICON_COLOR} />,
    category: 'Health',
    keywords: ['fitness', 'exercise', 'workout', 'challenge', 'steps', 'health'],
    gradient: ['#22C55E', '#16A34A'],
  },
  {
    id: 'gamification',
    name: 'Achievements',
    description: 'Badges and leaderboards',
    route: '/gamification',
    icon: <Trophy size={ICON_SIZE} color={ICON_COLOR} />,
    category: 'Social',
    keywords: ['achievements', 'badges', 'leaderboard', 'xp', 'level', 'rank', 'gamification'],
    gradient: ['#F59E0B', '#D97706'],
  },

  // Settings & Profile
  {
    id: 'profile',
    name: 'My Profile',
    description: 'View and edit your profile',
    route: '/profile',
    icon: <User size={ICON_SIZE} color={ICON_COLOR} />,
    category: 'Account',
    keywords: ['profile', 'account', 'me', 'my', 'edit', 'settings'],
    gradient: ['#6366F1', '#4F46E5'],
  },
  {
    id: 'notifications',
    name: 'Notifications',
    description: 'View your notifications',
    route: '/notifications',
    icon: <Bell size={ICON_SIZE} color={ICON_COLOR} />,
    category: 'Account',
    keywords: ['notifications', 'alerts', 'messages', 'updates'],
    gradient: ['#EF4444', '#DC2626'],
  },
  {
    id: 'messages',
    name: 'Messages',
    description: 'Chat with community members',
    route: '/messages',
    icon: <MessageCircle size={ICON_SIZE} color={ICON_COLOR} />,
    category: 'Social',
    keywords: ['messages', 'chat', 'dm', 'inbox', 'conversation', 'talk'],
    gradient: ['#3B82F6', '#2563EB'],
  },
  {
    id: 'paywall',
    name: 'Go Premium',
    description: 'Upgrade to premium membership',
    route: '/paywall',
    icon: <Star size={ICON_SIZE} color={ICON_COLOR} />,
    category: 'Account',
    keywords: ['premium', 'subscribe', 'upgrade', 'membership', 'pro'],
    gradient: ['#C9A227', '#D4673A'],
  },
];

const CATEGORIES = [
  'All',
  'Social',
  'Community',
  'Culture',
  'Finance',
  'Entertainment',
  'Health',
  'Services',
  'Food',
  'Safety',
];

export default function AppSearchScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [activeTab, setActiveTab] = useState<SearchTab>('features');
  const [peopleFilter, setPeopleFilter] = useState<PeopleFilter>('all');
  const [dbUsers, setDbUsers] = useState<SearchablePerson[]>([]);
  const [isLoadingPeople, setIsLoadingPeople] = useState(false);
  const [peopleOffset, setPeopleOffset] = useState(0);
  const [peopleHasMore, setPeopleHasMore] = useState(true);
  const [peopleLoadingMore, setPeopleLoadingMore] = useState(false);
  const [contentResults, setContentResults] = useState<ContentSearchResult[]>([]);
  const [contentLoading, setContentLoading] = useState(false);

  const selectedLocation = useStore((s) => s.selectedLocation);
  const currentUser = useStore((s) => s.currentUser);

  const PEOPLE_PAGE_SIZE = 50;

  const escapeIlike = (input: string) => input.replace(/[%_]/g, '\\$&');

  const peopleReqIdRef = useRef(0);
  const peopleQueryKeyRef = useRef('');
  const peopleLoadingMoreRef = useRef(false);
  const buildPeopleKey = (q: string, filter: PeopleFilter, city: string, neighborhood: string) =>
    `${q}::${filter}::${city}::${neighborhood}`;

  // Fetch users from database
  const searchUsers = useCallback(async (query: string, opts?: { reset?: boolean }) => {
    if (activeTab !== 'people') return;

    const reset = opts?.reset ?? false;
    const q = query.trim();
    const city = (selectedLocation?.city || '').trim();
    const neighborhood = (selectedLocation?.neighborhood || '').trim();

    const queryKey = buildPeopleKey(q, peopleFilter, city, neighborhood);
    const reqId = reset ? ++peopleReqIdRef.current : peopleReqIdRef.current;
    if (reset) peopleQueryKeyRef.current = queryKey;

    if (reset) {
      // Keep current results visible while searching to avoid flicker.
      setIsLoadingPeople(true);
      setPeopleOffset(0);
      setPeopleHasMore(true);
      peopleLoadingMoreRef.current = false;
    } else {
      if (!peopleHasMore || peopleLoadingMore) return;
      if (peopleLoadingMoreRef.current) return;
      setPeopleLoadingMore(true);
      peopleLoadingMoreRef.current = true;
    }
    try {
      // Ignore stale "load more" calls if query/filter/location changed
      if (!reset && peopleQueryKeyRef.current !== queryKey) return;

      // Server-side search for real users (fast + scalable)
      let queryBuilder = supabase
        .from('profiles')
        .select('id, name, username, avatar_url, bio, location')
        // Stable ordering is critical for correct pagination.
        .order('created_at', { ascending: false })
        .order('id', { ascending: true })
        .range(
          (reset ? 0 : peopleOffset),
          (reset ? 0 : peopleOffset) + PEOPLE_PAGE_SIZE - 1
        );

      // Exclude current user
      if (currentUser?.id) {
        queryBuilder = queryBuilder.neq('id', currentUser.id);
      }

      // Text search (name/username/location)
      if (q) {
        const escaped = escapeIlike(q);
        queryBuilder = queryBuilder.or(
          `name.ilike.%${escaped}%,username.ilike.%${escaped}%,location.ilike.%${escaped}%`
        );
      }

      // Local-only mode: stricter match (city AND neighborhood when neighborhood exists)
      if (peopleFilter === 'local' && city) {
        queryBuilder = queryBuilder.ilike('location', `%${escapeIlike(city)}%`);
        if (neighborhood) {
          queryBuilder = queryBuilder.ilike('location', `%${escapeIlike(neighborhood)}%`);
        }
      }

      const { data, error } = await queryBuilder;

      // Drop stale responses when typing fast
      if (peopleQueryKeyRef.current !== queryKey) return;
      if (reqId !== peopleReqIdRef.current) return;

      if (error) {
        console.log('[People Search] Error:', JSON.stringify(error));
        if (reset) setDbUsers([]);
        setPeopleHasMore(false);
        return;
      }

      const usersArray = data || [];
      console.log('[People Search] Raw data count:', usersArray.length);

      const transformedUsers: SearchablePerson[] = [];
      for (const user of usersArray) {
        const userLocationLower = String(user.location || '').toLowerCase();
        const cityLower = city.toLowerCase();
        const neighborhoodLower = neighborhood.toLowerCase();
        const isLocalByCity = !!cityLower && userLocationLower.includes(cityLower);
        const isLocalByNeighborhood = !!neighborhoodLower && userLocationLower.includes(neighborhoodLower);
        const isLocal = cityLower ? (neighborhoodLower ? (isLocalByCity && isLocalByNeighborhood) : isLocalByCity) : false;

        // Build avatar URL
        const userName = user.name || 'U';
        let avatarUrl = user.avatar_url;
        if (!avatarUrl) {
          avatarUrl = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(userName) + '&background=random';
        }

        transformedUsers.push({
          id: user.id,
          name: user.name || 'Anonymous User',
          username: user.username || user.id.substring(0, 8),
          avatar: avatarUrl,
          bio: user.bio || '',
          location: user.location || 'Unknown',
          country: '',
          interests: [],
          isVerified: false,
          isLocal: isLocal,
          mutualConnections: 0,
        });
      }

      console.log('[People Search] Found', transformedUsers.length, 'users');
      setDbUsers((prev) => {
        if (reset) return transformedUsers;
        // Dedupe by id to prevent React key collisions if pages overlap.
        const seen = new Set(prev.map((u) => u.id));
        const next = [...prev];
        for (const u of transformedUsers) {
          if (!seen.has(u.id)) {
            seen.add(u.id);
            next.push(u);
          }
        }
        return next;
      });
      const got = transformedUsers.length;
      const nextOffset = (reset ? 0 : peopleOffset) + got;
      setPeopleOffset(nextOffset);
      setPeopleHasMore(got === PEOPLE_PAGE_SIZE);
    } catch (error) {
      console.log('[People Search] Exception:', String(error));
      if (reset) setDbUsers([]);
      setPeopleHasMore(false);
    } finally {
      // Only the latest request should affect loading flags (prevents flicker).
      if (peopleQueryKeyRef.current === queryKey && reqId === peopleReqIdRef.current) {
        setIsLoadingPeople(false);
        setPeopleLoadingMore(false);
        peopleLoadingMoreRef.current = false;
      }
    }
  }, [
    activeTab,
    currentUser?.id,
    selectedLocation?.city,
    selectedLocation?.neighborhood,
    peopleFilter,
    peopleOffset,
    peopleHasMore,
    peopleLoadingMore,
  ]);

  // Search users when tab changes to people or when search query changes
  useEffect(() => {
    if (activeTab === 'people') {
      const debounceTimer = setTimeout(() => {
        searchUsers(searchQuery, { reset: true });
      }, 300);
      return () => clearTimeout(debounceTimer);
    }
  }, [activeTab, searchQuery, searchUsers]);

  // Search content (posts, events, listings, businesses) when Content tab is active
  const searchContent = useCallback(async (q: string) => {
    if (activeTab !== 'content') return;
    const query = q.trim();
    if (!query) {
      setContentResults([]);
      return;
    }
    setContentLoading(true);
    try {
      const pattern = `%${query}%`;

      const [postsRes, eventsRes, faithRes, listingsRes, businessesRes] = await Promise.all([
        supabase.from('posts').select('id, content').ilike('content', pattern).limit(5),
        supabase.from('events').select('id, title, date, image').ilike('title', pattern).limit(5),
        supabase.from('faith_events').select('id, title, date').ilike('title', pattern).limit(5),
        supabase.from('marketplace_listings').select('id, title, images, price').ilike('title', pattern).limit(5),
        supabase.from('businesses').select('id, name, image, category').ilike('name', pattern).limit(5),
      ]);

      const results: ContentSearchResult[] = [];

      (postsRes.data || []).forEach((p: any) => {
        results.push({
          type: 'post',
          id: p.id,
          title: (p.content || '').slice(0, 60) + ((p.content || '').length > 60 ? '…' : ''),
          subtitle: 'Post',
          route: `/post/${p.id}`,
        });
      });
      (eventsRes.data || []).forEach((e: any) => {
        results.push({
          type: 'event',
          id: e.id,
          title: e.title || '',
          subtitle: e.date ? `Event · ${e.date}` : 'Event',
          image: e.image,
          route: `/event/${e.id}`,
        });
      });
      (faithRes.data || []).forEach((f: any) => {
        results.push({
          type: 'faith_event',
          id: f.id,
          title: f.title || '',
          subtitle: f.date ? `Faith Event · ${f.date}` : 'Faith Event',
          route: `/event/${f.id}`,
        });
      });
      (listingsRes.data || []).forEach((l: any) => {
        results.push({
          type: 'listing',
          id: l.id,
          title: l.title || '',
          subtitle: l.price != null ? `Listing · $${l.price}` : 'Listing',
          image: Array.isArray(l.images) ? l.images[0] : undefined,
          route: '/(tabs)/marketplace',
        });
      });
      (businessesRes.data || []).forEach((b: any) => {
        results.push({
          type: 'business',
          id: b.id,
          title: b.name || '',
          subtitle: b.category ? `Business · ${b.category}` : 'Business',
          image: b.image,
          route: `/business/${b.id}`,
        });
      });

      setContentResults(results);
    } catch (err) {
      console.log('[Content Search] Error:', err);
      setContentResults([]);
    } finally {
      setContentLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'content') {
      const t = setTimeout(() => searchContent(searchQuery), 300);
      return () => clearTimeout(t);
    } else {
      setContentResults([]);
    }
  }, [activeTab, searchQuery, searchContent]);

  const filteredFeatures = useMemo(() => {
    let results = APP_FEATURES;

    // Filter by category
    if (selectedCategory !== 'All') {
      results = results.filter(f => f.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      results = results.filter(feature => {
        const nameMatch = feature.name.toLowerCase().includes(query);
        const descMatch = feature.description.toLowerCase().includes(query);
        const keywordMatch = feature.keywords.some(kw => kw.toLowerCase().includes(query));
        const categoryMatch = feature.category.toLowerCase().includes(query);
        return nameMatch || descMatch || keywordMatch || categoryMatch;
      });
    }

    return results;
  }, [searchQuery, selectedCategory]);

  const filteredPeople = useMemo(() => {
    // Filter database users by local/global
    if (peopleFilter === 'local') {
      return dbUsers.filter(person => person.isLocal);
    } else if (peopleFilter === 'global') {
      // "Global" should still show everyone, but prioritize non-local matches first.
      return [...dbUsers].sort((a, b) => Number(!!a.isLocal) - Number(!!b.isLocal));
    }
    return dbUsers;
  }, [dbUsers, peopleFilter]);

  const handleFeaturePress = (route: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push(route as any);
  };

  const handlePersonPress = (person: SearchablePerson) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push(`/profile/${person.id}` as any);
  };

  const handleConnectPress = (personId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Handle connect logic
  };

  const renderPersonCard = (person: SearchablePerson, index: number) => {
    return (
      <View>
        <Pressable onPress={() => handlePersonPress(person)} className="mb-3">
          <View className="p-4 bg-white/5 rounded-2xl border border-white/10">
            <View className="flex-row items-start">
              {/* Avatar */}
              <View className="relative">
                <Image source={{ uri: person.avatar }} style={{ width: 56, height: 56, borderRadius: 28 }} />
                {person.isVerified && (
                  <View className="absolute -bottom-1 -right-1 bg-blue-500 rounded-full p-0.5">
                    <BadgeCheck size={14} color="#FFFFFF" />
                  </View>
                )}
              </View>

              {/* Info */}
              <View className="flex-1 ml-3">
                <View className="flex-row items-center">
                  <Text className="text-white font-semibold text-base">{person.name}</Text>
                </View>
                <Text className="text-gray-500 text-sm">@{person.username}</Text>
                <Text className="text-gray-400 text-sm mt-1" numberOfLines={1}>
                  {person.bio}
                </Text>

                {/* Location */}
                <View className="flex-row items-center mt-2">
                  {person.isLocal ? <MapPin size={12} color="#10B981" /> : <Globe size={12} color="#3B82F6" />}
                  <Text className={`text-xs ml-1 ${person.isLocal ? 'text-emerald-400' : 'text-blue-400'}`}>
                    {person.location}
                  </Text>
                  {person.mutualConnections && person.mutualConnections > 0 && (
                    <View className="flex-row items-center ml-3">
                      <Users size={12} color="#9CA3AF" />
                      <Text className="text-gray-500 text-xs ml-1">{person.mutualConnections} mutual</Text>
                    </View>
                  )}
                </View>

                {/* Interests */}
                <View className="flex-row flex-wrap gap-1.5 mt-2">
                  {(person.interests ?? []).slice(0, 3).map((interest) => (
                    <View key={interest} className="bg-white/10 px-2 py-0.5 rounded-full">
                      <Text className="text-gray-400 text-xs">{interest}</Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* Connect Button */}
              <Pressable onPress={() => handleConnectPress(person.id)} className="bg-[#D4673A] px-3 py-2 rounded-full">
                <View className="flex-row items-center">
                  <UserPlus size={14} color="#FFFFFF" />
                  <Text className="text-white text-xs font-semibold ml-1">Connect</Text>
                </View>
              </Pressable>
            </View>
          </View>
        </Pressable>
      </View>
    );
  };

  return (
    <View className="flex-1 bg-[#0A0A0A]">
      <SafeAreaView edges={['top']} className="flex-1">
        {/* Header */}
        <View className="px-5 pb-4">
          <View className="flex-row items-center gap-3 mb-4">
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.back();
              }}
              className="w-10 h-10 rounded-full bg-white/10 items-center justify-center"
            >
              <ArrowLeft size={20} color="#fff" />
            </Pressable>
            <Text className="text-white text-xl font-bold flex-1">Search</Text>
          </View>

          {/* Search Bar */}
          <View className="flex-row items-center bg-white/10 rounded-2xl px-4 py-3 mb-4">
            <Search size={20} color="#9CA3AF" />
            <TextInput
              placeholder={
                activeTab === 'features'
                  ? "Search features, tabs, tools..."
                  : activeTab === 'content'
                  ? "Search posts, events, listings, businesses..."
                  : "Search people by name, location..."
              }
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
              className="flex-1 ml-3 text-white text-base"
              autoFocus
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery('')}>
                <X size={20} color="#9CA3AF" />
              </Pressable>
            )}
          </View>

          {/* Main Tabs - Features, Content, People */}
          <View className="flex-row bg-white/10 rounded-xl p-1 mb-4">
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setActiveTab('features');
              }}
              className={`flex-1 flex-row items-center justify-center py-2.5 rounded-lg ${
                activeTab === 'features' ? 'bg-white' : ''
              }`}
            >
              <Search size={16} color={activeTab === 'features' ? '#0A0A0A' : '#9CA3AF'} />
              <Text className={`ml-2 font-semibold ${
                activeTab === 'features' ? 'text-gray-900' : 'text-gray-400'
              }`}>
                Features
              </Text>
            </Pressable>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setActiveTab('content');
              }}
              className={`flex-1 flex-row items-center justify-center py-2.5 rounded-lg ${
                activeTab === 'content' ? 'bg-white' : ''
              }`}
            >
              <Hash size={16} color={activeTab === 'content' ? '#0A0A0A' : '#9CA3AF'} />
              <Text className={`ml-2 font-semibold ${
                activeTab === 'content' ? 'text-gray-900' : 'text-gray-400'
              }`}>
                Content
              </Text>
            </Pressable>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setActiveTab('people');
              }}
              className={`flex-1 flex-row items-center justify-center py-2.5 rounded-lg ${
                activeTab === 'people' ? 'bg-white' : ''
              }`}
            >
              <Users size={16} color={activeTab === 'people' ? '#0A0A0A' : '#9CA3AF'} />
              <Text className={`ml-2 font-semibold ${
                activeTab === 'people' ? 'text-gray-900' : 'text-gray-400'
              }`}>
                People
              </Text>
            </Pressable>
          </View>

          {/* Category/Filter Pills */}
          {activeTab === 'content' ? null : activeTab === 'features' ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }}>
              <View className="flex-row gap-2">
                {CATEGORIES.map((category) => (
                  <Pressable
                    key={category}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setSelectedCategory(category);
                    }}
                    className={`px-4 py-2 rounded-full ${
                      selectedCategory === category
                        ? 'bg-[#D4673A]'
                        : 'bg-white/10'
                    }`}
                  >
                    <Text className={`font-medium ${
                      selectedCategory === category ? 'text-white' : 'text-gray-300'
                    }`}>
                      {category}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
          ) : (
            <View className="flex-row gap-2">
              {[
                { key: 'all', label: 'All', icon: Users },
                { key: 'local', label: `Local`, icon: MapPin },
                { key: 'global', label: 'Global', icon: Globe },
              ].map((filter) => (
                <Pressable
                  key={filter.key}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setPeopleFilter(filter.key as PeopleFilter);
                  }}
                  className={`flex-row items-center px-4 py-2 rounded-full ${
                    peopleFilter === filter.key
                      ? 'bg-[#D4673A]'
                      : 'bg-white/10'
                  }`}
                >
                  <filter.icon size={14} color={peopleFilter === filter.key ? '#FFFFFF' : '#9CA3AF'} />
                  <Text className={`ml-1.5 font-medium ${
                    peopleFilter === filter.key ? 'text-white' : 'text-gray-300'
                  }`}>
                    {filter.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}
        </View>

        {/* Results - flex-1 wrapper ensures FlatList gets height on iOS */}
        {activeTab === 'content' ? (
          <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
            {contentLoading ? (
              <View className="py-20 items-center">
                <ActivityIndicator size="large" color="#D4673A" />
              </View>
            ) : !searchQuery.trim() ? (
              <View className="py-20 items-center">
                <Search size={48} color="#6B7280" />
                <Text className="text-gray-500 mt-4 text-center">
                  Search posts, events, marketplace listings, and businesses
                </Text>
              </View>
            ) : contentResults.length === 0 ? (
              <View className="py-20 items-center">
                <SearchX size={48} color="#6B7280" />
                <Text className="text-gray-500 mt-4 text-center">No results found</Text>
              </View>
            ) : (
              contentResults.map((item, i) => (
                <Pressable
                  key={`${item.type}-${item.id}`}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    router.push(item.route as any);
                  }}
                  className="flex-row items-center p-4 mb-3 bg-white/5 rounded-2xl border border-white/10"
                >
                  {item.image ? (
                    <Image source={{ uri: item.image }} style={{ width: 48, height: 48, borderRadius: 12 }} contentFit="cover" />
                  ) : (
                    <View className="w-12 h-12 rounded-xl bg-white/10 items-center justify-center">
                      {item.type === 'post' && <MessageCircle size={24} color="#9CA3AF" />}
                      {item.type === 'event' && <Calendar size={24} color="#9CA3AF" />}
                      {item.type === 'faith_event' && <Church size={24} color="#9CA3AF" />}
                      {item.type === 'listing' && <ShoppingBag size={24} color="#9CA3AF" />}
                      {item.type === 'business' && <Store size={24} color="#9CA3AF" />}
                    </View>
                  )}
                  <View className="flex-1 ml-3">
                    <Text className="text-white font-medium" numberOfLines={1}>{item.title}</Text>
                    {item.subtitle && (
                      <Text className="text-gray-500 text-sm mt-0.5" numberOfLines={1}>{item.subtitle}</Text>
                    )}
                  </View>
                  <ChevronRight size={20} color="#9CA3AF" />
                </Pressable>
              ))
            )}
          </ScrollView>
        ) : activeTab === 'features' ? (
          <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
            <>
              {/* "Extra tiles" (photo tiles like your reference) */}
              {!searchQuery && selectedCategory === 'All' && (
                <View className="mb-6">
                  <Text className="text-gray-400 text-sm mb-3">TRENDING</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }}>
                    <View className="flex-row gap-2 pr-2">
                      {[
                        'Handyman',
                        'Babysitter',
                        'Electrician',
                        'Plumber',
                        'House help',
                        'Cooks',
                        'Housing',
                        'Marketplace',
                        'Events',
                        'Safety alerts',
                      ].map((q) => (
                        <Pressable
                          key={q}
                          onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            setSearchQuery(q);
                          }}
                          className="bg-white/5 border border-white/10 px-4 py-2 rounded-full"
                        >
                          <Text className="text-white">{q}</Text>
                        </Pressable>
                      ))}
                    </View>
                  </ScrollView>

                  <Text className="text-gray-400 text-sm mt-5 mb-3">START BROWSING</Text>
                  <View className="flex-row flex-wrap" style={{ gap: 12 }}>
                    <PhotoTile
                      title="For Sale & Free"
                      subtitle="Marketplace"
                      imageUri="https://images.unsplash.com/photo-1520975916090-3105956dac38?w=1200&h=800&fit=crop"
                      onPress={() => handleFeaturePress('/marketplace')}
                      size="lg"
                    />
                    <PhotoTile
                      title="Hire a Pro"
                      subtitle="Trusted helpers"
                      imageUri="https://images.unsplash.com/photo-1581579185169-7a5b2a36b1aa?w=1200&h=800&fit=crop"
                      onPress={() => handleFeaturePress('/trusted-providers')}
                      size="lg"
                    />
                    <PhotoTile
                      title="Groups"
                      subtitle="Connect"
                      imageUri="https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=1200&h=800&fit=crop"
                      onPress={() => handleFeaturePress('/connect')}
                    />
                    <PhotoTile
                      title="Housing"
                      subtitle="Board"
                      imageUri="https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1200&h=800&fit=crop"
                      onPress={() => handleFeaturePress('/housing-board')}
                    />
                    <PhotoTile
                      title="Events"
                      subtitle="Near you"
                      imageUri="https://images.unsplash.com/photo-1527529482837-4698179dc6ce?w=1200&h=800&fit=crop"
                      onPress={() => handleFeaturePress('/events')}
                    />
                    <PhotoTile
                      title="Alerts"
                      subtitle="Safety"
                      imageUri="https://images.unsplash.com/photo-1457732815361-daa98277e9c8?w=1200&h=800&fit=crop"
                      onPress={() => handleFeaturePress('/safety-alerts')}
                    />
                  </View>
                </View>
              )}

              {/* Results Count */}
              <Text className="text-gray-500 text-sm mb-3">
                {filteredFeatures.length} feature{filteredFeatures.length !== 1 ? 's' : ''} found
              </Text>

              {/* Feature Cards */}
              {filteredFeatures.map((feature, index) => (
                <Animated.View
                  key={feature.id}
                  entering={FadeInDown.delay(index * 30).springify()}
                >
                  <Pressable
                    onPress={() => handleFeaturePress(feature.route)}
                    className="mb-3"
                  >
                    <View className="flex-row items-center p-4 bg-white/5 rounded-2xl border border-white/10">
                      {/* Icon */}
                      <LinearGradient
                        colors={feature.gradient}
                        style={{
                          width: 48,
                          height: 48,
                          borderRadius: 14,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {feature.icon}
                      </LinearGradient>

                      {/* Info */}
                      <View className="flex-1 ml-4">
                        <Text className="text-white font-semibold text-base">{feature.name}</Text>
                        <Text className="text-gray-400 text-sm mt-0.5" numberOfLines={1}>
                          {feature.description}
                        </Text>
                      </View>

                      {/* Category Badge */}
                      <View className="bg-white/10 px-2.5 py-1 rounded-full">
                        <Text className="text-gray-400 text-xs">{feature.category}</Text>
                      </View>
                    </View>
                  </Pressable>
                </Animated.View>
              ))}

              {/* No Results */}
              {filteredFeatures.length === 0 && (
                <View className="items-center py-12">
                  <Search size={48} color="#374151" />
                  <Text className="text-gray-500 text-lg mt-4">No features found</Text>
                  <Text className="text-gray-600 text-sm mt-1 text-center px-8">
                    Try searching for something else like "pet", "music", or "money"
                  </Text>
                </View>
              )}
            </>
          </ScrollView>
        ) : (
          <View style={{ flex: 1 }}>
            <FlatList
              data={filteredPeople}
              keyExtractor={(item) => item.id}
              renderItem={({ item, index }) => renderPersonCard(item, index)}
              style={{ flex: 1 }}
              contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 30, flexGrow: 1 }}
              showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            onEndReachedThreshold={0.35}
            onEndReached={() => {
              if (isLoadingPeople || peopleLoadingMore) return;
              if (!peopleHasMore) return;
              searchUsers(searchQuery, { reset: false });
            }}
            ListHeaderComponent={
              <View style={{ paddingTop: 2, paddingBottom: 12 }}>
                <View className="flex-row items-center justify-between">
                  <Text className="text-gray-500 text-sm">
                    {filteredPeople.length} {filteredPeople.length === 1 ? 'person' : 'people'} found
                  </Text>
                  {isLoadingPeople ? (
                    <View className="flex-row items-center">
                      <ActivityIndicator size="small" color="#D4673A" />
                      <Text className="text-gray-500 text-sm ml-2">Searching…</Text>
                    </View>
                  ) : null}
                </View>
              </View>
            }
            ListEmptyComponent={
              isLoadingPeople ? null : (
                <View className="items-center py-12">
                  <Users size={48} color="#374151" />
                  <Text className="text-gray-500 text-lg mt-4">No people found</Text>
                  <Text className="text-gray-600 text-sm mt-1 text-center px-8">
                    Try searching by name, location, or interests
                  </Text>
                </View>
              )
            }
            ListFooterComponent={
              <View style={{ paddingTop: 10, paddingBottom: 10 }}>
                {peopleLoadingMore ? (
                  <View className="items-center py-4">
                    <ActivityIndicator size="small" color="#D4673A" />
                    <Text className="text-gray-500 text-sm mt-2">Loading more…</Text>
                  </View>
                ) : !peopleHasMore && filteredPeople.length > 0 ? (
                  <View className="items-center py-4">
                    <Text className="text-gray-600 text-sm">You’ve reached the end.</Text>
                  </View>
                ) : null}
              </View>
            }
            />
          </View>
        )}
      </SafeAreaView>
    </View>
  );
}
