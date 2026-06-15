import * as SecureStore from 'expo-secure-store'

const K = {
  accessToken:     'vy_at',
  refreshToken:    'vy_rt',
  userId:          'vy_uid',
  phone:           'vy_ph',
  profileComplete: 'vy_pc',
}

export type StoredAuth = {
  accessToken: string
  refreshToken: string
  userId: string
  phone: string
  profileComplete: boolean
}

export const tokenStorage = {
  async save(data: StoredAuth): Promise<void> {
    await Promise.all([
      SecureStore.setItemAsync(K.accessToken,     data.accessToken),
      SecureStore.setItemAsync(K.refreshToken,    data.refreshToken),
      SecureStore.setItemAsync(K.userId,          data.userId),
      SecureStore.setItemAsync(K.phone,           data.phone),
      SecureStore.setItemAsync(K.profileComplete, data.profileComplete ? '1' : '0'),
    ])
  },

  async load(): Promise<StoredAuth | null> {
    const [at, rt, uid, ph, pc] = await Promise.all([
      SecureStore.getItemAsync(K.accessToken),
      SecureStore.getItemAsync(K.refreshToken),
      SecureStore.getItemAsync(K.userId),
      SecureStore.getItemAsync(K.phone),
      SecureStore.getItemAsync(K.profileComplete),
    ])
    if (!rt || !uid) return null
    return {
      accessToken:     at ?? '',
      refreshToken:    rt,
      userId:          uid,
      phone:           ph ?? '',
      profileComplete: pc === '1',
    }
  },

  async updateTokens(accessToken: string, refreshToken: string): Promise<void> {
    await Promise.all([
      SecureStore.setItemAsync(K.accessToken,  accessToken),
      SecureStore.setItemAsync(K.refreshToken, refreshToken),
    ])
  },

  async updateProfileComplete(val: boolean): Promise<void> {
    await SecureStore.setItemAsync(K.profileComplete, val ? '1' : '0')
  },

  async clear(): Promise<void> {
    await Promise.all(Object.values(K).map(k => SecureStore.deleteItemAsync(k)))
  },
}
