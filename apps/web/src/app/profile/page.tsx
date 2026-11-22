import Link from "next/link";
import { redirect } from "next/navigation";
import { ActionForm } from "@/components/action-form";
import { SiteHeader } from "@/components/site-header";
import { signOutAction } from "@/app/auth/actions";
import { requireUser } from "@/lib/auth";
import { examTracks } from "@/lib/profile";
import { fieldClass, labelClass } from "@/lib/ui";
import { updateProfileAction } from "./actions";

type ProfileRow = {
  full_name: string;
  username: string;
  exam_track: string;
  daily_target_minutes: number;
};

export default async function ProfilePage() {
  const { supabase, userId } = await requireUser();
  const { data } = await supabase
    .from("profiles")
    .select("full_name, username, exam_track, daily_target_minutes")
    .eq("id", userId)
    .maybeSingle();

  if (!data) redirect("/login?stale=1");
  const profile = data as ProfileRow;

  return (
    <>
      <SiteHeader
        right={
          <>
            <Link href="/rooms">Your rooms</Link>
            <ActionForm
              action={signOutAction}
              submit="Sign out"
              tone="secondary"
              fullWidth={false}
            />
          </>
        }
      />
      <main className="mx-auto max-w-md px-4 py-12 sm:px-6">
        <h1 className="font-display text-3xl font-semibold">Your profile</h1>
        <p className="mt-2 text-sm text-muted">
          Only you can open this page. Room members see your display name and
          the goals you share in that room — not this form.
        </p>

        <ActionForm
          action={updateProfileAction}
          submit="Save profile"
          className="mt-8 rounded-2xl border border-divider p-5"
        >
          <label className={labelClass}>
            Full name
            <input
              className={fieldClass}
              name="full_name"
              defaultValue={profile.full_name}
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
              defaultValue={profile.username}
              autoComplete="username"
              pattern="[A-Za-z0-9_]{3,24}"
              title="3–24 letters, numbers or underscores"
              required
            />
          </label>

          <label className={`${labelClass} mt-4`}>
            Exam track
            <select
              className={fieldClass}
              name="exam_track"
              defaultValue={profile.exam_track}
            >
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
              defaultValue={profile.daily_target_minutes}
              min={15}
              max={720}
              required
            />
          </label>
        </ActionForm>
      </main>
    </>
  );
}
