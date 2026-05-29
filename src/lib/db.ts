/**
 * データアクセス層。
 *
 * - POSTGRES_URL が設定されていれば Vercel Postgres (Neon) を使う（本番）。
 * - 未設定なら ./data/db.json にフォールバック（ローカルプレビュー）。
 *
 * テーブル設計（要件書 5. に準拠）:
 *   companies(id, name, token, drive_folder_id, drive_folder_name, status, created_at)
 *   uploads(id, company_id, uploader_name, uploader_email, invoice_month,
 *           invoice_amount, filename, blob_url, drive_file_id, drive_file_url,
 *           status, note, created_at)
 */

import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import type { Company, Upload, UploadStatus } from "./types";

const USE_POSTGRES = !!process.env.POSTGRES_URL;
const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "db.json");

type DBShape = {
  companies: Company[];
  uploads: Upload[];
};

// ---------- ローカル JSON 実装（プレビュー用） ----------

async function readLocal(): Promise<DBShape> {
  try {
    const raw = await fs.readFile(DATA_FILE, "utf8");
    return JSON.parse(raw);
  } catch {
    return { companies: [], uploads: [] };
  }
}

async function writeLocal(data: DBShape): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2), "utf8");
}

// ---------- Postgres 実装（本番） ----------

async function getSql() {
  // 動的 import: 依存をローカル fallback でも壊さないため
  const mod = await import("@vercel/postgres");
  return mod.sql;
}

async function ensurePostgresSchema() {
  const sql = await getSql();
  await sql`
    CREATE TABLE IF NOT EXISTS companies (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      token TEXT NOT NULL UNIQUE,
      drive_folder_id TEXT,
      drive_folder_name TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS uploads (
      id TEXT PRIMARY KEY,
      company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
      uploader_name TEXT NOT NULL,
      uploader_email TEXT NOT NULL,
      invoice_month TEXT,
      invoice_amount BIGINT,
      filename TEXT NOT NULL,
      blob_url TEXT NOT NULL,
      drive_file_id TEXT,
      drive_file_url TEXT,
      status TEXT NOT NULL,
      note TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;
}

// ---------- 共通 API ----------

export function newId(): string {
  return crypto.randomUUID();
}

/**
 * 要件書 5: URL用トークンは連番不可、推測されにくいランダム16文字以上。
 */
export function newToken(): string {
  // 16 byte = 22 文字（URL safe）
  return crypto.randomBytes(16).toString("base64url");
}

export async function listCompanies(): Promise<Company[]> {
  if (USE_POSTGRES) {
    await ensurePostgresSchema();
    const sql = await getSql();
    const r = await sql<Company>`SELECT * FROM companies ORDER BY created_at DESC`;
    return r.rows;
  }
  const db = await readLocal();
  return [...db.companies].sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export async function getCompanyByToken(token: string): Promise<Company | null> {
  if (USE_POSTGRES) {
    await ensurePostgresSchema();
    const sql = await getSql();
    const r = await sql<Company>`SELECT * FROM companies WHERE token = ${token} LIMIT 1`;
    return r.rows[0] ?? null;
  }
  const db = await readLocal();
  return db.companies.find((c) => c.token === token) ?? null;
}

export async function createCompany(input: {
  name: string;
  drive_folder_name: string;
  drive_folder_id: string | null;
}): Promise<Company> {
  const company: Company = {
    id: newId(),
    name: input.name,
    token: newToken(),
    drive_folder_id: input.drive_folder_id,
    drive_folder_name: input.drive_folder_name,
    status: "active",
    created_at: new Date().toISOString(),
  };
  if (USE_POSTGRES) {
    await ensurePostgresSchema();
    const sql = await getSql();
    await sql`
      INSERT INTO companies
        (id, name, token, drive_folder_id, drive_folder_name, status, created_at)
      VALUES
        (${company.id}, ${company.name}, ${company.token}, ${company.drive_folder_id},
         ${company.drive_folder_name}, ${company.status}, ${company.created_at})
    `;
    return company;
  }
  const db = await readLocal();
  db.companies.push(company);
  await writeLocal(db);
  return company;
}

export async function toggleCompanyStatus(id: string): Promise<Company | null> {
  if (USE_POSTGRES) {
    const sql = await getSql();
    const r = await sql<Company>`
      UPDATE companies
      SET status = CASE WHEN status = 'active' THEN 'disabled' ELSE 'active' END
      WHERE id = ${id}
      RETURNING *
    `;
    return r.rows[0] ?? null;
  }
  const db = await readLocal();
  const c = db.companies.find((c) => c.id === id);
  if (!c) return null;
  c.status = c.status === "active" ? "disabled" : "active";
  await writeLocal(db);
  return c;
}

export async function createUpload(input: {
  company_id: string;
  uploader_name: string;
  uploader_email: string;
  invoice_month: string | null;
  invoice_amount: number | null;
  filename: string;
  blob_url: string;
  status: UploadStatus;
}): Promise<Upload> {
  const companies = await listCompanies();
  const company = companies.find((c) => c.id === input.company_id);
  const upload: Upload = {
    id: newId(),
    company_id: input.company_id,
    company_name: company?.name ?? "",
    uploader_name: input.uploader_name,
    uploader_email: input.uploader_email,
    invoice_month: input.invoice_month,
    invoice_amount: input.invoice_amount,
    filename: input.filename,
    blob_url: input.blob_url,
    drive_file_id: null,
    drive_file_url: null,
    status: input.status,
    note: null,
    created_at: new Date().toISOString(),
  };
  if (USE_POSTGRES) {
    const sql = await getSql();
    await sql`
      INSERT INTO uploads
        (id, company_id, uploader_name, uploader_email, invoice_month, invoice_amount,
         filename, blob_url, drive_file_id, drive_file_url, status, note, created_at)
      VALUES
        (${upload.id}, ${upload.company_id}, ${upload.uploader_name}, ${upload.uploader_email},
         ${upload.invoice_month}, ${upload.invoice_amount}, ${upload.filename},
         ${upload.blob_url}, ${upload.drive_file_id}, ${upload.drive_file_url},
         ${upload.status}, ${upload.note}, ${upload.created_at})
    `;
    return upload;
  }
  const db = await readLocal();
  db.uploads.push(upload);
  await writeLocal(db);
  return upload;
}

export async function updateUpload(
  id: string,
  patch: Partial<Pick<Upload, "status" | "drive_file_id" | "drive_file_url" | "note">>,
): Promise<Upload | null> {
  if (USE_POSTGRES) {
    const sql = await getSql();
    const r = await sql<Upload>`
      UPDATE uploads
      SET status = COALESCE(${patch.status ?? null}, status),
          drive_file_id = COALESCE(${patch.drive_file_id ?? null}, drive_file_id),
          drive_file_url = COALESCE(${patch.drive_file_url ?? null}, drive_file_url),
          note = COALESCE(${patch.note ?? null}, note)
      WHERE id = ${id}
      RETURNING *
    `;
    return r.rows[0] ?? null;
  }
  const db = await readLocal();
  const u = db.uploads.find((u) => u.id === id);
  if (!u) return null;
  Object.assign(u, patch);
  await writeLocal(db);
  return u;
}

export async function listUploads(limit = 50): Promise<Upload[]> {
  if (USE_POSTGRES) {
    await ensurePostgresSchema();
    const sql = await getSql();
    const r = await sql<Upload>`
      SELECT u.*, c.name AS company_name
      FROM uploads u
      LEFT JOIN companies c ON c.id = u.company_id
      ORDER BY u.created_at DESC
      LIMIT ${limit}
    `;
    return r.rows;
  }
  const db = await readLocal();
  return [...db.uploads]
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, limit);
}

export async function dailyStats(): Promise<{
  total_today: number;
  drive_done_today: number;
  pending_today: number;
}> {
  const all = await listUploads(500);
  const today = new Date().toISOString().slice(0, 10);
  const todays = all.filter((u) => u.created_at.startsWith(today));
  return {
    total_today: todays.length,
    drive_done_today: todays.filter((u) => u.status === "done").length,
    pending_today: todays.filter((u) => u.status === "uploading" || u.status === "review").length,
  };
}

/** デモ用シード（companies が空の時だけ実行） */
export async function seedIfEmpty(): Promise<void> {
  const companies = await listCompanies();
  if (companies.length > 0) return;
  await createCompany({
    name: "株式会社サンプル",
    drive_folder_name: "請求書 / サンプル",
    drive_folder_id: null,
  });
  await createCompany({
    name: "テスト商事株式会社",
    drive_folder_name: "請求書 / テスト商事",
    drive_folder_id: null,
  });
  await createCompany({
    name: "山田工業",
    drive_folder_name: "請求書 / 山田工業",
    drive_folder_id: null,
  });
}
