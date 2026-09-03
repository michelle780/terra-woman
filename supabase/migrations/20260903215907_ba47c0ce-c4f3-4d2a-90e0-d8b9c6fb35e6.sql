CREATE TABLE public.daily_checkins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  checkin_date DATE NOT NULL,
  happiness SMALLINT CHECK (happiness BETWEEN 1 AND 10),
  fulfillment SMALLINT CHECK (fulfillment BETWEEN 1 AND 10),
  calm SMALLINT CHECK (calm BETWEEN 1 AND 10),
  energy SMALLINT CHECK (energy BETWEEN 1 AND 10),
  focus SMALLINT CHECK (focus BETWEEN 1 AND 10),
  stress SMALLINT CHECK (stress BETWEEN 1 AND 10),
  anxiety SMALLINT CHECK (anxiety BETWEEN 1 AND 10),
  mood_swings SMALLINT CHECK (mood_swings BETWEEN 1 AND 10),
  bloating SMALLINT CHECK (bloating BETWEEN 1 AND 10),
  cramps SMALLINT CHECK (cramps BETWEEN 1 AND 10),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, checkin_date)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.daily_checkins TO authenticated;
GRANT ALL ON public.daily_checkins TO service_role;
ALTER TABLE public.daily_checkins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage their own check-ins" ON public.daily_checkins FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER update_daily_checkins_updated_at BEFORE UPDATE ON public.daily_checkins FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();