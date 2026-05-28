"use client";

type PdfViewerProps = {
  title: string;
  url: string | null;
  heightClassName?: string;
  unavailableMessage?: string;
};

function buildPdfEmbedUrl(url: string) {
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}embed=1#toolbar=0&navpanes=0&view=FitH`;
}

export function PdfViewer({ title, url, heightClassName = "h-[560px] sm:h-[680px]", unavailableMessage = "PDF is not available yet." }: PdfViewerProps) {
  if (!url) {
    return <div className="rounded-md border border-gold/30 bg-gold/10 p-5 text-sm font-semibold leading-6 text-charcoal/75">{unavailableMessage}</div>;
  }

  return (
    <div className="overflow-hidden rounded-md border border-navy/10 bg-white">
      <iframe src={buildPdfEmbedUrl(url)} title={title} className={`${heightClassName} w-full`} />
    </div>
  );
}
