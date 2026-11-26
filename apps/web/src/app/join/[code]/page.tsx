import Link from "next/link";
import { ActionForm } from "@/components/action-form";
import { SiteHeader } from "@/components/site-header";
import { joinRoomAction } from "@/app/rooms/actions";
import { normalizeJoinCode } from "@/lib/room";
import { createSupabase } from "@/lib/supabase/server";
import { readSupabaseEnv } from "@/lib/supabase/env";

type Preview = {
  room_id: string;
  subject: string;
  duration_minutes: number;
  host_name: string;
  member_count: number;
  is_member: boolean;
  challenge: string | null;
};

export default async function JoinPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code: rawCode } = await params;
  const parsed = normalizeJoinCode(rawCode);

  let preview: Preview | null = null;
  let signedIn = false;
  const configured = Boolean(readSupabaseEnv());

  if (typeof parsed !== "string" && configured) {
    const supabase = await createSupabase();
    const { data } = await supabase.rpc("room_preview", {
      p_code: parsed.code,
    });
    preview = ((data ?? []) as Preview[])[0] ?? null;

    const { data: claims } = await supabase.auth.getClaims();
    signedIn = Boolean(claims?.claims?.sub);
  }

  const invalid = typeof parsed === "string" || !configured || preview === null;
  const room = preview;

  return (
    <>
      <SiteHeader
        right={
          signedIn ? (
            <Link href="/rooms">Your rooms</Link>
          ) : (
            <>
              <Link href="/login">Sign in</Link>
              <Link href="/register">Create account</Link>
            </>
          )
        }
      />
      <main className="mx-auto max-w-md px-4 py-12 sm:px-6">
        {invalid || !room || typeof parsed === "string" ? (
          <>
            <h1 className="font-display text-3xl font-semibold">
              Invite unavailable
            </h1>
            <p className="mt-3 text-muted">
              {!configured
                ? "Supabase is not configured for this environment."
                : "This invite link does not match an open room. Ask the host for a new link."}
            </p>
            <Link
              href="/rooms"
              className="mt-6 inline-flex rounded-xl bg-violet px-4 py-2.5 text-sm font-semibold text-white"
            >
              Go to your rooms
            </Link>
          </>
        ) : (
          <>
            <p className="text-sm font-semibold uppercase tracking-wide text-muted">
              Private room invite
            </p>
            <h1 className="mt-2 font-display text-3xl font-semibold">
              {room.subject}
            </h1>
            <p className="mt-2 text-muted">
              {room.host_name} invited you to a {room.duration_minutes}-minute
              accountability round with {room.member_count} member
              {room.member_count === 1 ? "" : "s"}.
            </p>
            {room.challenge ? (
              <p className="mt-4 rounded-xl bg-lavender px-4 py-3 text-sm text-ink">
                <span className="font-semibold">Challenge:</span>{" "}
                {room.challenge}
              </p>
            ) : null}

            <p className="mt-2 text-sm text-muted">
              Joining grants access to this room only: its goals, outcomes and
              peer responses. It does not add friends or a wider circle.
            </p>

            {!signedIn ? (
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href={`/login?next=/join/${parsed.code}`}
                  className="inline-flex rounded-xl bg-violet px-4 py-2.5 text-sm font-semibold text-white"
                >
                  Sign in to join
                </Link>
                <Link
                  href={`/register?next=/join/${parsed.code}`}
                  className="inline-flex rounded-xl border border-divider px-4 py-2.5 text-sm font-semibold"
                >
                  Create an account
                </Link>
              </div>
            ) : room.is_member ? (
              <Link
                href={`/rooms/${room.room_id}`}
                className="mt-6 inline-flex rounded-xl bg-violet px-4 py-2.5 text-sm font-semibold text-white"
              >
                Open room
              </Link>
            ) : (
              <ActionForm
                action={joinRoomAction}
                submit="Accept invite"
                className="mt-6"
              >
                <input type="hidden" name="code" value={parsed.code} />
              </ActionForm>
            )}
          </>
        )}
      </main>
    </>
  );
}
