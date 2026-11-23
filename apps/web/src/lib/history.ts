import type { SupabaseClient } from "@supabase/supabase-js";
import {
  phaseFor,
  type OutcomeStatus,
  type ResponseKind,
  type RoundPhase,
} from "@/lib/room";

type MembershipRow = {
  round_id: string;
  goal: string;
  left_at: string | null;
};

type RoundRow = {
  id: string;
  number: number;
  started_at: string;
  deadline: string;
  checkin_deadline: string;
  room_id: string;
};

type RoomRow = { id: string; subject: string };

type OutcomeRow = {
  round_id: string;
  status: OutcomeStatus;
  note: string | null;
};

type ResponseRow = {
  round_id: string;
  author_id: string;
  target_id: string;
  kind: ResponseKind;
  note: string | null;
};

export type HistoryEntry = {
  roundId: string;
  roomId: string;
  roomSubject: string;
  roundNumber: number;
  startedAt: string;
  phase: RoundPhase;
  goal: string;
  leftAt: string | null;
  outcome: { status: OutcomeStatus; note: string | null } | null;
  myResponse: {
    kind: ResponseKind;
    note: string | null;
    peerName: string;
  } | null;
  incomingResponse: {
    kind: ResponseKind;
    note: string | null;
    peerName: string;
  } | null;
};

export async function loadHistory(
  supabase: SupabaseClient,
  userId: string,
): Promise<HistoryEntry[]> {
  const { data: membershipData } = await supabase
    .from("round_members")
    .select("round_id, goal, left_at")
    .eq("user_id", userId);

  const memberships = (membershipData ?? []) as MembershipRow[];
  const roundIds = [...new Set(memberships.map((row) => row.round_id))];
  if (roundIds.length === 0) return [];

  const { data: roundData } = await supabase
    .from("rounds")
    .select(
      "id, number, started_at, deadline, checkin_deadline, room_id",
    )
    .in("id", roundIds);
  const rounds = (roundData ?? []) as RoundRow[];
  const roundById = new Map(rounds.map((round) => [round.id, round]));

  const roomIds = [...new Set(rounds.map((round) => round.room_id))];
  const { data: roomData } = await supabase
    .from("rooms")
    .select("id, subject")
    .in("id", roomIds);
  const rooms = (roomData ?? []) as RoomRow[];
  const roomById = new Map(rooms.map((room) => [room.id, room]));

  const [outcomeResult, responseResult, directoryResults] = await Promise.all([
    supabase
      .from("round_outcomes")
      .select("round_id, status, note")
      .eq("user_id", userId)
      .in("round_id", roundIds),
    supabase
      .from("round_responses")
      .select("round_id, author_id, target_id, kind, note")
      .in("round_id", roundIds),
    Promise.all(
      roomIds.map((roomId) =>
        supabase.rpc("room_member_directory", { target_room: roomId }),
      ),
    ),
  ]);

  const outcomes = (outcomeResult.data ?? []) as OutcomeRow[];
  const responses = (responseResult.data ?? []) as ResponseRow[];
  const names = new Map<string, string>(
    directoryResults.flatMap((result) =>
      ((result.data ?? []) as { user_id: string; full_name: string }[]).map(
        (row) => [row.user_id, row.full_name] as const,
      ),
    ),
  );

  const entries = memberships
    .map((membership): HistoryEntry | null => {
      const round = roundById.get(membership.round_id);
      if (!round) return null;
      const room = roomById.get(round.room_id);
      if (!room) return null;

      const outcome =
        outcomes.find((row) => row.round_id === round.id) ?? null;
      const outgoing =
        responses.find(
          (row) => row.round_id === round.id && row.author_id === userId,
        ) ?? null;
      const incoming =
        responses.find(
          (row) => row.round_id === round.id && row.target_id === userId,
        ) ?? null;

      return {
        roundId: round.id,
        roomId: room.id,
        roomSubject: room.subject,
        roundNumber: round.number,
        startedAt: round.started_at,
        phase: phaseFor(round.deadline, round.checkin_deadline),
        goal: membership.goal,
        leftAt: membership.left_at,
        outcome: outcome
          ? { status: outcome.status, note: outcome.note }
          : null,
        myResponse: outgoing
          ? {
              kind: outgoing.kind,
              note: outgoing.note,
              peerName: names.get(outgoing.target_id) ?? "your peer",
            }
          : null,
        incomingResponse: incoming
          ? {
              kind: incoming.kind,
              note: incoming.note,
              peerName: names.get(incoming.author_id) ?? "your peer",
            }
          : null,
      };
    })
    .filter((entry): entry is HistoryEntry => entry !== null)
    .sort((a, b) => Date.parse(b.startedAt) - Date.parse(a.startedAt))
    .slice(0, 50);

  return entries;
}
