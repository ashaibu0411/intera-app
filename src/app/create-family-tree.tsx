import { useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, Modal } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import {
  TreePine,
  ChevronLeft,
  ChevronRight,
  Check,
  User,
  Calendar,
  MapPin,
  Users,
  Plus,
  X,
  Globe,
  Lock,
  Heart,
} from 'lucide-react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

interface FamilyMember {
  id: string;
  name: string;
  relationship: string;
  birthYear?: string;
  deathYear?: string;
  birthPlace?: string;
  bio?: string;
}

const RELATIONSHIP_OPTIONS = [
  'Self',
  'Spouse',
  'Parent',
  'Child',
  'Sibling',
  'Grandparent',
  'Grandchild',
  'Great-grandparent',
  'Great-grandchild',
  'Aunt/Uncle',
  'Niece/Nephew',
  'Cousin',
  'Other',
];

export default function CreateFamilyTreeScreen() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [treeName, setTreeName] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [newMember, setNewMember] = useState<Partial<FamilyMember>>({
    relationship: 'Self',
  });

  const handleNext = () => {
    if (step < 3) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setStep(step + 1);
    } else {
      handleCreate();
    }
  };

  const handleBack = () => {
    if (step > 1) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setStep(step - 1);
    }
  };

  const handleCreate = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.back();
  };

  const handleAddMember = () => {
    if (newMember.name && newMember.relationship) {
      setMembers([
        ...members,
        {
          id: Date.now().toString(),
          name: newMember.name,
          relationship: newMember.relationship,
          birthYear: newMember.birthYear,
          deathYear: newMember.deathYear,
          birthPlace: newMember.birthPlace,
          bio: newMember.bio,
        },
      ]);
      setNewMember({ relationship: 'Self' });
      setShowAddMemberModal(false);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  const removeMember = (id: string) => {
    setMembers(members.filter(m => m.id !== id));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const canProceed = () => {
    if (step === 1) return treeName.trim().length > 0;
    if (step === 2) return members.length > 0;
    return true;
  };

  const renderStep1 = () => (
    <Animated.View entering={FadeInDown.delay(100)} className="flex-1">
      <Text className="text-gray-900 font-bold text-lg mb-2">Name Your Family Tree</Text>
      <Text className="text-gray-500 text-sm mb-6">
        Give your family tree a name that represents your lineage
      </Text>

      <View className="bg-white rounded-xl p-4 mb-4">
        <Text className="text-gray-700 font-medium mb-2">Tree Name *</Text>
        <TextInput
          value={treeName}
          onChangeText={setTreeName}
          placeholder="e.g., The Okonkwo Family"
          placeholderTextColor="#9CA3AF"
          className="bg-gray-50 rounded-xl p-4 text-gray-900"
        />
      </View>

      <View className="bg-white rounded-xl p-4 mb-4">
        <Text className="text-gray-700 font-medium mb-2">Description</Text>
        <TextInput
          value={description}
          onChangeText={setDescription}
          placeholder="Tell the story of your family..."
          placeholderTextColor="#9CA3AF"
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          className="bg-gray-50 rounded-xl p-4 text-gray-900 min-h-[100px]"
        />
      </View>

      <View className="bg-white rounded-xl p-4">
        <Text className="text-gray-700 font-medium mb-3">Privacy</Text>
        <View className="flex-row">
          <Pressable
            onPress={() => setIsPublic(false)}
            className={`flex-1 flex-row items-center justify-center p-3 rounded-l-xl border ${
              !isPublic ? 'bg-emerald-50 border-emerald-500' : 'bg-gray-50 border-gray-200'
            }`}
          >
            <Lock size={18} color={!isPublic ? '#1B4D3E' : '#9CA3AF'} />
            <Text className={`ml-2 font-medium ${!isPublic ? 'text-emerald-800' : 'text-gray-500'}`}>
              Private
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setIsPublic(true)}
            className={`flex-1 flex-row items-center justify-center p-3 rounded-r-xl border-t border-r border-b ${
              isPublic ? 'bg-emerald-50 border-emerald-500' : 'bg-gray-50 border-gray-200'
            }`}
          >
            <Globe size={18} color={isPublic ? '#1B4D3E' : '#9CA3AF'} />
            <Text className={`ml-2 font-medium ${isPublic ? 'text-emerald-800' : 'text-gray-500'}`}>
              Public
            </Text>
          </Pressable>
        </View>
        <Text className="text-gray-400 text-xs mt-2">
          {isPublic ? 'Anyone can view your family tree' : 'Only you and invited members can view'}
        </Text>
      </View>
    </Animated.View>
  );

  const renderStep2 = () => (
    <Animated.View entering={FadeInDown.delay(100)} className="flex-1">
      <Text className="text-gray-900 font-bold text-lg mb-2">Add Family Members</Text>
      <Text className="text-gray-500 text-sm mb-6">
        Start with yourself and add your relatives
      </Text>

      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setShowAddMemberModal(true);
        }}
        className="bg-emerald-800 rounded-xl p-4 flex-row items-center justify-center mb-4"
      >
        <Plus size={20} color="white" />
        <Text className="text-white font-semibold ml-2">Add Family Member</Text>
      </Pressable>

      {members.length === 0 ? (
        <View className="bg-amber-50 rounded-xl p-4">
          <Text className="text-amber-800 text-center">
            Add at least one family member to continue
          </Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          {members.map((member, idx) => (
            <Animated.View
              key={member.id}
              entering={FadeInUp.delay(idx * 50)}
              className="bg-white rounded-xl p-4 mb-3"
            >
              <View className="flex-row items-center">
                <View className="w-12 h-12 rounded-full bg-emerald-100 items-center justify-center">
                  <Text className="text-emerald-800 font-bold text-lg">
                    {member.name.split(' ').map(n => n[0]).join('')}
                  </Text>
                </View>
                <View className="flex-1 ml-3">
                  <Text className="text-gray-900 font-semibold">{member.name}</Text>
                  <Text className="text-emerald-700 text-sm">{member.relationship}</Text>
                  {member.birthYear && (
                    <Text className="text-gray-400 text-xs">
                      {member.birthYear}{member.deathYear ? ` - ${member.deathYear}` : ''}
                    </Text>
                  )}
                </View>
                <Pressable
                  onPress={() => removeMember(member.id)}
                  className="p-2"
                >
                  <X size={18} color="#EF4444" />
                </Pressable>
              </View>
            </Animated.View>
          ))}
        </ScrollView>
      )}
    </Animated.View>
  );

  const renderStep3 = () => (
    <Animated.View entering={FadeInDown.delay(100)} className="flex-1">
      <Text className="text-gray-900 font-bold text-lg mb-2">Review Your Family Tree</Text>
      <Text className="text-gray-500 text-sm mb-6">
        Make sure everything looks good before creating
      </Text>

      <View className="bg-emerald-800 rounded-2xl p-5 mb-4">
        <View className="flex-row items-center justify-between">
          <View className="flex-1">
            <Text className="text-white font-bold text-xl">{treeName}</Text>
            {description && (
              <Text className="text-white/80 text-sm mt-1" numberOfLines={2}>{description}</Text>
            )}
          </View>
          <View className="bg-white/20 p-3 rounded-full">
            <TreePine size={28} color="white" />
          </View>
        </View>

        <View className="flex-row items-center mt-4 pt-4 border-t border-white/20">
          <View className="flex-row items-center flex-1">
            <Users size={16} color="white" />
            <Text className="text-white ml-2">{members.length} members</Text>
          </View>
          <View className="flex-row items-center">
            {isPublic ? (
              <>
                <Globe size={16} color="white" />
                <Text className="text-white ml-2">Public</Text>
              </>
            ) : (
              <>
                <Lock size={16} color="white" />
                <Text className="text-white ml-2">Private</Text>
              </>
            )}
          </View>
        </View>
      </View>

      <View className="bg-white rounded-xl p-4">
        <Text className="text-gray-900 font-semibold mb-3">Family Members</Text>
        {members.map((member, idx) => (
          <View
            key={member.id}
            className={`flex-row items-center py-2 ${idx !== members.length - 1 ? 'border-b border-gray-100' : ''}`}
          >
            <View className="w-8 h-8 rounded-full bg-emerald-100 items-center justify-center">
              <Text className="text-emerald-800 font-bold text-xs">
                {member.name.split(' ').map(n => n[0]).join('')}
              </Text>
            </View>
            <View className="flex-1 ml-2">
              <Text className="text-gray-900 text-sm">{member.name}</Text>
              <Text className="text-gray-500 text-xs">{member.relationship}</Text>
            </View>
          </View>
        ))}
      </View>

      <View className="bg-amber-50 rounded-xl p-4 mt-4">
        <View className="flex-row items-center mb-2">
          <Heart size={16} color="#92400E" />
          <Text className="text-amber-800 font-semibold ml-2">Preserve Your Legacy</Text>
        </View>
        <Text className="text-amber-700 text-sm">
          You can add photos, stories, and more details to each family member after creating your tree.
        </Text>
      </View>
    </Animated.View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#FAF7F2' }}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Create Family Tree',
          headerStyle: { backgroundColor: '#FAF7F2' },
          headerTintColor: '#1B4D3E',
        }}
      />

      <View className="flex-1 px-4">
        {/* Progress Steps */}
        <View className="flex-row items-center justify-center py-4">
          {[1, 2, 3].map((s) => (
            <View key={s} className="flex-row items-center">
              <View
                className={`w-8 h-8 rounded-full items-center justify-center ${
                  step >= s ? 'bg-emerald-800' : 'bg-gray-200'
                }`}
              >
                {step > s ? (
                  <Check size={16} color="white" />
                ) : (
                  <Text className={step >= s ? 'text-white font-bold' : 'text-gray-500 font-bold'}>
                    {s}
                  </Text>
                )}
              </View>
              {s < 3 && (
                <View className={`w-12 h-1 mx-1 ${step > s ? 'bg-emerald-800' : 'bg-gray-200'}`} />
              )}
            </View>
          ))}
        </View>

        {/* Step Content */}
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
        </ScrollView>

        {/* Navigation */}
        <View className="flex-row py-4">
          {step > 1 && (
            <Pressable
              onPress={handleBack}
              className="flex-1 bg-gray-100 py-4 rounded-xl mr-2 flex-row items-center justify-center"
            >
              <ChevronLeft size={20} color="#1B4D3E" />
              <Text className="text-emerald-800 font-semibold ml-1">Back</Text>
            </Pressable>
          )}
          <Pressable
            onPress={handleNext}
            disabled={!canProceed()}
            className={`flex-1 py-4 rounded-xl flex-row items-center justify-center ${
              canProceed() ? 'bg-emerald-800' : 'bg-gray-300'
            } ${step > 1 ? 'ml-2' : ''}`}
          >
            <Text className={`font-semibold ${canProceed() ? 'text-white' : 'text-gray-500'}`}>
              {step === 3 ? 'Create Tree' : 'Next'}
            </Text>
            {step < 3 && <ChevronRight size={20} color={canProceed() ? 'white' : '#9CA3AF'} />}
          </Pressable>
        </View>
      </View>

      {/* Add Member Modal */}
      <Modal
        visible={showAddMemberModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddMemberModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl p-6 max-h-[90%]">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-gray-900 font-bold text-lg">Add Family Member</Text>
              <Pressable onPress={() => setShowAddMemberModal(false)}>
                <X size={24} color="#6B7280" />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View className="mb-4">
                <Text className="text-gray-700 font-medium mb-2">Name *</Text>
                <TextInput
                  value={newMember.name ?? ''}
                  onChangeText={(text) => setNewMember({ ...newMember, name: text })}
                  placeholder="Full name"
                  placeholderTextColor="#9CA3AF"
                  className="bg-gray-50 rounded-xl p-4 text-gray-900"
                />
              </View>

              <View className="mb-4">
                <Text className="text-gray-700 font-medium mb-2">Relationship *</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }}>
                  <View className="flex-row">
                    {RELATIONSHIP_OPTIONS.map((rel) => (
                      <Pressable
                        key={rel}
                        onPress={() => setNewMember({ ...newMember, relationship: rel })}
                        className={`px-4 py-2 rounded-full mr-2 ${
                          newMember.relationship === rel ? 'bg-emerald-800' : 'bg-gray-100'
                        }`}
                      >
                        <Text
                          className={
                            newMember.relationship === rel ? 'text-white font-medium' : 'text-gray-700'
                          }
                        >
                          {rel}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </ScrollView>
              </View>

              <View className="flex-row mb-4">
                <View className="flex-1 mr-2">
                  <Text className="text-gray-700 font-medium mb-2">Birth Year</Text>
                  <TextInput
                    value={newMember.birthYear ?? ''}
                    onChangeText={(text) => setNewMember({ ...newMember, birthYear: text })}
                    placeholder="e.g., 1950"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="number-pad"
                    className="bg-gray-50 rounded-xl p-4 text-gray-900"
                  />
                </View>
                <View className="flex-1 ml-2">
                  <Text className="text-gray-700 font-medium mb-2">Death Year</Text>
                  <TextInput
                    value={newMember.deathYear ?? ''}
                    onChangeText={(text) => setNewMember({ ...newMember, deathYear: text })}
                    placeholder="Leave blank if living"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="number-pad"
                    className="bg-gray-50 rounded-xl p-4 text-gray-900"
                  />
                </View>
              </View>

              <View className="mb-4">
                <Text className="text-gray-700 font-medium mb-2">Birth Place</Text>
                <TextInput
                  value={newMember.birthPlace ?? ''}
                  onChangeText={(text) => setNewMember({ ...newMember, birthPlace: text })}
                  placeholder="e.g., Lagos, Nigeria"
                  placeholderTextColor="#9CA3AF"
                  className="bg-gray-50 rounded-xl p-4 text-gray-900"
                />
              </View>

              <View className="mb-6">
                <Text className="text-gray-700 font-medium mb-2">Bio / Story</Text>
                <TextInput
                  value={newMember.bio ?? ''}
                  onChangeText={(text) => setNewMember({ ...newMember, bio: text })}
                  placeholder="Share their story, achievements, memories..."
                  placeholderTextColor="#9CA3AF"
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                  className="bg-gray-50 rounded-xl p-4 text-gray-900 min-h-[80px]"
                />
              </View>

              <Pressable
                onPress={handleAddMember}
                disabled={!newMember.name}
                className={`py-4 rounded-xl items-center mb-4 ${
                  newMember.name ? 'bg-emerald-800' : 'bg-gray-300'
                }`}
              >
                <Text className={`font-semibold ${newMember.name ? 'text-white' : 'text-gray-500'}`}>
                  Add Member
                </Text>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}
