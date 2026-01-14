import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, router, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { useEffect, useState, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { requestNotificationPermissions } from '@/lib/notifications';
import { useMessageNotifications } from '@/lib/useMessageNotifications';
import { useCommunityNotifications } from '@/lib/useCommunityNotifications';
import { useStore } from '@/lib/store';
import { markUserOnline, markUserOffline } from '@/lib/onlineStatus';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

// Custom light theme with Diaspora colors - Colorful Professional
const DiasporaTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#FAFAFA',
    card: '#FFFFFF',
    text: '#1F2937',
    primary: '#7C3AED',
    border: '#E5E7EB',
    notification: '#EF4444',
  },
};

function RootLayoutNav() {
  const hasSeenStory = useStore((s) => s.hasSeenStory);
  const [isHydrated, setIsHydrated] = useState(false);
  const [hasNavigated, setHasNavigated] = useState(false);
  const segments = useSegments();
  const appState = useRef<AppStateStatus>(AppState.currentState);

  // Request notification permissions on app launch
  useEffect(() => {
    requestNotificationPermissions();
  }, []);

  // Track online status based on app state
  useEffect(() => {
    // Mark user online when app starts
    markUserOnline();

    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        // App has come to foreground - mark user online
        markUserOnline();
      } else if (nextAppState.match(/inactive|background/)) {
        // App is going to background - mark user offline
        markUserOffline();
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
      // Mark offline when component unmounts (app closes)
      markUserOffline();
    };
  }, []);

  // Listen for new messages and send notifications
  useMessageNotifications();

  // Listen for community notifications (posts, events)
  useCommunityNotifications();

  // Wait for store hydration
  useEffect(() => {
    const checkHydration = () => {
      if (useStore.persist.hasHydrated()) {
        setIsHydrated(true);
      }
    };

    checkHydration();
    const unsubscribe = useStore.persist.onFinishHydration(() => {
      setIsHydrated(true);
    });

    return unsubscribe;
  }, []);

  // Navigate to story screen if user hasn't seen it
  // Using segments to confirm router is mounted
  useEffect(() => {
    if (isHydrated && !hasSeenStory && !hasNavigated && segments.length > 0) {
      router.replace('/story');
      setHasNavigated(true);
    }
  }, [isHydrated, hasSeenStory, hasNavigated, segments]);

  return (
    <ThemeProvider value={DiasporaTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="story" options={{ animation: 'fade' }} />
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
        <Stack.Screen name="profile/[id]" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="messages" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="chat/[id]" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="create-study-group" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="become-mentor" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="post-internship" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="new-arrival-help" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="create-listing" options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="register-business" options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="create-faith-event" options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="serve-connect" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="register-talent" options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="create-event" options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="my-posts" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="saved-posts" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="connections" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="settings" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="life-events" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="my-businesses" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="paywall" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
        {/* Advanced Features */}
        <Stack.Screen name="trust-score" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="village-council" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="susu-circles" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="job-board" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="voice-rooms" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="heritage-hub" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="safety-network" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="support-circles" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="gamification" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="advanced-events" options={{ animation: 'slide_from_right' }} />
        {/* Heritage Hub Sub-screens */}
        <Stack.Screen name="language-pod" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="create-language-pod" options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="family-tree" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="create-family-tree" options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="recipe-detail" options={{ animation: 'slide_from_right' }} />
        {/* Business Appointment Screens */}
        <Stack.Screen name="book-appointment" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="my-appointments" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="business-appointments" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="manage-booking-calendar" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="business-pro-paywall" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="seller-pro-paywall" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
        {/* Global Translator */}
        <Stack.Screen name="translator" options={{ animation: 'slide_from_right' }} />
        {/* Live Radio */}
        <Stack.Screen name="live-radio" options={{ animation: 'slide_from_right' }} />
        {/* Stories & Clips */}
        <Stack.Screen name="stories" options={{ headerShown: true, animation: 'slide_from_right' }} />
        <Stack.Screen name="clips" options={{ headerShown: true, animation: 'slide_from_right' }} />
        {/* Additional Features */}
        <Stack.Screen name="african-food" options={{ headerShown: true, animation: 'slide_from_right' }} />
        <Stack.Screen name="creator-battles" options={{ headerShown: true, animation: 'slide_from_right' }} />
        <Stack.Screen name="duets" options={{ headerShown: true, animation: 'slide_from_right' }} />
        <Stack.Screen name="gem-store" options={{ headerShown: true, animation: 'slide_from_right' }} />
        <Stack.Screen name="immigration-help" options={{ headerShown: true, animation: 'slide_from_right' }} />
        <Stack.Screen name="remittance" options={{ headerShown: true, animation: 'slide_from_right' }} />
        <Stack.Screen name="stream-polls" options={{ headerShown: true, animation: 'slide_from_right' }} />
        {/* New Community Features */}
        <Stack.Screen name="cultural-calendar" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="skill-swap" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="carpool" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="pet-connect" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="memory-capsules" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="housing-board" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="lost-found" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="appreciation-wall" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="proverbs-wisdom" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="name-meanings" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="group-grocery" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="traditional-attire" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="fitness-challenges" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="mental-health" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="emergency-contacts" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="document-translation" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="traditional-medicine" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="photo-booth" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="talk-to-someone" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="privacy-policy" options={{ animation: 'slide_from_right' }} />
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
