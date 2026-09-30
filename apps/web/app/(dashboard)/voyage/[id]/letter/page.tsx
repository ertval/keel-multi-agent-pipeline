"use client";

import { use, useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { fetchVoyageDetail, formatUsd, assessmentLabel, API_BASE_URL, USE_MOCK } from "@/lib/api";
import { sanitizeLetterHtml } from "@/lib/sanitize-html";
import type { VoyageDetailResponse } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, Printer, Anchor, Loader2, Send, Info } from "lucide-react";

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
  const [pdfBusy, setPdfBusy] = useState(false);
  const [pdfNotice, setPdfNotice] = useState<string | null>(null);

  const safeLetterHtml = useMemo(
    () => (letterHtml ? sanitizeLetterHtml(letterHtml) : null),
    [letterHtml]
  );

  useEffect(() => {
    fetchVoyageDetail(id)
      .then((d) => {
        setData(d);
        // Try fetching the rendered letter from the API
        if (!USE_MOCK) {
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

  const handleDownloadPdf = async () => {
    setPdfBusy(true);
    setPdfNotice(null);
    try {
      const res = await fetch(`${API_BASE_URL}/voyages/${id}/letter?format=pdf`);
      if (!res.ok) {
        setPdfNotice(
          `PDF export was refused by the letter service (HTTP ${res.status}). Use Print → Save as PDF instead.`
        );
        return;
      }
      const contentType = res.headers.get("content-type") ?? "";
      if (!contentType.includes("application/pdf")) {
        setPdfNotice(
          `The letter service answered with ${contentType || "an unlabelled response"} instead of a PDF, so nothing was downloaded. Use Print → Save as PDF instead.`
        );
        return;
      }
      const objectUrl = URL.createObjectURL(await res.blob());
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = `keel-claim-letter-${id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(objectUrl);
    } catch {
      setPdfNotice(
        "The letter service could not be reached, so nothing was downloaded. Use Print → Save as PDF instead."
      );
    } finally {
      setPdfBusy(false);
    }
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
          aria-label="Back to reconciliation"
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
          <button
            className="btn btn-ghost"
            id="download-letter-pdf-btn"
            onClick={() => void handleDownloadPdf()}
            disabled={pdfBusy}
          >
            <Download size={14} />
            {pdfBusy ? "Checking…" : "Download PDF"}
          </button>
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

      {pdfNotice && (
        <div
          id="letter-pdf-notice"
          role="status"
          className="animate-fade-in"
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "0.625rem",
            maxWidth: 1400,
            margin: "1.25rem auto 0",
            padding: "0.75rem 1rem",
            fontSize: "0.8125rem",
            lineHeight: 1.5,
            color: "hsl(var(--foreground) / 0.85)",
            background: "hsl(var(--charterer-bg))",
            border: "1px solid hsl(var(--charterer) / 0.3)",
            borderRadius: "var(--radius)",
          }}
        >
          <Info size={15} style={{ color: "hsl(var(--charterer))", flexShrink: 0, marginTop: 2 }} />
          <span>{pdfNotice}</span>
        </div>
      )}

      <div className="page-content" style={{ maxWidth: 1400, margin: "2rem auto" }}>
        <div
          id="letter-document"
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
          {safeLetterHtml ? (
            <div dangerouslySetInnerHTML={{ __html: safeLetterHtml }} />
          ) : rec ? (
            /* Fallback: assembled from the same reconciliation the API serves */
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
                laytime and demurrage statement. Weather exceptions are assessed against the weather terms agreed
                in this charterparty; the Laytime Definitions supply only the measurement basis for an excepted
                period.
              </p>

              <p style={{ marginBottom: "1.5rem" }}>
                The Owner&apos;s total claimed: <strong>{formatUsd(rec.owner_calculation.total_usd)}</strong>.<br />
                The Charterer&apos;s total claimed: <strong>{formatUsd(rec.charterer_calculation.total_usd)}</strong>.
              </p>

              <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "1rem", marginTop: "2rem" }}>Per-Day Assessment</h2>

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
                      <em>Weather:</em>{" "}
                      {v.weather.wind_force_beaufort === null
                        ? "Beaufort force not recorded"
                        : `Beaufort Force ${v.weather.wind_force_beaufort}`}
                      ,{" "}
                      {v.weather.precipitation_mm === null
                        ? "no precipitation figure recorded"
                        : `${v.weather.precipitation_mm}mm precipitation`}
                      , {v.weather.adverse_hours}h adverse.
                    </p>
                    <p>
                      <strong>Keel assessment: {assessmentLabel(v.verdict)}</strong>
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

              <p style={{ marginTop: "2.5rem", fontSize: "0.8rem", color: "#666", fontStyle: "italic" }}>
                Generated by Keel &middot;{" "}
                {rec.day_verdicts[0]?.measurement_basis
                  ? `excepted periods are measured on the basis given by ${rec.day_verdicts[0].measurement_basis}. That source supplies the measurement basis only: the weather thresholds and the test for invoking the weather exception are the ones stated in the charter party for this voyage.`
                  : "No measurement basis was recorded for this voyage."}{" "}
                This notice is advisory negotiation support. It is not a legal
                opinion, an arbitration award, or a binding determination, and it
                does not constitute legal advice.
              </p>
            </>
          ) : (
            <p style={{ color: "#555", textAlign: "center", padding: "4rem" }}>
              No letter is available for this voyage. Re-run the analysis from the upload dialog, then open
              the letter again.
            </p>
          )}
        </div>
      </div>

      {showConfirm && (
        <ConfirmationDialog
          open={showConfirm}
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
  open: boolean;
  onClose: () => void;
  vesselName: string;
  reconciledTotal: string;
  voyageId: string;
}

function ConfirmationDialog({
  open,
  onClose,
  vesselName,
  reconciledTotal,
  voyageId,
}: ConfirmationDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent showCloseButton style={{ maxWidth: 480 }}>
        <DialogHeader>
          <div
            style={{
              width: 56,
              height: 56,
              background: "hsl(var(--muted-foreground) / 0.12)",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "hsl(var(--muted-foreground))",
            }}
          >
            <Info size={28} />
          </div>
          <DialogTitle>Delivery Is Not Available</DialogTitle>
          <DialogDescription>
            Keel cannot send this letter. Nothing has been transmitted to the other
            party and nothing is queued. Print or save the letter, then send it from
            your own mail client.
          </DialogDescription>
        </DialogHeader>
        <div
          style={{
            width: "100%",
            background: "hsl(var(--surface-2))",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius)",
            padding: "1rem",
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
            <span style={{ color: "var(--muted-foreground)" }}>Delivery</span>
            <span style={{ fontWeight: 600, color: "hsl(var(--muted-foreground))" }}>
              Not sent — no delivery service is connected
            </span>
          </div>
        </div>
        <DialogFooter>
          <Button
            className="btn btn-primary"
            onClick={() => {
              onClose();
              window.print();
            }}
            style={{ flex: 1, justifyContent: "center" }}
          >
            <Printer size={14} />
            Print / Save as PDF
          </Button>
          <Button variant="ghost" onClick={onClose} style={{ flex: 1, justifyContent: "center" }}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
