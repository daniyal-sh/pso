import { PdfCanvasViewer } from "@/components/interactive/pdf-canvas-viewer";

type QuestionImageProps = {
  title: string;
  url: string | null;
  unavailableMessage?: string;
};

export function QuestionImage({ title, url, unavailableMessage = "Question image is not available yet." }: QuestionImageProps) {
  return <PdfCanvasViewer title={title} url={url} variant="snapshot" unavailableMessage={unavailableMessage} />;
}
