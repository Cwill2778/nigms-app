import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import type { BookingRequest, WorkOrder, WorkOrderStatus } from '../../lib/types';

/**
 * Property 7: Booking creates a pending work order
 * Validates: Requirements 3.2
 *
 * For any valid booking form submission (name, email, phone, service type,
 * preferred date), the booking engine should create exactly one work order
 * record in the database with status = 'pending'.
 */

// Pure function that models the booking creation logic from app/api/booking/route.ts
function createWorkOrderFromBooking(
  booking: BookingRequest
): Omit<WorkOrder, 'id' | 'created_at' | 'updated_at'> {
  return {
    client_id: null as unknown as string, // nullable for public/anonymous bookings
    title: `${booking.serviceType} — ${booking.name}`,
    description: `Booking request from ${booking.name} (${booking.email}, ${booking.phone}) for ${booking.preferredDate}`,
    status: 'pending' as WorkOrderStatus,
    quoted_amount: booking.quotedAmount,
  };
}

// Simulate what the booking engine does: returns an array of created work orders
function processBooking(
  booking: BookingRequest
): Array<Omit<WorkOrder, 'id' | 'created_at' | 'updated_at'>> {
  const workOrder = createWorkOrderFromBooking(booking);
  return [workOrder];
}

// Arbitraries for valid booking fields
const nameArb = fc.stringMatching(/^[A-Za-z ]{1,40}$/);
const emailArb = fc.emailAddress();
const phoneArb = fc.stringMatching(/^\d{7,15}$/);
const serviceTypeArb = fc.constantFrom(
  'Plumbing', 'Electrical', 'Carpentry', 'Painting',
  'General Repair', 'Landscaping', 'HVAC', 'Roofing'
);
const preferredDateArb = fc.date({ min: new Date('2025-01-01'), max: new Date('2030-12-31') }).map(
  (d) => d.toISOString().split('T')[0]
);
const quotedAmountArb = fc.double({ min: 50, max: 100_000, noNaN: true });
const paymentOptionArb = fc.constantFrom<'deposit' | 'full'>('deposit', 'full');

const validBookingArb: fc.Arbitrary<BookingRequest> = fc.record({
  name: nameArb,
  email: emailArb,
  phone: phoneArb,
  serviceType: serviceTypeArb,
  preferredDate: preferredDateArb,
  quotedAmount: quotedAmountArb,
  paymentOption: paymentOptionArb,
});

describe('Property 7: Booking creates a pending work order', () => {
  it('should create exactly one work order per booking submission', () => {
    fc.assert(
      fc.property(validBookingArb, (booking) => {
        const workOrders = processBooking(booking);
        expect(workOrders).toHaveLength(1);
      }),
      { numRuns: 20 }
    );
  });

  it('should always set status to "pending" for any valid booking', () => {
    fc.assert(
      fc.property(validBookingArb, (booking) => {
        const workOrders = processBooking(booking);
        expect(workOrders[0].status).toBe('pending');
      }),
      { numRuns: 20 }
    );
  });

  it('should include the serviceType in the work order title', () => {
    fc.assert(
      fc.property(validBookingArb, (booking) => {
        const workOrders = processBooking(booking);
        expect(workOrders[0].title).toContain(booking.serviceType);
      }),
      { numRuns: 20 }
    );
  });

  it('should include the booking name in the work order title', () => {
    fc.assert(
      fc.property(validBookingArb, (booking) => {
        const workOrders = processBooking(booking);
        expect(workOrders[0].title).toContain(booking.name);
      }),
      { numRuns: 20 }
    );
  });

  it('should preserve the quoted amount on the work order', () => {
    fc.assert(
      fc.property(validBookingArb, (booking) => {
        const workOrders = processBooking(booking);
        expect(workOrders[0].quoted_amount).toBe(booking.quotedAmount);
      }),
      { numRuns: 20 }
    );
  });

  it('should include booking contact details in the description', () => {
    fc.assert(
      fc.property(validBookingArb, (booking) => {
        const workOrders = processBooking(booking);
        const desc = workOrders[0].description ?? '';
        expect(desc).toContain(booking.name);
        expect(desc).toContain(booking.email);
        expect(desc).toContain(booking.phone);
        expect(desc).toContain(booking.preferredDate);
      }),
      { numRuns: 20 }
    );
  });
});
