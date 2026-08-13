import { IoiLiveTracker } from "@/components/interactive/ioi-live-tracker";
import { getIoiLiveSnapshot, getUnavailableIoiSnapshot } from "@/lib/ioi-live";

export const metadata = {
  title: "IOI 2026 Live Results",
  description: "Live IOI 2026 scores and ranks for Pakistan's four contestants.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function IoiLiveResultsPage() {
  const snapshot = await getIoiLiveSnapshot().catch(() => getUnavailableIoiSnapshot());
  return <IoiLiveTracker initialSnapshot={snapshot} />;
}
