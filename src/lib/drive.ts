/**
 * Google Drive 連携（Service Account + Shared Drive 方式）。
 *
 * Workspace の Shared Drive を使うと、サービスアカウントでも容量制限なく
 * 自動アップロードが可能（My Drive と違い Shared Drive 自体がクォータを持つ）。
 *
 * 必要な env (.env.local):
 *   GOOGLE_SERVICE_ACCOUNT_JSON     ← Workspace 配下の SA JSON（1 行）
 *   GOOGLE_DRIVE_PARENT_FOLDER_ID   ← Shared Drive の ID または配下フォルダの ID
 *
 * Shared Drive の場合は files.create / files.get に
 *   supportsAllDrives: true
 * を付ける必要がある。
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
export async function createCompanyFolder(
  companyName: string,
): Promise<string | null> {
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
    supportsAllDrives: true, // Shared Drive 対応
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
    supportsAllDrives: true, // Shared Drive 対応
  });
  return {
    fileId: res.data.id ?? "",
    webViewLink: res.data.webViewLink ?? "",
  };
}

export const driveEnabled = ENABLED;
