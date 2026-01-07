import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { User } from './store';

// ============================================
// UBUNTU TRUST SCORE SYSTEM
// ============================================

export interface TrustScore {
  userId: string;
  overallScore: number; // 0-100
  verificationLevel: 'unverified' | 'basic' | 'verified' | 'trusted' | 'community_leader';
  badges: TrustBadge[];
  stats: {
    transactionsCompleted: number;
    eventsHosted: number;
    reviewsReceived: number;
    communityContributions: number;
    vouchesReceived: number;
    vouchesGiven: number;
    reportsFiled: number;
    reportsAgainst: number;
  };
  joinedDate: string;
  lastActive: string;
}

export interface TrustBadge {
  id: string;
  type: 'trusted_neighbor' | 'community_leader' | 'verified_business' | 'top_seller' | 'event_organizer' | 'mentor' | 'helper' | 'founding_member' | 'susu_reliable' | 'voice_host';
  name: string;
  description: string;
  earnedAt: string;
  icon: string;
}

export interface Vouch {
  id: string;
  fromUserId: string;
  fromUserName: string;
  fromUserAvatar: string;
  toUserId: string;
  message: string;
  relationship: 'friend' | 'family' | 'business' | 'neighbor' | 'colleague';
  createdAt: string;
}

// ============================================
// VILLAGE COUNCIL - COMMUNITY GOVERNANCE
// ============================================

export interface Poll {
  id: string;
  communityId: string;
  creatorId: string;
  creatorName: string;
  creatorAvatar: string;
  title: string;
  description: string;
  options: PollOption[];
  category: 'community' | 'safety' | 'events' | 'business' | 'other';
  status: 'active' | 'closed' | 'cancelled';
  totalVotes: number;
  startDate: string;
  endDate: string;
  isAnonymous: boolean;
  createdAt: string;
}

export interface PollOption {
  id: string;
  text: string;
  votes: number;
  voterIds: string[];
}

export interface CommunityProject {
  id: string;
  communityId: string;
  creatorId: string;
  title: string;
  description: string;
  category: 'cleanup' | 'event' | 'charity' | 'infrastructure' | 'education' | 'other';
  goalAmount: number;
  currentAmount: number;
  currency: string;
  contributors: ProjectContributor[];
  status: 'fundraising' | 'in_progress' | 'completed' | 'cancelled';
  targetDate: string;
  updates: ProjectUpdate[];
  images: string[];
  createdAt: string;
}

export interface ProjectContributor {
  userId: string;
  userName: string;
  userAvatar: string;
  amount: number;
  isAnonymous: boolean;
  message?: string;
  contributedAt: string;
}

export interface ProjectUpdate {
  id: string;
  title: string;
  content: string;
  images: string[];
  createdAt: string;
}

export interface EmergencyBroadcast {
  id: string;
  communityId: string;
  senderId: string;
  senderName: string;
  type: 'weather' | 'safety' | 'missing_person' | 'community_alert' | 'urgent_help';
  title: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  location?: string;
  contactInfo?: string;
  images?: string[];
  isResolved: boolean;
  resolvedAt?: string;
  responses: BroadcastResponse[];
  createdAt: string;
  expiresAt: string;
}

export interface BroadcastResponse {
  id: string;
  userId: string;
  userName: string;
  message: string;
  canHelp: boolean;
  createdAt: string;
}

export interface AskNeighborhood {
  id: string;
  communityId: string;
  askerId: string;
  askerName: string;
  askerAvatar: string;
  title: string;
  description: string;
  category: 'recommendation' | 'help_needed' | 'lost_found' | 'question' | 'other';
  isUrgent: boolean;
  responses: NeighborhoodResponse[];
  status: 'open' | 'resolved';
  createdAt: string;
}

export interface NeighborhoodResponse {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  message: string;
  isHelpful: boolean;
  helpfulCount: number;
  createdAt: string;
}

// ============================================
// WELCOME WAGON - NEW ARRIVALS
// ============================================

export interface WelcomeMatch {
  id: string;
  newArrivalId: string;
  mentorId: string;
  mentorName: string;
  mentorAvatar: string;
  mentorBio: string;
  matchReason: string[];
  status: 'pending' | 'accepted' | 'declined' | 'active' | 'completed';
  matchedAt: string;
  conversationId?: string;
}

export interface MentorProfile {
  userId: string;
  userName: string;
  userAvatar: string;
  bio: string;
  yearsInCommunity: number;
  languages: string[];
  expertise: string[];
  availability: 'available' | 'limited' | 'unavailable';
  menteeCount: number;
  rating: number;
  reviews: MentorReview[];
  isActive: boolean;
  createdAt: string;
}

export interface MentorReview {
  id: string;
  menteeId: string;
  menteeName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface ResourceGuide {
  id: string;
  cityId: string;
  cityName: string;
  category: 'housing' | 'jobs' | 'schools' | 'healthcare' | 'legal' | 'banking' | 'transportation' | 'shopping' | 'social';
  title: string;
  description: string;
  content: string;
  links: { title: string; url: string }[];
  contacts: { name: string; phone?: string; email?: string }[];
  lastUpdated: string;
  contributorId: string;
  helpfulCount: number;
}

// ============================================
// SUSU SAVINGS CIRCLES
// ============================================

export interface SusuCircle {
  id: string;
  name: string;
  description: string;
  creatorId: string;
  creatorName: string;
  members: SusuMember[];
  contributionAmount: number;
  currency: string;
  frequency: 'weekly' | 'biweekly' | 'monthly';
  startDate: string;
  currentRound: number;
  totalRounds: number;
  payoutOrder: string[]; // User IDs in payout order
  nextPayoutDate: string;
  nextPayoutRecipientId: string;
  status: 'forming' | 'active' | 'completed' | 'paused';
  rules: string;
  contributions: SusuContribution[];
  createdAt: string;
  // Privacy & Invitation settings
  isPrivate: boolean;
  inviteCode?: string;
  pendingInvites: SusuInvite[];
  maxMembers: number;
}

export interface SusuInvite {
  id: string;
  circleId: string;
  invitedUserId?: string;
  invitedUserName?: string;
  invitedUserPhone?: string;
  invitedUserEmail?: string;
  invitedBy: string;
  invitedByName: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  createdAt: string;
  expiresAt: string;
}

export interface SusuMember {
  userId: string;
  userName: string;
  userAvatar: string;
  position: number; // Position in payout order
  trustScore: number;
  hasReceivedPayout: boolean;
  totalContributed: number;
  missedContributions: number;
  joinedAt: string;
}

export interface SusuContribution {
  id: string;
  circleId: string;
  memberId: string;
  memberName: string;
  memberAvatar?: string;
  round: number;
  amount: number;
  status: 'pending' | 'paid' | 'late' | 'missed' | 'confirmed';
  paymentMethod: 'cash' | 'card' | 'bank_transfer' | 'mobile_money' | 'other';
  dueDate: string;
  paidAt?: string;
  confirmedAt?: string;
  confirmedBy?: string;
  transactionId?: string;
  receiptUrl?: string;
  notes?: string;
}

export interface SusuPayout {
  id: string;
  circleId: string;
  recipientId: string;
  recipientName: string;
  round: number;
  amount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  payoutMethod: 'cash' | 'bank_transfer' | 'mobile_money';
  scheduledDate: string;
  completedAt?: string;
  confirmedByRecipient: boolean;
  notes?: string;
}

export interface SusuDispute {
  id: string;
  circleId: string;
  reporterId: string;
  reporterName: string;
  againstUserId?: string;
  againstUserName?: string;
  type: 'missed_payment' | 'payout_issue' | 'fraud' | 'other';
  description: string;
  status: 'open' | 'investigating' | 'resolved' | 'escalated';
  resolution?: string;
  createdAt: string;
  resolvedAt?: string;
}

// ============================================
// JOB BOARD & SKILLS MARKETPLACE
// ============================================

export interface JobPosting {
  id: string;
  posterId: string;
  posterName: string;
  posterAvatar: string;
  posterType: 'individual' | 'business';
  businessId?: string;
  businessName?: string;
  title: string;
  description: string;
  type: 'full_time' | 'part_time' | 'contract' | 'gig' | 'internship' | 'volunteer';
  category: string;
  skills: string[];
  location: string;
  isRemote: boolean;
  salary?: {
    min: number;
    max: number;
    currency: string;
    period: 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'project';
  };
  requirements: string[];
  benefits: string[];
  applicationDeadline?: string;
  applicationsCount: number;
  status: 'open' | 'closed' | 'filled';
  createdAt: string;
}

export interface JobApplication {
  id: string;
  jobId: string;
  applicantId: string;
  applicantName: string;
  applicantAvatar: string;
  coverLetter: string;
  resumeUrl?: string;
  portfolioUrl?: string;
  status: 'pending' | 'reviewed' | 'shortlisted' | 'interviewed' | 'accepted' | 'rejected';
  notes?: string;
  appliedAt: string;
}

export interface SkillListing {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  title: string;
  description: string;
  category: string;
  skills: string[];
  hourlyRate?: number;
  projectRate?: number;
  currency: string;
  availability: 'available' | 'busy' | 'unavailable';
  portfolio: PortfolioItem[];
  reviews: SkillReview[];
  rating: number;
  completedJobs: number;
  responseTime: string;
  isVerified: boolean;
  createdAt: string;
}

export interface PortfolioItem {
  id: string;
  title: string;
  description: string;
  images: string[];
  link?: string;
  completedAt: string;
}

export interface SkillReview {
  id: string;
  reviewerId: string;
  reviewerName: string;
  rating: number;
  comment: string;
  jobTitle: string;
  createdAt: string;
}

// ============================================
// VOICE ROOMS
// ============================================

export interface VoiceRoom {
  id: string;
  hostId: string;
  hostName: string;
  hostAvatar: string;
  coHosts: string[];
  title: string;
  description: string;
  topic: string;
  category: 'general' | 'business' | 'culture' | 'faith' | 'politics' | 'entertainment' | 'education' | 'support';
  isLive: boolean;
  isRecurring: boolean;
  recurringSchedule?: {
    dayOfWeek: number;
    time: string;
    timezone: string;
  };
  speakers: VoiceRoomParticipant[];
  listeners: VoiceRoomParticipant[];
  raisedHands: string[];
  maxParticipants: number;
  isPrivate: boolean;
  invitedUsers?: string[];
  startedAt?: string;
  endedAt?: string;
  scheduledFor?: string;
  recordingUrl?: string;
  createdAt: string;
}

export interface VoiceRoomParticipant {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  role: 'host' | 'co_host' | 'speaker' | 'listener';
  isMuted: boolean;
  joinedAt: string;
}

// ============================================
// CREATOR BATTLES
// ============================================

export interface CreatorBattle {
  id: string;
  status: 'waiting' | 'countdown' | 'live' | 'ended';
  creator1: BattleCreator;
  creator2: BattleCreator | null;
  duration: number; // in seconds (e.g., 180 for 3 min, 300 for 5 min)
  startedAt: string | null;
  endedAt: string | null;
  winnerId: string | null;
  viewerCount: number;
  totalGifts: number;
  category: 'entertainment' | 'music' | 'comedy' | 'dance' | 'talent' | 'chat';
  createdAt: string;
}

export interface BattleCreator {
  id: string;
  odooUserId: string;
  name: string;
  avatar: string;
  score: number;
  giftsReceived: BattleGift[];
  isReady: boolean;
}

export interface BattleGift {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  giftId: string;
  giftName: string;
  giftValue: number;
  giftIcon: string;
  timestamp: string;
}

export interface BattleInvite {
  id: string;
  battleId: string;
  fromUserId: string;
  fromUserName: string;
  fromUserAvatar: string;
  toUserId: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  createdAt: string;
  expiresAt: string;
}

// ============================================
// LIVE STREAMING
// ============================================

export interface LiveStream {
  id: string;
  hostId: string;
  hostName: string;
  hostAvatar: string;
  title: string;
  description: string;
  category: 'event' | 'church' | 'cooking' | 'music' | 'education' | 'business' | 'entertainment' | 'other';
  thumbnailUrl?: string;
  streamUrl?: string;
  isLive: boolean;
  viewerCount: number;
  peakViewers: number;
  likes: number;
  comments: StreamComment[];
  scheduledFor?: string;
  startedAt?: string;
  endedAt?: string;
  duration?: number;
  recordingUrl?: string;
  isPrivate: boolean;
  ticketPrice?: number;
  currency?: string;
  createdAt: string;
}

export interface StreamComment {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  message: string;
  isPinned: boolean;
  createdAt: string;
}

// ============================================
// ENHANCED MARKETPLACE - ESCROW & BARTERING
// ============================================

export interface EscrowTransaction {
  id: string;
  listingId: string;
  listingTitle: string;
  sellerId: string;
  sellerName: string;
  buyerId: string;
  buyerName: string;
  amount: number;
  currency: string;
  status: 'pending_payment' | 'payment_held' | 'shipped' | 'delivered' | 'completed' | 'disputed' | 'refunded' | 'cancelled';
  trackingNumber?: string;
  shippingCarrier?: string;
  deliveryProof?: string[];
  buyerConfirmed: boolean;
  sellerConfirmed: boolean;
  disputeReason?: string;
  disputeResolution?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface BarterListing {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  offerTitle: string;
  offerDescription: string;
  offerCategory: string;
  offerImages: string[];
  offerValue: number; // Estimated value
  wantedItems: string[];
  wantedCategories: string[];
  wantedValueRange: { min: number; max: number };
  currency: string;
  location: string;
  status: 'open' | 'in_negotiation' | 'traded' | 'closed';
  offers: BarterOffer[];
  createdAt: string;
}

export interface BarterOffer {
  id: string;
  listingId: string;
  offererId: string;
  offererName: string;
  offererAvatar: string;
  offerDescription: string;
  offerImages: string[];
  offerValue: number;
  message: string;
  status: 'pending' | 'accepted' | 'declined' | 'countered';
  counterOffer?: string;
  createdAt: string;
}

export interface GroupBuy {
  id: string;
  organizerId: string;
  organizerName: string;
  title: string;
  description: string;
  productImages: string[];
  originalPrice: number;
  groupPrice: number;
  currency: string;
  minParticipants: number;
  maxParticipants: number;
  currentParticipants: GroupBuyParticipant[];
  deadline: string;
  status: 'open' | 'minimum_reached' | 'closed' | 'cancelled' | 'completed';
  vendorInfo: string;
  deliveryInfo: string;
  createdAt: string;
}

export interface GroupBuyParticipant {
  userId: string;
  userName: string;
  quantity: number;
  hasPaid: boolean;
  joinedAt: string;
}

// ============================================
// HERITAGE HUB
// ============================================

export interface FamilyTree {
  id: string;
  ownerId: string;
  name: string;
  description: string;
  members: FamilyMember[];
  isPublic: boolean;
  collaborators: string[];
  createdAt: string;
  updatedAt: string;
}

export interface FamilyMember {
  id: string;
  name: string;
  birthDate?: string;
  deathDate?: string;
  birthPlace?: string;
  currentLocation?: string;
  photo?: string;
  bio?: string;
  relationship: string;
  parentIds: string[];
  spouseIds: string[];
  childIds: string[];
  stories: FamilyStory[];
}

export interface FamilyStory {
  id: string;
  memberId: string;
  title: string;
  content: string;
  media: { type: 'image' | 'video' | 'audio'; url: string }[];
  recordedBy: string;
  recordedAt: string;
}

export interface TraditionalRecipe {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  title: string;
  description: string;
  origin: string;
  region: string;
  category: 'main' | 'side' | 'dessert' | 'drink' | 'snack' | 'breakfast';
  ingredients: { item: string; amount: string; notes?: string }[];
  instructions: { step: number; text: string; image?: string; video?: string }[];
  prepTime: number;
  cookTime: number;
  servings: number;
  difficulty: 'easy' | 'medium' | 'hard';
  tips: string[];
  story: string;
  images: string[];
  videoUrl?: string;
  likes: number;
  saves: number;
  reviews: RecipeReview[];
  createdAt: string;
}

export interface RecipeReview {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  rating: number;
  comment: string;
  images?: string[];
  createdAt: string;
}

export interface LanguagePod {
  id: string;
  hostId: string;
  hostName: string;
  hostAvatar: string;
  language: string;
  dialect?: string;
  level: 'beginner' | 'intermediate' | 'advanced' | 'native';
  title: string;
  description: string;
  maxParticipants: number;
  participants: LanguagePodParticipant[];
  schedule: { dayOfWeek: number; time: string; duration: number }[];
  isOnline: boolean;
  meetingLink?: string;
  location?: string;
  lessons: LanguageLesson[];
  status: 'open' | 'full' | 'in_progress' | 'completed';
  createdAt: string;
}

export interface LanguagePodParticipant {
  userId: string;
  userName: string;
  userAvatar: string;
  level: string;
  joinedAt: string;
  lessonsAttended: number;
}

export interface LanguageLesson {
  id: string;
  podId: string;
  title: string;
  description: string;
  vocabulary: { word: string; translation: string; pronunciation?: string }[];
  phrases: { phrase: string; translation: string; pronunciation?: string }[];
  audioUrl?: string;
  videoUrl?: string;
  notes: string;
  scheduledFor: string;
  completedAt?: string;
}

// ============================================
// EMERGENCY NETWORK & SAFETY
// ============================================

export interface TrustedContact {
  id: string;
  userId: string;
  contactId: string;
  contactName: string;
  contactAvatar: string;
  contactPhone?: string;
  relationship: string;
  canReceiveAlerts: boolean;
  canSeeLocation: boolean;
  addedAt: string;
}

export interface SafetyAlert {
  id: string;
  senderId: string;
  senderName: string;
  type: 'sos' | 'check_in' | 'safe_arrival' | 'walk_with_me';
  status: 'active' | 'resolved' | 'false_alarm';
  location?: { latitude: number; longitude: number; address: string };
  message?: string;
  recipients: string[];
  responses: SafetyResponse[];
  createdAt: string;
  resolvedAt?: string;
}

export interface SafetyResponse {
  id: string;
  responderId: string;
  responderName: string;
  message: string;
  isOnWay: boolean;
  eta?: string;
  createdAt: string;
}

export interface WalkWithMe {
  id: string;
  userId: string;
  userName: string;
  destination: string;
  estimatedArrival: string;
  companions: string[];
  checkInInterval: number; // minutes
  lastCheckIn: string;
  status: 'active' | 'arrived' | 'missed_checkin' | 'cancelled';
  route?: { latitude: number; longitude: number; timestamp: string }[];
  createdAt: string;
}

// ============================================
// SUPPORT CIRCLES
// ============================================

export interface SupportCircle {
  id: string;
  name: string;
  description: string;
  category: 'grief' | 'immigration' | 'career' | 'parenting' | 'health' | 'relationship' | 'faith' | 'general';
  isPrivate: boolean;
  facilitatorId: string;
  facilitatorName: string;
  facilitatorAvatar: string;
  members: SupportCircleMember[];
  maxMembers: number;
  meetingSchedule?: {
    frequency: 'weekly' | 'biweekly' | 'monthly';
    dayOfWeek: number;
    time: string;
    isOnline: boolean;
    meetingLink?: string;
    location?: string;
  };
  guidelines: string;
  posts: SupportPost[];
  isActive: boolean;
  createdAt: string;
}

export interface SupportCircleMember {
  userId: string;
  userName: string;
  userAvatar: string;
  role: 'facilitator' | 'member';
  isAnonymous: boolean;
  displayName: string;
  joinedAt: string;
  lastActive: string;
}

export interface SupportPost {
  id: string;
  circleId: string;
  authorId: string;
  authorDisplayName: string;
  authorAvatar?: string;
  isAnonymous: boolean;
  content: string;
  type: 'share' | 'question' | 'resource' | 'milestone' | 'request';
  reactions: { type: string; count: number; userIds: string[] }[];
  comments: SupportComment[];
  createdAt: string;
}

export interface SupportComment {
  id: string;
  authorId: string;
  authorDisplayName: string;
  authorAvatar?: string;
  isAnonymous: boolean;
  content: string;
  createdAt: string;
}

// ============================================
// GAMIFICATION
// ============================================

export interface UserAchievements {
  userId: string;
  points: number;
  level: number;
  levelName: string;
  badges: AchievementBadge[];
  streaks: {
    currentDaily: number;
    longestDaily: number;
    currentWeekly: number;
    longestWeekly: number;
  };
  stats: {
    postsCreated: number;
    eventsAttended: number;
    businessesSupported: number;
    helpGiven: number;
    connectionsAide: number;
  };
  challenges: ChallengeProgress[];
}

export interface AchievementBadge {
  id: string;
  type: string;
  name: string;
  description: string;
  icon: string;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  earnedAt: string;
  progress?: number;
  maxProgress?: number;
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  type: 'daily' | 'weekly' | 'monthly' | 'special';
  category: 'social' | 'business' | 'community' | 'cultural' | 'learning';
  requirements: ChallengeRequirement[];
  reward: {
    points: number;
    badge?: string;
    discount?: { businessId: string; percentage: number };
  };
  startDate: string;
  endDate: string;
  participantsCount: number;
  completedCount: number;
  isActive: boolean;
}

export interface ChallengeRequirement {
  type: string;
  target: number;
  description: string;
}

export interface ChallengeProgress {
  challengeId: string;
  progress: { [key: string]: number };
  isCompleted: boolean;
  completedAt?: string;
  joinedAt: string;
}

export interface Leaderboard {
  id: string;
  communityId: string;
  type: 'weekly' | 'monthly' | 'all_time';
  category: 'overall' | 'helpful' | 'social' | 'business_support' | 'event_organizer';
  entries: LeaderboardEntry[];
  lastUpdated: string;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  userName: string;
  userAvatar: string;
  points: number;
  change: number; // Position change from last period
}

// ============================================
// ADVANCED EVENTS
// ============================================

export interface TicketedEvent {
  id: string;
  organizerId: string;
  organizerName: string;
  organizerAvatar: string;
  coHosts: { userId: string; userName: string; role: string }[];
  title: string;
  description: string;
  category: string;
  images: string[];
  videoUrl?: string;
  venue: {
    name: string;
    address: string;
    latitude?: number;
    longitude?: number;
    capacity: number;
  };
  isVirtual: boolean;
  virtualLink?: string;
  startDate: string;
  endDate: string;
  timezone: string;
  tickets: EventTicketType[];
  soldTickets: number;
  revenue: number;
  currency: string;
  refundPolicy: string;
  ageRestriction?: number;
  tags: string[];
  status: 'draft' | 'published' | 'sold_out' | 'cancelled' | 'completed';
  waitlist: WaitlistEntry[];
  createdAt: string;
}

export interface EventTicketType {
  id: string;
  name: string;
  description: string;
  price: number;
  quantity: number;
  sold: number;
  maxPerPerson: number;
  salesStart: string;
  salesEnd: string;
  perks: string[];
}

export interface EventTicket {
  id: string;
  eventId: string;
  ticketTypeId: string;
  ticketTypeName: string;
  buyerId: string;
  buyerName: string;
  buyerEmail: string;
  quantity: number;
  totalPaid: number;
  currency: string;
  qrCode: string;
  status: 'valid' | 'used' | 'refunded' | 'cancelled';
  purchasedAt: string;
  usedAt?: string;
}

export interface WaitlistEntry {
  userId: string;
  userName: string;
  userEmail: string;
  ticketTypeId: string;
  quantity: number;
  addedAt: string;
  notified: boolean;
}

export interface EventSeries {
  id: string;
  organizerId: string;
  title: string;
  description: string;
  category: string;
  recurrence: {
    frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly';
    dayOfWeek?: number;
    dayOfMonth?: number;
    time: string;
    endDate?: string;
  };
  events: string[]; // Event IDs
  subscribers: string[];
  isActive: boolean;
  createdAt: string;
}

export interface WatchParty {
  id: string;
  hostId: string;
  hostName: string;
  hostAvatar: string;
  title: string;
  description: string;
  eventType: 'sports' | 'movie' | 'tv_show' | 'concert' | 'ceremony' | 'other';
  watchingWhat: string;
  venue?: {
    type: 'virtual' | 'in_person';
    location?: string;
    address?: string;
    meetingLink?: string;
  };
  startTime: string;
  maxAttendees?: number;
  attendees: WatchPartyAttendee[];
  chat: WatchPartyMessage[];
  isPrivate: boolean;
  createdAt: string;
}

export interface WatchPartyAttendee {
  userId: string;
  userName: string;
  userAvatar: string;
  status: 'going' | 'maybe' | 'invited';
  joinedAt: string;
}

export interface WatchPartyMessage {
  id: string;
  userId: string;
  userName: string;
  message: string;
  timestamp: string;
}

// ============================================
// ADVANCED FEATURES STORE
// ============================================

interface AdvancedFeaturesState {
  // Ubuntu Trust Score
  trustScores: { [userId: string]: TrustScore };
  vouches: Vouch[];

  // Village Council
  polls: Poll[];
  communityProjects: CommunityProject[];
  emergencyBroadcasts: EmergencyBroadcast[];
  askNeighborhood: AskNeighborhood[];

  // Welcome Wagon
  welcomeMatches: WelcomeMatch[];
  mentorProfiles: MentorProfile[];
  resourceGuides: ResourceGuide[];

  // Susu Circles
  susuCircles: SusuCircle[];
  susuContributions: SusuContribution[];
  susuPayouts: SusuPayout[];
  susuDisputes: SusuDispute[];

  // Job Board
  jobPostings: JobPosting[];
  jobApplications: JobApplication[];
  skillListings: SkillListing[];

  // Voice Rooms
  voiceRooms: VoiceRoom[];

  // Creator Battles
  creatorBattles: CreatorBattle[];
  battleInvites: BattleInvite[];

  // Live Streaming
  liveStreams: LiveStream[];

  // Enhanced Marketplace
  escrowTransactions: EscrowTransaction[];
  barterListings: BarterListing[];
  groupBuys: GroupBuy[];

  // Heritage Hub
  familyTrees: FamilyTree[];
  recipes: TraditionalRecipe[];
  languagePods: LanguagePod[];

  // Safety
  trustedContacts: TrustedContact[];
  safetyAlerts: SafetyAlert[];
  walkWithMeSessions: WalkWithMe[];

  // Support Circles
  supportCircles: SupportCircle[];

  // Gamification
  userAchievements: UserAchievements | null;
  activeChallenges: Challenge[];
  leaderboards: Leaderboard[];

  // Advanced Events
  ticketedEvents: TicketedEvent[];
  myTickets: EventTicket[];
  eventSeries: EventSeries[];
  watchParties: WatchParty[];

  // Actions
  setTrustScore: (userId: string, score: TrustScore) => void;
  addVouch: (vouch: Vouch) => void;
  addPoll: (poll: Poll) => void;
  votePoll: (pollId: string, optionId: string, userId: string) => void;
  addCommunityProject: (project: CommunityProject) => void;
  contributeToProject: (projectId: string, contribution: ProjectContributor) => void;
  addEmergencyBroadcast: (broadcast: EmergencyBroadcast) => void;
  resolveEmergencyBroadcast: (broadcastId: string) => void;
  addAskNeighborhood: (ask: AskNeighborhood) => void;
  respondToAsk: (askId: string, response: NeighborhoodResponse) => void;
  addSusuCircle: (circle: SusuCircle) => void;
  joinSusuCircle: (circleId: string, member: SusuMember) => void;
  addSusuContribution: (contribution: SusuContribution) => void;
  updateSusuContribution: (contributionId: string, updates: Partial<SusuContribution>) => void;
  confirmSusuContribution: (contributionId: string, confirmedBy: string) => void;
  addSusuPayout: (payout: SusuPayout) => void;
  updateSusuPayout: (payoutId: string, updates: Partial<SusuPayout>) => void;
  addSusuDispute: (dispute: SusuDispute) => void;
  resolveSusuDispute: (disputeId: string, resolution: string) => void;
  updateSusuCircle: (circleId: string, updates: Partial<SusuCircle>) => void;
  addJobPosting: (job: JobPosting) => void;
  applyToJob: (application: JobApplication) => void;
  addSkillListing: (listing: SkillListing) => void;
  addVoiceRoom: (room: VoiceRoom) => void;
  joinVoiceRoom: (roomId: string, participant: VoiceRoomParticipant) => void;
  leaveVoiceRoom: (roomId: string, userId: string) => void;
  // Creator Battles
  createBattle: (battle: CreatorBattle) => void;
  joinBattle: (battleId: string, creator: BattleCreator) => void;
  startBattle: (battleId: string) => void;
  endBattle: (battleId: string, winnerId: string) => void;
  addBattleGift: (battleId: string, creatorId: string, gift: BattleGift) => void;
  sendBattleInvite: (invite: BattleInvite) => void;
  respondToBattleInvite: (inviteId: string, status: 'accepted' | 'declined') => void;
  addLiveStream: (stream: LiveStream) => void;
  addStreamComment: (streamId: string, comment: StreamComment) => void;
  addEscrowTransaction: (transaction: EscrowTransaction) => void;
  updateEscrowStatus: (transactionId: string, status: EscrowTransaction['status']) => void;
  addBarterListing: (listing: BarterListing) => void;
  makeBarterOffer: (listingId: string, offer: BarterOffer) => void;
  addGroupBuy: (groupBuy: GroupBuy) => void;
  joinGroupBuy: (groupBuyId: string, participant: GroupBuyParticipant) => void;
  addFamilyTree: (tree: FamilyTree) => void;
  addFamilyMember: (treeId: string, member: FamilyMember) => void;
  addRecipe: (recipe: TraditionalRecipe) => void;
  addLanguagePod: (pod: LanguagePod) => void;
  joinLanguagePod: (podId: string, participant: LanguagePodParticipant) => void;
  addTrustedContact: (contact: TrustedContact) => void;
  removeTrustedContact: (contactId: string) => void;
  sendSafetyAlert: (alert: SafetyAlert) => void;
  respondToSafetyAlert: (alertId: string, response: SafetyResponse) => void;
  startWalkWithMe: (session: WalkWithMe) => void;
  endWalkWithMe: (sessionId: string, status: WalkWithMe['status']) => void;
  addSupportCircle: (circle: SupportCircle) => void;
  joinSupportCircle: (circleId: string, member: SupportCircleMember) => void;
  addSupportPost: (circleId: string, post: SupportPost) => void;
  setUserAchievements: (achievements: UserAchievements) => void;
  addPoints: (points: number) => void;
  earnBadge: (badge: AchievementBadge) => void;
  joinChallenge: (challengeId: string) => void;
  updateChallengeProgress: (challengeId: string, progress: { [key: string]: number }) => void;
  addTicketedEvent: (event: TicketedEvent) => void;
  purchaseTicket: (ticket: EventTicket) => void;
  addWatchParty: (party: WatchParty) => void;
  joinWatchParty: (partyId: string, attendee: WatchPartyAttendee) => void;
}

export const useAdvancedFeatures = create<AdvancedFeaturesState>()(
  persist(
    (set) => ({
      // Initial state
      trustScores: {},
      vouches: [],
      polls: [],
      communityProjects: [],
      emergencyBroadcasts: [],
      askNeighborhood: [],
      welcomeMatches: [],
      mentorProfiles: [],
      resourceGuides: [],
      susuCircles: [],
      susuContributions: [],
      susuPayouts: [],
      susuDisputes: [],
      jobPostings: [],
      jobApplications: [],
      skillListings: [],
      voiceRooms: [],
      creatorBattles: [],
      battleInvites: [],
      liveStreams: [],
      escrowTransactions: [],
      barterListings: [],
      groupBuys: [],
      familyTrees: [],
      recipes: [],
      languagePods: [],
      trustedContacts: [],
      safetyAlerts: [],
      walkWithMeSessions: [],
      supportCircles: [],
      userAchievements: null,
      activeChallenges: [],
      leaderboards: [],
      ticketedEvents: [],
      myTickets: [],
      eventSeries: [],
      watchParties: [],

      // Actions
      setTrustScore: (userId, score) => set((state) => ({
        trustScores: { ...state.trustScores, [userId]: score }
      })),

      addVouch: (vouch) => set((state) => ({
        vouches: [vouch, ...state.vouches]
      })),

      addPoll: (poll) => set((state) => ({
        polls: [poll, ...state.polls]
      })),

      votePoll: (pollId, optionId, userId) => set((state) => ({
        polls: state.polls.map((poll) => {
          if (poll.id !== pollId) return poll;
          return {
            ...poll,
            totalVotes: poll.totalVotes + 1,
            options: poll.options.map((opt) => {
              if (opt.id !== optionId) return opt;
              return {
                ...opt,
                votes: opt.votes + 1,
                voterIds: [...opt.voterIds, userId]
              };
            })
          };
        })
      })),

      addCommunityProject: (project) => set((state) => ({
        communityProjects: [project, ...state.communityProjects]
      })),

      contributeToProject: (projectId, contribution) => set((state) => ({
        communityProjects: state.communityProjects.map((project) => {
          if (project.id !== projectId) return project;
          return {
            ...project,
            currentAmount: project.currentAmount + contribution.amount,
            contributors: [...project.contributors, contribution]
          };
        })
      })),

      addEmergencyBroadcast: (broadcast) => set((state) => ({
        emergencyBroadcasts: [broadcast, ...state.emergencyBroadcasts]
      })),

      resolveEmergencyBroadcast: (broadcastId) => set((state) => ({
        emergencyBroadcasts: state.emergencyBroadcasts.map((b) =>
          b.id === broadcastId ? { ...b, isResolved: true, resolvedAt: new Date().toISOString() } : b
        )
      })),

      addAskNeighborhood: (ask) => set((state) => ({
        askNeighborhood: [ask, ...state.askNeighborhood]
      })),

      respondToAsk: (askId, response) => set((state) => ({
        askNeighborhood: state.askNeighborhood.map((ask) =>
          ask.id === askId ? { ...ask, responses: [...ask.responses, response] } : ask
        )
      })),

      addSusuCircle: (circle) => set((state) => ({
        susuCircles: [circle, ...state.susuCircles]
      })),

      joinSusuCircle: (circleId, member) => set((state) => ({
        susuCircles: state.susuCircles.map((circle) =>
          circle.id === circleId ? { ...circle, members: [...circle.members, member] } : circle
        )
      })),

      addSusuContribution: (contribution) => set((state) => ({
        susuContributions: [contribution, ...state.susuContributions]
      })),

      updateSusuContribution: (contributionId, updates) => set((state) => ({
        susuContributions: state.susuContributions.map((c) =>
          c.id === contributionId ? { ...c, ...updates } : c
        )
      })),

      confirmSusuContribution: (contributionId, confirmedBy) => set((state) => ({
        susuContributions: state.susuContributions.map((c) =>
          c.id === contributionId ? {
            ...c,
            status: 'confirmed' as const,
            confirmedAt: new Date().toISOString(),
            confirmedBy
          } : c
        )
      })),

      addSusuPayout: (payout) => set((state) => ({
        susuPayouts: [payout, ...state.susuPayouts]
      })),

      updateSusuPayout: (payoutId, updates) => set((state) => ({
        susuPayouts: state.susuPayouts.map((p) =>
          p.id === payoutId ? { ...p, ...updates } : p
        )
      })),

      addSusuDispute: (dispute) => set((state) => ({
        susuDisputes: [dispute, ...state.susuDisputes]
      })),

      resolveSusuDispute: (disputeId, resolution) => set((state) => ({
        susuDisputes: state.susuDisputes.map((d) =>
          d.id === disputeId ? {
            ...d,
            status: 'resolved' as const,
            resolution,
            resolvedAt: new Date().toISOString()
          } : d
        )
      })),

      updateSusuCircle: (circleId, updates) => set((state) => ({
        susuCircles: state.susuCircles.map((c) =>
          c.id === circleId ? { ...c, ...updates } : c
        )
      })),

      addJobPosting: (job) => set((state) => ({
        jobPostings: [job, ...state.jobPostings]
      })),

      applyToJob: (application) => set((state) => ({
        jobApplications: [application, ...state.jobApplications],
        jobPostings: state.jobPostings.map((job) =>
          job.id === application.jobId ? { ...job, applicationsCount: job.applicationsCount + 1 } : job
        )
      })),

      addSkillListing: (listing) => set((state) => ({
        skillListings: [listing, ...state.skillListings]
      })),

      addVoiceRoom: (room) => set((state) => ({
        voiceRooms: [room, ...state.voiceRooms]
      })),

      joinVoiceRoom: (roomId, participant) => set((state) => ({
        voiceRooms: state.voiceRooms.map((room) =>
          room.id === roomId ? { ...room, listeners: [...room.listeners, participant] } : room
        )
      })),

      leaveVoiceRoom: (roomId, userId) => set((state) => ({
        voiceRooms: state.voiceRooms.map((room) =>
          room.id === roomId ? {
            ...room,
            listeners: room.listeners.filter((l) => l.userId !== userId),
            speakers: room.speakers.filter((s) => s.userId !== userId)
          } : room
        )
      })),

      // Creator Battles
      createBattle: (battle) => set((state) => ({
        creatorBattles: [battle, ...state.creatorBattles]
      })),

      joinBattle: (battleId, creator) => set((state) => ({
        creatorBattles: state.creatorBattles.map((battle) =>
          battle.id === battleId ? { ...battle, creator2: creator, status: 'countdown' } : battle
        )
      })),

      startBattle: (battleId) => set((state) => ({
        creatorBattles: state.creatorBattles.map((battle) =>
          battle.id === battleId ? { ...battle, status: 'live', startedAt: new Date().toISOString() } : battle
        )
      })),

      endBattle: (battleId, winnerId) => set((state) => ({
        creatorBattles: state.creatorBattles.map((battle) =>
          battle.id === battleId ? { ...battle, status: 'ended', winnerId, endedAt: new Date().toISOString() } : battle
        )
      })),

      addBattleGift: (battleId, creatorId, gift) => set((state) => ({
        creatorBattles: state.creatorBattles.map((battle) => {
          if (battle.id !== battleId) return battle;

          const updateCreator = (creator: BattleCreator | null) => {
            if (!creator || creator.id !== creatorId) return creator;
            return {
              ...creator,
              score: creator.score + gift.giftValue,
              giftsReceived: [...creator.giftsReceived, gift]
            };
          };

          return {
            ...battle,
            creator1: updateCreator(battle.creator1) as BattleCreator,
            creator2: updateCreator(battle.creator2),
            totalGifts: battle.totalGifts + gift.giftValue
          };
        })
      })),

      sendBattleInvite: (invite) => set((state) => ({
        battleInvites: [invite, ...state.battleInvites]
      })),

      respondToBattleInvite: (inviteId, status) => set((state) => ({
        battleInvites: state.battleInvites.map((invite) =>
          invite.id === inviteId ? { ...invite, status } : invite
        )
      })),

      addLiveStream: (stream) => set((state) => ({
        liveStreams: [stream, ...state.liveStreams]
      })),

      addStreamComment: (streamId, comment) => set((state) => ({
        liveStreams: state.liveStreams.map((stream) =>
          stream.id === streamId ? { ...stream, comments: [...stream.comments, comment] } : stream
        )
      })),

      addEscrowTransaction: (transaction) => set((state) => ({
        escrowTransactions: [transaction, ...state.escrowTransactions]
      })),

      updateEscrowStatus: (transactionId, status) => set((state) => ({
        escrowTransactions: state.escrowTransactions.map((t) =>
          t.id === transactionId ? { ...t, status, updatedAt: new Date().toISOString() } : t
        )
      })),

      addBarterListing: (listing) => set((state) => ({
        barterListings: [listing, ...state.barterListings]
      })),

      makeBarterOffer: (listingId, offer) => set((state) => ({
        barterListings: state.barterListings.map((listing) =>
          listing.id === listingId ? { ...listing, offers: [...listing.offers, offer], status: 'in_negotiation' } : listing
        )
      })),

      addGroupBuy: (groupBuy) => set((state) => ({
        groupBuys: [groupBuy, ...state.groupBuys]
      })),

      joinGroupBuy: (groupBuyId, participant) => set((state) => ({
        groupBuys: state.groupBuys.map((gb) => {
          if (gb.id !== groupBuyId) return gb;
          const newParticipants = [...gb.currentParticipants, participant];
          return {
            ...gb,
            currentParticipants: newParticipants,
            status: newParticipants.length >= gb.minParticipants ? 'minimum_reached' : gb.status
          };
        })
      })),

      addFamilyTree: (tree) => set((state) => ({
        familyTrees: [tree, ...state.familyTrees]
      })),

      addFamilyMember: (treeId, member) => set((state) => ({
        familyTrees: state.familyTrees.map((tree) =>
          tree.id === treeId ? { ...tree, members: [...tree.members, member], updatedAt: new Date().toISOString() } : tree
        )
      })),

      addRecipe: (recipe) => set((state) => ({
        recipes: [recipe, ...state.recipes]
      })),

      addLanguagePod: (pod) => set((state) => ({
        languagePods: [pod, ...state.languagePods]
      })),

      joinLanguagePod: (podId, participant) => set((state) => ({
        languagePods: state.languagePods.map((pod) => {
          if (pod.id !== podId) return pod;
          const newParticipants = [...pod.participants, participant];
          return {
            ...pod,
            participants: newParticipants,
            status: newParticipants.length >= pod.maxParticipants ? 'full' : pod.status
          };
        })
      })),

      addTrustedContact: (contact) => set((state) => ({
        trustedContacts: [contact, ...state.trustedContacts]
      })),

      removeTrustedContact: (contactId) => set((state) => ({
        trustedContacts: state.trustedContacts.filter((c) => c.id !== contactId)
      })),

      sendSafetyAlert: (alert) => set((state) => ({
        safetyAlerts: [alert, ...state.safetyAlerts]
      })),

      respondToSafetyAlert: (alertId, response) => set((state) => ({
        safetyAlerts: state.safetyAlerts.map((alert) =>
          alert.id === alertId ? { ...alert, responses: [...alert.responses, response] } : alert
        )
      })),

      startWalkWithMe: (session) => set((state) => ({
        walkWithMeSessions: [session, ...state.walkWithMeSessions]
      })),

      endWalkWithMe: (sessionId, status) => set((state) => ({
        walkWithMeSessions: state.walkWithMeSessions.map((s) =>
          s.id === sessionId ? { ...s, status } : s
        )
      })),

      addSupportCircle: (circle) => set((state) => ({
        supportCircles: [circle, ...state.supportCircles]
      })),

      joinSupportCircle: (circleId, member) => set((state) => ({
        supportCircles: state.supportCircles.map((circle) =>
          circle.id === circleId ? { ...circle, members: [...circle.members, member] } : circle
        )
      })),

      addSupportPost: (circleId, post) => set((state) => ({
        supportCircles: state.supportCircles.map((circle) =>
          circle.id === circleId ? { ...circle, posts: [post, ...circle.posts] } : circle
        )
      })),

      setUserAchievements: (achievements) => set({ userAchievements: achievements }),

      addPoints: (points) => set((state) => {
        if (!state.userAchievements) return state;
        const newPoints = state.userAchievements.points + points;
        const newLevel = Math.floor(newPoints / 1000) + 1;
        const levelNames = ['Newcomer', 'Explorer', 'Contributor', 'Ambassador', 'Elder', 'Legend'];
        return {
          userAchievements: {
            ...state.userAchievements,
            points: newPoints,
            level: newLevel,
            levelName: levelNames[Math.min(newLevel - 1, levelNames.length - 1)]
          }
        };
      }),

      earnBadge: (badge) => set((state) => {
        if (!state.userAchievements) return state;
        return {
          userAchievements: {
            ...state.userAchievements,
            badges: [...state.userAchievements.badges, badge]
          }
        };
      }),

      joinChallenge: (challengeId) => set((state) => {
        if (!state.userAchievements) return state;
        const newProgress: ChallengeProgress = {
          challengeId,
          progress: {},
          isCompleted: false,
          joinedAt: new Date().toISOString()
        };
        return {
          userAchievements: {
            ...state.userAchievements,
            challenges: [...state.userAchievements.challenges, newProgress]
          }
        };
      }),

      updateChallengeProgress: (challengeId, progress) => set((state) => {
        if (!state.userAchievements) return state;
        return {
          userAchievements: {
            ...state.userAchievements,
            challenges: state.userAchievements.challenges.map((c) =>
              c.challengeId === challengeId ? { ...c, progress: { ...c.progress, ...progress } } : c
            )
          }
        };
      }),

      addTicketedEvent: (event) => set((state) => ({
        ticketedEvents: [event, ...state.ticketedEvents]
      })),

      purchaseTicket: (ticket) => set((state) => ({
        myTickets: [ticket, ...state.myTickets],
        ticketedEvents: state.ticketedEvents.map((event) => {
          if (event.id !== ticket.eventId) return event;
          return {
            ...event,
            soldTickets: event.soldTickets + ticket.quantity,
            revenue: event.revenue + ticket.totalPaid,
            tickets: event.tickets.map((t) =>
              t.id === ticket.ticketTypeId ? { ...t, sold: t.sold + ticket.quantity } : t
            )
          };
        })
      })),

      addWatchParty: (party) => set((state) => ({
        watchParties: [party, ...state.watchParties]
      })),

      joinWatchParty: (partyId, attendee) => set((state) => ({
        watchParties: state.watchParties.map((party) =>
          party.id === partyId ? { ...party, attendees: [...party.attendees, attendee] } : party
        )
      })),
    }),
    {
      name: 'diaspora-advanced-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

// Helper function to calculate trust score
export function calculateTrustScore(stats: TrustScore['stats']): number {
  const weights = {
    transactionsCompleted: 5,
    eventsHosted: 10,
    reviewsReceived: 3,
    communityContributions: 8,
    vouchesReceived: 15,
    vouchesGiven: 2,
    reportsFiled: 1,
    reportsAgainst: -20,
  };

  let score = 20; // Base score

  Object.entries(stats).forEach(([key, value]) => {
    const weight = weights[key as keyof typeof weights] ?? 0;
    score += value * weight;
  });

  return Math.max(0, Math.min(100, score));
}

// Helper to get verification level from score
export function getVerificationLevel(score: number): TrustScore['verificationLevel'] {
  if (score >= 90) return 'community_leader';
  if (score >= 70) return 'trusted';
  if (score >= 50) return 'verified';
  if (score >= 20) return 'basic';
  return 'unverified';
}
