"use client";

import { useCallback, useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Ship,
  Scale,
  DollarSign,
  Clock,
  Plus,
  ArrowRight,
  TrendingUp,
  Upload,
  FileText,
  CheckCircle,
  Loader2,
  AlertCircle,
  ChevronDown,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import { useDropzone } from "react-dropzone";
import { useRouter } from "next/navigation";
import { fetchVoyages, formatUsd, pollVoyageStatus, updateVoyageStatus, uploadVoyageFiles, deleteVoyage } from "@/lib/api";
import type { VoyageStatus, VoyageSummary } from "@/lib/types";

const STATUS_FALLBACK: VoyageStatus = "Processing";

type DashboardStat = {
  label: string;
  value: string;
  change: string;
  icon: typeof Ship;
  color: string;
};

type DashboardVoyageRow = {
  id: string;
  vessel: string;
  ownerName: string;
  status: VoyageStatus;
  ownerClaim: string;
  chartererClaim: string;
  reconciled: string;
  date: string;
};

function formatDate(value?: string): string {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "—";
  return parsed.toISOString().slice(0, 10);
}

function formatDuration(seconds?: number | null): string {
  if (seconds == null) return "—";
  if (seconds < 60) return `${Math.round(seconds)}s`;
  if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
  return `${Math.round(seconds / 3600)}h`;
}

function buildStats(voyages: VoyageSummary[], loading: boolean): DashboardStat[] {
  const totalVoyages = voyages.length;
  const disputedCount = voyages.reduce(
    (total, voyage) => total + (voyage.disputed_count ?? 0),
    0
  );
  const reconciledValue = voyages.reduce(
    (total, voyage) => total + (voyage.reconciled_total_usd ?? 0),
    0
  );
  const timingValues = voyages
    .map((voyage) => voyage.resolution_seconds)
    .filter((value): value is number => typeof value === "number");
  const avgResolution = timingValues.length
    ? timingValues.reduce((a, b) => a + b, 0) / timingValues.length
    : null;

  const latestDate = formatDate(voyages[0]?.created_at);
  const totalLabel = loading
    ? "Loading..."
    : totalVoyages
      ? `Latest: ${latestDate}`
      : "No voyages yet";
  const disputesLabel = loading
    ? "Loading..."
    : disputedCount
      ? `${disputedCount} disputed items`
      : "No active disputes";
  const reconciledLabel = loading
    ? "Loading..."
    : totalVoyages
      ? `Across ${totalVoyages} voyages`
      : "No reconciliations yet";
  const resolutionLabel = loading
    ? "Loading..."
    : timingValues.length
      ? `Across ${timingValues.length} voyages`
      : "No timing data";

  return [
    {
      label: "Total Voyages",
      value: loading ? "—" : String(totalVoyages),
      change: totalLabel,
      icon: Ship,
      color: "var(--chart-1)",
    },
    {
      label: "Active Disputes",
      value: loading ? "—" : String(disputedCount),
      change: disputesLabel,
      icon: Scale,
      color: "var(--chart-4)",
    },
    {
      label: "Reconciled Value",
      value: loading ? "—" : formatUsd(reconciledValue),
      change: reconciledLabel,
      icon: DollarSign,
      color: "hsl(var(--owner))",
    },
    {
      label: "Avg Resolution",
      value: loading ? "—" : formatDuration(avgResolution),
      change: resolutionLabel,
      icon: Clock,
      color: "var(--chart-5)",
    },
  ];
}

function buildRows(voyages: VoyageSummary[]): DashboardVoyageRow[] {
  return voyages.map((voyage) => ({
    id: voyage.voyage_id,
    vessel: voyage.vessel_name ?? voyage.voyage_id,
    ownerName: voyage.owner_name ?? "—",
    status: voyage.status ?? STATUS_FALLBACK,
    ownerClaim:
      voyage.owner_total_usd != null ? formatUsd(voyage.owner_total_usd) : "—",
    chartererClaim:
      voyage.charterer_total_usd != null ? formatUsd(voyage.charterer_total_usd) : "—",
    reconciled:
      voyage.reconciled_total_usd != null
        ? formatUsd(voyage.reconciled_total_usd)
        : "—",
    date: formatDate(voyage.created_at),
  }));
}

const EXPECTED_FILES = [
  { name: "charterparty.pdf", label: "Charterparty", type: "pdf" },
  { name: "sof_owner.pdf", label: "Owner SOF", type: "pdf" },
  { name: "sof_charterer.pdf", label: "Charterer SOF", type: "pdf" },
  { name: "claim_owner.pdf", label: "Owner Claim", type: "pdf" },
  { name: "claim_charterer.pdf", label: "Charterer Claim", type: "pdf" },
  { name: "weather_port_xyz.json", label: "Weather Record", type: "json" },
];

type UploadState = "idle" | "uploading" | "success" | "error";

function UploadDialogContent() {
  const router = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [statusMsg, setStatusMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const onDrop = useCallback((accepted: File[]) => {
    setFiles((prev) => {
      const map = new Map(prev.map((f) => [f.name, f]));
      accepted.forEach((f) => map.set(f.name, f));
      return Array.from(map.values());
    });
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "application/json": [".json"],
    },
    multiple: true,
  });

  const handleUpload = async () => {
    if (files.length === 0) return;
    setUploadState("uploading");
    setStatusMsg("Uploading documents…");
    setErrorMsg("");
    try {
      const result = await uploadVoyageFiles(files);
      await pollVoyageStatus(result.voyage_id, (msg) => setStatusMsg(msg));
      setUploadState("success");
      setStatusMsg("Done!");
      setTimeout(() => {
        router.push(`/voyage/${result.voyage_id}`);
      }, 600);
    } catch (err) {
      setUploadState("error");
      setErrorMsg(err instanceof Error ? err.message : "Upload failed");
    }
  };

  const handleDemoMode = () => {
    router.push("/voyage/voyage_001");
  };

  const matchedFiles = EXPECTED_FILES.map((expected) => ({
    ...expected,
    matched: files.find((f) => f.name === expected.name) ?? null,
  }));

  return (
    <div style={{ display: "grid", gap: "1.25rem" }}>
      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={`dropzone ${isDragActive ? "active" : ""}`}
      >
        <input {...getInputProps()} id="file-dropzone" />
        <div
          style={{
            width: 48,
            height: 48,
            background: "oklch(0.65 0.18 250 / 0.1)",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 0.75rem",
            color: "var(--primary)",
          }}
        >
          <Upload size={22} />
        </div>
        <p style={{ fontWeight: 600, marginBottom: "0.25rem", fontSize: "0.9375rem" }}>
          {isDragActive ? "Drop files here…" : "Drop voyage documents here"}
        </p>
        <p style={{ fontSize: "0.8125rem", color: "var(--muted-foreground)" }}>
          5 PDFs + 1 JSON · or click to browse
        </p>
      </div>

      {/* File checklist */}
      <div style={{ display: "grid", gap: "0.375rem" }}>
        <p style={{ fontSize: "0.6875rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--muted-foreground)", marginBottom: "0.25rem" }}>
          Required documents
        </p>
        {matchedFiles.map((f) => (
          <div
            key={f.name}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.625rem",
              padding: "0.5rem 0.75rem",
              background: f.matched ? "oklch(0.65 0.15 160 / 0.06)" : "transparent",
              borderRadius: "var(--radius)",
              border: `1px solid ${f.matched ? "hsl(var(--owner) / 0.2)" : "var(--border)"}`,
              transition: "all 0.2s",
            }}
          >
            <FileText size={14} style={{ color: "var(--muted-foreground)", flexShrink: 0 }} />
            <span style={{ flex: 1, fontSize: "0.8125rem", fontWeight: 500 }}>{f.label}</span>
            <span className="mono" style={{ fontSize: "0.6875rem", color: "var(--muted-foreground)" }}>
              {f.name}
            </span>
            {f.matched ? (
              <CheckCircle size={14} style={{ color: "hsl(var(--owner))", flexShrink: 0 }} />
            ) : (
              <span style={{ width: 14, height: 14, borderRadius: "50%", border: "2px solid var(--border)", display: "block", flexShrink: 0 }} />
            )}
          </div>
        ))}
      </div>

      {/* Error */}
      {uploadState === "error" && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.625rem 0.875rem",
            background: "hsl(var(--charterer-bg))",
            border: "1px solid hsl(var(--charterer) / 0.3)",
            borderRadius: "var(--radius)",
            color: "hsl(var(--charterer))",
            fontSize: "0.8125rem",
          }}
        >
          <AlertCircle size={14} />
          {errorMsg}
        </div>
      )}

      {/* Actions */}
      <div style={{ display: "flex", gap: "0.625rem" }}>
        <Button
          id="upload-btn"
          onClick={handleUpload}
          disabled={uploadState === "uploading" || uploadState === "success" || files.length === 0}
          style={{ flex: 1 }}
        >
          {uploadState === "uploading" ? (
            <>
              <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
              {statusMsg || "Processing…"}
            </>
          ) : uploadState === "success" ? (
            <>
              <CheckCircle size={16} />
              Redirecting…
            </>
          ) : (
            <>
              <Upload size={16} />
              Analyse Voyage
            </>
          )}
        </Button>
        <Button
          id="demo-mode-btn"
          variant="outline"
          onClick={handleDemoMode}
        >
          Demo Mode
        </Button>
      </div>
    </div>
  );
}

type DashboardContentProps = {
  title: string;
  subtitle: string;
  showGraphs?: boolean;
};

type DeleteConfirmState = {
  open: boolean;
  target: DashboardVoyageRow | null;
};

export function DashboardContent({ title, subtitle, showGraphs = true }: DashboardContentProps) {
  const [voyageSummaries, setVoyageSummaries] = useState<VoyageSummary[]>([]);
  const [loadingVoyages, setLoadingVoyages] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<DeleteConfirmState>({ open: false, target: null });
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [hoveredBarIndex, setHoveredBarIndex] = useState<number | null>(null);
  const [hoveredSliceIndex, setHoveredSliceIndex] = useState<number | null>(null);

  const handleStatusChange = async (voyageId: string, newStatus: VoyageStatus) => {
    // Optimistic update so the badge flips instantly
    setVoyageSummaries((prev) =>
      prev.map((v) => v.voyage_id === voyageId ? { ...v, status: newStatus } : v)
    );
    try {
      await updateVoyageStatus(voyageId, newStatus);
    } catch {
      // Revert on failure
      fetchVoyages().then(setVoyageSummaries).catch(() => {});
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm.target) return;
    const id = deleteConfirm.target.id;
    setDeletingId(id);
    try {
      await deleteVoyage(id);
      setVoyageSummaries((prev) => prev.filter((v) => v.voyage_id !== id));
    } catch {
      // just close on failure
    } finally {
      setDeleteConfirm({ open: false, target: null });
      setDeletingId(null);
    }
  };

  useEffect(() => {
    let active = true;
    let pollTimer: ReturnType<typeof setTimeout> | null = null;

    const load = (isFirst: boolean) => {
      if (isFirst) {
        setLoadingVoyages(true);
        setLoadError(null);
      }

      fetchVoyages()
        .then((data) => {
          if (!active) return;
          setVoyageSummaries(data);
          setLoadError(null);
          // Keep polling as long as any voyage is still processing
          const hasProcessing = data.some(
            (v) => v.status === "Processing" || v.status === "Pending"
          );
          if (hasProcessing) {
            pollTimer = setTimeout(() => load(false), 2000);
          }
        })
        .catch((err) => {
          if (!active) return;
          setLoadError(err instanceof Error ? err.message : "Failed to load voyages");
        })
        .finally(() => {
          if (active) setLoadingVoyages(false);
        });
    };

    load(true);

    return () => {
      active = false;
      if (pollTimer) clearTimeout(pollTimer);
    };
  }, []);

  const barChartData = useMemo(() => {
    const candidates = voyageSummaries.slice(0, 5);
    if (candidates.length === 0) return null;

    const allValues = candidates.flatMap((v) => [
      v.owner_total_usd ?? 0,
      v.charterer_total_usd ?? 0,
      v.reconciled_total_usd ?? 0,
    ]);
    const maxValue = Math.max(...allValues, 10000) * 1.1;
    const minValue = 0;

    const width = 560;
    const height = 140;
    const paddingX = 60;
    const paddingY = 24;

    const chartWidth = width - paddingX - 20;
    const chartHeight = height - paddingY - 8;

    const ticks = Array.from({ length: 4 }, (_, i) => {
      const val = minValue + ((maxValue - minValue) / 3) * i;
      return {
        y: height - paddingY - (i / 3) * chartHeight,
        label: formatUsd(val),
      };
    });

    return {
      candidates,
      maxValue,
      width,
      height,
      paddingX,
      paddingY,
      chartWidth,
      chartHeight,
      ticks,
    };
  }, [voyageSummaries]);

  const donutData = useMemo(() => {
    const total = voyageSummaries.length;
    if (total === 0) return null;

    const statusCounts = voyageSummaries.reduce(
      (acc, curr) => {
        const s = curr.status ?? STATUS_FALLBACK;
        if (s === "Reconciled") acc.reconciled++;
        else if (s === "Closed") acc.closed++;
        else if (s === "In Review") acc.inReview++;
        else if (s === "Processing" || s === "Pending") acc.processing++;
        else if (s === "Error") acc.error++;
        return acc;
      },
      { reconciled: 0, closed: 0, inReview: 0, processing: 0, error: 0 }
    );

    const r = 50;
    const circumference = 2 * Math.PI * r;

    const slices: { strokeDasharray: string; strokeDashoffset: number; color: string; label: string; count: number; key: string }[] = [];
    let accumulatedAngle = 0;

    const addSlice = (count: number, color: string, label: string, key: string) => {
      if (count === 0) return;
      const length = (count / total) * circumference;
      slices.push({
        strokeDasharray: `${length} ${circumference}`,
        strokeDashoffset: -accumulatedAngle,
        color,
        label,
        count,
        key,
      });
      accumulatedAngle += length;
    };

    addSlice(
      statusCounts.reconciled,
      "color-mix(in srgb, hsl(var(--owner)) 65%, var(--muted-foreground) 35%)",
      "Reconciled",
      "Reconciled"
    );
    addSlice(
      statusCounts.inReview,
      "color-mix(in srgb, var(--chart-4) 65%, var(--muted-foreground) 35%)",
      "In Review",
      "In Review"
    );
    addSlice(
      statusCounts.processing,
      "color-mix(in srgb, var(--chart-1) 60%, var(--muted-foreground) 40%)",
      "Processing",
      "Processing"
    );
    addSlice(
      statusCounts.closed,
      "color-mix(in srgb, var(--muted-foreground) 75%, transparent 25%)",
      "Closed",
      "Closed"
    );
    addSlice(
      statusCounts.error,
      "color-mix(in srgb, hsl(var(--charterer)) 60%, var(--muted-foreground) 40%)",
      "Error",
      "Error"
    );

    return { slices, total, counts: statusCounts };
  }, [voyageSummaries]);

  const stats = buildStats(voyageSummaries, loadingVoyages);
  const tableVoyages = buildRows(voyageSummaries);

  return (
    <div
      style={{
        padding: "1rem 1.5rem",
        height: "calc(100vh - 57px)",
        display: "flex",
        flexDirection: "column",
        gap: "0.75rem",
        overflow: "hidden",
        boxSizing: "border-box",
      }}
    >
      {/* Page header */}
      <div
        className="animate-fade-in"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexShrink: 0,
        }}
      >
        <div>
          <h1
            className="font-display"
            style={{ fontSize: "1.5rem", fontWeight: 800, letterSpacing: "-0.02em" }}
          >
            {title}
          </h1>
          <p style={{ fontSize: "0.8125rem", color: "var(--muted-foreground)" }}>
            {subtitle}
          </p>
        </div>
        <Dialog>
          <DialogTrigger render={<Button id="new-voyage-btn" />}>
            <Plus size={16} />
            New Voyage Analysis
          </DialogTrigger>
          <DialogContent style={{ maxWidth: 560 }}>
            <DialogHeader>
              <DialogTitle>New Voyage Analysis</DialogTitle>
            </DialogHeader>
            <UploadDialogContent />
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats cards */}
      <div
        className="animate-slide-up"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "0.75rem",
          flexShrink: 0,
        }}
      >
        {stats.map((stat, i) => (
          <Card
            key={stat.label}
            className="animate-slide-up"
            style={{
              animationDelay: `${i * 0.08}s`,
              background: "var(--card)",
              border: "1px solid var(--border)",
            }}
          >
            <CardContent style={{ padding: "0.625rem 0.875rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.375rem" }}>
                <p style={{ fontSize: "0.7rem", fontWeight: 500, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  {stat.label}
                </p>
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 6,
                    background: `color-mix(in oklch, ${stat.color} 12%, transparent)`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <stat.icon size={14} style={{ color: stat.color }} />
                </div>
              </div>
              <p
                className="font-display"
                style={{ fontSize: "1.5rem", fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1, marginBottom: "0.25rem" }}
              >
                {stat.value}
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                <TrendingUp size={10} style={{ color: "hsl(var(--owner))" }} />
                <span style={{ fontSize: "0.7rem", color: "var(--muted-foreground)" }}>
                  {stat.change}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Analytics Graphs Section */}
      {showGraphs && !loadingVoyages && voyageSummaries.length > 0 && (
        <div
          className="animate-slide-up"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: "0.75rem",
            flexShrink: 0,
            animationDelay: "0.2s",
          }}
        >
          {/* Grouped Bar Chart Card */}
          <Card style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <CardHeader style={{ display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: "0.625rem 0.875rem", paddingBottom: "0.375rem" }}>
              <div>
                <CardTitle style={{ fontSize: "0.875rem", fontWeight: 600 }}>Voyage Claims Comparison</CardTitle>
                <p style={{ fontSize: "0.7rem", color: "var(--muted-foreground)" }}>
                  Financial comparison of stated claims vs reconciled total
                </p>
              </div>
              <div style={{ display: "flex", gap: "0.625rem", fontSize: "0.65rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.2rem" }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: "color-mix(in srgb, hsl(var(--charterer)) 65%, var(--muted-foreground) 35%)" }} />
                  <span style={{ color: "var(--muted-foreground)" }}>Owner</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.2rem" }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: "color-mix(in srgb, var(--chart-1) 60%, var(--muted-foreground) 40%)" }} />
                  <span style={{ color: "var(--muted-foreground)" }}>Charterer</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.2rem" }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: "color-mix(in srgb, hsl(var(--owner)) 65%, var(--muted-foreground) 35%)" }} />
                  <span style={{ color: "var(--muted-foreground)" }}>Reconciled</span>
                </div>
              </div>
            </CardHeader>
            <CardContent style={{ position: "relative", padding: "0 0.875rem 0.625rem" }}>
              {barChartData && barChartData.candidates.length > 0 ? (
                <div style={{ width: "100%", height: 140, position: "relative" }}>
                  <svg
                    viewBox={`0 0 ${barChartData.width} ${barChartData.height}`}
                    style={{ width: "100%", height: "100%", overflow: "visible" }}
                  >
                    <defs>
                      <linearGradient id="bar-owner" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="color-mix(in srgb, hsl(var(--charterer)) 65%, var(--muted-foreground) 35%)" stopOpacity="0.9" />
                        <stop offset="100%" stopColor="color-mix(in srgb, hsl(var(--charterer)) 65%, var(--muted-foreground) 35%)" stopOpacity="0.3" />
                      </linearGradient>
                      <linearGradient id="bar-charterer" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="color-mix(in srgb, var(--chart-1) 60%, var(--muted-foreground) 40%)" stopOpacity="0.9" />
                        <stop offset="100%" stopColor="color-mix(in srgb, var(--chart-1) 60%, var(--muted-foreground) 40%)" stopOpacity="0.3" />
                      </linearGradient>
                      <linearGradient id="bar-reconciled" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="color-mix(in srgb, hsl(var(--owner)) 65%, var(--muted-foreground) 35%)" stopOpacity="0.9" />
                        <stop offset="100%" stopColor="color-mix(in srgb, hsl(var(--owner)) 65%, var(--muted-foreground) 35%)" stopOpacity="0.3" />
                      </linearGradient>
                    </defs>

                    {/* Grid lines */}
                    {barChartData.ticks.map((tick, i) => (
                      <g key={i}>
                        <line
                          x1={barChartData.paddingX}
                          y1={tick.y}
                          x2={barChartData.width - 20}
                          y2={tick.y}
                          stroke="var(--border)"
                          strokeWidth={1}
                          strokeDasharray={4}
                          style={{ opacity: 0.5 }}
                        />
                        <text
                          x={barChartData.paddingX - 10}
                          y={tick.y + 4}
                          textAnchor="end"
                          fill="var(--muted-foreground)"
                          style={{ fontSize: "0.625rem", fontFamily: "var(--font-mono, monospace)" }}
                        >
                          {tick.label}
                        </text>
                      </g>
                    ))}

                    {/* Bar groups */}
                    {barChartData.candidates.map((voyage, i) => {
                      const groupCount = barChartData.candidates.length;
                      const groupWidth = barChartData.chartWidth / groupCount;
                      
                      const barWidth = Math.max(10, groupWidth * 0.18);
                      const barGap = 3;
                      const groupTotalWidth = 3 * barWidth + 2 * barGap;
                      const startX = barChartData.paddingX + (i * groupWidth) + (groupWidth - groupTotalWidth) / 2;

                      const ownerVal = voyage.owner_total_usd ?? 0;
                      const chartererVal = voyage.charterer_total_usd ?? 0;
                      const reconciledVal = voyage.reconciled_total_usd ?? 0;

                      const ownerH = (ownerVal / barChartData.maxValue) * barChartData.chartHeight;
                      const chartererH = (chartererVal / barChartData.maxValue) * barChartData.chartHeight;
                      const reconciledH = (reconciledVal / barChartData.maxValue) * barChartData.chartHeight;

                      const ownerY = barChartData.height - barChartData.paddingY - ownerH;
                      const chartererY = barChartData.height - barChartData.paddingY - chartererH;
                      const reconciledY = barChartData.height - barChartData.paddingY - reconciledH;

                      const isHovered = hoveredBarIndex === i;

                      return (
                        <g key={voyage.voyage_id} style={{ opacity: hoveredBarIndex === null || isHovered ? 1 : 0.6, transition: "opacity 0.2s" }}>
                          {/* Owner Bar */}
                          <rect
                            x={startX}
                            y={ownerY}
                            width={barWidth}
                            height={Math.max(2, ownerH)}
                            fill="url(#bar-owner)"
                            rx={2}
                          />

                          {/* Charterer Bar */}
                          <rect
                            x={startX + barWidth + barGap}
                            y={chartererY}
                            width={barWidth}
                            height={Math.max(2, chartererH)}
                            fill="url(#bar-charterer)"
                            rx={2}
                          />

                          {/* Reconciled Bar */}
                          <rect
                            x={startX + 2 * (barWidth + barGap)}
                            y={reconciledY}
                            width={barWidth}
                            height={Math.max(2, reconciledH)}
                            fill="url(#bar-reconciled)"
                            rx={2}
                          />

                          {/* X-axis Label */}
                          <text
                            x={startX + groupTotalWidth / 2}
                            y={barChartData.height - 8}
                            textAnchor="middle"
                            fill={isHovered ? "var(--foreground)" : "var(--muted-foreground)"}
                            style={{ fontSize: "0.6875rem", fontWeight: isHovered ? 600 : 500, transition: "color 0.2s" }}
                          >
                            {voyage.vessel_name ? voyage.vessel_name.split(" ").slice(-1)[0] : voyage.voyage_id}
                          </text>

                          {/* Interactive Hover Area */}
                          <rect
                            x={barChartData.paddingX + i * groupWidth}
                            y={barChartData.paddingY}
                            width={groupWidth}
                            height={barChartData.chartHeight}
                            fill="transparent"
                            style={{ cursor: "pointer" }}
                            onMouseEnter={() => setHoveredBarIndex(i)}
                            onMouseLeave={() => setHoveredBarIndex(null)}
                          />
                        </g>
                      );
                    })}
                  </svg>

                  {/* Floating tooltip */}
                  {hoveredBarIndex !== null && barChartData.candidates[hoveredBarIndex] && (() => {
                    const voyage = barChartData.candidates[hoveredBarIndex];
                    const ownerVal = voyage.owner_total_usd ?? 0;
                    const reconciledVal = voyage.reconciled_total_usd ?? 0;
                    const savings = Math.max(0, ownerVal - reconciledVal);

                    const groupCount = barChartData.candidates.length;
                    const groupWidth = barChartData.chartWidth / groupCount;
                    const groupCenterX = barChartData.paddingX + (hoveredBarIndex * groupWidth) + (groupWidth / 2);

                    const tooltipLeft = groupCenterX > barChartData.width / 2;

                    return (
                      <div
                        style={{
                          position: "absolute",
                          top: "10px",
                          ...(tooltipLeft ? { left: "10px" } : { right: "10px" }),
                          background: "var(--popover)",
                          border: "1px solid var(--border)",
                          borderRadius: "8px",
                          padding: "0.75rem",
                          zIndex: 30,
                          boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
                          width: "190px",
                          animation: "fadeIn 0.15s ease",
                        }}
                      >
                        <p style={{ fontSize: "0.8125rem", fontWeight: 700, borderBottom: "1px solid var(--border)", paddingBottom: "0.25rem", marginBottom: "0.5rem", color: "var(--foreground)" }}>
                          {voyage.vessel_name ?? voyage.voyage_id}
                        </p>
                        <div style={{ display: "grid", gap: "0.25rem", fontSize: "0.75rem" }}>
                          <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <span style={{ color: "var(--muted-foreground)" }}>Owner Claim:</span>
                            <span className="mono" style={{ color: "color-mix(in srgb, hsl(var(--charterer)) 65%, var(--muted-foreground) 35%)", fontWeight: 500 }}>
                              {formatUsd(ownerVal)}
                            </span>
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <span style={{ color: "var(--muted-foreground)" }}>Charterer:</span>
                            <span className="mono" style={{ color: "color-mix(in srgb, var(--chart-1) 60%, var(--muted-foreground) 40%)", fontWeight: 500 }}>
                              {formatUsd(voyage.charterer_total_usd ?? 0)}
                            </span>
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between", paddingTop: "0.25rem", borderTop: "1px dashed var(--border)", marginTop: "0.25rem" }}>
                            <span style={{ color: "var(--foreground)", fontWeight: 600 }}>Reconciled:</span>
                            <span className="mono" style={{ color: "color-mix(in srgb, hsl(var(--owner)) 65%, var(--muted-foreground) 35%)", fontWeight: 700 }}>
                              {formatUsd(reconciledVal)}
                            </span>
                          </div>
                          {savings > 0 && (
                            <div style={{ display: "flex", justifyContent: "space-between", paddingTop: "0.15rem", color: "color-mix(in srgb, hsl(var(--owner)) 65%, var(--muted-foreground) 35%)" }}>
                              <span style={{ fontWeight: 600 }}>Savings:</span>
                              <span className="mono" style={{ fontWeight: 700 }}>
                                {formatUsd(savings)}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              ) : (
                <div style={{ height: 140, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--muted-foreground)" }}>
                  No voyage data available.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Donut Chart Card */}
          <Card style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <CardHeader style={{ padding: "0.625rem 0.875rem", paddingBottom: "0.375rem" }}>
              <CardTitle style={{ fontSize: "0.875rem", fontWeight: 600 }}>Fleet Audit Status</CardTitle>
              <p style={{ fontSize: "0.7rem", color: "var(--muted-foreground)" }}>
                Breakdown of audit resolution across the active fleet
              </p>
            </CardHeader>
            <CardContent style={{ display: "flex", alignItems: "center", gap: "1rem", height: 140, padding: "0 0.875rem 0.625rem" }}>
              {donutData && donutData.total > 0 ? (
                <>
                  <div style={{ position: "relative", width: 90, height: 90, flexShrink: 0, margin: "0 auto" }}>
                    <svg width="100%" height="100%" viewBox="0 0 120 120">
                      {donutData.slices.map((slice, i) => {
                        const isHovered = hoveredSliceIndex === i;
                        return (
                          <circle
                            key={slice.key}
                            cx="60"
                            cy="60"
                            r="50"
                            fill="transparent"
                            stroke={slice.color}
                            strokeWidth={isHovered ? 16 : 12}
                            strokeDasharray={slice.strokeDasharray}
                            strokeDashoffset={slice.strokeDashoffset}
                            transform="rotate(-90 60 60)"
                            style={{
                              transition: "stroke-width 0.2s, opacity 0.2s",
                              cursor: "pointer",
                              opacity: hoveredSliceIndex === null || isHovered ? 1 : 0.7,
                            }}
                            onMouseEnter={() => setHoveredSliceIndex(i)}
                            onMouseLeave={() => setHoveredSliceIndex(null)}
                          />
                        );
                      })}
                    </svg>
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        pointerEvents: "none",
                      }}
                    >
                      <span className="font-display" style={{ fontSize: "1.25rem", fontWeight: 800, lineHeight: 1 }}>
                        {hoveredSliceIndex !== null ? donutData.slices[hoveredSliceIndex].count : donutData.total}
                      </span>
                      <span style={{ fontSize: "0.5rem", color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.04em", marginTop: "2px" }}>
                        {hoveredSliceIndex !== null ? donutData.slices[hoveredSliceIndex].label : "Voyages Total"}
                      </span>
                    </div>
                  </div>

                  <div style={{ flex: 1, display: "grid", gap: "0.15rem" }}>
                    {donutData.slices.map((slice, i) => {
                      const isHovered = hoveredSliceIndex === i;
                      return (
                        <div
                          key={slice.key}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "0.2rem 0.375rem",
                            background: isHovered ? "var(--secondary)" : "transparent",
                            border: `1px solid ${isHovered ? "var(--border)" : "transparent"}`,
                            borderRadius: "6px",
                            cursor: "pointer",
                            transition: "background-color 0.2s, border-color 0.2s",
                          }}
                          onMouseEnter={() => setHoveredSliceIndex(i)}
                          onMouseLeave={() => setHoveredSliceIndex(null)}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            <span style={{ width: 8, height: 8, borderRadius: "50%", background: slice.color }} />
                            <span style={{ fontSize: "0.75rem", fontWeight: isHovered ? 600 : 500 }}>{slice.label}</span>
                          </div>
                          <div style={{ textAlign: "right" }}>
                            <span className="mono" style={{ fontSize: "0.75rem", fontWeight: 700 }}>
                              {slice.count}
                            </span>
                            <span style={{ fontSize: "0.625rem", color: "var(--muted-foreground)", marginLeft: "0.25rem" }}>
                              ({Math.round((slice.count / donutData.total) * 100)}%)
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--muted-foreground)", fontSize: "0.8125rem" }}>
                  No voyage data available.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Voyages table */}
      <Card
        className="animate-slide-up"
        style={{
          animationDelay: "0.3s",
          background: "var(--card)",
          flex: 1,
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <CardHeader style={{ padding: "0.625rem 0.875rem", paddingBottom: "0.375rem", flexShrink: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <CardTitle style={{ fontSize: "0.875rem", fontWeight: 600 }}>
              Recent Voyages
            </CardTitle>
            <Badge variant="secondary" style={{ fontSize: "0.6875rem" }}>
              {tableVoyages.length} voyages
            </Badge>
          </div>
        </CardHeader>
        <CardContent style={{ padding: "0 0.875rem 0.625rem", flex: 1, minHeight: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ flex: 1, overflowY: "auto", minHeight: 0 }}>
          <Table>
            <TableHeader className="sticky top-0 bg-card z-10" style={{ background: "var(--card)" }}>
              <TableRow>
                <TableHead>Voyage</TableHead>
                <TableHead>Vessel</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Status</TableHead>
                <TableHead style={{ textAlign: "right" }}>Owner Claim</TableHead>
                <TableHead style={{ textAlign: "right" }}>Charterer Claim</TableHead>
                <TableHead style={{ textAlign: "right" }}>Reconciled</TableHead>
                <TableHead>Date</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tableVoyages.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    style={{
                      padding: "1.5rem",
                      textAlign: "center",
                      color: "var(--muted-foreground)",
                      fontSize: "0.8125rem",
                    }}
                  >
                    {loadError
                      ? loadError
                      : loadingVoyages
                        ? "Loading voyages..."
                        : "No voyages yet"}
                  </TableCell>
                </TableRow>
              ) : (
                tableVoyages.map((voyage, i) => {
                  const canOpen = voyage.status !== "Pending" && voyage.status !== "Processing" && voyage.status !== "Error";
                  return (
                    <TableRow
                      key={voyage.id}
                      className="animate-fade-in"
                      style={{ animationDelay: `${0.35 + i * 0.06}s` }}
                    >
                      <TableCell>
                        <span className="mono" style={{ fontSize: "0.8125rem", fontWeight: 500 }}>
                          {voyage.id}
                        </span>
                      </TableCell>
                      <TableCell style={{ fontWeight: 500 }}>{voyage.vessel}</TableCell>
                      <TableCell style={{ fontSize: "0.8125rem" }}>{voyage.ownerName}</TableCell>
                      <TableCell>
                        {voyage.status === "Processing" || voyage.status === "Error" ? (
                          <Badge
                            variant="outline"
                            style={{
                              fontSize: "0.6875rem",
                              ...(voyage.status === "Error" && {
                                color: "hsl(var(--charterer))",
                                borderColor: "hsl(var(--charterer) / 0.4)",
                              }),
                            }}
                          >
                            {voyage.status}
                          </Badge>
                        ) : (
                          <DropdownMenu>
                            <DropdownMenuTrigger
                              style={{
                                background: "none",
                                border: "none",
                                padding: 0,
                                cursor: "pointer",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "0.25rem",
                              }}
                            >
                              <Badge
                                variant={
                                  voyage.status === "Reconciled"
                                    ? "default"
                                    : voyage.status === "In Review"
                                      ? "secondary"
                                      : "outline"
                                }
                                style={{
                                  fontSize: "0.6875rem",
                                  gap: "0.25rem",
                                  ...(voyage.status === "Reconciled" && {
                                    background: "hsl(var(--owner-bg))",
                                    color: "hsl(var(--owner))",
                                    border: "1px solid hsl(var(--owner) / 0.3)",
                                  }),
                                  ...(voyage.status === "Closed" && {
                                    color: "var(--muted-foreground)",
                                  }),
                                }}
                              >
                                {voyage.status}
                                <ChevronDown size={10} />
                              </Badge>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" side="bottom">
                              {(["Reconciled", "In Review", "Pending", "Closed"] as VoyageStatus[]).map((s) => (
                                <DropdownMenuItem
                                  key={s}
                                  onClick={() => handleStatusChange(voyage.id, s)}
                                  style={{
                                    fontWeight: s === voyage.status ? 600 : 400,
                                  }}
                                >
                                  {s}
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </TableCell>
                      <TableCell className="mono" style={{ textAlign: "right", fontSize: "0.8125rem" }}>
                        {voyage.ownerClaim}
                      </TableCell>
                      <TableCell className="mono" style={{ textAlign: "right", fontSize: "0.8125rem" }}>
                        {voyage.chartererClaim}
                      </TableCell>
                      <TableCell
                        className="mono"
                        style={{
                          textAlign: "right",
                          fontSize: "0.8125rem",
                          fontWeight: voyage.reconciled !== "—" ? 700 : 400,
                          color: voyage.reconciled !== "—" ? "hsl(var(--owner))" : "var(--muted-foreground)",
                        }}
                      >
                        {voyage.reconciled}
                      </TableCell>
                      <TableCell style={{ fontSize: "0.8125rem", color: "var(--muted-foreground)" }}>
                        {voyage.date}
                      </TableCell>
                      <TableCell>
                        <div style={{ display: "flex", gap: "0.25rem", alignItems: "center" }}>
                          {canOpen ? (
                            <Button render={<Link href={`/voyage/${voyage.id}`} />} nativeButton={false} variant="ghost" size="sm">
                              <ArrowRight size={14} />
                            </Button>
                          ) : (
                            <Button variant="ghost" size="sm" disabled>
                              <ArrowRight size={14} />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={deletingId === voyage.id}
                            onClick={() => setDeleteConfirm({ open: true, target: voyage })}
                            style={{
                              color: "hsl(var(--charterer) / 0.6)",
                            }}
                          >
                            {deletingId === voyage.id ? (
                              <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />
                            ) : (
                              <Trash2 size={14} />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
          </div>
        </CardContent>
      </Card>

      {/* Delete confirmation dialog */}
      <Dialog
        open={deleteConfirm.open}
        onOpenChange={(open) => {
          if (!open) setDeleteConfirm({ open: false, target: null });
        }}
      >
        <DialogContent showCloseButton style={{ maxWidth: 400 }}>
          <DialogHeader>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: "hsl(var(--charterer-bg))",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "0.5rem",
              }}
            >
              <AlertTriangle size={20} style={{ color: "hsl(var(--charterer))" }} />
            </div>
            <DialogTitle>Delete Voyage</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the voyage for{" "}
              <strong>{deleteConfirm.target?.vessel ?? "this vessel"}</strong>?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>
              Cancel
            </DialogClose>
            <Button variant="destructive" onClick={handleDelete}>
              <Trash2 size={14} />
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <DashboardContent
      title="Dashboard"
      subtitle="Fleet-wide demurrage reconciliation overview"
    />
  );
}
