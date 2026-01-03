import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, Image, TextInput, Modal, Alert, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MapPin, Clock, DollarSign, Search, Plus, X, ChevronRight, Users, Star, CheckCircle, ArrowLeft } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useStore } from '@/lib/store';
import { useAdvancedFeatures, type JobPosting, type SkillListing } from '@/lib/advancedFeatures';
import * as Haptics from 'expo-haptics';
import { v4 as uuidv4 } from 'uuid';

const JOB_CATEGORIES = ['All', 'Technology', 'Healthcare', 'Education', 'Food & Hospitality', 'Retail', 'Construction', 'Transportation', 'Creative', 'Other'];

const MOCK_JOBS: JobPosting[] = [
  {
    id: '1',
    posterId: '1',
    posterName: 'Amara Johnson',
    posterAvatar: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=100',
    posterType: 'business',
    businessId: '1',
    businessName: 'Taste of Africa Restaurant',
    title: 'Line Cook',
    description: 'Looking for an experienced cook familiar with West African cuisine. Must be able to work evenings and weekends.',
    type: 'full_time',
    category: 'Food & Hospitality',
    skills: ['Cooking', 'Food Prep', 'Kitchen Safety'],
    location: 'Houston, TX',
    isRemote: false,
    salary: { min: 18, max: 25, currency: 'USD', period: 'hourly' },
    requirements: ['2+ years cooking experience', 'Food handlers certificate', 'Reliable transportation'],
    benefits: ['Meal allowance', 'Flexible schedule', 'Tips'],
    applicationsCount: 12,
    status: 'open',
    createdAt: '2025-01-05',
  },
  {
    id: '2',
    posterId: '2',
    posterName: 'Kwame Tech Solutions',
    posterAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
    posterType: 'business',
    businessName: 'Kwame Tech Solutions',
    title: 'Junior Web Developer',
    description: 'Growing tech company looking for a junior developer to join our team. Great opportunity to learn and grow!',
    type: 'full_time',
    category: 'Technology',
    skills: ['JavaScript', 'React', 'HTML/CSS'],
    location: 'Atlanta, GA',
    isRemote: true,
    salary: { min: 55000, max: 75000, currency: 'USD', period: 'yearly' },
    requirements: ['Basic knowledge of JavaScript', 'Portfolio of projects', 'Willingness to learn'],
    benefits: ['Health insurance', 'Remote work', '401k', 'Learning budget'],
    applicationsCount: 28,
    status: 'open',
    createdAt: '2025-01-03',
  },
  {
    id: '3',
    posterId: '3',
    posterName: 'Sarah M.',
    posterAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100',
    posterType: 'individual',
    title: 'Part-time Nanny',
    description: 'Looking for a caring nanny to help with two children (ages 3 and 5) on weekday afternoons.',
    type: 'part_time',
    category: 'Other',
    skills: ['Childcare', 'First Aid', 'Patience'],
    location: 'Dallas, TX',
    isRemote: false,
    salary: { min: 20, max: 25, currency: 'USD', period: 'hourly' },
    requirements: ['Experience with young children', 'CPR certified', 'Background check'],
    benefits: ['Flexible hours', 'Family environment'],
    applicationsCount: 5,
    status: 'open',
    createdAt: '2025-01-07',
  },
];

const MOCK_SKILLS: SkillListing[] = [
  {
    id: '1',
    userId: '1',
    userName: 'David Okonkwo',
    userAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100',
    title: 'Professional Photographer',
    description: 'Specializing in portraits, events, and product photography. 8 years of experience capturing beautiful moments.',
    category: 'Creative',
    skills: ['Portrait Photography', 'Event Coverage', 'Photo Editing'],
    hourlyRate: 75,
    projectRate: 500,
    currency: 'USD',
    availability: 'available',
    portfolio: [],
    reviews: [],
    rating: 4.9,
    completedJobs: 47,
    responseTime: 'within hours',
    isVerified: true,
    createdAt: '2024-06-01',
  },
  {
    id: '2',
    userId: '2',
    userName: 'Fatou Diallo',
    userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100',
    title: 'Professional Braider & Hair Stylist',
    description: 'Expert in all African braiding styles including knotless braids, cornrows, twists, and locs. Mobile service available.',
    category: 'Beauty',
    skills: ['Braiding', 'Locs', 'Natural Hair Care'],
    hourlyRate: 50,
    currency: 'USD',
    availability: 'available',
    portfolio: [],
    reviews: [],
    rating: 5.0,
    completedJobs: 123,
    responseTime: 'within hours',
    isVerified: true,
    createdAt: '2024-03-15',
  },
];

const getJobTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    full_time: 'Full-time',
    part_time: 'Part-time',
    contract: 'Contract',
    gig: 'Gig',
    internship: 'Internship',
    volunteer: 'Volunteer',
  };
  return labels[type] ?? type;
};

const getSalaryDisplay = (salary?: JobPosting['salary']) => {
  if (!salary) return 'Salary not specified';
  const { min, max, period } = salary;
  if (period === 'hourly') return `$${min}-$${max}/hr`;
  if (period === 'yearly') return `$${(min / 1000).toFixed(0)}k-$${(max / 1000).toFixed(0)}k/yr`;
  return `$${min}-$${max}/${period}`;
};

export default function JobBoardScreen() {
  const [activeTab, setActiveTab] = useState<'jobs' | 'skills'>('jobs');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showPostJob, setShowPostJob] = useState(false);
  const [selectedJob, setSelectedJob] = useState<JobPosting | null>(null);
  const [selectedSkill, setSelectedSkill] = useState<SkillListing | null>(null);

  const advancedFeatures = useAdvancedFeatures();
  const jobPostings = advancedFeatures?.jobPostings ?? [];
  const skillListings = advancedFeatures?.skillListings ?? [];
  const addJobPosting = advancedFeatures?.addJobPosting;

  const allJobs = [...jobPostings, ...MOCK_JOBS];
  const allSkills = [...skillListings, ...MOCK_SKILLS];

  const filteredJobs = allJobs.filter((job) => {
    const matchesSearch = (job.title ?? '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (job.description ?? '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || job.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleBack = () => {
    router.back();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Custom Header */}
      <View style={styles.header}>
        <Pressable onPress={handleBack} style={styles.backButton}>
          <ArrowLeft size={24} color="#1B4D3E" />
        </Pressable>
        <Text style={styles.headerTitle}>Jobs & Skills</Text>
        <Pressable onPress={() => setShowPostJob(true)} style={styles.addButton}>
          <Plus size={20} color="#D4673A" />
        </Pressable>
      </View>

      {/* Tabs */}
      <View className="flex-row mx-4 mt-2 bg-gray-100 rounded-xl p-1">
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setActiveTab('jobs');
          }}
          className={`flex-1 py-2.5 rounded-lg ${activeTab === 'jobs' ? 'bg-white shadow-sm' : ''}`}
        >
          <Text className={`text-center font-semibold ${activeTab === 'jobs' ? 'text-gray-900' : 'text-gray-500'}`}>
            Job Board
          </Text>
        </Pressable>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setActiveTab('skills');
          }}
          className={`flex-1 py-2.5 rounded-lg ${activeTab === 'skills' ? 'bg-white shadow-sm' : ''}`}
        >
          <Text className={`text-center font-semibold ${activeTab === 'skills' ? 'text-gray-900' : 'text-gray-500'}`}>
            Hire Skills
          </Text>
        </Pressable>
      </View>

      {/* Search */}
      <View className="mx-4 mt-4 flex-row items-center bg-white rounded-xl px-4 py-3">
        <Search size={20} color="#9CA3AF" />
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder={activeTab === 'jobs' ? 'Search jobs...' : 'Search skills...'}
          className="flex-1 ml-3 text-gray-900"
          placeholderTextColor="#9CA3AF"
        />
      </View>

      {/* Categories */}
      {activeTab === 'jobs' && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mt-3 px-4"
          style={{ flexGrow: 0 }}
          contentContainerStyle={{ paddingRight: 16 }}
        >
          {JOB_CATEGORIES.map((cat) => (
            <Pressable
              key={cat}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setSelectedCategory(cat);
              }}
              className={`px-4 py-2 rounded-full mr-2 ${selectedCategory === cat ? 'bg-emerald-800' : 'bg-white'}`}
            >
              <Text className={`font-medium ${selectedCategory === cat ? 'text-white' : 'text-gray-700'}`}>
                {cat}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      )}

      <ScrollView className="flex-1 mt-4" showsVerticalScrollIndicator={false}>
        {activeTab === 'jobs' ? (
          <View className="px-4">
            {filteredJobs.map((job, index) => (
              <Animated.View key={job.id} entering={FadeInDown.delay(index * 100)}>
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSelectedJob(job);
                  }}
                  className="bg-white rounded-2xl p-4 mb-3 shadow-sm"
                >
                  <View className="flex-row items-start">
                    <Image source={{ uri: job.posterAvatar }} className="w-12 h-12 rounded-xl" />
                    <View className="flex-1 ml-3">
                      <Text className="text-gray-900 font-bold text-lg">{job.title}</Text>
                      <Text className="text-gray-600 text-sm">{job.businessName ?? job.posterName}</Text>
                    </View>
                    <View className={`px-2 py-1 rounded-full ${job.isRemote ? 'bg-blue-100' : 'bg-gray-100'}`}>
                      <Text className={`text-xs font-medium ${job.isRemote ? 'text-blue-700' : 'text-gray-600'}`}>
                        {job.isRemote ? 'Remote' : 'On-site'}
                      </Text>
                    </View>
                  </View>

                  <Text className="text-gray-600 text-sm mt-3" numberOfLines={2}>{job.description}</Text>

                  <View className="flex-row flex-wrap mt-3 gap-2">
                    <View className="flex-row items-center bg-emerald-50 px-2 py-1 rounded-full">
                      <DollarSign size={12} color="#059669" />
                      <Text className="text-emerald-700 text-xs ml-1">{getSalaryDisplay(job.salary)}</Text>
                    </View>
                    <View className="flex-row items-center bg-amber-50 px-2 py-1 rounded-full">
                      <Clock size={12} color="#D4673A" />
                      <Text className="text-amber-700 text-xs ml-1">{getJobTypeLabel(job.type)}</Text>
                    </View>
                    <View className="flex-row items-center bg-gray-100 px-2 py-1 rounded-full">
                      <MapPin size={12} color="#6B7280" />
                      <Text className="text-gray-600 text-xs ml-1">{job.location}</Text>
                    </View>
                  </View>

                  <View className="flex-row items-center justify-between mt-4 pt-3 border-t border-gray-100">
                    <View className="flex-row items-center">
                      <Users size={14} color="#6B7280" />
                      <Text className="text-gray-500 text-sm ml-1">{job.applicationsCount} applicants</Text>
                    </View>
                    <View className="flex-row items-center">
                      <Text className="text-emerald-700 font-medium">Apply</Text>
                      <ChevronRight size={16} color="#047857" />
                    </View>
                  </View>
                </Pressable>
              </Animated.View>
            ))}
          </View>
        ) : (
          <View className="px-4">
            {allSkills.map((skill, index) => (
              <Animated.View key={skill.id} entering={FadeInDown.delay(index * 100)}>
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSelectedSkill(skill);
                  }}
                  className="bg-white rounded-2xl p-4 mb-3 shadow-sm"
                >
                  <View className="flex-row items-start">
                    <Image source={{ uri: skill.userAvatar }} className="w-14 h-14 rounded-full" />
                    <View className="flex-1 ml-3">
                      <View className="flex-row items-center">
                        <Text className="text-gray-900 font-bold text-lg">{skill.userName}</Text>
                        {skill.isVerified && (
                          <CheckCircle size={16} color="#059669" style={{ marginLeft: 6 }} />
                        )}
                      </View>
                      <Text className="text-emerald-700 font-medium">{skill.title}</Text>
                      <View className="flex-row items-center mt-1">
                        <Star size={14} color="#F59E0B" fill="#F59E0B" />
                        <Text className="text-gray-700 text-sm ml-1">{skill.rating}</Text>
                        <Text className="text-gray-400 text-sm ml-1">({skill.completedJobs} jobs)</Text>
                      </View>
                    </View>
                  </View>

                  <Text className="text-gray-600 text-sm mt-3" numberOfLines={2}>{skill.description}</Text>

                  <View className="flex-row flex-wrap mt-3 gap-2">
                    {skill.skills.slice(0, 3).map((s, idx) => (
                      <View key={idx} className="bg-gray-100 px-3 py-1 rounded-full">
                        <Text className="text-gray-700 text-xs">{s}</Text>
                      </View>
                    ))}
                  </View>

                  <View className="flex-row items-center justify-between mt-4 pt-3 border-t border-gray-100">
                    <Text className="text-emerald-700 font-bold text-lg">
                      ${skill.hourlyRate}/hr
                    </Text>
                    <View className={`px-3 py-1 rounded-full ${skill.availability === 'available' ? 'bg-green-100' : 'bg-gray-100'}`}>
                      <Text className={`text-sm font-medium capitalize ${skill.availability === 'available' ? 'text-green-700' : 'text-gray-600'}`}>
                        {skill.availability}
                      </Text>
                    </View>
                  </View>
                </Pressable>
              </Animated.View>
            ))}
          </View>
        )}

        <View className="h-8" />
      </ScrollView>

      {/* Post Job Modal */}
      <Modal visible={showPostJob} animationType="slide" presentationStyle="pageSheet">
        <PostJobModal onClose={() => setShowPostJob(false)} onSubmit={addJobPosting} />
      </Modal>

      {/* Job Detail Modal */}
      <Modal visible={!!selectedJob} animationType="slide" presentationStyle="pageSheet">
        {selectedJob && (
          <JobDetailModal job={selectedJob} onClose={() => setSelectedJob(null)} />
        )}
      </Modal>

      {/* Skill Detail Modal */}
      <Modal visible={!!selectedSkill} animationType="slide" presentationStyle="pageSheet">
        {selectedSkill && (
          <SkillDetailModal skill={selectedSkill} onClose={() => setSelectedSkill(null)} />
        )}
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF7F2',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  addButton: {
    backgroundColor: '#FEF3C7',
    padding: 8,
    borderRadius: 999,
  },
});

function PostJobModal({ onClose, onSubmit }: { onClose: () => void; onSubmit?: (job: JobPosting) => void }) {
  const currentUser = useStore((s) => s.currentUser);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [salary, setSalary] = useState('');
  const [jobType, setJobType] = useState<JobPosting['type']>('full_time');
  const [isRemote, setIsRemote] = useState(false);

  const handleSubmit = () => {
    if (!title.trim() || !description.trim() || !onSubmit) return;

    const job: JobPosting = {
      id: uuidv4(),
      posterId: currentUser?.id ?? 'guest',
      posterName: currentUser?.name ?? 'Guest',
      posterAvatar: currentUser?.avatar ?? 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100',
      posterType: 'individual',
      title: title.trim(),
      description: description.trim(),
      type: jobType,
      category: 'Other',
      skills: [],
      location: location.trim() || 'Not specified',
      isRemote,
      salary: salary ? {
        min: parseInt(salary),
        max: parseInt(salary) + 10,
        currency: 'USD',
        period: 'hourly',
      } : undefined,
      requirements: [],
      benefits: [],
      applicationsCount: 0,
      status: 'open',
      createdAt: new Date().toISOString(),
    };

    onSubmit(job);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onClose();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FAF7F2' }}>
      <View className="flex-row items-center justify-between p-4 border-b border-gray-200 bg-white">
        <Pressable onPress={onClose}>
          <X size={24} color="#6B7280" />
        </Pressable>
        <Text className="text-lg font-bold text-gray-900">Post a Job</Text>
        <Pressable
          onPress={handleSubmit}
          disabled={!title.trim() || !description.trim()}
          className={`px-4 py-2 rounded-full ${title.trim() && description.trim() ? 'bg-emerald-800' : 'bg-gray-200'}`}
        >
          <Text className={`font-semibold ${title.trim() && description.trim() ? 'text-white' : 'text-gray-400'}`}>
            Post
          </Text>
        </Pressable>
      </View>

      <ScrollView className="flex-1 p-4">
        <Text className="text-gray-700 font-medium mb-2">Job Title</Text>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="e.g., Line Cook, Web Developer"
          className="bg-white p-4 rounded-xl text-gray-900 mb-4"
        />

        <Text className="text-gray-700 font-medium mb-2">Description</Text>
        <TextInput
          value={description}
          onChangeText={setDescription}
          placeholder="Describe the role and responsibilities..."
          className="bg-white p-4 rounded-xl text-gray-900 mb-4"
          multiline
          numberOfLines={4}
          style={{ minHeight: 100 }}
        />

        <Text className="text-gray-700 font-medium mb-2">Location</Text>
        <TextInput
          value={location}
          onChangeText={setLocation}
          placeholder="e.g., Houston, TX"
          className="bg-white p-4 rounded-xl text-gray-900 mb-4"
        />

        <View className="flex-row items-center mb-4">
          <Pressable
            onPress={() => setIsRemote(!isRemote)}
            className={`w-6 h-6 rounded-md border-2 mr-3 items-center justify-center ${isRemote ? 'bg-emerald-800 border-emerald-800' : 'border-gray-300'}`}
          >
            {isRemote && <CheckCircle size={14} color="white" />}
          </Pressable>
          <Text className="text-gray-700">This is a remote position</Text>
        </View>

        <Text className="text-gray-700 font-medium mb-2">Hourly Rate ($)</Text>
        <TextInput
          value={salary}
          onChangeText={setSalary}
          placeholder="e.g., 20"
          keyboardType="numeric"
          className="bg-white p-4 rounded-xl text-gray-900 mb-4"
        />

        <Text className="text-gray-700 font-medium mb-2">Job Type</Text>
        <View className="flex-row flex-wrap gap-2 mb-4">
          {(['full_time', 'part_time', 'contract', 'gig'] as const).map((type) => (
            <Pressable
              key={type}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setJobType(type);
              }}
              className={`px-4 py-2 rounded-full ${jobType === type ? 'bg-emerald-800' : 'bg-white'}`}
            >
              <Text className={`font-medium capitalize ${jobType === type ? 'text-white' : 'text-gray-700'}`}>
                {type.replace('_', '-')}
              </Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function JobDetailModal({ job, onClose }: { job: JobPosting; onClose: () => void }) {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FAF7F2' }}>
      <View className="flex-row items-center justify-between p-4 border-b border-gray-200 bg-white">
        <Pressable onPress={onClose}>
          <X size={24} color="#6B7280" />
        </Pressable>
        <Text className="text-lg font-bold text-gray-900">Job Details</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView className="flex-1 p-4">
        <View className="bg-white rounded-2xl p-4 mb-4">
          <View className="flex-row items-start">
            <Image source={{ uri: job.posterAvatar }} className="w-16 h-16 rounded-xl" />
            <View className="flex-1 ml-4">
              <Text className="text-gray-900 font-bold text-xl">{job.title}</Text>
              <Text className="text-emerald-700 font-medium">{job.businessName ?? job.posterName}</Text>
              <View className="flex-row items-center mt-1">
                <MapPin size={14} color="#6B7280" />
                <Text className="text-gray-500 ml-1">{job.location}</Text>
              </View>
            </View>
          </View>

          <View className="flex-row flex-wrap gap-2 mt-4">
            <View className="bg-emerald-50 px-3 py-1.5 rounded-full">
              <Text className="text-emerald-700 font-medium">{getSalaryDisplay(job.salary)}</Text>
            </View>
            <View className="bg-amber-50 px-3 py-1.5 rounded-full">
              <Text className="text-amber-700 font-medium">{getJobTypeLabel(job.type)}</Text>
            </View>
            <View className={`px-3 py-1.5 rounded-full ${job.isRemote ? 'bg-blue-50' : 'bg-gray-100'}`}>
              <Text className={job.isRemote ? 'text-blue-700 font-medium' : 'text-gray-600 font-medium'}>
                {job.isRemote ? 'Remote' : 'On-site'}
              </Text>
            </View>
          </View>
        </View>

        <View className="bg-white rounded-2xl p-4 mb-4">
          <Text className="text-gray-900 font-bold text-lg mb-3">Description</Text>
          <Text className="text-gray-600 leading-6">{job.description}</Text>
        </View>

        {job.requirements && job.requirements.length > 0 && (
          <View className="bg-white rounded-2xl p-4 mb-4">
            <Text className="text-gray-900 font-bold text-lg mb-3">Requirements</Text>
            {job.requirements.map((req, index) => (
              <View key={index} className="flex-row items-start mb-2">
                <CheckCircle size={16} color="#059669" style={{ marginTop: 2 }} />
                <Text className="text-gray-600 ml-2 flex-1">{req}</Text>
              </View>
            ))}
          </View>
        )}

        {job.benefits && job.benefits.length > 0 && (
          <View className="bg-white rounded-2xl p-4 mb-4">
            <Text className="text-gray-900 font-bold text-lg mb-3">Benefits</Text>
            {job.benefits.map((benefit, index) => (
              <View key={index} className="flex-row items-start mb-2">
                <Star size={16} color="#F59E0B" style={{ marginTop: 2 }} />
                <Text className="text-gray-600 ml-2 flex-1">{benefit}</Text>
              </View>
            ))}
          </View>
        )}

        <View className="bg-white rounded-2xl p-4 mb-4">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <Users size={18} color="#6B7280" />
              <Text className="text-gray-500 ml-2">{job.applicationsCount} applicants</Text>
            </View>
            <Text className="text-gray-400 text-sm">
              Posted {new Date(job.createdAt).toLocaleDateString()}
            </Text>
          </View>
        </View>

        <Pressable
          onPress={() => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert('Application Sent', 'Your application has been submitted successfully!');
            onClose();
          }}
          className="bg-emerald-800 py-4 rounded-xl items-center mb-8"
        >
          <Text className="text-white font-bold text-lg">Apply Now</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function SkillDetailModal({ skill, onClose }: { skill: SkillListing; onClose: () => void }) {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FAF7F2' }}>
      <View className="flex-row items-center justify-between p-4 border-b border-gray-200 bg-white">
        <Pressable onPress={onClose}>
          <X size={24} color="#6B7280" />
        </Pressable>
        <Text className="text-lg font-bold text-gray-900">Skill Provider</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView className="flex-1 p-4">
        <View className="bg-white rounded-2xl p-4 mb-4 items-center">
          <Image source={{ uri: skill.userAvatar }} className="w-24 h-24 rounded-full" />
          <View className="flex-row items-center mt-3">
            <Text className="text-gray-900 font-bold text-xl">{skill.userName}</Text>
            {skill.isVerified && (
              <CheckCircle size={18} color="#059669" style={{ marginLeft: 6 }} />
            )}
          </View>
          <Text className="text-emerald-700 font-medium text-lg mt-1">{skill.title}</Text>

          <View className="flex-row items-center mt-2">
            <Star size={18} color="#F59E0B" fill="#F59E0B" />
            <Text className="text-gray-700 font-bold ml-1">{skill.rating}</Text>
            <Text className="text-gray-400 ml-1">({skill.completedJobs} jobs completed)</Text>
          </View>
        </View>

        <View className="bg-white rounded-2xl p-4 mb-4">
          <Text className="text-gray-900 font-bold text-lg mb-3">About</Text>
          <Text className="text-gray-600 leading-6">{skill.description}</Text>
        </View>

        <View className="bg-white rounded-2xl p-4 mb-4">
          <Text className="text-gray-900 font-bold text-lg mb-3">Skills</Text>
          <View className="flex-row flex-wrap gap-2">
            {skill.skills.map((s, index) => (
              <View key={index} className="bg-emerald-50 px-3 py-1.5 rounded-full">
                <Text className="text-emerald-700 font-medium">{s}</Text>
              </View>
            ))}
          </View>
        </View>

        <View className="bg-white rounded-2xl p-4 mb-4">
          <View className="flex-row items-center justify-between">
            <Text className="text-gray-500">Hourly Rate</Text>
            <Text className="text-emerald-700 font-bold text-xl">
              ${skill.hourlyRate ?? 0}/hr
            </Text>
          </View>
          <View className="flex-row items-center justify-between mt-2">
            <Text className="text-gray-500">Availability</Text>
            <Text className="text-gray-700 font-medium capitalize">{skill.availability}</Text>
          </View>
        </View>

        <Pressable
          onPress={() => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert('Message Sent', `Your message has been sent to ${skill.userName}!`);
            onClose();
          }}
          className="bg-emerald-800 py-4 rounded-xl items-center mb-8"
        >
          <Text className="text-white font-bold text-lg">Contact {skill.userName.split(' ')[0]}</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
