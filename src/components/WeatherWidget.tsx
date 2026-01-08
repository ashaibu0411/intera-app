import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Cloud,
  CloudRain,
  CloudSnow,
  Sun,
  CloudDrizzle,
  Wind,
  Droplets,
  Eye,
} from 'lucide-react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

interface WeatherWidgetProps {
  city: string;
  country: string;
  onPress?: () => void;
}

interface WeatherData {
  temp: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  description: string;
}

// Mock weather data generator based on city
const getMockWeather = (city: string, country: string): WeatherData => {
  // Generate consistent but varied weather based on city name
  const hash = city.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const temp = 15 + (hash % 20); // 15-35°C

  const conditions = ['Clear', 'Partly Cloudy', 'Cloudy', 'Rainy', 'Drizzle'];
  const condition = conditions[hash % conditions.length];

  const descriptions = {
    'Clear': 'Sunny skies ahead',
    'Partly Cloudy': 'Mix of sun and clouds',
    'Cloudy': 'Overcast skies',
    'Rainy': 'Expect rainfall',
    'Drizzle': 'Light rain expected',
  };

  return {
    temp,
    condition,
    humidity: 40 + (hash % 40),
    windSpeed: 5 + (hash % 20),
    description: descriptions[condition as keyof typeof descriptions],
  };
};

const getWeatherIcon = (condition: string) => {
  const iconProps = { size: 48, color: '#fff' };

  switch (condition) {
    case 'Clear':
      return <Sun {...iconProps} />;
    case 'Rainy':
      return <CloudRain {...iconProps} />;
    case 'Drizzle':
      return <CloudDrizzle {...iconProps} />;
    case 'Cloudy':
      return <Cloud {...iconProps} />;
    case 'Snow':
      return <CloudSnow {...iconProps} />;
    default:
      return <Cloud {...iconProps} />;
  }
};

const getGradientColors = (condition: string): [string, string] => {
  switch (condition) {
    case 'Clear':
      return ['#FF9A56', '#FF6B35'];
    case 'Rainy':
      return ['#5B8DBE', '#3B5998'];
    case 'Drizzle':
      return ['#7B9FB7', '#5B8DBE'];
    case 'Cloudy':
    case 'Partly Cloudy':
      return ['#8B9DC3', '#6B7FA3'];
    case 'Snow':
      return ['#B8D4E8', '#9BB8D3'];
    default:
      return ['#7C9CB7', '#5B7FA3'];
  }
};

export function WeatherWidget({ city, country, onPress }: WeatherWidgetProps) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate fetching weather data
    setLoading(true);
    const timer = setTimeout(() => {
      const mockWeather = getMockWeather(city, country);
      setWeather(mockWeather);
      setLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [city, country]);

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.();
  };

  if (loading) {
    return (
      <View className="mx-4 mt-3 mb-2 rounded-3xl overflow-hidden">
        <LinearGradient
          colors={['#7C9CB7', '#5B7FA3']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ padding: 20 }}
        >
          <View className="items-center justify-center py-4">
            <ActivityIndicator size="small" color="#fff" />
          </View>
        </LinearGradient>
      </View>
    );
  }

  if (!weather) return null;

  const gradientColors = getGradientColors(weather.condition);

  return (
    <Animated.View
      entering={FadeIn.duration(400)}
      className="mx-4 mt-3 mb-2"
    >
      <Pressable
        onPress={handlePress}
        className="rounded-3xl overflow-hidden active:scale-98"
        style={{
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.15,
          shadowRadius: 12,
          elevation: 5,
        }}
      >
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ padding: 20 }}
        >
          {/* Location Header */}
          <View className="flex-row items-center mb-4">
            <View className="flex-1">
              <Text className="text-white text-sm font-medium opacity-90">
                Current Weather
              </Text>
              <Text className="text-white text-lg font-bold mt-0.5">
                {city}, {country}
              </Text>
            </View>
          </View>

          {/* Main Weather Info */}
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-row items-center">
              {getWeatherIcon(weather.condition)}
              <View className="ml-4">
                <Text className="text-white text-5xl font-bold">
                  {Math.round(weather.temp)}°
                </Text>
                <Text className="text-white text-base opacity-90 mt-1">
                  {weather.condition}
                </Text>
              </View>
            </View>
          </View>

          {/* Weather Details */}
          <View className="flex-row justify-between pt-4 border-t border-white/20">
            <View className="flex-row items-center">
              <Droplets size={18} color="#fff" />
              <View className="ml-2">
                <Text className="text-white text-xs opacity-75">Humidity</Text>
                <Text className="text-white text-sm font-semibold">
                  {weather.humidity}%
                </Text>
              </View>
            </View>

            <View className="flex-row items-center">
              <Wind size={18} color="#fff" />
              <View className="ml-2">
                <Text className="text-white text-xs opacity-75">Wind</Text>
                <Text className="text-white text-sm font-semibold">
                  {weather.windSpeed} km/h
                </Text>
              </View>
            </View>

            <View className="flex-row items-center">
              <Eye size={18} color="#fff" />
              <View className="ml-2">
                <Text className="text-white text-xs opacity-75">Status</Text>
                <Text className="text-white text-sm font-semibold">Good</Text>
              </View>
            </View>
          </View>

          {/* Description */}
          <Text className="text-white text-sm opacity-80 mt-3 text-center">
            {weather.description}
          </Text>
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}
