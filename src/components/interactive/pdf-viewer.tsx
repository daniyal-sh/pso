import { PdfCanvasViewer } from "@/components/interactive/pdf-canvas-viewer";

type PdfViewerProps = {
  title: string;
  url: string | null;
  unavailableMessage?: string;
};

export function PdfViewer({ title, url, unavailableMessage = "PDF is not available yet." }: PdfViewerProps) {
  return <PdfCanvasViewer title={title} url={url} variant="document" unavailableMessage={unavailableMessage} />;
}
