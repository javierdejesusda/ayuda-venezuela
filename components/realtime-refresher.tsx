'use client';

import { useEffect } from 'react';

import { usePathname, useRouter } from 'next/navigation';

import { interpretChannelStatus } from '@/lib/data/realtime-status';
import { getBrowserSupabase } from '@/lib/data/supabase-browser';

/** Coalesce bursts of realtime changes into a single refresh. */
const REFRESH_DEBOUNCE_MS = 3000;

/** Routes that render live location/need data and therefore need a subscription. */
function isLiveRoute(pathname: string): boolean {
  return pathname === '/' || pathname.startsWith('/zona/');
}

/**
 * Subscribes to Supabase changes and refreshes server components so the map and
 * lists update live. The subscription only opens on routes that actually show
 * live data (home and zona), so visitors on static pages do not each hold a
 * websocket against Supabase realtime connection limits. Refreshes are debounced
 * so a burst of writes triggers one refresh, not a storm.
 *
 * No-op in demo mode. On a censored or degraded network the websocket may never
 * connect: errors are swallowed and onStatusChange(false) lets a parent surface
 * an "actualizaciones en vivo no disponibles" hint. The Supabase client keeps
 * retrying, so onStatusChange(true) fires again on recovery.
 *
 * onStatusChange must be a stable reference (useCallback) to avoid resubscribe
 * churn.
 */
export function RealtimeRefresher({
  onStatusChange,
}: {
  onStatusChange?: (live: boolean) => void;
} = {}) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLiveRoute(pathname)) {
      // Nothing live to refresh here: report healthy so the connectivity banner
      // does not warn about updates this route never shows.
      onStatusChange?.(true);
      return;
    }

    const supabase = getBrowserSupabase();
    if (!supabase) return;

    let refreshTimer: ReturnType<typeof setTimeout> | null = null;
    const scheduleRefresh = () => {
      if (refreshTimer) clearTimeout(refreshTimer);
      refreshTimer = setTimeout(() => {
        refreshTimer = null;
        router.refresh();
      }, REFRESH_DEBOUNCE_MS);
    };

    let channel: ReturnType<typeof supabase.channel> | null = null;
    try {
      channel = supabase
        .channel('apoyo-venezuela-realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'locations' }, scheduleRefresh)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'needs' }, scheduleRefresh)
        .subscribe((status) => {
          const { live, settled } = interpretChannelStatus(status);
          if (settled) onStatusChange?.(live);
        });
    } catch {
      onStatusChange?.(false);
    }

    return () => {
      if (refreshTimer) clearTimeout(refreshTimer);
      if (channel) {
        supabase.removeChannel(channel);
        channel = null;
      }
    };
  }, [router, pathname, onStatusChange]);

  return null;
}
