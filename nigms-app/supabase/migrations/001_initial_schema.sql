-- ============================================================
-- 001_initial_schema.sql
-- Full initial schema for the Nailed It Brand Platform
-- ============================================================

-- ─── Users ───────────────────────────────────────────────────────────────────
-- Extends auth.users with application-specific profile data.

CREATE TABLE public.users (
  id                      UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username                TEXT UNIQUE NOT NULL,
  role                    TEXT NOT NULL DEFAULT 'client'
                            CHECK (role IN ('admin', 'client', 'vip_client')),
  full_name               TEXT,
  company_name            TEXT,
  email                   TEXT,
  phone                   TEXT,
  is_active               BOOLEAN NOT NULL DEFAULT true,
  requires_password_reset BOOLEAN NOT NULL DEFAULT true,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── Properties ──────────────────────────────────────────────────────────────
-- Properties registered by clients.

CREATE TABLE public.properties (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  address    TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── Subscriptions ───────────────────────────────────────────────────────────
-- Subscription records for the Nailed It Assurance Program.

CREATE TABLE public.subscriptions (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                  UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  property_id              UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  tier                     TEXT NOT NULL
                             CHECK (tier IN ('essential', 'elevated', 'elite', 'vip')),
  stripe_subscription_id   TEXT UNIQUE,
  stripe_customer_id       TEXT,
  status                   TEXT NOT NULL DEFAULT 'active'
                             CHECK (status IN ('active', 'cancelled', 'past_due', 'trialing')),
  monthly_allocation_minutes INTEGER NOT NULL,
  minutes_used             INTEGER NOT NULL DEFAULT 0,
  current_period_start     TIMESTAMPTZ,
  current_period_end       TIMESTAMPTZ,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── Promo Codes ─────────────────────────────────────────────────────────────
-- Promo codes for VIP bypass or percentage discounts.

CREATE TABLE public.promo_codes (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code               TEXT UNIQUE NOT NULL,
  code_type          TEXT NOT NULL CHECK (code_type IN ('vip_bypass', 'discount')),
  discount_percentage INTEGER
                       CHECK (discount_percentage >= 0 AND discount_percentage <= 100),
  is_active          BOOLEAN NOT NULL DEFAULT true,
  max_redemptions    INTEGER,
  times_redeemed     INTEGER NOT NULL DEFAULT 0,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── Promo Redemptions ───────────────────────────────────────────────────────
-- Tracks which users have redeemed which promo codes.

CREATE TABLE public.promo_redemptions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promo_code_id UUID NOT NULL REFERENCES public.promo_codes(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  redeemed_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(promo_code_id, user_id)
);

-- ─── Work Orders ─────────────────────────────────────────────────────────────
-- Service requests submitted by clients.

CREATE TABLE public.work_orders (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id             UUID REFERENCES public.users(id) ON DELETE CASCADE,
  property_id           UUID REFERENCES public.properties(id) ON DELETE SET NULL,
  wo_number             TEXT UNIQUE,
  title                 TEXT NOT NULL,
  description           TEXT,
  status                TEXT NOT NULL DEFAULT 'pending'
                          CHECK (status IN ('pending', 'in_progress', 'accepted', 'completed', 'cancelled')),
  urgency               TEXT CHECK (urgency IN ('low', 'medium', 'high', 'emergency')),
  category              TEXT,
  property_address      TEXT,
  quoted_amount         NUMERIC(10,2),
  inspection_notes      TEXT,
  accepted_at           TIMESTAMPTZ,
  completed_at          TIMESTAMPTZ,
  total_billable_minutes INTEGER NOT NULL DEFAULT 0,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── Time Entries ────────────────────────────────────────────────────────────
-- Time tracking entries logged by admin against work orders.

CREATE TABLE public.time_entries (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id UUID NOT NULL REFERENCES public.work_orders(id) ON DELETE CASCADE,
  started_at    TIMESTAMPTZ NOT NULL,
  stopped_at    TIMESTAMPTZ,
  duration_minutes INTEGER GENERATED ALWAYS AS (
    CASE WHEN stopped_at IS NOT NULL
    THEN EXTRACT(EPOCH FROM (stopped_at - started_at))::INTEGER / 60
    ELSE NULL END
  ) STORED,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── Quotes ──────────────────────────────────────────────────────────────────
-- Cost estimates for work orders requiring client approval.

CREATE TABLE public.quotes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id   UUID NOT NULL REFERENCES public.work_orders(id) ON DELETE CASCADE,
  client_id       UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  estimate_number TEXT UNIQUE NOT NULL,
  line_items      JSONB NOT NULL DEFAULT '[]',
  total_amount    NUMERIC(10,2) NOT NULL DEFAULT 0,
  notes           TEXT,
  approved_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── Invoices ────────────────────────────────────────────────────────────────
-- Billing documents generated after work completion.

CREATE TABLE public.invoices (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id            UUID NOT NULL REFERENCES public.work_orders(id) ON DELETE CASCADE,
  client_id                UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  receipt_number           TEXT UNIQUE NOT NULL,
  materials_cost           NUMERIC(10,2) NOT NULL DEFAULT 0,
  materials_paid_by        TEXT NOT NULL CHECK (materials_paid_by IN ('company', 'client', 'both')),
  client_materials_cost    NUMERIC(10,2) NOT NULL DEFAULT 0,
  labor_cost               NUMERIC(10,2) NOT NULL DEFAULT 0,
  total_billed             NUMERIC(10,2) NOT NULL DEFAULT 0,
  amount_paid              NUMERIC(10,2) NOT NULL DEFAULT 0,
  balance_remaining        NUMERIC(10,2) GENERATED ALWAYS AS (total_billed - amount_paid) STORED,
  stripe_payment_intent_id TEXT,
  paid_at                  TIMESTAMPTZ,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── Messages ────────────────────────────────────────────────────────────────
-- Real-time messaging between clients and admin.

CREATE TABLE public.messages (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id    UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  sender_role  TEXT NOT NULL CHECK (sender_role IN ('admin', 'client')),
  body         TEXT NOT NULL,
  read_at      TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── Appointments ────────────────────────────────────────────────────────────
-- Scheduled appointments for work orders.

CREATE TABLE public.appointments (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id        UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  work_order_id    UUID REFERENCES public.work_orders(id) ON DELETE SET NULL,
  scheduled_at     TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  notes            TEXT,
  status           TEXT NOT NULL DEFAULT 'scheduled'
                     CHECK (status IN ('scheduled', 'completed', 'cancelled')),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── Maintenance Reminders ───────────────────────────────────────────────────
-- Automated recurring maintenance prompts.

CREATE TABLE public.maintenance_reminders (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  description TEXT,
  due_date    DATE NOT NULL,
  recurrence  TEXT NOT NULL DEFAULT 'none'
                CHECK (recurrence IN ('none', 'monthly', 'quarterly', 'biannual', 'annual')),
  completed_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── Before/After Gallery ────────────────────────────────────────────────────
-- Private client gallery for project before/after photos.

CREATE TABLE public.before_after_gallery (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  work_order_id UUID REFERENCES public.work_orders(id) ON DELETE SET NULL,
  before_url    TEXT NOT NULL,
  after_url     TEXT NOT NULL,
  caption       TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── Materials ───────────────────────────────────────────────────────────────
-- Materials used per work order for cost tracking.

CREATE TABLE public.materials (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id UUID NOT NULL REFERENCES public.work_orders(id) ON DELETE CASCADE,
  description   TEXT NOT NULL,
  quantity      NUMERIC(10,2) NOT NULL,
  unit_cost     NUMERIC(10,2) NOT NULL,
  total_cost    NUMERIC(10,2) GENERATED ALWAYS AS (quantity * unit_cost) STORED,
  supplier      TEXT,
  receipt_url   TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── Audit Log ───────────────────────────────────────────────────────────────
-- Comprehensive audit trail for all entity changes.

CREATE TABLE public.audit_log (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL
                CHECK (entity_type IN ('work_order', 'subscription', 'payment', 'user', 'property')),
  entity_id   UUID NOT NULL,
  action      TEXT NOT NULL,
  actor_id    UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  actor_role  TEXT NOT NULL CHECK (actor_role IN ('admin', 'client', 'vip_client')),
  changes     JSONB NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── Onboarding States ───────────────────────────────────────────────────────
-- Tracks client onboarding progress.

CREATE TABLE public.onboarding_states (
  user_id             UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  onboarding_step     TEXT NOT NULL DEFAULT 'property_setup'
                        CHECK (onboarding_step IN ('property_setup', 'assurance_upsell')),
  onboarding_complete BOOLEAN NOT NULL DEFAULT false,
  tour_complete       BOOLEAN NOT NULL DEFAULT false,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── App Settings ────────────────────────────────────────────────────────────
-- Global application settings (admin-configurable).

CREATE TABLE public.app_settings (
  key        TEXT PRIMARY KEY,
  value      JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── Legacy Tables (kept for backward compatibility) ─────────────────────────

-- payments (legacy — new code should use invoices)
CREATE TABLE public.payments (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id            UUID NOT NULL REFERENCES public.work_orders(id),
  client_id                UUID NOT NULL REFERENCES public.users(id),
  amount                   NUMERIC(10,2) NOT NULL,
  method                   TEXT NOT NULL CHECK (method IN ('stripe', 'manual')),
  status                   TEXT NOT NULL DEFAULT 'pending'
                             CHECK (status IN ('pending', 'paid', 'failed')),
  stripe_payment_intent_id TEXT,
  receipt_number           TEXT UNIQUE,
  notes                    TEXT,
  payment_date             DATE,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- newsletter_subscribers
CREATE TABLE public.newsletter_subscribers (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email      TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- estimates (legacy — new code should use quotes)
CREATE TABLE public.estimates (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id   UUID NOT NULL REFERENCES public.work_orders(id),
  client_id       UUID REFERENCES public.users(id),
  estimate_number TEXT NOT NULL UNIQUE,
  line_items      JSONB NOT NULL DEFAULT '[]',
  total_amount    NUMERIC(10,2) NOT NULL DEFAULT 0,
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- bills (legacy — new code should use invoices)
CREATE TABLE public.bills (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id         UUID NOT NULL REFERENCES public.work_orders(id),
  client_id             UUID NOT NULL REFERENCES public.users(id),
  receipt_number        TEXT NOT NULL UNIQUE,
  materials_cost        NUMERIC(10,2) NOT NULL DEFAULT 0,
  materials_paid_by     TEXT NOT NULL CHECK (materials_paid_by IN ('company', 'client', 'both')),
  client_materials_cost NUMERIC(10,2) NOT NULL DEFAULT 0,
  labor_cost            NUMERIC(10,2) NOT NULL DEFAULT 0,
  total_billed          NUMERIC(10,2) NOT NULL DEFAULT 0,
  amount_paid           NUMERIC(10,2) NOT NULL DEFAULT 0,
  balance_remaining     NUMERIC(10,2) GENERATED ALWAYS AS (total_billed - amount_paid) STORED,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- change_orders
CREATE TABLE public.change_orders (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id   UUID NOT NULL REFERENCES public.work_orders(id),
  description     TEXT NOT NULL,
  additional_cost NUMERIC(10,2) NOT NULL DEFAULT 0,
  status          TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- client_addresses
CREATE TABLE public.client_addresses (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id  UUID NOT NULL REFERENCES public.users(id),
  label      TEXT,
  street     TEXT NOT NULL,
  city       TEXT NOT NULL,
  state      TEXT NOT NULL DEFAULT 'GA',
  zip        TEXT NOT NULL,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- work_order_pictures
CREATE TABLE public.work_order_pictures (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id UUID NOT NULL REFERENCES public.work_orders(id),
  client_id     UUID NOT NULL REFERENCES public.users(id),
  storage_path  TEXT NOT NULL,
  caption       TEXT,
  uploaded_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- gallery (public project showcase — distinct from before_after_gallery)
CREATE TABLE public.gallery (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title      TEXT NOT NULL,
  category   TEXT NOT NULL DEFAULT 'General',
  before_url TEXT NOT NULL,
  after_url  TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- assurance_subscriptions (legacy — new code should use subscriptions)
CREATE TABLE public.assurance_subscriptions (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT UNIQUE,
  stripe_customer_id     TEXT,
  status                 TEXT NOT NULL DEFAULT 'active'
                           CHECK (status IN ('active', 'cancelled', 'past_due', 'trialing')),
  current_period_start   TIMESTAMPTZ,
  current_period_end     TIMESTAMPTZ,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT now()
);
