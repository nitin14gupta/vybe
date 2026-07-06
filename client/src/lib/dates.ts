// Postgres returns timestamptz as "YYYY-MM-DD HH:MM:SS+05" (space separator, no
// minutes on the offset) — not valid ISO 8601, so plain `new Date(str)` parses
// it inconsistently (or as UTC) across JS engines. Normalize before parsing.
export function parseServerDate(iso: string | null | undefined): Date | null {
  if (!iso) return null
  const d = new Date(iso.replace(' ', 'T').replace(/([+-]\d{2})$/, '$1:00'))
  return isNaN(d.getTime()) ? null : d
}
