export const CacheKeys = {
  homeJoinedEvents: 'home:joined-events',
  /** "You're Hosting" */
  homeHostedEvents: 'home:hosted-events',

  chatConversations: 'chat:conversations',
  chatMessages: (conversationId: string) => `chat:messages:${conversationId}`,

  /** No userId → the signed-in user's own profile. */
  profile: (userId?: string) => (userId ? `profile:${userId}` : 'profile:me'),

  /** TTL'd to the event's start time — see callers. */
  ticket: (eventId: string) => `ticket:v2:${eventId}`,
  eventCover: (eventId: string) => `event-cover:${eventId}`,
} as const
