"use server";

import { redirect } from "next/navigation";
import { parseProfile } from "@/lib/profile";
import { createSupabase } from "@/lib/supabase/server";
import type { FormState } from "@/lib/action-state";

function safeNext(value: FormDataEntryValue | null) {
  const next = String(value ?? "/rooms");
  return next.startsWith("/") && !next.startsWith("//") ? next : "/rooms";
}

export async function signInAction(
  _state: FormState,
  form: FormData,
): Promise<FormState> {
  const email = String(form.get("email") ?? "").trim();
  const password = String(form.get("password") ?? "");

  if (!email || !password) {
    return { error: "Enter your email and password." };
  }

  const supabase = await createSupabase();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return { error: "That email and password do not match an account." };
  }

  redirect(safeNext(form.get("next")));
}

export async function signUpAction(
  _state: FormState,
  form: FormData,
): Promise<FormState> {
  const email = String(form.get("email") ?? "").trim();
  const password = String(form.get("password") ?? "");
  const next = safeNext(form.get("next"));

  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return { error: "Enter a valid email address." };
  }
  if (password.length < 8) {
    return { error: "Use at least 8 characters for your password." };
  }

  const profile = parseProfile(form);
  if (typeof profile === "string") return { error: profile };

  const supabase = await createSupabase();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: profile },
  });

  if (error) {
    const message = error.message.toLowerCase();
    const taken =
      message.includes("already") ||
      message.includes("duplicate") ||
      message.includes("database error saving new user");
    return {
      error: taken
        ? "That email or username is already in use. Try another, or sign in."
        : error.message,
    };
  }
  if (!data.session) {
    return { error: "Check your email to confirm the account, then sign in." };
  }

  redirect(next);
}

export async function signOutAction(): Promise<FormState> {
  const supabase = await createSupabase();
  await supabase.auth.signOut();
  redirect("/");
}
