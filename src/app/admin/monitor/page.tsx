import { dailyStats, listUploads } from "@/lib/db";
import { driveEnabled } from "@/lib/drive";
import MonitorClient from "./MonitorClient";

export const dynamic = "force-dynamic";

export default async function MonitorPage() {
  const [stats, uploads] = await Promise.all([dailyStats(), listUploads(50)]);
  return (
    <MonitorClient
      stats={stats}
      uploads={uploads}
      driveEnabled={driveEnabled}
    />
  );
}
