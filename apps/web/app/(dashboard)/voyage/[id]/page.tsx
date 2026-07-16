"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import { fetchVoyageDetail, formatUsd } from "@/lib/api";
import type { VoyageDetailResponse, ClauseCitation, AuditTraceEntry } from "@/lib/types";
import dynamic from "next/dynamic";

const PdfViewer = dynamic(() => import("@/components/PdfViewer"), { ssr: false });
import {
  Anchor, ArrowLeft, FileText, X,
  ArrowRight, Loader2
} from "lucide-react";

interface CitationDialogProps {
  clause: ClauseCitation;
  onClose: () => void;
}

function CitationDialog({ clause, onClose }: CitationDialogProps) {
  return (
    <>
      <div className="dialog-overlay" onClick={onClose} />
      <div className="dialog-content" role="dialog" aria-modal="true">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.25rem" }}>
          <div>
            <span className="badge badge-primary" style={{ marginBottom: "0.5rem" }}>{clause.clause_id}</span>
            <h2 style={{ fontSize: "1rem", fontWeight: 600, margin: 0 }}>Clause Citation</h2>
          </div>
          <button
            className="btn btn-ghost"
            onClick={onClose}
            style={{ padding: "0.375rem", minWidth: "auto" }}
            aria-label="Close dialog"
          >
            <X size={16} />
          </button>
        </div>
        <blockquote
          style={{
            borderLeft: "3px solid hsl(var(--primary))",
            paddingLeft: "1rem",
            color: "hsl(var(--foreground))",
            fontStyle: "italic",
            lineHeight: 1.7,
            marginBottom: "1rem",
          }}
        >
          {clause.clause_text}
        </blockquote>
        <div style={{ display: "flex", gap: "1rem", fontSize: "0.8125rem", color: "hsl(var(--muted-foreground))" }}>
          <span className="weather-pill">
            <FileText size={12} />
            {clause.source_document}
          </span>
          <span className="weather-pill">
            Page {clause.page_number}
          </span>
        </div>
      </div>
    </>
  );
}

interface AuditTraceTableProps {
  entries: AuditTraceEntry[];
  selectedStep: number | null;
  onSelectStep: (step: number) => void;
}

function AuditTraceTable({ entries, selectedStep, onSelectStep }: AuditTraceTableProps) {
  return (
    <div style={{ marginTop: "1rem" }}>
      <div style={{ overflow: "auto" }}>
        <table className="audit-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Description</th>
              <th style={{ textAlign: "right" }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr
                key={entry.step}
                className={selectedStep === entry.step ? "selected" : ""}
                onClick={() => entry.citation && onSelectStep(entry.step)}
                style={{ cursor: entry.citation ? "pointer" : "default" }}
              >
                <td style={{ color: "hsl(var(--muted-foreground))", fontVariantNumeric: "tabular-nums" }}>
                  {entry.step}
                </td>
                <td>
                  {entry.description}
                  {entry.citation && (
                    <span
                      className="weather-pill mono"
                      style={{ marginLeft: "0.5rem", fontSize: "0.7rem" }}
                      title={entry.citation.excerpt}
                    >
                      <FileText size={10} />
                      p.{entry.citation.page_number}
                    </span>
                  )}
                </td>
                <td
                  className="mono"
                  style={{
                    textAlign: "right",
                    fontWeight: entry.value_usd !== 0 ? 600 : 400,
                    color: entry.value_usd !== 0 ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))",
                  }}
                >
                  {entry.value_usd !== 0 ? formatUsd(entry.value_usd) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function VoyageDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [data, setData] = useState<VoyageDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeCitation, setActiveCitation] = useState<ClauseCitation | null>(null);
  const [selectedPdf, setSelectedPdf] = useState<string | null>(null);
  const [selectedPage, setSelectedPage] = useState(1);
  const [selectedBbox, setSelectedBbox] = useState<[number, number, number, number] | null>(null);
  const [ownerSelectedStep, setOwnerSelectedStep] = useState<number | null>(null);
  const [chartererSelectedStep, setChartererSelectedStep] = useState<number | null>(null);

  useEffect(() => {
    fetchVoyageDetail(id)
      .then(setData)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  const normalizeBbox = (bbox?: [number, number, number, number]) => {
    if (!bbox) return null;
    if (bbox.every((value) => value === 0)) return null;
    return bbox;
  };

  const handleOwnerStep = (step: number) => {
    const entry = data?.reconciliation.owner_calculation.audit_trace.find((e) => e.step === step);
    if (entry?.citation) {
      setSelectedPdf(data?.pdf_urls[entry.citation.document] ?? null);
      setSelectedPage(entry.citation.page_number);
      setSelectedBbox(normalizeBbox(entry.citation.bbox));
    } else {
      setSelectedBbox(null);
    }
    setOwnerSelectedStep(step);
    setChartererSelectedStep(null);
  };

  const handleChartererStep = (step: number) => {
    const entry = data?.reconciliation.charterer_calculation.audit_trace.find((e) => e.step === step);
    if (entry?.citation) {
      setSelectedPdf(data?.pdf_urls[entry.citation.document] ?? null);
      setSelectedPage(entry.citation.page_number);
      setSelectedBbox(normalizeBbox(entry.citation.bbox));
    } else {
      setSelectedBbox(null);
    }
    setChartererSelectedStep(step);
    setOwnerSelectedStep(null);
  };

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", gap: "0.75rem", color: "hsl(var(--muted-foreground))" }}>
        <Loader2 size={20} style={{ animation: "spin 1s linear infinite" }} />
        Loading voyage…
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "hsl(var(--charterer))" }}>
        Error: {error}
      </div>
    );
  }

  const { reconciliation } = data!;
  const cp = reconciliation.charterparty;

  return (
    <div>
      {/* Header */}
      <header className="page-header">
        <Link
          href="/dashboard"
          className="btn btn-ghost"
          style={{ padding: "0.375rem 0.625rem", minWidth: "auto" }}
          aria-label="Back to dashboard"
        >
          <ArrowLeft size={16} />
        </Link>
        <Anchor size={20} style={{ color: "hsl(var(--primary))" }} />
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: "0.875rem", fontWeight: 600, margin: 0 }}>
            {cp.vessel_name}
          </h1>
          <p style={{ fontSize: "0.75rem", color: "hsl(var(--muted-foreground))", margin: 0 }}>
            Voyage {id}
          </p>
        </div>
        <Link
          href={`/voyage/${id}/reconcile`}
          className="btn btn-primary"
          id="view-reconciliation-btn"
          style={{ fontSize: "0.875rem" }}
        >
          View Reconciliation
          <ArrowRight size={14} />
        </Link>
      </header>

      <div className="page-content">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "320px 1fr 1fr",
            gap: "1.5rem",
            alignItems: "start",
          }}
        >
          {/* ── Left: Charterparty terms ── */}
          <div className="card animate-fade-in">
            <h2 style={{ fontSize: "0.8125rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "hsl(var(--muted-foreground))", marginBottom: "1.25rem" }}>
              Charterparty Terms
            </h2>
            <div style={{ display: "grid", gap: "1rem" }}>
              {[
                { label: "Vessel", value: cp.vessel_name },
                { label: "Hire Rate", value: formatUsd(cp.hire_rate_per_day_usd) + "/day" },
                { label: "Laytime Allowed", value: `${cp.laytime_allowed_hours}h` },
                { label: "Demurrage Rate", value: formatUsd(cp.demurrage_rate_per_day_usd) + "/day" },
                { label: "Despatch Rate", value: formatUsd(cp.despatch_rate_per_day_usd) + "/day" },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p style={{ fontSize: "0.75rem", color: "hsl(var(--muted-foreground))", marginBottom: "0.25rem" }}>{label}</p>
                  <p className="mono" style={{ fontSize: "0.9375rem", fontWeight: 600 }}>{value}</p>
                </div>
              ))}

              <div>
                <p style={{ fontSize: "0.75rem", color: "hsl(var(--muted-foreground))", marginBottom: "0.5rem" }}>Exceptions</p>
                {cp.exceptions.map((exc, i) => (
                  <div key={i} className="weather-pill" style={{ marginBottom: "0.375rem", width: "fit-content" }}>
                    {exc}
                  </div>
                ))}
              </div>

              {cp.clauses.length > 0 && (
                <div>
                  <p style={{ fontSize: "0.75rem", color: "hsl(var(--muted-foreground))", marginBottom: "0.5rem" }}>Charter Party Key Clauses</p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.375rem" }}>
                    {cp.clauses.map((clause, i) => (
                      <button
                        key={i}
                        className="btn btn-ghost"
                        onClick={() => setActiveCitation(clause)}
                        style={{ flex: "1 1 calc(50% - 0.375rem)", justifyContent: "flex-start", padding: "0.25rem 0.5rem", fontSize: "0.75rem", minWidth: 0 }}
                        title={clause.clause_text}
                      >
                        <FileText size={12} style={{ color: "hsl(var(--primary))", flexShrink: 0 }} />
                        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", minWidth: 0 }}>{clause.clause_id}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── Center: Owner Calculation ── */}
          <div
            className="card animate-fade-in"
            style={{ animationDelay: "0.1s", borderTop: "3px solid hsl(var(--owner))" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
              <h2 style={{ fontSize: "0.8125rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "hsl(var(--owner))" }}>
                Owner Calculation
              </h2>
              <span className="badge badge-owner">Owner</span>
            </div>
            <p
              style={{
                fontSize: "3rem",
                fontWeight: 800,
                letterSpacing: "-0.03em",
                color: "hsl(var(--owner))",
                lineHeight: 1,
                marginBottom: "0.25rem",
              }}
            >
              {formatUsd(reconciliation.owner_calculation.total_usd)}
            </p>
            <p style={{ fontSize: "0.8rem", color: "hsl(var(--muted-foreground))", marginBottom: "1rem" }}>
              Owner&apos;s claimed total
            </p>
            <AuditTraceTable
              entries={reconciliation.owner_calculation.audit_trace}
              selectedStep={ownerSelectedStep}
              onSelectStep={handleOwnerStep}
            />
          </div>

          {/* ── Right: Charterer Calculation ── */}
          <div
            className="card animate-fade-in"
            style={{ animationDelay: "0.2s", borderTop: "3px solid hsl(var(--charterer))" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
              <h2 style={{ fontSize: "0.8125rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "hsl(var(--charterer))" }}>
                Charterer Calculation
              </h2>
              <span className="badge badge-charterer">Charterer</span>
            </div>
            <p
              style={{
                fontSize: "3rem",
                fontWeight: 800,
                letterSpacing: "-0.03em",
                color: "hsl(var(--charterer))",
                lineHeight: 1,
                marginBottom: "0.25rem",
              }}
            >
              {formatUsd(reconciliation.charterer_calculation.total_usd)}
            </p>
            <p style={{ fontSize: "0.8rem", color: "hsl(var(--muted-foreground))", marginBottom: "1rem" }}>
              Charterer&apos;s claimed total
            </p>
            <AuditTraceTable
              entries={reconciliation.charterer_calculation.audit_trace}
              selectedStep={chartererSelectedStep}
              onSelectStep={handleChartererStep}
            />
          </div>
        </div>

        {/* PDF Viewer row */}
        {selectedPdf && (
          <div className="card animate-fade-in" style={{ marginTop: "1.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h2 style={{ fontSize: "0.8125rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "hsl(var(--muted-foreground))" }}>
                Document Viewer
              </h2>
              <button
                className="btn btn-ghost"
                onClick={() => {
                  setSelectedPdf(null);
                  setSelectedBbox(null);
                }}
                style={{ padding: "0.375rem", minWidth: "auto" }}
              >
                <X size={14} />
              </button>
            </div>
            <PdfViewer
              url={selectedPdf}
              initialPage={selectedPage}
              highlightBbox={selectedBbox ?? undefined}
            />
          </div>
        )}
      </div>

      {/* Citation dialog */}
      {activeCitation && (
        <CitationDialog clause={activeCitation} onClose={() => setActiveCitation(null)} />
      )}
    </div>
  );
}
