"use client";

import { useEffect, useRef, useState } from "react";
import type { OnProgressParameters, PDFDocumentLoadingTask, PDFDocumentProxy, RenderTask } from "pdfjs-dist";
import { Icon } from "@/components/icon";
import { cn } from "@/lib/utils";

type PdfCanvasViewerProps = {
  title: string;
  url: string | null;
  variant: "snapshot" | "document";
  unavailableMessage: string;
};

type DocumentState = {
  source: string | null;
  status: "loading" | "ready" | "error";
  pdf: PDFDocumentProxy | null;
  progress: number | null;
};

function LoadingPanel({ variant, progress }: { variant: PdfCanvasViewerProps["variant"]; progress: number | null }) {
  return (
    <div
      className={cn(
        "grid place-items-center bg-white px-5 py-10 text-center",
        variant === "document" ? "min-h-[460px] sm:min-h-[620px]" : "min-h-24 sm:min-h-28",
      )}
      role="status"
      aria-live="polite"
    >
      <div className="w-full max-w-sm">
        <span className="mx-auto grid h-10 w-10 place-items-center rounded-full bg-mint text-emerald">
          <Icon name="reset" className="h-5 w-5 animate-spin" />
        </span>
        <p className="mt-4 text-sm font-black text-charcoal">Rendering {variant === "snapshot" ? "question" : "PDF page"}</p>
        <p className="mt-1 text-xs font-semibold text-charcoal/55">Preparing a mobile-safe view</p>
        <div className="mx-auto mt-5 h-1.5 max-w-56 overflow-hidden rounded-full bg-navy/10">
          <div
            className={cn("h-full rounded-full bg-emerald transition-[width] duration-300", progress === null && "w-2/5 animate-pulse")}
            style={progress === null ? undefined : { width: `${Math.max(8, progress)}%` }}
          />
        </div>
      </div>
    </div>
  );
}

function CanvasPage({ pdf, pageNumber, title, variant }: { pdf: PDFDocumentProxy; pageNumber: number; title: string; variant: PdfCanvasViewerProps["variant"] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [renderState, setRenderState] = useState<{ page: number; status: "loading" | "ready" | "error" }>({ page: 0, status: "loading" });
  const status = renderState.page === pageNumber ? renderState.status : "loading";

  useEffect(() => {
    let cancelled = false;
    let renderTask: RenderTask | null = null;
    let observer: ResizeObserver | null = null;
    let animationFrame = 0;

    async function preparePage() {
      try {
        const page = await pdf.getPage(pageNumber);

        const renderPage = async () => {
          const container = containerRef.current;
          const canvas = canvasRef.current;
          if (!container || !canvas || cancelled) return;

          renderTask?.cancel();

          const naturalViewport = page.getViewport({ scale: 1 });
          const availableWidth = Math.max(container.clientWidth, 1);
          const cssScale = availableWidth / naturalViewport.width;
          const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
          const viewport = page.getViewport({ scale: cssScale * pixelRatio });

          canvas.width = Math.ceil(viewport.width);
          canvas.height = Math.ceil(viewport.height);
          canvas.style.width = `${Math.round(viewport.width / pixelRatio)}px`;
          canvas.style.height = `${Math.round(viewport.height / pixelRatio)}px`;

          try {
            const nextRenderTask = page.render({ canvas, viewport, background: "rgb(255,255,255)" });
            renderTask = nextRenderTask;
            await nextRenderTask.promise;

            if (!cancelled) setRenderState({ page: pageNumber, status: "ready" });
          } catch (error) {
            if (!(error instanceof Error && error.name === "RenderingCancelledException")) throw error;
          }
        };

        await renderPage();
        observer = new ResizeObserver(() => {
          cancelAnimationFrame(animationFrame);
          animationFrame = requestAnimationFrame(() => void renderPage());
        });
        if (containerRef.current) observer.observe(containerRef.current);
      } catch (error) {
        if (!cancelled && !(error instanceof Error && error.name === "RenderingCancelledException")) {
          setRenderState({ page: pageNumber, status: "error" });
        }
      }
    }

    void preparePage();

    return () => {
      cancelled = true;
      cancelAnimationFrame(animationFrame);
      observer?.disconnect();
      renderTask?.cancel();
    };
  }, [pageNumber, pdf]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative mx-auto w-full overflow-hidden bg-white",
        variant === "document" ? "max-w-[920px] shadow-sm" : "max-w-4xl",
      )}
    >
      {status === "loading" ? <LoadingPanel variant={variant} progress={null} /> : null}
      {status === "error" ? <div className="p-6 text-center text-sm font-semibold leading-6 text-charcoal/70">This page could not be rendered.</div> : null}
      <canvas
        ref={canvasRef}
        role="img"
        aria-label={pdf.numPages > 1 ? `${title}, page ${pageNumber}` : title}
        className={cn("block max-w-full", status !== "ready" && "absolute h-px w-px opacity-0")}
      />
    </div>
  );
}

export function PdfCanvasViewer({ title, url, variant, unavailableMessage }: PdfCanvasViewerProps) {
  const [documentState, setDocumentState] = useState<DocumentState>({ source: null, status: "loading", pdf: null, progress: null });
  const [pageState, setPageState] = useState({ source: null as string | null, page: 1 });
  const state = documentState.source === url ? documentState : { source: url, status: "loading" as const, pdf: null, progress: null };
  const pageNumber = pageState.source === url ? pageState.page : 1;

  useEffect(() => {
    if (!url) return;

    const pdfUrl = url;
    let cancelled = false;
    let loadingTask: PDFDocumentLoadingTask | null = null;

    async function loadDocument() {
      try {
        const pdfjs = await import("pdfjs-dist");
        pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();

        loadingTask = pdfjs.getDocument({ url: pdfUrl });
        loadingTask.onProgress = ({ loaded, total }: OnProgressParameters) => {
          if (!cancelled) setDocumentState({ source: pdfUrl, status: "loading", pdf: null, progress: total > 0 ? Math.round((loaded / total) * 100) : null });
        };

        const pdf = await loadingTask.promise;
        if (!cancelled) {
          setPageState({ source: pdfUrl, page: 1 });
          setDocumentState({ source: pdfUrl, status: "ready", pdf, progress: 100 });
        }
      } catch {
        if (!cancelled) setDocumentState({ source: pdfUrl, status: "error", pdf: null, progress: null });
      }
    }

    void loadDocument();

    return () => {
      cancelled = true;
      void loadingTask?.destroy();
    };
  }, [url]);

  if (!url || state.status === "error") {
    return (
      <div className="rounded-md border border-gold/30 bg-gold/10 p-5 text-sm font-semibold leading-6 text-charcoal/75">
        {unavailableMessage}
      </div>
    );
  }

  if (state.status === "loading" || !state.pdf) {
    return (
      <div className="overflow-hidden rounded-md border border-navy/10 bg-white">
        <LoadingPanel variant={variant} progress={state.progress} />
      </div>
    );
  }

  const pageCount = state.pdf.numPages;
  const showPageControls = variant === "document" && pageCount > 1;

  return (
    <div className="overflow-hidden rounded-md border border-navy/10 bg-cool">
      {showPageControls ? (
        <div className="flex items-center justify-between gap-2 border-b border-navy/10 bg-white px-2 py-2 sm:px-3">
          <button
            aria-label="Previous page"
            className="inline-flex h-10 items-center gap-1 rounded-md border border-navy/10 px-3 text-xs font-black text-charcoal disabled:cursor-not-allowed disabled:opacity-40"
            disabled={pageNumber <= 1}
            onClick={() => setPageState({ source: url, page: Math.max(1, pageNumber - 1) })}
            type="button"
          >
            <Icon name="chevron" className="h-4 w-4 rotate-180" />
            <span className="hidden sm:inline">Previous</span>
          </button>
          <p className="text-xs font-black text-charcoal sm:text-sm">Page {pageNumber} of {pageCount}</p>
          <button
            aria-label="Next page"
            className="inline-flex h-10 items-center gap-1 rounded-md border border-navy/10 px-3 text-xs font-black text-charcoal disabled:cursor-not-allowed disabled:opacity-40"
            disabled={pageNumber >= pageCount}
            onClick={() => setPageState({ source: url, page: Math.min(pageCount, pageNumber + 1) })}
            type="button"
          >
            <span className="hidden sm:inline">Next</span>
            <Icon name="chevron" className="h-4 w-4" />
          </button>
        </div>
      ) : null}

      <div className={cn(variant === "document" ? "p-2 sm:p-4" : "p-2 sm:p-3")}>
        <CanvasPage key={`${url}-${pageNumber}`} pdf={state.pdf} pageNumber={pageNumber} title={title} variant={variant} />
      </div>
    </div>
  );
}
