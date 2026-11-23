export const roundDurations = [10, 15, 25, 45, 60] as const;

export type RoundPhase = "studying" | "checkin" | "closed";
export type OutcomeStatus = "completed" | "partly" | "missed";
export type ResponseKind = "acknowledged" | "no_check_in";

export const outcomeLabels: Record<OutcomeStatus, string> = {
  completed: "Completed",
  partly: "Partly completed",
  missed: "Missed",
};

const outcomeStatuses = Object.keys(outcomeLabels) as OutcomeStatus[];

export function phaseFor(
  deadline: string,
  checkinDeadline: string,
  now = Date.now(),
): RoundPhase {
  if (now < Date.parse(deadline)) return "studying";
  if (now < Date.parse(checkinDeadline)) return "checkin";
  return "closed";
}

export function phaseLabel(phase: RoundPhase) {
  if (phase === "studying") return "Studying";
  if (phase === "checkin") return "Check-in open";
  return "Closed";
}

export function formatRemaining(milliseconds: number) {
  const total = Math.max(0, Math.ceil(milliseconds / 1000));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  const pad = (value: number) => String(value).padStart(2, "0");

  return hours > 0
    ? `${hours}:${pad(minutes)}:${pad(seconds)}`
    : `${pad(minutes)}:${pad(seconds)}`;
}

export function parseSubject(raw: unknown): { subject: string } | string {
  const subject = String(raw ?? "").trim();
  if (subject.length < 2 || subject.length > 80) {
    return "Enter a subject between 2 and 80 characters.";
  }
  return { subject };
}

export function parseDuration(raw: unknown): { duration: number } | string {
  const duration = Number(raw);
  if (!Number.isInteger(duration) || duration < 1 || duration > 180) {
    return "Choose a round length between 1 and 180 minutes.";
  }
  return { duration };
}

export function parseRoomForm(
  form: FormData,
): { subject: string; duration: number } | string {
  const subject = parseSubject(form.get("subject"));
  if (typeof subject === "string") return subject;

  const duration = parseDuration(form.get("duration_minutes"));
  if (typeof duration === "string") return duration;

  return { subject: subject.subject, duration: duration.duration };
}

export function parseGoal(raw: unknown): { goal: string } | string {
  const goal = String(raw ?? "").trim();
  if (goal.length < 3 || goal.length > 200) {
    return "Write a measurable goal between 3 and 200 characters.";
  }
  return { goal };
}

export function parseOutcome(
  form: FormData,
): { status: OutcomeStatus; note: string | null } | string {
  const status = String(form.get("status") ?? "") as OutcomeStatus;
  if (!outcomeStatuses.includes(status)) {
    return "Choose completed, partly completed or missed.";
  }

  const note = String(form.get("note") ?? "").trim();
  if (note.length > 280) {
    return "Keep the note under 280 characters.";
  }

  return { status, note: note || null };
}

export function parsePeerResponse(
  form: FormData,
): { kind: ResponseKind; note: string | null } | string {
  const kind = String(form.get("kind") ?? "") as ResponseKind;
  if (kind !== "acknowledged" && kind !== "no_check_in") {
    return "Choose a response.";
  }

  const note = String(form.get("note") ?? "").trim();
  if (note.length > 280) {
    return "Keep the note under 280 characters.";
  }

  return { kind, note: note || null };
}

export function normalizeJoinCode(raw: unknown): { code: string } | string {
  const code = String(raw ?? "")
    .trim()
    .toLowerCase();
  if (!/^[0-9a-f]{10}$/.test(code)) {
    return "Room codes are 10 letters and numbers. Check the link and try again.";
  }
  return { code };
}

export function canStartRound({
  isHost,
  readyCount,
  liveRound,
}: {
  isHost: boolean;
  readyCount: number;
  liveRound: boolean;
}) {
  if (!isHost) return "Only the host can start the round.";
  if (liveRound) return "This round is still running.";
  if (readyCount < 2) return "Two members need a goal and a ready state.";
  return null;
}

// Stable cyclic pairing. With two members each reviews the other; larger rooms
// get the next member by key until FX-006 adds round rotation and reassignment.
export function assignedPeer(userIds: string[], userId: string): string | null {
  const roster = [...userIds].sort();
  if (roster.length < 2) return null;

  const index = roster.indexOf(userId);
  if (index === -1) return null;

  return roster[(index + 1) % roster.length];
}

export type NextActionKind =
  | "checkin"
  | "peer"
  | "live"
  | "ready"
  | "waiting"
  | "closed";

export type NextAction = {
  roomId: string;
  roomSubject: string;
  kind: NextActionKind;
  label: string;
  roundNumber: number | null;
  priority: number;
};

type ActionMembership = { is_ready: boolean } | null;
type ActionParticipant = {
  user_id: string;
  full_name: string;
  outcome: unknown | null;
};
type ActionRound = {
  number: number;
  phase: RoundPhase;
  me: { user_id: string } | null;
  myOutcome: unknown | null;
  myResponse: unknown | null;
  peerId: string | null;
  participants: ActionParticipant[];
};

// One dashboard action for a room: the next thing this member owes.
export function nextRoomAction({
  room,
  myMembership,
  latest,
  isHost,
  readyCount,
}: {
  room: { id: string; subject: string };
  myMembership: ActionMembership;
  latest: ActionRound | null;
  isHost: boolean;
  readyCount: number;
}): NextAction | null {
  if (!myMembership) return null;

  const base = { roomId: room.id, roomSubject: room.subject };

  if (!latest) {
    if (!myMembership.is_ready) {
      return {
        ...base,
        kind: "ready",
        label: "Set your goal and mark ready",
        roundNumber: null,
        priority: 3,
      };
    }
    if (isHost && readyCount >= 2) {
      return {
        ...base,
        kind: "ready",
        label: "Start the round",
        roundNumber: null,
        priority: 2,
      };
    }
    return {
      ...base,
      kind: "waiting",
      label: isHost
        ? "Waiting for two ready members"
        : "Waiting for the host to start",
      roundNumber: null,
      priority: 4,
    };
  }

  const round = { ...base, roundNumber: latest.number };

  if (latest.phase === "studying") {
    if (!latest.me) return null;
    return {
      ...round,
      kind: "live",
      label: `Round ${latest.number} is running`,
      priority: 2,
    };
  }

  if (latest.phase === "checkin") {
    if (!latest.me) return null;
    if (!latest.myOutcome) {
      return {
        ...round,
        kind: "checkin",
        label: `Check in for round ${latest.number}`,
        priority: 0,
      };
    }
    if (!latest.myResponse) {
      const peer =
        latest.participants.find((person) => person.user_id === latest.peerId) ??
        null;
      if (peer?.outcome) {
        return {
          ...round,
          kind: "peer",
          label: `Respond to ${peer.full_name}`,
          priority: 1,
        };
      }
      return {
        ...round,
        kind: "waiting",
        label: `Waiting for ${peer?.full_name ?? "your peer"} to check in`,
        priority: 4,
      };
    }
    return null;
  }

  if (!latest.me) return null;

  if (!latest.myOutcome) {
    return {
      ...round,
      kind: "closed",
      label: `Round ${latest.number} closed without your check-in`,
      priority: 5,
    };
  }

  if (!latest.myResponse) {
    const peer =
      latest.participants.find((person) => person.user_id === latest.peerId) ??
      null;
    if (peer) {
      return {
        ...round,
        kind: "peer",
        label: peer.outcome
          ? `Respond to ${peer.full_name}`
          : `Record no check-in for ${peer.full_name}`,
        priority: 1,
      };
    }
  }

  return null;
}
