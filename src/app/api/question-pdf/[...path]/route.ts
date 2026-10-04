import { questionPdfMetadata } from "@/lib/question-pdf-paths";
import { redirectToPublicObject } from "@/lib/storage-redirect";

const allowedPdfPaths = new Set<string>(Object.values(questionPdfMetadata).map((item) => item.cropPath));

export async function GET(request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;

  if (!allowedPdfPaths.has(path.join("/"))) {
    return new Response("Question PDF not found", { status: 404 });
  }

  return redirectToPublicObject(request, "question-pdfs", path);
}
