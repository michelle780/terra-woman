ALTER TABLE public.medications
  ADD COLUMN IF NOT EXISTS frequency text NOT NULL DEFAULT 'daily',
  ADD COLUMN IF NOT EXISTS days_of_week smallint[] NOT NULL DEFAULT '{}'::smallint[];

ALTER TABLE public.medications
  ADD CONSTRAINT medications_frequency_check
  CHECK (frequency IN ('daily','weekdays','specific_days','as_needed'));