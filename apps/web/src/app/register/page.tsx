import Link from "next/link";
import { redirect } from "next/navigation";
import { ActionForm } from "@/components/action-form";
import { SiteHeader } from "@/components/site-header";
import { signUpAction } from "@/app/auth/actions";
import { examTracks } from "@/lib/profile";
import { fieldClass, labelClass } from "@/lib/ui";
import { createSupabase } from "@/lib/supabase/server";
import { readSupabaseEnv } from "@/lib/supabase/env";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; stale?: string }>;
}) {
  const { next, stale } = await searchParams;
  const staleSession = stale === "1";

  if (!staleSession && readSupabaseEnv()) {
    const supabase = await createSupabase();
    const { data } = await supabase.auth.getClaims();
    if (data?.claims?.sub) redirect("/rooms");
  }

  return (
    <>
      <SiteHeader right={<Link href="/login">Sign in</Link>} />
      <main className="mx-auto max-w-md px-4 py-12 sm:px-6">
        <h1 className="font-display text-3xl font-semibold">
          Create your account
        </h1>
        <p className="mt-2 text-sm text-muted">
          Your profile stays private. Room members only see the goals, outcomes
          and responses you share in that room.
        </p>

        {staleSession ? (
          <p
            role="alert"
            className="mt-4 rounded-xl bg-due-bg px-4 py-3 text-sm text-due"
          >
            Your previous session no longer matches an account. Create a new
            account, or sign in with an existing one.
          </p>
        ) : null}

        <ActionForm action={signUpAction} submit="Create account" className="mt-8">
          <input type="hidden" name="next" value={next ?? "/rooms"} />

          <label className={labelClass}>
            Full name
            <input
              className={fieldClass}
              name="full_name"
              autoComplete="name"
              minLength={2}
              maxLength={80}
              required
            />
          </label>

          <label className={`${labelClass} mt-4`}>
            Username
            <input
              className={fieldClass}
              name="username"
              autoComplete="username"
              pattern="[A-Za-z0-9_]{3,24}"
              title="3–24 letters, numbers or underscores"
              required
            />
          </label>

          <label className={`${labelClass} mt-4`}>
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
              autoComplete="new-password"
              minLength={8}
              required
            />
          </label>

          <label className={`${labelClass} mt-4`}>
            Exam track
            <select className={fieldClass} name="exam_track" defaultValue="MDCAT">
              {examTracks.map((track) => (
                <option key={track} value={track}>
                  {track}
                </option>
              ))}
            </select>
          </label>

          <label className={`${labelClass} mt-4`}>
            Daily study goal (minutes)
            <input
              className={fieldClass}
              type="number"
              name="daily_target_minutes"
              min={15}
              max={720}
              defaultValue={180}
              required
            />
          </label>
        </ActionForm>

        <p className="mt-6 text-sm text-muted">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-violet">
            Sign in
          </Link>
        </p>
      </main>
    </>
  );
}
