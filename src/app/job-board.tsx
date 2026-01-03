import { useState } from 'react';
import { View, Text, ScrollView, Pressable, Image, TextInput, Modal, Alert, StyleSheet } from 'react-native';
import { Stack, router } from 'expo-router';
import { MapPin, Clock, DollarSign, Search, Plus, X, ChevronRight, Users, Star, CheckCircle } from 'lucide-react-native';
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
];

const MOCK_SKILLS: SkillListing[] = [
  {
    id: '1',
    userId: '1',
    userName: 'David Okonkwo',
    userAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100',
    title: 'Professional Photographer',
    description: 'Specializing in portraits, events, and product photography. 8 years of experience.',
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
    description: 'Expert in all African braiding styles including knotless braids, cornrows, twists, and locs.',
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

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Jobs & Skills',
          headerStyle: { backgroundColor: '#FAF7F2' },
          headerTintColor: '#1B4D3E',
          headerRight: () => (
            <Pressable onPress={() => setShowPostJob(true)} style={styles.headerButton}>
              <Plus size={20} color="#D4673A" />
            </Pressable>
          ),
        }}
      />

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setActiveTab('jobs');
          }}
          style={[styles.tab, activeTab === 'jobs' && styles.tabActive]}
        >
          <Text style={[styles.tabText, activeTab === 'jobs' && styles.tabTextActive]}>
            Job Board
          </Text>
        </Pressable>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setActiveTab('skills');
          }}
          style={[styles.tab, activeTab === 'skills' && styles.tabActive]}
        >
          <Text style={[styles.tabText, activeTab === 'skills' && styles.tabTextActive]}>
            Hire Skills
          </Text>
        </Pressable>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Search size={20} color="#9CA3AF" />
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder={activeTab === 'jobs' ? 'Search jobs...' : 'Search skills...'}
          style={styles.searchInput}
          placeholderTextColor="#9CA3AF"
        />
      </View>

      {/* Categories */}
      {activeTab === 'jobs' && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoriesScroll}
          contentContainerStyle={{ paddingHorizontal: 16, paddingRight: 32 }}
        >
          {JOB_CATEGORIES.map((cat) => (
            <Pressable
              key={cat}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setSelectedCategory(cat);
              }}
              style={[styles.categoryPill, selectedCategory === cat && styles.categoryPillActive]}
            >
              <Text style={[styles.categoryText, selectedCategory === cat && styles.categoryTextActive]}>
                {cat}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      )}

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {activeTab === 'jobs' ? (
          <View style={styles.content}>
            {filteredJobs.map((job) => (
              <Pressable
                key={job.id}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setSelectedJob(job);
                }}
                style={styles.card}
              >
                <View style={styles.cardHeader}>
                  <Image source={{ uri: job.posterAvatar }} style={styles.avatar} />
                  <View style={styles.cardHeaderText}>
                    <Text style={styles.cardTitle}>{job.title}</Text>
                    <Text style={styles.cardSubtitle}>{job.businessName ?? job.posterName}</Text>
                  </View>
                  <View style={[styles.badge, job.isRemote ? styles.badgeBlue : styles.badgeGray]}>
                    <Text style={[styles.badgeText, job.isRemote ? styles.badgeTextBlue : styles.badgeTextGray]}>
                      {job.isRemote ? 'Remote' : 'On-site'}
                    </Text>
                  </View>
                </View>

                <Text style={styles.cardDescription} numberOfLines={2}>{job.description}</Text>

                <View style={styles.tagsRow}>
                  <View style={styles.tagGreen}>
                    <DollarSign size={12} color="#059669" />
                    <Text style={styles.tagGreenText}>{getSalaryDisplay(job.salary)}</Text>
                  </View>
                  <View style={styles.tagAmber}>
                    <Clock size={12} color="#D4673A" />
                    <Text style={styles.tagAmberText}>{getJobTypeLabel(job.type)}</Text>
                  </View>
                  <View style={styles.tagGray}>
                    <MapPin size={12} color="#6B7280" />
                    <Text style={styles.tagGrayText}>{job.location}</Text>
                  </View>
                </View>

                <View style={styles.cardFooter}>
                  <View style={styles.footerLeft}>
                    <Users size={14} color="#6B7280" />
                    <Text style={styles.footerText}>{job.applicationsCount} applicants</Text>
                  </View>
                  <View style={styles.footerRight}>
                    <Text style={styles.applyText}>Apply</Text>
                    <ChevronRight size={16} color="#047857" />
                  </View>
                </View>
              </Pressable>
            ))}
          </View>
        ) : (
          <View style={styles.content}>
            {allSkills.map((skill) => (
              <Pressable
                key={skill.id}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setSelectedSkill(skill);
                }}
                style={styles.card}
              >
                <View style={styles.cardHeader}>
                  <Image source={{ uri: skill.userAvatar }} style={styles.avatarRound} />
                  <View style={styles.cardHeaderText}>
                    <View style={styles.nameRow}>
                      <Text style={styles.cardTitle}>{skill.userName}</Text>
                      {skill.isVerified && <CheckCircle size={16} color="#059669" style={{ marginLeft: 6 }} />}
                    </View>
                    <Text style={styles.skillTitle}>{skill.title}</Text>
                    <View style={styles.ratingRow}>
                      <Star size={14} color="#F59E0B" fill="#F59E0B" />
                      <Text style={styles.ratingText}>{skill.rating}</Text>
                      <Text style={styles.ratingJobs}>({skill.completedJobs} jobs)</Text>
                    </View>
                  </View>
                </View>

                <Text style={styles.cardDescription} numberOfLines={2}>{skill.description}</Text>

                <View style={styles.skillTags}>
                  {skill.skills.slice(0, 3).map((s, idx) => (
                    <View key={idx} style={styles.skillTag}>
                      <Text style={styles.skillTagText}>{s}</Text>
                    </View>
                  ))}
                </View>

                <View style={styles.cardFooter}>
                  <Text style={styles.rateText}>${skill.hourlyRate}/hr</Text>
                  <View style={[styles.availabilityBadge, skill.availability === 'available' ? styles.availableGreen : styles.availableGray]}>
                    <Text style={[styles.availabilityText, skill.availability === 'available' ? styles.availableTextGreen : styles.availableTextGray]}>
                      {skill.availability}
                    </Text>
                  </View>
                </View>
              </Pressable>
            ))}
          </View>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>

      {/* Post Job Modal */}
      {showPostJob && (
        <Modal visible={true} animationType="slide" presentationStyle="pageSheet">
          <PostJobModal onClose={() => setShowPostJob(false)} onSubmit={addJobPosting} />
        </Modal>
      )}

      {/* Job Detail Modal */}
      {selectedJob && (
        <Modal visible={true} animationType="slide" presentationStyle="pageSheet">
          <JobDetailModal job={selectedJob} onClose={() => setSelectedJob(null)} />
        </Modal>
      )}

      {/* Skill Detail Modal */}
      {selectedSkill && (
        <Modal visible={true} animationType="slide" presentationStyle="pageSheet">
          <SkillDetailModal skill={selectedSkill} onClose={() => setSelectedSkill(null)} />
        </Modal>
      )}
    </View>
  );
}

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
      salary: salary ? { min: parseInt(salary), max: parseInt(salary) + 10, currency: 'USD', period: 'hourly' } : undefined,
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
    <View style={modalStyles.container}>
      <View style={modalStyles.header}>
        <Pressable onPress={onClose}><X size={24} color="#6B7280" /></Pressable>
        <Text style={modalStyles.headerTitle}>Post a Job</Text>
        <Pressable
          onPress={handleSubmit}
          disabled={!title.trim() || !description.trim()}
          style={[modalStyles.submitButton, title.trim() && description.trim() ? modalStyles.submitActive : modalStyles.submitDisabled]}
        >
          <Text style={[modalStyles.submitText, title.trim() && description.trim() ? modalStyles.submitTextActive : modalStyles.submitTextDisabled]}>Post</Text>
        </Pressable>
      </View>

      <ScrollView style={modalStyles.content}>
        <Text style={modalStyles.label}>Job Title</Text>
        <TextInput value={title} onChangeText={setTitle} placeholder="e.g., Line Cook, Web Developer" style={modalStyles.input} />

        <Text style={modalStyles.label}>Description</Text>
        <TextInput value={description} onChangeText={setDescription} placeholder="Describe the role..." style={[modalStyles.input, { minHeight: 100 }]} multiline />

        <Text style={modalStyles.label}>Location</Text>
        <TextInput value={location} onChangeText={setLocation} placeholder="e.g., Houston, TX" style={modalStyles.input} />

        <View style={modalStyles.checkboxRow}>
          <Pressable onPress={() => setIsRemote(!isRemote)} style={[modalStyles.checkbox, isRemote && modalStyles.checkboxActive]}>
            {isRemote && <CheckCircle size={14} color="white" />}
          </Pressable>
          <Text style={modalStyles.checkboxLabel}>This is a remote position</Text>
        </View>

        <Text style={modalStyles.label}>Hourly Rate ($)</Text>
        <TextInput value={salary} onChangeText={setSalary} placeholder="e.g., 20" keyboardType="numeric" style={modalStyles.input} />

        <Text style={modalStyles.label}>Job Type</Text>
        <View style={modalStyles.typeRow}>
          {(['full_time', 'part_time', 'contract', 'gig'] as const).map((type) => (
            <Pressable key={type} onPress={() => setJobType(type)} style={[modalStyles.typePill, jobType === type && modalStyles.typePillActive]}>
              <Text style={[modalStyles.typeText, jobType === type && modalStyles.typeTextActive]}>{type.replace('_', '-')}</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

function JobDetailModal({ job, onClose }: { job: JobPosting; onClose: () => void }) {
  return (
    <View style={modalStyles.container}>
      <View style={modalStyles.header}>
        <Pressable onPress={onClose}><X size={24} color="#6B7280" /></Pressable>
        <Text style={modalStyles.headerTitle}>Job Details</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={modalStyles.content}>
        <View style={modalStyles.card}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
            <Image source={{ uri: job.posterAvatar }} style={{ width: 64, height: 64, borderRadius: 12 }} />
            <View style={{ flex: 1, marginLeft: 16 }}>
              <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#111827' }}>{job.title}</Text>
              <Text style={{ color: '#047857', fontWeight: '500' }}>{job.businessName ?? job.posterName}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                <MapPin size={14} color="#6B7280" />
                <Text style={{ color: '#6B7280', marginLeft: 4 }}>{job.location}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={modalStyles.card}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#111827', marginBottom: 12 }}>Description</Text>
          <Text style={{ color: '#4B5563', lineHeight: 24 }}>{job.description}</Text>
        </View>

        <Pressable
          onPress={() => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert('Application Sent', 'Your application has been submitted successfully!');
            onClose();
          }}
          style={modalStyles.applyButton}
        >
          <Text style={modalStyles.applyButtonText}>Apply Now</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

function SkillDetailModal({ skill, onClose }: { skill: SkillListing; onClose: () => void }) {
  return (
    <View style={modalStyles.container}>
      <View style={modalStyles.header}>
        <Pressable onPress={onClose}><X size={24} color="#6B7280" /></Pressable>
        <Text style={modalStyles.headerTitle}>Skill Provider</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={modalStyles.content}>
        <View style={[modalStyles.card, { alignItems: 'center' }]}>
          <Image source={{ uri: skill.userAvatar }} style={{ width: 96, height: 96, borderRadius: 48 }} />
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12 }}>
            <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#111827' }}>{skill.userName}</Text>
            {skill.isVerified && <CheckCircle size={18} color="#059669" style={{ marginLeft: 6 }} />}
          </View>
          <Text style={{ color: '#047857', fontWeight: '500', fontSize: 18, marginTop: 4 }}>{skill.title}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
            <Star size={18} color="#F59E0B" fill="#F59E0B" />
            <Text style={{ fontWeight: 'bold', color: '#374151', marginLeft: 4 }}>{skill.rating}</Text>
            <Text style={{ color: '#9CA3AF', marginLeft: 4 }}>({skill.completedJobs} jobs)</Text>
          </View>
        </View>

        <View style={modalStyles.card}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#111827', marginBottom: 12 }}>About</Text>
          <Text style={{ color: '#4B5563', lineHeight: 24 }}>{skill.description}</Text>
        </View>

        <Pressable
          onPress={() => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert('Message Sent', `Your message has been sent to ${skill.userName}!`);
            onClose();
          }}
          style={modalStyles.applyButton}
        >
          <Text style={modalStyles.applyButtonText}>Contact {skill.userName.split(' ')[0]}</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF7F2' },
  headerButton: { backgroundColor: '#FEF3C7', padding: 8, borderRadius: 20 },
  tabContainer: { flexDirection: 'row', marginHorizontal: 16, marginTop: 8, backgroundColor: '#F3F4F6', borderRadius: 12, padding: 4 },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 8 },
  tabActive: { backgroundColor: 'white', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 },
  tabText: { textAlign: 'center', fontWeight: '600', color: '#6B7280' },
  tabTextActive: { color: '#111827' },
  searchContainer: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginTop: 16, backgroundColor: 'white', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12 },
  searchInput: { flex: 1, marginLeft: 12, color: '#111827' },
  categoriesScroll: { marginTop: 12, flexGrow: 0 },
  categoryPill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginRight: 8, backgroundColor: 'white' },
  categoryPillActive: { backgroundColor: '#065F46' },
  categoryText: { fontWeight: '500', color: '#374151' },
  categoryTextActive: { color: 'white' },
  scrollView: { flex: 1, marginTop: 16 },
  content: { paddingHorizontal: 16 },
  card: { backgroundColor: 'white', borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2 },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start' },
  avatar: { width: 48, height: 48, borderRadius: 12 },
  avatarRound: { width: 56, height: 56, borderRadius: 28 },
  cardHeaderText: { flex: 1, marginLeft: 12 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827' },
  cardSubtitle: { color: '#4B5563', fontSize: 14 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20 },
  badgeBlue: { backgroundColor: '#DBEAFE' },
  badgeGray: { backgroundColor: '#F3F4F6' },
  badgeText: { fontSize: 12, fontWeight: '500' },
  badgeTextBlue: { color: '#1D4ED8' },
  badgeTextGray: { color: '#4B5563' },
  cardDescription: { color: '#4B5563', fontSize: 14, marginTop: 12 },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 12, gap: 8 },
  tagGreen: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#D1FAE5', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20 },
  tagGreenText: { color: '#047857', fontSize: 12, marginLeft: 4 },
  tagAmber: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF3C7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20 },
  tagAmberText: { color: '#B45309', fontSize: 12, marginLeft: 4 },
  tagGray: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20 },
  tagGrayText: { color: '#4B5563', fontSize: 12, marginLeft: 4 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  footerLeft: { flexDirection: 'row', alignItems: 'center' },
  footerText: { color: '#6B7280', fontSize: 14, marginLeft: 4 },
  footerRight: { flexDirection: 'row', alignItems: 'center' },
  applyText: { color: '#047857', fontWeight: '500' },
  nameRow: { flexDirection: 'row', alignItems: 'center' },
  skillTitle: { color: '#047857', fontWeight: '500' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  ratingText: { color: '#374151', fontSize: 14, marginLeft: 4 },
  ratingJobs: { color: '#9CA3AF', fontSize: 14, marginLeft: 4 },
  skillTags: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 12, gap: 8 },
  skillTag: { backgroundColor: '#F3F4F6', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
  skillTagText: { color: '#374151', fontSize: 12 },
  rateText: { color: '#047857', fontWeight: 'bold', fontSize: 18 },
  availabilityBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
  availableGreen: { backgroundColor: '#D1FAE5' },
  availableGray: { backgroundColor: '#F3F4F6' },
  availabilityText: { fontSize: 14, fontWeight: '500', textTransform: 'capitalize' },
  availableTextGreen: { color: '#047857' },
  availableTextGray: { color: '#4B5563' },
});

const modalStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF7F2' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: '#E5E7EB', backgroundColor: 'white' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827' },
  content: { flex: 1, padding: 16 },
  card: { backgroundColor: 'white', borderRadius: 16, padding: 16, marginBottom: 16 },
  label: { color: '#374151', fontWeight: '500', marginBottom: 8 },
  input: { backgroundColor: 'white', padding: 16, borderRadius: 12, color: '#111827', marginBottom: 16 },
  checkboxRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  checkbox: { width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: '#D1D5DB', marginRight: 12, alignItems: 'center', justifyContent: 'center' },
  checkboxActive: { backgroundColor: '#065F46', borderColor: '#065F46' },
  checkboxLabel: { color: '#374151' },
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  typePill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: 'white' },
  typePillActive: { backgroundColor: '#065F46' },
  typeText: { fontWeight: '500', color: '#374151', textTransform: 'capitalize' },
  typeTextActive: { color: 'white' },
  submitButton: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  submitActive: { backgroundColor: '#065F46' },
  submitDisabled: { backgroundColor: '#E5E7EB' },
  submitText: { fontWeight: '600' },
  submitTextActive: { color: 'white' },
  submitTextDisabled: { color: '#9CA3AF' },
  applyButton: { backgroundColor: '#065F46', paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginBottom: 32 },
  applyButtonText: { color: 'white', fontWeight: 'bold', fontSize: 18 },
});
