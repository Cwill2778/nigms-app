import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

describe('PATCH /api/admin/work-orders/[id]/time-entries/[entryId]', () => {
  let adminUserId: string;
  let clientUserId: string;
  let workOrderId: string;
  let timeEntryId: string;
  let adminSession: string;
  let clientSession: string;

  beforeAll(async () => {
    // Create admin user
    const { data: adminData, error: adminError } = await supabase.auth.admin.createUser({
      email: `admin-patch-time-${Date.now()}@test.com`,
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
      email: `client-patch-time-${Date.now()}@test.com`,
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
        total_billable_minutes: 0,
      })
      .select()
      .single();
    
    if (woError || !woData) {
      throw new Error(`Failed to create work order: ${woError?.message}`);
    }
    workOrderId = woData.id;

    // Create a time entry
    const startedAt = new Date(Date.now() - 3600000); // 1 hour ago
    const { data: entryData, error: entryError } = await supabase
      .from('time_entries')
      .insert({
        work_order_id: workOrderId,
        started_at: startedAt.toISOString(),
      })
      .select()
      .single();
    
    if (entryError || !entryData) {
      throw new Error(`Failed to create time entry: ${entryError?.message}`);
    }
    timeEntryId = entryData.id;

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

  it('should return 403 when not authenticated', async () => {
    const response = await fetch(
      `http://localhost:3000/api/admin/work-orders/${workOrderId}/time-entries/${timeEntryId}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    expect(response.status).toBe(403);
    const data = await response.json();
    expect(data.error).toBe('Forbidden');
  });

  it('should return 403 when authenticated as client', async () => {
    const response = await fetch(
      `http://localhost:3000/api/admin/work-orders/${workOrderId}/time-entries/${timeEntryId}`,
      {
        method: 'PATCH',
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

  it('should return 404 when time entry does not exist', async () => {
    const fakeEntryId = '00000000-0000-0000-0000-000000000000';
    
    const response = await fetch(
      `http://localhost:3000/api/admin/work-orders/${workOrderId}/time-entries/${fakeEntryId}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminSession}`,
        },
      }
    );

    expect(response.status).toBe(404);
    const data = await response.json();
    expect(data.error).toBe('Time entry not found');
  });

  it('should set stopped_at and return updated time entry when authenticated as admin', async () => {
    const beforeTime = new Date();
    
    const response = await fetch(
      `http://localhost:3000/api/admin/work-orders/${workOrderId}/time-entries/${timeEntryId}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminSession}`,
        },
      }
    );

    expect(response.status).toBe(200);
    const data = await response.json();
    
    expect(data.id).toBe(timeEntryId);
    expect(data.stopped_at).toBeDefined();
    expect(data.stopped_at).not.toBeNull();
    
    // Verify stopped_at is recent (within 5 seconds)
    const stoppedAt = new Date(data.stopped_at);
    const timeDiff = Math.abs(stoppedAt.getTime() - beforeTime.getTime());
    expect(timeDiff).toBeLessThan(5000);
  });

  it('should update total_billable_minutes on work order', async () => {
    // Create a new time entry for this test
    const startedAt = new Date(Date.now() - 1800000); // 30 minutes ago
    const { data: newEntry } = await supabase
      .from('time_entries')
      .insert({
        work_order_id: workOrderId,
        started_at: startedAt.toISOString(),
      })
      .select()
      .single();

    // Get initial total_billable_minutes
    const { data: woBefore } = await supabase
      .from('work_orders')
      .select('total_billable_minutes')
      .eq('id', workOrderId)
      .single();
    
    const initialMinutes = woBefore?.total_billable_minutes ?? 0;

    // Stop the time entry
    const response = await fetch(
      `http://localhost:3000/api/admin/work-orders/${workOrderId}/time-entries/${newEntry!.id}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminSession}`,
        },
      }
    );

    expect(response.status).toBe(200);

    // Verify total_billable_minutes was updated
    const { data: woAfter } = await supabase
      .from('work_orders')
      .select('total_billable_minutes')
      .eq('id', workOrderId)
      .single();
    
    const finalMinutes = woAfter?.total_billable_minutes ?? 0;
    
    // Should have increased by approximately 30 minutes (allow 1 minute variance)
    const minutesAdded = finalMinutes - initialMinutes;
    expect(minutesAdded).toBeGreaterThanOrEqual(29);
    expect(minutesAdded).toBeLessThanOrEqual(31);
  });

  it('should return 400 when time entry is already stopped', async () => {
    // Create and immediately stop a time entry
    const { data: stoppedEntry } = await supabase
      .from('time_entries')
      .insert({
        work_order_id: workOrderId,
        started_at: new Date(Date.now() - 1800000).toISOString(),
        stopped_at: new Date().toISOString(),
      })
      .select()
      .single();

    const response = await fetch(
      `http://localhost:3000/api/admin/work-orders/${workOrderId}/time-entries/${stoppedEntry!.id}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminSession}`,
        },
      }
    );

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe('Time entry already stopped');
  });

  it('should use computed duration_minutes from database', async () => {
    // Create a new time entry with a known duration
    const startedAt = new Date(Date.now() - 7200000); // 2 hours ago
    const { data: newEntry } = await supabase
      .from('time_entries')
      .insert({
        work_order_id: workOrderId,
        started_at: startedAt.toISOString(),
      })
      .select()
      .single();

    // Stop the time entry
    await fetch(
      `http://localhost:3000/api/admin/work-orders/${workOrderId}/time-entries/${newEntry!.id}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminSession}`,
        },
      }
    );

    // Fetch the entry directly from database to verify computed column
    const { data: dbEntry } = await supabase
      .from('time_entries')
      .select('duration_minutes, started_at, stopped_at')
      .eq('id', newEntry!.id)
      .single();

    expect(dbEntry).toBeDefined();
    expect(dbEntry!.duration_minutes).toBeDefined();
    expect(dbEntry!.duration_minutes).not.toBeNull();
    
    // Should be approximately 120 minutes (allow 1 minute variance)
    expect(dbEntry!.duration_minutes).toBeGreaterThanOrEqual(119);
    expect(dbEntry!.duration_minutes).toBeLessThanOrEqual(121);
  });
});
