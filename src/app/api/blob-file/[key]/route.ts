/**
 * ローカル fallback 用ファイル配信。
 * Vercel Blob を使う本番では使われない（Blob URL から直接配信される）。
 */
import { NextRequest, NextResponse } from "next/server";
import { readLocalBlob } from "@/lib/storage";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ key: string }> },
) {
  const { key } = await params;
  const data = await readLocalBlob(decodeURIComponent(key));
  if (!data) return new NextResponse("not found", { status: 404 });
  const ext = key.split(".").pop()?.toLowerCase();
  const type =
    ext === "pdf"
      ? "application/pdf"
      : ext === "png"
        ? "image/png"
        : ext === "jpg" || ext === "jpeg"
          ? "image/jpeg"
          : "application/octet-stream";
  return new NextResponse(new Uint8Array(data), {
    headers: { "Content-Type": type },
  });
}
