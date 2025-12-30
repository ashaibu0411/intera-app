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
}

export interface Post {
  id: string;
  author: User;
  content: string;
  images: string[];
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

interface AppState {
  // User state
  currentUser: User | null;
  isOnboarded: boolean;

  // Community state
  currentCommunity: Community | null;
  feedFilter: 'local' | 'global';

  // Actions
  setCurrentUser: (user: User | null) => void;
  setIsOnboarded: (value: boolean) => void;
  setCurrentCommunity: (community: Community | null) => void;
  setFeedFilter: (filter: 'local' | 'global') => void;
  logout: () => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      currentUser: null,
      isOnboarded: false,
      currentCommunity: null,
      feedFilter: 'local',

      setCurrentUser: (user) => set({ currentUser: user }),
      setIsOnboarded: (value) => set({ isOnboarded: value }),
      setCurrentCommunity: (community) => set({ currentCommunity: community }),
      setFeedFilter: (filter) => set({ feedFilter: filter }),
      logout: () => set({ currentUser: null, isOnboarded: false }),
    }),
    {
      name: 'afroconnect-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        currentUser: state.currentUser,
        isOnboarded: state.isOnboarded,
        currentCommunity: state.currentCommunity,
      }),
    }
  )
);

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
    country: 'USA',
    memberCount: 2340,
    image: 'https://images.unsplash.com/photo-1546156929-a4c0ac411f47?w=400&h=300&fit=crop',
  },
  {
    id: '2',
    name: 'Atlanta Africans',
    city: 'Atlanta',
    country: 'USA',
    memberCount: 8920,
    image: 'https://images.unsplash.com/photo-1575917649705-5b59aaa12e6b?w=400&h=300&fit=crop',
  },
  {
    id: '3',
    name: 'London Africans',
    city: 'London',
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
