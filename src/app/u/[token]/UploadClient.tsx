"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import type { Company } from "@/lib/types";

type Props = {
  company: Company;
  showDevNav: boolean;
  prefillEmail: string;
};

const ACCEPTED = ["application/pdf", "image/jpeg", "image/png"];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

export default function UploadClient({
  company,
  showDevNav,
  prefillEmail,
}: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState(prefillEmail);
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
  const [amount, setAmount] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  function pickFile(f: File | null) {
    setError(null);
    if (!f) return;
    if (!ACCEPTED.includes(f.type)) {
      setError("PDF / JPG / PNG のいずれかを選択してください");
      return;
    }
    if (f.size > MAX_SIZE) {
      setError("ファイルサイズは 10MB 以下にしてください");
      return;
    }
    setFile(f);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!file || !name.trim() || !email.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("uploader_name", name);
      fd.append("uploader_email", email);
      fd.append("invoice_month", month);
      fd.append("invoice_amount", amount.replace(/[^0-9]/g, ""));
      const res = await fetch(`/api/upload/${company.token}`, {
        method: "POST",
        body: fd,
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? "送信に失敗しました");
      }
      setDone(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "送信に失敗しました");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="bg-surface2 min-h-screen flex items-center justify-center px-4 relative">
        {showDevNav && <DevNavBar />}
        <div className="card px-10 py-12 max-w-lg w-full text-center">
          <div className="w-14 h-14 rounded-full bg-success-bg text-success flex items-center justify-center text-2xl mx-auto mb-4">
            ✓
          </div>
          <p className="text-lg font-medium">請求書を受領しました</p>
          <p className="text-sm text-ink-2 mt-2">
            {company.name} 様
            <br />
            ご担当者にて確認のうえ、必要に応じてご連絡いたします。
          </p>
          <button
            onClick={() => {
              setDone(false);
              setName("");
              setAmount("");
              setFile(null);
            }}
            className="btn mt-6"
          >
            続けて別の請求書を送信する
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface2 min-h-screen px-4 py-10 relative">
      {showDevNav && <DevNavBar />}
      <div className="card px-7 py-7 max-w-lg mx-auto">
        {/* ヘッダー */}
        <div className="flex items-center gap-3 pb-4 border-b border-line">
          <div className="w-10 h-10 rounded bg-info-bg text-info flex items-center justify-center text-xl">
            📄
          </div>
          <div>
            <p className="font-medium text-base m-0">請求書アップロード</p>
            <p className="text-[13px] text-ink-2 mt-0.5">
              {company.name} 御中
            </p>
          </div>
        </div>

        <p className="text-sm text-ink-2 mt-4 mb-5">
          下記フォームに必要事項をご入力のうえ、請求書ファイルをアップロードしてください。受領後、担当者にて確認いたします。
        </p>

        <form onSubmit={submit}>
          <div className="mb-4">
            <label className="label">
              ご担当者名 <span className="text-danger">*</span>
            </label>
            <input
              className="input"
              placeholder="山田 太郎"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="mb-4">
            <label className="label">
              メールアドレス <span className="text-danger">*</span>
            </label>
            <input
              className="input"
              type="email"
              placeholder="example@company.co.jp"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="flex gap-3 mb-5">
            <div className="flex-1">
              <label className="label">請求月</label>
              <input
                className="input"
                type="month"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
              />
            </div>
            <div className="flex-1">
              <label className="label">請求金額（税込）</label>
              <input
                className="input"
                inputMode="numeric"
                placeholder="¥ 0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
          </div>

          <label className="label">
            請求書ファイル <span className="text-danger">*</span>
          </label>
          <div
            onClick={() => fileInput.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              pickFile(e.dataTransfer.files?.[0] ?? null);
            }}
            className={`text-center px-4 py-7 rounded cursor-pointer transition ${
              dragging ? "bg-info-bg" : ""
            }`}
            style={{ border: "1.5px dashed rgba(0,0,0,.22)" }}
          >
            {file ? (
              <>
                <div className="text-2xl text-success">✓</div>
                <p className="text-sm mt-1.5 mb-0 font-medium">{file.name}</p>
                <p className="text-xs text-ink-3 mt-1">
                  {(file.size / 1024 / 1024).toFixed(2)} MB ・
                  <span className="text-info ml-1">別のファイルを選択</span>
                </p>
              </>
            ) : (
              <>
                <div className="text-3xl text-ink-3">⬆</div>
                <p className="text-sm mt-1.5 mb-0">
                  ファイルをドラッグ＆ドロップ
                </p>
                <p className="text-xs text-ink-3 m-0 mt-1">
                  または<span className="text-info">クリックして選択</span>
                  （PDF・JPG・PNG / 最大 10MB）
                </p>
              </>
            )}
            <input
              ref={fileInput}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              className="hidden"
              onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
            />
          </div>

          {error && (
            <p className="text-sm text-danger mt-3 text-center">{error}</p>
          )}

          <button
            type="submit"
            className="btn-primary w-full mt-6"
            style={{ height: 42, fontSize: 14 }}
            disabled={submitting || !file || !name.trim() || !email.trim()}
          >
            <span style={{ marginRight: 6 }}>✈</span>
            {submitting ? "送信中..." : "請求書を送信する"}
          </button>

          <p className="text-[11px] text-ink-3 text-center mt-3">
            🔒 このページは貴社専用の URL です。送信内容は暗号化されます。
          </p>
        </form>
      </div>
    </div>
  );
}

/**
 * 開発/プレビュー専用のナビバー。
 * 本番では「アップロード画面は外部企業に渡すページ」なので社内向け導線は出さない。
 * src/app/u/[token]/page.tsx で NODE_ENV を見て表示を制御している。
 */
function DevNavBar() {
  return (
    <div className="max-w-3xl mx-auto mb-4 flex items-center justify-between text-xs">
      <Link href="/" className="text-ink-3 hover:text-ink-2 no-underline">
        ← トップに戻る
      </Link>
      <span className="pill bg-warning/10 text-warning" style={{ background: "#fde9c8" }}>
        プレビューモード（本番では非表示）
      </span>
    </div>
  );
}
