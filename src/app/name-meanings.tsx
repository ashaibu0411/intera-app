import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Search, User, Heart, Share2, Info, Globe2, Sparkles } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

interface NameMeaning {
  id: string;
  name: string;
  meaning: string;
  origin: string;
  country: string;
  flag: string;
  gender: 'male' | 'female' | 'unisex';
  pronunciation: string;
  variations: string[];
  famousPeople: string[];
  popularity: 'common' | 'rare' | 'unique';
  isSaved: boolean;
}

const MOCK_NAMES: NameMeaning[] = [
  // African Names
  {
    id: '1',
    name: 'Amara',
    meaning: 'Grace, eternal, immortal',
    origin: 'Igbo',
    country: 'Nigeria',
    flag: '🇳🇬',
    gender: 'female',
    pronunciation: 'ah-MAH-rah',
    variations: ['Amira', 'Mara', 'Amarachi'],
    famousPeople: ['Amara La Negra', 'Amara Karan'],
    popularity: 'common',
    isSaved: true,
  },
  {
    id: '2',
    name: 'Kwame',
    meaning: 'Born on Saturday',
    origin: 'Akan',
    country: 'Ghana',
    flag: '🇬🇭',
    gender: 'male',
    pronunciation: 'KWAH-mee',
    variations: ['Kwami', 'Koame'],
    famousPeople: ['Kwame Nkrumah', 'Kwame Brown'],
    popularity: 'common',
    isSaved: false,
  },
  {
    id: '3',
    name: 'Zara',
    meaning: 'Princess, flower, radiance',
    origin: 'Arabic',
    country: 'Various',
    flag: '🌍',
    gender: 'female',
    pronunciation: 'ZAH-rah',
    variations: ['Zahra', 'Sarah', 'Zahara'],
    famousPeople: ['Zara Phillips', 'Zara Larsson'],
    popularity: 'common',
    isSaved: false,
  },
  {
    id: '4',
    name: 'Oluwaseun',
    meaning: 'God has done something worthy of thanks',
    origin: 'Yoruba',
    country: 'Nigeria',
    flag: '🇳🇬',
    gender: 'unisex',
    pronunciation: 'oh-loo-wah-SHEH-oon',
    variations: ['Seun', 'Oluseun', 'Shayo'],
    famousPeople: ['Seun Kuti'],
    popularity: 'common',
    isSaved: false,
  },
  {
    id: '5',
    name: 'Kofi',
    meaning: 'Born on Friday',
    origin: 'Akan',
    country: 'Ghana',
    flag: '🇬🇭',
    gender: 'male',
    pronunciation: 'KOH-fee',
    variations: ['Kofe', 'Cofi'],
    famousPeople: ['Kofi Annan', 'Kofi Kingston'],
    popularity: 'common',
    isSaved: true,
  },
  {
    id: '6',
    name: 'Nia',
    meaning: 'Purpose, intention, brilliance',
    origin: 'Swahili',
    country: 'East Africa',
    flag: '🇰🇪',
    gender: 'female',
    pronunciation: 'NEE-ah',
    variations: ['Niya', 'Nya'],
    famousPeople: ['Nia Long', 'Nia DaCosta'],
    popularity: 'common',
    isSaved: false,
  },
  {
    id: '7',
    name: 'Jabari',
    meaning: 'Brave one, fearless',
    origin: 'Swahili',
    country: 'East Africa',
    flag: '🇹🇿',
    gender: 'male',
    pronunciation: 'jah-BAH-ree',
    variations: ['Jabar', 'Jabbar'],
    famousPeople: ['Jabari Parker'],
    popularity: 'rare',
    isSaved: false,
  },
  {
    id: '8',
    name: 'Ayanna',
    meaning: 'Beautiful flower',
    origin: 'Ethiopian',
    country: 'Ethiopia',
    flag: '🇪🇹',
    gender: 'female',
    pronunciation: 'ah-YAH-nah',
    variations: ['Ayana', 'Ayani', 'Yana'],
    famousPeople: ['Ayanna Pressley'],
    popularity: 'rare',
    isSaved: false,
  },
  {
    id: '9',
    name: 'Chinwe',
    meaning: 'God owns',
    origin: 'Igbo',
    country: 'Nigeria',
    flag: '🇳🇬',
    gender: 'female',
    pronunciation: 'CHIN-way',
    variations: ['Chinwendu', 'Chinenye'],
    famousPeople: ['Chinwe Chukwuogo-Roy'],
    popularity: 'rare',
    isSaved: false,
  },
  {
    id: '10',
    name: 'Tariq',
    meaning: 'Morning star, he who knocks at the door',
    origin: 'Arabic',
    country: 'Various',
    flag: '🌙',
    gender: 'male',
    pronunciation: 'tah-REEK',
    variations: ['Tarik', 'Tareq'],
    famousPeople: ['Tariq Ramadan', 'Tariq Nasheed'],
    popularity: 'common',
    isSaved: false,
  },
  {
    id: '11',
    name: 'Adaeze',
    meaning: 'King\'s daughter, princess',
    origin: 'Igbo',
    country: 'Nigeria',
    flag: '🇳🇬',
    gender: 'female',
    pronunciation: 'ah-dah-EH-zeh',
    variations: ['Ada', 'Adanna'],
    famousPeople: ['Adaeze Igwe'],
    popularity: 'rare',
    isSaved: false,
  },
  {
    id: '12',
    name: 'Malik',
    meaning: 'King, master, owner',
    origin: 'Arabic',
    country: 'Various',
    flag: '🌍',
    gender: 'male',
    pronunciation: 'mah-LEEK',
    variations: ['Malek', 'Malick'],
    famousPeople: ['Malik Obama', 'Zayn Malik'],
    popularity: 'common',
    isSaved: false,
  },
  {
    id: '13',
    name: 'Zuri',
    meaning: 'Beautiful, good',
    origin: 'Swahili',
    country: 'East Africa',
    flag: '🇰🇪',
    gender: 'female',
    pronunciation: 'ZOO-ree',
    variations: ['Zuria', 'Zurie'],
    famousPeople: ['Zuri Hall'],
    popularity: 'common',
    isSaved: false,
  },
  {
    id: '14',
    name: 'Thabo',
    meaning: 'Joy, happiness',
    origin: 'Sotho',
    country: 'South Africa',
    flag: '🇿🇦',
    gender: 'male',
    pronunciation: 'TAH-bo',
    variations: ['Tabo'],
    famousPeople: ['Thabo Mbeki'],
    popularity: 'common',
    isSaved: false,
  },
  // Japanese Names
  {
    id: '15',
    name: 'Sakura',
    meaning: 'Cherry blossom',
    origin: 'Japanese',
    country: 'Japan',
    flag: '🇯🇵',
    gender: 'female',
    pronunciation: 'sah-KOO-rah',
    variations: ['Saki', 'Kura'],
    famousPeople: ['Sakura Miyawaki'],
    popularity: 'common',
    isSaved: false,
  },
  {
    id: '16',
    name: 'Hiroshi',
    meaning: 'Generous, prosperous',
    origin: 'Japanese',
    country: 'Japan',
    flag: '🇯🇵',
    gender: 'male',
    pronunciation: 'hee-ROH-shee',
    variations: ['Hiro'],
    famousPeople: ['Hiroshi Yamauchi'],
    popularity: 'common',
    isSaved: false,
  },
  {
    id: '17',
    name: 'Yuki',
    meaning: 'Snow, happiness',
    origin: 'Japanese',
    country: 'Japan',
    flag: '🇯🇵',
    gender: 'unisex',
    pronunciation: 'YOO-kee',
    variations: ['Yukiko', 'Yuuki'],
    famousPeople: ['Yuki Tsunoda'],
    popularity: 'common',
    isSaved: false,
  },
  {
    id: '18',
    name: 'Kenji',
    meaning: 'Strong, vigorous second son',
    origin: 'Japanese',
    country: 'Japan',
    flag: '🇯🇵',
    gender: 'male',
    pronunciation: 'KEN-jee',
    variations: ['Ken'],
    famousPeople: ['Kenji Mizoguchi'],
    popularity: 'common',
    isSaved: false,
  },
  // Chinese Names
  {
    id: '19',
    name: 'Mei',
    meaning: 'Beautiful, plum',
    origin: 'Chinese',
    country: 'China',
    flag: '🇨🇳',
    gender: 'female',
    pronunciation: 'may',
    variations: ['Meili', 'Meiying'],
    famousPeople: ['Mei Lanfang'],
    popularity: 'common',
    isSaved: false,
  },
  {
    id: '20',
    name: 'Wei',
    meaning: 'Greatness, power',
    origin: 'Chinese',
    country: 'China',
    flag: '🇨🇳',
    gender: 'unisex',
    pronunciation: 'way',
    variations: ['Weilin', 'Weiming'],
    famousPeople: ['Ai Weiwei'],
    popularity: 'common',
    isSaved: false,
  },
  {
    id: '21',
    name: 'Lian',
    meaning: 'Lotus, graceful',
    origin: 'Chinese',
    country: 'China',
    flag: '🇨🇳',
    gender: 'female',
    pronunciation: 'lee-AHN',
    variations: ['Lianna', 'Lien'],
    famousPeople: ['Lian Hearn'],
    popularity: 'rare',
    isSaved: false,
  },
  // Korean Names
  {
    id: '22',
    name: 'Ji-Yeon',
    meaning: 'Wisdom and beauty',
    origin: 'Korean',
    country: 'South Korea',
    flag: '🇰🇷',
    gender: 'female',
    pronunciation: 'jee-yun',
    variations: ['Jiyeon', 'Ji-Young'],
    famousPeople: ['Park Ji-yeon'],
    popularity: 'common',
    isSaved: false,
  },
  {
    id: '23',
    name: 'Min-Jun',
    meaning: 'Clever and talented',
    origin: 'Korean',
    country: 'South Korea',
    flag: '🇰🇷',
    gender: 'male',
    pronunciation: 'min-joon',
    variations: ['Minjun', 'Min-Joon'],
    famousPeople: ['Lee Min-jun'],
    popularity: 'common',
    isSaved: false,
  },
  {
    id: '24',
    name: 'Soo-Yeon',
    meaning: 'Excellent and graceful',
    origin: 'Korean',
    country: 'South Korea',
    flag: '🇰🇷',
    gender: 'female',
    pronunciation: 'soo-yun',
    variations: ['Sooyeon', 'Su-Yeon'],
    famousPeople: ['Choi Soo-yeon'],
    popularity: 'common',
    isSaved: false,
  },
  // Indian Names
  {
    id: '25',
    name: 'Priya',
    meaning: 'Beloved, dear one',
    origin: 'Sanskrit',
    country: 'India',
    flag: '🇮🇳',
    gender: 'female',
    pronunciation: 'PREE-yah',
    variations: ['Priyanka', 'Preeti'],
    famousPeople: ['Priyanka Chopra'],
    popularity: 'common',
    isSaved: false,
  },
  {
    id: '26',
    name: 'Arjun',
    meaning: 'Bright, shining, white',
    origin: 'Sanskrit',
    country: 'India',
    flag: '🇮🇳',
    gender: 'male',
    pronunciation: 'AR-joon',
    variations: ['Arjuna'],
    famousPeople: ['Arjun Kapoor', 'Arjun Rampal'],
    popularity: 'common',
    isSaved: false,
  },
  {
    id: '27',
    name: 'Aisha',
    meaning: 'Alive, living, prosperous',
    origin: 'Sanskrit',
    country: 'India',
    flag: '🇮🇳',
    gender: 'female',
    pronunciation: 'ah-EE-shah',
    variations: ['Ayesha', 'Isha'],
    famousPeople: ['Aisha Tyler'],
    popularity: 'common',
    isSaved: false,
  },
  {
    id: '28',
    name: 'Rohan',
    meaning: 'Ascending, healing',
    origin: 'Sanskrit',
    country: 'India',
    flag: '🇮🇳',
    gender: 'male',
    pronunciation: 'ROH-han',
    variations: ['Rohit'],
    famousPeople: ['Rohan Bopanna'],
    popularity: 'common',
    isSaved: false,
  },
  // Arabic/Middle Eastern Names
  {
    id: '29',
    name: 'Layla',
    meaning: 'Night, dark beauty',
    origin: 'Arabic',
    country: 'Various',
    flag: '🌙',
    gender: 'female',
    pronunciation: 'LAY-lah',
    variations: ['Leila', 'Lila', 'Laila'],
    famousPeople: ['Layla Ali'],
    popularity: 'common',
    isSaved: false,
  },
  {
    id: '30',
    name: 'Omar',
    meaning: 'Flourishing, long-lived',
    origin: 'Arabic',
    country: 'Various',
    flag: '🌙',
    gender: 'male',
    pronunciation: 'OH-mar',
    variations: ['Umar', 'Omer'],
    famousPeople: ['Omar Sharif', 'Omar Sy'],
    popularity: 'common',
    isSaved: false,
  },
  {
    id: '31',
    name: 'Fatima',
    meaning: 'Captivating, one who abstains',
    origin: 'Arabic',
    country: 'Various',
    flag: '🌙',
    gender: 'female',
    pronunciation: 'FAH-tee-mah',
    variations: ['Fatma', 'Fatimah'],
    famousPeople: ['Fatima Whitbread'],
    popularity: 'common',
    isSaved: false,
  },
  {
    id: '32',
    name: 'Cyrus',
    meaning: 'Sun, throne',
    origin: 'Persian',
    country: 'Iran',
    flag: '🇮🇷',
    gender: 'male',
    pronunciation: 'SY-rus',
    variations: ['Kourosh', 'Koresh'],
    famousPeople: ['Cyrus the Great', 'Miley Cyrus'],
    popularity: 'rare',
    isSaved: false,
  },
  // Latin American/Spanish Names
  {
    id: '33',
    name: 'Esperanza',
    meaning: 'Hope',
    origin: 'Spanish',
    country: 'Spain/Latin America',
    flag: '🇪🇸',
    gender: 'female',
    pronunciation: 'es-peh-RAHN-zah',
    variations: ['Espe', 'Hope'],
    famousPeople: ['Esperanza Spalding'],
    popularity: 'rare',
    isSaved: false,
  },
  {
    id: '34',
    name: 'Mateo',
    meaning: 'Gift of God',
    origin: 'Spanish',
    country: 'Spain/Latin America',
    flag: '🇪🇸',
    gender: 'male',
    pronunciation: 'mah-TAY-oh',
    variations: ['Matthew', 'Matteo'],
    famousPeople: ['Mateo Kovacic'],
    popularity: 'common',
    isSaved: false,
  },
  {
    id: '35',
    name: 'Valentina',
    meaning: 'Strong, healthy, brave',
    origin: 'Spanish',
    country: 'Latin America',
    flag: '🇲🇽',
    gender: 'female',
    pronunciation: 'vah-len-TEE-nah',
    variations: ['Valeria', 'Tina'],
    famousPeople: ['Valentina Tereshkova'],
    popularity: 'common',
    isSaved: false,
  },
  {
    id: '36',
    name: 'Santiago',
    meaning: 'Saint James',
    origin: 'Spanish',
    country: 'Spain/Latin America',
    flag: '🇪🇸',
    gender: 'male',
    pronunciation: 'sahn-tee-AH-go',
    variations: ['Diego', 'Santi'],
    famousPeople: ['Santiago Calatrava'],
    popularity: 'common',
    isSaved: false,
  },
  // European Names
  {
    id: '37',
    name: 'Astrid',
    meaning: 'Divine strength, beautiful goddess',
    origin: 'Scandinavian',
    country: 'Sweden/Norway',
    flag: '🇸🇪',
    gender: 'female',
    pronunciation: 'AS-trid',
    variations: ['Asta', 'Estrid'],
    famousPeople: ['Astrid Lindgren'],
    popularity: 'rare',
    isSaved: false,
  },
  {
    id: '38',
    name: 'Henrik',
    meaning: 'Ruler of the home',
    origin: 'Scandinavian',
    country: 'Sweden/Denmark',
    flag: '🇸🇪',
    gender: 'male',
    pronunciation: 'HEN-rik',
    variations: ['Henry', 'Heinrich'],
    famousPeople: ['Henrik Ibsen'],
    popularity: 'common',
    isSaved: false,
  },
  {
    id: '39',
    name: 'Siobhan',
    meaning: 'God is gracious',
    origin: 'Irish',
    country: 'Ireland',
    flag: '🇮🇪',
    gender: 'female',
    pronunciation: 'shi-VAWN',
    variations: ['Chevonne', 'Shivon'],
    famousPeople: ['Siobhan Fahey'],
    popularity: 'rare',
    isSaved: false,
  },
  {
    id: '40',
    name: 'Liam',
    meaning: 'Strong-willed warrior, protector',
    origin: 'Irish',
    country: 'Ireland',
    flag: '🇮🇪',
    gender: 'male',
    pronunciation: 'LEE-am',
    variations: ['William', 'Will'],
    famousPeople: ['Liam Neeson', 'Liam Hemsworth'],
    popularity: 'common',
    isSaved: false,
  },
  {
    id: '41',
    name: 'Freya',
    meaning: 'Noble woman, goddess of love',
    origin: 'Norse',
    country: 'Scandinavia',
    flag: '🇳🇴',
    gender: 'female',
    pronunciation: 'FRAY-ah',
    variations: ['Freyja', 'Freia'],
    famousPeople: ['Freya Allan'],
    popularity: 'common',
    isSaved: false,
  },
  {
    id: '42',
    name: 'Dimitri',
    meaning: 'Follower of Demeter, earth-lover',
    origin: 'Greek',
    country: 'Greece',
    flag: '🇬🇷',
    gender: 'male',
    pronunciation: 'dih-MEE-tree',
    variations: ['Dmitri', 'Demetrius'],
    famousPeople: ['Dimitri Payet'],
    popularity: 'common',
    isSaved: false,
  },
  {
    id: '43',
    name: 'Anastasia',
    meaning: 'Resurrection, rebirth',
    origin: 'Greek',
    country: 'Greece/Russia',
    flag: '🇬🇷',
    gender: 'female',
    pronunciation: 'ah-nah-STAH-see-ah',
    variations: ['Ana', 'Stasia', 'Nastya'],
    famousPeople: ['Grand Duchess Anastasia'],
    popularity: 'common',
    isSaved: false,
  },
  // Native American Names
  {
    id: '44',
    name: 'Aiyana',
    meaning: 'Eternal blossom, forever flowering',
    origin: 'Native American',
    country: 'North America',
    flag: '🦅',
    gender: 'female',
    pronunciation: 'eye-YAH-nah',
    variations: ['Ayana', 'Ayanna'],
    famousPeople: ['Aiyana Stanley-Jones'],
    popularity: 'rare',
    isSaved: false,
  },
  {
    id: '45',
    name: 'Koda',
    meaning: 'Friend, companion',
    origin: 'Native American',
    country: 'North America',
    flag: '🦅',
    gender: 'male',
    pronunciation: 'KOH-dah',
    variations: ['Coda', 'Dakota'],
    famousPeople: [],
    popularity: 'rare',
    isSaved: false,
  },
  {
    id: '46',
    name: 'Nova',
    meaning: 'New, chasing butterflies',
    origin: 'Native American',
    country: 'North America',
    flag: '🦅',
    gender: 'female',
    pronunciation: 'NOH-vah',
    variations: ['Novia'],
    famousPeople: ['Nova Peris'],
    popularity: 'common',
    isSaved: false,
  },
  // Filipino Names
  {
    id: '47',
    name: 'Mayumi',
    meaning: 'Gentle, true bow',
    origin: 'Filipino',
    country: 'Philippines',
    flag: '🇵🇭',
    gender: 'female',
    pronunciation: 'mah-YOO-mee',
    variations: ['May', 'Yumi'],
    famousPeople: ['Mayumi Narita'],
    popularity: 'common',
    isSaved: false,
  },
  {
    id: '48',
    name: 'Bayani',
    meaning: 'Hero, patriot',
    origin: 'Filipino',
    country: 'Philippines',
    flag: '🇵🇭',
    gender: 'male',
    pronunciation: 'bah-YAH-nee',
    variations: ['Bayan'],
    famousPeople: ['Bayani Fernando'],
    popularity: 'rare',
    isSaved: false,
  },
  // Vietnamese Names
  {
    id: '49',
    name: 'Linh',
    meaning: 'Soul, spirit',
    origin: 'Vietnamese',
    country: 'Vietnam',
    flag: '🇻🇳',
    gender: 'unisex',
    pronunciation: 'lin',
    variations: ['Ling', 'Lynn'],
    famousPeople: ['Linh Dan Pham'],
    popularity: 'common',
    isSaved: false,
  },
  {
    id: '50',
    name: 'Minh',
    meaning: 'Bright, intelligent',
    origin: 'Vietnamese',
    country: 'Vietnam',
    flag: '🇻🇳',
    gender: 'unisex',
    pronunciation: 'min',
    variations: ['Ming'],
    famousPeople: ['Ho Chi Minh'],
    popularity: 'common',
    isSaved: false,
  },
  // Thai Names
  {
    id: '51',
    name: 'Anong',
    meaning: 'Beautiful woman',
    origin: 'Thai',
    country: 'Thailand',
    flag: '🇹🇭',
    gender: 'female',
    pronunciation: 'ah-NONG',
    variations: ['Nong'],
    famousPeople: [],
    popularity: 'common',
    isSaved: false,
  },
  {
    id: '52',
    name: 'Chai',
    meaning: 'Life, victory',
    origin: 'Thai',
    country: 'Thailand',
    flag: '🇹🇭',
    gender: 'male',
    pronunciation: 'chai',
    variations: ['Chaiya'],
    famousPeople: ['Tony Jaa (Jaa Panom Yeerum)'],
    popularity: 'common',
    isSaved: false,
  },
  // Hebrew Names
  {
    id: '53',
    name: 'Naomi',
    meaning: 'Pleasantness, sweetness',
    origin: 'Hebrew',
    country: 'Israel',
    flag: '🇮🇱',
    gender: 'female',
    pronunciation: 'nay-OH-mee',
    variations: ['Noemi', 'Noemie'],
    famousPeople: ['Naomi Campbell', 'Naomi Osaka'],
    popularity: 'common',
    isSaved: false,
  },
  {
    id: '54',
    name: 'Ethan',
    meaning: 'Strong, firm, enduring',
    origin: 'Hebrew',
    country: 'Israel',
    flag: '🇮🇱',
    gender: 'male',
    pronunciation: 'EE-than',
    variations: ['Etan', 'Eitan'],
    famousPeople: ['Ethan Hawke', 'Ethan Coen'],
    popularity: 'common',
    isSaved: false,
  },
  // Russian Names
  {
    id: '55',
    name: 'Natasha',
    meaning: 'Born on Christmas Day',
    origin: 'Russian',
    country: 'Russia',
    flag: '🇷🇺',
    gender: 'female',
    pronunciation: 'nah-TAH-shah',
    variations: ['Natalia', 'Natalya'],
    famousPeople: ['Natasha Romanoff (Marvel)'],
    popularity: 'common',
    isSaved: false,
  },
  {
    id: '56',
    name: 'Nikolai',
    meaning: 'Victory of the people',
    origin: 'Russian',
    country: 'Russia',
    flag: '🇷🇺',
    gender: 'male',
    pronunciation: 'NEE-ko-lai',
    variations: ['Nicholas', 'Nico'],
    famousPeople: ['Nikolai Gogol'],
    popularity: 'common',
    isSaved: false,
  },
  // Brazilian/Portuguese Names
  {
    id: '57',
    name: 'Iara',
    meaning: 'Lady of the water, mermaid',
    origin: 'Brazilian',
    country: 'Brazil',
    flag: '🇧🇷',
    gender: 'female',
    pronunciation: 'ee-AH-rah',
    variations: ['Yara'],
    famousPeople: ['Yara Shahidi'],
    popularity: 'rare',
    isSaved: false,
  },
  {
    id: '58',
    name: 'Caio',
    meaning: 'Rejoice, happy',
    origin: 'Brazilian',
    country: 'Brazil',
    flag: '🇧🇷',
    gender: 'male',
    pronunciation: 'KAI-oh',
    variations: ['Caius', 'Kai'],
    famousPeople: ['Caio Terra'],
    popularity: 'common',
    isSaved: false,
  },
  // Hawaiian Names
  {
    id: '59',
    name: 'Leilani',
    meaning: 'Heavenly flower, royal child',
    origin: 'Hawaiian',
    country: 'Hawaii/USA',
    flag: '🌺',
    gender: 'female',
    pronunciation: 'lay-LAH-nee',
    variations: ['Lei', 'Lani'],
    famousPeople: ['Leilani Münter'],
    popularity: 'common',
    isSaved: false,
  },
  {
    id: '60',
    name: 'Kai',
    meaning: 'Sea, ocean',
    origin: 'Hawaiian',
    country: 'Hawaii/USA',
    flag: '🌺',
    gender: 'unisex',
    pronunciation: 'kai',
    variations: ['Kaipo'],
    famousPeople: ['Kai Lenny'],
    popularity: 'common',
    isSaved: false,
  },
];

const ORIGINS = ['All', 'Yoruba', 'Igbo', 'Akan', 'Swahili', 'Arabic', 'Ethiopian', 'Japanese', 'Chinese', 'Korean', 'Sanskrit', 'Spanish', 'Scandinavian', 'Irish', 'Greek', 'Hebrew', 'Hawaiian'];
const GENDERS = ['All', 'Male', 'Female', 'Unisex'];

const GENDER_COLORS = {
  male: '#3B82F6',
  female: '#EC4899',
  unisex: '#8B5CF6',
};

const POPULARITY_BADGES = {
  common: { label: 'Popular', color: '#10B981' },
  rare: { label: 'Rare', color: '#F59E0B' },
  unique: { label: 'Unique', color: '#8B5CF6' },
};

export default function NameMeaningsScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrigin, setSelectedOrigin] = useState('All');
  const [selectedGender, setSelectedGender] = useState('All');
  const [names, setNames] = useState(MOCK_NAMES);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filteredNames = names.filter(name => {
    const matchesSearch = searchQuery === '' ||
      name.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      name.meaning.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesOrigin = selectedOrigin === 'All' || name.origin === selectedOrigin;
    const matchesGender = selectedGender === 'All' || name.gender === selectedGender.toLowerCase();
    return matchesSearch && matchesOrigin && matchesGender;
  });

  const toggleSave = (nameId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setNames(prev => prev.map(n => {
      if (n.id === nameId) {
        return { ...n, isSaved: !n.isSaved };
      }
      return n;
    }));
  };

  return (
    <View className="flex-1 bg-[#1A1625]">
      <SafeAreaView edges={['top']} className="flex-1">
        {/* Header */}
        <View className="px-5 pb-4">
          <View className="flex-row items-center justify-between mb-4">
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.back();
              }}
              className="w-10 h-10 rounded-full bg-white/10 items-center justify-center"
            >
              <ArrowLeft size={20} color="#fff" />
            </Pressable>
            <View className="flex-row items-center">
              <Sparkles size={20} color="#EC4899" />
              <Text className="text-white text-lg font-bold ml-2">Name Meanings</Text>
            </View>
            <View className="w-10" />
          </View>

          {/* Hero */}
          <LinearGradient
            colors={['#6366F1', '#EC4899']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ borderRadius: 20, padding: 16, marginBottom: 16 }}
          >
            <Text className="text-white/80 text-sm">Discover the meaning behind</Text>
            <Text className="text-white text-xl font-bold">Traditional Names Worldwide</Text>
            <Text className="text-white/70 text-sm mt-1">60+ names from Africa, Asia, Europe, Americas & more</Text>
          </LinearGradient>

          {/* Search */}
          <View className="flex-row items-center bg-white/10 rounded-2xl px-4 py-3 mb-4">
            <Search size={18} color="#9CA3AF" />
            <TextInput
              placeholder="Search names or meanings..."
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
              className="flex-1 ml-3 text-white text-base"
            />
          </View>

          {/* Gender Filter */}
          <View className="flex-row gap-2 mb-3">
            {GENDERS.map((gender) => (
              <Pressable
                key={gender}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setSelectedGender(gender);
                }}
                className={`px-4 py-2 rounded-full ${
                  selectedGender === gender
                    ? 'bg-pink-500'
                    : 'bg-white/10'
                }`}
              >
                <Text className={`font-medium ${
                  selectedGender === gender ? 'text-white' : 'text-gray-300'
                }`}>
                  {gender}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Origin Filter */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }}>
            <View className="flex-row gap-2">
              {ORIGINS.map((origin) => (
                <Pressable
                  key={origin}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSelectedOrigin(origin);
                  }}
                  className={`px-4 py-2 rounded-full ${
                    selectedOrigin === origin
                      ? 'bg-indigo-500'
                      : 'bg-white/10'
                  }`}
                >
                  <Text className={`font-medium ${
                    selectedOrigin === origin ? 'text-white' : 'text-gray-300'
                  }`}>
                    {origin}
                  </Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Names List */}
        <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
          {filteredNames.map((name, index) => (
            <Animated.View
              key={name.id}
              entering={FadeInDown.delay(index * 60).springify()}
            >
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setExpandedId(expandedId === name.id ? null : name.id);
                }}
                className="bg-white/5 rounded-3xl mb-4 overflow-hidden border border-white/10"
              >
                {/* Header */}
                <View className="p-4">
                  <View className="flex-row items-start justify-between mb-2">
                    <View className="flex-row items-center">
                      <Text className="text-3xl mr-3">{name.flag}</Text>
                      <View>
                        <View className="flex-row items-center">
                          <Text className="text-white text-2xl font-bold">{name.name}</Text>
                          <View
                            className="ml-2 w-6 h-6 rounded-full items-center justify-center"
                            style={{ backgroundColor: GENDER_COLORS[name.gender] }}
                          >
                            <User size={12} color="#fff" />
                          </View>
                        </View>
                        <Text className="text-gray-400 text-sm">{name.pronunciation}</Text>
                      </View>
                    </View>
                    <View className="flex-row items-center gap-2">
                      <View
                        className="px-2 py-1 rounded-full"
                        style={{ backgroundColor: POPULARITY_BADGES[name.popularity].color + '30' }}
                      >
                        <Text style={{ color: POPULARITY_BADGES[name.popularity].color }} className="text-xs font-medium">
                          {POPULARITY_BADGES[name.popularity].label}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <Text className="text-pink-400 text-lg font-medium mb-2">"{name.meaning}"</Text>

                  <View className="flex-row items-center">
                    <Globe2 size={14} color="#9CA3AF" />
                    <Text className="text-gray-400 text-sm ml-1">{name.origin} • {name.country}</Text>
                  </View>
                </View>

                {/* Expanded Content */}
                {expandedId === name.id && (
                  <Animated.View
                    entering={FadeIn.duration(200)}
                    className="border-t border-white/10 p-4"
                  >
                    {/* Variations */}
                    <View className="mb-4">
                      <Text className="text-gray-400 text-xs mb-2">VARIATIONS</Text>
                      <View className="flex-row flex-wrap gap-2">
                        {name.variations.map((variation, idx) => (
                          <View key={idx} className="bg-white/10 px-3 py-1.5 rounded-full">
                            <Text className="text-white text-sm">{variation}</Text>
                          </View>
                        ))}
                      </View>
                    </View>

                    {/* Famous People */}
                    <View className="mb-4">
                      <Text className="text-gray-400 text-xs mb-2">FAMOUS PEOPLE</Text>
                      <View className="flex-row flex-wrap gap-2">
                        {name.famousPeople.map((person, idx) => (
                          <View key={idx} className="bg-indigo-500/20 px-3 py-1.5 rounded-full">
                            <Text className="text-indigo-300 text-sm">{person}</Text>
                          </View>
                        ))}
                      </View>
                    </View>

                    {/* Actions */}
                    <View className="flex-row items-center gap-3">
                      <Pressable
                        onPress={() => toggleSave(name.id)}
                        className={`flex-1 flex-row items-center justify-center py-3 rounded-xl ${
                          name.isSaved ? 'bg-pink-500' : 'bg-white/10'
                        }`}
                      >
                        <Heart
                          size={18}
                          color={name.isSaved ? '#fff' : '#EC4899'}
                          fill={name.isSaved ? '#fff' : 'transparent'}
                        />
                        <Text className={`ml-2 font-medium ${name.isSaved ? 'text-white' : 'text-pink-400'}`}>
                          {name.isSaved ? 'Saved' : 'Save'}
                        </Text>
                      </Pressable>
                      <Pressable className="flex-1 flex-row items-center justify-center py-3 rounded-xl bg-white/10">
                        <Share2 size={18} color="#fff" />
                        <Text className="text-white ml-2 font-medium">Share</Text>
                      </Pressable>
                    </View>
                  </Animated.View>
                )}
              </Pressable>
            </Animated.View>
          ))}

          <View className="h-32" />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
