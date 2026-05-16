"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { KeyRound } from "lucide-react";

import { updatePasswordAction } from "@/app/(auth)/actions";
import { initialAuthActionState } from "@/app/(auth)/auth-state";
import { AuthNotice } from "@/components/auth-notice";
import { Button } from "@/components/ui/button";

export function ResetPasswordForm() {
  const [state, formAction] = useActionState(
    updatePasswordAction,
    initialAuthActionState
  );

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <label className="flex flex-col gap-2" htmlFor="password">
        <span className="text-sm font-medium text-foreground">
          New password
        </span>
        <span className="relative">
          <KeyRound
            aria-hidden
            className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <input
            autoComplete="new-password"
            className="h-11 w-full rounded-lg border border-border bg-background px-10 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-3 focus:ring-ring/35"
            id="password"
            minLength={8}
            name="password"
            placeholder="Minimum 8 characters"
            required
            type="password"
          />
        </span>
      </label>

      <label className="flex flex-col gap-2" htmlFor="confirmPassword">
        <span className="text-sm font-medium text-foreground">
          Confirm new password
        </span>
        <span className="relative">
          <KeyRound
            aria-hidden
            className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <input
            autoComplete="new-password"
            className="h-11 w-full rounded-lg border border-border bg-background px-10 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-3 focus:ring-ring/35"
            id="confirmPassword"
            minLength={8}
            name="confirmPassword"
            placeholder="Re-enter your new password"
            required
            type="password"
          />
        </span>
      </label>

      {state.status === "error" ? (
        <AuthNotice message={state.message} tone="error" />
      ) : null}

      <SubmitButton />
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button className="w-full" disabled={pending} size="lg" type="submit">
      {pending ? "Updating password..." : "Update password"}
    </Button>
  );
}
