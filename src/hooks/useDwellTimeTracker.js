import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';

function getSessionId() {
  let id = sessionStorage.getItem('nips_session_id');
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem('nips_session_id', id);
  }
  return id;
}

/**
 * Tracks active dwell time — only counts time while the page is visible
 * and the user is actively engaged (not idle for > 30s).
 */
function useDwellTimeTracker() {
  const { pathname } = useLocation();
  const activeTimeRef = useRef(0); // ms of active time
  const lastTickRef = useRef(Date.now());
  const idleTimerRef = useRef(null);
  const isActiveRef = useRef(true);
  const isVisibleRef = useRef(true);
  const flushedRef = useRef(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (pathname === '/admin') return;

    activeTimeRef.current = 0;
    lastTickRef.current = Date.now();
    isActiveRef.current = true;
    isVisibleRef.current = true;
    flushedRef.current = false;

    const IDLE_THRESHOLD = 30000; // 30 seconds of no interaction = idle

    function tick() {
      if (isActiveRef.current && isVisibleRef.current) {
        const now = Date.now();
        activeTimeRef.current += now - lastTickRef.current;
        lastTickRef.current = now;
      } else {
        lastTickRef.current = Date.now();
      }
    }

    // Tick every second to accumulate active time
    intervalRef.current = setInterval(tick, 1000);

    function resetIdle() {
      if (!isActiveRef.current) {
        // Resuming from idle — reset the tick baseline
        lastTickRef.current = Date.now();
      }
      isActiveRef.current = true;
      clearTimeout(idleTimerRef.current);
      idleTimerRef.current = setTimeout(() => {
        tick(); // capture time up to now before going idle
        isActiveRef.current = false;
      }, IDLE_THRESHOLD);
    }

    function handleVisibility() {
      if (document.visibilityState === 'visible') {
        isVisibleRef.current = true;
        lastTickRef.current = Date.now();
        resetIdle();
      } else {
        tick(); // capture remaining active time
        isVisibleRef.current = false;
      }
    }

    function flush() {
      if (flushedRef.current) return;
      flushedRef.current = true;
      tick(); // final tick

      const dwellSeconds = Math.round(activeTimeRef.current / 1000);
      if (dwellSeconds < 1) return;

      supabase.from('dwell_time').insert({
        page: pathname,
        active_seconds: dwellSeconds,
        session_id: getSessionId(),
      }).then();
    }

    // Activity listeners
    const activityEvents = ['mousemove', 'keydown', 'scroll', 'touchstart', 'click'];
    activityEvents.forEach((evt) => document.addEventListener(evt, resetIdle, { passive: true }));
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('beforeunload', flush);

    // Start idle timer
    resetIdle();

    return () => {
      clearInterval(intervalRef.current);
      clearTimeout(idleTimerRef.current);
      activityEvents.forEach((evt) => document.removeEventListener(evt, resetIdle));
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('beforeunload', flush);
      flush(); // SPA navigation
    };
  }, [pathname]);
}

export default useDwellTimeTracker;
