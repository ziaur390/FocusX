"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import type { FormState } from "@/lib/action-state";
import { usernamePattern } from "@/lib/profile";

export async function sendFriendRequestAction(
  _state: FormState,
  form: FormData,
): Promise<FormState> {
  const username = String(form.get("username") ?? "")
    .trim()
    .toLowerCase();

  if (!usernamePattern.test(username)) {
    return {
      error: "Use 3–24 letters, numbers or underscores for the username.",
    };
  }

  const { supabase } = await requireUser();
  const { error } = await supabase.rpc("send_friend_request", {
    p_username: username,
  });

  if (error) return { error: error.message };

  revalidatePath("/friends");
  return { notice: "Friend request sent." };
}

export async function respondFriendRequestAction(
  _state: FormState,
  form: FormData,
): Promise<FormState> {
  const requestId = String(form.get("request_id") ?? "");
  const accept = String(form.get("decision") ?? "") === "accept";

  const { supabase } = await requireUser();
  const { error } = await supabase.rpc("respond_friend_request", {
    p_request_id: requestId,
    p_accept: accept,
  });

  if (error) return { error: error.message };

  revalidatePath("/friends");
  return {
    notice: accept ? "Friend request accepted." : "Friend request declined.",
  };
}
