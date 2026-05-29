/**
 * Google Drive 連携。
 *
 * 本番では GOOGLE_SERVICE_ACCOUNT_JSON (サービスアカウントの JSON 鍵) と
 * GOOGLE_DRIVE_PARENT_FOLDER_ID を設定する。サービスアカウントに対して
 * 親フォルダを「編集者」として共有しておく必要がある。
 *
 * - 企業を作成するとき、その企業専用のサブフォルダを自動で作る（要件 8-1）。
 * - 請求書を受領するとき、そのフォルダにファイルをアップロードする。
 *
 * env が無いプレビュー環境では mock として動き、コンソールにログだけ出す。
 */

import { Readable } from "node:stream";

const SERVICE_ACCOUNT_JSON = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
const PARENT_FOLDER_ID = process.env.GOOGLE_DRIVE_PARENT_FOLDER_ID;
const ENABLED = !!(SERVICE_ACCOUNT_JSON && PARENT_FOLDER_ID);

async function getDriveClient() {
  const { google } = await import("googleapis");
  const credentials = JSON.parse(SERVICE_ACCOUNT_JSON!);
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/drive"],
  });
  return google.drive({ version: "v3", auth });
}

/**
 * 企業ごとの専用フォルダを親フォルダ配下に作成する。
 * 返り値は Drive 上のフォルダ ID。
 */
export async function createCompanyFolder(companyName: string): Promise<string | null> {
  if (!ENABLED) {
    console.log("[drive:mock] createCompanyFolder", { companyName });
    return null;
  }
  const drive = await getDriveClient();
  const res = await drive.files.create({
    requestBody: {
      name: companyName,
      mimeType: "application/vnd.google-apps.folder",
      parents: [PARENT_FOLDER_ID!],
    },
    fields: "id",
  });
  return res.data.id ?? null;
}

/**
 * 指定フォルダにファイルをアップロードする。
 * folderId が null なら親フォルダ直下にアップ。
 */
export async function uploadInvoice(input: {
  folderId: string | null;
  filename: string;
  contentType: string;
  data: Buffer;
}): Promise<{ fileId: string; webViewLink: string } | null> {
  if (!ENABLED) {
    console.log("[drive:mock] uploadInvoice", {
      folderId: input.folderId,
      filename: input.filename,
      size: input.data.length,
    });
    return null;
  }
  const drive = await getDriveClient();
  const parents = input.folderId ? [input.folderId] : [PARENT_FOLDER_ID!];
  const res = await drive.files.create({
    requestBody: {
      name: input.filename,
      parents,
    },
    media: {
      mimeType: input.contentType,
      body: Readable.from(input.data),
    },
    fields: "id, webViewLink",
  });
  return {
    fileId: res.data.id ?? "",
    webViewLink: res.data.webViewLink ?? "",
  };
}

export const driveEnabled = ENABLED;
