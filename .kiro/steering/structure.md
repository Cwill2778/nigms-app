# Project Structure

```
nigms-app/
├── app/                        # Next.js App Router
│   ├── (admin)/                # Admin-only routes (Charles)
│   ├── (client)/               # Client-facing routes
│   ├── api/
│   │   └── webhooks/
│   │       └── stripe/         # Stripe webhook handler
│   ├── layout.tsx              # Root layout (theme provider, etc.)
│   └── page.tsx                # Entry point / landing
├── components/                 # Shared React components
├── lib/                        # Utility modules
│   ├── supabase.ts             # Supabase client initialization
│   ├── stripe.ts               # Stripe client initialization
│   └── resend.ts               # Resend client initialization
├── scripts/
│   └── generate_temp_auth.js   # Temp credential generation for new clients
├── public/                     # Static assets
├── .kiro/
│   ├── hooks/                  # Kiro automation hooks
│   └── steering/               # AI steering rules
├── tailwind.config.ts
├── next.config.ts
└── package.json
```

## Conventions

- Use the **App Router** — no `pages/` directory
- Route groups `(admin)` and `(client)` separate concerns without affecting URLs
- Server Components by default; add `"use client"` only when needed (interactivity, hooks)
- Supabase RLS policies are the source of truth for data access control — never rely solely on UI-level guards
- API routes live under `app/api/` as Route Handlers (`route.ts`)
- Keep third-party client initializations in `lib/` and import from there
