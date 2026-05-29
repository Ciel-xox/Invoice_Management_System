import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "請求書受注システム",
  description:
    "会社ごとに専用 URL を発行 → 請求書アップロード → Google Drive へ自動連携",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
