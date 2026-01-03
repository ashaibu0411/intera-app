import { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, Image } from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  TreePine,
  Users,
  Plus,
  ChevronRight,
  Edit3,
  Share2,
  Lock,
  Globe,
  Calendar,
  MapPin,
  Heart,
} from 'lucide-react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

interface FamilyMember {
  id: string;
  name: string;
  relationship: string;
  birthYear?: number;
  deathYear?: number;
  birthPlace?: string;
  photo?: string;
  parentIds: string[];
  spouseIds: string[];
  bio?: string;
}

interface FamilyTree {
  id: string;
  name: string;
  description: string;
  members: FamilyMember[];
  isPublic: boolean;
  createdAt: string;
}

const MOCK_TREES: Record<string, FamilyTree> = {
  '1': {
    id: '1',
    name: 'The Okonkwo Family',
    description: 'Tracing our roots from Anambra State, Nigeria back to the 1800s.',
    isPublic: false,
    createdAt: '2024-06-01',
    members: [
      {
        id: 'm1',
        name: 'Chief Okonkwo',
        relationship: 'Great-great-grandfather',
        birthYear: 1850,
        deathYear: 1920,
        birthPlace: 'Nnewi, Anambra State, Nigeria',
        parentIds: [],
        spouseIds: ['m2'],
        bio: 'A respected leader in the community, known for his wisdom and farming skills.',
      },
      {
        id: 'm2',
        name: 'Mama Nkechi',
        relationship: 'Great-great-grandmother',
        birthYear: 1858,
        deathYear: 1935,
        birthPlace: 'Onitsha, Anambra State, Nigeria',
        parentIds: [],
        spouseIds: ['m1'],
        bio: 'A skilled trader who expanded the family business.',
      },
      {
        id: 'm3',
        name: 'Chukwuemeka Okonkwo',
        relationship: 'Great-grandfather',
        birthYear: 1880,
        deathYear: 1960,
        birthPlace: 'Nnewi, Anambra State, Nigeria',
        parentIds: ['m1', 'm2'],
        spouseIds: ['m4'],
        bio: 'First in the family to receive Western education.',
      },
      {
        id: 'm4',
        name: 'Adaeze Okonkwo',
        relationship: 'Great-grandmother',
        birthYear: 1885,
        deathYear: 1970,
        birthPlace: 'Awka, Anambra State, Nigeria',
        parentIds: [],
        spouseIds: ['m3'],
      },
      {
        id: 'm5',
        name: 'Emmanuel Okonkwo',
        relationship: 'Grandfather',
        birthYear: 1920,
        deathYear: 2005,
        birthPlace: 'Lagos, Nigeria',
        parentIds: ['m3', 'm4'],
        spouseIds: ['m6'],
        bio: 'Engineer who helped build Nigeria\'s first highway.',
      },
      {
        id: 'm6',
        name: 'Grace Okonkwo',
        relationship: 'Grandmother',
        birthYear: 1928,
        birthPlace: 'Enugu, Nigeria',
        parentIds: [],
        spouseIds: ['m5'],
        bio: 'Teacher and community leader. Still sharing stories at 96!',
      },
    ],
  },
};

export default function FamilyTreeScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const [tree, setTree] = useState<FamilyTree | null>(null);
  const [selectedMember, setSelectedMember] = useState<FamilyMember | null>(null);

  useEffect(() => {
    if (id && MOCK_TREES[id]) {
      setTree(MOCK_TREES[id]);
    }
  }, [id]);

  if (!tree) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#FAF7F2' }} edges={['top']}>
        <Stack.Screen options={{ headerShown: true, title: 'Family Tree', headerStyle: { backgroundColor: '#FAF7F2' }, headerTintColor: '#1B4D3E' }} />
        <View className="flex-1 items-center justify-center">
          <Text className="text-gray-500">Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Group members by generation (simplified)
  const generations = [
    tree.members.filter(m => m.relationship.includes('great-great')),
    tree.members.filter(m => m.relationship.includes('great-grand') && !m.relationship.includes('great-great')),
    tree.members.filter(m => m.relationship.includes('grand') && !m.relationship.includes('great')),
    tree.members.filter(m => !m.relationship.includes('grand') && !m.relationship.includes('great')),
  ].filter(gen => gen.length > 0);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FAF7F2' }} edges={['top']}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Family Tree',
          headerStyle: { backgroundColor: '#FAF7F2' },
          headerTintColor: '#1B4D3E',
          headerRight: () => (
            <View className="flex-row">
              <Pressable className="mr-4">
                <Share2 size={20} color="#1B4D3E" />
              </Pressable>
              <Pressable>
                <Edit3 size={20} color="#1B4D3E" />
              </Pressable>
            </View>
          ),
        }}
      />

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Animated.View entering={FadeInDown.delay(100)} className="mx-4 mt-2 bg-emerald-800 rounded-2xl p-5">
          <View className="flex-row items-center justify-between">
            <View className="flex-1">
              <Text className="text-white font-bold text-xl">{tree.name}</Text>
              <Text className="text-white/80 text-sm mt-1">{tree.description}</Text>
            </View>
            <View className="bg-white/20 p-3 rounded-full">
              <TreePine size={28} color="white" />
            </View>
          </View>

          <View className="flex-row items-center mt-4 pt-4 border-t border-white/20">
            <View className="flex-row items-center flex-1">
              <Users size={16} color="white" />
              <Text className="text-white ml-2">{tree.members.length} members</Text>
            </View>
            <View className="flex-row items-center">
              {tree.isPublic ? (
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
        </Animated.View>

        {/* Add Member Button */}
        <View className="mx-4 mt-4">
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
            className="bg-white rounded-xl p-4 flex-row items-center justify-center shadow-sm"
          >
            <Plus size={20} color="#1B4D3E" />
            <Text className="text-emerald-800 font-semibold ml-2">Add Family Member</Text>
          </Pressable>
        </View>

        {/* Family Tree Visualization */}
        <View className="mt-6 px-4">
          <Text className="text-gray-900 font-bold text-lg mb-4">Family Timeline</Text>

          {generations.map((gen, genIdx) => (
            <Animated.View key={genIdx} entering={FadeInUp.delay(genIdx * 100)}>
              <View className="flex-row items-center mb-2">
                <View className="w-2 h-2 rounded-full bg-amber-500" />
                <View className="flex-1 h-px bg-amber-200 mx-2" />
                <Text className="text-amber-600 text-xs font-medium">
                  Generation {generations.length - genIdx}
                </Text>
              </View>

              <View className="flex-row flex-wrap mb-4">
                {gen.map((member) => (
                  <Pressable
                    key={member.id}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setSelectedMember(member);
                    }}
                    className="w-1/2 p-1"
                  >
                    <View className="bg-white rounded-xl p-3 shadow-sm">
                      <View className="flex-row items-center">
                        <View className="w-12 h-12 rounded-full bg-emerald-100 items-center justify-center">
                          {member.photo ? (
                            <Image source={{ uri: member.photo }} className="w-12 h-12 rounded-full" />
                          ) : (
                            <Text className="text-emerald-800 font-bold text-lg">
                              {member.name.split(' ').map(n => n[0]).join('')}
                            </Text>
                          )}
                        </View>
                        <View className="flex-1 ml-2">
                          <Text className="text-gray-900 font-semibold text-sm" numberOfLines={1}>{member.name}</Text>
                          <Text className="text-gray-500 text-xs" numberOfLines={1}>{member.relationship}</Text>
                          {member.birthYear && (
                            <Text className="text-gray-400 text-xs">
                              {member.birthYear}{member.deathYear ? ` - ${member.deathYear}` : ''}
                            </Text>
                          )}
                        </View>
                      </View>
                    </View>
                  </Pressable>
                ))}
              </View>
            </Animated.View>
          ))}
        </View>

        {/* Info Card */}
        <View className="mx-4 mt-4 mb-8 bg-amber-50 rounded-xl p-4">
          <Text className="text-amber-800 font-semibold mb-2">Preserve Your Story</Text>
          <Text className="text-amber-700 text-sm">
            Add photos, stories, and details about your ancestors to create a lasting legacy for future generations.
          </Text>
        </View>
      </ScrollView>

      {/* Member Detail Modal */}
      {selectedMember && (
        <Pressable
          onPress={() => setSelectedMember(null)}
          className="absolute inset-0 bg-black/50 items-center justify-center px-4"
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl p-6 w-full max-w-sm"
          >
            <View className="items-center mb-4">
              <View className="w-20 h-20 rounded-full bg-emerald-100 items-center justify-center mb-3">
                {selectedMember.photo ? (
                  <Image source={{ uri: selectedMember.photo }} className="w-20 h-20 rounded-full" />
                ) : (
                  <Text className="text-emerald-800 font-bold text-2xl">
                    {selectedMember.name.split(' ').map(n => n[0]).join('')}
                  </Text>
                )}
              </View>
              <Text className="text-gray-900 font-bold text-xl text-center">{selectedMember.name}</Text>
              <Text className="text-emerald-700 text-sm">{selectedMember.relationship}</Text>
            </View>

            {selectedMember.birthYear && (
              <View className="flex-row items-center mb-2">
                <Calendar size={16} color="#6B7280" />
                <Text className="text-gray-600 ml-2">
                  {selectedMember.birthYear}{selectedMember.deathYear ? ` - ${selectedMember.deathYear}` : ' - Present'}
                </Text>
              </View>
            )}

            {selectedMember.birthPlace && (
              <View className="flex-row items-center mb-2">
                <MapPin size={16} color="#6B7280" />
                <Text className="text-gray-600 ml-2">{selectedMember.birthPlace}</Text>
              </View>
            )}

            {selectedMember.bio && (
              <View className="mt-4 bg-gray-50 rounded-xl p-3">
                <Text className="text-gray-700">{selectedMember.bio}</Text>
              </View>
            )}

            <Pressable
              onPress={() => setSelectedMember(null)}
              className="mt-6 bg-emerald-800 py-3 rounded-xl items-center"
            >
              <Text className="text-white font-semibold">Close</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      )}
    </SafeAreaView>
  );
}
