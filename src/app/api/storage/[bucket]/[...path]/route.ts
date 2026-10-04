import { redirectToPublicObject } from "@/lib/storage-redirect";

const allowedBuckets = new Set(["resource-files", "paper-assets", "content-assets"]);

export async function GET(request: Request, { params }: { params: Promise<{ bucket: string; path: string[] }> }) {
  const { bucket, path } = await params;

  if (!allowedBuckets.has(bucket)) {
    return new Response("Storage bucket not allowed", { status: 404 });
  }
  // Segments arrive URL-decoded, so an encoded "..%2F" shows up inside a single segment.
  if (path.length === 0 || path.some((segment) => !segment || segment === "." || segment.includes("..") || /[\\/]/.test(segment))) {
    return new Response("Storage object not found", { status: 404 });
  }

  return redirectToPublicObject(request, bucket, path);
}
