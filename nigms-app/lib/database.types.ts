/**
 * Supabase database type definitions.
 *
 * This file provides the `Database` generic type used to type the Supabase
 * client. It is structured to match the Supabase-generated types format so
 * it can be replaced with the output of `supabase gen types typescript` once
 * the project is linked to a Supabase project.
 *
 * Table definitions mirror the schema in supabase/migrations/001_initial_schema.sql.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = 'admin' | 'client' | 'vip_client';
export type SubscriptionTier = 'essential' | 'elevated' | 'elite' | 'vip';
export type WorkOrderStatus = 'pending' | 'in_progress' | 'accepted' | 'completed' | 'cancelled';
export type PromoCodeType = 'vip_bypass' | 'discount';

export interface Database {
  __InternalSupabase: {
    PostgrestVersion: '12';
  };
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          username: string;
          role: UserRole;
          full_name: string | null;
          company_name: string | null;
          email: string | null;
          phone: string | null;
          is_active: boolean;
          requires_password_reset: boolean;
          created_at: string;
        };
        Insert: {
          id: string;
          username: string;
          role?: UserRole;
          full_name?: string | null;
          company_name?: string | null;
          email?: string | null;
          phone?: string | null;
          is_active?: boolean;
          requires_password_reset?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          username?: string;
          role?: UserRole;
          full_name?: string | null;
          company_name?: string | null;
          email?: string | null;
          phone?: string | null;
          is_active?: boolean;
          requires_password_reset?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      properties: {
        Row: {
          id: string;
          user_id: string;
          address: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          address: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          address?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      subscriptions: {
        Row: {
          id: string;
          user_id: string;
          property_id: string;
          tier: SubscriptionTier;
          stripe_subscription_id: string | null;
          stripe_customer_id: string | null;
          status: 'active' | 'cancelled' | 'past_due' | 'trialing';
          monthly_allocation_minutes: number;
          minutes_used: number;
          current_period_start: string | null;
          current_period_end: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          property_id: string;
          tier: SubscriptionTier;
          stripe_subscription_id?: string | null;
          stripe_customer_id?: string | null;
          status?: 'active' | 'cancelled' | 'past_due' | 'trialing';
          monthly_allocation_minutes: number;
          minutes_used?: number;
          current_period_start?: string | null;
          current_period_end?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          property_id?: string;
          tier?: SubscriptionTier;
          stripe_subscription_id?: string | null;
          stripe_customer_id?: string | null;
          status?: 'active' | 'cancelled' | 'past_due' | 'trialing';
          monthly_allocation_minutes?: number;
          minutes_used?: number;
          current_period_start?: string | null;
          current_period_end?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      promo_codes: {
        Row: {
          id: string;
          code: string;
          code_type: PromoCodeType;
          discount_percentage: number | null;
          is_active: boolean;
          max_redemptions: number | null;
          times_redeemed: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          code_type: PromoCodeType;
          discount_percentage?: number | null;
          is_active?: boolean;
          max_redemptions?: number | null;
          times_redeemed?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          code?: string;
          code_type?: PromoCodeType;
          discount_percentage?: number | null;
          is_active?: boolean;
          max_redemptions?: number | null;
          times_redeemed?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      promo_redemptions: {
        Row: {
          id: string;
          promo_code_id: string;
          user_id: string;
          redeemed_at: string;
        };
        Insert: {
          id?: string;
          promo_code_id: string;
          user_id: string;
          redeemed_at?: string;
        };
        Update: {
          id?: string;
          promo_code_id?: string;
          user_id?: string;
          redeemed_at?: string;
        };
        Relationships: [];
      };
      work_orders: {
        Row: {
          id: string;
          client_id: string;
          property_id: string | null;
          wo_number: string | null;
          title: string;
          description: string | null;
          status: WorkOrderStatus;
          urgency: 'low' | 'medium' | 'high' | 'emergency' | null;
          category: string | null;
          property_address: string | null;
          quoted_amount: number | null;
          inspection_notes: string | null;
          accepted_at: string | null;
          completed_at: string | null;
          total_billable_minutes: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          property_id?: string | null;
          wo_number?: string | null;
          title: string;
          description?: string | null;
          status?: WorkOrderStatus;
          urgency?: 'low' | 'medium' | 'high' | 'emergency' | null;
          category?: string | null;
          property_address?: string | null;
          quoted_amount?: number | null;
          inspection_notes?: string | null;
          accepted_at?: string | null;
          completed_at?: string | null;
          total_billable_minutes?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          client_id?: string;
          property_id?: string | null;
          wo_number?: string | null;
          title?: string;
          description?: string | null;
          status?: WorkOrderStatus;
          urgency?: 'low' | 'medium' | 'high' | 'emergency' | null;
          category?: string | null;
          property_address?: string | null;
          quoted_amount?: number | null;
          inspection_notes?: string | null;
          accepted_at?: string | null;
          completed_at?: string | null;
          total_billable_minutes?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      time_entries: {
        Row: {
          id: string;
          work_order_id: string;
          started_at: string;
          stopped_at: string | null;
          duration_minutes: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          work_order_id: string;
          started_at: string;
          stopped_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          work_order_id?: string;
          started_at?: string;
          stopped_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      quotes: {
        Row: {
          id: string;
          work_order_id: string;
          client_id: string;
          estimate_number: string;
          line_items: Json;
          total_amount: number;
          notes: string | null;
          approved_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          work_order_id: string;
          client_id: string;
          estimate_number: string;
          line_items?: Json;
          total_amount?: number;
          notes?: string | null;
          approved_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          work_order_id?: string;
          client_id?: string;
          estimate_number?: string;
          line_items?: Json;
          total_amount?: number;
          notes?: string | null;
          approved_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      invoices: {
        Row: {
          id: string;
          work_order_id: string;
          client_id: string;
          receipt_number: string;
          materials_cost: number;
          materials_paid_by: 'company' | 'client' | 'both';
          client_materials_cost: number;
          labor_cost: number;
          total_billed: number;
          amount_paid: number;
          balance_remaining: number;
          stripe_payment_intent_id: string | null;
          paid_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          work_order_id: string;
          client_id: string;
          receipt_number: string;
          materials_cost?: number;
          materials_paid_by: 'company' | 'client' | 'both';
          client_materials_cost?: number;
          labor_cost?: number;
          total_billed?: number;
          amount_paid?: number;
          stripe_payment_intent_id?: string | null;
          paid_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          work_order_id?: string;
          client_id?: string;
          receipt_number?: string;
          materials_cost?: number;
          materials_paid_by?: 'company' | 'client' | 'both';
          client_materials_cost?: number;
          labor_cost?: number;
          total_billed?: number;
          amount_paid?: number;
          stripe_payment_intent_id?: string | null;
          paid_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      messages: {
        Row: {
          id: string;
          sender_id: string;
          recipient_id: string;
          sender_role: 'admin' | 'client';
          body: string;
          read_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          sender_id: string;
          recipient_id: string;
          sender_role: 'admin' | 'client';
          body: string;
          read_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          sender_id?: string;
          recipient_id?: string;
          sender_role?: 'admin' | 'client';
          body?: string;
          read_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      appointments: {
        Row: {
          id: string;
          client_id: string;
          work_order_id: string | null;
          scheduled_at: string;
          duration_minutes: number;
          notes: string | null;
          status: 'scheduled' | 'completed' | 'cancelled';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          work_order_id?: string | null;
          scheduled_at: string;
          duration_minutes?: number;
          notes?: string | null;
          status?: 'scheduled' | 'completed' | 'cancelled';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          client_id?: string;
          work_order_id?: string | null;
          scheduled_at?: string;
          duration_minutes?: number;
          notes?: string | null;
          status?: 'scheduled' | 'completed' | 'cancelled';
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      maintenance_reminders: {
        Row: {
          id: string;
          property_id: string;
          title: string;
          description: string | null;
          due_date: string;
          recurrence: 'none' | 'monthly' | 'quarterly' | 'biannual' | 'annual';
          completed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          property_id: string;
          title: string;
          description?: string | null;
          due_date: string;
          recurrence?: 'none' | 'monthly' | 'quarterly' | 'biannual' | 'annual';
          completed_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          property_id?: string;
          title?: string;
          description?: string | null;
          due_date?: string;
          recurrence?: 'none' | 'monthly' | 'quarterly' | 'biannual' | 'annual';
          completed_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      before_after_gallery: {
        Row: {
          id: string;
          client_id: string;
          work_order_id: string | null;
          before_url: string;
          after_url: string;
          caption: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          work_order_id?: string | null;
          before_url: string;
          after_url: string;
          caption?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          client_id?: string;
          work_order_id?: string | null;
          before_url?: string;
          after_url?: string;
          caption?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      materials: {
        Row: {
          id: string;
          work_order_id: string;
          description: string;
          quantity: number;
          unit_cost: number;
          total_cost: number;
          supplier: string | null;
          receipt_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          work_order_id: string;
          description: string;
          quantity: number;
          unit_cost: number;
          supplier?: string | null;
          receipt_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          work_order_id?: string;
          description?: string;
          quantity?: number;
          unit_cost?: number;
          supplier?: string | null;
          receipt_url?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      audit_log: {
        Row: {
          id: string;
          entity_type: 'work_order' | 'subscription' | 'payment' | 'user' | 'property';
          entity_id: string;
          action: string;
          actor_id: string;
          actor_role: UserRole;
          changes: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          entity_type: 'work_order' | 'subscription' | 'payment' | 'user' | 'property';
          entity_id: string;
          action: string;
          actor_id: string;
          actor_role: UserRole;
          changes?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          entity_type?: 'work_order' | 'subscription' | 'payment' | 'user' | 'property';
          entity_id?: string;
          action?: string;
          actor_id?: string;
          actor_role?: UserRole;
          changes?: Json;
          created_at?: string;
        };
        Relationships: [];
      };
      onboarding_states: {
        Row: {
          user_id: string;
          onboarding_step: 'property_setup' | 'assurance_upsell';
          onboarding_complete: boolean;
          tour_complete: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          onboarding_step?: 'property_setup' | 'assurance_upsell';
          onboarding_complete?: boolean;
          tour_complete?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          onboarding_step?: 'property_setup' | 'assurance_upsell';
          onboarding_complete?: boolean;
          tour_complete?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      app_settings: {
        Row: {
          key: string;
          value: Json;
          updated_at: string;
        };
        Insert: {
          key: string;
          value: Json;
          updated_at?: string;
        };
        Update: {
          key?: string;
          value?: Json;
          updated_at?: string;
        };
        Relationships: [];
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: string;
          title: string;
          body: string;
          entity_type: string | null;
          entity_id: string | null;
          read_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: string;
          title: string;
          body: string;
          entity_type?: string | null;
          entity_id?: string | null;
          read_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: string;
          title?: string;
          body?: string;
          entity_type?: string | null;
          entity_id?: string | null;
          read_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      payments: {
        Row: {
          id: string;
          work_order_id: string;
          client_id: string;
          amount: number;
          method: 'stripe' | 'manual';
          status: 'pending' | 'paid' | 'failed';
          stripe_payment_intent_id: string | null;
          receipt_number: string | null;
          notes: string | null;
          payment_date: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          work_order_id: string;
          client_id: string;
          amount: number;
          method: 'stripe' | 'manual';
          status?: 'pending' | 'paid' | 'failed';
          stripe_payment_intent_id?: string | null;
          receipt_number?: string | null;
          notes?: string | null;
          payment_date?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          work_order_id?: string;
          client_id?: string;
          amount?: number;
          method?: 'stripe' | 'manual';
          status?: 'pending' | 'paid' | 'failed';
          stripe_payment_intent_id?: string | null;
          receipt_number?: string | null;
          notes?: string | null;
          payment_date?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      /** Legacy alias for quotes table */
      estimates: {
        Row: {
          id: string;
          work_order_id: string;
          client_id: string;
          estimate_number: string;
          line_items: Json;
          total_amount: number;
          notes: string | null;
          approved_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          work_order_id: string;
          client_id: string;
          estimate_number: string;
          line_items?: Json;
          total_amount?: number;
          notes?: string | null;
          approved_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          work_order_id?: string;
          client_id?: string;
          estimate_number?: string;
          line_items?: Json;
          total_amount?: number;
          notes?: string | null;
          approved_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      /** Legacy alias for invoices table */
      bills: {
        Row: {
          id: string;
          work_order_id: string;
          client_id: string;
          receipt_number: string;
          materials_cost: number;
          materials_paid_by: 'company' | 'client' | 'both';
          client_materials_cost: number;
          labor_cost: number;
          total_billed: number;
          amount_paid: number;
          balance_remaining: number;
          stripe_payment_intent_id: string | null;
          paid_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          work_order_id: string;
          client_id: string;
          receipt_number: string;
          materials_cost?: number;
          materials_paid_by: 'company' | 'client' | 'both';
          client_materials_cost?: number;
          labor_cost?: number;
          total_billed?: number;
          amount_paid?: number;
          balance_remaining?: number;
          stripe_payment_intent_id?: string | null;
          paid_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          work_order_id?: string;
          client_id?: string;
          receipt_number?: string;
          materials_cost?: number;
          materials_paid_by?: 'company' | 'client' | 'both';
          client_materials_cost?: number;
          labor_cost?: number;
          total_billed?: number;
          amount_paid?: number;
          balance_remaining?: number;
          stripe_payment_intent_id?: string | null;
          paid_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      change_orders: {
        Row: {
          id: string;
          work_order_id: string;
          description: string;
          additional_cost: number;
          status: 'pending' | 'accepted' | 'rejected';
          created_at: string;
        };
        Insert: {
          id?: string;
          work_order_id: string;
          description: string;
          additional_cost?: number;
          status?: 'pending' | 'accepted' | 'rejected';
          created_at?: string;
        };
        Update: {
          id?: string;
          work_order_id?: string;
          description?: string;
          additional_cost?: number;
          status?: 'pending' | 'accepted' | 'rejected';
          created_at?: string;
        };
        Relationships: [];
      };
      client_addresses: {
        Row: {
          id: string;
          client_id: string;
          label: string | null;
          street: string;
          city: string;
          state: string;
          zip: string;
          is_primary: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          label?: string | null;
          street: string;
          city: string;
          state: string;
          zip: string;
          is_primary?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          client_id?: string;
          label?: string | null;
          street?: string;
          city?: string;
          state?: string;
          zip?: string;
          is_primary?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      work_order_pictures: {
        Row: {
          id: string;
          work_order_id: string;
          client_id: string;
          storage_path: string;
          caption: string | null;
          uploaded_at: string;
        };
        Insert: {
          id?: string;
          work_order_id: string;
          client_id: string;
          storage_path: string;
          caption?: string | null;
          uploaded_at?: string;
        };
        Update: {
          id?: string;
          work_order_id?: string;
          client_id?: string;
          storage_path?: string;
          caption?: string | null;
          uploaded_at?: string;
        };
        Relationships: [];
      };
      /** Legacy alias for subscriptions table */
      assurance_subscriptions: {
        Row: {
          id: string;
          user_id: string;
          stripe_subscription_id: string | null;
          stripe_customer_id: string | null;
          status: 'active' | 'cancelled' | 'past_due' | 'trialing';
          current_period_start: string | null;
          current_period_end: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          stripe_subscription_id?: string | null;
          stripe_customer_id?: string | null;
          status?: 'active' | 'cancelled' | 'past_due' | 'trialing';
          current_period_start?: string | null;
          current_period_end?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          stripe_subscription_id?: string | null;
          stripe_customer_id?: string | null;
          status?: 'active' | 'cancelled' | 'past_due' | 'trialing';
          current_period_start?: string | null;
          current_period_end?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      newsletter_subscribers: {
        Row: {
          id: string;
          email: string;
          subscribed_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          subscribed_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          subscribed_at?: string;
        };
        Relationships: [];
      };
      /** Public-facing gallery — items explicitly published by admin via CMS Integration */
      gallery: {
        Row: {
          id: string;
          title: string;
          category: string;
          before_url: string;
          after_url: string;
          sort_order: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          category?: string;
          before_url: string;
          after_url: string;
          sort_order?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          category?: string;
          before_url?: string;
          after_url?: string;
          sort_order?: number | null;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<never, never>;
    Functions: Record<never, never>;
    Enums: {
      user_role: UserRole;
      subscription_tier: SubscriptionTier;
      work_order_status: WorkOrderStatus;
      promo_code_type: PromoCodeType;
    };
  };
}
