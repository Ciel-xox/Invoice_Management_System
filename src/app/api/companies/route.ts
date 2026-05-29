import { NextRequest, NextResponse } from "next/server";
import { createCompany } from "@/lib/db";
import { createCompanyFolder } from "@/lib/drive";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const name: string = (body.name ?? "").toString().trim();
  const folderName: string = (
    body.drive_folder_name ?? `請求書 / ${name}`
  )
    .toString()
    .trim();
  if (!name) {
    return NextResponse.json({ error: "企業名は必須です" }, { status: 400 });
  }
  // ヒアリング結果: 「請求書の保存先フォルダを自動作成する機能は必要」→ YES
  // → 企業作成時に Drive のサブフォルダを自動作成
  const folderId = await createCompanyFolder(folderName).catch((e) => {
    console.error("[companies] drive folder create failed", e);
    return null;
  });
  const company = await createCompany({
    name,
    drive_folder_name: folderName,
    drive_folder_id: folderId,
  });
  return NextResponse.json({ company });
}
