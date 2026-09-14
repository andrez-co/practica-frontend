import { createClient } from '@supabase/supabase-js';

// Soporta nombres de variables tanto de Vite (VITE_) como de Next.js (NEXT_PUBLIC_) y Publishable Keys
const supabaseUrl =
  (import.meta.env.VITE_SUPABASE_URL as string) ||
  (import.meta.env.NEXT_PUBLIC_SUPABASE_URL as string) ||
  '';

const supabaseAnonKey =
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string) ||
  (import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string) ||
  (import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY as string) ||
  (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string) ||
  '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '⚠️ Supabase Auth Warning: No se encontraron las variables de entorno en el archivo .env. ' +
    'Asegúrate de definir VITE_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_URL y VITE_SUPABASE_ANON_KEY / NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.'
  );
}

/**
 * Instancia global singleton de Supabase Client para uso en el Frontend.
 * Maneja automáticamente la persistencia de token en localStorage y el refresco de sesión.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
