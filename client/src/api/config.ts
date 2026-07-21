import Constants from 'expo-constants'

export const APP_SCHEME = Constants.expoConfig!.scheme!

export const BUNDLE_ID = Constants.expoConfig!.ios!.bundleIdentifier!
export const EAS_PROJECT_ID: string = Constants.expoConfig?.extra?.eas?.projectId as string
export const UNIVERSAL_LINK_DOMAIN = 'link.uilora.com'
export const API_BASE_URL = Constants.expoConfig!.extra!.apiUrl!

export const ENDPOINTS = {
  // Auth
  SEND_OTP: '/auth/send-otp',
  VERIFY_OTP: '/auth/verify-otp',
  REFRESH_TOKEN: '/auth/refresh',
  LOGOUT: '/auth/logout',

  // User profile
  CREATE_PROFILE: '/users/profile',
  UPDATE_PROFILE: '/users/profile',
  SET_INTERESTS: '/users/interests',
  SET_LOCATION: '/users/location',
  UPDATE_LIVE_LOCATION: '/users/location/live',
  GET_ME: '/users/me',

  // Upload
  UPLOAD_PHOTO: '/upload/photo',
  UPLOAD_EVENT_PHOTO: '/upload/event-photo',
  SWAP_PHOTOS: '/upload/photo/swap',
  REORDER_PHOTOS: '/upload/photo/reorder',
  DELETE_PHOTO: '/upload/photo/{id}',
  UPLOAD_VOICE: '/upload/voice',
  UPLOAD_CHAT_VOICE: '/upload/chat-voice',
  UPLOAD_CHAT_MEDIA: '/upload/chat-media',

  // Places
  GET_CITIES: '/places/cities',
  GET_INTERESTS: '/places/interests',
  GET_BADGES: '/places/badges',

  // Social
  GET_PROFILE: '/users/:id',
  GET_USER_PROFILE: '/users/:id/profile',
  FOLLOW_USER: '/users/:id/follow',
  USER_FOLLOWERS: '/users/:id/followers',
  USER_FOLLOWING: '/users/:id/following',
  REMOVE_FOLLOWER: '/users/followers/:id',
  SEARCH_USERS: '/users/search',
  CHECK_USERNAME: '/users/check-username',

  // Vibes
  VIBES: '/vibes',

  // Events
  EVENTS: '/events',
  EVENT_DETAIL: '/events/:id',
  EVENT_RSVP: '/events/:id/rsvp',
  EVENT_UPDATE: '/events/:id',
  EVENT_ATTENDEES: '/events/:id/attendees',
  EVENT_GUESTS: '/events/:id/guests',
  EVENT_TICKET: '/events/:id/ticket',
  EVENT_CHECKIN: '/events/:id/checkin',
  EVENT_REVIEWS: '/events/:id/reviews',
  EVENT_WAITLIST: '/events/:id/waitlist',
  EVENT_WAITLIST_ADMIT: '/events/:id/waitlist/admit',
  EVENT_FREE_SLOTS: '/events/free-slots',

  // Chat
  CONVERSATIONS: '/chat/conversations',
  CONVERSATION_MESSAGES: '/chat/conversations/:id/messages',
  CONVERSATION_READ: '/chat/conversations/:id/read',
  CONVERSATION_PARTNER_KEY: '/chat/conversations/:id/partner-key',
  LINK_PREVIEW: '/chat/link-preview',

  // Block / Report
  BLOCK_USER: '/users/:id/block',
  REPORT_USER: '/users/:id/report',
  BLOCKED_LIST: '/users/blocked',

  // Message actions
  MESSAGE_REPORT: '/chat/messages/:id/report',
  MESSAGE_UNSEND: '/chat/messages/:id/unsend',
  MESSAGE_DELETE_FOR_ME: '/chat/messages/:id/delete-for-me',
  MESSAGE_EDIT: '/chat/messages/:id',

  // Notifications
  NOTIFICATIONS: '/notifications',
  NOTIFICATIONS_READ_ALL: '/notifications/read-all',
  NOTIFICATION_READ: '/notifications/:id/read',

  // Device tokens
  DEVICE_TOKEN: '/devices/token',

  // Conversation delete
  CONV_DELETE: '/chat/conversations/:id',

  // Vibes (received)
  VIBES_RECEIVED: '/vibes/received',

  // Wallet
  WALLET: '/wallet',

  // Misc
  FEEDBACK: '/feedback',
  SUPPORT: '/support',

  // Payments
  PAYMENT_PUBLIC_KEY: '/payments/public-key',
  PAYMENT_CREATE_ORDER: '/payments/create-order',
  PAYMENT_VERIFY: '/payments/verify',
  PAYMENT_WALLET_PAY: '/payments/wallet-pay',
  PAYMENT_SAVED_UPI: '/payments/saved-upi-id',
  PAYMENT_CREATE_QR: '/payments/create-qr',
  PAYMENT_QR_STATUS: '/payments/qr-status/:id',

  // Event report
  EVENT_REPORT: '/events/:id/report',

  // Account management
  DELETE_ACCOUNT: '/users/me',
  SET_PUBLIC_KEY: '/users/me/public-key',
} as const

export const WS_BASE_URL: string =
  API_BASE_URL.replace('https://', 'wss://').replace('http://', 'ws://')

export const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
} as const

export const createAuthHeader = (token: string) => ({
  Authorization: `Bearer ${token}`,
})
