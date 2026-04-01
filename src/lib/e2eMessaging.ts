/**
 * End-to-end encryption for 1:1 DMs (Curve25519 DH + XSalsa20-Poly1305 via TweetNaCl secretbox).
 * Server stores only ciphertext in messages.content (prefix E2E1:). Private keys never leave the device
 * (native: SecureStore; web: AsyncStorage — weaker, see docs/E2E_MESSAGING.md).
 */
import { Platform } from 'react-native';
import nacl from 'tweetnacl';
import * as naclUtil from 'tweetnacl-util';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';

export const E2E_PREFIX = 'E2E1:';

const skStorageKey = (userId: string) => `intera_e2e_sk_${userId}`;

export function isE2eEnvelope(content: string | null | undefined): boolean {
  return typeof content === 'string' && content.startsWith(E2E_PREFIX);
}

function symmetricKeyFromShared(shared: Uint8Array): Uint8Array {
  return nacl.hash(shared).subarray(0, nacl.secretbox.keyLength);
}

/** X25519-style DH shared secret (32 bytes) */
export function dhSharedSecret(mySecretKey: Uint8Array, peerPublicKey: Uint8Array): Uint8Array {
  return nacl.scalarMult(mySecretKey, peerPublicKey);
}

export function encryptDmPlaintext(
  plaintext: string,
  mySecretKey: Uint8Array,
  peerPublicKey: Uint8Array
): string {
  const shared = dhSharedSecret(mySecretKey, peerPublicKey);
  const key = symmetricKeyFromShared(shared);
  const nonce = nacl.randomBytes(nacl.secretbox.nonceLength);
  const msg = naclUtil.decodeUTF8(plaintext);
  const boxed = nacl.secretbox(msg, nonce, key);
  return `${E2E_PREFIX}${naclUtil.encodeBase64(nonce)}:${naclUtil.encodeBase64(boxed)}`;
}

export function decryptDmPlaintext(
  envelope: string,
  mySecretKey: Uint8Array,
  peerPublicKey: Uint8Array
): string {
  if (!envelope.startsWith(E2E_PREFIX)) return envelope;
  const rest = envelope.slice(E2E_PREFIX.length);
  const colon = rest.indexOf(':');
  if (colon < 0) throw new Error('Invalid E2E envelope');
  const nonceB64 = rest.slice(0, colon);
  const boxB64 = rest.slice(colon + 1);
  const nonce = naclUtil.decodeBase64(nonceB64);
  const boxed = naclUtil.decodeBase64(boxB64);
  const shared = dhSharedSecret(mySecretKey, peerPublicKey);
  const key = symmetricKeyFromShared(shared);
  const opened = nacl.secretbox.open(boxed, nonce, key);
  if (!opened) throw new Error('E2E decrypt failed');
  return naclUtil.encodeUTF8(opened);
}

async function loadSecretKeyBytes(userId: string): Promise<Uint8Array | null> {
  let raw: string | null = null;
  try {
    if (Platform.OS === 'web') {
      raw = await AsyncStorage.getItem(skStorageKey(userId));
    } else {
      raw = await SecureStore.getItemAsync(skStorageKey(userId));
    }
  } catch {
    return null;
  }
  if (!raw) return null;
  try {
    const sk = naclUtil.decodeBase64(raw);
    return sk.length === nacl.box.secretKeyLength ? sk : null;
  } catch {
    return null;
  }
}

async function saveSecretKeyBytes(userId: string, sk: Uint8Array) {
  const b64 = naclUtil.encodeBase64(sk);
  if (Platform.OS === 'web') {
    await AsyncStorage.setItem(skStorageKey(userId), b64);
  } else {
    await SecureStore.setItemAsync(skStorageKey(userId), b64);
  }
}

/** Load or create Curve25519 keypair; persist secret on device only */
export async function getOrCreateE2eIdentity(userId: string): Promise<{
  secretKey: Uint8Array;
  publicKey: Uint8Array;
}> {
  let sk = await loadSecretKeyBytes(userId);
  if (sk) {
    const pk = nacl.scalarMult.base(sk);
    return { secretKey: sk, publicKey: pk };
  }
  const pair = nacl.box.keyPair();
  await saveSecretKeyBytes(userId, pair.secretKey);
  return { secretKey: pair.secretKey, publicKey: pair.publicKey };
}

export function publicKeyToBase64(pk: Uint8Array): string {
  return naclUtil.encodeBase64(pk);
}

export function publicKeyFromBase64(b64: string): Uint8Array {
  return naclUtil.decodeBase64(b64);
}

/** Upsert public key to profiles so peers can encrypt to you */
export async function syncE2ePublicKeyToProfile(userId: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const { publicKey } = await getOrCreateE2eIdentity(userId);
    const b64 = publicKeyToBase64(publicKey);
    const { error } = await supabase.from('profiles').update({ e2e_public_key: b64 }).eq('id', userId);
    if (error) {
      const msg = error.message || String(error);
      if (msg.includes('e2e_public_key') || (error as any).code === 'PGRST204') {
        return { ok: false, error: 'Database missing e2e_public_key column — run migration 20260214120000_profiles_e2e_public_key.sql' };
      }
      return { ok: false, error: msg };
    }
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: String(e?.message ?? e) };
  }
}

export async function fetchPeerE2ePublicKey(peerUserId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('e2e_public_key')
    .eq('id', peerUserId)
    .maybeSingle();
  if (error || !data?.e2e_public_key) return null;
  const k = String(data.e2e_public_key).trim();
  return k.length > 0 ? k : null;
}
