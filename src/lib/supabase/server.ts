import "server-only";

import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

type CookieOptions = Parameters<Awaited<ReturnType<typeof cookies>>["set"]>[2];

let serviceClient: SupabaseClient | null = null;
let publicClient: SupabaseClient | null = null;

export function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  return {
    url,
    anonKey,
    serviceRoleKey,
    isConfigured: Boolean(url && anonKey),
    hasServiceRole: Boolean(url && serviceRoleKey),
  };
}

export async function createSupabaseServerClient() {
  const config = getSupabaseConfig();
  if (!config.url || !config.anonKey) return null;

  const cookieStore = await cookies();

  return createServerClient(config.url, config.anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }: { name: string; value: string; options: CookieOptions }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server Components cannot set cookies; Server Actions and Route Handlers can.
        }
      },
    },
  });
}

/**
 * Cookie-less anon client for public reads. Row-level security decides what it can see,
 * so public pages never depend on the service role key.
 */
export function getSupabasePublicClient() {
  const config = getSupabaseConfig();
  if (!config.url || !config.anonKey) return null;

  if (!publicClient) {
    publicClient = createClient(config.url, config.anonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }

  return publicClient;
}

/**
 * Supabase caps each REST response (1000 rows by default), so read large tables page by page.
 */
export async function selectAllRows<Row>(
  buildQuery: (from: number, to: number) => PromiseLike<{ data: Row[] | null; error: { message: string } | null }>,
  pageSize = 1000,
) {
  const rows: Row[] = [];
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await buildQuery(from, from + pageSize - 1);
    if (error) return { data: null, error };
    rows.push(...(data ?? []));
    if (!data || data.length < pageSize) return { data: rows, error: null };
  }
}

export function getSupabaseServiceClient() {
  const config = getSupabaseConfig();
  if (!config.url || !config.serviceRoleKey) return null;

  if (!serviceClient) {
    serviceClient = createClient(config.url, config.serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }

  return serviceClient;
}
