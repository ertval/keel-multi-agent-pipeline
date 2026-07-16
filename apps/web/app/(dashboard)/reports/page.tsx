"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  FileText,
  Calendar,
  Filter,
  CheckCircle2,
  RefreshCw,
  Download,
  Trash2,
  Loader2,
  Plus,
  FileSpreadsheet,
  Layers,
  Ship,
  Scale,
  DollarSign,
  TrendingUp,
  Award,
  Clock,
  ArrowUpRight,
  Info,
} from "lucide-react";
import { fetchReconciliations, formatUsd, MOCK_RECONCILIATIONS } from "@/lib/api";
import type { ReconciliationSummary } from "@/lib/types";

// Predefined mock reports in archive
interface SavedReport {
  id: string;
  name: string;
  created_at: string;
  format: "PDF" | "EXCEL" | "CSV";
  size: string;
  vessels: string[];
}

const INITIAL_REPORTS: SavedReport[] = [
  {
    id: "rep_001",
    name: "Q1 2026 Fleet Demurrage Reconciliation Report",
    created_at: "2026-05-10T14:30:00Z",
    format: "EXCEL",
    size: "1.2 MB",
    vessels: ["MV Aegean Star", "MV Baltic Dawn", "MV Fjord Princess", "MV Golden Horizon"],
  },
  {
    id: "rep_002",
    name: "MV Aegean Star - Weather Exception Adjudication",
    created_at: "2026-06-16T18:45:00Z",
    format: "PDF",
    size: "840 KB",
    vessels: ["MV Aegean Star"],
  },
  {
    id: "rep_003",
    name: "Baltic Dawn Claim Package",
    created_at: "2026-06-14T09:15:00Z",
    format: "PDF",
    size: "1.4 MB",
    vessels: ["MV Baltic Dawn"],
  },
];

export default function ReportsPage() {
  const [reconciliations, setReconciliations] = useState<ReconciliationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVessels, setSelectedVessels] = useState<string[]>([]);
  const [selectedDateRange, setSelectedDateRange] = useState<string>("all");
  const [hoveredLineIndex, setHoveredLineIndex] = useState<number | null>(null);

  // Report Creator Modal States
  const [creatorOpen, setCreatorOpen] = useState(false);
  const [reportTitle, setReportTitle] = useState("");
  const [wizardDateRange, setWizardDateRange] = useState("all");
  const [wizardFormat, setWizardFormat] = useState<"PDF" | "EXCEL" | "CSV">("PDF");
  const [wizardVessels, setWizardVessels] = useState<string[]>([]);
  const [generating, setGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationStep, setGenerationStep] = useState("");
  const [generationSuccess, setGenerationSuccess] = useState(false);
  const [savedReports, setSavedReports] = useState<SavedReport[]>(INITIAL_REPORTS);
  const [downloadingReportId, setDownloadingReportId] = useState<string | null>(null);

  // Load Reconciliations data
  useEffect(() => {
    let active = true;
    setLoading(true);
    fetchReconciliations(1, 100)
      .then((data) => {
        if (!active) return;
        // If API returns successfully, use it; if empty, fallback to MOCK
        if (data && data.items && data.items.length > 0) {
          setReconciliations(data.items);
        } else {
          setReconciliations(MOCK_RECONCILIATIONS);
        }
        setLoading(false);
      })
      .catch(() => {
        if (!active) return;
        setReconciliations(MOCK_RECONCILIATIONS);
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  // Filter values
  const allVesselNames = useMemo(() => {
    const names = reconciliations.map((r) => r.vessel_name).filter(Boolean);
    return Array.from(new Set(names));
  }, [reconciliations]);

  // Handle vessel filter toggling
  const handleVesselToggle = (vessel: string) => {
    setSelectedVessels((prev) =>
      prev.includes(vessel) ? prev.filter((v) => v !== vessel) : [...prev, vessel]
    );
  };

  const clearVesselFilters = () => {
    setSelectedVessels([]);
  };

  // Filtered dataset
  const filteredData = useMemo(() => {
    return reconciliations.filter((r) => {
      // Vessel filter
      if (selectedVessels.length > 0 && !selectedVessels.includes(r.vessel_name)) {
        return false;
      }
      // Date filter
      if (selectedDateRange !== "all") {
        const itemDate = new Date(r.created_at);
        const anchorDate = new Date("2026-06-17T00:00:00Z"); // Hackathon current date
        if (selectedDateRange === "30days") {
          const thirtyDaysAgo = new Date(anchorDate.getTime() - 30 * 24 * 60 * 60 * 1000);
          return itemDate >= thirtyDaysAgo;
        }
        if (selectedDateRange === "ytd") {
          const startOfYear = new Date("2026-01-01T00:00:00Z");
          return itemDate >= startOfYear;
        }
        if (selectedDateRange === "q2") {
          const startOfQ2 = new Date("2026-04-01T00:00:00Z");
          const endOfQ2 = new Date("2026-06-30T23:59:59Z");
          return itemDate >= startOfQ2 && itemDate <= endOfQ2;
        }
      }
      return true;
    });
  }, [reconciliations, selectedVessels, selectedDateRange]);

  // Aggregate stats
  const stats = useMemo(() => {
    const totalCount = filteredData.length;
    const ownerClaimTotal = filteredData.reduce((acc, r) => acc + r.owner_total_usd, 0);
    const reconciledTotal = filteredData.reduce((acc, r) => acc + r.reconciled_total_usd, 0);
    const chartererClaimTotal = filteredData.reduce((acc, r) => acc + r.charterer_total_usd, 0);
    const claimsSavedTotal = ownerClaimTotal - reconciledTotal;
    const activeDisputesCount = filteredData.reduce(
      (acc, r) => acc + (r.status === "In Review" ? r.disputed_count : 0),
      0
    );

    const timingData = filteredData
      .map((r) => r.resolution_seconds)
      .filter((s): s is number => typeof s === "number");
    const avgResolutionTime = timingData.length
      ? timingData.reduce((a, b) => a + b, 0) / timingData.length
      : 0;

    const recoveryRate = ownerClaimTotal > 0 ? (reconciledTotal / ownerClaimTotal) * 100 : 0;

    return {
      totalCount,
      ownerClaimTotal,
      reconciledTotal,
      chartererClaimTotal,
      claimsSavedTotal,
      activeDisputesCount,
      avgResolutionTime,
      recoveryRate,
    };
  }, [filteredData]);

  // Chronological data for line chart
  const chronologicalData = useMemo(() => {
    return [...filteredData].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
  }, [filteredData]);

  // Donut chart status calculations
  const statusSummary = useMemo(() => {
    const statusCounts = filteredData.reduce(
      (acc, curr) => {
        const s = curr.status;
        if (s === "Reconciled") acc.reconciled++;
        else if (s === "Closed") acc.closed++;
        else if (s === "In Review" || s === "Processing" || s === "Pending") acc.inReview++;
        return acc;
      },
      { reconciled: 0, closed: 0, inReview: 0 }
    );
    return statusCounts;
  }, [filteredData]);

  // Adjudication verdict estimations
  const verdictSummary = useMemo(() => {
    // Distributing dispute verdicts logically based on voyage totals
    // Aegean Star (voyage_001): 3 disputes -> Owner: 2, Charterer: 1
    // Baltic Dawn (voyage_002): 5 disputes -> Owner: 3, Charterer: 2
    // Caspian Voyager (voyage_003): 7 disputes -> Owner: 4, Charterer: 3
    // Diamond Spirit (voyage_004): 2 disputes -> Owner: 1, Charterer: 1
    // Emerald Bay (voyage_005): 4 disputes -> Owner: 2, Charterer: 2
    // Fjord Princess (voyage_006): 6 disputes -> Owner: 4, Charterer: 2
    // Golden Horizon (voyage_007): 0 disputes
    let ownerWins = 0;
    let chartererWins = 0;
    let splitVerdicts = 0;

    filteredData.forEach((r) => {
      const disputedCount = r.disputed_count;
      if (disputedCount === 0) return;

      // Assign deterministic mock counts for visual realism
      if (r.voyage_id === "voyage_001") {
        ownerWins += 2;
        chartererWins += 1;
      } else if (r.voyage_id === "voyage_002") {
        ownerWins += 3;
        chartererWins += 2;
      } else if (r.voyage_id === "voyage_003") {
        ownerWins += 4;
        chartererWins += 3;
      } else if (r.voyage_id === "voyage_004") {
        ownerWins += 1;
        chartererWins += 1;
      } else if (r.voyage_id === "voyage_005") {
        ownerWins += 2;
        chartererWins += 2;
      } else if (r.voyage_id === "voyage_006") {
        ownerWins += 4;
        chartererWins += 2;
      } else {
        // Fallback ratio
        const half = Math.floor(disputedCount / 2);
        ownerWins += half;
        chartererWins += disputedCount - half;
        if (disputedCount % 2 !== 0 && disputedCount > 1) {
          ownerWins -= 1;
          splitVerdicts += 1;
        }
      }
    });

    const total = ownerWins + chartererWins + splitVerdicts;
    return { ownerWins, chartererWins, splitVerdicts, total };
  }, [filteredData]);

  // Line Chart Calculations
  const lineChartData = useMemo(() => {
    const width = 560;
    const height = 220;
    const paddingX = 50;
    const paddingY = 30;

    if (chronologicalData.length === 0) return null;

    // Find min and max for scaling Y-axis
    const allValues = chronologicalData.flatMap((d) => [
      d.owner_total_usd,
      d.charterer_total_usd,
      d.reconciled_total_usd,
    ]);
    const maxValue = Math.max(...allValues, 10000) * 1.1; // Add padding to top of chart
    const minValue = 0; // standard Y-axis baseline

    const scaleX = (index: number) => {
      if (chronologicalData.length <= 1) return width / 2;
      return paddingX + (index * (width - paddingX - 20)) / (chronologicalData.length - 1);
    };

    const scaleY = (val: number) => {
      const chartHeight = height - paddingY - 10;
      return height - paddingY - ((val - minValue) / (maxValue - minValue)) * chartHeight;
    };

    const ownerPoints = chronologicalData.map((d, i) => ({
      x: scaleX(i),
      y: scaleY(d.owner_total_usd),
      val: d.owner_total_usd,
    }));

    const chartererPoints = chronologicalData.map((d, i) => ({
      x: scaleX(i),
      y: scaleY(d.charterer_total_usd),
      val: d.charterer_total_usd,
    }));

    const reconciledPoints = chronologicalData.map((d, i) => ({
      x: scaleX(i),
      y: scaleY(d.reconciled_total_usd),
      val: d.reconciled_total_usd,
    }));

    // SVG path string helper
    const makePath = (pts: { x: number; y: number }[]) => {
      if (pts.length === 0) return "";
      return `M ${pts[0].x} ${pts[0].y} ` + pts.slice(1).map((p) => `L ${p.x} ${p.y}`).join(" ");
    };

    // Grid ticks (4 steps)
    const ticks = Array.from({ length: 4 }, (_, i) => {
      const val = minValue + ((maxValue - minValue) / 3) * i;
      return {
        y: scaleY(val),
        label: formatUsd(val),
      };
    });

    return {
      ownerPath: makePath(ownerPoints),
      chartererPath: makePath(chartererPoints),
      reconciledPath: makePath(reconciledPoints),
      ownerPoints,
      chartererPoints,
      reconciledPoints,
      ticks,
      width,
      height,
      paddingX,
      paddingY,
    };
  }, [chronologicalData]);

  // Donut chart stroke arrays
  const donutChartData = useMemo(() => {
    const r = 50;
    const circumference = 2 * Math.PI * r; // ~314.16
    const total = statusSummary.reconciled + statusSummary.closed + statusSummary.inReview;

    if (total === 0) {
      return {
        slices: [{ strokeDasharray: `${circumference} ${circumference}`, strokeDashoffset: 0, color: "var(--border)", label: "No Data", count: 0 }],
        total: 0,
      };
    }

    const slices = [];
    let accumulatedAngle = 0;

    // Slice 1: Reconciled
    if (statusSummary.reconciled > 0) {
      const val = statusSummary.reconciled;
      const length = (val / total) * circumference;
      slices.push({
        strokeDasharray: `${length} ${circumference}`,
        strokeDashoffset: -accumulatedAngle,
        color: "hsl(var(--owner))",
        label: "Reconciled",
        count: val,
      });
      accumulatedAngle += length;
    }

    // Slice 2: Closed
    if (statusSummary.closed > 0) {
      const val = statusSummary.closed;
      const length = (val / total) * circumference;
      slices.push({
        strokeDasharray: `${length} ${circumference}`,
        strokeDashoffset: -accumulatedAngle,
        color: "var(--muted-foreground)",
        label: "Closed",
        count: val,
      });
      accumulatedAngle += length;
    }

    // Slice 3: In Review
    if (statusSummary.inReview > 0) {
      const val = statusSummary.inReview;
      const length = (val / total) * circumference;
      slices.push({
        strokeDasharray: `${length} ${circumference}`,
        strokeDashoffset: -accumulatedAngle,
        color: "var(--chart-4)",
        label: "In Review",
        count: val,
      });
      accumulatedAngle += length;
    }

    return { slices, total };
  }, [statusSummary]);

  // Initialize wizard with available vessels
  const openReportCreator = () => {
    setReportTitle(`Demurrage Reconciliation Audit - ${new Date().toISOString().slice(0, 10)}`);
    setWizardVessels(allVesselNames);
    setWizardDateRange(selectedDateRange);
    setCreatorOpen(true);
    setGenerationSuccess(false);
    setGenerationProgress(0);
    setGenerationStep("");
  };

  const handleWizardVesselToggle = (vessel: string) => {
    setWizardVessels((prev) =>
      prev.includes(vessel) ? prev.filter((v) => v !== vessel) : [...prev, vessel]
    );
  };

  // Run mock generation progress
  const generateReport = () => {
    if (wizardVessels.length === 0) return;
    setGenerating(true);
    setGenerationProgress(0);
    setGenerationStep("Ingesting Statements of Facts and Charterparties...");

    const steps = [
      { max: 20, text: "Ingesting Statements of Facts and Charterparties..." },
      { max: 45, text: "Querying historical weather logs for load & discharge ports..." },
      { max: 70, text: "Applying BIMCO Laytime Definitions 2013 exception rules..." },
      { max: 90, text: "Calculating demurrage adjustments and compiling audit trails..." },
      { max: 99, text: "Assembling claims package and generating report files..." },
      { max: 100, text: "Done!" },
    ];

    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += Math.floor(Math.random() * 8) + 4;
      if (currentProgress >= 100) {
        currentProgress = 100;
        clearInterval(interval);
        setTimeout(() => {
          setGenerating(false);
          setGenerationSuccess(true);

          // Append newly generated report to reports table
          const newReport: SavedReport = {
            id: `rep_${Date.now()}`,
            name: reportTitle || "Custom Audit Report",
            created_at: new Date().toISOString(),
            format: wizardFormat,
            size: wizardFormat === "PDF" ? "1.8 MB" : wizardFormat === "EXCEL" ? "880 KB" : "320 KB",
            vessels: [...wizardVessels],
          };
          setSavedReports((prev) => [newReport, ...prev]);
        }, 300);
      }

      setGenerationProgress(currentProgress);
      const step = steps.find((s) => currentProgress <= s.max) || steps[steps.length - 1];
      setGenerationStep(step.text);
    }, 250);
  };

  // Simulated download
  const handleDownload = (id: string) => {
    setDownloadingReportId(id);
    setTimeout(() => {
      setDownloadingReportId(null);
      // Trigger a mock file download in browser
      const report = savedReports.find((r) => r.id === id);
      if (!report) return;
      const blob = new Blob([`Mock Report Content: ${report.name}`], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${report.name.toLowerCase().replace(/\s+/g, "_")}.${report.format.toLowerCase()}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 1000);
  };

  // Delete generated report
  const handleDeleteReport = (id: string) => {
    setSavedReports((prev) => prev.filter((r) => r.id !== id));
  };

  return (
    <div className="page-content" style={{ display: "grid", gap: "1.5rem" }}>
      {/* Page Header */}
      <div
        className="animate-fade-in"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid var(--border)",
          paddingBottom: "1.25rem",
        }}
      >
        <div>
          <h1
            className="font-display"
            style={{ fontSize: "1.75rem", fontWeight: 800, letterSpacing: "-0.02em" }}
          >
            Maritime Reports & Portfolio Analytics
          </h1>
          <p style={{ fontSize: "0.875rem", color: "var(--muted-foreground)" }}>
            Execute, schedule, and compile structured laytime audits and demurrage reconciliation summaries
          </p>
        </div>
        <Button id="create-report-btn" onClick={openReportCreator}>
          <Plus size={16} />
          Create Report
        </Button>
      </div>

      {/* Interactive Filters Grid */}
      <div
        className="animate-slide-up"
        style={{
          background: "var(--card)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius)",
          padding: "1.25rem",
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Filter size={14} style={{ color: "var(--primary)" }} />
          <span style={{ fontSize: "0.8125rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>
            Audit Portfolio Filters
          </span>
          {(selectedVessels.length > 0 || selectedDateRange !== "all") && (
            <Button
              variant="ghost"
              size="xs"
              onClick={() => {
                clearVesselFilters();
                setSelectedDateRange("all");
              }}
              style={{ marginLeft: "auto", fontSize: "0.75rem", padding: "0 0.5rem" }}
            >
              Reset Filters
            </Button>
          )}
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 2fr",
            gap: "2rem",
            alignItems: "flex-start",
          }}
        >
          {/* Date Selector */}
          <div>
            <label style={{ display: "block", fontSize: "0.75rem", color: "var(--muted-foreground)", marginBottom: "0.5rem", fontWeight: 500 }}>
              Voyage Date Range
            </label>
            <div style={{ display: "flex", gap: "0.375rem" }}>
              {[
                { id: "all", label: "All Time" },
                { id: "30days", label: "Last 30 Days" },
                { id: "q2", label: "Q2 2026" },
                { id: "ytd", label: "Year to Date" },
              ].map((range) => (
                <Button
                  key={range.id}
                  variant={selectedDateRange === range.id ? "default" : "outline"}
                  size="xs"
                  onClick={() => setSelectedDateRange(range.id)}
                  style={{ flex: 1 }}
                >
                  {range.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Vessel Multi-select pills */}
          <div>
            <label style={{ display: "block", fontSize: "0.75rem", color: "var(--muted-foreground)", marginBottom: "0.5rem", fontWeight: 500 }}>
              Vessels Included ({selectedVessels.length === 0 ? "All" : selectedVessels.length})
            </label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.375rem" }}>
              {allVesselNames.map((name) => {
                const isSelected = selectedVessels.includes(name);
                return (
                  <Badge
                    key={name}
                    variant={isSelected ? "default" : "outline"}
                    onClick={() => handleVesselToggle(name)}
                    style={{
                      cursor: "pointer",
                      padding: "0.25rem 0.625rem",
                      fontSize: "0.75rem",
                      transition: "all 0.15s ease",
                      ...(isSelected
                        ? {
                            background: "var(--primary)",
                            color: "var(--primary-foreground)",
                          }
                        : {
                            borderColor: "var(--border)",
                            color: "var(--muted-foreground)",
                          }),
                    }}
                  >
                    <Ship size={10} style={{ marginRight: "0.25rem" }} />
                    {name}
                  </Badge>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "1rem",
        }}
      >
        {[
          {
            label: "Total Audited Value",
            value: formatUsd(stats.ownerClaimTotal),
            change: `Across ${stats.totalCount} voyage claims`,
            icon: DollarSign,
            color: "var(--chart-1)",
          },
          {
            label: "Reconciled Demurrage",
            value: formatUsd(stats.reconciledTotal),
            change: `Approved audit determinations`,
            icon: Scale,
            color: "hsl(var(--owner))",
          },
          {
            label: "Claims Saved (Charterer)",
            value: formatUsd(stats.claimsSavedTotal),
            change: `Total owner claim write-downs`,
            icon: TrendingUp,
            color: "hsl(var(--owner))",
            highlight: true,
          },
          {
            label: "Demurrage Write-Down %",
            value: stats.ownerClaimTotal > 0 ? `${((stats.claimsSavedTotal / stats.ownerClaimTotal) * 100).toFixed(1)}%` : "0%",
            change: `${formatUsd(stats.ownerClaimTotal - stats.reconciledTotal)} saved in total disputes`,
            icon: Award,
            color: "var(--chart-4)",
          },
        ].map((stat, idx) => (
          <Card
            key={stat.label}
            className="animate-slide-up"
            style={{
              animationDelay: `${idx * 0.05}s`,
              background: "var(--card)",
              border: stat.highlight ? "1px solid hsl(var(--owner) / 0.4)" : "1px solid var(--border)",
              boxShadow: stat.highlight ? "0 0 16px hsl(var(--owner) / 0.08)" : "none",
            }}
          >
            <CardContent style={{ padding: "1.25rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
                <p style={{ fontSize: "0.75rem", fontWeight: 500, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  {stat.label}
                </p>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: `color-mix(in oklch, ${stat.color} 12%, transparent)`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <stat.icon size={16} style={{ color: stat.color }} />
                </div>
              </div>
              <p
                className="font-display"
                style={{
                  fontSize: "1.75rem",
                  fontWeight: 800,
                  letterSpacing: "-0.02em",
                  lineHeight: 1,
                  marginBottom: "0.375rem",
                  ...(stat.highlight && {
                    color: "hsl(var(--owner))",
                    textShadow: "0 0 12px hsl(var(--owner) / 0.3)",
                  }),
                }}
              >
                {stat.value}
              </p>
              <p style={{ fontSize: "0.75rem", color: "var(--muted-foreground)" }}>
                {stat.change}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Analytics Graphs Section */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "3fr 2fr",
          gap: "1.5rem",
        }}
      >
        {/* Voyage Claims Value Comparison Line Chart */}
        <Card style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <CardHeader style={{ display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingBottom: "0.5rem" }}>
            <div>
              <CardTitle style={{ fontSize: "1rem", fontWeight: 600 }}>Voyage Claims Comparison</CardTitle>
              <p style={{ fontSize: "0.75rem", color: "var(--muted-foreground)" }}>
                Owner Claim vs Charterer Claim vs Adjudicated Reconciled Total
              </p>
            </div>
            {/* Chart Legend */}
            <div style={{ display: "flex", gap: "0.75rem", fontSize: "0.75rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "hsl(var(--charterer))" }} />
                <span style={{ color: "var(--muted-foreground)" }}>Owner Stated</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--chart-1)" }} />
                <span style={{ color: "var(--muted-foreground)" }}>Charterer Counter</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "hsl(var(--owner))" }} />
                <span style={{ color: "var(--muted-foreground)" }}>Keel Adjudicated</span>
              </div>
            </div>
          </CardHeader>
          <CardContent style={{ position: "relative", paddingTop: "0.5rem" }}>
            {lineChartData && lineChartData.ownerPoints.length > 0 ? (
              <div style={{ width: "100%", height: 230, position: "relative" }}>
                <svg
                  viewBox={`0 0 ${lineChartData.width} ${lineChartData.height}`}
                  style={{ width: "100%", height: "100%", overflow: "visible" }}
                >
                  <defs>
                    {/* Shadow filter for paths */}
                    <filter id="shadow-owner" x="-10%" y="-10%" width="120%" height="120%">
                      <feGaussianBlur stdDeviation="3" result="blur" />
                      <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                  </defs>

                  {/* Horizontal grid lines */}
                  {lineChartData.ticks.map((tick, i) => (
                    <g key={i}>
                      <line
                        x1={lineChartData.paddingX}
                        y1={tick.y}
                        x2={lineChartData.width - 20}
                        y2={tick.y}
                        stroke="var(--border)"
                        strokeWidth={1}
                        strokeDasharray={4}
                        style={{ opacity: 0.5 }}
                      />
                      <text
                        x={lineChartData.paddingX - 10}
                        y={tick.y + 4}
                        textAnchor="end"
                        fill="var(--muted-foreground)"
                        style={{ fontSize: "0.625rem", fontFamily: "monospace" }}
                      >
                        {tick.label}
                      </text>
                    </g>
                  ))}

                  {/* X axis dates */}
                  {chronologicalData.map((d, i) => (
                    <text
                      key={i}
                      x={lineChartData.ownerPoints[i].x}
                      y={lineChartData.height - 10}
                      textAnchor="middle"
                      fill="var(--muted-foreground)"
                      style={{ fontSize: "0.625rem" }}
                    >
                      {d.vessel_name.split(" ").slice(1).join(" ")}
                    </text>
                  ))}

                  {/* Line Paths */}
                  {/* Owner (Stated) Line */}
                  <path
                    d={lineChartData.ownerPath}
                    fill="none"
                    stroke="hsl(var(--charterer))"
                    strokeWidth={2}
                    style={{ opacity: 0.8 }}
                  />

                  {/* Charterer (Counter) Line */}
                  <path
                    d={lineChartData.chartererPath}
                    fill="none"
                    stroke="var(--chart-1)"
                    strokeWidth={1.5}
                    strokeDasharray="3 3"
                    style={{ opacity: 0.7 }}
                  />

                  {/* Reconciled (Keel) Line */}
                  <path
                    d={lineChartData.reconciledPath}
                    fill="none"
                    stroke="hsl(var(--owner))"
                    strokeWidth={3}
                    filter="url(#shadow-owner)"
                  />

                  {/* Hover Columns (Vertical interactive guide lines) */}
                  {chronologicalData.map((_, i) => (
                    <line
                      key={i}
                      x1={lineChartData.ownerPoints[i].x}
                      y1={lineChartData.paddingY}
                      x2={lineChartData.ownerPoints[i].x}
                      y2={lineChartData.height - lineChartData.paddingY}
                      stroke="var(--primary)"
                      strokeWidth={hoveredLineIndex === i ? 1.5 : 0}
                      strokeDasharray={2}
                      style={{ opacity: 0.4, transition: "stroke-width 0.1s" }}
                    />
                  ))}

                  {/* Dot Markers & Interactive Overlays */}
                  {chronologicalData.map((d, i) => {
                    const oPt = lineChartData.ownerPoints[i];
                    const cPt = lineChartData.chartererPoints[i];
                    const rPt = lineChartData.reconciledPoints[i];

                    return (
                      <g key={i}>
                        {/* Owner dot */}
                        <circle
                          cx={oPt.x}
                          cy={oPt.y}
                          r={hoveredLineIndex === i ? 5 : 3.5}
                          fill="hsl(var(--charterer))"
                        />
                        {/* Charterer dot */}
                        <circle
                          cx={cPt.x}
                          cy={cPt.y}
                          r={hoveredLineIndex === i ? 5 : 3.5}
                          fill="var(--chart-1)"
                        />
                        {/* Reconciled dot */}
                        <circle
                          cx={rPt.x}
                          cy={rPt.y}
                          r={hoveredLineIndex === i ? 6 : 4.5}
                          fill="hsl(var(--owner))"
                          stroke="var(--card)"
                          strokeWidth={1.5}
                        />

                        {/* Interactive hover trigger rect */}
                        <rect
                          x={oPt.x - 20}
                          y={0}
                          width={40}
                          height={lineChartData.height}
                          fill="transparent"
                          cursor="pointer"
                          onMouseEnter={() => setHoveredLineIndex(i)}
                          onMouseLeave={() => setHoveredLineIndex(null)}
                        />
                      </g>
                    );
                  })}
                </svg>

                {/* Floating Chart Tooltip */}
                {hoveredLineIndex !== null && chronologicalData[hoveredLineIndex] && (
                  <div
                    style={{
                      position: "absolute",
                      top: "10px",
                      left: lineChartData.ownerPoints[hoveredLineIndex].x > lineChartData.width / 2 ? "20px" : "auto",
                      right: lineChartData.ownerPoints[hoveredLineIndex].x <= lineChartData.width / 2 ? "20px" : "auto",
                      background: "hsl(var(--surface-3))",
                      border: "1px solid var(--border)",
                      borderRadius: "8px",
                      padding: "0.75rem",
                      zIndex: 30,
                      boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
                      width: "190px",
                      animation: "fadeIn 0.15s ease",
                    }}
                  >
                    <p style={{ fontSize: "0.8125rem", fontWeight: 700, borderBottom: "1px solid var(--border)", paddingBottom: "0.25rem", marginBottom: "0.5rem", color: "var(--foreground)" }}>
                      {chronologicalData[hoveredLineIndex].vessel_name}
                    </p>
                    <div style={{ display: "grid", gap: "0.25rem", fontSize: "0.75rem" }}>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ color: "var(--muted-foreground)" }}>Owner Claim:</span>
                        <span className="mono" style={{ color: "hsl(var(--charterer))", fontWeight: 500 }}>
                          {formatUsd(chronologicalData[hoveredLineIndex].owner_total_usd)}
                        </span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ color: "var(--muted-foreground)" }}>Charterer:</span>
                        <span className="mono" style={{ color: "var(--chart-1)", fontWeight: 500 }}>
                          {formatUsd(chronologicalData[hoveredLineIndex].charterer_total_usd)}
                        </span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", paddingTop: "0.25rem", borderTop: "1px dashed var(--border)", marginTop: "0.25rem" }}>
                        <span style={{ color: "var(--muted-foreground)", fontWeight: 600 }}>Reconciled:</span>
                        <span className="mono" style={{ color: "hsl(var(--owner))", fontWeight: 700 }}>
                          {formatUsd(chronologicalData[hoveredLineIndex].reconciled_total_usd)}
                        </span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ color: "var(--muted-foreground)" }}>Savings:</span>
                        <span className="mono" style={{ color: "hsl(var(--owner))", fontWeight: 500 }}>
                          {formatUsd(
                            chronologicalData[hoveredLineIndex].owner_total_usd -
                              chronologicalData[hoveredLineIndex].reconciled_total_usd
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ height: 230, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--muted-foreground)" }}>
                No voyage timeline data matching active filters.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Status Distribution Donut Chart */}
        <Card style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <CardHeader style={{ paddingBottom: "0.25rem" }}>
            <CardTitle style={{ fontSize: "1rem", fontWeight: 600 }}>Reconciliation Portfolio Status</CardTitle>
            <p style={{ fontSize: "0.75rem", color: "var(--muted-foreground)" }}>Proportion of current audits completed vs in progress</p>
          </CardHeader>
          <CardContent style={{ display: "flex", alignItems: "center", gap: "1rem", height: 210 }}>
            {donutChartData.total > 0 ? (
              <>
                {/* SVG Donut */}
                <div style={{ position: "relative", width: 120, height: 120, flexShrink: 0 }}>
                  <svg width="100%" height="100%" viewBox="0 0 120 120">
                    {donutChartData.slices.map((slice, i) => (
                      <circle
                        key={i}
                        cx="60"
                        cy="60"
                        r="50"
                        fill="transparent"
                        stroke={slice.color}
                        strokeWidth="12"
                        strokeDasharray={slice.strokeDasharray}
                        strokeDashoffset={slice.strokeDashoffset}
                        transform="rotate(-90 60 60)"
                        style={{
                          transition: "all 0.5s ease-in-out",
                        }}
                      />
                    ))}
                  </svg>
                  {/* Total in center */}
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <span className="font-display" style={{ fontSize: "1.5rem", fontWeight: 800, lineHeight: 1 }}>
                      {donutChartData.total}
                    </span>
                    <span style={{ fontSize: "0.625rem", color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                      Total Voyages
                    </span>
                  </div>
                </div>

                {/* Donut Legend */}
                <div style={{ flex: 1, display: "grid", gap: "0.5rem" }}>
                  {donutChartData.slices.map((slice, i) => (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "0.375rem 0.5rem",
                        background: "var(--secondary)",
                        border: "1px solid var(--border)",
                        borderRadius: "6px",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <span style={{ width: 8, height: 8, borderRadius: "50%", background: slice.color }} />
                        <span style={{ fontSize: "0.75rem", fontWeight: 500 }}>{slice.label}</span>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <span className="mono" style={{ fontSize: "0.75rem", fontWeight: 700 }}>
                          {slice.count}
                        </span>
                        <span style={{ fontSize: "0.625rem", color: "var(--muted-foreground)", marginLeft: "0.25rem" }}>
                          ({Math.round((slice.count / donutChartData.total) * 100)}%)
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--muted-foreground)", fontSize: "0.8125rem" }}>
                No status distribution matches filters.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Adjudication Verdicts Horizontal Bar Chart */}
      <Card style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
        <CardHeader style={{ paddingBottom: "0.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <CardTitle style={{ fontSize: "1rem", fontWeight: 600 }}>Adjudication Verdicts Breakdown</CardTitle>
              <p style={{ fontSize: "0.75rem", color: "var(--muted-foreground)" }}>
                Distribution of dispute determinations under BIMCO 2013 Laytime exception definitions
              </p>
            </div>
            <Badge variant="secondary" className="mono" style={{ fontSize: "0.75rem" }}>
              {verdictSummary.total} Total Verdicts
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {verdictSummary.total > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {[
                {
                  label: "Owner Upheld (Time Counts as Laytime)",
                  count: verdictSummary.ownerWins,
                  percentage: (verdictSummary.ownerWins / verdictSummary.total) * 100,
                  color: "hsl(var(--owner))",
                  desc: "Exception claims denied; weather did not exceed force thresholds or operations continued.",
                },
                {
                  label: "Charterer Upheld (Time Excepted)",
                  count: verdictSummary.chartererWins,
                  percentage: (verdictSummary.chartererWins / verdictSummary.total) * 100,
                  color: "hsl(var(--charterer))",
                  desc: "Exceptions substantiated; weather logs confirm operations were fully prevented.",
                },
                {
                  label: "Split / Conceded Verdicts",
                  count: verdictSummary.splitVerdicts,
                  percentage: (verdictSummary.splitVerdicts / verdictSummary.total) * 100,
                  color: "var(--chart-4)",
                  desc: "Partially excepted periods or conceded values under mutual settlement agreements.",
                },
              ].map((item, i) => (
                <div key={i} style={{ display: "grid", gap: "0.25rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", fontSize: "0.8125rem" }}>
                    <span style={{ fontWeight: 600 }}>{item.label}</span>
                    <span className="mono" style={{ fontWeight: 700, color: item.color }}>
                      {item.count} Verdicts ({Math.round(item.percentage)}%)
                    </span>
                  </div>
                  {/* Progress track */}
                  <div style={{ height: 10, background: "var(--border)", borderRadius: 5, overflow: "hidden" }}>
                    <div
                      style={{
                        height: "100%",
                        width: `${item.percentage}%`,
                        background: item.color,
                        borderRadius: 5,
                        transition: "width 0.8s cubic-bezier(0.16, 1, 0.3, 1)",
                      }}
                    />
                  </div>
                  <span style={{ fontSize: "0.6875rem", color: "var(--muted-foreground)" }}>{item.desc}</span>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ height: 100, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--muted-foreground)" }}>
              No disputed verdicts observed in current filtered scope.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Generated Reports Log Table */}
      <Card style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
        <CardHeader style={{ paddingBottom: "0.75rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <CardTitle style={{ fontSize: "1rem", fontWeight: 600 }}>Generated Reports Archive</CardTitle>
              <p style={{ fontSize: "0.75rem", color: "var(--muted-foreground)" }}>Historical record of compiled demurrage summaries</p>
            </div>
            <Badge variant="outline" className="mono" style={{ fontSize: "0.6875rem" }}>
              {savedReports.length} Available Packages
            </Badge>
          </div>
        </CardHeader>
        <CardContent style={{ paddingTop: 0 }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Report Name</TableHead>
                <TableHead>Date Created</TableHead>
                <TableHead>Format</TableHead>
                <TableHead>File Size</TableHead>
                <TableHead>Vessels Covered</TableHead>
                <TableHead style={{ textAlign: "right" }}></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {savedReports.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} style={{ textAlign: "center", color: "var(--muted-foreground)", padding: "2rem" }}>
                    No reports generated yet. Click "Create Report" above to compile one.
                  </TableCell>
                </TableRow>
              ) : (
                savedReports.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell style={{ fontWeight: 600 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <FileText size={16} style={{ color: "var(--primary)" }} />
                        {report.name}
                      </div>
                    </TableCell>
                    <TableCell style={{ fontSize: "0.8125rem", color: "var(--muted-foreground)" }}>
                      {new Date(report.created_at).toLocaleString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          report.format === "PDF"
                            ? "default"
                            : report.format === "EXCEL"
                              ? "secondary"
                              : "outline"
                        }
                        style={{
                          fontSize: "0.625rem",
                          fontWeight: 700,
                          ...(report.format === "PDF" && {
                            background: "hsl(var(--charterer-bg))",
                            color: "hsl(var(--charterer))",
                            border: "1px solid hsl(var(--charterer) / 0.3)",
                          }),
                          ...(report.format === "EXCEL" && {
                            background: "hsl(var(--owner-bg))",
                            color: "hsl(var(--owner))",
                            border: "1px solid hsl(var(--owner) / 0.3)",
                          }),
                        }}
                      >
                        {report.format}
                      </Badge>
                    </TableCell>
                    <TableCell className="mono" style={{ fontSize: "0.8125rem" }}>
                      {report.size}
                    </TableCell>
                    <TableCell>
                      <span style={{ fontSize: "0.8125rem", color: "var(--muted-foreground)" }}>
                        {report.vessels.join(", ")}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={downloadingReportId === report.id}
                          onClick={() => handleDownload(report.id)}
                        >
                          {downloadingReportId === report.id ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <Download size={14} />
                          )}
                          Download
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteReport(report.id)}>
                          <Trash2 size={14} style={{ color: "hsl(var(--charterer) / 0.7)" }} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Report Creator Dialog Modal */}
      <Dialog open={creatorOpen} onOpenChange={setCreatorOpen}>
        <DialogContent style={{ maxWidth: 520, padding: "1.5rem" }}>
          <DialogHeader>
            <DialogTitle>Generate Demurrage Audit Report</DialogTitle>
            <DialogDescription>
              Compile structured claim determinations, BIMCO 2013 clause analyses, and port weather observations
            </DialogDescription>
          </DialogHeader>

          {!generating && !generationSuccess && (
            <div style={{ display: "grid", gap: "1.25rem", marginTop: "0.5rem" }}>
              {/* Report Name Input */}
              <div style={{ display: "grid", gap: "0.375rem" }}>
                <label style={{ fontSize: "0.75rem", fontWeight: 600 }}>Report Title</label>
                <Input
                  value={reportTitle}
                  onChange={(e) => setReportTitle(e.target.value)}
                  placeholder="e.g. Q2 Demurrage Reconciliation Digest"
                />
              </div>

              {/* Vessels Select (Checkboxes) */}
              <div style={{ display: "grid", gap: "0.375rem" }}>
                <label style={{ fontSize: "0.75rem", fontWeight: 600 }}>Vessels to Include</label>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "0.5rem",
                    maxHeight: "120px",
                    overflowY: "auto",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius)",
                    padding: "0.5rem",
                    background: "var(--secondary)",
                  }}
                >
                  {allVesselNames.map((vessel) => {
                    const checked = wizardVessels.includes(vessel);
                    return (
                      <div
                        key={vessel}
                        onClick={() => handleWizardVesselToggle(vessel)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                          cursor: "pointer",
                          padding: "0.25rem",
                          borderRadius: "4px",
                          transition: "background 0.15s",
                          background: checked ? "var(--secondary)" : "transparent",
                        }}
                      >
                        <div
                          style={{
                            width: 14,
                            height: 14,
                            border: "1px solid var(--border)",
                            borderRadius: "3px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            background: checked ? "var(--primary)" : "transparent",
                          }}
                        >
                          {checked && <div style={{ width: 6, height: 6, background: "var(--primary-foreground)", borderRadius: "1px" }} />}
                        </div>
                        <span style={{ fontSize: "0.75rem", fontWeight: 500 }}>{vessel}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Format & Scope selector grid */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                {/* Format selection */}
                <div>
                  <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, marginBottom: "0.375rem" }}>
                    Export Format
                  </label>
                  <div style={{ display: "flex", border: "1px solid var(--border)", borderRadius: "var(--radius)", overflow: "hidden" }}>
                    {(["PDF", "EXCEL", "CSV"] as const).map((fmt) => (
                      <button
                        key={fmt}
                        onClick={() => setWizardFormat(fmt)}
                        style={{
                          flex: 1,
                          padding: "0.375rem",
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          background: wizardFormat === fmt ? "var(--primary)" : "transparent",
                          color: wizardFormat === fmt ? "var(--primary-foreground)" : "var(--muted-foreground)",
                          border: "none",
                          cursor: "pointer",
                          transition: "all 0.1s",
                        }}
                      >
                        {fmt}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Scope selector */}
                <div>
                  <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, marginBottom: "0.375rem" }}>
                    Report Scope
                  </label>
                  <select
                    value={wizardDateRange}
                    onChange={(e) => setWizardDateRange(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "0.375rem",
                      fontSize: "0.75rem",
                      borderRadius: "var(--radius)",
                      border: "1px solid var(--border)",
                      background: "transparent",
                      color: "var(--foreground)",
                      outline: "none",
                    }}
                  >
                    <option value="all" style={{ background: "var(--card)" }}>All Historical Claims</option>
                    <option value="30days" style={{ background: "var(--card)" }}>Last 30 Days Only</option>
                    <option value="q2" style={{ background: "var(--card)" }}>Q2 2026 Voyages</option>
                    <option value="ytd" style={{ background: "var(--card)" }}>Year to Date (2026)</option>
                  </select>
                </div>
              </div>

              {/* Sections Checklist */}
              <div style={{ display: "grid", gap: "0.375rem" }}>
                <label style={{ fontSize: "0.75rem", fontWeight: 600 }}>Included Audits & Annexes</label>
                <div style={{ display: "grid", gap: "0.25rem", fontSize: "0.75rem", color: "var(--muted-foreground)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <CheckCircle2 size={12} style={{ color: "hsl(var(--owner))" }} />
                    <span>Executive Demurrage Reconciliation Summary</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <CheckCircle2 size={12} style={{ color: "hsl(var(--owner))" }} />
                    <span>BIMCO 2013 Laytime Exception Verdict Reports</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <CheckCircle2 size={12} style={{ color: "hsl(var(--owner))" }} />
                    <span>Weather Station Sensor Log Audits (Meteorological corroboration)</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <CheckCircle2 size={12} style={{ color: "hsl(var(--owner))" }} />
                    <span>Drafted Dispute Counter-Claim Letters</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Compilation progress state */}
          {generating && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "2rem 0", gap: "1rem" }}>
              <Loader2 size={36} className="animate-spin" style={{ color: "var(--primary)" }} />
              <div style={{ width: "100%", maxWidth: "300px", height: "6px", background: "var(--border)", borderRadius: "3px", overflow: "hidden" }}>
                <div
                  style={{
                    height: "100%",
                    width: `${generationProgress}%`,
                    background: "var(--primary)",
                    borderRadius: "3px",
                    transition: "width 0.2s ease-out",
                  }}
                />
              </div>
              <div style={{ textAlign: "center" }}>
                <p style={{ fontSize: "0.875rem", fontWeight: 600 }}>Compiling Reconciliation Package...</p>
                <p style={{ fontSize: "0.75rem", color: "var(--muted-foreground)", marginTop: "0.25rem" }}>
                  {generationStep} ({generationProgress}%)
                </p>
              </div>
            </div>
          )}

          {/* Generation Success State */}
          {generationSuccess && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "2rem 0", gap: "1rem" }}>
              <div
                style={{
                  width: 54,
                  height: 54,
                  borderRadius: "50%",
                  background: "hsl(var(--owner-bg))",
                  border: "1px solid hsl(var(--owner) / 0.3)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "hsl(var(--owner))",
                }}
              >
                <CheckCircle2 size={32} />
              </div>
              <div style={{ textAlign: "center" }}>
                <p style={{ fontSize: "1.0625rem", fontWeight: 800 }}>Audit Report Compiled Successfully</p>
                <p style={{ fontSize: "0.8125rem", color: "var(--muted-foreground)", marginTop: "0.25rem" }}>
                  File size: {wizardFormat === "PDF" ? "1.8 MB" : wizardFormat === "EXCEL" ? "880 KB" : "320 KB"} · {wizardFormat} Format
                </p>
              </div>
              <div style={{ display: "flex", gap: "0.5rem", width: "100%", maxWidth: "300px", marginTop: "0.5rem" }}>
                <Button
                  style={{ flex: 1 }}
                  onClick={() => {
                    setCreatorOpen(false);
                    // trigger download of the newly added report
                    const newlyAdded = savedReports[0];
                    if (newlyAdded) handleDownload(newlyAdded.id);
                  }}
                >
                  <Download size={14} />
                  Download File
                </Button>
                <DialogClose render={<Button variant="outline" style={{ flex: 1 }} />}>
                  Close
                </DialogClose>
              </div>
            </div>
          )}

          {!generating && !generationSuccess && (
            <DialogFooter>
              <DialogClose render={<Button variant="outline" />}>
                Cancel
              </DialogClose>
              <Button onClick={generateReport} disabled={wizardVessels.length === 0}>
                <Layers size={14} />
                Generate Audit Pack
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
