"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import type { FormState } from "@/lib/action-state";
import {
  normalizeJoinCode,
  parseGoal,
  parseOutcome,
  parsePeerResponse,
  parseRoomForm,
} from "@/lib/room";

export async function createRoomAction(
  _state: FormState,
  form: FormData,
): Promise<FormState> {
  const parsed = parseRoomForm(form);
  if (typeof parsed === "string") return { error: parsed };

  const { supabase } = await requireUser();
  const { data, error } = await supabase.rpc("create_room", {
    p_subject: parsed.subject,
    p_duration_minutes: parsed.duration,
    p_challenge: parsed.challenge,
  });

  if (error) return { error: error.message };

  revalidatePath("/rooms");
  redirect(`/rooms/${(data as { id: string }).id}`);
}

export async function joinRoomAction(
  _state: FormState,
  form: FormData,
): Promise<FormState> {
  const parsed = normalizeJoinCode(form.get("code"));
  if (typeof parsed === "string") return { error: parsed };

  const { supabase } = await requireUser();
  const { data, error } = await supabase.rpc("join_room_by_code", {
    p_code: parsed.code,
  });

  if (error) return { error: error.message };

  revalidatePath("/rooms");
  redirect(`/rooms/${data as string}`);
}

export async function saveGoalAction(
  _state: FormState,
  form: FormData,
): Promise<FormState> {
  const roomId = String(form.get("room_id") ?? "");
  const intent = String(form.get("intent") ?? "ready");
  const parsed = parseGoal(form.get("goal"));
  if (typeof parsed === "string") return { error: parsed };

  const { supabase, userId } = await requireUser();
  const { error } = await supabase
    .from("room_members")
    .update({ goal: parsed.goal, is_ready: intent !== "not_ready" })
    .eq("room_id", roomId)
    .eq("user_id", userId);

  if (error) {
    return {
      error: error.message.includes("row-level security")
        ? "Goals are locked while a round is running."
        : error.message,
    };
  }

  revalidatePath(`/rooms/${roomId}`);
  return {};
}

export async function refreshInviteAction(
  _state: FormState,
  form: FormData,
): Promise<FormState> {
  const roomId = String(form.get("room_id") ?? "");

  const { supabase } = await requireUser();
  const { error } = await supabase.rpc("refresh_room_invite", {
    p_room_id: roomId,
  });

  if (error) return { error: error.message };

  revalidatePath(`/rooms/${roomId}`);
  return { notice: "New invite link ready." };
}

export async function startRoundAction(
  _state: FormState,
  form: FormData,
): Promise<FormState> {
  const roomId = String(form.get("room_id") ?? "");

  const { supabase } = await requireUser();
  const { error } = await supabase.rpc("start_round", { p_room_id: roomId });

  if (error) return { error: error.message };

  revalidatePath("/rooms");
  revalidatePath(`/rooms/${roomId}`);
  return {};
}

export async function leaveRoundAction(
  _state: FormState,
  form: FormData,
): Promise<FormState> {
  const roomId = String(form.get("room_id") ?? "");
  const roundId = String(form.get("round_id") ?? "");

  const { supabase } = await requireUser();
  const { error } = await supabase.rpc("leave_round", { p_round_id: roundId });

  if (error) return { error: error.message };

  revalidatePath(`/rooms/${roomId}`);
  return {};
}

export async function submitOutcomeAction(
  _state: FormState,
  form: FormData,
): Promise<FormState> {
  const roomId = String(form.get("room_id") ?? "");
  const roundId = String(form.get("round_id") ?? "");
  const parsed = parseOutcome(form);
  if (typeof parsed === "string") return { error: parsed };

  const { supabase } = await requireUser();
  const { error } = await supabase.rpc("submit_outcome", {
    p_round_id: roundId,
    p_status: parsed.status,
    p_note: parsed.note,
  });

  if (error) return { error: error.message };

  revalidatePath(`/rooms/${roomId}`);
  return {};
}

export async function respondToPeerAction(
  _state: FormState,
  form: FormData,
): Promise<FormState> {
  const roomId = String(form.get("room_id") ?? "");
  const roundId = String(form.get("round_id") ?? "");
  const targetId = String(form.get("target_id") ?? "");
  const parsed = parsePeerResponse(form);
  if (typeof parsed === "string") return { error: parsed };

  const { supabase } = await requireUser();
  const { error } = await supabase.rpc("respond_to_peer", {
    p_round_id: roundId,
    p_target_id: targetId,
    p_kind: parsed.kind,
    p_note: parsed.note,
  });

  if (error) return { error: error.message };

  revalidatePath(`/rooms/${roomId}`);
  return {};
}
