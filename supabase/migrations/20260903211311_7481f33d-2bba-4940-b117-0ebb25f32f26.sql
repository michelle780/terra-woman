ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS zodiac_sign text;

CREATE TABLE public.horoscopes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sign text NOT NULL,
  horoscope_date date NOT NULL,
  text text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (sign, horoscope_date)
);
GRANT SELECT ON public.horoscopes TO authenticated;
GRANT ALL ON public.horoscopes TO service_role;
ALTER TABLE public.horoscopes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Signed-in users can read horoscopes" ON public.horoscopes FOR SELECT TO authenticated USING (true);