import { redirect } from "next/navigation";
import { readSupabaseEnv } from "@/lib/supabase/env";
import { createSupabase } from "@/lib/supabase/server";

export async function requireUser() {
  if (!readSupabaseEnv()) redirect("/");

  const supabase = await createSupabase();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims?.sub) redirect("/login");

  return { supabase, userId: data.claims.sub };
}
