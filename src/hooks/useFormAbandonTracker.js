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

function getFieldIdentifier(el) {
  return el.name || el.id || el.placeholder || el.getAttribute('aria-label') || el.type || 'unknown';
}

function useFormAbandonTracker() {
  const { pathname } = useLocation();
  const lastFieldRef = useRef(null);
  const formInteractedRef = useRef(false);
  const fieldsFilledRef = useRef(new Set());
  const totalFieldsRef = useRef(0);
  const flushedRef = useRef(false);

  useEffect(() => {
    lastFieldRef.current = null;
    formInteractedRef.current = false;
    fieldsFilledRef.current = new Set();
    totalFieldsRef.current = 0;
    flushedRef.current = false;

    function handleFocus(e) {
      const el = e.target;
      if (!['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName)) return;
      if (el.type === 'submit' || el.type === 'button' || el.type === 'hidden') return;

      formInteractedRef.current = true;
      lastFieldRef.current = getFieldIdentifier(el);

      // Count total form fields on first interaction
      const form = el.closest('form');
      if (form && totalFieldsRef.current === 0) {
        const fields = form.querySelectorAll('input:not([type="submit"]):not([type="button"]):not([type="hidden"]), textarea, select');
        totalFieldsRef.current = fields.length;
      }
    }

    function handleInput(e) {
      const el = e.target;
      if (!['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName)) return;
      if (el.value && el.value.trim()) {
        fieldsFilledRef.current.add(getFieldIdentifier(el));
      } else {
        fieldsFilledRef.current.delete(getFieldIdentifier(el));
      }
    }

    function handleSubmit() {
      // Form was submitted successfully — not an abandonment
      formInteractedRef.current = false;
      flushedRef.current = true;
    }

    function flush() {
      if (flushedRef.current) return;
      if (!formInteractedRef.current) return; // never touched a form
      flushedRef.current = true;

      const fieldsFilled = fieldsFilledRef.current.size;
      const totalFields = totalFieldsRef.current || 0;

      // Only track if they started but didn't finish
      if (fieldsFilled === 0 && !lastFieldRef.current) return;

      supabase.from('form_abandonment').insert({
        page: pathname,
        last_field: lastFieldRef.current,
        fields_filled: fieldsFilled,
        total_fields: totalFields,
        session_id: getSessionId(),
      }).then();
    }

    function handleBeforeUnload() {
      flush();
    }

    function handleVisibilityChange() {
      if (document.visibilityState === 'hidden') {
        flush();
      }
    }

    document.addEventListener('focusin', handleFocus, { capture: true });
    document.addEventListener('input', handleInput, { capture: true });
    document.addEventListener('submit', handleSubmit, { capture: true });
    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('focusin', handleFocus, { capture: true });
      document.removeEventListener('input', handleInput, { capture: true });
      document.removeEventListener('submit', handleSubmit, { capture: true });
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      flush(); // SPA navigation
    };
  }, [pathname]);
}

export default useFormAbandonTracker;
