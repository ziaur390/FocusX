import Link from "next/link";
import { redirect } from "next/navigation";
import { ActionForm } from "@/components/action-form";
import { SiteHeader } from "@/components/site-header";
import { signInAction } from "@/app/auth/actions";
import { fieldClass, labelClass } from "@/lib/ui";
import { createSupabase } from "@/lib/supabase/server";
import { readSupabaseEnv } from "@/lib/supabase/env";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  if (readSupabaseEnv()) {
    const supabase = await createSupabase();
    const { data } = await supabase.auth.getClaims();
    if (data?.claims?.sub) redirect("/rooms");
  }

  return (
    <>
      <SiteHeader right={<Link href="/register">Create account</Link>} />
      <main className="mx-auto max-w-md px-4 py-12 sm:px-6">
        <h1 className="font-display text-3xl font-semibold">Welcome back</h1>
        <p className="mt-2 text-sm text-muted">
          Sign in to open your study rooms and check-ins.
        </p>

        <ActionForm action={signInAction} submit="Sign in" className="mt-8">
          <input type="hidden" name="next" value={next ?? "/rooms"} />
          <label className={labelClass}>
            Email
            <input
              className={fieldClass}
              type="email"
              name="email"
              autoComplete="email"
              required
            />
          </label>
          <label className={`${labelClass} mt-4`}>
            Password
            <input
              className={fieldClass}
              type="password"
              name="password"
              autoComplete="current-password"
              required
            />
          </label>
        </ActionForm>

        <p className="mt-6 text-sm text-muted">
          New to FocusX?{" "}
          <Link href="/register" className="font-semibold text-violet">
            Create an account
          </Link>
        </p>
      </main>
    </>
  );
}
