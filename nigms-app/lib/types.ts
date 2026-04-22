// Core type aliases
export type UserRole = 'admin' | 'client';
export type WorkOrderStatus = 'pending' | 'in_progress' | 'accepted' | 'completed' | 'cancelled';
export type PaymentStatus = 'pending' | 'paid' | 'failed';
export type PaymentMethod = 'stripe' | 'manual';
export type UrgencyLevel = 'low' | 'medium' | 'high' | 'emergency';
export type MaterialsPaidBy = 'company' | 'client' | 'both';
export type ChangeOrderStatus = 'pending' | 'accepted' | 'rejected';
export type SenderRole = 'admin' | 'client';

// Database entity interfaces
export interface UserProfile {
  id: string;
  username: string;
  role: UserRole;
  is_active: boolean;
  requires_password_reset: boolean;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  email: string | null;
  created_at: string;
}

export interface WorkOrder {
  id: string;
  client_id: string;
  title: string;
  description: string | null;
  status: WorkOrderStatus;
  quoted_amount: number | null;
  wo_number: string | null;
  urgency: UrgencyLevel | null;
  category: string | null;
  property_address: string | null;
  inspection_notes: string | null;
  accepted_at: string | null;
  completed_at: string | null;
  total_billable_minutes: number;
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

export interface Message {
  id: string;
  sender_id: string;
  recipient_id: string;
  sender_role: SenderRole;
  body: string;
  read_at: string | null;
  created_at: string;
}

export interface EstimateLineItem {
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

export interface Estimate {
  id: string;
  work_order_id: string;
  client_id: string;
  estimate_number: string;
  line_items: EstimateLineItem[];
  total_amount: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Bill {
  id: string;
  work_order_id: string;
  client_id: string;
  receipt_number: string;
  materials_cost: number;
  materials_paid_by: MaterialsPaidBy;
  client_materials_cost: number;
  labor_cost: number;
  total_billed: number;
  amount_paid: number;
  balance_remaining: number;
  created_at: string;
}

export interface ChangeOrder {
  id: string;
  work_order_id: string;
  description: string;
  additional_cost: number;
  status: ChangeOrderStatus;
  created_at: string;
}

export interface TimeEntry {
  id: string;
  work_order_id: string;
  started_at: string;
  stopped_at: string | null;
  duration_minutes: number | null;
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

// API request/response interfaces
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
}

export interface CheckoutRequest {
  workOrderId: string;
  type: 'deposit' | 'full' | 'balance';
  amount: number;
}
