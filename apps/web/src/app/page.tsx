import Link from "next/link";
import { redirect } from "next/navigation";
import { FocusxMark } from "@/components/focusx-mark";
import { createSupabase } from "@/lib/supabase/server";
import { readSupabaseEnv } from "@/lib/supabase/env";

export default async function HomePage() {
  if (readSupabaseEnv()) {
    const supabase = await createSupabase();
    const { data } = await supabase.auth.getClaims();
    if (data?.claims?.sub) redirect("/rooms");
  }

  const configured = Boolean(readSupabaseEnv());

  return (
    <main className="mx-auto flex min-h-dvh max-w-3xl flex-col justify-center px-4 py-16 sm:px-6">
      <div className="flex items-center gap-3">
        <FocusxMark size={44} />
        <span className="font-display text-2xl font-semibold tracking-tight">
          FocusX
        </span>
      </div>

      <h1 className="mt-10 font-display text-4xl font-semibold leading-tight sm:text-5xl">
        Study together.
        <br />
        Follow through.
      </h1>
      <p className="mt-4 max-w-xl text-lg text-muted">
        A private room for two friends. Each person sets a goal, shares one
        timer, reports an honest result, and acknowledges the other.
      </p>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/register"
          className="inline-flex items-center justify-center rounded-xl bg-violet px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-violet-hover"
        >
          Create an account
        </Link>
        <Link
          href="/login"
          className="inline-flex items-center justify-center rounded-xl border border-divider px-5 py-3 text-sm font-semibold text-ink transition-colors hover:bg-paper"
        >
          Sign in
        </Link>
      </div>

      {!configured ? (
        <p className="mt-8 rounded-xl bg-due-bg px-4 py-3 text-sm text-due">
          Supabase is not configured. Copy <code>apps/web/.env.example</code> to{" "}
          <code>apps/web/.env.local</code> and add the development project URL
          and publishable key.
        </p>
      ) : null}
    </main>
  );
}
