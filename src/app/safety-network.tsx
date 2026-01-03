import { useState } from 'react';
import { View, Text, ScrollView, Pressable, Image, TextInput, Modal, Alert } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Shield, AlertTriangle, Phone, MapPin, Users, Plus, X, ChevronRight, Navigation, CheckCircle, Bell, UserPlus } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useStore } from '@/lib/store';
import { useAdvancedFeatures, type TrustedContact, type SafetyAlert, type WalkWithMe } from '@/lib/advancedFeatures';
import * as Haptics from 'expo-haptics';
import { v4 as uuidv4 } from 'uuid';

const MOCK_CONTACTS: TrustedContact[] = [
  {
    id: '1',
    userId: 'user1',
    contactId: '2',
    contactName: 'Amara Johnson',
    contactAvatar: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=100',
    contactPhone: '+1 (555) 123-4567',
    relationship: 'Sister',
    canReceiveAlerts: true,
    canSeeLocation: true,
    addedAt: '2024-06-01',
  },
  {
    id: '2',
    userId: 'user1',
    contactId: '3',
    contactName: 'Kwame Asante',
    contactAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
    contactPhone: '+1 (555) 987-6543',
    relationship: 'Best Friend',
    canReceiveAlerts: true,
    canSeeLocation: false,
    addedAt: '2024-07-15',
  },
];

export default function SafetyNetworkScreen() {
  const router = useRouter();
  const currentUser = useStore((s) => s.currentUser);
  const [showAddContact, setShowAddContact] = useState(false);
  const [showSosConfirm, setShowSosConfirm] = useState(false);
  const [walkWithMeActive, setWalkWithMeActive] = useState(false);

  const { trustedContacts, safetyAlerts, walkWithMeSessions, addTrustedContact, sendSafetyAlert, startWalkWithMe } = useAdvancedFeatures();
  const allContacts = trustedContacts.length > 0 ? trustedContacts : MOCK_CONTACTS;

  const handleSOS = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    setShowSosConfirm(true);
  };

  const confirmSOS = () => {
    const alert: SafetyAlert = {
      id: uuidv4(),
      senderId: currentUser?.id ?? 'guest',
      senderName: currentUser?.name ?? 'Guest',
      type: 'sos',
      status: 'active',
      location: { latitude: 29.7604, longitude: -95.3698, address: 'Current Location' },
      message: 'Emergency SOS triggered',
      recipients: allContacts.map((c) => c.contactId),
      responses: [],
      createdAt: new Date().toISOString(),
    };
    sendSafetyAlert(alert);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setShowSosConfirm(false);
    Alert.alert('SOS Sent', 'Your trusted contacts have been notified of your location.');
  };

  const startWalkWithMeSession = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setWalkWithMeActive(true);
    const session: WalkWithMe = {
      id: uuidv4(),
      userId: currentUser?.id ?? 'guest',
      userName: currentUser?.name ?? 'Guest',
      destination: 'Home',
      estimatedArrival: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      companions: allContacts.filter((c) => c.canSeeLocation).map((c) => c.contactId),
      checkInInterval: 5,
      lastCheckIn: new Date().toISOString(),
      status: 'active',
      createdAt: new Date().toISOString(),
    };
    startWalkWithMe(session);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FAF7F2' }} edges={['top']}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Safety Network',
          headerStyle: { backgroundColor: '#FAF7F2' },
          headerTintColor: '#1B4D3E',
        }}
      />

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* SOS Button */}
        <Animated.View entering={FadeInDown.delay(100)} className="items-center mt-6">
          <Pressable
            onPress={handleSOS}
            onLongPress={confirmSOS}
            delayLongPress={1000}
            className="w-40 h-40 rounded-full bg-red-500 items-center justify-center shadow-lg"
            style={{
              shadowColor: '#EF4444',
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.4,
              shadowRadius: 16,
              elevation: 12,
            }}
          >
            <AlertTriangle size={48} color="white" />
            <Text className="text-white font-bold text-xl mt-2">SOS</Text>
          </Pressable>
          <Text className="text-gray-500 text-sm mt-3">Hold for 1 second to send emergency alert</Text>
        </Animated.View>

        {/* Quick Actions */}
        <Animated.View entering={FadeInDown.delay(200)} className="flex-row mx-4 mt-6">
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              // Check-in with contacts
              Alert.alert('Check-in Sent', 'Your trusted contacts know you\'re safe.');
            }}
            className="flex-1 bg-emerald-800 rounded-2xl p-4 mr-2 items-center"
          >
            <CheckCircle size={28} color="white" />
            <Text className="text-white font-semibold mt-2">I'm Safe</Text>
            <Text className="text-white/70 text-xs">Check in</Text>
          </Pressable>

          <Pressable
            onPress={walkWithMeActive ? () => {
              setWalkWithMeActive(false);
              Alert.alert('Arrived Safely', 'Walk With Me session ended.');
            } : startWalkWithMeSession}
            className={`flex-1 rounded-2xl p-4 ml-2 items-center ${walkWithMeActive ? 'bg-amber-500' : 'bg-amber-100'}`}
          >
            <Navigation size={28} color={walkWithMeActive ? 'white' : '#D4673A'} />
            <Text className={`font-semibold mt-2 ${walkWithMeActive ? 'text-white' : 'text-amber-800'}`}>
              {walkWithMeActive ? 'I Arrived' : 'Walk With Me'}
            </Text>
            <Text className={`text-xs ${walkWithMeActive ? 'text-white/70' : 'text-amber-600'}`}>
              {walkWithMeActive ? 'Tap when safe' : 'Share journey'}
            </Text>
          </Pressable>
        </Animated.View>

        {/* Walk With Me Active Banner */}
        {walkWithMeActive && (
          <Animated.View entering={FadeInDown} className="mx-4 mt-4 bg-amber-50 rounded-2xl p-4 border border-amber-200">
            <View className="flex-row items-center">
              <View className="w-3 h-3 rounded-full bg-amber-500 mr-2" />
              <Text className="text-amber-800 font-bold">Walk With Me Active</Text>
            </View>
            <Text className="text-amber-700 text-sm mt-2">
              Your trusted contacts can see your location. Tap "I Arrived" when you reach your destination safely.
            </Text>
          </Animated.View>
        )}

        {/* Trusted Contacts */}
        <Animated.View entering={FadeInDown.delay(300)} className="mx-4 mt-6">
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-row items-center">
              <Users size={20} color="#1B4D3E" />
              <Text className="text-lg font-bold text-gray-900 ml-2">Trusted Contacts</Text>
            </View>
            <Pressable
              onPress={() => setShowAddContact(true)}
              className="bg-amber-100 p-2 rounded-full"
            >
              <UserPlus size={18} color="#D4673A" />
            </Pressable>
          </View>

          {allContacts.length === 0 ? (
            <View className="bg-white rounded-2xl p-8 items-center">
              <Users size={48} color="#D4673A" />
              <Text className="text-gray-900 font-semibold text-lg mt-4">No trusted contacts</Text>
              <Text className="text-gray-500 text-center mt-2">
                Add people you trust to receive your safety alerts
              </Text>
              <Pressable
                onPress={() => setShowAddContact(true)}
                className="bg-emerald-800 px-6 py-3 rounded-full mt-4"
              >
                <Text className="text-white font-semibold">Add Contact</Text>
              </Pressable>
            </View>
          ) : (
            allContacts.map((contact, index) => (
              <Animated.View key={contact.id} entering={FadeInDown.delay(300 + index * 50)}>
                <View className="bg-white rounded-xl p-4 mb-2 flex-row items-center">
                  <Image source={{ uri: contact.contactAvatar }} className="w-12 h-12 rounded-full" />
                  <View className="flex-1 ml-3">
                    <Text className="text-gray-900 font-semibold">{contact.contactName}</Text>
                    <Text className="text-gray-500 text-sm">{contact.relationship}</Text>
                    <View className="flex-row items-center mt-1">
                      {contact.canReceiveAlerts && (
                        <View className="bg-red-100 px-2 py-0.5 rounded-full mr-2">
                          <Text className="text-red-700 text-xs">SOS</Text>
                        </View>
                      )}
                      {contact.canSeeLocation && (
                        <View className="bg-blue-100 px-2 py-0.5 rounded-full">
                          <Text className="text-blue-700 text-xs">Location</Text>
                        </View>
                      )}
                    </View>
                  </View>
                  <Pressable
                    onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
                    className="bg-emerald-100 p-2 rounded-full"
                  >
                    <Phone size={18} color="#059669" />
                  </Pressable>
                </View>
              </Animated.View>
            ))
          )}
        </Animated.View>

        {/* Safety Tips */}
        <Animated.View entering={FadeInDown.delay(400)} className="mx-4 mt-6 mb-8">
          <View className="flex-row items-center mb-3">
            <Shield size={20} color="#1B4D3E" />
            <Text className="text-lg font-bold text-gray-900 ml-2">Safety Tips</Text>
          </View>

          <View className="bg-white rounded-2xl p-4">
            {[
              { title: 'Share your location', desc: 'Let trusted contacts know where you are when traveling' },
              { title: 'Use Walk With Me', desc: 'Automatically share your journey when walking alone' },
              { title: 'Check in regularly', desc: 'Send quick "I\'m safe" updates to ease worries' },
              { title: 'Know emergency numbers', desc: 'Save local emergency services in your phone' },
            ].map((tip, index) => (
              <View key={index} className={`flex-row items-start ${index < 3 ? 'mb-4 pb-4 border-b border-gray-100' : ''}`}>
                <View className="w-6 h-6 rounded-full bg-emerald-100 items-center justify-center mt-1">
                  <CheckCircle size={14} color="#059669" />
                </View>
                <View className="flex-1 ml-3">
                  <Text className="text-gray-900 font-semibold">{tip.title}</Text>
                  <Text className="text-gray-500 text-sm">{tip.desc}</Text>
                </View>
              </View>
            ))}
          </View>
        </Animated.View>
      </ScrollView>

      {/* SOS Confirmation Modal */}
      <Modal visible={showSosConfirm} transparent animationType="fade">
        <View className="flex-1 bg-black/50 items-center justify-center p-4">
          <View className="bg-white rounded-3xl p-6 w-full max-w-sm">
            <View className="items-center">
              <View className="w-20 h-20 rounded-full bg-red-100 items-center justify-center mb-4">
                <AlertTriangle size={40} color="#EF4444" />
              </View>
              <Text className="text-gray-900 font-bold text-xl">Send Emergency Alert?</Text>
              <Text className="text-gray-500 text-center mt-2">
                This will notify all your trusted contacts with your current location.
              </Text>
            </View>

            <View className="flex-row mt-6">
              <Pressable
                onPress={() => setShowSosConfirm(false)}
                className="flex-1 bg-gray-100 py-3 rounded-xl mr-2"
              >
                <Text className="text-gray-700 font-semibold text-center">Cancel</Text>
              </Pressable>
              <Pressable
                onPress={confirmSOS}
                className="flex-1 bg-red-500 py-3 rounded-xl ml-2"
              >
                <Text className="text-white font-semibold text-center">Send SOS</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add Contact Modal */}
      <Modal visible={showAddContact} animationType="slide" presentationStyle="pageSheet">
        <AddContactModal
          onClose={() => setShowAddContact(false)}
          onSubmit={(contact) => {
            addTrustedContact(contact);
            setShowAddContact(false);
          }}
        />
      </Modal>
    </SafeAreaView>
  );
}

function AddContactModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: (contact: TrustedContact) => void }) {
  const currentUser = useStore((s) => s.currentUser);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [relationship, setRelationship] = useState('');
  const [canReceiveAlerts, setCanReceiveAlerts] = useState(true);
  const [canSeeLocation, setCanSeeLocation] = useState(true);

  const handleSubmit = () => {
    if (!name.trim()) return;

    const contact: TrustedContact = {
      id: uuidv4(),
      userId: currentUser?.id ?? 'guest',
      contactId: uuidv4(),
      contactName: name.trim(),
      contactAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100',
      contactPhone: phone.trim() || undefined,
      relationship: relationship.trim() || 'Friend',
      canReceiveAlerts,
      canSeeLocation,
      addedAt: new Date().toISOString(),
    };

    onSubmit(contact);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FAF7F2' }}>
      <View className="flex-row items-center justify-between p-4 border-b border-gray-200 bg-white">
        <Pressable onPress={onClose}>
          <X size={24} color="#6B7280" />
        </Pressable>
        <Text className="text-lg font-bold text-gray-900">Add Trusted Contact</Text>
        <Pressable
          onPress={handleSubmit}
          disabled={!name.trim()}
          className={`px-4 py-2 rounded-full ${name.trim() ? 'bg-emerald-800' : 'bg-gray-200'}`}
        >
          <Text className={`font-semibold ${name.trim() ? 'text-white' : 'text-gray-400'}`}>
            Add
          </Text>
        </Pressable>
      </View>

      <ScrollView className="flex-1 p-4">
        <Text className="text-gray-700 font-medium mb-2">Name</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Contact's name"
          className="bg-white p-4 rounded-xl text-gray-900 mb-4"
        />

        <Text className="text-gray-700 font-medium mb-2">Phone Number</Text>
        <TextInput
          value={phone}
          onChangeText={setPhone}
          placeholder="+1 (555) 123-4567"
          keyboardType="phone-pad"
          className="bg-white p-4 rounded-xl text-gray-900 mb-4"
        />

        <Text className="text-gray-700 font-medium mb-2">Relationship</Text>
        <TextInput
          value={relationship}
          onChangeText={setRelationship}
          placeholder="e.g., Sister, Best Friend, Neighbor"
          className="bg-white p-4 rounded-xl text-gray-900 mb-4"
        />

        <Text className="text-gray-700 font-medium mb-3">Permissions</Text>
        <View className="bg-white rounded-xl p-4">
          <Pressable
            onPress={() => setCanReceiveAlerts(!canReceiveAlerts)}
            className="flex-row items-center justify-between py-3"
          >
            <View className="flex-row items-center">
              <Bell size={20} color="#EF4444" />
              <Text className="text-gray-900 font-medium ml-3">Receive SOS Alerts</Text>
            </View>
            <View className={`w-12 h-7 rounded-full p-1 ${canReceiveAlerts ? 'bg-emerald-500' : 'bg-gray-300'}`}>
              <View className={`w-5 h-5 rounded-full bg-white ${canReceiveAlerts ? 'self-end' : 'self-start'}`} />
            </View>
          </Pressable>

          <View className="border-t border-gray-100 my-2" />

          <Pressable
            onPress={() => setCanSeeLocation(!canSeeLocation)}
            className="flex-row items-center justify-between py-3"
          >
            <View className="flex-row items-center">
              <MapPin size={20} color="#3B82F6" />
              <Text className="text-gray-900 font-medium ml-3">See My Location</Text>
            </View>
            <View className={`w-12 h-7 rounded-full p-1 ${canSeeLocation ? 'bg-emerald-500' : 'bg-gray-300'}`}>
              <View className={`w-5 h-5 rounded-full bg-white ${canSeeLocation ? 'self-end' : 'self-start'}`} />
            </View>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
