import Constants from 'expo-constants'

export const API_BASE_URL: string =
  (Constants.expoConfig?.extra?.apiUrl as string | undefined) ?? 'http://192.168.0.104:8000'

export const ENDPOINTS = {
  // Auth
  SEND_OTP:      '/auth/send-otp',
  VERIFY_OTP:    '/auth/verify-otp',
  REFRESH_TOKEN: '/auth/refresh',
  LOGOUT:        '/auth/logout',

  // User profile
  CREATE_PROFILE:  '/users/profile',
  UPDATE_PROFILE:  '/users/profile',
  SET_INTERESTS:   '/users/interests',
  SET_LOCATION:    '/users/location',
  GET_ME:          '/users/me',

  // Upload
  UPLOAD_PHOTO:    '/upload/photo',
  SWAP_PHOTOS:     '/upload/photo/swap',
  DELETE_PHOTO:    '/upload/photo/{id}',
  UPLOAD_VOICE:    '/upload/voice',

  // Places
  GET_CITIES:      '/places/cities',
  GET_INTERESTS:   '/places/interests',
  GET_BADGES:      '/places/badges',

  // Social
  GET_PROFILE:     '/users/:id',
  FOLLOW_USER:     '/users/:id/follow',

  // Discover
  DISCOVER:        '/discover',
} as const

export const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
} as const

export const createAuthHeader = (token: string) => ({
  Authorization: `Bearer ${token}`,
})
