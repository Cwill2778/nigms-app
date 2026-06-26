import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const MILESTONES = [25, 50, 75, 100];

function getSessionId() {
  let id = sessionStorage.getItem('nips_session_id');
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem('nips_session_id', id);
  }
  return id;
}

function useScrollDepthTracker() {
  const { pathname } = useLocation();
  const maxDepthRef = useRef(0);
  const milestonesRef = useRef([]);
  const flushedRef = useRef(false);

  useEffect(() => {
    if (pathname === '/admin') return;

    // Reset on route change
    maxDepthRef.current = 0;
    milestonesRef.current = [];
    flushedRef.current = false;

    function getScrollPercent() {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const docHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      if (docHeight === 0) return 100; // page fits in viewport
      return Math.round((scrollTop / docHeight) * 100);
    }

    function handleScroll() {
      const percent = getScrollPercent();
      if (percent > maxDepthRef.current) {
        maxDepthRef.current = percent;
      }

      MILESTONES.forEach((m) => {
        if (percent >= m && !milestonesRef.current.includes(m)) {
          milestonesRef.current.push(m);
        }
      });
    }

    function flush() {
      if (flushedRef.current) return;
      flushedRef.current = true;

      const depth = maxDepthRef.current;
      if (depth === 0) return; // no scroll activity

      supabase.from('scroll_depth').insert({
        page: pathname,
        max_depth: depth,
        milestones_hit: milestonesRef.current,
        session_id: getSessionId(),
      }).then();
    }

    // Throttled scroll listener
    let ticking = false;
    function onScroll() {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    // Also check initial viewport (page may already be 100% visible)
    handleScroll();

    // Flush on page unload or route change
    window.addEventListener('beforeunload', flush);

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('beforeunload', flush);
      flush(); // flush when navigating away via SPA
    };
  }, [pathname]);
}

export default useScrollDepthTracker;
