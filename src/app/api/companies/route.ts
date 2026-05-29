import { NextRequest, NextResponse } from "next/server";
import { createCompany } from "@/lib/db";
import { createCompanyFolder } from "@/lib/drive";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const name: string = (body.name ?? "").toString().trim();
  const contactEmail: string = (body.contact_email ?? "").toString().trim();
  // Drive フォルダ名は企業名から自動生成（フォームから入力させない）
  const folderName = `請求書 / ${name}`;

  if (!name) {
    return NextResponse.json({ error: "企業名は必須です" }, { status: 400 });
  }
  if (contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
    return NextResponse.json(
      { error: "メールアドレスの形式が正しくありません" },
      { status: 400 },
    );
  }

  // ヒアリング結果: 「請求書の保存先フォルダを自動作成する機能は必要」→ YES
  // → 企業作成時に Drive のサブフォルダを自動作成
  const folderId = await createCompanyFolder(folderName).catch((e) => {
    console.error("[companies] drive folder create failed", e);
    return null;
  });
  const company = await createCompany({
    name,
    contact_email: contactEmail,
    drive_folder_name: folderName,
    drive_folder_id: folderId,
  });
  return NextResponse.json({ company });
}
