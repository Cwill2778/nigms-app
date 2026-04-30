import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

describe('POST /api/admin/work-orders/[id]/time-entries', () => {
  let adminUserId: string;
  let clientUserId: string;
  let workOrderId: string;
  let adminSession: string;
  let clientSession: string;

  beforeAll(async () => {
    // Create admin user
    const { data: adminData, error: adminError } = await supabase.auth.admin.createUser({
      email: `admin-time-${Date.now()}@test.com`,
      password: 'password123',
      email_confirm: true,
    });
    
    if (adminError || !adminData.user) {
      throw new Error(`Failed to create admin user: ${adminError?.message}`);
    }
    adminUserId = adminData.user.id;

    // Set admin role
    const { error: adminInsertError } = await supabase.from('users').insert({
      id: adminUserId,
      email: adminData.user.email,
      role: 'admin',
      first_name: 'Admin',
      last_name: 'User',
    });
    
    if (adminInsertError) {
      throw new Error(`Failed to insert admin user: ${adminInsertError.message}`);
    }

    // Create client user
    const { data: clientData, error: clientError } = await supabase.auth.admin.createUser({
      email: `client-time-${Date.now()}@test.com`,
      password: 'password123',
      email_confirm: true,
    });
    
    if (clientError || !clientData.user) {
      throw new Error(`Failed to create client user: ${clientError?.message}`);
    }
    clientUserId = clientData.user.id;

    // Set client role
    const { error: clientInsertError } = await supabase.from('users').insert({
      id: clientUserId,
      email: clientData.user.email,
      role: 'client',
      first_name: 'Client',
      last_name: 'User',
    });
    
    if (clientInsertError) {
      throw new Error(`Failed to insert client user: ${clientInsertError.message}`);
    }

    // Create work order
    const { data: woData, error: woError } = await supabase
      .from('work_orders')
      .insert({
        client_id: clientUserId,
        title: 'Test Work Order',
        description: 'Test description',
        status: 'pending',
      })
      .select()
      .single();
    
    if (woError || !woData) {
      throw new Error(`Failed to create work order: ${woError?.message}`);
    }
    workOrderId = woData.id;

    // Get sessions
    const adminSignIn = await supabase.auth.signInWithPassword({
      email: adminData.user.email!,
      password: 'password123',
    });
    
    if (!adminSignIn.data.session) {
      throw new Error('Failed to sign in admin');
    }
    adminSession = adminSignIn.data.session.access_token;

    const clientSignIn = await supabase.auth.signInWithPassword({
      email: clientData.user.email!,
      password: 'password123',
    });
    
    if (!clientSignIn.data.session) {
      throw new Error('Failed to sign in client');
    }
    clientSession = clientSignIn.data.session.access_token;
  });

  afterAll(async () => {
    // Cleanup
    if (workOrderId) {
      await supabase.from('time_entries').delete().eq('work_order_id', workOrderId);
      await supabase.from('work_orders').delete().eq('id', workOrderId);
    }
    if (adminUserId) {
      await supabase.from('users').delete().eq('id', adminUserId);
      await supabase.auth.admin.deleteUser(adminUserId);
    }
    if (clientUserId) {
      await supabase.from('users').delete().eq('id', clientUserId);
      await supabase.auth.admin.deleteUser(clientUserId);
    }
  });

  it('should return 401 when not authenticated', async () => {
    const response = await fetch(
      `http://localhost:3000/api/admin/work-orders/${workOrderId}/time-entries`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.error).toBe('Unauthorized');
  });

  it('should return 403 when authenticated as client', async () => {
    const response = await fetch(
      `http://localhost:3000/api/admin/work-orders/${workOrderId}/time-entries`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${clientSession}`,
        },
      }
    );

    expect(response.status).toBe(403);
    const data = await response.json();
    expect(data.error).toBe('Forbidden');
  });

  it('should create time entry with started_at when authenticated as admin', async () => {
    const beforeTime = new Date();
    
    const response = await fetch(
      `http://localhost:3000/api/admin/work-orders/${workOrderId}/time-entries`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminSession}`,
        },
      }
    );

    expect(response.status).toBe(201);
    const data = await response.json();
    
    expect(data).toHaveProperty('id');
    expect(data.work_order_id).toBe(workOrderId);
    expect(data.started_at).toBeDefined();
    expect(data.stopped_at).toBeNull();
    
    // Verify started_at is recent (within 5 seconds)
    const startedAt = new Date(data.started_at);
    const timeDiff = Math.abs(startedAt.getTime() - beforeTime.getTime());
    expect(timeDiff).toBeLessThan(5000);
  });

  it('should associate time entry with correct work order', async () => {
    const response = await fetch(
      `http://localhost:3000/api/admin/work-orders/${workOrderId}/time-entries`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminSession}`,
        },
      }
    );

    expect(response.status).toBe(201);
    const data = await response.json();
    
    // Verify in database
    const { data: dbEntry } = await supabase
      .from('time_entries')
      .select('*')
      .eq('id', data.id)
      .single();
    
    expect(dbEntry).toBeDefined();
    expect(dbEntry!.work_order_id).toBe(workOrderId);
  });
});
