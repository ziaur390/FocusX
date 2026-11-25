"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import type { FormState } from "@/lib/action-state";

export async function createCircleAction(
  _state: FormState,
  form: FormData,
): Promise<FormState> {
  const name = String(form.get("name") ?? "").trim();
  if (name.length < 2 || name.length > 60) {
    return { error: "Use 2–60 characters for the circle name." };
  }

  const { supabase } = await requireUser();
  const { error } = await supabase.rpc("create_circle", { p_name: name });
  if (error) return { error: error.message };

  revalidatePath("/circles");
  return { notice: "Circle created." };
}

export async function inviteFriendAction(
  _state: FormState,
  form: FormData,
): Promise<FormState> {
  const circleId = String(form.get("circle_id") ?? "");
  const friendId = String(form.get("friend_id") ?? "");
  if (!circleId || !friendId) {
    return { error: "Choose a friend to invite." };
  }

  const { supabase } = await requireUser();
  const { error } = await supabase.rpc("invite_to_circle", {
    p_circle_id: circleId,
    p_friend_id: friendId,
  });
  if (error) return { error: error.message };

  revalidatePath("/circles");
  return { notice: "Invite sent." };
}

export async function respondCircleInviteAction(
  _state: FormState,
  form: FormData,
): Promise<FormState> {
  const inviteId = String(form.get("invite_id") ?? "");
  const accept = String(form.get("decision") ?? "") === "accept";

  const { supabase } = await requireUser();
  const { error } = await supabase.rpc("respond_circle_invite", {
    p_invite_id: inviteId,
    p_accept: accept,
  });
  if (error) return { error: error.message };

  revalidatePath("/circles");
  return { notice: accept ? "Circle joined." : "Invite declined." };
}
