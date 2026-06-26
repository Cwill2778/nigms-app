import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';

// Only track clicks on interactive/meaningful elements
const TRACKED_TAGS = ['A', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA'];

function getSessionId() {
  let id = sessionStorage.getItem('nips_session_id');
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem('nips_session_id', id);
  }
  return id;
}

function getClickTarget(event) {
  // Walk up the DOM to find the nearest trackable element
  let el = event.target;
  while (el && el !== document.body) {
    if (TRACKED_TAGS.includes(el.tagName)) return el;
    // Also track elements with explicit data-track attribute
    if (el.dataset && el.dataset.track) return el;
    el = el.parentElement;
  }
  return null;
}

function useClickTracker() {
  const { pathname } = useLocation();

  useEffect(() => {
    if (pathname === '/admin') return;

    function handleClick(event) {
      const el = getClickTarget(event);
      if (!el) return;

      const text = (el.innerText || el.value || '').substring(0, 100).trim();
      const href = el.getAttribute('href') || el.closest('a')?.getAttribute('href') || null;

      supabase.from('click_events').insert({
        page: pathname,
        element_tag: el.dataset?.track || el.tagName.toLowerCase(),
        element_text: text || null,
        element_href: href,
        element_id: el.id || null,
        element_class: el.className ? String(el.className).substring(0, 200) : null,
        session_id: getSessionId(),
      }).then(); // fire and forget
    }

    document.addEventListener('click', handleClick, { capture: true });
    return () => document.removeEventListener('click', handleClick, { capture: true });
  }, [pathname]);
}

export default useClickTracker;
