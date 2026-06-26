import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const UTM_PARAMS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];
const ATTRIBUTION_KEY = 'nips_attribution';

function getSessionId() {
  let id = sessionStorage.getItem('nips_session_id');
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem('nips_session_id', id);
  }
  return id;
}

/**
 * Captures attribution data on first visit of the session:
 * - UTM parameters from URL
 * - document.referrer
 * - Landing page
 * - Any other custom query params (fbclid, gclid, etc.)
 *
 * Stores in sessionStorage so it persists across SPA navigation,
 * and inserts once into Supabase per session.
 */
function useLeadAttribution() {
  const { pathname, search } = useLocation();

  useEffect(() => {
    if (pathname === '/admin') return;

    // Only capture once per session
    if (sessionStorage.getItem(ATTRIBUTION_KEY)) return;

    const params = new URLSearchParams(search);

    // Extract UTM params
    const utmData = {};
    UTM_PARAMS.forEach((key) => {
      const val = params.get(key);
      if (val) utmData[key] = val;
    });

    // Extract other marketing params (gclid, fbclid, msclkid, etc.)
    const extraParams = {};
    for (const [key, val] of params.entries()) {
      if (!UTM_PARAMS.includes(key)) {
        extraParams[key] = val;
      }
    }

    const referrer = document.referrer || null;
    const referrerDomain = referrer ? new URL(referrer).hostname : null;

    // Determine source channel
    let channel = 'direct';
    if (utmData.utm_medium) {
      channel = utmData.utm_medium;
    } else if (referrerDomain) {
      if (/google|bing|yahoo|duckduckgo|baidu/.test(referrerDomain)) {
        channel = 'organic_search';
      } else if (/facebook|instagram|twitter|linkedin|tiktok|pinterest/.test(referrerDomain)) {
        channel = 'social';
      } else {
        channel = 'referral';
      }
    } else if (extraParams.gclid) {
      channel = 'paid_search';
    } else if (extraParams.fbclid) {
      channel = 'paid_social';
    }

    const attribution = {
      landing_page: pathname,
      referrer: referrer,
      referrer_domain: referrerDomain,
      channel: channel,
      utm_source: utmData.utm_source || null,
      utm_medium: utmData.utm_medium || null,
      utm_campaign: utmData.utm_campaign || null,
      utm_term: utmData.utm_term || null,
      utm_content: utmData.utm_content || null,
      extra_params: Object.keys(extraParams).length > 0 ? extraParams : null,
      session_id: getSessionId(),
    };

    // Mark as captured
    sessionStorage.setItem(ATTRIBUTION_KEY, JSON.stringify(attribution));

    // Insert to Supabase
    supabase.from('lead_attribution').insert(attribution).then();
  }, []); // Only run once on initial mount
}

export default useLeadAttribution;
