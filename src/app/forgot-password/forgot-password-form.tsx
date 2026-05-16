"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Mail } from "lucide-react";

import { requestPasswordResetAction } from "@/app/(auth)/actions";
import { initialAuthActionState } from "@/app/(auth)/auth-state";
import { AuthNotice } from "@/components/auth-notice";
import { Button } from "@/components/ui/button";

export function ForgotPasswordForm() {
  const [state, formAction] = useActionState(
    requestPasswordResetAction,
    initialAuthActionState
  );

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <label className="flex flex-col gap-2" htmlFor="email">
        <span className="text-sm font-medium text-foreground">Email</span>
        <span className="relative">
          <Mail
            aria-hidden
            className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <input
            autoComplete="email"
            className="h-11 w-full rounded-lg border border-border bg-background px-10 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-3 focus:ring-ring/35"
            id="email"
            name="email"
            placeholder="you@example.com"
            required
            type="email"
          />
        </span>
      </label>

      {state.status !== "idle" ? (
        <AuthNotice
          message={state.message}
          tone={state.status === "success" ? "success" : "error"}
        />
      ) : null}

      <SubmitButton />

      <p className="text-center text-sm leading-6 text-muted-foreground">
        Remember your password?{" "}
        <Link
          className="font-medium text-primary transition-colors hover:text-foreground"
          href="/login"
        >
          Back to login
        </Link>
      </p>
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button className="w-full" disabled={pending} size="lg" type="submit">
      {pending ? "Sending reset link..." : "Send reset link"}
    </Button>
  );
}
