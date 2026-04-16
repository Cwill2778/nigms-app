-- Before/After gallery table
CREATE TABLE public.gallery (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT NOT NULL,
  category    TEXT NOT NULL DEFAULT 'General',
  before_url  TEXT NOT NULL,
  after_url   TEXT NOT NULL,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Only admins can insert/update/delete; anyone can read
ALTER TABLE public.gallery ENABLE ROW LEVEL SECURITY;

CREATE POLICY gallery_public_read ON public.gallery
  FOR SELECT USING (true);

CREATE POLICY gallery_admin_all ON public.gallery
  FOR ALL USING ((auth.jwt() ->> 'role') = 'admin');
