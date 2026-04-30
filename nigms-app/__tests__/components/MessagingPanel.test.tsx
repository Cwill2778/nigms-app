// Unit tests for MessagingPanel component
// Validates: Requirements 3.3, 4.1
// @vitest-environment jsdom

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import MessagingPanel from '@/components/MessagingPanel';
import type { Message } from '@/lib/types';

// Mock scrollIntoView (not available in jsdom)
window.HTMLElement.prototype.scrollIntoView = vi.fn();

// Mock supabase browser client with channel/subscribe
const mockRemoveChannel = vi.fn();
const mockSubscribe = vi.fn((cb: (status: string) => void) => {
  cb('SUBSCRIBED');
  return mockChannel;
});
const mockOn = vi.fn(() => mockChannel);
const mockChannel = { on: mockOn, subscribe: mockSubscribe };
const mockSupabase = {
  channel: vi.fn(() => mockChannel),
  removeChannel: mockRemoveChannel,
};

vi.mock('@/lib/supabase-browser', () => ({
  createBrowserClient: () => mockSupabase,
}));

const mockConversations = [
  { clientId: 'client-1', clientName: 'Alice Johnson', unreadCount: 2, lastMessage: 'Hello there' },
  { clientId: 'client-2', clientName: 'Bob Smith', unreadCount: 0, lastMessage: 'Thanks!' },
];

const mockMessages: Message[] = [
  {
    id: 'msg-1',
    sender_id: 'client-1',
    recipient_id: 'admin-1',
    sender_role: 'client',
    body: 'Hello from client',
    read_at: null,
    created_at: '2024-01-01T10:00:00Z',
  },
  {
    id: 'msg-2',
    sender_id: 'admin-1',
    recipient_id: 'client-1',
    sender_role: 'admin',
    body: 'Hello from admin',
    read_at: '2024-01-01T10:01:00Z',
    created_at: '2024-01-01T10:01:00Z',
  },
];

describe('MessagingPanel', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
    mockSupabase.channel.mockClear();
    mockRemoveChannel.mockClear();
  });

  it('shows loading state initially', () => {
    vi.mocked(fetch).mockReturnValue(new Promise(() => {})); // never resolves
    render(<MessagingPanel adminUserId="admin-1" />);
    expect(screen.getByText('Loading…')).toBeTruthy();
  });

  it('displays conversations after loading', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ conversations: mockConversations }),
    } as Response);

    render(<MessagingPanel adminUserId="admin-1" />);

    await waitFor(() => {
      expect(screen.getByText('Alice Johnson')).toBeTruthy();
      expect(screen.getByText('Bob Smith')).toBeTruthy();
    });
  });

  it('shows empty state when no conversations', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ conversations: [] }),
    } as Response);

    render(<MessagingPanel adminUserId="admin-1" />);

    await waitFor(() => {
      expect(screen.getByText('No conversations yet.')).toBeTruthy();
    });
  });

  it('shows unread count badge', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ conversations: mockConversations }),
    } as Response);

    render(<MessagingPanel adminUserId="admin-1" />);

    await waitFor(() => {
      expect(screen.getByText('2')).toBeTruthy();
    });
  });

  it('shows "Select a conversation" prompt when none selected', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ conversations: mockConversations }),
    } as Response);

    render(<MessagingPanel adminUserId="admin-1" />);

    await waitFor(() => {
      expect(screen.getByText('Select a conversation')).toBeTruthy();
    });
  });

  it('loads messages when a conversation is selected', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ conversations: mockConversations }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ messages: mockMessages }),
      } as Response)
      .mockResolvedValueOnce({ ok: true, json: async () => ({}) } as Response); // markRead

    render(<MessagingPanel adminUserId="admin-1" />);

    await waitFor(() => screen.getByText('Alice Johnson'));
    fireEvent.click(screen.getByText('Alice Johnson'));

    await waitFor(() => {
      expect(screen.getByText('Hello from client')).toBeTruthy();
      expect(screen.getByText('Hello from admin')).toBeTruthy();
    });
  });

  it('sends a message when Send is clicked', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ conversations: mockConversations }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ messages: [] }),
      } as Response)
      .mockResolvedValueOnce({ ok: true, json: async () => ({}) } as Response) // markRead
      .mockResolvedValueOnce({ ok: true, json: async () => ({}) } as Response); // send

    render(<MessagingPanel adminUserId="admin-1" />);

    await waitFor(() => screen.getByText('Alice Johnson'));
    fireEvent.click(screen.getByText('Alice Johnson'));

    await waitFor(() => screen.getByPlaceholderText('Type a message…'));

    fireEvent.change(screen.getByPlaceholderText('Type a message…'), {
      target: { value: 'Test message' },
    });
    fireEvent.click(screen.getByRole('button', { name: /send/i }));

    await waitFor(() => {
      expect(screen.getByText('Test message')).toBeTruthy();
    });
  });

  it('creates a supabase realtime channel subscription', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ conversations: [] }),
    } as Response);

    render(<MessagingPanel adminUserId="admin-1" />);

    await waitFor(() => {
      expect(mockSupabase.channel).toHaveBeenCalledWith('admin-messages');
    });
  });

  it('shows error state when conversations fail to load', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      json: async () => ({}),
    } as Response);

    render(<MessagingPanel adminUserId="admin-1" />);

    await waitFor(() => {
      expect(screen.getByText('Messaging unavailable')).toBeTruthy();
    });
  });

  it('marks messages as read when conversation is selected', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ conversations: mockConversations }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ messages: [] }),
      } as Response)
      .mockResolvedValueOnce({ ok: true, json: async () => ({}) } as Response); // markRead

    render(<MessagingPanel adminUserId="admin-1" />);

    await waitFor(() => screen.getByText('Alice Johnson'));
    fireEvent.click(screen.getByText('Alice Johnson'));

    await waitFor(() => {
      const calls = vi.mocked(fetch).mock.calls;
      const readCall = calls.find(
        ([url, opts]) => url === '/api/admin/messages/read' && (opts as RequestInit)?.method === 'PATCH'
      );
      expect(readCall).toBeTruthy();
    });
  });
});
