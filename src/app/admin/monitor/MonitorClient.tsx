"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Upload } from "@/lib/types";

type Props = {
  stats: {
    total_today: number;
    drive_done_today: number;
    pending_today: number;
  };
  uploads: Upload[];
  driveEnabled: boolean;
};

const STATUS_CONF: Record<
  Upload["status"],
  { label: string; color: string }
> = {
  done: { label: "✓ Drive 保存済み", color: "#0f6e56" },
  uploading: { label: "↻ アップロード中", color: "#185fa5" },
  review: { label: "⚠ 要確認", color: "#854f0b" },
  failed: { label: "✕ 失敗", color: "#a32d2d" },
};

export default function MonitorClient({
  stats,
  uploads,
  driveEnabled,
}: Props) {
  const router = useRouter();

  // 10 秒ごとに自動リフレッシュ（受領のリアルタイム反映）
  useEffect(() => {
    const id = setInterval(() => router.refresh(), 10000);
    return () => clearInterval(id);
  }, [router]);

  return (
    <div className="max-w-3xl mx-auto px-5 py-10">
      <div className="flex items-center justify-between mb-2">
        <Link
          href="/"
          className="text-xs text-ink-3 hover:text-ink-2 no-underline"
        >
          ← トップに戻る
        </Link>
      </div>

      <span className="section-label mb-4 mt-2">
        3. 自動アップロード監視画面（受領 → Drive 連携）
      </span>

      <div className="mb-5 mt-3">
        <p className="text-lg font-medium m-0">自動アップロード状況</p>
        <p className="text-[13px] text-ink-2 mt-0.5">
          受領した請求書を指定の Google Drive へ自動連携します
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="metric">
          <p className="metric-label">本日の受領</p>
          <p className="metric-num">{stats.total_today}</p>
        </div>
        <div className="metric">
          <p className="metric-label">Drive 連携済み</p>
          <p className="metric-num text-success">{stats.drive_done_today}</p>
        </div>
        <div className="metric">
          <p className="metric-label">処理中・要確認</p>
          <p className="metric-num text-warning">{stats.pending_today}</p>
        </div>
      </div>

      <div className="flex items-center gap-2.5 bg-info-bg rounded px-3.5 py-2.5 mb-5">
        <span className="text-base">🗂</span>
        <span className="text-[13px] text-info flex-1">
          連携先:{" "}
          <span className="mono">
            {driveEnabled
              ? "Google Drive (サービスアカウント連携中)"
              : "プレビュー mock (ローカルのみ)"}
          </span>
        </span>
        <span
          className={`text-xs ${driveEnabled ? "text-success" : "text-warning"}`}
        >
          ● {driveEnabled ? "接続中" : "未接続"}
        </span>
      </div>

      <div className="card overflow-hidden">
        <p className="text-[13px] font-medium px-4 pt-3 pb-1 m-0">
          最近の受領
        </p>
        {uploads.length === 0 && (
          <p className="text-center text-ink-3 py-10 text-sm border-t border-line">
            まだ受領はありません。
            <br />
            企業向けアップロード画面から送信すると、ここに表示されます。
          </p>
        )}
        {uploads.map((u) => {
          const cfg = STATUS_CONF[u.status];
          const time = new Date(u.created_at).toLocaleTimeString("ja-JP", {
            hour: "2-digit",
            minute: "2-digit",
          });
          return (
            <div
              key={u.id}
              className="flex items-center gap-3 px-4 py-2.5 border-t border-line"
            >
              <span className="text-xl text-ink-3">📄</span>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium m-0 truncate">
                  {u.filename}
                </p>
                <p className="text-xs text-ink-2 mt-0.5">
                  {u.company_name} ・ {time}
                  {u.invoice_amount != null
                    ? ` ・ ¥${u.invoice_amount.toLocaleString()}`
                    : ""}
                </p>
              </div>
              <span
                className="text-xs whitespace-nowrap"
                style={{ color: cfg.color }}
              >
                {cfg.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
