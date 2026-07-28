import { Image } from 'expo-image'

const R2_BASE = 'https://pub-f5cb81cf85a5471d9abf932f74d1ae0e.r2.dev/housepartyshowcase'

export const TEMPLATE_IMAGE_URIS = [
  `${R2_BASE}/beack.webp`,
  `${R2_BASE}/christmas.webp`,
  `${R2_BASE}/halloween.webp`,
  `${R2_BASE}/houseparty.webp`,
  `${R2_BASE}/nightout.webp`,
  `${R2_BASE}/retro.webp`,
  `${R2_BASE}/wooden.webp`,
]

export function prefetchTemplateImages() {
  Image.prefetch(TEMPLATE_IMAGE_URIS, 'disk').catch(() => {})
}
