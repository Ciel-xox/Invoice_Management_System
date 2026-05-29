import { NextRequest, NextResponse } from "next/server";
import {
  createUpload,
  getCompanyByToken,
  updateUpload,
} from "@/lib/db";
import { putBlob } from "@/lib/storage";
import { uploadInvoice } from "@/lib/drive";
import { notifySlack } from "@/lib/slack";

const ACCEPTED = new Set(["application/pdf", "image/jpeg", "image/png"]);
const MAX = 10 * 1024 * 1024;

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const company = await getCompanyByToken(token);
  if (!company || company.status !== "active") {
    return NextResponse.json(
      { error: "URL が無効です" },
      { status: 404 },
    );
  }

  const fd = await req.formData();
  const file = fd.get("file");
  const uploaderName = (fd.get("uploader_name") ?? "").toString().trim();
  // アップロード担当者のメールアドレス（毎回入力してもらう）
  // 企業マスタの contact_email は URL 発行時の紐付け用で、ここでは使わない
  const uploaderEmail = (fd.get("uploader_email") ?? "").toString().trim();
  const invoiceMonth = (fd.get("invoice_month") ?? "").toString() || null;
  const amtRaw = (fd.get("invoice_amount") ?? "").toString();
  const invoiceAmount = amtRaw ? Number(amtRaw) : null;

  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: "ファイルが添付されていません" },
      { status: 400 },
    );
  }
  if (!uploaderName || !uploaderEmail) {
    return NextResponse.json(
      { error: "担当者名とメールアドレスは必須です" },
      { status: 400 },
    );
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(uploaderEmail)) {
    return NextResponse.json(
      { error: "メールアドレスの形式が正しくありません" },
      { status: 400 },
    );
  }
  if (!ACCEPTED.has(file.type)) {
    return NextResponse.json(
      { error: "PDF / JPG / PNG のみ対応しています" },
      { status: 400 },
    );
  }
  if (file.size > MAX) {
    return NextResponse.json(
      { error: "ファイルサイズは 10MB 以下にしてください" },
      { status: 400 },
    );
  }

  const buf = Buffer.from(await file.arrayBuffer());

  // 1. 一時保管（Vercel Blob または ローカル）
  const blob = await putBlob(file.name, buf, file.type);

  // 2. DB に「アップロード中」として記録
  const record = await createUpload({
    company_id: company.id,
    uploader_name: uploaderName,
    uploader_email: uploaderEmail,
    invoice_month: invoiceMonth,
    invoice_amount: invoiceAmount,
    filename: file.name,
    blob_url: blob.url,
    status: "uploading",
  });

  // 3. Google Drive に転送（バックグラウンド扱い）
  let driveStatus: "done" | "review" = "review";
  let driveUrl: string | null = null;
  try {
    const drive = await uploadInvoice({
      folderId: company.drive_folder_id,
      filename: file.name,
      contentType: file.type,
      data: buf,
    });
    driveStatus = "done";
    driveUrl = drive?.webViewLink ?? null;
    await updateUpload(record.id, {
      status: "done",
      drive_file_id: drive?.fileId ?? null,
      drive_file_url: drive?.webViewLink ?? null,
    });
  } catch (e) {
    console.error("[upload] drive transfer failed", e);
    await updateUpload(record.id, { status: "review" });
  }

  // 4. Slack 通知（backoffice 宛）
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL?.trim() || `http://localhost:3100`;
  const monitorUrl = `${baseUrl}/admin/monitor`;
  const fields = [
    {
      label: "担当者",
      value: uploaderEmail
        ? `${uploaderName} <${uploaderEmail}>`
        : uploaderName,
    },
    { label: "請求月", value: invoiceMonth ?? "—" },
    {
      label: "金額",
      value:
        invoiceAmount != null ? `¥${invoiceAmount.toLocaleString()}` : "—",
    },
    { label: "ファイル", value: file.name },
    {
      label: "Drive 連携",
      value:
        driveStatus === "done" && driveUrl
          ? `✓ <${driveUrl}|Drive で開く>`
          : driveStatus === "done"
            ? "✓ ローカル保存（Drive 未連携）"
            : "⚠ 要確認（Drive 転送失敗）",
    },
  ];
  notifySlack({
    title: "請求書を受領しました",
    body: `*${company.name}* から請求書が届きました。`,
    fields,
    url: monitorUrl,
  }).catch(() => {});

  return NextResponse.json({ ok: true, upload_id: record.id });
}
