// Matches a message whose entire (trimmed) content is a single link — with or
// without an explicit http(s):// scheme, so "uilora.com" links just like
// "https://uilora.com" does (matches Instagram/WhatsApp's own behavior).
// Deliberately conservative: only when that's literally the whole message,
// not a sentence with a URL somewhere inside it.
const URL_PATTERN =
  /^(?:https?:\/\/)?(?:www\.)?[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)+(?::\d+)?(?:\/[^\s]*)?$/i

export function isUrlOnly(text: string): boolean {
  return URL_PATTERN.test(text.trim())
}

// Adds the https:// scheme when the user typed a bare domain — needed both to
// open the in-app browser and to fetch OG metadata for the preview card.
export function normalizeUrl(text: string): string {
  const trimmed = text.trim()
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
}
