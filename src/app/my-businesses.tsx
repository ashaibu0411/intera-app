import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowLeft,
  Plus,
  MapPin,
  Star,
  Phone,
  Globe,
  Clock,
  MoreVertical,
  Edit3,
  Trash2,
  X,
  Store,
  CheckCircle,
  Calendar,
  CalendarCheck,
} from 'lucide-react-native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useStore, Business } from '@/lib/store';

export default function MyBusinessesScreen() {
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [businessToDelete, setBusinessToDelete] = useState<Business | null>(null);

  const userBusinesses = useStore((s) => s.userBusinesses);
  const deleteBusiness = useStore((s) => s.deleteBusiness);

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const handleAddBusiness = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/register-business');
  };

  const handleDeleteBusiness = (business: Business) => {
    setBusinessToDelete(business);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    if (businessToDelete) {
      deleteBusiness(businessToDelete.id);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setShowDeleteConfirm(false);
    setBusinessToDelete(null);
    setSelectedBusiness(null);
  };

  return (
    <View className="flex-1 bg-cream">
      <SafeAreaView edges={['top']} className="flex-1">
        {/* Header */}
        <Animated.View
          entering={FadeIn.duration(300)}
          className="flex-row items-center justify-between px-5 py-4 border-b border-gray-100"
        >
          <Pressable onPress={handleBack} className="p-2 -ml-2">
            <ArrowLeft size={24} color="#2D1F1A" />
          </Pressable>
          <Text className="text-lg font-bold text-warmBrown">My Businesses</Text>
          <Pressable
            onPress={handleAddBusiness}
            className="bg-forest-600 rounded-full p-2"
          >
            <Plus size={20} color="#FFFFFF" />
          </Pressable>
        </Animated.View>

        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {/* Intro Banner */}
          <Animated.View entering={FadeInUp.duration(400).delay(100)} className="px-5 py-4">
            <LinearGradient
              colors={['#1B4D3E', '#153D31']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ borderRadius: 16, padding: 20 }}
            >
              <View className="flex-row items-center">
                <View className="bg-white/20 rounded-full p-3">
                  <Store size={28} color="#FFFFFF" />
                </View>
                <View className="flex-1 ml-4">
                  <Text className="text-white text-lg font-bold">Your Business Hub</Text>
                  <Text className="text-white/80 mt-1">
                    Manage your African-owned businesses and reach your community
                  </Text>
                </View>
              </View>
            </LinearGradient>
          </Animated.View>

          {/* Businesses List */}
          {userBusinesses.length > 0 ? (
            <View className="px-5 pb-6">
              <Text className="text-warmBrown font-semibold text-lg mb-4">
                {userBusinesses.length} {userBusinesses.length === 1 ? 'Business' : 'Businesses'}
              </Text>
              {userBusinesses.map((business, index) => (
                <Animated.View
                  key={business.id}
                  entering={FadeInUp.duration(400).delay(200 + index * 50)}
                >
                  <BusinessCard
                    business={business}
                    onPress={() => setSelectedBusiness(business)}
                    onMenuPress={() => setSelectedBusiness(business)}
                  />
                </Animated.View>
              ))}
            </View>
          ) : (
            <Animated.View entering={FadeInUp.duration(400).delay(200)} className="px-5 py-12 items-center">
              <View className="bg-gray-100 rounded-full p-6 mb-4">
                <Store size={40} color="#9CA3AF" />
              </View>
              <Text className="text-warmBrown font-semibold text-lg text-center">No businesses yet</Text>
              <Text className="text-gray-500 text-center mt-2 px-8">
                List your African-owned business to reach your local community
              </Text>
              <Pressable onPress={handleAddBusiness} className="mt-6">
                <LinearGradient
                  colors={['#1B4D3E', '#153D31']}
                  style={{ borderRadius: 12, paddingVertical: 14, paddingHorizontal: 24 }}
                >
                  <Text className="text-white font-semibold">Add Your First Business</Text>
                </LinearGradient>
              </Pressable>
            </Animated.View>
          )}
        </ScrollView>

        {/* Business Details Modal */}
        {selectedBusiness && (
          <Modal visible animationType="slide" transparent>
            <View className="flex-1 bg-black/50 justify-end">
              <View className="bg-cream rounded-t-3xl max-h-[85%]">
                {/* Header */}
                <View className="flex-row items-center justify-between px-5 py-4 border-b border-gray-100">
                  <Pressable onPress={() => setSelectedBusiness(null)} className="p-2 -ml-2">
                    <X size={24} color="#2D1F1A" />
                  </Pressable>
                  <Text className="text-lg font-bold text-warmBrown">Business Details</Text>
                  <View style={{ width: 40 }} />
                </View>

                <ScrollView className="px-5 py-4" showsVerticalScrollIndicator={false}>
                  {/* Business Image */}
                  <Image
                    source={{ uri: selectedBusiness.image }}
                    style={{ width: '100%', height: 200, borderRadius: 16 }}
                    contentFit="cover"
                  />

                  {/* Business Info */}
                  <View className="mt-4">
                    <View className="flex-row items-center">
                      <Text className="text-warmBrown font-bold text-xl flex-1">
                        {selectedBusiness.name}
                      </Text>
                      {selectedBusiness.isVerified && (
                        <View className="flex-row items-center bg-forest-100 rounded-full px-3 py-1">
                          <CheckCircle size={14} color="#1B4D3E" />
                          <Text className="text-forest-700 text-xs font-medium ml-1">Verified</Text>
                        </View>
                      )}
                    </View>
                    <Text className="text-gray-500 mt-1">{selectedBusiness.category}</Text>

                    {/* Rating */}
                    <View className="flex-row items-center mt-3">
                      <Star size={16} color="#C9A227" fill="#C9A227" />
                      <Text className="text-warmBrown font-medium ml-1">{selectedBusiness.rating}</Text>
                      <Text className="text-gray-500 ml-1">({selectedBusiness.reviews} reviews)</Text>
                    </View>

                    {/* Description */}
                    <Text className="text-gray-600 mt-4 leading-6">{selectedBusiness.description}</Text>

                    {/* Details */}
                    <View className="mt-6 space-y-3">
                      <View className="flex-row items-center">
                        <MapPin size={18} color="#8B7355" />
                        <Text className="text-gray-600 ml-3">{selectedBusiness.address}</Text>
                      </View>
                      {selectedBusiness.phone && (
                        <View className="flex-row items-center mt-3">
                          <Phone size={18} color="#8B7355" />
                          <Text className="text-gray-600 ml-3">{selectedBusiness.phone}</Text>
                        </View>
                      )}
                      {selectedBusiness.website && (
                        <View className="flex-row items-center mt-3">
                          <Globe size={18} color="#8B7355" />
                          <Text className="text-terracotta-500 ml-3">{selectedBusiness.website}</Text>
                        </View>
                      )}
                      <View className="flex-row items-center mt-3">
                        <Clock size={18} color="#8B7355" />
                        <Text className="text-gray-600 ml-3">{selectedBusiness.hours}</Text>
                      </View>
                    </View>

                    {/* Action Buttons */}
                    <View className="mt-6 mb-4">
                      {/* Booking Management Buttons */}
                      <View className="flex-row mb-3">
                        <Pressable
                          onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                            setSelectedBusiness(null);
                            router.push({
                              pathname: '/business-appointments',
                              params: { businessId: selectedBusiness.id, businessName: selectedBusiness.name },
                            });
                          }}
                          className="flex-1 mr-2 bg-emerald-50 rounded-xl py-4 flex-row items-center justify-center"
                        >
                          <CalendarCheck size={18} color="#10B981" />
                          <Text className="text-emerald-600 font-semibold ml-2">Appointments</Text>
                        </Pressable>
                        <Pressable
                          onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                            setSelectedBusiness(null);
                            router.push({
                              pathname: '/manage-booking-calendar',
                              params: { businessId: selectedBusiness.id, businessName: selectedBusiness.name },
                            });
                          }}
                          className="flex-1 ml-2 bg-blue-50 rounded-xl py-4 flex-row items-center justify-center"
                        >
                          <Calendar size={18} color="#2563EB" />
                          <Text className="text-blue-600 font-semibold ml-2">Calendar</Text>
                        </Pressable>
                      </View>

                      {/* Edit/Delete Buttons */}
                      <View className="flex-row">
                        <Pressable
                          onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            // Would navigate to edit business screen
                            setSelectedBusiness(null);
                          }}
                          className="flex-1 mr-2 bg-forest-600 rounded-xl py-4 flex-row items-center justify-center"
                        >
                          <Edit3 size={18} color="#FFFFFF" />
                          <Text className="text-white font-semibold ml-2">Edit</Text>
                        </Pressable>
                        <Pressable
                          onPress={() => handleDeleteBusiness(selectedBusiness)}
                          className="flex-1 ml-2 bg-red-50 rounded-xl py-4 flex-row items-center justify-center"
                        >
                          <Trash2 size={18} color="#EF4444" />
                          <Text className="text-red-500 font-semibold ml-2">Delete</Text>
                        </Pressable>
                      </View>
                    </View>
                  </View>
                </ScrollView>
              </View>
            </View>
          </Modal>
        )}

        {/* Delete Confirmation Modal */}
        <Modal visible={showDeleteConfirm} transparent animationType="fade">
          <View className="flex-1 bg-black/50 items-center justify-center px-8">
            <View className="bg-white rounded-2xl p-6 w-full">
              <Text className="text-warmBrown font-bold text-lg text-center mb-2">
                Delete Business?
              </Text>
              <Text className="text-gray-500 text-center mb-6">
                This will permanently remove "{businessToDelete?.name}" from your profile and the directory.
              </Text>
              <View className="flex-row">
                <Pressable
                  onPress={() => {
                    setShowDeleteConfirm(false);
                    setBusinessToDelete(null);
                  }}
                  className="flex-1 bg-gray-100 rounded-xl py-3 mr-2"
                >
                  <Text className="text-warmBrown font-semibold text-center">Cancel</Text>
                </Pressable>
                <Pressable
                  onPress={confirmDelete}
                  className="flex-1 bg-red-500 rounded-xl py-3 ml-2"
                >
                  <Text className="text-white font-semibold text-center">Delete</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </View>
  );
}

function BusinessCard({
  business,
  onPress,
  onMenuPress,
}: {
  business: Business;
  onPress: () => void;
  onMenuPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} className="bg-white rounded-2xl mb-4 overflow-hidden shadow-sm">
      <Image
        source={{ uri: business.image }}
        style={{ width: '100%', height: 140 }}
        contentFit="cover"
      />
      <View className="p-4">
        <View className="flex-row items-start justify-between">
          <View className="flex-1">
            <View className="flex-row items-center">
              <Text className="text-warmBrown font-bold text-lg">{business.name}</Text>
              {business.isVerified && (
                <CheckCircle size={16} color="#1B4D3E" className="ml-2" />
              )}
            </View>
            <Text className="text-gray-500 text-sm mt-1">{business.category}</Text>
          </View>
          <Pressable onPress={onMenuPress} className="p-2 -mr-2 -mt-1">
            <MoreVertical size={20} color="#8B7355" />
          </Pressable>
        </View>

        <View className="flex-row items-center mt-3">
          <Star size={14} color="#C9A227" fill="#C9A227" />
          <Text className="text-warmBrown font-medium text-sm ml-1">{business.rating}</Text>
          <Text className="text-gray-400 text-sm ml-1">({business.reviews})</Text>
          <View className="flex-1" />
          <MapPin size={14} color="#8B7355" />
          <Text className="text-gray-500 text-sm ml-1">{business.location}</Text>
        </View>

        {business.isFeatured && (
          <View className="mt-3 bg-gold-50 rounded-lg px-3 py-2 self-start">
            <Text className="text-gold-700 text-xs font-medium">Featured Business</Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}
