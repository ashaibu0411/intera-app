import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import {
  ChevronLeft,
  Plus,
  Package,
  Edit2,
  Trash2,
  DollarSign,
  Tag,
  X,
  Check,
  Camera,
  ImageIcon,
} from 'lucide-react-native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { useStore } from '@/lib/store';
import {
  getBusinessInventory,
  addInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
} from '@/lib/marketplace-api';

interface InventoryItem {
  id: string;
  business_id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  in_stock: boolean;
  quantity: number | null;
  created_at: string;
}

const ITEM_CATEGORIES = [
  'Food & Groceries',
  'Fashion & Clothing',
  'Beauty & Cosmetics',
  'Electronics',
  'Home & Living',
  'Arts & Crafts',
  'Health & Wellness',
  'Services',
  'Other',
];

export default function ManageInventoryScreen() {
  const { businessId, businessName } = useLocalSearchParams<{
    businessId: string;
    businessName: string;
  }>();

  const currentUser = useStore((s) => s.currentUser);
  const isGuest = useStore((s) => s.isGuest);

  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [itemName, setItemName] = useState('');
  const [itemDescription, setItemDescription] = useState('');
  const [itemPrice, setItemPrice] = useState('');
  const [itemImage, setItemImage] = useState('');
  const [itemCategory, setItemCategory] = useState('Other');
  const [itemInStock, setItemInStock] = useState(true);
  const [itemQuantity, setItemQuantity] = useState('');

  const fetchInventory = async () => {
    if (!businessId) return;
    try {
      const data = await getBusinessInventory(businessId);
      setInventory((data || []) as InventoryItem[]);
    } catch (error) {
      console.error('Error fetching inventory:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, [businessId]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchInventory();
  };

  const resetForm = () => {
    setItemName('');
    setItemDescription('');
    setItemPrice('');
    setItemImage('');
    setItemCategory('Other');
    setItemInStock(true);
    setItemQuantity('');
    setEditingItem(null);
  };

  const openAddModal = () => {
    resetForm();
    setShowAddModal(true);
  };

  const openEditModal = (item: InventoryItem) => {
    setEditingItem(item);
    setItemName(item.name);
    setItemDescription(item.description || '');
    setItemPrice(item.price.toString());
    setItemImage(item.image || '');
    setItemCategory(item.category || 'Other');
    setItemInStock(item.in_stock);
    setItemQuantity(item.quantity?.toString() || '');
    setShowAddModal(true);
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setItemImage(result.assets[0].uri);
    }
  };

  const handleSaveItem = async () => {
    if (!itemName.trim()) {
      Alert.alert('Required', 'Please enter an item name');
      return;
    }
    if (!itemPrice.trim() || isNaN(parseFloat(itemPrice))) {
      Alert.alert('Required', 'Please enter a valid price');
      return;
    }
    if (!businessId) return;

    setIsSaving(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const itemData = {
        name: itemName.trim(),
        description: itemDescription.trim(),
        price: parseFloat(itemPrice),
        image: itemImage || 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=400&fit=crop',
        category: itemCategory,
        inStock: itemInStock,
        quantity: itemQuantity ? parseInt(itemQuantity) : undefined,
      };

      if (editingItem) {
        await updateInventoryItem(editingItem.id, itemData);
      } else {
        await addInventoryItem(businessId, itemData);
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowAddModal(false);
      resetForm();
      fetchInventory();
    } catch (error) {
      console.error('Error saving item:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', 'Failed to save item. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteItem = (item: InventoryItem) => {
    Alert.alert(
      'Delete Item',
      `Are you sure you want to delete "${item.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteInventoryItem(item.id);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              fetchInventory();
            } catch (error) {
              console.error('Error deleting item:', error);
              Alert.alert('Error', 'Failed to delete item');
            }
          },
        },
      ]
    );
  };

  const toggleStockStatus = async (item: InventoryItem) => {
    try {
      await updateInventoryItem(item.id, { inStock: !item.in_stock });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      fetchInventory();
    } catch (error) {
      console.error('Error updating stock status:', error);
    }
  };

  if (isGuest || !currentUser) {
    return (
      <View className="flex-1 bg-cream items-center justify-center px-6">
        <Package size={48} color="#9CA3AF" />
        <Text className="text-warmBrown font-semibold text-lg text-center mt-4">
          Sign in to manage inventory
        </Text>
        <Pressable
          onPress={() => router.push('/signup')}
          className="mt-4 bg-forest-600 px-6 py-3 rounded-full"
        >
          <Text className="text-white font-semibold">Sign In</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-cream">
      <SafeAreaView edges={['top']} className="flex-1">
        {/* Header */}
        <Animated.View entering={FadeIn.duration(300)} className="px-5 pt-4 pb-3">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center flex-1">
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.back();
                }}
                className="bg-white rounded-full p-2 mr-3 shadow-sm"
              >
                <ChevronLeft size={24} color="#2D1F1A" />
              </Pressable>
              <View className="flex-1">
                <Text className="text-xl font-bold text-warmBrown" numberOfLines={1}>
                  Inventory
                </Text>
                <Text className="text-sm text-gray-500" numberOfLines={1}>
                  {businessName || 'Your Business'}
                </Text>
              </View>
            </View>

            <Pressable
              onPress={openAddModal}
              className="bg-forest-600 rounded-full p-2.5"
            >
              <Plus size={22} color="#FFFFFF" />
            </Pressable>
          </View>
        </Animated.View>

        {/* Inventory List */}
        <ScrollView
          className="flex-1 px-5"
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor="#1B4D3E"
            />
          }
        >
          {isLoading ? (
            <View className="py-20 items-center">
              <ActivityIndicator size="large" color="#1B4D3E" />
              <Text className="text-gray-500 mt-4">Loading inventory...</Text>
            </View>
          ) : inventory.length === 0 ? (
            <Animated.View
              entering={FadeInUp.duration(400)}
              className="py-16 items-center"
            >
              <View className="bg-gray-100 rounded-full p-6 mb-4">
                <Package size={40} color="#9CA3AF" />
              </View>
              <Text className="text-warmBrown font-semibold text-lg text-center">
                No items yet
              </Text>
              <Text className="text-gray-500 text-center mt-2 px-8">
                Add products to your inventory so customers can see what you have in stock
              </Text>
              <Pressable
                onPress={openAddModal}
                className="mt-6 bg-forest-600 px-6 py-3 rounded-full flex-row items-center"
              >
                <Plus size={18} color="#FFFFFF" />
                <Text className="text-white font-semibold ml-2">Add First Item</Text>
              </Pressable>
            </Animated.View>
          ) : (
            <>
              {/* Stats */}
              <Animated.View
                entering={FadeInUp.duration(400).delay(100)}
                className="flex-row mb-4"
              >
                <View className="flex-1 bg-white rounded-2xl p-4 mr-2">
                  <Text className="text-gray-500 text-sm">Total Items</Text>
                  <Text className="text-2xl font-bold text-warmBrown">{inventory.length}</Text>
                </View>
                <View className="flex-1 bg-white rounded-2xl p-4 ml-2">
                  <Text className="text-gray-500 text-sm">In Stock</Text>
                  <Text className="text-2xl font-bold text-green-600">
                    {inventory.filter((i) => i.in_stock).length}
                  </Text>
                </View>
              </Animated.View>

              {/* Items */}
              {inventory.map((item, index) => (
                <Animated.View
                  key={item.id}
                  entering={FadeInUp.duration(300).delay(150 + index * 50)}
                >
                  <Pressable
                    onPress={() => openEditModal(item)}
                    className="bg-white rounded-2xl p-4 mb-3 shadow-sm"
                  >
                    <View className="flex-row">
                      <Image
                        source={{ uri: item.image }}
                        style={{ width: 80, height: 80, borderRadius: 12 }}
                        contentFit="cover"
                      />
                      <View className="flex-1 ml-3">
                        <View className="flex-row items-start justify-between">
                          <View className="flex-1">
                            <Text className="text-warmBrown font-semibold" numberOfLines={1}>
                              {item.name}
                            </Text>
                            <Text className="text-gray-500 text-sm mt-0.5" numberOfLines={2}>
                              {item.description || 'No description'}
                            </Text>
                          </View>
                          <Pressable
                            onPress={() => handleDeleteItem(item)}
                            className="p-2"
                          >
                            <Trash2 size={18} color="#EF4444" />
                          </Pressable>
                        </View>

                        <View className="flex-row items-center justify-between mt-2">
                          <View className="flex-row items-center">
                            <DollarSign size={14} color="#1B4D3E" />
                            <Text className="text-forest-600 font-bold ml-0.5">
                              {item.price.toFixed(2)}
                            </Text>
                            {item.quantity !== null && (
                              <Text className="text-gray-400 text-xs ml-2">
                                Qty: {item.quantity}
                              </Text>
                            )}
                          </View>

                          <Pressable
                            onPress={() => toggleStockStatus(item)}
                            className={`px-3 py-1 rounded-full ${
                              item.in_stock ? 'bg-green-100' : 'bg-red-100'
                            }`}
                          >
                            <Text
                              className={`text-xs font-medium ${
                                item.in_stock ? 'text-green-700' : 'text-red-700'
                              }`}
                            >
                              {item.in_stock ? 'In Stock' : 'Out of Stock'}
                            </Text>
                          </Pressable>
                        </View>
                      </View>
                    </View>
                  </Pressable>
                </Animated.View>
              ))}

              <View className="h-24" />
            </>
          )}
        </ScrollView>

        {/* Add/Edit Modal */}
        <Modal
          visible={showAddModal}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => {
            setShowAddModal(false);
            resetForm();
          }}
        >
          <SafeAreaView className="flex-1 bg-cream">
            {/* Modal Header */}
            <View className="px-5 pt-4 pb-3 flex-row items-center justify-between border-b border-gray-100">
              <Pressable
                onPress={() => {
                  setShowAddModal(false);
                  resetForm();
                }}
                className="bg-gray-100 rounded-full p-2"
              >
                <X size={22} color="#2D1F1A" />
              </Pressable>
              <Text className="text-lg font-bold text-warmBrown">
                {editingItem ? 'Edit Item' : 'Add Item'}
              </Text>
              <Pressable
                onPress={handleSaveItem}
                disabled={isSaving}
                className="bg-forest-600 rounded-full px-4 py-2"
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text className="text-white font-semibold">Save</Text>
                )}
              </Pressable>
            </View>

            <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
              {/* Image */}
              <View className="mt-4">
                <Text className="text-warmBrown font-semibold mb-2">Product Image</Text>
                <Pressable
                  onPress={pickImage}
                  className="bg-white rounded-2xl p-4 items-center justify-center border-2 border-dashed border-gray-200"
                  style={{ height: 160 }}
                >
                  {itemImage ? (
                    <Image
                      source={{ uri: itemImage }}
                      style={{ width: '100%', height: '100%', borderRadius: 12 }}
                      contentFit="cover"
                    />
                  ) : (
                    <View className="items-center">
                      <ImageIcon size={32} color="#9CA3AF" />
                      <Text className="text-gray-500 mt-2">Tap to add image</Text>
                    </View>
                  )}
                </Pressable>
              </View>

              {/* Name */}
              <View className="mt-4">
                <Text className="text-warmBrown font-semibold mb-2">Item Name *</Text>
                <TextInput
                  value={itemName}
                  onChangeText={setItemName}
                  placeholder="e.g., Shea Butter 500g"
                  placeholderTextColor="#9CA3AF"
                  className="bg-white rounded-xl px-4 py-3 text-warmBrown"
                />
              </View>

              {/* Description */}
              <View className="mt-4">
                <Text className="text-warmBrown font-semibold mb-2">Description</Text>
                <TextInput
                  value={itemDescription}
                  onChangeText={setItemDescription}
                  placeholder="Describe your product..."
                  placeholderTextColor="#9CA3AF"
                  multiline
                  numberOfLines={3}
                  className="bg-white rounded-xl px-4 py-3 text-warmBrown"
                  style={{ minHeight: 80, textAlignVertical: 'top' }}
                />
              </View>

              {/* Price */}
              <View className="mt-4">
                <Text className="text-warmBrown font-semibold mb-2">Price (USD) *</Text>
                <View className="flex-row items-center bg-white rounded-xl px-4">
                  <DollarSign size={18} color="#8B7355" />
                  <TextInput
                    value={itemPrice}
                    onChangeText={setItemPrice}
                    placeholder="0.00"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="decimal-pad"
                    className="flex-1 py-3 ml-2 text-warmBrown"
                  />
                </View>
              </View>

              {/* Category */}
              <View className="mt-4">
                <Text className="text-warmBrown font-semibold mb-2">Category</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={{ flexGrow: 0 }}
                >
                  {ITEM_CATEGORIES.map((cat) => (
                    <Pressable
                      key={cat}
                      onPress={() => setItemCategory(cat)}
                      className={`px-4 py-2 rounded-full mr-2 ${
                        itemCategory === cat ? 'bg-forest-600' : 'bg-white'
                      }`}
                    >
                      <Text
                        className={`font-medium ${
                          itemCategory === cat ? 'text-white' : 'text-gray-600'
                        }`}
                      >
                        {cat}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>

              {/* Stock Status */}
              <View className="mt-4 bg-white rounded-xl p-4">
                <View className="flex-row items-center justify-between">
                  <View>
                    <Text className="text-warmBrown font-semibold">In Stock</Text>
                    <Text className="text-gray-500 text-sm">Is this item available?</Text>
                  </View>
                  <Switch
                    value={itemInStock}
                    onValueChange={setItemInStock}
                    trackColor={{ false: '#D1D5DB', true: '#10B981' }}
                    thumbColor="#FFFFFF"
                  />
                </View>
              </View>

              {/* Quantity */}
              <View className="mt-4">
                <Text className="text-warmBrown font-semibold mb-2">
                  Quantity (optional)
                </Text>
                <TextInput
                  value={itemQuantity}
                  onChangeText={setItemQuantity}
                  placeholder="Leave empty for unlimited"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="number-pad"
                  className="bg-white rounded-xl px-4 py-3 text-warmBrown"
                />
              </View>

              <View className="h-32" />
            </ScrollView>
          </SafeAreaView>
        </Modal>
      </SafeAreaView>
    </View>
  );
}
