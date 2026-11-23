import Link from "next/link";
import { ActionForm } from "@/components/action-form";
import { SiteHeader } from "@/components/site-header";
import { signOutAction } from "@/app/auth/actions";
import { requireUser } from "@/lib/auth";
import { cardClass, fieldClass, labelClass } from "@/lib/ui";
import { respondFriendRequestAction, sendFriendRequestAction } from "./actions";

type FriendRow = {
  request_id: string;
  user_id: string;
  full_name: string;
  username: string;
  direction: "incoming" | "outgoing";
  status: "pending" | "accepted" | "declined";
  created_at: string;
};

export default async function FriendsPage() {
  const { supabase } = await requireUser();
  const { data } = await supabase.rpc("my_friends");
  const rows = (data ?? []) as FriendRow[];

  const incoming = rows.filter(
    (row) => row.status === "pending" && row.direction === "incoming",
  );
  const outgoing = rows.filter(
    (row) => row.status === "pending" && row.direction === "outgoing",
  );
  const friends = rows.filter((row) => row.status === "accepted");

  return (
    <>
      <SiteHeader
        right={
          <>
            <Link href="/rooms">Your rooms</Link>
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
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <h1 className="font-display text-3xl font-semibold sm:text-4xl">
          Friends
        </h1>
        <p className="mt-2 text-sm text-muted">
          Requests are private. Only the two accounts involved can see them.
          Circles and challenge rooms come next.
        </p>

        <section className={`${cardClass} mt-6`}>
          <h2 className="font-display text-xl font-semibold">Add a friend</h2>
          <p className="mt-1 text-sm text-muted">
            Ask for their FocusX username, not their email.
          </p>
          <ActionForm
            action={sendFriendRequestAction}
            submit="Send request"
            className="mt-4"
          >
            <label className={labelClass}>
              Username
              <input
                className={fieldClass}
                name="username"
                placeholder="bob"
                pattern="[A-Za-z0-9_]{3,24}"
                title="3–24 letters, numbers or underscores"
                autoComplete="off"
                required
              />
            </label>
          </ActionForm>
        </section>

        {incoming.length > 0 ? (
          <section className="mt-6">
            <h2 className="font-display text-xl font-semibold">
              Requests for you
            </h2>
            <ul className="mt-3 space-y-2">
              {incoming.map((request) => (
                <li
                  key={request.request_id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-divider bg-white px-4 py-3"
                >
                  <div>
                    <p className="font-semibold">{request.full_name}</p>
                    <p className="text-sm text-muted">@{request.username}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <ActionForm
                      action={respondFriendRequestAction}
                      submit="Accept"
                      fullWidth={false}
                    >
                      <input
                        type="hidden"
                        name="request_id"
                        value={request.request_id}
                      />
                      <input type="hidden" name="decision" value="accept" />
                    </ActionForm>
                    <ActionForm
                      action={respondFriendRequestAction}
                      submit="Decline"
                      tone="secondary"
                      fullWidth={false}
                    >
                      <input
                        type="hidden"
                        name="request_id"
                        value={request.request_id}
                      />
                      <input type="hidden" name="decision" value="decline" />
                    </ActionForm>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section className="mt-6">
          <h2 className="font-display text-xl font-semibold">Your friends</h2>
          {friends.length === 0 ? (
            <p className="mt-3 rounded-xl bg-paper px-4 py-3 text-sm text-muted">
              No friends yet. Send a request above, or accept one.
            </p>
          ) : (
            <ul className="mt-3 space-y-2">
              {friends.map((friend) => (
                <li
                  key={friend.request_id}
                  className="rounded-xl border border-divider bg-white px-4 py-3"
                >
                  <p className="font-semibold">{friend.full_name}</p>
                  <p className="text-sm text-muted">@{friend.username}</p>
                </li>
              ))}
            </ul>
          )}
        </section>

        {outgoing.length > 0 ? (
          <section className="mt-6">
            <h2 className="font-display text-xl font-semibold">
              Sent requests
            </h2>
            <ul className="mt-3 space-y-2">
              {outgoing.map((request) => (
                <li
                  key={request.request_id}
                  className="rounded-xl bg-paper px-4 py-3 text-sm text-muted"
                >
                  Waiting for {request.full_name} (@{request.username}) to
                  answer.
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </main>
    </>
  );
}
