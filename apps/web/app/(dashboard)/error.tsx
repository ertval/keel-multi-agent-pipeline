"use client";

import { useEffect } from "react";
import { TriangleAlert, RefreshCw } from "lucide-react";

/**
 * Segment boundary for the whole analyst workspace: `layout.tsx` and every
 * nested page inside it. A page that throws during render lands here instead of
 * replacing the route with the framework's blank "This page couldn't load".
 * Nothing is invented here either — the message names the failure, not a
 * substitute for the data that is missing.
 */
export default function DashboardError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div
      role="alert"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "0.75rem",
        padding: "4rem 1.5rem",
        textAlign: "center",
        color: "hsl(var(--muted-foreground))",
      }}
    >
      <TriangleAlert size={32} style={{ color: "hsl(var(--charterer))" }} />
      <h1 style={{ fontSize: "1.0625rem", fontWeight: 700, color: "var(--foreground)" }}>
        This view could not be rendered
      </h1>
      <p style={{ fontSize: "0.875rem", lineHeight: 1.6, maxWidth: 480 }}>
        The page stopped on a response it could not read. No figures are shown
        here, because showing figures would mean inventing them.
      </p>
      <p className="mono" style={{ fontSize: "0.75rem", lineHeight: 1.6, maxWidth: 480 }}>
        {error.message}
      </p>
      <button
        type="button"
        className="btn btn-primary"
        onClick={() => unstable_retry()}
        style={{ marginTop: "0.5rem" }}
      >
        <RefreshCw size={14} />
        Try again
      </button>
    </div>
  );
}
