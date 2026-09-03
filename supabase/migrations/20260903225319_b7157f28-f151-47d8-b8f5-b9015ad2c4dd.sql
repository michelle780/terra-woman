ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS checkin_frequency text,
  ADD COLUMN IF NOT EXISTS reminder_time time,
  ADD COLUMN IF NOT EXISTS preferred_channel text,
  ADD COLUMN IF NOT EXISTS contact_phone text,
  ADD COLUMN IF NOT EXISTS focus_areas text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS onboarding_notes text,
  ADD COLUMN IF NOT EXISTS onboarded_at timestamptz;