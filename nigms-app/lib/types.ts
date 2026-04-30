// ─── Union Types ─────────────────────────────────────────────────────────────

export type UserRole = 'admin' | 'client' | 'vip_client';
export type SubscriptionTier = 'essential' | 'elevated' | 'elite' | 'vip';
export type WorkOrderStatus = 'pending' | 'in_progress' | 'accepted' | 'completed' | 'cancelled';
export type PromoCodeType = 'vip_bypass' | 'discount';

// Legacy aliases kept for backward compatibility with existing code
export type PaymentStatus = 'pending' | 'paid' | 'failed';
export type PaymentMethod = 'stripe' | 'manual';
export type UrgencyLevel = 'low' | 'medium' | 'high' | 'emergency';
export type MaterialsPaidBy = 'company' | 'client' | 'both';
export type ChangeOrderStatus = 'pending' | 'accepted' | 'rejected';
export type SenderRole = 'admin' | 'client';
export type OnboardingStep = 'property_setup' | 'assurance_upsell';

// ─── Core Entity Interfaces ───────────────────────────────────────────────────

export interface UserProfile {
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
  /** @deprecated Use full_name instead */
  first_name?: string | null;
  /** @deprecated Use full_name instead */
  last_name?: string | null;
}

export interface Property {
  id: string;
  user_id: string;
  address: string;
  created_at: string;
}

export interface Subscription {
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
}

export interface PromoCode {
  id: string;
  code: string;
  code_type: PromoCodeType;
  discount_percentage: number | null;
  is_active: boolean;
  max_redemptions: number | null;
  times_redeemed: number;
  created_at: string;
}

export interface PromoRedemption {
  id: string;
  promo_code_id: string;
  user_id: string;
  redeemed_at: string;
}

export interface WorkOrder {
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
}

export interface TimeEntry {
  id: string;
  work_order_id: string;
  started_at: string;
  stopped_at: string | null;
  duration_minutes: number | null;
  created_at: string;
}

export interface QuoteLineItem {
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

export interface Quote {
  id: string;
  work_order_id: string;
  client_id: string;
  estimate_number: string;
  line_items: QuoteLineItem[];
  total_amount: number;
  notes: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Invoice {
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
}

export interface Message {
  id: string;
  sender_id: string;
  recipient_id: string;
  sender_role: 'admin' | 'client';
  body: string;
  read_at: string | null;
  created_at: string;
}

export interface Appointment {
  id: string;
  client_id: string;
  work_order_id: string | null;
  scheduled_at: string;
  duration_minutes: number;
  notes: string | null;
  status: 'scheduled' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
}

export interface MaintenanceReminder {
  id: string;
  property_id: string;
  title: string;
  description: string | null;
  due_date: string;
  recurrence: 'none' | 'monthly' | 'quarterly' | 'biannual' | 'annual';
  completed_at: string | null;
  created_at: string;
}

export interface BeforeAfterImage {
  id: string;
  client_id: string;
  work_order_id: string | null;
  before_url: string;
  after_url: string;
  caption: string | null;
  created_at: string;
}

export interface AuditLog {
  id: string;
  entity_type: 'work_order' | 'subscription' | 'payment' | 'user' | 'property';
  entity_id: string;
  action: string;
  actor_id: string;
  actor_role: UserRole;
  changes: Record<string, unknown>;
  created_at: string;
}

export interface OnboardingState {
  user_id: string;
  onboarding_step: 'property_setup' | 'assurance_upsell';
  onboarding_complete: boolean;
  tour_complete: boolean;
  created_at: string;
  updated_at: string;
}

// ─── Legacy / Extended Interfaces (backward compatibility) ────────────────────

/** @deprecated Use Quote instead */
export type EstimateLineItem = QuoteLineItem;

/** @deprecated Use Quote instead */
export type Estimate = Quote;

/** @deprecated Use Invoice instead */
export type Bill = Invoice;

export interface ChangeOrder {
  id: string;
  work_order_id: string;
  description: string;
  additional_cost: number;
  status: ChangeOrderStatus;
  created_at: string;
}

export interface ClientAddress {
  id: string;
  client_id: string;
  label: string | null;
  street: string;
  city: string;
  state: string;
  zip: string;
  is_primary: boolean;
  created_at: string;
}

export interface WorkOrderPicture {
  id: string;
  work_order_id: string;
  client_id: string;
  storage_path: string;
  caption: string | null;
  uploaded_at: string;
}

/** @deprecated Use Subscription instead */
export interface AssuranceSubscription {
  id: string;
  user_id: string;
  stripe_subscription_id: string | null;
  stripe_customer_id: string | null;
  status: 'active' | 'cancelled' | 'past_due' | 'trialing';
  current_period_start: string | null;
  current_period_end: string | null;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  work_order_id: string;
  client_id: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  stripe_payment_intent_id: string | null;
  receipt_number: string | null;
  notes: string | null;
  payment_date: string | null;
  created_at: string;
}

// ─── API Request / Response Interfaces ───────────────────────────────────────

export interface SignupRequest {
  name: string;
  company_name?: string;
  email: string;
  password: string;
}

export interface BookingRequest {
  name: string;
  email: string;
  phone: string;
  serviceType: string;
  preferredDate: string;
  promoCode?: string;
  paymentOption: 'deposit' | 'full';
  quotedAmount: number;
}

export interface PromoValidateRequest {
  code: string;
}

export interface PromoValidateResponse {
  valid: boolean;
  waivesDeposit: boolean;
  code_type?: PromoCodeType;
  discount_percentage?: number | null;
}

export interface CheckoutRequest {
  workOrderId: string;
  type: 'deposit' | 'full' | 'balance';
  amount: number;
}
