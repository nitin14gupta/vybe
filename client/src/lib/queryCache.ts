import AsyncStorage from '@react-native-async-storage/async-storage'

const PREFIX = 'vy_cache:'

interface Entry<T> {
  value: T
  expiresAt: number | null
}

const memory = new Map<string, Entry<unknown>>()
const inFlight = new Map<string, Promise<unknown>>()

function isFresh(entry: Entry<unknown> | undefined | null): entry is Entry<unknown> {
  if (!entry) return false
  return entry.expiresAt === null || entry.expiresAt > Date.now()
}

async function readDisk<T>(key: string): Promise<Entry<T> | null> {
  try {
    const raw = await AsyncStorage.getItem(PREFIX + key)
    return raw ? (JSON.parse(raw) as Entry<T>) : null
  } catch {
    return null
  }
}

function writeDisk<T>(key: string, entry: Entry<T>) {
  AsyncStorage.setItem(PREFIX + key, JSON.stringify(entry)).catch(() => {})
}

export function peekCached<T>(key: string): T | null {
  const entry = memory.get(key) as Entry<T> | undefined
  return entry ? entry.value : null
}

export async function invalidate(key: string): Promise<void> {
  memory.delete(key)
  try { await AsyncStorage.removeItem(PREFIX + key) } catch {}
}

export function setCached<T>(key: string, value: T, ttlMs: number | null = 5 * 60_000, persist = true): void {
  const entry: Entry<T> = { value, expiresAt: ttlMs === null ? null : Date.now() + ttlMs }
  memory.set(key, entry)
  if (persist) writeDisk(key, entry)
}

export async function clearAllCached(): Promise<void> {
  memory.clear()
  inFlight.clear()
  try {
    const keys = await AsyncStorage.getAllKeys()
    const ours = keys.filter(k => k.startsWith(PREFIX))
    if (ours.length) await AsyncStorage.multiRemove(ours)
  } catch {}
}

interface Options<T> {
  ttlMs?: number | null | ((value: T) => number | null)
  /** false = memory-only, gone when the app restarts (short-lived dedup, not worth a disk write) */
  persist?: boolean
}

export async function getOrFetch<T>(key: string, fetcher: () => Promise<T>, opts: Options<T> = {}): Promise<T> {
  const { ttlMs = 60_000, persist = true } = opts

  const mem = memory.get(key) as Entry<T> | undefined
  if (isFresh(mem)) return mem.value

  if (persist) {
    const disk = await readDisk<T>(key)
    if (isFresh(disk)) {
      memory.set(key, disk)
      return disk.value
    }
  }

  const existing = inFlight.get(key) as Promise<T> | undefined
  if (existing) return existing

  const promise = fetcher()
    .then(value => {
      const resolvedTtl = typeof ttlMs === 'function' ? ttlMs(value) : ttlMs
      const entry: Entry<T> = { value, expiresAt: resolvedTtl === null ? null : Date.now() + resolvedTtl }
      memory.set(key, entry)
      if (persist) writeDisk(key, entry)
      return value
    })
    .finally(() => { inFlight.delete(key) })

  inFlight.set(key, promise)
  return promise
}
