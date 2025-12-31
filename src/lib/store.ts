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
  paymentMethod?: 'in_app' | 'cash' | 'card_on_site';
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

export interface BusinessBookingSettings {
  businessId: string;
  isBookingEnabled: boolean;
  hasBusinessPro: boolean; // Subscription status
  businessProExpiresAt?: string;
  bookingHours: BusinessHours[];
  blockedDates: string[]; // Dates when business is closed
  blockedTimeSlots: { date: string; time: string }[]; // Specific blocked slots
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

  // Posts state
  userPosts: Post[];
  savedPostIds: string[];
  likedPostIds: string[];
  userComments: Comment[];

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

  // Actions
  setCurrentUser: (user: User | null) => void;
  setIsOnboarded: (value: boolean) => void;
  setIsGuest: (value: boolean) => void;
  setHasSeenWelcome: (value: boolean) => void;
  setSelectedLocation: (location: LocationData | null) => void;
  setCurrentCommunity: (community: Community | null) => void;
  setFeedFilter: (filter: 'local' | 'global') => void;
  addPost: (post: Post) => void;
  deletePost: (postId: string) => void;
  toggleSavePost: (postId: string) => void;
  toggleLikePost: (postId: string) => void;
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

      setCurrentUser: (user) => set({ currentUser: user }),
      setIsOnboarded: (value) => set({ isOnboarded: value }),
      setIsGuest: (value) => set({ isGuest: value }),
      setHasSeenWelcome: (value) => set({ hasSeenWelcome: value }),
      setSelectedLocation: (location) => set({ selectedLocation: location }),
      setCurrentCommunity: (community) => set({ currentCommunity: community }),
      setFeedFilter: (filter) => set({ feedFilter: filter }),
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
            ? { ...s, blockedTimeSlots: [...s.blockedTimeSlots, { date, time }] }
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
      logout: () => set({ currentUser: null, isOnboarded: false, isGuest: false }),
    }),
    {
      name: 'afroconnect-storage',
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
      }),
    }
  )
);

// Countries with states/regions
export const COUNTRIES = [
  { code: 'US', name: 'United States', hasStates: true },
  { code: 'GB', name: 'United Kingdom', hasStates: true },
  { code: 'CA', name: 'Canada', hasStates: true },
  { code: 'GH', name: 'Ghana', hasStates: true },
  { code: 'NG', name: 'Nigeria', hasStates: true },
  { code: 'KE', name: 'Kenya', hasStates: true },
  { code: 'ZA', name: 'South Africa', hasStates: true },
  { code: 'DE', name: 'Germany', hasStates: true },
  { code: 'FR', name: 'France', hasStates: false },
  { code: 'AU', name: 'Australia', hasStates: true },
  { code: 'AE', name: 'United Arab Emirates', hasStates: true },
];

export const STATES_BY_COUNTRY: Record<string, string[]> = {
  US: ['Alabama', 'Alaska', 'Arizona', 'California', 'Colorado', 'Connecticut', 'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Illinois', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'New Jersey', 'New York', 'North Carolina', 'Ohio', 'Pennsylvania', 'Texas', 'Virginia', 'Washington'],
  GB: ['England', 'Scotland', 'Wales', 'Northern Ireland'],
  CA: ['Alberta', 'British Columbia', 'Manitoba', 'Ontario', 'Quebec', 'Saskatchewan'],
  GH: ['Greater Accra', 'Ashanti', 'Western', 'Eastern', 'Central', 'Northern', 'Volta'],
  NG: ['Lagos', 'Abuja FCT', 'Kano', 'Rivers', 'Oyo', 'Kaduna', 'Enugu', 'Delta'],
  KE: ['Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Eldoret'],
  ZA: ['Gauteng', 'Western Cape', 'KwaZulu-Natal', 'Eastern Cape', 'Free State'],
  DE: ['Berlin', 'Bavaria', 'Hamburg', 'Hesse', 'North Rhine-Westphalia'],
  AU: ['New South Wales', 'Victoria', 'Queensland', 'Western Australia', 'South Australia'],
  AE: ['Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman'],
};

export const CITIES_BY_STATE: Record<string, string[]> = {
  'Colorado': ['Denver', 'Aurora', 'Colorado Springs', 'Boulder', 'Fort Collins'],
  'California': ['Los Angeles', 'San Francisco', 'San Diego', 'Oakland', 'Sacramento'],
  'Texas': ['Houston', 'Dallas', 'Austin', 'San Antonio', 'Fort Worth'],
  'Georgia': ['Atlanta', 'Savannah', 'Augusta', 'Columbus', 'Macon'],
  'New York': ['New York City', 'Buffalo', 'Rochester', 'Albany', 'Syracuse'],
  'England': ['London', 'Manchester', 'Birmingham', 'Liverpool', 'Leeds', 'Bristol'],
  'Ontario': ['Toronto', 'Ottawa', 'Mississauga', 'Hamilton', 'London'],
  'Greater Accra': ['Accra', 'Tema', 'Madina', 'Teshie', 'Nungua'],
  'Lagos': ['Lagos Island', 'Ikeja', 'Victoria Island', 'Lekki', 'Surulere'],
  'Nairobi': ['Nairobi Central', 'Westlands', 'Karen', 'Kilimani', 'Lavington'],
  'Gauteng': ['Johannesburg', 'Pretoria', 'Soweto', 'Sandton', 'Centurion'],
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
    name: 'Denver Africans',
    city: 'Denver',
    state: 'Colorado',
    country: 'USA',
    memberCount: 2340,
    image: 'https://images.unsplash.com/photo-1546156929-a4c0ac411f47?w=400&h=300&fit=crop',
  },
  {
    id: '2',
    name: 'Atlanta Africans',
    city: 'Atlanta',
    state: 'Georgia',
    country: 'USA',
    memberCount: 8920,
    image: 'https://images.unsplash.com/photo-1575917649705-5b59aaa12e6b?w=400&h=300&fit=crop',
  },
  {
    id: '3',
    name: 'London Africans',
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
    message: 'Welcome to Denver Africans community!',
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
