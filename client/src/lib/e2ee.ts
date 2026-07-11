import 'react-native-get-random-values'
import nacl from 'tweetnacl'
import { encodeBase64, decodeBase64, decodeUTF8, encodeUTF8 } from 'tweetnacl-util'
import * as SecureStore from 'expo-secure-store'

// End-to-end chat encryption (X25519 + XSalsa20-Poly1305, via tweetnacl's
// `box`) — the server only ever stores/relays ciphertext, never plaintext.
// This is text-only for now: media attachments (image/video/voice URLs) are
// NOT encrypted in this pass, and this is NOT a full Signal-style protocol
// (no forward secrecy / ratcheting — a compromised device key exposes the
// full history with that partner, like a basic encrypted-at-rest chat, not
// like WhatsApp's per-message ratchet). Good enough that the server operator
// can't read messages; not a drop-in replacement for Signal's guarantees.

const SK_KEY = 'vy_e2ee_sk'
const PK_KEY = 'vy_e2ee_pk'
const ENVELOPE_VERSION = 1

export interface Keypair {
  publicKey: Uint8Array
  secretKey: Uint8Array
}

let cached: Keypair | null = null

export async function loadOrCreateKeypair(): Promise<Keypair> {
  if (cached) return cached

  const [storedSk, storedPk] = await Promise.all([
    SecureStore.getItemAsync(SK_KEY),
    SecureStore.getItemAsync(PK_KEY),
  ])

  if (storedSk && storedPk) {
    cached = { secretKey: decodeBase64(storedSk), publicKey: decodeBase64(storedPk) }
    return cached
  }

  const kp = nacl.box.keyPair()
  await Promise.all([
    SecureStore.setItemAsync(SK_KEY, encodeBase64(kp.secretKey)),
    SecureStore.setItemAsync(PK_KEY, encodeBase64(kp.publicKey)),
  ])
  cached = kp
  return kp
}

export function getCachedPublicKeyB64(): string | null {
  return cached ? encodeBase64(cached.publicKey) : null
}

interface Envelope {
  v: number
  n: string // nonce, base64
  c: string // ciphertext, base64
}

function isEnvelope(v: unknown): v is Envelope {
  return (
    !!v && typeof v === 'object' &&
    (v as Envelope).v === ENVELOPE_VERSION &&
    typeof (v as Envelope).n === 'string' &&
    typeof (v as Envelope).c === 'string'
  )
}

/** Encrypts plaintext for `partnerPublicKeyB64` using my cached secret key. */
export function encryptText(plaintext: string, partnerPublicKeyB64: string): string {
  if (!cached) throw new Error('e2ee keypair not loaded')
  const nonce = nacl.randomBytes(nacl.box.nonceLength)
  const cipher = nacl.box(
    decodeUTF8(plaintext),
    nonce,
    decodeBase64(partnerPublicKeyB64),
    cached.secretKey,
  )
  const envelope: Envelope = { v: ENVELOPE_VERSION, n: encodeBase64(nonce), c: encodeBase64(cipher) }
  return JSON.stringify(envelope)
}

/**
 * Decrypts `payload` using my cached secret key + the partner's public key.
 * Works for messages I sent AND messages I received — the box shared secret
 * is symmetric between the two keypairs regardless of direction.
 *
 * Falls back to returning `payload` unchanged if it doesn't look like our
 * envelope (legacy plaintext messages sent before E2EE shipped, or the
 * partner's key isn't available yet), so callers never need special-case
 * handling for old data.
 */
export function decryptText(payload: string, partnerPublicKeyB64: string | null): string {
  if (!cached || !partnerPublicKeyB64) return payload
  let parsed: unknown
  try {
    parsed = JSON.parse(payload)
  } catch {
    return payload // legacy plaintext, not JSON at all
  }
  if (!isEnvelope(parsed)) return payload // legacy plaintext that happens to be valid JSON

  try {
    const opened = nacl.box.open(
      decodeBase64(parsed.c),
      decodeBase64(parsed.n),
      decodeBase64(partnerPublicKeyB64),
      cached.secretKey,
    )
    if (!opened) return '🔒 Unable to decrypt this message'
    return encodeUTF8(opened)
  } catch {
    return '🔒 Unable to decrypt this message'
  }
}
