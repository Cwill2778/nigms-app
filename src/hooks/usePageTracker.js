import { useEffect } from 'react';
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

function getDeviceInfo() {
  const ua = navigator.userAgent;
  let device = 'Desktop';
  if (/Mobi|Android/i.test(ua)) device = 'Mobile';
  else if (/Tablet|iPad/i.test(ua)) device = 'Tablet';

  let browser = 'Other';
  if (/Chrome/i.test(ua) && !/Edge|OPR/i.test(ua)) browser = 'Chrome';
  else if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) browser = 'Safari';
  else if (/Firefox/i.test(ua)) browser = 'Firefox';
  else if (/Edge/i.test(ua)) browser = 'Edge';
  else if (/OPR|Opera/i.test(ua)) browser = 'Opera';

  let os = 'Other';
  if (/Windows/i.test(ua)) os = 'Windows';
  else if (/Mac OS/i.test(ua)) os = 'macOS';
  else if (/Android/i.test(ua)) os = 'Android';
  else if (/iPhone|iPad|iPod/i.test(ua)) os = 'iOS';
  else if (/Linux/i.test(ua)) os = 'Linux';

  return { device, browser, os };
}

function usePageTracker() {
  const { pathname } = useLocation();

  useEffect(() => {
    if (pathname === '/admin') return;

    const { device, browser, os } = getDeviceInfo();

    supabase.from('page_visits').insert({
      page: pathname,
      referrer: document.referrer || null,
      user_agent: navigator.userAgent,
      session_id: getSessionId(),
      device_type: device,
      browser: browser,
      os: os,
      screen_width: window.screen.width,
    }).then();
  }, [pathname]);
}

export default usePageTracker;
