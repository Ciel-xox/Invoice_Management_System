# Invoice Management System

請求書アップロード URL 機能。会社ごとに専用 URL を発行 → 企業が請求書をアップロード → 指定の Google Drive へ自動連携。

## 機能（3 画面）

1. **`/admin`** — URL 発行・管理画面（社内向け）
2. **`/u/[token]`** — 請求書アップロード画面（企業向け、専用 URL）
3. **`/admin/monitor`** — 自動アップロード監視画面（社内向け）

## 技術スタック

- Next.js 15 (App Router) / React 19 / TypeScript / Tailwind
- DB: **Vercel Postgres (Neon)** — 本番。未設定時はローカル JSON にフォールバック（プレビュー用）。
- ファイル: **Vercel Blob** — 本番。未設定時はローカル `./uploads/` にフォールバック。
- Drive: **googleapis** — サービスアカウント方式。未設定時はモック（コンソールログ）。
- 通知: **Slack Incoming Webhook**。未設定時はモック。

## ローカルでの起動

```bash
npm install
npm run dev
# http://localhost:3000/admin
```

env を 1 つも設定しなくても、3 画面はフォールバックで動きます（データはローカル `./data/db.json` に保存され、ファイルは `./uploads/` に置かれます）。

## 本番デプロイ（Vercel）

1. Vercel に import
2. Storage → Postgres と Blob を連携（環境変数は自動で入る）
3. Google Cloud でサービスアカウントを作成、Drive の保存先フォルダをそのアカウントに共有
4. `GOOGLE_SERVICE_ACCOUNT_JSON` / `GOOGLE_DRIVE_PARENT_FOLDER_ID` / `SLACK_WEBHOOK_URL` を環境変数に追加

詳細は `.env.example` を参照。
