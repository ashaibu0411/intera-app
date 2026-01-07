import React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';

export default function PrivacyPolicyScreen() {
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
          <Text className="text-xl font-bold text-warmBrown">Privacy Policy</Text>
        </Animated.View>

        <ScrollView
          className="flex-1 px-5"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          <Animated.View entering={FadeInUp.duration(400).delay(100)}>
            <Text className="text-gray-500 text-sm mt-4 mb-6">
              Last Updated: December 30, 2025
            </Text>

            <Text className="text-gray-700 leading-6 mb-6">
              Diaspora ("we," "our," or "us") values your privacy. This Privacy Policy explains how we collect, use, disclose, and protect your information when you use the Diaspora mobile application ("App").
            </Text>

            <Text className="text-gray-700 leading-6 mb-6">
              By using Diaspora, you agree to the collection and use of information in accordance with this Privacy Policy.
            </Text>

            {/* Section 1 */}
            <Text className="text-lg font-bold text-warmBrown mb-3">
              1. Information We Collect
            </Text>
            <Text className="text-gray-700 leading-6 mb-2">
              We may collect the following types of information when you use Diaspora:
            </Text>

            <Text className="text-base font-semibold text-warmBrown mt-3 mb-2">
              a. Personal Information
            </Text>
            <View className="pl-4 mb-3">
              <Text className="text-gray-700 leading-6">• Name</Text>
              <Text className="text-gray-700 leading-6">• Email address</Text>
              <Text className="text-gray-700 leading-6">• Profile information (such as username, profile photo, bio)</Text>
              <Text className="text-gray-700 leading-6">• Any information you choose to provide within the app</Text>
            </View>

            <Text className="text-base font-semibold text-warmBrown mt-3 mb-2">
              b. User-Generated Content
            </Text>
            <View className="pl-4 mb-3">
              <Text className="text-gray-700 leading-6">• Posts, messages, comments, and other content you share within the Diaspora community</Text>
            </View>

            <Text className="text-base font-semibold text-warmBrown mt-3 mb-2">
              c. Device & Technical Information
            </Text>
            <View className="pl-4 mb-3">
              <Text className="text-gray-700 leading-6">• Device type and operating system</Text>
              <Text className="text-gray-700 leading-6">• App version</Text>
              <Text className="text-gray-700 leading-6">• Crash logs and performance data (used to improve app stability)</Text>
            </View>

            <Text className="text-base font-semibold text-warmBrown mt-3 mb-2">
              d. Payment Information
            </Text>
            <View className="pl-4 mb-6">
              <Text className="text-gray-700 leading-6">• Subscription and purchase information is processed by third-party payment providers</Text>
              <Text className="text-gray-700 leading-6">• Diaspora does not store your full payment card details</Text>
            </View>

            {/* Section 2 */}
            <Text className="text-lg font-bold text-warmBrown mb-3">
              2. How We Use Your Information
            </Text>
            <Text className="text-gray-700 leading-6 mb-2">
              We use the information we collect to:
            </Text>
            <View className="pl-4 mb-6">
              <Text className="text-gray-700 leading-6">• Create and manage user accounts</Text>
              <Text className="text-gray-700 leading-6">• Enable community features and messaging</Text>
              <Text className="text-gray-700 leading-6">• Provide app functionality and user support</Text>
              <Text className="text-gray-700 leading-6">• Process subscriptions and purchases</Text>
              <Text className="text-gray-700 leading-6">• Improve app performance, features, and user experience</Text>
              <Text className="text-gray-700 leading-6">• Communicate important updates or service notices</Text>
            </View>

            {/* Section 3 */}
            <Text className="text-lg font-bold text-warmBrown mb-3">
              3. Third-Party Services
            </Text>
            <Text className="text-gray-700 leading-6 mb-3">
              Diaspora uses trusted third-party services to operate the app:
            </Text>

            <Text className="text-base font-semibold text-warmBrown mt-3 mb-2">
              a. Supabase
            </Text>
            <Text className="text-gray-700 leading-6 mb-2">We use Supabase for:</Text>
            <View className="pl-4 mb-3">
              <Text className="text-gray-700 leading-6">• User authentication</Text>
              <Text className="text-gray-700 leading-6">• Secure data storage</Text>
              <Text className="text-gray-700 leading-6">• Backend services</Text>
            </View>
            <Text className="text-gray-700 leading-6 mb-4">
              Supabase processes data in accordance with its privacy and security standards.
            </Text>

            <Text className="text-base font-semibold text-warmBrown mt-3 mb-2">
              b. RevenueCat
            </Text>
            <Text className="text-gray-700 leading-6 mb-2">
              If subscriptions or in-app purchases are enabled, RevenueCat is used to:
            </Text>
            <View className="pl-4 mb-3">
              <Text className="text-gray-700 leading-6">• Manage subscriptions</Text>
              <Text className="text-gray-700 leading-6">• Handle purchase validation and entitlements</Text>
            </View>
            <Text className="text-gray-700 leading-6 mb-6">
              RevenueCat does not share personal data beyond what is necessary to manage subscriptions.
            </Text>

            {/* Section 4 */}
            <Text className="text-lg font-bold text-warmBrown mb-3">
              4. Data Sharing
            </Text>
            <Text className="text-gray-700 leading-6 mb-2">
              We do not sell your personal information.
            </Text>
            <Text className="text-gray-700 leading-6 mb-2">We may share data only:</Text>
            <View className="pl-4 mb-6">
              <Text className="text-gray-700 leading-6">• With service providers necessary to operate Diaspora</Text>
              <Text className="text-gray-700 leading-6">• To comply with legal obligations</Text>
              <Text className="text-gray-700 leading-6">• To protect the rights, safety, or security of users and the platform</Text>
            </View>

            {/* Section 5 */}
            <Text className="text-lg font-bold text-warmBrown mb-3">
              5. Data Retention
            </Text>
            <Text className="text-gray-700 leading-6 mb-2">
              We retain your information only for as long as necessary to:
            </Text>
            <View className="pl-4 mb-6">
              <Text className="text-gray-700 leading-6">• Provide our services</Text>
              <Text className="text-gray-700 leading-6">• Comply with legal obligations</Text>
              <Text className="text-gray-700 leading-6">• Resolve disputes and enforce policies</Text>
            </View>

            {/* Section 6 */}
            <Text className="text-lg font-bold text-warmBrown mb-3">
              6. User Rights & Choices
            </Text>
            <Text className="text-gray-700 leading-6 mb-2">You have the right to:</Text>
            <View className="pl-4 mb-3">
              <Text className="text-gray-700 leading-6">• Access your personal information</Text>
              <Text className="text-gray-700 leading-6">• Update or correct your information</Text>
              <Text className="text-gray-700 leading-6">• Request account deletion and data removal</Text>
            </View>
            <Text className="text-gray-700 leading-6 mb-6">
              You may request deletion by contacting us at the email below. Account deletion will permanently remove your data unless retention is required by law.
            </Text>

            {/* Section 7 */}
            <Text className="text-lg font-bold text-warmBrown mb-3">
              7. Security
            </Text>
            <Text className="text-gray-700 leading-6 mb-6">
              We implement reasonable administrative and technical safeguards to protect your information. However, no system is completely secure, and we cannot guarantee absolute security.
            </Text>

            {/* Section 8 */}
            <Text className="text-lg font-bold text-warmBrown mb-3">
              8. Children's Privacy
            </Text>
            <Text className="text-gray-700 leading-6 mb-6">
              Diaspora is not intended for children under the age of 13. We do not knowingly collect personal information from children.
            </Text>

            {/* Section 9 */}
            <Text className="text-lg font-bold text-warmBrown mb-3">
              9. Changes to This Privacy Policy
            </Text>
            <Text className="text-gray-700 leading-6 mb-6">
              We may update this Privacy Policy from time to time. Changes will be posted on this page, and continued use of the app constitutes acceptance of the updated policy.
            </Text>

            {/* Section 10 */}
            <Text className="text-lg font-bold text-warmBrown mb-3">
              10. Contact Us
            </Text>
            <Text className="text-gray-700 leading-6 mb-2">
              If you have questions, concerns, or requests regarding this Privacy Policy or your data, contact us at:
            </Text>
            <Text className="text-terracotta font-semibold mb-6">
              Email: afroconnect63@gmail.com
            </Text>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
