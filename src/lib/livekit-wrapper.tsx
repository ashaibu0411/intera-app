/**
 * LiveKit Wrapper
 *
 * Loads `@livekit/react-native` lazily so Metro doesn't crash when
 * native modules aren't present (Expo Go, web, etc.).
 */

import React, { ReactNode } from 'react';
import { Platform } from 'react-native';

const isWeb = Platform.OS === 'web';

type LiveKitModuleLike = {
  LiveKitRoom?: React.ComponentType<any>;
  useRoomContext?: () => unknown;
  registerGlobals?: () => void;
  AudioSession?: {
    startAudioSession?: () => Promise<void> | void;
    stopAudioSession?: () => Promise<void> | void;
  };
};

let LiveKitRoomComponent:
  | React.ComponentType<{
      serverUrl: string;
      token: string;
      connect: boolean;
      audio: boolean;
      video: boolean;
      children?: ReactNode;
    }>
  | null = null;

let _useRoomContext: (() => unknown) | null = null;
let _initialized = false;
let _available = false;
let _module: LiveKitModuleLike | null = null;
let _globalsRegistered = false;

function initializeLiveKit() {
  if (_initialized) return;
  _initialized = true;

  try {
    if (isWeb) {
      _available = false;
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const livekit = require('@livekit/react-native') as LiveKitModuleLike;
    _module = livekit;

    if (!_globalsRegistered) {
      _globalsRegistered = true;
      try {
        livekit.registerGlobals?.();
      } catch (e) {
        console.log('[LiveKit] registerGlobals failed:', String((e as any)?.message ?? e));
      }
    }

    LiveKitRoomComponent = livekit.LiveKitRoom;
    _useRoomContext = livekit.useRoomContext;
    _available = true;
  } catch (e) {
    console.log('[LiveKit] Not available in this build:', String((e as any)?.message ?? e));
    _available = false;
  }
}

export function useRoomContext(): unknown {
  initializeLiveKit();
  if (_available && _useRoomContext) return _useRoomContext();
  return null;
}

export function getLiveKitModule(): LiveKitModuleLike | null {
  initializeLiveKit();
  if (!_available) return null;
  return _module;
}

interface LiveKitRoomWrapperProps {
  serverUrl: string;
  token: string;
  connect: boolean;
  audio: boolean;
  video: boolean;
  children: ReactNode;
}

export function LiveKitRoom({
  serverUrl,
  token,
  connect,
  audio,
  video,
  children,
}: LiveKitRoomWrapperProps): React.ReactElement {
  initializeLiveKit();
  if (_available && LiveKitRoomComponent) {
    const LK = LiveKitRoomComponent;
    return (
      <LK serverUrl={serverUrl} token={token} connect={connect} audio={audio} video={video}>
        {children}
      </LK>
    );
  }
  return <>{children}</>;
}

export function isLiveKitAvailable(): boolean {
  initializeLiveKit();
  return _available;
}
