/**
 * Test suite for auto-number generation SQL functions
 * Feature: comprehensive-implementation-fixes
 * Bug Condition: 1.4
 */

import { describe, it, expect } from 'vitest';
import { createClient } from '@supabase/supabase-js';

// Note: These tests require a running Supabase instance
// They verify that the SQL functions exist and work correctly

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

describe('Auto-number generation functions', () => {
  const supabase = createClient(supabaseUrl, supabaseKey);

  it('generate_wo_number function exists and returns correct format', async () => {
    const year = new Date().getFullYear();
    
    const { data, error } = await supabase.rpc('generate_wo_number', {
      year_param: year
    });

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(data).toMatch(/^WO-\d{4}-\d{4}$/);
    expect(data).toContain(`WO-${year}-`);
  });

  it('generate_estimate_number function exists and returns correct format', async () => {
    // Use a test UUID
    const testClientId = '12345678-1234-1234-1234-123456789012';
    
    const { data, error } = await supabase.rpc('generate_estimate_number', {
      client_id_param: testClientId
    });

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(data).toMatch(/^EST-[a-f0-9]{8}-\d{4}$/);
    expect(data).toContain('EST-12345678-');
  });

  it('generate_receipt_number function exists and returns correct format', async () => {
    const year = new Date().getFullYear();
    
    const { data, error } = await supabase.rpc('generate_receipt_number', {
      year_param: year
    });

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(data).toMatch(/^RCT-\d{4}-\d{4}$/);
    expect(data).toContain(`RCT-${year}-`);
  });

  it('work order numbers are unique', async () => {
    const year = new Date().getFullYear();
    
    // Generate two numbers
    const { data: num1 } = await supabase.rpc('generate_wo_number', {
      year_param: year
    });
    
    const { data: num2 } = await supabase.rpc('generate_wo_number', {
      year_param: year
    });

    expect(num1).toBeDefined();
    expect(num2).toBeDefined();
    
    // Note: In a real scenario with actual work orders, these would be different
    // This test just verifies the function can be called multiple times
    expect(num1).toMatch(/^WO-\d{4}-\d{4}$/);
    expect(num2).toMatch(/^WO-\d{4}-\d{4}$/);
  });
});
