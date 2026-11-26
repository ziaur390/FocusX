import Link from "next/link";
import { ActionForm } from "@/components/action-form";
import { SiteHeader } from "@/components/site-header";
import { signOutAction } from "@/app/auth/actions";
import { requireUser } from "@/lib/auth";
import { cardClass, fieldClass, labelClass } from "@/lib/ui";
import {
  createCircleAction,
  inviteFriendAction,
  respondCircleInviteAction,
} from "./actions";

type MyCircle = {
  circle_id: string;
  name: string;
  owner_id: string;
  member_count: number;
  created_at: string;
};

type CircleMember = {
  user_id: string;
  full_name: string;
  username: string;
  joined_at: string;
};

type CircleInvite = {
  invite_id: string;
  circle_id: string;
  circle_name: string;
  inviter_name: string;
  created_at: string;
};

type Friend = {
  user_id: string;
  full_name: string;
  username: string;
  status: string;
};

export default async function CirclesPage() {
  const { supabase, userId } = await requireUser();

  const [circlesResult, invitesResult, friendsResult] = await Promise.all([
    supabase.rpc("my_circles"),
    supabase.rpc("my_circle_invites"),
    supabase.rpc("my_friends"),
  ]);

  const circles = (circlesResult.data ?? []) as MyCircle[];
  const invites = (invitesResult.data ?? []) as CircleInvite[];
  const friends = ((friendsResult.data ?? []) as Friend[]).filter(
    (friend) => friend.status === "accepted",
  );

  const memberResults = await Promise.all(
    circles.map((circle) =>
      supabase.rpc("circle_members_view", {
        p_circle_id: circle.circle_id,
      }),
    ),
  );
  const membersByCircle = new Map(
    circles.map((circle, index) => [
      circle.circle_id,
      (memberResults[index].data ?? []) as CircleMember[],
    ]),
  );

  return (
    <>
      <SiteHeader
        right={
          <>
            <Link href="/rooms">Your rooms</Link>
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
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <h1 className="font-display text-3xl font-semibold sm:text-4xl">
          Circles
        </h1>
        <p className="mt-2 text-sm text-muted">
          A circle is a private group of accepted friends. Only its members can
          see it. Challenge rooms will use circles next.
        </p>

        {invites.length > 0 ? (
          <section className="mt-6">
            <h2 className="font-display text-xl font-semibold">
              Circle invitations
            </h2>
            <ul className="mt-3 space-y-2">
              {invites.map((invite) => (
                <li
                  key={invite.invite_id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-divider bg-white px-4 py-3"
                >
                  <div>
                    <p className="font-semibold">{invite.circle_name}</p>
                    <p className="text-sm text-muted">
                      Invited by {invite.inviter_name}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <ActionForm
                      action={respondCircleInviteAction}
                      submit="Accept"
                      fullWidth={false}
                    >
                      <input
                        type="hidden"
                        name="invite_id"
                        value={invite.invite_id}
                      />
                      <input type="hidden" name="decision" value="accept" />
                    </ActionForm>
                    <ActionForm
                      action={respondCircleInviteAction}
                      submit="Decline"
                      tone="secondary"
                      fullWidth={false}
                    >
                      <input
                        type="hidden"
                        name="invite_id"
                        value={invite.invite_id}
                      />
                      <input type="hidden" name="decision" value="decline" />
                    </ActionForm>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section className={`${cardClass} mt-6`}>
          <h2 className="font-display text-xl font-semibold">
            Create a circle
          </h2>
          <p className="mt-1 text-sm text-muted">
            Name it for your group. You can invite accepted friends after.
          </p>
          <ActionForm
            action={createCircleAction}
            submit="Create circle"
            className="mt-4"
          >
            <label className={labelClass}>
              Circle name
              <input
                className={fieldClass}
                name="name"
                placeholder="Physics squad"
                minLength={2}
                maxLength={60}
                required
              />
            </label>
          </ActionForm>
        </section>

        <section className="mt-6">
          <h2 className="font-display text-xl font-semibold">
            Your circles
          </h2>
          {circles.length === 0 ? (
            <p className="mt-3 rounded-xl bg-paper px-4 py-3 text-sm text-muted">
              No circles yet. Create one above, or accept a circle invitation.
            </p>
          ) : (
            <ul className="mt-3 space-y-4">
              {circles.map((circle) => {
                const members = membersByCircle.get(circle.circle_id) ?? [];
                const memberIds = new Set(
                  members.map((member) => member.user_id),
                );
                const eligibleFriends = friends.filter(
                  (friend) => !memberIds.has(friend.user_id),
                );
                const isOwner = circle.owner_id === userId;

                return (
                  <li
                    key={circle.circle_id}
                    className="rounded-2xl border border-divider bg-white p-5"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <h3 className="font-display text-lg font-semibold">
                          {circle.name}
                        </h3>
                        <p className="text-sm text-muted">
                          {circle.member_count} member
                          {circle.member_count === 1 ? "" : "s"} ·{" "}
                          {isOwner ? "you own this circle" : "private circle"}
                        </p>
                      </div>
                    </div>

                    <ul className="mt-3 space-y-1 text-sm">
                      {members.map((member) => (
                        <li key={member.user_id}>
                          {member.full_name}{" "}
                          <span className="text-muted">
                            @{member.username}
                          </span>
                          {member.user_id === circle.owner_id ? (
                            <span className="text-muted"> · owner</span>
                          ) : null}
                        </li>
                      ))}
                    </ul>

                    {isOwner ? (
                      eligibleFriends.length > 0 ? (
                        <ActionForm
                          action={inviteFriendAction}
                          submit="Invite"
                          className="mt-4"
                        >
                          <input
                            type="hidden"
                            name="circle_id"
                            value={circle.circle_id}
                          />
                          <label className={labelClass}>
                            Invite a friend
                            <select
                              className={fieldClass}
                              name="friend_id"
                              defaultValue=""
                              required
                            >
                              <option value="" disabled>
                                Choose an accepted friend
                              </option>
                              {eligibleFriends.map((friend) => (
                                <option
                                  key={friend.user_id}
                                  value={friend.user_id}
                                >
                                  {friend.full_name} (@{friend.username})
                                </option>
                              ))}
                            </select>
                          </label>
                        </ActionForm>
                      ) : (
                        <p className="mt-4 text-sm text-muted">
                          No accepted friends left to invite. Add one on the
                          Friends page.
                        </p>
                      )
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </main>
    </>
  );
}
