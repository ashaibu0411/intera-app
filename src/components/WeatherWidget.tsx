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
  CloudLightning,
  CloudFog,
} from 'lucide-react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';

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

// Fetch real weather from Open-Meteo API (free, no API key required)
const fetchRealWeather = async (city: string, country: string): Promise<WeatherData | null> => {
  try {
    // First, geocode the city to get coordinates
    const geoResponse = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`
    );
    const geoData = await geoResponse.json();

    if (!geoData.results || geoData.results.length === 0) {
      return null;
    }

    const { latitude, longitude } = geoData.results[0];

    // Fetch weather data
    const weatherResponse = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&temperature_unit=fahrenheit&wind_speed_unit=mph`
    );
    const weatherData = await weatherResponse.json();

    if (!weatherData.current) {
      return null;
    }

    const { temperature_2m, relative_humidity_2m, weather_code, wind_speed_10m } = weatherData.current;

    // Map weather codes to conditions
    // https://open-meteo.com/en/docs (WMO Weather interpretation codes)
    const { condition, description } = mapWeatherCode(weather_code);

    return {
      temp: Math.round(temperature_2m),
      condition,
      humidity: relative_humidity_2m,
      windSpeed: Math.round(wind_speed_10m),
      description,
    };
  } catch (error) {
    console.log('Weather fetch error:', error);
    return null;
  }
};

// Map WMO weather codes to our conditions
const mapWeatherCode = (code: number): { condition: string; description: string } => {
  if (code === 0) return { condition: 'Clear', description: 'Clear skies' };
  if (code === 1) return { condition: 'Clear', description: 'Mainly clear' };
  if (code === 2) return { condition: 'Partly Cloudy', description: 'Partly cloudy' };
  if (code === 3) return { condition: 'Cloudy', description: 'Overcast' };
  if (code === 45 || code === 48) return { condition: 'Fog', description: 'Foggy conditions' };
  if (code >= 51 && code <= 55) return { condition: 'Drizzle', description: 'Light drizzle' };
  if (code >= 56 && code <= 57) return { condition: 'Drizzle', description: 'Freezing drizzle' };
  if (code >= 61 && code <= 65) return { condition: 'Rainy', description: 'Rainfall expected' };
  if (code >= 66 && code <= 67) return { condition: 'Rainy', description: 'Freezing rain' };
  if (code >= 71 && code <= 77) return { condition: 'Snow', description: 'Snowfall expected' };
  if (code >= 80 && code <= 82) return { condition: 'Rainy', description: 'Rain showers' };
  if (code >= 85 && code <= 86) return { condition: 'Snow', description: 'Snow showers' };
  if (code >= 95 && code <= 99) return { condition: 'Thunderstorm', description: 'Thunderstorms' };
  return { condition: 'Cloudy', description: 'Variable conditions' };
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
    case 'Partly Cloudy':
      return <Cloud {...iconProps} />;
    case 'Snow':
      return <CloudSnow {...iconProps} />;
    case 'Thunderstorm':
      return <CloudLightning {...iconProps} />;
    case 'Fog':
      return <CloudFog {...iconProps} />;
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
      return ['#A8C8E8', '#7BA3C9'];
    case 'Thunderstorm':
      return ['#4A5568', '#2D3748'];
    case 'Fog':
      return ['#9CA3AF', '#6B7280'];
    default:
      return ['#7C9CB7', '#5B7FA3'];
  }
};

export function WeatherWidget({ city, country, onPress }: WeatherWidgetProps) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch real weather data
    setLoading(true);

    const loadWeather = async () => {
      const realWeather = await fetchRealWeather(city, country);
      setWeather(realWeather);
      setLoading(false);
    };

    loadWeather();
  }, [city, country]);

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({
      pathname: '/weather-details',
      params: { city, country },
    });
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
