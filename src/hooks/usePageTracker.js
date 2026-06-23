import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';

function usePageTracker() {
  const { pathname } = useLocation();

  useEffect(() => {
    supabase.from('page_visits').insert({
      page: pathname,
      referrer: document.referrer || null,
      user_agent: navigator.userAgent,
    }).then(); // fire and forget
  }, [pathname]);
}

export default usePageTracker;
