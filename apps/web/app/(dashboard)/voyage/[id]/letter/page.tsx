"use client";

import { use, useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { fetchVoyageDetail, formatUsd, API_BASE_URL, USE_MOCK, isDemoMode } from "@/lib/api";
import type {
  VoyageDetailResponse,
  SourceCitation,
  ClauseCitation,
  AuditTraceEntry,
} from "@/lib/types";
import { ArrowLeft, Download, Printer, Anchor, Loader2, Send, X, CheckCircle, AlertTriangle } from "lucide-react";

type EvidenceRow = {
  id: string;
  source: string;
  label: string;
  document: string;
  page_number: number | null;
  excerpt: string;
  bbox: [number, number, number, number] | null;
  missingSpan: boolean;
};

function isMissingSpan(opts: {
  excerpt?: string;
  clause_text?: string;
  page_number?: number | null;
  bbox?: [number, number, number, number] | null;
}): boolean {
  const text = (opts.excerpt ?? opts.clause_text ?? "").trim();
  if (!text) return true;
  if (opts.page_number == null || opts.page_number === 0) return true;
  const bbox = opts.bbox;
  if (!bbox) return true;
  if (bbox.every((v) => v === 0)) return true;
  return false;
}

function collectEvidence(data: VoyageDetailResponse): EvidenceRow[] {
  const rows: EvidenceRow[] = [];
  const rec = data.reconciliation;

  const pushAudit = (party: string, entries: AuditTraceEntry[]) => {
    entries.forEach((entry) => {
      const c: SourceCitation | undefined = entry.citation;
      rows.push({
        id: `${party}-step-${entry.step}`,
        source: `${party}_calculation.audit_trace`,
        label: `Step ${entry.step}: ${entry.description}`,
        document: c?.document ?? "",
        page_number: c?.page_number ?? null,
        excerpt: c?.excerpt ?? "",
        bbox: c?.bbox ?? null,
        missingSpan: isMissingSpan({
          excerpt: c?.excerpt,
          page_number: c?.page_number,
          bbox: c?.bbox,
        }),
      });
    });
  };

  pushAudit("owner", rec.owner_calculation.audit_trace);
  pushAudit("charterer", rec.charterer_calculation.audit_trace);

  rec.charterparty.clauses.forEach((clause: ClauseCitation, idx) => {
    rows.push({
      id: `clause-${idx}`,
      source: "charterparty.clauses",
      label: clause.clause_id || `Clause ${idx + 1}`,
      document: clause.source_document,
      page_number: clause.page_number,
      excerpt: clause.clause_text,
      bbox: clause.bbox ?? null,
      missingSpan: isMissingSpan({
        clause_text: clause.clause_text,
        page_number: clause.page_number,
        bbox: clause.bbox,
      }),
    });
  });

  rec.day_verdicts.forEach((v) => {
    const clause = v.bimco_clause;
    rows.push({
      id: `bimco-${v.date}`,
      source: "day_verdicts.bimco_clause",
      label: `${v.date} · ${clause.clause_id}`,
      document: clause.source_document,
      page_number: clause.page_number,
      excerpt: clause.clause_text,
      bbox: clause.bbox ?? null,
      missingSpan: isMissingSpan({
        clause_text: clause.clause_text,
        page_number: clause.page_number,
        bbox: clause.bbox,
      }),
    });
  });

  return rows;
}

export default function ClaimLetterPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [data, setData] = useState<VoyageDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [letterHtml, setLetterHtml] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    fetchVoyageDetail(id)
      .then((d) => {
        setData(d);
        // Try fetching rendered letter from A-09 endpoint
        if (!USE_MOCK && !isDemoMode()) {
          fetch(`${API_BASE_URL}/voyages/${id}/letter`)
            .then((r) => (r.ok ? r.text() : null))
            .then((html) => setLetterHtml(html))
            .catch(() => setLetterHtml(null))
            .finally(() => setLoading(false));
        } else {
          setLoading(false);
        }
      })
      .catch(() => setLoading(false));
  }, [id]);

  const evidence = useMemo(() => (data ? collectEvidence(data) : []), [data]);

  const downloadTrace = () => {
    if (!data) return;
    const payload = {
      voyage_id: id,
      label: "Advisory evidence list",
      letter_totals: {
        owner_total_usd: data.reconciliation.owner_calculation.total_usd,
        charterer_total_usd: data.reconciliation.charterer_calculation.total_usd,
        reconciled_total_usd: data.reconciliation.reconciled_total_usd,
        math_breakdown: data.reconciliation.math_breakdown,
      },
      citations: evidence,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `keel-${id}-trace.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", gap: "0.75rem", color: "hsl(var(--muted-foreground))" }}>
        <Loader2 size={20} style={{ animation: "spin 1s linear infinite" }} />
        Loading letter…
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const rec = data?.reconciliation;
  const today = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

  return (
    <div>
      <header className="page-header">
        <Link
          href={`/voyage/${id}/reconcile`}
          className="btn btn-ghost"
          style={{ padding: "0.375rem 0.625rem", minWidth: "auto" }}
        >
          <ArrowLeft size={16} />
        </Link>
        <Anchor size={20} style={{ color: "hsl(var(--primary))" }} />
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: "0.875rem", fontWeight: 600, margin: 0 }}>
            Claim Letter
          </h1>
        </div>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button
            className="btn btn-ghost"
            onClick={() => setShowConfirm(true)}
          >
            <Send size={14} />
            Send to Other Party
          </button>
          <a
            href={`${API_BASE_URL}/voyages/${id}/letter?format=pdf`}
            className="btn btn-ghost"
            id="download-letter-pdf-btn"
            target="_blank"
            rel="noreferrer"
          >
            <Download size={14} />
            PDF
          </a>
          <button
            id="print-letter-btn"
            className="btn btn-primary"
            onClick={() => window.print()}
          >
            <Printer size={14} />
            Print
          </button>
        </div>
      </header>

      <div className="page-content" style={{ maxWidth: 1400, margin: "2rem auto" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1fr) minmax(280px, 360px)",
            gap: "1.5rem",
            alignItems: "start",
          }}
        >
          <div
            style={{
              background: "hsl(0 0% 100%)",
              color: "#1a1a1a",
              borderRadius: "var(--radius)",
              padding: "4rem",
              boxShadow: "0 4px 32px hsl(0 0% 0% / 0.4)",
              minHeight: "80vh",
              fontFamily: "Georgia, serif",
              lineHeight: 1.8,
            }}
          >
            {letterHtml ? (
              <div dangerouslySetInnerHTML={{ __html: letterHtml }} />
            ) : rec ? (
              /* Fallback: generated from mock data */
              <>
                <div style={{ borderBottom: "2px solid #1a1a1a", paddingBottom: "1.5rem", marginBottom: "2rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                      <img
                        src="/logo.png"
                        alt="Keel Logo"
                        style={{
                          width: 44,
                          height: 44,
                          objectFit: "contain",
                          borderRadius: 8,
                          border: "1px solid #e2e8f0",
                          backgroundColor: "#ffffff",
                        }}
                      />
                      <div>
                        <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.25rem", margin: 0 }}>Keel Maritime</h1>
                        <p style={{ color: "#555", fontSize: "0.9rem", margin: 0 }}>Voyage Reconciliation Services</p>
                      </div>
                    </div>
                    <div style={{ textAlign: "right", fontSize: "0.9rem", color: "#555" }}>
                      <p style={{ margin: 0 }}>{today}</p>
                      <p style={{ margin: 0 }}>Ref: {id.toUpperCase()}</p>
                    </div>
                  </div>
                </div>

                <p style={{ marginBottom: "1.5rem" }}><strong>Re: Laytime and Demurrage Reconciliation — {rec.charterparty.vessel_name}</strong></p>

                <p style={{ marginBottom: "1.5rem" }}>
                  Dear Sir/Madam,
                </p>

                <p style={{ marginBottom: "1.5rem" }}>
                  We write further to the completed voyage of the above-named vessel and set out below the reconciled
                  laytime and demurrage statement in accordance with the charterparty terms, including the BIMCO 2013
                  weather exception clause.
                </p>

                <p style={{ marginBottom: "1.5rem" }}>
                  The Owner&apos;s total claimed: <strong>{formatUsd(rec.owner_calculation.total_usd)}</strong>.<br />
                  The Charterer&apos;s total claimed: <strong>{formatUsd(rec.charterer_calculation.total_usd)}</strong>.
                </p>

                <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "1rem", marginTop: "2rem" }}>Per-Day Analysis</h2>

                {rec.day_verdicts.map((v) => {
                  const dateLabel = new Date(v.date + "T00:00:00Z").toLocaleDateString("en-GB", {
                    weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC",
                  });
                  return (
                    <div key={v.date} style={{ marginBottom: "1.5rem", paddingLeft: "1rem", borderLeft: "3px solid #ccc" }}>
                      <p style={{ fontWeight: 700, marginBottom: "0.375rem" }}>{dateLabel}</p>
                      <p style={{ marginBottom: "0.375rem" }}>
                        <em>Owner&apos;s position:</em> {v.owner_position}
                      </p>
                      <p style={{ marginBottom: "0.375rem" }}>
                        <em>Charterer&apos;s position:</em> {v.charterer_position}
                      </p>
                      <p style={{ marginBottom: "0.375rem" }}>
                        <em>Weather:</em> Beaufort {v.weather.wind_force_beaufort}, {v.weather.precipitation_mm}mm precipitation, {v.weather.adverse_hours}h adverse.
                      </p>
                      <p>
                        <strong>Verdict: {v.winner_label}</strong>
                        {v.dollars_credited_usd > 0 && ` (+${formatUsd(v.dollars_credited_usd)})`}. {v.justification}
                      </p>
                    </div>
                  );
                })}

                <div style={{ borderTop: "2px solid #1a1a1a", paddingTop: "1.5rem", marginTop: "2rem" }}>
                  <p style={{ fontWeight: 700, fontSize: "1.25rem" }}>
                    Reconciled Total Payable: {formatUsd(rec.reconciled_total_usd)}
                  </p>
                  <p style={{ color: "#555", fontSize: "0.9rem", marginTop: "0.5rem" }}>
                    {rec.math_breakdown}
                  </p>
                </div>

                <p style={{ marginTop: "3rem" }}>Yours faithfully,</p>
                <p style={{ marginTop: "2rem", fontWeight: 700 }}>Keel Maritime Reconciliation Engine</p>
              </>
            ) : (
              <p style={{ color: "#555", textAlign: "center", padding: "4rem" }}>
                Letter not available. Please ensure A-09 is complete.
              </p>
            )}
          </div>

          {/* Advisory evidence list */}
          <aside className="card" style={{ position: "sticky", top: "1rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.75rem", marginBottom: "0.75rem" }}>
              <div>
                <h2 style={{ fontSize: "0.8125rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "hsl(var(--muted-foreground))", margin: 0 }}>
                  Advisory evidence list
                </h2>
                <p style={{ fontSize: "0.75rem", color: "hsl(var(--muted-foreground))", marginTop: "0.375rem", marginBottom: 0 }}>
                  Cited spans for review — not a court filing.
                </p>
              </div>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={downloadTrace}
                disabled={!data}
                style={{ fontSize: "0.75rem", padding: "0.375rem 0.625rem", flexShrink: 0 }}
              >
                <Download size={12} />
                Download trace
              </button>
            </div>

            {rec && (
              <p className="mono" style={{ fontSize: "0.875rem", fontWeight: 700, marginBottom: "1rem", color: "hsl(var(--owner))" }}>
                Reconciled {formatUsd(rec.reconciled_total_usd)}
              </p>
            )}

            {evidence.length === 0 ? (
              <p style={{ fontSize: "0.8125rem", color: "hsl(var(--muted-foreground))" }}>
                No citations available.
              </p>
            ) : (
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: "0.75rem" }}>
                {evidence.map((row) => (
                  <li
                    key={row.id}
                    className="card-flat"
                    style={{ padding: "0.75rem", fontSize: "0.8125rem" }}
                  >
                    <p style={{ fontWeight: 600, marginBottom: "0.25rem" }}>{row.label}</p>
                    <p style={{ fontSize: "0.7rem", color: "hsl(var(--muted-foreground))", marginBottom: "0.375rem" }}>
                      {row.source}
                    </p>
                    {row.document && (
                      <p className="mono" style={{ fontSize: "0.75rem", marginBottom: "0.25rem" }}>
                        {row.document}
                        {row.page_number != null && row.page_number > 0 ? ` · p.${row.page_number}` : ""}
                      </p>
                    )}
                    {row.excerpt ? (
                      <p style={{ fontSize: "0.75rem", fontStyle: "italic", color: "hsl(var(--foreground) / 0.8)", lineHeight: 1.45 }}>
                        {row.excerpt.length > 160 ? `${row.excerpt.slice(0, 160)}…` : row.excerpt}
                      </p>
                    ) : null}
                    {row.missingSpan && (
                      <p
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.375rem",
                          marginTop: "0.5rem",
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          color: "hsl(var(--charterer))",
                        }}
                      >
                        <AlertTriangle size={12} />
                        Missing source span
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </aside>
        </div>
      </div>

      {showConfirm && (
        <ConfirmationDialog
          onClose={() => setShowConfirm(false)}
          vesselName={rec?.charterparty.vessel_name ?? "—"}
          reconciledTotal={rec ? formatUsd(rec.reconciled_total_usd) : "—"}
          voyageId={id}
        />
      )}
    </div>
  );
}

interface ConfirmationDialogProps {
  onClose: () => void;
  vesselName: string;
  reconciledTotal: string;
  voyageId: string;
}

function ConfirmationDialog({ onClose, vesselName, reconciledTotal, voyageId }: ConfirmationDialogProps) {
  return (
    <>
      <div className="dialog-overlay" onClick={onClose} />
      <div className="dialog-content" role="dialog" aria-modal="true" style={{ maxWidth: "480px" }}>
        <button
          className="btn btn-ghost"
          onClick={onClose}
          style={{
            position: "absolute",
            top: "1rem",
            right: "1rem",
            padding: "0.375rem",
            minWidth: "auto",
            border: "none",
            background: "transparent",
            cursor: "pointer"
          }}
          aria-label="Close dialog"
        >
          <X size={16} />
        </button>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", padding: "1rem 0.5rem 0.25rem" }}>
          <div
            style={{
              width: 56,
              height: 56,
              background: "oklch(0.65 0.15 160 / 0.15)",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "1.25rem",
              color: "hsl(var(--owner))",
            }}
          >
            <CheckCircle size={28} />
          </div>
          
          <h2 className="font-display" style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "0.5rem" }}>
            Claim Letter Sent
          </h2>
          
          <p style={{ fontSize: "0.875rem", color: "var(--muted-foreground)", lineHeight: 1.6, marginBottom: "1.5rem" }}>
            The demurrage claim letter has been successfully compiled and sent to the other party.
          </p>

          <div
            style={{
              width: "100%",
              background: "hsl(var(--surface-2))",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius)",
              padding: "1rem",
              marginBottom: "1.5rem",
              textAlign: "left",
              display: "grid",
              gap: "0.75rem",
              fontSize: "0.8125rem",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--muted-foreground)" }}>Vessel</span>
              <span style={{ fontWeight: 600 }}>{vesselName}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--muted-foreground)" }}>Voyage Ref</span>
              <span className="mono" style={{ fontWeight: 600 }}>{voyageId.toUpperCase()}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--muted-foreground)" }}>Reconciled Amount</span>
              <span className="mono" style={{ fontWeight: 600, color: "hsl(var(--owner))" }}>{reconciledTotal}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--muted-foreground)" }}>Status</span>
              <span style={{ fontWeight: 600, display: "flex", alignItems: "center", gap: "0.25rem" }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "hsl(var(--owner))" }} />
                Dispatched
              </span>
            </div>
          </div>

          <button
            className="btn btn-primary"
            onClick={onClose}
            style={{ width: "100%", justifyContent: "center" }}
          >
            Done
          </button>
        </div>
      </div>
    </>
  );
}
