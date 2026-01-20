/**
 * LiveKit Wrapper
 *
 * LiveKit is not currently available in Vibecode.
 * This wrapper provides stub functions so the voice room UI can work
 * without the native LiveKit module.
 *
 * When LiveKit becomes available:
 * 1. Add @livekit/react-native to package.json
 * 2. Update this file to dynamically import it
 */

import React, { ReactNode } from 'react';

// LiveKit is not currently installed
const liveKitAvailable = false;

// Re-export stub hook
export function useRoomContext(): unknown {
  return null;
}

// Props for our wrapper component
interface LiveKitRoomWrapperProps {
  serverUrl: string;
  token: string;
  connect: boolean;
  audio: boolean;
  video: boolean;
  children: ReactNode;
}

// Export a safe LiveKitRoom wrapper that just renders children
export function LiveKitRoom({
  children
}: LiveKitRoomWrapperProps): React.ReactElement {
  // LiveKit is not available, just render children
  return <>{children}</>;
}

// Check if LiveKit is available
export function isLiveKitAvailable(): boolean {
  return liveKitAvailable;
}
