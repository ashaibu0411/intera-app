import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft,
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
  Thermometer,
  Sunrise,
  Sunset,
  Gauge,
  CloudSun,
  Moon,
  MapPin,
  RefreshCw,
} from 'lucide-react-native';
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

interface HourlyForecast {
  time: string;
  temp: number;
  weatherCode: number;
}

interface DailyForecast {
  date: string;
  dayName: string;
  tempMax: number;
  tempMin: number;
  weatherCode: number;
  precipProbability: number;
}

interface WeatherDetails {
  temp: number;
  feelsLike: number;
  condition: string;
  description: string;
  humidity: number;
  windSpeed: number;
  windDirection: number;
  visibility: number;
  uvIndex: number;
  pressure: number;
  sunrise: string;
  sunset: string;
  hourly: HourlyForecast[];
  daily: DailyForecast[];
}

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

const getWeatherIcon = (condition: string, size = 32, color = '#fff') => {
  const iconProps = { size, color };

  switch (condition) {
    case 'Clear':
      return <Sun {...iconProps} />;
    case 'Rainy':
      return <CloudRain {...iconProps} />;
    case 'Drizzle':
      return <CloudDrizzle {...iconProps} />;
    case 'Cloudy':
      return <Cloud {...iconProps} />;
    case 'Partly Cloudy':
      return <CloudSun {...iconProps} />;
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

const getSmallWeatherIcon = (code: number, size = 24) => {
  const { condition } = mapWeatherCode(code);
  return getWeatherIcon(condition, size, '#fff');
};

const getWindDirection = (degrees: number): string => {
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round(degrees / 45) % 8;
  return directions[index];
};

const getUVDescription = (uv: number): { text: string; color: string } => {
  if (uv <= 2) return { text: 'Low', color: '#22C55E' };
  if (uv <= 5) return { text: 'Moderate', color: '#EAB308' };
  if (uv <= 7) return { text: 'High', color: '#F97316' };
  if (uv <= 10) return { text: 'Very High', color: '#EF4444' };
  return { text: 'Extreme', color: '#9333EA' };
};

const formatTime = (isoString: string): string => {
  const date = new Date(isoString);
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
};

const formatHour = (isoString: string): string => {
  const date = new Date(isoString);
  const now = new Date();
  if (date.getHours() === now.getHours() && date.getDate() === now.getDate()) {
    return 'Now';
  }
  return date.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true });
};

const getDayName = (dateString: string, index: number): string => {
  if (index === 0) return 'Today';
  if (index === 1) return 'Tomorrow';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { weekday: 'short' });
};

export default function WeatherDetailsScreen() {
  const params = useLocalSearchParams();
  const city = (params.city as string) || 'New York';
  const country = (params.country as string) || 'USA';

  const [weather, setWeather] = useState<WeatherDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchWeather = async () => {
    try {
      // Geocode the city
      const geoResponse = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`
      );
      const geoData = await geoResponse.json();

      if (!geoData.results || geoData.results.length === 0) {
        setLoading(false);
        return;
      }

      const { latitude, longitude, timezone } = geoData.results[0];

      // Fetch comprehensive weather data
      const weatherResponse = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,wind_direction_10m,uv_index,surface_pressure&hourly=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunrise,sunset&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=${encodeURIComponent(timezone)}&forecast_days=7`
      );
      const data = await weatherResponse.json();

      if (!data.current) {
        setLoading(false);
        return;
      }

      const { condition, description } = mapWeatherCode(data.current.weather_code);

      // Process hourly forecast (next 24 hours)
      const hourlyData: HourlyForecast[] = [];
      const currentHour = new Date().getHours();
      for (let i = 0; i < 24; i++) {
        const hourIndex = currentHour + i;
        if (hourIndex < data.hourly.time.length) {
          hourlyData.push({
            time: data.hourly.time[hourIndex],
            temp: Math.round(data.hourly.temperature_2m[hourIndex]),
            weatherCode: data.hourly.weather_code[hourIndex],
          });
        }
      }

      // Process daily forecast
      const dailyData: DailyForecast[] = data.daily.time.map((date: string, index: number) => ({
        date,
        dayName: getDayName(date, index),
        tempMax: Math.round(data.daily.temperature_2m_max[index]),
        tempMin: Math.round(data.daily.temperature_2m_min[index]),
        weatherCode: data.daily.weather_code[index],
        precipProbability: data.daily.precipitation_probability_max[index] || 0,
      }));

      setWeather({
        temp: Math.round(data.current.temperature_2m),
        feelsLike: Math.round(data.current.apparent_temperature),
        condition,
        description,
        humidity: data.current.relative_humidity_2m,
        windSpeed: Math.round(data.current.wind_speed_10m),
        windDirection: data.current.wind_direction_10m,
        visibility: 10, // Open-Meteo doesn't provide visibility in free tier
        uvIndex: Math.round(data.current.uv_index),
        pressure: Math.round(data.current.surface_pressure),
        sunrise: data.daily.sunrise[0],
        sunset: data.daily.sunset[0],
        hourly: hourlyData,
        daily: dailyData,
      });
    } catch (error) {
      console.log('Weather fetch error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchWeather();
  }, [city, country]);

  const handleRefresh = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRefreshing(true);
    await fetchWeather();
  };

  const getGradientColors = (): readonly [string, string, string] => {
    if (!weather) return ['#5B8DBE', '#3B5998', '#1E3A5F'] as const;

    const hour = new Date().getHours();
    const isNight = hour < 6 || hour > 19;

    if (isNight) {
      return ['#1a1a2e', '#16213e', '#0f0f23'] as const;
    }

    switch (weather.condition) {
      case 'Clear':
        return ['#FF9A56', '#FF6B35', '#E55A2B'] as const;
      case 'Rainy':
        return ['#5B8DBE', '#3B5998', '#2D4373'] as const;
      case 'Drizzle':
        return ['#7B9FB7', '#5B8DBE', '#4A7BA7'] as const;
      case 'Cloudy':
      case 'Partly Cloudy':
        return ['#8B9DC3', '#6B7FA3', '#5A6B8A'] as const;
      case 'Snow':
        return ['#A8C8E8', '#7BA3C9', '#6190B5'] as const;
      case 'Thunderstorm':
        return ['#4A5568', '#2D3748', '#1A202C'] as const;
      case 'Fog':
        return ['#9CA3AF', '#6B7280', '#4B5563'] as const;
      default:
        return ['#7C9CB7', '#5B7FA3', '#4A6B8A'] as const;
    }
  };

  if (loading) {
    return (
      <View className="flex-1">
        <LinearGradient
          colors={['#5B8DBE', '#3B5998', '#1E3A5F']}
          style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
        >
          <ActivityIndicator size="large" color="#fff" />
          <Text className="text-white mt-4 text-lg">Loading weather...</Text>
        </LinearGradient>
      </View>
    );
  }

  if (!weather) {
    return (
      <View className="flex-1">
        <LinearGradient
          colors={['#5B8DBE', '#3B5998', '#1E3A5F']}
          style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}
        >
          <Cloud size={64} color="#fff" />
          <Text className="text-white mt-4 text-lg text-center">
            Unable to fetch weather for {city}
          </Text>
          <Pressable
            onPress={() => router.back()}
            className="mt-6 bg-white/20 px-6 py-3 rounded-full"
          >
            <Text className="text-white font-semibold">Go Back</Text>
          </Pressable>
        </LinearGradient>
      </View>
    );
  }

  const uvInfo = getUVDescription(weather.uvIndex);
  const gradientColors = getGradientColors();

  return (
    <View className="flex-1">
      <LinearGradient colors={gradientColors} style={{ flex: 1 }}>
        <SafeAreaView edges={['top']} className="flex-1">
          {/* Header */}
          <View className="flex-row items-center justify-between px-4 py-3">
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.back();
              }}
              className="w-10 h-10 items-center justify-center rounded-full bg-white/10"
            >
              <ArrowLeft size={24} color="#fff" />
            </Pressable>

            <Pressable
              onPress={handleRefresh}
              className="w-10 h-10 items-center justify-center rounded-full bg-white/10"
            >
              <RefreshCw size={20} color="#fff" />
            </Pressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 40 }}
          >
            {/* Main Weather Display */}
            <Animated.View entering={FadeIn.duration(500)} className="items-center px-6 pt-4 pb-8">
              <View className="flex-row items-center mb-2">
                <MapPin size={16} color="#fff" />
                <Text className="text-white/80 text-base ml-1">
                  {city}, {country}
                </Text>
              </View>

              <View className="items-center my-6">
                {getWeatherIcon(weather.condition, 80, '#fff')}
              </View>

              <Text className="text-white text-8xl font-extralight tracking-tight">
                {weather.temp}°
              </Text>

              <Text className="text-white text-xl font-medium mt-2">{weather.condition}</Text>
              <Text className="text-white/70 text-base mt-1">{weather.description}</Text>

              <View className="flex-row items-center mt-4 gap-4">
                <Text className="text-white/80 text-base">
                  H: {weather.daily[0]?.tempMax}°
                </Text>
                <Text className="text-white/80 text-base">
                  L: {weather.daily[0]?.tempMin}°
                </Text>
              </View>
            </Animated.View>

            {/* Hourly Forecast */}
            <Animated.View
              entering={FadeInDown.duration(400).delay(100)}
              className="mx-4 mb-4"
            >
              <View className="bg-white/10 rounded-3xl p-4 backdrop-blur-lg">
                <Text className="text-white/80 text-sm font-medium mb-3 px-1">
                  HOURLY FORECAST
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {weather.hourly.slice(0, 24).map((hour, index) => (
                    <View key={index} className="items-center mr-5 first:ml-1">
                      <Text className="text-white/70 text-xs mb-2">
                        {formatHour(hour.time)}
                      </Text>
                      {getSmallWeatherIcon(hour.weatherCode, 28)}
                      <Text className="text-white font-semibold mt-2 text-base">
                        {hour.temp}°
                      </Text>
                    </View>
                  ))}
                </ScrollView>
              </View>
            </Animated.View>

            {/* 7-Day Forecast */}
            <Animated.View
              entering={FadeInDown.duration(400).delay(200)}
              className="mx-4 mb-4"
            >
              <View className="bg-white/10 rounded-3xl p-4 backdrop-blur-lg">
                <Text className="text-white/80 text-sm font-medium mb-3 px-1">
                  7-DAY FORECAST
                </Text>
                {weather.daily.map((day, index) => (
                  <View
                    key={index}
                    className={`flex-row items-center py-3 ${
                      index < weather.daily.length - 1 ? 'border-b border-white/10' : ''
                    }`}
                  >
                    <Text className="text-white font-medium w-20">{day.dayName}</Text>

                    <View className="flex-row items-center flex-1 justify-center">
                      {day.precipProbability > 20 && (
                        <View className="flex-row items-center mr-2">
                          <Droplets size={12} color="#60A5FA" />
                          <Text className="text-blue-300 text-xs ml-1">
                            {day.precipProbability}%
                          </Text>
                        </View>
                      )}
                      {getSmallWeatherIcon(day.weatherCode, 24)}
                    </View>

                    <View className="flex-row items-center">
                      <Text className="text-white/50 text-base w-10 text-right">
                        {day.tempMin}°
                      </Text>
                      <View className="w-16 h-1 bg-white/20 rounded-full mx-2 overflow-hidden">
                        <View
                          className="h-full bg-white rounded-full"
                          style={{
                            width: `${((day.tempMax - day.tempMin) / 30) * 100}%`,
                            marginLeft: `${((day.tempMin - 20) / 60) * 100}%`,
                          }}
                        />
                      </View>
                      <Text className="text-white font-medium text-base w-10">
                        {day.tempMax}°
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </Animated.View>

            {/* Weather Details Grid */}
            <Animated.View
              entering={FadeInDown.duration(400).delay(300)}
              className="mx-4 mb-4"
            >
              <View className="flex-row flex-wrap justify-between">
                {/* Feels Like */}
                <View className="w-[48%] bg-white/10 rounded-3xl p-4 mb-3">
                  <View className="flex-row items-center mb-3">
                    <Thermometer size={18} color="#fff" />
                    <Text className="text-white/70 text-xs ml-2">FEELS LIKE</Text>
                  </View>
                  <Text className="text-white text-3xl font-semibold">
                    {weather.feelsLike}°
                  </Text>
                  <Text className="text-white/60 text-sm mt-1">
                    {weather.feelsLike > weather.temp
                      ? 'Humidity makes it feel warmer'
                      : weather.feelsLike < weather.temp
                      ? 'Wind makes it feel cooler'
                      : 'Similar to actual temp'}
                  </Text>
                </View>

                {/* UV Index */}
                <View className="w-[48%] bg-white/10 rounded-3xl p-4 mb-3">
                  <View className="flex-row items-center mb-3">
                    <Sun size={18} color="#fff" />
                    <Text className="text-white/70 text-xs ml-2">UV INDEX</Text>
                  </View>
                  <Text className="text-white text-3xl font-semibold">{weather.uvIndex}</Text>
                  <Text style={{ color: uvInfo.color }} className="text-sm font-medium mt-1">
                    {uvInfo.text}
                  </Text>
                </View>

                {/* Wind */}
                <View className="w-[48%] bg-white/10 rounded-3xl p-4 mb-3">
                  <View className="flex-row items-center mb-3">
                    <Wind size={18} color="#fff" />
                    <Text className="text-white/70 text-xs ml-2">WIND</Text>
                  </View>
                  <Text className="text-white text-3xl font-semibold">
                    {weather.windSpeed}
                    <Text className="text-lg"> mph</Text>
                  </Text>
                  <Text className="text-white/60 text-sm mt-1">
                    {getWindDirection(weather.windDirection)} direction
                  </Text>
                </View>

                {/* Humidity */}
                <View className="w-[48%] bg-white/10 rounded-3xl p-4 mb-3">
                  <View className="flex-row items-center mb-3">
                    <Droplets size={18} color="#fff" />
                    <Text className="text-white/70 text-xs ml-2">HUMIDITY</Text>
                  </View>
                  <Text className="text-white text-3xl font-semibold">{weather.humidity}%</Text>
                  <Text className="text-white/60 text-sm mt-1">
                    {weather.humidity > 70
                      ? 'High humidity'
                      : weather.humidity < 30
                      ? 'Low humidity'
                      : 'Comfortable'}
                  </Text>
                </View>

                {/* Pressure */}
                <View className="w-[48%] bg-white/10 rounded-3xl p-4 mb-3">
                  <View className="flex-row items-center mb-3">
                    <Gauge size={18} color="#fff" />
                    <Text className="text-white/70 text-xs ml-2">PRESSURE</Text>
                  </View>
                  <Text className="text-white text-3xl font-semibold">
                    {weather.pressure}
                    <Text className="text-lg"> hPa</Text>
                  </Text>
                  <Text className="text-white/60 text-sm mt-1">
                    {weather.pressure > 1020
                      ? 'High pressure'
                      : weather.pressure < 1000
                      ? 'Low pressure'
                      : 'Normal'}
                  </Text>
                </View>

                {/* Visibility */}
                <View className="w-[48%] bg-white/10 rounded-3xl p-4 mb-3">
                  <View className="flex-row items-center mb-3">
                    <Eye size={18} color="#fff" />
                    <Text className="text-white/70 text-xs ml-2">VISIBILITY</Text>
                  </View>
                  <Text className="text-white text-3xl font-semibold">
                    {weather.visibility}
                    <Text className="text-lg"> mi</Text>
                  </Text>
                  <Text className="text-white/60 text-sm mt-1">
                    {weather.visibility >= 10 ? 'Clear visibility' : 'Reduced visibility'}
                  </Text>
                </View>
              </View>
            </Animated.View>

            {/* Sunrise & Sunset */}
            <Animated.View
              entering={FadeInDown.duration(400).delay(400)}
              className="mx-4 mb-4"
            >
              <View className="bg-white/10 rounded-3xl p-4">
                <View className="flex-row">
                  <View className="flex-1 items-center border-r border-white/10 py-2">
                    <Sunrise size={32} color="#FCD34D" />
                    <Text className="text-white/70 text-xs mt-3">SUNRISE</Text>
                    <Text className="text-white text-xl font-semibold mt-1">
                      {formatTime(weather.sunrise)}
                    </Text>
                  </View>
                  <View className="flex-1 items-center py-2">
                    <Sunset size={32} color="#F97316" />
                    <Text className="text-white/70 text-xs mt-3">SUNSET</Text>
                    <Text className="text-white text-xl font-semibold mt-1">
                      {formatTime(weather.sunset)}
                    </Text>
                  </View>
                </View>
              </View>
            </Animated.View>
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}
