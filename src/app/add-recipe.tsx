import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowLeft,
  Camera,
  Plus,
  Minus,
  Clock,
  Users,
  ChefHat,
  Utensils,
  Check,
  X,
  Image as ImageIcon,
} from 'lucide-react-native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useStore } from '@/lib/store';

interface Ingredient {
  id: string;
  name: string;
  amount: string;
}

export default function AddRecipeScreen() {
  const currentUser = useStore((s) => s.currentUser);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [prepTime, setPrepTime] = useState('');
  const [servings, setServings] = useState('4');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [ingredients, setIngredients] = useState<Ingredient[]>([
    { id: '1', name: '', amount: '' },
  ]);
  const [instructions, setInstructions] = useState('');
  const [story, setStory] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  const addIngredient = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIngredients([...ingredients, { id: Date.now().toString(), name: '', amount: '' }]);
  };

  const removeIngredient = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (ingredients.length > 1) {
      setIngredients(ingredients.filter((i) => i.id !== id));
    }
  };

  const updateIngredient = (id: string, field: 'name' | 'amount', value: string) => {
    setIngredients(
      ingredients.map((i) => (i.id === id ? { ...i, [field]: value } : i))
    );
  };

  const handleSubmit = () => {
    if (!title.trim() || !instructions.trim()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setShowSuccess(true);

    setTimeout(() => {
      router.back();
    }, 2000);
  };

  if (showSuccess) {
    return (
      <View className="flex-1 bg-cream items-center justify-center px-5">
        <Animated.View entering={FadeIn.duration(400)} className="items-center">
          <LinearGradient
            colors={['#F59E0B', '#D97706']}
            style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Check size={40} color="#FFFFFF" />
          </LinearGradient>
          <Text className="text-warmBrown text-2xl font-bold mt-6">
            Recipe Added!
          </Text>
          <Text className="text-gray-500 text-center mt-2">
            Your recipe is now part of our community's heritage.
          </Text>
        </Animated.View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-cream">
      <SafeAreaView edges={['top']} className="flex-1">
        {/* Header */}
        <Animated.View
          entering={FadeIn.duration(300)}
          className="flex-row items-center px-5 pt-4 pb-4 border-b border-gray-100"
        >
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.back();
            }}
            className="mr-4 p-1"
            hitSlop={8}
          >
            <ArrowLeft size={24} color="#2D1F1A" />
          </Pressable>
          <Text className="text-xl font-bold text-warmBrown">Add Recipe</Text>
        </Animated.View>

        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Photo Upload */}
          <Animated.View entering={FadeInUp.duration(400).delay(100)} className="px-5 pt-5">
            <Pressable
              onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
              className="bg-amber-50 border-2 border-dashed border-amber-300 rounded-2xl p-8 items-center"
            >
              <View className="w-16 h-16 rounded-full bg-amber-100 items-center justify-center mb-3">
                <Camera size={28} color="#D97706" />
              </View>
              <Text className="text-amber-700 font-semibold text-lg">Add Recipe Photo</Text>
              <Text className="text-amber-600/70 text-sm mt-1">
                Show off your delicious dish
              </Text>
            </Pressable>
          </Animated.View>

          {/* Basic Info */}
          <Animated.View entering={FadeInUp.duration(400).delay(200)} className="px-5 mt-6">
            <Text className="text-lg font-bold text-warmBrown mb-4">Recipe Details</Text>

            <View className="bg-white rounded-xl p-4 mb-4">
              <Text className="text-gray-500 text-sm mb-2">Recipe Name *</Text>
              <TextInput
                placeholder="E.g., Grandma's Jollof Rice"
                placeholderTextColor="#9CA3AF"
                value={title}
                onChangeText={setTitle}
                className="text-warmBrown text-base"
              />
            </View>

            <View className="bg-white rounded-xl p-4 mb-4">
              <Text className="text-gray-500 text-sm mb-2">Description</Text>
              <TextInput
                placeholder="A brief description of this dish..."
                placeholderTextColor="#9CA3AF"
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
                className="text-warmBrown text-base"
                style={{ minHeight: 80, textAlignVertical: 'top' }}
              />
            </View>

            {/* Quick Stats */}
            <View className="flex-row gap-3">
              <View className="flex-1 bg-white rounded-xl p-4">
                <View className="flex-row items-center mb-2">
                  <Clock size={16} color="#6B7280" />
                  <Text className="text-gray-500 text-sm ml-2">Prep Time</Text>
                </View>
                <TextInput
                  placeholder="30 mins"
                  placeholderTextColor="#9CA3AF"
                  value={prepTime}
                  onChangeText={setPrepTime}
                  className="text-warmBrown text-base"
                />
              </View>

              <View className="flex-1 bg-white rounded-xl p-4">
                <View className="flex-row items-center mb-2">
                  <Users size={16} color="#6B7280" />
                  <Text className="text-gray-500 text-sm ml-2">Servings</Text>
                </View>
                <TextInput
                  placeholder="4"
                  placeholderTextColor="#9CA3AF"
                  value={servings}
                  onChangeText={setServings}
                  keyboardType="number-pad"
                  className="text-warmBrown text-base"
                />
              </View>
            </View>

            {/* Difficulty */}
            <View className="mt-4">
              <Text className="text-gray-500 text-sm mb-3">Difficulty</Text>
              <View className="flex-row gap-3">
                {(['easy', 'medium', 'hard'] as const).map((level) => (
                  <Pressable
                    key={level}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setDifficulty(level);
                    }}
                    className={`flex-1 py-3 rounded-xl items-center ${
                      difficulty === level ? 'bg-amber-500' : 'bg-white'
                    }`}
                  >
                    <Text
                      className={`font-medium capitalize ${
                        difficulty === level ? 'text-white' : 'text-gray-600'
                      }`}
                    >
                      {level}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </Animated.View>

          {/* Ingredients */}
          <Animated.View entering={FadeInUp.duration(400).delay(300)} className="px-5 mt-6">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-lg font-bold text-warmBrown">Ingredients</Text>
              <Pressable
                onPress={addIngredient}
                className="bg-amber-100 rounded-full px-4 py-2 flex-row items-center"
              >
                <Plus size={16} color="#D97706" />
                <Text className="text-amber-700 font-medium ml-1">Add</Text>
              </Pressable>
            </View>

            {ingredients.map((ingredient, index) => (
              <View key={ingredient.id} className="flex-row items-center gap-3 mb-3">
                <View className="flex-1 bg-white rounded-xl p-3">
                  <TextInput
                    placeholder="Ingredient name"
                    placeholderTextColor="#9CA3AF"
                    value={ingredient.name}
                    onChangeText={(text) => updateIngredient(ingredient.id, 'name', text)}
                    className="text-warmBrown text-base"
                  />
                </View>
                <View className="w-24 bg-white rounded-xl p-3">
                  <TextInput
                    placeholder="Amount"
                    placeholderTextColor="#9CA3AF"
                    value={ingredient.amount}
                    onChangeText={(text) => updateIngredient(ingredient.id, 'amount', text)}
                    className="text-warmBrown text-base text-center"
                  />
                </View>
                {ingredients.length > 1 && (
                  <Pressable
                    onPress={() => removeIngredient(ingredient.id)}
                    className="w-10 h-10 rounded-full bg-red-100 items-center justify-center"
                  >
                    <Minus size={18} color="#EF4444" />
                  </Pressable>
                )}
              </View>
            ))}
          </Animated.View>

          {/* Instructions */}
          <Animated.View entering={FadeInUp.duration(400).delay(400)} className="px-5 mt-6">
            <Text className="text-lg font-bold text-warmBrown mb-4">Instructions *</Text>
            <View className="bg-white rounded-xl p-4">
              <TextInput
                placeholder="Write the cooking instructions step by step..."
                placeholderTextColor="#9CA3AF"
                value={instructions}
                onChangeText={setInstructions}
                multiline
                numberOfLines={8}
                className="text-warmBrown text-base leading-6"
                style={{ minHeight: 150, textAlignVertical: 'top' }}
              />
            </View>
          </Animated.View>

          {/* Story Behind */}
          <Animated.View entering={FadeInUp.duration(400).delay(500)} className="px-5 mt-6">
            <Text className="text-lg font-bold text-warmBrown mb-2">The Story Behind</Text>
            <Text className="text-gray-500 text-sm mb-4">
              Share the history or memory connected to this recipe (optional)
            </Text>
            <View className="bg-white rounded-xl p-4">
              <TextInput
                placeholder="E.g., My grandmother taught me this recipe when I was 12..."
                placeholderTextColor="#9CA3AF"
                value={story}
                onChangeText={setStory}
                multiline
                numberOfLines={4}
                className="text-warmBrown text-base leading-6"
                style={{ minHeight: 100, textAlignVertical: 'top' }}
              />
            </View>
          </Animated.View>

          {/* Submit Button */}
          <Animated.View entering={FadeInUp.duration(400).delay(600)} className="px-5 mt-8">
            <Pressable
              onPress={handleSubmit}
              disabled={!title.trim() || !instructions.trim()}
              style={{ opacity: title.trim() && instructions.trim() ? 1 : 0.5 }}
            >
              <LinearGradient
                colors={['#F59E0B', '#D97706']}
                style={{ borderRadius: 16, paddingVertical: 16, alignItems: 'center' }}
              >
                <View className="flex-row items-center">
                  <Utensils size={20} color="#FFFFFF" />
                  <Text className="text-white font-bold text-lg ml-2">
                    Save Recipe
                  </Text>
                </View>
              </LinearGradient>
            </Pressable>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
