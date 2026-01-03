import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Image,
  TextInput,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  Search,
  Star,
  Clock,
  MapPin,
  ChefHat,
  Heart,
  Filter,
  ShoppingBag,
  Plus,
  Minus,
  X,
  Utensils,
  Flame,
  Leaf,
} from 'lucide-react-native';
import Animated, {
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useStore } from '../lib/store';

// Types
interface HomeCook {
  id: string;
  name: string;
  avatar: string;
  specialty: string;
  country: string;
  flag: string;
  rating: number;
  reviewCount: number;
  distance: string;
  deliveryTime: string;
  verified: boolean;
  featured: boolean;
}

interface Dish {
  id: string;
  cookId: string;
  name: string;
  description: string;
  price: number;
  image: string;
  country: string;
  flag: string;
  cookName: string;
  rating: number;
  spicy: boolean;
  vegetarian: boolean;
  prepTime: string;
  servings: string;
}

interface CartItem {
  dish: Dish;
  quantity: number;
}

// Cuisine filter options
const CUISINES = [
  { id: 'all', name: 'All', flag: '🌍' },
  { id: 'nigerian', name: 'Nigerian', flag: '🇳🇬' },
  { id: 'ethiopian', name: 'Ethiopian', flag: '🇪🇹' },
  { id: 'ghanaian', name: 'Ghanaian', flag: '🇬🇭' },
  { id: 'kenyan', name: 'Kenyan', flag: '🇰🇪' },
  { id: 'senegalese', name: 'Senegalese', flag: '🇸🇳' },
  { id: 'moroccan', name: 'Moroccan', flag: '🇲🇦' },
  { id: 'south-african', name: 'South African', flag: '🇿🇦' },
];

// Mock home cooks data
const HOME_COOKS: HomeCook[] = [
  {
    id: '1',
    name: 'Mama Adaeze',
    avatar: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=200&h=200&fit=crop',
    specialty: 'Nigerian Cuisine',
    country: 'Nigeria',
    flag: '🇳🇬',
    rating: 4.9,
    reviewCount: 234,
    distance: '2.3 mi',
    deliveryTime: '45-60 min',
    verified: true,
    featured: true,
  },
  {
    id: '2',
    name: 'Chef Abeba',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop',
    specialty: 'Ethiopian Cuisine',
    country: 'Ethiopia',
    flag: '🇪🇹',
    rating: 4.8,
    reviewCount: 189,
    distance: '3.1 mi',
    deliveryTime: '50-70 min',
    verified: true,
    featured: true,
  },
  {
    id: '3',
    name: 'Auntie Akosua',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&h=200&fit=crop',
    specialty: 'Ghanaian Cuisine',
    country: 'Ghana',
    flag: '🇬🇭',
    rating: 4.7,
    reviewCount: 156,
    distance: '1.8 mi',
    deliveryTime: '40-55 min',
    verified: true,
    featured: false,
  },
  {
    id: '4',
    name: 'Mama Wanjiku',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop',
    specialty: 'Kenyan Cuisine',
    country: 'Kenya',
    flag: '🇰🇪',
    rating: 4.6,
    reviewCount: 98,
    distance: '4.2 mi',
    deliveryTime: '55-75 min',
    verified: false,
    featured: false,
  },
];

// Mock dishes data
const DISHES: Dish[] = [
  {
    id: 'd1',
    cookId: '1',
    name: 'Jollof Rice with Chicken',
    description: 'The famous one-pot rice dish cooked in rich tomato sauce with perfectly grilled chicken',
    price: 18.99,
    image: 'https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=600&h=400&fit=crop',
    country: 'Nigeria',
    flag: '🇳🇬',
    cookName: 'Mama Adaeze',
    rating: 4.9,
    spicy: true,
    vegetarian: false,
    prepTime: '45 min',
    servings: '2-3',
  },
  {
    id: 'd2',
    cookId: '1',
    name: 'Egusi Soup with Pounded Yam',
    description: 'Melon seed soup with spinach, beef, and stockfish served with smooth pounded yam',
    price: 22.99,
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&h=400&fit=crop',
    country: 'Nigeria',
    flag: '🇳🇬',
    cookName: 'Mama Adaeze',
    rating: 4.8,
    spicy: false,
    vegetarian: false,
    prepTime: '60 min',
    servings: '2',
  },
  {
    id: 'd3',
    cookId: '2',
    name: 'Doro Wat with Injera',
    description: 'Spicy Ethiopian chicken stew slow-cooked in berbere spice, served with spongy injera bread',
    price: 24.99,
    image: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=600&h=400&fit=crop',
    country: 'Ethiopia',
    flag: '🇪🇹',
    cookName: 'Chef Abeba',
    rating: 4.9,
    spicy: true,
    vegetarian: false,
    prepTime: '90 min',
    servings: '2-3',
  },
  {
    id: 'd4',
    cookId: '2',
    name: 'Vegetarian Combo Platter',
    description: 'Selection of lentils, collard greens, split peas, and beets on fresh injera',
    price: 19.99,
    image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&h=400&fit=crop',
    country: 'Ethiopia',
    flag: '🇪🇹',
    cookName: 'Chef Abeba',
    rating: 4.7,
    spicy: false,
    vegetarian: true,
    prepTime: '60 min',
    servings: '2',
  },
  {
    id: 'd5',
    cookId: '3',
    name: 'Waakye with Shito',
    description: 'Rice and beans combo with spicy black pepper sauce, fried plantains, and boiled eggs',
    price: 16.99,
    image: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=600&h=400&fit=crop',
    country: 'Ghana',
    flag: '🇬🇭',
    cookName: 'Auntie Akosua',
    rating: 4.8,
    spicy: true,
    vegetarian: false,
    prepTime: '50 min',
    servings: '2',
  },
  {
    id: 'd6',
    cookId: '3',
    name: 'Banku with Tilapia',
    description: 'Fermented corn dough served with grilled tilapia and hot pepper sauce',
    price: 21.99,
    image: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=600&h=400&fit=crop',
    country: 'Ghana',
    flag: '🇬🇭',
    cookName: 'Auntie Akosua',
    rating: 4.6,
    spicy: true,
    vegetarian: false,
    prepTime: '55 min',
    servings: '1-2',
  },
  {
    id: 'd7',
    cookId: '4',
    name: 'Nyama Choma Platter',
    description: 'Traditional grilled meat with ugali, kachumbari salad, and sukuma wiki',
    price: 26.99,
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&h=400&fit=crop',
    country: 'Kenya',
    flag: '🇰🇪',
    cookName: 'Mama Wanjiku',
    rating: 4.7,
    spicy: false,
    vegetarian: false,
    prepTime: '70 min',
    servings: '2-3',
  },
  {
    id: 'd8',
    cookId: '4',
    name: 'Githeri Stew',
    description: 'Hearty maize and bean stew with vegetables, a Kenyan comfort food classic',
    price: 14.99,
    image: 'https://images.unsplash.com/photo-1547592180-85f173990554?w=600&h=400&fit=crop',
    country: 'Kenya',
    flag: '🇰🇪',
    cookName: 'Mama Wanjiku',
    rating: 4.5,
    spicy: false,
    vegetarian: true,
    prepTime: '45 min',
    servings: '2',
  },
];

export default function AfricanFoodScreen() {
  const router = useRouter();
  const currentCommunity = useStore((s) => s.currentCommunity);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCuisine, setSelectedCuisine] = useState('all');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [selectedDish, setSelectedDish] = useState<Dish | null>(null);
  const [showDishModal, setShowDishModal] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);

  // Filter dishes based on search and cuisine
  const filteredDishes = DISHES.filter((dish) => {
    const matchesSearch =
      dish.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dish.cookName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dish.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCuisine =
      selectedCuisine === 'all' ||
      dish.country.toLowerCase().includes(selectedCuisine.replace('-', ' '));

    return matchesSearch && matchesCuisine;
  });

  // Featured cooks
  const featuredCooks = HOME_COOKS.filter((cook) => cook.featured);

  // Cart functions
  const addToCart = (dish: Dish) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.dish.id === dish.id);
      if (existing) {
        return prev.map((item) =>
          item.dish.id === dish.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { dish, quantity: 1 }];
    });
  };

  const removeFromCart = (dishId: string) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.dish.id === dishId);
      if (existing && existing.quantity > 1) {
        return prev.map((item) =>
          item.dish.id === dishId ? { ...item, quantity: item.quantity - 1 } : item
        );
      }
      return prev.filter((item) => item.dish.id !== dishId);
    });
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.dish.price * item.quantity, 0);
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const toggleFavorite = (dishId: string) => {
    setFavorites((prev) =>
      prev.includes(dishId) ? prev.filter((id) => id !== dishId) : [...prev, dishId]
    );
  };

  return (
    <View className="flex-1 bg-[#FDF8F4]">
      <SafeAreaView className="flex-1" edges={['top']}>
        {/* Header */}
        <Animated.View
          entering={FadeInDown.duration(400)}
          className="px-4 pt-2 pb-4"
        >
          <View className="flex-row items-center justify-between mb-4">
            <Pressable
              onPress={() => router.back()}
              className="w-10 h-10 rounded-full bg-white items-center justify-center"
              style={{ shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 }}
            >
              <ArrowLeft size={20} color="#1B4D3E" />
            </Pressable>

            <View className="flex-1 mx-4">
              <Text className="text-xl font-bold text-[#1B4D3E] text-center">
                African Food Network
              </Text>
              <Text className="text-xs text-gray-500 text-center">
                Home-cooked meals near {currentCommunity?.city || 'you'}
              </Text>
            </View>

            <Pressable
              onPress={() => setShowCart(true)}
              className="w-10 h-10 rounded-full bg-[#D4673A] items-center justify-center relative"
            >
              <ShoppingBag size={20} color="#fff" />
              {cartItemCount > 0 && (
                <View className="absolute -top-1 -right-1 bg-[#1B4D3E] rounded-full w-5 h-5 items-center justify-center">
                  <Text className="text-white text-[10px] font-bold">{cartItemCount}</Text>
                </View>
              )}
            </Pressable>
          </View>

          {/* Search Bar */}
          <View className="flex-row items-center bg-white rounded-xl px-4 py-3 border border-gray-100">
            <Search size={18} color="#9CA3AF" />
            <TextInput
              placeholder="Search dishes, cuisines, or cooks..."
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
              className="flex-1 ml-3 text-gray-800"
            />
          </View>
        </Animated.View>

        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {/* Cuisine Filter */}
          <Animated.View entering={FadeInDown.delay(100).duration(400)}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="px-4 mb-4"
              contentContainerStyle={{ paddingRight: 16 }}
              style={{ flexGrow: 0 }}
            >
              {CUISINES.map((cuisine) => (
                <Pressable
                  key={cuisine.id}
                  onPress={() => setSelectedCuisine(cuisine.id)}
                  className={`mr-2 px-4 py-2 rounded-full flex-row items-center ${
                    selectedCuisine === cuisine.id
                      ? 'bg-[#1B4D3E]'
                      : 'bg-white border border-gray-200'
                  }`}
                >
                  <Text className="mr-1">{cuisine.flag}</Text>
                  <Text
                    className={`font-medium ${
                      selectedCuisine === cuisine.id ? 'text-white' : 'text-gray-700'
                    }`}
                  >
                    {cuisine.name}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </Animated.View>

          {/* Featured Cooks Section */}
          <Animated.View entering={FadeInDown.delay(200).duration(400)} className="mb-6">
            <View className="flex-row items-center justify-between px-4 mb-3">
              <Text className="text-lg font-bold text-[#1B4D3E]">Featured Home Cooks</Text>
              <ChefHat size={20} color="#D4673A" />
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="px-4"
              contentContainerStyle={{ paddingRight: 16 }}
              style={{ flexGrow: 0 }}
            >
              {featuredCooks.map((cook) => (
                <Pressable
                  key={cook.id}
                  className="mr-4 bg-white rounded-2xl p-4 w-48"
                  style={{ shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8, elevation: 3 }}
                >
                  <View className="items-center">
                    <Image
                      source={{ uri: cook.avatar }}
                      className="w-20 h-20 rounded-full mb-2"
                    />
                    {cook.verified && (
                      <View className="absolute top-14 right-10 bg-[#1B4D3E] rounded-full p-1">
                        <Text className="text-[8px]">✓</Text>
                      </View>
                    )}
                  </View>
                  <Text className="font-bold text-[#1B4D3E] text-center">{cook.name}</Text>
                  <Text className="text-xs text-gray-500 text-center mb-2">
                    {cook.flag} {cook.specialty}
                  </Text>
                  <View className="flex-row items-center justify-center">
                    <Star size={12} color="#F59E0B" fill="#F59E0B" />
                    <Text className="text-xs text-gray-700 ml-1">
                      {cook.rating} ({cook.reviewCount})
                    </Text>
                  </View>
                  <View className="flex-row items-center justify-center mt-1">
                    <Clock size={10} color="#9CA3AF" />
                    <Text className="text-[10px] text-gray-400 ml-1">{cook.deliveryTime}</Text>
                  </View>
                </Pressable>
              ))}
            </ScrollView>
          </Animated.View>

          {/* Menu Section */}
          <Animated.View entering={FadeInDown.delay(300).duration(400)} className="px-4 pb-8">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-lg font-bold text-[#1B4D3E]">
                Today's Menu ({filteredDishes.length})
              </Text>
              <Pressable className="flex-row items-center">
                <Filter size={16} color="#D4673A" />
                <Text className="text-sm text-[#D4673A] ml-1">Filter</Text>
              </Pressable>
            </View>

            {filteredDishes.map((dish, index) => (
              <Animated.View
                key={dish.id}
                entering={FadeInUp.delay(index * 50).duration(300)}
              >
                <Pressable
                  onPress={() => {
                    setSelectedDish(dish);
                    setShowDishModal(true);
                  }}
                  className="bg-white rounded-2xl mb-4 overflow-hidden"
                  style={{ shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8, elevation: 3 }}
                >
                  <Image
                    source={{ uri: dish.image }}
                    className="w-full h-40"
                    resizeMode="cover"
                  />

                  {/* Badges */}
                  <View className="absolute top-3 left-3 flex-row">
                    {dish.spicy && (
                      <View className="bg-red-500 rounded-full px-2 py-1 flex-row items-center mr-1">
                        <Flame size={10} color="#fff" />
                        <Text className="text-white text-[10px] ml-0.5">Spicy</Text>
                      </View>
                    )}
                    {dish.vegetarian && (
                      <View className="bg-green-500 rounded-full px-2 py-1 flex-row items-center">
                        <Leaf size={10} color="#fff" />
                        <Text className="text-white text-[10px] ml-0.5">Veg</Text>
                      </View>
                    )}
                  </View>

                  {/* Favorite Button */}
                  <Pressable
                    onPress={() => toggleFavorite(dish.id)}
                    className="absolute top-3 right-3 bg-white/90 rounded-full p-2"
                  >
                    <Heart
                      size={18}
                      color={favorites.includes(dish.id) ? '#EF4444' : '#9CA3AF'}
                      fill={favorites.includes(dish.id) ? '#EF4444' : 'transparent'}
                    />
                  </Pressable>

                  <View className="p-4">
                    <View className="flex-row items-start justify-between">
                      <View className="flex-1">
                        <Text className="font-bold text-[#1B4D3E] text-lg">{dish.name}</Text>
                        <Text className="text-xs text-gray-500 mt-0.5">
                          {dish.flag} by {dish.cookName}
                        </Text>
                      </View>
                      <Text className="text-[#D4673A] font-bold text-lg">
                        ${dish.price.toFixed(2)}
                      </Text>
                    </View>

                    <Text className="text-gray-600 text-sm mt-2 leading-5" numberOfLines={2}>
                      {dish.description}
                    </Text>

                    <View className="flex-row items-center justify-between mt-3">
                      <View className="flex-row items-center">
                        <Star size={14} color="#F59E0B" fill="#F59E0B" />
                        <Text className="text-sm text-gray-700 ml-1">{dish.rating}</Text>
                        <Text className="text-gray-300 mx-2">•</Text>
                        <Clock size={14} color="#9CA3AF" />
                        <Text className="text-sm text-gray-500 ml-1">{dish.prepTime}</Text>
                        <Text className="text-gray-300 mx-2">•</Text>
                        <Utensils size={14} color="#9CA3AF" />
                        <Text className="text-sm text-gray-500 ml-1">{dish.servings}</Text>
                      </View>

                      <Pressable
                        onPress={() => addToCart(dish)}
                        className="bg-[#1B4D3E] rounded-full px-4 py-2"
                      >
                        <Text className="text-white font-medium text-sm">Add</Text>
                      </Pressable>
                    </View>
                  </View>
                </Pressable>
              </Animated.View>
            ))}

            {filteredDishes.length === 0 && (
              <View className="items-center py-12">
                <Text className="text-6xl mb-4">🍽️</Text>
                <Text className="text-gray-500 text-center">
                  No dishes found matching your search.
                </Text>
              </View>
            )}
          </Animated.View>
        </ScrollView>

        {/* Cart Floating Button (when cart has items) */}
        {cartItemCount > 0 && !showCart && (
          <Animated.View
            entering={FadeInUp.duration(300)}
            className="absolute bottom-6 left-4 right-4"
          >
            <Pressable
              onPress={() => setShowCart(true)}
              className="bg-[#1B4D3E] rounded-2xl py-4 px-6 flex-row items-center justify-between"
              style={{ shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 10, elevation: 5 }}
            >
              <View className="flex-row items-center">
                <View className="bg-white/20 rounded-full w-8 h-8 items-center justify-center">
                  <Text className="text-white font-bold">{cartItemCount}</Text>
                </View>
                <Text className="text-white font-semibold ml-3">View Cart</Text>
              </View>
              <Text className="text-white font-bold text-lg">${cartTotal.toFixed(2)}</Text>
            </Pressable>
          </Animated.View>
        )}

        {/* Cart Modal */}
        <Modal visible={showCart} animationType="slide" transparent>
          <View className="flex-1 bg-black/50 justify-end">
            <View className="bg-white rounded-t-3xl max-h-[80%]">
              <View className="p-4 border-b border-gray-100">
                <View className="flex-row items-center justify-between">
                  <Text className="text-xl font-bold text-[#1B4D3E]">Your Cart</Text>
                  <Pressable onPress={() => setShowCart(false)}>
                    <X size={24} color="#1B4D3E" />
                  </Pressable>
                </View>
              </View>

              <ScrollView className="p-4">
                {cart.length === 0 ? (
                  <View className="items-center py-8">
                    <ShoppingBag size={48} color="#D1D5DB" />
                    <Text className="text-gray-400 mt-4">Your cart is empty</Text>
                  </View>
                ) : (
                  cart.map((item) => (
                    <View
                      key={item.dish.id}
                      className="flex-row items-center bg-gray-50 rounded-xl p-3 mb-3"
                    >
                      <Image
                        source={{ uri: item.dish.image }}
                        className="w-16 h-16 rounded-lg"
                      />
                      <View className="flex-1 ml-3">
                        <Text className="font-semibold text-[#1B4D3E]">{item.dish.name}</Text>
                        <Text className="text-xs text-gray-500">{item.dish.cookName}</Text>
                        <Text className="text-[#D4673A] font-medium mt-1">
                          ${(item.dish.price * item.quantity).toFixed(2)}
                        </Text>
                      </View>
                      <View className="flex-row items-center">
                        <Pressable
                          onPress={() => removeFromCart(item.dish.id)}
                          className="bg-gray-200 rounded-full p-1"
                        >
                          <Minus size={16} color="#1B4D3E" />
                        </Pressable>
                        <Text className="mx-3 font-bold">{item.quantity}</Text>
                        <Pressable
                          onPress={() => addToCart(item.dish)}
                          className="bg-[#1B4D3E] rounded-full p-1"
                        >
                          <Plus size={16} color="#fff" />
                        </Pressable>
                      </View>
                    </View>
                  ))
                )}
              </ScrollView>

              {cart.length > 0 && (
                <View className="p-4 border-t border-gray-100">
                  <View className="flex-row justify-between mb-2">
                    <Text className="text-gray-500">Subtotal</Text>
                    <Text className="font-semibold">${cartTotal.toFixed(2)}</Text>
                  </View>
                  <View className="flex-row justify-between mb-2">
                    <Text className="text-gray-500">Delivery Fee</Text>
                    <Text className="font-semibold">$4.99</Text>
                  </View>
                  <View className="flex-row justify-between mb-4">
                    <Text className="font-bold text-lg">Total</Text>
                    <Text className="font-bold text-lg text-[#1B4D3E]">
                      ${(cartTotal + 4.99).toFixed(2)}
                    </Text>
                  </View>
                  <Pressable className="bg-[#D4673A] rounded-xl py-4 items-center">
                    <Text className="text-white font-bold text-lg">Place Order</Text>
                  </Pressable>
                  <Text className="text-[10px] text-gray-400 text-center mt-2">
                    Orders typically ready in 45-60 minutes
                  </Text>
                </View>
              )}
            </View>
          </View>
        </Modal>

        {/* Dish Detail Modal */}
        <Modal visible={showDishModal} animationType="slide" transparent>
          <View className="flex-1 bg-black/50 justify-end">
            <View className="bg-white rounded-t-3xl max-h-[85%]">
              {selectedDish && (
                <>
                  <Image
                    source={{ uri: selectedDish.image }}
                    className="w-full h-48 rounded-t-3xl"
                    resizeMode="cover"
                  />
                  <Pressable
                    onPress={() => setShowDishModal(false)}
                    className="absolute top-4 right-4 bg-white rounded-full p-2"
                  >
                    <X size={20} color="#1B4D3E" />
                  </Pressable>

                  <ScrollView className="p-4">
                    <Text className="text-2xl font-bold text-[#1B4D3E]">{selectedDish.name}</Text>
                    <Text className="text-gray-500 mt-1">
                      {selectedDish.flag} by {selectedDish.cookName}
                    </Text>

                    <View className="flex-row items-center mt-3">
                      <Star size={16} color="#F59E0B" fill="#F59E0B" />
                      <Text className="text-gray-700 ml-1">{selectedDish.rating}</Text>
                      <Text className="text-gray-300 mx-2">•</Text>
                      <Clock size={16} color="#9CA3AF" />
                      <Text className="text-gray-500 ml-1">{selectedDish.prepTime}</Text>
                      <Text className="text-gray-300 mx-2">•</Text>
                      <Utensils size={16} color="#9CA3AF" />
                      <Text className="text-gray-500 ml-1">Serves {selectedDish.servings}</Text>
                    </View>

                    <Text className="text-gray-600 mt-4 leading-6">{selectedDish.description}</Text>

                    <View className="flex-row mt-4">
                      {selectedDish.spicy && (
                        <View className="bg-red-100 rounded-full px-3 py-1 flex-row items-center mr-2">
                          <Flame size={14} color="#EF4444" />
                          <Text className="text-red-600 text-sm ml-1">Spicy</Text>
                        </View>
                      )}
                      {selectedDish.vegetarian && (
                        <View className="bg-green-100 rounded-full px-3 py-1 flex-row items-center">
                          <Leaf size={14} color="#22C55E" />
                          <Text className="text-green-600 text-sm ml-1">Vegetarian</Text>
                        </View>
                      )}
                    </View>
                  </ScrollView>

                  <View className="p-4 border-t border-gray-100 flex-row items-center justify-between">
                    <Text className="text-2xl font-bold text-[#D4673A]">
                      ${selectedDish.price.toFixed(2)}
                    </Text>
                    <Pressable
                      onPress={() => {
                        addToCart(selectedDish);
                        setShowDishModal(false);
                      }}
                      className="bg-[#1B4D3E] rounded-xl px-8 py-4"
                    >
                      <Text className="text-white font-bold">Add to Cart</Text>
                    </Pressable>
                  </View>
                </>
              )}
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </View>
  );
}
