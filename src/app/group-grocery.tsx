import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { ArrowLeft, ShoppingCart, Plus, Minus, Users, Calendar, MapPin, X, Check, Clock, Truck, ChevronRight, Package } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

interface GroupOrder {
  id: string;
  title: string;
  store: string;
  storeImage: string;
  category: string;
  organizer: {
    name: string;
    avatar: string;
  };
  deadline: string;
  deliveryDate: string;
  location: string;
  participants: number;
  maxParticipants: number;
  minOrder: string;
  currentTotal: string;
  status: 'open' | 'pending' | 'ordered' | 'delivered';
  items: { name: string; price: string; unit: string }[];
  savings: string;
}

const MOCK_ORDERS: GroupOrder[] = [
  {
    id: '1',
    title: 'West African Spices & Ingredients',
    store: 'Mama Africa\'s Market',
    storeImage: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400',
    category: 'Spices & Seasonings',
    organizer: {
      name: 'Amara Johnson',
      avatar: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=200',
    },
    deadline: '2 days left',
    deliveryDate: 'Jan 15',
    location: 'Harlem, NY',
    participants: 8,
    maxParticipants: 15,
    minOrder: '$150',
    currentTotal: '$234',
    status: 'open',
    items: [
      { name: 'Cameroon Pepper', price: '$8', unit: 'lb' },
      { name: 'Palm Oil', price: '$15', unit: 'gallon' },
      { name: 'Crayfish', price: '$12', unit: 'lb' },
      { name: 'Egusi Seeds', price: '$10', unit: 'lb' },
    ],
    savings: '30%',
  },
  {
    id: '2',
    title: 'Caribbean Produce Box',
    store: 'Island Fresh Imports',
    storeImage: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400',
    category: 'Fresh Produce',
    organizer: {
      name: 'Marcus Williams',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200',
    },
    deadline: '5 hours left',
    deliveryDate: 'Jan 12',
    location: 'Brooklyn, NY',
    participants: 12,
    maxParticipants: 20,
    minOrder: '$200',
    currentTotal: '$456',
    status: 'open',
    items: [
      { name: 'Scotch Bonnet Peppers', price: '$6', unit: 'lb' },
      { name: 'Plantains', price: '$1.50', unit: 'each' },
      { name: 'Callaloo', price: '$4', unit: 'bunch' },
      { name: 'Ackee', price: '$8', unit: 'can' },
    ],
    savings: '25%',
  },
  {
    id: '3',
    title: 'Ethiopian Coffee & Tea',
    store: 'Addis Coffee House',
    storeImage: 'https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=400',
    category: 'Beverages',
    organizer: {
      name: 'Keisha Thompson',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200',
    },
    deadline: '1 day left',
    deliveryDate: 'Jan 14',
    location: 'Bronx, NY',
    participants: 15,
    maxParticipants: 25,
    minOrder: '$100',
    currentTotal: '$389',
    status: 'pending',
    items: [
      { name: 'Yirgacheffe Coffee Beans', price: '$18', unit: 'lb' },
      { name: 'Sidamo Coffee', price: '$16', unit: 'lb' },
      { name: 'Ethiopian Tea', price: '$8', unit: 'box' },
    ],
    savings: '35%',
  },
  {
    id: '4',
    title: 'Nigerian Snacks Bundle',
    store: 'Naija Snack Box',
    storeImage: 'https://images.unsplash.com/photo-1621939514649-280e2ee25f60?w=400',
    category: 'Snacks',
    organizer: {
      name: 'David Okonkwo',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200',
    },
    deadline: 'Closed',
    deliveryDate: 'Jan 10',
    location: 'Queens, NY',
    participants: 20,
    maxParticipants: 20,
    minOrder: '$80',
    currentTotal: '$567',
    status: 'ordered',
    items: [
      { name: 'Chin Chin', price: '$5', unit: 'bag' },
      { name: 'Puff Puff Mix', price: '$7', unit: 'box' },
      { name: 'Kilishi', price: '$12', unit: 'pack' },
    ],
    savings: '40%',
  },
];

const CATEGORIES = ['All', 'Spices', 'Produce', 'Beverages', 'Snacks', 'Meats', 'Grains'];

const STATUS_COLORS = {
  open: '#10B981',
  pending: '#F59E0B',
  ordered: '#3B82F6',
  delivered: '#8B5CF6',
};

const STATUS_LABELS = {
  open: 'Accepting Orders',
  pending: 'Finalizing',
  ordered: 'Order Placed',
  delivered: 'Delivered',
};

export default function GroupGroceryScreen() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<GroupOrder | null>(null);
  const [cart, setCart] = useState<{ [key: string]: number }>({});

  const filteredOrders = MOCK_ORDERS.filter(order => {
    return selectedCategory === 'All' || order.category.toLowerCase().includes(selectedCategory.toLowerCase());
  });

  const updateCartItem = (itemName: string, delta: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCart(prev => {
      const current = prev[itemName] || 0;
      const newValue = Math.max(0, current + delta);
      if (newValue === 0) {
        const { [itemName]: removed, ...rest } = prev;
        return rest;
      }
      return { ...prev, [itemName]: newValue };
    });
  };

  const openJoinModal = (order: GroupOrder) => {
    setSelectedOrder(order);
    setCart({});
    setShowJoinModal(true);
  };

  return (
    <View className="flex-1 bg-[#F0FDF4]">
      <SafeAreaView edges={['top']} className="flex-1">
        {/* Header */}
        <View className="px-5 pb-4 bg-white">
          <View className="flex-row items-center justify-between mb-4">
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.back();
              }}
              className="w-10 h-10 rounded-full bg-green-100 items-center justify-center"
            >
              <ArrowLeft size={20} color="#16A34A" />
            </Pressable>
            <View className="flex-row items-center">
              <ShoppingCart size={20} color="#16A34A" />
              <Text className="text-gray-800 text-lg font-bold ml-2">Group Grocery</Text>
            </View>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                setShowCreateModal(true);
              }}
              className="w-10 h-10 rounded-full bg-green-500 items-center justify-center"
            >
              <Plus size={20} color="#fff" />
            </Pressable>
          </View>

          {/* Hero Banner */}
          <LinearGradient
            colors={['#16A34A', '#15803D']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ borderRadius: 20, padding: 16, marginBottom: 16 }}
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <Text className="text-white/80 text-sm">Save up to</Text>
                <Text className="text-white text-3xl font-bold">40% OFF</Text>
                <Text className="text-white/70 text-sm mt-1">on bulk orders with your community</Text>
              </View>
              <View className="w-20 h-20 rounded-full bg-white/20 items-center justify-center">
                <Text className="text-4xl">🛒</Text>
              </View>
            </View>
          </LinearGradient>

          {/* Categories */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }}>
            <View className="flex-row gap-2">
              {CATEGORIES.map((category) => (
                <Pressable
                  key={category}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSelectedCategory(category);
                  }}
                  className={`px-4 py-2.5 rounded-full ${
                    selectedCategory === category
                      ? 'bg-green-500'
                      : 'bg-green-100'
                  }`}
                >
                  <Text className={`font-medium ${
                    selectedCategory === category ? 'text-white' : 'text-green-700'
                  }`}>
                    {category}
                  </Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Orders List */}
        <ScrollView className="flex-1 px-5 pt-4" showsVerticalScrollIndicator={false}>
          {filteredOrders.map((order, index) => (
            <Animated.View
              key={order.id}
              entering={FadeInDown.delay(index * 80).springify()}
            >
              <Pressable
                onPress={() => openJoinModal(order)}
                className="bg-white rounded-3xl overflow-hidden mb-4 shadow-sm"
              >
                {/* Image Header */}
                <View className="relative h-32">
                  <Image
                    source={{ uri: order.storeImage }}
                    style={{ width: '100%', height: '100%' }}
                    contentFit="cover"
                  />
                  <View
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      backgroundColor: 'rgba(0,0,0,0.3)',
                    }}
                  />

                  {/* Status Badge */}
                  <View
                    className="absolute top-3 left-3 px-3 py-1.5 rounded-full flex-row items-center"
                    style={{ backgroundColor: STATUS_COLORS[order.status] }}
                  >
                    {order.status === 'open' && <Clock size={12} color="#fff" />}
                    {order.status === 'ordered' && <Truck size={12} color="#fff" />}
                    {order.status === 'delivered' && <Check size={12} color="#fff" />}
                    <Text className="text-white text-xs font-bold ml-1">{STATUS_LABELS[order.status]}</Text>
                  </View>

                  {/* Savings Badge */}
                  <View className="absolute top-3 right-3 bg-amber-400 px-3 py-1.5 rounded-full">
                    <Text className="text-black text-xs font-bold">Save {order.savings}</Text>
                  </View>

                  {/* Store Name */}
                  <View className="absolute bottom-3 left-3">
                    <Text className="text-white font-bold text-lg">{order.title}</Text>
                    <Text className="text-white/80 text-sm">{order.store}</Text>
                  </View>
                </View>

                {/* Content */}
                <View className="p-4">
                  {/* Organizer & Location */}
                  <View className="flex-row items-center justify-between mb-3">
                    <View className="flex-row items-center">
                      <Image
                        source={{ uri: order.organizer.avatar }}
                        style={{ width: 28, height: 28, borderRadius: 14 }}
                        contentFit="cover"
                      />
                      <Text className="text-gray-600 text-sm ml-2">by {order.organizer.name}</Text>
                    </View>
                    <View className="flex-row items-center">
                      <MapPin size={14} color="#9CA3AF" />
                      <Text className="text-gray-500 text-sm ml-1">{order.location}</Text>
                    </View>
                  </View>

                  {/* Progress */}
                  <View className="mb-3">
                    <View className="flex-row items-center justify-between mb-1">
                      <Text className="text-gray-600 text-sm">{order.currentTotal} of {order.minOrder} minimum</Text>
                      <Text className="text-gray-500 text-sm">{order.participants}/{order.maxParticipants} joined</Text>
                    </View>
                    <View className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <View
                        className="h-full bg-green-500 rounded-full"
                        style={{ width: `${Math.min(100, (parseInt(order.currentTotal.replace(/\D/g, '')) / parseInt(order.minOrder.replace(/\D/g, ''))) * 100)}%` }}
                      />
                    </View>
                  </View>

                  {/* Items Preview */}
                  <View className="flex-row flex-wrap gap-2 mb-3">
                    {order.items.slice(0, 3).map((item, idx) => (
                      <View key={idx} className="bg-green-50 px-2 py-1 rounded-full">
                        <Text className="text-green-700 text-xs">{item.name}</Text>
                      </View>
                    ))}
                    {order.items.length > 3 && (
                      <View className="bg-gray-100 px-2 py-1 rounded-full">
                        <Text className="text-gray-500 text-xs">+{order.items.length - 3} more</Text>
                      </View>
                    )}
                  </View>

                  {/* Footer */}
                  <View className="flex-row items-center justify-between pt-3 border-t border-gray-100">
                    <View className="flex-row items-center">
                      <Calendar size={14} color="#9CA3AF" />
                      <Text className="text-gray-500 text-sm ml-1">{order.deadline}</Text>
                      <Text className="text-gray-300 mx-2">•</Text>
                      <Truck size={14} color="#9CA3AF" />
                      <Text className="text-gray-500 text-sm ml-1">Delivers {order.deliveryDate}</Text>
                    </View>
                    <ChevronRight size={20} color="#16A34A" />
                  </View>
                </View>
              </Pressable>
            </Animated.View>
          ))}

          <View className="h-32" />
        </ScrollView>

        {/* Join Order Modal */}
        <Modal visible={showJoinModal} animationType="slide" transparent>
          <View className="flex-1 bg-black/50 justify-end">
            <View className="bg-white rounded-t-3xl p-6 max-h-[80%]">
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-gray-800 text-xl font-bold">Join Order</Text>
                <Pressable
                  onPress={() => setShowJoinModal(false)}
                  className="w-8 h-8 rounded-full bg-gray-100 items-center justify-center"
                >
                  <X size={18} color="#6B7280" />
                </Pressable>
              </View>

              {selectedOrder && (
                <>
                  <View className="flex-row items-center mb-4">
                    <Image
                      source={{ uri: selectedOrder.storeImage }}
                      style={{ width: 50, height: 50, borderRadius: 12 }}
                      contentFit="cover"
                    />
                    <View className="ml-3">
                      <Text className="text-gray-800 font-bold">{selectedOrder.title}</Text>
                      <Text className="text-gray-500 text-sm">{selectedOrder.store}</Text>
                    </View>
                  </View>

                  <ScrollView className="max-h-64 mb-4">
                    {selectedOrder.items.map((item, idx) => (
                      <View key={idx} className="flex-row items-center justify-between py-3 border-b border-gray-100">
                        <View>
                          <Text className="text-gray-800 font-medium">{item.name}</Text>
                          <Text className="text-gray-500 text-sm">{item.price}/{item.unit}</Text>
                        </View>
                        <View className="flex-row items-center">
                          <Pressable
                            onPress={() => updateCartItem(item.name, -1)}
                            className="w-8 h-8 rounded-full bg-gray-100 items-center justify-center"
                          >
                            <Minus size={16} color="#6B7280" />
                          </Pressable>
                          <Text className="text-gray-800 font-bold w-10 text-center">
                            {cart[item.name] || 0}
                          </Text>
                          <Pressable
                            onPress={() => updateCartItem(item.name, 1)}
                            className="w-8 h-8 rounded-full bg-green-500 items-center justify-center"
                          >
                            <Plus size={16} color="#fff" />
                          </Pressable>
                        </View>
                      </View>
                    ))}
                  </ScrollView>

                  {/* Cart Summary */}
                  <View className="bg-green-50 rounded-xl p-4 mb-4">
                    <View className="flex-row items-center justify-between mb-2">
                      <Text className="text-gray-600">Items Selected</Text>
                      <Text className="text-gray-800 font-bold">{Object.values(cart).reduce((a, b) => a + b, 0)}</Text>
                    </View>
                    <View className="flex-row items-center justify-between">
                      <Text className="text-gray-600">Your Total</Text>
                      <Text className="text-green-600 font-bold text-lg">$0.00</Text>
                    </View>
                  </View>

                  <Pressable
                    onPress={() => {
                      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                      setShowJoinModal(false);
                    }}
                    className="bg-green-500 rounded-xl py-4 items-center"
                  >
                    <Text className="text-white font-bold text-lg">Join This Order</Text>
                  </Pressable>
                </>
              )}

              <View className="h-8" />
            </View>
          </View>
        </Modal>

        {/* Create Order Modal */}
        <Modal visible={showCreateModal} animationType="slide" transparent>
          <View className="flex-1 bg-black/50 justify-end">
            <View className="bg-white rounded-t-3xl p-6">
              <View className="flex-row items-center justify-between mb-6">
                <Text className="text-gray-800 text-xl font-bold">Start Group Order</Text>
                <Pressable
                  onPress={() => setShowCreateModal(false)}
                  className="w-8 h-8 rounded-full bg-gray-100 items-center justify-center"
                >
                  <X size={18} color="#6B7280" />
                </Pressable>
              </View>

              <View className="mb-4">
                <Text className="text-gray-600 text-sm mb-2">Order Title</Text>
                <TextInput
                  placeholder="e.g., West African Spices"
                  placeholderTextColor="#9CA3AF"
                  className="bg-gray-100 rounded-xl px-4 py-3 text-gray-800"
                />
              </View>

              <View className="mb-4">
                <Text className="text-gray-600 text-sm mb-2">Store/Supplier</Text>
                <TextInput
                  placeholder="Where are you ordering from?"
                  placeholderTextColor="#9CA3AF"
                  className="bg-gray-100 rounded-xl px-4 py-3 text-gray-800"
                />
              </View>

              <View className="flex-row gap-3 mb-4">
                <View className="flex-1">
                  <Text className="text-gray-600 text-sm mb-2">Min Order</Text>
                  <TextInput
                    placeholder="$0"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="number-pad"
                    className="bg-gray-100 rounded-xl px-4 py-3 text-gray-800"
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-gray-600 text-sm mb-2">Deadline</Text>
                  <TextInput
                    placeholder="Date"
                    placeholderTextColor="#9CA3AF"
                    className="bg-gray-100 rounded-xl px-4 py-3 text-gray-800"
                  />
                </View>
              </View>

              <View className="mb-6">
                <Text className="text-gray-600 text-sm mb-2">Pickup Location</Text>
                <TextInput
                  placeholder="Where will orders be picked up?"
                  placeholderTextColor="#9CA3AF"
                  className="bg-gray-100 rounded-xl px-4 py-3 text-gray-800"
                />
              </View>

              <Pressable
                onPress={() => {
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                  setShowCreateModal(false);
                }}
                className="bg-green-500 rounded-xl py-4 items-center"
              >
                <Text className="text-white font-bold text-lg">Create Group Order</Text>
              </Pressable>

              <View className="h-8" />
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </View>
  );
}
