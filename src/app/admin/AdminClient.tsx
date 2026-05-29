"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Company } from "@/lib/types";

type Props = {
  companies: Company[];
  baseUrl: string;
};

export default function AdminClient({ companies, baseUrl }: Props) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function issueUrl(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/companies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          contact_email: email.trim(),
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? "発行に失敗しました");
      }
      const { company } = await res.json();
      setName("");
      setEmail("");
      // 発行直後にそのまま該当企業のアップロード画面へ遷移。
      // ?prefilled=1 を付けて、メアド欄に contact_email をプリフィルさせる。
      router.push(`/u/${company.token}?prefilled=1`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "発行に失敗しました");
    } finally {
      setSubmitting(false);
    }
  }

  async function toggle(id: string) {
    await fetch(`/api/companies/${id}/toggle`, { method: "POST" });
    router.refresh();
  }

  async function copyUrl(c: Company) {
    const url = `${baseUrl}/u/${c.token}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(c.id);
      setTimeout(() => setCopiedId(null), 1500);
    } catch {}
  }

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
        1. URL 発行・管理画面（会社ごとに専用 URL を発行）
      </span>

      <div className="flex items-center justify-between mb-5 mt-3">
        <div>
          <p className="text-lg font-medium m-0">アップロード URL 管理</p>
          <p className="text-[13px] text-ink-2 mt-0.5">
            企業ごとに専用 URL を発行・管理します
          </p>
        </div>
      </div>

      {/* 新規発行フォーム */}
      <form onSubmit={issueUrl} className="card px-6 py-5 mb-5">
        <p className="text-[13px] font-medium mb-3 text-ink-2">＋ 新規 URL を発行</p>
        <div className="flex gap-3 items-end flex-wrap">
          <div className="flex-[2] min-w-[160px]">
            <label className="text-xs text-ink-2 block mb-1.5">企業名</label>
            <input
              className="input"
              placeholder="株式会社サンプル"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="flex-[2] min-w-[160px]">
            <label className="text-xs text-ink-2 block mb-1.5">
              担当者メールアドレス
            </label>
            <input
              className="input"
              type="email"
              placeholder="keiri@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <button
            type="submit"
            className="btn-primary whitespace-nowrap"
            disabled={submitting || !name.trim()}
          >
            {submitting ? "発行中..." : "発行する"}
          </button>
        </div>
        {error && (
          <p className="text-xs text-danger mt-2">{error}</p>
        )}
        <p className="text-xs text-ink-3 mt-2">
          発行すると、その企業の請求書アップロード画面に遷移します。Drive
          フォルダは企業名から自動作成されます。
        </p>
      </form>

      {/* 一覧 */}
      <div className="card overflow-hidden">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="bg-surface2 text-ink-2">
              <th className="text-left px-3.5 py-2.5 font-medium w-[30%]">
                企業名
              </th>
              <th className="text-left px-3.5 py-2.5 font-medium w-[40%]">
                専用 URL
              </th>
              <th className="text-center px-3.5 py-2.5 font-medium w-[14%]">
                状態
              </th>
              <th className="text-center px-3.5 py-2.5 font-medium w-[16%]">
                操作
              </th>
            </tr>
          </thead>
          <tbody>
            {companies.length === 0 && (
              <tr>
                <td
                  colSpan={4}
                  className="text-center text-ink-3 py-8 border-t border-line"
                >
                  まだ URL は発行されていません
                </td>
              </tr>
            )}
            {companies.map((c) => {
              const url = `${baseUrl}/u/${c.token}`;
              const shortUrl = url.replace(/^https?:\/\//, "");
              return (
                <tr key={c.id}>
                  <td className="px-3.5 py-3 border-t border-line">
                    <p className="font-medium m-0">{c.name}</p>
                    {c.contact_email && (
                      <p className="text-xs text-ink-3 mt-0.5">
                        {c.contact_email}
                      </p>
                    )}
                  </td>
                  <td className="px-3.5 py-3 border-t border-line">
                    <span className="mono">{shortUrl}</span>
                  </td>
                  <td className="px-3.5 py-3 border-t border-line text-center">
                    {c.status === "active" ? (
                      <span className="pill bg-success-bg text-success">
                        有効
                      </span>
                    ) : (
                      <span className="pill bg-surface2 text-ink-3">停止中</span>
                    )}
                  </td>
                  <td className="px-3.5 py-3 border-t border-line text-center">
                    <button
                      onClick={() => copyUrl(c)}
                      className="text-ink-3 hover:text-info text-sm mr-2"
                      title="URL をコピー"
                    >
                      {copiedId === c.id ? "✓" : "⧉"}
                    </button>
                    <Link
                      href={`/u/${c.token}`}
                      target="_blank"
                      className="text-ink-3 hover:text-info text-sm mr-2 no-underline"
                      title="プレビュー"
                    >
                      ↗
                    </Link>
                    <button
                      onClick={() => toggle(c.id)}
                      className="text-ink-3 hover:text-warning text-sm"
                      title={c.status === "active" ? "停止する" : "再開する"}
                    >
                      {c.status === "active" ? "⏸" : "▶"}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
