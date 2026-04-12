// @ts-check
'use strict';

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.local') });

const { createClient } = require('@supabase/supabase-js');

// ── Helpers ──────────────────────────────────────────────────────────────────

function randomAlphanumeric(length) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function generateUsername() {
  return `usr_${randomAlphanumeric(8)}`;
}

function generatePassword() {
  return randomAlphanumeric(12);
}

// ── CLI args ─────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
let email = null;

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--email' && args[i + 1]) {
    email = args[i + 1];
    i++;
  }
}

if (!email) {
  // Generate a placeholder email if none provided
  email = `client_${randomAlphanumeric(8)}@placeholder.nigms.com`;
  console.warn(`[warn] No --email provided. Using placeholder: ${email}`);
}

// ── Supabase service role client ──────────────────────────────────────────────

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('[error] Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const username = generateUsername();
  const tempPassword = generatePassword();

  // 1. Create auth user
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true,
  });

  if (authError || !authData?.user) {
    console.error('[error] Failed to create auth user:', authError?.message ?? 'unknown error');
    process.exit(1);
  }

  const userId = authData.user.id;

  // 2. Insert into public.users
  const { error: dbError } = await supabase.from('users').insert({
    id: userId,
    username,
    role: 'client',
    requires_password_reset: true,
  });

  if (dbError) {
    console.error('[error] Failed to insert user record:', dbError.message);
    // Attempt cleanup
    await supabase.auth.admin.deleteUser(userId);
    process.exit(1);
  }

  // 3. Print credentials
  console.log('');
  console.log('✅ Client account created successfully');
  console.log('─────────────────────────────────────');
  console.log(`  Email:          ${email}`);
  console.log(`  Username:       ${username}`);
  console.log(`  Temp Password:  ${tempPassword}`);
  console.log(`  User ID:        ${userId}`);
  console.log('─────────────────────────────────────');
  console.log('');
}

main().catch((err) => {
  console.error('[error] Unexpected error:', err);
  process.exit(1);
});
