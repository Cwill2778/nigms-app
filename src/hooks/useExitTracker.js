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

function useExitTracker() {
  const { pathname } = useLocation();
  const enteredAtRef = useRef(Date.now());
  const flushedRef = useRef(false);

  useEffect(() => {
    enteredAtRef.current = Date.now();
    flushedRef.current = false;

    function flush(exitType) {
      if (flushedRef.current) return;
      flushedRef.current = true;

      const timeOnPage = Math.round((Date.now() - enteredAtRef.current) / 1000); // seconds

      supabase.from('exit_events').insert({
        page: pathname,
        time_on_page: timeOnPage,
        exit_type: exitType,
        session_id: getSessionId(),
      }).then();
    }

    // Tab close / navigate away from site
    function handleBeforeUnload() {
      flush('leave_site');
    }

    // Tab hidden (switch tab, minimize) — treat as potential exit
    function handleVisibilityChange() {
      if (document.visibilityState === 'hidden') {
        flush('tab_hidden');
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      // SPA navigation — user went to another page within the app
      flush('navigate');
    };
  }, [pathname]);
}

export default useExitTracker;
