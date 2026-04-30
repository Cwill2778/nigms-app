// Unit tests for ClientSearchInput component
// Validates: Requirements 3.11
// @vitest-environment jsdom

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import ClientSearchInput from '@/components/ClientSearchInput';
import type { ClientSearchResult } from '@/components/ClientSearchInput';

const mockResults: ClientSearchResult[] = [
  { id: 'c-1', first_name: 'Alice', last_name: 'Johnson', username: 'alice', phone: '555-0001', email: 'alice@example.com' },
  { id: 'c-2', first_name: null, last_name: null, username: 'bobuser', phone: null, email: 'bob@example.com' },
];

describe('ClientSearchInput', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders the input field', () => {
    render(<ClientSearchInput onSelect={() => {}} />);
    expect(screen.getByRole('textbox')).toBeTruthy();
  });

  it('renders with custom placeholder', () => {
    render(<ClientSearchInput onSelect={() => {}} placeholder="Find a client" />);
    expect(screen.getByPlaceholderText('Find a client')).toBeTruthy();
  });

  it('does not search for queries shorter than 2 characters', async () => {
    vi.useFakeTimers();
    render(<ClientSearchInput onSelect={() => {}} />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'a' } });
    await act(async () => { vi.runAllTimers(); });
    expect(fetch).not.toHaveBeenCalled();
    vi.useRealTimers();
  });

  it('debounces search — does not call fetch immediately', () => {
    vi.useFakeTimers();
    render(<ClientSearchInput onSelect={() => {}} />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'ali' } });
    // Before debounce fires
    expect(fetch).not.toHaveBeenCalled();
    vi.useRealTimers();
  });

  it('calls fetch after debounce delay with query', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => mockResults,
    } as Response);

    vi.useFakeTimers();
    render(<ClientSearchInput onSelect={() => {}} />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'ali' } });

    await act(async () => {
      vi.advanceTimersByTime(300);
      await Promise.resolve();
    });

    expect(fetch).toHaveBeenCalledWith('/api/admin/clients/search?q=ali');
    vi.useRealTimers();
  });

  it('displays search results after fetch', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => mockResults,
    } as Response);

    vi.useFakeTimers();
    render(<ClientSearchInput onSelect={() => {}} />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'ali' } });

    await act(async () => {
      vi.advanceTimersByTime(300);
      await Promise.resolve();
    });

    vi.useRealTimers();

    await waitFor(() => {
      expect(screen.getByText('Alice Johnson')).toBeTruthy();
    });
  });

  it('falls back to username when no first/last name', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => mockResults,
    } as Response);

    vi.useFakeTimers();
    render(<ClientSearchInput onSelect={() => {}} />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'bob' } });

    await act(async () => {
      vi.advanceTimersByTime(300);
      await Promise.resolve();
    });

    vi.useRealTimers();

    await waitFor(() => {
      expect(screen.getByText('bobuser')).toBeTruthy();
    });
  });

  it('calls onSelect with client data when result is clicked', async () => {
    const onSelect = vi.fn();
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => mockResults,
    } as Response);

    vi.useFakeTimers();
    render(<ClientSearchInput onSelect={onSelect} />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'ali' } });

    await act(async () => {
      vi.advanceTimersByTime(300);
      await Promise.resolve();
    });

    vi.useRealTimers();

    await waitFor(() => screen.getByText('Alice Johnson'));
    fireEvent.click(screen.getByText('Alice Johnson'));
    expect(onSelect).toHaveBeenCalledWith(mockResults[0]);
  });

  it('clears input after selection', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => mockResults,
    } as Response);

    vi.useFakeTimers();
    render(<ClientSearchInput onSelect={() => {}} />);
    const input = screen.getByRole('textbox') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'ali' } });

    await act(async () => {
      vi.advanceTimersByTime(300);
      await Promise.resolve();
    });

    vi.useRealTimers();

    await waitFor(() => screen.getByText('Alice Johnson'));
    fireEvent.click(screen.getByText('Alice Johnson'));
    expect(input.value).toBe('');
  });
});
