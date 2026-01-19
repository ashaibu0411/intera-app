/**
 * LiveKit Wrapper
 *
 * This wrapper provides a fallback when the native LiveKit module fails to load.
 * Voice rooms will show a "coming soon" message on builds where native modules aren't available.
 */

import React, { ReactNode } from 'react';
import { Platform } from 'react-native';

// Check if we're in a web environment
const isWeb = Platform.OS === 'web';

// Try to import LiveKit, but gracefully handle if it fails
let LiveKitRoomComponent: React.ComponentType<{
  serverUrl: string;
  token: string;
  connect: boolean;
  audio: boolean;
  video: boolean;
  children?: ReactNode;
}> | null = null;

let getRoomContext: (() => unknown) | null = null;
let liveKitAvailable = false;

try {
  // Only attempt to load on native platforms
  if (!isWeb) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const livekit = require('@livekit/react-native');
    LiveKitRoomComponent = livekit.LiveKitRoom;
    getRoomContext = livekit.useRoomContext;
    liveKitAvailable = true;
  }
} catch (error) {
  console.log('[LiveKit] Native module not available, using fallback');
  liveKitAvailable = false;
}

// Re-export the original hook if available, otherwise provide a no-op
// eslint-disable-next-line react-hooks/rules-of-hooks
export const useRoomContext = liveKitAvailable && getRoomContext ? getRoomContext : () => null;

// Props for our wrapper component
interface LiveKitRoomWrapperProps {
  serverUrl: string;
  token: string;
  connect: boolean;
  audio: boolean;
  video: boolean;
  children: ReactNode;
}

// Export a safe LiveKitRoom wrapper
export function LiveKitRoom({
  serverUrl,
  token,
  connect,
  audio,
  video,
  children
}: LiveKitRoomWrapperProps): React.ReactElement {
  // If LiveKit is available and we're not on web, use it
  if (liveKitAvailable && LiveKitRoomComponent) {
    const LKRoom = LiveKitRoomComponent;
    return (
      <LKRoom
        serverUrl={serverUrl}
        token={token}
        connect={connect}
        audio={audio}
        video={video}
      >
        {children}
      </LKRoom>
    );
  }

  // Fallback: render children without LiveKit functionality
  return <>{children}</>;
}

// Check if LiveKit is available
export function isLiveKitAvailable(): boolean {
  return liveKitAvailable;
}
