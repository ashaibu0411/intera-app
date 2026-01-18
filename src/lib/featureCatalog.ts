import type { LucideIcon } from 'lucide-react-native';
import {
  Users,
  ShoppingBag,
  Heart,
  MessageCircle,
  GraduationCap,
  Briefcase,
  Shield,
  Vote,
  PiggyBank,
  Mic,
  BookOpen,
  AlertTriangle,
  HeartHandshake,
  Trophy,
  Calendar,
  DollarSign,
  FileText,
  Utensils,
  Film,
  Clapperboard,
  Radio,
  Gem,
  Globe,
  Star,
} from 'lucide-react-native';

export type Feature = {
  icon: LucideIcon;
  label: string;
  desc: string;
  colors: readonly [string, string];
};

export type FeatureCategory = {
  title: string;
  features: Feature[];
};

export const FEATURE_CATEGORIES: FeatureCategory[] = [
  {
    title: 'Connect & Communicate',
    features: [
      { icon: Users, label: 'Community Feed', desc: 'Connect with expats worldwide', colors: ['#1B4D3E', '#153D31'] as const },
      { icon: MessageCircle, label: 'Messages', desc: 'Private conversations', colors: ['#6366F1', '#4F46E5'] as const },
      { icon: Mic, label: 'Voice Rooms', desc: 'Live audio discussions', colors: ['#EC4899', '#DB2777'] as const },
      { icon: Radio, label: 'Live Radio', desc: 'Community broadcasts', colors: ['#7C3AED', '#6D28D9'] as const },
    ],
  },
  {
    title: 'Business & Finance',
    features: [
      { icon: ShoppingBag, label: 'Marketplace', desc: 'Buy & sell locally', colors: ['#D4673A', '#C05A2E'] as const },
      { icon: Briefcase, label: 'Jobs Board', desc: 'Find opportunities', colors: ['#059669', '#047857'] as const },
      { icon: DollarSign, label: 'Send Money', desc: 'Easy remittance', colors: ['#10B981', '#059669'] as const },
      { icon: PiggyBank, label: 'Susu Circles', desc: 'Savings groups', colors: ['#F59E0B', '#D97706'] as const },
    ],
  },
  {
    title: 'Culture & Heritage',
    features: [
      { icon: BookOpen, label: 'Heritage Hub', desc: 'Preserve your roots', colors: ['#D4673A', '#B85430'] as const },
      { icon: Utensils, label: 'African Food', desc: 'Recipes & restaurants', colors: ['#DC2626', '#B91C1C'] as const },
      { icon: Heart, label: 'Faith Community', desc: 'Spiritual connections', colors: ['#8B5CF6', '#7C3AED'] as const },
      { icon: Calendar, label: 'Events', desc: 'Cultural gatherings', colors: ['#6366F1', '#4F46E5'] as const },
    ],
  },
  {
    title: 'Content & Entertainment',
    features: [
      { icon: Film, label: 'Stories', desc: '24-hour moments', colors: ['#EC4899', '#F97316'] as const },
      { icon: Clapperboard, label: 'Clips', desc: 'Short videos', colors: ['#3B82F6', '#8B5CF6'] as const },
      { icon: Trophy, label: 'Creator Battles', desc: 'Compete & win', colors: ['#7C3AED', '#DB2777'] as const },
      { icon: Gem, label: 'Gem Store', desc: 'Virtual gifts', colors: ['#F59E0B', '#EA580C'] as const },
    ],
  },
  {
    title: 'Support & Safety',
    features: [
      { icon: Shield, label: 'Trust Score', desc: 'Verified members', colors: ['#10B981', '#059669'] as const },
      { icon: AlertTriangle, label: 'Safety Network', desc: 'Emergency help', colors: ['#EF4444', '#DC2626'] as const },
      { icon: HeartHandshake, label: 'Support Circles', desc: 'Community care', colors: ['#14B8A6', '#0D9488'] as const },
      { icon: FileText, label: 'Visa Help', desc: 'Immigration support', colors: ['#0284C7', '#0369A1'] as const },
    ],
  },
  {
    title: 'Learning & Growth',
    features: [
      { icon: GraduationCap, label: 'Student Hub', desc: 'Study groups & mentors', colors: ['#C9A227', '#A6841F'] as const },
      { icon: Vote, label: 'Village Council', desc: 'Community decisions', colors: ['#8B5CF6', '#7C3AED'] as const },
      { icon: Globe, label: 'Translator', desc: 'Break language barriers', colors: ['#3B82F6', '#2563EB'] as const },
      { icon: Star, label: 'Rewards', desc: 'Earn as you engage', colors: ['#F97316', '#EA580C'] as const },
    ],
  },
];

export const ALL_FEATURES: Feature[] = FEATURE_CATEGORIES.flatMap((cat) => cat.features);

