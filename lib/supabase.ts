/**
 * Clientes de Supabase.
 *
 * Dos clientes, dos propósitos, y NO son intercambiables:
 *
 *  - `admin()`  → service role. SOLO en servidor. Se salta RLS. Lo usan los
 *                 agentes para escribir el progreso del pipeline.
 *  - `browser()` → anon key. En el navegador. Respeta RLS. Lo usa el cockpit
 *                 para suscribirse a Realtime.
 *
 * Nunca importes `admin()` desde un componente cliente: filtrarías la service
 * role key al navegador.
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let _admin: SupabaseClient | null = null;
let _browser: SupabaseClient | null = null;

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `${name} no está configurada. Copia .env.example a .env.local y rellénala ` +
        `desde https://supabase.com/dashboard/project/_/settings/api`,
    );
  }
  return value;
}

/** Servidor. Se salta RLS. NO usar en componentes cliente. */
export function admin(): SupabaseClient {
  if (_admin) return _admin;
  _admin = createClient(
    required("NEXT_PUBLIC_SUPABASE_URL"),
    required("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
  return _admin;
}

/** Navegador. Respeta RLS. Es el que escucha Realtime. */
export function browser(): SupabaseClient {
  if (_browser) return _browser;
  _browser = createClient(
    required("NEXT_PUBLIC_SUPABASE_URL"),
    required("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  );
  return _browser;
}

/**
 * Scopes de Google necesarios para el acto CONSTRUIR.
 *
 * `drive.file` es deliberadamente restrictivo: da acceso solo a los archivos
 * que crea la propia app, no a todo el Drive del usuario. Pedir menos permisos
 * acelera la aprobación y es lo correcto de todos modos.
 */
export const GOOGLE_SCOPES = [
  "https://www.googleapis.com/auth/drive.file",
  "https://www.googleapis.com/auth/documents",
  "https://www.googleapis.com/auth/spreadsheets",
].join(" ");
