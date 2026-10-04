import { getIoiLiveSnapshot } from "@/lib/ioi-live";

export async function GET() {
  try {
    const snapshot = await getIoiLiveSnapshot();
    return Response.json(snapshot, {
      headers: {
        "Cache-Control": "public, max-age=15, s-maxage=60, stale-while-revalidate=300",
      },
    });
  } catch (error) {
    console.error("Unable to refresh IOI live results", error);
    return Response.json(
      { error: "The official IOI results feed is temporarily unavailable." },
      { status: 502, headers: { "Cache-Control": "no-store" } },
    );
  }
}
