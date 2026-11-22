"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { parseProfile } from "@/lib/profile";
import { createSupabase } from "@/lib/supabase/server";
import type { FormState } from "@/lib/action-state";
import {
  confirmationPath,
  safeAuthNext,
  signupNextCookie,
} from "@/lib/auth-redirect";

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
    return {
      error: error.code === "email_not_confirmed"
        ? "Confirm your email using the link in your inbox before signing in."
        : "That email and password do not match an account.",
    };
  }

  redirect(safeAuthNext(form.get("next")));
}

export async function signUpAction(
  _state: FormState,
  form: FormData,
): Promise<FormState> {
  const email = String(form.get("email") ?? "").trim();
  const password = String(form.get("password") ?? "");
  const next = safeAuthNext(form.get("next"));

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
    (await cookies()).set(signupNextCookie, next, {
      path: confirmationPath,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60,
    });
    return { notice: "Open the confirmation link in your email to finish setting up your account." };
  }

  redirect(next);
}

export async function signOutAction(): Promise<FormState> {
  const supabase = await createSupabase();
  await supabase.auth.signOut();
  redirect("/");
}
