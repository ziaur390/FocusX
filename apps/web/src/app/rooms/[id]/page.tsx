import Link from "next/link";
import { ActionForm } from "@/components/action-form";
import { AutoRefresh } from "@/components/auto-refresh";
import { Countdown } from "@/components/countdown";
import { SiteHeader } from "@/components/site-header";
import { signOutAction } from "@/app/auth/actions";
import { requireUser } from "@/lib/auth";
import { canStartRound } from "@/lib/room";
import { loadRoomView } from "@/lib/rooms";
import { fieldClass, labelClass } from "@/lib/ui";
import { leaveRoundAction, saveGoalAction, startRoundAction } from "../actions";
import { RoundCard } from "./round-card";

export default async function RoomPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase, userId } = await requireUser();
  const view = await loadRoomView(supabase, id, userId);

  if (!view) {
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
        <main className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
          <h1 className="font-display text-3xl font-semibold">
            This room is private
          </h1>
          <p className="mt-3 text-muted">
            Only accepted room members can see goals, outcomes and responses.
            Ask the host for their invite link, or open one of your rooms.
          </p>
          <Link
            href="/rooms"
            className="mt-6 inline-flex rounded-xl bg-violet px-4 py-2.5 text-sm font-semibold text-white"
          >
            Back to your rooms
          </Link>
        </main>
      </>
    );
  }

  const { room, members, rounds, myMembership } = view;
  const latest = rounds[0] ?? null;
  const liveRound = latest?.phase === "studying" ? latest : null;
  const latestCheckin = latest?.phase === "checkin" ? latest : null;
  const readyCount = members.filter(
    (member) => member.is_ready && member.goal,
  ).length;
  const isHost = room.host_id === userId;
  const nextNumber = (latest?.number ?? 0) + 1;
  const startBlocker = canStartRound({
    isHost,
    readyCount,
    liveRound: Boolean(liveRound),
  });
  const hostName =
    members.find((member) => member.user_id === room.host_id)?.full_name ??
    "the host";
  const serverNow = new Date().toISOString();
  const watching = rounds.some((round) => round.phase !== "closed");

  const readyPanel = (
    <section className="mt-6 rounded-2xl border border-divider p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-display text-xl font-semibold">
          Next round · {room.duration_minutes} minutes
        </h2>
        <p className="text-sm text-muted">
          {readyCount} of {members.length} ready
        </p>
      </div>
      <p className="mt-1 text-sm text-muted">
        Each member sets one measurable goal and marks ready. The host starts
        the round; the server sets one shared deadline.
      </p>

      <div className="mt-5 grid gap-6 md:grid-cols-2">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted">
            Members
          </h3>
          <ul className="mt-2 divide-y divide-divider">
            {members.map((member) => (
              <li
                key={member.user_id}
                className="flex items-start justify-between gap-3 py-3"
              >
                <div>
                  <p className="font-semibold">
                    {member.full_name}
                    {member.user_id === userId ? " (you)" : ""}
                  </p>
                  <p className="mt-1 text-sm text-muted">
                    {member.goal ?? "No goal yet"}
                  </p>
                </div>
                <span
                  className={`inline-flex shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
                    member.is_ready && member.goal
                      ? "bg-mint text-ink"
                      : "bg-paper text-muted"
                  }`}
                >
                  {member.is_ready && member.goal ? "Ready" : "Not ready"}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl bg-paper p-4">
          <h3 className="font-semibold">Your goal</h3>
          <ActionForm
            action={saveGoalAction}
            submit={
              myMembership?.is_ready
                ? "Update goal and stay ready"
                : "Save goal and mark ready"
            }
            className="mt-2"
          >
            <input type="hidden" name="room_id" value={room.id} />
            <input type="hidden" name="intent" value="ready" />
            <label className={labelClass}>
              Measurable goal for round {nextNumber}
              <input
                className={fieldClass}
                name="goal"
                maxLength={200}
                defaultValue={myMembership?.goal ?? ""}
                placeholder="Solve 15 Physics MCQs and review three mistakes"
                required
              />
            </label>
          </ActionForm>

          {myMembership?.is_ready ? (
            <ActionForm
              action={saveGoalAction}
              submit="Not ready yet"
              tone="secondary"
              fullWidth={false}
            >
              <input type="hidden" name="room_id" value={room.id} />
              <input type="hidden" name="intent" value="not_ready" />
              <input
                type="hidden"
                name="goal"
                value={myMembership.goal ?? ""}
              />
            </ActionForm>
          ) : null}

          <div className="mt-5 border-t border-divider pt-4">
            <h4 className="text-sm font-semibold">Host controls</h4>
            {isHost ? (
              <ActionForm
                action={startRoundAction}
                submit={`Start round ${nextNumber}`}
                className="mt-1"
                disabled={startBlocker !== null}
                hint={
                  startBlocker ??
                  "The ready roster and goals are frozen when you start."
                }
              >
                <input type="hidden" name="room_id" value={room.id} />
              </ActionForm>
            ) : (
              <p className="mt-1 text-sm text-muted">
                Waiting for {hostName} to start round {nextNumber}.
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );

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
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-semibold sm:text-4xl">
              {room.subject}
            </h1>
            <p className="mt-1 text-sm text-muted">
              {room.duration_minutes}-minute round ·{" "}
              {room.current_round > 0
                ? `round ${room.current_round}`
                : "not started yet"}{" "}
              · {members.length} members
            </p>
          </div>
          <div className="rounded-xl bg-paper px-4 py-3 text-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">
              Invite
            </p>
            <p className="mt-1 font-semibold tracking-[0.2em]">
              {room.join_code.toUpperCase()}
            </p>
            <Link
              href={`/join/${room.join_code}`}
              className="mt-1 inline-block text-xs font-semibold text-violet"
            >
              Open invite link
            </Link>
          </div>
        </div>

        {liveRound ? (
          <section className="mt-6 rounded-2xl bg-ink p-6 text-white">
            <Countdown
              deadline={liveRound.deadline}
              checkinDeadline={liveRound.checkin_deadline}
              serverNow={serverNow}
            />
            <div className="mt-5 flex flex-wrap items-center gap-4">
              <p className="text-sm text-white/70">
                {liveRound.participants.length} member
                {liveRound.participants.length === 1 ? "" : "s"} in this round.
                Goals stay visible below.
              </p>
              {liveRound.me && !liveRound.me.left_at ? (
                <ActionForm
                  action={leaveRoundAction}
                  submit="Leave this session"
                  tone="secondary"
                  fullWidth={false}
                >
                  <input type="hidden" name="room_id" value={room.id} />
                  <input type="hidden" name="round_id" value={liveRound.id} />
                </ActionForm>
              ) : liveRound.me?.left_at ? (
                <p className="rounded-lg bg-white/10 px-3 py-2 text-sm text-mint">
                  You left this session. Your check-in stays open.
                </p>
              ) : null}
            </div>
          </section>
        ) : latestCheckin ? (
          <section className="mt-6 rounded-2xl bg-ink p-6 text-white">
            <Countdown
              deadline={latestCheckin.deadline}
              checkinDeadline={latestCheckin.checkin_deadline}
              serverNow={serverNow}
            />
            <p className="mt-4 text-sm text-white/70">
              Share what actually happened in the check-in below. Your peer can
              respond but cannot change your result.
            </p>
          </section>
        ) : (
          readyPanel
        )}

        <section className="mt-8">
          <h2 className="font-display text-xl font-semibold">Rounds</h2>
          {rounds.length === 0 ? (
            <p className="mt-3 rounded-xl bg-paper px-4 py-3 text-sm text-muted">
              No rounds yet. Set a goal, mark ready, and let the host start.
            </p>
          ) : (
            <div className="mt-4 space-y-4">
              {rounds.map((round) => (
                <RoundCard
                  key={round.id}
                  round={round}
                  userId={userId}
                  roomId={room.id}
                />
              ))}
            </div>
          )}
        </section>

        {latestCheckin ? readyPanel : null}

        {watching ? <AutoRefresh seconds={15} /> : null}
      </main>
    </>
  );
}
