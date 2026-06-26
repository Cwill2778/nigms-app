import { supabase } from './supabase';

// Generate VAPID keys once and store them as env vars
// For now, we'll use a placeholder that you'll replace with real keys
const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || '';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return null;
  try {
    const registration = await navigator.serviceWorker.register('/sw.js');
    return registration;
  } catch (err) {
    console.error('SW registration failed:', err);
    return null;
  }
}

export async function subscribeToPush() {
  if (!('PushManager' in window) || !VAPID_PUBLIC_KEY) {
    console.warn('Push notifications not supported or VAPID key missing');
    return null;
  }

  const registration = await registerServiceWorker();
  if (!registration) return null;

  // Check existing subscription
  let subscription = await registration.pushManager.getSubscription();

  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });
  }

  // Store subscription in Supabase
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return subscription;

  const subJson = subscription.toJSON();
  await supabase.from('push_subscriptions').upsert({
    user_id: user.id,
    endpoint: subJson.endpoint,
    p256dh: subJson.keys.p256dh,
    auth_key: subJson.keys.auth,
  }, { onConflict: 'endpoint' });

  return subscription;
}

export async function unsubscribeFromPush() {
  const registration = await navigator.serviceWorker.getRegistration();
  if (!registration) return;

  const subscription = await registration.pushManager.getSubscription();
  if (subscription) {
    const endpoint = subscription.endpoint;
    await subscription.unsubscribe();
    await supabase.from('push_subscriptions').delete().eq('endpoint', endpoint);
  }
}

export async function isPushSubscribed() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return false;
  const registration = await navigator.serviceWorker.getRegistration();
  if (!registration) return false;
  const subscription = await registration.pushManager.getSubscription();
  return !!subscription;
}

/**
 * Send push notification to all admin subscribers.
 * Called from the Supabase realtime listener or after insert.
 * In production, this should be a Supabase Edge Function for security,
 * but for now we use a simple browser-triggered notification.
 */
export async function notifyAdminsLocally(title, body) {
  if (!('Notification' in window)) return;
  if (Notification.permission === 'granted') {
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration) {
      registration.showNotification(title, {
        body,
        icon: '/favicon.jpg',
        tag: 'nyp-notification',
        renotify: true,
        data: { url: '/admin' },
      });
    }
  }
}
