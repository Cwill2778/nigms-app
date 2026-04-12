// Core type aliases
export type UserRole = 'admin' | 'client';
export type WorkOrderStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';
export type PaymentStatus = 'pending' | 'paid' | 'failed';
export type PaymentMethod = 'stripe' | 'manual';

// Database entity interfaces
export interface UserProfile {
  id: string;
  username: string;
  role: UserRole;
  is_active: boolean;
  requires_password_reset: boolean;
  created_at: string;
}

export interface WorkOrder {
  id: string;
  client_id: string;
  title: string;
  description: string | null;
  status: WorkOrderStatus;
  quoted_amount: number | null;
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
  created_at: string;
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
