import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { useEffect } from 'react';
import { requestNotificationPermissions } from '@/lib/notifications';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

// Custom light theme with AfroConnect colors
const AfroConnectTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#FAF7F2',
    card: '#FFFFFF',
    text: '#2D1F1A',
    primary: '#D4673A',
  },
};

function RootLayoutNav() {
  // Request notification permissions on app launch
  useEffect(() => {
    requestNotificationPermissions();
  }, []);

  return (
    <ThemeProvider value={AfroConnectTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="welcome" options={{ animation: 'fade' }} />
        <Stack.Screen name="location-select" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="signup" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="profile-setup" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="onboarding" options={{ animation: 'fade' }} />
        <Stack.Screen name="student-hub" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="marketplace" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="faith-community" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="business-directory" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="post/[id]" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="messages" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="chat/[id]" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="create-study-group" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="become-mentor" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="post-internship" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="new-arrival-help" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="create-listing" options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="register-business" options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="create-faith-event" options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="my-posts" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="saved-posts" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="connections" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="settings" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="life-events" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="my-businesses" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="paywall" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
      </Stack>
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <KeyboardProvider>
          <StatusBar style="dark" />
          <RootLayoutNav />
        </KeyboardProvider>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}
