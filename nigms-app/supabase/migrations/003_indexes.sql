-- ============================================================
-- 003_indexes.sql
-- Performance indexes for all tables
-- ============================================================

-- ─── users ───────────────────────────────────────────────────────────────────

CREATE INDEX users_role_idx  ON public.users(role);
CREATE INDEX users_email_idx ON public.users(email);

-- ─── properties ──────────────────────────────────────────────────────────────

CREATE INDEX properties_user_idx ON public.properties(user_id);

-- ─── subscriptions ───────────────────────────────────────────────────────────

CREATE INDEX subscriptions_user_idx   ON public.subscriptions(user_id);
CREATE INDEX subscriptions_property_idx ON public.subscriptions(property_id);
CREATE INDEX subscriptions_stripe_idx ON public.subscriptions(stripe_subscription_id);
CREATE INDEX subscriptions_status_idx ON public.subscriptions(status);

-- ─── promo_codes ─────────────────────────────────────────────────────────────

CREATE INDEX promo_codes_code_idx   ON public.promo_codes(code);
CREATE INDEX promo_codes_active_idx ON public.promo_codes(is_active);

-- ─── promo_redemptions ───────────────────────────────────────────────────────

CREATE INDEX promo_redemptions_user_idx ON public.promo_redemptions(user_id);
CREATE INDEX promo_redemptions_code_idx ON public.promo_redemptions(promo_code_id);

-- ─── work_orders ─────────────────────────────────────────────────────────────

CREATE INDEX work_orders_client_idx    ON public.work_orders(client_id);
CREATE INDEX work_orders_property_idx  ON public.work_orders(property_id);
CREATE INDEX work_orders_status_idx    ON public.work_orders(status);
CREATE INDEX work_orders_wo_number_idx ON public.work_orders(wo_number);

-- ─── time_entries ────────────────────────────────────────────────────────────

CREATE INDEX time_entries_work_order_idx ON public.time_entries(work_order_id);

-- ─── quotes ──────────────────────────────────────────────────────────────────

CREATE INDEX quotes_work_order_idx ON public.quotes(work_order_id);
CREATE INDEX quotes_client_idx     ON public.quotes(client_id);

-- ─── invoices ────────────────────────────────────────────────────────────────

CREATE INDEX invoices_work_order_idx    ON public.invoices(work_order_id);
CREATE INDEX invoices_client_idx        ON public.invoices(client_id);
CREATE INDEX invoices_receipt_number_idx ON public.invoices(receipt_number);

-- ─── messages ────────────────────────────────────────────────────────────────

CREATE INDEX messages_sender_idx    ON public.messages(sender_id);
CREATE INDEX messages_recipient_idx ON public.messages(recipient_id);
CREATE INDEX messages_created_idx   ON public.messages(created_at DESC);

-- ─── appointments ────────────────────────────────────────────────────────────

CREATE INDEX appointments_client_idx       ON public.appointments(client_id);
CREATE INDEX appointments_work_order_idx   ON public.appointments(work_order_id);
CREATE INDEX appointments_scheduled_idx    ON public.appointments(scheduled_at);

-- ─── maintenance_reminders ───────────────────────────────────────────────────

CREATE INDEX maintenance_reminders_property_idx ON public.maintenance_reminders(property_id);
CREATE INDEX maintenance_reminders_due_date_idx ON public.maintenance_reminders(due_date);

-- ─── before_after_gallery ────────────────────────────────────────────────────

CREATE INDEX before_after_gallery_client_idx     ON public.before_after_gallery(client_id);
CREATE INDEX before_after_gallery_work_order_idx ON public.before_after_gallery(work_order_id);

-- ─── materials ───────────────────────────────────────────────────────────────

CREATE INDEX materials_work_order_idx ON public.materials(work_order_id);

-- ─── audit_log ───────────────────────────────────────────────────────────────

CREATE INDEX audit_log_entity_idx  ON public.audit_log(entity_type, entity_id);
CREATE INDEX audit_log_actor_idx   ON public.audit_log(actor_id);
CREATE INDEX audit_log_created_idx ON public.audit_log(created_at DESC);

-- ─── Legacy Table Indexes ────────────────────────────────────────────────────

CREATE INDEX messages_sender_legacy_idx    ON public.messages(sender_id);
CREATE INDEX messages_recipient_legacy_idx ON public.messages(recipient_id);

CREATE INDEX estimates_work_order_idx    ON public.estimates(work_order_id);
CREATE INDEX estimates_client_idx        ON public.estimates(client_id);
CREATE INDEX estimates_estimate_num_idx  ON public.estimates(estimate_number);

CREATE INDEX bills_work_order_idx    ON public.bills(work_order_id);
CREATE INDEX bills_client_idx        ON public.bills(client_id);
CREATE INDEX bills_receipt_num_idx   ON public.bills(receipt_number);

CREATE INDEX payments_work_order_idx    ON public.payments(work_order_id);
CREATE INDEX payments_client_idx        ON public.payments(client_id);
CREATE INDEX payments_receipt_num_idx   ON public.payments(receipt_number);

CREATE INDEX change_orders_work_order_idx ON public.change_orders(work_order_id);

CREATE INDEX client_addresses_client_idx ON public.client_addresses(client_id);

CREATE INDEX work_order_pictures_work_order_idx ON public.work_order_pictures(work_order_id);
CREATE INDEX work_order_pictures_client_idx     ON public.work_order_pictures(client_id);

CREATE INDEX assurance_subscriptions_user_idx   ON public.assurance_subscriptions(user_id);
CREATE INDEX assurance_subscriptions_stripe_idx ON public.assurance_subscriptions(stripe_subscription_id);
