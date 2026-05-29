import Link from "next/link";
import { listCompanies, seedIfEmpty } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  // 初回表示時にサンプル企業を 3 社シード（プレビュー用）
  await seedIfEmpty();
  const companies = await listCompanies();
  // プレビューで遷移しやすいよう、有効な企業の最初の 1 社の URL を使う
  const sample = companies.find((c) => c.status === "active") ?? companies[0];

  return (
    <div className="max-w-3xl mx-auto px-5 py-12">
      <h1 className="text-2xl font-medium mb-1">請求書受注システム</h1>
      <p className="text-sm text-ink-2 mb-10">
        会社ごとに専用 URL を発行 → 企業が請求書をアップロード → 指定の Google Drive へ自動連携
      </p>

      <div className="grid gap-4">
        <Link
          href="/admin"
          className="card p-5 hover:bg-surface2 transition block no-underline text-ink"
        >
          <p className="section-label mb-3">1. URL 発行・管理</p>
          <p className="font-medium">アップロード URL 管理</p>
          <p className="text-sm text-ink-2 mt-1">
            企業ごとに専用 URL を発行・コピー・停止
          </p>
        </Link>

        {sample ? (
          <Link
            href={`/u/${sample.token}`}
            className="card p-5 hover:bg-surface2 transition block no-underline text-ink"
          >
            <p className="section-label mb-3">2. 企業向けアップロード画面</p>
            <p className="font-medium">
              請求書アップロード（プレビュー: {sample.name}）
            </p>
            <p className="text-sm text-ink-2 mt-1">
              <code className="mono">/u/{sample.token.slice(0, 8)}…</code>{" "}
              ／ 発行された専用 URL から企業がアクセスします
            </p>
          </Link>
        ) : (
          <Link
            href="/admin"
            className="card p-5 hover:bg-surface2 transition block no-underline text-ink"
          >
            <p className="section-label mb-3">2. 企業向けアップロード画面</p>
            <p className="font-medium">まず URL を発行してください</p>
            <p className="text-sm text-ink-2 mt-1">
              URL 管理画面で企業を登録すると、ここからアップロード画面を開けます
            </p>
          </Link>
        )}

        <Link
          href="/admin/monitor"
          className="card p-5 hover:bg-surface2 transition block no-underline text-ink"
        >
          <p className="section-label mb-3">3. 自動アップロード監視</p>
          <p className="font-medium">受領 → Drive 連携状況</p>
          <p className="text-sm text-ink-2 mt-1">
            本日の受領数・連携済み・要確認のサマリーと履歴
          </p>
        </Link>
      </div>
    </div>
  );
}
