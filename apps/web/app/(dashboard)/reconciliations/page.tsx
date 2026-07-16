"use client";

import { useEffect, useState } from "react";
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
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  ArrowRight,
  Trash2,
  AlertTriangle,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { fetchReconciliations, formatUsd, deleteReconciliation } from "@/lib/api";
import type { ReconciliationSummary, PaginatedResponse } from "@/lib/types";

function formatDate(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "—";
  return parsed.toISOString().slice(0, 10);
}

type DeleteConfirmState = {
  open: boolean;
  target: ReconciliationSummary | null;
};

export default function ReconciliationsPage() {
  const [pageData, setPageData] = useState<PaginatedResponse<ReconciliationSummary> | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [deleteConfirm, setDeleteConfirm] = useState<DeleteConfirmState>({ open: false, target: null });
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const load = () => {
      setLoading(true);
      setLoadError(null);
      fetchReconciliations(page)
        .then((data) => {
          if (!active) return;
          setPageData(data);
          setLoadError(null);
          setLoading(false);
        })
        .catch((err) => {
          if (!active) return;
          setLoadError(err instanceof Error ? err.message : "Failed to load reconciliations");
          setLoading(false);
        });
    };
    load();
    return () => { active = false; };
  }, [page]);

  const handleDelete = async () => {
    if (!deleteConfirm.target) return;
    const id = deleteConfirm.target.voyage_id;
    setDeletingId(id);
    try {
      await deleteReconciliation(id);
      setPageData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          items: prev.items.filter((r) => r.voyage_id !== id),
          total: prev.total - 1,
        };
      });
    } catch {
      // just close on failure
    } finally {
      setDeleteConfirm({ open: false, target: null });
      setDeletingId(null);
    }
  };

  const items = pageData?.items ?? [];
  const totalItems = pageData?.total ?? 0;
  const totalPages = pageData?.total_pages ?? 1;

  return (
    <div style={{ padding: "1.5rem 2rem" }}>
      {/* Page header */}
      <div
        className="animate-fade-in"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "2rem",
        }}
      >
        <div>
          <h1
            className="font-display"
            style={{ fontSize: "1.75rem", fontWeight: 800, letterSpacing: "-0.02em" }}
          >
            Reconciliations
          </h1>
          <p style={{ fontSize: "0.875rem", color: "var(--muted-foreground)" }}>
            All reconciled voyages and dispute resolutions
          </p>
        </div>
      </div>

      {/* Reconciliations table */}
      <Card
        className="animate-slide-up"
        style={{ animationDelay: "0.15s", background: "var(--card)" }}
      >
        <CardHeader style={{ paddingBottom: "0.75rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <CardTitle style={{ fontSize: "1rem", fontWeight: 600 }}>
              All Reconciliations
            </CardTitle>
            <Badge variant="secondary" style={{ fontSize: "0.6875rem" }}>
              {totalItems} total
            </Badge>
          </div>
        </CardHeader>
        <CardContent style={{ paddingTop: 0 }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Voyage</TableHead>
                <TableHead>Vessel</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Charterer</TableHead>
                <TableHead style={{ textAlign: "right" }}>Owner Claim</TableHead>
                <TableHead style={{ textAlign: "right" }}>Charterer Claim</TableHead>
                <TableHead style={{ textAlign: "right" }}>Reconciled</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={10}
                    style={{
                      padding: "1.5rem",
                      textAlign: "center",
                      color: "var(--muted-foreground)",
                      fontSize: "0.8125rem",
                    }}
                  >
                    {loadError
                      ? loadError
                      : loading
                        ? "Loading reconciliations..."
                        : "No reconciliations found"}
                  </TableCell>
                </TableRow>
              ) : (
                items.map((entry, i) => (
                  <TableRow
                    key={entry.voyage_id}
                    className="animate-fade-in"
                    style={{ animationDelay: `${0.15 + i * 0.05}s` }}
                  >
                    <TableCell>
                      <span className="mono" style={{ fontSize: "0.8125rem", fontWeight: 500 }}>
                        {entry.voyage_id}
                      </span>
                    </TableCell>
                    <TableCell style={{ fontWeight: 500 }}>{entry.vessel_name}</TableCell>
                    <TableCell style={{ fontSize: "0.8125rem" }}>{entry.owner_name}</TableCell>
                    <TableCell style={{ fontSize: "0.8125rem" }}>
                      {entry.charterer_name || "—"}
                    </TableCell>
                    <TableCell className="mono" style={{ textAlign: "right", fontSize: "0.8125rem" }}>
                      {formatUsd(entry.owner_total_usd)}
                    </TableCell>
                    <TableCell className="mono" style={{ textAlign: "right", fontSize: "0.8125rem" }}>
                      {formatUsd(entry.charterer_total_usd)}
                    </TableCell>
                    <TableCell
                      className="mono"
                      style={{
                        textAlign: "right",
                        fontSize: "0.8125rem",
                        fontWeight: 700,
                        color: "hsl(var(--owner))",
                      }}
                    >
                      {formatUsd(entry.reconciled_total_usd)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          entry.status === "Reconciled"
                            ? "default"
                            : entry.status === "In Review"
                              ? "secondary"
                              : "outline"
                        }
                        style={{
                          fontSize: "0.6875rem",
                          ...(entry.status === "Reconciled" && {
                            background: "hsl(var(--owner-bg))",
                            color: "hsl(var(--owner))",
                            border: "1px solid hsl(var(--owner) / 0.3)",
                          }),
                          ...(entry.status === "Closed" && {
                            color: "var(--muted-foreground)",
                          }),
                        }}
                      >
                        {entry.status}
                      </Badge>
                    </TableCell>
                    <TableCell style={{ fontSize: "0.8125rem", color: "var(--muted-foreground)" }}>
                      {formatDate(entry.created_at)}
                    </TableCell>
                    <TableCell>
                      <div style={{ display: "flex", gap: "0.25rem", alignItems: "center" }}>
                        <Button
                          render={<Link href={`/voyage/${entry.voyage_id}/reconcile`} />}
                          nativeButton={false}
                          variant="ghost"
                          size="sm"
                        >
                          <ArrowRight size={14} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={deletingId === entry.voyage_id}
                          onClick={() => setDeleteConfirm({ open: true, target: entry })}
                          style={{
                            color: "hsl(var(--charterer) / 0.6)",
                          }}
                        >
                          {deletingId === entry.voyage_id ? (
                            <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />
                          ) : (
                            <Trash2 size={14} />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
                paddingTop: "1rem",
                borderTop: "1px solid var(--border)",
                marginTop: "0.5rem",
              }}
            >
              <Button
                variant="ghost"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft size={14} />
                Previous
              </Button>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.25rem",
                  fontSize: "0.8125rem",
                  color: "var(--muted-foreground)",
                }}
              >
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <Button
                    key={p}
                    variant={p === page ? "default" : "ghost"}
                    size="xs"
                    onClick={() => setPage(p)}
                    style={{
                      minWidth: 32,
                      fontWeight: p === page ? 600 : 400,
                    }}
                  >
                    {p}
                  </Button>
                ))}
              </div>
              <Button
                variant="ghost"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
                <ChevronRight size={14} />
              </Button>
            </div>
          )}
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
            <DialogTitle>Delete Reconciliation</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the reconciliation for{" "}
              <strong>{deleteConfirm.target?.vessel_name ?? "this voyage"}</strong>?
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
