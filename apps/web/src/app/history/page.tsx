import Link from "next/link";
import { ActionForm } from "@/components/action-form";
import { SiteHeader } from "@/components/site-header";
import { signOutAction } from "@/app/auth/actions";
import { requireUser } from "@/lib/auth";
import { loadHistory, type HistoryEntry } from "@/lib/history";
import { outcomeLabels } from "@/lib/room";

const dateFormat = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

function statusFor(entry: HistoryEntry) {
  if (entry.outcome) {
    const tone =
      entry.outcome.status === "completed"
        ? "bg-mint text-ink"
        : entry.outcome.status === "partly"
          ? "bg-lavender text-ink"
          : "border border-divider bg-white text-muted";
    return { label: outcomeLabels[entry.outcome.status], tone };
  }

  if (entry.phase === "studying") {
    return { label: "In progress", tone: "bg-lavender text-ink" };
  }
  if (entry.phase === "checkin") {
    return { label: "Awaiting your check-in", tone: "bg-due-bg text-due" };
  }

  return { label: "No check-in", tone: "bg-paper text-muted" };
}

export default async function HistoryPage() {
  const { supabase, userId } = await requireUser();
  const entries = await loadHistory(supabase, userId);

  return (
    <>
      <SiteHeader
        right={
          <>
            <Link href="/rooms">Your rooms</Link>
            <Link href="/profile">Profile</Link>
            <ActionForm
              action={signOutAction}
              submit="Sign out"
              tone="secondary"
              fullWidth={false}
            />
          </>
        }
      />
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <h1 className="font-display text-3xl font-semibold sm:text-4xl">
          Your history
        </h1>
        <p className="mt-2 text-sm text-muted">
          Private to you. Your goals, results and peer responses from every
          round you joined. Nobody else can open this page.
        </p>

        {entries.length === 0 ? (
          <p className="mt-6 rounded-xl bg-paper px-4 py-3 text-sm text-muted">
            No rounds yet. Your first round appears here after you set a goal
            and the host starts it.
          </p>
        ) : (
          <ol className="mt-6 space-y-4">
            {entries.map((entry) => {
              const status = statusFor(entry);

              return (
                <li
                  key={entry.roundId}
                  className="rounded-2xl border border-divider bg-white p-5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                        {entry.roomSubject}
                      </p>
                      <h2 className="font-display text-lg font-semibold">
                        Round {entry.roundNumber}
                      </h2>
                      <p className="text-xs text-muted">
                        {dateFormat.format(new Date(entry.startedAt))}
                      </p>
                    </div>
                    <span
                      className={`inline-flex shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${status.tone}`}
                    >
                      {status.label}
                    </span>
                  </div>

                  <p className="mt-3 text-sm">
                    <span className="font-semibold">Goal:</span> {entry.goal}
                  </p>
                  {entry.leftAt ? (
                    <p className="mt-1 text-xs text-muted">
                      You left this session; your check-in stayed open.
                    </p>
                  ) : null}
                  {entry.outcome?.note ? (
                    <p className="mt-2 text-sm text-ink">
                      “{entry.outcome.note}”
                    </p>
                  ) : null}

                  {entry.myResponse ? (
                    <p className="mt-3 rounded-lg bg-lavender px-3 py-2 text-sm text-ink">
                      {entry.myResponse.kind === "acknowledged"
                        ? `You acknowledged ${entry.myResponse.peerName}`
                        : `You recorded no check-in for ${entry.myResponse.peerName}`}
                      {entry.myResponse.note
                        ? `: “${entry.myResponse.note}”`
                        : "."}
                    </p>
                  ) : null}

                  {entry.incomingResponse ? (
                    <p className="mt-2 rounded-lg bg-mint/60 px-3 py-2 text-sm text-ink">
                      {entry.incomingResponse.kind === "acknowledged"
                        ? `${entry.incomingResponse.peerName} acknowledged your result`
                        : `${entry.incomingResponse.peerName} recorded no check-in`}
                      {entry.incomingResponse.note
                        ? `: “${entry.incomingResponse.note}”`
                        : "."}
                    </p>
                  ) : null}

                  <Link
                    href={`/rooms/${entry.roomId}`}
                    className="mt-3 inline-block text-sm font-semibold text-violet"
                  >
                    Open room
                  </Link>
                </li>
              );
            })}
          </ol>
        )}
      </main>
    </>
  );
}
