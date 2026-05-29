/**
 * ファイル一時保管層。
 *
 * - BLOB_READ_WRITE_TOKEN があれば Vercel Blob を使う（本番）。
 * - 未設定なら ./uploads/ に書き、 /api/blob-file/<id> 経由で配信する。
 */

import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

const USE_BLOB = !!process.env.BLOB_READ_WRITE_TOKEN;
const UPLOAD_DIR = path.join(process.cwd(), "uploads");

export type StoredBlob = {
  url: string; // ダウンロード可能 URL
  pathname: string; // 識別子
  size: number;
  contentType: string;
};

export async function putBlob(
  filename: string,
  file: Buffer,
  contentType: string,
): Promise<StoredBlob> {
  if (USE_BLOB) {
    const blob = await import("@vercel/blob");
    // ファイル名衝突回避のためランダムプレフィックス
    const key = `${crypto.randomBytes(6).toString("hex")}/${filename}`;
    const result = await blob.put(key, file, {
      access: "public",
      contentType,
      addRandomSuffix: false,
    });
    return {
      url: result.url,
      pathname: result.pathname,
      size: file.length,
      contentType,
    };
  }
  // ローカル fallback
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  const id = crypto.randomBytes(8).toString("hex");
  const safeName = filename.replace(/[^\w.\-ぁ-んァ-ヶ一-龯]/g, "_");
  const key = `${id}_${safeName}`;
  await fs.writeFile(path.join(UPLOAD_DIR, key), file);
  return {
    url: `/api/blob-file/${encodeURIComponent(key)}`,
    pathname: key,
    size: file.length,
    contentType,
  };
}

export async function readLocalBlob(key: string): Promise<Buffer | null> {
  try {
    return await fs.readFile(path.join(UPLOAD_DIR, key));
  } catch {
    return null;
  }
}
