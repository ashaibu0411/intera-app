import { View, Text, ScrollView, Pressable, Image } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { Globe, Heart, Clock, Star, Users } from 'lucide-react-native';

interface TraditionalRecipe {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  title: string;
  description: string;
  origin: string;
  region: string;
  category: string;
  ingredients: { item: string; amount: string; notes?: string }[];
  instructions: { step: number; text: string }[];
  prepTime: number;
  cookTime: number;
  servings: number;
  difficulty: string;
  tips: string[];
  story?: string;
  images: string[];
  likes: number;
  saves: number;
  reviews: unknown[];
  createdAt: string;
}

const MOCK_RECIPES: Record<string, TraditionalRecipe> = {
  '1': {
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
  '2': {
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
};

export default function RecipeDetailScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const recipe = id ? MOCK_RECIPES[id] : null;

  if (!recipe) {
    return (
      <View style={{ flex: 1, backgroundColor: '#FAF7F2' }}>
        <Stack.Screen options={{ headerShown: true, title: 'Recipe', headerStyle: { backgroundColor: '#FAF7F2' }, headerTintColor: '#1B4D3E' }} />
        <View className="flex-1 items-center justify-center">
          <Text className="text-gray-500">Recipe not found</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#FAF7F2' }}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Recipe',
          headerStyle: { backgroundColor: '#FAF7F2' },
          headerTintColor: '#1B4D3E',
          headerRight: () => (
            <Pressable className="bg-red-100 p-2 rounded-full">
              <Heart size={20} color="#EF4444" />
            </Pressable>
          ),
        }}
      />

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

        <View className="h-8" />
      </ScrollView>
    </View>
  );
}
