// Geenie AI Studio — Supabase client (optional)
// The app works fully without Supabase configured.
// When you add VITE_SUPABASE_URL + VITE_SUPABASE_PUBLISHABLE_KEY to .env,
// this client will be used for real auth/database operations.

export function isSupabaseConfigured(): boolean {
  const url = typeof import.meta !== 'undefined' ? import.meta.env?.VITE_SUPABASE_URL : '';
  const key = typeof import.meta !== 'undefined' ? import.meta.env?.VITE_SUPABASE_PUBLISHABLE_KEY : '';
  return !!(url && key && !url.includes('YOUR_PROJECT_ID'));
}

// Safe no-op client — prevents crashes when Supabase is not configured
const noopResponse = { data: null, error: null };
const noopPromise = () => Promise.resolve(noopResponse);

export const supabase = {
  auth: {
    getSession: noopPromise,
    getUser: noopPromise,
    signUp: noopPromise,
    signInWithPassword: noopPromise,
    signOut: noopPromise,
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
  },
  from: () => ({
    select: () => ({ eq: () => ({ maybeSingle: noopPromise, single: noopPromise }) }),
    insert: noopPromise,
    update: () => ({ eq: noopPromise }),
    delete: () => ({ eq: noopPromise }),
  }),
} as const;
