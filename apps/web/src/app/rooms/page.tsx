import Link from "next/link";
import { ActionForm } from "@/components/action-form";
import { SiteHeader } from "@/components/site-header";
import { signOutAction } from "@/app/auth/actions";
import { requireUser } from "@/lib/auth";
import {
  nextRoomAction,
  roundDurations,
  type NextAction,
  type NextActionKind,
} from "@/lib/room";
import { loadRoomView } from "@/lib/rooms";
import { cardClass, fieldClass, labelClass } from "@/lib/ui";
import { createRoomAction, joinRoomAction } from "./actions";

type RoomLink = {
  room_id: string;
  rooms: {
    id: string;
    subject: string;
    duration_minutes: number;
    current_round: number;
  } | null;
};

const actionTone: Record<NextActionKind, string> = {
  checkin: "bg-due-bg text-due",
  peer: "bg-lavender text-ink",
  live: "bg-lavender text-ink",
  ready: "bg-paper text-muted",
  waiting: "bg-paper text-muted",
  closed: "bg-paper text-muted",
};

const actionName: Record<NextActionKind, string> = {
  checkin: "Check-in",
  peer: "Peer response",
  live: "Live",
  ready: "Set up",
  waiting: "Waiting",
  closed: "Closed",
};

export default async function RoomsPage() {
  const { supabase, userId } = await requireUser();

  const { data } = await supabase
    .from("room_members")
    .select("room_id, rooms(id, subject, duration_minutes, current_round)")
    .eq("user_id", userId)
    .order("joined_at", { ascending: false });

  const rooms = ((data ?? []) as unknown as RoomLink[])
    .map((row) => row.rooms)
    .filter((room): room is NonNullable<RoomLink["rooms"]> => room !== null);

  const views = await Promise.all(
    rooms.map((room) => loadRoomView(supabase, room.id, userId)),
  );
  const actions = views
    .map((view) =>
      view
        ? nextRoomAction({
            room: view.room,
            myMembership: view.myMembership,
            latest: view.rounds[0] ?? null,
            isHost: view.room.host_id === userId,
            readyCount: view.members.filter(
              (member) => member.is_ready && member.goal,
            ).length,
          })
        : null,
    )
    .filter((action): action is NextAction => action !== null)
    .sort(
      (a, b) =>
        a.priority - b.priority || a.roomSubject.localeCompare(b.roomSubject),
    );

  return (
    <>
      <SiteHeader
        right={
          <>
            <span className="hidden text-muted sm:inline">Your rooms</span>
            <Link href="/friends">Friends</Link>
            <Link href="/history">History</Link>
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
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <h1 className="font-display text-3xl font-semibold sm:text-4xl">
          Your study rooms
        </h1>
        <p className="mt-2 text-sm text-muted">
          A room holds one shared round at a time. Each member owes a goal, a
          check-in, and a response to their peer.
        </p>

        <section className="mt-6">
          <h2 className="font-display text-xl font-semibold">
            Your next actions
          </h2>
          {actions.length === 0 ? (
            <p className="mt-3 rounded-xl bg-paper px-4 py-3 text-sm text-muted">
              Nothing due right now. Create a room or open one of yours below.
            </p>
          ) : (
            <ul className="mt-3 space-y-2">
              {actions.map((action) => (
                <li key={`${action.roomId}-${action.kind}`}>
                  <Link
                    href={`/rooms/${action.roomId}`}
                    className="flex items-start justify-between gap-4 rounded-2xl border border-divider bg-white px-4 py-3 transition-colors hover:border-violet hover:bg-paper"
                  >
                    <span>
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${actionTone[action.kind]}`}
                      >
                        {actionName[action.kind]}
                      </span>
                      <span className="mt-2 block font-semibold">
                        {action.label}
                      </span>
                      <span className="text-sm text-muted">
                        {action.roomSubject}
                        {action.roundNumber
                          ? ` · round ${action.roundNumber}`
                          : ""}
                      </span>
                    </span>
                    <span className="text-sm font-semibold text-violet">
                      Open
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="mt-8 grid gap-5 md:grid-cols-2">
          <section className={cardClass}>
            <h2 className="font-display text-xl font-semibold">Start a room</h2>
            <p className="mt-1 text-sm text-muted">
              Pick a subject and one round length. Share the invite link with
              one friend.
            </p>
            <ActionForm
              action={createRoomAction}
              submit="Create room"
              className="mt-4"
            >
              <label className={labelClass}>
                Subject
                <input
                  className={fieldClass}
                  name="subject"
                  placeholder="Physics · MCQs"
                  maxLength={80}
                  required
                />
              </label>
              <label className={`${labelClass} mt-4`}>
                Round length
                <select
                  className={fieldClass}
                  name="duration_minutes"
                  defaultValue={25}
                >
                  {roundDurations.map((minutes) => (
                    <option key={minutes} value={minutes}>
                      {minutes} minutes
                    </option>
                  ))}
                </select>
              </label>
            </ActionForm>
          </section>

          <section className={cardClass}>
            <h2 className="font-display text-xl font-semibold">
              Join with a code
            </h2>
            <p className="mt-1 text-sm text-muted">
              The invite link carries the code. You can also paste it here.
            </p>
            <ActionForm
              action={joinRoomAction}
              submit="Join room"
              className="mt-4"
            >
              <label className={labelClass}>
                Room code
                <input
                  className={`${fieldClass} tracking-[0.2em] uppercase`}
                  name="code"
                  maxLength={10}
                  placeholder="A1B2C3D4E5"
                  required
                />
              </label>
            </ActionForm>
          </section>
        </div>

        <section className="mt-10">
          <h2 className="font-display text-xl font-semibold">Rooms you are in</h2>
          {rooms.length === 0 ? (
            <p className="mt-3 rounded-xl bg-paper px-4 py-3 text-sm text-muted">
              No rooms yet. Create one, or ask a friend for their invite link.
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
              {rooms.map((room) => (
                <li key={room.id}>
                  <Link
                    href={`/rooms/${room.id}`}
                    className="flex items-center justify-between gap-4 rounded-2xl border border-divider bg-white px-4 py-4 transition-colors hover:border-violet hover:bg-paper"
                  >
                    <span>
                      <span className="block font-semibold">
                        {room.subject}
                      </span>
                      <span className="mt-0.5 block text-sm text-muted">
                        {room.duration_minutes}-minute round ·{" "}
                        {room.current_round > 0
                          ? `round ${room.current_round}`
                          : "not started"}
                      </span>
                    </span>
                    <span className="text-sm font-semibold text-violet">
                      Open
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </>
  );
}
