import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, Modal, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AlertTriangle, Shield, Star, X, Clock, ChevronRight } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import {
  checkForSuspiciousNewAccount,
  getPermanentReviewsForUser,
  ArchivedReview,
} from '@/lib/trust-api';

interface ReviewHistoryBadgeProps {
  userId: string;
  compact?: boolean;
}

export function ReviewHistoryBadge({ userId, compact = false }: ReviewHistoryBadgeProps) {
  const [loading, setLoading] = useState(true);
  const [isSuspicious, setIsSuspicious] = useState(false);
  const [suspiciousReason, setSuspiciousReason] = useState<string | null>(null);
  const [previousBadReviews, setPreviousBadReviews] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [archivedReviews, setArchivedReviews] = useState<ArchivedReview[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);

  useEffect(() => {
    if (!userId) return;

    const checkHistory = async () => {
      try {
        const result = await checkForSuspiciousNewAccount(userId);
        setIsSuspicious(result.isSuspicious);
        setSuspiciousReason(result.reason);
        setPreviousBadReviews(result.previousBadReviews);
      } catch (error) {
        console.error('Error checking review history:', error);
      } finally {
        setLoading(false);
      }
    };

    checkHistory();
  }, [userId]);

  const openHistoryModal = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowModal(true);
    setLoadingReviews(true);

    try {
      const reviews = await getPermanentReviewsForUser(userId);
      setArchivedReviews(reviews);
    } catch (error) {
      console.error('Error loading archived reviews:', error);
    } finally {
      setLoadingReviews(false);
    }
  };

  if (loading) {
    return null;
  }

  // Don't show anything if account is clean
  if (!isSuspicious && previousBadReviews === 0) {
    return null;
  }

  // Show warning badge
  if (compact) {
    return (
      <Pressable
        onPress={openHistoryModal}
        className="flex-row items-center bg-amber-50 border border-amber-200 rounded-full px-2.5 py-1"
      >
        <AlertTriangle size={12} color="#D97706" />
        <Text className="text-amber-700 text-xs font-medium ml-1">
          {previousBadReviews} past issue{previousBadReviews !== 1 ? 's' : ''}
        </Text>
      </Pressable>
    );
  }

  return (
    <>
      <Pressable
        onPress={openHistoryModal}
        className="bg-amber-50 border border-amber-200 rounded-2xl p-4"
      >
        <View className="flex-row items-start">
          <View className="w-10 h-10 bg-amber-100 rounded-full items-center justify-center">
            <AlertTriangle size={20} color="#D97706" />
          </View>
          <View className="flex-1 ml-3">
            <Text className="text-amber-800 font-bold text-base">Review History Notice</Text>
            <Text className="text-amber-700 text-sm mt-1">
              {suspiciousReason || `This user has ${previousBadReviews} historical negative review(s).`}
            </Text>
            <View className="flex-row items-center mt-2">
              <Text className="text-amber-600 text-sm font-medium">View full history</Text>
              <ChevronRight size={14} color="#D97706" />
            </View>
          </View>
        </View>
      </Pressable>

      {/* Review History Modal */}
      <Modal visible={showModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView className="flex-1 bg-cream">
          <View className="px-5 pt-4 pb-3 flex-row items-center justify-between border-b border-gray-100">
            <View className="flex-1">
              <Text className="text-xl font-bold text-warmBrown">Review History</Text>
              <Text className="text-gray-500 text-sm mt-0.5">
                Permanent record - cannot be deleted
              </Text>
            </View>
            <Pressable
              onPress={() => setShowModal(false)}
              className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center"
            >
              <X size={20} color="#2D1F1A" />
            </Pressable>
          </View>

          <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
            {/* Warning Banner */}
            {isSuspicious && (
              <View className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mt-4">
                <View className="flex-row items-center">
                  <AlertTriangle size={20} color="#D97706" />
                  <Text className="text-amber-800 font-semibold ml-2">Account Alert</Text>
                </View>
                <Text className="text-amber-700 text-sm mt-2">{suspiciousReason}</Text>
              </View>
            )}

            {/* Explanation */}
            <View className="bg-blue-50 border border-blue-100 rounded-2xl p-4 mt-4">
              <View className="flex-row items-center">
                <Shield size={18} color="#2563EB" />
                <Text className="text-blue-800 font-semibold ml-2">How This Works</Text>
              </View>
              <Text className="text-blue-700 text-sm mt-2">
                All reviews are permanently archived. Even if a business is deleted or the owner creates a new account, their review history follows them. This protects the community from repeat offenders.
              </Text>
            </View>

            {/* Archived Reviews */}
            <View className="mt-6 mb-4">
              <Text className="text-warmBrown font-bold text-lg mb-3">
                Archived Reviews ({archivedReviews.length})
              </Text>

              {loadingReviews ? (
                <View className="py-8 items-center">
                  <ActivityIndicator color="#1B4D3E" />
                  <Text className="text-gray-500 mt-2">Loading history...</Text>
                </View>
              ) : archivedReviews.length === 0 ? (
                <View className="bg-white rounded-2xl p-6 items-center">
                  <Shield size={32} color="#10B981" />
                  <Text className="text-warmBrown font-semibold mt-3">Clean Record</Text>
                  <Text className="text-gray-500 text-center mt-1">
                    No archived reviews found for this user.
                  </Text>
                </View>
              ) : (
                archivedReviews.map((review) => (
                  <View
                    key={review.id}
                    className={`rounded-2xl p-4 mb-3 ${
                      review.rating <= 2
                        ? 'bg-red-50 border border-red-100'
                        : review.rating >= 4
                        ? 'bg-green-50 border border-green-100'
                        : 'bg-white border border-gray-100'
                    }`}
                  >
                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            size={14}
                            color={star <= review.rating ? '#C9A227' : '#D1D5DB'}
                            fill={star <= review.rating ? '#C9A227' : 'transparent'}
                          />
                        ))}
                      </View>
                      <Text className="text-xs text-gray-400">
                        {review.review_type === 'business' ? 'Business' : 'Service'}
                      </Text>
                    </View>

                    {review.review_text && (
                      <Text className="text-gray-700 mt-2">{review.review_text}</Text>
                    )}

                    <View className="flex-row items-center mt-3 pt-3 border-t border-gray-100">
                      <Clock size={12} color="#9CA3AF" />
                      <Text className="text-gray-400 text-xs ml-1">
                        {new Date(review.original_created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </Text>
                      {review.reviewer_name && (
                        <>
                          <Text className="text-gray-300 mx-2">•</Text>
                          <Text className="text-gray-500 text-xs">by {review.reviewer_name}</Text>
                        </>
                      )}
                    </View>
                  </View>
                ))
              )}
            </View>

            <View className="h-10" />
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </>
  );
}
