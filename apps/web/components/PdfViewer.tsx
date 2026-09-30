"use client";

import { useState, useCallback, useMemo } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import type { OnPageLoadSuccess, PageCallback } from "react-pdf/dist/shared/types.js";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import { ChevronLeft, ChevronRight, Loader2, FileWarning } from "lucide-react";

// Served from /public so the viewer works on a host with no outbound network.
// The unpkg CDN copy cannot be reached from an air-gapped demo machine, and the
// failure mode there is silent: pdf.js falls back to a fake worker, no PDF is
// ever requested, and the panel looks broken for the wrong reason.
pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

type PdfViewport = ReturnType<PageCallback["getViewport"]>;

const PAGE_WIDTH = 520;

interface PdfViewerProps {
  /** Resolved source URL, or null when the citation names no document. */
  url: string | null;
  /** `null` when the API could not place the citation on a page. */
  initialPage?: number | null;
  /** Optional bbox highlight [x0, y0, x1, y1] in PDF points */
  highlightBbox?: [number, number, number, number];
}

export default function PdfViewer({ url, initialPage = 1, highlightBbox }: PdfViewerProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState(
    typeof initialPage === "number" ? initialPage : 1
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [pageViewport, setPageViewport] = useState<PdfViewport | null>(null);
  const unavailable = !url || error;
  const targetPage = typeof initialPage === "number" ? initialPage : 1;

  // Sync when parent changes the page
  const onDocumentLoadSuccess = useCallback(
    ({ numPages }: { numPages: number }) => {
      setNumPages(numPages);
      setLoading(false);
      setCurrentPage(targetPage);
    },
    [targetPage]
  );

  const onPageLoadSuccess = useCallback<OnPageLoadSuccess>((page) => {
    const baseViewport = page.getViewport({ scale: 1 });
    const scale = PAGE_WIDTH / baseViewport.width;
    setPageViewport(page.getViewport({ scale }));
  }, []);

  // Update page when initialPage prop changes (from audit-trace row click)
  if (currentPage !== targetPage && numPages > 0) {
    const clamped = Math.min(Math.max(targetPage, 1), numPages);
    setCurrentPage(clamped);
  }

  const prev = () => setCurrentPage((p) => Math.max(p - 1, 1));
  const next = () => setCurrentPage((p) => Math.min(p + 1, numPages));

  const highlightStyle = useMemo(() => {
    if (!highlightBbox || !pageViewport || currentPage !== targetPage) return null;
    const [x0, y0, x1, y1] = highlightBbox;
    if ([x0, y0, x1, y1].every((v) => v === 0)) return null;

    const [vx0, vy0, vx1, vy1] = pageViewport.convertToViewportRectangle([
      x0,
      y0,
      x1,
      y1,
    ]);
    const left = Math.min(vx0, vx1);
    const top = Math.min(vy0, vy1);
    const width = Math.abs(vx1 - vx0);
    const height = Math.abs(vy1 - vy0);

    return { left, top, width, height };
  }, [highlightBbox, pageViewport, currentPage, targetPage]);

  return (
    <div
      style={{
        background: "hsl(var(--surface-2))",
        borderRadius: "var(--radius)",
        overflow: "hidden",
        minHeight: 400,
      }}
    >
      {/* Toolbar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0.625rem 1rem",
          borderBottom: "1px solid hsl(var(--border))",
          background: "hsl(var(--surface))",
        }}
      >
        <span
          className="mono"
          style={{ fontSize: "0.8rem", color: "hsl(var(--muted-foreground))" }}
        >
          {url ? url.split("/").pop() : "no source document named"}
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <button
            id="pdf-prev-btn"
            className="btn btn-ghost"
            onClick={prev}
            disabled={unavailable || currentPage <= 1}
            style={{ padding: "0.25rem 0.5rem", opacity: unavailable || currentPage <= 1 ? 0.4 : 1 }}
            aria-label="Previous page"
          >
            <ChevronLeft size={16} />
          </button>
          <span
            className="mono"
            style={{ fontSize: "0.8rem", minWidth: "5rem", textAlign: "center" }}
          >
            {numPages > 0
              ? `${currentPage} / ${numPages}`
              : `cited ${typeof initialPage === "number" ? `p.${initialPage}` : "page not recorded"}`}
          </span>
          <button
            id="pdf-next-btn"
            className="btn btn-ghost"
            onClick={next}
            disabled={unavailable || currentPage >= numPages}
            style={{ padding: "0.25rem 0.5rem", opacity: unavailable || currentPage >= numPages ? 0.4 : 1 }}
            aria-label="Next page"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Document */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          padding: "1.5rem",
          minHeight: 360,
          alignItems: loading ? "center" : "flex-start",
        }}
      >
        {unavailable ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "0.75rem",
              color: "hsl(var(--muted-foreground))",
              padding: "3rem",
              textAlign: "center",
            }}
          >
            <FileWarning size={32} />
            {url ? (
              <>
                <p style={{ fontSize: "0.875rem" }}>
                  This build ships no source PDF, so the preview cannot load. The
                  citation still names the document and page the engine read.
                  <br />
                  The page number and every figure in the audit trace come from the
                  pipeline and are unaffected.
                </p>
              </>
            ) : (
              <p style={{ fontSize: "0.875rem" }}>
                This citation does not name a source document, so there is nothing to preview.
                <br />
                The page number and the figures above come from the audit trace and are unaffected.
              </p>
            )}
          </div>
        ) : (
          <Document
            file={url}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={() => {
              setError(true);
              setLoading(false);
            }}
            loading={
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  color: "hsl(var(--muted-foreground))",
                }}
              >
                <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} />
                Loading PDF…
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              </div>
            }
          >
            <div style={{ position: "relative", width: PAGE_WIDTH }}>
              <Page
                pageNumber={currentPage}
                width={PAGE_WIDTH}
                renderAnnotationLayer
                renderTextLayer
                onLoadSuccess={onPageLoadSuccess}
              />
              {highlightStyle && (
                <div
                  style={{
                    position: "absolute",
                    left: highlightStyle.left,
                    top: highlightStyle.top,
                    width: highlightStyle.width,
                    height: highlightStyle.height,
                    background: "oklch(0.75 0.18 160 / 0.18)",
                    border: "1px solid oklch(0.75 0.18 160 / 0.55)",
                    boxShadow: "0 0 0 1px oklch(0.75 0.18 160 / 0.25), 0 0 24px oklch(0.75 0.18 160 / 0.25)",
                    borderRadius: 6,
                    pointerEvents: "none",
                  }}
                />
              )}
            </div>
          </Document>
        )}
      </div>
    </div>
  );
}
