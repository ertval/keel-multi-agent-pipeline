"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import { fetchVoyageDetail, formatUsd } from "@/lib/api";
import type { VoyageDetailResponse, DayVerdict } from "@/lib/types";
import {
  Anchor, ArrowLeft, Wind, Droplets, Clock, BookOpen,
  ChevronDown, ChevronUp, Trophy, Loader2, FileText,
  TrendingUp, Scale
} from "lucide-react";

const BEAUFORT_LABELS: Record<number, string> = {
  0: "Calm", 1: "Light air", 2: "Light breeze", 3: "Gentle breeze",
  4: "Moderate breeze", 5: "Fresh breeze", 6: "Strong breeze",
  7: "Near gale", 8: "Gale", 9: "Severe gale", 10: "Storm",
  11: "Violent storm", 12: "Hurricane",
};

function beaufortColor(force: number) {
  if (force <= 3) return "hsl(var(--owner))";
  if (force <= 5) return "hsl(47 100% 55%)";
  if (force <= 6) return "hsl(30 100% 55%)";
  return "hsl(var(--charterer))";
}

interface DayCardProps {
  verdict: DayVerdict;
  index: number;
}

function DayCard({ verdict, index }: DayCardProps) {
  const [clauseOpen, setClauseOpen] = useState(false);
  const isOwner = verdict.verdict === "owner";
  const dateObj = new Date(verdict.date + "T00:00:00Z");
  const dateLabel = dateObj.toLocaleDateString("en-GB", {
    weekday: "short", day: "numeric", month: "long", year: "numeric",
    timeZone: "UTC",
  });

  return (
    <div
      id={`day-card-${verdict.date}`}
      className={`card animate-slide-up ${isOwner ? "verdict-card-owner" : "verdict-card-charterer"}`}
      style={{ animationDelay: `${index * 0.12}s`, display: "flex", flexDirection: "column", gap: "1.25rem" }}
    >
      {/* Date header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <p style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "hsl(var(--muted-foreground))", marginBottom: "0.25rem" }}>
            Day {index + 1}
          </p>
          <h3 style={{ fontSize: "1.0625rem", fontWeight: 700, letterSpacing: "-0.01em" }}>
            {dateLabel}
          </h3>
        </div>
        <span
          className={`badge ${isOwner ? "badge-owner" : "badge-charterer"}`}
          style={{ fontSize: "0.8125rem", padding: "0.375rem 1rem" }}
        >
          {isOwner ? <Trophy size={12} /> : <Scale size={12} />}
          {verdict.winner_label}
        </span>
      </div>

      {/* Positions */}
      <div style={{ display: "grid", gap: "0.625rem" }}>
        {[
          { party: "Owner", text: verdict.owner_position, color: "var(--owner)" },
          { party: "Charterer", text: verdict.charterer_position, color: "var(--charterer)" },
        ].map(({ party, text, color }) => (
          <div
            key={party}
            className="card-flat"
            style={{ borderLeft: `3px solid hsl(${color})` }}
          >
            <p
              style={{ fontSize: "0.6875rem", textTransform: "uppercase", letterSpacing: "0.07em", color: `hsl(${color})`, fontWeight: 600, marginBottom: "0.25rem" }}
            >
              {party}
            </p>
            <p style={{ fontSize: "0.875rem", fontStyle: "italic", color: "hsl(var(--foreground) / 0.85)", lineHeight: 1.5 }}>
              &ldquo;{text}&rdquo;
            </p>
          </div>
        ))}
      </div>

      {/* Weather record */}
      <div className="card-flat" style={{ background: "hsl(var(--surface-3))" }}>
        <p
          style={{ fontSize: "0.6875rem", textTransform: "uppercase", letterSpacing: "0.07em", color: "hsl(var(--muted-foreground))", fontWeight: 600, marginBottom: "0.625rem" }}
        >
          Weather Record
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
          <span className="weather-pill">
            <Wind size={12} style={{ color: beaufortColor(verdict.weather.wind_force_beaufort) }} />
            <span style={{ color: beaufortColor(verdict.weather.wind_force_beaufort), fontWeight: 600 }}>
              Bft {verdict.weather.wind_force_beaufort}
            </span>
            &nbsp;·&nbsp;{BEAUFORT_LABELS[verdict.weather.wind_force_beaufort]}
          </span>
          <span className="weather-pill">
            <Droplets size={12} />
            {verdict.weather.precipitation_mm} mm/h peak
          </span>
          <span className="weather-pill">
            <Clock size={12} />
            {verdict.weather.adverse_hours}h adverse
          </span>
          {verdict.weather.is_excepted && (
            <span className="badge badge-owner" style={{ fontSize: "0.65rem" }}>
              Excepted
            </span>
          )}
        </div>
      </div>

      {/* BIMCO clause */}
      <div>
        <button
          id={`clause-toggle-${verdict.date}`}
          className="btn btn-ghost"
          onClick={() => setClauseOpen((o) => !o)}
          style={{ padding: "0.375rem 0.625rem", fontSize: "0.8125rem", width: "100%", justifyContent: "space-between" }}
        >
          <span style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
            <BookOpen size={13} style={{ color: "hsl(var(--primary))" }} />
            {verdict.bimco_clause.clause_id}
          </span>
          {clauseOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </button>
        {clauseOpen && (
          <div
            className="card-flat animate-fade-in"
            style={{ marginTop: "0.375rem", borderLeft: "3px solid hsl(var(--primary))" }}
          >
            <p style={{ fontSize: "0.8125rem", fontStyle: "italic", lineHeight: 1.6, color: "hsl(var(--foreground) / 0.85)" }}>
              {verdict.bimco_clause.clause_text}
            </p>
            <p style={{ fontSize: "0.75rem", color: "hsl(var(--muted-foreground))", marginTop: "0.5rem" }}>
              <FileText size={11} style={{ display: "inline", marginRight: "0.25rem" }} />
              {verdict.bimco_clause.source_document} · p.{verdict.bimco_clause.page_number}
            </p>
          </div>
        )}
      </div>

      {/* Verdict */}
      <div
        style={{
          padding: "1rem",
          background: isOwner ? "hsl(var(--owner-bg))" : "hsl(var(--charterer-bg))",
          borderRadius: "var(--radius-sm)",
          border: `1px solid hsl(${isOwner ? "var(--owner)" : "var(--charterer)"} / 0.25)`,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
          <span
            className="badge"
            style={{
              background: "transparent",
              color: isOwner ? "hsl(var(--owner))" : "hsl(var(--charterer))",
              border: "none",
              padding: 0,
              fontSize: "0.75rem",
              fontWeight: 700,
            }}
          >
            {isOwner ? <Trophy size={12} /> : <Scale size={12} />}
            VERDICT
          </span>
          {verdict.dollars_credited_usd > 0 && (
            <span
              className="mono"
              style={{
                fontSize: "1.125rem",
                fontWeight: 700,
                color: isOwner ? "hsl(var(--owner))" : "hsl(var(--charterer))",
              }}
            >
              +{formatUsd(verdict.dollars_credited_usd)}
            </span>
          )}
        </div>
        <p style={{ fontSize: "0.875rem", lineHeight: 1.6, color: "hsl(var(--foreground) / 0.9)" }}>
          {verdict.justification}
        </p>
      </div>
    </div>
  );
}

export default function ReconciliationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [data, setData] = useState<VoyageDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchVoyageDetail(id)
      .then(setData)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", gap: "0.75rem", color: "hsl(var(--muted-foreground))" }}>
        <Loader2 size={20} style={{ animation: "spin 1s linear infinite" }} />
        Loading reconciliation…
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

  return (
    <div>
      {/* Header */}
      <header className="page-header">
        <Link
          href={`/voyage/${id}`}
          className="btn btn-ghost"
          style={{ padding: "0.375rem 0.625rem", minWidth: "auto" }}
          aria-label="Back to voyage detail"
        >
          <ArrowLeft size={16} />
        </Link>
        <Anchor size={20} style={{ color: "hsl(var(--primary))" }} />
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: "0.875rem", fontWeight: 600, margin: 0 }}>
            Reconciliation — {reconciliation.charterparty.vessel_name}
          </h1>
          <p style={{ fontSize: "0.75rem", color: "hsl(var(--muted-foreground))", margin: 0 }}>
            Voyage {id}
          </p>
        </div>
        <span className="badge badge-primary">
          BIMCO 2013
        </span>
      </header>

      <div className="page-content">
        {/* ── Top: party totals ── */}
        <div
          className="animate-fade-in"
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "1.5rem",
            marginBottom: "2rem",
          }}
        >
          {[
            {
              party: "Owner",
              total: reconciliation.owner_calculation.total_usd,
              color: "var(--owner)",
              bg: "var(--owner-bg)",
            },
            {
              party: "Charterer",
              total: reconciliation.charterer_calculation.total_usd,
              color: "var(--charterer)",
              bg: "var(--charterer-bg)",
            },
          ].map(({ party, total, color, bg }) => (
            <div
              key={party}
              className="card"
              style={{
                background: `hsl(${bg} / 0.5)`,
                borderColor: `hsl(${color} / 0.25)`,
              }}
            >
              <p
                style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.08em", color: `hsl(${color})`, fontWeight: 600, marginBottom: "0.5rem" }}
              >
                {party} position
              </p>
              <p
                style={{
                  fontSize: "3rem",
                  fontWeight: 800,
                  color: `hsl(${color})`,
                  lineHeight: 1,
                  letterSpacing: "-0.03em",
                }}
              >
                {formatUsd(total)}
              </p>
              <p style={{ fontSize: "0.8rem", color: "hsl(var(--muted-foreground))", marginTop: "0.375rem" }}>
                Claimed total
              </p>
            </div>
          ))}
        </div>

        {/* ── Day verdict cards ── */}
        <div style={{ marginBottom: "2rem" }}>
          <p
            style={{
              fontSize: "0.75rem",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "hsl(var(--muted-foreground))",
              fontWeight: 600,
              marginBottom: "1rem",
            }}
          >
            Per-day verdicts
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1.25rem" }}>
            {reconciliation.day_verdicts.map((verdict, i) => (
              <DayCard key={verdict.date} verdict={verdict} index={i} />
            ))}
          </div>
        </div>

        {/* ── B-06: Reconciled total band ── */}
        <div
          id="reconciled-total-band"
          className="verdict-band animate-slide-up"
          style={{ animationDelay: "0.4s" }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "1.5rem",
            }}
          >
            {/* Math breakdown */}
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
                <TrendingUp size={16} style={{ color: "hsl(var(--owner))" }} />
                <span
                  style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "hsl(var(--muted-foreground))", fontWeight: 600 }}
                >
                  Reconciled Total
                </span>
              </div>
              <p
                className="mono"
                style={{ fontSize: "1rem", color: "hsl(var(--foreground) / 0.8)", lineHeight: 1.7 }}
              >
                {reconciliation.math_breakdown}
              </p>
              <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.75rem", flexWrap: "wrap" }}>
                {reconciliation.day_verdicts.map((v) => {
                  const dateLabel = new Date(v.date + "T00:00:00Z").toLocaleDateString("en-GB", {
                    day: "numeric", month: "short", timeZone: "UTC",
                  });
                  return (
                    <span
                      key={v.date}
                      className={`badge ${v.verdict === "owner" ? "badge-owner" : "badge-charterer"}`}
                    >
                      {dateLabel} — {v.winner_label}
                    </span>
                  );
                })}
              </div>
            </div>

            {/* Money shot */}
            <div style={{ textAlign: "right" }}>
              <p
                style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "hsl(var(--muted-foreground))", fontWeight: 600, marginBottom: "0.5rem" }}
              >
                Reconciled total
              </p>
              <p id="reconciled-total-display" className="money-shot">
                {formatUsd(reconciliation.reconciled_total_usd)}
              </p>
              <div style={{ marginTop: "1rem", display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
                <Link
                  href={`/voyage/${id}/letter`}
                  className="btn btn-primary"
                  id="generate-claim-letter-btn"
                  title="Generate claim letter (requires A-09)"
                >
                  Generate Claim Letter
                </Link>
                <Link
                  href={`/voyage/${id}`}
                  className="btn btn-ghost"
                >
                  View Audit Trace
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
