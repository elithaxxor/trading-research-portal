"use client";

import { useEffect } from "react";

import { captureSafeException } from "@/lib/monitoring/sentry";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    captureSafeException(error, {
      area: "app",
      route: "global",
      stage: "global_error_boundary",
      tags: {
        digest_present: Boolean(error.digest),
      },
    });
  }, [error]);

  return (
    <html lang="en">
      <body>
        <main style={{ margin: "0 auto", maxWidth: 680, padding: "96px 24px" }}>
          <p
            style={{
              color: "#64748b",
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
            }}
          >
            Something went wrong
          </p>
          <h1 style={{ color: "#020617", fontSize: 32, margin: "12px 0" }}>
            The app hit an unexpected error.
          </h1>
          <p style={{ color: "#475569", lineHeight: 1.6 }}>
            The error has been captured if monitoring is enabled. Please try
            again in a moment.
          </p>
          <button
            onClick={reset}
            style={{
              background: "#020617",
              border: 0,
              borderRadius: 6,
              color: "white",
              cursor: "pointer",
              fontWeight: 700,
              marginTop: 24,
              padding: "10px 16px",
            }}
            type="button"
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
