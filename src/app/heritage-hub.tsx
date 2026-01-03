import { useState } from 'react';
import { View, Text, ScrollView, Pressable, Image, StyleSheet } from 'react-native';
import { Stack, router } from 'expo-router';
import { BookOpen, Users, Globe, ChefHat, Heart, ChevronRight, Clock, TreePine, Languages } from 'lucide-react-native';
import { useAdvancedFeatures, type TraditionalRecipe, type LanguagePod, type FamilyTree } from '@/lib/advancedFeatures';
import * as Haptics from 'expo-haptics';

const TABS = ['Recipes', 'Languages', 'Family Trees'];

const MOCK_RECIPES: TraditionalRecipe[] = [
  {
    id: '1',
    authorId: '1',
    authorName: 'Mama Fatou',
    authorAvatar: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=100',
    title: 'Jollof Rice',
    description: 'The classic West African one-pot rice dish that brings families together.',
    origin: 'Nigeria',
    region: 'West Africa',
    category: 'main',
    ingredients: [
      { item: 'Long grain rice', amount: '2 cups' },
      { item: 'Tomato paste', amount: '3 tbsp' },
    ],
    instructions: [
      { step: 1, text: 'Blend tomatoes, peppers, and one onion until smooth' },
      { step: 2, text: 'Fry the remaining onion in oil until golden' },
    ],
    prepTime: 20,
    cookTime: 45,
    servings: 6,
    difficulty: 'medium',
    tips: ['Use parboiled rice for best results'],
    story: 'This recipe has been in my family for four generations.',
    images: ['https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=400'],
    likes: 234,
    saves: 89,
    reviews: [],
    createdAt: '2024-06-01',
  },
  {
    id: '2',
    authorId: '2',
    authorName: 'Chef Kwame',
    authorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
    title: 'Injera with Doro Wat',
    description: 'Traditional Ethiopian sourdough flatbread served with spicy chicken stew.',
    origin: 'Ethiopia',
    region: 'East Africa',
    category: 'main',
    ingredients: [
      { item: 'Teff flour', amount: '2 cups' },
      { item: 'Chicken', amount: '2 lbs' },
    ],
    instructions: [
      { step: 1, text: 'Make injera batter 3 days ahead and let ferment' },
      { step: 2, text: 'Slowly cook onions until caramelized' },
    ],
    prepTime: 30,
    cookTime: 90,
    servings: 4,
    difficulty: 'hard',
    tips: ['Patience with onions is key'],
    story: 'Doro Wat is traditionally served on holidays.',
    images: ['https://images.unsplash.com/photo-1567364816519-cbc9c4ffe1eb?w=400'],
    likes: 156,
    saves: 67,
    reviews: [],
    createdAt: '2024-07-15',
  },
];

const MOCK_PODS: LanguagePod[] = [
  {
    id: '1',
    hostId: '1',
    hostName: 'Adaeze Okonkwo',
    hostAvatar: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=100',
    language: 'Igbo',
    dialect: 'Central Igbo',
    level: 'beginner',
    title: 'Learn Igbo from Scratch',
    description: 'Perfect for those wanting to connect with their Nigerian Igbo heritage.',
    maxParticipants: 12,
    participants: [],
    schedule: [{ dayOfWeek: 6, time: '10:00', duration: 60 }],
    isOnline: true,
    lessons: [],
    status: 'open',
    createdAt: '2024-09-01',
  },
  {
    id: '2',
    hostId: '2',
    hostName: 'Amadou Diallo',
    hostAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
    language: 'Wolof',
    level: 'intermediate',
    title: 'Wolof Conversation Practice',
    description: 'For those with basic Wolof who want to improve their speaking skills.',
    maxParticipants: 8,
    participants: [],
    schedule: [{ dayOfWeek: 0, time: '14:00', duration: 90 }],
    isOnline: true,
    lessons: [],
    status: 'open',
    createdAt: '2024-08-15',
  },
];

const MOCK_TREES: FamilyTree[] = [
  {
    id: '1',
    ownerId: '1',
    name: 'The Okonkwo Family',
    description: 'Tracing our roots from Anambra State, Nigeria back to the 1800s.',
    members: [],
    isPublic: false,
    collaborators: [],
    createdAt: '2024-06-01',
    updatedAt: '2025-01-01',
  },
];

export default function HeritageHubScreen() {
  const [activeTab, setActiveTab] = useState('Recipes');

  const { recipes, languagePods, familyTrees } = useAdvancedFeatures();
  const allRecipes = [...recipes, ...MOCK_RECIPES];
  const allPods = [...languagePods, ...MOCK_PODS];
  const allTrees = [...familyTrees, ...MOCK_TREES];

  const getDayName = (day: number) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[day];
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Heritage Hub',
          headerStyle: { backgroundColor: '#FAF7F2' },
          headerTintColor: '#1B4D3E',
        }}
      />

      {/* Hero Banner */}
      <View style={styles.heroBanner}>
        <View style={styles.heroRow}>
          <BookOpen size={24} color="white" />
          <Text style={styles.heroTitle}>Preserve Your Heritage</Text>
        </View>
        <Text style={styles.heroSubtitle}>
          Share recipes, learn languages, and build your family tree.
        </Text>
      </View>

      {/* Translator Button */}
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          router.push('/translator');
        }}
        style={styles.translatorButton}
      >
        <View style={styles.translatorIcon}>
          <Languages size={24} color="white" />
        </View>
        <View style={styles.translatorText}>
          <Text style={styles.translatorTitle}>Global Translator</Text>
          <Text style={styles.translatorSubtitle}>Speak or type to translate</Text>
        </View>
        <ChevronRight size={24} color="white" />
      </Pressable>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        {TABS.map((tab) => (
          <Pressable
            key={tab}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setActiveTab(tab);
            }}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab}
            </Text>
          </Pressable>
        ))}
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Recipes Tab */}
        {activeTab === 'Recipes' && (
          <View style={styles.content}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <ChefHat size={20} color="#1B4D3E" />
                <Text style={styles.sectionTitle}>Traditional Recipes</Text>
              </View>
              <Pressable
                onPress={() => router.push('/add-recipe')}
                style={styles.addButton}
              >
                <Text style={styles.addButtonText}>Add Recipe</Text>
              </Pressable>
            </View>

            {allRecipes.map((recipe) => (
              <Pressable
                key={recipe.id}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push(`/recipe-detail?id=${recipe.id}`);
                }}
                style={styles.recipeCard}
              >
                {recipe.images[0] && (
                  <Image source={{ uri: recipe.images[0] }} style={styles.recipeImage} />
                )}
                <View style={styles.recipeContent}>
                  <View style={styles.recipeOriginRow}>
                    <Globe size={14} color="#6B7280" />
                    <Text style={styles.recipeOrigin}>{recipe.origin}</Text>
                  </View>
                  <Text style={styles.recipeTitle}>{recipe.title}</Text>
                  <Text style={styles.recipeDescription} numberOfLines={2}>{recipe.description}</Text>
                  <View style={styles.recipeFooter}>
                    <View style={styles.recipeTimeRow}>
                      <Clock size={14} color="#6B7280" />
                      <Text style={styles.recipeTime}>{recipe.prepTime + recipe.cookTime} min</Text>
                    </View>
                    <View style={styles.recipeLikesRow}>
                      <Heart size={14} color="#EF4444" />
                      <Text style={styles.recipeLikes}>{recipe.likes}</Text>
                    </View>
                  </View>
                </View>
              </Pressable>
            ))}
          </View>
        )}

        {/* Languages Tab */}
        {activeTab === 'Languages' && (
          <View style={styles.content}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <Globe size={20} color="#1B4D3E" />
                <Text style={styles.sectionTitle}>Language Pods</Text>
              </View>
              <Pressable
                onPress={() => router.push('/create-language-pod')}
                style={styles.addButton}
              >
                <Text style={styles.addButtonText}>Host Pod</Text>
              </Pressable>
            </View>

            {allPods.map((pod) => (
              <Pressable
                key={pod.id}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push(`/language-pod?id=${pod.id}`);
                }}
                style={styles.podCard}
              >
                <View style={styles.podHeader}>
                  <Image source={{ uri: pod.hostAvatar }} style={styles.podAvatar} />
                  <View style={styles.podInfo}>
                    <Text style={styles.podLanguage}>{pod.language}</Text>
                    <Text style={styles.podTitle}>{pod.title}</Text>
                    <Text style={styles.podHost}>Host: {pod.hostName}</Text>
                  </View>
                  <View style={[styles.levelBadge, pod.level === 'beginner' ? styles.levelBeginner : styles.levelIntermediate]}>
                    <Text style={[styles.levelText, pod.level === 'beginner' ? styles.levelTextBeginner : styles.levelTextIntermediate]}>
                      {pod.level}
                    </Text>
                  </View>
                </View>
                <Text style={styles.podDescription} numberOfLines={2}>{pod.description}</Text>
                <View style={styles.podSchedule}>
                  <Clock size={16} color="#D4673A" />
                  <Text style={styles.podScheduleText}>
                    {pod.schedule[0] && `${getDayName(pod.schedule[0].dayOfWeek)}s at ${pod.schedule[0].time}`}
                  </Text>
                </View>
                <View style={styles.podFooter}>
                  <View style={styles.podMembersRow}>
                    <Users size={14} color="#6B7280" />
                    <Text style={styles.podMembers}>
                      {pod.participants.length}/{pod.maxParticipants} members
                    </Text>
                  </View>
                  <View style={[styles.statusBadge, pod.status === 'open' ? styles.statusOpen : styles.statusFull]}>
                    <Text style={[styles.statusText, pod.status === 'open' ? styles.statusTextOpen : styles.statusTextFull]}>
                      {pod.status === 'open' ? 'Join Now' : 'Full'}
                    </Text>
                  </View>
                </View>
              </Pressable>
            ))}
          </View>
        )}

        {/* Family Trees Tab */}
        {activeTab === 'Family Trees' && (
          <View style={styles.content}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <TreePine size={20} color="#1B4D3E" />
                <Text style={styles.sectionTitle}>Family Trees</Text>
              </View>
              <Pressable
                onPress={() => router.push('/create-family-tree')}
                style={styles.addButton}
              >
                <Text style={styles.addButtonText}>Create Tree</Text>
              </Pressable>
            </View>

            <View style={styles.infoCard}>
              <Text style={styles.infoTitle}>Preserve Your Legacy</Text>
              <Text style={styles.infoText}>
                Create a family tree to document your ancestry and connect with relatives.
              </Text>
            </View>

            {allTrees.length === 0 ? (
              <View style={styles.emptyState}>
                <TreePine size={48} color="#D4673A" />
                <Text style={styles.emptyTitle}>Start Your Family Tree</Text>
                <Text style={styles.emptyText}>
                  Document your family history and connect generations
                </Text>
                <Pressable
                  onPress={() => router.push('/create-family-tree')}
                  style={styles.emptyButton}
                >
                  <Text style={styles.emptyButtonText}>Get Started</Text>
                </Pressable>
              </View>
            ) : (
              allTrees.map((tree) => (
                <Pressable
                  key={tree.id}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    router.push(`/family-tree?id=${tree.id}`);
                  }}
                  style={styles.treeCard}
                >
                  <View style={styles.treeHeader}>
                    <View style={styles.treeIcon}>
                      <TreePine size={28} color="#1B4D3E" />
                    </View>
                    <View style={styles.treeInfo}>
                      <Text style={styles.treeName}>{tree.name}</Text>
                      <Text style={styles.treeMembers}>{tree.members.length} members</Text>
                    </View>
                    <ChevronRight size={20} color="#9CA3AF" />
                  </View>
                  <Text style={styles.treeDescription}>{tree.description}</Text>
                </Pressable>
              ))
            )}
          </View>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF7F2',
  },
  heroBanner: {
    marginHorizontal: 16,
    marginTop: 8,
    backgroundColor: '#065f46',
    borderRadius: 16,
    padding: 16,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroTitle: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
    marginLeft: 8,
  },
  heroSubtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    marginTop: 8,
  },
  translatorButton: {
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: '#F59E0B',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  translatorIcon: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 8,
    borderRadius: 20,
  },
  translatorText: {
    flex: 1,
    marginLeft: 12,
  },
  translatorTitle: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
  },
  translatorSubtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  tabText: {
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 14,
    color: '#6B7280',
  },
  tabTextActive: {
    color: '#111827',
  },
  scrollView: {
    flex: 1,
    marginTop: 16,
  },
  content: {
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginLeft: 8,
  },
  addButton: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  addButtonText: {
    color: '#B45309',
    fontWeight: '500',
    fontSize: 14,
  },
  recipeCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  recipeImage: {
    width: '100%',
    height: 192,
  },
  recipeContent: {
    padding: 16,
  },
  recipeOriginRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  recipeOrigin: {
    color: '#6B7280',
    fontSize: 14,
    marginLeft: 4,
  },
  recipeTitle: {
    color: '#111827',
    fontWeight: 'bold',
    fontSize: 18,
  },
  recipeDescription: {
    color: '#4B5563',
    fontSize: 14,
    marginTop: 4,
  },
  recipeFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  recipeTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recipeTime: {
    color: '#6B7280',
    fontSize: 14,
    marginLeft: 4,
  },
  recipeLikesRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recipeLikes: {
    color: '#6B7280',
    fontSize: 14,
    marginLeft: 4,
  },
  podCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  podHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  podAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  podInfo: {
    flex: 1,
    marginLeft: 12,
  },
  podLanguage: {
    color: '#047857',
    fontWeight: 'bold',
    fontSize: 18,
  },
  podTitle: {
    color: '#111827',
    fontWeight: '600',
  },
  podHost: {
    color: '#6B7280',
    fontSize: 14,
  },
  levelBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
  },
  levelBeginner: {
    backgroundColor: '#D1FAE5',
  },
  levelIntermediate: {
    backgroundColor: '#FEF3C7',
  },
  levelText: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  levelTextBeginner: {
    color: '#047857',
  },
  levelTextIntermediate: {
    color: '#B45309',
  },
  podDescription: {
    color: '#4B5563',
    fontSize: 14,
    marginTop: 12,
  },
  podSchedule: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
  },
  podScheduleText: {
    color: '#374151',
    marginLeft: 8,
  },
  podFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  podMembersRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  podMembers: {
    color: '#6B7280',
    fontSize: 14,
    marginLeft: 4,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusOpen: {
    backgroundColor: '#D1FAE5',
  },
  statusFull: {
    backgroundColor: '#FEE2E2',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
  },
  statusTextOpen: {
    color: '#047857',
  },
  statusTextFull: {
    color: '#DC2626',
  },
  infoCard: {
    backgroundColor: '#D1FAE5',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  infoTitle: {
    color: '#065F46',
    fontWeight: '600',
  },
  infoText: {
    color: '#047857',
    fontSize: 14,
    marginTop: 4,
  },
  emptyState: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
  },
  emptyTitle: {
    color: '#111827',
    fontWeight: '600',
    fontSize: 18,
    marginTop: 16,
  },
  emptyText: {
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
  },
  emptyButton: {
    backgroundColor: '#065F46',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
    marginTop: 16,
  },
  emptyButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  treeCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  treeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  treeIcon: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  treeInfo: {
    flex: 1,
    marginLeft: 12,
  },
  treeName: {
    color: '#111827',
    fontWeight: 'bold',
    fontSize: 18,
  },
  treeMembers: {
    color: '#6B7280',
    fontSize: 14,
  },
  treeDescription: {
    color: '#4B5563',
    fontSize: 14,
    marginTop: 12,
  },
});
