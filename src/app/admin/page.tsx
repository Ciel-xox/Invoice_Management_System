import { listCompanies, seedIfEmpty } from "@/lib/db";
import AdminClient from "./AdminClient";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  // 初回起動時はデモ企業を 3 社シード
  await seedIfEmpty();
  const companies = await listCompanies();

  // アップロード URL を組み立てるためにホスト名を取る
  const h = await headers();
  const host = h.get("host") ?? "localhost:3000";
  const proto = host.startsWith("localhost") ? "http" : "https";
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL?.trim() || `${proto}://${host}`;

  return <AdminClient companies={companies} baseUrl={baseUrl} />;
}
