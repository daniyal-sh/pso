import "server-only";

import { getSupabaseConfig } from "@/lib/supabase/server";

/**
 * Redirects to the public Supabase Storage (CDN) URL instead of streaming the file through a
 * serverless function. `?download=1` keeps working via Storage's own `download` parameter.
 */
export function redirectToPublicObject(request: Request, bucket: string, segments: string[]) {
  const { url } = getSupabaseConfig();
  if (!url) return new Response("Supabase is not configured", { status: 500 });

  const target = new URL(`${url}/storage/v1/object/public/${bucket}/${segments.map(encodeURIComponent).join("/")}`);
  if (new URL(request.url).searchParams.get("download") === "1") {
    target.searchParams.set("download", segments.at(-1) ?? "file");
  }

  return new Response(null, {
    status: 307,
    headers: {
      Location: target.toString(),
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
}
