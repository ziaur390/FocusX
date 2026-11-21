import Link from "next/link";
import { ActionForm } from "@/components/action-form";
import { SiteHeader } from "@/components/site-header";
import { signOutAction } from "@/app/auth/actions";
import { requireUser } from "@/lib/auth";
import { roundDurations } from "@/lib/room";
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

  return (
    <>
      <SiteHeader
        right={
          <>
            <span className="hidden text-muted sm:inline">Your rooms</span>
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

        <div className="mt-6 grid gap-5 md:grid-cols-2">
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
