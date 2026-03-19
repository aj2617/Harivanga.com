export const hasSupabaseConfig = Boolean(
  import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY
);

export function isLocalDevelopmentHost() {
  if (typeof window === 'undefined') return false;

  return import.meta.env.DEV && (
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1'
  );
}

export function canUseDevelopmentFallbacks() {
  return isLocalDevelopmentHost();
}
