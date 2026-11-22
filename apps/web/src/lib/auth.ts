import { redirect } from "next/navigation";
import { readSupabaseEnv } from "@/lib/supabase/env";
import { createSupabase } from "@/lib/supabase/server";

export async function requireUser() {
  if (!readSupabaseEnv()) redirect("/");

  const supabase = await createSupabase();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (!userId) redirect("/login");

  // A valid JWT can outlive its account (for example after a database reset).
  // Without a profile, room writes would fail on the host/user foreign keys.
  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", userId)
    .maybeSingle();
  if (!profile) redirect("/login?stale=1");

  return { supabase, userId };
}
