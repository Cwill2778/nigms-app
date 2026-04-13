# Tech Stack

## Framework & Runtime
- **Next.js** (App Router) — React framework with server components
- **TypeScript** — primary language
- **Tailwind CSS** — utility-first styling
- **next-themes** — dark mode support

## Backend & Database
- **Supabase** (`@supabase/supabase-js`) — PostgreSQL database, auth, and RLS policies
- Tables: `users`, `work_orders`, `payments`
- Row Level Security enforces data isolation between admin and client roles

## Payments & Email
- **Stripe** — payment processing; webhooks at `/api/webhooks/stripe`
- **Resend** — transactional email delivery

## UI
- **lucide-react** — icon library
- **ESLint** — linting

## Common Commands

```bash
# Install dependencies (first-time setup)
npx create-next-app@latest nigms-app --tailwind --eslint --app
cd nigms-app
npm install @supabase/supabase-js stripe resend next-themes lucide-react

# Dev server
npm run dev

# Build
npm run build

# Lint
npm run lint

# Push DB schema and RLS policies to Supabase
npx supabase db push

# Forward Stripe webhooks to local dev
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Generate temporary client credentials
node scripts/generate_temp_auth.js
```
