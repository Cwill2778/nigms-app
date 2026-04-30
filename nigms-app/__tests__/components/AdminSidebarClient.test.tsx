// Unit tests for AdminSidebarClient component
// Validates: Requirements 3.2
// @vitest-environment jsdom

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AdminSidebarClient from '@/components/AdminSidebarClient';

// Mock next/navigation
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => '/admin-dashboard',
}));

// Mock supabase browser client
const mockSignOut = vi.fn().mockResolvedValue({ error: null });
vi.mock('@/lib/supabase-browser', () => ({
  createBrowserClient: () => ({
    auth: { signOut: mockSignOut },
  }),
}));

// Mock IndustrialSidebar to simplify rendering
vi.mock('@/components/IndustrialSidebar', () => ({
  default: ({ items }: { items: Array<{ label: string; onClick?: () => void; href: string }> }) => (
    <nav data-testid="industrial-sidebar">
      {items.map((item) => (
        <button
          key={item.href}
          data-testid={`nav-item-${item.label.toLowerCase()}`}
          onClick={item.onClick}
        >
          {item.label}
        </button>
      ))}
    </nav>
  ),
}));

// Mock lucide-react
vi.mock('lucide-react', () => ({
  Settings: () => <span>⚙</span>,
  LogOut: () => <span>🚪</span>,
}));

describe('AdminSidebarClient', () => {
  beforeEach(() => {
    mockPush.mockClear();
    mockSignOut.mockClear();
  });

  it('renders the sidebar', () => {
    render(<AdminSidebarClient staticItems={[]} />);
    expect(screen.getByTestId('industrial-sidebar')).toBeTruthy();
  });

  it('renders static items passed as props', () => {
    const staticItems = [
      { href: '/admin-dashboard', label: 'Dashboard', icon: <span>📊</span> },
      { href: '/clients', label: 'Clients', icon: <span>👥</span> },
    ];
    render(<AdminSidebarClient staticItems={staticItems} />);
    expect(screen.getByTestId('nav-item-dashboard')).toBeTruthy();
    expect(screen.getByTestId('nav-item-clients')).toBeTruthy();
  });

  it('renders Settings and Logout items', () => {
    render(<AdminSidebarClient staticItems={[]} />);
    expect(screen.getByTestId('nav-item-settings')).toBeTruthy();
    expect(screen.getByTestId('nav-item-logout')).toBeTruthy();
  });

  it('calls signOut and redirects to /login when Logout is clicked', async () => {
    render(<AdminSidebarClient staticItems={[]} />);
    fireEvent.click(screen.getByTestId('nav-item-logout'));

    await waitFor(() => {
      expect(mockSignOut).toHaveBeenCalledTimes(1);
      expect(mockPush).toHaveBeenCalledWith('/login');
    });
  });
});
