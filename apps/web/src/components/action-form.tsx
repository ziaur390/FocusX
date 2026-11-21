"use client";

import { useActionState, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import type { FormAction, FormState } from "@/lib/action-state";

export function ActionForm({
  action,
  submit,
  children,
  className = "",
  tone = "primary",
  hint,
  fullWidth = true,
  disabled = false,
}: {
  action: FormAction;
  submit: string;
  children?: ReactNode;
  className?: string;
  tone?: "primary" | "secondary";
  hint?: string;
  fullWidth?: boolean;
  disabled?: boolean;
}) {
  const [state, formAction] = useActionState<FormState, FormData>(
    action,
    undefined,
  );

  return (
    <form action={formAction} className={className}>
      {children}
      {state?.error ? (
        <p
          role="alert"
          className="mt-3 rounded-lg bg-error-bg px-3 py-2 text-sm font-medium text-error"
        >
          {state.error}
        </p>
      ) : null}
      {hint ? <p className="mt-2 text-xs text-muted">{hint}</p> : null}
      <SubmitButton tone={tone} fullWidth={fullWidth} disabled={disabled}>
        {submit}
      </SubmitButton>
    </form>
  );
}

function SubmitButton({
  children,
  tone,
  fullWidth,
  disabled,
}: {
  children: ReactNode;
  tone: "primary" | "secondary";
  fullWidth: boolean;
  disabled: boolean;
}) {
  const { pending } = useFormStatus();
  const styles =
    tone === "primary"
      ? "bg-violet text-white hover:bg-violet-hover"
      : "border border-divider bg-white text-ink hover:bg-paper";

  return (
    <button
      type="submit"
      disabled={pending || disabled}
      className={`mt-3 inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors disabled:opacity-60 ${fullWidth ? "w-full" : "w-auto"} ${styles}`}
    >
      {pending ? "Working…" : children}
    </button>
  );
}
