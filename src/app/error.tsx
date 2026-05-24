"use client";

import { useEffect } from "react";

import { captureSafeException } from "@/lib/monitoring/sentry";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    captureSafeException(error, {
      area: "app",
      route: "app-router",
      stage: "route_error_boundary",
      tags: {
        digest_present: Boolean(error.digest),
      },
    });
  }, [error]);

  return (
    <main className="mx-auto flex min-h-[60vh] w-full max-w-2xl flex-col justify-center px-6 py-16">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
        Something went wrong
      </p>
      <h1 className="mt-3 text-3xl font-semibold text-slate-950">
        We could not load this view.
      </h1>
      <p className="mt-4 text-sm leading-6 text-slate-600">
        The error has been captured if monitoring is enabled. Please try again,
        or return to the previous page.
      </p>
      <button
        className="mt-6 inline-flex w-fit items-center rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
        onClick={reset}
        type="button"
      >
        Try again
      </button>
    </main>
  );
}
