#!/bin/bash
# EC2 (Amazon Linux 2023) 初回セットアップスクリプト
# 使い方: SSH でログイン後に bash setup-ec2.sh を実行

set -e

REPO_URL="https://github.com/SHIP-inc/hackathon_team_1.git"
APP_DIR="/home/ec2-user/app"
PORT=3100

echo "=== 1. パッケージ更新 ==="
sudo dnf update -y

echo "=== 2. Node.js 20 インストール ==="
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo dnf install -y nodejs git

echo "=== 3. PM2 インストール ==="
sudo npm install -g pm2

echo "=== 4. nginx インストール ==="
sudo dnf install -y nginx

echo "=== 5. アプリ取得 ==="
git clone "$REPO_URL" "$APP_DIR"
cd "$APP_DIR"
npm ci

echo "=== 6. データ/アップロードディレクトリ作成 ==="
mkdir -p "$APP_DIR/data" "$APP_DIR/uploads"

echo "=== 7. 環境変数ファイルを作成（後で編集してください） ==="
cat > "$APP_DIR/.env.local" << 'EOF'
# Google Drive サービスアカウント JSON（1行）
GOOGLE_SERVICE_ACCOUNT_JSON=

# Drive 保存先フォルダ ID
GOOGLE_DRIVE_PARENT_FOLDER_ID=

# Slack 通知
SLACK_WEBHOOK_URL=

# このサーバーの公開 URL（EC2 のパブリック IP に合わせて変更）
NEXT_PUBLIC_APP_URL=http://YOUR_EC2_PUBLIC_IP
EOF

echo ""
echo ">>> .env.local を編集してください: nano $APP_DIR/.env.local"
echo ">>> 編集後に deploy.sh を実行してください"
