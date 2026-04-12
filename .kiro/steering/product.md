# Product

**NIGMS App** is a client management and billing platform for a service business (operated by "Charles"). It handles:

- Client onboarding with temporary credential issuance
- Work order tracking
- Payment processing with deposit (15%) and paid-in-full flows
- Automated email receipts and notifications

There are two user roles:
- **Admin (Charles)**: manages clients, work orders, and payments
- **Client**: views their own account, work orders, and payment status

Data isolation between Charles's admin data and client data is enforced at the database level via Row Level Security (RLS).
