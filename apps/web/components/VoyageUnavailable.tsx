import Link from "next/link";
import { FileWarning } from "lucide-react";

/**
 * Shown when `GET /voyages/{id}` answered but carried no `reconciliation` key.
 * The engine produces that key on success only, so its absence is a real state
 * (still processing, or the pipeline failed) rather than a client bug.
 */
export function VoyageUnavailable({ voyageId }: { voyageId: string }) {
  return (
    <div
      role="status"
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
      <FileWarning size={32} />
      <h1 style={{ fontSize: "1.0625rem", fontWeight: 700, color: "var(--foreground)" }}>
        No reconciliation for voyage {voyageId}
      </h1>
      <p style={{ fontSize: "0.875rem", lineHeight: 1.6, maxWidth: 460 }}>
        The API answered for this voyage but returned no reconciliation, so there is
        nothing to show. The voyage is most likely still being processed, or the
        pipeline stopped before it finished.
      </p>
      <p style={{ fontSize: "0.8125rem", lineHeight: 1.6, maxWidth: 460 }}>
        No figures have been substituted for the missing ones. Re-run the analysis
        from the dashboard, or open the voyage list to see its current state.
      </p>
      <div style={{ display: "flex", gap: "0.625rem", marginTop: "0.5rem" }}>
        <Link href="/dashboard" className="btn btn-primary">
          Back to dashboard
        </Link>
        <Link href="/voyages" className="btn btn-ghost">
          Voyage list
        </Link>
      </div>
    </div>
  );
}
