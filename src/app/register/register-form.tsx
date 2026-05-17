"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { KeyRound, Mail, UserRound } from "lucide-react";

import { signUpAction } from "@/app/(auth)/actions";
import { initialAuthActionState } from "@/app/(auth)/auth-state";
import { AuthNotice } from "@/components/auth-notice";
import { Button } from "@/components/ui/button";

export function RegisterForm() {
  const [state, formAction] = useActionState(
    signUpAction,
    initialAuthActionState
  );

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <label className="flex flex-col gap-2" htmlFor="full_name">
        <span className="text-sm font-medium text-foreground">Full name</span>
        <span className="relative">
          <UserRound
            aria-hidden
            className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <input
            autoComplete="name"
            className="h-11 w-full rounded-lg border border-border bg-background px-10 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-3 focus:ring-ring/35"
            id="full_name"
            name="full_name"
            placeholder="Your name"
            required
            type="text"
          />
        </span>
      </label>

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

      <label className="flex flex-col gap-2" htmlFor="password">
        <span className="text-sm font-medium text-foreground">Password</span>
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
          Confirm password
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
            placeholder="Re-enter your password"
            required
            type="password"
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
        Already have an account?{" "}
        <Link
          className="font-medium text-primary transition-colors hover:text-foreground"
          href="/login"
        >
          Login
        </Link>
      </p>
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button className="w-full" disabled={pending} size="lg" type="submit">
      {pending ? "Creating account..." : "Create account"}
    </Button>
  );
}
