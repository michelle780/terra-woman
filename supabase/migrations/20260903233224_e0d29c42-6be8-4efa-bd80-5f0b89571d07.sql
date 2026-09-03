ALTER TABLE public.roots_content
  ADD COLUMN IF NOT EXISTS visual_template text,
  ADD COLUMN IF NOT EXISTS visual_asset_url text,
  ADD COLUMN IF NOT EXISTS visual_asset_type text,
  ADD COLUMN IF NOT EXISTS visual_asset_source text,
  ADD COLUMN IF NOT EXISTS visual_asset_credit text,
  ADD COLUMN IF NOT EXISTS visual_asset_rights_status text NOT NULL DEFAULT 'UNKNOWN';

ALTER TABLE public.roots_content
  ADD CONSTRAINT roots_content_visual_template_check
  CHECK (visual_template IS NULL OR visual_template IN ('herbarium','woman','artifact','this_day','in_her_words','living_tree'));

ALTER TABLE public.roots_content
  ADD CONSTRAINT roots_content_visual_asset_type_check
  CHECK (visual_asset_type IS NULL OR visual_asset_type IN ('portrait','artifact','botanical','manuscript','engraving','illustration','photograph'));

ALTER TABLE public.roots_content
  ADD CONSTRAINT roots_content_visual_asset_rights_check
  CHECK (visual_asset_rights_status IN ('UNKNOWN','PENDING','CLEARED','PUBLIC DOMAIN','RESTRICTED'));