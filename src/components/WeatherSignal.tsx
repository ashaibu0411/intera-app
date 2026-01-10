import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, Modal, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Cloud,
  CloudRain,
  CloudSnow,
  Sun,
  CloudDrizzle,
  CloudLightning,
  CloudFog,
  MapPin,
  X,
  Calendar,
  AlertTriangle,
  Umbrella,
  Wind,
  Droplets,
  School,
  Car,
} from 'lucide-react-native';
import Animated, { FadeIn, FadeInDown, SlideInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

interface WeatherSignalProps {
  city: string;
  country: string;
}

interface WeatherData {
  temp: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  description: string;
  weatherCode: number;
}

interface CommunityContext {
  message: string;
  type: 'good' | 'caution' | 'alert';
  affectedCount?: number;
  icon: React.ReactNode;
}

// Fetch real weather from Open-Meteo API (free, no API key required)
const fetchRealWeather = async (city: string, country: string): Promise<WeatherData | null> => {
  try {
    const geoResponse = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`
    );
    const geoData = await geoResponse.json();

    if (!geoData.results || geoData.results.length === 0) {
      return null;
    }

    const { latitude, longitude } = geoData.results[0];

    const weatherResponse = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&temperature_unit=fahrenheit&wind_speed_unit=mph`
    );
    const weatherData = await weatherResponse.json();

    if (!weatherData.current) {
      return null;
    }

    const { temperature_2m, relative_humidity_2m, weather_code, wind_speed_10m } = weatherData.current;
    const { condition, description } = mapWeatherCode(weather_code);

    return {
      temp: Math.round(temperature_2m),
      condition,
      humidity: relative_humidity_2m,
      windSpeed: Math.round(wind_speed_10m),
      description,
      weatherCode: weather_code,
    };
  } catch (error) {
    console.log('Weather fetch error:', error);
    return null;
  }
};

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

const getWeatherIcon = (condition: string, size: number = 16, color: string = '#6B7280') => {
  const iconProps = { size, color };

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

// Generate community-relevant context based on weather
const getCommunityContext = (weather: WeatherData): CommunityContext => {
  const { condition, windSpeed, weatherCode, temp } = weather;

  // Thunderstorm - high alert
  if (weatherCode >= 95) {
    return {
      message: 'Severe weather alert - Stay safe',
      type: 'alert',
      affectedCount: 5,
      icon: <AlertTriangle size={14} color="#DC2626" />,
    };
  }

  // Extreme cold (below 32°F / freezing)
  if (temp <= 32) {
    return {
      message: 'Freezing temperatures - bundle up & limit outdoor time',
      type: 'caution',
      icon: <AlertTriangle size={14} color="#3B82F6" />,
    };
  }

  // Very cold (33-40°F)
  if (temp <= 40) {
    return {
      message: 'Cold weather - dress warmly for outdoor activities',
      type: 'caution',
      icon: <CloudSnow size={14} color="#6B7280" />,
    };
  }

  // Heavy rain
  if (weatherCode >= 63 && weatherCode <= 67) {
    return {
      message: 'Heavy rain - outdoor events may be affected',
      type: 'caution',
      affectedCount: 3,
      icon: <Umbrella size={14} color="#F59E0B" />,
    };
  }

  // Light rain/drizzle
  if ((weatherCode >= 51 && weatherCode <= 57) || (weatherCode >= 61 && weatherCode <= 62)) {
    return {
      message: 'Light rain expected - bring an umbrella',
      type: 'caution',
      icon: <CloudRain size={14} color="#6B7280" />,
    };
  }

  // Snow
  if (weatherCode >= 71 && weatherCode <= 86) {
    return {
      message: 'Snow conditions - check for schedule updates',
      type: 'caution',
      affectedCount: 2,
      icon: <School size={14} color="#3B82F6" />,
    };
  }

  // Fog
  if (weatherCode === 45 || weatherCode === 48) {
    return {
      message: 'Foggy conditions - drive safely',
      type: 'caution',
      icon: <Car size={14} color="#6B7280" />,
    };
  }

  // High winds
  if (windSpeed > 20) {
    return {
      message: 'High winds - outdoor activities may be affected',
      type: 'caution',
      icon: <Wind size={14} color="#F59E0B" />,
    };
  }

  // Extreme heat (above 95°F)
  if (temp >= 95) {
    return {
      message: 'Extreme heat - stay hydrated & limit sun exposure',
      type: 'caution',
      icon: <AlertTriangle size={14} color="#DC2626" />,
    };
  }

  // Hot weather (85-94°F)
  if (temp >= 85) {
    return {
      message: 'Hot day - stay hydrated during outdoor activities',
      type: 'caution',
      icon: <Sun size={14} color="#F59E0B" />,
    };
  }

  // Cool but nice (41-55°F)
  if (temp <= 55) {
    return {
      message: 'Cool weather - bring a jacket for outdoor plans',
      type: 'good',
      icon: <Calendar size={14} color="#6B7280" />,
    };
  }

  // Good weather (56-84°F and clear/partly cloudy)
  if (condition === 'Clear' || condition === 'Partly Cloudy') {
    return {
      message: 'Great weather for outdoor activities',
      type: 'good',
      icon: <Calendar size={14} color="#10B981" />,
    };
  }

  return {
    message: 'Check event updates for weather changes',
    type: 'good',
    icon: <Calendar size={14} color="#6B7280" />,
  };
};

export function WeatherSignal({ city, country }: WeatherSignalProps) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetchRealWeather(city, country).then((data) => {
      setWeather(data);
      setLoading(false);
    });
  }, [city, country]);

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowDetails(true);
  };

  if (loading || !weather) return null;

  const context = getCommunityContext(weather);

  const contextBgColor =
    context.type === 'alert' ? 'bg-red-50' :
    context.type === 'caution' ? 'bg-amber-50' :
    'bg-emerald-50';

  const contextTextColor =
    context.type === 'alert' ? 'text-red-700' :
    context.type === 'caution' ? 'text-amber-700' :
    'text-emerald-700';

  return (
    <>
      <Animated.View entering={FadeIn.duration(300)}>
        <Pressable
          onPress={handlePress}
          className={`mx-4 mt-3 px-3 py-2.5 rounded-xl flex-row items-center ${contextBgColor}`}
          style={({ pressed }) => ({
            opacity: pressed ? 0.8 : 1,
          })}
        >
          {/* Weather Icon & Temp */}
          <View className="flex-row items-center">
            {getWeatherIcon(weather.condition, 18, context.type === 'alert' ? '#DC2626' : context.type === 'caution' ? '#D97706' : '#059669')}
            <Text className={`text-base font-bold ml-1.5 ${contextTextColor}`}>
              {weather.temp}°
            </Text>
          </View>

          {/* Divider */}
          <View className={`w-px h-4 mx-3 ${context.type === 'alert' ? 'bg-red-200' : context.type === 'caution' ? 'bg-amber-200' : 'bg-emerald-200'}`} />

          {/* Location */}
          <View className="flex-row items-center">
            <MapPin size={12} color={context.type === 'alert' ? '#DC2626' : context.type === 'caution' ? '#D97706' : '#059669'} />
            <Text className={`text-xs font-medium ml-1 ${contextTextColor}`}>
              {city}
            </Text>
          </View>

          {/* Divider */}
          <View className={`w-px h-4 mx-3 ${context.type === 'alert' ? 'bg-red-200' : context.type === 'caution' ? 'bg-amber-200' : 'bg-emerald-200'}`} />

          {/* Community Context */}
          <View className="flex-1 flex-row items-center">
            {context.icon}
            <Text className={`text-xs ml-1.5 flex-1 ${contextTextColor}`} numberOfLines={1}>
              {context.message}
            </Text>
          </View>

          {/* Affected count badge */}
          {context.affectedCount && (
            <View className={`ml-2 px-2 py-0.5 rounded-full ${
              context.type === 'alert' ? 'bg-red-100' : 'bg-amber-100'
            }`}>
              <Text className={`text-xs font-medium ${
                context.type === 'alert' ? 'text-red-600' : 'text-amber-600'
              }`}>
                {context.affectedCount} events
              </Text>
            </View>
          )}
        </Pressable>
      </Animated.View>

      {/* Detail Sheet Modal */}
      <Modal
        visible={showDetails}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDetails(false)}
      >
        <Pressable
          className="flex-1 bg-black/40 justify-end"
          onPress={() => setShowDetails(false)}
        >
          <Pressable onPress={() => {}}>
            <Animated.View
              entering={SlideInUp.duration(300)}
              className="bg-white rounded-t-3xl"
            >
              {/* Handle */}
              <View className="items-center pt-3 pb-2">
                <View className="w-10 h-1 bg-gray-300 rounded-full" />
              </View>

              {/* Header */}
              <View className="flex-row items-center justify-between px-5 pb-4">
                <View className="flex-row items-center">
                  {getWeatherIcon(weather.condition, 28, '#374151')}
                  <View className="ml-3">
                    <Text className="text-2xl font-bold text-gray-900">{weather.temp}°F</Text>
                    <Text className="text-sm text-gray-500">{weather.condition} in {city}</Text>
                  </View>
                </View>
                <Pressable
                  onPress={() => setShowDetails(false)}
                  className="w-8 h-8 rounded-full bg-gray-100 items-center justify-center"
                >
                  <X size={18} color="#6B7280" />
                </Pressable>
              </View>

              {/* Weather Details */}
              <View className="flex-row px-5 pb-4">
                <View className="flex-1 flex-row items-center">
                  <Droplets size={16} color="#6B7280" />
                  <Text className="text-sm text-gray-600 ml-2">Humidity: {weather.humidity}%</Text>
                </View>
                <View className="flex-1 flex-row items-center">
                  <Wind size={16} color="#6B7280" />
                  <Text className="text-sm text-gray-600 ml-2">Wind: {weather.windSpeed} mph</Text>
                </View>
              </View>

              {/* Community Context Card */}
              <View className={`mx-5 p-4 rounded-2xl mb-4 ${contextBgColor}`}>
                <View className="flex-row items-start">
                  <View className={`w-10 h-10 rounded-full items-center justify-center ${
                    context.type === 'alert' ? 'bg-red-100' :
                    context.type === 'caution' ? 'bg-amber-100' : 'bg-emerald-100'
                  }`}>
                    {context.type === 'alert' ? <AlertTriangle size={20} color="#DC2626" /> :
                     context.type === 'caution' ? <AlertTriangle size={20} color="#D97706" /> :
                     <Sun size={20} color="#059669" />}
                  </View>
                  <View className="flex-1 ml-3">
                    <Text className={`text-sm font-semibold ${contextTextColor}`}>
                      Community Impact
                    </Text>
                    <Text className={`text-sm mt-1 ${contextTextColor} opacity-80`}>
                      {context.message}
                    </Text>
                    {context.affectedCount && (
                      <Text className={`text-xs mt-2 font-medium ${contextTextColor}`}>
                        {context.affectedCount} outdoor events may be affected
                      </Text>
                    )}
                  </View>
                </View>
              </View>

              {/* Tips based on weather - temperature aware */}
              <View className="px-5 pb-6">
                <Text className="text-sm font-semibold text-gray-900 mb-3">Weather Tips</Text>
                <View className="space-y-2">
                  {/* Freezing temperatures */}
                  {weather.temp <= 32 && (
                    <>
                      <WeatherTip text="Dress in warm layers and cover exposed skin" />
                      <WeatherTip text="Check on elderly neighbors who may need help" />
                      <WeatherTip text="Keep outdoor activities brief to avoid frostbite" />
                    </>
                  )}
                  {/* Very cold (33-40°F) */}
                  {weather.temp > 32 && weather.temp <= 40 && (
                    <>
                      <WeatherTip text="Wear a warm coat, hat, and gloves outdoors" />
                      <WeatherTip text="Indoor community events are preferable today" />
                      <WeatherTip text="Great weather for a warm coffee meetup" />
                    </>
                  )}
                  {/* Cool (41-55°F) */}
                  {weather.temp > 40 && weather.temp <= 55 && (
                    <>
                      <WeatherTip text="Bring a jacket for outdoor activities" />
                      <WeatherTip text="Good weather for brisk walks or light exercise" />
                      <WeatherTip text="Perfect for outdoor markets and festivals" />
                    </>
                  )}
                  {/* Nice weather (56-84°F) */}
                  {weather.temp > 55 && weather.temp < 85 && (
                    <>
                      <WeatherTip text="Perfect day for community outdoor events" />
                      <WeatherTip text="Great weather for carpooling or walking" />
                      <WeatherTip text="Ideal conditions for park gatherings" />
                    </>
                  )}
                  {/* Hot weather (85-94°F) */}
                  {weather.temp >= 85 && weather.temp < 95 && (
                    <>
                      <WeatherTip text="Stay hydrated - bring water to outdoor events" />
                      <WeatherTip text="Seek shade during peak sun hours (11am-3pm)" />
                      <WeatherTip text="Consider morning or evening outdoor activities" />
                    </>
                  )}
                  {/* Extreme heat (95°F+) */}
                  {weather.temp >= 95 && (
                    <>
                      <WeatherTip text="Limit outdoor activities during peak heat" />
                      <WeatherTip text="Check on neighbors, especially elderly" />
                      <WeatherTip text="Indoor community events recommended today" />
                    </>
                  )}
                  {/* Rain-specific tips (in addition to temp) */}
                  {(weather.condition === 'Rainy' || weather.condition === 'Drizzle') && (
                    <>
                      <WeatherTip text="Check event venues for indoor alternatives" />
                      <WeatherTip text="Consider ride-sharing to stay dry" />
                    </>
                  )}
                  {/* Snow-specific tips */}
                  {weather.condition === 'Snow' && (
                    <>
                      <WeatherTip text="Check local school and business updates" />
                      <WeatherTip text="Help neighbors with snow removal" />
                    </>
                  )}
                  {/* Thunderstorm-specific tips */}
                  {weather.condition === 'Thunderstorm' && (
                    <>
                      <WeatherTip text="Stay indoors and check on neighbors" />
                      <WeatherTip text="Monitor community alerts for updates" />
                    </>
                  )}
                </View>
              </View>

              {/* Safe area spacing */}
              <View className="h-8" />
            </Animated.View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

function WeatherTip({ text }: { text: string }) {
  return (
    <View className="flex-row items-center py-2 px-3 bg-gray-50 rounded-xl">
      <View className="w-1.5 h-1.5 rounded-full bg-gray-400 mr-3" />
      <Text className="text-sm text-gray-600 flex-1">{text}</Text>
    </View>
  );
}
