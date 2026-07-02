// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from '@testing-library/react';

const refresh = vi.fn();
let pathname = '/';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh }),
  usePathname: () => pathname,
}));

let changeHandlers: Array<() => void> = [];
const channel = {
  on: vi.fn((_event: string, _config: unknown, handler: () => void) => {
    changeHandlers.push(handler);
    return channel;
  }),
  subscribe: vi.fn(() => channel),
};
const supabase = {
  channel: vi.fn(() => channel),
  removeChannel: vi.fn(),
};
let browserClient: typeof supabase | null = supabase;

vi.mock('@/lib/data/supabase-browser', () => ({
  getBrowserSupabase: () => browserClient,
}));

import { RealtimeRefresher } from '@/components/realtime-refresher';

beforeEach(() => {
  vi.useFakeTimers();
  refresh.mockReset();
  channel.on.mockClear();
  channel.subscribe.mockClear();
  supabase.channel.mockClear();
  supabase.removeChannel.mockClear();
  changeHandlers = [];
  browserClient = supabase;
  pathname = '/';
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('RealtimeRefresher', () => {
  it('does not open a subscription on routes without live data', () => {
    pathname = '/guia';
    render(<RealtimeRefresher />);
    expect(supabase.channel).not.toHaveBeenCalled();
  });

  it('subscribes to the PII-free realtime_signal table on the home route', () => {
    pathname = '/';
    render(<RealtimeRefresher />);
    expect(supabase.channel).toHaveBeenCalledTimes(1);
    const tables = channel.on.mock.calls.map((call) => (call[1] as { table: string }).table);
    expect(tables).toEqual(['realtime_signal']);
  });

  it('subscribes on a zona detail route', () => {
    pathname = '/zona/abc';
    render(<RealtimeRefresher />);
    expect(supabase.channel).toHaveBeenCalledTimes(1);
  });

  it('coalesces a burst of change events into a single refresh', () => {
    pathname = '/';
    render(<RealtimeRefresher />);

    changeHandlers.forEach((handler) => handler());
    changeHandlers.forEach((handler) => handler());
    expect(refresh).not.toHaveBeenCalled();

    vi.advanceTimersByTime(3000);
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it('does not refresh after the component unmounts', () => {
    pathname = '/';
    const { unmount } = render(<RealtimeRefresher />);

    changeHandlers[0]?.();
    unmount();
    vi.advanceTimersByTime(3000);

    expect(refresh).not.toHaveBeenCalled();
  });
});
