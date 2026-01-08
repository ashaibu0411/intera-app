import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Modal,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ChevronLeft,
  Search,
  Stethoscope,
  GraduationCap,
  Code,
  Briefcase,
  Building2,
  Wrench,
  ChefHat,
  Truck,
  Heart,
  BookOpen,
  Check,
  Circle,
  Clock,
  DollarSign,
  FileText,
  Globe,
  MapPin,
  ChevronRight,
  ExternalLink,
  Star,
  AlertCircle,
  X,
} from 'lucide-react-native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';

interface CareerPath {
  id: string;
  title: string;
  icon: React.ReactNode;
  color: string;
  description: string;
  avgSalary: string;
  demandLevel: 'High' | 'Medium' | 'Low';
  timeToLicense: string;
  steps: Step[];
  resources: Resource[];
  visaTypes: string[];
  topStates: string[];
}

interface Step {
  id: number;
  title: string;
  description: string;
  duration: string;
  cost?: string;
  tips: string[];
  links?: { title: string; url: string }[];
}

interface Resource {
  title: string;
  url: string;
  type: 'website' | 'document' | 'course';
}

const CAREER_PATHS: CareerPath[] = [
  {
    id: 'nurse',
    title: 'Registered Nurse (RN)',
    icon: <Stethoscope size={28} color="#fff" />,
    color: '#EF4444',
    description: 'High demand for international nurses in the US healthcare system',
    avgSalary: '$77,000 - $120,000/year',
    demandLevel: 'High',
    timeToLicense: '6-18 months',
    visaTypes: ['EB-3 Visa', 'H-1B (rare)', 'TN Visa (Canada/Mexico)'],
    topStates: ['California', 'Texas', 'Florida', 'New York', 'Illinois'],
    steps: [
      {
        id: 1,
        title: 'Verify Your Nursing Credentials',
        description: 'Get your nursing education and license evaluated by CGFNS (Commission on Graduates of Foreign Nursing Schools)',
        duration: '2-4 months',
        cost: '$350-$500',
        tips: [
          'Start gathering documents early - transcripts, license verification, passport',
          'Get official translations for non-English documents',
          'CGFNS evaluation is required for most states'
        ],
        links: [
          { title: 'CGFNS Portal', url: 'https://www.cgfns.org' },
          { title: 'VisaScreen Certificate', url: 'https://www.cgfns.org/services/certification/visascreen/' }
        ]
      },
      {
        id: 2,
        title: 'Pass the NCLEX-RN Exam',
        description: 'The National Council Licensure Examination is required to practice as a nurse in the US',
        duration: '2-6 months study',
        cost: '$200 exam fee + study materials',
        tips: [
          'Use UWorld, Kaplan, or Saunders for prep',
          'Schedule exam at a Pearson VUE center (available in many countries)',
          'Passing score varies - computer adaptive test',
          'Can retake after 45 days if needed'
        ],
        links: [
          { title: 'NCSBN - NCLEX', url: 'https://www.ncsbn.org/nclex.htm' },
          { title: 'Pearson VUE Centers', url: 'https://www.pearsonvue.com' }
        ]
      },
      {
        id: 3,
        title: 'Get VisaScreen Certificate',
        description: 'Required immigration document for healthcare workers entering the US',
        duration: '2-4 months',
        cost: '$540',
        tips: [
          'Apply after passing NCLEX',
          'Includes English proficiency verification',
          'Valid for 5 years',
          'Required before visa interview'
        ],
        links: [
          { title: 'VisaScreen Application', url: 'https://www.cgfns.org/services/certification/visascreen/' }
        ]
      },
      {
        id: 4,
        title: 'Find a US Employer/Recruiter',
        description: 'Connect with hospitals or nursing recruitment agencies that sponsor international nurses',
        duration: '1-3 months',
        tips: [
          'Many hospitals directly sponsor nurses',
          'Recruitment agencies handle paperwork (O\'Grady Peyton, Avant Healthcare)',
          'Negotiate relocation assistance and housing',
          'Ask about green card timeline and support'
        ],
        links: [
          { title: 'O\'Grady Peyton International', url: 'https://ogradypeyton.com' },
          { title: 'Avant Healthcare', url: 'https://avanthealthcare.com' }
        ]
      },
      {
        id: 5,
        title: 'Visa Application (EB-3)',
        description: 'Your employer files an immigrant visa petition for you',
        duration: '12-24 months',
        cost: 'Usually employer-paid',
        tips: [
          'Employer files Labor Certification (PERM)',
          'Then I-140 Immigrant Petition',
          'Wait for priority date to become current',
          'Attend visa interview at US Embassy'
        ],
        links: [
          { title: 'USCIS EB-3 Info', url: 'https://www.uscis.gov/working-in-the-united-states/permanent-workers/employment-based-immigration-third-preference-eb-3' }
        ]
      },
      {
        id: 6,
        title: 'State License & Start Working',
        description: 'Apply for nursing license in your destination state and begin your career',
        duration: '1-2 months',
        cost: '$100-$300',
        tips: [
          'Each state has different requirements',
          'Some states have Nurse Licensure Compact (NLC)',
          'Complete any additional state requirements',
          'Many hospitals offer orientation programs'
        ]
      }
    ],
    resources: [
      { title: 'CGFNS Official Website', url: 'https://www.cgfns.org', type: 'website' },
      { title: 'NCLEX Study Guide', url: 'https://www.ncsbn.org/nclex.htm', type: 'document' },
      { title: 'International Nurse Immigration', url: 'https://www.americanmobile.com/international/', type: 'website' }
    ]
  },
  {
    id: 'software-engineer',
    title: 'Software Engineer',
    icon: <Code size={28} color="#fff" />,
    color: '#3B82F6',
    description: 'Tech companies actively recruit international software talent',
    avgSalary: '$100,000 - $200,000/year',
    demandLevel: 'High',
    timeToLicense: 'No license required',
    visaTypes: ['H-1B Visa', 'L-1 Visa', 'O-1 Visa', 'EB-2/EB-3'],
    topStates: ['California', 'Washington', 'Texas', 'New York', 'Massachusetts'],
    steps: [
      {
        id: 1,
        title: 'Build Your Portfolio & Skills',
        description: 'Strengthen your technical skills and create a strong portfolio',
        duration: 'Ongoing',
        tips: [
          'Master in-demand languages (Python, JavaScript, Java, Go)',
          'Contribute to open source projects on GitHub',
          'Build projects that solve real problems',
          'Get cloud certifications (AWS, GCP, Azure)'
        ],
        links: [
          { title: 'LeetCode', url: 'https://leetcode.com' },
          { title: 'GitHub', url: 'https://github.com' }
        ]
      },
      {
        id: 2,
        title: 'Apply to H-1B Sponsoring Companies',
        description: 'Target companies known to sponsor international workers',
        duration: '2-6 months',
        tips: [
          'FAANG companies (Meta, Amazon, Apple, Netflix, Google) sponsor many H-1Bs',
          'Use LinkedIn, Indeed, and company career pages',
          'Check H1B Grader for sponsorship history',
          'Apply to multiple companies - H-1B is a lottery'
        ],
        links: [
          { title: 'H1B Grader', url: 'https://h1bgrader.com' },
          { title: 'MyVisaJobs', url: 'https://www.myvisajobs.com' }
        ]
      },
      {
        id: 3,
        title: 'Interview Preparation',
        description: 'Prepare for technical and behavioral interviews',
        duration: '1-3 months',
        tips: [
          'Practice data structures and algorithms daily',
          'Do mock interviews on Pramp or Interviewing.io',
          'Study system design for senior roles',
          'Prepare STAR stories for behavioral questions'
        ],
        links: [
          { title: 'Pramp', url: 'https://www.pramp.com' },
          { title: 'System Design Primer', url: 'https://github.com/donnemartin/system-design-primer' }
        ]
      },
      {
        id: 4,
        title: 'H-1B Visa Process',
        description: 'Your employer files the H-1B petition',
        duration: '3-6 months (if selected in lottery)',
        cost: 'Employer-paid',
        tips: [
          'H-1B lottery happens in March each year',
          'Start date is October 1st',
          'Consider O-1 visa if you have extraordinary ability',
          'Some employers offer premium processing'
        ],
        links: [
          { title: 'USCIS H-1B Info', url: 'https://www.uscis.gov/h-1b' }
        ]
      },
      {
        id: 5,
        title: 'Relocate and Start Working',
        description: 'Move to the US and begin your new role',
        duration: '1-2 months',
        tips: [
          'Negotiate relocation package',
          'Get SSN after arrival',
          'Open US bank account',
          'Start green card process early'
        ]
      }
    ],
    resources: [
      { title: 'Blind - Tech Community', url: 'https://www.teamblind.com', type: 'website' },
      { title: 'Levels.fyi Salaries', url: 'https://www.levels.fyi', type: 'website' },
      { title: 'H1B Salary Database', url: 'https://h1bdata.info', type: 'website' }
    ]
  },
  {
    id: 'teacher',
    title: 'Teacher',
    icon: <GraduationCap size={28} color="#fff" />,
    color: '#10B981',
    description: 'Teacher shortages create opportunities for international educators',
    avgSalary: '$45,000 - $75,000/year',
    demandLevel: 'High',
    timeToLicense: '3-12 months',
    visaTypes: ['J-1 Visa', 'H-1B Visa', 'EB-3 Visa'],
    topStates: ['Texas', 'Arizona', 'Florida', 'Nevada', 'Georgia'],
    steps: [
      {
        id: 1,
        title: 'Credential Evaluation',
        description: 'Get your teaching degree evaluated by a recognized agency',
        duration: '1-2 months',
        cost: '$150-$350',
        tips: [
          'Use WES, ECE, or state-approved evaluators',
          'Ensure your degree is equivalent to US Bachelor\'s',
          'Get transcript translations if needed'
        ],
        links: [
          { title: 'WES Evaluation', url: 'https://www.wes.org' },
          { title: 'ECE', url: 'https://www.ece.org' }
        ]
      },
      {
        id: 2,
        title: 'Apply Through Teacher Exchange Programs',
        description: 'J-1 visa programs place international teachers in US schools',
        duration: '2-4 months',
        tips: [
          'Programs: Participate, VIF International, Cultural Vistas',
          'Usually 3-5 year placements',
          'Often include housing assistance',
          'Focus on high-need subjects (Math, Science, Special Ed)'
        ],
        links: [
          { title: 'Participate Learning', url: 'https://www.participatelearning.com' },
          { title: 'VIF International', url: 'https://www.vifprogram.com' }
        ]
      },
      {
        id: 3,
        title: 'State Teaching License',
        description: 'Obtain teaching certification in your destination state',
        duration: '2-6 months',
        cost: '$100-$500',
        tips: [
          'Requirements vary by state',
          'May need to pass Praxis exams',
          'Some states offer provisional licenses',
          'Alternative certification routes available'
        ],
        links: [
          { title: 'Praxis Tests', url: 'https://www.ets.org/praxis' }
        ]
      },
      {
        id: 4,
        title: 'Background Checks & Clearances',
        description: 'Complete required background checks for working with children',
        duration: '1-2 months',
        cost: '$50-$150',
        tips: [
          'FBI fingerprint clearance',
          'State-level background check',
          'Child abuse clearance',
          'Start this early - can take time'
        ]
      },
      {
        id: 5,
        title: 'Start Teaching',
        description: 'Begin your teaching career in the US',
        duration: 'Ongoing',
        tips: [
          'Join teacher communities for support',
          'Understand US classroom culture',
          'Build relationships with parents and staff',
          'Consider path to permanent residency'
        ]
      }
    ],
    resources: [
      { title: 'Teach Away', url: 'https://www.teachaway.com', type: 'website' },
      { title: 'International Teacher Exchange', url: 'https://j1visa.state.gov/programs/teacher', type: 'website' }
    ]
  },
  {
    id: 'accountant',
    title: 'Accountant/CPA',
    icon: <Briefcase size={28} color="#fff" />,
    color: '#8B5CF6',
    description: 'Financial professionals with international experience are valued',
    avgSalary: '$65,000 - $120,000/year',
    demandLevel: 'Medium',
    timeToLicense: '6-12 months',
    visaTypes: ['H-1B Visa', 'L-1 Visa', 'TN Visa (Canada/Mexico)'],
    topStates: ['New York', 'California', 'Texas', 'Illinois', 'New Jersey'],
    steps: [
      {
        id: 1,
        title: 'Credential Evaluation',
        description: 'Evaluate your accounting degree and transcripts',
        duration: '1-2 months',
        cost: '$200-$400',
        tips: [
          'Most states require 150 credit hours',
          'May need additional coursework',
          'NASBA evaluates foreign credentials'
        ],
        links: [
          { title: 'NASBA', url: 'https://nasba.org' }
        ]
      },
      {
        id: 2,
        title: 'Pass the CPA Exam',
        description: 'Four-part exam required for CPA licensure',
        duration: '6-18 months',
        cost: '$1,000-$3,000 total',
        tips: [
          'Can take exam internationally at Prometric centers',
          'Use Becker, Roger, or Wiley for prep',
          'Pass within 18-month window',
          '4 sections: AUD, BEC, FAR, REG'
        ],
        links: [
          { title: 'AICPA CPA Exam', url: 'https://www.aicpa.org/becomeacpa/cpaexam' }
        ]
      },
      {
        id: 3,
        title: 'Find Sponsoring Employer',
        description: 'Target Big 4 firms and companies that sponsor visas',
        duration: '2-6 months',
        tips: [
          'Big 4: Deloitte, PwC, EY, KPMG',
          'Apply through campus recruiting or experienced hire',
          'Highlight international experience',
          'Network through professional associations'
        ]
      },
      {
        id: 4,
        title: 'Visa and Relocation',
        description: 'Complete visa process and move to the US',
        duration: '3-12 months',
        tips: [
          'H-1B lottery in March',
          'Some firms offer L-1 transfers',
          'Consider starting at firm\'s international office first'
        ]
      }
    ],
    resources: [
      { title: 'AICPA', url: 'https://www.aicpa.org', type: 'website' },
      { title: 'This Way to CPA', url: 'https://thiswaytocpa.com', type: 'website' }
    ]
  },
  {
    id: 'physical-therapist',
    title: 'Physical Therapist',
    icon: <Heart size={28} color="#fff" />,
    color: '#F59E0B',
    description: 'Healthcare rehabilitation professionals in high demand',
    avgSalary: '$80,000 - $110,000/year',
    demandLevel: 'High',
    timeToLicense: '6-18 months',
    visaTypes: ['EB-3 Visa', 'H-1B Visa', 'TN Visa'],
    topStates: ['California', 'Texas', 'Florida', 'New York', 'Pennsylvania'],
    steps: [
      {
        id: 1,
        title: 'FCCPT Credential Evaluation',
        description: 'Foreign Credentialing Commission evaluates PT degrees',
        duration: '3-6 months',
        cost: '$700-$1,000',
        tips: [
          'Required for most state licenses',
          'Includes coursework analysis',
          'May identify deficiencies to address'
        ],
        links: [
          { title: 'FCCPT', url: 'https://www.fccpt.org' }
        ]
      },
      {
        id: 2,
        title: 'Pass NPTE Exam',
        description: 'National Physical Therapy Examination',
        duration: '2-4 months study',
        cost: '$485',
        tips: [
          'Available at Prometric centers worldwide',
          'Use PEAT practice exams',
          'Score 600+ to pass',
          'Study anatomy, patient care, interventions'
        ],
        links: [
          { title: 'FSBPT NPTE', url: 'https://www.fsbpt.org/Secondary-Pages/Exam-Candidates/NPTE' }
        ]
      },
      {
        id: 3,
        title: 'English Proficiency & VisaScreen',
        description: 'Demonstrate English skills and get healthcare visa certificate',
        duration: '2-4 months',
        cost: '$540 VisaScreen + exam fees',
        tips: [
          'TOEFL iBT or IELTS Academic required',
          'VisaScreen required for immigration',
          'Some states have additional English requirements'
        ]
      },
      {
        id: 4,
        title: 'Find Employer & Visa Sponsorship',
        description: 'Connect with hospitals, clinics, or rehab facilities',
        duration: '1-4 months',
        tips: [
          'Use PT recruiters for international placement',
          'Hospitals often sponsor EB-3 visas',
          'Negotiate sign-on bonus and relocation',
          'Travel PT positions available'
        ]
      },
      {
        id: 5,
        title: 'State License & Start Working',
        description: 'Obtain license in your destination state',
        duration: '1-2 months',
        cost: '$200-$400',
        tips: [
          'Requirements vary by state',
          'PT Compact allows multi-state practice',
          'Complete any state-specific requirements'
        ]
      }
    ],
    resources: [
      { title: 'APTA', url: 'https://www.apta.org', type: 'website' },
      { title: 'FCCPT Resources', url: 'https://www.fccpt.org', type: 'website' }
    ]
  },
  {
    id: 'engineer',
    title: 'Engineer (Civil/Mechanical/Electrical)',
    icon: <Wrench size={28} color="#fff" />,
    color: '#6366F1',
    description: 'Engineering professionals needed across multiple industries',
    avgSalary: '$75,000 - $130,000/year',
    demandLevel: 'Medium',
    timeToLicense: '3-6 months (PE optional)',
    visaTypes: ['H-1B Visa', 'L-1 Visa', 'O-1 Visa', 'TN Visa'],
    topStates: ['Texas', 'California', 'Michigan', 'Ohio', 'Pennsylvania'],
    steps: [
      {
        id: 1,
        title: 'Credential Evaluation',
        description: 'Get engineering degree evaluated for US equivalency',
        duration: '1-2 months',
        cost: '$150-$300',
        tips: [
          'WES or ECE for general evaluation',
          'NCEES for PE license pathway',
          'ABET accreditation helpful but not always required'
        ],
        links: [
          { title: 'NCEES', url: 'https://ncees.org' },
          { title: 'WES', url: 'https://www.wes.org' }
        ]
      },
      {
        id: 2,
        title: 'Apply for Engineering Jobs',
        description: 'Target companies that sponsor H-1B visas',
        duration: '2-6 months',
        tips: [
          'Manufacturing, construction, tech companies sponsor',
          'Defense contractors require US citizenship (avoid)',
          'Emphasize project management experience',
          'Certifications (PMP, Six Sigma) help'
        ]
      },
      {
        id: 3,
        title: 'FE Exam (Optional but Recommended)',
        description: 'First step toward Professional Engineer license',
        duration: '2-3 months prep',
        cost: '$175',
        tips: [
          'Computer-based test available globally',
          'Not required for most jobs',
          'Required if you want PE license later',
          'Shows commitment to US engineering standards'
        ],
        links: [
          { title: 'NCEES FE Exam', url: 'https://ncees.org/engineering/fe' }
        ]
      },
      {
        id: 4,
        title: 'Visa Process & Relocation',
        description: 'Complete H-1B or other visa process',
        duration: '3-12 months',
        tips: [
          'H-1B is common path',
          'L-1 if transferring within company',
          'TN visa for Canadians/Mexicans',
          'O-1 for exceptional ability'
        ]
      }
    ],
    resources: [
      { title: 'NSPE', url: 'https://www.nspe.org', type: 'website' },
      { title: 'Engineering Jobs', url: 'https://www.engineerjobs.com', type: 'website' }
    ]
  }
];

const DESTINATION_COUNTRIES = [
  { id: 'us', name: 'United States', flag: '🇺🇸' },
  { id: 'uk', name: 'United Kingdom', flag: '🇬🇧' },
  { id: 'canada', name: 'Canada', flag: '🇨🇦' },
  { id: 'australia', name: 'Australia', flag: '🇦🇺' },
  { id: 'germany', name: 'Germany', flag: '🇩🇪' },
];

export default function ImmigrationCareerGuideScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCareer, setSelectedCareer] = useState<CareerPath | null>(null);
  const [selectedCountry, setSelectedCountry] = useState('us');
  const [completedSteps, setCompletedSteps] = useState<Record<string, number[]>>({});

  const filteredCareers = CAREER_PATHS.filter(
    (career) =>
      career.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      career.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCareerSelect = (career: CareerPath) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedCareer(career);
  };

  const toggleStepComplete = (careerId: string, stepId: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCompletedSteps((prev) => {
      const careerSteps = prev[careerId] || [];
      if (careerSteps.includes(stepId)) {
        return { ...prev, [careerId]: careerSteps.filter((id) => id !== stepId) };
      }
      return { ...prev, [careerId]: [...careerSteps, stepId] };
    });
  };

  const isStepCompleted = (careerId: string, stepId: number) => {
    return completedSteps[careerId]?.includes(stepId) || false;
  };

  const getProgress = (career: CareerPath) => {
    const completed = completedSteps[career.id]?.length || 0;
    return Math.round((completed / career.steps.length) * 100);
  };

  const openLink = (url: string) => {
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
              <Text className="text-2xl font-bold text-warmBrown">Career Immigration Guide</Text>
              <Text className="text-sm text-gray-500">Step-by-step paths to work abroad</Text>
            </View>
          </View>

          {/* Country Selector */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mb-4"
            style={{ flexGrow: 0 }}
          >
            {DESTINATION_COUNTRIES.map((country) => (
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

          {/* Search */}
          <View className="flex-row items-center bg-white rounded-2xl px-4 py-3 shadow-sm">
            <Search size={20} color="#8B7355" />
            <TextInput
              placeholder="Search careers (nurse, engineer, teacher...)"
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
              className="flex-1 ml-3 text-warmBrown text-base"
            />
          </View>
        </Animated.View>

        {/* Career Paths */}
        <ScrollView className="flex-1 px-5 pt-4" showsVerticalScrollIndicator={false}>
          {/* Info Banner */}
          <Animated.View entering={FadeInUp.duration(400).delay(100)} className="mb-4">
            <LinearGradient
              colors={['#1B4D3E', '#153D31']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ borderRadius: 16, padding: 16 }}
            >
              <View className="flex-row items-start">
                <AlertCircle size={24} color="#FCD34D" />
                <View className="flex-1 ml-3">
                  <Text className="text-white font-bold text-base">Your Career Journey</Text>
                  <Text className="text-white/80 text-sm mt-1">
                    Select your profession below to see a detailed step-by-step guide for immigrating to work in your chosen country.
                  </Text>
                </View>
              </View>
            </LinearGradient>
          </Animated.View>

          {/* Career Cards */}
          {filteredCareers.map((career, index) => {
            const progress = getProgress(career);
            return (
              <Animated.View
                key={career.id}
                entering={FadeInUp.duration(400).delay(150 + index * 50)}
              >
                <Pressable
                  onPress={() => handleCareerSelect(career)}
                  className="bg-white rounded-2xl p-4 mb-3 shadow-sm"
                >
                  <View className="flex-row items-start">
                    <View
                      className="rounded-2xl p-3"
                      style={{ backgroundColor: career.color }}
                    >
                      {career.icon}
                    </View>
                    <View className="flex-1 ml-4">
                      <Text className="text-warmBrown font-bold text-lg">{career.title}</Text>
                      <Text className="text-gray-500 text-sm mt-1" numberOfLines={2}>
                        {career.description}
                      </Text>
                      <View className="flex-row items-center mt-2 flex-wrap">
                        <View className="flex-row items-center mr-3 mb-1">
                          <DollarSign size={14} color="#10B981" />
                          <Text className="text-green-600 text-xs ml-1">{career.avgSalary}</Text>
                        </View>
                        <View
                          className={`px-2 py-0.5 rounded-full mb-1 ${
                            career.demandLevel === 'High'
                              ? 'bg-green-100'
                              : career.demandLevel === 'Medium'
                              ? 'bg-yellow-100'
                              : 'bg-gray-100'
                          }`}
                        >
                          <Text
                            className={`text-xs font-medium ${
                              career.demandLevel === 'High'
                                ? 'text-green-600'
                                : career.demandLevel === 'Medium'
                                ? 'text-yellow-600'
                                : 'text-gray-600'
                            }`}
                          >
                            {career.demandLevel} Demand
                          </Text>
                        </View>
                      </View>
                      {progress > 0 && (
                        <View className="mt-2">
                          <View className="flex-row items-center justify-between mb-1">
                            <Text className="text-xs text-gray-500">Your Progress</Text>
                            <Text className="text-xs text-forest-600 font-medium">{progress}%</Text>
                          </View>
                          <View className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <View
                              className="h-full bg-forest-600 rounded-full"
                              style={{ width: `${progress}%` }}
                            />
                          </View>
                        </View>
                      )}
                    </View>
                    <ChevronRight size={20} color="#9CA3AF" />
                  </View>
                </Pressable>
              </Animated.View>
            );
          })}

          <View className="h-24" />
        </ScrollView>

        {/* Career Detail Modal */}
        <Modal
          visible={!!selectedCareer}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setSelectedCareer(null)}
        >
          {selectedCareer && (
            <View className="flex-1 bg-cream">
              <SafeAreaView edges={['top']} className="flex-1">
                {/* Modal Header */}
                <View className="flex-row items-center justify-between px-5 py-4 border-b border-gray-100 bg-white">
                  <Pressable
                    onPress={() => setSelectedCareer(null)}
                    className="bg-gray-100 rounded-full p-2"
                  >
                    <X size={24} color="#2D1F1A" />
                  </Pressable>
                  <Text className="text-lg font-bold text-warmBrown flex-1 text-center mr-10">
                    {selectedCareer.title}
                  </Text>
                </View>

                <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                  {/* Career Hero */}
                  <LinearGradient
                    colors={[selectedCareer.color, selectedCareer.color + 'CC']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{ padding: 20 }}
                  >
                    <View className="flex-row items-center mb-4">
                      <View className="bg-white/20 rounded-2xl p-3">
                        {selectedCareer.icon}
                      </View>
                      <View className="ml-4 flex-1">
                        <Text className="text-white/80 text-sm">Average Salary</Text>
                        <Text className="text-white font-bold text-xl">{selectedCareer.avgSalary}</Text>
                      </View>
                    </View>
                    <View className="flex-row flex-wrap">
                      <View className="bg-white/20 rounded-lg px-3 py-1.5 mr-2 mb-2">
                        <Text className="text-white text-sm">
                          <Clock size={12} color="#fff" /> {selectedCareer.timeToLicense}
                        </Text>
                      </View>
                      <View className="bg-white/20 rounded-lg px-3 py-1.5 mr-2 mb-2">
                        <Text className="text-white text-sm">{selectedCareer.demandLevel} Demand</Text>
                      </View>
                    </View>
                  </LinearGradient>

                  <View className="px-5 py-4">
                    {/* Visa Types */}
                    <View className="mb-6">
                      <Text className="text-warmBrown font-bold text-lg mb-3">Common Visa Types</Text>
                      <View className="flex-row flex-wrap">
                        {selectedCareer.visaTypes.map((visa, index) => (
                          <View key={index} className="bg-blue-50 rounded-full px-3 py-1.5 mr-2 mb-2">
                            <Text className="text-blue-600 text-sm font-medium">{visa}</Text>
                          </View>
                        ))}
                      </View>
                    </View>

                    {/* Top States */}
                    <View className="mb-6">
                      <Text className="text-warmBrown font-bold text-lg mb-3">Top States for Jobs</Text>
                      <View className="flex-row flex-wrap">
                        {selectedCareer.topStates.map((state, index) => (
                          <View key={index} className="bg-gray-100 rounded-full px-3 py-1.5 mr-2 mb-2">
                            <Text className="text-gray-600 text-sm">{state}</Text>
                          </View>
                        ))}
                      </View>
                    </View>

                    {/* Steps */}
                    <View className="mb-6">
                      <Text className="text-warmBrown font-bold text-lg mb-3">Step-by-Step Guide</Text>
                      {selectedCareer.steps.map((step, index) => {
                        const completed = isStepCompleted(selectedCareer.id, step.id);
                        return (
                          <View
                            key={step.id}
                            className={`bg-white rounded-2xl p-4 mb-3 border-2 ${
                              completed ? 'border-green-500' : 'border-transparent'
                            }`}
                          >
                            <Pressable
                              onPress={() => toggleStepComplete(selectedCareer.id, step.id)}
                              className="flex-row items-start"
                            >
                              <View
                                className={`w-8 h-8 rounded-full items-center justify-center ${
                                  completed ? 'bg-green-500' : 'bg-gray-100'
                                }`}
                              >
                                {completed ? (
                                  <Check size={18} color="#fff" />
                                ) : (
                                  <Text className="text-gray-500 font-bold">{step.id}</Text>
                                )}
                              </View>
                              <View className="flex-1 ml-3">
                                <Text
                                  className={`font-bold text-base ${
                                    completed ? 'text-green-600' : 'text-warmBrown'
                                  }`}
                                >
                                  {step.title}
                                </Text>
                                <Text className="text-gray-600 text-sm mt-1">{step.description}</Text>
                                <View className="flex-row items-center mt-2">
                                  <Clock size={14} color="#8B7355" />
                                  <Text className="text-gray-500 text-xs ml-1">{step.duration}</Text>
                                  {step.cost && (
                                    <>
                                      <DollarSign size={14} color="#8B7355" className="ml-3" />
                                      <Text className="text-gray-500 text-xs ml-1">{step.cost}</Text>
                                    </>
                                  )}
                                </View>
                              </View>
                            </Pressable>

                            {/* Tips */}
                            <View className="mt-3 bg-amber-50 rounded-xl p-3">
                              <Text className="text-amber-700 font-semibold text-sm mb-2">Tips:</Text>
                              {step.tips.map((tip, tipIndex) => (
                                <View key={tipIndex} className="flex-row items-start mb-1">
                                  <Text className="text-amber-600 mr-2">•</Text>
                                  <Text className="text-amber-700 text-sm flex-1">{tip}</Text>
                                </View>
                              ))}
                            </View>

                            {/* Links */}
                            {step.links && step.links.length > 0 && (
                              <View className="mt-3 flex-row flex-wrap">
                                {step.links.map((link, linkIndex) => (
                                  <Pressable
                                    key={linkIndex}
                                    onPress={() => openLink(link.url)}
                                    className="flex-row items-center bg-blue-50 rounded-lg px-3 py-2 mr-2 mb-2"
                                  >
                                    <ExternalLink size={14} color="#3B82F6" />
                                    <Text className="text-blue-600 text-sm ml-1">{link.title}</Text>
                                  </Pressable>
                                ))}
                              </View>
                            )}
                          </View>
                        );
                      })}
                    </View>

                    {/* Resources */}
                    <View className="mb-6">
                      <Text className="text-warmBrown font-bold text-lg mb-3">Helpful Resources</Text>
                      {selectedCareer.resources.map((resource, index) => (
                        <Pressable
                          key={index}
                          onPress={() => openLink(resource.url)}
                          className="flex-row items-center bg-white rounded-xl p-4 mb-2"
                        >
                          <Globe size={20} color="#1B4D3E" />
                          <Text className="text-warmBrown font-medium flex-1 ml-3">
                            {resource.title}
                          </Text>
                          <ExternalLink size={18} color="#9CA3AF" />
                        </Pressable>
                      ))}
                    </View>
                  </View>

                  <View className="h-24" />
                </ScrollView>

                {/* Action Button */}
                <View className="px-5 py-4 border-t border-gray-100 bg-white">
                  <Pressable
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                      setSelectedCareer(null);
                      router.push('/job-board');
                    }}
                  >
                    <LinearGradient
                      colors={['#1B4D3E', '#153D31']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={{
                        borderRadius: 16,
                        paddingVertical: 16,
                        alignItems: 'center',
                      }}
                    >
                      <Text className="text-white font-bold text-lg">Find Jobs with Visa Sponsorship</Text>
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
