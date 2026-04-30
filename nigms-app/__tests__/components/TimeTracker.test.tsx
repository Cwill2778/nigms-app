// Unit tests for TimeTracker component
// Validates: Requirements 3.6
// @vitest-environment jsdom

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import TimeTracker from '@/components/TimeTracker';
import type { TimeEntry } from '@/lib/types';

// Mock lucide-react
vi.mock('lucide-react', () => ({
  Play: () => <span data-testid="play-icon">▶</span>,
  Square: () => <span data-testid="stop-icon">■</span>,
}));

const makeEntry = (overrides: Partial<TimeEntry> = {}): TimeEntry => ({
  id: 'entry-1',
  work_order_id: 'wo-1',
  started_at: new Date(Date.now() - 65000).toISOString(), // 65 seconds ago
  stopped_at: null,
  duration_minutes: null,
  created_at: new Date().toISOString(),
  ...overrides,
});

describe('TimeTracker', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders total billable time', () => {
    render(
      <TimeTracker
        workOrderId="wo-1"
        totalBillableMinutes={90}
        activeEntry={null}
        onEntryStarted={() => {}}
        onEntryStopped={() => {}}
      />
    );
    expect(screen.getByText('1h 30m')).toBeTruthy();
  });

  it('shows Start button when no active entry', () => {
    render(
      <TimeTracker
        workOrderId="wo-1"
        totalBillableMinutes={0}
        activeEntry={null}
        onEntryStarted={() => {}}
        onEntryStopped={() => {}}
      />
    );
    expect(screen.getByText('Start')).toBeTruthy();
    expect(screen.getByTestId('play-icon')).toBeTruthy();
  });

  it('shows Stop button when there is an active entry', () => {
    render(
      <TimeTracker
        workOrderId="wo-1"
        totalBillableMinutes={0}
        activeEntry={makeEntry()}
        onEntryStarted={() => {}}
        onEntryStopped={() => {}}
      />
    );
    expect(screen.getByText('Stop')).toBeTruthy();
    expect(screen.getByTestId('stop-icon')).toBeTruthy();
  });

  it('displays elapsed time when timer is running', () => {
    render(
      <TimeTracker
        workOrderId="wo-1"
        totalBillableMinutes={0}
        activeEntry={makeEntry()}
        onEntryStarted={() => {}}
        onEntryStopped={() => {}}
      />
    );
    // Should show HH:MM:SS format
    const elapsed = screen.getByText(/\d{2}:\d{2}:\d{2}/);
    expect(elapsed).toBeTruthy();
  });

  it('calls fetch and onEntryStarted when Start is clicked', async () => {
    // API now returns { entry_id } — component constructs the TimeEntry locally
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ entry_id: 'entry-new' }),
    } as Response);

    const onEntryStarted = vi.fn();
    render(
      <TimeTracker
        workOrderId="wo-1"
        totalBillableMinutes={0}
        activeEntry={null}
        onEntryStarted={onEntryStarted}
        onEntryStopped={() => {}}
      />
    );

    fireEvent.click(screen.getByText('Start'));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/admin/work-orders/wo-1/time-entries', { method: 'POST' });
      expect(onEntryStarted).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'entry-new',
          work_order_id: 'wo-1',
          stopped_at: null,
          duration_minutes: null,
        })
      );
    });
  });

  it('calls fetch and onEntryStopped when Stop is clicked', async () => {
    const activeEntry = makeEntry();
    const stoppedEntry: TimeEntry = { ...activeEntry, stopped_at: new Date().toISOString(), duration_minutes: 2 };
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => stoppedEntry,
    } as Response);

    const onEntryStopped = vi.fn();
    render(
      <TimeTracker
        workOrderId="wo-1"
        totalBillableMinutes={10}
        activeEntry={activeEntry}
        onEntryStarted={() => {}}
        onEntryStopped={onEntryStopped}
      />
    );

    fireEvent.click(screen.getByText('Stop'));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        `/api/admin/work-orders/wo-1/time-entries/${activeEntry.id}`,
        { method: 'PATCH' }
      );
      expect(onEntryStopped).toHaveBeenCalled();
    });
  });

  it('shows error message on failed start', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Unauthorized' }),
    } as Response);

    render(
      <TimeTracker
        workOrderId="wo-1"
        totalBillableMinutes={0}
        activeEntry={null}
        onEntryStarted={() => {}}
        onEntryStopped={() => {}}
      />
    );

    fireEvent.click(screen.getByText('Start'));

    await waitFor(() => {
      expect(screen.getByText('Unauthorized')).toBeTruthy();
    });
  });

  it('increments elapsed time every second', async () => {
    vi.useFakeTimers({ now: Date.now() });
    const entry = makeEntry({ started_at: new Date(Date.now()).toISOString() });
    render(
      <TimeTracker
        workOrderId="wo-1"
        totalBillableMinutes={0}
        activeEntry={entry}
        onEntryStarted={() => {}}
        onEntryStopped={() => {}}
      />
    );

    const before = screen.getByText(/\d{2}:\d{2}:\d{2}/).textContent;
    await act(async () => { vi.advanceTimersByTime(3000); });
    const after = screen.getByText(/\d{2}:\d{2}:\d{2}/).textContent;
    expect(before).not.toBe(after);
    vi.useRealTimers();
  });
});
