import { useState } from 'react';
import { View, Text, ScrollView, Pressable, Image, Modal } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { BookOpen, Users, Globe, ChefHat, Heart, X, ChevronRight, Star, Clock, TreePine, Languages, ChevronLeft } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
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
    description: 'The classic West African one-pot rice dish that brings families together. My grandmother\'s secret recipe passed down through generations.',
    origin: 'Nigeria',
    region: 'West Africa',
    category: 'main',
    ingredients: [
      { item: 'Long grain rice', amount: '2 cups' },
      { item: 'Tomato paste', amount: '3 tbsp' },
      { item: 'Fresh tomatoes', amount: '4 large', notes: 'blended' },
      { item: 'Onions', amount: '2 large' },
      { item: 'Chicken stock', amount: '3 cups' },
    ],
    instructions: [
      { step: 1, text: 'Blend tomatoes, peppers, and one onion until smooth' },
      { step: 2, text: 'Fry the remaining onion in oil until golden' },
      { step: 3, text: 'Add tomato paste and fry for 5 minutes' },
      { step: 4, text: 'Pour in blended tomato mixture and cook for 20 minutes' },
      { step: 5, text: 'Add washed rice and chicken stock, cover and simmer' },
    ],
    prepTime: 20,
    cookTime: 45,
    servings: 6,
    difficulty: 'medium',
    tips: ['Use parboiled rice for best results', 'The bottom crust (party jollof) is the best part!'],
    story: 'This recipe has been in my family for four generations. My grandmother taught my mother, who taught me.',
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
    description: 'Traditional Ethiopian sourdough flatbread served with spicy chicken stew. A feast for the senses.',
    origin: 'Ethiopia',
    region: 'East Africa',
    category: 'main',
    ingredients: [
      { item: 'Teff flour', amount: '2 cups' },
      { item: 'Chicken', amount: '2 lbs' },
      { item: 'Berbere spice', amount: '3 tbsp' },
      { item: 'Onions', amount: '4 large' },
    ],
    instructions: [
      { step: 1, text: 'Make injera batter 3 days ahead and let ferment' },
      { step: 2, text: 'Slowly cook onions until caramelized (45 min)' },
      { step: 3, text: 'Add berbere and cook until fragrant' },
      { step: 4, text: 'Add chicken and simmer until tender' },
    ],
    prepTime: 30,
    cookTime: 90,
    servings: 4,
    difficulty: 'hard',
    tips: ['Patience with onions is key', 'Injera needs 3 days to ferment properly'],
    story: 'Doro Wat is traditionally served on holidays and special occasions in Ethiopian culture.',
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
    description: 'Perfect for those wanting to connect with their Nigerian Igbo heritage. We focus on practical phrases and cultural context.',
    maxParticipants: 12,
    participants: [
      { userId: '2', userName: 'James K.', userAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100', level: 'beginner', joinedAt: '2024-10-01', lessonsAttended: 8 },
      { userId: '3', userName: 'Sarah M.', userAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100', level: 'beginner', joinedAt: '2024-10-15', lessonsAttended: 5 },
    ],
    schedule: [{ dayOfWeek: 6, time: '10:00', duration: 60 }],
    isOnline: true,
    meetingLink: 'https://zoom.us/j/example',
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
    description: 'For those with basic Wolof who want to improve their speaking skills. We discuss everyday topics in Wolof.',
    maxParticipants: 8,
    participants: [
      { userId: '4', userName: 'Fatou S.', userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100', level: 'intermediate', joinedAt: '2024-11-01', lessonsAttended: 12 },
    ],
    schedule: [{ dayOfWeek: 0, time: '14:00', duration: 90 }],
    isOnline: true,
    lessons: [],
    status: 'open',
    createdAt: '2024-08-15',
  },
  {
    id: '3',
    hostId: '3',
    hostName: 'Amira Hassan',
    hostAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100',
    language: 'Swahili',
    level: 'beginner',
    title: 'Swahili for Beginners',
    description: 'Learn the beautiful language spoken across East Africa. Great for connecting with Kenyan, Tanzanian, and Ugandan communities.',
    maxParticipants: 15,
    participants: [],
    schedule: [{ dayOfWeek: 3, time: '19:00', duration: 60 }],
    isOnline: true,
    lessons: [],
    status: 'open',
    createdAt: '2024-12-01',
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
  const [selectedRecipe, setSelectedRecipe] = useState<TraditionalRecipe | null>(null);
  const insets = useSafeAreaInsets();

  const { recipes, languagePods, familyTrees } = useAdvancedFeatures();
  const allRecipes = [...recipes, ...MOCK_RECIPES];
  const allPods = [...languagePods, ...MOCK_PODS];
  const allTrees = [...familyTrees, ...MOCK_TREES];

  const getDifficultyColor = (diff: string) => {
    switch (diff) {
      case 'easy': return { bg: 'bg-green-100', text: 'text-green-700' };
      case 'medium': return { bg: 'bg-amber-100', text: 'text-amber-700' };
      case 'hard': return { bg: 'bg-red-100', text: 'text-red-700' };
      default: return { bg: 'bg-gray-100', text: 'text-gray-700' };
    }
  };

  const getDayName = (day: number) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[day];
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#FAF7F2', paddingTop: insets.top }}>
      {/* Custom Header */}
      <View className="flex-row items-center justify-between px-4 py-3 bg-white border-b border-gray-100">
        <Pressable onPress={() => router.back()} className="p-2 -ml-2">
          <ChevronLeft size={24} color="#1B4D3E" />
        </Pressable>
        <Text className="text-lg font-bold text-gray-900">Heritage Hub</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Hero Banner */}
      <Animated.View entering={FadeInDown.delay(100)} style={{ marginHorizontal: 16, marginTop: 8, backgroundColor: '#065f46', borderRadius: 16, padding: 16 }}>
        <View className="flex-row items-center">
          <BookOpen size={24} color="white" />
          <Text className="text-white font-bold text-lg ml-2">Preserve Your Heritage</Text>
        </View>
        <Text className="text-white/80 text-sm mt-2">
          Share recipes, learn languages, and build your family tree with the community.
        </Text>
      </Animated.View>

      {/* Global Translator Button */}
      <Animated.View entering={FadeInDown.delay(150)} style={{ marginHorizontal: 16, marginTop: 12 }}>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            router.push('/translator');
          }}
          className="bg-gradient-to-r from-amber-500 to-orange-500 bg-amber-500 rounded-xl p-4 flex-row items-center"
        >
          <View className="bg-white/20 p-2 rounded-full">
            <Languages size={24} color="white" />
          </View>
          <View className="flex-1 ml-3">
            <Text className="text-white font-bold text-lg">Global Translator</Text>
            <Text className="text-white/80 text-sm">Speak or type to translate instantly</Text>
          </View>
          <ChevronRight size={24} color="white" />
        </Pressable>
      </Animated.View>

      {/* Tabs */}
      <View className="flex-row mx-4 mt-4 bg-gray-100 rounded-xl p-1">
        {TABS.map((tab) => (
          <Pressable
            key={tab}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setActiveTab(tab);
            }}
            className={`flex-1 py-2.5 rounded-lg ${activeTab === tab ? 'bg-white shadow-sm' : ''}`}
          >
            <Text className={`text-center font-semibold text-sm ${activeTab === tab ? 'text-gray-900' : 'text-gray-500'}`}>
              {tab}
            </Text>
          </Pressable>
        ))}
      </View>

      <ScrollView className="flex-1 mt-4" showsVerticalScrollIndicator={false}>
        {/* Recipes Tab */}
        {activeTab === 'Recipes' && (
          <View className="px-4">
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center">
                <ChefHat size={20} color="#1B4D3E" />
                <Text className="text-lg font-bold text-gray-900 ml-2">Traditional Recipes</Text>
              </View>
              <Pressable
                onPress={() => router.push('/add-recipe')}
                className="bg-amber-100 px-3 py-1.5 rounded-full"
              >
                <Text className="text-amber-700 font-medium text-sm">Add Recipe</Text>
              </Pressable>
            </View>

            {allRecipes.map((recipe, index) => {
              const diffColors = getDifficultyColor(recipe.difficulty);
              return (
                <Animated.View key={recipe.id} entering={FadeInDown.delay(index * 100)}>
                  <Pressable
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setSelectedRecipe(recipe);
                    }}
                    className="bg-white rounded-2xl overflow-hidden mb-4 shadow-sm"
                  >
                    {recipe.images[0] && (
                      <Image source={{ uri: recipe.images[0] }} className="w-full h-48" />
                    )}
                    <View className="p-4">
                      <View className="flex-row items-center justify-between mb-2">
                        <View className="flex-row items-center">
                          <Globe size={14} color="#6B7280" />
                          <Text className="text-gray-500 text-sm ml-1">{recipe.origin}</Text>
                        </View>
                        <View className={`px-2 py-1 rounded-full ${diffColors.bg}`}>
                          <Text className={`text-xs font-medium capitalize ${diffColors.text}`}>
                            {recipe.difficulty}
                          </Text>
                        </View>
                      </View>

                      <Text className="text-gray-900 font-bold text-lg">{recipe.title}</Text>
                      <Text className="text-gray-600 text-sm mt-1" numberOfLines={2}>{recipe.description}</Text>

                      <View className="flex-row items-center mt-3">
                        <Image source={{ uri: recipe.authorAvatar }} className="w-6 h-6 rounded-full" />
                        <Text className="text-gray-500 text-sm ml-2">by {recipe.authorName}</Text>
                      </View>

                      <View className="flex-row items-center justify-between mt-3 pt-3 border-t border-gray-100">
                        <View className="flex-row items-center">
                          <Clock size={14} color="#6B7280" />
                          <Text className="text-gray-500 text-sm ml-1">
                            {recipe.prepTime + recipe.cookTime} min
                          </Text>
                        </View>
                        <View className="flex-row items-center">
                          <Heart size={14} color="#EF4444" fill="#EF4444" />
                          <Text className="text-gray-500 text-sm ml-1">{recipe.likes}</Text>
                        </View>
                      </View>
                    </View>
                  </Pressable>
                </Animated.View>
              );
            })}
          </View>
        )}

        {/* Languages Tab */}
        {activeTab === 'Languages' && (
          <View className="px-4">
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center">
                <Globe size={20} color="#1B4D3E" />
                <Text className="text-lg font-bold text-gray-900 ml-2">Language Pods</Text>
              </View>
              <Pressable
                onPress={() => router.push('/create-language-pod')}
                className="bg-amber-100 px-3 py-1.5 rounded-full"
              >
                <Text className="text-amber-700 font-medium text-sm">Host Pod</Text>
              </Pressable>
            </View>

            {allPods.map((pod, index) => (
              <Animated.View key={pod.id} entering={FadeInDown.delay(index * 100)}>
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    router.push(`/language-pod?id=${pod.id}`);
                  }}
                  className="bg-white rounded-2xl p-4 mb-3 shadow-sm"
                >
                  <View className="flex-row items-start">
                    <Image source={{ uri: pod.hostAvatar }} className="w-12 h-12 rounded-full" />
                    <View className="flex-1 ml-3">
                      <View className="flex-row items-center">
                        <Text className="text-emerald-700 font-bold text-lg">{pod.language}</Text>
                        {pod.dialect && (
                          <Text className="text-gray-400 text-sm ml-2">({pod.dialect})</Text>
                        )}
                      </View>
                      <Text className="text-gray-900 font-semibold">{pod.title}</Text>
                      <Text className="text-gray-500 text-sm">Host: {pod.hostName}</Text>
                    </View>
                    <View className={`px-2 py-1 rounded-full ${pod.level === 'beginner' ? 'bg-green-100' : pod.level === 'intermediate' ? 'bg-amber-100' : 'bg-red-100'}`}>
                      <Text className={`text-xs font-medium capitalize ${pod.level === 'beginner' ? 'text-green-700' : pod.level === 'intermediate' ? 'text-amber-700' : 'text-red-700'}`}>
                        {pod.level}
                      </Text>
                    </View>
                  </View>

                  <Text className="text-gray-600 text-sm mt-3" numberOfLines={2}>{pod.description}</Text>

                  <View className="flex-row items-center mt-3 bg-gray-50 rounded-xl p-3">
                    <Clock size={16} color="#D4673A" />
                    <Text className="text-gray-700 ml-2">
                      {pod.schedule[0] && `${getDayName(pod.schedule[0].dayOfWeek)}s at ${pod.schedule[0].time}`}
                    </Text>
                  </View>

                  <View className="flex-row items-center justify-between mt-3 pt-3 border-t border-gray-100">
                    <View className="flex-row items-center">
                      <Users size={14} color="#6B7280" />
                      <Text className="text-gray-500 text-sm ml-1">
                        {pod.participants.length}/{pod.maxParticipants} members
                      </Text>
                    </View>
                    <View className={`px-3 py-1 rounded-full ${pod.status === 'open' ? 'bg-green-100' : 'bg-red-100'}`}>
                      <Text className={`text-sm font-medium ${pod.status === 'open' ? 'text-green-700' : 'text-red-700'}`}>
                        {pod.status === 'open' ? 'Join Now' : 'Full'}
                      </Text>
                    </View>
                  </View>
                </Pressable>
              </Animated.View>
            ))}
          </View>
        )}

        {/* Family Trees Tab */}
        {activeTab === 'Family Trees' && (
          <View className="px-4">
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center">
                <TreePine size={20} color="#1B4D3E" />
                <Text className="text-lg font-bold text-gray-900 ml-2">Family Trees</Text>
              </View>
              <Pressable
                onPress={() => router.push('/create-family-tree')}
                className="bg-amber-100 px-3 py-1.5 rounded-full"
              >
                <Text className="text-amber-700 font-medium text-sm">Create Tree</Text>
              </Pressable>
            </View>

            {/* Info Card */}
            <View className="bg-emerald-50 rounded-2xl p-4 mb-4">
              <Text className="text-emerald-800 font-semibold">Preserve Your Legacy</Text>
              <Text className="text-emerald-700 text-sm mt-1">
                Create a family tree to document your ancestry, share stories, and connect with relatives across the diaspora.
              </Text>
            </View>

            {allTrees.length === 0 ? (
              <View className="bg-white rounded-2xl p-8 items-center">
                <TreePine size={48} color="#D4673A" />
                <Text className="text-gray-900 font-semibold text-lg mt-4">Start Your Family Tree</Text>
                <Text className="text-gray-500 text-center mt-2">
                  Document your family history and connect generations
                </Text>
                <Pressable
                  onPress={() => router.push('/create-family-tree')}
                  className="bg-emerald-800 px-6 py-3 rounded-full mt-4"
                >
                  <Text className="text-white font-semibold">Get Started</Text>
                </Pressable>
              </View>
            ) : (
              allTrees.map((tree, index) => (
                <Animated.View key={tree.id} entering={FadeInDown.delay(index * 100)}>
                  <Pressable
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      router.push(`/family-tree?id=${tree.id}`);
                    }}
                    className="bg-white rounded-2xl p-4 mb-3 shadow-sm"
                  >
                    <View className="flex-row items-center">
                      <View className="w-14 h-14 rounded-xl bg-emerald-100 items-center justify-center">
                        <TreePine size={28} color="#1B4D3E" />
                      </View>
                      <View className="flex-1 ml-3">
                        <Text className="text-gray-900 font-bold text-lg">{tree.name}</Text>
                        <Text className="text-gray-500 text-sm">{tree.members.length} members</Text>
                      </View>
                      <ChevronRight size={20} color="#9CA3AF" />
                    </View>
                    <Text className="text-gray-600 text-sm mt-3">{tree.description}</Text>
                  </Pressable>
                </Animated.View>
              ))
            )}
          </View>
        )}

        <View className="h-8" />
      </ScrollView>

      {/* Recipe Detail Modal */}
      {selectedRecipe && (
        <Modal visible={true} animationType="slide" presentationStyle="pageSheet">
          <RecipeDetailModal recipe={selectedRecipe} onClose={() => setSelectedRecipe(null)} />
        </Modal>
      )}
    </View>
  );
}

function RecipeDetailModal({ recipe, onClose }: { recipe: TraditionalRecipe; onClose: () => void }) {
  return (
    <View style={{ flex: 1, backgroundColor: '#FAF7F2' }}>
      <SafeAreaView style={{ backgroundColor: '#FFFFFF' }} edges={['top']}>
        <View className="flex-row items-center justify-between p-4 bg-white border-b border-gray-100">
          <Pressable onPress={onClose}>
            <X size={24} color="#6B7280" />
          </Pressable>
          <Text className="text-lg font-bold text-gray-900">Recipe</Text>
          <Pressable className="bg-red-100 p-2 rounded-full">
            <Heart size={20} color="#EF4444" />
          </Pressable>
        </View>
      </SafeAreaView>

      <ScrollView className="flex-1">
        {recipe.images[0] && (
          <Image source={{ uri: recipe.images[0] }} className="w-full h-64" />
        )}

        <View className="p-4">
          <View className="flex-row items-center mb-2">
            <Globe size={14} color="#6B7280" />
            <Text className="text-gray-500 text-sm ml-1">{recipe.origin} • {recipe.region}</Text>
          </View>

          <Text className="text-gray-900 font-bold text-2xl">{recipe.title}</Text>
          <Text className="text-gray-600 mt-2">{recipe.description}</Text>

          {/* Author */}
          <View className="flex-row items-center mt-4 bg-gray-50 rounded-xl p-3">
            <Image source={{ uri: recipe.authorAvatar }} className="w-10 h-10 rounded-full" />
            <View className="ml-3">
              <Text className="text-gray-900 font-semibold">{recipe.authorName}</Text>
              <Text className="text-gray-500 text-sm">Recipe Keeper</Text>
            </View>
          </View>

          {/* Story */}
          {recipe.story && (
            <View className="mt-4 bg-amber-50 rounded-xl p-4">
              <Text className="text-amber-800 font-semibold mb-2">The Story</Text>
              <Text className="text-amber-700 italic">"{recipe.story}"</Text>
            </View>
          )}

          {/* Time & Servings */}
          <View className="flex-row mt-4 bg-white rounded-xl p-4">
            <View className="flex-1 items-center">
              <Text className="text-gray-500 text-sm">Prep</Text>
              <Text className="text-gray-900 font-bold">{recipe.prepTime} min</Text>
            </View>
            <View className="w-px bg-gray-200" />
            <View className="flex-1 items-center">
              <Text className="text-gray-500 text-sm">Cook</Text>
              <Text className="text-gray-900 font-bold">{recipe.cookTime} min</Text>
            </View>
            <View className="w-px bg-gray-200" />
            <View className="flex-1 items-center">
              <Text className="text-gray-500 text-sm">Serves</Text>
              <Text className="text-gray-900 font-bold">{recipe.servings}</Text>
            </View>
          </View>

          {/* Ingredients */}
          <View className="mt-6">
            <Text className="text-gray-900 font-bold text-lg mb-3">Ingredients</Text>
            {recipe.ingredients.map((ing, index) => (
              <View key={index} className="flex-row items-center py-2 border-b border-gray-100">
                <View className="w-2 h-2 rounded-full bg-emerald-500 mr-3" />
                <Text className="flex-1 text-gray-700">{ing.item}</Text>
                <Text className="text-gray-500">{ing.amount}</Text>
              </View>
            ))}
          </View>

          {/* Instructions */}
          <View className="mt-6">
            <Text className="text-gray-900 font-bold text-lg mb-3">Instructions</Text>
            {recipe.instructions.map((step) => (
              <View key={step.step} className="flex-row mb-4">
                <View className="w-8 h-8 rounded-full bg-emerald-800 items-center justify-center">
                  <Text className="text-white font-bold">{step.step}</Text>
                </View>
                <Text className="flex-1 text-gray-700 ml-3">{step.text}</Text>
              </View>
            ))}
          </View>

          {/* Tips */}
          {recipe.tips.length > 0 && (
            <View className="mt-6 bg-emerald-50 rounded-xl p-4">
              <Text className="text-emerald-800 font-bold mb-2">Pro Tips</Text>
              {recipe.tips.map((tip, index) => (
                <View key={index} className="flex-row items-start mt-2">
                  <Star size={14} color="#C9A227" fill="#C9A227" style={{ marginTop: 2 }} />
                  <Text className="text-emerald-700 ml-2 flex-1">{tip}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
