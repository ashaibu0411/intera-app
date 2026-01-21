import { useState, useRef, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, Modal, Alert, ActivityIndicator } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Languages,
  ArrowRightLeft,
  Mic,
  MicOff,
  Volume2,
  Copy,
  Check,
  ChevronDown,
  X,
  Sparkles,
  Globe,
  MessageCircle,
} from 'lucide-react-native';
import Animated, { FadeInDown, FadeInUp, useSharedValue, useAnimatedStyle, withRepeat, withTiming, withSequence } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import * as Speech from 'expo-speech';
import { aiLanguageBridge } from '@/lib/aiLanguageBridge';

interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
}

const LANGUAGES: Language[] = [
  // Top 10 (by total speakers; makes the picker feel universal)
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
  { code: 'zh', name: 'Chinese', nativeName: '中文', flag: '🇨🇳' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇪🇬' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', flag: '🇧🇩' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇵🇹' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺' },
  { code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia', flag: '🇮🇩' },

  // Other popular / community languages (still available)
  { code: 'ur', name: 'Urdu', nativeName: 'اردو', flag: '🇵🇰' },
  { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', flag: '🇮🇳' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹' },
  { code: 'nl', name: 'Dutch', nativeName: 'Nederlands', flag: '🇳🇱' },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', flag: '🇹🇷' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵' },
  { code: 'ko', name: 'Korean', nativeName: '한국어', flag: '🇰🇷' },

  // African languages (core to Intera’s mission)
  { code: 'sw', name: 'Swahili', nativeName: 'Kiswahili', flag: '🇰🇪' },
  { code: 'yo', name: 'Yoruba', nativeName: 'Yorùbá', flag: '🇳🇬' },
  { code: 'ig', name: 'Igbo', nativeName: 'Igbo', flag: '🇳🇬' },
  { code: 'ha', name: 'Hausa', nativeName: 'Hausa', flag: '🇳🇬' },
  { code: 'am', name: 'Amharic', nativeName: 'አማርኛ', flag: '🇪🇹' },
  { code: 'wo', name: 'Wolof', nativeName: 'Wolof', flag: '🇸🇳' },
  { code: 'zu', name: 'Zulu', nativeName: 'isiZulu', flag: '🇿🇦' },
  { code: 'xh', name: 'Xhosa', nativeName: 'isiXhosa', flag: '🇿🇦' },
  { code: 'tw', name: 'Twi', nativeName: 'Twi', flag: '🇬🇭' },
  { code: 'so', name: 'Somali', nativeName: 'Soomaali', flag: '🇸🇴' },
  { code: 'rw', name: 'Kinyarwanda', nativeName: 'Ikinyarwanda', flag: '🇷🇼' },
];

// Mock translation dictionary - expanded for demo
const TRANSLATIONS: Record<string, Record<string, string>> = {
  'hello': {
    sw: 'Habari',
    yo: 'Bawo ni',
    ig: 'Nnọọ',
    ha: 'Sannu',
    am: 'ሰላም (Selam)',
    wo: 'Na nga def',
    zu: 'Sawubona',
    xh: 'Molo',
    tw: 'Ɛte sɛn',
    fr: 'Bonjour',
    pt: 'Olá',
    ar: 'مرحبا (Marhaba)',
    so: 'Salaan',
    rw: 'Muraho',
  },
  'how are you': {
    sw: 'Habari yako?',
    yo: 'Ṣe dáadáa ni?',
    ig: 'Kedu ka ị mere?',
    ha: 'Yaya kake?',
    am: 'እንደምን ነህ? (Endemin neh?)',
    wo: 'Nanga def?',
    zu: 'Unjani?',
    xh: 'Unjani?',
    tw: 'Wo ho te sɛn?',
    fr: 'Comment allez-vous?',
    pt: 'Como você está?',
    ar: 'كيف حالك؟ (Kayf halak?)',
    so: 'Sidee tahay?',
    rw: 'Amakuru?',
  },
  'thank you': {
    sw: 'Asante',
    yo: 'E ṣé',
    ig: 'Daalụ',
    ha: 'Na gode',
    am: 'አመሰግናለሁ (Ameseginalehu)',
    wo: 'Jërëjëf',
    zu: 'Ngiyabonga',
    xh: 'Enkosi',
    tw: 'Medaase',
    fr: 'Merci',
    pt: 'Obrigado',
    ar: 'شكرا (Shukran)',
    so: 'Mahadsanid',
    rw: 'Murakoze',
  },
  'good morning': {
    sw: 'Habari za asubuhi',
    yo: 'E kaaro',
    ig: 'Ụtụtụ ọma',
    ha: 'Barka da safe',
    am: 'እንደምን አደርክ (Endemin aderk)',
    wo: 'Nanga def ci suba',
    zu: 'Sawubona ekuseni',
    xh: 'Molo kusasa',
    tw: 'Maakye',
    fr: 'Bonjour',
    pt: 'Bom dia',
    ar: 'صباح الخير (Sabah al-khayr)',
    so: 'Subax wanaagsan',
    rw: 'Mwaramutse',
  },
  'goodbye': {
    sw: 'Kwaheri',
    yo: 'O dabọ',
    ig: 'Ka ọ dị',
    ha: 'Sai anjima',
    am: 'ደህና ሁን (Dehna hun)',
    wo: 'Ba beneen',
    zu: 'Sala kahle',
    xh: 'Hamba kakuhle',
    tw: 'Nante yie',
    fr: 'Au revoir',
    pt: 'Adeus',
    ar: 'مع السلامة (Ma\'a salama)',
    so: 'Nabad gelyo',
    rw: 'Murabeho',
  },
  'i love you': {
    sw: 'Nakupenda',
    yo: 'Mo ni fẹ rẹ',
    ig: 'A hụrụ m gị n\'anya',
    ha: 'Ina son ka',
    am: 'እወድሃለሁ (Ewedihalehu)',
    wo: 'Begg naa la',
    zu: 'Ngiyakuthanda',
    xh: 'Ndiyakuthanda',
    tw: 'Me dɔ wo',
    fr: 'Je t\'aime',
    pt: 'Eu te amo',
    ar: 'أحبك (Uhibbuk)',
    so: 'Waan ku jeclahay',
    rw: 'Ndagukunda',
  },
  'please': {
    sw: 'Tafadhali',
    yo: 'Jọwọ',
    ig: 'Biko',
    ha: 'Don Allah',
    am: 'እባክህ (Ebakeh)',
    wo: 'Baal ma',
    zu: 'Ngicela',
    xh: 'Nceda',
    tw: 'Mepa wo kyɛw',
    fr: 'S\'il vous plaît',
    pt: 'Por favor',
    ar: 'من فضلك (Min fadlak)',
    so: 'Fadlan',
    rw: 'Mbabarira',
  },
  'yes': {
    sw: 'Ndiyo',
    yo: 'Bẹẹni',
    ig: 'Ee',
    ha: 'Eh',
    am: 'አዎ (Awo)',
    wo: 'Waaw',
    zu: 'Yebo',
    xh: 'Ewe',
    tw: 'Aane',
    fr: 'Oui',
    pt: 'Sim',
    ar: 'نعم (Na\'am)',
    so: 'Haa',
    rw: 'Yego',
  },
  'no': {
    sw: 'Hapana',
    yo: 'Rara',
    ig: 'Mba',
    ha: 'A\'a',
    am: 'አይ (Ay)',
    wo: 'Déedéet',
    zu: 'Cha',
    xh: 'Hayi',
    tw: 'Daabi',
    fr: 'Non',
    pt: 'Não',
    ar: 'لا (La)',
    so: 'Maya',
    rw: 'Oya',
  },
  'my name is': {
    sw: 'Jina langu ni',
    yo: 'Orúkọ mi ni',
    ig: 'Aha m bụ',
    ha: 'Sunana',
    am: 'ስሜ (Sime)',
    wo: 'Maa ngi tudd',
    zu: 'Igama lami ngu',
    xh: 'Igama lam ngu',
    tw: 'Me din de',
    fr: 'Je m\'appelle',
    pt: 'Meu nome é',
    ar: 'اسمي (Ismi)',
    so: 'Magacaygu waa',
    rw: 'Nitwa',
  },
  'where is': {
    sw: 'Iko wapi',
    yo: 'Níbo ni',
    ig: 'Olee ebe',
    ha: 'Ina',
    am: 'የት ነው (Yet new)',
    wo: 'Fan la',
    zu: 'Kuphi',
    xh: 'Phi',
    tw: 'Ɛwɔ he',
    fr: 'Où est',
    pt: 'Onde está',
    ar: 'أين (Ayna)',
    so: 'Xaggee',
    rw: 'Ari he',
  },
  'how much': {
    sw: 'Bei gani',
    yo: 'Elo ni',
    ig: 'Ego ole',
    ha: 'Nawa ne',
    am: 'ስንት ነው (Sint new)',
    wo: 'Ñaata la',
    zu: 'Malini',
    xh: 'Yimalini',
    tw: 'Ɛyɛ sɛn',
    fr: 'Combien',
    pt: 'Quanto custa',
    ar: 'كم (Kam)',
    so: 'Immisa',
    rw: 'Ni angahe',
  },
  'i need help': {
    sw: 'Ninahitaji msaada',
    yo: 'Mo nilo iranlọwọ',
    ig: 'Achọrọ m enyemaka',
    ha: 'Ina bukatar taimako',
    am: 'እርዳታ እፈልጋለሁ (Erdeta efeligalehu)',
    wo: 'Soxla naa ndimbal',
    zu: 'Ngidinga usizo',
    xh: 'Ndifuna uncedo',
    tw: 'Mehwɛ mmoa',
    fr: 'J\'ai besoin d\'aide',
    pt: 'Eu preciso de ajuda',
    ar: 'أحتاج مساعدة (Ahtaj musaada)',
    so: 'Waxaan u baahanahay caawimo',
    rw: 'Nkeneye ubufasha',
  },
  'welcome': {
    sw: 'Karibu',
    yo: 'Ẹ kaabo',
    ig: 'Nnọọ',
    ha: 'Barka da zuwa',
    am: 'እንኳን ደህና መጣህ (Enkwan dehna metah)',
    wo: 'Dalal ak jamm',
    zu: 'Wamukelekile',
    xh: 'Wamkelekile',
    tw: 'Akwaaba',
    fr: 'Bienvenue',
    pt: 'Bem-vindo',
    ar: 'أهلا وسهلا (Ahlan wa sahlan)',
    so: 'Soo dhowow',
    rw: 'Murakaza neza',
  },
};

export default function TranslatorScreen() {
  const router = useRouter();
  const [sourceText, setSourceText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [toneNotes, setToneNotes] = useState<string[]>([]);
  const [culturalNotes, setCulturalNotes] = useState<string[]>([]);
  const [romanization, setRomanization] = useState<string | null>(null);
  const [isAiTranslating, setIsAiTranslating] = useState(false);
  const [useAi, setUseAi] = useState(true);
  const [sourceLang, setSourceLang] = useState<Language>(LANGUAGES[0]);
  const [targetLang, setTargetLang] = useState<Language>(LANGUAGES[1]);
  const [showSourcePicker, setShowSourcePicker] = useState(false);
  const [showTargetPicker, setShowTargetPicker] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [copied, setCopied] = useState(false);
  const [recentTranslations, setRecentTranslations] = useState<Array<{source: string; target: string; from: Language; to: Language}>>([]);

  // Listening animation
  const pulseScale = useSharedValue(1);

  useEffect(() => {
    if (isListening) {
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.2, { duration: 500 }),
          withTiming(1, { duration: 500 })
        ),
        -1,
        true
      );
    } else {
      pulseScale.value = withTiming(1, { duration: 200 });
    }
  }, [isListening]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const translate = async (text: string) => {
    if (!text.trim()) {
      setTranslatedText('');
      setToneNotes([]);
      setCulturalNotes([]);
      setRomanization(null);
      return;
    }

    if (sourceLang.code === targetLang.code) {
      setTranslatedText(text.trim());
      setToneNotes([]);
      setCulturalNotes([]);
      setRomanization(null);
      return;
    }

    const lowerText = text.toLowerCase().trim();

    // AI translation path (preferred)
    if (useAi) {
      setIsAiTranslating(true);
      try {
        const res = await aiLanguageBridge({
          text,
          sourceLang: sourceLang.code,
          targetLang: targetLang.code,
          context: 'chat',
        });
        setTranslatedText(res.translation);
        setToneNotes(res.tone_notes || []);
        setCulturalNotes(res.cultural_notes || []);
        setRomanization(res.romanization ?? null);
        return;
      } catch (e) {
        // Fall back to local dictionary if Edge Function isn't deployed yet.
        console.log('[Translator] AI translation failed, falling back to local dictionary:', e);
      } finally {
        setIsAiTranslating(false);
      }
    }

    // Check for exact matches first
    if (TRANSLATIONS[lowerText] && TRANSLATIONS[lowerText][targetLang.code]) {
      setTranslatedText(TRANSLATIONS[lowerText][targetLang.code]);
      setToneNotes([]);
      setCulturalNotes([]);
      setRomanization(null);
      return;
    }

    // Check for partial matches
    for (const [phrase, translations] of Object.entries(TRANSLATIONS)) {
      if (lowerText.includes(phrase) && translations[targetLang.code]) {
        const translated = lowerText.replace(phrase, translations[targetLang.code]);
        setTranslatedText(translated);
        setToneNotes([]);
        setCulturalNotes([]);
        setRomanization(null);
        return;
      }
    }

    // If no match found, show a helpful message
    setTranslatedText(`[Translation: ${text}]`);
    setToneNotes([]);
    setCulturalNotes([]);
    setRomanization(null);
  };

  const handleTranslate = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const before = sourceText.trim();
    if (!before) return;
    const prev = translatedText;
    await translate(before);
    // Add to recents (best-effort) after state updates
    setRecentTranslations(prevList => [
      { source: before, target: prev || translatedText || '', from: sourceLang, to: targetLang },
      ...prevList.slice(0, 4),
    ].filter((x) => x.target));
  };

  const swapLanguages = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const temp = sourceLang;
    setSourceLang(targetLang);
    setTargetLang(temp);
    setSourceText(translatedText);
    setTranslatedText(sourceText);
  };

  const toggleListening = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (isListening) {
      setIsListening(false);
    } else {
      setIsListening(true);
      // Simulate voice input after 2 seconds
      setTimeout(() => {
        setIsListening(false);
        setSourceText('Hello, how are you?');
        translate('Hello, how are you?');
      }, 2000);
    }
  };

  const speakTranslation = () => {
    if (translatedText) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      Speech.speak(translatedText, {
        language: targetLang.code,
        rate: 0.8,
      });
    }
  };

  const copyToClipboard = () => {
    if (translatedText) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const LanguagePicker = ({
    visible,
    onClose,
    onSelect,
    selected,
    title
  }: {
    visible: boolean;
    onClose: () => void;
    onSelect: (lang: Language) => void;
    selected: Language;
    title: string;
  }) => (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 bg-black/50 justify-end">
        <View className="bg-white rounded-t-3xl max-h-[70%]">
          <View className="flex-row items-center justify-between p-4 border-b border-gray-100">
            <Text className="text-gray-900 font-bold text-lg">{title}</Text>
            <Pressable onPress={onClose}>
              <X size={24} color="#6B7280" />
            </Pressable>
          </View>
          <ScrollView className="p-4">
            {LANGUAGES.map((lang) => (
              <Pressable
                key={lang.code}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  onSelect(lang);
                  onClose();
                }}
                className={`flex-row items-center p-4 rounded-xl mb-2 ${
                  selected.code === lang.code ? 'bg-emerald-50 border border-emerald-500' : 'bg-gray-50'
                }`}
              >
                <Text className="text-2xl mr-3">{lang.flag}</Text>
                <View className="flex-1">
                  <Text className={`font-semibold ${selected.code === lang.code ? 'text-emerald-800' : 'text-gray-900'}`}>
                    {lang.name}
                  </Text>
                  <Text className="text-gray-500 text-sm">{lang.nativeName}</Text>
                </View>
                {selected.code === lang.code && <Check size={20} color="#1B4D3E" />}
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FAF7F2' }} edges={['top']}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Translator',
          headerStyle: { backgroundColor: '#FAF7F2' },
          headerTintColor: '#1B4D3E',
        }}
      />

      <ScrollView className="flex-1 px-4">
        {/* Header */}
        <Animated.View entering={FadeInDown.delay(100)} className="py-4">
          <View className="flex-row items-center mb-2">
            <View className="bg-emerald-100 p-2 rounded-full mr-3">
              <Globe size={24} color="#1B4D3E" />
            </View>
            <View className="flex-1">
              <Text className="text-gray-900 font-bold text-xl">Global Translator</Text>
              <Text className="text-gray-500 text-sm">Speak or type in any language</Text>
            </View>
          </View>
        </Animated.View>

        {/* Language Selector */}
        <Animated.View entering={FadeInDown.delay(200)} className="bg-white rounded-2xl p-4 mb-4">
          <View className="flex-row items-center justify-between">
            <Pressable
              onPress={() => setShowSourcePicker(true)}
              className="flex-1 flex-row items-center p-3 bg-gray-50 rounded-xl"
            >
              <Text className="text-xl mr-2">{sourceLang.flag}</Text>
              <Text className="text-gray-900 font-medium flex-1">{sourceLang.name}</Text>
              <ChevronDown size={18} color="#6B7280" />
            </Pressable>

            <Pressable
              onPress={swapLanguages}
              className="mx-3 bg-emerald-100 p-3 rounded-full"
            >
              <ArrowRightLeft size={20} color="#1B4D3E" />
            </Pressable>

            <Pressable
              onPress={() => setShowTargetPicker(true)}
              className="flex-1 flex-row items-center p-3 bg-gray-50 rounded-xl"
            >
              <Text className="text-xl mr-2">{targetLang.flag}</Text>
              <Text className="text-gray-900 font-medium flex-1">{targetLang.name}</Text>
              <ChevronDown size={18} color="#6B7280" />
            </Pressable>
          </View>
        </Animated.View>

        {/* Input Section */}
        <Animated.View entering={FadeInDown.delay(300)} className="bg-white rounded-2xl p-4 mb-4">
          <View className="flex-row items-center mb-2">
            <Text className="text-gray-500 text-sm flex-1">{sourceLang.name}</Text>
            <Animated.View style={pulseStyle}>
              <Pressable
                onPress={toggleListening}
                className={`p-2 rounded-full ${isListening ? 'bg-red-500' : 'bg-emerald-100'}`}
              >
                {isListening ? (
                  <MicOff size={20} color="white" />
                ) : (
                  <Mic size={20} color="#1B4D3E" />
                )}
              </Pressable>
            </Animated.View>
          </View>

          <TextInput
            value={sourceText}
            onChangeText={(text) => {
              setSourceText(text);
              translate(text);
            }}
            placeholder={`Type or speak in ${sourceLang.name}...`}
            placeholderTextColor="#9CA3AF"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            className="bg-gray-50 rounded-xl p-4 text-gray-900 min-h-[100px] text-base"
          />

          {isListening && (
            <View className="flex-row items-center justify-center mt-3 py-2">
              <View className="w-2 h-2 bg-red-500 rounded-full mr-2 animate-pulse" />
              <Text className="text-red-500 font-medium">Listening...</Text>
            </View>
          )}
        </Animated.View>

        {/* Translation Output */}
        <Animated.View entering={FadeInDown.delay(400)} className="bg-emerald-800 rounded-2xl p-4 mb-4">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-emerald-200 text-sm">{targetLang.name}</Text>
            <View className="flex-row">
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setUseAi((v) => !v);
                }}
                className={`px-3 py-2 rounded-full mr-1 flex-row items-center ${useAi ? 'bg-white/15' : 'bg-white/5'}`}
              >
                <Sparkles size={16} color={useAi ? '#4ADE80' : 'white'} />
                <Text className="text-white ml-2 text-sm">{useAi ? 'AI' : 'Basic'}</Text>
              </Pressable>
              <Pressable onPress={speakTranslation} className="p-2 mr-1">
                <Volume2 size={20} color="white" />
              </Pressable>
              <Pressable onPress={copyToClipboard} className="p-2">
                {copied ? <Check size={20} color="#4ADE80" /> : <Copy size={20} color="white" />}
              </Pressable>
            </View>
          </View>

          <View className="bg-white/10 rounded-xl p-4 min-h-[100px]">
            {isAiTranslating ? (
              <View className="flex-row items-center">
                <ActivityIndicator color="#ffffff" />
                <Text className="text-white/80 ml-3">Translating…</Text>
              </View>
            ) : translatedText ? (
              <View>
                <Text className="text-white text-lg">{translatedText}</Text>
                {romanization ? (
                  <Text className="text-emerald-100 mt-2">{romanization}</Text>
                ) : null}
                {toneNotes.length ? (
                  <View className="mt-3">
                    <Text className="text-emerald-200 text-xs font-semibold">TONE</Text>
                    {toneNotes.slice(0, 3).map((t, i) => (
                      <Text key={i} className="text-white/90 mt-1">
                        • {t}
                      </Text>
                    ))}
                  </View>
                ) : null}
                {culturalNotes.length ? (
                  <View className="mt-3">
                    <Text className="text-emerald-200 text-xs font-semibold">CULTURE</Text>
                    {culturalNotes.slice(0, 3).map((t, i) => (
                      <Text key={i} className="text-white/90 mt-1">
                        • {t}
                      </Text>
                    ))}
                  </View>
                ) : null}
              </View>
            ) : (
              <Text className="text-white/50 text-lg">Translation will appear here...</Text>
            )}
          </View>
        </Animated.View>

        {/* Quick Phrases */}
        <Animated.View entering={FadeInDown.delay(500)} className="mb-4">
          <Text className="text-gray-900 font-bold text-lg mb-3">Quick Phrases</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }}>
            {['Hello', 'Thank you', 'Goodbye', 'Please', 'How are you', 'I need help'].map((phrase) => (
              <Pressable
                key={phrase}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setSourceText(phrase);
                  translate(phrase);
                }}
                className="bg-white px-4 py-3 rounded-full mr-2 border border-gray-100"
              >
                <Text className="text-gray-700">{phrase}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </Animated.View>

        {/* Recent Translations */}
        {recentTranslations.length > 0 && (
          <Animated.View entering={FadeInUp.delay(600)} className="mb-6">
            <Text className="text-gray-900 font-bold text-lg mb-3">Recent</Text>
            {recentTranslations.map((item, idx) => (
              <Pressable
                key={idx}
                onPress={() => {
                  setSourceText(item.source);
                  setTranslatedText(item.target);
                  setSourceLang(item.from);
                  setTargetLang(item.to);
                }}
                className="bg-white rounded-xl p-4 mb-2"
              >
                <View className="flex-row items-center mb-2">
                  <Text className="text-lg">{item.from.flag}</Text>
                  <Text className="text-gray-400 mx-2">→</Text>
                  <Text className="text-lg">{item.to.flag}</Text>
                </View>
                <Text className="text-gray-600 text-sm">{item.source}</Text>
                <Text className="text-emerald-700 font-medium mt-1">{item.target}</Text>
              </Pressable>
            ))}
          </Animated.View>
        )}

        {/* Tip */}
        <Animated.View entering={FadeInUp.delay(700)} className="bg-amber-50 rounded-xl p-4 mb-6">
          <View className="flex-row items-center mb-2">
            <Sparkles size={16} color="#92400E" />
            <Text className="text-amber-800 font-semibold ml-2">Pro Tip</Text>
          </View>
          <Text className="text-amber-700 text-sm">
            Tap the microphone to speak your phrase. The translator supports 15+ African languages including Swahili, Yoruba, Igbo, Amharic, and more!
          </Text>
        </Animated.View>
      </ScrollView>

      {/* Language Pickers */}
      <LanguagePicker
        visible={showSourcePicker}
        onClose={() => setShowSourcePicker(false)}
        onSelect={setSourceLang}
        selected={sourceLang}
        title="Translate From"
      />
      <LanguagePicker
        visible={showTargetPicker}
        onClose={() => setShowTargetPicker(false)}
        onSelect={setTargetLang}
        selected={targetLang}
        title="Translate To"
      />
    </SafeAreaView>
  );
}
