import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Modal,
  ActivityIndicator,
  Linking,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ChevronLeft,
  Search,
  MapPin,
  Clock,
  DollarSign,
  Building2,
  Globe,
  Briefcase,
  ChevronRight,
  ExternalLink,
  X,
  Filter,
  Star,
  CheckCircle,
  Plane,
  GraduationCap,
  Stethoscope,
  Code,
  Wrench,
  Users,
  Heart,
  BookOpen,
} from 'lucide-react-native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';

interface InternationalJob {
  id: string;
  title: string;
  company: string;
  companyLogo: string;
  location: string;
  country: string;
  countryFlag: string;
  salary: string;
  jobType: 'Full-time' | 'Part-time' | 'Contract';
  category: string;
  visaSponsorship: boolean;
  visaTypes: string[];
  description: string;
  requirements: string[];
  benefits: string[];
  postedDate: string;
  applicationUrl: string;
  isVerified: boolean;
  applicants: number;
  urgentHiring: boolean;
}

// Mock international jobs that sponsor visas
const INTERNATIONAL_JOBS: InternationalJob[] = [
  {
    id: '1',
    title: 'Registered Nurse (RN) - Medical/Surgical',
    company: 'Johns Hopkins Hospital',
    companyLogo: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=200',
    location: 'Baltimore, MD',
    country: 'United States',
    countryFlag: '🇺🇸',
    salary: '$75,000 - $95,000/year',
    jobType: 'Full-time',
    category: 'Healthcare',
    visaSponsorship: true,
    visaTypes: ['EB-3 Green Card', 'H-1B'],
    description: 'Johns Hopkins Hospital is seeking international nurses for our Medical/Surgical unit. We provide comprehensive visa sponsorship and relocation assistance.',
    requirements: [
      'Valid nursing license in home country',
      'NCLEX-RN passed or scheduled',
      'VisaScreen certificate or in progress',
      'Minimum 2 years acute care experience',
      'English proficiency (IELTS/TOEFL)'
    ],
    benefits: [
      'Full visa sponsorship (EB-3)',
      'Relocation assistance up to $10,000',
      'Housing assistance for 3 months',
      'Comprehensive health insurance',
      'Tuition reimbursement',
      'Sign-on bonus $5,000'
    ],
    postedDate: '2025-01-05',
    applicationUrl: 'https://careers.hopkinsmedicine.org',
    isVerified: true,
    applicants: 234,
    urgentHiring: true,
  },
  {
    id: '2',
    title: 'Senior Software Engineer - Backend',
    company: 'Google',
    companyLogo: 'https://images.unsplash.com/photo-1573804633927-bfcbcd909acd?w=200',
    location: 'Mountain View, CA',
    country: 'United States',
    countryFlag: '🇺🇸',
    salary: '$180,000 - $280,000/year',
    jobType: 'Full-time',
    category: 'Technology',
    visaSponsorship: true,
    visaTypes: ['H-1B', 'L-1', 'O-1'],
    description: 'Join Google\'s infrastructure team to build systems that power billions of users. We sponsor H-1B visas and provide immigration support.',
    requirements: [
      'BS/MS in Computer Science or equivalent',
      '5+ years backend development experience',
      'Proficiency in Python, Go, or Java',
      'Experience with distributed systems',
      'Strong problem-solving skills'
    ],
    benefits: [
      'H-1B visa sponsorship',
      'Green card sponsorship after 1 year',
      '$50,000 relocation package',
      'RSU grants (stock)',
      'Free meals and gym',
      '20 weeks parental leave'
    ],
    postedDate: '2025-01-04',
    applicationUrl: 'https://careers.google.com',
    isVerified: true,
    applicants: 1523,
    urgentHiring: false,
  },
  {
    id: '3',
    title: 'Physical Therapist',
    company: 'Cleveland Clinic',
    companyLogo: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=200',
    location: 'Cleveland, OH',
    country: 'United States',
    countryFlag: '🇺🇸',
    salary: '$80,000 - $100,000/year',
    jobType: 'Full-time',
    category: 'Healthcare',
    visaSponsorship: true,
    visaTypes: ['EB-3 Green Card'],
    description: 'Cleveland Clinic is hiring international physical therapists. We provide full immigration support and excellent growth opportunities.',
    requirements: [
      'Physical therapy degree from accredited program',
      'FCCPT evaluation completed',
      'NPTE passed or scheduled',
      'VisaScreen certificate',
      'Strong clinical skills'
    ],
    benefits: [
      'EB-3 Green Card sponsorship',
      'Relocation bonus $7,500',
      'Signing bonus $10,000',
      'Student loan repayment assistance',
      'Continuing education allowance'
    ],
    postedDate: '2025-01-03',
    applicationUrl: 'https://jobs.clevelandclinic.org',
    isVerified: true,
    applicants: 89,
    urgentHiring: true,
  },
  {
    id: '4',
    title: 'Data Scientist',
    company: 'Amazon',
    companyLogo: 'https://images.unsplash.com/photo-1523474253046-8cd2748b5fd2?w=200',
    location: 'Seattle, WA',
    country: 'United States',
    countryFlag: '🇺🇸',
    salary: '$150,000 - $220,000/year',
    jobType: 'Full-time',
    category: 'Technology',
    visaSponsorship: true,
    visaTypes: ['H-1B', 'O-1'],
    description: 'Amazon is looking for data scientists to drive business decisions through analytics. Strong visa sponsorship track record.',
    requirements: [
      'MS/PhD in Statistics, CS, or related field',
      '3+ years experience in data science',
      'Proficiency in Python, SQL, and ML frameworks',
      'Experience with large-scale data processing',
      'Strong communication skills'
    ],
    benefits: [
      'H-1B sponsorship with premium processing',
      'Relocation assistance',
      'RSU grants vesting over 4 years',
      'Health, dental, vision insurance',
      'Employee discount'
    ],
    postedDate: '2025-01-02',
    applicationUrl: 'https://amazon.jobs',
    isVerified: true,
    applicants: 892,
    urgentHiring: false,
  },
  {
    id: '5',
    title: 'Elementary School Teacher - STEM',
    company: 'Houston ISD',
    companyLogo: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=200',
    location: 'Houston, TX',
    country: 'United States',
    countryFlag: '🇺🇸',
    salary: '$55,000 - $72,000/year',
    jobType: 'Full-time',
    category: 'Education',
    visaSponsorship: true,
    visaTypes: ['J-1 Teacher Exchange', 'H-1B'],
    description: 'Houston ISD is recruiting international teachers for STEM subjects. We partner with exchange programs for smooth visa processing.',
    requirements: [
      'Teaching degree from accredited institution',
      'Teaching license in home country',
      'Minimum 2 years teaching experience',
      'English fluency',
      'Background check clearance'
    ],
    benefits: [
      'J-1 visa sponsorship through exchange program',
      'Housing assistance stipend',
      'Health insurance',
      'Classroom supply budget',
      'Mentorship program'
    ],
    postedDate: '2025-01-01',
    applicationUrl: 'https://www.houstonisd.org/careers',
    isVerified: true,
    applicants: 156,
    urgentHiring: true,
  },
  {
    id: '6',
    title: 'Staff Nurse - ICU',
    company: 'NHS England',
    companyLogo: 'https://images.unsplash.com/photo-1538108149393-fbbd81895907?w=200',
    location: 'London',
    country: 'United Kingdom',
    countryFlag: '🇬🇧',
    salary: '£35,000 - £45,000/year',
    jobType: 'Full-time',
    category: 'Healthcare',
    visaSponsorship: true,
    visaTypes: ['Health and Care Worker Visa'],
    description: 'NHS is actively recruiting international nurses. Fast-track visa processing and comprehensive support available.',
    requirements: [
      'Nursing qualification recognized by NMC',
      'IELTS score 7.0 overall',
      'CBT and OSCE passed',
      'ICU experience preferred',
      'English language proficiency'
    ],
    benefits: [
      'Tier 2 Health Care Worker visa sponsored',
      'Free NHS pension scheme',
      'Relocation support £3,000',
      'Accommodation assistance',
      '27 days annual leave + bank holidays'
    ],
    postedDate: '2025-01-04',
    applicationUrl: 'https://www.jobs.nhs.uk',
    isVerified: true,
    applicants: 445,
    urgentHiring: true,
  },
  {
    id: '7',
    title: 'Full Stack Developer',
    company: 'Shopify',
    companyLogo: 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=200',
    location: 'Toronto, ON',
    country: 'Canada',
    countryFlag: '🇨🇦',
    salary: 'CAD $120,000 - $180,000/year',
    jobType: 'Full-time',
    category: 'Technology',
    visaSponsorship: true,
    visaTypes: ['Work Permit', 'Express Entry Support'],
    description: 'Shopify is hiring developers globally. We provide comprehensive immigration support including Express Entry assistance.',
    requirements: [
      'Bachelor\'s degree in CS or equivalent experience',
      '3+ years full stack development',
      'Ruby on Rails or React experience',
      'Strong problem-solving abilities',
      'Collaborative mindset'
    ],
    benefits: [
      'Work permit sponsorship',
      'PR pathway support',
      'Remote-first culture',
      'Stock options',
      'Home office setup allowance',
      'Wellness benefit $5,000/year'
    ],
    postedDate: '2025-01-03',
    applicationUrl: 'https://www.shopify.com/careers',
    isVerified: true,
    applicants: 678,
    urgentHiring: false,
  },
  {
    id: '8',
    title: 'Mechanical Engineer',
    company: 'Siemens',
    companyLogo: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=200',
    location: 'Munich',
    country: 'Germany',
    countryFlag: '🇩🇪',
    salary: '€65,000 - €85,000/year',
    jobType: 'Full-time',
    category: 'Engineering',
    visaSponsorship: true,
    visaTypes: ['EU Blue Card', 'Work Visa'],
    description: 'Siemens is seeking mechanical engineers for our Munich facility. EU Blue Card sponsorship available for qualified candidates.',
    requirements: [
      'Master\'s in Mechanical Engineering',
      '3+ years industry experience',
      'CAD/CAM proficiency',
      'German language B1 level preferred',
      'Experience with manufacturing processes'
    ],
    benefits: [
      'EU Blue Card sponsorship',
      'Relocation package €10,000',
      'German language courses paid',
      '30 days paid vacation',
      'Company pension plan',
      'Public transit pass'
    ],
    postedDate: '2025-01-02',
    applicationUrl: 'https://jobs.siemens.com',
    isVerified: true,
    applicants: 234,
    urgentHiring: false,
  },
  {
    id: '9',
    title: 'Aged Care Nurse',
    company: 'Bupa Australia',
    companyLogo: 'https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?w=200',
    location: 'Sydney, NSW',
    country: 'Australia',
    countryFlag: '🇦🇺',
    salary: 'AUD $70,000 - $90,000/year',
    jobType: 'Full-time',
    category: 'Healthcare',
    visaSponsorship: true,
    visaTypes: ['Skilled Worker Visa (482)', 'PR Pathway'],
    description: 'Bupa is hiring international nurses for aged care facilities across Australia. We sponsor visas and support PR applications.',
    requirements: [
      'Registered nurse qualification',
      'AHPRA registration or eligibility',
      'IELTS 7.0 or equivalent',
      'Aged care experience preferred',
      'Compassionate care approach'
    ],
    benefits: [
      '482 visa sponsorship',
      'Pathway to permanent residency',
      'Relocation assistance',
      'Salary packaging options',
      'Professional development opportunities'
    ],
    postedDate: '2025-01-05',
    applicationUrl: 'https://careers.bupa.com.au',
    isVerified: true,
    applicants: 189,
    urgentHiring: true,
  },
  {
    id: '10',
    title: 'Accountant - CPA',
    company: 'Deloitte',
    companyLogo: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=200',
    location: 'New York, NY',
    country: 'United States',
    countryFlag: '🇺🇸',
    salary: '$85,000 - $120,000/year',
    jobType: 'Full-time',
    category: 'Finance',
    visaSponsorship: true,
    visaTypes: ['H-1B', 'L-1 Transfer'],
    description: 'Deloitte sponsors qualified international accountants for positions in our US offices. CPA preferred.',
    requirements: [
      'Bachelor\'s in Accounting/Finance',
      'CPA license or in progress',
      '2+ years public accounting experience',
      'Strong analytical skills',
      'Client-facing experience'
    ],
    benefits: [
      'H-1B visa sponsorship',
      'Green card support',
      'CPA exam support and bonus',
      'Comprehensive benefits package',
      'Flexible work arrangements'
    ],
    postedDate: '2025-01-01',
    applicationUrl: 'https://www2.deloitte.com/careers',
    isVerified: true,
    applicants: 567,
    urgentHiring: false,
  },
];

const CATEGORIES = [
  { id: 'all', label: 'All Jobs', icon: <Briefcase size={18} color="#fff" /> },
  { id: 'Healthcare', label: 'Healthcare', icon: <Stethoscope size={18} color="#fff" /> },
  { id: 'Technology', label: 'Technology', icon: <Code size={18} color="#fff" /> },
  { id: 'Education', label: 'Education', icon: <GraduationCap size={18} color="#fff" /> },
  { id: 'Engineering', label: 'Engineering', icon: <Wrench size={18} color="#fff" /> },
  { id: 'Finance', label: 'Finance', icon: <DollarSign size={18} color="#fff" /> },
];

const COUNTRIES = [
  { id: 'all', name: 'All Countries', flag: '🌍' },
  { id: 'United States', name: 'USA', flag: '🇺🇸' },
  { id: 'United Kingdom', name: 'UK', flag: '🇬🇧' },
  { id: 'Canada', name: 'Canada', flag: '🇨🇦' },
  { id: 'Australia', name: 'Australia', flag: '🇦🇺' },
  { id: 'Germany', name: 'Germany', flag: '🇩🇪' },
];

export default function InternationalJobsScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedCountry, setSelectedCountry] = useState('all');
  const [selectedJob, setSelectedJob] = useState<InternationalJob | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const filteredJobs = INTERNATIONAL_JOBS.filter((job) => {
    const matchesSearch =
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || job.category === selectedCategory;
    const matchesCountry = selectedCountry === 'all' || job.country === selectedCountry;
    return matchesSearch && matchesCategory && matchesCountry;
  });

  const urgentJobs = filteredJobs.filter((job) => job.urgentHiring);
  const regularJobs = filteredJobs.filter((job) => !job.urgentHiring);

  const handleRefresh = () => {
    setRefreshing(true);
    // Simulate refresh
    setTimeout(() => setRefreshing(false), 1000);
  };

  const handleJobSelect = (job: InternationalJob) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedJob(job);
  };

  const openApplicationUrl = (url: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Linking.openURL(url);
  };

  return (
    <View className="flex-1 bg-cream">
      <SafeAreaView edges={['top']} className="flex-1">
        {/* Header */}
        <Animated.View entering={FadeIn.duration(300)} className="px-5 pt-4 pb-2">
          <View className="flex-row items-center mb-4">
            <Pressable
              onPress={() => router.back()}
              className="bg-white rounded-full p-2 mr-3 shadow-sm"
            >
              <ChevronLeft size={24} color="#2D1F1A" />
            </Pressable>
            <View className="flex-1">
              <Text className="text-2xl font-bold text-warmBrown">International Jobs</Text>
              <Text className="text-sm text-gray-500">Jobs with Visa Sponsorship</Text>
            </View>
            <Pressable
              onPress={() => router.push('/immigration-career-guide')}
              className="bg-forest-600 rounded-full px-3 py-2"
            >
              <Text className="text-white text-sm font-medium">Career Guide</Text>
            </Pressable>
          </View>

          {/* Search */}
          <View className="flex-row items-center bg-white rounded-2xl px-4 py-3 shadow-sm mb-4">
            <Search size={20} color="#8B7355" />
            <TextInput
              placeholder="Search jobs, companies, skills..."
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
              className="flex-1 ml-3 text-warmBrown text-base"
            />
          </View>

          {/* Country Filter */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mb-3"
            style={{ flexGrow: 0 }}
          >
            {COUNTRIES.map((country) => (
              <Pressable
                key={country.id}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setSelectedCountry(country.id);
                }}
                className={`flex-row items-center px-4 py-2 rounded-full mr-2 ${
                  selectedCountry === country.id ? 'bg-forest-600' : 'bg-white'
                }`}
              >
                <Text className="text-lg mr-1">{country.flag}</Text>
                <Text
                  className={`font-medium ${
                    selectedCountry === country.id ? 'text-white' : 'text-gray-600'
                  }`}
                >
                  {country.name}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          {/* Category Filter */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ flexGrow: 0 }}
          >
            {CATEGORIES.map((cat) => (
              <Pressable
                key={cat.id}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setSelectedCategory(cat.id);
                }}
                className={`flex-row items-center px-4 py-2 rounded-full mr-2 ${
                  selectedCategory === cat.id ? 'bg-terracotta' : 'bg-white'
                }`}
              >
                <Text
                  className={`font-medium ${
                    selectedCategory === cat.id ? 'text-white' : 'text-gray-600'
                  }`}
                >
                  {cat.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </Animated.View>

        {/* Jobs List */}
        <ScrollView
          className="flex-1 px-5 pt-4"
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#1B4D3E" />
          }
        >
          {/* Stats Banner */}
          <Animated.View entering={FadeInUp.duration(400).delay(100)} className="mb-4">
            <LinearGradient
              colors={['#1B4D3E', '#153D31']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ borderRadius: 16, padding: 16 }}
            >
              <View className="flex-row justify-around">
                <View className="items-center">
                  <Text className="text-white text-2xl font-bold">{filteredJobs.length}</Text>
                  <Text className="text-white/70 text-sm">Jobs Available</Text>
                </View>
                <View className="w-px h-12 bg-white/20" />
                <View className="items-center">
                  <Text className="text-white text-2xl font-bold">{urgentJobs.length}</Text>
                  <Text className="text-white/70 text-sm">Urgent Hiring</Text>
                </View>
                <View className="w-px h-12 bg-white/20" />
                <View className="items-center">
                  <Text className="text-white text-2xl font-bold">5</Text>
                  <Text className="text-white/70 text-sm">Countries</Text>
                </View>
              </View>
            </LinearGradient>
          </Animated.View>

          {/* Urgent Hiring Section */}
          {urgentJobs.length > 0 && (
            <View className="mb-4">
              <View className="flex-row items-center mb-3">
                <View className="bg-red-100 rounded-full px-3 py-1">
                  <Text className="text-red-600 font-bold text-sm">🔥 Urgent Hiring</Text>
                </View>
              </View>
              {urgentJobs.map((job, index) => (
                <JobCard
                  key={job.id}
                  job={job}
                  onPress={() => handleJobSelect(job)}
                  index={index}
                />
              ))}
            </View>
          )}

          {/* All Jobs */}
          <View className="mb-4">
            <Text className="text-warmBrown font-bold text-lg mb-3">All Visa-Sponsored Jobs</Text>
            {regularJobs.map((job, index) => (
              <JobCard
                key={job.id}
                job={job}
                onPress={() => handleJobSelect(job)}
                index={index + urgentJobs.length}
              />
            ))}
          </View>

          <View className="h-24" />
        </ScrollView>

        {/* Job Detail Modal */}
        <Modal
          visible={!!selectedJob}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setSelectedJob(null)}
        >
          {selectedJob && (
            <View className="flex-1 bg-cream">
              <SafeAreaView edges={['top']} className="flex-1">
                <View className="flex-row items-center justify-between px-5 py-4 border-b border-gray-100 bg-white">
                  <Pressable
                    onPress={() => setSelectedJob(null)}
                    className="bg-gray-100 rounded-full p-2"
                  >
                    <X size={24} color="#2D1F1A" />
                  </Pressable>
                  <Text className="text-lg font-bold text-warmBrown flex-1 text-center mr-10">
                    Job Details
                  </Text>
                </View>

                <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                  <View className="p-5">
                    {/* Company Header */}
                    <View className="flex-row items-start mb-4">
                      <Image
                        source={{ uri: selectedJob.companyLogo }}
                        style={{ width: 60, height: 60, borderRadius: 12 }}
                        contentFit="cover"
                      />
                      <View className="flex-1 ml-4">
                        <Text className="text-warmBrown font-bold text-xl">{selectedJob.title}</Text>
                        <View className="flex-row items-center mt-1">
                          <Text className="text-gray-600">{selectedJob.company}</Text>
                          {selectedJob.isVerified && (
                            <CheckCircle size={16} color="#10B981" style={{ marginLeft: 6 }} />
                          )}
                        </View>
                        <View className="flex-row items-center mt-1">
                          <Text className="text-lg mr-1">{selectedJob.countryFlag}</Text>
                          <Text className="text-gray-500">{selectedJob.location}</Text>
                        </View>
                      </View>
                    </View>

                    {/* Salary & Type */}
                    <View className="flex-row mb-4">
                      <View className="bg-green-100 rounded-xl px-4 py-2 mr-2">
                        <Text className="text-green-700 font-bold">{selectedJob.salary}</Text>
                      </View>
                      <View className="bg-blue-100 rounded-xl px-4 py-2">
                        <Text className="text-blue-700 font-medium">{selectedJob.jobType}</Text>
                      </View>
                    </View>

                    {/* Visa Sponsorship Badge */}
                    <View className="bg-purple-100 rounded-2xl p-4 mb-4">
                      <View className="flex-row items-center mb-2">
                        <Plane size={20} color="#7C3AED" />
                        <Text className="text-purple-700 font-bold text-base ml-2">
                          Visa Sponsorship Available
                        </Text>
                      </View>
                      <View className="flex-row flex-wrap">
                        {selectedJob.visaTypes.map((visa, index) => (
                          <View key={index} className="bg-white rounded-full px-3 py-1 mr-2 mb-2">
                            <Text className="text-purple-600 text-sm">{visa}</Text>
                          </View>
                        ))}
                      </View>
                    </View>

                    {/* Description */}
                    <View className="mb-4">
                      <Text className="text-warmBrown font-bold text-lg mb-2">About the Role</Text>
                      <Text className="text-gray-600 leading-6">{selectedJob.description}</Text>
                    </View>

                    {/* Requirements */}
                    <View className="mb-4">
                      <Text className="text-warmBrown font-bold text-lg mb-2">Requirements</Text>
                      {selectedJob.requirements.map((req, index) => (
                        <View key={index} className="flex-row items-start mb-2">
                          <View className="w-2 h-2 rounded-full bg-terracotta mt-2 mr-3" />
                          <Text className="text-gray-600 flex-1">{req}</Text>
                        </View>
                      ))}
                    </View>

                    {/* Benefits */}
                    <View className="mb-4">
                      <Text className="text-warmBrown font-bold text-lg mb-2">Benefits</Text>
                      {selectedJob.benefits.map((benefit, index) => (
                        <View key={index} className="flex-row items-start mb-2">
                          <CheckCircle size={16} color="#10B981" style={{ marginTop: 2, marginRight: 8 }} />
                          <Text className="text-gray-600 flex-1">{benefit}</Text>
                        </View>
                      ))}
                    </View>

                    {/* Stats */}
                    <View className="bg-gray-100 rounded-2xl p-4 mb-4">
                      <View className="flex-row justify-around">
                        <View className="items-center">
                          <Users size={20} color="#8B7355" />
                          <Text className="text-warmBrown font-bold mt-1">{selectedJob.applicants}</Text>
                          <Text className="text-gray-500 text-xs">Applicants</Text>
                        </View>
                        <View className="items-center">
                          <Clock size={20} color="#8B7355" />
                          <Text className="text-warmBrown font-bold mt-1">{selectedJob.postedDate}</Text>
                          <Text className="text-gray-500 text-xs">Posted</Text>
                        </View>
                      </View>
                    </View>
                  </View>
                </ScrollView>

                {/* Apply Button */}
                <View className="px-5 py-4 border-t border-gray-100 bg-white">
                  <Pressable onPress={() => openApplicationUrl(selectedJob.applicationUrl)}>
                    <LinearGradient
                      colors={['#1B4D3E', '#153D31']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={{
                        borderRadius: 16,
                        paddingVertical: 16,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Text className="text-white font-bold text-lg mr-2">Apply Now</Text>
                      <ExternalLink size={20} color="#fff" />
                    </LinearGradient>
                  </Pressable>
                </View>
              </SafeAreaView>
            </View>
          )}
        </Modal>
      </SafeAreaView>
    </View>
  );
}

interface JobCardProps {
  job: InternationalJob;
  onPress: () => void;
  index: number;
}

function JobCard({ job, onPress, index }: JobCardProps) {
  return (
    <Animated.View entering={FadeInUp.duration(400).delay(100 + index * 50)}>
      <Pressable
        onPress={onPress}
        className="bg-white rounded-2xl p-4 mb-3 shadow-sm"
      >
        <View className="flex-row items-start">
          <Image
            source={{ uri: job.companyLogo }}
            style={{ width: 50, height: 50, borderRadius: 10 }}
            contentFit="cover"
          />
          <View className="flex-1 ml-3">
            <View className="flex-row items-start justify-between">
              <View className="flex-1">
                <Text className="text-warmBrown font-bold text-base" numberOfLines={1}>
                  {job.title}
                </Text>
                <View className="flex-row items-center">
                  <Text className="text-gray-600 text-sm">{job.company}</Text>
                  {job.isVerified && (
                    <CheckCircle size={14} color="#10B981" style={{ marginLeft: 4 }} />
                  )}
                </View>
              </View>
              <Text className="text-lg">{job.countryFlag}</Text>
            </View>

            <View className="flex-row items-center mt-2">
              <MapPin size={14} color="#9CA3AF" />
              <Text className="text-gray-500 text-sm ml-1">{job.location}</Text>
            </View>

            <View className="flex-row items-center flex-wrap mt-2">
              <View className="bg-green-100 rounded-full px-2 py-0.5 mr-2 mb-1">
                <Text className="text-green-700 text-xs font-medium">{job.salary}</Text>
              </View>
              <View className="bg-purple-100 rounded-full px-2 py-0.5 mr-2 mb-1">
                <Text className="text-purple-700 text-xs font-medium">Visa Sponsored</Text>
              </View>
              {job.urgentHiring && (
                <View className="bg-red-100 rounded-full px-2 py-0.5 mb-1">
                  <Text className="text-red-600 text-xs font-medium">Urgent</Text>
                </View>
              )}
            </View>
          </View>
          <ChevronRight size={20} color="#9CA3AF" />
        </View>
      </Pressable>
    </Animated.View>
  );
}
