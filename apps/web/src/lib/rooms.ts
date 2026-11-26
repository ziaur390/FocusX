import type { SupabaseClient } from "@supabase/supabase-js";
import {
  assignedPeer,
  phaseFor,
  type OutcomeStatus,
  type ResponseKind,
  type RoundPhase,
} from "@/lib/room";

export type RoomRecord = {
  id: string;
  host_id: string;
  subject: string;
  duration_minutes: number;
  join_code: string;
  current_round: number;
  challenge: string | null;
};

type RoomMemberRow = {
  user_id: string;
  goal: string | null;
  is_ready: boolean;
};

type RoundRow = {
  id: string;
  number: number;
  started_at: string;
  deadline: string;
  checkin_deadline: string;
};

type RoundMemberRow = {
  round_id: string;
  user_id: string;
  goal: string;
  left_at: string | null;
};

type OutcomeRow = {
  round_id: string;
  user_id: string;
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

export type OutcomeView = {
  status: OutcomeStatus;
  note: string | null;
};

export type ResponseView = {
  author_id: string;
  kind: ResponseKind;
  note: string | null;
};

export type RoomMemberView = {
  user_id: string;
  full_name: string;
  goal: string | null;
  is_ready: boolean;
};

export type RoundParticipantView = {
  user_id: string;
  full_name: string;
  goal: string;
  left_at: string | null;
  outcome: OutcomeView | null;
  response: ResponseView | null;
};

export type RoundView = {
  id: string;
  number: number;
  deadline: string;
  checkin_deadline: string;
  phase: RoundPhase;
  participants: RoundParticipantView[];
  me: RoundParticipantView | null;
  myOutcome: OutcomeView | null;
  myResponse: ResponseView | null;
  peerId: string | null;
};

export type RoomView = {
  room: RoomRecord;
  members: RoomMemberView[];
  rounds: RoundView[];
  myMembership: RoomMemberRow | null;
};

export async function loadRoomView(
  supabase: SupabaseClient,
  roomId: string,
  userId: string,
): Promise<RoomView | null> {
  const { data: roomData } = await supabase
    .from("rooms")
    .select("*")
    .eq("id", roomId)
    .maybeSingle();

  if (!roomData) return null;
  const room = roomData as RoomRecord;

  const [membersResult, roundsResult, directoryResult] = await Promise.all([
    supabase
      .from("room_members")
      .select("user_id, goal, is_ready")
      .eq("room_id", roomId)
      .order("joined_at"),
    supabase
      .from("rounds")
      .select("id, number, started_at, deadline, checkin_deadline")
      .eq("room_id", roomId)
      .order("number", { ascending: false })
      .limit(20),
    supabase.rpc("room_member_directory", { target_room: roomId }),
  ]);

  const memberRows = (membersResult.data ?? []) as RoomMemberRow[];
  const roundRows = (roundsResult.data ?? []) as RoundRow[];
  const names = new Map<string, string>(
    ((directoryResult.data ?? []) as { user_id: string; full_name: string }[]).map(
      (row) => [row.user_id, row.full_name],
    ),
  );

  const roundIds = roundRows.map((round) => round.id);
  let roundMembers: RoundMemberRow[] = [];
  let outcomes: OutcomeRow[] = [];
  let responses: ResponseRow[] = [];

  if (roundIds.length > 0) {
    const [roundMembersResult, outcomesResult, responsesResult] =
      await Promise.all([
        supabase
          .from("round_members")
          .select("round_id, user_id, goal, left_at")
          .in("round_id", roundIds),
        supabase
          .from("round_outcomes")
          .select("round_id, user_id, status, note")
          .in("round_id", roundIds),
        supabase
          .from("round_responses")
          .select("round_id, author_id, target_id, kind, note")
          .in("round_id", roundIds),
      ]);

    roundMembers = (roundMembersResult.data ?? []) as RoundMemberRow[];
    outcomes = (outcomesResult.data ?? []) as OutcomeRow[];
    responses = (responsesResult.data ?? []) as ResponseRow[];
  }

  const now = Date.now();

  const rounds: RoundView[] = roundRows.map((round) => {
    const roster = roundMembers.filter((row) => row.round_id === round.id);
    const outcomeFor = (memberId: string) =>
      outcomes.find(
        (row) => row.round_id === round.id && row.user_id === memberId,
      ) ?? null;
    const responseFor = (memberId: string) =>
      responses.find(
        (row) => row.round_id === round.id && row.target_id === memberId,
      ) ?? null;

    const participants: RoundParticipantView[] = roster
      .map((row) => {
        const outcome = outcomeFor(row.user_id);
        const response = responseFor(row.user_id);
        return {
          user_id: row.user_id,
          full_name: names.get(row.user_id) ?? "Student",
          goal: row.goal,
          left_at: row.left_at,
          outcome: outcome
            ? { status: outcome.status, note: outcome.note }
            : null,
          response: response
            ? {
                author_id: response.author_id,
                kind: response.kind,
                note: response.note,
              }
            : null,
        };
      })
      .sort((a, b) => a.full_name.localeCompare(b.full_name));

    const mine = participants.find((row) => row.user_id === userId) ?? null;
    const myOutcomeRow = outcomeFor(userId);
    const myResponseRow =
      responses.find(
        (row) => row.round_id === round.id && row.author_id === userId,
      ) ?? null;

    return {
      id: round.id,
      number: round.number,
      deadline: round.deadline,
      checkin_deadline: round.checkin_deadline,
      phase: phaseFor(round.deadline, round.checkin_deadline, now),
      participants,
      me: mine,
      myOutcome: myOutcomeRow
        ? { status: myOutcomeRow.status, note: myOutcomeRow.note }
        : null,
      myResponse: myResponseRow
        ? {
            author_id: myResponseRow.author_id,
            kind: myResponseRow.kind,
            note: myResponseRow.note,
          }
        : null,
      peerId: assignedPeer(
        roster.map((row) => row.user_id),
        userId,
      ),
    };
  });

  return {
    room,
    members: memberRows.map((row) => ({
      user_id: row.user_id,
      full_name: names.get(row.user_id) ?? "Student",
      goal: row.goal,
      is_ready: row.is_ready,
    })),
    rounds,
    myMembership: memberRows.find((row) => row.user_id === userId) ?? null,
  };
}
