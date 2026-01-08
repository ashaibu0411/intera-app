import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface User {
  id: string;
  name: string;
  username: string;
  avatar: string;
  bio: string;
  location: string;
  interests: string[];
  joinedDate: string;
  phone?: string;
  email?: string;
  gemBalance?: number;
  totalGemsEarned?: number;
  totalGemsSent?: number;
}

export interface GiftTransaction {
  id: string;
  type: 'sent' | 'received' | 'purchased';
  giftId: string;
  giftName: string;
  giftValue: number;
  senderId?: string;
  senderName?: string;
  recipientId?: string;
  recipientName?: string;
  roomId?: string;
  roomTitle?: string;
  timestamp: string;
}

export interface DailyRewardsState {
  currentStreak: number;
  longestStreak: number;
  lastClaimDate: string | null;
  totalDaysClaimed: number;
  claimedDays: number[]; // Days 1-7 that have been claimed in current week
  weekStartDate: string | null;
}

export interface Post {
  id: string;
  author: User;
  content: string;
  images: string[];
  video?: string;
  likes: number;
  comments: number;
  createdAt: string;
  isLiked: boolean;
  location: string;
}

export interface Community {
  id: string;
  name: string;
  city: string;
  state?: string;
  country: string;
  memberCount: number;
  image: string;
}

export interface Notification {
  id: string;
  type: 'like' | 'comment' | 'follow' | 'event' | 'alert';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  avatar?: string;
}

export interface MarketplaceListing {
  id: string;
  seller: User;
  title: string;
  description: string;
  price: string;
  currency: string;
  images: string[];
  category: string;
  condition: 'new' | 'used' | 'refurbished';
  location: string;
  isStoreBased: boolean;
  storeName?: string;
  createdAt: string;
  views: number;
  isSold?: boolean;
}

export interface FaithEvent {
  id: string;
  organizationName: string;
  organizationLogo: string;
  faithType: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  address: string;
  isRecurring: boolean;
  recurringSchedule?: string;
  contactPhone?: string;
  contactEmail?: string;
  attendees: number;
}

export interface LocationData {
  country: string;
  state?: string;
  city: string;
}

export interface Comment {
  id: string;
  postId: string;
  author: User;
  content: string;
  createdAt: string;
  likes: number;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  createdAt: string;
  read: boolean;
}

export interface Conversation {
  id: string;
  participants: User[];
  lastMessage: Message | null;
  updatedAt: string;
}

export interface Event {
  id: string;
  creator: User;
  title: string;
  description: string;
  date: string;
  time: string;
  endTime?: string;
  location: string;
  address: string;
  image?: string;
  isPublic: boolean;
  invitedUsers?: string[];
  attendees: User[];
  rsvpCount: number;
  category: string;
  createdAt: string;
}

export interface Business {
  id: string;
  owner: User;
  name: string;
  category: string;
  description: string;
  image: string;
  logo?: string;
  rating: number;
  reviews: number;
  location: string;
  address: string;
  phone?: string;
  email?: string;
  website?: string;
  hours: string;
  isVerified: boolean;
  isFeatured: boolean;
  isAfricanMarket: boolean;
  inventory?: InventoryItem[];
  // Booking features
  acceptsBookings?: boolean;
  services?: BusinessService[];
  bookingHours?: { day: string; open: string; close: string }[];
  createdAt: string;
}

export interface InventoryItem {
  id: string;
  businessId: string;
  name: string;
  description: string;
  price: string;
  image: string;
  inStock: boolean;
  quantity?: number;
  category: string;
  createdAt: string;
}

export interface BusinessService {
  id: string;
  businessId: string;
  name: string;
  description: string;
  duration: number; // in minutes
  price: number;
  currency: string;
  category: string;
  image?: string;
  isActive: boolean;
}

export interface TimeSlot {
  id: string;
  time: string; // "09:00", "09:30", etc.
  isAvailable: boolean;
}

export interface Appointment {
  id: string;
  businessId: string;
  businessName: string;
  businessImage?: string;
  customerId: string;
  customerName: string;
  customerAvatar?: string;
  customerPhone?: string;
  service: BusinessService;
  date: string; // "2025-01-15"
  time: string; // "10:00 AM"
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  isPaid: boolean;
  paymentMethod?: 'in_app' | 'cash' | 'card_on_site' | 'gems';
  notes?: string;
  createdAt: string;
}

export interface LifeEvent {
  id: string;
  userId: string;
  title: string;
  description: string;
  category: 'wedding' | 'graduation' | 'birthday' | 'newborn' | 'achievement' | 'travel' | 'anniversary' | 'other';
  date: string;
  images: string[];
  video?: string;
  location?: string;
  createdAt: string;
}

export interface EventRsvp {
  eventId: string;
  status: 'interested' | 'going';
}

export interface BlockedTimeSlot {
  id: string;
  // For specific date blocking
  date?: string;
  time?: string;
  // For recurring time blocking (like lunch breaks)
  day?: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday' | 'everyday';
  startTime?: string;
  endTime?: string;
  reason?: string;
}

export interface BusinessBookingSettings {
  businessId: string;
  isBookingEnabled: boolean;
  hasBusinessPro: boolean; // Subscription status
  businessProExpiresAt?: string;
  bookingHours: BusinessHours[];
  blockedDates: string[]; // Dates when business is closed
  blockedTimeSlots: BlockedTimeSlot[]; // Specific blocked slots or recurring blocks
  appointmentBuffer: number; // Minutes between appointments
  advanceBookingDays: number; // How many days in advance can customers book
  services: BusinessService[];
  totalBookingsReceived: number; // Track for free tier (first 25 bookings free)
}

export interface BusinessHours {
  day: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
  isOpen: boolean;
  openTime: string; // "09:00"
  closeTime: string; // "18:00"
  breakStart?: string; // Optional lunch break
  breakEnd?: string;
}

export interface NeighborProfile {
  id: string;
  user: User;
  lookingFor: 'friends' | 'dating' | 'networking' | 'all';
  aboutMe: string;
  isVisible: boolean;
  lastActive: string;
}

export interface NewsArticle {
  id: string;
  title: string;
  description: string;
  url: string;
  imageUrl?: string;
  source: string;
  publishedAt: string;
  category?: string;
}

// Serve & Connect - Talent Directory for Churches/Organizations
export interface ServeTalent {
  id: string;
  user: User;
  category: string;
  skills: string[];
  experience: string;
  bio: string;
  isAvailable: boolean;
  availabilityNote?: string;
  location: string;
  willingToTravel: boolean;
  travelRadius?: string;
  faithBackground?: string;
  contactPhone?: string;
  contactEmail?: string;
  portfolioImages?: string[];
  videoLink?: string;
  rating: number;
  reviewCount: number;
  createdAt: string;
  lastActive: string;
}

export const TALENT_CATEGORIES = [
  { id: 'musician', label: 'Musician', icon: 'Music' },
  { id: 'worship_leader', label: 'Worship Leader', icon: 'Mic' },
  { id: 'singer', label: 'Singer/Vocalist', icon: 'Mic2' },
  { id: 'sound_tech', label: 'Sound/AV Tech', icon: 'Speaker' },
  { id: 'media', label: 'Media/Graphics', icon: 'Camera' },
  { id: 'youth_leader', label: 'Youth Leader', icon: 'Users' },
  { id: 'usher', label: 'Usher/Greeter', icon: 'DoorOpen' },
  { id: 'children_ministry', label: 'Children Ministry', icon: 'Baby' },
  { id: 'prayer_team', label: 'Prayer Team', icon: 'Heart' },
  { id: 'counselor', label: 'Counselor', icon: 'MessageCircle' },
  { id: 'event_coordinator', label: 'Event Coordinator', icon: 'Calendar' },
  { id: 'admin', label: 'Administrative', icon: 'ClipboardList' },
  { id: 'translator', label: 'Translator', icon: 'Languages' },
  { id: 'other', label: 'Other', icon: 'Star' },
] as const;

export const TALENT_SKILLS = {
  musician: ['Piano/Keyboard', 'Guitar', 'Bass', 'Drums', 'Saxophone', 'Trumpet', 'Violin', 'Traditional African Drums', 'Choir Director'],
  worship_leader: ['Contemporary Worship', 'Traditional Hymns', 'Gospel', 'African Worship', 'Multilingual Worship'],
  singer: ['Solo', 'Backup Vocals', 'Choir', 'Gospel', 'Contemporary', 'Traditional'],
  sound_tech: ['Mixing Board', 'Live Sound', 'Recording', 'Streaming Setup', 'ProPresenter', 'Lighting'],
  media: ['Video Production', 'Photography', 'Graphic Design', 'Social Media', 'Live Streaming'],
  youth_leader: ['Teen Ministry', 'Young Adults', 'Campus Ministry', 'Youth Camps'],
  children_ministry: ['Sunday School', 'VBS', 'Nursery', 'Kids Worship'],
  other: ['Hospitality', 'Food Service', 'Security', 'Parking', 'Transportation'],
} as Record<string, string[]>;

export const LIFE_EVENT_CATEGORIES = [
  { id: 'wedding', label: 'Wedding', icon: 'Heart' },
  { id: 'graduation', label: 'Graduation', icon: 'GraduationCap' },
  { id: 'birthday', label: 'Birthday', icon: 'Cake' },
  { id: 'newborn', label: 'New Baby', icon: 'Baby' },
  { id: 'achievement', label: 'Achievement', icon: 'Trophy' },
  { id: 'travel', label: 'Travel', icon: 'Plane' },
  { id: 'anniversary', label: 'Anniversary', icon: 'Calendar' },
  { id: 'other', label: 'Other', icon: 'Star' },
] as const;

export const EVENT_CATEGORIES = [
  'Social Gathering',
  'Networking',
  'Cultural Celebration',
  'Sports & Fitness',
  'Food & Dining',
  'Music & Entertainment',
  'Education & Workshop',
  'Business',
  'Community Service',
  'Other',
];

// Story interfaces
export interface StoryItem {
  id: string;
  type: 'image' | 'text' | 'video';
  content: string;
  backgroundColor?: string;
  textColor?: string;
  duration: number;
  views: number;
  createdAt: string;
}

export interface UserStory {
  userId: string;
  userName: string;
  userAvatar: string;
  stories: StoryItem[];
  hasUnseenStories: boolean;
  lastUpdated: string;
  blockedUserIds?: string[]; // Users who cannot see this user's stories
}

// Mock user stories data
export const MOCK_USER_STORIES: UserStory[] = [
  {
    userId: 'u1',
    userName: 'Amara J.',
    userAvatar: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=200',
    stories: [
      {
        id: 's1',
        type: 'image',
        content: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800',
        duration: 5,
        views: 234,
        createdAt: new Date(Date.now() - 3600000).toISOString(),
      },
    ],
    hasUnseenStories: true,
    lastUpdated: new Date(Date.now() - 1800000).toISOString(),
  },
  {
    userId: 'g1',
    userName: 'Fatou Diop',
    userAvatar: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=200&h=200&fit=crop&crop=face',
    stories: [
      {
        id: 's2',
        type: 'text',
        content: 'Just launched my new collection!',
        backgroundColor: '#7C3AED',
        textColor: '#FFFFFF',
        duration: 5,
        views: 189,
        createdAt: new Date(Date.now() - 7200000).toISOString(),
      },
    ],
    hasUnseenStories: true,
    lastUpdated: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    userId: 'g2',
    userName: 'Kofi Mensah',
    userAvatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&h=200&fit=crop&crop=face',
    stories: [
      {
        id: 's3',
        type: 'image',
        content: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800',
        duration: 5,
        views: 456,
        createdAt: new Date(Date.now() - 14400000).toISOString(),
      },
    ],
    hasUnseenStories: false,
    lastUpdated: new Date(Date.now() - 14400000).toISOString(),
  },
];

interface AppState {
  // User state
  currentUser: User | null;
  isOnboarded: boolean;
  isGuest: boolean;
  hasSeenWelcome: boolean;

  // Location state
  selectedLocation: LocationData | null;
  locationDetectionDismissed: boolean;
  lastDetectedCity: string | null;

  // Community state
  currentCommunity: Community | null;
  feedFilter: 'local' | 'global';
  communityMemberCounts: Record<string, number>; // city -> member count

  // Posts state
  userPosts: Post[];
  savedPostIds: string[];
  likedPostIds: string[];
  userComments: Comment[];
  postReactions: Record<string, string>; // postId -> emoji reaction

  // Connections state
  connections: User[];

  // Marketplace state
  userListings: MarketplaceListing[];

  // Business state
  userBusinesses: Business[];

  // Faith events state
  userFaithEvents: FaithEvent[];

  // Life events state
  lifeEvents: LifeEvent[];

  // Event RSVPs state
  eventRsvps: EventRsvp[];

  // Connect/Neighbor state
  neighborProfile: NeighborProfile | null;
  connectedNeighbors: string[];  // IDs of users we've connected with
  likedNeighbors: string[];  // IDs of users we've "liked"

  // Appointments state
  userAppointments: Appointment[];  // Appointments user has booked
  businessAppointments: Appointment[];  // Appointments for user's businesses

  // Business booking settings
  businessBookingSettings: BusinessBookingSettings[];

  // Seller stats
  inAppSalesCount: number;

  // Settings
  notificationsEnabled: boolean;

  // Serve & Connect - Talent Directory
  userTalentProfile: ServeTalent | null;
  savedTalentIds: string[];

  // Gift/Wallet state
  giftTransactions: GiftTransaction[];

  // Daily Rewards state
  dailyRewards: DailyRewardsState;

  // Stories state
  userStories: UserStory[];
  storyBlockedUserIds: string[]; // Users blocked from seeing current user's stories
  markStoryAsSeen: (userId: string) => void;
  addStory: (story: StoryItem) => void;
  deleteStory: (storyId: string) => void;
  blockUserFromStories: (userId: string) => void;
  unblockUserFromStories: (userId: string) => void;

  // Actions
  setCurrentUser: (user: User | null) => void;
  setIsOnboarded: (value: boolean) => void;
  setIsGuest: (value: boolean) => void;
  setHasSeenWelcome: (value: boolean) => void;
  setSelectedLocation: (location: LocationData | null) => void;
  setCurrentCommunity: (community: Community | null) => void;
  setFeedFilter: (filter: 'local' | 'global') => void;
  joinCommunity: (city: string) => void;
  addPost: (post: Post) => void;
  deletePost: (postId: string) => void;
  toggleSavePost: (postId: string) => void;
  toggleLikePost: (postId: string) => void;
  setPostReaction: (postId: string, emoji: string | null) => void;
  addComment: (comment: Comment) => void;
  addConnection: (user: User) => void;
  removeConnection: (userId: string) => void;
  addMarketplaceListing: (listing: MarketplaceListing) => void;
  deleteMarketplaceListing: (listingId: string) => void;
  markListingAsSold: (listingId: string) => void;
  addBusiness: (business: Business) => void;
  deleteBusiness: (businessId: string) => void;
  addFaithEvent: (event: FaithEvent) => void;
  addLifeEvent: (event: LifeEvent) => void;
  deleteLifeEvent: (eventId: string) => void;
  setEventRsvp: (eventId: string, status: 'interested' | 'going' | null) => void;
  setNotificationsEnabled: (enabled: boolean) => void;
  setLocationDetectionDismissed: (dismissed: boolean) => void;
  setLastDetectedCity: (city: string | null) => void;
  incrementInAppSalesCount: () => void;
  setNeighborProfile: (profile: NeighborProfile | null) => void;
  toggleLikeNeighbor: (userId: string) => void;
  addConnectedNeighbor: (userId: string) => void;
  removeConnectedNeighbor: (userId: string) => void;
  addAppointment: (appointment: Appointment) => void;
  updateAppointmentStatus: (appointmentId: string, status: Appointment['status']) => void;
  cancelAppointment: (appointmentId: string) => void;
  addBusinessAppointment: (appointment: Appointment) => void;
  // Business booking settings actions
  setBusinessBookingSettings: (settings: BusinessBookingSettings) => void;
  updateBusinessBookingSettings: (businessId: string, updates: Partial<BusinessBookingSettings>) => void;
  addBlockedDate: (businessId: string, date: string) => void;
  removeBlockedDate: (businessId: string, date: string) => void;
  addBlockedTimeSlot: (businessId: string, date: string, time: string) => void;
  removeBlockedTimeSlot: (businessId: string, date: string, time: string) => void;
  incrementBusinessBookings: (businessId: string) => void;
  // Serve & Connect - Talent Directory actions
  setUserTalentProfile: (profile: ServeTalent | null) => void;
  updateUserTalentProfile: (updates: Partial<ServeTalent>) => void;
  toggleSaveTalent: (talentId: string) => void;
  // Gift/Wallet actions
  addGems: (amount: number) => void;
  deductGems: (amount: number) => boolean;
  sendGift: (transaction: Omit<GiftTransaction, 'id' | 'timestamp'>) => boolean;
  receiveGift: (giftValue: number, senderName: string, giftName: string) => void;
  addGiftTransaction: (transaction: GiftTransaction) => void;
  // Daily Rewards actions
  claimDailyReward: (dayNumber: number, gemAmount: number) => void;
  resetWeeklyRewards: () => void;
  logout: () => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      currentUser: null,
      isOnboarded: false,
      isGuest: false,
      hasSeenWelcome: false,
      selectedLocation: null,
      locationDetectionDismissed: false,
      lastDetectedCity: null,
      currentCommunity: null,
      feedFilter: 'local',
      communityMemberCounts: {},
      userPosts: [],
      savedPostIds: [],
      likedPostIds: [],
      userComments: [],
      connections: [],
      userListings: [],
      userBusinesses: [],
      userFaithEvents: [],
      lifeEvents: [],
      eventRsvps: [],
      neighborProfile: null,
      connectedNeighbors: [],
      likedNeighbors: [],
      userAppointments: [],
      businessAppointments: [],
      businessBookingSettings: [],
      inAppSalesCount: 0,
      notificationsEnabled: true,
      userTalentProfile: null,
      savedTalentIds: [],
      postReactions: {},
      giftTransactions: [],
      dailyRewards: {
        currentStreak: 0,
        longestStreak: 0,
        lastClaimDate: null,
        totalDaysClaimed: 0,
        claimedDays: [],
        weekStartDate: null,
      },
      userStories: MOCK_USER_STORIES,
      storyBlockedUserIds: [],
      markStoryAsSeen: (userId) => set((state) => ({
        userStories: state.userStories.map((story) =>
          story.userId === userId ? { ...story, hasUnseenStories: false } : story
        ),
      })),
      addStory: (story) => set((state) => {
        const currentUser = state.currentUser;
        if (!currentUser) return state;

        const existingUserStory = state.userStories.find((us) => us.userId === currentUser.id);

        if (existingUserStory) {
          // Add to existing user's stories
          return {
            userStories: state.userStories.map((us) =>
              us.userId === currentUser.id
                ? {
                    ...us,
                    stories: [story, ...us.stories],
                    hasUnseenStories: true,
                    lastUpdated: new Date().toISOString(),
                  }
                : us
            ),
          };
        } else {
          // Create new user story entry
          const newUserStory: UserStory = {
            userId: currentUser.id,
            userName: currentUser.name,
            userAvatar: currentUser.avatar,
            stories: [story],
            hasUnseenStories: true,
            lastUpdated: new Date().toISOString(),
            blockedUserIds: state.storyBlockedUserIds,
          };
          return {
            userStories: [newUserStory, ...state.userStories],
          };
        }
      }),
      deleteStory: (storyId) => set((state) => {
        const currentUser = state.currentUser;
        if (!currentUser) return state;

        return {
          userStories: state.userStories.map((us) =>
            us.userId === currentUser.id
              ? {
                  ...us,
                  stories: us.stories.filter((s) => s.id !== storyId),
                }
              : us
          ).filter((us) => us.stories.length > 0), // Remove user entry if no stories left
        };
      }),
      blockUserFromStories: (userId) => set((state) => ({
        storyBlockedUserIds: [...state.storyBlockedUserIds, userId],
      })),
      unblockUserFromStories: (userId) => set((state) => ({
        storyBlockedUserIds: state.storyBlockedUserIds.filter((id) => id !== userId),
      })),

      setCurrentUser: (user) => set({ currentUser: user }),
      setIsOnboarded: (value) => set({ isOnboarded: value }),
      setIsGuest: (value) => set({ isGuest: value }),
      setHasSeenWelcome: (value) => set({ hasSeenWelcome: value }),
      setSelectedLocation: (location) => set({ selectedLocation: location }),
      setCurrentCommunity: (community) => set({ currentCommunity: community }),
      setFeedFilter: (filter) => set({ feedFilter: filter }),
      joinCommunity: (city) => set((state) => {
        const currentCount = state.communityMemberCounts[city] || 0;
        // Base counts for popular cities (simulated existing members)
        const baseCounts: Record<string, number> = {
          'Atlanta': 1247,
          'Houston': 982,
          'New York': 2341,
          'Los Angeles': 1563,
          'Chicago': 876,
          'Dallas': 654,
          'Denver': 432,
          'Aurora': 287,
          'Miami': 765,
          'Washington': 543,
          'London': 1123,
          'Toronto': 654,
          'Lagos': 3421,
          'Accra': 1876,
          'Nairobi': 1234,
          'Johannesburg': 987,
        };
        const baseCount = baseCounts[city] || Math.floor(Math.random() * 200) + 50;
        return {
          communityMemberCounts: {
            ...state.communityMemberCounts,
            [city]: currentCount > 0 ? currentCount + 1 : baseCount + 1,
          },
        };
      }),
      addPost: (post) => set((state) => ({ userPosts: [post, ...state.userPosts] })),
      deletePost: (postId) => set((state) => ({
        userPosts: state.userPosts.filter((p) => p.id !== postId),
      })),
      toggleSavePost: (postId) => set((state) => ({
        savedPostIds: state.savedPostIds.includes(postId)
          ? state.savedPostIds.filter((id) => id !== postId)
          : [...state.savedPostIds, postId],
      })),
      toggleLikePost: (postId) => set((state) => ({
        likedPostIds: state.likedPostIds.includes(postId)
          ? state.likedPostIds.filter((id) => id !== postId)
          : [...state.likedPostIds, postId],
      })),
      setPostReaction: (postId, emoji) => set((state) => {
        const newReactions = { ...state.postReactions };
        if (emoji === null) {
          delete newReactions[postId];
        } else {
          newReactions[postId] = emoji;
        }
        return { postReactions: newReactions };
      }),
      addComment: (comment) => set((state) => ({ userComments: [...state.userComments, comment] })),
      addConnection: (user) => set((state) => ({
        connections: state.connections.some((c) => c.id === user.id)
          ? state.connections
          : [...state.connections, user],
      })),
      removeConnection: (userId) => set((state) => ({
        connections: state.connections.filter((c) => c.id !== userId),
      })),
      addMarketplaceListing: (listing) => set((state) => ({ userListings: [listing, ...state.userListings] })),
      deleteMarketplaceListing: (listingId) => set((state) => ({
        userListings: state.userListings.filter((l) => l.id !== listingId),
      })),
      markListingAsSold: (listingId) => set((state) => ({
        userListings: state.userListings.map((l) =>
          l.id === listingId ? { ...l, isSold: true } : l
        ),
      })),
      addBusiness: (business) => set((state) => ({ userBusinesses: [business, ...state.userBusinesses] })),
      deleteBusiness: (businessId) => set((state) => ({
        userBusinesses: state.userBusinesses.filter((b) => b.id !== businessId),
      })),
      addFaithEvent: (event) => set((state) => ({ userFaithEvents: [event, ...state.userFaithEvents] })),
      addLifeEvent: (event) => set((state) => ({ lifeEvents: [event, ...state.lifeEvents] })),
      deleteLifeEvent: (eventId) => set((state) => ({
        lifeEvents: state.lifeEvents.filter((e) => e.id !== eventId),
      })),
      setEventRsvp: (eventId, status) => set((state) => {
        if (status === null) {
          return { eventRsvps: state.eventRsvps.filter((r) => r.eventId !== eventId) };
        }
        const existing = state.eventRsvps.find((r) => r.eventId === eventId);
        if (existing) {
          return {
            eventRsvps: state.eventRsvps.map((r) =>
              r.eventId === eventId ? { ...r, status } : r
            ),
          };
        }
        return { eventRsvps: [...state.eventRsvps, { eventId, status }] };
      }),
      setNotificationsEnabled: (enabled) => set({ notificationsEnabled: enabled }),
      setLocationDetectionDismissed: (dismissed) => set({ locationDetectionDismissed: dismissed }),
      setLastDetectedCity: (city) => set({ lastDetectedCity: city }),
      incrementInAppSalesCount: () => set((state) => ({ inAppSalesCount: state.inAppSalesCount + 1 })),
      setNeighborProfile: (profile) => set({ neighborProfile: profile }),
      toggleLikeNeighbor: (userId) => set((state) => ({
        likedNeighbors: state.likedNeighbors.includes(userId)
          ? state.likedNeighbors.filter((id) => id !== userId)
          : [...state.likedNeighbors, userId],
      })),
      addConnectedNeighbor: (userId) => set((state) => ({
        connectedNeighbors: state.connectedNeighbors.includes(userId)
          ? state.connectedNeighbors
          : [...state.connectedNeighbors, userId],
      })),
      removeConnectedNeighbor: (userId) => set((state) => ({
        connectedNeighbors: state.connectedNeighbors.filter((id) => id !== userId),
      })),
      addAppointment: (appointment) => set((state) => ({
        userAppointments: [appointment, ...state.userAppointments],
      })),
      updateAppointmentStatus: (appointmentId, status) => set((state) => ({
        userAppointments: state.userAppointments.map((a) =>
          a.id === appointmentId ? { ...a, status } : a
        ),
        businessAppointments: state.businessAppointments.map((a) =>
          a.id === appointmentId ? { ...a, status } : a
        ),
      })),
      cancelAppointment: (appointmentId) => set((state) => ({
        userAppointments: state.userAppointments.map((a) =>
          a.id === appointmentId ? { ...a, status: 'cancelled' as const } : a
        ),
        businessAppointments: state.businessAppointments.map((a) =>
          a.id === appointmentId ? { ...a, status: 'cancelled' as const } : a
        ),
      })),
      addBusinessAppointment: (appointment) => set((state) => ({
        businessAppointments: [appointment, ...state.businessAppointments],
      })),
      // Business booking settings actions
      setBusinessBookingSettings: (settings) => set((state) => {
        const existing = state.businessBookingSettings.findIndex(
          (s) => s.businessId === settings.businessId
        );
        if (existing >= 0) {
          const updated = [...state.businessBookingSettings];
          updated[existing] = settings;
          return { businessBookingSettings: updated };
        }
        return { businessBookingSettings: [...state.businessBookingSettings, settings] };
      }),
      updateBusinessBookingSettings: (businessId, updates) => set((state) => ({
        businessBookingSettings: state.businessBookingSettings.map((s) =>
          s.businessId === businessId ? { ...s, ...updates } : s
        ),
      })),
      addBlockedDate: (businessId, date) => set((state) => ({
        businessBookingSettings: state.businessBookingSettings.map((s) =>
          s.businessId === businessId
            ? { ...s, blockedDates: [...s.blockedDates, date] }
            : s
        ),
      })),
      removeBlockedDate: (businessId, date) => set((state) => ({
        businessBookingSettings: state.businessBookingSettings.map((s) =>
          s.businessId === businessId
            ? { ...s, blockedDates: s.blockedDates.filter((d) => d !== date) }
            : s
        ),
      })),
      addBlockedTimeSlot: (businessId, date, time) => set((state) => ({
        businessBookingSettings: state.businessBookingSettings.map((s) =>
          s.businessId === businessId
            ? { ...s, blockedTimeSlots: [...s.blockedTimeSlots, { id: Date.now().toString(), date, time }] }
            : s
        ),
      })),
      removeBlockedTimeSlot: (businessId, date, time) => set((state) => ({
        businessBookingSettings: state.businessBookingSettings.map((s) =>
          s.businessId === businessId
            ? {
                ...s,
                blockedTimeSlots: s.blockedTimeSlots.filter(
                  (slot) => !(slot.date === date && slot.time === time)
                ),
              }
            : s
        ),
      })),
      incrementBusinessBookings: (businessId) => set((state) => ({
        businessBookingSettings: state.businessBookingSettings.map((s) =>
          s.businessId === businessId
            ? { ...s, totalBookingsReceived: s.totalBookingsReceived + 1 }
            : s
        ),
      })),
      // Serve & Connect - Talent Directory actions
      setUserTalentProfile: (profile) => set({ userTalentProfile: profile }),
      updateUserTalentProfile: (updates) => set((state) => ({
        userTalentProfile: state.userTalentProfile
          ? { ...state.userTalentProfile, ...updates }
          : null,
      })),
      toggleSaveTalent: (talentId) => set((state) => ({
        savedTalentIds: state.savedTalentIds.includes(talentId)
          ? state.savedTalentIds.filter((id) => id !== talentId)
          : [...state.savedTalentIds, talentId],
      })),
      addGems: (amount) => set((state) => {
        if (!state.currentUser) return state;
        return {
          currentUser: {
            ...state.currentUser,
            gemBalance: (state.currentUser.gemBalance ?? 500) + amount,
          },
        };
      }),
      deductGems: (amount) => {
        let success = false;
        set((state) => {
          if (!state.currentUser) return state;
          const currentBalance = state.currentUser.gemBalance ?? 500;
          if (currentBalance < amount) {
            success = false;
            return state;
          }
          success = true;
          return {
            currentUser: {
              ...state.currentUser,
              gemBalance: currentBalance - amount,
              totalGemsSent: (state.currentUser.totalGemsSent ?? 0) + amount,
            },
          };
        });
        return success;
      },
      sendGift: (transaction) => {
        let success = false;
        set((state) => {
          if (!state.currentUser) return state;
          const currentBalance = state.currentUser.gemBalance ?? 500;
          if (currentBalance < transaction.giftValue) {
            success = false;
            return state;
          }
          success = true;
          const newTransaction: GiftTransaction = {
            ...transaction,
            id: `gift_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            timestamp: new Date().toISOString(),
          };
          return {
            currentUser: {
              ...state.currentUser,
              gemBalance: currentBalance - transaction.giftValue,
              totalGemsSent: (state.currentUser.totalGemsSent ?? 0) + transaction.giftValue,
            },
            giftTransactions: [newTransaction, ...state.giftTransactions],
          };
        });
        return success;
      },
      receiveGift: (giftValue, senderName, giftName) => set((state) => {
        if (!state.currentUser) return state;
        const newTransaction: GiftTransaction = {
          id: `gift_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: 'received',
          giftId: giftName.toLowerCase(),
          giftName,
          giftValue,
          senderName,
          recipientId: state.currentUser.id,
          recipientName: state.currentUser.name,
          timestamp: new Date().toISOString(),
        };
        return {
          currentUser: {
            ...state.currentUser,
            gemBalance: (state.currentUser.gemBalance ?? 500) + giftValue,
            totalGemsEarned: (state.currentUser.totalGemsEarned ?? 0) + giftValue,
          },
          giftTransactions: [newTransaction, ...state.giftTransactions],
        };
      }),
      addGiftTransaction: (transaction) => set((state) => ({
        giftTransactions: [transaction, ...state.giftTransactions],
      })),
      // Daily Rewards actions
      claimDailyReward: (dayNumber, gemAmount) => set((state) => {
        const today = new Date().toISOString().split('T')[0];
        const newClaimedDays = [...state.dailyRewards.claimedDays, dayNumber];
        const newStreak = state.dailyRewards.currentStreak + 1;
        const newLongestStreak = Math.max(newStreak, state.dailyRewards.longestStreak);

        // Add gems to user balance
        const currentBalance = state.currentUser?.gemBalance ?? 500;

        return {
          dailyRewards: {
            ...state.dailyRewards,
            currentStreak: newStreak,
            longestStreak: newLongestStreak,
            lastClaimDate: today,
            totalDaysClaimed: state.dailyRewards.totalDaysClaimed + 1,
            claimedDays: newClaimedDays,
            weekStartDate: state.dailyRewards.weekStartDate || today,
          },
          currentUser: state.currentUser ? {
            ...state.currentUser,
            gemBalance: currentBalance + gemAmount,
          } : null,
        };
      }),
      resetWeeklyRewards: () => set((state) => ({
        dailyRewards: {
          ...state.dailyRewards,
          claimedDays: [],
          weekStartDate: new Date().toISOString().split('T')[0],
        },
      })),
      logout: () => set({ currentUser: null, isOnboarded: false, isGuest: false }),
    }),
    {
      name: 'diaspora-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        currentUser: state.currentUser,
        isOnboarded: state.isOnboarded,
        isGuest: state.isGuest,
        hasSeenWelcome: state.hasSeenWelcome,
        selectedLocation: state.selectedLocation,
        locationDetectionDismissed: state.locationDetectionDismissed,
        lastDetectedCity: state.lastDetectedCity,
        currentCommunity: state.currentCommunity,
        userPosts: state.userPosts,
        savedPostIds: state.savedPostIds,
        likedPostIds: state.likedPostIds,
        userComments: state.userComments,
        inAppSalesCount: state.inAppSalesCount,
        connections: state.connections,
        lifeEvents: state.lifeEvents,
        userBusinesses: state.userBusinesses,
        userListings: state.userListings,
        eventRsvps: state.eventRsvps,
        notificationsEnabled: state.notificationsEnabled,
        neighborProfile: state.neighborProfile,
        connectedNeighbors: state.connectedNeighbors,
        likedNeighbors: state.likedNeighbors,
        userAppointments: state.userAppointments,
        businessAppointments: state.businessAppointments,
        businessBookingSettings: state.businessBookingSettings,
        communityMemberCounts: state.communityMemberCounts,
        giftTransactions: state.giftTransactions,
        dailyRewards: state.dailyRewards,
      }),
    }
  )
);

// Helper function to get community member count
export const getCommunityMemberCount = (city: string): number => {
  const state = useStore.getState();
  const count = state.communityMemberCounts[city];
  if (count) return count;

  // Base counts for popular cities (simulated existing members)
  const baseCounts: Record<string, number> = {
    'Atlanta': 1247,
    'Houston': 982,
    'New York': 2341,
    'Los Angeles': 1563,
    'Chicago': 876,
    'Dallas': 654,
    'Denver': 432,
    'Aurora': 287,
    'Miami': 765,
    'Washington': 543,
    'London': 1123,
    'Toronto': 654,
    'Lagos': 3421,
    'Accra': 1876,
    'Nairobi': 1234,
    'Johannesburg': 987,
  };
  return baseCounts[city] || Math.floor(Math.random() * 200) + 50;
};

// Countries with states/regions
export const COUNTRIES = [
  // Africa
  { code: 'DZ', name: 'Algeria', hasStates: true },
  { code: 'AO', name: 'Angola', hasStates: true },
  { code: 'BJ', name: 'Benin', hasStates: true },
  { code: 'BW', name: 'Botswana', hasStates: true },
  { code: 'BF', name: 'Burkina Faso', hasStates: true },
  { code: 'BI', name: 'Burundi', hasStates: true },
  { code: 'CV', name: 'Cape Verde', hasStates: false },
  { code: 'CM', name: 'Cameroon', hasStates: true },
  { code: 'CF', name: 'Central African Republic', hasStates: true },
  { code: 'TD', name: 'Chad', hasStates: true },
  { code: 'KM', name: 'Comoros', hasStates: false },
  { code: 'CG', name: 'Congo', hasStates: true },
  { code: 'CD', name: 'DR Congo', hasStates: true },
  { code: 'DJ', name: 'Djibouti', hasStates: false },
  { code: 'EG', name: 'Egypt', hasStates: true },
  { code: 'GQ', name: 'Equatorial Guinea', hasStates: false },
  { code: 'ER', name: 'Eritrea', hasStates: true },
  { code: 'SZ', name: 'Eswatini', hasStates: false },
  { code: 'ET', name: 'Ethiopia', hasStates: true },
  { code: 'GA', name: 'Gabon', hasStates: true },
  { code: 'GM', name: 'Gambia', hasStates: false },
  { code: 'GH', name: 'Ghana', hasStates: true },
  { code: 'GN', name: 'Guinea', hasStates: true },
  { code: 'GW', name: 'Guinea-Bissau', hasStates: false },
  { code: 'CI', name: 'Ivory Coast', hasStates: true },
  { code: 'KE', name: 'Kenya', hasStates: true },
  { code: 'LS', name: 'Lesotho', hasStates: false },
  { code: 'LR', name: 'Liberia', hasStates: true },
  { code: 'LY', name: 'Libya', hasStates: true },
  { code: 'MG', name: 'Madagascar', hasStates: true },
  { code: 'MW', name: 'Malawi', hasStates: true },
  { code: 'ML', name: 'Mali', hasStates: true },
  { code: 'MR', name: 'Mauritania', hasStates: true },
  { code: 'MU', name: 'Mauritius', hasStates: false },
  { code: 'MA', name: 'Morocco', hasStates: true },
  { code: 'MZ', name: 'Mozambique', hasStates: true },
  { code: 'NA', name: 'Namibia', hasStates: true },
  { code: 'NE', name: 'Niger', hasStates: true },
  { code: 'NG', name: 'Nigeria', hasStates: true },
  { code: 'RW', name: 'Rwanda', hasStates: true },
  { code: 'ST', name: 'Sao Tome and Principe', hasStates: false },
  { code: 'SN', name: 'Senegal', hasStates: true },
  { code: 'SC', name: 'Seychelles', hasStates: false },
  { code: 'SL', name: 'Sierra Leone', hasStates: true },
  { code: 'SO', name: 'Somalia', hasStates: true },
  { code: 'ZA', name: 'South Africa', hasStates: true },
  { code: 'SS', name: 'South Sudan', hasStates: true },
  { code: 'SD', name: 'Sudan', hasStates: true },
  { code: 'TZ', name: 'Tanzania', hasStates: true },
  { code: 'TG', name: 'Togo', hasStates: true },
  { code: 'TN', name: 'Tunisia', hasStates: true },
  { code: 'UG', name: 'Uganda', hasStates: true },
  { code: 'ZM', name: 'Zambia', hasStates: true },
  { code: 'ZW', name: 'Zimbabwe', hasStates: true },

  // Asia
  { code: 'AF', name: 'Afghanistan', hasStates: true },
  { code: 'AM', name: 'Armenia', hasStates: true },
  { code: 'AZ', name: 'Azerbaijan', hasStates: true },
  { code: 'BH', name: 'Bahrain', hasStates: false },
  { code: 'BD', name: 'Bangladesh', hasStates: true },
  { code: 'BT', name: 'Bhutan', hasStates: true },
  { code: 'BN', name: 'Brunei', hasStates: false },
  { code: 'KH', name: 'Cambodia', hasStates: true },
  { code: 'CN', name: 'China', hasStates: true },
  { code: 'CY', name: 'Cyprus', hasStates: false },
  { code: 'GE', name: 'Georgia', hasStates: true },
  { code: 'IN', name: 'India', hasStates: true },
  { code: 'ID', name: 'Indonesia', hasStates: true },
  { code: 'IR', name: 'Iran', hasStates: true },
  { code: 'IQ', name: 'Iraq', hasStates: true },
  { code: 'IL', name: 'Israel', hasStates: true },
  { code: 'JP', name: 'Japan', hasStates: true },
  { code: 'JO', name: 'Jordan', hasStates: true },
  { code: 'KZ', name: 'Kazakhstan', hasStates: true },
  { code: 'KW', name: 'Kuwait', hasStates: true },
  { code: 'KG', name: 'Kyrgyzstan', hasStates: true },
  { code: 'LA', name: 'Laos', hasStates: true },
  { code: 'LB', name: 'Lebanon', hasStates: true },
  { code: 'MY', name: 'Malaysia', hasStates: true },
  { code: 'MV', name: 'Maldives', hasStates: false },
  { code: 'MN', name: 'Mongolia', hasStates: true },
  { code: 'MM', name: 'Myanmar', hasStates: true },
  { code: 'NP', name: 'Nepal', hasStates: true },
  { code: 'KP', name: 'North Korea', hasStates: true },
  { code: 'OM', name: 'Oman', hasStates: true },
  { code: 'PK', name: 'Pakistan', hasStates: true },
  { code: 'PS', name: 'Palestine', hasStates: true },
  { code: 'PH', name: 'Philippines', hasStates: true },
  { code: 'QA', name: 'Qatar', hasStates: false },
  { code: 'SA', name: 'Saudi Arabia', hasStates: true },
  { code: 'SG', name: 'Singapore', hasStates: false },
  { code: 'KR', name: 'South Korea', hasStates: true },
  { code: 'LK', name: 'Sri Lanka', hasStates: true },
  { code: 'SY', name: 'Syria', hasStates: true },
  { code: 'TW', name: 'Taiwan', hasStates: true },
  { code: 'TJ', name: 'Tajikistan', hasStates: true },
  { code: 'TH', name: 'Thailand', hasStates: true },
  { code: 'TL', name: 'Timor-Leste', hasStates: false },
  { code: 'TR', name: 'Turkey', hasStates: true },
  { code: 'TM', name: 'Turkmenistan', hasStates: true },
  { code: 'AE', name: 'United Arab Emirates', hasStates: true },
  { code: 'UZ', name: 'Uzbekistan', hasStates: true },
  { code: 'VN', name: 'Vietnam', hasStates: true },
  { code: 'YE', name: 'Yemen', hasStates: true },

  // Europe
  { code: 'AL', name: 'Albania', hasStates: true },
  { code: 'AD', name: 'Andorra', hasStates: false },
  { code: 'AT', name: 'Austria', hasStates: true },
  { code: 'BY', name: 'Belarus', hasStates: true },
  { code: 'BE', name: 'Belgium', hasStates: true },
  { code: 'BA', name: 'Bosnia and Herzegovina', hasStates: true },
  { code: 'BG', name: 'Bulgaria', hasStates: true },
  { code: 'HR', name: 'Croatia', hasStates: true },
  { code: 'CZ', name: 'Czech Republic', hasStates: true },
  { code: 'DK', name: 'Denmark', hasStates: true },
  { code: 'EE', name: 'Estonia', hasStates: true },
  { code: 'FI', name: 'Finland', hasStates: true },
  { code: 'FR', name: 'France', hasStates: true },
  { code: 'DE', name: 'Germany', hasStates: true },
  { code: 'GR', name: 'Greece', hasStates: true },
  { code: 'HU', name: 'Hungary', hasStates: true },
  { code: 'IS', name: 'Iceland', hasStates: false },
  { code: 'IE', name: 'Ireland', hasStates: true },
  { code: 'IT', name: 'Italy', hasStates: true },
  { code: 'XK', name: 'Kosovo', hasStates: true },
  { code: 'LV', name: 'Latvia', hasStates: true },
  { code: 'LI', name: 'Liechtenstein', hasStates: false },
  { code: 'LT', name: 'Lithuania', hasStates: true },
  { code: 'LU', name: 'Luxembourg', hasStates: false },
  { code: 'MT', name: 'Malta', hasStates: false },
  { code: 'MD', name: 'Moldova', hasStates: true },
  { code: 'MC', name: 'Monaco', hasStates: false },
  { code: 'ME', name: 'Montenegro', hasStates: true },
  { code: 'NL', name: 'Netherlands', hasStates: true },
  { code: 'MK', name: 'North Macedonia', hasStates: true },
  { code: 'NO', name: 'Norway', hasStates: true },
  { code: 'PL', name: 'Poland', hasStates: true },
  { code: 'PT', name: 'Portugal', hasStates: true },
  { code: 'RO', name: 'Romania', hasStates: true },
  { code: 'RU', name: 'Russia', hasStates: true },
  { code: 'SM', name: 'San Marino', hasStates: false },
  { code: 'RS', name: 'Serbia', hasStates: true },
  { code: 'SK', name: 'Slovakia', hasStates: true },
  { code: 'SI', name: 'Slovenia', hasStates: true },
  { code: 'ES', name: 'Spain', hasStates: true },
  { code: 'SE', name: 'Sweden', hasStates: true },
  { code: 'CH', name: 'Switzerland', hasStates: true },
  { code: 'UA', name: 'Ukraine', hasStates: true },
  { code: 'GB', name: 'United Kingdom', hasStates: true },
  { code: 'VA', name: 'Vatican City', hasStates: false },

  // North America
  { code: 'AG', name: 'Antigua and Barbuda', hasStates: false },
  { code: 'BS', name: 'Bahamas', hasStates: false },
  { code: 'BB', name: 'Barbados', hasStates: false },
  { code: 'BZ', name: 'Belize', hasStates: true },
  { code: 'CA', name: 'Canada', hasStates: true },
  { code: 'CR', name: 'Costa Rica', hasStates: true },
  { code: 'CU', name: 'Cuba', hasStates: true },
  { code: 'DM', name: 'Dominica', hasStates: false },
  { code: 'DO', name: 'Dominican Republic', hasStates: true },
  { code: 'SV', name: 'El Salvador', hasStates: true },
  { code: 'GD', name: 'Grenada', hasStates: false },
  { code: 'GT', name: 'Guatemala', hasStates: true },
  { code: 'HT', name: 'Haiti', hasStates: true },
  { code: 'HN', name: 'Honduras', hasStates: true },
  { code: 'JM', name: 'Jamaica', hasStates: true },
  { code: 'MX', name: 'Mexico', hasStates: true },
  { code: 'NI', name: 'Nicaragua', hasStates: true },
  { code: 'PA', name: 'Panama', hasStates: true },
  { code: 'KN', name: 'Saint Kitts and Nevis', hasStates: false },
  { code: 'LC', name: 'Saint Lucia', hasStates: false },
  { code: 'VC', name: 'Saint Vincent and the Grenadines', hasStates: false },
  { code: 'TT', name: 'Trinidad and Tobago', hasStates: false },
  { code: 'US', name: 'United States', hasStates: true },

  // South America
  { code: 'AR', name: 'Argentina', hasStates: true },
  { code: 'BO', name: 'Bolivia', hasStates: true },
  { code: 'BR', name: 'Brazil', hasStates: true },
  { code: 'CL', name: 'Chile', hasStates: true },
  { code: 'CO', name: 'Colombia', hasStates: true },
  { code: 'EC', name: 'Ecuador', hasStates: true },
  { code: 'GY', name: 'Guyana', hasStates: true },
  { code: 'PY', name: 'Paraguay', hasStates: true },
  { code: 'PE', name: 'Peru', hasStates: true },
  { code: 'SR', name: 'Suriname', hasStates: false },
  { code: 'UY', name: 'Uruguay', hasStates: true },
  { code: 'VE', name: 'Venezuela', hasStates: true },

  // Oceania
  { code: 'AU', name: 'Australia', hasStates: true },
  { code: 'FJ', name: 'Fiji', hasStates: false },
  { code: 'KI', name: 'Kiribati', hasStates: false },
  { code: 'MH', name: 'Marshall Islands', hasStates: false },
  { code: 'FM', name: 'Micronesia', hasStates: false },
  { code: 'NR', name: 'Nauru', hasStates: false },
  { code: 'NZ', name: 'New Zealand', hasStates: true },
  { code: 'PW', name: 'Palau', hasStates: false },
  { code: 'PG', name: 'Papua New Guinea', hasStates: true },
  { code: 'WS', name: 'Samoa', hasStates: false },
  { code: 'SB', name: 'Solomon Islands', hasStates: false },
  { code: 'TO', name: 'Tonga', hasStates: false },
  { code: 'TV', name: 'Tuvalu', hasStates: false },
  { code: 'VU', name: 'Vanuatu', hasStates: false },
];

export const STATES_BY_COUNTRY: Record<string, string[]> = {
  // Africa
  DZ: ['Algiers', 'Oran', 'Constantine', 'Annaba', 'Blida'],
  AO: ['Luanda', 'Benguela', 'Huambo', 'Lubango', 'Cabinda'],
  BJ: ['Littoral Benin', 'Atlantique', 'Oueme', 'Borgou', 'Zou'],
  BW: ['South-East', 'Kweneng', 'Central', 'North-East', 'Gaborone'],
  BF: ['Centre', 'Hauts-Bassins', 'Sahel', 'Est', 'Nord'],
  BI: ['Bujumbura Mairie', 'Gitega', 'Ngozi', 'Bururi', 'Muyinga'],
  CM: ['Centre', 'Littoral Cameroon', 'West', 'Southwest', 'Northwest'],
  CF: ['Bangui', 'Ombella-Mpoko', 'Ouaka', 'Nana-Mambere', 'Lobaye'],
  TD: ['N\'Djamena', 'Ouaddai', 'Logone Oriental', 'Mayo-Kebbi Est', 'Lac'],
  CG: ['Brazzaville', 'Pointe-Noire', 'Pool', 'Plateaux', 'Cuvette'],
  CD: ['Kinshasa', 'Katanga', 'South Kivu', 'North Kivu', 'Kasai'],
  EG: ['Cairo', 'Alexandria', 'Giza', 'Luxor', 'Aswan'],
  ER: ['Maekel', 'Debub', 'Anseba', 'Northern Red Sea', 'Gash-Barka'],
  ET: ['Addis Ababa', 'Oromia', 'Amhara', 'SNNPR', 'Tigray'],
  GA: ['Estuaire', 'Haut-Ogooue', 'Moyen-Ogooue', 'Ogooue-Maritime', 'Woleu-Ntem'],
  GH: ['Greater Accra', 'Ashanti', 'Western', 'Eastern', 'Central', 'Northern', 'Volta'],
  GN: ['Conakry', 'Kindia', 'Nzerekore', 'Kankan', 'Labe'],
  CI: ['Abidjan', 'Bouake', 'Yamoussoukro', 'Daloa', 'San-Pedro'],
  KE: ['Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Eldoret'],
  LR: ['Montserrado', 'Nimba', 'Bong', 'Grand Bassa', 'Lofa'],
  LY: ['Tripoli', 'Benghazi', 'Misrata', 'Zawiya', 'Bayda'],
  MG: ['Analamanga', 'Vakinankaratra', 'Atsinanana', 'Boeny', 'Diana'],
  MW: ['Central Malawi', 'Southern', 'Northern'],
  ML: ['Bamako', 'Sikasso', 'Segou', 'Koulikoro', 'Mopti'],
  MR: ['Nouakchott', 'Dakhlet Nouadhibou', 'Assaba', 'Hodh Ech Chargui', 'Trarza'],
  MA: ['Casablanca-Settat', 'Rabat-Sale-Kenitra', 'Fes-Meknes', 'Marrakech-Safi', 'Tanger-Tetouan-Al Hoceima'],
  MZ: ['Maputo', 'Gaza', 'Inhambane', 'Sofala', 'Nampula'],
  NA: ['Khomas', 'Erongo', 'Oshana', 'Omusati', 'Kavango East'],
  NE: ['Niamey', 'Zinder', 'Maradi', 'Tahoua', 'Agadez'],
  NG: ['Lagos', 'Abuja FCT', 'Kano', 'Rivers', 'Oyo', 'Kaduna', 'Enugu', 'Delta'],
  RW: ['Kigali', 'Eastern', 'Northern', 'Southern', 'Western'],
  SN: ['Dakar', 'Thies', 'Diourbel', 'Saint-Louis', 'Kaolack'],
  SL: ['Western Area', 'Eastern', 'Northern', 'Southern'],
  SO: ['Banaadir', 'Bay', 'Gedo', 'Lower Shabelle', 'Puntland'],
  ZA: ['Gauteng', 'Western Cape', 'KwaZulu-Natal', 'Eastern Cape', 'Free State'],
  SS: ['Central Equatoria', 'Western Equatoria', 'Jonglei', 'Upper Nile', 'Unity'],
  SD: ['Khartoum', 'Gezira', 'River Nile', 'North Darfur', 'South Darfur'],
  TZ: ['Dar es Salaam', 'Mwanza', 'Arusha', 'Dodoma', 'Zanzibar'],
  TG: ['Maritime', 'Plateaux', 'Centrale', 'Kara', 'Savanes'],
  TN: ['Tunis', 'Sfax', 'Sousse', 'Kairouan', 'Bizerte'],
  UG: ['Central Uganda', 'Eastern', 'Northern', 'Western'],
  ZM: ['Lusaka', 'Copperbelt', 'Southern', 'Eastern', 'Northern'],
  ZW: ['Harare', 'Bulawayo', 'Manicaland', 'Mashonaland East', 'Matabeleland North'],

  // Asia
  AF: ['Kabul', 'Herat', 'Balkh', 'Kandahar', 'Nangarhar'],
  AM: ['Yerevan', 'Shirak', 'Lori', 'Kotayk', 'Ararat'],
  AZ: ['Baku', 'Ganja', 'Sumgait', 'Mingachevir', 'Shirvan'],
  BD: ['Dhaka', 'Chittagong', 'Rajshahi', 'Khulna', 'Sylhet'],
  BT: ['Thimphu', 'Paro', 'Punakha', 'Wangdue Phodrang', 'Bumthang'],
  KH: ['Phnom Penh', 'Siem Reap', 'Battambang', 'Kampong Cham', 'Kandal'],
  CN: ['Beijing', 'Shanghai', 'Guangdong', 'Sichuan', 'Zhejiang', 'Jiangsu', 'Shandong'],
  GE: ['Tbilisi', 'Adjara', 'Imereti', 'Samegrelo', 'Kvemo Kartli'],
  IN: ['Maharashtra', 'Delhi', 'Karnataka', 'Tamil Nadu', 'Telangana', 'Gujarat', 'West Bengal', 'Rajasthan', 'Uttar Pradesh', 'Kerala'],
  ID: ['Jakarta', 'West Java', 'East Java', 'Central Java', 'Bali', 'North Sumatra'],
  IR: ['Tehran', 'Isfahan', 'Fars', 'Razavi Khorasan', 'Khuzestan'],
  IQ: ['Baghdad', 'Basra', 'Erbil', 'Sulaymaniyah', 'Nineveh'],
  IL: ['Tel Aviv', 'Jerusalem', 'Haifa', 'Central', 'Southern'],
  JP: ['Tokyo', 'Osaka', 'Kanagawa', 'Aichi', 'Fukuoka', 'Hokkaido', 'Kyoto'],
  JO: ['Amman', 'Zarqa', 'Irbid', 'Aqaba', 'Balqa'],
  KZ: ['Almaty', 'Nur-Sultan', 'Shymkent', 'Karaganda', 'Aktobe'],
  KW: ['Al Asimah', 'Hawalli', 'Farwaniya', 'Ahmadi', 'Jahra'],
  KG: ['Bishkek', 'Osh', 'Chuy', 'Jalal-Abad', 'Issyk-Kul'],
  LA: ['Vientiane', 'Savannakhet', 'Champasak', 'Luang Prabang', 'Oudomxay'],
  LB: ['Beirut', 'Mount Lebanon', 'North', 'South', 'Bekaa'],
  MY: ['Kuala Lumpur', 'Selangor', 'Johor', 'Penang', 'Sabah', 'Sarawak'],
  MN: ['Ulaanbaatar', 'Darkhan-Uul', 'Orkhon', 'South Gobi', 'Khovd'],
  MM: ['Yangon', 'Mandalay', 'Sagaing', 'Shan', 'Bago'],
  NP: ['Bagmati', 'Gandaki', 'Lumbini', 'Province 1', 'Province 2'],
  KP: ['Pyongyang', 'South Pyongan', 'North Hamgyong', 'South Hamgyong', 'Kangwon'],
  OM: ['Muscat', 'Dhofar', 'North Batinah', 'South Batinah', 'Dakhiliyah'],
  PK: ['Punjab', 'Sindh', 'Khyber Pakhtunkhwa', 'Balochistan', 'Islamabad'],
  PS: ['West Bank', 'Gaza Strip'],
  PH: ['Metro Manila', 'Cebu', 'Davao', 'Calabarzon', 'Central Luzon'],
  SA: ['Riyadh', 'Makkah', 'Eastern', 'Madinah', 'Asir'],
  KR: ['Seoul', 'Busan', 'Incheon', 'Daegu', 'Gyeonggi'],
  LK: ['Western', 'Central', 'Southern', 'Northern', 'Eastern'],
  SY: ['Damascus', 'Aleppo', 'Homs', 'Latakia', 'Hama'],
  TW: ['Taipei', 'Kaohsiung', 'Taichung', 'Tainan', 'New Taipei'],
  TJ: ['Dushanbe', 'Sughd', 'Khatlon', 'Gorno-Badakhshan', 'Districts of Republican Subordination'],
  TH: ['Bangkok', 'Chiang Mai', 'Phuket', 'Chonburi', 'Nakhon Ratchasima'],
  TR: ['Istanbul', 'Ankara', 'Izmir', 'Antalya', 'Bursa'],
  TM: ['Ashgabat', 'Mary', 'Lebap', 'Dashoguz', 'Balkan'],
  AE: ['Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman'],
  UZ: ['Tashkent', 'Samarkand', 'Bukhara', 'Fergana', 'Namangan'],
  VN: ['Ho Chi Minh City', 'Hanoi', 'Da Nang', 'Hai Phong', 'Can Tho'],
  YE: ['Sanaa', 'Aden', 'Taiz', 'Hodeidah', 'Hadramaut'],

  // Europe
  AL: ['Tirana', 'Durres', 'Vlore', 'Shkoder', 'Fier'],
  AT: ['Vienna', 'Lower Austria', 'Upper Austria', 'Styria', 'Tyrol'],
  BY: ['Minsk', 'Gomel', 'Mogilev', 'Vitebsk', 'Grodno'],
  BE: ['Brussels', 'Flanders', 'Wallonia'],
  BA: ['Federation of Bosnia and Herzegovina', 'Republika Srpska', 'Brcko District'],
  BG: ['Sofia', 'Plovdiv', 'Varna', 'Burgas', 'Stara Zagora'],
  HR: ['Zagreb', 'Split-Dalmatia', 'Primorje-Gorski Kotar', 'Osijek-Baranja', 'Istria'],
  CZ: ['Prague', 'Central Bohemia', 'South Moravia', 'Moravia-Silesia', 'Olomouc'],
  DK: ['Capital Region', 'Central Denmark', 'North Denmark', 'Zealand', 'South Denmark'],
  EE: ['Harju', 'Tartu', 'Ida-Viru', 'Parnu', 'Laane-Viru'],
  FI: ['Uusimaa', 'Pirkanmaa', 'Southwest Finland', 'North Ostrobothnia', 'Central Finland'],
  FR: ['Ile-de-France', 'Auvergne-Rhone-Alpes', 'Provence-Alpes-Cote d\'Azur', 'Occitanie', 'Nouvelle-Aquitaine'],
  DE: ['Berlin', 'Bavaria', 'Hamburg', 'Hesse', 'North Rhine-Westphalia', 'Baden-Wurttemberg'],
  GR: ['Attica', 'Central Macedonia', 'Thessaly', 'Crete', 'Western Greece'],
  HU: ['Budapest', 'Pest', 'Borsod-Abauj-Zemplen', 'Hajdu-Bihar', 'Csongrad-Csanad'],
  IE: ['Dublin', 'Cork', 'Galway', 'Limerick', 'Waterford'],
  IT: ['Lombardy', 'Lazio', 'Campania', 'Sicily', 'Veneto', 'Piedmont', 'Tuscany'],
  XK: ['Pristina', 'Prizren', 'Peja', 'Mitrovica', 'Gjakova'],
  LV: ['Riga', 'Daugavpils', 'Liepaja', 'Jelgava', 'Jurmala'],
  LT: ['Vilnius', 'Kaunas', 'Klaipeda', 'Siauliai', 'Panevezys'],
  MD: ['Chisinau', 'Balti', 'Tiraspol', 'Bender', 'Comrat'],
  ME: ['Podgorica', 'Niksic', 'Herceg Novi', 'Bar', 'Budva'],
  NL: ['North Holland', 'South Holland', 'Utrecht', 'North Brabant', 'Gelderland'],
  MK: ['Skopje', 'Bitola', 'Kumanovo', 'Prilep', 'Tetovo'],
  NO: ['Oslo', 'Viken', 'Vestland', 'Rogaland', 'Trondelag'],
  PL: ['Masovia', 'Lesser Poland', 'Silesia', 'Greater Poland', 'Lower Silesia'],
  PT: ['Lisbon', 'Norte', 'Centro', 'Algarve', 'Alentejo'],
  RO: ['Bucharest', 'Cluj', 'Timis', 'Iasi', 'Constanta'],
  RU: ['Moscow', 'Saint Petersburg', 'Krasnodar', 'Sverdlovsk', 'Tatarstan'],
  RS: ['Belgrade', 'Vojvodina', 'Sumadija', 'South East Serbia', 'Nis'],
  SK: ['Bratislava', 'Kosice', 'Presov', 'Zilina', 'Nitra'],
  SI: ['Central Slovenia', 'Drava', 'Savinja', 'Coastal-Karst', 'Upper Carniola'],
  ES: ['Madrid', 'Catalonia', 'Andalusia', 'Valencia', 'Basque Country', 'Galicia'],
  SE: ['Stockholm', 'Vastra Gotaland', 'Skane', 'Ostergotland', 'Uppsala'],
  CH: ['Zurich', 'Bern', 'Geneva', 'Vaud', 'Basel'],
  UA: ['Kyiv', 'Kharkiv', 'Dnipropetrovsk', 'Odessa', 'Donetsk', 'Lviv'],
  GB: ['England', 'Scotland', 'Wales', 'Northern Ireland'],

  // North America
  BZ: ['Belize', 'Cayo', 'Stann Creek', 'Orange Walk', 'Corozal'],
  CA: ['Alberta', 'British Columbia', 'Manitoba', 'Ontario', 'Quebec', 'Saskatchewan', 'Nova Scotia', 'New Brunswick'],
  CR: ['San Jose', 'Alajuela', 'Cartago', 'Heredia', 'Guanacaste'],
  CU: ['Havana', 'Santiago de Cuba', 'Holguin', 'Camaguey', 'Villa Clara'],
  DO: ['Santo Domingo', 'Santiago', 'La Vega', 'San Cristobal', 'Puerto Plata'],
  SV: ['San Salvador', 'La Libertad', 'Santa Ana', 'San Miguel', 'Sonsonate'],
  GT: ['Guatemala', 'Quetzaltenango', 'Escuintla', 'Alta Verapaz', 'Huehuetenango'],
  HT: ['Ouest', 'Nord', 'Artibonite', 'Sud', 'Centre'],
  HN: ['Francisco Morazan', 'Cortes', 'Atlantida', 'Yoro', 'Olancho'],
  JM: ['Kingston', 'Saint Andrew', 'Saint Catherine', 'Saint James', 'Clarendon'],
  MX: ['Mexico City', 'Jalisco', 'Nuevo Leon', 'Veracruz', 'Puebla', 'Guanajuato', 'Chihuahua'],
  NI: ['Managua', 'Leon', 'Chinandega', 'Masaya', 'Matagalpa'],
  PA: ['Panama', 'Panama Oeste', 'Colon', 'Chiriqui', 'Herrera'],
  US: ['Alabama', 'Alaska', 'Arizona', 'California', 'Colorado', 'Connecticut', 'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Illinois', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'New Jersey', 'New York', 'North Carolina', 'Ohio', 'Pennsylvania', 'Texas', 'Virginia', 'Washington'],

  // South America
  AR: ['Buenos Aires', 'Cordoba', 'Santa Fe', 'Mendoza', 'Tucuman'],
  BO: ['La Paz', 'Santa Cruz', 'Cochabamba', 'Potosi', 'Chuquisaca'],
  BR: ['Sao Paulo', 'Rio de Janeiro', 'Minas Gerais', 'Bahia', 'Rio Grande do Sul', 'Parana'],
  CL: ['Santiago', 'Valparaiso', 'Biobio', 'Maule', 'La Araucania'],
  CO: ['Bogota', 'Antioquia', 'Valle del Cauca', 'Atlantico', 'Santander'],
  EC: ['Pichincha', 'Guayas', 'Azuay', 'Manabi', 'El Oro'],
  GY: ['Demerara-Mahaica', 'Essequibo Islands-West Demerara', 'Upper Demerara-Berbice', 'East Berbice-Corentyne'],
  PY: ['Central', 'Alto Parana', 'Itapua', 'Caaguazu', 'San Pedro'],
  PE: ['Lima', 'La Libertad', 'Arequipa', 'Piura', 'Lambayeque'],
  UY: ['Montevideo', 'Canelones', 'Maldonado', 'Salto', 'Colonia'],
  VE: ['Distrito Capital', 'Miranda', 'Zulia', 'Carabobo', 'Lara'],

  // Oceania
  AU: ['New South Wales', 'Victoria', 'Queensland', 'Western Australia', 'South Australia', 'Tasmania'],
  NZ: ['Auckland', 'Wellington', 'Canterbury', 'Waikato', 'Bay of Plenty'],
  PG: ['National Capital', 'Morobe', 'Eastern Highlands', 'Western Highlands', 'East New Britain'],
};

export const CITIES_BY_STATE: Record<string, string[]> = {
  // Africa
  'Algiers': ['Algiers City', 'Bab El Oued', 'Bir Mourad Rais', 'Cheraga', 'Draria'],
  'Oran': ['Oran City', 'Es Senia', 'Bir El Djir', 'Ain Turk', 'Arzew'],
  'Constantine': ['Constantine City', 'El Khroub', 'Ain Smara', 'Hamma Bouziane', 'Didouche Mourad'],
  'Luanda': ['Luanda City', 'Viana', 'Cacuaco', 'Belas', 'Cazenga'],
  'Benguela': ['Benguela City', 'Lobito', 'Catumbela', 'Baia Farta', 'Cubal'],
  'Littoral Benin': ['Cotonou', 'Ouidah', 'Abomey-Calavi', 'Seme-Podji', 'Allada'],
  'South-East': ['Gaborone', 'Tlokweng', 'Mogoditshane', 'Mochudi', 'Ramotswa'],
  'Centre': ['Ouagadougou', 'Ziniaré', 'Tanghin-Dassouri', 'Komsilga', 'Saaba'],
  'Hauts-Bassins': ['Bobo-Dioulasso', 'Houndé', 'Dano', 'Karangasso-Vigué', 'Léna'],
  'Bujumbura Mairie': ['Bujumbura City', 'Mukaza', 'Muha', 'Ntahangwa'],
  'Littoral Cameroon': ['Douala', 'Nkongsamba', 'Edea', 'Loum', 'Mbanga'],
  'Bangui': ['Bangui City', 'Bimbo', 'Begoua', 'Fatima', 'Combattant'],
  'N\'Djamena': ['N\'Djamena City', 'Moundou', 'Sarh', 'Abeche', 'Kelo'],
  'Brazzaville': ['Brazzaville City', 'Talangai', 'Mfilou', 'Bacongo', 'Poto-Poto'],
  'Pointe-Noire': ['Pointe-Noire City', 'Loandjili', 'Tié-Tié', 'Ngoyo', 'Mvou-Mvou'],
  'Kinshasa': ['Gombe', 'Ngaliema', 'Limete', 'Matete', 'Kasa-Vubu'],
  'Cairo': ['Downtown Cairo', 'Giza', 'Nasr City', 'Maadi', 'Heliopolis'],
  'Alexandria': ['Alexandria City', 'Montaza', 'El Raml', 'Sidi Gaber', 'Smouha'],
  'Maekel': ['Asmara', 'Serejeka', 'Berik', 'Adi Quala'],
  'Addis Ababa': ['Addis Ababa City', 'Bole', 'Kirkos', 'Yeka', 'Nifas Silk-Lafto'],
  'Oromia': ['Adama', 'Jimma', 'Bishoftu', 'Shashamane', 'Nekemte'],
  'Estuaire': ['Libreville', 'Owendo', 'Akanda', 'Ntoum', 'Kango'],
  'Greater Accra': ['Accra', 'Tema', 'Madina', 'Teshie', 'Nungua'],
  'Ashanti': ['Kumasi', 'Obuasi', 'Ejisu', 'Konongo', 'Mampong'],
  'Conakry': ['Kaloum', 'Dixinn', 'Ratoma', 'Matam', 'Matoto'],
  'Abidjan': ['Plateau', 'Cocody', 'Yopougon', 'Marcory', 'Treichville'],
  'Yamoussoukro': ['Yamoussoukro City', 'Attiégouakro', 'Kossou', 'Toumodi'],
  'Nairobi': ['Nairobi Central', 'Westlands', 'Karen', 'Kilimani', 'Lavington'],
  'Mombasa': ['Mombasa Island', 'Nyali', 'Likoni', 'Changamwe', 'Kisauni'],
  'Montserrado': ['Monrovia', 'Paynesville', 'Gardnersville', 'New Georgia', 'Caldwell'],
  'Tripoli': ['Tripoli City', 'Tajoura', 'Ain Zara', 'Janzour', 'Abu Salim'],
  'Analamanga': ['Antananarivo', 'Antsirabe', 'Ambatolampy', 'Tsiroanomandidy', 'Miarinarivo'],
  'Central Malawi': ['Lilongwe', 'Mzuzu', 'Kasungu', 'Salima', 'Dowa'],
  'Bamako': ['Bamako City', 'Hamdallaye', 'Kalaban-Coro', 'Senou', 'Kati'],
  'Nouakchott': ['Nouakchott City', 'Tevragh-Zeina', 'Ksar', 'Sebkha', 'El Mina'],
  'Casablanca-Settat': ['Casablanca', 'Mohammedia', 'El Jadida', 'Settat', 'Berrechid'],
  'Rabat-Sale-Kenitra': ['Rabat', 'Sale', 'Kenitra', 'Temara', 'Skhirat'],
  'Maputo': ['Maputo City', 'Matola', 'Boane', 'Marracuene', 'Namaacha'],
  'Khomas': ['Windhoek', 'Katutura', 'Khomasdal', 'Hochland Park', 'Olympia'],
  'Niamey': ['Niamey City', 'Koira Kano', 'Koira Tegui', 'Lamorde', 'Talladje'],
  'Lagos': ['Lagos Island', 'Ikeja', 'Victoria Island', 'Lekki', 'Surulere'],
  'Abuja FCT': ['Central Business District', 'Wuse', 'Garki', 'Maitama', 'Asokoro'],
  'Kigali': ['Nyarugenge', 'Kicukiro', 'Gasabo', 'Remera', 'Kimihurura'],
  'Dakar': ['Dakar Plateau', 'Medina', 'Grand Dakar', 'Pikine', 'Guediawaye'],
  'Western Area': ['Freetown', 'Waterloo', 'Wellington', 'Hastings', 'Lumley'],
  'Banaadir': ['Mogadishu', 'Hodan', 'Wardhigley', 'Hawl Wadaag', 'Karaan'],
  'Gauteng': ['Johannesburg', 'Pretoria', 'Soweto', 'Sandton', 'Centurion'],
  'Western Cape': ['Cape Town', 'Stellenbosch', 'Paarl', 'George', 'Worcester'],
  'Central Equatoria': ['Juba', 'Yei', 'Kajo Keji', 'Morobo', 'Lainya'],
  'Khartoum': ['Khartoum City', 'Omdurman', 'Bahri', 'Soba', 'Jebel Aulia'],
  'Dar es Salaam': ['Ilala', 'Kinondoni', 'Temeke', 'Ubungo', 'Kigamboni'],
  'Maritime': ['Lome', 'Aneho', 'Vogan', 'Tsevie', 'Tabligbo'],
  'Tunis': ['Tunis City', 'La Marsa', 'Carthage', 'Sidi Bou Said', 'Le Bardo'],
  'Central Uganda': ['Kampala', 'Entebbe', 'Wakiso', 'Mukono', 'Jinja'],
  'Lusaka': ['Lusaka City', 'Kafue', 'Chongwe', 'Chilanga', 'Luangwa'],
  'Harare': ['Harare City', 'Chitungwiza', 'Epworth', 'Norton', 'Ruwa'],

  // Asia
  'Kabul': ['Kabul City', 'Paghman', 'Deh Sabz', 'Shakardara', 'Khak-i-Jabbar'],
  'Yerevan': ['Yerevan City', 'Kentron', 'Erebuni', 'Shengavit', 'Malatia-Sebastia'],
  'Baku': ['Baku City', 'Yasamal', 'Nasimi', 'Sabunchu', 'Khazar'],
  'Dhaka': ['Dhaka City', 'Uttara', 'Dhanmondi', 'Gulshan', 'Mirpur'],
  'Chittagong': ['Chittagong City', 'Panchlaish', 'Halishahar', 'Kotwali', 'Pahartali'],
  'Thimphu': ['Thimphu City', 'Babesa', 'Dechenchholing', 'Langjophakha', 'Taba'],
  'Phnom Penh': ['Chamkarmon', 'Daun Penh', 'Toul Kork', 'Meanchey', 'Sen Sok'],
  'Beijing': ['Dongcheng', 'Xicheng', 'Chaoyang', 'Haidian', 'Fengtai'],
  'Shanghai': ['Huangpu', 'Jing\'an', 'Xuhui', 'Pudong', 'Hongkou'],
  'Guangdong': ['Guangzhou', 'Shenzhen', 'Dongguan', 'Foshan', 'Zhuhai'],
  'Tbilisi': ['Old Tbilisi', 'Vake', 'Saburtalo', 'Didube', 'Nadzaladevi'],
  'Maharashtra': ['Mumbai', 'Pune', 'Nagpur', 'Nashik', 'Thane'],
  'Delhi': ['New Delhi', 'North Delhi', 'South Delhi', 'East Delhi', 'West Delhi'],
  'Karnataka': ['Bangalore', 'Mysore', 'Mangalore', 'Hubli', 'Belgaum'],
  'Tamil Nadu': ['Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli', 'Salem'],
  'Telangana': ['Hyderabad', 'Warangal', 'Nizamabad', 'Karimnagar', 'Khammam'],
  'Gujarat': ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Gandhinagar'],
  'West Bengal': ['Kolkata', 'Howrah', 'Durgapur', 'Asansol', 'Siliguri'],
  'Rajasthan': ['Jaipur', 'Jodhpur', 'Udaipur', 'Kota', 'Ajmer'],
  'Uttar Pradesh': ['Lucknow', 'Kanpur', 'Varanasi', 'Agra', 'Noida'],
  'Kerala': ['Kochi', 'Thiruvananthapuram', 'Kozhikode', 'Thrissur', 'Kollam'],
  'Jakarta': ['Central Jakarta', 'South Jakarta', 'West Jakarta', 'East Jakarta', 'North Jakarta'],
  'West Java': ['Bandung', 'Bekasi', 'Bogor', 'Depok', 'Cirebon'],
  'Bali': ['Denpasar', 'Kuta', 'Ubud', 'Seminyak', 'Sanur'],
  'Tehran': ['Tehran City', 'Shemiran', 'Rey', 'Islamshahr', 'Karaj'],
  'Baghdad': ['Baghdad City', 'Karada', 'Mansour', 'Adhamiyah', 'Karkh'],
  'Tel Aviv': ['Tel Aviv City', 'Ramat Gan', 'Givatayim', 'Holon', 'Bat Yam'],
  'Jerusalem': ['Old City', 'West Jerusalem', 'East Jerusalem', 'Givat Shaul', 'Talpiot'],
  'Tokyo': ['Shibuya', 'Shinjuku', 'Minato', 'Chiyoda', 'Setagaya'],
  'Osaka': ['Osaka City', 'Sakai', 'Higashiosaka', 'Toyonaka', 'Suita'],
  'Amman': ['Amman City', 'Zarqa', 'Irbid', 'Aqaba', 'Madaba'],
  'Almaty': ['Almaty City', 'Bostandyk', 'Medeu', 'Auezov', 'Alatau'],
  'Kuala Lumpur': ['Kuala Lumpur City', 'Bukit Bintang', 'Cheras', 'Bangsar', 'Mont Kiara'],
  'Selangor': ['Shah Alam', 'Petaling Jaya', 'Subang Jaya', 'Klang', 'Ampang'],
  'Ulaanbaatar': ['Ulaanbaatar City', 'Bayangol', 'Khan-Uul', 'Sukhbaatar', 'Chingeltei'],
  'Yangon': ['Yangon City', 'Sanchaung', 'Kamayut', 'Hlaing', 'Mayangone'],
  'Bagmati': ['Kathmandu', 'Lalitpur', 'Bhaktapur', 'Kirtipur', 'Madhyapur Thimi'],
  'Punjab': ['Lahore', 'Faisalabad', 'Rawalpindi', 'Multan', 'Gujranwala'],
  'Sindh': ['Karachi', 'Hyderabad', 'Sukkur', 'Larkana', 'Nawabshah'],
  'Metro Manila': ['Manila', 'Quezon City', 'Makati', 'Pasig', 'Taguig'],
  'Riyadh': ['Riyadh City', 'Al Olaya', 'Al Malaz', 'Al Naseem', 'Al Sulimaniyah'],
  'Seoul': ['Gangnam', 'Jongno', 'Mapo', 'Yongsan', 'Seodaemun'],
  'Western': ['Colombo', 'Sri Jayawardenepura Kotte', 'Dehiwala', 'Moratuwa', 'Negombo'],
  'Taipei': ['Taipei City', 'Xinyi', 'Da\'an', 'Zhongshan', 'Songshan'],
  'Bangkok': ['Bangkok City', 'Silom', 'Sukhumvit', 'Chatuchak', 'Ratchathewi'],
  'Istanbul': ['Kadikoy', 'Besiktas', 'Sisli', 'Beyoglu', 'Uskudar'],
  'Ankara': ['Cankaya', 'Kecioren', 'Mamak', 'Yenimahalle', 'Etimesgut'],
  'Dubai': ['Downtown Dubai', 'Deira', 'Bur Dubai', 'Jumeirah', 'Marina'],
  'Abu Dhabi': ['Abu Dhabi City', 'Al Ain', 'Al Reem Island', 'Khalifa City', 'Yas Island'],
  'Tashkent': ['Tashkent City', 'Chilanzar', 'Yakkasaray', 'Mirzo Ulugbek', 'Sergeli'],
  'Ho Chi Minh City': ['District 1', 'District 3', 'Binh Thanh', 'Phu Nhuan', 'Tan Binh'],
  'Hanoi': ['Hoan Kiem', 'Ba Dinh', 'Dong Da', 'Hai Ba Trung', 'Cau Giay'],
  'Sanaa': ['Sanaa City', 'Old City', 'Tahrir', 'Al Sabeen', 'Hadda'],

  // Europe
  'Tirana': ['Tirana City', 'Kashar', 'Dajt', 'Farkë', 'Peza'],
  'Vienna': ['Innere Stadt', 'Leopoldstadt', 'Landstraße', 'Wieden', 'Margareten'],
  'Minsk': ['Minsk City', 'Centralny', 'Sovetsky', 'Pervomaysky', 'Partizansky'],
  'Brussels': ['Brussels City', 'Ixelles', 'Saint-Gilles', 'Schaerbeek', 'Uccle'],
  'Sofia': ['Sofia City', 'Mladost', 'Lyulin', 'Oborishte', 'Lozenets'],
  'Zagreb': ['Zagreb City', 'Maksimir', 'Trešnjevka', 'Novi Zagreb', 'Dubrava'],
  'Prague': ['Prague 1', 'Prague 2', 'Prague 3', 'Prague 4', 'Prague 5'],
  'Capital Region': ['Copenhagen', 'Frederiksberg', 'Gentofte', 'Lyngby-Taarbæk', 'Helsingør'],
  'Harju': ['Tallinn', 'Maardu', 'Keila', 'Saue', 'Viimsi'],
  'Uusimaa': ['Helsinki', 'Espoo', 'Vantaa', 'Kauniainen', 'Järvenpää'],
  'Ile-de-France': ['Paris', 'Boulogne-Billancourt', 'Saint-Denis', 'Argenteuil', 'Montreuil'],
  'Berlin': ['Mitte', 'Charlottenburg', 'Kreuzberg', 'Prenzlauer Berg', 'Friedrichshain'],
  'Bavaria': ['Munich', 'Nuremberg', 'Augsburg', 'Regensburg', 'Ingolstadt'],
  'Attica': ['Athens', 'Piraeus', 'Kallithea', 'Glyfada', 'Marousi'],
  'Budapest': ['District I', 'District V', 'District VI', 'District VII', 'District XIII'],
  'Dublin': ['Dublin City', 'Dun Laoghaire', 'Fingal', 'South Dublin', 'Tallaght'],
  'Lombardy': ['Milan', 'Brescia', 'Bergamo', 'Monza', 'Como'],
  'Lazio': ['Rome', 'Fiumicino', 'Latina', 'Guidonia', 'Aprilia'],
  'Riga': ['Riga City', 'Agenskalns', 'Kengarags', 'Ziepniekkalns', 'Imanta'],
  'Vilnius': ['Vilnius City', 'Naujamiestis', 'Senamiestis', 'Antakalnis', 'Žirmūnai'],
  'Chisinau': ['Chisinau City', 'Botanica', 'Centru', 'Buiucani', 'Ciocana'],
  'Podgorica': ['Podgorica City', 'Stara Varoš', 'Nova Varoš', 'Zabjelo', 'Gorica'],
  'North Holland': ['Amsterdam', 'Haarlem', 'Zaanstad', 'Amstelveen', 'Hilversum'],
  'South Holland': ['Rotterdam', 'The Hague', 'Leiden', 'Dordrecht', 'Delft'],
  'Oslo': ['Oslo City', 'Frogner', 'Grünerløkka', 'St. Hanshaugen', 'Gamle Oslo'],
  'Masovia': ['Warsaw', 'Radom', 'Płock', 'Siedlce', 'Ostrołęka'],
  'Lisbon': ['Lisbon City', 'Sintra', 'Cascais', 'Loures', 'Amadora'],
  'Bucharest': ['Sector 1', 'Sector 2', 'Sector 3', 'Sector 4', 'Sector 5'],
  'Moscow': ['Central Moscow', 'Northern', 'Southern', 'Eastern', 'Western'],
  'Saint Petersburg': ['Central District', 'Admiralteysky', 'Vasileostrovsky', 'Petrogradsky', 'Nevsky'],
  'Belgrade': ['Stari Grad', 'Savski Venac', 'Vračar', 'Novi Beograd', 'Zemun'],
  'Bratislava': ['Old Town', 'Ružinov', 'Nové Mesto', 'Petržalka', 'Karlova Ves'],
  'Madrid': ['Centro', 'Salamanca', 'Chamberí', 'Retiro', 'Chamartín'],
  'Catalonia': ['Barcelona', 'Hospitalet', 'Badalona', 'Terrassa', 'Sabadell'],
  'Stockholm': ['Stockholm City', 'Södermalm', 'Östermalm', 'Kungsholmen', 'Norrmalm'],
  'Zurich': ['Zurich City', 'Winterthur', 'Uster', 'Dübendorf', 'Dietikon'],
  'Geneva': ['Geneva City', 'Carouge', 'Vernier', 'Lancy', 'Meyrin'],
  'Kyiv': ['Kyiv City', 'Shevchenkivskyi', 'Pecherskyi', 'Podilskyi', 'Obolonskyi'],
  'England': ['London', 'Manchester', 'Birmingham', 'Liverpool', 'Leeds', 'Bristol'],
  'Scotland': ['Edinburgh', 'Glasgow', 'Aberdeen', 'Dundee', 'Inverness'],
  'Wales': ['Cardiff', 'Swansea', 'Newport', 'Wrexham', 'Barry'],

  // North America
  'Belize': ['Belize City', 'San Ignacio', 'Orange Walk Town', 'Belmopan', 'Dangriga'],
  'Ontario': ['Toronto', 'Ottawa', 'Mississauga', 'Hamilton', 'London'],
  'Quebec': ['Montreal', 'Quebec City', 'Laval', 'Gatineau', 'Longueuil'],
  'British Columbia': ['Vancouver', 'Victoria', 'Surrey', 'Burnaby', 'Richmond'],
  'Alberta': ['Calgary', 'Edmonton', 'Red Deer', 'Lethbridge', 'Medicine Hat'],
  'San Jose': ['San Jose City', 'Escazu', 'Desamparados', 'Curridabat', 'Alajuelita'],
  'Havana': ['Havana Vieja', 'Centro Habana', 'Vedado', 'Playa', 'Miramar'],
  'Santo Domingo': ['Santo Domingo Este', 'Santo Domingo Norte', 'Santo Domingo Oeste', 'Distrito Nacional'],
  'San Salvador': ['San Salvador City', 'Santa Tecla', 'Soyapango', 'Mejicanos', 'Apopa'],
  'Guatemala': ['Guatemala City', 'Mixco', 'Villa Nueva', 'Petapa', 'San Miguel Petapa'],
  'Ouest': ['Port-au-Prince', 'Carrefour', 'Delmas', 'Pétion-Ville', 'Cité Soleil'],
  'Francisco Morazan': ['Tegucigalpa', 'Comayaguela', 'Valle de Angeles', 'Santa Lucia', 'Tatumbla'],
  'Kingston': ['Kingston City', 'New Kingston', 'Half Way Tree', 'Liguanea', 'Papine'],
  'Mexico City': ['Centro', 'Coyoacan', 'Roma', 'Polanco', 'Condesa'],
  'Jalisco': ['Guadalajara', 'Zapopan', 'Tlaquepaque', 'Tonala', 'Puerto Vallarta'],
  'Managua': ['Managua City', 'Ciudad Sandino', 'Tipitapa', 'Mateare', 'San Rafael del Sur'],
  'Panama': ['Panama City', 'San Miguelito', 'Tocumen', 'Las Cumbres', 'Pacora'],
  'California': ['Los Angeles', 'San Francisco', 'San Diego', 'Oakland', 'Sacramento'],
  'Texas': ['Houston', 'Dallas', 'Austin', 'San Antonio', 'Fort Worth'],
  'New York': ['New York City', 'Buffalo', 'Rochester', 'Albany', 'Syracuse'],
  'Florida': ['Miami', 'Orlando', 'Tampa', 'Jacksonville', 'Fort Lauderdale'],
  'Illinois': ['Chicago', 'Aurora', 'Naperville', 'Joliet', 'Rockford'],
  'Georgia': ['Atlanta', 'Savannah', 'Augusta', 'Columbus', 'Macon'],
  'Colorado': ['Denver', 'Aurora', 'Colorado Springs', 'Boulder', 'Fort Collins'],
  'Washington': ['Seattle', 'Spokane', 'Tacoma', 'Vancouver', 'Bellevue'],

  // South America
  'Buenos Aires': ['Buenos Aires City', 'La Plata', 'Mar del Plata', 'Bahia Blanca', 'Quilmes'],
  'La Paz': ['La Paz City', 'El Alto', 'Viacha', 'Achocalla', 'Mecapaca'],
  'Sao Paulo': ['Sao Paulo City', 'Guarulhos', 'Campinas', 'Sao Bernardo', 'Santo Andre'],
  'Rio de Janeiro': ['Rio de Janeiro City', 'Niteroi', 'Sao Goncalo', 'Duque de Caxias', 'Nova Iguacu'],
  'Santiago': ['Santiago Centro', 'Providencia', 'Las Condes', 'Vitacura', 'Nunoa'],
  'Bogota': ['Bogota City', 'Usaquen', 'Chapinero', 'Santa Fe', 'Candelaria'],
  'Antioquia': ['Medellin', 'Bello', 'Itagui', 'Envigado', 'Apartado'],
  'Pichincha': ['Quito', 'Sangolqui', 'Machachi', 'Cayambe', 'Tabacundo'],
  'Guayas': ['Guayaquil', 'Duran', 'Milagro', 'Daule', 'Samborondon'],
  'Lima': ['Lima Centro', 'Miraflores', 'San Isidro', 'Barranco', 'Surco'],
  'Montevideo': ['Montevideo City', 'Ciudad de la Costa', 'Pocitos', 'Carrasco', 'Punta Carretas'],
  'Distrito Capital': ['Caracas', 'Libertador', 'Chacao', 'Baruta', 'El Hatillo'],

  // Oceania
  'New South Wales': ['Sydney', 'Newcastle', 'Wollongong', 'Central Coast', 'Maitland'],
  'Victoria': ['Melbourne', 'Geelong', 'Ballarat', 'Bendigo', 'Shepparton'],
  'Queensland': ['Brisbane', 'Gold Coast', 'Sunshine Coast', 'Townsville', 'Cairns'],
  'Auckland': ['Auckland City', 'Manukau', 'North Shore', 'Waitakere', 'Papakura'],
  'Wellington': ['Wellington City', 'Lower Hutt', 'Upper Hutt', 'Porirua', 'Kapiti Coast'],
  'National Capital': ['Port Moresby', 'Gerehu', 'Boroko', 'Waigani', 'Hohola'],
};

// Mock data for initial development
export const MOCK_USERS: User[] = [
  {
    id: '1',
    name: 'Kwame Asante',
    username: 'kwameasante',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face',
    bio: 'Community builder. Ghanaian in Denver.',
    location: 'Denver, CO',
    interests: ['Business', 'Culture', 'Food'],
    joinedDate: '2024-01-15',
  },
  {
    id: '2',
    name: 'Amara Diallo',
    username: 'amaradiallo',
    avatar: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=200&h=200&fit=crop&crop=face',
    bio: 'Senegalese chef. Food brings us together.',
    location: 'Denver, CO',
    interests: ['Food', 'Events', 'Culture'],
    joinedDate: '2024-02-20',
  },
  {
    id: '3',
    name: 'Nneka Okonkwo',
    username: 'nnekao',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=face',
    bio: 'Nigerian tech professional. Building bridges.',
    location: 'Denver, CO',
    interests: ['Tech', 'Business', 'Networking'],
    joinedDate: '2024-03-10',
  },
  {
    id: '4',
    name: 'Fatou Mbaye',
    username: 'fatoumbaye',
    avatar: 'https://images.unsplash.com/photo-1589156229687-496a31ad1d1f?w=200&h=200&fit=crop&crop=face',
    bio: 'Fashion designer from Dakar. Creating African-inspired modern wear.',
    location: 'Aurora, CO',
    interests: ['Fashion', 'Art', 'Culture'],
    joinedDate: '2024-03-25',
  },
  {
    id: '5',
    name: 'Kofi Mensah',
    username: 'kofimensah',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&h=200&fit=crop&crop=face',
    bio: 'Entrepreneur and mentor. Helping the next generation succeed.',
    location: 'Denver, CO',
    interests: ['Business', 'Mentorship', 'Finance'],
    joinedDate: '2024-04-01',
  },
  {
    id: '6',
    name: 'Zainab Traore',
    username: 'zainabtraore',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=face',
    bio: 'Healthcare worker and community volunteer. Mali roots.',
    location: 'Lakewood, CO',
    interests: ['Health', 'Volunteering', 'Family'],
    joinedDate: '2024-04-10',
  },
  {
    id: '7',
    name: 'Emeka Nwosu',
    username: 'emekanwosu',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=face',
    bio: 'Software engineer from Lagos. Building tech for Africa.',
    location: 'Denver, CO',
    interests: ['Tech', 'Startups', 'Music'],
    joinedDate: '2024-04-15',
  },
  {
    id: '8',
    name: 'Aisha Kamara',
    username: 'aishakamara',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop&crop=face',
    bio: 'Teacher and mother. Sierra Leonean proud.',
    location: 'Thornton, CO',
    interests: ['Education', 'Family', 'Culture'],
    joinedDate: '2024-04-20',
  },
  {
    id: '9',
    name: 'Ousmane Diop',
    username: 'ousmanediop',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face',
    bio: 'Music producer and DJ. Bringing Afrobeats to Colorado.',
    location: 'Denver, CO',
    interests: ['Music', 'Events', 'Nightlife'],
    joinedDate: '2024-05-01',
  },
  {
    id: '10',
    name: 'Grace Adeyemi',
    username: 'graceadeyemi',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=face',
    bio: 'Lawyer and advocate. Nigerian-American.',
    location: 'Boulder, CO',
    interests: ['Law', 'Advocacy', 'Politics'],
    joinedDate: '2024-05-10',
  },
  {
    id: '11',
    name: 'Mamadou Sow',
    username: 'mamadousow',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&h=200&fit=crop&crop=face',
    bio: 'Restaurant owner. Authentic Guinean cuisine.',
    location: 'Aurora, CO',
    interests: ['Food', 'Business', 'Culture'],
    joinedDate: '2024-05-15',
  },
  {
    id: '12',
    name: 'Bintu Sesay',
    username: 'bintusesay',
    avatar: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=200&h=200&fit=crop&crop=face',
    bio: 'Nurse and wellness coach. Healthy living advocate.',
    location: 'Denver, CO',
    interests: ['Health', 'Fitness', 'Wellness'],
    joinedDate: '2024-05-20',
  },
  {
    id: '13',
    name: 'Abdul Rahman',
    username: 'abdulrahman',
    avatar: 'https://images.unsplash.com/photo-1463453091185-61582044d556?w=200&h=200&fit=crop&crop=face',
    bio: 'Real estate investor. Building wealth in our community.',
    location: 'Denver, CO',
    interests: ['Real Estate', 'Investment', 'Business'],
    joinedDate: '2024-06-01',
  },
  {
    id: '14',
    name: 'Chiamaka Eze',
    username: 'chiamakaeze',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&h=200&fit=crop&crop=face',
    bio: 'Artist and gallery owner. Celebrating African art.',
    location: 'Denver, CO',
    interests: ['Art', 'Culture', 'Events'],
    joinedDate: '2024-06-10',
  },
  {
    id: '15',
    name: 'Bakary Toure',
    username: 'bakarytoure',
    avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=200&h=200&fit=crop&crop=face',
    bio: 'Soccer coach and youth mentor. Mali to Denver.',
    location: 'Commerce City, CO',
    interests: ['Sports', 'Youth', 'Mentorship'],
    joinedDate: '2024-06-15',
  },
];

export const MOCK_POSTS: Post[] = [
  {
    id: '1',
    author: MOCK_USERS[0],
    content: 'Looking for a Ghanaian tailor near Aurora! Anyone have recommendations? Need traditional kente cloth tailored for an upcoming wedding.',
    images: [],
    likes: 12,
    comments: 8,
    createdAt: '2024-12-30T10:30:00Z',
    isLiked: false,
    location: 'Denver, CO',
  },
  {
    id: '2',
    author: MOCK_USERS[1],
    content: 'Just opened my new Senegalese restaurant in Five Points! Come try authentic Thieboudienne. Grand opening this Saturday with live music.',
    images: ['https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=800&h=600&fit=crop'],
    likes: 45,
    comments: 23,
    createdAt: '2024-12-29T18:00:00Z',
    isLiked: true,
    location: 'Denver, CO',
  },
  {
    id: '3',
    author: MOCK_USERS[2],
    content: 'African Tech Professionals meetup next Thursday at WeWork downtown. Great networking opportunity for those in tech. DM for details!',
    images: [],
    likes: 28,
    comments: 15,
    createdAt: '2024-12-28T14:00:00Z',
    isLiked: false,
    location: 'Denver, CO',
  },
];

export const MOCK_COMMUNITIES: Community[] = [
  {
    id: '1',
    name: 'Denver Expats',
    city: 'Denver',
    state: 'Colorado',
    country: 'USA',
    memberCount: 2340,
    image: 'https://images.unsplash.com/photo-1546156929-a4c0ac411f47?w=400&h=300&fit=crop',
  },
  {
    id: '2',
    name: 'Atlanta Expats',
    city: 'Atlanta',
    state: 'Georgia',
    country: 'USA',
    memberCount: 8920,
    image: 'https://images.unsplash.com/photo-1575917649705-5b59aaa12e6b?w=400&h=300&fit=crop',
  },
  {
    id: '3',
    name: 'London Expats',
    city: 'London',
    state: 'England',
    country: 'UK',
    memberCount: 15600,
    image: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=400&h=300&fit=crop',
  },
];

export const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: '1',
    type: 'like',
    title: 'Kwame liked your post',
    message: 'Looking for a Ghanaian tailor...',
    timestamp: '2024-12-30T11:00:00Z',
    read: false,
    avatar: MOCK_USERS[0].avatar,
  },
  {
    id: '2',
    type: 'comment',
    title: 'Amara commented',
    message: 'I know a great tailor in Aurora!',
    timestamp: '2024-12-30T10:45:00Z',
    read: false,
    avatar: MOCK_USERS[1].avatar,
  },
  {
    id: '3',
    type: 'event',
    title: 'Upcoming event',
    message: 'African Tech Meetup starts in 2 days',
    timestamp: '2024-12-29T09:00:00Z',
    read: true,
  },
  {
    id: '4',
    type: 'alert',
    title: 'Community alert',
    message: 'Welcome to Denver Expats community!',
    timestamp: '2024-12-28T12:00:00Z',
    read: true,
  },
];

export const MOCK_MARKETPLACE: MarketplaceListing[] = [
  {
    id: '1',
    seller: MOCK_USERS[0],
    title: 'Authentic Kente Cloth - Handwoven',
    description: 'Beautiful handwoven Kente cloth from Ghana. Perfect for weddings, graduations, and special occasions. 6 yards.',
    price: '150',
    currency: 'USD',
    images: ['https://images.unsplash.com/photo-1590735213920-68192a487bc2?w=800&h=600&fit=crop'],
    category: 'Fashion & Textiles',
    condition: 'new',
    location: 'Denver, CO',
    isStoreBased: false,
    createdAt: '2024-12-29T10:00:00Z',
    views: 45,
  },
  {
    id: '2',
    seller: MOCK_USERS[1],
    title: 'African Spice Collection Box',
    description: 'Complete collection of West African cooking spices. Includes suya spice, egusi, ogbono, and more. Fresh and authentic.',
    price: '35',
    currency: 'USD',
    images: ['https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=800&h=600&fit=crop'],
    category: 'Food & Groceries',
    condition: 'new',
    location: 'Denver, CO',
    isStoreBased: true,
    storeName: "Amara's African Kitchen",
    createdAt: '2024-12-28T14:00:00Z',
    views: 89,
  },
  {
    id: '3',
    seller: MOCK_USERS[2],
    title: 'African Art - Wooden Sculpture',
    description: 'Hand-carved wooden sculpture from Nigeria. Beautiful mahogany finish. Perfect for home decor.',
    price: '200',
    currency: 'USD',
    images: ['https://images.unsplash.com/photo-1582582621959-48d27397dc69?w=800&h=600&fit=crop'],
    category: 'Art & Crafts',
    condition: 'new',
    location: 'Denver, CO',
    isStoreBased: false,
    createdAt: '2024-12-27T09:00:00Z',
    views: 32,
  },
  {
    id: '4',
    seller: MOCK_USERS[0],
    title: 'Shea Butter - Raw & Unrefined',
    description: '100% pure African shea butter from Ghana. Great for skin and hair. 1kg container.',
    price: '25',
    currency: 'USD',
    images: ['https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?w=800&h=600&fit=crop'],
    category: 'Beauty & Health',
    condition: 'new',
    location: 'Denver, CO',
    isStoreBased: false,
    createdAt: '2024-12-26T16:00:00Z',
    views: 156,
  },
];

export const MOCK_FAITH_EVENTS: FaithEvent[] = [
  {
    id: '1',
    organizationName: 'African Christian Fellowship',
    organizationLogo: 'https://images.unsplash.com/photo-1438032005730-c779502df39b?w=200&h=200&fit=crop',
    faithType: 'Christian',
    title: 'Sunday Worship Service',
    description: 'Join us for our weekly Sunday worship service with praise, worship, and an inspiring message. All are welcome!',
    date: '2025-01-05',
    time: '10:00 AM',
    location: 'Denver, CO',
    address: '1234 Faith Street, Denver, CO 80202',
    isRecurring: true,
    recurringSchedule: 'Every Sunday',
    contactPhone: '+1 (303) 555-0123',
    attendees: 150,
  },
  {
    id: '2',
    organizationName: 'Denver Islamic Center',
    organizationLogo: 'https://images.unsplash.com/photo-1585036156171-384164a8c675?w=200&h=200&fit=crop',
    faithType: 'Islamic',
    title: 'Jummah Prayer',
    description: 'Weekly Friday prayer service. Khutbah begins at 1:00 PM followed by congregational prayer.',
    date: '2025-01-03',
    time: '1:00 PM',
    location: 'Denver, CO',
    address: '5678 Unity Avenue, Denver, CO 80203',
    isRecurring: true,
    recurringSchedule: 'Every Friday',
    contactEmail: 'info@denverislamiccenter.org',
    attendees: 200,
  },
  {
    id: '3',
    organizationName: 'Pan-African Interfaith Council',
    organizationLogo: 'https://images.unsplash.com/photo-1529070538774-1843cb3265df?w=200&h=200&fit=crop',
    faithType: 'Interfaith',
    title: 'African Heritage Prayer Breakfast',
    description: 'Annual interfaith gathering celebrating African spiritual heritage. Featuring speakers from various faith traditions.',
    date: '2025-01-18',
    time: '8:00 AM',
    location: 'Denver, CO',
    address: 'Convention Center, 700 14th St, Denver, CO 80202',
    isRecurring: false,
    contactPhone: '+1 (303) 555-0456',
    attendees: 300,
  },
  {
    id: '4',
    organizationName: 'Ethiopian Orthodox Church',
    organizationLogo: 'https://images.unsplash.com/photo-1548625149-fc4a29cf7092?w=200&h=200&fit=crop',
    faithType: 'Christian',
    title: 'Timkat Celebration',
    description: 'Join us for the celebration of Ethiopian Epiphany (Timkat). Traditional ceremonies, music, and fellowship.',
    date: '2025-01-19',
    time: '6:00 AM',
    location: 'Denver, CO',
    address: '910 Blessing Road, Aurora, CO 80011',
    isRecurring: false,
    contactPhone: '+1 (303) 555-0789',
    attendees: 250,
  },
];

export const MARKETPLACE_CATEGORIES = [
  'Fashion & Textiles',
  'Food & Groceries',
  'Art & Crafts',
  'Beauty & Health',
  'Electronics',
  'Home & Garden',
  'Books & Media',
  'Services',
  'Vehicles',
  'Other',
];

export const FAITH_TYPES = [
  'Christian',
  'Islamic',
  'Traditional African',
  'Jewish',
  'Buddhist',
  'Hindu',
  'Interfaith',
  'Other',
];

export const MOCK_TALENTS: ServeTalent[] = [
  {
    id: 'talent-1',
    user: {
      id: 'talent-user-1',
      name: 'David Mensah',
      username: 'davidmensah',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop',
      bio: 'Worship leader and musician with 10+ years experience',
      location: 'Denver, CO',
      interests: ['Music', 'Worship', 'Community'],
      joinedDate: '2024-01-15',
    },
    category: 'musician',
    skills: ['Piano/Keyboard', 'Guitar', 'Choir Director'],
    experience: '10+ years',
    bio: 'Passionate worship leader with experience in contemporary and traditional African worship styles. Available to serve churches, events, and conferences.',
    isAvailable: true,
    availabilityNote: 'Available weekends and Wednesday evenings',
    location: 'Denver, CO',
    willingToTravel: true,
    travelRadius: '50 miles',
    faithBackground: 'Christian',
    contactEmail: 'david.mensah@email.com',
    contactPhone: '+1 (303) 555-0101',
    portfolioImages: [
      'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&h=300&fit=crop',
    ],
    rating: 4.9,
    reviewCount: 23,
    createdAt: '2024-06-01T00:00:00Z',
    lastActive: '2025-01-02T10:00:00Z',
  },
  {
    id: 'talent-2',
    user: {
      id: 'talent-user-2',
      name: 'Grace Okonkwo',
      username: 'graceokonkwo',
      avatar: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=200&h=200&fit=crop',
      bio: 'Gospel singer and vocal coach',
      location: 'Aurora, CO',
      interests: ['Singing', 'Teaching', 'Gospel'],
      joinedDate: '2024-03-20',
    },
    category: 'singer',
    skills: ['Solo', 'Choir', 'Gospel', 'Contemporary'],
    experience: '8 years',
    bio: 'Anointed gospel vocalist available for church services, weddings, and special events. I bring energy and spirit to every performance.',
    isAvailable: true,
    location: 'Aurora, CO',
    willingToTravel: true,
    travelRadius: '100 miles',
    faithBackground: 'Christian',
    contactEmail: 'grace.okonkwo@email.com',
    rating: 4.8,
    reviewCount: 15,
    createdAt: '2024-07-15T00:00:00Z',
    lastActive: '2025-01-01T14:00:00Z',
  },
  {
    id: 'talent-3',
    user: {
      id: 'talent-user-3',
      name: 'Emmanuel Adeyemi',
      username: 'emmanueladeyemi',
      avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&h=200&fit=crop',
      bio: 'Sound engineer and AV specialist',
      location: 'Denver, CO',
      interests: ['Audio', 'Technology', 'Church Tech'],
      joinedDate: '2024-02-10',
    },
    category: 'sound_tech',
    skills: ['Mixing Board', 'Live Sound', 'Streaming Setup', 'ProPresenter'],
    experience: '6 years',
    bio: 'Professional sound engineer with experience in church settings. I handle live sound mixing, streaming setup, and ProPresenter operations.',
    isAvailable: true,
    availabilityNote: 'Available Sundays and for special events',
    location: 'Denver, CO',
    willingToTravel: false,
    faithBackground: 'Christian',
    contactPhone: '+1 (720) 555-0202',
    rating: 5.0,
    reviewCount: 31,
    createdAt: '2024-04-01T00:00:00Z',
    lastActive: '2025-01-03T08:00:00Z',
  },
  {
    id: 'talent-4',
    user: {
      id: 'talent-user-4',
      name: 'Fatima Hassan',
      username: 'fatimahassan',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop',
      bio: 'Youth ministry leader and counselor',
      location: 'Lakewood, CO',
      interests: ['Youth', 'Mentoring', 'Education'],
      joinedDate: '2024-05-05',
    },
    category: 'youth_leader',
    skills: ['Teen Ministry', 'Young Adults', 'Campus Ministry'],
    experience: '5 years',
    bio: 'Dedicated youth leader passionate about guiding the next generation. Experience with teen programs, campus outreach, and young adult ministries.',
    isAvailable: true,
    location: 'Lakewood, CO',
    willingToTravel: true,
    travelRadius: '30 miles',
    faithBackground: 'Islamic',
    contactEmail: 'fatima.hassan@email.com',
    rating: 4.7,
    reviewCount: 12,
    createdAt: '2024-08-20T00:00:00Z',
    lastActive: '2024-12-30T16:00:00Z',
  },
  {
    id: 'talent-5',
    user: {
      id: 'talent-user-5',
      name: 'Samuel Kwame',
      username: 'samuelkwame',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop',
      bio: 'Traditional African drummer and worship musician',
      location: 'Denver, CO',
      interests: ['Drums', 'African Music', 'Culture'],
      joinedDate: '2024-04-12',
    },
    category: 'musician',
    skills: ['Traditional African Drums', 'Drums', 'Choir Director'],
    experience: '15+ years',
    bio: 'Master of traditional African drumming bringing authentic rhythms to worship. Available for African-themed services, cultural events, and celebrations.',
    isAvailable: true,
    availabilityNote: 'Flexible schedule - contact for availability',
    location: 'Denver, CO',
    willingToTravel: true,
    travelRadius: '200 miles',
    faithBackground: 'Christian',
    contactPhone: '+1 (303) 555-0303',
    contactEmail: 'samuel.kwame@email.com',
    portfolioImages: [
      'https://images.unsplash.com/photo-1504704911898-68304a7d2807?w=400&h=300&fit=crop',
    ],
    rating: 4.9,
    reviewCount: 28,
    createdAt: '2024-05-10T00:00:00Z',
    lastActive: '2025-01-02T20:00:00Z',
  },
  {
    id: 'talent-6',
    user: {
      id: 'talent-user-6',
      name: 'Amara Johnson',
      username: 'amarajohnson',
      avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&h=200&fit=crop',
      bio: 'Media director and graphic designer',
      location: 'Denver, CO',
      interests: ['Design', 'Photography', 'Social Media'],
      joinedDate: '2024-06-18',
    },
    category: 'media',
    skills: ['Video Production', 'Photography', 'Graphic Design', 'Social Media'],
    experience: '7 years',
    bio: 'Creative media professional helping churches tell their stories through compelling visuals. Experienced in event coverage, social media management, and brand design.',
    isAvailable: true,
    location: 'Denver, CO',
    willingToTravel: true,
    travelRadius: '75 miles',
    faithBackground: 'Christian',
    contactEmail: 'amara.johnson@email.com',
    portfolioImages: [
      'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400&h=300&fit=crop',
    ],
    rating: 4.8,
    reviewCount: 19,
    createdAt: '2024-07-01T00:00:00Z',
    lastActive: '2025-01-01T12:00:00Z',
  },
];

export const MOCK_COMMENTS: Comment[] = [
  {
    id: '1',
    postId: '1',
    author: MOCK_USERS[1],
    content: 'I know a great tailor in Aurora! Her name is Auntie Grace, she does amazing kente work. I can share her contact.',
    createdAt: '2024-12-30T10:45:00Z',
    likes: 5,
  },
  {
    id: '2',
    postId: '1',
    author: MOCK_USERS[2],
    content: 'Try Abena\'s African Tailoring on Colfax! She did my wedding dress.',
    createdAt: '2024-12-30T10:50:00Z',
    likes: 3,
  },
  {
    id: '3',
    postId: '1',
    author: MOCK_USERS[0],
    content: 'Thank you all! I\'ll check them out.',
    createdAt: '2024-12-30T11:00:00Z',
    likes: 2,
  },
  {
    id: '4',
    postId: '2',
    author: MOCK_USERS[0],
    content: 'Congratulations! Can\'t wait to try the Thieboudienne! What time does it open?',
    createdAt: '2024-12-29T18:30:00Z',
    likes: 8,
  },
  {
    id: '5',
    postId: '2',
    author: MOCK_USERS[2],
    content: 'This is amazing news! We need more African restaurants in Denver.',
    createdAt: '2024-12-29T19:00:00Z',
    likes: 12,
  },
  {
    id: '6',
    postId: '3',
    author: MOCK_USERS[1],
    content: 'Count me in! I\'ll bring some colleagues from the tech industry.',
    createdAt: '2024-12-28T14:30:00Z',
    likes: 4,
  },
];
