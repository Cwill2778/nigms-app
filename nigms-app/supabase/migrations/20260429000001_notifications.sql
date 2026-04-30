-- Migration: notifications table
-- Creates the in-app notifications table used by the notification system.
-- Requirements: 11.1, 11.2, 11.3, 11.4

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS notifications_user_idx ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS notifications_user_unread_idx ON public.notifications(user_id, read_at) WHERE read_at IS NULL;
CREATE INDEX IF NOT EXISTS notifications_created_idx ON public.notifications(created_at DESC);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Admin: full access
CREATE POLICY "admin_all_notifications" ON public.notifications
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin')
  );

-- Client: access own notifications only
CREATE POLICY "client_own_notifications" ON public.notifications
  FOR ALL USING (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
        AND u.requires_password_reset = false
    )
  );
