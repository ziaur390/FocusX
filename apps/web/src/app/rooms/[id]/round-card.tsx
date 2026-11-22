import { ActionForm } from "@/components/action-form";
import {
  outcomeLabels,
  phaseLabel,
  type OutcomeStatus,
} from "@/lib/room";
import type { RoundView } from "@/lib/rooms";
import { fieldClass, labelClass } from "@/lib/ui";
import { respondToPeerAction, submitOutcomeAction } from "../actions";

const statuses = Object.keys(outcomeLabels) as OutcomeStatus[];

const badgeBase =
  "inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-xs font-semibold";

function OutcomeBadge({
  round,
  outcome,
  leftAt,
}: {
  round: RoundView;
  outcome: RoundView["participants"][number]["outcome"];
  leftAt: string | null;
}) {
  if (outcome) {
    const tone =
      outcome.status === "completed"
        ? "bg-mint text-ink"
        : outcome.status === "partly"
          ? "bg-lavender text-ink"
          : "border border-divider bg-white text-muted";
    return (
      <span className={`${badgeBase} ${tone}`}>
        {outcomeLabels[outcome.status]}
      </span>
    );
  }

  if (round.phase === "studying") {
    return (
      <span className={`${badgeBase} bg-paper text-muted`}>
        {leftAt ? "Left session" : "Studying"}
      </span>
    );
  }

  if (round.phase === "checkin") {
    return (
      <span className={`${badgeBase} bg-due-bg text-due`}>
        {leftAt ? "Left · awaiting check-in" : "Awaiting check-in"}
      </span>
    );
  }

  return (
    <span className={`${badgeBase} bg-paper text-muted`}>No check-in</span>
  );
}

export function RoundCard({
  round,
  userId,
  roomId,
}: {
  round: RoundView;
  userId: string;
  roomId: string;
}) {
  const peer =
    round.participants.find((person) => person.user_id === round.peerId) ?? null;
  const canCheckIn = round.phase === "checkin" && round.me !== null;
  const isLive = round.phase === "studying";

  return (
    <section
      className="rounded-2xl border border-divider bg-white p-5"
      aria-labelledby={`round-${round.id}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3
          id={`round-${round.id}`}
          className="font-display text-lg font-semibold"
        >
          Round {round.number}
        </h3>
        <span className={`${badgeBase} bg-paper text-muted`}>
          {phaseLabel(round.phase)}
        </span>
      </div>

      <ul className="mt-3 divide-y divide-divider">
        {round.participants.map((person) => (
          <li key={person.user_id} className="py-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold">
                  {person.full_name}
                  {person.user_id === userId ? " (you)" : ""}
                </p>
                <p className="mt-1 text-sm text-muted">{person.goal}</p>
                {person.left_at ? (
                  <p className="mt-1 text-xs font-medium text-muted">
                    Left this session · check-in stays open
                  </p>
                ) : null}
                {person.outcome?.note ? (
                  <p className="mt-2 text-sm text-ink">
                    “{person.outcome.note}”
                  </p>
                ) : null}
                {person.response ? (
                  <p className="mt-2 rounded-lg bg-mint/60 px-3 py-2 text-sm text-ink">
                    {person.response.kind === "acknowledged"
                      ? "Peer acknowledged this result"
                      : "Peer recorded no check-in"}
                    {person.response.note ? ` — ${person.response.note}` : ""}
                  </p>
                ) : null}
              </div>
              <OutcomeBadge
                round={round}
                outcome={person.outcome}
                leftAt={person.left_at}
              />
            </div>
          </li>
        ))}
      </ul>

      {isLive ? (
        <p className="mt-3 text-sm text-muted">
          Check-in opens when the shared timer ends. Goals and the ready roster
          are frozen for this round.
        </p>
      ) : null}

      {canCheckIn ? (
        <div className="mt-4 rounded-xl bg-paper p-4">
          <h4 className="font-semibold">Your check-in</h4>
          <p className="mt-1 text-sm text-muted">
            {round.myOutcome
              ? "You can update your own outcome until the window closes. Nobody else can change it."
              : "Report what actually happened. A missing result stays visible to the room."}
          </p>
          <ActionForm
            action={submitOutcomeAction}
            submit={round.myOutcome ? "Update check-in" : "Share check-in"}
            className="mt-3"
          >
            <input type="hidden" name="room_id" value={roomId} />
            <input type="hidden" name="round_id" value={round.id} />
            <fieldset>
              <legend className="text-sm font-semibold">Outcome</legend>
              <div className="mt-2 grid gap-2 sm:grid-cols-3">
                {statuses.map((status) => (
                  <label
                    key={status}
                    className="flex cursor-pointer items-center gap-2 rounded-lg border border-divider bg-white px-3 py-2 text-sm has-[:checked]:border-violet has-[:checked]:bg-lavender"
                  >
                    <input
                      type="radio"
                      name="status"
                      value={status}
                      required
                      defaultChecked={round.myOutcome?.status === status}
                    />
                    {outcomeLabels[status]}
                  </label>
                ))}
              </div>
            </fieldset>
            <label className={`${labelClass} mt-3`}>
              Short note (optional)
              <input
                className={fieldClass}
                name="note"
                maxLength={280}
                defaultValue={round.myOutcome?.note ?? ""}
                placeholder="What moved, and what still needs work"
              />
            </label>
          </ActionForm>
        </div>
      ) : null}

      {round.me && round.phase === "closed" && !round.myOutcome ? (
        <p className="mt-3 rounded-lg bg-paper px-3 py-2 text-sm text-muted">
          The check-in window closed without your result. It stays visible as
          missing.
        </p>
      ) : null}

      {peer && !isLive ? (
        <div className="mt-4 rounded-xl bg-paper p-4">
          <h4 className="font-semibold">Respond to {peer.full_name}</h4>

          {round.myResponse ? (
            <p className="mt-2 rounded-lg bg-mint/60 px-3 py-2 text-sm text-ink">
              {round.myResponse.kind === "acknowledged"
                ? "You acknowledged their result"
                : "You recorded no check-in"}
              {round.myResponse.note ? `: “${round.myResponse.note}”` : "."}
            </p>
          ) : peer.outcome ? (
            <>
              <p className="mt-1 text-sm text-muted">
                Only {peer.full_name} can change their outcome. Your response
                acknowledges their check-in.
              </p>
              <ActionForm
                action={respondToPeerAction}
                submit={`Acknowledge ${peer.full_name}`}
                className="mt-3"
              >
                <input type="hidden" name="room_id" value={roomId} />
                <input type="hidden" name="round_id" value={round.id} />
                <input type="hidden" name="target_id" value={peer.user_id} />
                <input type="hidden" name="kind" value="acknowledged" />
                <label className={labelClass}>
                  Encouragement or next step (optional)
                  <input className={fieldClass} name="note" maxLength={280} />
                </label>
              </ActionForm>
            </>
          ) : canCheckIn ? (
            <p className="mt-1 text-sm text-muted">
              Waiting for {peer.full_name}&apos;s check-in. You can respond once
              it arrives, or record no check-in after the window closes.
            </p>
          ) : round.phase === "closed" ? (
            <>
              <p className="mt-1 text-sm text-muted">
                {peer.full_name} never checked in. Recording this closes your
                own accountability task without changing their result.
              </p>
              <ActionForm
                action={respondToPeerAction}
                submit="Record no check-in"
                tone="secondary"
                className="mt-3"
              >
                <input type="hidden" name="room_id" value={roomId} />
                <input type="hidden" name="round_id" value={round.id} />
                <input type="hidden" name="target_id" value={peer.user_id} />
                <input type="hidden" name="kind" value="no_check_in" />
              </ActionForm>
            </>
          ) : (
            <p className="mt-1 text-sm text-muted">
              This round is still running.
            </p>
          )}
        </div>
      ) : null}
    </section>
  );
}
