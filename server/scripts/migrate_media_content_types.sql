-- Migration: add voice/video/gif content types + reactions column
-- Run once against your PostgreSQL database:
--   psql $DATABASE_URL -f scripts/migrate_media_content_types.sql

BEGIN;

-- 1. Drop the old constraint that only allows text/event/profile/image
ALTER TABLE public.messages
  DROP CONSTRAINT IF EXISTS messages_content_type_check;

-- 2. Add the updated constraint that also covers voice, video, gif
ALTER TABLE public.messages
  ADD CONSTRAINT messages_content_type_check
    CHECK (content_type = ANY (ARRAY[
      'text'::text,
      'event'::text,
      'profile'::text,
      'image'::text,
      'voice'::text,
      'video'::text,
      'gif'::text
    ]));

-- 3. Add reactions column if it doesn't already exist
ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS reactions jsonb;

COMMIT;
