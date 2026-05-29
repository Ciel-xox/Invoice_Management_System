# Google Drive 連携セットアップ（Service Account + Shared Drive 方式）

> Workspace の Shared Drive を使うことで、サービスアカウントから容量制限なく自動アップロードできる。個人 Gmail の My Drive で発生した "Service Accounts do not have storage quota" エラーを回避するため、本構成を採用。

所要時間：10〜15 分

---

## 0. ブラウザを Workspace アカウントに切り替え

これから操作する Google Cloud Console と Google Drive は、**すべて Workspace アカウントでログイン中**であることを確認してください。複数アカウントを使い分けている場合、画面右上のアバターから切り替えできます。

## 1. Workspace 配下に Cloud プロジェクトを作る

1. https://console.cloud.google.com/ を開く（Workspace アカウントで）
2. 画面上部のプロジェクトピッカー → **「新しいプロジェクト」**
3. **組織**: Workspace の組織を選択（個人 Gmail のときと違って組織が選べる）
4. 名前: `invoice-system`（何でも可）→ 作成
5. プロジェクトが切り替わったことを確認

## 2. Google Drive API を有効化

1. 左メニュー → **「API とサービス」 → 「ライブラリ」**
2. 検索 → **「Google Drive API」** → **「有効にする」**

## 3. サービスアカウントを作る

1. 左メニュー → **「IAM と管理」 → 「サービス アカウント」**
2. **「+ サービス アカウントを作成」**
3. 名前: `invoice-uploader`（何でも可）→ **作成して続行**
4. ロール選択は **スキップ** → **完了**

## 4. JSON 鍵を発行

1. 作成したサービスアカウントをクリック
2. タブ **「キー」** → **「鍵を追加」 → 「新しい鍵を作成」**
3. 形式: **JSON** → **作成**
4. ファイルがダウンロードされる（**これが秘密鍵**、再発行不可）
5. **サービスアカウントのメールアドレスを控える**
   形式: `invoice-uploader@<project-id>.iam.gserviceaccount.com`

## 5. Shared Drive にサービスアカウントを追加

1. https://drive.google.com/ を開く（Workspace アカウントで）
2. 左メニューから対象の **共有ドライブ** を開く
3. 上部の共有ドライブ名の右にある **「⏷ → メンバーを管理」** をクリック
4. **手順 4-5 で控えた SA メールアドレス** を入力
5. 権限: **「コンテンツ管理者」** （投稿者でも動作するがフォルダ削除等もしたい場合は管理者）
6. **「通知を送信しない」** にチェック → **送信**

## 6. Shared Drive の ID を取得

Shared Drive を開いた時の URL から:
```
https://drive.google.com/drive/folders/0AB1cDeF2gHiJ3kLmNoP
                                       ^^^^^^^^^^^^^^^^^^^^^
                                       これがフォルダ ID
```

サブフォルダを使いたい場合（例: Shared Drive 配下の「請求書」フォルダ）は、そのサブフォルダを開いた時の URL の末尾を使ってください。

## 7. 私（Claude）に渡す

次のメッセージで以下 2 点をください：

1. **Shared Drive の ID** （または使いたいサブフォルダの ID）
2. **JSON 鍵ファイルのパス** （例: `/Users/yasubamomoka/Downloads/invoice-system-xxxxxxxx.json`）
   または **JSON の中身を直接貼り付け**

私が `.env.local` にセット → dev サーバー再起動 → 動作確認まで通します。

---

## 動作確認シナリオ

セットアップ完了後、私が下記を実施して結果を報告します:

1. `/admin` で新規企業を発行 → Shared Drive 上に「請求書 / 〇〇株式会社」フォルダが自動作成される
2. 発行された URL で請求書 PDF を 1 件アップ → そのフォルダ内にファイルが置かれる
3. 監視画面のラベルが「✓ Drive 保存済み」に変わり、ファイル名クリックで Drive が開く

---

## トラブルシューティング

| 症状 | 原因 | 対処 |
|---|---|---|
| `File not found: <folder_id>` | サービスアカウントが Shared Drive のメンバーでない | 手順 5 を実行 |
| `The user has not granted the app ...` | OAuth スコープ不足（旧コードが残っている） | drive.ts が最新版（Service Account 方式）か確認 |
| `Storage quota exceeded` | Shared Drive ではなく My Drive のフォルダを指している | URL を確認、ID が共有ドライブ配下か確認 |
| `Google Drive API has not been used` | 手順 2 の API 有効化忘れ | 新プロジェクトでも個別に有効化が必要 |
