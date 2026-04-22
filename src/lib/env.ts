export function normalizeHttpUrl(value?: string) {
  const trimmed = (value ?? '').trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed.replace(/^\/+/, '')}`;
}

export const supabaseUrl = normalizeHttpUrl(import.meta.env.VITE_SUPABASE_URL);
export const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY ?? '').trim();

export const hasSupabaseConfig = Boolean(supabaseUrl && supabaseAnonKey);

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
