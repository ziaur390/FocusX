"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import type { FormState } from "@/lib/action-state";
import { parseProfile } from "@/lib/profile";

export async function updateProfileAction(
  _state: FormState,
  form: FormData,
): Promise<FormState> {
  const profile = parseProfile(form);
  if (typeof profile === "string") return { error: profile };

  const { supabase, userId } = await requireUser();
  const { error } = await supabase
    .from("profiles")
    .update(profile)
    .eq("id", userId);

  if (error) {
    return {
      error:
        error.code === "23505"
          ? "That username is already taken. Try another."
          : error.message,
    };
  }

  revalidatePath("/profile");
  revalidatePath("/rooms");
  return { notice: "Profile saved." };
}
