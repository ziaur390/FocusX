import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { readSupabaseEnv } from "./env";

export async function createSupabase() {
  const env = readSupabaseEnv();
  if (!env) throw new Error("FocusX Supabase environment is missing.");

  const cookieStore = await cookies();

  return createServerClient(env.url, env.publishableKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // The proxy persists refreshed cookies for Server Components.
        }
      },
    },
  });
}
