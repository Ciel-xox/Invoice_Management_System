#!/bin/bash
# アプリのビルド & 起動 / 再デプロイ時にも使う
# 使い方: cd ~/app && bash scripts/deploy.sh

set -e

APP_DIR="/home/ec2-user/app"
PORT=3100

cd "$APP_DIR"

echo "=== 最新コードを取得 ==="
git pull origin main

echo "=== 依存関係インストール ==="
npm ci

echo "=== Next.js ビルド ==="
npm run build

echo "=== PM2 で起動/再起動 ==="
if pm2 list | grep -q "invoice-app"; then
  pm2 restart invoice-app
else
  pm2 start npm --name "invoice-app" -- start
fi

pm2 save
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u ec2-user --hp /home/ec2-user

echo "=== nginx 設定を適用 ==="
sudo cp "$APP_DIR/scripts/nginx.conf" /etc/nginx/conf.d/app.conf
sudo nginx -t && sudo systemctl reload nginx
sudo systemctl enable nginx

echo ""
echo "=== 完了 ==="
pm2 status
