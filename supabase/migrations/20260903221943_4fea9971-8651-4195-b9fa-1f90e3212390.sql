CREATE TABLE public.cycle_periods (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE,
  flow TEXT CHECK (flow IN ('spotting','light','medium','heavy')),
  symptoms TEXT[] NOT NULL DEFAULT '{}',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, start_date),
  CHECK (end_date IS NULL OR end_date >= start_date)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.cycle_periods TO authenticated;
GRANT ALL ON public.cycle_periods TO service_role;

ALTER TABLE public.cycle_periods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own cycle periods"
ON public.cycle_periods FOR ALL TO authenticated
USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_cycle_periods_updated_at
BEFORE UPDATE ON public.cycle_periods
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();