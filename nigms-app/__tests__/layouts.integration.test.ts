// @vitest-environment jsdom
// Feature: industrial-framework-layout
// Task 7.1: Integration tests for layouts
// Validates: Requirements 2.3, 3.7

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: () => '/dashboard',
  redirect: vi.fn(),
}));

// Mock @/components/Navbar and @/components/Footer to avoid complex deps
vi.mock('@/components/Navbar', () => ({
  default: () => React.createElement('div', { 'data-testid': 'navbar' }),
}));

vi.mock('@/components/Footer', () => ({
  default: () => React.createElement('div', { 'data-testid': 'footer' }),
}));

// Mock lucide-react icons used in layouts
vi.mock('lucide-react', () => ({
  LayoutDashboard: () => React.createElement('span', null, 'icon'),
  PlusSquare: () => React.createElement('span', null, 'icon'),
  Users: () => React.createElement('span', null, 'icon'),
  ClipboardList: () => React.createElement('span', null, 'icon'),
  CreditCard: () => React.createElement('span', null, 'icon'),
}));

// Mock @/lib/supabase — will be configured per test suite
vi.mock('@/lib/supabase', () => ({
  createServerClient: vi.fn(),
}));

import { createServerClient } from '@/lib/supabase';

const mockCreateServerClient = createServerClient as ReturnType<typeof vi.fn>;

describe('PublicLayout', () => {
  it('renders SteelFrameContainer (border-[#4A4A4A] class present)', async () => {
    const PublicLayout = (await import('@/app/(public)/layout')).default;
    const { container } = render(
      React.createElement(PublicLayout, null, React.createElement('div', null, 'child'))
    );
    const steelFrame = container.querySelector('.border-\\[\\#4A4A4A\\]');
    expect(steelFrame).not.toBeNull();
  });
});

describe('ClientLayout', () => {
  beforeEach(() => {
    vi.resetModules();
    mockCreateServerClient.mockResolvedValue({
      auth: {
        getSession: vi.fn().mockResolvedValue({
          data: {
            session: {
              user: { id: 'user-123' },
            },
          },
        }),
      },
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { requires_password_reset: false },
        }),
      }),
    });
  });

  it('renders SteelFrameContainer (border-[#4A4A4A] class present)', async () => {
    const ClientLayout = (await import('@/app/(client)/layout')).default;
    const result = await ClientLayout({ children: React.createElement('div', null, 'child') });
    const { container } = render(result as React.ReactElement);
    const steelFrame = container.querySelector('.border-\\[\\#4A4A4A\\]');
    expect(steelFrame).not.toBeNull();
  });
});

describe('AdminLayout', () => {
  beforeEach(() => {
    vi.resetModules();
    mockCreateServerClient.mockResolvedValue({
      auth: {
        getSession: vi.fn().mockResolvedValue({
          data: {
            session: {
              user: { id: 'admin-456' },
            },
          },
        }),
      },
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { role: 'admin' },
        }),
      }),
    });
  });

  it('renders SteelFrameContainer (border-[#4A4A4A] class present)', async () => {
    const AdminLayout = (await import('@/app/(admin)/layout')).default;
    const result = await AdminLayout({ children: React.createElement('div', null, 'child') });
    const { container } = render(result as React.ReactElement);
    const steelFrame = container.querySelector('.border-\\[\\#4A4A4A\\]');
    expect(steelFrame).not.toBeNull();
  });
});
